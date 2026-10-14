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

/** Full-width strip with today's forecast for the garden, from tablet/desktop width up. Renders nothing if there's no forecast. */
export async function WeatherBar({ latitude, longitude, place }: WeatherBarProps) {
  const forecast = await getTodayForecast(latitude, longitude)
  if (!forecast) return null
  const Icon = ICONS[forecast.kind]
  const temps = [forecast.maxC, forecast.minC].filter((t): t is number => t !== null)

  return (
    <section
      aria-label="Today's weather"
      className="-mx-4 -mt-5 mb-6 hidden items-center md:flex gap-x-3 gap-y-1 border-b bg-card px-4 py-2 text-sm sm:-mx-6 sm:px-6 md:-mt-6"
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="font-medium">
          Today at {place}: {forecast.summary}
        </span>
        {temps.length > 0 && (
          <span className="tabular-nums">
            {forecast.maxC !== null && (
              <>
                <span className="sr-only">High </span>
                {forecast.maxC}°
              </>
            )}
            {forecast.maxC !== null && forecast.minC !== null && <span className="text-muted-foreground"> / </span>}
            {forecast.minC !== null && (
              <span className="text-muted-foreground">
                <span className="sr-only">low </span>
                {forecast.minC}°
              </span>
            )}
          </span>
        )}
        {forecast.rainChance !== null && (
          <span className="text-muted-foreground tabular-nums">{forecast.rainChance}% chance of rain</span>
        )}
      </p>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Met Office</span>
    </section>
  )
}
