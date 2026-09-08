// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmissionWarningDialog from './EmissionWarningDialog'

describe('EmissionWarningDialog', () => {
  it('expone las advertencias y exige cancelar o continuar explícitamente', () => {
    const onCancel = vi.fn()
    const onContinue = vi.fn()

    render(
      <EmissionWarningDialog
        isOpen
        entries={[
          {
            lineId: 12,
            entityId: 4,
            entityName: 'Kyra SRL',
            voucherType: 'A',
            warnings: [
              { code: 'arca_expired', message: 'El certificado ARCA está vencido.', blocking: false },
            ],
          },
        ]}
        onCancel={onCancel}
        onContinue={onContinue}
        onOpenEntity={vi.fn()}
      />,
    )

    expect(screen.getByRole('alertdialog', { name: /revisar antes de emitir/i })).toBeTruthy()
    expect(screen.getByText('El certificado ARCA está vencido.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /continuar igualmente/i }))

    expect(onContinue).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })
})