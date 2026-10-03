# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No harness hook ever fires (no Stop gate, no Bash gate), and `--debug` shows `[stdin]:1 … SyntaxError` | Claude Code older than 2.1.139 ignores the hooks' `args` and runs a bare `node` | `claude update`; `/harness:doctor` fails DEV-1 below 2.1.139 |
| `/plugin marketplace add` fails | git can't authenticate without prompting, or no SSH key | `gh auth login && gh auth setup-git`; without an SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` |
| `claude plugin validate .` says `Unrecognized key: "description"` | an old CLI rejects a top-level marketplace `description` | keep the description under `metadata.description` (already done); update Claude Code |
| Devices don't get a change you pushed | `version` wasn't bumped, or auto-update is off | bump the version in `plugin.json`; run `/plugin marketplace update josep-harness` |
| Doctor warns DIST-3 | the plugin updated since `/harness:setup` ran | re-run `/harness:setup` |
| Stop gate never fires | repo has no `.claude/harness.json`, the tree is clean with nothing ahead of main, or HEAD is a clean `brief(<id>)` commit | expected (GATE-2); `/harness:doctor` proves the gate |
| Stop gate fires twice | both the plugin and a committed copy run | the plugin copy should defer (GATE-3); run doctor and report it as a bug |
| Turn ends with "Stop hook blocked too many times" | 8 consecutive blocks without progress | the agent is missing an idea: change approach, switch model, or step in |
| Plugin Stop hook halts instead of continuing | known past bug with plugin Stop hooks (claude-code#10412) | `/harness:doctor --live`; if it fails, rely on the committed repo copy and report it |
| Auto mode blocks pushes to your own repos | classifier doesn't know your GitHub account | `/auto-mode-setup`, then `claude auto-mode config` |
| Hooks fail on Windows | `node` not on PATH for Claude Code | install Node LTS, restart the terminal, `/harness:doctor` |
| `pnpm install` in a new app fails in `node-gyp` for better-sqlite3 | it was added to `onlyBuiltDependencies`, which forces a source build | remove it from that list (it ships prebuilt binaries); Node ≥ 22 |
| `/harness:adopt` says "refusing to adopt a dirty tree" | uncommitted changes | commit or stash, then re-run |
| A drift test fails after editing a hook script | the committed template copies are stale | `npm run sync-templates` |
| `/schedule` says unknown command | logged in with an API key, or signed out | `/login` with your claude.ai account; unset `ANTHROPIC_API_KEY` |
| Routine "succeeded" but did nothing | a green status means a clean exit, not task success | open the run's transcript |
| Review action finished in seconds with no findings | workflow file differs from main's copy, so the action skipped | read the action log; treat it as a failure (REV-5) |
| `/goal` says done but checks fail | evaluator read a confident summary | name the proving command in the condition; the Stop gate still blocks |
| Sandbox has no effect on Windows | native Windows has no sandbox | use WSL2 if you need it; doctor shows SEC-4 as SKIP |
