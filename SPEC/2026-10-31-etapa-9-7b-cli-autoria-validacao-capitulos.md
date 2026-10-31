# Etapa 9.7B — CLI de criação, validação e inspeção de capítulos

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.7A. Não inicia a 9.7C, não cria um novo
sistema de capítulos, registry, validador, compositor ou formato de manifesto.

## Objetivo

Oferecer uma CLI local para automatizar o fluxo já comprovado na 9.7A:

`Template → criar → personalizar → validar → inspecionar → preparar preview`

A ferramenta reutiliza `src/examples/chapter-template/`, `createChapterTemplate`,
`StageValidator`, `StageRegistry`, `StageCatalogService`, `StageLoader`,
`StageDirector`, `GameSessionService` e `WorldLabDataService`. O catálogo de
produção permanece intacto.

## Arquitetura

```text
src/cli/chapter-cli.ts          entrada executável
src/cli/chapter/
  args.ts                       parsing e ajuda
  names.ts                      slugs, namespaces e paths autorizados
  fs.ts                         porta de filesystem + implementação Node
  generator.ts                  cópia do template, reescrita de imports e criação atômica
  loader.ts                     carregamento do index.ts gerado
  validation.ts                 pipeline real de validação e normalização de diagnósticos
  inspect.ts                    projeção resumida do capítulo
  preview.ts                    modo individual + projeção headless no World Lab
  render.ts                     formatação humana e JSON
  run.ts                        despacho dos comandos e códigos de saída
  types.ts / errors.ts          contratos internos e falhas esperadas
tsconfig.cli.json               CommonJS apenas para ts-node
```

O `package.json` expõe:

```json
"chapter": "ts-node --project tsconfig.cli.json src/cli/chapter-cli.ts"
```

Assim, `npm run chapter -- <comando>` funciona sem novas dependências. O
`ts-node` já era dependência de desenvolvimento do projeto.

## Comandos

```text
npm run chapter -- create <slug> [--title <texto>] [--namespace <id>] [--revision <n>]
npm run chapter -- validate <slug>
npm run chapter -- inspect <slug> [--json]
npm run chapter -- preview <slug>
```

`--chapters-dir <path>` é aceito por todos os comandos e precisa estar dentro de
`src/`. O padrão é `src/examples/chapters/`.

Códigos de saída:

- `0`: sucesso; `validate` com apenas avisos também retorna `0`;
- `1`: falha de validação, operação, registro, colisão ou capítulo ausente;
- `2`: uso inválido, nome inválido, revisão inválida ou diretório não autorizado.

## Diretório dos capítulos gerados

Capítulos gerados ficam em `src/examples/chapters/<slug>/`.

A decisão considera os gates reais: módulos sob `src/stages/chapters/<id>/` só
podem importar o próprio capítulo, `src/stages/contracts/` e
`src/narrative/contracts/`; eles não podem conter um `registration.ts` que
importe `registerCampaignChapters` nem importar `LevelDefinition` de
`src/data/`. O template da 9.7A usa os índices públicos e um registro local.
Para preservar o template, o gate e a independência do capítulo, a CLI gera
capítulos de autoria em `src/examples/chapters/`, fora do catálogo de produção.
A promoção para `src/stages/chapters/` com imports somente de contratos e
registro central é uma decisão explícita para a 9.7C.

## `create`

1. Valida o slug, o namespace e a revisão.
2. Deriva o namespace padrão `authoring.<slug-com-pontos>`.
3. Verifica diretório existente, IDs reservados pelo template/catálogo de
   produção e namespaces já usados por capítulos gerados.
4. Cria a instância em memória com `createChapterTemplate` e roda o pipeline
   real de validação antes de tocar no filesystem.
5. Copia os arquivos TypeScript do template e reescreve somente os imports
   externos `../../*` para o prefixo relativo correto até `src/`.
6. Substitui apenas a linha âncora
   `export const CHAPTER_TEMPLATE = createChapterTemplate('example.beacon');`
   pela chamada com namespace, revisão, título, título da fase e resumo.
7. Gera um `README.md` específico do capítulo e copia o guia do template como
   `AUTHORING.md`.
8. Escreve em um diretório temporário irmão do destino, carrega o `index.ts`
   gerado e roda novamente o pipeline real.
9. Só então renomeia o temporário para `<slug>`.
10. Em qualquer falha, remove apenas o temporário criado pela CLI; o destino
    nunca é sobrescrito ou apagado.

O capítulo gerado contém: `ids.ts`, `level.ts`, `presentation.ts`,
`encounter.ts`, `narrative.ts`, `stage.ts`, `chapter.ts`, `registration.ts`,
`template.ts`, `index.ts`, `README.md` e `AUTHORING.md`.

## `validate`

O pipeline é único e reutilizado por `create`, `inspect` e `preview`:

1. `registerCampaignChapters(registry, [entry])` — registro e validação de
   catálogo/capabilities/dependências;
2. `registry.validate()` — `StageValidator` sobre capítulo, fases, grafo,
   apresentação e capabilities;
3. `StageCatalogService.create(registry)` — elegibilidade, loadability,
   diagnósticos de catálogo;
4. `StageLoader.load` — mapa resolvido, encontros, apresentação, revisões e
   referências;
5. `StageDirector.create` — NPCs, diálogos, missões, eventos, comandos e
   condições narrativas.

Os diagnósticos são normalizados com código, severidade, origem, componente,
caminho, `stageId`, `chapterId` e `referenceId`, e deduplicados por
código/caminho/mensagem preservando a maior severidade.

`validate` imprime erros e avisos, distingue os bloqueantes e retorna `1` se
houver erro. Avisos não bloqueiam. O comando não declara uma fase visualmente
jogável: a linha final informa que os assets Phaser não foram executados.

## `inspect`

Reutiliza o mesmo pipeline e as projeções do catálogo. Apresenta:

- ID, título, revisão, quantidade e IDs das fases;
- regiões, biomas, capabilities e dependências;
- NPCs, diálogos, missões e eventos;
- encontro, ondas, arquétipos e contagem de inimigos;
- tema, tileset, sprites, áudio e ambiente;
- entradas e saídas;
- elegibilidade de campanha e disponibilidade individual;
- diagnósticos e `phaserAssets: "not-executed"`.

`--json` emite os mesmos dados e códigos. Não há outro banco de metadados.

## `preview`

1. Roda `validate`; com erros, retorna `1` e não afirma preview.
2. Cria um registry isolado e usa `GameSessionService.startIndividualStage`
   para carregar a fase.
3. Cria um registry com estágios legados e o capítulo, gera o grafo de fixture
   do World Lab e projeta o capítulo com `WorldLabDataService`.
4. Imprime o resultado headless, os diagnósticos do World Lab e a instrução de
   acesso.
5. Declara explicitamente `Phaser rendering: not executed` e não inventa URL nem
   sucesso visual.

## Segurança de filesystem

- slug: letras minúsculas, dígitos e hífens simples; sem separadores, `..` ou
  path absoluto;
- namespace: minúsculas, dígitos e separadores simples; sem separadores de
  path;
- `chaptersRoot` e o diretório final precisam estar dentro de `src/`;
- o destino existente nunca é sobrescrito;
- IDs do template e do catálogo de produção são reservados;
- namespaces de capítulos gerados são detectados lendo apenas o `index.ts`, sem
  executar código;
- criação atômica via temporário + rename;
- limpeza apenas do temporário criado pela própria CLI;
- nenhum comando arbitrário é executado a partir de metadados de conteúdo.

## Registro

A CLI **não** altera `CAMPAIGN_CHAPTER_CATALOG`. Cada capítulo gerado contém
`registration.ts` com `CHAPTER_ENTRY`, `registerChapterTemplate` e
`createChapterTemplateRegistry`, usando o ponto de extensão público existente.
O catálogo de produção continua explícito. A promoção para produção exige uma
entrada explícita ou um bootstrap futuro; não há descoberta por filesystem.

## Testes

`src/tests/chapterCli.test.ts` cobre:

- parsing e ajuda;
- create/validate/inspect/preview de um capítulo real;
- segunda cópia com outro namespace e revisão;
- coexistência em um registry com os dois capítulos;
- execução do fluxo narrativo completo no capítulo gerado;
- catálogo de produção inalterado;
- nome inválido, path traversal, raiz não autorizada, diretório existente,
  namespace reservado e revisão inválida;
- capítulo ausente e `index.ts` malformado;
- falha parcial de escrita com limpeza do temporário;
- mutações controladas: capability indisponível, dependência ausente, encontro
  vazio, revisão inválida, tema ausente, âncora de saída inválida, referência
  narrativa inválida e ID duplicado;
- aviso não bloqueante (`level.spawn.multiple`).

A prova de independência usa o capítulo gerado pela CLI, registra-o em ambiente
isolado, descobre pelo catálogo, carrega pelo `StageLoader`, executa a sequência
NPC → diálogo → missão → encontro → recompensa → saída → conclusão e confirma
que o catálogo de produção não mudou.

## Limitações

- os capítulos gerados ficam em `src/examples/chapters/`, não em
  `src/stages/chapters/`;
- não há editor visual, plugins, descoberta automática, carregamento remoto ou
  marketplace;
- o preview é headless; não renderiza Phaser nem abre navegador;
- a promoção para o catálogo de produção continua manual;
- a validação de assets verifica as declarações e o pipeline existente, não o
  carregamento visual do Phaser.

## Pendências para a 9.7C

- decidir o fluxo de promoção de `src/examples/chapters/` para
  `src/stages/chapters/`;
- definir registro de produção (entrada explícita ou descoberta controlada);
- preview visual real no navegador;
- eventual editor ou CLI interativa;
- manter os mesmos validadores e o mesmo formato de capítulo.

## Critérios observáveis

1. `npm run chapter -- create` gera um capítulo válido sem alterar o motor.
2. `validate` retorna `1` para erros e `0` para sucesso/avisos.
3. `inspect` expõe IDs, fases, encontros, apresentação e elegibilidade.
4. `preview` carrega no modo individual e projeta no World Lab, sem renderizar.
5. Dois capítulos com namespaces diferentes coexistem sem conflito.
6. O catálogo de produção permanece idêntico.
7. Path traversal, sobrescrita e raízes não autorizadas são recusados.
8. Falha parcial não deixa capítulo parcial no destino.
9. O fluxo narrativo completo funciona no capítulo gerado.
10. Suíte completa, typecheck, build, gates e `git diff --check` aprovados.
