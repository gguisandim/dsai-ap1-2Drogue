# Registro de prompt: integração da main com origin/main

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-18-integracao-main-origin`
- Data: `2026-11-18`
- Agente: `Codex`
- Modelo: `GPT-5`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-16-etapa-9-15-modernizacao-menu.md`
- Commit: `pendente`
- Execução: `fast-forward c154436..ed26c35; capabilities OK (62 totais, 52 suportadas); testes dirigidos OK após normalização LF do worktree; check:gates OK; build OK (819 módulos); npm test -- --runInBand OK (97 suítes, 1191 testes); git diff --check OK; marcadores de conflito ausentes`

## Arquivos modificados

- `.gitattributes`
- `SPEC/2026-11-16-auditoria-fases-menu.md`
- `SPEC/2026-11-16-etapa-9-15-modernizacao-menu.md`
- `SPEC/2026-11-16-normalizacao-lf-svg.md`
- `SPEC/README.md`
- `docs/auditoria-fases-menu.md`
- `prompts/70-auditoria-fases-menu.md`
- `prompts/70-etapa-9-15-modernizacao-menu.md`
- `prompts/71-corrige-hashes-svg-windows-linux.md`
- `prompts/72-finaliza-pr-2-apos-normalizacao-lf.md`
- `prompts/73-integracao-main-origin.md`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/application/stages/GameSessionService.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/assets/aguas/README.md`
- `src/data/PlayerProfile.ts`
- `src/main.ts`
- `src/managers/SoundManager.ts`
- `src/presentation/ForestMenuBackdrop.ts`
- `src/presentation/MenuNavigation.ts`
- `src/presentation/StageSelectionPresentation.ts`
- `src/presentation/assets/igapoAssetCatalog.ts`
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

## Prompt efetivamente recebido

```text
# Umbra Trail — Integração da main e resolução completa de conflitos

Atualize meu repositório local com todas as alterações já incorporadas à `origin/main`, incluindo os trabalhos do Jonas.

Quero uma integração Git completa e segura, preservando minhas implementações locais e resolvendo os conflitos de forma técnica, não apenas escolhendo uma versão de cada arquivo.

## 1. Diagnóstico inicial

Antes de modificar qualquer coisa, execute:

- `git status -sb`
- `git branch -vv`
- `git remote -v`
- `git fetch origin --prune`
- `git log --left-right --cherry-pick --oneline main...origin/main`

Identifique:

- Branch atual.
- Commits locais ainda não publicados.
- Commits recebidos do remoto.
- Commits e merges atribuídos ao Jonas.
- Arquivos modificados localmente.
- Diferenças reais entre minha implementação e a versão remota.

Não presuma que o Jonas trabalhou exclusivamente em uma branch ou que todos os commits dele estejam diretamente identificados pelo autor.

## 2. Proteção obrigatória

Antes da integração:

1. Preserve todas as alterações locais, inclusive arquivos não rastreados relevantes.
2. Crie uma branch de segurança com nome identificável.
3. Se houver mudanças não commitadas, salve-as de forma recuperável, usando commits de segurança ou stash identificado, conforme apropriado.
4. Confirme que os dados estão recuperáveis antes de iniciar o merge.
5. Não inclua segredos, `.env`, caches ou arquivos temporários indevidamente em commits.

Não execute:

- `git reset --hard`
- `git clean -fd`
- `git push --force`
- Descarte automático de alterações.
- Substituição indiscriminada por `--ours` ou `--theirs`.

## 3. Integração

Utilize merge convencional para integrar `origin/main` ao trabalho local.

Se houver histórico divergente, preserve os commits existentes e resolva os conflitos.

Se o repositório já estiver sincronizado, não crie merge desnecessário.

Analise cada conflito com base no código, nos contratos, nos testes e na intenção das duas implementações.

**Não considere que a versão local ou a versão do Jonas seja automaticamente superior.**

Quando as implementações forem complementares, combine-as.

Quando forem incompatíveis, determine a solução mais adequada ao funcionamento atual do Umbra Trail.

## 4. Áreas que exigem atenção

Verifique especialmente:

- `src/stages/`
- `src/stages/contracts/`
- `src/stages/chapters/`
- `src/stages/compatibility/`
- `src/narrative/`
- `src/application/`
- `src/presentation/`
- `src/devtools/world-lab/`
- `src/data/LevelData.ts`
- `src/tests/`
- `SPEC/`
- `docs/`
- `prompts/`
- `AGENTS.md`
- `package.json` e arquivos de configuração

Preserve as implementações atuais de:

- Floresta das Raízes.
- Igapó das Memórias.
- Coração Corrompido.
- Jardins das Flores Veladas.
- Variantes Natural e Corrompida.
- World Lab.
- Campanhas.
- CLI de capítulos.
- Contratos narrativos.
- Compatibilidade com fases legadas.

Esses componentes não devem ser tratados como intocáveis: correções legítimas do Jonas precisam ser incorporadas quando aplicáveis.

## 5. Resolução semântica

Para cada conflito relevante:

1. Identifique o que minha versão implementa.
2. Identifique o que a versão remota implementa.
3. Determine se as mudanças são complementares ou incompatíveis.
4. Resolva preservando o comportamento correto de ambas, quando possível.
5. Atualize imports, contratos, registries e testes afetados.
6. Verifique se não foram criados módulos ou registros duplicados.

Evite soluções que apenas façam o TypeScript compilar enquanto removem funcionalidades.

Não faça alterações arquiteturais fora do escopo da integração.

## 6. Verificação obrigatória

Após resolver os conflitos:

- Verifique marcadores de conflito restantes.
- Execute `git diff --check`.
- Execute `npm run check:gates`.
- Execute `npm run build`.
- Execute `npm test -- --runInBand`.
- Verifique a integridade de capítulos, StageRegistry e contratos.
- Confira a integração das fases com as campanhas.
- Verifique que assets PNG/SVG e referências continuam íntegros.

Se algum comando não existir, identifique o equivalente no `package.json`.

Corrija falhas introduzidas pela integração, sem ocultar testes ou desabilitar validações.

## 7. Finalização

Após validação bem-sucedida, deixe a `main` local atualizada com os commits da `origin/main` e com os meus commits locais preservados.

Finalize o merge local, se necessário, utilizando a convenção de commits do projeto.

Não execute `git push` sem minha autorização.

Não altere o histórico remoto.

## 8. Relatório final

Apresente:

1. Commit da `main` local antes e depois.
2. Commits recebidos do remoto.
3. Mudanças identificadas do Jonas.
4. Arquivos com conflitos.
5. Solução aplicada em cada conflito.
6. Funcionalidades preservadas de ambos os lados.
7. Testes, build e gates.
8. Situação final de `git status -sb`.
9. Pendências restantes, se existirem.

**Critério de sucesso:** minha `main` local deve conter as alterações remotas e locais, sem perda de funcionalidades, sem conflitos pendentes e com validações aprovadas.

Se encontrar um conflito que não seja possível resolver com segurança, preserve o estado recuperável e informe o bloqueio em vez de descartar trabalho.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: integração por fast-forward de `c154436` a `ed26c35`; branch de segurança `safety/main-pre-origin-merge-20261118-c154436`.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
