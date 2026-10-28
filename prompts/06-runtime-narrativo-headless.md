# Etapa 3: Runtime narrativo headless

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Implemente a Etapa 3 da arquitetura de campanha modular do Umbra Trail: Runtime Narrativo Headless.

**Contexto obrigatório:**
- `AGENTS.md`
- `SPEC/2026-10-27-arquitetura-campanha-modular.md`
- `src/stages/contracts/`
- `src/stages/index.ts`
- Contratos públicos de eventos e progressão, apenas quando necessário.

Evite explorar o repositório inteiro. Consulte implementações internas somente para resolver dependências concretas.

### Objetivos

1. Criar `src/narrative/` com contratos públicos e sistemas independentes do Phaser.
2. Implementar `NarrativeRegistry` para registrar diálogos, NPCs, missões e definições narrativas com IDs estáveis, validação de referências, rejeição de duplicatas e consultas imutáveis.
3. Implementar `DialogueEngine` com diálogos em nós, opções de resposta, condições, transições e encerramento determinístico.
4. Implementar `QuestEngine` com objetivos, estados (`locked`, `available`, `active`, `completed`, `failed`) e progressão orientada por eventos tipados.
5. Implementar `NarrativeState` para flags, escolhas, diálogos concluídos e estado das missões.
6. Implementar `NarrativeEventProcessor` para consumir eventos de domínio por contratos públicos, sem acessar implementações internas de combate, simulação ou Phaser.
7. Garantir idempotência para eventos repetidos e conclusões de missões, evitando recompensas ou progressões duplicadas.
8. Expor API pública mínima em `src/narrative/index.ts`.
9. Criar testes unitários e de integração headless cobrindo diálogos, escolhas, condições, missões, eventos, referências inválidas, determinismo e idempotência.

### Requisitos arquiteturais

- Separar definições narrativas de estado mutável.
- Utilizar IDs estáveis para capítulos, fases, personagens e missões.
- Permitir que capítulos forneçam conteúdo declarativo, sem executar funções arbitrárias.
- Usar tipos discriminados e resultados tipados para operações que possam falhar.
- Manter o processamento determinístico, sem dependência de relógio real, aleatoriedade implícita ou APIs do navegador.
- Impedir ciclos infinitos em diálogos e processamento recursivo de eventos.
- Não duplicar mecanismos existentes de eventos quando os contratos públicos puderem ser reutilizados.
- Projetar estado narrativo serializável, mas adiar a implementação da persistência para a Etapa 4.

### Restrições

- Não alterar `GameScene`, Phaser ou o runtime atual.
- Não modificar combate, simulação, IA, progressão ou geração procedural.
- Não implementar NPCs visuais, mapas, assets ou a campanha amazônica.
- Não implementar saves ou migrações nesta etapa.
- Não modificar contratos existentes de `src/stages/` sem justificativa explícita.
- Não alterar testes anteriores para acomodar regressões.
- Não adicionar dependências sem necessidade demonstrada.
- Não criar abstrações que não tenham consumidores ou testes concretos.
- Não criar commits automaticamente.

### Validação

Executar:
- Typecheck.
- Testes completos, preservando os 575 anteriores.
- Build.
- `git diff --check`.
- Verificação de ausência de dependências de Phaser, `GameScene` ou módulos internos de combate em `src/narrative/`.

Atualizar a SPEC com decisões arquiteturais, contratos efetivamente implementados, testes, limitações e rastreabilidade.

**Entrega:** informar arquivos criados/modificados, API pública, testes adicionados, quantidade total de testes aprovados e eventuais desvios da SPEC.
