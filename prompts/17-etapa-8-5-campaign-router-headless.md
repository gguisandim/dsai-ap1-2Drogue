# Etapa 8.5: Campaign Router Headless

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-5-campaign-router-headless`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest campaignRouter (16/16), suíte completa 729/729 em 43 suítes, tsc --noEmit, check:gates (1692 arquivos, 3668 dependências; 9 registros v1 e 8 históricos), build (701 módulos) e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/CampaignRunSaveService.ts`
- `src/application/stages/CampaignRouter.ts`
- `src/application/stages/index.ts`
- `src/tests/campaignRouter.test.ts`
- `prompts/17-etapa-8-5-campaign-router-headless.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 8.5 — Campaign Router Headless** do Umbra Trail.

### Contexto mínimo

Leia:

- `AGENTS.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md` (somente seções relevantes)
- APIs públicas de `src/stages/`, `src/narrative/` e `src/application/stages/`
- Contratos da persistência de run (Etapa 8.4)
- Contratos do `CampaignExitBinder` e `PhysicalExitResolver`

Consulte implementações internas apenas quando uma dependência concreta exigir. Não explore arquivos gerados nem o repositório inteiro.

### Objetivo

Implementar um router determinístico na application layer, responsável por coordenar a navegação entre nós de uma campanha procedural por meio das saídas físicas, reutilizando os sistemas headless existentes.

### Implementação

1. Criar `CampaignRouter` e contratos públicos de navegação, com resultados e falhas tipados.
2. Receber uma run existente e identificar seu nó atual, saídas físicas disponíveis e respectivos destinos.
3. Validar a saída selecionada por `physicalExitId`, nunca por índice, posição na lista ou coordenada.
4. Reutilizar `CampaignGraph`, `CampaignRunState`, `CampaignRunSaveService`, `StageLoader`, `PhysicalExitResolver` e `CampaignExitBinder`, sem duplicar suas regras.
5. Preparar o próximo estágio antes de confirmar a transição.
6. Garantir que falhas de carregamento, validação ou binding preservem o nó atual, percurso, estado narrativo e save anterior.
7. Confirmar transições atomicamente em memória e persistir somente depois de validar o destino.
8. Definir uma estratégia explícita de recuperação quando a persistência falhar, sem declarar atomicidade inexistente entre chaves distintas.
9. Preservar `runId`, `runSeed`, `stageInstanceId` e identidades estáveis durante toda a navegação.
10. Impedir transições concorrentes, repetidas ou para saídas inexistentes/bloqueadas.
11. Preservar a associação entre node, stage, exit e destino em exportações/snapshots consumíveis pelo World Lab.
12. Criar testes headless para navegação, bifurcações, rejoin, falhas, rollback, repetição, determinismo, restauração e compatibilidade de saves.
13. Expor uma API pública mínima e atualizar a SPEC.

### Integração com o World Lab

- Reutilizar os mesmos resultados públicos de navegação utilizados pelo runtime.
- Permitir que o World Lab inspecione nó atual, destinos e saídas resolvidas.
- Não duplicar o algoritmo de roteamento dentro do visualizador.
- Não introduzir dependência do World Lab no router.
- Se a integração exigir mudanças substanciais na interface SVG/DOM, documentar e adiar.

### Restrições

- Não modificar `GameScene`, Phaser, combate, simulação, IA ou progressão.
- Não criar portais visuais, animações ou colisões.
- Não implementar campanha ou biomas amazônicos nesta etapa.
- Não modificar o World Lab além de ajustes mínimos de contratos/adapters, se indispensáveis.
- Não substituir o fluxo legado do jogo.
- Não introduzir dependências novas sem necessidade demonstrada.
- Não alterar testes existentes para esconder regressões.
- Não criar commits automaticamente.
- Registrar o prompt efetivo em `prompts/` conforme `umbra-prompt-record/v1`.

### Validação econômica

1. Durante a implementação, executar somente testes novos ou afetados.
2. Executar architecture/traceability gates e typecheck após concluir.
3. Executar a suíte completa e o build uma única vez ao final.
4. Repetir verificações apenas quando alguma correção afetar seu resultado.
5. Executar `git diff --check`.

### Entrega

Relate objetivamente:

- Arquivos criados e modificados.
- API pública do router.
- Fluxo de preparação, confirmação e rollback.
- Garantias reais de persistência e idempotência.
- Integração possível com o World Lab.
- Testes adicionados e resultados.
- Limitações e riscos remanescentes.

**Critério principal de aceitação:** dada uma campanha persistida com bifurcações, selecionar uma saída física deve preparar e confirmar a navegação para o nó correto, mantendo identidades, histórico e saves consistentes. Uma falha deve preservar ou recuperar o estado anterior de forma verificável.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `CampaignRunState e CampaignRunSaveService citados como existentes não estavam implementados; o pré-requisito mínimo foi criado e documentado na SPEC.`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
