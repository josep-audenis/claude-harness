# 0003: Device floor applied by a skill, not by the plugin

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** DEV-3, SEC-1..4, CTX-1, LOOP-6

## Context
A plugin's `settings.json` honours only `agent` and `subagentStatusLine`. A plugin can't set permissions, `defaultMode`, sandbox or env, and a `CLAUDE.md` in a plugin isn't loaded. Auto mode as a default is honoured only from user or managed settings.

## Decision
`machine/` in the plugin holds the floor: `settings.floor.json`, `CLAUDE.personal.md` and `loop.md`. `/harness:setup` merges these into `~/.claude/` idempotently, with a backup and `--undo`. Doctor warns when the plugin version is newer than the version recorded at setup.

## Alternatives rejected
- **Managed settings:** need an organization admin; not available for a personal setup.
- **Ask the user to edit settings by hand:** drifts between devices.

## Consequences
- A floor change needs `/harness:setup` re-run on each device (DIST-3).
