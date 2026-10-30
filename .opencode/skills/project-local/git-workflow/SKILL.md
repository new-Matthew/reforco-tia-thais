---
name: git-workflow
description: Secure feature branch isolation, automated testing, and clean conventional commits in English merged into main.
---

# GIT FEATURE BRANCHING WORKFLOW

Every change must strictly follow the isolation, validation, and Conventional Commits best practices in English.

## RULES

1. Direct changes or commits on the `main` branch are strictly prohibited.
2. Merging into `main` without passing tests is strictly prohibited.
3. No remote push: The agent must never push changes to the remote repository (git push). All git actions must remain strictly local so the user can review and push manually.
4. Language requirement: All commit messages must be strictly in English.

## EXECUTION STEPS

### 1. Create and Isolate Feature Branch

```bash
git checkout main
git pull origin main --ff-only
git checkout -b feature/<feature-name>
```

### 2. Develop and Commit (English & Conventional Commits)

Make granular, atomic commits using English.

```bash
git add .
git commit -m "feat: add division labels and align quotient"
```

Use standard Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, `test:`, and `chore:`.

### 3. Run Automated Tests

```bash
./mvnw clean test
```

Blocker: If tests fail, fix the issues and rerun the tests. Do not proceed if tests fail.

### 4. Merge into Main

# Estando na feature branch:
git checkout feature/<feature-name>
git fetch origin main
git rebase origin/main

# Depois, para juntar na main de forma limpa (sem commit de merge):
git checkout main
git merge --ff-only feature/<feature-name>
git branch -d feature/<feature-name>

## AGENT RESPONSE FORMAT

For every task, report:

- Created branch name.
- Executed commands.
- Test status and merge result into main.