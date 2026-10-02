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
