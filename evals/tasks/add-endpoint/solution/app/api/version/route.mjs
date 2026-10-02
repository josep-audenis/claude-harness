import fs from 'node:fs';

// GET /api/version: the package version, read at request time.
export function GET() {
  const pkg = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
  return Response.json({ version: pkg.version });
}
