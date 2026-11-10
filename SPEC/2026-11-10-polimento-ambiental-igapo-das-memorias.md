# Polimento ambiental e direção de arte do Igapó das Memórias

**Data:** 2026-11-10  
**Estado:** especificação anterior à implementação  
**Continuidade:** substitui a direção visual, a composição de decorações e a
geometria apresentada por `SPEC/2026-11-02-redesign-igapo-geometria-e-variantes.md`
e `SPEC/2026-11-02-redesign-visual-igapo-das-memorias.md`. Preserva integralmente
os contratos de campanha, narrativa, persistência e runtime dessas SPECs.

## Objetivo

Elevar o Igapó das Memórias a uma leitura imediata de floresta amazônica
inundada, sem restringir a direção de arte ao pacote Puny World. A composição
passa a ser pensada como cenário: água dominante, arquipélago de margens
orgânicas, árvores emersas da água, raízes expostas, planos de profundidade,
marcos ambientais e ritmo de beats. O resultado continua sendo a mesma fase
2D top-down, com a mesma missão, o mesmo Vestígio Subterrâneo e a mesma saída
para o Coração Corrompido.

## Invariantes obrigatórias

- Preservar `stageId`, `chapterId`, revisão 2 do manifesto, identidade de save,
  layout autoral e catálogo de campanha.
- Preservar os IDs e coordenadas de spawn (`4,17`), Vestígio/NPC (`28,16`),
  saída física (`91,16`), itens (`10,18`, `59,12`, `83,19`), encontros,
  patrulhas (`49,16`–`56,16`), flags, diálogos, missão, eventos e bindings.
- Preservar a saída de 3×3 tiles em torno de `91,16` e a passagem física do
  corpo real de 42×58 px até todos os pontos de gameplay.
- A distribuição de tiles pode mudar. `0` continua transitável; `1`, `2` e `3`
  continuam sólidos. Nenhuma decoração participa da colisão.
- As apresentações Ribeirinho e Sombrio continuam carregando a mesma matriz,
  os mesmos pontos de gameplay e a mesma distribuição de decorações.
- A cena não cria bodies, hazards, interações ou comandos narrativos.

## Direção de arte

### Leitura geral

Floresta sazonalmente alagada e ancestral: a água ocupa a maior parte do
terreno interno, e a travessia acontece por um arquipélago de margens
recortadas, istmos, canais e pequenas ilhas. A luz é filtrada, úmida e
difusa; a paleta natural combina verdes de copa, verde-azulado de água,
lama quente e acentos ciano de memória.

### Beats ambientais

1. **Margem de entrada** (oeste): banco amplo, canoa, tronco submerso e a
   primeira copa densa.
2. **Lagoa das memórias**: água larga com vitórias-régias, ilhas pequenas e
   um istmo estreito que conduz ao Vestígio.
3. **Estreito das raízes**: passagem mais fechada, raízes entrelaçadas e
   copas baixas.
4. **Clareira de combate** (centro): superfície firme, legível, pouca
   vegetação alta sobre a área de luta.
5. **Vestígio e ocupação ribeirinha**: estela ritual, palafita em ruínas e
   sinais de memória sem bloquear a missão.
6. **Canais do leste**: água retomando espaço, troncos submersos e ilhas de
   palmeiras.
7. **Bacia da nascente** (leste): aproximação da saída com marcos espirituais
   e a passagem para o Coração Corrompido.

### Camadas

- **fundo**: copas distantes, névoa e feixes de luz;
- **terreno**: lodo, musgo, folhiço, raízes baixas, vitórias-régias, franjas
  de margem e troncos submersos;
- **atores**: jogador, NPC, inimigos e itens;
- **primeiro plano**: galhos suspensos e folhagem nas bordas do mapa, fora
  da rota jogável.

### Água e margem

- A silhueta do arquipélago deve ser irregular, com enseadas, canais e ilhas
  menores; proibido ler “bloco de água ao lado de bloco de grama”.
- O renderer distingue três faixas visuais: água rasa junto à margem, água
  média e canal profundo. A distinção é somente visual.
- Tiles de chão adjacentes à água recebem variantes úmidas de lodo/folhiço.
- Franjas autorais de margem, com raízes e juncos, cobrem a emenda ortogonal
  entre água e terra.

### Identidade local

Incluir, sem função de colisão: palafita ribeirinha em ruínas, estelas de
memória com glifos, troncos meio submersos, ilhas de palmeiras, canoa,
vitórias-régias e raízes emaranhadas. Pelo menos oito tipos de marco visual
devem estar presentes e resolvidos nas duas apresentações.

## Novos assets autorais

Criar somente ilustrações SVG originais locais, em pixel art top-down,
compatíveis com o tile de 32 px e com o pipeline Vite/BootScene existente:

| Recurso | Dimensões | Uso |
|---|---|---|
| `igapo-emergent-tree.svg` | 96×128 | árvore emersa com raízes tabulares |
| `igapo-palm-cluster.svg` | 96×112 | conjunto de palmeiras de igapó |
| `igapo-root-tangle.svg` | 96×64 | massa de raízes expostas |
| `igapo-submerged-trunk.svg` | 128×64 | tronco caído meio submerso |
| `igapo-water-lily.svg` | 128×32 | quatro variantes de vitórias-régias |
| `igapo-shore-fringe.svg` | 128×32 | quatro franjas de margem |
| `igapo-ground-moss.svg` | 128×32 | quatro manchas de musgo/folhiço |
| `igapo-stilt-hut.svg` | 96×80 | palafita ribeirinha em ruínas |
| `igapo-memory-stela.svg` | 48×80 | estela ritual com glifos |
| `igapo-canopy-bough.svg` | 192×64 | galho de copa para primeiro plano |
| `igapo-light-shaft.svg` | 96×192 | feixe de luz filtrada |
| `igapo-canopy-shadow.svg` | 96×48 | sombra suave de copa |
| `igapo-forest-floor.svg` | 64×32 | dois pisos contínuos de musgo e lama (32×32) |

Cada arquivo deve ser documentado em `src/assets/aguas/README.md` com origem,
dimensões e SHA-256, catalogado em `src/presentation/assets/igapoAssetCatalog.ts`
e carregado por `preloadIgapoAssets`. Nenhum asset de terceiro é adicionado
além do pacote já registrado.

## Extensão mínima de apresentação

- Adicionar `tint` opcional à definição de decoração e ao recurso resolvido,
  aplicado antes do tint da colocação. Isso permite que a apresentação Sombrio
  reutilize as novas silhuetas com paleta fria sem duplicar PNGs/SVGs e sem
  alterar colisão, ids públicos ou comportamento de gameplay.
- O renderer escolhe faixa de água e variante úmida de piso para temas do
  Igapó. Nenhum outro tema muda de seleção.

## Critérios observáveis

1. `stageId`, revisão, manifesto, NPC, missão, encontros, itens, flags,
   diálogos, eventos, saída e bindings permanecem idênticos.
2. O interior do mapa tem proporção de água maior ou igual a 50%, borda
   fechada, canais e ilhas, e deixa de reproduzir a faixa verde contínua
   anterior.
3. Teste de passagem física com corpo 42×58 confirma spawn → Vestígio, saída,
   itens, inimigos, patrulhas e ambos os desvios.
4. A saída 3×3 em torno de `91,16` continua transitável e os encontros ficam
   em solo alcançável.
5. Decorações são determinísticas, não participam da colisão, não cobrem os
   pontos de gameplay nem a rota central com vegetação alta, e o total
   permanece abaixo de 1.100 colocações.
6. Existem pelo menos oito tipos de marco visual, incluindo palafita, estela,
   tronco submerso, árvore emersa e canoa; todos os IDs resolvem no registro
   visual e nas duas apresentações.
7. O renderer distingue água rasa/média/profunda e piso seco/úmido, com
   colisão e geometria idênticas; teste cobre as faixas.
8. As duas apresentações usam o mesmo mapa, decorações e pontos; Sombrio
   resolve overrides para todos os novos IDs e permanece visualmente
   degradado, sem esconder atores.
9. Todos os SVGs autorais existem, têm dimensões declaradas, hash documentado
   e são carregados pelo BootScene.
10. Preview/World Lab e homologação jogável real em 1280×720 confirmam
    movimento, combate, NPC, missão, saída e transição, com console limpo.
    Capturas reais ficam em `.tmp/evidence/` e o resultado em relatório.
11. Executar `npm run check:gates`, `npm run build`,
    `npm test -- --runInBand` e `git diff --check`.

## Validação prevista

- Testes dirigidos do módulo do Igapó (geometria, proporção, conectividade,
  passagem física, itens, encontros, saída e narrativa).
- Testes das duas apresentações, resolução de decorações, tint de definição,
  faixas de água/piso e invariância de colisão.
- Teste do catálogo de assets autorais (dimensões e SHA-256).
- Testes existentes de loader, registry, renderer, preview e World Lab.
- Homologação real pelo preview Phaser, incluindo capturas antes/depois.
- Fechamento único com gates, build, suíte completa e `git diff --check`.
