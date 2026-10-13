/**
 * Today's forecast from the Met Office Weather DataHub (site-specific, daily).
 * Server-only. Needs MET_OFFICE_API_KEY; without it, or on any failure, the
 * forecast is simply null and nothing is shown.
 */

const DAILY_URL = 'https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily'
const CACHE_SECONDS = 3600

export type WeatherKind = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'sleet' | 'hail' | 'snow' | 'thunder'

export interface TodayForecast {
  kind: WeatherKind
  summary: string
  maxC: number | null
  minC: number | null
  rainChance: number | null
}

/** Met Office significant weather codes; see datahub.metoffice.gov.uk/support/faqs. */
const CODES: Record<number, [WeatherKind, string]> = {
  0: ['clear', 'Clear'],
  1: ['clear', 'Sunny'],
  2: ['partly-cloudy', 'Partly cloudy'],
  3: ['partly-cloudy', 'Partly cloudy'],
  5: ['fog', 'Mist'],
  6: ['fog', 'Fog'],
  7: ['cloudy', 'Cloudy'],
  8: ['cloudy', 'Overcast'],
  9: ['rain', 'Light showers'],
  10: ['rain', 'Light showers'],
  11: ['drizzle', 'Drizzle'],
  12: ['rain', 'Light rain'],
  13: ['rain', 'Heavy showers'],
  14: ['rain', 'Heavy showers'],
  15: ['rain', 'Heavy rain'],
  16: ['sleet', 'Sleet showers'],
  17: ['sleet', 'Sleet showers'],
  18: ['sleet', 'Sleet'],
  19: ['hail', 'Hail showers'],
  20: ['hail', 'Hail showers'],
  21: ['hail', 'Hail'],
  22: ['snow', 'Light snow showers'],
  23: ['snow', 'Light snow showers'],
  24: ['snow', 'Light snow'],
  25: ['snow', 'Heavy snow showers'],
  26: ['snow', 'Heavy snow showers'],
  27: ['snow', 'Heavy snow'],
  28: ['thunder', 'Thundery showers'],
  29: ['thunder', 'Thundery showers'],
  30: ['thunder', 'Thunder'],
}

interface DailyStep {
  time?: string
  daySignificantWeatherCode?: number
  dayMaxScreenTemperature?: number
  nightMinScreenTemperature?: number
  dayProbabilityOfPrecipitation?: number
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Picks today's entry (by the date in `today`, YYYY-MM-DD) from a DataHub daily response. */
export function parseDailyForecast(data: unknown, today: string): TodayForecast | null {
  const steps = (data as { features?: Array<{ properties?: { timeSeries?: DailyStep[] } }> })?.features?.[0]?.properties
    ?.timeSeries
  const step = steps?.find((s) => s.time?.startsWith(today))
  if (!step) return null
  const code = num(step.daySignificantWeatherCode)
  const [kind, summary] = (code !== null && CODES[code]) || ['cloudy', 'Unsettled']
  const max = num(step.dayMaxScreenTemperature)
  const min = num(step.nightMinScreenTemperature)
  return {
    kind,
    summary,
    maxC: max === null ? null : Math.round(max),
    minC: min === null ? null : Math.round(min),
    rainChance: num(step.dayProbabilityOfPrecipitation),
  }
}

/** Today's date (YYYY-MM-DD) in London, which the bar reports on. */
export function londonToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(now)
}

export async function getTodayForecast(latitude: number, longitude: number): Promise<TodayForecast | null> {
  const apiKey = process.env.MET_OFFICE_API_KEY
  if (!apiKey) return null
  // Rounded so nearby requests share the hour's cached response
  const url = `${DAILY_URL}?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}&excludeParameterMetadata=true`
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', apikey: apiKey },
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      console.error('[getTodayForecast] Met Office', res.status)
      return null
    }
    return parseDailyForecast(await res.json(), londonToday())
  } catch (err) {
    console.error('[getTodayForecast]', err)
    return null
  }
}
