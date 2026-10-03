# Set up a device

Use this for every machine you run Claude Code on: macOS, Linux or Windows. It takes about 10 minutes. The result is the plugin installed and the device floor applied (SPEC DEV-1 to DEV-6).

## 1. Prerequisites

| Tool | macOS | Linux | Windows |
|---|---|---|---|
| Git | `xcode-select --install` or Homebrew | package manager | Git for Windows |
| Node.js ≥ 20 (≥ 22 for apps from `/harness:new-app`) | `brew install node` or nvm | nvm / package manager | `winget install OpenJS.NodeJS.LTS` |
| GitHub CLI | `brew install gh` | package manager | `winget install GitHub.cli` |
| Claude Code **≥ 2.1.139** (≥ 2.1.233 for `/auto-mode-setup` on native Windows) | native installer | native installer | native installer |

Older Claude Code ignores the `args` field that every harness hook uses, so on older versions **all harness hooks silently do nothing**. Check with `claude --version` and update with:

```
claude update
```

Then authenticate git non-interactively, so Claude Code can clone the marketplace and the night shift can push without prompting:

```
gh auth login
gh auth setup-git
```

If the machine has no GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` in your shell profile.

## 2. Install the plugin

Inside Claude Code, on any device:

```
/plugin marketplace add josep-audenis/claude-harness
/plugin install harness@josep-harness
```

Then open `/plugin` → **Marketplaces** → `josep-harness` → **Enable auto-update** (DEV-4). Auto-update is off by default.

On the machine where you develop the harness itself, add the local clone instead. Edits then apply at the next session start or with `/reload-plugins`, with no version bump:

```
/plugin marketplace add C:\CODE\claude-harness
/plugin install harness@josep-harness
```

## 3. Apply the device floor

```
/harness:setup
```

The skill previews first (`setup.mjs --dry-run`), explains each change and asks before writing. It backs up, then merges into `~/.claude/settings.json`:
- deny rules for `~/.ssh`, `~/.aws`, `.env` files, force pushes, `gh pr merge` and `npm publish`;
- `defaultMode: auto`, unless you already chose a mode, which is kept;
- `sandbox.enabled`, which has no effect on native Windows (the sandbox needs macOS, Linux or WSL2);
- `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` and `effortLevel: high`.

Your existing values always win; the preview lists them under "Settings notes". Setup also:
- inserts your personal rules into `~/.claude/CLAUDE.md` between `<!-- harness:start -->` and `<!-- harness:end -->`;
- writes `~/.claude/loop.md`;
- records the device in `~/.claude/harness-device.json`.

Running it again changes nothing unless the floor changed.

Then teach auto mode your environment:

```
/auto-mode-setup
```

To check the result, run this in a shell:

```
claude auto-mode config
```

## 4. Check the device

```
/harness:doctor
```

Every MUST row should be PASS. On native Windows, SEC-4 (sandbox) shows SKIP. Once per device, also run the live check. It spends a few Haiku tokens and confirms the plugin's Stop hook really blocks a turn:

```
/harness:doctor --live
```

## Undo

```
/harness:setup --undo                     # restores the files from the last setup backup; removes the ones setup created
/plugin uninstall harness@josep-harness
```
