# Etapa 9.6E.2 — Topologias flexíveis, bifurcações e revisitas

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.6E.1; preserva a política
`umbra.fixed-nine.v1` e não antecipa a revisão estrutural de identidade e
persistência da 9.6E.3.

## Objetivo

Permitir que o compositor existente solicite ao `CampaignGraphGenerator` uma
campanha determinística com bifurcação, convergência e uma revisita controlada,
sem criar outro compositor, grafo, roteador, resolver de saídas ou formato de
save. A nova política é `umbra.branching-nine.v1`; a política linear permanece
compatível e com comportamento inalterado.

## Auditoria das fronteiras reais

| Necessidade | Situação comprovada | Classificação | Decisão |
|---|---|---|---|
| duas saídas de um nó | gerador, resolver e binder já suportam até três; o compositor linear pede uma | composição | a política ramificada exige capacidade real por slot |
| convergência | o gerador já cria duas arestas `rejoin` para o mesmo nó | runtime existente | reutilizar sem refatoração |
| escolha física | o roteador expõe uma transição por aresta e o binder associa uma saída canônica | runtime existente | comprovar por integração |
| retorno | contrato e validador aceitam `return` somente para a profundidade anterior, no mesmo ato e com limite 2 | contrato existente | o adaptador acrescenta somente retorno autorizado |
| revisita | `CampaignRouter` já persiste `revisitCounts`, contagem de arestas, rewards e resume por `nodeId` | persistência existente | validar política do catálogo antes de criar a aresta |
| estado após revisita | save v1 persiste o grafo autoritativo, navegação, resumes, narrativa por nó e journal idempotente | persistência existente | não regenerar topologia durante retomada |
| topologia não linear | serviço e adaptador usam exclusivamente nove slots lineares, quantidade fixa e validação sucessor-a-sucessor | composição | parametrizar slots por política e validar destinos sobre o grafo resultante |
| início por política | `GameSessionService` só constrói a requisição fixa | interface de aplicação | expor API ramificada no mesmo serviço; menu fica pendente |
| inspeção | World Lab projeta nós, tipos de aresta e bindings, mas não política, limite nem estado de visita | ferramenta | ampliar o documento opcionalmente, preservando snapshots antigos |
| capacidade | validador estrutural compara capacidade somente com arestas não-retorno | validação | validar todas as saídas físicas do nó |

`GameScene`, `CampaignRouter`, `PhysicalExitResolver`, `CampaignExitBinder`, o
schema do save e a identidade de `compositionId` não precisam de reescrita.

## Política `umbra.branching-nine.v1`

A política seleciona exatamente nove `stageId` distintos e os materializa em
dez nós. Um stage com `revisit: repeatable` ocupa duas instâncias distintas para
completar a camada de duas alternativas; isso não é uma revisita. A revisita
real usa uma aresta de retorno para um `nodeId` já existente e não cria novo
`stageInstanceId`.

A topologia canônica possui:

- três atos e profundidades 0 a 8;
- uma bifurcação no ato 1, em `act-1.intermediate-a` e
  `act-1.intermediate-b`;
- convergência no marco `act-1.milestone`;
- atos 2 e 3 lineares, mantendo seus rejoins e marcos;
- retorno opcional e determinístico do marco do ato 1 para uma alternativa
  revisitable;
- uma saída progressiva e uma saída de retorno no marco do ato 1;
- nove definições distintas, dez instâncias e identidades de nó únicas.

O stage duplicado precisa declarar `repeatable`. O alvo do retorno precisa
declarar `checkpoint` ou `repeatable`; `forbidden` rejeita a composição. O
retorno e a aresta que leva novamente à convergência usam limite 2. Nenhum
outro ciclo é aceito.

## Composição e destinos

`CampaignCompositionService` continua sendo a única seleção autoritativa. Os
slots, a quantidade de instâncias e as exigências de saída são resolvidos pela
política. O algoritmo mantém consulta ao catálogo, restrições de ato,
dificuldade, região, bioma, beats, revisões e seed.

Na política ramificada:

1. a busca preenche dez slots e só conclui com nove definições distintas;
2. a única repetição aceita é de definição `repeatable`;
3. os dois slots alternativos recebem definições distintas;
4. o adaptador passa os slots ao gerador existente, que produz `branch` e
   `rejoin`;
5. o adaptador acrescenta o retorno controlado e atualiza o limite da aresta de
   reconvergência correspondente;
6. a composição valida a capacidade total e os `targetStageId` declarados para
   cada aresta do grafo final;
7. associação ambígua de destinos repetidos é rejeitada, sem redirecionamento.

O snapshot continua `umbra-campaign-composition` versão 1 e mantém o mesmo
cálculo de identidade: a política faz parte do material já usado pelo cálculo,
sem revisão retroativa. `policyId`, assignments, instâncias e revisões bastam
para reproduzir a composição. O `CampaignRunState` continua guardando o grafo,
arestas, bindings, travessias, visitas, resumes e rewards; ele é a fonte
autoritativa na restauração.

Snapshots fixos antigos, inclusive sem qualquer campo novo opcional de
inspeção, continuam válidos. Não há migração automática.

## Revisita e idempotência

- `stageId` identifica a definição de conteúdo.
- `stageInstanceId` identifica a ocorrência selecionada no snapshot.
- `nodeId` identifica a posição executável do grafo.
- `revisitCounts[nodeId]` é o contador equivalente a `visitId`.
- `runId` isola a campanha.

O router continua responsável por limites, transições e journal. A narrativa e
o resume permanecem indexados pelo nó existente. Reatravessar uma aresta gera
uma ocorrência de transição distinta, mas rewards já liquidadas preservam seus
IDs idempotentes. A política não habilita revisitas globalmente: apenas o
retorno materializado e validado pode ser usado.

## API e World Lab

`GameSessionService` oferece preview e início ramificados pelo mesmo composition
root e pelo mesmo save. Os quatro modos existentes e o início aleatório linear
permanecem inalterados. O catálogo de produção insuficiente deve continuar
falhando com diagnóstico; a seleção no menu é pendência de interface.

O World Lab acrescenta, de modo compatível:

- `topologyPolicyId` no documento;
- `stageInstanceId`, contagem de visitas e indicação do nó atual;
- `traversalLimit` e contagem de travessias nas arestas;
- os tipos `branch`, `rejoin` e `return` já existentes, com seus bindings.

## Critérios observáveis e testes

1. A suíte atual da política fixa permanece aprovada e seus snapshots não
   mudam.
2. Uma fixture sintética de nove definições gera dez nós, três atos, três
   marcos, duas alternativas, convergência e retorno controlado.
3. Seed e catálogo equivalentes produzem snapshot e grafo equivalentes;
   sementes viáveis podem variar a distribuição.
4. Cada bifurcação possui duas saídas físicas distintas e ligadas às arestas
   corretas.
5. Destinos explícitos incompatíveis, capacidade insuficiente, retorno para
   stage `forbidden` e topologia com softlock falham com diagnóstico tipado.
6. Escolher qualquer ramo alcança a convergência e `campaign.complete` sem
   exigir visita ao outro ramo.
7. O retorno aumenta o contador do mesmo nó, respeita limite 2 e não cria nova
   instância.
8. Rewards, narrativa e resumes permanecem consistentes após retorno e reload.
9. Reload antes/depois da bifurcação, na alternativa, após convergência, após
   revisita e próximo da conclusão reutiliza o grafo persistido.
10. World Lab expõe política, nós, arestas, limites, visitas e bindings.
11. Saves legados sem composição e snapshots `umbra.fixed-nine.v1` continuam
    aceitos pelos fluxos existentes.

## Limitações e pendências da 9.6E.3

- o menu não recebe novo controle visual nesta etapa;
- a topologia ramificada v1 usa uma bifurcação canônica no primeiro ato, não um
  editor ou uma linguagem arbitrária de topologias;
- o snapshot de composição não duplica o grafo que já é persistido no run save;
- revisão do significado estrutural de `stageInstanceId`, versionamento do
  snapshot e migrações pertencem à 9.6E.3;
- homologação visual depende de navegador disponível; sem ele, a evidência será
  headless/Phaser e essa limitação será declarada.

