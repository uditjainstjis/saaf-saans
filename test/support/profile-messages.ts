/**
 * The messages the profile schema gives for an input, for asserting on
 * validation wording.
 */

import { profileSchema } from '../../src/features/plan/schemas';

/** Every validation message for `input`; empty when it is a valid profile. */
export const messages = (input: unknown): string[] => {
  const parsed = profileSchema.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
};
