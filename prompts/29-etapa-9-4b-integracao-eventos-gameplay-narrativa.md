# Registro de prompt: Etapa 9.4B — eventos de gameplay e narrativa

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-4b-integracao-eventos-gameplay-narrativa`
- Data: `2026-10-29`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-etapa-9-4b-integracao-eventos-gameplay-narrativa.md`
- Commit: `pendente`
- Execução: `testes direcionados 39/39; integrações relacionadas 105/105; suíte completa final 878/878; typecheck, build, architecture e traceability gates aprovados; homologação visual não executada porque a fixture é headless`

## Arquivos modificados

- `SPEC/2026-10-29-etapa-9-4b-integracao-eventos-gameplay-narrativa.md`
- `SPEC/README.md`
- `src/application/stages/GameMacroCampaignAdapter.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/StageSignalAdapter.ts`
- `src/application/stages/index.ts`
- `src/entities/Enemy.ts`
- `src/scenes/GameScene.ts`
- `src/tests/fixtures/gameplayNarrativeFixture.ts`
- `src/tests/gameSceneStageSignalIntegration.test.ts`
- `src/tests/macroCampaignPhaserAdapter.test.ts`
- `src/tests/stageCharacterization.test.ts`
- `src/tests/stageSignalAdapter.test.ts`
- `prompts/29-etapa-9-4b-integracao-eventos-gameplay-narrativa.md`

## Prompt efetivamente recebido

```text
# Etapa 9.4B — Integração dos Eventos de Gameplay com a Narrativa

Continue o desenvolvimento do Umbra Trail após a Etapa 9.4A.

**Objetivo:** implementar a integração entre os acontecimentos reais do gameplay e o runtime narrativo, permitindo que missões e condições avancem automaticamente durante combate, coleta, conclusão de encontros e interação com saídas.

Esta tarefa é de implementação efetiva. Não entregue apenas uma análise.

## 1. Inspeção obrigatória

Antes de alterar arquivos:

- Ler `AGENTS.md` e as SPECs das Etapas 9.3B e 9.4A.
- Inspecionar `GameScene.ts`, `GameStageCompositionRoot.ts`, `StageDirector`, `NarrativeEventProcessor`, `NarrativeState`, `QuestEngine` e `CampaignRouter`.
- Localizar os produtores reais de eventos de combate, coleta, ondas e saídas.
- Verificar os contratos existentes de `StageSignal`, `StageEvent` e regras de missão.
- Investigar o `StageSignalAdapter` previsto na SPEC de 2026-10-27.
- Conferir o estado do Git e preservar alterações existentes.

Não assumir que todos os eventos já possuem produtores ou contratos compatíveis.

## 2. Implementar StageSignalAdapter

Criar ou completar um adaptador entre os acontecimentos do jogo e o sistema narrativo existente.

Integrar, conforme os contratos reais:

- `enemy.defeated`
- `item.collected`
- `encounter.completed`
- `stage.exit.requested`

O adaptador deve converter acontecimentos efetivamente confirmados em sinais narrativos válidos, preservando IDs de entidades, estágio, run e ocorrência quando disponíveis.

Reutilizar `StageDirector`, `NarrativeEventProcessor` e os sistemas existentes.

Não desenvolver outro event bus ou processador narrativo.

## 3. Integração com combate

Ao derrotar um inimigo:

1. Confirmar a derrota no sistema responsável.
2. Produzir o sinal narrativo correspondente.
3. Processar regras e objetivos associados.
4. Persistir o progresso segundo a política existente.
5. Impedir processamento duplicado da mesma derrota.

Não emitir eventos por dano, animação de morte ou atualização de frame antes de a derrota estar confirmada.

Preservar o funcionamento de bosses e minibosses.

## 4. Integração com coleta

Quando um item for efetivamente coletado:

- Emitir o sinal apropriado.
- Identificar o item e a ocorrência.
- Atualizar objetivos narrativos.
- Impedir duplicação por múltiplas colisões.
- Preservar o inventário e as regras de coleta existentes.

Não conceder recompensas narrativas pendentes nesta etapa; isso pertence à 9.4C.

## 5. Conclusão de encontros

Integrar a conclusão efetiva de ondas e encontros ao runtime narrativo.

O evento deve ocorrer somente quando o encontro estiver realmente concluído, respeitando os comportamentos existentes de ondas, minibosses e bosses.

Não emitir `encounter.completed` repetidamente durante atualizações da cena.

## 6. Solicitação de saída

Ao tentar utilizar uma saída física:

- Encaminhar `stage.exit.requested` ao runtime narrativo.
- Preservar a associação criada pelo `CampaignExitBinder`.
- Não permitir que uma falha narrativa produza transição considerada bem-sucedida.
- Não duplicar a solicitação pelo pressionamento prolongado de `E`.
- Não modificar indiscriminadamente a navegação existente.

A avaliação completa de `StageExitDefinition.condition`, se ainda não estiver suportada pelos contratos, deve ser documentada como pendência da etapa de endurecimento de contratos. Não introduzir uma implementação parcial silenciosa.

## 7. Idempotência, falhas e persistência

Utilizar os mecanismos existentes de operação, journal e save.

Garantir:

- IDs estáveis por ocorrência lógica.
- Uma aplicação por acontecimento confirmado.
- Deduplicação após reload.
- Revisitas compatíveis com a semântica de `transitionId`.
- Tratamento explícito de falhas.
- Retry seguro quando aplicável.
- Nenhuma duplicação de experiência, itens ou progresso.

Não inventar garantias transacionais entre sistemas que não compartilham transação. Documentar e testar o comportamento em caso de falha de persistência.

## 8. Integração com GameScene

Manter a `GameScene` como adaptador fino.

Ela deve identificar os acontecimentos confirmados e encaminhá-los ao componente apropriado.

Evitar lógica de missão, manipulação direta de flags ou regras específicas de capítulos dentro da cena.

Não adicionar condicionais especiais para o Igapó ou qualquer bioma.

## 9. Testes e homologação

Criar testes para:

- Derrota de inimigo comum.
- Derrota de miniboss ou boss.
- Coleta confirmada.
- Conclusão de onda.
- Conclusão de encontro.
- Solicitação de saída.
- Eventos repetidos.
- Falha de persistência.
- Retry.
- Reload.
- Revisita.
- Inimigo ou item sem regra narrativa.
- Compatibilidade com os diálogos da 9.4A.
- Ausência de regressões na progressão.

Criar um cenário integrado de missão com objetivo de derrotar inimigos e coletar um item, sem alterar a narrativa definitiva do Vestígio Submerso.

Quando possível, homologar no navegador usando um cenário de desenvolvimento realmente jogável.

## 10. Documentação

Criar a SPEC da Etapa 9.4B e o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

Documentar os produtores de sinais, contratos utilizados, semântica de idempotência e limitações conhecidas.

## 11. Restrições

- Não implementar a Etapa 9.4C.
- Não liquidar `reward.grant`.
- Não implementar novos biomas.
- Não criar novos sistemas de combate.
- Não criar outro registry, event bus ou motor narrativo.
- Não modificar amplamente a `GameScene`.
- Não reestruturar saves sem necessidade.
- Não executar commit nem push.

## 12. Validações finais

Executar:

- Testes direcionados.
- Testes de integração.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Corrigir regressões introduzidas.

Apresentar os arquivos modificados, contratos integrados, testes executados, homologação real, limitações e estado final da etapa.

**Critério de conclusão:** uma missão declarativa deve avançar por eventos reais de combate, coleta e conclusão de encontros, preservando o estado após reload, sem duplicar progresso e sem adicionar lógica narrativa específica à GameScene.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: continuação sobre a árvore não commitada das Etapas 9.4A e anteriores.
- Política de commit: `pendente`; nenhum commit ou push solicitado.
