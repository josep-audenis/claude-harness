---
name: learn
description: Turn a mistake the agent made (or keeps making) into a rule at the right level, so it can't recur. A CLAUDE.md line, a path-scoped rule, a skill, or an executed Bash rule the gate enforces. Shows the change and asks first. Use when the user runs /harness:learn, says "don't do that again", or the same correction has been needed twice.
disable-model-invocation: true
argument-hint: "[what went wrong]"
---

# /harness:learn

What went wrong: `$ARGUMENTS`. If empty, look back through this conversation for corrections the user made, or things you had to redo, and pick the most costly one.

When the same thing goes wrong twice, move the answer up a level (SPEC P2). A sentence only raises a probability; a gate refuses.

## 1. State the failure precisely
One line: what was done, what should have happened, and the evidence (command, file, diff).

## 2. Route it: ask three questions in order
1. **If the agent ignores this, what does it cost?** Money, data, production, security or compliance means it's unacceptable: go to **Executed rule** and don't *also* write a sentence as if that were the control.
2. **Does every session need it?** Yes → **Contract line**. Only some sessions or tasks → **Skill**. Only some paths → **Path rule**.
3. **Can the agent work it out from the code?** Yes → write nothing; fix the code or the names instead, and say so.

| Level | Where | When |
|---|---|---|
| **Contract line** | the repo's `CLAUDE.md` (stay ≤ 45 lines; trim something if needed) | cheap to ignore, needed every session |
| **Path rule** | `.claude/rules/<topic>.md` with `paths:` frontmatter | applies to part of the tree |
| **Skill** | propose a skill: name, description and steps. It goes in the harness repo (`plugins/harness/skills/`) if it's general, or `.claude/skills/` if repo-specific | an on-demand procedure |
| **Executed rule** | `.claude/harness.json` `"bashDeny": [{ "pattern": "<regex>", "reason": "<what to do instead>" }]`, enforced by the PreToolUse gate | a shell command that must never run here |

For anything an executed Bash rule can't express (file edits, other tools), say which hook or permission rule would hold it and propose it for the harness repo. Don't invent a mechanism.

## 3. Write it
- Make the rule specific and testable. **Bad:** "be careful with migrations". **Good:** "never run `prisma migrate reset`; use `pnpm db:reset-safe`, which keeps seed users".
- For `bashDeny`, test the regex before saving it. With `node -e`, check that it matches the bad command and doesn't match two legitimate neighbours. Show both results.
- Show the exact diff and ask the user to confirm.

## 4. Commit
These files are human-owned (CODEOWNERS). On a branch named `harness/learn-<slug>`, commit with message `learn: <rule in a few words>`. Open a PR if the repo has a remote. Never push to main.

Report: the failure, the level chosen and why, the diff, and how it's enforced (read by the model, or executed by a gate).
