/**
 * The page under test: the real index.html and the real public/js modules in
 * jsdom, plus the few gestures a visitor makes. Replies are in ./replies.dom.ts.
 */
import { resolve } from 'node:path';
import { expect, vi } from 'vitest';
import { css, shipped } from './shipped.dom';

const ENTRY = resolve(process.cwd(), 'public', 'js', 'main.js');

/** The element with this id, checked to be a `type`. */
export function byId<T extends HTMLElement>(id: string, type: new () => T): T;
/** The element with this id. */
export function byId(id: string): HTMLElement;
/** The element with this id, checked to be the expected kind. */
export function byId(id: string, type: new () => HTMLElement = HTMLElement): HTMLElement {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing`);
  return el;
}

/** The input with this id. */
export const inputEl = (id: string): HTMLInputElement => byId(id, HTMLInputElement);
/** The select with this id. */
export const selectEl = (id: string): HTMLSelectElement => byId(id, HTMLSelectElement);

/** Choose community mode, as a click on the radio would. */
export function chooseCommunity(): void {
  inputEl('mode-community').checked = true;
  inputEl('mode-community').dispatchEvent(new Event('change'));
}

/** Submit the profile form, as pressing the button would. */
export function submit(): void {
  byId('profile-form', HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

/** Wait until the submit button is no longer busy, i.e. the handler has finished. */
export async function settled(): Promise<void> {
  await vi.waitFor(() => {
    expect(byId('submit-btn').getAttribute('aria-disabled')).toBe('false');
    expect(byId('submit-btn').textContent).toBe('Get my clean-air plan');
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

/** The shipped markup as the document, with the stylesheet inlined on request. */
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

/** A fresh page with fresh copies of the modules, so nothing carries over between tests. */
export async function loadApp(
  options: { withCss?: boolean; storage?: unknown } = {},
): Promise<void> {
  mountPage(options.withCss);
  vi.stubGlobal('localStorage', 'storage' in options ? options.storage : memoryStorage());
  vi.resetModules();
  await import(/* @vite-ignore */ ENTRY);
}
