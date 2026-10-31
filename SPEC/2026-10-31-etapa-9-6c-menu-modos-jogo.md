# Etapa 9.6C — Menu de Campanhas e Modos de Jogo

## Contexto e decisão

A 9.6A expôs o catálogo imutável de definições registradas. A 9.6B adicionou o
compositor determinístico, o snapshot persistível e a integração headless com o
`CampaignGraphGenerator`, o `CampaignRouter`, o `PhysicalExitResolver` e o
`CampaignExitBinder`. Nenhum desses componentes chega ao jogador: o menu atual
inicia `GameScene` em modo legado/procedural e a campanha macro clássica é
iniciada por flags de cena.

Esta etapa conecta os sistemas existentes ao fluxo real:

```text
MenuScene -> GameModesScene -> GameSessionService
                                    |
                     +--------------+--------------+
                     v              v              v
              composição      fase individual   campanha clássica
                     |              |              |
                     v              v              v
              CampaignRouter   StageLoader    UmbraCampaignRouteSlice
                     \              |              /
                      \             v             /
                       +------ GameScene ------+
```

Não há novo registry, novo router, novo compositor ou novo motor de fases. O
compositor da 9.6B é reutilizado inclusive para a seleção manual.

## Camadas e responsabilidades

1. `GameModesScene` (Phaser) coleta intenção, seed, fase e ordem dos slots.
2. `GameSessionService` (headless, `src/application/stages/`) valida e prepara a
   sessão: catálogo, composição, persistência, loader, router.
3. `GameScene` inicia exatamente a sessão preparada. Nenhuma seleção procedural
   acontece dentro da cena.

O serviço segue as regras de `src/application/stages/`: importa `stages` e
`narrative` apenas pelo índice público, não importa Phaser, cenas, combate,
simulação, IA ou progressão.

## Modos de jogo

### Campanha Aleatória

- consulta apenas entradas `campaign-eligible` reais;
- usa `CampaignCompositionService` com `umbra.fixed-nine.v1`;
- aceita seed informada ou gerada;
- só inicia após composição válida;
- persiste o snapshot antes da execução;
- com nove ou mais candidatas viáveis, inicia a run.

Uma fase `narrative-reserved` entra no pool quando fornece o beat exigido por um
marco do request, mesmo sem `stageId` fixado. O `stageId` do marco continua
opcional e, quando presente, fixa a escolha. O menu exibe tanto o total
`campaign-eligible` quanto o pool de candidatas (elegíveis + marcos reservados).

### Campanha Personalizada

- o jogador atribui `stageId` a cada um dos nove slots canônicos;
- o request ganha `manualAssignments?: { slotId, stageId }[]`;
- a validação continua no mesmo `CampaignCompositionService` (o backtracking
  recebe cada slot restrito à escolha manual);
- exige exatamente nove slots preenchidos, sem repetição quando a política é
  `forbid`;
- valida elegibilidade, ato, dificuldade, papel/marco, beats, eventos,
  capacidade, destinos explícitos e topologia linear;
- seleção incompleta, duplicada ou incompatível retorna diagnóstico tipado e
  não inicia a run.

### Jogar Fase

- lista entradas `loadable` do catálogo (inclusive `campaign-eligible`);
- inicia via `StageLoader` e o ciclo de vida real de `GameScene`;
- usa `GameStageCompositionRoot` sem armazenamento de campanha;
- usa `ProgressionService` com `MemoryProgressionStorage`, isolando halos,
  itens, recompensas e conclusão da progressão persistente da campanha;
- não escreve save de run nem save narrativo de campanha;
- retorno ao menu por E/ESC e ao concluir a única fase da lista;
- fases `planned`, incompatíveis ou bloqueadas por dependência não são
  oferecidas; o motivo aparece no diagnóstico.

### Campanha Clássica

- permanece o caminho macro legado (`macroCampaign: true`);
- o menu apenas encaminha para `GameScene`, sem compor nem migrar;
- continua disponível quando o catálogo real não tem nove candidatas;
- nunca compartilha silenciosamente snapshot ou save com a campanha composta.

## Limitação do catálogo real

O catálogo de produção tem menos de nove definições elegíveis e não fornece os
três beats de marco exigidos pela política. O menu deve:

- exibir a contagem real de candidatas;
- exibir o diagnóstico da composição (candidatas insuficientes, marco ausente,
  etapa incompatível);
- desabilitar início aleatório e personalizado;
- manter clássico e individual disponíveis.

Nenhuma fase artificial é adicionada ao jogo. A fixture de 35 fases existe
somente nos testes.

## Contratos novos e ampliados

`CampaignCompositionRequest.manualAssignments` é aditivo e opcional.
`CampaignCompositionSlotSelection` declara `slotId` e `stageId` estáveis.
Diagnósticos novos: `composition.manual-selection.invalid`. Falha nova:
`manual-selection-invalid`.

`GameSessionService` expõe:

- `menuState()` — modos, disponibilidade, motivo, contagem elegível, opções
  individuais, estado do save composto;
- `previewRandomCampaign(seed)` / `previewCustomCampaign(selections, seed)` —
  validação sem persistir;
- `startRandomCampaign(seed)` / `startCustomCampaign(selections, seed)` —
  prepara, persiste e devolve router, navegação, grafo e snapshot;
- `startIndividualStage(stageId)` — devolve `LoadedStage` e o composition root
  isolado;
- `individualStages()` — opções carregáveis com título, capítulo, biomas e
  dificuldade.

## Inicialização e persistência

Chaves existentes são preservadas. Campanhas compostas usam uma chave própria
(`umbra-trail-composed-run-v1`) e o envelope v1 existente; a campanha clássica
continua em `umbra-trail-run-v1`.

Identidade da run composta:

- `campaignId = campaign.umbra-trail.composed`;
- `runId` derivado de forma estável da seed (`run.composed.<hash>`);
- `campaignRevision = 1`;
- snapshot com política, seed, atribuições, revisões e `declaredExits`.

Fluxo:

1. carregar o save composto;
2. se houver save com a mesma identidade, restaurar o snapshot via
   `CampaignCompositionService.restore` e reutilizar o grafo persistido — sem
   novo sorteio;
3. se a identidade divergir, compor uma nova campanha e só então substituir o
   save composto anterior, usando o estado anterior como expectativa;
4. inspecionar a navegação antes de gravar;
5. gravar o snapshot/estado antes da execução.

Save ilegível, revisão ausente, associação de saída divergente ou composição
persistida inválida produzem erro tipado e preservam os bytes anteriores.

## GameScene

`GameSceneInitData` ganha `individualRuntime?: { stageId, loadedStage,
composition }`. Nesse modo:

- `currentLevel` é o nível carregado da definição;
- não há `campaignRouter` nem `campaignNavigation`;
- a narrativa é criada sem armazenamento persistente;
- a progressão usa `MemoryProgressionStorage`;
- saídas físicas sintéticas do mapa continuam funcionando;
- conclusão ou E/ESC retornam ao menu.

Campanhas compostas reaproveitam `campaignRuntime` existente. O modo clássico e
o modo piloto não mudam.

## World Lab

Nada é reconstruído. A inspeção de composição da 9.6B permanece. A seleção do
menu não é enviada ao World Lab nesta etapa.

## Critérios observáveis

1. O menu abre e apresenta os quatro modos.
2. O catálogo real insuficiente desabilita aleatório/personalizado com motivo e
   contagem reais.
3. Campanha Clássica permanece iniciável e não usa snapshot composto.
4. Uma fixture com 35 candidatas permite composição 35→9, seed determinística e
   variação entre seeds.
5. A mesma seed restaura o snapshot persistido sem recompor, mesmo com catálogo
   reordenado ou acrescido.
6. Revisão ausente falha e preserva o save anterior.
7. Fase individual carrega, executa e retorna ao menu sem gravar save de
   campanha ou progressão persistente.
8. Fase individual incompatível é recusada com diagnóstico.
9. Seleção manual válida produz exatamente as nove atribuições escolhidas.
10. Seleção manual incompleta, duplicada, com ato/marco errado ou destino
    incompatível falha tipadamente.
11. Save legado da campanha clássica continua reconhecido.
12. `GameScene` recebe a sessão pronta; nenhuma composição ocorre na cena.
13. Serviço e contratos não importam Phaser, cenas, DOM ou storage concreto.

## Testes

- menu headless (`GameSessionService.menuState`);
- compositor com seleção manual (request novo);
- sessão composta com fixture, persistência e restauração;
- falha de revisão sem sobrescrita;
- fase individual e isolamento de progressão/save;
- catálogo real insuficiente;
- regressão do compositor, catálogo, router, saves, World Lab e cena legada.

A cena Phaser é um renderizador fino do estado headless. A homologação visual no
navegador depende de ambiente disponível e deve ser registrada como executada ou
pendente, nunca presumida.

## Estado real da integração

- Operacional e testado headless: catálogo real, disponibilidade dos modos,
  composição 35→9 com fixture, snapshot persistido, restauração sem recomposição,
  falha de revisão preservando o save, fase individual carregada pelo
  `StageLoader` sem gravar save, campanha clássica encaminhada pelo caminho
  macro existente e injeção da sessão composta em `GameScene`.
- Não exercitado nesta execução: clique real no canvas e homologação visual no
  navegador, pois o ambiente não oferece navegador. As cenas são renderizadores
  finos; a lógica é coberta pelo serviço headless e por testes de fiação.
- Indisponível por conteúdo: campanha aleatória e personalizada no catálogo real
  (menos de nove candidatas e sem os três beats de marco). O menu mostra a
  contagem e o motivo; não cria conteúdo fictício.
- A seleção do menu não é enviada ao World Lab nesta etapa.

## Limitações

- `umbra.fixed-nine.v1` continua linear e exige exatamente nove definições; não
  há quantidade arbitrária.
- Sem conteúdo real suficiente, aleatório/personalizado permanecem desabilitados.
- A seleção manual não cria topologias alternativas; usa os nove slots fixos.
- Não há editor de campanhas, conteúdo remoto ou seleção manual no World Lab.
- Não há recomposição automática de snapshot incompatível.

## Dependências da 9.6D

- catálogo real com ao menos nove definições elegíveis e beats de marco;
- política/topologia ampliável ou editor de campanhas;
- migração explícita de snapshots incompatíveis;
- eventual seleção manual compartilhada com o World Lab.
