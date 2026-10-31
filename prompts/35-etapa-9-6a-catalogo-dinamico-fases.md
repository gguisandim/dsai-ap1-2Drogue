# Registro de prompt: Etapa 9.6A — Catálogo Dinâmico de Fases

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-6a-catalogo-dinamico-fases`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-6a-catalogo-dinamico-fases.md`
- Commit: `pendente`
- Execução: `concluída`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-6a-catalogo-dinamico-fases.md`
- `SPEC/README.md`
- `prompts/35-etapa-9-6a-catalogo-dinamico-fases.md`
- `src/devtools/world-lab/WorldLabMacroDataService.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/contracts/StageCatalog.ts`
- `src/stages/contracts/StageManifest.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageCatalogService.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/tests/campaignChapterCatalog.test.ts`
- `src/tests/stageCatalogService.test.ts`
- `src/tests/worldLabMacroUi.test.ts`
- `src/tests/worldLabPoi.test.ts`

## Validações executadas

- Testes específicos do catálogo: 17 testes aprovados.
- Testes direcionados de catálogo, registry, loader, autoria, campanha macro, saves e World Lab: 15 suites e 113 testes aprovados.
- `npm test -- --runInBand`: 70 suites e 951 testes aprovados.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; 727 módulos transformados.
- `npm run check:gates`: aprovado; 827 arquivos, 2.971 dependências, 31 registros v1, 8 legados aceitos e 1 commit pendente.
- `scripts/auditar-segredos-prompts.ps1 prompts/sessoes`: aprovado; nenhum segredo conhecido em 20 arquivos.
- `git diff --check`: aprovado; somente avisos de normalização LF/CRLF.

## Prompt efetivamente recebido

```text
# Etapa 9.6A — Catálogo Dinâmico de Fases

Continue o desenvolvimento do **Umbra Trail** após a Etapa 9.5B.2, preparando a arquitetura para campanhas compostas dinamicamente a partir de fases independentes.

## Objetivo

Implementar a descoberta, catalogação e consulta dinâmica de fases registradas no jogo, substituindo gradualmente dependências de listas e identificadores fixos.

O sistema deve permitir que qualquer capítulo registrado disponibilize fases elegíveis para campanhas, sem exigir alterações específicas em `GameScene.ts`, no gerador procedural ou no roteador central.

Esta etapa é a base para a futura **9.6B — Seleção Determinística de N Fases a partir de um Catálogo Maior**.

**Não implementar o sorteio de 9 entre 35 nesta etapa. Preparar os contratos e as APIs necessárias para isso.**

## 1. Inspeção obrigatória

Antes de alterar arquivos:

- Ler `AGENTS.md` e as instruções arquiteturais.
- Ler as SPECs das Etapas 8.1–8.4, 9.3B, 9.5, 9.5B.1 e 9.5B.2.
- Inspecionar `StageRegistry`, `StageLoader`, `StageModule`, `ChapterManifest`, `StageManifest` e `CampaignChapterCatalog`.
- Inspecionar `registerCampaignChapters.ts`.
- Inspecionar `UmbraCampaignSkeleton.ts` e `UmbraCampaignRouteSlice.ts`.
- Inspecionar `CampaignGraphGenerator`, `CampaignGraphValidator` e `CampaignRouter`.
- Identificar a origem de `STAGE_IDS`, presets e listas fixas.
- Verificar o uso dessas estruturas em saves, testes, World Lab e integração Phaser.
- Executar `git status --short` e preservar o estado existente.

Não assumir que listas fixas podem ser removidas imediatamente. Identificar primeiro suas responsabilidades reais.

## 2. Modelo de fase catalogável

Reutilizar e ampliar os contratos existentes apenas quando necessário.

Cada fase deverá possuir metadados suficientes para permitir sua descoberta e futura seleção, como:

- Identificador estável da fase.
- Identificador do capítulo de origem.
- Revisão do conteúdo.
- Nome de apresentação, quando disponível.
- Região ou bioma associado.
- Tipo ou papel da fase.
- Dificuldade ou faixa de progressão.
- Capabilities obrigatórias e opcionais.
- Dependências narrativas.
- Requisitos de entradas e saídas.
- Estado de disponibilidade.
- Elegibilidade para campanha procedural.
- Metadados necessários para futura composição por atos.

Não criar um segundo `StageManifest`.

Utilizar os contratos atuais como fonte de verdade e projetar os dados necessários à consulta.

Distinguir explicitamente:

1. Definição de fase (`stageId`).
2. Instância da fase em uma campanha.
3. Nó do grafo (`nodeId`).
4. Visita ou ocorrência da fase.

Essas identidades não devem ser confundidas.

Uma mesma definição poderá futuramente participar de campanhas diferentes, sem compartilhar incorretamente saves ou estados.

## 3. Descoberta dinâmica

Implementar um serviço headless para descobrir fases a partir dos capítulos já registrados.

Preferir estender a infraestrutura existente a criar outro registry.

A descoberta deve:

1. Consultar capítulos e stages registrados.
2. Construir uma visão canônica das fases disponíveis.
3. Validar identificadores e referências.
4. Consultar o perfil real de capabilities.
5. Identificar conteúdo carregável e conteúdo apenas planejado.
6. Disponibilizar consultas e filtros determinísticos.
7. Retornar diagnósticos tipados quando houver inconsistências.

O sistema não deve depender da ordem de registro dos capítulos.

Não utilizar nomes de regiões ou biomas em condicionais do código central.

## 4. Elegibilidade para campanhas

Implementar uma classificação explícita de elegibilidade.

Uma fase poderá ser:

- Elegível para composição procedural.
- Disponível apenas para execução individual.
- Reservada para marco narrativo ou posição especial.
- Planejada, sem conteúdo carregável.
- Incompatível com as capabilities atuais.
- Bloqueada por dependências não satisfeitas.

Essas categorias são conceituais: adapte-as aos contratos existentes, evitando estados redundantes ou contraditórios.

Não confundir **fase tecnicamente carregável** com **fase elegível para determinada campanha**.

A elegibilidade geral deve ser calculada com as informações disponíveis; restrições dependentes de uma run específica serão avaliadas na 9.6B.

Regiões `planned` não podem participar de campanhas jogáveis por fallback.

## 5. API de consulta

Disponibilizar uma API headless, tipada e determinística para:

- Listar fases registradas.
- Consultar fase por ID.
- Listar fases de um capítulo.
- Filtrar por região ou bioma.
- Filtrar por papel narrativo.
- Filtrar por dificuldade, quando declarada.
- Identificar fases elegíveis.
- Identificar fases incompatíveis.
- Obter os diagnósticos de exclusão.

Preservar IDs estáveis e ordenação canônica.

Evitar acoplamento com Phaser, DOM, UI ou storage.

Não implementar escolhas aleatórias neste serviço.

## 6. Tratamento de listas fixas

Investigar os usos de `STAGE_IDS` e estruturas semelhantes.

Separar:

- Listas fixas que representam contratos legados legítimos.
- Listas fixas que restringem indevidamente a descoberta de conteúdo.
- Listas que definem topologia de campanha.
- Listas que representam recursos técnicos do motor.

Substituir apenas os pontos em que a descoberta dinâmica já pode assumir a responsabilidade com segurança.

Preservar adaptadores de compatibilidade quando necessário.

Não remover a topologia existente da campanha macro nesta etapa.

Documentar precisamente quais dependências de `UmbraCampaignSkeleton` e `UmbraCampaignRouteSlice` continuarão para a 9.6B e etapas posteriores.

## 7. Integração com CampaignChapterCatalog

Garantir que a inclusão de uma nova fase em um capítulo registrado permita sua descoberta automaticamente.

O catálogo deve ser capaz de responder:

- Quais fases existem?
- A qual capítulo pertencem?
- Quais estão prontas para uso?
- Quais podem participar de campanhas?
- Quais requisitos ainda não são atendidos?
- Quais são seus identificadores e revisões?

Não exigir novo `if`, `switch` ou lista central de IDs para cada fase cadastrada.

A validação deve ocorrer antes da publicação de um catálogo inconsistente.

Preservar a atomicidade e os diagnósticos determinísticos estabelecidos na 9.5.

## 8. Preparação para composição de campanhas

Definir um modelo de consulta que a futura 9.6B possa consumir diretamente.

A API deve permitir obter um conjunto de fases candidatas com metadados suficientes para:

- Seleção por seed.
- Seleção de quantidade limitada.
- Distribuição por atos.
- Marcos narrativos obrigatórios.
- Controle de repetição.
- Restrições de dificuldade.
- Compatibilidade de entradas e saídas.
- Identificação de fases obrigatórias e opcionais.

**Não implementar essas políticas agora.**

Não alterar `CampaignGraphGenerator` para realizar seleção de conteúdo.

O objetivo é separar duas responsabilidades:

`Catálogo → Descobrir fases candidatas`

`Compositor futuro → Selecionar fases e montar a campanha`

Evitar misturar descoberta de conteúdo com geração de topologia.

## 9. Compatibilidade com o jogo existente

Preservar:

- Campanha macro atual.
- Igapó dos Esquecidos.
- Hub e rotas existentes.
- Geração procedural.
- Determinismo.
- Saídas físicas.
- Binding canônico.
- Narrativa e missões.
- Recompensas e progressão.
- Saves e revisitas.
- Temas e apresentação visual.
- World Lab.

A introdução do catálogo dinâmico não pode alterar a campanha atual sem uma decisão explícita de configuração.

Não modificar `GameScene.ts` para cadastrar novos conteúdos.

## 10. Integração com World Lab

Adicionar inspeção do catálogo dinâmico, aproveitando os serviços existentes.

Permitir visualizar ou consultar:

- Fases descobertas.
- Capítulos de origem.
- IDs e revisões.
- Elegibilidade.
- Capabilities.
- Dependências.
- Diagnósticos de incompatibilidade.

Não reconstruir o World Lab.

Não implementar ainda a interface de seleção de fases do menu principal.

## 11. Testes obrigatórios

Criar ou atualizar testes cobrindo:

1. Catálogo vazio.
2. Um capítulo com uma fase.
3. Um capítulo com múltiplas fases.
4. Múltiplos capítulos registrados.
5. IDs duplicados.
6. Referências inexistentes.
7. Capabilities incompatíveis.
8. Fase `planned`.
9. Fase elegível para campanha.
10. Fase disponível apenas individualmente.
11. Fase reservada para marco narrativo.
12. Reordenação dos registros.
13. Determinismo das consultas.
14. Inclusão de nova fase sem editar o motor.
15. Compatibilidade com o Igapó.
16. Compatibilidade com a campanha macro.
17. Preservação de IDs de saves.
18. Integração com World Lab.
19. Ausência de dependências Phaser no serviço.
20. Catálogo com 35 definições sintéticas e consulta estável de todas elas.

O último cenário deve demonstrar capacidade de catalogação, **não seleção de nove fases**.

Não adicionar 35 fases reais ou placeholders à campanha de produção.

## 12. Documentação

Criar uma SPEC da Etapa 9.6A, seguindo a convenção atual do repositório.

Atualizar `SPEC/README.md`.

Criar o próximo registro sequencial em `prompts/`, no formato `umbra-prompt-record/v1`.

Documentar:

- Modelo de fase catalogável.
- API de descoberta.
- Regras de elegibilidade.
- Diagnósticos.
- Diferença entre definição, instância, nó e visita.
- Integração com capítulos.
- Compatibilidade legada.
- Como registrar uma nova fase.
- Limitações para composição dinâmica.
- Contratos necessários à 9.6B.

## 13. Restrições

- Não implementar a Etapa 9.6B.
- Não sortear fases.
- Não implementar campanha de 9 entre 35.
- Não alterar a topologia da campanha macro.
- Não implementar seleção de fases no menu.
- Não criar editor de fases.
- Não implementar CLI.
- Não criar outro registry de capítulos.
- Não modificar os algoritmos procedurais.
- Não alterar combate ou IA.
- Não criar condicionais por bioma em `GameScene`.
- Não adicionar dependências desnecessárias.
- Não criar commit nem executar push.

## 14. Validações finais

Executar:

- Testes específicos do catálogo.
- Testes de `StageRegistry` e `StageLoader`.
- Testes de compatibilidade de autoria.
- Testes de campanha macro.
- Testes do World Lab.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir as regressões introduzidas.

Não enfraquecer testes existentes.

## 15. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Contratos ampliados.
3. Funcionamento da descoberta dinâmica.
4. API pública disponibilizada.
5. Política de elegibilidade.
6. Tratamento das listas fixas.
7. Integração com o catálogo de capítulos.
8. Resultado de testes com múltiplos capítulos.
9. Resultado da fixture de 35 fases.
10. Integração com World Lab.
11. Compatibilidade com saves.
12. Dependências restantes para a 9.6B.
13. Resultados das validações.
14. Estado para commit.

**Critério de conclusão:** adicionar uma nova fase válida a um capítulo registrado deve torná-la automaticamente descobrível e consultável pelo catálogo, com elegibilidade e diagnósticos determinísticos, sem alterações específicas em `GameScene`, `CampaignRouter` ou nos geradores procedurais.

A Etapa 9.6A deve estabelecer a fonte de dados necessária para que a próxima etapa implemente a seleção de N fases entre um conjunto maior, preservando a modularidade e a futura autoria open source.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.

