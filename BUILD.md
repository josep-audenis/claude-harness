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
   /plugin marketplace add josep-audenis/claude-harness
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
