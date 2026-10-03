// Start, wait for and stop the app for the QA evaluator (SPEC AGT-7).
// Usage: node qa-server.mjs start|wait|stop|status [--dir <repo>] [--timeout <seconds>]
// Uses .claude/harness.json "init" (command, run in the background) and "health" (URL polled until
// it answers 2xx/3xx). State and the server log live in the OS temp dir, so the repo stays clean.
// `stop` kills the whole process tree (taskkill /T on Windows, the process group elsewhere).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readJson, tail, samePath } from './lib.mjs';

export function stateFiles(dir) {
  const key = crypto.createHash('sha1').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 12);
  const base = path.join(os.tmpdir(), 'harness-qa');
  return { base, state: path.join(base, `${key}.json`), log: path.join(base, `${key}.log`), artifacts: path.join(base, key) };
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function healthy(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

// Windows: the root PID plus every descendant, by ParentProcessId. Orphans keep the dead
// parent's id, so this finds the server even after the launching cmd.exe exited.
// Only processes created at or after `sinceMs` count, so a recycled PID never pulls in an unrelated tree.
export function windowsTree(pid, sinceMs = 0) {
  const ps =
    "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId," +
    "@{n='t';e={[int64](($_.CreationDate.ToUniversalTime()) - [datetime]'1970-01-01').TotalMilliseconds}} | ConvertTo-Json -Compress";
  const r = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { encoding: 'utf8', windowsHide: true, timeout: 30_000 },
  );
  let rows = [];
  try {
    rows = [].concat(JSON.parse(r.stdout || '[]'));
  } catch {
    rows = [];
  }
  const fresh = (p) => !sinceMs || (Number(p.t) || 0) >= sinceMs - 5000;
  const root = rows.find((p) => p.ProcessId === pid);
  const tree = new Set(root && !fresh(root) ? [] : [pid]);
  for (let grew = tree.size > 0; grew; ) {
    grew = false;
    for (const p of rows) {
      if (tree.has(p.ParentProcessId) && !tree.has(p.ProcessId) && p.ProcessId !== process.pid && fresh(p)) {
        tree.add(p.ProcessId);
        grew = true;
      }
    }
  }
  return [...tree].filter(alive);
}

const treeAlive = (pid, sinceMs) => (process.platform === 'win32' ? windowsTree(pid, sinceMs).length > 0 : alive(pid));

export function killTree(pid, sinceMs) {
  if (!pid) return;
  if (process.platform === 'win32') {
    for (const p of windowsTree(pid, sinceMs).reverse()) {
      spawnSync('taskkill', ['/PID', String(p), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    }
    return;
  }
  if (!alive(pid)) return;
  {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // already gone
      }
    }
  }
}

async function waitHealthy(url, pid, timeoutS, sinceMs) {
  const deadline = Date.now() + timeoutS * 1000;
  while (Date.now() < deadline) {
    if (await healthy(url)) return 'ready';
    if (pid && !treeAlive(pid, sinceMs)) return 'exited';
    await sleep(500);
  }
  return 'timeout';
}

export async function run(argv) {
  const [cmd] = argv;
  const flag = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const dir = path.resolve(flag('--dir') ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
  const timeoutS = Number(flag('--timeout') ?? 120);
  const files = stateFiles(dir);
  const cfg = readJson(path.join(dir, '.claude', 'harness.json'), {}) ?? {};
  const state = readJson(files.state);

  if (cmd === 'start') {
    if (typeof cfg.init !== 'string' || typeof cfg.health !== 'string') {
      return { code: 3, out: 'qa-server: .claude/harness.json needs "init" (start command) and "health" (URL); QA without a running app is n/a.' };
    }
    if (state && (await healthy(cfg.health)) && treeAlive(state.pid, Date.parse(state.started))) return { code: 0, out: `qa-server: already running (pid ${state.pid}) at ${cfg.health}` };
    fs.mkdirSync(files.artifacts, { recursive: true });
    const log = fs.openSync(files.log, 'w');
    const startedMs = Date.now();
    const child = spawn(cfg.init, {
      cwd: dir,
      shell: true,
      // POSIX: own process group, killed as a group. Windows: not detached (a detached cmd's Node
      // children lose their output); the shell may exit early and orphan the server, so stop/status
      // follow the tree by ParentProcessId instead (windowsTree).
      detached: process.platform !== 'win32',
      stdio: ['ignore', log, log],
      windowsHide: true,
      env: { ...process.env, CI: process.env.CI ?? '1' },
    });
    child.unref();
    fs.writeFileSync(files.state, JSON.stringify({ pid: child.pid, init: cfg.init, health: cfg.health, dir, started: new Date(startedMs).toISOString() }, null, 2));
    const result = await waitHealthy(cfg.health, child.pid, timeoutS, startedMs);
    if (result === 'ready') return { code: 0, out: `qa-server: ready at ${cfg.health} (pid ${child.pid}). Artifacts: ${files.artifacts}` };
    killTree(child.pid, startedMs);
    fs.rmSync(files.state, { force: true });
    const logText = fs.existsSync(files.log) ? fs.readFileSync(files.log, 'utf8') : '';
    return { code: 1, out: `qa-server: ${result === 'exited' ? 'the init command exited' : `no healthy answer from ${cfg.health} within ${timeoutS}s`}.\n--- server log (last 30 lines) ---\n${tail(logText, 30)}` };
  }
  if (cmd === 'wait') {
    if (typeof cfg.health !== 'string') return { code: 3, out: 'qa-server: no "health" URL in .claude/harness.json' };
    const r = await waitHealthy(cfg.health, state?.pid, timeoutS, state ? Date.parse(state.started) : 0);
    return { code: r === 'ready' ? 0 : 1, out: `qa-server: ${r}` };
  }
  if (cmd === 'stop') {
    if (!state) return { code: 0, out: 'qa-server: not running' };
    const since = Date.parse(state.started);
    killTree(state.pid, since);
    for (let i = 0; i < 12 && treeAlive(state.pid, since); i++) await sleep(250);
    if (alive(state.pid) && process.platform !== 'win32') {
      try {
        process.kill(-state.pid, 'SIGKILL');
      } catch {
        // gone
      }
    }
    fs.rmSync(files.state, { force: true });
    return { code: 0, out: `qa-server: stopped (pid ${state.pid})` };
  }
  if (cmd === 'status') {
    const up = state && treeAlive(state.pid, Date.parse(state.started));
    return { code: up ? 0 : 1, out: up ? `qa-server: running (pid ${state.pid}), healthy: ${await healthy(state.health)}` : 'qa-server: not running' };
  }
  return { code: 2, out: 'usage: qa-server.mjs start|wait|stop|status [--dir <repo>] [--timeout <seconds>]' };
}

if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  const r = await run(process.argv.slice(2));
  console.log(r.out);
  process.exitCode = r.code;
}
