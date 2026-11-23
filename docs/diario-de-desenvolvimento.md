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
- Após a criação da PR, `origin/main` avançou com SPECs e conteúdo autoral de
  fases. Com autorização, a branch integrou o novo `main` sem reescrever
  histórico e preservou todas as entradas do índice de SPEC.
- A SPEC foi registrada antes da implementação em
  `SPEC/2026-11-18-etapa-9-16-identidade-repositorio.md`.
- Validações após integrar o `main`: `npm run check:gates` aprovado;
  `npm run build` aprovado; `npm test -- --runInBand` aprovado (100 suítes,
  1.221 testes); `git diff --check` aprovado.
- `git diff --check --cached` ao integrar `main` apontou espaços finais somente
  em arquivos vindos dos commits upstream; esses arquivos foram preservados sem
  alteração. O diff desta etapa permanece sem erros de whitespace.
- Integridade: HTML da build usa bundle relativo; os 82 recursos do manifesto
  Vite resolvem para arquivos da build ou URLs `data:` incorporadas. O teste
  automatizado teve uma primeira execução afetada por fixtures temporárias
  remanescentes de uma execução interrompida; após remover apenas esses
  resíduos, a suíte completa passou. A suíte final também informou que um
  worker foi finalizado à força após todos os testes passarem. A build emite
  avisos de API CJS obsoleta e bundle principal acima de 500 kB, sem falhar.

## 2026-11-23 — Etapa 9.17: ajustes do menu e pré-visualização das fases

- `main` e a árvore de trabalho foram confirmados antes da alteração; a
  `origin/main` foi integrada por fast-forward e a branch
  `fix/menu-preview-fases` foi criada.
- O diagnóstico mostrou que o seletor resolve a prévia pelo primeiro fundo
  disponível ou pelo piso. O fundo pode ser o tile genérico `puny_world`,
  enquanto fases com piso próprio ou panorama não são priorizadas como resumo.
- A mudança preserva ações de novo jogo, continuação e seleção de fase; remove
  apenas o botão e registro de navegação de Créditos do menu principal.
- A solução reutiliza os panoramas, canopies e pisos já existentes. Fases
  legadas continuam sem arte própria e usam o tile legado existente.
- SPEC registrada antes da implementação em
  `SPEC/2026-11-23-etapa-9-17-menu-preview-fases.md`.
- Validações finais: pendentes.
