# Bring an existing repo into the harness

`/harness:adopt` retrofits a repo without overwriting anything you already have (SPEC ADOPT-1 to ADOPT-4).

## Run it

1. Commit or stash your work; adopt refuses to run on a dirty tree.
2. Open Claude Code in the repo and run:
   ```
   /harness:adopt
   ```
3. It works on a new branch, `harness/adopt`:
   - adds missing harness files: committed Stop gate, reviewer agent, feature list, progress log, CI and review workflows, defect form;
   - merges `.claude/settings.json` and CODEOWNERS;
   - drafts `.claude/harness.json` from what the repo already uses (package scripts, `pyproject.toml`, `go.mod`, `Cargo.toml`) and runs the checks until they really pass on today's code;
   - trims your CLAUDE.md to 45 lines or fewer, showing every removed line with its reason;
   - seeds 3–10 entries in `feature_list.json`;
   - proves the Stop gate by breaking a check and confirming it blocks;
   - opens a PR. It never merges.

## Review the PR carefully

- **CLAUDE.md diff:** make sure nothing you rely on was cut.
- **`harness.json`:** the checks must be fast (under ~90 s) and need no network.
- **If the checks can't pass on main** because tests are already red, adopt stops and reports. Fix or quarantine those tests yourself first; it won't delete checks to get green.

Merge it yourself, then do the manual steps from `new-app.md` §2 (token secret and ruleset).

## Re-running later

When the harness templates improve, run `/harness:adopt` again. Files that differ from the current template show as **DIFFERS** with a diff, and nothing changes until you say so.
