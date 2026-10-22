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
  focarProximoMultiplicacao,
  focarResultadoPorColuna,
  focarVaiUmPorColuna,
  tratarTeclaResultado,
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

const DIGITOS_POR_DIFICULDADE = { FACIL: 2, MEDIO: 3 };
const ROTULOS_COLUNA = ['unidades', 'dezenas', 'centenas', 'milhares'];
const CHAVE_PLACAR = 'reforco-tia-thais-placar';
const CHAVE_PLACAR_LEGADA = 'lousa-matematica-placar';
const CHAVE_JOGADOR = 'reforco-tia-thais-jogador';
const LIMITE_NOME_JOGADOR = 30;
const LIMITE_AVISO_SERVIDOR = 2000;
const META_NIVEL = 5;
const NIVEIS_DIFICULDADE = ['FACIL', 'MEDIO'];
const ROTULOS_DIFICULDADE = { FACIL: 'Fácil', MEDIO: 'Médio' };
const ORDEM_CAMPOS_DIVISAO = ['quociente', 'subtracao', 'resto'];
const ORDEM_CAMPOS_DIVISAO_MEDIA = [
  'quocienteParcial',
  'quocienteFinal',
  'subtracaoParcial',
  'restoParcial',
  'subtracaoFinal',
  'restoFinal',
];
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

function digitosDe(numero) {
  return String(Math.abs(Math.trunc(numero)))
    .split('')
    .reverse()
    .map((digito) => Number(digito));
}

function quantidadeColunas(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return dificuldade === 'FACIL' ? 2 : 3;
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos + (operacao === 'SOMA' ? 1 : 0);
}

function digitosDosOperandos(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return dificuldade === 'FACIL' ? 1 : 2;
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos;
}

function digitosDoMultiplicador(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    return 1;
  }
  return digitosDosOperandos(dificuldade, operacao);
}

function calcularVaiUmMultiplicacao(numeroA, numeroB) {
  const a = Math.abs(Math.trunc(Number(numeroA) || 0));
  const b = Math.abs(Math.trunc(Number(numeroB) || 0));
  return Math.floor(((a % 10) * b) / 10);
}

/*
- Só existem caixinhas de "vai um" entre as colunas dos operandos: uma acima
- das dezenas (2 dígitos) ou duas, acima das dezenas e das centenas (3 dígitos).
- O transporte final, que vira o dígito extra do resultado, é calculado sozinho.
 */
function quantidadeCaixasVaiUm(dificuldade) {
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos - 1;
}

function proximaDificuldade(dificuldade) {
  const indice = NIVEIS_DIFICULDADE.indexOf(dificuldade);
  if (indice === -1) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return NIVEIS_DIFICULDADE[indice + 1] ?? null;
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
function resolverProgresso(sequenciaAtual, dificuldadeAtual, correto, meta = META_NIVEL) {
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

  const proxima = proximaDificuldade(dificuldadeAtual);
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

function ehDivisaoLonga(questao) {
  if (!questao || questao.operacao !== 'DIVISAO') {
    return false;
  }
  const dividendo = Number(questao.numeroA);
  const divisor = Number(questao.numeroB);
  return Number.isInteger(dividendo)
    && Number.isInteger(divisor)
    && dividendo >= 100
    && dividendo <= 999
    && divisor >= 10
    && divisor <= 99
    && Math.floor(dividendo / divisor) >= 10;
}

function ehDivisaoMedia(questao) {
  return Boolean(questao)
    && questao.operacao === 'DIVISAO'
    && questao.dificuldade === 'MEDIO';
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

  if (divisao) {
    requisicao.subtracaoDigitada = entradas.subtracaoDigitada ?? null;
    requisicao.restoDigitado = entradas.restoDigitado ?? null;
    if (ehDivisaoLonga(questao)) {
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
    && !estado.questaoRespondida;
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
    avisoServidor: criarAvisoServidor(el),
  };

  aplicarPreferencias(estado, typeof window !== 'undefined' ? window.location.search : '');
  atualizarSegmentado(el.seletorOperacao, estado.operacao);
  atualizarSegmentado(el.seletorDificuldade, estado.dificuldade);
  carregarPlacar(estado, el);
  configurarNomeJogador(estado, el);

  el.seletorOperacao.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-operacao]');
    if (!botao) {
      return;
    }
    estado.operacao = botao.dataset.operacao;
    atualizarSegmentado(el.seletorOperacao, estado.operacao);
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

  if (operacao === 'SOMA' || operacao === 'SUBTRACAO' || operacao === 'MULTIPLICACAO'
    || operacao === 'DIVISAO') {
    estado.operacao = operacao;
  }
  if (dificuldade === 'FACIL' || dificuldade === 'MEDIO') {
    estado.dificuldade = dificuldade;
  }
  return estado;
}

function atualizarSegmentado(container, valor) {
  const chave = container.id === 'seletor-operacao' ? 'operacao' : 'dificuldade';
  container.querySelectorAll('[data-' + chave + ']').forEach((botao) => {
    const ativo = botao.dataset[chave] === valor;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
}

function atualizarControles(estado, el) {
  const ocupado = estado.carregando || estado.validando;
  const respondida = Boolean(estado.questaoRespondida);
  const desabilitarResposta = ocupado || respondida;

  [el.seletorOperacao, el.seletorDificuldade].forEach((container) => {
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
  if (el.btnValidar) {
    el.btnValidar.disabled = desabilitarResposta || !estado.questao;
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

  estado.carregando = true;
  estado.questaoRespondida = false;
  const pedido = estado.pedido + 1;
  estado.pedido = pedido;
  atualizarControles(estado, el);
  mostrarPlaceholder(el, 'Buscando um desafio...', false);
  const concluirAviso = estado.avisoServidor.iniciar();

  try {
    const url = API_BASE + '/proxima-questao?operacao='
      + encodeURIComponent(estado.operacao)
      + '&dificuldade=' + encodeURIComponent(estado.dificuldade);
    const resposta = await fetch(url);

    if (pedido !== estado.pedido) {
      return;
    }
    if (!resposta.ok) {
      throw new Error('O servidor respondeu ' + resposta.status);
    }

    estado.questao = await resposta.json();
    estado.emprestimos = new Set();
    estado.progresso = calcularProgresso(estado.sequencia);
    esconderPlaceholder(el);
    atualizarBarraProgresso(estado, el);
    renderConta(estado, el);
    atualizarDica(estado, el);
  } catch (erro) {
    console.error(erro);
    if (pedido !== estado.pedido) {
      return;
    }
    estado.questao = null;
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
  el.conta.classList.toggle('conta-divisao', divisao);
  if (divisao) {
    renderDivisao(estado, el);
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
  const transportesSoma = soma
    ? calcularVaiUm(questao.numeroA, questao.numeroB)
    : [];
  const ordemFoco = multiplicacao
    ? ordemFocoMultiplicacao(colunas, carryMultiplicacao > 0)
    : (soma ? ordemFocoSoma(digitosA, transportesSoma) : []);

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
      criarCelulaOperandoB(valoresB[indice] ?? 0, colunaDaGrade(indice)),
    );
  }

  const linha = document.createElement('div');
  linha.className = 'linha';
  linha.style.gridColumn = '2 / ' + (colunas + 2);
  linha.style.gridRow = '4';
  el.conta.appendChild(linha);

  const contexto = { el, ordemFoco, colunas, soma, multiplicacao };
  for (let indice = 0; indice < colunas; indice += 1) {
    el.conta.appendChild(
      criarCampoResultado(indice, colunaDaGrade(indice), contexto),
    );
  }

  if (subtracao) {
    atualizarEmprestimos(estado, el);
  }
}

function criarCaixaVaiUmSoma(indice, colunaGrade, el, ordemFoco) {
  const caixa = document.createElement('input');
  caixa.type = 'text';
  caixa.className = 'caixa-vai-um';
  caixa.dataset.coluna = String(indice);
  caixa.maxLength = 1;
  caixa.inputMode = 'numeric';
  caixa.autocomplete = 'off';
  caixa.placeholder = '·';
  caixa.setAttribute(
    'aria-label',
    'Vai um para a coluna das ' + (ROTULOS_COLUNA[indice] ?? 'milhares'),
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

function criarCelulaOperandoA(indice, digito, colunaGrade, podeEmprestar, estado, el) {
  const celula = podeEmprestar
    ? document.createElement('button')
    : document.createElement('div');
  if (podeEmprestar) {
    celula.type = 'button';
  }
  celula.className = 'celula-digito' + (podeEmprestar ? ' clicavel' : '');
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
      'Pedir emprestado para a coluna das ' + (ROTULOS_COLUNA[indice - 1] ?? 'unidades'),
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

function criarCelulaOperandoB(digito, colunaGrade) {
  const celula = document.createElement('div');
  celula.className = 'celula-digito';
  celula.style.gridColumn = String(colunaGrade);
  celula.style.gridRow = '3';

  const conteudo = document.createElement('span');
  conteudo.className = 'digito';
  conteudo.textContent = String(digito);
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
  const { el, ordemFoco, colunas, soma, multiplicacao } = contexto;

  campo.addEventListener('input', () => {
    campo.value = campo.value.replace(/\D/g, '').slice(-1);
    if (campo.value === '') {
      return;
    }

    if (soma && indice > 0) {
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
      focarProximoMultiplicacao(el, ordemFoco, { tipo: 'resultado', coluna: indice });
    } else {
      focarResultadoPorColuna(el, indice + 1);
    }
  });
}

function configurarTecladoResultado(campo, indice, contexto) {
  const { el, ordemFoco, colunas, soma, multiplicacao } = contexto;

  campo.addEventListener('keydown', (evento) => {
    const tratado = tratarTeclaResultado(evento, {
      el,
      ordemFoco,
      indice,
      colunas,
      usarOrdemFoco: soma || multiplicacao,
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

function criarCampoResultado(indice, colunaGrade, contexto) {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.className = 'resultado-input';
  campo.dataset.coluna = String(indice);
  campo.maxLength = 1;
  campo.inputMode = 'numeric';
  campo.autocomplete = 'off';
  campo.setAttribute(
    'aria-label',
    'Resultado na coluna das ' + (ROTULOS_COLUNA[indice] ?? 'milhares'),
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
  estado = null,
) {
  campo.dataset.campo = nome;
  configurarEntradaCampoDivisao(campo, nome, el, ordem);
  configurarFocoCampoDivisao(campo, nome, el, estado);
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

function configurarFocoCampoDivisao(campo, nome, el, estado) {
  campo.addEventListener('focus', () => {
    if (!estado || !estado.apoioDivisao || !ehDivisaoMedia(estado.questao)) {
      return;
    }
    const etapa = etapaDoCampoDivisao(nome);
    if (etapa && estado.apoioDivisao.etapa !== etapa) {
      estado.apoioDivisao.etapa = etapa;
      renderApoioDivisao(estado, el);
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

function renderDivisao(estado, el) {
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
  const digitosQuocienteParcial = Math.max(1, quantidadeDigitos(questao.quocienteParcial));
  const digitosSubtracaoParcial = Math.max(1, quantidadeDigitos(questao.subtracaoParcial));
  const digitosRestoParcial = Math.max(1, quantidadeDigitos(questao.restoParcial));
  const digitosSubtracaoFinal = Math.max(1, quantidadeDigitos(questao.subtracaoFinal));
  const digitosResto = Math.max(1, quantidadeDigitos(questao.resto));
  const ordem = ORDEM_CAMPOS_DIVISAO_MEDIA;

  estado.apoioDivisao = { etapa: 1, multiplicador: 0 };

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

  const sinalParcial = document.createElement('span');
  sinalParcial.className = 'divisao-sinal';
  sinalParcial.textContent = '−';
  sinalParcial.setAttribute('aria-hidden', 'true');

  const campoSubtracaoParcial = criarCampoDivisao(
    'divisao-subtracao-input divisao-subtracao-parcial',
    'Subtração da primeira etapa',
    digitosSubtracaoParcial,
  );
  const linhaSubtracaoParcial = document.createElement('div');
  linhaSubtracaoParcial.className = 'divisao-subtracao divisao-subtracao-etapa-1';
  linhaSubtracaoParcial.append(sinalParcial, campoSubtracaoParcial);

  const campoQuocienteParcial = criarCampoDivisao(
    'divisao-quociente divisao-quociente-parcial',
    'Quociente da primeira etapa',
    digitosQuocienteParcial,
  );

  const campoRestoParcial = criarCampoDivisao(
    'divisao-resto-input divisao-resto-parcial-input',
    'Resto da primeira etapa',
    digitosRestoParcial,
  );
  const linhaRestoParcial = document.createElement('div');
  linhaRestoParcial.className = 'divisao-linha-resto divisao-linha-resto-parcial';
  linhaRestoParcial.appendChild(campoRestoParcial);

  const abaixado = document.createElement('div');
  abaixado.className = 'divisao-abaixado';
  abaixado.setAttribute('aria-label', 'Número abaixado ' + questao.dividendoAbaixado);
  const seta = document.createElement('span');
  seta.className = 'divisao-abaixado-seta';
  seta.textContent = '↓';
  seta.setAttribute('aria-hidden', 'true');
  const valorAbaixado = document.createElement('span');
  valorAbaixado.textContent = String(questao.dividendoAbaixado);
  abaixado.append(seta, valorAbaixado);

  const campoQuocienteFinal = criarCampoDivisao(
    'divisao-quociente-final',
    'Quociente da segunda etapa',
    1,
  );

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

  const campoSubtracaoFinal = criarCampoDivisao(
    'divisao-subtracao-input divisao-subtracao-final',
    'Subtração da segunda etapa',
    digitosSubtracaoFinal,
  );
  const linhaSubtracaoFinal = document.createElement('div');
  linhaSubtracaoFinal.className = 'divisao-subtracao divisao-subtracao-etapa-2';
  linhaSubtracaoFinal.append(sinalFinal, campoSubtracaoFinal);

  const campoResto = criarCampoDivisao(
    'divisao-resto-input divisao-resto-final-input',
    'Resto final',
    digitosResto,
  );
  const linhaRestoFinal = document.createElement('div');
  linhaRestoFinal.className = 'divisao-linha-resto divisao-linha-resto-final';
  linhaRestoFinal.append(
    campoResto,
    criarRotuloDivisao(ROTULOS_DIVISAO.resto, 'divisao-rotulo-resto'),
  );

  configurarCampoDivisao(campoQuocienteParcial, 'quocienteParcial', el, ordem, estado);
  configurarCampoDivisao(campoSubtracaoParcial, 'subtracaoParcial', el, ordem, estado);
  configurarCampoDivisao(campoRestoParcial, 'restoParcial', el, ordem, estado);
  configurarCampoDivisao(campoQuocienteFinal, 'quocienteFinal', el, ordem, estado);
  configurarCampoDivisao(campoSubtracaoFinal, 'subtracaoFinal', el, ordem, estado);
  configurarCampoDivisao(campoResto, 'restoFinal', el, ordem, estado);

  divisao.append(
    dividendo,
    chave,
    divisor,
    linhaSubtracaoParcial,
    areaQuociente,
    linhaRestoParcial,
    abaixado,
    linhaSubtracaoFinal,
    linhaRestoFinal,
  );
  el.conta.appendChild(divisao);
  el.conta.appendChild(criarApoioDivisao(estado, el));
  renderApoioDivisao(estado, el);
}

function criarApoioDivisao(estado, el) {
  const painel = document.createElement('aside');
  painel.className = 'apoio-divisao';
  painel.setAttribute('aria-label', 'Multiplicações do divisor');

  const divisor = document.createElement('p');
  divisor.className = 'apoio-divisor';
  const rotuloDivisor = document.createElement('span');
  rotuloDivisor.className = 'apoio-divisor-rotulo';
  rotuloDivisor.textContent = 'Divisor';
  const valorDivisor = document.createElement('strong');
  valorDivisor.className = 'apoio-divisor-valor';
  valorDivisor.textContent = String(estado.questao.numeroB);
  divisor.append(rotuloDivisor, valorDivisor);

  const calculo = document.createElement('div');
  calculo.className = 'apoio-calculo';
  const menos = document.createElement('button');
  menos.type = 'button';
  menos.className = 'apoio-menos';
  menos.textContent = '−';
  menos.setAttribute('aria-label', 'Diminuir multiplicador');
  menos.addEventListener('click', () => {
    if (!estado.apoioDivisao) {
      return;
    }
    estado.apoioDivisao.multiplicador = ajustarMultiplicador(
      estado.apoioDivisao.multiplicador,
      -1,
    );
    renderApoioDivisao(estado, el);
  });
  const expressao = document.createElement('span');
  expressao.className = 'apoio-expressao';
  expressao.setAttribute('aria-live', 'polite');
  const mais = document.createElement('button');
  mais.type = 'button';
  mais.className = 'apoio-mais';
  mais.textContent = '+';
  mais.setAttribute('aria-label', 'Aumentar multiplicador');
  mais.addEventListener('click', () => {
    if (!estado.apoioDivisao) {
      return;
    }
    estado.apoioDivisao.multiplicador = ajustarMultiplicador(
      estado.apoioDivisao.multiplicador,
      1,
    );
    renderApoioDivisao(estado, el);
  });
  calculo.append(menos, expressao, mais);

  painel.append(divisor, calculo);
  return painel;
}

function renderApoioDivisao(estado, el) {
  if (!estado.questao || !estado.apoioDivisao) {
    return;
  }
  const painel = el.conta.querySelector('.apoio-divisao');
  if (!painel) {
    return;
  }

  const etapa = estado.apoioDivisao.etapa === 2 ? 2 : 1;
  const alvo = alvoApoioDivisao(estado.questao, etapa);
  const avaliacao = avaliarMultiploDivisao(
    estado.questao.numeroB,
    estado.apoioDivisao.multiplicador,
    alvo,
  );

  painel.querySelector('.apoio-divisor-valor').textContent = String(estado.questao.numeroB);
  painel.querySelector('.apoio-expressao').textContent = avaliacao.expressao;
  painel.querySelector('.apoio-calculo').classList.toggle('excedeu', avaliacao.excedeu);
}

function atualizarEmprestimos(estado, el) {
  const questao = estado.questao;
  if (!questao) {
    return;
  }
  const digitosA = digitosDe(questao.numeroA);

  el.conta.querySelectorAll('.celula-digito[data-coluna]').forEach((celula) => {
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
      const destino = ROTULOS_COLUNA[indice - 1] ?? 'unidades';
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
    el.dica.textContent = 'Some os números que estão um embaixo do outro, da direita para a esquerda: se passar de 9, deixe o último número embaixo e suba o 1.';
  } else if (estado.questao.operacao === 'MULTIPLICACAO') {
    if (estado.questao.dificuldade === 'MEDIO') {
      el.dica.textContent = 'Multiplique o número de baixo pelo de cima (da direita para a esquerda): se passar de 9, deixe a unidade embaixo e suba o outro número para somar no vizinho';
    } else {
      el.dica.textContent = 'Dica: multiplique ' + estado.questao.numeroA + ' × ' + estado.questao.numeroB
        + '. Pense em grupos iguais: somar ' + estado.questao.numeroA
        + ' por ' + estado.questao.numeroB + ' vezes dá o mesmo resultado.';
    }
  } else if (estado.questao.operacao === 'DIVISAO') {
    if (estado.questao.dificuldade === 'MEDIO') {
      el.dica.textContent = 'Dica: divida primeiro as dezenas, subtraia e abaixe o próximo número. Use a tabela de múltiplos ao lado para encontrar cada dígito do quociente.';
    } else {
      el.dica.textContent = 'Dica: procure quantas vezes o divisor cabe no dividendo. Escreva o quociente embaixo do divisor, multiplique e subtraia para encontrar o resto.';
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
    if (ehDivisaoLonga(questao)) {
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
    const resultadoDigitado = comporResultado(lerResultados(el));
    if (resultadoDigitado === null) {
      mostrarAviso(el, 'Escreva o resultado nas caixas antes de conferir. ✏️');
      const unidades = el.conta.querySelector('.resultado-input[data-coluna="0"]');
      if (unidades) {
        unidades.focus();
      }
      return;
    }

    const soma = questao.operacao === 'SOMA';
    const subtracao = questao.operacao === 'SUBTRACAO';
    const multiplicacao = questao.operacao === 'MULTIPLICACAO';
    const digitos = digitosDosOperandos(questao.dificuldade, questao.operacao);
    const caixasVaiUm = lerVaiUm(el);
    requisicao = montarRequisicao(questao, {
      resultadoDigitado,
      vaiUm: soma
        ? montarArrayVaiUm(
          caixasVaiUm,
          digitos,
          calcularVaiUm(questao.numeroA, questao.numeroB),
        )
        : null,
      emprestados: subtracao ? montarArrayEmprestimos(estado.emprestimos, digitos) : null,
      vaiUmMultiplicacao: multiplicacao
        ? lerVaiUmMultiplicacao(caixasVaiUm)
        : null,
    });
  }

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
  } catch (erro) {
    console.error(erro);
    mostrarAviso(el, 'Não consegui conferir agora. O servidor está rodando na porta 8080?');
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
  const resolucao = resolverProgresso(estado.sequencia, estado.dificuldade, dados.correto);

  estado.pontos += dados.pontosGanhos;
  estado.sequencia = resolucao.sequencia;
  estado.progresso = resolucao.progresso;

  if (resolucao.dificuldade !== estado.dificuldade) {
    estado.dificuldade = resolucao.dificuldade;
    atualizarSegmentado(el.seletorDificuldade, estado.dificuldade);
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
    digitosDe,
    quantidadeColunas,
    digitosDosOperandos,
    digitosDoMultiplicador,
    calcularVaiUmMultiplicacao,
    quantidadeCaixasVaiUm,
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
    proximoItemOrdem,
    itemAnteriorOrdem,
    chaveAlvoFoco,
    proximoItemVazioOrdem,
    primeiroItemVazioOrdem,
    preenchidosNaOrdem,
    focarResultadoPorColuna,
    focarVaiUmPorColuna,
    tratarTeclaResultado,
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
    comporQuocienteDivisaoMedia,
    proximoCampoDivisao,
    campoAnteriorDivisao,
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
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarInterface);
  } else {
    iniciarInterface();
  }
}