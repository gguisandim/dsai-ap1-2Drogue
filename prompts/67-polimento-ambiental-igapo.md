# Registro de prompt: polimento ambiental e direção de arte do Igapó

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-10-polimento-ambiental-igapo`
- Data: `2026-11-10`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-10-polimento-ambiental-igapo-das-memorias.md`
- Commit: `pendente`
- Execução: `Aprovada — testes dirigidos, build, suíte completa (1.174), homologação de fase e campanha, gates e diff-check`

## Arquivos modificados

- `SPEC/2026-11-10-polimento-ambiental-igapo-das-memorias.md`
- `SPEC/README.md`
- `docs/art-direction.md`
- `docs/autoria-capitulos-e-assets.md`
- `prompts/67-polimento-ambiental-igapo.md`
- `scripts/homologate-chapter.mjs`
- `src/assets/aguas/README.md`
- `src/assets/aguas/igapo-canopy-bough.svg`
- `src/assets/aguas/igapo-canopy-shadow.svg`
- `src/assets/aguas/igapo-emergent-tree.svg`
- `src/assets/aguas/igapo-forest-floor.svg`
- `src/assets/aguas/igapo-ground-moss.svg`
- `src/assets/aguas/igapo-light-shaft.svg`
- `src/assets/aguas/igapo-memory-stela.svg`
- `src/assets/aguas/igapo-palm-cluster.svg`
- `src/assets/aguas/igapo-root-tangle.svg`
- `src/assets/aguas/igapo-shore-fringe.svg`
- `src/assets/aguas/igapo-stilt-hut.svg`
- `src/assets/aguas/igapo-submerged-trunk.svg`
- `src/assets/aguas/igapo-water-lily.svg`
- `src/presentation/assets/bootIgapoAssets.ts`
- `src/presentation/assets/igapoAssetCatalog.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/igapoAssets.test.ts`
- `src/tests/igapoPresentations.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/stageAmbientPresentation.test.ts`
- `src/tests/stageVisualPresentation.test.ts`
- `src/tests/worldLabPoi.test.ts`
- `src/tests/worldLabPresentation.test.ts`

## Prompt efetivamente recebido

```text
Etapa — Polimento ambiental e direção de arte do Igapó sem limitação mental ao pack atual
Trabalhe sobre a fase Igapó das Memórias já existente no Umbra Trail.
Objetivo central
Melhorar significativamente o cenário do Igapó para que ele seja imediatamente reconhecível como um igapó amazônico, preservando sua função jogável, narrativa e integração com a campanha.
Importante
O resultado final continua sendo uma fase 2D top-down dentro do runtime atual do projeto, mas não limite o planejamento artístico ao pack 2D já existente.

Pense primeiro no ambiente ideal que o Igapó deveria comunicar, e só depois decida como concretizá-lo com:
- recomposição do mapa,
- reaproveitamento inteligente dos assets atuais,
- camadas, overlays, sombras e efeitos,
- reescala ou reuso de elementos visuais,
- e, se necessário, criação/adaptação mínima de novos assets compatíveis, desde que coerentes com a arquitetura e com o pipeline do projeto.
Não trate os assets atuais como limite criativo absoluto. Trate-os como ponto de partida.
1. Diagnóstico inicial obrigatório
Antes de alterar a fase:
1. identifique com precisão os arquivos responsáveis pelo Igapó:
   - definição da fase,
   - visuais/apresentação,
   - mapa/layout,
   - decoração,
   - narrativa,
   - missão,
   - saída para o Coração Corrompido,
   - renderer e validações relevantes.
2. registre no relatório:
   - quais arquivos definem a geometria,
   - quais definem a direção de arte,
   - quais definem NPCs, missão e progressão,
   - quais partes da identidade visual atual fazem o mapa parecer pouco convincente como igapó.
3. diferencie claramente:
   - problemas de layout,
   - problemas de composição visual,
   - problemas de asset insuficiente,
   - problemas de legibilidade ou repetição.
2. Direção de arte pretendida
O Igapó deve parecer uma floresta amazônica inundada, ancestral e mística.
A fase deve transmitir:
- água dominando boa parte do espaço,
- árvores emergindo da água,
- raízes expostas e entrelaçadas,
- pequenas ilhas e passagens naturais,
- vegetação aquática,
- sombra filtrada pelas copas,
- sensação de memória, silêncio e profundidade,
- presença de elementos ribeirinhos e espirituais sem descaracterizar a floresta.
Evitar:
- aparência de pântano genérico,
- blocos grandes e geométricos de terra/água,
- floresta “quadrada”,
- vegetação repetida demais,
- espaços amplos demais sem identidade,
- cenário que parece só “funcional” em vez de evocativo.
3. Regra criativa importante: não se limitar ao 2D atual
Planeje o cenário como um diretor de arte, não como alguém preso ao tile atual.

Isso significa:
- se o map pack atual não expressa bem um igapó, primeiro descreva o que está faltando visualmente;
- em seguida, implemente a melhor solução viável sem quebrar a arquitetura:
  - recomposição,
  - novos agrupamentos,
  - sobreposição de elementos,
  - foreground/background,
  - variações ambientais,
  - sombras e profundidade,
  - sinalização visual de áreas úmidas, rasas e profundas,
  - e, se necessário, novos elementos autorais mínimos.
Exemplos do que pode ser criado ou adaptado se necessário:
- conjuntos de raízes maiores,
- troncos meio submersos,
- ilhas orgânicas pequenas,
- vegetação aquática,
- marcas rituais ligadas à água,
- elementos ribeirinhos discretos,
- variações de margem entre terra e água,
- first-plane foliage para profundidade,
- marcos ambientais próprios do Igapó das Memórias.
Se forem propostos novos assets, mantenha:
- proporção compatível,
- perspectiva top-down coerente,
- leitura clara,
- estilo consistente com o jogo,
- integração possível ao pipeline do projeto.
4. Melhorias esperadas no cenário
4.1 Água e terreno
- tornar os limites entre água e terra mais orgânicos;
- criar canais, curvas, áreas rasas, áreas profundas e pequenas ilhas;
- evitar a leitura de “bloco de água ao lado de bloco de grama”.
4.2 Árvores e raízes
- reforçar árvores alagadas e raízes aparentes;
- criar conjuntos visuais mais marcantes;
- incluir passagens sob/coperto por raízes quando fizer sentido;
- fazer a floresta parecer viva e antiga.
4.3 Profundidade visual
- usar camadas de fundo, plano jogável e primeiro plano;
- melhorar a sensação de densidade;
- permitir que alguns trechos pareçam mais fechados e outros mais contemplativos.
4.4 Ritmo ambiental
organizar o mapa em beats visuais:
- entrada / acolhimento ambiental,
- trecho mais contemplativo,
- trecho mais apertado,
- trecho com encontro,
- trecho ritual ou memorial,
- trecho de progressão para a saída.
4.5 Identidade local
incluir elementos que reforcem a identidade amazônica e mística:
- vestígios ribeirinhos,
- marcas espirituais,
- pontos de memória,
- sinais de ocupação leve,
- relação entre água e ancestralidade.
5. Relação com a narrativa e gameplay
Preservar obrigatoriamente:
- missão do Vestígio Submerso,
- desbloqueio da saída,
- progressão para o Coração Corrompido,
- NPCs e função narrativa,
- papel do Igapó na campanha.
Os ajustes visuais não podem:
- bloquear caminhos,
- piorar colisão,
- tornar encontros ilegíveis,
- dificultar leitura da missão,
- prejudicar a saída ou a orientação do jogador.
O cenário deve reforçar a história, não competir com ela.
6. Liberdade controlada para solução visual
Se a melhoria real exigir algo além de rearranjar tiles existentes, você pode:
- criar/adaptar ativos mínimos,
- propor variações visuais leves,
- criar composições mais ricas com os elementos disponíveis,
- e usar referências conceituais internas no relatório.
Mas:
- não crie um pipeline totalmente novo,
- não mude o motor,
- não transforme a fase em outro estilo de jogo,
- não quebre compatibilidade com World Lab, campanha, validações e runtime atual.
7. Validação obrigatória
Após a implementação:
1. validar no World Lab;
2. verificar transitabilidade real do personagem;
3. confirmar que NPCs, missão, saída e transição continuam funcionando;
4. comparar antes/depois visualmente;
5. medir impacto estrutural ou de performance se houver aumento de complexidade;
6. executar testes dirigidos;
7. realizar homologação jogável real no Phaser.
Não declarar sucesso apenas porque o mapa ficou “mais bonito”; ele precisa continuar jogável e integrado.
8. Entrega esperada
Entregar:
- lista de arquivos alterados;
- diagnóstico do que fazia o Igapó parecer insuficiente;
- descrição das decisões de direção de arte;
- explicação do que foi resolvido por composição e do que exigiu novos elementos;
- resultado de transitabilidade, missão, saída e campanha;
- comparação visual antes/depois;
- limitações restantes.
Critério principal de sucesso
O Igapó das Memórias deve continuar funcionando como fase da campanha, mas passar a ter uma identidade visual muito mais forte e convincente de floresta amazônica inundada, sem ficar preso mentalmente às limitações do pack 2D atual.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
