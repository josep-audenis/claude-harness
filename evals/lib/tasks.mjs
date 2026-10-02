// Task fixtures (evals/README.md): evals/tasks/<id>/{task.json, repo/, verify/}.
import fs from 'node:fs';
import path from 'node:path';

const ID = /^[a-z0-9][a-z0-9-]*$/;

export function validateTask(task, dirName) {
  const errors = [];
  const isStrArr = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim());
  if (!task || typeof task !== 'object') return ['task.json is not an object'];
  if (typeof task.id !== 'string' || !ID.test(task.id)) errors.push('id must be kebab-case');
  if (dirName && task.id !== dirName) errors.push(`id "${task.id}" must equal its directory "${dirName}"`);
  if (typeof task.description !== 'string' || !task.description.trim()) errors.push('description is required');
  if (typeof task.prompt !== 'string' || !task.prompt.trim()) errors.push('prompt is required');
  if (!isStrArr(task.verify) || task.verify.length === 0) errors.push('verify must be a non-empty array of commands');
  if (task.protected !== undefined && !isStrArr(task.protected)) errors.push('protected must be an array of globs');
  if (!Number.isInteger(task.maxTurns) || task.maxTurns < 1) errors.push('maxTurns must be a positive integer');
  if (task.tags !== undefined && !isStrArr(task.tags)) errors.push('tags must be an array of strings');
  const known = new Set(['id', 'description', 'prompt', 'verify', 'protected', 'maxTurns', 'tags', 'timeoutSec']);
  for (const k of Object.keys(task)) if (!known.has(k)) errors.push(`unknown field "${k}"`);
  return errors;
}

export function loadTasks(tasksDir, which = 'all') {
  const ids = fs
    .readdirSync(tasksDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const wanted = which === 'all' ? ids : which.split(',').map((s) => s.trim());
  return wanted.map((id) => {
    const dir = path.join(tasksDir, id);
    const file = path.join(dir, 'task.json');
    if (!fs.existsSync(file)) throw new Error(`no task "${id}" in ${tasksDir}`);
    const task = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = validateTask(task, id);
    if (errors.length) throw new Error(`${file}: ${errors.join('; ')}`);
    return { ...task, dir, repoDir: path.join(dir, 'repo') };
  });
}

// `{task}` in a verify command is the task directory, so verifiers live outside the repo the agent sees.
export const expand = (cmd, task) => cmd.replaceAll('{task}', task.dir.replace(/\\/g, '/'));

// Glob → RegExp for `protected`: `**` any depth, `*` within a segment, `?` one character.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*';
      i += glob[i + 2] === '/' ? 2 : 1;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out.sort();
}

// Protected files that were changed, deleted or added during the run.
export function tamperedFiles(fixtureDir, workDir, globs = []) {
  if (!globs.length) return [];
  const res = globs.map(globToRegExp);
  const matches = (f) => res.some((r) => r.test(f));
  const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null);
  const files = new Set([...listFiles(fixtureDir), ...listFiles(workDir)].filter(matches));
  return [...files].filter((f) => read(path.join(fixtureDir, f)) !== read(path.join(workDir, f))).sort();
}
