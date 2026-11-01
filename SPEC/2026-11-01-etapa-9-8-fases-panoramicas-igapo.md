# Etapa 9.8 — Fases panorâmicas e progressão narrativa do Igapó

**Data:** 2026-11-01

**Estado:** especificação anterior à implementação

**Continuidade:** sucede a Etapa 9.7E e reutiliza os contratos de autoria,
apresentação, narrativa, encontros, campanha e persistência já publicados. Esta
SPEC não substitui a Etapa 10.0 nem altera a política das campanhas compostas.

## Objetivo

Transformar a Rota das Águas em um percurso jogável de duas fases top-down
distintas — Igapó das Memórias e Coração Corrompido — com mapas mais largos que
a viewport, progressão predominantemente horizontal, exploração em quatro
direções e transição narrativa física entre os módulos.

## Diagnóstico e prova panorâmica

O runtime já dimensiona os limites da câmera e da física a partir de
`tileMap[0].length * 32` e `tileMap.length * 32`, mantém a câmera seguindo o
jogador e usa a matriz completa para colisão e navegação. `StageManifest`,
`StageLoader` e `StageMapRenderer` não limitam mapas a 40×25. Portanto, a prova
de conceito deve ser um módulo autoral isolado de teste com 80–120 tiles de
largura, carregado pelos contratos atuais e validado quanto a dimensões,
conectividade, spawn, obstáculos e saída. Não será criado outro sistema de
câmera, renderer, física, chunks ou movimentação.

## Rota das Águas

### Igapó das Memórias

- passa a usar mapa autoral panorâmico de 96×30 tiles;
- preserva IDs públicos, Vestígio Submerso, apresentação Ribeirinho/Sombrio e
  identidade de floresta inundada;
- distribui introdução, bifurcações, evidências e encontros ao longo do eixo
  oeste–leste, mantendo rotas secundárias conectadas;
- declara missão curta de descoberta e libera uma saída física no extremo
  oriental para `stage.aguas.coracao-corrompido`;
- mantém combate moderado na introdução e concentra encontros depois do
  primeiro contato narrativo.

### Coração Corrompido

- é um `StageModule` independente, com `stageId`, revisão, mapa 88×30,
  encontro, missão, diálogos, eventos e saídas próprios;
- usa a apresentação sombria existente como apresentação padrão, mas não é uma
  variante do Igapó nem reutiliza sua geometria;
- apresenta água contaminada, passagens quebradas, vegetação degradada e um
  confronto declarativo usando somente arquétipos existentes;
- conclui a missão ao receber `encounter.completed`, registra conclusão
  narrativa e libera as saídas de continuação/retorno previstas pelo grafo;
- usa participação `narrative-milestone`, ficando carregável individualmente e
  reservada à sequência autoral, sem entrar no conjunto aleatório elegível.

O manifesto do capítulo lista os dois módulos na ordem natural → corrompido. O
Igapó aponta para o Coração Corrompido; o segundo módulo termina fora do
capítulo. A validação do capítulo deve confirmar ordem, referências e rota
terminal.

## Integração da campanha clássica e compatibilidade

A campanha clássica mantém nove posições e a política atual. A posição seguinte
ao Igapó passa a carregar o Coração Corrompido; nenhuma regra do compositor
aleatório/personalizado recebe exceção. A aresta de retorno da Rota das Águas
parte do Coração Corrompido, de modo que o fluxo clássico percorra as duas fases
antes de voltar ao hub.

A revisão do grafo clássico sobe para 4. Saves das revisões 2 e 3 são migrados
explicitamente para a mesma identidade estável de nós, preservando transições,
recompensas, posição ativa reconhecida e dados compatíveis. Saves de campanha
composta e as chaves existentes não mudam.

## Apresentações do Igapó

Ribeirinho e Sombrio continuam apresentações alternativas da mesma fase
natural. O mapeamento Sombrio deixa de usar pedras/tocos não contínuos e tints
excessivamente escuros como superfícies repetidas. Ele passa a combinar frames
top-down de vegetação, terra e água já licenciados, com variação contida,
contraste local e ambiente frio. Geometria, tiles lógicos, colisão e IDs das
variantes permanecem invariantes.

## World Lab panorâmico

O World Lab continua incorporando o Phaser real. Uma ponte de desenvolvimento,
ativada somente em `worldLabEmbed`, oferece comandos de inspeção sobre a câmera
do preview já existente:

- enquadrar o mapa inteiro;
- restaurar zoom de gameplay e acompanhamento do jogador;
- pan horizontal/vertical;
- centralizar em spawn/jogador, NPC ou saída selecionada;
- ligar/desligar HUD de objetos de interface, preservando a grade existente;
- aplicar o mesmo comando e zoom inicial aos dois frames da comparação.

O controle não altera mapa, save, física ou estado narrativo. A comparação
garante comandos equivalentes e mesma região inicial, sem prometer sincronização
contínua de câmeras durante gameplay. A ponte não é registrada fora de
desenvolvimento e não cria outro renderer.

## Critérios observáveis

1. Uma fixture panorâmica de 80–120 tiles carrega pelos contratos atuais sem
   erro e mantém spawn, saída e desvios conectados.
2. O Igapó mede 96×30, excede a viewport de 1280×720, permite quatro direções e
   tem caminho oeste–leste sem teletransporte ou softlock.
3. Câmera e física continuam recebendo os limites derivados do mapa, e a câmera
   acompanha o jogador sem exibir a fase inteira no zoom de gameplay.
4. Igapó e Coração Corrompido são módulos registrados, carregáveis,
   determinísticos e com mapas diferentes.
5. O capítulo valida a sequência natural → corrompido e a saída física do Igapó
   aponta para a segunda fase.
6. O Coração Corrompido mede 88×30, usa encontro próprio, conclui sua missão e
   oferece conclusão coerente sem novo arquétipo de combate.
7. O segundo módulo é `narrative-reserved`, não aparece em `candidates()` e não
   muda a política de nove posições.
8. Saves clássicos de revisão 2 ou 3 migram para revisão 4 sem perder a região
   ativa ou transições confirmadas.
9. Variantes Ribeirinho/Sombrio preservam geometria e referências válidas; o
   Sombrio usa frames existentes e contraste legível, sem mosaico de rochas
   escurecidas.
10. World Lab oferece fit, gameplay, pan, foco em marcadores, grade e HUD; em
    comparação, comandos são enviados aos dois previews.
11. Fases legadas e modos individual, clássico, aleatório e personalizado
    continuam disponíveis conforme sua elegibilidade anterior.
12. Gates, build, testes completos e `git diff --check` passam. Homologação
    visual só é declarada com execução real no navegador e screenshots em
    `.tmp/evidence/`.

## Testes previstos

- prova isolada: loader, dimensões, conectividade e referências panorâmicas;
- Rota das Águas: manifestos, IDs, mapas, objetivos, encontros, grafo de
  diálogo, saídas, conectividade e ausência de softlock;
- campanha clássica: sequência das duas fases, binding de saída, retomada e
  migração das revisões 2/3;
- catálogo: registro independente e exclusão do Coração Corrompido dos
  candidatos aleatórios;
- apresentação: frames, invariância entre variantes e renderização;
- World Lab: URL restrita, comandos da ponte, foco, fit, pan, HUD, comparação e
  preservação dos controles existentes;
- regressão dirigida de loader, fases legadas, modos e persistência;
- fechamento único: `npm run check:gates`, `npm run build` e
  `npm test -- --runInBand`.

## Limitações

- carregamento por chunks fica fora do escopo até existir evidência de gargalo;
- o World Lab sincroniza comandos explícitos e enquadramento, não o movimento
  interativo contínuo entre iframes;
- nenhum asset novo, editor de mapas ou sistema de combate é criado.
