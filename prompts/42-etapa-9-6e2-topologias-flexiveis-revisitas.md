# Registro de prompt: Etapa 9.6E.2 — Topologias Flexíveis, Bifurcações e Revisitas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6e2-topologias-flexiveis-revisitas`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6e2-topologias-flexiveis-revisitas.md`
- Commit: `pendente`
- Execução: `concluída; recorte dirigido 13 suítes/171 testes aprovado; primeiro fechamento completo revelou duas regressões no retorno macro, corrigidas e revalidadas em 4 suítes/55 testes; fechamento final 74 suítes/1009 testes aprovado; typecheck, build, architecture, traceability e git diff --check aprovados; smoke visual confirmou menu do jogo e modos Procedural/Campanha do World Lab, enquanto a campanha ramificada permaneceu validada pela API e pela integração headless/Phaser`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6e2-topologias-flexiveis-revisitas.md`
- `SPEC/README.md`
- `prompts/42-etapa-9-6e2-topologias-flexiveis-revisitas.md`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/GameSessionService.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/stages/contracts/CampaignComposition.ts`
- `src/stages/index.ts`
- `src/stages/runtime/CampaignCompositionGraphAdapter.ts`
- `src/stages/runtime/CampaignCompositionService.ts`
- `src/stages/runtime/CampaignGraphGenerator.ts`
- `src/stages/runtime/CampaignGraphValidator.ts`
- `src/tests/campaignComposition.test.ts`
- `src/tests/gameSessionService.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6E.2 — Topologias Flexíveis, Bifurcações e Revisitas

Continue o desenvolvimento do **Umbra Trail**, após a conclusão da Etapa 9.6E.1.

## Objetivo

Implementar a composição e execução de campanhas com topologias ramificadas, permitindo bifurcações, convergências e revisitas controladas.

Atualmente, `umbra.fixed-nine.v1` seleciona nove fases e as organiza em uma sequência linear. O objetivo é permitir que essas nove fases também possam formar grafos com caminhos alternativos, sem perder determinismo, marcos narrativos, navegação física ou persistência.

**Não criar um novo sistema de campanha. Reutilizar `CampaignGraphGenerator`, `CampaignRouter`, `PhysicalExitResolver`, `CampaignExitBinder` e `CampaignCompositionService`.**

## 1. Inspeção obrigatória

Antes de implementar:

- Ler `AGENTS.md`.
- Ler as SPECs 8.1–8.4, 9.6A–D e 9.6E.1.
- Inspecionar `CampaignGraphGenerator` e `CampaignGraphValidator`.
- Inspecionar `CampaignCompositionService` e `CampaignCompositionGraphAdapter`.
- Inspecionar `UmbraCampaignSkeleton` e `UmbraCampaignRouteSlice`.
- Inspecionar `CampaignRouter` e suas regras de travessia.
- Inspecionar `PhysicalExitResolver` e `CampaignExitBinder`.
- Inspecionar `GameSessionService` e `GameScene`.
- Inspecionar os contratos de revisita do `StageCatalog`.
- Inspecionar snapshots, saves e restauração da campanha.
- Inspecionar o World Lab.
- Executar `git status --short` e preservar alterações existentes.

Identificar o suporte real a bifurcações, convergências e ciclos. Não assumir que o gerador ou roteador já suporta todas essas operações.

## 2. Auditoria das limitações atuais

Identificar precisamente quais restrições impedem:

1. Um nó possuir duas ou mais saídas.
2. Dois caminhos convergirem em um mesmo nó.
3. O jogador escolher destinos diferentes.
4. Uma aresta permitir retorno.
5. O jogador revisitar um nó.
6. A campanha preservar estados após a revisita.
7. O compositor utilizar uma topologia não linear.
8. O menu iniciar campanhas com outra política.

Classificar cada impedimento como contrato, validação, composição, runtime, persistência ou interface.

Registrar os problemas comprovados na SPEC antes das correções.

Não refatorar componentes que já suportam essas operações corretamente.

## 3. Nova política de topologia

Preservar integralmente:

`umbra.fixed-nine.v1`

Criar uma política versionada para campanhas ramificadas, seguindo a convenção real do projeto. Nome sugerido:

`umbra.branching-nine.v1`

A nova política deverá:

- Trabalhar com nove definições de fases selecionadas.
- Permitir múltiplas arestas de saída.
- Permitir caminhos alternativos.
- Permitir convergências.
- Preservar três atos.
- Preservar três marcos narrativos.
- Garantir início e conclusão alcançáveis.
- Respeitar capacidade de saídas.
- Respeitar destinos explícitos.
- Permitir revisitas apenas quando declaradas e suportadas.
- Produzir resultados determinísticos.

Não confundir número de fases selecionadas com número de arestas.

Não substituir snapshots antigos pela nova política.

Não reescrever o algoritmo de geração do grafo se ele já possuir suporte às estruturas necessárias.

## 4. Integração do compositor

Ampliar o `CampaignCompositionService` e seu adaptador para trabalhar com a nova política.

A composição deve:

1. Consultar candidatas no `StageCatalogService`.
2. Selecionar nove fases válidas.
3. Distribuí-las conforme os atos.
4. Respeitar marcos narrativos.
5. Construir ou solicitar uma topologia ramificada válida.
6. Associar cada definição de fase aos nós previstos.
7. Verificar capacidade e destinos das saídas.
8. Produzir um snapshot persistível.
9. Rejeitar composições impossíveis com diagnósticos tipados.

Preservar a política linear como alternativa.

Não implementar um segundo compositor nem outro grafo autoritativo.

## 5. Bifurcações e convergências

Implementar suporte efetivo a estruturas como:

Início → Fase A → Fase B ou C → Fase D → Próximo ato.

A escolha de caminho deve ser feita por uma saída física correspondente.

Garantir:

- Cada saída identifica uma aresta específica.
- Arestas distintas não compartilham acidentalmente o mesmo destino.
- A convergência utiliza a identidade correta do nó de destino.
- O jogador não precisa obrigatoriamente visitar todos os ramos.
- Marcos narrativos continuam obrigatórios quando exigidos.
- Nenhum ramo válido termina em um beco sem saída indevido.

Uma fase com duas saídas precisa possuir capacidade real para ambas.

Não criar saídas fictícias somente para satisfazer testes.

## 6. Revisitas controladas

Implementar revisitas respeitando a política declarada no catálogo e as limitações do roteador.

Distinguir:

- `stageId`: definição da fase.
- `stageInstanceId`: instância da fase na composição.
- `nodeId`: posição no grafo.
- `visitId` ou contador equivalente: visita à instância.
- `runId`: campanha.

Revisitar um nó existente não deve criar automaticamente uma nova instância da fase.

Ao retornar, preservar o estado persistente correspondente e aplicar apenas os resets previstos pela política.

Garantir:

- Contagem correta de visitas.
- Limites de travessia respeitados.
- Nenhum loop infinito obrigatório.
- Recompensas idempotentes.
- Eventos narrativos consistentes.
- Objetivos preservados ou reiniciados conforme contrato.
- Nenhuma duplicação acidental de estado.
- Retomada correta após reload.

Não permitir revisitas globalmente apenas aumentando `traversalLimit`.

Diferenciar retorno permitido de ciclo inválido.

Caso o contrato atual não consiga representar uma revisita segura, realizar a menor extensão tipada necessária.

## 7. Saídas físicas e destinos

Integrar a nova topologia ao fluxo existente:

`CampaignGraph → CampaignRouter → PhysicalExitResolver → CampaignExitBinder`

Validar:

- Bifurcações com múltiplas saídas.
- Convergências.
- Saídas autorais explícitas.
- Saídas sintéticas.
- Destinos `targetStageId`.
- Retornos autorizados.
- Destino `campaign.complete`.
- Capacidade física do mapa.
- Alcançabilidade pelo jogador.
- Binding canônico por aresta.

Não redirecionar silenciosamente saídas incompatíveis.

Respeitar que `targetStageId` identifica uma definição, não um `nodeId`.

Quando houver múltiplas instâncias da mesma definição, exigir associação inequívoca à aresta e ao nó corretos.

Não criar outro resolver ou binder.

## 8. Persistência e restauração

Preservar as correções da 9.6D.

O snapshot deve guardar informações suficientes para restaurar:

- Política de topologia.
- Seed.
- Fases selecionadas.
- Revisões.
- Identidades das instâncias.
- Nós e arestas.
- Associações de saídas.
- Estado de navegação.
- Visitas e limites.
- Marcos concluídos.
- Progresso narrativo.

A restauração deve reutilizar o grafo persistido, sem gerar uma nova topologia.

Testar reload:

1. Antes da bifurcação.
2. Após escolher um ramo.
3. Durante um ramo alternativo.
4. Após convergência.
5. Após uma revisita.
6. Próximo à conclusão.

Preservar saves legados e snapshots `umbra.fixed-nine.v1`.

Não implementar migração automática nem alterar `compositionId` nesta etapa; a revisão de identidade do snapshot pertence à 9.6E.3.

## 9. Progressão narrativa e softlocks

Garantir que a existência de caminhos alternativos não permita ignorar marcos obrigatórios ou tornar a campanha impossível de concluir.

Validar:

- Alcançabilidade do encerramento.
- Marcos obrigatórios.
- Dependências narrativas.
- Caminhos alternativos.
- Condições de desbloqueio.
- Limites de travessia.
- Retornos.
- Estados persistidos.

Utilizar os validadores existentes.

Quando um grafo não atender às restrições, rejeitá-lo antes de iniciar.

Não corrigir automaticamente um grafo inválido modificando seu snapshot persistido.

## 10. Integração com menu

Preservar os quatro modos existentes.

A nova política deve poder ser solicitada por meio do `GameSessionService`, sem criar outro fluxo de inicialização.

Se for viável dentro do escopo, permitir selecionar entre campanha linear e ramificada no menu aleatório.

Caso contrário, disponibilizar a política por API de sessão e documentar a integração de interface pendente.

O catálogo real continua insuficiente para nove fases; não criar conteúdo fictício de produção nem habilitar campanhas inválidas.

Não redesenhar a interface.

## 11. World Lab

Ampliar a inspeção existente para representar:

- Política de topologia.
- Bifurcações.
- Convergências.
- Arestas de retorno.
- IDs dos nós e fases.
- Saídas físicas associadas.
- Limites de travessia.
- Estado de visita.
- Diagnósticos.

Reutilizar o visualizador de grafo existente.

Não transformar o World Lab em editor nesta etapa.

## 12. Fixture de integração

Criar ou ampliar uma fixture de campanha ramificada com nove fases válidas.

Ela deve demonstrar:

- Três atos.
- Três marcos.
- Uma bifurcação com duas alternativas.
- Uma convergência posterior.
- Uma revisita controlada, quando suportada pela política.
- Múltiplas saídas físicas.
- Conclusão alcançável.
- Persistência e restauração.

Reutilizar conteúdo técnico e mapas existentes.

Não adicionar as nove fases ao catálogo de produção.

Não criar novos inimigos, biomas ou assets.

## 13. Testes obrigatórios

Adicionar testes cobrindo:

- Política linear preservada.
- Nova política ramificada.
- Seed determinística.
- Variação entre seeds.
- Bifurcação.
- Convergência.
- Múltiplas saídas.
- Destinos explícitos.
- Destinos sintéticos.
- Revisita permitida.
- Revisita bloqueada.
- Limite de travessia.
- Identidade de fase e instância.
- Eventos narrativos após revisita.
- Recompensas idempotentes.
- Marcos obrigatórios.
- Grafo impossível.
- Softlock estrutural.
- Snapshot de grafo ramificado.
- Reload após bifurcação.
- Reload após convergência.
- Reload após revisita.
- Compatibilidade com saves antigos.
- Integração com `CampaignRouter`.
- Integração com World Lab.
- Campanha completa até `campaign.complete`.

Os testes devem comprovar comportamento, não apenas contratos.

## 14. Homologação

Quando o navegador estiver disponível, validar:

1. Início de campanha ramificada.
2. Duas saídas físicas.
3. Escolha de caminho.
4. Travessia para destino correto.
5. Convergência.
6. Retorno permitido.
7. Reload.
8. Retomada na posição correta.
9. Conclusão da campanha.

Se o navegador não estiver disponível, executar testes de integração headless e Phaser, deixando explícita a ausência de homologação visual.

Não declarar funcionalidade jogável visualmente sem evidência.

## 15. Estratégia para o DeepSeek

Organizar a implementação em quatro incrementos.

**A — Auditoria e contratos**

Mapear capacidades e limitações reais, preservar a política linear e definir a nova política.

**B — Composição e topologia**

Integrar o compositor ao gerador, validar bifurcações, convergências e saídas físicas.

**C — Revisitas e persistência**

Implementar travessias de retorno, isolamento de estado, reload e conclusão.

**D — Integração e validação**

Atualizar World Lab, testar campanha completa, executar validações e documentar.

Executar somente os testes direcionados entre incrementos.

Não executar repetidamente a suíte completa durante alterações intermediárias.

Se houver interrupção por limite de uso, manter arquivos e documentação consistentes e registrar exatamente o ponto pendente para continuação.

## 16. Restrições

- Não criar novo gerador de grafos.
- Não criar outro compositor.
- Não criar outro router.
- Não criar sistema paralelo de saves.
- Não modificar combate ou IA.
- Não reescrever `GameScene`.
- Não substituir a política linear.
- Não implementar editor visual.
- Não implementar CLI.
- Não adicionar conteúdos definitivos.
- Não remover `legacy.verse` sem substituição real.
- Não iniciar a 9.6E.3 ou 9.7.
- Não criar commit nem executar push.

## 17. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-6e2-topologias-flexiveis-revisitas.md`

Atualizar `SPEC/README.md`.

Criar o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`. Verificar se o próximo número é 42.

Documentar:

- Política de topologia.
- Contratos ampliados.
- Geração e composição.
- Bifurcações e convergências.
- Semântica de revisitas.
- Persistência.
- Compatibilidade legada.
- Diagnósticos.
- Testes e limitações.
- Pendências da 9.6E.3.

## 18. Validação final

Após a última alteração funcional, executar:

- Testes do compositor.
- Testes do gerador e validador de grafos.
- Testes do roteador.
- Testes das saídas físicas.
- Testes de persistência.
- Testes narrativos.
- Testes de integração Phaser.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes.

## 19. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Limitações comprovadas da topologia anterior.
3. Nova política implementada.
4. Integração com o gerador.
5. Funcionamento de bifurcações.
6. Funcionamento de convergências.
7. Funcionamento de revisitas.
8. Binding de saídas físicas.
9. Persistência e restauração.
10. Resultado da campanha ramificada de integração.
11. Preservação da campanha linear.
12. Integração com menu e World Lab.
13. Testes executados.
14. Homologação efetivamente realizada.
15. Limitações restantes.
16. Estado para commit.
17. Pendências da 9.6E.3.

## Critério de conclusão

Uma campanha composta deve conseguir apresentar caminhos alternativos e convergências, com escolha por saídas físicas e restauração determinística.

Quando a política permitir revisitas, o jogador deverá retornar a uma instância existente sem duplicar recompensas, perder progresso ou criar inconsistências de identidade.

A política `umbra.fixed-nine.v1` deve continuar funcionando exatamente como antes.

**O objetivo é flexibilizar a topologia do Umbra Trail sem comprometer as garantias de persistência, narrativa e navegação já conquistadas.**

Não criar commit nem executar push. Entregar implementação, testes, SPEC atualizada e relatório factual.
```

