# Campanha por rotas independentes — Etapa 9.1

Data: 2026-10-28

## Relação com as SPECs anteriores

Esta SPEC substitui somente a interpretação do `CampaignGraph` de nove
profundidades como estrutura completa da campanha. A SPEC
`2026-10-28-campanha-procedural-ramificada.md` continua válida para grafos
procedurais internos a uma rota, seus nodes, saídas físicas, router, saves e
recompensas idempotentes.

O nível macro pode conter ciclos legítimos entre hub e rotas. Ele não é
submetido ao `CampaignGraphValidator`, não altera o gerador existente e não
codifica hub ou retornos como nodes artificiais do DAG.

## Objetivo observável

O estado inicial aponta para `Floresta das Raízes`. Três rotas independentes
podem ser iniciadas e concluídas em qualquer ordem. Cada rota exige suas regiões
em ordem e um marco narrativo próprio. As três conclusões desbloqueiam a camada
corrompida; o marco obrigatório dessa camada desbloqueia `Palácio do Credor`.

O esqueleto é headless, serializável, determinístico e inspecionável pelo World
Lab. Nenhum placeholder é apresentado como fase carregável ou saída física.

## Contratos macro

`CampaignMacroDefinition` é conteúdo declarativo imutável e separado do estado:

- `CampaignHubDefinition`: hub inicial e seus hooks narrativos futuros;
- `CampaignRouteDefinition`: identidade, regiões ordenadas e marco de conclusão;
- `CampaignRegionDefinition`: camada, dificuldade, retorno ao hub e referência
  de conteúdo;
- `CampaignMilestoneDefinition`: escopo, operação externa estável e hooks;
- `CampaignUnlockCondition`: `always`, todas as rotas concluídas ou marco
  concluído;
- `CampaignCorruptedLayerDefinition` e `CampaignFinalDefinition`;
- `CampaignContentReference`: união discriminada entre `stage` carregável e
  `planned` explicitamente não carregável.

Hooks aceitam apenas IDs de NPC, missão, diálogo, evento e beat. Não aceitam
callbacks. IDs de exibição, coordenadas e índices não são identidades.

## Esqueleto Umbra Trail

```text
camada 0  Floresta das Raízes
          ├─ Rota das Águas: Igapó → Mangues → Porto → marco das águas
          ├─ Rota da Floresta: Fungos → Copas → Flores → marco da floresta
          └─ Rota da Terra: Areias → Ruínas → Cicatriz → marco da terra

camada 2  Minas → Cinzas → Temporal → Complexo Industrial
          → marco corrompido obrigatório

camada 3  Palácio do Credor
```

Todos esses locais usam `CampaignContentReference.kind = planned` na Etapa
9.1. Portanto são visíveis na inspeção, mas `exposePhysicalExit` permanece
falso. A Etapa 9.2 deverá trocar uma referência por `stage` somente depois que o
`StageRegistry` e o `StageLoader` confirmarem o ID.

## Estado e progressão

`CampaignMacroProgressState` é aditivo em `CampaignRunState.macroProgress`:

- identidade e revisão da definição;
- local atual (`hub`, `route`, `corrupted` ou `final`);
- estado por rota (`not-started`, `in-progress`, `completed`);
- regiões concluídas por rota;
- marcos concluídos;
- status persistidos da camada corrompida e do final;
- IDs de operação processados para idempotência.

O `CampaignRunState` continua autoridade do grafo ativo, node, histórico,
placements, checkpoints e journal de recompensas. O estado macro não copia
`NarrativeState`, grafo, seed, flags, missões ou recompensas.

`CampaignMacroProgression` recebe comandos discriminados. Região concluída não
conclui automaticamente uma rota; o marco correspondente é obrigatório. Um
`operationId` repetido devolve sucesso `duplicate` sem mutação, persistência ou
nova operação externa. A conclusão de marco emite uma única vez o
`completionOperationId` declarativo; o consumidor futuro ainda deve deduplicar
esse ID.

Ao receber `CampaignRunSaveService`, a progressão grava o candidato com
preflight otimista e só troca sua referência em memória após sucesso. Falha
preserva o estado anterior. Saves v1 sem `macroProgress` continuam produzindo
os mesmos bytes e são atualizados aditivamente somente quando uma sessão macro
é criada de forma explícita.

## Navegação e integração futura

`inspect()` calcula autorizações macro e produz escolhas estáveis com
`connectionId`, origem, destino, bloqueio, conteúdo e
`requiresPhysicalExit = true`. Essa inspeção não move o player e não escolhe
tiles.

Na Etapa 9.2, uma escolha somente poderá ser exposta quando:

1. estiver desbloqueada pela progressão macro;
2. sua referência for `stage`, nunca `planned`;
3. o `StageLoader` preparar o destino;
4. `PhysicalExitResolver` e `CampaignExitBinder` produzirem o binding;
5. o `CampaignRouter` confirmar a transição do grafo interno da rota.

Retorno ao hub troca o contexto macro somente em pontos declarados. O grafo
interno e seus checkpoints permanecem no save para continuação. Como o save
atual possui um único grafo ativo, alternância durável entre múltiplos grafos de
rota exige um catálogo de snapshots por rota; isso é dependência explícita da
Etapa 9.2 e não será simulada por cópias no estado macro.

## Critérios e testes

- definição tem IDs estáveis, referências válidas, três rotas e nenhuma
  região sem caminho de retorno declarado;
- todas as seis ordens de conclusão das rotas produzem o mesmo desbloqueio;
- faltar uma rota mantém camada corrompida bloqueada;
- final permanece bloqueado até o marco corrompido;
- retorno ao hub preserva regiões concluídas e permite continuar a próxima;
- save/load preserva progresso macro e os campos existentes da run;
- save antigo sem macro continua válido e byte-estável;
- operação repetida não emite recompensa/operação externa novamente;
- placeholders nunca expõem saída física;
- piloto e flags atuais continuam inalterados.

## Fora do escopo da Etapa 9.1

- mudanças em `GameScene`, Phaser, combate, IA, movimentação ou progressão;
- mapas, assets, NPCs, diálogos completos ou missões secundárias;
- registrar os placeholders no `StageRegistry`;
- trocar grafos ativos, posicionar portais ou tornar o esqueleto jogável;
- garantir exatamente-uma-vez em sistemas externos sem deduplicação.

## Evidência de implementação

`campaignMacroProgression.test.ts` adiciona 18 cenários: definição e IDs,
inspeção determinística para World Lab, placeholders não expostos, seis
ordens de conclusão, bloqueios, retorno e continuação, ordem de regiões, marco
corrompido, final, deduplicação, round-trip, compatibilidade de save, rollback e
corrupção externa.

Resultados em 2026-10-28: 779 testes em 47 suítes, typecheck, build com 705
módulos, architecture gate com 1.701 arquivos/3.700 dependências,
traceability gate com 15 registros v1 e oito legados e `git diff --check`
aprovados.

