# Registro de prompt: Etapa 9.4D — Homologação Integrada do Ciclo Narrativo

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-30-etapa-9-4d-homologacao-ciclo-narrativo`
- Data: `2026-10-30`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-30-etapa-9-4d-homologacao-ciclo-narrativo.md`
- Commit: `pendente`
- Execução: `6 suítes/44 testes direcionados e 65 suítes/901 testes completos aprovados; typecheck, build, architecture, traceability e diff-check aprovados; cenário carregado no Opera, homologação E2E de teclado bloqueada pelo host de automação`

## Arquivos modificados

- `SPEC/2026-10-30-etapa-9-4d-homologacao-ciclo-narrativo.md`
- `SPEC/README.md`
- `prompts/31-etapa-9-4d-homologacao-ciclo-narrativo.md`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/application/stages/CampaignNarrativeAccessBinder.ts`
- `src/application/stages/GameMacroCampaignAdapter.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/index.ts`
- `src/devtools/narrative-cycle/NarrativeCycleScenario.ts`
- `src/devtools/narrative-cycle/index.ts`
- `src/narrative/runtime/StageDirector.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/GameScene.ts`
- `src/tests/narrativeCycleScenario.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.4D — Homologação Integrada do Ciclo Narrativo

Continue o desenvolvimento do Umbra Trail no Visual Studio Code, utilizando o estado atual do repositório.

## Objetivo

Validar e corrigir a integração completa entre narrativa, gameplay, progressão, recompensas, campanha e persistência, preparando o motor para receber capítulos independentes.

O fluxo esperado é:

**Diálogo → Escolha → Objetivo → Combate/Coleta → Progresso → Recompensa → Conclusão → Transição → Reload.**

Esta etapa deve priorizar testes reais, correções de integração e regressões. Não criar novos sistemas desnecessariamente.

## 1. Inspeção

Antes de alterar arquivos:

- Ler `AGENTS.md` e as SPECs 9.4A, 9.4B e 9.4C.
- Verificar `git status --short`.
- Confirmar quais componentes da 9.4C foram realmente implementados.
- Inspecionar `GameScene`, `StageDirector`, `StageSignalAdapter`, `NarrativeEventProcessor`, `GameNarrativeSession`, `CampaignRouter` e o serviço de progressão.
- Identificar os testes existentes e a infraestrutura disponível para homologação no navegador.

Não assumir que a 9.4C esteja concluída apenas por existir uma SPEC.

Caso encontre funcionalidades essenciais da 9.4C ausentes, documente o bloqueio e implemente apenas as correções de integração necessárias, sem expandir indiscriminadamente o escopo.

## 2. Cenário jogável de homologação

Criar um cenário de desenvolvimento isolado que contenha:

- Uma fase carregável pelo sistema atual.
- Um NPC ou POI.
- Diálogo com duas escolhas.
- Uma consequência narrativa persistente.
- Uma missão com objetivo de combate.
- Uma missão ou objetivo de coleta.
- Uma recompensa narrativa.
- Uma condição de conclusão da fase.
- Uma saída física conectada a outro estágio.

Reutilizar os contratos, catálogos e serviços existentes.

Não introduzir condicionais específicas desse cenário no motor.

Não modificar permanentemente a narrativa do Vestígio Submerso.

O cenário deve ser acessível durante desenvolvimento e excluído do conteúdo normal da campanha.

## 3. Homologação Phaser

Executar o jogo no navegador e verificar:

1. A fase é carregada corretamente.
2. O jogador pode mover-se e interagir.
3. O diálogo abre e fecha.
4. As escolhas são exibidas e selecionáveis.
5. Apenas os comandos da escolha selecionada são executados.
6. A simulação pausa e retoma corretamente.
7. Derrotar inimigos avança os objetivos.
8. Coletar itens avança os objetivos.
9. Concluir encontros produz os eventos correspondentes.
10. Recompensas são concedidas apenas uma vez.
11. A conclusão da fase é registrada.
12. A saída direciona ao estágio correto.
13. O reload restaura o progresso.
14. Revisitas não duplicam consequências.

Registrar evidências da execução real.

Não declarar E2E visual caso apenas testes unitários ou mocks tenham sido executados.

## 4. Persistência e falhas

Testar interrupções em momentos críticos:

- Após selecionar uma escolha.
- Depois da derrota de inimigo.
- Depois da coleta.
- Entre concessão e confirmação da recompensa.
- Depois da conclusão da fase.
- Durante a transição.
- Após recarregar a página.

Verificar idempotência, consistência e recuperação.

Não inventar garantias transacionais entre storages independentes.

Se encontrar possibilidade de perda de progresso ou duplicação, classificar a severidade e corrigir quando estiver dentro dos contratos existentes.

## 5. Diagnósticos e observabilidade

Aproveitar o World Lab e as ferramentas de desenvolvimento existentes para inspecionar:

- Identificadores de run e stage.
- Visita atual.
- Flags narrativas.
- Objetivos de missão.
- Operações pendentes.
- Recompensas confirmadas.
- Conclusão da fase.
- Destino da transição.

Não reconstruir o World Lab.

Adicionar apenas pontos mínimos de inspeção quando necessários.

## 6. Testes automatizados

Adicionar regressões para os problemas reais encontrados na homologação.

Priorizar testes de integração que exercitem os serviços efetivos.

Não duplicar testes existentes apenas para aumentar a contagem.

Preservar os testes das Etapas 9.3B, 9.4A, 9.4B e 9.4C.

## 7. Critérios de qualidade

A etapa somente estará concluída se:

- O fluxo integrado for reproduzível.
- Nenhuma recompensa for duplicada.
- Nenhuma escolha for aplicada duas vezes.
- A navegação usar destinos canônicos.
- Saves puderem ser restaurados.
- O conteúdo de teste não exigir alterações específicas na GameScene.
- Os sistemas existentes continuarem funcionando.

Se a infraestrutura de navegador impedir a homologação, registrar explicitamente a pendência e não declarar a etapa funcionalmente homologada.

## 8. Documentação

Criar uma SPEC da Etapa 9.4D, seguindo as convenções existentes.

Registrar o prompt no próximo arquivo sequencial em `prompts/`, no formato `umbra-prompt-record/v1`.

Documentar:

- Cenário de homologação.
- Configuração de execução.
- Resultados observados.
- Evidências.
- Problemas encontrados.
- Correções realizadas.
- Riscos remanescentes.
- Requisitos para iniciar a 9.5.

## 9. Validações finais

Executar:

- Testes direcionados.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Não enfraquecer testes existentes.

## 10. Restrições

- Não iniciar a Etapa 9.5.
- Não criar outro sistema narrativo.
- Não criar novo event bus.
- Não refatorar todo o motor.
- Não desenvolver biomas nesta etapa.
- Não construir editor visual completo.
- Não criar commits.
- Não executar push.

## 11. Entrega

Apresentar:

1. Estado encontrado das Etapas 9.4A–C.
2. Arquivos criados e modificados.
3. Cenário de homologação.
4. Resultados do fluxo Phaser.
5. Evidências reais de navegador.
6. Defeitos identificados e corrigidos.
7. Testes executados.
8. Limitações restantes.
9. Se o ciclo narrativo está efetivamente integrado.
10. Se o projeto está preparado para iniciar a Etapa 9.5.

**Critério final:** demonstrar uma fase jogável que conecte narrativa, combate, coleta, recompensas, conclusão, transições e persistência, sem soluções específicas para um único capítulo.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: prompt fornecido como anexo local de texto.
- Política de commit: nenhum commit deve ser criado nesta etapa.
