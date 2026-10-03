// GENERATED from plugins/harness/scripts/stop-gate.mjs by `npm run sync-templates` in claude-harness. Edit the source, not this copy.
// Stop and SubagentStop hook (GATE-1, GATE-2, GATE-3, GATE-8): block while a harness.json check fails.
// On SubagentStop (the implementer) it checks the subagent's own directory, its worktree, taken
// from the hook input's cwd, and never defers: the committed repo copy only registers Stop.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readStdinJson, projectDir, readJson, tail, isGitRepo, treeDirty, commitsAhead, runShell, shouldDefer, headIsBriefCommit,
} from './lib.mjs';

const input = await readStdinJson();
const subagent = input.hook_event_name === 'SubagentStop';
const dir = subagent && input.cwd ? path.resolve(input.cwd) : projectDir(input);

// GATE-3: a committed repo copy runs instead of this one (main-session Stop only).
if (!subagent && shouldDefer(fileURLToPath(import.meta.url), dir, 'stop-gate.mjs')) process.exit(0);

// GATE-2: no contract, nothing to gate.
const configPath = path.join(dir, '.claude', 'harness.json');
if (!fs.existsSync(configPath)) process.exit(0);
const config = readJson(configPath, {});
const checks = (Array.isArray(config?.check) ? config.check : [config?.check]).filter(
  (c) => typeof c === 'string' && c.trim(),
);
if (checks.length === 0) process.exit(0);

// GATE-2: clean tree with nothing ahead of the default branch means no work to check.
// A clean tree whose HEAD is a brief commit (brief + feature entry + red tests only) is red
// by design; any later commit or edit re-arms the gate.
if (isGitRepo(dir) && !treeDirty(dir) && (commitsAhead(dir) === 0 || headIsBriefCommit(dir))) process.exit(0);

// Checks can tell which gate runs them (used by doctor --live).
process.env.HARNESS_GATE_EVENT = subagent ? 'SubagentStop' : 'Stop';
for (const cmd of checks) {
  const { code, output } = runShell(cmd, dir);
  if (code !== 0) {
    process.stderr.write(
      `Not done: \`${cmd}\` exited ${code}.\n` +
        `--- last 40 lines ---\n${tail(output, 40)}\n---\n` +
        (subagent ? 'You are the implementer: keep working until every check passes. ' : '') +
        'Fix the cause, not the test.\n',
    );
    process.exit(2);
  }
}
process.exit(0);
