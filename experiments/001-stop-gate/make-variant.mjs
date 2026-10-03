// Build experiments/001-stop-gate/variant/: a copy of plugins/harness with exactly one change,
// the Stop hook removed from hooks/hooks.json. Generated (and gitignored) so the variant always
// differs from the baseline it's compared with by that one change (LAB-6).
// Usage: node experiments/001-stop-gate/make-variant.mjs [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BASELINE = path.join(ROOT, 'plugins', 'harness');

export function makeVariant(out) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(BASELINE, out, { recursive: true });

  const hooksFile = path.join(out, 'hooks', 'hooks.json');
  const hooks = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  if (!hooks.hooks.Stop) throw new Error('baseline has no Stop hook: nothing to remove');
  delete hooks.hooks.Stop;
  hooks.description = `${hooks.description} [experiment 001 variant: Stop hook removed]`;
  fs.writeFileSync(hooksFile, JSON.stringify(hooks, null, 2) + '\n');

  const version = JSON.parse(fs.readFileSync(path.join(BASELINE, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim() || 'unknown';
  const record = { experiment: '001-stop-gate', baselineVersion: version, baselineCommit: sha, change: 'hooks/hooks.json: Stop removed', generated: new Date().toISOString() };
  fs.writeFileSync(path.join(out, 'VARIANT.json'), JSON.stringify(record, null, 2) + '\n');
  return record;
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  const i = process.argv.indexOf('--out');
  const out = path.resolve(i >= 0 ? process.argv[i + 1] : path.join(HERE, 'variant'));
  const r = makeVariant(out);
  console.log(`variant written to ${path.relative(process.cwd(), out) || out}: baseline harness ${r.baselineVersion} @ ${r.baselineCommit}, ${r.change}`);
}
