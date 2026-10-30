# Registro de prompt: Etapa 9.4C — recompensas e conclusão de fases

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-30-etapa-9-4c-recompensas-conclusao-fases`
- Data: `2026-10-30`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-etapa-9-4c-recompensas-conclusao-fases.md`
- Commit: `pendente`
- Execução: `64 suítes/898 testes; typecheck, build (718 módulos), architecture e traceability gates aprovados; browser indisponível`

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-10-29-etapa-9-4c-recompensas-conclusao-fases.md`
- `prompts/30-etapa-9-4c-recompensas-conclusao-fases.md`
- `src/application/rewards/NarrativeRewardSettlementService.ts`
- `src/application/rewards/index.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/narrative/contracts/NarrativeRuntime.ts`
- `src/narrative/persistence/CampaignSaveService.ts`
- `src/narrative/persistence/CampaignSaveValidator.ts`
- `src/narrative/runtime/NarrativeEventProcessor.ts`
- `src/narrative/runtime/NarrativeState.ts`
- `src/narrative/runtime/StageDirector.ts`
- `src/progression/ProgressionService.ts`
- `src/progression/ProgressionStorage.ts`
- `src/progression/types.ts`
- `src/scenes/GameScene.ts`
- `src/tests/gameSceneStageSignalIntegration.test.ts`
- `src/tests/narrativeRewardSettlement.test.ts`
- `src/tests/stageCompletion.test.ts`
- `src/ui/DialogueOverlay.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.4C — Liquidação de Recompensas e Conclusão de Fases

Continue o desenvolvimento do **Umbra Trail**, dando sequência às Etapas 9.4A e 9.4B.

## Objetivo

Completar o ciclo narrativo do jogo implementando a liquidação efetiva dos comandos `reward.grant` e a execução de `stage.complete`, integrando narrativa, progressão, persistência e campanha.

O jogador deve conseguir cumprir objetivos, receber recompensas e concluir uma fase sem duplicações, inclusive após revisitas, reloads ou falhas recuperáveis.

**Esta etapa deve utilizar os serviços existentes. Não implementar um novo sistema de recompensas, progressão, eventos ou persistência.**

## 1. Inspeção obrigatória

Antes de modificar arquivos:

- Ler `AGENTS.md` e as instruções aplicáveis.
- Ler as SPECs das Etapas 9.3B, 9.4A e 9.4B.
- Inspecionar `NarrativeEventProcessor`, `NarrativeState`, `StageDirector`, `GameNarrativeSession` e `StageSignalAdapter`.
- Inspecionar `CampaignSaveService`, `CampaignRouter`, `GameMacroCampaignAdapter` e o sistema atual de progressão.
- Localizar as APIs de `pendingRewardCommands`, `confirmOperation` e os identificadores de operação.
- Identificar os responsáveis atuais por XP, moedas, itens, conclusão de fase e transições.
- Verificar a semântica existente de `stage.complete` e os testes relacionados.
- Executar `git status --short` e preservar alterações anteriores.

Não presumir caminhos, APIs ou contratos sem confirmar o código real.

## 2. Liquidação de reward.grant

Implementar um componente de aplicação que consuma os comandos `reward.grant` pendentes produzidos pelo runtime narrativo.

O fluxo deve seguir esta lógica:

1. Identificar a operação narrativa pendente.
2. Validar o comando e seus parâmetros.
3. Localizar o mecanismo de progressão responsável pela recompensa.
4. Aplicar a recompensa usando um identificador de operação estável.
5. Persistir a concessão no mecanismo de progressão.
6. Confirmar a operação narrativa somente após a concessão durável.
7. Atualizar o estado e a apresentação quando apropriado.

Reutilizar o mecanismo de deduplicação da progressão, caso exista.

Não converter recompensas desconhecidas em tipos genéricos silenciosamente.

Não conceder recompensas por atualização de frame ou reabertura de tela.

## 3. Consistência e recuperação

Os saves narrativos e de progressão podem utilizar mecanismos distintos. Não assumir atomicidade entre eles.

Implementar um protocolo de liquidação idempotente que trate, no mínimo:

- Falha antes da concessão.
- Falha durante a persistência da progressão.
- Concessão persistida, mas confirmação narrativa falha.
- Reload entre concessão e confirmação.
- Retry da mesma operação.
- Revisita ao estágio.
- Comando inválido ou não suportado.

Uma recompensa já concedida deve ser identificada pelo mesmo `operationId` e não pode ser aplicada novamente.

A confirmação narrativa deve ocorrer apenas depois da concessão persistida.

Caso algum cenário não permita recuperação segura com os mecanismos existentes, documentar a limitação e implementar a menor extensão compatível necessária, sem introduzir um segundo sistema de save.

Priorizar consistência observável e recuperação determinística.

## 4. Implementação de stage.complete

Implementar a semântica efetiva de `stage.complete`, atualmente pendente.

A conclusão deve:

- Identificar corretamente `runId`, capítulo, stage e ocorrência.
- Validar se a fase pode ser concluída.
- Registrar a conclusão no runtime apropriado.
- Evitar concluir repetidamente a mesma ocorrência.
- Persistir o resultado.
- Preservar as regras atuais de campanha e revisita.
- Não duplicar transições ou recompensas.
- Não ignorar condições narrativas exigidas pelo contrato.

Diferenciar:

- Conclusão narrativa do estágio.
- Solicitação de saída.
- Transição física entre estágios.
- Conclusão integral da campanha.

Não presumir que `stage.complete` deva sempre provocar navegação imediata.

Se o contrato não definir essa relação, adotar uma semântica mínima documentada e compatível com o runtime atual.

## 5. Integração

Integrar a liquidação e a conclusão aos pontos de aplicação existentes.

A `GameScene` deve continuar sendo um adaptador fino.

Evitar lógica de concessão de recompensas diretamente na cena.

Utilizar serviços de aplicação para coordenar narrativa, progressão e persistência.

Não modificar o combate, os geradores procedurais ou a topologia da campanha.

Não criar condicionais específicas para Igapó, Vestígio Submerso ou outros capítulos.

## 6. Feedback ao jogador

Reutilizar componentes existentes de HUD, notificações ou feedback visual quando disponíveis.

Mostrar confirmação de recompensa somente após a operação ser efetivamente concedida.

Não exibir sucesso em caso de falha.

Evitar criar uma nova interface extensa nesta etapa.

Caso a infraestrutura de apresentação seja insuficiente, registrar a limitação e manter a operação funcional e testada no runtime.

## 7. Testes obrigatórios

Criar testes para:

1. Recompensa simples concedida.
2. Duas recompensas distintas.
3. Repetição da mesma operação.
4. Reload após concessão.
5. Reload antes da confirmação narrativa.
6. Falha de persistência da progressão.
7. Falha de confirmação narrativa.
8. Retry após falha.
9. Revisita ao estágio.
10. Comando de recompensa inválido.
11. Tipo de recompensa não suportado.
12. Conclusão válida de stage.
13. Conclusão duplicada.
14. Conclusão após reload.
15. Conclusão e transição sem duplicação.
16. Compatibilidade com saves legados.
17. Não regressão da idempotência das Etapas 9.4A e 9.4B.

Incluir testes de integração envolvendo os serviços reais, não apenas mocks desconectados.

## 8. Homologação funcional

Criar ou adaptar um cenário de desenvolvimento que execute:

1. Entrada em uma fase.
2. Interação narrativa.
3. Cumprimento de objetivo por combate ou coleta.
4. Atualização de missão.
5. Produção de `reward.grant`.
6. Liquidação da recompensa.
7. Conclusão da fase.
8. Persistência.
9. Reload.
10. Verificação de que recompensa e conclusão não foram duplicadas.

Se houver infraestrutura disponível, executar a homologação no navegador com Phaser.

Diferenciar expressamente testes headless de homologação visual real.

Não modificar a história definitiva do Igapó apenas para testar a funcionalidade.

## 9. Documentação

Criar:

`SPEC/2026-10-29-etapa-9-4c-recompensas-conclusao-fases.md`

Atualizar o índice documental e criar o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

Documentar:

- Contratos utilizados.
- Fluxo de liquidação.
- Política de idempotência.
- Ordem de persistência.
- Semântica de conclusão.
- Recuperação de falhas.
- Compatibilidade.
- Limitações conhecidas.

## 10. Restrições

- Não iniciar a Etapa 9.5.
- Não criar um novo framework de plugins.
- Não implementar novos biomas.
- Não modificar os algoritmos procedurais.
- Não reestruturar a campanha.
- Não criar sistemas paralelos de progressão.
- Não introduzir dependências desnecessárias.
- Não realizar refatoração ampla de `GameScene.ts`.
- Não criar commit nem executar push.

## 11. Validação final

Executar:

- Testes direcionados.
- Testes narrativos, progressão e persistência.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir regressões introduzidas pela etapa.

Não alterar testes apenas para produzir aprovação.

## 12. Relatório final

Apresentar:

1. Arquivos criados e alterados.
2. Contratos e serviços reutilizados.
3. Funcionamento do protocolo de liquidação.
4. Semântica implementada de `stage.complete`.
5. Estratégia de recuperação após falhas.
6. Compatibilidade com saves anteriores.
7. Resultados reais de testes e validações.
8. Resultado da homologação no Phaser.
9. Limitações restantes.
10. Estado para commit e próximas etapas recomendadas.

**Critério de conclusão:** uma missão deve poder produzir uma recompensa, concedê-la uma única vez, persistir a concessão, concluir o estágio e restaurar corretamente o estado após reload, mesmo quando ocorre falha recuperável entre os mecanismos de persistência.

Não declarar conclusão se ainda existir um cenário conhecido de duplicação de recompensas ou perda silenciosa de confirmação.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: o prompt foi recebido como arquivo anexado pelo usuário.
- Política de commit: nenhum commit ou push autorizado nesta etapa.
