# Registro de prompt: Etapa 9.6E.3 — Versionamento de identidades e snapshots

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6e3-versionamento-identidades-snapshots`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6e3-versionamento-identidades-snapshots.md`
- Commit: `pendente`
- Execução: `concluída; testes dirigidos de composição, sessão e menu aprovados (57 testes); suíte completa 74 suítes/1021 testes aprovada; typecheck e build aprovados; check:gates e git diff --check executados; homologação visual não executada por ausência de navegador`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6e3-versionamento-identidades-snapshots.md`
- `SPEC/README.md`
- `prompts/43-etapa-9-6e3-versionamento-identidades-snapshots.md`
- `src/application/stages/GameSessionService.ts`
- `src/scenes/GameModesScene.ts`
- `src/stages/contracts/CampaignComposition.ts`
- `src/stages/index.ts`
- `src/stages/runtime/CampaignCompositionService.ts`
- `src/tests/campaignComposition.test.ts`
- `src/tests/gameModesMenu.test.ts`
- `src/tests/gameSessionService.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6E.3 — Consolidação de Contratos, Identidades e Persistência Versionada

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.6E.2.

## Objetivo

Estabilizar os contratos públicos de composição, identidades de fases e persistência de campanhas antes de iniciar a Etapa 9.7, dedicada à autoria de capítulos independentes.

A implementação deve concentrar-se em três entregas:

1. Versionamento e integridade das identidades e snapshots.
2. Compatibilidade e migração explícita de dados persistidos.
3. Exposição da política ramificada no menu existente.

**Não reconstruir sistemas. Priorizar alterações pequenas, reaproveitamento e compatibilidade retroativa.**

## 1. Inspeção inicial

Leia:

- `AGENTS.md`.
- SPECs 9.6B, 9.6C, 9.6D, 9.6E.1 e 9.6E.2.
- Contratos de `CampaignComposition`.
- `CampaignCompositionService` e `CampaignCompositionGraphAdapter`.
- `GameSessionService`.
- `GameModesScene`.
- `CampaignRouter`.
- Contratos de saves e snapshots.
- `StageCatalogService`.
- Testes atuais de composição, sessão e persistência.

Execute `git status --short`.

Preserve alterações não commitadas.

Não faça uma auditoria completa do projeto. Inspecione somente dependências diretamente relacionadas à etapa.

## 2. Auditoria das identidades

Mapeie as identidades existentes:

- `stageId`: definição de fase.
- `stageInstanceId`: ocorrência da definição na campanha.
- `nodeId`: nó do grafo.
- `runId`: campanha.
- `compositionId`: identidade da composição.
- Identificador ou contador de visita.
- `transitionId`: operação de transição.

Verifique como cada uma é criada, persistida, comparada e restaurada.

A 9.6E.2 introduziu uma campanha com nove definições e dez instâncias.

Garanta que:

- Duas instâncias da mesma definição possuam identidades distintas.
- Revisitar um nó preserve a identidade da instância existente.
- Uma visita adicional não seja confundida com uma nova instância.
- As identidades permaneçam estáveis após reload.
- Uma composição não compartilhe indevidamente progresso com outra.
- Os identificadores persistidos nunca sejam recalculados silenciosamente durante a restauração.

Documente apenas inconsistências comprovadas.

## 3. Versionamento de compositionId

O `runId` já foi ampliado na 9.6D, mantendo compatibilidade com IDs legados.

O `compositionId` ainda utiliza FNV-1a de 32 bits.

Avalie e implemente uma identidade versionada para novas composições, com maior resistência a colisões.

Requisitos:

- Preservar a leitura dos identificadores anteriores.
- Não reinterpretar silenciosamente um ID antigo como novo.
- Manter determinismo.
- Evitar depender da ordem de registro do catálogo.
- Distinguir a identidade da composição da identidade da run.
- Validar a associação entre ID, política, seed, atribuições e topologia.
- Preservar os identificadores presentes em snapshots históricos.

Se for necessária uma nova versão do formato, utilizar um discriminador explícito.

Não trocar a função de hash isoladamente sem considerar seu impacto na persistência.

Não introduzir dependências criptográficas ou bibliotecas externas sem necessidade demonstrada.

## 4. Versionamento dos snapshots

Revisar os contratos atualmente persistidos pelas políticas:

- `umbra.fixed-nine.v1`
- `umbra.branching-nine.v1`

Definir o menor mecanismo de versionamento necessário para garantir evolução segura.

O snapshot deve preservar:

- Política de composição.
- Versão do contrato.
- Seed.
- Identificador da composição.
- Definições selecionadas.
- Revisões.
- Identidades das instâncias.
- Associação entre slots, nós e fases.
- Grafo e arestas.
- Destinos e saídas declaradas.
- Informações necessárias à restauração.

Não duplicar informações já persistidas de forma autoritativa em outro contrato.

Preservar o envelope de save v1 sempre que possível.

**Não regenerar a composição durante a restauração.**

## 5. Compatibilidade e migração

Implementar uma estratégia explícita para snapshots antigos.

Diferenciar:

1. Snapshot atual válido.
2. Snapshot legado válido e diretamente compatível.
3. Snapshot legado que admite migração segura.
4. Snapshot incompatível ou corrompido.

Quando uma migração puder preservar integralmente as identidades e a semântica da campanha, implementá-la de forma determinística e testável.

Quando não for possível garantir essa preservação, retornar diagnóstico tipado.

Requisitos obrigatórios:

- Não sobrescrever bytes originais durante uma falha de leitura ou migração.
- Não alterar IDs históricos sem mapeamento inequívoco.
- Não reconstruir grafos ou trocar fases para corrigir incompatibilidades.
- Não perder estados narrativos.
- Não duplicar recompensas.
- Não modificar a posição atual do jogador.
- Não alterar limites de travessia.
- Não misturar saves clássicos e compostos.

A migração deve ocorrer somente quando necessária e ser aplicada de forma controlada.

Não implementar um sistema genérico de migrações para todo o projeto.

## 6. Garantias da política ramificada

Preservar as funcionalidades implementadas na 9.6E.2:

- Nove definições selecionadas.
- Dez instâncias quando a política exigir.
- Bifurcação física.
- Convergência.
- Retorno controlado.
- Três atos e três marcos.
- Limites de travessia.
- Estado narrativo isolado.
- Recompensas idempotentes.
- Restauração do grafo persistido.

Testar a consistência das identidades antes e depois de atravessar caminhos alternativos e revisitar instâncias.

Não modificar `CampaignGraphGenerator`, `PhysicalExitResolver` ou `CampaignExitBinder` sem falha comprovada.

## 7. Política ramificada no menu

A 9.6E.2 já disponibilizou no `GameSessionService`:

- `previewBranchingCampaign()`
- `startBranchingCampaign()`

Conectar essas operações ao `GameModesScene`.

Reutilizar a interface de campanha aleatória.

O jogador deve poder selecionar a política de campanha, conforme as opções existentes:

- Linear.
- Ramificada.

Preservar o modo clássico, o modo individual e a campanha personalizada.

A interface deve:

1. Indicar qual política está selecionada.
2. Mostrar a quantidade real de candidatas.
3. Exibir disponibilidade e diagnósticos.
4. Permitir informar ou gerar seed.
5. Iniciar somente composições válidas.
6. Restaurar a política persistida da run.
7. Evitar misturar uma run linear salva com uma ramificada.
8. Impedir retomar campanhas concluídas.

O catálogo real continua insuficiente para nove fases elegíveis.

Portanto, não habilitar artificialmente campanhas ramificadas nem adicionar conteúdo fictício ao catálogo de produção.

**O modo deve estar integrado e visível, mas corretamente indisponível quando não houver conteúdo suficiente.**

Não criar outra cena ou reestruturar o menu.

## 8. Testes obrigatórios

Adicionar ou ampliar testes para:

### Identidades
- Duas instâncias da mesma definição.
- Revisita à mesma instância.
- Identidade estável após reload.
- Mesmo seed em runs distintas.
- `compositionId` novo e legado.
- Incompatibilidade de identidade.

### Snapshots
- Serialização e restauração.
- Snapshot linear legado.
- Snapshot ramificado.
- Migração válida, quando suportada.
- Migração impossível.
- Snapshot corrompido.
- Revisão incompatível.
- Persistência sem recomposição.
- Preservação dos bytes anteriores.

### Campanha
- Bifurcação.
- Convergência.
- Retorno controlado.
- Travessias e recompensas idempotentes.
- Conclusão.
- Compatibilidade com a campanha clássica.

### Menu
- Alternância entre política linear e ramificada.
- Preview pela API existente.
- Catálogo insuficiente.
- Diagnóstico visível.
- Início válido com fixture.
- Retomada com política correta.
- Save incompatível sem sobrescrita.

Reutilizar as fixtures já criadas nas Etapas 9.6B, 9.6D e 9.6E.2.

Não criar novamente uma fixture de 35 fases se a existente puder ser reutilizada.

## 9. Homologação

Quando houver navegador disponível:

- Abrir o menu.
- Selecionar campanha linear.
- Selecionar campanha ramificada.
- Confirmar diagnósticos de indisponibilidade.
- Verificar o modo clássico.
- Verificar o modo individual.
- Testar retomada de sessão existente.

Se existir uma fixture de desenvolvimento segura, utilizá-la para validar visualmente o início de uma campanha ramificada.

Não incluir a fixture no catálogo de produção.

Se o navegador estiver indisponível, registrar a limitação e executar os testes de integração possíveis.

Não confundir teste headless com homologação visual.

## 10. Preparação para autoria independente

Consolidar a documentação pública necessária à Etapa 9.7.

Explicar como um capítulo deve declarar:

- Identidades estáveis.
- Revisões.
- Capabilities.
- Elegibilidade.
- Dependências.
- Encontros.
- Apresentação visual.
- Entradas e saídas.
- Política de revisita.

Não criar SDK, CLI ou template nesta etapa.

Evitar novos contratos se os existentes já forem suficientes.

O resultado deve fornecer uma base estável para que uma ferramenta externa consiga criar e validar capítulos sem modificar o motor.

## 11. Estratégia de execução — DeepSeek

Dividir a implementação em três incrementos.

**Incremento A — Contratos e persistência**

- Auditar identidades.
- Versionar `compositionId`, se necessário.
- Estabilizar snapshots.
- Garantir compatibilidade.
- Executar testes direcionados.

**Incremento B — Menu e integração**

- Expor a política ramificada.
- Reutilizar `GameSessionService`.
- Preservar os modos existentes.
- Testar saves e alternância de políticas.

**Incremento C — Validação e fechamento**

- Executar testes integrados.
- Validar regressões.
- Atualizar SPEC e registro.
- Executar suíte completa e gates.
- Elaborar relatório final.

Não executar a suíte completa entre incrementos.

Evitar refatorações paralelas.

Se houver interrupção por limite de uso, preservar o worktree e registrar precisamente o último passo concluído, o último teste executado e o que ainda falta.

## 12. Restrições

Não implementar:

- Topologias arbitrárias.
- Novos algoritmos procedurais.
- Novo compositor.
- Novo router.
- Novo sistema de saves.
- Editor visual.
- CLI ou SDK.
- Carregamento remoto.
- Novos capítulos.
- Novos inimigos.
- Novos biomas.
- Refatoração ampla da `GameScene`.
- Mudanças nas mecânicas de combate.

Não iniciar a Etapa 9.7.

Não modificar a topologia das políticas existentes.

Não criar commit nem executar push.

## 13. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-6e3-versionamento-identidades-snapshots.md`

Atualizar `SPEC/README.md`.

Criar o próximo registro de prompt, verificando se a numeração 43 está disponível:

`prompts/43-etapa-9-6e3-versionamento-identidades-snapshots.md`

Seguir `umbra-prompt-record/v1`.

Documentar:

- Contratos públicos.
- Versionamento de identidades.
- Regras de compatibilidade.
- Migrações implementadas.
- Diagnósticos.
- Integração da política ramificada.
- Garantias de persistência.
- Limitações.
- Preparação para a Etapa 9.7.

## 14. Validações finais

Após a última alteração funcional, executar:

- Testes de composição.
- Testes de sessão.
- Testes de persistência.
- Testes do roteador.
- Testes de menu.
- Testes de campanha ramificada.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes.

## 15. Relatório final

Entregar:

1. Arquivos criados e modificados.
2. Inconsistências de identidade identificadas.
3. Estratégia de versionamento implementada.
4. Tratamento de `compositionId`.
5. Formato e compatibilidade dos snapshots.
6. Migrações implementadas ou rejeitadas.
7. Integração da política ramificada no menu.
8. Estado dos quatro modos de jogo.
9. Testes de persistência e restauração.
10. Compatibilidade com campanhas antigas.
11. Homologação efetivamente executada.
12. Resultados de testes, build e gates.
13. Limitações restantes.
14. Estado para commit.
15. Prontidão para iniciar a 9.7.

## Critério de conclusão

O Umbra Trail deve conseguir identificar, versionar, persistir e restaurar composições lineares e ramificadas sem ambiguidades entre definições, instâncias, nós e visitas.

Snapshots anteriores devem permanecer utilizáveis quando compatíveis ou ser rejeitados com diagnóstico seguro.

O jogador deve conseguir escolher a política linear ou ramificada no menu, respeitando a disponibilidade real do catálogo.

**Esta etapa deve consolidar a arquitetura existente para receber capítulos criados por terceiros, sem introduzir novos sistemas centrais.**

Não criar commit nem executar push. Entregar implementação, testes, documentação e relatório factual.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
