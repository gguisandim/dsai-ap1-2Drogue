# Registro de prompt: Etapa 9.3A.1 — Homologação E2E Real do Igapó das Memórias

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-3a-1-homologacao-e2e-real-igapo`
- Data: `2026-10-29`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- Commit: `pendente`
- Execução: `pendente`

## Arquivos modificados

- `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- `prompts/26-etapa-9-3a-1-homologacao-e2e-real-igapo.md`

## Prompt efetivamente recebido

```text
# Etapa 9.3A.1 — Homologação E2E Real do Igapó das Memórias

Atue como engenheiro de QA e integração do Umbra Trail.

A Etapa 9.3A implementou o primeiro StageModule amazônico autoral, `stage.aguas.igapo-das-memorias`, com mapa 40×25, combate, bifurcação, ponto de interesse narrativo, saída física e integração à campanha macro.

**Objetivo: homologar o funcionamento real dessa região no Phaser antes de iniciar novos conteúdos.**

Não criar novas funcionalidades, mapas, personagens ou sistemas nesta etapa.

## 1. Contexto mínimo

Leia:
- `AGENTS.md`
- `SPEC/2026-10-29-primeira-regiao-amazonica-igapo.md`
- SPEC da campanha macro, somente os contratos pertinentes.
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/tests/igapoDasMemorias.test.ts`
- Fluxos relevantes de `GameScene.ts`, `CampaignMacroRouteBinder`, `CampaignRouter` e `GameStageCompositionRoot`.

Identifique a feature flag e a URL real do modo campanha macro implementadas na 9.2B. Não invente parâmetros.

Não leia todo o repositório nem arquivos gerados sem necessidade.

## 2. P0 — Travessia física obrigatória

Execute o Vite real e abra o jogo em navegador Chromium/Edge por CDP, usando perfil temporário isolado.

Caso o helper nativo do Windows ou do Opera não funcione, procure alternativa de automação disponível por CDP ou protocolo equivalente, sem instalar dependências desnecessárias.

Verifique:

1. Inicialização da campanha macro.
2. Carregamento da Floresta das Raízes.
3. Movimentação real do personagem até a saída para o Igapó.
4. Interação física usando a tecla E.
5. Carregamento do novo stage `stage.aguas.igapo-das-memorias`.
6. Spawn válido e controles preservados.
7. Cursor e save atualizados corretamente.

A transição precisa ocorrer por input real no navegador.

Não manipule diretamente posição, vida, ondas, localStorage, `prepare()`, `confirm()` ou estados internos para simular sucesso.

**P0 é obrigatório. Não declarar homologação completa sem comprovar essa travessia.**

## 3. P1 — Exploração e renderização

Dentro do Igapó, verificar visualmente:

- Dimensões e geometria.
- Água colidível.
- Ilhas e raízes.
- Bifurcação e conectividade.
- Clareiras.
- Passagens estreitas.
- Colisões do jogador.
- Spawn dos inimigos.
- Ponto de interesse Vestígio Submerso.
- Saída física de retorno ao hub.

Verificar se os obstáculos aparecem de forma coerente no Phaser, e não apenas no World Lab.

Identificar:
- Tiles invisíveis.
- Barreiras inesperadas.
- Passagens inacessíveis.
- Inimigos presos.
- Saídas impossíveis de alcançar.
- Problemas de câmera e renderização.

O StageModule deve apresentar um mapa original, e não o placeholder `verse_02_galeria`.

## 4. P2 — Combate e retorno

Utilizando controles reais:

1. Executar combate no Igapó.
2. Verificar as duas ondas.
3. Confirmar que os inimigos conseguem se movimentar.
4. Confirmar que o jogador consegue atacar e usar habilidades.
5. Verificar desbloqueio da saída, quando aplicável.
6. Aproximar-se do portal de retorno.
7. Pressionar E.
8. Confirmar retorno à Floresta das Raízes.
9. Retomar Igapó usando a navegação macro.
10. Confirmar preservação do progresso.

Não declarar uma onda concluída apenas porque testes headless demonstram que ela pode ser concluída.

Se o combate real impedir a travessia, registrar exatamente onde ocorreu o bloqueio.

## 5. P3 — Persistência e narrativa

Testar:
- Reload dentro do Igapó.
- Restauração do mesmo stage.
- Preservação da seed e identidade da campanha.
- Preservação do contexto macro.
- Estado das recompensas.
- Ausência de transições duplicadas.
- Compatibilidade dos saves anteriores conforme contratos de migração.

Validar o evento `Eco das Águas` por meio dos testes e dos contratos narrativos.

Não exigir diálogo visível no Phaser, pois essa interface ainda não foi implementada.

Distinguir claramente:
- Evento declarativo existente.
- Evento processado e persistido.
- Evento apresentado visualmente ao jogador.

Não declarar os três comportamentos aprovados quando somente os dois primeiros funcionarem.

## 6. P4 — World Lab

Abrir o World Lab real:

`http://localhost:5173/world-lab.html`

Verificar:
- Modo Procedural preservado.
- Modo Campanha funcionando.
- Igapó abrindo seu mapa autoral.
- Geometria e pontos de interesse visíveis.
- Conexões macro corretas.
- Ausência de mapas fictícios em destinos `planned`.
- Console sem exceções.

Conferir correspondência entre o mapa exibido no World Lab e a geometria carregada no Phaser.

## 7. Correção de bugs

Se algum bug for reproduzido:

1. Identificar causa concreta.
2. Aplicar a menor correção possível.
3. Criar teste de regressão.
4. Reexecutar o cenário afetado em navegador quando necessário.

Não iniciar refatorações genéricas.

Não modificar:
- IA tática sem evidência.
- Sistema de combate sem bug reproduzido.
- Arquitetura de campanha.
- Geradores procedurais.
- Saves fora das incompatibilidades comprovadas.
- Arte definitiva.
- Personagens.
- Sistemas narrativos novos.

Não recriar conteúdo removido nas etapas de limpeza.

## 8. Evidências

Registrar para cada cenário:
- Perfil temporário utilizado.
- Feature flag e URL.
- Seed e runId, quando aplicáveis.
- Stage de origem.
- Stage de destino.
- Identidade do portal.
- Ação executada.
- Resultado observado.
- Estado persistido, por leitura.
- Erros de console.
- Capturas antes e depois.

Screenshots e scripts auxiliares podem ficar em diretório temporário.

As conclusões permanentes devem ser documentadas na SPEC.

Não inserir scripts temporários de automação no código de produção.

## 9. Validação econômica

Se nenhum código executável for alterado:
- Testes direcionados, se necessários.
- Typecheck e gates documentais.
- Não repetir 826 testes apenas por documentação.

Se houver correções de código:
- Testes afetados durante a correção.
- Suíte completa uma vez ao final.
- Typecheck.
- Build.
- Gates de arquitetura e rastreabilidade.
- `git diff --check`.

Registrar o prompt efetivo em `prompts/`, conforme `umbra-prompt-record/v1`.

Atualizar a SPEC 9.3A com resultados da homologação.

Não criar commits automaticamente.

## 10. Resultado obrigatório

Apresentar status por cenário:

- APROVADO — testado no navegador e confirmado.
- PARCIAL — evidência incompleta.
- BLOQUEADO — bug reproduzido impede execução.
- NÃO EXECUTADO — ambiente não permitiu executar.

A homologação geral somente será APROVADA se as travessias reais, exploração, combate, retorno, retomada e persistência tiverem sido comprovados.

Informar:
- Evidências obtidas.
- Bugs encontrados e corrigidos.
- Arquivos alterados.
- Testes realizados.
- Problemas restantes.
- Prontidão para a Etapa 9.3B.

**Prioridade: provar que o Igapó funciona de verdade como uma região jogável, não apenas como StageModule validado por testes.**
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `pendente`
- Política de commit: nenhum commit será criado por solicitação explícita.
