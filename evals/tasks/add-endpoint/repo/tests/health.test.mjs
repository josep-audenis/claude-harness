import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/health/route.mjs';

test('GET /api/health returns ok', async () => {
  const res = GET();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});
