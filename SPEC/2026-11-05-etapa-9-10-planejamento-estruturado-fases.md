# Etapa 9.10 — Planejamento estruturado de fases

## Contexto e decisão

A Etapa 9.9 tornou consultáveis as capabilities, os recursos e os limites de
autoria. Falta um artefato que permita a um agente externo declarar a intenção
da fase antes de escrever `StageModule`, reduzindo divergências entre geometria,
narrativa, encontros e transições.

Esta etapa introduz `stage-plan.json`, um documento de autoria versionado e
tipado. Ele **não** é um formato de execução: `StageModule`, `StageManifest` e
`ChapterManifest` continuam sendo a fonte de verdade do runtime. Nenhum capítulo
existente passa a depender do plano.

A inspiração é o planejamento estruturado em narrativa, cenário e mecânicas,
sem agentes internos, orquestração multiagente, RAG, banco vetorial ou MCP.

## Formato

O arquivo fica ao lado do capítulo, em
`src/examples/chapters/<slug>/stage-plan.json`, e declara:

- identidade (`id`, `stageId` opcional), título, resumo e direção visual;
- progressão espacial `linear` ou `branched`;
- regiões com `role` (`start`, `exploration`, `combat`, `objective` ou `exit`) e
  conexões estáveis;
- região inicial, regiões de saída e condições de desbloqueio por objetivo;
- objetivos com `dependsOn` e `unlocksExitIds` opcionais;
- encontros com arquétipos e regiões;
- interações com tipo e referência local;
- requisitos de capability no mesmo formato do `StageManifest`.

O schema é `umbra.stage-plan`, `schemaVersion: 1`. A organização conceitual
narrativa/cenário/mecânica é expressa pelos campos, sem aninhamento profundo.

## CLI

A CLI existente ganha apenas:

```sh
npm run chapter -- plan validate <slug>
npm run chapter -- plan validate <slug> --json
```

O comando resolve o capítulo pelo mesmo `resolveChapterDir` de `validate` e
`inspect`, lê `stage-plan.json` com o mesmo `ChapterFileSystem`, valida e imprime
um relatório. `--json` produz somente o documento estável do relatório. Não há
segunda CLI nem carregamento de `StageModule`.

## Validação

O validador é determinístico e usa busca em largura para conectividade e DFS
para ciclos de objetivos. Verifica:

- estrutura, IDs estáveis, campos obrigatórios e duplicidade;
- conexões para regiões inexistentes e regiões desconectadas da inicial;
- região inicial e regiões de saída existentes e com papel coerente;
- dependências de objetivos inexistentes, autorreferentes e ciclos;
- encontros com regiões e arquétipos suportados;
- interações com regiões existentes e referências locais marcadas para
  verificação no capítulo;
- condições de saída para todas as regiões de saída, referenciando objetivos
  existentes e coerentes com `unlocksExitIds`;
- requisitos de capability usando a mesma função do `StageValidator`;
- tema global quando conhecido; tema ou referência local não enumerável gera
  warning/info, nunca erro por ausência no catálogo global.

Diagnósticos usam `code`, `severity`, `path`, `referenceId` e origem `plan`,
seguindo o formato da CLI. Erros retornam código 1; avisos e infos não bloqueiam.

## Exemplo

`src/examples/chapters/igapo-das-memorias/stage-plan.json` descreve a travessia
ribeirinha, a área inundada, o combate, o vestígio e a saída, reutilizando
`stage.aguas.igapo-das-memorias`, `npc.aguas.igapo.memory-vestige`,
`mission.aguas.igapo.trace-corruption`,
`exit.aguas.igapo.enter-corrupted-heart`, `encounter.stage.aguas.igapo-das-memorias`,
`theme.aguas.igapo` e os arquétipos reais. A implementação jogável do Igapó não
é alterada.

## Compatibilidade

- Nenhum contrato de runtime, save, campanha, World Lab ou chave de
  armazenamento muda.
- `capabilities` continua produzindo o mesmo documento.
- O plano não é lido por `StageLoader`, `StageRegistry` ou `GameScene`.
- Capítulos sem plano continuam válidos.

## Critérios observáveis e testes

1. `plan validate` aceita o exemplo do Igapó e retorna 0.
2. `plan validate --json` é JSON puro, determinístico e com contagens.
3. Plano com região desconectada, objetivo inexistente, ciclo de objetivos,
   capability desconhecida ou condição de saída inconsistente falha com código 1
   e diagnóstico específico.
4. Referência local/dinâmica gera warning ou info, não erro.
5. Plano ausente ou JSON inválido retorna diagnóstico claro.
6. `capabilities` e os comandos existentes não regridem.
7. Testes, gates, build e `git diff --check` passam.

## Validação final

- testes direcionados de planejamento e CLI;
- `npm run check:gates`;
- `npm run build`;
- `npm test -- --runInBand`;
- `git diff --check`.

## Limitações

A verificação espacial é lógica, não física. O plano não gera geometria, não
executa Phaser e não substitui a validação de mapa, colisões, encontros ou
narrativa feita por `StageLoader`, `ResolvedLevelValidator` e `StageDirector`.
Referências locais continuam precisando de verificação no capítulo real.
