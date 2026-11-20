/**
 * The shapes of Open-Meteo's replies, as far as the adapters read them. Every
 * reply is parsed against these before any value is used. Adapters:
 * ./open-meteo-air.ts and ./open-meteo-geocoder.ts.
 */
import * as z from 'zod';

const reading = z.number().nullable();

/** The air quality reply: the place's time zone, current readings with their time and per-pollutant sub-indices, and hourly PM2.5. */
export const openMeteoAirReply = z.object({
  timezone: z.string().optional(),
  current: z.object({
    time: z.string().optional(),
    us_aqi: z.number(),
    pm2_5: z.number(),
    pm10: z.number(),
    us_aqi_pm2_5: reading,
    us_aqi_pm10: reading,
    us_aqi_nitrogen_dioxide: reading,
    us_aqi_ozone: reading,
    us_aqi_sulphur_dioxide: reading,
  }),
  hourly: z.object({ time: z.array(z.string()), pm2_5: z.array(reading) }),
});
/** A parsed air quality reply. */
export type OpenMeteoAirReply = z.infer<typeof openMeteoAirReply>;

/** The geocoding reply; `results` is absent when nothing matches. */
export const openMeteoPlacesReply = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
        country: z.string().optional(),
      }),
    )
    .optional(),
});
