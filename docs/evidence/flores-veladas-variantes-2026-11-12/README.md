# Evidências — variantes de Jardins das Flores Veladas

## Resultado

O mesmo estágio `level_08_paradiso`, revisão 2, foi homologado em Phaser nas
variantes `variant.floresta.flores-veladas.natural` e
`variant.floresta.flores-veladas.corrupted`. Ambas resultaram em **PASS** no
Edge headless real. O mapa, colisão, NPCs, diálogo, missão, duas ondas, flag,
câmera e saída são os mesmos; somente a apresentação selecionada muda.

## Direção de arte

A base pixel art conserva piso, água, limites e leitura de gameplay. Quatro
PNGs transparentes formam copas e clareiras pictóricas de grande escala. Os
SVGs formam marcos, folhagem e silhuetas. A Natural usa luz filtrada, folhas
abertas, bromélias, helicônias, orquídeas e ciano bioluminescente. A Corrompida
substitui as mesmas posições por raízes angulares, flores invertidas, fungos,
pólen mineralizado, espinhos e colunas de esporos.

Os PNGs foram produzidos com a ferramenta integrada OpenAI ImageGen, caso
`stylized-concept`, especificamente para o projeto, sem texto, marcas ou
biblioteca externa. Os prompts finais pediram: copa amazônica Natural com
trilha aberta; clareira saudável de raiz/flor/água; mutação reconhecível da
mesma copa; e mutação da clareira com flor contraída e pólen mineralizado. A
procedência completa, dimensões e hashes estão em `src/assets/flores/README.md`.

## Homologação real

| Variante | Relatório | Resultado | Duração |
|---|---|---:|---:|
| Natural | [`homologacao-natural.json`](./homologacao-natural.json) | PASS | 87.009 ms |
| Corrompida | [`homologacao-corrupted.json`](./homologacao-corrupted.json) | PASS | 88.615 ms |

Em ambas, os checks obrigatórios comprovaram carregamento de assets, alcance e
diálogo de Iaraí, encontro iniciado, dano real, duas ondas concluídas, missão,
flag restaurada, saída desbloqueada/alcançada/acionada, movimento e câmera. A
transição para outra cena permanece `UNKNOWN` não obrigatório porque o preview
individual termina em `campaign.complete`.

## Capturas Natural

| Momento | Evidência |
|---|---|
| Entrada e copa pictórica | [`natural-01-entrada.png`](./natural-01-entrada.png) |
| Descoberta e NPC | [`natural-02-dialogo.png`](./natural-02-dialogo.png) |
| Combate e núcleo fértil | [`natural-03-combate.png`](./natural-03-combate.png) |
| Conclusão e saída | [`natural-04-saida.png`](./natural-04-saida.png) |

## Capturas Corrompida

| Momento | Evidência |
|---|---|
| Entrada e transição atmosférica | [`corrupted-01-entrada.png`](./corrupted-01-entrada.png) |
| Descoberta e NPC | [`corrupted-02-dialogo.png`](./corrupted-02-dialogo.png) |
| Combate e núcleo contaminado | [`corrupted-03-combate.png`](./corrupted-03-combate.png) |
| Conclusão e saída | [`corrupted-04-saida.png`](./corrupted-04-saida.png) |

## Comparações reais

- [`comparacao-natural-corrompida-entrada.png`](./comparacao-natural-corrompida-entrada.png): o mesmo enquadramento revela mudança de paleta, piso, copa, densidade e silhueta.
- [`comparacao-natural-corrompida-nucleo.png`](./comparacao-natural-corrompida-nucleo.png): a clareira fértil se torna uma flor contraída cercada por raízes, fungos e névoa violeta.
- [`comparacao-antes-depois.png`](./comparacao-antes-depois.png): usa a captura real versionada da conversão anterior e a entrada Natural refinada; nenhum “antes” foi reconstruído.

## Impacto estático

| Métrica | Conversão anterior | Refinamento |
|---|---:|---:|
| Dimensão lógica | 120×38 | 120×38 |
| Tiles / colisões | 4.560 / 129 runs | inalterados |
| Decorações posicionadas | 33 | 38 |
| Texturas declaradas pelo capítulo | 12 | 23 |
| Novos PNGs comprimidos | 0 | 4,3 MB |
| Superfície RGBA estimada dos PNGs | 0 | ~7,7 MB |
| Objetos estáticos estimados | ~310 | ~315 |

O custo adicional de objetos é de cinco decorações sem física. As duas
variantes compartilham mapa e batching; não duplicam tiles nem corpos. Os PNGs
foram reduzidos de aproximadamente 10,4 MB para 4,3 MB. O tempo de homologação
inclui navegação e combate e não equivale a benchmark gráfico. FPS, memória
real do processo e GPU não são expostos pelo homologador e permanecem
`UNKNOWN`.

## Limitações

- A variante é escolhida no loader/World Lab; não muda em tempo real por flag.
- O homologador gera quatro checkpoints por execução, não uma captura para cada
  subtítulo do pedido. As oito capturas reais cobrem as duas variantes sem
  duplicação artificial.
- O texto do diálogo foi comprovado pelo ciclo automatizado, mas a captura do
  checkpoint registra a região/NPC e pode ocorrer logo após o modal fechar.
- A Rota da Floresta completa continua indisponível enquanto Fungos e Copas
  permanecerem planejados.
