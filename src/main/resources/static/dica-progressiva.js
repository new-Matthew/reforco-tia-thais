'use strict';

(function (raiz) {
  const TEMPO_INATIVIDADE_PADRAO = 3000;
  const CLASSE_DICA_ATIVA = 'dica-ativa';

  function normalizarItensDica(valor) {
    const lista = Array.isArray(valor) ? valor : [valor];
    const vistos = new Set();
    const itens = [];

    lista.forEach((item) => {
      const seletor = typeof item === 'string' ? item : item?.seletor;
      if (typeof seletor !== 'string') {
        return;
      }
      const seletorLimpo = seletor.trim();
      if (seletorLimpo === '') {
        return;
      }
      const classe = typeof item === 'object'
        && item !== null
        && typeof item.classe === 'string'
        && item.classe.trim() !== ''
        ? item.classe.trim()
        : null;
      const chave = (classe ?? '') + '\u0000' + seletorLimpo;
      if (vistos.has(chave)) {
        return;
      }
      vistos.add(chave);
      itens.push({ seletor: seletorLimpo, classe });
    });

    return itens;
  }

  function normalizarSeletoresDica(valor) {
    return normalizarItensDica(valor).map((item) => item.seletor);
  }

  function criarDicaProgressiva(opcoes) {
    const config = opcoes ?? {};
    const escopo = config.raiz;
    const obterSeletores = config.obterSeletores;
    const tempoInatividade = Number.isFinite(config.tempoInatividade)
      ? Math.max(0, config.tempoInatividade)
      : TEMPO_INATIVIDADE_PADRAO;
    const classe = config.classe || CLASSE_DICA_ATIVA;
    const agendar = config.agendar || ((fn, ms) => setTimeout(fn, ms));
    const cancelar = config.cancelar || ((id) => clearTimeout(id));

    if (!escopo || typeof escopo.querySelectorAll !== 'function') {
      throw new TypeError('A dica progressiva precisa de uma raiz com querySelectorAll.');
    }
    if (typeof obterSeletores !== 'function') {
      throw new TypeError('A dica progressiva precisa de uma função obterSeletores.');
    }

    let temporizador = null;
    let destacados = [];
    let classesAplicadas = new Map();
    let ativa = false;
    let destruida = false;

    function avisar(nome, argumento) {
      if (typeof config[nome] === 'function') {
        config[nome](argumento);
      }
    }

    function cancelarTemporizador() {
      if (temporizador === null) {
        return;
      }
      cancelar(temporizador);
      temporizador = null;
    }

    function limparDestaques() {
      classesAplicadas.forEach((classes, elemento) => {
        classes.forEach((classeAplicada) => {
          elemento.classList.remove(classeAplicada);
        });
      });
      classesAplicadas = new Map();
      destacados = [];
    }

    function esconder() {
      const estavaAtiva = ativa;
      limparDestaques();
      ativa = false;
      if (estavaAtiva) {
        avisar('aoEsconder');
      }
    }

    function coletarElementos(itens) {
      const encontrados = [];
      const classesPorElemento = new Map();

      itens.forEach((item) => {
        const classeAplicada = item.classe ?? classe;
        escopo.querySelectorAll(item.seletor).forEach((elemento) => {
          if (!elemento || !elemento.classList) {
            return;
          }
          if (!classesPorElemento.has(elemento)) {
            classesPorElemento.set(elemento, new Set());
            encontrados.push(elemento);
          }
          classesPorElemento.get(elemento).add(classeAplicada);
        });
      });

      return { encontrados, classesPorElemento };
    }

    function mostrar() {
      if (destruida) {
        return [];
      }

      cancelarTemporizador();
      const itens = normalizarItensDica(obterSeletores());
      const { encontrados, classesPorElemento } = coletarElementos(itens);

      if (encontrados.length === 0) {
        esconder();
        return [];
      }

      limparDestaques();
      classesPorElemento.forEach((classes, elemento) => {
        classes.forEach((classeAplicada) => {
          elemento.classList.add(classeAplicada);
        });
      });
      destacados = encontrados;
      classesAplicadas = classesPorElemento;

      const estavaAtiva = ativa;
      ativa = true;
      if (!estavaAtiva) {
        avisar('aoMostrar', encontrados.slice());
      }

      return encontrados.slice();
    }

    function reiniciar() {
      if (destruida) {
        return;
      }
      esconder();
      cancelarTemporizador();
      temporizador = agendar(() => {
        temporizador = null;
        mostrar();
      }, tempoInatividade);
    }

    function acionarErro() {
      if (destruida) {
        return [];
      }
      cancelarTemporizador();
      return mostrar();
    }

    function parar() {
      cancelarTemporizador();
      esconder();
    }

    function destruir() {
      parar();
      destruida = true;
    }

    return {
      iniciar: reiniciar,
      reiniciar,
      acionarErro,
      mostrar,
      esconder,
      parar,
      destruir,
      estaAtiva: () => ativa,
      obterDestacados: () => destacados.slice(),
    };
  }

  const exportacoes = {
    TEMPO_INATIVIDADE_PADRAO,
    CLASSE_DICA_ATIVA,
    normalizarItensDica,
    normalizarSeletoresDica,
    criarDicaProgressiva,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportacoes;
  } else {
    raiz.DicaProgressiva = exportacoes;
  }
}(typeof window !== 'undefined' ? window : globalThis));
