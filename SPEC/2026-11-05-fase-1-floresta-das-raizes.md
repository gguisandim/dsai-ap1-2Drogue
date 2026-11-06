# Fase 1 — Floresta das Raízes

**Data:** 2026-11-05  
**Estado:** especificação anterior à implementação  
**Continuidade:** substitui, para `stage.raiz-do-mundo.santuario`, a decisão da
Etapa 10.0 que restringia a fase ao modo `individual-only` e encerrava sua saída
em `campaign.complete`. Preserva os contratos, assets e efeitos daquela etapa e
usa a infraestrutura das Etapas 9.9–9.14.

## Objetivo

Transformar o santuário Raiz do Mundo na primeira fase jogável canônica da
campanha, identificada pelo hub `hub.floresta-das-raizes`. A fase passa a ser
uma travessia amazônica fantástica contínua e panorâmica, com introdução,
vestígios, Guardião da Seiva, dois encontros graduais, árvore monumental,
missão concluível e saída física para `stage.aguas.igapo-das-memorias`.

## Identidade e compatibilidade

- São preservados `chapter.raiz-do-mundo` e
  `stage.raiz-do-mundo.santuario`; nenhum segundo prólogo é criado.
- `verse_01_atrium` permanece registrado como conteúdo legado, mas deixa de ser
  o mapa inicial da vertical slice macro.
- O capítulo declara dependência obrigatória de `chapter.aguas`, pois sua saída
  aponta para uma fase desse capítulo.
- A fase usa participação `narrative-milestone`: continua fora da seleção
  procedural e deixa de ser classificada como conteúdo apenas individual.
- A revisão do manifesto, do capítulo e da campanha macro é incrementada. Saves
  das revisões anteriores da vertical slice são migrados pelo fluxo versionado
  existente, sem alteração das chaves persistidas.
- `LevelDefinition` e todos os contratos públicos permanecem compatíveis.

## Plano e geometria

O `stage-plan.json` descreve uma progressão narrativa linear por seis regiões
conectadas no mesmo mapa: entrada,
trilha dos vestígios, clareira do Guardião, primeiro conflito, santuário e
passagem das águas. A geometria inclui desvios físicos opcionais que retornam à
rota principal sem transformar objetivos ou saídas em ramos concorrentes.

O mapa autoral tem 116×36 tiles, borda fechada, caminho oeste→leste largo e
sinuoso, clareiras elípticas, braços de exploração, água em cursos irregulares,
ruínas e vegetação usada como limite natural. Spawn e árvore ficam separados
por mais de uma largura de viewport de 1280 px. A saída fica no extremo leste e
é alcançável sem teleporte.

A árvore monumental e a composição do santuário da Etapa 10.0 são reutilizadas
na região final. Monólitos, raízes, copas, cipós, vegetação rasteira e
bioluminescência são redistribuídos para criar profundidade e orientar o
percurso. O terreno usa as variantes locais existentes, sem asset remoto ou de
licença desconhecida.

## Narrativa e progressão

1. Uma fala curta de entrada apresenta a floresta sem interromper a exploração
   com exposição longa.
2. Ruínas e inscrições conduzem à clareira do Guardião da Seiva.
3. O Guardião explica que a árvore registra as águas e pede que o jogador
   atravesse os sinais de desequilíbrio sem nomear uma região corrompida.
4. O primeiro encontro contém um único inimigo de nível 1; cinco segundos após
   sua conclusão, o segundo contém dois inimigos e ocorre mais adiante, longe
   do spawn.
5. A missão `mission.raiz-do-mundo.ouvir-raizes` exige conversar com o Guardião
   e concluir o encontro declarativo.
6. Ao concluir a missão, a flag estável de passagem é marcada, a saída é
   desbloqueada e a fase é concluída. A recompensa é idempotente.
7. A saída física `exit.raiz-do-mundo.to-igapo` carrega diretamente o Igapó das
   Memórias dentro do fluxo macro normal.

## Integração da campanha

`UMBRA_CAMPAIGN_ROUTE_SLICE` passa a publicar a fase Raiz do Mundo como conteúdo
real do hub. O primeiro nó do grafo usa o ID autoral, e o binder associa a
conexão `connection.hub.floresta-das-raizes.route.aguas` à saída declarada do
manifesto. O adaptador não cria portal sintético concorrente.

A homologação de campanha completa primeiro o prólogo por suas regras reais e
então comprova Raiz do Mundo → Igapó → Coração Corrompido. O destino imediato do
prólogo é sempre o Igapó; o Coração não é antecipado.

## Apresentação e desempenho

- O santuário original permanece um marco tardio, integrado ao terreno.
- Água, névoa, vaga-lumes, luzes locais, espíritos, cintilação e movimento de
  folhagem são reposicionados para o mapa panorâmico.
- Efeitos usam limites já validados pelo runtime; não alteram colisões.
- As decorações são determinísticas e evitam âncoras de spawn, NPC, inimigos,
  itens e saída.
- A câmera e a física existentes são preservadas; nenhum motor novo é criado.

## Critérios observáveis e testes

1. O plano valida e corresponde ao ID, spawn, regiões e saída da fase.
2. O mapa mede 116×36, tem uma única origem e uma única saída, borda fechada e
   rota física compatível com o corpo real do jogador.
3. Spawn, NPC, inimigos, itens, santuário e saída são alcançáveis.
4. A árvore está distante do spawn e a composição não se lê como arena
   quadrada nem como piscinas retangulares.
5. NPC, diálogo, missão, flags, encontro e conclusão validam nos contratos
   públicos; a progressão estática resulta em PASS.
6. A fase é `narrative-reserved`, não candidata procedural, e tem dependência
   válida de `chapter.aguas`.
7. O fluxo macro começa em `stage.raiz-do-mundo.santuario`, expõe uma única
   conexão ao Igapó e preserva retomada/persistência nas revisões suportadas.
8. O Phaser em 1280×720 comprova entrada, trilha, NPC/POI, primeiro encontro,
   aproximação, árvore e transição para o Igapó com capturas em `.tmp/`.
9. O World Lab, o Igapó, o Coração Corrompido e o ciclo procedural não sofrem
   regressão.
10. Testes dirigidos, `npm run check:gates`, `npm run build`,
    `npm test -- --runInBand` e `git diff --check` passam.

## Limitações

- O encontro declarativo continua iniciando em `stage-ready`, único modo
  suportado; a apresentação gradual é obtida por distância espacial, escala e
  composição dos grupos, não por um gatilho de região inexistente.
- O mapa usa o catálogo visual local da Etapa 10.0. Nenhum asset novo é criado
  nesta entrega.
- A exigência de commit da SPEC antes da implementação não pode ser materializada
  porque o pedido proíbe commits; a ordem é preservada no worktree e o registro
  permanece com `Commit: pendente`.
