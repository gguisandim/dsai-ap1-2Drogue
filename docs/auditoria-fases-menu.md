# Auditoria técnica de fases e menu

**Data da auditoria:** 2026-11-16  
**Branch de trabalho:** `docs/auditoria-fases-menu`  
**Base:** `origin/main` em `c154436b4afb8a1b5ea502df42fbed79fdc4e233`  
**Escopo:** inventário e planejamento. Nenhuma lógica, cena ou asset foi
alterado.

## Resumo executivo

- O registry de produção contém **17 fases carregáveis**: **13 legadas** e
  **4 módulos autorais**. As legadas são mantidas por adapters; `level_08_paradiso`
  preserva o ID antigo e foi promovida como fase autoral dos Jardins das Flores
  Veladas.
- Há três capítulos registrados: `chapter.raiz-do-mundo` (1 fase),
  `chapter.aguas` (2) e `chapter.floresta.flores-veladas` (1).
- Consulta executada em `GameSessionService.menuState()`: **1 elegível**,
  **4 candidatas+reservadas**, **9 definições exigidas**. Campanha aleatória e
  personalizada ficam indisponíveis; campanha clássica e fase individual
  permanecem disponíveis. As 17 entradas individuais estão carregáveis.
- As quatro fases autorais carregaram e obtiveram **PASS no playtest estático**.
  Camera follow, execução Phaser ao vivo e/ou transições continuaram `UNKNOWN`;
  isso não comprova jogabilidade integral.
- Problemas mais concretos para o planejamento: o caminho antigo ignora delays
  de ondas e inimigos-base quando existem waves; quatro posicionamentos legados
  têm diagnósticos conhecidos; `Ithavoll Tower` não declara inimigos nem waves;
  os modos compostos ainda não têm conteúdo elegível suficiente.

## Base Git e fontes

No início da auditoria, o worktree estava limpo na `main`. Após `fetch`, a
branch local e `origin/main` estavam em `c154436`; `upstream/main` estava em
`491620e`, portanto os dois remotos não apontavam para o mesmo commit. A branch
de auditoria foi criada a partir de `origin/main` atualizado, sem descartar
alterações.

Foram inspecionados os 20 commits do intervalo `c154436` a `9cddbbc`. A sequência
recente inclui a conversão/redesign e variantes dos Jardins, melhorias visuais
do Igapó e da Floresta das Raízes, integração e homologação de campanha, e
ferramentas de plano/playtest/preview. Isso indica que o conteúdo autoral e as
ferramentas mudaram recentemente; a compatibilidade das fases mais antigas
continua sendo responsabilidade explícita.

Fontes consultadas: [AGENTS.md](../AGENTS.md),
[README.md](../README.md), [guia de autoria](./stage-authoring.md),
[arquitetura de campanha modular](../SPEC/2026-10-27-arquitetura-campanha-modular.md),
[catálogo dinâmico 9.6A](../SPEC/2026-10-31-etapa-9-6a-catalogo-dinamico-fases.md),
[composição 9.6B](../SPEC/2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md),
[menu 9.6C](../SPEC/2026-10-31-etapa-9-6c-menu-modos-jogo.md),
[fase Floresta das Raízes](../SPEC/2026-11-05-fase-1-floresta-das-raizes.md),
[Igapó panorâmico](../SPEC/2026-11-01-etapa-9-8-fases-panoramicas-igapo.md) e
[refinamento dos Jardins](../SPEC/2026-11-12-refinamento-agressivo-jardins-flores-veladas.md).

## Inventário de fases

### Fases legadas

Todas as fases desta tabela são `loadable` e `individual-only` no catálogo
dinâmico. Não declaram NPCs, missões narrativas ou objetivos em `StageModule`;
o objetivo legado é implícito (sobreviver às ondas e alcançar a saída, quando
há waves). A transição individual termina no retorno ao menu. O adapter
`legacy.levels` encadeia as definições não migradas por `legacy.next`, enquanto
o macro de campanha tem topologia própria.

| Nome e ID | Arquivos; mapa/geração | Catálogo, conteúdo e transição | Problemas e testes |
|---|---|---|---|
| The Vestibule — `level_01_vestibule` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25 escrito como matriz. | `legacy.levels`; dificuldade 1; 4 inimigos-base (`affinity`, `dear_and_decorations`), 2 waves, 2 itens; sem NPC/missão; próxima definição legada: Nave. | Sem diagnóstico específico conhecido. Caracterização e carga legada em [stageCharacterization.test.ts](../src/tests/stageCharacterization.test.ts) e [stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts). |
| The Nave — `level_02_nave` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 2; 6 inimigos-base (`affinity`, `dear_and_decorations`, `applaud`), 3 waves, 3 itens; sem NPC/missão; segue para Vigrid Streets. | Aviso conhecido `level.position.on-solid`. Coberto por [stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts). |
| Vigrid Streets — `level_03_vigrid_streets` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 3; 7 inimigos-base (`affinity`, `dear_and_decorations`, `applaud`, `enchant`, `grace_and_glory`), 3 waves, 4 itens; sem NPC/missão; segue para Colosseum. | Sem diagnóstico específico conhecido; cobertura pelo teste de caracterização e loader legado. |
| The Colosseum Ruins — `level_04_colosseum` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 4; 11 inimigos-base (`affinity`, `dear_and_decorations`, `applaud`, `grace_and_glory`, `enchant`), 3 waves, 3 itens; sem NPC/missão; segue para Clocktower. | Sem diagnóstico específico conhecido; cobertura pelo teste de caracterização e loader legado. |
| The Clocktower — `level_05_clocktower` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 5; 10 inimigos-base (`affinity`, `dear_and_decorations`, `enchant`, `grace_and_glory`, `fearless`, `applaud`), 3 waves, 3 itens; sem NPC/missão; segue para Inferno. | Aviso conhecido `level.position.on-solid`; teste de loader legado preserva os dados originais. |
| The Inferno Descent — `level_06_inferno` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 6; 11 inimigos-base (`affinity`, `dear_and_decorations`, `enchant`, `grace_and_glory`, `fearless`, `fairness`, `harmony`), 3 waves, 3 itens; sem NPC/missão; segue para Witches' Crypt. | Dois avisos conhecidos `level.position.on-hazard`; cobertos por [stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts). |
| The Witches' Crypt — `level_07_witches_crypt` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 7; 10 inimigos-base (`affinity`, `enchant`, `grace_and_glory`, `fearless`, `fairness`, `harmony`, `joy`), 3 waves, 3 itens; sem NPC/missão; a cadeia de adapters segue para `level_09_limbo` porque o ID 08 foi migrado. | A cadeia do adapter e `getNextLevel()` legado não são a mesma sequência após a migração de `level_08_paradiso`; preservar essa distinção. |
| Limbo Crossing — `level_09_limbo` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 9; 10 inimigos-base (`joy`, `grace_and_glory`, `fearless`, `harmony`, `fairness`), 3 waves, 3 itens; sem NPC/missão; segue para Ithavoll Tower. | Aviso conhecido `level.position.on-hazard`; coberto pelo teste de loader legado. |
| Ithavoll Tower — `level_10_ithavoll` | [LevelData.ts](../src/data/LevelData.ts); mapa fixo 40×25. | `legacy.levels`; dificuldade 10; **0 inimigos, 0 waves e 5 itens**; sem NPC/missão; termina a cadeia legada. | Não há encontro ou objetivo declarado para justificar a dificuldade/itens; não presumir que seja um clímax jogável. Cobertura de sequência e carga, não homologação de gameplay. |
| Átrio dos Ecos — `verse_01_atrium` | [VerseLevelData.ts](../src/data/VerseLevelData.ts); mapa 40×25 montado deterministicamente por `baseMap()` e `carve()`. | `legacy.verse`; dificuldade 2; 6 inimigos-base (`affinity`, `applaud`), sem waves/ambush, 2 itens; sem NPC/missão; porta leste para Galeria Sombria e próximo módulo via `legacy.next`. | A travessia entre seções e o fluxo narrativo permanecem legados. Ver [stageLegacyCompatibility.test.ts](../src/tests/stageLegacyCompatibility.test.ts), [stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts) e caracterização. |
| Galeria Sombria — `verse_02_galeria` | [VerseLevelData.ts](../src/data/VerseLevelData.ts); mapa 40×25 determinístico com corredores escavados. | `legacy.verse`; dificuldade 3; 6 inimigos-base e 5 de emboscada (`affinity`, `applaud`), sem waves, 2 itens; sem NPC/missão; portas para Átrio e Santuário. | Ambush é formato legado, separado do encounter declarativo; validar a integração Phaser ao modernizar. Testes de compatibilidade e transição legada. |
| Santuário Proibido — `verse_03_santuario` | [VerseLevelData.ts](../src/data/VerseLevelData.ts); mapa 40×25 determinístico com corredores escavados. | `legacy.verse`; dificuldade 4; 5 inimigos-base e 5 de emboscada (`affinity`, `applaud`), sem waves, 2 itens; sem NPC/missão; porta de retorno à Galeria e fim da cadeia `legacy.next`. | Não é o novo capítulo `chapter.raiz-do-mundo`; são identidades e conteúdos distintos. Testes de loader e caracterização. |
| A Passagem Esquecida — `level_01_forgotten_passage` | [CorridorLevelData.ts](../src/data/CorridorLevelData.ts); mapa fixo 40×25 criado por `createMap()`. | `legacy.corridor`; dificuldade 2; 17 inimigos-base (`affinity`, `applaud`), sem waves/ambush, 3 itens; sem NPC/missão; saída terminal `campaign.complete`. | Catálogo independente do percurso `legacy.levels`; teste de adaptação e carga em [stageLegacyCompatibility.test.ts](../src/tests/stageLegacyCompatibility.test.ts) e [stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts). |

O grupo `legacy.levels` é derivado de `ALL_LEVELS` excluindo
`MIGRATED_LEGACY_STAGE_IDS`. Portanto, o ID antigo dos Jardins ainda existe na
fonte `LevelData`, mas não é registrado duas vezes como fase legada.

#### Geração procedural legada (fora das 17 entradas do catálogo)

`GameScene` ainda caracteriza uma sequência de nove fases geradas com IDs
`procedural-floor-1`…`procedural-floor-9`, seed e presets
`cathedral-intro`, `crypt-crawl`, `ruined-city`, `inferno-caverns`,
`clockwork-maze`, `garden-labyrinth`, `celestial-bridges`,
`colosseum-gauntlet` e `void-fracture`. Isso é distinto do modo “Campanha
Aleatória” do menu atual: esse modo compõe definições registradas, não gera
nove mapas novos. Os floors procedurais não aparecem na consulta atual de
`individualStages`.

### Fases autorais registradas

Os mapas são `authored` no contrato. As funções `create*Map()` montam matrizes
determinísticas; não são layouts procedurais por seed.

| Nome e ID | Arquivos; mapa/geração | Catálogo, objetivos, inimigos/NPCs e transições | Problemas e testes |
|---|---|---|---|
| Floresta das Raízes — `stage.raiz-do-mundo.santuario` | [worldRootSanctuary.ts](../src/stages/chapters/raiz-do-mundo/worldRootSanctuary.ts), `index.ts` e plano; 116×36; `createWorldRootMap()` e decorações determinísticas. | `chapter.raiz-do-mundo`, revisão 2, `narrative-reserved`; missão “Ouvir as raízes”: falar com Guardião da Seiva e completar encontro de duas waves (1 `affinity`, depois 1 `affinity` + 1 `applaud`); uma saída física com flag para o Igapó. | Playtest estático local PASS, com UNKNOWN para execução/câmera/transição. [worldRootSanctuary.test.ts](../src/tests/worldRootSanctuary.test.ts) verifica mapa, diálogo, missão, assets, renderer e binding. |
| Igapó das Memórias — `stage.aguas.igapo-das-memorias` | [igapoDasMemorias.ts](../src/stages/chapters/aguas/igapoDasMemorias.ts), `igapoVisuals.ts` e plano de exemplo; 96×30; `createIgapoMap()` determinístico. | `chapter.aguas`, revisão 2, **única `campaign-eligible`**; Vestígio Submerso; missão “Rastrear a água sem memória”; duas waves (2 e 3 inimigos, `affinity`/`applaud`); saída física condicionada para Coração Corrompido; variantes Ribeirinho e Sombrio. | Playtest estático PASS; execução/câmera/transição contém UNKNOWN. Testes de plano, playtest, apresentação e campanha; homologação individual e de campanha consta como PASS no README e na documentação de autoria, mas não foi reexecutada nesta auditoria. |
| Coração Corrompido — `stage.aguas.coracao-corrompido` | [coracaoCorrompido.ts](../src/stages/chapters/aguas/coracaoCorrompido.ts); 88×30; mapa autoral determinístico `createCorruptedHeartMap()`. | `chapter.aguas`, `narrative-reserved`; missão “Silenciar o coração”, concluída por encontro de duas waves (2 e 3 inimigos `affinity`/`applaud`); diálogos de entrada/conclusão; saídas condicionais para `verse_01_atrium` e retorno ao Igapó. | Playtest estático PASS; execução/câmera/transições UNKNOWN. Cobertura em [stagePlaytest.test.ts](../src/tests/stagePlaytest.test.ts), [campaignIntegrationCycle.test.ts](../src/tests/campaignIntegrationCycle.test.ts) e homologação macro documentada. |
| Jardins das Flores Veladas — `level_08_paradiso` | [veiledGardensStage.ts](../src/stages/chapters/flores-veladas/veiledGardensStage.ts), [veiledGardensMap.ts](../src/stages/chapters/flores-veladas/veiledGardensMap.ts) e plano; 120×38; `createVeiledGardensMap()` determinístico. | `chapter.floresta.flores-veladas`, revisão 2, `narrative-reserved`; Iaraí e Tucum; missão “Reacender o coro” (Iaraí obrigatório, Tucum opcional, encontro); duas waves (2 e 3); saída física terminal; variantes Natural e Corrompida. | Playtest estático PASS; câmera, execução ao vivo e transição terminal UNKNOWN. [veiledGardens.test.ts](../src/tests/veiledGardens.test.ts) confirma ID único, mapa, NPCs, waves, missão, saída e binding. |

O catálogo registra os três capítulos na lista
[CampaignChapterCatalog.ts](../src/stages/chapters/CampaignChapterCatalog.ts);
[registerCampaignChapters.ts](../src/stages/chapters/registerCampaignChapters.ts)
valida e registra as entradas. O Igapó está associado a
`region.aguas.igapo`; os Jardins a `region.floresta.flores`; fungos e copas
continuam planejados. Raiz do Mundo ocupa o hub; Coração é a segunda fase da
Rota das Águas.

#### Exemplos de autoria fora do catálogo de produção

- `src/examples/chapter-template/` define uma fábrica reutilizável de capítulo
  e fase autorais, com IDs namespaced e geometria determinística. Não é uma
  fase de runtime registrada.
- `src/examples/chapters/homologacao-9-7c/` é uma instância de demonstração do
  template, namespace `authoring.homologacao.demo`, com IDs
  `chapter.authoring.homologacao.demo` e
  `stage.authoring.homologacao.demo.approach`. Não é adicionada ao catálogo de
  produção.
- `src/examples/chapters/igapo-das-memorias/stage-plan.json` é um plano de
  exemplo para a fase real `stage.aguas.igapo-das-memorias`, não uma segunda
  definição carregável.

Esses recursos demonstram autoria e validação; não contam como fases jogáveis
adicionais nem como capítulos registrados na campanha.

## Catálogos, campanha e menu

### Catálogos e identidades

1. **Dados legados:** `ALL_LEVELS`, `VERSE_SECTIONS` e `CORRIDOR_LEVEL`.
2. **Compatibilidade:** `registerLegacyStages()` cria `legacy.levels`,
   `legacy.verse` e `legacy.corridor`; `level_08_paradiso` é excluído dessa
   lista pelo ID migrado.
3. **Capítulos de produção:** `CAMPAIGN_CHAPTER_CATALOG` registra as quatro
   fases em três capítulos.
4. **Catálogo consultável:** `GameSessionService` constrói o registry,
   `StageCatalogService` valida/distribui elegibilidade e `StageLoader` resolve
   uma fase. A consulta observada classificou 13 IDs como `individual-only`,
   3 como `narrative-reserved` e 1 como `campaign-eligible`.
5. **Templates procedurais e de autoria:** presets do gerador e templates CLI
   são fontes técnicas diferentes; não são fases de produção adicionais.

A macro `UMBRA_CAMPAIGN_ROUTE_SLICE` conserva seus nove slots de topologia:
Raiz, Igapó, Coração e seis posições com `verse_01_atrium`,
`verse_02_galeria` e `verse_03_santuario` repetidos. A macro é separada da
composição aleatória, tem IDs e persistência próprios e só a primeira travessia
Raiz → Igapó → Coração é descrita como homologada no README atual. O esqueleto
maior ainda tem regiões planejadas. A presença de Garden no binding da região
da floresta não significa que a fase foi inserida na sequência fixa desses nove
slots.

### Cenas e seleção

- [main.ts](../src/main.ts) registra `BootScene`, `MenuScene`,
  `GameModesScene`, criador de personagem, ajustes, catálogo, editor e
  `GameScene`.
- [MenuScene.ts](../src/scenes/MenuScene.ts) apresenta personagem/classe e os
  botões Jogar, Editar Personagem, Forja, Ajustes e Catálogo.
- “Jogar” abre [GameModesScene.ts](../src/scenes/GameModesScene.ts). A cena
  apresenta quatro modos e delega seleção e validação a
  [GameSessionService.ts](../src/application/stages/GameSessionService.ts):
  - **Campanha Clássica:** encaminha `{ macroCampaign: true }` para `GameScene`,
    que configura a macro existente.
  - **Campanha Aleatória:** seed editável/gerada; política linear (9 definições/
    9 instâncias) ou ramificada (9 definições/10 instâncias); inicia somente
    após composição válida e permite retomar a run salva.
  - **Campanha Personalizada:** atribui fases aos nove slots fixos, valida a
    seleção no compositor e não inicia se incompleta/incompatível.
  - **Jogar Fase:** pagina as fases do catálogo real (8 por página), inicia via
    loader sem save de campanha e usa progressão em memória.
- Os seletores exibem título, ID, capítulo, bioma e dificuldade. Não há
  seletor de variante visual na cena, embora o serviço aceite
  `presentationVariantId`.
- [CatalogScene.ts](../src/scenes/CatalogScene.ts) é outro catálogo de UI:
  mobs, personagens e armas; não é o catálogo de fases.

### Estado observado do menu

`GameSessionService.menuState()` foi executado sem storage de campanha para
evitar escrita. Resultado:

| Campo | Resultado |
|---|---:|
| `catalogReady` | `true` |
| Fases elegíveis (`campaign-eligible`) | 1 |
| Candidatas + fases reservadas | 4 |
| Definições exigidas por política | 9 |
| Campanha Aleatória (linear/ramificada) | indisponível: apenas 1 elegível |
| Campanha Personalizada | indisponível: apenas 1 elegível |
| Campanha Clássica | disponível |
| Jogar Fase | disponível; 17 fases carregáveis |

Isso não representa conteúdo faltante que deva ser contornado com fixtures: a
9.6B exige destinos declarados compatíveis e o menu não pode apresentar uma
composição inválida como início jogável.

## Problemas e riscos comprovados

| Prioridade | Evidência | Efeito e limite |
|---|---|---|
| Alta | O catálogo real tem uma única fase elegível, frente a nove exigidas. | Aleatória e personalizada ficam indisponíveis por diagnóstico correto. O modo clássico e o individual são alternativas funcionais; não adicionar fases fictícias. |
| Alta | `stageCharacterization.test.ts` documenta que o caminho legado usa a composição das waves, mas descarta delays declarados e inimigos-base quando existem waves; aplica intervalo fixo de 1200 ms. | O layout pode declarar uma sequência diferente da percebida em runtime. Corrigir só com SPEC de comportamento e teste de regressão, antes da migração em massa. |
| Média | `stageLoaderLegacy.test.ts` preserva warnings de posições sobre sólido em Nave e Clocktower e sobre hazard em Inferno e Limbo. | A carga legada não reprova nem corrige os dados para preservar compatibilidade. Exige revisão de colisão/rota por fase e homologação real. |
| Média | `level_10_ithavoll` não tem inimigos nem waves no `LevelDefinition`. | A sequência e o loader passam sem provar que essa fase tem objetivo de gameplay completo. |
| Média | O macro fixo inclui seis ocorrências legadas repetidas após as três fases autorais iniciais. | O restante da campanha ainda não é conteúdo autoral completo; não confundir `stageId` repetido em slots com novas definições. |
| Média | A lista individual está disponível, mas não permite escolher variante visual. Os cartões de modo são interativos mesmo quando indisponíveis (o botão de iniciar continua desativado e mostra o motivo). | A apresentação é possível por outro fluxo, mas não está exposta ao jogador no menu; o estado visual pode sugerir ação para modos que não iniciam. |
| Baixa | `README.md` descreve três fases autorais e dois capítulos, mas a consulta do registry atual encontra quatro módulos em três capítulos após a entrada dos Jardins. | Documentação pública está defasada; correção do README não é parte desta entrega de inventário. |
| Baixa | O inventário legacy usa mapas 40×25 fixos, sem missão/NPC modernos. | A reutilização exige preservar primeiro mapa/ID e habilitar melhoria narrativa como conteúdo aditivo, não pressupor equivalência de jogabilidade com módulos novos. |

## Planejamento incremental

1. **Baseline e contratos:** manter as caracterizações dos IDs, mapa, catálogo,
   progressão, rotas e saves; conferir o estado real no registry e coletar
   evidência Phaser inicial antes de qualquer ajuste.
2. **Correções legadas isoladas:** resolver os quatro avisos de colocação e
   revisar a semântica de waves; desenhar objetivo/encontro para Ithavoll. Cada
   comportamento com sua SPEC e testes, sem reescrever `LevelDefinition`.
3. **Fase piloto de legado:** selecionar uma fase curta e estável (sugestão:
   Vestibule), reutilizar o mapa e `stageId`, montar o módulo com contratos
   atuais e manter `individual-only`. Excluir a definição legada do registro
   canônico apenas pelo mecanismo de migração já existente, sem duplicação.
4. **Migração por blocos:** modernizar sequência de salas, corredor e regiões
   antigas em unidades pequenas; preservar IDs, mapas reconhecidos e
   compatibilidade de saves. Avançar de `individual-only` para marco/candidata
   apenas com evidência de conteúdo e transição.
5. **Menu guiado pelo catálogo:** melhorar estado desabilitado, ordenação por
   capítulos/rotas e descoberta de variantes, reaproveitando
   `GameSessionService`; manter toda regra fora das cenas e não mudar os quatro
   modos ou a política de save sem SPEC própria.
6. **Campanha por elegibilidade comprovada:** promover só fases que satisfaçam
   slots, beats, destinos, capacidade de saída e limites da política. Preservar
   o router clássico e o save separado; não abrir campanha composta por
   contagem nominal apenas.
7. **Homologação e documentação:** executar plano, validate, playtest, preview,
   campanha e execução real no Phaser; conferir retomada/persistência e atualizar
   catálogo/documentação só depois de PASS real. `UNKNOWN` permanece pendente.

### Critérios de saída para futuras migrações

- ID estável e uma única definição canônica no registry;
- mapa e saída carregáveis pelo `StageLoader`, referências sem warning novo e
  objetivo compreensível;
- plano e playtest estático aprovados, sem apresentar isso como aprovação de
  runtime;
- fluxo de NPC/diálogo/combate/saída comprovado por execução Phaser para
  conteúdo narrativo;
- regressão do menu, campanha clássica, save, progresso e modo individual;
- candidata de composição somente quando a política selecionada puder gerar e
  restaurar uma run válida, sem placeholder ou bypass.

## Verificações e limitações desta auditoria

As quatro fases autorais foram carregadas pelo `StageLoader` e examinadas pelo
`StagePlaytestValidator`: todas tiveram resultado estático `PASS`, sem checks
`FAIL`; os relatórios mantiveram `UNKNOWN` para câmera, execução real e
transições. O runner de homologação não foi repetido nesta tarefa: ele inicia
navegador/CDP, grava capturas/relatórios e publica índice local. Resultados
anteriores de Igapó e da campanha são citados como documentação histórica do
projeto, não como execução desta auditoria.

Testes diretamente relacionados incluem
[stageCharacterization.test.ts](../src/tests/stageCharacterization.test.ts),
[stageLegacyCompatibility.test.ts](../src/tests/stageLegacyCompatibility.test.ts),
[stageLoaderLegacy.test.ts](../src/tests/stageLoaderLegacy.test.ts),
[stageCatalogService.test.ts](../src/tests/stageCatalogService.test.ts),
[campaignChapterCatalog.test.ts](../src/tests/campaignChapterCatalog.test.ts),
[gameModesMenu.test.ts](../src/tests/gameModesMenu.test.ts),
[gameSessionService.test.ts](../src/tests/gameSessionService.test.ts),
[stagePlan.test.ts](../src/tests/stagePlan.test.ts),
[stagePlaytest.test.ts](../src/tests/stagePlaytest.test.ts),
[worldRootSanctuary.test.ts](../src/tests/worldRootSanctuary.test.ts) e
[veiledGardens.test.ts](../src/tests/veiledGardens.test.ts).

Os comandos de fechamento e seus resultados serão registrados após a execução
final. A auditoria não altera o jogo, não corrige as pendências e não declara
homologação nova.
