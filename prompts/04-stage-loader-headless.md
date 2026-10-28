# StageLoader headless

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a Etapa 2 da SPEC `SPEC/2026-10-27-arquitetura-campanha-modular.md`: StageLoader headless e resolução de fases.

Leia `AGENTS.md`, a SPEC, `src/stages/`, os contratos públicos de geração procedural e `src/tests/stageCharacterization.test.ts`. Consulte implementações internas somente quando indispensável.

Objetivos:
1. Criar `StageLoader` usando exclusivamente os contratos e o `StageRegistry` existentes.
2. Resolver as 14 fases legadas em definições utilizáveis, preservando IDs, ordem e comportamento documentado.
3. Validar anchors, saídas, tiles sólidos, posições e conectividade do mapa após a geração/reparo.
4. Garantir determinismo por seed e diagnósticos tipados.
5. Criar testes unitários e de compatibilidade, incluindo seeds inválidas, mapas desconectados, referências ausentes e resolução repetida.
6. Exportar a API pública mínima em `src/stages/index.ts`.

Restrições:
- Não alterar `GameScene`, combate, simulação, IA ou progressão.
- Não implementar narrativa, NPCs, quests ou apresentação Phaser.
- Não alterar os contratos existentes sem necessidade demonstrada e documentada.
- Não modificar os 547 testes existentes para acomodar diferenças.
- Não mudar a execução atual das fases.
- Não criar commits automaticamente.

Execute typecheck, testes completos, build e `git diff --check`. Relate arquivos modificados, novos testes, cobertura de compatibilidade, decisões de resolução e limitações.

Caso descubra que algum requisito depende de mudanças no runtime atual, documente a dependência e adie essa integração em vez de alterar o motor nesta etapa.
