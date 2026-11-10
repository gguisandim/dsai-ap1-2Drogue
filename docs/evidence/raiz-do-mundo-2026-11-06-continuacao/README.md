# Floresta das Raízes — revisão artística continuada

Capturas 1254×627 do runtime Phaser real, feitas com
`npm run homologate -- --stage stage.raiz-do-mundo.santuario --capture`. Cada
imagem percorre a fase com o corpo físico do jogador e captura o ponto indicado;
a arte não altera colisão nem caminhabilidade.

| Ponto | Captura |
|---|---|
| Entrada da floresta | [capture-entrada.png](./capture-entrada.png) |
| Trilha dos Vestígios | [capture-trilha.png](./capture-trilha.png) |
| Primeiro confronto | [capture-primeiro-combate.png](./capture-primeiro-combate.png) |
| Combate em runtime de campanha | [capture-combate.png](./capture-combate.png) |
| Guardião da Seiva | [capture-guardiao.png](./capture-guardiao.png) |
| Aproximação do santuário | [capture-aproximacao.png](./capture-aproximacao.png) |
| Coração Ancestral | [capture-santuario.png](./capture-santuario.png) |
| Passagem das Águas | [capture-saida.png](./capture-saida.png) |
| Transição para o Igapó | [capture-transicao-igapo.png](./capture-transicao-igapo.png) |

`capture-combate.png` e `capture-transicao-igapo.png` vêm da homologação de
campanha (`npm run homologate -- --campaign`), que concluiu missão, flag, saída
física e transição para `stage.aguas.igapo-das-memorias`. Os relatórios
correspondentes estão em [captura-visual.json](./captura-visual.json) e
[homologacao-campanha.json](./homologacao-campanha.json).

O corredor contínuo usa as composições ambientais do lote de 2026-11-06; a
entrada e a saída recebem `world-root-entrance.png` e `world-root-passage.png`.
A colisão continua vindo exclusivamente do mapa lógico de 116×36 tiles.
