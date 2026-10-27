package com.example.jogo.controller;

import com.example.jogo.dto.QuestaoDTO;
import com.example.jogo.dto.RequisicaoValidacaoDTO;
import com.example.jogo.dto.RespostaValidacaoDTO;
import com.example.jogo.enums.Dificuldade;
import com.example.jogo.enums.Operacao;
import com.example.jogo.enums.TipoNumero;
import com.example.jogo.service.JogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/jogo")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class JogoController {

    private final JogoService jogoService;

    @GetMapping("/proxima-questao")
    public QuestaoDTO proximaQuestao(
            @RequestParam Operacao operacao,
            @RequestParam Dificuldade dificuldade,
            @RequestParam(defaultValue = "INTEIROS") TipoNumero tipoNumero) {
        return jogoService.gerarQuestao(operacao, dificuldade, tipoNumero);
    }

    @PostMapping("/validar")
    public RespostaValidacaoDTO validar(@RequestBody RequisicaoValidacaoDTO requisicao) {
        return jogoService.validar(requisicao);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarRequisicaoInvalida(IllegalArgumentException excecao) {
        return Map.of("erro", excecao.getMessage());
    }
}
