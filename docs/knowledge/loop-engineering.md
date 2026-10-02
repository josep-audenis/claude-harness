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
