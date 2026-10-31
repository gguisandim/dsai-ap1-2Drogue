# Etapa 9.6E.3 — Consolidação de contratos, identidades e persistência versionada

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.6E.2. Não substitui as políticas
`umbra.fixed-nine.v1` e `umbra.branching-nine.v1`, não altera a topologia de
nenhuma delas e não inicia a Etapa 9.7.

## Objetivo

Fechar a base de identidades, versionamento de composição e compatibilidade de
snapshots antes da autoria independente de capítulos. A etapa introduz o menor
conjunto de mudanças necessário para:

1. dar resistência a colisões à identidade de novas composições;
2. distinguir explicitamente identidade legada de identidade atual;
3. classificar snapshots persistidos sem reescrever bytes nem reinterpretar
   identificadores históricos;
4. expor as políticas linear e ramificada no menu existente, respeitando a
   disponibilidade real do catálogo.

Nenhum compositor, gerador, grafo, roteador, resolver, binder ou sistema de save
é recriado.

## Auditoria das identidades existentes

| Identidade | Onde nasce | Persistida em | Comparada/restaurada por | Situação |
|---|---|---|---|---|
| `stageId` | definição / catálogo | snapshot, grafo, save | igualdade de ID estável | correta |
| `stageInstanceId` do snapshot | composição | snapshot | `instance.<compositionId>.<slotId>` | correta; passa a usar identidade versionada |
| `nodeId` | gerador do grafo | grafo/save | igualdade de string; chave de `revisitCounts`, resumes e recompensas | correta |
| `runId` | `GameSessionService` | grafo/save/navegação | 64 bits desde 9.6D, com fallback legado | correta |
| `compositionId` | compositor | snapshot | FNV-1a de 32 bits | **insuficiente para identidade persistida** |
| contador de visita | roteador | `revisitCounts[nodeId]` | incremento por nó | correta |
| `transitionId` | roteador | journal de recompensas | hash de 32 bits com run, aresta e ocorrência | limitação declarada; não alterada nesta etapa |

### Inconsistências comprovadas

1. **`compositionId` em 32 bits.** É a identidade persistida da composição e
   também prefixo de todo `stageInstanceId`. Duas composições distintas podem,
   em tese, compartilhar a mesma identidade. A 9.6D já ampliou o `runId` por
   esse motivo; o `compositionId` permaneceu pendente.
2. **Mesmo nome, conceitos diferentes para `stageInstanceId`.** No snapshot,
   `stageInstanceId` identifica a ocorrência escolhida pela composição
   (`instance.<compositionId>.<slotId>`). No roteador e no journal de
   recompensas, o campo homônimo carrega o `nodeId` materializado. Os dois são
   estáveis e associados um a um por `slotId`, mas não são o mesmo valor. A
   nomenclatura é documentada aqui; o campo persistido não é renomeado para não
   romper saves.
3. **`compositionId` é escopado por run.** A identidade da composição inclui
   `runId`, portanto duas runs com as mesmas atribuições não compartilham
   composição. Isso é intencional e isola progresso; `compositionId` e `runId`
   têm namespaces distintos e nunca são usados como substitutos um do outro.
4. **`transitionId` continua em 32 bits.** Alterar o algoritmo mudaria
   identificadores já usados pelo journal e pela deduplicação de recompensas.
   A troca fica fora desta etapa e permanece registrada como limitação.

### Garantias verificadas para as identidades já existentes

- duas instâncias da mesma definição têm `slotId`, `stageInstanceId` e `nodeId`
  distintos;
- revisitar um nó incrementa `revisitCounts` e preserva `nodeId` e
  `stageInstanceId`;
- o grafo persistido é a fonte autoritativa após reload; nenhum identificador
  persistido é recalculado na restauração;
- runs distintas não compartilham progresso, resumes, recompensas ou chaves
  narrativas.

## Versionamento de `compositionId`

### Formato

- identidade v1 (histórica): `composition.<8 hex>` — FNV-1a de 32 bits,
  preservada somente para leitura.
- identidade v2 (novas composições): `composition.v2.<16 hex>` — dois
  acumuladores independentes de 32 bits derivados de FNV-1a e djb2.

O prefixo `composition.v2.` é o discriminador explícito. Um ID antigo nunca é
reinterpretado como novo: a validação escolhe o algoritmo pelo prefixo.

### Material da identidade v2

1. domínio fixo `composition.identity.v2`;
2. `policyId`;
3. `policyVersion` do contrato de política;
4. `seed`;
5. `campaignId`;
6. `runId`;
7. `desiredStageCount`;
8. JSON canônico das atribuições ordenadas por `slotId`, com `slotId`, `actId`,
   `depth`, `kind`, `stageId`, `manifestRevision` e `chapterRevision`.

A ordenação por `slotId` e a projeção do catálogo já ordenada por `stageId`
tornam o resultado independente da ordem de registro do catálogo.

O material v1 continua sendo exatamente o da 9.6B/9.6D: `policyId`, `seed`,
`campaignId`, `runId` e a projeção de `slotId`, `stageId`, `manifestRevision` e
`chapterRevision` na ordem persistida. Nenhum snapshot histórico é reescrito.

### Snapshot

`CampaignCompositionSnapshot` recebe o campo aditivo opcional
`identityVersion?: 1 | 2`.

- snapshots novos gravam `identityVersion: 2`;
- snapshots históricos sem o campo continuam válidos e são classificados pelo
  prefixo do `compositionId`;
- o schema `umbra-campaign-composition` permanece na versão 1; o envelope de
  save permanece `umbra-trail-run-save` versão 1.

O `stageInstanceId` de uma composição v2 usa o novo `compositionId`
(`instance.composition.v2.<16 hex>.<slotId>`). Snapshots v1 mantêm seus
`stageInstanceId` exatamente como estavam.

## Compatibilidade e migração de snapshots

A análise de um snapshot produz quatro classificações:

| Classificação | Critério | Ação |
|---|---|---|
| `current` | schema/versão válidos, identidade v2 declarada e coerente | restaurar; nenhuma escrita |
| `legacy-compatible` | schema/versão válidos, identidade v1 sem o campo aditivo | restaurar os IDs como estão; sem migração |
| `migrated` | identidade v2 válida, mas o campo aditivo `identityVersion` ausente | acrescentar `identityVersion: 2` somente em memória; IDs preservados |
| `incompatible` | schema/versão desconhecidos, ID irreconhecível, conflito entre prefixo e campo, material divergente | falhar com diagnóstico tipado; bytes preservados |

Migração de identidade v1 para v2 é **rejeitada**: trocaria `compositionId` e
todos os `stageInstanceId`, violando a preservação de identificadores
históricos. A leitura direta da v1 é a estratégia correta.

Regras obrigatórias:

- a migração em memória da classificação `migrated` não altera `compositionId`
  nem `stageInstanceId`;
- nenhuma restauração regrava o save;
- o grafo persistido no run save continua autoritativo; a geração de grafo na
  restauração serve apenas para validação;
- snapshot corrompido, revisão divergente, destino divergente ou associação de
  identidade inválida falham sem sobrescrever bytes, sem duplicar recompensas,
  sem mover o jogador e sem alterar limites de travessia.

## Política ramificada no menu

`GameSessionService.menuState(policyId?)` passa a expor:

- a política selecionada (`compositionPolicyId`);
- disponibilidade e motivo de cada política (`policies`);
- disponibilidade específica da ramificada (`branchingCampaignAvailable`);
- diagnósticos da ramificada (`branchingCompositionDiagnostics`);
- contagem de definições (9) e de instâncias (10) exigidas pela ramificada.

`campaign-random` usa a disponibilidade da política selecionada.
`campaign-custom` continua linear: a seleção manual existente opera sobre os
nove slots fixos. Os modos clássico e individual permanecem inalterados.

O menu (`GameModesScene`) reutiliza o painel existente:

- alterna entre LINEAR e RAMIFICADA;
- mostra a quantidade real de candidatas e as instâncias exigidas;
- exibe disponibilidade e o primeiro diagnóstico;
- permite editar ou gerar seed;
- inicia pela API da política selecionada;
- ao retomar, adota a política persistida da run;
- não retoma campanha concluída;
- recusa iniciar uma política diferente sobre uma run ativa salva com a mesma
  seed, sem sobrescrever bytes (`policy-mismatch`). Uma seed nova substitui a
  run anterior pelas regras já existentes.

O catálogo de produção continua insuficiente para nove fases. O modo ramificado
fica visível e corretamente indisponível; nenhum conteúdo fictício é adicionado.

## Diagnósticos novos

Códigos de diagnóstico de composição:

- `composition.identity.unsupported`
- `composition.identity.version-mismatch`
- `composition.identity.mismatch`
- `composition.snapshot.migrated` (informativo)

Códigos de falha:

- `persisted-composition-incompatible` para identidade ausente, desconhecida ou
  incoerente;
- `policy-mismatch` em `GameSessionService` para run ativa salva de outra
  política com a mesma seed.

## Preparação para a Etapa 9.7

Um capítulo independente deve declarar, pelos contratos já existentes:

- **Identidades estáveis:** `ChapterManifest.id`, `StageManifest.id` e
  `StageExitDefinition.id` namespaced, minúsculos e imutáveis. Instâncias de
  campanha e nós de grafo pertencem à composição/run, não ao capítulo.
- **Revisões:** `ChapterManifest.revision` e `StageManifest.revision`
  monotônicas. Uma definição com a mesma identidade e revisão deve producir o
  mesmo conteúdo observável.
- **Capabilities:** `StageCapabilityRequirement` declaradas no capítulo ou no
  estágio; o catálogo classifica incompatibilidade sem executar o motor.
- **Elegibilidade:** `campaignCatalog.availability`, `participation` e `role`
  definem `campaign-eligible`, `narrative-reserved`, `individual-only` ou
  `planned`.
- **Dependências:** `ChapterDependency` e `StageManifest.campaignCatalog`
  expressam pré-requisitos por ID e revisão; capítulos não importam arquivos
  internos de outro capítulo.
- **Encontros:** `StageEncounterDefinition` e `StageEncounterCompletion`
  declaram ondas e conclusão sem chamar diretamente o motor de combate.
- **Apresentação visual:** `StagePresentationDefinition`, biomas, tilesets,
  sprites e áudio são referências declarativas; assets não são adicionados pela
  composição.
- **Entradas e saídas:** `StageManifest.exits` associa `exitId` a
  `targetStageId` (definição, nunca `nodeId`). `maximumPhysicalExits` declara a
  capacidade real.
- **Política de revisita:** `campaignCatalog.revisit` é `forbidden`,
  `checkpoint` ou `repeatable`; revisitar não cria nova instância nem nova
  recompensa.

Ferramentas externas podem produzir e validar módulos usando apenas esses
contratos, `StageRegistry`, `StageValidator` e `StageCatalogService`, sem alterar
o motor. Nenhum SDK, CLI ou template é criado nesta etapa.

## Critérios observáveis e testes

### Identidades

1. Duas instâncias da mesma definição têm `stageInstanceId`, `nodeId` e
   `revisitCounts` independentes.
2. Revisitar preserva a identidade da instância e incrementa a visita.
3. Identidades persistem após reload e não são recalculadas.
4. Mesma seed em runs de políticas distintas produz `runId` e `compositionId`
   distintos.
5. `compositionId` v2 e v1 são reconhecidos e validados pelo prefixo.
6. Incompatibilidade entre prefixo, campo e material falha tipadamente.

### Snapshots

1. Serialização e restauração preservam o snapshot e o grafo.
2. Snapshot linear legado v1 restaura sem recomposição.
3. Snapshot ramificado restaura com o grafo persistido.
4. Migração aditiva de `migrated` preserva IDs.
5. Migração de identidade v1 para v2 é rejeitada.
6. Snapshot corrompido e revisão incompatível falham sem sobrescrever bytes.
7. Persistência não recompõe a campanha.

### Campanha

1. Bifurcação, convergência e retorno controlado continuam funcionando.
2. Travessias e recompensas são idempotentes.
3. Conclusão permanece alcançável.
4. A campanha clássica e o save clássico permanecem isolados.

### Menu

1. Alternância entre LINEAR e RAMIFICADA.
2. Preview e início pela API existente.
3. Catálogo insuficiente mantém o modo visível e desabilitado com diagnóstico.
4. Início válido com fixture.
5. Retomada usa a política persistida.
6. Save incompatível ou de outra política não é sobrescrito.

## Homologação

O ambiente de execução não oferece navegador. A cobertura será headless e
Phaser, incluindo o roteamento de cena e as APIs do serviço. Homologação visual
manual permanece pendente e não será declarada como executada.

## Fora de escopo

- topologias arbitrárias, novo compositor, novo gerador, novo roteador;
- novo sistema de save, editor visual, CLI ou SDK;
- migração genérica de todos os saves do projeto;
- alteração de `transitionId`, combate, IA, progressão ou assets;
- novos capítulos, inimigos, biomas ou conteúdo de produção;
- início da Etapa 9.7.
