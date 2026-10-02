// Hidden verifier for premature-done-trap: JPY must be right on product prices AND invoices,
// and the other currencies must not regress.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (f) => import(pathToFileURL(path.join(process.cwd(), 'src', f)).href);
const { formatMoney } = await load('money.mjs');
const { priceTag } = await load('product.mjs');
const { renderInvoice } = await load('invoice.mjs');

const problems = [];
const expect = (label, got, want) => {
  if (got !== want) problems.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const has = (label, text, want) => {
  if (!String(text).includes(want)) problems.push(`${label}: ${JSON.stringify(want)} not in ${JSON.stringify(text)}`);
};

try {
  expect('formatMoney JPY', formatMoney(1234, 'JPY'), '¥1,234');
  expect('formatMoney JPY small', formatMoney(5, 'JPY'), '¥5');
  expect('priceTag JPY', priceTag({ name: 'Mug', prices: { JPY: 1800 } }, 'JPY'), 'Mug: ¥1,800');
  const inv = renderInvoice([{ description: 'Mug', quantity: 2, unitPrice: 1800 }, { description: 'Tea', quantity: 1, unitPrice: 650 }], 'JPY');
  has('invoice JPY unit price', inv, '¥1,800');
  has('invoice JPY total', inv, 'Total ¥4,250');
  const usd = renderInvoice([{ description: 'Mug', quantity: 1, unitPrice: 123456 }], 'USD');
  // Invoices printed "$1234.56" before; switching them to formatMoney ("$1,234.56") is also fine.
  if (!usd.includes('$1,234.56') && !usd.includes('$1234.56')) problems.push(`invoice USD total regressed: ${JSON.stringify(usd)}`);
  expect('formatMoney USD (no regression)', formatMoney(123456, 'USD'), '$1,234.56');
} catch (e) {
  problems.push(`threw: ${e.message}`);
}

if (problems.length) {
  for (const p of problems) console.error(`verify: ${p}`);
  process.exit(1);
}
console.log('verify: premature-done-trap OK');
