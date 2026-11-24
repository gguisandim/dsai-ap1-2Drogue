# Minas Corrompidas — O Subsolo da Dívida

## Contexto e decisão

Esta SPEC introduz uma fase autoral individual para a quinta etapa da campanha
principal reduzida. Ela não integra a rota definitiva nem declara concluída a
região corrompida. Os contratos públicos atuais já suportam mapa autoral,
encontro declarativo, HP autoral por inimigo, missão, flags, recompensa
persistente, saída física, recursos visuais locais e variantes de apresentação.

Identidades confirmadas:

- região macro preservada: `region.corrupted.minas`;
- capítulo: `chapter.corrupted.minas`;
- fase: `stage.corrupted.minas`;
- variante Abandonada: `variant.corrupted.minas.abandoned`;
- variante Corrompida: `variant.corrupted.minas.corrupted`.

O catálogo registra a fase como `individual-only`, sem binding macro e sem
conceder `milestone.corrupted.primary`. A consequência persistente própria será
`beat.corrupted.minas.creditor-ledger`, preparada para composição futura.

## Narrativa

Em **O Subsolo da Dívida**, a guardiã sobrevivente Maíra conduz a investigação
da antiga Mina Açu. Registros ambientais mostram que a extração do mineral
arumã começou com limites e devoluções ao território, mas foi convertida pelo
Credor em adiantamentos impagáveis. O vestígio do engenheiro Nilo apresenta a
perspectiva dos trabalhadores: a mina sustentou comunidades antes que metas,
penhoras de água e aprofundamento forçado rompessem o pacto inicial.

A corrupção é uma transformação histórica, econômica e ecológica: aquíferos
desviados, organismos mineralizados e raízes incorporadas ao maquinário. O
confronto final é contra o Coração de Lastro, uma entidade formada no núcleo de
extração. Sua derrota não “resolve” a mina; ela interrompe o bombeamento e
permite recuperar uma lâmina do livro-caixa que prova que o Palácio do Credor é
o destino das garantias extraídas.

## Mapa e progressão

O mapa autoral é panorâmico, contínuo, determinístico e lateral, com sete
regiões conectadas e desvios transitáveis:

1. floresta sobre a mina;
2. acampamento abandonado;
3. galerias de extração;
4. cavernas invadidas pela floresta;
5. galerias contaminadas;
6. núcleo de extração;
7. câmara de revelação e saída.

`stage-plan.json` descreve regiões, âncoras, objetivos, encontros, interações e
a condição de saída. A progressão entre as sete regiões é linear; os desvios de
exploração são laterais no mapa físico e não criam regiões narrativas
paralelas. O mapa lógico é a única fonte de colisão e permanece idêntico entre
variantes.

## Missão e conclusão

A missão `mission.corrupted.minas.subsolo-da-divida` começa ao entrar e exige:

- ouvir Maíra sobre o pacto original;
- concluir o encontro declarativo no núcleo.

A descoberta sobre o Credor é materializada pelo evento de conclusão, que
concede o beat persistente, define a flag e desbloqueia a saída. O diálogo de
revelação é entregue pela lâmina do livro-caixa quando o jogador a examina; a
conclusão não abre diálogo bloqueante, porque o runtime pausa a física com
diálogo aberto e o jogador ficaria imóvel longe da saída. Os objetivos de
contexto são opcionais e materializam a investigação sem bloquear a conclusão:

- investigar o vestígio de Nilo;
- recolher a evidência ambiental no aquífero;
- examinar a lâmina do livro-caixa.

Isso mantém o runtime existente suficiente e permite que um condutor de
homologação com um único NPC comprove a conclusão sem enfraquecer a narrativa:
a prova do livro-caixa continua disponível e é a origem diegética do beat. O
evento de missão concluída define `flag.corrupted.minas.core-stilled`, concede
`beat.corrupted.minas.creditor-ledger` idempotentemente e desbloqueia
`exit.corrupted.minas.to-surface`. O pedido físico de saída, condicionado à
flag, executa `stage.complete`. Não há transição artificial ao Palácio.

## Encontro

O encontro `encounter.corrupted.minas.core` possui progressão curta e
intencional: fauna territorial, organismos mineralizados, guardião das
galerias e o Coração de Lastro. Usa somente arquétipos suportados e HP autoral
nos inimigos de elite. As posições são caminháveis, o chefe aparece apenas na
onda final e `all-waves-defeated` é a condição observável de vitória.

## Direção visual e variantes

A apresentação híbrida usa:

- pixel art para os dez tiles lógicos, NPCs e inimigos;
- PNGs pictóricos autorais mantidos nas outras regiões, fora do piloto de
  entrada e sujeitos a revisão própria;
- SVG autoral para cristais, trilhos, elevador, raízes, fungos, bombas,
  maquinário e o selo do Credor.

A variante Abandonada usa rocha úmida, madeira apodrecida, água, arumã estável,
raízes recuperando galerias e luz natural escassa. A Corrompida troca tileset,
ambiente, áudio, efeitos e silhuetas por minerais deformados, raízes
mineralizadas, fungos anômalos, névoa e maquinário incorporado. Os overrides de
decoração substituem composições e formas, não apenas tintas.

### Piloto de composição — entrada da mina

Na região `region.corrupted.minas.floresta`, o PNG panorâmico não compõe a
superfície caminhável: sua perspectiva lateral e borda retangular contradizem
o mapa top-down. A entrada usa o piso pixel art como base e compõe raízes,
suportes, trilhos, arumã e fungos existentes como acentos em escala comparável
ao herói e com profundidade de fundo, terreno e primeiro plano. As
decorações ficam fora da rota mais legível ou a acompanham sem sugerir
colisões. Os overrides existentes continuam dando formas distintas às
variantes Abandonada e Corrompida. Os panoramas das outras regiões permanecem
fora deste piloto.

## Integração

O capítulo entra uma única vez em `CAMPAIGN_CHAPTER_CATALOG`; daí deriva sua
presença em Jogar Fase, World Lab, preview, validação e homologação. O preload
global recebe apenas o catálogo de assets das Minas. `GameScene.ts`, combate,
IA, progressão central, saves e o esqueleto macro não mudam.

## Critérios observáveis

1. `chapter.corrupted.minas` registra exatamente `stage.corrupted.minas` como
   fase carregável e `individual-only`, sem binding macro.
2. Manifesto, IDs, referências, diálogos, missão, eventos e saída passam no
   `StageValidator`.
3. O mapa é determinístico, fechado, panorâmico e permite alcançar NPCs,
   inimigos, núcleo e saída desde o spawn.
4. O plano valida e o playtest estático comprova spawn, rota, câmera,
   encontro, missão e saída.
5. O encontro tem progressão real, chefe final com HP autoral e condição
   `all-waves-defeated`.
6. A missão só conclui após o testemunho de Maíra e o confronto; a saída só
   desbloqueia depois de `flag.corrupted.minas.core-stilled`.
7. A recompensa persistente é `beat.corrupted.minas.creditor-ledger`; nenhum
   comando concede `milestone.corrupted.primary`.
8. Abandonada e Corrompida resolvem para tilesets, ambientes, áudio, efeitos e
   silhuetas distintos, preservando mapa, colisão, NPCs, missão e encontro.
9. Todos os assets têm procedência, licença, dimensões e hash verificável; PNGs
   e SVGs são usados em placements reais.
10. O World Lab lista as duas variantes e a homologaçao Phaser executa ambas,
    com capturas reais dos marcos disponíveis.
11. Na entrada, nenhuma decoração panorâmica PNG se sobrepõe à rota; a
    composição usa SVGs existentes com dimensões visuais máximas de quatro tiles,
    profundidades separadas e as formas próprias de cada variante.
12. Capturas Phaser reais da entrada Abandonada e Corrompida, antes e depois,
    usam resolução e marco equivalentes e permitem inspecionar escala,
    perspectiva, bordas, oclusão e leitura da rota.
13. Após a última alteração passam validação do plano e capítulo, preview,
    testes dirigidos, `npm run check:gates`, `npm run build`,
    `npm test -- --runInBand` e `git diff --check`.

## Evidências e limitações

O relatório de homologação registra PASS, FAIL e UNKNOWN sem fabricar sinais.
Capturas reais cobrem entrada, acampamento, galerias, raízes, área contaminada,
núcleo, confronto e saída, incluindo comparação das variantes nos mesmos
locais quando o executor expuser esses checkpoints.

FPS, GPU e memória permanecem `UNKNOWN` sem medição confiável. A seleção de
variante é explícita no loader/World Lab; não existe troca dinâmica por flag.
PNGs e SVGs são apresentação sem física. A exigência de commit prévio da SPEC
não pode ser materializada porque o pedido proíbe commits; a ordem é preservada
no worktree e o registro permanece com `Commit: pendente`.
