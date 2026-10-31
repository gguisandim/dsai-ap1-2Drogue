# Registro de prompt: Etapa 9.7D — World Lab visual e direção de arte

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-7d-world-lab-visual-direcao-arte`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-7d-world-lab-visual-direcao-arte.md`
- Commit: `pendente`
- Execução: `testes dirigidos aprovados (37 casos do World Lab, apresentação e Igapó); npm run check:gates aprovado; npm run build aprovado (typecheck e Vite); npm test -- --runInBand aprovado (84 suítes, 1079 testes); git diff --check aprovado; homologação visual no Edge headless em 1280×720 aprovada para os modos Visual e Compare; duas capturas temporárias foram inspecionadas e removidas após registrar seus hashes; a checagem adicional via console/CDP excedeu o tempo e não foi usada como evidência`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-7d-world-lab-visual-direcao-arte.md`
- `SPEC/README.md`
- `prompts/48-etapa-9-7d-world-lab-visual-direcao-arte.md`
- `docs/art-direction.md`
- `docs/autoria-capitulos-e-assets.md`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSession.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/PhaserPreviewView.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/worldLabPresentation.test.ts`
- `src/tests/worldLabUi.test.ts`
- `src/tests/worldLabVisualPreview.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.7D — World Lab Visual e Padronização da Direção de Arte

Implemente a evolução visual do Umbra World Lab, utilizando a infraestrutura existente após a 9.7C.

**Objetivo:** permitir que desenvolvedores e agentes de IA visualizem a aparência real das fases durante a construção e garantir consistência de escala, proporção, perspectiva e direção artística entre diferentes pacotes de assets 2D.

Leia `AGENTS.md`, a SPEC 9.7C, `docs/autoria-capitulos-e-assets.md`, os contratos visuais, o código do World Lab e os arquivos:

- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/presentation/assets/punyAssetCatalog.ts`
- `src/presentation/assets/bootPunyAssets.ts`
- `StageVisualRegistry` e `StageMapRenderer`

Localize os demais arquivos pela estrutura real do repositório, sem presumir caminhos.

## 1. World Lab — Visualização real

Evolua o World Lab para oferecer três modos:

- **Estrutural:** preservar a visualização SVG atual com geometria, tiles, colisões, entidades, grafo e saídas.
- **Visual:** apresentar a renderização verdadeira da fase no Phaser, utilizando sprites, texturas, decorações, animações e ambientação existentes.
- **Comparação:** visualizar duas variantes da mesma fase com câmera, zoom e resolução equivalentes.

Reutilize os previews `stagePreview`, `chapterPreview` e `presentationVariant` da 9.7C.

Prefira incorporar a prévia Phaser de desenvolvimento em um ambiente isolado dentro do World Lab. Não implemente um segundo renderizador de tiles ou sprites.

A interface deve permitir selecionar fase, variante, zoom, visibilidade da grade e camadas de inspeção.

Mantenha o World Lab independente dos saves de produção. Se for necessário controlar a câmera por comunicação entre a interface e a prévia, utilize uma integração local, restrita à origem e ao ambiente de desenvolvimento.

## 2. Padronização de proporções

Formalize uma referência global de escala para os assets do jogo.

Utilize como referência inicial:

- Tile lógico: 32×32 unidades visuais do mundo, respeitando as dimensões efetivamente utilizadas pelo renderer.
- Tiles de origem 16×16: escala 2× quando apropriado.
- Pixel art: filtragem nearest-neighbor e alinhamento consistente à grade.
- Personagens, NPCs e inimigos: tamanho aparente coerente com tiles, obstáculos e objetos do cenário.
- Árvores, construções e elementos grandes: dimensões proporcionais ao personagem e ao ambiente, sem exigir que ocupem apenas um tile.

Não imponha tamanho fixo de textura a todos os recursos.

Separe explicitamente:

1. Dimensão original da imagem ou frame.
2. Região visível do sprite, desconsiderando margens transparentes quando pertinente.
3. Escala de apresentação no mundo.
4. Ponto de ancoragem visual.
5. Dimensões e offsets de colisão existentes.

Permita normalizar a apresentação de assets provenientes de pacotes diferentes sem modificar hitboxes, física ou geometria lógica.

Reutilize os contratos visuais existentes. Quando necessário, amplie seus metadados de maneira opcional e retrocompatível, sem criar outro AssetRegistry.

## 3. Direção de arte formalizada

Crie `docs/art-direction.md`, um guia curto de direção artística global.

Defina:

- Pixel art top-down como perspectiva principal.
- Referência de escala e proporção entre personagens, objetos e terrenos.
- Regras de alinhamento, ancoragem e ordenação visual das camadas.
- Critérios de compatibilidade entre pacotes diferentes.
- Diretrizes de paleta, contraste, iluminação e saturação.
- Regras para animações e spritesheets.
- Critérios para identificar assets incompatíveis e evitar deformações.

Crie também uma referência artística para o Igapó das Memórias, incluindo:

- Identidade de floresta amazônica inundada.
- Elementos característicos: água, raízes, vegetação densa, passarelas e áreas de terra.
- Paleta e atmosfera das variantes Ribeirinho e Sombrio.
- Proporções de árvores, personagens, vegetação e estruturas.
- Referências de assets já incorporados e suas licenças.
- Elementos visuais que devem ser evitados.

Essas diretrizes devem orientar futuras fases sem obrigá-las a utilizar os mesmos pacotes gráficos.

## 4. Inspector artístico

Amplie o inspector do World Lab para exibir, quando disponíveis:

- Asset e pacote de origem.
- Textura e frame utilizados.
- Dimensões originais e dimensões renderizadas.
- Escala aplicada e ponto de ancoragem.
- Categoria e camada visual.
- Compatibilidade com a escala do mundo.
- Avisos sobre proporções suspeitas, frames inválidos, assets ausentes ou perspectiva incompatível.

Evite falsos positivos com elementos intencionalmente maiores, como árvores e estruturas.

Não tente determinar automaticamente se uma arte é bonita. Separe verificações objetivas de proporção e integridade dos critérios artísticos que exigem revisão humana.

## 5. Igapó como referência

Utilize o Igapó das Memórias para validar a implementação.

Mostre as variantes Ribeirinho e Sombrio usando o mesmo mapa lógico, mesma câmera e mesma resolução.

Verifique visualmente a proporção de personagens, NPCs, inimigos, árvores, água e demais objetos.

Corrija apenas problemas de apresentação realmente encontrados. Não redesenhe a fase nem substitua arbitrariamente recursos já aprovados.

## 6. Validação e feedback visual para agentes

Permita produzir capturas reproduzíveis contendo fase, variante, viewport, câmera e revisão do conteúdo.

Armazene evidências temporárias em `.tmp/evidence/`, sem versionar screenshots transitórios.

Valide:

- Renderização Phaser embutida no World Lab.
- Alternância de variantes sem alterar gameplay.
- Integridade das texturas, frames e proporções.
- Ausência de alterações nas colisões e nos mapas lógicos.
- Compatibilidade com capítulos independentes e fases legadas.
- Ausência de mutações nos saves de produção.

Execute testes dirigidos durante a implementação e validação completa no fechamento, conforme `AGENTS.md`, sem duplicar typecheck desnecessariamente.

Faça homologação no navegador quando o ambiente permitir. Não declare essa homologação realizada sem evidências.

## Restrições

- Não criar outro motor de renderização, sistema de física ou asset manager.
- Não desenvolver um editor drag-and-drop completo nesta etapa.
- Não alterar combate, narrativa, progressão ou composição procedural.
- Não baixar novos pacotes sem necessidade.
- Não alterar assets originais sem justificativa e registro de proveniência.
- Não implementar correções específicas do Igapó no núcleo compartilhado.
- Preservar os mecanismos de autoria independente criados nas etapas 9.7A–9.7C.
- Seguir o processo de SPEC, registro de prompts e commits previsto em `AGENTS.md`.

## Entrega

Disponibilize um World Lab com inspeção estrutural e prévia artística real, comparação entre variantes e referências formais de escala e direção de arte.

Apresente um relatório compacto com arquivos alterados, validações, evidências visuais, limitações e próximos passos.

A implementação deve permitir que novos agentes criem fases com pacotes 2D diferentes, mantendo uma identidade visual e proporções coerentes sem modificar o motor.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: capturas temporárias `97d-world-lab-compare-2.png` (SHA-256 `a04d5042ee98297eb86194c019fdaac33e7723f74dfdb3d40065677aeae7e12a`) e `97d-world-lab-visual-2.png` (SHA-256 `92793accd820458d20d142f9042321d2f99b2bc92e1db226d0e047cd466a0d93`) foram geradas e inspecionadas em 1280×720; removidas de `.tmp/evidence/` antes da entrega conforme a política do repositório.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
