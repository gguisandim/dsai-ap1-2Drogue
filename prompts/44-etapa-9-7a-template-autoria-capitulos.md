# Registro de prompt: Etapa 9.7A — Template de autoria de capítulos independentes

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-7a-template-autoria-capitulos`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-7a-template-autoria-capitulos.md`
- Commit: `pendente`
- Execução: `concluída; teste dirigido do template 9 testes aprovado; recorte dirigido de autoria, registry, loader, catálogo, narrativa e saídas 12 suítes/107 testes aprovado; suíte completa 75 suítes/1030 testes aprovada; typecheck e build aprovados; check:gates e git diff --check executados; homologação visual não executada por ausência de navegador`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-7a-template-autoria-capitulos.md`
- `SPEC/README.md`
- `prompts/44-etapa-9-7a-template-autoria-capitulos.md`
- `src/examples/chapter-template/README.md`
- `src/examples/chapter-template/ids.ts`
- `src/examples/chapter-template/level.ts`
- `src/examples/chapter-template/presentation.ts`
- `src/examples/chapter-template/encounter.ts`
- `src/examples/chapter-template/narrative.ts`
- `src/examples/chapter-template/stage.ts`
- `src/examples/chapter-template/chapter.ts`
- `src/examples/chapter-template/registration.ts`
- `src/examples/chapter-template/template.ts`
- `src/examples/chapter-template/index.ts`
- `src/tests/chapterTemplate.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.7A — Template de Autoria de Capítulos Independentes

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.6E.3.

## Objetivo

Criar um template oficial para desenvolvimento de capítulos independentes, permitindo que desenvolvedores e agentes de IA produzam novos conteúdos usando os contratos públicos existentes.

O template deve demonstrar como declarar um capítulo completo, incluindo:

- Identidade e revisão.
- Manifesto e fases.
- Mapa autoral.
- Encontros e inimigos.
- NPCs e diálogos.
- Missões e eventos narrativos.
- Recompensas.
- Apresentação visual e áudio.
- Entradas, saídas e destinos.
- Capabilities e dependências.
- Regras de elegibilidade e revisita.

**O objetivo é provar a independência dos capítulos, não implementar novas funcionalidades do motor.**

## 1. Inspeção inicial

Antes de modificar arquivos:

1. Ler `AGENTS.md`.
2. Ler as SPECs 9.5, 9.5B.1, 9.5B.2, 9.6A–E.3.
3. Inspecionar `StageManifest`, `StageModule`, `StageRegistry`, `StageLoader` e `StageValidator`.
4. Inspecionar `StageCatalogService` e `CampaignChapterCatalog`.
5. Inspecionar `StageEncounter`, `StagePresentation` e os contratos narrativos.
6. Inspecionar os arquivos do capítulo Rota das Águas e do Igapó.
7. Verificar a integração com `GameSessionService`, o modo individual e World Lab.
8. Identificar o mecanismo real de registro de capítulos.
9. Executar `git status --short`.

Não presumir nomes de tipos, APIs ou caminhos. Confirmar as interfaces implementadas.

Preservar alterações existentes.

## 2. Estrutura do template

Criar um template independente em uma localização apropriada, preferencialmente:

`examples/chapter-template/`

Caso a arquitetura exija outra localização, seguir as convenções existentes e documentar a escolha.

Organizar os arquivos por responsabilidades, por exemplo:

- Manifesto do capítulo.
- Manifesto da fase.
- Definição do mapa.
- Configuração de encontros.
- NPCs e diálogos.
- Eventos, missões e recompensas.
- Apresentação visual e áudio.
- Registro e exports.
- Testes.
- README de autoria.

Adaptar a estrutura aos contratos reais, evitando arquivos artificiais ou duplicações de dados.

O template não deve conter cópias de `StageLoader`, `StageValidator`, `CampaignRouter` ou outros sistemas centrais.

## 3. Capítulo demonstrativo

Criar um capítulo fictício mínimo, com pelo menos uma fase autoral efetivamente carregável e jogável.

A demonstração deve possuir:

1. Identificador estável do capítulo.
2. Revisão explícita.
3. Uma fase com mapa válido.
4. Spawn do jogador.
5. Um NPC interativo.
6. Um diálogo com escolha.
7. Uma missão simples.
8. Um encontro declarativo.
9. Pelo menos dois arquétipos de inimigos existentes.
10. Um evento narrativo associado ao gameplay.
11. Uma recompensa.
12. Uma condição de conclusão.
13. Uma saída válida ou encerramento compatível com o modo individual.
14. Tema visual declarado.
15. Referências a recursos locais válidos.

Reutilizar assets técnicos já existentes.

Não produzir arte definitiva nem adicionar um bioma novo ao jogo principal.

Não depender de `legacy.verse`, do Igapó ou de estados narrativos de outros capítulos.

**O exemplo deve ser independente, não uma cópia do Igapó com IDs diferentes.**

## 4. Autoria exclusivamente pelos contratos existentes

Implementar o capítulo utilizando:

- `StageModule`.
- `StageManifest`.
- `StageRegistry`.
- `StageCapabilities`.
- `StageEncounter`.
- `StagePresentation`.
- Contratos narrativos existentes.
- `StageCatalogService`.
- Infraestrutura existente de saídas físicas.

Utilizar os nomes e tipos reais encontrados no repositório.

Não criar um segundo formato de manifesto.

Não introduzir callbacks arbitrários de conteúdo ou execução de código externo.

## 5. Registro e descoberta

Demonstrar como registrar o capítulo pelo mecanismo público existente.

O capítulo deverá:

- Ser descoberto pelo catálogo.
- Ter suas fases listadas.
- Expor revisões e capabilities.
- Ser validado antes do carregamento.
- Estar disponível no modo individual quando compatível.
- Aparecer no World Lab quando registrado no ambiente apropriado.

Se o mecanismo atual exigir editar um arquivo central de registro de conteúdo, identificar precisamente esse ponto.

Permitir apenas a menor alteração necessária nesse ponto de extensão, sem alterar motor, renderer, roteador ou gerador.

Documentar essa limitação para a 9.7B/9.7C.

Não implementar descoberta dinâmica por filesystem nem carregamento remoto.

## 6. Elegibilidade para campanha

O capítulo demonstrativo deve ser jogável individualmente.

Não exigir nove fases para validar o template.

Declarar sua elegibilidade de acordo com as capacidades reais do conteúdo.

Se a fase não atender às restrições das políticas:

- `umbra.fixed-nine.v1`
- `umbra.branching-nine.v1`

ela deverá permanecer `individual-only` ou receber a classificação equivalente adequada.

**Não promover o template a candidato de campanha apenas para fazê-lo aparecer no compositor.**

Documentar como um autor poderá posteriormente declarar atos, marcos, dificuldade, capacidade de saídas e políticas de repetição.

## 7. Conteúdo narrativo e encontros

Demonstrar a utilização real dos sistemas implementados nas Etapas 9.4 e 9.6E.1.

A fase deve permitir uma sequência mínima:

`Entrar → Interagir com NPC → Receber objetivo → Completar encontro → Aplicar evento/recompensa → Liberar saída → Encerrar`

Usar somente comandos, sinais, condições e triggers suportados pelo runtime.

Não adicionar novos comandos narrativos.

Não alterar o comportamento dos inimigos.

Garantir que o exemplo preserve idempotência de recompensas e eventos.

## 8. Apresentação e assets

Criar uma configuração visual declarativa usando `StagePresentation` e os registries já implementados.

Incluir:

- Tema.
- Tileset válido.
- Decoração.
- Apresentação de NPC.
- Variante visual de inimigo.
- Música ou ambiência, quando houver recurso local compatível.

Usar placeholders técnicos identificados como tal.

Documentar como substituir recursos gráficos e sonoros.

Não baixar assets externos sem verificação de licença.

Não implementar carregamento remoto ou um novo asset manager.

## 9. Validação automática do capítulo

Reutilizar `StageValidator`, o catálogo e os demais validadores existentes.

O teste de autoria deve detectar:

- Manifesto inválido.
- ID duplicado.
- Referência inexistente.
- Capability indisponível.
- Dependência não satisfeita.
- Encontro inválido.
- Inimigo desconhecido.
- Recurso visual ausente.
- Referência narrativa inválida.
- Saída incompatível.
- Destino inexistente.
- Revisão inválida.

Não construir um validador paralelo.

Criar testes negativos por alteração controlada dos dados do template.

Os diagnósticos devem permanecer tipados e determinísticos.

## 10. Prova de independência

Este é o requisito principal.

Criar um teste que:

1. Registre o capítulo demonstrativo usando o mecanismo público.
2. Valide seu manifesto.
3. Descubra a fase pelo `StageCatalogService`.
4. Carregue a fase pelo `StageLoader`.
5. Resolva mapa, encontros e apresentação.
6. Execute a sequência narrativa mínima.
7. Verifique a recompensa e a condição de conclusão.
8. Resolva corretamente a saída ou encerramento.
9. Comprove isolamento em relação aos capítulos existentes.

Criar também uma segunda instância de teste do template, com novos IDs e revisão própria, demonstrando que a estrutura pode ser copiada e adaptada sem alterar os componentes centrais.

Não registrar esses exemplos no catálogo normal de produção.

Se necessário, utilizar um bootstrap isolado de testes ou desenvolvimento.

Não alterar especificamente:

- `GameScene`.
- `CampaignRouter`.
- `CampaignGraphGenerator`.
- `PhysicalExitResolver`.
- `CampaignExitBinder`.
- `StageLoader`.

Caso uma alteração central seja inevitável, registrar a causa concreta e limitar a mudança a um ponto de extensão reutilizável, nunca a um caso especial do template.

## 11. Documentação para contribuidores

Criar um README dentro do template, explicando:

1. Estrutura dos arquivos.
2. Como copiar o template.
3. Quais IDs precisam ser alterados.
4. Como definir uma fase.
5. Como criar NPCs e diálogos.
6. Como declarar encontros.
7. Como adicionar missões e recompensas.
8. Como configurar assets.
9. Como declarar saídas.
10. Como registrar o capítulo.
11. Como executar os testes.
12. Como abrir o conteúdo no World Lab.
13. Como testar a fase no jogo.
14. Como interpretar diagnósticos.

A documentação deve permitir que um desenvolvedor que não conhece os detalhes internos da `GameScene` consiga adaptar o exemplo.

Não documentar comandos inexistentes.

## 12. Preparação para a 9.7B

Organizar o template de forma que futuramente possa ser utilizado por uma CLI para:

- Criar um capítulo.
- Substituir IDs e nomes.
- Gerar arquivos iniciais.
- Executar validação.
- Abrir um preview.

**Não implementar esses comandos nesta etapa.**

Não criar scripts geradores provisórios que posteriormente precisarão ser substituídos.

## 13. Estratégia de execução para DeepSeek

Dividir o trabalho em três incrementos.

### A — Contratos e estrutura

- Inspecionar os mecanismos atuais.
- Definir a estrutura mínima.
- Criar SPEC.
- Implementar o template.
- Validar manifestos e referências.

### B — Integração jogável

- Implementar o conteúdo demonstrativo.
- Registrar em ambiente isolado.
- Testar carregamento.
- Testar encontro, narrativa, recompensa e saída.
- Comprovar independência.

### C — Documentação e validação

- Escrever o guia de autoria.
- Adicionar testes positivos e negativos.
- Executar regressões.
- Atualizar SPEC e registro de prompt.
- Executar validações finais.

Executar testes direcionados entre incrementos.

Executar a suíte completa somente após a última alteração funcional.

Se houver interrupção por limite de uso, preservar o worktree e registrar o ponto exato da implementação.

Não reiniciar sistemas existentes.

## 14. Restrições

- Não iniciar a 9.7B ou 9.7C.
- Não implementar CLI.
- Não criar editor visual.
- Não criar outro registry.
- Não criar outro validador.
- Não criar novo compositor.
- Não alterar combate ou IA.
- Não modificar topologias de campanha.
- Não alterar saves.
- Não adicionar capítulos fictícios à produção.
- Não criar carregamento remoto.
- Não implementar marketplace ou plugins externos.
- Não refatorar amplamente o motor.
- Não criar commit nem executar push.

## 15. Documentação da etapa

Criar:

`SPEC/2026-10-31-etapa-9-7a-template-autoria-capitulos.md`

Atualizar:

`SPEC/README.md`

Criar o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

O último registro conhecido é o 43. Verificar se o número 44 está disponível antes de utilizá-lo.

Documentar:

- Contratos utilizados.
- Estrutura do template.
- Fluxo de registro.
- Como adaptar o capítulo.
- Limitações.
- Prova de independência.
- Resultados de testes.
- Pendências para a 9.7B.

## 16. Validações finais

Executar:

- Testes específicos do template.
- Testes de `StageRegistry`.
- Testes de `StageLoader`.
- Testes de `StageValidator`.
- Testes de catálogo.
- Testes narrativos.
- Testes de encontros.
- Testes de saídas.
- Testes de integração de capítulo independente.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes.

Quando houver navegador disponível, verificar carregamento e interação com a fase demonstrativa. Não declarar homologação visual sem execução real.

## 17. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Estrutura definitiva do template.
3. Contratos públicos utilizados.
4. Funcionamento do capítulo demonstrativo.
5. Fluxo de registro e descoberta.
6. Integração com encontros e narrativa.
7. Integração com apresentação e saídas.
8. Resultado da prova de independência.
9. Resultado da segunda cópia do template.
10. Testes executados.
11. Homologação efetivamente realizada.
12. Limitações do mecanismo atual de registro.
13. Estado para commit.
14. Requisitos para a 9.7B.

## Critério de conclusão

Um desenvolvedor deve conseguir criar um capítulo independente a partir do template, alterando apenas os arquivos próprios do conteúdo e utilizando o ponto público de registro existente.

O capítulo deve ser descoberto, validado, carregado e executado pelo jogo, com NPC, diálogo, missão, encontro, recompensa e conclusão funcional.

O template não pode depender de condições específicas dentro da `GameScene` nem de alterações nos sistemas centrais de campanha.

**A Etapa 9.7A deve demonstrar autoria independente na prática, não apenas fornecer exemplos de interfaces TypeScript.**

Não criar commit nem executar push. Entregar implementação, testes, documentação e relatório factual.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
