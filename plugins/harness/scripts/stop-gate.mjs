// Stop hook (GATE-1, GATE-2, GATE-3): block the turn while a harness.json check fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readStdinJson, projectDir, readJson, tail, isGitRepo, treeDirty, commitsAhead, runShell, shouldDefer, headIsBriefCommit,
} from './lib.mjs';

const input = await readStdinJson();
const dir = projectDir(input);

// GATE-3: a committed repo copy runs instead of this one.
if (shouldDefer(fileURLToPath(import.meta.url), dir, 'stop-gate.mjs')) process.exit(0);

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

for (const cmd of checks) {
  const { code, output } = runShell(cmd, dir);
  if (code !== 0) {
    process.stderr.write(
      `Not done: \`${cmd}\` exited ${code}.\n` +
        `--- last 40 lines ---\n${tail(output, 40)}\n---\n` +
        'Fix the cause, not the test.\n',
    );
    process.exit(2);
  }
}
process.exit(0);
