/**
 * Runtime shapes of the air-quality feature's own types, used wherever a
 * value arrives from outside the type system: the cache and adapter output.
 * The shapes of Open-Meteo's replies are in ./providers/open-meteo-schemas.ts.
 */
import * as z from 'zod';
import { type AirReport, POLLUTANTS, type Place } from './types';

/** A concentration or index: a finite number that is not negative. */
const amount = z.number().min(0).max(100_000);

const hourReading = z.strictObject({ hour: z.number().int().min(0).max(23), pm25: amount });

/** A time zone name and a real calendar date. Anything else is dropped, never trusted. */
const localDay = z.strictObject({
  timeZone: z
    .string()
    .max(64)
    .regex(/^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)*$/),
  date: z.iso.date(),
});

/** The shape of an AirReport. */
export const airReportSchema: z.ZodType<AirReport> = z.strictObject({
  source: z.enum(['live', 'typical']),
  aqi: amount,
  pm25: amount,
  pm10: amount,
  dominant: z.enum(POLLUTANTS),
  hours: z.tuple([hourReading], hourReading).readonly(),
  local: localDay.optional().catch(undefined),
  /** A real local date and time with no offset; anything else is dropped. */
  observedAt: z.iso.datetime({ local: true }).optional().catch(undefined),
});

/** The shape of a Place. */
export const placeSchema: z.ZodType<Place> = z.strictObject({
  name: z.string().min(1).max(120),
  region: z.string().max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
