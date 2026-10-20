'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  digitosDe,
  quantidadeColunas,
  quantidadeCaixasVaiUm,
  proximaDificuldade,
  calcularProgresso,
  resolverProgresso,
  normalizarPasso,
  normalizarPassos,
  calcularVaiUm,
  montarArrayVaiUm,
  montarArrayEmprestimos,
  comporResultado,
  montarRequisicao,
  aplicarPreferencias,
} = require('../../main/resources/static/app.js');

test('normalizarPasso converte campos vazios e inválidos em zero', () => {
  assert.equal(normalizarPasso(''), 0);
  assert.equal(normalizarPasso('   '), 0);
  assert.equal(normalizarPasso(null), 0);
  assert.equal(normalizarPasso(undefined), 0);
  assert.equal(normalizarPasso('0'), 0);
  assert.equal(normalizarPasso(0), 0);
  assert.equal(normalizarPasso('texto'), 0);
});

test('normalizarPasso converte transporte presente em um', () => {
  assert.equal(normalizarPasso('1'), 1);
  assert.equal(normalizarPasso(' 1 '), 1);
  assert.equal(normalizarPasso(1), 1);
  assert.equal(normalizarPasso(true), 1);
});

test('normalizarPassos devolve inteiros 0/1 e preserva null', () => {
  assert.deepEqual(normalizarPassos(['1', '', ' ', undefined, '0']), [1, 0, 0, 0, 0]);
  assert.deepEqual(normalizarPassos([1, 0, '1']), [1, 0, 1]);
  assert.equal(normalizarPassos(null), null);
  assert.equal(normalizarPassos(undefined), null);
});

test('calcularVaiUm reproduz os passos esperados pelo backend', () => {
  assert.deepEqual(calcularVaiUm(38, 25), [1, 0]);
  assert.deepEqual(calcularVaiUm(98, 35), [1, 1, 0]);
  assert.deepEqual(calcularVaiUm(99, 1), [1, 1, 0]);
  assert.deepEqual(calcularVaiUm(12, 23), [0, 0]);
});

test('montarArrayVaiUm calcula o transporte final a partir das caixinhas internas', () => {
  assert.deepEqual(montarArrayVaiUm(['1'], 2, calcularVaiUm(98, 35)), [1, 1, 0]);
  assert.deepEqual(montarArrayVaiUm(['1'], 2, calcularVaiUm(38, 25)), [1, 0]);
  assert.deepEqual(montarArrayVaiUm(['1', '1'], 3, calcularVaiUm(987, 654)), [1, 1, 1, 0]);
});

test('montarArrayVaiUm não completa uma caixinha interna deixada em branco', () => {
  assert.deepEqual(montarArrayVaiUm([''], 2, calcularVaiUm(98, 35)), [0, 1, 0]);
});

test('montarArrayVaiUm preenche caixinhas ausentes com zero', () => {
  assert.deepEqual(montarArrayVaiUm(['1'], 3), [1, 0, 0]);
  assert.deepEqual(montarArrayVaiUm([], 2), [0, 0]);
  assert.deepEqual(montarArrayVaiUm([''], 2), [0, 0]);
});

test('montarArrayEmprestimos trata conjunto ausente como nenhum empréstimo', () => {
  assert.deepEqual(montarArrayEmprestimos(null, 3), [0, 0, 0]);
  assert.deepEqual(montarArrayEmprestimos(undefined, 2), [0, 0]);
});

test('montarRequisicao normaliza arrays com campos vazios antes do envio', () => {
  const questao = { id: 'id-3', operacao: 'SOMA', numeroA: 95, numeroB: 15 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 110,
    vaiUm: ['1', '1', ''],
    emprestados: null,
  });

  assert.deepEqual(requisicao.vaiUm, [1, 1, 0]);
  assert.equal(requisicao.emprestados, null);
});

test('digitosDe devolve os dígitos da direita para a esquerda', () => {
  assert.deepEqual(digitosDe(38), [8, 3]);
  assert.deepEqual(digitosDe(7), [7]);
  assert.deepEqual(digitosDe(100), [0, 0, 1]);
});

test('quantidadeColunas acrescenta uma coluna extra somente na soma', () => {
  assert.equal(quantidadeColunas('FACIL', 'SOMA'), 3);
  assert.equal(quantidadeColunas('MEDIO', 'SOMA'), 4);
  assert.equal(quantidadeColunas('FACIL', 'SUBTRACAO'), 2);
  assert.equal(quantidadeColunas('MEDIO', 'SUBTRACAO'), 3);
});

test('quantidadeColunas rejeita dificuldade desconhecida', () => {
  assert.throws(() => quantidadeColunas('DIFICIL', 'SOMA'), /Dificuldade inválida/);
});

test('quantidadeCaixasVaiUm só cria caixinhas entre as colunas dos operandos', () => {
  assert.equal(quantidadeCaixasVaiUm('FACIL'), 1);
  assert.equal(quantidadeCaixasVaiUm('MEDIO'), 2);
  assert.throws(() => quantidadeCaixasVaiUm('DIFICIL'), /Dificuldade inválida/);
});

test('proximaDificuldade avança do fácil para o médio e para no topo', () => {
  assert.equal(proximaDificuldade('FACIL'), 'MEDIO');
  assert.equal(proximaDificuldade('MEDIO'), null);
  assert.throws(() => proximaDificuldade('DIFICIL'), /Dificuldade inválida/);
});

test('calcularProgresso limita a barra entre 0 e 1', () => {
  assert.equal(calcularProgresso(0), 0);
  assert.equal(calcularProgresso(2), 0.4);
  assert.equal(calcularProgresso(5), 1);
  assert.equal(calcularProgresso(9), 1);
  assert.equal(calcularProgresso(-3), 0);
  assert.equal(calcularProgresso(3, 0), 0);
});

test('resolverProgresso zera o streak em erro ou acerto parcial', () => {
  assert.deepEqual(resolverProgresso(3, 'FACIL', false), {
    sequencia: 0,
    progresso: 0,
    subiuNivel: false,
    nivelMaximo: false,
    dificuldade: 'FACIL',
  });
});

test('resolverProgresso enche a barra a cada acerto', () => {
  const resultado = resolverProgresso(0, 'FACIL', true);
  assert.equal(resultado.sequencia, 1);
  assert.equal(resultado.progresso, 0.2);
  assert.equal(resultado.subiuNivel, false);
  assert.equal(resultado.dificuldade, 'FACIL');
});

test('resolverProgresso sobe de nível ao completar cinco acertos', () => {
  const resultado = resolverProgresso(4, 'FACIL', true);
  assert.equal(resultado.sequencia, 0);
  assert.equal(resultado.progresso, 1);
  assert.equal(resultado.subiuNivel, true);
  assert.equal(resultado.nivelMaximo, false);
  assert.equal(resultado.dificuldade, 'MEDIO');
});

test('resolverProgresso comemora a rodada no nível máximo sem subir mais', () => {
  const resultado = resolverProgresso(4, 'MEDIO', true);
  assert.equal(resultado.sequencia, 0);
  assert.equal(resultado.progresso, 1);
  assert.equal(resultado.subiuNivel, false);
  assert.equal(resultado.nivelMaximo, true);
  assert.equal(resultado.dificuldade, 'MEDIO');
});

test('montarArrayVaiUm recebe só as caixinhas internas e calcula o transporte final', () => {
  assert.deepEqual(montarArrayVaiUm(['1'], 2, calcularVaiUm(98, 35)), [1, 1, 0]);
  assert.deepEqual(montarArrayVaiUm(['1', '1'], 3, calcularVaiUm(987, 654)), [1, 1, 1, 0]);
  assert.deepEqual(montarArrayVaiUm(['1'], 2, calcularVaiUm(38, 25)), [1, 0]);
});

test('montarArrayVaiUm normaliza as caixinhas e não acrescenta coluna sem transporte', () => {
  assert.deepEqual(montarArrayVaiUm(['1', '']), [1, 0]);
  assert.deepEqual(montarArrayVaiUm(['0', '0']), [0, 0]);
  assert.deepEqual(montarArrayVaiUm(['', '']), [0, 0]);
});

test('montarArrayVaiUm acrescenta o transporte final quando a última caixa é 1', () => {
  assert.deepEqual(montarArrayVaiUm(['1', '1']), [1, 1, 0]);
  assert.deepEqual(montarArrayVaiUm(['0', '0', '1']), [0, 0, 1, 0]);
  assert.deepEqual(montarArrayVaiUm([]), []);
});

test('montarArrayEmprestimos converte as colunas que emprestam', () => {
  assert.deepEqual(montarArrayEmprestimos(new Set([1]), 2), [1, 0]);
  assert.deepEqual(montarArrayEmprestimos(new Set([1, 2]), 3), [1, 1, 0]);
  assert.deepEqual(montarArrayEmprestimos(new Set(), 2), [0, 0]);
  assert.deepEqual(montarArrayEmprestimos(new Set([2]), 3), [0, 1, 0]);
});

test('comporResultado monta o número a partir das colunas da direita para a esquerda', () => {
  assert.equal(comporResultado(['3', '6']), 63);
  assert.equal(comporResultado(['3', '6', '']), 63);
  assert.equal(comporResultado(['0', '0', '1']), 100);
  assert.equal(comporResultado(['5']), 5);
});

test('comporResultado devolve null quando nenhuma coluna foi preenchida', () => {
  assert.equal(comporResultado(['', '', '']), null);
  assert.equal(comporResultado([]), null);
});

test('montarRequisicao envia vaiUm apenas na soma', () => {
  const questao = { id: 'id-1', operacao: 'SOMA', numeroA: 38, numeroB: 25 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 63,
    vaiUm: [1, 0],
    emprestados: null,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-1',
    operacao: 'SOMA',
    numeroA: 38,
    numeroB: 25,
    resultadoDigitado: 63,
    vaiUm: [1, 0],
    emprestados: null,
  });
});

test('montarRequisicao envia emprestados apenas na subtração', () => {
  const questao = { id: 'id-2', operacao: 'SUBTRACAO', numeroA: 52, numeroB: 37 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 15,
    vaiUm: null,
    emprestados: [1, 0],
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-2',
    operacao: 'SUBTRACAO',
    numeroA: 52,
    numeroB: 37,
    resultadoDigitado: 15,
    vaiUm: null,
    emprestados: [1, 0],
  });
});

test('aplicarPreferencias lê operação e dificuldade da URL', () => {
  const estado = { operacao: 'SOMA', dificuldade: 'FACIL' };
  aplicarPreferencias(estado, '?operacao=SUBTRACAO&dificuldade=MEDIO');
  assert.deepEqual(estado, { operacao: 'SUBTRACAO', dificuldade: 'MEDIO' });
});

test('aplicarPreferencias ignora valores desconhecidos', () => {
  const estado = { operacao: 'SOMA', dificuldade: 'FACIL' };
  aplicarPreferencias(estado, '?operacao=MULTIPLICACAO&dificuldade=IMPOSSIVEL');
  assert.deepEqual(estado, { operacao: 'SOMA', dificuldade: 'FACIL' });
  aplicarPreferencias(estado, '');
  assert.deepEqual(estado, { operacao: 'SOMA', dificuldade: 'FACIL' });
});
