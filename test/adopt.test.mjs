// ADOPT-1, ADOPT-2, ADOPT-4 on fixture repos (BUILD §5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRIPTS, makeRepo, commitAll, sh, write, childEnv } from './helpers.mjs';

const ADOPT = path.join(SCRIPTS, 'adopt.mjs');

function adopt(repo, ...args) {
  const r = spawnSync(process.execPath, [ADOPT, repo, '--json', '--owner', 'josep-audenis', ...args], { env: childEnv(), encoding: 'utf8' });
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    // keep null
  }
  return { code: r.status, report, raw: r.stdout + r.stderr };
}
const action = (report, p) => report.rows.find((r) => r.path === p)?.action;

// Snapshot every tracked and untracked file (excluding .git).
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out[path.relative(dir, p).replace(/\\/g, '/')] = fs.readFileSync(p, 'utf8');
    }
  };
  walk(dir);
  return out;
}

const LONG_CLAUDE = Array.from({ length: 120 }, (_, i) => `- line ${i + 1} of a bloated contract`).join('\n') + '\n';
const UNRELATED_HOOK = { hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo unrelated' }] }] }, theme: 'dark' };

function nodeFixture() {
  return makeRepo({
    'package.json': JSON.stringify({ name: 'fixture-node', scripts: { lint: 'eslint .', test: 'vitest run' } }, null, 2),
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
    'CLAUDE.md': LONG_CLAUDE,
    '.claude/settings.json': JSON.stringify(UNRELATED_HOOK, null, 2) + '\n',
  });
}

test('adopt (node fixture): CLAUDE.md untouched, unrelated hook kept, checks drafted, missing files added', () => {
  const repo = nodeFixture();
  const r = adopt(repo);
  assert.equal(r.code, 0, r.raw);
  assert.equal(sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repo), 'harness/adopt');

  assert.equal(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'), LONG_CLAUDE, 'CLAUDE.md byte-identical');
  assert.equal(action(r.report, 'CLAUDE.md'), 'SKIPPED');

  const settings = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(settings.hooks.PreToolUse, UNRELATED_HOOK.hooks.PreToolUse, 'unrelated hook survives');
  assert.equal(settings.theme, 'dark');
  assert.match(JSON.stringify(settings.hooks.Stop), /stop-gate\.mjs/);
  assert.equal(settings.worktree.baseRef, 'head');
  assert.equal(action(r.report, '.claude/settings.json'), 'MERGED');

  const cfg = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'harness.json'), 'utf8'));
  assert.deepEqual(cfg.check, ['pnpm -s lint', 'pnpm -s test']);
  assert.equal(cfg._draft, true);
  assert.equal(action(r.report, '.claude/harness.json'), 'DRAFTED');

  for (const p of ['.claude/hooks/stop-gate.mjs', '.claude/agents/reviewer.md', '.github/workflows/ci.yml', 'AGENTS.md', 'feature_list.json', 'progress.md']) {
    assert.equal(action(r.report, p), 'ADDED', p);
    assert.ok(fs.existsSync(path.join(repo, p)), p);
  }
  const owners = fs.readFileSync(path.join(repo, '.github', 'CODEOWNERS'), 'utf8');
  assert.match(owners, /^\/\.claude\/ @josep-audenis$/m);
  assert.doesNotMatch(owners, /@OWNER/);
});

test('adopt (node fixture): second run after committing is byte-identical, nothing but SKIPPED', () => {
  const repo = nodeFixture();
  adopt(repo);
  commitAll(repo, 'harness: adopt');
  const before = snapshot(repo);
  const r = adopt(repo);
  assert.equal(r.code, 0, r.raw);
  assert.deepEqual(snapshot(repo), before);
  assert.deepEqual([...new Set(r.report.rows.map((x) => x.action))], ['SKIPPED']);
});

test('adopt (node fixture): --dry-run leaves git status empty and stays on the branch', () => {
  const repo = nodeFixture();
  const r = adopt(repo, '--dry-run');
  assert.equal(r.code, 0, r.raw);
  assert.equal(sh('git', ['status', '--porcelain'], repo), '');
  assert.equal(sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repo), 'main');
  assert.equal(action(r.report, '.claude/harness.json'), 'DRAFTED');
});

test('adopt (python fixture): draft contains ruff check and pytest', () => {
  const repo = makeRepo({
    'pyproject.toml': '[project]\nname = "cli"\n\n[project.optional-dependencies]\ndev = ["ruff", "pytest"]\n\n[tool.ruff]\nline-length = 100\n',
  });
  const r = adopt(repo);
  assert.equal(r.code, 0, r.raw);
  const cfg = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'harness.json'), 'utf8'));
  assert.ok(cfg.check.some((c) => c.startsWith('ruff check')), cfg.check.join(', '));
  assert.ok(cfg.check.some((c) => c.includes('pytest')), cfg.check.join(', '));
  assert.equal(action(r.report, 'CLAUDE.md'), 'ADDED', 'no CLAUDE.md: created from the skeleton');
  assert.match(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'), new RegExp(`^# ${path.basename(repo)}`));
});

test('adopt (dirty tree): non-zero exit and nothing changed', () => {
  const repo = nodeFixture();
  write(repo, 'wip.txt', 'uncommitted\n');
  const before = snapshot(repo);
  const r = adopt(repo);
  assert.notEqual(r.code, 0);
  assert.match(r.raw, /refusing to adopt a dirty tree/);
  assert.deepEqual(snapshot(repo), before);
  assert.equal(sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repo), 'main');
});

test('adopt (ADOPT-4): a changed managed file shows DIFFERS with a diff and is only replaced on --update', () => {
  const repo = nodeFixture();
  adopt(repo);
  commitAll(repo, 'harness: adopt');
  const gate = path.join(repo, '.claude', 'hooks', 'stop-gate.mjs');
  fs.appendFileSync(gate, '// local tweak\n');
  fs.writeFileSync(path.join(repo, 'progress.md'), '# my own progress\n');
  commitAll(repo, 'local changes');

  const r = adopt(repo);
  const row = r.report.rows.find((x) => x.path === '.claude/hooks/stop-gate.mjs');
  assert.equal(row.action, 'DIFFERS');
  assert.match(row.diff, /- \/\/ local tweak/);
  assert.match(fs.readFileSync(gate, 'utf8'), /local tweak/, 'not changed without --update');
  assert.equal(action(r.report, 'progress.md'), 'SKIPPED', 'seeded content files are never compared');

  const u = adopt(repo, '--update', '.claude/hooks/stop-gate.mjs');
  assert.equal(action(u.report, '.claude/hooks/stop-gate.mjs'), 'UPDATED');
  assert.doesNotMatch(fs.readFileSync(gate, 'utf8'), /local tweak/);
});

test('adopt: go and rust repos get go vet/test and cargo checks', async () => {
  const { draftChecks } = await import('../plugins/harness/scripts/adopt.mjs');
  assert.deepEqual(draftChecks(makeRepo({ 'go.mod': 'module x\n' })).checks, ['go vet ./...', 'go test ./...']);
  assert.deepEqual(draftChecks(makeRepo({ 'Cargo.toml': '[package]\nname="x"\n' })).checks, ['cargo fmt --check', 'cargo test']);
  const npm = makeRepo({ 'package.json': JSON.stringify({ scripts: { typecheck: 'tsc', test: 'echo "Error: no test specified" && exit 1' } }), 'package-lock.json': '{}' });
  assert.deepEqual(draftChecks(npm).checks, ['npm run -s typecheck'], 'the npm init placeholder test script is not a check');
});
