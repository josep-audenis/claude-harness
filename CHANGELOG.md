# Changelog

Every released change bumps `version` in `plugins/harness/.claude-plugin/plugin.json`. Devices only receive versions that changed.

## Unreleased
-

## 1.0.0 (2026-10-03)
- First release of the `harness` plugin and the `josep-harness` marketplace.
- Hooks (exec form, Claude Code ≥ 2.1.139): Stop gate on `.claude/harness.json` checks, Bash command gate, Bash log, single-file formatter, SessionStart state, notifications.
- Device floor via `/harness:setup` (merge, backup, `--undo`) and `/harness:doctor` (device and repo rows, gate proof, `--live`).
- Agents: planner (Opus), test-writer, implementer (worktree), read-only reviewer. Skills: brief, verify-done, review-loop, adopt, new-app, setup, doctor.
- Templates: the committed repo layer (hooks, reviewer, CI and review workflows, defect form, CODEOWNERS) and a pinned Next.js 16 app skeleton.
- Lab: `evals/run.mjs`, `compare.mjs`, a token-free stub and five task fixtures. Experiment 001 (Stop gate) prepared, not run.
- Docs: specification, build plan, guides reconciled with the implementation, decision records 0001–0010.
