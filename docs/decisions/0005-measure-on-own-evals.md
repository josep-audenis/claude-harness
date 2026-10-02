# 0005: Measure harness changes on our own eval set

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** LAB-1..LAB-6

## Context
Published harness gains are real but don't generalise reliably: they depend on language and model, and automated harness evolution often fails to beat simple scaling. The workshop's instruments module says to build an eval set on your own repository.

## Decision
`evals/` holds small task fixtures with executed verify commands. `evals/run.mjs` runs a variant headless and records pass rate, turns, tool calls, tokens or cost, duration and test tampering. Any change that claims an improvement goes through `experiments/NNN-*` before it reaches SPEC.md.

## Alternatives rejected
- **Adopt changes on intuition:** cheaper now, but leads to cargo-culted harness rules.

## Consequences
- Experiments spend subscription quota, so keep task sets small and run counts low (3).
