# Etapa 7: campanha procedural ramificada com saídas físicas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-campaign-graph-physical-exits-spec`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `check:gates e git diff --check aprovados em 2026-10-28; etapa somente documental`

## Arquivos modificados

- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `SPEC/README.md`
- `prompts/11-campanha-procedural-ramificada-saidas-fisicas.md`

## Prompt efetivamente recebido

```text
Implemente a Etapa 7 — especificação de campanha procedural ramificada com saídas físicas — no Umbra Trail.

Contexto obrigatório:

- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `src/stages/index.ts`
- `src/narrative/index.ts`
- `src/application/stages/index.ts`
- Contratos públicos de saídas, geração procedural e persistência.

Objetivo: projetar campanhas roguelite amazônicas em que cada run sorteia um percurso conectado de nove regiões, com bifurcações e transições por saídas físicas no mapa, preservando combate e movimentação existentes.

**Entregas desta etapa:**

1. Criar uma SPEC datada para `CampaignGraph`, `CampaignGraphGenerator`, `CampaignNode`, `CampaignEdge` e `PhysicalExit`.
2. Definir três atos narrativos com marcos obrigatórios e regiões intermediárias variáveis.
3. Estabelecer sorteio determinístico por seed, elegibilidade por bioma, ato, dificuldade, eventos e revelações narrativas.
4. Definir como múltiplas saídas físicas serão posicionadas e validadas em tiles transitáveis, alcançáveis e distintos, com fallback seguro quando faltar espaço.
5. Definir como o `StageLoader`, o `StageDirector` e a persistência existente serão reutilizados sem duplicar seus estados.
6. Garantir que regiões e saídas usem IDs estáveis, mesmo quando o mesmo template aparecer em runs diferentes.
7. Planejar retorno e revisita, limites de ramificação, prevenção de softlocks e preservação de missões secundárias.
8. Especificar como a história mantém revelações obrigatórias independentemente do caminho sorteado.
9. Definir um protótipo mínimo com 3–4 regiões legadas e duas rotas alternativas.
10. Propor testes de determinismo, alcançabilidade, save/load, rollback, compatibilidade e regressão.

**Restrições:**

- Nesta etapa, criar somente documentação, contratos propostos e plano incremental.
- Não modificar `GameScene`, runtime, combate, simulação ou geração procedural.
- Não substituir as fases atuais.
- Não criar mapas, NPCs, sprites ou assets agora.
- Não implementar o gerador de campanha antes de validar os contratos.
- Não alterar os gates arquiteturais sem justificativa documentada.
- Registrar o prompt efetivamente recebido conforme `umbra-prompt-record/v1`.
- Não criar commits automaticamente.

Atualizar o índice de SPECs, documentar invariantes, responsabilidades, dependências e critérios de aceitação.

Ao final, executar os gates aplicáveis e `git diff --check`, relatando arquivos modificados, decisões, riscos e a sequência de implementação.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- O modelo e o esforço exatos não foram informados no prompt recebido.
- Nenhum contrato executável ou gerador foi implementado nesta etapa.
