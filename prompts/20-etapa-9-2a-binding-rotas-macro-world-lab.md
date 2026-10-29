# Etapa 9.2A: binding das rotas macro e visualização no World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-9-2a-binding-rotas-macro-world-lab`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-rotas-independentes.md`
- Commit: `pendente`
- Execução: `jest direcionado 7/7, suíte completa 786/786 em 48 suítes, tsc --noEmit, check:gates (1705 arquivos, 3725 dependências; 16 registros v1 e 8 históricos), build (707 módulos) e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `src/stages/contracts/CampaignMacro.ts`
- `src/application/stages/CampaignNavigation.ts`
- `src/application/stages/CampaignRunSaveService.ts`
- `src/application/stages/CampaignMacroState.ts`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/application/stages/index.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabMacroDataService.ts`
- `src/devtools/world-lab/index.ts`
- `src/tests/campaignMacroRouteBinding.test.ts`
- `prompts/20-etapa-9-2a-binding-rotas-macro-world-lab.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 9.2A — Binding das rotas macro e visualização no World Lab** do Umbra Trail.

### Contexto mínimo

Leia:

- `AGENTS.md`
- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `CampaignMacroProgression.ts`
- `UmbraCampaignSkeleton.ts`
- `CampaignRouter.ts`
- `CampaignRunSaveService.ts`
- APIs públicas de `src/stages/` e `src/devtools/world-lab/`

Consulte outros arquivos somente quando necessário.

### Objetivo

Preparar a primeira rota da campanha para navegação real, preservando os sistemas existentes e permitindo inspecionar o percurso no Umbra World Lab.

### Implementação

1. Criar um binding entre as escolhas de `CampaignMacroProgression` e os destinos carregáveis pelos sistemas existentes.
2. Preparar uma vertical slice com Floresta das Raízes (hub) e Igapó (primeira região da Rota das Águas).
3. Reutilizar temporariamente mapas legados válidos, identificados explicitamente como placeholders. Não criar mapas definitivos.
4. Preservar o estado da rota ao retornar ao hub e retomá-la, sem perder node, histórico, seeds ou recompensas.
5. Resolver a limitação de um único grafo ativo usando uma adaptação mínima dos contratos existentes. Não criar outro router ou serviço de persistência.
6. Garantir que destinos `planned` permaneçam bloqueados até possuírem stages válidos.
7. Expor as conexões reais e as escolhas bloqueadas no World Lab, utilizando as APIs públicas.
8. Validar o ciclo hub → Igapó → hub → retomada, incluindo save/load.
9. Criar testes headless de navegação, retomada, isolamento entre rotas, rollback e compatibilidade.
10. Atualizar a SPEC e registrar o prompt efetivo em `prompts/`.

### Restrições

- Não modificar `GameScene` nesta etapa.
- Não alterar combate, movimentação, IA ou geração procedural.
- Não criar sprites, personagens ou narrativas completas.
- Não implementar todas as regiões.
- Não duplicar `CampaignRouter`, `StageLoader` ou mecanismos de persistência.
- Não adicionar dependências sem necessidade.
- Não criar commits automaticamente.

### Validação econômica

- Testes novos/afetados durante a implementação.
- Gates e typecheck após finalizar.
- Suíte completa e build uma vez ao final.
- `git diff --check`.

### Entrega

Informar arquivos alterados, contratos reutilizados, resultados dos testes, funcionamento no World Lab e limitações para a integração Phaser.

Priorize implementação pequena e verificável. Caso o binding exija uma refatoração extensa, documente a dependência antes de ampliar o escopo.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
