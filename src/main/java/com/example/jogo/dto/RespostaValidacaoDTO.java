package com.example.jogo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespostaValidacaoDTO {

    private boolean correto;
    private String mensagem;
    private int pontosGanhos;
    private int respostaCorreta;
}
