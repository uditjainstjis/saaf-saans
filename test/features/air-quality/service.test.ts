/**
 * Tests for the air-quality lookup: a place and its air from the two ports,
 * and a refusal against the `place` field when the name matches nothing.
 */
import { expect, it } from 'vitest';
import { lookupAir } from '../../../src/features/air-quality/service';
import { brokenAir, emptyGeocoder, foundGeocoder, smogAir } from '../../support/fakes';
import { DELHI, SMOG } from '../../support/fixtures';

it('resolves the place, then reads the air there', async () => {
  const located = await lookupAir({ geocoder: foundGeocoder, air: smogAir }, 'Delhi');
  expect(located).toEqual({ place: DELHI, air: SMOG });
});

it('refuses with 404 against the place field when nothing matches', async () => {
  const lookup = lookupAir({ geocoder: emptyGeocoder, air: smogAir }, 'Atlantis');
  await expect(lookup).rejects.toMatchObject({
    status: 404,
    code: 'place_not_found',
    issues: [{ field: 'place' }],
  });
});

it('lets a failing provider reject, for a fallback decorator to catch', async () => {
  const lookup = lookupAir({ geocoder: foundGeocoder, air: brokenAir }, 'Delhi');
  await expect(lookup).rejects.toThrow('air down');
});
