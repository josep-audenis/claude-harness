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
