# Palácio do Credor — assets autorais

Todos os arquivos deste diretório são **arte original do projeto**, produzida
por `scripts/generate-palacio-assets.mjs`. Nenhum arquivo de terceiro é usado e
nenhuma imagem gerada por modelo foi incorporada nesta entrega.

## Procedência

| Campo | Valor |
|---|---|
| Pacote | Palácio do Credor |
| Autor | Autoria original do projeto |
| Licença | asset original do projeto; sem licença de terceiro |
| Gerador | `scripts/generate-palacio-assets.mjs` (determinístico) |
| Comando | `node scripts/generate-palacio-assets.mjs` |

Os SVGs são vetoriais e legíveis; a folha do Credor é um PNG RGBA 512×342
codificado pelo próprio gerador (zlib + CRC32), sem biblioteca externa.

## Arquivos

| Arquivo | Dimensões | Uso |
|---|---|---|
| `palacio-floor-decayed.svg` | 128×32 (4 frames 32×32) | piso da Decadência |
| `palacio-floor-corrupted.svg` | 128×32 (4 frames 32×32) | piso da Corrupção |
| `palacio-gate.svg` | 320×256 | portal monumental |
| `palacio-gate-corrupted.svg` | 320×256 | portal rompido |
| `palacio-tower.svg` | 192×288 | torre de registro |
| `palacio-tower-corrupted.svg` | 192×288 | torre colapsada |
| `palacio-arcade.svg` | 288×176 | arcada |
| `palacio-arcade-corrupted.svg` | 288×176 | arcada deformada |
| `palacio-dais.svg` | 224×160 | estrado da arena |
| `palacio-throne.svg` | 160×224 | trono |
| `palacio-throne-corrupted.svg` | 160×224 | trono de raízes |
| `palacio-chain.svg` | 96×256 | correntes |
| `palacio-sigil.svg` | 96×96 | selo do Credor |
| `palacio-sigil-corrupted.svg` | 96×96 | selo corrompido |
| `palacio-ledger.svg` | 160×112 | livro-raiz |
| `palacio-statue.svg` | 96×176 | estátua de devedor |
| `palacio-banner.svg` | 96×176 | estandarte |
| `palacio-canopy.svg` | 256×160 | copa de fundo |
| `palacio-glass.svg` | 128×192 | vitral |
| `palacio-root-mass.svg` | 224×176 | massa de raízes |
| `palacio-rubble.svg` | 224×176 | escombros |
| `credor-sheet.png` | 512×342 (4×3 frames 128×114) | chefe Credor |

## SHA-256

```text
c9097a9204b080569bee898e752305d9301cda65a30d5b7f70f57bd96dc64a67  palacio-floor-decayed.svg
4e5df5fd248fbd395b975dfa7d1466b860f47eb8f4fdd9b00a23fb3963cdc567  palacio-floor-corrupted.svg
224831cc52f6f795c5a2661828f373f467edc80c374d70aa5c6004c1c44f8e37  palacio-gate.svg
9c260ebb215659ea1ec6ce0a63f5fcfb6e9ed1d3ce4c1f8ae375803cdec387f6  palacio-gate-corrupted.svg
f3b4339dd3ccfd969705f6ae4aa289729f11854ae10a363c33eebd99756bc8fc  palacio-tower.svg
0a2263a2f9c8cf38d8352f2165b2c15dbfefff04477433bf8f4b8f3b2cd086aa  palacio-tower-corrupted.svg
4f98b3d19a0f4a8445c711aca585fb47feff0062590780e6dc033f92bd6b65e4  palacio-arcade.svg
b94666fcd99f6c1e4ca11105eaf785101487b35c5b670ff815f7ac792b37a54a  palacio-arcade-corrupted.svg
a4ef55cef502eeec963727f49ccdb7b12beb854450dc974ba65263360003c2a2  palacio-dais.svg
3b18eb8459c59fc5ed5a52c8c1200f5b01211c9e31aac754429cf5899fdc53d5  palacio-throne.svg
e12dbec78fb3f1fd91572daeca6b776a43cd0c0a267496d7ed83195afd595de0  palacio-throne-corrupted.svg
6426c1d283be446aa7ba086b7a0f2a5331499eccef22ffa76a5598410b916f3f  palacio-chain.svg
1d7609008d12d67614cca733c1a374f2162e5db5788f0fc561bc99f5aee326cf  palacio-sigil.svg
348c2bd9871d5b288cac449f0b1732a9a41376ad08a673527dd5860873842cac  palacio-sigil-corrupted.svg
e244a90a7498dd04b0a671b24af5e5e192d35edcfc1273455468141ea5c80a12  palacio-ledger.svg
625888292d4e5f6587c5ebbc3131f6dc7808164914ac01f8ee0bea0639f8df45  palacio-statue.svg
807a0fe22e0dfdc19fb64a4523506ab621153edd449e9adf0b1a906f50a4aa30  palacio-banner.svg
882d40309387af225180111bfa3107f2c631114550c21bf096629cf80b036221  palacio-canopy.svg
7ff023231105f41f3623b4683258187080c71e006607882823b883150a008a99  palacio-glass.svg
12f0cfe4a40afe87bf9ce1dfc45cbd69f3d9b80bb55b60cd2c6c819524593cc7  palacio-root-mass.svg
82594c44dabe21cb59a3c11522d87efac84b64700c04575b106321768a5937dd  palacio-rubble.svg
3eadc029ad0ad9d4e52669214a23e3e2695fd9894bb3cd3c101c005201388beb  credor-sheet.png
```

## Observações

- O gerador é determinístico: arquivos idênticos em qualquer máquina com a
  mesma versão do script.
- Para alterar a arte, edite o gerador e regenere; não edite os arquivos
  gerados manualmente.
- As animações da folha seguem a ordem `walk`/`attack`/`hurt` usada por
  `Enemy`/`BossEnemy`.
- Os SVGs de piso são spritesheets de 4 frames de 32×32, carregados por
  `scene.load.spritesheet` com `frameWidth: 32` e `frameHeight: 32`.
