# Etapa 9.6D — Estabilização, Persistência e Homologação Integrada

## Contexto

A 9.6A expôs o catálogo; a 9.6B criou a composição determinística e o snapshot;
a 9.6C conectou os modos de jogo ao fluxo real. Esta etapa **não expande** o
sistema: comprova o ciclo completo, corrige falhas críticas e documenta riscos.

Fluxo auditado:

```text
GameModesScene
  -> GameSessionService
     -> CampaignCompositionService (snapshot + grafo)
     -> CampaignRunSaveService (snapshot antes da execução)
     -> CampaignRouter
        -> PhysicalExitResolver
        -> CampaignExitBinder
     -> GameScene (campaignRuntime / individualRuntime)
        -> saída física -> próximo node -> persistência
        -> reload -> GameSessionService.restore -> mesmo snapshot/grafo
        -> campaign.complete -> estado completed
```

## Problemas comprovados

### D1. Comparação de saídas físicas dependia da ordem das chaves

`CampaignRouter.samePhysicalResolution` comparava `JSON.stringify` dos objetos.
O save canonicaliza os objetos com chaves ordenadas; a regeneração usa a ordem
literal do resolvedor. Ao restaurar um node cuja resolução já estava
persistida, a comparação falhava como `saved-placement-incompatible`, mesmo com
valores idênticos.

Reprodução: campanha de nove fases concluída e recarregada; o router recusava a
run com `physical-resolution-failed` no último node.

Correção: normalização explícita de todos os campos e ordenação estável das
saídas em `samePhysicalResolution`.

### D2. Recuperação de campanha composta reiniciava com navegação obsoleta

`GameScene.recoverConfirmedCampaignTransition` reiniciava a cena com o mesmo
`campaignRuntime`, cuja `navigation` apontava para a fase anterior. O router já
havia avançado e persistido. Além disso, o runtime injetado não tinha contador
de tentativas, permitindo repetição indefinida.

Correção: antes do restart, o runtime injetado é reconstruído a partir de
`router.inspect()`; se a inspeção falhar, a cena retorna ao menu com diagnóstico.
`campaignRecoveryAttempt` passa a ser propagado no runtime injetado.

### D3. Run composta concluída podia ser retomada em beco sem saída

A mesma seed reabria a run concluída no último node, com todas as saídas
bloqueadas. Correção: `startRandomCampaign`/`startCustomCampaign` recusam a
restauração de run concluída com `run-completed`. O menu gera uma nova seed,
oculta "Retomar" e informa que a campanha anterior terminou. Uma seed distinta
inicia uma nova run e substitui apenas a chave composta.

### D4. Identidade persistida de run em 32 bits

O `runId` composto usava FNV-1a de 32 bits sobre seed + seleção. Não houve
colisão reproduzida, mas a identidade escolhe qual save é retomado, então o
espaço era insuficiente para uma chave persistida.

Correção: novos runs usam 16 hex (dois acumuladores de 32 bits). Saves antigos
continuam retomáveis: a aceitação compara o ID novo **ou** o ID legado
(`legacyComposedCampaignRunId`) derivado da mesma seed/seleção. Nenhum ID
persistido é reescrito.

### D5. Chave narrativa não diferenciava ocorrências

`campaignStageNarrativeSaveKey(runId, chapterId, stageId)` não incluía a
ocorrência. Com a política padrão `forbid` não há repetição, mas uma política
`allow-repeatable` faria dois nodes da mesma definição compartilharem estado
narrativo.

Correção: a função aceita `stageInstanceId` opcional. Runs compostas passam o
`currentNode.id`; a campanha clássica mantém a chave legada.

## Riscos auditados e considerados seguros

- **Snapshot antes da execução**: `startComposedCampaign` compõe, inspeciona o
  entry, grava e só então devolve a sessão à cena.
- **Retomada sem recomposição**: a restauração usa o snapshot persistido e o
  grafo persistido; o grafo regenerado serve apenas de verificação.
- **Alvo não carregável**: `CampaignRouter.prepare` pré-carrega o destino e
  inspeciona sua navegação antes de qualquer avanço; falha deixa o estado
  inalterado.
- **Duplo acionamento**: `busy`, `preparation`, `confirmedTransitionIds` e
  `traversalLimit` impedem transição duplicada.
- **Recompensas**: o journal e `recordStageCompletedIdempotent` deduplicam por
  `transitionId`; recompensa pendente é recuperada após reload.
- **Isolamento individual**: composition root sem storage de campanha e
  `MemoryProgressionStorage`; nenhuma chave de campanha é escrita.
- **Separação clássica/composta**: chaves distintas
  (`umbra-trail-run-v1` e `umbra-trail-composed-run-v1`).
- **Save inválido ou revisão incompatível**: falha tipada, bytes preservados.

## Semântica das identidades

- `stageId`: definição registrada e versionada;
- `stageInstanceId` (snapshot): ocorrência escolhida pela composição;
- `nodeId`: ocorrência materializada no grafo (`node.<campaign>.<run>.<slot>.<branch>`);
- `runId`: identidade persistida da run;
- visita: `revisitCounts` e escopo de ocorrência narrativa;
- `chapterRevision`/`manifestRevision`: conteúdo selecionado;
- recompensa: `transitionId`, que inclui run, aresta e ocorrência.

Nenhum identificador é usado como substituto de outro. `targetStageId` continua
sendo ID de definição, nunca nodeId.

## Ordem das transições

1. resolver saídas físicas do node atual;
2. bind canônico e validação de destino;
3. `prepare`: carregar o destino, inspecionar a navegação dele, calcular a
   transição;
4. `confirm`: atualizar o estado, registrar recompensa pendente e persistir;
5. em falha de persistência, restaurar o estado anterior;
6. liquidar a recompensa de forma idempotente;
7. somente então reconstruir a cena com o destino preparado;
8. em falha pós-confirmação, reconstruir a navegação a partir do router
   avançado ou retornar ao menu com diagnóstico.

## Política de falhas

- composição inválida: não inicia, preserva save;
- save ilegível/incompatível: não sobrescreve;
- revisão ou saída declarada divergente: `composition-failed`;
- alvo não carregável: `target-stage-load-failed` sem avanço;
- falha de persistência: rollback e diagnóstico;
- saída contraditória: `binding-failed`/`destination-mismatch`, nunca redirect
  silencioso;
- run concluída: `run-completed`, sem retomada em beco sem saída.

## Softlocks

Estruturais, antes do início:

- `CampaignGraphValidator` exige alcance de `campaign.complete`;
- compositor valida destinos, atos, marcos, dependências e capacidade;
- fixture 35→9 é composta e validada.

Execução:

- teste percorre nove fases, exige exatamente uma saída disponível por node,
  prepara/confirma cada transição, recarrega em pontos intermediários e conclui;
- dupla preparação/confirmação é recusada;
- alvo ausente falha sem avançar.

Limitação: não é prova de ausência absoluta de softlocks de gameplay (ex.:
condições de conteúdo, placement impossível em mapas específicos). Limita-se ao
que o grafo, o binding e o carregamento permitem provar.

## Campanha de integração

Fixture de teste (não produção):

- 35 definições composíveis com fan-out de destinos, para o capítulo continuar
  alcançável e terminal;
- nove fases selecionadas, três atos, três marcos com beats;
- cada fase reutiliza o mapa legado jogável `verse_01_atrium`
  (spawn, inimigos, itens, saída);
- revisões e IDs estáveis;
- nenhuma fase é registrada como conteúdo normal de produção.

O teste usa `GameSessionService`, `CampaignRouter`, `StageLoader`,
`PhysicalExitResolver`, `CampaignExitBinder` e `CampaignRunSaveService` reais.

## Homologação

O ambiente não oferece navegador. A cobertura é feita por testes de integração
headless e de fiação das cenas. **Homologação visual manual permanece pendente**
e não é declarada como executada.

## Fora de escopo / pendências para 9.6E

- revisitas e arestas de retorno: a topologia `umbra.fixed-nine.v1` é linear,
  com `traversalLimit: 1`; não há revisita jogável;
- topologias alternativas, quantidade ≠ 9, editor e conteúdo remoto;
- migração automática de snapshots entre revisões;
- `compositionId`/`stageInstanceId` do snapshot continuam em FNV-1a 32 bits;
- refatoração ampla de `GameScene` e remoção de `legacy.verse`;
- homologação visual e sonora no navegador.

## Critérios observáveis

1. Ciclo 35→9 compõe, inicia, navega, persiste, recarrega, retoma e conclui.
2. Restauração usa o mesmo snapshot/grafo, sem recompor.
3. Nenhuma transição duplica estado, recompensa ou avanço.
4. Saída contraditória ou alvo ausente falham tipadamente sem avançar.
5. Run concluída não é retomada; nova seed inicia nova run.
6. Save clássico e composto não se misturam.
7. Fase individual não grava save de campanha nem progressão persistente.
8. Saves antigos com runId de 32 bits continuam retomáveis.
9. Chave narrativa de run composta diferencia ocorrências.
10. Suíte completa, typecheck, build, gates e `git diff --check` aprovados.

## Testes

- `campaignIntegrationCycle.test.ts`: ciclo completo, reloads, conclusão,
  recompensas, dupla transição, alvo ausente, identidades distintas, ordem de
  chaves canônica;
- `gameSessionService.test.ts`: saves inválidos/ausentes/removidos, falha de
  escrita, run concluída, identidade legada, chave narrativa por ocorrência;
- compositor, router, saves, narrativa e World Lab existentes como regressão.
