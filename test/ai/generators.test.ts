import { describe, expect, it } from 'vitest';
import {
  cachedPlanGenerator,
  fallbackPlanGenerator,
  modelPlanGenerator,
  rulePlanGenerator,
} from '../../src/ai/generators';
import { NARRATIVE_JSON_SCHEMA } from '../../src/ai/narrative';
import { SYSTEM_PROMPT } from '../../src/ai/prompt';
import { MODEL, workersAi } from '../../src/ai/workers-ai';
import type { PlanGenerator, TextGenerator } from '../../src/ports';
import { briefFor, COMMUNITY, FAMILY } from '../support/fixtures';
import {
  brokenGenerator,
  fixedGenerator,
  goodReply,
  memoryCache,
  NARRATIVE,
  recordingLogger,
  scriptedText,
} from '../support/fakes';

const brief = briefFor();

describe('modelPlanGenerator', () => {
  it('asks once when the first reply passes, with the system prompt and the schema', async () => {
    const text = scriptedText({ response: goodReply(brief) });
    const narrative = await modelPlanGenerator(text).generate(brief);
    expect(narrative.source).toBe('model');
    expect(text.requests).toHaveLength(1);
    expect(text.requests[0]?.system).toBe(SYSTEM_PROMPT);
    expect(text.requests[0]?.schema).toBe(NARRATIVE_JSON_SCHEMA);
    expect(text.requests[0]?.prompt).toMatch(/<<<SAAF_[0-9a-f]{32}\n/);
  });

  it('repairs once: the retry carries the reasons the first reply was rejected', async () => {
    const bad = { ...goodReply(brief), summary: 'This will add 25 years to your life, truly.' };
    const text = scriptedText({ response: bad }, { response: goodReply(brief) });
    const narrative = await modelPlanGenerator(text).generate(brief);
    expect(narrative.source).toBe('model');
    expect(text.requests).toHaveLength(2);
    expect(text.requests[1]?.prompt).toContain('The number 25 is not in the FACTS; remove it.');
  });

  it('rejects when the repair is rejected too, and never asks a third time', async () => {
    const text = scriptedText('nonsense', 'more nonsense', { response: goodReply(brief) });
    await expect(modelPlanGenerator(text).generate(brief)).rejects.toThrow('rejected twice');
    expect(text.requests).toHaveLength(2);
  });

  it('rejects when the model host fails or hangs past the timeout', async () => {
    await expect(
      modelPlanGenerator(scriptedText(new Error('binding down'))).generate(brief),
    ).rejects.toThrow('binding down');
    const hung: TextGenerator = { complete: () => new Promise<never>(() => undefined) };
    await expect(modelPlanGenerator(hung, 5).generate(brief)).rejects.toThrow('exceeded 5ms');
  });
});

describe('rulePlanGenerator', () => {
  it('writes the narrative from the plan alone, quoting only computed figures', async () => {
    const narrative = await rulePlanGenerator.generate(brief);
    expect(narrative.source).toBe('rules');
    expect(narrative.summary).toBe(
      `Air in Delhi is unhealthy right now, with a US AQI of 186. ${brief.advisory} The 6 changes below would keep everyone in the plan from breathing in about 1,593.2 µg of PM2.5 a day, and save about 32.6 kg CO2e a week.`,
    );
    expect(narrative.explanations['switch-commute']).toBe(
      'Direct impact: about 32.6 kg CO2e a week not emitted.',
    );
  });

  it('counts only new changes', async () => {
    const metro = briefFor({ ...FAMILY, commute: 'metro' });
    expect((await rulePlanGenerator.generate(metro)).summary).toContain('The 5 changes below');
  });
});

describe('fallbackPlanGenerator', () => {
  it('uses the primary when it works', async () => {
    const logger = recordingLogger();
    const generator = fallbackPlanGenerator(fixedGenerator(), rulePlanGenerator, logger);
    expect(await generator.generate(brief)).toEqual(NARRATIVE);
    expect(logger.events).toEqual([]);
  });

  it('falls back to rules when the model is unavailable, so the assistant always answers', async () => {
    const logger = recordingLogger();
    const generator = fallbackPlanGenerator(brokenGenerator, rulePlanGenerator, logger);
    expect((await generator.generate(brief)).source).toBe('rules');
    expect(logger.events).toEqual(['plan_generator_failed']);
  });
});

describe('cachedPlanGenerator', () => {
  it('generates once per distinct brief', async () => {
    const text = scriptedText({ response: goodReply(brief) });
    const cache = memoryCache();
    const generator = cachedPlanGenerator(modelPlanGenerator(text), cache);
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
    const generator = cachedPlanGenerator(modelPlanGenerator(text), memoryCache());
    await generator.generate(brief);
    await generator.generate(other);
    expect(text.requests).toHaveLength(2);
  });

  it('does not cache a failure', async () => {
    const cache = memoryCache();
    await expect(cachedPlanGenerator(brokenGenerator, cache).generate(brief)).rejects.toThrow();
    expect(cache.entries.size).toBe(0);
  });
});

describe('every PlanGenerator is substitutable (Liskov)', () => {
  const generators: [string, PlanGenerator][] = [
    ['rules', rulePlanGenerator],
    ['model', modelPlanGenerator(scriptedText({ response: goodReply(brief) }))],
    ['fallback', fallbackPlanGenerator(brokenGenerator, rulePlanGenerator, recordingLogger())],
    ['cached', cachedPlanGenerator(rulePlanGenerator, memoryCache())],
  ];

  it.each(generators)(
    '%s explains every recommendation and nothing else',
    async (_n, generator) => {
      const narrative = await generator.generate(brief);
      expect(Object.keys(narrative.explanations).sort()).toEqual(
        brief.plan.recommendations.map((r) => r.id).sort(),
      );
      expect(narrative.summary.length).toBeGreaterThan(20);
      expect(narrative.encouragement.length).toBeGreaterThan(5);
    },
  );
});

describe('workersAi', () => {
  it('turns one request into one run call, passing the schema and the abort signal', async () => {
    const calls: unknown[][] = [];
    const generator = workersAi({
      run: async (...args) => {
        calls.push(args);
        return { response: '{}' };
      },
    });
    const signal = new AbortController().signal;
    const request = { system: 'S', prompt: 'P', schema: { type: 'object' }, maxTokens: 50 };
    expect(await generator.complete(request, signal)).toEqual({ response: '{}' });
    expect(calls).toEqual([
      [
        MODEL,
        {
          messages: [
            { role: 'system', content: 'S' },
            { role: 'user', content: 'P' },
          ],
          response_format: { type: 'json_schema', json_schema: { type: 'object' } },
          max_tokens: 50,
          temperature: 0.3,
        },
        { signal },
      ],
    ]);
  });
});
