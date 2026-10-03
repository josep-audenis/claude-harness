// /harness:doctor: check this device and the current repo against SPEC.md.
// Usage: node doctor.mjs [--home <dir>] [--repo <dir> | --no-repo] [--live] [--json] [--claude-bin <path>]
// Prints one row per requirement (PASS, FAIL, WARN, SKIP) and exits 1 if any MUST fails.
// --live spends tokens: it runs `claude -p` once to prove the plugin's Stop hook blocks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PLUGIN_ROOT, configDir, readText, loadFloor, loopText, mergeSettings, personalBlock, currentBlock, normalize,
  deepEqual, pluginVersion,
} from './floor.mjs';
import { readJson, git, isGitRepo } from './lib.mjs';
import { proveGate } from './prove.mjs';

const MIN_CLAUDE_HOOKS = [2, 1, 139]; // hook `args` (exec form) added in 2.1.139 (Claude Code CHANGELOG)
const MIN_CLAUDE = [2, 1, 233]; // /auto-mode-setup on native Windows

function parseArgs(argv) {
  const a = { home: null, repo: null, noRepo: false, live: false, json: false, claudeBin: null };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--home') a.home = argv[++i];
    else if (v === '--repo') a.repo = argv[++i];
    else if (v === '--no-repo') a.noRepo = true;
    else if (v === '--live') a.live = true;
    else if (v === '--json') a.json = true;
    else if (v === '--claude-bin') a.claudeBin = argv[++i];
    else throw new Error(`Unknown argument: ${v}`);
  }
  // Which Claude Code to check: --claude-bin / HARNESS_CLAUDE_BIN, else the binary running this
  // session (CLAUDE_CODE_EXECPATH, set by the CLI and the desktop app), else `claude` on PATH.
  const session = process.env.CLAUDE_CODE_EXECPATH;
  if (a.claudeBin || process.env.HARNESS_CLAUDE_BIN) {
    a.claudeBin ??= process.env.HARNESS_CLAUDE_BIN;
    a.claudeSource = 'given';
  } else if (session && fs.existsSync(session)) {
    a.claudeBin = session;
    a.claudeSource = 'session';
  } else {
    a.claudeBin = 'claude';
    a.claudeSource = 'path';
  }
  return a;
}

// Run a tool. A path to a .mjs/.js file runs with node (used for stubs). On Windows, retry
// through the shell so .cmd shims (npm-installed tools) are found too.
function tool(bin, args, opts = {}) {
  const [cmd, pre] = /\.(mjs|cjs|js)$/.test(bin) ? [process.execPath, [bin]] : [bin, []];
  let r = spawnSync(cmd, [...pre, ...args], { encoding: 'utf8', windowsHide: true, timeout: 30_000, ...opts });
  if (r.error?.code === 'ENOENT' && process.platform === 'win32' && !pre.length) {
    const quoted = [cmd, ...args].map((x) => (/[\s"]/.test(x) ? `"${x.replace(/"/g, '\\"')}"` : x)).join(' ');
    r = spawnSync(quoted, { shell: true, encoding: 'utf8', windowsHide: true, timeout: 30_000, ...opts });
    if (r.status !== 0 && /not recognized|not found/i.test(r.stderr || '')) return { ok: false, out: '', missing: true };
  }
  if (r.error) return { ok: false, out: '', missing: r.error.code === 'ENOENT' };
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), code: r.status };
}

const versionOf = (s) => (String(s).match(/(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
const atLeast = (v, min) => {
  for (let i = 0; i < 3; i++) if ((v[i] ?? 0) !== min[i]) return (v[i] ?? 0) > min[i];
  return true;
};

const rows = [];
const row = (id, level, status, detail, fix = '') => rows.push({ id, level, status, detail, fix });

// ---------- device ----------
function deviceChecks(args) {
  const dir = configDir(args.home);
  const settingsText = readText(path.join(dir, 'settings.json'));
  let settings = {};
  try {
    settings = settingsText ? JSON.parse(settingsText) : {};
  } catch {
    row('DEV-3', 'MUST', 'FAIL', 'settings.json is not valid JSON', 'Fix ~/.claude/settings.json by hand, then /harness:setup');
  }
  const floor = loadFloor();

  // DEV-1: tools on PATH.
  const gitV = tool('git', ['--version']);
  const ghV = tool('gh', ['--version']);
  const nodeV = versionOf(process.version);
  const missing = [];
  if (!gitV.ok) missing.push('git');
  if (!ghV.ok) missing.push('gh');
  if (nodeV[0] < 20) missing.push(`node >= 20 (have ${process.version})`);
  row(
    'DEV-1 tools',
    'MUST',
    missing.length ? 'FAIL' : 'PASS',
    missing.length
      ? `missing: ${missing.join(', ')}`
      : `git ${versionOf(gitV.out).join('.')}, node ${process.version}, gh ${versionOf(ghV.out).join('.')}`,
    'Install Git (Git for Windows), Node LTS and GitHub CLI; see docs/guides/device-setup.md',
  );
  if (ghV.ok) {
    const auth = tool('gh', ['auth', 'status']);
    row('DEV-1 gh auth', 'MUST', auth.ok ? 'PASS' : 'FAIL', auth.ok ? 'gh is authenticated' : 'gh is not authenticated', 'gh auth login && gh auth setup-git');
  }
  // The Claude Code that matters is the one running this session (the desktop app bundles its own,
  // exposed as CLAUDE_CODE_EXECPATH); the `claude` on PATH is what terminal sessions use.
  const label = { session: 'this session', path: 'PATH', given: '--claude-bin' }[args.claudeSource];
  const cv = tool(args.claudeBin, ['--version']);
  let sessionVersion = null;
  if (!cv.ok) {
    row('DEV-1 claude', 'MUST', 'FAIL', `Claude Code not found (${label})`, 'Install Claude Code with the native installer');
  } else {
    const v = versionOf(cv.out);
    sessionVersion = v.join('.');
    if (!atLeast(v, MIN_CLAUDE_HOOKS)) {
      row('DEV-1 claude', 'MUST', 'FAIL', `Claude Code ${v.join('.')} (${label}): exec-form hooks need ${MIN_CLAUDE_HOOKS.join('.')}+, so every harness hook is silently inert`, 'claude update');
    } else {
      const ok = atLeast(v, MIN_CLAUDE);
      row('DEV-1 claude', 'SHOULD', ok ? 'PASS' : 'WARN', `Claude Code ${v.join('.')} (${label})${ok ? '' : ` (/auto-mode-setup on Windows needs ${MIN_CLAUDE.join('.')}+)`}`, 'claude update');
    }
  }
  if (args.claudeSource === 'session') {
    const pv = tool(process.env.HARNESS_PATH_CLAUDE_BIN || 'claude', ['--version']);
    if (pv.ok) {
      const v = versionOf(pv.out);
      const ok = atLeast(v, MIN_CLAUDE_HOOKS);
      row(
        'DEV-1 terminal',
        'SHOULD',
        ok ? 'PASS' : 'WARN',
        ok ? `terminal \`claude\` ${v.join('.')}` : `terminal \`claude\` ${v.join('.')} is older than ${MIN_CLAUDE_HOOKS.join('.')}: terminal sessions run no harness hooks (this session runs ${sessionVersion ?? '?'})`,
        'claude update (in a terminal)',
      );
    }
  }

  // DEV-2: plugin installed and enabled.
  const installed = readJson(path.join(dir, 'plugins', 'installed_plugins.json'), {});
  const keys = Object.keys(installed?.plugins ?? {}).filter((k) => k.startsWith('harness@'));
  const enabled = keys.filter((k) => settings.enabledPlugins?.[k] !== false);
  row(
    'DEV-2',
    'MUST',
    enabled.length ? 'PASS' : 'FAIL',
    enabled.length ? `installed and enabled: ${enabled.join(', ')}` : keys.length ? `installed but disabled: ${keys.join(', ')}` : 'harness plugin not installed',
    '/plugin marketplace add josep-audenis/claude-harness, then /plugin install harness@josep-harness',
  );

  // DEV-3: floor fully applied (settings, CLAUDE.md block, loop.md).
  const merged = mergeSettings(settings, loadFloor()).result;
  const claudeText = readText(path.join(dir, 'CLAUDE.md'));
  const blockOk = currentBlock(claudeText) === personalBlock('\n');
  const loopOk = normalize(readText(path.join(dir, 'loop.md'))) === normalize(loopText());
  const settingsOk = settingsText !== null && deepEqual(merged, settings);
  const floorOk = settingsOk && blockOk && loopOk;
  row(
    'DEV-3',
    'MUST',
    floorOk ? 'PASS' : 'FAIL',
    floorOk ? 'device floor applied' : `out of date: ${[!settingsOk && 'settings.json', !blockOk && 'CLAUDE.md block', !loopOk && 'loop.md'].filter(Boolean).join(', ')}`,
    '/harness:setup',
  );

  // DEV-6 and DIST-3: device record and version drift.
  const device = readJson(path.join(dir, 'harness-device.json'));
  row('DEV-6', 'MUST', device ? 'PASS' : 'FAIL', device ? `${device.os}, harness ${device.harnessVersion}, set up ${device.setupDate}` : 'no ~/.claude/harness-device.json', '/harness:setup');
  if (!device) row('DIST-3', 'MUST', 'SKIP', 'no device record');
  else if (device.harnessVersion === pluginVersion()) row('DIST-3', 'MUST', 'PASS', `setup matches plugin ${pluginVersion()}`);
  else row('DIST-3', 'MUST', 'WARN', `plugin is ${pluginVersion()}, setup ran with ${device.harnessVersion}`, '/harness:setup to re-apply the floor');

  // SEC-1: deny rules.
  const deny = settings.permissions?.deny ?? [];
  const missingDeny = floor.permissions.deny.filter((r) => !deny.includes(r));
  row('SEC-1', 'MUST', missingDeny.length ? 'FAIL' : 'PASS', missingDeny.length ? `missing deny: ${missingDeny.join(', ')}` : `${floor.permissions.deny.length} floor deny rules present`, '/harness:setup');

  // SEC-2 and SEC-6: default mode.
  const mode = settings.permissions?.defaultMode;
  if (!mode) row('SEC-2', 'MUST', 'FAIL', 'permissions.defaultMode not set', '/harness:setup');
  else row('SEC-2', 'MUST', 'PASS', mode === 'auto' ? 'defaultMode auto' : `defaultMode ${mode} (your choice, kept)`);
  row('SEC-6', 'MUST', mode === 'bypassPermissions' ? 'FAIL' : 'PASS', mode === 'bypassPermissions' ? 'defaultMode is bypassPermissions' : 'bypassPermissions is not the default', 'Set permissions.defaultMode to auto; use bypass only inside a container');

  // SEC-3: auto mode taught about this environment.
  const env = settings.autoMode?.environment;
  row('SEC-3', 'SHOULD', Array.isArray(env) && env.length ? 'PASS' : 'WARN', Array.isArray(env) && env.length ? `${env.length} autoMode.environment entries` : 'autoMode.environment not set', 'Run /auto-mode-setup, then `claude auto-mode config`');

  // SEC-4: sandbox.
  if (process.platform === 'win32') row('SEC-4', 'SHOULD', 'SKIP', 'native Windows has no sandbox (needs WSL2)');
  else row('SEC-4', 'SHOULD', settings.sandbox?.enabled === true ? 'PASS' : 'WARN', settings.sandbox?.enabled === true ? 'sandbox.enabled' : 'sandbox not enabled', '/harness:setup, then /sandbox to check dependencies');

  // CTX-1 and LOOP-6.
  row('CTX-1', 'MUST', blockOk ? 'PASS' : 'FAIL', blockOk ? 'personal rules block current' : claudeText && currentBlock(claudeText) ? 'personal rules block outdated' : 'no harness block in ~/.claude/CLAUDE.md', '/harness:setup');
  row('LOOP-6', 'MUST', loopOk ? 'PASS' : 'FAIL', loopOk ? '~/.claude/loop.md current' : '~/.claude/loop.md missing or different', '/harness:setup');

  // COST-1, COST-2, AGT-5.
  row('COST-1', 'SHOULD', settings.effortLevel === 'high' ? 'PASS' : 'WARN', `effortLevel ${settings.effortLevel ?? 'unset'}`, '/harness:setup, or /effort high');
  row('COST-2', 'SHOULD', settings.env?.CLAUDE_CODE_SUBAGENT_MODEL === 'sonnet' ? 'PASS' : 'WARN', `CLAUDE_CODE_SUBAGENT_MODEL=${settings.env?.CLAUDE_CODE_SUBAGENT_MODEL ?? 'unset'}`, '/harness:setup');
  const teams = settings.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  row('AGT-5', 'MUST', teams && teams !== '0' ? 'FAIL' : 'PASS', teams && teams !== '0' ? 'agent teams enabled in user settings' : 'agent teams not enabled by default', 'Remove CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS from ~/.claude/settings.json env');
}

// ---------- repo ----------
function repoChecks(repo) {
  const p = (...x) => path.join(repo, ...x);
  const has = (...x) => fs.existsSync(p(...x));

  // CTX-2
  const claude = readText(p('CLAUDE.md'));
  const lines = claude === null ? 0 : normalize(claude).trimEnd().split('\n').length;
  row('CTX-2', 'MUST', claude !== null && lines <= 45 ? 'PASS' : 'FAIL', claude === null ? 'no CLAUDE.md' : `CLAUDE.md has ${lines} lines (max 45)`, '/harness:adopt trims or creates it');

  // CTX-3
  const cfg = readJson(p('.claude', 'harness.json'));
  const cfgOk = cfg && cfg.version === 1 && Array.isArray(cfg.check) && cfg.check.length > 0 && cfg.check.every((c) => typeof c === 'string');
  row('CTX-3', 'MUST', cfgOk ? 'PASS' : 'FAIL', cfgOk ? `${cfg.check.length} check command(s)` : cfg ? '.claude/harness.json is malformed (needs version 1 and a check list)' : 'no .claude/harness.json', '/harness:adopt drafts it');

  // CTX-4
  const features = readJson(p('feature_list.json'));
  const list = Array.isArray(features) ? features : features?.features;
  const featuresOk = Array.isArray(list) && list.every((f) => f && typeof f.id === 'string' && typeof f.description === 'string' && Array.isArray(f.steps) && typeof f.passes === 'boolean');
  const progressOk = has('progress.md');
  row('CTX-4', 'MUST', featuresOk && progressOk ? 'PASS' : 'FAIL', featuresOk && progressOk ? `${list.length} features, progress.md present` : [!featuresOk && 'feature_list.json missing or malformed', !progressOk && 'no progress.md'].filter(Boolean).join('; '), '/harness:adopt seeds them');

  // CTX-7
  const agents = readText(p('AGENTS.md'));
  row('CTX-7', 'SHOULD', agents && /CLAUDE\.md/.test(agents) ? 'PASS' : 'WARN', agents ? (/CLAUDE\.md/.test(agents) ? 'AGENTS.md points to CLAUDE.md' : "AGENTS.md doesn't mention CLAUDE.md") : 'no AGENTS.md', '/harness:adopt adds it');

  // Committed harness layer (NIGHT-3, §5)
  const settings = readJson(p('.claude', 'settings.json'), {});
  const wired = JSON.stringify(settings?.hooks?.Stop ?? []).includes('stop-gate.mjs');
  const layer = [
    [has('.claude', 'hooks', 'stop-gate.mjs') && has('.claude', 'hooks', 'lib.mjs'), '.claude/hooks/stop-gate.mjs + lib.mjs'],
    [wired, 'Stop hook wired in .claude/settings.json'],
    [has('.claude', 'agents', 'reviewer.md'), '.claude/agents/reviewer.md'],
  ];
  const missingLayer = layer.filter(([ok]) => !ok).map(([, name]) => name);
  row('NIGHT-3', 'MUST', missingLayer.length ? 'FAIL' : 'PASS', missingLayer.length ? `missing: ${missingLayer.join(', ')}` : 'committed stop-gate and reviewer present', '/harness:adopt adds them');

  // GATE-1 proven (GATE-6)
  if (!cfgOk) row('GATE-1', 'MUST', 'SKIP', 'no valid harness.json to prove');
  else {
    const proof = proveGate(repo);
    row('GATE-1', 'MUST', proof.ok ? 'PASS' : 'FAIL', `proven: ${proof.detail}`, 'Check .claude/hooks/stop-gate.mjs against the template (/harness:adopt shows DIFFERS)');
  }

  // REV-1
  const ci = has('.github', 'workflows', 'ci.yml');
  const review = has('.github', 'workflows', 'review.yml');
  row('REV-1', 'MUST', ci && review ? 'PASS' : 'FAIL', ci && review ? 'ci.yml and review.yml present' : `missing: ${[!ci && 'ci.yml', !review && 'review.yml'].filter(Boolean).join(', ')}`, '/harness:adopt adds them');

  // REV-3
  const owners = readText(p('.github', 'CODEOWNERS')) ?? readText(p('CODEOWNERS')) ?? readText(p('docs', 'CODEOWNERS'));
  const needed = ['/.claude/', '/.github/', '/AGENTS.md', '/CLAUDE.md'];
  const ownerLines = owners ? normalize(owners).split('\n').map((l) => l.trim().split(/\s+/)[0]) : [];
  const missingOwners = needed.filter((n) => !ownerLines.includes(n));
  row('REV-3', 'MUST', owners && !missingOwners.length ? 'PASS' : 'FAIL', owners ? (missingOwners.length ? `CODEOWNERS missing ${missingOwners.join(', ')}` : 'harness paths are human-owned') : 'no CODEOWNERS', '/harness:adopt merges CODEOWNERS');

  // REV-2, only with a GitHub remote
  const remote = git(['remote', 'get-url', 'origin'], repo);
  const m = remote.code === 0 && remote.stdout.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  if (!m) row('REV-2', 'MUST', 'SKIP', 'no GitHub remote');
  else {
    const branch = git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], repo).stdout.replace(/^origin\//, '') || 'main';
    const r = tool('gh', ['api', `repos/${m[1]}/${m[2]}/rules/branches/${branch}`]);
    let rules = [];
    try {
      rules = r.ok ? JSON.parse(r.out) : [];
    } catch {
      rules = [];
    }
    const pr = rules.find((x) => x.type === 'pull_request');
    const checks = rules.find((x) => x.type === 'required_status_checks');
    const contexts = (checks?.parameters?.required_status_checks ?? []).map((c) => c.context);
    const problems = [!pr && 'PR not required', !contexts.includes('ci') && 'check `ci` not required', !contexts.includes('review') && 'check `review` not required'].filter(Boolean);
    const codeOwner = pr?.parameters?.require_code_owner_review === true;
    if (!r.ok) row('REV-2', 'MUST', 'FAIL', `couldn't read rules for ${branch}: ${r.out.split('\n')[0]}`, 'gh auth status; see docs/guides/new-app.md §2');
    else if (problems.length) row('REV-2', 'MUST', 'FAIL', problems.join('; '), 'Add a ruleset on main: docs/guides/new-app.md §2');
    else row('REV-2', 'MUST', codeOwner ? 'PASS' : 'WARN', codeOwner ? `${branch} protected: PR, ci, review, code owners` : `${branch} protected: PR, ci, review; code-owner review off (see NOTES.md, REV-2 proposal)`);
  }
}

// ---------- live ----------
function liveCheck(args) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-live-'));
  try {
    const counter = 'node -e "require(\'fs\').appendFileSync(\'stop-count.txt\', \'x\'); process.exit(1)"';
    fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.claude', 'harness.json'), JSON.stringify({ version: 1, check: [counter] }) + '\n');
    fs.writeFileSync(path.join(tmp, 'note.txt'), 'dirty\n');
    spawnSync('git', ['init', '-q'], { cwd: tmp });
    const r = tool(
      args.claudeBin,
      ['-p', 'Reply with the single word: done. Do not use any tools.', '--plugin-dir', PLUGIN_ROOT, '--setting-sources', 'project', '--model', 'haiku', '--max-turns', '3', '--output-format', 'json'],
      { cwd: tmp, timeout: 300_000 },
    );
    const count = (readText(path.join(tmp, 'stop-count.txt')) ?? '').length;
    if (count >= 2) row('GATE-1 live', 'MUST', 'PASS', `plugin Stop hook blocked and the turn continued (${count} gate runs)`);
    else if (count === 1) row('GATE-1 live', 'MUST', 'FAIL', 'Stop hook ran once and the session ended: plugin Stop hooks halt instead of continuing (claude-code#10412)', 'Rely on the committed repo copy (.claude/hooks/stop-gate.mjs) and report it');
    else row('GATE-1 live', 'MUST', 'FAIL', `Stop hook never ran (claude exit ${r.code ?? 'n/a'})`, 'Is the plugin valid? Run `claude plugin validate` on it');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------- main ----------
try {
  const args = parseArgs(process.argv.slice(2));
  deviceChecks(args);
  let repo = null;
  if (!args.noRepo) {
    const start = path.resolve(args.repo || process.cwd());
    if (isGitRepo(start)) repo = git(['rev-parse', '--show-toplevel'], start).stdout || start;
    else if (args.repo) repo = start;
  }
  if (repo) repoChecks(path.resolve(repo));
  if (args.live) liveCheck(args);

  const mustFailures = rows.filter((r) => r.level === 'MUST' && r.status === 'FAIL').length;
  if (args.json) {
    console.log(JSON.stringify({ version: pluginVersion(), repo, rows, mustFailures }, null, 2));
  } else {
    const esc = (s) => String(s).replace(/\|/g, '\\|');
    console.log(`harness doctor v${pluginVersion()} · ${process.platform}${repo ? ` · repo ${repo}` : ''}\n`);
    console.log('| Req | Level | Status | Detail | Fix |\n|---|---|---|---|---|');
    for (const r of rows) console.log(`| ${r.id} | ${r.level} | ${r.status} | ${esc(r.detail)} | ${r.status === 'PASS' || r.status === 'SKIP' ? '' : esc(r.fix)} |`);
    console.log(`\n${mustFailures ? `${mustFailures} MUST requirement(s) failing.` : 'All MUST requirements pass.'}`);
  }
  process.exitCode = mustFailures ? 1 : 0;
} catch (e) {
  console.error(`doctor failed: ${e.message}`);
  process.exitCode = 2;
}
