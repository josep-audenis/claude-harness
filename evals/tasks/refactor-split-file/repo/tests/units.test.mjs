import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as units from '../src/units.mjs';

test('converts to and from base units', () => {
  assert.equal(units.milesToMeters(1), 1609.344);
  assert.equal(units.metersToFeet(1), 3.28084);
  assert.equal(units.poundsToGrams(2), 907.18474);
  assert.equal(units.gallonsToLiters(1), 3.785412);
  assert.equal(units.hoursToSeconds(1.5), 5400);
});

test('rejects bad amounts', () => {
  assert.throws(() => units.kilogramsToGrams(-1), RangeError);
  assert.throws(() => units.kilogramsToGrams('3'), TypeError);
  assert.throws(() => units.kilogramsToGrams(Number.NaN), TypeError);
});

test('convert() looks converters up by name', () => {
  assert.equal(units.convert('weeksToSeconds', 1), 604800);
  assert.throws(() => units.convert('lightyearsToMeters', 1), /unknown converter/);
  assert.equal(Object.keys(units.CONVERTERS).length, 52);
});
