# Etapa 8.7: homologação funcional do protótipo Phaser

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-7-homologacao-phaser`
- Data: `2026-10-28`
- Agente: `Claude Code`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- Commit: `pendente`
- Execução: `homologação em Microsoft Edge headless real via CDP (run 731, segunda seed 732, flag OFF, reload, morte e save corrompido); status parcial; nenhum código alterado; check:gates e tsc --noEmit aprovados em 2026-10-28; suíte completa 761/761 e build do estado de código anterior não repetidos por ausência de mudança executável`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-procedural-ramificada.md`
- `prompts/17-etapa-8-7-homologacao-phaser.md`

## Prompt efetivamente recebido

```text
Implemente a **Etapa 8.7 — Homologação funcional do protótipo Phaser** do Umbra Trail.

### Contexto mínimo

Leia:
- `AGENTS.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md` (somente Etapas 8.6–8.7).
- `src/application/stages/BranchingCampaignPilot.ts`
- `src/application/stages/CampaignRouter.ts`
- Trechos relevantes de `src/scenes/GameScene.ts`.
- Testes existentes de integração da campanha.

Consulte outros arquivos apenas diante de problemas concretos. Não explore arquivos gerados ou o repositório inteiro.

### Objetivo

Homologar a campanha ramificada em navegador real, verificando jogabilidade, portais, bifurcações, transições, persistência e compatibilidade com o modo legado.

### Execução

**1. Teste real no navegador**

Inicie o ambiente de desenvolvimento e acesse:

`http://localhost:5173/?branchingCampaign=1&branchingRun=pilot.manual-run&branchingSeed=manual-731`

Verifique:
- Carregamento, sprites, câmera, movimentação e combate.
- Conclusão das ondas e desbloqueio dos portais.
- Proximidade e interação com `E`.
- Navegação pelas duas alternativas e convergência.
- Recompensas e ausência de duplicações.
- Morte, restart, reload e restauração da run.
- Erros no console e falhas visuais.

Repita os testes essenciais com uma segunda seed.

Teste também a flag OFF para confirmar que o jogo legado permanece funcional.

**2. Falhas e recuperação**

Verifique:
- Transições repetidas ou simultâneas.
- Portais bloqueados e inacessíveis.
- Saves incompatíveis ou corrompidos.
- Recuperação após falha de persistência.
- Ausência de perda ou duplicação de recompensas.
- Preservação dos dados legados.

Não apague saves reais para executar testes. Utilize identificadores de run isolados.

**3. Correções**

Corrija somente bugs efetivamente identificados, com testes de regressão específicos.

Não implemente novos sistemas ou refatore módulos fora do problema encontrado.

**4. Evidências**

Registre em relatório:
- Cenários executados e resultados.
- Seeds e rotas utilizadas.
- Problemas encontrados e correções.
- Evidências de navegador, quando disponíveis.
- Limitações dos testes não executados.

Se não houver ferramenta de navegador real disponível, não substitua a homologação por mocks. Execute as verificações possíveis, prepare um roteiro manual reproduzível e classifique a homologação como pendente.

**5. Documentação**

Atualize a SPEC com os resultados e registre este prompt efetivo em `prompts/` conforme `umbra-prompt-record/v1`.

### Restrições

- Não alterar arquitetura sem necessidade comprovada.
- Não modificar combate, IA ou geração procedural sem identificar defeito concreto.
- Não criar fases, personagens, assets ou conteúdo amazônico.
- Não adicionar dependências sem justificativa.
- Não alterar testes anteriores para esconder regressões.
- Não criar commits automaticamente.

### Validação econômica

1. Execute somente testes relevantes durante as correções.
2. Execute gates e typecheck após alterações.
3. Execute a suíte completa e o build uma vez ao final, caso tenha alterado código.
4. Não repita testes aprovados sem mudanças relevantes.
5. Execute `git diff --check`.

### Entrega

Responda de maneira objetiva com:
- Status da homologação: aprovada, parcial ou pendente.
- Cenários realmente testados em navegador.
- Bugs encontrados e corrigidos.
- Arquivos alterados.
- Quantidade de testes aprovados.
- Riscos e pendências restantes.

**Não declare homologação concluída sem evidências de execução em navegador real.**
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Evidências de navegador: `C:\Users\guisa\AppData\Local\Temp\umbra-homolog\01-menu.png` a `18-focus-fight.png`, geradas em perfil Edge temporário fora do repositório.
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
