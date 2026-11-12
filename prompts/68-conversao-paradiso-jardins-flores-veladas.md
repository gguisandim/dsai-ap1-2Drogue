# Registro de prompt: conversão de Paradiso Gardens em Jardins das Flores Veladas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-12-conversao-paradiso-jardins-flores-veladas`
- Data: `2026-11-12`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-12-conversao-paradiso-jardins-flores-veladas.md`
- Commit: `pendente`
- Execução: `npm run chapter -- capabilities --json` (OK); `npm run chapter -- plan validate flores-veladas --chapters-dir src/stages/chapters --json` (PASS); `npm run chapter -- validate flores-veladas --chapters-dir src/stages/chapters` (PASS, 1 warning esperado de milestone narrativo); `npm run chapter -- inspect flores-veladas --chapters-dir src/stages/chapters --json` (PASS); `npm run chapter -- preview flores-veladas --chapters-dir src/stages/chapters` (OK); `npm run chapter -- playtest flores-veladas --chapters-dir src/stages/chapters --json` (PASS, 25 checks, 4 verificações live não executadas pela análise estática); `npm run chapter -- homologate --stage level_08_paradiso --json` (PASS no Phaser real); testes dirigidos (PASS); `scripts/auditar-segredos-prompts.ps1 prompts/68-conversao-paradiso-jardins-flores-veladas.md` (PASS); `npm run check:gates` (PASS); `npm run build` (PASS após nova execução fora do sandbox devido a bloqueio de leitura do Vite/esbuild); `npm test -- --runInBand` (PASS, 94 suítes e 1181 testes); `git diff --check` (PASS).

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-12-conversao-paradiso-jardins-flores-veladas.md`
- `docs/evidence/flores-veladas-2026-11-12/README.md`
- `docs/evidence/flores-veladas-2026-11-12/01-entrada.png`
- `docs/evidence/flores-veladas-2026-11-12/02-primeiro-npc.png`
- `docs/evidence/flores-veladas-2026-11-12/03-combate-e-clareira.png`
- `docs/evidence/flores-veladas-2026-11-12/04-conclusao-e-saida.png`
- `docs/evidence/flores-veladas-2026-11-12/homologacao-runtime.json`
- `prompts/68-conversao-paradiso-jardins-flores-veladas.md`
- `src/assets/flores/README.md`
- `src/assets/flores/flores-bromeliad-cluster.svg`
- `src/assets/flores/flores-canopy-bough.svg`
- `src/assets/flores/flores-forest-floor.svg`
- `src/assets/flores/flores-heliconia-arch.svg`
- `src/assets/flores/flores-light-shaft.svg`
- `src/assets/flores/flores-monumental-tree.svg`
- `src/assets/flores/flores-orchid-veil.svg`
- `src/assets/flores/flores-pollinator-nest.svg`
- `src/data/LevelData.ts`
- `src/devtools/world-lab/fixtures/fixtureCatalog.ts`
- `src/presentation/assets/bootFloresAssets.ts`
- `src/presentation/assets/floresAssetCatalog.ts`
- `src/scenes/BootScene.ts`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/chapters/flores-veladas/index.ts`
- `src/stages/chapters/flores-veladas/stage-plan.json`
- `src/stages/chapters/flores-veladas/veiledGardensMap.ts`
- `src/stages/chapters/flores-veladas/veiledGardensStage.ts`
- `src/stages/chapters/flores-veladas/visuals.ts`
- `src/stages/compatibility/LegacyStageAdapter.ts`
- `src/stages/index.ts`
- `src/tests/campaignMacroRouteBinding.test.ts`
- `src/tests/stageLegacyCompatibility.test.ts`
- `src/tests/stageLoaderLegacy.test.ts`
- `src/tests/veiledGardens.test.ts`

## Prompt efetivamente recebido

```text
# Umbra Trail — Conversão de fase legada em capítulo autoral: Jardins das Flores Veladas

## Missão

Transforme uma fase legada existente do Umbra Trail em uma **fase autoral completa, panorâmica, narrativa e visualmente elaborada**, seguindo o padrão de qualidade alcançado na Floresta das Raízes e no Igapó das Memórias.

**Fase candidata:** `Paradiso Gardens`.

**Arquivo de origem conhecido:** `src/data/LevelData.ts`.

**Nova identidade proposta:** Jardins das Flores Veladas.

**Região candidata:** `region.floresta.flores`, definida no esqueleto macro de campanha.

Não crie uma fase duplicada deixando a original abandonada. O objetivo é migrar ou transformar conteúdo legado existente, com integração e compatibilidade verificadas.

O projeto já possui as ferramentas de autoria, gameplay, apresentação e homologação necessárias. Reutilize-as.

## A. Auditoria obrigatória da fase original

Antes de editar:

1. Localize `Paradiso Gardens` em `src/data/LevelData.ts`.
2. Identifique seu ID técnico exato, dimensões, geometria, inimigos, itens, saídas e dependências.
3. Inspecione os registros em `src/stages/compatibility/`, o catálogo, o fluxo clássico e os modos de jogo.
4. Verifique se a fase é referenciada por saves, testes, campanhas ou mapas auxiliares.
5. Confirme a existência e o papel de `region.floresta.flores`.
6. Analise a implementação autoral da Floresta das Raízes e do Igapó.

Use como referências técnicas e visuais:

- `src/stages/chapters/raiz-do-mundo/`
- `src/stages/chapters/aguas/` (localizar o caminho efetivo)
- `src/assets/world-root/`
- `src/assets/aguas/`
- `docs/evidence/raiz-do-mundo-2026-11-06/`
- `docs/evidence/raiz-do-mundo-2026-11-06-continuacao/`
- `src/presentation/stages/`
- `src/devtools/world-lab/`
- `docs/stage-authoring.md`
- `AGENTS.md`

Registre a identificação e as dependências da fase antes da transformação.

Se `Paradiso Gardens` não existir na versão atual, não invente seu ID. Localize a fase legada equivalente ou documente a impossibilidade da conversão.

## B. Direção narrativa — Jardins das Flores Veladas

Crie uma história própria para a fase, relacionada à Rota da Floresta.

### Premissa

Existe uma região onde as árvores e flores desenvolvem formas extraordinárias. As flores não apenas acompanham a luz: algumas respondem aos sons, ao movimento e à presença de criaturas.

Recentemente, uma parte dos jardins parou de florescer. Os caminhos estão sendo tomados por vegetação desordenada, e criaturas que antes participavam do equilíbrio do lugar passaram a defender agressivamente determinados territórios.

O jogador precisa investigar essa alteração, descobrir a relação entre as flores e seus polinizadores e restaurar a passagem pelo jardim.

A história deve ser mística, mas coerente e relativamente autônoma. Não repetir a história das raízes ancestrais nem a das memórias submersas.

### Estrutura narrativa mínima

1. Entrada e descoberta da região.
2. Contato com um NPC que apresenta o problema.
3. Exploração e descoberta de pistas ambientais.
4. Primeiro encontro de combate contextualizado.
5. Investigação de uma clareira que perdeu sua floração.
6. Interação narrativa decisiva ligada ao equilíbrio do jardim.
7. Desbloqueio da saída e conclusão da fase.

Crie diálogos de qualidade, pequenos acontecimentos durante a exploração e um desfecho que produza consequências narrativas persistentes quando os contratos atuais permitirem.

## C. Direção de arte — mesmo nível de ambição da Floresta das Raízes

**Não limite a arte ao tileset Puny nem à composição convencional de quadrados de 32 px.**

O motor continua Phaser 2D top-down, mas a arte pode utilizar SVGs autorais, spritesheets, composições de múltiplas camadas, transparências, elementos de primeiro plano e efeitos ambientais compatíveis com o renderer existente.

Planeje a identidade visual antes de escolher os assets.

### Elementos desejados

- Árvores amazônicas monumentais, com copas de formas variadas.
- Bromélias, orquídeas, helicônias e outras plantas com referências botânicas adequadas.
- Cipós, folhas largas, troncos, raízes e vegetação rasteira.
- Clareiras com luz filtrada e mudanças de densidade vegetal.
- Pequenos igarapés ou áreas úmidas onde houver sentido ambiental.
- Estruturas naturais que sirvam de marcos de orientação.
- Flora mística original que não se confunda com vegetação comum.
- Camadas de sombra e vegetação de primeiro plano.
- Efeitos sutis de folhas, luz, partículas e movimento ambiental.

Não transformar a região em jardim europeu, pântano genérico, campo gramado ou cenário medieval.

### Liberdade artística

Caso os assets existentes sejam insuficientes:

1. Identifique o elemento visual ausente.
2. Crie recursos autorais compatíveis com a perspectiva e escala.
3. Integre-os ao catálogo de apresentação existente.
4. Documente a origem, licença, dimensões e organização dos recursos.
5. Garanta que não existem atlas com frames carregados incorretamente.

Não criar outro sistema de renderização.

## D. Level design panorâmico

A fase não pode continuar com a aparência de salas quadradas conectadas por corredores artificiais.

Transforme a geometria em um ambiente panorâmico orgânico, utilizando a infraestrutura já desenvolvida para a Floresta das Raízes e o Igapó.

O percurso deve possuir:

- entrada reconhecível;
- trilha principal sinuosa;
- bifurcações pequenas e opcionais;
- áreas ambientais com identidades distintas;
- clareiras próprias para diálogo e combate;
- passagens estreitas naturais;
- landmarks visíveis;
- área de conclusão;
- saída física integrada à campanha ou ao modo individual.

Não basta criar um mapa grande: o espaço precisa ser interessante de explorar.

Use o `stage-plan.json` e os contratos de autoria existentes para representar regiões, rotas, objetivos e encontros.

## E. NPCs e criaturas

Crie pelo menos dois NPCs com papéis diferentes e coerentes com a região. Um deve participar diretamente da missão principal; outro pode ampliar o mundo por meio de diálogo, observações ambientais ou uma interação secundária.

Os inimigos não devem aparecer em quantidade arbitrária.

Planeje encontros com progressão de dificuldade e uma justificativa ambiental: defesa territorial, desequilíbrio da fauna, perturbação do ecossistema ou reação a acontecimentos do jardim.

Utilize os arquétipos e capabilities existentes. Novas apresentações visuais podem ser criadas sem duplicar a lógica de IA ou combate.

Não introduzir um chefe obrigatório apenas para aumentar artificialmente o conteúdo.

## F. Migração arquitetural

A conversão deve usar:

- `ChapterManifest`
- `StageModule`
- `StageRegistry`
- `StageLoader`
- narrativa declarativa;
- `StageMapRenderer`;
- registros de campanha;
- saves e identificadores versionados.

Identifique os componentes necessários no projeto antes de modificá-los.

### Regras obrigatórias

- Não criar um segundo motor narrativo.
- Não duplicar a física, a câmera ou a IA.
- Não introduzir um renderer paralelo.
- Não deixar duas fases equivalentes concorrendo no catálogo sem justificativa.
- Não mudar IDs persistidos sem estratégia de compatibilidade.
- Não eliminar a versão legada antes de verificar suas dependências.
- Não alterar outras fases autorais.
- Não modificar `GameScene` sem demonstrar uma necessidade genérica e justificar a alteração.

A nova fase deve ficar disponível no modo **Jogar Fase**.

Verifique também sua elegibilidade para composições de campanha. A integração à região `region.floresta.flores` deve acontecer somente se os contratos e a progressão existentes forem compatíveis, sem forçar uma alteração indevida da campanha clássica.

## G. Homologação obrigatória

Reutilize os procedimentos das etapas 9.12, 9.13 e 9.14.

### Validação estrutural

Verifique:

- mapa e manifesto válidos;
- spawn alcançável;
- rotas principais e secundárias transitáveis;
- NPCs e inimigos acessíveis;
- saídas e condições narrativas satisfatíveis;
- integridade do catálogo;
- ausência de regressões em fases existentes.

### Homologação Phaser

Execute a fase real no navegador:

- nascimento do jogador;
- movimento e câmera;
- exploração;
- interação com NPCs;
- diálogo e missão;
- combate real;
- obtenção da condição de saída;
- acionamento da saída.

Execute homologação de campanha somente quando houver uma ligação real implementada. Não marque como PASS uma transição inexistente.

Registre PASS, FAIL e UNKNOWN corretamente.

### Verificação visual

Capture imagens reais de:

1. Entrada da fase.
2. Trilha principal.
3. Primeiro NPC.
4. Área de vegetação diferenciada.
5. Primeiro combate.
6. Clareira principal.
7. Conclusão ou saída.

Produza também imagens de comparação antes/depois da fase legada, preferencialmente com enquadramentos equivalentes.

Analise se os assets possuem uma linguagem artística consistente e se o cenário continua legível durante o gameplay.

### Desempenho

Compare objetos de display, texturas, memória quando mensurável e FPS nas mesmas condições de execução.

Não confunda FPS de software rendering em headless com desempenho em GPU real.

## H. Evidências, documentação e entrega

Crie uma SPEC para a conversão e registre o prompt conforme as regras do repositório.

Documente os assets autorais, os IDs finais e as decisões de migração.

Inclua capturas representativas em documentação versionada, com arquivos otimizados. Mantenha capturas intermediárias e logs extensos em `.tmp/`.

Entregue um relatório contendo:

- ID original e ID final da fase;
- arquivos originais aproveitados;
- componentes convertidos;
- nova história e seus personagens;
- mapa, regiões e encontros;
- novos assets e sua procedência;
- alterações no catálogo e na campanha;
- resultados de testes;
- resultados da homologação real;
- comparação visual;
- impacto de desempenho;
- limitações restantes.

Execute `npm run check:gates`, `npm run build`, `npm test -- --runInBand` e `git diff --check`.

Não faça commit, push, reset ou clean.

## Critério de conclusão

A antiga `Paradiso Gardens` deve se transformar em **Jardins das Flores Veladas**, uma fase autoral completa, explorável, com identidade visual própria, história, NPCs, criaturas, objetivos e conclusão jogável.

A qualidade técnica e artística deve ser comparável à Floresta das Raízes e ao Igapó atual, sem copiar sua composição ou narrativa.

Não considerar a tarefa concluída somente porque os testes passam. A transformação precisa ser demonstrada visualmente e em execução real no Phaser.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.

