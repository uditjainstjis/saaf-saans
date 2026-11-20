import { describe, expect, it } from 'vitest';
import {
  cleanerReduction,
  inhaledDose,
  round1,
  weeklyKm,
} from '../../../src/features/impact/service';

describe('the impact arithmetic', () => {
  it('inhaled dose is concentration × breathing rate × hours × people', () => {
    expect(inhaledDose({ pm25: 100, rate: 0.72, hours: 0.5, people: 4 })).toBeCloseTo(144, 10);
    expect(inhaledDose({ pm25: 0, rate: 0.72, hours: 0.5, people: 4 })).toBe(0);
  });

  it('dose scales linearly in every argument', () => {
    const base = { pm25: 80, rate: 1.56, hours: 1, people: 1 };
    const one = inhaledDose(base);
    expect(inhaledDose({ ...base, pm25: 160 })).toBeCloseTo(2 * one, 10);
    expect(inhaledDose({ ...base, hours: 3 })).toBeCloseTo(3 * one, 10);
    expect(inhaledDose({ ...base, people: 5 })).toBeCloseTo(5 * one, 10);
  });

  it('a cleaner removes cleaning ÷ (cleaning + natural loss) at steady state', () => {
    // 150 m³/h in 30 m³ is 5 air changes an hour against 1 of natural loss: 5/6.
    expect(cleanerReduction(150, 30, 1)).toBeCloseTo(5 / 6, 10);
    // No cleaner removes nothing; a huge one approaches everything.
    expect(cleanerReduction(0, 30, 1)).toBe(0);
    expect(cleanerReduction(1e9, 30, 1)).toBeCloseTo(1, 6);
  });

  it('weekly travel counts both directions, every day, every traveller', () => {
    const trip = { oneWayKm: 12, daysPerWeek: 5, travellers: 2 };
    expect(weeklyKm(trip)).toBe(240);
  });

  it('rounds to one decimal place', () => {
    expect(round1(1.25)).toBe(1.3);
    expect(round1(1.24)).toBe(1.2);
    expect(round1(0)).toBe(0);
  });
});
