// The device floor (SPEC §3, DEV-3): merge rules shared by setup.mjs and doctor.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MACHINE = path.join(PLUGIN_ROOT, 'machine');
export const START = '<!-- harness:start -->';
export const END = '<!-- harness:end -->';

export function pluginVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

// ~/.claude for --home <dir>; otherwise CLAUDE_CONFIG_DIR, then the real home.
export function configDir(home) {
  if (home) return path.join(path.resolve(home), '.claude');
  if (process.env.CLAUDE_CONFIG_DIR) return path.resolve(process.env.CLAUDE_CONFIG_DIR);
  return path.join(os.homedir(), '.claude');
}

export const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
export const loadFloor = () => JSON.parse(fs.readFileSync(path.join(MACHINE, 'settings.floor.json'), 'utf8'));
export const loopText = () => fs.readFileSync(path.join(MACHINE, 'loop.md'), 'utf8');

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

// Merge the floor into existing settings. Objects merge, arrays concatenate without duplicates,
// existing scalars win (so a user's own defaultMode is kept, SEC-2). Returns { result, notes }.
export function mergeSettings(existing, floor) {
  const notes = [];
  const walk = (cur, src, prefix) => {
    const out = { ...cur };
    for (const [k, v] of Object.entries(src)) {
      const key = prefix ? `${prefix}.${k}` : k;
      const have = cur[k];
      if (have === undefined) {
        out[k] = structuredClone(v);
        notes.push(`${key}: set to ${JSON.stringify(v)}`);
      } else if (isObj(have) && isObj(v)) {
        out[k] = walk(have, v, key);
      } else if (Array.isArray(have) && Array.isArray(v)) {
        const add = v.filter((x) => !have.some((h) => deepEqual(h, x)));
        out[k] = [...have, ...add];
        if (add.length) notes.push(`${key}: added ${add.map((a) => JSON.stringify(a)).join(', ')}`);
      } else if (!deepEqual(have, v)) {
        const why = key === 'permissions.defaultMode' ? ' (SEC-2: your choice is kept)' : ' (existing value wins)';
        notes.push(`${key}: kept ${JSON.stringify(have)}, floor default is ${JSON.stringify(v)}${why}`);
      }
    }
    return out;
  };
  return { result: walk(isObj(existing) ? existing : {}, floor, ''), notes };
}

// The marker block for ~/.claude/CLAUDE.md (CTX-1), using the file's own line endings.
export function personalBlock(eol = '\n') {
  const body = fs.readFileSync(path.join(MACHINE, 'CLAUDE.personal.md'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  return [START, body, END].join('\n').replace(/\n/g, eol);
}

// Insert or replace the marker block, leaving everything outside the markers untouched.
export function applyBlock(text) {
  if (text === null || text === '') return personalBlock('\n') + '\n';
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const block = personalBlock(eol);
  const s = text.indexOf(START);
  const e = text.indexOf(END, s);
  if (s !== -1 && e !== -1) return text.slice(0, s) + block + text.slice(e + END.length);
  const sep = text.endsWith(eol + eol) ? '' : text.endsWith(eol) ? eol : eol + eol;
  return text + sep + block + eol;
}

export function currentBlock(text) {
  if (!text) return null;
  const s = text.indexOf(START);
  const e = text.indexOf(END, s);
  return s !== -1 && e !== -1 ? text.slice(s, e + END.length).replace(/\r\n/g, '\n') : null;
}

export const normalize = (t) => (t === null ? null : t.replace(/\r\n/g, '\n'));
