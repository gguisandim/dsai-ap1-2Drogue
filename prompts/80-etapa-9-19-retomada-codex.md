# Registro de prompt: retomada da Etapa 9.19 pelo Codex

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-25-etapa-9-19-retomada-codex`
- Data: `2026-11-25`
- Agente: `OpenAI Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-25-etapa-9-19-capturas-resumo-fases.md`
- Commit: `pendente`
- Execução: `Testes dirigidos: 18 aprovados. Captura WebGL: 27 PNGs concluídos em duas execuções. Seletor em Chromium: 19 fases em quatro páginas (6/6/6/1). Fechamento: gates, build, 1.227 testes em 100 suítes, git diff --check e auditoria dos dois prompts da etapa aprovados.`

## Arquivos modificados

- `docs/diario-de-desenvolvimento.md`
- `package.json`
- `prompts/80-etapa-9-19-retomada-codex.md`
- `README.md`
- `scripts/capture-stage-summaries.cjs`
- `src/assets/stage-summaries/level-01-forgotten-passage--default.png`
- `src/assets/stage-summaries/level-01-vestibule--default.png`
- `src/assets/stage-summaries/level-02-nave--default.png`
- `src/assets/stage-summaries/level-03-vigrid-streets--default.png`
- `src/assets/stage-summaries/level-04-colosseum--default.png`
- `src/assets/stage-summaries/level-05-clocktower--default.png`
- `src/assets/stage-summaries/level-06-inferno--default.png`
- `src/assets/stage-summaries/level-07-witches-crypt--default.png`
- `src/assets/stage-summaries/level-08-paradiso--default.png`
- `src/assets/stage-summaries/level-08-paradiso--variant-floresta-flores-veladas-corrupted.png`
- `src/assets/stage-summaries/level-08-paradiso--variant-floresta-flores-veladas-natural.png`
- `src/assets/stage-summaries/level-09-limbo--default.png`
- `src/assets/stage-summaries/level-10-ithavoll--default.png`
- `src/assets/stage-summaries/stage-aguas-coracao-corrompido--default.png`
- `src/assets/stage-summaries/stage-aguas-igapo-das-memorias--default.png`
- `src/assets/stage-summaries/stage-aguas-igapo-das-memorias--variant-aguas-igapo-ribeirinho.png`
- `src/assets/stage-summaries/stage-aguas-igapo-das-memorias--variant-aguas-igapo-sombrio.png`
- `src/assets/stage-summaries/stage-corrupted-minas--default.png`
- `src/assets/stage-summaries/stage-corrupted-minas--variant-corrupted-minas-abandoned.png`
- `src/assets/stage-summaries/stage-corrupted-minas--variant-corrupted-minas-corrupted.png`
- `src/assets/stage-summaries/stage-final-palacio-do-credor--default.png`
- `src/assets/stage-summaries/stage-final-palacio-do-credor--variant-final-palacio-corrompido.png`
- `src/assets/stage-summaries/stage-final-palacio-do-credor--variant-final-palacio-decadencia.png`
- `src/assets/stage-summaries/stage-raiz-do-mundo-santuario--default.png`
- `src/assets/stage-summaries/verse-01-atrium--default.png`
- `src/assets/stage-summaries/verse-02-galeria--default.png`
- `src/assets/stage-summaries/verse-03-santuario--default.png`
- `src/devtools/stage-summary-capture/StageSummaryCaptureScene.ts`
- `src/presentation/assets/bootStageSummaryAssets.ts`
- `src/presentation/assets/StageSummaryAssetCatalog.ts`
- `src/presentation/StageSelectionPresentation.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/StageSelectScene.ts`
- `src/tests/minasCorrompidas.test.ts`
- `src/tests/stageSelectionPresentation.test.ts`

## Prompt efetivamente recebido

````text
A Etapa 9.19 foi iniciada pelo GitHub Copilot, mas interrompida por esgotamento dos créditos.

Antes de implementar, analise o AGENTS.md, a SPEC, o diário, os commits e as alterações pendentes na branch atual.

Continue exatamente do ponto em que o Copilot parou, sem descartar alterações ou duplicar trabalho.

Registre a transição de agente para Codex, identificando o modelo e o esforço reais da nova sessão. Preserve os registros anteriores do Copilot e mantenha os requisitos de rastreabilidade.

Prossiga conforme o escopo abaixo.
\# Etapa 9.19 — Padronização das imagens de resumo do seletor de fases\
Corrija todas as imagens de resumo exibidas na aba "Selecionar Fase", incluindo todas as páginas e fases disponíveis.\
\
\## 1. Objetivo\
Cada fase deve apresentar uma captura fiel do seu cenário real, como se fosse um screenshot da própria fase durante a execução do jogo.\
\
\## 2. Requisitos visuais\
\
\- Utilize o cenário efetivamente renderizado pelo Phaser.\
\- Escolha um enquadramento representativo da identidade visual de cada fase.\
\- Preserve as texturas, iluminação, vegetação, arquitetura e elementos ambientais reais.\
\- Não exiba protagonista, NPCs, inimigos, chefes ou outros personagens.\
\- Não exiba HUD, barras de vida, diálogos, indicadores de missão ou controles.\
\- Não utilize texturas isoladas, tiles ampliados, ilustrações conceituais ou panoramas fictícios.\
\- Mantenha a proporção das imagens e evite distorções.\
\- Garanta que cada imagem seja visualmente distinta e corresponda à respectiva fase.\
\
\## 3. Implementação\
Analise prioritariamente:\
\
\- \`src/presentation/StageSelectionPresentation.ts\`\
\- \`src/scenes/StageSelectScene.ts\`\
\- \`src/tests/stageSelectionPresentation.test.ts\`\
\- \`src/stages/chapters/\`\
\- Recursos existentes de renderização e preview do World Lab.\
Implemente um mecanismo reutilizável de captura do cenário sem entidades e sem HUD, preferencialmente utilizando o próprio renderizador existente.\
\
Gere e armazene uma imagem representativa para cada fase e variante disponível, utilizando WebP ou PNG.\
\
Mapeie explicitamente as imagens aos respectivos identificadores das fases. Não utilize \`tile_floor\` como imagem de resumo.\
\
Contemple todas as fases cadastradas, não apenas as seis exibidas na primeira página.\
\
O mecanismo de captura deverá permitir a atualização das imagens de resumo conforme os cenários forem modernizados nas próximas etapas.\
\
\## 4. Restrições\
\
\- Não modifique os cenários jogáveis.\
\- Não altere personagens, adversários, mecânicas ou colisões.\
\- Preserve o layout atual do seletor.\
\- Não modifique a campanha principal.\
\- Preserve as contribuições de Guilherme.\
\- Preserve as alterações realizadas na Etapa 9.18.\
\- Não utilize imagens geradas artificialmente para substituir capturas reais dos cenários.\
\
\## 5. Rastreabilidade\
Trabalhe na branch atual \`feat/modernizacao-minas-corrompidas\`, mantendo a Etapa 9.19 documentalmente separada da Etapa 9.18.\
\
Crie uma SPEC própria antes da implementação.\
\
Crie o registro de prompt conforme o modelo obrigatório:\
\
\- Schema:\
\- Prompt-ID:\
\- Data:\
\- Agente:\
\- Modelo:\
\- Esforço:\
\- SPEC:\
\- Commit:\
\- Execução:\
Preencha os campos com informações reais da execução, sem inventar valores.\
\
Atualize o diário de desenvolvimento e utilize os trailers obrigatórios nos commits.\
\
\## 6. Critérios de aceitação\
\
\- Todas as fases possuem imagens próprias.\
\- As imagens correspondem aos cenários efetivamente jogáveis.\
\- Nenhum personagem ou elemento de interface aparece nas capturas.\
\- Nenhuma imagem utiliza uma textura isolada como representação da fase.\
\- Todas as páginas do seletor foram verificadas.\
\- O layout existente permanece intacto.\
\- Não existem regressões nas fases ou na campanha.\
\
\## 7. Validação e entrega\
\
\- Execute os testes direcionados.\
\- Execute a suíte completa de testes.\
\- Execute \`npm run build\`.\
\- Execute \`npm run check:gates\`.\
\- Execute \`git diff --check\`.\
\- Realize a auditoria de segredos.\
\- Apresente a relação completa das fases e suas respectivas imagens geradas.\
\- Disponibilize o seletor para homologação visual humana.\
\- Crie os commits documentais e de implementação separadamente.\
\- Faça push na branch atual.\
Não faça merge.\
\
Não declare a homologação visual aprovada sem minha autorização. Caso a captura automatizada dos cenários esteja indisponível, informe o impedimento e solicite intervenção humana, sem substituir as capturas por imagens genéricas.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: o ambiente identifica Codex e a família GPT-6. O identificador exato do modelo e o esforço configurado não foram disponibilizados.
- A SPEC e o registro anterior do Copilot estão no commit `04c791e`. A implementação e os PNGs já estavam no diretório de trabalho ao iniciar a retomada.
