# Redesign do Igapó: geometria autoral e duas apresentações

**Data:** 2026-11-02  
**Estado:** especificação anterior à implementação  
**Continuidade:** substitui o escopo visual de
`SPEC/2026-11-02-redesign-visual-igapo-das-memorias.md`. Complementa a Etapa
9.8.1 sem substituir seus contratos de campanha, narrativa ou compatibilidade.
Esta revisão incorpora a autorização explícita para alterar a geometria lógica
autoral do Igapó.

## Objetivo

Redesenhar o Igapó como uma floresta amazônica alagada, com uma silhueta
memorável de margens, ilhas e canais, e duas leituras do mesmo mapa: Natural e
Corrompida. Executar e refinar as duas apresentações no preview Phaser e no
World Lab existentes.

## Invariantes de campanha e gameplay

- Preservar `stageId`, revisão do manifesto, identidade e compatibilidade de
  saves. Não adicionar estado de apresentação aos saves.
- Preservar os IDs e posições atuais de spawn, Vestígio/NPC, saída física,
  itens, inimigos, patrulhas, encontros, progressão, flags, diálogos, sinais
  narrativos e bindings.
- A distribuição de tiles pode mudar. Os significados continuam: `0` é chão
  transitável; `1`, `2` e `3` continuam sólidos; renderer, câmera e física
  consomem os contratos existentes.
- Validar que spawn, NPC, itens, encontros, patrulhas e saída permanecem
  acessíveis com o corpo real do jogador; manter a rota principal e os desvios
  exploráveis, sem pontos de passagem bloqueados por água, raízes ou bordas.
- A aparência não cria bodies, hazards, interações ou comandos narrativos.
  Decorações e efeitos permanecem estritamente visuais.
- As duas apresentações carregam a mesma matriz, pontos de gameplay e
  distribuição de decorações. Apenas tileset, remapeamentos de decoração,
  paleta e efeitos diferem.
- Reutilizar `StageVisualRegistry`, `StageMapRenderer`, loader, validator,
  preview Phaser e World Lab. Não criar framework ou alterar os sistemas
  genéricos de combate, IA, router ou persistência.

## Geometria autoral

- Substituir a disposição atual de ilhas pequenas por massas de terra maiores
  e irregulares, margens recortadas, enseadas, braços de água e canais
  sinuosos. A borda do mapa continua fechada.
- Compor pelo menos uma clareira principal legível e desvios conectados; não
  usar corredores retangulares longos como única forma de circulação.
- Manter os pontos de gameplay em suas coordenadas e dimensionar a geometria
  para preservar passagem física para o jogador, e não somente conectividade
  entre centros de tiles.
- Atualizar testes de caracterização de geometria para verificar dimensão,
  borda, proporção e conectividade dos tiles, largura física mínima, áreas de
  combate, todos os pontos de gameplay e invariância entre apresentações.

## Direção visual

### Natural

- Água verde-azulada com leitura contínua de canal profundo, faixa rasa nas
  margens, reflexos/ondulações sutis e vegetação aquática esparsa.
- Vegetação saudável em grupos intencionais, com copas de escalas distintas,
  palmeiras controladas, moitas, juncos, sombras e árvores/raízes tocando a
  água.
- Pelo menos três landmarks claros, incluindo ruína e árvore ou tronco
  monumental, além de uma canoa. A folha CC0 existente foi inspecionada e não
  contém canoa; portanto, criar somente para este landmark uma ilustração SVG
  original pequena, local, documentada com dimensões e SHA-256. Carregá-la pelo
  preload da BootScene e registrá-la em `StageVisualRegistry`.
- Margens mais densas; clareiras com cobertura fragmentada e baixa, evitando
  decoração alta sobre o combate.

### Corrompida

- Manter o mesmo `tileMap`, pontos e decorações, usando os IDs de apresentação
  existentes para compatibilidade.
- Comunicar desmatamento e contaminação por substituições visuais registradas:
  árvores mortas/ausentes em parte dos agrupamentos, manchas de óleo/resíduos e
  fumaça discreta. Preservar contraste de entidades e navegação.
- Não simular contaminação por escurecimento global extremo nem esconder
  projéteis, jogador, inimigos ou marcadores.
- Não adicionar ou substituir assets além da canoa original necessária.
  Priorizar frames locais já registrados; o SVG novo não altera assets CC0,
  IDs do mapa, colisões ou comportamento.

## Critérios observáveis

1. `stageId`, revisão, saves existentes e todos os dados de campanha/narrativa
   listados nas invariantes permanecem compatíveis.
2. A geometria lógica é de fato redesenhada, mantém dimensão e borda fechada,
   apresenta proporções maiores de massas conectadas e canais sinuosos, sem
   reproduzir o mapa anterior.
3. O validador geométrico confirma conectividade em quatro direções e passagem
   física para o corpo de 42×58 px desde o spawn até NPC, saída, itens,
   encontros e desvios; nenhuma decoração participa desse cálculo.
4. As células sólidas e transitáveis correspondem ao novo mapa e permanecem
   idênticas entre Natural e Corrompida; portas/saída continuam na posição
   declarada pelos manifests.
5. Natural apresenta margens orgânicas, água rasa/profunda, clusters de
   vegetação, clareiras e pelo menos três landmarks registrados, incluindo a
   canoa original carregada pela BootScene.
6. Corrompida é reconhecivelmente desmatada/contaminada, com manchas e fumaça
   legíveis, e não é apenas uma mudança de tint.
7. As variantes preservam o mesmo mapa lógico, encontros, NPCs, spawns, saída,
   itens e distribuição de decorações; todos os IDs resolvem no registry.
8. Testes dirigidos cobrem geometria e passagem física, loader/validator,
   renderer de água/efeitos, assets/registry, preview e World Lab.
9. Homologação real em navegador, 1280×720, confirma as duas composições,
   movimento/combate, água, clareiras, landmarks, legibilidade e console limpo.
   Capturas devem ser gravadas em `.tmp/evidence/`; teste automatizado não
   substitui esta inspeção.
10. Rodar `npm test -- --runInBand`, `npm run build`,
    `npm run check:gates` e `git diff --check`.

## Validação prevista

- Testes dirigidos do módulo, topologia, flood-fill físico, margens, proporções
  do mapa e preservação dos pontos de gameplay.
- StageLoader/StageValidator, resolução das duas variantes, decoração, efeitos
  e colisões exatas do renderer.
- Preview Phaser e projeção visual World Lab.
- Inspeção interativa do preview em Natural e Corrompida com evidência real.
- Fechamento único com gates, build, suíte completa e `git diff --check`.
