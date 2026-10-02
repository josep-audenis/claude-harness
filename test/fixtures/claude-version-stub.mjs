// Stands in for the `claude` binary in doctor tests: answers --version, spends no tokens.
// CLAUDE_STUB_VERSION overrides the reported version.
if (process.argv.includes('--version')) console.log(`${process.env.CLAUDE_STUB_VERSION || '2.1.300'} (Claude Code)`);
else process.exit(64);
