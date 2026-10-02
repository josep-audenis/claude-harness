import { assertAmount, round } from './core.mjs';


/**
 * Convert meters to kilometers.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in kilometers, rounded to 6 decimals
 */
export function metersToKilometers(value) {
  assertAmount(value, 'metersToKilometers');
  return round((value * 1) / 1000);
}

/**
 * Convert meters to centimeters.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in centimeters, rounded to 6 decimals
 */
export function metersToCentimeters(value) {
  assertAmount(value, 'metersToCentimeters');
  return round((value * 1) / 0.01);
}

/**
 * Convert meters to millimeters.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in millimeters, rounded to 6 decimals
 */
export function metersToMillimeters(value) {
  assertAmount(value, 'metersToMillimeters');
  return round((value * 1) / 0.001);
}

/**
 * Convert meters to miles.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in miles, rounded to 6 decimals
 */
export function metersToMiles(value) {
  assertAmount(value, 'metersToMiles');
  return round((value * 1) / 1609.344);
}

/**
 * Convert meters to yards.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in yards, rounded to 6 decimals
 */
export function metersToYards(value) {
  assertAmount(value, 'metersToYards');
  return round((value * 1) / 0.9144);
}

/**
 * Convert meters to feet.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in feet, rounded to 6 decimals
 */
export function metersToFeet(value) {
  assertAmount(value, 'metersToFeet');
  return round((value * 1) / 0.3048);
}

/**
 * Convert meters to inches.
 * @param {number} value amount in meters, finite and not negative
 * @returns {number} amount in inches, rounded to 6 decimals
 */
export function metersToInches(value) {
  assertAmount(value, 'metersToInches');
  return round((value * 1) / 0.0254);
}

/**
 * Convert kilometers to meters.
 * @param {number} value amount in kilometers, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function kilometersToMeters(value) {
  assertAmount(value, 'kilometersToMeters');
  return round((value * 1000) / 1);
}

/**
 * Convert centimeters to meters.
 * @param {number} value amount in centimeters, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function centimetersToMeters(value) {
  assertAmount(value, 'centimetersToMeters');
  return round((value * 0.01) / 1);
}

/**
 * Convert millimeters to meters.
 * @param {number} value amount in millimeters, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function millimetersToMeters(value) {
  assertAmount(value, 'millimetersToMeters');
  return round((value * 0.001) / 1);
}

/**
 * Convert miles to meters.
 * @param {number} value amount in miles, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function milesToMeters(value) {
  assertAmount(value, 'milesToMeters');
  return round((value * 1609.344) / 1);
}

/**
 * Convert yards to meters.
 * @param {number} value amount in yards, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function yardsToMeters(value) {
  assertAmount(value, 'yardsToMeters');
  return round((value * 0.9144) / 1);
}

/**
 * Convert feet to meters.
 * @param {number} value amount in feet, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function feetToMeters(value) {
  assertAmount(value, 'feetToMeters');
  return round((value * 0.3048) / 1);
}

/**
 * Convert inches to meters.
 * @param {number} value amount in inches, finite and not negative
 * @returns {number} amount in meters, rounded to 6 decimals
 */
export function inchesToMeters(value) {
  assertAmount(value, 'inchesToMeters');
  return round((value * 0.0254) / 1);
}
