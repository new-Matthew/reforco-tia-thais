'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TEMPO_INATIVIDADE_PADRAO,
  CLASSE_DICA_ATIVA,
  normalizarItensDica,
  normalizarSeletoresDica,
  criarDicaProgressiva,
} = require('../../main/resources/static/dica-progressiva.js');

function criarElementoFalso() {
  const classes = new Set();
  return {
    classes,
    classList: {
      add(classe) {
        classes.add(classe);
      },
      remove(classe) {
        classes.delete(classe);
      },
      contains(classe) {
        return classes.has(classe);
      },
    },
  };
}

function criarRaizFalsa(mapaInicial = {}) {
  const mapa = new Map(Object.entries(mapaInicial));
  return {
    mapa,
    raiz: {
      querySelectorAll(seletor) {
        return mapa.get(seletor) ?? [];
      },
    },
    definir(seletor, elementos) {
      mapa.set(seletor, elementos);
    },
  };
}

function criarAgendadorFalso() {
  let proximoId = 1;
  const tarefas = [];

  return {
    tarefas,
    agendar(fn, ms) {
      const tarefa = {
        id: proximoId,
        fn,
        ms,
        cancelada: false,
        executada: false,
      };
      proximoId += 1;
      tarefas.push(tarefa);
      return tarefa.id;
    },
    cancelar(id) {
      const tarefa = tarefas.find((item) => item.id === id);
      if (tarefa) {
        tarefa.cancelada = true;
      }
    },
    pendentes() {
      return tarefas.filter((item) => !item.cancelada && !item.executada);
    },
    executarPendentes() {
      const ativas = tarefas.filter((item) => !item.cancelada && !item.executada);
      ativas.forEach((item) => {
        item.executada = true;
        item.fn();
      });
      return ativas.length;
    },
  };
}

function criarDicaTeste(opcoes = {}) {
  const elemento = opcoes.elemento ?? criarElementoFalso();
  const dom = criarRaizFalsa({ '.alvo': [elemento] });
  const agendador = criarAgendadorFalso();
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => ['.alvo'],
    tempoInatividade: 3000,
    agendar: agendador.agendar,
    cancelar: agendador.cancelar,
    ...(opcoes.config ?? {}),
  });

  return { dica, dom, agendador, elemento };
}

test('normalizarSeletoresDica limpa, deduplica e ignora valores inválidos', () => {
  assert.deepEqual(normalizarSeletoresDica('.alvo'), ['.alvo']);
  assert.deepEqual(
    normalizarSeletoresDica(['.a', ' .b ', '.a', '', null, 3]),
    ['.a', '.b'],
  );
  assert.deepEqual(normalizarSeletoresDica(undefined), []);
  assert.deepEqual(normalizarSeletoresDica([]), []);
});

test('normalizarItensDica aceita seletores com classe específica', () => {
  assert.deepEqual(
    normalizarItensDica([
      '.alvo',
      { seletor: ' .carry ', classe: ' dica-ativa-carry ' },
      { seletor: '.carry', classe: 'dica-ativa-carry' },
      { seletor: '.sem-classe' },
      null,
    ]),
    [
      { seletor: '.alvo', classe: null },
      { seletor: '.carry', classe: 'dica-ativa-carry' },
      { seletor: '.sem-classe', classe: null },
    ],
  );
});

test('dica aplica classes específicas e remove todas ao esconder', () => {
  const alvo = criarElementoFalso();
  const carry = criarElementoFalso();
  const dom = criarRaizFalsa({ '.alvo': [alvo], '.carry': [carry] });
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => [
      '.alvo',
      { seletor: '.carry', classe: 'dica-ativa-carry' },
    ],
  });

  assert.deepEqual(dica.mostrar(), [alvo, carry]);
  assert.equal(alvo.classes.has(CLASSE_DICA_ATIVA), true);
  assert.equal(alvo.classes.has('dica-ativa-carry'), false);
  assert.equal(carry.classes.has('dica-ativa-carry'), true);
  assert.equal(carry.classes.has(CLASSE_DICA_ATIVA), false);

  dica.parar();
  assert.equal(alvo.classes.has(CLASSE_DICA_ATIVA), false);
  assert.equal(carry.classes.has('dica-ativa-carry'), false);
});

test('criarDicaProgressiva exige raiz e obterSeletores', () => {
  assert.throws(
    () => criarDicaProgressiva({ obterSeletores: () => [] }),
    TypeError,
  );
  assert.throws(
    () => criarDicaProgressiva({ raiz: { querySelectorAll: () => [] } }),
    TypeError,
  );
});

test('dica usa o tempo de inatividade padrão de três segundos', () => {
  const elemento = criarElementoFalso();
  const dom = criarRaizFalsa({ '.alvo': [elemento] });
  const agendador = criarAgendadorFalso();
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => ['.alvo'],
    agendar: agendador.agendar,
    cancelar: agendador.cancelar,
  });

  dica.iniciar();

  assert.equal(TEMPO_INATIVIDADE_PADRAO, 3000);
  assert.equal(agendador.pendentes().length, 1);
  assert.equal(agendador.pendentes()[0].ms, 3000);
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);
});

test('dica destaca os seletores atuais somente após a inatividade', () => {
  const { dica, agendador, elemento } = criarDicaTeste();

  dica.iniciar();
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);

  agendador.executarPendentes();

  assert.equal(dica.estaAtiva(), true);
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), true);
  assert.deepEqual(dica.obterDestacados(), [elemento]);
});

test('reiniciar esconde o destaque e recomeça a contagem de inatividade', () => {
  const primeiro = criarElementoFalso();
  const segundo = criarElementoFalso();
  const dom = criarRaizFalsa({ '.alvo': [primeiro], '.outro': [segundo] });
  const agendador = criarAgendadorFalso();
  let seletores = ['.alvo'];
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => seletores,
    agendar: agendador.agendar,
    cancelar: agendador.cancelar,
  });

  dica.iniciar();
  agendador.executarPendentes();
  assert.equal(primeiro.classes.has(CLASSE_DICA_ATIVA), true);

  seletores = ['.outro'];
  dica.reiniciar();

  assert.equal(primeiro.classes.has(CLASSE_DICA_ATIVA), false);
  assert.equal(segundo.classes.has(CLASSE_DICA_ATIVA), false);
  assert.equal(agendador.pendentes().length, 1);

  agendador.executarPendentes();
  assert.equal(segundo.classes.has(CLASSE_DICA_ATIVA), true);
  assert.equal(primeiro.classes.has(CLASSE_DICA_ATIVA), false);
});

test('acionarErro mostra a dica imediatamente e cancela a espera', () => {
  const { dica, agendador, elemento } = criarDicaTeste();

  dica.iniciar();
  dica.acionarErro();

  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), true);
  assert.equal(agendador.pendentes().length, 0);
});

test('parar remove o destaque e cancela a inatividade pendente', () => {
  const { dica, agendador, elemento } = criarDicaTeste();

  dica.iniciar();
  dica.parar();

  assert.equal(agendador.pendentes().length, 0);
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);

  dica.iniciar();
  agendador.executarPendentes();
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), true);

  dica.parar();
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);
  assert.equal(dica.estaAtiva(), false);
});

test('dica não fica ativa quando nenhum seletor encontra elementos', () => {
  const dom = criarRaizFalsa();
  const agendador = criarAgendadorFalso();
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => ['.inexistente'],
    agendar: agendador.agendar,
    cancelar: agendador.cancelar,
  });

  assert.deepEqual(dica.mostrar(), []);
  assert.equal(dica.estaAtiva(), false);
});

test('dica agrupa elementos repetidos e ignora seletores vazios', () => {
  const elemento = criarElementoFalso();
  const dom = criarRaizFalsa({
    '.alvo': [elemento],
    '.repetido': [elemento, null],
  });
  const dica = criarDicaProgressiva({
    raiz: dom.raiz,
    obterSeletores: () => ['.alvo', '.repetido', '', null],
  });

  const destacados = dica.mostrar();

  assert.deepEqual(destacados, [elemento]);
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), true);
});

test('dica avisa quando aparece e quando some', () => {
  const mostrados = [];
  let escondidas = 0;
  const { dica, agendador, elemento } = criarDicaTeste({
    config: {
      aoMostrar: (elementos) => mostrados.push(elementos),
      aoEsconder: () => { escondidas += 1; },
    },
  });

  dica.iniciar();
  agendador.executarPendentes();
  assert.equal(mostrados.length, 1);
  assert.deepEqual(mostrados[0], [elemento]);

  dica.parar();
  assert.equal(escondidas, 1);
});

test('destruir impede novos agendamentos e remove o destaque', () => {
  const { dica, agendador, elemento } = criarDicaTeste();

  dica.mostrar();
  dica.destruir();

  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);

  dica.reiniciar();
  dica.acionarErro();

  assert.equal(agendador.pendentes().length, 0);
  assert.equal(elemento.classes.has(CLASSE_DICA_ATIVA), false);
});
