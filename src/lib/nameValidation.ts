/**
 * Shared full-name validation used across every form that collects a
 * traveler / customer / account name (Profile, Auth, Contact, apply
 * wizard, tourism booking).
 *
 * Rules: trimmed length between 3 and 100 characters, no digits.
 */
import { z } from 'zod';

export const FULL_NAME_MIN = 3;
export const FULL_NAME_MAX = 100;

const containsDigit = (value: string): boolean => /\d/.test(value);

/**
 * Returns a bilingual-ready error message (already localized by the
 * caller's `isRTL` flag) or null when the name is valid.
 */
export function getFullNameError(name: string, isRTL: boolean): string | null {
  const trimmed = (name || '').trim();

  if (trimmed.length === 0) {
    return isRTL ? 'الاسم الكامل مطلوب' : 'Full name is required';
  }
  if (trimmed.length < FULL_NAME_MIN) {
    return isRTL
      ? `الاسم يجب أن يتكون من ${FULL_NAME_MIN} أحرف على الأقل`
      : `Name must be at least ${FULL_NAME_MIN} characters`;
  }
  if (trimmed.length > FULL_NAME_MAX) {
    return isRTL
      ? `الاسم يجب ألا يتجاوز ${FULL_NAME_MAX} حرفاً`
      : `Name must not exceed ${FULL_NAME_MAX} characters`;
  }
  if (containsDigit(trimmed)) {
    return isRTL ? 'الاسم يجب ألا يحتوي على أرقام' : 'Name must not contain numbers';
  }
  return null;
}

/** Zod schema factory so react-hook-form based screens get the same rules. */
export function fullNameSchema(isRTL: boolean) {
  return z
    .string()
    .trim()
    .min(
      FULL_NAME_MIN,
      isRTL
        ? `الاسم يجب أن يتكون من ${FULL_NAME_MIN} أحرف على الأقل`
        : `Name must be at least ${FULL_NAME_MIN} characters`
    )
    .max(
      FULL_NAME_MAX,
      isRTL ? `الاسم يجب ألا يتجاوز ${FULL_NAME_MAX} حرفاً` : `Name must not exceed ${FULL_NAME_MAX} characters`
    )
    .refine((value) => !containsDigit(value), {
      message: isRTL ? 'الاسم يجب ألا يحتوي على أرقام' : 'Name must not contain numbers',
    });
}
