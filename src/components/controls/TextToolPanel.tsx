import { useState } from 'react'
import { FONTS } from '../../data/fonts'
import { findClosestDmcColor } from '../../lib/color/dmcMatch'
import { useEditorStore } from '../../state/useEditorStore'

export function TextToolPanel() {
  const pattern = useEditorStore((s) => s.pattern)
  const addTextLayer = useEditorStore((s) => s.addTextLayer)
  const updateTextLayer = useEditorStore((s) => s.updateTextLayer)
  const removeTextLayer = useEditorStore((s) => s.removeTextLayer)

  const [text, setText] = useState('')
  const [fontId, setFontId] = useState(FONTS[0].id)
  const [hexColor, setHexColor] = useState('#2b2b2b')

  const handleAdd = () => {
    if (!text.trim()) return
    const rgb = hexToRgb(hexColor)
    const dmc = findClosestDmcColor(rgb)
    addTextLayer(text, fontId, dmc.code, dmc.name, dmc.rgb)
    setText('')
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
          {FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Cor</span>
        <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
      </label>

      <button type="button" className="button-primary" onClick={handleAdd}>
        Adicionar texto
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
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}
