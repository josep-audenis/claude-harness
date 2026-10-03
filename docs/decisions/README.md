# Decisions

One file per design decision: `NNNN-short-title.md`, numbered in order and never renumbered. Write one whenever a choice has a plausible alternative you're rejecting. Use `TEMPLATE.md`. Status is one of Proposed, Accepted, Superseded by NNNN.

| # | Decision | Status |
|---|---|---|
| 0001 | One repo is spec, marketplace and plugin | Accepted |
| 0002 | Hooks and scripts in Node, exec form | Accepted |
| 0003 | Device floor applied by a skill, not by the plugin | Accepted |
| 0004 | Maker is not checker; agents never merge | Accepted |
| 0005 | Measure harness changes on our own eval set | Accepted |
| 0006 | A clean brief commit is red by design; the Stop gate lets it stand | Accepted |
| 0007 | The plugin's gate defers by script location, not by an environment variable | Accepted |
| 0008 | Eval fixtures are dependency-free, with hidden verifiers and reference solutions | Accepted |
| 0009 | Experiment variants are generated from the baseline, not committed copies | Accepted |
| 0010 | App template pins TypeScript 5.9 and ESLint 9, and uses better-sqlite3's bundled binaries | Accepted |
| 0011 | Big features are built task by task, with a ledger, by an orchestrating skill | Accepted |
