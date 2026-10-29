# Primeira região amazônica jogável: Igapó — Etapa 9.3A *(2026-10-29)*

## Estado e relação com as etapas anteriores

Esta SPEC sucede somente o uso de `verse_02_galeria` como placeholder de Igapó
descrito na Etapa 9.2B de
`SPEC/2026-10-28-campanha-rotas-independentes.md`. O fluxo macro, as demais
regiões planejadas, os contratos públicos de campanha e o comportamento legado
permanecem válidos.

A caracterização anterior à implementação executa as quatro suítes direcionadas
de binding macro, adapter Phaser, integração Phaser e UI do World Lab: 26 testes
passam e comprovam hub → Igapó → hub → retomada, persistência e projeção. A
lacuna diretamente relacionada é que a restauração de uma run iniciada dentro
de um stage original falha no adapter legado de `GameScene`, pois ele exige que
o `stageId` já exista em `VERSE_SECTIONS`. O ajuste permitido nesta etapa é
somente aceitar o stage modular carregado em um slot transitório quando seu ID
não estiver no array legado, sem adicionar o mapa ao catálogo legado.

## Objetivo

Entregar `Igapó das Memórias` como `StageModule` autoral, autocontido e
carregável, ligado à primeira região da Rota das Águas, com mapa original,
exploração conectada, combate existente, saída física de retorno e o primeiro
acontecimento declarativo da rota.

Não fazem parte desta etapa arte final, natação, física aquática, inimigos ou IA
novos, outras regiões, chefes, uma UI narrativa Phaser nova ou mudanças nos
sistemas centrais.

## Identidade e contratos estáveis

- capítulo: `chapter.aguas`;
- stage: `stage.aguas.igapo-das-memorias`;
- região macro preservada: `region.aguas.igapo`;
- evento/rule: `event.aguas.igapo.eco-das-aguas`;
- diálogo: `dialogue.aguas.igapo.eco-das-aguas`;
- flag persistida: `flag.aguas.igapo.eco-das-aguas-seen`;
- saída de retorno: `exit.aguas.igapo.return-hub`;
- revisão inicial do manifesto autoral: 1.

O manifesto usa `layout.kind = authored`. O capítulo exporta um único stage e é
registrado pela composição pública usada pelo jogo e pelo World Lab. O binding
macro passa a referenciar o novo `stageId` sem `placeholder`; o hub continua com
seu placeholder legado e as demais regiões continuam `planned`.

## Mapa e representação provisória

O mapa usa somente a legenda pública de `LevelDefinition` e recursos já
renderizados:

- piso (`0`) representa ilhas de terra e passagens secas;
- parede (`1`) representa mata fechada e limite do cenário;
- pilar sólido (`2`) representa troncos, raízes e árvores emergentes;
- fosso/água (`3`) representa água escura intransponível;
- saída (`5`) ancora o retorno físico;
- spawn (`8`) marca a área inicial segura.

A geometria deve conter área inicial sem inimigos, dois caminhos exploráveis que
se separam e voltam a se comunicar, corredores estreitos, clareiras de combate,
água em massas reconhecíveis, obstáculos sólidos, ponto de interesse alcançável
e saída alcançável. Obstáculos, água, inimigos, itens, waves e saída não podem
ocupar posições inválidas nem bloquear o único caminho.

Como o renderer atual não desenha `decorations` e usa texturas genéricas por
tipo de tile, a entrega visual é uma representação provisória coerente por
geometria, paleta ambiente, água e colisões. A etapa artística posterior precisa
de tiles amazônicos para água negra, solo alagado, raízes, troncos, árvores e
vegetação, além de renderização de decoração; esta etapa não cria sprites.

## Exploração, combate e determinismo

O stage é autoral e invariável por seed. Portanto, a mesma seed e contexto
produzem bytes equivalentes no loader e os mesmos bindings físicos. Não é criado
um gerador paralelo.

Os encontros reutilizam arquétipos públicos já aceitos pela cena e são
distribuídos em clareiras com folga para esquiva. As waves possuem posições
alcançáveis, não usam água nem sólidos e deixam o spawn e a saída livres. O
retorno só é revelado pelo fluxo já existente após a limpeza do encontro, sem
alterar regras de combate, IA ou recompensa.

O progresso macro, contextos estacionados, histórico, journal idempotente,
limites de travessia, seed e saves permanecem sob `CampaignMacroRouteBinder`,
`CampaignRouter` e `CampaignRunSaveService`. Saves da revisão macro 2 são
migrados explicitamente para a nova revisão apenas quando pertencem à mesma
definição; não há migração silenciosa de saves incompatíveis.

## Eco das Águas

O conteúdo narrativo declara um rule `once` ativado por `stage.entered` para o
próprio stage. A rule inicia um diálogo breve e marca a flag persistente. O
`NarrativeEventProcessor` usa identidade de run/stage, grava evento e rule
processados e impede repetição depois de restauração. O `DialogueEngine` valida
e percorre o texto original.

A integração Phaser atual cria sessão narrativa somente no piloto modular
incremental, não ao navegar pela campanha macro. Assim, nesta etapa o Eco das
Águas fica declarativo, carregável, validado e exercitado pelo runtime headless;
uma UI/ponte de apresentação de diálogos da campanha macro fica explicitamente
pendente. Nenhum sistema de diálogo paralelo será criado.

## World Lab

O modo Campanha registra o capítulo autoral e projeta o stage real. O inspetor
deve mostrar mapa, spawn, todos os inimigos (incluindo waves), água e obstáculos
na grade, saída/anchor físico, ponto de interesse como NPC ambiental e
diagnósticos do loader/resolver/binder. O nó de Igapó deve indicar conteúdo
carregável e `placeholder legado: não`.

## Compatibilidade

- `verse_02_galeria`, `VERSE_SECTIONS` e o modo legado não são modificados;
- piloto procedural, presets, saves legados e chaves de storage permanecem
  inalterados;
- o novo stage não é inserido no array legado;
- `GameScene` recebe apenas o fallback mínimo de slot para restaurar stages
  macro não legados, coberto por teste de reload direto no Igapó;
- não há mudança em `src/combat/`, `src/procedural/`, `src/simulation/` ou
  `src/progression/`.

## Critérios observáveis e testes

1. `StageValidator` e `StageRegistry.validate()` aceitam capítulo, manifesto,
   IDs e referências sem erros.
2. `StageLoader` carrega o stage autoral e duas cargas com a mesma identidade
   são equivalentes e não compartilham mutação.
3. A grade tem spawn e saída conectados, uma bifurcação com reconexão, ponto de
   interesse alcançável e zonas abertas/estreitas observáveis.
4. Inimigos, patrols, waves e itens estão em piso alcançável; spawn, saída e
   clearance dos portais estão livres.
5. `NarrativeEventProcessor` dispara o Eco uma vez, inicia o diálogo, persiste a
   flag e retorna `duplicate`/não refaz a rule após restore; `DialogueEngine`
   percorre o texto.
6. O grafo macro determinístico referencia
   `stage.aguas.igapo-das-memorias`, preserva os bindings de ida/retorno e o
   ciclo hub → Igapó → hub → retomada.
7. Reload diretamente no Igapó restaura o stage original no adapter Phaser sem
   exigir presença no catálogo legado.
8. O World Lab abre a geometria autoral, expõe marcadores, saída e diagnósticos,
   e não rotula o stage como placeholder.
9. Caracterizações legadas continuam passando e `verse_02_galeria` permanece
   byte a byte inalterado pelo trabalho.

## Validação de entrega

Durante a implementação, executar as suítes direcionadas do novo capítulo,
loader, runtime narrativo, binding macro, integração Phaser e World Lab. Antes
da entrega executar, uma vez:

```text
npm test -- --runInBand
npm run typecheck
npm run build
npm run check:gates
git diff --check
```

Também executar smoke visual do jogo com `?macroCampaign=1` e do
`world-lab.html` quando o ambiente de navegador permitir. A homologação só pode
ser declarada para transições realizadas por movimento/interação reais; estados
não serão forçados por storage ou chamadas internas.

