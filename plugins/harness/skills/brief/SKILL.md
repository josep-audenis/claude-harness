---
name: brief
description: Turn a one-line feature request into a brief, a feature_list entry, failing tests (shown red) and a /goal condition, without implementing anything. Use when the user runs /harness:brief or asks to plan or spec a feature before building it.
disable-model-invocation: true
argument-hint: "<one-line feature request>"
---

# /harness:brief

Request: `$ARGUMENTS`

You produce a contract, not code (SPEC AGT-2). **Never implement the feature in this skill**, not even a stub. The maker and the checker are different agents (P3).

Scripts: `.claude/hooks/<script>.mjs` when the repo commits it, otherwise `${CLAUDE_PLUGIN_ROOT}/scripts/<script>.mjs`. Below, `CHECK` means that path for `check.mjs` and `TESTDIFF` for `test-diff.mjs`.

## 1. Preconditions
- Run `git status --porcelain`. If anything is uncommitted, stop and ask the user to commit or stash.
- Pick a feature id: kebab-case, 2–5 words, not already in `feature_list.json`.
- If on the default branch, `git switch -c feat/<id>`. Otherwise stay on the current branch and say which one.

## 2. Brief
Delegate to the **harness:planner** subagent with the request and the id. When it returns, read `docs/briefs/<id>.md` yourself. Show the user its path, the summary and any **Open questions**. If an open question would change the acceptance criteria, ask the user before going on.

## 3. Feature entry
Append to `feature_list.json` (create it as `[]` if missing):
`{ "id": "<id>", "description": "<one sentence>", "steps": [<the acceptance criteria, short>], "brief": "docs/briefs/<id>.md", "passes": false }`.
Never edit or reorder other entries.

## 4. Failing tests
Delegate to the **harness:test-writer** subagent with the brief path. Then verify it yourself, because the maker of a check doesn't grade it either:
- run the test command it reported, and paste the output: the new tests must be red, for the reason the brief describes;
- `git status --porcelain`: every new or changed file must be a test or fixture, the brief, or `feature_list.json`. Anything else is a violation: stop and report it. Don't commit it.

## 5. Commit
`git add docs/briefs/<id>.md feature_list.json <the test files>`, then `git commit -m "brief(<id>): <goal in a few words>"`.
Only those files: the Stop gate treats a clean `brief(...)` commit of brief, feature entry and tests as red by design, and any other file re-arms it. Record `BASE=$(git rev-parse --short HEAD)`.

## 6. Hand-off
Print, filling in every `<…>` (N comes from the brief's Budget):

```
/goal Feature <id> (docs/briefs/<id>.md) is done: `node <CHECK> --all` exits 0 with its output shown in this session; every acceptance criterion command in the brief was run in this session with its output shown; feature_list.json has "passes": true for <id>; `node <TESTDIFF> <BASE>` exits 0 with its output shown; and the harness:reviewer subagent returned PASS for <BASE>..HEAD. Delegate the work to the harness:implementer subagent, merge its worktree branch with `git merge --ff-only`, then ask harness:reviewer. Never merge to main. Stop after <N> turns.
```

Then tell the user: read the brief now, because it's where judgement matters most (P6). Then paste the `/goal` here or in a background session (`claude agents`).
