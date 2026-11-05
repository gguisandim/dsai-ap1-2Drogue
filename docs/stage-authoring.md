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
