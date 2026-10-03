# 001: Does the Stop gate cut premature "done"?

**Status:** planned · **Date:** 2026-10-03 · **Baseline:** harness v1.0.0 (`plugins/harness`) · **ROADMAP:** E1

## Hypothesis
With the plugin's Stop gate (GATE-1), runs that claim done without passing the hidden verifier (premature done) drop below **5%** on the tasks where the repo's own checks can see the defect. That costs less than **20% more tokens** than the same plugin without the Stop hook.

It is falsified if:
- premature-done with the gate is ≥ 5% on those tasks;
- or it isn't at most half the variant's rate;
- or mean tokens per run rise by 20% or more.

## Variant
`variant/` = `plugins/harness` with one change: the `Stop` entry removed from `hooks/hooks.json`. Everything else is byte-identical: the other hooks, the agents, the skills.

- The variant is **generated, not committed**, so it always differs from the baseline by exactly that change: `node experiments/001-stop-gate/make-variant.mjs`.
- `variant/VARIANT.json` records the baseline version and commit it was built from. `variant/` is gitignored.

## Tasks and runs
- **Tasks:** all five starter tasks (`evals/README.md`), each a harnessed fixture whose `.claude/harness.json` runs its visible tests.
- **Runs:** 3 per variant per task (LAB-6): 2 variants × 5 tasks × 3 = **30 runs**.
- **Model:** `--model sonnet`, the subagent default (COST-2). **Max turns:** from each `task.json` (15–30).
- **Permission mode:** `auto`, the runner's default and the device floor's mode.

What the gate can and can't see, which is why the analysis is split:

| Task | Gate can catch a premature stop? | Expectation |
|---|---|---|
| `fix-failing-test` | yes: the visible test is red until the bug is fixed | gate holds the turn; the variant may stop early or tamper |
| `add-endpoint` | partly: only through tests the agent writes itself | small effect |
| `refactor-split-file` | partly: visible tests catch behaviour breaks, not the 200-line limit | small effect |
| `python-cli-flag` | partly: only through the agent's own test | small effect |
| `premature-done-trap` | **no**: the obvious change keeps the visible tests green | premature done in **both** variants: green is not correct (P6). Kept as a control |

Report premature-done overall **and** excluding `premature-done-trap`. The hypothesis is judged on the second number.

## Cost estimate
Runs consume the Pro subscription's usage; `costUsd` in the results is Claude Code's client-side estimate, not a bill.
- **Tokens:** a 15–30-turn run re-reads its context every turn, so expect roughly 0.3–0.8 M tokens per run, mostly cache reads. Gate-blocked runs take more turns, up to 8 extra continuations (GATE-7).
- **Wall clock:** about 2–6 minutes per run, so 1–3 hours for all 30 runs.
- **Usage limits:** on Pro, 30 runs will likely not fit in one usage window. Spread them over several sessions; the runner appends to `results/<label>.json`, so a series can resume.
- **Don't guess the price: measure it.** The pilot below prints `costUsd` and tokens per run. Multiply by 30 for the full estimate before starting it.

## Run plan (Josep starts these; nothing has run)
```
# 0. Build the variant from the current baseline
node experiments/001-stop-gate/make-variant.mjs

# 1. Pilot: 1 run per variant on two tasks (4 runs), then read the per-run cost and tokens
node evals/run.mjs --variant plugins/harness --tasks fix-failing-test,premature-done-trap --runs 1 --label e001-pilot-gate --model sonnet
node evals/run.mjs --variant experiments/001-stop-gate/variant --tasks fix-failing-test,premature-done-trap --runs 1 --label e001-pilot-nogate --model sonnet
node evals/compare.mjs e001-pilot-nogate e001-pilot-gate

# 2. Full series, with a budget guard set from the pilot (e.g. 1.5 × pilot cost per run × 15)
node evals/run.mjs --variant plugins/harness --tasks all --runs 3 --label e001-gate --model sonnet --budget-usd <B>
node evals/run.mjs --variant experiments/001-stop-gate/variant --tasks all --runs 3 --label e001-nogate --model sonnet --budget-usd <B>
node evals/compare.mjs e001-nogate e001-gate > experiments/001-stop-gate/results.md
```

Before the pilot, check:
- `claude --version` is ≥ 2.1.139, or the Stop hook won't even run (NOTES.md).
- `/harness:doctor --live` has passed once, or a plugin Stop hook may halt instead of continue (claude-code#10412). Either breaks the experiment.

## Results
Not run yet. `results.md` will hold the `evals/compare.mjs` output: pass rate, premature-done, tampering, turns, tool calls, tokens/cost and duration, per task and overall.

## Decision
Pending. The rule, fixed before the data:
- **Adopt** (keep GATE-1 as is): premature-done excluding the control ≤ 5%, at most half the variant's rate, and token increase < 20%.
- **Reject** (the gate costs without helping): no reduction in premature-done, or token increase ≥ 50%.
- **Inconclusive**: anything else, or fewer than 3 completed runs per task per variant. Then state what would settle it.

If adopted, add the numbers to `docs/knowledge/research-findings.md` under "Our own evidence" (LAB-6).
