# Execução de comandos narrativos e escolhas — Etapa 9.4A *(2026-10-29)*

## Estado e relação com as etapas anteriores

Esta SPEC sucede apenas a lacuna de apresentação/execução de diálogos da Etapa
9.3B (`SPEC/2026-10-29-etapa-9-3b-modularizacao-narrativa.md`) e não substitui
os contratos de `StageModule`, o runtime narrativo, a campanha macro ou o fluxo
legado. Ela **não** implementa `StageSignalAdapter`, sinais de combate/coleta
(9.4B), liquidação de `reward.grant` (9.4C) nem `stage.complete`. Os comandos
dessas etapas preservam a semântica atual e ficam registrados como adiados.

## Fluxo de execução

1. `DialogueOverlay` abre/avança/escolhe usando `DialogueEngine` (via
   `StageDirector`), que devolve um `DialogueTurn` com:
   - `nodeCommands` = `onEnter` do nó efetivamente entrado;
   - `choiceCommands` = comandos da escolha selecionada (vazio em início/avanço);
   - `fromChoice` = nó de origem e escolha (quando aplicável);
   - `commands` = concatenação na ordem semântica (`choiceCommands` antes de
     `nodeCommands`), mantida para compatibilidade.
2. O turno é aplicado em **uma única transação** por
   `NarrativeEventProcessor.executeCommands`, recebendo um lote por grupo:
   escolha e nó. Cada grupo tem `occurrenceKey` estável e `causeId` para sinais
   derivados (`mission.completed`).
3. O processador clona o estado, aplica os comandos na ordem, processa sinais
   derivados com as regras existentes e só então restaura o estado real. Falha
   em qualquer comando descarta o clone inteiro (sem sucesso parcial).
4. `GameNarrativeSession.applyDialogueTurn` embrulha a execução: tira snapshot,
   aplica, persiste; se a persistência falhar, restaura o snapshot e devolve
   erro. O overlay não apresenta o turno como concluído nesse caso.

`DialogueCompletion` continua sem comandos próprios; consequências de conclusão
são regras `when: dialogue.completed`, disparadas por
`GameNarrativeSession.completeDialogue` (comportamento já existente).

## Ordem e escolhas

- `start`/`continue`: aplicam somente `onEnter` do nó de destino.
- `choose`: aplicam primeiro os comandos da escolha escolhida e depois o
  `onEnter` do nó de destino.
- Escolhas não selecionadas nunca executam comandos.
- O `DialogueEngine` só devolve escolhas cuja condição é satisfeita; a UI exibe
  somente as disponíveis. Escolher uma opção bloqueada por id retorna
  `choice-unavailable` (falha tipada), sem aplicação.
- `DialogueEngine.choose` continua responsável por validar a escolha e montar o
  turno. No fluxo integrado, `StageDirector` executa essa resolução sobre um
  clone e registra a escolha efetiva junto dos comandos do turno, na mesma
  transação. Assim, falha de comando ou de persistência também reverte
  `choices`, sem sucesso parcial. O uso direto de `DialogueEngine` preserva o
  contrato legado de `recordChoice` imediato.

## Idempotência

Novo ledger aditivo no snapshot: `appliedCommandIds?: readonly string[]`.

- Chave por comando: `scopeNarrativeId(identity, 'command',
  "<occurrenceKey>.<índice>")`.
- `occurrenceKey` da escolha: `dialogue.<dialogueId>.choice.<sourceNode>.<choiceId>`.
- `occurrenceKey` do nó: `dialogue.<dialogueId>.node.<nodeId>`.
- Um comando já no ledger é **pulado**; nunca reaplicado após reabrir o diálogo,
  revisitar a fase ou recarregar.
- `reward.grant` mantém a deduplicação por `operationId` (ledger existente); a
  chave de comando é uma segunda proteção.
- Comandos adiados (`dialogue.start`, `stage.complete`) **não** entram no ledger,
  para que 9.4B/9.4C possam executá-los depois.

## Persistência e compatibilidade

- `NarrativeStateSnapshot` ganha o campo **opcional** `appliedCommandIds`.
  Saves antigos (sem o campo) são lidos como lista vazia; o `version` permanece
  `1`; nenhuma chave de storage muda.
- O validador aceita o campo ausente e, quando presente, exige prefixo
  `<scope>.command.` e ids estáveis/únicos.
- `CampaignSaveService.migrateStageResume` continua produzindo snapshots válidos
  (campo omitido).
- Falha de persistência restaura o snapshot narrativo anterior, inclusive a
  escolha registrada; a UI mostra erro e não fecha o diálogo como concluído.
- A política de recompensas por transição da 9.3B não é alterada.

## Tratamento de falhas

Usa `NarrativeOperationFailure`/`NarrativeResult` existentes. Códigos tratados:
`dialogue-not-found`, `dialogue-session-invalid`, `choice-not-found`,
`choice-unavailable`, `invalid-transition`, `transition-limit`,
`processing-limit` e o novo `invalid-command` (tipo fora dos contratos).
Comandos conhecidos mas fora do escopo (9.4B/C) são coletados em
`deferredCommands` e não fingem execução. Não há fallback silencioso para tipo
desconhecido.

## Interface (DialogueOverlay)

- Exibe texto do falante e do nó como hoje.
- Quando há escolhas: lista com a opção selecionada destacada (`▶`), navegação
  por `↑`/`↓`, confirmação com `E`, fechamento com `ESC`.
- Sem escolhas: `E` avança; ao completar, processa `dialogue.completed` e fecha.
- `E` é consumido uma única vez por frame; com o overlay aberto, a cena não
  executa portal/POI no mesmo `E`.
- Pausa física/simulação ao abrir e retoma ao fechar (comportamento 9.3B).
- Falha de execução/gravação mantém o overlay aberto com mensagem de erro e
  permite tentar novamente com `E` (turno pendente), sem apresentar sucesso.

## Fixture e testes

Fixture dedicada (sem alterar a história do Vestígio Submerso) em
`src/tests/fixtures/`, com capítulo/stage próprios, NPC, diálogo de nó inicial
com `onEnter`, duas escolhas disponíveis com `flag.set`, uma escolha bloqueada
por condição e uma regra em `dialogue.completed`.

Testes obrigatórios: `onEnter`, escolha selecionada, alternativa não executada,
escolha bloqueada, escolha inválida, comando desconhecido, ordem, determinismo,
idempotência, reload/restauração, revisita, falha de persistência, diálogo sem
efeitos, não duplicação de eventos, pausa/retomada, prioridade com portais e
regressão do Vestígio Submerso original.

## Limitações desta etapa

- Sinais `enemy.defeated`, `item.collected`, `encounter.completed` e
  `stage.exit.requested`: 9.4B.
- Liquidação de `reward.grant` pendente e `stage.complete`: 9.4C.
- A UI só mostra escolhas disponíveis; opções indisponíveis permanecem ocultas.
- Homologação de escolhas em navegador depende de conteúdo jogável com escolhas;
  a fixture é headless e o Vestígio original não foi alterado.

## Validação realizada em 2026-10-29

- `npm run typecheck`: aprovado.
- `npx jest narrativeChoices --runInBand`: 14 testes aprovados.
- Recorte narrativo, persistência, interação e Phaser: 10 suítes/75 testes
  aprovados antes da regressão modal dedicada.
- `npm test -- --runInBand`: 60 suítes/863 testes aprovados.
- `npm run build`: aprovado (715 módulos transformados; aviso não bloqueante de
  tamanho do bundle já existente).
- `npm run check:gates`: architecture e traceability aprovados.
- Smoke no navegador: não executado porque o pipe nativo e o host do navegador
  integrado estavam indisponíveis. O servidor Vite iniciou normalmente; não há
  alegação de homologação E2E visual das escolhas.
