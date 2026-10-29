# Arquitetura de campanha narrativa modular *(2026-10-27)*

## Estado desta SPEC

Esta SPEC prepara a evolução do Umbra Trail para um Action RPG roguelite amazônico com campanha narrativa modular. Ela define fronteiras, contratos propostos, compatibilidade e ordem de migração. Nesta etapa não altera jogabilidade, não reescreve `GameScene`, não cria campanha ou assets e não modifica combate nem geração procedural.

Os blocos TypeScript deste documento são contratos propostos. Eles só passam a ser API pública depois de implementados e exportados por `src/stages/index.ts` em uma etapa posterior.

## Objetivo

Permitir que um agente implemente ou revise um capítulo, uma fase, seus NPCs, diálogos, missões e eventos lendo apenas:

- `AGENTS.md`;
- esta SPEC e a SPEC narrativa do capítulo;
- os contratos públicos de `src/stages/contracts/`;
- o manifesto do capítulo e o módulo da fase;
- testes e fixtures locais.

O agente não deve precisar compreender nem modificar Phaser, `GameScene`, combate, simulação, progressão persistente ou o pipeline procedural.

## Restrições preservadas

- jogabilidade, balanceamento e fluxo atual permanecem iguais durante a extração;
- `GameScene` continua sendo o orquestrador legado nesta etapa;
- `src/combat/` e `src/procedural/` não são modificados;
- código gerado não é removido nem reescrito para reduzir LOC;
- nenhuma campanha, capítulo amazônico, NPC final, texto narrativo ou asset novo é criado agora;
- SPEC, prompts, testes, auditoria e trailers de commit continuam obrigatórios;
- contratos novos existem apenas quando há um consumidor previsto na ordem de migração.

## Inventário: existente versus proposto

| Área | Estado | Contrato ou implementação atual | Destino proposto |
|---|---|---|---|
| Fase autoral | Existente | `LevelDefinition`, `EnemyPlacement`, `ItemPlacement`, `DecorationPlacement` | permanece como formato de execução legado e payload de mapa autoral |
| Fases atuais | Existente | `VERSE_SECTIONS`, `ALL_LEVELS`, `CorridorLevelData` | registradas por adaptadores sem alterar IDs ou dados |
| Fase procedural | Existente | `ProceduralLevelFactory`, `LevelDefinitionAdapter`, presets e semente | chamada pelo `StageLoader`; algoritmo e saída não mudam |
| Simulação | Existente | `SimulationKernel`, eventos tipados, `GameSimulationBridge` | fonte de sinais de domínio via adaptador; não conhece capítulos |
| Combate | Existente | `CombatRuntime`, `GameCombatBridge` | serviço opaco para fases; contratos narrativos não calculam dano |
| Progressão | Existente | `ProgressionService`, estado v1, storage `vigrid-progression-v1` | continua autoritativa para XP, moeda, maestria e desbloqueios atuais |
| Editor | Existente | `LevelEditorModel`, `DocumentSerializer` v1 | continua importando/exportando `LevelDefinition`; conversor futuro é aditivo |
| Diálogos e quests gerados | Removido em 2026-10-29 | os packs genéricos de `src/content/` não possuíam consumidor | conteúdo futuro exige SPEC e integração com os contratos narrativos públicos |
| Registro de fases | A implementar | inexistente | `StageRegistry` |
| Carregamento e validação | A implementar | decisões dentro de `GameScene` | `StageLoader` e validadores headless |
| Manifesto modular | A implementar | dados espalhados por `LevelDefinition`, arrays e cena | `StageManifest`, `ChapterManifest`, `StageModule` |
| Narrativa/NPC/diálogo/missão | A implementar | sem contrato jogável | contratos declarativos desta SPEC |
| Estado de campanha e run | A implementar | apenas índice/halos no restart e progressão v1 | saves aditivos `umbra-trail-campaign-v1` e `umbra-trail-run-v1` |
| Runtime narrativo | A implementar depois do loader | inexistente | `StageDirector` headless consumindo sinais e emitindo comandos |

## Contratos públicos atuais relevantes

### Simulação

O núcleo já oferece relógio fixo, aleatoriedade semeada, eventos ordenados, snapshots e `Result`. `GameSimulationBridge` sincroniza posição e recursos e registra dano, item, onda e entrada de sala. Eventos novos precisam de payload validável e registro em `EventRegistry`; publicar strings livres diretamente no kernel não é compatível com a disciplina atual.

Consequência: o runtime narrativo deve receber uma união pequena de sinais normalizados por um adaptador. Módulos de fase não importam `SimulationKernel`, `EventBus` ou contratos internos.

### Combate

`GameCombatBridge` recebe definição de classe e semente, sincroniza vida/mana e calcula prévias de dano. `CombatRuntime` e seus tipos são independentes de Phaser, mas uma fase não deve conhecer combatentes concretos nem emitir dano.

Consequência: narrativa reage a fatos como `enemy.defeated` ou `encounter.completed`; nunca chama o motor de dano nem redefine habilidades.

### Geração procedural

`ProceduralLevelFactory.create` e `createRun` produzem `LevelDefinition` por meio de `ProceduralPipeline` e `LevelDefinitionAdapter`. Preset + semente determinam a saída. O pipeline valida conectividade antes e depois do planejamento de conteúdo, mas, quando o reparo final é necessário, retorna o mapa reparado sem uma nova chamada explícita ao validador; hoje os testes procedurais fazem essa confirmação externamente.

Consequência: `StageLoader` deve delegar a geração a essa fábrica, preservar preset/semente e tratar o `LevelDefinition` resultante como o mesmo formato consumido pelas fases autorais.

### Progressão e persistência

`ProgressionService` persiste o esquema v1 em `vigrid-progression-v1`. `recordStageCompleted` incrementa contadores, deriva `chapter` da quantidade de fases concluídas e desbloqueia `stage-<id>`/`chapter-<número>`. Esse `chapter` é progressão numérica existente, não identidade narrativa.

Consequência: `chapterId` narrativo deve ser um novo campo em save separado. Não se deve reinterpretar `ProgressionState.chapter` nem `ProgressionState.quests` durante a migração.

### Fases e editor

`LevelDefinition` mistura mapa, apresentação, spawns, ondas, saídas e recompensa. O editor serializa o objeto em `umbra-editor-document` v1 com checksum. A validação implementada no editor cobre matriz, tiles, presença de spawn/saída, limites, dificuldade e tempo, mas ainda não confirma caminho entre início e saída nem rejeita entidade sobre tile sólido, apesar dos critérios da SPEC do editor. Esse formato é útil e deve continuar aceito, mas não representa campanha, narrativa ou dependências e não pode ser tratado como validado apenas por ter um checksum correto.

## Mapa dos acoplamentos atuais

| Ponto | Origem -> destino | Acoplamento observado | Efeito sobre fases independentes | Costura de migração |
|---|---|---|---|---|
| Seleção da run | `GameScene` -> `VERSE_SECTIONS`/procedural | cena escolhe arrays, query string, presets e índice | capítulo precisa editar a cena | `ChapterManifest` + `StageRegistry` + adaptador legado |
| Identidade | `GameScene` -> índice/nome | índice entra em save transitório/chaves; nome entra em eventos | reordenação ou tradução quebra referências | IDs estáveis em manifestos e eventos |
| Mapa | `GameScene` -> valores numéricos 0..9 | render e colisão interpretam tiles diretamente | nova fase depende de conhecimento da cena | loader entrega `LevelDefinition` validado; renderer continua legado |
| Metadados de fase | `LevelDefinition` -> cena | descrição, tema, música, ambiente, fog, luz, decorações, exits, boss e unlock não são consumidos pelo `GameScene` atual | autor pode declarar efeito que não aparece | validador distingue dado aceito de recurso realmente suportado; sem promessas implícitas |
| Inimigos | `GameScene.spawnSingleEnemy` -> classes concretas | `if` por string e fallback silencioso para melee | ID inválido vira outro inimigo | catálogo/validador de IDs antes do load; fábrica permanece interna |
| Itens | `GameScene.spawnEnemiesAndItems` -> `Item` | strings são colapsadas em quatro tipos e fallback para halo | manifesto não sabe o que é suportado | catálogo público de IDs aceitos e diagnóstico |
| Decorações | `LevelDefinition` -> cena | declaradas e geradas, mas não renderizadas por `GameScene` | contrato anuncia dado sem consumidor | marcar como compatibilidade pass-through; não prometer efeito |
| Ondas | cena -> `waves`/`enemies` | cena cria ondas implícitas, injeta miniboss por índice e usa atraso fixo | regras mudam conforme posição no array | loader normaliza somente dados; caracteriza comportamento antes de extrair |
| Saídas | tile 5 -> avanço linear | overlap sempre chama `advanceToNextLevel` | não há rota declarativa | saídas por `stageId`; adaptador linear para legado |
| Seções | `SectionExit` -> método privado | contrato e `transitionToSection` existem, mas não há callsite | saídas declaradas não governam portas | teste de caracterização; não assumir que o recurso funciona |
| Chaves | cena -> `currentLevelIndex:x,y` | identidade depende de ordem e coordenada; estado é apenas da instância da cena | mover item invalida estado | `entityId` estável + flags de run futuras |
| Transição | cena -> limpeza de grupos/câmera/player | ciclo de vida duplicado em dois métodos | toda rota exige editar a cena | futuro adaptador de `LoadedStage`; não reescrever nesta etapa |
| Progressão | cena -> `ProgressionService` | conclusão concede recompensa e atualiza HUD diretamente | missão pode premiar duas vezes | comandos idempotentes; progressão continua única escritora |
| Eventos | cena -> bridges + eventos Phaser string | parte tipada no kernel e parte local sem contrato | narrativa observaria duas fontes | `StageSignalAdapter` unifica fatos sem recalculá-los |
| Save de run | restart da cena -> init data | somente índice, halos e configuração procedural | não retoma missões/flags | save aditivo com IDs/revisão e fallback legado |
| Editor | `EditorScene` -> `ALL_LEVELS` | editor abre catálogo global por índice | fase modular não é descobrível | converter manifesto <-> documento v1 em etapa posterior |
| Conteúdo gerado | removido na Etapa 9.2A.3 após prova de zero consumidores | `DialogueEntry`/`QuestEntry` eram genéricos e repetidos por pack | volume não criava narrativa executável | não recriar sem consumidor, SPEC e testes concretos |

## Direção de dependências

```text
chapter/stage module
        |
        v
stage contracts  <-  StageRegistry
        |                |
        +-------> StageLoader <------- legacy/procedural adapters
                         |
                         v
                    LoadedStage
                         |
                         v
                 GameScene adapter (futuro)
                         |
          +--------------+--------------+
          v              v              v
     simulation       combat        progression
       signals       (opaco)      commands/rewards
```

Regras:

- setas apontam para dependências permitidas;
- contratos de stage não dependem de Phaser;
- capítulos dependem apenas dos contratos;
- adapters podem depender dos sistemas existentes;
- sistemas existentes não dependem de capítulos;
- `GameScene` recebe resultado carregado no futuro, mas continua responsável pela apresentação enquanto não houver SPEC de extração.

## Contratos propostos

### Tipos básicos, capítulo e módulo

```ts
export type ChapterId = string;
export type StageId = string;
export type NpcId = string;
export type DialogueId = string;
export type MissionId = string;
export type StageFlag = string;

export type StageAnchor =
  | { kind: 'tile'; x: number; y: number }
  | { kind: 'player-spawn'; offsetX?: number; offsetY?: number }
  | { kind: 'map-exit' };

export interface ChapterManifest {
  schemaVersion: 1;
  id: ChapterId;
  revision: number;
  title: string;
  stageIds: readonly StageId[];
  entryStageId: StageId;
  tags?: readonly string[];
}

export interface StageModule {
  manifest: StageManifest;
  authoredLevel?: LevelDefinition;
  narrative?: NarrativeDefinition;
  npcs?: readonly NpcDefinition[];
  dialogues?: readonly DialogueDefinition[];
  missions?: readonly MissionDefinition[];
  events?: readonly StageEventRule[];
}
```

IDs devem usar namespace estável, por exemplo `chapter-id.stage-id`, `chapter-id.npc-id`. Nome exibido, ordem e caminho de arquivo não são identidade.

### `StageManifest`

```ts
export type StageLayoutSource =
  | { kind: 'authored' }
  | { kind: 'legacy'; levelId: string }
  | {
      kind: 'procedural';
      preset: PresetId;
      seed: 'run';
      overrides?: Readonly<Partial<Omit<GeneratorOptions, 'seed'>>>;
    };

export interface StageExitDefinition {
  id: string;
  anchor: StageAnchor;
  targetStageId: StageId | 'campaign.complete';
  condition?: StageCondition;
}

export interface StageManifest {
  schemaVersion: 1;
  id: StageId;
  revision: number;
  chapterId: ChapterId;
  order: number;
  title: string;
  summary: string;
  layout: StageLayoutSource;
  exits: readonly StageExitDefinition[];
  entryDialogueId?: DialogueId;
  completionMissionId?: MissionId;
  tags?: readonly string[];
}
```

Decisões:

- `authoredLevel` fica no `StageModule`, não duplicado no manifesto;
- `legacy` aponta para ID existente e nunca para índice;
- procedural usa sempre a semente da run combinada com `stageId`; um preset fixo permanece reproduzível;
- anchors de tile são validados contra o mapa resolvido; `player-spawn` e `map-exit` permitem posicionamento estável em mapas procedurais;
- a versão pertence ao esquema e a revisão pertence ao conteúdo;
- o manifesto não contém funções, cenas, classes concretas ou assets obrigatórios.

### `StageRegistry`

```ts
export interface StageRegistry {
  register(module: StageModule): void;
  registerChapter(chapter: ChapterManifest, stages: readonly StageModule[]): void;
  get(stageId: StageId): StageModule | undefined;
  require(stageId: StageId): StageModule;
  getChapter(chapterId: ChapterId): ChapterManifest | undefined;
  listChapter(chapterId: ChapterId): readonly StageManifest[];
  validate(): readonly StageDiagnostic[];
}
```

Responsabilidades:

- rejeitar IDs duplicados e módulo registrado em capítulo incompatível;
- garantir que `entryStageId`, `stageIds` e saídas locais existam;
- manter ordem determinística;
- não carregar Phaser, instanciar inimigos, gerar mapa nem acessar storage;
- não fazer descoberta dinâmica, download ou plugin em runtime. O registro é estático e empacotado pelo Vite.

### `StageLoader`

```ts
export interface StageResumeState {
  stageId: StageId;
  manifestRevision: number;
  /** Ausente apenas em snapshots anteriores ao reforço da Etapa 2. */
  runId?: string;
  /** Ausente apenas em snapshots anteriores ao reforço da Etapa 2. */
  runSeed?: string | number;
  flags: Readonly<Record<string, boolean | number | string>>;
  missionStates: Readonly<Record<MissionId, MissionState>>;
  collectedEntityIds: readonly string[];
  appliedOperationIds: readonly string[];
}

export interface StageLoadRequest {
  stageId: StageId;
  runId: string;
  runSeed: string | number;
  resume?: StageResumeState;
}

export interface LoadedStage {
  manifest: StageManifest;
  level: LevelDefinition;
  narrative: NarrativeDefinition;
  npcs: readonly NpcDefinition[];
  dialogues: readonly DialogueDefinition[];
  missions: readonly MissionDefinition[];
  events: readonly StageEventRule[];
  diagnostics: readonly StageDiagnostic[];
}

export interface StageLoader {
  load(request: StageLoadRequest): Result<LoadedStage, StageLoadFailure>;
}

export interface StageLoadFailure {
  code: 'invalid-request' | 'stage-not-found' | 'invalid-manifest' |
        'invalid-reference' | 'generation-failed' | 'invalid-level' |
        'incompatible-save' | 'load-failed';
  stageId: StageId;
  diagnostics: readonly StageDiagnostic[];
}
```

Ordem obrigatória do loader:

1. validar a estrutura da requisição na fronteira pública;
2. resolver módulo pelo registry;
3. validar schema, IDs e referências locais;
4. validar estrutura, fase, revisão e vínculo de run do resume sem mutar o save;
5. resolver `LevelDefinition` autoral, legado ou procedural;
6. executar os validadores existentes de mapa/conectividade aplicáveis e completar as lacunas de validação do formato legado;
7. devolver cópias defensivas e diagnósticos;
8. em qualquer erro, não devolver fase parcial como sucesso nem propagar exceção não tipada.

O loader não cria entidades Phaser, não concede recompensa, não persiste e não altera o mapa produzido pelo pipeline fora dos reparos que o pipeline atual já executa.

### Narrativa e contexto reduzido

```ts
export interface NarrativeDefinition {
  entryDialogueId?: DialogueId;
  flags?: Readonly<Record<StageFlag, boolean | number | string>>;
}

export interface StageContext {
  chapterId: ChapterId;
  stageId: StageId;
  runId: string;
  runSeed: string;
  flags: Readonly<Record<StageFlag, boolean | number | string>>;
  missions: Readonly<Record<MissionId, MissionState>>;
  progression: {
    level: number;
    unlockedContent: readonly string[];
  };
}
```

`StageContext` é uma projeção somente leitura. Ele não expõe `ProgressionService`, mundo ECS, cena, grupos Phaser ou storage. Escritas ocorrem apenas por comandos validados.

### NPCs e diálogos

```ts
export interface NpcDefinition {
  id: NpcId;
  displayName: string;
  role: 'story' | 'quest' | 'merchant' | 'ambient';
  presentationId: string;
  spawn: StageAnchor;
  interactionDialogueId?: DialogueId;
  condition?: StageCondition;
}

export interface DialogueDefinition {
  id: DialogueId;
  startNodeId: string;
  nodes: readonly DialogueNode[];
}

export interface DialogueNode {
  id: string;
  speakerId: NpcId | 'player' | 'narrator';
  text: string;
  choices?: readonly DialogueChoice[];
  nextNodeId?: string;
  onEnter?: readonly StageCommand[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  condition?: StageCondition;
  nextNodeId: string;
  commands?: readonly StageCommand[];
}
```

Validação mínima: IDs únicos, `startNodeId` existente, speaker existente, destinos existentes, pelo menos uma terminação alcançável e nenhum ciclo sem escolha ou saída explícita. Texto é dado; marcadores executáveis e callbacks são proibidos.

### Missões

```ts
export interface MissionDefinition {
  id: MissionId;
  title: string;
  description: string;
  scope: 'stage' | 'chapter' | 'campaign';
  start: 'stage-enter' | 'dialogue' | 'event';
  objectives: readonly MissionObjective[];
  rewards?: readonly StageReward[];
}

export interface StageSignalFilter {
  field: 'stageId' | 'enemyId' | 'archetype' | 'itemId' | 'itemType' |
         'encounterId' | 'npcId' | 'dialogueId' | 'missionId' | 'exitId';
  equals: string;
}

export interface MissionObjective {
  id: string;
  description: string;
  signal: StageSignal['type'];
  target: number;
  filter?: StageSignalFilter;
  optional?: boolean;
}

export interface MissionState {
  status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  objectives: Readonly<Record<string, number>>;
}

export type StageReward =
  | { type: 'progression.unlock'; contentId: string }
  | { type: 'progression.currency'; amount: number }
  | { type: 'stage.flag'; flag: StageFlag; value: boolean | number | string };
```

Recompensas são comandos para a autoridade existente. IDs de comando e missão tornam a aplicação idempotente. A camada narrativa não altera `ProgressionState` diretamente.

### Sinais, condições, eventos e comandos

```ts
export type StageSignal =
  | { type: 'stage.entered'; stageId: StageId }
  | { type: 'enemy.defeated'; enemyId: string; archetype: string }
  | { type: 'item.collected'; itemId: string; itemType: string }
  | { type: 'encounter.completed'; encounterId: string }
  | { type: 'npc.interacted'; npcId: NpcId }
  | { type: 'dialogue.completed'; dialogueId: DialogueId }
  | { type: 'mission.completed'; missionId: MissionId }
  | { type: 'stage.exit.requested'; exitId: string };

export type StageCondition =
  | { type: 'flag.equals'; flag: StageFlag; value: boolean | number | string }
  | { type: 'mission.status'; missionId: MissionId; status: MissionState['status'] }
  | { type: 'progression.unlocked'; contentId: string }
  | { type: 'all'; conditions: readonly StageCondition[] }
  | { type: 'any'; conditions: readonly StageCondition[] }
  | { type: 'not'; condition: StageCondition };

export interface StageEventRule {
  id: string;
  once: boolean;
  when: StageSignal['type'];
  filter?: StageSignalFilter;
  condition?: StageCondition;
  commands: readonly StageCommand[];
}

export type StageCommand =
  | { type: 'dialogue.start'; dialogueId: DialogueId }
  | { type: 'mission.start'; missionId: MissionId }
  | { type: 'mission.advance'; missionId: MissionId; objectiveId: string; amount: number }
  | { type: 'flag.set'; flag: StageFlag; value: boolean | number | string }
  | { type: 'exit.unlock'; exitId: string }
  | { type: 'stage.complete'; exitId: string }
  | { type: 'reward.grant'; reward: StageReward; operationId: string };
```

Esta lista deve crescer somente quando existir consumidor e teste. O validador confirma que o campo de um filtro existe no tipo de sinal escolhido. Não se aceita comando genérico `execute`, nome de método, código em string ou callback. O futuro `StageDirector` recebe sinais, avalia condições de modo determinístico e entrega comandos ao adaptador responsável.

### Diagnósticos

```ts
export interface StageDiagnostic {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  path: readonly (string | number)[];
  stageId?: StageId;
  referenceId?: string;
}
```

Diagnósticos são dados testáveis. Erros bloqueiam o load; warnings acompanham `LoadedStage`.

## Estrutura de módulos autocontidos

```text
src/stages/
  index.ts
  contracts/
    index.ts
    StageManifest.ts
    StageNarrative.ts
    StageSave.ts
  runtime/
    StageRegistry.ts
    StageLoader.ts
    StageValidator.ts
  compatibility/
    LegacyLevelAdapter.ts
    LegacyRunAdapter.ts
  chapters/
    <chapter-id>/
      index.ts
      chapter.manifest.ts
      CONTEXT.md
      <stage-id>/
        index.ts
        stage.manifest.ts
        level.ts
        narrative.ts
        npcs.ts
        dialogues.ts
        missions.ts
        events.ts
        stage.test.ts
```

Arquivos vazios não são obrigatórios. Uma fase sem NPC, por exemplo, omite `npcs.ts`. `index.ts` é a única superfície importada pelo registry.

`CONTEXT.md` deve conter somente contexto autoral necessário: premissa, estado de entrada, personagens permitidos, saídas obrigatórias, vocabulário cultural validado, restrições e IDs públicos. Ele não replica a arquitetura do motor.

## Contexto mínimo e responsabilidades dos agentes

| Papel | Deve ler | Pode alterar | Não deve alterar |
|---|---|---|---|
| Contratos/runtime de stage | SPEC, contratos atuais dos sistemas, testes de integração | `src/stages/contracts`, registry, loader, validators, adapters e testes | jogabilidade, combate, procedural, conteúdo de capítulo |
| Capítulo | `AGENTS.md`, esta SPEC, SPEC/`CONTEXT.md` do capítulo, contratos de stage | somente diretório do capítulo e testes locais | cena, motor, outros capítulos, saves |
| Fase | o mesmo, limitado ao manifesto do capítulo e fase | módulo da fase e entrada no manifesto do capítulo | registry global, cena, sistemas |
| Narrativa | contratos narrativos, NPCs e IDs da fase | diálogos, missões e eventos locais | mapa, combate, geradores, progressão direta |
| Compatibilidade | esta SPEC e formatos legados | adapters/migrations/testes | apagar ou renomear dados legados |

Contrato de entrega de um agente de capítulo:

1. nenhuma alteração fora do diretório autorizado, exceto registro explicitamente solicitado;
2. manifesto validado sem IDs duplicados ou referências ausentes;
3. grafo de diálogos e objetivos testados sem Phaser;
4. nenhuma importação de implementação do motor;
5. SPEC e trailers de commit preservados;
6. build e testes relevantes reportados.

## Compatibilidade

### Saves e configurações atuais

As chaves atuais permanecem inalteradas:

- `umbra-trail-profile` para aparência;
- `umbra-trail-settings` para preferências;
- `vigrid-progression-v1` para progressão persistente.

Novos dados são aditivos. O contrato efetivo da Etapa 4 substitui os dois
rascunhos independentes `CampaignSaveV1`/`RunSaveV1` por um envelope narrativo
vinculado à run ativa, sem copiar o payload de `StageResumeState`:

```ts
export interface CampaignSaveIdentity {
  campaignId: string;
  runId: string;
  runSeed: string;
  chapterId: ChapterId;
  stageId: StageId;
  manifestRevision: number;
}

export interface CampaignSaveEnvelope {
  schema: 'umbra-trail-campaign-save';
  version: 1;
  identity: CampaignSaveIdentity;
  narrative: NarrativeStateSnapshot;
  migration?: {
    source: 'stage-resume';
    sourceVersion: 0;
  };
}

export type CampaignSaveResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CampaignSaveFailure };
```

`umbra-trail-campaign-v1` é a única chave escrita por esta etapa. A chave
`umbra-trail-run-v1` permanece reservada para a integração da Etapa 5, quando o
adapter de cena tiver dados concretos de mapa/coleta para produzir um
`StageResumeState`; inventar esses dados agora duplicaria responsabilidade e
criaria uma segunda fonte de verdade.

Regras de migração:

- ausência dos novos saves mantém o fluxo atual;
- o índice transitório atual é convertido para ID pela tabela congelada do adapter, nunca pela ordem nova do registry;
- halos transitórios do `Player` não são confundidos com `ProgressionState.currency`;
- `ProgressionState.chapter` continua numérico e não recebe `chapterId`;
- operações de recompensa usam `operationId` qualificado por run/capítulo/fase e
  entram primeiro numa fila persistente de pendências;
- revisão igual retoma normalmente; revisão diferente passa por migrator explícito ou volta ao início da fase preservando progressão/campanha reconhecida;
- IDs desconhecidos produzem diagnóstico e fallback seguro; o JSON original não é sobrescrito antes de uma migração bem-sucedida.

### Fases atuais

- IDs de `LevelDefinition` atuais são preservados.
- O fluxo padrão atual usa `VERSE_SECTIONS`; deve permanecer idêntico durante as primeiras etapas.
- `ALL_LEVELS` continua disponível ao editor e a consumidores existentes.
- O modo procedural continua ativado pela mesma entrada e usa os mesmos presets, sementes, IDs `procedural-floor-N` e `LevelDefinitionAdapter`.
- O adapter legado cria manifestos somente em memória; não copia nem apaga as definições atuais.
- Comportamentos implícitos da cena, como miniboss de fallback, atraso fixo de onda, resets e revelação da saída, são cobertos por testes de caracterização antes de qualquer extração.

### Editor

- `umbra-editor-document` v1 continua aceito e semanticamente idêntico.
- A primeira integração apenas converte o payload `LevelDefinition` em `StageModule` autoral temporário.
- Um formato de editor v2 só pode ser introduzido com importador v1, exportação versionada e testes de round-trip.

## Migração incremental

### Etapa 0 — baseline e caracterização

Sem alterar produção, adicionar testes que congelem:

- ordem e IDs do fluxo padrão;
- resultado do factory procedural para semente/presets fixos;
- regras atuais de onda, saída, recompensa, morte e restart;
- round-trip do editor v1;
- leitura das três chaves de storage atuais.

Critério de saída: testes falham se uma extração futura alterar o comportamento observado.

#### Baseline de caracterização — 2026-10-28

Esta etapa é executada exclusivamente por testes e documentação. Ela não introduz
contratos de campanha, não altera `GameScene` e não modifica combate, simulação,
progressão ou geração procedural.

Prova automatizada: `src/tests/stageCharacterization.test.ts`, com 16 testes de
caracterização.

Cobertura headless implementada:

- seleção e sequência do fluxo autoral atual, incluindo limites de índice;
- sequência padrão de presets procedurais e determinismo para seed fixa;
- composição das ondas autorais e do fallback legado, início/conclusão de onda e
  liberação de saídas após a última onda;
- transição normal, conclusão da última fase, proteção contra transição duplicada
  e restart após morte;
- argumentos e efeitos persistidos da recompensa de fase, inclusive o
  comportamento atual de conclusões repetidas;
- round-trip do documento de editor v1;
- chaves e formatos atuais de progressão, aparência e configurações.

Comportamentos que um teste Node não valida integralmente sem inicializar Phaser:

- ordem real de callbacks de `overlap`/`collider` e o contato físico com tiles de
  saída;
- criação, animação, visibilidade e destruição de sprites, tweens e partículas;
- temporização do relógio da cena, pausa, shutdown e limpeza de recursos;
- limites efetivos de câmera e física e reposicionamento visual do jogador;
- integração de áudio durante a transição.

Os testes caracterizam as decisões imediatamente antes dessas fronteiras e usam
dublês apenas para os efeitos Phaser. Pontos de isolamento recomendados para uma
etapa posterior, sem implementá-los agora: seleção pura do run, composição pura da
agenda de ondas, porta de relógio/agendamento, porta de efeitos de cena e um
coordenador de transição que receba progressão e navegação. Esses pontos permitem
testar o fluxo sem converter Phaser em parte dos contratos de estágio.

### Etapa 1 — contratos, validação e registry headless

Implementar `src/stages/contracts/`, `StageValidator` e `StageRegistry`, sem importá-los no `GameScene`. Registrar adaptadores das fases atuais em testes.

Critério de saída: typecheck passa; duplicatas, referências quebradas, grafos inválidos e rotas ausentes geram diagnósticos determinísticos.

#### Recorte de implementação — 2026-10-28

- `StageManifest`, `ChapterManifest` e `StageModule` tornam-se contratos públicos
  por `src/stages/index.ts`; os tipos narrativos referenciados por `StageModule`
  permanecem somente estruturais nesta etapa, sem director, execução ou conteúdo;
- o registry armazena cópias imutáveis dos manifestos, rejeita duplicatas e
  registros de capítulo incompatíveis de forma atômica e lista fases por `order`;
- a validação headless cobre versões, IDs, revisões, layout, anchors, saídas,
  referências de capítulo, referências de destino, ordens duplicadas,
  alcançabilidade desde a entrada e ciclos sem rota terminal;
- adaptadores em memória registram `VERSE_SECTIONS`, `ALL_LEVELS` e
  `CORRIDOR_LEVEL` como três capítulos legados separados, preservando os IDs e a
  ordem de cada catálogo; cada saída é linear e a última aponta para
  `campaign.complete`;
- os adaptadores desta etapa apenas produzem módulos e registros. Resolução de
  `LevelDefinition`, geração procedural e `StageLoader` permanecem na etapa 2.

Provas automatizadas desta etapa: `stageContracts.test.ts`,
`stageRegistry.test.ts` e `stageLegacyCompatibility.test.ts`, totalizando 13
testes novos. A validação de anchors contra o mapa resolvido permanece na etapa 2,
pois exige o resultado do loader.

### Etapa 2 — loader e adapters de compatibilidade

Implementar `StageLoader`, `LegacyLevelAdapter` e adapter procedural usando as APIs existentes. Não alterar `LevelDefinitionAdapter` nem o pipeline.

Critério de saída: para toda fase legada, `LoadedStage.level` é semanticamente igual ao objeto atual; para mesma semente/preset, a fase procedural é igual à saída atual.

#### Recorte de implementação — 2026-10-28

- o loader recebe um `StageRegistry`, resolve apenas o módulo solicitado e retorna
  `Result<LoadedStage, StageLoadFailure>` sem acessar cena, storage ou Phaser;
- fases legadas são resolvidas por ID a partir dos três catálogos atuais e fases
  procedurais delegam ao `ProceduralLevelFactory`; a seed efetiva é
  `<runSeed>:stage:<stageId>` para impedir colisão entre módulos da mesma run;
- toda resolução devolve cópias defensivas; chamadas repetidas com a mesma seed
  são semanticamente iguais e não compartilham matrizes ou coleções mutáveis;
- a validação pós-resolução cobre matriz retangular, tiles `0..9`, spawn, saída ou
  boss, conectividade spawn-destinos, anchors, limites e posições de inimigos,
  itens, ondas, emboscadas, patrulhas, decorações e saídas legadas;
- paredes e pilares (`1` e `2`) são sólidos para posições jogáveis. Em módulos
  novos, uma posição sobre esses tiles é erro; em layout `legacy`, é warning para
  preservar a patrulha existente de `level_02_nave` e a terceira wave de
  `level_05_clocktower`. Perigos `3` e `4` também produzem warning sem mutação,
  preservando `level_09_limbo`; decorações podem ancorar em tile sólido e são
  validadas apenas por limites, como exige o catálogo atual;
- `map-exit` exige tile `5`; em fase de boss sem esse tile, o tile `9` é aceito
  como destino terminal compatível. Anchors de tile precisam estar dentro do mapa
  e em tile transitável;
- qualquer erro de manifesto, referência, geração, mapa ou resume devolve falha
  tipada sem `LoadedStage` parcial. A integração com `GameScene` permanece adiada
  para a etapa 5.
- o contrato público atual de `ProceduralLevelFactory` devolve apenas
  `LevelDefinition`, sem warnings/reparos do `GenerationResult`. O loader valida
  novamente o resultado final, mas não inventa essa telemetria; expô-la exigiria
  mudança própria no contrato procedural. `SectionExit.to` também permanece como
  índice legado validado apenas quanto ao formato, enquanto as referências novas
  usam `StageManifest.exits`.

Provas automatizadas desta etapa: `stageLoaderLegacy.test.ts`,
`stageLoaderProcedural.test.ts` e `stageLoaderValidation.test.ts`, com 18 testes
para os 14 mapas legados, igualdade com o factory procedural, determinismo,
seeds, referências, cópias defensivas, resume, anchors, tiles, posições e
conectividade.

#### Reforço da Etapa 2 — resume, fronteira e alcançabilidade (2026-10-28)

- `StageResumeState` passa a poder transportar `runId` e `runSeed`. Quando ambos
  existem, o loader exige o mesmo `runId` da requisição e compara a seed pela
  representação efetivamente usada pelo adapter procedural (`String(runSeed)`),
  de modo que `731` e `"731"` permaneçam equivalentes porque produzem a mesma seed
  efetiva. Um vínculo parcial, malformado ou divergente é `incompatible-save` e
  impede a geração;
- snapshots de resume criados antes deste reforço, sem os dois campos, continuam
  aceitos para não quebrar consumidores headless existentes e produzem o warning
  `stage.load.resume-binding-missing`. A Etapa 4 deverá persistir sempre os dois
  campos nos novos saves e migrar snapshots antigos quando a origem da run for
  conhecida; esta etapa não cria storage nem inventa um vínculo ausente;
- toda a estrutura de `StageLoadRequest` e `StageResumeState` é validada antes da
  resolução do mapa. Requisição malformada é `invalid-request`; resume malformado
  é `incompatible-save`. Uma proteção final converte falhas inesperadas de uma
  dependência injetada em `load-failed`, sempre sem `LoadedStage` parcial;
- além de estar dentro do mapa e sobre tile transitável, todo anchor explícito
  `{ kind: 'tile' }` de saída precisa pertencer ao conjunto alcançável a partir
  do primeiro spawn. `map-exit` continua validando todos os tiles de saída (ou
  boss terminal) e `player-spawn` não pode ter alcançabilidade estática provada,
  pois seus offsets só ganham coordenada concreta no runtime futuro;
- mapas e coleções estruturalmente inválidos retornados por conteúdo autoral ou
  adapters são diagnósticos `invalid-level`, sem depender de exceções durante a
  cópia. Cópias defensivas passam a ser comprovadas também em estruturas
  narrativas aninhadas, patrulhas, drops, waves e diagnósticos congelados;
- a compatibilidade dos 14 mapas legados e a seed efetiva existente não muda.
  Nenhuma dessas garantias integra o loader ao Phaser ou altera a execução atual.

Critérios observáveis deste reforço: resume inválido não chama o adapter
procedural; bindings iguais carregam e divergentes falham; anchor transitável
isolado falha; entradas malformadas e exceções inesperadas retornam falhas
tipadas; duas resoluções equivalentes não compartilham estado mutável.

Prova automatizada adicional: `stageLoaderHardening.test.ts`, com 10 testes. As
quatro suítes `stageLoader*.test.ts` passam a somar 28 testes sem modificar os 18
casos anteriores da Etapa 2.

### Etapa 3 — runtime narrativo headless

Implementar `StageDirector` com contexto, sinais, condições, missões, eventos, comandos e idempotência. Ainda sem UI, NPC visual ou campanha real.

Critério de saída: sequências de sinais idênticas produzem os mesmos comandos e snapshot; callbacks ou comandos desconhecidos são rejeitados.

#### Recorte de implementação — 2026-10-28

- `src/narrative/` passa a ser o runtime público e headless da etapa. Ele recebe as
  definições declarativas já presentes nos contratos de stage, mantém o estado
  mutável separado e não importa Phaser, cenas, combate, simulação interna,
  storage ou `ProgressionService`;
- `NarrativeRegistry` registra atomicamente o conteúdo de uma fase, rejeita IDs
  duplicados e instáveis, valida referências de NPCs, diálogos, missões, regras,
  filtros, condições, comandos e saídas, e devolve somente cópias profundamente
  congeladas. O grafo de diálogo exige início e terminação alcançáveis e rejeita
  ciclos automáticos; ciclos conduzidos por escolhas precisam conservar uma rota
  terminal;
- `DialogueEngine` opera por sessões serializáveis, expõe início, continuação e
  escolha como resultados discriminados, filtra escolhas por condições e limita
  transições por sessão. Entradas em nós e escolhas apenas produzem os comandos
  declarativos validados; não executam callbacks;
- `QuestEngine` inicializa, inicia, avança, conclui e falha missões. Objetivos
  ativos progridem por `StageSignal` tipado, conclusão considera todos os
  objetivos não opcionais e recompensas geram `operationId` determinístico por
  missão e índice;
- o estado público de missão é ampliado com `available`, entre `locked` e
  `active`; `MissionState`, `StageCondition` e a validação de resume passam a
  aceitar o novo estado. `StageSignalFilter.field` também passa a admitir
  `stageId`, `missionId` e `exitId`, os campos discriminantes que faltavam para
  filtrar os sinais que já os carregavam. Essas são as únicas mudanças necessárias
  nos contratos existentes de `src/stages/`; não há mudança no formato de mapa,
  loader ou runtime legado;
- `NarrativeState` mantém flags, escolhas, diálogos concluídos, estados de
  missão, eventos processados, regras `once`, operações aplicadas e saídas
  liberadas. Seu snapshot versão 1 é composto apenas por dados serializáveis; a
  persistência continua adiada para a etapa 4;
- `NarrativeEventProcessor` consome envelopes com ID estável e `StageSignal`,
  processa missões antes das regras para que condições observem o estado novo,
  evita eventos, regras, conclusões e recompensas duplicadas e usa fila limitada
  para sinais derivados de conclusão. Uma falha de limite não publica estado
  parcial;
- `StageDirector` é a fachada mínima que reúne registry, estado, projeção de
  progressão, quest engine e processador. Integração visual, aplicação efetiva de
  recompensa e adaptação dos eventos concretos da cena permanecem para etapas
  posteriores;
- condições de progressão recebem somente `unlockedContent` como projeção
  imutável. Recompensas continuam sendo comandos para a autoridade de progressão,
  nunca mutações diretas do estado persistente existente.

Critérios observáveis adicionais: conteúdo inválido não altera o registry;
consultas não compartilham referências mutáveis com o chamador; repetir o mesmo
envelope não altera progresso nem reemite comandos; concluir uma missão novamente
não reemite recompensas; snapshots e comandos são iguais para a mesma sequência;
e os testes do runtime rodam em ambiente Node sem DOM, relógio ou aleatoriedade.

Provas automatizadas desta etapa: `narrativeRegistry.test.ts`,
`dialogueEngine.test.ts`, `questEngine.test.ts` e
`narrativeIntegration.test.ts`, com 25 testes novos. Elas cobrem referências
inválidas, duplicatas, condições, escolhas, terminação, limites, falha, objetivos
opcionais, filtros, determinismo, consultas imutáveis, eventos recursivos e
idempotência. Em 2026-10-28, typecheck, build e as 27 suítes passaram, totalizando
600 testes (os 575 anteriores mais os 25 desta etapa). `git diff --check` não
encontrou erros, e `src/narrative/` não contém referências a Phaser, `GameScene`
ou combate.

### Etapa 4 — saves aditivos

Implementar storages de campanha/run e migrators, mantendo as chaves atuais intocadas. O modo legado continua default.

Critério de saída: saves atuais carregam; ausência/corrupção dos saves novos não impede o jogo; recompensa repetida não duplica efeito.

#### Recorte de implementação — 2026-10-28

- `CampaignSaveEnvelope` versão 1 contém somente identidade e
  `NarrativeStateSnapshot`. A identidade obrigatória é
  `campaignId + runId + runSeed + chapterId + stageId + manifestRevision`; não há
  relógio, checksum dependente de plataforma nem aleatoriedade no formato;
- `SaveStoragePort` expõe somente leitura e escrita por chave. O adapter em
  memória copia strings e serve aos testes; nenhum adapter de `localStorage` é
  conectado ao jogo nesta etapa. Um adapter futuro fica isolado nessa porta e
  não pode tocar perfil, configurações ou progressão;
- `CampaignSaveService` serializa de forma determinística, valida dados externos,
  carrega, restaura transacionalmente e nunca remove chaves. Ausência retorna um
  resultado vazio bem-sucedido; JSON inválido, versão desconhecida, identidade
  divergente e snapshot inválido retornam falhas discriminadas e preservam tanto
  o storage quanto o `NarrativeState` de destino;
- antes de escrever, o serviço relê a chave. Somente ausência ou um envelope v1
  válido da mesma identidade podem receber update; bytes corrompidos, formatos
  legados, versões desconhecidas e outra run retornam `storage-conflict` e não são
  sobrescritos;
- a migração concreta aceita o contrato legado disponível, `StageResumeState`,
  mais uma identidade completa fornecida pelo chamador. Flags, missões e IDs de
  operação reconhecidos são copiados para o snapshot narrativo; escolhas,
  diálogos, eventos, regras, saídas e pendências inexistentes começam vazios.
  `collectedEntityIds` continua pertencendo ao resume de stage e não é copiado.
  Migração nunca escreve automaticamente nem sobrescreve o JSON original;
- payloads desconhecidos não são reinterpretados como saves conhecidos. Uma
  revisão divergente exige migrator explícito; o serviço não tenta adivinhar IDs
  por índice, nome ou ordem de registry;
- eventos processados, regras `once` e operações recebem IDs qualificados pelo
  prefixo determinístico da run, capítulo, fase e revisão. O seed vincula o
  envelope, mas não entra no prefixo porque `runId` é a identidade estável da
  execução; saves com seed divergente são incompatíveis;
- `NarrativeStateSnapshot` passa a persistir `pendingOperations`. Ao produzir uma
  recompensa externa, o runtime registra primeiro a operação pendente e conserva
  o `operationId` no journal de deduplicação. A integração deve: salvar a
  pendência, aplicar a recompensa fora do domínio usando o mesmo `operationId`,
  confirmar a pendência e salvar novamente;
- uma pendência não confirmada é reapresentada após restore. Se o sistema externo
  não deduplicar por `operationId`, uma queda entre aplicação e confirmação ainda
  pode repetir o efeito; portanto esta etapa oferece protocolo recuperável e não
  declara exatamente-uma-vez transacional entre narrative e progressão;
- `StageDirector` aceita identidade opcional para manter consumidores headless da
  Etapa 3 compatíveis. Saves da Etapa 4 exigem identidade completa e nunca aceitam
  IDs narrativos não qualificados.

Critérios observáveis: round-trip produz o mesmo envelope e snapshot; serializar
duas vezes o mesmo estado produz os mesmos bytes; restaurar save incompatível não
muda o estado; load/migração não escrevem; chaves legadas permanecem byte a byte;
IDs de duas runs ou fases não colidem; pendências sobrevivem a restart e só saem
após confirmação explícita; confirmar novamente é idempotente; corrupção em
qualquer coleção aninhada é diagnosticada com caminho estável.

Provas automatizadas: `campaignSaveService.test.ts` para contratos, round-trip,
storage, corrupção, versões e identidade; `campaignSaveMigration.test.ts` para
`StageResumeState`, preservação e falhas atômicas;
`narrativePendingOperations.test.ts` para escopo, retomada, confirmação e limites
da garantia externa. As três suítes adicionam 20 testes. Em 2026-10-28,
typecheck, build e as 30 suítes passaram, totalizando 620 testes — os 600
anteriores mais os 20 desta etapa. `git diff --check` não encontrou erros e
`src/narrative/` permaneceu sem dependências de Phaser, `GameScene`, combate,
progressão ou `localStorage`.

### Etapa 5 — integração fina com a cena

Integração piloto. Substituir somente a seleção da primeira fase legada por um
`LoadedStage`/adaptador, mantendo render, combate, colisões, ondas e transição
existentes. Não é uma reescrita de `GameScene`.

Critério de saída: fluxo menu -> jogo -> próxima fase -> morte -> restart -> menu e modo procedural permanecem observacionalmente iguais.

#### Recorte de implementação — 2026-10-28

- a flag `modularStageLoading`, recebida em `GameScene.init`, é `false` por
  padrão. Com a flag desligada, nenhum registry, loader, director ou serviço de
  campanha é criado e `VERSE_SECTIONS` continua sendo a única fonte do fluxo
  autoral atual;
- o piloto cobre exclusivamente `verse_01_atrium`, primeira entrada de
  `legacy.verse`. `GameSceneStageAdapter` chama `StageLoader` para essa identidade
  e entrega `LoadedStage.level` à cena. Fases procedurais e qualquer outro ID
  continuam no caminho legado;
- falha tipada, exceção ou resultado incompatível do loader produz rollback
  imediato para a mesma referência `LevelDefinition` selecionada pelo fluxo
  antigo. Nenhum diagnóstico bloqueia a inicialização da cena;
- `GameStageCompositionRoot` é a única montagem de `StageRegistry`, registros
  legados e `StageLoader`. `StageDirector` nasce somente depois de um load modular
  bem-sucedido; `CampaignSaveService` nasce somente quando existe um
  `SaveStoragePort` e `modularRunId` explícito;
- `BrowserCampaignSaveStorage` é um adapter application-only sobre a superfície
  mínima `getItem`/`setItem`. Ele não remove chaves, não importa Phaser e não é
  conhecido pelos módulos headless. A lógica de conflito e preservação continua
  em `CampaignSaveService`;
- a cena permanece autoridade para mapa ativo, índice, inimigos, ondas, itens,
  halos transitórios, morte, transição e `ProgressionService`. O director é a
  única autoridade do snapshot narrativo; não existe sincronização reversa de
  progressão, grupos Phaser ou `StageResumeState` para o estado narrativo;
- `runId` e `runSeed` opcionais são propagados no restart. Na ausência deles, o
  loader usa IDs determinísticos somente para a resolução headless, mas a
  persistência de campanha fica desativada. Retomadas antigas, que não carregam
  os novos campos nem a flag, permanecem integralmente no caminho legado;
- ao entrar na fase piloto, o runtime publica `stage.entered`; ao solicitar a
  saída, publica `stage.exit.requested`. O estado é salvo depois de cada operação
  somente quando o adapter de campanha existe. Falha de save não altera nem
  interrompe jogabilidade, recompensa ou transição legadas;
- operações externas pendentes são apenas expostas por `pendingRewardCommands`.
  Um consumidor futuro aplica pelo `operationId` e chama a confirmação somente
  após sucesso; a confirmação persiste o novo snapshot. Esta etapa não conecta
  recompensas narrativas a `ProgressionService` e não declara exatamente-uma-vez;
- morte salva o snapshot narrativo disponível e reinicia com a mesma flag,
  identidade e posição legada. A transição para `verse_02_galeria` encerra a
  sessão modular piloto e volta ao objeto legado já existente no array;
- `umbra-trail-run-v1` continua ausente: não há estado concreto novo de mapa,
  coletas ou entidades além do que a cena já transporta no restart.

Critérios observáveis: flag OFF não chama o loader e preserva igualdade por
referência; flag ON carrega `verse_01_atrium` semanticamente igual pelo loader;
outro ID ou procedural não chama o loader; falha retorna o objeto legado; a
requisição preserva run/seed; transição concede a mesma recompensa e reconstrói
`verse_02_galeria`; morte propaga os mesmos dados antigos mais os campos modulares
somente quando a flag está ativa; save de campanha não toca as três chaves
existentes; confirmação inexistente ou duplicada falha sem mutação.

Provas automatizadas: `gameStageAdapter.test.ts` cobre flag, seleção, seed,
falhas tipadas, exceções e rollback; `gameStageComposition.test.ts` cobre a
montagem real, criação tardia da sessão narrativa, storage aditivo e operações
pendentes; `stageGameModularIntegration.test.ts` cobre flag OFF/ON, procedural,
retomada em outra fase, transição, recompensa legada, morte, restart e save
dentro do shell headless da cena. As três suítes adicionam 16 testes. Em
2026-10-28, typecheck, build e as 33 suítes passaram, totalizando 636 testes — os
620 anteriores mais os 16 desta etapa. `git diff --check` não encontrou erros.

Limitações remanescentes: o piloto não tenta manter uma sessão narrativa ao
entrar na segunda fase; falhas do loader e do save fazem rollback/fail-open sem
UI de diagnóstico; nenhuma operação pendente é aplicada a progressão nesta
etapa; e exatamente-uma-vez continua dependendo de deduplicação por
`operationId` no consumidor futuro. Persistência só é ativada quando o chamador
fornece `modularRunId` concreto e existe `localStorage`; retomadas antigas e a
flag ausente não criam nem consultam save de campanha.

### Etapa 6 — architecture gates e rastreabilidade

Esta etapa transforma as fronteiras já definidas em verificações executáveis,
sem alterar o runtime ou as regras de jogo.

#### Recorte de implementação — 2026-10-28

- `scripts/check-architecture.mjs` constrói o grafo de imports TypeScript a
  partir da AST do compilador já instalado. O gate verifica imports diretos e
  caminhos transitivos de runtime; imports exclusivamente de tipo permanecem
  identificados e não são tratados como dependência executável;
- `src/stages/` e `src/narrative/` não podem alcançar Phaser, cenas,
  `GameScene`, combate, IA, simulação ou progressão por dependência de runtime,
  salvo a delegação procedural descrita abaixo.
  `src/application/stages/` é a costura autorizada, mas consome `stages` e
  `narrative` somente pelos respectivos `index.ts` públicos e também não pode
  importar Phaser, cenas ou implementações internas do motor;
- módulos em `src/stages/chapters/` podem importar apenas arquivos do próprio
  capítulo, `src/stages/contracts/` e `src/narrative/contracts/`. Importações
  entre capítulos e atalhos pelos índices que também exportam implementações
  são rejeitados;
- contratos públicos não podem depender de runtime, persistence,
  compatibility, application ou cenas. A exceção legada explícita é o import
  somente de tipo de `Result` por `StageLoad.ts` através do índice público de
  `simulation`; removê-la exige um contrato compartilhado próprio em etapa
  futura, não uma duplicação local nesta etapa;
- a segunda exceção é transitiva e limitada ao caminho
  `stages -> procedural -> simulation/core/DeterministicRandom`: geração já é
  responsabilidade pública do `StageLoader`, e o pipeline procedural existente
  reutiliza o RNG determinístico. Isso não autoriza capítulos, narrativa ou o
  application adapter a importar simulação diretamente;
- o gate não usa uma lista congelada de arquivos permitidos. Novos arquivos nas
  zonas protegidas são descobertos automaticamente, e imports relativos ou pelo
  alias `@/` são resolvidos antes da validação;
- `scripts/check-traceability.mjs` valida apenas registros com schema
  `umbra-prompt-record/v1`. Arquivos históricos, sessões brutas e os prompts
  propostos 01–08 são preservados e reportados como legado, sem serem
  reinterpretados nem reprovarem a CI retroativamente;
- cada registro v1 contém ID estável, data, agente/ferramenta, modelo, esforço,
  SPEC, arquivos modificados, execução e commit. Valores não comprováveis usam
  literalmente `desconhecido` ou `pendente`; o prompt efetivamente recebido é
  preservado integralmente em bloco próprio;
- `prompts/MODELO-REGISTRO.md` é o modelo reutilizável. O registro desta etapa é
  a primeira instância v1 e não altera `registro-completo.md`, o manifesto das
  sessões ou qualquer exportação histórica;
- os dois gates entram em scripts npm e na CI antes de testes e build. A CI
  valida o estado atual do repositório, sem percorrer ou reprovar commits
  históricos que antecedem o schema;
- regressões do piloto modular continuam headless: flag OFF/ON, rollback,
  carregamento, transição, restart e preservação de saves são verificadas sem
  alegar execução de render, física ou canvas reais do Phaser.

Critérios observáveis: o repositório atual passa nos dois gates; fixtures com
import direto proibido e dependência transitiva proibida falham com caminho de
dependência; conteúdo que usa apenas contratos públicos passa; registro v1 sem
campo obrigatório ou sem prompt falha; legado permanece aceito; a CI executa
gates, testes completos e build; e os 636 testes anteriores continuam passando.

Provas implementadas: `architectureGates.test.ts` cobre o repositório, conteúdo
válido, violação direta, import dinâmico não literal e caminho transitivo;
`traceabilityGates.test.ts` cobre o registro atual, legado e registro v1
inválido; `stageArchitectureRegression.test.ts` cobre restart legado, restart
após fallback e round-trip aditivo de save. Os testes existentes da Etapa 5
continuam cobrindo flag ON, carregamento e transição sem serem modificados.

O primeiro passe transitivo detectou o uso de
`simulation/core/DeterministicRandom` pelo pipeline procedural. A dependência já
existia, entra exclusivamente pelo boundary procedural público e foi registrada
como a segunda exceção acima; nenhuma violação não justificada permaneceu. O
gate final analisou 1.664 arquivos TypeScript e 3.584 dependências. O gate de
rastreabilidade validou um registro v1 e aceitou oito arquivos legados.

Em 2026-10-28, `check:gates`, typecheck, build e as 36 suítes passaram,
totalizando 646 testes — os 636 anteriores mais os 10 desta etapa.
`git diff --check` não encontrou erros. Não houve alteração de `GameScene`,
combate, simulação, IA, procedural, progressão ou saves legados.

Limitações: a análise é estática sobre imports TypeScript; imports dinâmicos não
literais são rejeitados em vez de inferidos. Imports apenas de tipo não são
percorridos como dependência executável. Os testes de cena usam o shell Phaser
mockado já adotado pela caracterização e não comprovam render, física, áudio ou
canvas reais; uma validação end-to-end futura deve abrir o build em navegador e
percorrer menu, piloto, transição e morte. A CI valida o snapshot atual, não
reescreve nem audita semanticamente commits históricos.

#### Hardening dos gates — 2026-10-28

- a exceção transitiva procedural deixa de aceitar genericamente qualquer alvo
  em `src/simulation/`. A allowlist passa a exigir simultaneamente: raiz em
  `stages` ou `application/stages`, passagem por `src/procedural/` e destino
  exato `src/simulation/core/DeterministicRandom.ts`. Qualquer outro módulo de
  simulação continua proibido, mesmo quando alcançado através do procedural;
- as oito identidades históricas autorizadas são os nomes exatos dos arquivos
  01–08 já preservados. Prefixo numérico não concede status legado. Novo arquivo
  Markdown em `prompts/` sem schema v1, fora dos documentos institucionais
  explicitamente conhecidos, é uma violação;
- `Prompt-ID` deve ser estável, estruturalmente válido e único entre todos os
  registros v1. Campos duplicados, schema desconhecido, seções duplicadas ou
  vazias, paths externos ao repositório e campos obrigatórios ausentes falham;
- `Commit: pendente` representa somente um registro ainda não consolidado. O
  gate tenta derivar o primeiro commit que adicionou o próprio arquivo com
  `git log --diff-filter=A`, sem escrever hash no registro. Em worktree ainda
  não commitado ou fixture sem Git, permanece pendente e é reportado, não
  inventado. Hash explícito e `desconhecido` continuam aceitos conforme a
  evidência disponível;
- `AGENTS.md`, `prompts/MODELO-REGISTRO.md`, `prompts/README.md` e o verificador
  usam a mesma política: nunca reescrever o prompt para consolidar metadados e
  nunca criar um commit autorreferente somente para inserir seu próprio hash.

Critérios observáveis adicionais: fixture procedural que alcança o RNG permitido
passa; fixture que alcança outro módulo de simulação falha; cada histórico exato
é aceito e um novo arquivo sem schema falha; IDs duplicados e registros
estruturalmente inválidos falham; registro pendente sem Git passa com status
pendente, enquanto um registro já presente no histórico pode obter o hash
derivado sem modificar seus bytes.

Provas do hardening: `architectureGates.test.ts` ganhou o caso negativo
`procedural -> SimulationKernel`, que permanece bloqueado; o repositório real
confirma a exceção positiva limitada a `DeterministicRandom.ts`.
`traceabilityGates.test.ts` ganhou casos para identidade histórica explícita,
arquivo numerado sem schema, `Prompt-ID` duplicado e commit ainda pendente. O
registro 09 teve seu commit de adição derivado como `156bf8293c762cd002c56216421e96dbf74fde9a`
sem alteração do arquivo; o registro 10 permaneceu pendente no worktree.

Em 2026-10-28, os gates analisaram novamente 1.664 arquivos e 3.584
dependências, validaram dois registros v1 e oito históricos explícitos, sem
violações. Typecheck, build e 36 suítes passaram, totalizando 650 testes — os
646 anteriores mais quatro testes de hardening. `git diff --check` não encontrou
erros.

### Etapa 7 — campanha procedural ramificada com saídas físicas

A especificação de campanha procedural ramificada e saídas físicas está em
`SPEC/2026-10-28-campanha-procedural-ramificada.md`. A Etapa 7 permanece apenas
documental: contratos propostos, invariantes e plano incremental. Conteúdo e
assets continuam fora do escopo até SPEC narrativa/cultural própria.

## Plano de testes

| Suíte proposta | Nível | Prova |
|---|---|---|
| `stageContracts.test.ts` | unitário | schemas, IDs, cópias defensivas e diagnósticos |
| `stageRegistry.test.ts` | unitário | duplicatas, ordem, capítulo, entradas e saídas |
| `stageNarrative.test.ts` | unitário | grafos, speakers, condições, objetivos e comandos permitidos |
| `stageLoaderLegacy.test.ts` | contrato | igualdade semântica de todas as fases atuais |
| `stageLoaderProcedural.test.ts` | contrato | determinismo por seed/preset e falha sem mapa parcial |
| `stageSaveCompatibility.test.ts` | contrato | chaves atuais, saves novos, revisão e corrupção |
| `stageDirector.test.ts` | unitário | sinais -> comandos, snapshots e idempotência |
| `stageGameCompatibility.test.ts` | integração | fluxo atual e invariantes de jogabilidade |
| testes locais do capítulo | unitário | apenas manifesto e conteúdo daquele módulo |

Todas as etapas terminam com `npm run build` e `npm test -- --runInBand`. Testes headless não importam Phaser, DOM ou canvas.

## Critérios de aceitação desta arquitetura

- existe uma matriz verificável dos acoplamentos atuais e da costura proposta;
- componentes existentes e componentes a implementar estão explicitamente diferenciados;
- `StageManifest`, `StageRegistry`, `StageLoader`, `LoadedStage` e falhas de load possuem contratos propostos;
- narrativa, NPCs, diálogos, missões, sinais, condições, eventos e comandos possuem contratos declarativos sem Phaser ou callbacks;
- o plano define uma pasta autocontida e o conjunto mínimo de leitura para agentes de capítulo;
- `AGENTS.md` preserva SPEC, prompts, auditoria, testes e trailers de commit;
- compatibilidade cobre perfil, ajustes, progressão v1, restart atual, fases legadas, procedural e editor v1;
- a ordem incremental possui critério de saída e testes em cada etapa;
- a integração fina toca `GameScene` somente na costura de seleção, sinais,
  save e propagação da flag; não muda regras de jogabilidade, combate,
  procedural, código gerado ou assets;
- abstrações sem consumidor previsto ficam fora do contrato.

## Fora do escopo

- escrever a campanha amazônica, personagens, diálogos finais ou missões de produção;
- representação cultural, pesquisa histórica/etnográfica ou aprovação de conteúdo;
- criar ou substituir sprites, mapas, áudio, retratos ou outros assets;
- implementar UI de diálogo ou NPCs visuais;
- reescrever `GameScene` ou alterar combate, IA, progressão e geração procedural;
- plugins dinâmicos, conteúdo remoto, scripting arbitrário ou hot reload de campanha;
- multiplayer, cloud save e serviços remotos.
