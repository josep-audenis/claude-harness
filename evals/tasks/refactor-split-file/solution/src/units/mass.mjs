import { assertAmount, round } from './core.mjs';


/**
 * Convert grams to kilograms.
 * @param {number} value amount in grams, finite and not negative
 * @returns {number} amount in kilograms, rounded to 6 decimals
 */
export function gramsToKilograms(value) {
  assertAmount(value, 'gramsToKilograms');
  return round((value * 1) / 1000);
}

/**
 * Convert grams to milligrams.
 * @param {number} value amount in grams, finite and not negative
 * @returns {number} amount in milligrams, rounded to 6 decimals
 */
export function gramsToMilligrams(value) {
  assertAmount(value, 'gramsToMilligrams');
  return round((value * 1) / 0.001);
}

/**
 * Convert grams to pounds.
 * @param {number} value amount in grams, finite and not negative
 * @returns {number} amount in pounds, rounded to 6 decimals
 */
export function gramsToPounds(value) {
  assertAmount(value, 'gramsToPounds');
  return round((value * 1) / 453.59237);
}

/**
 * Convert grams to ounces.
 * @param {number} value amount in grams, finite and not negative
 * @returns {number} amount in ounces, rounded to 6 decimals
 */
export function gramsToOunces(value) {
  assertAmount(value, 'gramsToOunces');
  return round((value * 1) / 28.349523125);
}

/**
 * Convert grams to stones.
 * @param {number} value amount in grams, finite and not negative
 * @returns {number} amount in stones, rounded to 6 decimals
 */
export function gramsToStones(value) {
  assertAmount(value, 'gramsToStones');
  return round((value * 1) / 6350.29318);
}

/**
 * Convert kilograms to grams.
 * @param {number} value amount in kilograms, finite and not negative
 * @returns {number} amount in grams, rounded to 6 decimals
 */
export function kilogramsToGrams(value) {
  assertAmount(value, 'kilogramsToGrams');
  return round((value * 1000) / 1);
}

/**
 * Convert milligrams to grams.
 * @param {number} value amount in milligrams, finite and not negative
 * @returns {number} amount in grams, rounded to 6 decimals
 */
export function milligramsToGrams(value) {
  assertAmount(value, 'milligramsToGrams');
  return round((value * 0.001) / 1);
}

/**
 * Convert pounds to grams.
 * @param {number} value amount in pounds, finite and not negative
 * @returns {number} amount in grams, rounded to 6 decimals
 */
export function poundsToGrams(value) {
  assertAmount(value, 'poundsToGrams');
  return round((value * 453.59237) / 1);
}

/**
 * Convert ounces to grams.
 * @param {number} value amount in ounces, finite and not negative
 * @returns {number} amount in grams, rounded to 6 decimals
 */
export function ouncesToGrams(value) {
  assertAmount(value, 'ouncesToGrams');
  return round((value * 28.349523125) / 1);
}

/**
 * Convert stones to grams.
 * @param {number} value amount in stones, finite and not negative
 * @returns {number} amount in grams, rounded to 6 decimals
 */
export function stonesToGrams(value) {
  assertAmount(value, 'stonesToGrams');
  return round((value * 6350.29318) / 1);
}
