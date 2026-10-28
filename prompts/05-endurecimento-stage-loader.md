# Endurecimento da Etapa 2

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Revise e fortaleça a Etapa 2 da SPEC `SPEC/2026-10-27-arquitetura-campanha-modular.md`, sem integrar o StageLoader ao Phaser.

Leia `AGENTS.md`, `src/stages/runtime/StageLoader.ts`, `ResolvedLevelValidator.ts`, `StageValidator.ts`, `src/stages/contracts/StageLoad.ts` e os testes `stageLoader*.test.ts`.

Objetivos:
1. Validar `StageResumeState` antes de resolver ou gerar mapas.
2. Definir e implementar vínculo verificável entre save, run e seed, preservando compatibilidade ou documentando migração necessária.
3. Garantir alcançabilidade de anchors explícitos de saída.
4. Testar entradas estruturais inválidas e impedir exceções não tipadas na fronteira de carregamento.
5. Ampliar testes de cópia defensiva e determinismo.
6. Documentar decisões e alterações na SPEC.

Restrições:
- Não modificar GameScene, combate, simulação, IA ou progressão.
- Não implementar narrativa, NPCs, quests ou apresentação.
- Não modificar testes anteriores para acomodar regressões.
- Preservar os 565 testes existentes.
- Não alterar a jogabilidade.
- Não criar commits.

Execute typecheck, testes completos, build e git diff --check. Relate as mudanças e eventuais riscos remanescentes.
