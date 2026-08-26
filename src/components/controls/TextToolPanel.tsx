import { useRef, useState, type ChangeEvent } from 'react'
import { BUILTIN_TYPEFACES } from '../../data/fonts/builtinTypefaces'
import { FONTS } from '../../data/fonts'
import { findClosestDmcColor } from '../../lib/color/dmcMatch'
import { useEditorStore } from '../../state/useEditorStore'
import { useFontLibraryStore } from '../../state/useFontLibraryStore'
import { SectionHead } from '../common/controls'
import { Icon } from '../common/Icon'

export function TextToolPanel() {
  const pattern = useEditorStore((s) => s.pattern)
  const addTextLayer = useEditorStore((s) => s.addTextLayer)
  const updateTextLayer = useEditorStore((s) => s.updateTextLayer)
  const removeTextLayer = useEditorStore((s) => s.removeTextLayer)

  const customFonts = useFontLibraryStore((s) => s.customFonts)
  const loadingBuiltinId = useFontLibraryStore((s) => s.loadingBuiltinId)
  const ensureBuiltinRasterized = useFontLibraryStore((s) => s.ensureBuiltinRasterized)
  const addCustomFontFromFile = useFontLibraryStore((s) => s.addCustomFontFromFile)
  const removeCustomFont = useFontLibraryStore((s) => s.removeCustomFont)

  const [text, setText] = useState('')
  const [fontId, setFontId] = useState(FONTS[0].id)
  const [hexColor, setHexColor] = useState('#2b2b2b')
  const [uploadName, setUploadName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBuiltin = (id: string) => BUILTIN_TYPEFACES.some((t) => t.id === id)

  const handleAdd = async () => {
    if (!text.trim()) return
    if (isBuiltin(fontId)) await ensureBuiltinRasterized(fontId)
    const dmc = findClosestDmcColor(hexToRgb(hexColor))
    addTextLayer(text, fontId, dmc.code, dmc.name, dmc.rgb)
    setText('')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadName((prev) => prev || file.name.replace(/\.(ttf|otf)$/i, ''))
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await addCustomFontFromFile(file, uploadName.trim() || file.name)
      setUploadName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <span className="icon-tile icon-tile--sm">
          <Icon name="type" size={17} />
        </span>
        <div className="panel-head__text">
          <h2>Letras e nomes</h2>
          <p>Texto vira pontos numa camada por cima do padrão</p>
        </div>
      </div>

      <label className="field">
        <span>Texto</span>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: MARIA" />
      </label>

      <div className="control-row">
        <label className="field">
          <span>Fonte</span>
          <select value={fontId} onChange={(e) => setFontId(e.target.value)}>
            <optgroup label="Blocos desenhados">
              {FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Galeria de tipografias">
              {BUILTIN_TYPEFACES.map((typeface) => (
                <option key={typeface.id} value={typeface.id}>
                  {typeface.name}
                </option>
              ))}
            </optgroup>
            {customFonts.length > 0 && (
              <optgroup label="Minhas fontes">
                {customFonts.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <label className="field">
          <span>Cor da linha</span>
          <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
        </label>
      </div>

      <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={loadingBuiltinId === fontId}>
        <Icon name="plus" size={16} />
        {loadingBuiltinId === fontId ? 'Convertendo fonte…' : 'Adicionar texto'}
      </button>

      {pattern && pattern.textLayers.length > 0 && (
        <ul className="list-reset layer-list">
          {pattern.textLayers.map((layer) => (
            <li key={layer.id}>
              <span className="layer-list__name">{layer.text}</span>
              <label>
                X
                <input type="number" value={layer.x} onChange={(e) => updateTextLayer(layer.id, { x: Number(e.target.value) })} />
              </label>
              <label>
                Y
                <input type="number" value={layer.y} onChange={(e) => updateTextLayer(layer.id, { y: Number(e.target.value) })} />
              </label>
              <button type="button" className="icon-btn" onClick={() => removeTextLayer(layer.id)} aria-label={`Remover texto ${layer.text}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <SectionHead accent="green">Adicionar fonte própria</SectionHead>
      <p className="hint" style={{ marginTop: 0 }}>
        Baixe uma fonte (.ttf/.otf) de um site de fontes e envie aqui — cada letra é convertida em pontos numa grade 8×10,
        sem sair do seu navegador.
      </p>

      <label className="field">
        <span>Arquivo</span>
        <input ref={fileInputRef} type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={handleFileChange} />
      </label>
      <label className="field">
        <span>Nome</span>
        <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Ex: Minha fonte" />
      </label>
      <button type="button" className="btn btn--outline btn--block" onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Convertendo…' : 'Adicionar fonte'}
      </button>

      {customFonts.length > 0 && (
        <ul className="list-reset layer-list">
          {customFonts.map((font) => (
            <li key={font.id}>
              <span className="layer-list__name">{font.name}</span>
              <button type="button" className="icon-btn" onClick={() => removeCustomFont(font.id)} aria-label={`Remover fonte ${font.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}
