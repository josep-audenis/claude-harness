# Run an experiment

This repo is also a lab. Benchmark gains from papers don't reliably transfer to your projects (`docs/knowledge/research-findings.md`), so changes that claim to make agents faster or better get measured on your own tasks first.

## Concepts

- **Variant:** a harness configuration to test. It's a plugin directory, plus optionally a settings file. The baseline is the current `plugins/harness/`.
- **Task:** a small fixture repo under `evals/tasks/<id>/` with a prompt and a verifying command (`evals/README.md`).
- **Run:** one headless `claude -p` session of one variant on one task, measured on whether the verify command passed, number of turns, tool calls, tokens or cost, duration, and whether test files were modified.
- **Experiment:** a hypothesis, the variants, the tasks, results and a decision, recorded in `experiments/NNN-slug/README.md`.

## Steps

1. **Pick or write the hypothesis.** `ROADMAP.md` lists candidates. Write it so that a number can prove it wrong. Example: *"With the Stop gate, premature-done drops from >30% to <5% on the eval set, at under 20% more tokens."*
2. **Create the record:** `cp -r experiments/_template experiments/NNN-slug`.
3. **Build the variant.** Copy `plugins/harness` to `experiments/NNN-slug/variant/` and change only what the hypothesis is about. One change per experiment.
4. **Estimate the cost first.** Runs consume your subscription. Start with `--runs 1` on two tasks.
5. **Run:**
   ```
   node evals/run.mjs --variant plugins/harness --tasks all --runs 3 --label baseline
   node evals/run.mjs --variant experiments/NNN-slug/variant --tasks all --runs 3 --label variant
   node evals/compare.mjs baseline variant > experiments/NNN-slug/results.md
   ```
6. **Decide.** Write the decision (adopt, reject or inconclusive) and the reasoning in the record. If adopted: edit SPEC.md, implement, release (`updating-the-harness.md`), and add the finding to `docs/knowledge/research-findings.md` under "Our own evidence".

## Rules

- Runs are isolated. Each starts from a fresh temp copy of the task fixture, loads only the variant via `--plugin-dir` and `--setting-sources`, and caps turns with `--max-turns`.
- Raw transcripts go to `evals/results/raw/`, which is gitignored. Only summaries are committed.
- Three runs per variant per task is the minimum before you believe a difference. Agents are noisy.
- Variants never touch your real `~/.claude/`.
