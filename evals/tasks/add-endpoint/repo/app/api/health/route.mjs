// GET /api/health: liveness probe. Route handlers return a Web Response.
export function GET() {
  return Response.json({ ok: true });
}
