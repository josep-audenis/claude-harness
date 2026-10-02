// Hidden verifier for fix-failing-test: more inputs than the visible tests, so special-casing fails.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { slugify } = await import(pathToFileURL(path.join(process.cwd(), 'src', 'slugify.mjs')).href);
const cases = [
  ['--Already--Slugged--', 'already-slugged'],
  ['!!!', ''],
  ['  Ünïcödé   Ståff  ', 'unicode-staff'],
  ['Version 2.0 (beta)', 'version-2-0-beta'],
  ['a', 'a'],
  ['¿Qué tal?', 'que-tal'],
];
const bad = cases.filter(([input, want]) => slugify(input) !== want);
if (bad.length) {
  for (const [input, want] of bad) console.error(`verify: slugify(${JSON.stringify(input)}) = ${JSON.stringify(slugify(input))}, want ${JSON.stringify(want)}`);
  process.exit(1);
}
console.log('verify: fix-failing-test OK');
