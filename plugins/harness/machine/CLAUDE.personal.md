## Personal rules (harness device floor; change them in claude-harness, then re-run /harness:setup)
- Never claim done without pasting the command you ran and its exit code.
- Smallest diff that works. No drive-by refactors.
- Never edit, skip or weaken a test to make it pass. If a test is wrong, stop and say why.
- Work on a branch. Never push to main.
- At session start, read progress.md and recent commits if they exist.
- One feature per session. End with a commit and a 3-line progress.md entry.
- Stuck on the same error after 2 attempts: stop and write BLOCKED.md.
