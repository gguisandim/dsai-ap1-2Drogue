# Registro de prompt: Etapa 9.7B — CLI de autoria, validação e inspeção de capítulos

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-7b-cli-autoria-validacao-capitulos`
- Data: `2026-10-31`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-7b-cli-autoria-validacao-capitulos.md`
- Commit: `pendente`
- Execução: `concluída; testes dirigidos da CLI 10 testes aprovados; recorte dirigido de CLI, template, registry, loader, catálogo, narrativa e saídas 13 suítes/118 testes aprovado; suíte completa 76 suítes/1040 testes aprovada; typecheck e build aprovados; smoke real de npm run chapter com create/validate/inspect/preview aprovado; check:gates e git diff --check executados; homologação visual não executada por ausência de navegador`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-7b-cli-autoria-validacao-capitulos.md`
- `SPEC/README.md`
- `prompts/45-etapa-9-7b-cli-autoria-validacao-capitulos.md`
- `package.json`
- `tsconfig.cli.json`
- `src/cli/chapter-cli.ts`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/errors.ts`
- `src/cli/chapter/fs.ts`
- `src/cli/chapter/generator.ts`
- `src/cli/chapter/index.ts`
- `src/cli/chapter/inspect.ts`
- `src/cli/chapter/loader.ts`
- `src/cli/chapter/names.ts`
- `src/cli/chapter/preview.ts`
- `src/cli/chapter/render.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/cli/chapter/validation.ts`
- `src/examples/chapter-template/README.md`
- `src/tests/chapterCli.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.7B — CLI de Criação, Validação e Inspeção de Capítulos

Continue o desenvolvimento do **Umbra Trail** após a conclusão da Etapa 9.7A.

## Objetivo

Implementar uma CLI local para criação e validação de capítulos independentes, utilizando o template oficial e os contratos públicos já existentes.

A CLI deverá automatizar o fluxo:

`Template → Criar capítulo → Personalizar → Validar → Inspecionar → Preparar preview`

**Não criar um novo sistema de capítulos, registries, validadores ou plugins. A ferramenta deve utilizar a arquitetura implementada nas Etapas 9.5–9.7A.**

A prioridade é oferecer uma interface de autoria confiável para desenvolvedores e agentes de IA, sem exigir conhecimento dos arquivos internos do motor.

## 1. Inspeção inicial

Antes de implementar:

- Ler `AGENTS.md`.
- Ler as SPECs 9.6E.3 e 9.7A.
- Inspecionar `src/examples/chapter-template/`.
- Ler o README do template e `chapterTemplate.test.ts`.
- Inspecionar `StageRegistry`, `StageLoader`, `StageValidator` e `StageCatalogService`.
- Inspecionar `CampaignChapterCatalog` e `registerCampaignChapters`.
- Identificar a organização atual de scripts em `package.json`.
- Verificar configuração TypeScript, Jest, Vite e Node.
- Verificar o mecanismo atual de registro de capítulos e integração com World Lab.
- Executar `git status --short`.

Preservar alterações preexistentes.

Não instalar bibliotecas antes de verificar se Node e as dependências atuais são suficientes.

## 2. Arquitetura da CLI

Implementar uma ferramenta executável local, com interface simples e comandos documentados.

Interface desejada:

- `chapter create`
- `chapter validate`
- `chapter inspect`
- `chapter preview`

Os nomes e a forma de execução devem seguir as convenções reais do repositório.

Preferir um comando acessível por `npm run chapter -- ...`, caso compatível com o projeto.

Separar:

1. Parsing e apresentação dos argumentos.
2. Operações de filesystem.
3. Reutilização dos serviços de autoria e validação.
4. Formatação dos diagnósticos.

Evitar código excessivamente genérico.

Não criar um framework de CLI ou sistema de plugins.

## 3. Comando create

Implementar a geração de um capítulo a partir de `src/examples/chapter-template/`.

Exemplo conceitual:

`npm run chapter -- create exemplo-floresta --title "Floresta das Raízes"`

A ferramenta deverá:

- Validar o nome informado.
- Gerar um namespace estável.
- Gerar IDs de capítulo e fase.
- Configurar título e revisão inicial.
- Copiar ou instanciar os arquivos necessários.
- Ajustar referências internas.
- Preservar coerência entre NPCs, missões, eventos, saídas e recursos.
- Produzir um capítulo inicialmente válido.
- Informar o diretório criado.
- Indicar os próximos passos.

Reutilizar `createChapterTemplate` e as funções existentes sempre que possível.

Não fazer substituições globais de strings sem verificar referências e tipos.

O novo capítulo deve ser independente do capítulo demonstrativo original.

Não alterar arquivos do motor.

## 4. Estrutura dos capítulos gerados

Inspecionar as convenções de `src/stages/chapters/` e escolher um diretório apropriado para capítulos autorais.

O resultado deve conter, conforme necessário:

- IDs.
- Manifesto do capítulo.
- Manifesto da fase.
- Mapa.
- Encontros.
- NPCs e narrativa.
- Apresentação e referências de assets.
- Registro local.
- Documentação.

Respeitar `rootDir: "src"` e os gates de arquitetura.

Não duplicar arquivos de implementação do motor.

Não colocar capítulos novos automaticamente no catálogo de produção.

A estrutura deve permitir que outro desenvolvedor edite somente os arquivos gerados.

## 5. Segurança das operações

A CLI realizará alterações no filesystem. Implementar proteções mínimas:

- Não permitir path traversal.
- Não aceitar saída fora dos diretórios autorizados.
- Não sobrescrever arquivos existentes por padrão.
- Validar nomes e namespaces.
- Detectar colisões de IDs.
- Não apagar diretórios automaticamente.
- Não modificar capítulos existentes sem operação explícita.
- Não executar comandos arbitrários provenientes dos metadados de conteúdo.

Preferir criação atômica: validar os dados antes da publicação e evitar deixar um capítulo parcialmente gerado em caso de falha.

Apresentar mensagens claras de erro.

## 6. Comando validate

Implementar validação de um capítulo existente.

Exemplo conceitual:

`npm run chapter -- validate exemplo-floresta`

A CLI deve reutilizar:

- `StageValidator`.
- `StageRegistry`.
- `StageLoader`.
- `StageCatalogService`.
- Validação de capabilities.
- Validação narrativa.
- Validação de encontros.
- Validação de apresentação.
- Validação de entradas e saídas.

Não desenvolver um segundo validador.

A saída deve identificar:

- Arquivo ou componente relacionado.
- Código do diagnóstico.
- Severidade.
- Identificador do conteúdo.
- Descrição.
- Possível origem do problema, quando disponível.

Distinguir erros bloqueantes de avisos.

O comando deve retornar código de saída diferente de zero quando houver erros bloqueantes.

Não declarar um capítulo jogável apenas porque seus manifestos possuem sintaxe válida.

## 7. Validação de assets

Verificar os recursos declarados pelo capítulo utilizando o pipeline existente.

Detectar:

- Tema inexistente.
- Tileset não registrado.
- Sprite desconhecido.
- Animação inválida.
- Arquivo de áudio inexistente.
- Referência a recurso não suportado.
- Capabilities incompatíveis.

Respeitar os identificadores e registros atuais.

Não criar outro carregador de texturas ou áudio.

Se alguma verificação depender do runtime Phaser, classificá-la corretamente como não executada em vez de apresentar sucesso falso.

## 8. Comando inspect

Implementar consulta resumida dos dados de um capítulo.

Exemplo:

`npm run chapter -- inspect exemplo-floresta`

Apresentar:

- Identificador.
- Nome.
- Revisão.
- Quantidade de fases.
- IDs das fases.
- Biomas e regiões.
- Capabilities.
- Dependências.
- NPCs e encontros.
- Recursos visuais.
- Entradas e saídas.
- Elegibilidade para campanha.
- Disponibilidade para modo individual.
- Diagnósticos.

Reutilizar os dados projetados pelo catálogo.

Permitir saída legível no terminal.

Se for simples e útil, adicionar opção `--json`, mantendo os mesmos dados e códigos de diagnóstico.

Não criar outro banco de metadados.

## 9. Registro de capítulos

O catálogo de produção ainda utiliza registro explícito em TypeScript.

Preservar essa arquitetura nesta etapa.

A CLI não deve modificar automaticamente `CAMPAIGN_CHAPTER_CATALOG`.

Implementar ou documentar um procedimento explícito de registro que utilize o ponto de extensão existente.

Preferir uma das alternativas, conforme a arquitetura real:

- Registro explícito de capítulo no catálogo.
- Bootstrap isolado de desenvolvimento com catálogo injetado.

Não implementar descoberta automática arbitrária por filesystem.

Não introduzir carregamento remoto.

Se o registro de desenvolvimento exigir um pequeno adaptador reutilizável, implementá-lo sem modificar o comportamento da produção.

Não criar condições específicas para capítulos gerados na `GameScene`.

## 10. Comando preview

O comando `preview` deverá facilitar a inspeção de um capítulo recém-criado.

Reutilizar World Lab e o modo individual existentes.

Resultado desejado:

1. Localizar o capítulo.
2. Validar seu conteúdo.
3. Preparar o registro isolado de desenvolvimento.
4. Permitir carregá-lo no World Lab ou no modo individual.
5. Informar uma URL ou instrução de acesso apenas quando o ambiente realmente disponibilizá-la.

Não criar outro visualizador.

Não implementar editor visual.

Não afirmar que uma fase foi renderizada se apenas seus dados foram validados.

Se o bootstrap de preview exigir alterações estruturais maiores, implementar o menor mecanismo seguro de integração e documentar a limitação para a 9.7C.

**O comando não pode simular uma pré-visualização funcional.**

## 11. Compatibilidade com o template 9.7A

O capítulo gerado deve preservar o fluxo jogável demonstrado na etapa anterior:

`Entrar → NPC → Diálogo → Missão → Encontro → Recompensa → Saída → Conclusão`

Utilizar somente:

- Arquétipos existentes.
- Comandos narrativos existentes.
- Triggers existentes.
- Recursos visuais suportados.
- Políticas de conteúdo existentes.

Não criar novas mecânicas para facilitar a geração.

O capítulo deve ser editável sem alterar os arquivos do template original.

## 12. Teste de autoria independente

Implementar uma prova automatizada:

1. Criar um capítulo novo por meio da CLI.
2. Verificar arquivos gerados.
3. Validar o manifesto.
4. Registrar em ambiente isolado.
5. Descobrir pelo catálogo.
6. Carregar pelo `StageLoader`.
7. Resolver mapa, encontros e apresentação.
8. Executar o fluxo narrativo mínimo.
9. Validar recompensa e conclusão.
10. Confirmar que o catálogo de produção não foi alterado.

Repetir com outro namespace para demonstrar ausência de conflitos.

Utilizar diretórios temporários e limpeza segura nos testes.

Não adicionar capítulos sintéticos ao catálogo de produção.

## 13. Testes negativos

Cobrir:

- Nome inválido.
- Namespace duplicado.
- Diretório existente.
- Tentativa de path traversal.
- Falha parcial durante criação.
- Manifesto malformado.
- ID duplicado.
- Capability não suportada.
- Dependência inexistente.
- Encontro inválido.
- Referência narrativa inválida.
- Saída incompatível.
- Asset não registrado.
- Revisão inválida.
- Falha de registro.
- Capítulo indisponível para campanha.

Verificar códigos de saída e preservação dos arquivos existentes.

Não considerar avisos não bloqueantes como erros fatais, salvo quando exigido pelos contratos.

## 14. Documentação

Criar:

`SPEC/2026-10-31-etapa-9-7b-cli-autoria-validacao-capitulos.md`

Atualizar:

`SPEC/README.md`

Criar o próximo registro sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

O último registro conhecido é 44. Verificar se 45 está disponível.

Atualizar o README do template com os comandos efetivamente implementados.

Documentar:

- Instalação e requisitos.
- Como criar capítulos.
- Como modificar conteúdo.
- Como validar.
- Como inspecionar.
- Como executar preview.
- Como registrar o capítulo.
- Como interpretar os diagnósticos.
- Limitações atuais.
- Preparação para a 9.7C.

Não documentar comandos inexistentes.

## 15. Estratégia de implementação para DeepSeek

Dividir a execução em três incrementos.

### Incremento A — CLI e geração

- Inspecionar o template.
- Criar estrutura mínima da CLI.
- Implementar `create`.
- Garantir criação segura e determinística.
- Executar testes direcionados.

### Incremento B — Validação e inspeção

- Implementar `validate`.
- Implementar `inspect`.
- Reutilizar validadores existentes.
- Integrar preview ao mecanismo disponível.
- Testar falhas e diagnósticos.

### Incremento C — Prova e fechamento

- Criar capítulo pela CLI.
- Validar e carregar o conteúdo gerado.
- Testar isolamento.
- Atualizar documentação.
- Executar regressões e validações finais.
- Produzir relatório.

Executar testes direcionados após cada incremento.

Executar a suíte completa somente após a última alteração funcional.

Não gastar contexto reconstruindo a arquitetura já documentada.

Se houver interrupção por limite de uso, preservar o worktree e registrar o ponto exato pendente.

## 16. Restrições

- Não iniciar a 9.7C.
- Não implementar editor visual.
- Não criar outro sistema de plugins.
- Não criar outro formato de capítulo.
- Não criar outro registry.
- Não criar outro validador.
- Não implementar carregamento remoto.
- Não criar marketplace.
- Não modificar combate ou IA.
- Não alterar topologias da campanha.
- Não modificar saves.
- Não reescrever `GameScene`.
- Não adicionar capítulos fictícios à produção.
- Não executar operações destrutivas de filesystem.
- Não instalar dependências desnecessárias.
- Não criar commit nem executar push.

## 17. Validações finais

Após a última alteração funcional, executar:

- Testes específicos da CLI.
- Testes do template.
- Testes de registry, loader e validator.
- Testes de catálogo.
- Testes narrativos.
- Testes de encontros.
- Testes de saídas.
- Testes de preview, quando implementado.
- Teste de criação de dois capítulos independentes.
- `npm test -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

Não enfraquecer testes existentes.

## 18. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Estrutura e comandos da CLI.
3. Como `create` funciona.
4. Como `validate` funciona.
5. Como `inspect` funciona.
6. Como `preview` funciona ou suas limitações.
7. Política de registro dos capítulos.
8. Segurança das operações de filesystem.
9. Resultado da prova de independência.
10. Resultado da geração de duas cópias.
11. Testes e validações executados.
12. Homologação visual efetivamente realizada.
13. Limitações restantes.
14. Estado para commit.
15. Pendências para a 9.7C.

## Critério de conclusão

Um desenvolvedor deve conseguir executar um comando para gerar um novo capítulo a partir do template oficial, validar seu conteúdo, consultar seus metadados e prepará-lo para execução em ambiente de desenvolvimento.

A geração não pode alterar arquivos centrais do motor.

A validação deve utilizar os contratos e validadores reais.

Dois capítulos gerados com namespaces diferentes devem coexistir sem conflito.

**A CLI deverá automatizar a autoria já comprovada na 9.7A, sem introduzir uma segunda arquitetura de conteúdo.**

Não criar commit nem executar push. Entregar implementação, testes, documentação e relatório factual.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
