import { assertAmount, round } from './core.mjs';


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
