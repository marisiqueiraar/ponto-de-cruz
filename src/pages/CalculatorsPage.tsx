import { useState } from 'react'
import { Callout, SectionHead, SliderControl } from '../components/common/controls'
import { Icon } from '../components/common/Icon'
import { FABRIC_COUNTS, physicalFromStitches } from '../lib/pattern/sizing'
import { calculateFabricSize, FINISH_LABELS, type FinishMethod } from '../lib/stitch/fabricSize'
import { estimateSkeins, recommendedStrands, stitchesPerSkein } from '../lib/stitch/flossEstimate'
import { useEditorStore } from '../state/useEditorStore'

export function CalculatorsPage() {
  const pattern = useEditorStore((s) => s.pattern)
  const settings = useEditorStore((s) => s.settings)

  const [widthStitches, setWidthStitches] = useState(pattern?.width ?? settings.widthStitches)
  const [heightStitches, setHeightStitches] = useState(pattern?.height ?? settings.heightStitches)
  const [fabricCount, setFabricCount] = useState(pattern?.fabricCount ?? settings.fabricCount)
  const [finish, setFinish] = useState<FinishMethod>('bastidor')
  const [strands, setStrands] = useState(recommendedStrands(settings.fabricCount))

  const fabric = calculateFabricSize(widthStitches, heightStitches, fabricCount, finish)
  const totalStitches = widthStitches * heightStitches

  const loadFromPattern = () => {
    if (!pattern) return
    setWidthStitches(pattern.width)
    setHeightStitches(pattern.height)
    setFabricCount(pattern.fabricCount)
    setStrands(recommendedStrands(pattern.fabricCount))
  }

  // Per-color estimate uses the largest color in the palette, the one most likely to need extra skeins.
  const largestColor = pattern?.palette.reduce((max, entry) => (entry.count > max.count ? entry : max), pattern.palette[0])
  const largestEstimate = largestColor ? estimateSkeins(largestColor.count, fabricCount, strands) : null

  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="ruler" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Parâmetros</h2>
              <p>Base para todos os cálculos desta página</p>
            </div>
          </div>

          {pattern && (
            <button type="button" className="btn btn--outline btn--block" onClick={loadFromPattern}>
              <Icon name="download" size={16} />
              Carregar do padrão atual
            </button>
          )}

          <SectionHead>Tamanho do bordado</SectionHead>

          <SliderControl
            label="Largura"
            value={widthStitches}
            min={10}
            max={400}
            display={`${physicalFromStitches(widthStitches, fabricCount).toFixed(1)} cm`}
            minLabel="10 pts"
            maxLabel="400 pts"
            onChange={setWidthStitches}
          />

          <SliderControl
            label="Altura"
            value={heightStitches}
            min={10}
            max={400}
            display={`${physicalFromStitches(heightStitches, fabricCount).toFixed(1)} cm`}
            minLabel="10 pts"
            maxLabel="400 pts"
            onChange={setHeightStitches}
          />

          <div className="control">
            <div className="control__top">
              <span className="control__label">Contagem do tecido</span>
              <span className="value-chip">Aida {fabricCount}</span>
            </div>
            <select
              value={fabricCount}
              aria-label="Contagem do tecido"
              onChange={(e) => {
                const next = Number(e.target.value)
                setFabricCount(next)
                setStrands(recommendedStrands(next))
              }}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8 }}
            >
              {FABRIC_COUNTS.map((count) => (
                <option key={count} value={count}>
                  Aida {count}
                </option>
              ))}
            </select>
          </div>

          <SliderControl
            label="Fios na agulha"
            help="Número de fios do cordão usados no ponto cheio. Mais fios cobrem melhor, mas gastam mais linha."
            value={strands}
            min={1}
            max={4}
            display={`${strands} ${strands === 1 ? 'fio' : 'fios'}`}
            minLabel="1"
            maxLabel="4"
            onChange={setStrands}
          />

          {strands !== recommendedStrands(fabricCount) && (
            <p className="hint hint--warning">
              Para Aida {fabricCount}, o mais comum são {recommendedStrands(fabricCount)} fios.
            </p>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="grid" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Quanto tecido cortar</h2>
              <p>Área bordada mais a margem de acabamento</p>
            </div>
          </div>

          <div className="segmented" style={{ marginBottom: 16 }}>
            {(Object.keys(FINISH_LABELS) as FinishMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                className={finish === method ? 'active' : ''}
                onClick={() => setFinish(method)}
              >
                {FINISH_LABELS[method]}
              </button>
            ))}
          </div>

          <div className="stat-card">
            <span className="stat-card__glyph">
              <Icon name="ruler" size={20} />
            </span>
            <div>
              <div className="stat-card__eyebrow">Cortar o tecido em</div>
              <div className="stat-card__value">
                {fabric.cutWidthCm.toFixed(1)} × {fabric.cutHeightCm.toFixed(1)} cm
              </div>
              <div className="stat-card__note">
                Área bordada {fabric.designWidthCm.toFixed(1)} × {fabric.designHeightCm.toFixed(1)} cm + {fabric.marginCm}cm
                de margem por lado
              </div>
            </div>
          </div>

          <div className="metric-grid" style={{ marginTop: 14 }}>
            <div className="metric">
              <div className="metric__label">Área bordada</div>
              <div className="metric__value">
                {fabric.designWidthCm.toFixed(1)}×{fabric.designHeightCm.toFixed(1)}
                <small>cm</small>
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Margem por lado</div>
              <div className="metric__value">
                {fabric.marginCm}
                <small>cm</small>
              </div>
            </div>
            <div className="metric metric--accent">
              <div className="metric__label">Total de pontos</div>
              <div className="metric__value">{totalStitches.toLocaleString('pt-BR')}</div>
            </div>
          </div>

          <Callout muted>
            Margem curta é o erro mais caro do bordado: o tecido precisa sobrar para prender no bastidor e, na moldura, para
            dobrar atrás do cartão.
          </Callout>
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--green">
              <Icon name="thread" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Quantas meadas comprar</h2>
              <p>Estimativa por cor, com folga de segurança</p>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric metric--accent">
              <div className="metric__label">Pontos por meada</div>
              <div className="metric__value">{stitchesPerSkein(fabricCount, strands).toLocaleString('pt-BR')}</div>
            </div>
            <div className="metric">
              <div className="metric__label">Aida / fios</div>
              <div className="metric__value">
                {fabricCount} / {strands}
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Meada DMC</div>
              <div className="metric__value">
                8<small>m · 6 fios</small>
              </div>
            </div>
          </div>

          {pattern && largestColor && largestEstimate ? (
            <>
              <SectionHead accent="green">Por cor deste padrão</SectionHead>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DMC</th>
                      <th>Cor</th>
                      <th className="num">Pontos</th>
                      <th className="num">Meadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...pattern.palette]
                      .sort((a, b) => b.count - a.count)
                      .map((entry) => {
                        const estimate = estimateSkeins(entry.count, fabricCount, strands)
                        return (
                          <tr key={entry.dmcCode}>
                            <td className="num">{entry.dmcCode}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 13,
                                  height: 13,
                                  borderRadius: 4,
                                  marginRight: 7,
                                  verticalAlign: '-2px',
                                  background: `rgb(${entry.rgb.join(',')})`,
                                  border: '1px solid var(--border)',
                                }}
                              />
                              {entry.name}
                            </td>
                            <td className="num">{entry.count.toLocaleString('pt-BR')}</td>
                            <td className="num">{estimate.skeinsToBuy}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              <p className="hint">
                Total estimado:{' '}
                <strong>
                  {pattern.palette.reduce((sum, entry) => sum + estimateSkeins(entry.count, fabricCount, strands).skeinsToBuy, 0)}{' '}
                  meadas
                </strong>{' '}
                · a cor mais usada ({largestColor.dmcCode}) sozinha pede {largestEstimate.skeinsToBuy}.
              </p>
            </>
          ) : (
            <p className="hint">Gere um padrão no Gerador para ver a estimativa de meadas cor a cor.</p>
          )}

          <p className="hint hint--mono">
            Estimativa com folga de 15% · consumo real varia com tensão do ponto e desperdício
          </p>
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--amber">
              <Icon name="calculator" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>O mesmo padrão em cada tecido</h2>
              <p>Como a contagem muda o tamanho final</p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Tecido</th>
                <th className="num">Tamanho final</th>
                <th className="num">Tecido a cortar</th>
                <th className="num">Fios</th>
              </tr>
            </thead>
            <tbody>
              {FABRIC_COUNTS.map((count) => {
                const row = calculateFabricSize(widthStitches, heightStitches, count, finish)
                return (
                  <tr key={count} style={count === fabricCount ? { background: 'var(--primary-soft)' } : undefined}>
                    <td>Aida {count}</td>
                    <td className="num">
                      {row.designWidthCm.toFixed(1)} × {row.designHeightCm.toFixed(1)} cm
                    </td>
                    <td className="num">
                      {row.cutWidthCm.toFixed(1)} × {row.cutHeightCm.toFixed(1)} cm
                    </td>
                    <td className="num">{recommendedStrands(count)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
