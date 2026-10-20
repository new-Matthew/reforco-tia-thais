#!/usr/bin/env bash
set -e

ACTION="$1"
BRANCH_NAME="$2"

case "$ACTION" in
  start-feature)
    if [ -z "$BRANCH_NAME" ]; then
      echo "Erro: Nome da branch obrigatório."
      exit 1
    fi
    git checkout main
    git pull origin main --ff-only || true
    git checkout -b "feature/$BRANCH_NAME"
    echo "SUCCESS: Branch 'feature/$BRANCH_NAME' criada e ativa."
    ;;

  run-tests)
    echo "Executando testes da aplicação Java/Spring Boot e JS..."
    ./mvnw clean test
    echo "SUCCESS: Todos os testes passaram com sucesso!"
    ;;

  safe-merge)
    if [ -z "$BRANCH_NAME" ]; then
      echo "Erro: Nome da branch obrigatório para merge."
      exit 1
    fi
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "feature/$BRANCH_NAME" ]; then
      git checkout "feature/$BRANCH_NAME"
    fi
    
    echo "Rodando validação final de testes..."
    ./mvnw clean test
    
    git checkout main
    git pull origin main --ff-only || true
    git merge --no-ff "feature/$BRANCH_NAME" -m "feat(agent): merge automático da feature/$BRANCH_NAME"
    git branch -d "feature/$BRANCH_NAME"
    echo "SUCCESS: Merge realizado na main com sucesso e branch local removida."
    ;;

  *)
    echo "Ação inválida. Use: start-feature, run-tests ou safe-merge."
    exit 1
    ;;
esac
