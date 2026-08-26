import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, type IconName } from '../common/Icon'
import { MOTIFS } from '../../data/motifs'
import { OBJECTIVES } from '../../data/objectives'
import { STITCH_TYPES, TIPS } from '../../data/stitchGuide'
import { SUBSTRATES } from '../../data/substrates'
import type { TabId } from '../../navigation'

interface SearchResult {
  id: string
  label: string
  detail: string
  group: string
  icon: IconName
  tab: TabId
}

/** Everything searchable, flattened once — the app's own index of what it knows. */
function buildIndex(): Array<SearchResult & { haystack: string }> {
  const entries: SearchResult[] = [
    ...OBJECTIVES.map((o) => ({
      id: `objetivo-${o.id}`,
      label: o.name,
      detail: `${o.widthCm}×${o.heightCm}cm · ${o.count}ct`,
      group: 'Objetivos',
      icon: 'bulb' as IconName,
      tab: 'criar' as TabId,
    })),
    ...SUBSTRATES.map((s) => ({
      id: `material-${s.id}`,
      label: s.name,
      detail: s.family === 'papel' ? 'Papel' : 'Tecido',
      group: 'Materiais',
      icon: 'ruler' as IconName,
      tab: 'guia' as TabId,
    })),
    ...MOTIFS.map((m) => ({
      id: `motivo-${m.id}`,
      label: m.name,
      detail: `${m.shape.width}×${m.shape.height} pontos`,
      group: 'Motivos',
      icon: 'palette' as IconName,
      tab: 'criar' as TabId,
    })),
    ...STITCH_TYPES.map((s) => ({
      id: `ponto-${s.id}`,
      label: s.name,
      detail: 'Tipo de ponto',
      group: 'Guia',
      icon: 'thread' as IconName,
      tab: 'guia' as TabId,
    })),
    ...TIPS.map((t) => ({
      id: `dica-${t.id}`,
      label: t.title,
      detail: 'Dica',
      group: 'Guia',
      icon: 'bulb' as IconName,
      tab: 'guia' as TabId,
    })),
  ]

  return entries.map((entry) => ({
    ...entry,
    haystack: `${entry.label} ${entry.detail} ${entry.group}`.toLowerCase(),
  }))
}

const INDEX = buildIndex()
const MAX_RESULTS = 7

interface GlobalSearchProps {
  onNavigate: (tab: TabId) => void
}

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    const terms = normalized.split(/\s+/)
    return INDEX.filter((entry) => terms.every((term) => entry.haystack.includes(term))).slice(0, MAX_RESULTS)
  }, [query])

  // Clicking anywhere outside dismisses the dropdown.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const choose = (result: SearchResult) => {
    onNavigate(result.tab)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="global-search" ref={containerRef}>
      <span className="global-search__icon">
        <Icon name="search" size={16} />
      </span>
      <input
        type="search"
        value={query}
        placeholder="Buscar projeto, material, motivo…"
        aria-label="Buscar no app"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter' && results[0]) choose(results[0])
        }}
      />

      {open && query.trim() !== '' && (
        <div className="global-search__results">
          {results.length === 0 && <p className="global-search__empty">Nada encontrado para "{query}".</p>}
          {results.map((result) => (
            <button key={result.id} type="button" className="global-search__item" onClick={() => choose(result)}>
              <Icon name={result.icon} size={16} />
              <span className="global-search__label">{result.label}</span>
              <span className="global-search__detail">{result.detail}</span>
              <span className="global-search__group">{result.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
