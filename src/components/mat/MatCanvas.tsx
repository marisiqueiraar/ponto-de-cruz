import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { collectStitches, matGrid, photoRectInCells, resolveItemShape } from '../../lib/mat/matGeometry'
import { useMatStore } from '../../state/useMatStore'
import type { MatItem } from '../../types/mat'

const PADDING = 26

interface MatCanvasProps {
  /** Maps a DMC code to a CSS colour; supplied by the page which knows the thread palette. */
  colorOf: (dmcCode: string) => string
}

export function MatCanvas({ colorOf }: MatCanvasProps) {
  const project = useMatStore((s) => s.project)
  const selectedItemId = useMatStore((s) => s.selectedItemId)
  const selectItem = useMatStore((s) => s.selectItem)
  const updateItem = useMatStore((s) => s.updateItem)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 800, height: 520 })
  const dragRef = useRef<{ itemId: string; startX: number; startY: number; originX: number; originY: number } | null>(null)

  const grid = matGrid(project)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  /** Cell size in px that fits the whole card in the viewport. */
  const cellPx = Math.max(
    2,
    Math.min((size.width - PADDING * 2) / Math.max(1, grid.cols), (size.height - PADDING * 2) / Math.max(1, grid.rows)),
  )
  const originX = (size.width - grid.cols * cellPx) / 2
  const originY = (size.height - grid.rows * cellPx) / 2

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#e8e4c8'
    ctx.fillRect(0, 0, size.width, size.height)

    // The card itself — flat, no shadow: this is a working layout, not a mockup.
    ctx.fillStyle = '#fffef8'
    ctx.fillRect(originX, originY, grid.cols * cellPx, grid.rows * cellPx)
    ctx.strokeStyle = '#9dbfaf'
    ctx.lineWidth = 1
    ctx.strokeRect(originX + 0.5, originY + 0.5, grid.cols * cellPx, grid.rows * cellPx)

    // Hole grid, with a heavier rule every tenth line so counting works.
    if (cellPx >= 4) {
      for (let col = 0; col <= grid.cols; col++) {
        const x = originX + col * cellPx + 0.5
        ctx.strokeStyle = col % 10 === 0 ? 'rgba(91,122,115,0.34)' : 'rgba(157,191,175,0.34)'
        ctx.lineWidth = col % 10 === 0 ? 1 : 0.6
        ctx.beginPath()
        ctx.moveTo(x, originY)
        ctx.lineTo(x, originY + grid.rows * cellPx)
        ctx.stroke()
      }
      for (let row = 0; row <= grid.rows; row++) {
        const y = originY + row * cellPx + 0.5
        ctx.strokeStyle = row % 10 === 0 ? 'rgba(91,122,115,0.34)' : 'rgba(157,191,175,0.34)'
        ctx.lineWidth = row % 10 === 0 ? 1 : 0.6
        ctx.beginPath()
        ctx.moveTo(originX, y)
        ctx.lineTo(originX + grid.cols * cellPx, y)
        ctx.stroke()
      }
    }

    // Photo opening: outline only, so it reads as a cut-out rather than a raised panel.
    const photo = photoRectInCells(project)
    const px = originX + photo.x * cellPx
    const py = originY + photo.y * cellPx
    const pw = photo.width * cellPx
    const ph = photo.height * cellPx
    ctx.fillStyle = 'rgba(157,191,175,0.16)'
    ctx.fillRect(px, py, pw, ph)
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = '#5b7a73'
    ctx.lineWidth = 1.2
    ctx.strokeRect(px, py, pw, ph)
    ctx.setLineDash([])
    if (pw > 60) {
      ctx.fillStyle = '#5b7a73'
      ctx.font = '600 10px Manrope, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('FOTO', px + pw / 2, py + ph / 2)
    }

    // Stitches, drawn as actual crosses. Below ~5px a cross is illegible, so fall back to a
    // solid cell — the same trade-off a printed chart makes at small scale.
    const stitches = collectStitches(project)
    if (cellPx >= 5) {
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(1, cellPx * 0.22)
      const inset = cellPx * 0.16
      for (const cell of stitches) {
        ctx.strokeStyle = colorOf(cell.dmcCode)
        const x = originX + cell.x * cellPx
        const y = originY + cell.y * cellPx
        ctx.beginPath()
        ctx.moveTo(x + inset, y + inset)
        ctx.lineTo(x + cellPx - inset, y + cellPx - inset)
        ctx.moveTo(x + cellPx - inset, y + inset)
        ctx.lineTo(x + inset, y + cellPx - inset)
        ctx.stroke()
      }
      ctx.lineCap = 'butt'
    } else {
      for (const cell of stitches) {
        ctx.fillStyle = colorOf(cell.dmcCode)
        ctx.fillRect(originX + cell.x * cellPx, originY + cell.y * cellPx, cellPx, cellPx)
      }
    }

    // Selection outline around the active item.
    const selected = project.items.find((item) => item.id === selectedItemId)
    if (selected) {
      const shape = resolveItemShape(selected)
      if (shape) {
        ctx.strokeStyle = '#2743e0'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.strokeRect(
          originX + selected.x * cellPx - 2,
          originY + selected.y * cellPx - 2,
          shape.width * cellPx + 4,
          shape.height * cellPx + 4,
        )
        ctx.setLineDash([])
      }
    }
  }, [project, selectedItemId, size, cellPx, originX, originY, grid.cols, grid.rows, colorOf])

  useEffect(() => {
    draw()
  }, [draw])

  /** Finds the topmost item whose bounding box contains the given grid cell. */
  const hitTest = (cellX: number, cellY: number): MatItem | null => {
    for (let i = project.items.length - 1; i >= 0; i--) {
      const item = project.items[i]
      const shape = resolveItemShape(item)
      if (!shape) continue
      if (cellX >= item.x && cellX < item.x + shape.width && cellY >= item.y && cellY < item.y + shape.height) {
        return item
      }
    }
    return null
  }

  const toCell = (event: MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: Math.floor((event.clientX - rect.left - originX) / cellPx),
      y: Math.floor((event.clientY - rect.top - originY) / cellPx),
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    const cell = toCell(event)
    const hit = hitTest(cell.x, cell.y)
    selectItem(hit?.id ?? null)
    if (hit) {
      dragRef.current = { itemId: hit.id, startX: cell.x, startY: cell.y, originX: hit.x, originY: hit.y }
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const cell = toCell(event)
    updateItem(drag.itemId, {
      x: drag.originX + (cell.x - drag.startX),
      y: drag.originY + (cell.y - drag.startY),
    })
  }

  const handleMouseUp = () => {
    dragRef.current = null
  }

  return (
    <div ref={containerRef} className="canvas-frame canvas-frame--mat">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {project.items.length === 0 && (
        <div className="canvas-empty">Adicione um monograma, arabesco ou estrela ao lado</div>
      )}
    </div>
  )
}
