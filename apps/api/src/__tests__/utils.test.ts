import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvToRows } from '../utils/csv.js';
import { addDays, addMinutes } from '../utils/date.js';

test('parseCsvToRows parses basic CSV', () => {
  const csv = 'fullName,email,password\nJohn Doe,john@example.com,Pass1234';
  const rows = parseCsvToRows(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].fullName, 'John Doe');
  assert.equal(rows[0].email, 'john@example.com');
  assert.equal(rows[0].password, 'Pass1234');
});

test('date helpers add minutes and days', () => {
  const base = new Date('2026-01-01T00:00:00Z');
  const plusMinutes = addMinutes(base, 30);
  const plusDays = addDays(base, 2);
  assert.equal(plusMinutes.toISOString(), '2026-01-01T00:30:00.000Z');
  assert.equal(plusDays.toISOString(), '2026-01-03T00:00:00.000Z');
});
