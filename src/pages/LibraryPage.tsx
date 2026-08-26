import { useMemo, useState } from 'react'
import { Icon } from '../components/common/Icon'
import { LIBRARY_PROJECTS, searchLibrary } from '../data/library'
import { physicalFromStitches } from '../lib/pattern/sizing'
import { useEditorStore } from '../state/useEditorStore'
import type { TabId } from '../navigation'

interface LibraryPageProps {
  onNavigate: (tab: TabId) => void
}

const SUGGESTIONS = ['Marcador de livro', 'Almofada', 'Pano de prato', 'Monograma', 'Quadro']

export function LibraryPage({ onNavigate }: LibraryPageProps) {
  const applyPreset = useEditorStore((s) => s.applyPreset)
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const results = useMemo(() => searchLibrary(submitted), [submitted])

  const handleUse = (widthStitches: number, heightStitches: number, fabricCount: number) => {
    applyPreset(widthStitches, heightStitches, fabricCount)
    onNavigate('gerador')
  }

  return (
    <div className="page stack">
      <div className="card">
        <div className="search-hero">
          <h2>Biblioteca de Referência</h2>
          <p>Busque um tipo de projeto e carregue as medidas prontas direto no gerador.</p>
        </div>

        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(query)
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: almofada, marcador, toalha…"
            aria-label="Buscar projeto de referência"
          />
          <button type="submit" className="btn btn--primary">
            <Icon name="search" size={17} />
            Buscar
          </button>
        </form>

        <div className="chip-row">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip"
              onClick={() => {
                setQuery(suggestion)
                setSubmitted(suggestion)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <p className="eyebrow">
        {submitted
          ? `Encontramos ${results.length} ${results.length === 1 ? 'projeto' : 'projetos'} para "${submitted}"`
          : `${LIBRARY_PROJECTS.length} projetos de referência`}
      </p>

      {results.length === 0 && (
        <div className="card">
          <p className="card-sub">
            Nada encontrado para "{submitted}". Tente um termo mais simples, como "quadro" ou "toalha".
          </p>
        </div>
      )}

      <div className="stack">
        {results.map((project) => {
          const widthCm = physicalFromStitches(project.widthStitches, project.fabricCount)
          const heightCm = physicalFromStitches(project.heightStitches, project.fabricCount)

          return (
            <article key={project.id} className="card">
              <div className="result-card">
                <div className="result-card__main">
                  <div className="badge-row">
                    <span className="badge">{project.category}</span>
                    <span className="badge badge--primary">{project.reference}</span>
                  </div>
                  <h2 className="card-title">{project.name}</h2>
                  <p className="card-sub">{project.description}</p>

                  <div className="data-block">
                    <span className="data-block__label">MEDIDAS DE REFERÊNCIA</span>
                    {project.widthStitches} × {project.heightStitches} pontos · {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm
                    em Aida {project.fabricCount}
                  </div>
                </div>

                <div className="result-card__cta">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleUse(project.widthStitches, project.heightStitches, project.fabricCount)}
                  >
                    Usar estas medidas
                    <Icon name="arrow-right" size={16} />
                  </button>
                  <span className="hint hint--mono" style={{ margin: 0 }}>
                    abre no gerador
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
