/**
 * Tests for the assistant schemas: the JSON Schema given to Workers AI and the
 * shape a cached narrative must keep.
 */
import { expect, it } from 'vitest';
import { NARRATIVE_JSON_SCHEMA, narrativeSchema } from '../../../src/features/assistant/schemas';
import { NARRATIVE } from '../../support/assistant-fakes';

it('gives the model host a JSON Schema requiring all three parts', () => {
  expect(NARRATIVE_JSON_SCHEMA).toMatchObject({
    type: 'object',
    required: ['summary', 'explanations', 'encouragement'],
    additionalProperties: false,
  });
});

it('recognises a cached narrative and refuses anything else', () => {
  expect(narrativeSchema.safeParse(NARRATIVE).success).toBe(true);
  expect(narrativeSchema.safeParse({ ...NARRATIVE, source: 'guess' }).success).toBe(false);
});
