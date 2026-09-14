export type CsvValue = string | number | boolean | null | undefined | Date;

function csvCell(value: CsvValue) {
  if (value === null || value === undefined) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

export function toCsv(rows: CsvValue[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function csvResponse(filename: string, rows: CsvValue[][]) {
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename.replaceAll('"', '')}"`,
      'cache-control': 'no-store',
    },
  });
}
