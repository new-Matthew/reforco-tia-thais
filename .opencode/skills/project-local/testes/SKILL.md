---
name: testes
description: Require automated unit tests for every new or modified function, method, class, or feature, validate changes by running the project's test suite, and prevent recurring failures by documenting lessons learned.
---

# WORKFLOW DE TESTES UNITÁRIOS AUTOMATIZADOS

Sempre que criar ou modificar uma função, método, classe ou funcionalidade, siga obrigatoriamente este workflow. Não considere a tarefa concluída antes de validar as alterações e registrar as lições relevantes.

## 1. Criação Obrigatória de Testes

- Crie ou atualize os testes unitários correspondentes a cada comportamento novo ou alterado.
- Mantenha os testes na estrutura de diretórios de testes do projeto, respeitando as convenções e ferramentas já utilizadas.
- Cubra os cenários principais de sucesso (*happy path*), entradas inválidas, limites relevantes e erros ou exceções esperados.
- Inclua testes de regressão para corrigir falhas existentes e impedir que voltem a ocorrer.
- Não crie testes redundantes sem justificativa; priorize testes determinísticos, independentes e com verificações explícitas.

## 2. Convenções e Padrões

- Siga as convenções de nomenclatura e organização já adotadas no projeto. Exemplo: `Calculadora.java` → `CalculadoraTest.java`.
- Estruture os testes usando **Given-When-Then** ou **Arrange-Act-Assert**, mantendo clara a preparação, a execução e a verificação.
- Utilize o framework de testes existente no projeto. Não introduza dependências ou frameworks novos sem necessidade.
- Evite testes que dependam de ordem de execução, estado compartilhado ou serviços externos não controlados.

## 3. Execução e Validação

- Identifique o sistema de build e o comando de testes apropriado ao projeto. Exemplos: `./mvnw test`, `mvn test` ou `gradle test`.
- Execute os testes após implementar as alterações e novamente após corrigir eventuais falhas.
- Analise as causas das falhas; não ignore erros, não desative testes para obter aprovação e não altere as verificações apenas para fazê-las passar.
- Execute também os testes de integração ou outras verificações exigidas pelo projeto, quando aplicável.
- Não declare a tarefa concluída enquanto houver testes relevantes falhando ou verificações obrigatórias pendentes. Se a execução estiver bloqueada pelo ambiente, informe explicitamente a limitação e o que não foi validado.
- Não afirme que os testes passaram sem ter executado os comandos e confirmado o resultado.

## 4. Lições Aprendidas e Prevenção de Regressões

**Toda falha relevante deve gerar uma ação preventiva.**

- Quando um teste falhar, investigue a causa raiz antes de implementar a correção.
- Se a falha revelar um comportamento incorreto, crie ou atualize um teste de regressão que reproduza o problema e valide a correção.
- Se a falha revelar uma regra, convenção ou procedimento ausente, registre a lição no documento apropriado do projeto, como a documentação técnica correspondente.
- Prefira registrar regras gerais e reutilizáveis, evitando instruções específicas de uma única sessão.
- Antes de concluir, verifique se a correção está coberta por testes e se a lição foi documentada quando necessário.

Princípio obrigatório:transforme falhas em testes automatizados ou regras documentadas. A próxima sessão deve consultar as lições registradas e evitar repetir erros já identificados.

## 5. Relatório Final

Ao concluir a tarefa, informe:

- Alterações implementadas.
- Testes criados ou atualizados.
- Comandos de validação executados.
- Resultado dos testes, incluindo eventuais falhas.
- Lições aprendidas registradas e medidas adotadas para evitar regressões.

Não declare sucesso sem evidências de validação.