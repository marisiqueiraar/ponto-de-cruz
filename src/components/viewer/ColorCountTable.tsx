import type { PaletteEntry } from '../../types/pattern'
import { Icon } from '../common/Icon'
import { SymbolSwatch } from './SymbolLegend'

interface ColorCountTableProps {
  palette: PaletteEntry[]
}

export function ColorCountTable({ palette }: ColorCountTableProps) {
  if (palette.length === 0) return null

  const sorted = [...palette].sort((a, b) => b.count - a.count)
  const total = palette.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="card">
      <div className="panel-head">
        <span className="icon-tile icon-tile--sm icon-tile--green">
          <Icon name="thread" size={17} />
        </span>
        <div className="panel-head__text">
          <h2>Legenda e lista de compras</h2>
          <p>
            {palette.length} cores · {total.toLocaleString('pt-BR')} pontos
          </p>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Símbolo</th>
              <th>DMC</th>
              <th>Nome</th>
              <th className="num">Pontos</th>
              <th className="num">%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.dmcCode}>
                <td>
                  <SymbolSwatch symbolId={entry.symbol} rgb={entry.rgb} />
                </td>
                <td className="num">{entry.dmcCode}</td>
                <td>{entry.name}</td>
                <td className="num">{entry.count.toLocaleString('pt-BR')}</td>
                <td className="num">{((entry.count / total) * 100).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
