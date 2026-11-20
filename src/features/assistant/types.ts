/**
 * Types of the assistant feature (the generative step): the wording of a
 * plan, the port that writes it, and the port for a language model host.
 * Implementations are ./service.ts, ./generators/ and ./workers-ai.ts.
 */

import type { Model } from '../../config/runtime';
import type { PlanBrief } from '../plan/types';

/** The personalised wording of a plan. Numbers live in the Plan, not here. */
export interface Narrative {
  /** `model` when generative AI wrote it, `rules` when the fallback did. */
  source: 'model' | 'rules';
  summary: string;
  /** One explanation per recommendation, keyed by recommendation id. */
  explanations: Readonly<Record<string, string>>;
  encouragement: string;
}

/** Writes the personalised plan: resolves with complete wording for a brief, or rejects. */
export interface PlanGenerator {
  generate(brief: PlanBrief): Promise<Narrative>;
}

/** One chat-style request to a language model. */
export interface TextRequest {
  /** Which model to ask. */
  model: Model;
  system: string;
  prompt: string;
  /** JSON Schema the reply must match. */
  schema: object;
  maxTokens: number;
}

/** A language model host. Resolves to the host's raw reply, unchecked. */
export interface TextGenerator {
  complete(request: TextRequest, signal: AbortSignal): Promise<unknown>;
}
