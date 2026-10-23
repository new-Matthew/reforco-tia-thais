package com.example.jogo.enums;

public enum Dificuldade {
    FACIL(2),
    MEDIO(3),
    DIFICIL(4);

    private final int quantidadeDeDigitos;

    Dificuldade(int quantidadeDeDigitos) {
        this.quantidadeDeDigitos = quantidadeDeDigitos;
    }

    public int getQuantidadeDeDigitos() {
        return quantidadeDeDigitos;
    }

    public int getValorMinimo() {
        return (int) Math.pow(10, quantidadeDeDigitos - 1);
    }

    public int getValorMaximo() {
        return (int) Math.pow(10, quantidadeDeDigitos) - 1;
    }
}
