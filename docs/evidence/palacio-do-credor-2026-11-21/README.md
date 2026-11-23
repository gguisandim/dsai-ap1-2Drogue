# Palácio do Credor — evidências de homologação

Data: 2026-11-21/22
Capítulo: `chapter.final.palacio-do-credor`
Fase: `stage.final.palacio-do-credor`
Saída: `exit.final.palacio-do-credor.complete`

Esta pasta contém capturas reais do Phaser e os relatórios
`umbra.stage-homologation.report` v1 gerados pelo homologador existente. Nenhuma
imagem conceitual é usada como substituta de captura de runtime.

## Resultado final

| Execução | Cenário | Variante | Resultado |
|---|---|---|---|
| Runtime authored | `authored` | Decadência (padrão) | **PASS** |
| Captura de marcos | `visual-capture` | Decadência | **PASS** (8/8) |
| Captura de marcos | `visual-capture` | Corrompido | **PASS** (8/8) |
| Playtest estático | geometria + narrativa | — | **PASS** (0 falhas; 4 UNKNOWN de execução real) |

A execução de runtime aprovou: carregamento, alcance do NPC, diálogo, início do
encontro, dano real em inimigos, dano real no jogador, conclusão do encontro,
desbloqueio da saída, alcance da saída, acionamento da saída, missão concluída,
flag atualizada, câmera e movimento. A transição de cena permanece **UNKNOWN**
porque o preview individual não carrega a fase seguinte; isso é uma limitação
declarada do modo, não uma falha da fase.

## Capturas

### Runtime

| Arquivo | Conteúdo |
|---|---|
| `01-loaded.png` | fase carregada no Phaser |
| `02-npc-dialogue.png` | Aruã na Câmara de Revelação, diálogo real |
| `03b-boss-fight.png` | confronto real, onda 4/4, Credor em cena |
| `03-combat.png` | arena após a vitória, missão concluída e caminho liberado |
| `05-exit.png` | resolução e portal de saída |

### Decadência — `capture-decadencia/`

`capture-aproximacao.png`, `capture-entrada.png`,
`capture-jardins-externos.png`, `capture-galerias.png`,
`capture-camara-revelacao.png`, `capture-antessala.png`,
`capture-arena.png`, `capture-resolucao.png`.

### Corrompido — `capture-corrompido/`

Os mesmos oito marcos, com piso, portal, torre, arcada, trono, selo, copa,
estandartes, estátuas, correntes, raízes, efeitos, névoa e áudio próprios. O
relatório registra `variantId: variant.final.palacio.corrompido`.

## Histórico real de execuções

O caminho até o PASS incluiu falhas reais, corrigidas sem alterar HP em runtime,
teletransporte ou vitória forçada:

| Tentativa | Resultado | Causa observada | Correção |
|---|---|---|---|
| 1 | FAIL / UNKNOWN | combate excedeu o tempo limite com 11 inimigos e chefe de 1600 HP | encontro reduzido; orçamento de combate do homologador ampliado |
| 2 | FAIL | jogador morreu durante o chefe | campo autoral `hp` no encontro; poções adicionais; alvo de cura mais próximo no homologador |
| 3 | PASS | — | — |
| 4 | FAIL | `stage.complete` no evento de missão encerrava a cena antes da saída física | conclusão movida para evento de `stage.exit.requested`, padrão do template |
| 5 | FAIL | bot ultrapassava o tile de saída no extremo leste | saída movida uma célula para dentro da câmara de resolução |
| 6 | PASS | — | resultado final |

As capturas de marcos foram refeitas após o ajuste da saída.

## Assets

Todos os assets são autorais e determinísticos:

- `src/assets/palacio/` — 21 SVGs de arquitetura, vegetação, selos, pisos e
  variantes corrompidas, mais `credor-sheet.png` (512×342, 4×3 quadros 128×114).
- Gerador: `scripts/generate-palacio-assets.mjs`.
- Hashes, dimensões, licença e procedência: `src/assets/palacio/README.md`.
- Não foi usada ferramenta de geração de imagens; nenhum asset de terceiro foi
  incorporado.

## Limitações declaradas

- A transição individual para outra fase é UNKNOWN no preview.
- O `BossEnemy` existente executa o confronto; padrões de ataque adicionais e
  múltiplas fases próprias do Credor permanecem planejados.
- O epílogo encerra a fase e grava flags/progressão, mas a tela de vitória e a
  `CreditsScene` de campanha não foram reescritas nesta entrega.
- A referência macro `final.palacio-do-credor` continua planejada no
  `UMBRA_CAMPAIGN_SKELETON`, com seu requisito de milestone preservado.
