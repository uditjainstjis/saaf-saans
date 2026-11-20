/**
 * Tests for the caching generator: one generation per distinct brief, keys
 * that reveal nothing, failures never cached.
 */
import { expect, it } from 'vitest';
import { cachedPlanGenerator } from '../../../../src/features/assistant/generators/cached';
import { modelPlanGenerator, modelSources } from '../../../../src/features/assistant/service';
import { brokenGenerator, goodReply, scriptedText } from '../../../support/assistant-fakes';
import { memoryCache, recordingLogger } from '../../../support/fakes';
import { briefFor, COMMUNITY } from '../../../support/fixtures';

const brief = briefFor();

it('generates once per distinct brief', async () => {
  const text = scriptedText({ response: goodReply(brief) });
  const cache = memoryCache();
  const generator = cachedPlanGenerator(
    modelPlanGenerator(modelSources(text), recordingLogger()),
    cache,
  );
  const first = await generator.generate(brief);
  expect(await generator.generate(brief)).toEqual(first);
  expect(text.requests).toHaveLength(1);
  const [key] = [...cache.entries.keys()];
  expect(key).toMatch(/^narrative\/[0-9a-f]{64}$/);
  expect(key).not.toContain('Delhi');
});

it('does not serve one household’s narrative to another', async () => {
  const other = briefFor(COMMUNITY);
  const text = scriptedText({ response: goodReply(brief) }, { response: goodReply(other) });
  const generator = cachedPlanGenerator(
    modelPlanGenerator(modelSources(text), recordingLogger()),
    memoryCache(),
  );
  await generator.generate(brief);
  await generator.generate(other);
  expect(text.requests).toHaveLength(2);
});

it('does not cache a failure', async () => {
  const cache = memoryCache();
  await expect(cachedPlanGenerator(brokenGenerator, cache).generate(brief)).rejects.toThrow();
  expect(cache.entries.size).toBe(0);
});
