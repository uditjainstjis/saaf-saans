/**
 * The air-quality lookup: resolve the place someone typed, then read the air
 * there. It depends only on the two ports in ./types.ts, so live, cached and
 * offline providers are interchangeable. Presentation is ./view.ts.
 */

import { RequestError } from '../../lib/app-error';
import type { AirSources, LocatedAir } from './types';

/** The place a name resolves to and its air; refuses with 404 on the `place` field when unknown. */
export async function lookupAir({ geocoder, air }: AirSources, name: string): Promise<LocatedAir> {
  const place = await geocoder.find(name);
  if (!place) {
    throw new RequestError(404, 'place_not_found', [
      {
        field: 'place',
        message: 'We could not find that place. Check the spelling or enter the nearest city.',
      },
    ]);
  }
  return { place, air: await air.read(place) };
}
