# Jardins das Flores Veladas — assets autorais

Os SVGs foram desenhados diretamente para o projeto, sem fonte ou licença de
terceiros. Os quatro PNGs foram gerados especificamente para esta fase com a
ferramenta integrada OpenAI ImageGen, sob direção do projeto, e depois
reduzidos localmente com alpha preservado. Nenhuma biblioteca visual externa
foi importada. Todos usam perspectiva 2D top-down ou neutra e são carregados
pelo pipeline Vite existente.

| Arquivo | Dimensões | Uso | SHA-256 |
|---|---:|---|---|
| `flores-forest-floor.svg` | 128×32 | atlas de quatro pisos | `790a0f5ff0a3fa0a7e9ff6a8220f4f184007e390291d9fdd74fcaa88901ae6b2` |
| `flores-monumental-tree.svg` | 192×224 | Árvore das Mil Pétalas | `66f28eccf0d52aaf4c7fc52e20d06b37155f59b5fcacf5de1341c9ba6cee1768` |
| `flores-bromeliad-cluster.svg` | 96×64 | bromélias e folhas largas | `63cd6a9c88c7faee6efa8c8a0d1e12dc2f98d528f2884a895e60b7998ff08577` |
| `flores-heliconia-arch.svg` | 160×128 | arco natural de helicônias | `827721cc09b9ecc235f657784c8377da2fb1f7804d7378071ae84e103204c8f4` |
| `flores-orchid-veil.svg` | 128×96 | cortina de orquídeas | `134edf974615297be62ac88929fd3dd7371e36fe796341526102564a1b75035a` |
| `flores-pollinator-nest.svg` | 128×96 | ninho ritual dos polinizadores | `edea44a46cb40e2c8c14648a5e3adbb88134cc8b1550ad39d761b9df370d8fc3` |
| `flores-canopy-bough.svg` | 224×80 | folhagem de primeiro plano | `9ac0079646b4c3675c811f161e9d86a6c220d615969226f6b9786efc87482238` |
| `flores-light-shaft.svg` | 112×224 | feixe de luz filtrada | `c174dde2fde72e9fbb8af34260ac2738157b8c7847e5115cd0a1b4bea2434d71` |
| `flores-natural-canopy.png` | 1024×512 | composição pictórica de copa Natural | `feb7b80b9f95d41733bd5182827d4c59e0f3a887d40845dc372dc491c7525dc6` |
| `flores-natural-heart-bloom.png` | 768×702 | clareira focal Natural | `78f591398e94e0423d16401036cda481c5400a638b5f9e5a4ebf91a1049bf386` |
| `flores-corrupted-canopy.png` | 1024×512 | mutação pictórica da copa | `8b932699a97f1c97c59fa18e61ef2daf11daa9fd9a495753a6141b1f221b71ce` |
| `flores-corrupted-heart-core.png` | 768×512 | núcleo pictórico contaminado | `3281fe8f3a237b83bd77bfee1b83aab2be394d738d9cf32da143bcbda0d4f91e` |
| `flores-corrupted-tree.svg` | 192×224 | Árvore das Mil Pétalas contraída | `90a44430c0bb4f694a6b2432d61520a07bde38086249d43ef2838c93f8143d01` |
| `flores-corrupted-bromeliad.svg` | 96×64 | bromélia fechada e mineralizada | `530066bba543860c630a8502f31a1bc870af90e57a83584c8fc029a15b156a26` |
| `flores-corrupted-thorn-arch.svg` | 160×128 | arco de espinhos mutado | `370c9bdadd8be4d630082a970d7273d46ffd8010b4a62a630a7ed2b6ddab7f07` |
| `flores-corrupted-orchid-veil.svg` | 128×96 | orquídeas invertidas e pétalas caídas | `6fca2b5b6f1c747ea07dd29d82dfddedea97a1dd2b8d86a39431ba1ebd49e1f9` |
| `flores-corrupted-nest.svg` | 128×96 | ninho mineralizado | `f0eda15965c37f7225917bdf9826e9ecb32fd7df6e270e8eb3c76baef9a221f4` |
| `flores-corrupted-bough.svg` | 224×80 | copa contraída de primeiro plano | `dca298ac58665a20c28c235b0bd00977529f2d7c986d8f6828d9b7649a15c386` |
| `flores-corrupted-spore-column.svg` | 112×224 | coluna de esporos contaminados | `49d79941b1c0792c2bcaafe91680c03274350bf649d00ffd4ed5c95fc0bc726c` |

## Prompts pictóricos

Os quatro PNGs usam o caso `stylized-concept`, sem personagens, texto, marcas
ou fundo opaco. O conjunto de prompts pediu: copa amazônica exuberante com
trilha aberta; clareira saudável de raízes, flores e água; mutação da mesma
copa com raízes angulares, fungos e flores invertidas; e mutação da mesma
clareira com flor central contraída, pólen mineralizado e espinhos. As imagens
foram geradas em modo transparente e reduzidas de 1312–1774 px para os tamanhos
da tabela, diminuindo o conjunto de aproximadamente 10,4 MB para 4,3 MB.
