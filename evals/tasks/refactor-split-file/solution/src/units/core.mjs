// Unit conversions used across the shop: shipping weights, package sizes, delivery windows.
// Every converter validates its input and rounds to 6 decimal places.

export const PRECISION = 1e6;

export function assertAmount(value, unit) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${unit}: expected a finite number, got ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`${unit}: amounts cannot be negative (${value})`);
  }
}

export function round(value) {
  return Math.round(value * PRECISION) / PRECISION;
}
