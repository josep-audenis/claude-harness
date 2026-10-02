# AGENTS.md

This repository's agent contract is [`CLAUDE.md`](CLAUDE.md). Every coding agent and reviewer, Claude or not, follows it.

- Checks: `.claude/harness.json`, run with `node .claude/hooks/check.mjs --all`.
- Features: `feature_list.json` and `progress.md`; briefs in `docs/briefs/`.
- Paths under `.claude/`, `.github/`, `CLAUDE.md` and this file are human-owned (see CODEOWNERS). Agents never change their own gates and never merge.
