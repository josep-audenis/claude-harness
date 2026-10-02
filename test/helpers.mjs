// Test helpers. Every spawned script gets a temp HOME/USERPROFILE so nothing touches the real home.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLUGIN = path.join(ROOT, 'plugins', 'harness');
export const SCRIPTS = path.join(PLUGIN, 'scripts');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'));
process.on('exit', () => fs.rmSync(tmpRoot, { recursive: true, force: true }));

let n = 0;
export function tmpdir(prefix = 'd') {
  const d = path.join(tmpRoot, `${prefix}-${++n}`);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export const FAKE_HOME = tmpdir('home');

const GIT_ENV = {
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_CONFIG_NOSYSTEM: '1',
};

// Environment for child processes: temp home, no inherited Claude variables.
export function childEnv(extra = {}, home = FAKE_HOME) {
  const env = { ...process.env, ...GIT_ENV, HOME: home, USERPROFILE: home, HARNESS_NOTIFY: 'off' };
  for (const k of Object.keys(env)) if (k.startsWith('CLAUDE_')) delete env[k];
  return { ...env, ...extra };
}

export function runScript(script, input = {}, { env = {}, cwd = ROOT, home } = {}) {
  const r = spawnSync(process.execPath, [script], {
    cwd,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    env: childEnv(env, home),
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

export function sh(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, env: childEnv(), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  return (r.stdout || '').trim();
}

export function write(dir, rel, content) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

// A git repo on `main` with one commit. `files` maps relative paths to contents.
export function makeRepo(files = {}) {
  const dir = tmpdir('repo');
  sh('git', ['init', '-q', '-b', 'main'], dir);
  sh('git', ['config', 'core.autocrlf', 'false'], dir);
  write(dir, 'README.md', '# fixture\n');
  for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  commitAll(dir, 'init');
  return dir;
}

export function commitAll(dir, msg) {
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-q', '-m', msg], dir);
}

export const PASS_CMD = 'node -e "process.exit(0)"';
export const FAIL_CMD = 'node -e "process.exit(1)"';
export const harnessJson = (cmd) => JSON.stringify({ version: 1, check: [cmd] }, null, 2) + '\n';
