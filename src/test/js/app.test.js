'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TEMAS_POR_OPERACAO,
  TEMA_OPERACAO_PADRAO,
  temaDaOperacao,
  aplicarTemaOperacao,
  digitosDe,
  quantidadeColunas,
  quantidadeCaixasVaiUm,
  proximaDificuldade,
  niveisDificuldade,
  dificuldadePermitida,
  calcularProgresso,
  resolverProgresso,
  normalizarPasso,
  normalizarPassos,
  normalizarVaiUmMultiplicacao,
  lerVaiUmMultiplicacao,
  ordemFocoMultiplicacao,
  ordemCalculoSoma,
  ordemCasasFinaisSoma,
  ordemFocoSoma,
  proximaColunaResultadoADireita,
  configurarEntradaResultado,
  proximoItemOrdem,
  itemAnteriorOrdem,
  chaveAlvoFoco,
  proximoItemVazioOrdem,
  primeiroItemVazioOrdem,
  preenchidosNaOrdem,
  proximoFocoMultiplicacao,
  focarProximoMultiplicacao,
  focarResultadoPorColuna,
  focarVaiUmPorColuna,
  tratarTeclaResultado,
  tratarTeclaVaiUm,
  tratarTeclaDivisao,
  ORDEM_CAMPOS_DIVISAO_MEDIA,
  ROTULOS_DIVISAO,
  ehDivisaoLonga,
  ehDivisaoMedia,
  ehDivisaoDificil,
  calcularEtapasDivisaoLonga,
  montarModeloDivisaoLonga,
  montarModeloDivisaoDificil,
  modeloDivisaoDaQuestao,
  nomesCamposEtapaDivisao,
  ordemCamposDivisaoDificil,
  comporQuocienteDivisaoEtapas,
  seletorQuocienteDivisaoDificil,
  seletorProdutoDivisaoDificil,
  seletorRestoDivisaoDificil,
  seletorParcialDivisaoDificil,
  alvoDoCampoDivisaoDificil,
  valorEsperadoDivisaoDificil,
  alvoIncorretoDivisaoDificil,
  seletoresDicaDivisaoDificil,
  seletoresDicaAtualDivisaoDificil,
  ORDEM_CAMPOS_DIVISAO_DIFICIL,
  ESTAGIOS_MAXIMOS_DIVISAO,
  etapaDoCampoDivisao,
  alvoApoioDivisao,
  ajustarMultiplicador,
  avaliarMultiploDivisao,
  normalizarDigitoQuociente,
  avaliarEtapaDivisaoMedia,
  proximoNumeroAbaixado,
  descreverApoioDivisao,
  preencherResultadoDivisaoDireita,
  normalizarEntradaResultadoDivisao,
  subtracaoDivisaoConfere,
  comporQuocienteDivisaoMedia,
  proximoCampoDivisao,
  campoAnteriorDivisao,
  calcularVaiUm,
  calcularEmprestimos,
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
  resultadoDezenaMultiplicacao,
  multiplicacaoPrecisaCentena,
  ehMultiplicacaoDificil,
  calcularParcialMultiplicacaoDificil,
  somarParcelasMultiplicacaoDificil,
  ordemFocoMultiplicacaoDificil,
  montarModeloMultiplicacaoDificil,
  colunaZeroFantasmaParcelaUnidade,
  seletoresOperandosDicaMultiplicacaoDificil,
  seletoresCarryDicaMultiplicacaoDificil,
  colunaOrigemDicaMultiplicacaoDificil,
  seletoresDicaMultiplicacaoDificil,
  resolverAlvoDicaMultiplicacaoDificil,
  alvoDoCampoMultiplicacaoDificil,
  seletoresDicaAtualMultiplicacaoDificil,
  ehSomaDificil,
  montarModeloSomaDificil,
  seletoresDicaSomaDificil,
  resolverAlvoDicaSomaDificil,
  alvoDoCampoResultadoSoma,
  valorEsperadoSomaDificil,
  alvoIncorretoSomaDificil,
  seletoresDicaAtualSomaDificil,
  ehSubtracaoDificil,
  ordemFocoSubtracaoDificil,
  montarModeloSubtracaoDificil,
  seletoresDicaSubtracaoDificil,
  resolverAlvoDicaSubtracaoDificil,
  alvoDoCampoResultadoSubtracao,
  valorEsperadoSubtracaoDificil,
  alvoIncorretoSubtracaoDificil,
  seletoresDicaAtualSubtracaoDificil,
  seletoresDicaAtual,
  TEMPO_INATIVIDADE_DICA,
  CLASSE_DICA_CARRY,
  LINHAS_MULTIPLICACAO_DIFICIL,
  tratarTeclaFluxoFoco,
} = require('../../main/resources/static/app.js');

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('temaDaOperacao mapeia cada operação para sua cor temática', () => {
  assert.equal(temaDaOperacao('SOMA'), 'verde');
  assert.equal(temaDaOperacao('SUBTRACAO'), 'azul');
  assert.equal(temaDaOperacao('MULTIPLICACAO'), 'roxo');
  assert.equal(temaDaOperacao('DIVISAO'), 'laranja');
});

test('temaDaOperacao usa o tema verde como padrão para operações desconhecidas', () => {
  assert.equal(temaDaOperacao('DESCONHECIDA'), TEMA_OPERACAO_PADRAO);
  assert.equal(temaDaOperacao(undefined), TEMA_OPERACAO_PADRAO);
  assert.equal(temaDaOperacao(null), TEMA_OPERACAO_PADRAO);
  assert.deepEqual(Object.keys(TEMAS_POR_OPERACAO), [
    'SOMA',
    'SUBTRACAO',
    'MULTIPLICACAO',
    'DIVISAO',
  ]);
});

test('aplicarTemaOperacao grava o tema no data attribute da raiz', () => {
  const raiz = { dataset: {} };

  assert.equal(aplicarTemaOperacao('DIVISAO', raiz), 'laranja');
  assert.equal(raiz.dataset.tema, 'laranja');

  aplicarTemaOperacao('MULTIPLICACAO', raiz);
  assert.equal(raiz.dataset.tema, 'roxo');
});

test('aplicarTemaOperacao não falha quando a raiz não tem dataset', () => {
  assert.equal(aplicarTemaOperacao('SUBTRACAO', {}), 'azul');
  assert.equal(aplicarTemaOperacao('SUBTRACAO', null), 'azul');
});

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
  assert.equal(quantidadeCaixasVaiUm('DIFICIL'), 3);
  assert.throws(() => quantidadeCaixasVaiUm('IMPOSSIVEL'), /Dificuldade inválida/);
});

test('proximaDificuldade percorre os níveis disponíveis e para no topo', () => {
  assert.equal(proximaDificuldade('FACIL'), 'MEDIO');
  assert.equal(proximaDificuldade('MEDIO'), 'DIFICIL');
  assert.equal(proximaDificuldade('DIFICIL'), null);
  assert.equal(proximaDificuldade('MEDIO', 'SUBTRACAO'), 'DIFICIL');
  assert.equal(proximaDificuldade('DIFICIL', 'SUBTRACAO'), null);
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
  const resultado = resolverProgresso(4, 'DIFICIL', true, 5, 'DIVISAO');
  assert.equal(resultado.sequencia, 0);
  assert.equal(resultado.progresso, 1);
  assert.equal(resultado.subiuNivel, false);
  assert.equal(resultado.nivelMaximo, true);
  assert.equal(resultado.dificuldade, 'DIFICIL');
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
  aplicarPreferencias(estado, '?operacao=RADICIACAO&dificuldade=IMPOSSIVEL');
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

test('ordemFocoMultiplicacao no nível fácil mantém unidade e dezena disponíveis', () => {
  assert.deepEqual(ordemFocoMultiplicacao(2, false), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('ordemFocoMultiplicacao no nível médio sem transporte segue para a dezena', () => {
  assert.deepEqual(ordemFocoMultiplicacao(3, false, false), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('ordemFocoMultiplicacao no nível médio coloca o transporte antes da dezena', () => {
  assert.deepEqual(ordemFocoMultiplicacao(3, true, false), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('ordemFocoMultiplicacao no nível médio preenche a centena antes da dezena', () => {
  assert.deepEqual(ordemFocoMultiplicacao(3, false, true), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'resultado', coluna: 1 },
  ]);
  assert.deepEqual(ordemFocoMultiplicacao(3, true, true), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('multiplicacaoPrecisaCentena considera a dezena somada ao transporte', () => {
  assert.equal(resultadoDezenaMultiplicacao(34, 3, 1), 10);
  assert.equal(multiplicacaoPrecisaCentena(34, 3, 1), true);
  assert.equal(resultadoDezenaMultiplicacao(42, 3, 0), 12);
  assert.equal(multiplicacaoPrecisaCentena(42, 3, 0), true);
  assert.equal(resultadoDezenaMultiplicacao(14, 3, 1), 4);
  assert.equal(multiplicacaoPrecisaCentena(14, 3, 1), false);
  assert.equal(multiplicacaoPrecisaCentena(12, 3, 0), false);
});

test('multiplicação fácil mantém o dígito na casa escolhida nas duas direções', () => {
  const criarCampoComEventos = (valor = '') => ({
    value: valor,
    focado: false,
    ouvintes: {},
    focus() {
      this.focado = true;
    },
    addEventListener(tipo, ouvinte) {
      this.ouvintes[tipo] = ouvinte;
    },
  });

  const montarConta = () => {
    const unidade = criarCampoComEventos('');
    const dezena = criarCampoComEventos('');
    const el = {
      conta: contaFalsa({
        '.resultado-input[data-coluna="0"]': unidade,
        '.resultado-input[data-coluna="1"]': dezena,
      }),
    };
    const contexto = {
      el,
      ordemFoco: ordemFocoMultiplicacao(2, false),
      colunas: 2,
      soma: false,
      multiplicacao: true,
      multiplicacaoFlexivel: true,
    };
    configurarEntradaResultado(unidade, 0, contexto);
    configurarEntradaResultado(dezena, 1, contexto);
    const digitar = (campo, valor) => {
      campo.value = valor;
      campo.ouvintes.input();
    };
    return { unidade, dezena, digitar };
  };

  let conta = montarConta();
  conta.digitar(conta.dezena, '2');
  assert.equal(conta.dezena.value, '2');
  assert.equal(conta.unidade.value, '');
  assert.equal(conta.unidade.focado, true);
  conta.digitar(conta.unidade, '4');
  assert.equal(comporResultado([conta.unidade.value, conta.dezena.value]), 24);

  conta = montarConta();
  conta.digitar(conta.unidade, '4');
  assert.equal(conta.unidade.value, '4');
  assert.equal(conta.dezena.value, '');
  assert.equal(conta.dezena.focado, true);
  conta.digitar(conta.dezena, '2');
  assert.equal(comporResultado([conta.unidade.value, conta.dezena.value]), 24);
});

test('proximoFocoMultiplicacao flexível alterna as casas vazias no nível fácil', () => {
  const ordem = ordemFocoMultiplicacao(2, false);
  const unidade = { tipo: 'resultado', coluna: 0 };
  const dezena = { tipo: 'resultado', coluna: 1 };

  assert.deepEqual(
    proximoFocoMultiplicacao(ordem, dezena, ['resultado:1'], true),
    unidade,
  );
  assert.deepEqual(
    proximoFocoMultiplicacao(ordem, unidade, ['resultado:0'], true),
    dezena,
  );
  assert.equal(
    proximoFocoMultiplicacao(ordem, dezena, ['resultado:0', 'resultado:1'], true),
    null,
  );
  assert.equal(
    proximoFocoMultiplicacao(ordem, dezena, ['resultado:1'], false),
    null,
  );
});

test('proximoFocoMultiplicacao no nível médio pula para dezena ou centena', () => {
  const unidade = { tipo: 'resultado', coluna: 0 };
  const vaiUm = { tipo: 'vaiUm', coluna: 1 };
  const dezena = { tipo: 'resultado', coluna: 1 };
  const centena = { tipo: 'resultado', coluna: 2 };

  assert.deepEqual(
    proximoFocoMultiplicacao(
      ordemFocoMultiplicacao(3, false, false),
      unidade,
      ['resultado:0'],
      false,
    ),
    dezena,
  );
  assert.deepEqual(
    proximoFocoMultiplicacao(
      ordemFocoMultiplicacao(3, false, true),
      unidade,
      ['resultado:0'],
      false,
    ),
    centena,
  );
  assert.deepEqual(
    proximoFocoMultiplicacao(
      ordemFocoMultiplicacao(3, true, false),
      vaiUm,
      ['resultado:0', 'vaiUm:1'],
      false,
    ),
    dezena,
  );
});

test('focarProximoMultiplicacao permite começar pela dezena no nível fácil', () => {
  const unidade = campoFalso('');
  const dezena = campoFalso('5');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': unidade,
      '.resultado-input[data-coluna="1"]': dezena,
    }),
  };
  const ordem = ordemFocoMultiplicacao(2, false);

  const focou = focarProximoMultiplicacao(
    el,
    ordem,
    { tipo: 'resultado', coluna: 1 },
    { flexivel: true },
  );

  assert.equal(focou, true);
  assert.equal(unidade.focado, true);
  assert.equal(dezena.focado, false);
});

test('focarProximoMultiplicacao permite começar pela unidade no nível fácil', () => {
  const unidade = campoFalso('7');
  const dezena = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': unidade,
      '.resultado-input[data-coluna="1"]': dezena,
    }),
  };
  const ordem = ordemFocoMultiplicacao(2, false);

  const focou = focarProximoMultiplicacao(
    el,
    ordem,
    { tipo: 'resultado', coluna: 0 },
    { flexivel: true },
  );

  assert.equal(focou, true);
  assert.equal(dezena.focado, true);
});

test('foco da multiplicação média percorre unidade, transporte, centena e dezena', () => {
  const unidade = campoFalso('2');
  const transporte = campoFalso('');
  const dezena = campoFalso('');
  const centena = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': unidade,
      '.caixa-vai-um[data-coluna="1"]': transporte,
      '.resultado-input[data-coluna="1"]': dezena,
      '.resultado-input[data-coluna="2"]': centena,
    }),
  };
  const ordem = ordemFocoMultiplicacao(3, true, true);

  assert.equal(
    focarProximoMultiplicacao(el, ordem, { tipo: 'resultado', coluna: 0 }),
    true,
  );
  assert.equal(transporte.focado, true);

  transporte.value = '1';
  assert.equal(
    focarProximoMultiplicacao(el, ordem, { tipo: 'vaiUm', coluna: 1 }),
    true,
  );
  assert.equal(centena.focado, true);

  centena.value = '1';
  assert.equal(
    focarProximoMultiplicacao(el, ordem, { tipo: 'resultado', coluna: 2 }),
    true,
  );
  assert.equal(dezena.focado, true);

  dezena.value = '0';
  assert.equal(
    focarProximoMultiplicacao(el, ordem, { tipo: 'resultado', coluna: 1 }),
    false,
  );
});

test('ordemFocoSoma começa na unidade e segue para a dezena sem transporte', () => {
  assert.deepEqual(ordemFocoSoma(2, [0, 0]), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('ordemFocoSoma sobe para o vai um e completa as casas finais da esquerda para a direita', () => {
  const passos = calcularVaiUm(98, 35);

  assert.deepEqual(ordemFocoSoma(2, passos), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('ordemCalculoSoma percorre as colunas dos operandos com seus vai um', () => {
  assert.deepEqual(ordemCalculoSoma(2, [1, 1, 0]), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
  ]);
  assert.deepEqual(ordemCalculoSoma(3, [1, 1, 0]), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'vaiUm', coluna: 2 },
  ]);
});

test('ordemCasasFinaisSoma preenche as últimas casas da esquerda para a direita', () => {
  assert.deepEqual(ordemCasasFinaisSoma(2, [1, 1, 0]), [
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'resultado', coluna: 1 },
  ]);
  assert.deepEqual(ordemCasasFinaisSoma(2, [0, 0]), [
    { tipo: 'resultado', coluna: 1 },
  ]);
  assert.deepEqual(ordemCasasFinaisSoma(3, [1, 1, 1, 0]), [
    { tipo: 'resultado', coluna: 3 },
    { tipo: 'resultado', coluna: 2 },
  ]);
  assert.deepEqual(ordemCasasFinaisSoma(3, [1, 1, 0]), [
    { tipo: 'resultado', coluna: 2 },
  ]);
});

test('ordemFocoSoma respeita a geometria dos dois vai uns no nível médio', () => {
  const passos = calcularVaiUm(342, 178);

  assert.deepEqual(ordemFocoSoma(3, passos), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'vaiUm', coluna: 2 },
    { tipo: 'resultado', coluna: 2 },
  ]);
});

test('ordemFocoSoma preenche a casa extra antes da última coluna quando há transporte final', () => {
  const comTransporteFinal = calcularVaiUm(999, 999);
  const semTransporteFinal = calcularVaiUm(342, 178);

  assert.deepEqual(ordemFocoSoma(3, comTransporteFinal), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'vaiUm', coluna: 2 },
    { tipo: 'resultado', coluna: 3 },
    { tipo: 'resultado', coluna: 2 },
  ]);
  assert.deepEqual(ordemFocoSoma(3, semTransporteFinal), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'vaiUm', coluna: 2 },
    { tipo: 'resultado', coluna: 2 },
  ]);
});

test('ordemFocoSoma trata transportes ausentes como zero', () => {
  assert.deepEqual(ordemFocoSoma(2, []), [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
  ]);
});

test('proximaColunaResultadoADireita apoia a digitação da esquerda para a direita', () => {
  assert.equal(proximaColunaResultadoADireita(2, [false, false, true]), 1);
  assert.equal(proximaColunaResultadoADireita(2, [true, false, true]), 1);
  assert.equal(proximaColunaResultadoADireita(2, [false, true, true]), 0);
  assert.equal(proximaColunaResultadoADireita(2, [true, true, true]), null);
  assert.equal(proximaColunaResultadoADireita(0, [true]), null);
  assert.equal(proximaColunaResultadoADireita(3, [false, true, true, true]), 0);
});

test('chaveAlvoFoco identifica cada passo do fluxo', () => {
  assert.equal(chaveAlvoFoco({ tipo: 'resultado', coluna: 0 }), 'resultado:0');
  assert.equal(chaveAlvoFoco({ tipo: 'vaiUm', coluna: 1 }), 'vaiUm:1');
  assert.equal(chaveAlvoFoco(null), null);
});

test('proximoItemVazioOrdem pula casas já preenchidas', () => {
  const ordem = ordemFocoSoma(2, calcularVaiUm(98, 35));
  const unidade = { tipo: 'resultado', coluna: 0 };
  const vaiUm = { tipo: 'vaiUm', coluna: 1 };

  assert.deepEqual(proximoItemVazioOrdem(ordem, unidade, []), vaiUm);
  assert.deepEqual(
    proximoItemVazioOrdem(ordem, unidade, ['vaiUm:1']),
    { tipo: 'resultado', coluna: 2 },
  );
  assert.deepEqual(
    proximoItemVazioOrdem(ordem, unidade, ['vaiUm:1', 'resultado:2']),
    { tipo: 'resultado', coluna: 1 },
  );
  assert.equal(
    proximoItemVazioOrdem(
      ordem,
      unidade,
      ['vaiUm:1', 'resultado:2', 'resultado:1'],
    ),
    null,
  );
});

test('primeiroItemVazioOrdem retoma os passos que faltaram', () => {
  const ordem = ordemFocoSoma(2, calcularVaiUm(98, 35));

  assert.deepEqual(primeiroItemVazioOrdem(ordem, []), {
    tipo: 'resultado',
    coluna: 0,
  });
  assert.deepEqual(
    primeiroItemVazioOrdem(ordem, ['resultado:0']),
    { tipo: 'vaiUm', coluna: 1 },
  );
  assert.equal(
    primeiroItemVazioOrdem(
      ordem,
      ['resultado:0', 'vaiUm:1', 'resultado:2', 'resultado:1'],
    ),
    null,
  );
});

test('proximoItemOrdem e itemAnteriorOrdem percorrem o fluxo sem travar', () => {
  const ordem = ordemFocoSoma(2, calcularVaiUm(98, 35));
  const unidade = { tipo: 'resultado', coluna: 0 };
  const vaiUm = { tipo: 'vaiUm', coluna: 1 };
  const dezena = { tipo: 'resultado', coluna: 1 };
  const centena = { tipo: 'resultado', coluna: 2 };

  assert.deepEqual(proximoItemOrdem(ordem, unidade), vaiUm);
  assert.deepEqual(proximoItemOrdem(ordem, vaiUm), centena);
  assert.deepEqual(proximoItemOrdem(ordem, centena), dezena);
  assert.equal(proximoItemOrdem(ordem, dezena), null);
  assert.deepEqual(itemAnteriorOrdem(ordem, dezena), centena);
  assert.equal(itemAnteriorOrdem(ordem, unidade), null);
  assert.equal(proximoItemOrdem(ordem, { tipo: 'resultado', coluna: 9 }), null);
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

test('aplicarPreferencias aceita divisão', () => {
  const estado = aplicarPreferencias(
    { operacao: 'SOMA', dificuldade: 'MEDIO' },
    '?operacao=DIVISAO&dificuldade=FACIL',
  );

  assert.equal(estado.operacao, 'DIVISAO');
  assert.equal(estado.dificuldade, 'FACIL');
});

test('aplicarPreferencias aceita a divisão difícil', () => {
  const estado = aplicarPreferencias(
    { operacao: 'SOMA', dificuldade: 'MEDIO' },
    '?operacao=DIVISAO&dificuldade=DIFICIL',
  );

  assert.equal(estado.operacao, 'DIVISAO');
  assert.equal(estado.dificuldade, 'DIFICIL');
});

test('proximoCampoDivisao segue quociente, subtração e resto', () => {
  assert.equal(proximoCampoDivisao('quociente'), 'subtracao');
  assert.equal(proximoCampoDivisao('subtracao'), 'resto');
  assert.equal(proximoCampoDivisao('resto'), null);
  assert.equal(proximoCampoDivisao('desconhecido'), null);
});

test('campoAnteriorDivisao volta do resto para o quociente', () => {
  assert.equal(campoAnteriorDivisao('quociente'), null);
  assert.equal(campoAnteriorDivisao('subtracao'), 'quociente');
  assert.equal(campoAnteriorDivisao('resto'), 'subtracao');
  assert.equal(campoAnteriorDivisao('desconhecido'), null);
});

test('montarRequisicao envia quociente, subtração e resto da divisão', () => {
  const questao = {
    id: 'id-div',
    operacao: 'DIVISAO',
    numeroA: 36,
    numeroB: 4,
  };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 9,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: null,
    subtracaoDigitada: 36,
    restoDigitado: 0,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-div',
    operacao: 'DIVISAO',
    numeroA: 36,
    numeroB: 4,
    resultadoDigitado: 9,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: null,
    subtracaoDigitada: 36,
    restoDigitado: 0,
  });
});

test('montarRequisicao não envia campos de divisão nas outras operações', () => {
  const questao = { id: 'id-soma', operacao: 'SOMA', numeroA: 38, numeroB: 25 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 63,
    vaiUm: [1, 0],
    emprestados: null,
    vaiUmMultiplicacao: null,
  });

  assert.equal('subtracaoDigitada' in requisicao, false);
  assert.equal('restoDigitado' in requisicao, false);
});

test('os rótulos da divisão nomeiam os termos matemáticos da lousa', () => {
  assert.deepEqual(ROTULOS_DIVISAO, {
    dividendo: 'DIVIDENDO',
    divisor: 'DIVISOR',
    quociente: 'QUOCIENTE',
    resto: 'RESTO',
  });
});

test('a ordem guiada da divisão média segue quociente, subtração e descida', () => {
  assert.deepEqual(ORDEM_CAMPOS_DIVISAO_MEDIA, [
    'quocienteParcial',
    'restoParcial',
    'quocienteFinal',
    'restoFinal',
  ]);
  assert.equal(
    proximoCampoDivisao('quocienteParcial', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'restoParcial',
  );
  assert.equal(
    proximoCampoDivisao('restoParcial', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'quocienteFinal',
  );
  assert.equal(
    proximoCampoDivisao('quocienteFinal', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'restoFinal',
  );
  assert.equal(
    proximoCampoDivisao('restoFinal', ORDEM_CAMPOS_DIVISAO_MEDIA),
    null,
  );
  assert.equal(
    campoAnteriorDivisao('restoParcial', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'quocienteParcial',
  );
  assert.equal(
    campoAnteriorDivisao('quocienteFinal', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'restoParcial',
  );
  assert.equal(
    campoAnteriorDivisao('restoFinal', ORDEM_CAMPOS_DIVISAO_MEDIA),
    'quocienteFinal',
  );
  assert.equal(
    campoAnteriorDivisao('quocienteParcial', ORDEM_CAMPOS_DIVISAO_MEDIA),
    null,
  );
});

test('etapaDoCampoDivisao associa cada campo à sua etapa', () => {
  assert.equal(etapaDoCampoDivisao('quocienteParcial'), 1);
  assert.equal(etapaDoCampoDivisao('subtracaoParcial'), 1);
  assert.equal(etapaDoCampoDivisao('restoParcial'), 1);
  assert.equal(etapaDoCampoDivisao('quocienteFinal'), 2);
  assert.equal(etapaDoCampoDivisao('subtracaoFinal'), 2);
  assert.equal(etapaDoCampoDivisao('restoFinal'), 2);
  assert.equal(etapaDoCampoDivisao('quociente'), null);
});

test('alvoApoioDivisao usa os alvos de cada etapa da divisão média', () => {
  const questao = { dividendoParcial: 79, dividendoAbaixado: 113 };

  assert.equal(alvoApoioDivisao(questao, 1), 79);
  assert.equal(alvoApoioDivisao(questao, 2), 113);
  assert.equal(alvoApoioDivisao(null, 1), 0);
  assert.equal(alvoApoioDivisao({}, 2), 0);
});

test('ajustarMultiplicador soma o passo e respeita os limites de 0 a 9', () => {
  assert.equal(ajustarMultiplicador(4, 1), 5);
  assert.equal(ajustarMultiplicador(4, -1), 3);
  assert.equal(ajustarMultiplicador(9, 1), 9);
  assert.equal(ajustarMultiplicador(0, -1), 0);
  assert.equal(ajustarMultiplicador('4', '2'), 6);
  assert.equal(ajustarMultiplicador(5, 10, 1, 7), 7);
});

test('avaliarMultiploDivisao indica quando o produto fica abaixo do alvo', () => {
  const avaliacao = avaliarMultiploDivisao(17, 4, 79);

  assert.equal(avaliacao.produto, 68);
  assert.equal(avaliacao.comparacao, 'abaixo');
  assert.equal(avaliacao.excedeu, false);
  assert.equal(avaliacao.expressao, '17 × 4 = 68');
  assert.match(avaliacao.texto, /falta 11/);
});

test('avaliarMultiploDivisao marca em vermelho quando o produto passa do alvo', () => {
  const avaliacao = avaliarMultiploDivisao(17, 5, 79);

  assert.equal(avaliacao.produto, 85);
  assert.equal(avaliacao.comparacao, 'acima');
  assert.equal(avaliacao.excedeu, true);
  assert.equal(avaliacao.expressao, '17 × 5 = 85');
  assert.match(avaliacao.texto, /passou de 79/);
});

test('avaliarMultiploDivisao reconhece quando o produto é exatamente o alvo', () => {
  const avaliacao = avaliarMultiploDivisao(17, 0, 0);

  assert.equal(avaliacao.produto, 0);
  assert.equal(avaliacao.comparacao, 'igual');
  assert.equal(avaliacao.excedeu, false);
  assert.match(avaliacao.texto, /é o alvo/);
});

test('normalizarDigitoQuociente aceita apenas um dígito de 0 a 9', () => {
  assert.equal(normalizarDigitoQuociente('4'), 4);
  assert.equal(normalizarDigitoQuociente(0), 0);
  assert.equal(normalizarDigitoQuociente('9'), 9);
  assert.equal(normalizarDigitoQuociente(''), null);
  assert.equal(normalizarDigitoQuociente('10'), null);
  assert.equal(normalizarDigitoQuociente('x'), null);
  assert.equal(normalizarDigitoQuociente(null), null);
});

test('avaliarEtapaDivisaoMedia preenche o produto e valida contra o alvo', () => {
  const valido = avaliarEtapaDivisaoMedia(17, 4, 79);
  assert.equal(valido.digito, 4);
  assert.equal(valido.produto, 68);
  assert.equal(valido.alvo, 79);
  assert.equal(valido.resto, 11);
  assert.equal(valido.status, 'valido');
  assert.equal(valido.valido, true);
  assert.equal(valido.excedeu, false);

  const invalido = avaliarEtapaDivisaoMedia(17, 5, 79);
  assert.equal(invalido.produto, 85);
  assert.equal(invalido.resto, null);
  assert.equal(invalido.status, 'invalido');
  assert.equal(invalido.valido, false);
  assert.equal(invalido.excedeu, true);

  const neutro = avaliarEtapaDivisaoMedia(17, '', 79);
  assert.equal(neutro.produto, null);
  assert.equal(neutro.resto, null);
  assert.equal(neutro.status, 'neutro');
  assert.equal(neutro.valido, false);
});

test('avaliarEtapaDivisaoMedia considera o alvo após descer o próximo dígito', () => {
  const avaliacao = avaliarEtapaDivisaoMedia(17, 6, 113);

  assert.equal(avaliacao.produto, 102);
  assert.equal(avaliacao.resto, 11);
  assert.equal(avaliacao.status, 'valido');
});

test('descreverApoioDivisao sincroniza expressão e cores com o quociente', () => {
  const valido = descreverApoioDivisao(17, '4', 79);
  assert.equal(valido.expressao, '17 × 4 = 68');
  assert.equal(valido.correto, true);
  assert.equal(valido.excedeu, false);

  const excedeu = descreverApoioDivisao(17, '5', 79);
  assert.equal(excedeu.expressao, '17 × 5 = 85');
  assert.equal(excedeu.correto, false);
  assert.equal(excedeu.excedeu, true);

  const neutro = descreverApoioDivisao(17, '', 79);
  assert.equal(neutro.expressao, '17 × · = ·');
  assert.equal(neutro.correto, false);
  assert.equal(neutro.excedeu, false);

  const segundaEtapa = descreverApoioDivisao(17, '6', 113, 2);
  assert.equal(segundaEtapa.etapa, 2);
  assert.equal(segundaEtapa.expressao, '17 × 6 = 102');
  assert.equal(segundaEtapa.correto, true);
});

test('proximoNumeroAbaixado anexa o dígito do dividendo ao resto', () => {
  assert.equal(proximoNumeroAbaixado(11, 3), 113);
  assert.equal(proximoNumeroAbaixado(7, 3), 73);
  assert.equal(proximoNumeroAbaixado(0, 3), 3);
});

test('preencherResultadoDivisaoDireita completa a unidade antes da dezena', () => {
  assert.equal(preencherResultadoDivisaoDireita('', '8', 2), '8');
  assert.equal(preencherResultadoDivisaoDireita('8', '1', 2), '18');
  assert.equal(preencherResultadoDivisaoDireita('', '0', 2), '0');
  assert.equal(preencherResultadoDivisaoDireita('0', '1', 2), '10');
  assert.equal(preencherResultadoDivisaoDireita('18', '5', 2), '18');
  assert.equal(preencherResultadoDivisaoDireita('8', '12', 2), '12');
  assert.equal(preencherResultadoDivisaoDireita('7', 'x', 2), '7');
  assert.equal(preencherResultadoDivisaoDireita(null, '4', 1), '4');
});

test('normalizarEntradaResultadoDivisao remonta dígitos digitados pela unidade', () => {
  assert.equal(normalizarEntradaResultadoDivisao('', '8', '8', 'insertText', 2), '8');
  assert.equal(normalizarEntradaResultadoDivisao('8', '81', '1', 'insertText', 2), '18');
  assert.equal(normalizarEntradaResultadoDivisao('', '18', '18', 'insertFromPaste', 2), '18');
  assert.equal(normalizarEntradaResultadoDivisao('', '11', undefined, '', 2), '11');
  assert.equal(normalizarEntradaResultadoDivisao('18', '1', null, 'deleteContentBackward', 2), '1');
  assert.equal(normalizarEntradaResultadoDivisao('18', '81', '2', 'insertText', 2), '18');
});

test('subtracaoDivisaoConfere valida o resultado digitado em cada etapa', () => {
  assert.equal(subtracaoDivisaoConfere('11', 79, 68), true);
  assert.equal(subtracaoDivisaoConfere(11, 79, 68), true);
  assert.equal(subtracaoDivisaoConfere('12', 79, 68), false);
  assert.equal(subtracaoDivisaoConfere('', 79, 68), false);
  assert.equal(subtracaoDivisaoConfere('28', 79, 51), true);
  assert.equal(subtracaoDivisaoConfere('5', 73, 68), true);
});

test('comporQuocienteDivisaoMedia junta os dois dígitos do quociente', () => {
  assert.equal(comporQuocienteDivisaoMedia(4, 6), 46);
  assert.equal(comporQuocienteDivisaoMedia(1, 0), 10);
  assert.equal(comporQuocienteDivisaoMedia(null, 6), null);
  assert.equal(comporQuocienteDivisaoMedia(4, null), null);
  assert.equal(comporQuocienteDivisaoMedia(4.5, 6), null);
});

test('ehDivisaoLonga identifica divisões de três e quatro dígitos por dois dígitos', () => {
  assert.equal(ehDivisaoLonga({ operacao: 'DIVISAO', numeroA: 793, numeroB: 17 }), true);
  assert.equal(ehDivisaoLonga({ operacao: 'DIVISAO', numeroA: 6898, numeroB: 15 }), true);
  assert.equal(ehDivisaoLonga({ operacao: 'DIVISAO', numeroA: 36, numeroB: 4 }), false);
  assert.equal(ehDivisaoLonga({ operacao: 'DIVISAO', numeroA: 105, numeroB: 99 }), false);
  assert.equal(ehDivisaoLonga({ operacao: 'SOMA', numeroA: 793, numeroB: 17 }), false);
  assert.equal(ehDivisaoLonga(null), false);
});

test('ehDivisaoMedia exige a operação de divisão no nível médio', () => {
  assert.equal(ehDivisaoMedia({ operacao: 'DIVISAO', dificuldade: 'MEDIO' }), true);
  assert.equal(ehDivisaoMedia({ operacao: 'DIVISAO', dificuldade: 'FACIL' }), false);
  assert.equal(ehDivisaoMedia({ operacao: 'SOMA', dificuldade: 'MEDIO' }), false);
  assert.equal(ehDivisaoMedia(null), false);
});

test('ehDivisaoDificil exige a operação de divisão no nível difícil', () => {
  assert.equal(ehDivisaoDificil({ operacao: 'DIVISAO', dificuldade: 'DIFICIL' }), true);
  assert.equal(ehDivisaoDificil({ operacao: 'DIVISAO', dificuldade: 'MEDIO' }), false);
  assert.equal(ehDivisaoDificil({ operacao: 'SOMA', dificuldade: 'DIFICIL' }), false);
  assert.equal(ehDivisaoDificil(null), false);
});

test('calcularEtapasDivisaoLonga monta as três etapas de 6898 por 15', () => {
  assert.deepEqual(calcularEtapasDivisaoLonga(6898, 15), [
    {
      indice: 1,
      dividendoParcial: 68,
      quociente: 4,
      subtracao: 60,
      resto: 8,
      dividendoAbaixado: 89,
      digitos: 2,
    },
    {
      indice: 2,
      dividendoParcial: 89,
      quociente: 5,
      subtracao: 75,
      resto: 14,
      dividendoAbaixado: 148,
      digitos: 2,
    },
    {
      indice: 3,
      dividendoParcial: 148,
      quociente: 9,
      subtracao: 135,
      resto: 13,
      dividendoAbaixado: null,
      digitos: 3,
    },
  ]);
  assert.deepEqual(calcularEtapasDivisaoLonga(0, 15), []);
  assert.deepEqual(calcularEtapasDivisaoLonga(100, 0), []);
});

test('calcularEtapasDivisaoLonga produz duas etapas quando o divisor cabe nos três primeiros dígitos', () => {
  const etapas = calcularEtapasDivisaoLonga(1234, 56);

  assert.equal(etapas.length, 2);
  assert.equal(etapas[0].dividendoParcial, 123);
  assert.equal(etapas[0].dividendoAbaixado, 114);
  assert.equal(etapas[1].dividendoParcial, 114);
  assert.equal(etapas[1].resto, 2);
});

test('montarModeloDivisaoDificil expõe a etapa intermediária e a ordem de foco', () => {
  const modelo = montarModeloDivisaoDificil(6898, 15);

  assert.equal(modelo.quociente, 459);
  assert.equal(modelo.resto, 13);
  assert.equal(modelo.quocienteIntermediario, 5);
  assert.equal(modelo.subtracaoIntermediaria, 75);
  assert.equal(modelo.restoIntermediario, 14);
  assert.equal(modelo.dividendoAbaixadoFinal, 148);
  assert.equal(modelo.quocienteFinal, 9);
  assert.equal(modelo.subtracaoFinal, 135);
  assert.deepEqual(modelo.ordemFoco, [
    { tipo: 'quociente', etapa: 1 },
    { tipo: 'resto', etapa: 1 },
    { tipo: 'quociente', etapa: 2 },
    { tipo: 'resto', etapa: 2 },
    { tipo: 'quociente', etapa: 3 },
    { tipo: 'resto', etapa: 3 },
  ]);
});

test('modeloDivisaoDaQuestao usa os números da questão de divisão', () => {
  const modelo = modeloDivisaoDaQuestao({
    operacao: 'DIVISAO',
    numeroA: 6898,
    numeroB: 15,
  });

  assert.equal(modelo.quociente, 459);
  assert.equal(modelo.etapas.length, 3);
  assert.equal(modeloDivisaoDaQuestao({ operacao: 'SOMA', numeroA: 2, numeroB: 3 }), null);
});

test('nomesCamposEtapaDivisao distribui início, intermediária e etapa final', () => {
  assert.deepEqual(nomesCamposEtapaDivisao(1, 3), {
    quociente: 'quocienteParcial',
    subtracao: 'subtracaoParcial',
    resto: 'restoParcial',
  });
  assert.deepEqual(nomesCamposEtapaDivisao(2, 3), {
    quociente: 'quocienteIntermediario',
    subtracao: 'subtracaoIntermediaria',
    resto: 'restoIntermediario',
  });
  assert.deepEqual(nomesCamposEtapaDivisao(3, 3), {
    quociente: 'quocienteFinal',
    subtracao: 'subtracaoFinal',
    resto: 'restoFinal',
  });
  assert.deepEqual(nomesCamposEtapaDivisao(2, 2), {
    quociente: 'quocienteFinal',
    subtracao: 'subtracaoFinal',
    resto: 'restoFinal',
  });
});

test('ordemCamposDivisaoDificil respeita a quantidade de etapas', () => {
  assert.deepEqual(ordemCamposDivisaoDificil(2), [
    'quocienteParcial',
    'restoParcial',
    'quocienteFinal',
    'restoFinal',
  ]);
  assert.deepEqual(ordemCamposDivisaoDificil(3), ORDEM_CAMPOS_DIVISAO_DIFICIL);
  assert.equal(ESTAGIOS_MAXIMOS_DIVISAO, 3);
});

test('comporQuocienteDivisaoEtapas compõe os dígitos das etapas', () => {
  assert.equal(comporQuocienteDivisaoEtapas([4, 5, 9]), 459);
  assert.equal(comporQuocienteDivisaoEtapas(['4', '5', '9']), 459);
  assert.equal(comporQuocienteDivisaoEtapas([]), null);
  assert.equal(comporQuocienteDivisaoEtapas([4, 10, 9]), null);
  assert.equal(comporQuocienteDivisaoEtapas(null), null);
});

test('alvoDoCampoDivisaoDificil lê o tipo e a etapa do campo', () => {
  assert.deepEqual(
    alvoDoCampoDivisaoDificil({ dataset: { tipo: 'quociente', etapa: '2' } }),
    { tipo: 'quociente', etapa: 2 },
  );
  assert.deepEqual(
    alvoDoCampoDivisaoDificil({ dataset: { tipo: 'resto', etapa: '3' } }),
    { tipo: 'resto', etapa: 3 },
  );
  assert.equal(alvoDoCampoDivisaoDificil({ dataset: { tipo: 'outro', etapa: '1' } }), null);
  assert.equal(alvoDoCampoDivisaoDificil({ dataset: { tipo: 'resto', etapa: '0' } }), null);
  assert.equal(alvoDoCampoDivisaoDificil(null), null);
});

test('valorEsperadoDivisaoDificil devolve o valor da etapa e do tipo', () => {
  const modelo = montarModeloDivisaoDificil(6898, 15);

  assert.equal(valorEsperadoDivisaoDificil(modelo, { tipo: 'quociente', etapa: 2 }), 5);
  assert.equal(valorEsperadoDivisaoDificil(modelo, { tipo: 'subtracao', etapa: 3 }), 135);
  assert.equal(valorEsperadoDivisaoDificil(modelo, { tipo: 'resto', etapa: 1 }), 8);
  assert.equal(valorEsperadoDivisaoDificil(modelo, { tipo: 'resto', etapa: 99 }), 13);
  assert.equal(valorEsperadoDivisaoDificil(null, { tipo: 'resto', etapa: 1 }), null);
});

test('seletoresDicaDivisaoDificil aponta para o parcial e o campo da etapa', () => {
  const modelo = montarModeloDivisaoDificil(6898, 15);

  assert.deepEqual(seletoresDicaDivisaoDificil(modelo, { tipo: 'quociente', etapa: 2 }), [
    seletorParcialDivisaoDificil(2),
    seletorQuocienteDivisaoDificil(2),
  ]);
  assert.deepEqual(seletoresDicaDivisaoDificil(modelo, { tipo: 'subtracao', etapa: 3 }), [
    seletorParcialDivisaoDificil(3),
    seletorProdutoDivisaoDificil(3),
    seletorRestoDivisaoDificil(3),
  ]);
  assert.deepEqual(seletoresDicaDivisaoDificil(modelo, { tipo: 'resto', etapa: 1 }), [
    seletorParcialDivisaoDificil(1),
    seletorRestoDivisaoDificil(1),
  ]);
  assert.deepEqual(seletoresDicaDivisaoDificil(null, { tipo: 'resto', etapa: 1 }), []);
});

test('alvoIncorretoDivisaoDificil prioriza o primeiro resto preenchido errado', () => {
  const modelo = montarModeloDivisaoDificil(6898, 15);
  const el = {
    conta: contaFalsa({
      [seletorQuocienteDivisaoDificil(1)]: { value: '4' },
      [seletorRestoDivisaoDificil(1)]: { value: '9', disabled: false },
    }),
  };

  assert.deepEqual(alvoIncorretoDivisaoDificil(modelo, el), { tipo: 'resto', etapa: 1 });
  assert.equal(alvoIncorretoDivisaoDificil(null, el), null);
});

test('seletoresDicaAtualDivisaoDificil usa a fase e a etapa em andamento', () => {
  const modelo = montarModeloDivisaoDificil(6898, 15);
  const estado = {
    questao: { operacao: 'DIVISAO', dificuldade: 'DIFICIL', numeroA: 6898, numeroB: 15 },
    divisaoDificil: { ...modelo, etapa: 2, fase: 'resto' },
  };

  assert.deepEqual(seletoresDicaAtualDivisaoDificil(estado, { conta: {} }), [
    seletorParcialDivisaoDificil(2),
    seletorRestoDivisaoDificil(2),
  ]);
  assert.deepEqual(seletoresDicaAtualDivisaoDificil({
    questao: { operacao: 'DIVISAO', dificuldade: 'MEDIO' },
  }, { conta: {} }), []);
  assert.deepEqual(seletoresDicaAtualDivisaoDificil(estado, null), []);
});

test('montarRequisicao envia todas as etapas da divisão média', () => {
  const questao = {
    id: 'id-div-media',
    operacao: 'DIVISAO',
    dificuldade: 'MEDIO',
    numeroA: 793,
    numeroB: 17,
  };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 46,
    quocienteParcialDigitado: 4,
    subtracaoParcialDigitada: 68,
    restoParcialDigitado: 11,
    quocienteFinalDigitado: 6,
    subtracaoFinalDigitada: 102,
    restoDigitado: 11,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-div-media',
    operacao: 'DIVISAO',
    numeroA: 793,
    numeroB: 17,
    resultadoDigitado: 46,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: null,
    subtracaoDigitada: null,
    restoDigitado: 11,
    quocienteParcialDigitado: 4,
    subtracaoParcialDigitada: 68,
    restoParcialDigitado: 11,
    quocienteFinalDigitado: 6,
    subtracaoFinalDigitada: 102,
  });
});

test('montarRequisicao envia as listas de etapas da divisão difícil', () => {
  const questao = {
    id: 'id-div-dificil',
    operacao: 'DIVISAO',
    dificuldade: 'DIFICIL',
    numeroA: 6898,
    numeroB: 15,
  };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 459,
    quocientesParciaisDigitados: [4, 5, 9],
    subtracoesParciaisDigitadas: [60, 75, 135],
    restosParciaisDigitados: [8, 14, 13],
    restoDigitado: 13,
  });

  assert.deepEqual(requisicao, {
    idQuestao: 'id-div-dificil',
    operacao: 'DIVISAO',
    numeroA: 6898,
    numeroB: 15,
    resultadoDigitado: 459,
    vaiUm: null,
    emprestados: null,
    vaiUmMultiplicacao: null,
    subtracaoDigitada: null,
    restoDigitado: 13,
    quocientesParciaisDigitados: [4, 5, 9],
    subtracoesParciaisDigitadas: [60, 75, 135],
    restosParciaisDigitados: [8, 14, 13],
  });
  assert.equal('quocienteParcialDigitado' in requisicao, false);
  assert.equal('quocienteIntermediarioDigitado' in requisicao, false);
  assert.equal('quocienteFinalDigitado' in requisicao, false);
});

test('montarRequisicao não envia etapas médias na divisão fácil', () => {
  const questao = { id: 'id-div-facil', operacao: 'DIVISAO', numeroA: 36, numeroB: 4 };
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado: 9,
    subtracaoDigitada: 36,
    restoDigitado: 0,
  });

  assert.equal('quocienteParcialDigitado' in requisicao, false);
  assert.equal('subtracaoParcialDigitada' in requisicao, false);
  assert.equal('restoParcialDigitado' in requisicao, false);
  assert.equal('quocienteFinalDigitado' in requisicao, false);
  assert.equal('subtracaoFinalDigitada' in requisicao, false);
});

function campoFalso(valor = '') {
  return {
    value: valor,
    focado: false,
    focus() {
      this.focado = true;
    },
  };
}

function contaFalsa(mapa) {
  return {
    querySelector(seletor) {
      return Object.prototype.hasOwnProperty.call(mapa, seletor) ? mapa[seletor] : null;
    },
  };
}

test('focarResultadoPorColuna e focarVaiUmPorColuna focam o campo da coluna', () => {
  const resultado = campoFalso();
  const vaiUm = campoFalso();
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="2"]': resultado,
      '.caixa-vai-um[data-coluna="1"]': vaiUm,
    }),
  };

  assert.equal(focarResultadoPorColuna(el, 2), true);
  assert.equal(resultado.focado, true);
  assert.equal(focarVaiUmPorColuna(el, 1), true);
  assert.equal(vaiUm.focado, true);
  assert.equal(focarResultadoPorColuna(el, 9), false);
  assert.equal(focarResultadoPorColuna(null, 0), false);
});

test('preenchidosNaOrdem marca apenas os passos com valor preenchido', () => {
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': campoFalso('5'),
      '.caixa-vai-um[data-coluna="1"]': campoFalso('   '),
      '.resultado-input[data-coluna="1"]': campoFalso(' 7 '),
    }),
  };
  const ordem = ordemFocoSoma(2, [1, 0]);

  assert.deepEqual(Array.from(preenchidosNaOrdem(el, ordem)), [
    'resultado:0',
    'resultado:1',
  ]);
});

test('tratarTeclaResultado volta um passo do fluxo no Backspace vazio', () => {
  const unidade = campoFalso('');
  const dezena = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': unidade,
      '.resultado-input[data-coluna="1"]': dezena,
    }),
  };
  const ordem = ordemFocoSoma(2, [0, 0]);

  const tratado = tratarTeclaResultado(
    { key: 'Backspace', preventDefault() {} },
    { el, ordemFoco: ordem, indice: 1, colunas: 2, usarOrdemFoco: true, campo: dezena },
  );

  assert.equal(tratado, true);
  assert.equal(unidade.focado, true);
});

test('tratarTeclaResultado usa a coluna da esquerda sem fluxo no Backspace vazio', () => {
  const coluna0 = campoFalso('');
  const coluna1 = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': coluna0,
      '.resultado-input[data-coluna="1"]': coluna1,
    }),
  };

  const tratado = tratarTeclaResultado(
    { key: 'Backspace', preventDefault() {} },
    { el, ordemFoco: [], indice: 1, colunas: 2, usarOrdemFoco: false, campo: coluna1 },
  );

  assert.equal(tratado, true);
  assert.equal(coluna0.focado, true);
});

test('tratarTeclaResultado navega com as setas entre as colunas', () => {
  const coluna0 = campoFalso('1');
  const coluna1 = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': coluna0,
      '.resultado-input[data-coluna="1"]': coluna1,
    }),
  };
  let prevencoes = 0;
  const preventDefault = () => {
    prevencoes += 1;
  };

  const esquerda = tratarTeclaResultado(
    { key: 'ArrowLeft', preventDefault },
    { el, ordemFoco: [], indice: 0, colunas: 2, usarOrdemFoco: false, campo: coluna0 },
  );
  assert.equal(esquerda, true);
  assert.equal(coluna1.focado, true);
  assert.equal(prevencoes, 1);

  const direita = tratarTeclaResultado(
    { key: 'ArrowRight', preventDefault },
    { el, ordemFoco: [], indice: 1, colunas: 2, usarOrdemFoco: false, campo: coluna1 },
  );
  assert.equal(direita, true);
  assert.equal(coluna0.focado, true);
  assert.equal(prevencoes, 2);
});

test('tratarTeclaResultado ignora teclas que não são de navegação', () => {
  const tratado = tratarTeclaResultado(
    { key: 'Enter', preventDefault() {} },
    { el: null, ordemFoco: [], indice: 0, colunas: 1, usarOrdemFoco: false, campo: campoFalso() },
  );

  assert.equal(tratado, false);
});

test('tratarTeclaVaiUm volta ao passo anterior do fluxo no Backspace vazio', () => {
  const resultado = campoFalso('4');
  const caixa = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="0"]': resultado,
      '.caixa-vai-um[data-coluna="1"]': caixa,
    }),
  };
  const ordem = ordemFocoSoma(2, calcularVaiUm(98, 35));

  assert.equal(
    tratarTeclaVaiUm({ key: 'Backspace' }, { el, ordemFoco: ordem, indice: 1, caixa }),
    true,
  );
  assert.equal(resultado.focado, true);

  caixa.value = '1';
  resultado.focado = false;
  assert.equal(
    tratarTeclaVaiUm({ key: 'Backspace' }, { el, ordemFoco: ordem, indice: 1, caixa }),
    false,
  );
});

test('tratarTeclaDivisao volta no Backspace vazio e confirma no Enter', () => {
  const campo = campoFalso('');
  let anteriores = 0;
  let confirmacoes = 0;
  const opcoes = {
    campo,
    aoFocarAnterior: () => {
      anteriores += 1;
    },
    aoConfirmar: () => {
      confirmacoes += 1;
    },
  };

  assert.equal(tratarTeclaDivisao({ key: 'Backspace' }, opcoes), true);
  assert.equal(anteriores, 1);

  let prevenido = false;
  assert.equal(
    tratarTeclaDivisao({ key: 'Enter', preventDefault() { prevenido = true; } }, opcoes),
    true,
  );
  assert.equal(prevenido, true);
  assert.equal(confirmacoes, 1);

  campo.value = '3';
  assert.equal(tratarTeclaDivisao({ key: 'Backspace' }, opcoes), false);
  assert.equal(anteriores, 1);
});

test('o nível difícil fica disponível em todas as operações', () => {
  assert.deepEqual(niveisDificuldade('MULTIPLICACAO'), ['FACIL', 'MEDIO', 'DIFICIL']);
  assert.deepEqual(niveisDificuldade('SOMA'), ['FACIL', 'MEDIO', 'DIFICIL']);
  assert.deepEqual(niveisDificuldade('SUBTRACAO'), ['FACIL', 'MEDIO', 'DIFICIL']);
  assert.deepEqual(niveisDificuldade('DIVISAO'), ['FACIL', 'MEDIO', 'DIFICIL']);
  assert.equal(dificuldadePermitida('DIFICIL', 'SOMA'), 'DIFICIL');
  assert.equal(dificuldadePermitida('DIFICIL', 'MULTIPLICACAO'), 'DIFICIL');
  assert.equal(dificuldadePermitida('DIFICIL', 'SUBTRACAO'), 'DIFICIL');
  assert.equal(dificuldadePermitida('DIFICIL', 'DIVISAO'), 'DIFICIL');
  assert.equal(proximaDificuldade('MEDIO', 'SOMA'), 'DIFICIL');
  assert.equal(proximaDificuldade('MEDIO', 'MULTIPLICACAO'), 'DIFICIL');
  assert.equal(proximaDificuldade('MEDIO', 'SUBTRACAO'), 'DIFICIL');
  assert.equal(proximaDificuldade('MEDIO', 'DIVISAO'), 'DIFICIL');
  assert.equal(proximaDificuldade('DIFICIL', 'SOMA'), null);
});

test('resolverProgresso sobe para o difícil na soma e na multiplicação', () => {
  const multiplicacao = resolverProgresso(4, 'MEDIO', true, 5, 'MULTIPLICACAO');
  assert.equal(multiplicacao.dificuldade, 'DIFICIL');
  assert.equal(multiplicacao.subiuNivel, true);

  const soma = resolverProgresso(4, 'MEDIO', true, 5, 'SOMA');
  assert.equal(soma.dificuldade, 'DIFICIL');
  assert.equal(soma.subiuNivel, true);

  const somaMaxima = resolverProgresso(4, 'DIFICIL', true, 5, 'SOMA');
  assert.equal(somaMaxima.dificuldade, 'DIFICIL');
  assert.equal(somaMaxima.nivelMaximo, true);
});

test('multiplicação difícil usa três dígitos no multiplicando e dois no multiplicador', () => {
  assert.equal(quantidadeColunas('DIFICIL', 'MULTIPLICACAO'), 5);
  assert.equal(digitosDosOperandos('DIFICIL', 'MULTIPLICACAO'), 3);
  assert.equal(digitosDoMultiplicador('DIFICIL', 'MULTIPLICACAO'), 2);
  assert.equal(digitosDoMultiplicador('MEDIO', 'MULTIPLICACAO'), 1);
});

test('calcularParcialMultiplicacaoDificil separa produto e transporte da unidade', () => {
  const parcial = calcularParcialMultiplicacaoDificil(327, 5);

  assert.deepEqual(parcial.digitos, [5, 3, 6, 1]);
  assert.deepEqual(parcial.carries, { 1: 3, 2: 1 });
  assert.equal(parcial.carryFinal, 1);
});

test('somarParcelasMultiplicacaoDificil reproduz a soma final coluna a coluna', () => {
  const soma = somarParcelasMultiplicacaoDificil(1635, 3270, 4);

  assert.deepEqual(soma.digitos, [5, 0, 9, 4]);
  assert.deepEqual(soma.carries, { 2: 1 });
});

test('montarModeloMultiplicacaoDificil monta as duas linhas e a soma de 327 × 15', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.equal(modelo.colunas, 4);
  assert.deepEqual(modelo.digitosA, [7, 2, 3]);
  assert.deepEqual(modelo.digitosB, [5, 1]);
  assert.deepEqual(modelo.digitosUnidade, [5, 3, 6, 1]);
  assert.deepEqual(modelo.carriesUnidade, { 1: 3, 2: 1 });
  assert.deepEqual(modelo.digitosDezena, [null, 7, 2, 3]);
  assert.deepEqual(modelo.carriesDezena, {});
  assert.deepEqual(modelo.digitosSoma, [5, 0, 9, 4]);
  assert.deepEqual(modelo.carriesSoma, { 2: 1 });
  assert.equal(modelo.produtoUnidade, 1635);
  assert.equal(modelo.produtoDezena, 3270);
  assert.equal(modelo.resultado, 4905);
  assert.equal(ehMultiplicacaoDificil({ operacao: 'MULTIPLICACAO', dificuldade: 'DIFICIL' }), true);
  assert.equal(ehMultiplicacaoDificil({ operacao: 'MULTIPLICACAO', dificuldade: 'MEDIO' }), false);
});

test('colunaZeroFantasmaParcelaUnidade cobre a casa vazia à esquerda da primeira parcial', () => {
  const comSobra = montarModeloMultiplicacaoDificil(327, 95);
  const semSobra = montarModeloMultiplicacaoDificil(327, 15);

  assert.equal(comSobra.digitosUnidade.length, 4);
  assert.equal(comSobra.colunas, 5);
  assert.equal(
    colunaZeroFantasmaParcelaUnidade(
      comSobra.digitosUnidade,
      comSobra.colunas,
    ),
    4,
  );

  assert.equal(
    colunaZeroFantasmaParcelaUnidade(
      semSobra.digitosUnidade,
      semSobra.colunas,
    ),
    null,
  );
  assert.equal(colunaZeroFantasmaParcelaUnidade([], 4), null);
  assert.equal(colunaZeroFantasmaParcelaUnidade([1, 2], 0), null);
});

test('linhas da multiplicação difícil mantêm os carries no topo e a soma sobre a primeira parcial', () => {
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.carryUnidade < LINHAS_MULTIPLICACAO_DIFICIL.carryDezena);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.carryDezena < LINHAS_MULTIPLICACAO_DIFICIL.operandoA);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.operandoA < LINHAS_MULTIPLICACAO_DIFICIL.operandoB);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.operandoB < LINHAS_MULTIPLICACAO_DIFICIL.linhaParcial);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.linhaParcial < LINHAS_MULTIPLICACAO_DIFICIL.carrySoma);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.carrySoma < LINHAS_MULTIPLICACAO_DIFICIL.resultadoUnidade);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.resultadoUnidade < LINHAS_MULTIPLICACAO_DIFICIL.resultadoDezena);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.resultadoDezena < LINHAS_MULTIPLICACAO_DIFICIL.linhaFinal);
  assert.ok(LINHAS_MULTIPLICACAO_DIFICIL.linhaFinal < LINHAS_MULTIPLICACAO_DIFICIL.resultadoSoma);
});

test('ordemFocoMultiplicacaoDificil percorre as duas parciais e a soma de 327 × 15', () => {
  assert.deepEqual(ordemFocoMultiplicacaoDificil(327, 15), [
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 0 },
    { tipo: 'vaiUm', linha: 'carryUnidade', coluna: 1 },
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 1 },
    { tipo: 'vaiUm', linha: 'carryUnidade', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 3 },
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 1 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 3 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 0 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 1 },
    { tipo: 'vaiUm', linha: 'carrySoma', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 3 },
  ]);
});

test('ordemFocoMultiplicacaoDificil inclui os transportes da dezena em 327 × 95', () => {
  const ordem = ordemFocoMultiplicacaoDificil(327, 95);
  const modelo = montarModeloMultiplicacaoDificil(327, 95);
  const dezena = ordem.filter((alvo) => alvo.linha === 'resultadoDezena');
  const carriesDezena = ordem.filter((alvo) => alvo.linha === 'carryDezena');

  assert.deepEqual(modelo.carriesDezena, { 1: 6, 2: 2 });

  assert.deepEqual(dezena, [
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 1 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 4 },
    { tipo: 'resultado', linha: 'resultadoDezena', coluna: 3 },
  ]);
  assert.deepEqual(carriesDezena, [
    { tipo: 'vaiUm', linha: 'carryDezena', coluna: 1 },
    { tipo: 'vaiUm', linha: 'carryDezena', coluna: 2 },
  ]);
  assert.deepEqual(ordem.filter((alvo) => alvo.linha === 'resultadoSoma'), [
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 0 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 1 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 3 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 4 },
  ]);
});

test('foco da multiplicação difícil percorre unidade, transportes, dezena e soma', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);
  const seletores = new Map();
  const campos = new Map();

  modelo.ordemFoco.forEach((alvo) => {
    const seletor = (alvo.tipo === 'vaiUm'
      ? '.caixa-vai-um'
      : '.resultado-input')
      + '[data-coluna="' + alvo.coluna + '"]'
      + '[data-linha="' + alvo.linha + '"]';
    seletores.set(alvo.linha + ':' + alvo.tipo + ':' + alvo.coluna, seletor);
    campos.set(seletor, campoFalso(''));
  });

  const el = {
    conta: {
      querySelector(seletor) {
        return campos.get(seletor) ?? null;
      },
    },
  };

  const seletorDoAlvo = (alvo) => seletores.get(
    alvo.linha + ':' + alvo.tipo + ':' + alvo.coluna,
  );

  modelo.ordemFoco.forEach((alvo, indice) => {
    const campoAtual = campos.get(seletorDoAlvo(alvo));
    campoAtual.value = '1';
    campos.forEach((campo) => { campo.focado = false; });

    const avancou = focarProximoMultiplicacao(
      el,
      modelo.ordemFoco,
      alvo,
      { flexivel: false },
    );
    const proximo = modelo.ordemFoco[indice + 1];
    if (!proximo) {
      assert.equal(avancou, false);
      return;
    }
    assert.equal(avancou, true);
    assert.equal(campos.get(seletorDoAlvo(proximo)).focado, true);
  });
});

test('tratarTeclaFluxoFoco volta pela ordem e confirma no Enter', () => {
  const campo = campoFalso('');
  let confirmou = false;
  const alvo = { tipo: 'resultado', linha: 'resultadoSoma', coluna: 2 };
  const anterior = campoFalso('');
  const el = {
    conta: contaFalsa({
      '.resultado-input[data-coluna="1"][data-linha="resultadoSoma"]': anterior,
    }),
  };
  const ordem = [
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 1 },
    alvo,
  ];

  const voltou = tratarTeclaFluxoFoco(
    { key: 'Backspace' },
    { el, ordemFoco: ordem, alvo, campo },
  );
  assert.equal(voltou, true);
  assert.equal(anterior.focado, true);

  const confirmouNoEnter = tratarTeclaFluxoFoco(
    { key: 'Enter', preventDefault() {} },
    { el, ordemFoco: ordem, alvo, campo, aoConfirmar: () => { confirmou = true; } },
  );
  assert.equal(confirmouNoEnter, true);
  assert.equal(confirmou, true);
});

test('soma final da multiplicação difícil prioriza a nova casa mais à esquerda', () => {
  const ordem = ordemFocoMultiplicacaoDificil(999, 19)
    .filter((alvo) => alvo.linha === 'resultadoSoma' || alvo.linha === 'carrySoma');

  assert.deepEqual(ordem, [
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 0 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 1 },
    { tipo: 'vaiUm', linha: 'carrySoma', coluna: 2 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 2 },
    { tipo: 'vaiUm', linha: 'carrySoma', coluna: 3 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 4 },
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 3 },
  ]);
});

test('multiplicação difícil sem transporte pula direto para a coluna seguinte', () => {
  const ordem = ordemFocoMultiplicacaoDificil(111, 12);

  assert.deepEqual(ordem.filter((alvo) => alvo.linha === 'resultadoUnidade'), [
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 0 },
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 1 },
    { tipo: 'resultado', linha: 'resultadoUnidade', coluna: 2 },
  ]);
  assert.equal(ordem.some((alvo) => alvo.linha === 'carryUnidade'), false);
});

test('aplicarPreferencias aceita o nível difícil na soma, subtração e multiplicação', () => {
  assert.deepEqual(
    aplicarPreferencias(
      { operacao: 'SOMA', dificuldade: 'FACIL' },
      '?operacao=MULTIPLICACAO&dificuldade=DIFICIL',
    ),
    { operacao: 'MULTIPLICACAO', dificuldade: 'DIFICIL' },
  );
  assert.deepEqual(
    aplicarPreferencias(
      { operacao: 'SOMA', dificuldade: 'FACIL' },
      '?operacao=SOMA&dificuldade=DIFICIL',
    ),
    { operacao: 'SOMA', dificuldade: 'DIFICIL' },
  );
  assert.deepEqual(
    aplicarPreferencias(
      { operacao: 'SOMA', dificuldade: 'FACIL' },
      '?operacao=SUBTRACAO&dificuldade=DIFICIL',
    ),
    { operacao: 'SUBTRACAO', dificuldade: 'DIFICIL' },
  );
});

test('dica da multiplicação difícil destaca o par da unidade', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.deepEqual(
    seletoresDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoUnidade',
      coluna: 0,
    }),
    [
      '.resultado-input[data-coluna="0"][data-linha="resultadoUnidade"]',
      '.celula-multiplicacao-dificil[data-linha="operandoA"][data-coluna="0"]',
      '.celula-multiplicacao-dificil[data-linha="operandoB"][data-coluna="0"]',
    ],
  );
});

test('dica da multiplicação difícil acompanha o transporte da unidade', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.deepEqual(
    seletoresDicaMultiplicacaoDificil(modelo, {
      tipo: 'vaiUm',
      linha: 'carryUnidade',
      coluna: 1,
    }),
    [
      '.caixa-vai-um[data-coluna="1"][data-linha="carryUnidade"]',
      '.celula-multiplicacao-dificil[data-linha="operandoA"][data-coluna="0"]',
      '.celula-multiplicacao-dificil[data-linha="operandoB"][data-coluna="0"]',
    ],
  );
});

test('dica da multiplicação difícil destaca o carry somado na unidade', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.deepEqual(
    seletoresDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoUnidade',
      coluna: 1,
    }),
    [
      '.resultado-input[data-coluna="1"][data-linha="resultadoUnidade"]',
      '.celula-multiplicacao-dificil[data-linha="operandoA"][data-coluna="1"]',
      '.celula-multiplicacao-dificil[data-linha="operandoB"][data-coluna="0"]',
      {
        seletor: '.caixa-vai-um[data-coluna="1"][data-linha="carryUnidade"]',
        classe: CLASSE_DICA_CARRY,
      },
    ],
  );
});

test('dica da multiplicação difícil destaca o carry somado na casa final da unidade', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.deepEqual(
    seletoresCarryDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoUnidade',
      coluna: 3,
    }),
    [{
      seletor: '.caixa-vai-um[data-coluna="2"][data-linha="carryUnidade"]',
      classe: CLASSE_DICA_CARRY,
    }],
  );
});

test('dica da multiplicação difícil destaca o carry somado na dezena', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 95);

  assert.deepEqual(
    seletoresCarryDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoDezena',
      coluna: 2,
    }),
    [{
      seletor: '.caixa-vai-um[data-coluna="1"][data-linha="carryDezena"]',
      classe: CLASSE_DICA_CARRY,
    }],
  );
  assert.deepEqual(
    seletoresCarryDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoDezena',
      coluna: 4,
    }),
    [{
      seletor: '.caixa-vai-um[data-coluna="2"][data-linha="carryDezena"]',
      classe: CLASSE_DICA_CARRY,
    }],
  );
});

test('dica não destaca carry ao preencher a própria caixinha de transporte', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 95);

  assert.deepEqual(
    seletoresCarryDicaMultiplicacaoDificil(modelo, {
      tipo: 'vaiUm',
      linha: 'carryUnidade',
      coluna: 1,
    }),
    [],
  );
  assert.deepEqual(
    seletoresCarryDicaMultiplicacaoDificil(modelo, {
      tipo: 'vaiUm',
      linha: 'carryDezena',
      coluna: 2,
    }),
    [],
  );
});

test('colunaOrigemDicaMultiplicacaoDificil acompanha a casa deslocada e a final', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 95);

  assert.equal(colunaOrigemDicaMultiplicacaoDificil(modelo, {
    tipo: 'resultado',
    linha: 'resultadoUnidade',
    coluna: 3,
  }), 2);
  assert.equal(colunaOrigemDicaMultiplicacaoDificil(modelo, {
    tipo: 'resultado',
    linha: 'resultadoDezena',
    coluna: 4,
  }), 2);
  assert.equal(colunaOrigemDicaMultiplicacaoDificil(modelo, {
    tipo: 'resultado',
    linha: 'resultadoSoma',
    coluna: 2,
  }), null);
});

test('dica da multiplicação difícil usa a dezena e a casa deslocada', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 95);

  assert.deepEqual(
    seletoresOperandosDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoDezena',
      coluna: 4,
    }),
    [
      '.celula-multiplicacao-dificil[data-linha="operandoA"][data-coluna="2"]',
      '.celula-multiplicacao-dificil[data-linha="operandoB"][data-coluna="1"]',
    ],
  );
  assert.deepEqual(
    seletoresOperandosDicaMultiplicacaoDificil(modelo, {
      tipo: 'vaiUm',
      linha: 'carryDezena',
      coluna: 2,
    }),
    [
      '.celula-multiplicacao-dificil[data-linha="operandoA"][data-coluna="1"]',
      '.celula-multiplicacao-dificil[data-linha="operandoB"][data-coluna="1"]',
    ],
  );
});

test('dica da soma final aponta para as duas parcelas da coluna', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);

  assert.deepEqual(
    seletoresDicaMultiplicacaoDificil(modelo, {
      tipo: 'resultado',
      linha: 'resultadoSoma',
      coluna: 2,
    }),
    [
      '.resultado-input[data-coluna="2"][data-linha="resultadoSoma"]',
      '.resultado-input[data-linha="resultadoUnidade"][data-coluna="2"]',
      '.resultado-input[data-linha="resultadoDezena"][data-coluna="2"]',
      {
        seletor: '.caixa-vai-um[data-coluna="2"][data-linha="carrySoma"]',
        classe: CLASSE_DICA_CARRY,
      },
    ],
  );
  assert.deepEqual(
    seletoresDicaMultiplicacaoDificil(modelo, {
      tipo: 'vaiUm',
      linha: 'carrySoma',
      coluna: 2,
    }),
    [
      '.caixa-vai-um[data-coluna="2"][data-linha="carrySoma"]',
      '.resultado-input[data-linha="resultadoUnidade"][data-coluna="2"]',
      '.resultado-input[data-linha="resultadoDezena"][data-coluna="2"]',
    ],
  );
});

test('resolverAlvoDicaMultiplicacaoDificil prioriza o foco vazio e depois a primeira casa vazia', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);
  const ordem = modelo.ordemFoco;
  const primeiro = ordem[0];
  const segundo = ordem[1];

  assert.deepEqual(
    resolverAlvoDicaMultiplicacaoDificil(modelo, primeiro, new Set()),
    primeiro,
  );
  assert.deepEqual(
    resolverAlvoDicaMultiplicacaoDificil(
      modelo,
      primeiro,
      new Set([chaveAlvoFoco(primeiro)]),
    ),
    segundo,
  );
  assert.deepEqual(
    resolverAlvoDicaMultiplicacaoDificil(
      modelo,
      { tipo: 'resultado', linha: 'desconhecida', coluna: 9 },
      new Set(),
    ),
    primeiro,
  );
  assert.deepEqual(
    resolverAlvoDicaMultiplicacaoDificil(
      modelo,
      null,
      new Set(ordem.map(chaveAlvoFoco)),
    ),
    ordem[ordem.length - 1],
  );
  assert.equal(resolverAlvoDicaMultiplicacaoDificil(null, null, new Set()), null);
  assert.equal(
    resolverAlvoDicaMultiplicacaoDificil({ ordemFoco: [] }, null, new Set()),
    null,
  );
});

test('alvoDoCampoMultiplicacaoDificil lê apenas campos válidos da lousa', () => {
  assert.deepEqual(
    alvoDoCampoMultiplicacaoDificil({
      dataset: { tipo: 'resultado', linha: 'resultadoSoma', coluna: '2' },
    }),
    { tipo: 'resultado', linha: 'resultadoSoma', coluna: 2 },
  );
  assert.deepEqual(
    alvoDoCampoMultiplicacaoDificil({
      dataset: { tipo: 'vaiUm', linha: 'carrySoma', coluna: '1' },
    }),
    { tipo: 'vaiUm', linha: 'carrySoma', coluna: 1 },
  );
  assert.equal(alvoDoCampoMultiplicacaoDificil(null), null);
  assert.equal(
    alvoDoCampoMultiplicacaoDificil({ dataset: { linha: 'resultadoSoma', coluna: '2' } }),
    null,
  );
  assert.equal(
    alvoDoCampoMultiplicacaoDificil({
      dataset: { tipo: 'outro', linha: 'resultadoSoma', coluna: '2' },
    }),
    null,
  );
  assert.equal(
    alvoDoCampoMultiplicacaoDificil({
      dataset: { tipo: 'resultado', linha: 'resultadoSoma', coluna: 'x' },
    }),
    null,
  );
});

test('seletoresDicaAtualMultiplicacaoDificil ignora outras operações', () => {
  const modelo = montarModeloMultiplicacaoDificil(327, 15);
  const el = {
    conta: {
      querySelector() {
        return null;
      },
    },
  };
  const estado = {
    questao: { operacao: 'MULTIPLICACAO', dificuldade: 'DIFICIL' },
    multiplicacaoDificil: modelo,
  };

  assert.deepEqual(
    seletoresDicaAtualMultiplicacaoDificil(estado, el),
    seletoresDicaMultiplicacaoDificil(modelo, modelo.ordemFoco[0]),
  );
  assert.deepEqual(
    seletoresDicaAtualMultiplicacaoDificil(
      { questao: { operacao: 'SOMA', dificuldade: 'FACIL' } },
      el,
    ),
    [],
  );
  assert.deepEqual(
    seletoresDicaAtualMultiplicacaoDificil(
      { questao: { operacao: 'MULTIPLICACAO', dificuldade: 'MEDIO' } },
      el,
    ),
    [],
  );
});

test('ehSomaDificil identifica somente a soma no nível difícil', () => {
  assert.equal(ehSomaDificil({ operacao: 'SOMA', dificuldade: 'DIFICIL' }), true);
  assert.equal(ehSomaDificil({ operacao: 'SOMA', dificuldade: 'MEDIO' }), false);
  assert.equal(
    ehSomaDificil({ operacao: 'MULTIPLICACAO', dificuldade: 'DIFICIL' }),
    false,
  );
  assert.equal(ehSomaDificil(null), false);
});

test('montarModeloSomaDificil prepara quatro colunas e os carries do topo', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);

  assert.equal(modelo.digitos, 4);
  assert.deepEqual(modelo.passos.slice(0, 4), [1, 1, 1, 0]);
  assert.deepEqual(modelo.ordemFoco, [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'vaiUm', coluna: 1 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'vaiUm', coluna: 2 },
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'vaiUm', coluna: 3 },
    { tipo: 'resultado', coluna: 3 },
  ]);
});

test('dica da soma difícil destaca o par de operandos e o carry da coluna', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);

  assert.deepEqual(
    seletoresDicaSomaDificil(modelo, { tipo: 'resultado', coluna: 1 }),
    [
      '.resultado-input[data-coluna="1"]',
      '.celula-digito[data-coluna="1"]',
      { seletor: '.caixa-vai-um[data-coluna="1"]', classe: 'dica-ativa-carry' },
    ],
  );
  assert.deepEqual(
    seletoresDicaSomaDificil(modelo, { tipo: 'resultado', coluna: 0 }),
    [
      '.resultado-input[data-coluna="0"]',
      '.celula-digito[data-coluna="0"]',
      { seletor: '.caixa-vai-um[data-coluna="1"]', classe: 'dica-ativa-carry' },
    ],
  );
});

test('dica da soma difícil destaca o carry gerado pela coluna atual', () => {
  const modelo = montarModeloSomaDificil(4391, 1628);

  assert.deepEqual(modelo.passos, [0, 1, 1, 0]);
  assert.deepEqual(
    seletoresDicaSomaDificil(modelo, { tipo: 'resultado', coluna: 1 }),
    [
      '.resultado-input[data-coluna="1"]',
      '.celula-digito[data-coluna="1"]',
      { seletor: '.caixa-vai-um[data-coluna="2"]', classe: 'dica-ativa-carry' },
    ],
  );
});

test('dica da soma difícil não destaca carry quando a coluna atual não gera transporte', () => {
  const modelo = montarModeloSomaDificil(1234, 2345);

  assert.deepEqual(modelo.passos, [0, 0, 0, 0]);
  assert.deepEqual(
    seletoresDicaSomaDificil(modelo, { tipo: 'resultado', coluna: 0 }),
    [
      '.resultado-input[data-coluna="0"]',
      '.celula-digito[data-coluna="0"]',
    ],
  );
});

test('dica da soma difícil destaca o carry sem repetir o campo de resultado', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);

  assert.deepEqual(
    seletoresDicaSomaDificil(modelo, { tipo: 'vaiUm', coluna: 2 }),
    [
      '.celula-digito[data-coluna="2"]',
      { seletor: '.caixa-vai-um[data-coluna="2"]', classe: 'dica-ativa-carry' },
    ],
  );
});

test('valorEsperadoSomaDificil calcula resultado e reserva de cada coluna', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);

  assert.equal(valorEsperadoSomaDificil(modelo, { tipo: 'resultado', coluna: 0 }), 2);
  assert.equal(valorEsperadoSomaDificil(modelo, { tipo: 'resultado', coluna: 3 }), 7);
  assert.equal(valorEsperadoSomaDificil(modelo, { tipo: 'vaiUm', coluna: 1 }), 1);
  assert.equal(valorEsperadoSomaDificil(modelo, { tipo: 'vaiUm', coluna: 3 }), 1);
});

test('alvoIncorretoSomaDificil encontra a primeira coluna preenchida errada', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);
  const valores = {
    '.resultado-input[data-coluna="0"]': '2',
    '.caixa-vai-um[data-coluna="1"]': '1',
    '.resultado-input[data-coluna="1"]': '4',
  };
  const el = {
    conta: {
      querySelector(seletor) {
        return Object.prototype.hasOwnProperty.call(valores, seletor)
          ? { value: valores[seletor] }
          : null;
      },
    },
  };

  assert.deepEqual(
    alvoIncorretoSomaDificil(modelo, el),
    { tipo: 'resultado', coluna: 1 },
  );
});

test('alvoDoCampoResultadoSoma lê o tipo e a coluna do campo focado', () => {
  assert.deepEqual(
    alvoDoCampoResultadoSoma({ dataset: { tipo: 'resultado', coluna: '2' } }),
    { tipo: 'resultado', coluna: 2 },
  );
  assert.deepEqual(
    alvoDoCampoResultadoSoma({ dataset: { tipo: 'vaiUm', coluna: '1' } }),
    { tipo: 'vaiUm', coluna: 1 },
  );
  assert.equal(alvoDoCampoResultadoSoma({ dataset: { tipo: 'outro', coluna: '1' } }), null);
  assert.equal(alvoDoCampoResultadoSoma({ dataset: { tipo: 'resultado', coluna: 'x' } }), null);
  assert.equal(alvoDoCampoResultadoSoma(null), null);
});

test('resolverAlvoDicaSomaDificil prioriza o foco vazio e depois o primeiro passo vazio', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);
  const primeiro = modelo.ordemFoco[0];
  const segundo = modelo.ordemFoco[1];

  assert.deepEqual(resolverAlvoDicaSomaDificil(modelo, primeiro, new Set()), primeiro);
  assert.deepEqual(
    resolverAlvoDicaSomaDificil(modelo, primeiro, new Set(['resultado:0'])),
    segundo,
  );
});

test('seletoresDicaAtual direciona a dica para a soma difícil e ignora as demais', () => {
  const modelo = montarModeloSomaDificil(4978, 2354);
  const el = {
    conta: {
      querySelector() {
        return null;
      },
    },
  };
  const estado = {
    questao: { operacao: 'SOMA', dificuldade: 'DIFICIL' },
    somaDificil: modelo,
    questaoRespondida: false,
  };

  assert.deepEqual(
    seletoresDicaAtualSomaDificil(estado, el),
    seletoresDicaSomaDificil(modelo, modelo.ordemFoco[0]),
  );
  assert.deepEqual(
    seletoresDicaAtual(estado, el),
    seletoresDicaSomaDificil(modelo, modelo.ordemFoco[0]),
  );
  assert.deepEqual(
    seletoresDicaAtual(
      { questao: { operacao: 'SOMA', dificuldade: 'MEDIO' }, somaDificil: modelo },
      el,
    ),
    [],
  );
  assert.deepEqual(
    seletoresDicaAtual(
      { questao: { operacao: 'SUBTRACAO', dificuldade: 'FACIL' } },
      el,
    ),
    [],
  );
});


test('calcularEmprestimos reproduz os passos do backend', () => {
  assert.deepEqual(calcularEmprestimos(52, 37), [1, 0]);
  assert.deepEqual(calcularEmprestimos(5321, 1478), [1, 1, 1, 0]);
  assert.deepEqual(calcularEmprestimos(7852, 4936), [1, 0, 1, 0]);
});

test('ehSubtracaoDificil identifica somente a subtração no nível difícil', () => {
  assert.equal(
    ehSubtracaoDificil({ operacao: 'SUBTRACAO', dificuldade: 'DIFICIL' }),
    true,
  );
  assert.equal(
    ehSubtracaoDificil({ operacao: 'SUBTRACAO', dificuldade: 'MEDIO' }),
    false,
  );
  assert.equal(
    ehSubtracaoDificil({ operacao: 'SOMA', dificuldade: 'DIFICIL' }),
    false,
  );
  assert.equal(ehSubtracaoDificil(null), false);
});

test('montarModeloSubtracaoDificil prepara quatro colunas e empréstimos encadeados', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  assert.equal(modelo.numeroA, 5321);
  assert.equal(modelo.numeroB, 1478);
  assert.equal(modelo.resultado, 3843);
  assert.equal(modelo.digitos, 4);
  assert.deepEqual(modelo.passos, [1, 1, 1, 0]);
  assert.deepEqual(Array.from(modelo.colunasQueEmprestam), [1, 2, 3]);
  assert.deepEqual(modelo.ordemFoco, [
    { tipo: 'resultado', coluna: 0 },
    { tipo: 'resultado', coluna: 1 },
    { tipo: 'resultado', coluna: 2 },
    { tipo: 'resultado', coluna: 3 },
  ]);
});

test('dica da subtração difícil destaca apenas a coluna atual', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  assert.deepEqual(
    seletoresDicaSubtracaoDificil(modelo, { tipo: 'resultado', coluna: 0 }),
    [
      '.resultado-input[data-coluna="0"]',
      '.celula-digito[data-tipo="operandoA"][data-coluna="0"]',
      '.celula-digito[data-tipo="operandoB"][data-coluna="0"]',
    ],
  );
});

test('dica da subtração difícil destaca o novo valor emprestado em âmbar', () => {
  const modelo = montarModeloSubtracaoDificil(7852, 4936);

  assert.deepEqual(
    seletoresDicaSubtracaoDificil(
      modelo,
      { tipo: 'resultado', coluna: 1 },
      new Set([1, 3]),
    ),
    [
      '.resultado-input[data-coluna="1"]',
      '.celula-digito[data-tipo="operandoA"][data-coluna="1"] .valor-emprestado',
      '.celula-digito[data-tipo="operandoB"][data-coluna="1"]',
    ],
  );
});

test('dica da subtração difícil ignora a coluna vizinha que já emprestou', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  assert.deepEqual(
    seletoresDicaSubtracaoDificil(
      modelo,
      { tipo: 'resultado', coluna: 0 },
      new Set([1]),
    ),
    [
      '.resultado-input[data-coluna="0"]',
      '.celula-digito[data-tipo="operandoA"][data-coluna="0"]',
      '.celula-digito[data-tipo="operandoB"][data-coluna="0"]',
    ],
  );
});

test('dica da subtração difícil mantém o empréstimo encadeado na coluna atual', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  assert.deepEqual(
    seletoresDicaSubtracaoDificil(
      modelo,
      { tipo: 'resultado', coluna: 1 },
      new Set([1, 2]),
    ),
    [
      '.resultado-input[data-coluna="1"]',
      '.celula-digito[data-tipo="operandoA"][data-coluna="1"] .valor-emprestado',
      '.celula-digito[data-tipo="operandoB"][data-coluna="1"]',
    ],
  );
});

test('dica da subtração difícil não avança para a próxima coluna', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  for (let coluna = 0; coluna < modelo.digitos; coluna += 1) {
    const seletores = seletoresDicaSubtracaoDificil(
      modelo,
      { tipo: 'resultado', coluna },
      new Set([1, 2, 3]),
    );

    assert.equal(seletores.length, 3);
    assert.equal(seletores.every((seletor) => typeof seletor === 'string'), true);
    assert.equal(
      seletores.every((seletor) => seletor.includes('[data-coluna="' + coluna + '"]')),
      true,
    );
  }
});

test('valorEsperadoSubtracaoDificil calcula cada coluna do resultado', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);

  assert.equal(
    valorEsperadoSubtracaoDificil(modelo, { tipo: 'resultado', coluna: 0 }),
    3,
  );
  assert.equal(
    valorEsperadoSubtracaoDificil(modelo, { tipo: 'resultado', coluna: 1 }),
    4,
  );
  assert.equal(
    valorEsperadoSubtracaoDificil(modelo, { tipo: 'resultado', coluna: 2 }),
    8,
  );
  assert.equal(
    valorEsperadoSubtracaoDificil(modelo, { tipo: 'resultado', coluna: 3 }),
    3,
  );
});

test('alvoIncorretoSubtracaoDificil prioriza a coluna errada do resultado', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);
  const valores = {
    '.resultado-input[data-coluna="0"]': '4',
    '.resultado-input[data-coluna="1"]': '4',
    '.resultado-input[data-coluna="2"]': '8',
    '.resultado-input[data-coluna="3"]': '3',
  };
  const el = {
    conta: {
      querySelector(seletor) {
        return Object.prototype.hasOwnProperty.call(valores, seletor)
          ? { value: valores[seletor] }
          : null;
      },
    },
  };

  assert.deepEqual(
    alvoIncorretoSubtracaoDificil(modelo, el, new Set([1, 2, 3])),
    { tipo: 'resultado', coluna: 0 },
  );
});

test('alvoIncorretoSubtracaoDificil encontra o primeiro empréstimo ausente', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);
  const valores = {
    '.resultado-input[data-coluna="0"]': '3',
    '.resultado-input[data-coluna="1"]': '4',
    '.resultado-input[data-coluna="2"]': '8',
    '.resultado-input[data-coluna="3"]': '3',
  };
  const el = {
    conta: {
      querySelector(seletor) {
        return Object.prototype.hasOwnProperty.call(valores, seletor)
          ? { value: valores[seletor] }
          : null;
      },
    },
  };

  assert.deepEqual(
    alvoIncorretoSubtracaoDificil(modelo, el, new Set([1, 3])),
    { tipo: 'resultado', coluna: 1 },
  );
  assert.equal(alvoIncorretoSubtracaoDificil(modelo, el, new Set([1, 2, 3])), null);
});

test('alvoDoCampoResultadoSubtracao lê o campo de resultado', () => {
  assert.deepEqual(
    alvoDoCampoResultadoSubtracao({ dataset: { tipo: 'resultado', coluna: '2' } }),
    { tipo: 'resultado', coluna: 2 },
  );
  assert.equal(alvoDoCampoResultadoSubtracao({ dataset: { tipo: 'outro', coluna: '2' } }), null);
  assert.equal(alvoDoCampoResultadoSubtracao(null), null);
});

test('resolverAlvoDicaSubtracaoDificil usa a mesma ordem de foco da soma', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);
  const primeiro = modelo.ordemFoco[0];
  const segundo = modelo.ordemFoco[1];

  assert.deepEqual(
    resolverAlvoDicaSubtracaoDificil(modelo, primeiro, new Set()),
    primeiro,
  );
  assert.deepEqual(
    resolverAlvoDicaSubtracaoDificil(modelo, primeiro, new Set(['resultado:0'])),
    segundo,
  );
});

test('seletoresDicaAtual direciona a dica para a subtração difícil', () => {
  const modelo = montarModeloSubtracaoDificil(5321, 1478);
  const el = {
    conta: {
      querySelector() {
        return null;
      },
    },
  };
  const estado = {
    questao: { operacao: 'SUBTRACAO', dificuldade: 'DIFICIL' },
    subtracaoDificil: modelo,
    emprestimos: new Set([1, 2, 3]),
    questaoRespondida: false,
  };

  assert.deepEqual(
    seletoresDicaAtualSubtracaoDificil(estado, el),
    seletoresDicaSubtracaoDificil(
      modelo,
      modelo.ordemFoco[0],
      estado.emprestimos,
    ),
  );
  assert.deepEqual(
    seletoresDicaAtual(estado, el),
    seletoresDicaAtualSubtracaoDificil(estado, el),
  );
  assert.deepEqual(
    seletoresDicaAtual(
      { questao: { operacao: 'SUBTRACAO', dificuldade: 'MEDIO' } },
      el,
    ),
    [],
  );
});
test('a dica progressiva espera três segundos de inatividade', () => {
  assert.equal(TEMPO_INATIVIDADE_DICA, 3000);
});
