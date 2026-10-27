# Reforço Escolar — Tia Thaís

Jogo educativo de adição, subtração, multiplicação e divisão para crianças, com lousa interativa, correção automática, progressão de nível e contato comercial via WhatsApp.

## Funcionalidades

- Contas de adição nos níveis fácil (2 dígitos), médio (3 dígitos) e difícil (4 dígitos com reservas encadeadas), com seletor de números inteiros ou decimais.
- Somas decimais com vírgula alinhada, zeros de preenchimento e casas de centésimos e décimos em todos os níveis.
- Contas de subtração nos níveis fácil (2 dígitos), médio (3 dígitos) e difícil (4 dígitos com empréstimos encadeados).
- Multiplicação nos níveis fácil (1 dígito por 1 dígito), médio (2 dígitos por 1 dígito) e difícil (3 dígitos por 2 dígitos), com preenchimento do "vai um".
- Dica progressiva nas operações difíceis e nas somas decimais: destaca apenas os números da etapa atual, incluindo colunas decimais, divisor, dividendo parcial, produto e resto na divisão, após 3 segundos de inatividade ou quando a resposta é recusada.
- Divisão em formato de chave nos níveis fácil (2 dígitos por 1 dígito, exata), médio (3 dígitos por 2 dígitos) e difícil (4 dígitos por 2 dígitos), com quociente, subtrações intermediárias, resto e indicação do dígito que desce a cada etapa.
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
node --test src/test/js/*.test.js
```

## Estrutura

- `src/main/java`: API REST e regras do jogo.
- `src/main/resources/static`: interface do jogo.
- `src/test/java`: testes do backend.
- `src/test/js`: testes das funções do frontend.
