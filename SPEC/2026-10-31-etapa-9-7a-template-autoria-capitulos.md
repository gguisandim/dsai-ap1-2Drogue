# Etapa 9.7A — Template de autoria de capítulos independentes

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.6E.3. Não inicia a 9.7B/9.7C, não altera
motor, compositor, roteador, gerador ou saves, e não registra conteúdo novo no
catálogo de produção.

## Objetivo

Criar um template executável de capítulo independente que demonstre, com os
contratos públicos existentes, como declarar identidade, revisão, manifesto,
mapa autoral, encontros, NPCs, diálogos, missão, eventos, recompensa,
apresentação, áudio, saídas e elegibilidade. O template deve ser descoberto pelo
catálogo, validado pelos validadores existentes, carregado pelo `StageLoader` e
executado pelo runtime narrativo sem alterar componentes centrais.

## Auditoria das fronteiras reais

| Necessidade | Contrato/implementação existente | Decisão |
|---|---|---|
| definir fase e capítulo | `StageModule`, `StageManifest`, `ChapterManifest` | declarar dados; nenhum formato novo |
| registrar capítulo | `StageRegistry.registerChapter` + `registerCampaignChapters(registry, catalog)` | usar o catálogo injetável, já usado por testes |
| descobrir e classificar | `StageCatalogService.create(registry)` | reutilizar sem alteração |
| validar manifesto | `StageValidator.validate` / `validateModule` | reutilizar |
| resolver mapa e encontros | `StageLoader`, `ResolvedLevelValidator`, `StageEncounterResolver` | reutilizar |
| apresentação visual/áudio | `ChapterVisualResources`, `StageVisualRegistry` | reutilizar recursos técnicos existentes |
| narrativa | `StageDirector`, `NarrativeRegistry`, `DialogueEngine`, `QuestEngine`, `NarrativeEventProcessor` | reutilizar comandos, sinais e condições existentes |
| persistência narrativa | `GameStageCompositionRoot.createNarrativeSession` + `CampaignSaveService` | reutilizar a chave e a identidade existentes |
| modo individual | `GameSessionService.startIndividualStage` | reutilizar; não promover a candidato de campanha |
| World Lab | `WorldLabDataService({ registry })` | registrar o capítulo apenas no registry injetado |
| catálogo de produção | `CAMPAIGN_CHAPTER_CATALOG` | não modificar |

O ponto de extensão real é o segundo parâmetro de `registerCampaignChapters`.
Ele já permite acrescentar uma entrada sem editar arquivos centrais. A limitação
restante é que o jogo de produção ainda precisa chamar esse registro com o
catálogo desejado; descoberta dinâmica por filesystem e carregamento remoto não
existem e não serão criados nesta etapa.

## Localização

O template fica em `src/examples/chapter-template/`, e não em `examples/` na raiz.
A escolha segue a arquitetura existente:

- `tsconfig.json` tem `rootDir: "src"` e inclui apenas `src/**/*.ts`;
- o `check-architecture` percorre `src`;
- o build Vite usa `src/` como raiz.

Colocar o template fora de `src` o excluiria do typecheck e dos gates. A pasta
não é importada por `src/main.ts` nem pelo catálogo de produção; portanto não
entra no bundle nem no jogo normal.

## Estrutura do template

```text
src/examples/chapter-template/
  README.md          guia de autoria
  ids.ts             IDs estáveis derivados de um namespace
  level.ts           mapa autoral (LevelDefinition)
  presentation.ts    ChapterVisualResources + StagePresentationDefinition
  encounter.ts       StageEncounterDefinition
  narrative.ts       NPC, diálogo, missão, eventos e flags
  stage.ts           StageModule completo
  chapter.ts         ChapterManifest
  registration.ts    CampaignChapterEntry + registro isolado
  index.ts           exports públicos do template
src/tests/chapterTemplate.test.ts
```

Os arquivos usam um factory `createChapterTemplate(namespace, revision)` que
deriva todos os IDs do namespace. O template padrão é
`createChapterTemplate('example.beacon')`. O factory permite copiar a estrutura
com novos IDs e revisão sem alterar o motor e prepara a futura CLI da 9.7B.

## Capítulo demonstrativo

- Capítulo `chapter.<namespace>`, revisão própria.
- Fase `stage.<namespace>.approach`, revisão própria, layout `authored`.
- Mapa 19×11 com borda fechada, spawn, piso, parede, pilar, baú e tile de saída.
- Spawn do jogador, NPC, dois inimigos e uma saída em tile alcançável.
- Dois arquétipos existentes: `affinity` e `ranged`.
- Um encontro declarativo com uma onda contendo os dois arquétipos.
- NPC `npc.<namespace>.warden`, apresentação própria mapeada no manifesto.
- Diálogo com escolha: aceitar a missão ou apenas observar.
- Missão iniciada por `mission.start` na escolha; objetivo
  `encounter.completed` filtrado pelo `encounterId`.
- Evento de entrada (`stage.entered`) registra chegada.
- Evento de interação (`npc.interacted`) inicia o diálogo.
- Evento de encontro concluído aplica flag, desbloqueia a saída e concede
  recompensa idempotente.
- Evento de saída (`stage.exit.requested`) registra `stage.complete`.
- Saída `exit.<namespace>.depart` para `campaign.complete`, condicionada à flag
  de farol aceso.
- Capabilities todas suportadas pelo perfil real; nenhuma capability planejada.
- Elegibilidade `individual-only`; não entra no compositor de campanha.
- Recursos visuais e sonoros reutilizam chaves técnicas existentes
  (`tile_floor`, `tile_wall`, `enemy_melee_anim`, `enemy_ranged_anim`, etc.) com
  IDs locais por namespace. Nenhum asset novo é baixado ou adicionado.

## Sequência narrativa comprovada

```text
enterStage
  -> stage.entered: flag de chegada
  -> interactNpc: evento inicia o diálogo
  -> startDialogue / choose("accept") / applyDialogueTurn
       -> mission.start + flag de aceite
  -> encounter.completed
       -> missão completa
       -> flag do farol + exit.unlock + reward.grant
  -> requestExit
       -> stage.complete
  -> confirmOperation
       -> recompensa liquidada e persistida
```

Todos os comandos são os já suportados: `dialogue.start`, `mission.start`,
`flag.set`, `exit.unlock`, `reward.grant`, `stage.complete`. Nenhum comando
novo é introduzido.

## Registro e descoberta

`registration.ts` exporta:

- `CHAPTER_TEMPLATE_ENTRY: CampaignChapterEntry`;
- `registerChapterTemplate(registry, baseCatalog?)`, que chama
  `registerCampaignChapters(registry, [...baseCatalog, entry])`;
- `createChapterTemplateRegistry()`, que registra estágios legados, o catálogo
  de produção e a entrada do template, apenas no registry em memória.

O catálogo de produção `CAMPAIGN_CHAPTER_CATALOG` permanece intacto. O teste
comprova que `new GameSessionService()` não lista a fase do template e que o
registry isolado a lista como `individual-only` e `loadable`.

## Elegibilidade e campanha

O template declara `campaignCatalog` com `participation: 'individual-only'`.
Portanto:

- aparece em `GameSessionService.startIndividualStage`;
- não aparece como candidato de `umbra.fixed-nine.v1` ou
  `umbra.branching-nine.v1`;
- não exige nove fases.

O README documenta como um autor pode, no futuro, declarar `participation:
'candidate'`, dificuldade, atos, capacidade de saídas, marcos e política de
revisita para participar das políticas de campanha.

## Validação e testes negativos

Os testes reutilizam `StageValidator`, `StageLoader`, `StageCatalogService`,
`ResolvedLevelValidator` (via loader), `NarrativeRegistry`/`StageDirector` e
`WorldLabDataService`. Não há validador paralelo.

Alterações controladas do template devem produzir diagnósticos tipados para:

- manifesto inválido (título vazio);
- ID duplicado (dois módulos com o mesmo ID);
- referência inexistente (destino de saída ausente);
- capability indisponível (capability planejada);
- dependência não satisfeita (capítulo dependente ausente);
- encontro inválido (onda vazia);
- inimigo desconhecido (arquétipo inexistente);
- recurso visual ausente (tema não registrado);
- referência narrativa inválida (NPC aponta para diálogo ausente);
- saída incompatível (âncora em parede);
- revisão inválida (revisão zero).

## Prova de independência

O teste principal:

1. cria um `StageRegistry` isolado com estágios legados e o capítulo template;
2. valida o registry com `StageValidator`;
3. descobre a fase com `StageCatalogService`;
4. carrega com `StageLoader` e confere mapa, encontro e apresentação;
5. inicia o modo individual com `GameSessionService` usando o registry isolado;
6. executa a sequência narrativa mínima e confere recompensa, saída,
   conclusão e idempotência;
7. recarrega a sessão narrativa pelo save existente;
8. confere que o catálogo de produção não contém o template;
9. repete a estrutura com um segundo namespace e revisão, registrando e
   carregando as duas cópias sem conflito;
10. projeta a fase em `WorldLabDataService` com o registry injetado.

## Diagnósticos esperados

Nenhum código novo de diagnóstico é criado. Os testes usam os códigos já
existentes, entre eles:

- `stage.title.required`
- `registry.stage.duplicate`
- `stage.exit.target-missing`
- `capability.unavailable`
- `chapter.dependency.missing`
- `stage.encounter.waves.empty`
- `stage.encounter.archetype.unknown`
- `stage.visual.theme.unknown`
- `narrative.npc.dialogue.missing`
- `stage.exit.anchor-not-walkable`
- `stage.revision.invalid`

## Limitações

- o catálogo de produção ainda é uma lista estática em TypeScript;
- não há descoberta automática, CLI, editor ou carregamento remoto;
- o template é `individual-only` e não participa das políticas de campanha;
- não há homologação visual no navegador neste ambiente;
- a futura CLI 9.7B deve gerar a pasta a partir do factory, mas não é
  implementada aqui.

## Pendências para a 9.7B

- comando de criação a partir do template;
- substituição automatizada de namespace, títulos e revisão;
- validação de um capítulo recém-copiado;
- preview local;
- decisão sobre descoberta de catálogo sem edição de arquivo central.

## Critérios observáveis

1. O template compila e é typechecked.
2. O capítulo é validado sem erros pelos validadores existentes.
3. A fase é descoberta como `individual-only` e carregada deterministicamente.
4. O encontro resolve dois arquétipos existentes.
5. A apresentação resolve tema, tileset, NPC, inimigos e áudio.
6. A sequência narrativa completa funciona com recompensa e conclusão.
7. A recompensa e a conclusão são idempotentes após replay e reload.
8. O template não aparece no catálogo de produção.
9. Uma segunda cópia com novos IDs e revisão é registrada e carregada.
10. Os testes negativos produzem diagnósticos tipados.
11. Suíte completa, typecheck, build, gates e `git diff --check` aprovados.
