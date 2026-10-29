# Etapa 9.2A.1: visualização da campanha macro no Umbra World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-9-2a-1-visualizacao-campanha-macro-world-lab`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-rotas-independentes.md`
- Commit: `pendente`
- Execução: `jest direcionado 6/6, suíte completa 792/792 em 49 suítes, tsc --noEmit, check:gates (1708 arquivos, 3735 dependências; 17 registros v1 e 8 históricos), build (707 módulos) e git diff --check aprovados em 2026-10-29; inspeção visual em navegador real não concluída porque o helper de Computer Use não conseguiu determinar a URL atual do Opera com confiança`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/WorldLabMacroDataService.ts`
- `src/devtools/world-lab/WorldLabMacroProjector.ts`
- `src/devtools/world-lab/index.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/ui/MacroCampaignGraphView.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/tests/worldLabMacroUi.test.ts`
- `prompts/21-etapa-9-2a-1-visualizacao-campanha-macro-world-lab.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 9.2A.1 — Visualização da Campanha Macro no Umbra World Lab**.

### Contexto mínimo

Leia:
- `AGENTS.md`
- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `src/devtools/world-lab/`
- `WorldLabMacroDataService.ts`
- `CampaignMacroRouteBinder.ts`
- Contratos públicos de `CampaignMacroProgression` e `CampaignMacroInspection`.

Consulte outros arquivos apenas quando necessário. Não explore arquivos gerados nem o repositório inteiro.

### Objetivo

Adicionar ao World Lab uma visualização interativa da campanha macro, consumindo os dados reais da Etapa 9.2A.

A ferramenta deve permitir explorar visualmente a estrutura:

**Hub — Floresta das Raízes**

Três histórias independentes:
- Águas: Igapó → Mangues → Porto.
- Floresta: Fungos → Copas → Flores.
- Terra: Areias → Ruínas → Cicatriz.

**Camada Corrompida:**
Minas → Cinzas → Temporal → Complexo Industrial.

**Final:**
Palácio do Credor.

### Implementação

**1. Interface**

Adicionar uma aba ou modo `Campanha` ao World Lab existente, preservando todas as funcionalidades atuais.

Criar visualização SVG interativa com:
- Hub central.
- Três rotas independentes.
- Regiões conectadas na ordem definida.
- Marcos narrativos.
- Camada corrompida.
- Região final.
- Conexões e retornos ao hub.

Reutilizar zoom, pan, seleção e componentes visuais existentes sempre que possível.

**2. Estados visuais**

Diferenciar:
- Região carregável.
- Região planejada, sem mapa.
- Região bloqueada.
- Região disponível.
- Região concluída.
- Região atual.

Os estados devem ser derivados dos contratos e dados reais, nunca de informações hardcoded ou condições fictícias.

Quando uma região estiver planejada, mostrar claramente `Mapa ainda não implementado`.

**3. Interatividade**

Ao selecionar uma região:
- Mostrar ID, nome, rota e camada.
- Mostrar estado de desbloqueio.
- Mostrar stage/template associado, quando houver.
- Mostrar condições necessárias para acesso.
- Mostrar conexões de entrada e saída.
- Abrir a visualização do mapa existente quando a região possuir um stage carregável.

Não gerar mapas fictícios para regiões planejadas.

**4. Progressão e inspeção**

Consumir `WorldLabMacroDataService.generate(seed)` e os contratos públicos existentes.

Permitir selecionar uma seed e inspecionar a estrutura correspondente.

Mostrar o progresso macro e as escolhas disponíveis fornecidas pelo serviço.

Se for necessário utilizar um estado demonstrativo, identificá-lo explicitamente como fixture, sem apresentá-lo como save real.

Não implementar lógica própria de desbloqueio, roteamento ou validação.

**5. Integração visual**

Manter a identidade atual do World Lab:
- Dark UI.
- Interface técnica e legível.
- Hierarquia visual consistente.
- Layout responsivo.
- Animações discretas.
- Feedback claro de seleção e erros.

Evitar efeitos exagerados, gradientes decorativos e aparência genérica de dashboard de IA.

Priorizar legibilidade do grafo e facilidade para inspecionar fases durante o desenvolvimento.

**6. Arquitetura**

Reutilizar:
- `WorldLabMacroDataService`
- `WorldLabSession`
- `WorldLabProjector`
- `StageLoader`
- Contratos públicos existentes.

Se forem necessários novos adapters de apresentação, mantê-los dentro de `src/devtools/world-lab/`.

Não criar outra implementação de `CampaignMacroProgression`, `CampaignRouter` ou `CampaignGraphGenerator`.

Preservar o isolamento do World Lab em relação ao bundle de produção.

**7. Testes**

Adicionar testes direcionados para:
- Renderização dos nós e conexões macro.
- Seleção e inspeção de regiões.
- Navegação até mapas carregáveis.
- Identificação de destinos planejados.
- Estados bloqueados e disponíveis.
- Mudança de seed.
- Preservação do visualizador procedural existente.
- Ausência de mutação no estado da campanha.

Testar a interface em navegador real, se disponível. Caso contrário, informar a limitação sem declarar homologação visual completa.

### Restrições

- Não modificar `GameScene`, Phaser ou jogabilidade.
- Não implementar novos mapas, NPCs ou missões.
- Não criar assets definitivos.
- Não modificar a progressão macro.
- Não alterar os saves.
- Não adicionar dependências sem justificativa.
- Não criar um novo aplicativo separado.
- Não incluir World Lab no bundle de produção.
- Não criar commits automaticamente.

### Validação econômica

1. Executar testes novos e afetados durante a implementação.
2. Executar gates e typecheck após finalizar.
3. Executar suíte completa e build uma vez ao final.
4. Executar `git diff --check`.
5. Registrar o prompt efetivo em `prompts/` conforme `umbra-prompt-record/v1`.
6. Atualizar a SPEC com os resultados.

### Critério de aceitação

Ao acessar:

`http://localhost:5173/world-lab.html`

Deve ser possível:
1. Alternar entre visualização procedural e campanha macro.
2. Visualizar o hub e as três histórias independentes.
3. Identificar regiões implementadas e planejadas.
4. Selecionar uma região e visualizar seus detalhes.
5. Abrir o mapa associado quando existir.
6. Inspecionar visualmente desbloqueios, conexões e progresso.
7. Continuar utilizando todas as funcionalidades anteriores do World Lab.

### Entrega

Informar:
- Arquivos modificados.
- Como acessar o novo modo.
- Funcionalidades disponíveis.
- Testes aprovados.
- Limitações.
- Evidências visuais, quando possíveis.

Priorize implementação real e reutilização de código. Não produza somente documentação ou um mockup.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `O pedido foi recebido por meio de um arquivo de texto anexado pelo usuário.`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
