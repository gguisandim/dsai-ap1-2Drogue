# Redesign autoral das classes jogáveis em fantasia amazônica

**Data:** 2026-11-18  
**Estado:** especificação anterior à implementação no worktree  
**Continuidade:** amplia a apresentação definida em
`2026-10-02-personagem-classes-controles.md` e
`2026-10-02-animacao-recursos-visuais.md` sem substituir IDs, atributos,
controles, saves ou contratos de combate.

## Objetivo

Substituir a fantasia medieval genérica das quatro classes jogáveis por uma
direção autoral ligada à floresta amazônica fantástica do Umbra Trail. A
releitura usa materiais e formas do território — casca, raízes, cipós, fibras,
sementes, resina, pedra, água, fungos e flores — sem copiar vestimentas,
grafismos ou identidades de povos reais.

## Identidades preservadas e releituras

Os IDs públicos `knight`, `mage`, `ranger` e `rogue` permanecem estáveis.
Também permanecem atributos, armas funcionais, especiais, controles,
`PlayerClassId`, `CharacterAppearance`, chaves de armazenamento e progressão.

- `knight` — **Guardião do Cerne**: defensor de curta distância. Silhueta
  robusta, escudo de madeira viva e resina, lâmina de pedra clara, fibras e
  placas de casca; tons de terra, verde profundo e âmbar.
- `mage` — **Condutora das Sementes**: atacante mágico à distância. Cajado-raiz
  com sementes bioluminescentes, fungos e fluxo de seiva luminosa; índigo,
  turquesa, violeta e verde úmido.
- `ranger` — **Rastreador do Igapó**: mobilidade e ataque carregado. Arco de
  cipó laminado, fibras impermeáveis e referências abstratas a aves ribeirinhas
  e leitura de trilhas; verde musgo, água escura, ocre e creme.
- `rogue` — **Lâmina do Cipó**: velocidade, cortes e arremesso. Duas lâminas de
  pedra/resina, fibras de escalada e acentos inspirados em bromélias e sombra
  florestal; grafite, vinho, magenta vegetal e âmbar escuro.

As duas apresentações de gênero já existentes continuam disponíveis e usam a
mesma identidade de classe, sem diferença de poder, hitbox ou equipamento.

## Contrato dos assets

- Oito spritesheets RGBA: quatro classes × `woman`/`man`.
- Cada folha mede exatamente 512×342 px e contém 12 células em grade 4×3.
- Cada célula mede 128×114 px, com personagem centralizado e sem pixels de
  células vizinhas.
- Frames 0–3: caminhada com alternância legível de pés.
- Frames 4–7: ataque próprio da classe.
- Frames 8–11: dano/recuperação.
- O fundo é transparente e não contém texto, logotipo, moldura ou cenário.
- As folhas conservam a leitura lateral usada pelo runtime e a nitidez da arte
  de personagem no display 86×76.
- Os retratos 384×384 usados pelo criador são derivados deterministicamente do
  primeiro frame da respectiva folha, preservando alfa e identidade.
- O arqueiro mantém dois corpos de mira 128×114, um por gênero, sem arco em
  primeiro plano, compatíveis com a camada articulada existente.
- Os assets antigos permanecem versionados para recuperação, mas deixam de ser
  carregados pelas chaves públicas atuais após a homologação.

## Integração

- `BootScene` continua registrando `class_<id>_<gender>` e
  `anim_<id>_<gender>`; consumidores não recebem novas chaves.
- A maga passa a usar os frames de ataque autorais da folha. O recorte por
  coordenadas do cajado antigo deixa de participar do preload, pois é acoplado
  à arte substituída.
- O arqueiro continua usando a mira separada e o mesmo cálculo de pivô,
  direção, carga e disparo.
- `Hero` mantém display 86×76, body 42×58, offset 43×48, origem, profundidade,
  velocidade e colisão atuais.
- Não são alterados NPCs, inimigos, summons, projéteis, mapas ou UI fora dos
  textos e da prévia das classes.

## Proveniência e autoria

Os PNGs novos são gerados especificamente para o projeto com a ferramenta
integrada OpenAI ImageGen, sob direção do Umbra Trail. A pasta dos assets deve
documentar data, ferramenta, prompts finais, dimensões, SHA-256 e transformações
determinísticas. Nenhuma imagem de povo real é usada como referência visual.

## Critérios observáveis

1. As quatro classes têm silhuetas, paletas e equipamentos distinguíveis no
   criador e no gameplay, com unidade material amazônica/florestal.
2. `knight`, `mage`, `ranger` e `rogue` mantêm exatamente seus atributos,
   estilos de ataque, controles e especiais anteriores.
3. As oito folhas têm 512×342, 12 frames 128×114, alfa real, células isoladas e
   hashes documentados.
4. Caminhada, ataque, dano e esquiva funcionam sem mudar display, body, offset,
   câmera ou colisão.
5. A mira carregada do arqueiro mantém corpo e arco alinhados em ângulos
   horizontais, verticais e diagonais.
6. A maga usa o cajado como parte da animação e nunca o lança como projétil.
7. O criador de personagem exibe a arte nova nas duas apresentações de gênero
   e continua salvando o mesmo documento `umbra-trail-profile`.
8. Floresta das Raízes e ao menos uma entre Igapó das Memórias e Jardins das
   Flores Veladas mantêm contraste suficiente para as quatro paletas.
9. Os assets anteriores continuam presentes e nenhum NPC, inimigo ou chefe é
   redesenhado.
10. Não existem imports remotos nem geração de imagem em runtime.

## Testes e homologação

- Teste de catálogo/proveniência, dimensões, SHA-256, alfa e isolamento das
  células dos oito spritesheets e dos dois corpos de mira.
- Testes existentes de movimento, projéteis, mira articulada, perfil e
  apresentação das armas.
- Verificação real no Phaser de idle, caminhada, ataque, dano e leitura nas
  fases escolhidas.
- Evidências: comparação das quatro classes, antes/depois e capturas nas duas
  ambientações homologadas.
- Fechamento: `npm run check:gates`, `npm run build`,
  `npm test -- --runInBand` e `git diff --check`.

## Fora do escopo

Redesign de NPCs, inimigos, chefes, summons, retratos narrativos, UI geral,
hitboxes, balanceamento, novas classes, novas chaves de save e alterações no
motor de combate.

