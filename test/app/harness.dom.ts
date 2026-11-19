import { expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rulePlanGenerator } from '../../src/ai/generators';
import type { Profile } from '../../src/domain/profile';
import type { AirReport } from '../../src/domain/types';
import { presentPlan, type PlanView } from '../../src/http/present';
import type { Narrative } from '../../src/ports';
import { briefFor } from '../support/fixtures';

/**
 * The page under test: the real index.html and the real public/js modules in
 * jsdom, with fetch stubbed to answer as the Worker would.
 */

const PUBLIC = resolve(process.cwd(), 'public');
const ENTRY = resolve(PUBLIC, 'js', 'main.js');

/** A shipped file, read off disk. */
export const shipped = (name: string): string => readFileSync(resolve(PUBLIC, name), 'utf8');

export const STYLESHEETS = ['tokens.css', 'base.css', 'form.css', 'results.css'] as const;
/** The whole shipped stylesheet, in load order. */
export const css = (): string => STYLESHEETS.map((name) => shipped(`css/${name}`)).join('\n');

/** What the Worker would answer for a profile: the real presenter over the real planner. */
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

export interface Reply {
  status: number;
  body: unknown;
}
export const ok = (body: unknown): Reply => ({ status: 200, body });

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

export function $<T extends HTMLElement>(id: string, type: new () => T): T;
export function $(id: string): HTMLElement;
export function $(id: string, type: new () => HTMLElement = HTMLElement): HTMLElement {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing`);
  return el;
}

export const input = (id: string): HTMLInputElement => $(id, HTMLInputElement);
export const select = (id: string): HTMLSelectElement => $(id, HTMLSelectElement);

/** Choose community mode, as a click on the radio would. */
export function chooseCommunity(): void {
  input('mode-community').checked = true;
  input('mode-community').dispatchEvent(new Event('change'));
}

export function submit(): void {
  $('profile-form', HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

/** Wait until the submit button is no longer busy, i.e. the handler has finished. */
export async function settled(): Promise<void> {
  await vi.waitFor(() => {
    expect($('submit-btn').getAttribute('aria-disabled')).toBe('false');
    expect($('submit-btn').textContent).toBe('Get my clean-air plan');
  });
}

/** An in-memory stand-in for localStorage. */
export function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
}

/** The shipped markup as a document's inner HTML, with the stylesheet inlined on request. */
export function mountPage(withCss = false): void {
  const html = shipped('index.html')
    .replace(/^[\s\S]*?<html[^>]*>/, '')
    .replace(/<script\b[^>]*><\/script>/g, '')
    .replace(/<link rel="stylesheet"[^>]*>/g, '');
  document.documentElement.innerHTML = html;
  document.documentElement.lang = 'en';
  document.documentElement.removeAttribute('data-theme');
  if (!withCss) return;
  const style = document.createElement('style');
  style.textContent = css();
  document.head.append(style);
}

/**
 * A fresh page with fresh copies of the modules, so no listener or module
 * state carries over between tests. The entry module is imported, not fetched.
 */
export async function loadApp(
  options: { withCss?: boolean; storage?: unknown } = {},
): Promise<void> {
  mountPage(options.withCss);
  vi.stubGlobal('localStorage', 'storage' in options ? options.storage : memoryStorage());
  vi.resetModules();
  await import(/* @vite-ignore */ ENTRY);
}
