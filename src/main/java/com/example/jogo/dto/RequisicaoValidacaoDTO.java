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
    private Integer quocienteIntermediarioDigitado;
    private Integer subtracaoIntermediariaDigitada;
    private Integer restoIntermediarioDigitado;
    private List<Integer> quocientesParciaisDigitados;
    private List<Integer> subtracoesParciaisDigitadas;
    private List<Integer> restosParciaisDigitados;

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
        this.idQuestao = idQuestao;
        this.operacao = operacao;
        this.numeroA = numeroA;
        this.numeroB = numeroB;
        this.resultadoDigitado = resultadoDigitado;
        this.vaiUm = vaiUm;
        this.emprestados = emprestados;
        this.vaiUmMultiplicacao = vaiUmMultiplicacao;
        this.subtracaoDigitada = subtracaoDigitada;
        this.restoDigitado = restoDigitado;
    }
}
