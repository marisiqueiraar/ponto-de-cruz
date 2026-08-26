import type { ApplicationTemplate } from '../types/application'

export const APPLICATION_TEMPLATES: ApplicationTemplate[] = [
  {
    id: 'almofada',
    name: 'Almofada 40×40cm',
    widthCm: 40,
    heightCm: 40,
    usableArea: { xCm: 4, yCm: 4, widthCm: 32, heightCm: 32 },
  },
  {
    id: 'pano-de-prato',
    name: 'Pano de prato',
    widthCm: 45,
    heightCm: 70,
    usableArea: { xCm: 5, yCm: 42, widthCm: 35, heightCm: 20 },
  },
  {
    id: 'quadro',
    name: 'Quadro 24×24cm',
    widthCm: 24,
    heightCm: 24,
    usableArea: { xCm: 3, yCm: 3, widthCm: 18, heightCm: 18 },
  },
  {
    id: 'camiseta',
    name: 'Camiseta (peito)',
    widthCm: 50,
    heightCm: 65,
    usableArea: { xCm: 15, yCm: 12, widthCm: 20, heightCm: 20 },
  },
]

export function getApplicationTemplate(id: string): ApplicationTemplate | undefined {
  return APPLICATION_TEMPLATES.find((t) => t.id === id)
}
