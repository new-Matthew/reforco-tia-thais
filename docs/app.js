'use strict';

/*
- Reforço Escolar da Tia Thaís — integração com a API REST do jogo.
 *
- As funções puras no topo do arquivo também são exportadas quando o arquivo
- roda no Node (usado pelos testes unitários). A inicialização da interface
- só acontece quando existe um `document`.
 *
- Foco automático, navegação por digitação e eventos de teclado ficam em
- lousa-foco.js; a interface carrega esse arquivo antes deste.
 */

const LousaFoco = (typeof module !== 'undefined' && module.exports)
  ? require('./lousa-foco.js')
  : window.LousaFoco;

const DicaProgressiva = (typeof module !== 'undefined' && module.exports)
  ? require('./dica-progressiva.js')
  : window.DicaProgressiva;

const {
  TEMPO_INATIVIDADE_PADRAO: TEMPO_INATIVIDADE_DICA,
  criarDicaProgressiva,
} = DicaProgressiva;

const {
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
  preenchidosNaOrdem,
  focarItemOrdem,
  focarNaOrdemFoco,
  proximoFocoMultiplicacao,
  focarProximoMultiplicacao,
  focarResultadoPorColuna,
  focarVaiUmPorColuna,
  tratarTeclaResultado,
  tratarTeclaFluxoFoco,
  tratarTeclaVaiUm,
  tratarTeclaDivisao,
} = LousaFoco;

const API_BASE = (typeof window !== 'undefined' && window.LOUSADA_API)
  ? window.LOUSADA_API
  : (typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:8080/api/jogo'
    : (typeof window !== 'undefined' && window.location.hostname.includes('github.io'))
      ? 'https://reforco-tia-thais.onrender.com/api/jogo'
      : '/api/jogo');

const DIGITOS_POR_DIFICULDADE = { FACIL: 2, MEDIO: 3, DIFICIL: 4 };
const ROTULOS_COLUNA = [
  'unidades',
  'dezenas',
  'centenas',
  'milhares',
  'dezenas de milhar',
  'centenas de milhar',
];
const CHAVE_PLACAR = 'reforco-tia-thais-placar';
const CHAVE_PLACAR_LEGADA = 'lousa-matematica-placar';
const CHAVE_JOGADOR = 'reforco-tia-thais-jogador';
const LIMITE_NOME_JOGADOR = 30;
const LIMITE_AVISO_SERVIDOR = 2000;
const META_NIVEL = 5;
const CLASSE_DICA_CARRY = 'dica-ativa-carry';
const NIVEIS_DIFICULDADE = ['FACIL', 'MEDIO'];
const NIVEIS_DIFICULDADE_SOMA = ['FACIL', 'MEDIO', 'DIFICIL'];
const TIPOS_NUMERO = ['INTEIROS', 'DECIMAIS'];
const TIPO_NUMERO_PADRAO = 'INTEIROS';
const ROTULOS_TIPO_NUMERO = { INTEIROS: 'Inteiros', DECIMAIS: 'Decimais' };
const CASAS_DECIMAIS_SOMA = 2;
const NIVEIS_DIFICULDADE_SUBTRACAO = ['FACIL', 'MEDIO', 'DIFICIL'];
const NIVEIS_DIFICULDADE_MULTIPLICACAO = ['FACIL', 'MEDIO', 'DIFICIL'];
const NIVEIS_DIFICULDADE_DIVISAO = ['FACIL', 'MEDIO', 'DIFICIL'];
const ROTULOS_DIFICULDADE = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };
const ORDEM_CAMPOS_DIVISAO = ['quociente', 'subtracao', 'resto'];
const ORDEM_CAMPOS_DIVISAO_MEDIA = [
  'quocienteParcial',
  'restoParcial',
  'quocienteFinal',
  'restoFinal',
];
const ORDEM_CAMPOS_DIVISAO_DIFICIL = [
  'quocienteParcial',
  'restoParcial',
  'quocienteIntermediario',
  'restoIntermediario',
  'quocienteFinal',
  'restoFinal',
];
const ESTAGIOS_MAXIMOS_DIVISAO = 3;
const CAMPOS_ETAPA_DIVISAO = {
  1: ['quocienteParcial', 'subtracaoParcial', 'restoParcial'],
  2: ['quocienteFinal', 'subtracaoFinal', 'restoFinal'],
};
const SELETORES_CAMPOS_DIVISAO = {
  quociente: '.divisao-quociente',
  subtracao: '.divisao-subtracao-input',
  resto: '.divisao-resto-input',
  quocienteParcial: '.divisao-quociente-parcial',
  subtracaoParcial: '.divisao-subtracao-parcial',
  restoParcial: '.divisao-resto-parcial-input',
  quocienteIntermediario: '.divisao-quociente-intermediario',
  subtracaoIntermediaria: '.divisao-subtracao-intermediaria',
  restoIntermediario: '.divisao-resto-intermediario-input',
  quocienteFinal: '.divisao-quociente-final',
  subtracaoFinal: '.divisao-subtracao-final',
  restoFinal: '.divisao-resto-final-input',
};
const ROTULOS_DIVISAO = {
  dividendo: 'DIVIDENDO',
  divisor: 'DIVISOR',
  quociente: 'QUOCIENTE',
  resto: 'RESTO',
};

/* ------------------------------------------------------------------------- */
/* Funções puras (testáveis sem DOM)                                          */
/* ------------------------------------------------------------------------- */

const TEMAS_POR_OPERACAO = {
  SOMA: 'verde',
  SUBTRACAO: 'rosa',
  MULTIPLICACAO: 'roxo',
  DIVISAO: 'laranja',
};

const TEMA_OPERACAO_PADRAO = 'verde';

function temaDaOperacao(operacao) {
  return TEMAS_POR_OPERACAO[operacao] || TEMA_OPERACAO_PADRAO;
}

function aplicarTemaOperacao(operacao, raiz) {
  const tema = temaDaOperacao(operacao);
  const alvo = raiz || (typeof document !== 'undefined' ? document.body : null);
  if (alvo && alvo.dataset) {
    alvo.dataset.tema = tema;
  }
  return tema;
}

function digitosDe(numero) {
  return String(Math.abs(Math.trunc(numero)))
    .split('')
    .reverse()
    .map((digito) => Number(digito));
}

function quantidadeColunas(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return digitosDosOperandos(dificuldade, operacao)
      + digitosDoMultiplicador(dificuldade, operacao);
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos + (operacao === 'SOMA' ? 1 : 0);
}

function digitosDosOperandos(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    if (dificuldade === 'FACIL') {
      return 1;
    }
    return dificuldade === 'DIFICIL' ? 3 : 2;
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos;
}

function digitosDoMultiplicador(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return dificuldade === 'DIFICIL' ? 2 : 1;
  }
  return digitosDosOperandos(dificuldade, operacao);
}

function calcularVaiUmMultiplicacao(numeroA, numeroB) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  return Math.floor(((a % 10) * b) / 10);
}

/*
- Resultado da coluna das dezenas já somado ao transporte das unidades.
- É ele que decide se a centena precisa ser preenchida antes da dezena.
 */
function resultadoDezenaMultiplicacao(numeroA, numeroB, carry = 0) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const transporte = Math.max(0, Math.trunc(Number(carry) || 0));
  return Math.floor(a / 10) * b + transporte;
}

function multiplicacaoPrecisaCentena(numeroA, numeroB, carry = 0) {
  return resultadoDezenaMultiplicacao(numeroA, numeroB, carry) >= 10;
}

const LINHAS_MULTIPLICACAO_DIFICIL = {
  carryUnidade: 1,
  carryDezena: 2,
  operandoA: 3,
  operandoB: 4,
  linhaParcial: 5,
  carrySoma: 6,
  resultadoUnidade: 7,
  resultadoDezena: 8,
  linhaFinal: 9,
  resultadoSoma: 10,
};

function ehMultiplicacaoDificil(questao) {
  return Boolean(questao)
    && questao.operacao === 'MULTIPLICACAO'
    && questao.dificuldade === 'DIFICIL'
    && questao.tipoNumero !== 'DECIMAIS';
}

function ehMultiplicacaoDecimal(questao) {
  return Boolean(questao)
    && questao.operacao === 'MULTIPLICACAO'
    && questao.tipoNumero === 'DECIMAIS';
}

function ehMultiplicacaoGuiada(questao) {
  return ehMultiplicacaoDificil(questao) || ehMultiplicacaoDecimal(questao);
}

/*
 * Executa a multiplicação de um número por um algarismo e devolve os dígitos
 * do produto (da unidade para a esquerda) e os transportes de cada coluna.
 * O transporte da última coluna vira o dígito mais à esquerda do produto.
 */
function calcularParcialMultiplicacaoDificil(numero, multiplicador) {
  const digitos = digitosDe(numero);
  const algarismo = Math.max(0, Math.trunc(Number(multiplicador) || 0));
  const resultado = [];
  const carries = {};
  let carry = 0;

  digitos.forEach((digito, indice) => {
    const total = digito * algarismo + carry;
    resultado.push(total % 10);
    carry = Math.floor(total / 10);
    if (indice < digitos.length - 1 && carry > 0) {
      carries[indice + 1] = carry;
    }
  });

  if (carry > 0) {
    resultado.push(carry);
  }

  return { digitos: resultado, carries, carryFinal: carry };
}

/*
 * Soma as duas parcelas alinhadas coluna a coluna. O array `carries` guarda o
 * transporte que sobe para a coluna seguinte, sempre 0 ou 1 na adição.
 */
function somarParcelasMultiplicacaoDificil(parcelaA, parcelaB, colunas) {
  const quantidade = Math.max(1, Math.trunc(Number(colunas) || 1));
  const digitos = [];
  const carries = {};
  let carry = 0;

  for (let coluna = 0; coluna < quantidade; coluna += 1) {
    const a = Math.floor(parcelaA / (10 ** coluna)) % 10;
    const b = Math.floor(parcelaB / (10 ** coluna)) % 10;
    const total = a + b + carry;
    digitos.push(total % 10);
    carry = total >= 10 ? 1 : 0;
    if (coluna < quantidade - 1 && carry > 0) {
      carries[coluna + 1] = carry;
    }
  }

  if (carry > 0) {
    digitos.push(carry);
  }

  return { digitos, carries };
}

function alvoMultiplicacaoDificil(tipo, linha, coluna) {
  return { tipo, linha, coluna };
}

/*
 * Árvore de foco da multiplicação difícil, na ordem exata da lousa:
 *   1. unidade do multiplicador: produto, transporte, próxima coluna...
 *   2. dezena do multiplicador, uma casa deslocada para a esquerda;
 *   3. soma final das parcelas, da direita para a esquerda.
 */
function ordemFocoMultiplicacaoDificil(numeroA, numeroB) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const digitosA = digitosDe(a);
  const unidade = b % 10;
  const dezena = Math.floor(b / 10) % 10;
  const ordem = [];

  let carry = 0;
  for (let coluna = 0; coluna < digitosA.length; coluna += 1) {
    const total = digitosA[coluna] * unidade + carry;
    carry = Math.floor(total / 10);
    const ultima = coluna === digitosA.length - 1;
    if (ultima) {
      if (carry > 0) {
        ordem.push(alvoMultiplicacaoDificil(
          'resultado', 'resultadoUnidade', coluna + 1,
        ));
      }
      ordem.push(alvoMultiplicacaoDificil('resultado', 'resultadoUnidade', coluna));
    } else {
      ordem.push(alvoMultiplicacaoDificil('resultado', 'resultadoUnidade', coluna));
      if (carry > 0) {
        ordem.push(alvoMultiplicacaoDificil('vaiUm', 'carryUnidade', coluna + 1));
      }
    }
  }

  carry = 0;
  for (let coluna = 0; coluna < digitosA.length; coluna += 1) {
    const total = digitosA[coluna] * dezena + carry;
    carry = Math.floor(total / 10);
    const destino = coluna + 1;
    const ultima = coluna === digitosA.length - 1;
    if (ultima) {
      if (carry > 0) {
        ordem.push(alvoMultiplicacaoDificil(
          'resultado', 'resultadoDezena', destino + 1,
        ));
      }
      ordem.push(alvoMultiplicacaoDificil('resultado', 'resultadoDezena', destino));
    } else {
      ordem.push(alvoMultiplicacaoDificil('resultado', 'resultadoDezena', destino));
      if (carry > 0) {
        ordem.push(alvoMultiplicacaoDificil('vaiUm', 'carryDezena', destino));
      }
    }
  }

  const colunasOperandos = Math.max(
    quantidadeDigitos(a * unidade),
    quantidadeDigitos(a * dezena * 10),
  );
  const colunas = Math.max(colunasOperandos, quantidadeDigitos(a * b));
  const soma = somarParcelasMultiplicacaoDificil(a * unidade, a * dezena * 10, colunas);
  const passosSoma = Array.from(
    { length: colunasOperandos },
    (_, coluna) => (soma.carries[coluna + 1] ? 1 : 0),
  );
  ordemFocoSoma(colunasOperandos, passosSoma).forEach((alvo) => {
    ordem.push(alvoMultiplicacaoDificil(
      alvo.tipo,
      alvo.tipo === 'vaiUm' ? 'carrySoma' : 'resultadoSoma',
      alvo.coluna,
    ));
  });

  return ordem;
}

function montarModeloMultiplicacaoDificil(numeroA, numeroB) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const unidade = b % 10;
  const dezena = Math.floor(b / 10) % 10;
  const parcialUnidade = calcularParcialMultiplicacaoDificil(a, unidade);
  const parcialDezenaBase = calcularParcialMultiplicacaoDificil(a, dezena);
  const digitosDezena = [null, ...parcialDezenaBase.digitos];
  const carriesDezena = { ...parcialDezenaBase.carries };
  const resultado = a * b;
  const colunasOperandos = Math.max(
    quantidadeDigitos(a * unidade),
    quantidadeDigitos(a * dezena * 10),
  );
  const colunas = Math.max(colunasOperandos, quantidadeDigitos(resultado));
  const soma = somarParcelasMultiplicacaoDificil(
    a * unidade,
    a * dezena * 10,
    colunas,
  );

  return {
    numeroA: a,
    numeroB: b,
    colunas,
    linhas: LINHAS_MULTIPLICACAO_DIFICIL,
    digitosA: digitosDe(a),
    digitosB: digitosDe(b),
    produtoUnidade: a * unidade,
    produtoDezena: a * dezena * 10,
    resultado,
    digitosUnidade: parcialUnidade.digitos,
    carriesUnidade: parcialUnidade.carries,
    digitosDezena,
    carriesDezena,
    digitosSoma: soma.digitos,
    carriesSoma: soma.carries,
    ordemFoco: ordemFocoMultiplicacaoDificil(a, b),
  };
}

function casasDecimaisMultiplicacao(questao) {
  if (!ehMultiplicacaoDecimal(questao)) {
    return 0;
  }
  const casasA = Math.max(0, Math.trunc(Number(questao.casasDecimaisA) || 0));
  const casasB = Math.max(0, Math.trunc(Number(questao.casasDecimaisB) || 0));
  return Math.max(1, casasA + casasB);
}

function digitosParteInteiraEscalada(valor, casasDecimais) {
  const casas = Math.max(0, Math.trunc(Number(casasDecimais) || 0));
  const inteiro = Math.floor(
    Math.abs(Math.trunc(Number(valor) || 0)) / (10 ** casas),
  );
  return String(inteiro).length;
}

function montarModeloMultiplicacaoDecimal(
  numeroA,
  numeroB,
  casasDecimaisA,
  casasDecimaisB,
) {
  const base = montarModeloMultiplicacaoDificil(numeroA, numeroB);
  const casasA = Math.max(0, Math.trunc(Number(casasDecimaisA) || 0));
  const casasB = Math.max(0, Math.trunc(Number(casasDecimaisB) || 0));
  const casasDecimais = Math.max(1, casasA + casasB);
  const colunasInteiras = Math.max(
    1,
    digitosParteInteiraEscalada(base.numeroA, casasA),
    digitosParteInteiraEscalada(base.numeroB, casasB),
    digitosParteInteiraEscalada(base.resultado, casasDecimais),
  );
  const colunaVirgula = colunasInteiras + 2;

  return {
    ...base,
    casasDecimaisA: casasA,
    casasDecimaisB: casasB,
    casasDecimais,
    colunasInteiras,
    colunaVirgula,
    colunasGrade: colunasInteiras + 2 + casasDecimais,
  };
}

/*
 * Converte um algarismo (índice 0 = mais à direita) para a coluna do grid.
 * A vírgula ocupa uma coluna própria; por isso as casas decimais ficam à
 * direita dela e as casas inteiras à esquerda.
 */
function colunaGradeMultiplicacaoDecimal(indice, casasOperando, colunaVirgula) {
  const posicao = Math.max(0, Math.trunc(Number(casasOperando) || 0))
    - Math.trunc(Number(indice) || 0);
  const virgula = Math.max(1, Math.trunc(Number(colunaVirgula) || 1));
  return posicao >= 1 ? virgula + posicao : virgula + posicao - 1;
}

function formatarComCasasDecimais(valor, casasDecimais) {
  const numero = Math.abs(Math.trunc(Number(valor) || 0));
  const casas = Math.max(0, Math.trunc(Number(casasDecimais) || 0));
  if (casas === 0) {
    return String(numero);
  }
  const divisor = 10 ** casas;
  const parteInteira = Math.floor(numero / divisor);
  const parteFracionaria = numero % divisor;
  return parteInteira + ',' + String(parteFracionaria).padStart(casas, '0');
}

function seletorCelulaOperandoDica(linha, coluna) {
  return '.celula-multiplicacao-dificil'
    + '[data-linha="' + linha + '"]'
    + '[data-coluna="' + coluna + '"]';
}

function seletorCarryDica(linha, coluna) {
  return '.caixa-vai-um'
    + '[data-coluna="' + coluna + '"]'
    + '[data-linha="' + linha + '"]';
}

function seletoresCarryDicaMultiplicacaoDificil(modelo, alvo) {
  if (!alvo) {
    return [];
  }

  const colunaOrigem = colunaOrigemDicaMultiplicacaoDificil(modelo, alvo);
  let linha = null;
  let coluna = null;

  if (alvo.linha === 'resultadoUnidade' && colunaOrigem > 0) {
    linha = 'carryUnidade';
    coluna = colunaOrigem;
  } else if (alvo.linha === 'resultadoDezena' && colunaOrigem > 0) {
    linha = 'carryDezena';
    coluna = colunaOrigem;
  } else if (alvo.linha === 'resultadoSoma' && alvo.coluna > 0) {
    linha = 'carrySoma';
    coluna = alvo.coluna;
  }

  if (!linha) {
    return [];
  }

  return [{
    seletor: seletorCarryDica(linha, coluna),
    classe: CLASSE_DICA_CARRY,
  }];
}

function colunaOrigemDicaMultiplicacaoDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return null;
  }

  const digitosA = Math.max(1, modelo.digitosA?.length ?? 0);

  if (alvo.linha === 'resultadoUnidade' || alvo.linha === 'carryUnidade') {
    const base = alvo.linha === 'carryUnidade' ? alvo.coluna - 1 : alvo.coluna;
    return Math.min(base, digitosA - 1);
  }

  if (alvo.linha === 'resultadoDezena' || alvo.linha === 'carryDezena') {
    return Math.min(alvo.coluna - 1, digitosA - 1);
  }

  return null;
}

function seletoresOperandosDicaMultiplicacaoDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return [];
  }

  const colunaA = colunaOrigemDicaMultiplicacaoDificil(modelo, alvo);
  let colunaB = null;

  if (alvo.linha === 'resultadoUnidade' || alvo.linha === 'carryUnidade') {
    colunaB = 0;
  } else if (alvo.linha === 'resultadoDezena' || alvo.linha === 'carryDezena') {
    colunaB = 1;
  }

  if (colunaA !== null && colunaA >= 0 && colunaB !== null) {
    return [
      seletorCelulaOperandoDica('operandoA', colunaA),
      seletorCelulaOperandoDica('operandoB', colunaB),
    ];
  }

  if (alvo.linha === 'resultadoSoma' || alvo.linha === 'carrySoma') {
    return [
      '.resultado-input[data-linha="resultadoUnidade"]'
        + '[data-coluna="' + alvo.coluna + '"]',
      '.resultado-input[data-linha="resultadoDezena"]'
        + '[data-coluna="' + alvo.coluna + '"]',
    ];
  }

  return [];
}

function seletoresDicaMultiplicacaoDificil(modelo, alvo) {
  if (!alvo) {
    return [];
  }
  return [
    seletorCampoMultiplicacaoDificil(alvo),
    ...seletoresOperandosDicaMultiplicacaoDificil(modelo, alvo),
    ...seletoresCarryDicaMultiplicacaoDificil(modelo, alvo),
  ];
}

function resolverAlvoDicaMultiplicacaoDificil(modelo, alvoFoco, preenchidos) {
  if (!modelo || !Array.isArray(modelo.ordemFoco) || modelo.ordemFoco.length === 0) {
    return null;
  }

  const ocupados = preenchidos instanceof Set
    ? preenchidos
    : new Set(preenchidos ?? []);
  const chavesValidas = new Set(modelo.ordemFoco.map(chaveAlvoFoco));
  const chaveFoco = chaveAlvoFoco(alvoFoco);

  if (chaveFoco && chavesValidas.has(chaveFoco) && !ocupados.has(chaveFoco)) {
    return alvoFoco;
  }

  return primeiroItemVazioOrdem(modelo.ordemFoco, ocupados)
    ?? modelo.ordemFoco[modelo.ordemFoco.length - 1];
}

function alvoDoCampoMultiplicacaoDificil(campo) {
  const dados = campo && campo.dataset;
  if (!dados || !dados.linha) {
    return null;
  }
  if (dados.tipo !== 'resultado' && dados.tipo !== 'vaiUm') {
    return null;
  }
  const coluna = Number(dados.coluna);
  if (!Number.isInteger(coluna)) {
    return null;
  }
  return { tipo: dados.tipo, linha: dados.linha, coluna };
}

function alvoFocoAtualMultiplicacaoDificil(el) {
  const ativo = typeof document !== 'undefined' ? document.activeElement : null;
  if (!ativo || !el || !el.conta || typeof el.conta.contains !== 'function') {
    return null;
  }
  if (!el.conta.contains(ativo)) {
    return null;
  }
  return alvoDoCampoMultiplicacaoDificil(ativo);
}

function seletoresDicaAtualMultiplicacaoDificil(estado, el) {
  if (!ehMultiplicacaoGuiada(estado && estado.questao)) {
    return [];
  }
  const modelo = estado.multiplicacaoDificil;
  if (!modelo || !el || !el.conta) {
    return [];
  }

  const preenchidos = preenchidosNaOrdem(el, modelo.ordemFoco);
  const todosPreenchidos = preenchidos.size >= modelo.ordemFoco.length;
  if (ehMultiplicacaoDecimal(estado.questao)
    && todosPreenchidos
    && estado.casasDecimaisResultado !== modelo.casasDecimais) {
    return ['.controle-virgula-multiplicacao'];
  }

  const alvo = resolverAlvoDicaMultiplicacaoDificil(
    modelo,
    alvoFocoAtualMultiplicacaoDificil(el),
    preenchidos,
  );
  return seletoresDicaMultiplicacaoDificil(modelo, alvo);
}

function ehSomaDificil(questao) {
  return Boolean(questao)
    && questao.operacao === 'SOMA'
    && questao.dificuldade === 'DIFICIL';
}

function ehSomaDecimal(questao) {
  return Boolean(questao)
    && questao.operacao === 'SOMA'
    && questao.tipoNumero === 'DECIMAIS';
}

function ehSubtracaoDecimal(questao) {
  return Boolean(questao)
    && questao.operacao === 'SUBTRACAO'
    && questao.tipoNumero === 'DECIMAIS';
}

function ehOperacaoDecimal(questao) {
  return ehSomaDecimal(questao) || ehSubtracaoDecimal(questao);
}

function ehSomaGuiada(questao) {
  return ehSomaDificil(questao) || ehSomaDecimal(questao);
}

function ehSubtracaoGuiada(questao) {
  return ehSubtracaoDificil(questao) || ehSubtracaoDecimal(questao);
}

function casasDecimaisMaximas(questao) {
  if (ehDivisaoDecimal(questao)) {
    return casasDecimaisDivisao(questao);
  }
  return ehOperacaoDecimal(questao) ? CASAS_DECIMAIS_SOMA : 0;
}

function digitosEscalados(valor, quantidade) {
  let numero = Math.abs(Math.trunc(Number(valor) || 0));
  const total = Math.max(0, Math.trunc(Number(quantidade) || 0));
  const digitos = [];

  for (let indice = 0; indice < total; indice += 1) {
    digitos.push(numero % 10);
    numero = Math.floor(numero / 10);
  }
  return digitos;
}

function digitosSomaDecimal(dificuldade, casasDecimais = CASAS_DECIMAIS_SOMA) {
  const casas = Math.max(1, Math.trunc(Number(casasDecimais) || CASAS_DECIMAIS_SOMA));
  return digitosDosOperandos(dificuldade, 'SOMA') + casas;
}

function quantidadeCaixasVaiUmDecimal(
  dificuldade,
  casasDecimais = CASAS_DECIMAIS_SOMA,
) {
  return digitosSomaDecimal(dificuldade, casasDecimais) - 1;
}

function colunasInteirasSomaDecimal(dificuldade) {
  return digitosDosOperandos(dificuldade, 'SOMA') + 1;
}

function colunaGradeDecimal(indice, colunasInteiras, casasDecimais) {
  const casas = Math.max(1, Math.trunc(Number(casasDecimais) || CASAS_DECIMAIS_SOMA));
  const inteiras = Math.max(1, Math.trunc(Number(colunasInteiras) || 1));
  const colunaVirgula = inteiras + 2;

  if (indice < casas) {
    return colunaVirgula + casas - indice;
  }
  return inteiras + 1 - (indice - casas);
}

function colunaGradeSomaDecimal(
  indice,
  dificuldade,
  casasDecimais = CASAS_DECIMAIS_SOMA,
) {
  return colunaGradeDecimal(
    indice,
    colunasInteirasSomaDecimal(dificuldade),
    casasDecimais,
  );
}

function colunasInteirasSubtracaoDecimal(dificuldade) {
  return digitosDosOperandos(dificuldade, 'SUBTRACAO');
}

function digitosParteInteiraDecimal(valor) {
  const escala = 10 ** CASAS_DECIMAIS_SOMA;
  const inteiro = Math.floor(
    Math.abs(Math.trunc(Number(valor) || 0)) / escala,
  );
  return String(inteiro).length;
}

function colunasInteirasDecimais(numeroA, numeroB) {
  return Math.max(
    1,
    digitosParteInteiraDecimal(numeroA),
    digitosParteInteiraDecimal(numeroB),
  );
}

function casasDecimaisDoOperando(questao, operando) {
  const chave = operando === 'B' ? 'casasDecimaisB' : 'casasDecimaisA';
  const casas = Number(questao && questao[chave]);
  if (!Number.isFinite(casas)) {
    return CASAS_DECIMAIS_SOMA;
  }
  return Math.max(0, Math.min(CASAS_DECIMAIS_SOMA, Math.trunc(casas)));
}

function ehZeroFantasmaDecimal(
  questao,
  operando,
  indice,
  casas = casasDecimaisMaximas(questao),
) {
  const total = Math.max(0, Math.trunc(Number(casas) || 0));
  const preenchidas = casasDecimaisDoOperando(questao, operando);
  return indice >= 0 && indice < total && indice < total - preenchidas;
}

function digitoDecimalPreenchido(valor, indice) {
  const total = String(Math.abs(Math.trunc(Number(valor) || 0))).length;
  return indice >= 0 && indice < total;
}

function colunaGradeSubtracaoDecimal(
  indice,
  dificuldade,
  casasDecimais = CASAS_DECIMAIS_SOMA,
) {
  return colunaGradeDecimal(
    indice,
    colunasInteirasSubtracaoDecimal(dificuldade),
    casasDecimais,
  );
}

function rotuloColunaDecimal(indice, casasDecimais = CASAS_DECIMAIS_SOMA) {
  const casas = Math.max(1, Math.trunc(Number(casasDecimais) || CASAS_DECIMAIS_SOMA));
  if (indice < 0) {
    return 'resultado';
  }
  if (indice < casas) {
    const rotulos = casas === 3
      ? ['milésimos', 'centésimos', 'décimos']
      : (casas === 2 ? ['centésimos', 'décimos'] : ['décimos']);
    return rotulos[indice] ?? 'décimos';
  }
  return ROTULOS_COLUNA[indice - casas] ?? 'milhares';
}

function montarModeloSomaDificil(numeroA, numeroB, dificuldade = 'DIFICIL') {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const digitos = digitosDosOperandos(dificuldade, 'SOMA');
  const passos = calcularVaiUm(a, b);

  return {
    numeroA: a,
    numeroB: b,
    digitos,
    passos,
    ordemFoco: ordemFocoSoma(digitos, passos),
  };
}

function montarModeloSomaDecimal(
  numeroA,
  numeroB,
  dificuldade,
  casasDecimais = CASAS_DECIMAIS_SOMA,
) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const casas = Math.max(1, Math.trunc(Number(casasDecimais) || CASAS_DECIMAIS_SOMA));
  const digitos = digitosSomaDecimal(dificuldade, casas);
  const passos = calcularVaiUm(a, b);

  return {
    numeroA: a,
    numeroB: b,
    digitos,
    casasDecimais: casas,
    passos,
    ordemFoco: ordemFocoSoma(digitos, passos),
  };
}

function seletorResultadoSoma(coluna) {
  return '.resultado-input[data-coluna="' + coluna + '"]';
}

function seletorCelulaOperandoSoma(coluna) {
  return '.celula-digito[data-coluna="' + coluna + '"]';
}

function seletorCarrySoma(coluna) {
  return '.caixa-vai-um[data-coluna="' + coluna + '"]';
}

function seletorAlvoSoma(alvo) {
  if (!alvo) {
    return null;
  }
  return alvo.tipo === 'vaiUm'
    ? seletorCarrySoma(alvo.coluna)
    : seletorResultadoSoma(alvo.coluna);
}

function alvoDoCampoResultadoSoma(campo) {
  const dados = campo && campo.dataset;
  if (!dados) {
    return null;
  }
  if (dados.tipo !== 'resultado' && dados.tipo !== 'vaiUm') {
    return null;
  }
  const coluna = Number(dados.coluna);
  if (!Number.isInteger(coluna) || coluna < 0) {
    return null;
  }
  return { tipo: dados.tipo, coluna };
}

function alvoFocoAtualSomaDificil(el) {
  const ativo = typeof document !== 'undefined' ? document.activeElement : null;
  if (!ativo || !el || !el.conta || typeof el.conta.contains !== 'function') {
    return null;
  }
  if (!el.conta.contains(ativo)) {
    return null;
  }
  return alvoDoCampoResultadoSoma(ativo);
}

function valorEsperadoSomaDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return null;
  }
  if (alvo.tipo === 'vaiUm') {
    return alvo.coluna > 0 ? modelo.passos[alvo.coluna - 1] ?? 0 : 0;
  }
  const total = modelo.numeroA + modelo.numeroB;
  return Math.floor(total / (10 ** alvo.coluna)) % 10;
}

function alvoIncorretoSomaDificil(modelo, el) {
  if (!modelo || !el || !el.conta) {
    return null;
  }
  for (const alvo of modelo.ordemFoco) {
    const campo = el.conta.querySelector(seletorAlvoSoma(alvo));
    if (!campo) {
      continue;
    }
    const valor = String(campo.value ?? '').trim();
    if (valor === '') {
      continue;
    }
    if (Number(valor) !== valorEsperadoSomaDificil(modelo, alvo)) {
      return alvo;
    }
  }
  return null;
}

function resolverAlvoDicaSomaDificil(modelo, alvoFoco, preenchidos) {
  if (!modelo || !Array.isArray(modelo.ordemFoco) || modelo.ordemFoco.length === 0) {
    return null;
  }

  const ocupados = preenchidos instanceof Set
    ? preenchidos
    : new Set(preenchidos ?? []);
  const chavesValidas = new Set(modelo.ordemFoco.map(chaveAlvoFoco));
  const chaveFoco = chaveAlvoFoco(alvoFoco);

  if (chaveFoco && chavesValidas.has(chaveFoco) && !ocupados.has(chaveFoco)) {
    return alvoFoco;
  }

  return primeiroItemVazioOrdem(modelo.ordemFoco, ocupados)
    ?? modelo.ordemFoco[modelo.ordemFoco.length - 1];
}

function colunaCarryDicaSomaDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return null;
  }

  const coluna = Math.max(0, Math.trunc(Number(alvo.coluna) || 0));
  if (alvo.tipo === 'vaiUm') {
    return coluna > 0 && modelo.passos[coluna - 1] === 1 ? coluna : null;
  }
  if (coluna > 0 && modelo.passos[coluna - 1] === 1) {
    return coluna;
  }
  if (coluna + 1 < modelo.digitos && modelo.passos[coluna] === 1) {
    return coluna + 1;
  }
  return null;
}

function seletoresDicaSomaDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return [];
  }

  const coluna = Math.max(0, Math.trunc(Number(alvo.coluna) || 0));
  const colunaOperando = Math.min(coluna, modelo.digitos - 1);
  const seletores = [];

  if (alvo.tipo === 'resultado') {
    seletores.push(seletorResultadoSoma(coluna));
  }
  if (colunaOperando >= 0) {
    seletores.push(seletorCelulaOperandoSoma(colunaOperando));
  }
  const carry = colunaCarryDicaSomaDificil(modelo, alvo);
  if (carry !== null) {
    seletores.push({
      seletor: seletorCarrySoma(carry),
      classe: CLASSE_DICA_CARRY,
    });
  }

  return seletores;
}

function seletoresDicaAtualSomaDificil(estado, el) {
  if (!ehSomaGuiada(estado && estado.questao)) {
    return [];
  }
  const modelo = estado.somaDificil;
  if (!modelo || !el || !el.conta) {
    return [];
  }

  const preenchidos = preenchidosNaOrdem(el, modelo.ordemFoco);
  let alvo = resolverAlvoDicaSomaDificil(
    modelo,
    alvoFocoAtualSomaDificil(el),
    preenchidos,
  );

  if (estado.questaoRespondida) {
    alvo = alvoIncorretoSomaDificil(modelo, el) ?? alvo;
  }

  return seletoresDicaSomaDificil(modelo, alvo);
}

function ehSubtracaoDificil(questao) {
  return Boolean(questao)
    && questao.operacao === 'SUBTRACAO'
    && questao.dificuldade === 'DIFICIL';
}

function ordemFocoSubtracaoDificil(digitos) {
  const quantidade = Math.max(0, Math.trunc(Number(digitos) || 0));
  return Array.from(
    { length: quantidade },
    (_, coluna) => ({ tipo: 'resultado', coluna }),
  );
}

function montarModeloSubtracaoDificil(numeroA, numeroB, dificuldade = 'DIFICIL') {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const digitos = digitosDosOperandos(dificuldade, 'SUBTRACAO');
  const passos = calcularEmprestimos(a, b);
  const colunasQueEmprestam = new Set();
  passos.forEach((passo, coluna) => {
    if (passo === 1) {
      colunasQueEmprestam.add(coluna + 1);
    }
  });

  return {
    numeroA: a,
    numeroB: b,
    resultado: a - b,
    digitos,
    passos,
    colunasQueEmprestam,
    ordemFoco: ordemFocoSubtracaoDificil(digitos),
  };
}

function montarModeloSubtracaoDecimal(
  numeroA,
  numeroB,
  dificuldade,
  casasDecimais = CASAS_DECIMAIS_SOMA,
) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const casas = Math.max(1, Math.trunc(Number(casasDecimais) || CASAS_DECIMAIS_SOMA));
  const colunasInteiras = colunasInteirasDecimais(a, b);
  const digitos = colunasInteiras + casas;
  const passos = calcularEmprestimos(a, b);
  const colunasQueEmprestam = new Set();
  passos.forEach((passo, coluna) => {
    if (passo === 1) {
      colunasQueEmprestam.add(coluna + 1);
    }
  });

  return {
    numeroA: a,
    numeroB: b,
    resultado: a - b,
    digitos,
    colunasInteiras,
    casasDecimais: casas,
    passos,
    colunasQueEmprestam,
    ordemFoco: ordemFocoSubtracaoDificil(digitos),
  };
}

function seletorResultadoSubtracao(coluna) {
  return '.resultado-input[data-coluna="' + coluna + '"]';
}

function seletorCelulaSubtracao(tipo, coluna) {
  return '.celula-digito[data-tipo="' + tipo + '"][data-coluna="' + coluna + '"]';
}

function seletorValorEmprestadoSubtracao(coluna) {
  return seletorCelulaSubtracao('operandoA', coluna) + ' .valor-emprestado';
}

function alvoDoCampoResultadoSubtracao(campo) {
  return alvoDoCampoResultadoSoma(campo);
}

function alvoFocoAtualSubtracaoDificil(el) {
  const ativo = typeof document !== 'undefined' ? document.activeElement : null;
  if (!ativo || !el || !el.conta || typeof el.conta.contains !== 'function') {
    return null;
  }
  if (!el.conta.contains(ativo)) {
    return null;
  }
  return alvoDoCampoResultadoSubtracao(ativo);
}

function valorEsperadoSubtracaoDificil(modelo, alvo) {
  if (!modelo || !alvo) {
    return null;
  }
  return Math.floor(modelo.resultado / (10 ** alvo.coluna)) % 10;
}

function valorDoCampoResultadoSubtracao(el, alvo) {
  if (!el || !el.conta || !alvo) {
    return null;
  }
  const campo = el.conta.querySelector(seletorResultadoSubtracao(alvo.coluna));
  if (!campo) {
    return null;
  }
  return String(campo.value ?? '').trim();
}

function alvoIncorretoSubtracaoDificil(modelo, el, emprestimos, alvoFoco) {
  if (!modelo || !el || !el.conta) {
    return null;
  }

  const ativos = emprestimos instanceof Set
    ? emprestimos
    : new Set(emprestimos ?? []);
  const colunaFoco = Number(alvoFoco && alvoFoco.coluna);
  const focoValido = Number.isInteger(colunaFoco)
    && colunaFoco >= 0
    && colunaFoco < modelo.digitos;

  if (focoValido) {
    const alvo = { tipo: 'resultado', coluna: colunaFoco };
    const valor = valorDoCampoResultadoSubtracao(el, alvo);
    if (valor !== null
      && (valor === '' || Number(valor) !== valorEsperadoSubtracaoDificil(modelo, alvo))) {
      return alvo;
    }
    if ((modelo.passos[colunaFoco] === 1) !== ativos.has(colunaFoco + 1)) {
      return alvo;
    }
  }

  for (const alvo of modelo.ordemFoco) {
    const valor = valorDoCampoResultadoSubtracao(el, alvo);
    if (valor === null) {
      continue;
    }
    if (valor === '' || Number(valor) !== valorEsperadoSubtracaoDificil(modelo, alvo)) {
      return alvo;
    }
  }

  for (let coluna = 0; coluna < modelo.passos.length; coluna += 1) {
    const esperado = modelo.passos[coluna] === 1;
    const ativo = ativos.has(coluna + 1);
    if (esperado !== ativo) {
      return { tipo: 'resultado', coluna: Math.min(coluna, modelo.digitos - 1) };
    }
  }

  return null;
}

function resolverAlvoDicaSubtracaoDificil(modelo, alvoFoco, preenchidos) {
  if (!modelo || !Array.isArray(modelo.ordemFoco) || modelo.ordemFoco.length === 0) {
    return null;
  }

  const chaveFoco = chaveAlvoFoco(alvoFoco);
  if (chaveFoco && modelo.ordemFoco.some((alvo) => chaveAlvoFoco(alvo) === chaveFoco)) {
    return alvoFoco;
  }

  const ocupados = preenchidos instanceof Set
    ? preenchidos
    : new Set(preenchidos ?? []);
  return primeiroItemVazioOrdem(modelo.ordemFoco, ocupados)
    ?? modelo.ordemFoco[modelo.ordemFoco.length - 1];
}

function seletoresDicaSubtracaoDificil(modelo, alvo, emprestimos) {
  if (!modelo || !alvo) {
    return [];
  }

  const coluna = Math.max(0, Math.min(
    Math.trunc(Number(alvo.coluna) || 0),
    modelo.digitos - 1,
  ));
  const ativos = emprestimos instanceof Set
    ? emprestimos
    : new Set(emprestimos ?? []);
  const seletores = [
    seletorResultadoSubtracao(coluna),
    seletorCelulaSubtracao('operandoA', coluna),
  ];
  if (ativos.has(coluna)) {
    seletores.push(seletorValorEmprestadoSubtracao(coluna));
  }
  seletores.push(seletorCelulaSubtracao('operandoB', coluna));
  return seletores;
}

function seletoresDicaAtualSubtracaoDificil(estado, el) {
  if (!ehSubtracaoGuiada(estado && estado.questao)) {
    return [];
  }
  const modelo = estado.subtracaoDificil;
  if (!modelo || !el || !el.conta) {
    return [];
  }

  const alvoFoco = alvoFocoAtualSubtracaoDificil(el);
  const preenchidos = preenchidosNaOrdem(el, modelo.ordemFoco);
  let alvo = resolverAlvoDicaSubtracaoDificil(
    modelo,
    alvoFoco,
    preenchidos,
  );

  if (estado.questaoRespondida) {
    alvo = alvoIncorretoSubtracaoDificil(
      modelo,
      el,
      estado.emprestimos,
      alvoFoco,
    ) ?? alvo;
  }

  return seletoresDicaSubtracaoDificil(modelo, alvo, estado.emprestimos);
}

function ehDivisaoLongaGuiada(questao) {
  return ehDivisaoMedia(questao) || ehDivisaoDificil(questao);
}

function seletorQuocienteDivisaoDificil(etapa) {
  return '.divisao-quociente[data-etapa="' + etapa + '"]';
}

function seletorDivisorDivisaoDificil() {
  return '.divisao-divisor';
}

function seletorProdutoDivisaoDificil(etapa) {
  return '.divisao-produto[data-etapa="' + etapa + '"]';
}

function seletorRestoDivisaoDificil(etapa) {
  return '.divisao-resto-input[data-etapa="' + etapa + '"]';
}

function seletorParcialDivisaoDificil(etapa) {
  return '.dividendo-parcial[data-etapa="' + etapa + '"] .celula-digito';
}

function seletorDesceDivisaoDificil(etapa) {
  return '.divisao-desce[data-etapa="' + etapa + '"]';
}

function digitoAbaixadoDivisaoDificil(etapa) {
  const indice = Number(etapa && etapa.indice);
  if (!Number.isInteger(indice) || indice <= 1) {
    return null;
  }
  const parcial = Number(etapa && etapa.dividendoParcial);
  if (!Number.isFinite(parcial)) {
    return null;
  }
  return Math.abs(Math.trunc(parcial)) % 10;
}

function normalizarAlvoDivisaoDificil(modelo, alvo) {
  const total = modelo && Array.isArray(modelo.etapas) ? modelo.etapas.length : 0;
  if (total === 0) {
    return null;
  }
  if (typeof alvo === 'number') {
    return {
      tipo: 'quociente',
      etapa: Math.min(Math.max(1, Math.trunc(alvo) || 1), total),
    };
  }
  if (!alvo || typeof alvo !== 'object') {
    return { tipo: 'quociente', etapa: 1 };
  }
  const etapa = Math.min(Math.max(1, Math.trunc(Number(alvo.etapa) || 1)), total);
  const tipo = alvo.tipo === 'resto' || alvo.tipo === 'subtracao'
    ? alvo.tipo
    : 'quociente';
  return { tipo, etapa };
}

function alvoDoCampoDivisaoDificil(campo) {
  const dados = campo && campo.dataset;
  if (!dados) {
    return null;
  }
  const etapa = Number(dados.etapa);
  if (!Number.isInteger(etapa) || etapa < 1) {
    return null;
  }
  if (dados.tipo === 'quociente' || dados.tipo === 'resto' || dados.tipo === 'subtracao') {
    return { tipo: dados.tipo, etapa };
  }
  return null;
}

function alvoFocoAtualDivisaoDificil(el) {
  const ativo = typeof document !== 'undefined' ? document.activeElement : null;
  if (!ativo || !el || !el.conta || typeof el.conta.contains !== 'function') {
    return null;
  }
  if (!el.conta.contains(ativo)) {
    return null;
  }
  return alvoDoCampoDivisaoDificil(ativo);
}

function valorEsperadoDivisaoDificil(modelo, alvo) {
  const normalizado = normalizarAlvoDivisaoDificil(modelo, alvo);
  if (!normalizado) {
    return null;
  }
  const etapa = modelo.etapas[normalizado.etapa - 1];
  if (!etapa) {
    return null;
  }
  if (normalizado.tipo === 'resto') {
    return etapa.resto;
  }
  if (normalizado.tipo === 'subtracao') {
    return etapa.subtracao;
  }
  return etapa.quociente;
}

function seletoresDicaDivisaoDificil(modelo, alvo) {
  const normalizado = normalizarAlvoDivisaoDificil(modelo, alvo);
  if (!normalizado) {
    return [];
  }
  const seletores = [seletorParcialDivisaoDificil(normalizado.etapa)];
  if (normalizado.tipo === 'quociente') {
    seletores.push(
      seletorDivisorDivisaoDificil(),
      seletorQuocienteDivisaoDificil(normalizado.etapa),
    );
  } else {
    seletores.push(
      seletorProdutoDivisaoDificil(normalizado.etapa),
      seletorRestoDivisaoDificil(normalizado.etapa),
    );
  }
  return seletores;
}

function alvoIncorretoDivisaoDificil(modelo, el) {
  if (!modelo || !el || !el.conta) {
    return null;
  }
  for (const etapa of modelo.etapas) {
    const campoQuociente = el.conta.querySelector(
      seletorQuocienteDivisaoDificil(etapa.indice),
    );
    if (campoQuociente && String(campoQuociente.value ?? '').trim() !== ''
      && Number(campoQuociente.value) !== etapa.quociente) {
      return { tipo: 'quociente', etapa: etapa.indice };
    }
    const campoResto = el.conta.querySelector(seletorRestoDivisaoDificil(etapa.indice));
    if (campoResto && !campoResto.disabled
      && String(campoResto.value ?? '').trim() !== ''
      && Number(campoResto.value) !== etapa.resto) {
      return { tipo: 'resto', etapa: etapa.indice };
    }
  }
  return null;
}

function seletoresDicaAtualDivisaoDificil(estado, el) {
  if (!ehDivisaoDificil(estado && estado.questao)) {
    return [];
  }
  const dados = estado.divisaoDificil;
  const modelo = dados && Array.isArray(dados.etapas)
    ? dados
    : (el && el.conta ? montarModeloDivisaoDificil(estado.questao) : null);
  if (!modelo || !el || !el.conta) {
    return [];
  }

  const estadoDivisao = dados ?? { etapa: 1, fase: 'quociente' };
  if (estado.questaoRespondida) {
    const incorreto = alvoIncorretoDivisaoDificil(modelo, el);
    return incorreto ? seletoresDicaDivisaoDificil(modelo, incorreto) : [];
  }
  if (estadoDivisao.fase === 'concluido') {
    return [];
  }
  const alvo = {
    tipo: estadoDivisao.fase === 'subtracao'
      ? 'subtracao'
      : (estadoDivisao.fase === 'resto' ? 'resto' : 'quociente'),
    etapa: estadoDivisao.etapa,
  };
  return seletoresDicaDivisaoDificil(modelo, alvo);
}

function seletoresDicaAtual(estado, el) {
  if (ehDivisaoDecimal(estado && estado.questao)
    && !divisaoDecimalEquivalente(estado.questao)) {
    return [];
  }
  if (ehMultiplicacaoGuiada(estado && estado.questao)) {
    return seletoresDicaAtualMultiplicacaoDificil(estado, el);
  }
  if (ehSomaGuiada(estado && estado.questao)) {
    return seletoresDicaAtualSomaDificil(estado, el);
  }
  if (ehSubtracaoGuiada(estado && estado.questao)) {
    return seletoresDicaAtualSubtracaoDificil(estado, el);
  }
  if (ehDivisaoDificil(estado && estado.questao)) {
    return seletoresDicaAtualDivisaoDificil(estado, el);
  }
  return [];
}

/*
- Só existem caixinhas de "vai um" entre as colunas dos operandos: uma acima
- das dezenas (2 dígitos), duas acima das dezenas e centenas (3 dígitos) ou
- três acima das dezenas, centenas e milhares (4 dígitos). O transporte final,
- que vira o dígito extra do resultado, é calculado sozinho.
 */
function quantidadeCaixasVaiUm(dificuldade) {
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos - 1;
}

function niveisDificuldade(operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return NIVEIS_DIFICULDADE_MULTIPLICACAO;
  }
  if (operacao === 'SOMA') {
    return NIVEIS_DIFICULDADE_SOMA;
  }
  if (operacao === 'SUBTRACAO') {
    return NIVEIS_DIFICULDADE_SUBTRACAO;
  }
  if (operacao === 'DIVISAO') {
    return NIVEIS_DIFICULDADE_DIVISAO;
  }
  return NIVEIS_DIFICULDADE;
}

function proximaDificuldade(dificuldade, operacao = 'SOMA') {
  const niveis = niveisDificuldade(operacao);
  const indice = niveis.indexOf(dificuldade);
  if (indice === -1) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return niveis[indice + 1] ?? null;
}

function dificuldadePermitida(dificuldade, operacao) {
  const niveis = niveisDificuldade(operacao);
  return niveis.includes(dificuldade) ? dificuldade : niveis[niveis.length - 1];
}

function calcularProgresso(sequencia, meta = META_NIVEL) {
  if (!Number.isFinite(meta) || meta <= 0) {
    return 0;
  }
  const acertos = Math.max(0, Number(sequencia) || 0);
  return Math.min(acertos / meta, 1);
}

/*
- Resolve o efeito de uma resposta no streak e no nível. Acertos enchem a
- barra; erros e acertos parciais zeram. Ao completar a meta, o nível sobe
- automaticamente (ou a rodada recomeça no nível máximo).
 */
function resolverProgresso(
  sequenciaAtual,
  dificuldadeAtual,
  correto,
  meta = META_NIVEL,
  operacao = 'SOMA',
) {
  const resultadoBase = {
    sequencia: 0,
    progresso: 0,
    subiuNivel: false,
    nivelMaximo: false,
    dificuldade: dificuldadeAtual,
  };

  if (!correto) {
    return resultadoBase;
  }

  const sequencia = Math.max(0, Number(sequenciaAtual) || 0) + 1;
  if (sequencia < meta) {
    return {
      ...resultadoBase,
      sequencia,
      progresso: calcularProgresso(sequencia, meta),
    };
  }

  const proxima = proximaDificuldade(dificuldadeAtual, operacao);
  return {
    sequencia: 0,
    progresso: 1,
    subiuNivel: Boolean(proxima),
    nivelMaximo: !proxima,
    dificuldade: proxima ?? dificuldadeAtual,
  };
}

/*
- Garante que o array enviado ao backend contenha apenas inteiros 0/1.
- `null` é preservado porque o Java trata a ausência dos passos como opcional.
 */
function normalizarPassos(valores) {
  if (valores == null) {
    return null;
  }
  return Array.from(valores, normalizarPasso);
}

/*
- O transporte da multiplicação não é booleano: 8 × 9 nas unidades gera 7.
- Preserva o dígito 0–9 digitado e devolve null quando a caixinha está vazia.
 */
function normalizarVaiUmMultiplicacao(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') {
    return null;
  }
  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero < 0 || numero > 9) {
    return null;
  }
  return numero;
}

function lerVaiUmMultiplicacao(caixasVaiUm) {
  if (!caixasVaiUm.length) {
    return null;
  }
  return normalizarVaiUmMultiplicacao(caixasVaiUm[0]);
}

function preencherAte(valores, quantidade) {
  const passos = valores.slice();
  while (passos.length < quantidade) {
    passos.push(0);
  }
  return passos;
}

function ehDivisaoDecimal(questao) {
  return Boolean(questao)
    && questao.operacao === 'DIVISAO'
    && questao.tipoNumero === 'DECIMAIS';
}

function divisaoDecimalEquivalente(questao) {
  return ehDivisaoDecimal(questao) && Boolean(questao.divisaoEquivalente);
}

function casasDecimaisDivisao(questao) {
  if (!ehDivisaoDecimal(questao)) {
    return 0;
  }
  return Math.max(1, Math.min(
    CASAS_DECIMAIS_SOMA,
    Math.max(
      Number(questao.casasDecimaisA) || 0,
      Number(questao.casasDecimaisB) || 0,
    ),
  ));
}

function ehDivisaoLonga(questao) {
  if (!questao || questao.operacao !== 'DIVISAO') {
    return false;
  }
  const dividendo = Number(questao.numeroA);
  const divisor = Number(questao.numeroB);
  return Number.isInteger(dividendo)
    && Number.isInteger(divisor)
    && dividendo >= 100
    && dividendo <= 9999
    && divisor >= 10
    && divisor <= 999
    && Math.floor(dividendo / divisor) >= 10;
}

function ehDivisaoMedia(questao) {
  return Boolean(questao)
    && questao.operacao === 'DIVISAO'
    && questao.dificuldade === 'MEDIO';
}

function ehDivisaoDificil(questao) {
  return Boolean(questao)
    && questao.operacao === 'DIVISAO'
    && questao.dificuldade === 'DIFICIL';
}

function calcularEtapasDivisaoLonga(numeroA, numeroB) {
  const dividendo = Math.abs(Math.trunc(Number(numeroA) || 0));
  const divisor = Math.abs(Math.trunc(Number(numeroB) || 0));
  if (dividendo <= 0 || divisor <= 0) {
    return [];
  }

  const texto = String(dividendo);
  const etapas = [];
  let posicao = 0;
  let alvo = 0;

  while (posicao < texto.length && alvo < divisor) {
    alvo = alvo * 10 + Number(texto[posicao]);
    posicao += 1;
  }

  while (posicao <= texto.length) {
    const quociente = Math.floor(alvo / divisor);
    const subtracao = divisor * quociente;
    const resto = alvo - subtracao;
    let dividendoAbaixado = null;

    if (posicao < texto.length) {
      dividendoAbaixado = resto * 10 + Number(texto[posicao]);
    }

    etapas.push({
      indice: etapas.length + 1,
      dividendoParcial: alvo,
      quociente,
      subtracao,
      resto,
      dividendoAbaixado,
      digitos: quantidadeDigitos(alvo),
    });

    if (dividendoAbaixado === null) {
      break;
    }
    alvo = dividendoAbaixado;
    posicao += 1;
  }

  return etapas;
}

function montarModeloDivisaoLonga(numeroA, numeroB) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const etapas = calcularEtapasDivisaoLonga(a, b);
  const primeira = etapas[0] ?? null;
  const ultima = etapas.length > 0 ? etapas[etapas.length - 1] : null;

  return {
    numeroA: a,
    numeroB: b,
    quociente: b > 0 ? Math.floor(a / b) : 0,
    resto: ultima ? ultima.resto : 0,
    etapas,
    dividendoParcial: primeira ? primeira.dividendoParcial : 0,
    quocienteParcial: primeira ? primeira.quociente : null,
    subtracaoParcial: primeira ? primeira.subtracao : null,
    restoParcial: primeira ? primeira.resto : null,
    dividendoAbaixado: primeira ? primeira.dividendoAbaixado : null,
    quocienteFinal: ultima ? ultima.quociente : null,
    subtracaoFinal: ultima ? ultima.subtracao : null,
  };
}

function montarModeloDivisaoDificil(numeroA, numeroB) {
  const origem = numeroA && typeof numeroA === 'object' ? numeroA : null;
  const modelo = montarModeloDivisaoLonga(
    origem ? origem.numeroA : numeroA,
    origem ? origem.numeroB : numeroB,
  );
  const intermediaria = modelo.etapas[1] ?? null;
  const ultima = modelo.etapas.length > 0
    ? modelo.etapas[modelo.etapas.length - 1]
    : null;

  return {
    ...modelo,
    quocienteIntermediario: intermediaria ? intermediaria.quociente : null,
    subtracaoIntermediaria: intermediaria ? intermediaria.subtracao : null,
    restoIntermediario: intermediaria ? intermediaria.resto : null,
    dividendoAbaixadoFinal: intermediaria ? intermediaria.dividendoAbaixado : null,
    quocienteFinal: ultima ? ultima.quociente : null,
    subtracaoFinal: ultima ? ultima.subtracao : null,
    ordemFoco: modelo.etapas.flatMap((etapa) => ([
      { tipo: 'quociente', etapa: etapa.indice },
      { tipo: 'resto', etapa: etapa.indice },
    ])),
  };
}

function modeloDivisaoDaQuestao(questao) {
  if (!questao || questao.operacao !== 'DIVISAO') {
    return null;
  }
  return montarModeloDivisaoLonga(questao.numeroA, questao.numeroB);
}

function proximoCampoDivisao(campo, ordem = ORDEM_CAMPOS_DIVISAO) {
  const campos = Array.isArray(ordem) ? ordem : ORDEM_CAMPOS_DIVISAO;
  const indice = campos.indexOf(campo);
  return indice >= 0 ? campos[indice + 1] ?? null : null;
}

function campoAnteriorDivisao(campo, ordem = ORDEM_CAMPOS_DIVISAO) {
  const campos = Array.isArray(ordem) ? ordem : ORDEM_CAMPOS_DIVISAO;
  const indice = campos.indexOf(campo);
  return indice > 0 ? campos[indice - 1] : null;
}

function etapaDoCampoDivisao(campo) {
  if (CAMPOS_ETAPA_DIVISAO[1].includes(campo)) {
    return 1;
  }
  if (CAMPOS_ETAPA_DIVISAO[2].includes(campo)) {
    return 2;
  }
  return null;
}

function alvoApoioDivisao(questao, etapa) {
  if (!questao) {
    return 0;
  }
  const alvo = etapa === 2 ? questao.dividendoAbaixado : questao.dividendoParcial;
  return Number.isFinite(Number(alvo)) ? Number(alvo) : 0;
}

function ajustarMultiplicador(valor, passo, minimo = 0, maximo = 9) {
  const atual = Number.isFinite(Number(valor)) ? Math.trunc(Number(valor)) : 0;
  const delta = Number.isFinite(Number(passo)) ? Math.trunc(Number(passo)) : 0;
  const limiteInferior = Number.isFinite(Number(minimo)) ? Math.trunc(Number(minimo)) : 0;
  const limiteSuperior = Number.isFinite(Number(maximo)) ? Math.trunc(Number(maximo)) : 9;
  return Math.min(limiteSuperior, Math.max(limiteInferior, atual + delta));
}

function avaliarMultiploDivisao(divisor, multiplicador, alvo) {
  const d = Math.max(0, Math.trunc(Number(divisor) || 0));
  const m = Math.max(0, Math.trunc(Number(multiplicador) || 0));
  const a = Math.max(0, Math.trunc(Number(alvo) || 0));
  const produto = d * m;
  const excedeu = produto > a;
  const comparacao = produto === a ? 'igual' : (excedeu ? 'acima' : 'abaixo');
  const expressao = d + ' × ' + m + ' = ' + produto;
  let texto = expressao;
  if (comparacao === 'igual') {
    texto += ' — é o alvo!';
  } else if (excedeu) {
    texto += ' — passou de ' + a;
  } else {
    texto += ' — falta ' + (a - produto);
  }
  return { produto, comparacao, excedeu, expressao, texto };
}

function normalizarDigitoQuociente(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') {
    return null;
  }
  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero < 0 || numero > 9) {
    return null;
  }
  return numero;
}

/*
 * Avalia a interação do aluno em uma das etapas da divisão média. Antes de
 * qualquer dígito o estado é `neutro`; com dígito, o produto é `valido` quando
 * cabe no alvo da subtração e `invalido` quando passa dele.
 */
function avaliarEtapaDivisaoMedia(divisor, digito, alvo) {
  const alvoNumero = Math.max(0, Math.trunc(Number(alvo) || 0));
  const digitoNumero = normalizarDigitoQuociente(digito);
  if (digitoNumero === null) {
    return {
      digito: null,
      produto: null,
      alvo: alvoNumero,
      resto: null,
      status: 'neutro',
      valido: false,
      excedeu: false,
      expressao: '',
      texto: '',
    };
  }

  const avaliacao = avaliarMultiploDivisao(divisor, digitoNumero, alvoNumero);
  const valido = !avaliacao.excedeu;
  return {
    ...avaliacao,
    digito: digitoNumero,
    alvo: alvoNumero,
    resto: valido ? alvoNumero - avaliacao.produto : null,
    status: valido ? 'valido' : 'invalido',
    valido,
  };
}

function proximoNumeroAbaixado(resto, digitoUnidade) {
  const restoNumero = Math.max(0, Math.trunc(Number(resto) || 0));
  const digito = Math.abs(Math.trunc(Number(digitoUnidade) || 0)) % 10;
  return restoNumero * 10 + digito;
}

/*
 * Monta o estado exibido no painel lateral. A expressão fica neutra sem dígito
 * e recebe feedback verde/vermelho conforme o produto caiba ou não no alvo.
 */
function descreverApoioDivisao(divisor, digito, alvo, etapa = 1) {
  const avaliacao = avaliarEtapaDivisaoMedia(divisor, digito, alvo);
  return {
    ...avaliacao,
    etapa: etapa === 2 ? 2 : 1,
    expressao: avaliacao.status === 'neutro'
      ? divisor + ' × · = ·'
      : avaliacao.expressao,
    correto: avaliacao.status === 'valido',
    excedeu: avaliacao.status === 'invalido',
  };
}

function subtracaoDivisaoConfere(valor, alvo, produto) {
  const texto = String(valor ?? '').trim();
  if (texto === '') {
    return false;
  }
  const numero = Number(texto);
  if (!Number.isInteger(numero)) {
    return false;
  }
  return numero === Math.max(0, Math.trunc(Number(alvo) || 0) - Math.max(
    0,
    Math.trunc(Number(produto) || 0),
  ));
}

/*
 * Preenche o resultado da subtração da direita para a esquerda: a primeira
 * tecla ocupa a unidade e as seguintes empurram o valor para a esquerda.
 * Assim, digitar 8 e depois 1 forma 18, como na lousa.
 */
function preencherResultadoDivisaoDireita(valorAtual, entrada, digitos) {
  const limite = Math.max(1, Math.trunc(Number(digitos) || 1));
  const anterior = String(valorAtual ?? '').replace(/\D/g, '').slice(-limite);
  const digitosNovos = String(entrada ?? '').replace(/\D/g, '');
  if (!digitosNovos) {
    return anterior;
  }
  if (digitosNovos.length >= limite) {
    return digitosNovos.slice(-limite);
  }
  if (anterior.length >= limite) {
    return anterior;
  }
  return (digitosNovos + anterior).slice(-limite);
}

/*
 * Normaliza o que o navegador entrega no evento `input`. O valor bruto pode
 * já vir com o novo dígito à direita (ex.: 8 + 1 = 81); aqui ele é remontado
 * pela unidade, resultando em 18. Exclusões mantêm o valor restante.
 */
function normalizarEntradaResultadoDivisao(
  valorAnterior,
  valorBruto,
  entrada,
  tipoEntrada,
  digitos,
) {
  const limite = Math.max(1, Math.trunc(Number(digitos) || 1));
  const anterior = String(valorAnterior ?? '').replace(/\D/g, '').slice(-limite);
  const bruto = String(valorBruto ?? '').replace(/\D/g, '').slice(0, limite);
  const insercao = String(tipoEntrada ?? '').startsWith('insert');
  if (!insercao && bruto.length <= anterior.length) {
    return bruto;
  }
  const digitado = String(entrada ?? '').replace(/\D/g, '');
  return preencherResultadoDivisaoDireita(
    anterior,
    digitado || bruto.slice(anterior.length),
    limite,
  );
}

function comporQuocienteDivisaoMedia(quocienteParcial, quocienteFinal) {
  if (quocienteParcial === null || quocienteParcial === undefined
    || quocienteFinal === null || quocienteFinal === undefined) {
    return null;
  }
  if (String(quocienteParcial).trim() === '' || String(quocienteFinal).trim() === '') {
    return null;
  }
  const parcial = Number(quocienteParcial);
  const final = Number(quocienteFinal);
  if (!Number.isInteger(parcial) || !Number.isInteger(final)) {
    return null;
  }
  if (parcial < 0 || final < 0) {
    return null;
  }
  return parcial * 10 + final;
}

function nomesCamposEtapaDivisao(etapa, totalEtapas) {
  const total = Math.max(2, Math.trunc(Number(totalEtapas) || 2));
  const indice = Math.max(1, Math.trunc(Number(etapa) || 1));
  if (indice === 1) {
    return {
      quociente: 'quocienteParcial',
      subtracao: 'subtracaoParcial',
      resto: 'restoParcial',
    };
  }
  if (indice >= total) {
    return {
      quociente: 'quocienteFinal',
      subtracao: 'subtracaoFinal',
      resto: 'restoFinal',
    };
  }
  return {
    quociente: 'quocienteIntermediario',
    subtracao: 'subtracaoIntermediaria',
    resto: 'restoIntermediario',
  };
}

function ordemCamposDivisaoDificil(totalEtapas) {
  const total = Math.max(2, Math.trunc(Number(totalEtapas) || 2));
  const ordem = [];
  for (let etapa = 1; etapa <= total; etapa += 1) {
    const nomes = nomesCamposEtapaDivisao(etapa, total);
    ordem.push(nomes.quociente, nomes.resto);
  }
  return ordem;
}

function comporQuocienteDivisaoEtapas(valores) {
  const lista = Array.from(valores ?? []);
  if (lista.length === 0) {
    return null;
  }
  let quociente = 0;
  for (const valor of lista) {
    const digito = normalizarDigitoQuociente(valor);
    if (digito === null) {
      return null;
    }
    quociente = quociente * 10 + digito;
  }
  return quociente;
}

/*
- Calcula os transportes coluna a coluna, da direita para a esquerda, do mesmo
- jeito que o backend faz. Usado para completar o último "vai um" quando a
- criança o deixa em branco (o dígito extra do resultado já o representa).
 */
function calcularVaiUm(numeroA, numeroB) {
  let a = Math.abs(Math.trunc(Number(numeroA) || 0));
  let b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const passos = [];
  let vaiUm = 0;

  while (a > 0 || b > 0 || vaiUm > 0) {
    vaiUm = (a % 10) + (b % 10) + vaiUm >= 10 ? 1 : 0;
    passos.push(vaiUm);
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }

  return passos;
}

function calcularEmprestimos(numeroA, numeroB) {
  let a = Math.abs(Math.trunc(Number(numeroA) || 0));
  let b = Math.abs(Math.trunc(Number(numeroB) || 0));
  const passos = [];
  let emprestimo = 0;

  while (a > 0 || b > 0) {
    const diferenca = (a % 10) - (b % 10) - emprestimo;
    emprestimo = diferenca < 0 ? 1 : 0;
    passos.push(emprestimo);
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }

  return passos;
}

/*
- As caixinhas de "vai um" são preenchidas da direita para a esquerda e cada
- uma representa o transporte que sai da coluna anterior. Campos em branco são
- normalizados para 0. A posição final do array (o transporte que cria o dígito
- extra do resultado) não tem caixinha: ela é calculada automaticamente. Quando
- esse transporte é 1, o backend acrescenta um 0 final.
 */
function montarArrayVaiUm(valores, quantidadeDeCaixas, passosEsperados) {
  const brutos = Array.from(valores ?? [], (valor) => String(valor ?? '').trim());
  const normalizados = brutos.map(normalizarPasso);
  const passos = quantidadeDeCaixas == null
    ? normalizados
    : preencherAte(normalizados, quantidadeDeCaixas);

  if (passosEsperados && passos.length > 0) {
    const ultimo = passos.length - 1;
    const caixaEmBranco = ultimo >= brutos.length || brutos[ultimo] === '';
    if (caixaEmBranco && passosEsperados[ultimo] != null) {
      passos[ultimo] = passosEsperados[ultimo];
    }
  }

  if (passos.length > 0 && passos[passos.length - 1] === 1) {
    passos.push(0);
  }
  return passos;
}

/*
- `colunasQueEmprestam` guarda os índices das colunas que emprestam para a
- coluna da direita. O backend espera um valor por coluna (da direita para a
- esquerda), marcando 1 onde houve empréstimo e 0 nas demais.
 */
function montarArrayEmprestimos(colunasQueEmprestam, quantidadeDeColunas) {
  const passos = [];
  for (let coluna = 0; coluna < quantidadeDeColunas; coluna += 1) {
    passos.push(colunasQueEmprestam && colunasQueEmprestam.has(coluna + 1) ? 1 : 0);
  }
  return passos;
}

function comporResultado(valores) {
  let resultado = 0;
  let algumPreenchido = false;

  valores.forEach((valor, coluna) => {
    const texto = String(valor ?? '').trim();
    if (texto === '') {
      return;
    }
    const digito = Number(texto);
    if (!Number.isInteger(digito) || digito < 0 || digito > 9) {
      return;
    }
    resultado += digito * (10 ** coluna);
    algumPreenchido = true;
  });

  return algumPreenchido ? resultado : null;
}

function montarRequisicao(questao, entradas) {
  const soma = questao.operacao === 'SOMA';
  const subtracao = questao.operacao === 'SUBTRACAO';
  const multiplicacao = questao.operacao === 'MULTIPLICACAO';
  const divisao = questao.operacao === 'DIVISAO';
  const requisicao = {
    idQuestao: questao.id,
    operacao: questao.operacao,
    numeroA: questao.numeroA,
    numeroB: questao.numeroB,
    resultadoDigitado: entradas.resultadoDigitado,
    vaiUm: soma ? normalizarPassos(entradas.vaiUm) : null,
    emprestados: subtracao ? normalizarPassos(entradas.emprestados) : null,
    vaiUmMultiplicacao: multiplicacao
      ? (entradas.vaiUmMultiplicacao ?? null)
      : null,
  };

  if (ehOperacaoDecimal(questao)
    || ehMultiplicacaoDecimal(questao)
    || ehDivisaoDecimal(questao)) {
    requisicao.tipoNumero = 'DECIMAIS';
    requisicao.casasDecimais = ehMultiplicacaoDecimal(questao)
      ? casasDecimaisMultiplicacao(questao)
      : casasDecimaisMaximas(questao);
    if (ehMultiplicacaoDecimal(questao)) {
      const casasResultado = Number(entradas.casasDecimaisResultado);
      requisicao.casasDecimaisResultado = Number.isInteger(casasResultado)
        ? casasResultado
        : null;
    }
    if (ehDivisaoDecimal(questao)) {
      requisicao.dividendoEquivalente = Number(questao.dividendoEquivalente);
      requisicao.divisorEquivalente = Number(questao.divisorEquivalente);
    }
  }

  if (divisao) {
    requisicao.subtracaoDigitada = entradas.subtracaoDigitada ?? null;
    requisicao.restoDigitado = entradas.restoDigitado ?? null;
    if (ehDivisaoDificil(questao)) {
      requisicao.quocientesParciaisDigitados = entradas.quocientesParciaisDigitados ?? null;
      requisicao.subtracoesParciaisDigitadas = entradas.subtracoesParciaisDigitadas ?? null;
      requisicao.restosParciaisDigitados = entradas.restosParciaisDigitados ?? null;
    } else if (ehDivisaoLonga(questao)) {
      requisicao.quocienteParcialDigitado = entradas.quocienteParcialDigitado ?? null;
      requisicao.subtracaoParcialDigitada = entradas.subtracaoParcialDigitada ?? null;
      requisicao.restoParcialDigitado = entradas.restoParcialDigitado ?? null;
      requisicao.quocienteFinalDigitado = entradas.quocienteFinalDigitado ?? null;
      requisicao.subtracaoFinalDigitada = entradas.subtracaoFinalDigitada ?? null;
    }
  }

  return requisicao;
}

function podeIniciarQuestao(estado) {
  return !estado.carregando && !estado.validando;
}

function podeValidarResposta(estado) {
  return Boolean(estado.questao)
    && !estado.carregando
    && !estado.validando
    && !estado.questaoRespondida
    && !(ehDivisaoDecimal(estado.questao)
      && !divisaoDecimalEquivalente(estado.questao));
}

function normalizarNomeJogador(valor) {
  const limpo = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return Array.from(limpo).slice(0, LIMITE_NOME_JOGADOR).join('').trim();
}

function nomeJogadorValido(valor) {
  return normalizarNomeJogador(valor).length > 0;
}

function obterArmazenamentoSessao() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch (erro) {
    return null;
  }
}

function lerNomeJogador(armazenamento = obterArmazenamentoSessao()) {
  try {
    return normalizarNomeJogador(armazenamento && armazenamento.getItem(CHAVE_JOGADOR));
  } catch (erro) {
    return '';
  }
}

function salvarNomeJogador(nome, armazenamento = obterArmazenamentoSessao()) {
  const normalizado = normalizarNomeJogador(nome);
  if (!normalizado) {
    return '';
  }
  try {
    if (armazenamento) {
      armazenamento.setItem(CHAVE_JOGADOR, normalizado);
    }
  } catch (erro) {
    console.warn('Não foi possível guardar o nome na sessão.', erro);
  }
  return normalizado;
}

function montarTituloFeedback(nome, dados, resolucao) {
  const jogador = normalizarNomeJogador(nome);
  if (resolucao && resolucao.subiuNivel) {
    return jogador ? 'Parabéns, ' + jogador + '!' : 'Subiu de nível!';
  }
  if (resolucao && resolucao.nivelMaximo) {
    return jogador ? 'Parabéns, ' + jogador + '!' : 'Nível máximo!';
  }
  if (dados.correto) {
    return jogador ? 'Parabéns, ' + jogador + '!' : 'Muito bem!';
  }
  if (dados.pontosGanhos > 0) {
    return jogador ? 'Quase lá, ' + jogador + '!' : 'Quase perfeito!';
  }
  return jogador ? 'Tente novamente, ' + jogador + '!' : 'Vamos tentar de novo!';
}

/*
 * Agenda o aviso de servidor lento. O aviso só aparece se a requisição ainda
 * estiver ativa depois do limite; ao concluir, o temporizador é cancelado e o
 * aviso é removido. Requisições simultâneas compartilham o mesmo indicador.
 */
function criarAvisoServidor(el, limite = LIMITE_AVISO_SERVIDOR) {
  let ativos = 0;
  let temporizador = null;
  let visivel = false;

  function mostrar() {
    visivel = true;
    el.avisoServidor.hidden = false;
  }

  function esconder() {
    visivel = false;
    el.avisoServidor.hidden = true;
  }

  return {
    iniciar() {
      ativos += 1;
      if (ativos === 1) {
        temporizador = setTimeout(() => {
          temporizador = null;
          if (ativos > 0) {
            mostrar();
          }
        }, limite);
      }

      let concluido = false;
      return () => {
        if (concluido) {
          return;
        }
        concluido = true;
        ativos = Math.max(0, ativos - 1);

        if (ativos === 0) {
          if (temporizador !== null) {
            clearTimeout(temporizador);
            temporizador = null;
          }
          if (visivel) {
            esconder();
          }
        }
      };
    },
  };
}

/* ------------------------------------------------------------------------- */
/* Interface                                                                  */
/* ------------------------------------------------------------------------- */

function iniciarInterface() {
  const el = {
    grupoTipoNumero: document.getElementById('grupo-tipo-numero'),
    seletorTipoNumero: document.getElementById('seletor-tipo-numero'),
    seletorOperacao: document.getElementById('seletor-operacao'),
    seletorDificuldade: document.getElementById('seletor-dificuldade'),
    progresso: document.getElementById('progresso'),
    barraProgresso: document.getElementById('barra-progresso'),
    progressoPreenchimento: document.getElementById('progresso-preenchimento'),
    progressoNivel: document.getElementById('progresso-nivel'),
    progressoAcertos: document.getElementById('progresso-acertos'),
    progressoLegenda: document.getElementById('progresso-legenda'),
    btnNovaQuestao: document.getElementById('btn-nova-questao'),
    btnValidar: document.getElementById('btn-validar'),
    btnRecarregar: document.getElementById('btn-recarregar'),
    placeholder: document.getElementById('placeholder'),
    placeholderIcone: document.getElementById('placeholder-icone'),
    placeholderTexto: document.getElementById('placeholder-texto'),
    conta: document.getElementById('conta'),
    dica: document.getElementById('dica'),
    jogador: document.getElementById('jogador'),
    pontos: document.getElementById('pontos'),
    sequencia: document.getElementById('sequencia'),
    aviso: document.getElementById('aviso'),
    avisoServidor: document.getElementById('aviso-servidor'),
    confete: document.getElementById('confete'),
    modalNome: document.getElementById('modal-nome'),
    formNome: document.getElementById('form-nome'),
    inputNome: document.getElementById('input-nome'),
    nomeErro: document.getElementById('nome-erro'),
    modal: document.getElementById('modal'),
    modalEmoji: document.getElementById('modal-emoji'),
    modalTitulo: document.getElementById('modal-titulo'),
    modalMensagem: document.getElementById('modal-mensagem'),
    modalPontos: document.getElementById('modal-pontos'),
    modalProxima: document.getElementById('modal-proxima'),
    modalFechar: document.getElementById('modal-fechar'),
  };

  const estado = {
    operacao: 'SOMA',
    dificuldade: 'FACIL',
    tipoNumero: TIPO_NUMERO_PADRAO,
    jogador: '',
    questao: null,
    emprestimos: new Set(),
    pontos: 0,
    sequencia: 0,
    progresso: 0,
    carregando: false,
    validando: false,
    questaoRespondida: false,
    pedido: 0,
    multiplicacaoDificil: null,
    multiplicacaoDecimal: null,
    casasDecimaisResultado: 0,
    somaDificil: null,
    subtracaoDificil: null,
    divisaoDificil: null,
    divisaoDecimal: null,
    dicaProgressiva: null,
    avisoServidor: criarAvisoServidor(el),
  };

  estado.dicaProgressiva = criarDicaProgressiva({
    raiz: el.conta,
    tempoInatividade: TEMPO_INATIVIDADE_DICA,
    obterSeletores: () => seletoresDicaAtual(estado, el),
  });

  aplicarPreferencias(estado, typeof window !== 'undefined' ? window.location.search : '');
  aplicarTemaOperacao(estado.operacao);
  atualizarSegmentado(el.seletorOperacao, estado.operacao);
  atualizarNiveisDificuldade(estado, el);
  atualizarTipoNumero(estado, el);
  carregarPlacar(estado, el);
  configurarNomeJogador(estado, el);

  el.seletorOperacao.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-operacao]');
    if (!botao) {
      return;
    }
    estado.operacao = botao.dataset.operacao;
    aplicarTemaOperacao(estado.operacao);
    atualizarSegmentado(el.seletorOperacao, estado.operacao);
    atualizarNiveisDificuldade(estado, el);
    atualizarTipoNumero(estado, el);
    carregarQuestao(estado, el);
  });

  el.seletorTipoNumero.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-tipo-numero]');
    if (!botao) {
      return;
    }
    estado.tipoNumero = botao.dataset.tipoNumero;
    atualizarSegmentado(el.seletorTipoNumero, estado.tipoNumero);
    carregarQuestao(estado, el);
  });

  el.seletorDificuldade.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-dificuldade]');
    if (!botao) {
      return;
    }
    if (estado.dificuldade !== botao.dataset.dificuldade) {
      estado.dificuldade = botao.dataset.dificuldade;
      estado.sequencia = 0;
      estado.progresso = 0;
      salvarPlacar(estado);
      atualizarPlacarVisual(estado, el);
      atualizarBarraProgresso(estado, el);
    }
    atualizarSegmentado(el.seletorDificuldade, estado.dificuldade);
    carregarQuestao(estado, el);
  });

  el.btnNovaQuestao.addEventListener('click', () => carregarQuestao(estado, el));
  el.btnRecarregar.addEventListener('click', () => carregarQuestao(estado, el));
  el.btnValidar.addEventListener('click', () => validarResposta(estado, el));

  const reiniciarDica = () => {
    if (estado.questao) {
      estado.dicaProgressiva.reiniciar();
    }
  };
  el.conta.addEventListener('input', reiniciarDica);
  el.conta.addEventListener('focusin', reiniciarDica);

  el.modalProxima.addEventListener('click', () => {
    fecharModal(el);
    carregarQuestao(estado, el);
  });
  el.modalFechar.addEventListener('click', () => fecharModal(el));
  el.modal.addEventListener('click', (evento) => {
    if (evento.target === el.modal) {
      fecharModal(el);
    }
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !el.modal.hidden) {
      fecharModal(el);
    }
  });

  carregarQuestao(estado, el);
}

function aplicarPreferencias(estado, busca) {
  const parametros = new URLSearchParams(busca || '');
  const operacao = parametros.get('operacao');
  const dificuldade = parametros.get('dificuldade');
  const tipoNumero = parametros.get('tipoNumero');

  if (operacao === 'SOMA' || operacao === 'SUBTRACAO' || operacao === 'MULTIPLICACAO'
    || operacao === 'DIVISAO') {
    estado.operacao = operacao;
  }
  const aceitaDificil = estado.operacao === 'SOMA'
    || estado.operacao === 'SUBTRACAO'
    || estado.operacao === 'MULTIPLICACAO'
    || estado.operacao === 'DIVISAO';
  if (dificuldade === 'FACIL' || dificuldade === 'MEDIO'
    || (dificuldade === 'DIFICIL' && aceitaDificil)) {
    estado.dificuldade = dificuldade;
  }
  if ((tipoNumero === 'INTEIROS' || tipoNumero === 'DECIMAIS')
    && (estado.operacao === 'SOMA'
      || estado.operacao === 'SUBTRACAO'
      || estado.operacao === 'MULTIPLICACAO'
      || estado.operacao === 'DIVISAO')) {
    estado.tipoNumero = tipoNumero;
  }
  return estado;
}

function atualizarTipoNumero(estado, el) {
  const disponivel = estado.operacao === 'SOMA'
    || estado.operacao === 'SUBTRACAO'
    || estado.operacao === 'MULTIPLICACAO'
    || estado.operacao === 'DIVISAO';
  if (el.grupoTipoNumero) {
    el.grupoTipoNumero.hidden = !disponivel;
  }
  if (el.seletorTipoNumero) {
    atualizarSegmentado(el.seletorTipoNumero, estado.tipoNumero);
  }
}

function atualizarNiveisDificuldade(estado, el) {
  const niveis = niveisDificuldade(estado.operacao);
  estado.dificuldade = dificuldadePermitida(estado.dificuldade, estado.operacao);
  el.seletorDificuldade.querySelectorAll('[data-dificuldade]').forEach((botao) => {
    botao.hidden = !niveis.includes(botao.dataset.dificuldade);
  });
  atualizarSegmentado(el.seletorDificuldade, estado.dificuldade);
}

function atualizarSegmentado(container, valor) {
  const chaves = {
    'seletor-operacao': { atributo: 'operacao', chave: 'operacao' },
    'seletor-dificuldade': { atributo: 'dificuldade', chave: 'dificuldade' },
    'seletor-tipo-numero': { atributo: 'tipo-numero', chave: 'tipoNumero' },
  };
  const config = chaves[container.id] ?? chaves['seletor-dificuldade'];
  container.querySelectorAll('[data-' + config.atributo + ']').forEach((botao) => {
    const ativo = botao.dataset[config.chave] === valor;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
}

function atualizarControles(estado, el) {
  const ocupado = estado.carregando || estado.validando;
  const respondida = Boolean(estado.questaoRespondida);
  const desabilitarResposta = ocupado || respondida;

  [el.seletorOperacao, el.seletorDificuldade, el.seletorTipoNumero].forEach((container) => {
    if (!container) {
      return;
    }
    container.querySelectorAll('button').forEach((botao) => {
      botao.disabled = ocupado;
    });
  });

  if (el.btnNovaQuestao) {
    el.btnNovaQuestao.disabled = ocupado;
  }
  if (el.btnRecarregar) {
    el.btnRecarregar.disabled = ocupado;
  }
  const aguardandoIgualdadeDecimal = ehDivisaoDecimal(estado.questao)
    && !divisaoDecimalEquivalente(estado.questao);
  if (el.btnValidar) {
    el.btnValidar.disabled = desabilitarResposta
      || !estado.questao
      || aguardandoIgualdadeDecimal;
  }
  if (el.conta) {
    el.conta.querySelectorAll('button, input').forEach((controle) => {
      controle.disabled = desabilitarResposta;
    });
  }
}

function atualizarNomeJogador(estado, el) {
  const nome = normalizarNomeJogador(estado.jogador);
  if (el.jogador) {
    el.jogador.textContent = nome || '—';
    el.jogador.title = nome;
  }
}

function abrirModalNome(el) {
  el.nomeErro.hidden = true;
  el.inputNome.value = '';
  el.modalNome.hidden = false;
  window.setTimeout(() => el.inputNome.focus(), 0);
}

function fecharModalNome(el) {
  el.modalNome.hidden = true;
}

function configurarNomeJogador(estado, el) {
  estado.jogador = lerNomeJogador();
  atualizarNomeJogador(estado, el);

  if (!estado.jogador) {
    abrirModalNome(el);
  }

  el.formNome.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!nomeJogadorValido(el.inputNome.value)) {
      el.nomeErro.hidden = false;
      el.inputNome.focus();
      return;
    }
    estado.jogador = salvarNomeJogador(el.inputNome.value);
    atualizarNomeJogador(estado, el);
    fecharModalNome(el);
    el.btnNovaQuestao.focus();
  });

  el.inputNome.addEventListener('input', () => {
    if (!el.nomeErro.hidden) {
      el.nomeErro.hidden = true;
    }
  });
}

async function carregarQuestao(estado, el) {
  if (!podeIniciarQuestao(estado)) {
    return;
  }

  estado.dicaProgressiva?.parar();
  estado.carregando = true;
  estado.questaoRespondida = false;
  const pedido = estado.pedido + 1;
  estado.pedido = pedido;
  atualizarControles(estado, el);
  mostrarPlaceholder(el, 'Buscando um desafio...', false);
  const concluirAviso = estado.avisoServidor.iniciar();

  try {
    let url = API_BASE + '/proxima-questao?operacao='
      + encodeURIComponent(estado.operacao)
      + '&dificuldade=' + encodeURIComponent(estado.dificuldade);
    if (estado.operacao === 'SOMA'
      || estado.operacao === 'SUBTRACAO'
      || estado.operacao === 'MULTIPLICACAO'
      || estado.operacao === 'DIVISAO') {
      url += '&tipoNumero=' + encodeURIComponent(estado.tipoNumero);
    }
    const resposta = await fetch(url);

    if (pedido !== estado.pedido) {
      return;
    }
    if (!resposta.ok) {
      throw new Error('O servidor respondeu ' + resposta.status);
    }

    estado.questao = await resposta.json();
    estado.emprestimos = new Set();
    estado.multiplicacaoDificil = null;
    estado.multiplicacaoDecimal = null;
    estado.casasDecimaisResultado = 0;
    estado.somaDificil = null;
    estado.subtracaoDificil = null;
    estado.divisaoDificil = null;
    estado.divisaoDecimal = null;
    estado.progresso = calcularProgresso(estado.sequencia);
    esconderPlaceholder(el);
    atualizarBarraProgresso(estado, el);
    renderConta(estado, el);
    atualizarDica(estado, el);
    estado.dicaProgressiva.iniciar();
  } catch (erro) {
    console.error(erro);
    if (pedido !== estado.pedido) {
      return;
    }
    estado.questao = null;
    estado.multiplicacaoDificil = null;
    estado.multiplicacaoDecimal = null;
    estado.casasDecimaisResultado = 0;
    estado.somaDificil = null;
    estado.subtracaoDificil = null;
    estado.divisaoDificil = null;
    estado.divisaoDecimal = null;
    mostrarPlaceholder(
      el,
      'Não consegui carregar a questão. O servidor está rodando na porta 8080?',
      true,
    );
    el.dica.textContent = 'Dica: inicie o backend com ./mvnw spring-boot:run';
  } finally {
    concluirAviso();
    if (pedido === estado.pedido) {
      estado.carregando = false;
      atualizarControles(estado, el);
    }
  }
}

function mostrarPlaceholder(el, texto, comErro) {
  el.conta.hidden = true;
  el.placeholder.hidden = false;
  el.placeholderTexto.textContent = texto;
  el.placeholderIcone.textContent = comErro ? '🔌' : '🧮';
  el.btnRecarregar.hidden = !comErro;
}

function esconderPlaceholder(el) {
  el.placeholder.hidden = true;
  el.conta.hidden = false;
}

function renderConta(estado, el) {
  const questao = estado.questao;
  const divisao = questao.operacao === 'DIVISAO';
  const multiplicacaoDificil = ehMultiplicacaoDificil(questao);
  const multiplicacaoDecimal = ehMultiplicacaoDecimal(questao);
  const subtracaoDificil = ehSubtracaoDificil(questao);
  const somaDecimal = ehSomaDecimal(questao);
  const subtracaoDecimal = ehSubtracaoDecimal(questao);
  estado.somaDificil = somaDecimal
    ? montarModeloSomaDecimal(
      questao.numeroA,
      questao.numeroB,
      questao.dificuldade,
      casasDecimaisMaximas(questao),
    )
    : (ehSomaDificil(questao)
      ? montarModeloSomaDificil(questao.numeroA, questao.numeroB, questao.dificuldade)
      : null);
  estado.subtracaoDificil = subtracaoDecimal
    ? montarModeloSubtracaoDecimal(
      questao.numeroA,
      questao.numeroB,
      questao.dificuldade,
      casasDecimaisMaximas(questao),
    )
    : (subtracaoDificil
      ? montarModeloSubtracaoDificil(questao.numeroA, questao.numeroB, questao.dificuldade)
      : null);
  const divisaoDecimalGuiada = ehDivisaoDecimal(questao)
    && !divisaoDecimalEquivalente(questao);
  el.conta.classList.toggle('conta-divisao', divisao);
  el.conta.classList.toggle('conta-divisao-decimal', divisaoDecimalGuiada);
  el.conta.classList.toggle('conta-multiplicacao-dificil', multiplicacaoDificil);
  el.conta.classList.toggle('conta-multiplicacao-decimal', multiplicacaoDecimal);
  el.conta.classList.toggle('conta-subtracao-dificil', subtracaoDificil);
  el.conta.classList.toggle('conta-subtracao-decimal', subtracaoDecimal);
  el.conta.classList.toggle(
    'conta-decimal',
    somaDecimal || subtracaoDecimal || multiplicacaoDecimal,
  );
  if (divisao) {
    estado.multiplicacaoDecimal = null;
    if (divisaoDecimalGuiada) {
      renderDivisaoDecimalGuia(estado, el);
      return;
    }
    renderDivisao(estado, el);
    return;
  }
  if (multiplicacaoDecimal) {
    renderMultiplicacaoDecimal(estado, el);
    return;
  }
  estado.multiplicacaoDecimal = null;
  if (multiplicacaoDificil) {
    renderMultiplicacaoDificil(estado, el);
    return;
  }
  if (somaDecimal) {
    renderSomaDecimal(estado, el);
    return;
  }
  if (subtracaoDecimal) {
    renderSubtracaoDecimal(estado, el);
    return;
  }

  const soma = questao.operacao === 'SOMA';
  const subtracao = questao.operacao === 'SUBTRACAO';
  const multiplicacao = questao.operacao === 'MULTIPLICACAO';
  const media = multiplicacao && questao.dificuldade === 'MEDIO';
  const digitosA = digitosDosOperandos(questao.dificuldade, questao.operacao);
  const digitosB = digitosDoMultiplicador(questao.dificuldade, questao.operacao);
  const colunas = quantidadeColunas(questao.dificuldade, questao.operacao);
  const colunaDaGrade = (indice) => colunas + 1 - indice;
  const carryMultiplicacao = media
    ? Number(questao.vaiUm ?? calcularVaiUmMultiplicacao(questao.numeroA, questao.numeroB))
    : 0;
  const centenaMultiplicacao = media
    && multiplicacaoPrecisaCentena(
      questao.numeroA,
      questao.numeroB,
      carryMultiplicacao,
    );
  const transportesSoma = soma
    ? calcularVaiUm(questao.numeroA, questao.numeroB)
    : [];
  const ordemFoco = multiplicacao
    ? ordemFocoMultiplicacao(
      colunas,
      carryMultiplicacao > 0,
      centenaMultiplicacao,
    )
    : (soma
      ? ordemFocoSoma(digitosA, transportesSoma)
      : (subtracaoDificil ? estado.subtracaoDificil.ordemFoco : []));

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas', String(colunas));

  if (soma) {
    const caixasVaiUm = quantidadeCaixasVaiUm(questao.dificuldade);
    for (let indice = 1; indice <= caixasVaiUm; indice += 1) {
      el.conta.appendChild(
        criarCaixaVaiUmSoma(indice, colunaDaGrade(indice), el, ordemFoco),
      );
    }
  } else if (media && carryMultiplicacao > 0) {
    el.conta.appendChild(
      criarCaixaVaiUmMultiplicacao(colunaDaGrade(1), el, ordemFoco),
    );
  }

  const digitosDeA = digitosDe(questao.numeroA);
  for (let indice = 0; indice < digitosA; indice += 1) {
    const podeEmprestar = subtracao && indice >= 1;
    el.conta.appendChild(criarCelulaOperandoA(
      indice,
      digitosDeA[indice] ?? 0,
      colunaDaGrade(indice),
      podeEmprestar,
      estado,
      el,
    ));
  }

  el.conta.appendChild(criarSinalConta(soma, subtracao));

  const valoresB = digitosDe(questao.numeroB);
  for (let indice = 0; indice < digitosB; indice += 1) {
    el.conta.appendChild(
      criarCelulaOperandoB(valoresB[indice] ?? 0, colunaDaGrade(indice), indice),
    );
  }

  const linha = document.createElement('div');
  linha.className = 'linha';
  linha.style.gridColumn = '2 / ' + (colunas + 2);
  linha.style.gridRow = '4';
  el.conta.appendChild(linha);

  const contexto = {
    el,
    ordemFoco,
    colunas,
    soma,
    multiplicacao,
    subtracaoDificil,
    multiplicacaoFlexivel: multiplicacao && colunas === 2,
  };
  for (let indice = 0; indice < colunas; indice += 1) {
    el.conta.appendChild(
      criarCampoResultado(indice, colunaDaGrade(indice), contexto),
    );
  }

  if (subtracao) {
    atualizarEmprestimos(estado, el);
  }

  if (subtracaoDificil && ordemFoco.length > 0) {
    const primeiro = ordemFoco[0];
    setTimeout(() => {
      const modalAberto = el.modalNome && !el.modalNome.hidden;
      if (!modalAberto && !el.conta.contains(document.activeElement)) {
        focarItemOrdem(el, primeiro);
      }
    }, 0);
  }
}

function criarVirgulaDecimal(colunaGrade, linha) {
  const virgula = document.createElement('span');
  virgula.className = 'virgula-decimal';
  virgula.textContent = ',';
  virgula.setAttribute('aria-hidden', 'true');
  virgula.style.gridColumn = String(colunaGrade);
  virgula.style.gridRow = String(linha);
  return virgula;
}

function renderSomaDecimal(estado, el) {
  const questao = estado.questao;
  const casas = casasDecimaisMaximas(questao);
  const digitos = digitosSomaDecimal(questao.dificuldade, casas);
  const colunasInteiras = colunasInteirasSomaDecimal(questao.dificuldade);
  const totalColunas = 1 + colunasInteiras + 1 + casas;
  const colunaVirgula = colunasInteiras + 2;
  const passos = calcularVaiUm(questao.numeroA, questao.numeroB);
  const ordemFoco = ordemFocoSoma(digitos, passos);
  const colunaDaGrade = (indice) => colunaGradeSomaDecimal(
    indice,
    questao.dificuldade,
    casas,
  );

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas-inteiras', String(colunasInteiras));
  el.conta.style.setProperty('--casas-decimais', String(casas));

  for (let indice = 1; indice < digitos; indice += 1) {
    el.conta.appendChild(criarCaixaVaiUmSoma(
      indice,
      colunaDaGrade(indice),
      el,
      ordemFoco,
      rotuloColunaDecimal(indice, casas),
    ));
  }

  const digitosA = digitosEscalados(questao.numeroA, digitos);
  for (let indice = 0; indice < digitos; indice += 1) {
    const celula = criarCelulaOperandoA(
      indice,
      digitosA[indice] ?? 0,
      colunaDaGrade(indice),
      false,
      estado,
      el,
    );
    if (ehZeroFantasmaDecimal(questao, 'A', indice, casas)) {
      celula.classList.add('zero-preenchimento');
    }
    el.conta.appendChild(celula);
  }

  el.conta.appendChild(criarSinalConta(true, false));

  const digitosB = digitosEscalados(questao.numeroB, digitos);
  for (let indice = 0; indice < digitos; indice += 1) {
    const celula = criarCelulaOperandoB(
      digitosB[indice] ?? 0,
      colunaDaGrade(indice),
      indice,
    );
    if (ehZeroFantasmaDecimal(questao, 'B', indice, casas)) {
      celula.classList.add('zero-preenchimento');
    }
    el.conta.appendChild(celula);
  }

  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 2));
  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 3));
  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 5));

  const linha = document.createElement('div');
  linha.className = 'linha';
  linha.style.gridColumn = '2 / ' + (totalColunas + 1);
  linha.style.gridRow = '4';
  el.conta.appendChild(linha);

  const contexto = {
    el,
    ordemFoco,
    colunas: digitos + 1,
    soma: true,
    multiplicacao: false,
    subtracaoDificil: false,
    multiplicacaoFlexivel: false,
    somaDecimal: true,
  };
  for (let indice = 0; indice <= digitos; indice += 1) {
    el.conta.appendChild(criarCampoResultado(
      indice,
      colunaDaGrade(indice),
      contexto,
      rotuloColunaDecimal(indice, casas),
    ));
  }
}

function renderSubtracaoDecimal(estado, el) {
  const questao = estado.questao;
  const casas = casasDecimaisMaximas(questao);
  const modelo = estado.subtracaoDificil ?? montarModeloSubtracaoDecimal(
    questao.numeroA,
    questao.numeroB,
    questao.dificuldade,
    casas,
  );
  const colunasInteiras = modelo.colunasInteiras;
  const digitos = modelo.digitos;
  const totalColunas = 1 + colunasInteiras + 1 + casas;
  const colunaVirgula = colunasInteiras + 2;
  const ordemFoco = modelo.ordemFoco;
  const colunaDaGrade = (indice) => colunaGradeDecimal(
    indice,
    colunasInteiras,
    casas,
  );

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas-inteiras', String(colunasInteiras));
  el.conta.style.setProperty('--casas-decimais', String(casas));

  const digitosA = digitosEscalados(questao.numeroA, digitos);
  for (let indice = 0; indice < digitos; indice += 1) {
    const celula = criarCelulaOperandoA(
      indice,
      digitosA[indice] ?? 0,
      colunaDaGrade(indice),
      indice >= 1,
      estado,
      el,
      rotuloColunaDecimal(indice - 1, casas),
    );
    if (ehZeroFantasmaDecimal(questao, 'A', indice, casas)) {
      celula.classList.add('zero-preenchimento');
    }
    el.conta.appendChild(celula);
  }

  el.conta.appendChild(criarSinalConta(false, true));

  const digitosB = digitosEscalados(questao.numeroB, digitos);
  for (let indice = 0; indice < digitos; indice += 1) {
    const vazio = !digitoDecimalPreenchido(questao.numeroB, indice);
    const celula = criarCelulaOperandoB(
      vazio ? '' : (digitosB[indice] ?? 0),
      colunaDaGrade(indice),
      indice,
      vazio,
    );
    if (ehZeroFantasmaDecimal(questao, 'B', indice, casas)) {
      celula.classList.add('zero-preenchimento');
    }
    el.conta.appendChild(celula);
  }

  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 2));
  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 3));
  el.conta.appendChild(criarVirgulaDecimal(colunaVirgula, 5));

  const linha = document.createElement('div');
  linha.className = 'linha';
  linha.style.gridColumn = '2 / ' + (totalColunas + 1);
  linha.style.gridRow = '4';
  el.conta.appendChild(linha);

  const contexto = {
    el,
    ordemFoco,
    colunas: digitos,
    soma: false,
    somaDecimal: false,
    multiplicacao: false,
    subtracaoDificil: true,
    multiplicacaoFlexivel: false,
  };
  for (let indice = 0; indice < digitos; indice += 1) {
    el.conta.appendChild(criarCampoResultado(
      indice,
      colunaDaGrade(indice),
      contexto,
      rotuloColunaDecimal(indice, casas),
    ));
  }

  atualizarEmprestimos(estado, el);

  if (ordemFoco.length > 0) {
    const primeiro = ordemFoco[0];
    setTimeout(() => {
      const modalAberto = el.modalNome && !el.modalNome.hidden;
      if (!modalAberto && !el.conta.contains(document.activeElement)) {
        focarItemOrdem(el, primeiro);
      }
    }, 0);
  }
}

function colunaGradeMultiplicacao(coluna, colunas) {
  return colunas + 1 - coluna;
}

function criarLinhaMultiplicacaoDificil(linha, colunas) {
  const elemento = document.createElement('div');
  elemento.className = 'linha linha-multiplicacao-dificil';
  elemento.style.gridColumn = '2 / ' + (colunas + 2);
  elemento.style.gridRow = String(linha);
  return elemento;
}

function criarCelulaEstaticaMultiplicacaoDificil(
  coluna,
  digito,
  linha,
  colunas,
  nomeLinha,
) {
  const celula = document.createElement('div');
  celula.className = 'celula-digito celula-multiplicacao-dificil';
  celula.dataset.coluna = String(coluna);
  celula.dataset.linha = nomeLinha;
  celula.style.gridColumn = String(colunaGradeMultiplicacao(coluna, colunas));
  celula.style.gridRow = String(linha);
  celula.textContent = String(digito);
  return celula;
}

function colunaZeroFantasmaParcelaUnidade(digitos, colunas) {
  const totalColunas = Math.max(1, Math.trunc(Number(colunas) || 1));
  const preenchidas = Array.isArray(digitos) ? digitos.length : 0;
  return preenchidas > 0 && preenchidas < totalColunas ? preenchidas : null;
}

function criarZeroFantasmaMultiplicacaoDificil(coluna, linha, colunas) {
  const zero = document.createElement('span');
  zero.className = 'zero-fantasma-multiplicacao';
  zero.textContent = '0';
  zero.setAttribute('aria-hidden', 'true');
  zero.style.gridColumn = String(colunaGradeMultiplicacao(coluna, colunas));
  zero.style.gridRow = String(linha);
  return zero;
}

function configurarCampoMultiplicacaoDificil(campo, alvo, contexto) {
  const { el, ordemFoco } = contexto;

  campo.dataset.tipo = alvo.tipo;

  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(-1);
    contexto.aoAlterar?.();
    if (campo.value === '') {
      return;
    }
    focarProximoMultiplicacao(el, ordemFoco, alvo, { flexivel: false });
  });

  campo.addEventListener('keydown', (evento) => {
    tratarTeclaFluxoFoco(evento, {
      el,
      ordemFoco,
      alvo,
      campo,
      aoConfirmar: () => el.btnValidar.click(),
    });
  });
}

function criarCampoResultadoMultiplicacaoDificil(
  coluna,
  linha,
  nomeLinha,
  contexto,
) {
  const { modelo, el } = contexto;
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.className = 'resultado-input resultado-input-dificil';
  campo.dataset.coluna = String(coluna);
  campo.dataset.linha = nomeLinha;
  campo.maxLength = 1;
  campo.inputMode = 'numeric';
  campo.autocomplete = 'off';
  campo.setAttribute(
    'aria-label',
    'Resultado da multiplicação na coluna das '
      + (ROTULOS_COLUNA[coluna] ?? 'milhares'),
  );
  campo.style.gridColumn = String(colunaGradeMultiplicacao(coluna, modelo.colunas));
  campo.style.gridRow = String(linha);

  configurarCampoMultiplicacaoDificil(
    campo,
    { tipo: 'resultado', linha: nomeLinha, coluna },
    contexto,
  );
  return campo;
}

function criarCaixaTransporteMultiplicacaoDificil(coluna, linha, nomeLinha, contexto) {
  const { modelo, el } = contexto;
  const caixa = document.createElement('input');
  caixa.type = 'text';
  caixa.className = 'caixa-vai-um caixa-vai-um-dificil';
  caixa.dataset.coluna = String(coluna);
  caixa.dataset.linha = nomeLinha;
  caixa.maxLength = 1;
  caixa.inputMode = 'numeric';
  caixa.autocomplete = 'off';
  caixa.placeholder = '·';
  caixa.setAttribute(
    'aria-label',
    'Vai um para a coluna das ' + (ROTULOS_COLUNA[coluna] ?? 'milhares'),
  );
  caixa.style.gridColumn = String(colunaGradeMultiplicacao(coluna, modelo.colunas));
  caixa.style.gridRow = String(linha);

  configurarCampoMultiplicacaoDificil(
    caixa,
    { tipo: 'vaiUm', linha: nomeLinha, coluna },
    contexto,
  );
  return caixa;
}

function seletorCampoMultiplicacaoDificil(alvo) {
  const base = alvo.tipo === 'vaiUm' ? '.caixa-vai-um' : '.resultado-input';
  return base
    + '[data-coluna="' + alvo.coluna + '"]'
    + '[data-linha="' + alvo.linha + '"]';
}

function renderMultiplicacaoDificil(estado, el) {
  const modelo = montarModeloMultiplicacaoDificil(
    estado.questao.numeroA,
    estado.questao.numeroB,
  );
  const linhas = modelo.linhas;
  const contexto = {
    el,
    modelo,
    ordemFoco: modelo.ordemFoco,
  };
  estado.multiplicacaoDificil = modelo;

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas', String(modelo.colunas));

  Object.entries(modelo.carriesUnidade).forEach(([coluna]) => {
    el.conta.appendChild(criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carryUnidade,
      'carryUnidade',
      contexto,
    ));
  });
  Object.entries(modelo.carriesDezena).forEach(([coluna]) => {
    el.conta.appendChild(criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carryDezena,
      'carryDezena',
      contexto,
    ));
  });

  const sinal = document.createElement('span');
  sinal.className = 'sinal';
  sinal.textContent = '×';
  sinal.style.gridColumn = '1';
  sinal.style.gridRow = String(linhas.operandoB);
  el.conta.appendChild(sinal);

  modelo.digitosA.forEach((digito, coluna) => {
    el.conta.appendChild(criarCelulaEstaticaMultiplicacaoDificil(
      coluna,
      digito,
      linhas.operandoA,
      modelo.colunas,
      'operandoA',
    ));
  });
  modelo.digitosB.forEach((digito, coluna) => {
    el.conta.appendChild(criarCelulaEstaticaMultiplicacaoDificil(
      coluna,
      digito,
      linhas.operandoB,
      modelo.colunas,
      'operandoB',
    ));
  });

  el.conta.appendChild(criarLinhaMultiplicacaoDificil(linhas.linhaParcial, modelo.colunas));

  Object.entries(modelo.carriesSoma).forEach(([coluna]) => {
    el.conta.appendChild(criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carrySoma,
      'carrySoma',
      contexto,
    ));
  });
  const colunaZeroUnidade = colunaZeroFantasmaParcelaUnidade(
    modelo.digitosUnidade,
    modelo.colunas,
  );
  if (colunaZeroUnidade !== null) {
    el.conta.appendChild(criarZeroFantasmaMultiplicacaoDificil(
      colunaZeroUnidade,
      linhas.resultadoUnidade,
      modelo.colunas,
    ));
  }
  modelo.digitosUnidade.forEach((_, coluna) => {
    el.conta.appendChild(criarCampoResultadoMultiplicacaoDificil(
      coluna,
      linhas.resultadoUnidade,
      'resultadoUnidade',
      contexto,
    ));
  });

  el.conta.appendChild(criarZeroFantasmaMultiplicacaoDificil(
    0,
    linhas.resultadoDezena,
    modelo.colunas,
  ));
  modelo.digitosDezena.forEach((_, coluna) => {
    if (coluna === 0) {
      return;
    }
    el.conta.appendChild(criarCampoResultadoMultiplicacaoDificil(
      coluna,
      linhas.resultadoDezena,
      'resultadoDezena',
      contexto,
    ));
  });

  el.conta.appendChild(criarLinhaMultiplicacaoDificil(linhas.linhaFinal, modelo.colunas));

  modelo.digitosSoma.forEach((_, coluna) => {
    el.conta.appendChild(criarCampoResultadoMultiplicacaoDificil(
      coluna,
      linhas.resultadoSoma,
      'resultadoSoma',
      contexto,
    ));
  });

  modelo.ordemFoco.forEach((alvo, indice) => {
    const campo = el.conta.querySelector(seletorCampoMultiplicacaoDificil(alvo));
    if (campo) {
      campo.tabIndex = indice + 1;
    }
  });

  const primeiro = modelo.ordemFoco[0];
  if (primeiro) {
    setTimeout(() => {
      if (!el.conta.contains(document.activeElement)) {
        focarItemOrdem(el, primeiro);
      }
    }, 0);
  }
}

function criarCelulaOperandoMultiplicacaoDecimal(
  indice,
  digito,
  casasOperando,
  linha,
  modelo,
  nomeLinha,
) {
  const celula = criarCelulaEstaticaMultiplicacaoDificil(
    indice,
    digito,
    linha,
    0,
    nomeLinha,
  );
  celula.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
    indice,
    casasOperando,
    modelo.colunaVirgula,
  ));
  return celula;
}

function criarZeroDecimalMultiplicacao(posicao, linha, modelo) {
  const zero = document.createElement('span');
  zero.className = 'zero-fantasma-multiplicacao zero-fantasma-decimal';
  zero.textContent = '0';
  zero.setAttribute('aria-hidden', 'true');
  zero.style.gridColumn = String(modelo.colunaVirgula + posicao);
  zero.style.gridRow = String(linha);
  return zero;
}

function criarResultadoDecimalMultiplicacao(
  coluna,
  linha,
  nomeLinha,
  contexto,
  comVirgula,
) {
  const { modelo } = contexto;
  const campo = criarCampoResultadoMultiplicacaoDificil(
    coluna,
    linha,
    nomeLinha,
    contexto,
  );
  campo.setAttribute(
    'aria-label',
    'Resultado da multiplicação: '
      + rotuloColunaDecimal(coluna, modelo.casasDecimais),
  );
  const colunaGrade = colunaGradeMultiplicacaoDecimal(
    coluna,
    modelo.casasDecimais,
    modelo.colunaVirgula,
  );

  if (!comVirgula) {
    campo.style.gridColumn = String(colunaGrade);
    return campo;
  }

  const celula = document.createElement('div');
  celula.className = 'celula-resultado-decimal';
  celula.dataset.linha = nomeLinha;
  celula.dataset.coluna = String(coluna);
  celula.style.gridColumn = String(colunaGrade);
  celula.style.gridRow = String(linha);
  campo.style.gridColumn = '';
  campo.style.gridRow = '';
  celula.appendChild(campo);
  return celula;
}

function resultadoMultiplicacaoDecimalDigitado(el, modelo) {
  if (!el || !el.conta || !modelo) {
    return null;
  }
  const campos = Array.from(el.conta.querySelectorAll(
    '.resultado-input[data-linha="resultadoSoma"]',
  )).sort((a, b) => Number(a.dataset.coluna) - Number(b.dataset.coluna));
  if (campos.length !== modelo.digitosSoma.length) {
    return null;
  }
  const valores = campos.map((campo) => String(campo.value ?? '').trim());
  if (valores.some((valor) => !/^\d$/.test(valor))) {
    return null;
  }
  return comporResultado(valores);
}

function atualizarVirgulaResultadoMultiplicacao(estado, el, modelo, ativo) {
  if (!el || !el.conta) {
    return;
  }
  el.conta
    .querySelectorAll('.virgula-resultado-escolhida')
    .forEach((virgula) => virgula.remove());

  const total = modelo.casasDecimais;
  const casas = Math.max(
    0,
    Math.min(total, Math.trunc(Number(estado.casasDecimaisResultado) || 0)),
  );
  estado.casasDecimaisResultado = casas;

  if (!ativo || casas < 1) {
    return;
  }

  const celula = el.conta.querySelector(
    '.celula-resultado-decimal[data-linha="resultadoSoma"]'
      + '[data-coluna="' + (casas - 1) + '"]',
  );
  if (!celula) {
    return;
  }

  const virgula = document.createElement('span');
  virgula.className = 'virgula-resultado-escolhida virgula-resultado-esquerda';
  virgula.textContent = ',';
  virgula.setAttribute('aria-hidden', 'true');
  celula.appendChild(virgula);
}

function criarControleVirgulaMultiplicacao(estado, el, modelo) {
  const controle = document.createElement('div');
  controle.className = 'controle-virgula-multiplicacao';
  controle.setAttribute('role', 'group');
  controle.setAttribute('aria-label', 'Posição da vírgula no resultado');

  const rotulo = document.createElement('span');
  rotulo.className = 'controle-virgula-rotulo';
  rotulo.textContent = 'Vírgula';

  const botaoMenos = document.createElement('button');
  botaoMenos.type = 'button';
  botaoMenos.className = 'controle-virgula-btn';
  botaoMenos.textContent = '−';
  botaoMenos.setAttribute('aria-label', 'Mover a vírgula para a esquerda');

  const valor = document.createElement('output');
  valor.className = 'controle-virgula-valor';
  valor.setAttribute('aria-live', 'polite');

  const botaoMais = document.createElement('button');
  botaoMais.type = 'button';
  botaoMais.className = 'controle-virgula-btn';
  botaoMais.textContent = '+';
  botaoMais.setAttribute('aria-label', 'Mover a vírgula para a direita');

  const seletor = document.createElement('input');
  seletor.type = 'range';
  seletor.className = 'controle-virgula-seletor';
  seletor.min = '0';
  seletor.max = String(modelo.casasDecimais);
  seletor.step = '1';
  seletor.setAttribute('aria-label', 'Quantidade de casas decimais no resultado');

  const limite = modelo.casasDecimais;
  const atualizarVisual = () => {
    const digitado = resultadoMultiplicacaoDecimalDigitado(el, modelo);
    const ativo = digitado !== null;
    const casas = Math.max(
      0,
      Math.min(limite, Math.trunc(Number(estado.casasDecimaisResultado) || 0)),
    );
    estado.casasDecimaisResultado = casas;

    controle.classList.toggle('controle-virgula-ativo', ativo);
    controle.classList.toggle('controle-virgula-inativo', !ativo);
    controle.setAttribute('aria-disabled', String(!ativo));
    valor.textContent = ativo
      ? (casas === 1 ? '1 casa' : casas + ' casas')
      : 'Aguardando a conta';
    seletor.value = String(casas);
    seletor.disabled = !ativo;
    botaoMenos.disabled = !ativo || casas <= 0;
    botaoMais.disabled = !ativo || casas >= limite;
    atualizarVirgulaResultadoMultiplicacao(estado, el, modelo, ativo);
  };
  const mover = (passo) => {
    if (resultadoMultiplicacaoDecimalDigitado(el, modelo) === null) {
      return;
    }
    estado.casasDecimaisResultado = Math.max(
      0,
      Math.min(limite, estado.casasDecimaisResultado + passo),
    );
    atualizarVisual();
  };

  botaoMenos.addEventListener('click', () => mover(-1));
  botaoMais.addEventListener('click', () => mover(1));
  seletor.addEventListener('input', () => {
    const casas = Number(seletor.value);
    if (!Number.isInteger(casas)) {
      return;
    }
    estado.casasDecimaisResultado = Math.max(0, Math.min(limite, casas));
    atualizarVisual();
  });
  controle.append(rotulo, botaoMenos, valor, botaoMais, seletor);
  controle.atualizar = atualizarVisual;
  atualizarVisual();
  return controle;
}

function renderMultiplicacaoDecimal(estado, el) {
  const questao = estado.questao;
  const modelo = montarModeloMultiplicacaoDecimal(
    questao.numeroA,
    questao.numeroB,
    questao.casasDecimaisA,
    questao.casasDecimaisB,
  );
  const linhas = modelo.linhas;
  const contexto = {
    el,
    modelo,
    ordemFoco: modelo.ordemFoco,
    aoAlterar: null,
  };
  estado.multiplicacaoDecimal = modelo;
  estado.multiplicacaoDificil = modelo;

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas-inteiras', String(modelo.colunasInteiras));
  el.conta.style.setProperty('--casas-decimais', String(modelo.casasDecimais));
  el.conta.style.setProperty('--colunas', String(modelo.colunasGrade - 2));

  Object.entries(modelo.carriesUnidade).forEach(([coluna]) => {
    const caixa = criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carryUnidade,
      'carryUnidade',
      contexto,
    );
    caixa.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
      Number(coluna),
      modelo.casasDecimais,
      modelo.colunaVirgula,
    ));
    caixa.setAttribute(
      'aria-label',
      'Vai um da multiplicação: '
        + rotuloColunaDecimal(Number(coluna), modelo.casasDecimais),
    );
    el.conta.appendChild(caixa);
  });
  Object.entries(modelo.carriesDezena).forEach(([coluna]) => {
    const caixa = criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carryDezena,
      'carryDezena',
      contexto,
    );
    caixa.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
      Number(coluna),
      modelo.casasDecimais,
      modelo.colunaVirgula,
    ));
    caixa.setAttribute(
      'aria-label',
      'Vai um da multiplicação: '
        + rotuloColunaDecimal(Number(coluna), modelo.casasDecimais),
    );
    el.conta.appendChild(caixa);
  });

  const sinal = document.createElement('span');
  sinal.className = 'sinal';
  sinal.textContent = '×';
  sinal.style.gridColumn = '1';
  sinal.style.gridRow = String(linhas.operandoB);
  el.conta.appendChild(sinal);

  modelo.digitosA.forEach((digito, indice) => {
    el.conta.appendChild(criarCelulaOperandoMultiplicacaoDecimal(
      indice,
      digito,
      modelo.casasDecimaisA,
      linhas.operandoA,
      modelo,
      'operandoA',
    ));
  });
  for (let posicao = modelo.casasDecimaisA + 1;
    posicao <= modelo.casasDecimais;
    posicao += 1) {
    el.conta.appendChild(criarZeroDecimalMultiplicacao(
      posicao,
      linhas.operandoA,
      modelo,
    ));
  }

  modelo.digitosB.forEach((digito, indice) => {
    el.conta.appendChild(criarCelulaOperandoMultiplicacaoDecimal(
      indice,
      digito,
      modelo.casasDecimaisB,
      linhas.operandoB,
      modelo,
      'operandoB',
    ));
  });
  for (let posicao = modelo.casasDecimaisB + 1;
    posicao <= modelo.casasDecimais;
    posicao += 1) {
    el.conta.appendChild(criarZeroDecimalMultiplicacao(
      posicao,
      linhas.operandoB,
      modelo,
    ));
  }

  el.conta.appendChild(criarVirgulaDecimal(modelo.colunaVirgula, linhas.operandoA));
  el.conta.appendChild(criarVirgulaDecimal(modelo.colunaVirgula, linhas.operandoB));

  el.conta.appendChild(criarLinhaMultiplicacaoDificil(
    linhas.linhaParcial,
    modelo.colunasGrade - 1,
  ));

  Object.entries(modelo.carriesSoma).forEach(([coluna]) => {
    const caixa = criarCaixaTransporteMultiplicacaoDificil(
      Number(coluna),
      linhas.carrySoma,
      'carrySoma',
      contexto,
    );
    caixa.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
      Number(coluna),
      modelo.casasDecimais,
      modelo.colunaVirgula,
    ));
    caixa.setAttribute(
      'aria-label',
      'Vai um da soma final: '
        + rotuloColunaDecimal(Number(coluna), modelo.casasDecimais),
    );
    el.conta.appendChild(caixa);
  });

  const colunaZeroUnidade = colunaZeroFantasmaParcelaUnidade(
    modelo.digitosUnidade,
    modelo.colunas,
  );
  if (colunaZeroUnidade !== null) {
    const zero = criarZeroFantasmaMultiplicacaoDificil(
      colunaZeroUnidade,
      linhas.resultadoUnidade,
      modelo.colunas,
    );
    zero.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
      colunaZeroUnidade,
      modelo.casasDecimais,
      modelo.colunaVirgula,
    ));
    el.conta.appendChild(zero);
  }
  modelo.digitosUnidade.forEach((_, coluna) => {
    el.conta.appendChild(criarResultadoDecimalMultiplicacao(
      coluna,
      linhas.resultadoUnidade,
      'resultadoUnidade',
      contexto,
      false,
    ));
  });

  const zeroDezena = criarZeroFantasmaMultiplicacaoDificil(
    0,
    linhas.resultadoDezena,
    modelo.colunas,
  );
  zeroDezena.style.gridColumn = String(colunaGradeMultiplicacaoDecimal(
    0,
    modelo.casasDecimais,
    modelo.colunaVirgula,
  ));
  el.conta.appendChild(zeroDezena);
  modelo.digitosDezena.forEach((_, coluna) => {
    if (coluna === 0) {
      return;
    }
    el.conta.appendChild(criarResultadoDecimalMultiplicacao(
      coluna,
      linhas.resultadoDezena,
      'resultadoDezena',
      contexto,
      false,
    ));
  });

  el.conta.appendChild(criarLinhaMultiplicacaoDificil(
    linhas.linhaFinal,
    modelo.colunasGrade - 1,
  ));

  modelo.digitosSoma.forEach((_, coluna) => {
    el.conta.appendChild(criarResultadoDecimalMultiplicacao(
      coluna,
      linhas.resultadoSoma,
      'resultadoSoma',
      contexto,
      true,
    ));
  });

  const controle = criarControleVirgulaMultiplicacao(estado, el, modelo);
  contexto.aoAlterar = () => controle.atualizar();
  controle.style.gridColumn = '1 / -1';
  controle.style.gridRow = String(linhas.resultadoSoma + 1);
  el.conta.appendChild(controle);

  modelo.ordemFoco.forEach((alvo, indice) => {
    const campo = el.conta.querySelector(seletorCampoMultiplicacaoDificil(alvo));
    if (campo) {
      campo.tabIndex = indice + 1;
    }
  });

  const primeiro = modelo.ordemFoco[0];
  if (primeiro) {
    setTimeout(() => {
      if (!el.conta.contains(document.activeElement)) {
        focarItemOrdem(el, primeiro);
      }
    }, 0);
  }
}

function criarCaixaVaiUmSoma(indice, colunaGrade, el, ordemFoco, rotulo) {
  const caixa = document.createElement('input');
  caixa.type = 'text';
  caixa.className = 'caixa-vai-um';
  caixa.dataset.tipo = 'vaiUm';
  caixa.dataset.coluna = String(indice);
  caixa.maxLength = 1;
  caixa.inputMode = 'numeric';
  caixa.autocomplete = 'off';
  caixa.placeholder = '·';
  caixa.setAttribute(
    'aria-label',
    'Vai um para a coluna: ' + (rotulo ?? ROTULOS_COLUNA[indice] ?? 'milhares'),
  );
  caixa.style.gridColumn = String(colunaGrade);
  caixa.style.gridRow = '1';

  caixa.addEventListener('input', () => {
    caixa.value = caixa.value.replace(/[^01]/g, '').slice(-1);
    if (caixa.value === '') {
      return;
    }
    const preenchidos = preenchidosNaOrdem(el, ordemFoco);
    let alvo = proximoItemVazioOrdem(
      ordemFoco, { tipo: 'vaiUm', coluna: indice }, preenchidos,
    );
    if (!alvo) {
      alvo = primeiroItemVazioOrdem(ordemFoco, preenchidos);
    }
    if (!focarItemOrdem(el, alvo)) {
      const resultadoAbaixo = el.conta.querySelector(
        '.resultado-input[data-coluna="' + indice + '"]',
      );
      if (resultadoAbaixo && String(resultadoAbaixo.value).trim() === '') {
        resultadoAbaixo.focus();
      }
    }
  });

  caixa.addEventListener('keydown', (evento) => {
    tratarTeclaVaiUm(evento, { el, ordemFoco, indice, caixa });
  });

  return caixa;
}

function criarCaixaVaiUmMultiplicacao(colunaGrade, el, ordemFoco) {
  const caixa = document.createElement('input');
  caixa.type = 'text';
  caixa.className = 'caixa-vai-um';
  caixa.dataset.coluna = '1';
  caixa.maxLength = 1;
  caixa.inputMode = 'numeric';
  caixa.autocomplete = 'off';
  caixa.placeholder = '·';
  caixa.setAttribute('aria-label', 'Vai um da multiplicação das unidades');
  caixa.style.gridColumn = String(colunaGrade);
  caixa.style.gridRow = '1';

  caixa.addEventListener('input', () => {
    caixa.value = caixa.value.replace(/\D/g, '').slice(-1);
    if (caixa.value !== '') {
      focarProximoMultiplicacao(el, ordemFoco, { tipo: 'vaiUm', coluna: 1 });
    }
  });

  return caixa;
}

function criarCelulaOperandoA(
  indice,
  digito,
  colunaGrade,
  podeEmprestar,
  estado,
  el,
  rotuloEmprestimo,
) {
  const celula = podeEmprestar
    ? document.createElement('button')
    : document.createElement('div');
  if (podeEmprestar) {
    celula.type = 'button';
  }
  celula.className = 'celula-digito' + (podeEmprestar ? ' clicavel' : '');
  celula.dataset.tipo = 'operandoA';
  celula.dataset.coluna = String(indice);
  celula.style.gridColumn = String(colunaGrade);
  celula.style.gridRow = '2';

  const conteudo = document.createElement('span');
  conteudo.className = 'digito';

  const umEmprestado = document.createElement('span');
  umEmprestado.className = 'um-emprestado';
  umEmprestado.textContent = '1';
  umEmprestado.setAttribute('aria-hidden', 'true');
  umEmprestado.hidden = true;

  const valorDoDigito = document.createElement('span');
  valorDoDigito.className = 'digito-valor';
  valorDoDigito.textContent = String(digito);

  conteudo.append(umEmprestado, valorDoDigito);
  celula.appendChild(conteudo);

  const risco = document.createElement('span');
  risco.className = 'risco';
  risco.setAttribute('aria-hidden', 'true');
  risco.hidden = true;
  celula.appendChild(risco);

  const valorEmprestado = document.createElement('span');
  valorEmprestado.className = 'valor-emprestado';
  valorEmprestado.setAttribute('aria-hidden', 'true');
  valorEmprestado.hidden = true;
  celula.appendChild(valorEmprestado);

  if (podeEmprestar) {
    celula.setAttribute('aria-pressed', 'false');
    celula.setAttribute(
      'aria-label',
      'Pedir emprestado para a coluna das '
        + (rotuloEmprestimo ?? ROTULOS_COLUNA[indice - 1] ?? 'unidades'),
    );
    celula.addEventListener('click', () => {
      if (estado.emprestimos.has(indice)) {
        estado.emprestimos.delete(indice);
      } else {
        estado.emprestimos.add(indice);
      }
      atualizarEmprestimos(estado, el);
    });
  }

  return celula;
}

function criarCelulaOperandoB(digito, colunaGrade, indice, vazio = false) {
  const celula = document.createElement('div');
  celula.className = 'celula-digito' + (vazio ? ' celula-vazia' : '');
  celula.dataset.tipo = 'operandoB';
  if (Number.isInteger(indice)) {
    celula.dataset.coluna = String(indice);
  }
  celula.style.gridColumn = String(colunaGrade);
  celula.style.gridRow = '3';

  const conteudo = document.createElement('span');
  conteudo.className = 'digito';
  conteudo.textContent = vazio ? '' : String(digito);
  celula.appendChild(conteudo);
  return celula;
}

function criarSinalConta(soma, subtracao) {
  const sinal = document.createElement('span');
  sinal.className = 'sinal';
  sinal.textContent = soma ? '+' : (subtracao ? '−' : '×');
  sinal.style.gridColumn = '1';
  sinal.style.gridRow = '3';
  return sinal;
}

function resultadosPreenchidos(el, colunas) {
  const preenchidas = [];
  for (let coluna = 0; coluna < colunas; coluna += 1) {
    const campo = el.conta.querySelector(
      '.resultado-input[data-coluna="' + coluna + '"]',
    );
    preenchidas.push(Boolean(campo && String(campo.value).trim() !== ''));
  }
  return preenchidas;
}

function configurarEntradaResultado(campo, indice, contexto) {
  const {
    el,
    ordemFoco,
    colunas,
    soma,
    somaDecimal,
    multiplicacao,
    subtracaoDificil,
    multiplicacaoFlexivel,
  } = contexto;

  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(-1);
    if (campo.value === '') {
      return;
    }

    if (soma && !somaDecimal && indice > 0) {
      const colunaDireita = proximaColunaResultadoADireita(
        indice,
        resultadosPreenchidos(el, colunas),
      );
      if (colunaDireita !== null) {
        focarResultadoPorColuna(el, colunaDireita);
        return;
      }
    }

    if (soma) {
      const preenchidos = preenchidosNaOrdem(el, ordemFoco);
      let alvo = proximoItemVazioOrdem(
        ordemFoco, { tipo: 'resultado', coluna: indice }, preenchidos,
      );
      if (!alvo) {
        alvo = primeiroItemVazioOrdem(ordemFoco, preenchidos);
      }
      focarItemOrdem(el, alvo);
    } else if (multiplicacao) {
      focarProximoMultiplicacao(
        el,
        ordemFoco,
        { tipo: 'resultado', coluna: indice },
        { flexivel: multiplicacaoFlexivel },
      );
    } else if (subtracaoDificil) {
      const alvo = proximoItemOrdem(
        ordemFoco, { tipo: 'resultado', coluna: indice },
      );
      if (!focarItemOrdem(el, alvo)) {
        focarResultadoPorColuna(el, indice + 1);
      }
    } else {
      focarResultadoPorColuna(el, indice + 1);
    }
  });
}

function configurarTecladoResultado(campo, indice, contexto) {
  const {
    el,
    ordemFoco,
    colunas,
    soma,
    multiplicacao,
    subtracaoDificil,
  } = contexto;

  campo.addEventListener('keydown', (evento) => {
    const tratado = tratarTeclaResultado(evento, {
      el,
      ordemFoco,
      indice,
      colunas,
      usarOrdemFoco: soma || multiplicacao || subtracaoDificil,
      campo,
    });
    if (tratado) {
      return;
    }
    if (evento.key === 'Enter') {
      evento.preventDefault();
      el.btnValidar.click();
    }
  });
}

function criarCampoResultado(indice, colunaGrade, contexto, rotulo) {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.className = 'resultado-input';
  campo.dataset.tipo = 'resultado';
  campo.dataset.coluna = String(indice);
  campo.maxLength = 1;
  campo.inputMode = 'numeric';
  campo.autocomplete = 'off';
  campo.setAttribute(
    'aria-label',
    'Resultado na coluna: ' + (rotulo ?? ROTULOS_COLUNA[indice] ?? 'milhares'),
  );
  campo.style.gridColumn = String(colunaGrade);
  campo.style.gridRow = '5';

  configurarEntradaResultado(campo, indice, contexto);
  configurarTecladoResultado(campo, indice, contexto);
  return campo;
}

function quantidadeDigitos(valor) {
  return String(Math.abs(Math.trunc(Number(valor) || 0))).length;
}

function focarCampoDivisao(el, campo) {
  const seletor = SELETORES_CAMPOS_DIVISAO[campo];
  if (!seletor) {
    return;
  }
  const input = el.conta.querySelector('[data-campo="' + campo + '"]')
    ?? el.conta.querySelector(seletor);
  if (!input) {
    return;
  }
  input.focus();
  if (typeof input.scrollIntoView === 'function') {
    input.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

function criarCampoDivisao(classe, rotulo, digitos) {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.className = 'divisao-input ' + classe;
  campo.maxLength = digitos;
  campo.inputMode = 'numeric';
  campo.autocomplete = 'off';
  campo.setAttribute('aria-label', rotulo);
  campo.style.setProperty('--digitos-campo', String(digitos));
  return campo;
}

function configurarCampoDivisao(
  campo,
  nome,
  el,
  ordem = ORDEM_CAMPOS_DIVISAO,
) {
  campo.dataset.campo = nome;
  configurarEntradaCampoDivisao(campo, nome, el, ordem);
  configurarTecladoCampoDivisao(campo, nome, el, ordem);
}

function configurarEntradaCampoDivisao(campo, nome, el, ordem) {
  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(0, Number(campo.maxLength));
    if (campo.value.length >= Number(campo.maxLength)) {
      focarCampoDivisao(el, proximoCampoDivisao(nome, ordem));
    }
  });
}

function configurarTecladoCampoDivisao(campo, nome, el, ordem) {
  campo.addEventListener('keydown', (evento) => {
    tratarTeclaDivisao(evento, {
      campo,
      aoFocarAnterior: () => focarCampoDivisao(el, campoAnteriorDivisao(nome, ordem)),
      aoConfirmar: () => el.btnValidar.click(),
    });
  });
}

function criarRotuloDivisao(texto, classe) {
  const rotulo = document.createElement('span');
  rotulo.className = 'divisao-rotulo ' + classe;
  rotulo.textContent = texto;
  return rotulo;
}

function criarOperandoDivisao(valor, nome, rotulo, classeRotulo) {
  const operando = document.createElement('div');
  operando.className = 'divisao-operando divisao-operando-' + nome;
  const numero = document.createElement('div');
  numero.className = 'divisao-' + nome;
  numero.textContent = String(valor);
  numero.setAttribute('aria-label', rotulo + ' ' + valor);
  operando.append(criarRotuloDivisao(rotulo, classeRotulo), numero);
  return operando;
}

function criarPassoDivisaoDecimal(numero, texto, concluido, ativo) {
  const passo = document.createElement('div');
  passo.className = 'divisao-decimal-passo'
    + (concluido ? ' concluido' : '')
    + (ativo ? ' ativo' : '');
  const marcador = document.createElement('span');
  marcador.className = 'divisao-decimal-passo-numero';
  marcador.textContent = concluido ? '✓' : String(numero);
  marcador.setAttribute('aria-hidden', 'true');
  const rotulo = document.createElement('span');
  rotulo.className = 'divisao-decimal-passo-texto';
  rotulo.textContent = texto;
  passo.append(marcador, rotulo);
  return passo;
}

function criarOperandoDivisaoDecimal(valor, rotulo, casasAlvo, semVirgula) {
  const operando = document.createElement('div');
  operando.className = 'divisao-decimal-operando';
  const etiqueta = document.createElement('span');
  etiqueta.className = 'divisao-decimal-operando-rotulo';
  etiqueta.textContent = rotulo;
  const numero = document.createElement('span');
  numero.className = 'divisao-decimal-operando-valor';
  numero.textContent = semVirgula
    ? String(valor)
    : formatarComCasasDecimais(valor, casasAlvo);
  operando.append(etiqueta, numero);
  return operando;
}

function renderDivisaoDecimalGuia(estado, el) {
  const questao = estado.questao;
  const casasOriginaisA = Math.max(1, Number(questao.casasDecimaisA) || 1);
  const casasOriginaisB = Math.max(1, Number(questao.casasDecimaisB) || 1);
  const alvo = Math.max(casasOriginaisA, casasOriginaisB);

  if (!estado.divisaoDecimal || estado.divisaoDecimal.questaoId !== questao.id) {
    estado.divisaoDecimal = {
      questaoId: questao.id,
      casasA: casasOriginaisA,
      casasB: casasOriginaisB,
      alvo,
      equivalenciaVisivel: false,
    };
  }

  const dados = estado.divisaoDecimal;
  const valorA = questao.numeroA * (10 ** (dados.casasA - casasOriginaisA));
  const valorB = questao.numeroB * (10 ** (dados.casasB - casasOriginaisB));
  const casasIguais = dados.casasA === alvo && dados.casasB === alvo;
  const faltaA = alvo - dados.casasA;

  el.conta.innerHTML = '';
  const guia = document.createElement('div');
  guia.className = 'divisao-decimal-guia';

  const titulo = document.createElement('h3');
  titulo.className = 'divisao-decimal-titulo';
  titulo.textContent = 'Vamos preparar a divisão';

  const instrucao = document.createElement('p');
  instrucao.className = 'divisao-decimal-instrucao';
  instrucao.textContent = 'Iguale as casas decimais e elimine a vírgula para dividir.';

  const passos = document.createElement('div');
  passos.className = 'divisao-decimal-passos';
  passos.append(
    criarPassoDivisaoDecimal(1, 'Iguale as casas decimais', casasIguais, !casasIguais),
    criarPassoDivisaoDecimal(2, 'Elimine as vírgulas', dados.equivalenciaVisivel, casasIguais && !dados.equivalenciaVisivel),
    criarPassoDivisaoDecimal(3, 'Resolva a conta inteira', false, dados.equivalenciaVisivel),
  );

  const conta = document.createElement('div');
  conta.className = 'divisao-decimal-conta';
  conta.append(
    criarOperandoDivisaoDecimal(
      valorA,
      'Dividendo',
      dados.casasA,
      dados.equivalenciaVisivel,
    ),
    criarOperandoDivisaoDecimal(
      valorB,
      'Divisor',
      dados.casasB,
      dados.equivalenciaVisivel,
    ),
  );
  const sinal = document.createElement('span');
  sinal.className = 'divisao-decimal-sinal';
  sinal.textContent = '÷';
  sinal.setAttribute('aria-hidden', 'true');
  conta.insertBefore(sinal, conta.children[1]);

  const acoes = document.createElement('div');
  acoes.className = 'divisao-decimal-acoes';

  if (!casasIguais) {
    const btnZero = document.createElement('button');
    btnZero.type = 'button';
    btnZero.className = 'divisao-decimal-btn';
    const alvoZero = faltaA > 0 ? 'dividendo' : 'divisor';
    btnZero.textContent = 'Acrescentar zero no ' + alvoZero;
    btnZero.addEventListener('click', () => {
      if (faltaA > 0) {
        dados.casasA = Math.min(alvo, dados.casasA + 1);
      } else {
        dados.casasB = Math.min(alvo, dados.casasB + 1);
      }
      renderDivisaoDecimalGuia(estado, el);
      estado.dicaProgressiva?.reiniciar();
    });
    acoes.appendChild(btnZero);
  }

  const btnVirgulas = document.createElement('button');
  btnVirgulas.type = 'button';
  btnVirgulas.className = 'divisao-decimal-btn divisao-decimal-btn-principal';
  btnVirgulas.textContent = 'Eliminar as vírgulas';
  btnVirgulas.disabled = !casasIguais || dados.equivalenciaVisivel;
  btnVirgulas.addEventListener('click', () => {
    dados.equivalenciaVisivel = true;
    renderDivisaoDecimalGuia(estado, el);
    estado.dicaProgressiva?.reiniciar();
  });
  acoes.appendChild(btnVirgulas);

  if (dados.equivalenciaVisivel) {
    const equivalente = document.createElement('p');
    equivalente.className = 'divisao-decimal-equivalente';
    equivalente.textContent = 'Agora a conta é ' + valorA + ' ÷ ' + valorB
      + '. As vírgulas sumiram!';

    const btnAbrir = document.createElement('button');
    btnAbrir.type = 'button';
    btnAbrir.className = 'divisao-decimal-btn divisao-decimal-btn-abrir';
    btnAbrir.textContent = 'Abrir a conta';
    btnAbrir.addEventListener('click', () => {
      const original = estado.questao;
      estado.questao = {
        ...original,
        numeroA: Number(original.dividendoEquivalente),
        numeroB: Number(original.divisorEquivalente),
        tipoNumero: 'DECIMAIS',
        divisaoEquivalente: true,
      };
      estado.divisaoDecimal = null;
      renderConta(estado, el);
      atualizarDica(estado, el);
      atualizarControles(estado, el);
      estado.dicaProgressiva?.reiniciar();
    });

    guia.append(titulo, instrucao, passos, conta, equivalente, acoes, btnAbrir);
  } else {
    const nota = document.createElement('p');
    nota.className = 'divisao-decimal-nota';
    nota.textContent = casasIguais
      ? 'As casas decimais já estão iguais. Agora elimine as vírgulas.'
      : 'Complete o número que tem menos casas com zero para igualar.';
    guia.append(titulo, instrucao, passos, conta, nota, acoes);
  }

  el.conta.appendChild(guia);
}

function renderDivisao(estado, el) {
  if (ehDivisaoDificil(estado.questao)) {
    renderDivisaoDificil(estado, el);
    return;
  }
  if (ehDivisaoMedia(estado.questao)) {
    renderDivisaoMedia(estado, el);
    return;
  }

  const questao = estado.questao;
  const digitosDividendo = Math.max(1, digitosDe(questao.numeroA).length);
  const quocienteEsperado = questao.quociente != null
    ? questao.quociente
    : Math.floor(questao.numeroA / questao.numeroB);
  const restoEsperado = questao.resto != null ? questao.resto : 0;
  const digitosQuociente = Math.max(1, quantidadeDigitos(quocienteEsperado));
  const digitosResto = Math.max(1, quantidadeDigitos(restoEsperado));

  el.conta.innerHTML = '';

  const divisao = document.createElement('div');
  divisao.className = 'divisao';

  const dividendo = criarOperandoDivisao(
    questao.numeroA,
    'dividendo',
    ROTULOS_DIVISAO.dividendo,
    'divisao-rotulo-dividendo',
  );

  const chave = document.createElement('div');
  chave.className = 'divisao-chave';
  chave.setAttribute('aria-hidden', 'true');

  const divisor = criarOperandoDivisao(
    questao.numeroB,
    'divisor',
    ROTULOS_DIVISAO.divisor,
    'divisao-rotulo-divisor',
  );

  const linhaSubtracao = document.createElement('div');
  linhaSubtracao.className = 'divisao-subtracao';
  const sinal = document.createElement('span');
  sinal.className = 'divisao-sinal';
  sinal.textContent = '−';
  sinal.setAttribute('aria-hidden', 'true');

  const campoSubtracao = criarCampoDivisao(
    'divisao-subtracao-input',
    'Subtração intermediária',
    digitosDividendo,
  );
  linhaSubtracao.append(sinal, campoSubtracao);

  const campoQuociente = criarCampoDivisao('divisao-quociente', 'Quociente', digitosQuociente);
  const camposQuociente = document.createElement('div');
  camposQuociente.className = 'divisao-quocientes-campos';
  camposQuociente.appendChild(campoQuociente);
  const areaQuociente = document.createElement('div');
  areaQuociente.className = 'divisao-quocientes';
  areaQuociente.append(
    camposQuociente,
    criarRotuloDivisao(ROTULOS_DIVISAO.quociente, 'divisao-rotulo-quociente'),
  );

  const campoResto = criarCampoDivisao('divisao-resto-input', 'Resto', digitosResto);
  const linhaResto = document.createElement('div');
  linhaResto.className = 'divisao-resto';
  linhaResto.append(
    campoResto,
    criarRotuloDivisao(ROTULOS_DIVISAO.resto, 'divisao-rotulo-resto'),
  );

  configurarCampoDivisao(campoQuociente, 'quociente', el);
  configurarCampoDivisao(campoSubtracao, 'subtracao', el);
  configurarCampoDivisao(campoResto, 'resto', el);

  divisao.append(dividendo, chave, divisor, linhaSubtracao, areaQuociente, linhaResto);
  el.conta.appendChild(divisao);
}

function renderDivisaoMedia(estado, el) {
  const questao = estado.questao;
  const digitosProduto = Math.max(1, quantidadeDigitos(questao.numeroB * 9));
  const digitosRestoParcial = Math.max(1, quantidadeDigitos(questao.dividendoParcial));
  const digitosRestoFinal = Math.max(1, quantidadeDigitos(questao.dividendoAbaixado));

  estado.divisaoMedia = {
    etapa: 1,
    fase: 'quociente',
    emprestimos: { 1: new Set(), 2: new Set() },
    produto: { 1: null, 2: null },
    status: { 1: 'neutro', 2: 'neutro' },
    abaixado: null,
  };

  el.conta.innerHTML = '';

  const divisao = document.createElement('div');
  divisao.className = 'divisao divisao-longa';

  const dividendo = criarOperandoDivisao(
    questao.numeroA,
    'dividendo',
    ROTULOS_DIVISAO.dividendo,
    'divisao-rotulo-dividendo',
  );

  const chave = document.createElement('div');
  chave.className = 'divisao-chave';
  chave.setAttribute('aria-hidden', 'true');

  const divisor = criarOperandoDivisao(
    questao.numeroB,
    'divisor',
    ROTULOS_DIVISAO.divisor,
    'divisao-rotulo-divisor',
  );

  const parcialPrimeiraEtapa = criarDividendoParcialDivisao(
    questao.dividendoParcial,
    1,
    estado,
    el,
  );

  const sinalParcial = document.createElement('span');
  sinalParcial.className = 'divisao-sinal';
  sinalParcial.textContent = '−';
  sinalParcial.setAttribute('aria-hidden', 'true');

  const campoSubtracaoParcial = criarCampoProdutoDivisao(
    'divisao-subtracao-parcial',
    'Produto da primeira etapa',
    digitosProduto,
  );

  const linhaSubtracaoParcial = document.createElement('div');
  linhaSubtracaoParcial.className = 'divisao-subtracao divisao-subtracao-etapa-1';
  linhaSubtracaoParcial.append(sinalParcial, campoSubtracaoParcial);

  const campoQuocienteParcial = criarCampoDivisao(
    'divisao-quociente divisao-quociente-parcial',
    'Dezena do quociente',
    1,
  );
  configurarQuocienteDivisaoMedia(campoQuocienteParcial, 1, estado, el);

  const campoRestoParcial = criarCampoDivisao(
    'divisao-resto-input divisao-resto-parcial-input',
    'Resultado da primeira subtração',
    digitosRestoParcial,
  );
  configurarResultadoDivisaoMedia(campoRestoParcial, 1, estado, el);
  bloquearCampoDivisao(campoRestoParcial);

  const seta = document.createElement('span');
  seta.className = 'divisao-abaixado-seta';
  seta.textContent = '↓';
  seta.setAttribute('aria-hidden', 'true');
  seta.hidden = true;

  const linhaRestoParcial = document.createElement('div');
  linhaRestoParcial.className = 'divisao-linha-resto divisao-linha-resto-parcial';
  linhaRestoParcial.append(campoRestoParcial, seta);

  const abaixado = document.createElement('div');
  abaixado.className = 'divisao-abaixado';
  abaixado.hidden = true;
  const parcialSegundaEtapa = criarDividendoParcialDivisao(0, 2, estado, el);
  abaixado.appendChild(parcialSegundaEtapa);

  const campoQuocienteFinal = criarCampoDivisao(
    'divisao-quociente-final',
    'Unidade do quociente',
    1,
  );
  configurarQuocienteDivisaoMedia(campoQuocienteFinal, 2, estado, el);
  campoQuocienteFinal.hidden = true;

  const camposQuociente = document.createElement('div');
  camposQuociente.className = 'divisao-quocientes-campos';
  camposQuociente.append(campoQuocienteParcial, campoQuocienteFinal);
  const areaQuociente = document.createElement('div');
  areaQuociente.className = 'divisao-quocientes';
  areaQuociente.append(
    camposQuociente,
    criarRotuloDivisao(ROTULOS_DIVISAO.quociente, 'divisao-rotulo-quociente'),
  );

  const sinalFinal = document.createElement('span');
  sinalFinal.className = 'divisao-sinal';
  sinalFinal.textContent = '−';
  sinalFinal.setAttribute('aria-hidden', 'true');

  const campoSubtracaoFinal = criarCampoProdutoDivisao(
    'divisao-subtracao-final',
    'Produto da segunda etapa',
    digitosProduto,
  );

  const linhaSubtracaoFinal = document.createElement('div');
  linhaSubtracaoFinal.className = 'divisao-subtracao divisao-subtracao-etapa-2';
  linhaSubtracaoFinal.append(sinalFinal, campoSubtracaoFinal);
  linhaSubtracaoFinal.hidden = true;

  const campoResto = criarCampoDivisao(
    'divisao-resto-input divisao-resto-final-input',
    'Resto final',
    digitosRestoFinal,
  );
  configurarResultadoDivisaoMedia(campoResto, 2, estado, el);
  bloquearCampoDivisao(campoResto);

  const linhaRestoFinal = document.createElement('div');
  linhaRestoFinal.className = 'divisao-linha-resto divisao-linha-resto-final';
  linhaRestoFinal.append(
    campoResto,
    criarRotuloDivisao(ROTULOS_DIVISAO.resto, 'divisao-rotulo-resto'),
  );
  linhaRestoFinal.hidden = true;

  divisao.append(
    dividendo,
    chave,
    divisor,
    parcialPrimeiraEtapa,
    linhaSubtracaoParcial,
    areaQuociente,
    linhaRestoParcial,
    abaixado,
    linhaSubtracaoFinal,
    linhaRestoFinal,
  );
  el.conta.appendChild(divisao);
  el.conta.appendChild(criarApoioDivisao(estado, el));
  atualizarEmprestimosDivisao(estado, el, 1);
  atualizarGuiaDivisaoMedia(estado, el);
  renderApoioDivisao(estado, el);
}

function campoQuocienteDivisaoDificil(el, etapa) {
  return el.conta.querySelector(seletorQuocienteDivisaoDificil(etapa));
}

function campoProdutoDivisaoDificil(el, etapa) {
  return el.conta.querySelector(seletorProdutoDivisaoDificil(etapa));
}

function campoResultadoDivisaoDificil(el, etapa) {
  return el.conta.querySelector(seletorRestoDivisaoDificil(etapa));
}

function alvoEtapaDivisaoDificil(estado, etapa) {
  const dados = estado.divisaoDificil;
  const estagio = dados && Array.isArray(dados.etapas)
    ? dados.etapas[etapa - 1]
    : null;
  return estagio ? Number(estagio.dividendoParcial) || 0 : 0;
}

function definirVisibilidadeEtapaDivisaoDificil(estado, el, etapa, visivel) {
  if (!estado.divisaoDificil) {
    return;
  }
  const seletorEtapa = '[data-etapa="' + etapa + '"]';
  [
    '.divisao-linha-parcial-etapa-' + etapa,
    '.divisao-subtracao-etapa-' + etapa,
    '.divisao-linha-resto-etapa-' + etapa,
  ].forEach((seletor) => {
    const elemento = el.conta.querySelector(seletor);
    if (elemento) {
      elemento.hidden = !visivel;
    }
  });
  el.conta.querySelectorAll('.divisao-quociente' + seletorEtapa).forEach((campo) => {
    campo.hidden = !visivel;
  });
}

function recolherEtapasDivisaoDificil(estado, el, etapaAtual) {
  const dados = estado.divisaoDificil;
  if (!dados) {
    return;
  }
  for (let etapa = etapaAtual + 1; etapa <= dados.etapas.length; etapa += 1) {
    dados.produto[etapa] = null;
    dados.status[etapa] = 'neutro';
    dados.emprestimos[etapa].clear();
    definirVisibilidadeEtapaDivisaoDificil(estado, el, etapa, false);
  }
  dados.etapa = etapaAtual;
  dados.fase = dados.status[etapaAtual] === 'valido' ? 'subtracao' : 'quociente';
}

function ajustarQuocienteDivisaoDificil(estado, el, passo) {
  const dados = estado.divisaoDificil;
  if (!dados) {
    return;
  }
  const campo = campoQuocienteDivisaoDificil(el, dados.etapa);
  if (!campo || campo.hidden) {
    return;
  }
  const atual = normalizarDigitoQuociente(campo.value) ?? 0;
  campo.value = String(ajustarMultiplicador(atual, passo));
  atualizarQuocienteDivisaoDificil(estado, el, dados.etapa, campo.value);
}

function configurarQuocienteDivisaoDificil(campo, etapa, estado, el) {
  const nomes = nomesCamposEtapaDivisao(etapa, estado.divisaoDificil.etapas.length);
  campo.dataset.campo = nomes.quociente;
  campo.dataset.tipo = 'quociente';
  campo.dataset.etapa = String(etapa);
  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(-1);
    atualizarQuocienteDivisaoDificil(estado, el, etapa, campo.value);
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      campo.value = String(ajustarMultiplicador(
        normalizarDigitoQuociente(campo.value) ?? 0,
        evento.key === 'ArrowUp' ? 1 : -1,
      ));
      atualizarQuocienteDivisaoDificil(estado, el, etapa, campo.value);
      return;
    }
    if (evento.key === 'Enter') {
      evento.preventDefault();
      const resultado = campoResultadoDivisaoDificil(el, etapa);
      if (resultado && !resultado.disabled) {
        resultado.focus();
      }
    }
  });
}

function atualizarQuocienteDivisaoDificil(estado, el, etapa, valor) {
  const dados = estado.divisaoDificil;
  if (!dados || !estado.questao) {
    return;
  }
  if (dados.etapa !== etapa) {
    recolherEtapasDivisaoDificil(estado, el, etapa);
  }

  const alvo = alvoEtapaDivisaoDificil(estado, etapa);
  const avaliacao = avaliarEtapaDivisaoMedia(estado.questao.numeroB, valor, alvo);
  const campoQuociente = campoQuocienteDivisaoDificil(el, etapa);
  const campoProduto = campoProdutoDivisaoDificil(el, etapa);
  const campoResultado = campoResultadoDivisaoDificil(el, etapa);
  const mudouProduto = dados.produto[etapa] !== avaliacao.produto;

  dados.produto[etapa] = avaliacao.produto;
  dados.status[etapa] = avaliacao.status;

  if (mudouProduto) {
    dados.emprestimos[etapa].clear();
    bloquearCampoDivisao(campoResultado);
    atualizarEmprestimosDivisao(estado, el, etapa, 'divisaoDificil');
  }

  if (campoProduto) {
    campoProduto.value = avaliacao.produto === null ? '' : String(avaliacao.produto);
    aplicarCorDivisao(campoProduto, avaliacao.status);
  }
  if (campoQuociente) {
    aplicarCorDivisao(campoQuociente, avaliacao.status);
  }

  if (avaliacao.status === 'valido') {
    liberarCampoDivisao(campoResultado);
    dados.fase = 'subtracao';
  } else {
    bloquearCampoDivisao(campoResultado);
    dados.fase = 'quociente';
  }

  atualizarGuiaDivisaoDificil(estado, el);
  renderApoioDivisaoDificil(estado, el);
}

function configurarResultadoDivisaoDificil(campo, etapa, estado, el) {
  const nomes = nomesCamposEtapaDivisao(etapa, estado.divisaoDificil.etapas.length);
  campo.dataset.campo = nomes.resto;
  campo.dataset.tipo = 'resto';
  campo.dataset.etapa = String(etapa);
  campo.dataset.valorAnterior = '';
  campo.addEventListener('input', (evento) => {
    const valor = normalizarEntradaResultadoDivisao(
      campo.dataset.valorAnterior ?? '',
      campo.value,
      evento.data,
      evento.inputType,
      Number(campo.maxLength),
    );
    campo.value = valor;
    campo.dataset.valorAnterior = valor;
    campo.setSelectionRange(campo.value.length, campo.value.length);
    atualizarResultadoDivisaoDificil(estado, el, etapa, campo);
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      if (!campo.disabled) {
        el.btnValidar.click();
      }
    }
  });
}

function atualizarResultadoDivisaoDificil(estado, el, etapa, campo) {
  const dados = estado.divisaoDificil;
  if (!dados) {
    return;
  }
  if (dados.etapa !== etapa) {
    recolherEtapasDivisaoDificil(estado, el, etapa);
  }

  const alvo = alvoEtapaDivisaoDificil(estado, etapa);
  const produto = dados.produto[etapa];
  if (produto === null || dados.status[etapa] !== 'valido') {
    bloquearCampoDivisao(campo);
    atualizarGuiaDivisaoDificil(estado, el);
    return;
  }

  const preenchido = String(campo.value).trim() !== '';
  const correto = subtracaoDivisaoConfere(campo.value, alvo, produto);
  aplicarCorDivisao(campo, preenchido ? (correto ? 'correto' : 'incorreto') : 'neutro');

  if (correto) {
    if (etapa < dados.etapas.length) {
      avancarEtapaDivisaoDificil(estado, el, etapa);
      return;
    }
    dados.fase = 'concluido';
  } else {
    dados.fase = 'resto';
  }

  atualizarGuiaDivisaoDificil(estado, el);
  renderApoioDivisaoDificil(estado, el);
}

function avancarEtapaDivisaoDificil(estado, el, etapaAtual) {
  const dados = estado.divisaoDificil;
  const proxima = etapaAtual + 1;
  if (!dados || proxima > dados.etapas.length) {
    return;
  }

  dados.etapa = proxima;
  dados.fase = 'quociente';
  dados.produto[proxima] = null;
  dados.status[proxima] = 'neutro';
  dados.emprestimos[proxima].clear();

  definirVisibilidadeEtapaDivisaoDificil(estado, el, proxima, true);

  const campoQuociente = campoQuocienteDivisaoDificil(el, proxima);
  if (campoQuociente) {
    campoQuociente.disabled = false;
    campoQuociente.value = '';
    limparCorDivisao(campoQuociente);
  }
  const campoProduto = campoProdutoDivisaoDificil(el, proxima);
  if (campoProduto) {
    campoProduto.value = '';
    limparCorDivisao(campoProduto);
  }
  const campoResto = campoResultadoDivisaoDificil(el, proxima);
  if (campoResto) {
    bloquearCampoDivisao(campoResto);
  }

  atualizarEmprestimosDivisao(estado, el, proxima, 'divisaoDificil');
  atualizarGuiaDivisaoDificil(estado, el);
  renderApoioDivisaoDificil(estado, el);
  focarCampoDivisao(el, nomesCamposEtapaDivisao(proxima, dados.etapas.length).quociente);
}

function campoAtivoGuiaDivisaoDificil(estado, el) {
  const dados = estado.divisaoDificil;
  if (!dados || dados.fase === 'concluido') {
    return null;
  }
  return dados.fase === 'quociente'
    ? campoQuocienteDivisaoDificil(el, dados.etapa)
    : campoResultadoDivisaoDificil(el, dados.etapa);
}

function textoGuiaDivisaoDificil(estado) {
  const dados = estado.divisaoDificil;
  if (!dados) {
    return '';
  }
  const total = dados.etapas.length;
  if (dados.fase === 'concluido') {
    return 'Muito bem! Confira sua resposta quando estiver pronto.';
  }
  if (dados.fase === 'quociente') {
    return 'Etapa ' + dados.etapa + ' de ' + total
      + ': ajuste o dígito do quociente até o produto caber no dividendo parcial.';
  }
  return 'Etapa ' + dados.etapa + ' de ' + total
    + ': subtraia o produto do dividendo parcial e escreva o resto.';
}

function atualizarGuiaDivisaoDificil(estado, el) {
  const dados = estado.divisaoDificil;
  if (!dados) {
    return;
  }
  el.conta.querySelectorAll('.divisao-input').forEach((campo) => {
    campo.classList.remove('campo-guia');
  });
  const ativo = campoAtivoGuiaDivisaoDificil(estado, el);
  if (ativo && !ativo.hidden && !ativo.disabled) {
    ativo.classList.add('campo-guia');
  }

  el.conta.querySelectorAll('.dividendo-parcial[data-etapa]').forEach((container) => {
    const etapa = Number(container.dataset.etapa);
    const ativa = etapa === dados.etapa && dados.status[etapa] === 'valido';
    container.classList.toggle('ativa', ativa);
    container.querySelectorAll('button.celula-digito').forEach((celula) => {
      celula.disabled = !ativa;
    });
  });

  const instrucao = el.conta.querySelector('.apoio-instrucao');
  if (instrucao) {
    instrucao.textContent = textoGuiaDivisaoDificil(estado);
  }
}

function criarApoioDivisaoDificil(estado, el) {
  return criarApoioDivisao(estado, el, (passo) => (
    ajustarQuocienteDivisaoDificil(estado, el, passo)
  ));
}

function renderApoioDivisaoDificil(estado, el) {
  if (!estado.questao || !estado.divisaoDificil) {
    return;
  }
  const painel = el.conta.querySelector('.apoio-divisao');
  if (!painel) {
    return;
  }

  const etapa = estado.divisaoDificil.etapa;
  const campoQuociente = campoQuocienteDivisaoDificil(el, etapa);
  const alvo = alvoEtapaDivisaoDificil(estado, etapa);
  const avaliacao = descreverApoioDivisao(
    estado.questao.numeroB,
    campoQuociente ? campoQuociente.value : '',
    alvo,
    etapa,
  );
  const calculo = painel.querySelector('.apoio-calculo');
  const expressao = painel.querySelector('.apoio-expressao');

  painel.querySelector('.apoio-divisor-valor').textContent = String(estado.questao.numeroB);
  if (expressao) {
    expressao.textContent = avaliacao.expressao;
  }
  if (calculo) {
    calculo.classList.toggle('excedeu', avaliacao.excedeu);
    calculo.classList.toggle('correto', avaliacao.correto);
  }
  const instrucao = painel.querySelector('.apoio-instrucao');
  if (instrucao) {
    instrucao.textContent = textoGuiaDivisaoDificil(estado);
  }
}

function renderDivisaoDificil(estado, el) {
  const questao = estado.questao;
  const modelo = montarModeloDivisaoDificil(questao);
  const totalEtapas = Math.max(2, modelo.etapas.length);
  const digitosProduto = Math.max(1, quantidadeDigitos(questao.numeroB * 9));

  estado.divisaoDificil = {
    ...modelo,
    etapa: 1,
    fase: 'quociente',
    emprestimos: {},
    produto: {},
    status: {},
  };
  modelo.etapas.forEach((etapa) => {
    estado.divisaoDificil.emprestimos[etapa.indice] = new Set();
    estado.divisaoDificil.produto[etapa.indice] = null;
    estado.divisaoDificil.status[etapa.indice] = 'neutro';
  });

  el.conta.innerHTML = '';

  const divisao = document.createElement('div');
  divisao.className = 'divisao divisao-longa divisao-dificil divisao-dinamica';
  divisao.style.setProperty('--total-etapas-divisao', String(totalEtapas));

  const dividendo = criarOperandoDivisao(
    questao.numeroA,
    'dividendo',
    ROTULOS_DIVISAO.dividendo,
    'divisao-rotulo-dividendo',
  );
  dividendo.style.gridRow = '1';
  dividendo.style.gridColumn = '1';

  const chave = document.createElement('div');
  chave.className = 'divisao-chave';
  chave.setAttribute('aria-hidden', 'true');
  chave.style.gridRow = '1 / span ' + (totalEtapas * 3 + 2);
  chave.style.gridColumn = '2';

  const divisor = criarOperandoDivisao(
    questao.numeroB,
    'divisor',
    ROTULOS_DIVISAO.divisor,
    'divisao-rotulo-divisor',
  );
  divisor.style.gridRow = '1';
  divisor.style.gridColumn = '3';

  const camposQuociente = document.createElement('div');
  camposQuociente.className = 'divisao-quocientes-campos';
  const camposQuocientePorEtapa = [];

  modelo.etapas.forEach((etapa) => {
    const campo = criarCampoDivisao(
      'divisao-quociente divisao-quociente-dificil',
      'Dígito ' + etapa.indice + ' do quociente',
      1,
    );
    configurarQuocienteDivisaoDificil(campo, etapa.indice, estado, el);
    campo.hidden = etapa.indice > 1;
    camposQuociente.appendChild(campo);
    camposQuocientePorEtapa.push(campo);
  });

  const areaQuociente = document.createElement('div');
  areaQuociente.className = 'divisao-quocientes';
  areaQuociente.style.gridRow = '2';
  areaQuociente.style.gridColumn = '3';
  areaQuociente.append(
    camposQuociente,
    criarRotuloDivisao(ROTULOS_DIVISAO.quociente, 'divisao-rotulo-quociente'),
  );

  divisao.append(dividendo, chave, divisor, areaQuociente);

  modelo.etapas.forEach((etapa) => {
    const linhaBase = 3 + (etapa.indice - 1) * 3;
    const oculta = etapa.indice > 1;

    const parcial = criarDividendoParcialDivisao(
      etapa.dividendoParcial,
      etapa.indice,
      estado,
      el,
      'divisaoDificil',
    );
    const linhaParcial = document.createElement('div');
    linhaParcial.className = 'divisao-linha-parcial divisao-linha-parcial-etapa-'
      + etapa.indice;
    linhaParcial.style.gridRow = String(linhaBase);
    linhaParcial.style.gridColumn = '1';
    if (etapa.indice > 1) {
      linhaParcial.appendChild(criarDesceDivisaoDificil(etapa));
    }
    linhaParcial.appendChild(parcial);
    linhaParcial.hidden = oculta;

    const sinal = document.createElement('span');
    sinal.className = 'divisao-sinal';
    sinal.textContent = '−';
    sinal.setAttribute('aria-hidden', 'true');

    const campoProduto = criarCampoProdutoDivisao(
      'divisao-subtracao-etapa-' + etapa.indice,
      'Produto da etapa ' + etapa.indice,
      digitosProduto,
    );
    campoProduto.dataset.campo = nomesCamposEtapaDivisao(
      etapa.indice,
      modelo.etapas.length,
    ).subtracao;
    campoProduto.dataset.tipo = 'subtracao';
    campoProduto.dataset.etapa = String(etapa.indice);

    const linhaSubtracao = document.createElement('div');
    linhaSubtracao.className = 'divisao-subtracao divisao-subtracao-etapa-'
      + etapa.indice;
    linhaSubtracao.style.gridRow = String(linhaBase + 1);
    linhaSubtracao.style.gridColumn = '1';
    linhaSubtracao.append(sinal, campoProduto);
    linhaSubtracao.hidden = oculta;

    const campoResto = criarCampoDivisao(
      'divisao-resto-input divisao-resto-dificil',
      'Resto da etapa ' + etapa.indice,
      Math.max(1, quantidadeDigitos(etapa.dividendoParcial)),
    );
    configurarResultadoDivisaoDificil(campoResto, etapa.indice, estado, el);
    bloquearCampoDivisao(campoResto);

    const linhaResto = document.createElement('div');
    linhaResto.className = 'divisao-linha-resto divisao-linha-resto-etapa-'
      + etapa.indice;
    linhaResto.style.gridRow = String(linhaBase + 2);
    linhaResto.style.gridColumn = '1';
    linhaResto.style.justifySelf = 'end';
    linhaResto.append(campoResto);
    if (etapa.indice === modelo.etapas.length) {
      linhaResto.classList.add('divisao-linha-resto-final');
      linhaResto.append(
        criarRotuloDivisao(ROTULOS_DIVISAO.resto, 'divisao-rotulo-resto'),
      );
    }
    linhaResto.hidden = oculta;

    divisao.append(linhaParcial, linhaSubtracao, linhaResto);
  });

  el.conta.appendChild(divisao);
  el.conta.appendChild(criarApoioDivisaoDificil(estado, el));
  atualizarEmprestimosDivisao(estado, el, 1, 'divisaoDificil');
  atualizarGuiaDivisaoDificil(estado, el);
  renderApoioDivisaoDificil(estado, el);
}

function criarDesceDivisaoDificil(etapa) {
  const digito = digitoAbaixadoDivisaoDificil(etapa);
  const indicador = document.createElement('span');
  indicador.className = 'divisao-desce';
  indicador.dataset.etapa = String(etapa.indice);
  indicador.setAttribute('role', 'img');
  indicador.setAttribute(
    'aria-label',
    'Desça o dígito ' + digito + ' do dividendo para a etapa ' + etapa.indice,
  );

  const seta = document.createElement('span');
  seta.className = 'divisao-desce-seta';
  seta.textContent = '↓';
  seta.setAttribute('aria-hidden', 'true');

  const valor = document.createElement('span');
  valor.className = 'divisao-desce-digito';
  valor.textContent = String(digito);
  valor.setAttribute('aria-hidden', 'true');

  indicador.append(seta, valor);
  return indicador;
}

function criarCampoProdutoDivisao(classe, rotulo, digitos) {
  const campo = criarCampoDivisao(
    'divisao-subtracao-input ' + classe + ' divisao-produto',
    rotulo,
    digitos,
  );
  campo.readOnly = true;
  campo.tabIndex = -1;
  campo.setAttribute('aria-live', 'polite');
  return campo;
}

function criarDividendoParcialDivisao(
  valor,
  etapa,
  estado,
  el,
  chaveEstado = 'divisaoMedia',
) {
  const container = document.createElement('div');
  container.className = 'dividendo-parcial divisao-parcial-etapa-' + etapa;
  container.dataset.etapa = String(etapa);
  container.dataset.valor = String(valor);

  const digitos = digitosDe(valor);
  for (let coluna = digitos.length - 1; coluna >= 0; coluna -= 1) {
    container.appendChild(
      criarCelulaDividendoDivisao(coluna, digitos[coluna], etapa, estado, el, chaveEstado),
    );
  }
  return container;
}

function criarCelulaDividendoDivisao(coluna, digito, etapa, estado, el, chaveEstado = 'divisaoMedia') {
  const clicavel = coluna > 0;
  const celula = clicavel
    ? document.createElement('button')
    : document.createElement('div');
  if (clicavel) {
    celula.type = 'button';
  }
  celula.className = 'celula-digito celula-dividendo'
    + (clicavel ? ' clicavel' : '');
  celula.dataset.coluna = String(coluna);
  celula.dataset.etapa = String(etapa);

  const conteudo = document.createElement('span');
  conteudo.className = 'digito';

  const umEmprestado = document.createElement('span');
  umEmprestado.className = 'um-emprestado';
  umEmprestado.textContent = '1';
  umEmprestado.setAttribute('aria-hidden', 'true');
  umEmprestado.hidden = true;

  const valorDoDigito = document.createElement('span');
  valorDoDigito.className = 'digito-valor';
  valorDoDigito.textContent = String(digito);

  conteudo.append(umEmprestado, valorDoDigito);
  celula.appendChild(conteudo);

  const risco = document.createElement('span');
  risco.className = 'risco';
  risco.setAttribute('aria-hidden', 'true');
  risco.hidden = true;
  celula.appendChild(risco);

  const valorEmprestado = document.createElement('span');
  valorEmprestado.className = 'valor-emprestado';
  valorEmprestado.setAttribute('aria-hidden', 'true');
  valorEmprestado.hidden = true;
  celula.appendChild(valorEmprestado);

  if (clicavel) {
    celula.disabled = true;
    celula.setAttribute('aria-pressed', 'false');
    celula.addEventListener('click', () => {
      const conjunto = estado[chaveEstado]?.emprestimos?.[etapa];
      if (!conjunto) {
        return;
      }
      if (conjunto.has(coluna)) {
        conjunto.delete(coluna);
      } else {
        conjunto.add(coluna);
      }
      atualizarEmprestimosDivisao(estado, el, etapa, chaveEstado);
    });
  }

  return celula;
}

function atualizarEmprestimosDivisao(
  estado,
  el,
  etapa,
  chaveEstado = 'divisaoMedia',
) {
  const container = el.conta.querySelector(
    '.dividendo-parcial[data-etapa="' + etapa + '"]',
  );
  const dados = estado[chaveEstado];
  if (!container || !dados) {
    return;
  }
  const digitos = digitosDe(Number(container.dataset.valor) || 0);
  const conjunto = dados.emprestimos[etapa];

  container.querySelectorAll('.celula-digito[data-coluna]').forEach((celula) => {
    const indice = Number(celula.dataset.coluna);
    const digitoBase = digitos[indice] ?? 0;
    const empresta = conjunto.has(indice);
    const recebe = conjunto.has(indice + 1);
    const novoValor = Math.max(0, digitoBase + (recebe ? 10 : 0) - 1);

    celula.classList.toggle('empresta', empresta);
    celula.classList.toggle('recebe', recebe);

    const risco = celula.querySelector('.risco');
    if (risco) {
      risco.hidden = !empresta;
    }

    const valorEmprestado = celula.querySelector('.valor-emprestado');
    if (valorEmprestado) {
      valorEmprestado.hidden = !empresta;
      valorEmprestado.textContent = empresta ? String(novoValor) : '';
    }

    const umEmprestado = celula.querySelector('.um-emprestado');
    if (umEmprestado) {
      umEmprestado.hidden = !(recebe && !empresta);
    }

    if (celula.tagName === 'BUTTON') {
      const destino = ROTULOS_COLUNA[indice - 1] ?? 'unidades';
      const rotulo = 'Emprestar para a coluna das ' + destino
        + (empresta ? ' (emprestando 1)' : '');
      celula.setAttribute('aria-label', rotulo);
      celula.setAttribute('aria-pressed', String(empresta));
    }
  });
}

function alvoEtapaDivisaoMedia(estado, etapa) {
  if (etapa === 2) {
    return Number(estado.divisaoMedia?.abaixado ?? estado.questao.dividendoAbaixado) || 0;
  }
  return Number(estado.questao.dividendoParcial) || 0;
}

function campoQuocienteDivisaoMedia(el, etapa) {
  const seletor = etapa === 2
    ? SELETORES_CAMPOS_DIVISAO.quocienteFinal
    : SELETORES_CAMPOS_DIVISAO.quocienteParcial;
  return el.conta.querySelector(seletor);
}

function campoProdutoDivisaoMedia(el, etapa) {
  const seletor = etapa === 2
    ? SELETORES_CAMPOS_DIVISAO.subtracaoFinal
    : SELETORES_CAMPOS_DIVISAO.subtracaoParcial;
  return el.conta.querySelector(seletor);
}

function campoResultadoDivisaoMedia(el, etapa) {
  const seletor = etapa === 2
    ? SELETORES_CAMPOS_DIVISAO.restoFinal
    : SELETORES_CAMPOS_DIVISAO.restoParcial;
  return el.conta.querySelector(seletor);
}

function aplicarCorDivisao(campo, status) {
  if (!campo) {
    return;
  }
  campo.classList.toggle('correto', status === 'valido' || status === 'correto');
  campo.classList.toggle('incorreto', status === 'invalido' || status === 'incorreto');
}

function limparCorDivisao(campo) {
  if (!campo) {
    return;
  }
  campo.classList.remove('correto', 'incorreto');
}

function bloquearCampoDivisao(campo) {
  campo.disabled = true;
  campo.value = '';
  campo.dataset.valorAnterior = '';
  campo.classList.add('campo-bloqueado');
  limparCorDivisao(campo);
}

function liberarCampoDivisao(campo) {
  campo.disabled = false;
  campo.classList.remove('campo-bloqueado');
}

function configurarQuocienteDivisaoMedia(campo, etapa, estado, el) {
  campo.dataset.campo = etapa === 2 ? 'quocienteFinal' : 'quocienteParcial';
  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(-1);
    atualizarQuocienteDivisaoMedia(estado, el, etapa, campo.value);
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      ajustarQuocienteDivisaoMedia(
        estado,
        el,
        evento.key === 'ArrowUp' ? 1 : -1,
        etapa,
      );
      return;
    }
    if (evento.key === 'Enter') {
      evento.preventDefault();
      const resultado = campoResultadoDivisaoMedia(el, estado.divisaoMedia?.etapa ?? etapa);
      if (resultado && !resultado.disabled) {
        resultado.focus();
      }
    }
  });
}

function configurarResultadoDivisaoMedia(campo, etapa, estado, el) {
  campo.dataset.campo = etapa === 2 ? 'restoFinal' : 'restoParcial';
  campo.dataset.valorAnterior = '';
  campo.addEventListener('input', (evento) => {
    const valor = normalizarEntradaResultadoDivisao(
      campo.dataset.valorAnterior ?? '',
      campo.value,
      evento.data,
      evento.inputType,
      Number(campo.maxLength),
    );
    campo.value = valor;
    campo.dataset.valorAnterior = valor;
    campo.setSelectionRange(campo.value.length, campo.value.length);
    atualizarResultadoDivisaoMedia(estado, el, etapa, campo);
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      if (!campo.disabled) {
        el.btnValidar.click();
      }
    }
  });
}

function ajustarQuocienteDivisaoMedia(estado, el, passo, etapaAtiva) {
  if (!estado.divisaoMedia) {
    return;
  }
  const etapa = etapaAtiva ?? (estado.divisaoMedia.etapa === 2 ? 2 : 1);
  const campo = campoQuocienteDivisaoMedia(el, etapa);
  if (!campo || campo.hidden) {
    return;
  }
  const atual = normalizarDigitoQuociente(campo.value) ?? 0;
  campo.value = String(ajustarMultiplicador(atual, passo));
  atualizarQuocienteDivisaoMedia(estado, el, etapa, campo.value);
}

function atualizarQuocienteDivisaoMedia(estado, el, etapa, valor) {
  if (!estado.divisaoMedia || !estado.questao) {
    return;
  }
  const dados = estado.divisaoMedia;
  const alvo = alvoEtapaDivisaoMedia(estado, etapa);
  const avaliacao = avaliarEtapaDivisaoMedia(estado.questao.numeroB, valor, alvo);
  const campoQuociente = campoQuocienteDivisaoMedia(el, etapa);
  const campoProduto = campoProdutoDivisaoMedia(el, etapa);
  const campoResultado = campoResultadoDivisaoMedia(el, etapa);
  const mudouProduto = dados.produto[etapa] !== avaliacao.produto;

  dados.produto[etapa] = avaliacao.produto;
  dados.status[etapa] = avaliacao.status;

  if (mudouProduto) {
    dados.emprestimos[etapa].clear();
    if (etapa === 1) {
      bloquearCampoDivisao(campoResultado);
      if (dados.etapa === 2) {
        recolherUnidadeDivisaoMedia(estado, el);
      }
    } else {
      bloquearCampoDivisao(campoResultado);
    }
    atualizarEmprestimosDivisao(estado, el, etapa);
  }

  if (campoProduto) {
    campoProduto.value = avaliacao.produto === null ? '' : String(avaliacao.produto);
    aplicarCorDivisao(campoProduto, avaliacao.status);
  }
  if (campoQuociente) {
    aplicarCorDivisao(campoQuociente, avaliacao.status);
  }

  if (avaliacao.status === 'valido') {
    liberarCampoDivisao(campoResultado);
    dados.fase = etapa === 2 ? 'resto' : 'subtracao';
  } else {
    bloquearCampoDivisao(campoResultado);
    dados.fase = 'quociente';
  }

  atualizarGuiaDivisaoMedia(estado, el);
  renderApoioDivisao(estado, el);
}

function atualizarResultadoDivisaoMedia(estado, el, etapa, campo) {
  if (!estado.divisaoMedia) {
    return;
  }
  const dados = estado.divisaoMedia;
  if (etapa === 1 && dados.etapa === 2) {
    recolherUnidadeDivisaoMedia(estado, el);
  }

  const alvo = alvoEtapaDivisaoMedia(estado, etapa);
  const produto = dados.produto[etapa];
  if (produto === null || dados.status[etapa] !== 'valido') {
    bloquearCampoDivisao(campo);
    atualizarGuiaDivisaoMedia(estado, el);
    return;
  }

  const preenchido = String(campo.value).trim() !== '';
  const correto = subtracaoDivisaoConfere(campo.value, alvo, produto);
  aplicarCorDivisao(campo, preenchido ? (correto ? 'correto' : 'incorreto') : 'neutro');

  if (correto) {
    if (etapa === 1) {
      avancarParaUnidadeDivisaoMedia(estado, el, Number(campo.value));
      return;
    }
    dados.fase = 'concluido';
  } else if (etapa === 2) {
    dados.fase = 'resto';
  }

  atualizarGuiaDivisaoMedia(estado, el);
  renderApoioDivisao(estado, el);
}

function avancarParaUnidadeDivisaoMedia(estado, el, restoParcial) {
  const dados = estado.divisaoMedia;
  const unidadeDividendo = Math.abs(Math.trunc(Number(estado.questao.numeroA) || 0)) % 10;
  const abaixado = proximoNumeroAbaixado(restoParcial, unidadeDividendo);

  dados.etapa = 2;
  dados.fase = 'quociente';
  dados.abaixado = abaixado;
  dados.produto[2] = null;
  dados.status[2] = 'neutro';
  dados.emprestimos[2].clear();

  montarDividendoAbaixadoDivisaoMedia(estado, el, abaixado);
  const containerAbaixado = el.conta.querySelector('.divisao-abaixado');
  if (containerAbaixado) {
    containerAbaixado.hidden = false;
    containerAbaixado.setAttribute(
      'aria-label',
      'Número formado após descer o próximo dígito: ' + abaixado,
    );
  }
  const setaAbaixado = el.conta.querySelector('.divisao-abaixado-seta');
  if (setaAbaixado) {
    setaAbaixado.hidden = false;
  }

  const campoQuocienteFinal = el.conta.querySelector(
    SELETORES_CAMPOS_DIVISAO.quocienteFinal,
  );
  if (campoQuocienteFinal) {
    campoQuocienteFinal.hidden = false;
    campoQuocienteFinal.disabled = false;
    campoQuocienteFinal.value = '';
    limparCorDivisao(campoQuocienteFinal);
  }

  const campoProdutoFinal = campoProdutoDivisaoMedia(el, 2);
  if (campoProdutoFinal) {
    campoProdutoFinal.value = '';
    limparCorDivisao(campoProdutoFinal);
  }

  const campoRestoFinal = campoResultadoDivisaoMedia(el, 2);
  if (campoRestoFinal) {
    bloquearCampoDivisao(campoRestoFinal);
    campoRestoFinal.hidden = false;
  }

  const linhaSubtracaoFinal = el.conta.querySelector('.divisao-subtracao-etapa-2');
  if (linhaSubtracaoFinal) {
    linhaSubtracaoFinal.hidden = false;
  }
  const linhaRestoFinal = el.conta.querySelector('.divisao-linha-resto-final');
  if (linhaRestoFinal) {
    linhaRestoFinal.hidden = false;
  }

  atualizarEmprestimosDivisao(estado, el, 2);
  atualizarGuiaDivisaoMedia(estado, el);
  renderApoioDivisao(estado, el);
  focarCampoDivisao(el, 'quocienteFinal');
}

function recolherUnidadeDivisaoMedia(estado, el) {
  const dados = estado.divisaoMedia;
  if (!dados) {
    return;
  }
  dados.etapa = 1;
  dados.fase = dados.status[1] === 'valido' ? 'subtracao' : 'quociente';
  dados.abaixado = null;
  dados.produto[2] = null;
  dados.status[2] = 'neutro';
  dados.emprestimos[2].clear();

  const containerAbaixado = el.conta.querySelector('.divisao-abaixado');
  if (containerAbaixado) {
    containerAbaixado.hidden = true;
    containerAbaixado.removeAttribute('aria-label');
  }
  const setaAbaixado = el.conta.querySelector('.divisao-abaixado-seta');
  if (setaAbaixado) {
    setaAbaixado.hidden = true;
  }

  const campoQuocienteFinal = el.conta.querySelector(
    SELETORES_CAMPOS_DIVISAO.quocienteFinal,
  );
  if (campoQuocienteFinal) {
    campoQuocienteFinal.value = '';
    campoQuocienteFinal.hidden = true;
    limparCorDivisao(campoQuocienteFinal);
  }

  const campoProdutoFinal = campoProdutoDivisaoMedia(el, 2);
  if (campoProdutoFinal) {
    campoProdutoFinal.value = '';
    limparCorDivisao(campoProdutoFinal);
  }

  const campoRestoFinal = campoResultadoDivisaoMedia(el, 2);
  if (campoRestoFinal) {
    bloquearCampoDivisao(campoRestoFinal);
    campoRestoFinal.hidden = true;
  }

  const linhaSubtracaoFinal = el.conta.querySelector('.divisao-subtracao-etapa-2');
  if (linhaSubtracaoFinal) {
    linhaSubtracaoFinal.hidden = true;
  }
  const linhaRestoFinal = el.conta.querySelector('.divisao-linha-resto-final');
  if (linhaRestoFinal) {
    linhaRestoFinal.hidden = true;
  }
}

function montarDividendoAbaixadoDivisaoMedia(estado, el, valor) {
  const anterior = el.conta.querySelector('.dividendo-parcial[data-etapa="2"]');
  if (!anterior) {
    return;
  }
  const novo = criarDividendoParcialDivisao(valor, 2, estado, el);
  anterior.replaceWith(novo);
}

function campoAtivoGuiaDivisaoMedia(estado, el) {
  const dados = estado.divisaoMedia;
  if (!dados || dados.fase === 'concluido') {
    return null;
  }
  if (dados.etapa === 2) {
    return dados.fase === 'resto'
      ? campoResultadoDivisaoMedia(el, 2)
      : campoQuocienteDivisaoMedia(el, 2);
  }
  return dados.fase === 'subtracao'
    ? campoResultadoDivisaoMedia(el, 1)
    : campoQuocienteDivisaoMedia(el, 1);
}

function textoGuiaDivisaoMedia(estado) {
  const dados = estado.divisaoMedia;
  if (!dados) {
    return '';
  }
  if (dados.fase === 'concluido') {
    return 'Muito bem! Confira sua resposta quando estiver pronto.';
  }
  if (dados.etapa === 2) {
    return dados.fase === 'resto'
      ? 'Etapa 4: faça a subtração final e escreva o resto.'
      : 'Etapa 3: ajuste a unidade do quociente até o produto caber no número abaixado.';
  }
  return dados.fase === 'subtracao'
    ? 'Etapa 2: subtraia o produto do dividendo parcial. Se precisar, toque no dígito de cima para pedir emprestado.'
    : 'Etapa 1: ajuste a dezena do quociente até o produto caber no dividendo parcial.';
}

function atualizarGuiaDivisaoMedia(estado, el) {
  if (!estado.divisaoMedia) {
    return;
  }
  el.conta.querySelectorAll('.divisao-input').forEach((campo) => {
    campo.classList.remove('campo-guia');
  });
  const ativo = campoAtivoGuiaDivisaoMedia(estado, el);
  if (ativo && !ativo.hidden && !ativo.disabled) {
    ativo.classList.add('campo-guia');
  }

  const instrucao = el.conta.querySelector('.apoio-instrucao');
  if (instrucao) {
    instrucao.textContent = textoGuiaDivisaoMedia(estado);
  }

  const dados = estado.divisaoMedia;
  el.conta.querySelectorAll('.dividendo-parcial[data-etapa]').forEach((container) => {
    const etapa = Number(container.dataset.etapa);
    const ativa = etapa === dados.etapa && dados.status[etapa] === 'valido';
    container.classList.toggle('ativa', ativa);
    container.querySelectorAll('button.celula-digito').forEach((celula) => {
      celula.disabled = !ativa;
    });
  });
}

function criarApoioDivisao(estado, el, ajustarQuociente) {
  const ajustar = typeof ajustarQuociente === 'function'
    ? ajustarQuociente
    : (passo) => ajustarQuocienteDivisaoMedia(estado, el, passo);
  const painel = document.createElement('aside');
  painel.className = 'apoio-divisao';
  painel.setAttribute('aria-label', 'Ajuste do quociente');

  const divisor = document.createElement('p');
  divisor.className = 'apoio-divisor';
  const rotuloDivisor = document.createElement('span');
  rotuloDivisor.className = 'apoio-divisor-rotulo';
  rotuloDivisor.textContent = 'Divisor';
  const valorDivisor = document.createElement('strong');
  valorDivisor.className = 'apoio-divisor-valor';
  valorDivisor.textContent = String(estado.questao.numeroB);
  divisor.append(rotuloDivisor, valorDivisor);

  const instrucao = document.createElement('p');
  instrucao.className = 'apoio-instrucao';
  instrucao.setAttribute('aria-live', 'polite');

  const calculo = document.createElement('div');
  calculo.className = 'apoio-calculo';
  const menos = document.createElement('button');
  menos.type = 'button';
  menos.className = 'apoio-menos';
  menos.textContent = '−';
  menos.setAttribute('aria-label', 'Diminuir dígito do quociente');
  menos.addEventListener('click', () => {
    ajustar(-1);
  });
  const expressao = document.createElement('span');
  expressao.className = 'apoio-expressao';
  expressao.setAttribute('aria-live', 'polite');
  const mais = document.createElement('button');
  mais.type = 'button';
  mais.className = 'apoio-mais';
  mais.textContent = '+';
  mais.setAttribute('aria-label', 'Aumentar dígito do quociente');
  mais.addEventListener('click', () => {
    ajustar(1);
  });
  calculo.append(menos, expressao, mais);

  painel.append(divisor, instrucao, calculo);
  return painel;
}

function renderApoioDivisao(estado, el) {
  if (!estado.questao || !estado.divisaoMedia) {
    return;
  }
  const painel = el.conta.querySelector('.apoio-divisao');
  if (!painel) {
    return;
  }

  const etapa = estado.divisaoMedia.etapa === 2 ? 2 : 1;
  const campoQuociente = campoQuocienteDivisaoMedia(el, etapa);
  const alvo = alvoEtapaDivisaoMedia(estado, etapa);
  const avaliacao = descreverApoioDivisao(
    estado.questao.numeroB,
    campoQuociente ? campoQuociente.value : '',
    alvo,
    etapa,
  );
  const calculo = painel.querySelector('.apoio-calculo');
  const expressao = painel.querySelector('.apoio-expressao');

  painel.querySelector('.apoio-divisor-valor').textContent = String(estado.questao.numeroB);
  if (expressao) {
    expressao.textContent = avaliacao.expressao;
  }
  if (calculo) {
    calculo.classList.toggle('excedeu', avaliacao.excedeu);
    calculo.classList.toggle('correto', avaliacao.correto);
  }
  const instrucao = painel.querySelector('.apoio-instrucao');
  if (instrucao) {
    instrucao.textContent = textoGuiaDivisaoMedia(estado);
  }
}

function atualizarEmprestimos(estado, el) {
  const questao = estado.questao;
  if (!questao) {
    return;
  }
  const digitosA = digitosDe(questao.numeroA);

  el.conta.querySelectorAll('.celula-digito[data-tipo="operandoA"][data-coluna]')
    .forEach((celula) => {
      const indice = Number(celula.dataset.coluna);
      const digitoBase = digitosA[indice] ?? 0;
      const empresta = estado.emprestimos.has(indice);
      const recebe = estado.emprestimos.has(indice + 1);
      const novoValor = Math.max(0, digitoBase + (recebe ? 10 : 0) - 1);

      celula.classList.toggle('empresta', empresta);
      celula.classList.toggle('recebe', recebe);

      const risco = celula.querySelector('.risco');
      if (risco) {
        risco.hidden = !empresta;
      }

      const valorEmprestado = celula.querySelector('.valor-emprestado');
      if (valorEmprestado) {
        valorEmprestado.hidden = !empresta;
        valorEmprestado.textContent = empresta ? String(novoValor) : '';
      }

      const umEmprestado = celula.querySelector('.um-emprestado');
      if (umEmprestado) {
        umEmprestado.hidden = !(recebe && !empresta);
      }

      if (celula.tagName === 'BUTTON') {
        const destino = ehSubtracaoDecimal(questao)
          ? rotuloColunaDecimal(indice - 1, casasDecimaisMaximas(questao))
          : (ROTULOS_COLUNA[indice - 1] ?? 'unidades');
        const rotulo = 'Emprestar para a coluna das ' + destino
          + (empresta ? ' (emprestando 1)' : '');
        celula.setAttribute('aria-label', rotulo);
        celula.setAttribute('aria-pressed', String(empresta));
      }
    });
}

function atualizarDica(estado, el) {
  if (!estado.questao) {
    return;
  }
  if (estado.questao.operacao === 'SOMA') {
    el.dica.textContent = ehSomaDecimal(estado.questao)
      ? 'Alinhe os números pela vírgula e some da direita para a esquerda. Complete as casas decimais com zero quando precisar e suba o 1 ao passar de 9.'
      : 'Some os números que estão um embaixo do outro, da direita para a esquerda: se passar de 9, deixe o último número embaixo e suba o 1.';
  } else if (estado.questao.operacao === 'MULTIPLICACAO') {
    if (ehMultiplicacaoDecimal(estado.questao)) {
      const casas = casasDecimaisMultiplicacao(estado.questao);
      el.dica.textContent = 'Multiplique como se não houvesse vírgula, complete as casas decimais com zero e conte as casas dos dois fatores. Depois, use os botões da vírgula para marcar '
        + casas + (casas === 1 ? ' casa decimal' : ' casas decimais') + ' no resultado.';
    } else if (estado.questao.dificuldade === 'DIFICIL') {
      el.dica.textContent = 'Multiplique primeiro pela unidade do número de baixo, depois pela dezena (deslocando uma casa). No fim, some as duas parcelas da direita para a esquerda.';
    } else if (estado.questao.dificuldade === 'MEDIO') {
      el.dica.textContent = 'Multiplique o número de baixo pelo de cima (da direita para a esquerda): se passar de 9, deixe a unidade embaixo e suba o outro número para somar no vizinho';
    } else {
      el.dica.textContent = 'Dica: multiplique ' + estado.questao.numeroA + ' × ' + estado.questao.numeroB
        + '. Pense em grupos iguais: somar ' + estado.questao.numeroA
        + ' por ' + estado.questao.numeroB + ' vezes dá o mesmo resultado.';
    }
  } else if (estado.questao.operacao === 'DIVISAO') {
    if (ehDivisaoDecimal(estado.questao) && !divisaoDecimalEquivalente(estado.questao)) {
      el.dica.textContent = 'Iguale as casas decimais e elimine a vírgula para dividir. Acrescente zeros quando um número tiver menos casas que o outro.';
    } else if (estado.questao.dificuldade === 'DIFICIL') {
      el.dica.textContent = 'Dica: resolva etapa por etapa. Ajuste o dígito do quociente com os botões + e −, confira o produto, subtraia e desça o próximo algarismo. Se ficar parado, os dígitos ativos recebem destaque em amarelo.';
    } else if (estado.questao.dificuldade === 'MEDIO') {
      el.dica.textContent = 'Dica: ajuste a dezena do quociente com os botões + e −; o produto aparece sozinho. Subtraia, abaixe o próximo número e repita com a unidade.';
    } else {
      el.dica.textContent = 'Dica: procure quantas vezes o divisor cabe no dividendo. Escreva o quociente embaixo do divisor, multiplique e subtraia para encontrar o resto.';
    }
  } else if (estado.questao.operacao === 'SUBTRACAO') {
    if (ehSubtracaoDecimal(estado.questao)) {
      el.dica.textContent = 'Alinhe os números pela vírgula e subtraia da direita para a esquerda. Complete as casas decimais com zero quando precisar e peça emprestado ao vizinho quando o número de cima for menor.';
    } else if (estado.questao.dificuldade === 'DIFICIL') {
      el.dica.textContent = 'Dica: resolva da direita para a esquerda. Se o número de cima for menor, toque no vizinho da esquerda para pedir emprestado: ele diminui 1 e a coluna atual ganha 10. Empréstimos podem se encadear por várias colunas.';
    } else {
      el.dica.textContent = 'Dica: se o número de cima for menor, toque no número da esquerda para pedir emprestado. Ele diminui 1 e o vizinho ganha 10.';
    }
  } else {
    el.dica.textContent = 'Dica: se o número de cima for menor, toque no número da esquerda para pedir emprestado. Ele diminui 1 e o vizinho ganha 10.';
  }
}

function lerVaiUm(el) {
  return Array.from(el.conta.querySelectorAll('.caixa-vai-um'))
    .sort((a, b) => Number(a.dataset.coluna) - Number(b.dataset.coluna))
    .map((caixa) => caixa.value);
}

function lerResultados(el) {
  return Array.from(el.conta.querySelectorAll('.resultado-input'))
    .sort((a, b) => Number(a.dataset.coluna) - Number(b.dataset.coluna))
    .map((campo) => campo.value);
}

function lerResultadosLinha(el, linha) {
  return Array.from(el.conta.querySelectorAll(
    '.resultado-input[data-linha="' + linha + '"]',
  ))
    .sort((a, b) => Number(a.dataset.coluna) - Number(b.dataset.coluna))
    .map((campo) => campo.value);
}

function lerCampoInteiro(el, seletor) {
  const campo = el.conta.querySelector(seletor);
  const texto = String(campo?.value ?? '').trim();
  if (texto === '') {
    return null;
  }
  const numero = Number(texto);
  return Number.isInteger(numero) ? numero : null;
}

async function validarResposta(estado, el) {
  if (!podeValidarResposta(estado)) {
    return;
  }

  const questao = estado.questao;
  let requisicao;

  if (questao.operacao === 'DIVISAO') {
    if (ehDivisaoDificil(questao)) {
      const dados = estado.divisaoDificil
        ?? { ...montarModeloDivisaoDificil(questao), etapa: 1 };
      const quocientes = [];
      const subtracoes = [];
      const restos = [];

      for (const etapa of dados.etapas) {
        const campoQuociente = campoQuocienteDivisaoDificil(el, etapa.indice);
        const campoProduto = campoProdutoDivisaoDificil(el, etapa.indice);
        const campoResto = campoResultadoDivisaoDificil(el, etapa.indice);
        const quociente = normalizarDigitoQuociente(campoQuociente?.value);
        const produto = lerCampoInteiro(
          el,
          seletorProdutoDivisaoDificil(etapa.indice),
        );
        const resto = lerCampoInteiro(
          el,
          seletorRestoDivisaoDificil(etapa.indice),
        );

        if (quociente === null) {
          mostrarAviso(
            el,
            'Escreva o dígito da etapa ' + etapa.indice + ' do quociente. ✏️',
          );
          focarCampoDivisao(el, nomesCamposEtapaDivisao(
            etapa.indice,
            dados.etapas.length,
          ).quociente);
          return;
        }
        if (produto === null) {
          mostrarAviso(
            el,
            'Ajuste o quociente da etapa ' + etapa.indice + ' antes de conferir. ✏️',
          );
          focarCampoDivisao(el, nomesCamposEtapaDivisao(
            etapa.indice,
            dados.etapas.length,
          ).quociente);
          return;
        }
        if (resto === null) {
          mostrarAviso(
            el,
            'Escreva o resto da etapa ' + etapa.indice + ' antes de conferir. ✏️',
          );
          focarCampoDivisao(el, nomesCamposEtapaDivisao(
            etapa.indice,
            dados.etapas.length,
          ).resto);
          return;
        }

        quocientes.push(quociente);
        subtracoes.push(produto);
        restos.push(resto);
      }

      requisicao = montarRequisicao(questao, {
        resultadoDigitado: comporQuocienteDivisaoEtapas(quocientes),
        quocientesParciaisDigitados: quocientes,
        subtracoesParciaisDigitadas: subtracoes,
        restosParciaisDigitados: restos,
        restoDigitado: restos[restos.length - 1],
      });
    } else if (ehDivisaoLonga(questao)) {
      const quocienteParcial = lerCampoInteiro(
        el,
        SELETORES_CAMPOS_DIVISAO.quocienteParcial,
      );
      const subtracaoParcial = lerCampoInteiro(
        el,
        SELETORES_CAMPOS_DIVISAO.subtracaoParcial,
      );
      const restoParcial = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.restoParcial);
      const quocienteFinal = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.quocienteFinal);
      const subtracaoFinal = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.subtracaoFinal);
      const resto = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.restoFinal);

      if (quocienteParcial === null) {
        mostrarAviso(el, 'Escreva o quociente da primeira etapa antes de conferir. ✏️');
        focarCampoDivisao(el, 'quocienteParcial');
        return;
      }
      if (subtracaoParcial === null) {
        mostrarAviso(el, 'Escreva a subtração da primeira etapa antes de conferir. ✏️');
        focarCampoDivisao(el, 'subtracaoParcial');
        return;
      }
      if (restoParcial === null) {
        mostrarAviso(el, 'Escreva o resto da primeira etapa antes de conferir. ✏️');
        focarCampoDivisao(el, 'restoParcial');
        return;
      }
      if (quocienteFinal === null) {
        mostrarAviso(el, 'Escreva o quociente da segunda etapa antes de conferir. ✏️');
        focarCampoDivisao(el, 'quocienteFinal');
        return;
      }
      if (subtracaoFinal === null) {
        mostrarAviso(el, 'Escreva a subtração da segunda etapa antes de conferir. ✏️');
        focarCampoDivisao(el, 'subtracaoFinal');
        return;
      }
      if (resto === null) {
        mostrarAviso(el, 'Escreva o resto final antes de conferir. ✏️');
        focarCampoDivisao(el, 'restoFinal');
        return;
      }

      requisicao = montarRequisicao(questao, {
        resultadoDigitado: comporQuocienteDivisaoMedia(quocienteParcial, quocienteFinal),
        quocienteParcialDigitado: quocienteParcial,
        subtracaoParcialDigitada: subtracaoParcial,
        restoParcialDigitado: restoParcial,
        quocienteFinalDigitado: quocienteFinal,
        subtracaoFinalDigitada: subtracaoFinal,
        restoDigitado: resto,
      });
    } else {
      const quociente = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.quociente);
      const subtracao = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.subtracao);
      const resto = lerCampoInteiro(el, SELETORES_CAMPOS_DIVISAO.resto);

      if (quociente === null) {
        mostrarAviso(el, 'Escreva o quociente antes de conferir. ✏️');
        focarCampoDivisao(el, 'quociente');
        return;
      }
      if (subtracao === null) {
        mostrarAviso(el, 'Escreva a subtração intermediária antes de conferir. ✏️');
        focarCampoDivisao(el, 'subtracao');
        return;
      }
      if (resto === null) {
        mostrarAviso(el, 'Escreva o resto antes de conferir. ✏️');
        focarCampoDivisao(el, 'resto');
        return;
      }

      requisicao = montarRequisicao(questao, {
        resultadoDigitado: quociente,
        subtracaoDigitada: subtracao,
        restoDigitado: resto,
      });
    }
  } else {
    const multiplicacao = questao.operacao === 'MULTIPLICACAO';
    const multiplicacaoGuiada = ehMultiplicacaoGuiada(questao);
    const resultadoDigitado = comporResultado(
      multiplicacaoGuiada
        ? lerResultadosLinha(el, 'resultadoSoma')
        : lerResultados(el),
    );
    if (resultadoDigitado === null) {
      mostrarAviso(
        el,
        multiplicacaoGuiada
          ? 'Complete a soma final antes de conferir. ✏️'
          : 'Escreva o resultado nas caixas antes de conferir. ✏️',
      );
      const unidades = el.conta.querySelector(
        multiplicacaoGuiada
          ? '.resultado-input[data-linha="resultadoSoma"][data-coluna="0"]'
          : '.resultado-input[data-coluna="0"]',
      );
      if (unidades) {
        unidades.focus();
      }
      return;
    }

    const soma = questao.operacao === 'SOMA';
    const subtracao = questao.operacao === 'SUBTRACAO';
    const decimal = ehOperacaoDecimal(questao);
    const casas = casasDecimaisMaximas(questao);
    const digitos = digitosDosOperandos(questao.dificuldade, questao.operacao);
    const digitosCalculo = decimal
      ? (subtracao
        ? (estado.subtracaoDificil?.digitos
          ?? colunasInteirasDecimais(questao.numeroA, questao.numeroB) + casas)
        : digitosSomaDecimal(questao.dificuldade, casas))
      : digitos;
    const caixasVaiUm = lerVaiUm(el);
    requisicao = montarRequisicao(questao, {
      resultadoDigitado,
      vaiUm: soma
        ? montarArrayVaiUm(
          caixasVaiUm,
          digitosCalculo,
          calcularVaiUm(questao.numeroA, questao.numeroB),
        )
        : null,
      emprestados: subtracao
        ? montarArrayEmprestimos(estado.emprestimos, digitosCalculo)
        : null,
      vaiUmMultiplicacao: multiplicacao && !multiplicacaoGuiada
        ? lerVaiUmMultiplicacao(caixasVaiUm)
        : null,
      casasDecimaisResultado: estado.casasDecimaisResultado,
    });
  }

  estado.dicaProgressiva?.parar();
  estado.validando = true;
  atualizarControles(estado, el);
  el.btnValidar.textContent = 'Conferindo...';
  const concluirAviso = estado.avisoServidor.iniciar();

  try {
    const resposta = await fetch(API_BASE + '/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requisicao),
    });

    if (!resposta.ok) {
      throw new Error('O servidor respondeu ' + resposta.status);
    }

    const dados = await resposta.json();
    estado.questaoRespondida = true;
    const resolucao = atualizarPlacar(estado, el, dados);
    abrirFeedback(el, dados, resolucao, estado.jogador);
    if (dados.correto) {
      estado.dicaProgressiva?.parar();
    } else {
      estado.dicaProgressiva?.acionarErro();
    }
  } catch (erro) {
    console.error(erro);
    mostrarAviso(el, 'Não consegui conferir agora. O servidor está rodando na porta 8080?');
    if (estado.questao) {
      estado.dicaProgressiva?.reiniciar();
    }
  } finally {
    concluirAviso();
    estado.validando = false;
    atualizarControles(estado, el);
    el.btnValidar.textContent = 'Conferir resposta';
  }
}

function carregarPlacar(estado, el) {
  try {
    const salvoAtual = localStorage.getItem(CHAVE_PLACAR);
    const salvoLegado = localStorage.getItem(CHAVE_PLACAR_LEGADA);
    const salvo = JSON.parse(salvoAtual || salvoLegado || 'null');
    if (salvo) {
      estado.pontos = Math.max(0, Number(salvo.pontos) || 0);
      estado.sequencia = Math.min(Math.max(0, Number(salvo.sequencia) || 0), META_NIVEL);
      if (!salvoAtual && salvoLegado) {
        localStorage.setItem(CHAVE_PLACAR, JSON.stringify({
          pontos: estado.pontos,
          sequencia: estado.sequencia,
        }));
        localStorage.removeItem(CHAVE_PLACAR_LEGADA);
      }
    }
  } catch (erro) {
    console.warn('Placar salvo indisponível.', erro);
  }
  estado.progresso = calcularProgresso(estado.sequencia);
  atualizarPlacarVisual(estado, el);
  atualizarBarraProgresso(estado, el);
}

function salvarPlacar(estado) {
  try {
    localStorage.setItem(CHAVE_PLACAR, JSON.stringify({
      pontos: estado.pontos,
      sequencia: estado.sequencia,
    }));
  } catch (erro) {
    console.warn('Não foi possível salvar o placar.', erro);
  }
}

function atualizarPlacar(estado, el, dados) {
  const resolucao = resolverProgresso(
    estado.sequencia,
    estado.dificuldade,
    dados.correto,
    META_NIVEL,
    estado.questao?.operacao,
  );

  estado.pontos += dados.pontosGanhos;
  estado.sequencia = resolucao.sequencia;
  estado.progresso = resolucao.progresso;

  if (resolucao.dificuldade !== estado.dificuldade) {
    estado.dificuldade = resolucao.dificuldade;
    atualizarNiveisDificuldade(estado, el);
  }

  salvarPlacar(estado);
  atualizarPlacarVisual(estado, el);
  atualizarBarraProgresso(estado, el, resolucao);

  if (dados.pontosGanhos > 0) {
    el.pontos.classList.remove('pulsar');
    void el.pontos.offsetWidth;
    el.pontos.classList.add('pulsar');
  }

  return resolucao;
}

function atualizarBarraProgresso(estado, el, resolucao) {
  const progresso = Math.min(Math.max(Number(estado.progresso) || 0, 0), 1);
  const acertos = Math.round(progresso * META_NIVEL);
  const porcentagem = Math.round(progresso * 100);

  if (el.progressoPreenchimento) {
    el.progressoPreenchimento.style.width = porcentagem + '%';
  }
  if (el.barraProgresso) {
    el.barraProgresso.setAttribute('aria-valuenow', String(acertos));
    el.barraProgresso.setAttribute(
      'aria-valuetext',
      acertos + ' de ' + META_NIVEL + ' acertos seguidos',
    );
  }
  if (el.progressoNivel) {
    el.progressoNivel.textContent = ROTULOS_DIFICULDADE[estado.dificuldade] ?? estado.dificuldade;
  }
  if (el.progressoAcertos) {
    el.progressoAcertos.textContent = String(acertos);
  }
  if (el.progressoLegenda) {
    if (resolucao && resolucao.subiuNivel) {
      const rotulo = ROTULOS_DIFICULDADE[resolucao.dificuldade] ?? resolucao.dificuldade;
      el.progressoLegenda.textContent = 'Nível ' + rotulo + ' desbloqueado!';
    } else if (resolucao && resolucao.nivelMaximo) {
      el.progressoLegenda.textContent = 'Nível máximo alcançado! Continue praticando.';
    } else {
      el.progressoLegenda.textContent = 'Acerte ' + META_NIVEL + ' seguidas para subir de nível!';
    }
  }
  if (el.progresso) {
    el.progresso.classList.remove('nivel-novo');
    if (resolucao && (resolucao.subiuNivel || resolucao.nivelMaximo)) {
      void el.progresso.offsetWidth;
      el.progresso.classList.add('nivel-novo');
    }
  }
}

function atualizarPlacarVisual(estado, el) {
  el.pontos.textContent = String(estado.pontos);
  el.sequencia.textContent = String(estado.sequencia);
}

function abrirFeedback(el, dados, resolucao, nomeJogador) {
  if (resolucao && resolucao.subiuNivel) {
    el.modalEmoji.textContent = '🚀';
  } else if (resolucao && resolucao.nivelMaximo) {
    el.modalEmoji.textContent = '🏆';
  } else if (dados.correto) {
    el.modalEmoji.textContent = '🎉';
  } else if (dados.pontosGanhos > 0) {
    el.modalEmoji.textContent = '💡';
  } else {
    el.modalEmoji.textContent = '🌱';
  }

  el.modalTitulo.textContent = montarTituloFeedback(nomeJogador, dados, resolucao);

  let mensagemNivel = '';
  if (resolucao && resolucao.subiuNivel) {
    const rotulo = ROTULOS_DIFICULDADE[resolucao.dificuldade] ?? resolucao.dificuldade;
    mensagemNivel = 'Agora o desafio é no nível ' + rotulo + '. ';
  } else if (resolucao && resolucao.nivelMaximo) {
    mensagemNivel = 'Você completou mais uma rodada no nível máximo! ';
  }

  el.modalMensagem.textContent = mensagemNivel + dados.mensagem;
  el.modalPontos.textContent = dados.pontosGanhos > 0
    ? '+' + dados.pontosGanhos + ' ponto' + (dados.pontosGanhos === 1 ? '' : 's')
    : '0 pontos desta vez';

  el.modal.hidden = false;
  el.modalProxima.focus();

  if (dados.correto) {
    dispararConfete(el.confete);
  }
}

function fecharModal(el) {
  el.modal.hidden = true;
  const alvo = el.btnValidar && !el.btnValidar.disabled
    ? el.btnValidar
    : el.btnNovaQuestao;
  if (alvo) {
    alvo.focus();
  }
}

function mostrarAviso(el, texto) {
  window.clearTimeout(el.avisoTemporizador);
  el.aviso.textContent = texto;
  el.aviso.hidden = false;
  el.avisoTemporizador = window.setTimeout(() => {
    el.aviso.hidden = true;
  }, 3600);
}

function dispararConfete(canvas) {
  if (!canvas || typeof window === 'undefined') {
    return;
  }
  const reduzirMovimento = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzirMovimento) {
    return;
  }

  const contexto = canvas.getContext('2d');
  if (!contexto) {
    return;
  }

  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const escala = window.devicePixelRatio || 1;
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  canvas.style.width = largura + 'px';
  canvas.style.height = altura + 'px';
  contexto.setTransform(escala, 0, 0, escala, 0, 0);

  const cores = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b', '#9b5de5'];
  const pecas = Array.from({ length: 130 }, () => ({
    x: Math.random() * largura,
    y: -20 - Math.random() * altura * 0.4,
    tamanho: 6 + Math.random() * 8,
    velocidadeX: (Math.random() - 0.5) * 2.4,
    velocidadeY: 2.2 + Math.random() * 3.2,
    rotacao: Math.random() * Math.PI,
    giro: (Math.random() - 0.5) * 0.3,
    cor: cores[Math.floor(Math.random() * cores.length)],
  }));

  const inicio = performance.now();
  const duracao = 2600;

  function animar(agora) {
    const decorrido = agora - inicio;
    contexto.clearRect(0, 0, largura, altura);

    pecas.forEach((peca) => {
      peca.x += peca.velocidadeX;
      peca.y += peca.velocidadeY;
      peca.velocidadeY += 0.045;
      peca.rotacao += peca.giro;

      contexto.save();
      contexto.translate(peca.x, peca.y);
      contexto.rotate(peca.rotacao);
      contexto.fillStyle = peca.cor;
      contexto.fillRect(-peca.tamanho / 2, -peca.tamanho / 2, peca.tamanho, peca.tamanho * 0.6);
      contexto.restore();
    });

    if (decorrido < duracao) {
      window.requestAnimationFrame(animar);
    } else {
      contexto.clearRect(0, 0, largura, altura);
    }
  }

  window.requestAnimationFrame(animar);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEMAS_POR_OPERACAO,
    TEMA_OPERACAO_PADRAO,
    temaDaOperacao,
    aplicarTemaOperacao,
    digitosDe,
    quantidadeColunas,
    digitosDosOperandos,
    digitosDoMultiplicador,
    calcularVaiUmMultiplicacao,
    resultadoDezenaMultiplicacao,
    multiplicacaoPrecisaCentena,
    ehMultiplicacaoDificil,
    ehMultiplicacaoDecimal,
    ehMultiplicacaoGuiada,
    casasDecimaisMultiplicacao,
    digitosParteInteiraEscalada,
    montarModeloMultiplicacaoDecimal,
    colunaGradeMultiplicacaoDecimal,
    formatarComCasasDecimais,
    resultadoMultiplicacaoDecimalDigitado,
    atualizarVirgulaResultadoMultiplicacao,
    criarControleVirgulaMultiplicacao,
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
    ehSomaDecimal,
    ehSubtracaoDecimal,
    ehOperacaoDecimal,
    ehSomaGuiada,
    ehSubtracaoGuiada,
    casasDecimaisMaximas,
    digitosEscalados,
    digitosSomaDecimal,
    quantidadeCaixasVaiUmDecimal,
    colunasInteirasSomaDecimal,
    colunaGradeDecimal,
    colunaGradeSomaDecimal,
    colunasInteirasSubtracaoDecimal,
    digitosParteInteiraDecimal,
    colunasInteirasDecimais,
    casasDecimaisDoOperando,
    ehZeroFantasmaDecimal,
    digitoDecimalPreenchido,
    colunaGradeSubtracaoDecimal,
    rotuloColunaDecimal,
    montarModeloSomaDificil,
    montarModeloSomaDecimal,
    seletoresDicaSomaDificil,
    resolverAlvoDicaSomaDificil,
    alvoDoCampoResultadoSoma,
    valorEsperadoSomaDificil,
    alvoIncorretoSomaDificil,
    seletoresDicaAtualSomaDificil,
    ehSubtracaoDificil,
    ordemFocoSubtracaoDificil,
    montarModeloSubtracaoDificil,
    montarModeloSubtracaoDecimal,
    seletoresDicaSubtracaoDificil,
    resolverAlvoDicaSubtracaoDificil,
    alvoDoCampoResultadoSubtracao,
    valorEsperadoSubtracaoDificil,
    alvoIncorretoSubtracaoDificil,
    seletoresDicaAtualSubtracaoDificil,
    seletoresDicaAtual,
    ehDivisaoDificil,
    ehDivisaoDecimal,
    divisaoDecimalEquivalente,
    casasDecimaisDivisao,
    ehDivisaoLongaGuiada,
    calcularEtapasDivisaoLonga,
    montarModeloDivisaoLonga,
    montarModeloDivisaoDificil,
    modeloDivisaoDaQuestao,
    nomesCamposEtapaDivisao,
    ordemCamposDivisaoDificil,
    comporQuocienteDivisaoEtapas,
    seletorQuocienteDivisaoDificil,
    seletorDivisorDivisaoDificil,
    seletorProdutoDivisaoDificil,
    seletorRestoDivisaoDificil,
    seletorParcialDivisaoDificil,
    seletorDesceDivisaoDificil,
    digitoAbaixadoDivisaoDificil,
    alvoDoCampoDivisaoDificil,
    valorEsperadoDivisaoDificil,
    alvoIncorretoDivisaoDificil,
    seletoresDicaDivisaoDificil,
    seletoresDicaAtualDivisaoDificil,
    ORDEM_CAMPOS_DIVISAO_DIFICIL,
    ESTAGIOS_MAXIMOS_DIVISAO,
    TEMPO_INATIVIDADE_DICA,
    TIPOS_NUMERO,
    TIPO_NUMERO_PADRAO,
    ROTULOS_TIPO_NUMERO,
    CASAS_DECIMAIS_SOMA,
    CLASSE_DICA_CARRY,
    LINHAS_MULTIPLICACAO_DIFICIL,
    quantidadeCaixasVaiUm,
    niveisDificuldade,
    dificuldadePermitida,
    proximaDificuldade,
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
    tratarTeclaFluxoFoco,
    tratarTeclaVaiUm,
    tratarTeclaDivisao,
    ORDEM_CAMPOS_DIVISAO_MEDIA,
    ROTULOS_DIVISAO,
    ehDivisaoLonga,
    ehDivisaoMedia,
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
    atualizarTipoNumero,
    atualizarSegmentado,
    podeIniciarQuestao,
    podeValidarResposta,
    normalizarNomeJogador,
    nomeJogadorValido,
    lerNomeJogador,
    salvarNomeJogador,
    montarTituloFeedback,
    criarAvisoServidor,
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarInterface);
  } else {
    iniciarInterface();
  }
}