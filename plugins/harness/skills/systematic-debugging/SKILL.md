---
name: systematic-debugging
description: Find the root cause of a bug, test failure or unexpected behaviour before changing any code. Reproduce, read the error fully, check recent changes, instrument boundaries, test one hypothesis at a time, then fix at the source with a failing test first. Use for any failure, especially when a quick fix is tempting or a previous fix didn't work.
---

# Systematic debugging

**No fix without a root cause.** A symptom fix is a failure, even when the test turns green.

## 1. Read and reproduce
- Read the whole error: message, stack trace, file and line, exit code. Errors often name the fix.
- Reproduce it with one exact command. If you can't reproduce it reliably, gather more data first; don't guess.
- Check recent changes: `git log --oneline -10`, `git diff`, new dependencies, config, environment.

## 2. Locate
- **Multi-component paths** (UI → API → service → DB, CI → build → deploy): add temporary logging at each boundary showing what goes in and what comes out. Run once and find the layer where good data turns bad.
- **Deep in a call stack:** trace the bad value backwards to where it is first wrong. The fix belongs there, not where it surfaced.
- Find working code that does something similar, and diff the two.

## 3. One hypothesis at a time
- Write it down: "X fails because Y, so changing Z will make W happen."
- Make the smallest change that tests *only* that hypothesis, then run the reproduction.
- If it's wrong, undo the change before trying the next hypothesis. Never stack guesses.

## 4. Fix
1. Add a failing test that captures the bug (it must fail for the reason you found).
   - If you're the implementer and may not touch tests, report the missing test to the orchestrator instead.
2. Fix at the root cause.
3. Run the test and the full checks (`check.mjs --all`). Paste the output.
4. Remove the temporary logging.

## Stop rules
- Two attempts at the same error without progress: stop. Write `BLOCKED.md` with the reproduction, every hypothesis tested and its result, and your best remaining guess.
- If the fix needs changes outside your scope fence, or to a test, stop and say so. Don't widen the fence yourself.
