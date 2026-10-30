# Etapa 9.5 — Contratos de autoria independente, capabilities e compatibilidade

## Contexto e decisão

As etapas 8.1–8.4 consolidaram grafo, geração, saídas físicas e binding
canônico. As etapas 9.3B–9.4D consolidaram conteúdo narrativo declarativo,
execução, sinais de gameplay, recompensas, conclusão e o acesso narrativo às
transições. Ainda faltava uma fronteira de autoria que dissesse, antes do
carregamento, se um capítulo depende apenas de recursos que o runtime realmente
executa.

Esta etapa amplia os contratos existentes. Não cria registry, loader, linguagem
de condição ou sistema de plugins paralelo. O `StageValidator` continua sendo a
fronteira de compatibilidade de fases, o `StageLoader` continua sendo a
fronteira de carregamento, e o catálogo de capítulos recebe validação própria
antes de registrar ou projetar bindings sobre a campanha macro.

## Contrato de capabilities

`ChapterManifest` e `StageManifest` podem declarar `capabilities`. Cada
requisito possui `id` estável, categoria estável, `minimumVersion` inteiro
positivo e necessidade `required` ou `optional`.

O perfil do runtime é versionado separadamente e associa o mesmo ID e categoria
a uma versão e a um estado `supported` ou `planned`. A ausência de declarações
continua válida para conteúdo legado. Requisitos obrigatórios planejados ou com
versão insuficiente são erros; requisitos opcionais nessas condições são
warnings; IDs desconhecidos e conflitos de categoria são erros, pois não há
semântica verificável para um fallback.

As categorias públicas são: tiles, temas, biomas, inimigos, itens, áudio,
iluminação, efeitos, NPCs, interações, narrativa e navegação.

### Suporte real nesta etapa

O perfil padrão só marca como `supported` recursos executados pelos caminhos
atuais:

- tiles numéricos `0..9` e mapas autorais;
- biomas aceitos pelo gerador procedural existente;
- arquétipos explícitos `affinity`, `applaud`, `fortitudo`, `ranged`, `boss` e
  `miniboss`;
- itens explícitos `key`, `potion`, `health_herb` e `mana_shard`;
- interação com NPC, diálogos, missões, eventos e condições narrativas;
- saídas físicas e geração procedural determinística.

Temas visuais, música por fase, iluminação/névoa e decoração/efeitos são
catalogados como `planned`: os campos existem em `LevelDefinition`, mas a
`GameScene` não os consome como pontos de extensão autorais. A Etapa 9.5B poderá
promovê-los a `supported` somente depois de implementar adapters e catálogos
reais.

Além das declarações, mapas autorais são inspecionados para impedir os fallbacks
silenciosos já existentes em inimigos e itens. Tiles fora do intervalo público,
arquétipos não reconhecidos e tipos de item sem mapeamento explícito impedem o
load. Fases `legacy` continuam cobertas por seus adapters e caracterizações.

## Dependências entre capítulos

`ChapterManifest.dependencies` declara `chapterId`, `minimumRevision` e, quando
aplicável, `optional`. Dependências repetidas, autorreferentes, ausentes ou com
revisão insuficiente geram diagnósticos tipados. Uma saída para uma fase de
outro capítulo requer dependência obrigatória explícita. A Rota das Águas
declara sua dependência temporária de `legacy.verse` enquanto o hub ainda usa o
mapa legado.

## Condições de saída

`StageExitDefinition.condition` continua usando exclusivamente
`StageCondition`. O validador verifica discriminante, profundidade, operandos,
listas compostas não vazias e referências locais de flags e missões. O path do
diagnóstico inclui o índice e o ID da saída. Condições de NPCs, escolhas e
eventos passam pela mesma validação estrutural.

Em execução, `StageDirector` permanece o avaliador, e
`CampaignNarrativeAccessBinder` continua projetando somente arestas e saídas
cujas condições foram satisfeitas. O roteador não recebe permissão para uma
transição bloqueada; nenhuma segunda linguagem ou avaliação divergente é
introduzida.

## Revisões e saves

A revisão da fase permanece `manifestRevision`. A identidade narrativa ganha
`chapterRevision` opcional por compatibilidade binária:

- saves novos criados pela composição informam a revisão do capítulo;
- revisão de capítulo presente e diferente da esperada produz
  `identity-mismatch` com diagnóstico específico;
- saves v1 antigos sem o campo continuam restauráveis quando os demais campos
  coincidem;
- `StageResumeState` também aceita o campo opcional e o `StageLoader` o compara
  quando presente;
- uma falha de revisão não escreve, migra ou apaga bytes antigos.

O campo não altera o prefixo persistente existente e não constitui um framework
de migração. Compatibilidade sem `chapterRevision` é uma concessão explícita ao
formato v1; uma evolução futura poderá tornar o campo obrigatório por uma nova
versão de envelope.

## Catálogo e campanha macro

O validador do catálogo verifica deterministicamente capítulos, módulos,
dependências, IDs de região únicos, existência da região na definição macro,
pertencimento e revisão da fase vinculada, referências de diálogo/evento e
compatibilidade de carregamento.

Bindings inválidos ou duplicados não são mais ignorados: registro e projeção
falham com erro tipado. Regiões sem binding que já são `planned` permanecem
válidas e não ganham conteúdo por fallback.

`UmbraCampaignSkeleton` ainda fixa as rotas, regiões, milestones e camadas. O
`UmbraCampaignRouteSlice` ainda fixa o hub legado, templates, conexões e limites
de saídas. Generalizar essa topologia está fora da 9.5 e deve ocorrer depois da
9.5B, sem misturar extensão de renderer com autoria da campanha macro.

## Diagnósticos e determinismo

Diagnósticos de stage preservam `code`, `severity`, `path`, `stageId` e
`referenceId`. Diagnósticos do catálogo preservam o mesmo padrão de severidade
e referência. Todas as coleções são ordenadas por chave estável antes de serem
expostas. Conteúdo com qualquer erro de compatibilidade não é carregável.

## Critérios observáveis e testes

1. Capítulo e fase legados válidos continuam registrando e carregando.
2. Capabilities suportadas são aceitas; obrigatórias indisponíveis e IDs
   desconhecidos falham; opcionais planejadas produzem warning.
3. Tile, inimigo e item sem suporte explícito impedem o load autoral.
4. Dependências e referências cruzadas inválidas produzem diagnóstico estável.
5. Condição de saída válida carrega e a inválida falha antes da execução.
6. A integração 9.4D mantém uma saída fechada até a condição narrativa ser
   satisfeita.
7. Binding inexistente ou duplicado falha; regiões `planned` sem binding
   permanecem válidas e não jogáveis.
8. Saves com revisão atual restauram; revisão de capítulo divergente falha sem
   escrita; saves v1 sem o campo novo continuam restaurando.
9. Duas validações do mesmo conteúdo produzem diagnósticos idênticos.
10. Testes 9.4A–D, campanha, narrativa, persistência, procedural e World Lab não
    regridem.

## Validação final

- testes direcionados da Etapa 9.5;
- testes de campanha, narrativa, persistência e catálogo;
- `npm test -- --runInBand`;
- `npm run typecheck`;
- `npm run build`;
- `npm run check:gates`;
- `git diff --check`.

## Limitações

Esta entrega não fornece assets, factories, carregamento remoto, CLI, editor ou
plugins. Capabilities `planned` são somente diagnósticos verificáveis. A
homologação visual real da Etapa 9.4D continua limitada pela injeção de teclado
do host de automação e não é usada como evidência para promover suporte visual.
