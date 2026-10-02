---
name: setup
description: Apply the harness device floor to this machine (deny rules, auto mode, sandbox, subagent model, effort, personal CLAUDE.md rules, ~/.claude/loop.md, device record). Use when the user runs /harness:setup, sets up a new device, or re-applies the floor after a harness update.
disable-model-invocation: true
argument-hint: "[--dry-run | --undo]"
---

# /harness:setup

Apply the device floor from `${CLAUDE_PLUGIN_ROOT}/machine/` to `~/.claude/` (SPEC DEV-3). The script merges and never overwrites. It backs up every file it changes and is safe to re-run.

Arguments: `$ARGUMENTS`

## If the arguments contain `--undo`

1. Preview: `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" --undo --dry-run`
2. Show the user what will be restored or removed, and ask for confirmation.
3. On yes: `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" --undo`, then paste the output.

## Otherwise

1. Preview: `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" --dry-run`
2. Paste the table. Explain each non-SKIPPED row in one plain line:
   - `settings.json`: deny rules for secrets and destructive commands (SEC-1), `defaultMode: auto` unless the user already chose a mode (SEC-2), sandbox (SEC-4; no effect on native Windows), `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` (COST-2), `effortLevel: high` (COST-1). Existing values always win; quote the "Settings notes" lines.
   - `CLAUDE.md`: the personal rules between `<!-- harness:start -->` and `<!-- harness:end -->`. Nothing outside the markers changes (CTX-1).
   - `loop.md`: default prompt for a bare `/loop` (LOOP-6). A different existing file is backed up first.
   - `harness-device.json`: OS and harness version, read by `/harness:doctor` (DEV-6).
3. If `$ARGUMENTS` is `--dry-run`, stop here.
4. Ask the user to confirm. On yes: `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs"` and paste the output, including the backup path.
5. Tell the user what comes next:
   - New sessions start in auto mode; the current session keeps its mode.
   - Run `/auto-mode-setup` once on this device so auto mode trusts their GitHub account and package registries (SEC-3). Check it with `claude auto-mode config` in a shell.
   - Run `/harness:doctor`.

## Rules

- Never edit `~/.claude/settings.json` or `~/.claude/CLAUDE.md` by hand in this skill. The script is the only writer.
- If the script exits non-zero, paste its error verbatim and stop. The usual cause is an invalid `settings.json`, which the user must fix.
