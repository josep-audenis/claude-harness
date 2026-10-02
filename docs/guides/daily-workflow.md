# Daily workflow

How to use the harness with about an hour a day. Your time goes into deciding and reviewing; everything in between runs without you.

## The pipeline

```
you: one line → /harness:brief → read the brief → dispatch with /goal → reviewer → PR → you merge
```

1. **Brief.** `/harness:brief <one-line idea>`. The planner (Opus) writes `docs/briefs/<id>.md` with goal, non-goals, scope fence and acceptance criteria. The test-writer adds tests and shows they fail. You get a `/goal` condition.
2. **Read the brief.** Five minutes here saves an evening of review. Check the scope fence and that the criteria describe the right thing (P6: green isn't correct).
3. **Dispatch.** Either:
   - in this session: paste the `/goal` condition; or
   - in the background: `claude agents`, type the task, Enter. Attach with → and set the `/goal`, then detach with ←.

   Keep two background sessions at most.
4. **Stop gate.** While the agent works, the Stop hook blocks the turn until every `harness.json` check passes.
5. **Review.** The implementer runs the reviewer subagent before opening a PR. CI and Claude review run on the PR. `/harness:review-loop` answers findings.
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
