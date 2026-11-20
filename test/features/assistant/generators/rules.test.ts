/**
 * Tests for the rule-based generator: a narrative written from the plan alone.
 */
import { expect, it } from 'vitest';
import { rulePlanGenerator } from '../../../../src/features/assistant/generators/rules';
import { briefFor, FAMILY } from '../../../support/fixtures';

const brief = briefFor();

it('writes the narrative from the plan alone, quoting only computed figures', async () => {
  const narrative = await rulePlanGenerator.generate(brief);
  expect(narrative.source).toBe('rules');
  expect(narrative.summary).toBe(
    `Air in Delhi is unhealthy right now, with a US AQI of 186. ${brief.advisory} The 6 changes below would keep everyone in the plan from breathing in about 1,593.2 µg of PM2.5 a day, and save about 32.6 kg CO2e a week.`,
  );
  expect(narrative.explanations['switch-commute']).toBe(
    'Direct impact: about 32.6 kg CO2e a week not emitted.',
  );
});

it('counts only new changes', async () => {
  const metro = briefFor({ ...FAMILY, commute: 'metro' });
  expect((await rulePlanGenerator.generate(metro)).summary).toContain('The 5 changes below');
});
