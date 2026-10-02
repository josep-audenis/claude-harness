// PostToolUse hook on Edit|Write (GATE-4): format only the edited file. Always exits 0.
// Uses the project's own Prettier (run with node, no npx shim, so it works in exec form on
// Windows) and ruff when it is on PATH. Missing formatters are silently skipped.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readStdinJson, projectDir, readJson, shouldDefer } from './lib.mjs';

const PRETTIER_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.md']);

// Walk up from the file to the project root looking for node_modules/prettier.
function findPrettier(start, stop) {
  let dir = start;
  for (;;) {
    const pkgDir = path.join(dir, 'node_modules', 'prettier');
    const pkg = readJson(path.join(pkgDir, 'package.json'));
    if (pkg) {
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.prettier;
      if (bin) return path.join(pkgDir, bin);
    }
    const parent = path.dirname(dir);
    if (dir === stop || parent === dir) return null;
    dir = parent;
  }
}

try {
  const input = await readStdinJson();
  const dir = projectDir(input);
  if (shouldDefer(fileURLToPath(import.meta.url), dir, 'format-changed.mjs')) process.exit(0);

  const raw = input?.tool_input?.file_path;
  if (typeof raw === 'string' && raw) {
    const file = path.resolve(dir, raw);
    if (fs.existsSync(file)) {
      const ext = path.extname(file).toLowerCase();
      const opts = { cwd: dir, stdio: 'ignore', timeout: 30_000, windowsHide: true };
      if (PRETTIER_EXT.has(ext)) {
        const bin = findPrettier(path.dirname(file), dir);
        if (bin) spawnSync(process.execPath, [bin, '--write', '--log-level', 'silent', file], opts);
      } else if (ext === '.py') {
        spawnSync('ruff', ['format', '--quiet', file], opts); // ENOENT when ruff is absent: ignored
      }
    }
  }
} catch {
  // Formatting is best effort.
}
process.exit(0);
