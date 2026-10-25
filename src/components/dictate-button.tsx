'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { recognitionCtor, type Recognition } from '@/lib/speech-recognition'
import { cn } from '@/lib/utils'

const ERRORS: Record<string, string> = {
  'not-allowed': 'Allow the microphone for this site to dictate.',
  'service-not-allowed': 'Allow the microphone for this site to dictate.',
  'no-speech': 'Didn’t catch that. Tap the microphone and try again.',
  network: 'Dictating needs a connection.',
}

interface DictateButtonProps {
  /** What was said, to add to the field */
  onText: (text: string) => void
  /** Its accessible name, e.g. "Dictate the title" */
  label: string
  disabled?: boolean
  className?: string
}

/** A microphone that types what you say (British English) into a field. */
export function DictateButton({ onText, label, disabled, className }: DictateButtonProps) {
  const recognition = useRef<Recognition | null>(null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voice, setVoice] = useState({ supported: false, online: true })

  // Known only in the browser: whether it can listen, and whether there's signal
  useEffect(() => {
    const update = () => setVoice({ supported: recognitionCtor() !== null, online: navigator.onLine })
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      recognition.current?.abort()
    }
  }, [])

  function listen() {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    setError(null)
    if (listening) {
      recognition.current?.abort()
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-GB'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const heard = e.results[0]?.[0]?.transcript.trim()
      if (heard) onText(heard.charAt(0).toUpperCase() + heard.slice(1))
    }
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(ERRORS[e.error] ?? 'That didn’t work. Try again, or type it.')
    }
    rec.onend = () => setListening(false)
    recognition.current = rec
    setListening(true)
    rec.start()
  }

  const button = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
  return (
    <div className={cn('flex flex-col items-end', className)}>
      {voice.supported && voice.online ? (
        <button
          type="button"
          onClick={listen}
          disabled={disabled}
          aria-pressed={listening}
          aria-label={listening ? 'Stop listening' : label}
          className={cn(
            button,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            listening
              ? 'animate-pulse bg-tertiary text-tertiary-foreground motion-reduce:animate-none'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <UnavailableAction
          label={label}
          reason={
            !voice.supported
              ? 'This browser can’t listen. Use the microphone on your keyboard instead.'
              : 'Dictating needs a connection. Type it instead.'
          }
          className={cn(button, 'text-muted-foreground')}
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
        </UnavailableAction>
      )}
      {listening && (
        <span className="sr-only" aria-live="polite">
          Listening
        </span>
      )}
      {error && (
        <p className="mt-1 max-w-56 text-right text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
