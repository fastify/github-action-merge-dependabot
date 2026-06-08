'use strict'

const { test } = require('node:test')
const {
  isWithinMergeWindow,
  parseCron,
  getTimeParts,
} = require('../src/mergeWindow')

// A fixed point in time used across tests: Monday, 2024-06-03 14:30 UTC.
const MONDAY_AFTERNOON_UTC = new Date('2024-06-03T14:30:00Z')

test('isWithinMergeWindow', async t => {
  await t.test('matches when inside a business-hours window', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 9-16 * * 1-5',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
  })

  await t.test('does not match outside the hour range', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 9-12 * * 1-5',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC, // 14:30
      }),
      false
    )
  })

  await t.test('does not match outside the day-of-week range', t => {
    const saturday = new Date('2024-06-01T14:30:00Z')
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 9-16 * * 1-5',
        timezone: 'UTC',
        now: saturday,
      }),
      false
    )
  })

  await t.test('does not match outside the minute range', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-15 9-16 * * 1-5',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC, // minute 30
      }),
      false
    )
  })

  await t.test('respects the configured timezone', t => {
    // 14:30 UTC is inside an 11-16 window...
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 11-16 * * *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
    // ...but the same instant is 23:30 in Tokyo, which is outside it.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 11-16 * * *',
        timezone: 'Asia/Tokyo',
        now: MONDAY_AFTERNOON_UTC,
      }),
      false
    )
    // ...and 10:30 in New York (EDT), which is also outside it.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 11-16 * * *',
        timezone: 'America/New_York',
        now: MONDAY_AFTERNOON_UTC,
      }),
      false
    )
  })

  await t.test('defaults to UTC when no timezone is given', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0-59 9-16 * * 1-5',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
  })

  await t.test('uses the current time when now is not provided', t => {
    // A window that is always open should match regardless of the current time.
    t.assert.strictEqual(
      isWithinMergeWindow({ mergeWindow: '* * * * *' }),
      true
    )
  })

  await t.test('matches a specific minute and month', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '30 14 3 6 *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '30 14 3 7 *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      false
    )
  })

  await t.test('ORs day-of-month and day-of-week when both restricted', t => {
    // Monday the 3rd: day-of-week matches even though day-of-month (15) does not.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '* * 15 * 1',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
    // Neither the day-of-month (15) nor the day-of-week (Sunday) matches.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '* * 15 * 0',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      false
    )
  })

  await t.test('treats both 0 and 7 as Sunday', t => {
    const sunday = new Date('2024-06-02T10:00:00Z')
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '* * * * 7',
        timezone: 'UTC',
        now: sunday,
      }),
      true
    )
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '* * * * 0',
        timezone: 'UTC',
        now: sunday,
      }),
      true
    )
  })

  await t.test('supports step values', t => {
    // */15 in the minute field includes 0,15,30,45 -> 30 matches.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '*/15 * * * *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
    // */20 includes 0,20,40 -> 30 does not match.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '*/20 * * * *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      false
    )
  })

  await t.test('supports a bare value with a step', t => {
    // 0/15 -> 0,15,30,45 -> 30 matches.
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0/15 * * * *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
  })

  await t.test('supports comma separated lists', t => {
    t.assert.strictEqual(
      isWithinMergeWindow({
        mergeWindow: '0,30 14 * * *',
        timezone: 'UTC',
        now: MONDAY_AFTERNOON_UTC,
      }),
      true
    )
  })
})

test('parseCron validation', async t => {
  await t.test('throws on the wrong number of fields', t => {
    t.assert.throws(() => parseCron('* * *'), /expected 5 fields/)
    t.assert.throws(() => parseCron('* * * * * *'), /expected 5 fields/)
  })

  await t.test('throws on out-of-range values', t => {
    t.assert.throws(() => parseCron('* 24 * * *'), /out of range/)
    t.assert.throws(() => parseCron('60 * * * *'), /out of range/)
  })

  await t.test('throws on non-numeric values', t => {
    t.assert.throws(() => parseCron('abc * * * *'), /not a valid number/)
  })

  await t.test('throws on inverted ranges', t => {
    t.assert.throws(() => parseCron('* 16-9 * * *'), /inverted/)
  })

  await t.test('throws on a zero step', t => {
    t.assert.throws(() => parseCron('*/0 * * * *'), /step cannot be zero/)
  })

  await t.test('throws on a non-numeric step', t => {
    t.assert.throws(() => parseCron('*/x * * * *'), /not a valid step/)
  })
})

test('getTimeParts', async t => {
  await t.test('throws on an invalid timezone', t => {
    t.assert.throws(
      () => getTimeParts(MONDAY_AFTERNOON_UTC, 'Not/AZone'),
      /Invalid merge-window-timezone/
    )
  })

  await t.test('extracts the expected calendar fields', t => {
    t.assert.deepStrictEqual(getTimeParts(MONDAY_AFTERNOON_UTC, 'UTC'), {
      minute: 30,
      hour: 14,
      dayOfMonth: 3,
      month: 6,
      dayOfWeek: 1,
    })
  })
})
