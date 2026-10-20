package com.example.jogo.dto;

import com.example.jogo.enums.Operacao;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequisicaoValidacaoDTO {

    private String idQuestao;
    private Operacao operacao;
    private Integer numeroA;
    private Integer numeroB;
    private Integer resultadoDigitado;
    private List<Integer> vaiUm;
    private List<Integer> emprestados;
}
