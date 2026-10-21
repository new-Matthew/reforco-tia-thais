package com.example.jogo.service;

import com.example.jogo.dto.QuestaoDTO;
import com.example.jogo.dto.RequisicaoValidacaoDTO;
import com.example.jogo.dto.RespostaValidacaoDTO;
import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    @DisplayName("Gera multiplicações fáceis com um dígito em cada fator")
    void geraMultiplicacaoFacilComUmDigito() {
        for (int i = 0; i < 200; i++) {
            QuestaoDTO questao = jogoService.gerarQuestao(Operacao.MULTIPLICACAO, Dificuldade.FACIL);

            assertEquals(Operacao.MULTIPLICACAO, questao.getOperacao());
            assertEquals(Dificuldade.FACIL, questao.getDificuldade());
            assertTrue(questao.getNumeroA() >= 1 && questao.getNumeroA() <= 9);
            assertTrue(questao.getNumeroB() >= 1 && questao.getNumeroB() <= 9);
            assertTrue(questao.getId() != null && !questao.getId().isBlank());
        }
    }

    @Test
    @DisplayName("Rejeita multiplicação fora do nível fácil")
    void rejeitaMultiplicacaoNoNivelMedio() {
        assertThrows(IllegalArgumentException.class,
                () -> jogoService.gerarQuestao(Operacao.MULTIPLICACAO, Dificuldade.MEDIO));
    }

    @Test
    @DisplayName("Valida multiplicação correta sem exigir passos intermediários")
    void validaMultiplicacaoCorreta() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult", Operacao.MULTIPLICACAO, 7, 8, 56, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(56, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Zera os pontos quando o resultado da multiplicação está errado")
    void validaMultiplicacaoErrada() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-mult-errada", Operacao.MULTIPLICACAO, 7, 8, 54, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(56, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("56"));
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
                "id-1", Operacao.SOMA, 38, 25, 63, List.of(1, 0), null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(63, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
        assertEquals("Muito bem! Você acertou em cheio!", resposta.getMensagem());
    }

    @Test
    @DisplayName("Valida subtração correta com passos corretos")
    void validaSubtracaoCorretaComPassosCorretos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-2", Operacao.SUBTRACAO, 52, 37, 15, null, List.of(1, 0));

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(15, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Aceita validação apenas do resultado quando os passos não são enviados")
    void validaSomenteResultadoQuandoPassosSaoNulos() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-3", Operacao.SOMA, 38, 25, 63, null, null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertTrue(resposta.isCorreto());
        assertEquals(JogoService.PONTOS_ACERTO_COMPLETO, resposta.getPontosGanhos());
    }

    @Test
    @DisplayName("Dá acerto parcial quando o resultado está certo mas os passos estão errados")
    void validaResultadoCertoComPassosErrados() {
        RequisicaoValidacaoDTO requisicao = new RequisicaoValidacaoDTO(
                "id-4", Operacao.SOMA, 38, 25, 63, List.of(0, 0), null);

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
                "id-5", Operacao.SOMA, 38, 25, 60, List.of(1, 0), null);

        RespostaValidacaoDTO resposta = jogoService.validar(requisicao);

        assertFalse(resposta.isCorreto());
        assertEquals(63, resposta.getRespostaCorreta());
        assertEquals(JogoService.PONTOS_ERRO, resposta.getPontosGanhos());
        assertTrue(resposta.getMensagem().contains("63"));
    }

    @Test
    @DisplayName("Rejeita requisição de validação nula ou com campos obrigatórios ausentes")
    void rejeitaRequisicaoInvalida() {
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(null));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", null, 10, 5, 15, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, null, 5, 15, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, 10, null, 15, null, null)));
        assertThrows(IllegalArgumentException.class, () -> jogoService.validar(
                new RequisicaoValidacaoDTO("id", Operacao.SOMA, 10, 5, null, null, null)));
    }
}
