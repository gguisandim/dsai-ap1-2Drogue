# Registro de prompt: Etapa 9.17 — Ajustes do menu e pré-visualização das fases

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-23-etapa-9-17-menu-preview-fases`
- Data: `2026-11-23`
- Agente: `GitHub Copilot`
- Modelo: `mai-code-2-flash`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-23-etapa-9-17-menu-preview-fases.md`
- Commit: `pendente`
- Execução: `npm run check:gates` aprovado; `npm run build` aprovado;
  testes dirigidos aprovados (30 testes); validação completa aprovada com
  `NODE_OPTIONS=--max-old-space-size=4096` (100 suítes, 1.223 testes);
  `git diff --check` aprovado; verificação visual local aprovada no menu e em
  Minas, Flores, Igapó, Raiz e Palácio.

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-23-etapa-9-17-menu-preview-fases.md`
- `docs/diario-de-desenvolvimento.md`
- `prompts/75-etapa-9-17-menu-preview-fases.md`
- `src/main.ts`
- `src/scenes/MenuScene.ts`
- `src/scenes/GameModesScene.ts`
- `src/presentation/StageSelectionPresentation.ts`
- `src/tests/menuNavigation.test.ts`
- `src/tests/stageSelectionPresentation.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.17 — Ajustes do menu e pré-visualização das fases
Projeto: Umbra Trail.

Leia `AGENTS.md` e consulte apenas os arquivos relacionados ao menu, seletor de fases, catálogo de fases e assets de pré-visualização. Consulte a SPEC da modernização do menu.

## Objetivo
Implementar três alterações:

1. Substituir o texto **"Nova Campanha"** por **"Novo Jogo"**, preservando a ação existente.
2. Remover a opção **"Créditos"** do menu principal e sua navegação. Não apagar informações de autoria ou créditos da documentação.
3. Corrigir as imagens do seletor de fases. Atualmente, somente **Minas Corrompidas** apresenta a imagem corretamente. Cada fase disponível deve exibir sua própria imagem de resumo.

## Diagnóstico das imagens
Antes de modificar:

- Identifique como o seletor resolve as imagens de cada fase.
- Verifique os caminhos, imports, nomes, extensões e referências no catálogo.
- Verifique se os assets existem e se são incluídos corretamente na build.
- Identifique a causa do funcionamento exclusivo de Minas Corrompidas.
- Reutilize os assets existentes; não crie imagens genéricas nem substitua artes de fases sem autorização.
- Se alguma fase não possuir imagem de resumo, informe qual é e proponha uma solução antes de criar novos assets.

## Restrições

- Preserve a lógica de novo jogo, continuar jogo e seleção de fases.
- Não altere saves, progressão, mapas, sprites ou mecânicas.
- Não modifique implementações de Guilherme sem necessidade.
- Consulte o histórico Git dos arquivos afetados e verifique alterações concorrentes.
- Evite refatorações fora do escopo.
- Não altere configurações do GitHub Pages nesta etapa.

## Rastreabilidade
Crie a SPEC da Etapa 9.17 e o registro do prompt com:

- Schema:
- Prompt-ID:
- Data:
- Agente: GitHub Copilot
- Modelo: GPT-6 Luna, se confirmado na sessão
- Esforço:
- SPEC:
- Commit:
- Execução:
Atualize o diário conforme as regras do projeto. Registre os valores efetivamente utilizados, sem inventar metadados.

## Validação

- Verifique visualmente o menu e todas as imagens das fases.
- Confirme que "Novo Jogo" executa a ação anterior.
- Confirme que "Créditos" não aparece nem permanece acessível por navegação do menu.
- Teste a seleção de fases e a preservação do save.
- Execute testes relevantes, `npm run build` e `npm run check:gates`.
- Confirme que os assets funcionam com os caminhos relativos do Vite.

## Git

1. Confirme o estado da `main` e da árvore de trabalho.
2. Integre as alterações já disponíveis em `origin/main`, sem sobrescrever trabalho de terceiros.
3. Crie a branch `fix/menu-preview-fases`.
4. Implemente somente o escopo definido.
5. Registre SPEC, prompt, diário e commit com trailers `Agent` e `Spec`.
6. Faça push e abra uma PR para `main`.
7. Não realize merge.
Ao finalizar, informe a causa do problema das imagens, arquivos modificados, testes executados, commit e URL da PR.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- GPT-6 Luna não foi confirmado pelo modelo efetivo disponível nesta execução.
