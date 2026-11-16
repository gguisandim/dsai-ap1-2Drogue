# Normalização LF de SVGs entre plataformas

**Data:** 2026-11-16  
**Estado:** correção de normalização de texto no Git  
**Escopo:** manter os bytes dos SVGs estáveis no worktree Windows e Linux, sem
alterar desenhos ou hashes declarados nos catálogos.

## Contexto

O repositório armazena SVGs com LF, mas não define atributos Git para essa
extensão. Em Windows com `core.autocrlf=true`, o checkout os converte para
CRLF. Testes que verificam SHA-256 dos arquivos passam a comparar bytes
diferentes dos hashes registrados.

## Critérios observáveis

1. `.gitattributes` declara SVGs como texto com `eol=lf`, prevalecendo sobre
   `core.autocrlf` local.
2. Os 32 SVGs versionados permanecem LF no índice e no worktree do Windows,
   sem alterações de conteúdo artístico ou dos hashes catalogados.
3. `stageLoader` ou outros dados de fase não mudam; os testes de hash das fases
   Floresta das Raízes, Jardins das Flores Veladas e Igapó passam.
4. A suíte completa passa e não há alterações pendentes nos SVGs depois da
   normalização do checkout.

## Verificações

- `git ls-files --eol '*.svg'` confirma `i/lf` e `w/lf` após checkout.
- Testes dirigidos: `worldRootSanctuary.test.ts`, `veiledGardens.test.ts` e
  `igapoAssets.test.ts`.
- Fechamento: `npm run check:gates`, `npm run build`,
  `npm test -- --runInBand` e `git diff --check`.
