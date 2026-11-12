# Conversão de Paradiso Gardens em Jardins das Flores Veladas

**Data:** 2026-11-12  
**Estado:** especificação anterior à implementação  
**Continuidade:** converte o conteúdo legado `level_08_paradiso` em um capítulo
autoral sem alterar sua identidade persistida. Preserva os contratos das Etapas
9.5–9.14, o formato `LevelDefinition` e a sequência clássica de níveis.

## Auditoria da origem

`Paradiso Gardens` existe em `src/data/LevelData.ts` com o ID técnico
`level_08_paradiso`. A fase mede 40×25 tiles (1.280×800 px), tem spawn em
`19,20`, marcador de chefe em `19,10`, quatro blocos retangulares de água,
nenhum inimigo comum, quatro itens, dezenove decorações celestiais, chefe
`fortitudo`, dificuldade 8 e tempo de referência de 600 segundos. Não declara
saída física em `exits`; o avanço depende da sequência de `ALL_LEVELS`.

O ID participa do índice `ALL_LEVELS`, do fluxo clássico de `GameScene`, do
`LegacyLevelAdapter`, do capítulo sintético `legacy.levels`, da caracterização
dos dez níveis e de uma fixture visual do World Lab. O índice clássico anterior
é `level_07_witches_crypt` e o seguinte é `level_09_limbo`. Não foi encontrada
chave de save específica da fase; a identidade persistível é o próprio ID.

`region.floresta.flores` existe na revisão 1 do esqueleto macro, como terceira
região da `route.floresta`, dificuldade 1, ainda com conteúdo `planned`. A
região pode receber conteúdo real pelo binding declarativo do catálogo de
capítulos, sem mudar a campanha clássica. O tema `theme.paradiso-garden` está
`planned`; a conversão não o reivindica como capability suportada e declara um
tema local por `visualResources`, mantendo apenas `biome.garden`, que é
suportado.

## Identidade e migração

- O ID final permanece `level_08_paradiso`; não existe alias nem segundo ID.
- O título passa a ser **Jardins das Flores Veladas**.
- O capítulo autoral é `chapter.floresta.flores-veladas` e possui uma fase.
- `ALL_LEVELS` conserva a fase na posição 8, agora com o novo mapa e conteúdo,
  para manter o fluxo clássico e o editor legado.
- `LegacyStageAdapter` deixa somente esse ID fora de `legacy.levels`; o módulo
  autoral assume o ID no `StageRegistry`, evitando colisão e duplicidade.
- A saída autoral encerra a visita modular com `campaign.complete`; a
  continuidade clássica para `level_09_limbo` permanece no índice
  `ALL_LEVELS`, sem criar uma dependência do capítulo autoral sobre o legado.
- O binding de `region.floresta.flores` torna a fase elegível à composição
  macro sem inventar ligações para Fungos ou Copas, que continuam planejadas.
- Saves e chaves legadas não mudam. A revisão 1 do novo manifesto passa a ser
  a representação modular vigente do ID preservado.

## Direção narrativa

A jardineira-cantora **Iaraí** apresenta o silêncio que interrompeu a floração.
O observador de polinizadores **Tucum** amplia o mundo e explica que mariposas,
abelhas e beija-flores não são acessórios do jardim: seus ritmos acordam as
flores. O jogador segue rastros de pólen, atravessa uma primeira defesa
territorial, alcança a Clareira Sem Voz e recompõe o pulso do jardim.

A missão `mission.floresta.flores-veladas.reacender-coro` exige conversar com
Iaraí e concluir o encontro declarativo; encontrar Tucum é um objetivo opcional
que aprofunda a investigação. A conclusão marca a
flag estável `flag.floresta.flores-veladas.coro-restaurado`, desbloqueia a saída,
conclui a fase e concede recompensa idempotente. Eventos ambientais curtos
acompanham entrada, NPCs, combate e restauração sem criar um motor narrativo.

## Geometria panorâmica

O novo mapa mede 120×38 tiles. Uma trilha oeste→leste sinuosa conecta sete
regiões: Portal das Folhas, Alameda das Bromélias, Arco das Heliconias, Ninho
dos Polinizadores, Clareira Sem Voz, Árvore das Mil Pétalas e Passagem do
Perfume. Pequenos braços retornam à trilha e contêm itens ou marcos; igarapés
rasos, copas e maciços vegetais formam limites orgânicos.

Spawn, dois NPCs, inimigos, itens e saída ficam em solo alcançável. O tile 5 da
saída ocupa uma passagem física reconhecível no leste. A largura mínima da rota
considera o corpo real do jogador e não depende de teleporte. O
`stage-plan.json` descreve regiões, rota, objetivos, encontro e saída com os
mesmos IDs do módulo.

## Encontros

Um encontro declarativo substitui o chefe obrigatório e contém duas ondas:

1. dois `affinity` de nível 2 defendem o Ninho dos Polinizadores;
2. um `applaud` e dois `affinity` de níveis 2–3 guardam a clareira após breve
   intervalo.

Os arquétipos já suportados são reinterpretados somente pela apresentação
visual. Não há alteração de IA, combate, física ou progressão.

## Direção de arte e assets

A paleta combina verdes úmidos, roxo de sombra, rosa de orquídea, laranja de
helicônia e ciano bioluminescente. O chão usa um atlas SVG local de quatro
variantes; copas e água reutilizam frames validados do Puny World como base
técnica, enquanto os marcos que definem a identidade são SVGs originais:

| Arquivo | Dimensão | Uso |
|---|---:|---|
| `flores-forest-floor.svg` | 128×32 | quatro pisos de folhiço e musgo |
| `flores-monumental-tree.svg` | 192×224 | Árvore das Mil Pétalas |
| `flores-bromeliad-cluster.svg` | 96×64 | bromélias e folhas largas |
| `flores-heliconia-arch.svg` | 160×128 | marco natural da trilha |
| `flores-orchid-veil.svg` | 128×96 | cortina de orquídeas |
| `flores-pollinator-nest.svg` | 128×96 | ninho ritual e pista ambiental |
| `flores-canopy-bough.svg` | 224×80 | primeiro plano e profundidade |
| `flores-light-shaft.svg` | 112×224 | luz filtrada nas clareiras |

Todos são originais do projeto, sem fonte de terceiro, documentados com
dimensões e SHA-256. O pipeline de `BootScene`, o registro visual e o
`StageMapRenderer` existentes são reutilizados. Folhas, luz local, névoa,
pulso, vaga-lumes e balanço de folhagem usam effects suportados.

## Catálogo e disponibilidade

O manifesto publica `availability: available`, participação
`narrative-milestone`, região `region.floresta.flores`, bioma `garden`, faixa
de dificuldade 3–6 e revisita `checkpoint`. Isso mantém a fase disponível em
**Jogar Fase** e reservada à posição narrativa na campanha. O catálogo liga a
região somente após manifesto, diálogo e evento reais existirem.

## Critérios observáveis

1. Não há dois módulos registrados com `level_08_paradiso`; o capítulo legado
   não o contém e o capítulo autoral o contém exatamente uma vez.
2. `ALL_LEVELS[7]` mantém o ID, agora com título, mapa 120×38, spawn, saída e
   direção artística novos; níveis 7 e 9 mantêm sua ordem.
3. O plano valida e corresponde aos IDs, regiões, NPCs, encontro e saída.
4. Mapa e manifesto validam; spawn, NPCs, inimigos, itens, ramificações e saída
   são alcançáveis por passagem compatível com o corpo do jogador.
5. Os dois NPCs, diálogos, missão, objetivos, flags e eventos são válidos e a
   progressão estática resulta em PASS.
6. O catálogo mostra a fase como carregável, disponível individualmente e
   `narrative-reserved`; `region.floresta.flores` resolve para o mesmo ID.
7. Os oito SVGs existem, têm dimensões e hashes documentados, carregam pelo
   pipeline local e todos os IDs usados pelas decorações resolvem.
8. A homologação Phaser em 1280×720 comprova entrada, trilha, primeiro NPC,
   vegetação distinta, primeiro combate, clareira, conclusão e saída.
9. Capturas antes/depois e relatório de display objects, texturas, memória
   quando disponível e FPS ficam versionados; FPS headless é identificado como
   aproximação, não como medida de GPU.
10. `npm run chapter -- plan validate`, `npm run chapter -- validate`, preview
    headless, testes dirigidos, gates, build, suíte completa e
    `git diff --check` passam após a última alteração relevante.

## Limitações explícitas

- O único modo de início de encontro suportado é `stage-ready`; a progressão
  espacial vem da geometria, do atraso das ondas e das posições, não de um
  gatilho de região inexistente.
- A região recebe um binding real, mas a Rota da Floresta não se torna
  completável enquanto Fungos e Copas permanecerem planejadas.
- A exigência de commit prévio da SPEC não pode ser materializada porque o
  pedido proíbe commits. A ordem é preservada no worktree e o registro mantém
  `Commit: pendente`.
