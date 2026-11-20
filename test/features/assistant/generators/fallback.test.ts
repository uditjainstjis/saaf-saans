/**
 * Tests for the fallback generator: rules answer when the model cannot.
 */
import { expect, it } from 'vitest';
import { fallbackPlanGenerator } from '../../../../src/features/assistant/generators/fallback';
import { rulePlanGenerator } from '../../../../src/features/assistant/generators/rules';
import { brokenGenerator, fixedGenerator, NARRATIVE } from '../../../support/assistant-fakes';
import { recordingLogger } from '../../../support/fakes';
import { briefFor } from '../../../support/fixtures';

const brief = briefFor();

it('uses the primary when it works', async () => {
  const logger = recordingLogger();
  const generator = fallbackPlanGenerator(fixedGenerator(), rulePlanGenerator, logger);
  expect(await generator.generate(brief)).toEqual(NARRATIVE);
  expect(logger.events).toEqual([]);
});

it('falls back to rules when the model is unavailable, so the assistant always answers', async () => {
  const logger = recordingLogger();
  const generator = fallbackPlanGenerator(brokenGenerator, rulePlanGenerator, logger);
  expect((await generator.generate(brief)).source).toBe('rules');
  expect(logger.events).toEqual(['plan_generator_failed']);
});
