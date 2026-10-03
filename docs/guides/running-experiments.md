# Run an experiment

This repo is also a lab. Benchmark gains from papers don't reliably transfer to your projects (`docs/knowledge/research-findings.md`), so changes that claim to make agents faster or better get measured on your own tasks first.

## Concepts

- **Variant:** a harness configuration to test, as a plugin directory. The baseline is the current `plugins/harness/`. `--variant none` runs with no plugin at all.
- **Task:** a small fixture repo under `evals/tasks/<id>/repo/`, with a prompt, hidden verifiers in `verify/` and a reference `solution/` (`evals/README.md`).
- **Run:** one headless `claude -p` session of one variant on one task. It measures:
  - whether the verify commands passed;
  - whether the agent claimed done, and so whether it claimed done prematurely;
  - whether protected test files were modified;
  - turns, tool calls, tokens and cost, and duration.
- **Experiment:** a hypothesis, the variant, the tasks, the results and a decision, recorded in `experiments/NNN-slug/README.md`. `experiments/001-stop-gate/` is the worked example.

## Steps

1. **Pick or write the hypothesis.** `ROADMAP.md` lists candidates. Write it so that a number can prove it wrong, and write the adopt/reject rule *before* running. Example: *"With the Stop gate, premature-done drops below 5% on the eval set, at under 20% more tokens."*
2. **Create the record.** Copy `experiments/_template/README.md` to `experiments/NNN-slug/README.md`.
3. **Build the variant.** Change only what the hypothesis is about: one change per experiment.
   - Preferred: write `experiments/NNN-slug/make-variant.mjs`, which copies `plugins/harness` to `variant/` and applies the change, like 001. `variant/` is gitignored, so the variant is always rebuilt against the baseline you're comparing with.
   - If you hand-edit a copy instead, give it a name other than `variant/` so it's committed.
4. **Estimate the cost first.** Runs consume your subscription.
   - `--dry-run` prints every command and the run count.
   - Then run a pilot with `--runs 1` on two tasks, and read the per-run `costUsd` and tokens.
5. **Run:**
   ```
   node experiments/NNN-slug/make-variant.mjs
   node evals/run.mjs --variant plugins/harness --tasks all --runs 3 --label NNN-baseline --model sonnet --budget-usd <B>
   node evals/run.mjs --variant experiments/NNN-slug/variant --tasks all --runs 3 --label NNN-variant --model sonnet --budget-usd <B>
   node evals/compare.mjs NNN-baseline NNN-variant > experiments/NNN-slug/results.md
   ```
6. **Decide.** Write the decision (adopt, reject or inconclusive) and the reasoning in the record, and update the registry in `experiments/README.md`. If adopted: edit SPEC.md, implement, release (`updating-the-harness.md`), and add the finding to `docs/knowledge/research-findings.md` under "Our own evidence".

## Rules

- **Runs are isolated.** Each starts from a fresh temp copy of the task fixture. It loads only the variant (`--plugin-dir`) and no user settings, plugins or hooks (`--setting-sources project,local`), no MCP servers (`--strict-mcp-config`), and caps turns with `--max-turns`. Your `~/.claude/CLAUDE.md` may still load (it's memory, not a setting), so keep that in mind for contract-text experiments.
- Raw transcripts go to `evals/results/raw/`, which is gitignored. Only summaries (`evals/results/<label>.json`) are committed.
- Three runs per variant per task is the minimum before you believe a difference: agents are noisy. `compare.mjs` marks anything less as "within noise".
- Variants never touch your real `~/.claude/`.
- Before the first real run: Claude Code ≥ 2.1.139, and `/harness:doctor --live` has passed once. Otherwise the plugin's hooks may not run as intended.
