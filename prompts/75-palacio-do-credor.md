# Registro de prompt: Implementação completa do Palácio do Credor

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-21-palacio-do-credor`
- Data: `2026-11-21`
- Agente: `Claude Code (deepseek-flash[1m])`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-21-palacio-do-credor.md`
- Commit: `pendente`
- Execução: `npm run check:gates` OK; `npm run build` OK; `npm test -- --runInBand` 99/99 suítes e 1210/1210 testes; `git diff --check` OK; `npm run chapter -- validate` OK; `plan validate` OK; `playtest` PASS (4 UNKNOWN de execução real); homologação Phaser PASS (16 checks, 1 UNKNOWN de transição); capturas Decadência e Corrompido PASS (8/8 cada).

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-21-palacio-do-credor.md`
- `docs/stage-authoring.md`
- `scripts/homologate-chapter.mjs`
- `scripts/generate-palacio-assets.mjs`
- `src/scenes/BootScene.ts`
- `src/scenes/GameScene.ts`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/chapters/palacio-do-credor/index.ts`
- `src/stages/chapters/palacio-do-credor/palacioDoCredorMap.ts`
- `src/stages/chapters/palacio-do-credor/palacioDoCredorStage.ts`
- `src/stages/chapters/palacio-do-credor/stage-plan.json`
- `src/stages/chapters/palacio-do-credor/visuals.ts`
- `src/stages/contracts/StageEncounter.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/presentation/assets/bootPalacioAssets.ts`
- `src/presentation/assets/palacioAssetCatalog.ts`
- `src/assets/palacio/README.md`
- `src/assets/palacio/credor-sheet.png`
- `src/assets/palacio/palacio-floor-decayed.svg`
- `src/assets/palacio/palacio-floor-corrupted.svg`
- `src/assets/palacio/palacio-gate.svg`
- `src/assets/palacio/palacio-gate-corrupted.svg`
- `src/assets/palacio/palacio-tower.svg`
- `src/assets/palacio/palacio-tower-corrupted.svg`
- `src/assets/palacio/palacio-arcade.svg`
- `src/assets/palacio/palacio-arcade-corrupted.svg`
- `src/assets/palacio/palacio-dais.svg`
- `src/assets/palacio/palacio-throne.svg`
- `src/assets/palacio/palacio-throne-corrupted.svg`
- `src/assets/palacio/palacio-chain.svg`
- `src/assets/palacio/palacio-sigil.svg`
- `src/assets/palacio/palacio-sigil-corrupted.svg`
- `src/assets/palacio/palacio-ledger.svg`
- `src/assets/palacio/palacio-statue.svg`
- `src/assets/palacio/palacio-banner.svg`
- `src/assets/palacio/palacio-canopy.svg`
- `src/assets/palacio/palacio-glass.svg`
- `src/assets/palacio/palacio-root-mass.svg`
- `src/assets/palacio/palacio-rubble.svg`
- `src/tests/palacioDoCredor.test.ts`
- `src/tests/worldLabPresentation.test.ts`
- `docs/evidence/palacio-do-credor-2026-11-21/README.md`
- `docs/evidence/palacio-do-credor-2026-11-21/`

## Prompt efetivamente recebido

```text
# Umbra Trail — Implementação completa do Palácio do Credor

## Objetivo

Implemente efetivamente a fase final **Palácio do Credor** no repositório `dsai-ap1-2Drogue`.

Não quero apenas diagnóstico, planejamento ou recomendações. Quero uma fase autoral nova, funcional, visualmente elaborada e homologada no Phaser.

O Palácio será o encerramento narrativo da campanha principal do Umbra Trail.

## 1. Contexto do projeto

O Umbra Trail é um RPG 2D top-down em Phaser, com exploração, combate, missões, narrativa declarativa, capítulos modulares e campanhas.

O projeto já possui:

- Floresta das Raízes.
- Igapó das Memórias.
- Coração Corrompido.
- Jardins das Flores Veladas, com variantes Natural e Corrompida.
- Quatro classes jogáveis.
- World Lab.
- Contratos de capítulos, fases, encontros, eventos e campanhas.
- Ferramentas de validação e homologação real.

A nova fase deve utilizar essa infraestrutura.

## 2. Identificação do capítulo

Utilize, após verificar os contratos:

- Capítulo: `chapter.final.palacio-do-credor`
- Fase: `stage.final.palacio-do-credor`
- Saída: `exit.final.palacio-do-credor.complete`
- Referência macro: `final.palacio-do-credor`
- Destino terminal: `campaign.complete`

O Palácio já existe como região final planejada em `src/application/stages/UmbraCampaignSkeleton.ts`, mas ainda precisa de uma implementação jogável.

## 3. Contexto da campanha de seis fases

Estamos reorganizando a campanha para um percurso mínimo proposto de:

1. Floresta das Raízes.
2. Igapó das Memórias.
3. Coração Corrompido.
4. Jardins das Flores Veladas.
5. Minas Corrompidas.
6. Palácio do Credor.

Essa sequência ainda não está implementada integralmente.

Nesta entrega, construa o Palácio como fase final individual completa e prepare sua integração futura à campanha.

Não crie Minas Corrompidas nesta etapa.

Não conecte artificialmente fases nem considere marcos narrativos incompletos como concluídos. Preserve o requisito canônico existente até uma SPEC posterior oficializar a redução da campanha.

## 4. Segurança do worktree

Antes de editar, execute `git status --short` e inspecione as alterações já existentes.

Há modificações locais anteriores no redesign das classes, em `BootScene`, `GameScene` e no homologador.

Preserve integralmente essas alterações.

Não execute `git reset`, `git clean`, stash destrutivo ou operações que possam descartar o trabalho de outro agente.

Se precisar modificar os mesmos arquivos, integre cuidadosamente os novos trechos aos existentes.

Não faça commit ou push.

## 5. Leitura técnica obrigatória

Consulte:

- `AGENTS.md`
- `docs/stage-authoring.md`
- `src/application/stages/UmbraCampaignSkeleton.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/stages/contracts/`
- `src/stages/chapters/`
- `src/narrative/contracts/`
- `src/presentation/`
- `src/entities/BossEnemy.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/BootScene.ts`

Inspecione as implementações da Floresta das Raízes, do Igapó e dos Jardins para reutilizar padrões consolidados.

Faça a inspeção inicial necessária, mas avance para a implementação nesta mesma execução.

## 6. Narrativa — Palácio do Credor

Crie uma história consistente com o universo já existente.

A direção narrativa proposta é **O Último Pacto**.

O Palácio representa o ponto em que a corrupção da floresta, dos rios e do território se conecta a uma força que transforma a vida em dívida, recurso e exploração.

Antes de estabelecer qualquer elemento como cânone, verifique os diálogos e SPECs existentes.

A narrativa deve apresentar:

- A aproximação ao Palácio.
- A descoberta de sua origem.
- A revelação da identidade e das motivações do Credor.
- Um NPC ou vestígio que contextualize o conflito.
- Um confronto principal.
- Uma decisão ou consequência narrativa.
- Um epílogo que encerre a fase.

Evite diálogos excessivamente expositivos. Utilize acontecimentos, elementos ambientais e interações para desenvolver a história.

## 7. Level design

Crie um mapa panorâmico e explorável com identidade própria.

Organize a experiência em regiões:

1. Aproximação pela floresta degradada.
2. Entrada monumental.
3. Jardins ou estruturas externas abandonadas.
4. Galerias e salões internos.
5. Câmara de revelação narrativa.
6. Antessala do confronto.
7. Arena do Credor.
8. Resolução e saída.

O percurso deve ser contínuo, com transições ambientais convincentes.

Evite salas quadradas genéricas, corredores vazios e espaços excessivamente repetitivos.

Priorize exploração, landmarks, caminhos orgânicos e ambientes memoráveis.

## 8. Direção de arte híbrida

Quero um capítulo visualmente ambicioso, seguindo e superando a riqueza ambiental alcançada nas fases autorais anteriores.

Combine:

**Pixel art:** terreno jogável, sprites, objetos interativos e elementos de leitura mecânica.

**PNG pictórico:** arquitetura monumental, dosséis, cenários de fundo, vegetação, estruturas antigas e ambientação ilustrada.

**SVG autoral:** raízes, detalhes arquitetônicos, flora corrompida, símbolos próprios do universo, ornamentos e estruturas orgânicas.

**Phaser:** iluminação, partículas, sombras, névoa, profundidade visual e efeitos ambientais.

Não limite a composição ao tileset Puny.

Use recursos próprios e, quando adequado, bibliotecas externas com licenças compatíveis e procedência documentada.

Se a ferramenta de geração de imagens estiver disponível, utilize-a para criar PNGs pictóricos originais. Caso não esteja, não alegue ter produzido imagens e não substitua os recursos ausentes por placeholders apresentados como arte final.

O conjunto deve ter uma direção artística coesa, sem aparência de colagem.

## 9. Duas apresentações visuais

Implemente, se os contratos atuais permitirem sem duplicação estrutural:

- **Palácio em Decadência:** arquitetura abandonada, natureza retorcida, luz residual e vestígios de exploração.
- **Palácio Corrompido:** estruturas deformadas, raízes agressivas, atmosferas opressivas e manifestações do poder do Credor.

A diferenciação precisa aparecer na composição real, não apenas em filtros de cor.

Reutilize o sistema de variantes que já funciona nos Jardins das Flores Veladas.

Mantenha o mesmo mapa lógico, os mesmos objetivos e as mesmas colisões sempre que possível.

Não implemente troca dinâmica durante a partida se isso exigir uma refatoração extensa; a seleção explícita por variante é suficiente nesta etapa.

## 10. Chefe final

Audite `BossEnemy` e a integração atual do arquétipo `boss`.

Implemente um confronto funcional com o Credor.

O antagonista precisa ter identidade visual própria.

Não apresente o sprite genérico de Fortitudo como um chefe exclusivo.

Utilize os sistemas de combate existentes e, se necessário, introduza extensões pequenas, reutilizáveis e testadas.

O confronto deve possuir:

- Introdução narrativa.
- Condição real de início.
- Combate jogável.
- Reações e feedback visual.
- Condição verificável de vitória.
- Resolução após a derrota do chefe.

Se padrões de ataque ou múltiplas fases exigirem recursos ainda inexistentes, diferencie o que foi implementado do que permanece planejado.

Não simule a vitória alterando HP diretamente no runtime como substituto da homologação real.

## 11. Epílogo

Implemente uma conclusão narrativa após a vitória.

Utilize as operações de flags, missão e `progression.unlock` efetivamente disponíveis nos contratos.

A conclusão deve ser persistente e verificável.

A fase precisa terminar corretamente no modo individual.

Prepare o caminho para uma futura conclusão de campanha com tela de vitória e `CreditsScene`, mas não reescreva o fluxo geral de campanhas nesta entrega sem necessidade comprovada.

## 12. Integração

Registre o capítulo no catálogo modular e disponibilize-o no modo Jogar Fase.

Não duplique IDs ou módulos.

Preserve a referência macro `final.palacio-do-credor` e seu requisito de desbloqueio.

Não declare como concluídas as outras regiões ainda planejadas.

Não altere os contratos centrais apenas para contornar erros de manifesto.

## 13. Testes e homologação

Execute:

- Validação de capabilities.
- Validação estrutural.
- Inspeção do capítulo.
- Playtest estático.
- Preview no World Lab.
- Homologação Phaser real.
- Testes de diálogo, missão, combate, vitória e saída.
- Testes das variantes visuais.

Execute também:

- `npm run check:gates`
- `npm run build`
- `npm test -- --runInBand`
- `git diff --check`

Verifique se esses comandos continuam válidos no projeto atual e utilize equivalentes quando necessário.

Registre PASS, FAIL e UNKNOWN corretamente.

## 14. Evidências visuais

Produza capturas reais de:

- Entrada.
- Exterior do Palácio.
- Galerias internas.
- Câmara narrativa.
- Variante corrompida.
- Arena do Credor.
- Confronto real.
- Resolução da fase.

Documente as imagens e os assets criados.

Não use imagens conceituais isoladas como substitutas de capturas reais do Phaser.

## 15. Documentação e rastreabilidade

Crie uma SPEC para a fase e registre este prompt conforme as regras atuais do repositório.

Caso alguma regra exija commit intermediário da SPEC, respeite a proibição de commit desta tarefa e registre a pendência, sem bloquear toda a implementação por isso.

Atualize apenas os documentos diretamente afetados.

## 16. Entrega final obrigatória

Apresente:

1. Capítulo criado e seus IDs.
2. Arquivos modificados.
3. História e personagens implementados.
4. Mapa e regiões.
5. Assets produzidos e procedência.
6. Variantes visuais.
7. Funcionamento do confronto.
8. Resultado do epílogo.
9. Integração com catálogo e modo individual.
10. Capturas do Phaser.
11. Resultados dos testes.
12. Limitações restantes.

**Não encerre a tarefa após a auditoria ou criação da SPEC.**

O critério principal é entregar o Palácio do Credor efetivamente jogável, com exploração, confronto, direção de arte autoral e resolução narrativa.

Não executar commit, push, reset ou clean.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
