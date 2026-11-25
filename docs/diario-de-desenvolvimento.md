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
- Implementação: o menu usa `NOVO JOGO`, remove o botão e o registro do menu
  para `CRÉDITOS`, e o seletor ignora `puny_world` como fundo genérico ao
  escolher uma arte temática disponível.
- Validações dirigidas: 30 testes passaram em menu, prévia e sessão de jogo.
- Validação completa com `NODE_OPTIONS=--max-old-space-size=4096`:
  `npm run check:gates`, `npm run build` e `npm test -- --runInBand` aprovados;
  a suíte final passou com 100 suítes e 1.223 testes.
- Verificação visual local: Novo Jogo visível, Créditos ausente, Minas com
  panorama, Flores com canopy, Igapó e Raiz com piso próprio e Palácio com sua
  canopy escura já existente. Fases legadas não possuem panorama próprio;
  usam o tile legado `tile_floor` como prévia reutilizada.

## 2026-11-24 — Etapa 9.18: modernização das Minas Corrompidas

- Confirmada a integração da PR #4 em `origin/main` (`8d99881`) e atualizada
  `main` por fast-forward; criada `feat/modernizacao-minas-corrompidas` a
  partir desse commit.
- Histórico do capítulo e catálogo conferido: a implementação das Minas foi
  criada por Guilherme Sandim no commit `8089093`; não havia alteração posterior
  concorrente nos arquivos verificados.
- Causa da descontinuidade: cinco panoramas de 2172 px eram posicionados com
  escala `0.34`, cobrindo cerca de 23 tiles frente a intervalos de até 40 tiles;
  os vazios deixavam expostos o piso pixel art, em contraste com o chão pintado
  dentro dos PNGs. Os inimigos estavam ligados a SVGs estáticos, cujas
  animações repetiam somente o quadro base.
- SPEC registrada antes do commit de implementação em
  `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md` (commits
  `867f4dd`, `f07641a` e `200fc0d`, todos documentais).
- Os mesmos cinco PNGs foram ampliados e reposicionados em sobreposição,
  acompanhando a trilha desde o spawn até a saída; o depth foi ajustado para
  manter obstáculos e atores legíveis.
- As duas variantes passaram a usar spritesheets Puny 128×114 e animações
  existentes de caminhada, ataque e dano, com tintas e escalas de Minas.
  Mapa lógico, waves, HP, objetivos, colisões, save e progressão não foram
  alterados. Os SVGs originais permanecem preservados e catalogados.
- Validações: `npm run check:gates`, `npm run build`, teste dirigido de Minas
  (12 testes), suíte completa (100 suítes/1.224 testes) e `git diff --check`
  aprovados. A primeira execução completa teve uma falha transitória em
  `architectureGates.test.ts` ao ler fixture removida; a suíte isolada e a
  repetição completa passaram. A tentativa de CLI do plano foi incompatível
  com capítulos de produção (a CLI espera `src/examples/chapters/`); o teste
  do próprio capítulo valida o plano de produção por `validateStagePlanFile`.
- A inspeção visual de runtime e capturas antes/depois não foram executadas:
  a sessão de Computer Use não autorizou uso do Chrome. PNGs de origem e
  spritesheets foram inspecionados, mas isso não substitui homologação no jogo.

## 2026-11-24 — Revisão humana da direção artística das Minas

- A homologação humana reprovou parcialmente `746d829`: os adversários e suas
  animações foram aprovados; o cenário foi reprovado por continuar parecendo
  uma ilustração de fundo, mesmo ampliada e sobreposta ao piso.
- Decisão: manter intactos sprites, animações, atributos e comportamento dos
  inimigos; remover as colocações de panorama do mapa jogável e compor o ambiente
  com tiles de rocha pixel art e elementos locais da mina.
- Os PNGs panorâmicos permanecem registrados como referências artísticas e
  imagens de resumo em "Selecionar Fase". Menu, seletor, geometria, colisões,
  missões, progressão e transições ficam fora da alteração.
- SPEC atualizada antes do novo código em
  `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md`; novo registro
  integral do prompt em `prompts/78-etapa-9-18-revisao-artistica-minas.md`.
- Implementação e validações: pendentes.
- Aprovação visual: pendente de nova avaliação humana; não inferir aprovação
  a partir de testes automatizados.
- Implementação revisada:
  - os cinco panoramas jogáveis foram removidos de
    `createMinasCorrompidasDecorations`;
  - adicionados atlases locais 32×32 de rocha Abandonada e Corrompida;
  - paredes e pilares das duas variantes usam os novos atlases;
  - os PNGs panorâmicos permanecem apenas como recursos de resumo no seletor;
  - os adversários aprovados no commit `746d829` não foram alterados;
  - a geometria, colisões, missão, progressão e transições não foram alteradas.
- Validações: testes dirigidos aprovados (18); `npm run build` aprovado;
  `npm run check:gates` aprovado; suíte completa aprovada (100 suítes,
  1.227 testes); `git diff --check` aprovado.
- Homologação humana visual continua pendente. Nenhuma aprovação foi declarada
  automaticamente.
