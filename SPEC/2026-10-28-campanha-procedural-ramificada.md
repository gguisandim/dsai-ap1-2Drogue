# Campanha procedural ramificada com saídas físicas *(2026-10-28)*

## Estado e relação com a arquitetura modular

Esta SPEC detalha a Etapa 7 de
`SPEC/2026-10-27-arquitetura-campanha-modular.md`. Ela define contratos
propostos, invariantes e uma sequência incremental para campanhas roguelite
amazônicas com percurso determinístico, bifurcações e saídas físicas.

Nesta etapa não há implementação de gerador, alteração de runtime, mudança de
`GameScene`, conteúdo final, mapa, NPC, asset ou save de produção. Os blocos
TypeScript abaixo só se tornam API pública depois de implementados, validados e
exportados pelos índices públicos correspondentes.

## Objetivo observável

Para uma seed, revisão de campanha e contexto narrativo fixos, produzir um grafo
imutável no qual:

- todo percurso válido da entrada à conclusão visita exatamente nove posições de
  região, distribuídas em três atos;
- cada ato termina em um marco narrativo obrigatório;
- regiões intermediárias podem variar e bifurcar, com no máximo duas rotas
  simultâneas por bifurcação;
- cada aresta selecionável possui uma saída física transitável, alcançável e
  distinta no mapa carregado;
- save/load restaura o mesmo grafo, nó atual, visitas e checkpoints sem sortear
  novamente ou duplicar estado de fase e narrativa;
- combate, movimento, colisões e geração de cada fase continuam pertencendo aos
  sistemas existentes.

O grafo pode materializar de nove a doze nós por causa das alternativas. “Nove
regiões” significa nove posições visitadas em qualquer caminho completo: uma
alternativa não escolhida não aumenta a duração da run.

## Fora do escopo

- nomes, textos ou representação cultural finais da campanha amazônica;
- novos biomas do gerador atual, mapas, tiles, inimigos, NPCs ou assets;
- balanceamento de combate, loot, economia ou progressão persistente;
- UI de mapa, escolha textual de rota ou fast travel;
- geração infinita, mundo aberto ou bifurcação com largura arbitrária;
- implementação dos contratos propostos nesta etapa.

## Contratos existentes reutilizados

| Autoridade existente | Responsabilidade preservada |
|---|---|
| `StageRegistry` | resolve `stageId` de template; o grafo não copia módulos |
| `StageLoader` | valida e carrega uma fase usando `stageId`, run/seed e `StageResumeState` |
| `LoadedStage` | permanece a única descrição resolvida consumida pelo adapter da cena |
| `StageDirector` | processa sinais, condições, missões, revelações e unlock de `exitId` |
| `NarrativeStateSnapshot` | única fonte de flags, escolhas, missões, eventos e saídas narrativas desbloqueadas |
| `StageResumeState` | única fonte de checkpoint mutável de uma ocorrência de fase |
| `CampaignSaveEnvelope` | envelope existente do estado narrativo; não recebe cópia do grafo |
| `SaveStoragePort` | porta de bytes reutilizada por um futuro serviço de run |
| `PresetId`, `BiomeId`, `GeneratorOptions` | elegibilidade e geração do mapa; a campanha não reimplementa procedural |
| `StageSignal`/`StageCommand` | `stage.exit.requested`, `exit.unlock` e `stage.complete` continuam sendo a costura narrativa |

O grafo decide **qual nó** uma saída representa. O `StageDirector` decide **se o
exitId local está desbloqueado**. O adapter de aplicação traduz saída física em
aresta e chama o `StageLoader`. Nenhuma dessas autoridades escreve no estado da
outra.

## Identidades estáveis

```ts
export type CampaignGraphId = string;
export type CampaignNodeId = string;
export type CampaignEdgeId = string;
export type CampaignActId = string;
export type CampaignSlotId = string;
export type RegionTemplateId = string;
export type PhysicalExitId = string;
export type NarrativeBeatId = string;
```

Todos os IDs seguem a mesma disciplina namespaced já usada por stages. Índice de
array, título, coordenada e ordem de sorteio não são identidade.

- `RegionTemplateId` identifica conteúdo reutilizável entre runs;
- `CampaignSlotId` identifica semanticamente uma posição, por exemplo
  `act-2.intermediate-b`;
- `CampaignNodeId` identifica a ocorrência dentro da run e é derivado de
  `campaignId + runId + slotId + branchId`;
- `CampaignEdgeId` é derivado de `sourceNodeId + exitSlotId + targetNodeId`;
- `PhysicalExitId` é derivado de `sourceNodeId + CampaignEdgeId`, nunca da
  coordenada escolhida;
- coordenadas são payload persistido e validado, não identidade.

Duas runs podem usar o mesmo `RegionTemplateId` sem compartilhar node, missão,
checkpoint ou operação. Gerar novamente com os mesmos inputs preserva os mesmos
slots, templates e arestas; trocar apenas `runId` troca o namespace das
instâncias, sem alterar a topologia normalizada.

## Contratos propostos

### Templates e elegibilidade declarativa

```ts
export interface RegionTemplate {
  readonly id: RegionTemplateId;
  readonly revision: number;
  readonly stageId: StageId;
  readonly allowedActIds: readonly CampaignActId[];
  readonly allowedBiomeIds: readonly BiomeId[];
  readonly presetIds?: readonly PresetId[];
  readonly difficulty: {
    readonly minimum: number;
    readonly maximum: number;
  };
  readonly weight: number;
  readonly maximumPhysicalExits: 1 | 2 | 3;
  readonly tags: readonly string[];
  readonly requiredFlags?: readonly StageCondition[];
  readonly requiredEventIds?: readonly string[];
  readonly requiredBeatIds?: readonly NarrativeBeatId[];
  readonly providesBeatIds?: readonly NarrativeBeatId[];
  readonly revisit: 'forbidden' | 'checkpoint' | 'repeatable';
}
```

Não há callbacks. Pesos são inteiros positivos. Catálogos são ordenados por ID
antes do sorteio. Bioma usa `BiomeId` existente; a representação amazônica final
será mapeada por uma SPEC cultural/conteudística futura, sem ampliar a união de
biomas nesta etapa.

Elegibilidade é a conjunção de:

1. ato e slot permitidos;
2. dificuldade da posição dentro do intervalo do template;
3. bioma/preset compatíveis;
4. capacidade física suficiente para o outdegree planejado;
5. flags, eventos e revelações presentes no contexto congelado de geração;
6. restrições de repetição e adjacência;
7. revisão do template compatível com o catálogo.

O contexto é capturado no início da run e recebe um digest determinístico. Uma
revelação obtida depois não reescreve o grafo corrente: pode desbloquear uma
aresta já materializada ou afetar a próxima run.

### Nós, arestas e atos

```ts
export interface CampaignNode {
  readonly id: CampaignNodeId;
  readonly slotId: CampaignSlotId;
  readonly templateId: RegionTemplateId;
  readonly templateRevision: number;
  readonly stageId: StageId;
  readonly stageSeed: string;
  readonly actId: CampaignActId;
  readonly depth: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly branchId: 'main' | 'route-a' | 'route-b';
  readonly kind: 'intermediate' | 'milestone';
  readonly biomeId: BiomeId;
  readonly difficulty: number;
  readonly providesBeatIds: readonly NarrativeBeatId[];
  readonly maximumPhysicalExits: 1 | 2 | 3;
}

export interface CampaignEdge {
  readonly id: CampaignEdgeId;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly exitSlotId: string;
  readonly physicalExitId: PhysicalExitId;
  readonly kind: 'forward' | 'branch' | 'rejoin' | 'return';
  readonly condition?: StageCondition;
  readonly traversalLimit: 1 | 2;
}

export interface CampaignAct {
  readonly id: CampaignActId;
  readonly ordinal: 1 | 2 | 3;
  readonly depthRange: readonly [number, number];
  readonly milestoneNodeId: CampaignNodeId;
  readonly requiredBeatIds: readonly NarrativeBeatId[];
}
```

`depth` descreve uma das nove posições do percurso, não a posição no array. Um
fork pode ter dois nós na mesma profundidade. Toda bifurcação reentra em uma
profundidade posterior antes do marco do ato.

### Grafo e gerador

```ts
export interface CampaignGraph {
  readonly schemaVersion: 1;
  readonly generatorVersion: 1;
  readonly id: CampaignGraphId;
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly catalogRevision: number;
  readonly runId: string;
  readonly runSeed: string;
  readonly generationContextDigest: string;
  readonly entryNodeId: CampaignNodeId;
  readonly acts: readonly CampaignAct[];
  readonly nodes: readonly CampaignNode[];
  readonly edges: readonly CampaignEdge[];
  readonly mandatoryBeatIds: readonly NarrativeBeatId[];
}

export interface CampaignGraphGenerationContext {
  readonly flags: Readonly<Record<string, boolean | number | string>>;
  readonly completedEventIds: readonly string[];
  readonly revealedBeatIds: readonly NarrativeBeatId[];
}

export interface CampaignGraphRequest {
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly catalogRevision: number;
  readonly runId: string;
  readonly runSeed: string | number;
  readonly templates: readonly RegionTemplate[];
  readonly context: CampaignGraphGenerationContext;
}

export interface CampaignGraphGenerator {
  generate(request: CampaignGraphRequest): CampaignGraphResult;
}

export type CampaignGraphFailureCode =
  | 'invalid-request'
  | 'invalid-template'
  | 'duplicate-id'
  | 'insufficient-eligible-regions'
  | 'milestone-unavailable'
  | 'invalid-topology'
  | 'narrative-beat-unreachable'
  | 'exit-capacity-insufficient';

export type CampaignGraphResult =
  | { readonly ok: true; readonly value: CampaignGraph }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CampaignGraphFailureCode;
        readonly diagnostics: readonly StageDiagnostic[];
      };
    };
```

O gerador é headless, puro e não acessa Phaser, relógio, browser, storage ou
gerador de mapas. Ele seleciona descritores; o mapa só é produzido depois pelo
`StageLoader`.

### Saída física resolvida

```ts
export interface PhysicalExit {
  readonly id: PhysicalExitId;
  readonly edgeId: CampaignEdgeId;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly stageExitId: string;
  readonly tile: { readonly x: number; readonly y: number };
  readonly placementAttempt: 0 | 1 | 2 | 3;
}

export interface PhysicalExitResolution {
  readonly nodeId: CampaignNodeId;
  readonly stageId: StageId;
  readonly levelDigest: string;
  readonly exits: readonly PhysicalExit[];
}

export type PhysicalExitFailureCode =
  | 'invalid-request'
  | 'entry-unreachable'
  | 'insufficient-exit-space'
  | 'exit-tile-blocked'
  | 'exit-tile-unreachable'
  | 'exit-tile-duplicated'
  | 'saved-placement-incompatible';
```

`PhysicalExit` é geometria resolvida; unlock/reveal continuam no
`NarrativeStateSnapshot.unlockedExitIds`. Um tile físico não carrega estado de
missão e não decide seu destino por índice.

## Determinismo

O gerador usa somente RNG semeado e sub-seeds derivados de labels estáveis:

```text
graphSeed = hash(runSeed, campaignRevision, catalogRevision, contextDigest)
slotSeed  = hash(graphSeed, actId, slotId, branchId)
stageSeed = hash(graphSeed, nodeId, templateId, templateRevision)
exitSeed  = hash(stageSeed, edgeId, placementAttempt)
```

Regras adicionais:

- candidatos são normalizados e ordenados por ID antes da seleção ponderada;
- pesos usam aritmética inteira; não há dependência da ordem de `Map`/objeto;
- empates usam ID lexical;
- `generatorVersion`, revisões e digest fazem parte do snapshot;
- load nunca chama `generate` quando um grafo válido já foi persistido;
- incompatibilidade retorna falha tipada, sem “corrigir” a seed ou ressortear.

## Estrutura dos três atos

Cada caminho completo tem profundidades 0–8:

| Ato | Profundidades | Regiões variáveis | Marco obrigatório |
|---|---|---:|---|
| I — entrada/chamado | 0–2 | 0 e 1 | profundidade 2 |
| II — travessia/revelação | 3–5 | 3 e 4 | profundidade 5 |
| III — convergência/clímax | 6–8 | 6 e 7 | profundidade 8 |

Há no máximo um fork por ato, sempre em região intermediária, com largura dois e
rejoin antes do marco. O marco é um dominador: todo caminho da entrada ao ato
seguinte passa por ele. O último marco é o único predecessor de
`campaign.complete`.

Cada marco declara ao menos um `NarrativeBeatId` obrigatório. A revelação é
produzida por regra idempotente e incondicional de entrada ou conclusão; diálogo
opcional pode aprofundá-la, mas não é a única forma de marcar o beat. Saídas para
o ato seguinte exigem o beat, e o validador prova que ele é produzido no próprio
dominador. Assim, escolhas de rota não removem revelações essenciais.

## Posicionamento e validação das saídas

Para uma fase carregada, a resolução futura deve:

1. localizar o spawn/entrada efetivo;
2. calcular o componente alcançável usando a mesma semântica pública de tile
   transitável usada pelo mapa;
3. remover spawn, hazards bloqueantes, tiles ocupados e tiles sem clearance;
4. ordenar candidatos deterministicamente pelo `exitSeed`, favorecendo bordas e
   direções divergentes sem depender de coordenada como ID;
5. selecionar tiles distintos, alcançáveis e separados por distância mínima;
6. validar novamente cada caminho spawn → exit;
7. persistir a resolução e seu `levelDigest`.

Invariantes que nunca são relaxados: transitabilidade, alcançabilidade,
distinção, ausência de sobreposição com spawn e correspondência um-para-um entre
aresta e saída.

Fallback seguro, em ordem:

1. tentar o próximo conjunto determinístico de candidatos;
2. para mapa procedural ainda não consolidado, regenerar no máximo três vezes
   com `placementAttempt` derivado e persistir a tentativa escolhida;
3. antes de persistir o grafo, podar somente uma aresta opcional se ainda houver
   caminho para todos os marcos e o template suportar ao menos uma saída;
4. em grafo já persistido ou mapa autoral incompatível, retornar
   `insufficient-exit-space`/`saved-placement-incompatible` e restaurar o último
   checkpoint válido.

Nunca se colocam duas arestas no mesmo tile, nunca se teleporta silenciosamente e
nunca se altera a topologia persistida para “fazer caber”.

## Navegação, retorno e prevenção de softlock

- forward/branch/rejoin formam um DAG por profundidade;
- return é a única aresta regressiva e aponta somente para o último nó visitado
  do mesmo ato;
- uma aresta de retorno tem limite dois e não concede novamente recompensas
  `once`; operações continuam deduplicadas por `operationId`;
- o orçamento padrão é duas revisitas por ato e quatro por run;
- marcos concluídos não são repetidos como combate obrigatório;
- toda saída crítica depende apenas de fatos alcançáveis no nó atual ou em seus
  ancestrais obrigatórios;
- missão secundária nunca é pré-requisito exclusivo de saída crítica;
- todo nó alcançável, exceto conclusão, possui ao menos uma saída que pode ser
  desbloqueada sem conteúdo de um ramo mutuamente exclusivo;
- o validador executa reachability, dominators, strongly connected components e
  satisfatibilidade conservadora das condições antes de aceitar o grafo.

Missões `campaign` e `chapter` permanecem no `NarrativeStateSnapshot`. Estado
local de uma ocorrência fica em `StageResumeState` indexado por
`CampaignNodeId`. Revisitar restaura o checkpoint daquela ocorrência; usar o
mesmo template em outro nó cria outro checkpoint.

## Integração proposta sem duplicação de estado

### StageLoader

O orquestrador resolve `CampaignNodeId`, busca o `CampaignNode` e chama:

```ts
stageLoader.load({
  stageId: node.stageId,
  runId: graph.runId,
  runSeed: node.stageSeed,
  resume: traversal.nodeResumes[node.id],
});
```

`StageLoader` não conhece arestas nem sorteia região. O resultado é associado ao
node pelo adapter de aplicação.

### StageDirector

Recebe os `stageExitId` resolvidos e continua emitindo `exit.unlock` e
`stage.complete`. O router de campanha converte `stageExitId` em
`CampaignEdgeId`; o director não escolhe target.

Existe um bloqueio contratual antes da implementação: `NarrativeIdentityScope`
usa apenas `stageId`, portanto duas ocorrências do mesmo template colidiriam na
mesma run. A primeira etapa de código deve adicionar um `stageInstanceId`
opcional e retrocompatível, obrigatório no modo campanha, usando
`CampaignNodeId`. Saves v1 antigos usam `stageId` como fallback. Não é permitido
contornar isso anexando node ao `stageId` registrado ou duplicando módulos.

### Persistência

Agora existe estado concreto que justifica futuramente `umbra-trail-run-v1`:

```ts
export interface CampaignTraversalState {
  readonly version: 1;
  readonly graph: CampaignGraph;
  readonly currentNodeId: CampaignNodeId;
  readonly visitedNodeIds: readonly CampaignNodeId[];
  readonly traversedEdgeIds: readonly CampaignEdgeId[];
  readonly revealedEdgeIds: readonly CampaignEdgeId[];
  readonly revisitCounts: Readonly<Record<CampaignNodeId, number>>;
  readonly physicalExits: Readonly<Record<CampaignNodeId, PhysicalExitResolution>>;
  readonly nodeResumes: Readonly<Record<CampaignNodeId, StageResumeState>>;
}
```

O run snapshot não copia `NarrativeStateSnapshot`, progressão ou dados do mapa.
O `CampaignSaveService` continua autoridade narrativa; `StageResumeState`
continua sendo reutilizado sem formato paralelo. Um futuro `CampaignRunService`
usa `SaveStoragePort`, valida envelope/revisões e coordena protocolo recuperável:

1. persistir checkpoint do nó atual;
2. registrar transição pendente `edgeId + source + target`;
3. persistir cursor no target;
4. carregar target via `StageLoader`;
5. confirmar transição.

Falha entre passos restaura o último cursor confirmado. Não se declara transação
exatamente-uma-vez entre duas chaves; qualquer efeito externo continua exigindo
deduplicação do consumidor.

## Protótipo mínimo

O primeiro protótipo de implementação usa somente três ou quatro módulos já
presentes no `StageRegistry`, sem editar seus mapas:

```text
legacy.start
  ├─ physical-exit.route-a → legacy.route-a ─┐
  └─ physical-exit.route-b → legacy.route-b ─┴→ legacy.rejoin
```

- `verse_01_atrium` pode atuar como início e `verse_02_galeria` como uma das
  rotas conhecidas;
- os demais IDs são escolhidos do registry e registrados na SPEC de
  implementação, sem inventar IDs ou depender da ordem do array;
- se houver apenas três templates adequados, um pode aparecer em duas ocorrências
  com `CampaignNodeId`, seed e checkpoint distintos;
- duas saídas físicas aparecem no início, ambas reúnem no mesmo nó final;
- feature flag própria, desligada por padrão, mantém rollback integral ao fluxo
  legado;
- o protótipo prova routing e persistência, não conteúdo amazônico final.

## Validação e testes planejados

### Contratos e geração

- IDs, revisões, duplicatas e referências inválidas;
- mesma request → mesmos bytes normalizados;
- seeds diferentes produzem variação dentro das restrições;
- catálogo em outra ordem produz o mesmo grafo;
- todo caminho completo tem nove profundidades e três marcos;
- branches têm largura máxima dois e rejoin válido;
- elegibilidade por ato, bioma, dificuldade, flags, eventos e beats;
- falha tipada quando não há template/marco/capacidade suficiente;
- mesmo template em dois nodes não colide em identidade.

### Narrativa e softlocks

- cada beat obrigatório domina o início do ato seguinte;
- nenhum ramo pula marco ou conclusão;
- saída crítica não depende só de missão opcional ou ramo excluído;
- retorno respeita limites e não repete regra/recompensa `once`;
- missão secundária mantém progresso após sair e revisitar.

### Saídas físicas

- cada exit está em tile transitável e no componente do spawn;
- N exits usam N tiles distintos com separação mínima;
- resultado independe da ordem dos candidatos;
- retry procedural é limitado e determinístico;
- falta de espaço nunca produz tile inválido;
- placement salvo com digest incompatível falha sem mutação.

### Persistência e integração

- round-trip preserva grafo, cursor, placements e checkpoints;
- load não ressurteia grafo persistido;
- corrupção, revisão incompatível e node/edge desconhecido falham atomicamente;
- `StageLoader` recebe template, node seed e resume corretos;
- `StageDirector` desbloqueia exit local sem conhecer target;
- morte/restart permanece no mesmo node;
- transição pendente é recuperada antes ou depois da troca de cursor;
- flag OFF preserva fluxo e saves legados byte a byte;
- rollback do protótipo volta ao loader legado sem criar run save parcial.

### Teste de navegador futuro

Testes headless não comprovam colisão real do Phaser. Antes de ampliar o piloto,
um teste end-to-end deve abrir o build, caminhar fisicamente até cada saída,
confirmar que colisão dispara a aresta correta, morrer/reiniciar em cada rota e
retomar o mesmo grafo após reload.

## Sequência incremental de implementação

1. **Contratos e identidade:** implementar tipos, validators e
   `stageInstanceId` aditivo; nenhum generator ainda.
2. **Gerador headless:** catálogo, elegibilidade, RNG, topologia, dominators e
   testes determinísticos.
3. **Resolver de saídas:** placement puro sobre `LevelDefinition`, capacidade,
   retries e diagnósticos; sem Phaser.
4. **Persistência de run:** envelope v1, validação externa, checkpoints por node
   e protocolo de transição; nenhuma conexão com saves legados.
5. **Application router:** composition root coordena graph, loader, director e
   serviços sem sincronização bidirecional.
6. **Protótipo legado:** feature flag OFF por padrão, quatro nodes/two routes,
   rollback e caracterização Phaser mockada.
7. **Validação real:** navegador, telemetria diagnóstica e decisão explícita
   antes de ampliar para nove posições e conteúdo próprio.

Cada item exige SPEC atualizada antes de código e termina com gates, typecheck,
testes completos, build e `git diff --check`.

### Etapa 8.1 — contratos e identidade (implementada em 2026-10-28)

Implementa somente o item 1 da sequência. Não há gerador, resolver de saídas,
persistência de run, router, integração com Phaser ou conteúdo de campanha.

Entregas observáveis:

- `src/stages/contracts/CampaignGraph.ts` declara `CampaignGraph`,
  `CampaignNode`, `CampaignEdge`, `CampaignAct`, `PhysicalExit`, os aliases de ID
  e os diagnósticos tipados do validador. O arquivo é exportado por
  `src/stages/index.ts`.
- `CampaignGraphValidator` em `src/stages/runtime/` é headless, puro e não lê
  relógio, storage, Phaser ou gerador de mapas. `validate(graph)` devolve
  diagnósticos ordenados e congelados; lista vazia aceita o grafo.
- `NarrativeIdentityScope.stageInstanceId` é opcional. Quando ausente,
  `narrativeScopePrefix` produz exatamente o prefixo legado. Quando presente,
  acrescenta `.instance.<CampaignNodeId>` ao prefixo, de modo que duas
  ocorrências do mesmo `stageId` não compartilham eventos, regras ou operações.
- `CampaignSaveValidator` aceita o campo opcional, valida seu formato e compara
  identidades por `stageInstanceId` quando ambos os lados o declaram. Save v1
  sem o campo continua usando `stageId` como fallback.

Invariantes verificadas pelo validador:

1. schema e versão de gerador iguais a 1, revisões positivas, IDs estáveis e
   únicos, referências de nó/aresta/ato existentes;
2. exatamente três atos com ordinais 1–3 e faixas de profundidade `[0,2]`,
   `[3,5]` e `[6,8]`, alinhadas à profundidade de cada nó;
3. profundidades 0–8, uma posição por caminho, marcos exclusivos em 2, 5 e 8,
   com `requiredBeatIds` produzidos pelo próprio marco;
4. arestas forward/branch/rejoin avançam exatamente uma profundidade, sem
   ciclos; arestas return só regressam dentro do mesmo ato, com limite 2;
5. bifurcação com largura máxima dois, rótulos de ramo únicos e rejoin comum na
   profundidade seguinte; nenhum nó ultrapassa duas saídas;
6. entrada única, todo nó alcançável a partir dela, todo nó não terminal com
   caminho forward até `campaign.complete` e único predecessor de conclusão;
7. entre nove e doze nós; duas ocorrências do mesmo template exigem IDs e
   `stageSeed` distintos.

Testes: `src/tests/campaignGraph.test.ts` cobre um grafo canônico positivo, IDs
duplicados, referências ausentes, marcos inválidos, bifurcação sem rejoin,
ciclo/aresta regressiva, nó inalcançável, softlock, conclusão fora do último
marco, repetição de template e escopo de identidade narrativa com e sem
`stageInstanceId`.

Fora desta etapa: `RegionTemplate`, elegibilidade, `CampaignGraphGenerator`,
`PhysicalExitResolution`, saves de run, `StageDirector` de campanha e qualquer
alteração em `GameScene`, combate, IA, procedural ou Phaser.

### Etapa 8.2 — gerador headless (implementada em 2026-10-28)

Implementa o item 2 da sequência. A classe `CampaignGraphGenerator`, exportada
por `src/stages/index.ts`, recebe `CampaignGraphRequest` e devolve
`CampaignGraphResult`. Ela não acessa Phaser, cenas, storage, relógio, gerador de
mapas ou estado global.

Contratos adicionados em `src/stages/contracts/CampaignGraph.ts`:
`RegionTemplate`, `CampaignGraphGenerationContext`, `CampaignGraphRequest`,
`CampaignGraphFailureCode` e `CampaignGraphResult`. `PhysicalExit` continua sendo
somente o contrato de saída resolvida; o gerador não escolhe tiles.

Estrutura gerada:

- profundidades 0–8 com um nó por posição; bifurcações opcionais colocam duas
  alternativas na mesma profundidade e convergem na profundidade seguinte;
- atos I, II e III fecham nos marcos 2, 5 e 8, cujo template precisa fornecer o
  beat do ato (`beat.act-1`, `beat.act-2`, `beat.act-3`);
- são 9 nós sem bifurcação e até 12 com uma bifurcação por ato;
- arestas usam `branch` na saída do nó bifurcado, `rejoin` na convergência e
  `forward` nos demais avanços; o último marco é o único predecessor de
  `campaign.complete`;
- IDs de nó derivam de `campaignId`, `runId`, `slotId` e `branchId`; IDs de
  aresta de origem e destino; `physicalExitId` da origem e da aresta; `stageSeed`
  do `graphSeed`, nó, template e revisão.

Elegibilidade: ato permitido, afinidade opcional por tag `slot.<slotId>`,
dificuldade da posição (`depth + 1`) dentro do intervalo, capacidade física
suficiente, `revisit` (`forbidden`/`checkpoint` proíbem reutilização na run;
`repeatable` proíbe apenas adjacência), flags/eventos/beats do contexto congelado
e beat obrigatório para marcos. Condições `flag.equals`, `all`, `any` e `not` são
avaliadas; `mission.status` e `progression.unlocked` tornam o template inelegível
de forma conservadora. `presetIds` é validado, mas ainda não filtra porque o
request não declara um preset-alvo.

Determinismo: o `generationContextDigest` canonicaliza flags, eventos e beats
ordenados; `graphSeed = hash(runSeed, campaignRevision, catalogRevision,
digest)`; cada seleção usa um salt `hash(graphSeed, actId, slotId, branchId)` e
uma escolha ponderada inteira sobre candidatos ordenados por ID. A implementação
usa FNV-1a estável e não mantém RNG mutável. Reordenar o catálogo não altera o
grafo; trocar `runSeed` altera seeds e escolhas sem mudar a topologia por acaso.

Falhas tipadas: `invalid-request`, `invalid-template`, `duplicate-id`,
`insufficient-eligible-regions`, `milestone-unavailable`, `invalid-topology` e
`narrative-beat-unreachable`. Todo grafo gerado passa por
`CampaignGraphValidator` antes de ser devolvido.

Testes: `src/tests/campaignGraphGenerator.test.ts` cobre 12 nós com três
bifurcações e três convergências, 9 nós sem bifurcação, identidade de nodes e
saídas físicas, igualdade para a mesma request, independência da ordem do
catálogo, variação por seed, contexto canônico, tags, dificuldade, flags e
catálogos inválidos/insuficientes.

Fora desta etapa: posicionamento físico das saídas, persistência de run, UI,
router de aplicação, conteúdo amazônico e qualquer alteração em `GameScene`,
combate, simulação, progressão ou Phaser.

### Etapa 8.3 — resolver de saídas físicas (implementada em 2026-10-28)

Implementa o item 3 da sequência. `PhysicalExitResolver`, exportado por
`src/stages/index.ts`, recebe `PhysicalExitRequest` — nó atual, arestas de saída
e `LoadedStage` — e devolve `PhysicalExitResult`. Não altera o mapa, o manifesto,
o grafo, `GameScene`, Phaser ou qualquer sistema de jogo.

Contratos adicionados ao bloco de saída física: `PhysicalExitRequest`,
`PhysicalExitResolution`, `PhysicalExitResult`, `PhysicalExitDiagnostic` e
`PhysicalExitDiagnosticCode`. `PhysicalExitFailureCode` ganhou
`invalid-request` para entradas estruturalmente inválidas.

Algoritmo implementado:

1. valida nó, arestas, manifesto e mapa; exige `node.stageId === stage.id` e no
   máximo `node.maximumPhysicalExits` arestas de saída;
2. localiza o primeiro tile `Spawn` em ordem de varredura e calcula o componente
   alcançável com `isWalkableTile`, a mesma semântica pública do mapa;
3. reserva spawns, inimigos/patrulhas/emboscadas/ondas, itens, decorações,
   `SectionExit`, NPCs e âncoras `map-exit` de NPC; tiles `Chest`, `LockedDoor`,
   hazards e paredes nunca entram no pool livre;
4. exige clearance (tile interno, com vizinho ortogonal transitável) e nunca
   coloca duas arestas no mesmo tile ou sobre o spawn;
5. ordena arestas por `id` e candidatos por distância máxima-mínima a escolhidos
   e spawn (desc), borda adjacente a parede (primeiro), hash estável de
   `stageSeed + edgeId + attempt + x + y` e coordenada como desempate final;
6. reutiliza `manifest.exits` quando o anchor (`tile`, `map-exit`,
   `player-spawn`) é transitável, alcançável, distinto e respeita separação,
   preservando o `stageExitId` declarado; fora disso usa `edge.exitSlotId`, com
   `physicalExitId` e `edge.id` como fallbacks de unicidade;
7. tenta quatro placements determinísticos: separação 3, 2 e 1 em piso limpo e,
   por último, separação 1 admitindo `Exit`/`Boss` pré-existentes; invariantes de
   transitabilidade, alcançabilidade, distinção, spawn e um-para-um nunca são
   relaxadas;
8. revalida cada caminho spawn → saída com BFS independente e rejeita o
   placement inteiro se qualquer saída falhar — nunca há resultado parcial.

`levelDigest = level.<hash FNV-1a>` cobre `level.id`, `tileMap`, spawns, exits,
bosses, inimigos/patrulhas, itens, decorações, `SectionExit`, âncoras de NPC e
`manifest.exits` ordenados; reordenar entidades não muda o digest nem o
resultado.

Diagnósticos: `physical-exit.request-invalid`, `capacity-exceeded`,
`entry-missing`, `entry-unreachable`, `explicit-anchor-invalid`,
`explicit-anchor-unreachable`, `insufficient-space`, `path-invalid`,
`tile-duplicated` e `placement-invalid`, ordenados e congelados. Falhas de
entrada retornam `invalid-request` ou `entry-unreachable`; falta de espaço e
capacidade retornam `insufficient-exit-space`.

Fora desta etapa: persistência da resolução, validação de placements salvos
(`saved-placement-incompatible`), regeneração procedural de mapas, poda de
arestas, portais/transições visuais, UI e integração Phaser.

Testes: `src/tests/physicalExitResolver.test.ts` cobre piso limpo, anchors
explícitos `tile`/`map-exit`, anchor bloqueado, ordem de arestas, repetição,
queda para outro attempt por separação, entidades/NPCs reservados, hazards,
mapa pequeno, área desconectada, capacidade, spawn ausente, digest estável e
request inválida.

### Etapa 8.4 — vinculação canônica de saídas (2026-10-28)

Implementa a costura headless, posterior ao placement, entre grafo, manifesto e
saída física:

```text
CampaignEdge → StageExitDefinition? → PhysicalExit → CampaignNode | campaign.complete
```

`CampaignExitBinder` recebe o `CampaignGraph`, `sourceNodeId`, o `LoadedStage` e
o `PhysicalExitResult` já produzido pela Etapa 8.3. Ele não chama o resolver,
não escolhe tiles, não modifica o grafo e não corrige inconsistências.

Política canônica:

1. o conjunto autoritativo de arestas é exatamente o conjunto de arestas do
   grafo cujo `sourceNodeId` corresponde ao request;
2. a saída física é localizada exclusivamente por `edgeId`; `id`, source,
   target e `physicalExitId` precisam coincidir com a aresta;
3. quando `physical.stageExitId` identifica uma entrada em `manifest.exits`, o
   vínculo é `manifest-exit`. O `targetStageId` declarado precisa ser o
   `stageId` do node de destino ou `campaign.complete`;
4. quando não existe entrada com esse ID, só é permitido um vínculo
   `synthetic-slot` se `physical.stageExitId === edge.exitSlotId`. Assim, fases
   sem saída explícita continuam compatíveis sem atribuição por posição;
5. saída de manifesto não usada é permitida para compatibilidade legada, mas
   nunca é escolhida como fallback pelo binder; saída física adicional é erro;
6. IDs repetidos em edge, saída física ou manifesto, tile físico reutilizado,
   referência ausente e destino incompatível invalidam o resultado inteiro;
7. bindings e diagnósticos são ordenados canonicamente. Reordenar nodes, edges,
   `manifest.exits` ou physical exits não altera o resultado.

Um binding bem-sucedido preserva `edgeId`, `exitSlotId`, `stageExitId`,
`physicalExitId`, source/target node, target stage, edge, definição de manifesto
quando houver e coordenada física. Coordenada e ordem de array nunca são usadas
como identidade.

Falhas esperadas são discriminadas: request inválido, resolução física anterior
falha, referência de node/edge inválida, saída física ausente/adicional,
identidade física incompatível, manifesto duplicado/reutilizado, associação de
slot ausente e destino inconsistente. Não existe sucesso parcial.

Compatibilidade: não altera `CampaignGraphGenerator`, `PhysicalExitResolver`,
`StageManifest`, `LoadedStage` ou Phaser. O futuro router de aplicação consumirá
o binding para iniciar a transição; render, colisão e animação permanecem fora
desta etapa.

Rastreabilidade: o parser do gate passou a ler o bloco cercado imediatamente
após `Prompt efetivamente recebido`, em vez de confundir títulos Markdown `##`
do próprio prompt com o fim da seção. A fixture dedicada comprova que o texto
efetivo pode ser preservado integralmente sem abrir arquivos sem schema v1.

Evidência: `campaignExitBinder.test.ts` cobre 14 casos de saída única,
bifurcações com duas e três saídas, manifesto/anchor explícito, slot sintético,
IDs duplicados, saída ausente/adicional, destinos incompatíveis, reordenação,
convergência, falha física anterior, atomicidade e repetição determinística. A
suíte completa passou com 699 testes em 40 suítes. Typecheck, build (698 módulos),
architecture gate (1.674 arquivos/3.617 dependências), traceability gate (sete
registros v1 e oito legados explícitos) e `git diff --check` também passaram.

### Etapa 8.5 — Campaign Router headless (2026-10-28)

O router pertence a `src/application/stages/` e coordena contratos públicos sem
introduzir navegação em `stages`, `narrative` ou Phaser:

```text
CampaignRunState
  → StageLoader(current)
  → PhysicalExitResolver
  → CampaignExitBinder
  → physicalExitId selecionado
  → StageLoader(target)
  → preparação imutável
  → confirmação em memória
  → CampaignRunSaveService
```

#### Pré-requisito de persistência ausente

Apesar de o pedido desta etapa citar `CampaignRunState` e
`CampaignRunSaveService` como existentes, o repositório possuía apenas
`CampaignSaveService`, cuja autoridade é o snapshot narrativo stage-scoped. A
Etapa 8.5 implementa, portanto, o contrato mínimo de run previsto na seção
“Persistência”, sem modificar ou copiar o save narrativo:

- `CampaignRunState` contém graph, cursor confirmado, histórico de nodes/edges,
  revisitas, edges reveladas, placements físicos por node, checkpoints
  `StageResumeState` e IDs de transição confirmados;
- a chave aditiva é `umbra-trail-run-v1`, com envelope
  `umbra-trail-run-save` versão 1;
- `CampaignRunSaveService` valida dados externos, referências, identidade,
  checkpoints e placements antes de expor ou gravar estado;
- o serviço não lê nem escreve `umbra-trail-campaign-v1`, profile, settings ou
  saves legados.

#### Propriedade e protocolo

Uma instância de `CampaignRouter` é a única proprietária do cursor em memória.
`inspect()` carrega o node atual, resolve suas saídas e produz um
`CampaignNavigationSnapshot` canônico. Disponibilidade exige edge revelada,
limite de travessia não excedido e, quando aplicável, elegibilidade externa da
condição e unlock narrativo do `stageExitId`. O router não reimplementa o
avaliador narrativo.

`prepare(physicalExitId)` usa exclusivamente o ID físico. A preparação valida o
binding e carrega o target com `runId`, `node.stageSeed`, checkpoint do target e
`stageInstanceId = targetNodeId`; nenhum estado ou save muda. Apenas uma
preparação pode existir por router.

`confirm(preparationId)` troca a referência imutável do estado uma vez e depois
persiste. Falha de persistência restaura imediatamente a referência anterior.
O save faz preflight otimista dos bytes anteriores. Se `write` lançar, relê a
chave: bytes novos significam confirmação verificada; bytes anteriores
significam rollback seguro; qualquer outro conteúdo produz
`storage-state-unknown` e requer reconciliação pelo chamador. Não se declara
transação entre o run save e o save narrativo, nem exatamente-uma-vez para
efeitos externos.

Transição para `campaign.complete` marca a run concluída e mantém o último node
como cursor auditável. Transições repetidas, preparação concorrente, IDs
inexistentes, edges bloqueadas e confirmação stale falham tipadamente.

#### World Lab

`CampaignNavigationSnapshot` é serializável e preserva node, stage, edge,
`physicalExitId`, `stageExitId`, target e disponibilidade. O World Lab pode
consumi-lo por adapter, mas o router não importa `devtools` e a interface
SVG/DOM não é alterada nesta etapa.

#### Critérios observáveis

- branch selecionado por ID chega ao target correto e rejoin preserva histórico;
- target é carregado antes de qualquer mutação;
- falhas de current load, resolver, binder, target load e save preservam estado;
- mesma run produz snapshot e preparation IDs iguais;
- save/load restaura cursor, histórico, placements, checkpoints e identidades;
- save corrompido/incompatível falha sem sobrescrita;
- testes cobrem concorrência, repetição, bloqueio, rollback e recuperação após
  erro de storage;
- gates, typecheck, suíte completa, build e `git diff --check` passam.

Evidência: `campaignRouter.test.ts` cobre 16 cenários de branch/rejoin,
seleção exclusiva por `physicalExitId`, edge inexistente/bloqueada, condição
delegada, target preparado com seed/checkpoint antes da mutação, concorrência,
repetição, falhas de current/target loader, resolver e binder, rollback de
write, write verificado após erro, storage desconhecido, round-trip da run,
preservação do save narrativo, placement persistido incompatível, corrupção,
identidade, determinismo e conclusão. A suíte completa passou com 729 testes em
43 suítes; typecheck, build (701 módulos), architecture gate (1.692 arquivos e
3.668 dependências), traceability gate (nove registros v1 e oito legados) e
`git diff --check` passaram.

## Riscos e decisões adiadas

- o catálogo procedural atual contém biomas de outra direção artística; o
  mapeamento amazônico exige pesquisa e SPEC cultural própria;
- layouts pequenos podem não comportar bifurcação; capacidade e fallback devem
  ser provados antes da integração Phaser;
- `CampaignSaveService` continua stage-scoped; a Etapa 8.1 adicionou
  `stageInstanceId` opcional, mas checkpoint e cursor por nó só entram com o
  save de run;
- persistência coordenada em duas chaves não é transação atômica; o journal
  recuperável reduz inconsistência, mas não substitui deduplicação externa;
- revisitas aumentam combinações de estado e duração; limites permanecem baixos
  até testes de balanceamento;
- digest e generator version precisam de política de migração antes de qualquer
  save de produção;
- a allowlist dos architecture gates não muda nesta etapa; qualquer dependência
  nova de implementação exigirá justificativa e hardening próprios.

## Critérios de aceitação desta SPEC

- contratos propostos cobrem graph, generator, node, edge e physical exit;
- nove posições, três atos e marcos obrigatórios são invariantes verificáveis;
- determinismo e elegibilidade não dependem de callbacks ou estado implícito;
- saída física possui algoritmo, invariantes e fallback sem softlock;
- repetição de template não colide em identidade/checkpoint;
- StageLoader, StageDirector e persistência têm responsabilidades não duplicadas;
- retorno, revisita, missões secundárias e revelações obrigatórias são tratados;
- protótipo e sequência incremental têm rollback e testes observáveis;
- nenhuma mudança executável além da Etapa 8.1 registrada acima foi realizada
  na etapa documental;

## Evidência da etapa documental

Em 2026-10-28, `npm run check:gates` passou: o gate arquitetural analisou 1.664
arquivos e 3.584 dependências; o gate de rastreabilidade validou três registros
v1, oito históricos explícitos e um commit ainda pendente. `git diff --check`
não encontrou erros. Typecheck, build e testes de runtime não foram repetidos
porque esta etapa altera somente Markdown e não cria contrato executável.
