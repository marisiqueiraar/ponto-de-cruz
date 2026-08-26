export interface LibraryProject {
  id: string
  name: string
  category: string
  /** Where this size convention comes from, shown as a provenance badge. */
  reference: string
  description: string
  widthStitches: number
  heightStitches: number
  fabricCount: number
  /** Matching application template, when the project maps onto one. */
  applicationId?: string
  keywords: string[]
}

/**
 * Common cross-stitch project sizes. Stitch counts are derived from the typical finished
 * dimensions of each item at the listed fabric count, so loading one gives a sane starting point.
 */
export const LIBRARY_PROJECTS: LibraryProject[] = [
  {
    id: 'marcador-livro',
    name: 'Marcador de livro',
    category: 'Pequenos projetos',
    reference: 'Medida clássica de marcador',
    description: 'Faixa estreita e comprida, ótima para um primeiro projeto ou para testar uma paleta.',
    widthStitches: 30,
    heightStitches: 110,
    fabricCount: 14,
    keywords: ['marcador', 'livro', 'pequeno', 'iniciante', 'faixa'],
  },
  {
    id: 'quadro-pequeno',
    name: 'Quadro pequeno 13×13cm',
    category: 'Quadros',
    reference: 'Moldura padrão 13×13cm',
    description: 'Formato quadrado para moldura de mesa ou parede — cabe bem em bastidor de 15cm.',
    widthStitches: 72,
    heightStitches: 72,
    fabricCount: 14,
    applicationId: 'quadro',
    keywords: ['quadro', 'moldura', 'parede', 'quadrado', 'pequeno'],
  },
  {
    id: 'quadro-medio',
    name: 'Quadro médio 18×18cm',
    category: 'Quadros',
    reference: 'Moldura padrão 18×18cm',
    description: 'Espaço confortável para retratos e cenas com mais detalhe e gradação de cor.',
    widthStitches: 100,
    heightStitches: 100,
    fabricCount: 14,
    applicationId: 'quadro',
    keywords: ['quadro', 'moldura', 'retrato', 'médio'],
  },
  {
    id: 'bastidor-15',
    name: 'Bastidor de 15cm',
    category: 'Bastidor',
    reference: 'Argola de madeira 15cm',
    description: 'Área circular útil de ~12cm — deixe margem, a borda fica presa entre as argolas.',
    widthStitches: 66,
    heightStitches: 66,
    fabricCount: 14,
    keywords: ['bastidor', 'argola', 'redondo', 'hoop'],
  },
  {
    id: 'almofada-40',
    name: 'Almofada 40×40cm',
    category: 'Casa',
    reference: 'Capa de almofada padrão',
    description: 'Aplicação central grande. Considere 16 ou 18 ct para não pesar demais o tecido.',
    widthStitches: 170,
    heightStitches: 170,
    fabricCount: 14,
    applicationId: 'almofada',
    keywords: ['almofada', 'casa', 'sofá', 'grande', 'capa'],
  },
  {
    id: 'pano-de-prato',
    name: 'Barrado de pano de prato',
    category: 'Casa',
    reference: 'Barra inferior de pano de prato',
    description: 'Faixa horizontal na barra da peça — larga e baixa, ideal para nomes e frases.',
    widthStitches: 190,
    heightStitches: 55,
    fabricCount: 14,
    applicationId: 'pano-de-prato',
    keywords: ['pano', 'prato', 'cozinha', 'barrado', 'faixa', 'toalha'],
  },
  {
    id: 'camiseta-peito',
    name: 'Camiseta — peito',
    category: 'Vestuário',
    reference: 'Aplicação de peito esquerdo',
    description: 'Motivo pequeno. Em malha, use tecido solúvel (waste canvas) como guia de contagem.',
    widthStitches: 55,
    heightStitches: 55,
    fabricCount: 14,
    applicationId: 'camiseta',
    keywords: ['camiseta', 'roupa', 'vestuário', 'peito', 'malha'],
  },
  {
    id: 'necessaire',
    name: 'Necessaire / porta-moedas',
    category: 'Acessórios',
    reference: 'Frente de necessaire pequena',
    description: 'Retângulo deitado na frente da peça, com margem generosa para a costura lateral.',
    widthStitches: 90,
    heightStitches: 60,
    fabricCount: 14,
    keywords: ['necessaire', 'bolsa', 'acessório', 'porta-moedas', 'estojo'],
  },
  {
    id: 'toalha-lavabo',
    name: 'Barrado de toalha de lavabo',
    category: 'Casa',
    reference: 'Barra de toalha de rosto',
    description: 'Faixa fina e comprida. Combine com uma fonte estreita para caber o nome inteiro.',
    widthStitches: 160,
    heightStitches: 35,
    fabricCount: 16,
    keywords: ['toalha', 'lavabo', 'banheiro', 'barrado', 'monograma'],
  },
  {
    id: 'monograma',
    name: 'Monograma / inicial',
    category: 'Letras',
    reference: 'Letra única decorativa',
    description: 'Uma inicial grande e trabalhada — bom uso para as fontes maiores da galeria.',
    widthStitches: 45,
    heightStitches: 55,
    fabricCount: 14,
    keywords: ['monograma', 'inicial', 'letra', 'nome', 'alfabeto'],
  },
  {
    id: 'sampler',
    name: 'Sampler / quadro de nascimento',
    category: 'Quadros',
    reference: 'Sampler tradicional retrato',
    description: 'Formato retrato clássico, com espaço para moldura decorativa, texto e data.',
    widthStitches: 120,
    heightStitches: 160,
    fabricCount: 14,
    keywords: ['sampler', 'nascimento', 'bebê', 'nome', 'data', 'tradicional'],
  },
  {
    id: 'cartao',
    name: 'Cartão bordado',
    category: 'Pequenos projetos',
    reference: 'Janela de cartão 7×9cm',
    description: 'Motivo minúsculo para colar em cartão. Termina em uma tarde.',
    widthStitches: 40,
    heightStitches: 50,
    fabricCount: 14,
    keywords: ['cartão', 'presente', 'pequeno', 'rápido', 'mini'],
  },
]

export function searchLibrary(query: string): LibraryProject[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return LIBRARY_PROJECTS
  const terms = normalized.split(/\s+/)
  return LIBRARY_PROJECTS.filter((project) => {
    const haystack = [project.name, project.category, project.description, ...project.keywords].join(' ').toLowerCase()
    return terms.some((term) => haystack.includes(term))
  })
}
