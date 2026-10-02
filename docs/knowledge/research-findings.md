# Research findings

Collected 2026-09-28 from a deep research pass. Each claim carries its source, and anything not verified against a primary source is marked. Add to this file when an experiment in `experiments/` produces evidence of your own.

## Harness changes move results, with a fixed model

| Finding | Number | Source | Confidence |
|---|---|---|---|
| LangChain deepagents-cli, model fixed (gpt-5.2-codex), harness-only changes: self-verification, trace analysis, loop-detection middleware, a "reasoning sandwich" | Terminal-Bench 2.0: 52.8 → 66.5 (top 30 → top 5) | Trivedy, *Improving Deep Agents*, LangChain 2026 | secondary summaries |
| Changing only the edit format, 16 models × 180 tasks × 3 runs | +5 to +14 points for most models; about −20% output tokens; Grok Code Fast 1 rose from 6.7% to 68.3% with "hashline" edits | Can Bölük, *The Harness Problem*, Feb 2026, blog.can.ac | primary |
| Automated harness search (Meta-Harness) | Haiku 4.5: 37.6% on TerminalBench-2, beating the next best (Goose, 35.5%) | Lee, Nair, Zhang, Lee, Khattab & Finn, arXiv 2603.28052 | primary for the Haiku number |

## Caveats on that evidence

- *Rethinking the Evaluation of Harness Evolution* (arXiv 2607.12227, July 2026): automatic harness evolution "does not consistently outperform simple test-time scaling methods and exhibits limited generalization".
- An independent replication of the edit-format result (nwyin.com, *Hashline vs Replace*) found the effect depends on language and model: Python penalises hashline, TypeScript is neutral, Rust is mixed.
- **Takeaway:** treat benchmark gains as a direction, not a promise for your repos. That is why this repo has `evals/`: measure on your own tasks.

## Patterns with direct support

- **Long-running agents** (Anthropic Engineering, *Effective harnesses for long-running agents*, Nov 2025). Two failure modes appeared: one-shotting the whole app and running out of context mid-feature, and later sessions declaring the project done. The fixes:
  - an **initializer** session that writes `init.sh`, a progress file, the first commit, and a JSON **feature list** with every feature marked failing (JSON because models are less likely to rewrite it than Markdown);
  - each later session works on **one feature**, reads progress and git log first, runs a smoke test before new work, verifies end to end in a browser, and ends with a commit and a progress entry.
- **AGENTS.md as a map**: OpenAI's Codex team keeps "a short AGENTS.md (roughly 100 lines)" that "serves primarily as a map, with pointers to deeper sources of truth" (Ryan Lopopolo, *Harness engineering: leveraging Codex in an agent-first world*, Feb 2026).
- **Guides and sensors** (Böckeler, martinfowler.com, Apr 2026): feedforward vs feedback, each computational or inferential. Functional correctness is the hardest dimension and still needs human judgment, which is why the final human gate survives in every loop design.
- **Agent teams cost:** about 7× the tokens of a standard session when teammates run in plan mode (Anthropic docs, *Manage costs effectively*).

## Known failure modes

- **Premature "done"**: the agent declares success without proof. Countered by the Stop gate on executed checks and a `/goal` with a named proving command.
- **Test tampering / reward hacking**: tests are edited, skipped or weakened to pass. Countered by "no test file modified" in goals, a reviewer focused on tampering, and CODEOWNERS on harness files.
- **Flaky gates**: quarantine, don't retry. Probe for determinism before admitting a check.
- **Stop-hook loops**: capped at 8 consecutive blocks; then escalate.
- **The `/goal` evaluator fooled by a confident summary**: it reads only the transcript.
- **Context rot in long sessions**: one feature per session, progress files, compaction re-injection via SessionStart.
- **Plugin Stop hooks**: an old bug (anthropics/claude-code#10412) made exit-2 Stop hooks from plugins halt instead of continue. Test it live after installing (`/harness:doctor --live`).

## Not verified

- The plateau statistics in the workshop deck (Stack Overflow 2025, DORA 2025, GitClear 2026).
- Meta-Harness's #2 ranking among Opus 4.6 agents (76.4%), which comes from secondary summaries only.
- A reported Aug 14, 2026 change making auto mode the default for new sessions.

## Our own evidence

Results from `experiments/` that were adopted (LAB-6). Empty until the first experiment completes.
