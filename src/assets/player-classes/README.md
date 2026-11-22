# Classes jogáveis autorais — fantasia amazônica

Esta pasta contém o redesign das quatro classes jogáveis do Umbra Trail. As
artes foram geradas especificamente para o projeto com a ferramenta integrada
OpenAI ImageGen em 2026-11-18, sob direção do projeto. O modelo exato de geração
não foi informado pela ferramenta.

Nenhuma fotografia, pessoa real, povo indígena, marca ou franquia foi usada
como referência. As folhas antigas permanecem em `src/assets/classes/` e
`src/assets/animations/` para recuperação, mas o runtime usa os arquivos finais
desta pasta.

## Identidades

- **Guardião do Cerne (`knight`)** — casca, madeira viva, pedra clara, fibras e
  resina âmbar; silhueta robusta de escudo-raiz.
- **Condutor das Sementes (`mage`)** — cajado-raiz, sementes, fungos e seiva
  bioluminescente; silhueta ampla de pétalas e folhas.
- **Rastreador do Igapó (`ranger`)** — arco de cipó laminado, fibras enceradas e
  materiais de mata alagada; silhueta leve e vertical.
- **Lâmina do Cipó (`rogue`)** — lâminas de pedra-resina, fibras de escalada e
  acentos de bromélia; silhueta compacta e veloz.

Cada identidade possui apresentações `woman` e `man` com o mesmo equipamento,
função e poder.

## Arquivos e transformação

- `*-source.png`: saídas RGBA originais do ImageGen, 1534×1025 para as folhas e
  1254×1254 para os corpos de mira.
- `<classe>_<gênero>.png`: folhas runtime 512×342, grade 4×3, células 128×114.
- `<classe>_<gênero>-portrait.png`: retratos 384×384 derivados do frame 0.
- `ranger_<gênero>_aim_body.png`: corpo 128×114 para a camada de arco
  articulado.

`scripts/generate-player-class-assets.mjs` recorta cada célula por limites
proporcionais, redimensiona sem dependências externas, preserva alfa, remove
resíduos cromáticos extremos e deriva retratos/corpos de mira. Os hashes
SHA-256 e as dimensões finais ficam em
`src/presentation/assets/playerClassAssetCatalog.ts` e são verificados por
`src/tests/playerClassAssets.test.ts`.

## Prompt set final

Todas as folhas usaram o asset anterior da mesma classe/gênero apenas como alvo
estrutural. O prompt comum exigiu: arte 2D polida com leitura de pixel art,
mesmas proporções chibi, doze poses isoladas em grade 4×3, caminhada/ataque/dano,
fundo realmente transparente, personagem inteiro e nenhuma borda, texto,
logotipo, cenário ou elemento entre células.

Direções específicas:

- Guardião: placas de casca viva, fibras, escudo de raiz com resina âmbar e
  lâmina curta de pedra clara; evitar armadura medieval e heráldica europeia.
- Condutor: fibras de floresta úmida, pétalas, cajado-raiz com sementes e fungos
  luminosos; evitar chapéu/robe de mago genérico e manter o cajado na mão.
- Rastreador: fibras impermeáveis, folhas enceradas, arco de cipó e madeira,
  referências abstratas a aves ribeirinhas e movimento felino; evitar elfo ou
  armadura de couro medieval.
- Lâmina: fibras de escalada, tecido de sombra, bromélia e duas lâminas de pedra
  e resina; evitar assassino encapuzado genérico.
- Corpos de mira: mesma identidade do Rastreador, pose frontal e padding do
  alvo, sem arco/efeito em primeiro plano para receber braços articulados.

Todos os prompts proibiram estereótipo tribal e representação literal ou
caricatural de povos reais.

