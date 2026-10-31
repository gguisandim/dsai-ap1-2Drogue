# Etapa 10.0 — Estética e efeitos do capítulo inicial “Raiz do Mundo”

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.7C. Reutiliza o registro, o preview visual,
os contratos de apresentação e o pipeline local de assets já existentes. Não
altera combate, IA, geração procedural, composição de campanhas, saves,
narrativa, resolução ou binding de saídas.

## Objetivo

Entregar uma fase autoral fixa, jogável e demonstrável com identidade de
santuário amazônico ancestral. A composição deve ter árvore colossal e altar
circular como foco, quatro monólitos inscritos, raízes sobre ruínas, floresta
densa em camadas, água rasa, cipós, folhagens e flora bioluminescente. O mapa
mantém uma clareira central legível para movimento e combate.

## Escopo arquitetural

- O capítulo `chapter.raiz-do-mundo` fica autocontido em
  `src/stages/chapters/raiz-do-mundo/` e expõe uma única fase autoral.
- A fase é registrada no catálogo explícito de produção para aparecer no menu
  individual, no `?stagePreview=` e no World Lab.
- Sua participação é `individual-only`; ela não é candidata das políticas de
  nove fases e não altera nenhuma campanha existente.
- A conclusão usa uma saída física para `campaign.complete`, retornando ao menu
  pelo fluxo individual genérico existente.
- A futura ligação automática como prólogo anterior à seleção procedural fica
  pendente: realizá-la agora exigiria mudar a composição de campanhas, que está
  explicitamente fora do escopo.
- Não há condição por `stageId` na `GameScene`.

## Geometria autoral

O `LevelDefinition` da fase tem topologia fixa, borda fechada, um único spawn,
saída alcançável e clareira central. Água e paredes naturais definem a
circulação; decorações e efeitos são estritamente visuais e não criam nem
alteram colisões. Um encontro declarativo pequeno preserva a legibilidade e
serve apenas à homologação técnica.

As quatro pedras rúnicas, o altar e a árvore são representados por IDs estáveis
e namespaced. A árvore monumental usa arte original em resolução própria, e
não um tile Puny pequeno ampliado ou um placeholder tingido.

## Assets e procedência

- O terreno e os personagens reutilizam os assets locais Puny CC0 já
  documentados na 9.7C.
- Os elementos monumentais e bioluminescentes são assets originais produzidos
  especificamente para o repositório, armazenados localmente e documentados
  com origem, dimensões e SHA-256.
- Nenhum asset é carregado remotamente em runtime.
- O preload continua centralizado na `BootScene`, por uma função de assets do
  capítulo que também cria as texturas procedurais mínimas dos VFX.
- O material de entrada recebido para esta etapa contém apenas a descrição
  textual; nenhuma imagem de referência foi anexada no diretório da tarefa.

## Extensão declarativa de VFX

`StagePresentation` ganha recursos opcionais e aditivos para efeitos de cena.
O contrato permite declarar presets limitados, com IDs, posições normalizadas
ou em tiles, profundidade, intensidade, cores e movimento. A implementação
inicial cobre:

- vaga-lumes com movimento suave;
- névoa em faixas animadas;
- brilho pulsante no altar e nas inscrições;
- partículas espirituais ascendentes junto à árvore;
- luzes locais com oscilação discreta;
- cintilação/ondulação visual da água;
- folhagens de primeiro plano com deriva leve.

O `StageVisualRegistry` valida IDs, limites de intensidade/quantidade, cores,
profundidade, posições e referências de textura, e resolve os presets para
`ResolvedStagePresentation`. O `StageMapRenderer` cria os efeitos reais do
Phaser sem consultar o ID da fase. Quantidades são limitadas e determinísticas;
efeitos não usam física nem modificam o mapa.

Objetos, emitters e tweens são associados ao ciclo de vida dos próprios
GameObjects/da cena. Destruição de mapa, transição e `shutdown` removem efeitos
e cancelam tweens/listeners sem timers órfãos.

## Apresentação e composição

- A árvore ocupa a porção superior-central e domina a silhueta.
- O altar ocupa o centro da clareira, separado visualmente do spawn e da saída.
- Quatro monólitos formam um anel assimétrico ao redor do altar.
- Borda, meio-termo e primeiro plano usam escalas e profundidades distintas.
- A paleta combina verdes úmidos, pedra azul-esverdeada, âmbar e ciano
  bioluminescente, preservando contraste do jogador e dos inimigos.
- Partículas e névoa ficam abaixo de HUD e entidades quando necessário; halos
  locais não aplicam bloom global.

## World Lab e preview

O `StageLoader` resolve mapa, apresentação, encontro e efeitos pelo fluxo
existente. O World Lab projeta os IDs e parâmetros resumidos dos VFX de forma
aditiva. O preview deve funcionar em desenvolvimento por:

```text
http://localhost:5173/?stagePreview=stage.raiz-do-mundo.santuario
```

A mesma fase aparece no menu “Jogar fase”.

## Homologação visual

O fechamento visual deve executar o jogo em 1280×720 e registrar capturas em
`.tmp/evidence/`. A inspeção confirma foco árvore/altar, quatro monólitos,
densidade e profundidade da vegetação, VFX ativos, água animada, legibilidade,
ausência de textura faltante/erro de console, conclusão e desempenho sem queda
evidente. Se o navegador não estiver disponível, a pendência é reportada sem
evidência substituta inventada.

## Testes previstos

- assets: existência, dimensões, hash, procedência e chaves únicas;
- registro: capítulo, fase individual, ausência nas políticas de campanha;
- loader: carregamento determinístico, apresentação e VFX resolvidos;
- geometria: borda, spawn único, saída alcançável, clareira e topologia fixa;
- arte: presença da árvore, altar, quatro monólitos, raízes, vegetação, água e
  flora bioluminescente;
- renderer: criação real de partículas/tweens, profundidade, limites e cleanup;
- validação negativa: textura ausente, tipo/quantidade/intensidade inválidos;
- saída: conclusão individual para `campaign.complete`;
- compatibilidade: catálogo existente preservado e nenhum candidato adicional
  nas campanhas de nove fases;
- World Lab: projeção dos efeitos e recursos da fase.

## Critérios observáveis

1. A fase carrega no `StageLoader`, no preview visual, no modo individual e no
   World Lab.
2. A composição apresenta árvore monumental, altar, quatro monólitos, raízes,
   ruínas, floresta em camadas, água e bioluminescência com assets reais.
3. Pelo menos os sete grupos de efeitos descritos acima executam no Phaser e
   não são apenas metadados.
4. Efeitos e variações visuais não alteram colisão, topologia, spawn ou saída.
5. O mapa é jogável, o encontro é concluível e a saída retorna ao menu.
6. A fase é `individual-only` e não entra nas nove posições sorteadas.
7. Nenhum condicional específico é introduzido em `GameScene`.
8. Assets locais têm procedência e hashes documentados; não há download em
   runtime.
9. Shutdown e reconstrução não deixam emitters, tweens, listeners ou timers
   ativos.
10. Testes dirigidos, `npm run check:gates`, `npm run build`,
    `npm test -- --runInBand` e `git diff --check` passam.

## Limitações e pendências

- A ligação automática como prólogo de todas as campanhas depende de uma SPEC
  própria de composição e persistência; nesta etapa a fase fica preparada e
  jogável isoladamente.
- A imagem de referência mencionada no pedido não estava disponível no anexo;
  a direção de arte segue exclusivamente a descrição textual recebida.

