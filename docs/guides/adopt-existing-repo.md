# Bring an existing repo into the harness

`/harness:adopt` retrofits a repo without overwriting anything you already have (SPEC ADOPT-1 to ADOPT-4).

## Run it

1. Commit or stash your work: adopt refuses to run on a dirty tree.
2. Open Claude Code in the repo and run:
   ```
   /harness:adopt
   ```
3. The skill shows a dry run first, then works on a new branch, `harness/adopt`:
   - **adds** missing harness files: the committed Stop gate and helper hooks, reviewer agent, feature list, progress log, CI and review workflows, defect form, AGENTS.md;
   - **merges** `.claude/settings.json` (your hooks stay; the Stop gate and formatter are added, and `worktree.baseRef: "head"` if unset) and CODEOWNERS (missing harness paths appended with your GitHub user);
   - **drafts** `.claude/harness.json` from what the repo already uses: package.json scripts and lockfile, `pyproject.toml` (ruff, mypy, pytest), `go.mod`, `Cargo.toml`. It then runs the checks and fixes the *commands* until they really pass on today's code;
   - trims your CLAUDE.md to 45 lines or fewer, showing every removed line with its reason, and writes it only after you agree. With no CLAUDE.md, it fills one in from the skeleton;
   - seeds 3–10 entries in `feature_list.json`, marking `passes` only for the ones it verified;
   - proves the Stop gate by breaking a check and confirming it blocks (`doctor --repo .`, GATE-1);
   - commits, pushes the branch and opens a PR. It never merges.

The mechanical half is `node <plugin>/scripts/adopt.mjs . --dry-run --owner josep-audenis`, which you can run yourself.

## Review the PR carefully

- **CLAUDE.md diff:** make sure nothing you rely on was cut.
- **`harness.json`:** the checks must be fast (under about 90 s) and need no network. E2E goes under `"e2e"`, not `"check"`.
- **If the checks can't pass on main** because tests are already red, adopt stops and reports. Fix or quarantine those tests yourself first; it won't delete checks to get green.

Merge it yourself, then do the manual steps from `new-app.md` §2 (token secret and ruleset).

## Re-running later

When the harness templates improve, run `/harness:adopt` again. Harness-managed files that differ from the current template (the committed hooks, the reviewer, the workflows, the defect form) show as **DIFFERS** with a diff. Nothing changes until you pick which ones to take; the skill then runs `adopt.mjs --update <paths>`. Content files like `progress.md` and `feature_list.json` are never compared.
