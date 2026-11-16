# Registro de prompt: Finaliza PR #2 após normalização LF

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-16-finaliza-pr-2-apos-normalizacao-lf`
- Data: `2026-11-16`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-16-normalizacao-lf-svg.md`
- Commit: `pendente`
- Execução: `igapoAssets.test.ts` (6/6); `npm run check:gates`; `npm run build`
  (inclui typecheck); suíte completa (97 suítes, 1.191 testes), tudo aprovado.

## Arquivos modificados

- `.gitattributes`
- `SPEC/2026-11-16-auditoria-fases-menu.md`
- `SPEC/2026-11-16-normalizacao-lf-svg.md`
- `SPEC/README.md`
- `docs/auditoria-fases-menu.md`
- `prompts/70-auditoria-fases-menu.md`
- `prompts/71-corrige-hashes-svg-windows-linux.md`
- `prompts/72-finaliza-pr-2-apos-normalizacao-lf.md`
- `src/assets/aguas/README.md`
- `src/presentation/assets/igapoAssetCatalog.ts`

## Prompt efetivamente recebido

```text
A PR #1 já foi mesclada na `main`.

Finalize a PR #2 (`feat/menu-modernizacao`):

1. Atualize a branch com a `main`, preservando toda a implementação do menu.
2. Resolva eventuais conflitos.
3. Corrija a falha de hash de `igapo-forest-floor.svg` em `igapoAssets.test.ts`, considerando a normalização LF já integrada à `main`.
4. Não altere os desenhos SVG nem a lógica das fases.
5. Execute a suíte completa, `check:gates` e build.
6. Confirme que os 1.191 testes passam.
7. Faça os commits necessários seguindo `AGENTS.md`, com trailers `Agent` e `Spec`.
8. Faça push e atualize a PR #2.
**Não faça merge da PR #2.** Eu farei manualmente após conferir os resultados.

Ao finalizar, informe os testes, commits e estado da PR.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
