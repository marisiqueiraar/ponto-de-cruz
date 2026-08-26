import type { IconName } from './components/common/Icon'

export const TABS = [
  { id: 'criar', label: 'Criar', icon: 'layers' },
  { id: 'referencias', label: 'Referências', icon: 'compass' },
  { id: 'guia', label: 'Guia', icon: 'bulb' },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: IconName }>

export type TabId = (typeof TABS)[number]['id']
