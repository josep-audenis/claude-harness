# Night shift

A cloud routine that turns one `agent-ready` defect per night into a PR for the morning (SPEC NIGHT-1 to NIGHT-4).

## Preconditions

- `/harness:doctor` in the repo shows it as harnessed. Routines clone the repo fresh and never see your `~/.claude/` or local plugins, so the committed Stop gate, reviewer and `harness.json` must be in the repo.
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
- Daily runs are capped per account (Anthropic's launch post said 5 on Pro, 15 on Max). Check claude.ai/code/routines for your current count.
