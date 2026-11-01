# Etapa 9.8.1 — Correção jogável e direção de arte do Igapó

**Data:** 2026-11-01

**Estado:** especificação anterior à implementação

**Continuidade:** corrige a entrega da Etapa 9.8 sem substituir seus contratos.
Mantém `SPEC/2026-11-01-etapa-9-8-fases-panoramicas-igapo.md` como base
arquitetural e restringe esta etapa a três frentes: representação dos inimigos,
direção de arte das duas fases da Rota das Águas e progressão narrativa até o
Coração Corrompido.

## Diagnóstico

### Sprites de inimigos

As folhas derivadas `puny-warrior-red-128.png` e `puny-archer-purple-128.png`
foram produzidas por um recorte manual que escalava uma faixa da linha de
origem e depois fatiava a faixa em células de 128×114. O resultado contém, em
cada célula, fragmentos do personagem vizinho: as bordas alfa atingem as quatro
extremidades da célula e há duas metades de personagens lado a lado. Os frames
repetidos (`0,1,2,1`) receberam escalas diferentes, deformando a silhueta e
deslocando o ponto de apoio. Nenhum ajuste de `displaySize`, origem ou hitbox
corrige um recorte que já perdeu a integridade da imagem.

### Progressão percebida

O fluxo macro prepara a transição no binder antes de processar
`stage.exit.requested`. O processamento narrativo chama
`CampaignNarrativeAccessBinder.synchronize`, que inspeciona o roteador enquanto
o binder ainda tem uma preparação pendente. A inspeção falha com
`transition-in-progress`, a saída é cancelada e o jogador permanece na fase. A
interação com o Vestígio também descarta o resultado de `interactNpc`, então as
consequências (`mission.completed` → `stage.complete` → `exit.unlock`) não são
projetadas de imediato no acesso da campanha. Por fim, a saída do Igapó não
declara condição, a interface mostra apenas o objetivo de combate e o portal só
surge quando todas as ondas terminam.

## Correções

### Folhas de personagens

- Adicionar um gerador determinístico em Node para as duas folhas derivadas,
  sem dependência externa, usando somente `zlib` da biblioteca padrão.
- Para cada animação (`walk`, `attack`, `hurt`), amostrar as três poses da
  direção frontal da planilha de origem (colunas 0–2; linha 2 para o guerreiro
  e linha 3 para o arqueiro no ataque).
- Aplicar um recorte fixo e uma escala uniforme inteira a todas as poses,
  centralizando o personagem no canvas de 128×114. Nenhum frame pode conter
  pixels de uma célula vizinha.
- Manter o contrato existente: 4 colunas por 3 linhas, frames 0–3 caminhada,
  4–7 ataque e 8–11 dano, com repetição `0,1,2,1`.
- Documentar no catálogo de assets o novo método de derivação e atualizar os
  hashes verificados.
- Não alterar `Enemy`, `RangedEnemy` ou `BossEnemy` além do necessário para
  conferir a apresentação visual.

### Direção de arte do Igapó

- Manter o mapa autoral de 96×30, a topologia oeste–leste, os dois desvios e a
  conectividade exigida pela Etapa 9.8.
- Substituir bordas retangulares por margens irregulares, enseadas rasas e
  pequenas ilhas não bloqueantes.
- Ampliar o conjunto de decorações para floresta sazonalmente inundada:
  árvores emergentes de alturas diferentes, palmeiras, moitas, juncos, pedras
  e tapetes de sombra. Usar apenas frames já registrados do Puny World.
- Distribuir vegetação ao longo das margens e sobre a água para produzir
  transições orgânicas; reservar a camada `foreground` para copas distantes das
  rotas para não ocultar inimigos.
- Declarar efeitos visuais existentes (`water-shimmer`, `mist`, `foliage-sway`)
  nas apresentações, reutilizando o renderer atual.
- Corrigir os frames semânticos atuais (`stump`, `bush`, `palm`) que apontam
  para objetos incompatíveis com a vegetação pretendida.

### Coração Corrompido

- Manter 88×30, `StageModule` independente e apresentação Sombrio como padrão.
- Recompor o mapa com composição própria: enseadas contaminadas, passagens
  quebradas, ilhas pequenas e clareira final distinta.
- Usar vegetação e água existentes com contraste local, sem depender de tint
  extremo como substituto de material.
- Preservar encontro, missão, diálogos e saídas declarativas; adicionar
  condições de saída coerentes com a conclusão da missão.

### Progressão narrativa

- Em `GameScene`, processar `stage.exit.requested` antes de preparar a
  transição macro, de modo que o acesso narrativo seja sincronizado sem uma
  preparação pendente.
- Propagar o resultado de `interactNpc` por `reportNarrativeSignal`, para que
  `mission.completed`, `stage.complete` e `exit.unlock` atualizem o acesso da
  campanha e a disponibilidade das saídas no mesmo commit narrativo.
- Declarar condição nas saídas autorais do Igapó e do Coração Corrompido. A
  saída só fica disponível depois de `stage.complete`/`exit.unlock` projetados
  em `unlockedStageExitIds`.
- Revelar a saída quando a narrativa liberar a fase, além da revelação ao
  limpar o encontro. Atualizar disponibilidade, tint e alpha de portais já
  revelados.
- Mostrar a missão narrativa como objetivo principal do HUD, com o combate
  como linha complementar. Ao concluir, indicar explicitamente que a saída
  está liberada.
- Exibir o prompt de interação também para saídas legíveis.
- Não alterar o isolamento de `stagePreview`, as chaves de save ou a política
  de composição das campanhas.

## Critérios observáveis

1. `node scripts/generate-puny-character-sheets.mjs` regenera hashes estáveis e
   cada frame contém exatamente um personagem, sem pixels de célula vizinha.
2. As folhas derivadas mantêm 512×342, 12 frames, animações `walk`, `attack` e
   `hurt`, e o jogo exibe inimigos íntegros no navegador.
3. O Igapó mantém 96×30, spawn, Vestígio e saída alcançáveis, além dos dois
   desvios da Etapa 9.8.
4. A composição do Igapó usa árvores de alturas diferentes, palmeiras, juncos,
   pedras, sombras e água com margens irregulares; o Sombrio permanece legível.
5. O Coração Corrompido mantém 88×30, encontro e missão próprios, geometria
   distinta e conclusão coerente.
6. A interação com o Vestígio conclui a missão, registra a descoberta, libera a
   saída e a torna visível no mesmo fluxo.
7. Em campanha clássica, atravessar a saída do Igapó carrega o Coração
   Corrompido sem erro de binder nem exceção por fase.
8. HUD mostra a missão como objetivo principal e o combate como complemento.
9. Testes dirigidos cobrem derivador de sprites, conectividade, liberação de
   saída, objetivo narrativo e transição entre as duas fases.
10. Fechamento com `npm run check:gates`, `npm run build`,
    `npm test -- --runInBand` e homologação real com screenshots em
    `.tmp/evidence/`.

## Testes previstos

- derivador: dimensões, hashes, bbox por célula e ausência de vazamento entre
  frames;
- Igapó: manifesto, conectividade, desvios, poços, decorações e saída;
- Coração: mapa distinto, encontro, missão e saídas;
- narrativa e campanha: `npc.interacted` → missão concluída → saída liberada →
  transição para o Coração;
- HUD: prioridade da missão sobre o combate;
- regressão dirigida de `GameScene`, binder e modos existentes.

## Limitações

- Não serão adicionados assets novos; a vegetação usa apenas frames CC0 já
  incorporados. Troncos caídos e raízes isoladas não existem como props no
  pacote disponível e serão representados por composição de árvores, pedras,
  juncos e sombras, com a limitação registrada.
- A homologação visual depende de execução real no navegador; testes unitários
  não substituem screenshots e navegação manual.
