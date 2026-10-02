// Unit conversions used across the shop. Public entry point: import from here only.
import * as length from './units/length.mjs';
import * as mass from './units/mass.mjs';
import * as volume from './units/volume.mjs';
import * as data from './units/data.mjs';
import * as time from './units/time.mjs';

export * from './units/length.mjs';
export * from './units/mass.mjs';
export * from './units/volume.mjs';
export * from './units/data.mjs';
export * from './units/time.mjs';

export const CONVERTERS = Object.freeze({ ...length, ...mass, ...volume, ...data, ...time });

/** Look up a converter by name, e.g. convert("milesToMeters", 2). */
export function convert(name, value) {
  const fn = CONVERTERS[name];
  if (!fn) {
    throw new Error(`unknown converter: ${name}`);
  }
  return fn(value);
}
