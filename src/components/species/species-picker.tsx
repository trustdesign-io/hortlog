'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Check, Loader2, Search, X } from 'lucide-react'
import { addSpeciesFromCatalogue, searchSpeciesCatalogue } from '@/lib/actions/species'
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

  // Search as you type, after a short pause; ignore answers to older queries
  useEffect(() => {
    if (query.trim().length < 3) return
    const ticket = ++latest.current
    const timer = setTimeout(async () => {
      setSearching(true)
      const r = await searchSpeciesCatalogue(query)
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
          <Label htmlFor={`${inputId}-common`}>Common name</Label>
          <Input
            id={`${inputId}-common`}
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            maxLength={120}
            placeholder="e.g. Snake plant"
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
          <Button type="button" size="sm" onClick={add} disabled={isPending || !commonName.trim()}>
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
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Type a botanical name, e.g. Quercus robur"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || isPending}
          className="pl-9"
        />
        {(searching || isPending) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>
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
            <li className="px-3 py-2 text-sm text-muted-foreground">No botanical name found. Check the spelling.</li>
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
