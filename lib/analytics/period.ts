import { periodInputSchema, type PeriodInput } from './contracts';

export const ANALYTICS_TIMEZONE = 'Europe/Kyiv' as const;

type LocalDate = { year: number; month: number; day: number };

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function zonedParts(date: Date) {
  const values = Object.fromEntries(partsFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function localMidnightToUtc(date: LocalDate): Date {
  const desired = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
  let candidate = desired;
  for (let i = 0; i < 4; i += 1) {
    const actual = zonedParts(new Date(candidate));
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const delta = desired - represented;
    if (delta === 0) break;
    candidate += delta;
  }
  return new Date(candidate);
}

function shiftLocalDays(date: LocalDate, days: number): LocalDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function localMonthStart(date: LocalDate, monthDelta = 0): LocalDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1 + monthDelta, 1, 12));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: 1 };
}

function parseLocalDate(value: string): LocalDate {
  const [year, month, day] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return { year, month, day };
}

export type ResolvedPeriod = {
  timezone: typeof ANALYTICS_TIMEZONE;
  from: Date;
  to: Date;
  comparisonFrom: Date;
  comparisonTo: Date;
  currentDurationMs: number;
  comparisonDurationMs: number;
};

export function resolvePeriod(rawInput: PeriodInput | unknown, now = new Date()): ResolvedPeriod {
  const input = periodInputSchema.parse(rawInput);
  const currentLocal = zonedParts(now);
  const today: LocalDate = { year: currentLocal.year, month: currentLocal.month, day: currentLocal.day };

  let from: Date;
  let to: Date;

  switch (input.preset) {
    case 'today':
      from = localMidnightToUtc(today);
      to = localMidnightToUtc(shiftLocalDays(today, 1));
      break;
    case 'last7':
      from = localMidnightToUtc(shiftLocalDays(today, -6));
      to = localMidnightToUtc(shiftLocalDays(today, 1));
      break;
    case 'last30':
      from = localMidnightToUtc(shiftLocalDays(today, -29));
      to = localMidnightToUtc(shiftLocalDays(today, 1));
      break;
    case 'currentMonth':
      from = localMidnightToUtc(localMonthStart(today));
      to = localMidnightToUtc(localMonthStart(today, 1));
      break;
    case 'previousMonth':
      from = localMidnightToUtc(localMonthStart(today, -1));
      to = localMidnightToUtc(localMonthStart(today));
      break;
    case 'custom': {
      const customFrom = parseLocalDate(input.from!);
      const customTo = parseLocalDate(input.to!);
      from = localMidnightToUtc(customFrom);
      to = localMidnightToUtc(shiftLocalDays(customTo, 1));
      if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
        throw new Error('Custom analytics range cannot exceed 366 days');
      }
      break;
    }
  }

  const duration = to.getTime() - from.getTime();
  const comparisonTo = new Date(from);
  const comparisonFrom = new Date(from.getTime() - duration);

  return {
    timezone: ANALYTICS_TIMEZONE,
    from,
    to,
    comparisonFrom,
    comparisonTo,
    currentDurationMs: duration,
    comparisonDurationMs: duration,
  };
}
