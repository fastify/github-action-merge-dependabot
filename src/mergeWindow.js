
// Standard 5-field cron layout: minute hour day-of-month month day-of-week.
const CRON_FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'dayOfMonth', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'dayOfWeek', min: 0, max: 7 },
]

const WEEKDAY_TO_NUMBER = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const parseInteger = (value, field) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `Invalid merge-window: '${value}' is not a valid number in the ${field.name} field`
    )
  }
  return Number(value)
}

const assertInRange = (value, field) => {
  if (value < field.min || value > field.max) {
    throw new Error(
      `Invalid merge-window: ${value} is out of range (${field.min}-${field.max}) in the ${field.name} field`
    )
  }
}

// Expands a single cron field into the set of values that satisfy it.
// Supports `*`, single values, ranges (`a-b`), lists (`a,b`) and steps (`*/n`, `a-b/n`).
const parseField = (rawField, field) => {
  const values = new Set()

  for (const part of rawField.split(',')) {
    const [range, stepRaw] = part.split('/')

    if (stepRaw !== undefined && !/^\d+$/.test(stepRaw)) {
      throw new Error(
        `Invalid merge-window: '${stepRaw}' is not a valid step in the ${field.name} field`
      )
    }
    const step = stepRaw === undefined ? 1 : Number(stepRaw)
    if (step === 0) {
      throw new Error(
        `Invalid merge-window: step cannot be zero in the ${field.name} field`
      )
    }

    let start
    let end
    if (range === '*') {
      start = field.min
      end = field.max
    } else if (range.includes('-')) {
      const [startRaw, endRaw] = range.split('-')
      start = parseInteger(startRaw, field)
      end = parseInteger(endRaw, field)
    } else {
      start = parseInteger(range, field)
      // A bare value combined with a step (e.g. `5/10`) means "from value to max".
      end = stepRaw === undefined ? start : field.max
    }

    assertInRange(start, field)
    assertInRange(end, field)
    if (start > end) {
      throw new Error(
        `Invalid merge-window: range ${start}-${end} is inverted in the ${field.name} field`
      )
    }

    for (let value = start; value <= end; value += step) {
      values.add(value)
    }
  }

  return values
}

// True when `values` already covers every value in the field's domain, in
// which case the field places no real restriction on the schedule.
const coversFullDomain = (values, field) => {
  for (let value = field.min; value <= field.max; value += 1) {
    if (!values.has(value)) {
      return false
    }
  }
  return true
}

const parseCron = expression => {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== CRON_FIELDS.length) {
    throw new Error(
      `Invalid merge-window: expected 5 fields but got ${fields.length} in '${expression}'`
    )
  }

  const schedule = {}
  CRON_FIELDS.forEach((field, index) => {
    schedule[field.name] = {
      values: parseField(fields[index], field),
    }
  })

  // In cron, both 0 and 7 represent Sunday, so keep the set consistent in both
  // directions (this also lets `0-6` count as covering every weekday).
  if (schedule.dayOfWeek.values.has(7)) {
    schedule.dayOfWeek.values.add(0)
  }
  if (schedule.dayOfWeek.values.has(0)) {
    schedule.dayOfWeek.values.add(7)
  }

  // A field only constrains the schedule when it does not match its entire
  // domain. Treating expressions such as `*/1` or `0-6` (day-of-week) as
  // restricted would wrongly trigger the day-of-month/day-of-week OR rule in
  // isWithinMergeWindow(), so derive `restricted` from the expanded values
  // rather than the raw text.
  CRON_FIELDS.forEach(field => {
    schedule[field.name].restricted = !coversFullDomain(
      schedule[field.name].values,
      field
    )
  })

  return schedule
}

// Extracts the relevant calendar fields of `date` as seen in `timezone`.
const getTimeParts = (date, timezone) => {
  let parts
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(date)
  } catch {
    throw new Error(`Invalid merge-window-timezone: '${timezone}'`)
  }

  const lookup = {}
  for (const { type, value } of parts) {
    lookup[type] = value
  }

  // `hour` can be reported as '24' at midnight by some runtimes; normalise to 0.
  const hour = Number(lookup.hour) % 24

  return {
    minute: Number(lookup.minute),
    hour,
    dayOfMonth: Number(lookup.day),
    month: Number(lookup.month),
    dayOfWeek: WEEKDAY_TO_NUMBER[lookup.weekday],
  }
}

/**
 * Returns true when `now` falls inside the window described by the cron
 * expression `mergeWindow`, evaluated in `timezone`.
 *
 * Mirrors the standard cron rule for the day fields: when both day-of-month
 * and day-of-week are restricted the match is an OR, otherwise it is an AND.
 */
const isWithinMergeWindow = ({ mergeWindow, timezone = 'UTC', now = new Date() }) => {
  const schedule = parseCron(mergeWindow)
  const parts = getTimeParts(now, timezone)

  const minuteMatch = schedule.minute.values.has(parts.minute)
  const hourMatch = schedule.hour.values.has(parts.hour)
  const monthMatch = schedule.month.values.has(parts.month)

  const domMatch = schedule.dayOfMonth.values.has(parts.dayOfMonth)
  const dowMatch = schedule.dayOfWeek.values.has(parts.dayOfWeek)

  const dayMatch =
    schedule.dayOfMonth.restricted && schedule.dayOfWeek.restricted
      ? domMatch || dowMatch
      : domMatch && dowMatch

  return minuteMatch && hourMatch && monthMatch && dayMatch
}

export { isWithinMergeWindow, parseCron, getTimeParts }
