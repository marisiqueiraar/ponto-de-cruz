export interface StitchType {
  id: string
  name: string
  description: string
  usage: string
}

export const STITCH_TYPES: StitchType[] = [
  {
    id: 'ponto-cheio',
    name: 'Ponto cheio (X)',
    description: 'Dois pontos diagonais cruzados preenchendo um quadradinho inteiro da grade.',
    usage: 'É a base de tudo — cada quadradinho do gráfico gerado aqui corresponde a um ponto cheio.',
  },
  {
    id: 'meio-ponto',
    name: 'Meio ponto',
    description: 'Só uma das diagonais, sem fechar o X.',
    usage: 'Preenche fundos grandes mais rápido e com aspecto mais leve, já que cobre menos o tecido.',
  },
  {
    id: 'ponto-fracionado',
    name: 'Ponto ¼ e ¾',
    description: 'Pontos parciais que ocupam só parte do quadradinho, furando o centro do tecido.',
    usage: 'Suavizam curvas e diagonais. Rendem melhor em linho/etamine que em Aida, que tem furo central mais duro.',
  },
  {
    id: 'backstitch',
    name: 'Pesponto (backstitch)',
    description: 'Linha reta contínua contornando as formas, quase sempre com 1 fio só.',
    usage: 'Funciona como a "caneta" do bordado: define contornos e dá nitidez ao desenho depois de preenchido.',
  },
  {
    id: 'no-frances',
    name: 'Nó francês',
    description: 'Nó enrolado na agulha que forma um pontinho em relevo.',
    usage: 'Detalhes pontuais com textura — olhos, miolo de flor, pontos de luz.',
  },
]

export interface Tip {
  id: string
  title: string
  body: string
}

export const TIPS: Tip[] = [
  {
    id: 'centro',
    title: 'Comece pelo centro',
    body: 'Dobre o tecido ao meio nos dois sentidos para achar o centro e comece a bordar por ali. Assim o desenho fica centralizado mesmo se a contagem escapar um pouco.',
  },
  {
    id: 'fios',
    title: 'Número de fios importa',
    body: 'Em Aida 14, o padrão são 2 fios para o ponto cheio e 1 fio para o contorno. Fio a mais fecha o furo do tecido; fio a menos deixa o fundo aparecendo.',
  },
  {
    id: 'margem',
    title: 'Corte o tecido com folga',
    body: 'Some pelo menos 5cm de margem em cada lado — 10cm se for emoldurar. Tecido curto é o erro mais caro e mais comum.',
  },
  {
    id: 'contagem',
    title: 'A contagem muda o tamanho, não o padrão',
    body: 'O mesmo gráfico em Aida 18 sai bem menor que em Aida 11, com o mesmo número de pontos. Use a aba Calculadoras para comparar antes de comprar o tecido.',
  },
  {
    id: 'direcao',
    title: 'Mantenha a direção das cruzes',
    body: 'Todas as diagonais de cima devem apontar para o mesmo lado. É o detalhe que faz o bordado pronto parecer uniforme e profissional.',
  },
  {
    id: 'cores',
    title: 'Menos cores, mais legível',
    body: 'Padrões com 15 a 25 cores costumam render melhor que os de 40+: menos troca de linha, menos confusão no gráfico e resultado mais gráfico.',
  },
]

export function tipOfTheDay(date = new Date()): Tip {
  const dayIndex = Math.floor(date.getTime() / 86_400_000)
  return TIPS[dayIndex % TIPS.length]
}
