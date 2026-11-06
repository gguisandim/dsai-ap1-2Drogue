# Refinamento artístico da Floresta das Raízes

**Data:** 2026-11-06  
**Estado:** especificação anterior à implementação  
**Continuidade:** refina as seções de apresentação e homologação visual de
[Fase 1 — Floresta das Raízes](./2026-11-05-fase-1-floresta-das-raizes.md).
Mantém seu mapa panorâmico, narrativa, geometria jogável, contratos e
integração da campanha.

## Objetivo

Substituir a aparência de mapa revestido por tiles por uma composição ambiental
autoral em escala de cena. A floresta deve combinar solo contínuo, trilhas
orgânicas, água com margens desenhadas, vegetação de grande porte e planos de
profundidade com qualidade compatível com a árvore monumental.

Este documento substitui a direção anterior que restringia o refinamento à
paleta, ao ruído determinístico e à redistribuição dos sprites existentes. A
implementação pode criar assets originais, atlases, decals e camadas específicas
da Floresta das Raízes e pode ampliar o `StageMapRenderer` e seus contratos
públicos quando isso for necessário para separar arte, colisão e composição.

## Limites e preservação

- Preservar os IDs da fase, hub, missão, NPC, saída e destino Igapó.
- Preservar câmera, mapa panorâmico de 116×36 tiles, fluxo, encontros e
  progressão homologada.
- Não alterar `GameScene`, combate, campanha ou outro capítulo.
- Alterações no motor de apresentação devem ser aditivas, genéricas e manter a
  renderização existente para capítulos que não declarem as novas camadas.
- Novas composições devem ser determinísticas, decorativas e não bloquear
  spawn, NPC, objetivos, inimigos, itens ou saída.
- Manter os assets existentes e suas atribuições de origem/licença.
- Toda arte nova deve ser local, original, documentada e carregada pelo pipeline
  atual, sem dependência remota em runtime.

## Direção visual

1. Construir o solo como uma superfície contínua em escala regional, com terra,
   musgo, folhas, raízes rasas e trilhas pintadas; os tiles lógicos permanecem
   apenas como suporte e fallback, sem comandar a leitura visual.
2. Substituir as paredes de árvores repetidas por composições de bosque com
   silhuetas largas, copas sobrepostas, troncos de portes diferentes, vazios
   intencionais e separação entre fundo, terreno e primeiro plano.
3. Cobrir os cursos d’água lógicos com superfícies e margens autorais que
   escondam o recorte ortogonal sem mudar a colisão. As margens devem incluir
   barro, raízes, pedras, folhas e vegetação ribeirinha.
4. Compor manualmente pontos focais e ritmos de exploração. Vegetação menor
   serve como acabamento local, não como substituto de composição.
5. Refinar primeiro dois pilotos: um trecho representativo da trilha principal
   e a aproximação ao santuário. A linguagem aprovada nos dois pilotos deve ser
   aplicada ao restante da fase somente depois de captura e inspeção.
6. Usar camadas e efeitos Phaser de forma aditiva: imagem de solo abaixo dos
   atores, massas vegetais de terreno, molduras de copa em primeiro plano e
   detalhes atmosféricos. As camadas visuais não participam da física.
7. Assets novos devem registrar origem, prompt/técnica, licença, dimensões e
   hash. Não adicionar assets de terceiros.

## Diagnóstico da infraestrutura anterior

- O caminho de mapas grandes do `StageMapRenderer` consolida o terreno em
  render textures de 8×8 tiles, porém continua desenhando uma imagem quadrada
  por célula; isso conserva emendas e contornos ortogonais.
- A seleção de variantes opera por coordenada ou pequenos blocos e não expressa
  trilhas, clareiras, margens ou massas de vegetação como formas contínuas.
- `DecorationPlacement` permite apenas uma imagem centralizada, escala uniforme,
  rotação, tint e depth. Sem dimensões, origem, alpha ou composição regional, o
  capítulo foi levado a repetir sprites pequenos para preencher o espaço.
- A evolução deve preservar esse caminho como fallback e acrescentar uma forma
  explícita de declarar grandes composições ambientais, sem acoplar a floresta
  à lógica de colisão.

## Ampliação após os pilotos

Os dois pilotos foram capturados e inspecionados. A inspeção confirmou que a
linguagem funciona, mas que as composições isoladas deixam retângulos do piso
lógico expostos entre si. A continuação autorizada por esta SPEC:

- cobre o corredor inteiro com composições contíguas e sobrepostas:
  `world-root-entrance.png` na entrada, `world-root-trail-composition.png`
  espelhada na trilha, `world-root-sanctuary-approach.png` na aproximação,
  `world-root-sanctuary.png` no ápice e `world-root-passage.png` na saída;
- usa `world-root-grove.png` como massa vegetal de fundo e de terreno em duas
  faixas contínuas, mais um plano de primeiro plano, substituindo as paredes de
  árvores repetidas;
- usa `world-root-stream.png` sobre os três canais lógicos de água;
- escurece o piso e a parede lógicos para que frestas inevitáveis entre
  composições leiam como sombra de sub-bosque, não como grade de tiles.

Como o tint por colocação não é aplicado por todos os caminhos de renderização,
o refinamento não depende dele: o piso é escurecido no próprio SVG, e o
marcador de ruína e a parede lógica são substituídos por dois SVGs originais
(`world-root-stone.svg` e `world-root-canopy.svg`). Assim a leitura correta não
depende do backend gráfico.

`DecorationPlacement` recebe os campos visuais opcionais `alpha`, `flipX`,
`flipY`, `originX` e `originY`. Eles são validados pelo registro visual,
aplicados apenas ao objeto de imagem e nunca criam corpo físico. Quando os
campos estão ausentes, o renderizador mantém exatamente o comportamento
anterior, preservando capítulos e testes legados.

Critérios adicionais:

13. As capturas da entrada, trilha, Guardião, combate, aproximação, santuário e
    saída mostram corredor contínuo, sem retângulo de piso lógico exposto em
    área caminhável.
14. Os testes do renderizador cobrem `alpha`, espelhamento e origem, e
    confirmam que a contagem de corpos físicos permanece igual à do mapa
    lógico.

## Critérios observáveis e validação

1. Capturas dos dois pilotos demonstram mudança estrutural: o chão não é lido
   como mosaico 32×32, as árvores não formam paredes de tiles e a água não
   termina em degraus quadrados expostos.
2. O solo tem trilha reconhecível, variação material em manchas contínuas e
   detalhes desenhados em escala maior que um tile.
3. A vegetação principal usa ao menos três portes e dois planos de profundidade,
   com sobreposição de copas e sem repetição sequencial evidente.
4. As margens visíveis dos cursos d’água têm transição contínua entre água,
   barro e vegetação, sem alterar as células lógicas de água.
5. O mapa e o conjunto de composições são determinísticos entre carregamentos.
6. As alterações decorativas não mudam as células de colisão nem as posições
   persistentes; a saída continua alcançável por caminho físico.
7. Permanecem válidos os IDs e contratos de `mission.raiz-do-mundo.ouvir-raizes`,
   `npc.raiz-do-mundo.keeper`, `exit.raiz-do-mundo.to-igapo`,
   `hub.floresta-das-raizes` e `stage.aguas.igapo-das-memorias`.
8. Comparar capturas anteriores e novas da entrada, trilha principal, NPC/POI,
   primeiro combate, aproximação, santuário e saída/transição.
9. Inspeção visual confirma hierarquia compatível com a árvore monumental,
   composição que conduz ao santuário e leitura clara de rota e interativos.
10. Testes do renderizador comprovam compatibilidade do fallback, ordem das
    camadas e independência entre visual e colisão.
11. Executar os testes dirigidos da fase, `npm run check:gates`, `npm run build`,
   `npm test -- --runInBand` e `git diff --check`.
12. Reexecutar a homologação real da fase e preservar capturas distintas da
   entrada, trilha, NPC, primeiro combate, aproximação, santuário e saída;
   confirmar a transição para o Igapó.

## Limitação de processo

A política do usuário proíbe commits; a SPEC e a implementação permanecem no
worktree e nenhum commit ou push deve ser executado.
