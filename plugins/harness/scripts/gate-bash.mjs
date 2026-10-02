// PreToolUse hook on Bash (SEC-5): deny dangerous commands with exit 2 and a reason.
// The gate never grants: anything it doesn't deny exits 0 and the permission rules decide.
import { fileURLToPath } from 'node:url';
import { readStdinJson, samePath } from './lib.mjs';

const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'pwsh', 'powershell', 'cmd']);
const WRAPPERS = new Set(['sudo', 'doas', 'env', 'command', 'exec', 'time', 'nohup', 'nice', 'xargs']);

// Split a command line into simple-command token lists. Quotes group, operators separate.
export function segments(command) {
  const out = [];
  let tokens = [];
  let cur = '';
  let quote = null;
  let has = false;
  const endToken = () => {
    if (has) tokens.push(cur);
    cur = '';
    has = false;
  };
  const endSegment = () => {
    endToken();
    if (tokens.length) out.push(tokens);
    tokens = [];
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < command.length) cur += command[++i];
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === '\\' && i + 1 < command.length) {
      cur += command[++i];
      has = true;
    } else if (/\s/.test(ch)) {
      if (ch === '\n') endSegment();
      else endToken();
    } else if (';&|()`'.includes(ch)) {
      endSegment();
    } else if (ch === '$' && command[i + 1] === '(') {
      endSegment();
      i++;
    } else if (ch === '<' && command[i + 1] === '(') {
      endSegment();
      i++;
    } else {
      cur += ch;
      has = true;
    }
  }
  endSegment();
  return out;
}

const base = (t) => t.replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');

// Drop leading VAR=value assignments and wrappers such as sudo or env.
function strip(tokens) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || WRAPPERS.has(base(tokens[i])))) {
    i++;
    while (i < tokens.length && tokens[i].startsWith('-')) i++; // wrapper flags, e.g. sudo -E
  }
  return tokens.slice(i);
}

// Positional (non-option) arguments, skipping the values of options that take one.
function positionals(args, valueFlags) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      out.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('-')) {
      if (!a.includes('=') && valueFlags.has(a)) i++;
      continue;
    }
    out.push(a);
  }
  return out;
}

const GIT_VALUE_FLAGS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);
const AWS_VALUE_FLAGS = new Set(['--profile', '--region', '--output', '--endpoint-url', '--query', '--color', '--ca-bundle', '--cli-read-timeout', '--cli-connect-timeout']);
const GCLOUD_VALUE_FLAGS = new Set(['--project', '--account', '--configuration', '--format', '--filter', '--region', '--zone', '--verbosity', '--impersonate-service-account']);
const KUBECTL_VALUE_FLAGS = new Set(['-n', '--namespace', '--context', '--kubeconfig', '--cluster', '--user', '-s', '--server']);

function checkGit(args) {
  // Global options come before the subcommand.
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    if (GIT_VALUE_FLAGS.has(args[i])) i++;
    i++;
  }
  if (args[i] !== 'push') return null;
  for (const a of args.slice(i + 1)) {
    if (a === '--force' || a.startsWith('--force-with-lease') || a === '--force-if-includes') return 'force push';
    if (/^-[A-Za-z]*f[A-Za-z]*$/.test(a)) return 'force push';
    if (/^\+/.test(a)) return 'force push (+refspec)';
  }
  return null;
}

const READ_ONLY = (v) => /^(describe|list|get)-/.test(v) || v === 'ls' || v === 'help' || v === 'wait';

function checkAws(args) {
  if (args.includes('--with-decryption')) return 'AWS credential read (--with-decryption)';
  const [service, verb] = positionals(args, AWS_VALUE_FLAGS);
  if (!service || service === 'help') return null;
  if (service === 'secretsmanager' && /^(batch-)?get-secret-value$/.test(verb || '')) return 'AWS credential read (secretsmanager)';
  if (service === 'ssm' && /^get-parameter/.test(verb || '')) return 'AWS credential read (ssm get-parameter)';
  if (!verb) return null; // e.g. `aws s3` alone prints help
  return READ_ONLY(verb) ? null : `AWS write or unknown verb: ${service} ${verb}`;
}

const GCLOUD_READ = new Set(['list', 'describe', 'ls', 'info', 'version', 'help', 'get-value', 'get-iam-policy', 'read', 'cat']);

function checkGcloud(args) {
  const pos = positionals(args, GCLOUD_VALUE_FLAGS);
  if (pos.includes('print-access-token') || pos.includes('print-identity-token')) return 'GCP credential read';
  if (pos[0] === 'secrets' && pos.includes('access')) return 'GCP credential read (secrets access)';
  if (pos.length === 0) return null;
  if (pos.some((p) => GCLOUD_READ.has(p) || /^(describe|list|get)-/.test(p))) return null;
  return `gcloud verb that isn't read-only: ${pos.join(' ')}`;
}

function checkSegment(tokens, depth) {
  const t = strip(tokens);
  if (t.length === 0) return null;
  const cmd = base(t[0]);
  const args = t.slice(1);

  if (SHELLS.has(cmd) || cmd === 'eval') {
    // Re-check scripts handed to a shell: bash -c "...", pwsh -Command "...", cmd /c ..., eval ...
    const idx = cmd === 'eval' ? 0 : args.findIndex((a) => /^(-c|-command|\/c|\/k)$/i.test(a)) + 1;
    if (idx > 0 || cmd === 'eval') {
      const script = args.slice(idx).join(' ');
      if (depth < 3 && script) return check(script, depth + 1);
    }
    return null;
  }
  if (cmd === 'git') return checkGit(args);
  if (cmd === 'terraform' || cmd === 'tofu') {
    const sub = positionals(args, new Set())[0];
    return sub === 'apply' || sub === 'destroy' ? `${cmd} ${sub}` : null;
  }
  if (cmd === 'kubectl') return positionals(args, KUBECTL_VALUE_FLAGS)[0] === 'delete' ? 'kubectl delete' : null;
  if (cmd === 'aws') return checkAws(args);
  if (cmd === 'gcloud') return checkGcloud(args);
  return null;
}

const DOWNLOADER = String.raw`(curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod)`;
const RUNNER = String.raw`(sh|bash|zsh|dash|ksh|fish|python3?|node|perl|ruby|pwsh|powershell|iex|invoke-expression)`;
// Checked against the command with quoted strings blanked, so `echo "curl x | sh"` passes.
// Scripts quoted for `bash -c "..."` are re-checked by checkSegment.
const PIPE_TO_SHELL = [
  new RegExp(String.raw`\b${DOWNLOADER}\b[^|;&]*\|\s*(sudo\s+(-\S+\s+)*)?${RUNNER}\b`, 'i'),
  new RegExp(String.raw`\b(iex|invoke-expression)\b[\s(]*\(?\s*${DOWNLOADER}\b`, 'i'),
];
// Checked against the raw command: sh -c "$(curl ...)", bash <(curl ...).
const SUBST_TO_SHELL = new RegExp(String.raw`\b${RUNNER}\s+(-c\s+)?["']?(\$\(|<\(|\x60)\s*${DOWNLOADER}\b`, 'i');

export function check(command, depth = 0) {
  if (typeof command !== 'string' || !command.trim()) return null;
  const unquoted = command.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');
  if (PIPE_TO_SHELL.some((re) => re.test(unquoted)) || SUBST_TO_SHELL.test(command)) {
    return 'download piped into a shell';
  }
  for (const seg of segments(command)) {
    const reason = checkSegment(seg, depth);
    if (reason) return reason;
  }
  return null;
}

// Run as a hook only when executed directly, so tests can import check().
if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  const input = await readStdinJson();
  const reason = check(input?.tool_input?.command);
  if (reason) {
    process.stderr.write(
      `Blocked by harness gate-bash: ${reason}.\n` +
        'This command is denied in agent sessions (SPEC SEC-5). If it is really needed, ask the human to run it.\n',
    );
    process.exit(2);
  }
  process.exit(0);
}
