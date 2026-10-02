# Claude Code primitives: reference

What the harness is built from. Facts were checked against code.claude.com/docs between 2026-09-28 and 2026-10-02. Features change quickly, so re-check before relying on a detail and update `NOTES.md` when something changes. Version floors are given where the docs state them.

## Permissions and auto mode

- **Modes:** `default` (manual), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. Cycle with Shift+Tab.
- **Rules:** `permissions.allow`, `ask` and `deny` use the syntax `Tool(pattern)`, e.g. `Bash(git push *)` or `Read(**/.env)`. Deny is evaluated before everything else and can't be overridden by hooks or the classifier. An explicit `ask` rule forces a prompt even in auto mode.
- **Auto mode:** a classifier reviews each tool call and blocks irreversible, destructive or outbound actions.
  - `defaultMode: "auto"` and the `autoMode` block are read only from **user settings, managed settings or `--settings`**, never from project files, so a repo can't grant itself autonomy.
  - `autoMode.environment` describes trusted infrastructure in prose. Keep `"$defaults"` in each list, because omitting it replaces the built-in rules.
  - `/auto-mode-setup` drafts the entries (needs v2.1.228+ and a Pro, Max or Team plan).
  - Inspect with `claude auto-mode defaults`, `config` and `critique`; start over with `reset`.
  - `autoMode.classifyAllShell: true` routes every shell command through the classifier.
  - Denials are listed in `/permissions` → Recently denied.
- **Sandbox:** `/sandbox`, and `sandbox.enabled`. Bash and its children run with only the working directory writable and network access through an allowlist proxy. Sub-keys for the network and credentials weren't verified here.

## Hooks

- **Events:**
  - session: `SessionStart` (matchers startup, resume, clear, compact, fork), `SessionEnd`
  - prompts: `UserPromptSubmit`, `UserPromptExpansion`
  - tool calls: `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`
  - turn end: `Stop`, `StopFailure`
  - subagents and tasks: `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `TeammateIdle`
  - context: `InstructionsLoaded`, `PreCompact`, `PostCompact`
  - files and config: `ConfigChange`, `CwdChanged`, `FileChanged`, `DirectoryAdded`, `WorktreeCreate`, `WorktreeRemove`
  - other: `Notification`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`, `MessageDisplay`, `Setup`
- **Handler types:**
  - `command` (shell form, or **exec form** with an `args` array that spawns without a shell)
  - `http`
  - `mcp_tool`
  - `prompt`: a single LLM call returning `{"ok": bool, "reason": ...}`
  - `agent`: experimental; multi-turn with tools
- **Exit codes:** 0 means no objection (stdout from SessionStart and UserPromptSubmit becomes context). **2 blocks**, with stderr fed back. Any other code is a non-blocking error.
- **Structured output:**
  - PreToolUse: `hookSpecificOutput.permissionDecision` = allow, deny, ask or defer.
  - Stop and PostToolUse: `decision: "block"`.
  - `additionalContext` goes inside `hookSpecificOutput`.
- **Matchers** are regex on the tool name, e.g. `Edit|Write` or `mcp__github__.*`. The `if` field filters with permission-rule syntax, e.g. `"if": "Bash(git *)"`, but only on tool events and only best-effort. Use permissions for hard rules.
- **All matching hooks run in parallel.** For PreToolUse the most restrictive decision wins: deny, then defer, then ask, then allow.
- **Stop hook cap:** after 8 consecutive blocks without progress, Claude Code overrides the hook. The input field `stop_hook_active` tells the hook a continuation is already in progress.
- **Timeouts:** command, http and mcp_tool 10 min; prompt 30 s; agent 60 s; `SessionEnd` 1.5 s total.
- **Environment:** `CLAUDE_PROJECT_DIR` is available. `CLAUDE_ENV_FILE` lets SessionStart or CwdChanged persist env vars.
- **Platform shells:** shell-form hooks run with `sh -c` on macOS and Linux, and Git Bash (or PowerShell if Git Bash is absent) on Windows. Exec form avoids the shell entirely.
- Browse configured hooks with `/hooks`; it's read-only.

## Memory and context

- CLAUDE.md files at the managed, user (`~/.claude/CLAUDE.md`), project and local levels are all loaded additively. Subdirectory CLAUDE.md files load lazily on first read there. `.claude/rules/*.md` with a `paths:` field load when a matching file is touched.
- Skill names and descriptions load at session start; bodies load on demand. MCP tool definitions are deferred until searched.
- On compaction the conversation is summarised and the project contract re-injected. On-demand material returns only when touched again. A SessionStart hook with the `compact` matcher can re-inject state.

## Skills, subagents, plugins

- **Skills** live at `~/.claude/skills/<name>/SKILL.md` or `.claude/skills/`. Frontmatter includes `name`, `description`, `disable-model-invocation`, `allowed-tools`, `model`, `context: fork`, and hooks. Bundled skills include `/batch`, `/verify`, `/deep-research` (a workflow) and `/workflow-authoring`.
- **Subagents** live at `~/.claude/agents/*.md` or `.claude/agents/`. Frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`, `effort`, `background`, `isolation: worktree`. Each runs on its own context and returns a summary. `CLAUDE_CODE_SUBAGENT_MODEL` sets the default model.
- **Plugins** bundle skills, agents, hooks (`hooks/hooks.json`), commands, MCP and LSP servers, output styles, **workflows** and monitors.
  - Components are namespaced as `plugin:name`.
  - `${CLAUDE_PLUGIN_ROOT}` is the install path and changes on update; `${CLAUDE_PLUGIN_DATA}` is persistent across updates.
  - **A plugin's `settings.json` honours only `agent` and `subagentStatusLine`**: plugins can't set permissions, env or sandbox.
  - A `CLAUDE.md` at the plugin root is **not** loaded.
  - No top-level `bin/` if you want claude.ai org sync.
  - Validate with `claude plugin validate <dir>`. Try one locally with `claude --plugin-dir <dir>`.
- **Marketplaces** are a repo with `.claude-plugin/marketplace.json` (`name`, `owner`, `plugins[]` with `source` such as `"./plugins/x"`).
  - Add with `/plugin marketplace add owner/repo`; install with `/plugin install <plugin>@<marketplace>`.
  - Private repos use the machine's git credentials, non-interactively (`gh auth login` plus `gh auth setup-git`).
  - Auto-update is **off by default** per marketplace; enable it in `/plugin` → Marketplaces. Otherwise use `/plugin marketplace update <name>`.
  - Users receive a new copy only when `version` changes. Omit `version` to track commits.

## Autonomy

- **`/goal <condition>`** (v2.1.139+): a session-scoped, prompt-based Stop hook.
  - After each turn the small fast model (Haiku default) judges the condition from the transcript only; it never runs commands.
  - The condition can be up to 4,000 characters. `/goal` shows status (turns, tokens, the last reason); `/goal clear` stops it.
  - The goal is restored on `--resume` or `--continue`. Works with `-p`.
  - Needs workspace trust and hooks enabled.
- **`/loop`** is session-scoped scheduling.
  - `/loop 5m <prompt>` (units s, m, h, d) runs on cron. `/loop <prompt>` is self-paced (1 min to 1 h).
  - A bare `/loop` uses `.claude/loop.md`, then `~/.claude/loop.md`, then the built-in maintenance prompt.
  - Recurring tasks expire after 7 days; a session holds up to 50 tasks; jitter is up to 30 min. Esc stops a self-paced loop.
  - Runs only while the session is open and idle; backgrounding carries it over.
  - The Monitor tool streams events instead of polling.
- **Scheduling options:**
  - **cloud routines**: no machine needed; fresh clone; minimum interval 1 h; no prompts
  - **desktop scheduled tasks**: your machine; local files; minimum interval 1 min
  - **`/loop`**: session-scoped
- **Background sessions and agent view** (research preview):
  - `claude agents` is the dispatch and monitor screen. `claude --bg "<prompt>"` and `--name` start a session in the background; `/bg` or ← on an empty prompt sends the current one there; `/fork` copies the conversation into a new background session.
  - `claude attach|logs|stop|respawn|rm <id>` manage a session; `claude agents --json --all` gives its state as JSON.
  - Each session moves into its own worktree under `.claude/worktrees/` before editing, commits and pushes its branch, can open a draft PR, never pushes to main.
  - Each session draws on quota independently.
- **Routines** (research preview): saved prompt plus repos, environment, connectors and triggers.
  - Triggers: schedule (hourly minimum), API (`/fire` with a bearer token), GitHub events (pull_request, release).
  - Create with `/schedule` or at claude.ai/code/routines. They run as you, push to `claude/` branches, and include all connectors by default (remove the ones you don't need). A green run status means only that the run exited cleanly.
  - Daily run cap per account; Anthropic's launch post said Pro 5 and Max 15. Check the live counter.
- **Dynamic workflows:** JavaScript orchestrating subagents.
  - Trigger with the `ultracode` keyword or "use a workflow", or set `/effort ultracode` for the whole session.
  - Watch and save runs in `/workflows`: press `s` to save to `.claude/workflows/` or `~/.claude/workflows/`, and the run becomes `/<name>`.
  - The script API is `agent()`, `pipeline()`, `parallel()`, `phase()`, `log()` and `args`, with an optional `schema` for JSON output.
  - Limits: 16 concurrent agents, 1,000 per run, `Date.now()`/`Math.random()` throw.
  - Size guideline defaults to small on Pro. On Pro, enable workflows in `/config`.
- **Agent teams** (experimental): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
  - A lead plus teammates with a shared task list and messaging. Start with 3–5 teammates.
  - Quality gates via the `TeammateIdle`, `TaskCreated` and `TaskCompleted` hooks.
  - Limits: no resume of in-process teammates, one team per session, no nesting.

## Headless and CI

- `claude -p "<prompt>"` runs non-interactively. Useful flags: `--output-format stream-json --verbose`, `--max-turns`, `--plugin-dir`, `--settings`, `--setting-sources`, `--permission-mode`. The final result message carries `num_turns`, usage and cost fields. Verify the field names before parsing them.
- **GitHub:** `anthropics/claude-code-action`. Create a subscription token with `claude setup-token` and store it with `gh secret set CLAUDE_CODE_OAUTH_TOKEN`.
