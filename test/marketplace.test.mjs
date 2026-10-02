// DIST-1, DIST-2: marketplace and plugin manifests are consistent. `claude plugin validate .`
// itself runs in CI (validate job) and locally, never inside npm test (BUILD rule 8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PLUGIN } from './helpers.mjs';

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('marketplace.json: required fields, one harness entry pointing at the plugin', () => {
  const m = read('.claude-plugin/marketplace.json');
  assert.equal(m.name, 'josep-harness');
  assert.match(m.name, /^[a-z0-9][a-z0-9._-]*$/);
  assert.ok(m.owner?.name, 'owner.name');
  assert.ok(m.metadata?.description, 'metadata.description (top-level description fails on older CLIs)');
  assert.ok(!('description' in m), 'no top-level description: Claude Code 2.1.92 rejects it');
  assert.equal(m.plugins.length, 1);
  const [entry] = m.plugins;
  assert.equal(entry.name, 'harness');
  assert.equal(entry.source, './plugins/harness');
  assert.ok(!entry.source.includes('..'));
  assert.ok(fs.existsSync(path.join(ROOT, entry.source, '.claude-plugin', 'plugin.json')));
});

test('plugin.json: name matches the entry, semver version, author, no bin/ or root CLAUDE.md', () => {
  const p = read('plugins/harness/.claude-plugin/plugin.json');
  assert.equal(p.name, read('.claude-plugin/marketplace.json').plugins[0].name, 'entry name equals manifest name');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  assert.ok(p.description && p.author?.name);
  assert.equal(fs.existsSync(path.join(PLUGIN, 'bin')), false, 'no top-level bin/ (claude.ai org sync rejects it)');
  assert.equal(fs.existsSync(path.join(PLUGIN, 'CLAUDE.md')), false, 'plugin CLAUDE.md is never loaded');
  assert.equal(fs.existsSync(path.join(PLUGIN, 'settings.json')), false, 'plugin settings.json honours only agent/subagentStatusLine');
});

test('CHANGELOG mentions the current plugin version or has an Unreleased section (DIST-2)', () => {
  const version = read('plugins/harness/.claude-plugin/plugin.json').version;
  const log = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  assert.ok(log.includes(`## ${version}`) || /## Unreleased/.test(log));
});

test('CI runs the suite on three OSes and validates the marketplace (DIST-4)', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'test.yml'), 'utf8');
  for (const os of ['ubuntu-latest', 'macos-latest', 'windows-latest']) assert.ok(yml.includes(os), os);
  assert.match(yml, /npm test/);
  assert.match(yml, /claude plugin validate \./);
});

test('this repo dogfoods its own Stop gate', () => {
  assert.deepEqual(read('.claude/harness.json'), { version: 1, check: ['npm test'] });
});
