/**
 * Tests for the reply parser: every envelope and wrapper a model reply can
 * arrive in, and what is not a reply at all.
 */
import { expect, it } from 'vitest';
import { extractJson, isRecord } from '../../../src/features/assistant/reply-parser';

const obj = { summary: 'hello' };

it('reads an object the host already parsed', () => {
  expect(extractJson(obj)).toEqual(obj);
});

it('unwraps the Workers AI `response` envelope, parsed or as text', () => {
  expect(extractJson({ response: obj })).toEqual(obj);
  expect(extractJson({ response: JSON.stringify(obj) })).toEqual(obj);
});

it('unwraps OpenAI-style choices, preferring them over an empty response', () => {
  const choices = [{ message: { content: JSON.stringify(obj) } }];
  expect(extractJson({ choices, response: '' })).toEqual(obj);
  expect(extractJson({ choices: [{ text: JSON.stringify(obj) }] })).toEqual(obj);
});

it('falls through unusable choices to the response', () => {
  expect(extractJson({ choices: [], response: obj })).toEqual(obj);
  expect(extractJson({ choices: ['x'], response: obj })).toEqual(obj);
  expect(extractJson({ choices: [{ message: 'x' }], response: obj })).toEqual(obj);
});

it('strips a fenced code block and surrounding prose', () => {
  expect(extractJson('```json\n{"summary":"hello"}\n```')).toEqual(obj);
  expect(extractJson('Here you go: {"summary":"hello"} Hope it helps!')).toEqual(obj);
});

it('returns null when there is no JSON object', () => {
  expect(extractJson('no json here')).toBeNull();
  expect(extractJson('[1, 2]')).toBeNull();
  expect(extractJson('{broken')).toBeNull();
  expect(extractJson('prose [1] } {')).toBeNull();
  expect(extractJson(42)).toBeNull();
  expect(extractJson(null)).toBeNull();
  expect(extractJson({ response: null })).toBeNull();
});

it('accepts plain objects only', () => {
  expect(isRecord({})).toBe(true);
  expect(isRecord([])).toBe(false);
  expect(isRecord(null)).toBe(false);
  expect(isRecord('x')).toBe(false);
});
