# Registro de prompt: Etapa 9.14 — homologação integrada de campanhas e automação do World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-14-homologacao-campanhas-world-lab`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-14-homologacao-campanhas-world-lab.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (92 suítes, 1166 testes); git diff --check OK; homologação real Edge headless: hub verse_01_atrium → Igapó → Coração Corrompido PASS, com destino carregado, spawn, movimento, câmera, persistência, isolamento, recursos e transição única; retorno Coração → Igapó UNKNOWN (sem saída disponível no contexto); World Lab auto-load PASS (47 checks, 13 de campanha, revisão e recursos); Corrompida homologada individualmente na 9.13; campanha composta de 9 fases coberta pelo teste de integração; evidências em .tmp/evidence-914/`

## Arquivos modificados

- `.gitignore`
- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-14-homologacao-campanhas-world-lab.md`
- `docs/stage-authoring.md`
- `scripts/homologate-chapter.mjs`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/devtools/world-lab/WorldLabSession.ts`
- `src/devtools/world-lab/WorldLabValidation.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/index.ts`
- `src/devtools/world-lab/localReports.ts`
- `src/devtools/world-lab/main.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/tests/stagePlaytest.test.ts`
- `src/tests/worldLabValidation.test.ts`
- `prompts/61-etapa-9-14-homologacao-campanhas-world-lab.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.14: Homologação Integrada de Campanhas e Automação do World Lab

Implemente a Etapa 9.14 no repositório atual do Umbra Trail.

## Objetivo

Concluir a infraestrutura de criação e validação de capítulos por agentes externos, comprovando que fases individualmente jogáveis também funcionam quando conectadas em campanhas.

A Etapa 9.13 comprovou carregamento, movimentação, diálogo, missões, combate, desbloqueio e acionamento de saídas. Entretanto, a transição real entre fases permanece UNKNOWN porque os testes foram realizados no preview individual.

A Etapa 9.14 deverá resolver essa limitação e automatizar a integração dos resultados de homologação ao World Lab.

**Prioridades, nesta ordem:**

1. Homologar transições reais entre fases no fluxo de campanha.
2. Verificar persistência e isolamento de estados entre capítulos.
3. Automatizar a disponibilização de relatórios no World Lab.
4. Ampliar a cobertura de variantes, rotas e seeds.
5. Preservar a arquitetura, o desempenho e a experiência panorâmica existentes.

Não implementar agentes de IA internos, novos motores ou serviços externos.

## 1. Inspeção obrigatória

Antes de qualquer alteração:

- Leia `AGENTS.md` e as SPECs das Etapas 9.8.1, 9.9, 9.10, 9.11, 9.12 e 9.13.
- Analise `CampaignRouter`, `ExitBinder`, `PhysicalExitResolver`, `StageDirector`, `StageLoader` e os mecanismos de persistência existentes.
- Inspecione `scripts/homologate-chapter.mjs` e o relatório `umbra.stage-homologation.report` v1.
- Verifique os fluxos de campanha disponíveis no menu e a seleção dinâmica de capítulos.
- Examine as variantes Natural e Corrompida do Igapó.
- Inspecione o World Lab e os mecanismos atuais de importação dos relatórios.
- Verifique o estado do Git e preserve quaisquer alterações preexistentes.

Identifique o caminho real de execução da campanha antes de implementar o teste.

Não crie um fluxo de campanha artificial apenas para satisfazer a homologação.

## 2. Homologação real entre fases

Amplie o executor de homologação existente para oferecer um modo de campanha.

O teste principal deverá executar:

**Igapó das Memórias → conclusão → saída física → CampaignRouter → Coração Corrompido.**

A transição deverá ocorrer pelos mesmos sistemas utilizados pelo jogador.

### Requisitos obrigatórios

1. Iniciar a campanha pelo fluxo existente.
2. Carregar o Igapó na variante definida pelo roteamento.
3. Percorrer a exploração e concluir os objetivos obrigatórios.
4. Acionar a saída física após satisfazer suas condições.
5. Confirmar que `ExitBinder` e `PhysicalExitResolver` identificam a saída correta.
6. Confirmar que o `CampaignRouter` recebe a conclusão e seleciona o destino correto.
7. Carregar efetivamente `stage.aguas.coracao-corrompido`.
8. Verificar o estágio ativo após a transição.
9. Confirmar o spawn no estágio de destino.
10. Verificar que o jogador recupera o controle e consegue se movimentar no novo cenário.

**Não basta verificar uma flag, chamar um callback manualmente ou encontrar o identificador do destino em memória. O segundo estágio deve realmente carregar no Phaser.**

Não chamar diretamente o carregador do Coração Corrompido para simular a transição.

Não utilizar teletransporte, conclusão forçada, alteração de HP ou modificação de regras do jogo para produzir um resultado PASS.

Instrumentação de teste pode observar eventos, estados, rotas e objetos, mas não pode substituir os mecanismos reais de progressão.

## 3. Persistência e isolamento de estados

Verifique que os mecanismos existentes preservam os dados apropriados entre transições.

Inspecione os contratos reais antes de definir quais estados devem persistir.

Valide, quando aplicável:

- Flags narrativas.
- Conclusão de missões.
- Recompensas.
- Identificação do capítulo concluído.
- Histórico e progresso da campanha.
- Escolhas narrativas.
- Variante de apresentação selecionada.
- Inventário ou recursos persistentes previstos nos contratos.
- Estado de desbloqueio das próximas regiões.

Também verifique que estados locais não sejam transferidos indevidamente.

Exemplos:

- Inimigos de um estágio não devem permanecer ativos no seguinte.
- NPCs do capítulo anterior não devem ser duplicados.
- Eventos temporários não devem disparar novamente sem motivo.
- O estado de colisão e a câmera devem corresponder ao novo cenário.
- Flags locais não devem contaminar capítulos independentes.

Não introduza um segundo sistema de persistência.

Se determinado dado não possuir contrato de persistência, documente essa limitação e não crie comportamento novo sem necessidade.

## 4. Rotas, variantes e ramificações

Teste os fluxos existentes sem modificar seu significado narrativo.

### A. Igapó Natural

Confirme que o início e a conclusão ocorrem pela variante Natural quando essa for a configuração prevista.

### B. Igapó Corrompido

Verifique que a variante `variant.aguas.igapo-sombrio` mantém a geometria e os contratos lógicos compatíveis com o roteamento da campanha.

Não presuma que a conclusão de uma variante seleciona automaticamente um destino diferente; consulte as regras existentes.

### C. Coração Corrompido

Confirme que o estágio é carregado com os parâmetros e o estado adequados ao percurso anterior.

### D. Campanhas procedurais

Teste ao menos um percurso de campanha gerado pelo sistema procedural existente, sem alterar a seleção dinâmica de capítulos.

Verifique:

- Seleção de destino.
- Aplicação das saídas.
- Continuidade do progresso.
- Ausência de transições duplicadas.
- Tratamento de destinos inexistentes ou incompatíveis.

Não é necessário executar uma campanha inteira com dezenas de capítulos. Utilize um percurso representativo que cubra os contratos reais.

### E. Retorno e bifurcação

Se os contratos atuais permitirem retorno entre estágios, teste pelo menos um retorno real.

Não invente rotas de retorno para capítulos que não as possuam.

## 5. Diagnósticos específicos de campanha

Amplie os relatórios existentes de forma compatível.

Mantenha o relatório `umbra.stage-homologation.report` v1 para homologação individual.

Adicione uma representação complementar ou uma evolução versionada compatível para homologação de campanha.

Os diagnósticos devem contemplar:

- Estágio de origem.
- Saída acionada.
- Rota selecionada.
- Estágio de destino.
- Variante de apresentação.
- Estado anterior e posterior à transição, somente nos campos relevantes e não sensíveis.
- Eventos observados.
- Resultado da persistência.
- Resultado do carregamento e movimentação após a transição.

Sugestões de códigos:

- `CAMPAIGN_EXIT_TRIGGERED`
- `CAMPAIGN_ROUTE_RESOLVED`
- `CAMPAIGN_DESTINATION_LOADED`
- `CAMPAIGN_STATE_PRESERVED`
- `CAMPAIGN_STATE_ISOLATED`
- `CAMPAIGN_TRANSITION_DUPLICATED`
- `CAMPAIGN_DESTINATION_INVALID`
- `CAMPAIGN_TRANSITION_TIMEOUT`

Reutilize códigos existentes quando disponíveis.

### Semântica dos resultados

- **PASS:** condição comprovada na execução.
- **FAIL:** falha observada.
- **UNKNOWN:** condição não verificada ou evidência insuficiente.

Uma campanha só pode receber homologação integral PASS quando todos os critérios obrigatórios do percurso forem comprovados.

Não converter UNKNOWN em PASS por ausência de erros.

Não tratar automaticamente todo UNKNOWN opcional como falha da homologação parcial: diferencie claramente aprovação do escopo executado e homologação integral.

## 6. Automação da integração com o World Lab

A Etapa 9.13 já permite importar manualmente relatórios.

Elimine essa etapa manual sempre que os relatórios estiverem disponíveis no ambiente local.

### Requisitos

1. Reutilizar o sistema atual de relatórios.
2. Permitir que o World Lab carregue automaticamente a homologação correspondente ao estágio inspecionado.
3. Associar os dados à variante e à seed corretas.
4. Exibir a última homologação compatível disponível.
5. Indicar quando o relatório estiver ausente ou desatualizado.
6. Atualizar o painel sem reiniciar o aplicativo quando houver um novo resultado, se a infraestrutura existente permitir.
7. Manter a opção de importação manual como alternativa.

Não criar backend separado, banco de dados, serviço remoto ou mecanismo complexo de sincronização.

Se for necessário um arquivo intermediário, utilize um formato JSON local e um diretório de desenvolvimento apropriado.

Não exponha diretórios temporários indiscriminadamente pelo servidor Vite.

Não permita que arquivos de relatório importados executem código ou modifiquem o estado do jogo.

### Interface

Preserve os modos Estrutural, Visual e Comparação.

No painel Validação, apresente:

- Origem do relatório.
- Data e identificação da execução.
- Estágio e variante.
- Seed, quando aplicável.
- Resultado da homologação.
- Etapas da transição.
- Destino carregado.
- Diagnósticos de persistência.
- Evidências de execução.

Mantenha a interface em português brasileiro, funcional em 1280×720, sem truncamento de informações essenciais.

## 7. Homologação de navegação, câmera e cenário após a transição

A chegada ao estágio de destino precisa ser funcional, não apenas registrada.

Verifique no Phaser:

- Renderização do novo cenário.
- Spawn dentro de uma área válida.
- Movimentação do personagem.
- Reinicialização ou manutenção correta da câmera.
- Limites do novo mapa.
- Ausência de elementos visuais remanescentes da fase anterior.
- Colisões coerentes com o destino.
- Funcionamento dos controles após a troca.

Preserve a exploração panorâmica contínua consolidada no Igapó.

Não introduza divisão artificial em salas, carregamentos desnecessários ou mudanças na apresentação visual para facilitar os testes.

Não modifique o renderer, a câmera ou a física sem comprovar um defeito real.

## 8. Testes de regressão

Implemente testes para:

1. Transição válida.
2. Destino inexistente.
3. Saída acionada antes de cumprir requisitos.
4. Conclusão duplicada.
5. Persistência de flags e recompensas.
6. Isolamento de estado local.
7. Variante Natural.
8. Variante Corrompida.
9. Retorno, quando suportado.
10. Compatibilidade com campanhas procedurais.
11. Compatibilidade com relatórios da 9.12 e 9.13.
12. Carregamento automático no World Lab.
13. Relatório ausente ou incompatível.
14. Rejeição de conteúdo de relatório inválido.

### Execução real

Homologue pelo menos uma transição completa em navegador usando o fluxo de campanha.

Não substitua esse requisito por mocks ou testes unitários.

Registre:

- Eventos de saída.
- Resolução de rota.
- Carregamento do destino.
- Spawn.
- Movimento após transição.
- Estado narrativo preservado.

Quando aplicável, repita o teste em variantes diferentes.

## 9. Cobertura de seeds

Amplie de forma controlada os testes de campanhas procedurais.

Requisitos:

- Conjunto pequeno e reproduzível de seeds.
- Identificação da seed que falhou.
- Diagnósticos associados ao percurso.
- Ausência de alteração dos capítulos originais.
- Relatórios legíveis por agentes externos.

Não é necessário implementar execução paralela massiva.

Prefira testes determinísticos e rápidos, com uma homologação real de navegador para os casos essenciais.

## 10. Segurança e compatibilidade

- Não implementar agentes internos.
- Não integrar APIs de LLM.
- Não criar outro `CampaignRouter`.
- Não substituir `ExitBinder` ou `PhysicalExitResolver`.
- Não criar outro mecanismo de persistência.
- Não duplicar o World Lab.
- Não reestruturar o renderer ou a câmera.
- Não modificar a arte do Igapó ou do Coração Corrompido.
- Não alterar a seleção dinâmica de campanhas sem necessidade comprovada.
- Não adicionar dependências sem justificativa.
- Não versionar perfis de navegador, cookies, relatórios temporários ou evidências experimentais.
- Não alterar branches de backup, stashes ou histórico Git.

Quaisquer alterações funcionais devem corrigir problemas observados, e não adaptar artificialmente o comportamento do jogo ao teste.

## 11. Critérios de aceitação

A Etapa 9.14 somente estará concluída quando:

1. Uma transição real Igapó → Coração Corrompido for comprovada em execução Phaser.
2. O destino for carregado e o jogador puder se movimentar nele.
3. O roteamento utilizar os componentes reais da campanha.
4. A persistência de estado for verificada segundo os contratos existentes.
5. Estados locais não contaminarem o destino.
6. Variantes e pelo menos um percurso procedural forem verificados.
7. O relatório diferenciar PASS, FAIL e UNKNOWN.
8. O World Lab conseguir obter automaticamente relatórios locais compatíveis.
9. Os modos existentes do World Lab permanecerem funcionais.
10. A exploração panorâmica e a apresentação visual forem preservadas.
11. Nenhuma regressão for introduzida.
12. Build, gates e testes forem aprovados.

Se algum critério obrigatório não puder ser comprovado, documente-o como pendente. Não declare homologação integral PASS quando houver UNKNOWN obrigatório.

## 12. Documentação e entrega

Crie a SPEC da Etapa 9.14 seguindo as convenções do projeto.

Registre este prompt na sequência de `prompts/`, verificando o próximo identificador disponível.

Atualize `docs/stage-authoring.md`, `README.md` e os índices necessários.

Execute:

- Testes dirigidos.
- `npm run check:gates`.
- `npm run build`.
- `npm test -- --runInBand`.
- `git diff --check`.

Armazene evidências em `.tmp/evidence-914/`, sem adicioná-las ao Git.

Ao finalizar, apresente:

1. Resumo da implementação.
2. Arquivos criados e modificados.
3. Comandos reais da CLI.
4. Transição Igapó → Coração Corrompido comprovada ou impedimento identificado.
5. Evidências de carregamento, spawn e movimento no destino.
6. Resultados de persistência e isolamento de estados.
7. Resultados das variantes e campanhas procedurais.
8. Funcionamento da integração automática com o World Lab.
9. Resultados de testes, gates e build.
10. Limitações e pendências remanescentes.

**NÃO EXECUTE COMMIT NEM PUSH.**

Não execute `git commit`, `git push`, `git reset --hard`, `git clean` ou operações destrutivas.

Im
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
