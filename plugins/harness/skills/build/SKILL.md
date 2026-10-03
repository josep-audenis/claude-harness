---
name: build
description: Build a briefed feature autonomously, task by task. Fresh implementer subagent per task, a reviewer per task with capped fix rounds, QA in the browser, a final branch review, then a draft PR. Keeps going without the human; records decisions in the ledger instead of asking. Use after /harness:brief, when the user runs /harness:build <id>, or when a /goal tells you to build or resume a feature.
argument-hint: "<feature-id>"
---

# /harness:build

Feature: `$ARGUMENTS`

You are the orchestrator. You don't write product code yourself: you dispatch, merge, record and decide. Everything durable goes in the ledger, `docs/briefs/<id>.ledger.md` (SPEC §6.8). It is your memory across compaction and resumes.

Scripts:
- `LEDGER` = `node "${CLAUDE_PLUGIN_ROOT}/scripts/ledger.mjs"`;
- `CHECK` and `TESTDIFF` = `node .claude/hooks/check.mjs` and `node .claude/hooks/test-diff.mjs` when committed, otherwise `${CLAUDE_PLUGIN_ROOT}/scripts/…`.

## Keep going: rulings, not stalls
Don't pause to check in, and don't ask "should I continue?". The human started this to be away. The brief is the binding authority. Where it doesn't decide something, you do. Record the decision and keep going:

`LEDGER ruling <id> "<what you decided> — <why> — <what it costs if wrong>"`

**Only four things stop you:**
- an irreversible or destructive action;
- a security-sensitive action;
- a side effect beyond pushing this feature branch or opening a draft PR (a merge, a deploy, a publish, a push to main);
- a plan so broken that every path forward is a guess.

For those, write `BLOCKED.md` (what, why, the options), commit it, and stop.

## 1. Setup (or resume)
1. `git status --porcelain` must be clean. You must be on the feature branch (`feat/<id>`), and the `brief(<id>)` commit must exist (`git log --oneline --grep "^brief(<id>)"`).
2. `LEDGER init <id>`. It creates the ledger from the brief's `### T<n>:` tasks, or says it exists and you're resuming. Then `LEDGER status <id>`. Skip tasks that are already `done` or `parked`; continue at **next**.
3. Commit the ledger whenever it changes (`git commit -m "ledger(<id>): …" docs/briefs/<id>.ledger.md`), so a resume never loses state.

## 2. Each task, in order
1. `LEDGER set <id> <T> --status doing`. Record `TASK_BASE=$(git rev-parse --short HEAD)`.
2. Dispatch **harness:implementer** with only:
   - the brief path;
   - the task heading and its block (Files, Makes green, Verify, Done when);
   - the branch name;
   - "implement this task only".

   Don't paste your conversation.
3. When it returns, verify against git, not its report. Then:
   - merge its worktree branch: `git merge --ff-only <its branch>`, or `git merge --no-edit` if fast-forward is impossible;
   - run `CHECK --all`;
   - `LEDGER set <id> <T> --commit <sha>` for each new commit.
4. Dispatch **harness:reviewer** with `mode: task <T>`, the brief path and `TASK_BASE..HEAD`.
5. **PASS** → `LEDGER set <id> <T> --status done --review PASS`, then commit the ledger and go to the next task.
6. **CHANGES_REQUESTED** → a fix round. `LEDGER set <id> <T> --rounds <R>`, then:
   - **Rounds 1–2:** dispatch harness:implementer again with the task and the findings, verbatim.
   - **Rounds 3–4:** dispatch a **fresh** harness:implementer with `model: opus`, the task, all findings so far, and what was already tried.
   - After each round, re-review with the same task scope.
   - If a finding contradicts the brief, rule on it (ledger) instead of looping.
7. **After round 4 without PASS**, adjudicate each open finding:
   - **load-bearing** (correctness, data, security, an acceptance criterion): if any path forward isn't a guess, make a ruling and take it; otherwise `LEDGER set <id> <T> --status blocked`, write `BLOCKED.md`, and stop;
   - **not load-bearing:** `LEDGER park <id> <T> "<finding> — <why parked>"`, then `--status parked`, and continue.

## 3. After the last task
1. **QA**: if `.claude/harness.json` has `init` and `health`, dispatch **harness:qa** with the brief path, then `LEDGER qa <id> "<PASS|FAIL> <one line>"`.
   - On FAIL: one fix dispatch of the implementer with QA's evidence, then QA again.
   - No runnable app: `LEDGER qa <id> "n/a (no init/health)"`.
2. **Final review**: dispatch **harness:reviewer** with `mode: final` from the `brief(<id>)` commit to HEAD, then `LEDGER final <id> "<verdict>"`. On CHANGES_REQUESTED: one fix dispatch, one scoped re-review, then rule on what remains.
3. **Proof**: `CHECK --all`, `TESTDIFF <brief commit>` and `LEDGER status <id> --check`. Paste all three. Then run /harness:verify-done for <id>.
4. **Ship**: commit the ledger, run `git push -u origin <branch>`, then `gh pr create --draft --fill`. In the PR body, include:
   - the ledger summary;
   - every Ruling;
   - the parked findings;
   - QA evidence;
   - the proof output.

   **Never merge.** Tell the human the PR is ready for review.

## Rules
- The implementer never edits tests, and neither do you. A wrong test gets a ruling and goes to the human in the PR. It is never "fixed" by you.
- One task at a time, in brief order: each builds on reviewed code.
- If context gets long, rely on the ledger, not on memory. After compaction, re-read `LEDGER status <id>` and the brief.
- Narrate at most one short line between tool calls. The ledger and the tool results are the record.
