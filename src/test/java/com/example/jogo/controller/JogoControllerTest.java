package com.example.jogo.controller;

import com.example.jogo.config.CorsConfig;
import com.example.jogo.service.JogoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = JogoController.class)
@Import({JogoService.class, CorsConfig.class})
class JogoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Retorna uma questão de soma no endpoint de próxima questão")
    void retornaQuestaoDeSoma() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SOMA")
                        .param("dificuldade", "FACIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.operacao").value("SOMA"))
                .andExpect(jsonPath("$.dificuldade").value("FACIL"))
                .andExpect(jsonPath("$.numeroA").isNumber())
                .andExpect(jsonPath("$.numeroB").isNumber())
                .andExpect(jsonPath("$.respostaCorreta").doesNotExist());
    }

    @Test
    @DisplayName("Retorna uma questão de subtração no endpoint de próxima questão")
    void retornaQuestaoDeSubtracao() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SUBTRACAO")
                        .param("dificuldade", "MEDIO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("SUBTRACAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"));
    }

    @Test
    @DisplayName("Retorna uma questão de multiplicação no endpoint de próxima questão")
    void retornaQuestaoDeMultiplicacao() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "MULTIPLICACAO")
                        .param("dificuldade", "FACIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("MULTIPLICACAO"))
                .andExpect(jsonPath("$.dificuldade").value("FACIL"));
    }

    @Test
    @DisplayName("Retorna os passos da multiplicação média no endpoint de próxima questão")
    void retornaQuestaoDeMultiplicacaoMedia() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "MULTIPLICACAO")
                        .param("dificuldade", "MEDIO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("MULTIPLICACAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.vaiUm").isNumber())
                .andExpect(jsonPath("$.resultadoParcial").isNumber());
    }

    @Test
    @DisplayName("Retorna uma soma difícil no endpoint de próxima questão")
    void retornaQuestaoDeSomaDificil() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SOMA")
                        .param("dificuldade", "DIFICIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("SOMA"))
                .andExpect(jsonPath("$.dificuldade").value("DIFICIL"));
    }

    @Test
    @DisplayName("Retorna uma soma decimal com as casas decimais das parcelas")
    void retornaQuestaoDeSomaDecimal() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SOMA")
                        .param("dificuldade", "MEDIO")
                        .param("tipoNumero", "DECIMAIS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("SOMA"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.tipoNumero").value("DECIMAIS"))
                .andExpect(jsonPath("$.casasDecimaisA").isNumber())
                .andExpect(jsonPath("$.casasDecimaisB").isNumber());
    }

    @Test
    @DisplayName("Retorna uma subtração decimal com as casas decimais dos operandos")
    void retornaQuestaoDeSubtracaoDecimal() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SUBTRACAO")
                        .param("dificuldade", "MEDIO")
                        .param("tipoNumero", "DECIMAIS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("SUBTRACAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.tipoNumero").value("DECIMAIS"))
                .andExpect(jsonPath("$.casasDecimaisA").isNumber())
                .andExpect(jsonPath("$.casasDecimaisB").isNumber());
    }

    @Test
    @DisplayName("Retorna uma multiplicação decimal com as casas dos fatores")
    void retornaQuestaoDeMultiplicacaoDecimal() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "MULTIPLICACAO")
                        .param("dificuldade", "MEDIO")
                        .param("tipoNumero", "DECIMAIS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("MULTIPLICACAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.tipoNumero").value("DECIMAIS"))
                .andExpect(jsonPath("$.casasDecimaisA").isNumber())
                .andExpect(jsonPath("$.casasDecimaisB").value(1));
    }

    @Test
    @DisplayName("Retorna uma divisão decimal com casas e equivalentes inteiros")
    void retornaQuestaoDeDivisaoDecimal() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "DIVISAO")
                        .param("dificuldade", "MEDIO")
                        .param("tipoNumero", "DECIMAIS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("DIVISAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.tipoNumero").value("DECIMAIS"))
                .andExpect(jsonPath("$.casasDecimaisA").isNumber())
                .andExpect(jsonPath("$.casasDecimaisB").isNumber())
                .andExpect(jsonPath("$.dividendoEquivalente").isNumber())
                .andExpect(jsonPath("$.divisorEquivalente").isNumber());
    }

    @Test
    @DisplayName("Valida uma soma decimal pela API")
    void validaSomaDecimal() throws Exception {
        String corpo = """
                {
                  "operacao": "SOMA",
                  "numeroA": 1275,
                  "numeroB": 348,
                  "resultadoDigitado": 1623,
                  "vaiUm": [1, 1, 0, 0],
                  "tipoNumero": "DECIMAIS",
                  "casasDecimais": 2
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(1623));
    }

    @Test
    @DisplayName("Valida uma subtração decimal pela API")
    void validaSubtracaoDecimal() throws Exception {
        String corpo = """
                {
                  "operacao": "SUBTRACAO",
                  "numeroA": 1275,
                  "numeroB": 348,
                  "resultadoDigitado": 927,
                  "emprestados": [1, 0, 1, 0],
                  "tipoNumero": "DECIMAIS",
                  "casasDecimais": 2
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(927));
    }

    @Test
    @DisplayName("Valida uma multiplicação decimal com a posição da vírgula")
    void validaMultiplicacaoDecimal() throws Exception {
        String corpo = """
                {
                  "operacao": "MULTIPLICACAO",
                  "numeroA": 25,
                  "numeroB": 34,
                  "resultadoDigitado": 850,
                  "tipoNumero": "DECIMAIS",
                  "casasDecimais": 2,
                  "casasDecimaisResultado": 2
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(850));
    }

    @Test
    @DisplayName("Valida uma divisão decimal pelos números inteiros equivalentes")
    void validaDivisaoDecimal() throws Exception {
        String corpo = """
                {
                  "operacao": "DIVISAO",
                  "numeroA": 125,
                  "numeroB": 5,
                  "resultadoDigitado": 25,
                  "tipoNumero": "DECIMAIS",
                  "casasDecimais": 1,
                  "dividendoEquivalente": 125,
                  "divisorEquivalente": 5,
                  "subtracaoDigitada": 125,
                  "restoDigitado": 0
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(25));
    }

    @Test
    @DisplayName("Retorna uma soma de frações fácil no endpoint de próxima questão")
    void retornaQuestaoDeFracoes() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "FRACOES")
                        .param("dificuldade", "FACIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("FRACOES"))
                .andExpect(jsonPath("$.dificuldade").value("FACIL"))
                .andExpect(jsonPath("$.denominador").isNumber())
                .andExpect(jsonPath("$.numeroA").isNumber())
                .andExpect(jsonPath("$.numeroB").isNumber())
                .andExpect(jsonPath("$.respostaCorreta").doesNotExist());
    }

    @Test
    @DisplayName("Rejeita frações fora do nível fácil")
    void rejeitaFracoesForaDoNivelFacil() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "FRACOES")
                        .param("dificuldade", "MEDIO"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Valida a soma de frações e retorna a fração correta")
    void validaSomaDeFracoes() throws Exception {
        String corpo = """
                {
                  "operacao": "FRACOES",
                  "numeroA": 1,
                  "numeroB": 3,
                  "resultadoDigitado": 4,
                  "denominador": 6,
                  "denominadorResultado": 6
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(4))
                .andExpect(jsonPath("$.respostaCorretaFracao").value("4/6"));
    }

    @Test
    @DisplayName("Retorna uma subtração difícil no endpoint de próxima questão")
    void retornaQuestaoDeSubtracaoDificil() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "SUBTRACAO")
                        .param("dificuldade", "DIFICIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("SUBTRACAO"))
                .andExpect(jsonPath("$.dificuldade").value("DIFICIL"));
    }

    @Test
    @DisplayName("Retorna uma multiplicação difícil no endpoint de próxima questão")
    void retornaQuestaoDeMultiplicacaoDificil() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "MULTIPLICACAO")
                        .param("dificuldade", "DIFICIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("MULTIPLICACAO"))
                .andExpect(jsonPath("$.dificuldade").value("DIFICIL"));
    }

    @Test
    @DisplayName("Retorna uma divisão difícil com etapas no endpoint de próxima questão")
    void retornaQuestaoDeDivisaoDificil() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "DIVISAO")
                        .param("dificuldade", "DIFICIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("DIVISAO"))
                .andExpect(jsonPath("$.dificuldade").value("DIFICIL"))
                .andExpect(jsonPath("$.quociente").isNumber())
                .andExpect(jsonPath("$.resto").isNumber())
                .andExpect(jsonPath("$.etapas").isArray())
                .andExpect(jsonPath("$.etapas[0].indice").value(1))
                .andExpect(jsonPath("$.etapas[0].dividendoParcial").isNumber())
                .andExpect(jsonPath("$.etapas[0].quociente").isNumber())
                .andExpect(jsonPath("$.etapas[0].subtracao").isNumber())
                .andExpect(jsonPath("$.etapas[0].resto").isNumber())
                .andExpect(jsonPath("$.etapas[0].dividendoAbaixado").isNumber())
                .andExpect(jsonPath("$.subtracaoIntermediaria").doesNotExist());
    }

    @Test
    @DisplayName("Retorna uma questão de divisão fácil no endpoint de próxima questão")
    void retornaQuestaoDeDivisao() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "DIVISAO")
                        .param("dificuldade", "FACIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("DIVISAO"))
                .andExpect(jsonPath("$.dificuldade").value("FACIL"))
                .andExpect(jsonPath("$.quociente").isNumber())
                .andExpect(jsonPath("$.subtracaoIntermediaria").isNumber())
                .andExpect(jsonPath("$.resto").value(0));
    }

    @Test
    @DisplayName("Retorna uma questão de divisão média longa no endpoint de próxima questão")
    void retornaQuestaoDeDivisaoMedia() throws Exception {
        mockMvc.perform(get("/api/jogo/proxima-questao")
                        .param("operacao", "DIVISAO")
                        .param("dificuldade", "MEDIO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operacao").value("DIVISAO"))
                .andExpect(jsonPath("$.dificuldade").value("MEDIO"))
                .andExpect(jsonPath("$.quociente").isNumber())
                .andExpect(jsonPath("$.resto").isNumber())
                .andExpect(jsonPath("$.dividendoParcial").isNumber())
                .andExpect(jsonPath("$.quocienteParcial").isNumber())
                .andExpect(jsonPath("$.subtracaoParcial").isNumber())
                .andExpect(jsonPath("$.restoParcial").isNumber())
                .andExpect(jsonPath("$.dividendoAbaixado").isNumber())
                .andExpect(jsonPath("$.quocienteFinal").isNumber())
                .andExpect(jsonPath("$.subtracaoFinal").isNumber())
                .andExpect(jsonPath("$.subtracaoIntermediaria").doesNotExist());
    }

    @Test
    @DisplayName("Valida os empréstimos e o resultado da subtração difícil")
    void validaSubtracaoDificil() throws Exception {
        String corpo = """
                {
                  "operacao": "SUBTRACAO",
                  "numeroA": 5321,
                  "numeroB": 1478,
                  "resultadoDigitado": 3843,
                  "emprestados": [1, 1, 1, 0]
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(3843));
    }

    @Test
    @DisplayName("Valida os passos e o quociente da divisão")
    void validaDivisao() throws Exception {
        String corpo = """
                {
                  "operacao": "DIVISAO",
                  "numeroA": 36,
                  "numeroB": 4,
                  "resultadoDigitado": 9,
                  "subtracaoDigitada": 36,
                  "restoDigitado": 0
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(9));
    }

    @Test
    @DisplayName("Valida as etapas e o quociente da divisão média longa")
    void validaDivisaoMedia() throws Exception {
        String corpo = """
                {
                  "operacao": "DIVISAO",
                  "numeroA": 793,
                  "numeroB": 17,
                  "resultadoDigitado": 46,
                  "quocienteParcialDigitado": 4,
                  "subtracaoParcialDigitada": 68,
                  "restoParcialDigitado": 11,
                  "quocienteFinalDigitado": 6,
                  "subtracaoFinalDigitada": 102,
                  "restoDigitado": 11
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(46));
    }

    @Test
    @DisplayName("Valida os passos e o resultado da multiplicação média")
    void validaMultiplicacaoMedia() throws Exception {
        String corpo = """
                {
                  "operacao": "MULTIPLICACAO",
                  "numeroA": 35,
                  "numeroB": 3,
                  "resultadoDigitado": 105,
                  "vaiUmMultiplicacao": 1
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(105));
    }

    @Test
    @DisplayName("Valida multiplicação média com transporte maior que um")
    void validaMultiplicacaoMediaComVaiUmMaiorQueUm() throws Exception {
        String corpo = """
                {
                  "operacao": "MULTIPLICACAO",
                  "numeroA": 98,
                  "numeroB": 9,
                  "resultadoDigitado": 882,
                  "vaiUmMultiplicacao": 7
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(882));
    }

    @Test
    @DisplayName("Valida uma resposta correta pelo endpoint de validação")
    void validaRespostaCorreta() throws Exception {
        String corpo = """
                {
                  "idQuestao": "id-1",
                  "operacao": "SOMA",
                  "numeroA": 38,
                  "numeroB": 25,
                  "resultadoDigitado": 63,
                  "vaiUm": [1, 0]
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correto").value(true))
                .andExpect(jsonPath("$.pontosGanhos").value(10))
                .andExpect(jsonPath("$.respostaCorreta").value(63));
    }

    @Test
    @DisplayName("Retorna 400 quando a requisição de validação está incompleta")
    void retornaErroParaRequisicaoIncompleta() throws Exception {
        String corpo = """
                {
                  "operacao": "SOMA",
                  "numeroA": 38
                }
                """;

        mockMvc.perform(post("/api/jogo/validar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").isNotEmpty());
    }

    @Test
    @DisplayName("Libera CORS para o frontend")
    void liberaCorsParaFrontend() throws Exception {
        mockMvc.perform(options("/api/jogo/proxima-questao")
                        .header(HttpHeaders.ORIGIN, "https://exemplo.github.io")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "*"));
    }
}
