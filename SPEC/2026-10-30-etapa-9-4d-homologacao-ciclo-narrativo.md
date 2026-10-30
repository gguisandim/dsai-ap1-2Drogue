# Etapa 9.4D — Homologação integrada do ciclo narrativo

## Estado anterior e problema observado

As Etapas 9.4A–C entregaram execução transacional de comandos narrativos,
adaptação dos sinais reais de gameplay e liquidação idempotente de recompensas.
A inspeção do código encontrou, porém, uma lacuna de integração: o roteador de
campanha conhece condições de aresta e de saída, mas a `GameScene` não projeta
para ele as condições já satisfeitas pelo estado narrativo. Assim, uma missão
pode concluir e liberar uma saída declarativamente sem que a saída física se
torne utilizável durante a mesma visita.

Esta etapa corrige somente essa fronteira e acrescenta um cenário isolado de
desenvolvimento que exercita o ciclo completo. Ela não altera a narrativa do
Vestígio Submerso, não registra conteúdo de teste na campanha normal e não
inicia a Etapa 9.5.

## Cenário de homologação

O laboratório narrativo é um capítulo privado de desenvolvimento com duas
fases autorais pequenas:

- `dev.narrative-cycle.trial`: entrada, NPC, diálogo de duas escolhas, inimigo,
  item de missão e saída condicionada;
- `dev.narrative-cycle.destination`: destino canônico da transição e saída de
  retorno para permitir revisita.

Na fase de prova, a escolha aceita inicia uma missão com dois objetivos
obrigatórios: derrotar um inimigo de arquétipo declarado e coletar uma chave.
A conclusão concede moeda e um desbloqueio, registra a conclusão da fase e
libera a saída física. A escolha alternativa persiste somente a sua própria
consequência e permite retomar o diálogo para aceitar a prova depois.

O laboratório usa registro, loader, composição narrativa, progressão,
persistência e roteamento públicos. Ele é aberto apenas em desenvolvimento por
uma entrada externa à `GameScene`; o motor recebe um runtime genérico, sem IDs
ou condições específicas do cenário.

## Integração de acesso narrativo à navegação

Um adaptador de aplicação deriva o acesso atual a partir de:

- `unlockedExitIds` persistidos na sessão narrativa;
- condições das arestas de saída avaliadas pelo `StageDirector`;
- estado atual do roteador de campanha.

O adaptador chama uma porta genérica de acesso do roteador e reinspeciona a
navegação. A sincronização ocorre após restauração, escolha, sinal de gameplay,
liquidação de recompensa e entrada de fase. O `CampaignMacroRouteBinder`
preserva o acesso ao recriar seu roteador interno.

## Persistência e idempotência

O laboratório usa chaves próprias para o run e para a progressão de
desenvolvimento. O save narrativo continua versionado por campanha, run,
capítulo, fase e instância. Repetições de escolha, sinais, liquidação e visita
devem manter as garantias de idempotência existentes; não se promete uma
transação atômica entre storages independentes.

Interrupções serão cobertas por teste nos limites observáveis: após escolha,
combate, coleta, liquidação pendente, conclusão e transição preparada. O reload
deve restaurar o último estado confirmado, e uma operação pendente deve ser
recuperável sem duplicar recompensa.

## Diagnósticos mínimos

O cenário expõe uma leitura somente de desenvolvimento contendo run, nó/fase,
visita, flags, missões e objetivos, operações narrativas pendentes, recompensas
confirmadas, conclusões e destinos físicos. Essa leitura reutiliza snapshots
dos serviços; não cria outro event bus nem reconstrói o World Lab.

## Critérios observáveis

1. O módulo da prova é validado e carregado pelo `StageLoader`.
2. O cenário não aparece no registro nem no grafo da campanha normal.
3. O diálogo apresenta duas escolhas e persiste somente a selecionada.
4. Abrir o diálogo pausa gameplay; fechá-lo retoma a simulação.
5. Derrota e coleta reais emitem sinais que avançam objetivos distintos.
6. A recompensa é aplicada e confirmada exatamente uma vez.
7. A missão concluída registra a fase e libera sua saída física.
8. A saída confirma o destino canônico e carrega a segunda fase.
9. Reload e revisita restauram progresso sem repetir escolha ou recompensa.
10. Falhas nos limites persistidos mantêm operações recuperáveis e não
    promovem estado não confirmado.
11. O modo legado e as campanhas existentes mantêm o comportamento anterior.

## Testes e validação

Serão adicionados testes de integração apenas para as fronteiras encontradas:

- validação e isolamento do cenário;
- projeção de condições narrativas para navegação física;
- ciclo diálogo → objetivos → recompensa → conclusão → transição;
- restauração, revisita e interrupções idempotentes;
- compatibilidade da porta macro ao recriar roteadores.

Validação final: testes direcionados, suíte completa, typecheck, build,
`check:gates` e `git diff --check`. A homologação Phaser deve usar navegador,
movimento e interação reais. Se a infraestrutura do navegador estiver
indisponível, isso será registrado como pendência e a etapa não será declarada
funcionalmente homologada.

## Fora de escopo e risco remanescente

Não há novos sistemas narrativos, inimigos, biomas, editor, event bus ou
garantia transacional entre o save narrativo, o save do run e a progressão. O
cenário é funcionalmente representativo, mas não constitui conteúdo artístico
ou capítulo de produção.

## Resultado da execução em 2026-10-30

### Evidência automatizada

- suíte direcionada: 6 suítes e 44 testes aprovados;
- suíte completa: 65 suítes e 901 testes aprovados;
- typecheck aprovado;
- build aprovado, com 722 módulos transformados;
- architecture e traceability gates aprovados;
- `git diff --check` aprovado.

O teste integrado do laboratório percorreu os serviços reais para escolha,
objetivos de combate e coleta, evento de encontro, duas recompensas,
confirmação idempotente, conclusão, desbloqueio, preparação e confirmação da
transição canônica. Outro teste restaurou escolha e objetivo parcial pelo save
existente. As regressões anteriores de operações pendentes continuam cobrindo
a interrupção entre concessão externa e confirmação narrativa.

### Evidência de navegador

O servidor Vite foi aberto em
`http://127.0.0.1:5173/?narrativeCycleLab=1`. No Opera foi observado o mapa
autoral, spawn, NPC/POI, inimigo, item, saída e HUD reais. Reload restaurou o
laboratório e a posição inicial. Cliques no canvas foram recebidos.

A automação Windows, entretanto, não conseguiu entregar teclas SendInput ao
canvas Phaser no Opera; nem `E` nem sequências de movimento produziram eventos
no jogo. O navegador integrado também não pôde ser usado porque seu host de
acesso estava indisponível. Teclado físico havia movimentado o jogador durante
a primeira tentativa, confirmando que o canvas aceita entrada humana, mas isso
não substitui uma homologação automatizada reproduzível.

Consequentemente, diálogo, pausa/retomada, combate, coleta, travessia e reload
pós-transição não foram todos comprovados visualmente de ponta a ponta. A Etapa
9.4D fica implementada e validada por integração automatizada, mas **não é
declarada funcionalmente homologada no navegador**. Antes da Etapa 9.5, é
necessário repetir o roteiro visual em um host de navegador que encaminhe
teclas mantidas ao canvas e anexar a evidência resultante.
