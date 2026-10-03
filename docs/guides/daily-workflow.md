# Daily workflow

How to use the harness with about an hour a day. Your time goes into deciding and reviewing; everything in between runs without you.

## The pipeline

```
you: one line → /harness:brief → read the brief → dispatch with /goal → reviewer → PR → you merge
```

1. **Brief.** `/harness:brief <one-line idea>`. It needs a clean tree, and creates `feat/<id>` if you're on main.
   - The planner (Opus) writes `docs/briefs/<id>.md` with goal, non-goals, scope fence, design, acceptance criteria and budget.
   - The test-writer adds tests and shows they fail.
   - Everything is committed as `brief(<id>): …`. The Stop gate lets that clean, red-by-design commit stand; any later edit re-arms it.
   - You get a `/goal` condition naming the proving commands, the "no test file changed" check (`test-diff.mjs`) and a turn cap.
2. **Read the brief.** Five minutes here saves an evening of review. Check the scope fence and that the criteria describe the right thing (P6: green isn't correct).
3. **Dispatch.** Either:
   - in this session: paste the `/goal` condition; or
   - in the background: `claude agents`, type the task, Enter. Attach with → and set the `/goal`, then detach with ←.

   Keep two background sessions at most.
4. **Stop gate.** While the agent works, the Stop hook blocks the turn until every `harness.json` check passes.
5. **Review.** Following the `/goal`, the session:
   - delegates to the `harness:implementer` subagent, which works in its own worktree;
   - merges its branch;
   - asks the read-only `harness:reviewer` for PASS or CHANGES_REQUESTED.

   `/harness:verify-done <id>` prints the definition of done row by row. On the PR, CI (`ci`) and the Claude review (`review`) run, and `/harness:review-loop` answers their findings.
6. **Merge.** Merging is always yours.

## Which loop for which job

| Job | Use |
|---|---|
| Finish one feature | `/goal` with a named check and a turn cap |
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
