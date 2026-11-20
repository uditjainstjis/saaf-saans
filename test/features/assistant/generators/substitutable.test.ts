/**
 * Liskov check: every PlanGenerator honours the same contract, so they can be
 * stacked and swapped freely.
 */
import { expect, it } from 'vitest';
import { cachedPlanGenerator } from '../../../../src/features/assistant/generators/cached';
import { fallbackPlanGenerator } from '../../../../src/features/assistant/generators/fallback';
import { rulePlanGenerator } from '../../../../src/features/assistant/generators/rules';
import { modelPlanGenerator } from '../../../../src/features/assistant/service';
import type { PlanGenerator } from '../../../../src/features/assistant/types';
import { brokenGenerator, goodReply, scriptedText } from '../../../support/assistant-fakes';
import { memoryCache, recordingLogger } from '../../../support/fakes';
import { briefFor } from '../../../support/fixtures';

const brief = briefFor();

const generators: [string, PlanGenerator][] = [
  ['rules', rulePlanGenerator],
  ['model', modelPlanGenerator(scriptedText({ response: goodReply(brief) }), recordingLogger())],
  ['fallback', fallbackPlanGenerator(brokenGenerator, rulePlanGenerator, recordingLogger())],
  ['cached', cachedPlanGenerator(rulePlanGenerator, memoryCache())],
];

it.each(generators)('%s explains every recommendation and nothing else', async (_n, generator) => {
  const narrative = await generator.generate(brief);
  expect(Object.keys(narrative.explanations).sort()).toEqual(
    brief.plan.recommendations.map((r) => r.id).sort(),
  );
  expect(narrative.summary.length).toBeGreaterThan(20);
  expect(narrative.encouragement.length).toBeGreaterThan(5);
});
