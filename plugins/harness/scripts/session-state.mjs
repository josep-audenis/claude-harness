// SessionStart hook (CTX-5): inject progress.md tail, last 8 commits and open-feature count.
// Prints nothing outside harnessed repos (no progress.md and no feature_list.json).
import fs from 'node:fs';
import path from 'node:path';
import { readStdinJson, projectDir, readJson, tail, git, isGitRepo } from './lib.mjs';

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
} catch {
  // Context injection is best effort.
}
process.exit(0);
