# Registro de prompt: Etapa 9.13 — homologação de runtime e diagnósticos no World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-13-homologacao-runtime-world-lab`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-13-homologacao-runtime-world-lab.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (92 suítes, 1163 testes); git diff --check OK; homologação real Edge headless via CDP: horizontal PASS, ramificado PASS, Igapó Natural PASS, Igapó Corrompida PASS; transição individual UNKNOWN; World Lab em Edge headless: 22 verificações estáticas, 5 regiões, seleção espacial e importação de 12 verificações de runtime; evidências em .tmp/evidence-913/ (world-lab-igapo.png, world-lab-browser.json); fixture de falha espacial validado no World Lab (9 testes)`

## Arquivos modificados

- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-13-homologacao-runtime-world-lab.md`
- `docs/stage-authoring.md`
- `package.json`
- `scripts/homologate-chapter.mjs`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSession.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/WorldLabValidation.ts`
- `src/devtools/world-lab/authoringValidation.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/index.ts`
- `src/devtools/world-lab/main.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/ui/WorldLabPtBr.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/examples/chapters/igapo-das-memorias/stage-plan.json`
- `src/tests/stagePlaytest.test.ts`
- `src/tests/worldLabValidation.test.ts`
- `prompts/60-etapa-9-13-homologacao-runtime-world-lab.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.13: Homologação Completa e Diagnósticos no World Lab

Implemente a Etapa 9.13 no repositório atual do Umbra Trail.

## Objetivo

Concluir o fluxo de criação e validação de fases por agentes externos (Codex, DeepSeek etc.), permitindo:

1. Executar testes reais de gameplay no Phaser.
2. Verificar o ciclo completo de NPC, diálogo, missão, combate e saída.
3. Visualizar os diagnósticos da Etapa 9.12 diretamente no World Lab.
4. Identificar problemas por região e posição no mapa.
5. Fornecer informações estruturadas para que agentes externos consigam corrigir fases com precisão.

**Não implementar agentes de IA dentro do jogo.**

A experiência de exploração panorâmica contínua do Igapó das Memórias deve ser preservada integralmente.

## 1. Inspeção obrigatória

Antes de implementar:

- Leia `AGENTS.md` e as SPECs das Etapas 9.9–9.12.
- Analise `StagePlaytestValidator`, `StageDirector`, `StageLoader`, `StageMapRenderer` e os contratos narrativos.
- Inspecione a implementação real do World Lab, incluindo seus modos Estrutural, Visual e Comparação.
- Investigue os mecanismos existentes de teste de navegador, instrumentação e preview Phaser.
- Verifique os capítulos panorâmicos criados na 9.11.
- Inspecione o fluxo jogável do Igapó, incluindo sua variante Corrompida.
- Verifique o estado do Git e preserve todas as alterações existentes.

Reutilize a arquitetura atual. Não crie um segundo sistema de validação, física, renderização ou navegação.

## 2. Homologação real de gameplay no Phaser

Implemente uma rotina de homologação automatizada que consiga testar, quando o capítulo oferecer os recursos necessários, o ciclo:

**Spawn → Exploração → NPC → Diálogo → Missão → Encontro → Combate → Objetivo → Desbloqueio da saída → Conclusão → Transição.**

### Requisitos

- Carregar a fase pelo preview existente.
- Controlar o personagem usando entradas reais ou mecanismos de teste já disponíveis.
- Localizar e alcançar NPCs e pontos de interesse.
- Acionar diálogos e escolhas necessárias.
- Verificar a atualização real de flags, missões e objetivos.
- Iniciar os encontros obrigatórios.
- Exercitar o combate real, incluindo dano e possibilidade de morte.
- Verificar se a conclusão dos encontros produz os sinais esperados.
- Acionar a saída quando suas condições forem satisfeitas.
- Confirmar o evento de conclusão e a transição, quando aplicável.

Não utilizar aumento artificial de HP, dano infinito, teletransporte ou alteração das regras do jogo para declarar uma fase jogável.

Instrumentação exclusivamente de teste pode observar eventos e estados internos, mas não deve falsificar a progressão.

Se uma interação não puder ser executada de forma confiável, registre **UNKNOWN**, com a razão. Não declare a homologação completa sem comprovação.

Evite criar um bot genérico capaz de jogar qualquer fase. Implemente um executor pequeno, determinístico e baseado nos mecanismos existentes.

## 3. Distinção entre validação estática e execução real

A Etapa 9.12 já realiza validação geométrica e lógica.

A 9.13 deve complementar esse sistema, não substituí-lo.

Separe claramente:

**Validação estrutural:** conectividade, colisões aproximadas, regiões, condições e dependências.

**Homologação de runtime:** eventos realmente executados no Phaser, interações, combate, conclusão e transição.

O relatório deve identificar a origem das evidências e distinguir:

- `PASS`: verificação comprovada.
- `FAIL`: falha comprovada.
- `UNKNOWN`: não verificado ou inconclusivo.

Uma fase com três verificações UNKNOWN não pode ser apresentada como integralmente homologada.

Preserve a compatibilidade com o relatório `umbra.stage-playtest.report` v1. Se necessário, adicione campos opcionais ou um relatório complementar versionado, sem quebrar consumidores existentes.

## 4. Integração dos diagnósticos ao World Lab

Amplie o World Lab existente para exibir os resultados da validação.

Não crie outro editor de fases.

### A. Visualização espacial

Permita visualizar sobre o mapa:

- Spawn e saídas.
- Regiões do `stage-plan.json`.
- Rotas principais e secundárias, quando disponíveis.
- Posições de NPCs e objetivos.
- Bloqueios e pontos inacessíveis.
- Diagnósticos associados a coordenadas.
- Trechos da bifurcação e caminhos de retorno.

Utilize overlays ou elementos de inspeção desacoplados da apresentação do jogo.

Os diagnósticos não devem alterar colisões, tiles, objetos ou estados de gameplay.

### B. Painel de diagnósticos

Adicione ao World Lab uma visualização compacta contendo:

- Resultado da validação.
- Seed utilizada.
- Código do diagnóstico.
- Severidade.
- Região afetada.
- Coordenadas, quando disponíveis.
- Descrição do problema.
- Sugestão de correção.
- Origem da evidência: análise estática ou execução Phaser.

Ao selecionar um diagnóstico espacial, destaque sua posição na visualização do mapa.

O painel deve continuar utilizável em 1280×720, em português brasileiro, sem textos truncados ou controles sobrepostos.

### C. Integração com os modos existentes

Preserve os modos Estrutural, Visual e Comparação.

Adicione os diagnósticos ao modo mais adequado ou crie uma seção interna de validação, somente se necessário.

Não reestruture toda a interface do World Lab.

## 5. Preservação da exploração panorâmica

Todas as alterações precisam respeitar o design introduzido no Igapó e consolidado na 9.11.

Garanta:

- Cenário contínuo, sem divisão artificial em salas.
- Câmera acompanhando o deslocamento.
- Descoberta progressiva de NPCs, objetivos e inimigos.
- Bifurcações físicas reais.
- Retorno por caminhos alternativos quando previsto.
- Compatibilidade com os temas e as variantes Natural/Corrompida.
- Nenhuma alteração destrutiva na identidade visual do Igapó.

O World Lab deve permitir inspecionar esses elementos sem interferir na experiência de exploração.

## 6. Testes de câmera e apresentação

Amplie a homologação para observar o comportamento real da câmera.

Verifique:

1. Acompanhamento do personagem.
2. Limites horizontais e verticais.
3. Regiões próximas às bordas do mapa.
4. Transição da câmera durante a exploração.
5. Funcionamento em fases panorâmicas horizontais e ramificadas.
6. Compatibilidade das variantes de apresentação.

A verificação de limites matemáticos não substitui a execução Phaser.

Não implemente um sistema novo de câmera.

## 7. Casos obrigatórios de homologação

Execute pelo menos os seguintes cenários:

### Caso A — Horizontal panorâmico

Utilize um capítulo de teste baseado no template horizontal.

Comprove:

- Carregamento.
- Caminhada pelo cenário.
- Acompanhamento da câmera.
- Interação com NPC e missão, se disponíveis.
- Encontro obrigatório e combate, se disponíveis.
- Saída e conclusão.

### Caso B — Panorâmico ramificado

Utilize um capítulo baseado no template branched.

Comprove:

- Deslocamento pelo percurso principal.
- Acesso à bifurcação.
- Travessia do caminho secundário.
- Retorno ou reencontro com o caminho principal.
- Acesso ao objetivo e à saída.

### Caso C — Igapó das Memórias

Homologue o fluxo de produção existente sem modificar suas regras para facilitar os testes.

Verifique:

- Exploração do Igapó.
- Interações necessárias à missão.
- Vestígio Submerso.
- Encontros obrigatórios.
- Desbloqueio da saída.
- Conclusão do estágio.
- Transição narrativa para o Coração Corrompido, quando prevista pelo fluxo selecionado.

Se faltarem âncoras físicas no `stage-plan.json`, avalie adicioná-las com base nas posições reais, preservando a semântica existente. Não invente coordenadas.

### Caso D — Falha intencional

Crie um fixture de teste com problema controlado de navegação ou progressão.

Confirme que:

- O validador identifica a falha.
- O World Lab apresenta o diagnóstico.
- O diagnóstico aponta para a região ou posição correta.
- A correção permite voltar a PASS.

Não modifique permanentemente os capítulos existentes para criar esse caso.

## 8. Fluxo de ferramentas para agentes externos

O processo esperado deve ser:

1. Agente cria capítulo pela CLI.
2. Agente gera ou ajusta `stage-plan.json`.
3. Agente executa `plan validate`.
4. Agente executa `playtest`.
5. Agente consulta diagnósticos estruturados.
6. Agente corrige a região ou condição problemática.
7. Agente repete os testes.
8. Desenvolvedor inspeciona o resultado no World Lab.
9. Homologação real confirma a conclusão jogável.

Reutilize os comandos existentes.

Caso seja necessário criar um comando para homologação em navegador, mantenha-o na CLI atual ou na infraestrutura de testes já utilizada.

Não crie serviços externos, dashboards paralelos, APIs remotas ou integração com LLM.

Os relatórios devem continuar úteis para agentes externos mesmo sem abrir o World Lab.

## 9. Testes e evidências

Implemente testes automatizados para:

- Leitura dos diagnósticos da 9.12 pelo World Lab.
- Associação de diagnósticos a coordenadas e regiões.
- Seleção e destaque de problemas no mapa.
- Compatibilidade dos relatórios JSON.
- Distinção entre PASS, FAIL e UNKNOWN.
- Execução das interações Phaser suportadas.
- Detecção de condições de conclusão.
- Compatibilidade com as variantes existentes.
- Ausência de regressões nos templates da 9.11.

Execute:

- Testes dirigidos.
- `npm run check:gates`.
- `npm run build`.
- `npm test -- --runInBand`.
- `git diff --check`.

Realize testes reais de navegador sempre que o ambiente permitir.

Armazene capturas, traces e relatórios experimentais em `.tmp/evidence-913/`, sem adicioná-los ao Git.

Não apresente testes unitários como substitutos de uma homologação visual ou funcional.

## 10. Restrições

- Não implementar agentes de IA internos.
- Não integrar APIs de modelos.
- Não criar outro editor ou motor.
- Não duplicar `StagePlaytestValidator`.
- Não reescrever o World Lab.
- Não criar uma arquitetura genérica de automação de jogos.
- Não introduzir dependências sem necessidade.
- Não modificar a identidade visual do Igapó.
- Não substituir os sistemas existentes de combate, missões ou narrativa.
- Não alterar o histórico Git, branches de backup ou stashes.
- Não incluir arquivos temporários no versionamento.

Prefira a menor implementação que complete o fluxo de autoria e homologação de forma verificável.

## 11. Critérios de aceitação

A Etapa 9.13 estará concluída quando:

1. O World Lab exibir diagnósticos reais da Etapa 9.12.
2. Problemas espaciais puderem ser localizados visualmente.
3. Os relatórios diferenciarem análise estática de execução Phaser.
4. O fluxo de homologação executar interações reais suportadas pelo jogo.
5. A conclusão e a transição de ao menos um capítulo forem comprovadas em runtime, sem manipulação artificial das regras.
6. Horizontal, ramificado e Igapó tiverem resultados de homologação documentados.
7. As verificações inconclusivas permanecerem identificadas como UNKNOWN.
8. A exploração panorâmica continuar preservada.
9. Nenhuma regressão funcional for introduzida.
10. Build, testes e gates estiverem aprovados.

Caso algum critério não seja atingido, documente a pendência explicitamente. Não apresente a etapa como completamente homologada se houver bloqueios relevantes.

## 12. Documentação e entrega

Crie a SPEC da Etapa 9.13 seguindo as convenções do repositório.

Registre este prompt na sequência existente em `prompts/`.

Atualize `docs/stage-authoring.md` e as referências necessárias no README.

Na entrega, apresente:

1. Resumo da implementação.
2. Arquivos criados e modificados.
3. Funcionalidades adicionadas ao World Lab.
4. Comandos reais de homologação.
5. Resultados do capítulo horizontal.
6. Resultados do capítulo ramificado.
7. Resultados do Igapó e da transição ao Coração Corrompido.
8. Evidências reais da execução Phaser.
9. Testes, gates e build.
10. Limitações e pendências remanescentes.

**NÃO EXECUTE COMMIT NEM PUSH.**

Não execute `git commit`, `git push`, `git reset --hard`, `git clean` ou operações que descartem alterações locais.

Implemente a etapa integralmente, seguindo as convenções do projeto, sem solicitar confirmações intermediárias.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
