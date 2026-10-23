import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RecordSearch } from './record-search'

const records = [
  { id: '1', fields: ['Catalpa bignonioides ‘Nana’', 'Bignoniaceae', 'Indian bean tree', 'Lullingstone'], node: <span>Catalpa</span> },
  { id: '2', fields: ['Ginkgo biloba ‘Mariken’', 'Ginkgoaceae', 'Maidenhair tree', 'Lullingstone'], node: <span>Ginkgo</span> },
  { id: '3', fields: ['Quercus robur', 'Fagaceae', 'English oak', '#026'], node: <span>Oak</span> },
]

describe('RecordSearch', () => {
  it('lists everything until something is typed', () => {
    render(<RecordSearch records={records} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('finds a record despite a typo', () => {
    render(<RecordSearch records={records} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'catalap' } })
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Catalpa'])
  })

  it('searches families and common names', () => {
    render(<RecordSearch records={records} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'maidenhair' } })
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Ginkgo'])
  })

  it('says when nothing matches', () => {
    render(<RecordSearch records={records} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } })
    expect(screen.getByText('No records match.')).toBeTruthy()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
