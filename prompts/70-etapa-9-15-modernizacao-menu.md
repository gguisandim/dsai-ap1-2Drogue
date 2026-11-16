# Registro de prompt: Modernização do Menu do Umbra Trail — Etapa 9.15

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-16-etapa-9-15-modernizacao-menu`
- Data: `2026-11-16`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-16-etapa-9-15-modernizacao-menu.md`
- Commit: `pendente`
- Execução: `implementação concluída; fechamento executado; uma falha preexistente de hash SVG permanece`

## Arquivos modificados

- `SPEC/2026-11-16-etapa-9-15-modernizacao-menu.md`
- `SPEC/README.md`
- `prompts/70-etapa-9-15-modernizacao-menu.md`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/application/stages/GameSessionService.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/data/PlayerProfile.ts`
- `src/main.ts`
- `src/managers/SoundManager.ts`
- `src/presentation/ForestMenuBackdrop.ts`
- `src/presentation/MenuNavigation.ts`
- `src/presentation/StageSelectionPresentation.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/CreditsScene.ts`
- `src/scenes/GameModesScene.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/MenuScene.ts`
- `src/scenes/SettingsScene.ts`
- `src/scenes/StageSelectScene.ts`
- `src/tests/gameModesMenu.test.ts`
- `src/tests/gameSessionService.test.ts`
- `src/tests/menuNavigation.test.ts`
- `src/tests/stageAmbientPresentation.test.ts`
- `src/tests/stageCharacterization.test.ts`
- `src/tests/stageSelectionPresentation.test.ts`

## Validações executadas

- `npm run check:gates`: aprovado.
- `npm run build`: aprovado (typecheck e build Vite).
- Testes dirigidos de menu, navegação, catálogo e sessões: 4 suítes, 36 testes aprovados.
- `npm test -- --runInBand`: 96 de 97 suítes e 1190 de 1191 testes aprovados. A única falha é o hash de `src/assets/aguas/igapo-forest-floor.svg` em `src/tests/igapoAssets.test.ts`: o catálogo espera os bytes CRLF, enquanto o arquivo no worktree está LF (`core.autocrlf=true`; sem atributo Git específico para SVG). A correção relacionada está na PR #1, sem reviews nem check runs, e não foi incorporada nem alterada neste escopo.
- Validação visual/interativa no navegador em 1920×1080, 1366×768 e 900×600: menu, seletor, prévia, fase individual isolada, configurações, persistência de volume, tela cheia/janela, créditos, campanha nova, continuação salva e cancelamento/confirmação de sobrescrita.
- `git diff --check`: aprovado.
- Auditoria de segredos do registro de prompt: nenhum segredo conhecido encontrado.

## Prompt efetivamente recebido

```text
# Etapa 9.15 — Modernização do Menu do Umbra Trail
Implemente a modernização completa do menu principal do Umbra Trail. Não quero apenas propostas ou documentação: quero a interface implementada, funcional e testada.

## 1. Direção visual
O menu deve transmitir a atmosfera de um RPG de exploração em uma floresta amazônica misteriosa, com elementos de fantasia sombria.

- Fundo panorâmico com cenário florestal, profundidade e movimento ambiental discreto.
- Identidade visual consistente com as fases Floresta das Raízes, Igapó das Memórias e Coração Corrompido.
- Tipografia legível, hierarquia visual clara e botões integrados à estética do jogo.
- Transições suaves, feedback de seleção e efeitos de hover.
- Evitar aparência de dashboard, cartões genéricos, excesso de retângulos e estética artificial.
- Garantir boa apresentação em 1920×1080, 1366×768 e telas menores.

## 2. Estrutura do menu principal
Implementar as seguintes opções:

**Continuar**

- Retomar a campanha salva.
- Desabilitar quando não existir progresso válido.
**Nova campanha**

- Iniciar a campanha pelo primeiro capítulo.
- Solicitar confirmação antes de sobrescrever progresso existente.
**Selecionar fase**

- Abrir uma interface dedicada às fases disponíveis.
- Organizar fases por capítulo ou região.
- Mostrar nome, descrição, ambientação e estado da fase.
- Diferenciar fases disponíveis, bloqueadas e experimentais.
- Permitir jogar fases legadas individualmente, sem alterar o progresso da campanha principal.
- Utilizar o catálogo existente como fonte de dados, sem duplicar registros.
**Configurações**

- Volume geral, música e efeitos sonoros, conforme os recursos existentes.
- Alternância entre tela cheia e janela.
- Persistir preferências localmente.
**Créditos**

- Exibir informações reais do projeto e seus colaboradores.

## 3. Seleção de fases
Criar uma tela visualmente integrada ao universo do jogo.

- Apresentar as regiões como destinos de uma jornada.
- Permitir navegar entre fases com mouse e teclado.
- Exibir uma prévia visual quando houver assets disponíveis.
- Identificar claramente fases legadas e fases novas.
- Não permitir iniciar fases sem implementação jogável.
- Manter compatibilidade com World Lab, catálogo dinâmico e templates existentes.

## 4. Experiência de navegação

- Suportar mouse e teclado.
- Implementar estados de foco, seleção e desabilitado.
- Permitir retornar ao menu sem perder indevidamente o progresso.
- Evitar animações excessivas ou que prejudiquem a responsividade.
- Garantir que todas as opções executem ações reais.

## 5. Requisitos técnicos

- Reutilizar as cenas, serviços, assets e componentes existentes.
- Preservar o sistema de save, campanha, progressão e transições.
- Não criar um segundo sistema de gerenciamento de fases.
- Não alterar a jogabilidade das fases nesta etapa.
- Separar apresentação visual da lógica de navegação.
- Adicionar testes para navegação, disponibilidade de fases, continuidade da campanha e persistência das configurações.

## 6. Git e entrega

1. Leia `AGENTS.md` e `docs/auditoria-fases-menu.md`.
2. Verifique a PR #1. Se estiver aprovada, sem conflitos e com as validações necessárias concluídas, realize o merge.
3. Atualize a `main` e crie `feat/menu-modernizacao`.
4. Crie a SPEC da etapa conforme as regras do repositório.
5. Implemente o menu descrito acima, sem substituir funcionalidades existentes por telas fictícias.
6. Execute testes, `check:gates`, build e verificações de integridade.
7. Faça os commits com trailers `Agent` e `Spec` válidos.
8. Faça push e abra uma PR para `main`.
9. Não faça merge da nova PR.

## Critérios de conclusão
O menu deve estar visualmente modernizado, totalmente navegável, com acesso funcional às campanhas, seleção de fases, configurações e créditos.

Não considere a tarefa concluída apenas porque o build passou. Verifique o funcionamento visual e as transições reais entre telas.

Ao final, informe os arquivos alterados, testes executados, commits e URL da PR.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `PR #1 sem reviews e sem check runs; por isso não foi mesclada`
- Política de commit: `pendente`
