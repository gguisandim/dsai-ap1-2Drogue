# Assets de Minas Corrompidas

Todos os recursos deste diretório foram criados para a fase
`stage.corrupted.minas`. Não há biblioteca externa nem asset de terceiro.

## Procedência e licença

- Os SVGs são autoria original do projeto, desenhados como formas vetoriais
  determinísticas. Licença: asset original do projeto.
- `mina-abandoned-panorama.png` e `mina-corrupted-panorama.png` foram
  gerados com a ferramenta integrada OpenAI ImageGen em 2026-11-22, sob direção
  do projeto. Licença/procedência: asset gerado especificamente para o projeto,
  sem material de terceiro declarado.
- Os hashes SHA-256, dimensões, chaves e usos ficam em
  `src/presentation/assets/minasAssetCatalog.ts`.

## Prompts ImageGen

Modo utilizado: ferramenta integrada `image_gen` (não CLI).

### Panorama Abandonado

```text
Panorama lateral muito largo para fundo de RPG 2D no Phaser: mina amazônica
abandonada, rocha úmida monumental, suportes de madeira, trilhos, elevador
enferrujado, aquífero calmo, grandes raízes retomando a caverna, veios estáveis
de arumã âmbar, musgo e fungos discretos. Pintura 2D rica, silhuetas nítidas,
profundidade em camadas, corredor legível no terço inferior, sem personagens,
texto, logos, UI ou marca d'água; não parecer uma caverna marrom genérica.
```

### Panorama Corrompido

```text
Panorama lateral muito largo do núcleo corrompido da mesma mina amazônica:
maquinário fundido a rocha viva, arumã luminoso deformado, raízes mineralizadas
incorporadas a bombas e trilhos, fungos anômalos, esporos, água negra e selo do
Credor rompido. Pintura 2D rica, silhuetas assimétricas e opressivas, corredor
legível no terço inferior, sem personagens, texto, logos, UI ou marca d'água;
evitar caverna genérica de cristais roxos.
```

## Arquivos

| Arquivo | Dimensões | Uso |
|---|---|---|
| `mina-abandoned-panorama.png` | 2172×724 | fundo pictórico da variante Abandonada |
| `mina-corrupted-panorama.png` | 2172×724 | fundo pictórico do núcleo Corrompido |
| `mine-floor-abandoned.svg` | 128×32 (4 frames 32×32) | piso da variante Abandonada |
| `mine-floor-corrupted.svg` | 128×32 (4 frames 32×32) | piso mineralizado da variante Corrompida |
| `mine-timber.svg` | 224×176 | vigas e suportes |
| `mine-timber-corrupted.svg` | 224×176 | vigas incorporadas por raízes minerais |
| `mine-rails.svg` | 256×96 | trilhos e dormentes |
| `mine-roots.svg` | 256×192 | raízes amazônicas |
| `mine-roots-corrupted.svg` | 256×192 | raízes mineralizadas |
| `mine-crystals.svg` | 160×144 | veios estáveis de arumã |
| `mine-crystals-corrupted.svg` | 192×176 | arumã deformado |
| `mine-fungi.svg` | 192×144 | fungos subterrâneos |
| `mine-machinery.svg` | 288×224 | guincho e maquinário |
| `mine-core.svg` | 320×256 | maquinário orgânico-mineral |
| `mine-seal.svg` | 128×128 | selo rompido do Credor |
| `mine-maira.svg` | 64×80 | Maíra, guardiã das galerias |
| `mine-nilo.svg` | 64×80 | vestígio de Nilo |
| `mine-evidence.svg` | 80×80 | memória do aquífero |
| `mine-ledger.svg` | 96×72 | lâmina do livro-caixa |
| `mine-mole.svg` | 80×64 | criatura subterrânea |
| `mine-rootling.svg` | 80×80 | organismo vegetal mineralizado |
| `mine-guardian.svg` | 96×96 | guardião das galerias |
| `mine-heart.svg` | 128×128 | Coração de Lastro |

Os `sha256` de cada arquivo ficam em
`src/presentation/assets/minasAssetCatalog.ts`, verificados por
`src/tests/minasCorrompidas.test.ts`.

## Integração

`src/presentation/assets/bootMinasAssets.ts` pré-carrega todos os arquivos no
`BootScene` e cria as animações mínimas `walk`/`attack`/`hurt` dos sprites
inimigos, todas apontando para o quadro `__BASE` das imagens SVG. Os IDs de
textura, tilesets, decorações, sprites, áudio e ambientes vivem em
`src/stages/chapters/minas-corrompidas/visuals.ts`.

## Uso

Os PNGs e SVGs são somente apresentação. Colisão e navegação permanecem no mapa
lógico autoral. As duas variantes reutilizam a mesma geometria e trocam
tileset, ambiente, efeitos e `decorationOverrides`.

