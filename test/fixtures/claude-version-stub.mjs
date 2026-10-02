// Stands in for the `claude` binary in doctor tests: answers --version, spends no tokens.
if (process.argv.includes('--version')) console.log('2.1.300 (Claude Code)');
else process.exit(64);
