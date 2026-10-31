# Registro de prompt: Auditoria de eficiência do desenvolvimento assistido por IA

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-auditoria-eficiencia-agentes`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `desconhecido`
- Commit: `pendente`
- Execução: `concluída; suíte Jest e scripts relevantes medidos; relatório criado; git diff --check aprovado`

## Arquivos modificados

- `docs/audits/agent-efficiency-audit.md`
- `prompts/36-auditoria-eficiencia-agentes.md`

## Prompt efetivamente recebido

```text
Faça uma auditoria de eficiência do desenvolvimento assistido por IA neste repositório.

**Objetivo:** reduzir consumo de tokens, tempo de execução e trabalho redundante dos agentes, preservando qualidade, modularidade e testes essenciais.

Analise:

- `AGENTS.md`, `package.json`, configurações do Jest e `.github/workflows/`.
- `src/tests/`, identificando sobreposição de testes, arquivos custosos e oportunidades de consolidação.
- Instruções, SPECs e documentação consultadas pelos agentes.
- Dependências entre módulos que aumentam o contexto necessário para tarefas isoladas.
- Repetições de validação, builds, leituras e geração de relatórios.

Execute uma medição da suíte de testes e dos scripts relevantes, sem alterar arquivos versionados. Use relatórios temporários e saídas resumidas.

Classifique cada oportunidade por economia esperada, risco e esforço. Não estime percentuais de economia de tokens sem medições.

**Restrições:**

- Não modifique o código nesta etapa.
- Não remova testes.
- Não altere contratos ou funcionalidades.
- Não reescreva a documentação.
- Não execute novamente validações já concluídas sem justificativa.
- Evite logs extensos no contexto do agente.

**Entrega:** crie `docs/audits/agent-efficiency-audit.md` com diagnóstico, evidências, métricas disponíveis, gargalos e um plano de otimização priorizado. Diferencie melhorias imediatas de mudanças que exigem testes de regressão.

Ao final, apresente somente um resumo objetivo dos principais problemas e das alterações recomendadas.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
