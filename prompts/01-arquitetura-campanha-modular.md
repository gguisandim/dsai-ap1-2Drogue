# Arquitetura de campanha modular

> Fonte: prompt proposto nesta conversa. SPEC: `SPEC/2026-10-27-arquitetura-campanha-modular.md`.
> Registro histórico: o texto reproduz a instrução proposta; não comprova que foi enviada ao agente sem alterações.

---

Analise a arquitetura atual do Umbra Trail e prepare a evolução para um Action RPG roguelite amazônico com campanha narrativa modular.

**Objetivo:** permitir que agentes implementem capítulos, fases, NPCs e diálogos com contexto reduzido, sem precisar compreender ou modificar o motor completo.

Leia primeiro `README.md`, `SPEC/`, `src/scenes/GameScene.ts` e os contratos públicos dos sistemas de simulação, combate, geração procedural e progressão. Inspecione outras implementações somente quando necessário para confirmar dependências.

**Tarefas:**
1. Mapear os contratos e pontos de acoplamento que impedem a criação independente de fases.
2. Propor `StageRegistry`, `StageLoader`, `StageManifest` e contratos para narrativa, NPCs, missões e eventos.
3. Definir uma estratégia de módulos autocontidos e contexto mínimo para agentes.
4. Criar `AGENTS.md` ou adaptar as instruções já existentes, sem descartar regras de rastreabilidade.
5. Elaborar uma SPEC de migração incremental, com critérios de aceitação e testes.
6. Definir compatibilidade com saves, fases e sistemas atuais.

**Restrições:**
- Não alterar a jogabilidade existente.
- Não reescrever o `GameScene` nesta etapa.
- Não modificar sistemas de combate ou geração procedural.
- Não apagar código gerado para reduzir LOC.
- Não criar a campanha ou novos assets nesta etapa.
- Preservar o processo existente de SPEC, prompts, testes e commits.
- Preferir contratos simples, evitando abstrações sem uso real.

**Resultado esperado:** documentação objetiva, contratos propostos, matriz de dependências, ordem de implementação e plano para agentes trabalharem em capítulos isolados. Diferencie componentes já existentes daqueles que precisarão ser implementados.
