import { assertAmount, round } from './core.mjs';


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
