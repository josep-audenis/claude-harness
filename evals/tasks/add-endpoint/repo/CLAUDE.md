# shop-api

## Commands
- Tests: `npm test` (node:test, no dependencies)

## Conventions
- One route handler per file at `app/api/<name>/route.mjs`, exporting `GET`/`POST` that return a Web `Response`.
- Unit tests live in `tests/<name>.test.mjs`.
