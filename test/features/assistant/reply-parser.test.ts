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

/** A Gemini interaction with these steps. */
const steps = (...list: unknown[]): object => ({ status: 'completed', steps: list });
const output = (...texts: string[]): object => ({
  type: 'model_output',
  content: texts.map((text) => ({ type: 'text', text })),
});

it('unwraps a Gemini interaction: the last model output, after any thought steps', () => {
  const thought = { type: 'thought', signature: 'sig', summary: [{ type: 'text', text: '{}' }] };
  expect(extractJson(steps(thought, output(JSON.stringify(obj))))).toEqual(obj);
  expect(extractJson(steps(output('{"summary":"draft"}'), output(JSON.stringify(obj))))).toEqual(
    obj,
  );
});

it('joins the text blocks of a Gemini output and skips blocks without text', () => {
  const image = { type: 'image', data: 'AAAA' };
  const split = {
    type: 'model_output',
    content: [{ type: 'text', text: '{"summary":' }, image, 'x'],
  };
  expect(
    extractJson(steps({ ...split, content: [...split.content, { text: '"hello"}' }] })),
  ).toEqual(obj);
});

it('reads a Gemini interaction with no usable output as no reply at all', () => {
  expect(extractJson({ status: 'incomplete', steps: [] })).toBeNull();
  expect(extractJson(steps({ type: 'thought', signature: 'sig' }))).toBeNull();
  expect(extractJson(steps({ type: 'model_output' }))).toBeNull();
  expect(extractJson(steps(output('{"summary": "cut off')))).toBeNull();
  expect(extractJson({ steps: 'none' })).toBeNull();
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
