# Registro de prompt: Etapa 9.6D — Estabilização, Persistência e Homologação Integrada

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6d-estabilizacao-persistencia-transicoes`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6d-estabilizacao-persistencia-transicoes.md`
- Commit: `pendente`
- Execução: `concluída; ciclo integrado de nove fases inicia, navega, persiste, recarrega, retoma e conclui; correções D1-D5 aplicadas; integração 6/6, sessão 17/17, fiação 7/7, recorte 21 suítes/208 testes e suíte completa 74 suítes/999 testes aprovados; typecheck, build, architecture, traceability e git diff --check aprovados; homologação visual no navegador não executada (sem navegador no ambiente)`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6d-estabilizacao-persistencia-transicoes.md`
- `SPEC/README.md`
- `prompts/40-etapa-9-6d-estabilizacao-persistencia-transicoes.md`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/GameSessionService.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/scenes/GameModesScene.ts`
- `src/scenes/GameScene.ts`
- `src/tests/campaignIntegrationCycle.test.ts`
- `src/tests/gameModesMenu.test.ts`
- `src/tests/gameSessionService.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6D — Estabilização, Persistência e Homologação Integrada

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.6C.

## Objetivo

Validar e estabilizar o ciclo completo de campanhas dinâmicas, desde sua criação até a conclusão, corrigindo problemas críticos de persistência, identidade de instâncias, transições físicas, revisitas e recuperação de erros.

Esta etapa deve comprovar que os sistemas implementados entre 8.1 e 9.6C funcionam corretamente quando integrados.

**Prioridade absoluta: corrigir e conectar sistemas existentes. Não criar novos frameworks, registries, roteadores ou mecanismos paralelos.**

As refatorações estruturais não bloqueantes continuam reservadas para a Etapa 9.6E.

## 1. Inspeção inicial

Antes de modificar código:

- Ler `AGENTS.md` e as instruções arquiteturais do repositório.
- Ler as SPECs 9.6A, 9.6B e 9.6C.
- Revisar as SPECs de persistência, saídas físicas, narrativa e campanha macro.
- Inspecionar `GameSessionService`, `GameModesScene`, `GameScene` e `MenuScene`.
- Inspecionar `CampaignCompositionService`, seu snapshot e `CampaignCompositionGraphAdapter`.
- Inspecionar `CampaignRouter`, `PhysicalExitResolver`, `CampaignExitBinder` e `CampaignMacroRouteBinder`.
- Identificar os mecanismos de save/load, revisão de capítulos e persistência narrativa.
- Inspecionar `StageSignalAdapter`, `StageDirector` e `GameStageCompositionRoot`.
- Verificar os testes existentes e os recursos disponíveis para homologação Phaser.
- Executar `git status --short` e preservar alterações preexistentes.

Não presumir caminhos ou APIs. Localizar os arquivos reais antes de alterá-los.

Não executar operações destrutivas no Git.

## 2. Auditoria do fluxo completo

Reconstruir e documentar o fluxo real:

`GameModesScene → GameSessionService → CampaignCompositionService → Snapshot → CampaignGraphGenerator → CampaignRouter → GameScene → Saída física → Próxima fase → Persistência → Retomada → Conclusão`

Identificar pontos em que:

- O estado da campanha pode ser perdido.
- O snapshot pode divergir do grafo.
- A cena pode recriar serviços indevidamente.
- Uma transição pode apontar ao destino errado.
- A mesma fase pode receber identidade incorreta.
- Eventos e recompensas podem ser executados novamente.
- Uma falha pode deixar o jogo em estado parcialmente atualizado.
- A conclusão da campanha pode não ser reconhecida.

Antes de implementar correções, registrar na SPEC os problemas comprovados e os riscos ainda não reproduzidos.

Não tratar hipóteses como bugs confirmados.

## 3. Identidades e isolamento das sessões

Auditar a utilização de:

- `stageId`: definição da fase.
- `stageInstanceId`: ocorrência da fase na composição.
- `nodeId`: nó do grafo.
- `runId`: identidade da campanha.
- Identificador de visita ou revisita.
- `chapterRevision`: revisão do capítulo.
- Identificadores de eventos e recompensas.

Garantir que essas identidades não sejam utilizadas de maneira intercambiável.

Testar situações em que:

1. A mesma fase participa de runs distintas.
2. O jogador revisita uma fase.
3. A run é restaurada.
4. A mesma seed é reutilizada.
5. O jogador alterna entre campanha clássica, composta e fase individual.

Inspecionar a utilização do hash FNV-1a de 32 bits para `runId`.

Avaliar riscos reais de colisão e associação indevida de saves. Se a identidade for insuficiente, aplicar a menor correção compatível, com estratégia explícita para registros existentes.

Não trocar arbitrariamente os IDs persistidos.

## 4. Integridade da persistência

Auditar os mecanismos existentes de salvamento e restauração.

Garantir:

- Snapshot salvo antes do início da campanha.
- Restauração sem executar novamente o sorteio.
- Grafo e atribuições restaurados de forma consistente.
- Preservação de revisões e destinos declarados.
- Separação entre saves clássicos e compostos.
- Isolamento da fase individual.
- Tratamento de dados malformados.
- Rejeição de revisões incompatíveis.
- Preservação dos dados anteriores quando a restauração falha.
- Ausência de sobrescrita silenciosa.

Verificar a atomicidade das operações dentro das possibilidades reais da infraestrutura de armazenamento.

Se o armazenamento não permitir transações, estabelecer uma estratégia de escrita/validação que minimize estados inconsistentes sem reestruturar todo o sistema.

Não modificar destrutivamente o envelope v1.

Não implementar migração automática de capítulos nesta etapa.

## 5. Transições físicas entre fases

Validar o caminho real:

`CampaignRouter → PhysicalExitResolver → CampaignExitBinder → GameScene → Próximo stage`

Verificar:

1. Correspondência entre aresta e saída física.
2. Correspondência entre `exitId` e `targetStageId`.
3. Resolução de saídas sintéticas.
4. Alcançabilidade da saída.
5. Capacidade máxima de saídas.
6. Compatibilidade com fases autorais.
7. Compatibilidade com fases procedurais.
8. Transição entre atos.
9. Revisita.
10. Destino `campaign.complete`.
11. Falhas de posicionamento e binding.
12. Preservação de estado durante a troca de cena.

Uma saída não pode redirecionar silenciosamente para um destino diferente.

Em caso de falha, manter a campanha em estado recuperável e retornar diagnóstico tipado.

Não criar segundo resolver, binder ou router.

## 6. Consistência das transições

Investigar especialmente a ordem das operações:

- Validação da saída.
- Verificação de condições narrativas.
- Registro da conclusão da fase.
- Aplicação de recompensas.
- Atualização da posição no grafo.
- Persistência.
- Inicialização da próxima fase.

Identificar se existe risco de avançar o grafo antes de garantir que a próxima fase é carregável.

Evitar:

- Duas transições pelo mesmo input.
- Avanço duplicado por eventos simultâneos.
- Recompensas reaplicadas.
- Perda de flags.
- Snapshot incompatível após reload.
- Jogador preso entre duas fases.

Reutilizar os mecanismos de idempotência existentes.

Não introduzir uma máquina de estados paralela caso os contratos atuais já permitam garantir essas operações.

## 7. Revisitas e eventos narrativos

Validar a integração de:

- `StageSignalAdapter`.
- `NarrativeEventProcessor`.
- `StageDirector`.
- Sistema de missões.
- Recompensas.
- Checkpoints.
- Condições de desbloqueio.

Testar:

- `enemy.defeated`.
- `item.collected`.
- `encounter.completed`.
- `stage.exit.requested`.
- `reward.grant`.
- `stage.complete`.

Uma revisita deve respeitar a política declarada pela fase.

Recompensas e eventos idempotentes não podem ser reaplicados indevidamente após reload.

Não alterar o design narrativo nem adicionar missões nesta etapa.

## 8. Detecção de softlocks

Implementar testes de integração capazes de identificar campanhas que não podem ser concluídas.

Verificar:

- Caminho do início até o encerramento.
- Saídas alcançáveis.
- Dependências narrativas satisfazíveis.
- Marcos obrigatórios atingíveis.
- Ausência de destinos inexistentes.
- Condições de progressão coerentes.
- Compatibilidade entre posições e fases selecionadas.
- Possibilidade de retomada após falhas recuperáveis.

Distinguir:

**Falhas estruturais:** detectáveis antes de iniciar a campanha.

**Falhas de execução:** detectadas durante a navegação e gameplay.

Não tentar resolver problemas alterando silenciosamente a seed, a seleção ou o grafo persistido.

Quando não for possível provar automaticamente uma propriedade de gameplay, documentar a limitação e adicionar uma verificação apropriada, sem declarar ausência absoluta de softlocks.

## 9. Campanha de integração com nove fases

O catálogo real ainda possui menos de nove candidatas compatíveis.

Criar ou reutilizar uma fixture de integração válida, com:

- Nove fases jogáveis.
- Três atos.
- Três marcos narrativos.
- Entradas e saídas compatíveis.
- Destinos válidos.
- Capabilities suportadas.
- Conteúdo mínimo para navegação e conclusão.
- Identidades e revisões estáveis.

A fixture deverá utilizar os serviços reais do jogo.

**Não cadastrar essas fases como conteúdo normal de produção.**

Caso seja necessário um ponto de entrada de desenvolvimento, mantê-lo isolado e explicitamente habilitado apenas para testes/desenvolvimento.

Não adicionar condicionais de fixture à lógica central da `GameScene`.

A validação deve comprovar:

1. Composição determinística 35→9 em nível headless.
2. Inicialização efetiva da run de nove fases.
3. Navegação por todas as fases na topologia suportada.
4. Persistência em pontos intermediários.
5. Restauração da campanha.
6. Conclusão da campanha.
7. Preservação de recompensas e estados narrativos.
8. Ausência de transições duplicadas.

A fixture de 35 candidatas não precisa conter 35 mapas completos; reutilizar definições de teste válidas, mantendo isolamento entre instâncias.

## 10. Testes de falha e recuperação

Adicionar cenários para:

- Save corrompido.
- Snapshot ausente.
- Snapshot com revisão incompatível.
- Fase removida do catálogo.
- Destino inválido.
- Falha de binding físico.
- Erro durante carregamento da próxima fase.
- Falha de persistência.
- Duplo acionamento de saída.
- Reload durante retomada.
- Revisita com recompensa já concedida.
- Troca de modo de jogo.
- Seed reutilizada em runs distintas.

Toda falha deve ter comportamento definido, sem perda silenciosa de dados.

Priorizar correções efetivamente necessárias para tornar esses fluxos seguros.

## 11. Homologação Phaser e navegador

Quando o ambiente disponibilizar um navegador, executar:

**Campanha clássica**

- Iniciar pelo menu.
- Entrar na fase.
- Navegar e utilizar saída.
- Retornar ou retomar.

**Fase individual**

- Selecionar fase.
- Entrar no jogo.
- Interagir.
- Encerrar.
- Retornar ao menu.
- Confirmar isolamento de saves.

**Campanha dinâmica de integração**

- Iniciar run válida.
- Verificar primeira fase.
- Atravessar saídas.
- Salvar.
- Recarregar.
- Retomar da posição correta.
- Atravessar marcos.
- Concluir a campanha.

Validar também a apresentação visual e sonora após transições.

Registrar evidências de execução, erros de console e limitações encontradas.

Se o navegador estiver indisponível, realizar a maior cobertura possível com testes de integração Phaser automatizados e declarar explicitamente que a homologação visual manual continua pendente.

**Testes headless não devem ser apresentados como prova de execução visual real.**

## 12. Correções permitidas

Podem ser alterados os componentes envolvidos em:

- Inicialização de sessões.
- Persistência.
- Restauração.
- Identidades de runs.
- Transições.
- Roteamento.
- Binding de saídas.
- Eventos narrativos.
- Encerramento de campanha.
- Tratamento de erros.

Somente quando houver necessidade demonstrada.

Preferir correções pequenas, localizadas e cobertas por regressão.

Se uma alteração arquitetural extensa não for necessária para corrigir uma falha crítica, registrá-la como pendência para a 9.6E.

## 13. Fora do escopo

Não implementar:

- Nova topologia de campanha.
- Novos sistemas de procedural.
- Novos arquétipos de inimigos.
- Novos biomas definitivos.
- Editor de fases.
- SDK ou CLI.
- Carregamento remoto de capítulos.
- Refatoração geral de `GameScene`.
- Remoção ampla de `legacy.verse`.
- Reestruturação integral das capabilities.
- Novo sistema de saves.
- Novo compositor ou router.

Não ampliar o escopo para a 9.6E ou 9.7.

## 14. Estratégia de execução para o DeepSeek

Dividir o trabalho em quatro incrementos.

### Incremento A — Auditoria e testes de reprodução

- Mapear o fluxo atual.
- Identificar falhas comprovadas.
- Criar testes de reprodução para problemas críticos.
- Registrar diagnósticos.

### Incremento B — Persistência e identidades

- Corrigir integridade de saves.
- Corrigir isolamento de sessões.
- Garantir restauração.
- Validar idempotência.

### Incremento C — Transições e campanha completa

- Validar roteamento físico.
- Corrigir transições.
- Testar revisitas.
- Executar a campanha de integração de nove fases.
- Testar conclusão e recuperação de erros.

### Incremento D — Homologação e fechamento

- Executar testes completos.
- Realizar homologação quando possível.
- Atualizar SPEC.
- Produzir relatório final.

Após cada incremento, executar somente os testes direcionados relevantes.

Executar a suíte completa depois da última alteração funcional.

Se encontrar um problema amplo fora do escopo, documentar e seguir com os bloqueadores prioritários.

**Não desperdiçar contexto reimplementando sistemas que já passaram nas etapas anteriores.**

## 15. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-6d-estabilizacao-persistencia-transicoes.md`

Atualizar `SPEC/README.md`.

Registrar o próximo prompt sequencial após o registro 39, respeitando `umbra-prompt-record/v1` e verificando a numeração existente.

Documentar:

- Fluxo real integrado.
- Problemas encontrados.
- Correções implementadas.
- Invariantes de persistência.
- Semântica das identidades.
- Ordem das transições.
- Política de falhas.
- Testes de softlock.
- Cenários homologados.
- Limitações ainda existentes.
- Pendências estruturais para a 9.6E.

Preservar a documentação anterior.

## 16. Validações finais

Executar:

- Testes de sessão.
- Testes de composição.
- Testes de catálogo.
- Testes de roteamento.
- Testes de persistência.
- Testes de narrativa.
- Testes de integração Phaser.
- Teste da campanha completa de nove fases.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Corrigir as regressões introduzidas sem remover ou enfraquecer testes existentes.

## 17. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Problemas críticos comprovados.
3. Correções de persistência.
4. Correções de identidade e isolamento.
5. Correções nas transições.
6. Resultado dos testes de revisita e narrativa.
7. Resultado da campanha completa de nove fases.
8. Situação dos softlocks.
9. Compatibilidade com saves legados.
10. Homologação Phaser/navegador efetivamente executada.
11. Resultado da suíte completa, typecheck, build e gates.
12. Limitações restantes.
13. Estado para commit.
14. Pendências destinadas à 9.6E.

## 18. Critério de conclusão

Uma campanha dinâmica válida deve ser capaz de:

**Iniciar → Jogar → Concluir fase → Atravessar saída → Salvar → Recarregar → Retomar → Revisitar → Avançar pelos atos → Concluir campanha.**

Ao longo desse processo:

- Nenhuma fase pode mudar de identidade indevidamente.
- Nenhuma recompensa idempotente pode ser duplicada.
- Nenhuma saída pode apontar silenciosamente para outro destino.
- Nenhum snapshot pode ser recomposto durante a retomada.
- Nenhum save válido pode ser sobrescrito por falha de restauração.
- Nenhuma inconsistência conhecida pode deixar a run irrecuperável sem diagnóstico.

A campanha clássica e o modo individual devem continuar funcionando.

**A 9.6D não é uma etapa de expansão. É uma etapa de estabilização e comprovação funcional.**

Não criar commit nem executar push. Finalizar com relatório factual e evidências dos testes realizados.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: número sequencial 40 confirmado após o registro 39.
- Homologação visual: não executada; o ambiente não oferece navegador.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
