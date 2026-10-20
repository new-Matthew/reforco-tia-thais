package com.example.jogo.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DificuldadeTest {

    @Test
    @DisplayName("Define os limites de dois dígitos para a dificuldade fácil")
    void defineLimitesDaDificuldadeFacil() {
        assertEquals(2, Dificuldade.FACIL.getQuantidadeDeDigitos());
        assertEquals(10, Dificuldade.FACIL.getValorMinimo());
        assertEquals(99, Dificuldade.FACIL.getValorMaximo());
    }

    @Test
    @DisplayName("Define os limites de três dígitos para a dificuldade média")
    void defineLimitesDaDificuldadeMedia() {
        assertEquals(3, Dificuldade.MEDIO.getQuantidadeDeDigitos());
        assertEquals(100, Dificuldade.MEDIO.getValorMinimo());
        assertEquals(999, Dificuldade.MEDIO.getValorMaximo());
    }
}
