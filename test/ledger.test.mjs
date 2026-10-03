// SPEC §6.8, AGT-6, REC-4: the build ledger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRIPTS, makeRepo, commitAll, sh, write, childEnv, runScript } from './helpers.mjs';
import { parseBriefTasks, parse, render, summary } from '../plugins/harness/scripts/ledger.mjs';

const LEDGER = path.join(SCRIPTS, 'ledger.mjs');
const BRIEF = `# Dashboard

## Goal
Admin dashboard.

## Tasks
### T1: Data access for metrics
- Files: src/metrics.ts
### T2. Dashboard page | layout
- Files: app/dashboard/page.tsx
### T3 - Charts
- Files: app/dashboard/charts.tsx

## Budget
61 turns.
`;

const ledger = (dir, ...args) => {
  const r = spawnSync(process.execPath, [LEDGER, ...args, '--dir', dir], { env: childEnv(), encoding: 'utf8' });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
};

function briefRepo() {
  const dir = makeRepo();
  sh('git', ['checkout', '-q', '-b', 'feat/dash'], dir);
  write(dir, 'docs/briefs/dash.md', BRIEF);
  commitAll(dir, 'brief(dash): admin dashboard');
  return dir;
}

test('parseBriefTasks: "### T<n>:" headings under ## Tasks only, pipes cleaned', () => {
  assert.deepEqual(parseBriefTasks(BRIEF), [
    { id: 'T1', title: 'Data access for metrics' },
    { id: 'T2', title: 'Dashboard page / layout' },
    { id: 'T3', title: 'Charts' },
  ]);
  assert.deepEqual(parseBriefTasks('# x\n### T1: outside a Tasks section\n'), []);
});

test('render/parse round-trip', () => {
  const l = {
    id: 'dash', base: 'abc1234', started: '2026-10-03',
    tasks: [{ id: 'T1', title: 'A', status: 'done', rounds: 2, review: 'PASS', commits: ['aaa', 'bbb'] }, { id: 'T2', title: 'B', status: 'todo', rounds: 0, review: '', commits: [] }],
    qa: 'n/a (no init)', final: '', rulings: ['use SQLite views — faster — rewrite later if wrong'], parked: ['T1: naming nit — cosmetic'],
  };
  assert.deepEqual(parse(render(l)), l);
});

test('ledger CLI: init from the brief, set, ruling, park, qa, final, status --check', () => {
  const dir = briefRepo();
  const base = sh('git', ['rev-parse', '--short', 'HEAD'], dir);
  assert.equal(ledger(dir, 'status', 'dash').code, 2, 'no ledger yet');
  const init = ledger(dir, 'init', 'dash');
  assert.equal(init.code, 0, init.out);
  assert.match(init.out, /3 task\(s\)/);
  const file = path.join(dir, 'docs', 'briefs', 'dash.ledger.md');
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, new RegExp(`Base: ${base}`));
  assert.match(text, /\| T2 \| todo \| 0 \| - \| - \| Dashboard page \/ layout \|/);

  assert.equal(ledger(dir, 'init', 'dash').out.includes('resume'), true, 'init is a no-op on an existing ledger');
  assert.equal(ledger(dir, 'status', 'dash', '--check').code, 1);

  ledger(dir, 'set', 'dash', 'T1', '--status', 'done', '--rounds', '1', '--review', 'PASS', '--commit', 'aaa111');
  ledger(dir, 'set', 'dash', 'T2', '--status', 'done', '--review', 'PASS');
  ledger(dir, 'set', 'dash', 'T3', '--status', 'parked');
  ledger(dir, 'ruling', 'dash', 'charts via SVG — no new dependency — swap later');
  ledger(dir, 'park', 'dash', 'T3', 'animation polish — not in acceptance criteria');
  assert.equal(ledger(dir, 'set', 'dash', 'T9', '--status', 'done').code, 2);
  assert.equal(ledger(dir, 'set', 'dash', 'T1', '--status', 'finished').code, 2);

  let s = JSON.parse(ledger(dir, 'status', 'dash', '--json').out);
  assert.equal(s.done, 2);
  assert.equal(s.parked, 1);
  assert.equal(s.complete, false);
  assert.deepEqual(s.missing, ['QA not PASS', 'final review not PASS']);

  ledger(dir, 'qa', 'dash', 'PASS 4/4 criteria in the browser');
  ledger(dir, 'final', 'dash', 'PASS');
  s = JSON.parse(ledger(dir, 'status', 'dash', '--json').out);
  assert.equal(s.complete, true);
  assert.equal(s.rulings, 1);
  assert.equal(ledger(dir, 'status', 'dash', '--check').code, 0);
  assert.match(fs.readFileSync(file, 'utf8'), /- Ruling: charts via SVG — no new dependency — swap later/);
});

test('summary: QA n/a counts as passed; blocked tasks are reported', () => {
  const s = summary({ id: 'x', tasks: [{ id: 'T1', title: 'a', status: 'blocked', rounds: 4, review: '', commits: [] }], qa: 'n/a (no app)', final: '', rulings: [], parked: [] });
  assert.deepEqual(s.blocked, ['T1']);
  assert.equal(s.next.id, 'T1');
  assert.ok(!s.missing.includes('QA not PASS'));
});

test('ledger init: refuses a brief without a Tasks section', () => {
  const dir = makeRepo({ 'docs/briefs/x.md': '# x\n## Goal\ny\n' });
  const r = ledger(dir, 'init', 'x');
  assert.equal(r.code, 2);
  assert.match(r.out, /no "## Tasks" section/);
});

test('session-state: injects the ledger for the feat/<id> branch with the next task', () => {
  const dir = briefRepo();
  ledger(dir, 'init', 'dash');
  ledger(dir, 'set', 'dash', 'T1', '--status', 'done');
  ledger(dir, 'ruling', 'dash', 'one query per widget — simpler — slower');
  const r = runScript(path.join(SCRIPTS, 'session-state.mjs'), { hook_event_name: 'SessionStart', source: 'compact' }, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /### Build ledger: docs\/briefs\/dash\.ledger\.md/);
  assert.match(r.stdout, /1 done, 0 parked of 3 tasks/);
  assert.match(r.stdout, /Next: T2 \(Dashboard page \/ layout\)/);
  assert.match(r.stdout, /Continue with \/harness:build dash/);
  assert.match(r.stdout, /- Ruling: one query per widget/);
});
