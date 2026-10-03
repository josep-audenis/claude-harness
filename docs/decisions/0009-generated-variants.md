# 0009: Experiment variants are generated from the baseline, not committed copies

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** LAB-1, LAB-6

## Context
LAB-6 allows one change per experiment. BUILD phase 9 described the variant as "a copy of the plugin without the Stop hook". A committed copy starts drifting from `plugins/harness` the next time the plugin changes, and then the experiment compares two things that differ in more than one way.

## Decision
An experiment ships `make-variant.mjs`, which copies the current `plugins/harness` into `variant/` and applies its single change. `variant/` is gitignored, and `variant/VARIANT.json` records the baseline version and commit it was built from. For 001, a test proves the generated variant differs from the baseline only in `hooks/hooks.json`, minus `Stop`.

## Alternatives rejected
- **Commit a full copy of the plugin per experiment:** silent drift and a second copy of everything (templates and lockfile included).
- **A patch file applied at run time:** same result, but harder to read and to test than a few lines of JavaScript.

## Consequences
- Re-running an old experiment against a newer baseline is a deliberate choice: `VARIANT.json` shows which baseline each run used.
- A hand-made variant must not be named `variant/` or it won't be committed (documented in running-experiments.md).
