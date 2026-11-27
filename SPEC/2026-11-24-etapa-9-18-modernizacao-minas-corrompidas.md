# Modernização visual das Minas Corrompidas — Etapa 9.18

**Data:** 2026-11-24
**Estado:** revisão da direção artística solicitada após homologação humana
parcial em 2026-11-24. Implementação ambiental concluída; aprovação visual
humana pendente.
**Continuidade:** complementa `SPEC/2026-11-22-minas-corrompidas.md` apenas na
apresentação do cenário. A composição de panoramas implementada em `746d829`
foi parcialmente reprovada; os adversários desse commit foram aprovados e
devem permanecer inalterados. Esta revisão substitui os critérios visuais
anteriores para o cenário, sem alterar contratos narrativos, de campanha,
mapa, persistência ou combate.

## Decisão da homologação humana

A avaliação aprovou os sprites e animações de inimigos de `746d829`, mas
reprovou a composição ambiental: mesmo ampliadas e sobrepostas, as ilustrações
panorâmicas continuam parecendo imagens de fundo independentes, não um cenário
construído para exploração. Não se deve tentar corrigir isso ampliando,
repetindo, recortando ou retocando a transição dessas ilustrações.

As imagens permanecem como referências de paleta e identidade, e como resumos
visuais de Abandonada e Corrompida no seletor de fases. Não podem ser colocadas
na fase jogável. A nova direção constrói a mina com tiles pixel art e elementos
locais integrados ao mapa, preservando a geometria, as colisões e as duas
identidades de apresentação.

## Diagnóstico

O problema visual não era apenas a lacuna entre fundos: os panoramas mostram
um chão e uma profundidade pintados, independentes da grade jogável. Cobrir
mais área mantém esse desacoplamento. As Minas já possuem pisos pixelados em
`mine-floor-abandoned.svg` e `mine-floor-corrupted.svg`, e elementos locais de
madeira, trilhos, raízes, cristais, fungos e maquinário. A parede e o pilar
usavam recortes genéricos de `puny_world`, sem identidade de rocha subterrânea.

## Escopo

1. Remover as colocações de `mina_panorama` da definição jogável. Os PNGs
   panorâmicos ficam registrados e carregados apenas para a imagem de resumo do
   seletor de fases; não se altera o menu, o seletor nem seu resolver.
2. Criar um atlas original de tiles pixel art de 32×32 para rocha, veios
   minerais, suportes e água subterrânea, e usá-lo nos tiles lógicos de parede,
   pilar e água dos tilesets locais. Abandonada e Corrompida devem usar quadros
   e paletas distintos. O atlas é parte dos assets do capítulo Minas, nunca de
   assets compartilhados.
3. Preservar e distribuir os elementos locais de madeira, trilhos, raízes,
   cristais, fungos e maquinário como detalhes de áreas, sem formar uma camada
   estática que simule o cenário. Decorações continuam apenas visuais e não
   participam de colisão.
4. Preservar sem alteração os sprites, animações, tintas, escalas e mapeamentos
   de inimigos aprovados em `746d829`, assim como atributos, posições, waves e
   comportamento.
5. Testar ausência de panoramas no mapa jogável, presença do atlas na renderização
   visual, invariância da geometria e preservação do resumo no seletor.

Não fazem parte do escopo: alterar outras fases, imagens panorâmicas de origem,
menu ou seletor, mapa lógico, dimensões, spawn, posições ou atributos de
inimigos, waves, hitboxes, colisões, câmera, efeitos de gameplay, missão,
saves, progressão, transições, contratos compartilhados ou a implementação
aprovada dos adversários.

## Critérios observáveis

1. Nenhuma decoração de panorama está em `authoredLevel.decorations`; portanto,
   entrada, interior e saída do runtime não renderizam
   `minas_panorama_abandoned` nem `minas_panorama_corrupted`.
2. `resolveStagePreview` continua resolvendo a imagem de resumo existente de
   cada variante: Abandonada usa `minas_panorama_abandoned`; Corrompida usa
   `minas_panorama_corrupted`.
3. As paredes, pilares e águas resolvidas nas duas variantes usam o atlas
   `minas_rock_tiles`, com dimensões declaradas de 32×32 por frame e paletas
   distintas. O atlas contém detalhes pixel art coerentes de rocha e mina,
   sem qualquer asset panorâmico no mapa.
4. Os elementos locais mantêm referências válidas e são visuais apenas. A
   geometria tileMap e a classificação de colisões são idênticas nas duas
   variantes e não sofrem alteração nesta revisão.
5. Os inimigos continuam usando os mesmos sprites, animações e parâmetros
   aprovados em `746d829`; seus atributos e waves não mudam.
6. Testes do capítulo validam assets, mapa, referências, variantes, preview
   e ausência de colocações panorâmicas jogáveis.
7. Uma nova homologação manual em 1280×720 inspeciona entrada, interior e saída
   das duas variantes, incluindo transição, personagens, obstáculos e resumo do
   seletor. Não se declara aprovação visual automatizada.
8. Após a última alteração passam `npm run check:gates`, `npm run build`,
   `npm test -- --runInBand` e `git diff --check`.

## Validação prevista

- Testes dirigidos de `src/tests/minasCorrompidas.test.ts` para integridade e
  dimensões do atlas, tiles resolvidos, ausência de panoramas em colocações,
  resumo das variantes e invariantes de mapa/inimigos.
- `npm run homologate -- --stage stage.corrupted.minas --variant
  variant.corrupted.minas.abandoned --json` e a variante
  `variant.corrupted.minas.corrupted`.
- Homologação humana Phaser a 1280×720 nas duas variantes, com entrada,
  interior e saída, e inspeção separada das imagens de resumo no seletor.
- Fechamento único com `npm run check:gates`, `npm run build`,
  `npm test -- --runInBand` e `git diff --check`.
