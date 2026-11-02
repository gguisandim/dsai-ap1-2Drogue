# Registro de prompt: geometria e variantes visuais do Igapó

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-02-redesign-igapo-geometria-variantes`
- Data: `2026-11-02`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-02-redesign-igapo-geometria-e-variantes.md`
- Commit: `pendente`
- Execução: `Testes dirigidos após ajuste: 2 suítes/9 testes aprovados. Fechamento: check:gates OK; build OK (aviso não bloqueante de chunk >500 kB); npm test 87 suítes/1104 testes aprovados; git diff --check OK. Preview Phaser/World Lab Natural e Corrompida, movimento e animação/cooldown de ataque observados.`

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-02-redesign-igapo-geometria-e-variantes.md`
- `src/presentation/assets/bootIgapoAssets.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/scenes/BootScene.ts`
- `src/assets/aguas/README.md`
- `src/assets/aguas/igapo-canoa.svg`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/igapoPresentations.test.ts`
- `src/tests/stageVisualPresentation.test.ts`
- `src/tests/worldLabPoi.test.ts`
- `src/tests/worldLabPresentation.test.ts`

## Prompt efetivamente recebido

```text
Continue o redesign do Igapó, mas não considere suficiente apenas reorganizar decorações ou remover árvores.

**Autorizo redesenhar o mapa lógico autoral**, incluindo margens, ilhas e canais, desde que você atualize e valide colisões, spawns, saídas físicas, alcançabilidade e testes, preservando IDs e compatibilidade dos saves existentes.

Priorize:

1. Margens orgânicas com transições reais entre água e terra.
2. Vegetação densa em grupos, árvores grandes e raízes parcialmente submersas.
3. Landmarks como ruínas, troncos monumentais e uma canoa.
4. Água com profundidade, reflexos e animação sutil.
5. Clareiras de combate que não pareçam retângulos vazios.
6. Duas apresentações do mesmo mapa: Natural, com floresta saudável; Corrompida, com desmatamento, petróleo, resíduos e fumaça.
Use a referência visual como meta artística. Reutilize os registries e renderizadores existentes.

Execute o preview no Phaser, capture o resultado e refine a composição visual. Não encerre só porque os testes passaram. Não faça commit ou push.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente` antes da consolidação; não criar commit nem
  executar push conforme solicitado.
- Evidências: `.tmp/evidence/igapo-natural-refined.png`,
  `.tmp/evidence/igapo-natural-combate-refinado.png`,
  `.tmp/evidence/igapo-corrompida-refined.png` e
  `.tmp/evidence/igapo-corrompida-contaminacao-refinada.png`.
