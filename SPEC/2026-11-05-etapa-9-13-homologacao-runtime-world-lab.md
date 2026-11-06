# Etapa 9.13 — Homologação de runtime e diagnósticos no World Lab

## Contexto e decisão

A Etapa 9.12 entregou o playtest estático (`StagePlaytestValidator`) e o
relatório `umbra.stage-playtest.report` v1. Ele comprova geometria,
satisfatibilidade narrativa e câmera por limites, mas não executa o jogo.

Esta etapa complementa a 9.12 com dois blocos:

1. uma homologação real em Phaser, dirigida por entradas de teclado/mouse via
   CDP, que percorre NPC, diálogo, missão, encontro, combate, desbloqueio,
   saída e conclusão quando a fase oferece esses elementos;
2. a integração dos diagnósticos estáticos e de runtime ao World Lab, com
   sobreposições espaciais, painel compacto e seleção de problemas.

Não cria um segundo validador, física, renderer, editor ou orquestração
multiagente. O relatório v1 da 9.12 permanece inalterado; o runtime usa um
relatório complementar versionado.

## Homologação de runtime

### Executor

O executor fica em `scripts/homologate-chapter.mjs` e é exposto por:

```sh
npm run homologate -- <slug> [--variant <id>] [--json]
npm run homologate -- --stage <stageId> [--variant <id>] [--json]
npm run chapter -- homologate <slug> [--json] [--variant <id>]
npm run chapter -- homologate --stage <stageId> [--json] [--variant <id>]
```

O comando da CLI atual delega ao mesmo script. A CLI exige o diretório
canônico `src/examples/chapters` para o modo capítulo, porque o preview Vite
descobre capítulos por `import.meta.glob` estático.

O script:

1. sobe o Vite pelo `createServer` existente, com porta livre e pré-aquecimento
   do grafo de entrada;
2. abre um navegador Chromium/Edge headless com perfil temporário em
   `.tmp/evidence-913/`;
3. cria um alvo CDP, aguarda a `GameScene` do preview existente, lê o
   `modularLoadedStage` e o snapshot do `StageDirector`;
4. controla o personagem com eventos reais de teclado e mouse
   (`Input.dispatchKeyEvent`, `Input.dispatchMouseEvent`), usando o
   `NavigationService` já existente para traçar waypoints;
5. executa, quando o capítulo oferece os recursos:
   - fechamento de diálogo automático;
   - caminhada até o NPC, pressão de `E`, abertura e escolha do diálogo;
   - início real da missão e verificação do estado;
   - combate real com ataque, esquiva, cura por item e morte possível;
   - conclusão do encontro e sinais narrativos;
   - navegação até a saída, desbloqueio, acionamento e conclusão;
   - checkpoints de bifurcação (`split`, `branch`, `rejoin`) quando o plano os
     declara;
   - amostras de câmera e deslocamento;
6. grava um relatório JSON e capturas em `.tmp/evidence-913/`;
7. encerra o navegador com `Browser.close` e `taskkill /T /F` no Windows.

Não há aumento artificial de HP, dano infinito, teletransporte, alteração de
regras ou fabricação de sinais. O perfil de classe é o padrão do jogo. Se o
combate matar o jogador, o resultado é FAIL/UNKNOWN com evidência real.

### Relatório complementar

```json
{
  "schemaVersion": 1,
  "kind": "umbra.stage-homologation.report",
  "stageId": "stage.aguas.igapo-das-memorias",
  "chapterId": "chapter.aguas",
  "title": "Igapó das Memórias",
  "variantId": "variant.aguas.igapo-sombrio",
  "scenario": "igapo",
  "seed": null,
  "result": "PASS",
  "checks": [
    {
      "id": "runtime.exit.triggered",
      "code": "RUNTIME_EXIT_TRIGGERED",
      "status": "PASS",
      "required": true,
      "message": "A saída acionou o evento de conclusão.",
      "location": { "x": 91, "y": 16 },
      "evidence": "phaser-runtime"
    }
  ],
  "observations": [],
  "evidence": {
    "screenshots": ["01-loaded.png", "02-npc-dialogue.png", "05-exit.png"],
    "browser": "Edg/… (Chromium)",
    "durationMs": 29912
  },
  "runtime": { "phaser": "executed", "liveExecution": "executed" }
}
```

Códigos de runtime principais:

| Código | Uso |
|---|---|
| `RUNTIME_STAGE_LOADED` | a fase carregou na `GameScene` |
| `RUNTIME_PLAYER_MOVED` | deslocamento real com entradas |
| `RUNTIME_CAMERA_FOLLOW` / `RUNTIME_CAMERA_BOUNDS` | acompanhamento e limites |
| `RUNTIME_NPC_REACHED` / `RUNTIME_DIALOGUE_OPENED` | NPC e diálogo |
| `RUNTIME_MISSION_STARTED` / `RUNTIME_MISSION_COMPLETED` | missão |
| `RUNTIME_ENCOUNTER_STARTED` / `RUNTIME_COMBAT_DAMAGE` | encontro e dano real |
| `RUNTIME_PLAYER_DAMAGED` / `RUNTIME_PLAYER_DIED` | dano e morte possíveis |
| `RUNTIME_ENCOUNTER_COMPLETED` | encontro concluído |
| `RUNTIME_BRANCH_REJOINED` | bifurcação percorrida |
| `RUNTIME_FLAG_UPDATED` / `RUNTIME_EXIT_UNLOCKED` | narrativa e saída |
| `RUNTIME_EXIT_REACHED` / `RUNTIME_EXIT_TRIGGERED` | saída e conclusão |
| `RUNTIME_TRANSITION_EXECUTED` / `RUNTIME_TRANSITION_UNVERIFIED` | transição |
| `RUNTIME_BROWSER_UNAVAILABLE` / `RUNTIME_EXECUTION_FAILED` | bloqueios de ambiente |

`PASS` é uma verificação executada; `FAIL` é uma falha real; `UNKNOWN` é uma
verificação não executada ou inconclusiva. O resultado geral ignora checks não
bloqueantes. A transição de cena no preview individual é UNKNOWN quando a
conclusão é registrada mas a próxima fase não é carregada.

## Integração no World Lab

### Modelo

`WorldLabStageView.validation` recebe a projeção estática da 9.12:

- `stageId`, `seed`, `result`, `evidence: "static-analysis"`;
- `checks` com `id`, `code`, `status`, `required`, `message`, `suggestion`,
  `referenceId`, `location`, `regionId` e `evidence`;
- `regions` do plano com âncora, papel e status;
- `summary` de PASS/FAIL/UNKNOWN;
- `plan` (`file`, `generated` ou `none`) e `routes` principal/secundária.

O `WorldLabDiagnostic` ganha campos opcionais `status`, `evidence`, `location`,
`regionId`, `checkId` e `suggestion`. Origens novas: `playtest-static` e
`playtest-runtime`. Nada disso quebra o schema de snapshot `umbra-world-lab/v1`;
os campos são aditivos e opcionais.

### Sobreposições espaciais

No modo Estrutural, o mapa SVG existente passa a desenhar:

- âncoras de região do plano (losangos por status);
- rotas principal (verde) e secundária (âmbar tracejada);
- checks com localização (FAIL vermelho, UNKNOWN âmbar, PASS verde quando
  selecionado);
- destaque do check selecionado.

Os overlays são apenas inspeção: não alteram tiles, corpos, colisões, objetos ou
estado de gameplay. O checkbox de sobreposições existente os controla.

### Painel

O inspetor ganha uma seção **Validação** com:

- resultado estático e de runtime;
- seed (ou `autoral`);
- contagem PASS/FAIL/UNKNOWN;
- origem da evidência;
- plano e rotas;
- lista compacta de checks com código, região, coordenadas, descrição,
  sugestão e marcador de bloqueio;
- botão **Importar homologação** para o relatório de runtime JSON.

Ao clicar em um check, a sessão seleciona o tile correspondente e destaca o
marcador no mapa. O painel de diagnósticos existente mostra os diagnósticos
estáticos e de runtime com status, evidência, região, coordenadas, check e
sugestão.

### Fonte de autoria

O World Lab descobre planos e capítulos de `src/examples/chapters` por
`import.meta.glob` estático. O desenvolvedor reinicia o Vite após criar um
capítulo novo. Planos de produção existentes (como o Igapó) são associados por
`stageId`. Fases legadas/procedurais não recebem validação estática de autoria;
o painel informa a indisponibilidade.

## Âncoras do Igapó

O `stage-plan.json` do Igapó recebeu âncoras reais, sem coordenadas inventadas:

| Região | Âncora | Origem |
|---|---|---|
| ribeirinho | 4,17 | tile spawn |
| travessia | 16,17 | ponto do corredor autorado |
| combate | 49,16 | primeiro inimigo do encontro |
| vestígio | 28,16 | NPC/baú do Vestígio Submerso |
| nascente | 91,16 | âncora da saída |

O `validateStagePlan` e o playtest estático passam com essas âncoras.

## Casos homologados

| Caso | Resultado | Evidência |
|---|---|---|
| Horizontal (template) | PASS | spawn → NPC → missão → combate real → encontro → saída → conclusão; transição UNKNOWN |
| Ramificado (template) | PASS | percurso principal, split → branch → rejoin, encontro, saída, conclusão |
| Igapó Natural | PASS | NPC, diálogo, missão, flag, saída, conclusão; transição UNKNOWN |
| Igapó Corrompida | PASS | mesma trilha com `variant.aguas.igapo-sombrio` |
| Fixture de falha | FAIL controlado | bolso selado detectado pelo playtest e exibido no World Lab |

As evidências ficam em `.tmp/evidence-913/` e não entram no Git.

## Compatibilidade

- `umbra.stage-playtest.report` v1 não muda.
- `umbra-world-lab/v1` aceita snapshots antigos sem validação e novos com
  validação; o round-trip é determinístico.
- `LevelDefinition`, `StageModule`, `ChapterManifest`, saves e catálogo não
  mudam.
- Nenhum capítulo de produção é alterado além das âncoras autorais do plano do
  Igapó.
- A geometria, os temas e as variantes Natural/Corrompida do Igapó são
  preservados.
- O World Lab mantém os modos Estrutural, Visual e Comparação.

## Critérios observáveis e testes

1. `homologate` executa o ciclo real em Phaser e grava o relatório v1.
2. Horizontal, ramificado e Igapó Natural/Corrompida têm resultados registrados.
3. A conclusão do Igapó é comprovada em runtime sem manipulação de HP/regras.
4. O World Lab projeta os diagnósticos da 9.12 com regiões e coordenadas.
5. Clicar em um diagnóstico/check destaca a posição no mapa.
6. O relatório de runtime é importado e mesclado com a análise estática.
7. PASS, FAIL e UNKNOWN são distinguidos; transição individual é UNKNOWN.
8. O snapshot v1 round-trips com e sem validação.
9. Os testes antigos do World Lab, playtest e capítulos continuam passando.
10. `check:gates`, `build`, suíte completa e `git diff --check` passam.

## Limitações

- A homologação depende de navegador Chromium/Edge e Node com WebSocket; sem
  eles o resultado é UNKNOWN.
- O executor é pequeno e orientado pelos dados do capítulo; não é um bot
  genérico. Combates podem terminar em morte ou timeout e são reportados como
  tais.
- A transição entre fases não é executada no preview individual; fica UNKNOWN.
- O World Lab importa o relatório de runtime manualmente; não há orquestração
  automática entre navegador e World Lab.
- Fases legadas/procedurais não recebem a validação estática de autoria.
- A ordem exata de escolhas e o comportamento de combate continuam dependentes
  de execução real.
