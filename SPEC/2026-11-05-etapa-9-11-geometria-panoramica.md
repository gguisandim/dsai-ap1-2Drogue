# Etapa 9.11 — Geometria panorâmica reutilizável e planos gerados

## Contexto e decisão

As Etapas 9.9 e 9.10 forneceram catálogo de capabilities e planejamento
estruturado. Ainda faltava uma geometria inicial reutilizável para que agentes
externos não programem mapas manualmente nem produzam salas quadradas.

Esta etapa adiciona dois templates espaciais contínuos — `horizontal` e
`branched` — reutilizando `LevelDefinition`, `StageModule`, `NoiseField`,
`StageLoader`, `ResolvedLevelValidator`, a câmera existente e o preview Phaser.
Não cria motor procedural, câmera, renderer, agente de IA ou formato de
execução paralelo.

`stage-plan.json` continua sendo um artefato de autoria; `StageModule` continua
sendo a fonte de verdade do runtime. O plano gerado é criado por
`chapter create` e validado por `plan validate`, que também compara o plano com
a fase carregada quando o capítulo exporta um módulo.

## Templates de geometria

A implementação fica em `src/examples/chapter-template/geometry.ts` e é copiada
para o capítulo criado. Ela é pura, determinística e usa `NoiseField` com uma
semente textual derivada de `seed`, template e dimensões.

### `room`

Preserva exatamente o mapa 19×11 do template atual, incluindo spawn, NPC, item,
decoração, saída e posições de inimigos. Existe para compatibilidade com os
testes, capítulos gerados anteriormente e `chapter create` sem opções.

### `horizontal`

Mapa contínuo, amplo, com progressão oeste→leste. Uma faixa de terreno orgânica
segue um centro suavizado com variação de altura; canais/covas usam ruído;
obstáculos ficam fora da faixa percorrível. Regiões lógicas são amostras da
mesma faixa, não salas. Spawn e saída ficam sobre o percurso.

Padrões: largura 96, altura 30, 5 regiões. Limites públicos: largura 32–160,
altura 16–48, regiões 3–8.

### `branched`

Deriva do horizontal e acrescenta uma bifurcação física: o percurso principal
liga `split` a `rejoin`; um segundo caminho orgânico sai de `split`, passa por
`branch` e retorna em `rejoin`. Ambos são carimbados como piso no mesmo mapa,
sem teletransporte. O grafo de regiões contém um ciclo real.

Padrões: largura 100, altura 34, 5 regiões. Regiões extras são distribuídas no
percurso principal, mantendo o ciclo `split`–`branch`–`rejoin`.

## CLI

`chapter create` recebe opções adicionais:

```sh
npm run chapter -- create minha-fase --template horizontal --seed 42
npm run chapter -- create minha-fase --template branched --seed 42 \
  --width 110 --height 34 --regions 6
```

Opções válidas: `--template room|horizontal|branched`, `--seed` inteiro não
negativo, `--width`, `--height` e `--regions` inteiros nos limites publicados.
Valores inválidos produzem erro de uso e código 2.

O capítulo gerado inclui `geometry.ts` e `stage-plan.json`. O plano usa o schema
`umbra.stage-plan` versão 1 com os campos aditivos opcionais `chapterId`,
`template` e `anchor` por região. Ele passa em `plan validate` e referencia
apenas capabilities reais do `StageManifest`.

## Correspondência plano ↔ fase

`plan validate` continua validando o plano isolado. Quando o diretório contém
`index.ts`, o comando carrega o `StageModule` pelo loader existente e verifica:

- `stageId` e `chapterId` iguais aos do módulo;
- `template` e `progression` compatíveis (`room`/`horizontal` → linear,
  `branched` → branched);
- cada região com `anchor` dentro do mapa, sobre tile caminhável e alcançável a
  partir do spawn;
- conexões entre regiões com âncoras no mesmo componente caminhável;
- início sobre tile `spawn` e saída sobre tile `exit`;
- ciclo no grafo de regiões quando o template é `branched`.

Regiões sem `anchor` produzem `info`, pois o aspecto ainda não foi
implementado. Objetivos e missões não são comparados. O validador não simula
estados narrativos nem física.

## Edição localizada

O capítulo gerado mantém `template`, `seed`, largura, altura e número de regiões
em `index.ts`/`template.ts`. Alterar esses parâmetros ou o mapa em `geometry.ts`
regenera a geometria no próximo carregamento sem reconstruir o restante da fase.
A seed e os parâmetros originais permanecem legíveis. Um plano desatualizado é
detectado pela comparação plano ↔ fase.

## Compatibilidade

- `LevelDefinition`, `StageModule` e `StageManifest` não mudam.
- O template antigo e capítulos existentes continuam com o mapa 19×11.
- `capabilities`, `plan validate` e o World Lab continuam funcionando.
- Nenhum capítulo de produção é alterado.
- A câmera, `StageMapRenderer`, colisões e apresentações existentes são
  reutilizados.
- As variantes Natural/Corrompida do Igapó não são tocadas.

## Critérios observáveis e testes

1. `room` permanece 19×11; `horizontal` e `branched` geram mapas contínuos e
   carregáveis.
2. Mesma configuração e seed produzem o mesmo mapa, plano e posições.
3. `chapter create --template ...` gera `geometry.ts` e `stage-plan.json`.
4. O plano gerado passa em `plan validate`, inclusive na comparação com o
   `StageModule` carregado.
5. O mapa horizontal é conectado do spawn à saída; âncoras de regiões são
   caminháveis.
6. O mapa ramificado contém um ciclo de regiões e dois caminhos físicos entre
   `split` e `rejoin`.
7. Opções inválidas falham com código 2.
8. Capítulos existentes, capabilities e testes 9.9/9.10 não regridem.
9. Homologação visual real no preview Phaser registra o que foi efetivamente
   verificado; sem navegador, a limitação é declarada e não há aprovação visual.

## Validação final

- testes direcionados de geometria, CLI, plano e comparabilidade;
- `npm run check:gates`;
- `npm run build`;
- `npm test -- --runInBand`;
- `git diff --check`;
- homologação visual no preview existente, quando o navegador estiver
  disponível.

## Limitações

A geração é lógica e visual, não um simulador de navegação. Não há geração
automática de inimigos, itens ou missões além do conteúdo mínimo do template.
A comparação plano ↔ fase verifica âncoras e conectividade caminhável, não a
forma exata das regiões. A homologação visual depende de navegador real e será
registrada separadamente.
