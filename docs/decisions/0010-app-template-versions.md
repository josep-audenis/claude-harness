# 0010: App template pins TypeScript 5.9 and ESLint 9, and uses better-sqlite3's bundled binaries

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** NEW-1 (BUILD §3.4)

## Context
BUILD §3.4 fixes the stack (Next.js, TypeScript, pnpm, Drizzle + better-sqlite3, Vitest, Playwright, ESLint + Prettier) and asks for pinned versions with a lockfile. On 2026-10-03 the latest versions were TypeScript 7.0 (the native compiler) and ESLint 10. On the first install on Windows with Node 25, better-sqlite3 failed in node-gyp with "Could not find any Visual Studio installation".

## Decision
- Pin TypeScript **5.9.3**: Next.js 16's type-checking and TS plugin expect the 5.x API.
- Pin ESLint **9.39.5**: eslint-plugin-react 7.37's peer range ends at 9.
- Pin everything else at the latest version on 2026-10-03.
- **Don't** list better-sqlite3 in `pnpm.onlyBuiltDependencies`. Version 13 ships N-API prebuilds for Windows, macOS and Linux inside the package, and allowing its build script makes pnpm run the implicit `node-gyp rebuild`. It goes in `ignoredBuiltDependencies` instead.
- Apps need Node ≥ 22 (better-sqlite3's `engines`), while the harness itself needs only Node ≥ 20.

## Alternatives rejected
- **TypeScript 7:** fast, but the Next.js integration and editor plugin can't rely on it yet.
- **Allow the better-sqlite3 build:** every Windows device would need Visual Studio Build Tools.
- **`node:sqlite` instead of better-sqlite3:** avoids a native module, but changes the stack BUILD fixed, and Drizzle's support for it is less established.

## Consequences
- Proven: a generated app installs with `--frozen-lockfile` and passes typecheck, lint and unit tests on Windows (Node 25) and in CI on Ubuntu (Node 22).
- Revisit when Next.js documents TypeScript 7 support, or when eslint-plugin-react supports ESLint 10.
