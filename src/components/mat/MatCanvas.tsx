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

    ctx.fillStyle = '#f0eee9'
    ctx.fillRect(0, 0, size.width, size.height)

    // The card itself.
    ctx.fillStyle = '#fffdf8'
    ctx.fillRect(originX, originY, grid.cols * cellPx, grid.rows * cellPx)
    ctx.strokeStyle = '#d5d5df'
    ctx.lineWidth = 1
    ctx.strokeRect(originX + 0.5, originY + 0.5, grid.cols * cellPx, grid.rows * cellPx)

    // Hole grid, only when cells are big enough to read.
    if (cellPx >= 5) {
      ctx.strokeStyle = 'rgba(0,0,0,0.07)'
      for (let col = 0; col <= grid.cols; col++) {
        const x = originX + col * cellPx + 0.5
        ctx.beginPath()
        ctx.moveTo(x, originY)
        ctx.lineTo(x, originY + grid.rows * cellPx)
        ctx.stroke()
      }
      for (let row = 0; row <= grid.rows; row++) {
        const y = originY + row * cellPx + 0.5
        ctx.beginPath()
        ctx.moveTo(originX, y)
        ctx.lineTo(originX + grid.cols * cellPx, y)
        ctx.stroke()
      }
    }

    // Photo opening.
    const photo = photoRectInCells(project)
    ctx.fillStyle = '#e6e3dc'
    ctx.fillRect(originX + photo.x * cellPx, originY + photo.y * cellPx, photo.width * cellPx, photo.height * cellPx)
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = '#8d8677'
    ctx.strokeRect(originX + photo.x * cellPx, originY + photo.y * cellPx, photo.width * cellPx, photo.height * cellPx)
    ctx.setLineDash([])
    if (photo.width * cellPx > 60) {
      ctx.fillStyle = '#8d8677'
      ctx.font = '11px Manrope, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        'FOTO',
        originX + (photo.x + photo.width / 2) * cellPx,
        originY + (photo.y + photo.height / 2) * cellPx,
      )
    }

    // Stitches.
    for (const cell of collectStitches(project)) {
      ctx.fillStyle = colorOf(cell.dmcCode)
      const x = originX + cell.x * cellPx
      const y = originY + cell.y * cellPx
      const inset = cellPx > 6 ? 0.5 : 0
      ctx.fillRect(x + inset, y + inset, cellPx - inset * 2, cellPx - inset * 2)
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
