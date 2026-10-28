# Caracterização das fases legadas

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a primeira etapa funcional da SPEC `SPEC/2026-10-27-arquitetura-campanha-modular.md`, começando exclusivamente pelos testes de caracterização do comportamento atual das fases.

Leia `AGENTS.md`, a SPEC indicada, os contratos de geração procedural, `GameScene.ts` e os testes existentes relacionados.

Baseline validada:
- TypeScript e build: aprovados.
- 15 suítes e 518 testes: aprovados.
- `git diff --check`: sem erros.

Objetivos:
1. Caracterizar a geração, sequência e transição de fases existentes.
2. Registrar o comportamento de ondas, recompensas e conclusão.
3. Identificar invariantes de progressão e persistência.
4. Criar testes determinísticos sempre que possível.
5. Documentar comportamentos não testáveis sem Phaser e propor seus pontos de isolamento.

Restrições:
- Não alterar a jogabilidade.
- Não refatorar `GameScene`.
- Não implementar `StageLoader` nem registries nesta etapa.
- Não modificar o core de combate, simulação ou progressão.
- Não modificar testes existentes para esconder falhas.
- Preservar os 518 testes previamente aprovados.
- Seguir a rastreabilidade de SPEC e agente estabelecida no projeto.

Ao finalizar, execute typecheck, testes e build. Informe os novos testes, os comportamentos caracterizados, os arquivos modificados e eventuais limitações.

Não crie commits automaticamente.
