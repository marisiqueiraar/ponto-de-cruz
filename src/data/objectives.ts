/** The two ways this app can build a piece. */
export type Modality = 'moldura' | 'padrao'

export const MODALITY_LABELS: Record<Modality, string> = {
  moldura: 'Moldura bordada',
  padrao: 'Padrão da imagem',
}

export const MODALITY_DESCRIPTIONS: Record<Modality, string> = {
  moldura:
    'A foto é impressa e montada de verdade; o bordado é a decoração ao redor dela — monograma, arabescos, data. Poucos pontos, muito efeito.',
  padrao:
    'A imagem inteira vira quadradinhos bordados, ponto a ponto. Muitos pontos e muitas cores, resultado tipo mosaico.',
}

export interface Objective {
  id: string
  name: string
  modality: Modality
  substrateId: string
  count: number
  /** Suggested stitched-area size in cm. */
  widthCm: number
  heightCm: number
  effort: 'Uma tarde' | 'Alguns dias' | 'Semanas'
  why: string
  /** Which piece the application preview should open on, when one matches. */
  applicationId?: string
}

/**
 * Entry points by what the person actually wants to make. Each objective carries the material
 * and modality that suit it, so the recommendation is a real starting configuration.
 */
export const OBJECTIVES: Objective[] = [
  {
    id: 'cartao-foto',
    name: 'Cartão com foto e monograma',
    modality: 'moldura',
    substrateId: 'cartolina-texturizada',
    count: 12,
    widthCm: 15,
    heightCm: 10,
    effort: 'Uma tarde',
    why: 'Foto impressa montada no cartão e bordado só nas laterais. É o formato de presente e de encomenda mais comum nesse estilo.',
  },
  {
    id: 'quadro-casal',
    name: 'Quadro de casal / família',
    modality: 'moldura',
    substrateId: 'cartolina-texturizada',
    count: 12,
    widthCm: 18,
    heightCm: 13,
    effort: 'Alguns dias',
    why: 'Mesmo princípio do cartão, em tamanho de moldura de mesa: dá espaço para monograma dos dois lados e a data embaixo.',
  },
  {
    id: 'convite',
    name: 'Convite ou lembrança de evento',
    modality: 'moldura',
    substrateId: 'papel-perfurado',
    count: 14,
    widthCm: 10,
    heightCm: 15,
    effort: 'Uma tarde',
    why: 'Papel perfurado já vem com a grade pronta e não desfia na borda — ideal para fazer vários iguais sem furar cada um.',
  },
  {
    id: 'marcador',
    name: 'Marcador de livro',
    modality: 'moldura',
    substrateId: 'papel-perfurado',
    count: 14,
    widthCm: 5,
    heightCm: 18,
    effort: 'Uma tarde',
    why: 'A borda recortada do papel perfurado dispensa acabamento, e o formato estreito pede motivo pequeno em vez de imagem cheia.',
  },
  {
    id: 'retrato',
    name: 'Retrato bordado ponto a ponto',
    modality: 'padrao',
    substrateId: 'aida',
    count: 16,
    widthCm: 18,
    heightCm: 18,
    effort: 'Semanas',
    why: 'Aqui a foto vira o bordado inteiro. Contagem 16 dá detalhe suficiente para rosto sem virar um projeto interminável.',
    applicationId: 'quadro',
  },
  {
    id: 'almofada',
    name: 'Almofada ou peça de casa',
    modality: 'padrao',
    substrateId: 'aida',
    count: 14,
    widthCm: 30,
    heightCm: 30,
    effort: 'Semanas',
    why: 'Área grande em contagem média: rende rápido e o resultado aguenta uso e lavagem.',
    applicationId: 'almofada',
  },
  {
    id: 'pano-prato',
    name: 'Barrado de pano de prato',
    modality: 'padrao',
    substrateId: 'aida',
    count: 14,
    widthCm: 34,
    heightCm: 10,
    effort: 'Alguns dias',
    why: 'Faixa larga e baixa na barra da peça — combina melhor com desenho gráfico e nome do que com foto.',
    applicationId: 'pano-de-prato',
  },
  {
    id: 'camiseta',
    name: 'Bordado em roupa',
    modality: 'padrao',
    substrateId: 'waste-canvas',
    count: 14,
    widthCm: 10,
    heightCm: 10,
    effort: 'Alguns dias',
    why: 'Malha não tem trama para contar: a grade solúvel é alinhavada por cima, serve de guia e depois sai.',
    applicationId: 'camiseta',
  },
]

export function objectivesByModality(modality: Modality): Objective[] {
  return OBJECTIVES.filter((objective) => objective.modality === modality)
}
