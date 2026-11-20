import { adviceFor, bandFor } from '../air-quality/aqi';
import { buildPlan } from './planner';
import type { Profile } from './schemas';
import { situationOf } from './situation';
import { RequestError } from '../../lib/app-error';
import type { AirQualityProvider, Geocoder, PlanBrief } from '../../lib/ports';

/** What preparing a brief depends on: somewhere to look places up, somewhere to read air. */
export interface Sources {
  geocoder: Geocoder;
  air: AirQualityProvider;
}

/**
 * The use case both API routes share: resolve the place, read its air, and
 * compute the plan. Everything in the returned brief is deterministic given
 * the air report; the generative step only ever receives the finished brief.
 */
export async function prepareBrief(
  { geocoder, air }: Sources,
  profile: Profile,
): Promise<PlanBrief> {
  const place = await geocoder.find(profile.place);
  if (!place) {
    throw new RequestError(404, 'place_not_found', [
      {
        field: 'place',
        message: 'We could not find that place. Check the spelling or enter the nearest city.',
      },
    ]);
  }
  const report = await air.read(place);
  const situation = situationOf(profile, report);
  return {
    profile,
    place,
    air: report,
    plan: buildPlan(situation),
    advisory: adviceFor(bandFor(report.aqi), situation.vulnerable),
  };
}
