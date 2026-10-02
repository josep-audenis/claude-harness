// Regenerate the committed repo-layer copies in plugins/harness/templates/repo/ from their sources
// (BUILD rule 5). The copies must run without the plugin, because cloud sessions don't have it.
// Usage: node tools/sync-templates.mjs [--check]   (--check: exit 1 if any copy drifted, write nothing)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins', 'harness');
const REPO_TEMPLATE = path.join(PLUGIN, 'templates', 'repo');

const HOOKS = ['lib.mjs', 'stop-gate.mjs', 'format-changed.mjs', 'check.mjs', 'test-diff.mjs'];

// [source, target, transform]
export const MAPPINGS = [
  ...HOOKS.map((f) => [path.join(PLUGIN, 'scripts', f), path.join(REPO_TEMPLATE, '.claude', 'hooks', f), 'script']),
  [path.join(PLUGIN, 'agents', 'reviewer.md'), path.join(REPO_TEMPLATE, '.claude', 'agents', 'reviewer.md'), 'copy'],
];

const normalize = (t) => t.replace(/\r\n/g, '\n');

export function generate(source, kind) {
  const text = normalize(fs.readFileSync(source, 'utf8'));
  if (kind !== 'script') return text;
  const rel = path.relative(ROOT, source).replace(/\\/g, '/');
  return `// GENERATED from ${rel} by \`npm run sync-templates\` in claude-harness. Edit the source, not this copy.\n${text}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let drift = 0;
  for (const [source, target, kind] of MAPPINGS) {
    const want = generate(source, kind);
    const have = fs.existsSync(target) ? normalize(fs.readFileSync(target, 'utf8')) : null;
    const rel = path.relative(ROOT, target).replace(/\\/g, '/');
    if (have === want) {
      console.log(`SKIPPED  ${rel}`);
      continue;
    }
    drift++;
    if (check) {
      console.log(`DRIFTED  ${rel}`);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, want);
      console.log(`${have === null ? 'ADDED   ' : 'UPDATED '} ${rel}`);
    }
  }
  if (check && drift) {
    console.log(`\n${drift} committed copy(ies) drifted. Run: npm run sync-templates`);
    process.exit(1);
  }
}
