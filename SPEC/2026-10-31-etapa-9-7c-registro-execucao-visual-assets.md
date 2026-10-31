# Etapa 9.7C — Registro, execução visual e integração de assets reais

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.7B. Não cria outro framework de capítulos,
outro registry visual, outro renderer, outro formato de manifesto ou outro
sistema de assets. Não altera geração procedural, composição de campanhas,
narrativa, combate, IA, colisões ou saves.

## Objetivo

Fechar dois fluxos complementares:

1. Um capítulo gerado pela CLI pode ser descoberto por um bootstrap de
   desenvolvimento, registrado em um `StageRegistry` isolado, carregado pelo
   `StageLoader` e jogado na `GameScene` sem editar o catálogo de produção nem o
   motor.
2. O Igapó das Memórias passa a usar arte real CC0 dos pacotes Puny World e
   Puny Characters, com duas apresentações visuais distintas sobre exatamente o
   mesmo mapa lógico.

## Decisões arquiteturais

### Variantes de apresentação

`StageManifest` ganha o campo opcional
`presentationVariants?: Readonly<Record<string, StagePresentationDefinition>>`.
O campo `presentation` continua sendo a apresentação padrão. A variante é uma
seleção de apresentação, não uma segunda fase:

- `StageLoadRequest` ganha `presentationVariantId?: string`;
- `LoadedStage` ganha `presentationVariantId?: string`;
- uma variante desconhecida falha com diagnóstico tipado;
- sem variante explícita, o comportamento é idêntico ao anterior;
- variantes não entram em identidade de save, seed, composição ou narrativa.

A seleção é feita somente por bootstrap de desenvolvimento e CLI. O menu de
produção continua sem seletor de aparência.

### Frames e spritesheets

Os contratos visuais passam a aceitar frames declarativos:

- `StageVisualTextureDefinition` aceita `frameWidth`, `frameHeight` e
  `frameCount` opcionais, apenas como metadados de validação/inspeção;
- `StageTileVisualVariant`, `StageDecorationVisualDefinition` e
  `StageSpriteDefinition` aceitam `frame?: number`;
- `ResolvedStageTexture`, `ResolvedStageDecorationVisual` e
  `ResolvedStageSprite` propagam os mesmos dados.

O renderer usa o frame resolvido ao criar imagens/sprite estático. Um frame
declarado fora do spritesheet falha antes da criação visual. O `TextureManager`
continua sendo a única fonte de existência real do recurso.

### Decorações por tema

`StageVisualThemeDefinition` ganha
`decorationOverrides?: Readonly<Record<string, string>>`. O `type` da decoração
no `LevelDefinition` continua sendo a identidade lógica estável; o tema pode
mapeá-lo para outro recurso decorativo. Isso permite que A e B usem arte
diferente sem duplicar o mapa, as posições ou o `LevelDefinition`.

### Assets e escala

O mapa lógico continua em tiles de 32 px. Tiles de 16 px são exibidos em
32×32 pelo renderer, sem alterar `tileMap`, colisão, transitabilidade ou
spawns. Sprites de personagem em canvas 32×32 são carregados como spritesheets.
Os sprites de inimigo derivados mantêm o contrato 128×114 já consumido pelas
classes existentes, preservando body, offset, atributos e IA.

Nenhum asset é carregado remotamente. O preload local da `BootScene` é o único
pipeline; não há novo asset manager.

## Registro de capítulos da CLI

Capítulos continuam em `src/examples/chapters/<slug>/`. O bootstrap de
desenvolvimento usa `import.meta.glob` do Vite, restrito ao diretório canônico
de autoria. Isso:

- não aceita caminho arbitrário, URL ou código remoto;
- não edita `CAMPAIGN_CHAPTER_CATALOG`;
- não inclui capítulos gerados no bundle de produção;
- reutiliza `registerCampaignChapters`, `StageRegistry`,
  `StageCatalogService`, `StageLoader` e `GameSessionService`;
- inicia uma sessão individual sem storage de campanha.

A promoção para `src/stages/chapters/` continua sendo uma operação explícita
futura. O gate de capítulos só permite imports do próprio capítulo,
`src/stages/contracts/` e `src/narrative/contracts/`; o template usa os índices
públicos e um registro local. Não há descoberta automática de código arbitrário.

## Preview visual

A `BootScene` reconhece, apenas em host de desenvolvimento:

- `?stagePreview=<stageId>&presentationVariant=<variantId>`;
- `?chapterPreview=<slug>`.

O primeiro usa o catálogo de produção em um registry novo; o segundo usa o
capítulo gerado em um registry isolado. Ambos usam
`GameSessionService.startIndividualStage`, passam `individualRuntime` para a
`GameScene` e não gravam save de campanha.

No modo individual, `advanceToNextLevel` usa o primeiro exit declarado pelo
manifesto carregado em vez do id sintético `legacy.next`. Fases legadas sem
manifesto modular mantêm `legacy.next`. A mudança é genérica e necessária para
que um capítulo autoral conclua a fase e retorne ao menu.

`npm run chapter -- preview <slug> --visual` valida o capítulo, exige que ele
esteja no diretório canônico descoberto pelo Vite e imprime a URL de preview.
Sem `--visual`, o comando mantém o comportamento headless da 9.7B.

## Apresentações do Igapó

O capítulo `chapter.aguas` declara um conjunto único de `visualResources` e
duas variantes:

- `variant.aguas.igapo-ribeirinho` — apresentação padrão, vegetação clara,
  grama/terra, água natural, árvores e palmeiras;
- `variant.aguas.igapo-sombrio` — terra escurecida, pedra/raízes, água
  verde-azulada, névoa mais forte e decoração diferente.

As duas variantes:

- usam o mesmo `StageModule`, seed, `tileMap`, encontros, NPC, diálogos,
  missões, saídas e condições;
- não alteram colisões nem hitboxes;
- resolvem recursos determinísticos por hash de tema/tile/coordenada;
- não persistem a escolha em save.

## Assets autorizados

Pacotes CC0 de Shade:

- Puny World — `https://opengameart.org/content/16x16-puny-world-tileset`;
- Puny Characters — `https://opengameart.org/content/puny-characters`.

Arquivos incorporados: um tileset 16×16, um NPC 32×32 e duas folhas de
personagem 32×32. Duas folhas derivadas 128×114 são geradas para preservar o
contrato das classes de inimigo. Puny Dungeon não é incorporado nesta etapa
porque o conjunto World/Characters já cobre a demonstração sem aumentar o
escopo.

A procedência, licença, hashes SHA-256, dimensões, frames e modificações ficam
em `src/assets/puny/README.md`.

O gate de rastreabilidade aceita fences de três ou mais backticks (ou til),
permitindo copiar integralmente um prompt que já contenha blocos de código sem
truncar o transcript.

## World Lab

A projeção visual passa a expor, de forma aditiva:

- variante de apresentação selecionada;
- IDs, chaves, frames e metadados de spritesheets;
- decorações resolvidas com frame;
- origem/licença dos assets Puny;
- diagnósticos visuais já existentes.

A UI do World Lab aceita `?presentationVariant=<variantId>` e mostra a variante
selecionada. A alternância interativa entre A e B fica disponível por recarga
com o parâmetro, sem reconstruir o World Lab nem adicionar um editor.

## Critérios observáveis

1. Um capítulo criado pela CLI é descoberto no bootstrap de desenvolvimento,
   registrado isoladamente, validado, carregado e iniciado no modo individual.
2. O catálogo de produção permanece idêntico.
3. Nenhum arquivo de `GameScene` contém condição por `stageId` do Igapó ou de
   capítulos gerados.
4. O preview visual falha de forma tipada para capítulo ausente, diretório fora
   do padrão ou variante desconhecida.
5. Os assets Puny existem localmente, têm licença/procedência documentadas e
   frames declarados dentro dos limites.
6. O Igapó renderiza tiles, água, vegetação, NPC e inimigos com arte real.
7. A e B resolvem o mesmo `tileMap`, sólidos, passabilidade, spawns, encontros e
   saídas; apenas a apresentação muda.
8. A escolha A/B é determinística e não usa `Math.random()`.
9. Sprites e animações resolvidos existem no `TextureManager`/`AnimationManager`
   antes da criação.
10. Recursos ausentes produzem erro tipado, sem fallback silencioso para uma
    apresentação explícita.
11. O World Lab mostra tema, variante, tileset, frames, spritesheets, origens e
    diagnósticos.
12. Testes, typecheck, build, gates documentais e `git diff --check` passam.
13. A homologação visual no navegador é registrada apenas se realmente
    executada.

## Testes previstos

- `chapterPreview.test.ts`: descoberta/registro isolado, sessão individual,
  variante, ausência do catálogo de produção, diagnóstico de capítulo inválido.
- `punyAssets.test.ts`: arquivos locais, hashes, dimensões, frames declarados,
  licença/procedência, chaves únicas.
- `igapoPresentations.test.ts`: A/B sobre o mesmo mapa, colisões, spawns,
  saídas, encontros, determinismo e diferenças visuais reais.
- atualização de `stageVisualPresentation`, `stageEntityPresentation`,
  `stageAmbientPresentation`, `igapoDasMemorias`, `chapterCli`, `worldLab` e
  testes de renderer para frames/tamanhos.
- opcional: teste Phaser headless do pipeline de preload e do renderer.

## Limitações

- não há editor visual, marketplace, carregamento remoto ou sandbox de plugins;
- a promoção para `src/stages/chapters/` continua manual;
- a seleção A/B não aparece no menu de produção;
- a homologação visual depende de navegador disponível; se não houver, o
  relatório registra a pendência e não a substitui por testes headless.
