# Experiments

Each experiment tests one harness change against the baseline on the eval set (`../evals/`). How to run one: `../docs/guides/running-experiments.md`.

```
experiments/
  _template/README.md     # copy this
  NNN-slug/
    README.md             # hypothesis, variant, tasks, results, decision
    variant/              # plugin dir copied from plugins/harness, one change applied
    results.md            # output of evals/compare.mjs
```

## Registry

| # | Hypothesis | Status | Decision |
|---|---|---|---|
| — | none yet; candidates are in ../ROADMAP.md | | |
