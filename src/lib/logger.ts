import type { Logger } from './ports';

/** The production {@link Logger}: one structured line per event, which Workers Logs indexes. */
export const consoleLogger: Logger = {
  warn: (event, detail) => {
    console.warn({ event, ...detail });
  },
};
