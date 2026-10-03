---
name: review-loop
description: Work the review on the current branch's PR. Wait for CI and the Claude review, read both the summary and the inline comments, fix what reproduces, reply to the rest with reasons, and repeat until nothing is unanswered or 3 rounds. Never merges. Use when the user runs /harness:review-loop or asks to address PR review comments.
disable-model-invocation: true
argument-hint: "[pr-number]"
---

# /harness:review-loop

PR: `$ARGUMENTS`, or the current branch's PR (`gh pr view --json number,url,headRefName`). No PR: stop and say so.

Repeat for at most **3 rounds**:

1. **Wait** for checks on the head commit: `gh pr checks <n> --watch --interval 30`. Note each check's state and duration.
2. **Distrust a fast review.** If the `review` check finished in under 60 s or posted no comment, it probably reviewed nothing: the action skips when its workflow file differs from the default branch's copy. Open its log (`gh run view <run-id> --log`) and report it as a **failure** (REV-5). Don't treat it as a pass.
3. **Read both channels.** The verdict and the findings live in different places:
   - Summary: `gh pr view <n> --comments`. The latest review comment starts with PASS or CHANGES_REQUESTED.
   - Inline: `gh api repos/{owner}/{repo}/pulls/<n>/comments`. Use `line` and `original_line`, because a finding on a line a later push moved loses its anchor. Read the original line too.
   - Red CI: `gh run view <run-id> --log-failed`.
4. **Weigh every finding.** Reproduce it before you change anything: the reviewer read the code without running it. For a failing check or a bug, use the systematic-debugging skill: root cause first.
   - **Real**: fix it with the smallest diff. For a behaviour bug, add a failing test first. Run the harness checks, commit, push.
   - **Not real, or out of scope**: reply with the reason and the evidence. Inline: `gh api repos/{owner}/{repo}/pulls/<n>/comments/<id>/replies -f body="…"`. Summary: `gh pr comment <n> --body "…"`.
5. **Stop** when the latest review is PASS, CI is green, and every finding has a fix commit or a reply. Otherwise push and start the next round.

## Rules
- Never merge, never approve, never push to the default branch (REV-4).
- Never edit or skip a test to satisfy a reviewer. If a finding says a test is wrong, reply and leave the decision to the human.
- Don't touch paths in CODEOWNERS (`.claude/`, `.github/`, `CLAUDE.md`, `AGENTS.md`) in response to a review. Reply instead.

## Report
One row per finding: `<where> | <finding> | FIXED <sha> or REPLIED (<reason>)`. Then the rounds used, the final CI state and the review verdict. If 3 rounds pass without converging, say what is still open and stop.
