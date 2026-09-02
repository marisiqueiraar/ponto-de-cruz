import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProjectNameField } from './ProjectNameField'

afterEach(cleanup)

function setup(value = 'Retrato da Helena') {
  const onCommit = vi.fn()
  render(<ProjectNameField value={value} fallback="Sem título" onCommit={onCommit} />)
  const input = screen.getByLabelText('Nome do projeto') as HTMLInputElement
  return { input, onCommit }
}

describe('ProjectNameField', () => {
  it('commits the trimmed name on blur', () => {
    const { input, onCommit } = setup()
    fireEvent.change(input, { target: { value: '  Casa   da vovó ' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith('Casa da vovó')
    expect(input.value).toBe('Casa da vovó')
  })

  it('commits on Enter', () => {
    const { input, onCommit } = setup()
    input.focus()
    fireEvent.change(input, { target: { value: 'Bento' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith('Bento')
  })

  it('restores the previous name on Escape without committing', () => {
    const { input, onCommit } = setup()
    input.focus()
    fireEvent.change(input, { target: { value: 'rascunho descartado' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCommit).not.toHaveBeenCalled()
    expect(input.value).toBe('Retrato da Helena')
  })

  it('falls back to the default when the field is cleared', () => {
    const { input, onCommit } = setup()
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith('Sem título')
    expect(input.value).toBe('Sem título')
  })

  it('does not commit when the name is unchanged', () => {
    const { input, onCommit } = setup()
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('picks up a rename that came from elsewhere while not being edited', () => {
    const onCommit = vi.fn()
    const { rerender } = render(<ProjectNameField value="Antigo" fallback="Sem título" onCommit={onCommit} />)
    rerender(<ProjectNameField value="Restaurado" fallback="Sem título" onCommit={onCommit} />)
    expect((screen.getByLabelText('Nome do projeto') as HTMLInputElement).value).toBe('Restaurado')
  })
})
