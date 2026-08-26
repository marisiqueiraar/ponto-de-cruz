import { Icon, type IconName } from '../components/common/Icon'
import { physicalFromStitches } from '../lib/pattern/sizing'
import { tipOfTheDay } from '../data/stitchGuide'
import { useEditorStore } from '../state/useEditorStore'
import type { TabId } from '../navigation'

interface DashboardPageProps {
  onNavigate: (tab: TabId) => void
}

const SHORTCUTS: Array<{ tab: TabId; icon: IconName; tone: string; title: string; body: string; cta: string }> = [
  {
    tab: 'gerador',
    icon: 'layers',
    tone: '',
    title: 'Gerador de Padrões',
    body: 'Envie uma foto, ajuste o tamanho e a paleta, e saia com o gráfico de quadradinhos pronto.',
    cta: 'Acessar',
  },
  {
    tab: 'biblioteca',
    icon: 'compass',
    tone: '',
    title: 'Biblioteca',
    body: 'Busque um tipo de projeto parecido com o que quer fazer e carregue as medidas prontas.',
    cta: 'Explorar',
  },
  {
    tab: 'calculadoras',
    icon: 'calculator',
    tone: 'icon-tile--green',
    title: 'Calculadoras',
    body: 'Descubra quanto tecido cortar, quantas meadas comprar e como a contagem muda o tamanho.',
    cta: 'Calcular',
  },
]

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const settings = useEditorStore((s) => s.settings)
  const tip = tipOfTheDay()

  const totalStitches = pattern ? pattern.width * pattern.height : 0
  const widthCm = pattern ? physicalFromStitches(pattern.width, pattern.fabricCount) : 0
  const heightCm = pattern ? physicalFromStitches(pattern.height, pattern.fabricCount) : 0

  return (
    <div className="page stack">
      <div className="card-grid">
        {SHORTCUTS.map((shortcut) => (
          <article key={shortcut.tab} className="card">
            <span className={`icon-tile ${shortcut.tone}`}>
              <Icon name={shortcut.icon} size={21} />
            </span>
            <h2 className="card-title">{shortcut.title}</h2>
            <p className="card-sub">{shortcut.body}</p>
            <button
              type="button"
              className={shortcut.tone ? 'card-link card-link--green' : 'card-link'}
              onClick={() => onNavigate(shortcut.tab)}
            >
              {shortcut.cta} <Icon name="arrow-right" size={15} />
            </button>
          </article>
        ))}
      </div>

      <div className="page--split" style={{ padding: 0 }}>
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--amber">
              <Icon name="bulb" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>{tip.title}</h2>
              <p>Dica de bordado</p>
            </div>
          </div>
          <p className="card-sub">{tip.body}</p>
        </div>

        <div className="status-panel">
          <p className="eyebrow">Status do projeto</p>
          {pattern ? (
            <>
              <div className="status-panel__row">
                <span className="status-panel__dot" />
                <span>Padrão carregado</span>
                <span>{pattern.name || 'Sem título'}</span>
              </div>
              <div className="status-panel__row">
                <span className="status-panel__dot" />
                <span>Grade</span>
                <span>
                  {pattern.width} × {pattern.height} pts
                </span>
              </div>
              <div className="status-panel__row">
                <span className="status-panel__dot" />
                <span>Tamanho final</span>
                <span>
                  {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm
                </span>
              </div>
              <div className="status-panel__row">
                <span className="status-panel__dot" />
                <span>Cores / pontos</span>
                <span>
                  {pattern.palette.length} / {totalStitches.toLocaleString('pt-BR')}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="status-panel__row">
                <span className="status-panel__dot status-panel__dot--idle" />
                <span>Nenhum padrão ainda</span>
                <span>Aida {settings.fabricCount}</span>
              </div>
              <div className="status-panel__row">
                <span className="status-panel__dot status-panel__dot--idle" />
                <span>Comece pelo Gerador</span>
                <span>—</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
