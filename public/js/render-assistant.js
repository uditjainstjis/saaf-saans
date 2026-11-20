// @ts-check
/** Renders the assistant's wording: who wrote it, the summary, and one explanation per card. */
import { $, part } from './dom.js';

/** @typedef {import('../../src/features/assistant/types').Narrative} Narrative */

const SOURCE_LABEL = {
  model: 'Written by generative AI (Workers AI)',
  rules: 'Written by built-in rules (AI unavailable)',
};

/** Show that the assistant is still writing. */
export function renderAssistantPending() {
  $('assistant-source', HTMLElement).textContent = 'The assistant is writing…';
  $('assistant-summary', HTMLElement).textContent = '';
  $('assistant-encouragement', HTMLElement).textContent = '';
}

/**
 * Fill the assistant card and add each explanation to its recommendation.
 * @param {Narrative} narrative
 */
export function renderAssistant({ source, summary, explanations, encouragement }) {
  $('assistant-source', HTMLElement).textContent = SOURCE_LABEL[source];
  $('assistant-summary', HTMLElement).textContent = summary;
  $('assistant-encouragement', HTMLElement).textContent = encouragement;
  if (source !== 'model') return;
  for (const [id, text] of Object.entries(explanations)) {
    const card = document.getElementById(`rec-${id}`);
    if (!card) continue;
    const slot = part(card, '.rec__ai', HTMLElement);
    slot.textContent = `AI explanation: ${text}`;
    slot.hidden = false;
  }
}

/** Say that the assistant could not be reached; the plan above stands on its own. */
export function renderAssistantFailed() {
  $('assistant-source', HTMLElement).textContent = 'The assistant could not be reached';
  $('assistant-summary', HTMLElement).textContent =
    'Your plan and its numbers below are complete without it.';
}
