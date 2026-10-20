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
