# Start a new app

## 1. Create it

In Claude Code, from the folder where your projects live:

```
/harness:new-app my-app
```

The skill asks whether the GitHub repo should be private (the default) or public. **On GitHub Free, private repos can't have rulesets**, so branch protection (REV-2) needs a public repo or a paid plan.

It then runs `new-app.mjs`, which:
- copies the app skeleton: Next.js 16 + TypeScript 5.9, pnpm, Drizzle + SQLite (better-sqlite3), Vitest, Playwright, ESLint 9, pinned with a lockfile;
- copies the committed harness layer (Stop gate, reviewer, CI and review workflows, defect form, CODEOWNERS);
- fills in the app name and your GitHub user;
- runs `git init` and the first commit;
- proves the Stop gate blocks a broken check (GATE-6);
- runs `gh repo create` and pushes.

The skill then runs `pnpm install` and the checks. Apps need Node ≥ 22.

To run the script by hand without creating a GitHub repo:

```
node <plugin>/scripts/new-app.mjs my-app --dir . --owner josep-audenis --no-remote
```

## 2. Manual steps (once per app)

1. Create a review token and store it as a repo secret:
   ```
   claude setup-token
   gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo josep-audenis/my-app
   ```
2. In GitHub → Settings → Rules, add a ruleset on `main`:
   - require a pull request;
   - require the status checks `ci` and `review`.

   Code-owner review is optional for a solo developer. Agents push and open PRs as your GitHub user, and GitHub won't let you approve your own PR. CODEOWNERS still requests your review on harness paths (see NOTES.md, the REV-2 proposal). Doctor reports this as a WARN, not a FAIL.
3. Run `/harness:doctor` inside the app. Every repo row should be PASS. REV-2 is checked only once the repo has a GitHub remote.

## 3. First feature

```
/harness:brief users can sign in with a magic link
```

Read the brief it writes in `docs/briefs/`. This is where your judgement matters most. Then dispatch the work with the `/goal` condition it printed, either in this session or as a background session from `claude agents`.
