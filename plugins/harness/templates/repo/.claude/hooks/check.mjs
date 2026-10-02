// GENERATED from plugins/harness/scripts/check.mjs by `npm run sync-templates` in claude-harness. Edit the source, not this copy.
// Run the .claude/harness.json checks (CTX-3). Used by CI, /harness:verify-done and agents.
// Usage: node check.mjs [--dir <repo>] [--all] [--verbose] [--json] [--e2e]
// Default: stop at the first failure (SPEC §6.2). --all runs every check. --e2e runs "e2e".
// Exit 0 when all pass, 1 when one fails, 2 when there is no usable harness.json.
import path from 'node:path';
import { readJson, runShell, tail } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const dirArg = args.indexOf('--dir');
const dir = path.resolve(dirArg >= 0 ? args[dirArg + 1] : process.env.CLAUDE_PROJECT_DIR || process.cwd());

const config = readJson(path.join(dir, '.claude', 'harness.json'));

// --e2e runs the optional "e2e" command instead of the check list (CI's e2e job).
if (flag('--e2e')) {
  if (typeof config?.e2e !== 'string' || !config.e2e.trim()) {
    console.log('No "e2e" command in .claude/harness.json; nothing to run.');
    process.exit(0);
  }
  const { code, output } = runShell(config.e2e, dir, 1_800_000);
  console.log(`${code === 0 ? '✔' : '✖'} \`${config.e2e}\` exit ${code}`);
  if (output.trim()) console.log(output.trimEnd().replace(/^/gm, '    '));
  process.exit(code === 0 ? 0 : 1);
}

const checks = (Array.isArray(config?.check) ? config.check : [config?.check]).filter((c) => typeof c === 'string' && c.trim());
if (!config || checks.length === 0) {
  console.error(`No checks: ${path.join(dir, '.claude', 'harness.json')} is missing or has an empty "check" list.`);
  process.exit(2);
}

const results = [];
for (const cmd of checks) {
  const started = Date.now();
  const { code, output } = runShell(cmd, dir);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  results.push({ cmd, code, seconds, output });
  if (!flag('--json')) {
    console.log(`${code === 0 ? '✔' : '✖'} \`${cmd}\` exit ${code} (${seconds}s)`);
    if (flag('--verbose') || code !== 0) {
      const text = flag('--verbose') ? output.trimEnd() : tail(output, 40);
      if (text) console.log(text.replace(/^/gm, '    '));
    }
  }
  if (code !== 0 && !flag('--all')) break;
}

const failed = results.filter((r) => r.code !== 0);
const skipped = checks.length - results.length;
if (flag('--json')) {
  console.log(JSON.stringify({ dir, results: results.map(({ output, ...r }) => ({ ...r, tail: tail(output, 40) })), skipped }, null, 2));
} else {
  console.log(
    `\n${failed.length ? `FAIL: ${failed.length} of ${checks.length} check(s) failed` : `PASS: all ${checks.length} check(s) exit 0`}` +
      (skipped ? `, ${skipped} not run after the first failure` : ''),
  );
}
process.exit(failed.length ? 1 : 0);
