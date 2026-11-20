/**
 * axe-core, configured once: the real engine over the real shipped markup and
 * stylesheet. jsdom does no layout, so the contrast rule is switched off here
 * and contrast is computed from the tokens instead (./contrast.dom.ts).
 */
import axe from 'axe-core';
import { loadApp } from './page.dom';

const RULES = {
  type: 'tag' as const,
  values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
};
/** The audit's options: WCAG 2.2 AA and best-practice rules, minus the layout-dependent one. */
export const AXE_OPTIONS = { runOnly: RULES, rules: { 'color-contrast': { enabled: false } } };

/** Violations as text a failing log can be read from; empty when there are none. */
export async function violations(): Promise<string> {
  const results = await axe.run(document, { ...AXE_OPTIONS, resultTypes: ['violations'] });
  return results.violations
    .map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

/** A fresh, styled page in one theme. */
export async function openIn(theme: 'light' | 'dark'): Promise<void> {
  await loadApp({ withCss: true });
  document.documentElement.dataset.theme = theme;
}
