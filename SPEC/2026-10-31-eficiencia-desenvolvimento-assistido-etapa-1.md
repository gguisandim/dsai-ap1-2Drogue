# Eficiência do desenvolvimento assistido por IA — Etapa 1

**Data:** 2026-10-31  
**Referência:** `docs/audits/agent-efficiency-audit.md`

## Objetivo

Reduzir contexto, leituras, logs e validações redundantes no trabalho assistido
por IA sem alterar código do jogo, contratos, cobertura de testes, gates ou CI.

Esta etapa altera somente as instruções globais de trabalho em `AGENTS.md`.

## Regras

### Contexto mínimo

- O agente lê a SPEC vigente, os contratos públicos e os arquivos diretamente
  relacionados à tarefa antes de expandir a investigação.
- SPECs históricas e registros em `prompts/` não entram no contexto por padrão.
- Uma leitura adicional deve responder a uma dúvida concreta que os contratos
  públicos ou a SPEC vigente não esclarecem.
- Tarefas de rastreabilidade continuam lendo o template e os registros
  estritamente necessários, sem alterar evidências históricas.

### Validação proporcional

- Durante a implementação, o agente executa a menor seleção de testes que cobre
  a mudança em curso.
- A validação completa obrigatória continua sendo executada no fechamento de
  uma implementação, depois da última alteração relevante.
- Se a validação completa revelar uma falha e o código for corrigido, ela deixa
  de ser a execução final e deve ser repetida depois da correção.
- `npm run build` já inclui o typecheck. Sem alteração TypeScript intermediária,
  o agente não executa `npm run typecheck` separadamente apenas para duplicar a
  mesma evidência.
- Mudanças exclusivamente documentais usam validações documentais e gates
  relevantes; não executam a suíte de gameplay sem uma dependência concreta.

### Logs e entrega

- Saídas extensas podem ser preservadas em arquivos temporários não versionados.
- O contexto do agente recebe somente o resumo, as falhas e os trechos necessários
  ao diagnóstico.
- Arquivos temporários da tarefa são removidos antes da entrega.
- O relatório final informa arquivos modificados, validações, falhas e riscos ou
  pendências, sem repetir o prompt, logs completos ou narrativa operacional.

## Compatibilidade e fora de escopo

Permanecem inalterados:

- jogo, contratos, saves, conteúdo e `GameScene`;
- testes e sua cobertura;
- configuração do Jest;
- workflows de CI;
- scripts de gates;
- exigências de SPEC, registros de prompt, auditoria de segredos e trailers de
  commit.

Perfis de teste, factories compartilhadas, orquestrador de validação, mudanças
em Jest, CI, gates ou arquitetura ficam para etapa posterior com regressão
própria.

## Critérios de aceitação

1. `AGENTS.md` define uma ordem de leitura orientada por contexto mínimo.
2. O documento exclui explicitamente SPECs históricas e `prompts/` da leitura
   padrão, preservando exceções de rastreabilidade.
3. Testes dirigidos são usados durante a implementação e a suíte completa
   permanece obrigatória no fechamento da última alteração relevante.
4. A instrução reconhece que `build` já executa typecheck e evita repetição sem
   mudança intermediária.
5. Logs extensos ficam fora do contexto e são resumidos.
6. O relatório final segue um formato compacto e verificável.
7. Nenhum teste, script, workflow, contrato ou arquivo de gameplay é alterado.
8. O gate de rastreabilidade e `git diff --check` são aprovados.

## Validação prevista

```text
npm run check:traceability
git diff --check
```

A suíte Jest e o build não são executados porque esta etapa não altera arquivos
executáveis, configuração ou testes. Essa decisão aplica a validação proporcional
sem enfraquecer a validação completa de futuras entregas de implementação.
