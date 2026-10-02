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
