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
  normalizarVaiUmMultiplicacao,
  lerVaiUmMultiplicacao,
  ordemFocoMultiplicacao,
  calcularVaiUm,
  montarArrayVaiUm,
  montarArrayEmprestimos,
  comporResultado,
  montarRequisicao,
  aplicarPreferencias,
  podeIniciarQuestao,
  podeValidarResposta,
  normalizarNomeJogador,
  nomeJogadorValido,
  lerNomeJogador,
  salvarNomeJogador,
  montarTituloFeedback,
  criarAvisoServidor,
  digitosDosOperandos,
  digitosDoMultiplicador,
  calcularVaiUmMultiplicacao,
} = require('../../main/resources/static/app.js');

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  assert.throws(() => quantidadeColunas('IMPOSSIVEL', 'SOMA'), /Dificuldade inválida/);
});

test('quantidadeCaixasVaiUm só cria caixinhas entre as colunas dos operandos', () => {
  assert.equal(quantidadeCaixasVaiUm('FACIL'), 1);
  assert.equal(quantidadeCaixasVaiUm('MEDIO'), 2);
  assert.throws(() => quantidadeCaixasVaiUm('IMPOSSIVEL'), /Dificuldade inválida/);
});

test('proximaDificuldade avança do fácil para o médio e para no topo', () => {
  assert.equal(proximaDificuldade('FACIL'), 'MEDIO');
  assert.equal(proximaDificuldade('MEDIO'), null);
  assert.throws(() => proximaDificuldade('IMPOSSIVEL'), /Dificuldade inválida/);
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
    vaiUmMultiplicacao: null,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-1',
    operacao: 'SOMA',
    numeroA: 38,
    numeroB: 25,
    resultadoDigitado: 63,
    vaiUm: [1, 0],
    emprestados: null,
    vaiUmMultiplicacao: null,
  });
});

test('montarRequisicao envia emprestados apenas na subtração', () => {
  const questao = { id: 'id-2', operacao: 'SUBTRACAO', numeroA: 52, numeroB: 37 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 15,
    vaiUm: null,
    emprestados: [1, 0],
    vaiUmMultiplicacao: null,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-2',
    operacao: 'SUBTRACAO',
    numeroA: 52,
    numeroB: 37,
    resultadoDigitado: 15,
    vaiUm: null,
    emprestados: [1, 0],
    vaiUmMultiplicacao: null,
  });
});

test('aplicarPreferencias lê operação e dificuldade da URL', () => {
  const estado = { operacao: 'SOMA', dificuldade: 'FACIL' };
  aplicarPreferencias(estado, '?operacao=SUBTRACAO&dificuldade=MEDIO');
  assert.deepEqual(estado, { operacao: 'SUBTRACAO', dificuldade: 'MEDIO' });
});

test('aplicarPreferencias ignora valores desconhecidos', () => {
  const estado = { operacao: 'SOMA', dificuldade: 'FACIL' };
  aplicarPreferencias(estado, '?operacao=DIVISAO&dificuldade=IMPOSSIVEL');
  assert.deepEqual(estado, { operacao: 'SOMA', dificuldade: 'FACIL' });
  aplicarPreferencias(estado, '');
  assert.deepEqual(estado, { operacao: 'SOMA', dificuldade: 'FACIL' });
});

test('criarAvisoServidor mostra o aviso após o limite e o remove ao concluir', async () => {
  const el = { avisoServidor: { hidden: true } };
  const aviso = criarAvisoServidor(el, 10);
  const concluir = aviso.iniciar();

  assert.equal(el.avisoServidor.hidden, true);
  await esperar(25);
  assert.equal(el.avisoServidor.hidden, false);

  concluir();
  assert.equal(el.avisoServidor.hidden, true);
});

test('criarAvisoServidor não mostra o aviso quando a requisição termina antes do limite', async () => {
  const el = { avisoServidor: { hidden: true } };
  const aviso = criarAvisoServidor(el, 40);
  const concluir = aviso.iniciar();

  concluir();
  await esperar(55);

  assert.equal(el.avisoServidor.hidden, true);
});

test('criarAvisoServidor mantém o aviso enquanto houver requisições simultâneas', async () => {
  const el = { avisoServidor: { hidden: true } };
  const aviso = criarAvisoServidor(el, 10);
  const concluirPrimeira = aviso.iniciar();
  const concluirSegunda = aviso.iniciar();

  await esperar(25);
  assert.equal(el.avisoServidor.hidden, false);

  concluirPrimeira();
  concluirPrimeira();
  assert.equal(el.avisoServidor.hidden, false);

  concluirSegunda();
  assert.equal(el.avisoServidor.hidden, true);
});

test('podeIniciarQuestao bloqueia uma nova carga enquanto a anterior está em andamento', () => {
  assert.equal(podeIniciarQuestao({ carregando: false, validando: false }), true);
  assert.equal(podeIniciarQuestao({ carregando: true, validando: false }), false);
  assert.equal(podeIniciarQuestao({ carregando: false, validando: true }), false);
});

test('podeValidarResposta exige questão ativa e bloqueia resposta duplicada', () => {
  const questao = { id: 'q-1' };
  const base = {
    questao,
    carregando: false,
    validando: false,
    questaoRespondida: false,
  };

  assert.equal(podeValidarResposta(base), true);
  assert.equal(podeValidarResposta({ ...base, questao: null }), false);
  assert.equal(podeValidarResposta({ ...base, questaoRespondida: true }), false);
  assert.equal(podeValidarResposta({ ...base, carregando: true }), false);
  assert.equal(podeValidarResposta({ ...base, validando: true }), false);
});

test('normalizarNomeJogador remove espaços extras e limita o tamanho', () => {
  assert.equal(normalizarNomeJogador('  Ana   Maria  '), 'Ana Maria');
  assert.equal(normalizarNomeJogador(null), '');
  assert.equal(normalizarNomeJogador('   '), '');
  assert.equal(Array.from(normalizarNomeJogador('a'.repeat(40))).length, 30);
  assert.equal(Array.from(normalizarNomeJogador('😀'.repeat(31))).length, 30);
});

test('nomeJogadorValido exige pelo menos um caractere visível', () => {
  assert.equal(nomeJogadorValido('Ana'), true);
  assert.equal(nomeJogadorValido('  A  '), true);
  assert.equal(nomeJogadorValido('    '), false);
  assert.equal(nomeJogadorValido(null), false);
});

test('lerNomeJogador recupera o nome da sessão e tolera falhas de acesso', () => {
  const armazenamento = {
    valor: '  Bia  ',
    getItem() {
      return this.valor;
    },
  };
  assert.equal(lerNomeJogador(armazenamento), 'Bia');

  armazenamento.getItem = () => {
    throw new Error('indisponível');
  };
  assert.equal(lerNomeJogador(armazenamento), '');
  assert.equal(lerNomeJogador(null), '');
});

test('salvarNomeJogador grava apenas o nome normalizado na sessão', () => {
  const armazenamento = {
    valor: null,
    setItem(chave, valor) {
      this.chave = chave;
      this.valor = valor;
    },
  };

  assert.equal(salvarNomeJogador('  João   Pedro  ', armazenamento), 'João Pedro');
  assert.equal(armazenamento.valor, 'João Pedro');
  assert.equal(salvarNomeJogador('   ', armazenamento), '');
  assert.equal(armazenamento.valor, 'João Pedro');
});

test('montarTituloFeedback personaliza os feedbacks com o nome do jogador', () => {
  const acerto = { correto: true, pontosGanhos: 10 };
  const parcial = { correto: false, pontosGanhos: 4 };
  const erro = { correto: false, pontosGanhos: 0 };

  assert.equal(montarTituloFeedback('Ana', acerto, {}), 'Parabéns, Ana!');
  assert.equal(montarTituloFeedback('Ana', parcial, {}), 'Quase lá, Ana!');
  assert.equal(montarTituloFeedback('Ana', erro, {}), 'Tente novamente, Ana!');
  assert.equal(montarTituloFeedback('', acerto, {}), 'Muito bem!');
  assert.equal(montarTituloFeedback('', parcial, {}), 'Quase perfeito!');
  assert.equal(montarTituloFeedback('', erro, {}), 'Vamos tentar de novo!');
  assert.equal(
    montarTituloFeedback('Ana', acerto, { subiuNivel: true }),
    'Parabéns, Ana!',
  );
  assert.equal(
    montarTituloFeedback('', acerto, { subiuNivel: true }),
    'Subiu de nível!',
  );
  assert.equal(
    montarTituloFeedback('', acerto, { nivelMaximo: true }),
    'Nível máximo!',
  );
});

test('salvarNomeJogador mantém o nome em memória se a sessão estiver indisponível', () => {
  const armazenamento = {
    setItem() {
      throw new Error('indisponível');
    },
  };
  const avisoOriginal = console.warn;
  console.warn = () => {};
  try {
    assert.equal(salvarNomeJogador('  Lia  ', armazenamento), 'Lia');
  } finally {
    console.warn = avisoOriginal;
  }
});

test('quantidadeColunas reserva colunas suficientes para o resultado da multiplicação', () => {
  assert.equal(quantidadeColunas('FACIL', 'MULTIPLICACAO'), 2);
  assert.equal(quantidadeColunas('MEDIO', 'MULTIPLICACAO'), 3);
});

test('digitosDosOperandos usa um ou dois dígitos no multiplicando', () => {
  assert.equal(digitosDosOperandos('FACIL', 'MULTIPLICACAO'), 1);
  assert.equal(digitosDosOperandos('MEDIO', 'MULTIPLICACAO'), 2);
  assert.equal(digitosDosOperandos('FACIL', 'SOMA'), 2);
  assert.equal(digitosDosOperandos('MEDIO', 'SUBTRACAO'), 3);
});

test('digitosDoMultiplicador usa sempre um dígito na multiplicação', () => {
  assert.equal(digitosDoMultiplicador('FACIL', 'MULTIPLICACAO'), 1);
  assert.equal(digitosDoMultiplicador('MEDIO', 'MULTIPLICACAO'), 1);
  assert.equal(digitosDoMultiplicador('MEDIO', 'SOMA'), 3);
});

test('normalizarVaiUmMultiplicacao preserva transportes maiores que um', () => {
  assert.equal(normalizarVaiUmMultiplicacao('7'), 7);
  assert.equal(normalizarVaiUmMultiplicacao('9'), 9);
  assert.equal(normalizarVaiUmMultiplicacao('4'), 4);
  assert.equal(normalizarVaiUmMultiplicacao('0'), 0);
  assert.equal(normalizarVaiUmMultiplicacao(7), 7);
  assert.equal(normalizarVaiUmMultiplicacao(''), null);
  assert.equal(normalizarVaiUmMultiplicacao(null), null);
  assert.equal(normalizarVaiUmMultiplicacao('10'), null);
  assert.equal(normalizarVaiUmMultiplicacao('x'), null);
});

test('lerVaiUmMultiplicacao envia o valor real da caixinha', () => {
  assert.equal(lerVaiUmMultiplicacao(['7']), 7);
  assert.equal(lerVaiUmMultiplicacao(['4']), 4);
  assert.equal(lerVaiUmMultiplicacao(['0']), 0);
  assert.equal(lerVaiUmMultiplicacao(['']), null);
  assert.equal(lerVaiUmMultiplicacao([]), null);
});

test('normalizarPasso não pode ser usado no transporte da multiplicação', () => {
  assert.equal(normalizarPasso('7'), 1);
  assert.equal(lerVaiUmMultiplicacao(['7']), 7);
});

test('ordemFocoMultiplicacao coloca o vai um entre as unidades e as dezenas', () => {
  assert.deepEqual(ordemFocoMultiplicacao(3, true), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'resultado', coluna: 2 },
  ]);
});

test('ordemFocoMultiplicacao segue em sequência quando não há transporte', () => {
  assert.deepEqual(ordemFocoMultiplicacao(2, false), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
  ]);
  assert.deepEqual(ordemFocoMultiplicacao(3, false), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'resultado', coluna: 2 },
  ]);
});

test('calcularVaiUmMultiplicacao usa o transporte das unidades', () => {
  assert.equal(calcularVaiUmMultiplicacao(35, 3), 1);
  assert.equal(calcularVaiUmMultiplicacao(24, 4), 1);
  assert.equal(calcularVaiUmMultiplicacao(12, 3), 0);
  assert.equal(calcularVaiUmMultiplicacao(98, 9), 7);
});

test('montarRequisicao envia o vai um da multiplicação média', () => {
  const questao = {
    id: 'id-mult',
    operacao: 'MULTIPLICACAO',
    dificuldade: 'MEDIO',
    numeroA: 35,
    numeroB: 3,
  };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 105,
    vaiUm: ['1'],
    emprestados: new Set([0]),
    vaiUmMultiplicacao: 1,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-mult',
    operacao: 'MULTIPLICACAO',
    numeroA: 35,
    numeroB: 3,
    resultadoDigitado: 105,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: 1,
  });
});

test('montarRequisicao envia o transporte 7 da multiplicação intacto', () => {
  const questao = {
    id: 'id-mult-carry-alto',
    operacao: 'MULTIPLICACAO',
    numeroA: 98,
    numeroB: 9,
  };

  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 882,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: lerVaiUmMultiplicacao(['7']),
  });

  assert.equal(requisicao.vaiUmMultiplicacao, 7);
});

test('montarRequisicao não envia passos de soma ou subtração na multiplicação', () => {
  const questao = {
    id: 'id-mult-facil',
    operacao: 'MULTIPLICACAO',
    dificuldade: 'FACIL',
    numeroA: 7,
    numeroB: 8,
  };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 56,
    vaiUm: ['1'],
    emprestados: new Set([0]),
    vaiUmMultiplicacao: null,
  });

  assert.equal(requisicao.vaiUm, null);
  assert.equal(requisicao.emprestados, null);
  assert.equal(requisicao.vaiUmMultiplicacao, null);
});

test('aplicarPreferencias aceita multiplicação no nível médio', () => {
  const estado = aplicarPreferencias(
    { operacao: 'SOMA', dificuldade: 'FACIL' },
    '?operacao=MULTIPLICACAO&dificuldade=MEDIO',
  );

  assert.equal(estado.operacao, 'MULTIPLICACAO');
  assert.equal(estado.dificuldade, 'MEDIO');
});
