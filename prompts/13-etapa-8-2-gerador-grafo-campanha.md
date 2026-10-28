# Etapa 8.2: gerador headless do grafo de campanha

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-2-gerador-campanha`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest campaignGraph + campaignGraphGenerator (20/20), tsc --noEmit, check:gates (1669 arquivos, 3599 dependências), suíte completa 670/670 e build aprovados em 2026-10-28; traceability revalidado com 5 registros após este arquivo`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/stages/contracts/CampaignGraph.ts`
- `src/stages/index.ts`
- `src/stages/runtime/CampaignGraphGenerator.ts`
- `src/tests/campaignGraphGenerator.test.ts`
- `prompts/13-etapa-8-2-gerador-grafo-campanha.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 8.2 — CampaignGraphGenerator headless do Umbra Trail.

Leia `AGENTS.md`, `SPEC/2026-10-28-campanha-procedural-ramificada.md`, `src/stages/contracts/CampaignGraph.ts`, `CampaignGraphValidator.ts` e os contratos públicos de RNG determinístico. Consulte outros arquivos apenas quando indispensáveis.

**Objetivo:** gerar grafos de campanha ramificados e reproduzíveis, com nove posições por percurso e três marcos narrativos obrigatórios.

Implementação:
1. Criar `CampaignGraphGenerator` utilizando os contratos da Etapa 8.1.
2. Receber seed, catálogo elegível e contexto narrativo congelado.
3. Gerar grafos com 9–12 nós, bifurcações limitadas e rotas que convergem.
4. Garantir exatamente nove posições por caminho completo, três atos e marcos nas profundidades 2, 5 e 8.
5. Selecionar regiões por tags, ato, dificuldade e elegibilidade, sem duplicações indevidas.
6. Produzir IDs estáveis de nós, arestas e saídas físicas.
7. Garantir determinismo independente da ordem de entrada do catálogo.
8. Validar cada grafo com `CampaignGraphValidator`; retornar falha tipada quando as restrições forem impossíveis.
9. Criar testes para seeds iguais/diferentes, reordenação do catálogo, bifurcações, convergência, marcos obrigatórios e catálogos insuficientes.
10. Exportar API pública mínima e atualizar a SPEC.

Restrições:
- Não modificar Phaser, `GameScene`, combate, simulação ou progressão.
- Não implementar posicionamento físico das saídas, persistência, UI ou narrativa amazônica.
- Não alterar contratos anteriores sem necessidade demonstrada.
- Não adicionar dependências.
- Não criar commits automaticamente.
- Registrar o prompt efetivo conforme `umbra-prompt-record/v1`.

**Validação econômica:** executar testes afetados durante o desenvolvimento, depois architecture/traceability gates, typecheck e, uma vez ao final, suíte completa e build. Não repetir verificações que já passaram sem alteração relevante.

Entregar resumo dos arquivos, novos testes, resultados e limitações.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
