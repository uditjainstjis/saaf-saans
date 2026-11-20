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
