import { useRef, type ChangeEvent } from 'react'
import { useEditorStore } from '../../state/useEditorStore'

export function ImageUploader() {
  const loadImageFile = useEditorStore((s) => s.loadImageFile)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void loadImageFile(file)
    event.target.value = ''
  }

  return (
    <div className="panel">
      <h2>Foto</h2>
      <button type="button" className="button-primary" onClick={() => inputRef.current?.click()}>
        Enviar foto
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
    </div>
  )
}
