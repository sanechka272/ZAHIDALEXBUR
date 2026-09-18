export const UA_PHONE_PREFIX = '+38';
export const UA_PHONE_PATTERN = /^\+380\d{9}$/;

export function normalizeUaPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits || digits === '3') return UA_PHONE_PREFIX;

  if (digits.startsWith('38')) {
    let national = digits.slice(2);
    if (!national) return UA_PHONE_PREFIX;
    if (!national.startsWith('0')) national = `0${national}`;
    return `${UA_PHONE_PREFIX}${national.slice(0, 10)}`;
  }

  if (digits.startsWith('0')) {
    return `${UA_PHONE_PREFIX}${digits.slice(0, 10)}`;
  }

  return `${UA_PHONE_PREFIX}0${digits.slice(0, 9)}`;
}

export function isValidUaPhone(value: string) {
  return UA_PHONE_PATTERN.test(value.trim());
}
