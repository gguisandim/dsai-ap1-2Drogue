# Registro de prompt: auditoria de fases e menu

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-16-auditoria-fases-menu`
- Data: `2026-11-16`
- Agente: `Copilot SDK em VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-16-auditoria-fases-menu.md`
- Commit: `pendente`
- Execução: `npm run check:gates` (PASS: 929 arquivos, 3.393 dependências, 66 registros v1); `npm run build` (PASS: typecheck e build, aviso não bloqueante de Vite CJS e chunks maiores que 500 kB); `npm test -- --runInBand` (92/95 suítes e 1.182/1.185 testes PASS; 3 falhas de hashes SHA-256 de assets, inclusive SVGs LF no índice e CRLF no worktree por `core.autocrlf=true`); `git diff --check` (PASS); auditoria de segredos dos arquivos dos dois commits (PASS).

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-16-auditoria-fases-menu.md`
- `docs/auditoria-fases-menu.md`
- `prompts/70-auditoria-fases-menu.md`

## Prompt efetivamente recebido

```text
Você está trabalhando no repositório Umbra Trail.

**Objetivo:** realizar uma auditoria técnica das fases existentes e preparar o planejamento de modernização das fases legadas e do menu principal.

### Instruções

1. Leia `AGENTS.md`, `README.md`, `docs/stage-authoring.md` e a documentação relevante de arquitetura.
2. Confira a branch atual, o estado do Git, as branches remotas e os últimos 20 commits. Não descarte alterações existentes.
3. Identifique todas as fases legadas, fases novas, capítulos, catálogos, cenas e componentes do menu.
4. Para cada fase, registre:

- Nome e ID.
- Arquivos responsáveis.
- Tipo de mapa e forma de geração.
- Situação no catálogo e na campanha.
- Objetivos, inimigos, NPCs e transições.
- Problemas identificados e testes disponíveis.
5. Identifique como o menu atual funciona e como seleciona os modos de jogo e as fases.
6. Proponha uma sequência de implementação que reutilize as fases legadas, melhore sua jogabilidade e permita criar novas fases sem comprometer a campanha existente.
7. Execute as verificações disponíveis que não dependam de alterações destrutivas.

### Git e entregas

- Crie uma branch `docs/auditoria-fases-menu` a partir da `main` atualizada, desde que o diretório de trabalho esteja limpo.
- Nesta etapa, não modifique a lógica do jogo, as cenas ou os assets.
- Crie `docs/auditoria-fases-menu.md` com o inventário, os problemas e o planejamento.
- Crie a SPEC correspondente conforme as regras do repositório.
- Execute as validações aplicáveis.
- Faça os commits necessários, com trailers `Agent` e `Spec` corretos.
- Faça push e abra uma Pull Request para `main`, usando GitHub CLI ou integração GitHub autenticada.
- Não realize merge automaticamente.
- Informe o hash dos commits, a URL da PR, os testes executados e eventuais bloqueios.

### Restrições
Preserve os sistemas existentes de campanha, save, progressão, catálogo e autoria de fases. Não crie arquitetura paralela sem necessidade. Evite refatorações fora do escopo.

Use os arquivos e contratos existentes como fonte de verdade. Não presuma que uma fase está jogável apenas porque seus testes unitários passam.

<system_reminder>
<workspace_info>
Initial workspace structure (file names only):
```text
c:\\Users\\jonna\\Desktop\\dsai-ap1-2Drogue
AGENTS.md
README-prompts.md
README.md
jest.config.ts
package.json
tsconfig.cli.json
tsconfig.json
vite.config.ts
SPEC/
	2026-09-29-visao-geral.md
	2026-09-30-combate-jogabilidade.md
	2026-10-01-fases-loja-audio.md
	2026-10-02-animacao-recursos-visuais.md
	2026-10-02-fluxo-cenas-interface.md
	2026-10-02-perfil-configuracoes-persistencia.md
	2026-10-02-personagem-classes-controles.md
	2026-10-03-catalogo-conteudo.md
	2026-10-03-ondas-versos-combos-invocacoes.md
	2026-10-05-geracao-procedural.md
	2026-10-05-motor-combate-habilidades-efeitos.md
	2026-10-05-nucleo-simulacao-eventos.md
	2026-10-05-progressao-fases-recursos.md
	2026-10-06-armas-catalogo.md
	2026-10-06-cenarios-simulacao-qualidade.md
	2026-10-06-combate-coletas-bestiario.md
	2026-10-06-editor-forja-fases.md
	2026-10-06-entrega-documentacao-deploy.md
	2026-10-06-ia-navegacao-taticas.md
	2026-10-06-integracao-sistemas.md
	2026-10-06-pacotes-conteudo-gerado.md
	2026-10-06-progressao-persistente.md
	2026-10-27-arquitetura-campanha-modular.md
	2026-10-28-campanha-procedural-ramificada.md
	2026-10-28-campanha-rotas-independentes.md
	2026-10-28-umbra-world-lab.md
	2026-10-29-auditoria-racionalizacao-codigo.md
	2026-10-29-etapa-9-3b-modularizacao-narrativa.md
	2026-10-29-etapa-9-4a-comandos-narrativos.md
	2026-10-29-etapa-9-4b-integracao-eventos-gameplay-narrativa.md
	2026-10-29-etapa-9-4c-recompensas-conclusao-fases.md
	2026-10-29-primeira-regiao-amazonica-igapo.md
	2026-10-30-etapa-9-4d-homologacao-ciclo-narrativo.md
	2026-10-30-etapa-9-5-contratos-autoria-capabilities.md
	2026-10-30-etapa-9-5b1-apresentacao-visual-biomas.md
	2026-10-30-etapa-9-5b2-entidades-ambientacao.md
	2026-10-31-eficiencia-desenvolvimento-assistido-etapa-1.md
	2026-10-31-etapa-10-0-estetica-efeitos-capitulo-inicial.md
	2026-10-31-etapa-9-6a-catalogo-dinamico-fases.md
	2026-10-31-etapa-9-6b-composicao-deterministica-campanhas.md
docs/
prompts/
scripts/
src/
test-fixtures/
...
```
This snapshot may be truncated or stale. Use tools to inspect file contents and collect more context as needed.
</workspace_info>
</system_reminder>
```

## Observações factuais

- Build e gates passaram. A suíte completa teve 3 falhas em verificações de
  hashes byte a byte; `git ls-files --eol` confirmou que os SVGs afetados estão
  LF no índice e CRLF no worktree por `core.autocrlf=true`. Nenhum asset foi
  modificado nesta tarefa; 92 suítes passaram.
- A auditoria de segredos dos arquivos da SPEC passou; a auditoria dos arquivos
  do segundo commit será feita antes dele.
- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente` antes da consolidação; o gate deriva o commit
  que adicionou este arquivo.
