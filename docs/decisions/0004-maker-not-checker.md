# 0004: Maker is not checker; agents never merge

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** P3, AGT-1, REV-3, REV-4

## Context
The model that wrote a diff is its worst reader. A `/goal` evaluator reads only the transcript. Green gates prove checks passed, not that the checks are right (the workshop's coverage-1.0 failure).

## Decision
The work is split across separate roles: planner, test-writer, implementer and reviewer. Tests are written before implementation and must fail first. The reviewer is read-only and on a fresh context. CODEOWNERS makes the harness files human-owned. Agents never merge; the human does.

## Alternatives rejected
- **Auto-merge low-risk `claude/*` PRs:** saves minutes, but risks merging work that passed the wrong checks. Revisit with evidence from an experiment.

## Consequences
- The human reads briefs and merges. That's the price of trust and is time well spent.
