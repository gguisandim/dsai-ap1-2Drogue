# Etapa 6: Architecture Gates, rastreabilidade e regressão

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-6-architecture-gates`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- Commit: `pendente`
- Execução: `check:gates, typecheck, 646 testes, build e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `.github/workflows/publicar-pages.yml`
- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `package.json`
- `prompts/README.md`
- `prompts/MODELO-REGISTRO.md`
- `prompts/09-architecture-gates-rastreabilidade.md`
- `scripts/check-architecture.mjs`
- `scripts/check-traceability.mjs`
- `src/tests/architectureGates.test.ts`
- `src/tests/stageArchitectureRegression.test.ts`
- `src/tests/traceabilityGates.test.ts`
- `test-fixtures/architecture-gates/valid/src/stages/contracts/index.ts`
- `test-fixtures/architecture-gates/valid/src/stages/chapters/demo/local.ts`
- `test-fixtures/architecture-gates/valid/src/stages/chapters/demo/stage.ts`
- `test-fixtures/architecture-gates/invalid-direct/src/combat/internal.ts`
- `test-fixtures/architecture-gates/invalid-direct/src/stages/chapters/demo/stage.ts`
- `test-fixtures/architecture-gates/invalid-transitive/src/scenes/GameScene.ts`
- `test-fixtures/architecture-gates/invalid-transitive/src/stages/chapters/demo/helper.ts`
- `test-fixtures/architecture-gates/invalid-transitive/src/stages/chapters/demo/stage.ts`
- `test-fixtures/traceability-gates/legacy/prompts/01-legado.md`
- `test-fixtures/traceability-gates/invalid/prompts/09-invalido.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 6 da arquitetura modular do Umbra Trail: Architecture Gates, rastreabilidade de agentes e testes de regressão.

Leia:

- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `src/stages/index.ts`
- `src/narrative/index.ts`
- `src/application/stages/`
- `src/tests/stageGameModularIntegration.test.ts`
- `.github/workflows/`
- `prompts/`

Consulte outros arquivos apenas quando indispensáveis. Não explore indiscriminadamente o repositório.

**Objetivos:**

1. Criar um verificador automatizado de fronteiras arquiteturais, impedindo dependências proibidas entre `stages`, `narrative`, Phaser, `GameScene` e implementações internas de combate, simulação e progressão.
2. Validar as dependências de forma transitiva quando necessário, usando ferramentas compatíveis com o projeto.
3. Atualizar `AGENTS.md` para exigir registro de prompts, SPEC associada, arquivos modificados, agente utilizado e commit correspondente.
4. Padronizar `prompts/` e criar um modelo reutilizável para registros futuros.
5. Preservar o histórico de prompts existente, sem reescrever nem inventar prompts anteriores.
6. Criar verificações de rastreabilidade e integrá-las à CI, respeitando o histórico legado e evitando reprovação por commits anteriores.
7. Criar testes de regressão para feature flag OFF/ON, fallback, carregamento de fase, transições, restart e compatibilidade de saves.
8. Garantir que os módulos de conteúdo possam utilizar somente contratos públicos, sem importar diretamente implementações internas do motor.
9. Documentar as regras, exceções justificadas, critérios de aceitação e resultados na SPEC.

**Restrições:**

- Não alterar regras de jogabilidade.
- Não refatorar `GameScene`.
- Não modificar combate, simulação, IA ou geração procedural.
- Não adicionar novos capítulos, NPCs ou sistemas narrativos.
- Não alterar o mecanismo legado de saves.
- Não introduzir dependências sem necessidade demonstrada.
- Não modificar testes anteriores para ocultar regressões.
- Preservar os 636 testes existentes.
- Não criar commits automaticamente.

**Validação:**

Executar typecheck, testes completos, build, verificações arquiteturais, verificações de rastreabilidade e `git diff --check`.

Se algum teste de regressão exigir um ambiente Phaser real, documentar a limitação e propor um teste de integração apropriado, sem afirmar cobertura inexistente.

Entregar relatório com arquivos alterados, regras implementadas, violações detectadas, novos testes e limitações.

**Importante:** a rastreabilidade deve identificar o prompt efetivamente recebido pelo agente. Quando não houver informação suficiente sobre modelo, commit ou execução, marcar como desconhecido ou pendente, sem inventar dados.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- O modelo e o esforço exatos não foram informados no prompt recebido.
- Nenhum commit foi criado automaticamente.
