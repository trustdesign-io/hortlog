'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MemberPicker, getMemberInitials, type PickerMember } from '@/components/member-picker'

interface MultiMemberPickerProps {
  id?: string
  members: PickerMember[]
  values: string[]
  onChange: (ids: string[]) => void
  /** Each chosen member is sent as a hidden input with this name */
  name: string
  placeholder: string
  disabled?: boolean
}

/** Pick several members: chips for the chosen ones, a search box to add more. */
export function MultiMemberPicker({ id, members, values, onChange, name, placeholder, disabled }: MultiMemberPickerProps) {
  const [pickerValue, setPickerValue] = useState('')

  function handleAdd(memberId: string) {
    if (!memberId || values.includes(memberId)) {
      setPickerValue('')
      return
    }
    onChange([...values, memberId])
    setPickerValue('')
  }

  function handleRemove(memberId: string) {
    onChange(values.filter((v) => v !== memberId))
  }

  const selected = values.map((v) => members.find((m) => m.id === v)).filter((m): m is PickerMember => m !== undefined)
  const unselected = members.filter((m) => !values.includes(m.id))

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span key={m.id} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
              <Avatar size="sm">
                <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{getMemberInitials(m)}</AvatarFallback>
              </Avatar>
              {m.name ?? m.email}
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                disabled={disabled}
                aria-label={`Remove ${m.name ?? m.email}`}
                className="ml-0.5 rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} readOnly />
      ))}
      {unselected.length > 0 && (
        <MemberPicker id={id} members={unselected} value={pickerValue} onValueChange={handleAdd} placeholder={placeholder} disabled={disabled} />
      )}
    </div>
  )
}
