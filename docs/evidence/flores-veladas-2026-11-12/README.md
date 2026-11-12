# Evidências — Jardins das Flores Veladas

## Identidade e migração

- **ID original:** `level_08_paradiso`
- **ID final:** `level_08_paradiso`
- **Título original:** Paradiso Gardens
- **Título final:** Jardins das Flores Veladas
- **Capítulo autoral:** `chapter.floresta.flores-veladas`
- **Região macro:** `region.floresta.flores`

O ID persistido e a posição 8 de `ALL_LEVELS` foram preservados. O wrapper de
`legacy.levels` deixou de registrar somente esse ID, e o capítulo autoral passou
a ser seu único proprietário no `StageRegistry`. O fluxo clássico continua
obtendo a fase pelo mesmo índice; o fluxo modular oferece a visita individual e
o binding da Rota da Floresta.

## Auditoria anterior

A fase original tinha 40×25 tiles, spawn em `19,20`, marcador de Fortitudo em
`19,10`, quatro blocos retangulares de água, quatro itens, dezenove decorações
celestiais e nenhuma saída física declarada. Não tinha NPC, diálogo, missão,
evento ou encontro declarativo. Dependia da ordem de `ALL_LEVELS` para avançar.

## Conteúdo convertido

O mapa passou a 120×38 tiles com trilha sinuosa oeste→leste, quatro desvios que
retornam à rota, onze clareiras orgânicas e três igarapés. Iaraí, Cantora das
Flores, conduz a missão principal; Tucum, Observador de Asas, oferece a pista
ambiental opcional. Duas ondas usam cinco inimigos existentes como criaturas
territoriais. A missão restaura o coro, grava a flag
`flag.floresta.flores-veladas.coro-restaurado`, libera e aciona a saída física.

O capítulo declara seu mapa, apresentação, NPCs, diálogos, missão, eventos,
encontro, efeitos, catálogo individual e binding macro pelos contratos
existentes. Nenhuma alteração foi feita em `GameScene`, IA, combate, física,
câmera, saves ou serializadores.

## Arte original

Oito SVGs locais definem a identidade: chão de folhiço, árvore monumental,
bromélias, arco de helicônias, véu de orquídeas, ninho de polinizadores, galho
de copa e feixe de luz. Origem, dimensões e SHA-256 estão em
`src/assets/flores/README.md`. Tiles técnicos e sprites reutilizam o pacote
Puny já registrado; os efeitos usam somente os kinds suportados.

## Homologação Phaser

O relatório [`homologacao-runtime.json`](./homologacao-runtime.json) registra
`PASS` em 2026-11-12. O Edge headless real comprovou:

- carregamento da fase;
- movimento e câmera dentro dos limites;
- alcance e diálogo de Iaraí;
- início, dano e conclusão das duas ondas;
- dano real ao jogador;
- conclusão da missão e atualização da flag;
- desbloqueio, alcance e acionamento da saída.

A transição para outra cena permaneceu `UNKNOWN` e não obrigatória, pois a
visita individual termina em `campaign.complete`. Não foi executada uma
homologação da Rota da Floresta completa: Fungos e Copas ainda são conteúdo
planejado.

## Capturas reais

| Evidência | Arquivo |
|---|---|
| Entrada, título e primeira leitura da trilha | [`01-entrada.png`](./01-entrada.png) |
| Iaraí e vegetação diferenciada | [`02-primeiro-npc.png`](./02-primeiro-npc.png) |
| Combate, clareira e Árvore das Mil Pétalas | [`03-combate-e-clareira.png`](./03-combate-e-clareira.png) |
| Missão concluída, luz e saída acionada | [`04-conclusao-e-saida.png`](./04-conclusao-e-saida.png) |

O homologador genérico produz quatro checkpoints para uma fase individual. Não
foram duplicadas imagens para simular as sete categorias solicitadas. A
tentativa adicional em navegador visível abriu o preview local, mas o canvas do
Opera permaneceu preto; por isso somente as capturas confiáveis do runtime
automatizado foram versionadas. Não havia captura real anterior de Paradiso
Gardens no repositório; a comparação anterior usa a auditoria estrutural acima,
sem fabricar um “antes”.

## Comparação de custo visual

| Métrica estática | Paradiso legado | Flores Veladas |
|---|---:|---:|
| Dimensão lógica | 40×25 | 120×38 |
| Tiles | 1.000 | 4.560 |
| Decorações | 19 | 33 |
| Texturas declaradas | 11 (fallback legado) | 12 |
| Render textures de terreno | 0 | 75 chunks de 8×8 |
| Corpos/execuções de colisão | 186 sprites por tile | 129 runs invisíveis |
| Objetos estáticos estimados antes de atores/UI | ~1.205 | ~310 |

O mapa novo é 4,56 vezes maior, mas cruza o limiar de batching do
`StageMapRenderer`; a estimativa de objetos estáticos cai cerca de 74%. Os 310
objetos estimados incluem 75 chunks, 129 runs, 33 decorações e aproximadamente
73 objetos ambientais/efeitos no pico. A homologação durou 50,447 s, incluindo
movimento e combate automatizados. Memória, FPS e GPU não são expostos pelo
homologador atual e permanecem `UNKNOWN`; nenhum valor de software rendering
foi apresentado como desempenho de GPU.

## Limitações restantes

- O ID técnico conserva o nome histórico `paradiso` por compatibilidade.
- Tucum é objetivo opcional porque a homologação genérica interage apenas com o
  NPC principal; seu diálogo e acesso físico continuam testados estruturalmente.
- A Rota da Floresta não pode ser concluída até Fungos e Copas receberem
  conteúdo real.
- Não existe comparação fotográfica “antes/depois” nem medição de FPS/memória;
  ambos são registrados como limitações, não como PASS.
