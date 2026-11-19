import { describe, expect, it } from 'vitest';
import { cleanerReduction } from '../../src/domain/exposure';
import type { Profile } from '../../src/domain/profile';
import { buildPlan } from '../../src/domain/plan';
import { STRATEGIES } from '../../src/domain/strategies/registry';
import type { AirReport, Recommendation } from '../../src/domain/types';
import { COMMUNITY, FAMILY, flatAir, situation, SMOG, smogDay } from '../support/fixtures';

/** The recommendation a strategy makes for a profile in some air, if it makes one. */
function advice(id: string, profile: Profile, air: AirReport = SMOG): Recommendation | undefined {
  return buildPlan(situation(profile, air)).recommendations.find((r) => r.id === id);
}

const inhaled = (id: string, profile: Profile, air?: AirReport): number | undefined =>
  advice(id, profile, air)?.impact.inhaledAvoidedUg;

describe('low-emission daily routines', () => {
  it('shift-outdoor-time: (usual − best) × moderate breathing × hours × people', () => {
    // (180 − 30) µg/m³ × 1.56 m³/h × 0.5 h × 4 people
    expect(inhaled('shift-outdoor-time', FAMILY)).toBe(468);
    expect(advice('shift-outdoor-time', FAMILY)?.title).toBe('Move outdoor time to 3 pm');
    // (180 − 30) × 1.56 × (20/60) h × 200 people
    expect(inhaled('shift-outdoor-time', COMMUNITY)).toBe(15_600);
  });

  it('shift-outdoor-time: uses the evening hour for an evening habit', () => {
    // 7 pm is 120 µg/m³ on the fixture day: (120 − 30) × 1.56 × 0.5 × 4
    expect(inhaled('shift-outdoor-time', { ...FAMILY, outdoorTime: 'evening' })).toBe(280.8);
  });

  it('shift-outdoor-time: silent with no outdoor habit, no minutes, or nothing to gain', () => {
    expect(advice('shift-outdoor-time', { ...FAMILY, outdoorTime: 'none' })).toBeUndefined();
    expect(advice('shift-outdoor-time', { ...FAMILY, outdoorMinutes: 0 })).toBeUndefined();
    expect(advice('shift-outdoor-time', FAMILY, flatAir(20))).toBeUndefined();
  });

  it('exercise-indoors: replaces the shift when even the best hour is over the limit', () => {
    const heavy: AirReport = { ...SMOG, hours: smogDay(2) };
    // Best hour is 60 µg/m³, above 35.4 for a vulnerable household.
    expect(advice('shift-outdoor-time', FAMILY, heavy)).toBeUndefined();
    // 360 µg/m³ × (1 − 0.5) × 1.56 × 0.5 h × 4
    expect(inhaled('exercise-indoors', FAMILY, heavy)).toBe(561.6);
    expect(advice('exercise-indoors', FAMILY, heavy)?.action).toContain('35.4 µg/m³ limit');
  });

  it('exercise-indoors: healthy adults get the higher limit', () => {
    const adults = { ...FAMILY, children: 0, elders: 0 };
    // Best hour 45 µg/m³: over 35.4 but under 55.4.
    const air: AirReport = { ...SMOG, hours: smogDay(1.5) };
    expect(advice('exercise-indoors', adults, air)).toBeUndefined();
    expect(advice('exercise-indoors', FAMILY, air)).toBeDefined();
    expect(advice('exercise-indoors', { ...FAMILY, outdoorTime: 'none' }, air)).toBeUndefined();
  });

  it('mask-on-commute: dose on the way × N95 filtration × everyday fit', () => {
    // 149 µg/m³ × 0.25 m³/h × (5 km × 2 ÷ 20 km/h) × 60 commuters × 0.95 × 0.7
    expect(inhaled('mask-on-commute', COMMUNITY)).toBe(743.1);
    // Walking 3 km each way at 5 km/h, light activity: 149 × 0.72 × 1.2 h × 2 × 0.665
    expect(inhaled('mask-on-commute', { ...FAMILY, commute: 'walk', commuteKm: 3 })).toBe(171.2);
    // Cycling breathes hardest: 149 × 1.56 × (6 ÷ 15) × 2 × 0.665
    expect(inhaled('mask-on-commute', { ...FAMILY, commute: 'cycle', commuteKm: 3 })).toBe(123.7);
    expect(advice('mask-on-commute', { ...FAMILY, commute: 'bus' })).toBeDefined();
  });

  it('mask-on-commute: silent in a closed vehicle, with no distance, or in clean air', () => {
    expect(advice('mask-on-commute', FAMILY)).toBeUndefined();
    expect(advice('mask-on-commute', { ...FAMILY, commute: 'metro' })).toBeUndefined();
    expect(advice('mask-on-commute', { ...FAMILY, commute: 'walk', commuteKm: 0 })).toBeUndefined();
    expect(advice('mask-on-commute', { ...FAMILY, commute: 'walk' }, flatAir(10))).toBeUndefined();
  });

  it('air-at-cleanest-hour: (7 am − best) × resting breathing × half an hour × people', () => {
    // (180 − 30) × 0.25 × 0.5 × 4
    expect(inhaled('air-at-cleanest-hour', FAMILY)).toBe(75);
    expect(advice('air-at-cleanest-hour', FAMILY, flatAir(40))).toBeUndefined();
  });
});

describe('indoor air quality hacks', () => {
  it('clean-air-room: a box-fan filter in the bedroom for a family without a purifier', () => {
    const removed = cleanerReduction(1019, 32, 1);
    // 149 × 0.5 indoors × removed × 0.26 m³/h asleep × 8 h × 4 people
    expect(inhaled('clean-air-room', FAMILY)).toBeCloseTo(74.5 * removed * 0.26 * 8 * 4, 1);
    expect(advice('clean-air-room', FAMILY)?.title).toBe('Build a box-fan filter for the bedroom');
  });

  it('clean-air-room: uses the purifier a family already owns', () => {
    const removed = cleanerReduction(150, 32, 1);
    const owned = { ...FAMILY, purifier: true };
    expect(inhaled('clean-air-room', owned)).toBeCloseTo(74.5 * removed * 0.26 * 8 * 4, 1);
    expect(advice('clean-air-room', owned)?.title).toBe('Run the purifier where you sleep');
    expect(advice('clean-air-room', owned)?.factorIds).toContain('purifierCadr');
  });

  it('clean-air-room: one shared room for a community, capped at the people it holds', () => {
    const removed = cleanerReduction(1019, 170, 1);
    // 149 × 0.6 indoors × removed × 0.25 m³/h × 6 h × 40 people (of 200)
    expect(inhaled('clean-air-room', COMMUNITY)).toBeCloseTo(89.4 * removed * 0.25 * 6 * 40, 1);
    expect(advice('clean-air-room', COMMUNITY)?.title).toBe(
      'Make one clean-air room for the group',
    );
    const small = { ...COMMUNITY, people: 10, purifier: true };
    expect(inhaled('clean-air-room', small)).toBeCloseTo(89.4 * removed * 0.25 * 6 * 10, 1);
    expect(advice('clean-air-room', small)?.title).toBe('Add a box-fan filter to the shared room');
  });

  it('close-at-peak: worst hour × share kept out × resting breathing × three hours × people', () => {
    // 220 × (1 − 0.5) × 0.25 × 3 × 4
    expect(inhaled('close-at-peak', FAMILY)).toBe(330);
    expect(advice('close-at-peak', FAMILY)?.title).toBe('Shut windows from 9 pm to 12 midnight');
    // 220 × (1 − 0.6) × 0.25 × 3 × 200
    expect(inhaled('close-at-peak', COMMUNITY)).toBe(13_200);
    expect(advice('close-at-peak', FAMILY, flatAir(12))).toBeUndefined();
  });

  it('seal-gaps: a home-only hack, sized by how leaky the home is', () => {
    // 149 × 0.5 × 0.2 × 0.25 × 8 × 4
    expect(inhaled('seal-gaps', FAMILY)).toBe(119.2);
    // A roadside home leaks more: 149 × 0.7 × 0.2 × 0.25 × 8 × 4
    expect(inhaled('seal-gaps', { ...FAMILY, homeType: 'roadside' })).toBe(166.9);
    expect(advice('seal-gaps', COMMUNITY)).toBeUndefined();
    expect(advice('seal-gaps', FAMILY, flatAir(10))).toBeUndefined();
  });
});

describe('sustainable alternatives', () => {
  it('switch-commute: weekly km × (driving − metro) kg CO2e per km', () => {
    // 12 km × 2 × 5 days × 2 adults = 240 km × (0.1645 − 0.0286)
    expect(advice('switch-commute', FAMILY)?.impact.co2eSavedKg).toBe(32.6);
    // 5 × 2 × 5 × 60 riders = 3,000 km × (0.1137 − 0.0286)
    expect(advice('switch-commute', COMMUNITY)?.impact.co2eSavedKg).toBe(255.3);
    expect(advice('switch-commute', COMMUNITY)?.factorIds).toContain('groupUptake');
    expect(advice('switch-commute', FAMILY)?.factorIds).not.toContain('groupUptake');
  });

  it('switch-commute: silent for a clean commute or no distance', () => {
    expect(advice('switch-commute', { ...FAMILY, commute: 'metro' })).toBeUndefined();
    expect(advice('switch-commute', { ...FAMILY, commuteKm: 0 })).toBeUndefined();
  });

  it('keep-commute: credits what a low-emission commute already saves against a petrol car', () => {
    // 240 km × (0.1645 − 0.0286)
    const metro = advice('keep-commute', { ...FAMILY, commute: 'metro' });
    expect(metro?.status).toBe('keep');
    expect(metro?.impact.co2eSavedKg).toBe(32.6);
    // 240 km × (0.1645 − 0.1085)
    expect(advice('keep-commute', { ...FAMILY, commute: 'bus' })?.impact.co2eSavedKg).toBe(13.4);
    // 240 km × 0.1645
    expect(advice('keep-commute', { ...FAMILY, commute: 'cycle' })?.impact.co2eSavedKg).toBe(39.5);
    expect(advice('keep-commute', { ...FAMILY, commute: 'walk' })?.impact.co2eSavedKg).toBe(39.5);
  });

  it('keep-commute: silent for drivers, for no commute and for no distance', () => {
    expect(advice('keep-commute', FAMILY)).toBeUndefined();
    expect(advice('keep-commute', { ...FAMILY, commute: 'none' })).toBeUndefined();
    expect(advice('keep-commute', { ...FAMILY, commute: 'metro', commuteKm: 0 })).toBeUndefined();
  });

  it('clean-cooking: fuel burned in a week × PM2.5 per kg, for solid-fuel kitchens only', () => {
    // 4 kg/day × 7 × 6.64 g/kg
    expect(advice('clean-cooking', { ...FAMILY, cookingFuel: 'biomass' })?.impact.notEmittedG).toBe(
      185.9,
    );
    expect(advice('clean-cooking', FAMILY)).toBeUndefined();
    expect(advice('clean-cooking', COMMUNITY)).toBeUndefined();
  });

  it('stop-waste-burning: waste burned in a week × PM2.5 and CO2 per kg', () => {
    // 1 kg per 100 people per day × 200 people × 7 days = 14 kg
    const rec = advice('stop-waste-burning', COMMUNITY);
    expect(rec?.impact.notEmittedG).toBe(137.2);
    expect(rec?.impact.co2eSavedKg).toBe(20.3);
    expect(advice('stop-waste-burning', { ...COMMUNITY, wasteBurning: false })).toBeUndefined();
    expect(advice('stop-waste-burning', FAMILY)).toBeUndefined();
  });
});

describe('the registry', () => {
  it('holds every strategy once, each in one of the three categories of the brief', () => {
    const ids = STRATEGIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(STRATEGIES.map((s) => s.category))).toEqual(
      new Set(['routine', 'indoor', 'alternative']),
    );
  });

  it('every strategy answers every situation without throwing, with non-negative impact', () => {
    const airs = [SMOG, flatAir(5), flatAir(400), { ...SMOG, hours: smogDay(3) }];
    for (const profile of [FAMILY, COMMUNITY]) {
      for (const air of airs) {
        for (const rec of buildPlan(situation(profile, air)).recommendations) {
          const { inhaledAvoidedUg, notEmittedG, co2eSavedKg } = rec.impact;
          expect(
            Math.min(inhaledAvoidedUg, notEmittedG, co2eSavedKg),
            rec.id,
          ).toBeGreaterThanOrEqual(0);
          expect(rec.calculation, rec.id).not.toBe('');
          expect(rec.factorIds.length, rec.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
