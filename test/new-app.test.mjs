// NEW-1 (BUILD §5): new-app --no-remote, placeholders filled, committed gate proven; doctor sees a harnessed repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, SCRIPTS, tmpdir, childEnv, runScript, write, sh, harnessJson, FAIL_CMD, PASS_CMD } from './helpers.mjs';

const NEW_APP = path.join(SCRIPTS, 'new-app.mjs');

function newApp(name, parent, ...args) {
  const r = spawnSync(process.execPath, [NEW_APP, name, '--dir', parent, '--owner', 'josep-audenis', '--no-remote', '--json', ...args], {
    env: childEnv(),
    encoding: 'utf8',
    timeout: 120_000,
  });
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    // keep null
  }
  return { code: r.status, report, raw: r.stdout + r.stderr };
}

function allFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allFiles(p));
    else out.push(p);
  }
  return out;
}

test('new-app --no-remote: OWNER and APP_NAME replaced everywhere, one commit, gate proven', () => {
  const parent = tmpdir('apps');
  const r = newApp('my-app', parent);
  assert.equal(r.code, 0, r.raw);
  const app = path.join(parent, 'my-app');
  for (const f of allFiles(app)) {
    const text = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /APP_NAME/, f);
    assert.doesNotMatch(text, /@OWNER\b/, f);
  }
  assert.match(fs.readFileSync(path.join(app, '.github', 'CODEOWNERS'), 'utf8'), /^\/\.claude\/ @josep-audenis$/m);
  assert.equal(JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).name, 'my-app');
  assert.ok(fs.existsSync(path.join(app, '.gitignore')) && !fs.existsSync(path.join(app, 'gitignore')));
  assert.ok(!fs.existsSync(path.join(app, 'CLAUDE.skeleton.md')));
  assert.match(fs.readFileSync(path.join(app, 'CLAUDE.md'), 'utf8'), /^# my-app\n\nNext\.js/, 'the app contract, not the generic skeleton');
  assert.equal(sh('git', ['rev-list', '--count', 'HEAD'], app), '1');
  assert.equal(sh('git', ['status', '--porcelain'], app), '');
  assert.equal(r.report.gate.ok, true);
  assert.equal(r.report.gate.gate, 'committed');
  assert.equal(r.report.remote, 'skipped (--no-remote)');
  assert.ok(r.report.steps.some((s) => s.includes('gh secret set CLAUDE_CODE_OAUTH_TOKEN')));
});

test('new-app: the committed stop-gate blocks a broken check and passes a fixed one', () => {
  const parent = tmpdir('apps-gate');
  newApp('gate-app', parent);
  const app = path.join(parent, 'gate-app');
  const gate = path.join(app, '.claude', 'hooks', 'stop-gate.mjs');
  const stop = () => runScript(gate, { hook_event_name: 'Stop', cwd: app }, { cwd: app, env: { CLAUDE_PROJECT_DIR: app } });
  write(app, '.claude/harness.json', harnessJson(FAIL_CMD));
  const blocked = stop();
  assert.equal(blocked.code, 2, blocked.stderr);
  assert.match(blocked.stderr, /^Not done:/);
  write(app, '.claude/harness.json', harnessJson(PASS_CMD));
  assert.equal(stop().code, 0);
});

test('new-app: refuses bad names and a non-empty target', () => {
  const parent = tmpdir('apps-bad');
  assert.notEqual(newApp('Bad Name', parent).code, 0);
  write(parent, 'taken/file.txt', 'x');
  const r = newApp('taken', parent);
  assert.notEqual(r.code, 0);
  assert.match(r.raw, /already exists/);
});

test('doctor on a new app: every repo row passes, including the proven gate', () => {
  const parent = tmpdir('apps-doctor');
  newApp('doc-app', parent);
  const app = path.join(parent, 'doc-app');
  const home = tmpdir('home-newapp');
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, 'doctor.mjs'), '--home', home, '--repo', app, '--json', '--claude-bin', path.join(ROOT, 'test', 'fixtures', 'claude-version-stub.mjs')], {
    env: childEnv({}, home),
    encoding: 'utf8',
    timeout: 120_000,
  });
  const rows = Object.fromEntries(JSON.parse(r.stdout).rows.map((x) => [x.id, x]));
  for (const id of ['CTX-2', 'CTX-3', 'CTX-4', 'CTX-7', 'NIGHT-3', 'GATE-1', 'REV-1', 'REV-3']) {
    assert.equal(rows[id].status, 'PASS', `${id}: ${rows[id].detail}`);
  }
  assert.equal(rows['REV-2'].status, 'SKIP');
});

test('new-app: generated app installs and passes its checks', { skip: process.env.HARNESS_E2E !== '1' && 'set HARNESS_E2E=1' }, () => {
  const parent = tmpdir('apps-e2e');
  newApp('e2e-app', parent);
  const app = path.join(parent, 'e2e-app');
  const opts = { cwd: app, env: childEnv(), encoding: 'utf8', timeout: 900_000 };
  const install = spawnSync('pnpm install --frozen-lockfile', { ...opts, shell: true });
  assert.equal(install.status, 0, install.stdout + install.stderr);
  const check = spawnSync(process.execPath, ['.claude/hooks/check.mjs', '--all'], opts);
  assert.equal(check.status, 0, check.stdout + check.stderr);
});
