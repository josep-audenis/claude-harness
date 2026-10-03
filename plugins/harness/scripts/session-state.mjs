// SessionStart hook (CTX-5): inject progress.md tail, last 8 commits, open-feature count and,
// during a /harness:build, the ledger summary with the next task.
// Prints nothing outside harnessed repos (no progress.md, feature_list.json or ledger).
import fs from 'node:fs';
import path from 'node:path';
import { readStdinJson, projectDir, readJson, tail, git, isGitRepo } from './lib.mjs';
import { load, summary } from './ledger.mjs';

try {
  const input = await readStdinJson();
  const dir = projectDir(input);
  const progressPath = path.join(dir, 'progress.md');
  const featuresPath = path.join(dir, 'feature_list.json');
  const hasProgress = fs.existsSync(progressPath);
  const hasFeatures = fs.existsSync(featuresPath);

  if (hasProgress || hasFeatures) {
    const parts = ['## Harness state (injected by the harness SessionStart hook)'];
    if (hasProgress) {
      const text = fs.readFileSync(progressPath, 'utf8').trim();
      parts.push('### progress.md (last 20 lines)', text ? tail(text, 20) : '(empty)');
    }
    if (isGitRepo(dir)) {
      const log = git(['log', '--oneline', '-8'], dir);
      if (log.code === 0 && log.stdout) parts.push('### Last 8 commits', log.stdout);
    }
    if (hasFeatures) {
      const data = readJson(featuresPath, []);
      const list = Array.isArray(data) ? data : Array.isArray(data?.features) ? data.features : [];
      const open = list.filter((f) => f && f.passes !== true);
      parts.push(
        `### Features: ${open.length} open of ${list.length}`,
        ...open.slice(0, 10).map((f) => `- ${f.id ?? '?'}: ${f.description ?? ''}`),
      );
    }
    process.stdout.write(parts.join('\n') + '\n');
  }

  // An active /harness:build: the ledger for this branch's feature (feat/<id>), else the newest
  // unfinished ledger. Lets a compacted or resumed session continue at the next task.
  const briefs = path.join(dir, 'docs', 'briefs');
  if (fs.existsSync(briefs)) {
    const branch = isGitRepo(dir) ? git(['rev-parse', '--abbrev-ref', 'HEAD'], dir).stdout : '';
    const fromBranch = branch.match(/^feat\/(.+)$/)?.[1];
    const ids = fs.readdirSync(briefs).filter((f) => f.endsWith('.ledger.md')).map((f) => f.slice(0, -'.ledger.md'.length));
    const candidates = fromBranch && ids.includes(fromBranch)
      ? [fromBranch]
      : ids.sort((a, b) => fs.statSync(path.join(briefs, `${b}.ledger.md`)).mtimeMs - fs.statSync(path.join(briefs, `${a}.ledger.md`)).mtimeMs);
    for (const id of candidates) {
      const l = load(dir, id);
      if (!l) continue;
      const s = summary(l);
      if (s.complete && !fromBranch) continue;
      const lines = [
        `### Build ledger: docs/briefs/${id}.ledger.md`,
        `${s.done} done, ${s.parked} parked of ${s.tasks} tasks${s.blocked.length ? `; blocked: ${s.blocked.join(', ')}` : ''}. QA: ${s.qa}. Final review: ${s.final}.`,
        s.complete ? 'Build complete: verify-done, push and draft PR remain if not done.' : `Next: ${s.next.id} (${s.next.title}), status ${s.next.status}, ${s.next.rounds} review round(s). Continue with /harness:build ${id}.`,
        ...l.rulings.slice(-3).map((r) => `- Ruling: ${r}`),
      ];
      process.stdout.write(lines.join('\n') + '\n');
      break;
    }
  }
} catch {
  // Context injection is best effort.
}
process.exit(0);
