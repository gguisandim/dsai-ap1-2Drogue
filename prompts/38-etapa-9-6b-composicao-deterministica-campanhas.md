# Registro de prompt: Etapa 9.6B — Composição Determinística de Campanhas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6b-composicao-deterministica-campanhas`
- Data: `2026-10-31`
- Agente: `Codex; Claude Code (continuação)`
- Modelo: `desconhecido; deepseek-flash[1m] (continuação, conforme ambiente)`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md`
- Commit: `pendente`
- Execução: `concluída; correção de destinos explícitos finalizada (exitId -> targetStageId) com fixture 35->9 válida e binding de saída de manifesto comprovado; compositor 15/15, recorte integrado 15 suítes/150 testes e suíte completa 71 suítes/966 testes aprovados; typecheck, build, architecture, traceability e git diff --check aprovados`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md`
- `SPEC/README.md`
- `prompts/38-etapa-9-6b-composicao-deterministica-campanhas.md`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/CampaignRunSaveService.ts`
- `src/devtools/world-lab/WorldLabMacroDataService.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/stages/contracts/CampaignComposition.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/CampaignCompositionGraphAdapter.ts`
- `src/stages/runtime/CampaignCompositionService.ts`
- `src/tests/campaignComposition.test.ts`
- `src/tests/worldLabMacroUi.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6B — Composição Determinística de Campanhas

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.6A.

## Objetivo

Implementar um compositor headless capaz de selecionar um conjunto de N fases a partir do `StageCatalogService` e associá-las à estrutura de uma campanha procedural válida.

Exemplo: um catálogo com 35 fases elegíveis deverá permitir selecionar 9 fases, respeitando regras de progressão, atos, dificuldade, marcos narrativos, capacidades de saída e dependências.

A composição deve ser determinística, persistível, validável e independente de Phaser.

**Não criar outro gerador procedural, registry ou sistema de campanhas. Reutilizar `CampaignGraphGenerator`, `CampaignRouter`, `PhysicalExitResolver` e `CampaignExitBinder`.**

## 1. Inspeção obrigatória

Antes de modificar arquivos:

- Ler `AGENTS.md` e as instruções do repositório.
- Ler a SPEC da 9.6A e as SPECs relacionadas às Etapas 8.1–8.4 e 9.3B–9.5.
- Inspecionar `StageCatalog.ts` e `StageCatalogService.ts`.
- Inspecionar `CampaignGraphGenerator`, `CampaignGraphValidator` e `CampaignGraph`.
- Inspecionar `UmbraCampaignSkeleton.ts`, `UmbraCampaignRouteSlice.ts` e `CampaignChapterCatalog`.
- Inspecionar `CampaignRouter`, `CampaignMacroRouteBinder` e persistência de runs.
- Verificar como o sistema diferencia `stageId`, instância de fase, `nodeId`, região e visita.
- Examinar o World Lab e os testes existentes.
- Executar `git status --short` e preservar alterações anteriores.

Não presumir caminhos, contratos ou APIs sem verificar o código.

## 2. Contrato de composição

Criar contratos tipados para descrever uma solicitação de campanha.

A configuração deve contemplar, conforme os contratos reais:

- Seed.
- Quantidade desejada de fases.
- Fases candidatas.
- Distribuição por atos.
- Marcos narrativos obrigatórios.
- Faixas de dificuldade.
- Política de repetição.
- Requisitos de entradas e saídas.
- Dependências narrativas.
- Restrições de região e bioma.
- Identificação da política de composição.

O resultado deve incluir:

- Identificador estável da composição.
- Seed utilizada.
- Versão da política de composição.
- Fases selecionadas e suas revisões.
- Posições ou slots atribuídos.
- Identidades das instâncias.
- Distribuição por atos.
- Relação entre posições e `stageId`.
- Diagnósticos e falhas tipadas.
- Dados necessários à persistência e reprodução.

Não confundir definição de fase com ocorrência de visita.

## 3. Seleção determinística

Implementar um compositor que consuma os candidatos retornados pelo `StageCatalogService`.

Garantir:

1. Mesma seed, catálogo equivalente e configuração produzem a mesma composição.
2. Reordenar o catálogo não altera o resultado.
3. Fases incompatíveis nunca são selecionadas.
4. Fases `planned` ou `individual-only` não participam.
5. Marcos obrigatórios são respeitados.
6. A quantidade solicitada é respeitada quando viável.
7. Restrições de atos, dificuldade e dependências são verificadas.
8. Repetições seguem a política declarada.
9. Seeds diferentes podem produzir combinações distintas.
10. Impossibilidade de composição gera falha tipada, nunca seleção incompleta apresentada como válida.

Utilizar RNG determinístico e isolado do restante do gameplay.

Não depender de `Math.random()` global, ordem de inserção ou estado mutável do Phaser.

Não implementar simplesmente um `shuffle` seguido de seleção dos primeiros N elementos quando isso puder produzir campanhas inválidas.

## 4. Distribuição por atos e narrativa

Respeitar a estrutura narrativa existente.

A composição deve considerar:

- Fases introdutórias.
- Fases comuns.
- Fases especiais.
- Marcos narrativos obrigatórios.
- Fases reservadas para chefes.
- Atos permitidos.
- Dependências entre eventos ou regiões.
- Progressão de dificuldade.

Uma fase reservada para determinado momento narrativo não pode ser posicionada arbitrariamente.

Não inventar novos marcos narrativos específicos para atender aos testes.

Reutilizar os metadados já definidos na 9.6A.

## 5. Integração com a topologia existente

A etapa deve começar pela estrutura de campanha já implementada.

Inspecionar as responsabilidades atuais de:

- `STAGE_IDS`
- `SLICE_TEMPLATES`
- `UmbraCampaignSkeleton`
- `UmbraCampaignRouteSlice`
- `CampaignGraphGenerator`

Criar um adaptador que transforme a composição selecionada em configurações de estágio/região compatíveis com o gerador existente.

O compositor deverá atribuir fases a posições válidas sem recriar o algoritmo de geração do grafo.

Quando tecnicamente possível, substituir o uso de IDs fixos de conteúdo por IDs provenientes da composição.

**Preservar a topologia legada para campanhas e saves anteriores.**

Não tentar implementar nesta etapa um gerador de topologias completamente arbitrárias.

Se houver incompatibilidade entre a quantidade de fases solicitada e a quantidade de posições disponíveis, retornar diagnóstico explícito ou utilizar uma política de topologia suportada e documentada.

Não confundir nove definições selecionadas com nove nós totais do grafo: hubs, revisitas e nós técnicos devem possuir uma política de contagem explícita.

## 6. Compatibilidade com saídas físicas

Garantir que a composição respeite:

- `maximumPhysicalExits`.
- Capacidade declarada no catálogo.
- Destinos válidos.
- Arestas distintas.
- Entradas alcançáveis.
- Binding canônico das saídas.
- Restrições do `StageManifest`.

Reutilizar os validadores e resolvers existentes.

Uma fase incompatível com determinado slot não deve ser atribuída a ele.

Não reposicionar saídas manualmente dentro do compositor.

Não alterar o `PhysicalExitResolver` nem o `CampaignExitBinder` sem necessidade comprovada.

## 7. Persistência da composição

Este é um requisito central.

Depois que uma campanha for criada, sua seleção de fases não pode mudar porque:

- O jogo foi recarregado.
- Novas fases foram cadastradas.
- A ordenação do catálogo mudou.
- A seed foi reutilizada.
- Uma revisão de conteúdo foi publicada.

Definir um snapshot versionado da composição, compatível com a infraestrutura de saves existente.

Persistir as identidades, revisões e atribuições necessárias para restaurar exatamente a campanha iniciada.

Ao retomar, utilizar a composição persistida como fonte de verdade, e não executar novamente o sorteio.

Se alguma fase ou revisão necessária não estiver disponível, retornar diagnóstico tipado e preservar o save original.

Não apagar, sobrescrever ou migrar silenciosamente campanhas anteriores.

Preservar o funcionamento do modelo de persistência legado.

## 8. Política de falhas

Implementar diagnósticos tipados para situações como:

- Quantidade inválida.
- Candidatos insuficientes.
- Marco obrigatório indisponível.
- Restrição de ato incompatível.
- Dificuldade incompatível.
- Dependência narrativa impossível.
- Capacidade de saída insuficiente.
- Topologia incompatível.
- Referência de fase inexistente.
- Revisão incompatível.
- Composição persistida inválida.
- Falha de restauração.

Não produzir campanhas parcialmente válidas.

Diagnósticos devem ser determinísticos e úteis para os próximos validadores e para o World Lab.

## 9. Teste de escala — 35 fases, 9 selecionadas

Reutilizar ou ampliar a fixture sintética criada na Etapa 9.6A.

Criar um conjunto viável de:

- 35 fases catalogadas.
- 9 fases selecionadas por composição.
- Distribuição válida por atos.
- Marcos obrigatórios.
- Dificuldades e capacidades de saída compatíveis.

Validar:

1. Exatamente 9 definições selecionadas, conforme a política de contagem.
2. Nenhuma fase incompatível.
3. Nenhuma repetição indevida.
4. Mesma seleção para seed idêntica.
5. Variação entre seeds diferentes quando houver alternativas válidas.
6. Independência da ordem do catálogo.
7. Distribuição narrativa válida.
8. Composição incompatível rejeitada.
9. Snapshot reproduzível.
10. Retomada independente da ordenação posterior do catálogo.

Não adicionar as 35 fases sintéticas ao jogo de produção.

## 10. Integração com World Lab

Ampliar o modo Campanha para permitir inspecionar composições produzidas pelo novo serviço.

Exibir:

- Seed.
- Quantidade solicitada e selecionada.
- Fases disponíveis.
- Fases escolhidas.
- Ato e posição.
- Marcos obrigatórios.
- Restrições aplicadas.
- Destinos e conexões, quando já resolvidos.
- Diagnósticos de exclusão.
- Identidades e revisões.
- Estado da composição e da validação.

Reutilizar o World Lab existente.

Não implementar ainda a interface de seleção manual do menu principal; isso pertence à 9.6C.

## 11. Compatibilidade com a campanha atual

Preservar:

- Hub e Igapó.
- Fases legadas.
- Navegação atual.
- Campanha macro.
- Saves existentes.
- Revisitas.
- Eventos narrativos.
- Missões e recompensas.
- Geração procedural.
- Temas e assets.
- Transições Phaser.
- World Lab.

Não modificar `GameScene.ts` para decidir quais fases pertencem à campanha.

A composição deve ocorrer antes da execução da campanha, por meio dos serviços de aplicação apropriados.

## 12. Testes obrigatórios

Adicionar testes para:

- Catálogo com candidatos válidos.
- Seleção exata de N fases.
- Catálogo insuficiente.
- Seed repetida.
- Seeds diferentes.
- Ordenação canônica.
- Fases obrigatórias.
- Fases opcionais.
- Fases bloqueadas.
- Fases incompatíveis.
- Distribuição por atos.
- Progressão de dificuldade.
- Dependências narrativas.
- Revisitas.
- Capacidade de saídas.
- Fases com múltiplas saídas.
- Atribuição a slots.
- Composição inválida.
- Serialização do snapshot.
- Reload com composição persistida.
- Mudança posterior do catálogo.
- Revisão de stage incompatível.
- Compatibilidade com saves legados.
- Integração com World Lab.
- Ausência de dependências Phaser.
- Fixture de 35 candidatas e 9 selecionadas.

Adicionar regressões pertinentes à integração com o grafo e o roteador.

Não enfraquecer os testes existentes.

## 13. Documentação

Criar a SPEC:

`SPEC/2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md`

Atualizar `SPEC/README.md`.

Criar o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

Documentar:

- Contratos de composição.
- Política de seleção.
- Garantias determinísticas.
- Distribuição por atos.
- Integração com a topologia.
- Política de contagem das fases.
- Persistência.
- Compatibilidade com saves.
- Diagnósticos.
- Limitações.
- Dependências das Etapas 9.6C e 9.6D.

## 14. Restrições

- Não implementar a 9.6C.
- Não adicionar seleção manual no menu.
- Não implementar editor de fases.
- Não modificar combate ou IA.
- Não criar novo gerador procedural.
- Não criar segundo registry ou router.
- Não implementar carregamento remoto.
- Não adicionar novos biomas.
- Não reescrever a GameScene.
- Não alterar saves legados destrutivamente.
- Não instalar dependências desnecessárias.
- Não criar commit nem executar push.

## 15. Validações finais

Executar:

- Testes específicos do compositor.
- Testes do StageCatalog.
- Testes do CampaignGraphGenerator.
- Testes do CampaignRouter.
- Testes de persistência.
- Testes do World Lab.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir regressões introduzidas.

## 16. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Contratos de composição.
3. Algoritmo de seleção.
4. Política de atos e marcos.
5. Integração com a topologia.
6. Tratamento de capacidades e saídas.
7. Estratégia de persistência.
8. Compatibilidade com campanhas anteriores.
9. Resultado da fixture 35→9.
10. Integração com World Lab.
11. Testes e validações executados.
12. Limitações restantes.
13. Estado para commit.
14. Requisitos para a 9.6C.

**Critério de conclusão:** o Umbra Trail deve conseguir selecionar deterministicamente N fases válidas de um catálogo maior, distribuir essas fases segundo as regras da campanha, produzir uma composição compatível com a topologia suportada e restaurar exatamente a mesma composição após reload, sem modificações específicas no motor.

A implementação deve preparar a futura seleção manual e a autoria open source, mantendo a separação entre catálogo, composição e geração do grafo.
```

### Continuação da mesma etapa

```text
# Continuação da Etapa 9.6B — Finalização da Composição Determinística

Continue a implementação da Etapa 9.6B do Umbra Trail exatamente de onde o agente anterior foi interrompido por limite de uso.

**NÃO reinicie a implementação. Preserve todos os arquivos modificados e não commitados. O trabalho anterior já está majoritariamente concluído.**

## 1. Recuperar o estado atual

Antes de modificar qualquer arquivo:

- Leia `AGENTS.md`.
- Leia `SPEC/2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md`.
- Leia `prompts/38-etapa-9-6b-composicao-deterministica-campanhas.md`.
- Execute `git status --short` e `git diff --stat`.
- Inspecione as mudanças existentes, inclusive alterações herdadas de etapas anteriores.
- Identifique o estado dos últimos testes e correções.

Não execute `git reset`, `git restore`, `git clean` ou qualquer operação que descarte trabalho existente.

## 2. Estado deixado pelo agente anterior

Já foram implementados:

- Contratos headless de composição.
- Serviço de composição determinística com seleção de N fases.
- Distribuição por atos e slots.
- Seleção com backtracking e restrições.
- Integração com `StageCatalogService`.
- Conversão para estruturas compatíveis com o `CampaignGraphGenerator`.
- Snapshot versionado e aditivo no save v1.
- Restauração sem recomposição.
- Projeção da composição no World Lab.
- Fixture com 35 candidatas e 9 fases selecionadas.
- Testes de integração com `CampaignRouter`, `PhysicalExitResolver` e `CampaignExitBinder`.
- SPEC e registro de prompt 38.

Antes das últimas alterações, a suíte completa havia passado com **71 suítes e 963 testes**.

**Atenção: esse resultado não valida automaticamente as alterações realizadas posteriormente.**

## 3. Ponto exato de interrupção

Durante a revisão final, o agente identificou que a capacidade de saída não era suficiente para garantir compatibilidade entre fases com destinos explícitos.

Ele iniciou uma correção para projetar e validar associações:

`exitId → targetStageId`

Arquivos alterados nessa correção:

- `src/stages/contracts/StageCatalog.ts`
- `src/stages/runtime/StageCatalogService.ts`
- `src/stages/index.ts`
- `CampaignComposition.ts` — localizar caminho real.
- `CampaignCompositionService.ts` — localizar caminho real.
- `src/tests/campaignComposition.test.ts`

O último trabalho envolveu investigar também:

- `StageLoadRequest`, em `src/stages/contracts/StageLoad.ts`.
- A navegação implementada em `CampaignRouter.ts`.
- Os destinos explícitos declarados em `manifest.exits`.

**Continue exatamente essa correção antes de fazer outras alterações.**

## 4. Concluir a validação de saídas explícitas

Verifique se o compositor:

1. Preserva os IDs e destinos declarados no manifesto.
2. Diferencia `stageId`, `nodeId`, `exitId` e identificadores de slots.
3. Impede atribuir uma fase a uma posição cujas adjacências contrariem seus destinos explícitos.
4. Respeita a capacidade máxima de saídas.
5. Preserva a correspondência entre arestas, saídas físicas e destinos.
6. Mantém compatibilidade com fases que utilizam saídas sintéticas.
7. Rejeita composições impossíveis com falhas tipadas.
8. Não altera a topologia do grafo para forçar uma seleção inválida.
9. Continua determinístico independentemente da ordem do catálogo.
10. Não quebra o carregamento de fases legadas.

Verifique cuidadosamente a semântica real de `targetStageId` antes de associá-lo à topologia.

Não trate identificadores de definições de fases como se fossem identificadores de instâncias ou nós.

Reutilize `PhysicalExitResolver` e `CampaignExitBinder`.

Não implemente um segundo sistema de saídas.

## 5. Finalizar testes do compositor

Revise `campaignComposition.test.ts`, especialmente as mudanças feitas imediatamente antes da interrupção.

Valide:

- 35 fases candidatas → 9 selecionadas.
- Mesma seed → mesma composição.
- Seeds diferentes → variedade quando possível.
- Reordenação do catálogo.
- Destinos explícitos compatíveis.
- Destinos explícitos incompatíveis.
- Múltiplas saídas.
- Saídas sintéticas.
- Capacidade insuficiente.
- Bifurcações e convergências.
- Rejeição atômica de composição inválida.
- Compatibilidade com o grafo e o roteador.

Execute inicialmente:

`npx jest campaignComposition stageCatalogService --runInBand`

Corrija as regressões encontradas.

## 6. Persistência e restauração

Verifique que o snapshot da composição:

- Preserva as nove fases escolhidas.
- Preserva IDs e revisões.
- Não reexecuta o sorteio após reload.
- Não depende da ordem posterior do catálogo.
- Detecta revisões incompatíveis.
- Preserva o save anterior em caso de falha.
- Mantém compatibilidade com campanhas legadas sem snapshot.

Não alterar destrutivamente o formato v1.

## 7. Revisão da integração

Verifique se a composição realmente consegue atravessar o fluxo:

`StageCatalogService → CampaignCompositionService → CampaignGraphGenerator → PhysicalExitResolver → CampaignExitBinder → CampaignRouter`

Diferencie o que está efetivamente integrado daquilo que permanece apenas headless ou preparado para uso futuro.

Se uma limitação impedir a integração completa, documente-a com precisão, sem simular sucesso.

Preserve o funcionamento do Igapó, da campanha macro e do World Lab.

## 8. Validações finais obrigatórias

Depois da última alteração executável, execute:

- Testes direcionados do compositor.
- Testes de catálogo, grafo, router e persistência.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

A suíte completa anterior de 963 testes não substitui esta execução.

Corrija regressões introduzidas, sem enfraquecer testes.

Evite verificações completas duplicadas enquanto o código ainda estiver sendo modificado.

## 9. Documentação

Revise a SPEC 9.6B e o registro 38 já criados.

Atualize-os para refletir a correção dos destinos explícitos, os resultados finais e as limitações reais.

Não crie outra SPEC ou outro registro para a mesma etapa.

Respeite `umbra-prompt-record/v1` e os gates de rastreabilidade.

## 10. Restrições

- Não iniciar a 9.6C.
- Não implementar seleção manual no menu.
- Não criar outro compositor, registry ou router.
- Não modificar algoritmos procedurais sem necessidade.
- Não modificar combate ou IA.
- Não refatorar amplamente `GameScene.ts`.
- Não alterar saves legados destrutivamente.
- Não incluir alterações de outras etapas sem necessidade.
- Não criar commit.
- Não executar push.

## 11. Relatório final

Apresente:

1. O que já estava implementado.
2. O que faltava concluir.
3. Como a validação de destinos explícitos foi finalizada.
4. Arquivos alterados nesta continuação.
5. Resultado da fixture 35→9.
6. Compatibilidade com saídas físicas e roteamento.
7. Persistência e restauração da composição.
8. Integração efetivamente operacional versus headless.
9. Resultados reais da suíte completa, typecheck, build e gates.
10. Limitações restantes.
11. Se a Etapa 9.6B está pronta para commit.
12. Dependências para iniciar a Etapa 9.6C.

**Critério de conclusão:** selecionar deterministicamente nove fases válidas a partir de um catálogo maior, respeitando atos, dependências, capacidades e destinos explícitos, produzir uma composição compatível com a topologia suportada e restaurá-la sem recomposição, mantendo a campanha existente funcional.

Finalize o trabalho iniciado. Não recomece a implementação nem substitua componentes já funcionais sem justificativa comprovada.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Continuação: o agente anterior interrompeu na validação de destinos
  explícitos; a fixture de 35 fases estava inválida para o `StageValidator`
  (fases sem saída violam o grafo do capítulo). A continuação corrigiu a
  fixture, relaxou a checagem para "ao menos um destino declarado casa com o
  sucessor" e passou a persistir `declaredExits` (`exitId -> targetStageId`).
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
