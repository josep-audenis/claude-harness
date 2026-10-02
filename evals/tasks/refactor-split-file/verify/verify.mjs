// Hidden verifier for refactor-split-file: size limit, identical exports, identical behaviour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cwd = process.cwd();
const { inputs, exports, golden } = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden.json'), 'utf8'));
const problems = [];

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(path.join(cwd, 'src')).filter((f) => /\.m?js$/.test(f))) {
  const n = fs.readFileSync(f, 'utf8').replace(/\n$/, '').split('\n').length;
  if (n > 200) problems.push(`${path.relative(cwd, f)} has ${n} lines (max 200)`);
}
if (!fs.existsSync(path.join(cwd, 'src', 'units'))) problems.push('no src/units/ directory');

const mod = await import(pathToFileURL(path.join(cwd, 'src', 'units.mjs')).href);
const have = Object.keys(mod).sort();
if (JSON.stringify(have) !== JSON.stringify(exports)) {
  problems.push(`exports changed: missing [${exports.filter((e) => !have.includes(e))}], extra [${have.filter((e) => !exports.includes(e))}]`);
}
for (const [name, want] of Object.entries(golden)) {
  if (typeof mod[name] !== 'function') continue;
  const got = inputs.map((v) => mod[name](v));
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${name} changed behaviour: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
}
if (Object.isFrozen(mod.CONVERTERS) !== true) problems.push('CONVERTERS is no longer frozen');

if (problems.length) {
  for (const p of problems) console.error(`verify: ${p}`);
  process.exit(1);
}
console.log('verify: refactor-split-file OK');
