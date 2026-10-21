package com.example.jogo.dto;

import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestaoDTO {

    private String id;
    private Operacao operacao;
    private Dificuldade dificuldade;
    private int numeroA;
    private int numeroB;
    private Integer vaiUm;
    private Integer resultadoParcial;
}
