/**
 * Tests for the console logger adapter.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { consoleLogger } from '../../src/lib/logger';
afterEach(() => {
  vi.restoreAllMocks();
});

it('consoleLogger writes one structured warning', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  consoleLogger.warn('thing_failed', { reason: 'x' });
  expect(warn).toHaveBeenCalledWith({ event: 'thing_failed', reason: 'x' });
});

it('consoleLogger writes what happened at the info level, not as a warning', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  consoleLogger.info('thing_done', { by: 'x' });
  expect(info).toHaveBeenCalledWith({ event: 'thing_done', by: 'x' });
  expect(warn).not.toHaveBeenCalled();
});
