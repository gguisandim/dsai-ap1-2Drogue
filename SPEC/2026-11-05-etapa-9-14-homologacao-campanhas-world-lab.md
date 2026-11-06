# Etapa 9.14 — Homologação integrada de campanhas e automação do World Lab

## Contexto e decisão

A Etapa 9.13 comprovou o ciclo individual em Phaser, mas a transição real entre
fases permaneceu UNKNOWN porque o preview individual carrega somente uma fase.

Esta etapa usa o fluxo de campanha **real** existente — menu clássico, rota
macro, `CampaignMacroRouteBinder`, `CampaignRouter`, `CampaignExitBinder` e
`PhysicalExitResolver` — para comprovar:

**hub `verse_01_atrium` → Igapó das Memórias → Coração Corrompido.**

O segundo estágio é carregado no Phaser, o jogador nasce no destino, recupera o
controle e se movimenta. Nenhum callback, teleporte, HP artificial ou carregador
manual é usado.

Os relatórios de runtime são publicados automaticamente em um diretório de
desenvolvimento e o World Lab os carrega sem importação manual.

## Modo de campanha no executor

O executor `scripts/homologate-chapter.mjs` ganha:

```sh
npm run homologate -- --campaign [--macro-run <id>] [--macro-seed <seed>] [--json]
npm run chapter -- homologate --campaign [--macro-run <id>] [--macro-seed <seed>] [--json]
```

Fluxo:

1. abre o jogo e a tela real de modos;
2. seleciona **CAMPANHA CLÁSSICA** e inicia a campanha pelo mesmo caminho do
   botão do jogo;
3. fecha o guia de controles com o clique previsto pelo próprio jogo;
4. lê `campaignNavigation.snapshot` e o `CampaignRunState` do
   `CampaignRouter`;
5. percorre o hub, usa a saída física e confirma a transição real;
6. executa o Vestígio Submerso, diálogo, missão e flag no Igapó;
7. aciona a saída física do Igapó;
8. aguarda `stage.aguas.coracao-corrompido` carregar;
9. verifica spawn, movimento, câmera, limites, colisões e ausência de estado
   local do Igapó;
10. compara o `CampaignRunState` antes/depois, recompensas, nós visitados,
    transições confirmadas e recursos;
11. tenta o retorno real quando uma saída de retorno estiver disponível;
12. grava o relatório complementar e o publica no World Lab.

O modo individual da 9.13 permanece inalterado.

## Relatório de campanha

```json
{
  "schemaVersion": 1,
  "kind": "umbra.campaign-homologation.report",
  "campaignId": "campaign.umbra-trail.independent-routes",
  "runId": "campaign.umbra-trail.route-slice.default-run",
  "runSeed": "campaign.umbra-trail.route-slice.default-seed",
  "originStageId": "stage.aguas.igapo-das-memorias",
  "destinationStageId": "stage.aguas.coracao-corrompido",
  "manifestRevision": 2,
  "destinationManifestRevision": 1,
  "result": "PASS",
  "checks": [],
  "transitions": [],
  "stages": [],
  "persistence": {
    "campaign": { "before": {}, "after": {} },
    "narrative": { "origin": {}, "destination": {} },
    "resources": { "before": {}, "after": {}, "preserved": true },
    "preserved": true,
    "isolated": true,
    "confirmedDelta": 1
  },
  "evidence": { "browser": "Edge headless", "durationMs": 0 },
  "generatedAt": "2026-11-06T00:00:00.000Z",
  "runtime": { "phaser": "executed", "liveExecution": "executed" }
}
```

Cada transição registra origem, saída física, `stageExitId`, aresta, nó e
estágio de destino, disponibilidade, estágio carregado, motivo, estado
antes/depois e eventos.

Códigos:

| Código | Uso |
|---|---|
| `CAMPAIGN_STARTED` | campanha macro criada/restaurada |
| `CAMPAIGN_HUB_TRANSITION` | hub → Igapó pelo fluxo real |
| `CAMPAIGN_NPC_REACHED` / `CAMPAIGN_DIALOGUE_COMPLETED` | Vestígio e diálogo |
| `CAMPAIGN_MISSION_COMPLETED` / `CAMPAIGN_FLAG_PRESERVED` | missão e flag |
| `CAMPAIGN_EXIT_TRIGGERED` | saída física acionada |
| `CAMPAIGN_ROUTE_RESOLVED` | rota e destino resolvidos |
| `CAMPAIGN_DESTINATION_LOADED` | destino carregado no Phaser |
| `CAMPAIGN_SPAWN_VALID` / `CAMPAIGN_PLAYER_MOVED` | spawn e controle no destino |
| `CAMPAIGN_CAMERA_BOUNDS` | limites do novo mapa |
| `CAMPAIGN_STATE_PRESERVED` | histórico, recompensas e progresso |
| `CAMPAIGN_STATE_ISOLATED` | estado local não vazou |
| `CAMPAIGN_TRANSITION_UNIQUE` / `CAMPAIGN_TRANSITION_DUPLICATED` | duplicidade |
| `CAMPAIGN_RESOURCES_PRESERVED` | halos/magia persistentes |
| `CAMPAIGN_RETURN_EXECUTED` / `CAMPAIGN_RETURN_UNVERIFIED` | retorno |
| `CAMPAIGN_DESTINATION_INVALID` / `CAMPAIGN_TRANSITION_TIMEOUT` | falhas |

O resultado geral só é PASS quando todos os checks obrigatórios do percurso
forem comprovados. UNKNOWN obrigatório mantém a homologação inconclusiva;
UNKNOWN opcional (como retorno não disponível) não converte o PASS em FAIL.

## Persistência e isolamento

Comprovado no relatório real:

- `CampaignRunState` preserva `visitedNodeIds`, `confirmedTransitionIds`,
  recompensas e `macroProgress` após a transição.
- A transição é confirmada exatamente uma vez (`confirmedDelta === 1`).
- O save narrativo do Igapó permanece no armazenamento da campanha.
- O snapshot narrativo do Coração não contém flags, missões, NPC ou inimigos
  do Igapó.
- O jogador é reposicionado no spawn do destino, mantém halos (recompensa
  incluída) e recupera o controle.
- Inimigos, itens, colisões, câmera e `NavigationService` são reconstruídos para
  o novo mapa por `rebuildCurrentStage`.

Escolhas narrativas não são exercitadas no Igapó (o diálogo não tem escolhas);
o contrato de persistência de escolhas permanece o existente. O retorno
Coração → Igapó não apareceu disponível no contexto de camada corrompida e é
registrado como UNKNOWN opcional, não inventado.

## Variantes e campanhas procedurais

- **Igapó Natural:** homologue individualmente na 9.13 e na campanha real.
- **Igapó Corrompido:** variante `variant.aguas.igapo-sombrio` homologada
  individualmente na 9.13; a variante altera apresentação, não o destino de
  campanha. O roteamento continua usando o `stageExitId` do manifesto.
- **Coração Corrompido:** carregado com o estado de campanha e o spawn próprio.
- **Campanhas procedurais:** o teste existente
  `campaignIntegrationCycle.test.ts` percorre nove fases de uma campanha
  composta usando `CampaignRouter`, `CampaignExitBinder` e
  `PhysicalExitResolver`, com persistência, retomada e conclusão. Nenhum fluxo
  artificial foi criado.

## Automação do World Lab

O executor copia relatórios compatíveis para
`src/devtools/world-lab/reports/` e atualiza `index.json`:

```json
{
  "schemaVersion": 1,
  "kind": "umbra.world-lab.report-index",
  "generatedAt": "…",
  "reports": [
    { "file": "campaign-….json", "kind": "umbra.campaign-homologation.report", "result": "PASS" }
  ]
}
```

O World Lab usa `createLocalReportLoader()` para buscar o índice e os arquivos
listados. O diretório é de desenvolvimento, ignorado pelo Git e não expõe
caminhos arbitrários. O conteúdo é JSON interpretado como dados; nenhum
relatório executa código ou altera o estado do jogo.

Comportamento:

- relatórios de estágios/variantes compatíveis são importados na inicialização;
- relatórios de estágios ausentes do documento são contados como ignorados;
- o painel mostra origem local, data de execução, seed, variante, revisão do
  manifesto e a indicação de relatório ausente/desatualizado;
- o botão **Recarregar relatórios locais** busca novamente sem reiniciar o app;
- a importação manual continua disponível como alternativa;
- relatórios inválidos ou de estágio desconhecido são rejeitados com
  diagnóstico.

O painel de campanha mostra origem → destino, saída, rota, persistência,
isolamento, recursos, revisão e data. Os checks `CAMPAIGN_*` são associados à
origem ou ao destino; os checks de destino não deslocam o mapa da origem.

## Compatibilidade

- `umbra.stage-homologation.report` v1 não muda.
- `umbra.stage-playtest.report` v1 e `umbra-world-lab/v1` não mudam.
- Nenhum capítulo, mapa, tema, renderer, câmera, física, save ou catálogo é
  alterado.
- O fluxo clássico e o composto continuam usando os mesmos routers/binders.
- O World Lab mantém Estrutural, Visual e Comparação.

## Critérios observáveis e testes

1. `homologate --campaign` comprova hub → Igapó → Coração no Phaser.
2. O destino carrega, o spawn é válido e o jogador se move.
3. A câmera e os limites correspondem ao novo mapa.
4. Persistência, recompensas, recursos e isolamento são verificados.
5. A transição é única.
6. Variante Corrompida permanece compatível e o teste procedural de nove fases
   continua verde.
7. PASS/FAIL/UNKNOWN são distinguidos; o retorno indisponível é UNKNOWN.
8. O World Lab carrega relatórios locais automaticamente, mostra campanha e
   rejeita relatórios inválidos.
9. Testes existentes e novos passam; gates, build e diff passam.

## Validação final

- testes dirigidos de campanha, relatórios e World Lab;
- `npm run check:gates`;
- `npm run build`;
- `npm test -- --runInBand`;
- `git diff --check`;
- homologação real em Edge headless, com evidências em `.tmp/evidence-914/`.

## Limitações

- O retorno Coração → Igapó não apareceu disponível no contexto atual; fica
  UNKNOWN opcional.
- A transição de campanha foi homologada no fluxo macro clássico; o fluxo
  composto tem cobertura headless de nove fases, não uma execução Phaser
  completa.
- A variante Corrompida foi homologada individualmente; a campanha usa a
  apresentação padrão porque o roteamento existente não seleciona variante.
- O World Lab depende de Vite para servir o diretório local de relatórios.
- Relatórios anteriores à 9.14 não têm revisão/data e são identificados como
  tal.
