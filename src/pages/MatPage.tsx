import { useCallback, useMemo, useState } from 'react'
import { MatCanvas } from '../components/mat/MatCanvas'
import { Callout, SectionHead, SliderControl } from '../components/common/controls'
import { Icon } from '../components/common/Icon'
import { BUILTIN_TYPEFACES } from '../data/fonts/builtinTypefaces'
import { FONTS } from '../data/fonts'
import { MOTIFS, MOTIF_CATEGORY_LABELS, type MotifCategory } from '../data/motifs'
import { getSubstrate, SUBSTRATES } from '../data/substrates'
import { dmcCssColor, findClosestDmcColor } from '../lib/color/dmcMatch'
import { itemOverflows, matGrid, stitchCountsByColor } from '../lib/mat/matGeometry'
import { estimateSkeins } from '../lib/stitch/flossEstimate'
import { useFontLibraryStore } from '../state/useFontLibraryStore'
import { roundCm, useMatStore } from '../state/useMatStore'
import { MotifPreview } from '../components/mat/MotifPreview'
import type { Rotation } from '../lib/motifs/gridDraw'

const CATEGORY_ORDER: MotifCategory[] = ['arabesco', 'estrela', 'coracao', 'moldura']

export function MatPage() {
  const project = useMatStore((s) => s.project)
  const selectedItemId = useMatStore((s) => s.selectedItemId)
  const updateProject = useMatStore((s) => s.updateProject)
  const addMotif = useMatStore((s) => s.addMotif)
  const addText = useMatStore((s) => s.addText)
  const updateItem = useMatStore((s) => s.updateItem)
  const removeItem = useMatStore((s) => s.removeItem)
  const selectItem = useMatStore((s) => s.selectItem)

  const ensureBuiltinRasterized = useFontLibraryStore((s) => s.ensureBuiltinRasterized)
  const loadingBuiltinId = useFontLibraryStore((s) => s.loadingBuiltinId)
  const customFonts = useFontLibraryStore((s) => s.customFonts)

  const [threadHex, setThreadHex] = useState('#b3122b')
  const [text, setText] = useState('')
  const [fontId, setFontId] = useState(BUILTIN_TYPEFACES[0]?.id ?? FONTS[0].id)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // jsPDF is heavy; load it only when a guide is actually requested.
      const { exportMatToPdf } = await import('../lib/pdf/exportMatPdf')
      exportMatToPdf(project)
    } finally {
      setExporting(false)
    }
  }

  const substrate = getSubstrate(project.substrateId)
  const grid = matGrid(project)
  const threadDmc = useMemo(() => findClosestDmcColor(hexToRgb(threadHex)), [threadHex])
  const selectedItem = project.items.find((item) => item.id === selectedItemId) ?? null

  const counts = useMemo(() => stitchCountsByColor(project), [project])
  const totalStitches = [...counts.values()].reduce((sum, n) => sum + n, 0)

  /** Items store a DMC code; the canvas needs the matching CSS colour. */
  const colorOf = useCallback((dmcCode: string) => dmcCssColor(dmcCode), [])

  const handleAddText = async () => {
    if (!text.trim()) return
    if (BUILTIN_TYPEFACES.some((t) => t.id === fontId)) await ensureBuiltinRasterized(fontId)
    addText(text, fontId, threadDmc.code)
    setText('')
  }

  const overflowing = project.items.filter((item) => itemOverflows(project, item))

  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <Callout>
            <strong>Como funciona:</strong> monte o bordado ao redor da janela onde a foto impressa vai ser colada.
            Depois imprima o guia em escala 100% para furar o papel e bordar por cima.
          </Callout>

          <SectionHead>Material</SectionHead>
          <label className="field">
            <span>Base</span>
            <select
              value={project.substrateId}
              onChange={(e) => {
                const next = getSubstrate(e.target.value)
                updateProject({ substrateId: e.target.value, count: next?.defaultCount ?? project.count })
              }}
            >
              <optgroup label="Papel">
                {SUBSTRATES.filter((s) => s.family === 'papel').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Tecido">
                {SUBSTRATES.filter((s) => s.family === 'tecido').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          {substrate && (
            <>
              <label className="field">
                <span>Contagem (furos por polegada)</span>
                <select value={project.count} onChange={(e) => updateProject({ count: Number(e.target.value) })}>
                  {substrate.counts.map((count) => (
                    <option key={count} value={count}>
                      {count} ct
                    </option>
                  ))}
                </select>
              </label>

              <div className="data-block">
                <span className="data-block__label">FICHA DO MATERIAL</span>
                Fios: {substrate.strands}
                <br />
                Agulha: {substrate.needle}
                <br />
                {substrate.needsPiercing ? 'Você fura a grade com o guia impresso' : 'Grade já vem pronta'} ·{' '}
                {substrate.needsHoop ? 'usa bastidor' : 'sem bastidor'}
              </div>

              <p className="hint">{substrate.description}</p>
              <ul className="caution-list">
                {substrate.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="card">
          <SectionHead>Cartão e janela da foto</SectionHead>

          <div className="control-row">
            <SliderControl
              label="Largura do cartão"
              value={project.widthCm}
              min={5}
              max={40}
              step={0.5}
              display={`${project.widthCm} cm`}
              minLabel="5cm"
              maxLabel="40cm"
              onChange={(value) => updateProject({ widthCm: value })}
            />
            <SliderControl
              label="Altura do cartão"
              value={project.heightCm}
              min={5}
              max={40}
              step={0.5}
              display={`${project.heightCm} cm`}
              minLabel="5cm"
              maxLabel="40cm"
              onChange={(value) => updateProject({ heightCm: value })}
            />
          </div>

          <SectionHead accent="amber">Janela da foto</SectionHead>
          <div className="control-row">
            <label className="field">
              <span>Largura (cm)</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={project.photo.widthCm}
                onChange={(e) => updateProject({ photo: { ...project.photo, widthCm: roundCm(Number(e.target.value)) } })}
              />
            </label>
            <label className="field">
              <span>Altura (cm)</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={project.photo.heightCm}
                onChange={(e) => updateProject({ photo: { ...project.photo, heightCm: roundCm(Number(e.target.value)) } })}
              />
            </label>
            <label className="field">
              <span>Margem esquerda (cm)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={project.photo.xCm}
                onChange={(e) => updateProject({ photo: { ...project.photo, xCm: roundCm(Number(e.target.value)) } })}
              />
            </label>
            <label className="field">
              <span>Margem superior (cm)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={project.photo.yCm}
                onChange={(e) => updateProject({ photo: { ...project.photo, yCm: roundCm(Number(e.target.value)) } })}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn btn--outline btn--block"
            onClick={() =>
              updateProject({
                photo: {
                  ...project.photo,
                  xCm: roundCm((project.widthCm - project.photo.widthCm) / 2),
                  yCm: roundCm((project.heightCm - project.photo.heightCm) / 2),
                },
              })
            }
          >
            Centralizar a foto
          </button>
        </div>

        <div className="card">
          <SectionHead accent="green">Linha</SectionHead>
          <div className="control-row">
            <label className="field">
              <span>Cor</span>
              <input type="color" value={threadHex} onChange={(e) => setThreadHex(e.target.value)} />
            </label>
            <div className="field">
              <span>DMC aproximado</span>
              <div className="value-chip" style={{ marginLeft: 0, alignSelf: 'flex-start' }}>
                {threadDmc.code} · {threadDmc.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="grid" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Layout do bordado</h2>
              <p>
                {grid.cols} × {grid.rows} furos · arraste os elementos para posicionar
              </p>
            </div>
            <div className="panel-head__actions">
              {selectedItem && (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => updateItem(selectedItem.id, { rotation: (((selectedItem.rotation + 90) % 360) as Rotation) })}
                  >
                    Girar
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => updateItem(selectedItem.id, { mirrored: !selectedItem.mirrored })}
                  >
                    Espelhar
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => removeItem(selectedItem.id)}>
                    Remover
                  </button>
                </>
              )}
            </div>
          </div>

          <MatCanvas colorOf={colorOf} />

          <div className="canvas-footer">
            <span>
              Cartão {project.widthCm} × {project.heightCm} cm
            </span>
            <span>· {totalStitches.toLocaleString('pt-BR')} pontos</span>
            {selectedItem && <span>· selecionado: {selectedItem.kind === 'text' ? selectedItem.text : 'motivo'}</span>}
          </div>

          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 14 }}
            onClick={handleExport}
            disabled={exporting || project.items.length === 0}
          >
            <Icon name="printer" size={17} />
            {exporting ? 'Gerando guia…' : 'Baixar guia 1:1 para furar e bordar'}
          </button>

          {overflowing.length > 0 && (
            <p className="hint hint--warning">
              {overflowing.length} element{overflowing.length === 1 ? 'o passa' : 'os passam'} da borda do cartão — arraste
              para dentro antes de imprimir.
            </p>
          )}
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="type" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Monograma, data ou frase</h2>
              <p>Fontes cursivas viram letras bordadas</p>
            </div>
          </div>

          <div className="control-row">
            <label className="field">
              <span>Texto</span>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: K, 22-8-26, a+l"
              />
            </label>
            <label className="field">
              <span>Fonte</span>
              <select value={fontId} onChange={(e) => setFontId(e.target.value)}>
                <optgroup label="Cursivas e display">
                  {BUILTIN_TYPEFACES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Blocos">
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
                {customFonts.length > 0 && (
                  <optgroup label="Minhas fontes">
                    {customFonts.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          </div>

          <button type="button" className="btn btn--primary btn--block" onClick={handleAddText} disabled={loadingBuiltinId === fontId}>
            <Icon name="plus" size={16} />
            {loadingBuiltinId === fontId ? 'Convertendo fonte…' : 'Adicionar ao cartão'}
          </button>
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--amber">
              <Icon name="palette" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Motivos decorativos</h2>
              <p>Clique para adicionar ao cartão</p>
            </div>
          </div>

          {CATEGORY_ORDER.map((category) => (
            <div key={category}>
              <SectionHead>{MOTIF_CATEGORY_LABELS[category]}</SectionHead>
              <div className="motif-grid">
                {MOTIFS.filter((motif) => motif.category === category).map((motif) => (
                  <button
                    key={motif.id}
                    type="button"
                    className="motif-tile"
                    onClick={() => addMotif(motif.id, threadDmc.code)}
                    title={`${motif.name} (${motif.shape.width}×${motif.shape.height})`}
                  >
                    <MotifPreview shape={motif.shape} color={threadHex} />
                    <span>{motif.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {counts.size > 0 && (
          <div className="card">
            <p className="eyebrow">Linhas usadas</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DMC</th>
                  <th className="num">Pontos</th>
                  <th className="num">Meadas</th>
                </tr>
              </thead>
              <tbody>
                {[...counts.entries()].map(([code, count]) => (
                  <tr key={code}>
                    <td className="num">{code}</td>
                    <td className="num">{count.toLocaleString('pt-BR')}</td>
                    <td className="num">{estimateSkeins(count, project.count, 2).skeinsToBuy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => selectItem(null)}>
              Limpar seleção
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}
