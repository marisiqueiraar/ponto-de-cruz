import type { GridShape } from '../../lib/motifs/gridDraw'

interface MotifPreviewProps {
  shape: GridShape
  color: string
  /** Box side in px the motif is scaled to fit. */
  size?: number
}

/** Thumbnail of a motif, drawn as one SVG rect per stitch so it scales crisply at any size. */
export function MotifPreview({ shape, color, size = 54 }: MotifPreviewProps) {
  if (shape.cells.length === 0) return <svg width={size} height={size} />

  return (
    <svg width={size} height={size} viewBox={`0 0 ${shape.width} ${shape.height}`} preserveAspectRatio="xMidYMid meet">
      {shape.cells.map(([x, y]) => (
        <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={color} />
      ))}
    </svg>
  )
}
