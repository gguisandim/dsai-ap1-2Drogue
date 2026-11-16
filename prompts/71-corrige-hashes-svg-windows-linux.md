# Registro de prompt: correção de hashes SVG entre Windows e Linux

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-16-corrige-hashes-svg-windows-linux`
- Data: `2026-11-16`
- Agente: `Copilot SDK em VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-16-normalizacao-lf-svg.md`
- Commit: `pendente`
- Execução: testes dirigidos (3 suítes, 22 testes PASS); suíte completa (95 suítes, 1.185 testes PASS); `npm run check:gates`, `npm run build`, `git diff --check` e checkout Windows limpo dos 32 SVGs com `i/lf`, `w/lf`, `attr/text eol=lf` aprovados; auditoria de segredos (PASS). Push e CI pendentes.

## Arquivos modificados

- `.gitattributes`
- `SPEC/README.md`
- `SPEC/2026-11-16-normalizacao-lf-svg.md`
- `src/assets/aguas/README.md`
- `src/presentation/assets/igapoAssetCatalog.ts`
- `prompts/71-corrige-hashes-svg-windows-linux.md`

## Prompt efetivamente recebido

```text
Na branch `docs/auditoria-fases-menu`, corrija as três falhas de testes de hash de assets causadas pela conversão LF/CRLF.

Investigue `.gitattributes` e `core.autocrlf`. Garanta que os SVGs mantenham conteúdo consistente entre Windows e Linux, sem modificar seus desenhos.

Execute os testes afetados e, depois, a suíte completa.

Se tudo passar, crie os commits conforme `AGENTS.md`, faça push para atualizar a PR #1 e verifique o CI. Não faça merge nem altere arquivos fora do escopo.
```

## Observações factuais

- `core.autocrlf=true` estava configurado globalmente; os 32 SVGs tinham LF no índice e CRLF no worktree antes da regra de `.gitattributes`.
- A verificação dos bytes LF versionados também encontrou dois hashes antigos no catálogo e no inventário do Igapó; somente os metadados foram atualizados.
- Nenhum arquivo SVG teve alteração persistente de desenho ou bytes no índice.
- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente` antes da consolidação; o gate deriva o commit
  que adicionou este arquivo.
