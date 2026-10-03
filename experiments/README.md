# Experiments

Each experiment tests one harness change against the baseline on the eval set (`../evals/`). How to run one: `../docs/guides/running-experiments.md`.

```
experiments/
  _template/README.md     # copy this
  NNN-slug/
    README.md             # hypothesis, variant, tasks, results, decision
    make-variant.mjs      # optional: generates variant/ from plugins/harness with the one change applied
    variant/              # plugin dir: plugins/harness with one change (gitignored when generated)
    results.md            # output of evals/compare.mjs
```

## Registry

| # | Hypothesis | Status | Decision |
|---|---|---|---|
| [001](001-stop-gate/README.md) | The Stop gate cuts premature-done to <5% at <20% more tokens (ROADMAP E1) | planned | pending |
