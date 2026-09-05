/**
 * Phone Number Normalization and Formatting Utilities
 * Academia de Aduanas (Honduras & International)
 */

/**
 * Normalizes any phone number into standard international E.164 format (+<country><number>)
 * Default local fallback is Honduras (+504) for 8-digit numbers.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';

  // Clean all whitespace, dashes, parentheses, dots
  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return '';

  // 1. If starts with '+' in raw input, preserve it with its digits
  if (trimmed.startsWith('+')) {
    // If it's +504 followed by 8 digits
    if (digitsOnly.startsWith('504') && digitsOnly.length === 11) {
      return `+${digitsOnly}`;
    }
    // Any other international number
    return `+${digitsOnly}`;
  }

  // 2. Honduras numbers without '+':
  // 8-digit local mobile or landline (e.g. 99887766, 88776655, 22395000)
  if (digitsOnly.length === 8) {
    return `+504${digitsOnly}`;
  }

  // 11 digits starting with 504 (e.g. 50499887766)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('504')) {
    return `+${digitsOnly}`;
  }

  // 3. WhatsApp wa_id format (often just raw digits with country code)
  // e.g. "50499887766" or "14155552671"
  return `+${digitsOnly}`;
}

/**
 * Formats an E.164 phone number for clean UI presentation
 * e.g. +50499887766 -> +504 9988-7766
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  const normalized = normalizePhoneNumber(phone);

  // If Honduras number: +504XXXXXXXX
  if (normalized.startsWith('+504') && normalized.length === 12) {
    const local = normalized.slice(4);
    return `+504 ${local.slice(0, 4)}-${local.slice(4)}`;
  }

  // US/Canada: +1XXXXXXXXXX
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const local = normalized.slice(2);
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return normalized;
}

/**
 * Checks if two phone numbers represent the same phone identity
 */
export function arePhonesEquivalent(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (normA === normB) return true;

  // Compare trailing 8 digits for local matching if Honduras
  const digitsA = phoneA.replace(/\D/g, '');
  const digitsB = phoneB.replace(/\D/g, '');
  if (digitsA.length >= 8 && digitsB.length >= 8) {
    return digitsA.slice(-8) === digitsB.slice(-8);
  }

  return false;
}
