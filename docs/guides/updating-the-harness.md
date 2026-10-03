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
   If you changed a script that repos commit a copy of (`lib`, `stop-gate`, `format-changed`, `check`, `test-diff`) or the reviewer agent, regenerate the copies with `npm run sync-templates`. The drift test fails until you do.
4. **Release.**
   - `npm test` passes, `claude plugin validate .` passes, and CI is green on ubuntu, macos and windows (plus the template-app and validate jobs).
   - Bump `version` in `plugins/harness/.claude-plugin/plugin.json` and add a `CHANGELOG.md` line. Without the version bump, devices that installed from GitHub keep their cached copy. A device that added the local clone as its marketplace loads the files in place and doesn't need a bump.
   - Push.
5. **Roll out to each device.**
   ```
   /plugin marketplace update josep-harness     # skip if auto-update is on
   /harness:setup                               # only if the device floor (machine/) changed
   /harness:doctor
   ```
   Doctor warns on DIST-3 when the plugin is newer than the version recorded at setup.
6. **Roll out to existing repos:** `/harness:adopt` shows DIFFERS rows, with diffs, for committed harness files that changed; accept the ones you want.

## Saving a workflow so every device gets it

When a dynamic workflow run works well, open `/workflows`, select it and press `s` to save it to `~/.claude/workflows/`. Then move the `.js` file into `plugins/harness/workflows/`, commit, bump the version and push. Every device gets it as `/harness:<name>`.
