/**
 * Display labels for every choice in ./options.ts, worded once for the form,
 * the results and the prompt (compiled to public/js/shared/labels.js, so it
 * imports nothing). Every use indexes a group by its option type, so a
 * missing label is a type error.
 */

/** Labels by option group, then by option value. */
export const LABELS = {
  mode: { family: 'My family', community: 'My community' },
  commute: {
    walk: 'Walk',
    cycle: 'Cycle',
    two_wheeler: 'Scooter or motorbike',
    car: 'Car',
    bus: 'Bus',
    metro: 'Metro or train',
    none: 'No regular commute',
  },
  cookingFuel: {
    lpg_png: 'LPG or piped gas',
    electric: 'Electric or induction',
    biomass: 'Wood, dung or coal',
  },
  homeType: {
    apartment: 'Apartment above the ground floor',
    house: 'Independent house',
    roadside: 'Ground floor or beside a busy road',
  },
  outdoorTime: {
    none: 'No regular outdoor activity',
    morning: 'Early morning (around 7 am)',
    evening: 'Evening (around 7 pm)',
  },
  groupType: {
    rwa: 'Residents’ association (RWA)',
    school: 'School',
    neighbourhood: 'Neighbourhood group',
  },
  category: {
    routine: 'Low-emission daily routines',
    indoor: 'Indoor air quality hacks',
    alternative: 'Sustainable alternatives',
  },
} as const;
