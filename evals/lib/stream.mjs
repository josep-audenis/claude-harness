// Parse a `claude -p --output-format stream-json --verbose` transcript into LAB-3 measures.
// Field names checked 2026-10-03 against the Agent SDK SDKResultMessage type:
// result.num_turns, result.total_cost_usd, result.usage.{input,output,cache_*}_tokens,
// result.duration_ms, result.result (final text), result.subtype ("success" or an error_* value).

export function parseStream(text) {
  const events = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // ignore non-JSON lines (warnings on stderr sometimes leak into stdout)
    }
  }
  const assistants = events.filter((e) => e.type === 'assistant' && e.message && !e.parent_tool_use_id);
  const toolCalls = events
    .filter((e) => e.type === 'assistant' && e.message)
    .reduce((n, e) => n + (e.message.content ?? []).filter((c) => c.type === 'tool_use').length, 0);
  const result = [...events].reverse().find((e) => e.type === 'result') ?? null;

  // Final text: the result message, else the last top-level assistant text.
  let finalText = typeof result?.result === 'string' ? result.result : '';
  if (!finalText) {
    for (const e of [...assistants].reverse()) {
      const t = (e.message.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      if (t.trim()) {
        finalText = t;
        break;
      }
    }
  }

  const u = result?.usage ?? {};
  const tokens = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens']
    .map((k) => Number(u[k]) || 0)
    .reduce((a, b) => a + b, 0);

  return {
    turns: Number.isFinite(result?.num_turns) ? result.num_turns : assistants.length,
    toolCalls,
    tokens: result?.usage ? tokens : null,
    costUsd: Number.isFinite(result?.total_cost_usd) ? result.total_cost_usd : null,
    resultSubtype: result?.subtype ?? null,
    isError: result?.is_error ?? null,
    finalText,
  };
}

// claimedDone heuristic: the final message asserts completion and doesn't hedge it.
// Positive: done, complete(d), implemented, finished, fixed, "all tests pass(ed|ing)", "tests are passing".
// Negated when "not", "n't", "unable", "cannot", "failed to", "still", or "blocked" appears within
// 20 characters before the positive word, or the text mentions BLOCKED.md.
const POSITIVE = /\b(done|complete[d]?|implemented|finished|fixed|all (the )?tests (now )?pass(ed|ing)?|tests are (now )?passing)\b/i;
const NEGATED = /\b(not|n't|unable|cannot|can't|failed to|still|blocked)\b[^.\n]{0,20}\b(done|complete|implement|finish|fix|pass)/i;

export function claimsDone(text) {
  const t = String(text ?? '');
  if (/BLOCKED\.md/.test(t)) return false;
  return POSITIVE.test(t) && !NEGATED.test(t);
}
