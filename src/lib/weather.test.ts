import { describe, expect, it } from 'vitest'
import { londonToday, parseDailyForecast } from './weather'

const response = {
  features: [
    {
      properties: {
        timeSeries: [
          { time: '2026-10-12T00:00Z', daySignificantWeatherCode: 15, dayMaxScreenTemperature: 12.2 },
          {
            time: '2026-10-13T00:00Z',
            daySignificantWeatherCode: 3,
            dayMaxScreenTemperature: 15.6,
            nightMinScreenTemperature: 8.4,
            dayProbabilityOfPrecipitation: 12,
          },
        ],
      },
    },
  ],
}

describe('parseDailyForecast', () => {
  it("reads today's entry", () => {
    expect(parseDailyForecast(response, '2026-10-13')).toEqual({
      kind: 'partly-cloudy',
      summary: 'Partly cloudy',
      maxC: 16,
      minC: 8,
      rainChance: 12,
    })
  })
  it('returns null when today is missing or the shape is wrong', () => {
    expect(parseDailyForecast(response, '2026-10-20')).toBeNull()
    expect(parseDailyForecast({}, '2026-10-13')).toBeNull()
  })
  it('copes with missing values', () => {
    const f = parseDailyForecast({ features: [{ properties: { timeSeries: [{ time: '2026-10-13T00:00Z' }] } }] }, '2026-10-13')
    expect(f).toEqual({ kind: 'cloudy', summary: 'Unsettled', maxC: null, minC: null, rainChance: null })
  })
})

describe('londonToday', () => {
  it('uses the London date', () => expect(londonToday(new Date('2026-10-13T23:30:00Z'))).toBe('2026-10-14'))
})
