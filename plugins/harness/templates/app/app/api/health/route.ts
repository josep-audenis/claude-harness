// Liveness endpoint used by .claude/harness.json "health" and the e2e smoke test.
export function GET() {
  return Response.json({ ok: true });
}
