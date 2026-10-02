// AGT-1 agent roles, skill frontmatter, and the helper scripts behind AGT-2, AGT-3 and LOOP-2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PLUGIN, SCRIPTS, runScript, makeRepo, commitAll, sh, write, harnessJson, childEnv, PASS_CMD, FAIL_CMD } from './helpers.mjs';
import { isTestPath } from '../plugins/harness/scripts/lib.mjs';

// Minimal frontmatter reader: `key: value` lines between the leading --- fences.
function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(m, `${file} has frontmatter`);
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return { data, body: m[2] };
}
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean).sort();

const AGT1 = {
  planner: { tools: ['Glob', 'Grep', 'Read', 'Write'], model: 'opus' },
  'test-writer': { tools: ['Bash', 'Edit', 'Glob', 'Grep', 'Read', 'Write'], model: 'sonnet' },
  implementer: { tools: ['Bash', 'Edit', 'Glob', 'Grep', 'Read', 'Write'], model: 'sonnet', isolation: 'worktree' },
  reviewer: { tools: ['Bash', 'Glob', 'Grep', 'Read'], model: 'sonnet' },
};

test('agents: exactly the four AGT-1 agents with their tools and models', () => {
  const files = fs.readdirSync(path.join(PLUGIN, 'agents')).filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(files, Object.keys(AGT1).map((n) => `${n}.md`).sort());
  for (const [name, want] of Object.entries(AGT1)) {
    const { data, body } = frontmatter(path.join(PLUGIN, 'agents', `${name}.md`));
    assert.equal(data.name, name);
    assert.ok(data.description && data.description.length > 40, `${name} description`);
    assert.deepEqual(list(data.tools), want.tools, `${name} tools`);
    assert.equal(data.model, want.model, `${name} model`);
    assert.equal(data.isolation, want.isolation, `${name} isolation`);
    assert.ok(body.trim().length > 200, `${name} has a real prompt`);
    for (const ignored of ['hooks', 'mcpServers', 'permissionMode']) assert.ok(!(ignored in data), `${name}: plugin agents ignore ${ignored}`);
  }
});

test('agents: the reviewer has no edit tools; the planner cannot run commands', () => {
  const reviewer = frontmatter(path.join(PLUGIN, 'agents', 'reviewer.md'));
  for (const t of ['Edit', 'Write', 'NotebookEdit']) {
    assert.ok(!list(reviewer.data.tools).includes(t));
    assert.ok(list(reviewer.data.disallowedTools).includes(t));
  }
  assert.match(reviewer.body, /first line is exactly `PASS` or `CHANGES_REQUESTED`/);
  const planner = frontmatter(path.join(PLUGIN, 'agents', 'planner.md'));
  assert.ok(!list(planner.data.tools).includes('Bash') && !list(planner.data.tools).includes('Edit'));
});

const SKILLS = { setup: true, doctor: false, brief: true, 'verify-done': false, 'review-loop': true };

test('skills: names, descriptions, side-effect skills are user-only, referenced scripts exist', () => {
  for (const [name, userOnly] of Object.entries(SKILLS)) {
    const file = path.join(PLUGIN, 'skills', name, 'SKILL.md');
    const { data, body } = frontmatter(file);
    assert.equal(data.name, name);
    assert.ok(data.description && data.description.length > 60 && data.description.length < 1536, `${name} description`);
    assert.equal(data['disable-model-invocation'] === 'true', userOnly, `${name} disable-model-invocation`);
    for (const m of body.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/([a-z-]+\.mjs)/g)) {
      assert.ok(fs.existsSync(path.join(SCRIPTS, m[1])), `${name} references ${m[1]}`);
    }
    assert.doesNotMatch(body, /^\s*!`/m, `${name} avoids !\`cmd\` injection (bash-only, aborts on failure)`);
  }
});

test('brief skill: never implements, hands off a /goal that names the proving commands and a turn cap', () => {
  const { body } = frontmatter(path.join(PLUGIN, 'skills', 'brief', 'SKILL.md'));
  assert.match(body, /Never implement the feature/);
  assert.match(body, /harness:planner/);
  assert.match(body, /harness:test-writer/);
  const goal = body.match(/```\n(\/goal [\s\S]*?)\n```/);
  assert.ok(goal, 'prints a /goal block');
  assert.match(goal[1], /--all` exits 0/, 'names the proving command (LOOP-2)');
  assert.match(goal[1], /TESTDIFF> <BASE>` exits 0/, 'executed "no test file modified" (LOOP-2)');
  assert.match(goal[1], /Stop after <N> turns\.$/, 'turn cap (LOOP-2)');
  assert.ok(goal[1].length < 4000, '/goal condition fits 4,000 chars');
});

test('isTestPath: recognises test files across stacks', () => {
  for (const p of ['tests/a.py', 'src/__tests__/x.ts', 'a.test.ts', 'b.spec.tsx', 'test_cli.py', 'pkg/x_test.go', 'e2e/smoke.spec.ts', 'test/unit.mjs']) {
    assert.ok(isTestPath(p), p);
  }
  for (const p of ['src/app.ts', 'docs/briefs/x.md', 'testing.md', 'latest/x.ts', 'contest.py']) assert.ok(!isTestPath(p), p);
});

const CHECK = path.join(SCRIPTS, 'check.mjs');
const TESTDIFF = path.join(SCRIPTS, 'test-diff.mjs');

test('check.mjs: pass, fail with tail, --all, and missing config', () => {
  const ok = makeRepo({ '.claude/harness.json': harnessJson(PASS_CMD) });
  const r1 = runScript(CHECK, '', { cwd: ok });
  assert.equal(r1.code, 0, r1.stdout + r1.stderr);
  assert.match(r1.stdout, /PASS: all 1 check\(s\) exit 0/);

  const marker = 'node -e "require(\'fs\').writeFileSync(\'ran.txt\', \'1\')"';
  const bad = makeRepo({ '.claude/harness.json': JSON.stringify({ version: 1, check: [FAIL_CMD, marker] }) });
  const r2 = runScript(CHECK, '', { cwd: bad });
  assert.equal(r2.code, 1);
  assert.match(r2.stdout, /✖ `node -e "process\.exit\(1\)"` exit 1/);
  assert.match(r2.stdout, /1 not run after the first failure/);
  assert.equal(fs.existsSync(path.join(bad, 'ran.txt')), false);

  const all = run(CHECK, ['--all', '--dir', bad]);
  assert.equal(all.code, 1);
  assert.ok(fs.existsSync(path.join(bad, 'ran.txt')), '--all keeps going after a failure');

  assert.equal(runScript(CHECK, '', { cwd: makeRepo() }).code, 2, 'no harness.json');
});

function run(script, args) {
  const r = spawnSync(process.execPath, [script, ...args], { env: childEnv(), encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

test('test-diff.mjs: flags committed, staged and untracked test changes; ignores source changes', () => {
  const dir = makeRepo({ 'src/a.js': 'x\n', 'tests/a.test.js': 'old\n' });
  const base = sh('git', ['rev-parse', 'HEAD'], dir);
  write(dir, 'src/a.js', 'y\n');
  commitAll(dir, 'src change');
  assert.equal(run(TESTDIFF, [base, '--dir', dir]).code, 0);

  write(dir, 'tests/new.test.js', 'new\n');
  const untracked = run(TESTDIFF, [base, '--dir', dir]);
  assert.equal(untracked.code, 1);
  assert.match(untracked.out, /tests\/new\.test\.js/);

  fs.rmSync(path.join(dir, 'tests', 'new.test.js'));
  write(dir, 'tests/a.test.js', 'weakened\n');
  commitAll(dir, 'tamper');
  const committed = run(TESTDIFF, [base, '--dir', dir]);
  assert.equal(committed.code, 1);
  assert.match(committed.out, /tests\/a\.test\.js/);

  assert.equal(run(TESTDIFF, ['no-such-ref', '--dir', dir]).code, 2);
});

// Stop gate and brief commits (AGT-2 vs GATE-1).
const GATE = path.join(SCRIPTS, 'stop-gate.mjs');
const stop = (dir) => runScript(GATE, { hook_event_name: 'Stop', cwd: dir }, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } });

function briefRepo(extra = {}) {
  const dir = makeRepo({ '.claude/harness.json': harnessJson(FAIL_CMD), 'src/app.js': 'x\n' });
  sh('git', ['checkout', '-q', '-b', 'feat/x'], dir);
  write(dir, 'docs/briefs/x.md', '# x\n');
  write(dir, 'feature_list.json', '[]\n');
  write(dir, 'tests/x.test.js', 'red\n');
  for (const [rel, content] of Object.entries(extra)) write(dir, rel, content);
  commitAll(dir, 'brief(x): add x');
  return dir;
}

test('stop-gate: clean brief commit (brief + feature entry + tests) is red by design → exit 0', () => {
  assert.equal(stop(briefRepo()).code, 0);
});

test('stop-gate: brief commit that also touches source → gated', () => {
  assert.equal(stop(briefRepo({ 'src/app.js': 'sneaky\n' })).code, 2);
});

test('stop-gate: edits after a brief commit re-arm the gate', () => {
  const dir = briefRepo();
  write(dir, 'src/app.js', 'work in progress\n');
  assert.equal(stop(dir).code, 2);
  commitAll(dir, 'feat(x): implement');
  assert.equal(stop(dir).code, 2);
});

test('stop-gate: a commit merely mentioning brief is not a brief commit', () => {
  const dir = makeRepo({ '.claude/harness.json': harnessJson(FAIL_CMD) });
  sh('git', ['checkout', '-q', '-b', 'feat/y'], dir);
  write(dir, 'tests/y.test.js', 'x\n');
  commitAll(dir, 'add brief(y) tests');
  assert.equal(stop(dir).code, 2);
});
