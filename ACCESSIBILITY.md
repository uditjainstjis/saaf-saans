# Accessibility

The page is built to WCAG 2.2 level AA. Each criterion below names where it is
implemented and the automated test that holds it, so the claim is checked on
every run of `npm run check` rather than asserted once.

## What is tested, and how

- **axe-core** runs over the real `index.html` with the real stylesheets in five
  states (empty form, community form, error summary shown, a family's results
  with every disclosure open, a community's results with the injection notice)
  and in both themes, with the WCAG 2.0, 2.1 and 2.2 A and AA rule sets and
  axe's best-practice rules. A negative control proves the audit can fail.
  ([axe-form.dom.test.ts](test/a11y/axe-form.dom.test.ts),
  [axe-results.dom.test.ts](test/a11y/axe-results.dom.test.ts))
- **Contrast** is computed from the design tokens for every colour pair the
  stylesheets use, in both themes, because axe cannot decide contrast without
  layout. ([contrast-themes.dom.test.ts](test/a11y/contrast-themes.dom.test.ts))
- **Structure** is checked on the shipped markup and CSS.
  ([test/a11y/structure-\*.dom.test.ts](test/a11y/))
- **Behaviour** (focus moves, live regions, error links) is checked in the page
  tests. ([test/public/](test/public/))

## Success criteria

| Criterion                                | How it is met                                                                                                                                                                              | Where                                                                                                                         | Test                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1.1.1 Non-text content                   | No images; the AQI symbol is decorative (`aria-hidden`) beside the same information in text                                                                                                | [index.html](public/index.html)                                                                                               | axe                                                                                                              |
| 1.3.1 Info and relationships             | `header`, `main`, `footer`; one `h1` and no skipped heading level; every section named by its heading; five fieldsets with legends; a data table with a caption and row and column headers | [index.html](public/index.html), [render-air.js](public/js/render-air.js)                                                     | [structure-page](test/a11y/structure-page.dom.test.ts), [structure-forms](test/a11y/structure-forms.dom.test.ts) |
| 1.3.5 Identify input purpose             | `autocomplete="address-level2"` on the place; `inputmode` on every number                                                                                                                  | [index.html](public/index.html)                                                                                               | [structure-forms](test/a11y/structure-forms.dom.test.ts)                                                         |
| 1.4.1 Use of colour                      | The AQI band is a number, a category in words and a symbol that fills as the air worsens; an invalid field gets a thicker border and a text message                                        | [aqi-bands.ts](src/features/air-quality/aqi-bands.ts), [results.css](public/css/results.css), [form.css](public/css/form.css) | [structure-status](test/a11y/structure-status.dom.test.ts)                                                       |
| 1.4.3 Contrast (minimum)                 | Text at 4.5:1 or better on every surface it sits on, in both themes                                                                                                                        | [tokens.css](public/css/tokens.css)                                                                                           | [contrast-themes](test/a11y/contrast-themes.dom.test.ts)                                                         |
| 1.4.4 Resize text                        | Font sizes in `rem`, 17px at the smallest and 18px for body text; zoom is never disabled                                                                                                   | [base.css](public/css/base.css)                                                                                               | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                           |
| 1.4.10 Reflow                            | One column, no fixed width, grid columns of at most 11rem, the hourly table in its own scroll region                                                                                       | [form.css](public/css/form.css), [results.css](public/css/results.css)                                                        | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                           |
| 1.4.11 Non-text contrast                 | Field borders, their hover state, the focus ring, the error border and the AQI band markers at 3:1 or better                                                                               | [tokens.css](public/css/tokens.css)                                                                                           | [contrast-themes](test/a11y/contrast-themes.dom.test.ts)                                                         |
| 2.1.1 Keyboard                           | Native controls only; no positive `tabindex`, no click handlers on non-interactive elements                                                                                                | [index.html](public/index.html)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                   |
| 2.3.3 Animation from interactions        | The only motion is a colour transition and smooth scrolling, both switched off under `prefers-reduced-motion: reduce`                                                                      | [base.css](public/css/base.css)                                                                                               | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                           |
| 2.4.1 Bypass blocks                      | A skip link is the first element and targets `main`                                                                                                                                        | [index.html](public/index.html)                                                                                               | [structure-page](test/a11y/structure-page.dom.test.ts)                                                           |
| 2.4.2, 2.4.6 Titles, headings and labels | A descriptive title; headings use the words of the task                                                                                                                                    | [index.html](public/index.html)                                                                                               | [structure-page](test/a11y/structure-page.dom.test.ts)                                                           |
| 2.4.3 Focus order                        | After a submission, focus moves to the error summary or to the results                                                                                                                     | [errors.js](public/js/errors.js), [main.js](public/js/main.js)                                                                | [errors-client](test/public/errors-client.dom.test.ts), [render-air](test/public/render-air.dom.test.ts)         |
| 2.4.7 Focus visible                      | A 3px outline on `:focus-visible`; no rule removes an outline                                                                                                                              | [base.css](public/css/base.css)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                   |
| 2.4.11 Focus not obscured                | Nothing is sticky or fixed, so nothing can cover the focused element                                                                                                                       | [base.css](public/css/base.css)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                   |
| 2.5.8 Target size                        | Buttons, fields, choices, disclosures and error links are at least 48px high                                                                                                               | [tokens.css](public/css/tokens.css), [form.css](public/css/form.css)                                                          | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                   |
| 3.1.1 Language of page                   | `lang="en"`                                                                                                                                                                                | [index.html](public/index.html)                                                                                               | [structure-page](test/a11y/structure-page.dom.test.ts)                                                           |
| 3.3.1 Error identification               | An error summary that takes focus and lists every problem; each field marked `aria-invalid` with its message beside it and referenced by `aria-describedby`                                | [errors.js](public/js/errors.js)                                                                                              | [errors-client](test/public/errors-client.dom.test.ts), [errors-server](test/public/errors-server.dom.test.ts)   |
| 3.3.2 Labels or instructions             | A visible label for every control; hints are text, never placeholders                                                                                                                      | [index.html](public/index.html)                                                                                               | [structure-forms](test/a11y/structure-forms.dom.test.ts)                                                         |
| 3.3.3 Error suggestion                   | Messages say what is accepted, for example "Adults must be between 1 and 12."                                                                                                              | [limits.ts](src/config/limits.ts), [schemas.ts](src/features/plan/schemas.ts)                                                 | [schemas-bounds](test/features/plan/schemas-bounds.test.ts)                                                      |
| 4.1.2 Name, role, value                  | Every button has a type and a text name; the theme toggle exposes `aria-pressed`; ids are unique and every ARIA reference resolves                                                         | [index.html](public/index.html), [theme.js](public/js/theme.js)                                                               | [structure-forms](test/a11y/structure-forms.dom.test.ts), [theme](test/public/theme.dom.test.ts)                 |
| 4.1.3 Status messages                    | Progress and results go to a polite live region; errors to an alert                                                                                                                        | [dom.js](public/js/dom.js), [index.html](public/index.html)                                                                   | [structure-status](test/a11y/structure-status.dom.test.ts), [render-air](test/public/render-air.dom.test.ts)     |

## Measured contrast

Worst case over the surfaces each colour is used on, computed from
[tokens.css](public/css/tokens.css):

| Pair                        | Light | Dark  | Required |
| --------------------------- | ----- | ----- | -------- |
| Body text on the page       | 15.87 | 16.32 | 4.5      |
| Soft text                   | 7.05  | 8.55  | 4.5      |
| Accent text and links       | 5.58  | 8.36  | 4.5      |
| Button text on the accent   | 6.41  | 9.24  | 4.5      |
| Error text                  | 5.72  | 9.54  | 4.5      |
| Text on an AQI band tint    | 12.91 | 12.57 | 4.5      |
| Field border                | 4.38  | 5.21  | 3        |
| Focus ring                  | 5.55  | 8.42  | 3        |
| AQI band marker on its tint | 4.44  | 8.28  | 3        |

## Design decisions

- **`aria-disabled`, not `disabled`, on the submit button.** While a request is
  in flight the button is marked `aria-disabled="true"`, its label changes to
  "Reading your air…" and further activations are ignored. A `disabled` button
  would drop out of the tab order and lose focus for someone who had just
  pressed it with the keyboard; this one stays focusable and announces its
  state.
- **Light by default, dark by choice.** A toggle with `aria-pressed` switches
  the theme and remembers it; both themes pass the same contrast tests.
- **Motion and forced colours.** `prefers-reduced-motion: reduce` switches off
  transitions and smooth scrolling. Under `forced-colors: active`, buttons,
  cards and the AQI band get a system-colour border, since backgrounds are
  dropped.
- **Text, not markup.** Results are written with `textContent`, so a screen
  reader hears exactly what is shown, including the "AI explanation" label on
  model-written text.
- **The hidden mode is really hidden.** The fieldset for the mode not chosen is
  both `hidden` and `disabled`, so it is skipped by keyboard, by assistive
  technology and by submission.

## Limits of this evidence

The tests run in jsdom, which has no layout engine: they cannot observe rendered
pixel sizes or a real screen reader. Reflow and target size are therefore
asserted from the stylesheet's rules, and no manual screen-reader session is
claimed here.
