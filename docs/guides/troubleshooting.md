# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/plugin marketplace add` fails on the private repo | git can't authenticate without prompting | `gh auth login && gh auth setup-git`; without an SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` |
| Devices don't get a change you pushed | `version` wasn't bumped, or auto-update is off | bump the version in `plugin.json`; run `/plugin marketplace update josep-harness` |
| Stop gate never fires | repo has no `.claude/harness.json`, or the tree is clean with nothing ahead of main | expected (GATE-2); `/harness:doctor` proves the gate |
| Stop gate fires twice | both the plugin and a committed copy run | the plugin copy should defer (GATE-3); run doctor and report it as a bug |
| Turn ends with "Stop hook blocked too many times" | 8 consecutive blocks without progress | the agent is missing an idea: change approach, switch model, or step in |
| Plugin Stop hook halts instead of continuing | known past bug with plugin Stop hooks | `/harness:doctor --live`; if it fails, rely on the committed repo copy and report it |
| Auto mode blocks pushes to your own repos | classifier doesn't know your GitHub account | `/auto-mode-setup`, then `claude auto-mode config` |
| Hooks fail on Windows | `node` not on PATH for Claude Code | install Node LTS, restart the terminal, `/harness:doctor` |
| `/schedule` says unknown command | logged in with an API key, or signed out | `/login` with your claude.ai account; unset `ANTHROPIC_API_KEY` |
| Routine "succeeded" but did nothing | a green status means a clean exit, not task success | open the run's transcript |
| Review action finished in seconds with no findings | workflow file differs from main's copy, so the action skipped | read the action log; treat it as a failure (REV-5) |
| `/goal` says done but checks fail | evaluator read a confident summary | name the proving command in the condition; the Stop gate still blocks |
