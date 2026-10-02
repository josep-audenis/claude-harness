# 0002: Hooks and scripts in Node, exec form

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** DEV-5

## Context
Shell-form hooks run under `sh` on macOS and Linux but under Git Bash or PowerShell on Windows. Bash hooks also lean on `jq`, `sed` and POSIX flags that differ between platforms.

## Decision
All hooks and scripts are Node ≥ 20 using built-in modules only. They are registered in exec form (`command: "node"`, `args: ["${CLAUDE_PLUGIN_ROOT}/scripts/x.mjs"]`), so no shell is involved. Repo checks are defined as a command list in `.claude/harness.json` and run through the platform shell.

## Alternatives rejected
- **Bash plus jq:** fragile on Windows and adds a dependency.
- **PowerShell twins of every script:** doubles the maintenance.
- **Python:** not guaranteed on every dev machine, and slower to start.

## Consequences
- Node 20+ is a device requirement (DEV-1).
- One implementation, tested on all three operating systems in CI.
