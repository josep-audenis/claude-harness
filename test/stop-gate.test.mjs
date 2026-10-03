// GATE-1, GATE-2, GATE-3: the Stop gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SCRIPTS, PLUGIN, runScript, makeRepo, commitAll, sh, write, harnessJson, PASS_CMD, FAIL_CMD } from './helpers.mjs';

const GATE = path.join(SCRIPTS, 'stop-gate.mjs');
const stop = (dir, { script = GATE, env = {} } = {}) =>
  runScript(script, { hook_event_name: 'Stop', cwd: dir, stop_hook_active: false }, {
    cwd: dir,
    env: { CLAUDE_PROJECT_DIR: dir, ...env },
  });

const contract = (cmd) => ({ '.claude/harness.json': harnessJson(cmd) });

test('stop-gate: no harness.json → exit 0', () => {
  const dir = makeRepo();
  write(dir, 'dirty.txt', 'x');
  assert.equal(stop(dir).code, 0);
});

test('stop-gate: failing check and dirty tree → exit 2 with GATE-1 message', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^Not done: `node -e "process\.exit\(1\)"` exited 1\./);
  assert.match(r.stderr, /last 40 lines/);
  assert.match(r.stderr, /Fix the cause, not the test\./);
});

test('stop-gate: passing check and dirty tree → exit 0', () => {
  const dir = makeRepo(contract(PASS_CMD));
  write(dir, 'dirty.txt', 'x');
  assert.equal(stop(dir).code, 0);
});

test('stop-gate: failing check, clean tree, nothing ahead of main → exit 0', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  assert.equal(stop(dir).code, 0);
});

test('stop-gate: failing check, clean tree, one commit ahead of main → exit 2', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  sh('git', ['checkout', '-q', '-b', 'feature'], dir);
  write(dir, 'feature.txt', 'x');
  commitAll(dir, 'feature');
  const r = stop(dir);
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /Not done:/);
});

test('stop-gate: untracked file alone counts as dirty', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  write(dir, 'new-file.txt', 'x');
  assert.equal(stop(dir).code, 2);
});

test('stop-gate: checks run in order and stop at the first failure', () => {
  const marker = 'node -e "require(\'fs\').writeFileSync(\'ran.txt\', \'1\')"';
  const dir = makeRepo({
    '.claude/harness.json': JSON.stringify({ version: 1, check: [PASS_CMD, FAIL_CMD, marker] }),
  });
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /process\.exit\(1\)/);
  assert.equal(fs.existsSync(path.join(dir, 'ran.txt')), false);
});

test('stop-gate: failure output tail is included', () => {
  const noisy = 'node -e "for (let i = 1; i <= 60; i++) console.log(\'line \' + i); process.exit(3)"';
  const dir = makeRepo(contract(noisy));
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /exited 3/);
  assert.match(r.stderr, /line 60/);
  assert.match(r.stderr, /line 21\n/);
  assert.doesNotMatch(r.stderr, /line 20\n/);
});

function commitGateCopy(dir) {
  for (const f of ['stop-gate.mjs', 'lib.mjs']) {
    fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
    fs.copyFileSync(path.join(SCRIPTS, f), path.join(dir, '.claude', 'hooks', f));
  }
}

test('stop-gate: plugin copy defers to a committed stop-gate (GATE-3)', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  commitGateCopy(dir);
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir, { env: { CLAUDE_PLUGIN_ROOT: PLUGIN } });
  assert.equal(r.code, 0, r.stderr);
});

test('stop-gate: committed copy, failing check, dirty tree → exit 2', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  commitGateCopy(dir);
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir, { script: path.join(dir, '.claude', 'hooks', 'stop-gate.mjs') });
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /Not done:/);
});

test('stop-gate: committed copy still gates when CLAUDE_PLUGIN_ROOT leaks into its env', () => {
  const dir = makeRepo(contract(FAIL_CMD));
  commitGateCopy(dir);
  write(dir, 'dirty.txt', 'x');
  const r = stop(dir, {
    script: path.join(dir, '.claude', 'hooks', 'stop-gate.mjs'),
    env: { CLAUDE_PLUGIN_ROOT: PLUGIN },
  });
  assert.equal(r.code, 2, r.stderr);
});

// GATE-8: the implementer subagent can't finish red. The hook input's cwd is the subagent's worktree.
function worktreeRepo(check) {
  const main = makeRepo(contract(check));
  const wt = path.join(path.dirname(main), `${path.basename(main)}-wt`);
  sh('git', ['worktree', 'add', '-q', '-b', 'impl-1', wt], main);
  return { main, wt };
}
const subagentStop = (wt, main, env = {}) =>
  runScript(GATE, { hook_event_name: 'SubagentStop', cwd: wt, agent_type: 'harness:implementer', stop_hook_active: false }, {
    cwd: main,
    env: { CLAUDE_PROJECT_DIR: main, ...env },
  });

test('stop-gate (SubagentStop): red checks in the worktree block the implementer', () => {
  const { main, wt } = worktreeRepo(FAIL_CMD);
  write(wt, 'work.txt', 'x');
  const r = subagentStop(wt, main);
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /^Not done:/);
  assert.match(r.stderr, /You are the implementer/);
  assert.equal(stop(main).code, 0, 'the main checkout is clean: the main Stop gate skips');
});

test('stop-gate (SubagentStop): green checks in the worktree let it finish', () => {
  const { main, wt } = worktreeRepo(PASS_CMD);
  write(wt, 'work.txt', 'x');
  assert.equal(subagentStop(wt, main).code, 0);
});

test('stop-gate (SubagentStop): never defers to a committed copy (the repo copy only registers Stop)', () => {
  const { main, wt } = worktreeRepo(FAIL_CMD);
  commitGateCopy(wt);
  write(wt, 'work.txt', 'x');
  assert.equal(subagentStop(wt, main, { CLAUDE_PLUGIN_ROOT: PLUGIN }).code, 2);
});

test('stop-gate: checks see which gate runs them (HARNESS_GATE_EVENT)', () => {
  const probe = 'node -e "require(\'fs\').appendFileSync(\'events.txt\', process.env.HARNESS_GATE_EVENT + \'\\n\'); process.exit(1)"';
  const { main, wt } = worktreeRepo(probe);
  write(wt, 'work.txt', 'x');
  subagentStop(wt, main);
  write(main, 'dirty.txt', 'x');
  stop(main);
  assert.equal(fs.readFileSync(path.join(wt, 'events.txt'), 'utf8').trim(), 'SubagentStop');
  assert.equal(fs.readFileSync(path.join(main, 'events.txt'), 'utf8').trim(), 'Stop');
});

test('stop-gate: harness.json with no checks → exit 0', () => {
  const dir = makeRepo({ '.claude/harness.json': '{"version":1,"check":[]}' });
  write(dir, 'dirty.txt', 'x');
  assert.equal(stop(dir).code, 0);
});
