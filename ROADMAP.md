# Roadmap

## Build (v1)
- [ ] Phases 1–10 of BUILD.md, with CI green on three operating systems
- [ ] Installed on the first device; `/harness:doctor --live` passes
- [ ] First new app from `/harness:new-app`
- [ ] First existing repo adopted
- [ ] Night shift on one live app

## Experiment backlog
Ordered by expected value. Each becomes `experiments/NNN-slug/` when started.

| # | Hypothesis | Variant |
|---|---|---|
| E1 | The Stop gate cuts premature-done to <5% at <20% more tokens | baseline with the Stop hook removed |
| E2 | A trimmed CLAUDE.md (≤45 lines) needs fewer turns and tokens than a bloated one (~190 lines) with no loss in pass rate | fixture repos with each CLAUDE.md |
| E3 | `/goal` plus Stop gate beats Stop gate alone on multi-step tasks | prompt wrapped in `/goal` with a turn cap |
| E4 | Tests written red-first by a separate test-writer catch more defects than tests written by the implementer | brief skill with and without the test-writer step |
| E5 | The fresh-context reviewer catches injected bugs that the implementer misses | mutation-injected diffs reviewed by each |
| E6 | Sonnet implementer + Opus planner matches all-Opus quality at a fraction of the cost | model assignments |
| E7 | A workflow (`pipeline()` over features) finishes N features faster than N sequential sessions at similar cost | `/build-queue` workflow vs a loop of sessions |
| E8 | A SessionStart state injection reduces turns spent orienting | hook removed |
| E9 | Cross-model review (Codex or Gemini) finds issues Claude review misses | second review workflow |
| E10 | `autoMode.classifyAllShell` costs little latency and blocks nothing legitimate | setting on vs off |

## Later
- Package `/build-queue` and other proven workflows into the plugin
- Telemetry (OpenTelemetry export) dashboards for real projects
- Devcontainer with an egress allowlist for unattended local runs (SEC-6)
- Try `/fairmind-loop` on one feature and compare with `/goal`
