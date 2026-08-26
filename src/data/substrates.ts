export type SubstrateFamily = 'papel' | 'tecido'

export interface Substrate {
  id: string
  name: string
  family: SubstrateFamily
  /** Stitch counts this material is normally sold in / worked at. */
  counts: number[]
  defaultCount: number
  strands: string
  needle: string
  /** Holes must be pierced by the stitcher before stitching (no pre-punched grid). */
  needsPiercing: boolean
  needsHoop: boolean
  /** Whether a mistake can be undone without leaving a mark. */
  forgiving: boolean
  description: string
  cautions: string[]
}

/**
 * Materials this app can produce a guide for. Specs follow common practice for each material:
 * paper is worked without a hoop and cannot be unpicked cleanly, fabric is the opposite.
 */
export const SUBSTRATES: Substrate[] = [
  {
    id: 'papel-perfurado',
    name: 'Papel perfurado 14ct',
    family: 'papel',
    counts: [14],
    defaultCount: 14,
    strands: '2 fios (3 para cobrir mais)',
    needle: 'Tapeçaria nº 24 — precisa ser mais fina que o furo, mas não passar sozinha',
    needsPiercing: false,
    needsHoop: false,
    forgiving: false,
    description:
      'Cartão rígido já furado numa grade perfeita, vendido em folhas A4. É o caminho mais fácil para bordar em papel: a contagem já vem pronta e a borda não desfia, então dá para recortar o contorno do bordado.',
    cautions: [
      'Não aperte o ponto: o papel rasga entre os furos.',
      'Desmanchar deixa marca — o furo continua lá.',
      'A grade é fixa em 14ct, não dá para escolher outra contagem.',
    ],
  },
  {
    id: 'cartolina-texturizada',
    name: 'Cartolina texturizada 250g',
    family: 'papel',
    counts: [10, 11, 12, 14],
    defaultCount: 12,
    strands: '2 a 3 fios',
    needle: 'Agulha fina de ponta + furador (punção) para marcar os furos antes',
    needsPiercing: true,
    needsHoop: false,
    forgiving: false,
    description:
      'O material das referências de moldura de foto: cartão liso e encorpado (160–280g), onde você mesma fura a grade usando o guia impresso por baixo. Dá total liberdade de contagem e de formato do cartão.',
    cautions: [
      'Fure com o guia impresso em escala 100%, senão a grade sai fora de esquadro.',
      'Furos muito próximos rasgam: contagens acima de 14 ficam arriscadas nesse papel.',
      'Fure tudo antes de começar a bordar — furar com a linha já passada amassa o cartão.',
    ],
  },
  {
    id: 'papel-aquarela',
    name: 'Papel aquarela 300g',
    family: 'papel',
    counts: [8, 10, 11, 12],
    defaultCount: 10,
    strands: '3 fios',
    needle: 'Agulha de ponta + furador',
    needsPiercing: true,
    needsHoop: false,
    forgiving: true,
    description:
      'Fibra longa e superfície texturizada. É o papel que melhor disfarça furo errado, porque a fibra se fecha de volta — bom para quem está começando a bordar em papel.',
    cautions: [
      'Gramatura alta pede furador de verdade; agulha sozinha cansa a mão.',
      'Contagem baixa: os pontos ficam grandes, então prefira motivos simples e gráficos.',
    ],
  },
  {
    id: 'aida',
    name: 'Tecido Aida',
    family: 'tecido',
    counts: [11, 14, 16, 18],
    defaultCount: 14,
    strands: '3 fios (11ct) · 2 fios (14–16ct) · 1 a 2 fios (18ct)',
    needle: 'Tapeçaria nº 24 (14ct) ou nº 26 (16–18ct)',
    needsPiercing: false,
    needsHoop: true,
    forgiving: true,
    description:
      'O tecido clássico de ponto cruz: trama em blocos com furo bem definido, fácil de contar. É o material padrão para quadros, panos e almofadas.',
    cautions: [
      'Corte com 5 a 10cm de margem por lado — o bastidor precisa de sobra para prender.',
      'Chuleie ou passe fita nas bordas: Aida desfia enquanto você borda.',
    ],
  },
  {
    id: 'linho',
    name: 'Linho / Etamine',
    family: 'tecido',
    counts: [20, 22, 25, 28],
    defaultCount: 25,
    strands: '1 a 2 fios, bordando sobre 2 fios do tecido',
    needle: 'Tapeçaria nº 26 ou 28',
    needsPiercing: false,
    needsHoop: true,
    forgiving: true,
    description:
      'Trama fina e fio único, bordado geralmente "sobre dois" fios. Permite ponto fracionado de verdade e dá acabamento delicado — o tecido dos samplers tradicionais.',
    cautions: [
      'Contagem alta engana: 28ct bordado sobre 2 fios rende o mesmo tamanho de 14ct.',
      'Exige mais atenção na contagem, não é o melhor primeiro projeto.',
    ],
  },
  {
    id: 'waste-canvas',
    name: 'Canvas solúvel (waste canvas)',
    family: 'tecido',
    counts: [8, 10, 14],
    defaultCount: 14,
    strands: '2 a 3 fios',
    needle: 'Agulha de ponta (precisa furar a malha por baixo)',
    needsPiercing: false,
    needsHoop: false,
    forgiving: true,
    description:
      'Grade provisória alinhavada por cima da roupa: você borda contando por ela e depois desfia ou dissolve os fios, deixando o bordado direto na peça. É como se borda em camiseta e malha.',
    cautions: [
      'Só sai bem se o bordado não apertar a malha — pontos frouxos, sem repuxar.',
      'Umedeça antes de retirar os fios da grade, puxando um a um.',
    ],
  },
]

export function getSubstrate(id: string): Substrate | undefined {
  return SUBSTRATES.find((s) => s.id === id)
}
