# Integração dos eventos de gameplay com a narrativa — Etapa 9.4B *(2026-10-29)*

## Relação com as etapas anteriores

Esta SPEC complementa as Etapas 9.3B e 9.4A. Não altera o formato de
`StageSignal`, não cria outro event bus/processador e não inicia a liquidação de
`reward.grant` da 9.4C. `GameScene` continua autoridade sobre combate, coleta,
ondas e navegação; o runtime narrativo apenas observa fatos já confirmados.

## StageSignalAdapter

`src/application/stages/StageSignalAdapter.ts` é um adapter application-only,
sem Phaser. Ele recebe uma ocorrência de gameplay tipada e produz exatamente um
`NarrativeDomainEvent`, delegando a `GameNarrativeSession`:

- `enemy.defeated`: depois de `Enemy.die`, com `enemyId`, `archetype` e ID da
  ocorrência de spawn;
- `item.collected`: depois de os efeitos legados da coleta serem aplicados e o
  item ser removido;
- `encounter.completed`: uma vez por onda concluída e uma vez para o encontro
  integral da fase;
- `stage.exit.requested`: depois de o router resolver a saída física para o
  `stageExitId`, antes da confirmação da transição.

O adapter valida IDs locais estáveis e monta IDs no formato
`gameplay.<tipo>.<occurrenceId>`. Run, capítulo, fase, revisão e instância da
fase continuam sendo acrescentados por `scopeNarrativeId`, no runtime existente.

## Identidade e revisitas

Ocorrências da cena usam o escopo
`<stageInstanceId>.visit.<revisitCount>`. Inimigos acrescentam onda e posição no
lote de spawn; itens autorados acrescentam índice; drops acrescentam a
ocorrência do inimigo e o índice do drop. O contador de revisita vem do estado
durável do `CampaignRouter`. Assim, repetir callback/frame na mesma visita é
deduplicado, enquanto uma visita nova produz IDs novos coerentes com a
semântica dos `transitionId` já confirmados pelo router.

## Persistência e falhas

`GameNarrativeSession.processGameplayEvent` processa pelo `StageDirector` e usa
o save existente. Fatos confirmados no gameplay não podem ser desfeitos pelo
runtime narrativo. Portanto, se a escrita falhar:

1. o resultado é uma falha explícita;
2. o snapshot narrativo processado permanece em memória;
3. reenviar a mesma ocorrência resulta em `duplicate` no processador, mas tenta
   salvar novamente;
4. nenhuma experiência, item ou objetivo é duplicado;
5. se a aplicação for encerrada antes de um save posterior bem-sucedido, o fato
   narrativo não confirmado em disco pode ser perdido. Não existe transação
   distribuída entre Phaser e storage nesta etapa.

Saídas são diferentes: o router primeiro prepara para obter o `stageExitId`.
Se o sinal narrativo falhar, a preparação é cancelada e a transição não é
confirmada. Novo `E` reenvia o mesmo fato, permitindo retry do save.

## Costura fina na GameScene

- Inimigos recebem metadados de ocorrência no spawn; `Enemy.die` apenas os
  inclui no evento de derrota já existente.
- Itens recebem metadados no spawn. O callback ignora entidades já inativas,
  preserva efeitos/inventário existentes e só então notifica a narrativa.
- A guarda existente `waveTransition` emite uma conclusão por onda. A guarda
  `levelClearedBannerShowing` emite a última onda e o encontro integral uma vez.
- A navegação prepara a saída, publica `stage.exit.requested` com o
  `stageExitId` canônico e só confirma após sucesso narrativo.
- Não há condição por capítulo, Igapó, bioma, missão ou regra narrativa na cena.

## Condições de saída

`StageExitDefinition.condition` continua validada como conteúdo, mas não existe
um contrato público que projete toda condição narrativa sobre a disponibilidade
física no `CampaignRouter`. Esta etapa não implementa avaliação parcial: o
router preserva sua autoridade atual e o runtime apenas observa a tentativa.
O endurecimento dessa projeção permanece pendente.

## Provas automatizadas

Fixture dedicada, sem modificar o Vestígio Submerso, declara missão ativa com
objetivos de derrotar inimigos e coletar item, além de regras para boss,
encontros e saída.

Testes direcionados cobrem:

- inimigo comum, boss/miniboss e fato sem regra;
- coleta confirmada, callback repetido e item sem regra;
- onda, encontro integral e deduplicação de frame;
- saída canônica, cancelamento em falha e retry;
- save falho, retry, reload e revisita;
- compatibilidade com escolhas da 9.4A e progressão legada.

Critério de aceite: uma missão declarativa avança por fatos confirmados de
combate e coleta, encontros disparam regras, reload preserva o snapshot e
callbacks repetidos não duplicam progresso.

## Limitações de homologação

A fixture é headless e não entra no catálogo de produção. Homologação visual só
é declarada se houver navegador disponível e um cenário de desenvolvimento
realmente aberto; testes de shell Phaser não são apresentados como E2E visual.

## Validação realizada em 2026-10-29

- Testes direcionados do adapter e produtores Phaser: 14 testes aprovados; o
  recorte ampliado de onda/campanha chegou a 39 testes aprovados.
- Integrações narrativas, persistência, progressão e campanha: 12 suítes/105
  testes aprovados.
- `npm test -- --runInBand`: 62 suítes/878 testes aprovados na execução final.
  Execuções anteriores detectaram o fallback legado de `requestExit` removido e
  doubles antigos sem `state()`; ambos foram corrigidos sem enfraquecer testes.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, 716 módulos transformados; permanece somente o
  aviso não bloqueante de chunk principal acima de 500 kB.
- `npm run check:gates`: architecture e traceability aprovados.
- Homologação no navegador: não executada. A fixture integrada é headless e não
  foi adicionada ao catálogo de produção; não há alegação de E2E visual.
