---
name: adopt
description: Retrofit the harness onto an existing repo on a harness/adopt branch. Add the missing harness files without overwriting anything, make the drafted checks real and passing, trim CLAUDE.md to 45 lines showing every cut, seed the feature list, prove the Stop gate, and open a PR. Re-running shows DIFFERS for harness files that changed upstream. Use when the user runs /harness:adopt.
disable-model-invocation: true
argument-hint: "[--update <path,path|all>]"
---

# /harness:adopt

Arguments: `$ARGUMENTS`

The script does the mechanics; you do the judgement (SPEC ADOPT-1 to ADOPT-4). Never merge the PR (REV-4).
`ADOPT` = `node "${CLAUDE_PLUGIN_ROOT}/scripts/adopt.mjs" .`. Get the owner with `gh api user --jq .login`.

## 1. Mechanics
1. `ADOPT --dry-run --owner <login>`. It refuses a dirty tree; if so, ask the user to commit or stash.
2. Show the table. If it's a re-run with **DIFFERS** rows, show each diff and ask which to take: then `ADOPT --update <paths> --owner <login>`, commit, and stop here (ADOPT-4). Otherwise ask to proceed, then `ADOPT --owner <login>`.
   - The script switches to `harness/adopt`, ADDs missing files, MERGEs `.claude/settings.json` and CODEOWNERS, and DRAFTs `.claude/harness.json`. It never touches an existing `CLAUDE.md`.

## 2. Make the checks real (ADOPT-2)
- Run `node .claude/hooks/check.mjs --all`. Fix the **commands** in `harness.json` until each one runs the repo's real typecheck, lint and fast tests. Never change product code or tests to get green.
- Checks must be fast (about 90 s total) and need no network. Leave out e2e; put it under `"e2e"` instead.
- **If a check fails on today's code, stop and report** with the output verbatim. Don't delete or weaken the check to get green; the user fixes or quarantines it first.
- When all pass, remove `"_draft": true`.

## 3. CLAUDE.md to 45 lines or fewer (ADOPT-3, CTX-2)
- Existing file over 45 lines, or holding directory tours, dependency lists or architecture overviews: propose a trimmed version. Keep commands, gotchas, reasons, conventions, "Working across sessions" and a definition of done that names who holds each line.
- Show **every removed line with its reason** in a table: `removed line | reason (derivable from code, tour, duplicate, stale…)`. Write the file only after the user agrees.
- If adopt created it from the skeleton: fill every TODO from what you learned in step 2.
- Make sure `AGENTS.md` points to `CLAUDE.md`.

## 4. Seed the feature list (CTX-4)
Add 3–10 entries to `feature_list.json` for behaviour the repo already has: id, description, end-to-end `steps`. Run each entry's steps; set `"passes": true` only for those you verified. List what you couldn't verify.

## 5. Prove and ship
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" --repo .`: GATE-1 must be PASS (proven). Paste the repo rows.
2. Commit on `harness/adopt` with a message listing the SPEC IDs, then push the branch.
3. `gh pr create --fill --base <default branch>`. In the PR body, include the CLAUDE.md cut table, the final checks and their output, and the manual steps:
   - `claude setup-token` and `gh secret set CLAUDE_CODE_OAUTH_TOKEN`;
   - the ruleset on main (PR, checks `ci` and `review`).
4. Tell the user to review the CLAUDE.md diff and `harness.json` closely, then merge it themselves.
