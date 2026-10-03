# Changelog

Every released change bumps `version` in `plugins/harness/.claude-plugin/plugin.json`. Devices only receive versions that changed.

## Unreleased
- Doctor checks the Claude Code running the session (`CLAUDE_CODE_EXECPATH`; the desktop app bundles its own) and warns about an outdated terminal `claude`.
- `/harness:build`: task-by-task autonomous builds. A fresh implementer and a task reviewer per task, at most 4 fix rounds (the last two on Opus), then `qa` in the browser, a final review and a draft PR. Decisions are recorded as rulings in a committed ledger instead of questions (SPEC AGT-6, REC-4, §6.8).
- Planner writes an ordered task list sized to the feature, with a budget sized from it. The brief's `/goal` runs the build and checks `ledger.mjs status --check` (§6.4, §6.5).
- SubagentStop gate: the implementer can't finish while checks are red, checked in its worktree (GATE-8); `doctor --live` probes it.
- `qa` agent and `qa-server.mjs`: start the app from `harness.json` `init`/`health`, drive it in a browser, grade a calibrated rubric (AGT-7).
- Skills `systematic-debugging` (AGT-8) and `/harness:learn`, with repo `bashDeny` rules enforced by the Bash gate (AGT-9).
- SessionStart injects the ledger summary and next task (CTX-5). SPEC v1.1; decision record 0011.

## 1.0.0 (2026-10-03)
- First release of the `harness` plugin and the `josep-harness` marketplace.
- Hooks (exec form, Claude Code ≥ 2.1.139): Stop gate on `.claude/harness.json` checks, Bash command gate, Bash log, single-file formatter, SessionStart state, notifications.
- Device floor via `/harness:setup` (merge, backup, `--undo`) and `/harness:doctor` (device and repo rows, gate proof, `--live`).
- Agents: planner (Opus), test-writer, implementer (worktree), read-only reviewer. Skills: brief, verify-done, review-loop, adopt, new-app, setup, doctor.
- Templates: the committed repo layer (hooks, reviewer, CI and review workflows, defect form, CODEOWNERS) and a pinned Next.js 16 app skeleton.
- Lab: `evals/run.mjs`, `compare.mjs`, a token-free stub and five task fixtures. Experiment 001 (Stop gate) prepared, not run.
- Docs: specification, build plan, guides reconciled with the implementation, decision records 0001–0010.
