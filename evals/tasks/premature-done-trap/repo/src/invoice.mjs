import { CURRENCIES } from './money.mjs';

// Plain-text invoice sent by email. Amounts are integers in the minor unit.
export function renderInvoice(lines, currency) {
  const symbol = CURRENCIES[currency]?.symbol ?? '';
  const fmt = (amount) => `${symbol}${(amount / 100).toFixed(2)}`;
  const rows = lines.map((l) => `${l.description.padEnd(24)} ${String(l.quantity).padStart(3)} × ${fmt(l.unitPrice)}`);
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  return [...rows, '-'.repeat(40), `Total ${fmt(total)}`].join('\n');
}
