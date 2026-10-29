# Etapa 8.7.1: homologação E2E das transições físicas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-7-1-homologacao-e2e`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `Edge headless real via CDP em dois perfis temporários; P0 aprovado (ondas, portais, E e transição), P1 parcial (route-a e route-b reais; convergência só por topologia) e P2 aprovado (reload, sem duplicação, flag OFF); nenhum código alterado; check:gates, tsc --noEmit e git diff --check aprovados em 2026-10-28; suíte 761/761 e build do estado anterior não repetidos por ausência de mudança executável`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `prompts/18-etapa-8-7-1-homologacao-e2e-transicoes.md`

## Prompt efetivamente recebido

```text
Execute a **Etapa 8.7.1 — Homologação E2E das transições físicas** do Umbra Trail.

### Contexto mínimo

Leia:
- `AGENTS.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md` (seções 8.6–8.7)
- Relatório da homologação 8.7
- Trechos relevantes de `GameScene.ts`, `BranchingCampaignPilot.ts` e `CampaignRouter.ts`

Não explore o repositório inteiro. Consulte outros arquivos apenas diante de um problema concreto.

### Objetivo

Concluir a homologação pendente dos portais físicos, bifurcações, transições e recompensas utilizando **navegador real**, sem mocks ou modificações artificiais do estado do jogo.

Reutilize Edge headless/CDP e Vite, conforme a Etapa 8.7, caso estejam disponíveis.

### Execução por prioridade

**P0 — Primeira transição real (obrigatória)**

1. Inicializar um perfil temporário limpo com a flag `branchingCampaign=1`, run e seed fixas.
2. Iniciar a partida e concluir as ondas normalmente.
3. Confirmar visualmente que os portais aparecem e ficam acessíveis.
4. Movimentar o jogador até uma saída física.
5. Pressionar `E` utilizando input real do navegador.
6. Verificar que o destino carregado corresponde ao `physicalExitId` e à aresta esperada.
7. Confirmar atualização do cursor, percurso e save.
8. Registrar screenshot, IDs, seed e eventuais erros.

**Não avançar para cenários complexos antes de validar P0.**

**P1 — Bifurcação e convergência**

1. Identificar os dois destinos da bifurcação usando o grafo real da run.
2. Executar cada alternativa em perfis temporários independentes, com a mesma configuração de run/seed.
3. Verificar que cada saída leva ao destino correto.
4. Prosseguir até a convergência, se viável pelo fluxo normal.
5. Confirmar que ambos os caminhos chegam ao nó esperado e preservam suas identidades.

Se a automação não conseguir concluir as ondas necessárias, registrar exatamente onde parou. Não simular a convergência por chamadas diretas ao router.

**P2 — Persistência e recompensas**

Após uma transição real:

1. Recarregar a página e verificar restauração do nó confirmado.
2. Verificar `transitionId`, journal de recompensas e ledger de progressão.
3. Confirmar que a recompensa não é concedida novamente após reload/restart.
4. Verificar que o modo legado permanece acessível e não modifica o save da campanha.

Não exigir observação visual dos estados transitórios `pending` e `claimed` se ocorrerem rapidamente; verificar os registros persistidos e distinguir o que foi efetivamente observado.

### Regras de integridade

- Utilizar input real do navegador (teclado/mouse via CDP).
- Não chamar diretamente `prepare()`, `confirm()`, métodos internos da Scene ou funções de concessão de recompensas para simular sucesso.
- Não editar localStorage, saves, posição do jogador, vida ou estados das ondas para forçar aprovação.
- É permitido ler o estado persistido para inspeção e usar perfis temporários isolados.
- Não reutilizar saves de outras homologações.
- Não modificar código de produção apenas para facilitar o teste.
- Não declarar cenários aprovados sem execução real e evidências.
- Não repetir testes já comprovados na 8.7, exceto quando necessários para alcançar os portais.

### Tratamento de bugs

Se encontrar falha reproduzível:

1. Registrar passos, seed, estado anterior e resultado observado.
2. Identificar a causa no menor conjunto possível de arquivos.
3. Aplicar correção pontual e adicionar teste de regressão.
4. Reexecutar o cenário afetado no navegador.

Não refatorar a arquitetura ou implementar novas funcionalidades.

### Evidências e documentação

Para cada cenário, registrar:
- Status: aprovado, falhou ou não executado.
- Run ID e seed.
- Node de origem.
- `physicalExitId` utilizado.
- Node de destino esperado e observado.
- Screenshot/log relevante.
- Problemas e limitações.

Atualizar a SPEC e registrar integralmente este prompt em `prompts/` conforme `umbra-prompt-record/v1`.

### Validação econômica

- Priorizar P0 antes de consumir tempo com P1/P2.
- Não executar a suíte completa se nenhum código foi alterado.
- Caso haja correção, executar testes afetados, gates, typecheck e uma suíte completa ao final.
- Executar `git diff --check`.
- Não adicionar dependências.
- Não criar commits automaticamente.

### Resultado esperado

Entregar relatório conciso com a cobertura E2E comprovada, bugs encontrados, arquivos alterados e pendências.

Classificar a homologação como:
- **Aprovada:** portais, rotas, convergência, persistência e recompensas verificados em navegador.
- **Parcial:** somente parte do fluxo foi comprovada.
- **Bloqueada:** falha reproduzível impede concluir a navegação.

Não considerar testes unitários ou mocks como substitutos de evidência E2E.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Perfis: Edge temporários `umbra-edge-profile-871` (route-b) e `umbra-edge-profile-871a` (route-a); nenhum perfil real foi alterado.
- Evidências: `C:\Users\guisa\AppData\Local\Temp\umbra-homolog-871\` (screenshots 42–47 e 50–66, `p0-e.json`, `p1-right.json`, `p2.json`, `exits.json`).
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
