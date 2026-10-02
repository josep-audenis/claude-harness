// Unit conversions used across the shop: shipping weights, package sizes, delivery windows.
// Every converter validates its input and rounds to 6 decimal places.

const PRECISION = 1e6;

function assertAmount(value, unit) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${unit}: expected a finite number, got ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`${unit}: amounts cannot be negative (${value})`);
  }
}

function round(value) {
  return Math.round(value * PRECISION) / PRECISION;
}

// ---- length ----

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

// ---- mass ----

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

// ---- volume ----

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

// ---- data ----

/**
 * Convert bytes to kilobytes.
 * @param {number} value amount in bytes, finite and not negative
 * @returns {number} amount in kilobytes, rounded to 6 decimals
 */
export function bytesToKilobytes(value) {
  assertAmount(value, 'bytesToKilobytes');
  return round((value * 1) / 1000);
}

/**
 * Convert bytes to megabytes.
 * @param {number} value amount in bytes, finite and not negative
 * @returns {number} amount in megabytes, rounded to 6 decimals
 */
export function bytesToMegabytes(value) {
  assertAmount(value, 'bytesToMegabytes');
  return round((value * 1) / 1000000);
}

/**
 * Convert bytes to gigabytes.
 * @param {number} value amount in bytes, finite and not negative
 * @returns {number} amount in gigabytes, rounded to 6 decimals
 */
export function bytesToGigabytes(value) {
  assertAmount(value, 'bytesToGigabytes');
  return round((value * 1) / 1000000000);
}

/**
 * Convert bytes to kibibytes.
 * @param {number} value amount in bytes, finite and not negative
 * @returns {number} amount in kibibytes, rounded to 6 decimals
 */
export function bytesToKibibytes(value) {
  assertAmount(value, 'bytesToKibibytes');
  return round((value * 1) / 1024);
}

/**
 * Convert bytes to mebibytes.
 * @param {number} value amount in bytes, finite and not negative
 * @returns {number} amount in mebibytes, rounded to 6 decimals
 */
export function bytesToMebibytes(value) {
  assertAmount(value, 'bytesToMebibytes');
  return round((value * 1) / 1048576);
}

/**
 * Convert kilobytes to bytes.
 * @param {number} value amount in kilobytes, finite and not negative
 * @returns {number} amount in bytes, rounded to 6 decimals
 */
export function kilobytesToBytes(value) {
  assertAmount(value, 'kilobytesToBytes');
  return round((value * 1000) / 1);
}

/**
 * Convert megabytes to bytes.
 * @param {number} value amount in megabytes, finite and not negative
 * @returns {number} amount in bytes, rounded to 6 decimals
 */
export function megabytesToBytes(value) {
  assertAmount(value, 'megabytesToBytes');
  return round((value * 1000000) / 1);
}

/**
 * Convert gigabytes to bytes.
 * @param {number} value amount in gigabytes, finite and not negative
 * @returns {number} amount in bytes, rounded to 6 decimals
 */
export function gigabytesToBytes(value) {
  assertAmount(value, 'gigabytesToBytes');
  return round((value * 1000000000) / 1);
}

/**
 * Convert kibibytes to bytes.
 * @param {number} value amount in kibibytes, finite and not negative
 * @returns {number} amount in bytes, rounded to 6 decimals
 */
export function kibibytesToBytes(value) {
  assertAmount(value, 'kibibytesToBytes');
  return round((value * 1024) / 1);
}

/**
 * Convert mebibytes to bytes.
 * @param {number} value amount in mebibytes, finite and not negative
 * @returns {number} amount in bytes, rounded to 6 decimals
 */
export function mebibytesToBytes(value) {
  assertAmount(value, 'mebibytesToBytes');
  return round((value * 1048576) / 1);
}

// ---- time ----

/**
 * Convert seconds to minutes.
 * @param {number} value amount in seconds, finite and not negative
 * @returns {number} amount in minutes, rounded to 6 decimals
 */
export function secondsToMinutes(value) {
  assertAmount(value, 'secondsToMinutes');
  return round((value * 1) / 60);
}

/**
 * Convert seconds to hours.
 * @param {number} value amount in seconds, finite and not negative
 * @returns {number} amount in hours, rounded to 6 decimals
 */
export function secondsToHours(value) {
  assertAmount(value, 'secondsToHours');
  return round((value * 1) / 3600);
}

/**
 * Convert seconds to days.
 * @param {number} value amount in seconds, finite and not negative
 * @returns {number} amount in days, rounded to 6 decimals
 */
export function secondsToDays(value) {
  assertAmount(value, 'secondsToDays');
  return round((value * 1) / 86400);
}

/**
 * Convert seconds to weeks.
 * @param {number} value amount in seconds, finite and not negative
 * @returns {number} amount in weeks, rounded to 6 decimals
 */
export function secondsToWeeks(value) {
  assertAmount(value, 'secondsToWeeks');
  return round((value * 1) / 604800);
}

/**
 * Convert minutes to seconds.
 * @param {number} value amount in minutes, finite and not negative
 * @returns {number} amount in seconds, rounded to 6 decimals
 */
export function minutesToSeconds(value) {
  assertAmount(value, 'minutesToSeconds');
  return round((value * 60) / 1);
}

/**
 * Convert hours to seconds.
 * @param {number} value amount in hours, finite and not negative
 * @returns {number} amount in seconds, rounded to 6 decimals
 */
export function hoursToSeconds(value) {
  assertAmount(value, 'hoursToSeconds');
  return round((value * 3600) / 1);
}

/**
 * Convert days to seconds.
 * @param {number} value amount in days, finite and not negative
 * @returns {number} amount in seconds, rounded to 6 decimals
 */
export function daysToSeconds(value) {
  assertAmount(value, 'daysToSeconds');
  return round((value * 86400) / 1);
}

/**
 * Convert weeks to seconds.
 * @param {number} value amount in weeks, finite and not negative
 * @returns {number} amount in seconds, rounded to 6 decimals
 */
export function weeksToSeconds(value) {
  assertAmount(value, 'weeksToSeconds');
  return round((value * 604800) / 1);
}

/** Look up a converter by name, e.g. convert("milesToMeters", 2). */
export function convert(name, value) {
  const fn = CONVERTERS[name];
  if (!fn) {
    throw new Error(`unknown converter: ${name}`);
  }
  return fn(value);
}

export const CONVERTERS = Object.freeze({
  metersToKilometers,
  metersToCentimeters,
  metersToMillimeters,
  metersToMiles,
  metersToYards,
  metersToFeet,
  metersToInches,
  kilometersToMeters,
  centimetersToMeters,
  millimetersToMeters,
  milesToMeters,
  yardsToMeters,
  feetToMeters,
  inchesToMeters,
  gramsToKilograms,
  gramsToMilligrams,
  gramsToPounds,
  gramsToOunces,
  gramsToStones,
  kilogramsToGrams,
  milligramsToGrams,
  poundsToGrams,
  ouncesToGrams,
  stonesToGrams,
  litersToMilliliters,
  litersToGallons,
  litersToQuarts,
  litersToPints,
  litersToCups,
  millilitersToLiters,
  gallonsToLiters,
  quartsToLiters,
  pintsToLiters,
  cupsToLiters,
  bytesToKilobytes,
  bytesToMegabytes,
  bytesToGigabytes,
  bytesToKibibytes,
  bytesToMebibytes,
  kilobytesToBytes,
  megabytesToBytes,
  gigabytesToBytes,
  kibibytesToBytes,
  mebibytesToBytes,
  secondsToMinutes,
  secondsToHours,
  secondsToDays,
  secondsToWeeks,
  minutesToSeconds,
  hoursToSeconds,
  daysToSeconds,
  weeksToSeconds,
});
