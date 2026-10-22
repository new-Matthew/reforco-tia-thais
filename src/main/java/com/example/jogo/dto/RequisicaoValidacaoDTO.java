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
    private Integer vaiUmMultiplicacao;
    private Integer subtracaoDigitada;
    private Integer restoDigitado;
    private Integer quocienteParcialDigitado;
    private Integer subtracaoParcialDigitada;
    private Integer restoParcialDigitado;
    private Integer quocienteFinalDigitado;
    private Integer subtracaoFinalDigitada;

    public RequisicaoValidacaoDTO(
            String idQuestao,
            Operacao operacao,
            Integer numeroA,
            Integer numeroB,
            Integer resultadoDigitado,
            List<Integer> vaiUm,
            List<Integer> emprestados,
            Integer vaiUmMultiplicacao) {
        this(idQuestao, operacao, numeroA, numeroB, resultadoDigitado, vaiUm, emprestados,
                vaiUmMultiplicacao, null, null);
    }

    public RequisicaoValidacaoDTO(
            String idQuestao,
            Operacao operacao,
            Integer numeroA,
            Integer numeroB,
            Integer resultadoDigitado,
            List<Integer> vaiUm,
            List<Integer> emprestados,
            Integer vaiUmMultiplicacao,
            Integer subtracaoDigitada,
            Integer restoDigitado) {
        this(idQuestao, operacao, numeroA, numeroB, resultadoDigitado, vaiUm, emprestados,
                vaiUmMultiplicacao, subtracaoDigitada, restoDigitado, null, null, null, null, null);
    }
}
