// Money is stored as integers in the currency's minor unit (cents for USD and EUR; yen has none).

export const CURRENCIES = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
};

export function formatMoney(amount, currency) {
  const c = CURRENCIES[currency];
  if (!c) throw new Error(`unsupported currency: ${currency}`);
  const value = amount / 10 ** c.decimals;
  return c.symbol + value.toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
}
