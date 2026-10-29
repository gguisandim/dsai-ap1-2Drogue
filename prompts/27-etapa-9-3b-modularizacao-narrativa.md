# Registro de prompt: Etapa 9.3B — Modularização de fases e narrativa interativa

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-3b-modularizacao-narrativa`
- Data: `2026-10-29`
- Agente: `Claude Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-etapa-9-3b-modularizacao-narrativa.md`
- Commit: `pendente`
- Execução: `executado`

## Arquivos modificados

- `SPEC/2026-10-29-etapa-9-3b-modularizacao-narrativa.md`
- `SPEC/README.md`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/chapters/registerCampaignChapters.ts`
- `src/stages/index.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/GameMacroCampaignAdapter.ts`
- `src/application/interaction/WorldInteraction.ts`
- `src/narrative/runtime/StageDirector.ts`
- `src/ui/DialogueOverlay.ts`
- `src/scenes/GameScene.ts`
- `src/tests/campaignChapterCatalog.test.ts`
- `src/tests/worldInteraction.test.ts`
- `src/tests/narrativeInteraction.test.ts`
- `src/tests/revisitRewards.test.ts`
- `src/tests/worldLabPoi.test.ts`
- `prompts/27-etapa-9-3b-modularizacao-narrativa.md`

## Prompt efetivamente recebido

```text
# Etapa 9.3B — Modularização de Fases e Narrativa Interativa

Implemente a Etapa 9.3B do Umbra Trail.

A Etapa 9.3A.1 comprovou em navegador real o fluxo hub → Igapó → hub → retomada, duas ondas de combate e persistência após reload.

**Objetivo:** tornar a criação de novos capítulos independente dos sistemas centrais e implementar a primeira interação narrativa visual reutilizável.

## Contexto mínimo

Leia:
- `AGENTS.md`
- `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- APIs de StageModule, StageRegistry e StageLoader
- `registerCampaignChapters.ts`
- `UmbraCampaignRouteSlice.ts`
- Contratos de NarrativeEventProcessor, DialogueEngine e CampaignMacroRouteBinder
- Trechos de GameScene responsáveis por interações e HUD

Consulte implementações adicionais somente quando necessário.

## P0 — Melhorar a modularização de autoria

Audite como uma nova fase é registrada e conectada à campanha.

Objetivos:

1. Definir um padrão de capítulo independente, com manifesto, StageModule, conteúdo narrativo e testes.
2. Reduzir a necessidade de modificar UmbraCampaignRouteSlice e outros arquivos centrais para cada região.
3. Utilizar um catálogo declarativo e registros explícitos, reutilizando StageRegistry e contratos existentes.
4. Preservar validação de IDs, regiões, estágios, saídas e referências.
5. Garantir que regiões `planned` não sejam carregadas nem recebam portais.
6. Permitir que agentes criem fases diferentes com alterações mínimas em arquivos compartilhados.
7. Documentar o procedimento concreto para adicionar uma nova fase.

Não criar um segundo StageRegistry, um novo router ou um framework de plugins.

Não utilizar descoberta dinâmica complexa apenas para eliminar um registro explícito simples.

## P1 — Sistema genérico de interação

Integrar os contratos narrativos existentes ao Phaser através de um adapter pequeno e reutilizável.

Implementar:
- Identificação do ponto de interesse próximo.
- Indicação visual de interação.
- Interação com E.
- Abertura de um painel simples de diálogo.
- Avanço e fechamento de diálogo.
- Processamento de eventos narrativos pelo runtime existente.
- Persistência e idempotência.
- Restauração consistente após reload.

Resolver explicitamente a prioridade da tecla E entre portal e POI, evitando duas ações simultâneas.

O sistema deve funcionar para futuros NPCs e objetos interativos, sem código específico para cada fase dentro de GameScene.

## P2 — Vestígio Submerso

Utilizar o POI já declarado no Igapó.

- Adicionar representação visual provisória claramente identificável.
- Torná-lo alcançável e interativo.
- Exibir o diálogo narrativo correspondente.
- Preservar o evento Eco das Águas já existente.
- Não duplicar recompensas ou eventos ao interagir repetidamente.

Se o evento Eco das Águas continuar sendo disparado em stage.entered, preservar sua semântica e distinguir o diálogo do POI do processamento desse evento. Não alterar gatilhos silenciosamente.

Não implementar novos NPCs, missões complexas ou história completa.

## P3 — Revisitas e recompensas

Investigar o comportamento observado na homologação:

- Três transições confirmadas.
- Três recompensas `applied`.
- `stagesCompleted=3` após ida, retorno e retomada.

Determinar se isso representa comportamento esperado ou exploração indevida de recompensas.

Caso seja bug comprovado, corrigir de forma mínima com testes, preservando os journals, operationIds e saves existentes.

Não alterar regras de progressão sem antes caracterizar o comportamento atual.

## P4 — Validação e integração

Criar testes para:
- Registro independente de capítulos.
- Validação de referências.
- Interação com POI.
- Prioridade entre portal e interação.
- Diálogos e fechamento.
- Persistência e idempotência.
- Compatibilidade com campanha e modo legado.
- Retomada de região.
- Recompensas após revisitas.

Manter o World Lab funcionando e exibindo o POI.

Executar testes direcionados durante o trabalho; ao final, executar uma vez suíte completa, typecheck, build, architecture gate, traceability gate e git diff --check.

Se possível, homologar o POI e o diálogo em navegador real.

## Restrições

- Não reescrever GameScene.
- Não reescrever o runtime narrativo.
- Não criar uma nova arquitetura de campanha.
- Não criar novos mapas ou redesenhar personagens.
- Não reintroduzir código morto removido.
- Não adicionar dependências desnecessárias.
- Não gerar classes repetitivas para aumentar LOC.
- Não modificar o fluxo legado por padrão.
- Não criar commits.

## Entrega

Criar ou atualizar a SPEC da Etapa 9.3B e registrar o prompt em prompts/ conforme AGENTS.md.

Entregar:
- Contratos e adapters reutilizados.
- Alterações de modularização.
- Exemplo documentado de como criar a próxima fase.
- POI e diálogo funcionando no Phaser.
- Diagnóstico das recompensas em revisitas.
- Testes, evidências e limitações.

**Critério principal:** depois desta etapa, criar Mangues ou outra fase deve exigir principalmente implementar o capítulo, e não modificar a infraestrutura central do jogo.

Priorize simplificação, reutilização e integração real. Não expanda desnecessariamente o escopo.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Validações executadas: `npm test -- --runInBand` (58 suítes, 846 testes, OK), `npm run typecheck` (OK), `npm run build` (OK), `npm run check:gates` (arquitetura 799 arquivos; rastreabilidade 23 registros v1, 1 commit pendente), `git diff --check` (OK).
- Homologação em navegador real (Edge 156 via CDP, Vite): POI `Vestígio Submerso` visível/reachável em (27,17), prompt `E — Vestígio Submerso`, diálogo de 2 nós aberto/avançado/fechado com `E`, flag `flag.aguas.igapo.eco-das-aguas-seen` persistida e três eventos processados; após reload + `JOGAR` o estado narrativo foi restaurado e a reinteração manteve 3 eventos (idempotente). Prints em `.tmp/evidence/93b-*.png`.
- Política de commit: nenhum commit será criado por solicitação explícita.
