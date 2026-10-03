// CTX-5, GATE-4, REC-1, notify, and the hooks.json wiring.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SCRIPTS, PLUGIN, runScript, makeRepo, tmpdir, write } from './helpers.mjs';

const script = (name) => path.join(SCRIPTS, name);

test('session-state: injects progress tail, commits and open-feature count', () => {
  const progress = Array.from({ length: 30 }, (_, i) => `entry ${i + 1}`).join('\n') + '\n';
  const features = [
    { id: 'a', description: 'Feature A', steps: [], passes: true },
    { id: 'b', description: 'Feature B', steps: [], passes: false },
  ];
  const dir = makeRepo({ 'progress.md': progress, 'feature_list.json': JSON.stringify(features) });
  const r = runScript(script('session-state.mjs'), { hook_event_name: 'SessionStart', source: 'startup' }, {
    cwd: dir,
    env: { CLAUDE_PROJECT_DIR: dir },
  });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /entry 30/);
  assert.match(r.stdout, /entry 11\n/);
  assert.doesNotMatch(r.stdout, /entry 10\n/);
  assert.match(r.stdout, /Last 8 commits/);
  assert.match(r.stdout, /init/);
  assert.match(r.stdout, /Features: 1 open of 2/);
  assert.match(r.stdout, /- b: Feature B/);
});

test('session-state: prints nothing and exits 0 without progress.md or feature_list.json', () => {
  const dir = makeRepo();
  const r = runScript(script('session-state.mjs'), {}, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } });
  assert.equal(r.code, 0);
  assert.equal(r.stdout, '');
});

test('session-state: exits 0 outside a git repo', () => {
  const dir = tmpdir('plain');
  write(dir, 'progress.md', 'one line\n');
  const r = runScript(script('session-state.mjs'), {}, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /one line/);
  assert.doesNotMatch(r.stdout, /Last 8 commits/);
});

test('format-changed: exits 0 with no formatter installed and leaves the file alone', () => {
  const dir = tmpdir('fmt');
  const content = 'const   x =1\n';
  for (const name of ['a.ts', 'b.py', 'c.txt']) {
    const file = write(dir, name, content);
    const r = runScript(script('format-changed.mjs'), { tool_name: 'Write', tool_input: { file_path: file } }, {
      cwd: dir,
      env: { CLAUDE_PROJECT_DIR: dir },
    });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(fs.readFileSync(file, 'utf8'), content);
  }
});

test('format-changed: exits 0 for a missing file and for empty input', () => {
  assert.equal(runScript(script('format-changed.mjs'), { tool_input: { file_path: 'nope.ts' } }).code, 0);
  assert.equal(runScript(script('format-changed.mjs'), {}).code, 0);
});

test('log-bash: appends exactly one valid JSON line per command', () => {
  const home = tmpdir('home-log');
  const input = {
    session_id: 's1',
    cwd: '/work',
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
    agent_type: 'implementer',
  };
  assert.equal(runScript(script('log-bash.mjs'), input, { home }).code, 0);
  const file = path.join(home, '.claude', 'logs', 'bash.jsonl');
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split('\n');
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.deepEqual(Object.keys(entry).sort(), ['agent', 'command', 'cwd', 'session', 'time']);
  assert.equal(entry.command, 'npm test');
  assert.equal(entry.session, 's1');
  assert.equal(entry.agent, 'implementer');

  runScript(script('log-bash.mjs'), { ...input, tool_input: { command: 'ls' } }, { home });
  assert.equal(fs.readFileSync(file, 'utf8').trimEnd().split('\n').length, 2);
});

test('log-bash: exits 0 on empty input without writing', () => {
  const home = tmpdir('home-log-empty');
  assert.equal(runScript(script('log-bash.mjs'), {}, { home }).code, 0);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'logs', 'bash.jsonl')), false);
});

test('notify: exits 0', () => {
  assert.equal(runScript(script('notify.mjs'), { message: 'Claude needs your permission' }).code, 0);
  assert.equal(runScript(script('notify.mjs'), 'garbage').code, 0);
});

test('hooks.json: exec form, every script exists, events match BUILD §3.1', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN, 'hooks', 'hooks.json'), 'utf8'));
  const seen = {};
  for (const [event, groups] of Object.entries(cfg.hooks)) {
    for (const g of groups) {
      for (const h of g.hooks) {
        assert.equal(h.type, 'command');
        assert.equal(h.command, 'node', 'exec form: command is node');
        assert.ok(Array.isArray(h.args) && h.args.length === 1);
        const rel = h.args[0].replace('${CLAUDE_PLUGIN_ROOT}/', '');
        assert.ok(fs.existsSync(path.join(PLUGIN, rel)), `${rel} exists`);
        seen[`${event}:${g.matcher ?? ''}`] = path.basename(rel);
        if (rel.endsWith('log-bash.mjs')) assert.equal(h.async, true);
        if (rel.endsWith('stop-gate.mjs')) assert.equal(h.timeout, 600);
      }
    }
  }
  assert.deepEqual(seen, {
    'SessionStart:startup|resume|compact': 'session-state.mjs',
    'PreToolUse:Bash': 'gate-bash.mjs',
    'PostToolUse:Bash': 'log-bash.mjs',
    'PostToolUse:Edit|Write': 'format-changed.mjs',
    'Stop:': 'stop-gate.mjs',
    'SubagentStop:harness:implementer|implementer': 'stop-gate.mjs',
    'Notification:': 'notify.mjs',
  });
});

test('scripts use Node built-ins only', () => {
  for (const f of fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mjs'))) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
    for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
      assert.ok(m[1].startsWith('node:') || m[1].startsWith('./'), `${f} imports ${m[1]}`);
    }
  }
});
