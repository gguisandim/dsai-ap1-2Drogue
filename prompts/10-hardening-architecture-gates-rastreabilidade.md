# Hardening dos Architecture Gates e rastreabilidade

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-hardening-architecture-gates-traceability`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- Commit: `pendente`
- Execução: `check:gates, typecheck, 650 testes, build e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `prompts/README.md`
- `prompts/MODELO-REGISTRO.md`
- `prompts/10-hardening-architecture-gates-rastreabilidade.md`
- `scripts/check-architecture.mjs`
- `scripts/check-traceability.mjs`
- `src/tests/architectureGates.test.ts`
- `src/tests/traceabilityGates.test.ts`
- `test-fixtures/architecture-gates/invalid-procedural-simulation/src/stages/runtime/StageLoader.ts`
- `test-fixtures/architecture-gates/invalid-procedural-simulation/src/procedural/Bridge.ts`
- `test-fixtures/architecture-gates/invalid-procedural-simulation/src/simulation/core/SimulationKernel.ts`
- `test-fixtures/traceability-gates/invalid/prompts/09-invalido.md`
- `test-fixtures/traceability-gates/legacy/prompts/01-legado.md`
- `test-fixtures/traceability-gates/legacy/prompts/01-arquitetura-campanha-modular.md`
- `test-fixtures/traceability-gates/duplicate/prompts/09-primeiro.md`
- `test-fixtures/traceability-gates/duplicate/prompts/10-segundo.md`
- `test-fixtures/traceability-gates/pending/prompts/09-pendente.md`
- `test-fixtures/traceability-gates/unversioned/prompts/10-novo.md`

## Prompt efetivamente recebido

```text
Faça o hardening dos Architecture Gates e da rastreabilidade da Etapa 6 do Umbra Trail.

Leia somente:

- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `scripts/check-architecture.mjs`
- `scripts/check-traceability.mjs`
- `src/tests/architectureGates.test.ts`
- `src/tests/traceabilityGates.test.ts`
- `prompts/`

Objetivos:

1. Substituir a exceção procedural transitiva genérica por uma allowlist estrita de dependências justificadas, preservando apenas os caminhos necessários para o RNG determinístico.
2. Criar teste negativo demonstrando que outros módulos de simulação não ficam liberados por essa exceção.
3. Impedir que novos arquivos de prompts sem schema v1 sejam classificados automaticamente como legados.
4. Autorizar os oito registros históricos por identidade explícita, sem alterar seu conteúdo.
5. Detectar `Prompt-ID` duplicados e registros estruturalmente inválidos.
6. Definir tratamento de `Commit: pendente` para registros ainda não consolidados, sem inventar hashes e sem gerar dependência circular no Git.
7. Revisar a consistência entre `AGENTS.md`, modelo de registro e verificadores.
8. Adicionar testes positivos e negativos correspondentes e atualizar a SPEC.

Restrições:

- Não modificar jogabilidade, GameScene, sistemas narrativos, combate ou geração procedural.
- Não reescrever prompts anteriores.
- Não adicionar dependências.
- Não modificar testes antigos para ocultar falhas.
- Preservar os 646 testes atuais.
- Não criar commits automaticamente.

Validar com `npm run check:gates`, typecheck, testes completos, build e `git diff --check`.

Relatar arquivos alterados, novos testes, exceções autorizadas e riscos restantes. Registrar o prompt efetivamente recebido seguindo o padrão v1.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- O modelo e o esforço exatos não foram informados no prompt recebido.
- O commit permanece `pendente`; o gate poderá derivá-lo depois da consolidação.
