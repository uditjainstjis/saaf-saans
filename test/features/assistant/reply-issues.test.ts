/**
 * Tests for the sentence checks: a text cut at its length limit, or one with
 * a word missing, is rejected with a reason a model can act on, and every
 * proper sentence passes. Ids and numbers are tested through ./reply-checks.test.ts.
 */
import { expect, it } from 'vitest';
import { issuesIn } from '../../../src/features/assistant/reply-issues';
import { goodReply } from '../../support/assistant-fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();

it('finds nothing wrong with a complete reply', () => {
  expect(issuesIn(goodReply(brief), brief)).toEqual([]);
});

it('rejects a summary that stops mid-sentence, as one cut at its length limit does', () => {
  const reply = goodReply(brief);
  reply.summary = 'Air in Delhi is unhealthy and the cleanest hour is 3 pm. The family’s';
  expect(issuesIn(reply, brief)).toEqual([
    'The summary stops mid-sentence; write it shorter and end it with a full stop.',
  ]);
});

it('rejects an explanation and a closing line with no final stop, naming each', () => {
  const reply = goodReply(brief);
  const [first] = reply.explanations;
  const cut = { ...reply, encouragement: 'You are doing well; keep going' };
  cut.explanations = [
    { id: first?.id ?? '', text: 'This suits your household because' },
    ...reply.explanations.slice(1),
  ];
  expect(issuesIn(cut, brief)).toEqual([
    'The explanation for "shift-outdoor-time" stops mid-sentence; write it shorter and end it with a full stop.',
    'The encouragement stops mid-sentence; write it shorter and end it with a full stop.',
  ]);
});

it.each([
  'Keep going, it is working!',
  'Shall we start with the bedroom tonight?',
  'She said: “start with the bedroom.”',
  'Start with the bedroom (it is the easiest.)',
  'They call it "clean breath."',
])('accepts the ending of %j', (encouragement) => {
  expect(issuesIn({ ...goodReply(brief), encouragement }, brief)).toEqual([]);
});

it.each(['Start with the bedroom,', 'Start with the bedroom…', 'Start with the bedroom."x'])(
  'rejects the ending of %j',
  (encouragement) => {
    expect(issuesIn({ ...goodReply(brief), encouragement }, brief)).toHaveLength(1);
  },
);

it('rejects a text with a gap where the model dropped a word, naming it', () => {
  const reply = goodReply(brief);
  const gapped = { ...reply, summary: 'Keep windows shut through the  hours to protect everyone.' };
  expect(issuesIn(gapped, brief)).toEqual([
    'The summary has a gap where a word is missing; write the sentence again in full.',
  ]);
});

it('accepts two spaces after a full stop, which is a typing habit and not a gap', () => {
  const spaced = { ...goodReply(brief), summary: 'The air is unhealthy today.  Start indoors.' };
  expect(issuesIn(spaced, brief)).toEqual([]);
});
