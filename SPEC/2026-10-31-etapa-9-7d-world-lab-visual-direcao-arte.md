# Etapa 9.7D — World Lab visual e padronização da direção de arte

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.7C e reutiliza seus previews, registry visual,
renderer Phaser, assets locais e variantes. Não cria renderer, física, asset
manager, save, formato de mapa ou editor alternativo.

## Objetivo

Transformar o Umbra World Lab em uma bancada visual de autoria capaz de:

1. preservar a inspeção estrutural SVG;
2. incorporar a execução Phaser real de uma fase em ambiente de desenvolvimento;
3. comparar duas variantes da mesma fase em viewports equivalentes;
4. inspecionar metadados objetivos de escala, origem, frame, âncora e camada;
5. produzir descritores reproduzíveis de captura sem tocar em saves de produção.

O mesmo trabalho formaliza a direção de arte global e usa o Igapó das Memórias
como referência verificável, sem impor seus pacotes gráficos a outros capítulos.

## Decisões arquiteturais

### Três modos de inspeção

O painel de fase do World Lab passa a oferecer `structural`, `visual` e
`compare`:

- `structural` mantém o SVG atual e suas camadas de geometria, colisões,
  entidades, grafo e saídas;
- `visual` incorpora, em `iframe` restrito e de mesma origem, a URL de preview
  `stagePreview`/`presentationVariant` já executada por `BootScene` e
  `GameScene`;
- `compare` incorpora duas instâncias da mesma fase com variantes distintas,
  mesma dimensão de viewport, zoom de apresentação e posição inicial de câmera.

Os modos visuais só são habilitados em desenvolvimento. As URLs são construídas
com a origem corrente, parâmetros conhecidos e sandbox local; nenhum caminho,
script ou origem arbitrária é aceito. O World Lab não renderiza tiles ou sprites
por conta própria e não acessa storage de campanha.

O seletor de fase consulta o `StageRegistry` já registrado. Seleção de variante,
zoom, grade e camadas de inspeção são estado local da UI. Trocar variante não
modifica manifesto, mapa lógico, sessão, gameplay ou save.

### Captura reproduzível

O World Lab gera um descritor versionado com fase, revisão do manifesto,
variante(s), viewport, zoom, câmera inicial e revisão visual. Uma captura usa o
canvas real do preview Phaser e esse descritor; screenshots transitórios ficam
em `.tmp/evidence/` e não são versionados.

### Referência global de escala

O tile lógico continua sendo 32×32 unidades. Fontes 16×16 podem ser apresentadas
em 2×, com nearest-neighbor. O contrato visual existente recebe somente
metadados opcionais e retrocompatíveis:

- dimensão da fonte ou do frame;
- região visível dentro do frame;
- escala de apresentação;
- âncora visual normalizada;
- classe de escala (`tile`, `character`, `prop` ou `oversized`);
- perspectiva e indicação de pixel art;
- pacote/origem;
- dimensões e offsets de colisão, apenas para inspeção.

Esses metadados não alteram bodies, hitboxes, física, colisões, transitabilidade
ou geometria lógica. Elementos grandes podem declarar `oversized`, evitando
suposições de que toda textura deva caber em um tile.

### Inspector artístico objetivo

A projeção do World Lab expõe, quando conhecidos: asset e pacote, textura e
frame, dimensões de origem/visíveis/renderizadas, escala, âncora, categoria,
camada e compatibilidade com a escala do mundo.

Diagnósticos automáticos se limitam a fatos verificáveis: referência ausente,
frame fora do intervalo, região visível inválida, dimensão não positiva,
perspectiva incompatível e proporção suspeita para a classe declarada. Árvores,
construções e outros itens `oversized` não recebem alerta por exceder um tile.
Cor, beleza, composição e adequação estética permanecem critérios humanos.

### Direção de arte

`docs/art-direction.md` define pixel art top-down como perspectiva principal,
escala, ancoragem, ordenação, compatibilidade entre pacotes, paleta, contraste,
iluminação, saturação, spritesheets e deformações proibidas. O mesmo documento
inclui a referência do Igapó: identidade amazônica inundada, elementos, paletas
Ribeirinho/Sombrio, proporções, assets/licenças existentes e itens a evitar.

## Compatibilidade e limites

- `StagePresentation`, `StageVisualRegistry` e `StageMapRenderer` continuam
  sendo os únicos contratos/serviços visuais.
- Apresentações existentes sem os novos metadados continuam válidas e idênticas.
- Fases legadas e capítulos independentes continuam inspecionáveis.
- Não há alteração em combate, IA, narrativa, progressão, procedural ou saves.
- Não há correção específica do Igapó no núcleo compartilhado.
- Nenhum asset original é alterado ou baixado nesta etapa.
- O modo comparação garante equivalência da configuração inicial; sincronização
  interativa posterior de câmeras não é requisito desta etapa.

## Critérios observáveis

1. O World Lab seleciona uma fase registrada e alterna entre os modos estrutural,
   visual e comparação.
2. O modo estrutural preserva o SVG e permite ligar/desligar grade, entidades,
   decorações e saídas.
3. O modo visual incorpora o preview Phaser real, sem segundo renderer.
4. A comparação abre a mesma fase com duas variantes, viewports e zoom iguais e
   câmera inicial equivalente.
5. URLs incorporadas são locais, restritas à origem e disponíveis apenas em
   desenvolvimento.
6. Variantes mudam somente a apresentação; mapa, sólidos, spawns, encontros,
   saídas e saves permanecem inalterados.
7. Contratos sem novos metadados continuam válidos.
8. Metadados distinguem origem/frame, região visível, escala, âncora e colisão;
   o renderer não usa metadados de colisão para modificar física.
9. O inspector mostra os dados disponíveis e diagnósticos objetivos, sem julgar
   qualidade artística nem alertar tamanho de itens `oversized`.
10. O Igapó Ribeirinho e Sombrio compartilha o mesmo mapa lógico e pode ser
    comparado na mesma resolução.
11. Um descritor de captura reproduzível registra fase, revisões, variantes,
    viewport, zoom e câmera.
12. `docs/art-direction.md` cobre as regras globais e a referência do Igapó com
    proveniência e licenças dos assets usados.
13. Nenhuma chave de storage de produção é lida ou escrita pelo World Lab.
14. Gates, build, testes e `git diff --check` passam; homologação em navegador
    só é relatada quando houver screenshot e inspeção reais.

## Testes previstos

- contratos/registry: validação dos novos metadados e retrocompatibilidade;
- projector/inspector: dimensões, âncoras, origem, classes e diagnósticos;
- UI: seleção de fase, três modos, variantes, zoom, grade e camadas;
- preview: URL de mesma origem, sandbox, bloqueio fora de desenvolvimento e
  descritor reproduzível;
- Igapó: invariância de mapa/colisão/gameplay entre variantes e metadados Puny;
- regressão: fases legadas e capítulos sem metadados continuam carregando;
- browser: visual e comparação em 1280×720, texturas presentes e console sem
  erros, se o ambiente disponibilizar navegador.

## Limitações e próximos passos

- A comparação parte da mesma câmera inicial, mas não oferece pan sincronizado.
- O inspector trabalha com metadados declarados; detecção automática de área
  transparente não faz parte desta etapa.
- A captura é evidência de desenvolvimento, não formato de publicação nem save.
- Um editor visual completo, correção automática de arte e importação remota de
  pacotes permanecem fora do escopo.
