---
name: verify-done
description: Check every definition-of-done criterion with evidence and print one row per criterion, quoting failures verbatim. Never reports done while a row is red. Use when the user runs /harness:verify-done, asks "is it done?", or before claiming a feature or task is finished.
argument-hint: "[feature-id]"
---

# /harness:verify-done

Feature: `$ARGUMENTS` (optional)

The contract states the definition of done. This skill runs it (SPEC AGT-3). The Stop hook holds it when nobody is watching.

Scripts: `.claude/hooks/<script>.mjs` if the repo commits it, otherwise `${CLAUDE_PLUGIN_ROOT}/scripts/<script>.mjs`, for `check.mjs` and `test-diff.mjs`.

## Gather the criteria
1. The **Definition of done** section of the repo's `CLAUDE.md`. Each line names who holds it: the file, a hook, CI, or the human.
2. Every check in `.claude/harness.json`.
3. If a feature id was given: its entry in `feature_list.json` and the acceptance criteria in its brief.

## Produce evidence
- Run `node <check.mjs> --all` once. Each check becomes its own row.
- For a feature: run each acceptance-criterion command and compare with the expected output in the brief. Run `node <test-diff.mjs> <base>` with the feature's `brief(<id>)` commit as base (`git log --format=%h --grep "^brief(<id>)" -1`).
- For criteria about git state, run git: committed, pushed, on a branch, progress.md updated.
- For criteria held by CI or a PR, use `gh pr checks` and `gh pr view`. Without a PR the row is UNVERIFIED.
- Criteria held by the human (merge, reading the brief) are HUMAN rows: never green, never red.

## Report
| # | Criterion | Held by | Status | Evidence |
|---|---|---|---|---|

- Status is PASS, FAIL, UNVERIFIED or HUMAN.
- Evidence is the command you ran plus its exit code or the decisive output line.
- Under the table, quote every FAIL's output verbatim in a code block (last 40 lines). Don't paraphrase.

Final line, one of:
- `DONE`: no FAIL and no UNVERIFIED rows (HUMAN rows remain for the user).
- `NOT DONE: <n> failing, <m> unverified`.

Never write DONE while a row is FAIL or UNVERIFIED, and never mark a row PASS without having run its evidence in this invocation.
