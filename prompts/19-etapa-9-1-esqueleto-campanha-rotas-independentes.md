# Etapa 9.1: esqueleto de campanha por rotas independentes

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-9-1-esqueleto-campanha-rotas-independentes`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-rotas-independentes.md`
- Commit: `pendente`
- Execução: `jest campaignMacroProgression 18/18, suíte completa 779/779 em 47 suítes, tsc --noEmit, check:gates (1701 arquivos, 3700 dependências; 15 registros v1 e 8 históricos), build (705 módulos) e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `SPEC/README.md`
- `src/stages/contracts/CampaignMacro.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/CampaignRunSaveService.ts`
- `src/application/stages/CampaignMacroState.ts`
- `src/application/stages/CampaignMacroProgression.ts`
- `src/application/stages/UmbraCampaignSkeleton.ts`
- `src/application/stages/index.ts`
- `src/tests/campaignMacroProgression.test.ts`
- `prompts/19-etapa-9-1-esqueleto-campanha-rotas-independentes.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 9.1 — Esqueleto de Campanha por Rotas Independentes** do Umbra Trail.

### Objetivo

Transformar a estrutura da campanha em um Action RPG de exploração não linear, com inspiração na liberdade de exploração de Hollow Knight, mas preservando a jogabilidade, o combate, a geração procedural e os sistemas já desenvolvidos.


A campanha deverá possuir:

**Camada 0 — Hub inicial**
- Floresta das Raízes.
- Ponto inicial da campanha.
- Acesso às três rotas principais.
- Local de retorno entre as histórias.

**Camada 1 — Três histórias independentes**

1. Rota das Águas: Igapó → Mangues → Porto.
2. Rota da Floresta: Fungos → Copas → Flores.
3. Rota da Terra: Areias → Ruínas → Cicatriz.

Cada rota deverá possuir:
- Identidade estável.
- Fases ordenadas internamente.
- Progresso independente.
- Objetivos e marco de conclusão próprios.
- Possibilidade de retornar ao hub.
- Estado persistente de conclusão.
- Contratos para futuros NPCs, missões e revelações.

O jogador poderá concluir as três rotas em qualquer ordem.

**Camada 2 — Regiões Corrompidas**
- Minas.
- Cinzas.
- Temporal.
- Complexo Industrial.

Essa camada somente será desbloqueada após a conclusão das três rotas principais. Inicialmente, definir uma progressão mínima da história corrompida, mantendo as regiões como conteúdo planejado e configurável.

**Camada 3 — Final**
- Palácio do Credor.
- Acesso liberado somente após o marco obrigatório da camada corrompida.
- Preparado para receber chefe final e desfecho narrativo.

### Contexto mínimo

Leia:
- `AGENTS.md`.
- `SPEC/2026-10-28-campanha-procedural-ramificada.md`.
- SPEC narrativa da Etapa 9, se já existir.
- APIs públicas de `src/stages/`, `src/narrative/` e `src/application/stages/`.
- Contratos de `CampaignRouter`, `CampaignGraph`, `CampaignRunState` e persistência.

Consulte implementações internas apenas quando necessário. Não leia todo o repositório nem arquivos gerados.

### Implementação

**1. Estrutura macro da campanha**

Criar contratos para representar:
- Hub inicial.
- Rotas independentes.
- Regiões e fases de cada rota.
- Marcos narrativos.
- Condições de desbloqueio.
- Camadas de dificuldade.
- Convergência para a história final.

Separar a estrutura macro da campanha dos grafos procedurais utilizados dentro de cada rota.

Não forçar essa estrutura ao validador atual de nove posições e DAG: retornos ao hub podem formar ciclos legítimos no nível macro. Preservar o comportamento e os contratos legados.

**2. Progressão independente**

Implementar uma camada de progressão que reconheça:
- Rota ainda não iniciada.
- Rota em andamento.
- Rota concluída.
- Camada corrompida bloqueada/desbloqueada.
- Marco corrompido concluído.
- Final bloqueado/desbloqueado.

Não utilizar apenas índice de fase ou quantidade de inimigos mortos como condição de conclusão de uma história.

Cada rota deve possuir um marco narrativo próprio.

**3. Navegação**

Reutilizar `CampaignRouter`, `StageLoader`, `PhysicalExitResolver` e os contratos existentes.

Permitir:
- Hub → qualquer rota disponível.
- Progressão entre fases de uma rota.
- Retorno ao hub em pontos permitidos.
- Continuação de uma rota iniciada.
- Desbloqueio da camada corrompida após as três conclusões.
- Acesso ao final após conclusão do marco corrompido.

Usar saídas físicas como mecanismo de navegação previsto. Não criar um sistema paralelo de transição nem modificar a movimentação.

**4. Variação procedural**

Preservar a possibilidade de uma mesma rota apresentar diferentes layouts, encontros e eventos conforme a seed.

A ordem macro das histórias pode variar conforme a escolha do jogador, mas os marcos obrigatórios devem permanecer coerentes.

**5. Persistência**

Reutilizar os saves versionados existentes.

Salvar:
- Rota atual.
- Progresso independente de cada rota.
- Marcos concluídos.
- Desbloqueios.
- Node atual e histórico.
- Identidades e seeds necessários à retomada.

Não duplicar estado narrativo que já possui uma fonte de verdade.

Preservar saves anteriores e garantir idempotência de conclusões e recompensas.

**6. Esqueleto inicial**

Criar definições declarativas para hub, três rotas, camada corrompida e final.

Não criar ainda os mapas ou assets definitivos. Utilizar referências existentes ou placeholders explícitos para representar conteúdo ainda não implementado.

Não registrar placeholders inexistentes como mapas jogáveis nem liberar saídas para destinos sem carregamento válido.

Preparar esse esqueleto para inspeção no Umbra World Lab, reutilizando os contratos públicos.

**7. Testes**

Criar testes para:
- Conclusão das três rotas em ordens diferentes.
- Bloqueio da camada 2 enquanto faltar uma rota.
- Desbloqueio após concluir as três.
- Bloqueio do final antes do marco corrompido.
- Retorno ao hub e continuação de uma rota.
- Persistência e restauração de progresso.
- Repetição de eventos sem recompensas duplicadas.
- Identidades estáveis, determinismo e ausência de softlocks estruturais.
- Compatibilidade com o piloto e as flags atuais.

### Restrições

- Não redesenhar personagens.
- Não produzir sprites, cenários ou biomas definitivos.
- Não criar diálogos completos ou missões secundárias.
- Não alterar combate, IA ou movimentação.
- Não substituir o CampaignGraphGenerator existente.
- Não reescrever GameScene.
- Não criar novos motores de navegação ou persistência.
- Não modificar o fluxo legado por padrão.
- Não adicionar dependências sem necessidade.
- Não criar commits automaticamente.

### Escopo e entrega incremental

Prioridade absoluta: implementar e testar o esqueleto macro headless, com contratos públicos e persistência compatível.

Se a integração jogável com Phaser exigir mudanças relevantes, documentar essa dependência e deixá-la para a Etapa 9.2. Não ampliar o escopo desnecessariamente.

Atualizar a SPEC, o índice de SPECs quando necessário e registrar este prompt efetivamente recebido em `prompts/` conforme `umbra-prompt-record/v1`.

### Validação econômica

- Executar testes afetados durante a implementação.
- Executar architecture/traceability gates e typecheck.
- Executar suíte completa e build uma vez ao final.
- Executar `git diff --check`.
- Não repetir verificações sem necessidade.

### Resultado esperado

Entregar um esqueleto modular, persistível e testável no qual:

1. O jogador inicia na Floresta das Raízes.
2. Pode escolher qualquer uma das três rotas.
3. Cada rota evolui independentemente.
4. A conclusão de uma rota não conclui as demais.
5. As três rotas concluídas desbloqueiam a camada corrompida.
6. A história corrompida concluída desbloqueia o Palácio do Credor.
7. O jogo pode retomar a campanha sem perder a progressão.

Relatar arquivos modificados, contratos, testes, limitações e o que ainda falta para torná-lo jogável visualmente.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `Não existia SPEC narrativa da Etapa 9; foi criada uma SPEC datada própria para separar a topologia macro dos grafos procedurais internos.`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
