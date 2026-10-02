// /harness:new-app, mechanical half (NEW-1).
// Usage: node new-app.mjs <name> --dir <parent> [--owner <gh-user>] [--no-remote] [--public] [--json]
// Copies templates/app then templates/repo (the app's own files win), fills APP_NAME and OWNER,
// runs git init and the first commit, proves the Stop gate (GATE-6), and unless --no-remote
// creates a GitHub repo (private by default) and pushes. Prints the remaining manual steps.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PLUGIN_ROOT } from './floor.mjs';
import { git, samePath } from './lib.mjs';
import { listFiles, fill } from './adopt.mjs';
import { proveGate } from './prove.mjs';

const APP = path.join(PLUGIN_ROOT, 'templates', 'app');
const REPO = path.join(PLUGIN_ROOT, 'templates', 'repo');
const RENAME = { gitignore: '.gitignore', '.github/CODEOWNERS.fragment': '.github/CODEOWNERS' };

function parseArgs(argv) {
  const a = { name: null, dir: process.cwd(), owner: null, remote: true, public: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--dir') a.dir = argv[++i];
    else if (v === '--owner') a.owner = argv[++i];
    else if (v === '--no-remote') a.remote = false;
    else if (v === '--public') a.public = true;
    else if (v === '--json') a.json = true;
    else if (!v.startsWith('--') && !a.name) a.name = v;
    else throw new Error(`Unknown argument: ${v}`);
  }
  return a;
}

export function scaffold(target, { name, owner }) {
  const rows = [];
  const written = new Set();
  const put = (rel, text, source) => {
    const out = RENAME[rel] ?? rel;
    if (written.has(out)) return rows.push([out, `SKIPPED (app template wins over ${source})`]);
    const file = path.join(target, out);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, fill(text, { name, owner }));
    written.add(out);
    rows.push([out, `ADDED (${source})`]);
  };
  for (const rel of listFiles(APP)) put(rel, fs.readFileSync(path.join(APP, rel), 'utf8'), 'app');
  for (const rel of listFiles(REPO)) {
    if (rel === 'CLAUDE.skeleton.md' && written.has('CLAUDE.md')) continue; // the app ships its own contract
    put(rel === 'CLAUDE.skeleton.md' ? 'CLAUDE.md' : rel, fs.readFileSync(path.join(REPO, rel), 'utf8'), 'repo');
  }
  // Every placeholder must be gone.
  const leftovers = [...written].filter((rel) => /APP_NAME|@OWNER\b/.test(fs.readFileSync(path.join(target, rel), 'utf8')));
  if (leftovers.length) throw new Error(`placeholders left in: ${leftovers.join(', ')}`);
  return rows;
}

function ghLogin() {
  const r = spawnSync('gh', ['api', 'user', '--jq', '.login'], { encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : null;
}

if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.name || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(args.name)) throw new Error('give a kebab-case app name: node new-app.mjs <name> --dir <parent>');
    const owner = args.owner ?? ghLogin();
    if (!owner) throw new Error('no GitHub owner: pass --owner <gh-user> or run `gh auth login`');
    const target = path.resolve(args.dir, args.name);
    if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${target} already exists and isn't empty`);
    fs.mkdirSync(target, { recursive: true });

    const rows = scaffold(target, { name: args.name, owner });
    for (const cmd of [['init', '-q', '-b', 'main'], ['add', '-A'], ['commit', '-q', '-m', `chore: scaffold ${args.name} from claude-harness templates`]]) {
      const r = git(cmd, target);
      if (r.code !== 0) throw new Error(`git ${cmd[0]} failed: ${r.stderr}`);
    }
    const proof = proveGate(target);

    let remote = 'skipped (--no-remote)';
    if (args.remote && proof.ok) {
      const r = spawnSync('gh', ['repo', 'create', args.name, args.public ? '--public' : '--private', '--source', '.', '--remote', 'origin', '--push'], {
        cwd: target,
        encoding: 'utf8',
        windowsHide: true,
      });
      if (r.status !== 0) throw new Error(`gh repo create failed: ${(r.stderr || r.stdout).trim()}`);
      remote = `https://github.com/${owner}/${args.name} (${args.public ? 'public' : 'private'})`;
    } else if (args.remote) {
      remote = 'skipped: the gate proof failed';
    }

    const steps = [
      `cd ${target} && pnpm install`,
      'node .claude/hooks/check.mjs --all   # typecheck, lint, unit tests',
      `claude setup-token, then: gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo ${owner}/${args.name}`,
      `GitHub → Settings → Rules → ruleset on main: require PR, status checks \`ci\` and \`review\` (REV-2; private repos need a paid plan)`,
      '/harness:doctor inside the app',
    ];
    if (args.json) {
      console.log(JSON.stringify({ target, owner, gate: proof, remote, rows, steps }, null, 2));
    } else {
      console.log(`harness new-app · ${args.name} → ${target}\n`);
      console.log('| Path | Action |\n|---|---|\n' + rows.map(([p, a]) => `| ${p} | ${a} |`).join('\n'));
      console.log(`\nGate (GATE-6): ${proof.ok ? 'PROVEN' : 'FAILED'}: ${proof.detail}`);
      console.log(`Remote: ${remote}`);
      console.log('\nRemaining steps:\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));
    }
    process.exitCode = proof.ok ? 0 : 1;
  } catch (e) {
    console.error(`new-app failed: ${e.message}`);
    process.exitCode = 1;
  }
}
