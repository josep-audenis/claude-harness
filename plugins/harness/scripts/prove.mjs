// GATE-6: prove a repo's Stop gate before trusting it. Copy the repo, break the check, confirm the
// gate blocks; fix it, confirm it passes. The repo itself is never modified.
// Used by doctor.mjs, new-app.mjs and /harness:adopt.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PLUGIN_ROOT } from './floor.mjs';

const PASS_CMD = 'node -e "process.exit(0)"';
const FAIL_CMD = 'node -e "process.exit(1)"';
const COPY_EXCLUDE = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.venv', 'venv', '__pycache__', 'target', '.turbo']);

// The repo's committed gate when it has one (GATE-3), otherwise the plugin's.
export function gateScriptFor(dir) {
  const committed = path.join(dir, '.claude', 'hooks', 'stop-gate.mjs');
  return fs.existsSync(committed) ? committed : path.join(PLUGIN_ROOT, 'scripts', 'stop-gate.mjs');
}

function runGate(dir, check) {
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'harness.json'), JSON.stringify({ version: 1, check: [check] }) + '\n');
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir };
  delete env.CLAUDE_PLUGIN_ROOT;
  return spawnSync(process.execPath, [gateScriptFor(dir)], {
    cwd: dir,
    input: JSON.stringify({ hook_event_name: 'Stop', cwd: dir }),
    env,
    encoding: 'utf8',
    timeout: 60_000,
    windowsHide: true,
  });
}

// The copy has no .git, so the gate never takes the clean-tree skip and always runs the check.
export function proveGate(repo) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-gate-proof-'));
  try {
    fs.cpSync(repo, tmp, { recursive: true, filter: (src) => !COPY_EXCLUDE.has(path.basename(src)) });
    const which = fs.existsSync(path.join(tmp, '.claude', 'hooks', 'stop-gate.mjs')) ? 'committed' : 'plugin';
    const broken = runGate(tmp, FAIL_CMD);
    if (broken.status !== 2 || !/Not done:/.test(broken.stderr)) {
      return { ok: false, gate: which, detail: `broken check did not block (exit ${broken.status})` };
    }
    const fixed = runGate(tmp, PASS_CMD);
    if (fixed.status !== 0) return { ok: false, gate: which, detail: `fixed check still blocks (exit ${fixed.status})` };
    return { ok: true, gate: which, detail: `${which} gate blocked a broken check and passed a fixed one` };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
