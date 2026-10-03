---
name: brief
description: Turn a feature request (one line, or a big feature like a dashboard) into a brief with an ordered task list, a feature_list entry, failing tests (shown red) and a /goal that runs /harness:build unattended. Implements nothing. Use when the user runs /harness:brief or asks to plan or spec a feature before building it.
disable-model-invocation: true
argument-hint: "<feature request>"
---

# /harness:brief

Request: `$ARGUMENTS`

You produce a contract, not code (SPEC AGT-2). **Never implement the feature in this skill**, not even a stub. The maker and the checker are different agents (P3).

Scripts: `.claude/hooks/<script>.mjs` when the repo commits it, otherwise `${CLAUDE_PLUGIN_ROOT}/scripts/<script>.mjs`. Below:
- `CHECK` means that path for `check.mjs`;
- `TESTDIFF` for `test-diff.mjs`;
- `LEDGER` for `${CLAUDE_PLUGIN_ROOT}/scripts/ledger.mjs`.

## 1. Preconditions
- Run `git status --porcelain`. If anything is uncommitted, stop and ask the user to commit or stash.
- Pick a feature id: kebab-case, 2–5 words, not already in `feature_list.json`.
- If on the default branch, `git switch -c feat/<id>`. Otherwise stay on the current branch and say which one.

## 2. Brief
Delegate to the **harness:planner** subagent with the request and the id. When it returns, read `docs/briefs/<id>.md` yourself and show the user:
- its path, its size (small, medium or large) and its task count;
- the summary;
- every **Open question**.

The build will run unattended, so **every open question must be answered now**. Ask the user, then make sure the answers are written into the brief (edit the brief yourself; it's prose, not code). Make sure the brief has a `## Tasks` section with `### T1: …` headings: the build reads them.

## 3. Feature entry
Append to `feature_list.json` (create it as `[]` if missing):
`{ "id": "<id>", "description": "<one sentence>", "steps": [<the acceptance criteria, short>], "brief": "docs/briefs/<id>.md", "passes": false }`.
Never edit or reorder other entries.

## 4. Failing tests
Delegate to the **harness:test-writer** subagent with the brief path. It writes the tests for **all** acceptance criteria, which the tasks then turn green one by one. Then verify it yourself, because the maker of a check doesn't grade it either:
- run the test command it reported, and paste the output: the new tests must be red, for the reason the brief describes;
- `git status --porcelain`: every new or changed file must be a test or fixture, the brief, or `feature_list.json`. Anything else is a violation: stop and report it. Don't commit it.

## 5. Commit
`git add docs/briefs/<id>.md feature_list.json <the test files>`, then `git commit -m "brief(<id>): <goal in a few words>"`.
Only those files: the Stop gate treats a clean `brief(...)` commit of brief, feature entry and tests as red by design, and any other file re-arms it. Record `BASE=$(git rev-parse --short HEAD)`.

## 6. Hand-off
Print, filling in every `<…>` (N comes from the brief's Budget):

```
/goal Feature <id> (docs/briefs/<id>.md) is built: `node <LEDGER> status <id> --check` exits 0 with its output shown (every task done or parked, QA PASS or n/a, final review PASS); `node <CHECK> --all` exits 0 with its output shown; `node <TESTDIFF> <BASE>` exits 0 with its output shown; and a draft PR exists for the branch. Work by running /harness:build <id>; resume it if the session was compacted. Make rulings instead of asking, per /harness:build. Never merge. Stop after <N> turns.
```

Then tell the user:
- Read the brief now: it's where judgement matters most (P6).
- For an unattended run:
  - use **auto** permission mode;
  - keep the machine awake (or use a background session from `claude agents`);
  - remember that Pro usage windows can pause a long run.
- Then paste the `/goal`.
