import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAlias, normaliseAlias, makeBirthdayAlias } from './src/utils/aliases.js';

test('makeAlias returns a URL-safe alias of requested length', () => {
  for (const length of [3, 7, 12, 24]) {
    const alias = makeAlias(length);
    assert.equal(alias.length, length);
    assert.match(alias, /^[a-z2-9]+$/);
  }
});

test('normaliseAlias lowercases and strips unsupported characters', () => {
  assert.equal(normaliseAlias('My Page!_2026'), 'mypage_2026');
  assert.equal(normaliseAlias(' HELLO-world '), 'hello-world');
});

test('makeBirthdayAlias stays within the 40-character database limit', () => {
  const alias = makeBirthdayAlias('A very long recipient name that would overflow a URL alias');
  assert.ok(alias.length >= 3 && alias.length <= 40);
  assert.match(alias, /^[a-z0-9-]+$/);
  assert.match(makeBirthdayAlias('!!!'), /^birthday-[a-z2-9]{4}$/);
});
