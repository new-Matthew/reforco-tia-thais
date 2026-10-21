'use strict';

/*
- Reforço Escolar da Tia Thaís — integração com a API REST do jogo.
 *
- As funções puras no topo do arquivo também são exportadas quando o arquivo
- roda no Node (usado pelos testes unitários). A inicialização da interface
- só acontece quando existe um `document`.
 */

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
    if (dificuldade !== 'FACIL') {
      throw new Error('A multiplicação está disponível apenas no nível fácil.');
    }
    return 2;
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos + (operacao === 'SOMA' ? 1 : 0);
}

function digitosDosOperandos(dificuldade, operacao) {
  if (operacao === 'MULTIPLICACAO') {
    if (dificuldade !== 'FACIL') {
      throw new Error('A multiplicação está disponível apenas no nível fácil.');
    }
    return 1;
  }
  const digitos = DIGITOS_POR_DIFICULDADE[dificuldade];
  if (!digitos) {
    throw new Error('Dificuldade inválida: ' + dificuldade);
  }
  return digitos;
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
- Converte o conteúdo de uma caixinha em 0 ou 1. Campos vazios, em branco,
- nulos ou indefinidos viram 0 — a criança só precisa preencher as colunas
- que realmente têm transporte/empréstimo.
 */
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
- Garante que o array enviado ao backend contenha apenas inteiros 0/1.
- `null` é preservado porque o Java trata a ausência dos passos como opcional.
 */
function normalizarPassos(valores) {
  if (valores == null) {
    return null;
  }
  return Array.from(valores, normalizarPasso);
}

function preencherAte(valores, quantidade) {
  const passos = valores.slice();
  while (passos.length < quantidade) {
    passos.push(0);
  }
  return passos;
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
  return {
    idQuestao: questao.id,
    operacao: questao.operacao,
    numeroA: questao.numeroA,
    numeroB: questao.numeroB,
    resultadoDigitado: entradas.resultadoDigitado,
    vaiUm: soma ? normalizarPassos(entradas.vaiUm) : null,
    emprestados: subtracao ? normalizarPassos(entradas.emprestados) : null,
  };
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
    if (estado.operacao === 'MULTIPLICACAO') {
      estado.dificuldade = 'FACIL';
      atualizarSegmentado(el.seletorDificuldade, estado.dificuldade);
    }
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

  if (operacao === 'SOMA' || operacao === 'SUBTRACAO' || operacao === 'MULTIPLICACAO') {
    estado.operacao = operacao;
  }
  if (dificuldade === 'FACIL' || dificuldade === 'MEDIO') {
    estado.dificuldade = dificuldade;
  }
  if (estado.operacao === 'MULTIPLICACAO') {
    estado.dificuldade = 'FACIL';
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

  if (el.seletorDificuldade) {
    el.seletorDificuldade.querySelectorAll('[data-dificuldade]').forEach((botao) => {
      const indisponivel = estado.operacao === 'MULTIPLICACAO'
        && botao.dataset.dificuldade !== 'FACIL';
      botao.disabled = ocupado || indisponivel;
    });
  }

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
  const soma = questao.operacao === 'SOMA';
  const subtracao = questao.operacao === 'SUBTRACAO';
  const digitos = digitosDosOperandos(questao.dificuldade, questao.operacao);
  const colunas = quantidadeColunas(questao.dificuldade, questao.operacao);
  const colunaDaGrade = (indice) => colunas + 1 - indice;

  el.conta.innerHTML = '';
  el.conta.style.setProperty('--colunas', String(colunas));

  if (soma) {
    const caixasVaiUm = quantidadeCaixasVaiUm(questao.dificuldade);
    for (let indice = 1; indice <= caixasVaiUm; indice += 1) {
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
      caixa.style.gridColumn = String(colunaDaGrade(indice));
      caixa.style.gridRow = '1';
      caixa.addEventListener('input', () => {
        caixa.value = caixa.value.replace(/[^01]/g, '').slice(-1);
      });
      el.conta.appendChild(caixa);
    }
  }

  const digitosA = digitosDe(questao.numeroA);
  for (let indice = 0; indice < digitos; indice += 1) {
    const podeEmprestar = subtracao && indice >= 1;
    const celula = podeEmprestar ? document.createElement('button') : document.createElement('div');
    if (podeEmprestar) {
      celula.type = 'button';
    }
    celula.className = 'celula-digito' + (podeEmprestar ? ' clicavel' : '');
    celula.dataset.coluna = String(indice);
    celula.style.gridColumn = String(colunaDaGrade(indice));
    celula.style.gridRow = '2';

    const digito = document.createElement('span');
    digito.className = 'digito';

    const umEmprestado = document.createElement('span');
    umEmprestado.className = 'um-emprestado';
    umEmprestado.textContent = '1';
    umEmprestado.setAttribute('aria-hidden', 'true');
    umEmprestado.hidden = true;

    const valorDoDigito = document.createElement('span');
    valorDoDigito.className = 'digito-valor';
    valorDoDigito.textContent = String(digitosA[indice] ?? 0);

    digito.append(umEmprestado, valorDoDigito);
    celula.appendChild(digito);

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

    el.conta.appendChild(celula);
  }

  const sinal = document.createElement('span');
  sinal.className = 'sinal';
  sinal.textContent = soma ? '+' : (subtracao ? '−' : '×');
  sinal.style.gridColumn = '1';
  sinal.style.gridRow = '3';
  el.conta.appendChild(sinal);

  const digitosB = digitosDe(questao.numeroB);
  for (let indice = 0; indice < digitos; indice += 1) {
    const celula = document.createElement('div');
    celula.className = 'celula-digito';
    celula.style.gridColumn = String(colunaDaGrade(indice));
    celula.style.gridRow = '3';

    const digito = document.createElement('span');
    digito.className = 'digito';
    digito.textContent = String(digitosB[indice] ?? 0);
    celula.appendChild(digito);
    el.conta.appendChild(celula);
  }

  const linha = document.createElement('div');
  linha.className = 'linha';
  linha.style.gridColumn = '2 / ' + (colunas + 2);
  linha.style.gridRow = '4';
  el.conta.appendChild(linha);

  for (let indice = 0; indice < colunas; indice += 1) {
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
    campo.style.gridColumn = String(colunaDaGrade(indice));
    campo.style.gridRow = '5';

    campo.addEventListener('input', () => {
      campo.value = campo.value.replace(/\D/g, '').slice(-1);
      if (campo.value !== '') {
        const proximo = el.conta.querySelector(
          '.resultado-input[data-coluna="' + (indice + 1) + '"]',
        );
        if (proximo) {
          proximo.focus();
        }
      }
    });

    campo.addEventListener('keydown', (evento) => {
      if (evento.key === 'Backspace' && campo.value === '' && indice > 0) {
        const anterior = el.conta.querySelector(
          '.resultado-input[data-coluna="' + (indice - 1) + '"]',
        );
        if (anterior) {
          anterior.focus();
        }
      }
      if (evento.key === 'Enter') {
        evento.preventDefault();
        el.btnValidar.click();
      }
    });

    el.conta.appendChild(campo);
  }

  if (subtracao) {
    atualizarEmprestimos(estado, el);
  }
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
    el.dica.textContent = 'Dica: some da direita para a esquerda. Quando a conta passar de 9, escreva 1 na caixinha do “vai um”.';
  } else if (estado.questao.operacao === 'MULTIPLICACAO') {
    el.dica.textContent = 'Dica: multiplique ' + estado.questao.numeroA + ' × ' + estado.questao.numeroB
      + '. Pense em grupos iguais: somar ' + estado.questao.numeroA
      + ' por ' + estado.questao.numeroB + ' vezes dá o mesmo resultado.';
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

async function validarResposta(estado, el) {
  if (!podeValidarResposta(estado)) {
    return;
  }

  const questao = estado.questao;
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
  const digitos = digitosDosOperandos(questao.dificuldade, questao.operacao);
  const requisicao = montarRequisicao(questao, {
    resultadoDigitado,
    vaiUm: soma
      ? montarArrayVaiUm(
        lerVaiUm(el),
        digitos,
        calcularVaiUm(questao.numeroA, questao.numeroB),
      )
      : null,
    emprestados: subtracao ? montarArrayEmprestimos(estado.emprestimos, digitos) : null,
  });

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
  let resolucao = resolverProgresso(estado.sequencia, estado.dificuldade, dados.correto);

  if (estado.operacao === 'MULTIPLICACAO' && resolucao.subiuNivel) {
    resolucao = {
      ...resolucao,
      subiuNivel: false,
      nivelMaximo: true,
      dificuldade: 'FACIL',
    };
  }

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