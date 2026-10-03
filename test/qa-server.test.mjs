// AGT-7: qa-server starts the app from harness.json init, waits for health, and stops the whole tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRIPTS, tmpdir, write, childEnv } from './helpers.mjs';
import { stateFiles } from '../plugins/harness/scripts/qa-server.mjs';

const QA = path.join(SCRIPTS, 'qa-server.mjs');
const qa = (dir, ...args) => {
  const r = spawnSync(process.execPath, [QA, ...args, '--dir', dir], { env: childEnv(), encoding: 'utf8', timeout: 60_000 });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
};
const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const up = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

const SERVER = `import http from 'node:http';
http.createServer((req, res) => {
  res.writeHead(req.url === '/health' ? 200 : 404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: req.url === '/health' }));
}).listen(Number(process.argv[2]));
`;

test('qa-server: start waits for health, status reports it, stop kills the tree and clears state', async () => {
  const dir = tmpdir('qa-app');
  const port = await freePort();
  write(dir, 'server.mjs', SERVER);
  write(dir, '.claude/harness.json', JSON.stringify({ version: 1, check: ['node -e 0'], init: `node server.mjs ${port}`, health: `http://127.0.0.1:${port}/health` }));
  const start = qa(dir, 'start', '--timeout', '30');
  assert.equal(start.code, 0, start.out);
  assert.match(start.out, /ready at/);
  assert.ok(await up(`http://127.0.0.1:${port}/health`));
  const { pid } = JSON.parse(fs.readFileSync(stateFiles(dir).state, 'utf8'));
  assert.equal(qa(dir, 'status').code, 0);
  assert.equal(qa(dir, 'start').code, 0, 'a second start reuses the running server');

  const stop = qa(dir, 'stop');
  assert.equal(stop.code, 0, stop.out);
  for (let i = 0; i < 20 && (await up(`http://127.0.0.1:${port}/health`)); i++) await new Promise((r) => setTimeout(r, 250));
  assert.equal(await up(`http://127.0.0.1:${port}/health`), false, 'server (child of the shell) is gone');
  assert.equal(alive(pid), false);
  assert.equal(fs.existsSync(stateFiles(dir).state), false);
  assert.equal(qa(dir, 'status').code, 1);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['.claude', 'server.mjs'], 'nothing written into the repo');
});

test('qa-server: timeout when health never answers; process cleaned up; log tail shown', async () => {
  const dir = tmpdir('qa-hang');
  const port = await freePort();
  write(dir, '.claude/harness.json', JSON.stringify({ version: 1, check: ['node -e 0'], init: 'node -e "console.log(\'booting\'); setInterval(() => {}, 1000)"', health: `http://127.0.0.1:${port}/health` }));
  const r = qa(dir, 'start', '--timeout', '2');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /no healthy answer .* within 2s/);
  assert.match(r.out, /booting/);
  assert.equal(fs.existsSync(stateFiles(dir).state), false);
});

test('qa-server: an init command that exits is reported; no init means QA is n/a (exit 3)', async () => {
  const dir = tmpdir('qa-exit');
  const port = await freePort();
  write(dir, '.claude/harness.json', JSON.stringify({ version: 1, check: ['node -e 0'], init: 'node -e "console.error(\'boom\'); process.exit(1)"', health: `http://127.0.0.1:${port}/health` }));
  const r = qa(dir, 'start', '--timeout', '20');
  assert.equal(r.code, 1);
  assert.match(r.out, /init command exited/);
  assert.match(r.out, /boom/);

  const none = tmpdir('qa-none');
  write(none, '.claude/harness.json', JSON.stringify({ version: 1, check: ['node -e 0'] }));
  const n = qa(none, 'start');
  assert.equal(n.code, 3);
  assert.match(n.out, /n\/a/);
  assert.equal(qa(none, 'stop').code, 0);
});
