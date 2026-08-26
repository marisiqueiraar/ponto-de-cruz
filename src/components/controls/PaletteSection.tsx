import { SliderControl } from '../common/controls'
import { Icon } from '../common/Icon'
import { useEditorStore } from '../../state/useEditorStore'

export function PaletteSection() {
  const settings = useEditorStore((s) => s.settings)
  const updateSettings = useEditorStore((s) => s.updateSettings)
  const pattern = useEditorStore((s) => s.pattern)

  return (
    <div className="card">
      <div className="panel-head">
        <span className="icon-tile icon-tile--sm">
          <Icon name="palette" size={17} />
        </span>
        <div className="panel-head__text">
          <h2>Paleta de linhas</h2>
          <p>Quantas cores diferentes o padrão vai usar</p>
        </div>
      </div>

      <SliderControl
        label="Número de cores"
        help="Menos cores = menos troca de linha e gráfico mais legível. Entre 15 e 25 costuma ser o melhor equilíbrio."
        value={settings.colorCount}
        min={2}
        max={50}
        display={`${settings.colorCount} cores`}
        minLabel="2"
        maxLabel="50"
        onChange={(value) => updateSettings({ colorCount: value })}
      />

      {pattern && pattern.palette.length !== settings.colorCount && (
        <p className="hint">
          O padrão ficou com {pattern.palette.length} cores: tons próximos caíram na mesma linha e foram unificados.
        </p>
      )}

      <p className="hint hint--mono">
        Cores aproximadas de linha de bordado (codificação DMC) · DMC é marca de terceiros
      </p>
    </div>
  )
}
