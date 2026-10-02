// Hidden verifier for python-cli-flag. Finds a Python 3 interpreter (python3 or python), runs the
// unit tests, then checks --json output and that plain output is unchanged.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cwd = process.cwd();
const fail = (msg) => {
  console.error(`verify: ${msg}`);
  process.exit(1);
};

const python = ['python3', 'python', 'py'].find((p) => {
  const r = spawnSync(p, ['-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', windowsHide: true });
  return r.status === 0 && r.stdout.trim() === '3';
});
if (!python) fail('no Python 3 interpreter found (python3, python or py)');
const run = (args) => {
  const r = spawnSync(python, args, { cwd, encoding: 'utf8', windowsHide: true, env: { ...process.env, PYTHONUTF8: '1' } });
  return { ...r, stdout: (r.stdout || '').replace(/\r\n/g, '\n') }; // Windows text-mode stdout writes CRLF
};

const tests = run(['-m', 'unittest', 'discover', '-s', 'tests', '-t', '.']);
if (tests.status !== 0) fail(`unit tests fail:\n${tests.stderr}`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wc-'));
const file = path.join(tmp, 'sample.txt');
fs.writeFileSync(file, 'alpha beta\ngamma\n\ndelta epsilon zeta\n');
try {
  const plain = run(['-m', 'wordcount', file]);
  if (plain.status !== 0 || plain.stdout !== `4 6 37 ${file}\n`) fail(`plain output changed: ${JSON.stringify(plain.stdout)} ${plain.stderr}`);
  const json = run(['-m', 'wordcount', '--json', file]);
  if (json.status !== 0) fail(`--json exited ${json.status}: ${json.stderr.trim()}`);
  let parsed;
  try {
    parsed = JSON.parse(json.stdout);
  } catch {
    fail(`--json output is not JSON: ${JSON.stringify(json.stdout)}`);
  }
  if (JSON.stringify(parsed) !== JSON.stringify({ lines: 4, words: 6, chars: 37 })) fail(`--json output ${JSON.stringify(parsed)}`);
  const testText = fs.readdirSync(path.join(cwd, 'tests')).filter((f) => f.endsWith('.py')).map((f) => fs.readFileSync(path.join(cwd, 'tests', f), 'utf8')).join('\n');
  if (!/--json/.test(testText)) fail('no test exercises --json');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('verify: python-cli-flag OK');
