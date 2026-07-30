import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Validates a phone number against real per-country E.164 rules (length,
 * numbering plan) rather than just counting digits — a generic 8-15 digit
 * check accepts numbers no carrier would ever issue (e.g. a 7-digit Nigerian
 * subscriber number). The backend rejects anything this returns false for,
 * so this must stay a superset match of the backend's E.164 validation.
 */
export function isValidE164Phone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return false;

  const phoneNumber = parsePhoneNumberFromString(trimmed);
  return Boolean(phoneNumber?.isValid());
}

/** Converts a valid phone number to its canonical E.164 form (e.g. "+2348012345678"). */
export function toE164(value: string): string | undefined {
  const phoneNumber = parsePhoneNumberFromString(value.trim());
  return phoneNumber?.isValid() ? phoneNumber.number : undefined;
}
