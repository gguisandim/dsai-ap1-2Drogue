# Modernização visual das Minas Corrompidas — Etapa 9.18

**Data:** 2026-11-24  
**Estado:** especificação anterior à implementação.  
**Continuidade:** complementa `SPEC/2026-11-22-minas-corrompidas.md` apenas na
apresentação do cenário e dos adversários. Não altera os contratos narrativos,
de campanha, de mapa, de persistência ou de combate.

## Diagnóstico

O mapa coloca cinco cópias do panorama de 2172×724 em `x = 14, 54, 88, 123,
151`, com escala `0.34`. Cada imagem cobre cerca de 23 tiles (738 px), mas há
intervalos de até 40 tiles (1280 px); assim, a vista percorre trechos de fundo
sem panorama antes de alcançar outra composição. O deslocamento da trilha
também muda de altura entre regiões, mas os panoramas não cobrem continuamente
a rota. A escala pequena e a imagem pictórica com piso próprio contrastam com
os tiles pixelados de 32 px.

Os adversários da fase usam SVGs isolados carregados como imagens. As
animações de Minas atualmente apontam todas para o quadro base de cada SVG.
As fases anteriores usam `puny_warrior_128` e `puny_archer_128`: spritesheets
pixel art com quadros 128×114 e animações efetivas de caminhada, ataque e dano.
Esses recursos e animações já são carregados globalmente pelo `BootScene`.

## Escopo

1. Reposicionar e ampliar os cinco panoramas já existentes, preservando as
   ilustrações e garantindo cobertura horizontal sobreposta desde o spawn até
   a saída. Ajustar a altura dos centros proporcionalmente à escala para que
   a faixa de piso pintada continue acompanhando a trilha do mapa.
2. Preservar os pisos, tiles, decorações, variante Abandonada e variante
   Corrompida. Nenhum panorama será removido ou substituído por imagem genérica
   ou asset novo.
3. Mapear os inimigos das duas variantes para as spritesheets já usadas pelas
   fases anteriores, com escala uniforme baseada no padrão de 1.0 e tintas
   temáticas próprias de Minas. Guardião e Coração de Lastro podem receber
   escala maior para manter a hierarquia de leitura.
4. Usar as animações existentes `walk`, `attack` e `hurt` das spritesheets.
   Não criar catálogo de inimigos, animações ou assets paralelo.
5. Atualizar a cobertura de testes e a documentação do diretório de assets para
   registrar o uso atual dos spritesheets.

Não fazem parte do escopo: alterar outras fases, imagens de origem, assets
gerados, mapa lógico, posições ou atributos de inimigos, waves, hitboxes,
colisões, câmera, efeitos de gameplay, missão, saves, progressão, transições,
contratos compartilhados ou o seletor de fases.

## Critérios observáveis

1. Os cinco panoramas existentes cobrem o trecho entre spawn e saída sem lacuna
   horizontal: a distância entre centros adjacentes não excede a largura da
   imagem na escala aplicada; o primeiro cobre o spawn e o último cobre a
   saída.
2. A escala da imagem corresponde a pelo menos 38 tiles de largura e os
   centros acompanham verticalmente a trilha principal. A imagem permanece
   abaixo dos tiles de jogo na camada de fundo.
3. As apresentações Abandonada e Corrompida continuam usando seus panoramas,
   paletas, ambientes, efeitos e overrides correspondentes.
4. Cada arquétipo de inimigo resolve para `puny_warrior_128` ou
   `puny_archer_128`, com os quadros de caminhada, ataque e dano registrados no
   catálogo Puny. A resolução dos spritesheets usa quadros de 128×114.
5. Atributos, HP, posições, waves, missão, geometria e tiles de ambas as
   variantes permanecem idênticos ao estado anterior.
6. Os testes dirigidos do capítulo, validadores de plano/fase, playtest estático
   e homologação automatizada passam.
7. Uma inspeção Phaser em viewport 1280×720 registra antes/depois da entrada,
   interior e saída nas variantes, e uma execução do começo ao fim verifica
   visibilidade, animações, colisões, câmera, combate e conclusão.
8. Após a última alteração passam `npm run check:gates`, `npm run build`,
   `npm test -- --runInBand` e `git diff --check`.

## Validação prevista

- Testes dirigidos de `src/tests/minasCorrompidas.test.ts` para cobertura e
  alinhamento dos panoramas, spritesheets e animações reais, integridade dos
  assets e invariantes do estágio.
- `npm run chapter -- plan validate minas-corrompidas`,
  `npm run chapter -- validate minas-corrompidas` e
  `npm run chapter -- playtest minas-corrompidas`.
- `npm run homologate -- minas-corrompidas --json`.
- Homologação visual Phaser a 1280×720 de entrada, interior e saída, com
  capturas antes/depois e as duas variantes.
- Fechamento único com `npm run check:gates`, `npm run build`,
  `npm test -- --runInBand` e `git diff --check`.
