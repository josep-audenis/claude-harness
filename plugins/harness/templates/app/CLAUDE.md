# APP_NAME

Next.js App Router + TypeScript, pnpm, Drizzle + SQLite (better-sqlite3), Vitest, Playwright.

## Commands
- All checks (what the Stop gate and CI run): `node .claude/hooks/check.mjs --all`
- One unit test: `pnpm vitest run tests/unit/<file>`. Not `pnpm test:unit -- -t`, which still loads every file.
- e2e: `pnpm test:e2e`. It starts `pnpm dev` itself; run it only when a feature's steps need a browser.
- Schema change: edit `db/schema.ts`, then `pnpm db:generate`. Never hand-write SQL migrations.

## Gotchas
- better-sqlite3 ships prebuilt binaries (Node ≥ 22). Never add it to `onlyBuiltDependencies`: pnpm would then run node-gyp, which needs a C++ toolchain.
- Local data lives in `data/app.db` (gitignored). Tests must not touch it; use `openDb(':memory:')`.

## Conventions
- All database access goes through `db/index.ts`. No raw SQL in route handlers.
- Route handlers return `Response.json(...)`. Errors use `{ error: { code, message } }` with a 4xx/5xx status.
- Unit tests live in `tests/unit/`, browser tests in `tests/e2e/`.

## Working across sessions
- Start: read `progress.md` (the SessionStart hook injects its tail) and `git log --oneline -8`.
- One feature per session, from `feature_list.json`. Flip `passes` only after running its steps end to end; never delete or reword entries.
- New work starts with `/harness:brief`; briefs live in `docs/briefs/`.
- End: commit, then add a 3-line entry to `progress.md`.
- Stuck on the same error twice: write `BLOCKED.md` and stop.

## Definition of done
- typecheck, lint and unit tests exit 0                  (Stop hook, `.claude/harness.json`)
- No test file changed after the brief commit            (reviewer, `test-diff.mjs`)
- Feature steps verified, `passes: true`, progress entry (the agent)
- Reviewer subagent returned PASS                         (the agent)
- CI `ci` and `review` green on the PR                    (GitHub)
- Merged by a human                                       (the human, never an agent)
