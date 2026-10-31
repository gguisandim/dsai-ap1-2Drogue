# Registro de prompt: Etapa 9.7C — Registro, execução visual e assets reais

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-7c-registro-execucao-visual-assets`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-7c-registro-execucao-visual-assets.md`
- Commit: `pendente`
- Execução: `concluída; 82 suítes/1066 testes aprovados; npm run build aprovado; check:gates e git diff --check aprovados; homologação visual real com Edge headless via CDP em 1280x720: Igapó A/B no mesmo mapa/câmera, capítulo gerado pela CLI (diálogo, missão, encontro, recompensa, saída e retorno ao menu), saída do Igapó e World Lab A/B com variante alternada; screenshots em .tmp/evidence`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-7c-registro-execucao-visual-assets.md`
- `SPEC/README.md`
- `README.md`
- `docs/autoria-capitulos-e-assets.md`
- `prompts/46-etapa-9-7c-registro-execucao-visual-assets.md`
- `scripts/check-traceability.mjs`
- `src/vite-env.d.ts`
- `src/main.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/stageExitSelection.ts`
- `src/application/stages/GameSessionService.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/presentation/assets/punyAssetCatalog.ts`
- `src/presentation/assets/bootPunyAssets.ts`
- `src/assets/puny/README.md`
- `src/assets/puny/puny-world-tiles.png`
- `src/assets/puny/puny-mage-cyan.png`
- `src/assets/puny/puny-warrior-red.png`
- `src/assets/puny/puny-archer-purple.png`
- `src/assets/puny/puny-warrior-red-128.png`
- `src/assets/puny/puny-archer-purple-128.png`
- `src/stages/contracts/StageLoad.ts`
- `src/stages/contracts/StageManifest.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageLoader.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/devtools/chapter-preview/ChapterPreviewService.ts`
- `src/devtools/chapter-preview/authoringPreview.ts`
- `src/devtools/chapter-preview/index.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSession.ts`
- `src/devtools/world-lab/main.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/generator.ts`
- `src/cli/chapter/inspect.ts`
- `src/cli/chapter/preview.ts`
- `src/cli/chapter/render.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/examples/chapter-template/README.md`
- `src/examples/chapters/homologacao-9-7c/AUTHORING.md`
- `src/examples/chapters/homologacao-9-7c/README.md`
- `src/examples/chapters/homologacao-9-7c/chapter.ts`
- `src/examples/chapters/homologacao-9-7c/encounter.ts`
- `src/examples/chapters/homologacao-9-7c/ids.ts`
- `src/examples/chapters/homologacao-9-7c/index.ts`
- `src/examples/chapters/homologacao-9-7c/level.ts`
- `src/examples/chapters/homologacao-9-7c/narrative.ts`
- `src/examples/chapters/homologacao-9-7c/presentation.ts`
- `src/examples/chapters/homologacao-9-7c/registration.ts`
- `src/examples/chapters/homologacao-9-7c/stage.ts`
- `src/examples/chapters/homologacao-9-7c/template.ts`
- `src/tests/stageAmbientPresentation.test.ts`
- `src/tests/stageEntityPresentation.test.ts`
- `src/tests/stageVisualPresentation.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/worldLabPoi.test.ts`
- `src/tests/punyAssets.test.ts`
- `src/tests/chapterPreview.test.ts`
- `src/tests/igapoPresentations.test.ts`
- `src/tests/worldLabPresentation.test.ts`
- `src/tests/chapterCliVisualPreview.test.ts`
- `src/tests/individualExit.test.ts`

## Prompt efetivamente recebido

````text
# Etapa 9.7C — Registro, Execução Visual e Integração de Assets Reais

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.7B.

## Objetivo

Concluir o fluxo de autoria independente e implementar uma prova de conceito visual utilizando assets reais no **Igapó das Memórias**.

A etapa possui dois objetivos complementares:

1. Permitir que capítulos criados pela CLI sejam registrados em ambiente de desenvolvimento e executados visualmente no Phaser.
2. Substituir parte dos placeholders do Igapó por sprites e tiles reais dos pacotes gratuitos CC0 Puny World, Puny Characters e, quando necessário, Puny Dungeon.

**O resultado deve demonstrar tanto a independência arquitetural dos capítulos quanto a capacidade do motor de renderizar diferentes identidades visuais para o mesmo mapa lógico.**

Não criar outro framework de capítulos, outro renderer ou outro sistema de assets.

## 1. Inspeção obrigatória

Antes de alterar código:

- Ler `AGENTS.md`.
- Ler as SPECs 9.5B.1, 9.5B.2, 9.7A e 9.7B.
- Inspecionar `StagePresentation`, `StageVisualRegistry` e `StageMapRenderer`.
- Inspecionar `StageLoader`, `StageRegistry` e `StageValidator`.
- Inspecionar `GameSessionService`, `GameScene`, `GameModesScene` e o bootstrap Phaser.
- Inspecionar `src/examples/chapter-template/`.
- Inspecionar a CLI em `src/cli/chapter/`.
- Inspecionar os módulos do Igapó, especialmente `igapoVisuals.ts` e `igapoDasMemorias.ts`.
- Inspecionar os registries de assets, texturas, spritesheets e animações.
- Inspecionar a integração com World Lab.
- Verificar as regras dos architecture gates.
- Executar `git status --short`.

Preservar alterações anteriores.

Identificar o que já funciona antes de criar novas abstrações.

## 2. Recursos gráficos autorizados

Utilizar preferencialmente as versões gratuitas CC0 do autor Shade.

Fontes:

**Puny World**
- https://opengameart.org/content/16x16-puny-world-tileset
- https://merchant-shade.itch.io/16x16-puny-world

**Puny Characters — versão gratuita**
- https://opengameart.org/content/puny-characters
- https://merchant-shade.itch.io/16x16-puny-characters

**Puny Dungeon**
- https://opengameart.org/content/16x16-puny-dungeon-tileset

Confirmar a licença da versão efetivamente baixada.

Atenção: não confundir Puny Characters gratuito com a versão paga Editor Edition. Para Puny Dungeon, utilizar como referência preferencial a distribuição identificada como CC0 no OpenGameArt, pois metadados de outras páginas podem divergir.

Não utilizar arquivos cuja licença não tenha sido confirmada.

Se downloads não estiverem acessíveis no ambiente, procurar primeiro arquivos já existentes no projeto. Não inventar downloads ou afirmar que assets foram integrados quando não estiverem disponíveis.

Documentar qualquer impedimento.

## 3. Inventário e seleção dos assets

Inspecionar o conteúdo real dos pacotes antes de integrar.

Selecionar apenas os recursos necessários para a demonstração.

Priorizar:

- Piso de grama e terra.
- Trilhas e terreno úmido.
- Água e bordas de rios.
- Árvores e vegetação.
- Pedras e troncos.
- Elementos decorativos.
- Sprite de NPC.
- Sprite ou spritesheet de inimigo.
- Elementos adicionais de dungeon somente se forem visualmente coerentes.

Não copiar arquivos desnecessários.

Não importar os pacotes completos para produção.

Preservar spritesheets originais quando forem mais adequados que arquivos individuais.

Verificar dimensões, índices de frames, transparência, alinhamento e animações.

## 4. Registro e documentação de licenças

Criar documentação de procedência dos recursos integrados.

Registrar para cada conjunto:

- Nome do pacote.
- Autor.
- URL original.
- Licença.
- Versão ou data, quando disponível.
- Arquivos de origem.
- Arquivos efetivamente incorporados.
- Modificações realizadas.
- Destino no projeto.

Quando possível, registrar hashes dos arquivos de origem.

Não misturar assets CC0 com recursos de outra licença sem identificação explícita.

Manter os créditos de procedência mesmo quando a licença não exigir atribuição.

## 5. Pipeline local de assets

Integrar os recursos reais ao pipeline existente do Phaser.

Requisitos:

1. IDs de recursos estáveis.
2. Carregamento local de texturas e spritesheets.
3. Resolução pelos registries existentes.
4. Associação declarativa aos stages.
5. Tratamento de recursos ausentes.
6. Prevenção de carregamentos duplicados.
7. Compatibilidade com reload e troca de fases.
8. Fallback legado.

Observar que tiles de Puny World são predominantemente 16×16, enquanto alguns sprites de Puny Characters utilizam canvas 32×32.

Adaptar apresentação e escala sem modificar as dimensões lógicas do mapa.

Utilizar nearest-neighbor/pixel-perfect quando apropriado.

Não alterar colisões ou hitboxes em função do tamanho visual dos sprites.

Não criar outro asset manager.

## 6. Duas apresentações visuais do Igapó

Criar pelo menos duas apresentações coerentes para o mesmo mapa lógico.

Sugestões:

**Apresentação A — Igapó Ribeirinho**

- Vegetação mais clara.
- Água com aparência natural.
- Árvores e trilhas visíveis.
- Ambientação de floresta úmida.
- NPC e inimigos com sprites reais.

**Apresentação B — Igapó Sombrio**

- Vegetação escurecida.
- Paleta verde-azulada.
- Atmosfera de floresta alagada.
- Névoa leve.
- Decoração e iluminação diferentes.
- Mesmo conjunto de regras de gameplay.

As duas apresentações devem reutilizar os contratos existentes de apresentação.

Não basta renomear um tema ou aplicar tint sobre todos os placeholders anteriores: ambas devem demonstrar utilização efetiva de arte real, com diferenças perceptíveis de terreno, decoração ou composição visual.

A segunda apresentação pode reutilizar parte do mesmo atlas, desde que produza uma identidade visual distinta.

## 7. Preservação do mapa lógico

**Este é um requisito obrigatório.**

As duas apresentações devem utilizar exatamente a mesma definição lógica de fase.

Preservar:

- Seed.
- Dimensões.
- Matriz de tiles lógicos.
- Transitabilidade.
- Obstáculos.
- Colisões.
- Hazards.
- Spawn do jogador.
- Spawns de inimigos.
- NPCs.
- Pontos de interação.
- Âncoras de saída.
- Destinos.
- Encontros.
- Progressão narrativa.

Uma textura de água não pode transformar um tile transitável em bloqueado, nem o contrário.

Decorações continuam sem colisão, salvo se o motor já possuir contrato explícito para outra finalidade.

A seleção da apresentação não pode alterar saves ou identidades persistidas.

Evitar variações aleatórias não determinísticas.

## 8. Seleção das duas apresentações

Utilizar o mecanismo existente de temas e apresentações.

Se ele ainda não permitir alternar entre duas configurações para o mesmo stage, adicionar a menor extensão declarativa necessária.

A seleção poderá ser feita por configuração de desenvolvimento ou controle isolado de preview.

Não criar uma segunda fase lógica apenas para representar outra aparência.

Não duplicar a narrativa ou os encontros do Igapó.

Não incluir seleção de aparência no menu principal de produção se isso exigir expansão desnecessária.

A escolha deve ser reproduzível e não depender de `Math.random()`.

## 9. Registro de capítulos gerados pela CLI

A 9.7B cria capítulos em:

`src/examples/chapters/<slug>/`

Resolver o fluxo de integração desses capítulos com o ambiente real de desenvolvimento.

Investigar primeiro a restrição dos architecture gates que impede mover diretamente módulos para:

`src/stages/chapters/<slug>/`

Definir um caminho de registro ou promoção que respeite as fronteiras arquiteturais.

Priorizar:

- Registro explícito.
- Uso dos contratos públicos.
- Separação entre conteúdo e bootstrap.
- Catálogo de produção preservado.
- Diagnósticos tipados.
- Nenhuma alteração específica em `GameScene`.

Se a promoção para o diretório canônico exigir mudanças grandes, preferir um mecanismo de desenvolvimento estável e documentar a promoção como operação explícita futura.

Não enfraquecer os architecture gates para fazer o conteúdo compilar.

Não implementar descoberta automática de código arbitrário recebido de terceiros.

## 10. Preview visual real de capítulos

Estender o comando existente:

`npm run chapter -- preview <slug>`

O comando atualmente executa validação e projeção headless.

Implementar um caminho real de preview visual, preferencialmente por opção explícita, preservando o comportamento atual quando necessário.

O fluxo deve:

1. Localizar o capítulo.
2. Validar seus dados.
3. Preparar registro isolado de desenvolvimento.
4. Disponibilizar o capítulo ao bootstrap Phaser.
5. Inicializar uma sessão individual.
6. Carregar mapa, NPCs, encontros e apresentação.
7. Permitir jogar e concluir a fase.
8. Retornar ao menu.
9. Não modificar o catálogo de produção.
10. Não gravar saves da campanha principal.

Reutilizar `GameSessionService.startIndividualStage`.

Reutilizar `GameScene`, `StageLoader` e os registries existentes.

O preview deve usar o pipeline de build e importação suportado por Vite, sem avaliar código remoto ou aceitar caminhos arbitrários de módulos.

Capítulos TypeScript locais são código executável e devem ser tratados como conteúdo de desenvolvimento confiável, não como sandbox de plugins de terceiros.

Não criar outro visualizador.

## 11. Igapó jogável com assets reais

Integrar as apresentações A e B ao caminho real de execução da fase.

Verificar:

- Tiles renderizados corretamente.
- Vegetação posicionada corretamente.
- Água visualmente coerente.
- Decorações sem colisão.
- NPC visível e interativo.
- Inimigos com apresentação apropriada.
- Animações válidas.
- Camadas e profundidades corretas.
- Saídas acessíveis.
- Legibilidade do jogador e dos inimigos.
- Ausência de artefatos ou bordas incorretas dos spritesheets.

Não modificar lógica narrativa, combate, IA ou progressão para acomodar os novos assets.

Não introduzir condicionais como `if (stageId === 'stage.aguas.igapo-das-memorias')` no motor.

Toda diferença visual deve vir dos manifests, registries e contratos existentes.

## 12. Integração com World Lab

Ampliar a inspeção existente para mostrar:

- Tema selecionado.
- Variante de apresentação.
- Tileset.
- Texturas.
- Spritesheets.
- IDs dos recursos.
- Frames e animações.
- Decorações.
- Origem dos assets.
- Recursos ausentes.
- Diagnósticos.

Quando viável, permitir alternar entre as duas apresentações do Igapó no ambiente de preview.

Não reconstruir o World Lab.

Não implementar um editor visual nesta etapa.

## 13. Prova de autoria independente

Executar o fluxo completo com um capítulo criado pela CLI:

`create → validate → inspect → preview visual → jogar → concluir`

O capítulo deve:

- Ser gerado pela CLI.
- Ser registrado de forma isolada.
- Ser descoberto pelo catálogo.
- Ser carregado pelo `StageLoader`.
- Renderizar na `GameScene`.
- Executar NPC, diálogo, missão e encontro.
- Aplicar recompensa.
- Encerrar corretamente.
- Retornar ao menu.
- Preservar os dados de produção.

Não adaptar o motor especificamente ao capítulo demonstrativo.

Caso a homologação visual não seja possível no ambiente, não afirmar que a etapa foi homologada visualmente. Reportar a evidência automatizada e a pendência exata.

## 14. Testes obrigatórios

Adicionar ou atualizar testes para:

**Registro e autoria**
- Capítulo criado pela CLI.
- Registro isolado.
- Descoberta no catálogo.
- Validação e carregamento.
- Ausência no catálogo de produção.
- Compatibilidade dos architecture gates.

**Assets**
- Licença e procedência documentadas.
- IDs válidos.
- Arquivos locais existentes.
- Texturas e spritesheets válidos.
- Frames dentro dos limites.
- Recursos não encontrados.
- Fallback legado.
- Carregamento pelo pipeline Phaser.

**Apresentações**
- Apresentação A.
- Apresentação B.
- Diferença efetiva entre recursos visuais.
- Mesma geometria lógica.
- Mesmas colisões.
- Mesmos spawns.
- Mesmas saídas.
- Mesmos encontros.
- Determinismo da seleção.

**Integração**
- Preview da CLI.
- Sessão individual.
- Renderização Phaser quando testável.
- NPC e diálogo.
- Encontro.
- Recompensa.
- Conclusão.
- Retorno ao menu.
- Compatibilidade com campanhas existentes.
- World Lab.

Priorizar testes de comportamento e integração real.

Não criar testes que apenas comparem strings de nomes de temas como substituto de evidência visual.

## 15. Homologação visual

Quando houver navegador disponível, realizar:

1. Abrir o Igapó na apresentação A.
2. Inspecionar terreno, água, vegetação e personagens.
3. Registrar captura de tela.
4. Abrir o mesmo mapa na apresentação B.
5. Registrar captura de tela equivalente.
6. Comparar geometria, posições e diferenças visuais.
7. Interagir com NPC.
8. Executar encontro.
9. Testar saída.
10. Abrir e jogar o capítulo criado pela CLI.
11. Confirmar ausência de erros de textura e animação.
12. Verificar o World Lab.

Usar a mesma seed, resolução e posição de câmera quando possível.

Registrar screenshots ou outras evidências reais quando disponíveis.

**Não declarar homologação visual apenas porque o build, testes headless ou registros de assets passaram.**

Se o navegador estiver indisponível, entregar a integração testável e descrever precisamente o procedimento de homologação manual.

## 16. Organização para o DeepSeek

Dividir o trabalho em três incrementos.

### Incremento A — Registro e preview

- Auditar o fluxo da CLI.
- Resolver registro isolado.
- Integrar bootstrap de desenvolvimento.
- Preparar preview Phaser.
- Executar testes direcionados.

### Incremento B — Assets e apresentações

- Verificar licenças.
- Selecionar arquivos necessários.
- Registrar origem.
- Integrar texturas e spritesheets.
- Criar apresentações A e B.
- Conectar Igapó ao pipeline real.
- Executar testes visuais dirigidos.

### Incremento C — Prova e validação

- Testar capítulo gerado pela CLI.
- Validar World Lab.
- Inspecionar apresentação real quando disponível.
- Atualizar documentação.
- Executar regressões.
- Executar suíte completa e gates.
- Elaborar relatório final.

Não executar a suíte completa entre incrementos.

Não duplicar typecheck e build sem necessidade.

Se houver interrupção por limite de uso, preservar os arquivos e registrar exatamente o ponto pendente.

## 17. Restrições

- Não criar outro framework de capítulos.
- Não criar outro registry visual.
- Não criar outro renderer.
- Não criar outro formato de manifesto.
- Não criar outro sistema de assets.
- Não modificar a geração procedural.
- Não alterar a composição de campanhas.
- Não alterar narrativa.
- Não alterar combate ou IA.
- Não alterar colisões.
- Não modificar saves.
- Não adicionar nove fases fictícias à produção.
- Não implementar editor.
- Não implementar marketplace.
- Não implementar carregamento remoto.
- Não utilizar recursos sem licença verificada.
- Não incluir pacotes completos sem necessidade.
- Não alterar os architecture gates para contornar violações.
- Não criar commit nem executar push.

Preservar integralmente as fases legadas.

## 18. Documentação

Criar a SPEC:

`SPEC/2026-10-31-etapa-9-7c-registro-execucao-visual-assets.md`

Atualizar `SPEC/README.md`.

Criar o próximo registro disponível em `prompts/`, seguindo `umbra-prompt-record/v1`.

O último registro conhecido é 45. Verificar se o número 46 está disponível.

Atualizar também a documentação da CLI e do template.

Incluir um inventário de assets e suas licenças, preferencialmente próximo dos arquivos incorporados.

Documentar:

- Fluxo de registro de capítulos.
- Como executar preview visual.
- Como selecionar as apresentações A e B.
- Como adicionar recursos gráficos.
- Como substituir placeholders.
- Como validar spritesheets.
- Como homologar no navegador.
- Limitações restantes.
- Preparação para a 10.0.

## 19. Validações finais

Após a última alteração executável, executar:

- Testes dirigidos de CLI e registro.
- Testes de StageLoader e StageValidator.
- Testes de apresentação e registry visual.
- Testes de assets.
- Testes de renderização Phaser.
- Testes de World Lab.
- Testes de compatibilidade das campanhas.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes.

## 20. Relatório final

Entregar relatório objetivo com:

1. Arquivos criados e modificados.
2. Registro e execução de capítulos independentes.
3. Funcionamento real do preview.
4. Assets Puny incorporados.
5. Fontes e licenças verificadas.
6. Diferenças entre as apresentações A e B.
7. Garantias de preservação do mapa lógico.
8. Integração de spritesheets e animações.
9. Resultado da execução do Igapó.
10. Resultado da execução do capítulo criado pela CLI.
11. Integração com World Lab.
12. Testes e validações.
13. Homologação visual realmente executada.
14. Limitações restantes.
15. Estado para commit.
16. Pendências da Etapa 10.0.

## Critério de conclusão

A Etapa 9.7C deverá entregar:

**Autoria independente:** um capítulo gerado pela CLI pode ser registrado, carregado e executado em uma sessão individual real, sem alterações específicas no motor.

**Integração artística:** o Igapó utiliza assets 2D reais e possui pelo menos duas apresentações visuais distintas para o mesmo mapa lógico, mantendo colisões, narrativa, combate, saídas e saves.

**Rastreabilidade:** todos os recursos incorporados têm origem e licença documentadas.

**Homologação:** a execução visual deve ser comprovada no navegador quando o ambiente permitir. Se não permitir, registrar a limitação sem substituir evidências reais por testes headless.

Não criar commit nem executar push. Entregar implementação, testes, documentação, inventário de assets e relatório factual.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
