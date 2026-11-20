// @ts-check
/** Renders the totals and the three lists of recommendations, with how each was calculated. */
import { $, cloneTemplate, part, textEl } from './dom.js';
import { formatNumber } from './shared/limits.js';
import { CATEGORIES } from './shared/options.js';

/** @typedef {import('../../src/features/plan/view').PlanView} PlanView */
/** @typedef {import('../../src/features/plan/view').RecommendationView} RecommendationView */

/**
 * One recommendation card. Its element id carries the recommendation id, so
 * the assistant's explanation can be added to it when it arrives, and its
 * disclosure is named after it, so no two controls on the page share a name.
 * @param {RecommendationView} rec
 * @returns {HTMLElement}
 */
function card(rec) {
  const el = cloneTemplate($('rec-tpl', HTMLTemplateElement));
  el.id = `rec-${rec.id}`;
  part(el, '.rec__title', HTMLElement).textContent = rec.title;
  part(el, '.rec__status', HTMLElement).hidden = rec.status !== 'keep';
  part(el, '.rec__action', HTMLElement).textContent = rec.action;
  part(el, '.rec__impact', HTMLElement).textContent = rec.impactText;
  part(el, '.rec__calc', HTMLElement).textContent = rec.calculation;
  // Every card has this disclosure, so its name adds the title after the visible text (SC 2.5.3).
  const summary = part(el, 'summary', HTMLElement);
  summary.setAttribute('aria-label', `${summary.textContent}: ${rec.title}`);
  part(el, '.rec__factors', HTMLElement).replaceChildren(
    ...rec.factors.map((f) =>
      textEl(
        'li',
        `${f.label}: ${formatNumber(f.value)} ${f.unit}. ${f.kind === 'published' ? 'Published figure' : 'Assumption'}: ${f.source}.`,
      ),
    ),
  );
  return el;
}

/**
 * Fill the totals card.
 * @param {PlanView['totals']} totals
 */
function renderTotals(totals) {
  $('total-inhaled', HTMLElement).textContent = `${formatNumber(totals.inhaledAvoidedUg)} µg a day`;
  $('total-emitted', HTMLElement).textContent = `${formatNumber(totals.notEmittedG)} g a week`;
  $('total-co2e', HTMLElement).textContent = `${formatNumber(totals.co2eSavedKg)} kg CO2e a week`;
  const hours = Math.round(totals.outdoorMinutes / 6) / 10;
  $('total-equivalent', HTMLElement).textContent =
    `Per person, that is as much PM2.5 as ${formatNumber(totals.outdoorMinutes)} minutes (${formatNumber(hours)} hours) of breathing today’s outdoor air at rest.`;
}

/**
 * Fill the totals and the recommendation lists from a plan reply.
 * @param {PlanView} view
 */
export function renderPlan({ recommendations, totals }) {
  renderTotals(totals);
  for (const category of CATEGORIES) {
    const cards = recommendations.filter((rec) => rec.category === category).map(card);
    $(`list-${category}`, HTMLElement).replaceChildren(
      ...(cards.length > 0
        ? cards
        : [
            textEl(
              'li',
              'Nothing to change here: your current choices are already the cleaner option.',
              'rec__empty',
            ),
          ]),
    );
  }
}

/**
 * List the text the injection screen removed, or hide the notice when there is none.
 * @param {PlanView['findings']} findings
 */
export function renderFindings(findings) {
  $('guard-alert', HTMLElement).hidden = findings.length === 0;
  $('guard-list', HTMLElement).replaceChildren(
    ...findings.map((f) => textEl('li', `${f.detail} (“${f.excerpt}”)`)),
  );
}
