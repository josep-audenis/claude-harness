// Fake `claude` binary for lab tests (SPEC LAB-4): accepts the real flags, spends no tokens.
// CLAUDE_STUB_SCENARIO selects the behaviour, applied to the cwd (the run's temp repo):
//   pass       copy CLAUDE_STUB_SOLUTION/* over the repo, then claim done
//   premature  change nothing, claim done
//   tamper     overwrite CLAUDE_STUB_TAMPER (a protected test file) with a test that always passes, claim done
// CLAUDE_STUB_ARGS_FILE, if set, receives the argv as JSON so tests can check isolation flags.
// Prints canned stream-json with a result message carrying num_turns, usage and total_cost_usd.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
if (argv.includes('--version')) {
  console.log('2.1.300 (Claude Code stub)');
  process.exit(0);
}
if (process.env.CLAUDE_STUB_ARGS_FILE) fs.writeFileSync(process.env.CLAUDE_STUB_ARGS_FILE, JSON.stringify(argv));

const scenario = process.env.CLAUDE_STUB_SCENARIO || 'premature';
const cwd = process.cwd();

function copyDir(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else fs.copyFileSync(s, d);
  }
}

const edited = [];
if (scenario === 'pass' && process.env.CLAUDE_STUB_SOLUTION) {
  copyDir(process.env.CLAUDE_STUB_SOLUTION, cwd);
  edited.push('solution files');
} else if (scenario === 'tamper' && process.env.CLAUDE_STUB_TAMPER) {
  const f = path.join(cwd, process.env.CLAUDE_STUB_TAMPER);
  fs.writeFileSync(f, "import { test } from 'node:test';\ntest('placeholder', () => {});\n");
  edited.push(process.env.CLAUDE_STUB_TAMPER);
}

const session = '00000000-0000-4000-8000-000000000000';
const say = (o) => process.stdout.write(JSON.stringify(o) + '\n');
let id = 0;
const toolUse = (name, input) => ({ type: 'assistant', session_id: session, parent_tool_use_id: null, message: { role: 'assistant', content: [{ type: 'tool_use', id: `toolu_${++id}`, name, input }] } });
const toolResult = () => ({ type: 'user', session_id: session, parent_tool_use_id: null, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: `toolu_${id}`, content: 'ok' }] } });

say({ type: 'system', subtype: 'init', session_id: session, cwd, tools: ['Read', 'Edit', 'Bash'], model: 'stub' });
say(toolUse('Read', { file_path: 'README.md' }));
say(toolResult());
say(toolUse('Edit', { file_path: edited[0] ?? 'src/index.mjs', old_string: 'a', new_string: 'b' }));
say(toolResult());
say(toolUse('Bash', { command: 'node --test tests/' }));
say(toolResult());
const final = 'Done. I implemented the change and all tests pass.';
say({ type: 'assistant', session_id: session, parent_tool_use_id: null, message: { role: 'assistant', content: [{ type: 'text', text: final }] } });
say({
  type: 'result', subtype: 'success', is_error: false, session_id: session, num_turns: 4, duration_ms: 1234, duration_api_ms: 1000,
  total_cost_usd: 0.0125, result: final, stop_reason: 'end_turn',
  usage: { input_tokens: 1000, output_tokens: 200, cache_creation_input_tokens: 50, cache_read_input_tokens: 750 },
});
