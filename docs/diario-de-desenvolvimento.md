# Diário de desenvolvimento

## 2026-11-18 — Etapa 9.16: identidade e desvinculação do repositório

- Auditoria Git: `main` foi atualizada por fast-forward para `origin/main`; os
  commits recentes de menu e documentação são de Jonas, enquanto as
  implementações de fases e campanha anteriores permanecem creditadas a
  Guilherme.
- README atualizado para o endereço do GitHub Pages do fork. A publicação
  ainda não existe: a URL respondeu HTTP 404, a API de Pages não retornou uma
  configuração e o workflow ativo não tem execuções nem deployments. É preciso
  habilitar Pages com GitHub Actions e publicar a branch `main`.
- Confirmado que o workflow existente já publica a `main` e que o Vite usa
  `base: './'`; nenhuma alteração em workflow, Vite ou assets foi necessária.
- Título HTML e metadados do pacote alinhados à identidade Umbra Trail.
- Créditos históricos, referências em registros arquivados e o remoto `upstream`
  foram preservados.
- A SPEC foi registrada antes da implementação em
  `SPEC/2026-11-18-etapa-9-16-identidade-repositorio.md`.
- Validações: `npm run check:gates` aprovado; `npm run build` aprovado; `npm test
  -- --runInBand` aprovado (97 suítes, 1.191 testes); `git diff --check` aprovado.
- Integridade: HTML da build usa bundle relativo; os 35 recursos do manifesto
  Vite resolvem para arquivos da build ou URLs `data:` incorporadas. O teste
  automatizado teve uma primeira execução afetada por fixtures temporárias
  remanescentes de uma execução interrompida; após remover apenas esses
  resíduos, a suíte completa passou. Build emite avisos de API CJS obsoleta e
  bundle principal acima de 500 kB, sem falhar.
