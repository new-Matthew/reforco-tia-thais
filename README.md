# Reforço Escolar — Tia Thaís

Jogo educativo de adição e subtração para crianças, com lousa interativa, correção automática, progressão de nível e contato comercial via WhatsApp.

## Funcionalidades

- Contas de adição e subtração nos níveis fácil (2 dígitos) e médio (3 dígitos).
- Multiplicação no nível fácil (1 dígito por 1 dígito).
- Preenchimento dos passos de "vai um" e empréstimo.
- Correção automática das respostas pela API.
- Placar, sequência de acertos e barra de progresso.
- Subida automática de nível após cinco acertos seguidos.
- Interface responsiva com a identidade visual da marca.

## Tecnologias

- Java 17
- Spring Boot 3.4.4
- Maven
- HTML, CSS e JavaScript puro
- JUnit 5 e Node.js Test Runner

## Como executar

```bash
./mvnw spring-boot:run
```

Acesse: http://localhost:8080

Para gerar e executar o pacote:

```bash
./mvnw clean package
java -jar target/jogo-matematica-1.0.0.jar
```

## Testes

Backend:

```bash
./mvnw test
```

Frontend:

```bash
node --test src/test/js/app.test.js
```

## Estrutura

- `src/main/java`: API REST e regras do jogo.
- `src/main/resources/static`: interface do jogo.
- `src/test/java`: testes do backend.
- `src/test/js`: testes das funções do frontend.
