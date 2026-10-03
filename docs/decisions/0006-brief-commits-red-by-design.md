# 0006: A clean brief commit is red by design; the Stop gate lets it stand

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** AGT-2, GATE-1, GATE-2

## Context
`/harness:brief` must leave failing tests behind (AGT-2: tests written first, shown red) and must not implement anything. The Stop gate (GATE-1) blocks any turn whose checks fail while the tree is dirty or ahead of main. Committed red tests on a feature branch are exactly that state, so the brief session could never end: the gate would push it to implement, which AGT-2 forbids.

## Decision
The gate also skips (exit 0) when all of these hold:
- the tree is clean;
- HEAD's subject starts with `brief(<id>)`;
- HEAD touches only `docs/briefs/*.md`, `feature_list.json` and test paths (`isTestPath` in `lib.mjs`).

Any later edit or commit re-arms the gate, and a "brief" commit that also touches other files is gated.

## Alternatives rejected
- **An env var or marker file that switches the gate off:** a flag the agent can set is a gate the agent can turn off.
- **Leave the tests uncommitted:** the tree stays dirty, so the gate still blocks; the implementer's worktree wouldn't see them either.
- **Mark the new tests skipped and let the implementer un-skip them:** the implementer would then edit test files, which is exactly the tampering signal the reviewer and `test-diff.mjs` look for.
- **Let the gate block and rely on the 8-block cap:** wastes eight turns per brief and trains people to ignore the gate.

## Consequences
- The exemption is computed from git, not declared, so it can't be claimed for work that isn't a brief.
- An agent could still write a `brief(...)` commit containing only test edits to dodge the gate. That shows up in review: the reviewer reads the brief commit, and `test-diff.mjs` runs against it as base. Proposed as a SPEC change to GATE-2 in NOTES.md.
