package com.example.jogo.service;

import com.example.jogo.dto.EtapaDivisaoDTO;
import com.example.jogo.dto.QuestaoDTO;
import com.example.jogo.dto.RequisicaoValidacaoDTO;
import com.example.jogo.dto.RespostaValidacaoDTO;
import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import com.example.jogo.enums.TipoNumero;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JogoServiceTest {

    private JogoService jogoService;

    @BeforeEach
    void setUp() {
        jogoService = new JogoService(new Random(42));
    }

    @Test
    @DisplayName("Gera somas fáceis com dois dígitos e que exigem vai um")
    void geraSomaFacilComVaiUm() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SOMA, Dificuldade.FACIL);

            assertEquals(Operacao.SOMA, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 10 && questao.getNumeroA() <= 99);
            assertTrue(questao.getNumeroB() >= 10 && questao.getNumeroB() <= 99);
            assertTrue(jogoService.exigeVaiUm(questao.getNumeroA(), questao.getNumeroB()));
            assertTrue(questao.getId() != null && !questao.getId().isBlank());
        }
    }

    @Test
    @DisplayName("Gera somas médias com três dígitos e que exigem vai um")
    void geraSomaMediaComVaiUm() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SOMA, Dificuldade.MEDIO);

            assertEquals(Operacao.SOMA, questao.getOperacao());
            assertEquals(Dificuldade.MEDIO, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 100 && questao.getNumeroA() <= 999);
            assertTrue(questao.getNumeroB() >= 100 && questao.getNumeroB() <= 999);
            assertTrue(jogoService.exigeVaiUm(questao.getNumeroA(), questao.getNumeroB()));
        }
    }

    @Test
    @DisplayName("Gera somas difíceis com quatro dígitos e reservas encadeadas")
    void geraSomaDificilComReservasEncadeadas() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SOMA, Dificuldade.DIFICIL);

            assertEquals(Operacao.SOMA, questao.getOperacao());
            assertEquals(Dificuldade.DIFICIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 1000 && questao.getNumeroA() <= 9999);
            assertTrue(questao.getNumeroB() >= 1000 && questao.getNumeroB() <= 9999);

            List<Integer> passos = jogoService.calcularVaiUm(
                    questao.getNumeroA(), questao.getNumeroB());
            boolean temReservasConsecutivas = false;
            for (int coluna = 0; coluna + 1 < passos.size(); coluna++) {
                if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                    temReservasConsecutivas = true;
                    break;
                }
            }
            assertTrue(temReservasConsecutivas,
                    "A soma difícil deve encadear pelo menos duas reservas.");
        }
    }

    @Test
    @DisplayName("Gera somas decimais com uma e duas casas e reservas válidas")
    void geraSomaDecimalComCasasDiferentesEReservas() {
        for (Dificuldade dificuldade : List.of(
                Dificuldade.FACIL, Dificuldade.MEDIO, Dificuldade.DIFICIL)) {
            for (int i = 0; i < 100; i++) {
                QuestaoDTO questao = jogoService.gerarQuestao(
                        Operacao.SOMA, dificuldade, TipoNumero.DECIMAIS);

                assertEquals(Operacao.SOMA, questao.getOperacao());
                assertEquals(dificuldade, questao.getDificuldade());
                assertEquals(TipoNumero.DECIMAIS, questao.getTipoNumero());

                int casasA = questao.getCasasDecimaisA();
                int casasB = questao.getCasasDecimaisB();
                assertTrue(casasA == 1 || casasA == 2);
                assertTrue(casasB == 1 || casasB == 2);
                assertTrue(casasA != casasB);

                int inteiroA = questao.getNumeroA() / 100;
                int inteiroB = questao.getNumeroB() / 100;
                assertTrue(inteiroA >= dificuldade.getValorMinimo()
                        && inteiroA <= dificuldade.getValorMaximo());
                assertTrue(inteiroB >= dificuldade.getValorMinimo()
                        && inteiroB <= dificuldade.getValorMaximo());

                assertTrue(jogoService.exigeVaiUm(
                        questao.getNumeroA(), questao.getNumeroB()));

                if (dificuldade == Dificuldade.DIFICIL) {
                    List<Integer> passos = jogoService.calcularVaiUm(
                            questao.getNumeroA(), questao.getNumeroB());
                    boolean encadeados = false;
                    for (int coluna = 0; coluna + 1 < passos.size(); coluna++) {
                        if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                            encadeados = true;
                            break;
                        }
                    }
                    assertTrue(encadeados,
                            "A soma decimal difícil deve encadear reservas.");
                }
            }
        }
    }

    @Test
    @DisplayName("Mantém inteiros como padrão e aceita decimais nas operações suportadas")
    void validaTipoNumeroNaGeracao() {
        QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SOMA, Dificuldade.FACIL);
        assertEquals(TipoNumero.INTEIROS, questao.getTipoNumero());

        QuestaoDTO subtracao = jogoService.gerarQuestao(
                Operacao.SUBTRACAO, Dificuldade.FACIL, TipoNumero.DECIMAIS);
        assertEquals(TipoNumero.DECIMAIS, subtracao.getTipoNumero());

        QuestaoDTO multiplicacao = jogoService.gerarQuestao(
                Operacao.MULTIPLICACAO, Dificuldade.FACIL, TipoNumero.DECIMAIS);
        assertEquals(TipoNumero.DECIMAIS, multiplicacao.getTipoNumero());

        QuestaoDTO divisao = jogoService.gerarQuestao(
                Operacao.DIVISAO, Dificuldade.FACIL, TipoNumero.DECIMAIS);
        assertEquals(TipoNumero.DECIMAIS, divisao.getTipoNumero());
        assertTrue(divisao.getDividendoEquivalente() > 0);
        assertTrue(divisao.getDivisorEquivalente() > 0);

        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.SOMA, Dificuldade.FACIL, null));
    }

    @Test
    @DisplayName("Gera subtrações decimais variadas com empréstimos válidos")
    void geraSubtracaoDecimalComCasasDiferentesEEmprestimos() {
        for (Dificuldade dificuldade : List.of(
                Dificuldade.FACIL, Dificuldade.MEDIO, Dificuldade.DIFICIL)) {
            Set<Integer> tamanhosInteiros = new HashSet<>();
            Set<Integer> quantidadesDeCasas = new HashSet<>();
            for (int i = 0; i < 200; i++) {
                QuestaoDTO questao = jogoService.gerarQuestao(
                        Operacao.SUBTRACAO, dificuldade, TipoNumero.DECIMAIS);

                assertEquals(Operacao.SUBTRACAO, questao.getOperacao());
                assertEquals(dificuldade, questao.getDificuldade());
                assertEquals(TipoNumero.DECIMAIS, questao.getTipoNumero());

                int casasA = questao.getCasasDecimaisA();
                int casasB = questao.getCasasDecimaisB();
                assertTrue(casasA >= 1 && casasA <= 2);
                assertTrue(casasB >= 1 && casasB <= 2);
                quantidadesDeCasas.add(casasA);
                quantidadesDeCasas.add(casasB);

                int inteiroA = questao.getNumeroA() / 100;
                int inteiroB = questao.getNumeroB() / 100;
                int minimo = dificuldade == Dificuldade.DIFICIL
                        ? 100
                        : dificuldade.getValorMinimo();
                assertTrue(inteiroA >= minimo
                        && inteiroA <= dificuldade.getValorMaximo());
                assertTrue(inteiroB >= minimo
                        && inteiroB <= dificuldade.getValorMaximo());
                tamanhosInteiros.add(String.valueOf(inteiroA).length());
                tamanhosInteiros.add(String.valueOf(inteiroB).length());
                assertTrue(questao.getNumeroA() > questao.getNumeroB());
                assertTrue(jogoService.exigeEmprestimo(
                        questao.getNumeroA(), questao.getNumeroB()));

                if (dificuldade == Dificuldade.DIFICIL) {
                    List<Integer> passos = jogoService.calcularEmprestimos(
                            questao.getNumeroA(), questao.getNumeroB());
                    boolean encadeados = false;
                    for (int coluna = 0; coluna + 1 < passos.size(); coluna++) {
                        if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                            encadeados = true;
                            break;
                        }
                    }
                    assertTrue(encadeados,
                            "A subtração decimal difícil deve encadear empréstimos.");
                }
            }

            assertEquals(Set.of(1, 2), quantidadesDeCasas);
            if (dificuldade == Dificuldade.DIFICIL) {
                assertEquals(Set.of(3, 4), tamanhosInteiros);
            }
        }
    }

    @Test
    @DisplayName("Valida subtração decimal com alinhamento de duas casas")
    void validaSubtracaoDecimalComCasasAlinhadas() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-subtracao-decimal", Operacao.SUBTRACAO, 1275, 348, 927,
                null, List.of(1, 0, 1, 0), null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(927, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Formata a resposta de subtração decimal com vírgula no feedback")
    void formataRespostaSubtracaoDecimalNoFeedback() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-subtracao-decimal-errado", Operacao.SUBTRACAO, 1275, 348, 900,
                null, List.of(1, 0, 1, 0), null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("9,27"));
    }

    @Test
    @DisplayName("Valida soma decimal com alinhamento de duas casas")
    void validaSomaDecimalComCasasAlinhadas() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-decimal", Operacao.SOMA, 1275, 348, 1623,
                List.of(1, 1, 0, 0), null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(1623, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Formata a resposta decimal com vírgula no feedback de erro")
    void formataRespostaDecimalNoFeedback() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-decimal-errado", Operacao.SOMA, 1275, 348, 1600,
                List.of(1, 1, 0, 0), null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("16,23"));
    }

    @Test
    @DisplayName("Rejeita casas decimais ausentes ou operação incompatível")
    void rejeitaValidacaoDecimalInvalida() {
        RequisicaoValidacaoDTO semCasas = new RequisicaoValidacaoDTO(
                "id-sem-casas", Operacao.SOMA, 1275, 348, 1623,
                List.of(1, 1, 0, 0), null, null);
        semCasas.setTipoNumero(TipoNumero.DECIMAIS);

        RequisicaoValidacaoDTO operacaoIncompativel = new RequisicaoValidacaoDTO(
                "id-divisao-decimal", Operacao.DIVISAO, 12, 3, 4,
                null, null, null);
        operacaoIncompativel.setTipoNumero(TipoNumero.DECIMAIS);
        operacaoIncompativel.setCasasDecimais(2);

        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(semCasas));
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(operacaoIncompativel));
    }

    @Test
    @DisplayName("Gera multiplicações decimais em todos os níveis com fatores escalados")
    void geraMultiplicacaoDecimalEmTodosOsNiveis() {
        for (Dificuldade dificuldade : List.of(
                Dificuldade.FACIL, Dificuldade.MEDIO, Dificuldade.DIFICIL)) {
            for (int i = 0; i < 100; i++) {
                QuestaoDTO questao = jogoService.gerarQuestao(
                        Operacao.MULTIPLICACAO, dificuldade, TipoNumero.DECIMAIS);

                assertEquals(Operacao.MULTIPLICACAO, questao.getOperacao());
                assertEquals(dificuldade, questao.getDificuldade());
                assertEquals(TipoNumero.DECIMAIS, questao.getTipoNumero());

                int casasA = questao.getCasasDecimaisA();
                int casasB = questao.getCasasDecimaisB();
                assertTrue(casasA >= 1 && casasA <= 2);
                assertEquals(1, casasB);

                int inteiroA = questao.getNumeroA() / (int) Math.pow(10, casasA);
                int inteiroB = questao.getNumeroB() / 10;
                int minimo = switch (dificuldade) {
                    case FACIL -> 1;
                    case MEDIO -> 10;
                    case DIFICIL -> 100;
                };
                int maximo = switch (dificuldade) {
                    case FACIL -> 9;
                    case MEDIO -> 99;
                    case DIFICIL -> 999;
                };
                assertTrue(inteiroA >= minimo && inteiroA <= maximo);
                assertTrue(inteiroB >= 1 && inteiroB <= 9);
                assertTrue(questao.getNumeroA() % (int) Math.pow(10, casasA) >= 1);
                assertTrue(questao.getNumeroB() % 10 >= 1);
            }
        }
    }

    @Test
    @DisplayName("Valida multiplicação decimal com o produto inteiro e a vírgula correta")
    void validaMultiplicacaoDecimalComVirgulaCorreta() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-decimal", Operacao.MULTIPLICACAO, 25, 34, 850,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);
        requisicao.setCasasDecimaisResultado(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(850, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o produto decimal está certo mas a vírgula está errada")
    void validaMultiplicacaoDecimalComVirgulaErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-decimal-virgula", Operacao.MULTIPLICACAO, 25, 34, 850,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);
        requisicao.setCasasDecimaisResultado(1);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(850, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("vírgula"));
    }

    @Test
    @DisplayName("Formata o produto decimal com vírgula no feedback de erro")
    void formataProdutoDecimalNoFeedback() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-decimal-errada", Operacao.MULTIPLICACAO, 25, 34, 800,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);
        requisicao.setCasasDecimaisResultado(2);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("8,50"));
    }

    @Test
    @DisplayName("Rejeita posição de vírgula fora das casas decimais da multiplicação")
    void rejeitaPosicaoDeVirgulaInvalida() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-decimal-invalida", Operacao.MULTIPLICACAO, 25, 34, 850,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(2);
        requisicao.setCasasDecimaisResultado(3);

        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(requisicao));
    }

    @Test
    @DisplayName("Gera subtrações fáceis com A maior que B e que exigem empréstimo")
    void geraSubtracaoFacilComEmprestimo() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SUBTRACAO, Dificuldade.FACIL);

            assertEquals(Operacao.SUBTRACAO, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 10 && questao.getNumeroA() <= 99);
            assertTrue(questao.getNumeroB() >= 10 && questao.getNumeroB() <= 99);
            assertTrue(questao.getNumeroA() > questao.getNumeroB());
            assertTrue(jogoService.exigeEmprestimo(questao.getNumeroA(), questao.getNumeroB()));
        }
    }

    @Test
    @DisplayName("Gera subtrações médias com A maior que B e que exigem empréstimo")
    void geraSubtracaoMediaComEmprestimo() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SUBTRACAO, Dificuldade.MEDIO);

            assertEquals(Operacao.SUBTRACAO, questao.getOperacao());
            assertEquals(Dificuldade.MEDIO, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 100 && questao.getNumeroA() <= 999);
            assertTrue(questao.getNumeroB() >= 100 && questao.getNumeroB() <= 999);
            assertTrue(questao.getNumeroA() > questao.getNumeroB());
            assertTrue(jogoService.exigeEmprestimo(questao.getNumeroA(), questao.getNumeroB()));
        }
    }

    @Test
    @DisplayName("Gera subtrações difíceis com quatro dígitos e empréstimos encadeados")
    void geraSubtracaoDificilComEmprestimosEncadeados() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.SUBTRACAO, Dificuldade.DIFICIL);

            assertEquals(Operacao.SUBTRACAO, questao.getOperacao());
            assertEquals(Dificuldade.DIFICIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 1000 && questao.getNumeroA() <= 9999);
            assertTrue(questao.getNumeroB() >= 1000 && questao.getNumeroB() <= 9999);
            assertTrue(questao.getNumeroA() > questao.getNumeroB());

            List<Integer> passos = jogoService.calcularEmprestimos(
                    questao.getNumeroA(), questao.getNumeroB());
            boolean temEmprestimosConsecutivos = false;
            for (int coluna = 0; coluna + 1 < passos.size(); coluna++) {
                if (passos.get(coluna) == 1 && passos.get(coluna + 1) == 1) {
                    temEmprestimosConsecutivos = true;
                    break;
                }
            }
            assertTrue(temEmprestimosConsecutivos,
                    "A subtração difícil deve encadear pelo menos dois empréstimos.");
        }
    }

    @Test
    @DisplayName("Gera multiplicações fáceis com um dígito em cada fator")
    void geraMultiplicacaoFacilComUmDigito() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.MULTIPLICACAO, Dificuldade.FACIL);

            assertEquals(Operacao.MULTIPLICACAO, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 1 && questao.getNumeroA() <= 9);
            assertTrue(questao.getNumeroB() >= 1 && questao.getNumeroB() <= 9);
            assertNull(questao.getVaiUm());
            assertNull(questao.getResultadoParcial());
            assertTrue(questao.getId() != null && !questao.getId().isBlank());
        }
    }

    @Test
    @DisplayName("Gera multiplicações médias com dois dígitos por um e calcula os passos")
    void geraMultiplicacaoMediaComDoisDigitosPorUm() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.MULTIPLICACAO, Dificuldade.MEDIO);

            assertEquals(Operacao.MULTIPLICACAO, questao.getOperacao());
            assertEquals(Dificuldade.MEDIO, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 10 && questao.getNumeroA() <= 99);
            assertTrue(questao.getNumeroB() >= 1 && questao.getNumeroB() <= 9);
            assertEquals(
                    jogoService.calcularVaiUmMultiplicacao(questao.getNumeroA(), questao.getNumeroB()),
                    questao.getVaiUm());
            assertEquals(questao.getNumeroA() * questao.getNumeroB(), questao.getResultadoParcial());
        }
    }

    @Test
    @DisplayName("Gera multiplicações difíceis com três dígitos por dois")
    void geraMultiplicacaoDificilComTresDigitosPorDois() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(
                    Operacao.MULTIPLICACAO, Dificuldade.DIFICIL);

            assertEquals(Operacao.MULTIPLICACAO, questao.getOperacao());
            assertEquals(Dificuldade.DIFICIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 100 && questao.getNumeroA() <= 999);
            assertTrue(questao.getNumeroB() >= 12 && questao.getNumeroB() <= 99);
            assertTrue(questao.getNumeroB() % 10 >= 2);
            assertTrue(questao.getNumeroB() / 10 >= 1);
            assertTrue(questao.getId() != null && !questao.getId().isBlank());
        }
    }

    @Test
    @DisplayName("Gera divisões difíceis com quatro dígitos por dois dígitos e etapas sem zero")
    void geraDivisaoDificil() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.DIVISAO, Dificuldade.DIFICIL);

            assertEquals(Operacao.DIVISAO, questao.getOperacao());
            assertEquals(Dificuldade.DIFICIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 1000 && questao.getNumeroA() <= 9999);
            assertTrue(questao.getNumeroB() >= 10 && questao.getNumeroB() <= 99);
            assertEquals(questao.getNumeroA() / questao.getNumeroB(), questao.getQuociente());

            List<EtapaDivisaoDTO> etapas = questao.getEtapas();
            assertTrue(etapas.size() >= 2);
            assertEquals(etapas.size() >= 3, questao.getQuocienteIntermediario() != null);

            int quocienteComposto = 0;
            for (int indice = 0; indice < etapas.size(); indice++) {
                EtapaDivisaoDTO etapa = etapas.get(indice);
                assertEquals(indice + 1, etapa.getIndice());
                assertTrue(etapa.getQuociente() >= 1 && etapa.getQuociente() <= 9);
                assertEquals(etapa.getQuociente() * questao.getNumeroB(), etapa.getSubtracao());
                assertEquals(
                        etapa.getDividendoParcial() - etapa.getSubtracao(),
                        etapa.getResto());

                if (indice + 1 < etapas.size()) {
                    assertEquals(
                            etapa.getDividendoAbaixado(),
                            etapas.get(indice + 1).getDividendoParcial());
                } else {
                    assertNull(etapa.getDividendoAbaixado());
                    assertEquals(etapa.getResto(), questao.getResto());
                }
                quocienteComposto = quocienteComposto * 10 + etapa.getQuociente();
            }
            assertEquals(questao.getQuociente(), quocienteComposto);

            EtapaDivisaoDTO primeira = etapas.get(0);
            EtapaDivisaoDTO ultima = etapas.get(etapas.size() - 1);
            assertEquals(primeira.getDividendoParcial(), questao.getDividendoParcial());
            assertEquals(primeira.getQuociente(), questao.getQuocienteParcial());
            assertEquals(primeira.getSubtracao(), questao.getSubtracaoParcial());
            assertEquals(primeira.getResto(), questao.getRestoParcial());
            assertEquals(primeira.getDividendoAbaixado(), questao.getDividendoAbaixado());
            assertEquals(ultima.getQuociente(), questao.getQuocienteFinal());
            assertEquals(ultima.getSubtracao(), questao.getSubtracaoFinal());
            assertNull(questao.getSubtracaoIntermediaria());
        }
    }

    @Test
    @DisplayName("Valida a divisão difícil enviada com listas de etapas")
    void validaDivisaoDificilComListasDeEtapas() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-dificil", Operacao.DIVISAO, 6898, 15, 459,
                null, null, null, null, 13);
        requisicao.setQuocientesParciaisDigitados(List.of(4, 5, 9));
        requisicao.setSubtracoesParciaisDigitadas(List.of(60, 75, 135));
        requisicao.setRestosParciaisDigitados(List.of(8, 14, 13));

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(459, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando uma lista da divisão difícil está errada")
    void validaDivisaoDificilComListaErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-dificil-lista-errada", Operacao.DIVISAO, 6898, 15, 459,
                null, null, null, null, 13);
        requisicao.setQuocientesParciaisDigitados(List.of(4, 5, 9));
        requisicao.setSubtracoesParciaisDigitadas(List.of(60, 75, 135));
        requisicao.setRestosParciaisDigitados(List.of(8, 12, 13));

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(459, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("passos da divisão"));
    }

    @Test
    @DisplayName("Valida a divisão difícil enviada com campos intermediários")
    void validaDivisaoDificilComCamposIntermediarios() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-dificil-campos", Operacao.DIVISAO, 6898, 15, 459,
                null, null, null, null, 13);
        requisicao.setQuocienteParcialDigitado(4);
        requisicao.setSubtracaoParcialDigitada(60);
        requisicao.setRestoParcialDigitado(8);
        requisicao.setQuocienteIntermediarioDigitado(5);
        requisicao.setSubtracaoIntermediariaDigitada(75);
        requisicao.setRestoIntermediarioDigitado(14);
        requisicao.setQuocienteFinalDigitado(9);
        requisicao.setSubtracaoFinalDigitada(135);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida o resultado final da multiplicação difícil")
    void validaMultiplicacaoDificil() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-dificil", Operacao.MULTIPLICACAO, 327, 15, 4905, null, null, 3);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(4905, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Zera os pontos quando o resultado da multiplicação difícil está errado")
    void validaMultiplicacaoDificilErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-dificil-errada", Operacao.MULTIPLICACAO, 327, 15, 4904, null, null, 3);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(4905, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Calcula o vai um da multiplicação a partir das unidades")
    void calculaVaiUmDaMultiplicacao() {
        assertEquals(1, jogoService.calcularVaiUmMultiplicacao(35, 3));
        assertEquals(1, jogoService.calcularVaiUmMultiplicacao(24, 4));
        assertEquals(0, jogoService.calcularVaiUmMultiplicacao(12, 3));
        assertEquals(7, jogoService.calcularVaiUmMultiplicacao(98, 9));
    }

    @Test
    @DisplayName("Valida multiplicação média correta com o vai um correto")
    void validaMultiplicacaoMediaComVaiUmCorreto() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-media", Operacao.MULTIPLICACAO, 35, 3, 105, null, null, 1);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(105, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida multiplicação média quando o transporte é maior que um")
    void validaMultiplicacaoMediaComVaiUmMaiorQueUm() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-media-carry-alto", Operacao.MULTIPLICACAO, 98, 9, 882, null, null, 7);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(882, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o resultado está certo mas o vai um está errado")
    void validaMultiplicacaoMediaComVaiUmErrado() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-media-carry", Operacao.MULTIPLICACAO, 35, 3, 105, null, null, 0);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(105, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("vai um"));
    }

    @Test
    @DisplayName("Aceita vai um ausente quando a multiplicação das unidades não gera transporte")
    void validaMultiplicacaoMediaSemVaiUmEsperado() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-media-sem-carry", Operacao.MULTIPLICACAO, 12, 3, 36, null, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida multiplicação fácil sem exigir passos intermediários")
    void validaMultiplicacaoCorreta() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult", Operacao.MULTIPLICACAO, 7, 8, 56, null, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(56, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Zera os pontos quando o resultado da multiplicação está errado")
    void validaMultiplicacaoErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-errada", Operacao.MULTIPLICACAO, 7, 8, 54, null, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(56, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("56"));
    }

    @Test
    @DisplayName("Gera divisões fáceis exatas com dividendo de dois dígitos e divisor de um dígito")
    void geraDivisaoFacilExata() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.DIVISAO, Dificuldade.FACIL);

            assertEquals(Operacao.DIVISAO, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 10 && questao.getNumeroA() <= 99);
            assertTrue(questao.getNumeroB() >= 2 && questao.getNumeroB() <= 9);
            assertEquals(0, questao.getNumeroA() % questao.getNumeroB());
            assertEquals(questao.getNumeroA() / questao.getNumeroB(), questao.getQuociente());
            assertEquals(questao.getNumeroA(), questao.getSubtracaoIntermediaria());
            assertEquals(0, questao.getResto());
            assertNull(questao.getVaiUm());
            assertNull(questao.getResultadoParcial());
            assertTrue(questao.getId() != null && !questao.getId().isBlank());
        }
    }

    @Test
    @DisplayName("Gera divisões médias longas com dividendo de três dígitos e divisor de dois dígitos")
    void geraDivisaoMediaLonga() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.DIVISAO, Dificuldade.MEDIO);

            assertEquals(Operacao.DIVISAO, questao.getOperacao());
            assertEquals(Dificuldade.MEDIO, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 100 && questao.getNumeroA() <= 999);
            assertTrue(questao.getNumeroB() >= 10 && questao.getNumeroB() <= 99);

            int dividendoParcial = questao.getNumeroA() / 10;
            int quocienteParcial = dividendoParcial / questao.getNumeroB();
            int subtracaoParcial = quocienteParcial * questao.getNumeroB();
            int restoParcial = dividendoParcial - subtracaoParcial;
            int dividendoAbaixado = restoParcial * 10 + questao.getNumeroA() % 10;
            int quocienteFinal = dividendoAbaixado / questao.getNumeroB();
            int subtracaoFinal = quocienteFinal * questao.getNumeroB();
            int restoFinal = dividendoAbaixado - subtracaoFinal;
            int quociente = questao.getNumeroA() / questao.getNumeroB();

            assertEquals(quociente, questao.getQuociente());
            assertTrue(quociente >= 10 && quociente <= 99);
            assertEquals(dividendoParcial, questao.getDividendoParcial());
            assertEquals(quocienteParcial, questao.getQuocienteParcial());
            assertEquals(subtracaoParcial, questao.getSubtracaoParcial());
            assertEquals(restoParcial, questao.getRestoParcial());
            assertEquals(dividendoAbaixado, questao.getDividendoAbaixado());
            assertEquals(quocienteFinal, questao.getQuocienteFinal());
            assertEquals(subtracaoFinal, questao.getSubtracaoFinal());
            assertEquals(restoFinal, questao.getResto());
            assertEquals(quocienteParcial * 10 + quocienteFinal, quociente);
            assertTrue(quocienteFinal >= 1 && quocienteFinal <= 9);
            assertNull(questao.getSubtracaoIntermediaria());
        }
    }

    @Test
    @DisplayName("Valida divisão média longa com todas as etapas corretas")
    void validaDivisaoMediaCorreta() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-media", Operacao.DIVISAO, 793, 17, 46,
                null, null, null, null, 11);
        requisicao.setQuocienteParcialDigitado(4);
        requisicao.setSubtracaoParcialDigitada(68);
        requisicao.setRestoParcialDigitado(11);
        requisicao.setQuocienteFinalDigitado(6);
        requisicao.setSubtracaoFinalDigitada(102);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(46, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando uma etapa da divisão média está errada")
    void validaDivisaoMediaComEtapaErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-media-etapa", Operacao.DIVISAO, 793, 17, 46,
                null, null, null, null, 11);
        requisicao.setQuocienteParcialDigitado(4);
        requisicao.setSubtracaoParcialDigitada(68);
        requisicao.setRestoParcialDigitado(11);
        requisicao.setQuocienteFinalDigitado(5);
        requisicao.setSubtracaoFinalDigitada(102);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(46, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("divisão"));
    }

    @Test
    @DisplayName("Dá acerto parcial quando a divisão média não envia as etapas")
    void validaDivisaoMediaSemEtapas() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-media-sem-etapas", Operacao.DIVISAO, 793, 17, 46,
                null, null, null, null, 11);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Zera os pontos quando o quociente da divisão média está errado")
    void validaDivisaoMediaErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-media-errada", Operacao.DIVISAO, 793, 17, 45,
                null, null, null, null, 11);
        requisicao.setQuocienteParcialDigitado(4);
        requisicao.setSubtracaoParcialDigitada(68);
        requisicao.setRestoParcialDigitado(11);
        requisicao.setQuocienteFinalDigitado(6);
        requisicao.setSubtracaoFinalDigitada(102);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(46, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("46"));
    }

    @Test
    @DisplayName("Valida divisão correta com quociente, subtração e resto corretos")
    void validaDivisaoCorreta() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div", Operacao.DIVISAO, 36, 4, 9,
                null, null, null, 36, 0);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(9, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida divisão não exata usando quociente inteiro, subtração e resto")
    void validaDivisaoNaoExata() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-resto", Operacao.DIVISAO, 37, 4, 9,
                null, null, null, 36, 1);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(9, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o quociente está certo mas os passos da divisão estão errados")
    void validaDivisaoComPassosErrados() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-passos", Operacao.DIVISAO, 36, 4, 9,
                null, null, null, 24, 0);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(9, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("divisão"));
    }

    @Test
    @DisplayName("Dá acerto parcial quando a divisão não envia a subtração ou o resto")
    void validaDivisaoSemPassos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-sem-passos", Operacao.DIVISAO, 36, 4, 9,
                null, null, null, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Zera os pontos quando o quociente da divisão está errado")
    void validaDivisaoErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-errada", Operacao.DIVISAO, 36, 4, 8,
                null, null, null, 36, 0);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(9, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("9"));
    }

    @Test
    @DisplayName("Rejeita validação de divisão por zero")
    void rejeitaDivisaoPorZero() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-zero", Operacao.DIVISAO, 36, 0, 9,
                null, null, null, 0, 0);

        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(requisicao));
    }

    @Test
    @DisplayName("Rejeita geração sem operação ou sem dificuldade")
    void rejeitaParametrosNulosNaGeracao() {
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.gerarQuestao(null, Dificuldade.FACIL));
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.gerarQuestao(Operacao.SOMA, null));
    }

    @Test
    @DisplayName("Detecta corretamente quando a soma exige vai um")
    void detectaVaiUm() {
        assertTrue(jogoService.exigeVaiUm(38, 25));
        assertTrue(jogoService.exigeVaiUm(5, 5));
        assertFalse(jogoService.exigeVaiUm(12, 23));
    }

    @Test
    @DisplayName("Detecta corretamente quando a subtração exige empréstimo")
    void detectaEmprestimo() {
        assertTrue(jogoService.exigeEmprestimo(52, 37));
        assertTrue(jogoService.exigeEmprestimo(100, 1));
        assertFalse(jogoService.exigeEmprestimo(58, 32));
    }

    @Test
    @DisplayName("Calcula os passos de vai um coluna a coluna")
    void calculaVaiUm() {
        assertEquals(List.of(1, 0), jogoService.calcularVaiUm(38, 25));
        assertEquals(List.of(1, 1, 0), jogoService.calcularVaiUm(99, 1));
        assertEquals(List.of(0, 0), jogoService.calcularVaiUm(12, 23));
    }

    @Test
    @DisplayName("Calcula os empréstimos coluna a coluna")
    void calculaEmprestimos() {
        assertEquals(List.of(1, 0), jogoService.calcularEmprestimos(52, 37));
        assertEquals(List.of(1, 1, 0), jogoService.calcularEmprestimos(100, 1));
        assertEquals(List.of(0, 0), jogoService.calcularEmprestimos(58, 32));
    }

    @Test
    @DisplayName("Valida soma correta com passos corretos")
    void validaSomaCorretaComPassosCorretos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-1", Operacao.SOMA, 38, 25, 63, List.of(1, 0), null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(63, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
        assertEquals("Muito bem! Você acertou em cheio!", resposta.getMensagem());
    }

    @Test
    @DisplayName("Valida soma difícil de quatro dígitos com reservas encadeadas")
    void validaSomaDificilComReservasEncadeadas() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-soma-dificil", Operacao.SOMA, 4978, 2354, 7332,
                List.of(1, 1, 1, 0), null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(7332, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida subtração correta com passos corretos")
    void validaSubtracaoCorretaComPassosCorretos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-2", Operacao.SUBTRACAO, 52, 37, 15, null, List.of(1, 0), null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(15, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Valida subtração difícil de quatro dígitos com empréstimos encadeados")
    void validaSubtracaoDificilComEmprestimosEncadeados() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-subtracao-dificil", Operacao.SUBTRACAO, 5321, 1478, 3843,
                null, List.of(1, 1, 1, 0), null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(3843, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial na subtração difícil quando faltam empréstimos")
    void validaSubtracaoDificilComEmprestimosIncompletos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-subtracao-dificil-parcial", Operacao.SUBTRACAO, 5321, 1478, 3843,
                null, List.of(1, 0, 0, 0), null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("empréstimo"));
    }

    @Test
    @DisplayName("Aceita validação apenas do resultado quando os passos não são enviados")
    void validaSomenteResultadoQuandoPassosSaoNulos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-3", Operacao.SOMA, 38, 25, 63, null, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o resultado está certo mas os passos estão errados")
    void validaResultadoCertoComPassosErrados() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-4", Operacao.SOMA, 38, 25, 63, List.of(0, 0), null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(63, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("passos"));
    }

    @Test
    @DisplayName("Zera os pontos quando o resultado está errado")
    void validaResultadoErrado() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-5", Operacao.SOMA, 38, 25, 60, List.of(1, 0), null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(63, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("63"));
    }

    @Test
    @DisplayName("Esgota as tentativas e lança erro quando o sorteio nunca gera questão válida")
    void lancaErroAoEsgotarTentativasDeGeracao() {
        JogoService servico = new JogoService(new Random() {
            @Override
            public int nextInt(int bound) {
                return 0;
            }
        });

        assertThrows(IllegalStateException.class,
                () -> servico.gerarQuestao(Operacao.SOMA, Dificuldade.FACIL));
        assertThrows(IllegalStateException.class,
                () -> servico.gerarQuestao(Operacao.SUBTRACAO, Dificuldade.FACIL));
        assertThrows(IllegalStateException.class,
                () -> servico.gerarQuestao(Operacao.DIVISAO, Dificuldade.FACIL));
        assertThrows(IllegalStateException.class,
                () -> servico.gerarQuestao(Operacao.DIVISAO, Dificuldade.MEDIO));
    }

    @Test
    @DisplayName("Gera multiplicação média com o menor sorteio e calcula os passos")
    void geraMultiplicacaoMediaComSorteioMinimo() {
        JogoService servico = new JogoService(new Random() {
            @Override
            public int nextInt(int bound) {
                return 0;
            }
        });

        QuestaoDTO questao = servico.gerarQuestao(Operacao.MULTIPLICACAO, Dificuldade.MEDIO);

        assertEquals(10, questao.getNumeroA());
        assertEquals(1, questao.getNumeroB());
        assertEquals(0, questao.getVaiUm());
        assertEquals(10, questao.getResultadoParcial());
    }

    @Test
    @DisplayName("Gera divisões decimais nos três níveis com equivalência inteira exata")
    void geraDivisoesDecimaisComEquivalentesInteiros() {
        for (Dificuldade dificuldade : Dificuldade.values()) {
            for (int i = 0; i < 200; i++) {
                QuestaoDTO questao = jogoService.gerarQuestao(
                        Operacao.DIVISAO, dificuldade, TipoNumero.DECIMAIS);

                assertEquals(Operacao.DIVISAO, questao.getOperacao());
                assertEquals(dificuldade, questao.getDificuldade());
                assertEquals(TipoNumero.DECIMAIS, questao.getTipoNumero());
                assertTrue(questao.getCasasDecimaisA() >= 1 && questao.getCasasDecimaisA() <= 2);
                assertTrue(questao.getCasasDecimaisB() >= 1 && questao.getCasasDecimaisB() <= 2);
                assertTrue(questao.getDividendoEquivalente() != null);
                assertTrue(questao.getDivisorEquivalente() != null);
                assertTrue(questao.getDivisorEquivalente() > 0);

                int alvo = Math.max(questao.getCasasDecimaisA(), questao.getCasasDecimaisB());
                int dividendoEsperado = questao.getNumeroA()
                        * (int) Math.pow(10, alvo - questao.getCasasDecimaisA());
                int divisorEsperado = questao.getNumeroB()
                        * (int) Math.pow(10, alvo - questao.getCasasDecimaisB());

                assertEquals(dividendoEsperado, questao.getDividendoEquivalente());
                assertEquals(divisorEsperado, questao.getDivisorEquivalente());
                assertEquals(dividendoEsperado / divisorEsperado, questao.getQuociente());
                assertEquals(0, dividendoEsperado % divisorEsperado);
            }
        }
    }

    @Test
    @DisplayName("Valida as etapas geradas para a divisão decimal em cada nível")
    void validaEtapasGeradasDaDivisaoDecimal() {
        for (Dificuldade dificuldade : Dificuldade.values()) {
            QuestaoDTO questao = jogoService.gerarQuestao(
                    Operacao.DIVISAO, dificuldade, TipoNumero.DECIMAIS);
            RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                    "id-etapas-decimais-" + dificuldade,
                    Operacao.DIVISAO,
                    questao.getNumeroA(),
                    questao.getNumeroB(),
                    questao.getQuociente(),
                    null,
                    null,
                    null);
            requisicao.setTipoNumero(TipoNumero.DECIMAIS);
            requisicao.setCasasDecimais(Math.max(
                    questao.getCasasDecimaisA(), questao.getCasasDecimaisB()));
            requisicao.setDividendoEquivalente(questao.getDividendoEquivalente());
            requisicao.setDivisorEquivalente(questao.getDivisorEquivalente());

            if (questao.getEtapas() == null) {
                requisicao.setSubtracaoDigitada(questao.getSubtracaoIntermediaria());
                requisicao.setRestoDigitado(questao.getResto());
            } else {
                requisicao.setQuocientesParciaisDigitados(
                        questao.getEtapas().stream().map(EtapaDivisaoDTO::getQuociente).toList());
                requisicao.setSubtracoesParciaisDigitadas(
                        questao.getEtapas().stream().map(EtapaDivisaoDTO::getSubtracao).toList());
                requisicao.setRestosParciaisDigitados(
                        questao.getEtapas().stream().map(EtapaDivisaoDTO::getResto).toList());
                requisicao.setRestoDigitado(
                        questao.getEtapas().get(questao.getEtapas().size() - 1).getResto());
            }

            RespostaValidacaoDTO resposta = jogoService.validar(requisicao);
            assertTrue(resposta.isCorreto(), "Etapas inválidas em " + dificuldade);
        }
    }

    @Test
    @DisplayName("Valida divisão decimal usando os números inteiros equivalentes")
    void validaDivisaoDecimalComEquivalentes() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-decimal", Operacao.DIVISAO, 125, 5, 25,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(1);
        requisicao.setDividendoEquivalente(125);
        requisicao.setDivisorEquivalente(5);
        requisicao.setSubtracaoDigitada(125);
        requisicao.setRestoDigitado(0);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(25, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Não formata o quociente da divisão decimal com vírgula")
    void naoFormataQuocienteDivisaoDecimalComVirgula() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-decimal-errada", Operacao.DIVISAO, 125, 5, 24,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(1);
        requisicao.setDividendoEquivalente(125);
        requisicao.setDivisorEquivalente(5);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(25, resposta.getRespostaCorreta());
        assertTrue(resposta.getMensagem().contains("25"));
        assertFalse(resposta.getMensagem().contains("2,5"));
    }

    @Test
    @DisplayName("Rejeita divisão decimal sem os números equivalentes")
    void rejeitaDivisaoDecimalSemEquivalentes() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-div-decimal-sem-equivalente", Operacao.DIVISAO, 125, 5, 25,
                null, null, null);
        requisicao.setTipoNumero(TipoNumero.DECIMAIS);
        requisicao.setCasasDecimais(1);

        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(requisicao));
    }

    @Test
    @DisplayName("Gera somas de frações próprias com denominadores iguais")
    void geraSomaDeFracoesProprias() {
        Set<Integer> denominadores = new HashSet<>();

        for (int i = 0; i < 300; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(
                    Operacao.SOMA, Dificuldade.FACIL, TipoNumero.FRACOES);

            assertEquals(Operacao.SOMA, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertEquals(TipoNumero.FRACOES, questao.getTipoNumero());
            assertTrue(questao.getDenominador() >= 3 && questao.getDenominador() <= 10);
            assertTrue(questao.getNumeroA() >= 1);
            assertTrue(questao.getNumeroB() >= 1);
            assertTrue(questao.getNumeroA() < questao.getDenominador());
            assertTrue(questao.getNumeroB() < questao.getDenominador());
            assertTrue(questao.getNumeroA() + questao.getNumeroB()
                    < questao.getDenominador());
            denominadores.add(questao.getDenominador());
        }

        assertTrue(denominadores.size() > 1);
    }

    @Test
    @DisplayName("Restringe frações ao nível fácil e à adição")
    void rejeitaFracoesForaDoNivelFacilOuDeOutraOperacao() {
        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.SOMA, Dificuldade.MEDIO, TipoNumero.FRACOES));
        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.SOMA, Dificuldade.DIFICIL, TipoNumero.FRACOES));
        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.SUBTRACAO, Dificuldade.FACIL, TipoNumero.FRACOES));
        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.MULTIPLICACAO, Dificuldade.FACIL, TipoNumero.FRACOES));
        assertThrows(IllegalArgumentException.class, () -> jogoService.gerarQuestao(
                Operacao.DIVISAO, Dificuldade.FACIL, TipoNumero.FRACOES));
    }

    @Test
    @DisplayName("Valida soma de frações com numerador e denominador corretos")
    void validaSomaDeFracoesCorreta() {
        RespostaValidacaoDTO resposta = jogoService.validar(
                requisicaoFracao(1, 3, 4, 6, 6));

        assertTrue(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
        assertEquals(4, resposta.getRespostaCorreta());
        assertEquals("4/6", resposta.getRespostaCorretaFracao());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o denominador da fração está errado")
    void daAcertoParcialQuandoDenominadorDaFracaoEstaErrado() {
        RespostaValidacaoDTO resposta = jogoService.validar(
                requisicaoFracao(1, 3, 4, 6, 5));

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_PARCIAL, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("denominador"));
        assertEquals("4/6", resposta.getRespostaCorretaFracao());
    }

    @Test
    @DisplayName("Zera os pontos quando o numerador da fração está errado")
    void zeraPontosQuandoNumeradorDaFracaoEstaErrado() {
        RespostaValidacaoDTO resposta = jogoService.validar(
                requisicaoFracao(1, 3, 3, 6, 6));

        assertFalse(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("4/6"));
    }

    @Test
    @DisplayName("Rejeita fração sem denominadores válidos")
    void rejeitaFracaoSemDenominadoresValidos() {
        RequisicaoValidacaoDTO semDenominador = requisicaoFracao(1, 3, 4, 6, 6);
        semDenominador.setDenominador(null);
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(semDenominador));

        RequisicaoValidacaoDTO semDenominadorResultado = requisicaoFracao(1, 3, 4, 6, 6);
        semDenominadorResultado.setDenominadorResultado(null);
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(semDenominadorResultado));

        RequisicaoValidacaoDTO denominadorInvalido = requisicaoFracao(1, 3, 4, 6, 0);
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(denominadorInvalido));
    }

    @Test
    @DisplayName("Rejeita denominadores quando o tipo de número não é frações")
    void rejeitaDenominadoresSemTipoFracao() {
        RequisicaoValidacaoDTO requisicao = requisicaoFracao(1, 3, 4, 6, 6);
        requisicao.setTipoNumero(TipoNumero.INTEIROS);

        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(requisicao));
    }

    @Test
    @DisplayName("Rejeita fração fora da adição")
    void rejeitaFracaoEmOutraOperacao() {
        RequisicaoValidacaoDTO requisicao = requisicaoFracao(1, 3, 4, 6, 6);
        requisicao.setOperacao(Operacao.SUBTRACAO);

        assertThrows(IllegalArgumentException.class,
                () -> jogoService.validar(requisicao));
    }

    private RequisicaoValidacaoDTO requisicaoFracao(
            int numeradorA,
            int numeradorB,
            int numeradorResultado,
            int denominador,
            int denominadorResultado) {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-fracao",
                Operacao.SOMA,
                numeradorA,
                numeradorB,
                numeradorResultado,
                null,
                null,
                null);
        requisicao.setTipoNumero(TipoNumero.FRACOES);
        requisicao.setDenominador(denominador);
        requisicao.setDenominadorResultado(denominadorResultado);
        return requisicao;
    }

    @Test
    @DisplayName("Rejeita requisição de validação nula ou com campos obrigatórios ausentes")
    void rejeitaRequisicaoInvalida() {
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(null));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", null, 10, 5, 15, null, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, null, 5, 15, null, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, 10, null, 15, null, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, 10, 5, null, null, null, null)));
    }
}
