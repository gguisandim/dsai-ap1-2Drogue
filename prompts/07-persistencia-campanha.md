# Etapa 4: Persistência de campanha

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a Etapa 4 da SPEC `SPEC/2026-10-27-arquitetura-campanha-modular.md`: persistência narrativa, identidade de campanha e migração de saves.

**Leia somente o contexto necessário:**
- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `src/narrative/contracts/`
- `src/narrative/runtime/NarrativeState.ts`
- `src/narrative/runtime/NarrativeEventProcessor.ts`
- `src/narrative/runtime/StageDirector.ts`
- `src/stages/contracts/StageLoad.ts`
- Contratos e implementações existentes de persistência, apenas quando necessários.

Não explore indiscriminadamente os arquivos gerados ou outros módulos.

### Objetivos

1. Criar contratos versionados para persistência de campanha, incluindo `CampaignSaveEnvelope`, `CampaignSaveResult` e falhas tipadas.
2. Vincular o save a `runId`, `runSeed`, `chapterId`, `stageId` e revisão do manifesto, sem duplicar responsabilidades de `StageResumeState`.
3. Criar `CampaignSaveService` headless para serializar, validar, carregar e restaurar estado narrativo.
4. Implementar `SaveStoragePort` e adapter em memória para testes. Isolar qualquer adapter de localStorage da lógica de domínio.
5. Implementar migração aditiva dos saves legados. Preservar as chaves, dados e comportamentos existentes; não apagar nem sobrescrever saves desconhecidos.
6. Validar estruturalmente snapshots e envelopes recebidos como dados externos, incluindo versões incompatíveis, corrupção, IDs inválidos e referências inconsistentes.
7. Definir escopo e identidade de eventos, regras e operações por run, capítulo e fase, evitando colisões entre conteúdos distintos.
8. Garantir idempotência de recompensas e documentar um protocolo recuperável de aplicação externa, sem implementar mudanças no sistema de progressão.
9. Garantir que falhas de validação ou migração não alterem o estado original.
10. Criar testes headless de round-trip, compatibilidade, migração, determinismo, idempotência, corrupção e retomada.

### Restrições

- Não alterar `GameScene` ou comportamento atual do jogo.
- Não modificar combate, simulação, IA ou progressão.
- Não implementar UI, diálogos visuais, novos NPCs ou campanha amazônica.
- Não substituir o mecanismo legado de saves em produção nesta etapa.
- Não criar migrações destrutivas.
- Não adicionar dependências sem necessidade demonstrada.
- Não gerar código volumoso artificialmente.
- Não modificar testes anteriores para esconder regressões.
- Preservar os 600 testes existentes.
- Não criar commits automaticamente.

### Validação obrigatória

Execute typecheck, testes completos, build e `git diff --check`.

Atualize a SPEC com as decisões de persistência, estrutura dos envelopes, política de migração, invariantes de identidade, testes e riscos remanescentes.

Relate os arquivos alterados, novos testes, APIs públicas e quaisquer mudanças necessárias nos contratos anteriores.

**Importante:** se garantir aplicação exatamente uma vez de recompensas exigir uma transação que envolva outros sistemas, não declare essa garantia prematuramente. Implemente o protocolo de operações pendentes e documente os pontos de integração necessários para a Etapa 5.
