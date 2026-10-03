// DOC-1, DOC-2: README links every guide, relative links resolve, and the commands the docs show
// point at things that exist (skills, scripts). The final build phase keeps these true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PLUGIN } from './helpers.mjs';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const GUIDES = fs.readdirSync(path.join(ROOT, 'docs', 'guides')).filter((f) => f.endsWith('.md')).map((f) => `docs/guides/${f}`);
const DOCS = ['README.md', 'CLAUDE.md', 'ROADMAP.md', 'evals/README.md', 'experiments/README.md', 'experiments/001-stop-gate/README.md', ...GUIDES,
  ...fs.readdirSync(path.join(ROOT, 'docs', 'knowledge')).map((f) => `docs/knowledge/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'docs', 'decisions')).map((f) => `docs/decisions/${f}`)];

test('README links every guide in docs/guides/', () => {
  const readme = read('README.md');
  for (const g of GUIDES) assert.ok(readme.includes(`](${g})`), `README.md must link ${g}`);
});

test('every relative Markdown link in the docs resolves', () => {
  for (const doc of DOCS) {
    const text = read(doc).replace(/```[\s\S]*?```/g, '');
    for (const m of text.matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^[a-z]+:/i.test(target)) continue; // http(s), mailto
      assert.ok(fs.existsSync(path.resolve(ROOT, path.dirname(doc), target)), `${doc}: broken link ${target}`);
    }
  }
});

test('every /harness:<skill> the docs mention exists', () => {
  const skills = new Set(fs.readdirSync(path.join(PLUGIN, 'skills')));
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/\/harness:([a-z-]+)/g)) {
      if (m[1] === 'name') continue; // "/harness:<name>" for saved workflows
      assert.ok(skills.has(m[1]), `${doc} mentions /harness:${m[1]}, which is not a skill`);
    }
  }
});

test('every `node <repo path>` command in the docs points at a real file', () => {
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/\bnode ((?:evals|experiments|tools|test|plugins)\/[\w./-]+\.mjs)/g)) {
      if (/NNN|<|slug/.test(m[1])) continue; // placeholders for a future experiment
      assert.ok(fs.existsSync(path.join(ROOT, m[1])), `${doc}: ${m[1]} does not exist`);
    }
  }
});

test('npm scripts the docs mention exist', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  for (const doc of DOCS) {
    for (const m of read(doc).matchAll(/(?:`|^\s*)npm run ([\w:-]+)/gm)) assert.ok(scripts[m[1]], `${doc}: npm run ${m[1]} is not a script`);
  }
});

test('decision records: README table lists every record, each has the template sections (DOC-2)', () => {
  const dir = path.join(ROOT, 'docs', 'decisions');
  const records = fs.readdirSync(dir).filter((f) => /^\d{4}-.+\.md$/.test(f)).sort();
  const index = read('docs/decisions/README.md');
  for (const r of records) {
    const num = r.slice(0, 4);
    assert.match(index, new RegExp(`\\| ${num} \\|`), `docs/decisions/README.md lists ${num}`);
    const text = read(`docs/decisions/${r}`);
    for (const h of ['**Status:**', '## Context', '## Decision', '## Alternatives rejected', '## Consequences']) assert.ok(text.includes(h), `${r}: ${h}`);
  }
});

test('no placeholder left in the docs', () => {
  for (const doc of DOCS) assert.doesNotMatch(read(doc), /<you>/, `${doc} still has <you>`);
});
