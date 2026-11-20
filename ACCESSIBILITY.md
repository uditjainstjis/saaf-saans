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
- **Lighthouse** 13.6.0 (Chrome 158) scored the deployed page 100 for
  accessibility on mobile and on desktop on 20 Nov 2026. That is a manual run
  against the live page, not part of the gate.

## Success criteria

| Criterion                                | How it is met                                                                                                                                                                                                                          | Where                                                                                                                         | Test                                                                                                                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1.1 Non-text content                   | No images; the AQI symbol is decorative (`aria-hidden`) beside the same information in text                                                                                                                                            | [index.html](public/index.html)                                                                                               | axe                                                                                                                                                                                                                      |
| 1.3.1 Info and relationships             | `header`, `main`, `footer` and a named `nav` for the parts of the plan; one `h1` and no skipped heading level; every section named by its heading; five fieldsets with legends; a data table with a caption and row and column headers | [index.html](public/index.html), [render-air.js](public/js/render-air.js)                                                     | [structure-page](test/a11y/structure-page.dom.test.ts), [structure-forms](test/a11y/structure-forms.dom.test.ts), [structure-navigation](test/a11y/structure-navigation.dom.test.ts)                                     |
| 1.3.5 Identify input purpose             | `autocomplete="address-level2"` on the place; `inputmode` on every number                                                                                                                                                              | [index.html](public/index.html)                                                                                               | [structure-forms](test/a11y/structure-forms.dom.test.ts)                                                                                                                                                                 |
| 1.4.1 Use of colour                      | The AQI band is a number, a category in words and a symbol that fills as the air worsens; an invalid field gets a thicker border and a text message                                                                                    | [aqi-bands.ts](src/features/air-quality/aqi-bands.ts), [results.css](public/css/results.css), [form.css](public/css/form.css) | [structure-status](test/a11y/structure-status.dom.test.ts)                                                                                                                                                               |
| 1.4.3 Contrast (minimum)                 | Text at 4.5:1 or better on every surface it sits on, in both themes                                                                                                                                                                    | [tokens.css](public/css/tokens.css)                                                                                           | [contrast-themes](test/a11y/contrast-themes.dom.test.ts)                                                                                                                                                                 |
| 1.4.4 Resize text                        | Font sizes in `rem`, 17px at the smallest and 18px for body text; zoom is never disabled                                                                                                                                               | [base.css](public/css/base.css)                                                                                               | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                                                                                                                                   |
| 1.4.10 Reflow                            | One column, no fixed width, grid columns of at most 11rem, the hourly table in its own scroll region                                                                                                                                   | [form.css](public/css/form.css), [results.css](public/css/results.css)                                                        | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                                                                                                                                   |
| 1.4.11 Non-text contrast                 | Field borders, their hover state, the focus ring, the error border and the AQI band markers at 3:1 or better                                                                                                                           | [tokens.css](public/css/tokens.css)                                                                                           | [contrast-themes](test/a11y/contrast-themes.dom.test.ts)                                                                                                                                                                 |
| 2.1.1 Keyboard                           | Native controls only; no positive `tabindex`, no click handlers on non-interactive elements                                                                                                                                            | [index.html](public/index.html)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                                                                                                                           |
| 2.3.3 Animation from interactions        | The only motion is a colour transition and smooth scrolling, both switched off under `prefers-reduced-motion: reduce`                                                                                                                  | [base.css](public/css/base.css)                                                                                               | [structure-zoom](test/a11y/structure-zoom.dom.test.ts)                                                                                                                                                                   |
| 2.4.1 Bypass blocks                      | A skip link is the first element and targets `main`; the results open with a navigation, "Sections of your plan", that links to each of their six parts                                                                                | [index.html](public/index.html)                                                                                               | [structure-page](test/a11y/structure-page.dom.test.ts), [structure-navigation](test/a11y/structure-navigation.dom.test.ts)                                                                                               |
| 2.4.2, 2.4.6 Titles, headings and labels | A descriptive title; headings use the words of the task; each "How this was calculated" disclosure is labelled with its card's title, so the disclosures of a plan do not share one name                                               | [index.html](public/index.html), [render-plan.js](public/js/render-plan.js)                                                   | [structure-page](test/a11y/structure-page.dom.test.ts), [render-plan](test/public/render-plan.dom.test.ts)                                                                                                               |
| 2.4.3 Focus order                        | After a submission, focus moves to the error summary or to the results; following a jump link moves focus to the heading it names, which is focusable (`tabindex="-1"`) but not a tab stop                                             | [errors.js](public/js/errors.js), [main.js](public/js/main.js), [index.html](public/index.html)                               | [errors-client](test/public/errors-client.dom.test.ts), [render-air](test/public/render-air.dom.test.ts), [structure-navigation](test/a11y/structure-navigation.dom.test.ts)                                             |
| 2.4.4 Link purpose (in context)          | Each jump link is named for the part it leads to, inside a navigation with its own name; no two links share a name; each reminder link's name adds its card's title and says that it opens in a new tab                                | [index.html](public/index.html)                                                                                               | [structure-navigation](test/a11y/structure-navigation.dom.test.ts)                                                                                                                                                       |
| 2.4.7 Focus visible                      | A 3px outline on `:focus-visible`; no rule removes an outline                                                                                                                                                                          | [base.css](public/css/base.css)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                                                                                                                           |
| 2.4.11 Focus not obscured                | Nothing is sticky or fixed, so nothing can cover the focused element                                                                                                                                                                   | [base.css](public/css/base.css)                                                                                               | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts)                                                                                                                                                           |
| 2.5.3 Label in name                      | A disclosure's accessible name is its visible text followed by the card's title ("How this was calculated: Seal door and window gaps"), so the name begins with the words on screen; the reminder link is named the same way           | [render-plan.js](public/js/render-plan.js)                                                                                    | [render-plan](test/public/render-plan.dom.test.ts)                                                                                                                                                                       |
| 2.5.8 Target size                        | Buttons, fields, choices, disclosures, jump links, reminder links and error links are at least 48px high                                                                                                                               | [tokens.css](public/css/tokens.css), [form.css](public/css/form.css), [results.css](public/css/results.css)                   | [structure-keyboard](test/a11y/structure-keyboard.dom.test.ts), [structure-navigation](test/a11y/structure-navigation.dom.test.ts)                                                                                       |
| 3.1.1 Language of page                   | `lang="en"`                                                                                                                                                                                                                            | [index.html](public/index.html)                                                                                               | [structure-page](test/a11y/structure-page.dom.test.ts)                                                                                                                                                                   |
| 3.3.1 Error identification               | An error summary that takes focus and lists every problem; each field marked `aria-invalid` with its message beside it and referenced by `aria-describedby`                                                                            | [errors.js](public/js/errors.js)                                                                                              | [errors-client](test/public/errors-client.dom.test.ts), [errors-server](test/public/errors-server.dom.test.ts)                                                                                                           |
| 3.3.2 Labels or instructions             | A visible label for every control; hints are text, never placeholders                                                                                                                                                                  | [index.html](public/index.html)                                                                                               | [structure-forms](test/a11y/structure-forms.dom.test.ts)                                                                                                                                                                 |
| 3.3.3 Error suggestion                   | Messages say what is accepted, for example "Adults must be between 1 and 12."                                                                                                                                                          | [limits.ts](src/config/limits.ts), [schemas.ts](src/features/plan/schemas.ts)                                                 | [schemas-bounds](test/features/plan/schemas-bounds.test.ts)                                                                                                                                                              |
| 4.1.2 Name, role, value                  | Every button has a type and a text name; the theme toggle exposes `aria-pressed`; the results navigation and each disclosure carry an `aria-label`; ids are unique and every ARIA reference resolves                                   | [index.html](public/index.html), [theme.js](public/js/theme.js), [render-plan.js](public/js/render-plan.js)                   | [structure-forms](test/a11y/structure-forms.dom.test.ts), [theme](test/public/theme.dom.test.ts), [structure-navigation](test/a11y/structure-navigation.dom.test.ts), [render-plan](test/public/render-plan.dom.test.ts) |
| 4.1.3 Status messages                    | Progress and results go to a polite live region; errors to an alert                                                                                                                                                                    | [dom.js](public/js/dom.js), [index.html](public/index.html)                                                                   | [structure-status](test/a11y/structure-status.dom.test.ts), [render-air](test/public/render-air.dom.test.ts)                                                                                                             |

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
- **Jump links move focus, not only the view.** The results are long, so they
  open with a navigation named "Sections of your plan": six links, one to each
  part. Every target heading has `tabindex="-1"`, so following a link puts
  keyboard focus and a screen reader's reading position on that heading without
  adding it to the tab order. The links wrap onto as many lines as they need and
  are left out of print.
- **One name for each disclosure.** Every card has a "How this was calculated"
  disclosure, so a plan has several. Read out of context, as in a screen
  reader's list of controls, identical names say nothing, so each is labelled
  with its card's title after the visible words.

## Checked in a browser

jsdom cannot lay a page out, so on 20 Nov 2026 the unmodified page was also
driven in headless Chrome 158 through the DevTools protocol, against a local
`wrangler dev`, at 390 px and 320 px wide:

- activating each of the six jump links from the keyboard moved focus to its
  heading, which then matched `:focus-visible`;
- Chrome's accessibility tree held one navigation, named "Sections of your
  plan", and named each disclosure "How this was calculated: " followed by its
  card's title;
- every jump link was 48px high, and the row took two lines at 390 px and three
  at 320 px;
- the page did not scroll sideways at either width, and the console stayed
  empty.

This was a check by hand, not part of `npm run check`.

## Limits of this evidence

The tests run in jsdom, which has no layout engine: they cannot observe rendered
pixel sizes or a real screen reader. In the automated suite, reflow and target
size are therefore asserted from the stylesheet's rules; the browser check above
measured them once. No session with a real screen reader is claimed here.
