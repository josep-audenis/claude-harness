# Notes

Working notes kept by the agents that build this repo. Keep entries dated.

## Kickoff settings (§0), recorded 2026-10-02
| Setting | Value |
|---|---|
| GitHub username | `josep-audenis` |
| Marketplace name | `josep-harness` |
| Devices and OSes | Windows 11 desktop (primary), Linux |
| App stack for new apps | default (Next.js + TypeScript, pnpm, Drizzle + SQLite, Vitest, Playwright) |
| Claude plan | Pro |
| GitHub plan | Free; `claude-harness` repo stays **public** (rulesets work on public repos on the free plan) |
| Build order | core first: phases 1–4 and 7, then 5–6, then 8–10 |

Device at kickoff (Windows): git 2.45.1, node v25.3.0, gh 2.101.0 (authenticated as josep-audenis), pnpm 10.28.1, Python 3.14.2, **Claude Code 2.1.92 (too old; see Open questions)**.

## Verified against docs
Checked 2026-10-02 against the raw Markdown of code.claude.com/docs/en/<page>.md. The WebFetch summariser invented wrong key formats on some pages (e.g. `bash:run:npm` permission syntax, `extraKnownMarketplaces` as an array), so every row below was confirmed by grepping the raw page.

| Key / field / command | Doc page | Date | Result |
|---|---|---|---|
| Hook exec form: `"type":"command"`, `"command":"node"`, `"args":[...]`; exec form when `args` is set, no shell; `${CLAUDE_PLUGIN_ROOT}` substituted in `command` and each `args` element | hooks | 2026-10-02 | confirmed. On Windows `command` must be a real `.exe`, so `node` works and `npx`/`.cmd` shims don't |
| Shell-form hooks run `sh -c` (macOS/Linux), Git Bash or PowerShell (Windows) | hooks | 2026-10-02 | confirmed |
| Hook `timeout` is in seconds; command default 600 | hooks | 2026-10-02 | confirmed |
| Hook `async: true` (background, timeout not enforced) | hooks | 2026-10-02 | confirmed |
| Exit 2 blocks; stderr fed back; other non-zero = non-blocking error | hooks | 2026-10-02 | confirmed |
| Stop input: `stop_hook_active`, `last_assistant_message` (v2.1.196+), `background_tasks`, `session_crons` | hooks | 2026-10-02 | confirmed |
| Stop/SubagentStop cap of 8 consecutive continuations; `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (0 disables) | hooks, env-vars | 2026-10-02 | confirmed (was unverified in SPEC §8) |
| PreToolUse `hookSpecificOutput.permissionDecision` = allow, deny, ask, defer; `permissionDecisionReason` required for deny/ask | hooks | 2026-10-02 | confirmed |
| SessionStart matchers startup, resume, clear, compact, fork; plain stdout or `hookSpecificOutput.additionalContext` becomes context; >10,000 chars spills to a file | hooks | 2026-10-02 | confirmed |
| Notification input has `notification_type` and `message`; matcher filters on `notification_type` | hooks | 2026-10-02 | confirmed (was unverified in SPEC §8) |
| PostToolUse input: `session_id`, `cwd`, `tool_name`, `tool_input`, `tool_response`, `tool_use_id`, `agent_id` (inside subagents), `agent_type` | hooks | 2026-10-02 | confirmed |
| Hook processes get `CLAUDE_PROJECT_DIR`; plugin hooks also get `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA` | hooks, plugins-reference | 2026-10-02 | confirmed. Paths use forward slashes on Windows |
| Plugin `hooks/hooks.json` wraps the event map in a top-level `"hooks"` key; optional `description` | plugins-reference | 2026-10-02 | confirmed |
| `plugin.json`: only `name` required; `version`, `description`, `author{name,email,url}`, `repository`, `license`, `keywords` | plugins-reference | 2026-10-02 | confirmed. `validate` warns on missing version/description/author; `--strict` turns warnings into failures |
| Plugin `settings.json` honours only `agent` and `subagentStatusLine` | plugins-reference | 2026-10-02 | confirmed |
| Plugin root `CLAUDE.md` not loaded (validate warns) | plugins-reference | 2026-10-02 | confirmed |
| Top-level `bin/` blocks claude.ai/Cowork install | plugins-reference | 2026-10-02 | confirmed |
| Plugin `workflows/` directory, namespaced `/<plugin>:<meta.name>` | plugins-reference, workflows | 2026-10-02 | confirmed |
| `version` pins users until it changes; a plugin loaded in place from a **local-directory** marketplace isn't pinned (edits apply at next session or `/reload-plugins`) | plugins-reference, plugin-marketplaces | 2026-10-02 | confirmed |
| `marketplace.json`: required `name`, `owner` (`name`), `plugins[]` with `name` + `source` (`"./plugins/harness"`); entry name must equal manifest name | plugin-marketplaces | 2026-10-02 | confirmed |
| `claude plugin marketplace add <local dir>` works; `claude plugin validate <dir>` | plugin-marketplaces | 2026-10-02 | confirmed |
| Marketplace auto-update is off by default; no `marketplace.json` field turns it on; user toggles it in `/plugin` → Marketplaces; `extraKnownMarketplaces.<name>.autoUpdate` exists | plugins/host-marketplace, settings-reference | 2026-10-02 | confirmed |
| `extraKnownMarketplaces` is an **object** keyed by name: `{ "<name>": { "source": {...}, "autoUpdate": bool } }` | settings-reference | 2026-10-02 | confirmed |
| `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` | env-vars | 2026-10-02 | confirmed |
| Subagent frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model` (sonnet/opus/haiku/fable/full id/inherit), `maxTurns`, `skills`, `memory`, `background`, `effort`, `isolation: worktree`, `color`, `initialPrompt`, `omitClaudeMd` | sub-agents | 2026-10-02 | confirmed |
| Plugin subagents **ignore** `hooks`, `mcpServers`, `permissionMode` | sub-agents | 2026-10-02 | confirmed |
| Subagent model precedence: per-call `model` > frontmatter `model` > `CLAUDE_CODE_SUBAGENT_MODEL` > main model (`..._FORCE=1` overrides) | sub-agents, env-vars | 2026-10-02 | confirmed. The planner's `model: opus` beats the floor's `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` |
| Skill frontmatter: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context: fork`, `agent`, `hooks`, `paths`, `shell` | skills | 2026-10-02 | confirmed |
| `disable-model-invocation: true` still lets the user run `/<skill>` | skills | 2026-10-02 | confirmed |
| Skill content substitutes `$ARGUMENTS`, `$0..`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}` (v2.1.196+), `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` (plugin skills only) | skills | 2026-10-02 | confirmed |
| Plugin skills are `/<plugin>:<skill>` | skills | 2026-10-02 | confirmed |
| `permissions.defaultMode` values: default, acceptEdits, plan, auto, dontAsk, bypassPermissions, manual; `auto` and `bypassPermissions` ignored from project/local settings | settings-reference | 2026-10-02 | confirmed |
| Permission path anchors: `~/path` = home, `//path` = filesystem root, `/path` = relative to the settings file's location; `Read(**/.env)` = any `.env` at or under the cwd (gitignore semantics) | permissions | 2026-10-02 | confirmed. On Windows, paths normalise to `/c/...` |
| `Bash(cmd *)` prefix rules; the space before a trailing `*` matters; `:*` is equivalent; rules match the command as written, so `git -C . push` doesn't match `Bash(git push *)` | permissions | 2026-10-02 | confirmed, which is why gate-bash exists |
| Read/Edit deny rules also cover `cat`/`head`/`tail`/`sed`/redirections in Bash, but not arbitrary subprocesses | settings-reference | 2026-10-02 | confirmed |
| `effortLevel`: low, medium, high, xhigh | settings-reference | 2026-10-02 | confirmed |
| `sandbox.enabled` works on macOS, Linux, WSL2. **On native Windows Claude Code runs commands unsandboxed** | sandboxing, settings-reference | 2026-10-02 | confirmed |
| `sandbox.network.allowedDomains`, `deniedDomains`, `strictAllowlist`, `tlsTerminate` (Boolean, user or managed), `sandbox.credentials.envVars`, `.files` | settings-reference | 2026-10-02 | keys exist; not used in the floor (SEC-4 says only after verification; left for a later floor change) |
| `autoMode` only from user, managed or `--settings`; `$defaults` keeps built-ins; `autoMode.classifyAllShell` | auto-mode-config | 2026-10-02 | confirmed |
| `/auto-mode-setup` needs Pro/Max/Team and v2.1.228+ (**v2.1.233+ on native Windows**) | auto-mode-config | 2026-10-02 | confirmed |
| `claude auto-mode defaults|config|critique|reset` | auto-mode-config, cli-reference | 2026-10-02 | confirmed |
| `/goal`: one per session; evaluator judges from the conversation; condition ≤ 4,000 chars; restored on resume; turn clause like "stop after 20 turns" | goal | 2026-10-02 | confirmed |
| Bare `/loop` uses `.claude/loop.md` (wins) then `~/.claude/loop.md` | scheduled-tasks | 2026-10-02 | confirmed |
| Routines: min interval 1 h; branches `claude/`; schedule off the hour; limits are **hourly** (100 scheduled runs/hour/account) and runs draw on subscription usage | routines | 2026-10-02 | confirmed; there is no daily cap of 5/15 in the docs |
| CLI: `-p`, `--output-format stream-json`, `--verbose`, `--max-turns`, `--plugin-dir`, `--settings`, `--setting-sources user,project,local`, `--permission-mode`, `--model`, `--max-budget-usd`, `--no-session-persistence`, `--bare`, `--restricted` | cli-reference | 2026-10-02 | confirmed (lab isolation flags chosen in phase 8) |
| `anthropics/claude-code-action@v1` inputs `claude_code_oauth_token`, `prompt`, `claude_args` | github-actions | 2026-10-02 | confirmed (review.yml written in phase 5) |
| `claude setup-token` | cli-reference | 2026-10-02 | confirmed |
| Hook `args` (exec form) introduced in **v2.1.139** | Claude Code CHANGELOG.md (github.com/anthropics/claude-code) | 2026-10-03 | confirmed. **Observed on 2.1.92**: `args` is ignored and bare `node` runs, which parses the hook's stdin JSON as a script, fails, and counts as a non-blocking error. Every harness hook is silently inert. Doctor fails DEV-1 below 2.1.139 |
| `marketplace.json` `metadata.description` (alternate location) | plugins/marketplace-reference | 2026-10-03 | confirmed. Top-level `description` is documented but rejected by 2.1.92 (`Unrecognized key`), so the manifest uses `metadata.description` |
| `claude plugin validate .` and `./plugins/harness` | local CLI 2.1.92 | 2026-10-03 | both `Validation passed` |
| `claude --plugin-dir ./plugins/harness --init-only` | cli-reference, local run | 2026-10-03 | plugin loads: hooks.json, 4 agents, 5 skills. This is the run that exposed the exec-form gap on 2.1.92 |
| Native installer `curl -fsSL https://claude.ai/install.sh \| bash` (CI validate job) | setup | 2026-10-03 | confirmed |
| `worktree.baseRef`: `"fresh"` (default) or `"head"`, any settings file; subagent worktrees follow it | settings-reference, worktrees | 2026-10-03 | confirmed; set to `"head"` in the template `.claude/settings.json` |
| Plugin `workflows/` dir, `/<plugin>:<name>` | plugins-reference, workflows | 2026-10-03 | `plugins/harness/workflows/.gitkeep` added; `claude plugin validate` passes with it |
| `SDKResultMessage` fields: `num_turns`, `total_cost_usd`, `usage`, `duration_ms`, `result`, `subtype`, `is_error` | agent-sdk/typescript | 2026-10-03 | confirmed; parsed by `evals/lib/stream.mjs` |

## How exec-form hooks are written
```json
{ "hooks": { "Stop": [ { "hooks": [
  { "type": "command", "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/stop-gate.mjs"], "timeout": 600 }
] } ] } }
```
The committed repo copy uses `"args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/stop-gate.mjs"]`.

## How skills reference scripts
The skill body says: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" --dry-run`. Without `--home`, scripts use `CLAUDE_CONFIG_DIR` or the real home. Claude Code substitutes the path when the skill loads. The variable isn't in the Bash tool's environment, so it must be written in the skill body. Skills don't use `` !`cmd` `` injection, because it runs through bash (Git Bash on Windows) and a non-zero exit aborts the skill.

## Dropped (couldn't verify)
| Item | Why | Date |
|---|---|---|
| `sandbox.network.*` / `sandbox.credentials.*` in the floor | keys exist, but the right allowlist per device isn't designed yet; SEC-4 makes them optional | 2026-10-02 |
| Plugin Stop hook exit-2 behaviour (anthropics/claude-code#10412) | can only be proven live: `doctor --live` | 2026-10-02 |

## Deviations from BUILD.md
- 2026-10-02 **Build order**: core first (1–4, 7), then 5–6, then 8–10, at Josep's request.
- 2026-10-02 **GATE-3 plugin-copy detection**: BUILD §3.2 detects the plugin copy by `CLAUDE_PLUGIN_ROOT` being set. Instead, the script compares its own path (`import.meta.url`) with `<project>/.claude/hooks/`. If it runs from anywhere other than the repo's committed copy and a committed copy exists, it defers. An env var could leak into the committed copy and make both stand down.
- 2026-10-02 **SEC-5 credential reads**: gate-bash denies `aws secretsmanager get-secret-value`, `aws ssm get-parameter(s)`, any `--with-decryption`, and `gcloud secrets versions access` **before** the read-only verb check. SPEC's read-only list (`get-*`) would otherwise let secret reads through. This is stricter than SPEC and compatible with it.
- 2026-10-02 **SEC-1 extra deny forms**: the floor also denies `Bash(git push -f *)`, `Bash(git push --force-with-lease *)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)`, `Read(**/.env)`, `Read(**/.env.*)`. Bash rules match the command as written, so gate-bash remains the real control for forms like `git -C x push --force`.
- 2026-10-02 **SEC-4 on Windows**: setup still writes `sandbox.enabled: true` (harmless; on native Windows it simply runs unsandboxed). Doctor reports SEC-4 as SKIP on win32 with "sandbox needs WSL2".
- 2026-10-02 **COST-1**: the floor sets `effortLevel: "high"` as a scalar, so an existing user value is kept.
- 2026-10-02 **format-changed (GATE-4)**: runs the project's own `node_modules/prettier` bin with `node` instead of `npx --no-install prettier`. On Windows `npx` is a `.cmd` shim, which needs a shell, and BUILD rule 3 forbids one. It also skips npx's startup cost. Extensions: ts, tsx, js, jsx, mjs, cjs, json, css, md; `ruff format` for py.
- 2026-10-02 **session-state (CTX-5)**: prints nothing unless `progress.md` or `feature_list.json` exists, so repos that aren't harnessed don't get git log noise at every session start. The progress tail is 20 lines; up to 10 open features are listed by id.
- 2026-10-02 **gate-bash (SEC-5)**: also denies `terraform destroy` and `tofu apply|destroy`. It re-checks scripts passed to `bash -c`, `pwsh -Command`, `cmd /c` and `eval`, and strips `VAR=x`, `sudo` and `env` prefixes. A `+refspec` push counts as a force push. The download-to-shell check ignores quoted text (`echo "curl x | sh"` passes). gcloud: a command is read-only when any positional is `list`, `describe`, `ls`, `info`, `version`, `help`, `get-*`, `describe-*` or `list-*`; anything else is denied, per SPEC.
- 2026-10-02 **test runner**: `npm test` runs `node test/run.mjs`, which lists `test/*.test.mjs` and passes the files to `node --test`. `node --test test/` and glob arguments behave differently across Node 20/22+ and Windows shells.
- 2026-10-03 **setup.mjs**: `harness-device.json` is rewritten only when the OS or harness version changes, so a second run is byte-identical (DEV-3). Backups hold only the files a run changes, plus a `manifest.json` recording which files existed. `--undo` restores those, deletes the ones setup created, and renames the backup to `undone-<ts>` so the next `--undo` goes one step further back. An invalid `settings.json` aborts with nothing changed. `--dry-run` doesn't even create `~/.claude`. The CRLF line endings of an existing `CLAUDE.md` are kept.
- 2026-10-03 **doctor.mjs**:
  - Rows beyond BUILD §3.2: `DEV-1 gh auth`, `DEV-1 claude` (SHOULD ≥ 2.1.233), `SEC-6`, `COST-1`, `COST-2`, `AGT-5`, `NIGHT-3`. The committed layer row covers §5's "committed stop-gate.mjs and reviewer.md".
  - DEV-2 reads `~/.claude/plugins/installed_plugins.json` plus `enabledPlugins` instead of running `claude plugin list`, so doctor never starts the real `claude` beyond `--version`. That file's format isn't documented, so it's best effort.
  - The gate proof copies the repo without `.git`/`node_modules`/build output and swaps the check for `node -e "process.exit(1)"`, then `process.exit(0)`. It proves the gate mechanics, not that the repo's real checks pass.
  - REV-2 reads `gh api repos/<o>/<r>/rules/branches/<default>` and reports WARN, not FAIL, when code-owner review is off (see the REV-2 proposal).
  - `--live` runs `claude -p` once on Haiku with `--plugin-dir`, `--setting-sources project` and `--max-turns 3` in a temp repo, using a check that counts its runs. 2+ runs means the plugin Stop hook blocked and the turn continued. 1 means it halted (claude-code#10412). Not yet run for real.
  - `--claude-bin` (or `HARNESS_CLAUDE_BIN`) lets tests use `test/fixtures/claude-version-stub.mjs`.
- 2026-10-03 **Brief commits vs the Stop gate (AGT-2 vs GATE-1)**: `/harness:brief` commits red tests on purpose, and the gate would then block that session and push it into implementing. The gate now also skips when the tree is clean and HEAD is a `brief(<id>)` commit whose files are only `docs/briefs/*.md`, `feature_list.json` and test paths (`lib.mjs` `headIsBriefCommit`, `isTestPath`). Any later edit or commit re-arms it. A brief commit that touches anything else is gated. This is tested, and a mutation check confirms the test catches a weakened filter.
- 2026-10-03 **New scripts**:
  - `check.mjs` runs the harness.json checks, stops at the first failure or runs everything with `--all`, and prints the tail on failure. CI, verify-done and the agents use it.
  - `test-diff.mjs <base>` lists test files changed since a commit, including untracked ones, and exits 1 if any. It turns LOOP-2's "no test file modified" and the reviewer's tamper check into an executed command.
  - Both join the committed template layer in phase 5.
- 2026-10-03 **Implementer worktrees**: `isolation: worktree` branches from the default branch unless `worktree.baseRef` is `"head"` (any settings file, verified in settings-reference and worktrees docs). Phase 5 puts `"worktree": {"baseRef": "head"}` in the template `.claude/settings.json` so the committed brief and red tests are in the worktree. As a fallback, the implementer merges the named feature branch itself.
- 2026-10-03 **Skill invocation**: `brief` and `review-loop` are also `disable-model-invocation: true`, alongside setup, adopt and new-app, because they create branches and commits or post on PRs. `doctor` and `verify-done` stay model-invocable; they are read-only apart from running checks.
- 2026-10-03 **Reviewer** has `disallowedTools: Edit, Write, NotebookEdit` as well as the AGT-1 tool list. Bash stays because it runs the checks itself. Read-only use of Bash is an instruction, not a boundary, because plugin agents ignore `permissionMode` and `hooks`.
- 2026-10-03 **The /goal printed by brief** names `check.mjs --all` and `test-diff.mjs <BASE>` as executed proof, plus reviewer PASS and "Stop after N turns" (LOOP-2). It tells the session to delegate to `harness:implementer`, merge its worktree branch `--ff-only`, then ask `harness:reviewer`.
- 2026-10-03 **CI (DIST-4)**:
  - `.github/workflows/test.yml` runs `npm test` on ubuntu, macos and windows with Node 22, plus ubuntu with Node 20, the DEV-1 floor.
  - A separate ubuntu job installs Claude Code with the native installer and runs `claude plugin validate` on the marketplace and the plugin. No auth is needed and no tokens are spent.
  - `npm test` itself never runs `claude`; `test/marketplace.test.mjs` checks the manifests structurally.
- 2026-10-03 **Dogfood**: `.claude/harness.json` = `{"version":1,"check":["npm test"]}`. Once the plugin is installed, the Stop gate runs the suite (about 60 s on Windows) when this repo has uncommitted work.
- 2026-10-03 **Templates (phase 5)**:
  - `tools/sync-templates.mjs` (`npm run sync-templates`, `--check`) generates `templates/repo/.claude/hooks/{lib,stop-gate,format-changed,check,test-diff}.mjs` and `.claude/agents/reviewer.md`. Each script copy gets a one-line "GENERATED from …" header. `test-diff.mjs` is an addition to BUILD's list. `test/templates.test.mjs` fails on drift.
  - The template `.claude/settings.json` wires the committed Stop gate and formatter in exec form with `${CLAUDE_PROJECT_DIR}`, and sets `worktree.baseRef: "head"`.
  - CI: the `ci.yml` job id and name are `ci`, plus an `e2e` job that runs `check.mjs --e2e`, a mode added for the optional `"e2e"` command. Install steps are conditional on lockfile type (pnpm, npm, yarn, python, go), so adopt can reuse it across stacks.
  - `review.yml` job `review` uses `anthropics/claude-code-action@v1` with `claude_code_oauth_token`, a plain-text prompt pointing at `.claude/agents/reviewer.md`, and `--allowedTools` for the inline-comment MCP tool, `gh pr comment/diff/view`, `git diff/log` and `test-diff.mjs`. It hasn't been run against a real PR yet.
- 2026-10-03 **App template (BUILD §3.4)**:
  - Versions resolved from npm on 2026-10-03 and pinned exactly: next 16.3.8, react 19.3.0, drizzle-orm 0.45.3, drizzle-kit 0.31.11, better-sqlite3 13.0.3, vitest 5.0.3, @playwright/test 1.63.0, eslint 9.39.5, eslint-config-next 16.3.8, prettier 3.9.9. Lockfile generated with pnpm 10.28.1.
  - **Deviations from "latest"**: TypeScript **5.9.3**, not 7.0.2 (the native Go port; Next.js type-checking expects the 5.x API). ESLint **9.39.5**, not 10 (eslint-plugin-react 7.37 peers end at 9.7). `@types/node` 22 to match CI.
  - **better-sqlite3 gotcha (found on this PC)**: 13.x bundles N-API prebuilds for win32, darwin and linux in the package. Listing it in `pnpm.onlyBuiltDependencies` makes pnpm run the implicit `node-gyp rebuild` (the package has a `binding.gyp`), which fails without Visual Studio. So it goes in `ignoredBuiltDependencies`. Its `engines` is Node ≥ 22, so the app requires Node ≥ 22 even though the harness itself needs only Node 20 (DEV-1).
  - The app ships its own stack-specific `CLAUDE.md` (33 lines). `new-app` uses it instead of `CLAUDE.skeleton.md`, which stays as adopt's starting point when a repo has no CLAUDE.md. `gitignore` is stored without the dot and renamed by new-app; `.gitattributes` forces LF.
  - **Proven**: a generated app installs with `--frozen-lockfile` and passes typecheck, lint and unit tests (warm: 2.0 s, 4.1 s, 0.9 s; first cold lint on Windows took 90 s). `doctor --repo` on it passes CTX-2/3/4/7, NIGHT-3, REV-1, REV-3 and GATE-1 (proven with the committed gate). `HARNESS_E2E=1` test plus a CI `template-app` job.
  - Playwright e2e was not run locally: browser download goes to the user profile, outside allowed write locations. CI's e2e job in generated apps covers it.
- 2026-10-03 **adopt.mjs (phase 6)**:
  - Template files are classed as *managed* or *seeded*. Managed: the committed hooks, `reviewer.md`, `ci.yml`, `review.yml`, `defect.yml`. A re-run compares these with the template and reports DIFFERS with a line diff (ADOPT-4). Seeded: `AGENTS.md`, `feature_list.json`, `progress.md`, `NIGHT-LOG.md`, the briefs dir. These are added when missing and never compared, because they are meant to diverge.
  - `--update <paths|all>` takes the template version of DIFFERS files, once the skill has asked.
  - `_draft: true` marks the whole drafted `harness.json`. The skill removes it once the checks pass on today's code.
  - Detection:
    - package.json: typecheck/type-check/check-types/tsc, lint, test:unit, else test. Package manager from the lockfile; the npm-init "no test specified" placeholder is skipped.
    - pyproject.toml / requirements: ruff check, mypy, pytest -q.
    - go.mod: go vet, go test. Cargo.toml: cargo fmt --check, cargo test.
  - CODEOWNERS lines are appended by pattern with `@<owner>`; without `--owner` they keep `@OWNER` and a note asks to replace it.
  - Settings merge adds the Stop/formatter groups unless that event already references the script, and sets `worktree.baseRef` only if unset.
  - adopt never commits: the skill commits after making the checks real. Dry-run doesn't create the branch.
- 2026-10-03 **new-app.mjs**:
  - Copies the app template, then the repo template; the app's own files win (its `CLAUDE.md` beats the skeleton). Renames `gitignore` and `CODEOWNERS.fragment`, and fails if any `APP_NAME` or `@OWNER` remains.
  - The owner comes from `--owner`, else `gh api user`. `--public` exists because private repos on GitHub Free can't use rulesets (REV-2); the skill asks.
  - It skips `gh repo create` when the gate proof fails. It doesn't run `pnpm install`; the skill does.
- 2026-10-03 **prove.mjs**: GATE-6 proof extracted from doctor.mjs so doctor and new-app share it. It reports which gate was proven: committed or plugin.
- 2026-10-03 **Mutation check of phase 6**: removing adopt's dirty-tree refusal and letting it overwrite an existing CLAUDE.md turned 3 adopt tests red.
- 2026-10-03 **Lab (phase 8)**:
  - `evals/run.mjs` isolation decision (BUILD §3.5 asked to verify and record): `--setting-sources project,local`, so user settings, user plugins and user hooks don't load. The fixture's own `.claude/` and the variant's `--plugin-dir` do.
  - Also `--strict-mcp-config`, `--no-session-persistence` and `--permission-mode auto` (overridable). It does **not** use `--settings` with a minimal file: a permission-mode flag is enough, and auto mode via `--settings` would also pull in classifier config.
  - Not `--bare`: it skips plugin and hook discovery, and its interaction with `--plugin-dir` isn't documented.
  - Not `CLAUDE_CONFIG_DIR=<temp>`: that would also hide the login.
  - **Known gap**: `~/.claude/CLAUDE.md` (memory) may still load. Documented in evals/README.
- 2026-10-03 **Task fixtures**:
  - Each task has `verify/` (hidden, referenced as `{task}/verify/...`) and `solution/` (a reference overlay), which BUILD didn't list.
  - `solution/` proves the verifier is satisfiable, not just red. Tests run every task both ways, and the stub's `pass` scenario copies it.
  - Fixtures are dependency-free so eval runs need no network: node:test; the Python task uses stdlib `unittest` and finds `python3`/`python`/`py`.
  - `add-endpoint` therefore uses Next-style route handlers without Next.js itself.
  - `refactor-split-file`'s 611-line module and `golden.json` came from a one-off generator; the outputs are committed.
- 2026-10-03 **Result fields** checked against the Agent SDK `SDKResultMessage` type: `num_turns`, `total_cost_usd`, `usage`, `duration_ms`, `result`, `subtype`, `is_error`. Real-run parsing is still unproven until the first real run.
- 2026-10-03 **Mutation check of phase 8**: disabling tamper detection turned 2 lab tests red; making `claimsDone` always false turned 4 red.
- 2026-10-03 **Experiment 001 (phase 9)**:
  - The variant is **generated** by `experiments/001-stop-gate/make-variant.mjs` (gitignored `variant/`, with `VARIANT.json` recording the baseline version and commit), not committed as a copy. This guarantees the one-change rule against whatever baseline is run, and avoids a second copy of the plugin drifting. A test proves the only differing file is `hooks/hooks.json`, minus `Stop`.
  - The cost estimate is given in tokens and wall clock, with a pilot that measures `costUsd`, rather than a dollar figure from memory.
  - The hypothesis is judged excluding `premature-done-trap`, which the gate can't see by design (P6); that task is kept as a control.
- 2026-10-03 **plugin.json created in phase 3** (BUILD puts it in phase 7) because setup records the plugin version.
- 2026-10-03 **Floor deny `Read(**/.env.*)`** also blocks `.env.example`. It's kept because SEC-1 requires it; Claude can still read examples if the user pastes them or renames them, e.g. to `env.example`.
- 2026-10-03 **Mutation check of phase 3**: making the floor merge overwrite existing scalars turned the SEC-2 setup test red.
- 2026-10-02 **Mutation check of phase 2 tests**: making stop-gate exit 0 instead of 2, and gate-bash never report a force push, turned 17 of 71 tests red. Restoring them brought it back to 71/71.

## Proposed spec changes
- 2026-10-02 **SEC-5**: add "credential reads (`get-secret-value`, `ssm get-parameter*`, `--with-decryption`, `gcloud secrets versions access`) are denied before verb classification". Consider sending non-read-only `aws`/`gcloud` verbs to `ask` instead of `deny`: the workshop's gate never denies a write outright, it asks a human. An `ask` from a hook forces a real prompt even in auto mode.
- 2026-10-02 **REV-2**: "code-owner review required" can't be satisfied by a solo developer, because agents push and open PRs as the same GitHub user, and GitHub refuses self-approval. Proposal: require PR + status checks `ci` and `review`; keep CODEOWNERS (REV-3) so the owner is auto-requested; keep REV-4 (agents never merge); optionally allow admin bypass.
- 2026-10-03 **GATE-2**: add "or HEAD is a `brief(<id>)` commit containing only the brief, the feature_list entry and test files, with a clean tree". Without it, AGT-2's red tests make the brief session unstoppable.
- 2026-10-03 **LOOP-2**: name `test-diff.mjs <brief-sha>` as the executed form of "no test file modified".
- 2026-10-02 **SEC-4**: say "on macOS, Linux and WSL2; native Windows has no sandbox".
- 2026-10-02 **DEV-1**: add a Claude Code version floor: MUST ≥ **2.1.139** (exec-form hooks; below it every hook is inert, observed 2026-10-03), SHOULD ≥ **2.1.233** (`/auto-mode-setup` on native Windows). Doctor implements both.
- 2026-10-02 **NIGHT-4 / §8**: routines have hourly limits (100 scheduled runs per hour per account) and draw on subscription usage; drop the "daily routine cap" wording.
- 2026-10-02 **§8**: move `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`, sandbox network/credential keys, `tlsTerminate` (a Boolean under `sandbox.network`, not the object the deck shows) and the Notification `message` field into "verified".
- 2026-10-02 **DEV-4**: `extraKnownMarketplaces.<name>.autoUpdate: true` could make auto-update part of the floor instead of a manual `/plugin` step. Not done yet, because the marketplace source differs per device (local directory on the dev box, GitHub elsewhere).

## Open questions for Josep
- 2026-10-02 Claude Code on the Windows PC was **2.1.92** at kickoff. Run `claude update` before installing the plugin: hooks need ≥ 2.1.139, and `/auto-mode-setup` on Windows needs ≥ 2.1.233.
- 2026-10-02 Does the Linux device run Claude Code natively or under WSL2? The sandbox works on both; it only changes the device notes.
- 2026-10-03 REV-2 code-owner review: accept the proposal (require PR + `ci` + `review`; CODEOWNERS only requests your review), or add an admin bypass to the ruleset?
- 2026-10-03 Accept the proposed SPEC changes above (GATE-2 brief exemption, SEC-5 credential reads, SEC-4 platforms, DEV-1 version floors, NIGHT-4 hourly limits, LOOP-2 `test-diff.mjs`)? SPEC.md is untouched until you edit it.

## Not yet proven live (needs a real session, real GitHub or real tokens)
- Plugin hooks firing in a real Claude Code ≥ 2.1.139 session, and `doctor --live` (the plugin Stop-hook bug, claude-code#10412).
- The Windows toast from `notify.mjs`.
- `review.yml` with `anthropics/claude-code-action@v1` on a real PR (needs `CLAUDE_CODE_OAUTH_TOKEN`).
- `gh repo create` in `new-app.mjs`, and `/harness:adopt` opening a PR.
- The skills' judgement halves (brief, verify-done, review-loop, adopt, new-app) driven by a model.
- `evals/run.mjs` against the real `claude` binary (parsing of real stream-json), and experiment 001.
- Playwright e2e of the app template; CI's `e2e` job covers it in generated apps.

## Requirement status (2026-10-03)
Implemented means the code or file exists and the named test covers it. Partial means guidance or process only, or a part that's still the human's.

| ID | Status | Covered by |
|---|---|---|
| DEV-1 | implemented | doctor.test (tools, version floor 2.1.139 MUST / 2.1.233 SHOULD) |
| DEV-2 | implemented | doctor.test (installed + enabled) |
| DEV-3 | implemented | setup.test (merge, second run byte-identical, real settings shape survives) |
| DEV-4 | partial | manual `/plugin` → Marketplaces step in device-setup.md; not checked by doctor |
| DEV-5 | implemented | CI matrix (ubuntu, macos, windows; Node 20 and 22); hooks.test (exec form, built-ins only) |
| DEV-6 | implemented | setup.test (device record), doctor.test |
| SEC-1 | implemented | setup.test, doctor.test |
| SEC-2 | implemented | setup.test (plan kept and logged), doctor.test |
| SEC-3 | partial | doctor WARN until `autoMode.environment` exists; running `/auto-mode-setup` is the user's |
| SEC-4 | implemented | setup.test (sandbox.enabled), doctor.test (SKIP on win32) |
| SEC-5 | implemented | gate-bash.test (BUILD table + 40 forms, credential reads) |
| SEC-6 | implemented | setup.test (no bypass), doctor.test |
| SEC-7 | partial | night-shift.md (connectors removed, one repo); not enforceable from here |
| CTX-1 | implemented | setup.test (markers, CRLF, text outside kept) |
| CTX-2 | implemented | doctor.test, templates.test (≤ 45 lines); adopt skill trims |
| CTX-3 | implemented | doctor.test, adopt.test, agents-skills.test (check.mjs) |
| CTX-4 | implemented | templates.test, doctor.test; adopt skill seeds entries |
| CTX-5 | implemented | hooks.test (session-state) |
| CTX-6 | partial | convention only; nothing generates `.claude/rules/` |
| CTX-7 | implemented | templates.test, doctor.test |
| GATE-1 | implemented | stop-gate.test |
| GATE-2 | implemented | stop-gate.test, agents-skills.test (brief-commit exemption) |
| GATE-3 | implemented | stop-gate.test (including the leaked env var case), templates.test |
| GATE-4 | implemented | hooks.test (format-changed) |
| GATE-5 | implemented | every hook test asserts exit 2 to block, 0 otherwise |
| GATE-6 | implemented | doctor.test (proof, broken gate caught), new-app.test |
| GATE-7 | implemented | the floor never sets `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (setup.test checks the floor's keys) |
| AGT-1 | implemented | agents-skills.test (tools, models, worktree, read-only reviewer) |
| AGT-2 | implemented | agents-skills.test (skill structure, /goal contents); unproven live |
| AGT-3 | implemented | agents-skills.test (check.mjs `--all`); skill unproven live |
| AGT-4 | partial | `plugins/harness/workflows/` exists; no saved workflows yet |
| AGT-5 | implemented | doctor.test (agent teams not in the floor) |
| LOOP-1 | partial | night-shift.md preconditions; doctor marks a repo harnessed |
| LOOP-2 | implemented | agents-skills.test (/goal names check.mjs, test-diff.mjs, turn cap) |
| LOOP-3 | partial | daily-workflow.md guidance |
| LOOP-4 | partial | /goal template and brief budget; not enforced for arbitrary loops |
| LOOP-5 | partial | daily-workflow.md, night-shift.md |
| LOOP-6 | implemented | setup.test (loop.md), doctor.test |
| REV-1 | implemented | templates.test (`ci`, `review`); review.yml unproven live |
| REV-2 | partial | doctor reads branch rules via `gh api`; ruleset is manual; code-owner proposal open |
| REV-3 | implemented | templates.test, adopt.test, new-app.test |
| REV-4 | implemented | floor denies `gh pr merge` (setup.test); agents and skills never merge |
| REV-5 | implemented | agents-skills.test (skill present, user-invoked); unproven live |
| NIGHT-1 | implemented | templates.test (defect form) |
| NIGHT-2 | partial | prompt in SPEC §6.7 and night-shift.md; the routine is created by the user |
| NIGHT-3 | implemented | doctor.test (NIGHT-3 row), templates.test (committed layer runs without the plugin) |
| NIGHT-4 | partial | night-shift.md (off the hour; hourly limits) |
| REC-1 | implemented | hooks.test (log-bash) |
| REC-2 | partial | personal rules, implementer agent, CLAUDE.md skeleton |
| REC-3 | implemented | brief skill writes `docs/briefs/<id>.md`; templates ship `docs/briefs/` |
| COST-1 | implemented | setup.test (effortLevel high), doctor.test |
| COST-2 | implemented | floor env + agent `model` fields (agents-skills.test) |
| COST-3 | partial | daily-workflow.md |
| DIST-1 | implemented | CI validate job; marketplace.test |
| DIST-2 | implemented | marketplace.test (CHANGELOG has the version) |
| DIST-3 | implemented | doctor.test (DIST-3 WARN) |
| DIST-4 | implemented | `.github/workflows/test.yml`; marketplace.test |
| NEW-1 | implemented | new-app.test (`--no-remote`, placeholders, gate proven, doctor PASS); `gh repo create` unproven live |
| ADOPT-1 | implemented | adopt.test (dirty refused, branch, merges, CLAUDE.md untouched) |
| ADOPT-2 | implemented | adopt.test (node, python, go, rust drafts); "make them pass" is the skill's job |
| ADOPT-3 | partial | adopt skill (trim with reasons, seed features, prove gate, PR); not automated |
| ADOPT-4 | implemented | adopt.test (DIFFERS with diff, `--update`) |
| LAB-1 | implemented | experiments.test (001 planned) |
| LAB-2 | implemented | lab.test (fresh copy, isolation flags, turn cap) |
| LAB-3 | implemented | lab.test (every field; compare table and deltas) |
| LAB-4 | implemented | lab.test (stub scenarios, no tokens) |
| LAB-5 | implemented | lab.test (raw gitignored, summaries not) |
| LAB-6 | partial | 001 prepared with ≥ 3 runs and a decision rule; no runs yet |
| DOC-1 | implemented | docs.test (README links every guide; links, skills, scripts and npm scripts in docs exist) |
| DOC-2 | implemented | docs.test (records 0001–0010 indexed with template sections) |
| DOC-3 | partial | claude-code-primitives.md re-verified with check dates; other knowledge files cite the workshop decks |
| DOC-4 | implemented | this file |
| DOC-5 | implemented | CHANGELOG.md 1.0.0 |
