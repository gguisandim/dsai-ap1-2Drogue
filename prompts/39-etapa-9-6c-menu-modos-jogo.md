# Registro de prompt: Etapa 9.6C — Menu de Campanhas e Modos de Jogo

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6c-menu-modos-jogo`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6c-menu-modos-jogo.md`
- Commit: `pendente`
- Execução: `concluída; sessão headless e menu de modos implementados; compositor 18/18, sessão 12/12, wiring de menu 6/6 e suíte completa 73 suítes/987 testes aprovados; typecheck, build, architecture, traceability e git diff --check aprovados; homologação visual no navegador não executada (sem navegador no ambiente)`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6c-menu-modos-jogo.md`
- `SPEC/README.md`
- `prompts/39-etapa-9-6c-menu-modos-jogo.md`
- `src/stages/contracts/CampaignComposition.ts`
- `src/stages/runtime/CampaignCompositionService.ts`
- `src/stages/index.ts`
- `src/application/stages/GameSessionService.ts`
- `src/application/stages/index.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/GameModesScene.ts`
- `src/scenes/MenuScene.ts`
- `src/main.ts`
- `src/tests/campaignComposition.test.ts`
- `src/tests/gameSessionService.test.ts`
- `src/tests/gameModesMenu.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6C — Menu de Campanhas e Modos de Jogo

Continue o desenvolvimento do **Umbra Trail**, após a conclusão da Etapa 9.6B.

## Objetivo

Integrar `StageCatalogService` e `CampaignCompositionService` ao fluxo real do jogo, permitindo iniciar campanhas procedurais, jogar fases individualmente e montar campanhas personalizadas pelo menu.

**Esta etapa deve conectar sistemas já implementados, não reconstruí-los.**

Preservar a campanha legada, saves existentes, World Lab, combate, geração procedural e identidade das fases.

## 1. Inspeção inicial

Antes de alterar código:

- Leia `AGENTS.md`.
- Leia as SPECs 9.6A e 9.6B.
- Inspecione os contratos de `CampaignComposition` e o `CampaignCompositionService`.
- Inspecione `CampaignCompositionGraphAdapter`, `CampaignRouter` e inicialização de runs.
- Identifique as cenas de menu, seleção de personagem e bootstrap do jogo.
- Inspecione `StageRegistry`, `StageLoader` e persistência.
- Identifique como uma campanha é iniciada e retomada atualmente.
- Execute `git status --short` e preserve alterações existentes.

Priorize os contratos reais. Não assuma nomes ou capacidades que não existam.

## 2. Arquitetura de inicialização

Implementar a menor camada de aplicação necessária para conectar:

`Menu → Configuração → Compositor → Snapshot → Inicialização da run → Jogo`

Separar três responsabilidades:

1. O menu coleta a intenção do jogador.
2. A camada de aplicação valida e prepara a sessão.
3. O runtime inicia a campanha ou fase escolhida.

Não colocar lógica de seleção procedural dentro das cenas Phaser.

Não criar outro `CampaignRouter`, `StageRegistry` ou compositor.

O fluxo existente de inicialização da campanha deve continuar sendo a base.

## 3. Menu de modos de jogo

Apresentar quatro opções:

**Campanha Aleatória**

- Consultar fases elegíveis do catálogo real.
- Utilizar o compositor da 9.6B.
- Permitir gerar uma seed ou informar uma seed específica.
- Exibir a quantidade de fases selecionadas.
- Iniciar a run somente após validação da composição.

**Jogar Fase**

- Listar fases individuais realmente carregáveis.
- Mostrar nome, capítulo, bioma e dificuldade, quando disponíveis.
- Permitir escolher uma fase e iniciar sua execução isolada.
- Preservar suas regras existentes de gameplay.
- Disponibilizar retorno seguro ao menu.
- Não contaminar saves ou progressão da campanha principal.

**Campanha Personalizada**

- Permitir selecionar manualmente as fases e sua ordem.
- Respeitar a política atual `umbra.fixed-nine.v1`.
- Exigir exatamente nove fases distintas quando essa política for utilizada.
- Validar posições, atos, marcos, destinos, capacidades e dependências.
- Reutilizar o compositor e seus diagnósticos, estendendo o request existente apenas se necessário.
- Não criar um segundo algoritmo de composição para seleções manuais.
- Permitir corrigir seleções inválidas antes de iniciar a campanha.

**Campanha Clássica**

- Preservar o fluxo macro legado.
- Disponibilizá-lo como alternativa enquanto o catálogo real não possuir conteúdo suficiente.
- Não misturar silenciosamente a campanha clássica com a composição dinâmica.

Adaptar visualmente essas opções ao design existente, evitando redesenho amplo do menu.

## 4. Limitação do catálogo atual

O catálogo de produção ainda possui menos de nove fases elegíveis.

Portanto:

- Não criar nove fases artificiais.
- Não repetir fases indevidamente.
- Não considerar a fixture sintética de 35 fases como conteúdo disponível.
- Não iniciar composições incompletas.
- Exibir quantidade de fases elegíveis e motivo da indisponibilidade.
- Desabilitar a inicialização aleatória/personalizada quando inviável.
- Manter Campanha Clássica funcional.
- Manter Jogar Fase disponível para stages individualmente carregáveis.

A interface deve representar o estado real do projeto.

## 5. Integração da composição em produção

A 9.6B já implementou composição headless e integração com grafo e roteador em testes.

Agora integrar sua saída à criação efetiva de uma sessão jogável.

O fluxo deverá:

1. Consultar candidatos reais.
2. Criar ou validar a composição.
3. Persistir seu snapshot antes da execução.
4. Inicializar o grafo correspondente.
5. Vincular as instâncias de fases às posições.
6. Iniciar a fase de entrada válida.
7. Preservar transições e saídas.
8. Restaurar a mesma composição após reload.

Não recalcular a seleção durante a retomada.

Não modificar `PhysicalExitResolver` nem `CampaignExitBinder` para contornar erros de conteúdo.

Se a composição for inválida, impedir o início e exibir o diagnóstico.

## 6. Seleção manual

Para o modo personalizado, permitir atribuições explícitas de `stageId` aos slots da campanha.

Preferir ampliar o contrato de request da 9.6B com uma opção tipada de seleção manual, mantendo uma única implementação de validação.

Verificar:

- IDs existentes.
- Elegibilidade.
- Disponibilidade do capítulo.
- Quantidade de fases.
- Repetições.
- Atos permitidos.
- Marcos obrigatórios.
- Dependências.
- Saídas e destinos explícitos.
- Compatibilidade com a topologia linear.

Quando a seleção não for possível, retornar diagnósticos tipados.

Não aceitar sequências inválidas apenas porque foram escolhidas manualmente.

## 7. Modo de fase individual

Reutilizar `StageLoader` e o ciclo de vida real do jogo.

Definir uma sessão individual claramente separada das campanhas.

Garantir:

- Spawn válido.
- Carregamento de mapa e apresentação.
- NPCs, inimigos e interações existentes.
- Encerramento ou saída segura.
- Retorno ao menu.
- Limpeza de estado transitório.
- Sem gravação indevida no save da campanha.

Não criar outro motor de execução de fases.

Se alguma fase depender obrigatoriamente de estado de campanha, torná-la indisponível para execução isolada com diagnóstico explícito.

## 8. Saves e retomada

Preservar compatibilidade com saves v1.

As campanhas compostas devem armazenar:

- Modo de jogo.
- Seed e política.
- Snapshot da composição.
- IDs e revisões.
- Instância da run.
- Estado necessário à retomada.

Reutilizar os contratos de persistência existentes.

Um save clássico deve continuar sendo reconhecido como clássico.

Um save com composição não pode ser restaurado com outra seleção.

Conteúdo incompatível ou ausente deve produzir erro tipado sem sobrescrever o save anterior.

## 9. Interface e UX

Reutilizar os componentes e padrões visuais do jogo.

A interface deve apresentar:

- Modos disponíveis.
- Fases existentes.
- Estados habilitado/desabilitado.
- Motivos de incompatibilidade.
- Seleção atual.
- Seed.
- Quantidade de fases.
- Confirmação de início.
- Retorno e cancelamento.

Não apresentar como jogável um modo cuja integração ainda não esteja funcionando.

Evitar formulários extensos e painéis administrativos.

A seleção personalizada pode ser simples: lista de fases e nove posições ordenadas.

## 10. Integração com World Lab

Preservar a inspeção de composição existente.

Se houver baixo custo de implementação, permitir visualizar a composição selecionada pelo menu no World Lab.

Não reconstruir a ferramenta.

Não implementar editor de campanhas nesta etapa.

## 11. Testes obrigatórios

Cobrir:

- Abertura do menu.
- Campanha clássica preservada.
- Catálogo real insuficiente.
- Modo aleatório indisponível sem nove candidatas.
- Seleção aleatória válida com fixture.
- Seed determinística.
- Seleção individual válida.
- Fase individual incompatível.
- Seleção manual de nove fases.
- Seleção manual incompleta.
- IDs duplicados.
- Destinos incompatíveis.
- Atos e marcos inválidos.
- Início de uma composição válida.
- Snapshot persistido.
- Reload sem recomposição.
- Save legado preservado.
- Falha de revisão sem sobrescrita.
- Retorno ao menu.
- Ausência de contaminação entre modos.
- Navegação e saídas existentes.

Usar fixtures sintéticas apenas nos testes.

Não criar telas ou mocks que aparentem funcionamento sem inicialização real.

## 12. Homologação

Quando o ambiente permitir, testar no navegador:

1. Abrir o menu.
2. Iniciar Campanha Clássica.
3. Retornar ao menu.
4. Consultar fases individuais.
5. Iniciar uma fase individual.
6. Verificar indisponibilidade da campanha aleatória no catálogo real.
7. Validar interface personalizada.
8. Testar restauração de sessão quando disponível.

Registrar o que foi realmente executado.

Não declarar homologação visual caso o navegador esteja indisponível.

## 13. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-6c-menu-modos-jogo.md`

Atualizar `SPEC/README.md`.

Registrar o próximo prompt sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`. Confirmar a numeração antes de criar o arquivo.

Documentar:

- Fluxo de inicialização.
- Modos de jogo.
- Disponibilidade e diagnósticos.
- Seleção manual.
- Compatibilidade com saves.
- Limitações da topologia `umbra.fixed-nine.v1`.
- Estado real da integração.
- Dependências da 9.6D.

## 14. Restrições

- Não iniciar a 9.6D.
- Não adicionar novas fases para completar nove.
- Não substituir o compositor da 9.6B.
- Não criar outro roteador.
- Não modificar geração procedural.
- Não alterar combate e IA.
- Não refatorar amplamente `GameScene`.
- Não implementar editor visual ou CLI.
- Não implementar conteúdo remoto.
- Não quebrar a campanha clássica.
- Não criar commit nem executar push.

## 15. Eficiência de implementação

Trabalhe em três incrementos:

**A — Integração de sessão:** conectar composição, inicialização e persistência.

**B — Menu e modos:** conectar UI, seleção individual e manual aos serviços existentes.

**C — Testes e fechamento:** corrigir regressões, documentar e validar.

Execute testes direcionados após cada incremento.

Execute a suíte completa apenas após a última alteração funcional, evitando repetir build e typecheck sem necessidade.

Não gastar contexto reanalisando componentes já documentados nas SPECs.

## 16. Validação final

Executar:

- Testes direcionados da integração.
- Testes do compositor.
- Testes do roteador e persistência.
- Testes dos menus.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

## 17. Relatório final

Entregar um relatório objetivo contendo:

1. Arquivos alterados.
2. Fluxo real de criação de campanhas.
3. Modos implementados.
4. Estado da campanha clássica.
5. Estado do modo individual.
6. Estado do modo personalizado.
7. Persistência e restauração.
8. Integração Phaser efetivamente operacional.
9. Testes executados.
10. Homologação visual realizada ou pendente.
11. Limitações.
12. Estado para commit.
13. Dependências para a 9.6D.

**Critério de conclusão:** o jogador consegue acessar os modos pelo menu, iniciar uma fase individual ou a campanha clássica e utilizar a composição dinâmica para iniciar uma run quando existem candidatas suficientes. O modo personalizado utiliza a mesma validação do compositor, e as sessões preservam seus saves e identidades.

Nenhum modo deve simular funcionamento, criar conteúdo fictício ou permitir campanhas inválidas.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: número sequencial 39 confirmado antes da criação.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
