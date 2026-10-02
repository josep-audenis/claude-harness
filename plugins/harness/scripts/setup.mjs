// /harness:setup: apply the device floor (DEV-3, DEV-6, SEC-1..4, CTX-1, LOOP-6, COST-1/2).
// Usage: node setup.mjs [--home <dir>] [--dry-run] [--undo]
// Merges, never overwrites. Backs up every file it changes to ~/.claude/.harness-backup/<ts>/.
// Idempotent: a second run changes nothing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  configDir, readText, loadFloor, loopText, mergeSettings, applyBlock, currentBlock, normalize, deepEqual, pluginVersion,
} from './floor.mjs';

function parseArgs(argv) {
  const a = { home: null, dryRun: false, undo: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--home') a.home = argv[++i];
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--undo') a.undo = true;
    else if (argv[i] === '--help' || argv[i] === '-h') a.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return a;
}

const table = (rows) =>
  ['| Path | Action |', '|---|---|', ...rows.map(([p, act]) => `| ${p} | ${act} |`)].join('\n');

function plan(dir) {
  const changes = [];
  const notes = [];

  // settings.json: deep-merge the floor.
  const settingsPath = path.join(dir, 'settings.json');
  const settingsText = readText(settingsPath);
  let existing = {};
  if (settingsText !== null && settingsText.trim()) {
    try {
      existing = JSON.parse(settingsText);
    } catch (e) {
      throw new Error(`${settingsPath} isn't valid JSON (${e.message}). Fix it first; nothing was changed.`);
    }
  }
  const merged = mergeSettings(existing, loadFloor());
  notes.push(...merged.notes);
  const settingsChanged = settingsText === null || !deepEqual(existing, merged.result);
  changes.push({
    name: 'settings.json',
    file: settingsPath,
    before: settingsText,
    after: settingsChanged ? JSON.stringify(merged.result, null, 2) + '\n' : settingsText,
    action: settingsText === null ? 'ADDED' : settingsChanged ? 'MERGED' : 'SKIPPED',
  });

  // CLAUDE.md: personal rules between markers (CTX-1).
  const claudePath = path.join(dir, 'CLAUDE.md');
  const claudeText = readText(claudePath);
  const claudeNew = applyBlock(claudeText);
  changes.push({
    name: 'CLAUDE.md',
    file: claudePath,
    before: claudeText,
    after: claudeNew,
    action: claudeText === null ? 'ADDED' : claudeNew === claudeText ? 'SKIPPED' : currentBlock(claudeText) ? 'UPDATED' : 'MERGED',
  });

  // loop.md: default prompt for a bare /loop (LOOP-6). A different file is backed up first.
  const loopPath = path.join(dir, 'loop.md');
  const loopOld = readText(loopPath);
  const loopNew = loopText();
  const loopSame = loopOld !== null && normalize(loopOld) === normalize(loopNew);
  changes.push({
    name: 'loop.md',
    file: loopPath,
    before: loopOld,
    after: loopSame ? loopOld : loopNew,
    action: loopOld === null ? 'ADDED' : loopSame ? 'SKIPPED' : 'UPDATED',
  });

  // harness-device.json (DEV-6): rewritten only when the OS or harness version changes.
  const devicePath = path.join(dir, 'harness-device.json');
  const deviceText = readText(devicePath);
  let device = null;
  try {
    device = deviceText ? JSON.parse(deviceText) : null;
  } catch {
    device = null;
  }
  const version = pluginVersion();
  const deviceCurrent = device && device.os === process.platform && device.harnessVersion === version;
  const record = {
    os: process.platform,
    osRelease: os.release(),
    arch: process.arch,
    harnessVersion: version,
    setupDate: new Date().toISOString().slice(0, 10),
  };
  changes.push({
    name: 'harness-device.json',
    file: devicePath,
    before: deviceText,
    after: deviceCurrent ? deviceText : JSON.stringify(record, null, 2) + '\n',
    action: deviceText === null ? 'ADDED' : deviceCurrent ? 'SKIPPED' : 'UPDATED',
  });

  return { changes, notes };
}

function timestamp(backupRoot) {
  const base = new Date().toISOString().replace(/[:.]/g, '-');
  let ts = base;
  for (let i = 1; fs.existsSync(path.join(backupRoot, ts)); i++) ts = `${base}-${i}`;
  return ts;
}

function apply(dir, dryRun) {
  const { changes, notes } = plan(dir);
  const pending = changes.filter((c) => c.action !== 'SKIPPED');
  const shown = dir.replace(os.homedir(), '~');
  console.log(`harness setup v${pluginVersion()} · ${shown}${dryRun ? ' · DRY RUN, nothing written' : ''}\n`);
  console.log(table(changes.map((c) => [path.join(shown, c.name), dryRun && c.action !== 'SKIPPED' ? `${c.action} (would)` : c.action])));
  if (notes.length) console.log('\nSettings notes:\n' + notes.map((n) => `- ${n}`).join('\n'));
  if (dryRun || pending.length === 0) {
    if (!dryRun) console.log('\nNothing to change: the floor is already applied.');
    return;
  }

  const backupRoot = path.join(dir, '.harness-backup');
  const ts = timestamp(backupRoot);
  const backupDir = path.join(backupRoot, ts);
  fs.mkdirSync(backupDir, { recursive: true });
  const manifest = { created: ts, harnessVersion: pluginVersion(), files: {} };
  for (const c of pending) {
    manifest.files[c.name] = c.before !== null;
    if (c.before !== null) fs.copyFileSync(c.file, path.join(backupDir, c.name));
  }
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  for (const c of pending) fs.writeFileSync(c.file, c.after);

  console.log(`\nBackup: ${backupDir.replace(os.homedir(), '~')} (undo with --undo)`);
  console.log('Next: run /auto-mode-setup once on this device (SEC-3), then /harness:doctor.');
}

function lineDiff(before, after) {
  const a = normalize(before ?? '').split('\n');
  const b = normalize(after ?? '').split('\n');
  const out = [];
  for (const l of a) if (!b.includes(l)) out.push(`  - ${l}`);
  for (const l of b) if (!a.includes(l)) out.push(`  + ${l}`);
  return out.slice(0, 40);
}

function undo(dir, dryRun) {
  const backupRoot = path.join(dir, '.harness-backup');
  const dirs = fs.existsSync(backupRoot)
    ? fs.readdirSync(backupRoot).filter((d) => !d.startsWith('undone-') && fs.existsSync(path.join(backupRoot, d, 'manifest.json'))).sort()
    : [];
  if (dirs.length === 0) {
    console.log('No harness backup to undo.');
    process.exitCode = 1;
    return;
  }
  const ts = dirs[dirs.length - 1];
  const backupDir = path.join(backupRoot, ts);
  const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));
  console.log(`harness setup --undo · restoring backup ${ts}${dryRun ? ' · DRY RUN' : ''}\n`);
  const rows = [];
  for (const [name, existed] of Object.entries(manifest.files)) {
    const target = path.join(dir, name);
    const previous = existed ? fs.readFileSync(path.join(backupDir, name), 'utf8') : null;
    const current = readText(target);
    rows.push([name, existed ? 'RESTORED' : 'REMOVED']);
    console.log(`${name}: ${existed ? 'restore the backed-up copy' : 'remove (setup created it)'}`);
    for (const l of lineDiff(current, previous)) console.log(l);
    if (!dryRun) {
      if (existed) fs.writeFileSync(target, previous);
      else if (current !== null) fs.unlinkSync(target);
    }
  }
  console.log('\n' + table(rows.map(([n, a]) => [n, dryRun ? `${a} (would)` : a])));
  if (!dryRun) fs.renameSync(backupDir, path.join(backupRoot, `undone-${ts}`));
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node setup.mjs [--home <dir>] [--dry-run] [--undo]');
  } else {
    const dir = configDir(args.home);
    if (!args.dryRun) fs.mkdirSync(dir, { recursive: true });
    if (args.undo) undo(dir, args.dryRun);
    else apply(dir, args.dryRun);
  }
} catch (e) {
  console.error(`setup failed: ${e.message}`);
  process.exitCode = 1;
}
