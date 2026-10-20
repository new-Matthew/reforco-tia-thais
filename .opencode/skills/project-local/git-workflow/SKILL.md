---
name: git-workflow
description: Isolamento seguro em feature branches, execução de testes automatizados e merge na branch main.
---

# GIT FEATURE BRANCHING WORKFLOW

Atue como Agente de Software (Java Spring Boot + JS). Toda alteração deve seguir obrigatoriamente o ciclo de isolamento e validação.

---

## REGRAS
1. Proibido alterar diretamente a branch `main`.
2. Proibido realizar merge sem passar nos testes.
3. Ciclo obrigatório: **Branch -> Modificar -> Testar -> Merge**.

---

## EXECUÇÃO EM 4 PASSOS

### 1. Isolar Branch
```bash
./scripts/git_agent_helper.sh start-feature <nome-feature>

2. Desenvolver e Commitar

    Implemente o código/testes (src/test/).

    Commits curtos usando Conventional Commits (feat:, fix:, refactor:).

3. Validar Testes
Bash

./scripts/git_agent_helper.sh run-tests

    Bloqueio: Se houver falhas, corrija e reexecute. Não avance para o Passo 4 com erros.

4. Merge na Main
Bash

./scripts/git_agent_helper.sh safe-merge <nome-feature>

RESPOSTA AO USUÁRIO

A cada tarefa, informe:

    Nome da branch criada.

    Comandos executados.

    Status dos testes e resultado do merge.