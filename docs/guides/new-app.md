# Start a new app

## 1. Create it

In Claude Code, from the folder where your projects live:

```
/harness:new-app my-app
```

This copies the app skeleton (default stack: Next.js + TypeScript, pnpm, Drizzle + SQLite, Vitest, Playwright) and the committed harness layer, replaces `OWNER`, runs `git init`, proves the Stop gate blocks a broken check, creates a private GitHub repo and pushes.

## 2. Manual steps (once per app)

1. Create a review token and store it as a repo secret:
   ```
   claude setup-token
   gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo josep-audenis/my-app
   ```
2. In GitHub → Settings → Rules, add a ruleset on `main`:
   - require a pull request;
   - require status checks `ci` and `review`;
   - require code-owner review.

   Rulesets on private repos need a paid GitHub plan. On the free plan, make the app repo public or accept the weaker protection.
3. Run `/harness:doctor` inside the app. Every repo row should be PASS.

## 3. First feature

```
/harness:brief users can sign in with a magic link
```

Read the brief it writes in `docs/briefs/`. This is where your judgement matters most. Then dispatch the work with the `/goal` condition it printed, either in this session or as a background session from `claude agents`.
