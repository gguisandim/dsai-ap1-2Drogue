# Puny assets — procedência e licença

Esta pasta contém somente os arquivos necessários para a apresentação visual do
Igapó das Memórias. Os pacotes completos **não** foram copiados para o
repositório.

## Pacotes de origem

| Pacote | Autor | Licença | Fonte |
|---|---|---|---|
| Puny World (16×16) | Shade | CC0 | https://opengameart.org/content/16x16-puny-world-tileset |
| Puny Characters — edição gratuita | Shade | CC0 | https://opengameart.org/content/puny-characters |

As páginas do OpenGameArt foram consultadas em **2026-10-31** e declaram
`Author: Shade` e `License(s): CC0`. A versão paga Editor Edition de Puny
Characters **não** foi usada. Puny Dungeon não foi incorporado nesta etapa: o
conjunto World/Characters cobre o mapa, a vegetação, o NPC e os inimigos sem
aumentar o escopo.

## Arquivos incorporados

| Arquivo | Origem | Dimensões | SHA-256 |
|---|---|---|---|
| `puny-world-tiles.png` | `punyworld-overworld-tileset_0.png` | 432×1040 | `14d285bde8dee96cb0113947c8cce4922b86bf1d033b19123112145c7cef3a38` |
| `puny-mage-cyan.png` | `Puny-Characters/Mage-Cyan.png` | 768×256 | `bd43df96cef751f76252723bfa5a6095d68e982cba59260aec7f4fbfedf7ec3f` |
| `puny-warrior-red.png` | `Puny-Characters/Warrior-Red.png` | 768×256 | `c60c80dcad811b3ef0e0e8e1fa5f0d62e011b3e604f2bb2a78261f2dcae6c712` |
| `puny-archer-purple.png` | `Puny-Characters/Archer-Purple.png` | 768×256 | `788d53de100aceb025621ae4fc95a61a6cd08168205185871a6442ab7b131d26` |

Os arquivos de origem acima foram copiados sem alteração de pixels.

## Arquivos derivados

| Arquivo | Origem | Dimensões | SHA-256 |
|---|---|---|---|
| `puny-warrior-red-128.png` | `puny-warrior-red.png` | 512×342 | `dd059ea7631c85590447ff0e6335a0ca7a941e2deab221e0a03ca1dd453acc43` |
| `puny-archer-purple-128.png` | `puny-archer-purple.png` | 512×342 | `41b682336ef3484240640d328656a5f192c60e4dd636fbeb9577a173fbbf8c0b` |

Transformações aplicadas a cada folha derivada:

1. seleção dos frames frontais das linhas `walk`, `attack` (espada para o
   guerreiro, arco para o arqueiro) e `hurt`;
2. repetição do ciclo de três frames como `0,1,2,1` para preencher o contrato
   existente de quatro frames por animação;
3. recorte pelo canal alfa e escala nearest-neighbor para caber em 128×114;
4. composição em uma folha 4×3 de 128×114, com transparência preservada.

O canvas 128×114 e a ordem `walk`/`attack`/`hurt` são os mesmos já consumidos
por `Enemy`, `RangedEnemy` e `BossEnemy`, portanto body, offset, atributos e IA
não mudam.

## Frames usados

### Puny World

A folha tem 27 colunas × 65 linhas de 16×16 (1755 frames). O código usa
`frameWidth: 16`, `frameHeight: 16` e seleciona frames por índice estável:

- grama: 0, 1, 27, 54;
- terra: 7, 34, 40;
- copa de árvore: 190, 191, 204;
- árvore isolada: 197, 206, 224;
- água: 293, 294, 295;
- pedra: 109, 110, 122;
- tronco/toco: 730, 757, 758;
- vegetação: 704, 705;
- arco de saída: 714;
- caixote: 815.

### Puny Characters

A folha tem 24 colunas × 8 linhas de 32×32. As linhas são, nesta ordem:
idle, walk, sword attack, bow attack, stave attack, throw, hurt, death. Cada
linha contém oito direções com três frames por direção. O NPC usa o frame 0–2
da linha idle. As folhas derivadas usam a direção frontal.

## Uso no projeto

- `src/presentation/assets/punyAssetCatalog.ts` registra IDs, chaves, frames,
  hashes e origem;
- `src/presentation/assets/bootPunyAssets.ts` faz o preload local e cria as
  animações;
- `src/stages/chapters/aguas/igapoVisuals.ts` associa frames e sprites às duas
  apresentações do Igapó.

Nenhum arquivo é carregado de URL remota em runtime.
