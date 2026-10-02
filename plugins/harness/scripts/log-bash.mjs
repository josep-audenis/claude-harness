// PostToolUse hook on Bash (REC-1): append one JSON line per command to ~/.claude/logs/bash.jsonl.
// Records only; never blocks, always exits 0.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readStdinJson } from './lib.mjs';

try {
  const input = await readStdinJson();
  const command = input?.tool_input?.command;
  if (typeof command === 'string') {
    const dir = path.join(os.homedir(), '.claude', 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const entry = {
      time: new Date().toISOString(),
      session: input.session_id ?? null,
      agent: input.agent_type ?? input.agent_id ?? 'main',
      cwd: input.cwd ?? process.cwd(),
      command,
    };
    fs.appendFileSync(path.join(dir, 'bash.jsonl'), JSON.stringify(entry) + '\n');
  }
} catch {
  // A record hook must never break the session.
}
process.exit(0);
