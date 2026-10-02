---
name: doctor
description: Check this device and the current repo against the harness SPEC and explain every failure with its fix. Use when the user runs /harness:doctor, asks whether the harness is set up, whether a repo is harnessed, or why a hook or gate isn't working.
argument-hint: "[--live] [--repo <dir>] [--no-repo]"
---

# /harness:doctor

Arguments: `$ARGUMENTS`

1. If `$ARGUMENTS` contains `--live`, first tell the user it runs one short `claude -p` session on Haiku in a temp repo. That spends a few tokens and takes up to a few minutes. It proves the plugin's Stop hook really blocks a turn. Ask before running it.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" $ARGUMENTS` from the current working directory. Repo rows appear when the cwd is a git repo, or with `--repo <dir>`.
3. Paste the table exactly as printed.
4. For every FAIL, then every WARN, write one line: what it means in plain words, then the fix command from the Fix column. Group them as "Device" and "Repo".
5. Offer to run the fixes that are harness commands (`/harness:setup`, `/harness:adopt`). Never run them without a yes. Fixes outside Claude Code (installing tools, `gh auth login`, GitHub rulesets) are the user's to do; give the exact command or link.
6. End with the summary line from the output. Doctor exits 1 when a MUST fails; that is a result, not an error.

Notes:
- SEC-4 (sandbox) is SKIP on native Windows: the sandbox needs macOS, Linux or WSL2.
- REV-2 needs a GitHub remote and reads the branch rules with `gh api`. On private repos with GitHub Free, rulesets aren't available.
- A WARN on `DIST-3` means the plugin updated since setup ran; re-run `/harness:setup`.
