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
/plugin marketplace add josep-audenis/claude-harness
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
