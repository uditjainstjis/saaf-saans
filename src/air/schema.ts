import { z } from 'zod';
import { POLLUTANTS, type AirReport, type Place } from '../domain/types';

/** A concentration or index: a finite number that is not negative. */
const amount = z.number().min(0).max(100_000);

const hourReading = z.strictObject({ hour: z.number().int().min(0).max(23), pm25: amount });

/** The shape of an {@link AirReport}, for values read back from the cache. */
export const airReportSchema: z.ZodType<AirReport> = z.strictObject({
  source: z.enum(['live', 'typical']),
  aqi: amount,
  pm25: amount,
  pm10: amount,
  dominant: z.enum(POLLUTANTS),
  hours: z.tuple([hourReading], hourReading).readonly(),
});

/** The shape of a {@link Place}. */
export const placeSchema: z.ZodType<Place> = z.strictObject({
  name: z.string().min(1).max(120),
  region: z.string().max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
