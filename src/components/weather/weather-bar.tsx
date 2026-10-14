import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { getTodayForecast, type WeatherKind } from '@/lib/weather'
import { Ticker } from './ticker'

const ICONS: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  sleet: CloudRain,
  hail: CloudHail,
  snow: CloudSnow,
  thunder: CloudLightning,
}

interface WeatherBarProps {
  latitude: number
  longitude: number
  /** Where the forecast is for, e.g. the organisation's name */
  place: string
}

/** Classes shared by the bar and its loading placeholder: pinned to the very top, full viewport width. */
export const UTILITY_BAR_CLASS = 'fixed inset-x-0 top-0 z-50 flex h-8 w-screen items-center gap-2 border-b bg-card px-4 text-xs sm:px-6'

/** Today's forecast for the garden, as a one-line ticker above everything. Renders nothing if there's no forecast. */
export async function WeatherBar({ latitude, longitude, place }: WeatherBarProps) {
  const forecast = await getTodayForecast(latitude, longitude)
  if (!forecast) return null
  const Icon = ICONS[forecast.kind]
  const temps =
    forecast.maxC !== null && forecast.minC !== null
      ? `High ${forecast.maxC}° / low ${forecast.minC}°`
      : forecast.maxC !== null
        ? `High ${forecast.maxC}°`
        : forecast.minC !== null
          ? `Low ${forecast.minC}°`
          : null
  const parts = [
    temps,
    forecast.rainChance !== null ? `${forecast.rainChance}% chance of rain` : null,
    'Met Office',
  ].filter(Boolean)

  return (
    <section id="utility-bar" aria-label="Today's weather" className={UTILITY_BAR_CLASS}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Ticker>
        <span className="font-medium">
          Today at {place}: {forecast.summary}
        </span>
        <span className="tabular-nums text-muted-foreground">{parts.map((p) => ` · ${p}`).join('')}</span>
      </Ticker>
    </section>
  )
}
