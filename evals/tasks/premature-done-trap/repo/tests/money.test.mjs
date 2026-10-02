import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney } from '../src/money.mjs';
import { priceTag } from '../src/product.mjs';

test('formats dollars and euros with two decimals and separators', () => {
  assert.equal(formatMoney(123456, 'USD'), '$1,234.56');
  assert.equal(formatMoney(99, 'EUR'), '€0.99');
});

test('price tags use formatMoney', () => {
  assert.equal(priceTag({ name: 'Mug', prices: { USD: 1250 } }, 'USD'), 'Mug: $12.50');
});

test('unknown currencies are rejected', () => {
  assert.throws(() => formatMoney(1, 'XXX'), /unsupported currency/);
});
