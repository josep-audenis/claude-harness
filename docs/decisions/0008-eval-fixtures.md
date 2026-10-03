# 0008: Eval fixtures are dependency-free, with hidden verifiers and reference solutions

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** LAB-2, LAB-3, LAB-4

## Context
The eval set must be cheap to run often, must measure premature done and tampering, and its own checks must be trustworthy: a verifier that can't fail proves nothing, and one that can't pass wastes runs.

## Decision
- Fixtures use only `node:test` or Python's stdlib `unittest`: no `npm install` or `pip install` per run, so no network. The "Next.js" task uses Next-style route handlers without Next itself.
- Each task keeps its verifiers in `verify/`, outside the repo the agent sees, referenced as `{task}/verify/...` in `task.json`. Hidden verifiers check more than the visible tests, which is what makes premature done and tampering measurable.
- Each task ships a `solution/` overlay. A test proves every task is red on the untouched fixture **and** green with its solution. The stub's `pass` scenario reuses it.
- Every fixture commits `.claude/harness.json`, so the variant's Stop gate has something to hold.

## Alternatives rejected
- **Fixtures built from `templates/app`:** realistic, but each run would need a pnpm install of a Next.js app (minutes, network). That swamps the signal and the quota.
- **Verifiers inside the repo:** the agent can read them, and then it optimises for the verifier rather than the task.
- **No reference solutions:** a verifier with a bug that makes it unsatisfiable would read as "the agent failed".

## Consequences
- Results transfer less directly to the Next.js stack. A later task can add one heavier fixture once the lab has proven itself.
- The Python task needs a Python 3 interpreter (`python3`, `python` or `py`) on the machine running the eval.
