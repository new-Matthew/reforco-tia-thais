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

@Service
public class JogoService {

    static final int PONTOS_ACERTO_COMPLETO = 10;
    static final int PONTOS_ACERTO_PARCIAL = 5;
    static final int PONTOS_ERRO = 0;

    private static final int TENTATIVAS_MAXIMAS = 1_000;

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

        if (operacao == Operacao.MULTIPLICACAO) {
            return gerarMultiplicacao(operacao, dificuldade);
        }

        if (operacao == Operacao.DIVISAO) {
            return gerarDivisao(operacao, dificuldade);
        }

        int minimo = dificuldade.getValorMinimo();
        int maximo = dificuldade.getValorMaximo();

        if (operacao == Operacao.SOMA) {
            return gerarSoma(operacao, dificuldade, minimo, maximo);
        }
        return gerarSubtracao(operacao, dificuldade, minimo, maximo);
    }

    public RespostaValidacaoDTO validar(RequisicaoValidacaoDTO requisicao) {
        validarCampos(requisicao);

        int numeroA = requisicao.getNumeroA();
        int numeroB = requisicao.getNumeroB();
        int resultadoDigitado = requisicao.getResultadoDigitado();

        Operacao operacao = requisicao.getOperacao();
        int respostaCorreta;
        boolean passosCorretos;
        List<Integer> passosEsperados = null;
        List<Integer> passosInformados = null;

        if (operacao == Operacao.MULTIPLICACAO) {
            respostaCorreta = numeroA * numeroB;
            int carryEsperado = numeroA >= 10
                    ? calcularVaiUmMultiplicacao(numeroA, numeroB)
                    : 0;
            int carryInformado = requisicao.getVaiUmMultiplicacao() == null
                    ? 0
                    : requisicao.getVaiUmMultiplicacao();
            passosCorretos = carryInformado == carryEsperado;
        } else if (operacao == Operacao.DIVISAO) {
            if (numeroB == 0) {
                throw new IllegalArgumentException("O divisor não pode ser zero.");
            }
            respostaCorreta = numeroA / numeroB;
            if (ehDivisaoLonga(numeroA, numeroB)) {
                EtapasDivisao etapas = calcularEtapasDivisao(numeroA, numeroB);
                passosCorretos = Objects.equals(
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
            } else {
                int subtracaoEsperada = numeroB * respostaCorreta;
                int restoEsperado = numeroA - subtracaoEsperada;
                passosCorretos = Objects.equals(requisicao.getSubtracaoDigitada(), subtracaoEsperada)
                        && Objects.equals(requisicao.getRestoDigitado(), restoEsperado);
            }
        } else {
            boolean soma = operacao == Operacao.SOMA;
            respostaCorreta = soma ? numeroA + numeroB : numeroA - numeroB;
            passosEsperados = soma
                    ? calcularVaiUm(numeroA, numeroB)
                    : calcularEmprestimos(numeroA, numeroB);
            passosInformados = soma
                    ? requisicao.getVaiUm()
                    : requisicao.getEmprestados();
            passosCorretos = passosInformados == null
                    || passosInformados.equals(passosEsperados);
        }

        boolean resultadoCorreto = resultadoDigitado == respostaCorreta;

        if (resultadoCorreto && passosCorretos) {
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

    private QuestaoDTO gerarSoma(Operacao operacao, Dificuldade dificuldade, int minimo, int maximo) {
        for (int tentativa = 0; tentativa < TENTATIVAS_MAXIMAS; tentativa++) {
            int numeroA = sortear(minimo, maximo);
            int numeroB = sortear(minimo, maximo);

            if (exigeVaiUm(numeroA, numeroB)) {
                return novaQuestao(operacao, dificuldade, numeroA, numeroB);
            }
        }
        throw new IllegalStateException("Não foi possível gerar uma soma com 'vai um'.");
    }

    private QuestaoDTO gerarSubtracao(Operacao operacao, Dificuldade dificuldade, int minimo, int maximo) {
        for (int tentativa = 0; tentativa < TENTATIVAS_MAXIMAS; tentativa++) {
            int numeroA = sortear(minimo, maximo);
            int numeroB = sortear(minimo, maximo);

            if (numeroA > numeroB && exigeEmprestimo(numeroA, numeroB)) {
                return novaQuestao(operacao, dificuldade, numeroA, numeroB);
            }
        }
        throw new IllegalStateException("Não foi possível gerar uma subtração com empréstimo.");
    }

    private QuestaoDTO gerarMultiplicacao(Operacao operacao, Dificuldade dificuldade) {
        int numeroA = dificuldade == Dificuldade.FACIL
                ? sortear(1, 9)
                : sortear(10, 99);
        int numeroB = sortear(1, 9);

        QuestaoDTO questao = novaQuestao(operacao, dificuldade, numeroA, numeroB);
        if (dificuldade == Dificuldade.MEDIO) {
            questao.setVaiUm(calcularVaiUmMultiplicacao(numeroA, numeroB));
            questao.setResultadoParcial(numeroA * numeroB);
        }
        return questao;
    }

    public int calcularVaiUmMultiplicacao(int numeroA, int numeroB) {
        return (numeroA % 10 * numeroB) / 10;
    }

    private QuestaoDTO gerarDivisao(Operacao operacao, Dificuldade dificuldade) {
        if (dificuldade == Dificuldade.MEDIO) {
            return gerarDivisaoLonga(operacao, dificuldade);
        }

        for (int tentativa = 0; tentativa < TENTATIVAS_MAXIMAS; tentativa++) {
            int divisor = sortear(2, 9);
            int quociente = sortear(2, 9);
            int dividendo = divisor * quociente;

            if (dividendo >= Dificuldade.FACIL.getValorMinimo()
                    && dividendo <= Dificuldade.FACIL.getValorMaximo()) {
                QuestaoDTO questao = novaQuestao(operacao, dificuldade, dividendo, divisor);
                questao.setQuociente(quociente);
                questao.setSubtracaoIntermediaria(dividendo);
                questao.setResto(0);
                return questao;
            }
        }
        throw new IllegalStateException("Não foi possível gerar uma divisão exata.");
    }

    private QuestaoDTO gerarDivisaoLonga(Operacao operacao, Dificuldade dificuldade) {
        for (int tentativa = 0; tentativa < TENTATIVAS_MAXIMAS; tentativa++) {
            int dividendo = sortear(100, 999);
            int divisor = sortear(10, dividendo / 10);
            int quociente = dividendo / divisor;

            if (quociente < 10 || quociente % 10 == 0) {
                continue;
            }

            EtapasDivisao etapas = calcularEtapasDivisao(dividendo, divisor);
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
        throw new IllegalStateException("Não foi possível gerar uma divisão longa.");
    }

    private boolean ehDivisaoLonga(int dividendo, int divisor) {
        return dividendo >= 100
                && dividendo <= 999
                && divisor >= 10
                && divisor <= 99
                && dividendo / divisor >= 10;
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
}
