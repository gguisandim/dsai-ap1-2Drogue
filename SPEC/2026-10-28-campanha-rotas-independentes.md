# Campanha por rotas independentes — Etapa 9.1

Data: 2026-10-28

## Relação com as SPECs anteriores

Esta SPEC substitui somente a interpretação do `CampaignGraph` de nove
profundidades como estrutura completa da campanha. A SPEC
`2026-10-28-campanha-procedural-ramificada.md` continua válida para grafos
procedurais internos a uma rota, seus nodes, saídas físicas, router, saves e
recompensas idempotentes.

O nível macro pode conter ciclos legítimos entre hub e rotas. Ele não é
submetido ao `CampaignGraphValidator`, não altera o gerador existente e não
codifica hub ou retornos como nodes artificiais do DAG.

## Objetivo observável

O estado inicial aponta para `Floresta das Raízes`. Três rotas independentes
podem ser iniciadas e concluídas em qualquer ordem. Cada rota exige suas regiões
em ordem e um marco narrativo próprio. As três conclusões desbloqueiam a camada
corrompida; o marco obrigatório dessa camada desbloqueia `Palácio do Credor`.

O esqueleto é headless, serializável, determinístico e inspecionável pelo World
Lab. Nenhum placeholder é apresentado como fase carregável ou saída física.

## Contratos macro

`CampaignMacroDefinition` é conteúdo declarativo imutável e separado do estado:

- `CampaignHubDefinition`: hub inicial e seus hooks narrativos futuros;
- `CampaignRouteDefinition`: identidade, regiões ordenadas e marco de conclusão;
- `CampaignRegionDefinition`: camada, dificuldade, retorno ao hub e referência
  de conteúdo;
- `CampaignMilestoneDefinition`: escopo, operação externa estável e hooks;
- `CampaignUnlockCondition`: `always`, todas as rotas concluídas ou marco
  concluído;
- `CampaignCorruptedLayerDefinition` e `CampaignFinalDefinition`;
- `CampaignContentReference`: união discriminada entre `stage` carregável e
  `planned` explicitamente não carregável.

Hooks aceitam apenas IDs de NPC, missão, diálogo, evento e beat. Não aceitam
callbacks. IDs de exibição, coordenadas e índices não são identidades.

## Esqueleto Umbra Trail

```text
camada 0  Floresta das Raízes
          ├─ Rota das Águas: Igapó → Mangues → Porto → marco das águas
          ├─ Rota da Floresta: Fungos → Copas → Flores → marco da floresta
          └─ Rota da Terra: Areias → Ruínas → Cicatriz → marco da terra

camada 2  Minas → Cinzas → Temporal → Complexo Industrial
          → marco corrompido obrigatório

camada 3  Palácio do Credor
```

Todos esses locais usam `CampaignContentReference.kind = planned` na Etapa
9.1. Portanto são visíveis na inspeção, mas `exposePhysicalExit` permanece
falso. A Etapa 9.2 deverá trocar uma referência por `stage` somente depois que o
`StageRegistry` e o `StageLoader` confirmarem o ID.

## Estado e progressão

`CampaignMacroProgressState` é aditivo em `CampaignRunState.macroProgress`:

- identidade e revisão da definição;
- local atual (`hub`, `route`, `corrupted` ou `final`);
- estado por rota (`not-started`, `in-progress`, `completed`);
- regiões concluídas por rota;
- marcos concluídos;
- status persistidos da camada corrompida e do final;
- IDs de operação processados para idempotência.

O `CampaignRunState` continua autoridade do grafo ativo, node, histórico,
placements, checkpoints e journal de recompensas. O estado macro não copia
`NarrativeState`, grafo, seed, flags, missões ou recompensas.

`CampaignMacroProgression` recebe comandos discriminados. Região concluída não
conclui automaticamente uma rota; o marco correspondente é obrigatório. Um
`operationId` repetido devolve sucesso `duplicate` sem mutação, persistência ou
nova operação externa. A conclusão de marco emite uma única vez o
`completionOperationId` declarativo; o consumidor futuro ainda deve deduplicar
esse ID.

Ao receber `CampaignRunSaveService`, a progressão grava o candidato com
preflight otimista e só troca sua referência em memória após sucesso. Falha
preserva o estado anterior. Saves v1 sem `macroProgress` continuam produzindo
os mesmos bytes e são atualizados aditivamente somente quando uma sessão macro
é criada de forma explícita.

## Navegação e integração futura

`inspect()` calcula autorizações macro e produz escolhas estáveis com
`connectionId`, origem, destino, bloqueio, conteúdo e
`requiresPhysicalExit = true`. Essa inspeção não move o player e não escolhe
tiles.

Na Etapa 9.2, uma escolha somente poderá ser exposta quando:

1. estiver desbloqueada pela progressão macro;
2. sua referência for `stage`, nunca `planned`;
3. o `StageLoader` preparar o destino;
4. `PhysicalExitResolver` e `CampaignExitBinder` produzirem o binding;
5. o `CampaignRouter` confirmar a transição do grafo interno da rota.

Retorno ao hub troca o contexto macro somente em pontos declarados. O grafo
interno e seus checkpoints permanecem no save para continuação. Como o save
atual possui um único grafo ativo, alternância durável entre múltiplos grafos de
rota exige um catálogo de snapshots por rota; isso é dependência explícita da
Etapa 9.2 e não será simulada por cópias no estado macro.

## Critérios e testes

- definição tem IDs estáveis, referências válidas, três rotas e nenhuma
  região sem caminho de retorno declarado;
- todas as seis ordens de conclusão das rotas produzem o mesmo desbloqueio;
- faltar uma rota mantém camada corrompida bloqueada;
- final permanece bloqueado até o marco corrompido;
- retorno ao hub preserva regiões concluídas e permite continuar a próxima;
- save/load preserva progresso macro e os campos existentes da run;
- save antigo sem macro continua válido e byte-estável;
- operação repetida não emite recompensa/operação externa novamente;
- placeholders nunca expõem saída física;
- piloto e flags atuais continuam inalterados.

## Fora do escopo da Etapa 9.1

- mudanças em `GameScene`, Phaser, combate, IA, movimentação ou progressão;
- mapas, assets, NPCs, diálogos completos ou missões secundárias;
- registrar os placeholders no `StageRegistry`;
- trocar grafos ativos, posicionar portais ou tornar o esqueleto jogável;
- garantir exatamente-uma-vez em sistemas externos sem deduplicação.

## Adendo — Etapa 9.2A: binding macro e World Lab

A primeira vertical slice torna carregáveis somente `hub.floresta-das-raizes`
e `region.aguas.igapo`. Ambos apontam explicitamente para mapas legados como
placeholders temporários; `StageRegistry` e `StageLoader` continuam sendo a
autoridade sobre a existência e a revisão desses stages. Mangues, Porto, as
outras rotas, a camada corrompida e o final permanecem `planned`, bloqueados e
sem saída física exposta.

`CampaignMacroRouteBinder` é um coordenador da application layer, não um novo
router. Ele cruza uma `CampaignMacroChoice.connectionId` com uma aresta
declarada, obtém o `physicalExitId` produzido pelo `CampaignRouter` e delega a
este o ciclo `inspect`/`prepare`/`confirm`. A progressão macro é aplicada de
forma volátil e o candidato combinado é gravado uma única vez pelo
`CampaignRunSaveService`. Falha de stage, resolução, binding, macro ou save
mantém a referência anterior em memória e os bytes anteriores quando o storage
confirma `previous-preserved`; estado de storage desconhecido é reportado sem
prometer atomicidade externa.

O save v1 recebe dois campos aditivos e opcionais:

- `activeGraphContextId`, identidade estável do contexto atualmente materializado
  nos campos legados de `CampaignRunState`;
- `parkedGraphContexts`, snapshots completos dos contextos inativos, sem copiar
  `macroProgress`.

Assim, o router continua vendo exatamente um grafo ativo e saves antigos sem o
catálogo continuam válidos. Ao sair do hub, seu snapshot é estacionado; ao
retornar, o contexto de rota é estacionado e o hub é restaurado. Journals de
transição e recompensas são mesclados por ID ao trocar contexto para não perder
operações já confirmadas. O estado macro permanece fonte única para rota atual,
marcos e desbloqueios.

A definição `UMBRA_CAMPAIGN_ROUTE_SLICE` usa:

- Floresta das Raízes → `verse_01_atrium` (`legacy-placeholder`);
- Igapó → `verse_02_galeria` (`legacy-placeholder`).

Um grafo de slice determinístico, gerado pelo `CampaignGraphGenerator`, mantém
o contrato existente de nove profundidades. A aresta hub → Igapó e uma aresta
`return` Igapó → hub são associadas aos `connectionId` macro. As demais posições
do grafo usam stages legados carregáveis somente para satisfazer o protótipo
headless; não passam a representar regiões planejadas da campanha.

O World Lab consome o mesmo snapshot público de binding e o mesmo grafo
resolvido pelo runtime headless. A projeção adicional lista conexões macro com
status `bound`, `blocked` ou `unavailable`, incluindo as escolhas planejadas.
Ela não replica seleção de rota, posicionamento de saída nem algoritmo de
navegação, e não exige alteração da interface SVG/DOM nesta etapa.

### Critérios observáveis da Etapa 9.2A

- hub → Igapó → hub → retomada de Igapó preserva run, seed, node, histórico,
  checkpoints e journal de recompensas;
- save/load restaura o contexto ativo e os contextos estacionados;
- tentativa de escolher Floresta, Terra, camada corrompida ou final não prepara
  stage nem altera o save;
- uma falha de prepare, confirm ou persistência mantém o estado anterior;
- identidade e resultado são determinísticos para a mesma run/seed;
- saves sem campos de contexto continuam válidos e não são reescritos ao ler;
- o World Lab mostra Floresta ↔ Igapó como conexões reais e todas as escolhas
  `planned` como bloqueadas;
- `GameScene`, combate, movimentação, IA e geração procedural permanecem
  inalterados.

### Limites da Etapa 9.2A

A slice é headless e inspecionável; não cria objetos Phaser nem portais visuais.
Os mapas legados conservam sua jogabilidade, mas ainda não são os biomas finais.
Somente a Rota das Águas possui um contexto navegável e apenas Igapó é ligado;
as outras rotas exigem stages válidos e integração visual em etapa posterior.
Como `CampaignEdge.traversalLimit` atualmente aceita no máximo `2`, o piloto
valida a entrada inicial e uma retomada. Revisitas ilimitadas exigem uma decisão
de contrato futura, sem apagar o histórico para contornar o limite.

## Adendo — Etapa 9.2A.1: visualização macro no World Lab

O World Lab recebe um modo `Campanha` dentro do aplicativo existente. O modo
`Procedural` permanece padrão e conserva geração, snapshot, filtros, seleção de
grafo e inspeção de tiles. A alternância é somente de apresentação e não inclui
o World Lab no bundle principal do jogo.

`WorldLabMacroDataService.generate(seed)` continua sendo a fonte do modo macro.
Um projector de apresentação dentro de `src/devtools/world-lab/` combina, sem
mutação:

- a definição pública `UMBRA_CAMPAIGN_ROUTE_SLICE`;
- `CampaignMacroInspection` e o progresso serializável exposto pela sessão;
- os bindings físicos reais da Etapa 9.2A;
- o `WorldLabDocument` dos stages carregáveis.

O modelo visual declara nodes para hub, regiões, marcos, camada corrompida e
final. Cada node separa três dimensões que não podem ser confundidas:

- progresso: `current`, `completed`, `available` ou `blocked`;
- conteúdo: `loadable`, `planned` ou `none` para marcos;
- navegação atual: binding `bound`, `blocked` ou `unavailable`, quando existir.

Estados disponíveis são derivados das escolhas e do progresso retornados pelos
contratos públicos. Requisitos exibidos são projeções declarativas dos IDs de
região, marco e unlock condition da definição; a UI não reavalia comandos nem
implementa regras de desbloqueio. Conteúdo `planned` exibe literalmente
`Mapa ainda não implementado` e jamais recebe tiles sintéticos.

O SVG macro reutiliza `installSvgPanZoom`, seleção acessível por teclado e a
identidade visual escura existente. Selecionar Floresta das Raízes ou Igapó
associa o node macro ao stage realmente projetado e abre seu mapa no inspector.
Selecionar conteúdo planejado mantém o mapa vazio e mostra o diagnóstico de
conteúdo. O painel lateral apresenta identidade, rota, camada, progresso,
requisitos, entradas, saídas, stage/template disponível e o resumo real das
rotas, camada corrompida, final e escolhas atuais.

O modo é explicitamente marcado como `Fixture de inspeção`; não lê nem simula
um save do jogador e não chama `prepare`, `confirm` ou comandos da progressão.
Gerar outra seed recria a projeção headless e não altera o estado da campanha.

### Critérios observáveis da Etapa 9.2A.1

- `world-lab.html` alterna entre `Procedural` e `Campanha` sem perder as
  funcionalidades anteriores;
- o SVG macro contém hub, três rotas ordenadas, quatro regiões corrompidas,
  quatro marcos e final, incluindo retornos declarados ao hub;
- nodes distinguem progresso, conteúdo planejado e conteúdo carregável;
- seleção atualiza inspector, conexões e requisitos usando IDs estáveis;
- hub e Igapó abrem somente seus mapas legados reais; demais regiões mostram
  `Mapa ainda não implementado`;
- mudança de seed regenera a projeção determinística;
- testes verificam que gerar e selecionar não mutam o estado headless;
- inspeção em navegador real registra evidência visual quando o ambiente
  disponibiliza browser, sem substituir os testes automatizados.

## Evidência de implementação

`campaignMacroProgression.test.ts` adiciona 18 cenários: definição e IDs,
inspeção determinística para World Lab, placeholders não expostos, seis
ordens de conclusão, bloqueios, retorno e continuação, ordem de regiões, marco
corrompido, final, deduplicação, round-trip, compatibilidade de save, rollback e
corrupção externa.

Resultados em 2026-10-28: 779 testes em 47 suítes, typecheck, build com 705
módulos, architecture gate com 1.701 arquivos/3.700 dependências,
traceability gate com 15 registros v1 e oito legados e `git diff --check`
aprovados.

Na Etapa 9.2A, `campaignMacroRouteBinding.test.ts` adiciona sete cenários para
placeholders explícitos, grafo/bindings determinísticos, ciclo físico completo
com retomada, isolamento de rotas planejadas, rollback de storage,
compatibilidade de save sem catálogo e projeção do World Lab. Resultados em
2026-10-28: 786 testes em 48 suítes, typecheck, build com 707 módulos,
architecture gate com 1.705 arquivos/3.725 dependências, traceability gate com
16 registros v1 e oito legados e `git diff --check` aprovados.

Na Etapa 9.2A.1, `worldLabMacroUi.test.ts` adiciona seis cenários de interface:
preservação do modo procedural, estrutura macro completa, estados derivados,
abertura do mapa real de Igapó, ausência de mapa fictício, mudança de seed e
imutabilidade da projeção. Resultados em 2026-10-29: 792 testes em 49 suítes,
typecheck, build de produção ainda com 707 módulos, architecture gate com 1.708
arquivos/3.735 dependências, traceability gate com 17 registros v1 e oito
legados e `git diff --check` aprovados. A tentativa de homologação visual no
Opera foi interrompida pelo helper de Computer Use por não conseguir determinar
a URL atual com confiança; portanto não há alegação de homologação visual em
navegador real nesta entrega.

## Etapa 9.2B — integração da vertical slice com Phaser

### Escopo e ativação

A integração jogável continua limitada a Floresta das Raízes e Igapó. A flag
`macroCampaign`, desligada por padrão, ativa o modo pela inicialização da cena
ou por `?macroCampaign=1`. `macroRun` e `macroSeed` permitem identidade explícita
sem mudar os defaults estáveis da slice. A precedência é:

1. `macroCampaign`;
2. `branchingCampaign` existente;
3. carregamento modular de fase;
4. fluxo legado.

Uma seed procedural desativa as duas campanhas no runtime desta cena. Com a
flag macro ausente, nenhum binder macro é criado e nenhum save macro é escrito.
Save incompatível ou de outra identidade é preservado e produz rollback para o
mapa legado, sem migração automática.

### Adapter e propriedade de estado

`GameMacroCampaignAdapter` é o limite application/Phaser. Ele não implementa
roteamento nem persistência: recebe o `CampaignMacroRouteBinder`, projeta apenas
as escolhas que possuem binding físico real e traduz a seleção por
`physicalExitId` para o `connectionId` correspondente. `prepare` e `confirm`
continuam executados pelo binder, que reutiliza `CampaignRouter`, `StageLoader`,
`PhysicalExitResolver`, `CampaignExitBinder` e `CampaignRunSaveService`.

O adapter implementa o mesmo port mínimo consumido pela cena para que o fluxo
de portal, reconstrução e journal seja compartilhado com o piloto ramificado.
`CampaignRunState`, incluindo `macroProgress`, `activeGraphContextId`,
`parkedGraphContexts`, cursor, histórico, resumes, seeds e recompensas, permanece
a única autoridade durável. A cena guarda apenas a projeção necessária para
renderizar o mapa atual e as saídas.

`CampaignMacroRouteBinder` passa a expor o journal de recompensas pelo router
existente. Claim e acknowledge persistem o estado completo antes de atualizar a
referência do binder. A progressão externa continua deduplicando pelo
`transitionId`; não existe nem é declarada transação entre
`umbra-trail-run-v1` e `vigrid-progression-v1`.

### Comportamento da slice

- Floresta das Raízes usa `verse_01_atrium`, inicia sem ondas e revela
  imediatamente apenas a saída vinculada para Igapó.
- Igapó usa `verse_02_galeria` com combate, ondas, habilidades e regra de
  liberação já existentes; depois da limpeza, sua saída vinculada retorna ao
  hub.
- A interação continua por proximidade e `E`; `isTransitioning` é adquirido
  antes da confirmação para rejeitar inputs simultâneos.
- Retornar ao hub estaciona o contexto das Águas. A segunda entrada restaura
  esse contexto. Os limites existentes de duas travessias em cada conexão não
  são ampliados.
- Conteúdo `planned` não entra na projeção Phaser, não cria sprite e nunca é
  enviado ao loader.
- O HUD mínimo acrescenta região e rota ao objetivo existente. Falhas de
  preparação, confirmação, persistência ou rebuild conservam/recuperam o estado
  conforme o resultado tipado, sem avanço silencioso.

### Critérios observáveis e testes

- flag OFF mantém exatamente o fluxo legado e a flag ramificada existente;
- flags macro e ramificada simultâneas ativam somente a macro;
- o hub publica uma saída física e não inicia combate;
- `E` confirma hub → Igapó, Igapó → hub e uma retomada de Igapó;
- reload preserva identidade, contexto estacionado, histórico e journal;
- saída bloqueada, input repetido, erro de prepare/confirm e falha de storage
  não duplicam transição nem recompensa;
- planejados continuam não carregáveis;
- morte/restart preserva flag, run e seed macro;
- World Lab permanece consumidor separado dos mesmos contratos públicos.

A homologação em navegador deve usar somente inputs reais. Se o ambiente não
permitir completar combate e travessias, os cenários não observados serão
relatados como pendentes, sem converter testes headless em evidência E2E.

### Evidência da Etapa 9.2B

Foram adicionados 13 testes, em duas suítes, para a projeção Phaser e a cena:
saída física única, planned ausente, prepare concorrente, confirmação repetida,
hub → Igapó → hub → retomada, reload, contextos estacionados, limite de
travessia, rollback de persistência, journal aplicado/deduplicado, hub sem
combate, portal bloqueado, precedência de flags, fluxo legado e restart por
morte. As 19 caracterizações preexistentes do binder e do piloto ramificado
também passaram na execução direcionada.

Validação final em 2026-10-29: **814 testes em 52 suítes**, typecheck, build com
709 módulos, architecture gate com 787 arquivos/2.820 dependências,
traceability gate com 20 registros v1, oito legados e um commit pendente. O
`git diff --check` passou; os avisos de futura conversão LF/CRLF não representam
erro nem normalização incluída nesta mudança.

Homologação real no Opera, servido por Vite:

- a URL `/?macroCampaign=1&macroRun=manual.macro-92b&macroSeed=manual-92b`
  abriu o menu e iniciou o jogo pelo botão `JOGAR`;
- o hub exibiu `REGIÃO: Floresta das Raízes`, objetivo de aproximação, nenhum
  inimigo/onda e exatamente um portal físico visível;
- o World Lab abriu separadamente e alternou visualmente entre `Procedural` e
  `Campanha`, mostrando o hub, as três rotas e conteúdo planejado.

A homologação é **parcial**. O helper disponível envia somente taps instantâneos
de teclado; mesmo com o canvas focado, `D` e seta direita não sustentaram
movimento. Por isso não foram comprovados em navegador nesta execução: alcance
do portal, `E`, entrada no Igapó, combate, retorno, retomada, reload posterior à
transição, bytes de save, recompensa e console. Nenhum desses estados foi
forçado por `localStorage`, posição ou chamada interna.

