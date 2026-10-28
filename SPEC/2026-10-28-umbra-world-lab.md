# Umbra World Lab *(2026-10-28)*

## Estado e relação com a campanha procedural

Esta SPEC introduz a Etapa 8.4.1, entre a vinculação canônica de saídas e a
futura Etapa 8.5. Ela não altera grafo, placement, binding, persistência,
transições ou jogabilidade. O World Lab é um consumidor de desenvolvimento dos
contratos e serviços headless já publicados.

## Objetivo observável

Durante `npm run dev`, abrir `/world-lab.html` deve permitir:

- gerar com seed um grafo real por `CampaignGraphGenerator`;
- selecionar nodes e edges, inspecionar bifurcações e convergências;
- carregar a fase correspondente por `StageLoader` e projetar seu mapa real;
- sobrepor spawns, inimigos, boss, itens, NPCs, anchors e saídas físicas;
- inspecionar o binding produzido por `CampaignExitBinder`;
- exibir falhas de generator, loader, resolver, binder, integração e snapshot;
- exportar e importar um snapshot determinístico `umbra-world-lab/v1`.

O build de produção continua tendo somente `src/index.html` como entrada. A
página e seus módulos não podem ser alcançados a partir de `src/main.ts`.

## Arquitetura

```text
world-lab.html
  → UI DOM/SVG
  → sessão e seleção
  → projeção/snapshot tipados
  → adaptador de inspeção
  → APIs públicas de stages
```

O módulo vive em `src/devtools/world-lab/` e se divide em:

- `contracts`: modelo canônico de visualização, seleção, diagnósticos e snapshot;
- `WorldLabDataService`: composition root de generator, registry, loader,
  resolver e binder;
- `WorldLabProjector`: projeção sem estado de contratos reais para o modelo de
  visualização;
- `WorldLabSnapshot`: serialização canônica e validação estrutural de entrada;
- `WorldLabSession`: estado exclusivo de seed, documento, seleção e filtros;
- `ui/`: graph SVG, stage SVG, inspector, diagnostics e shell da aplicação;
- `fixtures/`: catálogo de demonstração e metadata de apresentação claramente
  rotulados `Fixture`.

Nenhum módulo headless importa o World Lab. O World Lab não importa Phaser,
`GameScene`, combate, simulação, IA ou progressão.

## Fonte de dados e adaptação Fixture

Não existe ainda um catálogo de campanha de produção. O Lab fornece um catálogo
`Fixture` de templates que aponta para fases legadas registradas pela API
pública. O grafo, o carregamento, o placement e o binding continuam sendo
executados pelos componentes reais.

Cada manifesto legado contém uma única saída linear `legacy.next`, cujo destino
não representa as rotas sorteadas. Em modo Fixture, o adaptador cria uma cópia
do `LoadedStage` com `manifest.exits` vazio antes do resolver. Isso não muta o
stage carregado nem os algoritmos e força a política pública `synthetic-slot`
da Etapa 8.4. A interface identifica a fonte como `Fixture / real headless
pipeline`. Quando houver manifestos de campanha, esse overlay deve ser removido.

## Modelo visual

Nodes preservam IDs, stage/template, ato, profundidade, ramo, tipo, bioma,
dificuldade, capacidade e contagens de entrada/saída. Edges preservam `edgeId`,
source, target, kind, `exitSlotId`, `physicalExitId` e, quando resolvidos,
`stageExitId`, tile e estado do binding.

Stages preservam somente dados necessários à inspeção: identidade, título,
tema, dimensões, tiles numéricos, marcadores projetados e saídas físicas. O Lab
não usa ordem de array, rótulo ou coordenada como identidade lógica.

Seleção é propriedade exclusiva de `WorldLabSession`: node, edge e tile são
campos ortogonais. Selecionar uma saída física seleciona também seu edge e node
de origem. Views apenas emitem IDs; não duplicam estado.

## Interface e interação

- barra superior: seed, Generate, Regenerate, node, grade, overlays, export e
  import;
- Campaign Graph: SVG com layout determinístico por profundidade/ramo, zoom,
  pan, seleção, caminho destacado e badges de entry/milestone/completion;
- Stage Inspector: SVG com tiles, coordenadas, zoom, pan, grade, entidades,
  anchors e saídas físicas clicáveis;
- Inspector: dados estritamente presentes no modelo projetado;
- Diagnostics: severidade, origem, código, mensagem e referências clicáveis.

O tema usa azul-marinho/grafite, verde válido, amarelo warning e vermelho erro.
Painéis usam CSS Grid redimensionável pelo navegador, sem nova dependência.

## Snapshots

`umbra-world-lab/v1` contém seed, fonte, graph view, stage views e diagnósticos.
Arrays e chaves relevantes são ordenados canonicamente antes da serialização.
Importação trata o JSON como `unknown`, valida schema, tipos, IDs, referências,
tiles retangulares e unicidade, e só substitui a sessão após sucesso integral.
Versão incompatível, corrupção e referência inconsistente retornam falhas
tipadas. O formato não executa código, não contém storage ou dados pessoais e
não é save de campanha.

## Temas preparados

Metadata opcional do Lab associa templates Fixture a seis temas de apresentação:

- Floresta das Raízes;
- Igapó dos Esquecidos;
- Jardim dos Fungos;
- Minas do Sol Morto;
- Porto das Palafitas;
- Palácio do Credor.

São somente paletas e rótulos da ferramenta. Não criam biomas, tiles ou assets e
não alteram `BiomeId`, `RegionTemplate` ou `LevelDefinition`.

## Diagnósticos

O modelo distingue `campaign-generator`, `stage-loader`,
`physical-exit-resolver`, `campaign-exit-binder`, `integration` e `snapshot`.
Severidade existente é preservada; ausência de integração é warning e falha de
contrato/serviço é error. Nenhuma falha é convertida em stage aparentemente
válido.

## Testes e critérios de aceitação

- projeção preserva nodes, edges, IDs, mapa e associação física;
- reordenar entradas equivalentes produz projeção/snapshot iguais;
- seleção de saída sincroniza node, edge e tile;
- round-trip de snapshot é byte a byte determinístico;
- schema, corrupção, duplicatas e referências inválidas falham atomicamente;
- falhas dos quatro serviços e ausência de dados permanecem distinguíveis;
- componentes SVG respondem a seleção e filtros no ambiente jsdom;
- nenhuma dependência do World Lab é alcançável pelo entrypoint de produção;
- testes das Etapas 8.2, 8.3 e 8.4 permanecem verdes;
- typecheck, gates, suíte completa, build e `git diff --check` passam.

## Limitações

- o catálogo e os temas são Fixture, não conteúdo de campanha;
- o overlay de manifesto é necessário enquanto fases legadas só conhecerem a
  progressão linear;
- snapshots não restauram runtime, save ou estado narrativo;
- o Lab não edita mapa, grafo ou manifesto;
- colisão, transição e comportamento Phaser continuam exigindo futuro teste de
  navegador na Etapa 8.5;
- painéis não possuem splitter dedicado; zoom/pan e layout permanecem leves e
  sem bibliotecas externas.

## Extensão

Novo tema é adicionado apenas ao registro de apresentação do Lab. Nova fase
entra por um `RegionTemplate` de catálogo de inspeção cujo `stageId` esteja no
`StageRegistry`; os serviços reais continuam responsáveis por validar e gerar.
Quando o catálogo de produção existir, ele deve ser injetado no
`WorldLabDataService`, substituindo a fixture sem alterar views ou snapshots.

## Evidência de implementação

Implementado em 2026-10-28 com página servida em `/world-lab.html`. O Vite
respondeu HTTP 200 para a página e seu módulo. A automação visual por navegador
não ficou disponível nesta execução; render e interações foram verificados em
jsdom, sem declarar inspeção visual manual.

Os 14 testes específicos cobrem pipeline real, projeção e IDs, branches/rejoin,
saídas físicas/bindings, repetição determinística, ordem canônica, round-trip e
falhas de snapshot, sincronização de seleção, indisponibilidade de integração,
origens distintas de generator/loader/resolver/binder, reachability do entrypoint
e interação DOM/SVG. A suíte completa passou com 713 testes em 42 suítes,
incluindo as Etapas 8.2–8.4.

O build transformou os mesmos 698 módulos do jogo e gerou somente `index.html`:
`dist/world-lab.html` não existe e nenhuma string identificadora do Lab apareceu
em `dist`. Typecheck, architecture/traceability gates e `git diff --check`
também passaram.

