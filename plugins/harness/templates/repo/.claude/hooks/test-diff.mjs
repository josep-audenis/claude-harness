// GENERATED from plugins/harness/scripts/test-diff.mjs by `npm run sync-templates` in claude-harness. Edit the source, not this copy.
// List test files changed since a commit (committed, staged, unstaged or untracked).
// Usage: node test-diff.mjs <base-ref> [--dir <repo>]
// Exit 0 when none changed, 1 when some did (prints them), 2 on bad input.
// Used by /goal conditions and the reviewer to make "no test file modified" an executed check (LOOP-2).
import path from 'node:path';
import { git, isTestPath } from './lib.mjs';

const args = process.argv.slice(2);
const dirArg = args.indexOf('--dir');
const dir = path.resolve(dirArg >= 0 ? args[dirArg + 1] : process.env.CLAUDE_PROJECT_DIR || process.cwd());
const base = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--dir');

if (!base || git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], dir).code !== 0) {
  console.error(`Usage: node test-diff.mjs <base-ref> [--dir <repo>] (unknown ref: ${base ?? 'none'})`);
  process.exit(2);
}

const changed = new Set();
for (const line of git(['diff', '--name-only', base], dir).stdout.split('\n')) if (line) changed.add(line);
for (const line of git(['ls-files', '--others', '--exclude-standard'], dir).stdout.split('\n')) if (line) changed.add(line);
const tests = [...changed].filter(isTestPath).sort();

if (tests.length) {
  console.log(`Test files changed since ${base}:\n${tests.map((t) => `  ${t}`).join('\n')}`);
  process.exit(1);
}
console.log(`No test files changed since ${base}.`);
process.exit(0);
