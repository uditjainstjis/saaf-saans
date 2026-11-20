/**
 * Test doubles for the assistant's ports: a scripted language model, a
 * recording HTTP POST, a reply that passes every check, an OpenAI-style
 * envelope around one, and fixed or broken plan generators.
 */

import type {
  Narrative,
  PlanGenerator,
  TextGenerator,
  TextRequest,
} from '../../src/features/assistant/types';
import type { PlanBrief } from '../../src/features/plan/types';
import type { HttpPost, PostInit } from '../../src/lib/ports';

/** A model that answers with the next queued reply, and records what it was asked. */
export function scriptedText(...replies: unknown[]): TextGenerator & { requests: TextRequest[] } {
  const requests: TextRequest[] = [];
  return {
    requests,
    complete: async (request) => {
      requests.push(request);
      const next = replies.shift();
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

/** An HTTP POST that answers with `reply`, or fails with it, and records what it was sent. */
export function recordingPost(reply: Response | Error): {
  post: HttpPost;
  calls: { url: string; init: PostInit }[];
} {
  const calls: { url: string; init: PostInit }[] = [];
  const post: HttpPost = async (url, init) => {
    calls.push({ url, init });
    if (reply instanceof Error) throw reply;
    return reply;
  };
  return { post, calls };
}

/** A reply a model could give that passes every check for this brief. */
export function goodReply(brief: PlanBrief): {
  summary: string;
  explanations: { id: string; text: string }[];
  encouragement: string;
} {
  return {
    summary: 'The air is poor today, so small changes will protect your family a great deal.',
    explanations: brief.plan.recommendations.map((r) => ({
      id: r.id,
      text: `This step suits your household because it lowers what you breathe. ${r.title}.`,
    })),
    encouragement: 'You are doing well; keep going.',
  };
}

/** A chat completion, as NVIDIA's API returns one, whose message is `value` as JSON text. */
export const completion = (value: unknown): object => ({
  object: 'chat.completion',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: JSON.stringify(value) },
      finish_reason: 'stop',
    },
  ],
});

/** A narrative as a model would write it. */
export const NARRATIVE: Narrative = {
  source: 'model',
  summary: 'A summary written by a model for this household.',
  explanations: { 'clean-air-room': 'Because you sleep there.' },
  encouragement: 'Keep going.',
};

/** A generator that always answers with one narrative. */
export const fixedGenerator = (narrative: Narrative = NARRATIVE): PlanGenerator => ({
  generate: async () => narrative,
});
/** A generator whose model is down. */
export const brokenGenerator: PlanGenerator = {
  generate: async () => Promise.reject(new Error('model down')),
};
