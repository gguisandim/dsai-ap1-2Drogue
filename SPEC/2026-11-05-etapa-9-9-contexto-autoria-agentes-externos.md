# Etapa 9.9 — Contexto de autoria para agentes externos

## Contexto e decisão

As etapas 9.5 e 9.7 consolidaram capabilities de runtime, validação de capítulos
e a CLI `npm run chapter`. Um agente externo ainda precisava ler o motor para
descobrir quais tiles, arquétipos, itens, condições, comandos, eventos,
encontros, transições e recursos visuais realmente funcionam.

Esta etapa adiciona uma projeção somente de leitura do conhecimento já
existente. Não cria catálogo paralelo, registry novo, editor, RAG, banco
vetorial, servidor MCP ou chamada a LLM. O comando consulta os contratos e as
constantes que o runtime já usa para validar conteúdo.

A SPEC vigente de capabilities continua sendo a Etapa 9.5. Esta etapa apenas
amplia a superfície de consulta e documentação; não altera as regras de
compatibilidade, saves, campanhas, World Lab ou carregamento.

## Catálogo de capacidades

A CLI passa a aceitar:

```sh
npm run chapter -- capabilities
npm run chapter -- capabilities --json
```

O comando:

- não exige slug de capítulo nem diretório de autoria;
- não executa Phaser, loader ou validação de capítulo;
- devolve código 0 em sucesso e 2 em uso inválido;
- lê o perfil `DEFAULT_STAGE_RUNTIME_CAPABILITIES`;
- deriva tiles, arquétipos, itens, biomas, temas, efeitos, eventos de áudio,
  waveforms, condições, status de missão, sinais, comandos, recompensas,
  filtros, encontros, âncoras, tipos de layout, presets procedurais e limites
  declarados a partir das constantes e contratos públicos existentes.

Cada valor publicado referencia uma constante real. Listas que não existem como
constante de runtime passam a existir em um único módulo de vocabulário usado
também pelos validadores, evitando uma segunda fonte de verdade. Uniões
fechadas são cobertas por verificação de exaustividade no teste.

### Estrutura JSON

O JSON possui `schemaVersion: 1`, `kind: "umbra.stage-authoring.capabilities"`,
`revision`, `runtimeProfile`, `authoring`, `dynamicResources`, `rules`,
`limitations` e `discovery`. Todas as coleções têm ordem determinística.

- `runtimeProfile.capabilities` reproduz o perfil real ordenado por `id`.
- `authoring` agrupa recursos por preocupação de autoria: geometria, inimigos,
  itens, narrativa, encontros, transições e apresentação.
- `dynamicResources` registra recursos cujo ID é declarado pelo capítulo
  (texturas, tilesets, temas visuais, decorações, sprites, sons, perfis de áudio
  e ambientes). O comando não presume que existam globalmente.
- `rules` declara as severidades observáveis da validação de capabilities.
- `limitations` declara o que não pode ser descoberto automaticamente, incluindo
  capabilities `planned` e ausência de execução Phaser.
- `discovery` separa o que é automático, dinâmico e indisponível.

## Documentação de autoria

`docs/stage-authoring.md` documenta o caminho completo: criação pela CLI,
consulta de capabilities, geometria, narrativa, gameplay, apresentação,
validação, preview, arquivos editáveis, contratos preservados e erros comuns.
Os exemplos usam IDs e comandos reais do repositório.

`AGENTS.md` recebe uma orientação curta para agentes externos consultarem o
catálogo e a documentação antes de criar conteúdo.

## Compatibilidade

- Nenhum capítulo, save, chave de armazenamento, catálogo ou comportamento de
  campanha muda.
- `DEFAULT_STAGE_RUNTIME_CAPABILITIES` mantém IDs, categorias, versões e status.
- As constantes públicas `STAGE_LOGICAL_TILE_IDS` e `STAGE_ENEMY_ARCHETYPES`
  continuam exportadas pelo mesmo caminho.
- O comando `capabilities` é aditivo; `create`, `validate`, `inspect` e
  `preview` mantêm seu comportamento e códigos de saída.

## Critérios observáveis e testes

1. `npm run chapter -- capabilities` imprime um relatório legível com contagens,
   grupos de recursos e limitações.
2. `npm run chapter -- capabilities --json` imprime JSON válido, sem texto
   adicional, com schema, IDs estáveis e ordem determinística.
3. Duas execuções produzem exatamente o mesmo objeto.
4. Todo item publicado em `runtimeProfile.capabilities` coincide com o perfil
   real, e todo recurso derivado (tile, inimigo, item, bioma, tema) referencia um
   ID existente nesse perfil.
5. Capabilities `planned` aparecem com status `planned` e limitação
   correspondente; não são apresentadas como suportadas.
6. Os itens usados pelos capítulos de produção têm capability `supported`.
7. O catálogo de produção continua registrando e validando sem erros.
8. Uso inválido (`capabilities --json` com argumento posicional, opção
   desconhecida) retorna código 2 e diagnóstico `usage.*`.
9. A suíte existente de CLI, stages, campanha e World Lab não regride.

## Validação final

- testes direcionados `src/tests/chapterCapabilities.test.ts`;
- `npm test -- --runInBand`;
- `npm run build` (inclui typecheck);
- `npm run check:gates`;
- `git diff --check`.

## Limitações

O catálogo descreve contratos estáticos. Ele não abre o jogo, não confirma que
uma `textureKey` existe no Phaser e não enumera recursos visuais de capítulos
sem carregá-los. A promoção de `src/examples/chapters/` para
`src/stages/chapters/` continua manual.
