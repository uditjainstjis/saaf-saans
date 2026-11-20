/**
 * The production Logger port: one structured line per event, which Workers
 * Logs indexes. The only module allowed to touch `console` (see eslint.config.js).
 */

import type { Logger } from './ports';

/** Writes each event as one structured line, at the level it was reported. */
export const consoleLogger: Logger = {
  info: (event, detail) => {
    console.info({ event, ...detail });
  },
  warn: (event, detail) => {
    console.warn({ event, ...detail });
  },
};
