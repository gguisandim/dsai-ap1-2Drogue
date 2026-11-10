# Assets das Águas

Todos os arquivos abaixo são ilustrações SVG originais escritas no repositório
para o Igapó das Memórias, em pixel art top-down compatível com o tile lógico
de 32 px. Não há fonte de terceiro, dependência remota ou arquivo gerado por
ferramenta externa. `BootScene` os carrega pelo pipeline local do Vite.

## Canoa

`igapo-canoa.svg` é uma ilustração original 48×16 px criada para o mapa do
Igapó. SHA-256:
`79039fb2235a4fcf250e930c396ed990f23ba4b80301cb189ba1c7ef1bff35af`.

## Conjunto ambiental de 2026-11-10

| Arquivo | Dimensões | Uso | SHA-256 |
|---|---|---|---|
| `igapo-forest-floor.svg` | 64×32 | dois pisos contínuos de musgo e lama (32×32) | `ca61b09f7130cd362a2efff7687dda339dccc73f180ddf68fb6a32bb42d927ed` |
| `igapo-emergent-tree.svg` | 96×128 | árvore emersa com raízes tabulares, copa e fungos de memória | `27021d1383881d9b35337a3a0c2e68112379033e9e8fe1d892becd4e76c1c160` |
| `igapo-palm-cluster.svg` | 96×112 | moita de palmeiras de igapó para ilhas e margens | `bc23308c4502370796fb7e094e47933eaf4795bda3a7fb56a3dc8fb48ae7e4cd` |
| `igapo-root-tangle.svg` | 96×64 | massa de raízes expostas sobre terra e margem | `d465b2b8727dc0b437b672d14172f4de52734d916786438a087afd12ad956460` |
| `igapo-submerged-trunk.svg` | 128×64 | tronco caído meio submerso, linha d’água e espuma | `128ab5cf7397bcd87433c2b1d60e33f20ff6791e94c073427f6cdd21471df14e` |
| `igapo-water-lily.svg` | 128×32 | folha de quatro variantes de vitórias-régias (32×32) | `a37be4413b85779fe1219253b17ebbb6b6e8cda1a4b4de0424a159b996d17e8c` |
| `igapo-shore-fringe.svg` | 128×32 | folha de quatro franjas de margem (32×32) | `ca5894c454e965a65c78fe87164ca6c679e77abb032238f0c68a52172d84af21` |
| `igapo-ground-moss.svg` | 128×32 | folha de quatro manchas de musgo/folhiço (32×32) | `a2248997d92ff49a5abfcc559685cf8eec30b6a901fdb01704bb564fcfff7331` |
| `igapo-stilt-hut.svg` | 96×80 | palafita ribeirinha em ruínas com lanterna de memória | `606f18b4105d3c7a48637db0f611a9fbfc6d33b5b76c0660a39fbbf4c0f79f49` |
| `igapo-memory-stela.svg` | 48×80 | estela ritual com glifos ciano e raízes na base | `09b3ab3c42ef093a353845668692ee92f314a537cb0d16fa7e30d5a8003b151b` |
| `igapo-canopy-bough.svg` | 192×64 | galho suspenso de primeiro plano para as bordas do mapa | `f362566b45a040e6dd9fa475231835cc715454fc0ed01000cee805fbb5e90f83` |
| `igapo-light-shaft.svg` | 96×192 | feixe de luz filtrada pelas copas | `afa44e08b7129d25220a7ec42f3cd5e99239b446bea1630935fdb2fb9d5046d5` |
| `igapo-canopy-shadow.svg` | 96×48 | sombra suave de copa projetada no terreno | `187b9d2f7f0c8f093e16fbdf645ca4955bbe2f83379957a8f579053c26c8f7ec` |

### Técnica e integração

- Formas retangulares e poligonais alinhadas à grade de pixels, com
  `shape-rendering="crispEdges"`, paleta compartilhada e transparência real.
- As folhas de quatro quadros usam células de 32×32 px e são registradas com
  `frameWidth`, `frameHeight` e `frameCount`; nenhum quadro invade o vizinho.
- As peças de margem têm o conteúdo na borda superior do quadro; a rotação na
  colocação alinha a franja ao lado da água que toca a terra.
- As silhuetas grandes usam âncora de base (`originY` próximo de 1) para que o
  ponto de contato com o chão permaneça estável.
- Nenhum asset participa de colisão, física, navegação ou persistência. O mapa
  lógico continua sendo a única fonte de verdade para passabilidade.
