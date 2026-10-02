// DEV-3, DEV-6, SEC-1, SEC-2, CTX-1, LOOP-6: setup.mjs merges the floor without losing anything.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRIPTS, PLUGIN, tmpdir, childEnv } from './helpers.mjs';

const SETUP = path.join(SCRIPTS, 'setup.mjs');
const floor = JSON.parse(fs.readFileSync(path.join(PLUGIN, 'machine', 'settings.floor.json'), 'utf8'));

function setup(home, ...args) {
  const r = spawnSync(process.execPath, [SETUP, '--home', home, ...args], { env: childEnv({}, home), encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

// Snapshot every file under ~/.claude except backups.
function snapshot(home) {
  const dir = path.join(home, '.claude');
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isFile()) out[f] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

// The shape of Josep's real settings.json at kickoff: hooks, statusLine, plugins, marketplaces.
const REAL_SHAPE = {
  hooks: {
    SessionStart: [{ hooks: [{ type: 'command', command: 'node "C:/Users/x/.claude/hooks/caveman-activate.js"', timeout: 5 }] }],
    UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node "C:/Users/x/.claude/hooks/caveman-mode-tracker.js"', timeout: 5 }] }],
  },
  statusLine: { type: 'command', command: 'powershell -File statusline.ps1' },
  enabledPlugins: { 'caveman@caveman': true },
  extraKnownMarketplaces: { caveman: { source: { source: 'github', repo: 'JuliusBrussee/caveman' } } },
  autoUpdatesChannel: 'latest',
};

function seededHome(settings, claudeMd) {
  const home = tmpdir('home-setup');
  const dir = path.join(home, '.claude');
  fs.mkdirSync(dir, { recursive: true });
  if (settings) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings, null, 2) + '\n');
  if (claudeMd !== undefined) fs.writeFileSync(path.join(dir, 'CLAUDE.md'), claudeMd);
  return home;
}

test('setup: unrelated key, existing deny rule and defaultMode plan all survive', () => {
  const home = seededHome({ theme: 'dark', permissions: { deny: ['Bash(rm -rf *)', 'Read(~/.ssh/**)'], defaultMode: 'plan' } });
  const r = setup(home);
  assert.equal(r.code, 0, r.out);
  const s = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
  assert.equal(s.theme, 'dark');
  assert.equal(s.permissions.defaultMode, 'plan');
  assert.ok(s.permissions.deny.includes('Bash(rm -rf *)'));
  for (const rule of floor.permissions.deny) assert.ok(s.permissions.deny.includes(rule), rule);
  assert.equal(new Set(s.permissions.deny).size, s.permissions.deny.length, 'no duplicate deny rules');
  assert.equal(s.permissions.deny.filter((x) => x === 'Read(~/.ssh/**)').length, 1);
  assert.match(r.out, /permissions\.defaultMode: kept "plan".*SEC-2/);
});

test('setup: fresh home gets defaultMode auto, sandbox, env, effort', () => {
  const home = tmpdir('home-fresh');
  assert.equal(setup(home).code, 0);
  const s = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
  assert.equal(s.permissions.defaultMode, 'auto');
  assert.equal(s.sandbox.enabled, true);
  assert.equal(s.env.CLAUDE_CODE_SUBAGENT_MODEL, 'sonnet');
  assert.equal(s.effortLevel, 'high');
  assert.ok(!JSON.stringify(s).includes('bypassPermissions'), 'SEC-6');
  assert.ok(!('hooks' in s), 'setup adds no hooks; the plugin supplies them');
});

test("setup: Josep's real settings shape survives intact", () => {
  const home = seededHome(REAL_SHAPE);
  assert.equal(setup(home).code, 0);
  const s = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
  for (const [k, v] of Object.entries(REAL_SHAPE)) assert.deepEqual(s[k], v, k);
});

test('setup: CLAUDE.md keeps text outside the markers; block is inserted once', () => {
  const before = '# graphify\n- my own rule\n';
  const home = seededHome(null, before);
  setup(home);
  const text = fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8');
  assert.ok(text.startsWith(before));
  assert.equal(text.split('<!-- harness:start -->').length, 2);
  assert.match(text, /Never claim done without pasting the command/);
  assert.match(text, /<!-- harness:end -->\n$/);
});

test('setup: an outdated marker block is replaced, text around it kept (CRLF preserved)', () => {
  const before = 'top line\r\n<!-- harness:start -->\r\nold rules\r\n<!-- harness:end -->\r\nbottom line\r\n';
  const home = seededHome(null, before);
  const r = setup(home);
  assert.match(r.out, /CLAUDE\.md \| UPDATED/);
  const text = fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8');
  assert.ok(text.startsWith('top line\r\n<!-- harness:start -->\r\n'));
  assert.ok(text.endsWith('<!-- harness:end -->\r\nbottom line\r\n'));
  assert.doesNotMatch(text, /old rules/);
  assert.doesNotMatch(text.replace(/\r\n/g, ''), /\n/, 'no bare LF mixed into a CRLF file');
});

test('setup: writes loop.md and the device record', () => {
  const home = tmpdir('home-loop');
  setup(home);
  const dir = path.join(home, '.claude');
  assert.match(fs.readFileSync(path.join(dir, 'loop.md'), 'utf8'), /^Check the pull request for the current branch\./);
  const device = JSON.parse(fs.readFileSync(path.join(dir, 'harness-device.json'), 'utf8'));
  assert.equal(device.os, process.platform);
  assert.equal(device.harnessVersion, JSON.parse(fs.readFileSync(path.join(PLUGIN, '.claude-plugin', 'plugin.json'), 'utf8')).version);
  assert.match(device.setupDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('setup: a different existing loop.md is backed up before it is replaced', () => {
  const home = tmpdir('home-loop2');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'loop.md'), 'my own loop\n');
  const r = setup(home);
  assert.match(r.out, /loop\.md \| UPDATED/);
  const backups = fs.readdirSync(path.join(home, '.claude', '.harness-backup'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(home, '.claude', '.harness-backup', backups[0], 'loop.md'), 'utf8'), 'my own loop\n');
});

test('setup: second run is byte-identical and makes no new backup', () => {
  const home = seededHome(REAL_SHAPE, '# mine\n');
  setup(home);
  const first = snapshot(home);
  const backups = fs.readdirSync(path.join(home, '.claude', '.harness-backup')).length;
  const r = setup(home);
  assert.equal(r.code, 0);
  assert.match(r.out, /Nothing to change/);
  assert.deepEqual(snapshot(home), first);
  assert.equal(fs.readdirSync(path.join(home, '.claude', '.harness-backup')).length, backups);
});

test('setup: --undo restores the previous files and removes the ones setup created', () => {
  const home = seededHome({ theme: 'dark' }, '# mine\n');
  const before = snapshot(home);
  setup(home);
  assert.notDeepEqual(snapshot(home), before);
  const r = setup(home, '--undo');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /RESTORED/);
  assert.match(r.out, /REMOVED/);
  assert.deepEqual(snapshot(home), before);
  assert.equal(setup(home, '--undo').code, 1, 'nothing left to undo');
});

test('setup: --dry-run writes nothing', () => {
  const home = seededHome({ theme: 'dark' }, '# mine\n');
  const before = snapshot(home);
  const r = setup(home, '--dry-run');
  assert.equal(r.code, 0);
  assert.match(r.out, /DRY RUN/);
  assert.match(r.out, /MERGED \(would\)/);
  assert.deepEqual(snapshot(home), before);
  assert.equal(fs.existsSync(path.join(home, '.claude', '.harness-backup')), false);

  const empty = tmpdir('home-dry-empty');
  setup(empty, '--dry-run');
  assert.equal(fs.existsSync(path.join(empty, '.claude')), false);
});

test('setup: invalid settings.json aborts and changes nothing', () => {
  const home = tmpdir('home-bad');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{ not json');
  const before = snapshot(home);
  const r = setup(home);
  assert.equal(r.code, 1);
  assert.match(r.out, /isn't valid JSON/);
  assert.deepEqual(snapshot(home), before);
});
