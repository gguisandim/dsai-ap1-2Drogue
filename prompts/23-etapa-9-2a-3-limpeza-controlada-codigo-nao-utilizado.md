# Etapa 9.2A.3: limpeza controlada de código não utilizado

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-2a-3-limpeza-controlada-codigo-nao-utilizado`
- Data: `2026-10-29`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-auditoria-racionalizacao-codigo.md`
- Commit: `pendente`
- Execução: `concluída em 2026-10-29; commit pendente`

## Arquivos modificados

- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `SPEC/2026-10-29-auditoria-racionalizacao-codigo.md`
- `docs/audits/2026-10-29-auditoria-racionalizacao-codigo.md`
- `docs/audits/umbra-audit-2026-10-29.json`
- `scripts/audit-codebase.mjs`
- `prompts/23-etapa-9-2a-3-limpeza-controlada-codigo-nao-utilizado.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 9.2A.3 — Limpeza Controlada de Código Não Utilizado** do Umbra Trail.

Use como referência obrigatória:

- `AGENTS.md`
- `docs/audits/2026-10-29-auditoria-racionalizacao-codigo.md`
- `umbra-audit-2026-10-29.json`
- `SPEC/2026-10-29-auditoria-racionalizacao-codigo.md`
- `scripts/audit-codebase.mjs`

### Objetivo

Executar a primeira limpeza arquitetural baseada nas evidências da auditoria, sem reescrever o jogo ou reduzir funcionalidades.

### Prioridade 1 — src/content

O relatório identificou 921 arquivos em `src/content/**` aparentemente sem consumidores, correspondendo a aproximadamente 57.040 linhas com tokens.

Antes de qualquer remoção:

1. Verificar imports estáticos e dinâmicos.
2. Examinar registries, referências por strings e carregamento baseado em caminhos.
3. Verificar testes, scripts, Vite, TypeScript e pontos de entrada.
4. Verificar dependência dos geradores e reprodutibilidade.
5. Demonstrar que o conteúdo não participa do runtime do jogo, World Lab ou build.
6. Identificar arquivos que não podem ser removidos.

Caso o desuso seja comprovado, realizar remoção controlada e eliminar referências e geradores exclusivamente obsoletos.

Caso não seja possível comprovar, não remover e registrar a pendência.

### Prioridade 2 — Alterações CRLF/LF

Investigar os 81 arquivos gerados modificados apenas por finais de linha.

Comparar conteúdo normalizado e estado Git.

Não misturar normalizações de linha com refatorações funcionais.

Não executar comandos destrutivos de restauração sem verificar a existência de alterações legítimas.

### Prioridade 3 — Código potencialmente morto

Investigar individualmente:

- `EnemyDatabase`
- `Player`
- `LevelManager`
- `HealthPotion`
- `Weapon`

Remover somente código comprovadamente sem consumidores, preservando APIs usadas externamente ou dinamicamente.

### Prioridade 4 — Auditoria de regressões

Verificar se as correções de `ShopPurchase` continuam funcionando e se a interface da loja não promete benefícios indisponíveis.

Não ampliar o escopo para implementar itens ou equipamentos.

### Regras

- Não reescrever `GameScene`.
- Não modificar a arquitetura de campanha.
- Não remover sistemas funcionais apenas por serem grandes.
- Não criar novas dependências.
- Não gerar código artificial para compensar LOC.
- Não criar commits.
- Não iniciar integração Phaser 9.2B.

### Verificação acadêmica

Medir LOC antes e depois usando a mesma metodologia e apresentar separadamente:

- Linhas físicas.
- Linhas com tokens.
- LOC do `cloc`.
- Código gerado, produção, testes e scripts.

Confirmar que a limpeza não compromete a exigência de 100 mil LOC conforme o critério acadêmico disponível. Se o critério não estiver documentado, não afirmar conformidade apenas pela contagem física.

### Validação

Executar testes afetados durante as alterações.

Ao final, executar uma vez:

- Suíte completa.
- Typecheck.
- Build.
- Gates de arquitetura e rastreabilidade.
- `git diff --check`.
- Smoke test do jogo e World Lab, se disponível.

Atualizar o relatório existente com os resultados e registrar este prompt em `prompts/`.

### Entrega

Informar:

1. Arquivos efetivamente removidos.
2. Evidências de desuso.
3. LOC antes/depois.
4. Testes e builds.
5. Estado dos 81 arquivos CRLF/LF.
6. Problemas restantes classificados por prioridade.
7. Se o projeto está pronto para a integração Phaser 9.2B.

Prioridade absoluta: eliminar redundância comprovada, preservar funcionalidade e evitar novas camadas arquiteturais desnecessárias.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- O arquivo de métricas efetivamente encontrado está em
  `docs/audits/umbra-audit-2026-10-29.json`.
- Foram removidos `scripts/generate-content-packs.mjs`, os 921 arquivos de
  `src/content/**`, `src/data/EnemyDatabase.ts`, `src/entities/Player.ts`,
  `src/entities/HealthPotion.ts`, `src/entities/Weapon.ts` e
  `src/managers/LevelManager.ts`. O gate v1 exige que entradas de “Arquivos
  modificados” ainda existam, por isso as exclusões ficam registradas aqui e no
  relatório técnico.
- Métricas comparáveis: 237.479 → 172.940 linhas físicas e 187.274 → 128.443
  linhas com tokens. O `cloc` atual permanece indisponível por ausência de Perl.
- A contagem efetiva de diffs somente por EOL foi 53, não a estimativa anterior
  de 81; todos foram comparados individualmente e restaurados ao `HEAD`.
- Validação: 9/9 testes direcionados; 801/801 testes em 50 suítes; typecheck,
  build com 708 módulos, architecture gate (784 arquivos/2.807 dependências) e
  traceability gate (19 v1/8 legados/2 commits pendentes) aprovados;
  `git diff --check` retornou sucesso.
- O smoke visual da 9.2A.3 ficou indisponível porque o controlador do Windows
  encerrou antes da navegação ao não conseguir determinar com segurança a URL
  atual do Opera; nenhuma interação foi realizada.
