package com.example.jogo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RespostaValidacaoDTO {

    private boolean correto;
    private String mensagem;
    private int pontosGanhos;
    private int respostaCorreta;
    private String respostaCorretaFracao;

    public RespostaValidacaoDTO(
            boolean correto,
            String mensagem,
            int pontosGanhos,
            int respostaCorreta) {
        this(correto, mensagem, pontosGanhos, respostaCorreta, null);
    }
}
