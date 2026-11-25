// O ponto de partida dos testes que mexem numa palavra.
//
// O molde novo nascia com a palavra "champ" e estes testes partiam dela. Hoje
// o molde nasce vazio; a palavra é criada aqui pelo mesmo caminho da pessoa —
// o botão nova palavra e o campo de texto —, e não escrita direto na memória.
module.exports = async function comecaComPalavra(pg){
  await pg.evaluate(() => {
    const b = document.querySelector('#rail button[data-pane="pecas"]');
    if (b && !b.classList.contains("on")) b.click();
  });
  await pg.click("#addText");
  await pg.fill("#txt", "champ");
  await pg.dispatchEvent("#txt", "input");
  await pg.waitForTimeout(700);
};
