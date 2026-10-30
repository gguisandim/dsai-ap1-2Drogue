# Liquidação de recompensas e conclusão de fases — Etapa 9.4C *(2026-10-29)*

## Relação com as etapas anteriores

Esta SPEC complementa as Etapas 9.3B, 9.4A e 9.4B. O runtime narrativo
continua produzindo consequências declarativas e observando fatos confirmados do
gameplay. A progressão existente continua sendo a autoridade das recompensas
externas. Não são criados outro save, outro ledger ou outro sistema de
recompensas.

## Contratos reutilizados

- `StageCommand` e `StageReward` permanecem os contratos de conteúdo;
- `NarrativeEventProcessor`, `NarrativeState` e `StageDirector` continuam
  responsáveis por deduplicação e journaling narrativos;
- `GameNarrativeSession.pendingRewardCommands()` expõe operações ainda não
  confirmadas e `confirmOperation()` confirma com persistência e rollback;
- `ProgressionService` e `ProgressionStorage` continuam sendo a autoridade por
  moeda, desbloqueios, ledger de operação e persistência de progressão;
- `CampaignSaveService` continua persistindo o snapshot narrativo versionado;
- `CampaignRouter` e `GameMacroCampaignAdapter` não recebem semântica nova de
  conclusão ou navegação.

## Componente de liquidação

`NarrativeRewardSettlementService` é um coordenador de aplicação headless. Para
cada `reward.grant` pendente, ele:

1. valida comando, `operationId` e payload;
2. converte somente `progression.currency` e `progression.unlock` para a
   recompensa pública da progressão;
3. chama a concessão idempotente do `ProgressionService` com o mesmo
   `operationId` escopado pelo runtime narrativo;
4. exige escrita durável e releitura do ledger de progressão;
5. somente então chama `GameNarrativeSession.confirmOperation()`;
6. reporta `applied` quando concedeu agora ou `reconciled` quando a progressão
   já possuía a operação e faltava apenas confirmar a narrativa.

`stage.flag` permanece consequência interna e imediata do runtime narrativo;
ele nunca deve chegar ao liquidante. Tipos desconhecidos e comandos que não
sejam `reward.grant` falham explicitamente, sem conversão silenciosa. O lote
para na primeira falha para manter ordem observável e pode ser repetido com o
mesmo resultado final.

## Idempotência e ordem de persistência

Os dois saves não são atômicos. A ordem obrigatória é:

```text
pending narrativo -> progressão + ledger durável -> confirmação narrativa
```

O ledger `ProgressionState.operationLedger` é a barreira contra duplicação. A
Etapa 9.4C deixa de descartar IDs antigos após 256 operações: retenção limitada
permitiria reaplicar uma recompensa narrativa antiga em revisitas longas. Saves
v1 anteriores continuam válidos e são carregados aditivamente.

Recuperação:

- falha de validação ou antes da concessão: nenhuma mutação;
- falha de escrita/releitura da progressão: rollback da progressão em memória e
  operação narrativa pendente;
- progressão persistida e confirmação narrativa falha: a operação continua
  pendente; retry/reload encontra o ledger, deduplica a concessão e tenta apenas
  a confirmação;
- confirmação bem-sucedida: a operação deixa o journal pendente;
- revisita sem nova ocorrência: não há nova operação; uma ocorrência nova só
  concede se o conteúdo produzir outro `operationId` escopado.

Não existe janela conhecida em que a confirmação narrativa preceda a
concessão durável. Uma interrupção depois da confirmação pode afetar somente o
feedback visual transitório, nunca a recompensa persistente.

## Semântica de `stage.complete`

`stage.complete` deixa de ser comando adiado. Quando alcançado por regra de
evento ou turno de diálogo válido, o processador:

- valida o `exitId` pelo registry já existente;
- registra `StageCompletionRecord { occurrenceId, exitId }` no
  `NarrativeState`;
- inclui run, capítulo, stage, revisão e `stageInstanceId` no escopo da
  ocorrência;
- desbloqueia o exit declarado, sem atravessá-lo;
- deduplica a mesma ocorrência e persiste com o snapshot narrativo.

O campo `completedStageOccurrences` é aditivo e opcional no save v1. Saves
anteriores o restauram como lista vazia. A ocorrência deriva do evento causal
ou do comando de diálogo, não de índice de array, texto exibido ou coordenada.

Conclusão narrativa, solicitação de saída, transição física e conclusão da
campanha continuam fatos distintos. Em particular, `stage.complete` não chama
o router, não muda a fase atual, não concede recompensa implícita e não conclui
a campanha. A navegação continua exigindo uma saída física e o fluxo atual do
`CampaignRouter`.

## Integração fina com Phaser

`GameScene` apenas instancia o liquidante e solicita liquidação nos limites já
existentes: restauração, entrada, sinal de gameplay confirmado e commit de
turno de diálogo. Não há polling por frame nem condição por capítulo. O overlay
de diálogo apenas notifica que um commit persistiu; ele não conhece progressão.

O feedback reutiliza o banner existente e só aparece depois da confirmação
completa. Falhas usam o diagnóstico já apresentado pela campanha. A moeda da
progressão não é espelhada no saldo transitório de halos do `Player`, pois isso
criaria um segundo consumidor sem ledger; o estado durável da progressão é a
autoridade nesta etapa.

## Critérios observáveis e testes

Testes direcionados devem comprovar:

1. moeda e desbloqueio simples, além de duas operações distintas;
2. duplicata, reload após concessão e reload entre concessão e confirmação;
3. rollback em falha da progressão e retry determinístico;
4. falha de confirmação narrativa seguida de reconciliação;
5. revisita sem duplicação;
6. comando inválido e recompensa não suportada sem confirmação;
7. conclusão válida, duplicada, restaurada e independente de transição;
8. leitura de saves narrativos e de progressão anteriores aos novos campos;
9. regressão das escolhas 9.4A e dos sinais 9.4B;
10. cenário headless integrado: entrada, objetivo por gameplay, missão,
    recompensa, conclusão, saves, reload e nova tentativa sem duplicação.

O browser só conta como homologação visual quando uma sessão Phaser real for
aberta e operada. Testes Jest com doubles Phaser permanecem integração headless.

## Limitações conhecidas

- `dialogue.start` continua adiado; não faz parte da 9.4C.
- A conclusão narrativa não projeta automaticamente todas as condições de exit
  no router físico; ela apenas registra a consequência já autorizada pelo
  conteúdo validado.
- O feedback visual é transitório e não participa da transação distribuída.
- Esta etapa não adiciona conteúdo de história nem altera a topologia da
  campanha.

## Validação realizada em 2026-10-30

- Testes direcionados de liquidação e conclusão: 2 suítes/19 testes aprovados.
- Regressão próxima de narrativa, progressão, persistência, composição e sinais:
  6 suítes/46 testes aprovados; a integração fina da cena recebeu uma prova
  adicional de cancelamento de navegação quando a recompensa permanece pendente.
- Cenário headless integrado aprovado: entrada, duas derrotas, conclusão da
  missão, duas recompensas, `stage.complete`, persistência, reload e replay sem
  duplicação.
- `npm test -- --runInBand --silent`: 64 suítes/898 testes aprovados.
- `npm run typecheck`: aprovado; também executado dentro do build final.
- `npm run build`: aprovado fora do sandbox após bloqueio de leitura do esbuild;
  718 módulos transformados. Permanece apenas o aviso não bloqueante do chunk
  principal acima de 500 kB.
- `npm run check:gates`: architecture (810 arquivos/2898 dependências) e
  traceability aprovados.
- Homologação visual Phaser: servidor Vite iniciado em `127.0.0.1:5173`, mas o
  host de navegador e o pipe nativo de computer-use estavam indisponíveis. Não
  há alegação de E2E visual; a evidência funcional desta etapa é headless.

