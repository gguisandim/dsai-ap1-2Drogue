# Registro de prompt: Etapa 10.0 — Raiz do Mundo

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-10-0-estetica-efeitos-capitulo-inicial`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-10-0-estetica-efeitos-capitulo-inicial.md`
- Commit: `pendente`
- Execução: `testes dirigidos aprovados (42 casos de integração/preview/ambiente e 7 casos próprios); npm run check:gates aprovado; npm run build aprovado (typecheck e Vite); npm test -- --runInBand aprovado (83 suítes, 1073 testes); git diff --check aprovado; homologação por UI indisponível porque o controlador não conseguiu determinar a URL do navegador`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-10-0-estetica-efeitos-capitulo-inicial.md`
- `SPEC/README.md`
- `prompts/47-etapa-10-0-estetica-efeitos-capitulo-inicial.md`
- `src/assets/world-root/README.md`
- `src/assets/world-root/world-root-sanctuary.png`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/presentation/assets/bootWorldRootAssets.ts`
- `src/presentation/assets/worldRootAssetCatalog.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/scenes/BootScene.ts`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/chapters/raiz-do-mundo/index.ts`
- `src/stages/chapters/raiz-do-mundo/visuals.ts`
- `src/stages/chapters/raiz-do-mundo/worldRootSanctuary.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/worldRootSanctuary.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 10.0 — Raiz do Mundo: Direção de Arte e VFX

Implemente a primeira fase fixa do **Umbra Trail**, provisoriamente chamada **Raiz do Mundo**.

**Prioridade absoluta: resultado visual.** A fase deve parecer um santuário amazônico ancestral de um RPG 2D pixel art profissional, inspirado na imagem de referência enviada pelo usuário.

Não priorize narrativa, novas mecânicas ou infraestrutura. Execute as mudanças necessárias e entregue uma fase visualmente convincente, jogável e demonstrável.

## 1. Inspeção rápida

Leia `AGENTS.md`, as SPECs 9.7A–C e inspecione:

- `src/stages/`
- `src/stages/chapters/`
- `src/examples/chapter-template/`
- `src/examples/chapters/`
- `src/assets/puny/`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/scenes/GameScene.ts`
- `src/devtools/world-lab/`
- Pipeline de assets, iluminação, partículas e animações do Phaser.

Verifique `git status --short`. Preserve mudanças existentes.

Não faça refatorações preventivas. Reutilize o que já funciona.

## 2. Criar o cenário

Criar uma fase autoral independente, utilizando a CLI e os contratos existentes quando possível.

**Composição visual obrigatória:**

- Árvore colossal como elemento central dominante.
- Altar circular de pedra ao pé da árvore.
- Quatro monólitos ou ruínas com inscrições.
- Raízes grandes envolvendo estruturas antigas.
- Floresta amazônica densa nas bordas.
- Vegetação em múltiplas camadas.
- Água rasa, folhagens, cipós e detalhes ambientais.
- Cristais, fungos ou plantas bioluminescentes.
- Clareira central legível para movimentação e combate.

A árvore e o altar devem funcionar como pontos focais da composição. Evite um mapa que pareça apenas uma grade repetitiva de tiles.

Use a referência visual como direção de arte, não como imagem a ser copiada literalmente.

## 3. Assets e qualidade

Reutilize o pipeline real da 9.7C e os recursos Puny existentes. Complemente com assets adicionais apenas quando necessários, verificando licença e procedência.

**Não tente representar a árvore monumental apenas ampliando um sprite pequeno ou aplicando tint em placeholders.**

Se os assets existentes forem insuficientes, produza recursos locais originais compatíveis com pixel art ou integre recursos gratuitos de licença verificada.

Priorize qualidade e coerência estética em vez de quantidade de objetos.

## 4. Implementar VFX reais

Crie efeitos ativos no Phaser, usando sistemas existentes e extensões mínimas:

- Vaga-lumes e partículas luminosas em movimento.
- Névoa ambiental suave e animada.
- Brilho pulsante nas inscrições e no altar.
- Partículas espirituais ascendendo próximo à árvore.
- Luzes locais com oscilação sutil.
- Água com animação discreta.
- Camadas de vegetação criando profundidade.
- Pequenos efeitos ambientais para movimento e interação.

Os efeitos devem estar visíveis durante o gameplay, não apenas declarados em contratos.

**Evite efeitos exagerados, bloom intenso, partículas excessivas ou perda de legibilidade.**

Garanta limpeza correta de timers, partículas e objetos no shutdown.

## 5. Integrar ao jogo

Utilize `StagePresentation`, `StageVisualRegistry`, `StageMapRenderer`, `StageLoader` e os registries existentes.

A nova fase deve:

- Ser acessível pelo preview visual.
- Ser executável em sessão individual.
- Ter spawn e circulação válidos.
- Manter NPC e encontros técnicos mínimos para teste.
- Permitir conclusão e retorno ao menu.
- Ser inspecionável no World Lab.

Prepare a fase como **abertura fixa da campanha**, anterior à seleção procedural. Não a inclua automaticamente entre as nove fases sorteadas.

Se essa integração exigir alterações maiores na composição, mantenha o capítulo jogável isoladamente e documente a ligação pendente. Não quebre as políticas existentes.

## 6. Preservar o motor

Não alterar:

- Combate e IA.
- Geração procedural.
- Saves.
- Composição das campanhas existentes.
- Sistemas narrativos.
- Resolver ou binder de saídas.

O mapa novo pode ter geometria autoral própria. Depois de definida, efeitos e variantes visuais não podem modificar suas colisões ou sua topologia.

Não introduza condicionais específicas de `Raiz do Mundo` na `GameScene`.

## 7. Homologação visual obrigatória

Execute o jogo no navegador, preferencialmente com Vite e Edge/Chrome via CDP.

Verifique em 1280×720:

1. Leitura geral da composição.
2. Árvore e altar como foco visual.
3. Densidade e diversidade da vegetação.
4. Animações e partículas funcionando.
5. Profundidade e ordem de renderização.
6. Legibilidade do personagem e inimigos.
7. Ausência de texturas faltantes.
8. Ausência de erros no console.
9. Navegação, interação e conclusão.
10. Desempenho sem degradação evidente.

Produza capturas em `.tmp/evidence/` e compare o resultado com a direção estética solicitada.

**Se o cenário ainda parecer uma demonstração técnica ou um tileset espalhado, refine a composição antes de encerrar.**

Se o navegador estiver indisponível, não invente evidências; documente a pendência.

## 8. Testes e documentação

Crie:

`SPEC/2026-10-31-etapa-10-0-estetica-efeitos-capitulo-inicial.md`

Atualize `SPEC/README.md` e registre o próximo prompt sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`. Verifique se o número 47 está disponível.

Adicione testes para assets, registros, inicialização, efeitos, geometria, saída e compatibilidade.

Execute os testes direcionados durante a implementação. Ao final:

- `npm test -- --runInBand`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

## 9. Entrega

Relate objetivamente:

1. Arquivos alterados.
2. Como abrir e jogar a fase.
3. Assets e licenças.
4. Elementos artísticos implementados.
5. Efeitos realmente executados.
6. Capturas e homologação visual.
7. Testes e desempenho observado.
8. Limitações e pendências.

## Critério de aceitação

**Raiz do Mundo deve apresentar uma identidade visual amazônica própria, com árvore monumental, ruínas ancestrais, altar ritual, vegetação densa e efeitos ambientais animados.**

O resultado deve ser perceptivelmente superior aos placeholders técnicos da 9.7C.

A fase deve funcionar no Phaser, ser acessível pelo fluxo de autoria e preservar a arquitetura existente.

**Não encerre apenas porque os testes passaram. Priorize a composição artística e a experiência visual real.**

Não criar commit nem executar push. Não iniciar uma expansão narrativa. Implemente, execute, inspecione e refine.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: o diretório do anexo continha apenas `Pasted text.txt`; nenhuma imagem de referência estava disponível.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.

