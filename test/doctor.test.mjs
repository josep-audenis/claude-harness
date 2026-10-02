// Doctor: device rows on a fresh vs set-up home, repo rows and the gate proof (GATE-6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, SCRIPTS, tmpdir, childEnv, makeRepo, write, harnessJson, PASS_CMD } from './helpers.mjs';

const DOCTOR = path.join(SCRIPTS, 'doctor.mjs');
const STUB = path.join(ROOT, 'test', 'fixtures', 'claude-version-stub.mjs');

function doctor(home, ...args) {
  const r = spawnSync(process.execPath, [DOCTOR, '--home', home, '--claude-bin', STUB, '--json', ...args], {
    cwd: tmpdir('cwd'),
    env: childEnv({}, home),
    encoding: 'utf8',
    timeout: 120_000,
  });
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    // leave null; asserts below report stdout
  }
  return { code: r.status, report, raw: r.stdout + r.stderr };
}

const byId = (report) => Object.fromEntries(report.rows.map((r) => [r.id, r]));
const FLOOR_ROWS = ['DEV-3', 'DEV-6', 'DIST-3', 'SEC-1', 'SEC-2', 'SEC-6', 'CTX-1', 'LOOP-6', 'COST-1', 'COST-2', 'AGT-5'];

test('doctor: fresh home → device MUSTs fail and exit code 1', () => {
  const home = tmpdir('home-doc-fresh');
  const r = doctor(home, '--no-repo');
  assert.equal(r.code, 1, r.raw);
  const rows = byId(r.report);
  for (const id of ['DEV-2', 'DEV-3', 'DEV-6', 'SEC-1', 'SEC-2', 'CTX-1', 'LOOP-6']) assert.equal(rows[id].status, 'FAIL', id);
  assert.ok(r.report.mustFailures >= 7);
  assert.equal(rows['DEV-1 claude'].status, 'PASS', 'stub reports a new enough version');
});

test('doctor: after setup the device floor rows pass', () => {
  const home = tmpdir('home-doc-setup');
  const s = spawnSync(process.execPath, [path.join(SCRIPTS, 'setup.mjs'), '--home', home], { env: childEnv({}, home), encoding: 'utf8' });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  const rows = byId(doctor(home, '--no-repo').report);
  for (const id of FLOOR_ROWS) assert.equal(rows[id].status, 'PASS', `${id}: ${rows[id].detail}`);
  assert.equal(rows['DEV-1 tools'].status, 'PASS', rows['DEV-1 tools'].detail);
  assert.equal(rows['SEC-4'].status, process.platform === 'win32' ? 'SKIP' : 'PASS');
  assert.equal(rows['SEC-3'].status, 'WARN', 'auto-mode-setup not run yet');
});

test('doctor: DEV-2 passes when the plugin is installed and enabled', () => {
  const home = tmpdir('home-doc-plugin');
  const dir = path.join(home, '.claude');
  write(dir, 'plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'harness@josep-harness': [{ scope: 'user' }] } }));
  write(dir, 'settings.json', JSON.stringify({ enabledPlugins: { 'harness@josep-harness': true } }));
  assert.equal(byId(doctor(home, '--no-repo').report)['DEV-2'].status, 'PASS');
  write(dir, 'settings.json', JSON.stringify({ enabledPlugins: { 'harness@josep-harness': false } }));
  assert.equal(byId(doctor(home, '--no-repo').report)['DEV-2'].status, 'FAIL');
});

test('doctor: DIST-3 warns when the plugin is newer than the recorded setup', () => {
  const home = tmpdir('home-doc-dist');
  write(path.join(home, '.claude'), 'harness-device.json', JSON.stringify({ os: process.platform, harnessVersion: '0.0.1', setupDate: '2026-01-01' }));
  assert.equal(byId(doctor(home, '--no-repo').report)['DIST-3'].status, 'WARN');
});

test('doctor: SEC-2 keeps a user-chosen mode; SEC-6 fails on bypassPermissions', () => {
  const home = tmpdir('home-doc-mode');
  write(path.join(home, '.claude'), 'settings.json', JSON.stringify({ permissions: { defaultMode: 'plan' } }));
  assert.equal(byId(doctor(home, '--no-repo').report)['SEC-2'].status, 'PASS');
  write(path.join(home, '.claude'), 'settings.json', JSON.stringify({ permissions: { defaultMode: 'bypassPermissions' } }));
  assert.equal(byId(doctor(home, '--no-repo').report)['SEC-6'].status, 'FAIL');
});

// A minimal harnessed repo built from the plugin's own scripts (templates arrive in phase 5).
function harnessedRepo() {
  const files = {
    'CLAUDE.md': '# app\n\n## Commands\n- `npm test`\n',
    'AGENTS.md': 'Read CLAUDE.md: it is the contract for every agent.\n',
    'progress.md': '2026-10-03 init\n',
    'feature_list.json': JSON.stringify([{ id: 'x', description: 'X works', steps: ['run x'], passes: false }]),
    '.claude/harness.json': harnessJson(PASS_CMD),
    '.claude/settings.json': JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/stop-gate.mjs'] }] }] } }),
    '.claude/agents/reviewer.md': '---\nname: reviewer\ndescription: reviews\n---\nReview.\n',
    '.github/workflows/ci.yml': 'name: ci\n',
    '.github/workflows/review.yml': 'name: review\n',
    '.github/CODEOWNERS': '/.claude/ @me\n/.github/ @me\n/AGENTS.md @me\n/CLAUDE.md @me\n',
  };
  for (const f of ['stop-gate.mjs', 'lib.mjs']) files[`.claude/hooks/${f}`] = fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
  return makeRepo(files);
}

test('doctor: harnessed repo → every repo row passes, gate proven with the committed copy', () => {
  const home = tmpdir('home-doc-repo');
  const repo = harnessedRepo();
  const r = doctor(home, '--repo', repo);
  const rows = byId(r.report);
  for (const id of ['CTX-2', 'CTX-3', 'CTX-4', 'CTX-7', 'NIGHT-3', 'GATE-1', 'REV-1', 'REV-3']) {
    assert.equal(rows[id].status, 'PASS', `${id}: ${rows[id].detail}`);
  }
  assert.match(rows['GATE-1'].detail, /committed gate blocked a broken check and passed a fixed one/);
  assert.equal(rows['REV-2'].status, 'SKIP', 'no GitHub remote');
  // The proof works on a copy: the repo's own contract is untouched.
  assert.equal(fs.readFileSync(path.join(repo, '.claude', 'harness.json'), 'utf8'), harnessJson(PASS_CMD));
});

test('doctor: bare repo → repo rows fail with fixes', () => {
  const home = tmpdir('home-doc-bare');
  const repo = makeRepo({ 'CLAUDE.md': Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n') });
  const rows = byId(doctor(home, '--repo', repo).report);
  assert.equal(rows['CTX-2'].status, 'FAIL');
  assert.match(rows['CTX-2'].detail, /60 lines/);
  for (const id of ['CTX-3', 'CTX-4', 'NIGHT-3', 'REV-1', 'REV-3']) {
    assert.equal(rows[id].status, 'FAIL', id);
    assert.ok(rows[id].fix, `${id} has a fix`);
  }
  assert.equal(rows['GATE-1'].status, 'SKIP');
});

test('doctor: a gate that never blocks is caught by the proof', () => {
  const home = tmpdir('home-doc-broken-gate');
  const repo = harnessedRepo();
  fs.writeFileSync(path.join(repo, '.claude', 'hooks', 'stop-gate.mjs'), 'process.exit(0);\n');
  const rows = byId(doctor(home, '--repo', repo).report);
  assert.equal(rows['GATE-1'].status, 'FAIL');
  assert.match(rows['GATE-1'].detail, /did not block/);
});

test('doctor: table output and no --live by default', () => {
  const home = tmpdir('home-doc-table');
  const r = spawnSync(process.execPath, [DOCTOR, '--home', home, '--claude-bin', STUB, '--no-repo'], { env: childEnv({}, home), encoding: 'utf8' });
  assert.match(r.stdout, /^harness doctor v\d+\.\d+\.\d+/);
  assert.match(r.stdout, /\| Req \| Level \| Status \| Detail \| Fix \|/);
  assert.doesNotMatch(r.stdout, /GATE-1 live/);
});
