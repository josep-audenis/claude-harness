# claude-harness

Josep's lab for agent harnesses. This repo is the spec, a Claude Code plugin marketplace (`josep-harness`) with the `harness` plugin, an experiment lab (`evals/`, `experiments/`), and the docs for all of it.

## Read first
- `SPEC.md` is the source of truth: what must be true. Don't edit it; propose changes in NOTES.md.
- `BUILD.md` says how to build and change it: layout, rules, phases, tests.
- `NOTES.md` records what has been verified against the Claude Code docs, plus deviations and open questions.
- `docs/knowledge/` is background: concepts, Claude Code primitives, research. Read what the task touches.

## Commands
- `npm test` runs all tests (node:test, no deps, never calls the real `claude`). It must pass before any commit.
- `npm run sync-templates` regenerates the committed hook copies in `plugins/harness/templates/repo/.claude/hooks/`.
- `claude plugin validate .` validates the marketplace and plugin.
- `claude --plugin-dir ./plugins/harness` tries the plugin locally without installing it.
- `node evals/run.mjs --variant <dir> --claude-bin evals/stub/claude-stub.mjs` exercises the lab without spending tokens.

## Gotchas
- All scripts must run on macOS, Linux and Windows: Node built-ins only, no bash/jq/symlinks, exec-form hooks.
- Never write to the real home directory. Tests and scripts take `--home <dir>`.
- Plugin `settings.json` only honours `agent` and `subagentStatusLine`. Permissions and env belong to `machine/settings.floor.json`, applied by setup.
- A change that should reach devices needs a version bump in `plugins/harness/.claude-plugin/plugin.json` and a CHANGELOG.md line.
- Real eval runs spend Josep's quota. Only start them when he asks.

## Definition of done
- `npm test` passes                                   (Stop gate)
- CI green on ubuntu, macos and windows               (GitHub)
- Guides match the implementation; README links them  (the agent)
- Commit message names the SPEC IDs touched           (the agent)
- Version bumped and pushed                           (Josep, never the agent)
