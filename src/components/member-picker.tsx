'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'

export interface PickerMember {
  id: string
  name: string | null
  email: string
  avatarUrl?: string | null
}

export function getMemberInitials(m: { name: string | null; email: string }): string {
  if (m.name) {
    return m.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return m.email.slice(0, 2).toUpperCase()
}

interface MemberPickerProps {
  members: PickerMember[]
  value: string
  onValueChange: (value: string) => void
  name?: string
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function MemberPicker({
  members,
  value,
  onValueChange,
  name,
  placeholder = 'Unassigned',
  disabled,
  id,
}: MemberPickerProps) {
  const getMemberLabel = (memberId: string): string => {
    if (!memberId) return ''
    const m = members.find((m) => m.id === memberId)
    return m ? (m.name ?? m.email) : ''
  }

  const [inputValue, setInputValue] = useState(() => getMemberLabel(value))
  const selected = value ? (members.find((m) => m.id === value) ?? null) : null

  // Base UI fires onValueChange then onInputValueChange when an item is selected.
  // We store our own label here so the subsequent onInputValueChange call uses it
  // instead of the item's full text content (which includes avatar fallback initials).
  const pendingLabel = useRef<string | null>(null)

  function handleValueChange(v: string | null) {
    const newVal = v ?? ''
    pendingLabel.current = getMemberLabel(newVal)
    onValueChange(newVal)
  }

  function handleInputValueChange(v: string) {
    if (pendingLabel.current !== null) {
      const label = pendingLabel.current
      pendingLabel.current = null
      setInputValue(label)
      return
    }
    setInputValue(v)
  }

  return (
    <div className="relative">
      {selected && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2"
        >
          <Avatar size="sm">
            <AvatarImage src={selected.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{getMemberInitials(selected)}</AvatarFallback>
          </Avatar>
        </div>
      )}
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <Combobox
        value={value}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showClear={!!value}
          className={selected ? '[&_input]:pl-9' : undefined}
          disabled={disabled}
        />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No members found.</ComboboxEmpty>
            {members.map((m) => (
              <ComboboxItem key={m.id} value={m.id}>
                <Avatar size="sm">
                  <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{getMemberInitials(m)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{m.name ?? m.email}</span>
                {m.name && (
                  <span className="shrink-0 text-xs text-muted-foreground">{m.email}</span>
                )}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
