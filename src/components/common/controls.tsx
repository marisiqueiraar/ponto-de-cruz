import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface SliderControlProps {
  label: string
  help?: string
  value: number
  min: number
  max: number
  step?: number
  /** Formatted value shown in the chip, e.g. "100 pts". Defaults to the raw number. */
  display?: string
  minLabel?: string
  maxLabel?: string
  onChange: (value: number) => void
}

/** Slider + numeric stepper for one parameter, mirroring the reference tool's control card. */
export function SliderControl({
  label,
  help,
  value,
  min,
  max,
  step = 1,
  display,
  minLabel,
  maxLabel,
  onChange,
}: SliderControlProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className="control">
      <div className="control__top">
        <span className="control__label">{label}</span>
        {help && (
          <span className="help-dot" title={help}>
            ?
          </span>
        )}
        <span className="value-chip">{display ?? value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="stepper">
        <button type="button" aria-label={`Diminuir ${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - step))}>
          <Icon name="minus" size={14} />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-label={`${label} (valor)`}
          onChange={(e) => {
            const parsed = Number(e.target.value)
            if (!Number.isNaN(parsed)) onChange(clamp(parsed))
          }}
        />
        <button type="button" aria-label={`Aumentar ${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + step))}>
          <Icon name="plus" size={14} />
        </button>
      </div>

      <div className="control__limits">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
    </div>
  )
}

interface SectionHeadProps {
  children: ReactNode
  accent?: 'blue' | 'amber' | 'green'
}

export function SectionHead({ children, accent = 'blue' }: SectionHeadProps) {
  const modifier = accent === 'blue' ? '' : ` section-head--${accent}`
  return <div className={`section-head${modifier}`}>{children}</div>
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track" />
      </span>
    </label>
  )
}

interface CalloutProps {
  children: ReactNode
  icon?: Parameters<typeof Icon>[0]['name']
  muted?: boolean
}

export function Callout({ children, icon = 'info', muted }: CalloutProps) {
  return (
    <div className={muted ? 'callout callout--muted' : 'callout'}>
      <span className="icon-tile icon-tile--sm">
        <Icon name={icon} size={17} />
      </span>
      <div className="callout__body">{children}</div>
    </div>
  )
}
