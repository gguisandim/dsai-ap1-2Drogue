# Autoria de capítulos, preview visual e assets

Este guia documenta o fluxo operacional da Etapa 9.7C. Ele complementa a SPEC
`SPEC/2026-10-31-etapa-9-7c-registro-execucao-visual-assets.md` e não substitui
os contratos públicos em `src/stages/contracts/`.

## 1. Fluxo de registro de capítulos

Capítulos criados pela CLI ficam em:

```text
src/examples/chapters/<slug>/
```

O catálogo de produção `CAMPAIGN_CHAPTER_CATALOG` não é alterado. O bootstrap
de desenvolvimento descobre somente esse diretório com `import.meta.glob` do
Vite. O caminho não é configurável por query nem aceita módulos remotos.

```sh
npm run chapter -- create minha-fase --title "Minha Fase"
npm run chapter -- validate minha-fase
npm run chapter -- inspect minha-fase
```

O capítulo é registrado em um `StageRegistry` isolado com
`registerCampaignChapters`, validado por `StageValidator`, classificado por
`StageCatalogService` e carregado por `StageLoader`. A promoção para
`src/stages/chapters/` continua manual porque o gate de capítulos só permite
imports do próprio capítulo, de `src/stages/contracts/` e de
`src/narrative/contracts/`.

## 2. Preview visual real

```sh
npm run chapter -- preview minha-fase --visual
npm run dev
```

Abra a URL impressa:

```text
http://localhost:5173/?chapterPreview=minha-fase
```

A `BootScene`, em host de desenvolvimento, carrega o módulo local, cria um
`StageRegistry` isolado, inicia `GameSessionService.startIndividualStage` e
passa `individualRuntime` para a `GameScene`. Não há save de campanha nem
alteração do catálogo de produção. Em produção o código de preview é removido
do bundle.

O capítulo de homologação gerado pela CLI está em
`src/examples/chapters/homologacao-9-7c/`. Ele não é importado pelo entry point
de produção.

## 3. Apresentações A e B do Igapó

O mesmo `StageModule` declara `presentation` (A, ribeirinho) e
`presentationVariants` (B, sombrio). As variantes não alteram seed, mapa,
colisões, encontros, NPCs, diálogos, missões ou saídas.

Entre no jogo:

```text
?stagePreview=stage.aguas.igapo-das-memorias&presentationVariant=variant.aguas.igapo-ribeirinho
?stagePreview=stage.aguas.igapo-das-memorias&presentationVariant=variant.aguas.igapo-sombrio
```

No World Lab:

```text
http://localhost:5173/world-lab.html?stage=stage.aguas.igapo-das-memorias&presentationVariant=variant.aguas.igapo-sombrio
```

A interface em português brasileiro separa três áreas de trabalho:

- **Campanha** mantém o grafo procedural ou a campanha completa como foco;
- **Fases** dedica a área central à prévia Phaser real ou ao mapa estrutural;
- **Comparação** mostra duas variantes com viewport, zoom e câmera inicial
  equivalentes.

O seletor **Variante** alterna A e B. **Fase**, **Zoom**, **Grade**,
**Entidades**, **Decorações** e **Saídas** controlam somente a inspeção. O
explorador e o inspetor são recolhíveis, e **Maximizar** oculta ambos sem perder
a seleção. Os diagnósticos ficam no painel inferior, com filtros por gravidade
e detalhes técnicos expansíveis.

As URLs anteriores continuam aceitas: `view=visual` abre **Fases**,
`view=compare` abre **Comparação**, e a ausência de `view` abre **Campanha**.
**Capturar** baixa o canvas real de cada prévia e um descritor
`umbra-world-lab-capture/v1` com fase, revisões, variantes, viewport, zoom e
câmera. Aguarde os iframes carregarem antes da captura.

A escolha não entra em save. `StageLoadRequest.presentationVariantId` é
re-resolvido a cada load.

## 4. Pipeline de assets

O pipeline existente foi reutilizado:

1. `src/presentation/assets/punyAssetCatalog.ts` declara IDs, chaves, frames,
   hashes e origem;
2. `src/presentation/assets/bootPunyAssets.ts` faz o preload local na
   `BootScene` e cria as animações;
3. `src/stages/chapters/aguas/igapoVisuals.ts` associa texturas, frames, sprites,
   temas, decorações, áudio e ambientes;
4. `StageVisualRegistry` valida referências e frames declarados;
5. `StageMapRenderer` usa o frame resolvido e amplia tiles 16×16 para 32×32.

Não há asset manager novo, carregamento remoto ou path arbitrário. O
`TextureManager`/`AnimationManager` do Phaser continuam sendo a verificação
final de existência.

### Adicionar um recurso gráfico

1. confirme a licença na página de origem;
2. copie somente o arquivo necessário para `src/assets/puny/`;
3. registre o arquivo, o hash SHA-256, as dimensões, a origem e as modificações
   em `src/assets/puny/README.md`;
4. adicione a textura em `punyAssetCatalog.ts` com `frameWidth`, `frameHeight` e
   `frameCount`;
5. adicione a URL estática em `bootPunyAssets.ts`;
6. referencie a textura/frame no `ChapterVisualResources`;
7. adicione ou atualize o teste em `src/tests/punyAssets.test.ts`.

Registre também, quando conhecidos, `sourceWidth`/`sourceHeight`, região visível,
`pixelArt`, perspectiva e origem. Sprites e decorações podem declarar âncora e
classe de escala; colisão é metadado de inspeção e nunca configura física. As
regras globais e a referência do Igapó estão em [art-direction.md](./art-direction.md).

### Substituir placeholders

Troque apenas `textureKey` e, quando for spritesheet, `frame` no recurso local do
capítulo. Não edite `LevelDefinition.tileMap` para acomodar arte. Uma textura de
água não pode mudar a semântica do tile 3; uma decoração continua sem colisão.

## 5. Validação de spritesheets

- a largura deve ser divisível por `frameWidth`;
- a altura deve ser divisível por `frameHeight`;
- `frameCount` deve ser igual ao produto das divisões;
- todo `frame` usado deve ser menor que `frameCount`;
- use escala nearest-neighbor e preserve transparência;
- sprites de inimigo mantêm 128×114 e a ordem `walk`/`attack`/`hurt` para não
  alterar body, offset, atributos, IA ou hitbox.

Comandos:

```sh
npm test -- --runInBand src/tests/punyAssets.test.ts
npm test -- --runInBand src/tests/igapoPresentations.test.ts
```

## 6. Homologação no navegador

Procedimento manual:

1. `npm run dev`;
2. abra as URLs A e B com a mesma resolução e a mesma posição de câmera;
3. confira terreno, água, vegetação, NPC, inimigos, animações e camadas;
4. interaja com o NPC e conclua o encontro;
5. use a saída e confirme o retorno ao menu;
6. abra o capítulo gerado com `?chapterPreview=homologacao-9-7c`;
7. execute diálogo, missão, encontro, recompensa e saída;
8. abra o World Lab e alterne a variante.

A homologação da 9.7C foi executada com Edge headless via CDP na resolução
1280×720. Evidências em `.tmp/evidence/` (temporárias, não versionadas):

- `97c-igapo-a.png` e `97c-igapo-b.png` — mesmo mapa e câmera;
- `97c-chapter-initial.png`, `97c-chapter-dialogue.png`,
  `97c-chapter-encounter.png`, `97c-chapter-return.png`;
- `97c-stage-a-near-exit.png`;
- `97c-world-lab-a.png` e `97c-world-lab-b.png`.

O combate do capítulo e do Igapó foi acelerado no navegador chamando
`takeDamage` nas instâncias já existentes; os sinais, a missão, a recompensa e a
saída percorreram o caminho real do runtime.

## 7. Limitações e preparação para a 10.0

- a promoção de `src/examples/chapters/` para `src/stages/chapters/` é manual;
- não há editor visual, marketplace, descoberta dinâmica arbitrária ou
  carregamento remoto;
- a seleção A/B é de desenvolvimento/World Lab, não do menu de produção;
- o foco do World Lab substitui o `stageId` de um nó de fixture para inspeção;
  ele não é um save nem um grafo de produção;
- a 10.0 pode transformar a promoção em operação explícita de CLI e ampliar o
  catálogo, mantendo os mesmos contratos e gates.
