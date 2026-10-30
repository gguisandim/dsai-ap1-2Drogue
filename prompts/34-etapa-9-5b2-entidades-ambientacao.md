# Registro de prompt: Etapa 9.5B.2 — Apresentação de Entidades e Ambientação por Fase

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-30-etapa-9-5b2-entidades-ambientacao`
- Data: `2026-10-30`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-30-etapa-9-5b2-entidades-ambientacao.md`
- Commit: `pendente`
- Execução: `concluída com homologação visual/sonora bloqueada pela infraestrutura`

## Arquivos modificados

- `SPEC/2026-10-30-etapa-9-5b2-entidades-ambientacao.md`
- `SPEC/README.md`
- `prompts/34-etapa-9-5b2-entidades-ambientacao.md`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/entities/BossEnemy.ts`
- `src/entities/Enemy.ts`
- `src/entities/RangedEnemy.ts`
- `src/managers/SoundManager.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/scenes/GameScene.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageLoader.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/stageAmbientPresentation.test.ts`
- `src/tests/stageAuthoringCompatibility.test.ts`
- `src/tests/stageEntityPresentation.test.ts`
- `src/tests/stageVisualPresentation.test.ts`
- `src/tests/worldLabPoi.test.ts`
- `src/utils/TextureGenerator.ts`

## Validações executadas

- Incremento A: 5 suites direcionadas, 34 testes aprovados.
- Incremento B: 8 suites direcionadas, 55 testes aprovados.
- Regressão ampliada: 10 suites, 68 testes aprovados.
- `npm test -- --runInBand`: 69 suites e 933 testes aprovados.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; 726 módulos transformados.
- `npm run check:gates`: aprovado após a consolidação deste registro; 824 arquivos, 2.959 dependências, 30 registros v1, 8 legados aceitos e 1 commit pendente.
- `git diff --check`: aprovado após a consolidação deste registro; somente avisos de normalização LF/CRLF.
- `scripts/auditar-segredos-prompts.ps1 prompts/sessoes`: aprovado; nenhum segredo conhecido em 20 arquivos.
- Homologação visual/sonora: não executada. O servidor Vite iniciou em `127.0.0.1:5173`, mas o controle do navegador encerrou a sessão antes de qualquer interação porque não conseguiu determinar a URL atual do Edge com confiança suficiente para aplicar a política de segurança.

## Prompt efetivamente recebido

```text
# Etapa 9.5B.2 — Apresentação de Entidades e Ambientação por Fase

Continue o desenvolvimento do **Umbra Trail**, a partir da Etapa 9.5B.1.

## Objetivo

Implementar a apresentação declarativa de entidades e ambientação, permitindo que cada fase configure sprites de NPCs, aparências de inimigos, música, efeitos sonoros, iluminação e névoa sem alterações específicas no motor.

Preservar combate, IA, hitboxes, geração procedural, campanha e persistência.

**A implementação deve aproveitar `StagePresentation`, `StageVisualRegistry` e `StageMapRenderer`. Não criar outro framework de apresentação ou plugins.**

## 1. Inspeção obrigatória

Antes de modificar arquivos:

- Ler `AGENTS.md` e as SPECs das Etapas 9.5 e 9.5B.1.
- Inspecionar `StagePresentation.ts`, `StageVisualRegistry.ts`, `StageMapRenderer.ts` e `StageRuntimeCapabilities.ts`.
- Inspecionar `GameScene.ts`, `Enemy.ts`, entidades, NPCs e sistemas de áudio existentes.
- Inspecionar `StageLoader`, `StageValidator`, `StageRegistry` e World Lab.
- Identificar como Phaser registra, carrega e descarrega texturas e sons.
- Verificar os assets disponíveis e suas licenças.
- Executar `git status --short` e preservar alterações existentes.

Não presumir APIs ou contratos sem verificar o código.

## 2. Divisão interna da implementação

Organize a etapa em dois incrementos, mantendo uma única SPEC.

### Incremento A — Apresentação de entidades

Implementar primeiro:

- Sprites configuráveis para NPCs.
- Aparências configuráveis para inimigos existentes.
- Registro e resolução dos assets.
- Validação de referências.
- Integração com Phaser.
- Testes de regressão.

Validar este incremento antes de iniciar o seguinte.

### Incremento B — Ambientação

Implementar depois:

- Música por fase.
- Áudio ambiental e efeitos.
- Iluminação.
- Névoa.
- Configurações declarativas.
- Integração com World Lab.
- Testes e homologação.

Não expandir o escopo para shaders complexos ou sistemas de iluminação fisicamente simulados.

## 3. Contratos de apresentação

Estender os contratos existentes para permitir:

- `spriteId` de NPC.
- `spriteId` ou variante visual de inimigo.
- Referências a spritesheets e animações.
- Configuração de música.
- Áudio ambiental.
- Efeitos sonoros vinculados a eventos existentes.
- Configuração de iluminação.
- Configuração de névoa.

Os nomes concretos devem seguir as convenções existentes, não necessariamente os exemplos acima.

Separar identidade lógica de apresentação visual.

Um inimigo deve continuar identificado por seu arquétipo de gameplay, mesmo quando possui outro sprite.

Não adicionar caminhos arbitrários de arquivos diretamente aos contratos executados pelo motor; utilizar identificadores estáveis resolvidos pelo pipeline de assets.

## 4. NPCs

Substituir os marcadores gráficos provisórios por sprites configuráveis.

Garantir:

- Sprite próprio por NPC.
- Posicionamento correspondente ao `StageModule`.
- Animação idle, quando disponível.
- Fallback legado compatível.
- Preservação da interação por proximidade.
- Preservação dos diálogos.
- Ausência de colisões inesperadas.

O NPC continua sendo uma entidade narrativa. Não introduzir IA de combate para NPCs.

## 5. Inimigos

Permitir que um capítulo escolha a apresentação visual de um inimigo sem alterar seu comportamento.

Reutilizar os arquétipos existentes:

- `affinity`
- `applaud`
- `fortitudo`
- `ranged`
- `boss`
- `miniboss`

Garantir que sprites e animações não modifiquem:

- Hitbox.
- Dano.
- Velocidade.
- IA.
- Alcance.
- Recompensas.
- Eventos `enemy.defeated`.

Não permitir que uma referência visual desconhecida altere silenciosamente o arquétipo lógico.

## 6. Áudio por fase

Implementar resolução declarativa de trilhas e ambientação sonora.

Requisitos:

- Música configurável por stage.
- Volume padronizado.
- Transição ou interrupção controlada entre stages.
- Evitar reprodução duplicada após revisitas.
- Respeitar restrições de autoplay do navegador.
- Liberar recursos corretamente no ciclo de vida Phaser.

Reutilizar o gerenciador de áudio existente quando disponível.

Não substituir o sistema atual sem necessidade comprovada.

## 7. Iluminação e névoa

Implementar uma solução leve compatível com a perspectiva top-down do jogo.

Permitir configurar:

- Cor e intensidade ambiental.
- Sobreposição de névoa.
- Opacidade.
- Cor.
- Camada visual.
- Visibilidade de entidades e elementos importantes.

Priorizar soluções gráficas simples e eficientes.

Não introduzir shaders complexos, cálculos de iluminação física ou efeitos que prejudiquem a legibilidade do combate.

## 8. Resolução e carregamento de assets

Estender o pipeline existente para:

1. Declarar os recursos necessários.
2. Validar seus identificadores.
3. Resolver caminhos de assets permitidos.
4. Carregar os recursos no Phaser.
5. Detectar falhas explicitamente.
6. Evitar carregamento duplicado.
7. Garantir compatibilidade com stages legados.
8. Manter isolamento entre recursos de apresentação e regras de gameplay.

Não permitir que capítulos executem código arbitrário por meio dos metadados.

Não adicionar carregamento remoto nesta etapa.

## 9. Demonstração funcional

Criar dois perfis de apresentação diferentes:

**Perfil legado**
- Aparência original preservada.
- Sprites e áudio atuais.
- Sem efeitos ambientais adicionais.

**Perfil Igapó dos Esquecidos**
- NPC com apresentação visual própria.
- Variante visual de inimigo existente.
- Música ou ambiente sonoro próprio, utilizando recursos locais válidos.
- Tonalidade ambiental verde/azul.
- Névoa leve, sem prejudicar a leitura do cenário.

Utilizar assets já disponíveis ou placeholders técnicos claramente identificados.

Não baixar pacotes externos sem verificar licença e atribuição.

A demonstração deve comprovar que os recursos são definidos por dados do capítulo, sem condicionais específicas do Igapó no motor.

## 10. Integração com World Lab

Ampliar a inspeção existente para exibir:

- Sprites declarados.
- Assets resolvidos.
- Animações disponíveis.
- Música e áudio ambiental.
- Configuração de iluminação.
- Névoa.
- Diagnósticos de recursos ausentes.

Não reconstruir o World Lab nem implementar editor visual completo.

## 11. Capabilities

Atualizar `StageRuntimeCapabilities` apenas para recursos efetivamente integrados.

Não promover uma capability a `supported` se o recurso existir apenas como contrato ou estiver coberto somente por teste headless.

Recursos ainda não implementados devem permanecer `planned`.

## 12. Testes obrigatórios

Adicionar testes para:

- Sprite de NPC válido e inválido.
- Variante visual válida e inválida de inimigo.
- Arquétipo lógico preservado.
- Hitbox e comportamento preservados.
- Animações disponíveis e ausentes.
- Interação narrativa após substituição do marcador.
- Música por fase.
- Transição entre músicas.
- Revisita sem áudio duplicado.
- Autoplay bloqueado.
- Configuração ambiental.
- Névoa e ordem de camadas.
- Recursos inexistentes.
- Fallback legado.
- Fase autoral e procedural.
- Compatibilidade com saves e revisitas.
- Preservação de eventos narrativos.
- Integração com World Lab.

Testar o ciclo de vida dos recursos no Phaser, não apenas os contratos.

## 13. Homologação visual e sonora

Quando houver infraestrutura disponível, iniciar o jogo e verificar:

1. Fase legada preservada.
2. Igapó com sprites próprios.
3. NPC interativo.
4. Inimigo visualmente diferente, mantendo comportamento.
5. Áudio funcionando após interação do usuário.
6. Ausência de música duplicada.
7. Névoa e iluminação legíveis.
8. Transição e retorno entre fases.
9. Reload sem regressões.

Registrar evidências reais.

Não declarar homologação visual ou sonora caso ela não tenha sido executada.

## 14. Documentação

Criar a SPEC:

`SPEC/2026-10-30-etapa-9-5b2-entidades-ambientacao.md`

Atualizar o índice e criar o próximo registro sequencial em `prompts/`, no padrão `umbra-prompt-record/v1`.

Documentar como um autor pode definir sprites, animações, áudio e ambientação apenas com arquivos de conteúdo.

## 15. Restrições

- Não modificar a geração procedural.
- Não alterar combate ou IA.
- Não alterar a topologia da campanha.
- Não implementar criação de novos arquétipos de inimigos.
- Não criar novo motor gráfico.
- Não implementar carregamento remoto.
- Não criar editor visual completo.
- Não adicionar bibliotecas pesadas sem justificativa.
- Não criar commits nem executar push.

## 16. Validação final

Executar:

- Testes direcionados.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir regressões introduzidas.

## 17. Relatório final

Apresentar:

1. Arquivos criados e alterados.
2. Contratos reutilizados e ampliados.
3. Registro e carregamento dos assets.
4. Integração de sprites e animações.
5. Funcionamento do áudio.
6. Iluminação e névoa.
7. Capabilities promovidas.
8. Testes executados.
9. Homologação real.
10. Limitações.
11. Estado para commit.
12. Próximas dependências para autoria independente.

**Critério de conclusão:** dois stages devem poder apresentar NPCs, inimigos, áudio e ambientação visual diferentes, configurados declarativamente, mantendo o mesmo motor e preservando as regras de gameplay.

A implementação deve permitir a futura criação de biomas e capítulos open source sem alterações específicas na `GameScene`.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
