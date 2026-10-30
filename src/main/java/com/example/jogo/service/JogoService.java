package com.example.jogo.service;

import com.example.jogo.dto.EtapaDivisaoDTO;
import com.example.jogo.dto.QuestaoDTO;
import com.example.jogo.dto.RequisicaoValidacaoDTO;
import com.example.jogo.dto.RespostaValidacaoDTO;
import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import com.example.jogo.enums.TipoNumero;
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
    private static final int DIVIDENDO_MINIMO_DIFICIL = 1_000;
    private static final int DIVIDENDO_MAXIMO_DIFICIL = 9_999;
    private static final int DIVISOR_MINIMO_LONGO = 10;
    private static final int DIVISOR_MAXIMO_LONGO = 99;
    private static final int DIVISOR_MAXIMO_LONGO_DIVISAO = 999;

    private static final int ESCALA_DECIMAL = 100;
    private static final int CASAS_DECIMAIS_MINIMAS = 1;
    private static final int CASAS_DECIMAIS_MAXIMAS = 2;
    private static final int DIGITOS_INTEIROS_DECIMAIS_DIFICIL_MINIMOS = 3;

    private final Random random;

    public JogoService() {
        this(new Random());
    }

    JogoService(Random random) {
        this.random = Objects.requireNonNull(random, "O gerador aleatório é obrigatório.");
    }

    public QuestaoDTO gerarQuestao(Operacao operacao, Dificuldade dificuldade) {
        return gerarQuestao(operacao, dificuldade, TipoNumero.INTEIROS);
    }

    public QuestaoDTO gerarQuestao(
            Operacao operacao,
            Dificuldade dificuldade,
            TipoNumero tipoNumero) {
        if (operacao == null) {
            throw new IllegalArgumentException("A operação é obrigatória.");
        }
        if (dificuldade == null) {
            throw new IllegalArgumentException("A dificuldade é obrigatória.");
        }
        if (tipoNumero == null) {
            throw new IllegalArgumentException("O tipo de número é obrigatório.");
        }
        if (tipoNumero == TipoNumero.DECIMAIS
                && operacao != Operacao.SOMA
                && operacao != Operacao.SUBTRACAO
                && operacao != Operacao.MULTIPLICACAO
                && operacao != Operacao.DIVISAO) {
            throw new IllegalArgumentException(
                    "Números decimais estão disponíveis na soma, subtração, "
                            + "multiplicação e divisão.");
        }

        return switch (operacao) {
            case MULTIPLICACAO -> tipoNumero == TipoNumero.DECIMAIS
                    ? gerarMultiplicacaoDecimal(operacao, dificuldade)
                    : gerarMultiplicacao(operacao, dificuldade);
            case DIVISAO -> tipoNumero == TipoNumero.DECIMAIS
                    ? gerarDivisaoDecimal(operacao, dificuldade)
                    : gerarDivisao(operacao, dificuldade);
            case SOMA -> tipoNumero == TipoNumero.DECIMAIS
                    ? gerarSomaDecimal(operacao, dificuldade)
                    : gerarSoma(operacao, dificuldade);
            case SUBTRACAO -> tipoNumero == TipoNumero.DECIMAIS
                    ? gerarSubtracaoDecimal(operacao, dificuldade)
                    : gerarSubtracao(operacao, dificuldade);
        };
    }

    public RespostaValidacaoDTO validar(RequisicaoValidacaoDTO requisicao) {
        validarCampos(requisicao);

        AvaliacaoPassos avaliacao = avaliarPassos(requisicao);
        boolean resultadoCorreto = requisicao.getResultadoDigitado() == avaliacao.respostaCorreta();

        return montarResposta(requisicao, avaliacao, resultadoCorreto);
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
        if (requisicao.getTipoNumero() == TipoNumero.DECIMAIS) {
            boolean virgulaCorreta = Objects.equals(
                    requisicao.getCasasDecimaisResultado(),
                    requisicao.getCasasDecimais());
            return new AvaliacaoPassos(
                    numeroA * numeroB,
                    virgulaCorreta,
                    virgulaCorreta
                            ? null
                            : "O resultado está certo, mas confira a posição da vírgula.");
        }
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

        boolean decimal = requisicao.getTipoNumero() == TipoNumero.DECIMAIS;
        if (decimal) {
            if (requisicao.getDividendoEquivalente() == null
                    || requisicao.getDivisorEquivalente() == null) {
                throw new IllegalArgumentException(
                        "Informe os números equivalentes da divisão decimal.");
            }
            numeroA = requisicao.getDividendoEquivalente();
            numeroB = requisicao.getDivisorEquivalente();
            if (numeroB == 0) {
                throw new IllegalArgumentException("O divisor não pode ser zero.");
            }
        }

        int respostaCorreta = numeroA / numeroB;
        boolean passosCorretos = ehDivisaoLonga(numeroA, numeroB)
                ? validarEtapasDivisaoLonga(requisicao, numeroA, numeroB)
                : validarEtapasDivisaoSimples(requisicao, numeroA, numeroB, respostaCorreta);
        return new AvaliacaoPassos(respostaCorreta, passosCorretos);
    }

    private boolean validarEtapasDivisaoLonga(
            RequisicaoValidacaoDTO requisicao,
            int numeroA,
            int numeroB) {
        List<EtapaDivisaoDTO> etapas = calcularEtapasDivisaoLonga(numeroA, numeroB);

        if (possuiListasEtapas(requisicao)) {
            return validarListasEtapas(requisicao, etapas);
        }

        if (etapas.size() >= 3) {
            return validarEtapasDivisaoDificil(requisicao, etapas);
        }

        EtapaDivisaoDTO primeira = etapas.get(0);
        EtapaDivisaoDTO segunda = etapas.get(etapas.size() - 1);
        return Objects.equals(requisicao.getQuocienteParcialDigitado(), primeira.getQuociente())
                && Objects.equals(requisicao.getSubtracaoParcialDigitada(), primeira.getSubtracao())
                && Objects.equals(requisicao.getRestoParcialDigitado(), primeira.getResto())
                && Objects.equals(requisicao.getQuocienteFinalDigitado(), segunda.getQuociente())
                && Objects.equals(requisicao.getSubtracaoFinalDigitada(), segunda.getSubtracao())
                && Objects.equals(requisicao.getRestoDigitado(), segunda.getResto());
    }

    private boolean possuiListasEtapas(RequisicaoValidacaoDTO requisicao) {
        return requisicao.getQuocientesParciaisDigitados() != null
                || requisicao.getSubtracoesParciaisDigitadas() != null
                || requisicao.getRestosParciaisDigitados() != null;
    }

    private boolean validarListasEtapas(
            RequisicaoValidacaoDTO requisicao,
            List<EtapaDivisaoDTO> etapas) {
        List<Integer> quocientes = etapas.stream()
                .map(EtapaDivisaoDTO::getQuociente)
                .toList();
        List<Integer> subtracoes = etapas.stream()
                .map(EtapaDivisaoDTO::getSubtracao)
                .toList();
        List<Integer> restos = etapas.stream()
                .map(EtapaDivisaoDTO::getResto)
                .toList();

        return Objects.equals(requisicao.getQuocientesParciaisDigitados(), quocientes)
                && Objects.equals(requisicao.getSubtracoesParciaisDigitadas(), subtracoes)
                && Objects.equals(requisicao.getRestosParciaisDigitados(), restos)
                && Objects.equals(requisicao.getRestoDigitado(), etapas.get(etapas.size() - 1).getResto());
    }

    private boolean validarEtapasDivisaoDificil(
            RequisicaoValidacaoDTO requisicao,
            List<EtapaDivisaoDTO> etapas) {
        EtapaDivisaoDTO primeira = etapas.get(0);
        EtapaDivisaoDTO intermediaria = etapas.get(1);
        EtapaDivisaoDTO ultima = etapas.get(etapas.size() - 1);

        return Objects.equals(requisicao.getQuocienteParcialDigitado(), primeira.getQuociente())
                && Objects.equals(requisicao.getSubtracaoParcialDigitada(), primeira.getSubtracao())
                && Objects.equals(requisicao.getRestoParcialDigitado(), primeira.getResto())
                && Objects.equals(
                        requisicao.getQuocienteIntermediarioDigitado(),
                        intermediaria.getQuociente())
                && Objects.equals(
                        requisicao.getSubtracaoIntermediariaDigitada(),
                        intermediaria.getSubtracao())
                && Objects.equals(requisicao.getRestoIntermediarioDigitado(), intermediaria.getResto())
                && Objects.equals(requisicao.getQuocienteFinalDigitado(), ultima.getQuociente())
                && Objects.equals(requisicao.getSubtracaoFinalDigitada(), ultima.getSubtracao())
                && Objects.equals(requisicao.getRestoDigitado(), ultima.getResto());
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
            RequisicaoValidacaoDTO requisicao,
            AvaliacaoPassos avaliacao,
            boolean resultadoCorreto) {
        Operacao operacao = requisicao.getOperacao();
        int respostaCorreta = avaliacao.respostaCorreta();

        if (resultadoCorreto && avaliacao.passosCorretos()) {
            return new RespostaValidacaoDTO(
                    true,
                    "Muito bem! Você acertou em cheio!",
                    PONTOS_ACERTO_COMPLETO,
                    respostaCorreta);
        }

        if (resultadoCorreto) {
            String mensagem = avaliacao.mensagemPassoIncorreto();
            if (mensagem == null) {
                mensagem = operacao == Operacao.DIVISAO
                        ? "O resultado está certo, mas confira os passos da divisão."
                        : "O resultado está certo, mas confira os passos do "
                                + descreverPasso(operacao);
            }
            return new RespostaValidacaoDTO(
                    false,
                    mensagem,
                    PONTOS_ACERTO_PARCIAL,
                    respostaCorreta);
        }

        return new RespostaValidacaoDTO(
                false,
                "Quase lá! A resposta correta é "
                        + formatarResposta(requisicao, respostaCorreta)
                        + ". Tente de novo!",
                PONTOS_ERRO,
                respostaCorreta);
    }

    private String formatarResposta(RequisicaoValidacaoDTO requisicao, int respostaCorreta) {
        if (requisicao.getTipoNumero() != TipoNumero.DECIMAIS
                || requisicao.getOperacao() == Operacao.DIVISAO) {
            return String.valueOf(respostaCorreta);
        }
        return formatarDecimal(respostaCorreta, requisicao.getCasasDecimais());
    }

    private String formatarDecimal(int valorEscalado, int casasDecimais) {
        int divisor = (int) Math.pow(10, casasDecimais);
        int parteInteira = valorEscalado / divisor;
        int parteFracionaria = valorEscalado % divisor;
        return parteInteira + ","
                + String.format("%0" + casasDecimais + "d", parteFracionaria);
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
                    boolean reservasValidas = dificuldade == Dificuldade.DIFICIL
                            ? exigeVaiUmEncadeado(numeroA, numeroB)
                            : exigeVaiUm(numeroA, numeroB);
                    return reservasValidas
                            ? novaQuestao(operacao, dificuldade, numeroA, numeroB)
                            : null;
                });
    }

    private QuestaoDTO gerarSomaDecimal(Operacao operacao, Dificuldade dificuldade) {
        int minimo = dificuldade.getValorMinimo();
        int maximo = dificuldade.getValorMaximo();

        return gerarComTentativas(
                "Não foi possível gerar uma soma decimal com 'vai um'.",
                () -> {
                    int inteiroA = sortear(minimo, maximo);
                    int inteiroB = sortear(minimo, maximo);
                    boolean primeiraComUmaCasa = random.nextBoolean();
                    int casasA = primeiraComUmaCasa
                            ? CASAS_DECIMAIS_MINIMAS
                            : CASAS_DECIMAIS_MAXIMAS;
                    int casasB = primeiraComUmaCasa
                            ? CASAS_DECIMAIS_MAXIMAS
                            : CASAS_DECIMAIS_MINIMAS;
                    int numeroA = inteiroA * ESCALA_DECIMAL + sortearFracaoDecimal(casasA);
                    int numeroB = inteiroB * ESCALA_DECIMAL + sortearFracaoDecimal(casasB);
                    boolean reservasValidas = dificuldade == Dificuldade.DIFICIL
                            ? exigeVaiUmEncadeado(numeroA, numeroB)
                            : exigeVaiUm(numeroA, numeroB);
                    return reservasValidas
                            ? novaQuestaoDecimal(operacao, dificuldade, numeroA, numeroB, casasA, casasB)
                            : null;
                });
    }

    private int sortearFracaoDecimal(int casasDecimais) {
        if (casasDecimais == CASAS_DECIMAIS_MINIMAS) {
            return sortear(1, 9) * 10;
        }
        return sortear(1, 9) * 10 + sortear(1, 9);
    }

    private QuestaoDTO novaQuestaoDecimal(
            Operacao operacao,
            Dificuldade dificuldade,
            int numeroA,
            int numeroB,
            int casasDecimaisA,
            int casasDecimaisB) {
        QuestaoDTO questao = novaQuestao(operacao, dificuldade, numeroA, numeroB);
        questao.setTipoNumero(TipoNumero.DECIMAIS);
        questao.setCasasDecimaisA(casasDecimaisA);
        questao.setCasasDecimaisB(casasDecimaisB);
        return questao;
    }

    private boolean exigeVaiUmEncadeado(int numeroA, int numeroB) {
        List<Integer> passos = calcularVaiUm(numeroA, numeroB);

        for (int coluna = 0; coluna + 1 < passos.size(); coluna += 1) {
            if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                return true;
            }
        }
        return false;
    }

    private QuestaoDTO gerarSubtracao(Operacao operacao, Dificuldade dificuldade) {
        int minimo = dificuldade.getValorMinimo();
        int maximo = dificuldade.getValorMaximo();

        return gerarComTentativas(
                "Não foi possível gerar uma subtração com empréstimo.",
                () -> {
                    int numeroA = sortear(minimo, maximo);
                    int numeroB = sortear(minimo, maximo);
                    boolean emprestimosValidos = dificuldade == Dificuldade.DIFICIL
                            ? exigeEmprestimoEncadeado(numeroA, numeroB)
                            : exigeEmprestimo(numeroA, numeroB);
                    return numeroA > numeroB && emprestimosValidos
                            ? novaQuestao(operacao, dificuldade, numeroA, numeroB)
                            : null;
                });
    }

    private QuestaoDTO gerarSubtracaoDecimal(Operacao operacao, Dificuldade dificuldade) {
        return gerarComTentativas(
                "Não foi possível gerar uma subtração decimal com empréstimo.",
                () -> {
                    int inteiroA = sortearInteiroDecimal(dificuldade);
                    int inteiroB = sortearInteiroDecimal(dificuldade);
                    int casasA = sortearCasasDecimais(dificuldade);
                    int casasB = sortearCasasDecimais(dificuldade);
                    int numeroA = inteiroA * ESCALA_DECIMAL + sortearFracaoDecimal(casasA);
                    int numeroB = inteiroB * ESCALA_DECIMAL + sortearFracaoDecimal(casasB);
                    boolean emprestimosValidos = dificuldade == Dificuldade.DIFICIL
                            ? exigeEmprestimoEncadeado(numeroA, numeroB)
                            : exigeEmprestimo(numeroA, numeroB);
                    return numeroA > numeroB && emprestimosValidos
                            ? novaQuestaoDecimal(
                                    operacao, dificuldade, numeroA, numeroB, casasA, casasB)
                            : null;
                });
    }

    private int sortearInteiroDecimal(Dificuldade dificuldade) {
        if (dificuldade != Dificuldade.DIFICIL) {
            return sortear(dificuldade.getValorMinimo(), dificuldade.getValorMaximo());
        }

        int quantidadeDigitos = sortear(
                DIGITOS_INTEIROS_DECIMAIS_DIFICIL_MINIMOS,
                dificuldade.getQuantidadeDeDigitos());
        return sortear(
                (int) Math.pow(10, quantidadeDigitos - 1),
                (int) Math.pow(10, quantidadeDigitos) - 1);
    }

    private int sortearCasasDecimais(Dificuldade dificuldade) {
        if (dificuldade == Dificuldade.DIFICIL) {
            return sortear(CASAS_DECIMAIS_MINIMAS, CASAS_DECIMAIS_MAXIMAS);
        }

        return random.nextBoolean()
                ? CASAS_DECIMAIS_MINIMAS
                : CASAS_DECIMAIS_MAXIMAS;
    }

    private boolean exigeEmprestimoEncadeado(int numeroA, int numeroB) {
        List<Integer> passos = calcularEmprestimos(numeroA, numeroB);

        for (int coluna = 0; coluna + 1 < passos.size(); coluna += 1) {
            if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                return true;
            }
        }
        return false;
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

    private QuestaoDTO gerarMultiplicacaoDecimal(
            Operacao operacao,
            Dificuldade dificuldade) {
        return gerarComTentativas(
                "Não foi possível gerar uma multiplicação decimal.",
                () -> {
                    int casasA = sortearCasasMultiplicandoDecimal(dificuldade);
                    int casasB = CASAS_DECIMAIS_MINIMAS;
                    int inteiroA = sortearInteiroMultiplicandoDecimal(dificuldade);
                    int inteiroB = sortear(MENOR_FATOR, MAIOR_FATOR_UMA_CASA);
                    int numeroA = inteiroA * potenciaDeDez(casasA)
                            + sortearFracaoEscalada(casasA);
                    int numeroB = inteiroB * potenciaDeDez(casasB)
                            + sortearFracaoEscalada(casasB);
                    return novaQuestaoDecimal(
                            operacao, dificuldade, numeroA, numeroB, casasA, casasB);
                });
    }

    private int sortearInteiroMultiplicandoDecimal(Dificuldade dificuldade) {
        return switch (dificuldade) {
            case FACIL -> sortear(MENOR_FATOR, MAIOR_FATOR_UMA_CASA);
            case MEDIO -> sortear(MENOR_FATOR_DUAS_CASAS, MAIOR_FATOR_DUAS_CASAS);
            case DIFICIL -> sortear(
                    MENOR_MULTIPLICANDO_TRES_CASAS,
                    MAIOR_MULTIPLICANDO_TRES_CASAS);
        };
    }

    private int sortearCasasMultiplicandoDecimal(Dificuldade dificuldade) {
        if (dificuldade == Dificuldade.FACIL) {
            return CASAS_DECIMAIS_MINIMAS;
        }
        if (dificuldade == Dificuldade.DIFICIL) {
            return CASAS_DECIMAIS_MAXIMAS;
        }
        return random.nextBoolean()
                ? CASAS_DECIMAIS_MINIMAS
                : CASAS_DECIMAIS_MAXIMAS;
    }

    private int sortearFracaoEscalada(int casasDecimais) {
        if (casasDecimais == CASAS_DECIMAIS_MINIMAS) {
            return sortear(1, 9);
        }
        return sortear(10, 99);
    }

    private int potenciaDeDez(int expoente) {
        return (int) Math.pow(10, expoente);
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
        return switch (dificuldade) {
            case FACIL -> gerarDivisaoFacil(operacao, dificuldade);
            case MEDIO -> gerarDivisaoLonga(operacao, dificuldade);
            case DIFICIL -> gerarDivisaoDificil(operacao, dificuldade);
        };
    }

    private QuestaoDTO gerarDivisaoFacil(Operacao operacao, Dificuldade dificuldade) {
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

                    List<EtapaDivisaoDTO> etapas = calcularEtapasDivisaoLonga(dividendo, divisor);
                    return montarQuestaoDivisaoLonga(
                            operacao, dificuldade, dividendo, divisor, quociente, etapas);
                });
    }

    private QuestaoDTO gerarDivisaoDificil(Operacao operacao, Dificuldade dificuldade) {
        return gerarComTentativas(
                "Não foi possível gerar uma divisão difícil.",
                () -> {
                    int dividendo = sortear(DIVIDENDO_MINIMO_DIFICIL, DIVIDENDO_MAXIMO_DIFICIL);
                    int divisor = sortear(DIVISOR_MINIMO_LONGO, DIVISOR_MAXIMO_LONGO);
                    int quociente = dividendo / divisor;

                    if (quociente < MENOR_FATOR_DUAS_CASAS || quociente % 10 == 0) {
                        return null;
                    }

                    List<EtapaDivisaoDTO> etapas = calcularEtapasDivisaoLonga(dividendo, divisor);
                    boolean etapasValidas = etapas.size() >= 2
                            && etapas.stream().allMatch(etapa -> etapa.getQuociente() > 0);
                    return etapasValidas
                            ? montarQuestaoDivisaoLonga(
                                    operacao, dificuldade, dividendo, divisor, quociente, etapas)
                            : null;
                });
    }

    private QuestaoDTO montarQuestaoDivisaoLonga(
            Operacao operacao,
            Dificuldade dificuldade,
            int dividendo,
            int divisor,
            int quociente,
            List<EtapaDivisaoDTO> etapas) {
        QuestaoDTO questao = novaQuestao(operacao, dificuldade, dividendo, divisor);
        questao.setQuociente(quociente);
        questao.setResto(etapas.get(etapas.size() - 1).getResto());
        questao.setEtapas(etapas);

        EtapaDivisaoDTO primeira = etapas.get(0);
        EtapaDivisaoDTO ultima = etapas.get(etapas.size() - 1);
        questao.setDividendoParcial(primeira.getDividendoParcial());
        questao.setQuocienteParcial(primeira.getQuociente());
        questao.setSubtracaoParcial(primeira.getSubtracao());
        questao.setRestoParcial(primeira.getResto());
        questao.setDividendoAbaixado(primeira.getDividendoAbaixado());
        questao.setQuocienteFinal(ultima.getQuociente());
        questao.setSubtracaoFinal(ultima.getSubtracao());

        if (etapas.size() >= 3) {
            EtapaDivisaoDTO intermediaria = etapas.get(1);
            questao.setQuocienteIntermediario(intermediaria.getQuociente());
            questao.setSubtracaoEtapaIntermediaria(intermediaria.getSubtracao());
            questao.setRestoIntermediario(intermediaria.getResto());
            questao.setDividendoAbaixadoFinal(intermediaria.getDividendoAbaixado());
        }
        return questao;
    }

    private QuestaoDTO gerarDivisaoDecimal(
            Operacao operacao,
            Dificuldade dificuldade) {
        return gerarComTentativas(
                "Não foi possível gerar uma divisão decimal.",
                () -> switch (dificuldade) {
                    case FACIL -> sortearDivisaoDecimalFacil(operacao, dificuldade);
                    case MEDIO -> sortearDivisaoDecimalMedia(operacao, dificuldade);
                    case DIFICIL -> sortearDivisaoDecimalDificil(operacao, dificuldade);
                });
    }

    /*
     * A divisão decimal é montada a partir da divisão inteira equivalente:
     * igualamos as casas decimais e removemos as vírgulas antes de abrir a
     * chave. Por isso os passos exibidos na lousa são sempre inteiros.
     */
    private QuestaoDTO sortearDivisaoDecimalFacil(
            Operacao operacao,
            Dificuldade dificuldade) {
        int divisor = sortear(DIVISOR_MINIMO_FACIL, DIVISOR_MAXIMO_FACIL);
        int quociente = sortear(DIVISOR_MINIMO_FACIL, DIVISOR_MAXIMO_FACIL);
        int dividendo = divisor * quociente;

        if (!dentroDosLimites(dividendo, Dificuldade.FACIL)) {
            return null;
        }

        int casas = CASAS_DECIMAIS_MINIMAS;
        QuestaoDTO questao = montarQuestaoDivisaoExata(
                operacao, dificuldade, dividendo, divisor, quociente);
        aplicarMetadadosDivisaoDecimal(
                questao, dividendo, divisor, casas, casas, dividendo, divisor);
        return questao;
    }

    private QuestaoDTO sortearDivisaoDecimalMedia(
            Operacao operacao,
            Dificuldade dificuldade) {
        int quociente = sortear(MENOR_FATOR_DUAS_CASAS, MAIOR_FATOR_DUAS_CASAS);
        if (quociente % 10 == 0) {
            return null;
        }

        int divisorMinimo = Math.max(
                DIVISOR_MINIMO_LONGO,
                (DIVIDENDO_MINIMO_LONGO + quociente - 1) / quociente);
        int divisorMaximo = Math.min(
                DIVISOR_MAXIMO_LONGO,
                DIVIDENDO_MAXIMO_LONGO / quociente);
        if (divisorMinimo > divisorMaximo) {
            return null;
        }

        int divisorEquivalente = sortear(divisorMinimo, divisorMaximo);
        int dividendoEquivalente = divisorEquivalente * quociente;
        List<EtapaDivisaoDTO> etapas = calcularEtapasDivisaoLonga(
                dividendoEquivalente, divisorEquivalente);
        if (etapas.size() != 2) {
            return null;
        }

        int casas = CASAS_DECIMAIS_MINIMAS;
        QuestaoDTO questao = montarQuestaoDivisaoLonga(
                operacao,
                dificuldade,
                dividendoEquivalente,
                divisorEquivalente,
                quociente,
                etapas);
        aplicarMetadadosDivisaoDecimal(
                questao,
                dividendoEquivalente,
                divisorEquivalente,
                casas,
                casas,
                dividendoEquivalente,
                divisorEquivalente);
        return questao;
    }

    private QuestaoDTO sortearDivisaoDecimalDificil(
            Operacao operacao,
            Dificuldade dificuldade) {
        int casasA = CASAS_DECIMAIS_MAXIMAS;
        boolean acrescentarZero = random.nextBoolean();
        int casasB = acrescentarZero
                ? CASAS_DECIMAIS_MINIMAS
                : CASAS_DECIMAIS_MAXIMAS;
        int divisorEquivalente = acrescentarZero
                ? sortear(1, DIVISOR_MAXIMO_FACIL) * 10
                : sortear(DIVISOR_MINIMO_LONGO, DIVISOR_MAXIMO_LONGO);
        int quociente = sortear(MENOR_FATOR_DUAS_CASAS, MAIOR_FATOR_DUAS_CASAS);
        int dividendoEquivalente = divisorEquivalente * quociente;

        if (quociente % 10 == 0
                || dividendoEquivalente < DIVIDENDO_MINIMO_DIFICIL
                || dividendoEquivalente > DIVIDENDO_MAXIMO_DIFICIL) {
            return null;
        }

        List<EtapaDivisaoDTO> etapas = calcularEtapasDivisaoLonga(
                dividendoEquivalente, divisorEquivalente);
        boolean etapasValidas = etapas.size() >= 2
                && etapas.stream().allMatch(etapa -> etapa.getQuociente() > 0);
        if (!etapasValidas) {
            return null;
        }

        int numeroA = dividendoEquivalente;
        int numeroB = divisorEquivalente
                / potenciaDeDez(casasA - casasB);
        QuestaoDTO questao = montarQuestaoDivisaoLonga(
                operacao,
                dificuldade,
                dividendoEquivalente,
                divisorEquivalente,
                quociente,
                etapas);
        aplicarMetadadosDivisaoDecimal(
                questao,
                numeroA,
                numeroB,
                casasA,
                casasB,
                dividendoEquivalente,
                divisorEquivalente);
        return questao;
    }

    private void aplicarMetadadosDivisaoDecimal(
            QuestaoDTO questao,
            int numeroA,
            int numeroB,
            int casasDecimaisA,
            int casasDecimaisB,
            int dividendoEquivalente,
            int divisorEquivalente) {
        questao.setTipoNumero(TipoNumero.DECIMAIS);
        questao.setNumeroA(numeroA);
        questao.setNumeroB(numeroB);
        questao.setCasasDecimaisA(casasDecimaisA);
        questao.setCasasDecimaisB(casasDecimaisB);
        questao.setDividendoEquivalente(dividendoEquivalente);
        questao.setDivisorEquivalente(divisorEquivalente);
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
                && dividendo <= DIVIDENDO_MAXIMO_DIFICIL
                && divisor >= DIVISOR_MINIMO_LONGO
                && divisor <= DIVISOR_MAXIMO_LONGO_DIVISAO
                && dividendo / divisor >= MENOR_FATOR_DUAS_CASAS;
    }

    private List<EtapaDivisaoDTO> calcularEtapasDivisaoLonga(int dividendo, int divisor) {
        String digitos = String.valueOf(dividendo);
        List<EtapaDivisaoDTO> etapas = new ArrayList<>();
        int posicao = 0;
        int alvo = 0;

        while (posicao < digitos.length() && alvo < divisor) {
            alvo = alvo * 10 + Character.getNumericValue(digitos.charAt(posicao));
            posicao += 1;
        }

        while (posicao <= digitos.length()) {
            int quociente = alvo / divisor;
            int subtracao = divisor * quociente;
            int resto = alvo - subtracao;
            Integer abaixado = null;

            if (posicao < digitos.length()) {
                abaixado = resto * 10 + Character.getNumericValue(digitos.charAt(posicao));
            }

            etapas.add(new EtapaDivisaoDTO(
                    etapas.size() + 1,
                    alvo,
                    quociente,
                    subtracao,
                    resto,
                    abaixado));

            if (abaixado == null) {
                break;
            }
            alvo = abaixado;
            posicao += 1;
        }

        return etapas;
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
        QuestaoDTO questao = new QuestaoDTO();
        questao.setId(UUID.randomUUID().toString());
        questao.setOperacao(operacao);
        questao.setDificuldade(dificuldade);
        questao.setTipoNumero(TipoNumero.INTEIROS);
        questao.setNumeroA(numeroA);
        questao.setNumeroB(numeroB);
        return questao;
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
        if (requisicao.getTipoNumero() == TipoNumero.DECIMAIS) {
            int casasDecimais = requisicao.getCasasDecimais() == null
                    ? -1
                    : requisicao.getCasasDecimais();
            if (requisicao.getOperacao() == Operacao.DIVISAO) {
                if (casasDecimais < CASAS_DECIMAIS_MINIMAS
                        || casasDecimais > CASAS_DECIMAIS_MAXIMAS) {
                    throw new IllegalArgumentException(
                            "A quantidade de casas decimais deve ser 1 ou 2.");
                }
                if (requisicao.getDividendoEquivalente() == null
                        || requisicao.getDivisorEquivalente() == null
                        || requisicao.getDividendoEquivalente() <= 0
                        || requisicao.getDivisorEquivalente() <= 0) {
                    throw new IllegalArgumentException(
                            "Informe os números equivalentes da divisão decimal.");
                }
                return;
            }
            if (requisicao.getOperacao() != Operacao.SOMA
                    && requisicao.getOperacao() != Operacao.SUBTRACAO
                    && requisicao.getOperacao() != Operacao.MULTIPLICACAO) {
                throw new IllegalArgumentException(
                        "Números decimais estão disponíveis apenas na soma, "
                                + "subtração e multiplicação.");
            }
            boolean multiplicacao = requisicao.getOperacao() == Operacao.MULTIPLICACAO;
            int limiteCasas = multiplicacao
                    ? CASAS_DECIMAIS_MAXIMAS + 1
                    : CASAS_DECIMAIS_MAXIMAS;
            if (casasDecimais < CASAS_DECIMAIS_MINIMAS
                    || casasDecimais > limiteCasas) {
                throw new IllegalArgumentException(
                        multiplicacao
                                ? "A quantidade de casas decimais deve ser 1, 2 ou 3."
                                : "A quantidade de casas decimais deve ser 1 ou 2.");
            }
            if (multiplicacao
                    && requisicao.getCasasDecimaisResultado() != null
                    && (requisicao.getCasasDecimaisResultado() < 0
                    || requisicao.getCasasDecimaisResultado() > casasDecimais)) {
                throw new IllegalArgumentException(
                        "A posição da vírgula deve estar entre 0 e a quantidade "
                                + "de casas decimais.");
            }
        }
    }

    private record AvaliacaoPassos(
            int respostaCorreta,
            boolean passosCorretos,
            String mensagemPassoIncorreto) {

        AvaliacaoPassos(int respostaCorreta, boolean passosCorretos) {
            this(respostaCorreta, passosCorretos, null);
        }
    }
}
