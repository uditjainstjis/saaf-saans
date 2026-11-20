/**
 * The production Logger port: one structured line per event, which Workers
 * Logs indexes. The only module allowed to touch `console` (see eslint.config.js).
 */

import type { Logger } from './ports';

/** Writes each event as a structured warning. */
export const consoleLogger: Logger = {
  warn: (event, detail) => {
    console.warn({ event, ...detail });
  },
};
