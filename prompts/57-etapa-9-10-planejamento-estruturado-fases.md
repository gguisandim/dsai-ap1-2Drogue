# Registro de prompt: Etapa 9.10 — planejamento estruturado de fases

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-10-planejamento-estruturado-fases`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-10-planejamento-estruturado-fases.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (89 suítes, 1127 testes); git diff --check OK`

## Arquivos modificados

- `AGENTS.md`
- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-10-planejamento-estruturado-fases.md`
- `docs/stage-authoring.md`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/index.ts`
- `src/cli/chapter/plan.ts`
- `src/cli/chapter/render.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/cli/chapter/validation.ts`
- `src/examples/chapters/igapo-das-memorias/stage-plan.json`
- `src/stages/index.ts`
- `src/stages/runtime/StageCapabilityRequirements.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/tests/stagePlan.test.ts`
- `prompts/57-etapa-9-10-planejamento-estruturado-fases.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.10: Planejamento Estruturado de Fases

Implemente a Etapa 9.10 no repositório atual do Umbra Trail.

## Objetivo

Criar um mecanismo simples de planejamento de fases que permita a agentes externos, como Codex e DeepSeek, definir a estrutura espacial, narrativa e funcional de um capítulo antes de implementar seu código.

A intenção é reduzir inconsistências entre geometria, missões, encontros e transições, melhorando a eficiência da criação assistida de fases.

**Fundamentação científica:** RPGAgent — *Driving Coherent Story-to-Play Generation with an LLM-Based Multi-Agent System* (CHI 2026).

Aplicaremos a ideia de planejamento estruturado em três dimensões — narrativa, cenário e mecânicas — sem implementar agentes internos ou orquestração multiagente.

## 1. Análise inicial

Antes de modificar o projeto:

1. Leia `AGENTS.md`, `docs/stage-authoring.md` e as SPECs relevantes.
2. Consulte as capacidades implementadas na Etapa 9.9 por meio de `npm run --silent chapter -- capabilities --json`.
3. Inspecione os contratos `StageManifest`, `StageModule`, `ChapterManifest` e as estruturas existentes de narrativa, geometria, encontros e transições.
4. Examine a CLI `npm run chapter` e sua organização.
5. Identifique mecanismos existentes que possam ser reutilizados, sem criar estruturas paralelas.

**Importante:** a Etapa 9.9 já foi implementada. Preserve seu funcionamento e utilize o catálogo de capacidades como referência.

Verifique a numeração e o índice das SPECs antes de criar a documentação desta etapa. A identificação 9.10 é uma referência funcional; não sobrescreva SPECs existentes nem reutilize identificadores ocupados.

## 2. Implementação

### A. Plano estruturado de fase

Crie um formato de planejamento denominado `stage-plan.json`.

Ele deverá representar, de forma simples:

- Identificação e descrição da fase.
- Tema e direção visual pretendida.
- Tipo de progressão espacial: linear ou ramificada.
- Regiões principais e suas conexões.
- Ponto inicial e região de saída.
- Objetivos e suas dependências.
- Encontros e interações relevantes.
- Condições necessárias para desbloquear a saída.
- Referências a capacidades existentes no motor.

Organize o plano em três partes conceituais:

**Narrativa:** objetivos, missões, eventos e condições de progressão.

**Cenário:** regiões, conexões, direção espacial e apresentação visual.

**Mecânicas:** encontros, itens, interações e requisitos de conclusão.

Utilize um schema pequeno, versionado e tipado.

Evite campos desnecessários, hierarquias profundas ou estruturas genéricas difíceis de validar.

O plano é um artefato de autoria, não um novo formato de execução. O `StageModule` e os contratos atuais continuam sendo a fonte de verdade do runtime.

Não implemente geração automática de geometria nesta etapa.

### B. Integração com a CLI

Amplie a CLI existente para permitir validar um plano.

Interface sugerida:

`npm run chapter -- plan validate <slug>`

E sua versão JSON:

`npm run chapter -- plan validate <slug> --json`

Adapte a sintaxe às convenções reais da CLI caso necessário.

O comando deverá:

1. Localizar o plano associado ao capítulo.
2. Verificar sua estrutura.
3. Validar referências contra as capacidades da Etapa 9.9.
4. Verificar dependências e conexões.
5. Produzir diagnósticos claros e estruturados.

Se a CLI já tiver mecanismos equivalentes, reutilize-os.

Não crie uma segunda CLI.

### C. Validação do planejamento

Implemente verificações simples e determinísticas para identificar:

- Regiões inexistentes em conexões ou objetivos.
- Regiões obrigatórias desconectadas do início.
- Objetivos que dependem de outros objetivos inexistentes.
- Dependências circulares entre objetivos.
- Ausência de região inicial ou saída válida.
- Referências a capacidades não suportadas pelo motor.
- Condições de saída inconsistentes com os objetivos declarados.

Utilize algoritmos simples de grafos quando necessário, como busca em largura e detecção de ciclos.

Não implemente um simulador completo de estados narrativos.

Evite reprovar referências a recursos locais e dinâmicos que o catálogo global não consegue enumerar. Nesses casos, diferencie uma referência comprovadamente inválida de uma que ainda precisa ser verificada no capítulo.

A verificação espacial nesta etapa é lógica. Não é necessário implementar colisões físicas ou simulação Phaser, pois isso pertence à Etapa 9.12.

### D. Exemplo prático

Utilize o Igapó das Memórias como referência conceitual.

Crie um plano de exemplo que represente uma fase com:

1. Região inicial ribeirinha.
2. Travessia inundada.
3. Área de combate.
4. Objetivo envolvendo um vestígio.
5. Saída desbloqueada após a conclusão dos objetivos.

O exemplo deve demonstrar a relação entre regiões, objetivos e condições.

Utilize referências e identificadores reais do projeto quando existirem.

Não invente novos inimigos, itens ou capacidades para fazer o exemplo funcionar.

Não altere a implementação jogável do Igapó apenas para demonstrar o planejamento.

### E. Documentação

Atualize `docs/stage-authoring.md` com uma seção curta sobre planejamento estruturado.

Explique:

- Como criar um `stage-plan.json`.
- Quais informações são obrigatórias.
- Como validar o plano.
- Como um agente externo deve utilizá-lo antes de implementar a fase.
- Como o plano se relaciona com os contratos atuais.

Inclua um exemplo mínimo válido.

Não transforme essa documentação em um manual extenso.

O `AGENTS.md` deve receber apenas uma referência curta ao novo fluxo, se necessário.

### F. Testes

Implemente testes para:

- Plano válido.
- Regiões desconectadas.
- Dependências circulares.
- Objetivos inexistentes.
- Referências inválidas.
- Condições de saída inconsistentes.
- Saída JSON determinística da CLI.
- Compatibilidade com a Etapa 9.9.

Verifique se o comando `capabilities` continua funcionando corretamente.

Execute:

- Testes específicos da etapa.
- `npm run check:gates`.
- `npm run build`.
- Suíte completa de testes, conforme as convenções do projeto.
- `git diff --check`.

## 3. Restrições arquiteturais

- Não modificar desnecessariamente o motor Phaser.
- Não alterar o comportamento de capítulos existentes.
- Não substituir `StageManifest` ou `StageModule`.
- Não criar outro motor de narrativa.
- Não implementar agentes de IA internos.
- Não adicionar RAG, bancos vetoriais ou servidores MCP.
- Não modificar o World Lab nesta etapa.
- Não implementar geração procedural de geometria.
- Não adicionar bibliotecas sem necessidade.
- Não duplicar os catálogos da Etapa 9.9.
- Não construir uma arquitetura genérica para requisitos futuros ainda inexistentes.

**Priorize a menor implementação capaz de resolver o problema.**

O planejamento deve auxiliar um agente externo a criar fases, e não introduzir uma nova camada complexa de execução.

## 4. Critérios de aceitação

A etapa será considerada concluída quando:

1. Um agente externo conseguir descrever uma fase usando `stage-plan.json`.
2. O plano representar narrativa, cenário e mecânicas de forma coerente.
3. A CLI conseguir identificar erros de referências, conexões e dependências.
4. O plano não interferir na execução dos capítulos existentes.
5. A documentação permitir a utilização do recurso sem estudar todo o repositório.
6. Todos os testes e gates obrigatórios forem aprovados.

## 5. Entrega

Ao finalizar, apresente:

1. Resumo das alterações.
2. Arquivos criados e modificados.
3. Exemplo real de `stage-plan.json`.
4. Exemplos de validação pela CLI.
5. Resultados dos testes e build.
6. Limitações técnicas identificadas.
7. Recomendações objetivas para a Etapa 9.11.

Preserve as alterações existentes e respeite as convenções e regras do `AGENTS.md`.

**IMPORTANTE: NÃO EXECUTE COMMIT NEM PUSH NESTA ETAPA.**

A Etapa 9.9 deve permanecer registrada em seu próprio commit. A 9.10 deve ficar exclusivamente no diretório de trabalho local para revisão posterior.

Implemente a etapa integralmente, sem solicitar confirmações intermediárias, adotando soluções simples e reaproveitando a arquitetura atual.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
