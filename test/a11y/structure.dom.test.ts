import { beforeAll, describe, expect, it } from 'vitest';
import { css, mountPage, shipped } from '../support/page.dom';

/**
 * Structural WCAG 2.2 AA checks on the shipped markup and stylesheets: the
 * things a parser can decide. README's accessibility table cites these tests
 * by name.
 */

const all = <T extends Element = Element>(selector: string): T[] => [
  ...document.querySelectorAll<T>(selector),
];
const sheet = css();
const html = shipped('index.html');

/** The pixel value of a `--name: NNpx` token. */
const tokenPx = (name: string): number =>
  Number(new RegExp(`--${name}: (\\d+)px;`).exec(sheet)?.[1] ?? 0);

/** The declarations of the first rule whose selector list ends with `selector`. */
function rule(selector: string): string {
  const start = sheet.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no rule for ${selector}`);
  return sheet.slice(start, sheet.indexOf('}', start));
}

beforeAll(() => {
  mountPage();
});

describe('page structure (1.3.1, 2.4.1, 2.4.2, 2.4.6, 3.1.1)', () => {
  it('declares its language and a descriptive title', () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(document.title).toContain('Saaf Saans');
  });

  it('has exactly one h1, and headings that never skip a level', () => {
    expect(all('h1')).toHaveLength(1);
    const template = document.querySelector('template')?.content.querySelectorAll('h4') ?? [];
    expect(template.length).toBe(1);
    const levels = all('h1, h2, h3, h4').map((h) => Number(h.tagName.slice(1)));
    levels.forEach((level, i) => {
      expect(level - (levels[i - 1] ?? 0), `heading ${i}`).toBeLessThanOrEqual(1);
    });
  });

  it('has one header, one main and one footer landmark, with all content inside them', () => {
    expect(all('header')).toHaveLength(1);
    expect(all('main')).toHaveLength(1);
    expect(all('footer')).toHaveLength(1);
    const outside = [...document.body.children].filter(
      (el) => !['HEADER', 'MAIN', 'FOOTER', 'TEMPLATE'].includes(el.tagName),
    );
    expect(outside.map((el) => el.className)).toEqual(['skip-link']);
  });

  it('starts with a skip link to the main content', () => {
    const first = document.body.firstElementChild;
    expect(first?.getAttribute('href')).toBe('#main');
    expect(document.getElementById('main')?.tagName).toBe('MAIN');
  });

  it('names every section by its heading', () => {
    for (const section of all('section, form')) {
      const id = section.getAttribute('aria-labelledby') ?? '';
      expect(
        document.getElementById(id)?.textContent,
        `<${section.tagName} #${section.id}>`,
      ).toBeTruthy();
    }
  });

  it('uses the brief’s own phrases as section names', () => {
    const text = document.body.textContent.replace(/\s+/g, ' ');
    for (const phrase of [
      'GenAI-powered assistant',
      'Families and communities',
      'Severe winter smog and urban air pollution',
      'Low-emission daily routines',
      'Indoor air quality hacks',
      'Sustainable alternatives',
      'Tailored to your location',
      'Tailored to your lifestyle',
      'The direct impact of your choices',
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });
});

describe('forms (1.3.1, 1.3.5, 3.3.2, 4.1.2)', () => {
  const controls = (): Element[] => all('input, select, textarea');

  it('gives every control exactly one visible label', () => {
    for (const control of controls()) {
      expect(all(`label[for="${control.id}"]`), `#${control.id}`).toHaveLength(1);
    }
    expect(controls().length).toBeGreaterThanOrEqual(15);
  });

  it('has unique ids, and every aria reference points at a real element', () => {
    const ids = all('[id]').map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const el of all('[aria-describedby], [aria-labelledby]')) {
      const refs = `${el.getAttribute('aria-describedby') ?? ''} ${el.getAttribute('aria-labelledby') ?? ''}`;
      for (const ref of refs.trim().split(/\s+/)) {
        expect(document.getElementById(ref), `${el.id} → ${ref}`).not.toBeNull();
      }
    }
  });

  it('groups related controls in fieldsets, each with a legend', () => {
    expect(all('fieldset')).toHaveLength(5);
    for (const fieldset of all('fieldset')) {
      expect(fieldset.firstElementChild?.tagName, fieldset.id).toBe('LEGEND');
    }
    for (const radio of all('input[type="radio"]'))
      expect(radio.closest('fieldset')).not.toBeNull();
  });

  it('declares autocomplete and input purpose where there is one', () => {
    expect(document.getElementById('place')?.getAttribute('autocomplete')).toBe('address-level2');
    expect(document.getElementById('notes')?.getAttribute('autocomplete')).toBe('off');
    for (const number of all('input[type="number"]')) {
      expect(number.getAttribute('inputmode'), number.id).toMatch(/numeric|decimal/);
    }
  });

  it('never uses a placeholder as a label', () => {
    expect(all('[placeholder]')).toEqual([]);
  });

  it('gives every button a type and a text name', () => {
    for (const button of all('button')) {
      expect(button.getAttribute('type'), button.id).toMatch(/submit|button/);
      expect(button.textContent.trim(), button.id).not.toBe('');
    }
  });
});

describe('status and errors (3.3.1, 4.1.3)', () => {
  it('announces results politely and errors assertively', () => {
    const status = document.getElementById('status');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    const summary = document.getElementById('error-summary');
    expect(summary?.getAttribute('role')).toBe('alert');
    expect(summary?.getAttribute('tabindex')).toBe('-1');
  });
});

describe('colour is never the only signal (1.4.1)', () => {
  it('prints the AQI as a number, a category in words and a symbol', () => {
    for (const id of ['air-aqi', 'air-label', 'air-symbol']) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(document.getElementById('air-symbol')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks invalid fields with a thicker border and a message, not colour alone', () => {
    expect(rule("[aria-invalid='true']")).toContain('border-width: 3px');
  });

  it('puts no words in CSS generated content, where a screen reader may miss them', () => {
    expect(sheet.match(/content:\s*['"][^'"]*[a-z]/gi)).toBeNull();
  });
});

describe('keyboard and pointer (2.1.1, 2.4.7, 2.4.11, 2.5.8)', () => {
  it('uses only native interactive elements, with no positive tabindex or inline handlers', () => {
    for (const el of all('[tabindex]')) {
      expect(['-1', '0'], el.id).toContain(el.getAttribute('tabindex'));
    }
    expect(all('[role="button"], [onclick], [onchange], [onsubmit]')).toEqual([]);
    expect(html).not.toMatch(/\son[a-z]+=/);
  });

  it('draws a 3px focus ring on everything focusable, and never removes an outline', () => {
    expect(rule(':focus-visible')).toContain('outline: 3px solid var(--focus)');
    expect(sheet).not.toMatch(/outline:\s*(none|0)/);
  });

  it('sizes every target at 44px or more', () => {
    expect(tokenPx('target')).toBeGreaterThanOrEqual(44);
    for (const selector of [
      '.btn',
      'select,\ntextarea',
      '.choice',
      'details > summary',
      '.error-summary a',
    ]) {
      expect(rule(selector), selector).toContain('min-height: var(--target)');
    }
  });
});

describe('zoom, reflow and motion (1.4.4, 1.4.10, 1.4.12, 2.3.3)', () => {
  it('lets the visitor zoom', () => {
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
    expect(viewport).toBe('width=device-width, initial-scale=1');
  });

  it('sets body text at 18px in rem, so it follows the visitor’s font size', () => {
    expect(rule('body')).toContain('font-size: 1.125rem');
    expect(sheet).not.toMatch(/font-size:\s*\d+px/);
    const sizes = [...sheet.matchAll(/font-size: ([\d.]+)rem/g)].map((m) => Number(m[1]) * 16);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(17);
  });

  it('has no fixed width that would force sideways scrolling at 320px', () => {
    const widths = [...sheet.matchAll(/[^-]width:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(widths.filter((w) => w > 320)).toEqual([]);
    const columns = [...sheet.matchAll(/minmax\(([\d.]+)rem/g)].map((m) => Number(m[1]) * 18);
    expect(Math.max(...columns)).toBeLessThanOrEqual(320 - 32 - 60);
    expect(rule('.table-scroll')).toContain('overflow-x: auto');
  });

  it('honours prefers-reduced-motion and forced colours', () => {
    expect(sheet).toContain('@media (prefers-reduced-motion: reduce)');
    expect(sheet).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(sheet).toContain('@media (forced-colors: active)');
  });
});

describe('the page loads nothing it does not need', () => {
  it('has one module script, four stylesheets, no inline script or style, no third-party origin', () => {
    expect([...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0])).toEqual([
      '<script type="module" src="/js/main.js">',
    ]);
    expect([...html.matchAll(/<link rel="stylesheet"/g)]).toHaveLength(4);
    expect(html).not.toMatch(/<style\b|\sstyle=/);
    expect(html).not.toMatch(/https?:\/\//);
  });
});
