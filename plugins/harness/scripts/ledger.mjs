// The build ledger (SPEC §6.8, AGT-6, REC-4): docs/briefs/<id>.ledger.md, the memory of a
// /harness:build run. Task status, review rounds, QA and final review, and every ruling made
// instead of stopping to ask. Committed with the work, so it survives compaction and resumes.
// Usage: node ledger.mjs <command> <id> [args] [--dir <repo>]
//   init <id>                         create from the brief's "## Tasks" (### T1: title …); no-op if it exists
//   status <id> [--json] [--check]    summary; --check exits 1 unless the build is complete
//   set <id> <T> [--status s] [--rounds n] [--review text] [--commit sha]
//   ruling <id> "<what — why — cost if wrong>"
//   park <id> <T> "<finding — why parked>"
//   qa <id> "<PASS|FAIL|n/a …>"      final <id> "<PASS|CHANGES_REQUESTED …>"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { git, samePath } from './lib.mjs';

export const STATUSES = ['todo', 'doing', 'done', 'parked', 'blocked'];
const clean = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();

export const briefPath = (dir, id) => path.join(dir, 'docs', 'briefs', `${id}.md`);
export const ledgerPath = (dir, id) => path.join(dir, 'docs', 'briefs', `${id}.ledger.md`);

// Tasks from a brief: headings "### T<n>: <title>" (or "T<n>." / "T<n> -") under "## Tasks".
export function parseBriefTasks(text) {
  const t = String(text).replace(/\r\n/g, '\n');
  const start = t.search(/^## Tasks\b/m);
  if (start < 0) return [];
  const rest = t.slice(start + 1);
  const end = rest.search(/^## (?!#)/m);
  const section = end < 0 ? rest : rest.slice(0, end);
  return [...section.matchAll(/^###\s+(T\d+)\s*[:.\-–—]\s*(.+)$/gm)].map((m) => ({ id: m[1], title: clean(m[2]) }));
}

export function render(l) {
  const out = [`# Ledger: ${l.id}`, '', `Brief: docs/briefs/${l.id}.md · Base: ${l.base || '-'} · Started: ${l.started || '-'}`, ''];
  out.push('## Tasks', '| Task | Status | Rounds | Review | Commits | Title |', '|---|---|---|---|---|---|');
  for (const t of l.tasks) out.push(`| ${t.id} | ${t.status} | ${t.rounds} | ${clean(t.review) || '-'} | ${t.commits.join(' ') || '-'} | ${clean(t.title)} |`);
  out.push('', '## QA', `- ${clean(l.qa) || 'pending'}`, '', '## Final review', `- ${clean(l.final) || 'pending'}`, '');
  out.push('## Rulings', ...(l.rulings.length ? l.rulings.map((r) => `- Ruling: ${clean(r)}`) : ['- none']), '');
  out.push('## Parked findings', ...(l.parked.length ? l.parked.map((p) => `- ${clean(p)}`) : ['- none']), '');
  return out.join('\n');
}

export function parse(text) {
  const t = String(text).replace(/\r\n/g, '\n');
  const section = (name) => {
    const m = t.match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
    return m ? m[1] : '';
  };
  const bullets = (name) => section(name).split('\n').filter((x) => x.startsWith('- ')).map((x) => x.slice(2).trim()).filter((x) => x !== 'none');
  const header = t.match(/^Brief: .*?· Base: (\S+) · Started: (\S+)/m);
  const tasks = section('Tasks')
    .split('\n')
    .filter((x) => /^\| T\d+ \|/.test(x))
    .map((row) => {
      const [, id, status, rounds, review, commits, title] = row.split('|').map((c) => c.trim());
      return { id, status, rounds: Number(rounds) || 0, review: review === '-' ? '' : review, commits: commits === '-' ? [] : commits.split(/\s+/), title };
    });
  const one = (name) => {
    const v = bullets(name)[0] ?? 'pending';
    return v === 'pending' ? '' : v;
  };
  return {
    id: (t.match(/^# Ledger: (.+)$/m) ?? [])[1]?.trim(),
    base: header?.[1] === '-' ? '' : header?.[1] ?? '',
    started: header?.[2] === '-' ? '' : header?.[2] ?? '',
    tasks,
    qa: one('QA'),
    final: one('Final review'),
    rulings: bullets('Rulings').map((r) => r.replace(/^Ruling:\s*/, '')),
    parked: bullets('Parked findings'),
  };
}

// Complete = every task done or parked, final review PASS, QA PASS or n/a.
export function summary(l) {
  const next = l.tasks.find((t) => !['done', 'parked'].includes(t.status)) ?? null;
  const tasksDone = l.tasks.length > 0 && !next;
  const qaOk = /^(PASS|n\/a)\b/i.test(l.qa);
  const finalOk = /^PASS\b/.test(l.final);
  const missing = [!l.tasks.length && 'no tasks', !tasksDone && l.tasks.length && `${l.tasks.filter((t) => !['done', 'parked'].includes(t.status)).length} task(s) open`, !qaOk && 'QA not PASS', !finalOk && 'final review not PASS'].filter(Boolean);
  return {
    id: l.id,
    tasks: l.tasks.length,
    done: l.tasks.filter((t) => t.status === 'done').length,
    parked: l.tasks.filter((t) => t.status === 'parked').length,
    blocked: l.tasks.filter((t) => t.status === 'blocked').map((t) => t.id),
    next: next ? { id: next.id, title: next.title, status: next.status, rounds: next.rounds } : null,
    qa: l.qa || 'pending',
    final: l.final || 'pending',
    rulings: l.rulings.length,
    complete: missing.length === 0,
    missing,
  };
}

export function load(dir, id) {
  const file = ledgerPath(dir, id);
  return fs.existsSync(file) ? parse(fs.readFileSync(file, 'utf8')) : null;
}

function save(dir, l) {
  const file = ledgerPath(dir, l.id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(l) + '\n');
}

function opts(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const k = args[i].slice(2);
      if (['json', 'check'].includes(k)) o[k] = true;
      else o[k] = args[++i];
    } else o._.push(args[i]);
  }
  return o;
}

export function run(argv) {
  const [cmd, ...rest] = argv;
  const o = opts(rest);
  const dir = path.resolve(o.dir ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
  const id = o._[0];
  if (!cmd || !id) throw new Error('usage: ledger.mjs <init|status|set|ruling|park|qa|final> <id> …');
  if (cmd === 'init') {
    const existing = load(dir, id);
    if (existing) return { code: 0, out: `ledger exists (resume): ${summary(existing).done}/${existing.tasks.length} tasks done` };
    const brief = briefPath(dir, id);
    if (!fs.existsSync(brief)) throw new Error(`no brief at ${path.relative(dir, brief)}`);
    const tasks = parseBriefTasks(fs.readFileSync(brief, 'utf8'));
    if (!tasks.length) throw new Error(`the brief has no "## Tasks" section with "### T1: …" headings`);
    const base = git(['log', '--format=%h', '-1', '--grep', `^brief(${id})`], dir).stdout;
    const l = { id, base, started: new Date().toISOString().slice(0, 10), tasks: tasks.map((t) => ({ ...t, status: 'todo', rounds: 0, review: '', commits: [] })), qa: '', final: '', rulings: [], parked: [] };
    save(dir, l);
    return { code: 0, out: `ledger created: ${tasks.length} task(s), base ${base || 'unknown'}` };
  }
  const l = load(dir, id);
  if (!l) throw new Error(`no ledger for ${id}; run: ledger.mjs init ${id}`);
  if (cmd === 'status') {
    const s = summary(l);
    const out = o.json
      ? JSON.stringify(s, null, 2)
      : `${id}: ${s.done} done, ${s.parked} parked of ${s.tasks}; next ${s.next ? `${s.next.id} (${s.next.title})` : '-'}; QA ${s.qa}; final ${s.final}; ${s.rulings} ruling(s)${s.complete ? '; COMPLETE' : `; open: ${s.missing.join(', ')}`}`;
    return { code: o.check && !s.complete ? 1 : 0, out };
  }
  if (cmd === 'set') {
    const t = l.tasks.find((x) => x.id === o._[1]);
    if (!t) throw new Error(`no task ${o._[1]} in the ledger`);
    if (o.status !== undefined) {
      if (!STATUSES.includes(o.status)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
      t.status = o.status;
    }
    if (o.rounds !== undefined) t.rounds = Number(o.rounds) || 0;
    if (o.review !== undefined) t.review = o.review;
    if (o.commit) t.commits.push(o.commit);
  } else if (cmd === 'ruling') {
    if (!o._[1]) throw new Error('ruling text required: "<what> — <why> — <cost if wrong>"');
    l.rulings.push(o._[1]);
  } else if (cmd === 'park') {
    if (!o._[1] || !o._[2]) throw new Error('usage: park <id> <T> "<finding — why parked>"');
    l.parked.push(`${o._[1]}: ${o._[2]}`);
  } else if (cmd === 'qa' || cmd === 'final') {
    if (!o._[1]) throw new Error(`${cmd} result required`);
    l[cmd] = `${o._[1]} (${new Date().toISOString().slice(0, 10)})`;
  } else {
    throw new Error(`unknown command ${cmd}`);
  }
  save(dir, l);
  return { code: 0, out: `ledger ${id}: ${cmd} recorded` };
}

if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  try {
    const r = run(process.argv.slice(2));
    console.log(r.out);
    process.exitCode = r.code;
  } catch (e) {
    console.error(`ledger: ${e.message}`);
    process.exitCode = 2;
  }
}
