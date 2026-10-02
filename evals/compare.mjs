// Compare two labels' eval results per task and overall (SPEC LAB-3).
// Usage: node evals/compare.mjs <labelA> <labelB> [--results-dir dir]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIN_RUNS = 3; // LAB-6: fewer runs than this per side is within noise

export function metrics(runs) {
  const n = runs.length;
  const rate = (k) => (n ? runs.filter((r) => r[k]).length / n : null);
  const mean = (k) => {
    const v = runs.map((r) => r[k]).filter((x) => typeof x === 'number');
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  return {
    n, pass: rate('passed'), premature: rate('prematureDone'), tamper: rate('tampered'),
    turns: mean('turns'), toolCalls: mean('toolCalls'), tokens: mean('tokens'), costUsd: mean('costUsd'), durationS: mean('durationMs') === null ? null : mean('durationMs') / 1000,
  };
}

const COLS = [
  ['pass', 'pass', 'pct'], ['premature', 'premature', 'pct'], ['tamper', 'tamper', 'pct'], ['turns', 'turns', 1],
  ['toolCalls', 'tool calls', 1], ['tokens', 'tokens', 0], ['costUsd', 'cost $', 4], ['durationS', 'duration s', 1],
];
const fmt = (v, kind) => (v === null ? 'n/a' : kind === 'pct' ? `${Math.round(v * 100)}%` : v.toFixed(kind));
const delta = (a, b, kind) => {
  if (a === null || b === null) return 'n/a';
  const d = b - a;
  const s = kind === 'pct' ? `${Math.round(d * 100)} pp` : d.toFixed(kind);
  return d > 0 ? `+${s}` : s;
};

export function compare(A, B) {
  const tasks = [...new Set([...A.runs, ...B.runs].map((r) => r.task))].sort();
  const groups = [...tasks.map((t) => [t, A.runs.filter((r) => r.task === t), B.runs.filter((r) => r.task === t)]), ['overall', A.runs, B.runs]];
  const out = [`# ${A.label} vs ${B.label}`, ''];
  out.push(`| Task | Label | n | ${COLS.map((c) => c[1]).join(' | ')} |`, `|---|---|---|${COLS.map(() => '---').join('|')}|`);
  for (const [t, ra, rb] of groups) {
    for (const [label, runs] of [[A.label, ra], [B.label, rb]]) {
      const m = metrics(runs);
      out.push(`| ${t} | ${label} | ${m.n} | ${COLS.map(([k, , kind]) => fmt(m[k], kind)).join(' | ')} |`);
    }
  }
  out.push('', `Deltas (${B.label} − ${A.label}). "within noise" when either side has fewer than ${MIN_RUNS} runs.`, '');
  out.push(`| Task | ${COLS.map((c) => `Δ ${c[1]}`).join(' | ')} | note |`, `|---|${COLS.map(() => '---').join('|')}|---|`);
  for (const [t, ra, rb] of groups) {
    const a = metrics(ra);
    const b = metrics(rb);
    const note = Math.min(a.n, b.n) < MIN_RUNS ? 'within noise' : '';
    out.push(`| ${t} | ${COLS.map(([k, , kind]) => delta(a[k], b[k], kind)).join(' | ')} | ${note} |`);
  }
  return out.join('\n');
}

const same = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
if (process.argv[1] && same(path.resolve(process.argv[1]), fileURLToPath(import.meta.url))) {
  try {
    const args = process.argv.slice(2);
    const dirIdx = args.indexOf('--results-dir');
    const dir = dirIdx >= 0 ? path.resolve(args[dirIdx + 1]) : path.join(HERE, 'results');
    const labels = args.filter((x, i) => !x.startsWith('--') && args[i - 1] !== '--results-dir');
    if (labels.length !== 2) throw new Error('Usage: node evals/compare.mjs <labelA> <labelB> [--results-dir dir]');
    const load = (l) => JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'));
    console.log(compare(load(labels[0]), load(labels[1])));
  } catch (e) {
    console.error(`compare failed: ${e.message}`);
    process.exitCode = 1;
  }
}
