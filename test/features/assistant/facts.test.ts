/**
 * Tests for the facts block: everything the model may quote is stated, for
 * families and communities, live and typical air.
 */
import { expect, it } from 'vitest';
import { factsOf } from '../../../src/features/assistant/facts';
import { briefFor, COMMUNITY, SMOG } from '../../support/fixtures';

it('states the air, the outlook, the advice and every recommendation with its impact', () => {
  const brief = briefFor();
  const facts = factsOf(brief);
  expect(facts).toContain('US AQI 186, Unhealthy; PM2.5 149 µg/m³; PM10 210 µg/m³');
  expect(facts).toContain('live reading');
  expect(facts).toContain('cleanest around 3 pm (PM2.5 30 µg/m³), worst around 10 pm');
  expect(facts).toContain(`Health advice: ${brief.advisory}`);
  expect(facts).toContain('A family of 2 adults, 1 children and 1 elders');
  expect(facts).toContain('air purifier: no; sensitive people (asthma, heart or lung disease): no');
  for (const rec of brief.plan.recommendations) expect(facts).toContain(`- id: ${rec.id} |`);
  expect(facts).toContain(
    'about 468 µg of PM2.5 a day not breathed in, counting everyone in the plan',
  );
});

it('describes a community, and says when the air is typical rather than live', () => {
  const facts = factsOf(
    briefFor({ ...COMMUNITY, purifier: true, sensitive: true }, { ...SMOG, source: 'typical' }),
  );
  expect(facts).toContain('A community: Residents’ association (RWA) of 200 people');
  expect(facts).toContain('open burning of waste or leaves nearby: yes');
  expect(facts).toContain(
    'air purifier: yes; sensitive people (asthma, heart or lung disease): yes',
  );
  expect(facts).toContain('typical winter values, live data unavailable');
  expect(factsOf(briefFor({ ...COMMUNITY, wasteBurning: false }))).toContain('nearby: no');
});
