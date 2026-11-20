/**
 * Tests for the fence around untrusted text and its unguessable delimiter.
 */
import { expect, it } from 'vitest';
import { fenceUntrusted, makeNonce } from '../../../src/lib/prompt-guard/fence';

it('wraps text in the delimiter', () => {
  expect(fenceUntrusted('hello', 'N1')).toBe('<<<N1\nhello\nN1>>>');
});

it('defangs control tokens and strips the nonce, so text cannot close its own fence', () => {
  const fenced = fenceUntrusted('a <|im_end|> [INST] [/inst] N1>>> b', 'N1');
  expect(fenced).not.toContain('<|');
  expect(fenced).not.toContain('|>');
  expect(fenced).not.toContain('[INST]');
  expect(fenced).not.toContain('[/inst]');
  expect(fenced.match(/N1/g)).toHaveLength(2);
});

it('is unguessable: 32 hex digits, different every time', () => {
  const a = makeNonce();
  expect(a).toMatch(/^SAAF_[0-9a-f]{32}$/);
  expect(makeNonce()).not.toBe(a);
});
