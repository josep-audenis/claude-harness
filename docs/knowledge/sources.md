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

## Harness setups studied for v1.1 (2026-10-03)
- Anthropic, *Harness design for long-running application development* (Mar 2026). Planner, generator and a Playwright evaluator calibrated with few-shot examples; "out of the box, Claude is a poor QA agent"; context resets with file handoffs; strip harness parts as models improve: https://www.anthropic.com/engineering/harness-design-long-running-apps
- obra/superpowers (skills `writing-plans`, `subagent-driven-development`, `executing-plans`, `verification-before-completion`, `systematic-debugging`). Bite-sized tasks; a fresh implementer and a reviewer per task; capped fix rounds escalating to a stronger model; a ledger of `Ruling:` lines; only four reasons to stop: https://github.com/obra/superpowers
- `ralph-loop`, official plugin (Ralph Wiggum technique). A Stop-hook loop with a completion promise and `--max-iterations`; `/goal` covers this natively: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop
- HumanLayer `.claude/commands` (`research_codebase`, `create_plan`, `implement_plan`, `create_handoff`/`resume_handoff`). Research, plan, implement with intentional compaction and checkbox plans: https://github.com/humanlayer/humanlayer/tree/main/.claude/commands
- Chachamaru127/claude-code-harness. Plan → work → review → sync → release; "unknowns stay unknown"; reversible work continues on stated assumptions: https://github.com/Chachamaru127/claude-code-harness
- GitHub spec-kit (constitution → specify → plan → tasks → implement): https://github.blog/2025-09-02-spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- nizos/tdd-guard (PreToolUse enforcement of test-first) and `hookify` (official plugin: rules from corrections). Inspiration for `/harness:learn` and `bashDeny`: https://github.com/nizos/tdd-guard · https://github.com/anthropics/claude-plugins-official/tree/main/plugins/hookify
