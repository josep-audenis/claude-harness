# Night shift

A cloud routine that turns one `agent-ready` defect per night into a PR for the morning (SPEC NIGHT-1 to NIGHT-4).

## Preconditions

- `/harness:doctor` in the repo shows it as harnessed (CTX-2 to CTX-4, NIGHT-3, GATE-1 proven, REV-1, REV-3). Routines clone the repo fresh and never see your `~/.claude/` or local plugins, so the committed Stop gate (`.claude/hooks/`), reviewer (`.claude/agents/reviewer.md`) and `harness.json` must be in the repo. `/harness:new-app` and `/harness:adopt` put them there.
- The ruleset on `main` is active, so a bad PR can't merge without you.

## Create the routine

In Claude Code, inside the repo:

```
/schedule weeknights at 02:17, run the night shift
```

When asked for the prompt, paste SPEC §6.7. Then on claude.ai/code/routines, edit the routine:
- **Repositories:** only this repo.
- **Connectors:** remove all of them unless the prompt needs one. The routine can use every included connector without asking.
- **Environment:** the default (trusted network) is fine for most stacks.

## Filing defects

Use the **Defect** issue form. It gives the issue the `agent-ready` label, a stable key, a verbatim Reproduce block and a severity. Before filing, search open *and closed* issues for the key.

## Each morning

- Open the run, not just its status: a green status only means the session exited cleanly.
- Review the PR like any other. The routine never merges.
- Routine runs draw on your subscription usage like any session. Starts are also limited per hour: 100 scheduled runs per hour per account, per the routines docs (checked 2026-10-03). Schedule off the hour, e.g. 02:17, because runs exactly on the hour can start late.
