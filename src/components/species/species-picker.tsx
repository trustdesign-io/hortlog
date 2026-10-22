'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Check, Loader2, Mic, Search, X } from 'lucide-react'
import { addSpeciesFromCatalogue, searchSpeciesCatalogue, searchSpeciesSpoken } from '@/lib/actions/species'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import type { CatalogueSuggestion, ExistingSpecies } from '@/lib/species-catalogue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface PickedSpecies {
  id: string
  scientificName: string
  commonName: string
}

interface SpeciesPickerProps {
  id?: string
  value: PickedSpecies | null
  onChange: (species: PickedSpecies | null) => void
  disabled?: boolean
}

/** The browser's speech recognition, where there is one (Safari and Chrome call it webkitSpeechRecognition) */
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const VOICE_ERRORS: Record<string, string> = {
  'not-allowed': 'Allow the microphone for this site to say a name.',
  'service-not-allowed': 'Allow the microphone for this site to say a name.',
  'no-speech': 'Didn’t catch that. Tap the microphone and say the name again.',
  network: 'Saying a name needs a connection.',
}

type Option =
  | { kind: 'existing'; species: ExistingSpecies }
  | { kind: 'catalogue'; suggestion: CatalogueSuggestion }

/** Botanical part of a label in italics, authority upright. */
function Name({ label }: { label: string }) {
  const words = label.split(' ')
  let i = 1
  while (i < words.length && /^(?:[a-z×-]+|subsp\.|var\.|f\.|×)$/.test(words[i])) i++
  return (
    <>
      <i lang="la">{words.slice(0, i).join(' ')}</i>
      {i < words.length && <span className="text-muted-foreground"> {words.slice(i).join(' ')}</span>}
    </>
  )
}

/**
 * Pick a species: hortlog's own first, then names from the Catalogue of Life.
 * A catalogue name is added (once) before it can be used; synonyms become the
 * accepted name.
 */
export function SpeciesPicker({ id, value, onChange, disabled = false }: SpeciesPickerProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const listId = `${inputId}-list`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<{ existing: ExistingSpecies[]; catalogue: CatalogueSuggestion[] }>({
    existing: [],
    catalogue: [],
  })
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const [adding, setAdding] = useState<CatalogueSuggestion | null>(null)
  const [commonName, setCommonName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const latest = useRef(0)
  // What the phone heard, best guess first, while the box shows the best guess
  const spoken = useRef<string[] | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const [listening, setListening] = useState(false)
  const [fromVoice, setFromVoice] = useState(false)
  const [voice, setVoice] = useState<{ supported: boolean; online: boolean }>({ supported: false, online: true })

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
    rec.maxAlternatives = 5
    rec.onresult = (e) => {
      const heard = Array.from(e.results[0] ?? [])
        .map((a) => a.transcript.trim())
        .filter(Boolean)
      if (heard.length === 0) return
      spoken.current = heard
      setFromVoice(true)
      setQuery(heard[0])
      setOpen(true)
    }
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(VOICE_ERRORS[e.error] ?? 'That didn’t work. Try again, or type the name.')
    }
    rec.onend = () => setListening(false)
    recognition.current = rec
    setListening(true)
    rec.start()
  }

  // Search as you type, after a short pause; ignore answers to older queries
  useEffect(() => {
    if (query.trim().length < 3) return
    const ticket = ++latest.current
    const timer = setTimeout(async () => {
      setSearching(true)
      // Said aloud: look up what it sounds like; typed: what it says
      const heard = spoken.current && spoken.current[0] === query ? spoken.current : null
      const r = heard ? await searchSpeciesSpoken(heard) : await searchSpeciesCatalogue(query)
      if (ticket === latest.current) {
        setResults(r)
        setActive(0)
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const options: Option[] = [
    ...results.existing.map((species) => ({ kind: 'existing' as const, species })),
    ...results.catalogue
      // A catalogue name already in hortlog is shown once, as the hortlog species
      .filter((s) => !s.existingId || !results.existing.some((e) => e.id === s.existingId))
      .map((suggestion) => ({ kind: 'catalogue' as const, suggestion })),
  ]

  function choose(option: Option) {
    setError(null)
    if (option.kind === 'existing') {
      onChange(option.species)
      setOpen(false)
      setQuery('')
      return
    }
    const s = option.suggestion
    if (s.existingId) {
      // Already in hortlog under this or its accepted name
      startTransition(async () => {
        const r = await addSpeciesFromCatalogue(s.usageId, '')
        if (r.success && r.data) onChange(r.data.species)
        else setError(r.success ? 'Something went wrong.' : r.error)
      })
      setOpen(false)
      return
    }
    setAdding(s)
    setCommonName('')
    setOpen(false)
  }

  function add() {
    if (!adding) return
    setError(null)
    startTransition(async () => {
      const r = await addSpeciesFromCatalogue(adding.usageId, commonName)
      if (r.success && r.data) {
        onChange(r.data.species)
        setAdding(null)
        setQuery('')
      } else {
        setError(r.success ? 'Something went wrong.' : r.error)
      }
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || options.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium">{value.commonName}</p>
          <p className="truncate text-xs text-muted-foreground">
            <i lang="la">{value.scientificName}</i>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Choose a different species"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  if (adding) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add to hortlog</p>
          <p className="mt-1">
            <Name label={adding.acceptedLabel ?? adding.label} />
          </p>
          {adding.acceptedLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              You picked <Name label={adding.label} />, now a synonym.
            </p>
          )}
          {adding.family && <p className="mt-0.5 text-xs text-muted-foreground">{adding.family}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${inputId}-common`}>Common name (optional)</Label>
          <Input
            id={`${inputId}-common`}
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            maxLength={120}
            placeholder="Leave blank if it hasn’t one"
            disabled={isPending}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={add} disabled={isPending}>
            {isPending ? 'Adding…' : 'Add species'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(null)} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const showList = open && query.trim().length >= 3

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[active] ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => {
            spoken.current = null
            setFromVoice(false)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Type a botanical name, e.g. Quercus robur"
          autoComplete="off"
          // Botanical names: iOS would "correct" Delonix to Demonic
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={disabled || isPending}
          className="pl-9 pr-20"
        />
        {(searching || isPending) && (
          <Loader2 className="absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        {/* Say the name: Latin is matched by how it sounds */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {voice.supported && voice.online ? (
            <button
              type="button"
              onClick={listen}
              disabled={disabled || isPending}
              aria-pressed={listening}
              aria-label={listening ? 'Stop listening' : 'Say the name'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                listening ? 'animate-pulse bg-tertiary text-tertiary-foreground motion-reduce:animate-none' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <UnavailableAction
              label="Say the name"
              reason={
                !voice.supported
                  ? 'This browser can’t listen. Use the microphone on your keyboard instead.'
                  : 'Saying a name needs a connection. Type it instead.'
              }
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
            </UnavailableAction>
          )}
        </div>
      </div>
      {listening && (
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          Listening… say the botanical name.
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {options.length === 0 && !searching && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {fromVoice ? 'Nothing sounded close. Try again, or type it.' : 'No botanical name found. Check the spelling.'}
            </li>
          )}
          {options.map((o, i) => {
            const first = i === 0 || options[i - 1].kind !== o.kind
            return (
              <li key={o.kind === 'existing' ? o.species.id : o.suggestion.usageId} role="presentation">
                {first && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {o.kind === 'existing' ? 'In hortlog' : 'Catalogue of Life'}
                  </p>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(o)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn('cursor-pointer rounded-md px-3 py-2 text-sm', i === active && 'bg-accent')}
                >
                  {o.kind === 'existing' ? (
                    <>
                      <span className="font-medium">{o.species.commonName}</span>{' '}
                      <i lang="la" className="text-muted-foreground">
                        {o.species.scientificName}
                      </i>
                    </>
                  ) : (
                    <>
                      <Name label={o.suggestion.label} />
                      <span className="block text-xs text-muted-foreground">
                        {o.suggestion.acceptedLabel ? (
                          <>
                            Synonym → now <Name label={o.suggestion.acceptedLabel} />
                          </>
                        ) : (
                          o.suggestion.status === 'accepted' && (
                            <span className="inline-flex items-center gap-1">
                              <Check className="h-3 w-3" aria-hidden="true" />
                              Accepted name
                            </span>
                          )
                        )}
                        {o.suggestion.family && ` · ${o.suggestion.family}`}
                        {o.suggestion.existingId && ' · already in hortlog'}
                      </span>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
