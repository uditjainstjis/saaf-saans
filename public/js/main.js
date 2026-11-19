// @ts-check
/** Entry point: submit the profile, render the plan, then let the assistant fill in. */
import { ApiError, postJson } from './api.js';
import { $, announce } from './dom.js';
import { clearIssues, formIssue, showIssues } from './errors.js';
import { initForm, readForm } from './form.js';
import { isNarrative, isPlanView } from './guards.js';
import { renderAir } from './render-air.js';
import {
  renderAssistant,
  renderAssistantFailed,
  renderAssistantPending,
} from './render-assistant.js';
import { renderFindings, renderPlan } from './render-plan.js';
import { initTheme } from './theme.js';

const submit = $('submit-btn', HTMLButtonElement);

/** @param {boolean} busy */
function setBusy(busy) {
  submit.setAttribute('aria-disabled', String(busy));
  submit.textContent = busy ? 'Reading your air…' : 'Get my clean-air plan';
}

/**
 * Ask the assistant to explain the plan. A failure here never hides the plan.
 * @param {Record<string, unknown>} profile
 */
async function loadAssistant(profile) {
  renderAssistantPending();
  try {
    const narrative = await postJson('/api/assistant', profile);
    if (!isNarrative(narrative)) throw new Error('unexpected reply');
    renderAssistant(narrative);
    announce('Your plan is ready, with the assistant’s explanation.');
  } catch {
    renderAssistantFailed();
    announce('Your plan is ready. The assistant’s explanation could not be loaded.');
  }
}

/**
 * Fetch and render the plan for a valid profile.
 * @param {Record<string, unknown>} profile
 */
async function loadPlan(profile) {
  const view = await postJson('/api/plan', profile);
  if (!isPlanView(view))
    throw new ApiError(formIssue('The reply could not be read. Please try again.'));
  renderAir(view);
  renderPlan(view);
  renderFindings(view.findings);
  const results = $('results', HTMLElement);
  results.hidden = false;
  results.focus();
  announce(
    `Air in ${view.place.name}: US AQI ${view.air.aqi}, ${view.air.band.label}. Your plan is below.`,
  );
}

/** Handle a submission: validate, load the plan, then the assistant. */
async function onSubmit() {
  if (submit.getAttribute('aria-disabled') === 'true') return;
  const { profile, issues } = readForm();
  if (issues.length > 0) {
    showIssues(issues);
    return;
  }
  clearIssues();
  setBusy(true);
  announce('Reading the air for your area…');
  try {
    await loadPlan(profile);
    await loadAssistant(profile);
  } catch (err) {
    announce('');
    showIssues(
      err instanceof ApiError ? err.issues : formIssue('Something went wrong. Please try again.'),
    );
  } finally {
    setBusy(false);
  }
}

initTheme();
initForm();
$('profile-form', HTMLFormElement).addEventListener('submit', (event) => {
  event.preventDefault();
  void onSubmit();
});
