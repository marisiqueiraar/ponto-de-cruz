import type { PaletteEntry } from '../../types/pattern'
import { SymbolSwatch } from './SymbolLegend'

interface ColorCountTableProps {
  palette: PaletteEntry[]
}

export function ColorCountTable({ palette }: ColorCountTableProps) {
  if (palette.length === 0) return null
  const sorted = [...palette].sort((a, b) => b.count - a.count)

  return (
    <div className="panel">
      <h2>Legenda e lista de compras</h2>
      <table className="color-count-table">
        <thead>
          <tr>
            <th></th>
            <th>DMC</th>
            <th>Nome</th>
            <th>Pontos</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.dmcCode}>
              <td>
                <SymbolSwatch symbolId={entry.symbol} rgb={entry.rgb} />
              </td>
              <td>{entry.dmcCode}</td>
              <td>{entry.name}</td>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
