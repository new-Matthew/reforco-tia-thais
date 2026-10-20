---
name: project-local
description: Garante a criação e execução de testes unitários automatizados para cada nova função, método ou funcionalidade criada neste projeto.
---
<!-- unit-testing-workflow -->

# Workflow de Testes Unitários Automáticos

Sempre que você criar ou alterar qualquer função, método ou classe neste projeto, siga obrigatoriamente as regras abaixo:

## 1. Criação Obrigatória de Testes
- Para **toda nova função/método criado**, crie imediatamente a suite de testes unitários correspondente na pasta de testes (`src/test/...`).
- Cubra os cenários principais de sucesso (*happy path*) e os cenários de erro/exceções (*edge cases*).

## 2. Convenções e Padrões
- Mantenha o arquivo de teste espelhado com a estrutura do arquivo original (ex: `Calculadora.java` -> `CalculadoraTest.java`).
- Siga o padrão **Given-When-Then** (ou **Arrange-Act-Assert**) na escrita das funções de teste.

## 3. Validação Automática
- Após implementar o código e o teste unitário, execute o comando de verificação do projeto (ex: `./mvnw test`, `mvn test` ou `gradle test`).
- Não considere a tarefa concluída até que todos os testes passem com 100% de sucesso no ambiente de verificação.