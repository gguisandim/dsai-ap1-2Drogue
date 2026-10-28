# Etapa 8.6.1: hardening da integração Phaser

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-6-1-hardening-phaser`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `testes afetados de router, piloto, cena e caracterização legada aprovados; suíte completa 753/753 em 45 suítes; tsc --noEmit, check:gates (1695 arquivos, 3683 dependências), build e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/CampaignRunSaveService.ts`
- `src/scenes/GameScene.ts`
- `src/tests/campaignRouter.test.ts`
- `src/tests/branchingCampaignPilot.test.ts`
- `src/tests/branchingCampaignPhaserIntegration.test.ts`
- `prompts/15-etapa-8-6-1-hardening-integracao-phaser.md`

## Prompt efetivamente recebido

```text
Execute uma auditoria corretiva da Etapa 8.6 do Umbra Trail, criando a Etapa 8.6.1 — Hardening da integração Phaser.

Leia `AGENTS.md`, a SPEC de campanha ramificada e apenas os módulos `CampaignRouter`, `CampaignRunSaveService`, `BranchingCampaignPilot`, `GameScene` e respectivos testes.

Problemas prioritários:

1. Examinar a janela entre confirmação da transição, persistência da run, reconstrução visual e concessão das recompensas.
2. Impedir recompensas duplicadas ou perdidas após restart, respeitando `transitionId`, `stageInstanceId` e operação idempotente. Não declarar exatamente-uma-vez sem garantia do consumidor.
3. Garantir que falhas de inspeção ou reconstrução do estágio de destino não deixem o jogador preso em uma fase sem saídas.
4. Definir recuperação explícita para falhas depois de uma confirmação persistida.
5. Eliminar somente duplicações diretamente relacionadas às transições, sem refatorar integralmente `GameScene`.
6. Adicionar testes de regressão para interrupções e falhas entre confirmação, recompensa, inspeção e apresentação.
7. Preservar flag OFF, saves legados e os 741 testes anteriormente relatados.
8. Atualizar a SPEC e registrar o prompt efetivo conforme `umbra-prompt-record/v1`.

Restrições:
- Não implementar campanha amazônica.
- Não criar novos NPCs, biomas, mapas ou mecânicas.
- Não alterar regras de combate ou IA.
- Não introduzir dependências novas.
- Não criar commits automaticamente.

Validação econômica: testes afetados durante o desenvolvimento; depois gates, typecheck, suíte completa, build e `git diff --check`.

Entregue diagnóstico, arquivos modificados, testes, garantias efetivamente alcançadas e riscos restantes. Se algum fluxo exigir alteração de arquitetura desproporcional, documente e proponha uma intervenção separada.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
