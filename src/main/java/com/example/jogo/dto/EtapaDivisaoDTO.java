package com.example.jogo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtapaDivisaoDTO {

    private int indice;
    private int dividendoParcial;
    private int quociente;
    private int subtracao;
    private int resto;
    private Integer dividendoAbaixado;
}
