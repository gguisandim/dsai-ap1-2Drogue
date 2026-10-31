# Etapa 9.6B — Composição Determinística de Campanhas

## Contexto e decisão

A Etapa 9.6A tornou o `StageRegistry` consultável por meio do
`StageCatalogService`, sem selecionar conteúdo. As Etapas 8.1–8.4 já possuem a
topologia validada, o `CampaignGraphGenerator`, o resolver físico e o binding
canônico. Esta etapa acrescenta somente a camada headless que escolhe definições
catalogadas, atribui-as aos slots suportados e delega a geração do grafo.

Não são criados outro registry, router ou gerador. A campanha macro atual e seus
IDs fixos permanecem como caminho legado. A composição dinâmica é uma entrada
aditiva para novas runs e para inspeção no World Lab.

## Política suportada e contagem

A política inicial é `umbra.fixed-nine.v1`. Ela materializa nove definições de
fase em nove slots de conteúdo, três por ato:

```text
act-1.entry -> act-1.intermediate -> act-1.milestone
act-2.intermediate -> act-2.rejoin -> act-2.milestone
act-3.intermediate -> act-3.rejoin -> act-3.milestone
```

Hubs macro, revisitas, arestas e `campaign.complete` não contam como definições
selecionadas. Quantidade diferente de nove falha como `topology-incompatible`;
esta etapa não cria topologia arbitrária.

## Contratos

`CampaignCompositionRequest` declara campanha/run, seed, política, quantidade,
IDs candidatos opcionais, distribuição por atos, marcos obrigatórios, restrições
de região/bioma, requisitos físicos por slot, contexto narrativo e política de
repetição.

`CampaignCompositionSnapshot` é o snapshot versionado e persistível. Ele inclui:

- schema e versão;
- ID e versão da política;
- ID estável da composição e digest do catálogo considerado;
- campanha, run e seed;
- quantidade solicitada;
- atribuições canônicas com stage/chapter e revisões;
- slot, ato, profundidade, papel, região, bioma e identidade da instância;
- restrições e marcos necessários para reproduzir/validar a escolha.

`stageId` continua identificando a definição; `stageInstanceId` identifica a
ocorrência selecionada; o `CampaignGraphGenerator` continua criando `nodeId`; o
router continua contando visitas e transições.

## Seleção determinística

O `CampaignCompositionService` recebe um `StageCatalogService`. Ele considera
somente entradas `campaign-eligible` e marcos `narrative-reserved` explicitamente
requeridos. `planned`, `individual-only`, incompatíveis e bloqueadas nunca são
selecionadas.

Os candidatos são ordenados por ID estável. Para cada slot, uma pontuação FNV-1a
derivada de seed, política, slot e stage ordena as alternativas; um backtracking
determinístico procura uma atribuição completa. Não há `Math.random`, dependência
da ordem do catálogo ou sucesso parcial.

Cada atribuição verifica ato, dificuldade, papel reservado, região, bioma,
eventos concluídos, beats disponíveis, capacidade física e repetição. Beats
fornecidos por slots anteriores tornam-se disponíveis para dependências
posteriores. Marcos e stages obrigatórios são verificados antes do sucesso.

## Integração com o grafo

`CampaignCompositionGraphAdapter` transforma cada atribuição em um
`RegionTemplate` restrito por `slot.<slotId>` e chama o
`CampaignGraphGenerator`. Assim, o algoritmo de topologia, IDs de node/edge,
seeds de stage e validação de grafo continua sendo o existente.

O adapter comprova que cada node gerado corresponde ao slot e ao `stageId` do
snapshot. Capacidade física é filtrada antes da seleção; placement e binding
continuam a cargo de `PhysicalExitResolver` e `CampaignExitBinder` quando o
router inspeciona a fase real.

## Destinos explícitos e saídas sintéticas

O catálogo projeta cada saída do manifesto como `{ id, targetStageId }`. O
`targetStageId` identifica a **definição** de fase de destino ou
`campaign.complete`; nunca um `nodeId`, um `stageInstanceId` ou um identificador
de slot. O compositor usa essa associação para validar a adjacência:

- fase sem saídas declaradas usa slots sintéticos e é compatível com qualquer
  posição;
- fase com saídas declaradas só ocupa uma posição cujo sucessor (ou
  `campaign.complete`, no último slot) apareça entre seus `targetStageId`;
- se nenhum destino declarado casa com a adjacência, a composição falha como
  `destination-incompatible`, sem seleção parcial.

O snapshot persiste a associação `exitId -> targetStageId` em `declaredExits`
por atribuição. O compositor não altera arestas, `exitSlotId`, âncoras ou
placement: `PhysicalExitResolver` e `CampaignExitBinder` continuam autoritativos
quando o router inspeciona a fase real. O adapter não modifica a saída do
`CampaignGraphGenerator`; ele apenas verifica node/slot/stage.

A fixture 35→9 declara fan-out de destinos entre todas as definições
catalogladas para que qualquer definição seja compatível com qualquer posição.
Isso é próprio da fixture: capítulos autorais lineares declaram um destino fixo
e, por isso, só permanecem composíveis quando a adjacência escolhida coincide
com esse destino.

## Persistência e restauração

`CampaignRunState` ganha `composition?` aditivo. Saves v1 antigos sem o campo
continuam canônicos e válidos. `createCampaignRunState` aceita opcionalmente o
snapshot e o save service o canonicaliza e valida sem mudar schema ou storage
key.

Na restauração, o snapshot é a fonte de verdade: não há nova seleção. Cada
stage/chapter e revisão persistida precisa continuar disponível no catálogo,
com as mesmas associações `exitId -> targetStageId`. Novas fases ou outra ordem
não alteram a composição. Referência ausente, revisão divergente, saídas
declaradas alteradas, snapshot inválido ou grafo incompatível falham com
diagnóstico tipado e não escrevem no storage.

## Falhas e diagnósticos

Falhas são atômicas e cobrem: request/quantidade inválida, política/topologia
incompatível, candidatos insuficientes, marco ausente, ato/dificuldade/região/
bioma incompatível, dependência narrativa impossível, capacidade física,
referência/revisão ausente, snapshot inválido, geração do grafo e restauração.

Diagnósticos e exclusões são ordenados por chave estável e ficam disponíveis ao
World Lab.

## World Lab

O modo Campanha passa a expor uma visão de composição com seed, política,
quantidades, stages disponíveis/selecionados, slots, atos, revisões, marcos,
restrições e diagnósticos. Enquanto o catálogo real possuir menos de nove
candidatos, a UI apresenta a falha tipada e mantém a projeção macro legada.
Quando houver catálogo viável, a mesma projeção exibirá as nove atribuições.

Não há seleção manual; isso pertence à 9.6C.

## Compatibilidade

- `UmbraCampaignRouteSlice`, hub, Igapó e saves existentes mantêm o caminho
  legado e os mesmos IDs;
- ausência de `composition` preserva o envelope de run v1;
- nenhuma mudança em `GameScene`, combate, IA, procedural, resolver físico ou
  binder;
- as 35 definições sintéticas existem somente em fixture de teste.

## Critérios observáveis

1. Fixture catalogada com 35 definições produz exatamente nove atribuições.
2. Mesma seed/request e catálogo equivalente produzem snapshot e grafo iguais.
3. Reordenação do catálogo não altera o resultado; seed diferente pode alterar.
4. Planned, individual, incompatível, bloqueada e marco não requerido não entram.
5. Atos, dificuldade, marcos, narrativa, região/bioma e capacidade são respeitados.
6. Repetição segue a política e nunca ocorre silenciosamente.
7. Impossibilidade produz falha tipada sem seleção parcial.
8. O grafo é produzido pelo `CampaignGraphGenerator` e validado pelo validator.
9. JSON/reload restaura o snapshot sem sortear novamente, mesmo com novas fases.
10. Stage ou revisão ausente falha preservando o save original.
11. Save legado sem composição continua válido.
12. World Lab apresenta sucesso ou falha de composição sem perder a macro atual.
13. Serviço e adapter não importam Phaser, DOM, storage ou `GameScene`.
14. `targetStageId` é comparado apenas com `stageId` de definições; `nodeId`,
    `stageInstanceId` e slot nunca são tratados como destino.
15. Fase com múltiplas saídas é aceita quando ao menos um destino casa com o
    sucessor; saída que contrarie todos os destinos falha como
    `destination-incompatible`.
16. Fases sem saídas declaradas continuam composíveis por slots sintéticos.
17. Restauração rejeita revisões ou associações de saída divergentes.

## Testes

- compositor, adapter de grafo e fixture 35→9;
- destinos explícitos compatíveis, incompatíveis e múltiplos; saídas sintéticas;
- catálogo, grafo, router e persistência;
- World Lab headless e UI;
- regressão completa e gates.

## Limitações e próximas etapas

- A topologia `umbra.fixed-nine.v1` é linear: as tags `slot.*` do adapter
  impedem que o gerador abra bifurcações/rejunções. Bifurcação e convergência
  continuam cobertas pelo `CampaignGraphGenerator`, não por esta política.
- A compatibilidade de destino é validada de forma declarativa. O placement
  físico só é conhecido quando o router carrega a fase: se a saída declarada que
  casa com o sucessor não puder ser posicionada, o binding falha com
  diagnóstico tipado (`campaign-exit.*`) em vez de redirecionar silenciosamente
  para outro destino.
- Capítulos autorais lineares declaram um destino fixo; uma composição só os
  aceita quando a adjacência escolhida coincide com esse destino. A fixture
  35→9 usa fan-out sintético justamente para exercitar a seleção ampla.
- A restauração exige revisões e associações de saída idênticas; não há
  recomposição automática nem migração de snapshot incompatível.

9.6C poderá fornecer seleção manual usando o mesmo request/snapshot. 9.6D poderá
ampliar políticas/topologias e migração explícita de campanhas. Esta etapa não
suporta quantidade diferente de nove, topologia arbitrária, conteúdo remoto ou
recomposição automática de snapshot incompatível.
