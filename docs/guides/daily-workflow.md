# Daily workflow

How to use the harness with about an hour a day. Your time goes into deciding and reviewing; everything in between runs without you.

## The pipeline

```
you: one line → /harness:brief → read the brief, answer its questions → /goal + /harness:build → draft PR → you merge
```

1. **Brief.** `/harness:brief <idea>`, from one line up to a big feature like a dashboard. It needs a clean tree, and creates `feat/<id>` if you're on main.
   - The planner (Opus) writes `docs/briefs/<id>.md`: goal, non-goals, scope fence, design, acceptance criteria, an **ordered task list sized to the feature** (small 1–3, medium 4–8, large 9–20 in milestones) and a budget.
   - The test-writer adds failing tests for every criterion and shows them red.
   - Everything is committed as `brief(<id>): …`. The Stop gate lets that clean, red-by-design commit stand.
   - You get a `/goal` naming the proving commands, with `ledger.mjs status <id> --check` first.
2. **Read the brief and answer its open questions.** The build runs without you, so anything unanswered now gets decided by a ruling later. Check the scope fence and that the criteria describe the right thing (P6: green isn't correct).
3. **Dispatch.** Paste the `/goal`. It runs `/harness:build <id>`, either in this session or in a background session (`claude agents`: type the task, attach with →, set the `/goal`, detach with ←). Keep two background sessions at most.
4. **The build, unattended.** For each task:
   1. a fresh `harness:implementer` works in its own worktree. A SubagentStop gate won't let it finish while checks are red;
   2. its work is merged;
   3. a task-scoped `harness:reviewer` gives PASS or CHANGES_REQUESTED;
   4. up to 4 fix rounds, the last two on Opus; then non-essential findings are parked.

   Then:
   - `harness:qa` drives the running app in a browser against the brief;
   - a final review covers the whole branch;
   - the proof commands run;
   - a **draft PR** opens.

   Every judgement call is written to `docs/briefs/<id>.ledger.md` as a `Ruling` instead of a question to you. It stops only for something destructive, security-sensitive or outward-facing beyond the PR, or a plan that's broken (`BLOCKED.md`).
5. **Review.** Read the PR: the ledger's rulings and parked findings first, then the diff. `/harness:verify-done <id>` prints the definition of done row by row. On the PR, CI (`ci`) and the Claude review (`review`) run, and `/harness:review-loop` answers their findings.
6. **Merge.** Merging is always yours.

### A big feature, unattended: checklist
- Run in **auto** permission mode (the app's mode selector, or the floor's default). In manual mode every tool call waits for you.
- Answer every open question in the brief before pasting the `/goal`.
- Keep the machine awake (the app's keep-awake setting), or use a background session.
- Expect Pro usage windows to pause a long run. The ledger is committed after every task, so a paused or compacted session resumes at the next task: `/harness:build <id>` again.
- You get a desktop notification when it needs you; otherwise come back to a draft PR.

### When the same mistake comes back
`/harness:learn <what went wrong>` turns it into a rule at the right level: a CLAUDE.md line, a path rule, a skill, or an executed `bashDeny` rule the Bash gate enforces.

## Which loop for which job

| Job | Use |
|---|---|
| Build one feature, small or big | `/harness:brief` then the printed `/goal` (runs `/harness:build`) |
| Watch CI or PR comments | bare `/loop` (uses `~/.claude/loop.md`) |
| Several independent features | a saved workflow such as `/build-queue`, once it exists, or two background sessions |
| Weird bug, unclear cause | agent team with competing hypotheses (expensive; rarely) |
| Defects while you sleep | night-shift routine (`night-shift.md`) |

## Rhythm

| When | What |
|---|---|
| Morning, 15 min | Triage night PRs. Brief one idea; dispatch it. |
| Daytime, 0 min | A notification fires only when a session needs you. |
| Evening, 40 min | Review green PRs, merge, file breakages as defects (issue form, label `agent-ready`). |
| Weekend, 1 h | Harness work in this repo: what failed twice moves up a level. Run an experiment if a change is a guess. |

## Budget

- Effort stays at `high`; use `ultracode:` per task only.
- Subagents run Sonnet; the planner runs Opus.
- Agent teams cost about 7× a single session.
- Every background session draws on your quota separately.
