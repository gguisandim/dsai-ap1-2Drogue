# Modularização de fases e narrativa interativa — Etapa 9.3B *(2026-10-29)*

## Estado e relação com as etapas anteriores

Esta SPEC complementa a Etapa 9.3A
(`SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`) e a Etapa 9.2B
(`SPEC/2026-10-28-campanha-rotas-independentes.md`). Ela **não substitui** o
fluxo macro, os contratos de `StageModule`/`StageRegistry`/`StageLoader`, os
saves existentes ou o comportamento legado. Altera somente:

1. a forma como capítulos declaram sua ligação com uma região macro (catálogo
   declarativo em vez de edição pontual em `UmbraCampaignRouteSlice`);
2. a pendência de apresentação narrativa no Phaser registrada na 9.3A, que passa
   a existir como painel de diálogo reutilizável ligado a POIs declarados;
3. o esclarecimento do comportamento de recompensas em revisitas observado na
   9.3A.1.

O evento `Eco das Águas` continua disparado por `stage.entered`; sua semântica
de gatilho não muda.

## Objetivos

- **P0** — Catálogo declarativo de capítulos/regiões, consumido por
  `registerCampaignChapters` e pela definição macro, sem criar um segundo
  registry, router ou framework de plugins.
- **P1** — Interação narrativa genérica no Phaser: detecção de POI próximo,
  indicação visual, tecla `E`, painel de diálogo, avanço/fechamento,
  processamento por `StageDirector`, persistência e idempotência.
- **P2** — `Vestígio Submerso` visível, alcançável e interativo, reutilizando o
  diálogo declarado e preservando o `Eco das Águas`.
- **P3** — Diagnóstico das recompensas em revisitas, com caracterização e
  teste; correção apenas se houver bug comprovado.
- **P4** — Testes, World Lab exibindo o POI, validação completa.

## Catálogo de capítulos (P0)

Novo contrato aditivo `src/stages/chapters/CampaignChapterCatalog.ts`:

- `CampaignRegionBinding`: `{ regionId, stageId, title?, minimumManifestRevision,
  dialogueIds, eventIds }`.
- `CampaignChapterEntry`: `{ chapter, stages, regions }`, onde `chapter` é
  `ChapterManifest` e `stages` são os `StageModule` do capítulo.
- `CAMPAIGN_CHAPTER_CATALOG`: registro explícito e imutável dos capítulos.
- `applyCampaignRegionBindings(definition)`: aplica os `CampaignRegionBinding`
  do catálogo sobre uma `CampaignMacroDefinition`, substituindo `content` e
  `narrative` das regiões correspondentes. Regiões `planned` sem binding
  permanecem intocadas.
- `registerCampaignChapters(registry)` passa a percorrer o catálogo e registrar
  cada capítulo/stage; nenhum `if (igapo)` permanece no caminho de registro.

`UmbraCampaignRouteSlice` deixa de conter o patch específico de Igapó: monta a
definição base e chama `applyCampaignRegionBindings`. A topologia do grafo de
rotas (templates por profundidade) permanece como está; a ligação
região→conteúdo→narrativa é declarativa.

Critérios observáveis:

- adicionar uma entrada ao catálogo registra o capítulo no `StageRegistry` e
  altera a região macro sem editar `UmbraCampaignRouteSlice` nem
  `registerCampaignChapters`;
- região sem binding continua sem `stageId` carregável e sem portal;
- `StageRegistry.validate()` e `StageValidator` continuam aceitando o capítulo.

## Interação narrativa (P1/P2)

Contrato puro e testável `src/application/interaction/WorldInteraction.ts`:

- `WorldInteractionPoint = { kind: 'poi' | 'exit'; id; x; y; label; dialogueId?;
  physicalExitId?; available? }`.
- `resolveWorldInteraction(points, player, options)`: devolve o ponto acionável
  mais próximo dentro de `radius`.
  - **Prioridade explícita:** quando um POI e uma saída estão no raio, a saída só
    vence se estiver mais perto que o POI por mais que `poiPriorityMargin`
    (padrão 24 px); caso contrário o POI vence, e empate favorece o POI.
  - Uma única resolução é consumida por pressionamento de `E`; o chamador não
    dispara portal e diálogo no mesmo frame.
- `DialogueOverlay` (Phaser) é a máquina de estados mínima do diálogo
  (`openDialogue`, `advance`, `close`, `isOpen`), avançando pelo
  `DialogueEngine` e fechando ao completar ou por `ESC`.

`StageDirector` recebe somente wrappers finos que reutilizam `DialogueEngine`:
`startDialogue(dialogueId)` e `advanceDialogue(session)`, sem regra paralela.
`GameNarrativeSession` recebe `interactNpc(npcId)` (emite sinal
`npc.interacted`, processa e salva), `startDialogue`, `advanceDialogue` e
`completeDialogue` (emite `dialogue.completed` e persiste). O evento
`stage.entered` do Eco continua sendo processado por `enterStage()`,
independente da apresentação.

Integração Phaser (mínima, sem reescrever `GameScene`):

- `src/ui/DialogueOverlay.ts`: container Phaser com fundo, falante, texto, dica
  `E — continuar` / `ESC — fechar`; pausa física e simulação enquanto aberto
  (mesmo padrão da loja) e retoma ao fechar.
- Marca visual provisória de POI: sprite gerado (`poi_vestige`) desenhado no
  tile do NPC; rótulo de interação (`E — Vestígio Submerso`) quando próximo.
- `GameScene` cria a sessão narrativa também no modo campanha para o stage
  autoral carregado e delega a interação ao controller. A verificação de `E` do
  POI ocorre antes do consumo da tecla pelo portal; a tecla consumida pelo POI
  não dispara a saída.
- Sessões narrativas de campanha usam uma chave de save **aditiva** por
  identidade de stage (`umbra-trail-campaign-v1:<runId>:<chapterId>:<stageId>`),
  preservando a chave legada `umbra-trail-campaign-v1` do piloto modular.
- Interagir novamente com o POI reabre o diálogo; não cria nova operação de
  recompensa nem re-processa o evento `once` (idempotência por
  `NarrativeEventProcessor`).

## Recompensas em revisitas (P3)

Caracterização do observado na 9.3A.1: cada transição confirmada recebe um
`transitionId` com ocorrência (`CampaignRouter`), e
`recordStageCompletedIdempotent` usa esse `transitionId` como `operationId`.
Logo, ida, retorno e retomada geram três operações distintas, três recompensas
`applied` e `stagesCompleted = 3`. As arestas hub↔região têm
`traversalLimit: 2`, o que admite uma segunda ocorrência por desenho.

Conclusão: **comportamento esperado do modelo de ocorrências com limite de
travessia**, não duplicação. Nenhuma regra de progressão é alterada. Um teste de
caracterização fixa que a mesma transição (mesma ocorrência) não aplica
recompensa duas vezes e que ocorrências distintas têm operações distintas.

## Compatibilidade

- `verse_02_galeria`, `VERSE_SECTIONS`, saves legados (`umbra-trail-profile`,
  `umbra-trail-settings`, `vigrid-progression-v1`) e `umbra-trail-run-v1` não
  mudam.
- `umbra-trail-campaign-v1` permanece; a chave por stage é aditiva.
- Regiões `planned` continuam sem conteúdo carregável e sem portais.
- Nenhuma dependência nova; nenhum gerador procedural alterado.

## Critérios observáveis e testes

1. `registerCampaignChapters` registra todos os capítulos do catálogo; uma
   entrada extra de teste é registrada sem alterar arquivos centrais.
2. `applyCampaignRegionBindings` aplica conteúdo/narrativa apenas às regiões
   com binding; `planned` permanece sem `stageId`.
3. `resolveWorldInteraction` respeita prioridade POI/portal e devolve um único
   alvo; teste cobre POI e portal no mesmo raio.
4. O painel de diálogo abre, avança até completar e fecha; reabrir não duplica
   operações.
5. `GameNarrativeSession.interactNpc` processa `npc.interacted` e salva; uma
   segunda interação não refaz regra `once`.
6. A cena Phaser exibe o POI, o rótulo `E` e o painel; `E` abre, avança e
   fecha; `ESC` fecha; o portal não dispara no mesmo `E`.
7. Reload no Igapó restaura a sessão narrativa do stage (chave por identidade) e
   o diálogo não remove a flag/evento já processados.
8. Teste de caracterização de recompensas em revisitas.
9. World Lab continua exibindo o POI e as regiões planejadas sem mapa fictício.

## Resultados da implementação

- **P0:** `CampaignChapterCatalog` centraliza capítulo, stages e bindings de
  região; `registerCampaignChapters` percorre o catálogo (injetável em teste) e
  `UmbraCampaignRouteSlice` passou a usar `applyCampaignRegionBindings`, sem
  nenhum `if` de Igapó. Testes: `campaignChapterCatalog.test.ts`.
- **P1/P2:** `WorldInteraction` resolve um único alvo com prioridade POI/portal;
  `StageDirector` ganhou wrappers finos de diálogo; `GameNarrativeSession`
  expõe `interactNpc`, `startDialogue`, `advanceDialogue` e
  `completeDialogue`; `DialogueOverlay` renderiza falante/texto e pausa o mundo;
  `GameScene` cria a sessão narrativa também no modo campanha, desenha o
  marcador `poi_vestige` no tile do NPC, mostra `E — <nome>` e consome a tecla
  antes do portal. Sessões de campanha usam
  `umbra-trail-campaign-v1:<runId>:<chapterId>:<stageId>` (chave aditiva).
- **P3:** caracterização em `revisitRewards.test.ts` confirma uma operação de
  recompensa por transição/ocorrência, deduplicação da mesma operação em
  `ProgressionService` e bloqueio da terceira travessia pela `traversalLimit`;
  nenhuma regra de progressão foi alterada.
- **P4:** `worldLabPoi.test.ts` confirma o marcador `npc` “Vestígio Submerso” no
  estágio autoral; `narrativeInteraction.test.ts` cobre abertura, avanço,
  conclusão, idempotência e restauração após reload.

Homologação em navegador real (Edge 156 via CDP, Vite, run
`run.e2e.igapo.20261029`, seed `seed.e2e.igapo.20261029`): o jogador caminhou até
o tile (27,17), viu o rótulo `E — Vestígio Submerso`, abriu o painel, avançou os
dois nós, fechou com `E` (física e combate retomados). O save aditivo
`umbra-trail-campaign-v1:run.e2e.igapo.20261029:chapter.aguas:stage.aguas.igapo-das-memorias`
foi criado com a flag `flag.aguas.igapo.eco-das-aguas-seen = true` e três
eventos processados (`stage.entered`, `npc.interacted`,
`dialogue.completed`). Após reload + `JOGAR`, a cena voltou ao Igapó com os três
eventos e a flag restaurados; reabrir o POI manteve 3 eventos processados e 1
rule disparada (idempotência), sem novas operações. Prints em
`.tmp/evidence/93b-*.png`.

Limitações conhecidas:

- `DialogueEngine` devolve comandos `onEnter`/de escolha, mas o caminho de
  apresentação não os aplica; o diálogo atual do Eco não declara comandos, então
  não há divergência hoje. Comandos em diálogos futuros exigem roteá-los pelo
  `NarrativeEventProcessor` antes da apresentação.
- A topologia do grafo de rotas (slots por profundidade) continua explícita; o
  catálogo remove a edição por região do conteúdo e da narrativa, não do desenho
  macro.

## Validação de entrega

Durante o trabalho, suítes direcionadas. Ao final, uma vez:

```text
npm test -- --runInBand
npm run typecheck
npm run build
npm run check:gates
git diff --check
```

Homologar o POI/diálogo em navegador real quando o ambiente permitir.

## Como adicionar a próxima fase

1. Criar `src/stages/chapters/<chapter>/<stage>.ts` exportando um `StageModule`
   (manifesto `layout.kind='authored'`, `authoredLevel`, `npc`, `dialogues`,
   `events`) e um `index.ts` com o `ChapterManifest` e a lista de stages.
2. Adicionar uma `CampaignChapterEntry` em
   `src/stages/chapters/CampaignChapterCatalog.ts` com o capítulo, os stages e
   os `CampaignRegionBinding` das regiões que ele preenche (incluindo
   `dialogueIds`/`eventIds`).
3. Para uma nova região no grafo da rota, acrescentar apenas o slot/template de
   profundidade existente; a ligação de conteúdo e narrativa vem do catálogo.
4. Marcar o POI como `NpcDefinition` (`role: 'ambient'`, `spawn` no tile,
   `interactionDialogueId`); o Phaser desenha o marcador e o diálogo sem código
   por fase.
5. Criar testes do capítulo (manifesto, IDs, referências, grafo de diálogo,
   objetivos, eventos, mapa, POI e determinismo).
