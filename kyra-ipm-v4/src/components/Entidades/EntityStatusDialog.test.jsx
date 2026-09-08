// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EntityStatusDialog from './EntityStatusDialog'

describe('EntityStatusDialog', () => {
  it('archiva sin borrar y restaura como inactiva', () => {
    const onConfirm = vi.fn()
    const { rerender } = render(
      <EntityStatusDialog
        entity={{ id: 1, name: 'Kyra SRL' }}
        action="archive"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }))
    expect(onConfirm).toHaveBeenLastCalledWith('archived')

    rerender(
      <EntityStatusDialog
        entity={{ id: 1, name: 'Kyra SRL' }}
        action="restore"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(onConfirm).toHaveBeenLastCalledWith('inactive')
  })
})