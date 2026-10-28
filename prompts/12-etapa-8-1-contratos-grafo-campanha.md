# Etapa 8.1: contratos do grafo de campanha e identidade por instância

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-1-contratos-campanha`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest campaignGraph (12/12) e tsc --noEmit aprovados; check:gates aprovado (1667 arquivos, 3594 dependências); suíte completa 661/662 com falha pré-existente de contagem em traceabilityGates, corrigida e revalidada (6/6); build aprovado; traceability revalidado após o registro`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/stages/contracts/CampaignGraph.ts`
- `src/stages/contracts/index.ts`
- `src/stages/runtime/CampaignGraphValidator.ts`
- `src/stages/index.ts`
- `src/narrative/contracts/NarrativeRuntime.ts`
- `src/narrative/runtime/NarrativeIdentity.ts`
- `src/narrative/persistence/CampaignSaveValidator.ts`
- `src/tests/campaignGraph.test.ts`
- `src/tests/traceabilityGates.test.ts`
- `prompts/12-etapa-8-1-contratos-grafo-campanha.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 8.1 do Umbra Trail conforme `SPEC/2026-10-28-campanha-procedural-ramificada.md`.

**Contexto mínimo:**
- `AGENTS.md`
- SPEC indicada (somente seções relevantes à Etapa 8.1).
- `src/stages/contracts/`
- `src/narrative/contracts/`
- Arquivos de identidade narrativa e seus testes diretos.

Não explore o repositório inteiro. Consulte outros arquivos somente quando uma dependência concreta exigir.

**Implementação:**
1. Criar contratos de `CampaignGraph`, `CampaignNode`, `CampaignEdge` e `PhysicalExit`.
2. Adicionar `stageInstanceId` ao `NarrativeIdentityScope`, preservando IDs legados.
3. Implementar `CampaignGraphValidator` headless, com diagnósticos tipados.
4. Validar caminhos de nove posições, marcos nas profundidades 2/5/8, bifurcações, convergência, referências, IDs e ausência de ciclos/softlocks.
5. Garantir identidade distinta para duas ocorrências do mesmo template.
6. Expor API pública mínima e criar testes positivos/negativos relevantes.
7. Atualizar a SPEC e registrar este prompt em `prompts/` conforme `umbra-prompt-record/v1`.

**Restrições:**
- Não modificar `GameScene`, combate, IA, procedural ou Phaser.
- Não implementar gerador, resolver físico, UI ou conteúdo amazônico.
- Não adicionar dependências.
- Não reformatar arquivos fora do escopo.
- Não criar commits.

**Validação econômica:**
1. Durante o desenvolvimento, executar somente testes novos/afetados.
2. Executar typecheck e architecture gate após finalizar.
3. Executar a suíte completa e o build apenas uma vez ao final, se as verificações anteriores passarem.
4. Se alguma validação falhar, corrigir somente a causa e repetir a verificação afetada.
5. Não executar comandos redundantes ou gerar relatórios extensos.

**Entrega:** arquivos alterados, testes novos, resultados das validações e limitações, em resumo objetivo.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
