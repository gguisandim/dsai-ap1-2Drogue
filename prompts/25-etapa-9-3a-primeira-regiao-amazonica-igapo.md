# Registro de prompt: Etapa 9.3A — Primeira Região Amazônica Jogável: Igapó

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-3a-primeira-regiao-amazonica-igapo`
- Data: `2026-10-29`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- Commit: `pendente`
- Execução: `implementação e validações concluídas; homologação visual não observada por indisponibilidade do helper nativo`

## Arquivos modificados

- `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- `SPEC/README.md`
- `prompts/25-etapa-9-3a-primeira-regiao-amazonica-igapo.md`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabMacroDataService.ts`
- `src/scenes/GameScene.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/index.ts`
- `src/stages/chapters/registerCampaignChapters.ts`
- `src/stages/index.ts`
- `src/tests/campaignMacroRouteBinding.test.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/macroCampaignPhaserAdapter.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/worldLabMacroUi.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.3A — Primeira Região Amazônica Jogável: Igapó

Implemente a primeira fase original do Umbra Trail, substituindo o placeholder `verse_02_galeria` utilizado no Igapó por um cenário próprio, integrado à campanha macro e à Rota das Águas.

**Objetivo:** entregar uma região amazônica realmente jogável, com identidade espacial, exploração, combate, saídas físicas e um pequeno acontecimento narrativo, sem modificar os sistemas centrais.

## 1. Contexto obrigatório

Leia inicialmente:
- `AGENTS.md`
- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- SPEC e implementação da Etapa 9.2B.
- Contratos públicos de `src/stages/`.
- Contratos de `StageLoader`, `CampaignMacroRouteBinder` e navegação física.
- Estrutura dos capítulos e mapas existentes.
- Contratos públicos de `src/narrative/`.

Inspecione implementações internas apenas quando necessário.

Antes de implementar, confirme que a 9.2B realmente permite hub → Igapó → hub → retomada. Se não estiver funcional, documente os bloqueios e resolva somente pequenas incompatibilidades diretamente relacionadas.

## 2. Identidade da região

**Nome:** Igapó das Memórias.

**Rota:** Águas.

**Ambientação:** floresta amazônica sazonalmente inundada, com árvores emergindo da água escura, raízes, troncos caídos, pequenas ilhas de terra, vegetação densa e caminhos estreitos.

**Atmosfera:** um lugar silencioso e misterioso, aparentemente vivo, onde algo está alterando as lembranças associadas às águas.

A direção visual deve ser inspirada em características naturais amazônicas, sem copiar cenários de Hollow Knight ou outros jogos.

Hollow Knight é referência apenas para exploração, ambientação e construção de mundo interconectado.

## 3. Mapa original

Criar um StageModule válido, com identidade e manifesto próprios, usando os contratos atuais.

O mapa não pode ser apenas `verse_02_galeria` renomeado.

Deve apresentar:
- Geometria própria e reconhecível.
- Área inicial segura.
- Caminhos interligados.
- Pelo menos uma bifurcação explorável.
- Trechos estreitos e espaços abertos para combate.
- Elementos ambientais que caracterizem um igapó.
- Um ponto de interesse narrativo.
- Um ponto de retorno ao hub.
- Saídas físicas alcançáveis e associadas à campanha.

Diferenciar visualmente solo, água, obstáculos, vegetação e passagens usando recursos compatíveis com o renderer atual.

Reutilizar tiles e assets existentes quando adequados. Caso os recursos atuais não permitam uma identidade visual convincente, criar uma representação provisória coerente e documentar os assets necessários à etapa artística posterior.

Não produzir centenas de sprites programáticos nem acrescentar efeitos visuais desnecessários.

## 4. Exploração

O jogador deve conseguir:
1. Entrar no Igapó vindo da Floresta das Raízes.
2. Explorar o mapa.
3. Encontrar uma bifurcação.
4. Visitar o ponto de interesse.
5. Combater inimigos.
6. Retornar ao hub.
7. Retomar a região com o progresso preservado.

Não implementar novas mecânicas de movimentação.

Água, árvores e obstáculos devem utilizar colisões e regras existentes. Não adicionar natação ou física aquática nesta etapa.

## 5. Combate

Reutilizar:
- Classes e personagens existentes.
- Inimigos disponíveis.
- Sistema de ondas e encontros.
- IA tática.
- Habilidades, armas e recompensas.

Posicionar os encontros de maneira adequada ao cenário.

Garantir que:
- Inimigos não surjam em locais inacessíveis.
- O jogador tenha espaço para esquivar e atacar.
- Portais não sejam bloqueados por obstáculos.
- Ondas não criem softlocks.
- O combate não dependa de uma classe específica.

Não criar novos inimigos nem reescrever IA.

## 6. Primeiro acontecimento narrativo

Introduzir um pequeno evento chamado provisoriamente **Eco das Águas**.

Ideia: o protagonista encontra vestígios de uma memória apagada, indicando que a corrupção está afetando a região.

Usar `NarrativeEventProcessor`, `DialogueEngine` e/ou os contratos existentes, conforme aplicável.

O evento deve:
- Possuir ID estável.
- Ser ativado mediante condição verificável.
- Ser persistido corretamente.
- Não se repetir indevidamente após reload.
- Apresentar texto breve e original.
- Preparar a história independente da Rota das Águas.

Se a apresentação de diálogos ainda não estiver integrada ao Phaser, implementar apenas o conteúdo declarativo e sua validação. Registrar a necessidade de interface para etapa posterior.

Não implementar a história completa da rota, chefes ou sistemas de diálogo paralelos.

## 7. Procedural e rejogabilidade

Preservar a seed e o comportamento determinístico da campanha.

O mapa deve ser compatível com o carregamento modular e a infraestrutura procedural existente.

Se a arquitetura permitir variação sem mudanças no motor, utilizar pequenas variações controladas de encontros ou elementos ambientais.

Não criar outro gerador procedural.

A mesma seed e o mesmo contexto devem produzir resultados equivalentes.

## 8. Integração com campanha

O Igapó deve deixar de ser apenas um placeholder legado no binding da campanha.

Atualizar a referência carregável para o novo StageModule usando contratos públicos.

Preservar:
- Identidade estável da região.
- `CampaignMacroProgression`.
- `CampaignMacroRouteBinder`.
- `CampaignRouter`.
- Saves existentes.
- Recompensas idempotentes.
- Retorno ao hub e retomada.
- Compatibilidade do piloto procedural e do modo legado.

Caso o novo mapa exija revisão de save ou manifesto, implementar compatibilidade explícita e testes. Não fazer migração silenciosa.

As demais regiões continuam `planned`.

Não alterar `GameScene` sem demonstrar que um adapter existente é insuficiente; qualquer ajuste autorizado deve ser mínimo e testado.

## 9. World Lab

O novo Igapó deve ser inspecionável pelo World Lab.

Mostrar:
- Geometria real.
- Spawn do jogador.
- Inimigos.
- Obstáculos e passagens.
- Saídas físicas.
- Ponto de interesse.
- Diagnósticos de alcance e colisão.

O modo Campanha deve abrir o novo mapa do Igapó, não o placeholder anterior.

Não reimplementar o World Lab.

## 10. Testes obrigatórios

Criar testes direcionados para:
- Validação do manifesto.
- IDs e referências.
- Geometria e conectividade.
- Spawn e saídas alcançáveis.
- Posicionamento dos inimigos.
- Determinismo.
- Evento narrativo e idempotência.
- Carregamento pelo StageLoader.
- Integração com a rota macro.
- Retorno ao hub e retomada.
- Persistência e compatibilidade.
- Legado não afetado.

Realizar uma homologação no navegador quando possível, usando movimentação e interação reais.

Não simular a aprovação de uma transição manipulando diretamente o estado interno.

## 11. Restrições arquiteturais

- Não reescrever o motor.
- Não redesenhar personagens.
- Não criar sistemas de combate, IA, save ou navegação paralelos.
- Não recriar `src/content` nem qualquer código removido na auditoria.
- Não gerar classes repetitivas para aumentar LOC.
- Não implementar as outras regiões.
- Não adicionar dependências desnecessárias.
- Não alterar o comportamento padrão do jogo legado.
- Não criar commits automaticamente.

Priorize um capítulo autocontido, com poucos arquivos e dados declarativos.

## 12. Documentação e validação

Criar ou atualizar a SPEC datada da Etapa 9.3A antes da implementação, seguindo `AGENTS.md`.

Registrar o prompt efetivo em `prompts/`, conforme `umbra-prompt-record/v1`.

Durante o desenvolvimento, executar testes afetados.

Ao finalizar, executar:
- Suíte completa, uma vez.
- Typecheck.
- Build.
- Architecture e traceability gates.
- `git diff --check`.

Executar smoke test visual do jogo e do World Lab, quando possível.

## 13. Critérios de aceitação

A etapa somente estará aprovada quando:

1. O Igapó possuir um mapa próprio e carregável.
2. O jogador entrar nele pelo hub usando o fluxo real.
3. O mapa permitir exploração e combate.
4. O ponto de interesse narrativo funcionar ou possuir contrato declarativo validado, com a limitação de interface explicitada.
5. O jogador conseguir retornar ao hub.
6. A campanha preservar o progresso após reload.
7. O World Lab apresentar o novo mapa.
8. O modo legado continuar funcionando.
9. Os testes e gates passarem.

Informar arquivos modificados, testes, evidências, pendências visuais e limitações.

**Não declarar a região artisticamente finalizada. O objetivo é uma fase original, funcional e preparada para receber arte definitiva e aprofundamento narrativo.**
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `A caracterização prévia da Etapa 9.2B passou com 26 testes em quatro suítes. A suíte completa final passou com 826 testes em 53 suítes. Typecheck passou. Build de produção passou com 712 módulos transformados. Architecture gate passou com 791 arquivos e 2.839 dependências. Traceability gate passou com 21 registros v1, oito legados e um commit pendente. git diff --check passou, com avisos informativos de futura conversão LF/CRLF. O Vite iniciou em http://127.0.0.1:5173, mas o helper de Computer Use falhou três vezes ao conectar o pipe nativo; jogo e World Lab não foram homologados visualmente nesta execução.`
- Política de commit: nenhum commit será criado por solicitação explícita.

