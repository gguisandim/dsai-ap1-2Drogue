# Auditoria técnica e plano de modernização de fases e menu

**Data:** 2026-11-16  
**Estado:** especificação de auditoria e planejamento, sem alteração
comportamental  
**Escopo:** inventário das fases e do menu existentes, registro de problemas
comprovados e sequência incremental para modernização futura.

## Decisão e limites

O documento de auditoria descreve o estado observado em `main` e propõe uma
ordem de trabalho; não promove fases, muda elegibilidade, altera campanhas,
saves, progressão, cenas, assets ou o formato legado `LevelDefinition`.

A fonte de verdade continua sendo:

- os dados legados em `src/data/`;
- os contratos exportados por `src/stages/index.ts`;
- `CAMPAIGN_CHAPTER_CATALOG`, os adaptadores legados e o `StageCatalogService`;
- os fluxos existentes de `GameSessionService`, campaign routers e binders;
- os testes e evidências de execução, separados por nível de verificação.

Fases novas devem continuar usando `StageModule`, capítulos existentes,
capabilities suportadas, `stage-plan.json`, a CLI e os validadores atuais.
Catálogos, routers, saves ou motores paralelos não serão introduzidos.

## Critérios observáveis

1. `docs/auditoria-fases-menu.md` identifica individualmente todas as fases
   legadas e autorais registradas, com IDs, fontes, geometria/geração,
   elegibilidade, conteúdo jogável, transições, problemas e testes relevantes.
2. A auditoria distingue a lista de compatibilidade legada, o catálogo de
   capítulos de campanha, o catálogo dinâmico do runtime e a geração procedural
   antiga.
3. O fluxo do menu é descrito a partir das cenas e do `GameSessionService`, e
   suas contagens e disponibilidade refletem uma consulta real do serviço, não
   uma inferência dos testes.
4. `PASS` de loader/playtest estático não é apresentado como homologação Phaser;
   verificações não executadas ou inconclusivas permanecem `UNKNOWN`.
5. O plano preserva IDs, `LevelDefinition`, elegibilidade atual, chaves de save,
   progressão e o fluxo macro existente até que uma SPEC comportamental
   específica autorize uma mudança.
6. A entrega documental passa `npm run check:gates` e `git diff --check`.
   Quando solicitado como parte da auditoria, build e testes existentes também
   são executados e relatados, sem corrigir problemas de runtime fora do escopo.

## Evidências requeridas

- Branch base, estado do worktree, branches remotas e janela dos 20 commits mais
  recentes.
- Registro e catálogo reais, com quantidade por elegibilidade e disponibilidade
  dos modos.
- Resolução via `StageLoader` e playtest estático das fases autorais; avisos
  conhecidos dos adaptadores legados.
- Cobertura existente de compatibilidade, campanhas, menu, capítulos,
  planejamento e playtest.
- Homologação de browser só conta como evidência se uma execução Phaser real
  produzir um relatório válido. Ausência de execução não pode ser substituída
  por aprovação de teste headless.

## Sequência proposta para uma etapa comportamental futura

1. Congelar por testes IDs, referências, mapa, progressão, persistência e fluxo
   de menu atuais; inventariar resultados Phaser para as fases que serão
   alteradas.
2. Tratar os problemas legados comprovados em SPECs pequenas e por fase
   (posicionamentos inválidos, semântica de ondas e objetivos ausentes),
   mantendo o adaptador e os dados reconhecidos até a correção estar validada.
3. Migrar conteúdo legado em incrementos pequenos para os contratos de fase
   existentes, reutilizando a definição de mapa e o ID estável. Durante a
   promoção, evitar registro duplicado entre `ALL_LEVELS` e o capítulo, usando
   o mecanismo de compatibilidade já existente. Começar com uma fase piloto e
   manter `individual-only` até a narrativa, o encontro e as saídas serem
   comprovados.
4. Modernizar a seleção do menu sobre `GameSessionService` e
   `StageCatalogService`: comunicar indisponibilidade, agrupar conteúdo de modo
   compreensível e só expor seleção de variantes se ela usar a opção de loader
   já existente. Não mover validação nem composição para cenas Phaser.
5. Promover fases a candidatas ou marcos somente quando a composição real
   satisfizer quantidade, atos/beats, destinos físicos e restrições da política.
   Não criar conteúdo fictício para habilitar o modo aleatório/personalizado.
6. Integrar novas fases ao fluxo macro por bindings e IDs existentes, sem
   reordenar nós persistidos ou alterar chaves de save. Qualquer migração de
   topologia, identidade ou save exige SPEC própria, compatibilidade versionada
   e testes de restauração.
7. Validar cada fase com plano, loader, playtest e homologação Phaser; validar a
   campanha com transições reais, retomada, save, recursos e isolamento. Somente
   então atualizar catálogo, estado do menu e documentação pública.

## Validações desta etapa

Além dos gates documentais, a solicitação exige executar as verificações
disponíveis que não dependam de mudanças destrutivas. Build e testes completos
podem ser usados como regressão, mas não alteram a decisão de que evidência
headless não prova jogabilidade real.
