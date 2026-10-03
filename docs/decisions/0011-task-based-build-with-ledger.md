# 0011: Big features are built task by task, with a ledger, by an orchestrating skill

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** AGT-6, AGT-7, GATE-8, REC-4, CTX-5

## Context
Josep wants to hand over a big feature (e.g. a dashboard) and come back to a PR. v1.0 ran one implementer for the whole feature under one `/goal`.
- The implementer could finish while checks were red.
- Nothing exercised the running app.
- The agent still stopped to ask.

Research on 2026-10-03 (sources.md) showed three things in published setups:
1. Long autonomous runs come from **small reviewed tasks with a fresh context each** (superpowers, spec-kit, Anthropic's harness post).
2. They need **a durable record that replaces questions with recorded decisions** (superpowers' ledger, HumanLayer handoffs).
3. They need **an evaluator that uses the app**, since self-evaluation is lenient (Anthropic).

## Decision
- The planner writes an ordered task list sized to the feature.
- `/harness:build` (a skill, so the main session stays the orchestrator) dispatches a fresh `implementer` per task, then a task-scoped `reviewer`. It allows at most 4 fix rounds, the last two on Opus, then parks or stops.
- After the last task it runs `qa` in the browser and a final review, and opens a draft PR.
- Decisions become `Ruling:` lines in a committed ledger (`docs/briefs/<id>.ledger.md`) that `ledger.mjs` writes and checks. Only four situations stop the run.
- A SubagentStop gate holds the implementer to green checks.
- The `/goal` names `ledger.mjs status <id> --check` as executed proof.

## Alternatives rejected
- **Ralph loop (feed the same prompt until a completion promise appears):** no per-task review, no decomposition, and the stop condition is a string the maker emits. `/goal` with executed proof already covers the useful part.
- **One implementer for the whole feature (v1.0):** context drifts on large features, review comes only at the end, and a mistake in task 2 is found after task 9.
- **Agent teams:** about 7× the tokens (COST-3), and AGT-5 limits them to debugging and research.
- **A dynamic workflow (`/build-queue`):** fits many independent features (AGT-4), not the ordered, dependent tasks of one feature. Deferred.
- **Ledger as free-form Markdown the model edits:** fragile under compaction, and nothing could check it. A script keeps it parseable and gives the `/goal` an exit code.

## Consequences
- More tokens per feature: a reviewer per task, plus QA and a final review. Worth measuring against v1.0 (ROADMAP E11).
- Rulings can be wrong. They're visible in the PR, which is where Josep's review time goes.
- The SubagentStop gate relies on the hook `cwd` being the subagent's worktree. The docs don't state this, so `doctor --live` proves it, and a fallback is noted in NOTES.md.
