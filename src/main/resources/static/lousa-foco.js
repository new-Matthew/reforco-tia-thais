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
   * Ordem lógica do preenchimento na multiplicação: unidades do resultado,
   * transporte ("vai um") daquela coluna e só então a próxima coluna do
   * resultado. Sem transporte, as colunas seguem em sequência.
   */
  function ordemFocoMultiplicacao(colunas, temVaiUm) {
    const ordem = [];
    for (let indice = 0; indice < colunas; indice += 1) {
      ordem.push({ tipo: 'resultado', coluna: indice });
      if (temVaiUm && indice === 0) {
        ordem.push({ tipo: 'vaiUm', coluna: 1 });
      }
    }
    return ordem;
  }

  /*
   * Ordem de preenchimento da adição como no papel: primeiro a unidade do
   * resultado; se aquela coluna gerar transporte, sobe para o "vai um" da
   * coluna à esquerda e só então desce para o resultado dessa coluna.
   */
  function ordemFocoSoma(digitos, transportes) {
    const quantidade = Math.max(0, Math.trunc(Number(digitos) || 0));
    const passos = Array.from(transportes ?? [], normalizarPasso);
    const ordem = [];

    for (let coluna = 0; coluna < quantidade; coluna += 1) {
      ordem.push({ tipo: 'resultado', coluna });
      if (passos[coluna] === 1 && coluna + 1 <= quantidade - 1) {
        ordem.push({ tipo: 'vaiUm', coluna: coluna + 1 });
      }
    }

    if (quantidade > 0 && passos[quantidade - 1] === 1) {
      ordem.push({ tipo: 'resultado', coluna: quantidade });
    }

    return ordem;
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

  function focarProximoMultiplicacao(el, ordem, atual) {
    focarNaOrdemFoco(el, ordem, atual, 1);
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
