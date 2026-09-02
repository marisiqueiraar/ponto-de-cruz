import { describe, expect, it } from 'vitest'
import { DEFAULT_PATTERN_NAME, normalizeProjectName, toFileName } from './projectName'

describe('normalizeProjectName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeProjectName('  Casa   da   vovó  ', DEFAULT_PATTERN_NAME)).toBe('Casa da vovó')
  })

  it('falls back when the field is cleared', () => {
    expect(normalizeProjectName('', DEFAULT_PATTERN_NAME)).toBe(DEFAULT_PATTERN_NAME)
    expect(normalizeProjectName('   ', DEFAULT_PATTERN_NAME)).toBe(DEFAULT_PATTERN_NAME)
  })

  it('keeps accents and punctuation intact', () => {
    expect(normalizeProjectName('Aniversário — 2 anos', DEFAULT_PATTERN_NAME)).toBe('Aniversário — 2 anos')
  })

  it('caps the length without leaving a trailing space', () => {
    const long = `${'a'.repeat(59)}   tail`
    const result = normalizeProjectName(long, DEFAULT_PATTERN_NAME)
    expect(result).toBe('a'.repeat(59))
    expect(result.length).toBeLessThanOrEqual(60)
  })
})

describe('toFileName', () => {
  it('replaces characters that break download dialogs', () => {
    expect(toFileName('Ana 12/03', 'padrao')).toBe('Ana-12-03')
    expect(toFileName('Retrato: "Bento"', 'padrao')).toBe('Retrato-Bento')
  })

  it('collapses repeated separators', () => {
    expect(toFileName('Casa   da  vovó', 'padrao')).toBe('Casa-da-vovó')
  })

  it('never ends in a dot or hyphen', () => {
    expect(toFileName('Padrão...', 'padrao')).toBe('Padrão')
    expect(toFileName('  /  ', 'padrao')).toBe('padrao')
  })

  it('falls back when nothing usable is left', () => {
    expect(toFileName('???', 'padrao')).toBe('padrao')
  })
})
