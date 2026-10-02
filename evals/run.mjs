// Run one harness variant on task fixtures, headless (SPEC LAB-2, LAB-3, LAB-4).
// Usage: node evals/run.mjs --variant <plugin-dir|none> [--tasks all|a,b] [--runs N] [--label L]
//          [--model M] [--claude-bin path] [--permission-mode auto] [--budget-usd X]
//          [--tasks-dir dir] [--results-dir dir] [--keep] [--dry-run]
// Real runs spend the human's quota: only start them when asked. Tests use --claude-bin evals/stub/claude-stub.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadTasks, expand, tamperedFiles } from './lib/tasks.mjs';
import { parseStream, claimsDone } from './lib/stream.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = {
    variant: null, tasks: 'all', runs: 1, label: null, model: null, claudeBin: 'claude', permissionMode: 'auto',
    budgetUsd: null, tasksDir: path.join(HERE, 'tasks'), resultsDir: path.join(HERE, 'results'), keep: false, dryRun: false,
  };
  const val = (i) => {
    if (argv[i + 1] === undefined) throw new Error(`${argv[i]} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    if (f === '--variant') a.variant = val(i++);
    else if (f === '--tasks') a.tasks = val(i++);
    else if (f === '--runs') a.runs = Number(val(i++));
    else if (f === '--label') a.label = val(i++);
    else if (f === '--model') a.model = val(i++);
    else if (f === '--claude-bin') a.claudeBin = val(i++);
    else if (f === '--permission-mode') a.permissionMode = val(i++);
    else if (f === '--budget-usd') a.budgetUsd = Number(val(i++));
    else if (f === '--tasks-dir') a.tasksDir = path.resolve(val(i++));
    else if (f === '--results-dir') a.resultsDir = path.resolve(val(i++));
    else if (f === '--keep') a.keep = true;
    else if (f === '--dry-run') a.dryRun = true;
    else throw new Error(`Unknown argument: ${f}`);
  }
  if (!a.variant) throw new Error('--variant <plugin-dir|none> is required');
  if (!Number.isInteger(a.runs) || a.runs < 1) throw new Error('--runs must be a positive integer');
  a.label ??= a.variant === 'none' ? 'none' : path.basename(path.resolve(a.variant));
  if (!/^[A-Za-z0-9._-]+$/.test(a.label)) throw new Error('--label may only contain letters, digits, ".", "_" and "-"');
  return a;
}

const GIT_ENV = { GIT_AUTHOR_NAME: 'eval', GIT_AUTHOR_EMAIL: 'eval@example.com', GIT_COMMITTER_NAME: 'eval', GIT_COMMITTER_EMAIL: 'eval@example.com' };
function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, env: { ...process.env, ...GIT_ENV }, encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
}

// LAB-2 isolation: only the variant plugin, no user settings/plugins/hooks, no MCP servers,
// no saved session. Verified flags (cli-reference, 2026-10-03). The user's ~/.claude/CLAUDE.md is
// memory, not a setting source, and may still load; see NOTES.md.
export function claudeArgs(task, a) {
  const args = ['-p', task.prompt, '--output-format', 'stream-json', '--verbose', '--max-turns', String(task.maxTurns),
    '--setting-sources', 'project,local', '--strict-mcp-config', '--no-session-persistence', '--permission-mode', a.permissionMode];
  if (a.variant !== 'none') args.push('--plugin-dir', path.resolve(a.variant));
  if (a.model) args.push('--model', a.model);
  return args;
}

function runOne(task, n, a) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `eval-${task.id}-`));
  try {
    fs.cpSync(task.repoDir, work, { recursive: true });
    git(['init', '-q', '-b', 'main'], work);
    git(['add', '-A'], work);
    git(['commit', '-q', '-m', 'fixture'], work);

    const [bin, pre] = /\.(mjs|cjs|js)$/.test(a.claudeBin) ? [process.execPath, [path.resolve(a.claudeBin)]] : [a.claudeBin, []];
    const started = Date.now();
    const r = spawnSync(bin, [...pre, ...claudeArgs(task, a)], {
      cwd: work,
      encoding: 'utf8',
      timeout: (task.timeoutSec ?? 900) * 1000,
      maxBuffer: 256 * 1024 * 1024,
      windowsHide: true,
    });
    const durationMs = Date.now() - started;

    const rawRel = path.join('raw', a.label, `${task.id}-${n}.jsonl`);
    const rawFile = path.join(a.resultsDir, rawRel);
    fs.mkdirSync(path.dirname(rawFile), { recursive: true });
    fs.writeFileSync(rawFile, r.stdout || '');

    const verify = task.verify.map((cmd) => {
      const v = spawnSync(expand(cmd, task), { cwd: work, shell: true, encoding: 'utf8', timeout: 300_000, windowsHide: true });
      return { cmd, code: v.status ?? 1 };
    });
    const s = parseStream(r.stdout || '');
    const passed = verify.every((v) => v.code === 0);
    const claimedDone = claimsDone(s.finalText);
    const tampered = tamperedFiles(task.repoDir, work, task.protected ?? []);
    return {
      task: task.id, run: n, label: a.label, variant: a.variant, model: a.model, startedAt: new Date(started).toISOString(),
      passed, claimedDone, prematureDone: claimedDone && !passed, tampered: tampered.length > 0, tamperedFiles: tampered,
      turns: s.turns, toolCalls: s.toolCalls, tokens: s.tokens, costUsd: s.costUsd, durationMs,
      exitCode: r.status, error: r.error ? String(r.error.message) : null, resultSubtype: s.resultSubtype, verify,
      raw: rawRel.replace(/\\/g, '/'),
    };
  } finally {
    if (!a.keep) fs.rmSync(work, { recursive: true, force: true });
  }
}

const same = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
if (process.argv[1] && same(path.resolve(process.argv[1]), fileURLToPath(import.meta.url))) {
  try {
    const a = parseArgs(process.argv.slice(2));
    const tasks = loadTasks(a.tasksDir, a.tasks);
    if (a.dryRun) {
      for (const t of tasks) console.log(`${t.id}: ${a.claudeBin} ${claudeArgs(t, a).map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(' ')}`);
      console.log(`\n${tasks.length} task(s) × ${a.runs} run(s) = ${tasks.length * a.runs} runs. Nothing started (--dry-run).`);
    } else {
      fs.mkdirSync(a.resultsDir, { recursive: true });
      const summaryFile = path.join(a.resultsDir, `${a.label}.json`);
      const summary = fs.existsSync(summaryFile)
        ? JSON.parse(fs.readFileSync(summaryFile, 'utf8'))
        : { label: a.label, variant: a.variant, created: new Date().toISOString(), runs: [] };
      let cost = 0;
      let tokens = 0;
      outer: for (const task of tasks) {
        for (let n = 1; n <= a.runs; n++) {
          const run = runOne(task, summary.runs.filter((x) => x.task === task.id).length + 1, a);
          summary.runs.push(run);
          fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2) + '\n');
          cost += run.costUsd ?? 0;
          tokens += run.tokens ?? 0;
          const flags = [run.passed ? 'PASS' : 'FAIL', run.claimedDone && 'claimed-done', run.prematureDone && 'PREMATURE', run.tampered && 'TAMPERED'].filter(Boolean);
          console.log(`${task.id} #${run.run}: ${flags.join(' ')} · ${run.turns} turns · ${run.toolCalls} tools · ${(run.durationMs / 1000).toFixed(1)}s · running total $${cost.toFixed(4)}, ${tokens} tokens`);
          if (a.budgetUsd !== null && cost > a.budgetUsd) {
            console.log(`Budget $${a.budgetUsd} exceeded: stopping.`);
            process.exitCode = 3;
            break outer;
          }
        }
      }
      console.log(`\nSummary: ${path.relative(process.cwd(), summaryFile)}`);
    }
  } catch (e) {
    console.error(`run failed: ${e.message}`);
    process.exitCode = 1;
  }
}
