import { useState } from 'react'
import { Callout } from '../components/common/controls'
import { Icon, type IconName } from '../components/common/Icon'

interface SearchSite {
  id: string
  name: string
  blurb: string
  icon: IconName
  /** Builds the site's search URL. `hashtag` is used by sites that browse tags, not phrases. */
  url: (query: string, hashtag: string) => string
}

const SITES: SearchSite[] = [
  {
    id: 'pinterest',
    name: 'Pinterest',
    blurb: 'Melhor lugar para achar o estilo — molduras bordadas, monogramas e arranjos de arabesco.',
    icon: 'palette',
    url: (q) => `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'google',
    name: 'Google Imagens',
    blurb: 'Busca ampla. Bom para achar gráficos prontos e tabelas de alfabeto.',
    icon: 'search',
    url: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
  },
  {
    id: 'etsy',
    name: 'Etsy',
    blurb: 'Trabalho de outras bordadeiras vendendo o mesmo tipo de peça — útil para preço e acabamento.',
    icon: 'compass',
    url: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    blurb: 'A hashtag do estilo, onde as encomendas desse tipo circulam.',
    icon: 'photo',
    url: (_q, hashtag) => `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`,
  },
]

/**
 * Ready-made angles that turn a vague idea into a query that actually returns the right thing.
 * `hashtag` is separate because Instagram only browses single real tags — pasting a whole
 * sentence there produces a tag nobody has ever posted under.
 */
const ANGLES: Array<{ label: string; suffix: string; hashtag: string }> = [
  { label: 'Moldura de foto bordada', suffix: 'cross stitch photo mat embroidered card', hashtag: 'embroideredphoto' },
  { label: 'Monograma cursivo', suffix: 'cross stitch script monogram letter', hashtag: 'crossstitchmonogram' },
  { label: 'Arabescos e volutas', suffix: 'cross stitch flourish scroll border', hashtag: 'crossstitchborder' },
  { label: 'Bordado em papel', suffix: 'embroidery on paper cardstock cross stitch', hashtag: 'paperembroidery' },
  { label: 'Alfabeto de ponto cruz', suffix: 'cross stitch alphabet chart', hashtag: 'crossstitchalphabet' },
  { label: 'Data e nome bordados', suffix: 'cross stitch date name wedding keepsake', hashtag: 'pontocruz' },
]

const SUGGESTIONS = ['casamento', 'aniversário', 'bebê', 'família', 'flores', 'coração']

export function ReferencesPage() {
  const [query, setQuery] = useState('')
  const [angle, setAngle] = useState(ANGLES[0])

  const term = query.trim()
  const fullQuery = term ? `${term} ${angle.suffix}` : angle.suffix

  return (
    <div className="page stack">
      <div className="card">
        <div className="search-hero">
          <h2>Buscar referências</h2>
          <p>Digite o tema, escolha o ângulo da busca e abra nos sites onde esse tipo de trabalho circula.</p>
        </div>

        <div className="search-bar">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: casamento, inicial M, flores…"
            aria-label="Tema da referência"
          />
        </div>

        <div className="chip-row">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" className="chip" onClick={() => setQuery(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Ângulo da busca</p>
        <div className="motif-grid">
          {ANGLES.map((option) => (
            <button
              key={option.label}
              type="button"
              className={option.label === angle.label ? 'motif-tile motif-tile--active' : 'motif-tile'}
              onClick={() => setAngle(option)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="data-block">
          <span className="data-block__label">BUSCA QUE SERÁ ABERTA</span>
          {fullQuery}
        </div>
        <p className="hint">
          Os termos em inglês entram de propósito: é onde está a maior parte das referências desse estilo.
        </p>
      </div>

      <div className="card-grid">
        {SITES.map((site) => (
          <article key={site.id} className="card">
            <span className="icon-tile">
              <Icon name={site.icon} size={21} />
            </span>
            <h2 className="card-title">{site.name}</h2>
            <p className="card-sub">{site.blurb}</p>
            <a
              className="btn btn--primary btn--block"
              href={site.url(fullQuery, angle.hashtag)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: 16 }}
            >
              Abrir busca
              <Icon name="arrow-right" size={16} />
            </a>
          </article>
        ))}
      </div>

      <Callout muted>
        As buscas abrem em uma aba nova, direto no site. Nada é enviado do seu projeto — o app continua rodando só no
        seu navegador.
      </Callout>
    </div>
  )
}
