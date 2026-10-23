package com.example.jogo.service;

import com.example.jogo.dto.QuestaoDTO;
import com.example.jogo.dto.RequisicaoValidacaoDTO;
import com.example.jogo.dto.RespostaValidacaoDTO;
import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import java.util.function.Supplier;

@Service
public class JogoService {

    static final int PONTOS_ACERTO_COMPLETO = 10;
    static final int PONTOS_ACERTO_PARCIAL = 5;
    static final int PONTOS_ERRO = 0;

    private static final int TENTATIVAS_MAXIMAS = 1_000;

    private static final int MENOR_FATOR = 1;
    private static final int MAIOR_FATOR_UMA_CASA = 9;
    private static final int MENOR_FATOR_DUAS_CASAS = 10;
    private static final int MAIOR_FATOR_DUAS_CASAS = 99;
    private static final int MENOR_MULTIPLICANDO_TRES_CASAS = 100;
    private static final int MAIOR_MULTIPLICANDO_TRES_CASAS = 999;
    private static final int MENOR_DIGITO_MULTIPLICADOR_DIFICIL = 2;

    private static final int DIVISOR_MINIMO_FACIL = 2;
    private static final int DIVISOR_MAXIMO_FACIL = 9;
    private static final int DIVIDENDO_MINIMO_LONGO = 100;
    private static final int DIVIDENDO_MAXIMO_LONGO = 999;
    private static final int DIVISOR_MINIMO_LONGO = 10;

    private final Random random;

    public JogoService() {
        this(new Random());
    }

    JogoService(Random random) {
        this.random = Objects.requireNonNull(random, "O gerador aleatório é obrigatório.");
    }

    public QuestaoDTO gerarQuestao(Operacao operacao, Dificuldade dificuldade) {
        if (operacao == null) {
            throw new IllegalArgumentException("A operação é obrigatória.");
        }
        if (dificuldade == null) {
            throw new IllegalArgumentException("A dificuldade é obrigatória.");
        }
        if (dificuldade == Dificuldade.DIFICIL && operacao != Operacao.MULTIPLICACAO) {
            throw new IllegalArgumentException(
                    "O nível difícil está disponível apenas para a multiplicação.");
        }

        return switch (operacao) {
            case MULTIPLICACAO -> gerarMultiplicacao(operacao, dificuldade);
            case DIVISAO -> gerarDivisao(operacao, dificuldade);
            case SOMA -> gerarSoma(operacao, dificuldade);
            case SUBTRACAO -> gerarSubtracao(operacao, dificuldade);
        };
    }

    public RespostaValidacaoDTO validar(RequisicaoValidacaoDTO requisicao) {
        validarCampos(requisicao);

        AvaliacaoPassos avaliacao = avaliarPassos(requisicao);
        boolean resultadoCorreto = requisicao.getResultadoDigitado() == avaliacao.respostaCorreta();

        return montarResposta(requisicao.getOperacao(), avaliacao, resultadoCorreto);
    }

    public boolean exigeVaiUm(int numeroA, int numeroB) {
        while (numeroA > 0 || numeroB > 0) {
            if (numeroA % 10 + numeroB % 10 >= 10) {
                return true;
            }
            numeroA /= 10;
            numeroB /= 10;
        }
        return false;
    }

    public boolean exigeEmprestimo(int numeroA, int numeroB) {
        while (numeroA > 0 || numeroB > 0) {
            if (numeroA % 10 < numeroB % 10) {
                return true;
            }
            numeroA /= 10;
            numeroB /= 10;
        }
        return false;
    }

    public List<Integer> calcularVaiUm(int numeroA, int numeroB) {
        List<Integer> passos = new ArrayList<>();
        int vaiUm = 0;

        while (numeroA > 0 || numeroB > 0 || vaiUm > 0) {
            int somaDaColuna = numeroA % 10 + numeroB % 10 + vaiUm;
            vaiUm = somaDaColuna >= 10 ? 1 : 0;
            passos.add(vaiUm);
            numeroA /= 10;
            numeroB /= 10;
        }

        return passos;
    }

    public List<Integer> calcularEmprestimos(int numeroA, int numeroB) {
        List<Integer> passos = new ArrayList<>();
        int emprestimo = 0;

        while (numeroA > 0 || numeroB > 0) {
            int diferencaDaColuna = numeroA % 10 - numeroB % 10 - emprestimo;
            emprestimo = diferencaDaColuna < 0 ? 1 : 0;
            passos.add(emprestimo);
            numeroA /= 10;
            numeroB /= 10;
        }

        return passos;
    }

    public int calcularVaiUmMultiplicacao(int numeroA, int numeroB) {
        return (numeroA % 10 * numeroB) / 10;
    }

    /* --------------------------------------------------------------------- */
    /* Validação da resposta                                                  */
    /* --------------------------------------------------------------------- */

    private AvaliacaoPassos avaliarPassos(RequisicaoValidacaoDTO requisicao) {
        return switch (requisicao.getOperacao()) {
            case MULTIPLICACAO -> avaliarMultiplicacao(requisicao);
            case DIVISAO -> avaliarDivisao(requisicao);
            case SOMA, SUBTRACAO -> avaliarSomaOuSubtracao(requisicao);
        };
    }

    private AvaliacaoPassos avaliarMultiplicacao(RequisicaoValidacaoDTO requisicao) {
        int numeroA = requisicao.getNumeroA();
        int numeroB = requisicao.getNumeroB();
        if (numeroA >= MENOR_MULTIPLICANDO_TRES_CASAS && numeroB >= MENOR_FATOR_DUAS_CASAS) {
            return new AvaliacaoPassos(numeroA * numeroB, true);
        }
        int carryEsperado = numeroA >= MENOR_FATOR_DUAS_CASAS
                ? calcularVaiUmMultiplicacao(numeroA, numeroB)
                : 0;
        int carryInformado = requisicao.getVaiUmMultiplicacao() == null
                ? 0
                : requisicao.getVaiUmMultiplicacao();
        return new AvaliacaoPassos(numeroA * numeroB, carryInformado == carryEsperado);
    }

    private AvaliacaoPassos avaliarDivisao(RequisicaoValidacaoDTO requisicao) {
        int numeroA = requisicao.getNumeroA();
        int numeroB = requisicao.getNumeroB();
        if (numeroB == 0) {
            throw new IllegalArgumentException("O divisor não pode ser zero.");
        }

        int respostaCorreta = numeroA / numeroB;
        boolean passosCorretos = ehDivisaoLonga(numeroA, numeroB)
                ? validarEtapasDivisaoLonga(requisicao, numeroA, numeroB)
                : validarEtapasDivisaoSimples(requisicao, numeroA, numeroB, respostaCorreta);
        return new AvaliacaoPassos(respostaCorreta, passosCorretos);
    }

    private boolean validarEtapasDivisaoLonga(RequisicaoValidacaoDTO requisicao, int numeroA, int numeroB) {
        EtapasDivisao etapas = calcularEtapasDivisao(numeroA, numeroB);
        return Objects.equals(
                        requisicao.getQuocienteParcialDigitado(),
                        etapas.quocienteParcial())
                && Objects.equals(
                        requisicao.getSubtracaoParcialDigitada(),
                        etapas.subtracaoParcial())
                && Objects.equals(
                        requisicao.getRestoParcialDigitado(),
                        etapas.restoParcial())
                && Objects.equals(
                        requisicao.getQuocienteFinalDigitado(),
                        etapas.quocienteFinal())
                && Objects.equals(
                        requisicao.getSubtracaoFinalDigitada(),
                        etapas.subtracaoFinal())
                && Objects.equals(requisicao.getRestoDigitado(), etapas.restoFinal());
    }

    private boolean validarEtapasDivisaoSimples(
            RequisicaoValidacaoDTO requisicao,
            int numeroA,
            int numeroB,
            int respostaCorreta) {
        int subtracaoEsperada = numeroB * respostaCorreta;
        int restoEsperado = numeroA - subtracaoEsperada;
        return Objects.equals(requisicao.getSubtracaoDigitada(), subtracaoEsperada)
                && Objects.equals(requisicao.getRestoDigitado(), restoEsperado);
    }

    private AvaliacaoPassos avaliarSomaOuSubtracao(RequisicaoValidacaoDTO requisicao) {
        boolean soma = requisicao.getOperacao() == Operacao.SOMA;
        int numeroA = requisicao.getNumeroA();
        int numeroB = requisicao.getNumeroB();

        int respostaCorreta = soma ? numeroA + numeroB : numeroA - numeroB;
        List<Integer> passosEsperados = soma
                ? calcularVaiUm(numeroA, numeroB)
                : calcularEmprestimos(numeroA, numeroB);
        List<Integer> passosInformados = soma
                ? requisicao.getVaiUm()
                : requisicao.getEmprestados();
        boolean passosCorretos = passosInformados == null
                || passosInformados.equals(passosEsperados);

        return new AvaliacaoPassos(respostaCorreta, passosCorretos);
    }

    private RespostaValidacaoDTO montarResposta(
            Operacao operacao,
            AvaliacaoPassos avaliacao,
            boolean resultadoCorreto) {
        int respostaCorreta = avaliacao.respostaCorreta();

        if (resultadoCorreto && avaliacao.passosCorretos()) {
            return new RespostaValidacaoDTO(
                    true,
                    "Muito bem! Você acertou em cheio!",
                    PONTOS_ACERTO_COMPLETO,
                    respostaCorreta);
        }

        if (resultadoCorreto) {
            String mensagem = operacao == Operacao.DIVISAO
                    ? "O resultado está certo, mas confira os passos da divisão."
                    : "O resultado está certo, mas confira os passos do " + descreverPasso(operacao);
            return new RespostaValidacaoDTO(
                    false,
                    mensagem,
                    PONTOS_ACERTO_PARCIAL,
                    respostaCorreta);
        }

        return new RespostaValidacaoDTO(
                false,
                "Quase lá! A resposta correta é " + respostaCorreta + ". Tente de novo!",
                PONTOS_ERRO,
                respostaCorreta);
    }

    /* --------------------------------------------------------------------- */
    /* Geração das questões                                                   */
    /* --------------------------------------------------------------------- */

    private QuestaoDTO gerarSoma(Operacao operacao, Dificuldade dificuldade) {
        int minimo = dificuldade.getValorMinimo();
        int maximo = dificuldade.getValorMaximo();

        return gerarComTentativas(
                "Não foi possível gerar uma soma com 'vai um'.",
                () -> {
                    int numeroA = sortear(minimo, maximo);
                    int numeroB = sortear(minimo, maximo);
                    return exigeVaiUm(numeroA, numeroB)
                            ? novaQuestao(operacao, dificuldade, numeroA, numeroB)
                            : null;
                });
    }

    private QuestaoDTO gerarSubtracao(Operacao operacao, Dificuldade dificuldade) {
        int minimo = dificuldade.getValorMinimo();
        int maximo = dificuldade.getValorMaximo();

        return gerarComTentativas(
                "Não foi possível gerar uma subtração com empréstimo.",
                () -> {
                    int numeroA = sortear(minimo, maximo);
                    int numeroB = sortear(minimo, maximo);
                    return numeroA > numeroB && exigeEmprestimo(numeroA, numeroB)
                            ? novaQuestao(operacao, dificuldade, numeroA, numeroB)
                            : null;
                });
    }

    private QuestaoDTO gerarMultiplicacao(Operacao operacao, Dificuldade dificuldade) {
        int numeroA = sortearMultiplicando(dificuldade);
        int numeroB = dificuldade == Dificuldade.DIFICIL
                ? sortearMultiplicadorDuasCasas()
                : sortear(MENOR_FATOR, MAIOR_FATOR_UMA_CASA);

        QuestaoDTO questao = novaQuestao(operacao, dificuldade, numeroA, numeroB);
        if (dificuldade == Dificuldade.MEDIO) {
            aplicarPassosMultiplicacao(questao);
        }
        return questao;
    }

    private int sortearMultiplicando(Dificuldade dificuldade) {
        return switch (dificuldade) {
            case FACIL -> sortear(MENOR_FATOR, MAIOR_FATOR_UMA_CASA);
            case MEDIO -> sortear(MENOR_FATOR_DUAS_CASAS, MAIOR_FATOR_DUAS_CASAS);
            case DIFICIL -> sortear(MENOR_MULTIPLICANDO_TRES_CASAS, MAIOR_MULTIPLICANDO_TRES_CASAS);
        };
    }

    private int sortearMultiplicadorDuasCasas() {
        int dezena = sortear(MENOR_FATOR, MAIOR_FATOR_UMA_CASA);
        int unidade = sortear(MENOR_DIGITO_MULTIPLICADOR_DIFICIL, MAIOR_FATOR_UMA_CASA);
        return dezena * 10 + unidade;
    }

    private void aplicarPassosMultiplicacao(QuestaoDTO questao) {
        int numeroA = questao.getNumeroA();
        int numeroB = questao.getNumeroB();
        questao.setVaiUm(calcularVaiUmMultiplicacao(numeroA, numeroB));
        questao.setResultadoParcial(numeroA * numeroB);
    }

    private QuestaoDTO gerarDivisao(Operacao operacao, Dificuldade dificuldade) {
        if (dificuldade == Dificuldade.MEDIO) {
            return gerarDivisaoLonga(operacao, dificuldade);
        }

        return gerarComTentativas(
                "Não foi possível gerar uma divisão exata.",
                () -> {
                    int divisor = sortear(DIVISOR_MINIMO_FACIL, DIVISOR_MAXIMO_FACIL);
                    int quociente = sortear(DIVISOR_MINIMO_FACIL, DIVISOR_MAXIMO_FACIL);
                    int dividendo = divisor * quociente;

                    if (!dentroDosLimites(dividendo, Dificuldade.FACIL)) {
                        return null;
                    }
                    return montarQuestaoDivisaoExata(
                            operacao, dificuldade, dividendo, divisor, quociente);
                });
    }

    private QuestaoDTO montarQuestaoDivisaoExata(
            Operacao operacao,
            Dificuldade dificuldade,
            int dividendo,
            int divisor,
            int quociente) {
        QuestaoDTO questao = novaQuestao(operacao, dificuldade, dividendo, divisor);
        questao.setQuociente(quociente);
        questao.setSubtracaoIntermediaria(dividendo);
        questao.setResto(0);
        return questao;
    }

    private QuestaoDTO gerarDivisaoLonga(Operacao operacao, Dificuldade dificuldade) {
        return gerarComTentativas(
                "Não foi possível gerar uma divisão longa.",
                () -> {
                    int dividendo = sortear(DIVIDENDO_MINIMO_LONGO, DIVIDENDO_MAXIMO_LONGO);
                    int divisor = sortear(DIVISOR_MINIMO_LONGO, dividendo / 10);
                    int quociente = dividendo / divisor;

                    if (quociente < MENOR_FATOR_DUAS_CASAS || quociente % 10 == 0) {
                        return null;
                    }

                    EtapasDivisao etapas = calcularEtapasDivisao(dividendo, divisor);
                    return montarQuestaoDivisaoLonga(
                            operacao, dificuldade, dividendo, divisor, quociente, etapas);
                });
    }

    private QuestaoDTO montarQuestaoDivisaoLonga(
            Operacao operacao,
            Dificuldade dificuldade,
            int dividendo,
            int divisor,
            int quociente,
            EtapasDivisao etapas) {
        QuestaoDTO questao = novaQuestao(operacao, dificuldade, dividendo, divisor);
        questao.setQuociente(quociente);
        questao.setResto(etapas.restoFinal());
        questao.setDividendoParcial(etapas.dividendoParcial());
        questao.setQuocienteParcial(etapas.quocienteParcial());
        questao.setSubtracaoParcial(etapas.subtracaoParcial());
        questao.setRestoParcial(etapas.restoParcial());
        questao.setDividendoAbaixado(etapas.dividendoAbaixado());
        questao.setQuocienteFinal(etapas.quocienteFinal());
        questao.setSubtracaoFinal(etapas.subtracaoFinal());
        return questao;
    }

    /*
     * Repete o sorteio até a tentativa montar uma questão válida. Devolver
     * `null` sinaliza que os números sorteados não atendem aos critérios do
     * nível, evitando duplicar o laço em cada operação.
     */
    private QuestaoDTO gerarComTentativas(String mensagemErro, Supplier<QuestaoDTO> tentativa) {
        for (int tentativaAtual = 0; tentativaAtual < TENTATIVAS_MAXIMAS; tentativaAtual++) {
            QuestaoDTO questao = tentativa.get();
            if (questao != null) {
                return questao;
            }
        }
        throw new IllegalStateException(mensagemErro);
    }

    private boolean dentroDosLimites(int valor, Dificuldade dificuldade) {
        return valor >= dificuldade.getValorMinimo() && valor <= dificuldade.getValorMaximo();
    }

    /* --------------------------------------------------------------------- */
    /* Divisão longa                                                          */
    /* --------------------------------------------------------------------- */

    private boolean ehDivisaoLonga(int dividendo, int divisor) {
        return dividendo >= DIVIDENDO_MINIMO_LONGO
                && dividendo <= DIVIDENDO_MAXIMO_LONGO
                && divisor >= DIVISOR_MINIMO_LONGO
                && divisor <= MAIOR_FATOR_DUAS_CASAS
                && dividendo / divisor >= MENOR_FATOR_DUAS_CASAS;
    }

    private EtapasDivisao calcularEtapasDivisao(int dividendo, int divisor) {
        int dividendoParcial = dividendo / 10;
        int quocienteParcial = dividendoParcial / divisor;
        int subtracaoParcial = divisor * quocienteParcial;
        int restoParcial = dividendoParcial - subtracaoParcial;
        int dividendoAbaixado = restoParcial * 10 + (dividendo % 10);
        int quocienteFinal = dividendoAbaixado / divisor;
        int subtracaoFinal = divisor * quocienteFinal;
        int restoFinal = dividendoAbaixado - subtracaoFinal;
        return new EtapasDivisao(
                dividendoParcial,
                quocienteParcial,
                subtracaoParcial,
                restoParcial,
                dividendoAbaixado,
                quocienteFinal,
                subtracaoFinal,
                restoFinal);
    }

    /* --------------------------------------------------------------------- */
    /* Apoio                                                                  */
    /* --------------------------------------------------------------------- */

    private String descreverPasso(Operacao operacao) {
        if (operacao == Operacao.SOMA) {
            return "'vai um'.";
        }
        if (operacao == Operacao.MULTIPLICACAO) {
            return "'vai um' das unidades.";
        }
        return "empréstimo.";
    }

    private QuestaoDTO novaQuestao(Operacao operacao, Dificuldade dificuldade, int numeroA, int numeroB) {
        return new QuestaoDTO(
                UUID.randomUUID().toString(),
                operacao,
                dificuldade,
                numeroA,
                numeroB,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private int sortear(int minimo, int maximo) {
        return random.nextInt(maximo - minimo + 1) + minimo;
    }

    private void validarCampos(RequisicaoValidacaoDTO requisicao) {
        if (requisicao == null) {
            throw new IllegalArgumentException("A requisição de validação é obrigatória.");
        }
        if (requisicao.getOperacao() == null) {
            throw new IllegalArgumentException("A operação é obrigatória.");
        }
        if (requisicao.getNumeroA() == null || requisicao.getNumeroB() == null) {
            throw new IllegalArgumentException("Os números da questão são obrigatórios.");
        }
        if (requisicao.getResultadoDigitado() == null) {
            throw new IllegalArgumentException("O resultado digitado é obrigatório.");
        }
    }

    private record EtapasDivisao(
            int dividendoParcial,
            int quocienteParcial,
            int subtracaoParcial,
            int restoParcial,
            int dividendoAbaixado,
            int quocienteFinal,
            int subtracaoFinal,
            int restoFinal) {
    }

    private record AvaliacaoPassos(int respostaCorreta, boolean passosCorretos) {
    }
}
