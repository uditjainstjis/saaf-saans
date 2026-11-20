/**
 * What the Worker would answer, for page tests: the real presenter over the
 * real planner, and a fetch stub that plays replies back in order.
 */
import { vi } from 'vitest';
import type { AirReport } from '../../src/features/air-quality/types';
import { rulePlanGenerator } from '../../src/features/assistant/generators/rules';
import type { Narrative } from '../../src/features/assistant/types';
import type { Profile } from '../../src/features/plan/schemas';
import { type PlanView, presentPlan } from '../../src/features/plan/view';
import { briefFor } from './fixtures';

/** The `/api/plan` reply for a profile. */
export const planReply = (profile?: Profile, air?: AirReport): PlanView =>
  presentPlan(briefFor(profile, air));

/** A narrative as the model would write it for a profile. */
export async function modelNarrative(profile?: Profile): Promise<Narrative> {
  const rules = await rulePlanGenerator.generate(briefFor(profile));
  return {
    ...rules,
    source: 'model',
    summary: 'The assistant says the air is poor, so plan your day around the cleaner hours.',
    explanations: Object.fromEntries(
      Object.keys(rules.explanations).map((id) => [id, `Because it suits your day (${id}).`]),
    ),
  };
}

/** One reply the stubbed fetch gives. */
export interface Reply {
  status: number;
  body: unknown;
}
/** A successful reply with this body. */
export const okReply = (body: unknown): Reply => ({ status: 200, body });

/** Answer each fetch with the next reply in order, and record what was asked. */
export function stubFetch(...replies: (Reply | Error)[]): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(async () => {
    const next = replies.shift();
    if (!next) throw new Error('unexpected fetch');
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body), { status: next.status });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

/** The paths the page requested, in order. */
export const sentPaths = (fetch: ReturnType<typeof vi.fn>): string[] =>
  fetch.mock.calls.map((call: unknown[]) => String(call[0]));

/** The JSON body of the nth request the page made. */
export function sentBody(fetch: ReturnType<typeof vi.fn>, call = 0): unknown {
  const init: unknown = fetch.mock.calls[call]?.[1];
  const body = typeof init === 'object' && init !== null && 'body' in init ? init.body : '';
  return JSON.parse(String(body));
}
