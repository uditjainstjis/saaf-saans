/**
 * Shapes of the assistant's wording: what the model is asked for and held to
 * (also given to the model host as JSON Schema), and what a cached narrative
 * must still look like. The checks beyond shape are ./reply-checks.ts.
 */
import * as z from 'zod';
import type { Narrative } from './types';

/** The reply shape the model is asked for, and held to. */
export const narrativeReply = z.strictObject({
  summary: z.string().trim().min(20).max(600),
  explanations: z
    .array(z.strictObject({ id: z.string().max(60), text: z.string().trim().min(20).max(500) }))
    .min(1)
    .max(20),
  encouragement: z.string().trim().min(5).max(300),
});
/** A reply that matched the shape. */
export type NarrativeReply = z.infer<typeof narrativeReply>;

/** The same shape as JSON Schema, for the model host's constrained decoding. */
export const NARRATIVE_JSON_SCHEMA: object = z.toJSONSchema(narrativeReply);

/** The shape of a {@link Narrative}, for values read back from the cache. */
export const narrativeSchema: z.ZodType<Narrative> = z.strictObject({
  source: z.enum(['model', 'rules']),
  summary: z.string(),
  explanations: z.record(z.string(), z.string()),
  encouragement: z.string(),
});
