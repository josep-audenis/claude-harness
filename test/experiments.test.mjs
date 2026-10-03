// LAB-1, LAB-6: experiment 001 is prepared (planned), and its variant differs from the baseline by one change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PLUGIN, tmpdir } from './helpers.mjs';
import { makeVariant } from '../experiments/001-stop-gate/make-variant.mjs';
import { listFiles } from '../evals/lib/tasks.mjs';

const EXP = path.join(ROOT, 'experiments', '001-stop-gate');

test('001 variant: identical to the baseline except the Stop hook (one change)', () => {
  const out = path.join(tmpdir('variant'), 'variant');
  const record = makeVariant(out);
  const base = listFiles(PLUGIN);
  assert.deepEqual(listFiles(out), [...base, 'VARIANT.json'].sort());
  const differing = base.filter((f) => fs.readFileSync(path.join(PLUGIN, f), 'utf8') !== fs.readFileSync(path.join(out, f), 'utf8'));
  assert.deepEqual(differing, ['hooks/hooks.json']);

  const a = JSON.parse(fs.readFileSync(path.join(PLUGIN, 'hooks', 'hooks.json'), 'utf8')).hooks;
  const b = JSON.parse(fs.readFileSync(path.join(out, 'hooks', 'hooks.json'), 'utf8')).hooks;
  assert.ok(a.Stop && !b.Stop);
  const { Stop, ...rest } = a;
  void Stop;
  assert.deepEqual(b, rest, 'every other hook unchanged');
  assert.equal(record.baselineVersion, JSON.parse(fs.readFileSync(path.join(PLUGIN, '.claude-plugin', 'plugin.json'), 'utf8')).version);
});

test('001 record: planned, with hypothesis, variant, run plan, cost estimate and a decision rule fixed in advance', () => {
  const md = fs.readFileSync(path.join(EXP, 'README.md'), 'utf8');
  assert.match(md, /\*\*Status:\*\* planned/);
  for (const h of ['## Hypothesis', '## Variant', '## Tasks and runs', '## Cost estimate', '## Run plan', '## Results', '## Decision']) assert.ok(md.includes(h), h);
  assert.match(md, /3 per variant per task/);
  assert.match(md, /node experiments\/001-stop-gate\/make-variant\.mjs/);
  assert.match(md, /--budget-usd/);
  assert.ok(!fs.existsSync(path.join(EXP, 'results.md')), 'not run yet');
  const registry = fs.readFileSync(path.join(ROOT, 'experiments', 'README.md'), 'utf8');
  assert.match(registry, /\| \[001\]\(001-stop-gate\/README\.md\) \| .+ \| planned \| pending \|/);
  assert.match(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8'), /^experiments\/\*\/variant\/$/m);
});
