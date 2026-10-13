/** Gardens are UK-based for now; weeks start on Monday, London time. */
export const ORG_TIME_ZONE = 'Europe/London'

function zonedParts(at: Date, timeZone: string): { year: number; month: number; day: number; weekday: number; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  )
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday)
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday,
    hour: Number(parts.hour),
  }
}

/** Midnight at the start of this Monday in `timeZone`, as an instant. */
export function startOfWeek(now: Date = new Date(), timeZone: string = ORG_TIME_ZONE): Date {
  const { year, month, day, weekday } = zonedParts(now, timeZone)
  const mondayUtcMidnight = new Date(Date.UTC(year, month - 1, day - weekday))
  // Shift back by the zone's offset at that moment (e.g. an hour in British Summer Time)
  const { hour } = zonedParts(mondayUtcMidnight, timeZone)
  const offsetHours = hour >= 12 ? hour - 24 : hour
  return new Date(mondayUtcMidnight.getTime() - offsetHours * 3_600_000)
}
