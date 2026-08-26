/**
 * Shared A4 layout geometry for the printable chart. The Print page previews the page count
 * from these same numbers the exporter uses, so the summary can never drift from the real PDF.
 */
export const PAGE_WIDTH_MM = 210
export const PAGE_HEIGHT_MM = 297
export const MARGIN_MM = 12
export const LABEL_MARGIN_MM = 6
export const CHART_HEADER_MM = 10
export const CELL_MM = 5
export const OVERLAP_STITCHES = 2
export const LEGEND_ROW_MM = 8

export function stitchesPerChartPage(): { cols: number; rows: number } {
  const usableWidthMm = PAGE_WIDTH_MM - 2 * MARGIN_MM - LABEL_MARGIN_MM
  const usableHeightMm = PAGE_HEIGHT_MM - 2 * MARGIN_MM - LABEL_MARGIN_MM - CHART_HEADER_MM
  return {
    cols: Math.max(1, Math.floor(usableWidthMm / CELL_MM)),
    rows: Math.max(1, Math.floor(usableHeightMm / CELL_MM)),
  }
}

/** Start indices for each page along one axis, stepping by page size minus the overlap. */
export function computePageStarts(total: number, perPage: number, overlap: number): number[] {
  if (total <= perPage) return [0]
  const step = Math.max(1, perPage - overlap)
  const starts: number[] = []
  for (let start = 0; start < total; start += step) {
    starts.push(start)
    if (start + perPage >= total) break
  }
  return starts
}

export function legendRowsPerPage(): number {
  const usableHeightMm = PAGE_HEIGHT_MM - 2 * MARGIN_MM - 14
  return Math.max(1, Math.floor(usableHeightMm / LEGEND_ROW_MM))
}

export interface PdfLayoutEstimate {
  cols: number
  rows: number
  chartPages: number
  legendPages: number
  totalPages: number
  overlapStitches: number
}

export function estimatePdfPages(widthStitches: number, heightStitches: number, paletteSize = 0): PdfLayoutEstimate {
  const perPage = stitchesPerChartPage()
  const cols = computePageStarts(widthStitches, perPage.cols, OVERLAP_STITCHES).length
  const rows = computePageStarts(heightStitches, perPage.rows, OVERLAP_STITCHES).length
  const chartPages = cols * rows
  const legendPages = Math.max(1, Math.ceil(paletteSize / legendRowsPerPage()))

  return {
    cols,
    rows,
    chartPages,
    legendPages,
    // Cover + legend + chart.
    totalPages: 1 + legendPages + chartPages,
    overlapStitches: OVERLAP_STITCHES,
  }
}
