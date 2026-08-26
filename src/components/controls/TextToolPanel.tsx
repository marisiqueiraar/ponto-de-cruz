import { useRef, useState, type ChangeEvent } from 'react'
import { BUILTIN_TYPEFACES } from '../../data/fonts/builtinTypefaces'
import { FONTS } from '../../data/fonts'
import { findClosestDmcColor } from '../../lib/color/dmcMatch'
import { useEditorStore } from '../../state/useEditorStore'
import { useFontLibraryStore } from '../../state/useFontLibraryStore'

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
    const rgb = hexToRgb(hexColor)
    const dmc = findClosestDmcColor(rgb)
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
    <div className="panel">
      <h2>Letras</h2>

      <label className="field">
        <span>Texto</span>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: MARIA" />
      </label>

      <label className="field">
        <span>Fonte</span>
        <select value={fontId} onChange={(e) => setFontId(e.target.value)}>
          <optgroup label="Blocos (desenhados)">
            {FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Galeria">
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
        <span>Cor</span>
        <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
      </label>

      <button type="button" className="button-primary" onClick={handleAdd} disabled={loadingBuiltinId === fontId}>
        {loadingBuiltinId === fontId ? 'Convertendo fonte…' : 'Adicionar texto'}
      </button>

      {pattern && pattern.textLayers.length > 0 && (
        <ul className="text-layer-list">
          {pattern.textLayers.map((layer) => (
            <li key={layer.id}>
              <span className="text-layer-list__label">{layer.text}</span>
              <label>
                X
                <input
                  type="number"
                  value={layer.x}
                  onChange={(e) => updateTextLayer(layer.id, { x: Number(e.target.value) })}
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  value={layer.y}
                  onChange={(e) => updateTextLayer(layer.id, { y: Number(e.target.value) })}
                />
              </label>
              <button type="button" onClick={() => removeTextLayer(layer.id)} aria-label="Remover texto">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="text-tool-divider" />

      <h3>Adicionar fonte própria</h3>
      <p className="hint">Envie um arquivo .ttf/.otf baixado de um site de fontes — cada letra é convertida em pontos automaticamente (grade 8×10).</p>
      <label className="field">
        <span>Arquivo (.ttf/.otf)</span>
        <input ref={fileInputRef} type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={handleFileChange} />
      </label>
      <label className="field">
        <span>Nome da fonte</span>
        <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Ex: Minha fonte" />
      </label>
      <button type="button" className="button-primary" onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Convertendo…' : 'Adicionar fonte'}
      </button>

      {customFonts.length > 0 && (
        <ul className="custom-font-list">
          {customFonts.map((font) => (
            <li key={font.id}>
              <span>{font.name}</span>
              <button type="button" onClick={() => removeCustomFont(font.id)} aria-label="Remover fonte">
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
