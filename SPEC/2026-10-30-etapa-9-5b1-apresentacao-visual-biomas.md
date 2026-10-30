# Etapa 9.5B.1 — Apresentação visual extensível de fases e biomas

## Contexto

A Etapa 9.5 criou capabilities versionadas e marcou temas, tilesets e
decorações como planejados porque `GameScene` ainda escolhia diretamente as
texturas dos tiles e ignorava `LevelDefinition.decorations`. Esta etapa torna
somente esses três recursos operacionais. Música, iluminação, névoa e
apresentação de entidades permanecem planejadas para a 9.5B.2.

## Decisão arquitetural

O `tileMap` numérico continua sendo a única fonte de geometria, colisão,
transitabilidade, hazards, spawns e saídas. A apresentação é uma projeção
declarativa sobre os mesmos valores semânticos.

O fluxo passa a ser:

```text
ChapterManifest.visualResources + StageManifest.presentation
                         |
                         v
                 StageVisualRegistry
                         |
                         v
             ResolvedStagePresentation
                         |
          +--------------+--------------+
          v                             v
   StageMapRenderer                 World Lab
      (Phaser)                       (headless)
```

Capítulos não importam Phaser. O registry e o resolver são headless e aceitam
somente dados. O renderer Phaser não conhece IDs de capítulos ou biomas e não
altera tiles lógicos.

## Contratos visuais

`ChapterManifest.visualResources` pode declarar:

- texturas por ID estável e `textureKey` conhecido pelo runtime;
- tilesets versionados, mapeando cada tile lógico a uma textura declarada;
- variantes determinísticas de textura;
- temas versionados, associados a um tileset;
- assets decorativos com camada, profundidade e escala padrão.

`StageManifest.presentation` referencia `themeId` e, opcionalmente, um
`tilesetId` explícito. A ausência do campo seleciona
`theme.legacy.default`/`tileset.legacy.default`, preservando fases antigas.

As identidades lógicas públicas são `floor`, `wall`, `pillar`, `water`,
`lava`, `exit`, `locked-door`, `chest`, `spawn` e `boss`. O contrato visual não
redefine se um tile é sólido ou transitável.

`DecorationPlacement` recebe campos opcionais `layer`, `depth` e `visible`.
`type` continua sendo o ID estável do asset decorativo. Decorações são imagens
sem body físico, collider ou callback de gameplay.

## Registry e resolução

`StageVisualRegistry` sempre contém o pacote legado. Recursos de cada
`ChapterManifest` são registrados antes da resolução de uma fase. O registry:

1. rejeita IDs duplicados e referências desconhecidas;
2. resolve tema, tileset, texturas e decorações;
3. exige todos os slots lógicos do tileset;
4. valida versões e valores de apresentação;
5. devolve dados congelados e diagnósticos determinísticos.

O `StageLoader` inclui `ResolvedStagePresentation` em `LoadedStage`. Uma
referência visual inválida retorna falha tipada e nenhum stage parcial. A
disponibilidade declarativa da textura é verificada no loader; a existência
real no `TextureManager` é verificada pelo renderer antes de criar imagens.

Não há fallback silencioso para um tema explicitamente declarado. O único
fallback é o contrato de compatibilidade para manifests que não possuem
`presentation`.

## Renderer Phaser

`StageMapRenderer` recebe `LevelDefinition`, apresentação resolvida, grupo
estático de colisão já pertencente à cena e a política de revelar a saída
legada. Ele:

- cria o piso base e overlays com as texturas resolvidas;
- mantém exatamente os mesmos tiles sólidos (`wall`, `pillar`, `water`);
- mantém lava apenas visual, como no comportamento anterior;
- devolve os mesmos pontos de saída pendentes;
- escolhe variantes por hash estável de tema, tile e coordenada;
- cria decorações puramente visuais com layer/depth/escala/rotação/tint;
- falha antes da criação quando uma `textureKey` não existe.

`GameScene` apenas seleciona a apresentação do `LoadedStage` ou o default
legado, delega a construção e mantém o ciclo de destruição existente. A cena
não contém condições específicas do Igapó.

## Demonstração

O Igapó das Memórias declara `theme.aguas.igapo` e
`tileset.aguas.igapo-technical`. O tema reutiliza as texturas técnicas já
geradas pelo jogo e aplica paleta verde/azul escura. Suas três decorações
existentes são mapeadas para recursos visuais provisórios.

O tema é deliberadamente técnico: comprova independência visual sem declarar
arte final nem adicionar sprites externos sem licença. Uma fase sem
`presentation`, com a mesma matriz lógica, continua usando o tema legado e
produz geometria idêntica com recursos visuais diferentes.

## Procedural, saves e campanha

O tema não entra na semente e não altera o `LevelDefinition` gerado. Uma fase
procedural pode declarar `presentation` no manifesto e aplicar o tema ao mapa
resolvido sem tocar no pipeline procedural. Saves continuam identificados por
capítulo, fase e revisões existentes; a apresentação é re-resolvida a partir do
manifesto, não persistida como segunda fonte de verdade.

`PhysicalExitResolver`, `CampaignExitBinder`, navegação e colisões continuam
consumindo exclusivamente o mapa lógico.

## World Lab

O `WorldLabStageView` expõe, de forma aditiva:

- `themeId` e `tilesetId` resolvidos;
- IDs/texturas efetivamente resolvidos;
- decorações e seus metadados visuais;
- diagnósticos visuais do loader.

O mapa SVG lógico permanece autoritativo. O inspector mostra a identidade
visual e os recursos sem tentar reproduzir o pipeline completo do Phaser.
Snapshots v1 antigos continuam aceitos porque os novos campos são opcionais.

## Capabilities

Após integração e testes reais, passam a `supported`:

- `theme.legacy.default`;
- `theme.aguas.igapo`;
- `tile.custom-tileset`;
- `effect.level-decoration`.

Os temas históricos de `LevelDefinition`, `audio.level-music`,
`lighting.level-ambience` e apresentação de entidades permanecem `planned`.

## Critérios observáveis

1. Fase sem apresentação resolve o tema legado e mantém aparência anterior.
2. Igapó resolve tema e tileset próprios sem branches na `GameScene`.
3. Tema, tileset ou textura desconhecidos impedem o load com diagnóstico.
4. Renderer usa efetivamente texturas, tint, variantes e decorações resolvidas.
5. Decoração fora do mapa falha antes de renderizar.
6. Camada e profundidade são aplicadas sem criar colisão.
7. Dois temas sobre o mesmo mapa preservam matriz, sólidos, passabilidade e
   saídas.
8. Fase procedural com tema customizado mantém resultado determinístico.
9. World Lab expõe tema, tileset, recursos e decorações.
10. Saves, campanha, conteúdos legados e testes 9.4–9.5 não regridem.

## Limitações e 9.5B.2

Esta etapa não implementa download de assets, plugins, shaders, áudio por fase,
iluminação, névoa ou sprites de entidades. Novas texturas de arquivo precisam
ser carregadas pelo pipeline de assets do projeto; o contrato e o renderer já
separam seus IDs da semântica do mapa, mas carregamento remoto continua fora de
escopo. A arte do Igapó permanece provisória.

## Validação final

- testes específicos de apresentação e renderer;
- testes de loader, validator, procedural, campanha, saídas e World Lab;
- `npm test -- --runInBand`;
- `npm run typecheck`;
- `npm run build`;
- `npm run check:gates`;
- `git diff --check`.
