// GENERATED from plugins/harness/scripts/lib.mjs by `npm run sync-templates` in claude-harness. Edit the source, not this copy.
// Shared helpers for harness hooks and scripts. Node built-ins only (DEV-5).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Read the hook's JSON input from stdin. Returns {} on a TTY, empty or invalid input.
export async function readStdinJson() {
  if (process.stdin.isTTY) return {};
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// The repo the session works in. CLAUDE_PROJECT_DIR stays on the checkout the session started in,
// so when the hook input's cwd is a linked worktree of that same repo (EnterWorktree), use the worktree.
export function projectDir(input = {}) {
  const base = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  if (!process.env.CLAUDE_PROJECT_DIR || typeof input.cwd !== 'string' || !input.cwd) return base;
  const top = git(['rev-parse', '--show-toplevel'], input.cwd);
  if (top.code !== 0 || !top.stdout || samePath(top.stdout, base)) return base;
  const commonDir = (d) => {
    const r = git(['rev-parse', '--git-common-dir'], d);
    return r.code === 0 && r.stdout ? path.resolve(d, r.stdout) : null;
  };
  const a = commonDir(top.stdout);
  const b = commonDir(base);
  return a && b && samePath(a, b) ? path.resolve(top.stdout) : base;
}

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function tail(text, n) {
  const lines = String(text).replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  return lines.slice(-n).join('\n');
}

export function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  return { code: r.status ?? 1, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

export function isGitRepo(cwd) {
  return git(['rev-parse', '--is-inside-work-tree'], cwd).stdout === 'true';
}

// Default branch, in order: origin/HEAD, origin/main, main, master. null if none exists.
export function defaultBranchRef(cwd) {
  const head = git(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'], cwd);
  if (head.code === 0 && head.stdout) return head.stdout.replace(/^refs\/remotes\//, '');
  for (const ref of ['origin/main', 'main', 'master']) {
    if (git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd).code === 0) return ref;
  }
  return null;
}

// True when there are staged, unstaged or untracked changes.
export function treeDirty(cwd) {
  const r = git(['status', '--porcelain', '--untracked-files=normal'], cwd);
  return r.code !== 0 || r.stdout.length > 0;
}

// Commits on HEAD that the default branch doesn't have. 0 when unknown.
export function commitsAhead(cwd) {
  const base = defaultBranchRef(cwd);
  if (!base) return 0;
  const r = git(['rev-list', '--count', `${base}..HEAD`], cwd);
  return r.code === 0 ? Number(r.stdout) || 0 : 0;
}

// Paths a test-writer may create. Used to recognise brief commits and test tampering.
export function isTestPath(p) {
  const f = p.replace(/\\/g, '/');
  return (
    /(^|\/)(tests?|__tests__|spec|e2e)\//.test(f) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) ||
    /(^|\/)test_[^/]*\.py$/.test(f) ||
    /_test\.(py|go)$/.test(f)
  );
}

// A `brief(<id>)` commit at HEAD that only adds the brief, the feature entry and tests.
// Its red tests are intended (SPEC AGT-2), so the Stop gate doesn't hold that state.
export function headIsBriefCommit(cwd) {
  const msg = git(['log', '-1', '--format=%s'], cwd);
  if (msg.code !== 0 || !/^brief\([^)]+\)/.test(msg.stdout)) return false;
  const files = git(['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', 'HEAD'], cwd);
  if (files.code !== 0 || !files.stdout) return false;
  return files.stdout
    .split('\n')
    .every((f) => /^docs\/briefs\/[^/]+\.md$/.test(f) || f === 'feature_list.json' || isTestPath(f));
}

// Run a harness.json command through the platform shell.
export function runShell(cmd, cwd, timeoutMs = 540_000) {
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    encoding: 'utf8',
    input: '',
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  const output = [r.stdout, r.stderr, r.error ? String(r.error) : ''].filter(Boolean).join('\n');
  return { code: r.status ?? 1, output };
}

function realOrResolved(p) {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

export function samePath(a, b) {
  const x = realOrResolved(a);
  const y = realOrResolved(b);
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
}

// GATE-3: when the repo commits its own copy of a hook, any other copy defers to it.
export function shouldDefer(selfPath, dir, name) {
  const committed = path.join(dir, '.claude', 'hooks', name);
  return fs.existsSync(committed) && !samePath(selfPath, committed);
}
