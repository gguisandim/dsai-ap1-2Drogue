# Etapa 5: Integração com Phaser

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a Etapa 5 da SPEC `SPEC/2026-10-27-arquitetura-campanha-modular.md`: integração incremental da arquitetura modular com o runtime Phaser existente.

Leia `AGENTS.md`, a SPEC, `src/stages/index.ts`, `src/narrative/index.ts`, `src/scenes/GameScene.ts`, os contratos públicos de progressão/persistência e os testes de caracterização. Não explore arquivos gerados ou módulos sem dependência concreta.

**Objetivo:** executar uma fase legada através do novo StageLoader, preservando integralmente a jogabilidade e oferecendo rollback para o fluxo original.

1. Introduza uma feature flag, desativada por padrão, para ativar o novo carregamento.
2. Crie um adapter Phaser/Application para traduzir o resultado de `StageLoader` em dados consumidos pela cena, sem introduzir Phaser nos módulos headless.
3. Faça a integração inicialmente em uma única fase legada, preservando geração, inimigos, ondas, tempos, recompensas, transições e comportamento de morte.
4. Estabeleça um composition root para `StageRegistry`, `StageLoader`, `StageDirector` e `CampaignSaveService`. Instancie somente os serviços efetivamente necessários.
5. Defina a propriedade dos estados e evite sincronização bidirecional não controlada.
6. Integre a persistência de campanha por adapter, sem substituir ou sobrescrever saves legados.
7. Trate operações externas pendentes com IDs estáveis e confirmação posterior, sem afirmar exatamente-uma-vez sem deduplicação no consumidor.
8. Preserve compatibilidade com run/seed e retomadas antigas. Não crie a chave `umbra-trail-run-v1` sem um estado concreto de retomada.
9. Crie testes de integração e rollback para os fluxos flag OFF/ON, carregamento, erro, transição, morte e save.
10. Atualize a SPEC com evidências e limitações.

**Restrições:**
- Não refatorar todo o GameScene.
- Não alterar regras de combate, progressão ou geração procedural.
- Não implementar novos capítulos, NPCs, assets ou UI narrativa.
- Não alterar testes existentes para acomodar regressões.
- Não migrar todas as fases de uma vez.
- Não adicionar dependências sem necessidade demonstrada.
- Preservar os 620 testes anteriores.
- Não criar commits automaticamente.

**Critério de aceitação:** uma fase legada deve funcionar pelo novo loader com a flag ativada e manter comportamento equivalente ao fluxo antigo. Com a flag desativada, o jogo deve usar exclusivamente o fluxo legado.

Execute typecheck, testes completos, build e `git diff --check`. Relate os arquivos alterados, testes adicionados, mudanças de responsabilidade, comportamento das duas configurações e riscos remanescentes.

Se algum ponto exigir modificar significativamente o core, documente e adie em vez de ampliar o escopo.
