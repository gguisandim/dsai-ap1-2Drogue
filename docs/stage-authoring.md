# Autoria de fases para agentes externos

Este guia permite criar um capítulo ou uma fase sem ler o motor inteiro. Ele
usa apenas contratos públicos, a CLI existente e os catálogos do runtime. Para
registro, assets e World Lab, consulte também
[`autoria-capitulos-e-assets.md`](./autoria-capitulos-e-assets.md).

## 1. Consultar o que o motor suporta

Antes de criar conteúdo, execute:

```sh
npm run chapter -- capabilities
npm run chapter -- capabilities --json
```

O primeiro comando imprime grupos legíveis: tiles, inimigos, itens, biomas,
temas, efeitos, narrativa, encontros, transições, apresentação, presets
procedurais, recursos dinâmicos, regras e limitações.

O segundo imprime somente um documento JSON estável:

```json
{
  "schemaVersion": 1,
  "kind": "umbra.stage-authoring.capabilities",
  "revision": 1,
  "runtimeProfile": {
    "id": "runtime.umbra-trail.stage-capabilities",
    "revision": 1,
    "counts": { "total": 62, "supported": 52, "planned": 10 }
  }
}
```

Use `npm run --silent chapter -- capabilities --json` quando a saída for
redirecionada para um parser, porque o npm acrescenta o próprio banner.

Campos do documento:

| Campo | Conteúdo |
|---|---|
| `schemaVersion`, `kind`, `revision` | identidade estável do formato |
| `runtimeProfile` | ID, revisão, capabilities ordenadas e contagens |
| `authoring.tiles` | tile lógico, valor numérico e status |
| `authoring.enemies`, `items`, `biomes`, `themes` | recursos derivados de capabilities reais |
| `authoring.narrative` | condições, missões, NPCs, sinais, comandos, recompensas e flags |
| `authoring.encounters` | modos, fontes e limites do encontro |
| `authoring.transitions` | layouts, âncoras e destinos de saída |
| `authoring.visual` | efeitos, áudio, camadas, perspectivas e variantes |
| `authoring.campaignCatalog` | participação, papéis, revisita e limites |
| `authoring.proceduralPresets` | preset, bioma e algoritmo |
| `dynamicResources` | recursos declarados pelo capítulo, não enumeráveis aqui |
| `rules` | severidade de ID desconhecido, indisponível e duplicado |
| `limitations` | recursos planejados e o que não pode ser descoberto |
| `discovery` | separação entre automático, dinâmico e indisponível |

Todas as coleções são ordenadas de forma determinística. Leia o relatório assim:

- `runtimeProfile.capabilities` é a fonte de verdade de IDs, categorias, versão
  e status;
- `authoring.*` mostra os valores de contrato aceitos em cada área;
- `dynamicResources` lista o que pertence ao capítulo e não pode ser enumerado
  globalmente;
- `rules` explica as severidades de capabilities;
- `limitations` lista o que não é suportado ou não pode ser descoberto.

Uma capability `planned` não é suportada. `theme.gothic-cathedral`, por exemplo,
aparece como `planned`; declará-la como `required` bloqueia o carregamento e
declará-la como `optional` gera warning. Não invente IDs.

## 2. Criar o capítulo

```sh
npm run chapter -- create minha-fase --title "Minha Fase"
```

O comando gera `src/examples/chapters/minha-fase/` a partir do template oficial,
com namespace `authoring.minha-fase`. Opções reais:

```sh
npm run chapter -- create minha-fase \
  --title "Minha Fase" \
  --namespace authoring.minha.fase \
  --revision 2
```

Arquivos gerados e responsabilidades:

| Arquivo | Conteúdo |
|---|---|
| `ids.ts` | todos os IDs derivados do namespace |
| `level.ts` | `LevelDefinition`, spawn, saída, item e decoração |
| `presentation.ts` | `ChapterVisualResources` e apresentação |
| `encounter.ts` | `StageEncounterDefinition` |
| `narrative.ts` | NPC, diálogo, missão, eventos e flags |
| `stage.ts` | `StageModule` completo |
| `chapter.ts` | `ChapterManifest` |
| `registration.ts` | entrada do catálogo e registry isolado |
| `template.ts` | factory local |
| `index.ts` | exports e `CHAPTER_TEMPLATE` |
| `AUTHORING.md` | cópia deste fluxo no momento da geração |
| `README.md` | IDs e instruções da instância |

O capítulo gerado **não** entra em `CAMPAIGN_CHAPTER_CATALOG`.

## 3. Geometria

Em `level.ts`, o mapa é um `number[][]` com os tiles lógicos do runtime:

| Valor | ID lógico | Uso |
|---|---|---|
| `0` | `floor` | piso caminhável |
| `1` | `wall` | parede |
| `2` | `pillar` | pilar |
| `3` | `water` | água/hazard |
| `4` | `lava` | dano |
| `5` | `exit` | saída lógica |
| `6` | `locked-door` | porta trancada |
| `7` | `chest` | baú |
| `8` | `spawn` | nascimento do jogador |
| `9` | `boss` | área de chefe |

Regras verificadas pelo `ResolvedLevelValidator`:

- a borda deve ser fechada;
- existe pelo menos um `spawn` e pelo menos um tile `exit` ou `boss`;
- o spawn alcança a saída;
- inimigos e itens ficam sobre piso válido.

O `manifest.layout` aceita `authored`, `legacy` ou `procedural`. Fases
`procedural` usam um preset real (veja `authoring.proceduralPresets`) e
`seed: 'run'`; overrides não podem substituir a seed.

## 4. Transições

Cada fase declara `manifest.exits`. O `anchor` aceita exatamente:

- `{ kind: 'tile', x, y }`;
- `{ kind: 'player-spawn', offsetX?, offsetY? }`;
- `{ kind: 'map-exit' }`.

`targetStageId` aponta para outra fase registrada ou para
`'campaign.complete'`. Uma saída para outro capítulo exige dependência
obrigatória em `ChapterManifest.dependencies`. `condition` é opcional e usa
somente os tipos listados em `authoring.narrative.conditionTypes`.

## 5. Narrativa, flags e eventos

Em `narrative.ts`:

- `npcs` declara `id`, `displayName`, `role` (`story`, `quest`, `merchant` ou
  `ambient`), `presentationId`, `spawn` e `interactionDialogueId`;
- `dialogues` declara nós com `speakerId` igual a `player`, `narrator` ou um NPC
  registrado;
- escolhas têm `id`, `text`, `nextNodeId` e comandos opcionais;
- `missions` declara `scope`, `start`, objetivos, filtros e recompensas;
- `events` reage a um dos `signalTypes` publicados pelo catálogo;
- flags são declaradas em `narrative.flags` e aceitam `boolean`, `number` ou
  `string`.

Comandos aceitos: `dialogue.start`, `mission.start`, `mission.advance`,
`flag.set`, `exit.unlock`, `stage.complete` e `reward.grant`.

Recompensas aceitas: `progression.unlock`, `progression.currency` e
`stage.flag`. Use `operationId` estável em `reward.grant` para manter a
idempotência.

A condição de saída do template é um exemplo real:

```ts
condition: { type: 'flag.equals', flag: ids.flags.beaconLit, value: true }
```

## 6. Encontros e gameplay

Em `encounter.ts`, use `schemaVersion: 1` e:

- `start: 'stage-ready'`;
- `completion: 'all-waves-defeated'`;
- `scaling: 'stage-difficulty-floor'`;
- `source.kind: 'authored-waves'` ou `'resolved-level-enemies'`.

Em `authored-waves`, a primeira onda usa `delayBeforeMs: 0`; cada inimigo usa um
arquétipo publicado (`affinity`, `applaud`, `fortitudo`, `ranged`, `boss`,
`miniboss`), coordenadas inteiras não negativas e nível de 1 a 10. Cada onda
aceita no máximo 64 inimigos. `patrol` e `dropTable` são opcionais.

## 7. Apresentação

Em `presentation.ts`, declare recursos locais do capítulo:

- `textures`: IDs locais para `textureKey` existentes no pipeline Phaser;
- `tilesets`: os dez tiles lógicos, `tileSize: 32`;
- `themes`: tileset e decorações permitidas;
- `decorations`, `sprites`, `sounds`, `audioProfiles`, `environments`.

O `manifest.presentation` referencia `themeId`, `tilesetId`, `audioProfileId`,
`environmentId`, sprites de NPC/inimigo e efeitos. Efeitos aceitos:
`fireflies`, `mist`, `pulse`, `spirits`, `local-light`, `water-shimmer` e
`foliage-sway`.

`manifest.presentationVariants` permite nomear apresentações alternativas para o
mesmo mapa, encontro e narrativa. Variantes alteram somente apresentação.

Não há carregamento remoto nem descoberta de assets. Se uma `textureKey` não
existir no pipeline, o CLI headless não detecta isso; o Phaser falha no preview.
O catálogo não enumera recursos visuais de capítulos: eles são dinâmicos.

## 8. Validar e visualizar

```sh
npm run chapter -- validate minha-fase
npm run chapter -- inspect minha-fase
npm run chapter -- inspect minha-fase --json
npm run chapter -- preview minha-fase
npm run chapter -- preview minha-fase --visual
npm run dev
```

- `validate` usa `StageRegistry`, `StageCatalogService`, `StageLoader` e
  `StageDirector`; erros retornam código 1.
- `inspect` mostra IDs, encontros, apresentação, elegibilidade e diagnósticos.
- `preview` headless valida, carrega no modo individual e projeta no World Lab.
- `preview --visual` prepara `http://localhost:5173/?chapterPreview=minha-fase`.
  Ele exige que o capítulo esteja em `src/examples/chapters/`.

O preview nunca altera o save da campanha principal nem o catálogo de produção.

## 9. Arquivos que podem ser modificados

Durante a autoria de uma fase, edite preferencialmente:

- manifesto e definição de mapa da fase;
- NPCs, diálogos, missões e eventos locais;
- testes e fixtures do próprio capítulo;
- a entrada de registro do capítulo, quando necessário.

Não edite, sem ampliação explícita de escopo:

- `src/scenes/GameScene.ts`;
- `src/combat/`, `src/procedural/`, `src/simulation/` ou `src/progression/`;
- outro capítulo;
- arquivos gerados manualmente ou seus índices.

A promoção de `src/examples/chapters/<slug>/` para
`src/stages/chapters/<chapter-id>/` é manual. No destino, um módulo de capítulo
só pode importar o próprio diretório, `src/stages/contracts/` e
`src/narrative/contracts/`.

## 10. Contratos preservados

- `LevelDefinition` continua sendo o formato de mapa;
- `StageModule` e `ChapterManifest` continuam sendo os contratos de fase e
  capítulo;
- IDs persistentes são estáveis e namespaced; nunca use índice de array, nome
  exibido ou coordenada como identidade;
- capabilities só aceitam IDs do perfil do runtime;
- salves e chaves existentes não mudam;
- o catálogo de produção não é alterado pela CLI.

## 11. Erros comuns

| Diagnóstico | Como evitar |
|---|---|
| `capability.unknown` | consulte `capabilities --json` antes de declarar |
| `capability.unavailable` | não use capability `planned` como `required` |
| `capability.category.mismatch` | use a categoria publicada para o ID |
| `stage.exit.anchor-not-walkable` | coloque a âncora sobre piso alcançável |
| `stage.exit.target-missing` | registre a fase de destino ou use `campaign.complete` |
| `stage.content.tile.unsupported` | use tiles numéricos `0..9` |
| `stage.content.enemy.unsupported` | use um dos seis arquétipos publicados |
| `stage.content.item.unsupported` | use `key`, `potion`, `health_herb` ou `mana_shard` |
| `stage.encounter.waves.empty` | declare ao menos uma onda com inimigos |
| `stage.encounter.enemy-level.invalid` | use nível inteiro de 1 a 10 |
| `stage.visual.theme.unknown` | declare o tema em `visualResources.themes` |
| `stage.visual.npc-sprite.missing` | mapeie cada `presentationId` em `presentation.npcSprites` |
| `chapter.dependency.missing` | declare a dependência entre capítulos |
| `stage.condition.flag.missing` | declare a flag em `narrative.flags` |
| `narrative.npc.dialogue.missing` | referencie um diálogo existente |
| `chapter.stage-order.mismatch` | ordene `stageIds` pela ordem dos manifestos |
| `chapter-exists` | escolha outro slug |
| `identity-collision` | escolha outro namespace/ID |

Para ver a lista completa, execute `validate` e leia os diagnósticos com
`code`, `severity`, `path` e `referenceId`.

## 12. Planejamento estruturado com `stage-plan.json`

Antes de implementar uma fase nova, descreva a intenção em
`src/examples/chapters/<slug>/stage-plan.json`. O plano é um artefato de
autoria: `StageModule` continua sendo a fonte de verdade do runtime e nada é
executado a partir do plano.

Campos obrigatórios: `schemaVersion: 1`, `kind: "umbra.stage-plan"`, `id`,
`title`, `summary`, `progression` (`linear` ou `branched`), `visualDirection`,
`startRegionId`, `exitRegionIds`, `regions`, `objectives` e `exitConditions`.
Opcionais: `stageId`, `themeCapabilityId`, `encounters`, `interactions` e
`capabilities`.

O plano cobre as três dimensões de autoria:

- **Narrativa:** `objectives` (`dependsOn`, `missionId`, `unlocksExitIds`) e
  `exitConditions`;
- **Cenário:** `regions`, `connections`, `startRegionId`, `exitRegionIds`,
  `visualDirection` e `themeCapabilityId`;
- **Mecânicas:** `encounters`, `interactions` e `capabilities`.

Cada região usa `role` `start`, `exploration`, `combat`, `objective` ou `exit`.
Conexões são a adjacência lógica entre regiões; a busca de conectividade é
indireta e não modela colisão física.

Plano mínimo válido:

```json
{
  "schemaVersion": 1,
  "kind": "umbra.stage-plan",
  "id": "plan.exemplo.farol",
  "title": "Farol de Vidro",
  "summary": "Uma câmara curta até o farol.",
  "progression": "linear",
  "visualDirection": "Pedra clara e luz fria.",
  "startRegionId": "region.exemplo.farol.entrada",
  "exitRegionIds": ["region.exemplo.farol.saida"],
  "regions": [
    { "id": "region.exemplo.farol.entrada", "title": "Entrada", "role": "start",
      "connections": ["region.exemplo.farol.saida"] },
    { "id": "region.exemplo.farol.saida", "title": "Saída", "role": "exit",
      "connections": ["region.exemplo.farol.entrada"] }
  ],
  "objectives": [
    { "id": "objective.exemplo.farol.acender", "title": "Acender o farol",
      "regionId": "region.exemplo.farol.entrada",
      "unlocksExitIds": ["exit.exemplo.farol.depart"] }
  ],
  "exitConditions": [
    { "exitId": "exit.exemplo.farol.depart", "regionId": "region.exemplo.farol.saida",
      "requiresObjectiveIds": ["objective.exemplo.farol.acender"] }
  ],
  "capabilities": [
    { "id": "navigation.authored-map", "category": "navigation",
      "minimumVersion": 1, "requirement": "required" }
  ]
}
```

Valide com:

```sh
npm run chapter -- plan validate minha-fase
npm run chapter -- plan validate minha-fase --json
```

O validador detecta regiões inexistentes ou desconectadas, objetivos
inexistentes ou em ciclo, saída sem condição, condição que referencia objetivo
inexistente e capability desconhecida ou planejada. Referências a interações são
locais ao capítulo e produzem `info`; temas não enumeráveis globalmente produzem
`warning`, nunca erro por ausência no catálogo.

Depois de validar o plano, implemente o `StageModule` correspondente e rode
`validate`, `inspect` e `preview`. O plano não altera nenhum capítulo em
execução; o exemplo real está em
`src/examples/chapters/igapo-das-memorias/stage-plan.json`.

## 13. Templates panorâmicos

`chapter create` aceita um template de geometria, uma seed e dimensões:

```sh
npm run chapter -- create travessia --template horizontal --seed 42
npm run chapter -- create bifurcacao --template branched --seed 42 \
  --width 104 --height 32 --regions 6
npm run chapter -- create camara --template room
```

| Template | Padrão | Uso |
|---|---|---|
| `room` | 19×11, 3 regiões | compatibilidade com o template clássico |
| `horizontal` | 96×30, 5 regiões | travessia contínua oeste→leste |
| `branched` | 100×34, 5 regiões | percurso principal com bifurcação física |

Limites: largura 32–160, altura 16–48, regiões 3–8; `branched` exige pelo menos
5 regiões. A seed é um inteiro não negativo de 32 bits. Valores inválidos
retornam código 2.

Os templates `horizontal` e `branched` geram uma faixa de terreno orgânica com
variação de altura, covas, obstáculos fora do percurso e regiões lógicas
distribuídas ao longo do mesmo cenário. O `branched` acrescenta um segundo
caminho físico entre `split` e `rejoin`; ele não é teletransporte nem sala
separada. O template `room` mantém exatamente o mapa 19×11 anterior.

O capítulo gerado contém:

| Arquivo | Papel |
|---|---|
| `geometry.ts` | gerador determinístico, regiões, âncoras e rotas |
| `stage-plan.json` | plano gerado com `template`, `chapterId` e âncoras |
| `index.ts` | template, seed, dimensões e número de regiões |

Para ajustar a fase sem reconstruir tudo, edite os parâmetros em `index.ts` ou
a lógica em `geometry.ts`; a seed e as dimensões originais permanecem legíveis.

`plan validate` compara o plano com o `StageModule` quando o capítulo tem
`index.ts`: identidade, template, progressão, âncoras caminháveis, conexões,
spawn e saída. Regiões sem `anchor` produzem `info`; divergências comprovadas
produzem erro. Depois valide o capítulo e abra o preview:

```sh
npm run chapter -- plan validate travessia
npm run chapter -- validate travessia
npm run chapter -- preview travessia --visual
npm run dev
```

O preview usa a câmera e o `StageMapRenderer` existentes. A homologação visual
precisa ser feita no navegador; `validate` e `preview` headless não comprovam
jogabilidade.

## 14. Playtest estático e múltiplas seeds

O `playtest` verifica se a fase é fisicamente percorrível pelo corpo real do
jogador e se a progressão declarada pode ser satisfeita. Ele não executa Phaser,
não simula combate e não substitui a homologação no navegador.

```sh
npm run chapter -- playtest minha-fase
npm run chapter -- playtest minha-fase --json
npm run chapter -- playtest minha-fase --seed 42
npm run chapter -- playtest minha-fase --seeds 5
```

`--seed` reproduz uma seed individual. `--seeds` avalia seeds consecutivas a
partir da seed autoral (`42` → `42, 43, ...`) e aceita de 1 a 25. As duas opções
são exclusivas. Capítulos sem a factory `createChapterTemplate` exportada
retornam `PLAYTEST_SEED_UNSUPPORTED` como UNKNOWN.

### O que é verificado

- o corpo físico real do jogador (`29 × 39` px, derivado de `Hero.ts`) passa
  pelo mapa em uma grade de clearance de 8 px;
- spawn, saída, regiões do plano, NPCs e inimigos de encontros obrigatórios são
  alcançáveis;
- passagens estreitas produzem `PASSAGE_TOO_NARROW` em vez de um falso aprovado;
- o template `branched` tem duas rotas físicas independentes entre `split` e
  `rejoin`;
- condições de saída, início de missões, objetivos e `stage.complete` são
  satisfatíveis pelo conteúdo declarado;
- o plano é comparado com a fase carregada por `validateStagePlan`;
- os limites de mundo da câmera são válidos.

Cada resultado é `PASS`, `FAIL` ou `UNKNOWN`. `UNKNOWN` cobre o que depende de
execução real (câmera, transição de cena, ordem de escolhas) e nunca é
apresentado como aprovação.

### Como ler o relatório

```sh
npm run chapter -- playtest minha-fase --json
```

O documento tem `schemaVersion: 1`, `kind: "umbra.stage-playtest.report"`,
`result`, `summary`, `validation`, `runtime` e `seeds[]`. Cada seed informa
`seed`, `source`, `result`, `character`, `checks`, `diagnostics`, `regions`,
`camera`, `plan` e `liveExecution`.

Códigos principais:

| Código | Significado |
|---|---|
| `NAVIGATION_PATH_CLEAR` / `NAVIGATION_PATH_BLOCKED` | spawn com ou sem espaço para o corpo |
| `PASSAGE_TOO_NARROW` | caminho por tiles existe, mas o corpo não passa |
| `REGION_UNREACHABLE` / `OBJECTIVE_UNREACHABLE` | região ou objetivo do plano inalcançável |
| `EXIT_UNREACHABLE` | saída inalcançável |
| `NPC_UNREACHABLE` / `ENCOUNTER_UNREACHABLE` | NPC ou inimigo obrigatório inalcançável |
| `BRANCH_PATH_BLOCKED` / `BRANCH_RETURN_BLOCKED` / `BRANCH_MAIN_PATH_BLOCKED` | bifurcação física inválida |
| `PROGRESSION_CONDITION_UNMET` | condição de saída comprovadamente impossível |
| `PROGRESSION_OBJECTIVE_UNSTARTABLE` | missão sem gatilho de início |
| `PROGRESSION_SIGNAL_UNSATISFIABLE` | objetivo pede um sinal que a fase não produz |
| `PROGRESSION_COMPLETION_UNREACHABLE` | nenhuma saída permite concluir |
| `TRANSITION_TARGET_INVALID` / `TRANSITION_UNVERIFIED` | destino inválido ou transição não executada |
| `CAMERA_BOUNDS_VALID` / `CAMERA_BOUNDS_INVALID` | limites de mundo da câmera |
| `REGION_ANCHOR_PENDING` | região do plano sem âncora física |
| `PLAYTEST_LIVE_EXECUTION_UNVERIFIED` | nenhum passeio real em Phaser |
| `PLAYTEST_SEED_UNSUPPORTED` | capítulo sem factory de geometria por seed |

Cada diagnóstico inclui `code`, `severity`, `message`, `location` quando
aplicável e `suggestion`.

### Exemplo aprovado

```text
Playtest: chapter.authoring.travessia — Travessia
Stage: stage.authoring.travessia.approach  Template: horizontal
Seeds: 1  Pass: 1  Fail: 0  Unknown: 0
Checks: 18 total, 0 failed, 3 unknown
Seed 42 (authored): PASS  plan=file  checks 18, 0 failed, 3 unknown
  Regions:
    PASS    region...start (start) @3,15 distance=0 — Region ... is reachable.
    PASS    region...exit (exit) @92,15 distance=2848 — Region ... is reachable.
  ...
Result: PASS
```

### Exemplo reprovado

Depois de inserir temporariamente uma coluna de parede no corredor:

```json
{
  "result": "FAIL",
  "diagnostics": [
    {
      "code": "EXIT_UNREACHABLE",
      "severity": "error",
      "message": "Exit exit.demo.playtest.depart at 92,14 is unreachable from spawn.",
      "location": { "x": 92, "y": 14 },
      "suggestion": "Remove or reposition solid tiles between spawn and the target."
    },
    {
      "code": "PROGRESSION_CONDITION_UNMET",
      "severity": "error",
      "message": "Exit exit.demo.playtest.depart condition cannot be produced by any reachable command.",
      "suggestion": "Add a reachable flag/mission producer, or make the exit unconditional."
    }
  ]
}
```

Remova a obstrução e repita o comando; a fase volta a `PASS`. Um teste
automatizado cobre exatamente esse ciclo de obstrução e restauração.

### Múltiplas seeds

```sh
npm run chapter -- playtest bifurcacao --seeds 10 --json
npm run chapter -- playtest bifurcacao --seed 48 --json
```

A lista de seeds é reproduzível e aparece no relatório. Se uma seed falhar, o
diagnóstico identifica a seed, a região e a sugestão; reproduza-a com `--seed`
para iterar sem gerar todas as outras.

### Limitações

O playtest é geométrico e estático. Ele não executa Arcade Physics, combate,
escolhas do jogador, dano, progressão persistente ou a cena Phaser. A câmera é
verificada apenas por limites de mundo. O resultado `PASS` significa que a
geometria e a satisfatibilidade narrativa foram comprovadas; a homologação no
navegador continua necessária e é declarada separadamente.
