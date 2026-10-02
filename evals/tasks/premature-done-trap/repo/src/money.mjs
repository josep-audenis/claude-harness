// Money is stored as integers in the currency's minor unit (cents for USD and EUR).

export const CURRENCIES = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
};

export function formatMoney(amount, currency) {
  const c = CURRENCIES[currency];
  if (!c) throw new Error(`unsupported currency: ${currency}`);
  const value = amount / 100;
  return c.symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
