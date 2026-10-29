# Etapa 8.6.2: idempotência durável de recompensas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-6-2-idempotencia-recompensas`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `testes afetados de progressão, router, piloto e cena aprovados; suíte completa 761/761 em 46 suítes; tsc --noEmit, check:gates (1696 arquivos, 3685 dependências), build e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/progression/types.ts`
- `src/progression/ProgressionService.ts`
- `src/progression/ProgressionStorage.ts`
- `src/application/stages/CampaignRouter.ts`
- `src/scenes/GameScene.ts`
- `src/tests/progressionIdempotency.test.ts`
- `src/tests/branchingCampaignPhaserIntegration.test.ts`
- `src/tests/campaignRouter.test.ts`
- `prompts/16-etapa-8-6-2-idempotencia-recompensas.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 8.6.2 — Idempotência durável de recompensas** do Umbra Trail.

### Contexto mínimo
Leia:
- `AGENTS.md` (regras obrigatórias).
- `SPEC/2026-10-28-campanha-procedural-ramificada.md` (somente Etapas 8.6.1 e 8.6.2).
- `CampaignRouter.ts`, `CampaignNavigation.ts` e `CampaignRunSaveService.ts`.
- Serviço e storage de progressão existentes.
- Apenas os trechos de `GameScene.ts` responsáveis por recompensas e recuperação.

Não leia arquivos gerados, outras SPECs ou o repositório inteiro. Investigue dependências adicionais somente quando necessário.

### Objetivo
Garantir aplicação idempotente e durável das recompensas de campanha por `operationId = transitionId`, inclusive após falhas e reinicializações.

### Implementação
1. Adicionar `operationId` opcional à API de recompensas, preservando o comportamento legado.
2. Persistir recompensa e `operationId` no mesmo estado de progressão, usando um ledger versionado.
3. Impedir duplicação de operações já aplicadas, inclusive após restart.
4. Propagar falhas de persistência, sem confirmar operações não gravadas.
5. Permitir reaplicar com segurança operações `pending` e `claimed`.
6. Confirmar `applied` no router somente após sucesso durável ou deduplicação confirmada pelo consumidor.
7. Preservar saves antigos sem ledger e manter valores atuais das recompensas.
8. Criar testes direcionados para duplicação, falha de escrita, restart, recuperação e compatibilidade.
9. Atualizar a SPEC e registrar o prompt efetivo em `prompts/` (schema `umbra-prompt-record/v1`).

### Restrições
- Não alterar combate, IA, mapas, geração procedural ou navegação.
- Não refatorar `GameScene` fora do fluxo de recompensas.
- Não modificar World Lab, assets ou conteúdo narrativo.
- Não adicionar dependências.
- Não alterar testes anteriores para ocultar regressões.
- Não criar commits.

### Validação econômica
- Durante o desenvolvimento: executar apenas testes novos/afetados.
- Ao finalizar: executar gates, typecheck, suíte completa, build e `git diff --check` uma única vez.
- Repetir somente verificações afetadas se houver correções.

### Garantias
Não declarar exatamente-uma-vez se a persistência não garantir atomicidade entre recompensa e ledger. Não assumir transação entre saves de run e progressão.

### Entrega
Responder resumidamente com arquivos alterados, novos testes, resultados, garantias reais e riscos restantes. Evitar relatórios extensos.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
