import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slugify.mjs';
import { postPath } from '../src/posts.mjs';

test('lowercases and joins words with dashes', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});

test('removes accents', () => {
  assert.equal(slugify('Café crème'), 'cafe-creme');
});

test('trims punctuation and spaces at both ends', () => {
  assert.equal(slugify('  Hello, World!  '), 'hello-world');
});

test('post paths use the slug', () => {
  assert.equal(postPath({ title: 'Why we moved to SQLite?' }), '/blog/why-we-moved-to-sqlite');
});
