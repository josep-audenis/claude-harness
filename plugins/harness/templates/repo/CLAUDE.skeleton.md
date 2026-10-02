# APP_NAME

<!-- Keep this file under 45 lines (SPEC CTX-2). Only what the repo can't say for itself:
     commands, gotchas, reasons, conventions. No directory tours or dependency lists. -->

## Commands
- All checks: `node .claude/hooks/check.mjs --all` (the same list CI and the Stop gate run, from `.claude/harness.json`)
- TODO: the fast way to run one test, and which command NOT to use and why

## Gotchas
- TODO: things you pay for only once (a slow command, a native dependency, a port)

## Conventions
- TODO: rules no file declares (where data access lives, error shape, naming)

## Working across sessions
- Start: read `progress.md` (the SessionStart hook injects its tail) and `git log --oneline -8`.
- One feature per session, from `feature_list.json`. Flip `passes` only after running its steps end to end; never delete or reword entries.
- New work starts with `/harness:brief`; briefs live in `docs/briefs/`.
- End: commit, then add a 3-line entry to `progress.md`.
- Stuck on the same error twice: write `BLOCKED.md` and stop.

## Definition of done
- Every `.claude/harness.json` check exits 0              (Stop hook)
- No test file changed after the brief commit             (reviewer, `test-diff.mjs`)
- Feature steps verified, `passes: true`, progress entry  (the agent)
- Reviewer subagent returned PASS                          (the agent)
- CI `ci` and `review` green on the PR                     (GitHub)
- Merged by a human                                        (the human, never an agent)
