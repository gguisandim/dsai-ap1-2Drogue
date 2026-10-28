# Etapa 8.4: vinculação canônica de saídas da campanha

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-4-vinculacao-canonica-saidas`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `jest campaignExitBinder (14/14), jest direcionado binder + rastreabilidade (21/21), tsc --noEmit, check:gates (1674 arquivos, 3617 dependências; 7 registros v1 e 8 históricos), suíte completa 699/699, build (698 módulos) e git diff --check aprovados em 2026-10-28`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `src/stages/contracts/CampaignExitBinding.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/CampaignExitBinder.ts`
- `src/tests/campaignExitBinder.test.ts`
- `scripts/check-traceability.mjs`
- `src/tests/traceabilityGates.test.ts`
- `test-fixtures/traceability-gates/markdown-headings/prompts/09-cabecalhos.md`
- `prompts/15-etapa-8-4-vinculacao-canonica-saidas.md`

## Prompt efetivamente recebido

```text
# Etapa 8.4 — Vinculação Canônica de Saídas da Campanha

Continue o desenvolvimento do **Umbra Trail**, dando sequência à Etapa 8.3, conforme `SPEC/2026-10-28-campanha-procedural-ramificada.md`.

## Objetivo

Implementar a associação explícita e determinística entre as arestas do grafo da campanha (`CampaignGraph`), as saídas declaradas no `LoadedStage` (`manifest.exits`) e as saídas físicas produzidas pelo `PhysicalExitResolver`.

A finalidade é garantir que cada saída física corresponda inequivocamente ao destino correto da campanha, inclusive em bifurcações e convergências.

**Esta etapa deve continuar headless, pura e independente do Phaser.**

## 1. Inspeção obrigatória

Antes de modificar qualquer arquivo:

- Leia `AGENTS.md`, `IA_GUIDE.md` e as regras aplicáveis do repositório.
- Leia a SPEC da campanha procedural e os registros das Etapas 8.1, 8.2 e 8.3.
- Inspecione `CampaignGraph.ts`, `CampaignGraphGenerator.ts`, `PhysicalExitResolver.ts`, `LoadedStage`, `manifest.exits`, contratos de âncoras e testes existentes.
- Identifique como `stageExitId`, `edge.exitSlotId` e `physicalExitId` são utilizados.
- Preserve compatibilidade com os contratos públicos existentes sempre que possível.

Não assuma nomes de campos ou caminhos sem verificar o código.

## 2. Contrato canônico de vinculação

Crie um módulo headless responsável por produzir a correspondência:

`campaign edge → stage manifest exit → physical exit → destination node`

Defina contratos tipados para entrada, resultado, vínculos resolvidos, diagnósticos e falhas.

Cada vínculo válido deve identificar:

- Nó de origem e nó de destino.
- Aresta da campanha.
- Slot lógico de saída.
- Saída correspondente no manifesto, quando aplicável.
- Saída física resolvida, incluindo coordenadas.
- Identificadores necessários para uma futura transição entre fases.

Não use nomes de biomas, textos de interface, ordem de arrays ou coordenadas como identidade lógica.

Se o manifesto não declarar uma saída explícita, defina uma política documentada de associação ou de falha. Não crie vínculos ambíguos nem atribua destinos arbitrariamente.

## 3. Invariantes

Garanta:

1. Cada aresta possui exatamente um vínculo físico válido.
2. Nenhuma saída física pertence a duas arestas diferentes.
3. Nenhuma saída de manifesto é reutilizada indevidamente.
4. A correspondência preserva `edgeId`, `exitSlotId`, `stageExitId` e `physicalExitId`, conforme os contratos existentes.
5. O destino corresponde ao nó indicado pela aresta.
6. Bifurcações permanecem distintas.
7. Convergências não provocam colisões de identidade.
8. Reordenar arrays de arestas, entidades ou saídas não altera o resultado.
9. Referências ausentes, duplicadas ou incompatíveis retornam falhas tipadas.
10. Nenhum vínculo inválido é retornado como sucesso parcial.

Preserve o determinismo já estabelecido nas Etapas 8.2 e 8.3.

## 4. Integração com PhysicalExitResolver

Reutilize `PhysicalExitResult` e os contratos existentes, sem duplicar a lógica de posicionamento.

O novo componente deve consumir saídas físicas já resolvidas e verificar sua correspondência com as arestas e o manifesto.

Não deve:

- Regenerar mapas.
- Reposicionar saídas.
- Modificar a topologia da campanha.
- Criar novos destinos.
- Corrigir inconsistências silenciosamente.
- Alterar o comportamento do `PhysicalExitResolver` sem necessidade comprovada.

Caso encontre uma incompatibilidade estrutural, registre diagnóstico tipado e retorne falha.

## 5. Determinismo e diagnósticos

Implemente ordenação canônica dos vínculos e diagnósticos.

A mesma entrada lógica deve produzir resultado equivalente, independentemente da ordem dos arrays.

Use identificadores estáveis e não dependa de ordem de inserção de objetos.

Evite exceções não controladas para erros esperados de validação.

Mantenha a mesma filosofia de resultados tipados utilizada pelo `PhysicalExitResolver`.

## 6. Testes obrigatórios

Inclua testes para:

- Saída única.
- Duas saídas em bifurcação.
- Três ou mais saídas.
- Associação por âncora explícita.
- Associação por `exitSlotId`.
- Ausência de entrada correspondente no manifesto.
- Identificadores duplicados.
- Saída física ausente.
- Saída física adicional indevida.
- Destino inconsistente.
- Reordenação de arestas e saídas.
- Convergência de caminhos.
- Resultado inválido sem sucesso parcial.
- Determinismo em execuções repetidas.

Acrescente casos relevantes identificados durante a inspeção.

## 7. Documentação e rastreabilidade

Atualize `SPEC/2026-10-28-campanha-procedural-ramificada.md` com a seção **Etapa 8.4 — Vinculação Canônica de Saídas**.

Documente:

- Contratos e invariantes.
- Política de associação com `manifest.exits`.
- Critérios de falha.
- Compatibilidade com etapas anteriores.
- Limitações e responsabilidades da futura integração Phaser.

Crie o próximo registro de prompt no padrão `umbra-prompt-record/v1`, respeitando as convenções do repositório.

## 8. Restrições

- Não implementar portais, animações, HUD ou transições visuais.
- Não adicionar dependências desnecessárias.
- Não expandir o escopo para novas mecânicas.
- Não alterar `GameScene.ts`.
- Não modificar arquivos fora do escopo sem justificativa.
- Não remover testes nem enfraquecer validações.
- Não criar commits nem executar push.

## 9. Validação final

Execute os comandos equivalentes aos utilizados na Etapa 8.3:

- Testes específicos do novo componente.
- `tsc --noEmit`.
- `check:gates`.
- Suíte completa.
- `npm run build`.
- `git diff --check`.

Corrija eventuais regressões introduzidas nesta etapa.

## 10. Relatório de entrega

Apresente:

1. Arquivos criados e alterados.
2. Contratos implementados.
3. Política efetiva de vinculação.
4. Invariantes garantidos.
5. Diagnósticos e falhas possíveis.
6. Testes e resultados reais.
7. Limitações restantes.
8. Próxima etapa recomendada.

**Critério de conclusão:** uma campanha com bifurcações deve ter todas as suas saídas físicas associadas de forma estável, verificável e inequívoca aos destinos corretos, sem dependência do Phaser e sem comprometer a geração procedural existente.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `IA_GUIDE.md não existe no repositório; nenhuma instrução foi inferida para substituí-lo.`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
