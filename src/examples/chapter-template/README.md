# Template de capítulo independente

Este diretório é um capítulo completo e executável criado apenas com os
contratos públicos do Umbra Trail. Ele demonstra o fluxo mínimo exigido de um
capítulo novo: identidade, revisão, mapa autoral, NPC, diálogo com escolha,
missão, encontro declarativo, evento, recompensa, apresentação, saída,
conclusão e testes.

O template **não** é registrado no catálogo de produção. Ele é carregado apenas
por um `StageRegistry` isolado criado em testes, ferramentas ou bootstraps de
desenvolvimento.

## Por que `src/examples/chapter-template/`

A localização preferida seria `examples/chapter-template/` na raiz. A
arquitetura atual usa `tsconfig.json` com `rootDir: "src"` e inclui somente
`src/**/*.ts`; o gate de arquitetura e o build também partem de `src`. Um
diretório fora de `src` ficaria fora do typecheck e dos gates. Por isso o
template fica aqui. Ele não é importado por `src/main.ts`, portanto não entra no
bundle nem no jogo de produção.

## CLI de autoria

Requisitos: Node e as dependências já instaladas. A CLI usa `ts-node`, que já é
dependência de desenvolvimento do projeto; não é necessário instalar nada novo.

O repositório oferece a CLI local `npm run chapter -- ...`:

```sh
npm run chapter -- create exemplo-floresta --title "Floresta das Raízes"
npm run chapter -- validate exemplo-floresta
npm run chapter -- inspect exemplo-floresta
npm run chapter -- inspect exemplo-floresta --json
npm run chapter -- preview exemplo-floresta
npm run chapter -- preview exemplo-floresta --visual
```

- `create` gera um capítulo independente a partir deste template em
  `src/examples/chapters/<slug>/`. O namespace derivado é
  `authoring.<slug-com-pontos>`; use `--namespace <id>` para escolher outro e
  `--revision <n>` para a revisão inicial.
- `validate` reutiliza `StageValidator`, `StageCatalogService`, `StageLoader` e
  `StageDirector`. Erros bloqueantes retornam código 1; avisos não bloqueiam.
- `inspect` mostra IDs, fases, encontros, apresentação, elegibilidade e
  diagnósticos; `--json` mantém os mesmos dados e códigos.
- `preview` é headless: valida, carrega no modo individual e projeta no World
  Lab, sem renderizar com Phaser. Com `--visual`, prepara a URL do bootstrap
  Phaser para o diretório canônico de autoria.
- `--chapters-dir <path>` permite um diretório de autoria alternativo; ele
  precisa estar dentro de `src/`.
- O catálogo de produção nunca é alterado. Capítulos gerados não são
  registrados automaticamente; use o `registration.ts` local.
- A CLI verifica path traversal, diretório existente, colisão de namespace/ID e
  criação atômica com limpeza do diretório temporário em caso de falha.

## 1. Estrutura dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `ids.ts` | deriva todos os IDs estáveis de um namespace |
| `level.ts` | mapa autoral (`LevelDefinition`), spawn, saída, item e decoração |
| `presentation.ts` | `ChapterVisualResources` e `StagePresentationDefinition` |
| `encounter.ts` | `StageEncounterDefinition` declarativo |
| `narrative.ts` | NPC, diálogo, missão, eventos e flags |
| `stage.ts` | `StageModule` completo |
| `chapter.ts` | `ChapterManifest` com capabilities e recursos visuais |
| `registration.ts` | `CampaignChapterEntry` e registro isolado |
| `template.ts` | factory `createChapterTemplate(namespace, opções)` |
| `index.ts` | exports e a instância padrão `CHAPTER_TEMPLATE` |

O teste de independência fica em `src/tests/chapterTemplate.test.ts` porque o
Jest só executa `src/tests`.

## 2. Como copiar o template

Opção A — copiar a pasta e trocar o namespace:

1. copie `src/examples/chapter-template/` para a pasta do seu capítulo;
2. troque o namespace padrão em `index.ts` (`createChapterTemplate('example.beacon')`);
3. ajuste títulos, textos, mapa, encontro e apresentação;
4. registre a entrada em um registry isolado (seção 10).

Opção B — usar a factory:

```ts
import { createChapterTemplate } from './examples/chapter-template';

const chapter = createChapterTemplate('meu.capitulo', {
  revision: 1,
  title: 'Meu Capítulo',
  stageTitle: 'Meu Capítulo — Entrada',
  summary: 'Resumo da fase.',
});
```

A factory devolve `{ ids, chapter, stage, entry }`. O teste do template cria uma
segunda cópia com `example.signal` e revisão 2 para provar que a estrutura é
copiável sem alterar o motor.

## 3. Quais IDs precisam ser alterados

Troque **um** valor: o namespace. Todos os IDs derivam dele:

- `chapter.<ns>`
- `stage.<ns>.approach`
- `npc.<ns>.warden`
- `dialogue.<ns>.warden`
- `mission.<ns>.relight`
- `encounter.<ns>.beacon`
- `exit.<ns>.depart`
- `flag.<ns>.arrived`, `flag.<ns>.accepted`, `flag.<ns>.beacon-lit`
- `event.<ns>.arrival`, `event.<ns>.warden`, `event.<ns>.beacon-lit`, `event.<ns>.depart`
- `operation.<ns>.light`
- IDs visuais (`theme.<ns>`, `tileset.<ns>`, `texture.<ns>.*`, `sprite.<ns>.*`, `audio-profile.<ns>`, `environment.<ns>`, `decor.<ns>.rune`).

Use apenas minúsculas, números, ponto, hífen e sublinhado. Não use índice de
array, nome exibido ou coordenada como identidade persistente.

## 4. Como definir uma fase

Em `stage.ts`, o manifesto declara:

- `schemaVersion: 1`
- `id`, `revision` e `chapterId`
- `order` (ordem determinística dentro do capítulo)
- `title`, `summary`
- `layout: { kind: 'authored' }`
- `exits`
- `completionMissionId`
- `capabilities`
- `presentation`
- `campaignCatalog`

O mapa fica em `authoredLevel`, produzido por `createTemplateLevel`. O
`ResolvedLevelValidator` exige borda fechada, pelo menos um spawn, pelo menos um
tile de saída ou boss, alcance do spawn até a saída e inimigos sobre piso
válido. Mantenha o mapa legível e não coloque posições de gameplay sobre parede
ou hazard.

## 5. Como criar NPCs e diálogos

Em `narrative.ts`:

- `npcs` declara `id`, `displayName`, `role`, `presentationId`, `spawn` e
  `interactionDialogueId`;
- `dialogues` declara `id`, `startNodeId` e nós;
- cada nó tem `speakerId` (`'player'`, `'narrator'` ou um NPC registrado),
  `text`, `choices` e/ou `nextNodeId`;
- cada escolha tem `id`, `text`, `nextNodeId` e comandos opcionais.

O template usa duas escolhas (`accept` e `observe`) e dois nós terminais. A
escolha `accept` executa `flag.set` e `mission.start`. Nenhum comando novo é
necessário.

Para o diálogo abrir ao interagir com o NPC, o evento `npc.interacted` usa
`dialogue.start`. O runtime entrega esse comando como adiado; a cena ou o
adaptador de UI chama `startDialogue`.

## 6. Como declarar encontros

Em `encounter.ts`, use `source: { kind: 'authored-waves', waves: [...] }`. Cada
onda tem `id`, `delayBeforeMs` (a primeira deve ser zero) e `enemies`. Cada
inimigo tem `type` (`affinity`, `applaud`, `fortitudo`, `ranged`, `boss` ou
`miniboss`), `x`, `y`, `level` de 1 a 10 e, opcionalmente, `patrol` e
`dropTable`.

O template usa dois arquétipos existentes em uma onda: `affinity` e `ranged`.
As coordenadas ficam sobre piso e são alcançáveis pelo spawn.

## 7. Como adicionar missões e recompensas

A missão em `narrative.ts` declara:

- `scope: 'stage'`
- `start: 'dialogue'` (a escolha inicia com `mission.start`)
- objetivos com `signal`, `target` e `filter`
- `rewards` opcionais

O template usa `signal: 'encounter.completed'` filtrado por `encounterId`. A
recompensa não fica na missão: o evento `encounter.completed` concede
`reward.grant` com `operationId` estável. Assim a recompensa é idempotente mesmo
se o evento for reenviado. Para recompensar a própria missão, use
`mission.rewards`; o `QuestEngine` gera o `reward.grant` automaticamente.

## 8. Como configurar assets

Em `presentation.ts`:

- `textures` mapeia IDs locais para `textureKey` existentes no jogo;
- `tilesets` precisa cobrir os dez tiles lógicos (`floor`, `wall`, `pillar`,
  `water`, `lava`, `exit`, `locked-door`, `chest`, `spawn`, `boss`);
- `themes` aponta para o tileset e para as decorações permitidas;
- `decorations` referencia texturas registradas;
- `sprites` cobre o NPC e os arquétipos usados;
- `sounds` aceita apenas síntese local (`kind: 'synth'`);
- `audioProfiles` referencia os sons;
- `environments` declara cor, luz e névoa.

O template reutiliza chaves técnicas já carregadas (`tile_floor`, `tile_wall`,
`item_chest`, `poi_vestige`, `enemy_melee_anim`, `enemy_ranged_anim`). Esses
mapeamentos são **placeholders técnicos**. Para substituir por arte definitiva,
adicione os novos `textureKey` ao pipeline de assets existente e troque apenas o
`textureKey` no recurso local. Não há novo asset manager.

Spritesheets podem declarar metadados de validação em `textures`
(`frameWidth`, `frameHeight`, `frameCount`) e selecionar um frame estático em
tiles, decorações e sprites com `frame`. Tiles de 16×16 continuam lógicos em
32×32 e são ampliados pelo renderer. Um frame fora do `frameCount` declarado, ou
ausente no `TextureManager`, falha com diagnóstico tipado. O exemplo real está
em `src/stages/chapters/aguas/igapoVisuals.ts` e em
`src/presentation/assets/punyAssetCatalog.ts`.

## 9. Como declarar saídas

No manifesto:

```ts
exits: [{
  id: ids.exitId,
  anchor: { kind: 'tile', x: 16, y: 5 },
  targetStageId: 'campaign.complete',
  condition: { type: 'flag.equals', flag: ids.flags.beaconLit, value: true },
}]
```

- `targetStageId` é uma definição de fase ou `campaign.complete`, nunca um
  `nodeId`.
- `anchor` pode ser `map-exit`, `player-spawn` ou `tile`.
- A condição é opcional. O template usa a flag acesa pelo evento.
- A saída é registrada em `stage.complete` pelo evento de
  `stage.exit.requested`.

## 10. Como registrar o capítulo

O ponto de extensão existente é o catálogo injetável de
`registerCampaignChapters`:

```ts
import { createChapterTemplateRegistry } from './examples/chapter-template';

const registry = createChapterTemplateRegistry(chapter.entry);
```

Por padrão ele registra os estágios legados, o catálogo de produção e o
template, tudo em memória. Para um ambiente totalmente isolado:

```ts
const isolated = createChapterTemplateRegistry(chapter.entry, false);
```

Se você já tem um registry com o catálogo de produção:

```ts
registerChapterTemplate(registry, chapter.entry);
```

O catálogo de produção `CAMPAIGN_CHAPTER_CATALOG` não é alterado. A limitação
atual é que o jogo de produção ainda não descobre capítulos por filesystem; um
bootstrap precisa injetar o registry. Isso fica para a 9.7B.

## 11. Como executar os testes

```sh
npx jest src/tests/chapterTemplate.test.ts --runInBand
npm run typecheck
```

O teste cobre:

- validação do registry e do manifesto;
- descoberta pelo `StageCatalogService` como `individual-only`;
- carregamento pelo `StageLoader`;
- mapa, encontro, apresentação, NPC, diálogo, missão e eventos;
- sequência narrativa completa;
- recompensa e conclusão idempotentes;
- reload pelo save existente;
- segunda cópia com novos IDs e revisão;
- mutações negativas com diagnósticos tipados;
- projeção no World Lab.

## 12. Como abrir o conteúdo no World Lab

O World Lab aceita um registry injetado:

```ts
import { WorldLabDataService } from '../../devtools/world-lab';
import { createChapterTemplateRegistry } from './examples/chapter-template';
import { CampaignGraphGenerator } from '../../stages';
import { WORLD_LAB_FIXTURE_CATALOG } from '../../devtools/world-lab/fixtures/fixtureCatalog';

const registry = createChapterTemplateRegistry(chapter.entry);
const graph = new CampaignGraphGenerator().generate({
  campaignId: 'world-lab.template',
  campaignRevision: 1,
  catalogRevision: 1,
  runId: 'world-lab.template.run',
  runSeed: 'world-lab.template.seed',
  templates: WORLD_LAB_FIXTURE_CATALOG,
  context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
});
// Substitua o stageId de um nó pelo stageId do seu capítulo e projete.
```

O teste `is projected by World Lab when its registry is injected` faz exatamente
essa projeção. A UI do World Lab usa o registry de produção por padrão; para ver
o template nela, injete o registry em um bootstrap de desenvolvimento. Não há
botão de descoberta automática nesta etapa.

## 13. Como testar a fase no jogo

O fluxo individual real é:

```ts
const service = new GameSessionService({
  registry: createChapterTemplateRegistry(chapter.entry),
});
const started = service.startIndividualStage(chapter.ids.stageId);
```

O `GameSessionService` lista a fase como `individual-only`, carrega o mapa e a
apresentação e devolve `loadedStage`. O teste `starts the template in individual
mode without campaign eligibility` cobre esse caminho.

A partir da 9.7C existe um bootstrap real de desenvolvimento. Gere um capítulo
com a CLI e execute:

```sh
npm run chapter -- preview meu-capitulo --visual
npm run dev
```

O comando imprime `http://localhost:5173/?chapterPreview=meu-capitulo`. A
`BootScene` usa `import.meta.glob` restrito a `src/examples/chapters/*/index.ts`,
valida o capítulo, registra-o em um `StageRegistry` isolado e inicia uma sessão
individual na `GameScene`. O catálogo de produção e o save da campanha principal
não são alterados. A seleção visual só existe em host de desenvolvimento; o
bundle de produção não importa os capítulos gerados.

A homologação visual com captura no navegador deve ser registrada apenas quando
executada de fato.

## 14. Como interpretar diagnósticos

Use os validadores existentes; não escreva um validador paralelo.

- `StageValidator.validateModule`: manifesto, capabilities, encontro,
  condições, saídas, diálogo de entrada e missão de conclusão.
- `StageValidator.validate`: capítulos, IDs duplicados, referências de saída,
  ordem das fases, grafo de capítulo e recursos visuais.
- `StageLoader`: referências de capítulo/destino, revisão de save, mapa
  resolvido, encontro e apresentação.
- `NarrativeRegistry`/`StageDirector.create`: NPCs, diálogos, missões, eventos,
  comandos e condições narrativas.
- `StageCatalogService`: elegibilidade, loadability, capabilities e dependências.

Códigos comuns:

| Código | Significado |
|---|---|
| `stage.id.invalid` | ID de fase fora do padrão estável |
| `stage.revision.invalid` | revisão não é inteiro positivo |
| `stage.exit.target-missing` | destino de saída não registrado |
| `stage.exit.anchor-not-walkable` | âncora da saída sobre parede/hazard |
| `stage.encounter.waves.empty` | encontro sem ondas |
| `stage.encounter.archetype.unknown` | arquétipo de inimigo inexistente |
| `capability.unavailable` | capability planejada ou indisponível |
| `chapter.dependency.missing` | dependência obrigatória ausente |
| `stage.visual.theme.unknown` | tema não registrado |
| `narrative.npc.dialogue.missing` | NPC aponta para diálogo ausente |
| `registry.stage.duplicate` | ID de fase repetido |
| `chapter.stage-order.mismatch` | `stageIds` fora da ordem dos manifestos |

## Elegibilidade e campanha

O template declara:

```ts
campaignCatalog: {
  availability: 'available',
  participation: 'individual-only',
  role: 'standard',
  regionIds: ['region.<ns>'],
  biomeIds: ['crypt'],
  difficulty: { minimum: 1, maximum: 1 },
  revisit: 'checkpoint',
}
```

Com isso ele aparece no modo individual e **não** é candidato das políticas
`umbra.fixed-nine.v1` e `umbra.branching-nine.v1`.

Para participar de campanhas no futuro, um autor deve:

1. declarar `participation: 'candidate'` (ou `'narrative-milestone'` com
   `role: 'milestone'`);
2. declarar `difficulty`, `allowedActIds` e `maximumPhysicalExits`;
3. garantir que o mapa tenha capacidade física real para as saídas;
4. declarar `providesBeatIds` quando for um marco;
5. escolher `revisit` (`forbidden`, `checkpoint` ou `repeatable`);
6. fornecer um catálogo com pelo menos nove definições elegíveis para compor
   uma campanha completa.

Não promova o template a candidato apenas para fazê-lo aparecer no compositor.

## Limitações desta etapa

- o catálogo de produção é uma lista estática em TypeScript;
- não há CLI, editor, descoberta automática ou carregamento remoto;
- o template é `individual-only`;
- a UI do jogo e o World Lab precisam de um registry injetado para vê-lo;
- a homologação visual no navegador não foi executada neste ambiente.

## Próxima etapa (9.7B)

A factory `createChapterTemplate(namespace, opções)` já separa IDs, conteúdo e
registro. A 9.7B pode usá-la para gerar uma pasta, substituir namespace/títulos,
validar o capítulo recém-copiado e abrir um preview, sem alterar o motor.
