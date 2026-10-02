import { assertAmount, round } from './core.mjs';


/**
 * Convert liters to milliliters.
 * @param {number} value amount in liters, finite and not negative
 * @returns {number} amount in milliliters, rounded to 6 decimals
 */
export function litersToMilliliters(value) {
  assertAmount(value, 'litersToMilliliters');
  return round((value * 1) / 0.001);
}

/**
 * Convert liters to gallons.
 * @param {number} value amount in liters, finite and not negative
 * @returns {number} amount in gallons, rounded to 6 decimals
 */
export function litersToGallons(value) {
  assertAmount(value, 'litersToGallons');
  return round((value * 1) / 3.785411784);
}

/**
 * Convert liters to quarts.
 * @param {number} value amount in liters, finite and not negative
 * @returns {number} amount in quarts, rounded to 6 decimals
 */
export function litersToQuarts(value) {
  assertAmount(value, 'litersToQuarts');
  return round((value * 1) / 0.946352946);
}

/**
 * Convert liters to pints.
 * @param {number} value amount in liters, finite and not negative
 * @returns {number} amount in pints, rounded to 6 decimals
 */
export function litersToPints(value) {
  assertAmount(value, 'litersToPints');
  return round((value * 1) / 0.473176473);
}

/**
 * Convert liters to cups.
 * @param {number} value amount in liters, finite and not negative
 * @returns {number} amount in cups, rounded to 6 decimals
 */
export function litersToCups(value) {
  assertAmount(value, 'litersToCups');
  return round((value * 1) / 0.2365882365);
}

/**
 * Convert milliliters to liters.
 * @param {number} value amount in milliliters, finite and not negative
 * @returns {number} amount in liters, rounded to 6 decimals
 */
export function millilitersToLiters(value) {
  assertAmount(value, 'millilitersToLiters');
  return round((value * 0.001) / 1);
}

/**
 * Convert gallons to liters.
 * @param {number} value amount in gallons, finite and not negative
 * @returns {number} amount in liters, rounded to 6 decimals
 */
export function gallonsToLiters(value) {
  assertAmount(value, 'gallonsToLiters');
  return round((value * 3.785411784) / 1);
}

/**
 * Convert quarts to liters.
 * @param {number} value amount in quarts, finite and not negative
 * @returns {number} amount in liters, rounded to 6 decimals
 */
export function quartsToLiters(value) {
  assertAmount(value, 'quartsToLiters');
  return round((value * 0.946352946) / 1);
}

/**
 * Convert pints to liters.
 * @param {number} value amount in pints, finite and not negative
 * @returns {number} amount in liters, rounded to 6 decimals
 */
export function pintsToLiters(value) {
  assertAmount(value, 'pintsToLiters');
  return round((value * 0.473176473) / 1);
}

/**
 * Convert cups to liters.
 * @param {number} value amount in cups, finite and not negative
 * @returns {number} amount in liters, rounded to 6 decimals
 */
export function cupsToLiters(value) {
  assertAmount(value, 'cupsToLiters');
  return round((value * 0.2365882365) / 1);
}
