# Etapa 9.12 — Validação automatizada de jogabilidade

## Contexto e decisão

As Etapas 9.9, 9.10 e 9.11 entregaram capabilities, `stage-plan.json` e os
templates panorâmicos `horizontal` e `branched`. A validação atual comprova
carregamento, referências, tiles conectados e correspondência plano ↔ fase, mas
não comprova que o corpo real do jogador atravessa a fase.

Esta etapa amplia a validação existente com um *playtest estático*: um passeio
determinístico que usa as dimensões reais do corpo do jogador, a regra de
colisão já usada pelo `StageMapRenderer` e os contratos narrativos já existentes.
Não cria motor de física, não simula Phaser, não usa LLM e não substitui
`StageValidator`, `StageLoader`, `ResolvedLevelValidator` ou `StageDirector`.

O resultado separa explicitamente:

- **PASS:** condição comprovada pelas verificações executadas;
- **FAIL:** problema comprovado;
- **UNKNOWN:** verificação inconclusiva ou que exige execução real.

A homologação em Phaser continua sendo uma verificação separada. O relatório
declara `liveExecution: 'not-executed'` quando nenhum navegador foi executado,
sem converter essa ausência em aprovação.

## Escopo

### Incluído

- alcançabilidade física com a caixa de colisão real do jogador;
- verificação de spawn, saídas, regiões do plano, NPCs e encontros obrigatórios;
- detecção de passagens estreitas demais;
- verificação física da bifurcação dos templates panorâmicos;
- integração dos diagnósticos de capítulo, plano, loader e narrativa;
- análise de satisfatibilidade das condições de saída, missões e objetivos;
- comando `npm run chapter -- playtest <slug>`;
- avaliação reproduzível de múltiplas seeds de capítulos gerados pelo template;
- relatório humano e JSON estável, com códigos e sugestões de correção.

### Fora do escopo

- novo motor de física, colisão ou navegação;
- simulação de combate, dano, HP ou progression;
- agentes internos, LLM, orquestração multiagente ou geração de conteúdo;
- execução headless de Phaser;
- alteração de geometria dos templates para o validador aprovar;
- alteração de capítulos existentes, do World Lab, da câmera ou do
  `GameScene`;
- novos assets, dependências ou perfis de navegador.

## Modelo do jogador

O jogador usa o corpo declarado em `src/entities/Hero.ts`:

| Dado | Valor |
|---|---|
| corpo declarado (`setSize`) | 42 × 58 px de textura |
| textura de animação | frame 128 × 114 |
| exibição (`setDisplaySize`) | 86 × 76 px |
| escala resultante | 0,671875 × 0,666667 |
| corpo físico no mundo | 28,21875 × 38,6667 px |
| corpo conservador usado | 29 × 39 px |
| deslocamento vertical do corpo | ≈ +13,33 px em relação ao centro do sprite |
| tile do runtime | 32 × 32 px |

A validação usa o corpo físico no mundo, arredondado para cima (29 × 39), e o
deslocamento vertical real. O modelo é exposto no relatório para auditoria.

Regra de colisão reutilizada do `StageMapRenderer`: apenas os tiles `wall`,
`pillar` e `water` (1, 2 e 3) são sólidos. `lava`, `locked-door`, `chest`,
`spawn`, `exit` e `boss` não bloqueiam fisicamente o jogador.

A busca é executada em uma grade fina de 8 px (quatro amostras por tile),
4/8-conectada com bloqueio de corte de canto, igual ao comportamento de
movimento do Arcade Physics. Cada amostra é válida somente se a caixa 29 × 39
não intersecta nenhum tile sólido. A grade fina não é um novo motor de física:
é uma erosão geométrica determinística do mapa pelos limites do corpo.

## Verificações de navegação

| Verificação | Regra |
|---|---|
| spawn | tile `spawn` existe e o corpo cabe em uma posição livre próxima |
| caminho principal | spawn alcança pelo menos uma saída obrigatória |
| saídas | cada âncora `tile` é alcançável; `map-exit` usa tile `exit`/`boss`; `player-spawn` usa o spawn |
| regiões do plano | cada região com `anchor` é alcançável; `start`, `exit` e `objective` são obrigatórias |
| objetivos do plano | a região de cada objetivo é alcançável |
| NPCs | NPCs `story`, `quest` e `merchant` são alcançáveis; `ambient` é não obrigatório |
| encontros obrigatórios | inimigos de encontros referenciados por missões que bloqueiam saída são alcançáveis |
| passagens estreitas | quando o caminho por tiles existe mas o corpo não passa, o diagnóstico é `PASSAGE_TOO_NARROW` e informa o primeiro tileproblemático do caminho |
| retorno | como o grafo de clearance é simétrico, alcançar a região implica poder retornar; a checagem é registrada como PASS quando a região é alcançável |

## Verificações dos templates

### `horizontal`

- spawn, regiões e saída alcançáveis com o corpo real;
- rota principal do `geometry.routes.main` inteiramente livre;
- cenário contínuo: nenhuma região exige teleporte;
- limites de mundo da câmera calculados a partir do mapa e válidos.

### `branched`

Além do horizontal:

- `split`, `branch` e `rejoin` identificados por sufixo estável de ID;
- rota `geometry.routes.branch` inteiramente livre;
- `split` alcança `rejoin` sem atravessar a faixa da rota secundária
  (`BRANCH_MAIN_PATH_BLOCKED` se falhar);
- `split` alcança `rejoin` sem atravessar a faixa da rota principal
  (`BRANCH_PATH_BLOCKED` se falhar);
- o grafo do plano contém ciclo (`BRANCH_GRAPH`).

A geometria dos templates não é alterada. O validador apenas a mede.

## Verificações de progressão

A análise é estática e conservadora. Não é uma máquina de estados nova: lê os
comandos, eventos, condições, missões e saídas já declarados e decide se existe
produção local capaz de satisfazê-los.

1. **Condição de saída:** `flag.equals` é satisfatível se algum comando
   alcançável escreve o valor exigido; `mission.status` reutiliza a análise de
   missão; `all`/`any`/`not` são avaliados como lógica de três valores
   (`sim`, `não`, `desconhecido`); `progression.unlocked` é sempre UNKNOWN
   porque depende do save.
2. **Início de missão:** `stage-enter` é automático; `dialogue` exige um comando
   `mission.start` em diálogo iniciável; `event` exige um comando em evento
   alcançável.
3. **Objetivos:** cada sinal é confrontado com o conteúdo existente. Contagens
   de inimigos e itens são comparadas ao alvo quando o filtro é estático. Sinais
   cujo filtro depende de IDs de ocorrência em tempo de execução são UNKNOWN.
4. **Conclusão:** `completionMissionId` existe e pode ser concluída; existe
   comando `stage.complete` para alguma saída cuja condição seja satisfatível.
5. **Transição:** destino `campaign.complete` ou fase do próprio capítulo é
   referência válida; a execução real da transição é UNKNOWN.
6. **Ordem narrativa:** ordens que dependem de escolha ou combate real são
   UNKNOWN, nunca PASS.

Diagnósticos de `validateChapterEntry`, `StageLoader`, `StageDirector` e
`validateStagePlan` são anexados ao relatório sem serem reimplementados.

## CLI

```sh
npm run chapter -- playtest <slug>
npm run chapter -- playtest <slug> --json
npm run chapter -- playtest <slug> --seed 42
npm run chapter -- playtest <slug> --seeds 5
```

- `--seed` reproduz uma seed individual;
- `--seeds <n>` avalia `n` seeds consecutivas a partir da seed autoral
  (`seed`, `seed+1`, ...), com `n` entre 1 e 25;
- as duas opções são mutuamente exclusivas;
- seed é inteiro não negativo de 32 bits, como em `create`;
- capítulos sem factory de geometria exportada retornam UNKNOWN com
  `PLAYTEST_SEED_UNSUPPORTED`, sem alterar o capítulo;
- o comando nunca escreve no capítulo, no save ou no catálogo.

Códigos de saída: `0` PASS, `1` FAIL ou UNKNOWN, `2` uso inválido.

## Relatório

Documento JSON estável:

```json
{
  "schemaVersion": 1,
  "kind": "umbra.stage-playtest.report",
  "chapterId": "chapter.authoring.travessia",
  "stageId": "stage.authoring.travessia.approach",
  "template": "horizontal",
  "result": "PASS",
  "summary": {
    "seeds": 5,
    "passed": 5,
    "failed": 0,
    "unknown": 0,
    "checks": 70,
    "failedChecks": 0,
    "unknownChecks": 5
  },
  "seeds": [
    {
      "seed": 42,
      "source": "authored",
      "result": "PASS",
      "character": {
        "tileSize": 32,
        "bodyWidth": 29,
        "bodyHeight": 39,
        "bodyOffsetY": 13.333333,
        "sampleStep": 8
      },
      "checks": [],
      "diagnostics": [],
      "regions": [],
      "camera": {},
      "liveExecution": "not-executed"
    }
  ],
  "runtime": {
    "phaser": "not-executed",
    "liveExecution": "UNKNOWN"
  }
}
```

Cada check declara `id`, `code`, `status`, `required`, `message`, `location`
opcional, `referenceId` opcional e `suggestion` opcional. A ordenação é
determinística.

### Códigos de diagnóstico

| Código | Severidade | Uso |
|---|---|---|
| `NAVIGATION_PATH_BLOCKED` | error | spawn sem espaço livre ou caminho principal impossível |
| `NAVIGATION_SPAWN_MISSING` | error | mapa sem tile `spawn` |
| `PASSAGE_TOO_NARROW` | error | caminho por tiles existe, corpo 29 × 39 não passa |
| `REGION_UNREACHABLE` | error | região do plano inalcançável |
| `OBJECTIVE_UNREACHABLE` | error | objetivo do plano inalcançável |
| `EXIT_UNREACHABLE` | error | saída inalcançável |
| `NPC_UNREACHABLE` | error | NPC obrigatório inalcançável |
| `ENCOUNTER_UNREACHABLE` | error | inimigo de encontro obrigatório inalcançável |
| `BRANCH_PATH_BLOCKED` | error | rota secundária não percorrível |
| `BRANCH_RETURN_BLOCKED` | error | retorno da bifurcação ao reencontro impossível |
| `BRANCH_MAIN_PATH_BLOCKED` | error | caminho principal deixa de existir sem a rota secundária |
| `BRANCH_GRAPH` | error/info | ciclo ausente no plano ramificado |
| `PROGRESSION_CONDITION_UNMET` | error | condição de saída comprovadamente impossível |
| `PROGRESSION_CONDITION_UNVERIFIED` | warning | condição depende de estado externo |
| `PROGRESSION_OBJECTIVE_UNSTARTABLE` | error | missão sem gatilho de início |
| `PROGRESSION_SIGNAL_UNSATISFIABLE` | error | objetivo pede sinais que a fase não produz |
| `PROGRESSION_SIGNAL_UNVERIFIED` | warning | objetivo depende de ID de ocorrência em runtime |
| `PROGRESSION_COMPLETION_UNREACHABLE` | error | nenhuma saída permite concluir a fase |
| `PROGRESSION_ORDER_UNVERIFIED` | info | ordem de objetivos depende de execução real |
| `TRANSITION_TARGET_INVALID` | error | destino de saída inexistente no capítulo |
| `TRANSITION_REFERENCE_VALID` | pass | destino declarado é válido no capítulo |
| `TRANSITION_UNVERIFIED` | info | transição real não executada |
| `CAMERA_BOUNDS_INVALID` / `CAMERA_BOUNDS_VALID` | error/pass | limites de mundo da câmera |
| `CAMERA_FOLLOW_UNVERIFIED` | info | acompanhamento da câmera não executado |
| `REGION_ANCHOR_PENDING` | warning | região do plano sem âncora física |
| `NPC_REACH_UNVERIFIED` | info | NPC com âncora não-tile |
| `NAVIGATION_MAP_INVALID` | error | mapa ausente ou malformado |
| `PLAYTEST_LIVE_EXECUTION_UNVERIFIED` | info | nenhum passeio real em Phaser |
| `PLAYTEST_SEED_UNSUPPORTED` | warning | capítulo não expõe factory de seed |

Códigos existentes (`stage.exit.anchor-unreachable`, `level.spawn.missing`,
`plan.*`, `narrative.*`) são reaproveitados sem renomeação.

## Compatibilidade

- `LevelDefinition`, `StageModule`, `StageManifest`, `ChapterManifest`,
  `stage-plan.json` e os saves não mudam.
- `validate`, `inspect`, `preview`, `capabilities` e `plan validate` mantêm o
  comportamento.
- Nenhum capítulo de produção é alterado.
- O capítulo é carregado por `StageLoader` e validado por
  `validateChapterEntry`; a narrativa usa `StageDirector`.
- A CLI carrega o módulo por `index.ts`; a factory `createChapterTemplate` já
  exportada pelo template é opcional e usada somente para variantes de seed.
- O World Lab não é alterado.

## Critérios observáveis e testes

1. Template `horizontal` passa no playtest e todas as regiões/rota/saída são
   alcançáveis com o corpo real.
2. Template `branched` passa e as duas rotas físicas são verificadas.
3. Uma coluna de parede inserida temporariamente no corredor produz FAIL com
   `EXIT_UNREACHABLE`; o cenário original volta a PASS depois da restauração.
4. Um corredor de um tile de altura produz `PASSAGE_TOO_NARROW`.
5. Região selada produz `REGION_UNREACHABLE`/`OBJECTIVE_UNREACHABLE`.
6. Saída selada produz `EXIT_UNREACHABLE`.
7. Bifurcação obstruída produz `BRANCH_PATH_BLOCKED` sem reprovar o caminho
   principal.
8. Condição de saída impossível produz `PROGRESSION_CONDITION_UNMET`; missão
   sem gatilho produz `PROGRESSION_OBJECTIVE_UNSTARTABLE`.
9. A mesma entrada produz o mesmo relatório (determinismo).
10. `--seeds n` avalia seeds consecutivas e `--seed` reproduz uma delas.
11. `--json` é JSON puro com `kind`, `schemaVersion`, checks e contagens.
12. `capabilities`, `create`, `validate`, `inspect`, `preview` e
    `plan validate` continuam funcionando.
13. `npm run check:gates`, `npm run build`, `npm test -- --runInBand` e
    `git diff --check` passam.

## Validação final

- testes dirigidos de navegação, progressão, CLI, determinismo e seeds;
- `npm run check:gates`;
- `npm run build`;
- `npm test -- --runInBand`;
- `git diff --check`;
- `npm run chapter -- preview <slug>` headless para confirmar que o caminho
  Phaser permanece funcional;
- execução real no navegador registrada como evidência separada, quando
  disponível.

## Limitações

A verificação é geométrica e narrativa estática. Não executa Arcade Physics,
não simula combate, escolhas do jogador, tempo, dano ou progressão persistente.
O corpo é modelado como retângulo rígido sem aceleração, dash ou knockback. A
câmera é verificada apenas por limites de mundo. Itens e inimigos em posições
opcionais não bloqueiam a conclusão. A ordem exata de objetivos e a transição
real entre cenas permanecem UNKNOWN até existir homologação em navegador.
