# claude-harness: KICKOFF

> **To the human:** put this single file at the root of your empty `claude-harness` repo, run `claude` there, switch to plan mode and say: *"Follow KICKOFF.md."* Fill in §0 first if you can; the agent asks for anything left blank.
>
> **To the agent:** this file is your complete brief. It contains every starting document for this repository, embedded verbatim. §2 says exactly what to do with them.

---

## 0. Settings (human fills in; the agent asks if blank)

| Setting | Value | Used for |
|---|---|---|
| GitHub username | `________` | marketplace add command, CODEOWNERS `@OWNER`, new-app remote |
| Marketplace name | `josep-harness` | `/plugin install harness@<name>` |
| Devices and OSes | e.g. `MacBook (macOS), work laptop (Windows 11)` | CI priorities, doctor checks, notify implementation |
| App stack for new apps | `Next.js + TypeScript, pnpm, Drizzle + SQLite, Vitest, Playwright` | `templates/app/` (BUILD.md §3.4) |
| Claude plan | e.g. `Max` | default eval budgets and the workflow size guideline |

## 1. Mission of this repository

`claude-harness` is the central place where Josep **creates, distributes, experiments with and documents** agent harnesses for Claude Code:

1. **Specify:** `SPEC.md` says what must be true on every device, repo and loop.
2. **Build and distribute:** the `harness` plugin (hooks, agents, skills, workflows, device floor, templates) installs on any OS from this repo, which is also a plugin marketplace.
3. **Apply:** `/harness:new-app` creates harnessed apps, and `/harness:adopt` retrofits existing repos.
4. **Experiment:** `evals/` and `experiments/` measure harness variants on our own tasks before changes reach the spec.
5. **Document:** `docs/` holds the guides for setting things up, the knowledge behind the design, and the decisions made.

The background (FairMind's Harness and Loop Engineering workshops, Anthropic's long-running harness patterns, and harness benchmark research) is distilled in `docs/knowledge/`. The design follows from it:
- executed gates instead of the agent's word;
- maker separate from checker;
- loops with a trigger, an exit, a verifier and memory;
- configure once, apply everywhere;
- measure before believing.

## 2. Instructions for the agent

### Step 1: Unpack (no judgement, no edits)

1. For every block in §4 between `===== BEGIN FILE: <path> =====` and `===== END FILE: <path> =====`, create `<path>` with exactly the lines between the markers.
   - Don't include the marker lines.
   - Don't reformat, "fix" or summarise anything.
   - Create directories as needed.
2. Replace placeholders using §0: `<you>` becomes the GitHub username in the docs, and the stack line in BUILD.md §3.4 is replaced if §0 differs from the default. If a §0 value is blank, ask for it now.
3. Move this file to `docs/archive/KICKOFF.md`.
4. Run `git add -A && git commit -m "chore: unpack kickoff"`.
5. List the files you created and confirm the count matches §3.

### Step 2: Plan (plan mode; wait for approval)

Read, in this order: `CLAUDE.md`, `SPEC.md`, `BUILD.md`, `docs/knowledge/claude-code-primitives.md`, `docs/decisions/*`. Then present:
- your plan for BUILD.md phases 1–10, with what you'll verify against the docs in phase 1;
- **anything in SPEC.md or BUILD.md that you think is wrong, unverifiable or contradictory**, with a proposed fix;
- the questions you need answered.

Wait for Josep to approve the plan.

### Step 3: Build

Follow `BUILD.md` phases 1–10.
- Commit after each phase with a message naming the SPEC IDs it covers.
- Never edit `SPEC.md`; propose changes in `NOTES.md`.
- Never write outside the repo or temp dirs, never call the real `claude` in tests, never push.

Josep will usually run this step under a goal such as:

```
/goal every test in BUILD.md §5 passes with output shown, claude plugin validate . passes, phase 10 docs reconcile is done, NOTES.md is complete, and nothing was written outside this repo or temp dirs. Stop after 100 turns.
```

### Step 4: Report

End with:
1. the final `npm test` output;
2. the `claude plugin validate .` output;
3. a table of SPEC requirement IDs with their status (implemented / partial / not done) and the test that covers each;
4. NOTES.md's dropped and unverified items;
5. the exact steps Josep runs next: push, wait for CI, then `docs/guides/device-setup.md` on the first device.

## 3. Files in this kickoff

The paths below, in the order they appear in §4.

31 files:

1. `CLAUDE.md`
2. `README.md`
3. `SPEC.md`
4. `BUILD.md`
5. `ROADMAP.md`
6. `NOTES.md`
7. `CHANGELOG.md`
8. `.gitignore`
9. `docs/knowledge/harness-engineering.md`
10. `docs/knowledge/loop-engineering.md`
11. `docs/knowledge/claude-code-primitives.md`
12. `docs/knowledge/research-findings.md`
13. `docs/knowledge/sources.md`
14. `docs/guides/device-setup.md`
15. `docs/guides/new-app.md`
16. `docs/guides/adopt-existing-repo.md`
17. `docs/guides/daily-workflow.md`
18. `docs/guides/night-shift.md`
19. `docs/guides/updating-the-harness.md`
20. `docs/guides/running-experiments.md`
21. `docs/guides/troubleshooting.md`
22. `docs/decisions/README.md`
23. `docs/decisions/TEMPLATE.md`
24. `docs/decisions/0001-single-repo.md`
25. `docs/decisions/0002-node-hooks.md`
26. `docs/decisions/0003-device-floor.md`
27. `docs/decisions/0004-maker-not-checker.md`
28. `docs/decisions/0005-measure-on-own-evals.md`
29. `experiments/README.md`
30. `experiments/_template/README.md`
31. `evals/README.md`

## 4. Embedded files

===== BEGIN FILE: CLAUDE.md =====
# claude-harness

Josep's lab for agent harnesses. This repo is the spec, a Claude Code plugin marketplace (`josep-harness`) with the `harness` plugin, an experiment lab (`evals/`, `experiments/`), and the docs for all of it.

## Read first
- `SPEC.md` is the source of truth: what must be true. Don't edit it; propose changes in NOTES.md.
- `BUILD.md` says how to build and change it: layout, rules, phases, tests.
- `NOTES.md` records what has been verified against the Claude Code docs, plus deviations and open questions.
- `docs/knowledge/` is background: concepts, Claude Code primitives, research. Read what the task touches.

## Commands
- `npm test` runs all tests (node:test, no deps, never calls the real `claude`). It must pass before any commit.
- `npm run sync-templates` regenerates the committed hook copies in `plugins/harness/templates/repo/.claude/hooks/`.
- `claude plugin validate .` validates the marketplace and plugin.
- `claude --plugin-dir ./plugins/harness` tries the plugin locally without installing it.
- `node evals/run.mjs --variant <dir> --claude-bin evals/stub/claude-stub.mjs` exercises the lab without spending tokens.

## Gotchas
- All scripts must run on macOS, Linux and Windows: Node built-ins only, no bash/jq/symlinks, exec-form hooks.
- Never write to the real home directory. Tests and scripts take `--home <dir>`.
- Plugin `settings.json` only honours `agent` and `subagentStatusLine`. Permissions and env belong to `machine/settings.floor.json`, applied by setup.
- A change that should reach devices needs a version bump in `plugins/harness/.claude-plugin/plugin.json` and a CHANGELOG.md line.
- Real eval runs spend Josep's quota. Only start them when he asks.

## Definition of done
- `npm test` passes                                   (Stop gate)
- CI green on ubuntu, macos and windows               (GitHub)
- Guides match the implementation; README links them  (the agent)
- Commit message names the SPEC IDs touched           (the agent)
- Version bumped and pushed                           (Josep, never the agent)
===== END FILE: CLAUDE.md =====

===== BEGIN FILE: README.md =====
# claude-harness

Josep's lab and distribution point for agent harnesses: the requirements, a Claude Code plugin that implements them on every device, templates for new and existing repos, and the experiments that decide what changes.

## Start here

| I want to… | Read |
|---|---|
| set up a laptop (any OS) | [docs/guides/device-setup.md](docs/guides/device-setup.md) |
| start a new app | [docs/guides/new-app.md](docs/guides/new-app.md) |
| bring an existing repo in | [docs/guides/adopt-existing-repo.md](docs/guides/adopt-existing-repo.md) |
| know how to work day to day | [docs/guides/daily-workflow.md](docs/guides/daily-workflow.md) |
| run agents overnight | [docs/guides/night-shift.md](docs/guides/night-shift.md) |
| change the harness | [docs/guides/updating-the-harness.md](docs/guides/updating-the-harness.md) |
| test whether a change helps | [docs/guides/running-experiments.md](docs/guides/running-experiments.md) |
| fix something | [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) |

## What's in here

| Path | What |
|---|---|
| `SPEC.md` | requirements: what must be true on every device, repo and loop |
| `BUILD.md` | how the implementation is built and tested |
| `plugins/harness/` | the plugin: hooks, agents, skills, workflows, device floor, templates |
| `.claude-plugin/marketplace.json` | makes this repo installable with `/plugin` |
| `docs/knowledge/` | harness and loop engineering concepts, Claude Code primitives, research findings, sources |
| `docs/decisions/` | why things are the way they are |
| `evals/`, `experiments/` | the lab: tasks, runner, experiment records |
| `ROADMAP.md`, `NOTES.md`, `CHANGELOG.md` | what's next, what's verified, what shipped |

## Quick start on a new device

```
gh auth login && gh auth setup-git
claude
/plugin marketplace add <you>/claude-harness
/plugin install harness@josep-harness
/harness:setup
/auto-mode-setup
/harness:doctor
```
===== END FILE: README.md =====

===== BEGIN FILE: SPEC.md =====
# Harness Specification

**Status:** v1.0, 2026-10-02 · **Owner:** Josep · **Applies to:** current Claude Code on macOS, Linux, Windows (feature version floors are in `docs/knowledge/claude-code-primitives.md`)

This document defines what must be true of the development harness: on every device, in every repo, and for every loop. It describes requirements, not implementation. `BUILD.md` says how to build it, and `/harness:doctor` checks a device and a repo against it.

Requirement keywords: **MUST** means the harness is broken without it. **SHOULD** means you need a written reason to skip it. **MAY** means optional.

---

## 1. Purpose

A solo developer ships many small apps with coding agents, with about one hour of attention a day. The harness exists to spend that hour on decisions and reviews, not on:

1. approving tool calls one at a time,
2. checking whether "done" is really done,
3. re-explaining the project to every new session,
4. reading every line an agent wrote,
5. restarting stalled work.

This repository is also the **lab** where harness ideas are tried, measured and either adopted or rejected (LAB), and the **documentation** of how everything is set up and why (DOC).

## 2. Principles

- **P1. Agent = model + harness.** Improve the harness before reaching for a bigger model or more agents.
- **P2. Prefer computational over inferential.** A rule a script enforces beats a rule a model is asked to follow. When a failure repeats, move its fix up a level: CLAUDE.md line → skill → hook or permission → sandbox or container.
- **P3. Maker is not checker.** Whoever writes the code never decides alone that it's done. Checks are written by a non-implementer, and the reviewer runs on a fresh context.
- **P4. Every loop has four designed parts:** trigger, exit, verifier, memory. A loop missing an executed verifier, a budget or a scope fence is not allowed to run unattended.
- **P5. Configure once.** Anything that doesn't depend on the project lives in the plugin or the device floor, never copied by hand into repos. The only per-repo parts are the contract and what cloud runs need.
- **P6. Green is not correct.** Gates prove the checks passed, not that the checks are right. Reading the brief and merging stay human.

## 3. Topology

| Layer | Lives in | Reaches | Carries |
|---|---|---|---|
| **Plugin** `harness` | this repo, `plugins/harness/` | every device, via `/plugin install` | hooks, agents, skills, workflows, templates |
| **Device floor** | `~/.claude/` on each device, written by `/harness:setup` | that device only | permissions, auto mode, sandbox, env, personal CLAUDE.md block, `loop.md` |
| **Repo contract** | each project repo, committed | local and cloud sessions | `CLAUDE.md`, `.claude/harness.json`, feature list, progress log, committed hooks + reviewer |
| **GitHub** | each project repo | PRs | CI, Claude review, CODEOWNERS, ruleset |
| **Cloud** | claude.ai routines | laptop closed | night-shift prompt (reads only the committed repo) |
| **Lab** | this repo, `evals/` + `experiments/` | this repo only | eval tasks, runner, experiment records |
| **Docs** | this repo, `docs/` + `README.md` | humans and agents | guides, knowledge, decisions |

Plugins can't set permissions, sandbox, `defaultMode` or `env`: a plugin's `settings.json` only honours `agent` and `subagentStatusLine`. A `CLAUDE.md` inside a plugin isn't loaded as context. That is why the device floor exists. Cloud sessions and routines never see `~/.claude/` or locally installed plugins, which is why the repo carries a committed copy of what the night shift needs.

---

## 4. Requirements

### DEV: Device

- **DEV-1** MUST have, on PATH: `git`, Node.js ≥ 20, `gh` (authenticated, with `gh auth setup-git` run so private-repo clones work non-interactively) and Claude Code. On Windows, Git for Windows. *Verify: doctor prints the versions.*
- **DEV-2** MUST have the `harness` plugin installed and enabled from this repo's marketplace. *Verify: `claude plugin list` shows `harness@<marketplace>` enabled.*
- **DEV-3** MUST have the device floor applied by `/harness:setup` (SEC-1 to SEC-4, CTX-1, LOOP-6). Re-running setup MUST be idempotent and MUST preserve every existing user setting. *Verify: doctor; run setup twice, files byte-identical.*
- **DEV-4** SHOULD have plugin auto-update enabled for the marketplace (`/plugin` → Marketplaces → Enable auto-update). Otherwise, update with `/plugin marketplace update <name>`.
- **DEV-5** All harness scripts MUST run identically on macOS, Linux and Windows. They are Node, invoked in hook exec form (`command: "node"`, `args: [...]`), with no dependency on bash, jq or POSIX tools. *Verify: CI matrix on ubuntu, macos and windows.*
- **DEV-6** MUST record the device in `~/.claude/harness-device.json`: OS, harness version, setup date. Doctor reads it.

### SEC: Boundaries

- **SEC-1** The device floor MUST deny reads of `~/.ssh/**`, `~/.aws/**`, `**/.env` and `**/.env.*`, and MUST deny `git push --force`, `gh pr merge` and `npm publish`.
- **SEC-2** The device floor MUST set `permissions.defaultMode` to `auto`, unless the user already chose a different mode, which is kept and logged. Auto mode only works from user or managed settings, never project files.
- **SEC-3** After setup, the user SHOULD run `/auto-mode-setup` once per device so the classifier trusts their own GitHub account and package registries. Verify with `claude auto-mode config`.
- **SEC-4** The sandbox SHOULD be enabled (`sandbox.enabled: true`). Network and credential sub-keys MAY be added only once verified against the docs (§8).
- **SEC-5** The PreToolUse command gate MUST deny, with exit code 2 and a reason: force pushes, piping a download into a shell, `terraform apply`, `kubectl delete`, and any `aws`/`gcloud` verb that isn't read-only (`describe-*`, `list-*`, `get-*`, `ls`).
- **SEC-6** `bypassPermissions` MUST NOT be part of the floor. Unattended local runs that need it MUST happen inside a container with an egress allowlist.
- **SEC-7** No loop that reads untrusted content (issues, PR comments, web pages) may hold secrets *and* be able to push or post at the same time (the lethal trifecta). Routines MUST include only the connectors they need.

### CTX: Context and contract

- **CTX-1** The device floor MUST insert the personal rules (§6.1) into `~/.claude/CLAUDE.md` between `<!-- harness:start -->` and `<!-- harness:end -->`, leaving everything outside the markers untouched.
- **CTX-2** Every harnessed repo MUST have a `CLAUDE.md` of 45 lines or fewer, containing only what the repo can't say for itself: commands, gotchas, reasons, conventions, "working across sessions" and a definition of done that names who enforces each line. No directory tours, dependency lists or architecture overviews.
- **CTX-3** Every harnessed repo MUST have `.claude/harness.json` (§6.2). It is the single executed contract, used by the Stop gate, CI and routines.
- **CTX-4** Every harnessed repo MUST have `feature_list.json` (§6.3) and `progress.md`. Agents flip `passes` only after verifying a feature's steps end to end, and never delete or reword entries.
- **CTX-5** A SessionStart hook (startup, resume, compact) MUST inject the tail of `progress.md`, the last 8 commits and the count of open features, when those files exist.
- **CTX-6** Conventions that apply to part of the tree SHOULD use `.claude/rules/*.md` with `paths:` or a nested CLAUDE.md, not the root file.
- **CTX-7** `AGENTS.md` SHOULD exist and point to `CLAUDE.md`, so non-Claude reviewers read the same contract.

### GATE: Enforcement

- **GATE-1** A Stop hook MUST block the turn (exit 2) while any `check` command in `.claude/harness.json` fails. On stderr it MUST print `Not done:`, the failing command, the last 40 lines of its output and "Fix the cause, not the test."
- **GATE-2** The Stop gate MUST skip (exit 0) when the repo has no `.claude/harness.json`, or when the tree is clean with no untracked files and no commits ahead of the default branch, so plain Q&A is never gated.
- **GATE-3** When a repo commits its own `.claude/hooks/stop-gate.mjs`, the plugin's Stop gate MUST defer to it (exit 0) so the gate runs once. The same applies to the formatter.
- **GATE-4** A PostToolUse hook on `Edit|Write` SHOULD format only the edited file. It MUST exit 0 even when no formatter is installed.
- **GATE-5** Hooks MUST block only with exit code 2. Exit 1 is a non-blocking error and MUST NOT be used to block.
- **GATE-6** Every gate MUST be proven before it's trusted: break one check, confirm the gate blocks, revert, confirm it passes. Doctor and `/harness:adopt` both do this.
- **GATE-7** Claude Code overrides a Stop hook after 8 consecutive blocks without progress. At that point the user escalates to a different approach or a stronger model; the cap MUST NOT be raised by default.

### AGT: Agents and orchestration

- **AGT-1** The plugin MUST provide four agents with these roles, tools and models:

  | Agent | Job | Tools | Model |
  |---|---|---|---|
  | `planner` | writes briefs (§6.4), never code | Read, Grep, Glob, Write | opus |
  | `test-writer` | writes tests from the brief that fail on today's code | Read, Grep, Glob, Write, Edit, Bash | sonnet |
  | `implementer` | builds inside the scope fence, never edits tests | Read, Edit, Write, Bash, Grep, Glob; worktree isolation | sonnet |
  | `reviewer` | PASS or CHANGES_REQUESTED; checks for test tampering and scope | Read, Grep, Glob, Bash (no edit tools) | sonnet |

- **AGT-2** `/harness:brief` MUST turn a one-line request into: a brief, a feature_list entry, failing tests (output shown), and a `/goal` condition (§6.5). It MUST NOT implement anything.
- **AGT-3** `/harness:verify-done` MUST print one row per definition-of-done criterion with its evidence, quote failures verbatim, and never report done while any row is red.
- **AGT-4** For many independent items, use a dynamic workflow (say "use a workflow" or `ultracode:`). Good runs SHOULD be saved and moved into `plugins/harness/workflows/` so every device gets them.
- **AGT-5** Agent teams MAY be used for debugging with competing hypotheses or cross-layer research. They MUST NOT be enabled in the device floor.

### LOOP: Loops

| Ring | Trigger | Exit | Verifier | Memory |
|---|---|---|---|---|
| 1 Turn | prompt | Stop gate passes | `harness.json` checks | conversation |
| 2 `/loop` | clock or self-paced | user, or the prompt | maker | session |
| 3 `/goal` | turn ends | condition met or turn cap | small model + Stop gate | progress.md, git |
| 4 Review | PR opened or pushed | nothing unanswered | other model, CI, human | PR thread |
| 5 Night | schedule | PR opened, never merged | required checks, human | issues, NIGHT-LOG.md |

- **LOOP-1** A ring MAY be automated only once the ring inside it is trustworthy. Rings 4 and 5 MUST NOT run on a repo without GATE-1.
- **LOOP-2** Every `/goal` MUST name the proving command, a "no test file modified" constraint and a turn cap (§6.5). The evaluator reads only the transcript.
- **LOOP-3** Background sessions (`claude agents`, `--bg`) SHOULD be limited to two at a time, three at most.
- **LOOP-4** Any unattended loop MUST have an executed verifier, a budget and a scope fence (P4).
- **LOOP-5** `/loop` is for watching things that change on their own (CI, PRs, deploys). Anything that must outlive the session or run with the laptop closed MUST be a routine.
- **LOOP-6** The device floor MUST install `~/.claude/loop.md` (§6.6) as the default prompt for a bare `/loop`.

### REV: Review and merge

- **REV-1** Every harnessed repo on GitHub MUST run CI that executes the `harness.json` checks, and a Claude review on every PR whose summary starts with PASS or CHANGES_REQUESTED.
- **REV-2** `main` MUST be protected: PR required, status checks `ci` and `review` required, code-owner review required.
- **REV-3** CODEOWNERS MUST make `/.claude/`, `/.github/`, `/AGENTS.md`, `/CLAUDE.md` and migrations human-owned, so an agent can never approve changes to its own gates.
- **REV-4** Agents MUST NOT merge. The human merges.
- **REV-5** `/harness:review-loop` MUST read both the summary and the inline comments, fix what reproduces, reply on the PR to the rest saying why, and stop when nothing is unanswered or after 3 rounds. A review that finished in seconds with no findings MUST be treated as a failure.

### NIGHT: Night shift

- **NIGHT-1** Defects MUST be filed as issues from the `defect.yml` form: label `agent-ready`, a stable key (`file::symbol` plus failure shape, no line numbers), a verbatim Reproduce block, and a severity. Deduplicate against open *and* closed issues before filing.
- **NIGHT-2** The night routine MUST follow the prompt in §6.7: one defect per run, reproduce first, failing test then fix, reviewer, PR with `Fixes #n`, never merge, append to NIGHT-LOG.md.
- **NIGHT-3** Routines MUST run only on repos that commit the harness layer (CTX-2 to CTX-4, the committed Stop gate and the reviewer), because cloud runs never see `~/.claude/` or local plugins.
- **NIGHT-4** Routines MUST be scheduled at a minute other than :00, and stay within the account's daily routine cap.

### REC: Record

- **REC-1** A PostToolUse hook on Bash MUST append one JSON line per command (time, session, agent, cwd, command) to `~/.claude/logs/bash.jsonl`.
- **REC-2** Each session's work MUST end with a commit and a three-line `progress.md` entry.
- **REC-3** Briefs live in `docs/briefs/<id>.md` and are committed.

### COST: Budget

- **COST-1** Default effort is `high`. `ultracode` is used per task, never as a session or device default.
- **COST-2** Opus for planning briefs; Sonnet for test-writing, implementing and reviewing (`CLAUDE_CODE_SUBAGENT_MODEL=sonnet` in the floor).
- **COST-3** Agent teams cost roughly 7× a single session when teammates plan; use them only where AGT-5 allows.

### DIST: Distribution and updates

- **DIST-1** This repo MUST be a valid plugin marketplace: `claude plugin validate .` passes.
- **DIST-2** Every change that should reach devices MUST bump `version` in `plugins/harness/.claude-plugin/plugin.json` and add a line to `CHANGELOG.md`. Without a bump, devices keep their cached copy.
- **DIST-3** A change to the device floor MUST be re-applied on each device by re-running `/harness:setup`. Doctor MUST warn when the installed plugin version is newer than the version recorded at setup.
- **DIST-4** CI on this repo MUST run the test suite on ubuntu, macos and windows, plus `claude plugin validate`.

### ADOPT and NEW: Repos

- **NEW-1** `/harness:new-app <name>` MUST create a new app from `templates/app/` plus `templates/repo/`, replace `OWNER`, initialise git, prove the gate (GATE-6), create a private GitHub repo and push, then list the remaining manual steps (REV-2, the review token).
- **ADOPT-1** `/harness:adopt` MUST retrofit an existing repo on a `harness/adopt` branch. It MUST NOT overwrite existing files: missing files are added; `.claude/settings.json` and CODEOWNERS are merged.
- **ADOPT-2** It MUST draft `.claude/harness.json` from what the repo already uses (package scripts and lockfile, `pyproject.toml`, `go.mod`, `Cargo.toml`), confirm the checks pass on the current code, and stop and report rather than delete checks if they don't.
- **ADOPT-3** It MUST trim or create `CLAUDE.md` to meet CTX-2, show every removed line with the reason, seed 3–10 `feature_list.json` entries, prove the gate (GATE-6) and open a PR. It never merges.
- **ADOPT-4** Re-running adopt on an adopted repo MUST show a diff for every harness file that differs from the current template and ask before updating. This is how improvements reach old repos.

### LAB: Experimentation

- **LAB-1** A change that claims to improve speed, cost or quality SHOULD be backed by an experiment record in `experiments/NNN-slug/` before it changes this spec. Changes for safety or correctness don't need one.
- **LAB-2** `evals/run.mjs` MUST run one variant (a plugin directory) on a set of task fixtures headlessly. For each run it MUST start from a fresh temp copy of the fixture, load only the variant, isolate the run from the user's own settings, and cap turns.
- **LAB-3** For each run it MUST record `passed`, `claimedDone`, `prematureDone`, `tampered`, turns, tool calls, tokens or cost when available, and duration. `evals/compare.mjs` MUST produce a per-task and overall comparison table of two labels.
- **LAB-4** The runner MUST accept `--claude-bin`, so its tests use a stub that emits canned stream-json and spend no tokens. Real runs happen only when a human starts them.
- **LAB-5** Raw transcripts MUST NOT be committed (`evals/results/raw/` is gitignored); summaries are committed.
- **LAB-6** One change per experiment and at least 3 runs per variant per task before a decision. The decision (adopt, reject or inconclusive) and its reasoning are written in the record. Adopted results are added to `docs/knowledge/research-findings.md` under "Our own evidence".

### DOC: Documentation

- **DOC-1** `README.md` MUST link to every guide in `docs/guides/`. Every command a guide shows MUST match the implementation; the build's final phase reconciles them.
- **DOC-2** A design choice with a plausible rejected alternative MUST have a decision record in `docs/decisions/`.
- **DOC-3** Every factual claim about Claude Code features or research in `docs/knowledge/` MUST cite a source and a check date. Unverified claims are marked as unverified.
- **DOC-4** `NOTES.md` MUST record each docs-verified key, each dropped key, each deviation from BUILD.md and each proposed spec change, with dates.
- **DOC-5** Every release MUST add a `CHANGELOG.md` line (DIST-2).

---

## 5. Definition of a harnessed repo

A repo is harnessed when doctor, run inside it, reports all of these as passing:

CTX-2 · CTX-3 · CTX-4 · CTX-7 · GATE-1 (proven) · committed `stop-gate.mjs` and `reviewer.md` · REV-1 · REV-3 · and, when it has a GitHub remote, REV-2.

## 6. Formats

### 6.1 Personal rules (device CLAUDE.md block)

```
- Never claim done without pasting the command you ran and its exit code.
- Smallest diff that works. No drive-by refactors.
- Never edit, skip or weaken a test to make it pass. If a test is wrong, stop and say why.
- Work on a branch. Never push to main.
- At session start, read progress.md and recent commits if they exist.
- One feature per session. End with a commit and a 3-line progress.md entry.
- Stuck on the same error after 2 attempts: stop and write BLOCKED.md.
```

### 6.2 `.claude/harness.json`

```json
{
  "version": 1,
  "check": ["pnpm -s typecheck", "pnpm -s lint", "pnpm -s test:unit"],
  "init": "pnpm dev",
  "health": "http://localhost:3000/api/health",
  "e2e": "pnpm test:e2e"
}
```

`check` runs in order, each through the platform shell, and stops at the first failure. It must be fast (under about 90 seconds) and need no network. `init`, `health` and `e2e` are optional.

### 6.3 `feature_list.json` entry

```json
{ "id": "auth-magic-link", "description": "A visitor can sign in with an emailed magic link",
  "steps": ["Open /login", "Submit an email", "Open the link from the dev mailbox", "Land on /dashboard signed in"],
  "brief": "docs/briefs/auth-magic-link.md", "passes": false }
```

### 6.4 Brief (`docs/briefs/<id>.md`)

Sections, in this order:
- **Goal**
- **Non-goals**
- **Scope fence** (the paths allowed to change)
- **Acceptance criteria**, each written as a command plus its expected output
- **Checks to add**: functional, static, performance or evidence
- **Budget**: turns and a consecutive-failure cap

### 6.5 `/goal` condition template

```
/goal <feature id> has "passes": true in feature_list.json, every harness.json check exits 0 with output shown,
the feature's steps were verified in this session, and no test file outside this feature changed. Stop after <N> turns.
```

### 6.6 `loop.md`

```
Check the pull request for the current branch.
If CI is red: read the failing job's log, reproduce locally, push a minimal fix.
If new review comments arrived: fix what is real (reproduce first), reply on the PR to the rest saying why.
If everything is green and quiet, say so in one line and wait longer next time.
Never merge. Never push to main.
```

### 6.7 Night-shift routine prompt

```
You are the night shift for this repository.
1. List open issues labelled `agent-ready`. Pick ONE: highest severity first, then oldest. Say which and why before touching code.
2. Run its Reproduce block. If it no longer reproduces, comment with the evidence and stop.
3. Add a failing test that captures the defect, then fix it on a new branch. Every harness.json check must pass.
   Never touch paths listed in CODEOWNERS.
4. Ask the reviewer subagent to review. Address every BLOCKER.
5. Open a PR that says "Fixes #<n>" and lists what you verified. Never merge.
6. Append one line to NIGHT-LOG.md. Wait for any subagent you started before ending.
```

## 7. Operating rhythm (not enforced; for reference)

| When | What |
|---|---|
| Weekday morning, 15 min | Triage night PRs. `/harness:brief` one idea and read the brief. Dispatch it with its `/goal`. |
| Weekday evening, 40 min | Review green PRs, merge, and file breakages as defects. |
| Weekend, 1 h | Harness work: whatever failed twice gets moved up a level (P2), then edit this SPEC and bump the version. |

## 8. Unverified (check against current docs before relying on)

- `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`
- `sandbox.network.*` and `sandbox.credentials.*` keys
- `tlsTerminate`
- the `message` field in Notification hook input
- the current inputs of `anthropics/claude-code-action`
- whether cloud sessions can install plugins from a private marketplace declared in a repo's `.claude/settings.json`
- the current daily routine caps

`NOTES.md` records what has since been verified.

## 9. Changing this spec

0. If the change claims an improvement, run an experiment first (LAB-1). If it's a design choice, write a decision record (DOC-2).
1. Edit the requirement here first, and give a new requirement the next free ID in its area. Never renumber.
2. Run a Claude Code session in this repo: *"Update the implementation to match SPEC.md, following BUILD.md. Add tests for changed requirements."*
3. CI passes on all three OSes. Bump the version and update CHANGELOG.md (DIST-2).
4. On each device: `/plugin marketplace update`, then `/harness:setup` if the device floor changed, then `/harness:doctor`.
===== END FILE: SPEC.md =====

===== BEGIN FILE: BUILD.md =====
# BUILD: implement SPEC.md

You are building and maintaining the harness that `SPEC.md` describes. **SPEC.md is the source of truth.** This file covers how to build it: the layout, the rules, the phases and the acceptance tests. When this file and SPEC.md disagree, SPEC.md wins; record the conflict in `NOTES.md`.

Work in this repository only. Nothing counts as done until section 6 passes and you have pasted the output.

---

## 1. Repository layout

This one repo is four things at once: the spec, a plugin marketplace with the `harness` plugin, a lab for experiments, and the documentation.

Files marked *(exists)* were created at kickoff. Keep them, maintain them, and reconcile them with the implementation in phase 10. Everything else you create.

```
claude-harness/
  CLAUDE.md  README.md  SPEC.md  BUILD.md  NOTES.md  CHANGELOG.md  ROADMAP.md  .gitignore   # (exists)
  docs/
    knowledge/  harness-engineering.md loop-engineering.md claude-code-primitives.md research-findings.md sources.md   # (exists)
    guides/     device-setup.md new-app.md adopt-existing-repo.md daily-workflow.md night-shift.md
                updating-the-harness.md running-experiments.md troubleshooting.md                                   # (exists)
    decisions/  README.md TEMPLATE.md 0001..0005                                                                    # (exists)
    archive/KICKOFF.md            # the kickoff file, moved here after unpacking
  experiments/README.md  experiments/_template/README.md                                                            # (exists)
  evals/
    README.md                     # (exists) task format and measures
    run.mjs  compare.mjs  lib/    # LAB-2..LAB-4
    tasks/<id>/task.json + repo/  # the five starter tasks in evals/README.md
    stub/claude-stub.mjs          # fake claude binary for tests
    results/                      # summaries committed; raw/ gitignored
  package.json                    # dev only: "test": "node --test test/"
  .claude-plugin/marketplace.json # name "josep-harness", one entry: harness → ./plugins/harness
  .github/workflows/test.yml      # matrix ubuntu/macos/windows: npm test + claude plugin validate
  plugins/harness/
    .claude-plugin/plugin.json    # name "harness", version "1.0.0", description, author
    hooks/hooks.json              # all hooks, exec form: command "node", args ["${CLAUDE_PLUGIN_ROOT}/scripts/<x>.mjs"]
    scripts/
      lib.mjs                     # shared: read stdin JSON, git helpers, run commands, find default branch
      stop-gate.mjs               # GATE-1, GATE-2, GATE-3
      gate-bash.mjs               # SEC-5
      format-changed.mjs          # GATE-4
      log-bash.mjs                # REC-1
      session-state.mjs           # CTX-5
      notify.mjs                  # best-effort desktop notification, never blocks
      setup.mjs                   # device floor (DEV-3, DEV-6, SEC-1..4, CTX-1, LOOP-6)
      doctor.mjs                  # checks device + current repo against SPEC
      adopt.mjs                   # mechanical half of ADOPT-1/2
      new-app.mjs                 # mechanical half of NEW-1
    agents/planner.md  test-writer.md  implementer.md  reviewer.md     # AGT-1
    skills/
      setup/SKILL.md              # runs setup.mjs, explains changes, suggests /auto-mode-setup
      doctor/SKILL.md             # runs doctor.mjs, explains failures, offers fixes
      brief/SKILL.md              # AGT-2
      verify-done/SKILL.md        # AGT-3
      review-loop/SKILL.md        # REV-5
      adopt/SKILL.md              # ADOPT-1..4 (judgement half)
      new-app/SKILL.md            # NEW-1
    workflows/.gitkeep            # AGT-4: saved workflows land here later
    machine/
      settings.floor.json         # merged into ~/.claude/settings.json
      CLAUDE.personal.md          # SPEC §6.1
      loop.md                     # SPEC §6.6
    templates/
      repo/                       # the committed per-repo layer (NIGHT-3, §5)
        CLAUDE.skeleton.md  AGENTS.md  feature_list.json  progress.md  NIGHT-LOG.md
        docs/briefs/.gitkeep
        .claude/settings.json     # Stop gate + formatter pointing at committed hooks
        .claude/hooks/stop-gate.mjs  .claude/hooks/format-changed.mjs  .claude/hooks/check.mjs  .claude/hooks/lib.mjs
        .claude/agents/reviewer.md
        .github/workflows/ci.yml  .github/workflows/review.yml
        .github/ISSUE_TEMPLATE/defect.yml
        .github/CODEOWNERS.fragment
      app/                        # stack skeleton for new apps (section 3.4)
  test/
    *.test.mjs                    # node:test, no extra deps
    fixtures/
```

There is no `bin/` directory: claude.ai org sync rejects plugins that have one. Keep executables in `scripts/`.

## 2. Rules

1. **Never touch the real home directory.** Every test sets `HOME` and `USERPROFILE` to a temp dir and calls the scripts with an explicit `--home` argument. Only the human runs `/harness:setup` for real.
2. **Verify before use.** Check every settings key, hook field, plugin manifest field and agent or skill frontmatter field against the current docs: code.claude.com/docs/en/settings, /hooks, /plugins-reference, /plugin-marketplaces, /sub-agents, /skills, /auto-mode-config, /scheduled-tasks, /routines, /workflows. If you can't confirm something, leave it out and record it in NOTES.md. SPEC §8 lists the known-unverified items.
3. **Cross-platform (DEV-5).**
   - Write everything in Node ≥ 20 using only built-in modules.
   - Use `path.join`, `os.homedir()` and `child_process.spawnSync(cmd, { shell: true })` for `harness.json` commands.
   - Don't use bash, jq, sed or symlinks.
   - Hooks use exec form so no shell is involved.
   - Normalise line endings when comparing files.
4. **Merge, never overwrite.** Applies to setup, adopt and new-app.
   - Back up before every change.
   - Make every operation idempotent.
   - Print a table of every path and the action taken: ADDED, MERGED, SKIPPED, UPDATED or DRAFTED.
5. **Committed hooks are copies, not imports.** `templates/repo/.claude/hooks/*` must run without the plugin installed, because cloud sessions don't have it. Generate them from `plugins/harness/scripts/` with a build step (`npm run sync-templates`), and have a test fail if they drift.
6. **No network** except package registries and the docs pages in rule 2.
7. **Don't edit SPEC.md.** Propose spec changes in NOTES.md under "Proposed spec changes".
8. **Don't spend tokens in tests.** Nothing in `npm test` may invoke the real `claude` binary. Gate live checks behind env vars (`HARNESS_LIVE=1`, `HARNESS_E2E=1`) and run them only when the human asks.
9. **Docs are part of the product.** A guide that shows a command that doesn't work is a bug. Phase 10 reconciles every guide with the implementation.

## 3. Component notes

These cover only what SPEC.md doesn't already specify.

### 3.1 `hooks/hooks.json`

| Event | Matcher | Script | Notes |
|---|---|---|---|
| SessionStart | `startup\|resume\|compact` | `session-state.mjs` | |
| PreToolUse | `Bash` | `gate-bash.mjs` | |
| PostToolUse | `Bash` | `log-bash.mjs` | `async: true`, if verified |
| PostToolUse | `Edit\|Write` | `format-changed.mjs` | |
| Stop | | `stop-gate.mjs` | `timeout: 600` |
| Notification | | `notify.mjs` | |

All entries use exec form. Confirm the exec-form field names (`command` plus `args`) in the hooks reference.

### 3.2 Scripts

- **`stop-gate.mjs`**
  - Read stdin and `cd` to `CLAUDE_PROJECT_DIR`.
  - Defer per GATE-3: exit 0 if the repo has a committed `.claude/hooks/stop-gate.mjs` and this is the plugin copy. Detect the plugin copy by `CLAUDE_PLUGIN_ROOT` being set.
  - Skip per GATE-2. Find the default branch as `origin/HEAD`, then `origin/main`, then `main`, then `master`; if none exists, compare against HEAD.
  - Run the `check` commands in order. On the first failure, print the GATE-1 message to stderr and exit 2.
- **`gate-bash.mjs`**: parse `tool_input.command` and apply SEC-5. Also match command forms like `git -C x push --force`.
- **`format-changed.mjs`**: Prettier through `npx --no-install` for ts, tsx, js, jsx, json, css and md; `ruff format` for py. Always exit 0.
- **`notify.mjs`**
  - macOS: `osascript`. Linux: `notify-send`. Windows: a non-blocking PowerShell toast only if it can be done without a modal dialog; otherwise do nothing.
  - Never wait on the notification and always exit 0.
- **`setup.mjs --home <dir> [--dry-run]`**
  - **settings.json**: back up `settings.json` and `CLAUDE.md` to `~/.claude/.harness-backup/<ts>/`, then deep-merge `settings.floor.json` into `settings.json`:
    - objects merge;
    - `permissions.*` arrays are concatenated and deduplicated;
    - scalars keep the existing value, except `defaultMode` per SEC-2.
  - **CLAUDE.md**: insert or replace the marker block (CTX-1).
  - **loop.md**: write `~/.claude/loop.md` (LOOP-6). If a different `loop.md` already exists, back it up first.
  - **Device record**: write `harness-device.json` (DEV-6).
  - Don't add hooks to `settings.json`; the plugin supplies them.
  - `--undo` restores the most recent backup after printing a diff.
- **`doctor.mjs [--home <dir>] [--repo <dir>] [--live]`**
  - Print one row per requirement it can check: PASS, FAIL or SKIP, with a one-line fix for each FAIL.
  - Device checks: DEV-1, DEV-3, DEV-6, SEC-1, SEC-2, CTX-1, LOOP-6, DIST-3.
  - Repo checks, when `--repo` is given or the cwd is a git repo: the §5 list. To prove the gate, copy the repo to a temp dir, break the first check by running it with a forced failing command, and confirm `stop-gate.mjs` exits 2.
  - `--live` additionally runs `claude -p` once in a temp repo whose check fails and confirms the Stop hook blocked the turn. This tests the hook as installed from the plugin; an old bug made plugin Stop hooks halt instead of continue.
  - Exit 1 if any MUST fails.
- **`adopt.mjs <repo> [--dry-run]`**
  - Refuse on a dirty tree. Create the `harness/adopt` branch.
  - Copy missing files from `templates/repo/`.
  - Merge `.claude/settings.json`. Append missing CODEOWNERS lines.
  - Draft `.claude/harness.json` per ADOPT-2, marking guessed commands with `"_draft": true`.
  - Never touch an existing `CLAUDE.md`.
  - For existing harness files that differ from the template, print the diff and the status DIFFERS (ADOPT-4). Don't change them.
- **`new-app.mjs <name> --dir <parent> --owner <gh-user> [--no-remote]`**: copy `templates/app/` and `templates/repo/`, rename `CLAUDE.skeleton.md`, replace `OWNER` and `APP_NAME`, run `git init` and the first commit. Unless `--no-remote`, run `gh repo create <name> --private --source . --push`.

### 3.3 Skills

The skills hold the judgement; the scripts do the mechanics.

- Each skill locates its script as `${CLAUDE_PLUGIN_ROOT}/scripts/<x>.mjs`, which Claude Code substitutes in skill content.
- Mark skills with side effects `disable-model-invocation: true`: setup, adopt and new-app.
- **`adopt/SKILL.md`** does steps 2–7 of ADOPT-2 and ADOPT-3: make the checks real and passing, trim CLAUDE.md showing each removed line with its reason, seed the feature list, prove the gate, commit, push and open a PR.
- **`review-loop/SKILL.md`** is about 40 lines.

### 3.4 `templates/app/`

The default stack is **Next.js (App Router) + TypeScript, pnpm, Drizzle + SQLite (better-sqlite3), Vitest, Playwright, ESLint + Prettier**.

It contains:
- `app/api/health/route.ts`, returning `{"ok":true}`;
- a minimal page;
- one unit test and one Playwright smoke test;
- `.claude/harness.json` with check `["pnpm -s typecheck", "pnpm -s lint", "pnpm -s test:unit"]`.

Pin dependency versions with a lockfile. If the human changed the stack line in this section before you started, use theirs.

### 3.5 Lab: `evals/run.mjs` and `evals/compare.mjs`

- **`run.mjs --variant <dir> [--tasks all|a,b] [--runs N] [--label L] [--model M] [--claude-bin path]`**, for each task × run:
  1. Copy `tasks/<id>/repo/` to a temp dir, `git init`, and commit.
  2. Run `<claude-bin> -p "<prompt>" --output-format stream-json --verbose --max-turns <task.maxTurns> --plugin-dir <variant>`, plus flags that isolate the run from the user's settings. Verify the exact flags in the CLI reference (likely `--setting-sources` and `--settings` with a minimal file that sets `permissions.defaultMode` and nothing else). Record the decision in NOTES.md.
  3. Save the transcript to `results/raw/<label>/<task>-<n>.jsonl`.
  4. Run the task's `verify` commands in the temp dir.
  5. Compute the LAB-3 fields:
     - `turns` and `toolCalls` by parsing stream-json;
     - `claimedDone` with a simple heuristic on the last assistant text ("done", "complete", "implemented", "all tests pass"), and document the heuristic;
     - `tampered` by diffing `protected` globs.
  6. Append to `results/<label>.json`.
  7. Print a running cost and token total, and stop if `--budget-usd` is exceeded.
- **`compare.mjs <A> <B>`**: print a Markdown table per task and overall: pass rate, premature-done rate, tamper rate, mean turns, tool calls, tokens or cost, duration, and B−A deltas. Mark differences as "within noise" when runs < 3.
- **`stub/claude-stub.mjs`**: accepts the same flags, reads an env var naming a scenario (`pass`, `premature`, `tamper`), writes the matching file changes in the cwd, and prints canned stream-json including a result message with `num_turns` and usage.
- **Task fixtures:** write the five starter tasks from `evals/README.md`, each with a small repo, a prompt and a verify command. Make sure every verify fails on the untouched fixture: run it and show the output.

### 3.6 GitHub files in `templates/repo/`

- **`ci.yml`**: on push and pull_request, set up Node and pnpm, install, run `node .claude/hooks/check.mjs`. Add a separate e2e job.
- **`review.yml`**: on pull_request (opened, synchronize), run `anthropics/claude-code-action` with `secrets.CLAUDE_CODE_OAUTH_TOKEN` and the REV-1 prompt. Verify its inputs.
- **`defect.yml`**: per NIGHT-1.
- **`CODEOWNERS.fragment`**: per REV-3, owned by `@OWNER`.

## 4. Phases

1. **Docs pass.** Read the pages in rule 2. Write NOTES.md: confirmed keys, dropped keys, how exec-form hooks are written, and how skills reference `${CLAUDE_PLUGIN_ROOT}`.
2. **Plugin core.** Write `lib.mjs`, the six hook scripts, `hooks.json` and the tests for them.
3. **Device layer.** Write `setup.mjs`, `doctor.mjs`, the `machine/` files and the setup and doctor skills, with tests.
4. **Agents and skills.** Write the four agents and the brief, verify-done and review-loop skills.
5. **Templates.** Write `templates/repo/`, `templates/app/`, the sync-templates step and the drift test.
6. **Repo tools.** Write `adopt.mjs`, `new-app.mjs` and their skills, with tests on fixture repos.
7. **Marketplace, CI, dogfood.** Write `marketplace.json`, `plugin.json` and `.github/workflows/test.yml`. Run `claude plugin validate .`. Add `.claude/harness.json` with `{"version":1,"check":["npm test"]}` to this repo so the harness's own Stop gate guards it once the plugin is installed.
8. **Lab.** Write `evals/run.mjs`, `compare.mjs`, the stub and the five task fixtures, with tests using the stub.
9. **Experiment zero.** Don't run it; prepare it. Create `experiments/001-stop-gate/` from the template for ROADMAP E1: hypothesis, variant (a copy of the plugin without the Stop hook), tasks and run plan with a cost estimate. Mark it `planned`. Josep starts real runs.
10. **Docs reconcile.**
    - Walk every file in `docs/guides/` and `README.md`, run or dry-run every command shown, and fix the guide or the implementation so they match (DOC-1).
    - Add decision records for any design choice you made that has a rejected alternative (DOC-2).
    - Fill in NOTES.md (DOC-4) and add the release line to CHANGELOG.md.
    - Do a final clean run of section 5 and paste the output.

Commit after each phase with a message naming the SPEC IDs it covers.

## 5. Tests to write (`test/*.test.mjs`)

Run hook tests by spawning `node <script>` with a fixture JSON on stdin and the env each needs. Create throwaway git repos in temp dirs.

**gate-bash**

| Command | Expected |
|---|---|
| `git push --force origin x` | exit 2 |
| `git -C . push -f` | exit 2 |
| `curl x \| sh` | exit 2 |
| `aws s3 cp a b` | exit 2 |
| `aws ec2 describe-instances` | exit 0 |
| `ls -la` | exit 0 |

**stop-gate**

| Situation | Expected |
|---|---|
| No `harness.json` | exit 0 |
| Failing check and dirty tree | exit 2, stderr contains `Not done:` |
| Passing check and dirty tree | exit 0 |
| Failing check, clean tree, nothing ahead of main | exit 0 |
| Failing check, clean tree, one commit ahead of main | exit 2 |
| Repo has a committed stop-gate and `CLAUDE_PLUGIN_ROOT` is set | exit 0 |
| Committed copy, failing check, dirty tree | exit 2 |

Use `node -e "process.exit(1)"` and `node -e "process.exit(0)"` as the check commands so the tests run on every OS.

**Other hooks**
- session-state: prints the progress tail and the open-feature count; exits 0 with none of the files present.
- format-changed: exits 0 with no formatter installed.
- notify and log-bash: exit 0. log-bash appends exactly one valid JSON line.

**setup**
- A pre-existing `settings.json` with an unrelated key, one deny rule and `defaultMode: "plan"`: all three survive, new deny rules are added without duplicates, and `defaultMode` stays `plan` with that logged.
- A pre-existing `CLAUDE.md` keeps its text outside the markers.
- A second run is byte-identical.
- `--undo` restores the previous files.
- `--dry-run` writes nothing.

**doctor**
- On a fresh temp home: device MUSTs FAIL and the exit code is 1.
- After setup on the temp home, with git, node and gh present: device rows PASS.
- On a repo generated by new-app: every repo row PASSes, including the proven gate.

**adopt**, on three fixture repos:
1. Node repo with `lint` and `test` scripts, `pnpm-lock.yaml`, a 120-line CLAUDE.md, and `.claude/settings.json` holding one unrelated hook:
   - CLAUDE.md is byte-identical afterwards;
   - the unrelated hook survives;
   - `harness.json` is DRAFTED with pnpm lint and test;
   - missing files are ADDED;
   - a second run is byte-identical, apart from DIFFERS rows;
   - `--dry-run` leaves `git status` empty.
2. Python repo with ruff and pytest in `pyproject.toml`: the draft contains `ruff check` and `pytest`.
3. Dirty tree: non-zero exit, nothing changed.

**new-app**
- `--no-remote` into a temp dir produces a repo where `OWNER` is replaced everywhere.
- The committed stop-gate blocks on a broken check and passes on a fixed one.
- Run `pnpm install` and the checks only when the `HARNESS_E2E=1` env var is set, so the default CI stays fast.

**templates**
- The drift test: each committed hook in `templates/repo` matches its generated source.

**marketplace**
- `claude plugin validate .` passes. Run it in CI if `claude` is installable there; otherwise note it in NOTES.md and run it locally.

**lab**
- With `--claude-bin` pointing at the stub, one run per scenario on one fixture task:
  - `pass` → passed true, prematureDone false;
  - `premature` → passed false, claimedDone true, prematureDone true;
  - `tamper` → tampered true.
  - Turns and tool calls are parsed from the canned stream-json.
  - Raw output lands under `results/raw/`; the summary is valid JSON.
- `compare.mjs` on two stub labels prints a table with every LAB-3 column and the deltas.
- Every task fixture's verify fails on the untouched fixture.
- Each task's `task.json` validates against the format in `evals/README.md`.

**docs**
- A test parses `README.md` and fails if any guide in `docs/guides/` isn't linked, or if any relative link is broken.

## 6. Definition of done

- `npm test` passes locally, with no real `claude` invocation. CI passes on ubuntu-latest, macos-latest and windows-latest.
- `claude plugin validate .` passes.
- Installed locally with `claude --plugin-dir ./plugins/harness`, `/harness:doctor --home <temp>` runs and prints its table.
- NOTES.md is complete: confirmed keys, dropped keys, deviations and proposed spec changes.
- Every guide matches the implementation (phase 10), and README links them all.
- `experiments/001-stop-gate/` is prepared and marked `planned`.
- Nothing written outside this repo or the temp dirs, and nothing pushed.

## 7. What the guides must cover

The guides already exist in `docs/guides/`. Keep them true to the implementation, and make sure they cover at least the following.

**First device, or any new device (any OS)**
1. Install Git (Git for Windows on Windows), Node ≥ 20, `gh` and Claude Code.
2. Run `gh auth login`, then `gh auth setup-git`.
3. In Claude Code:
   ```
   /plugin marketplace add <you>/claude-harness
   /plugin install harness@josep-harness
   ```
   Then enable auto-update under `/plugin` → Marketplaces.
4. Run `/harness:setup`, then `/auto-mode-setup`, then `/harness:doctor`. Optionally run doctor with `--live` once.

**New app**
- Run `/harness:new-app <name>`.
- Then do the manual steps: `claude setup-token`, `gh secret set CLAUDE_CODE_OAUTH_TOKEN`, and the ruleset on main (REV-2).

**Existing repo**
- Open Claude Code in the repo and run `/harness:adopt`.
- Review the PR, especially CLAUDE.md and `harness.json`, and merge it yourself.

**Night shift**
- Only on repos where doctor shows the repo as harnessed.
- Run `/schedule` with the prompt from SPEC §6.7, at a minute other than :00.

**Updating the harness**
1. Edit SPEC.md.
2. Run a session with *"Update the implementation to match SPEC.md, following BUILD.md."*
3. CI passes. Bump the version and update CHANGELOG.md, then push.
4. On each device: `/plugin marketplace update josep-harness`, then `/harness:setup` if the device floor changed, then `/harness:doctor`.
5. In existing repos, re-run `/harness:adopt` to see the DIFFERS rows.

**Uninstall**
- Run `node <plugin>/scripts/setup.mjs --undo`.
- Then `/plugin uninstall harness@josep-harness`.
===== END FILE: BUILD.md =====

===== BEGIN FILE: ROADMAP.md =====
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
===== END FILE: ROADMAP.md =====

===== BEGIN FILE: NOTES.md =====
# Notes

Working notes kept by the agents that build this repo. Keep entries dated.

## Verified against docs
| Key / field / command | Doc page | Date | Result |
|---|---|---|---|

## Dropped (couldn't verify)
| Item | Why | Date |
|---|---|---|

## Deviations from BUILD.md
-

## Proposed spec changes
-

## Open questions for Josep
-
===== END FILE: NOTES.md =====

===== BEGIN FILE: CHANGELOG.md =====
# Changelog

Every released change bumps `version` in `plugins/harness/.claude-plugin/plugin.json`. Devices only receive versions that changed.

## Unreleased
- Initial spec, build plan, knowledge base, guides and decision records.
===== END FILE: CHANGELOG.md =====

===== BEGIN FILE: .gitignore =====
node_modules/
evals/results/raw/
.tmp/
*.log
.DS_Store
===== END FILE: .gitignore =====

===== BEGIN FILE: docs/knowledge/harness-engineering.md =====
# Harness engineering: concepts

Distilled from FairMind Academy's *Harness Engineering with Claude Code* workshop (Alexio Cassani), with the sources it cites. The workshop's companion repo is `FairMind-Gen-AI-Studio/he-workshop`; it has no open licence, so nothing here is copied from it.

## The plateau

Teams adopt coding agents, enthusiasm stays, and results stop improving. The deck's explanation is that **trust is a ceiling**: work is delegated only as far as trust reaches. A team that checks every generated line has already capped what its agents can take on, whatever the model could do. Signals it cites (Stack Overflow 2025, DORA 2025, GitClear 2026; not re-verified here):
- usage and belief run ahead of trust;
- duplicated code rises while refactoring and cross-file reuse fall as the AI-written share grows.

Symptoms to look for in your own setup:
- the agent reports work as finished when it isn't;
- review has become the bottleneck;
- it duplicates code instead of reusing it;
- you fix things by hand and the same failure comes back.

## Agent = model + harness

"A harness is every piece of code, configuration, and execution logic that isn't the model itself" (Vivek Trivedy, *The Anatomy of an Agent Harness*, LangChain 2026). It has five components:

1. **System prompt and context**: the instructions assembled before your prompt, including CLAUDE.md, rules, memory and skill descriptions.
2. **Tools and their descriptions.** A description is prompt material and steers how a tool gets used.
3. **Infrastructure**: filesystem, sandbox, browser, container. It decides what is possible and what is safe to attempt.
4. **Orchestration**: subagents, handoffs, routing between models, context management.
5. **Hooks and middleware**: the only component that acts without being asked, which makes it the place for determinism inside a stochastic system.

The core of the harness (tool schemas, edit format, prompt shape) is co-trained with the model by the lab, and you don't operate that loop. What you control are the **additive layers** around that core: contract, skills, hooks, permissions, MCP, telemetry.

## Four roles: the 5 × 4 matrix

Each harness artifact plays one of four roles:

| Role | When it acts | What it does |
|---|---|---|
| **Guide** | before the action (feedforward) | raises the odds of a good first attempt |
| **Sensor** | after the action (feedback) | notices a bad attempt |
| **Boundary** | always | makes an action impossible, whatever the model decides |
| **Record** | after the fact | leaves evidence |

Birgitta Böckeler (martinfowler.com, 2026) adds a second axis:
- **Computational**: deterministic; a script decides. Examples: linter, tests, devcontainer.
- **Inferential**: a model judges. Examples: CLAUDE.md conventions, AI review.

Each kind has a weakness when you lean on it alone. A computational rule misses semantics, a sensor acts only after the fact, a guide can be ignored, and an inferential judgment drifts from run to run.

The 20 cells, with typical Claude Code implementations:

| | Guide | Sensor | Boundary | Record |
|---|---|---|---|---|
| **Prompt & context** | CLAUDE.md, rules, definition of done | "run the tests before reporting done" | context exclusions (paths, secrets) | session transcripts |
| **Tools** | skill and tool descriptions | error messages that teach the retry | allow/deny permission rules | tool-call log |
| **Infrastructure** | devcontainer, start script | tests, types, lint runnable in place | sandbox, egress firewall, no prod creds | snapshots, build artifacts |
| **Orchestration** | subagent role definitions | critic subagent on fresh context | per-subagent tool scoping | per-agent journals, handoffs |
| **Hooks** | SessionStart injecting state | post-edit lint/test hook | pre-action deny hook | telemetry hook |

The hooks row is the only one with strong native entries in all four columns. A hook is the general mechanism for placing something computational at any point in the loop.

### Diagnosis in an hour

1. List every **deliberate** artifact. Defaults don't count.
2. Place each one in its cell. If an artifact resists placement, split it by function.
3. Mark each entry computational or inferential.
4. Read the grid by column, asking four questions:
   - What raises the odds of a good first attempt?
   - What notices a bad one?
   - What can't the agent do even if it tries?
   - What survives as evidence?
5. Name every empty cell as either a decision or an accident.

The usual shape: guides are full, and often the instruction file is the only thing there. Sensors are half full: tests exist but aren't wired to the end of a session. Boundaries are empty, or "I approve by hand", which is a human being used as a firewall. Records are empty, and nobody decided that. The work is filling the two right-hand columns.

## Routing a rule: instruction, skill or hook?

Ask three questions, in this order:

1. **If the agent ignores this, what does it cost?**
   - If the cost is unacceptable (money, data, production, compliance), make it a **hook or permission rule**. Don't *also* write it as an instruction as if that were the control.
   - If the cost is recoverable, continue to question 2.
2. **Does every session need it?**
   - Yes: put it in **CLAUDE.md**, or in a path-scoped rule if it applies to only part of the tree.
   - No: make it a **skill**, which loads on demand and costs one description line until used.
3. **Can the agent work it out from the code?** If yes, **write nothing**. That's the line that costs tokens and returns nothing.

When the agent gets the same thing wrong twice, move the answer up one level.

The trap: writing a sentence takes thirty seconds and changing a scope takes a discussion, so people route most failures to an instruction. But a sentence only raises a probability. If the failure is irreversible, raising a probability isn't an answer.

## The contract (CLAUDE.md)

What usually fails is the overview, not the instructions.

| Cut | Keep |
|---|---|
| Directory layouts | Gotchas you pay for only once |
| Dependency lists | The reason behind a choice that looks odd |
| Architecture overviews | Conventions no file declares |
| File-by-file descriptions | Which command to use, which not to, and why |
| Anything readable from the code | What "done" means here |

The workshop's reference contract is 32 lines; aim for 30 to 45. For each criterion in the definition of done, write who holds it: the file, a hook, or the human.

The definition of done comes in **three layers**:
1. The contract *states* it.
2. A skill *runs* it: one row per criterion, failures quoted verbatim.
3. A Stop hook *holds* it when nobody is watching.

Only the third works unattended.

### How scopes resolve in Claude Code

- **CLAUDE.md** is additive: every level loads and contributes.
- **Settings**: the higher scope overrides; list values concatenate.
- **Permissions** merge from all scopes, then deny beats ask beats allow.
- **Hooks**: all of them fire, from every source, with no precedence.
- **Skills** override by name. The deck says this runs in reverse order to the other scopes; not verified.

## Boundaries

### The lethal trifecta (Simon Willison)

Each leg alone is inert. The danger is where all three meet:
- access to private data,
- exposure to untrusted content (issues, PR comments, web pages, MCP tool output, dependency READMEs),
- an outbound channel (network, git push, PR comments, files CI reads).

Keep the circles apart with read-only scoped tokens, isolated context for fetched content, an egress allowlist, and one workspace per task.

### Rings of enforcement

A prohibition holds only at the ring that enforces it:

1. **Instruction**: enforced by nothing; the model chooses.
2. **Permission rules**: enforced in-process by Claude Code; covers tool calls and recognised shell commands.
3. **OS sandbox**: covers Bash and its child processes.
4. **Container with an egress allowlist**: covers every process inside it.

The rings stack; each catches what the one inside lets through. The container protects the host. The **egress policy** protects everything else. The workshop's firewall script refuses to report itself ready until it has proved that an unlisted host fails and a listed host answers. A component that declares itself active without proof has demonstrated nothing.

### Tool design is a security surface

Entity-shaped tools (one per object, 70+ tools) make the agent walk the graph, burning context, and silently miss gaps. Workflow-shaped tools (under 30, one call returns the needed context) can report what they *didn't* find. Prefer tools that make absence explicit.

## Hooks: four patterns

| Pattern | Event | Does |
|---|---|---|
| **Gate** | PreToolUse | allow, ask, deny or rewrite before anything runs; the only one that *prevents* |
| **Invariant** | PostToolUse, Stop | restore what every change must keep true; can't undo |
| **Loop** | Stop | block the turn until the check passes; capped at 8 consecutive blocks |
| **Record** | any, async | append-only evidence; runs beside a gate so denied attempts are logged too |

The runtime guarantees only *when* a hook fires. What it guarantees depends on what you put inside it: a command wired to a real check guarantees; a prompt or agent handler judges.

Design rules for gates:
- **Classify, don't enumerate.** For the AWS CLI: deny credential reads outright, let read-only verbs pass silently, and send everything else to `ask`.
- **The gate never grants.** It denies or asks; the permission rules decide the rest.
- **Test the verb, not the flag.** A secret stored as a String comes back in clear without `--with-decryption`.
- **An `ask` from a hook forces a real prompt**, even in auto mode.

Rules for running hooks:
- Sibling hooks on one event run **in parallel, in no order**, so steps that depend on each other go in one script.
- A Stop loop earns trust from an external signal. A reason built from a test runner's output can't be argued with; asking the model whether it's satisfied lets it talk itself into stopping.
- The cap of 8 consecutive blocks admits that repeating the same feedback stops helping. At that point, escalate: try a different model or step in yourself.

## Instruments

- **Watch a suite fail before you trust it.** A check that has never been red proves nothing.
- Build an **eval set on your own repository**: fixed tasks, executed checks, repeatable runs. This repo's `evals/` does that for harness variants.
- Adversarial tests target the harness itself: mutate a hook and confirm the suite goes red.

## What to do first

Pick three empty cells ranked by **risk**: the cost of what gets through while the cell is empty, not how empty it looks. Fill those, not a list of good intentions.
===== END FILE: docs/knowledge/harness-engineering.md =====

===== BEGIN FILE: docs/knowledge/loop-engineering.md =====
# Loop engineering: concepts

Distilled from FairMind Academy's *Loop Engineering with Claude Code* workshop (fairmind-coding plugin v0.2.89) and the related Claude Code docs.

## The thesis

Every agent already runs a loop; few loops are designed. **Loop engineering** means deciding what repeats, what stops it, who checks the result and what the next run remembers, around a model you don't control.

- The prompt is one turn; **the loop is the product**. What ships is decided by when the agent stops and who agreed it could.
- Leave a part out and the model fills the gap. With no exit condition, the agent decides it's done. With no verifier, the maker grades its own work.
- **Autonomy is earned one ring at a time.** Each ring removes a decision a person used to make by hand. Add it once the ring inside has earned trust.

## Four parts, and the model owns none of them

| Part | Question | Examples |
|---|---|---|
| **Trigger** | what starts a pass | you typing, a clock, a turn that ended too early, a GitHub event; it decides how often you pay |
| **Exit** | what stops it | a condition checked by something other than the maker |
| **Verifier** | who says it's right | an executed check, a second model, a person; the further from the maker, the more its green is worth |
| **Memory** | what the next run knows | a state file, an issue, a PR thread; without it every run starts cold |

The recurring question is **who enforces the exit?** A sentence in a prompt persuades. A hook, a check or a branch rule refuses.

## The five rings

### Ring 1: the agentic loop (seconds)

Model → tool → result, repeated. Hooks are the harness's hands inside it: before a tool, after a tool, at the end of the turn. A Stop hook exiting with code 2 keeps the turn open, and no wording gets around it.

*Exercise:* run a task headless with `claude -p "<task>" --output-format stream-json --verbose > run.jsonl`. Count the `tool_use` blocks; the final result line carries `num_turns`. Find the last assistant message with no tool call, which is the moment the agent decided to stop. Who chose it?

### Ring 2: `/loop`, the clock (minutes)

Repetition without a condition of its own.

- `/loop 5m <prompt>` runs on a fixed interval. Use it when the thing you watch changes at a known pace.
- `/loop <prompt>` is self-paced: Claude picks a wait between 1 minute and 1 hour after each pass.
- A bare `/loop` runs `.claude/loop.md` or `~/.claude/loop.md`, or the built-in maintenance prompt.
- Each pass runs in the same conversation, so it remembers the last one for free.
- A loop lives in the session. It fires only while Claude Code is open and idle (backgrounding carries it over) and expires after 7 days.
- Match the interval to how fast the state changes. Checking a 12-minute pipeline every minute buys identical answers.

**A stop written in the prompt is a wish.** "Stop when it's green" is an instruction the maker interprets. Rule of thumb: use `/loop` to watch something that changes on its own, and a condition when the loop's own work is what has to finish.

Example from the deck: a production fix whose interval widens after every quiet check, resets on any regression, and stops when the incident closes.

### Ring 3: `/goal` and contract loops (hours)

**`/goal <condition>`** adds an exit condition the maker doesn't judge. After every turn, a small fast model (Haiku by default) reads the transcript and decides whether the goal is met, not yet met, or impossible.
- **The judge reads; it doesn't run.** It decides from what the session shows, not by running your tests.
- Cheap and quick, and still a model's opinion. Use it where a wrong "done" is cheap to undo.

**An executed gate** (FairMind's `/fairmind-loop`) is slower to set up. Its verdict is an exit code, and a person signs off. The contract comes before the code:

1. **Design brief**: where each invariant lives and which existing pattern in the codebase puts it there, plus what is out of scope. It's a plan, never a retrospective.
2. **Criteria derived from the brief**, not from the ticket's sentences. Each criterion names the check that covers it.
3. **Checks written by a non-implementer**: functional, metric, performance, static or evidence. The lead classifies and delegates, and never writes a check itself.
4. **Admission.** Every check must prove it can fail: red on today's code, or red when its target is mutated. A failing check goes to quarantine, neither accepted nor hidden.
5. **Budget you confirm**: iterations, a cap on consecutive failures, wall-clock time. Nothing runs before you confirm.

The engine refuses to start when:
- there are no criteria;
- a hard criterion has no admitted check;
- the brief file is missing;
- admission admitted nothing.

**The gate runs at every close.** A path outside the declared scope fence is a terminal stop, not a red, and costs no budget.

**A green gate isn't proof.** The deck's case: coverage 1.0, 0 of 8 iterations spent, every check green on first evaluation, and the shipped code was wrong. The contract pinned validation at the HTTP boundary and left the store behind it open, and no criterion named the store. Coverage measures coverage, not correctness.

**Green answers only one of two questions.**
- *Does it work?* The gate closes this mechanically: green on three consecutive evaluations, using checks that passed admission and were red first.
- *Is it the right work?* This stays open until a reviewer who owns no check records a verdict against the brief, followed by the final human gate.

Install: `/plugin marketplace add FairMind-Gen-AI-Studio/fairmind-plugins-public` then `/plugin install fairmind-coding@fairmind-plugins`. Answer "no" to the Fairmind workspace question. `/harness-audit` scores loop readiness. The plugin is MIT-licensed.

### Ring 4: the review loop (a day)

A PR isn't delivered when it opens. Before opening it, while the branch is still yours, do a cross-model read and a simplification pass.

Three ways a review loop lies:
1. **The verdict and the findings live in two places.** The summary comment carries the verdict and the per-line findings are separate inline comments. Reading only one is the usual miss.
2. **A review that took fifteen seconds probably reviewed nothing.** The action can skip when its workflow file differs from the default branch, and still exit green. Read its log.
3. **Findings about lines you've since changed lose their anchor** when a later push moves them. Read the original line too.

Weigh every finding and answer all of them:
- **Fix what is real**, after reproducing it. A reviewer usually reads without running, so a finding can be wrong about behaviour it inferred.
- **Reply to the rest** on the PR, saying why. That helps the next reviewer, human or agent.

**Maker isn't checker, one level up.** The model that wrote the diff is its worst reader. A different model or vendor reads what you wrote rather than what you meant.

### Ring 5: the dogfooding loop (nights and weeks)

Every defect you hit becomes work a routine picks up tonight.

**A defect is an issue, not a paragraph**, filed the moment it happens:
1. A **stable key** derived from what broke: repository, `file::symbol` without the line number, and a failure shape from a closed list.
2. **Deduplicate before filing, including closed issues.** Open issues are a small, changing minority; scanning only those re-files what was already fixed.
3. A **Reproduce block, verbatim**: the exact command, expected vs actual, evidence pasted rather than paraphrased.
4. **Filed against the code that has to change**, not where you noticed it. A defect spanning two repos is two linked issues.
5. **Said out loud too.** A workaround nobody mentions is a defect that ships.

**Night-shift rules.** The routine runs with nobody watching, so each rule is one it would otherwise talk itself out of:
- **No choosing.** Selection follows a written order (severity, then age), and the routine shows what it picked before touching code.
- **Reproduce first.** A report isn't a spec. Some issues are already fixed, and only running the reproduction shows that.
- **Agents for context, never for speed.** Wait for subagents before the run ends; one still working at the end is a run that reports success having done nothing.
- **Close by merge, not by opinion.** The PR says `Fixes #n`, and the issue closes when the fix merges.

**Merging without a person, and what enforces it.** A routine acts as your GitHub user, so GitHub can't tell a PR's author from its merger. Enforce where GitHub can see it:
- **The routine checks:** review finished, every finding answered, checks green on the head commit, diff inside the paths the issue named.
- **GitHub enforces:** required status checks and required code-owner review.
- **Stays human:** security paths, migrations, public APIs, anything irreversible. Put these in CODEOWNERS with a named person, and make CODEOWNERS itself owned by a person.

This harness's choice is stricter: **agents never merge** (SPEC REV-4).

## What to do on Monday (from the deck)

1. **Count one turn** (10 min): run your most common task headless and count the tool calls. It's the baseline for everything else.
2. **Put one watch on a clock** (30 min): the next pipeline you'd refresh by hand. `/loop` it with a stop, then ask whether it should be a routine.
3. **Put one task behind a condition** (half a day): `/goal` where a wrong "done" is cheap, an executed gate where it ships. Six iterations, not twenty.
4. **Make the review loop a skill** (1 hour): wait, read both channels, answer everything.
5. **Open the defect queue** (1 hour): an issue template with the key and Reproduce block, and one routine that works it at night.

## What loops don't do

- **No judgment.** A loop converges on its exit condition. If the condition is wrong, everything is consistent and wrong.
- **No free trust.** Every ring you automate is a decision you stop seeing.
- **No prose enforcement.** An instruction can be argued away; only a hook, a check or a branch rule refuses.

## Agents prompting agents

The contract-before-code loop maps onto a pipeline of roles:

```
you (one line) → planner (brief) → test-writer (red tests) → implementer (green, in fence) → reviewer (verdict) → you (merge)
```

Three ways to run it in Claude Code:

| Mechanism | Who holds the plan | Use when |
|---|---|---|
| Skill + subagents | Claude, turn by turn | the default; cheapest |
| Dynamic workflow | a script Claude writes (`agent()`, `pipeline()`, `parallel()`) | many independent items; cross-checked results; repeatable |
| Agent team | a lead session plus messaging teammates | debugging with competing hypotheses; cross-layer research |

Safety holds across handoffs:
- When a workflow script writes a prompt for a subagent, auto mode doesn't treat it as a request from the user.
- A message from one agent can't approve a permission prompt for another.
===== END FILE: docs/knowledge/loop-engineering.md =====

===== BEGIN FILE: docs/knowledge/claude-code-primitives.md =====
# Claude Code primitives: reference

What the harness is built from. Facts were checked against code.claude.com/docs between 2026-09-28 and 2026-10-02. Features change quickly, so re-check before relying on a detail and update `NOTES.md` when something changes. Version floors are given where the docs state them.

## Permissions and auto mode

- **Modes:** `default` (manual), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. Cycle with Shift+Tab.
- **Rules:** `permissions.allow`, `ask` and `deny` use the syntax `Tool(pattern)`, e.g. `Bash(git push *)` or `Read(**/.env)`. Deny is evaluated before everything else and can't be overridden by hooks or the classifier. An explicit `ask` rule forces a prompt even in auto mode.
- **Auto mode:** a classifier reviews each tool call and blocks irreversible, destructive or outbound actions.
  - `defaultMode: "auto"` and the `autoMode` block are read only from **user settings, managed settings or `--settings`**, never from project files, so a repo can't grant itself autonomy.
  - `autoMode.environment` describes trusted infrastructure in prose. Keep `"$defaults"` in each list, because omitting it replaces the built-in rules.
  - `/auto-mode-setup` drafts the entries (needs v2.1.228+ and a Pro, Max or Team plan).
  - Inspect with `claude auto-mode defaults`, `config` and `critique`; start over with `reset`.
  - `autoMode.classifyAllShell: true` routes every shell command through the classifier.
  - Denials are listed in `/permissions` → Recently denied.
- **Sandbox:** `/sandbox`, and `sandbox.enabled`. Bash and its children run with only the working directory writable and network access through an allowlist proxy. Sub-keys for the network and credentials weren't verified here.

## Hooks

- **Events:**
  - session: `SessionStart` (matchers startup, resume, clear, compact, fork), `SessionEnd`
  - prompts: `UserPromptSubmit`, `UserPromptExpansion`
  - tool calls: `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`
  - turn end: `Stop`, `StopFailure`
  - subagents and tasks: `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `TeammateIdle`
  - context: `InstructionsLoaded`, `PreCompact`, `PostCompact`
  - files and config: `ConfigChange`, `CwdChanged`, `FileChanged`, `DirectoryAdded`, `WorktreeCreate`, `WorktreeRemove`
  - other: `Notification`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`, `MessageDisplay`, `Setup`
- **Handler types:**
  - `command` (shell form, or **exec form** with an `args` array that spawns without a shell)
  - `http`
  - `mcp_tool`
  - `prompt`: a single LLM call returning `{"ok": bool, "reason": ...}`
  - `agent`: experimental; multi-turn with tools
- **Exit codes:** 0 means no objection (stdout from SessionStart and UserPromptSubmit becomes context). **2 blocks**, with stderr fed back. Any other code is a non-blocking error.
- **Structured output:**
  - PreToolUse: `hookSpecificOutput.permissionDecision` = allow, deny, ask or defer.
  - Stop and PostToolUse: `decision: "block"`.
  - `additionalContext` goes inside `hookSpecificOutput`.
- **Matchers** are regex on the tool name, e.g. `Edit|Write` or `mcp__github__.*`. The `if` field filters with permission-rule syntax, e.g. `"if": "Bash(git *)"`, but only on tool events and only best-effort. Use permissions for hard rules.
- **All matching hooks run in parallel.** For PreToolUse the most restrictive decision wins: deny, then defer, then ask, then allow.
- **Stop hook cap:** after 8 consecutive blocks without progress, Claude Code overrides the hook. The input field `stop_hook_active` tells the hook a continuation is already in progress.
- **Timeouts:** command, http and mcp_tool 10 min; prompt 30 s; agent 60 s; `SessionEnd` 1.5 s total.
- **Environment:** `CLAUDE_PROJECT_DIR` is available. `CLAUDE_ENV_FILE` lets SessionStart or CwdChanged persist env vars.
- **Platform shells:** shell-form hooks run with `sh -c` on macOS and Linux, and Git Bash (or PowerShell if Git Bash is absent) on Windows. Exec form avoids the shell entirely.
- Browse configured hooks with `/hooks`; it's read-only.

## Memory and context

- CLAUDE.md files at the managed, user (`~/.claude/CLAUDE.md`), project and local levels are all loaded additively. Subdirectory CLAUDE.md files load lazily on first read there. `.claude/rules/*.md` with a `paths:` field load when a matching file is touched.
- Skill names and descriptions load at session start; bodies load on demand. MCP tool definitions are deferred until searched.
- On compaction the conversation is summarised and the project contract re-injected. On-demand material returns only when touched again. A SessionStart hook with the `compact` matcher can re-inject state.

## Skills, subagents, plugins

- **Skills** live at `~/.claude/skills/<name>/SKILL.md` or `.claude/skills/`. Frontmatter includes `name`, `description`, `disable-model-invocation`, `allowed-tools`, `model`, `context: fork`, and hooks. Bundled skills include `/batch`, `/verify`, `/deep-research` (a workflow) and `/workflow-authoring`.
- **Subagents** live at `~/.claude/agents/*.md` or `.claude/agents/`. Frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`, `effort`, `background`, `isolation: worktree`. Each runs on its own context and returns a summary. `CLAUDE_CODE_SUBAGENT_MODEL` sets the default model.
- **Plugins** bundle skills, agents, hooks (`hooks/hooks.json`), commands, MCP and LSP servers, output styles, **workflows** and monitors.
  - Components are namespaced as `plugin:name`.
  - `${CLAUDE_PLUGIN_ROOT}` is the install path and changes on update; `${CLAUDE_PLUGIN_DATA}` is persistent across updates.
  - **A plugin's `settings.json` honours only `agent` and `subagentStatusLine`**: plugins can't set permissions, env or sandbox.
  - A `CLAUDE.md` at the plugin root is **not** loaded.
  - No top-level `bin/` if you want claude.ai org sync.
  - Validate with `claude plugin validate <dir>`. Try one locally with `claude --plugin-dir <dir>`.
- **Marketplaces** are a repo with `.claude-plugin/marketplace.json` (`name`, `owner`, `plugins[]` with `source` such as `"./plugins/x"`).
  - Add with `/plugin marketplace add owner/repo`; install with `/plugin install <plugin>@<marketplace>`.
  - Private repos use the machine's git credentials, non-interactively (`gh auth login` plus `gh auth setup-git`).
  - Auto-update is **off by default** per marketplace; enable it in `/plugin` → Marketplaces. Otherwise use `/plugin marketplace update <name>`.
  - Users receive a new copy only when `version` changes. Omit `version` to track commits.

## Autonomy

- **`/goal <condition>`** (v2.1.139+): a session-scoped, prompt-based Stop hook.
  - After each turn the small fast model (Haiku default) judges the condition from the transcript only; it never runs commands.
  - The condition can be up to 4,000 characters. `/goal` shows status (turns, tokens, the last reason); `/goal clear` stops it.
  - The goal is restored on `--resume` or `--continue`. Works with `-p`.
  - Needs workspace trust and hooks enabled.
- **`/loop`** is session-scoped scheduling.
  - `/loop 5m <prompt>` (units s, m, h, d) runs on cron. `/loop <prompt>` is self-paced (1 min to 1 h).
  - A bare `/loop` uses `.claude/loop.md`, then `~/.claude/loop.md`, then the built-in maintenance prompt.
  - Recurring tasks expire after 7 days; a session holds up to 50 tasks; jitter is up to 30 min. Esc stops a self-paced loop.
  - Runs only while the session is open and idle; backgrounding carries it over.
  - The Monitor tool streams events instead of polling.
- **Scheduling options:**
  - **cloud routines**: no machine needed; fresh clone; minimum interval 1 h; no prompts
  - **desktop scheduled tasks**: your machine; local files; minimum interval 1 min
  - **`/loop`**: session-scoped
- **Background sessions and agent view** (research preview):
  - `claude agents` is the dispatch and monitor screen. `claude --bg "<prompt>"` and `--name` start a session in the background; `/bg` or ← on an empty prompt sends the current one there; `/fork` copies the conversation into a new background session.
  - `claude attach|logs|stop|respawn|rm <id>` manage a session; `claude agents --json --all` gives its state as JSON.
  - Each session moves into its own worktree under `.claude/worktrees/` before editing, commits and pushes its branch, can open a draft PR, never pushes to main.
  - Each session draws on quota independently.
- **Routines** (research preview): saved prompt plus repos, environment, connectors and triggers.
  - Triggers: schedule (hourly minimum), API (`/fire` with a bearer token), GitHub events (pull_request, release).
  - Create with `/schedule` or at claude.ai/code/routines. They run as you, push to `claude/` branches, and include all connectors by default (remove the ones you don't need). A green run status means only that the run exited cleanly.
  - Daily run cap per account; Anthropic's launch post said Pro 5 and Max 15. Check the live counter.
- **Dynamic workflows:** JavaScript orchestrating subagents.
  - Trigger with the `ultracode` keyword or "use a workflow", or set `/effort ultracode` for the whole session.
  - Watch and save runs in `/workflows`: press `s` to save to `.claude/workflows/` or `~/.claude/workflows/`, and the run becomes `/<name>`.
  - The script API is `agent()`, `pipeline()`, `parallel()`, `phase()`, `log()` and `args`, with an optional `schema` for JSON output.
  - Limits: 16 concurrent agents, 1,000 per run, `Date.now()`/`Math.random()` throw.
  - Size guideline defaults to small on Pro. On Pro, enable workflows in `/config`.
- **Agent teams** (experimental): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
  - A lead plus teammates with a shared task list and messaging. Start with 3–5 teammates.
  - Quality gates via the `TeammateIdle`, `TaskCreated` and `TaskCompleted` hooks.
  - Limits: no resume of in-process teammates, one team per session, no nesting.

## Headless and CI

- `claude -p "<prompt>"` runs non-interactively. Useful flags: `--output-format stream-json --verbose`, `--max-turns`, `--plugin-dir`, `--settings`, `--setting-sources`, `--permission-mode`. The final result message carries `num_turns`, usage and cost fields. Verify the field names before parsing them.
- **GitHub:** `anthropics/claude-code-action`. Create a subscription token with `claude setup-token` and store it with `gh secret set CLAUDE_CODE_OAUTH_TOKEN`.
===== END FILE: docs/knowledge/claude-code-primitives.md =====

===== BEGIN FILE: docs/knowledge/research-findings.md =====
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
===== END FILE: docs/knowledge/research-findings.md =====

===== BEGIN FILE: docs/knowledge/sources.md =====
# Sources

## Workshops
- FairMind Academy, *Harness Engineering with Claude Code*, Alexio Cassani, 2026 (slides). Companion repo: https://github.com/FairMind-Gen-AI-Studio/he-workshop (book companion; no open licence)
- FairMind Academy, *Loop Engineering with Claude Code*, 2026 (slides). Template: https://github.com/FairMind-Gen-AI-Studio/loop-engineering-workshop
- fairmind-coding plugin (MIT): https://github.com/FairMind-Gen-AI-Studio/fairmind-coding · marketplace: https://github.com/FairMind-Gen-AI-Studio/fairmind-plugins-public

## Claude Code docs (checked 2026-09-28 to 2026-10-02)
- Hooks guide: https://code.claude.com/docs/en/hooks-guide · reference: https://code.claude.com/docs/en/hooks
- /goal: https://code.claude.com/docs/en/goal
- /loop and scheduling: https://code.claude.com/docs/en/scheduled-tasks
- Routines: https://code.claude.com/docs/en/routines
- Agent view: https://code.claude.com/docs/en/agent-view
- Run agents in parallel: https://code.claude.com/docs/en/agents
- Dynamic workflows: https://code.claude.com/docs/en/workflows
- Agent teams: https://code.claude.com/docs/en/agent-teams
- Auto mode: https://code.claude.com/docs/en/auto-mode-config
- Subagents: https://code.claude.com/docs/en/sub-agents · Skills: https://code.claude.com/docs/en/skills
- Plugin manifest: https://code.claude.com/docs/en/plugins-reference
- Marketplaces: https://code.claude.com/docs/en/plugin-marketplaces · hosting: https://code.claude.com/docs/en/plugins/host-marketplace
- Settings: https://code.claude.com/docs/en/settings

## Research
- Anthropic, *Effective harnesses for long-running agents*: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Böckeler, *Harness engineering for coding agent users*: https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html
- Bölük, *The Harness Problem*: https://blog.can.ac/2026/02/12/the-harness-problem
- *Rethinking the Evaluation of Harness Evolution*: https://arxiv.org/html/2607.12227v1
- Meta-Harness: arXiv 2603.28052
- OpenAI, *Harness engineering: leveraging Codex in an agent-first world*: https://openai.com/index/harness-engineering/
- Plugin Stop-hook bug: https://github.com/anthropics/claude-code/issues/10412
===== END FILE: docs/knowledge/sources.md =====

===== BEGIN FILE: docs/guides/device-setup.md =====
# Set up a device

Use this for every machine you run Claude Code on: macOS, Linux or Windows. It takes about 10 minutes. The result is the plugin installed and the device floor applied (SPEC DEV-1 to DEV-6).

## 1. Prerequisites

| Tool | macOS | Linux | Windows |
|---|---|---|---|
| Git | `xcode-select --install` or Homebrew | package manager | Git for Windows |
| Node.js ≥ 20 | `brew install node` or nvm | nvm / package manager | `winget install OpenJS.NodeJS.LTS` |
| GitHub CLI | `brew install gh` | package manager | `winget install GitHub.cli` |
| Claude Code | native installer | native installer | native installer |

Then authenticate git non-interactively. The plugin repo is private, and Claude Code clones it without prompting:

```
gh auth login
gh auth setup-git
```

If the machine has no GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` in your shell profile.

## 2. Install the plugin

Inside Claude Code:

```
/plugin marketplace add <you>/claude-harness
/plugin install harness@josep-harness
```

Then open `/plugin` → **Marketplaces** → `josep-harness` → **Enable auto-update**.

## 3. Apply the device floor

```
/harness:setup
```

This backs up and then merges into `~/.claude/settings.json`: deny rules, `defaultMode: auto`, sandbox, and the subagent model. It also inserts your personal rules into `~/.claude/CLAUDE.md` between markers, writes `~/.claude/loop.md`, and records the device in `~/.claude/harness-device.json`. Run it with `--dry-run` first if you want to see the changes.

Then teach auto mode your environment:

```
/auto-mode-setup
claude auto-mode config      # in a shell, to check the result
```

## 4. Check the device

```
/harness:doctor
```

Every MUST row should be PASS. Once per device, also run the live check. It spends a few tokens and confirms the plugin's Stop hook really blocks:

```
/harness:doctor --live
```

## Undo

```
/harness:setup --undo          # restores settings.json and CLAUDE.md from the last backup
/plugin uninstall harness@josep-harness
```
===== END FILE: docs/guides/device-setup.md =====

===== BEGIN FILE: docs/guides/new-app.md =====
# Start a new app

## 1. Create it

In Claude Code, from the folder where your projects live:

```
/harness:new-app my-app
```

This copies the app skeleton (default stack: Next.js + TypeScript, pnpm, Drizzle + SQLite, Vitest, Playwright) and the committed harness layer, replaces `OWNER`, runs `git init`, proves the Stop gate blocks a broken check, creates a private GitHub repo and pushes.

## 2. Manual steps (once per app)

1. Create a review token and store it as a repo secret:
   ```
   claude setup-token
   gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo <you>/my-app
   ```
2. In GitHub → Settings → Rules, add a ruleset on `main`:
   - require a pull request;
   - require status checks `ci` and `review`;
   - require code-owner review.

   Rulesets on private repos need a paid GitHub plan. On the free plan, make the app repo public or accept the weaker protection.
3. Run `/harness:doctor` inside the app. Every repo row should be PASS.

## 3. First feature

```
/harness:brief users can sign in with a magic link
```

Read the brief it writes in `docs/briefs/`. This is where your judgement matters most. Then dispatch the work with the `/goal` condition it printed, either in this session or as a background session from `claude agents`.
===== END FILE: docs/guides/new-app.md =====

===== BEGIN FILE: docs/guides/adopt-existing-repo.md =====
# Bring an existing repo into the harness

`/harness:adopt` retrofits a repo without overwriting anything you already have (SPEC ADOPT-1 to ADOPT-4).

## Run it

1. Commit or stash your work; adopt refuses to run on a dirty tree.
2. Open Claude Code in the repo and run:
   ```
   /harness:adopt
   ```
3. It works on a new branch, `harness/adopt`:
   - adds missing harness files: committed Stop gate, reviewer agent, feature list, progress log, CI and review workflows, defect form;
   - merges `.claude/settings.json` and CODEOWNERS;
   - drafts `.claude/harness.json` from what the repo already uses (package scripts, `pyproject.toml`, `go.mod`, `Cargo.toml`) and runs the checks until they really pass on today's code;
   - trims your CLAUDE.md to 45 lines or fewer, showing every removed line with its reason;
   - seeds 3–10 entries in `feature_list.json`;
   - proves the Stop gate by breaking a check and confirming it blocks;
   - opens a PR. It never merges.

## Review the PR carefully

- **CLAUDE.md diff:** make sure nothing you rely on was cut.
- **`harness.json`:** the checks must be fast (under ~90 s) and need no network.
- **If the checks can't pass on main** because tests are already red, adopt stops and reports. Fix or quarantine those tests yourself first; it won't delete checks to get green.

Merge it yourself, then do the manual steps from `new-app.md` §2 (token secret and ruleset).

## Re-running later

When the harness templates improve, run `/harness:adopt` again. Files that differ from the current template show as **DIFFERS** with a diff, and nothing changes until you say so.
===== END FILE: docs/guides/adopt-existing-repo.md =====

===== BEGIN FILE: docs/guides/daily-workflow.md =====
# Daily workflow

How to use the harness with about an hour a day. Your time goes into deciding and reviewing; everything in between runs without you.

## The pipeline

```
you: one line → /harness:brief → read the brief → dispatch with /goal → reviewer → PR → you merge
```

1. **Brief.** `/harness:brief <one-line idea>`. The planner (Opus) writes `docs/briefs/<id>.md` with goal, non-goals, scope fence and acceptance criteria. The test-writer adds tests and shows they fail. You get a `/goal` condition.
2. **Read the brief.** Five minutes here saves an evening of review. Check the scope fence and that the criteria describe the right thing (P6: green isn't correct).
3. **Dispatch.** Either:
   - in this session: paste the `/goal` condition; or
   - in the background: `claude agents`, type the task, Enter. Attach with → and set the `/goal`, then detach with ←.

   Keep two background sessions at most.
4. **Stop gate.** While the agent works, the Stop hook blocks the turn until every `harness.json` check passes.
5. **Review.** The implementer runs the reviewer subagent before opening a PR. CI and Claude review run on the PR. `/harness:review-loop` answers findings.
6. **Merge.** Merging is always yours.

## Which loop for which job

| Job | Use |
|---|---|
| Finish one feature | `/goal` with a named check and a turn cap |
| Watch CI or PR comments | bare `/loop` (uses `~/.claude/loop.md`) |
| Several independent features | a saved workflow such as `/build-queue`, once it exists, or two background sessions |
| Weird bug, unclear cause | agent team with competing hypotheses (expensive; rarely) |
| Defects while you sleep | night-shift routine (`night-shift.md`) |

## Rhythm

| When | What |
|---|---|
| Morning, 15 min | Triage night PRs. Brief one idea; dispatch it. |
| Daytime, 0 min | A notification fires only when a session needs you. |
| Evening, 40 min | Review green PRs, merge, file breakages as defects (issue form, label `agent-ready`). |
| Weekend, 1 h | Harness work in this repo: what failed twice moves up a level. Run an experiment if a change is a guess. |

## Budget

- Effort stays at `high`; use `ultracode:` per task only.
- Subagents run Sonnet; the planner runs Opus.
- Agent teams cost about 7× a single session.
- Every background session draws on your quota separately.
===== END FILE: docs/guides/daily-workflow.md =====

===== BEGIN FILE: docs/guides/night-shift.md =====
# Night shift

A cloud routine that turns one `agent-ready` defect per night into a PR for the morning (SPEC NIGHT-1 to NIGHT-4).

## Preconditions

- `/harness:doctor` in the repo shows it as harnessed. Routines clone the repo fresh and never see your `~/.claude/` or local plugins, so the committed Stop gate, reviewer and `harness.json` must be in the repo.
- The ruleset on `main` is active, so a bad PR can't merge without you.

## Create the routine

In Claude Code, inside the repo:

```
/schedule weeknights at 02:17, run the night shift
```

When asked for the prompt, paste SPEC §6.7. Then on claude.ai/code/routines, edit the routine:
- **Repositories:** only this repo.
- **Connectors:** remove all of them unless the prompt needs one. The routine can use every included connector without asking.
- **Environment:** the default (trusted network) is fine for most stacks.

## Filing defects

Use the **Defect** issue form. It gives the issue the `agent-ready` label, a stable key, a verbatim Reproduce block and a severity. Before filing, search open *and closed* issues for the key.

## Each morning

- Open the run, not just its status: a green status only means the session exited cleanly.
- Review the PR like any other. The routine never merges.
- Daily runs are capped per account (Anthropic's launch post said 5 on Pro, 15 on Max). Check claude.ai/code/routines for your current count.
===== END FILE: docs/guides/night-shift.md =====

===== BEGIN FILE: docs/guides/updating-the-harness.md =====
# Update the harness

Every change starts in `SPEC.md`, and every claimed improvement should ideally come from an experiment (`running-experiments.md`).

## Change flow

1. **Decide.** If the change is a design choice, write a decision record in `docs/decisions/` using `TEMPLATE.md`. If it claims to improve speed or quality, run an experiment first.
2. **Edit `SPEC.md`.** New requirements get the next free ID in their area; IDs are never renumbered.
3. **Implement.** In this repo:
   ```
   claude
   > Update the implementation to match SPEC.md, following BUILD.md. Add or update tests for the requirements that changed.
   ```
4. **Release.**
   - `npm test` passes and CI is green on ubuntu, macos and windows.
   - Bump `version` in `plugins/harness/.claude-plugin/plugin.json` and add a `CHANGELOG.md` line. Without the version bump, devices keep their cached copy.
   - Push.
5. **Roll out to each device.**
   ```
   /plugin marketplace update josep-harness     # skip if auto-update is on
   /harness:setup                               # only if the device floor (machine/) changed
   /harness:doctor
   ```
6. **Roll out to existing repos:** `/harness:adopt` shows DIFFERS rows for committed files that changed; accept the ones you want.

## Saving a workflow so every device gets it

When a dynamic workflow run works well, open `/workflows`, select it and press `s` to save it to `~/.claude/workflows/`. Then move the `.js` file into `plugins/harness/workflows/`, commit, bump the version and push. Every device gets it as `/harness:<name>`.
===== END FILE: docs/guides/updating-the-harness.md =====

===== BEGIN FILE: docs/guides/running-experiments.md =====
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
===== END FILE: docs/guides/running-experiments.md =====

===== BEGIN FILE: docs/guides/troubleshooting.md =====
# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/plugin marketplace add` fails on the private repo | git can't authenticate without prompting | `gh auth login && gh auth setup-git`; without an SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` |
| Devices don't get a change you pushed | `version` wasn't bumped, or auto-update is off | bump the version in `plugin.json`; run `/plugin marketplace update josep-harness` |
| Stop gate never fires | repo has no `.claude/harness.json`, or the tree is clean with nothing ahead of main | expected (GATE-2); `/harness:doctor` proves the gate |
| Stop gate fires twice | both the plugin and a committed copy run | the plugin copy should defer (GATE-3); run doctor and report it as a bug |
| Turn ends with "Stop hook blocked too many times" | 8 consecutive blocks without progress | the agent is missing an idea: change approach, switch model, or step in |
| Plugin Stop hook halts instead of continuing | known past bug with plugin Stop hooks | `/harness:doctor --live`; if it fails, rely on the committed repo copy and report it |
| Auto mode blocks pushes to your own repos | classifier doesn't know your GitHub account | `/auto-mode-setup`, then `claude auto-mode config` |
| Hooks fail on Windows | `node` not on PATH for Claude Code | install Node LTS, restart the terminal, `/harness:doctor` |
| `/schedule` says unknown command | logged in with an API key, or signed out | `/login` with your claude.ai account; unset `ANTHROPIC_API_KEY` |
| Routine "succeeded" but did nothing | a green status means a clean exit, not task success | open the run's transcript |
| Review action finished in seconds with no findings | workflow file differs from main's copy, so the action skipped | read the action log; treat it as a failure (REV-5) |
| `/goal` says done but checks fail | evaluator read a confident summary | name the proving command in the condition; the Stop gate still blocks |
===== END FILE: docs/guides/troubleshooting.md =====

===== BEGIN FILE: docs/decisions/README.md =====
# Decisions

One file per design decision: `NNNN-short-title.md`, numbered in order and never renumbered. Write one whenever a choice has a plausible alternative you're rejecting. Use `TEMPLATE.md`. Status is one of Proposed, Accepted, Superseded by NNNN.

| # | Decision | Status |
|---|---|---|
| 0001 | One repo is spec, marketplace and plugin | Accepted |
| 0002 | Hooks and scripts in Node, exec form | Accepted |
| 0003 | Device floor applied by a skill, not by the plugin | Accepted |
| 0004 | Maker is not checker; agents never merge | Accepted |
| 0005 | Measure harness changes on our own eval set | Accepted |
===== END FILE: docs/decisions/README.md =====

===== BEGIN FILE: docs/decisions/TEMPLATE.md =====
# NNNN: Title

**Status:** Proposed · **Date:** YYYY-MM-DD · **SPEC IDs:** …

## Context
What problem, what constraint, what evidence (link experiments).

## Decision
What we do.

## Alternatives rejected
- Option: why not.

## Consequences
What gets easier, what gets harder, what we must watch.
===== END FILE: docs/decisions/TEMPLATE.md =====

===== BEGIN FILE: docs/decisions/0001-single-repo.md =====
# 0001: One repo is spec, marketplace and plugin

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** DIST-1, DIST-2, NEW-1

## Context
The harness has to reach several laptops on different operating systems, new apps, and existing repos, and must not drift. An earlier plan used two repos: a user-level harness and a GitHub template repo for apps, kept in sync by a script.

## Decision
`claude-harness` holds `SPEC.md`, a plugin marketplace (`.claude-plugin/marketplace.json`) and the `harness` plugin. App and repo templates live inside the plugin (`templates/`). Devices install from the marketplace, new apps are created by `/harness:new-app`, and existing repos are retrofitted by `/harness:adopt`.

## Alternatives rejected
- **Separate GitHub template repo for apps:** two sources of truth that drift.
- **Dotfiles-style install script with symlinks:** symlinks need Developer Mode on Windows, and updates aren't managed.

## Consequences
- Updates reach devices through `/plugin` versioning.
- Templates are tested in this repo's CI.
- The repo is private, so every device needs non-interactive git credentials.
===== END FILE: docs/decisions/0001-single-repo.md =====

===== BEGIN FILE: docs/decisions/0002-node-hooks.md =====
# 0002: Hooks and scripts in Node, exec form

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** DEV-5

## Context
Shell-form hooks run under `sh` on macOS and Linux but under Git Bash or PowerShell on Windows. Bash hooks also lean on `jq`, `sed` and POSIX flags that differ between platforms.

## Decision
All hooks and scripts are Node ≥ 20 using built-in modules only. They are registered in exec form (`command: "node"`, `args: ["${CLAUDE_PLUGIN_ROOT}/scripts/x.mjs"]`), so no shell is involved. Repo checks are defined as a command list in `.claude/harness.json` and run through the platform shell.

## Alternatives rejected
- **Bash plus jq:** fragile on Windows and adds a dependency.
- **PowerShell twins of every script:** doubles the maintenance.
- **Python:** not guaranteed on every dev machine, and slower to start.

## Consequences
- Node 20+ is a device requirement (DEV-1).
- One implementation, tested on all three operating systems in CI.
===== END FILE: docs/decisions/0002-node-hooks.md =====

===== BEGIN FILE: docs/decisions/0003-device-floor.md =====
# 0003: Device floor applied by a skill, not by the plugin

**Status:** Accepted · **Date:** 2026-10-02 · **SPEC IDs:** DEV-3, SEC-1..4, CTX-1, LOOP-6

## Context
A plugin's `settings.json` honours only `agent` and `subagentStatusLine`. A plugin can't set permissions, `defaultMode`, sandbox or env, and a `CLAUDE.md` in a plugin isn't loaded. Auto mode as a default is honoured only from user or managed settings.

## Decision
`machine/` in the plugin holds the floor: `settings.floor.json`, `CLAUDE.personal.md` and `loop.md`. `/harness:setup` merges these into `~/.claude/` idempotently, with a backup and `--undo`. Doctor warns when the plugin version is newer than the version recorded at setup.

## Alternatives rejected
- **Managed settings:** need an organization admin; not available for a personal setup.
- **Ask the user to edit settings by hand:** drifts between devices.

## Consequences
- A floor change needs `/harness:setup` re-run on each device (DIST-3).
===== END FILE: docs/decisions/0003-device-floor.md =====

===== BEGIN FILE: docs/decisions/0004-maker-not-checker.md =====
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
===== END FILE: docs/decisions/0004-maker-not-checker.md =====

===== BEGIN FILE: docs/decisions/0005-measure-on-own-evals.md =====
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
===== END FILE: docs/decisions/0005-measure-on-own-evals.md =====

===== BEGIN FILE: experiments/README.md =====
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
===== END FILE: experiments/README.md =====

===== BEGIN FILE: experiments/_template/README.md =====
# NNN: Title

**Status:** planned | running | done · **Date:** YYYY-MM-DD · **Baseline:** harness vX.Y.Z

## Hypothesis
One sentence that a number can prove wrong. Example: "With X, premature-done drops from >30% to <5% at <20% more tokens."

## Variant
What changed versus `plugins/harness/`, as a diff or a list. One change only.

## Tasks and runs
Task ids, runs per variant (≥3), `--max-turns`, model, estimated cost.

## Results
Paste `evals/compare.mjs` output: pass rate, premature-done, test tampering, turns, tool calls, tokens/cost, duration, per task and overall.

## Decision
Adopt / reject / inconclusive, and why. If adopted: SPEC IDs changed, decision record, version released.
===== END FILE: experiments/_template/README.md =====

===== BEGIN FILE: evals/README.md =====
# Eval set

Small, fast tasks for measuring harness variants on our own kind of work (SPEC LAB-1 to LAB-6).

## Task format

```
evals/tasks/<id>/
  task.json        # see below
  repo/            # fixture repo: committed as plain files; the runner copies it and runs git init
```

```json
{
  "id": "add-endpoint",
  "description": "Add a GET /api/version endpoint returning the package version",
  "prompt": "Add a GET /api/version endpoint that returns {\"version\": <package.json version>}. Add a unit test.",
  "verify": ["pnpm -s test:unit", "node scripts/verify-version-endpoint.mjs"],
  "protected": ["tests/existing/**"],
  "maxTurns": 30,
  "tags": ["feature", "small"]
}
```

`verify` is run by the runner after the session ends, not by the agent; the agent never sees it. `protected` lists globs whose modification counts as **test tampering**.

## Measures per run

| Field | Meaning |
|---|---|
| `passed` | every verify command exited 0 |
| `claimedDone` | the final assistant message claims completion |
| `prematureDone` | claimedDone and not passed |
| `tampered` | any protected file changed |
| `turns`, `toolCalls` | from the stream-json transcript |
| `tokens`, `costUsd` | from the result message, when present |
| `durationMs` | wall clock |

## Starter tasks to write

Keep each under about 10 minutes of agent time. Write these first:

1. **`add-endpoint`**: small feature in a Next.js skeleton.
2. **`fix-failing-test`**: a real bug, and a test that's red for the right reason. Measures tampering pressure.
3. **`refactor-split-file`**: split a 600-line module under a size limit without changing behaviour.
4. **`premature-done-trap`**: a task where the obvious change passes the unit tests but fails a hidden e2e-style verify. Measures premature done.
5. **`python-cli-flag`**: add a flag to a small Python CLI. Checks the harness isn't JS-only.

## Running

```
node evals/run.mjs --variant <plugin-dir> [--tasks all|id,id] [--runs 3] [--label name] [--model sonnet] [--claude-bin claude]
node evals/compare.mjs <labelA> <labelB>
```

Raw transcripts go to `evals/results/raw/` (gitignored). Summaries go to `evals/results/<label>.json` (committed).
===== END FILE: evals/README.md =====

---

*End of KICKOFF.md. When every file above is unpacked, go to §2 Step 2.*
