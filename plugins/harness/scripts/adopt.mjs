// /harness:adopt, mechanical half (ADOPT-1, ADOPT-2, ADOPT-4). The skill does the judgement half.
// Usage: node adopt.mjs <repo> [--dry-run] [--owner <gh-user>] [--update <path,path|all>] [--json]
// Refuses a dirty tree. Works on branch harness/adopt. Never overwrites: missing files are ADDED,
// .claude/settings.json and CODEOWNERS are MERGED, harness.json is DRAFTED, an existing CLAUDE.md is
// never touched, and managed files that differ from the template are reported as DIFFERS with a diff.
// Never commits; the skill commits after making the checks real.
import fs from 'node:fs';
import path from 'node:path';
import { PLUGIN_ROOT } from './floor.mjs';
import { fileURLToPath } from 'node:url';
import { git, isGitRepo, readJson, samePath } from './lib.mjs';

export const TEMPLATE = path.join(PLUGIN_ROOT, 'templates', 'repo');
export const BRANCH = 'harness/adopt';

// Files the harness owns: re-running adopt compares them with the template (ADOPT-4).
const MANAGED = new Set([
  '.claude/hooks/lib.mjs',
  '.claude/hooks/stop-gate.mjs',
  '.claude/hooks/format-changed.mjs',
  '.claude/hooks/check.mjs',
  '.claude/hooks/test-diff.mjs',
  '.claude/agents/reviewer.md',
  '.github/workflows/ci.yml',
  '.github/workflows/review.yml',
  '.github/ISSUE_TEMPLATE/defect.yml',
]);
const CODEOWNERS_PLACES = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

const normalize = (t) => (t === null ? null : t.replace(/\r\n/g, '\n'));
const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);

export function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out.sort();
}

export function fill(text, { name, owner }) {
  let t = text.replace(/APP_NAME/g, name);
  if (owner) t = t.replace(/@OWNER\b/g, `@${owner}`);
  return t;
}

function lineDiff(have, want) {
  const a = normalize(have).split('\n');
  const b = normalize(want).split('\n');
  const out = [];
  for (const l of a) if (!b.includes(l)) out.push(`- ${l}`);
  for (const l of b) if (!a.includes(l)) out.push(`+ ${l}`);
  return out.slice(0, 60).join('\n');
}

// ADOPT-2: guess the checks from what the repo already uses.
export function draftChecks(repo) {
  const has = (f) => fs.existsSync(path.join(repo, f));
  const checks = [];
  const sources = [];

  const pkg = readJson(path.join(repo, 'package.json'));
  if (pkg) {
    const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lockb') || has('bun.lock') ? 'bun' : 'npm';
    const run = { pnpm: (s) => `pnpm -s ${s}`, yarn: (s) => `yarn -s ${s}`, bun: (s) => `bun run ${s}`, npm: (s) => `npm run -s ${s}` }[pm];
    const scripts = pkg.scripts ?? {};
    const typecheck = ['typecheck', 'type-check', 'check-types', 'tsc'].find((s) => scripts[s]);
    const test = ['test:unit', 'test'].find((s) => scripts[s] && !/no test specified/.test(scripts[s]));
    for (const s of [typecheck, scripts.lint && 'lint', test]) if (s) checks.push(run(s));
    sources.push(`package.json scripts (${pm})`);
  }

  const py = [readText(path.join(repo, 'pyproject.toml')), readText(path.join(repo, 'requirements-dev.txt')), readText(path.join(repo, 'requirements.txt'))].join('\n');
  if (has('pyproject.toml') || has('requirements.txt') || has('requirements-dev.txt')) {
    if (/\bruff\b/.test(py)) checks.push('ruff check .');
    if (/\bmypy\b/.test(py)) checks.push('mypy .');
    if (/\bpytest\b/.test(py)) checks.push('pytest -q');
    sources.push('pyproject.toml / requirements');
  }
  if (has('go.mod')) {
    checks.push('go vet ./...', 'go test ./...');
    sources.push('go.mod');
  }
  if (has('Cargo.toml')) {
    checks.push('cargo fmt --check', 'cargo test');
    sources.push('Cargo.toml');
  }
  return { checks, sources };
}

function mergeSettings(existing, template) {
  const out = structuredClone(existing);
  out.hooks ??= {};
  let changed = false;
  for (const [event, groups] of Object.entries(template.hooks)) {
    for (const group of groups) {
      const script = group.hooks[0].args[0].split('/').pop();
      if (JSON.stringify(out.hooks[event] ?? []).includes(script)) continue;
      out.hooks[event] = [...(out.hooks[event] ?? []), group];
      changed = true;
    }
  }
  if (out.worktree?.baseRef === undefined) {
    out.worktree = { ...(out.worktree ?? {}), baseRef: template.worktree.baseRef };
    changed = true;
  }
  return { out, changed };
}

export function plan(repo, { owner = null, update = [] } = {}) {
  const name = path.basename(path.resolve(repo));
  const vars = { name, owner };
  const rows = [];
  const notes = [];
  const writes = [];
  const add = (rel, action, content, extra = {}) => {
    rows.push({ path: rel, action, ...extra });
    if (content !== undefined) writes.push([rel, content]);
  };

  for (const rel of listFiles(TEMPLATE)) {
    const want = fill(fs.readFileSync(path.join(TEMPLATE, rel), 'utf8'), vars);
    if (rel === 'CLAUDE.skeleton.md') {
      if (fs.existsSync(path.join(repo, 'CLAUDE.md'))) add('CLAUDE.md', 'SKIPPED', undefined, { why: 'existing CLAUDE.md is never touched; the skill trims it' });
      else add('CLAUDE.md', 'ADDED', want);
      continue;
    }
    if (rel === '.claude/settings.json') {
      const target = path.join(repo, rel);
      const text = readText(target);
      if (text === null) {
        add(rel, 'ADDED', want);
        continue;
      }
      let existing;
      try {
        existing = JSON.parse(text);
      } catch (e) {
        throw new Error(`${rel} isn't valid JSON (${e.message}); fix it first, nothing was changed`);
      }
      const { out, changed } = mergeSettings(existing, JSON.parse(want));
      add(rel, changed ? 'MERGED' : 'SKIPPED', changed ? JSON.stringify(out, null, 2) + '\n' : undefined);
      continue;
    }
    if (rel === '.github/CODEOWNERS.fragment') {
      const place = CODEOWNERS_PLACES.find((p) => fs.existsSync(path.join(repo, p))) ?? '.github/CODEOWNERS';
      const text = readText(path.join(repo, place));
      const have = new Set((normalize(text) ?? '').split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
      const missing = normalize(want).split('\n').filter((l) => l && !l.startsWith('#') && !have.has(l.split(/\s+/)[0]));
      if (!owner && missing.length) notes.push('No --owner given: CODEOWNERS lines use the placeholder @OWNER. Replace it before merging.');
      if (missing.length === 0) add(place, 'SKIPPED');
      else if (text === null) add(place, 'ADDED', want);
      else {
        const header = '\n# Harness paths are human-owned (SPEC REV-3), added by /harness:adopt\n';
        add(place, 'MERGED', text.replace(/\n*$/, '\n') + header + missing.join('\n') + '\n');
      }
      continue;
    }
    const target = path.join(repo, rel);
    const have = readText(target);
    if (have === null) add(rel, 'ADDED', want);
    else if (!MANAGED.has(rel) || normalize(have) === normalize(want)) add(rel, 'SKIPPED');
    else if (update.includes('all') || update.includes(rel)) add(rel, 'UPDATED', want);
    else add(rel, 'DIFFERS', undefined, { diff: lineDiff(have, want) });
  }

  // ADOPT-2: harness.json drafted from what the repo uses; the skill makes the checks real.
  const cfgRel = '.claude/harness.json';
  if (fs.existsSync(path.join(repo, cfgRel))) add(cfgRel, 'SKIPPED');
  else {
    const { checks, sources } = draftChecks(repo);
    notes.push(
      checks.length
        ? `harness.json drafted from ${sources.join(', ')}: ${checks.join(' · ')}. Run them, fix the commands until they pass on today's code, then remove "_draft".`
        : 'harness.json drafted with no checks: nothing recognisable (package.json scripts, pyproject.toml, go.mod, Cargo.toml). Fill in "check".',
    );
    add(cfgRel, 'DRAFTED', JSON.stringify({ version: 1, check: checks, _draft: true }, null, 2) + '\n');
  }
  return { rows, notes, writes };
}

function parseArgs(argv) {
  const a = { repo: null, dryRun: false, owner: null, update: [], json: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--dry-run') a.dryRun = true;
    else if (v === '--json') a.json = true;
    else if (v === '--owner') a.owner = argv[++i];
    else if (v === '--update') a.update = argv[++i].split(',').map((s) => s.trim());
    else if (!v.startsWith('--') && !a.repo) a.repo = v;
    else throw new Error(`Unknown argument: ${v}`);
  }
  return a;
}

if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const repo = path.resolve(args.repo ?? process.cwd());
    if (!isGitRepo(repo)) throw new Error(`${repo} is not a git repository`);
    const status = git(['status', '--porcelain'], repo);
    if (status.stdout) throw new Error(`refusing to adopt a dirty tree; commit or stash first:\n${status.stdout}`);

    const result = plan(repo, args);
    if (!args.dryRun && result.writes.length) {
      const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], repo).stdout;
      if (branch !== BRANCH) {
        const exists = git(['rev-parse', '--verify', '--quiet', `refs/heads/${BRANCH}`], repo).code === 0;
        const sw = git(exists ? ['switch', BRANCH] : ['switch', '-c', BRANCH], repo);
        if (sw.code !== 0) throw new Error(`git switch ${BRANCH} failed: ${sw.stderr}`);
      }
      for (const [rel, content] of result.writes) {
        const target = path.join(repo, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
    }

    if (args.json) {
      console.log(JSON.stringify({ repo, branch: BRANCH, dryRun: args.dryRun, rows: result.rows, notes: result.notes }, null, 2));
    } else {
      console.log(`harness adopt · ${repo} · branch ${BRANCH}${args.dryRun ? ' · DRY RUN, nothing written' : ''}\n`);
      console.log('| Path | Action |\n|---|---|');
      for (const r of result.rows) console.log(`| ${r.path} | ${r.action}${args.dryRun && !['SKIPPED', 'DIFFERS'].includes(r.action) ? ' (would)' : ''} |`);
      for (const r of result.rows.filter((x) => x.action === 'DIFFERS')) console.log(`\n### ${r.path} differs from the template\n\`\`\`diff\n${r.diff}\n\`\`\``);
      if (result.notes.length) console.log('\nNotes:\n' + result.notes.map((n) => `- ${n}`).join('\n'));
      if (result.rows.some((r) => r.action === 'DIFFERS')) console.log('\nTo take the template version: --update <path,path> or --update all');
    }
  } catch (e) {
    console.error(`adopt failed: ${e.message}`);
    process.exitCode = 1;
  }
}
