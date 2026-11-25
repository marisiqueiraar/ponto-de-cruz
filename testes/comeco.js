// O ponto de partida dos testes que mexem numa palavra.
//
// O molde novo nascia com a palavra "champ" e estes testes partiam dela. Hoje
// o molde nasce vazio; a palavra é criada aqui pelo mesmo caminho da pessoa —
// o botão nova palavra e o campo de texto —, e não escrita direto na memória.
// O lugar onde ela nasce é o de hoje (embaixo da foto, reta); o texto e a
// fonte são os de antes.
module.exports = async function comecaComPalavra(pg){
  await pg.evaluate(() => {
    const b = document.querySelector('#rail button[data-pane="pecas"]');
    if (b && !b.classList.contains("on")) b.click();
  });
  await pg.click("#addText");
  await pg.fill("#txt", "champ");
  await pg.dispatchEvent("#txt", "input");
  // a fonte é a de fábrica de antes, Great Vibes: os números de referência dos
  // testes (grades, posições do laço) foram medidos com ela
  await pg.evaluate(() => {
    const s = document.getElementById("font");
    s.value = "Great Vibes";
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await pg.waitForTimeout(700);
};
