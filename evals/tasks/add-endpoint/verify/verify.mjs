// Hidden verifier for add-endpoint. Runs in the agent's work dir after the session; the agent never sees it.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const fail = (msg) => {
  console.error(`verify: ${msg}`);
  process.exit(1);
};

const route = path.join(cwd, 'app', 'api', 'version', 'route.mjs');
if (!fs.existsSync(route)) fail('app/api/version/route.mjs is missing');

// The version must come from package.json at runtime: change it and re-import with a cache-busting query.
const pkgFile = path.join(cwd, 'package.json');
const original = fs.readFileSync(pkgFile, 'utf8');
try {
  const { GET } = await import(pathToFileURL(route).href);
  const res = await GET();
  if (res.status !== 200) fail(`status ${res.status}`);
  const body = await res.json();
  if (JSON.stringify(body) !== JSON.stringify({ version: '2.3.1' })) fail(`body ${JSON.stringify(body)}`);

  fs.writeFileSync(pkgFile, original.replace('"2.3.1"', '"9.9.9"'));
  const again = await import(`${pathToFileURL(route).href}?v=2`);
  const body2 = await (await again.GET()).json();
  if (body2.version !== '9.9.9') fail('version is hard-coded, not read from package.json');
} finally {
  fs.writeFileSync(pkgFile, original);
}

const tests = fs.readdirSync(path.join(cwd, 'tests')).filter((f) => /version/i.test(f) && /\.test\.m?js$/.test(f));
if (!tests.length) fail('no unit test for the version route in tests/');
console.log('verify: add-endpoint OK');
