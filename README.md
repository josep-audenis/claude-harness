# claude-harness

Josep's lab and distribution point for agent harnesses: the requirements, a Claude Code plugin that implements them on every device, templates for new and existing repos, and the experiments that decide what changes.

## Start here

| I want to… | Read |
|---|---|
| set up a laptop (any OS) | [docs/guides/device-setup.md](docs/guides/device-setup.md) |
| start a new app | [docs/guides/new-app.md](docs/guides/new-app.md) |
| bring an existing repo in | [docs/guides/adopt-existing-repo.md](docs/guides/adopt-existing-repo.md) |
| know how to work day to day | [docs/guides/daily-workflow.md](docs/guides/daily-workflow.md) |
| run agents overnight | [docs/guides/night-shift.md](docs/guides/night-shift.md) |
| change the harness | [docs/guides/updating-the-harness.md](docs/guides/updating-the-harness.md) |
| test whether a change helps | [docs/guides/running-experiments.md](docs/guides/running-experiments.md) |
| fix something | [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) |

## What's in here

| Path | What |
|---|---|
| `SPEC.md` | requirements: what must be true on every device, repo and loop |
| `BUILD.md` | how the implementation is built and tested |
| `plugins/harness/` | the plugin: hooks, agents, skills, workflows, device floor, templates |
| `.claude-plugin/marketplace.json` | makes this repo installable with `/plugin` |
| `docs/knowledge/` | harness and loop engineering concepts, Claude Code primitives, research findings, sources |
| `docs/decisions/` | why things are the way they are |
| `evals/`, `experiments/` | the lab: tasks, runner, experiment records |
| `ROADMAP.md`, `NOTES.md`, `CHANGELOG.md` | what's next, what's verified, what shipped |

## Quick start on a new device

```
gh auth login && gh auth setup-git
claude
/plugin marketplace add josep-audenis/claude-harness
/plugin install harness@josep-harness
/harness:setup
/auto-mode-setup
/harness:doctor
```
