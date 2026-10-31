# Registro de prompt: Etapa 9.6E.1 — Desacoplamento do Motor e Configuração Declarativa de Encontros

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6e1-desacoplamento-motor-encontros`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6e1-desacoplamento-motor-encontros.md`
- Commit: `pendente`
- Execução: `concluída; recorte dirigido de encontros/autoria 62/62, recorte de narrativa/campanha/persistência 148/149 com uma incompatibilidade corrigida e revalidada em 26/26, suíte completa 74 suítes/1005 testes aprovada; typecheck, build, architecture, traceability e git diff --check aprovados`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6e1-desacoplamento-motor-encontros.md`
- `SPEC/README.md`
- `prompts/41-etapa-9-6e1-desacoplamento-motor-encontros.md`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/scenes/GameScene.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/contracts/StageCapabilities.ts`
- `src/stages/contracts/StageEncounter.ts`
- `src/stages/contracts/StageLoad.ts`
- `src/stages/contracts/StageModule.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/PhysicalExitResolver.ts`
- `src/stages/runtime/ResolvedLevelValidator.ts`
- `src/stages/runtime/StageEncounterResolver.ts`
- `src/stages/runtime/StageLoader.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/stageCharacterization.test.ts`
- `src/tests/stageContracts.test.ts`
- `src/tests/stageEntityPresentation.test.ts`
- `src/tests/stageLoaderProcedural.test.ts`
- `src/tests/stageLoaderValidation.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.6E.1 — Desacoplamento do Motor e Configuração Declarativa de Encontros

Continue o desenvolvimento do **Umbra Trail**, após a conclusão da Etapa 9.6D.

## Objetivo

Reduzir o acoplamento entre o motor e os conteúdos específicos do jogo, especialmente na `GameScene`, no sistema de encontros e nas dependências temporárias de capítulos legados.

O objetivo arquitetural é permitir que um capítulo independente declare seus encontros, inimigos, progressão e dependências sem precisar modificar diretamente os sistemas centrais de gameplay.

**Não criar novos frameworks. Reutilizar os contratos, validadores e serviços existentes.**

## 1. Inspeção inicial

Antes de alterar código:

- Ler `AGENTS.md`.
- Ler as SPECs 9.5, 9.5B.1, 9.5B.2, 9.6A–D.
- Inspecionar `src/scenes/GameScene.ts`.
- Inspecionar `GameStageCompositionRoot`, `StageLoader`, `StageManifest`, `StageModule` e `StageValidator`.
- Inspecionar `StageCatalogService`, `StageRuntimeCapabilities` e `CampaignChapterCatalog`.
- Localizar as implementações atuais dos encontros, ondas, spawns e minibosses.
- Investigar todas as referências a `legacy.verse`.
- Inspecionar testes de combate, encontros, narrativa e campanha.
- Executar `git status --short`.

Preservar alterações existentes. Não modificar arquivos antes de identificar suas responsabilidades reais.

## 2. Auditoria de acoplamento

Mapear na `GameScene`:

1. Configurações de encontros hardcoded.
2. Regras de seleção de inimigos.
3. Composição das ondas.
4. Parâmetros de spawn.
5. Progressão de minibosses e chefes.
6. Referências diretas a capítulos, biomas ou fases.
7. Dependências narrativas específicas.
8. Responsabilidades que já possuem serviços equivalentes fora da cena.

Classificar cada ocorrência como:

- Regra legítima do motor.
- Configuração específica de conteúdo.
- Integração necessária ao Phaser.
- Acoplamento desnecessário.

**Não extrair código apenas para reduzir o tamanho da `GameScene`.**

Extrair somente responsabilidades com fronteiras claras e benefício demonstrável para autoria independente.

Registrar a auditoria na SPEC.

## 3. Configuração declarativa de encontros

Permitir que fases declarem seus encontros reutilizando os contratos existentes.

Quando necessário, ampliar os contratos para representar:

- Arquétipos disponíveis.
- Composição das ondas.
- Quantidade de inimigos.
- Regras de spawn.
- Escalonamento de dificuldade.
- Encontros especiais.
- Minibosses e chefes.
- Condições de início e conclusão.

Preservar os arquétipos já suportados:

`affinity`, `applaud`, `fortitudo`, `ranged`, `boss`, `miniboss`.

Não criar novos arquétipos ou comportamentos de IA.

Reutilizar o sistema atual de ondas e encontros; a mudança deve ocorrer na origem das configurações, não na implementação das mecânicas.

A configuração precisa funcionar tanto em fases autorais quanto procedurais.

## 4. Extração controlada da GameScene

Mover a resolução de configurações específicas para uma camada apropriada, preferencialmente próxima aos serviços de stage já existentes.

A `GameScene` deve continuar responsável por:

- Ciclo de vida Phaser.
- Instanciação e atualização de entidades.
- Integração com input.
- Renderização e apresentação.
- Comunicação com sistemas de gameplay.

As regras configuráveis devem ser fornecidas por contratos ou serviços existentes.

Não adicionar condicionais específicas para Igapó, Rota das Águas ou capítulos futuros.

Evitar criar outro diretor de encontros se o sistema atual já cumprir essa função.

Preservar os tempos e comportamentos existentes das ondas, incluindo intervalos, transições, minibosses e conclusão de encontros.

## 5. Compatibilidade de conteúdo legado

Garantir que fases antigas continuem funcionando sem declarar imediatamente todas as novas configurações.

Implementar fallback explícito e documentado para conteúdos legados.

O fallback deve:

- Preservar o comportamento anterior.
- Não alterar dificuldade silenciosamente.
- Não tornar conteúdo incompleto elegível para campanhas.
- Não esconder referências inválidas.
- Não introduzir dependências globais entre capítulos.

Conteúdo novo deve utilizar preferencialmente os contratos declarativos.

## 6. Dependência legacy.verse

Localizar e analisar todas as referências a `legacy.verse`, especialmente na Rota das Águas.

Determinar se cada referência representa:

- Uma dependência narrativa real.
- Uma compatibilidade temporária.
- Um identificador de conteúdo legado.
- Uma dependência técnica desnecessária.

Quando existir substituição declarativa equivalente, eliminar o acoplamento sem alterar a semântica narrativa.

Quando não existir substituição segura, manter um adaptador de compatibilidade explícito e documentar a pendência.

Não remover `legacy.verse` simplesmente para fazer desaparecer uma dependência.

Não modificar saves ou estados narrativos persistidos sem necessidade comprovada.

## 7. Capabilities e validação

Integrar os novos contratos ao `StageValidator` e às capabilities reais.

Verificar:

- Arquétipos inexistentes.
- Configurações incompletas.
- Quantidades inválidas.
- Referências a entidades ausentes.
- Dependências narrativas inválidas.
- Condições incompatíveis.
- Recursos não suportados pelo runtime.

Retornar diagnósticos tipados e determinísticos.

Não promover capabilities a `supported` se não estiverem integradas ao gameplay real.

Evitar outro catálogo de capabilities paralelo.

## 8. Preservação do gameplay

As mudanças não podem alterar involuntariamente:

- Movimento dos personagens.
- Hitboxes.
- Dano e velocidade.
- IA dos inimigos.
- Progressão das ondas.
- Spawn de minibosses.
- Comportamento de chefes.
- Eventos `enemy.defeated`.
- Eventos `encounter.completed`.
- Recompensas.
- Missões e diálogos.
- Persistência narrativa.
- Transições físicas.
- Conclusão da campanha.

Preservar os sistemas de idempotência e isolamento de instâncias corrigidos na 9.6D.

## 9. Demonstração de independência

Criar um teste de integração com um capítulo/fase sintético que declare uma configuração de encontros diferente da configuração legada.

O teste deve comprovar:

1. Registro do conteúdo.
2. Validação do manifesto.
3. Carregamento pelo `StageLoader`.
4. Resolução da configuração de encontros.
5. Execução pelo sistema existente.
6. Emissão correta dos eventos.
7. Conclusão dos encontros.
8. Ausência de modificações específicas na `GameScene`.

Não incluir o capítulo sintético no catálogo de produção.

Não criar novos biomas ou assets definitivos.

## 10. Testes obrigatórios

Adicionar ou atualizar testes para:

- Configuração declarativa válida.
- Configuração inválida.
- Arquétipo desconhecido.
- Composição de ondas.
- Quantidade de inimigos.
- Spawn e progressão.
- Miniboss e boss.
- Conclusão do encontro.
- Eventos narrativos.
- Configuração legada.
- Fase autoral.
- Fase procedural.
- Dependência `legacy.verse`.
- Carregamento de capítulo independente.
- Compatibilidade com a campanha clássica.
- Compatibilidade com campanhas compostas.
- Saves e restauração.
- Ausência de regressões da 9.6D.

Priorizar testes de comportamento em vez de testes que verifiquem apenas detalhes internos da implementação.

## 11. Limites da etapa

Não implementar:

- A 9.6E.2 — Topologias flexíveis.
- A 9.6E.3 — Revisão estrutural de persistência e contratos.
- Bifurcações ou revisitas novas.
- Alteração da política `umbra.fixed-nine.v1`.
- Novo sistema de combate.
- Novos arquétipos.
- Novo gerador procedural.
- Novo compositor.
- Novo roteador.
- Editor de fases.
- CLI ou SDK.
- Carregamento remoto.
- Refatoração geral da arquitetura do projeto.

Não modificar `CampaignGraphGenerator`, `PhysicalExitResolver` ou `CampaignExitBinder` salvo para corrigir uma incompatibilidade diretamente demonstrada.

## 12. Estratégia de implementação

Dividir a execução em três incrementos.

**A — Auditoria e contratos**

Mapear acoplamentos, determinar o que realmente precisa ser extraído e preparar contratos mínimos.

**B — Integração e compatibilidade**

Conectar configurações declarativas ao runtime, preservar o legado e reduzir dependências específicas de conteúdo.

**C — Demonstração e validação**

Executar o capítulo sintético, testes de regressão, validações completas e documentação.

Executar testes direcionados entre os incrementos.

Evitar executar a suíte completa repetidamente durante modificações intermediárias.

## 13. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-6e1-desacoplamento-motor-encontros.md`

Atualizar `SPEC/README.md`.

Criar o próximo registro disponível em `prompts/`, seguindo `umbra-prompt-record/v1`. O registro anterior foi o 40; verificar a numeração antes de criar o 41.

Documentar:

- Acoplamentos identificados.
- Responsabilidades extraídas.
- Contratos de encontros.
- Integração com Phaser.
- Estratégia de compatibilidade.
- Situação de `legacy.verse`.
- Capabilities efetivamente suportadas.
- Como um novo capítulo declara encontros.
- Limitações.
- Dependências para a 9.6E.2.

## 14. Validação final

Após a última alteração funcional, executar:

- Testes direcionados de encontros e waves.
- Testes de autoria e stages.
- Testes narrativos.
- Testes de campanha.
- Testes de persistência.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes para fazer a suíte passar.

## 15. Relatório final

Informar:

1. Arquivos criados e modificados.
2. Acoplamentos identificados.
3. Responsabilidades removidas da `GameScene`.
4. Contratos declarativos implementados.
5. Funcionamento dos encontros.
6. Compatibilidade com gameplay legado.
7. Situação das dependências `legacy.verse`.
8. Capabilities atualizadas.
9. Resultado do capítulo sintético.
10. Testes e validações.
11. Limitações restantes.
12. Estado para commit.
13. Pendências da 9.6E.2.

## Critério de conclusão

Um capítulo independente deve conseguir declarar uma configuração própria de encontros, utilizando os arquétipos e sistemas de gameplay existentes, sem introduzir condicionais específicas na `GameScene`.

As fases legadas, campanhas compostas, narrativa, combate, persistência e transições devem continuar funcionando.

**Esta etapa deve reduzir acoplamento real, não apenas redistribuir código entre arquivos.**

Não criar commit nem executar push. Entregar somente a implementação, documentação, testes e relatório factual.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit ou push deve ser criado nesta etapa.
