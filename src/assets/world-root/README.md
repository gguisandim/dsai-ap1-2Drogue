# Raiz do Mundo — assets originais

## `world-root-sanctuary.png`

- Origem: imagem original gerada especificamente para o Umbra Trail com a
  ferramenta integrada de geração de imagens do Codex em 2026-10-31.
- Autor/provedor: OpenAI ImageGen, sob direção do projeto.
- Asset externo/licença de terceiro: nenhum.
- Uso no projeto: decoração monumental do santuário; o arquivo não define
  colisão e não é carregado remotamente.
- Dimensões: 1254×1254, PNG RGBA transparente.
- SHA-256:
  `ae7be11f376d1e2060e7437765b6db029726572ab470840f4b42e49f69fba502`.
- Modificações após geração: nenhuma alteração de pixels; somente cópia para o
  diretório versionado do projeto.

Prompt final usado na geração:

```text
Use case: stylized-concept
Asset type: transparent 2D game environment decoration for a top-down action RPG
Primary request: create one original monumental Amazonian world-tree sanctuary centerpiece, combining an enormous ancient kapok/ceiba-like tree, broad buttress roots embracing broken stone ruins, and a circular ritual stone altar at the base
Scene/backdrop: isolated cutout only, genuinely transparent background
Subject: colossal tree canopy and trunk dominating the upper composition; readable circular altar in the lower center; roots framing a clear passage toward the altar; subtle carved ancestral geometric motifs on stone, small cyan and amber bioluminescent fungi and crystals
Style/medium: professional hand-crafted 2D pixel art, crisp deliberate pixels, 16-bit/32-bit era RPG quality with modern lighting, top-down three-quarter game perspective, cohesive with 32 px tile gameplay
Composition/framing: centered vertical composition, approximately square canvas, full object visible, strong silhouette, altar and root openings readable at gameplay scale
Lighting/mood: humid emerald forest shade, soft cyan spirit glow and restrained warm altar highlights, mysterious sacred atmosphere
Color palette: deep rainforest greens, teal shadows, mossy gray stone, bark brown, muted cyan and amber accents
Materials/textures: chunky bark, moss, wet stone, roots, vines, leaves, glowing fungi
Constraints: no characters, no enemies, no UI, no text, no logo, no watermark, no opaque background, no bloom washout; do not depict a small tree simply enlarged; preserve crisp pixel-art edges and transparent alpha around the entire silhouette
Avoid: photorealism, painterly blur, smooth vector look, isometric building grid, generic fantasy oak, excessive neon, fog covering the altar
```

## `world-root-ground.svg`

- Origem: arte pixel-art original escrita como SVG no repositório para o
  refinamento da Fase 1 em 2026-11-06.
- Autor/provedor: autoria original do projeto.
- Asset externo/licença de terceiro: nenhum.
- Uso no projeto: atlas de quatro tiles de musgo, folhiço e terra úmida;
  aplicado somente como superfície visual caminhável.
- Dimensões: 128×32 px, quatro quadros de 32×32 px.
- Técnica: formas retangulares alinhadas à grade de pixels, paleta compartilhada
  e bordas-base idênticas para evitar emendas visíveis entre quadros.
- Modificações após autoria: nenhuma.
- SHA-256:
  `f15470a79c865fa05e659c177053f70d4af2046c28f76b9bde35cfa18f00c66e`.

## `world-root-stone.svg` e `world-root-canopy.svg`

- Origem: arte pixel-art original escrita como SVG no repositório para a
  revisão de 2026-11-06.
- Autor/provedor: autoria original do projeto.
- Asset externo/licença de terceiro: nenhum.
- Uso no projeto: `world-root-stone.svg` (32×32) substitui o marcador de ruína
  e pilar; `world-root-canopy.svg` (32×32) substitui a parede de árvores
  repetidas. Ambos são apenas visuais; a colisão continua vindo do mapa lógico.
- Técnica: retângulos alinhados à grade de pixels, paleta de sub-bosque escuro
  compartilhada com o piso e bordas que não expõem emenda entre tiles.
- Modificações após autoria: nenhuma.
- SHA-256:
  `1dcf6d61dd1f275d16cc0bfaff82b2c9d6a35c9705daf44ea0699bd957c5f03e`
  (`world-root-stone.svg`) e
  `43b2518536715ce1f0c9e90e04299df69ad7b57ee0810f594960d4d03eefefec`
  (`world-root-canopy.svg`).

## Composições ambientais de 2026-11-06

Os quatro arquivos abaixo são artes originais geradas especificamente para a
revisão estrutural da Floresta das Raízes com a ferramenta integrada de geração
de imagens do Codex. São PNG RGBA de 1536×1024 px com fundo transparente,
carregados como imagens decorativas sem participação na colisão. Nenhum asset de
terceiro foi usado e os pixels foram copiados sem modificações para o pipeline.

| Arquivo | Uso | SHA-256 |
|---|---|---|
| `world-root-trail-composition.png` | solo contínuo, trilha e massas laterais do piloto de travessia | `39c429d8bb2c4195a26caeddd38cfc7b8b8bd03ed4d2d338d8b7611edd8d35c0` |
| `world-root-sanctuary-approach.png` | clareira e funil visual do piloto de aproximação | `35860466c62082d808cd287df04d452404fe0c823295418de2fad433c89a305f` |
| `world-root-stream.png` | superfície e margens orgânicas dos cursos d’água | `9889691844ebec90a3e7f3ac8035b77526cf2c9f2717cdf27eb35091253edf6e` |
| `world-root-grove.png` | bosques de grande porte em planos de terreno e primeiro plano | `4a4775ab7bce8f8b9ffe77d7402f5df071b1e26af6135da2365a21f6b79593e0` |
| `world-root-entrance.png` | composição de entrada: clareira com árvore e trilha que abre a fase | `c469761839827f4d59b81e31f8afd311c8ed80584b65301444143be32fba9ac3` |
| `world-root-passage.png` | composição de saída: ruínas, igarapé e túnel de raízes luminoso | `2d5f54880b26c1ea6e9bbbfe981825fe3862354c484b4606e81c428c8bcd63a6` |

As duas últimas composições foram entregues pelo autor como anexos da revisão
de 2026-11-06, produzidas no mesmo lote e com a mesma direção de arte das
demais. O prompt exato dessas duas não foi registrado; a única modificação foi
a cópia do arquivo recebido para o diretório versionado.

Prompts finais usados na geração:

### Trilha

```text
Use case: stylized-concept
Asset type: transparent, wide 2D environment composition for a top-down action RPG; final project asset
Primary request: create one original large forest-floor and trail composition for the “Floresta das Raízes”, designed to replace visible square tiles across a representative gameplay screen
Scene/backdrop: genuinely transparent background; isolated environmental composition only
Subject: a broad organic earthen trail crossing the composition from left to right with gentle curves and irregular width; layered forest floor made of humid dark soil, moss carpets, leaf litter, shallow exposed roots, scattered flat stones, small fern islands and subtle muddy footprints; dense but deliberate vegetation masses frame the upper and lower edges while leaving a wide, clearly walkable central corridor
Style/medium: professional hand-crafted 2D pixel art, crisp deliberate pixels, 16-bit/32-bit era RPG quality with modern lighting, top-down three-quarter perspective, matching a high-quality monumental world-tree sanctuary
Composition/framing: wide landscape composition, approximately 3:2; full cutout visible; central trail must remain open for player movement; details occur in continuous patches much larger than a 32px tile; asymmetric clusters and negative space; no rectangular perimeter
Lighting/mood: humid emerald shade, soft dappled canopy light, restrained cyan ambient bounce, mysterious but readable
Color palette: deep rainforest greens, earthy umber, moss olive, muted teal shadows, warm dead leaves
Materials/textures: wet soil, leaf litter, moss, bark, roots, stone, ferns
Constraints: transparent alpha around the irregular silhouette; no characters, enemies, buildings, UI, text, logo, watermark; no visible square tile grid; no isolated repeated sprite dots; no hard rectangular edges; keep central corridor readable
Avoid: photorealism, painterly blur, smooth vector look, isometric grid, generic lawn, evenly scattered objects, wall of identical trees, neon oversaturation
```

### Aproximação do santuário

```text
Use case: stylized-concept
Asset type: transparent, wide 2D environment composition for a top-down action RPG; final project asset
Primary request: create one original sacred-forest approach composition that visually prepares the player for a monumental world-tree sanctuary without depicting the sanctuary itself
Scene/backdrop: genuinely transparent background; isolated environmental composition only
Subject: a broad ceremonial forest clearing with an organic earthen approach entering from the left and opening toward an empty focal space at center-right; enormous buttress roots, moss-covered broken stone markers, broad-leaf plants, tall ferns, hanging vines, cyan bioluminescent fungi and restrained amber flowers frame the approach; layered canopy masses along upper and lower edges create depth while the middle remains open and walkable
Style/medium: professional hand-crafted 2D pixel art, crisp deliberate pixels, 16-bit/32-bit era RPG quality with modern lighting, top-down three-quarter perspective, same production quality as a monumental world-tree sanctuary
Composition/framing: wide landscape composition, approximately 3:2; full irregular cutout visible; strong visual funnel toward the empty sanctuary focal area; asymmetric clusters; several vegetation sizes; no rectangular perimeter; no large central tree or altar
Lighting/mood: humid sacred twilight, subtle cyan spirit glow and warm reflected altar light arriving from the empty focal space
Color palette: deep emerald and teal shadows, bark brown, mossy stone, muted cyan and amber accents
Materials/textures: wet earth, moss, leaf litter, huge roots, old stone, ferns, vines, luminous fungi
Constraints: transparent alpha around the irregular silhouette; no characters, enemies, sanctuary, altar, buildings, UI, text, logo, watermark; no visible square tile grid; no repeated tiny sprites; preserve a wide readable corridor and empty focal space for another asset
Avoid: photorealism, painterly blur, smooth vector look, isometric grid, wall of identical trees, random scatter, neon oversaturation, opaque rectangular background
```

### Curso d’água

```text
Use case: stylized-concept
Asset type: transparent, wide 2D environment overlay for a top-down action RPG; final project asset
Primary request: create one original winding rainforest stream composition with organic banks that can visually cover a blocky logical water channel while leaving collision unchanged
Scene/backdrop: genuinely transparent background; isolated stream and bank composition only
Subject: a shallow dark-teal stream meanders horizontally from left to right in a gentle S curve; irregular muddy banks blend into moss, wet leaves and pebbles; exposed roots cross and grip the edges; clusters of ferns, broad leaves, reeds and a few fallen branches frame the water; broken reflections and small ripples make the surface lively
Style/medium: professional hand-crafted 2D pixel art, crisp deliberate pixels, 16-bit/32-bit era RPG quality with modern lighting, top-down three-quarter perspective, cohesive with a monumental sacred world-tree environment
Composition/framing: wide landscape composition, approximately 3:2; full irregular cutout visible; stream occupies the middle third with varying width; banks are continuous and non-orthogonal; vegetation clusters are asymmetric and use several sizes; no rectangular perimeter
Lighting/mood: humid forest shade with subtle cyan reflections and warm leaf accents
Color palette: deep teal water, umber mud, moss green, muted cyan highlights, brown roots
Materials/textures: shallow water, wet soil, stones, leaf litter, roots, ferns, reeds
Constraints: transparent alpha around the entire irregular silhouette; no characters, enemies, bridge, buildings, UI, text, logo, watermark; no visible square tile grid; no stepped or rectangular shore; no isolated repeated sprite dots
Avoid: photorealism, painterly blur, smooth vector look, isometric grid, bright tropical-blue water, evenly scattered plants, opaque rectangular background
```

### Bosque

```text
Use case: stylized-concept
Asset type: transparent 2D vegetation cluster for a top-down action RPG; final project asset
Primary request: create one original large rainforest grove cluster that replaces a wall of repeated tree tiles
Scene/backdrop: genuinely transparent background; isolated vegetation cluster only
Subject: five to seven intertwined Amazonian forest trees of clearly different heights and trunk widths, with broad overlapping canopies, buttress roots, palms, hanging vines, epiphytes and deep openings between trunks; the cluster must read as one intentional natural mass with a strong irregular silhouette
Style/medium: professional hand-crafted 2D pixel art, crisp deliberate pixels, 16-bit/32-bit era RPG quality with modern lighting, top-down three-quarter perspective, matching a high-quality monumental world-tree sanctuary
Composition/framing: wide landscape cluster, approximately 3:2; full cutout visible; canopy forms overlap across multiple depth planes; trunks remain partly visible; asymmetrical outline; no flat baseline and no rectangular perimeter
Lighting/mood: humid emerald shade with dappled light, deep teal interior shadows and restrained warm leaf accents
Color palette: varied forest greens, teal shadows, moss olive, bark brown
Materials/textures: layered leaves, rough bark, moss, vines, roots, epiphytes
Constraints: transparent alpha around the entire silhouette and through meaningful gaps; no ground plane, characters, enemies, buildings, UI, text, logo or watermark; no repeated identical trees; no tile grid; suitable for placing behind or in front of gameplay actors
Avoid: photorealism, painterly blur, smooth vector look, symmetrical hedge, conifer wall, evenly spaced trunks, opaque rectangular background
```
