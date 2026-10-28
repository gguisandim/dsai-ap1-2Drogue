# Etapa 8.3: resolver de saídas físicas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-3-resolver-saidas-fisicas`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest physicalExitResolver (14/14), tsc --noEmit, check:gates (1671 arquivos, 3607 dependências), suíte completa 684/684, build e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/stages/contracts/CampaignGraph.ts`
- `src/stages/index.ts`
- `src/stages/runtime/PhysicalExitResolver.ts`
- `src/tests/physicalExitResolver.test.ts`
- `prompts/14-etapa-8-3-resolver-saidas-fisicas.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 8.3 do Umbra Trail: PhysicalExitResolver headless.

Leia `AGENTS.md`, `SPEC/2026-10-28-campanha-procedural-ramificada.md`, os contratos públicos em `src/stages/`, o `CampaignGraphGenerator`, o `ResolvedLevelValidator` e somente os arquivos necessários de geometria/navegação.

Objetivo: resolver deterministicamente as saídas físicas das arestas do CampaignGraph em coordenadas válidas de uma fase carregada, sem modificar o mapa ou a jogabilidade.

Implementação:
1. Criar `PhysicalExitResolver` com entrada composta pelo nó atual, suas arestas de saída e o `LoadedStage`.
2. Posicionar saídas em tiles transitáveis, alcançáveis a partir do spawn, distintos e suficientemente separados.
3. Reutilizar anchors/saídas explícitas quando forem compatíveis com os contratos existentes.
4. Usar seed estável e ordenação canônica para desempate, independentemente da ordem das arestas.
5. Respeitar obstáculos, colisões, posições reservadas e capacidade física declarada.
6. Retornar `Result` tipado com diagnósticos; nunca retornar posicionamento parcial.
7. Implementar fallback determinístico limitado e falha explícita quando não houver espaço.
8. Criar testes positivos e negativos para mapas pequenos, paredes, áreas desconectadas, anchors, bifurcações e determinismo.
9. Expor API pública mínima e atualizar a SPEC.
10. Registrar o prompt efetivo em `prompts/` conforme `umbra-prompt-record/v1`.

Restrições:
- Não modificar `GameScene`, Phaser, combate, simulação, IA ou progressão.
- Não alterar o `CampaignGraphGenerator` sem necessidade demonstrada.
- Não criar portais visuais ou transições.
- Não alterar o mapa para acomodar saídas.
- Não adicionar dependências.
- Não criar commits automaticamente.

Validação econômica: executar os testes afetados durante o desenvolvimento; ao final, rodar gates, typecheck, suíte completa, build e `git diff --check` uma única vez, salvo falhas.

Entregar resumo dos arquivos, novos testes, determinismo, diagnósticos e limitações.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
