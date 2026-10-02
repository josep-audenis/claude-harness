import { formatMoney } from './money.mjs';

export function priceTag(product, currency) {
  return `${product.name}: ${formatMoney(product.prices[currency], currency)}`;
}
