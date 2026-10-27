package com.example.jogo.dto;

import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestaoDTO {

    private String id;
    private Operacao operacao;
    private Dificuldade dificuldade;
    private int numeroA;
    private int numeroB;
    private Integer vaiUm;
    private Integer resultadoParcial;
    private Integer quociente;
    private Integer subtracaoIntermediaria;
    private Integer resto;
    private Integer dividendoParcial;
    private Integer quocienteParcial;
    private Integer subtracaoParcial;
    private Integer restoParcial;
    private Integer dividendoAbaixado;
    private Integer quocienteFinal;
    private Integer subtracaoFinal;
    private Integer dividendoAbaixadoFinal;
    private Integer quocienteIntermediario;
    private Integer subtracaoEtapaIntermediaria;
    private Integer restoIntermediario;
    private List<EtapaDivisaoDTO> etapas;
}
