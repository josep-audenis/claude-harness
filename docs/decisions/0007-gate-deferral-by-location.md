# 0007: The plugin's gate defers by script location, not by an environment variable

**Status:** Accepted · **Date:** 2026-10-03 · **SPEC IDs:** GATE-3

## Context
A harnessed repo commits its own `.claude/hooks/stop-gate.mjs`, because cloud runs don't have the plugin. On a device with the plugin, both copies would fire on Stop. GATE-3 says the plugin copy defers. BUILD §3.2 suggested detecting "I am the plugin copy" by `CLAUDE_PLUGIN_ROOT` being set.

## Decision
Each copy compares its own path (`import.meta.url`) with `<project>/.claude/hooks/<name>`. If the repo commits that file and this script isn't it, the script exits 0. The formatter does the same (`shouldDefer` in `lib.mjs`).

## Alternatives rejected
- **`CLAUDE_PLUGIN_ROOT` is set:** that is a property of the environment, not of the script. If the variable ever leaks into the committed hook's process (inherited from a parent, or set by a wrapper), the committed copy defers too and *nothing* gates. That failure is silent and unsafe. There's a test for exactly this case.
- **Both run, and accept double work:** checks run twice per Stop, and two blocking messages confuse the agent.

## Consequences
- Exactly one gate runs, decided by facts on disk. Symlinked temp dirs (macOS `/var` → `/private/var`) are handled with `realpath`.
- Copying the plugin script into a repo under another name would not defer. Only `sync-templates` writes the committed copies, so that doesn't happen in practice.
