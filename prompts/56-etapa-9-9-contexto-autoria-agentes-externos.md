# Registro de prompt: Etapa 9.9 — contexto de autoria para agentes externos

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-9-contexto-autoria-agentes-externos`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-9-contexto-autoria-agentes-externos.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (88 suítes, 1113 testes); git diff --check OK`

## Arquivos modificados

- `AGENTS.md`
- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-9-contexto-autoria-agentes-externos.md`
- `docs/stage-authoring.md`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/capabilities.ts`
- `src/cli/chapter/index.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/stages/contracts/StageAuthoringCapabilities.ts`
- `src/stages/contracts/StageModule.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageAuthoringCapabilities.ts`
- `src/stages/runtime/StageAuthoringVocabulary.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/chapterCapabilities.test.ts`
- `prompts/56-etapa-9-9-contexto-autoria-agentes-externos.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.9: Contexto de Autoria para Agentes Externos

Implemente a Etapa 9.9 no repositório atual do Umbra Trail.

**Objetivo:** facilitar a criação de fases por agentes externos, como Codex e DeepSeek, disponibilizando informações confiáveis sobre os recursos, contratos e limitações do motor, sem exigir a leitura de todo o repositório.

**Fundamentação científica:** *Game Knowledge Management System (G-KMS, 2026)* — aplicação de conhecimento estruturado, catálogos de recursos, schemas e validação de referências para geração de conteúdo executável.

## 1. Análise inicial

Antes de implementar:

- Leia `AGENTS.md`, as SPECs relevantes e a arquitetura atual de capítulos.
- Inspecione `StageManifest`, `StageModule`, `StageRegistry`, `StageValidator` e a CLI `npm run chapter`.
- Identifique os catálogos, registries e contratos já existentes.
- Preserve a compatibilidade com os capítulos atuais, o World Lab e as campanhas.

**Não recrie funcionalidades que já existem.** Prefira estender os componentes atuais.

## 2. Implementação

### A. Catálogo de capacidades

Amplie a CLI existente com:

```bash
npm run chapter -- capabilities
npm run chapter -- capabilities --json
```

O comando deverá apresentar os recursos efetivamente suportados pelo motor, incluindo, quando disponíveis:

- Inimigos e suas capacidades.
- NPCs e interações.
- Itens e recompensas.
- Temas, tilesets e recursos visuais.
- Eventos, missões, condições e flags narrativas.
- Encontros e mecânicas de gameplay.
- Tipos de saída e transições.
- Variantes de apresentação.
- Limitações e requisitos dos contratos de autoria.

Extraia essas informações dos contratos e registries existentes, evitando listas duplicadas e valores inventados.

O JSON deve possuir estrutura estável, identificadores válidos e campos documentados.

Quando algum recurso não puder ser descoberto automaticamente, indique a limitação em vez de presumir que ele existe.

### B. Documentação de autoria

Crie ou atualize:

`docs/stage-authoring.md`

Documente objetivamente:

1. Como criar um capítulo usando a CLI.
2. Como consultar as capacidades disponíveis.
3. Como configurar geometria, narrativa, gameplay e apresentação.
4. Como validar e executar o preview.
5. Quais arquivos podem ser modificados durante a criação de uma fase.
6. Quais contratos devem ser preservados.
7. Erros comuns e como evitá-los.

Utilize exemplos reais do projeto. Evite documentação extensa ou redundante.

### C. Integração com agentes externos

Atualize minimamente o `AGENTS.md` para orientar agentes como Codex e DeepSeek a:

1. Consultar o catálogo de capacidades antes de criar uma fase.
2. Ler a documentação de autoria.
3. Reutilizar os contratos e recursos existentes.
4. Modificar preferencialmente os arquivos do capítulo.
5. Executar validações antes de considerar a fase concluída.

Não implemente agentes internos, chamadas a APIs de LLM, RAG, bancos vetoriais ou servidores MCP.

### D. Testes

Implemente testes automatizados para verificar:

- Execução dos comandos da CLI.
- Validade e estabilidade estrutural do JSON.
- Correspondência entre capacidades publicadas e recursos reais.
- Ausência de referências inexistentes.
- Compatibilidade com os capítulos atuais.
- Tratamento apropriado de recursos não disponíveis.

Execute os testes relevantes e o build, seguindo as regras do repositório.

## 3. Restrições

- Não alterar desnecessariamente o motor Phaser.
- Não modificar o comportamento das campanhas existentes.
- Não reconstruir a CLI ou o World Lab.
- Não adicionar dependências sem necessidade.
- Não criar uma segunda fonte de verdade para os catálogos.
- Priorizar soluções simples, tipadas e reutilizáveis.
- Seguir o processo de SPEC definido no `AGENTS.md`.

## 4. Critérios de aceitação

A etapa estará concluída quando:

- `npm run chapter -- capabilities` apresentar informações úteis e verificáveis.
- `npm run chapter -- capabilities --json` produzir JSON válido e estruturado.
- A documentação permitir que um agente externo compreenda como criar uma fase sem explorar todo o repositório.
- Os testes e o build forem aprovados.
- O funcionamento atual do Umbra Trail permanecer preservado.

## 5. Entrega

Ao finalizar, apresente:

1. Resumo das mudanças.
2. Arquivos criados ou modificados.
3. Exemplos reais da saída da CLI.
4. Testes executados e resultados.
5. Limitações identificadas.
6. Pendências relevantes para a Etapa 9.10.

**IMPORTANTE: NÃO REALIZE COMMIT NEM PUSH.**

Deixe todas as alterações apenas no diretório de trabalho local. Não execute `git commit`, `git push` ou qualquer operação equivalente. Não reverta alterações preexistentes do usuário.

Implemente a etapa completamente, sem solicitar confirmação intermediária, respeitando a arquitetura e as convenções encontradas no repositório.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
