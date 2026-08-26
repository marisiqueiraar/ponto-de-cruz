import type { IconName } from './components/common/Icon'

export const TABS = [
  { id: 'dashboard', label: 'Início', icon: 'dashboard' },
  { id: 'moldura', label: 'Moldura', icon: 'photo' },
  { id: 'gerador', label: 'Gerador', icon: 'layers' },
  { id: 'aplicacao', label: 'Aplicação', icon: 'shirt' },
  { id: 'biblioteca', label: 'Biblioteca', icon: 'compass' },
  { id: 'calculadoras', label: 'Calculadoras', icon: 'calculator' },
  { id: 'guia', label: 'Guia', icon: 'bulb' },
  { id: 'imprimir', label: 'Imprimir', icon: 'printer' },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: IconName }>

export type TabId = (typeof TABS)[number]['id']
