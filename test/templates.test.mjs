// BUILD §1/§3.4/§3.6 and rule 5: the committed repo layer, the app skeleton, and drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PLUGIN, ROOT, makeRepo, write, runScript, childEnv, tmpdir, harnessJson, FAIL_CMD, PASS_CMD } from './helpers.mjs';
import { MAPPINGS, generate } from '../tools/sync-templates.mjs';

const REPO_T = path.join(PLUGIN, 'templates', 'repo');
const APP_T = path.join(PLUGIN, 'templates', 'app');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8').replace(/\r\n/g, '\n');
const lines = (text) => text.trimEnd().split('\n').length;

test('drift: every committed copy in templates/repo matches its generated source', () => {
  for (const [source, target, kind] of MAPPINGS) {
    const rel = path.relative(ROOT, target);
    assert.ok(fs.existsSync(target), `${rel} exists (run npm run sync-templates)`);
    assert.equal(read(target), generate(source, kind), `${rel} drifted from ${path.relative(ROOT, source)}; run npm run sync-templates`);
  }
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'sync-templates.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
});

test('templates/repo: has every file BUILD §1 lists', () => {
  for (const f of [
    'CLAUDE.skeleton.md', 'AGENTS.md', 'feature_list.json', 'progress.md', 'NIGHT-LOG.md', 'docs/briefs/.gitkeep',
    '.claude/settings.json', '.claude/hooks/stop-gate.mjs', '.claude/hooks/format-changed.mjs', '.claude/hooks/check.mjs',
    '.claude/hooks/lib.mjs', '.claude/hooks/test-diff.mjs', '.claude/agents/reviewer.md',
    '.github/workflows/ci.yml', '.github/workflows/review.yml', '.github/ISSUE_TEMPLATE/defect.yml', '.github/CODEOWNERS.fragment',
  ]) {
    assert.ok(fs.existsSync(path.join(REPO_T, f)), f);
  }
  assert.deepEqual(JSON.parse(read(REPO_T, 'feature_list.json')), []);
});

test('templates/repo: settings wire the committed Stop gate and formatter in exec form, worktrees branch from HEAD', () => {
  const s = JSON.parse(read(REPO_T, '.claude', 'settings.json'));
  const stop = s.hooks.Stop[0].hooks[0];
  assert.deepEqual([stop.command, stop.args], ['node', ['${CLAUDE_PROJECT_DIR}/.claude/hooks/stop-gate.mjs']]);
  assert.equal(stop.timeout, 600);
  const fmt = s.hooks.PostToolUse.find((g) => g.matcher === 'Edit|Write').hooks[0];
  assert.deepEqual(fmt.args, ['${CLAUDE_PROJECT_DIR}/.claude/hooks/format-changed.mjs']);
  assert.equal(s.worktree.baseRef, 'head');
  assert.ok(!('permissions' in s) || !JSON.stringify(s.permissions).includes('defaultMode'), 'auto mode never from project files');
});

test('templates/repo: committed hooks run without the plugin (cloud sessions)', () => {
  const dir = makeRepo({ '.claude/harness.json': harnessJson(FAIL_CMD) });
  for (const f of fs.readdirSync(path.join(REPO_T, '.claude', 'hooks'))) {
    fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
    fs.copyFileSync(path.join(REPO_T, '.claude', 'hooks', f), path.join(dir, '.claude', 'hooks', f));
  }
  write(dir, 'dirty.txt', 'x');
  const gate = path.join(dir, '.claude', 'hooks', 'stop-gate.mjs');
  const blocked = runScript(gate, { hook_event_name: 'Stop', cwd: dir }, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } });
  assert.equal(blocked.code, 2, blocked.stderr);
  assert.match(blocked.stderr, /^Not done:/);
  write(dir, '.claude/harness.json', harnessJson(PASS_CMD));
  assert.equal(runScript(gate, {}, { cwd: dir, env: { CLAUDE_PROJECT_DIR: dir } }).code, 0);
  const check = runScript(path.join(dir, '.claude', 'hooks', 'check.mjs'), '', { cwd: dir });
  assert.equal(check.code, 0, check.stdout);
});

test('templates/repo: CODEOWNERS fragment makes the harness paths human-owned (REV-3)', () => {
  const owned = read(REPO_T, '.github', 'CODEOWNERS.fragment').split('\n').filter((l) => l && !l.startsWith('#'));
  for (const p of ['/.claude/', '/.github/', '/AGENTS.md', '/CLAUDE.md', 'migrations/']) {
    assert.ok(owned.some((l) => l.split(/\s+/)[0] === p && l.includes('@OWNER')), p);
  }
});

test('templates/repo: workflows expose the required check names `ci` and `review`', () => {
  const ci = read(REPO_T, '.github', 'workflows', 'ci.yml');
  assert.match(ci, /\n  ci:\n    name: ci\n/);
  assert.match(ci, /node \.claude\/hooks\/check\.mjs --all/);
  assert.match(ci, /check\.mjs --e2e/);
  const review = read(REPO_T, '.github', 'workflows', 'review.yml');
  assert.match(review, /\n  review:\n    name: review\n/);
  assert.match(review, /anthropics\/claude-code-action@v1/);
  assert.match(review, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/);
  assert.match(review, /PASS or CHANGES_REQUESTED/);
  assert.match(review, /never merge/i);
});

test('templates/repo: defect form carries label, stable key, verbatim Reproduce and severity (NIGHT-1)', () => {
  const form = read(REPO_T, '.github', 'ISSUE_TEMPLATE', 'defect.yml');
  assert.match(form, /labels: \["agent-ready"\]/);
  for (const id of ['key', 'shape', 'severity', 'reproduce']) assert.match(form, new RegExp(`id: ${id}\\n`));
  assert.match(form, /open and closed/);
});

test('CLAUDE.md files stay within 45 lines (CTX-2)', () => {
  assert.ok(lines(read(REPO_T, 'CLAUDE.skeleton.md')) <= 45);
  assert.ok(lines(read(APP_T, 'CLAUDE.md')) <= 45);
});

test('templates/app: BUILD §3.4 skeleton with pinned versions and a lockfile', () => {
  for (const f of ['app/api/health/route.ts', 'app/page.tsx', 'tests/unit/health.test.ts', 'tests/e2e/smoke.spec.ts', 'pnpm-lock.yaml', 'gitignore', '.gitattributes']) {
    assert.ok(fs.existsSync(path.join(APP_T, f)), f);
  }
  assert.match(read(APP_T, 'app', 'api', 'health', 'route.ts'), /Response\.json\(\{ ok: true \}\)/);
  const cfg = JSON.parse(read(APP_T, '.claude', 'harness.json'));
  assert.deepEqual(cfg.check, ['pnpm -s typecheck', 'pnpm -s lint', 'pnpm -s test:unit']);
  const pkg = JSON.parse(read(APP_T, 'package.json'));
  for (const [name, v] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) assert.match(v, /^\d+\.\d+\.\d+$/, `${name} pinned`);
  assert.ok(!pkg.pnpm.onlyBuiltDependencies.includes('better-sqlite3'), 'better-sqlite3 uses its bundled prebuilds, not node-gyp');
  const lock = read(APP_T, 'pnpm-lock.yaml');
  for (const [name, v] of Object.entries(pkg.dependencies)) assert.ok(lock.includes(`${name}:\n        specifier: ${v}`), `${name} in lockfile`);
});

// Full install and checks of a generated app: slow and needs the npm registry, so only with HARNESS_E2E=1.
test('templates/app: installs and passes its own checks', { skip: process.env.HARNESS_E2E !== '1' && 'set HARNESS_E2E=1' }, () => {
  const dir = tmpdir('app-e2e');
  fs.cpSync(APP_T, dir, { recursive: true });
  fs.cpSync(REPO_T, dir, { recursive: true });
  fs.renameSync(path.join(dir, 'gitignore'), path.join(dir, '.gitignore'));
  const pkg = path.join(dir, 'package.json');
  fs.writeFileSync(pkg, fs.readFileSync(pkg, 'utf8').replace('APP_NAME', 'e2e-app'));
  const opts = { cwd: dir, env: childEnv(), encoding: 'utf8', shell: true, timeout: 900_000 };
  const install = spawnSync('pnpm install --frozen-lockfile', opts);
  assert.equal(install.status, 0, install.stdout + install.stderr);
  const check = spawnSync(process.execPath, ['.claude/hooks/check.mjs', '--all'], { ...opts, shell: false });
  assert.equal(check.status, 0, check.stdout + check.stderr);
});
