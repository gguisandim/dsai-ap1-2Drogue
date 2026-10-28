# Contratos e StageRegistry

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a etapa de contratos públicos e registro de fases definida em `SPEC/2026-10-27-arquitetura-campanha-modular.md`.

Leia `AGENTS.md`, a SPEC indicada, `src/tests/stageCharacterization.test.ts` e apenas os contratos existentes de `LevelDefinition` e geração procedural necessários.

Objetivos:
1. Implementar os contratos `StageManifest`, `ChapterManifest` e `StageModule` conforme a SPEC.
2. Implementar um `StageRegistry` headless, com IDs estáveis, consulta, listagem e rejeição de duplicatas.
3. Criar validação de referências e invariantes aplicáveis sem Phaser.
4. Introduzir adaptadores mínimos para registrar as fases legadas, preservando a ordem e os IDs existentes.
5. Criar testes unitários para contratos, registro, duplicatas e compatibilidade.
6. Exportar somente APIs públicas necessárias via `src/stages/index.ts`.

Restrições:
- Não alterar `GameScene`, combate, simulação ou progressão.
- Não implementar `StageLoader`, narrativa, NPCs ou campanhas nesta etapa.
- Não modificar o comportamento das fases existentes.
- Não modificar testes de caracterização para acomodar mudanças.
- Não introduzir dependência de Phaser nos novos módulos.
- Preservar as 534 asserções/testes existentes.
- Não criar commits automaticamente.

Execute typecheck, testes completos, build e `git diff --check`. Informe os arquivos alterados, testes adicionados, contratos públicos e possíveis desvios da SPEC.
