# Auditoria de eficiência do desenvolvimento assistido por IA

**Data:** 2026-10-31  
**Escopo:** instruções de agentes, validações, testes, documentação consultada, dependências de contexto e automação de CI  
**Natureza:** auditoria somente leitura; nenhum código, contrato, teste ou configuração foi alterado

## 1. Resumo executivo

O repositório preserva boa cobertura e disciplina de rastreabilidade, mas o fluxo assistido por IA paga repetidamente por três categorias de custo:

1. validações equivalentes são disparadas por caminhos diferentes;
2. ciclos locais usam com frequência a suíte completa quando uma seleção dirigida seria suficiente durante a iteração;
3. tarefas isoladas recebem contexto documental e de integração maior do que o necessário.

A medição desta auditoria encontrou 70 arquivos de teste, 951 testes e 116,353 s de tempo total informado pelo Jest em execução serial. Os dez arquivos mais demorados somaram 74,026 s dos 111,818 s atribuídos pelo relatório a arquivos de teste. Quatro suítes do World Lab somaram 27,955 s. Esses números identificam onde medir e otimizar primeiro, mas não devem ser interpretados como tempo integralmente removível: a transformação inicial do `ts-jest` e a ordem serial afetam especialmente o primeiro arquivo executado.

As ações de maior retorno e menor risco são:

- adotar testes dirigidos durante a edição e executar a suíte completa apenas uma vez no fechamento;
- criar, em etapa posterior, um único orquestrador de validação que não repita typecheck nem a verificação positiva dos gates;
- resumir saídas em relatórios temporários, exibindo apenas falhas, totais e arquivos lentos;
- impedir que agentes leiam SPECs históricas e registros de prompts quando não forem dependências diretas da tarefa;
- extrair factories de teste para o registro de fases e para a projeção do World Lab, mantendo todas as asserções existentes.

Não há telemetria de tokens por arquivo ou comando no repositório. Por isso, esta auditoria não atribui percentuais de economia de tokens; usa somente linhas, bytes, ocorrências e tempos efetivamente observados como proxies.

## 2. Método e limites

Foram inspecionados:

- `AGENTS.md`, `README.md`, `SPEC/README.md` e as SPECs relevantes para arquitetura e campanha;
- `package.json`, configuração do Jest e `.github/workflows/publicar-pages.yml`;
- inventário e conteúdo direcionado de `src/tests/`;
- contratos públicos e barrels de `src/stages/`;
- serviços e adaptadores que aparecem nas suítes mais custosas;
- inventário de `SPEC/`, `prompts/` e documentação de auditoria existente.

Foi feita uma única medição completa dedicada do Jest, com JSON temporário, para obter tempos por arquivo. Os scripts de arquitetura, rastreabilidade e typecheck foram medidos separadamente. O build não foi repetido porque já havia uma execução bem-sucedida imediatamente anterior e o pedido proíbe validações redundantes.

Comandos medidos nesta auditoria:

```text
npm test -- --runInBand --json --outputFile=.tmp/agent-efficiency-audit/jest-results.json --silent
npm run check:architecture
npm run check:traceability
npm run typecheck
```

Limitações da medição:

- a suíte foi executada em Windows, em um único processo;
- o tempo por arquivo inclui custo de transformação, carregamento e ordem de execução;
- o arquivo executado primeiro absorve parte relevante do cold start do `ts-jest`;
- os tempos de comandos separados não são automaticamente aditivos;
- não foi feito benchmark paralelo, com cache persistido ou com outro transformador;
- não há medição de tokens de entrada/saída dos agentes.

## 3. Linha de base observada

### 3.1 Testes e validações

| Medida | Resultado |
|---|---:|
| Arquivos `*.test.ts` | 70 |
| Linhas em testes | 14.308 |
| Tamanho dos testes | 565.303 bytes |
| Suítes Jest aprovadas | 70 |
| Testes Jest aprovados | 951 |
| Tempo total informado pelo Jest | 116,353 s |
| Soma dos tempos por arquivo no JSON | 111,818 s |
| Soma dos 10 arquivos mais demorados | 74,026 s |
| Relatório JSON temporário | 377.944 bytes |
| `check:architecture` | 8,764 s; 827 arquivos e 2.971 dependências |
| `check:traceability` | 7,733 s; 31 registros v1, 8 legados, 0 pendências |
| `typecheck` | 30,010 s; aprovado |

Uma execução dirigida preexistente, mantida como evidência para evitar repetição, executou 15 suítes e 113 testes em 49,173 s. Comparada à medição completa de 116,353 s, a diferença bruta observada foi de 67,180 s. A comparação não é um benchmark controlado — ordem e cache podem variar —, mas demonstra que a seleção dirigida reduz materialmente o ciclo de feedback sem substituir a validação final.

O build recente não foi repetido. Nessa execução adjacente, a fase Vite informou 18,83 s para 727 módulos e o comando completo levou aproximadamente 44–45 s. O comando `npm run build` chama `npm run typecheck`; portanto, executar ambos sem mudança intermediária repete aproximadamente o componente de 30 s medido para TypeScript.

### 3.2 Arquivos de teste com maior tempo atribuído

| Arquivo | Tempo | Testes | Observação |
|---|---:|---:|---|
| `worldLabPoi.test.ts` | 12,165 s | 1 | Primeiro/cold start pode dominar; não atribuir todo o tempo ao único teste |
| `generatedSimulationMatrix.test.ts` | 10,164 s | 301 | Executa 300 cenários e o replay determinístico de cada um |
| `architectureGates.test.ts` | 9,748 s | 5 | Dispara processo externo do gate em repositório e fixtures |
| `traceabilityGates.test.ts` | 8,534 s | 7 | Dispara processo externo do gate em repositório e fixtures |
| `stageCharacterization.test.ts` | 7,695 s | 16 | Cobertura integrada de caracterização |
| `worldLab.test.ts` | 7,087 s | 11 | Montagem e projeção do World Lab |
| `worldLabMacroUi.test.ts` | 6,416 s | 7 | Integração de UI macro |
| `macroCampaignPhaserAdapter.test.ts` | 5,143 s | 9 | Adaptador integrado de campanha e Phaser |
| `campaignMacroProgression.test.ts` | 4,025 s | 18 | Progressão macro |
| `editorTools.test.ts` | 3,049 s | 10 | Ferramentas de editor |

Os quatro arquivos `worldLab*.test.ts` somaram 27,955 s e 22 testes. As duas suítes de gates somaram 18,282 s e 12 testes. Esses agregados são alvos de investigação, não autorizações para remoção.

### 3.3 Volume documental usado como proxy de contexto

| Área | Arquivos/linhas | Tamanho/observação |
|---|---:|---|
| SPECs | 38 arquivos; 5.484 linhas | 281.089 bytes |
| `AGENTS.md` | 105 linhas | Leitura obrigatória e regras globais |
| `README.md` | 132 linhas | Leitura mínima global |
| `SPEC/README.md` | 55 linhas | Índice de SPECs |
| `src/stages/index.ts` | 192 linhas | Barrel público amplo |
| Prompts Markdown na raiz de `prompts/` | 42 arquivos; 6.769 linhas | 266.145 bytes |
| Sessões registradas | 20 arquivos | Não são contexto normal de implementação |

As duas maiores SPECs — arquitetura modular e campanha procedural ramificada — somam 2.461 linhas. Quando prompts de etapa exigem ambas, além de várias SPECs históricas, contratos e implementação anterior, uma tarefa local pode começar com milhares de linhas antes de ler o módulo afetado.

A íntegra dos prompts nos registros é uma exigência de rastreabilidade e não deve ser removida. O ganho está em não carregar esses registros históricos no contexto normal do agente.

## 4. Diagnóstico

### 4.1 Validações repetidas

O fluxo de Pages executa, nesta ordem:

1. `npm ci`;
2. `npm run check:gates`;
3. `npm test -- --runInBand`;
4. `npm run build`.

Há duas sobreposições principais:

- `build` já executa `typecheck`; uma chamada explícita anterior de `typecheck`, comum em prompts de etapa, repete esse trabalho se nenhum arquivo mudou;
- a suíte Jest inclui `architectureGates.test.ts` e `traceabilityGates.test.ts`, enquanto o workflow chama os gates separadamente.

Os testes de gate não são duplicação pura: fixtures inválidas exercitam o comportamento dos scripts e devem permanecer. A repetição evitável é a validação positiva do repositório e o custo de iniciar os mesmos processos por orquestrações independentes. A solução deve separar claramente:

- testes de regressão do próprio gate com fixtures;
- execução do gate sobre o repositório real;
- validação final orquestrada uma única vez.

### 4.2 Suíte completa usada como ciclo de edição

`AGENTS.md` já orienta usar a menor suíte relevante durante o trabalho e a suíte completa antes da entrega. Na prática, prompts extensos repetem listas de typecheck, build, gates e suíte completa, e agentes tendem a executar comandos completos após correções intermediárias.

O custo observado da suíte completa foi 116,353 s. A evidência dirigida de 15 suítes levou 49,173 s. O problema não é a validação final, que é essencial, mas sua repetição em cada iteração.

A matriz de simulação também explica parte do custo: um arquivo de apenas 41 linhas materializa 301 testes e executa cada cenário mais uma vez para replay. Essa cobertura deve continuar na validação completa; durante alterações sem impacto em simulação, pode ficar fora do perfil rápido.

### 4.3 Setup de testes repetido

Foi encontrada a seguinte repetição por arquivo:

| Padrão de setup | Arquivos que o repetem |
|---|---:|
| `new StageRegistry(...)` | 17 |
| `registerLegacyStages(...)` | 13 |
| `registerCampaignChapters(...)` | 9 |
| `new StageLoader(...)` | 12 |
| `new GameStageCompositionRoot(...)` | 10 |
| `new WorldLabMacroDataService(...)` | 4 |

Três arquivos de apresentação — visual, entidades e ambiente — somam 807 linhas e possuem versões próprias de `loadIgapo()`, registrando fases legadas e capítulos antes de carregar o mesmo stage. As responsabilidades testadas são distintas e não devem ser fundidas semanticamente, mas uma factory compartilhada pode reduzir leitura, manutenção e divergência de setup.

O mesmo vale para o World Lab: projeções reais são valiosas, porém a construção do catálogo, grafo e mapa de produção aparece em suítes separadas. Uma fixture imutável construída uma vez por arquivo, ou uma factory compartilhada que gere estado novo quando houver mutação, deve ser benchmarkada.

Risco principal: compartilhar instâncias mutáveis pode introduzir dependência de ordem. A otimização correta compartilha construção declarativa ou factories, não estado mutável entre testes.

### 4.4 Custo de transformação e execução serial

O Jest usa `ts-jest`, ambiente Node e execução serial explícita no workflow. Não há projetos Jest separados, perfil rápido, cache persistido de transformação ou benchmark documentado de `maxWorkers`.

O arquivo `worldLabPoi.test.ts` contém um único teste, mas recebeu 12,165 s na execução medida. Como apareceu no cold start, isso evidencia principalmente que o tempo por arquivo não separa transformação de execução. Antes de alterar testes, é necessário medir pelo menos:

- duas execuções controladas, fria e aquecida;
- `--runInBand` versus `--maxWorkers=50%` no runner de CI;
- `ts-jest` atual versus modo de transformação isolada, mantendo `tsc --noEmit` como verificação semântica;
- consumo máximo de memória, não apenas duração.

Trocar transformador ou paralelismo sem esse benchmark tem risco de regressão, flakiness ou estouro de memória.

### 4.5 Contexto documental excessivo

As instruções globais possuem uma regra eficiente para capítulos: ler apenas `AGENTS.md`, a SPEC modular, contratos do stage, manifesto e módulo editado. Entretanto, prompts de etapas recentes frequentemente ordenam a leitura de várias etapas anteriores, estruturas completas e implementações internas.

O índice de SPECs não funciona ainda como um manifesto de leitura por tipo de tarefa com estados inequívocos como “vigente”, “substituída” e “referência histórica”. Isso faz o agente reler documentos cronológicos para descobrir qual é a fonte vigente.

O processo de prompts também cria muito conteúdo obrigatório — 6.769 linhas nos Markdown inventariados —, mas o gate só precisa lê-lo como dado de validação. Agentes de implementação não precisam absorver o histórico de prompts.

Uma futura melhoria documental deve ser pequena e operacional: um mapa de leitura por subsistema e metadados de vigência. Não é necessário resumir nem reescrever todas as SPECs.

### 4.6 Dependências que ampliam o contexto

O gate de arquitetura encontrou 827 arquivos e 2.971 dependências. Alguns pontos aumentam o raio de leitura:

- `src/stages/index.ts`, com 192 linhas, expõe muitos contratos e implementações por um único barrel;
- `GameScene.ts`, adaptador legado, possui atualmente 1.899 linhas e concentra integrações de campanha, apresentação, narrativa e Phaser;
- testes de campanha atravessam registro, loader, composition root, adaptadores Phaser, progressão e navegação física para validar um único fluxo;
- o World Lab projeta catálogo, campanha e stage real, aumentando o setup de testes aparentemente pequenos.

O barrel público é útil para compatibilidade, mas uma tarefa local poderia consultar índices públicos menores por domínio sem remover o export raiz. Já a redução de `GameScene.ts` é uma mudança arquitetural de alto risco e só deve ocorrer em SPEC própria, com regressão visual e E2E.

### 4.7 Logs e relatórios

Mesmo com `--silent`, o Jest imprime uma linha por suíte. Builds listam muitos assets, e relatórios finais frequentemente repetem arquivos e comandos que já estão no registro de prompt. Isso aumenta saída no contexto sem acrescentar sinal.

O JSON temporário desta auditoria teve 377.944 bytes, mas apenas totais, falhas e os arquivos mais lentos precisaram entrar no diagnóstico. O padrão recomendado é armazenar o detalhe fora do contexto e produzir um resumo determinístico.

Não há medição disponível para converter essa redução de texto em tokens. Qualquer percentual seria especulativo.

### 4.8 Feedback tardio no CI

Foi encontrado apenas o workflow de publicação em Pages, acionado em push para `main`. Assim, a mesma rotina mistura validação e deploy, e não há neste workflow uma verificação equivalente antecipada para pull requests.

Separar validação reutilizável de publicação melhora o tempo de descoberta de falhas e evita acoplar toda alteração à etapa de deploy. Isso exige teste do workflow e revisão de permissões/cache antes de adoção.

## 5. Oportunidades priorizadas

“Economia esperada” usa categorias e evidências medidas; não representa percentual de tokens.

| Prioridade | Oportunidade | Economia esperada e evidência | Risco | Esforço |
|---|---|---|---|---|
| P0 | Usar perfis dirigidos durante a iteração e suíte completa uma vez no fechamento | Alta em execução; observados 49,173 s para 15 suítes contra 116,353 s para a suíte completa, diferença bruta de 67,180 s | Baixo, se a suíte completa continuar obrigatória no final | Baixo |
| P0 | Não executar `typecheck` isolado antes/depois de `build` sem mudanças intermediárias | Alta por repetição; `typecheck` medido em 30,010 s e já faz parte de `build` | Baixo | Baixo |
| P0 | Capturar logs em `.tmp` e mostrar somente falhas, totais e top N lentos | Alta em contexto de saída, mas sem telemetria de tokens; relatório bruto Jest teve 377.944 bytes | Baixo | Baixo |
| P0 | Restringir leitura a SPEC vigente, contratos públicos e dependências diretas | Alta em contexto; 38 SPECs/5.484 linhas, com 2.461 linhas apenas nas duas maiores | Baixo quando o índice de vigência é confiável | Baixo operacional; médio para formalizar |
| P1 | Criar um orquestrador `validate:full` sem repetir typecheck e gate positivo | Alta em execução; componentes medidos: 30,010 s de typecheck e 16,497 s somados dos dois gates isolados. Valores não são aditivos automaticamente | Médio, por alterar scripts e CI | Médio |
| P1 | Separar regressão dos scripts de gate da aplicação dos gates ao repositório | Média/alta; suítes de gate somaram 18,282 s e os gates isolados 16,497 s | Médio; fixtures negativas devem permanecer | Médio |
| P1 | Criar factories de teste para registry/loader/composition root | Média em leitura e manutenção; setup aparece em 17/13/12/10 arquivos conforme o componente | Médio; preservar isolamento e diagnósticos | Baixo/médio |
| P1 | Reutilizar construção imutável ou factory do World Lab e benchmarkar | Potencialmente alta; quatro suítes somaram 27,955 s, mas há cold start no agregado | Médio; risco de estado compartilhado e ordem | Médio |
| P1 | Criar perfis `test:stage`, `test:campaign`, `test:narrative`, `test:world-lab` | Alta para agentes; evita descoberta manual e mantém escopo explícito | Baixo | Médio |
| P1 | Separar workflow reutilizável de validação do deploy Pages e executá-lo em PR | Alta em antecedência do feedback; economia de tempo não medida | Baixo/médio | Médio |
| P1 | Benchmarkar paralelismo, cache e transformação isolada | Potencialmente alta, ainda não medida | Médio/alto | Médio |
| P2 | Adicionar mapa de leitura por tarefa e status de vigência às SPECs | Média/alta em contexto; reduz a necessidade de percorrer 5.484 linhas | Baixo, se apenas indexação; médio se mudar política | Médio |
| P2 | Manter barrel raiz e oferecer índices públicos menores por domínio | Média em contexto; `src/stages/index.ts` tem 192 linhas e mistura várias áreas | Médio; compatibilidade de exports | Médio |
| P2 | Gerar relatório conciso único de validação para o prompt record e entrega | Média em contexto e trabalho manual; ganho não medido | Baixo | Médio |
| P3 | Continuar decomposição do `GameScene` por adapters existentes | Alta em contexto no longo prazo; arquivo atual tem 1.899 linhas | Alto | Alto |

## 6. Plano de otimização

### 6.1 Melhorias imediatas, sem mudança de código

1. Durante desenvolvimento, executar apenas os testes diretamente ligados aos arquivos alterados e seus contratos públicos.
2. Executar a suíte completa uma única vez após a última alteração de implementação.
3. Considerar `npm run build` como a execução de typecheck final; repetir `npm run typecheck` apenas se arquivos TypeScript mudarem depois do build ou se o diagnóstico isolado for necessário.
4. Não ler `prompts/`, sessões históricas ou todas as SPECs por padrão. Consultá-los somente quando a tarefa for de rastreabilidade ou quando houver referência direta.
5. Redirecionar saídas detalhadas para `.tmp/<tarefa>/` e trazer ao contexto somente status, duração, totais, falhas e top arquivos lentos.
6. Em relatórios finais, registrar resultados e limitações sem copiar novamente logs ou o prompt integral.

Essas práticas preservam todas as validações finais exigidas por `AGENTS.md`.

### 6.2 Mudanças que exigem implementação e regressão

1. Adicionar perfis de teste por subsistema e um script de seleção documentado.
2. Criar `validate:full` e uma variante de bundle que não invoque typecheck pela segunda vez.
3. Refatorar testes dos gates para distinguir fixtures de regressão da verificação positiva do repositório.
4. Extrair factories de registry, loader, composition root e projeção do World Lab.
5. Medir Jest com matriz controlada de cold/warm, serial/paralelo e transformação atual/isolada.
6. Extrair workflow reutilizável de validação para PR e push; deixar Pages responsável pelo deploy após sucesso.
7. Adicionar ao índice de SPECs metadados de vigência e uma tabela curta de leitura por subsistema.
8. Criar índices públicos menores em `src/stages/`, preservando o barrel raiz.

Cada item deve ter SPEC própria quando alterar comportamento do processo, configuração ou arquitetura, além de regressão da suíte completa e gates.

## 7. Critérios de sucesso para uma etapa posterior

Uma otimização poderá ser considerada aprovada quando:

- a suíte final continuar com os mesmos testes e resultados;
- gates inválidos continuarem falhando nas fixtures existentes;
- não houver nova dependência de ordem ou estado compartilhado entre testes;
- o tempo for comparado em ao menos duas execuções frias e duas aquecidas no mesmo runner;
- duração e pico de memória forem registrados para execução serial e paralela;
- o workflow não repetir typecheck nem a validação positiva do mesmo gate;
- perfis dirigidos nunca substituírem a validação completa de entrega;
- qualquer alegação sobre tokens usar telemetria real, e não conversão estimada de linhas.

## 8. Conclusão

O maior ganho imediato não depende de reduzir cobertura: depende de executar a cobertura certa na hora certa. A suíte completa permanece necessária no fechamento, mas não deve ser o loop de edição. O segundo ganho vem de orquestrar uma única vez typecheck, gates e build. O terceiro vem de diminuir contexto: leitura por contrato e SPEC vigente, sem carregar histórico de prompts e documentação cronológica sem necessidade.

As consolidações propostas são de setup e orquestração, não de asserções. Alterações em Jest, CI, gates, barrels ou `GameScene` devem ocorrer apenas com benchmark e testes de regressão.
