# Palácio do Credor — fase final autoral

Data: 2026-11-21
Parte: encerramento narrativo da campanha principal
Substitui: nada. Complementa `2026-10-27-arquitetura-campanha-modular.md`,
`2026-11-12-refinamento-agressivo-jardins-flores-veladas.md` e
`2026-10-31-etapa-9-7c-registro-execucao-visual-assets.md` para uma fase nova.

## Objetivo

Entregar o **Palácio do Credor** como fase final jogável, panorâmica e autoral,
reutilizando os contratos públicos de `src/stages/contracts/`, o pipeline de
apresentação, o encontro declarativo, o runtime narrativo e o modo individual.
A fase implementa a direção narrativa **O Último Pacto** e prepara a integração
futura ao fluxo de campanha sem declarar concluídos os marcos ainda planejados.

## Identidade estável

| Campo | Valor |
|---|---|
| Capítulo | `chapter.final.palacio-do-credor` |
| Fase | `stage.final.palacio-do-credor` |
| Saída | `exit.final.palacio-do-credor.complete` |
| Região macro preservada | `final.palacio-do-credor` |
| Destino terminal | `campaign.complete` |
| Diretório | `src/stages/chapters/palacio-do-credor/` |

O capítulo entra em `CAMPAIGN_CHAPTER_CATALOG` e aparece em **Jogar Fase**. O
`UMBRA_CAMPAIGN_SKELETON` não é reescrito: `final.palacio-do-credor` continua
com seu requisito canônico (`milestone.corrupted.primary`) e conteúdo planejado
até uma SPEC posterior oficializar a nova sequência de campanha.

## Narrativa

O Palácio do Credor nasce onde a floresta, o rio e o território convergem. Foi
uma casa de registros e pactos recíprocos; a corrupção converteu reciprocidade
em extração. O Credor é o último auditor desses pactos: um corpo oco que mede
vida como dívida.

Personagens e vestígios:

- **Aruã, Escriba do Último Livro** (`npc.final.palacio.arua`): NPC de história
  na Câmara de Revelação. Explica a origem do Palácio e oferece uma decisão.
- **Eco do Último Pacto** (`npc.final.palacio.eco`): vestígio ambiental nos
  Jardins Externos; contextualiza a dívida sem exposição longa.

Escolha narrativa em Aruã:

- `choice.final.palacio.recusar` grava `flag.final.palacio.pacto-recusado=true`;
- `choice.final.palacio.aceitar` grava `flag.final.palacio.pacto-aceito=true`.

O epílogo tem duas variantes condicionadas por essas flags. A jogabilidade do
confronto e a saída permanecem as mesmas; a consequência é narrativa e
persistente.

Fluxo observável:

1. ao entrar, a missão começa e um diálogo de aproximação é exibido;
2. o Eco é opcional e não bloqueia a saída;
3. falar com Aruã cumpre objetivo e permite a escolha;
4. o encontro é vencido por combate real;
5. a vitória grava `flag.final.palacio.credor-derrotado=true`, inicia o epílogo
   correspondente, desbloqueia a saída e conclui a fase;
6. a saída física usa `exit.final.palacio-do-credor.complete`; um evento de
   `stage.exit.requested` registra `stage.complete`, e o destino terminal é
   `campaign.complete`.

## Mapa e regiões

Mapa autoral contínuo em `palacioDoCredorMap.ts`, sem salas isoladas por
teletransporte. Oito regiões lógicas:

| Região | Papel |
|---|---|
| `region.final.palacio.aproximacao` | floresta degradada e spawn |
| `region.final.palacio.entrada` | portal monumental e primeiro combate |
| `region.final.palacio.jardins-externos` | estruturas abandonadas e Eco |
| `region.final.palacio.galerias` | corredores, pátios e pilares |
| `region.final.palacio.camara-revelacao` | Aruã e a origem do Credor |
| `region.final.palacio.antessala` | preparação e último aviso |
| `region.final.palacio.arena` | confronto com o Credor |
| `region.final.palacio.resolucao` | epílogo e saída |

O percurso é contínuo, com clareiras orgânicas, pátios internos, pilares,
caminhos alternativos curtos e marcos visuais. A borda permanece fechada e o
corpo real do jogador (`29 × 39` px) alcança spawn, NPCs, ondas e saída.

## Direção de arte híbrida

- **Pixel art:** piso autoral em SVG (quatro frames 32×32) e acentos do tileset
  Puny para parede, pilar, água e saída.
- **SVG autoral:** portal, torre, arcada, trono, estandarte, estátua, corrente,
  selo, livro, vitral, copa e massa de raízes; variantes corrompidas próprias.
- **PNG autoral:** folha do chefe Credor gerada deterministicamente por
  `scripts/generate-palacio-assets.mjs` (4×3 quadros 128×114, ordem
  caminhada/ataque/dano), com origem e hash registrados.
- **Phaser:** camadas, névoa, partículas, pulso, luz local e áudio sintetizado
  declarados na apresentação.

Nenhum recurso é apresentado como arte final sem arquivo real. A origem de cada
arquivo fica em `src/assets/palacio/README.md` e no catálogo de assets.

## Duas apresentações

- **Decadência** (padrão): pedra fria, ouro gasto, vegetação retorcida, luz
  residual.
- **Corrompido:** piso próprio, portal/torre/arcada/trono/selo substituídos por
  silhuetas corrompidas, massas de raízes, névoa densa, esporos, áudio opressor.

As variantes usam `presentationVariants` e alteram somente apresentação. Mapa,
colisões, NPCs, diálogos, missões, encontros e saídas são idênticos. A seleção é
explícita por variante (`?stagePreview=...&presentationVariant=...`).

## Chefe e combate

O arquétipo `boss` usa uma folha própria do Credor (`sprite.final.palacio.credor`)
com animações `walk`/`attack`/`hurt`, evitando o sprite genérico de Fortitudo.
O encontro declarativo usa ondas sequenciais:

1. aproximação — um lacaio;
2. jardins — um lacaio e um arqueiro;
3. galerias — um miniboss;
4. arena — o Credor sozinho.

A onda do chefe só nasce depois que as anteriores são derrotadas, o que produz
uma condição real de início. A vitória é observável por
`encounter.completed` e pela flag de conclusão. Não há alteração de HP em
runtime, teletransporte ou vitória forçada.

`StageEncounterEnemyPlacement` ganhou o campo opcional `hp`, validado pelo
`StageValidator` (inteiro de 1 a 9999) e consumido pelo `BossEnemy` existente.
Ele permite que uma fase autoral declare a resistência do seu próprio chefe sem
tocar nos padrões das entidades; ausente, o comportamento anterior permanece.
O Credor usa `hp: 700` e o miniboss das galerias usa `hp: 350`.

O `BossEnemy` existente continua sendo o executor; a identidade visual vem da
apresentação declarativa. Padrões de ataque adicionais e múltiplas fases
próprias permanecem planejados, não simulados.

## Integração

- `CAMPAIGN_CHAPTER_CATALOG` recebe a entrada do capítulo;
- `registerCampaignChapters` a registra sem branch central;
- o modo individual lista a fase quando ela é carregável;
- o World Lab a descobre pelo catálogo de produção;
- `?stagePreview=stage.final.palacio-do-credor` abre a variante padrão;
- `?stagePreview=...&presentationVariant=variant.final.palacio.corrompido`
  abre a variante corrompida.

Nenhum outro capítulo é alterado. A promoção não duplica IDs nem cria catálogo
paralelo.

## Validação

Testes automatizados dirigidos devem cobrir:

- registro, manifesto, IDs, referências e grafo de diálogo;
- objetivos, missão, escolha e evento de conclusão;
- encontro com chefe, condição de saída e compatibilidade do mapa;
- determinismo do mapa e das decorações;
- variantes: mesmo nível/encontro/narrativa, apresentação diferente;
- carregamento individual e presença no catálogo de produção.

Comandos de fechamento:

```sh
npm run chapter -- --chapters-dir src/stages/chapters validate palacio-do-credor
npm run chapter -- --chapters-dir src/stages/chapters inspect palacio-do-credor
npm run chapter -- --chapters-dir src/stages/chapters plan validate palacio-do-credor
npm run chapter -- --chapters-dir src/stages/chapters playtest palacio-do-credor
npm run homologate -- --stage stage.final.palacio-do-credor --json
npm run check:gates
npm run build
npm test -- --runInBand
git diff --check
```

`PASS`, `FAIL` e `UNKNOWN` são registrados como observados. A homologação Phaser
usa navegador real; o preview headless não é apresentado como jogabilidade.

## Fora de escopo

- criar Minas Corrompidas;
- conectar artificialmente a campanha de seis fases;
- declarar concluídos marcos ainda planejados;
- reescrever o fluxo geral de campanhas ou adicionar `CreditsScene` nesta
  entrega;
- alterar chaves de save, contratos centrais de gameplay ou catálogos do motor.
