import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from 'react'
import { drawSymbol } from '../../lib/pattern/symbols'
import type { PaletteEntry, PatternViewMode } from '../../types/pattern'

interface PatternCanvasProps {
  cells: Uint16Array | null
  width: number
  height: number
  palette: PaletteEntry[]
  viewMode: PatternViewMode
}

const MIN_CELL_PX = 3
const MAX_CELL_PX = 60
const DEFAULT_CELL_PX = 16
const RULER_PX = 26

export function PatternCanvas({ cells, width, height, palette, viewMode }: PatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellPx, setCellPx] = useState(DEFAULT_CELL_PX)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || width === 0 || height === 0) return
    const rect = container.getBoundingClientRect()
    setCellPx(DEFAULT_CELL_PX)
    setOffset({
      x: (rect.width - RULER_PX - width * DEFAULT_CELL_PX) / 2,
      y: (rect.height - RULER_PX - height * DEFAULT_CELL_PX) / 2,
    })
  }, [width, height])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !container || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#eeece7'
    ctx.fillRect(0, 0, rect.width, rect.height)

    if (!cells) return

    const gridAreaWidth = rect.width - RULER_PX
    const gridAreaHeight = rect.height - RULER_PX

    const colStart = Math.max(0, Math.floor(-offset.x / cellPx))
    const colEnd = Math.min(width, Math.ceil((gridAreaWidth - offset.x) / cellPx))
    const rowStart = Math.max(0, Math.floor(-offset.y / cellPx))
    const rowEnd = Math.min(height, Math.ceil((gridAreaHeight - offset.y) / cellPx))

    ctx.save()
    ctx.translate(RULER_PX, RULER_PX)
    ctx.beginPath()
    ctx.rect(0, 0, gridAreaWidth, gridAreaHeight)
    ctx.clip()

    for (let row = rowStart; row < rowEnd; row++) {
      for (let col = colStart; col < colEnd; col++) {
        const entry = palette[cells[row * width + col]]
        if (!entry) continue
        const x = offset.x + col * cellPx
        const y = offset.y + row * cellPx

        if (viewMode === 'color') {
          ctx.fillStyle = `rgb(${entry.rgb[0]}, ${entry.rgb[1]}, ${entry.rgb[2]})`
          ctx.fillRect(x, y, cellPx, cellPx)
        } else {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x, y, cellPx, cellPx)
          ctx.fillStyle = '#161616'
          ctx.strokeStyle = '#161616'
          ctx.lineWidth = Math.max(1, cellPx * 0.09)
          drawSymbol(ctx, entry.symbol, x + cellPx / 2, y + cellPx / 2, cellPx)
        }
      }
    }

    if (cellPx >= 7) {
      for (let col = colStart; col <= colEnd; col++) {
        const x = offset.x + col * cellPx + 0.5
        ctx.strokeStyle = col % 10 === 0 ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'
        ctx.lineWidth = col % 10 === 0 ? 1.4 : 1
        ctx.beginPath()
        ctx.moveTo(x, offset.y + rowStart * cellPx)
        ctx.lineTo(x, offset.y + rowEnd * cellPx)
        ctx.stroke()
      }
      for (let row = rowStart; row <= rowEnd; row++) {
        const y = offset.y + row * cellPx + 0.5
        ctx.strokeStyle = row % 10 === 0 ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'
        ctx.lineWidth = row % 10 === 0 ? 1.4 : 1
        ctx.beginPath()
        ctx.moveTo(offset.x + colStart * cellPx, y)
        ctx.lineTo(offset.x + colEnd * cellPx, y)
        ctx.stroke()
      }
    }
    ctx.restore()

    // Rulers, drawn over the reserved margins so they stay put while the grid scrolls beneath them.
    ctx.fillStyle = '#e2ded5'
    ctx.fillRect(0, 0, rect.width, RULER_PX)
    ctx.fillRect(0, 0, RULER_PX, rect.height)
    ctx.fillStyle = '#4a463e'
    ctx.font = '10px sans-serif'
    ctx.textBaseline = 'middle'

    if (cellPx >= 5) {
      ctx.textAlign = 'center'
      for (let col = colStart; col < colEnd; col++) {
        if ((col + 1) % 10 !== 0) continue
        const x = RULER_PX + offset.x + col * cellPx + cellPx / 2
        if (x < RULER_PX || x > rect.width) continue
        ctx.fillText(String(col + 1), x, RULER_PX / 2)
      }
      ctx.textAlign = 'right'
      for (let row = rowStart; row < rowEnd; row++) {
        if ((row + 1) % 10 !== 0) continue
        const y = RULER_PX + offset.y + row * cellPx + cellPx / 2
        if (y < RULER_PX || y > rect.height) continue
        ctx.fillText(String(row + 1), RULER_PX - 4, y)
      }
    }
  }, [cells, width, height, palette, viewMode, cellPx, offset])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left - RULER_PX
    const mouseY = event.clientY - rect.top - RULER_PX

    const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    const newCellPx = Math.min(MAX_CELL_PX, Math.max(MIN_CELL_PX, cellPx * zoomFactor))
    const worldX = (mouseX - offset.x) / cellPx
    const worldY = (mouseY - offset.y) / cellPx

    setOffset({ x: mouseX - worldX * newCellPx, y: mouseY - worldY * newCellPx })
    setCellPx(newCellPx)
  }

  const handleMouseDown = (event: MouseEvent) => {
    dragState.current = { startX: event.clientX, startY: event.clientY, startOffsetX: offset.x, startOffsetY: offset.y }
  }
  const handleMouseMove = (event: MouseEvent) => {
    if (!dragState.current) return
    setOffset({
      x: dragState.current.startOffsetX + (event.clientX - dragState.current.startX),
      y: dragState.current.startOffsetY + (event.clientY - dragState.current.startY),
    })
  }
  const handleMouseUp = () => {
    dragState.current = null
  }

  return (
    <div ref={containerRef} className="pattern-canvas-container">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {!cells && <div className="pattern-canvas-empty">Envie uma foto para começar</div>}
    </div>
  )
}
