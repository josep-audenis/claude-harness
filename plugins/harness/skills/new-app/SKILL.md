---
name: new-app
description: Create a new harnessed app from the plugin's templates (Next.js + TypeScript, pnpm, Drizzle + SQLite, Vitest, Playwright, plus the committed harness layer), prove its Stop gate, create the GitHub repo and push, then list the manual steps. Use when the user runs /harness:new-app <name>.
disable-model-invocation: true
argument-hint: "<app-name> [--public]"
---

# /harness:new-app

Arguments: `$ARGUMENTS` (the first word is the app name, kebab-case)

1. **Check first.**
   - The name is kebab-case, and `./<name>` doesn't exist in the current directory.
   - Get the GitHub owner with `gh api user --jq .login`.
   - Ask the user: **private or public repo?** Private is the default (NEW-1), but on GitHub Free a private repo can't have rulesets, so REV-2 branch protection would be unavailable. Public makes REV-2 possible.
2. **Create:**
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/new-app.mjs" <name> --dir . --owner <login> [--public]`
   - Paste the output.
   - The script copies the templates, fills in the name and owner, makes the first commit, proves the gate, runs `gh repo create` and pushes.
   - If the gate proof fails, it skips the remote: stop and report.
3. **Install and check:**
   - Inside the app, run `pnpm install`, then `node .claude/hooks/check.mjs --all`. Paste the result.
   - The app needs Node 22 or later.
   - If install fails on better-sqlite3, see the app's CLAUDE.md gotcha: never add it to `onlyBuiltDependencies`.
4. **Manual steps.** Give the user the "Remaining steps" list from the output, in order:
   - the review token: `claude setup-token`, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo <owner>/<name>`;
   - the ruleset on `main`: require a PR and the status checks `ci` and `review`.
5. Suggest the first feature: `cd <name>`, start Claude Code there, and run `/harness:brief <one-line idea>`.

Never push to an existing repo and never touch files outside `./<name>`.
