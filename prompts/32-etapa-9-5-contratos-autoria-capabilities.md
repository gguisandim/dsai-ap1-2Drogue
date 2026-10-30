# Registro de prompt: Etapa 9.5 — Contratos de Autoria Independente, Capabilities e Compatibilidade

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-30-etapa-9-5-contratos-autoria-capabilities`
- Data: `2026-10-30`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-30-etapa-9-5-contratos-autoria-capabilities.md`
- Commit: `pendente`
- Execução: `7 suítes/44 testes direcionados e 66 suítes/912 testes completos aprovados; typecheck, build com 723 módulos, architecture, traceability, auditoria de 20 arquivos de sessões sem segredos e diff-check aprovados`

## Arquivos modificados

- `SPEC/2026-10-30-etapa-9-5-contratos-autoria-capabilities.md`
- `SPEC/README.md`
- `prompts/32-etapa-9-5-contratos-autoria-capabilities.md`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/narrative/contracts/CampaignSave.ts`
- `src/narrative/persistence/CampaignSaveService.ts`
- `src/narrative/persistence/CampaignSaveValidator.ts`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/index.ts`
- `src/stages/chapters/registerCampaignChapters.ts`
- `src/stages/contracts/StageCapabilities.ts`
- `src/stages/contracts/StageLoad.ts`
- `src/stages/contracts/StageManifest.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageLoader.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/tests/campaignChapterCatalog.test.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/narrativeCycleScenario.test.ts`
- `src/tests/stageAuthoringCompatibility.test.ts`
- `src/tests/stageLoaderHardening.test.ts`
- `src/tests/stageLoaderValidation.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.5 — Contratos de Autoria Independente, Capabilities e Compatibilidade

Continue o desenvolvimento do **Umbra Trail**, após a conclusão da Etapa 9.4D.

## Objetivo

Preparar a arquitetura para permitir que desenvolvedores externos criem capítulos e fases independentes, declarando seus conteúdos, requisitos e condições sem modificar diretamente o motor do jogo.

Esta etapa deve **endurecer e ampliar os contratos existentes**, evitando criar novos sistemas paralelos.

O objetivo final é permitir que um capítulo declare suas dependências e seja validado antes de entrar na campanha.

## 1. Inspeção obrigatória

Antes de modificar arquivos:

- Ler `AGENTS.md` e as SPECs das Etapas 8.1–8.4 e 9.3B–9.4D.
- Inspecionar `StageModule`, `StageManifest`, `ChapterManifest`, `StageRegistry`, `StageLoader` e `StageValidator`.
- Inspecionar `CampaignChapterCatalog`, `CampaignGraphValidator`, `CampaignMacroRouteBinder` e `CampaignRouter`.
- Verificar os contratos de `StageExitDefinition.condition`.
- Inspecionar `CampaignSaveService`, `NarrativeState`, `CampaignSaveValidator` e as estratégias de revisão existentes.
- Identificar capacidades efetivamente suportadas pelo motor, sem assumir que campos declarados já possuem implementação.
- Executar `git status --short` e preservar alterações existentes.

Não assumir nomes de arquivos, caminhos ou APIs sem verificar o repositório.

## 2. Contrato de capacidades — Capabilities

Estender os contratos de capítulo e fase para declarar, quando necessário:

- Tipos de tiles.
- Temas e biomas.
- Arquétipos de inimigos.
- Tipos de itens.
- Recursos de áudio.
- Recursos de iluminação e efeitos.
- NPCs e interações.
- Recursos narrativos.
- Necessidades de saídas e navegação.

As declarações devem utilizar identificadores estáveis e versionáveis.

Diferenciar:

1. Capacidade declarada pelo conteúdo.
2. Capacidade realmente suportada pelo runtime.
3. Capacidade opcional.
4. Capacidade obrigatória.
5. Capacidade desconhecida ou incompatível.

Não registrar como suportados recursos que o motor ainda não executa.

**Importante:** os pontos de extensão de renderer, tilesets, áudio, inimigos e itens serão implementados na Etapa 9.5B. Nesta etapa, apenas formalizar e validar seus contratos e requisitos.

## 3. Validação de compatibilidade

Ampliar `StageValidator` e os validadores existentes para identificar incompatibilidades entre conteúdo e runtime.

Validar:

- IDs duplicados.
- Referências inexistentes.
- Capabilities obrigatórias indisponíveis.
- Tipos de tiles não reconhecidos.
- Arquétipos de inimigos não suportados.
- Tipos de itens incompatíveis.
- Recursos declarados sem implementação.
- Dependências entre capítulos.
- Referências cruzadas inválidas.
- Condições narrativas inválidas.

Evitar fallbacks silenciosos.

Um capítulo incompatível deve produzir diagnósticos tipados e não ser tratado como carregável.

Preservar o comportamento dos conteúdos legados válidos.

## 4. Condições narrativas de saída

Formalizar e validar o contrato `StageExitDefinition.condition`.

Inspecionar a integração implementada na Etapa 9.4D com `CampaignNarrativeAccessBinder`.

Garantir que:

- Uma condição declarada tenha semântica verificável.
- Referências de flags, missões e saídas sejam válidas.
- Condições desconhecidas sejam rejeitadas.
- O runtime não permita transições que violem condições obrigatórias.
- Os diagnósticos indiquem a saída e a condição incompatível.
- O comportamento permaneça determinístico.

Reutilizar o avaliador de condições narrativas existente.

Não implementar uma segunda linguagem de condições.

Não duplicar verificações entre `StageDirector`, `CampaignRouter` e os validadores sem necessidade.

## 5. Versionamento de capítulos e fases

Definir uma política explícita de versionamento e compatibilidade para conteúdo autoral.

Verificar como `manifestRevision` é atualmente utilizado.

Implementar o mínimo necessário para:

- Identificar revisão de capítulo e stage.
- Detectar incompatibilidade entre save e revisão atual.
- Preservar saves antigos sem sobrescrevê-los.
- Restaurar saves de revisões compatíveis.
- Retornar diagnóstico tipado para revisões incompatíveis.
- Evitar conflitos silenciosos de identidade.
- Permitir migração futura sem criar agora um framework genérico de migrações.

Não apagar saves automaticamente.

Não modificar chaves legadas sem estratégia de compatibilidade e testes.

Documentar a política adotada e suas limitações.

## 6. Validação do catálogo e das regiões

Estender a validação do catálogo declarativo existente.

Verificar coerência entre:

- `CampaignChapterCatalog`.
- `ChapterManifest`.
- `StageModule`.
- Bindings de região.
- Nós e arestas da campanha.
- Slots e limites de saídas físicas.
- Destinos declarados.
- Conteúdo efetivamente carregável.

Detectar regiões sem conteúdo, destinos inexistentes, bindings duplicados e inconsistências de referências.

Regiões intencionalmente marcadas como `planned` devem continuar válidas como planejamento, mas não devem se tornar jogáveis por fallback.

**Não generalizar completamente a topologia da campanha nesta etapa.** Identificar e documentar as dependências de `UmbraCampaignSkeleton` e `UmbraCampaignRouteSlice` que ainda precisam ser removidas em uma etapa posterior.

## 7. Compatibilidade com arquitetura existente

Preservar:

- Geração procedural determinística.
- Saídas físicas canônicas.
- Bindings entre arestas e destinos.
- Roteamento da campanha.
- Persistência e revisitas.
- Execução de comandos narrativos.
- Sinais de gameplay.
- Recompensas idempotentes.
- Conclusão de fases.
- World Lab.

Evitar alterações desnecessárias em `GameScene.ts`.

Não criar outro registry, outro loader ou um sistema de plugins paralelo.

## 8. Testes obrigatórios

Adicionar ou ampliar testes para:

1. Capítulo legado válido.
2. Stage legado válido.
3. Capítulo com capabilities compatíveis.
4. Capability obrigatória ausente.
5. Capability desconhecida.
6. Capability opcional indisponível.
7. Tile ou inimigo não suportado.
8. Referência cruzada inválida.
9. Condição de saída válida.
10. Condição de saída inválida.
11. Saída bloqueada por condição.
12. Binding de região inexistente.
13. Binding duplicado.
14. Região `planned` sem conteúdo.
15. Revisão compatível de save.
16. Revisão incompatível de save.
17. Save legado sem campo novo.
18. Preservação de save antigo.
19. Determinismo dos diagnósticos.
20. Não regressão da Etapa 9.4A–D.

Os testes devem verificar os serviços reais sempre que possível, não apenas objetos artificiais.

## 9. Documentação

Criar uma SPEC específica para a Etapa 9.5, seguindo o padrão existente.

Atualizar `SPEC/README.md`.

Criar o próximo registro sequencial em `prompts/`, utilizando `umbra-prompt-record/v1`.

Documentar:

- Contratos ampliados.
- Capabilities suportadas e planejadas.
- Semântica de compatibilidade.
- Diagnósticos.
- Regras de saída.
- Política de revisão de saves.
- Validação do catálogo.
- Limitações atuais para capítulos externos.
- Dependências da Etapa 9.5B.

## 10. Restrições

- Não iniciar a Etapa 9.5B.
- Não implementar novos tilesets ou biomas.
- Não criar novos tipos de inimigos.
- Não alterar combate ou progressão.
- Não implementar um editor visual.
- Não criar CLI de autoria.
- Não implementar carregamento remoto.
- Não introduzir framework de plugins.
- Não refatorar amplamente a `GameScene`.
- Não criar commits.
- Não executar push.

Se identificar uma incompatibilidade estrutural que exija trabalho fora do escopo, documentar o bloqueio e propor a menor alteração futura necessária.

## 11. Validações finais

Executar:

- Testes específicos da 9.5.
- Testes de campanha, narrativa, persistência e catálogo.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir regressões introduzidas nesta etapa.

Não enfraquecer os testes existentes.

## 12. Entrega

Apresentar:

1. Arquivos criados e modificados.
2. Contratos existentes reaproveitados.
3. Novas capabilities e diagnósticos.
4. Funcionalidades suportadas versus planejadas.
5. Política de compatibilidade e revisão.
6. Resultado da validação do catálogo.
7. Testes e verificações executados.
8. Limitações restantes.
9. Impacto sobre a criação de capítulos independentes.
10. Requisitos para a Etapa 9.5B.

**Critério de conclusão:** um capítulo deve poder declarar suas necessidades, ser validado contra as capacidades reais do motor e receber diagnósticos claros quando for incompatível, sem comprometer capítulos legados, saves ou a campanha procedural existente.

A implementação deve preparar a autoria independente sem criar uma arquitetura paralela àquela que já construímos.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
