import { Icon } from '../components/common/Icon'
import { STITCH_TYPES, TIPS } from '../data/stitchGuide'
import { FABRIC_COUNTS } from '../lib/pattern/sizing'
import { recommendedStrands } from '../lib/stitch/flossEstimate'

export function GuidePage() {
  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="thread" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Tipos de ponto</h2>
              <p>O vocabulário básico do ponto cruz</p>
            </div>
          </div>

          {STITCH_TYPES.map((stitch) => (
            <div key={stitch.id} className="guide-item">
              <h3>{stitch.name}</h3>
              <p>{stitch.description}</p>
              <p>{stitch.usage}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--green">
              <Icon name="ruler" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Tabela de tecidos</h2>
              <p>Contagem, fios recomendados e uso típico</p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Tecido</th>
                <th className="num">Pontos/pol</th>
                <th className="num">Fios</th>
                <th>Indicado para</th>
              </tr>
            </thead>
            <tbody>
              {FABRIC_COUNTS.map((count) => (
                <tr key={count}>
                  <td>Aida {count}</td>
                  <td className="num">{count}</td>
                  <td className="num">{recommendedStrands(count)}</td>
                  <td>{fabricUsage(count)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="hint">
            A mesma quantidade de pontos rende um bordado bem menor num tecido de contagem alta. Use as Calculadoras para
            comparar antes de comprar.
          </p>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--amber">
              <Icon name="bulb" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Dicas de bordado</h2>
              <p>O que faz diferença no resultado final</p>
            </div>
          </div>

          {TIPS.map((tip) => (
            <div key={tip.id} className="guide-item">
              <h3>{tip.title}</h3>
              <p>{tip.body}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="info" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Como ler o gráfico</h2>
              <p>Do padrão gerado para o tecido</p>
            </div>
          </div>

          <div className="guide-item">
            <h3>Cada quadradinho = um ponto cheio</h3>
            <p>O gráfico é um mapa 1:1 do tecido: um quadradinho do gráfico corresponde a um quadradinho do Aida.</p>
          </div>
          <div className="guide-item">
            <h3>Linhas grossas a cada 10 pontos</h3>
            <p>
              Servem para você contar de dez em dez em vez de um a um — tanto na tela quanto no PDF impresso. É o que evita
              o desalinho que só aparece depois de muita linha bordada.
            </p>
          </div>
          <div className="guide-item">
            <h3>Símbolos para imprimir</h3>
            <p>
              No modo Símbolos cada cor vira um desenho diferente em preto e branco, legível numa impressão comum. A legenda
              liga cada símbolo ao código DMC correspondente.
            </p>
          </div>
          <div className="guide-item">
            <h3>Padrão grande vira mosaico</h3>
            <p>
              No PDF, gráficos maiores que uma folha são divididos em várias páginas A4 com 2 pontos de sobreposição nas
              bordas, para você emendar sem perder a conta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function fabricUsage(count: number): string {
  if (count <= 11) return 'Iniciantes, crianças, projetos grandes e rápidos'
  if (count === 14) return 'O padrão do mercado — serve para quase tudo'
  if (count === 16) return 'Um pouco mais fino, bom para retratos'
  if (count === 18) return 'Detalhe alto em pouco espaço'
  return 'Miniaturas e trabalho muito fino'
}
