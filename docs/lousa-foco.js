'use strict';

/*
 * Utilitários independentes de foco automático, navegação por digitação e
 * eventos de teclado da lousa. Não conhece o estado do jogo nem a API: recebe
 * apenas os elementos e a ordem lógica de preenchimento calculada pelo app.
 *
 * No navegador é carregado antes de app.js e exposto em `window.LousaFoco`.
 * No Node é consumido via require pelos testes unitários.
 */
(function (raiz) {
  function normalizarPasso(valor) {
    if (valor === true) {
      return 1;
    }
    const texto = String(valor ?? '').trim();
    if (texto === '') {
      return 0;
    }
    const numero = Number(texto);
    if (!Number.isFinite(numero)) {
      return 0;
    }
    return numero >= 1 ? 1 : 0;
  }

  /*
   * Ordem lógica do preenchimento na multiplicação.
   *
   * Fácil (duas casas): unidade e dezena ficam livres para começar por
   * qualquer uma delas; a alternância é tratada por
   * proximoFocoMultiplicacao(..., flexivel = true).
   *
   * Médio (três casas): começa na unidade, sobe para o transporte quando ele
   * existe e só então vai para a dezena. Quando a dezena, somada ao
   * transporte, alcança a centena, a centena é preenchida antes da dezena.
   */
  function ordemFocoMultiplicacao(colunas, temVaiUm, vaiParaCentena) {
    const quantidade = Math.max(0, Math.trunc(Number(colunas) || 0));
    if (quantidade === 0) {
      return [];
    }

    const ordem = [{ tipo: 'resultado', coluna: 0 }];
    if (quantidade === 1) {
      return ordem;
    }
    if (quantidade === 2) {
      ordem.push({ tipo: 'resultado', coluna: 1 });
      return ordem;
    }

    if (temVaiUm) {
      ordem.push({ tipo: 'vaiUm', coluna: 1 });
    }
    if (vaiParaCentena) {
      ordem.push({ tipo: 'resultado', coluna: 2 });
    }
    ordem.push({ tipo: 'resultado', coluna: 1 });

    for (let indice = 3; indice < quantidade; indice += 1) {
      ordem.push({ tipo: 'resultado', coluna: indice });
    }
    return ordem;
  }

  /*
   * A adição é preenchida em duas etapas distintas.
   *
   * 1) Cálculo, da direita para a esquerda: percorre as colunas dos operandos
   *    (todas menos a última) preenchendo o resultado de cada uma e, quando a
   *    coluna gera transporte, o "vai um" da coluna seguinte.
   *
   * 2) Casas finais do resultado, da esquerda para a direita: por último entra
   *    a coluna mais à esquerda dos operandos e, se houver transporte final, a
   *    casa extra que ele cria (centena/milhar), sempre da maior para a menor.
   */
  function ordemCalculoSoma(quantidade, passos) {
    const ordem = [];

    for (let coluna = 0; coluna < quantidade - 1; coluna += 1) {
      ordem.push({ tipo: 'resultado', coluna });
      if (passos[coluna] === 1) {
        ordem.push({ tipo: 'vaiUm', coluna: coluna + 1 });
      }
    }

    return ordem;
  }

  function ordemCasasFinaisSoma(quantidade, passos) {
    const ultimaColunaOperando = quantidade - 1;
    const colunas = [];

    if (passos[ultimaColunaOperando] === 1) {
      colunas.push(quantidade);
    }
    colunas.push(ultimaColunaOperando);

    return colunas.map((coluna) => ({ tipo: 'resultado', coluna }));
  }

  function ordemFocoSoma(digitos, transportes) {
    const quantidade = Math.max(0, Math.trunc(Number(digitos) || 0));
    if (quantidade <= 0) {
      return [];
    }
    const passos = Array.from(transportes ?? [], normalizarPasso);

    return [
      ...ordemCalculoSoma(quantidade, passos),
      ...ordemCasasFinaisSoma(quantidade, passos),
    ];
  }

  /*
   * Quando a criança digita o resultado da esquerda para a direita, o cursor
   * caminha para a casa vazia imediatamente à direita (coluna menor).
   */
  function proximaColunaResultadoADireita(colunaAtual, preenchidas) {
    const atual = Math.trunc(Number(colunaAtual) || 0);
    for (let coluna = atual - 1; coluna >= 0; coluna -= 1) {
      if (!preenchidas[coluna]) {
        return coluna;
      }
    }
    return null;
  }

  function mesmoAlvoFoco(item, atual) {
    return Boolean(item && atual)
      && item.tipo === atual.tipo
      && item.coluna === atual.coluna;
  }

  function itemNaOrdemFoco(ordem, atual, passo) {
    const posicao = ordem.findIndex((item) => mesmoAlvoFoco(item, atual));
    if (posicao < 0) {
      return null;
    }
    return ordem[posicao + passo] ?? null;
  }

  function proximoItemOrdem(ordem, atual) {
    return itemNaOrdemFoco(ordem, atual, 1);
  }

  function itemAnteriorOrdem(ordem, atual) {
    return itemNaOrdemFoco(ordem, atual, -1);
  }

  function chaveAlvoFoco(alvo) {
    return alvo ? alvo.tipo + ':' + alvo.coluna : null;
  }

  /*
   * Avança para o próximo passo ainda vazio do fluxo, evitando que o cursor
   * volte para uma casa já preenchida.
   */
  function proximoItemVazioOrdem(ordem, atual, preenchidos) {
    const posicao = ordem.findIndex((item) => mesmoAlvoFoco(item, atual));
    if (posicao < 0) {
      return null;
    }
    const ocupados = preenchidos instanceof Set
      ? preenchidos
      : new Set(preenchidos ?? []);

    for (let indice = posicao + 1; indice < ordem.length; indice += 1) {
      if (!ocupados.has(chaveAlvoFoco(ordem[indice]))) {
        return ordem[indice];
      }
    }
    return null;
  }

  function primeiroItemVazioOrdem(ordem, preenchidos) {
    const ocupados = preenchidos instanceof Set
      ? preenchidos
      : new Set(preenchidos ?? []);

    for (let indice = 0; indice < ordem.length; indice += 1) {
      if (!ocupados.has(chaveAlvoFoco(ordem[indice]))) {
        return ordem[indice];
      }
    }
    return null;
  }

  function seletorAlvoFoco(alvo) {
    if (!alvo) {
      return null;
    }
    return alvo.tipo === 'vaiUm'
      ? '.caixa-vai-um[data-coluna="' + alvo.coluna + '"]'
      : '.resultado-input[data-coluna="' + alvo.coluna + '"]';
  }

  function preenchidosNaOrdem(el, ordem) {
    const preenchidos = new Set();
    ordem.forEach((item) => {
      const campo = el.conta.querySelector(seletorAlvoFoco(item));
      if (campo && String(campo.value).trim() !== '') {
        preenchidos.add(chaveAlvoFoco(item));
      }
    });
    return preenchidos;
  }

  function focarItemOrdem(el, alvo) {
    const seletor = seletorAlvoFoco(alvo);
    if (!seletor) {
      return false;
    }
    const campo = el.conta.querySelector(seletor);
    if (campo) {
      campo.focus();
      return true;
    }
    return false;
  }

  function focarNaOrdemFoco(el, ordem, atual, passo) {
    const alvo = passo >= 0
      ? proximoItemOrdem(ordem, atual)
      : itemAnteriorOrdem(ordem, atual);
    return focarItemOrdem(el, alvo);
  }

  /*
   * No nível fácil a criança pode começar pela unidade ou pela dezena. Quando
   * o fluxo linear termina, `flexivel` retoma a primeira casa ainda vazia para
   * que a digitação não trave.
   */
  function proximoFocoMultiplicacao(ordem, atual, preenchidos, flexivel) {
    const alvo = proximoItemVazioOrdem(ordem, atual, preenchidos);
    if (alvo || !flexivel) {
      return alvo;
    }
    return primeiroItemVazioOrdem(ordem, preenchidos);
  }

  function focarProximoMultiplicacao(el, ordem, atual, opcoes) {
    const preenchidos = preenchidosNaOrdem(el, ordem);
    const alvo = proximoFocoMultiplicacao(
      ordem,
      atual,
      preenchidos,
      Boolean(opcoes && opcoes.flexivel),
    );
    return focarItemOrdem(el, alvo);
  }

  function focarPorSeletor(el, seletor) {
    if (!seletor || !el || !el.conta) {
      return false;
    }
    const campo = el.conta.querySelector(seletor);
    if (!campo) {
      return false;
    }
    campo.focus();
    return true;
  }

  function focarResultadoPorColuna(el, coluna) {
    return focarPorSeletor(el, '.resultado-input[data-coluna="' + coluna + '"]');
  }

  function focarVaiUmPorColuna(el, coluna) {
    return focarPorSeletor(el, '.caixa-vai-um[data-coluna="' + coluna + '"]');
  }

  /*
   * Teclado dos campos de resultado: Backspace volta um passo (ou uma coluna,
   * quando não há fluxo do papel), e as setas andam entre as colunas. Devolve
   * true quando o evento já foi tratado pela navegação.
   */
  function tratarTeclaResultado(evento, opcoes) {
    const { el, ordemFoco, indice, colunas, usarOrdemFoco, campo } = opcoes;
    const valor = campo ? campo.value : '';

    if (evento.key === 'Backspace' && valor === '') {
      if (usarOrdemFoco) {
        focarNaOrdemFoco(el, ordemFoco, { tipo: 'resultado', coluna: indice }, -1);
      } else if (indice > 0) {
        focarResultadoPorColuna(el, indice - 1);
      }
      return true;
    }

    if (evento.key === 'ArrowLeft' && indice < colunas - 1) {
      evento.preventDefault();
      focarResultadoPorColuna(el, indice + 1);
      return true;
    }

    if (evento.key === 'ArrowRight' && indice > 0) {
      evento.preventDefault();
      focarResultadoPorColuna(el, indice - 1);
      return true;
    }

    return false;
  }

  function tratarTeclaVaiUm(evento, opcoes) {
    const { el, ordemFoco, indice, caixa } = opcoes;
    if (evento.key === 'Backspace' && caixa && caixa.value === '') {
      focarNaOrdemFoco(el, ordemFoco, { tipo: 'vaiUm', coluna: indice }, -1);
      return true;
    }
    return false;
  }

  /*
   * Teclado dos campos da divisão. A navegação concreta é injetada pelo app
   * para manter este módulo desacoplado dos seletores da divisão.
   */
  function tratarTeclaDivisao(evento, opcoes) {
    const { campo, aoFocarAnterior, aoConfirmar } = opcoes;

    if (evento.key === 'Backspace' && campo && campo.value === '') {
      if (aoFocarAnterior) {
        aoFocarAnterior();
      }
      return true;
    }

    if (evento.key === 'Enter') {
      evento.preventDefault();
      if (aoConfirmar) {
        aoConfirmar();
      }
      return true;
    }

    return false;
  }

  const exportacoes = {
    normalizarPasso,
    ordemFocoMultiplicacao,
    ordemCalculoSoma,
    ordemCasasFinaisSoma,
    ordemFocoSoma,
    proximaColunaResultadoADireita,
    proximoItemOrdem,
    itemAnteriorOrdem,
    chaveAlvoFoco,
    proximoItemVazioOrdem,
    primeiroItemVazioOrdem,
    seletorAlvoFoco,
    preenchidosNaOrdem,
    focarItemOrdem,
    focarNaOrdemFoco,
    proximoFocoMultiplicacao,
    focarProximoMultiplicacao,
    focarResultadoPorColuna,
    focarVaiUmPorColuna,
    tratarTeclaResultado,
    tratarTeclaVaiUm,
    tratarTeclaDivisao,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportacoes;
  } else {
    raiz.LousaFoco = exportacoes;
  }
}(typeof window !== 'undefined' ? window : globalThis));
