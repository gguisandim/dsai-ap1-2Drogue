# Registro de prompt: Etapa 9.12 — validação automatizada de jogabilidade

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-12-validacao-automatizada-jogabilidade`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-12-validacao-automatizada-jogabilidade.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (91 suítes, 1153 testes); git diff --check OK; playtest --seeds 25 OK para horizontal e branched; homologação Phaser Edge headless via CDP OK para carregamento, movimento real, câmera e alcance da saída; acionamento da saída UNKNOWN; evidências em .tmp/evidence-912/`

## Arquivos modificados

- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-12-validacao-automatizada-jogabilidade.md`
- `docs/stage-authoring.md`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/index.ts`
- `src/cli/chapter/playtest.ts`
- `src/cli/chapter/render.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StagePlaytestValidator.ts`
- `src/tests/stagePlaytest.test.ts`
- `prompts/59-etapa-9-12-validacao-automatizada-jogabilidade.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.12: Validação Automatizada de Jogabilidade

Implemente a Etapa 9.12 no repositório atual do Umbra Trail.

## Objetivo

Ampliar os mecanismos existentes de validação para verificar se fases criadas por agentes externos são fisicamente percorríveis, apresentam progressão coerente e podem ser concluídas.

**Fundamentação científica:** Agentic PCG: Procedural Content Generation via Tool-using LLMs (2026).

**Abordagem aplicada:** avaliação iterativa de níveis por ferramentas determinísticas, verificações de conectividade e feedback estruturado, permitindo que agentes externos identifiquem e corrijam problemas sem reconstruir a fase inteira.

Não implementar agentes de IA internos.

## 1. Análise inicial

Antes de modificar arquivos:

1. Leia `AGENTS.md`, `docs/stage-authoring.md` e as SPECs relevantes.
2. Inspecione as implementações das Etapas 9.9, 9.10 e 9.11.
3. Analise `StageValidator`, `StageLoader`, `StageModule`, `LevelDefinition` e a CLI existente.
4. Identifique os sistemas atuais de colisão, movimentação, câmera, missões, encontros e transições.
5. Inspecione os testes de integração Phaser e os mecanismos já utilizados na homologação da 9.11.
6. Utilize o Igapó das Memórias como referência de exploração panorâmica contínua.

Antes de iniciar, verifique o estado do Git. Preserve alterações preexistentes, arquivos não rastreados e commits anteriores.

**Não recrie validadores ou simuladores que já existam.**

## 2. Validação física da navegação

Amplie os validadores atuais para identificar obstáculos que impeçam o jogador de atravessar a fase.

Verifique:

- Caminho entre spawn e regiões obrigatórias.
- Acesso às saídas.
- Conectividade física de caminhos alternativos.
- Obstáculos e colisões.
- Passagens estreitas demais para o personagem.
- Regiões aparentemente conectadas, mas fisicamente inacessíveis.
- Possibilidade de retorno nas bifurcações que exigem revisita.

Utilize as dimensões reais do personagem e as regras existentes de movimentação e colisão.

Reaproveite algoritmos simples, como BFS ou A*, quando adequados.

**Importante:** a existência de um caminho no grid não garante que o personagem consiga atravessá-lo. Diferencie alcançabilidade geométrica, viabilidade de movimento e execução efetivamente comprovada no Phaser.

Não declare uma fase fisicamente válida apenas porque seus tiles estão conectados.

Não implemente um novo motor de física ou navegação.

## 3. Validação da progressão narrativa

Reutilize os contratos narrativos existentes e o `stage-plan.json` da 9.10.

Verifique, quando possível:

1. Se os objetivos obrigatórios podem ser alcançados na ordem prevista.
2. Se missões dependem de eventos e flags existentes.
3. Se encontros obrigatórios podem ser iniciados.
4. Se as condições para desbloquear saídas são coerentes.
5. Se a conclusão de uma fase permite executar a transição esperada.
6. Se a progressão não depende de estados impossíveis.

Não implemente uma nova máquina de estados narrativos.

Aproveite `StageDirector`, os contratos existentes e os testes de integração.

Se alguma condição depender de execução real ou intervenção do jogador e não puder ser comprovada automaticamente, apresente o resultado como **não verificado**, não como aprovado.

## 4. Validação dos templates panorâmicos

Os templates `horizontal` e `branched` da 9.11 devem ser os principais casos de teste.

### Horizontal

Verifique se:

- O jogador consegue percorrer a rota principal.
- As regiões obrigatórias são alcançáveis.
- O cenário permanece contínuo.
- A saída pode ser alcançada.
- A câmera acompanha o deslocamento sem ultrapassar os limites esperados.

### Ramificado

Verifique adicionalmente se:

- A bifurcação possui caminhos físicos reais.
- O caminho secundário é percorrível.
- O jogador consegue retornar ou reencontrar o caminho principal.
- Não existem becos sem saída que impeçam a conclusão obrigatória.
- As conexões do `stage-plan.json` correspondem às possibilidades reais de navegação.

**Preserve a experiência panorâmica do Igapó.** Não transforme as fases em salas, arenas isoladas ou corredores artificiais para facilitar os testes.

Não altere a geometria dos templates apenas para fazer o validador aprovar.

## 5. Testes com múltiplas sementes

Adicione suporte à validação de diferentes seeds dos templates procedurais.

Exemplo conceitual:

`npm run chapter -- playtest travessia --seeds 10 --json`

Adapte a interface às convenções reais da CLI.

Requisitos:

- Testar um conjunto reproduzível de seeds.
- Identificar quais configurações falharam.
- Informar a razão da falha.
- Não modificar os capítulos originais.
- Permitir reproduzir individualmente uma seed problemática.

Comece com uma quantidade pequena de seeds, suficiente para detectar regressões.

Não implemente geração massiva de mapas nem benchmarks extensos nesta etapa.

## 6. Relatórios de diagnóstico

Integre os resultados à CLI existente.

Interface sugerida:

`npm run chapter -- playtest <slug>`

`npm run chapter -- playtest <slug> --json`

O relatório deverá incluir:

- Identificação da fase e seed.
- Resultado geral.
- Regiões verificadas.
- Problemas de navegação encontrados.
- Problemas de progressão encontrados.
- Localização ou identificação do elemento responsável.
- Sugestão objetiva de correção.
- Verificações não executadas ou inconclusivas.

Utilize diagnósticos estruturados, com códigos estáveis.

Exemplos:

- `NAVIGATION_PATH_BLOCKED`
- `REGION_UNREACHABLE`
- `EXIT_UNREACHABLE`
- `OBJECTIVE_UNREACHABLE`
- `PROGRESSION_CONDITION_UNMET`
- `CAMERA_BOUNDS_INVALID`

Esses códigos são sugestões; reutilize os diagnósticos existentes quando apropriado.

Diferencie claramente:

- **PASS:** condição comprovadamente satisfeita.
- **FAIL:** problema identificado.
- **UNKNOWN:** verificação inconclusiva ou não executada.

Não apresente testes parciais como homologação completa.

## 7. Integração com Phaser e World Lab

Reaproveite os mecanismos atuais de preview Phaser, inspeção e testes em navegador.

Quando viável, execute uma homologação automatizada que demonstre:

1. Carregamento da fase.
2. Deslocamento real do personagem.
3. Acompanhamento da câmera.
4. Acesso a regiões importantes.
5. Funcionamento das saídas.

Não utilize aumento artificial de HP ou alterações permanentes das regras do jogo para declarar uma fase concluível.

Se for necessário isolar combate ou utilizar instrumentos de teste, registre claramente quais verificações foram simuladas e quais foram exercitadas de verdade.

Não implemente recursos novos no World Lab nesta etapa.

As capturas e evidências devem continuar em diretórios temporários ignorados pelo Git.

## 8. Testes automatizados

Implemente testes para:

- Fase válida e percorrível.
- Caminho bloqueado.
- Região inacessível.
- Saída inacessível.
- Bifurcação funcional.
- Dependência narrativa impossível.
- Determinismo das validações.
- Múltiplas seeds.
- Saída JSON estruturada.
- Compatibilidade com as Etapas 9.9, 9.10 e 9.11.

Inclua pelo menos um teste negativo real: introduza temporariamente uma obstrução em um cenário de teste, confirme que ela é detectada e depois restaure o cenário.

Execute os testes dirigidos, `npm run check:gates`, `npm run build`, a suíte completa de testes e `git diff --check`.

## 9. Restrições arquiteturais

- Não reconstruir o motor Phaser.
- Não implementar IA de navegação com LLM.
- Não criar agentes internos.
- Não implementar orquestração multiagente.
- Não criar outro sistema de física ou colisão.
- Não substituir o `StageValidator`.
- Não alterar desnecessariamente o World Lab.
- Não modificar a identidade visual do Igapó.
- Não adicionar dependências sem necessidade.
- Não implementar geração automática de conteúdo narrativo.
- Não criar sistemas complexos de simulação de combate.
- Não adicionar arquivos temporários ou perfis de navegador ao Git.
- Não alterar histórico, branches de backup ou stashes.

**Priorize uma implementação simples, incremental e verificável.**

O principal objetivo é oferecer diagnósticos úteis para agentes externos corrigirem fases, e não criar um sistema autônomo de gameplay.

## 10. Critérios de aceitação

A Etapa 9.12 estará concluída quando:

1. A CLI conseguir verificar a alcançabilidade física das regiões obrigatórias.
2. Caminhos bloqueados forem identificados corretamente.
3. As bifurcações dos templates forem verificadas.
4. As verificações narrativas existentes forem integradas ao relatório.
5. Múltiplas seeds puderem ser avaliadas de maneira reproduzível.
6. Os relatórios indicarem claramente os problemas e suas localizações.
7. Os estados PASS, FAIL e UNKNOWN distinguirem evidência de suposição.
8. O preview Phaser continuar funcional.
9. Os capítulos existentes não apresentarem regressões.
10. Os testes e gates obrigatórios forem aprovados.

## 11. Documentação e entrega

Crie a SPEC da Etapa 9.12 antes da implementação, seguindo as regras de `AGENTS.md`.

Registre o prompt conforme a rastreabilidade atual.

Atualize `docs/stage-authoring.md` com os comandos reais de validação e exemplos de diagnósticos.

Ao finalizar, apresente:

1. Resumo das alterações.
2. Arquivos criados e modificados.
3. Comandos disponíveis.
4. Exemplo de fase aprovada.
5. Exemplo de fase reprovada.
6. Resultado da validação com múltiplas seeds.
7. Evidências de execução Phaser.
8. Resultados de testes e build.
9. Limitações identificadas.
10. Pendências para a Etapa 9.13.

**IMPORTANTE: NÃO EXECUTE COMMIT NEM PUSH.**

Não execute `git commit`, `git push`, `git reset --hard`, `git clean` ou operações que descartem alterações.

Implemente a etapa integralmente, sem solicitar confirmações intermediárias, preservando a arquitetura atual e evitando complexidade desnecessária.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
