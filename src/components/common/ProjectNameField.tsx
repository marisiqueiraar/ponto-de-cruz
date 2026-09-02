import { useEffect, useId, useRef, useState } from 'react'
import { normalizeProjectName } from '../../lib/project/projectName'
import { Icon } from './Icon'

interface ProjectNameFieldProps {
  value: string
  /** Restored when the field is cleared — the name has to reach the PDF non-empty. */
  fallback: string
  onCommit: (name: string) => void
}

/**
 * Inline rename inside the project chip. It reads as the project's title until
 * hovered or focused, when it takes on a field outline — so the chip stays a
 * quiet status line and the name is still visibly editable.
 *
 * Editing is local until commit: Enter and blur save, Escape restores.
 */
export function ProjectNameField({ value, fallback, onCommit }: ProjectNameFieldProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  // Escape blurs to leave the field, and blur commits — so it has to say "not this one".
  const abandoningRef = useRef(false)
  const inputId = `${useId()}-project-name`

  // Follow renames that come from elsewhere (project restored, project swapped),
  // but never yank the text out from under someone who is mid-edit.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(value)
  }, [value])

  const handleBlur = () => {
    if (abandoningRef.current) {
      abandoningRef.current = false
      setDraft(value)
      return
    }
    const name = normalizeProjectName(draft, fallback)
    setDraft(name)
    if (name !== value) onCommit(name)
  }

  return (
    <div className="project-name">
      <label className="project-name__label" htmlFor={inputId}>
        Nome do projeto
      </label>
      <div className="project-name__field">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="project-name__input"
          value={draft}
          maxLength={60}
          placeholder={fallback}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              inputRef.current?.blur()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              abandoningRef.current = true
              inputRef.current?.blur()
            }
          }}
        />
        <Icon name="pencil" size={14} className="project-name__pencil" />
      </div>
    </div>
  )
}
