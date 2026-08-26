export interface ApplicationTemplate {
  id: string
  name: string
  widthCm: number
  heightCm: number
  /** Region where the embroidered pattern is meant to sit, in the same cm coordinate space. */
  usableArea: { xCm: number; yCm: number; widthCm: number; heightCm: number }
}
