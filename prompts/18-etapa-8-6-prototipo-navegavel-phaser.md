# Etapa 8.6: protótipo navegável de campanha ramificada no Phaser

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-6-prototipo-navegavel-phaser`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest direcionado 18/18 em 3 suítes, suíte completa 741/741 em 45 suítes, tsc --noEmit, check:gates (1695 arquivos, 3683 dependências; 10 registros v1 e 8 históricos), build (702 módulos) e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/application/stages/BranchingCampaignPilot.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/index.ts`
- `src/scenes/GameScene.ts`
- `src/tests/branchingCampaignPilot.test.ts`
- `src/tests/branchingCampaignPhaserIntegration.test.ts`
- `prompts/18-etapa-8-6-prototipo-navegavel-phaser.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 8.6 — protótipo navegável de campanha ramificada no Phaser.

**Contexto mínimo:**

- `AGENTS.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/scenes/GameScene.ts`
- APIs públicas de `src/stages/` e `src/narrative/`.

Consulte outros arquivos somente quando necessário.

**Objetivo:** permitir que o jogador navegue fisicamente entre regiões de uma campanha procedural, utilizando o CampaignRouter e os contratos existentes, sem modificar o combate e a movimentação.

**Implementação:**

1. Criar uma feature flag `branchingCampaign`, desativada por padrão.
2. Criar um piloto com três ou quatro fases legadas, contendo bifurcação, caminhos alternativos e convergência.
3. Utilizar `CampaignRouter.inspect()` para obter as saídas físicas do nó atual.
4. Representar as saídas como objetos interativos Phaser, reutilizando sprites ou elementos visuais existentes.
5. Permitir interação com a saída física por proximidade e comando explícito do jogador.
6. Utilizar `prepare(physicalExitId)` e `confirm(preparationId)` para navegar, sem implementar regras paralelas de roteamento na cena.
7. Preservar `runId`, `runSeed`, `stageInstanceId`, percurso e saves durante transições.
8. Reutilizar as regras existentes de ondas, inimigos, recompensas, morte, câmera e colisões.
9. Impedir transições simultâneas, saídas inacessíveis e retorno para estados inconsistentes.
10. Manter rollback seguro quando carregamento ou persistência falhar.
11. Com a flag OFF, preservar integralmente a jogabilidade e as fases legadas.
12. Criar testes de integração para flag OFF/ON, interação com saídas, bifurcação, rejoin, restart, falhas e persistência.
13. Atualizar a SPEC e registrar o prompt efetivo.

**Restrições:**

- Não refatorar completamente `GameScene`.
- Não alterar combate, IA, simulação ou progressão.
- Não criar biomas, NPCs, missões ou campanha amazônica nesta etapa.
- Não substituir o fluxo legado.
- Não adicionar dependências sem justificativa.
- Não modificar testes existentes para esconder regressões.
- Não criar commits automaticamente.

**Validação econômica:**

- Testes direcionados durante a implementação.
- Gates e typecheck após finalizar.
- Suíte completa e build uma vez ao final.
- `git diff --check`.

**Importante:** caso a persistência entre `umbra-trail-run-v1` e `umbra-trail-campaign-v1` exija coordenação adicional, não inventar atomicidade. Documentar e tratar os estados inconsistentes de maneira explícita.

Entregar arquivos alterados, testes, comportamento das duas flags, limitações e instruções para testar manualmente o protótipo no navegador.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
