# Etapa 9.2B: integração da campanha macro com Phaser

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-29-etapa-9-2b-integracao-campanha-macro-phaser`
- Data: `2026-10-29`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-campanha-rotas-independentes.md`
- Commit: `pendente`
- Execução: `concluída em 2026-10-29; commit pendente`

## Arquivos modificados

- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/application/stages/GameMacroCampaignAdapter.ts`
- `src/application/stages/GameStageCompositionRoot.ts`
- `src/application/stages/index.ts`
- `src/scenes/GameScene.ts`
- `src/tests/macroCampaignPhaserAdapter.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `prompts/24-etapa-9-2b-integracao-campanha-macro-phaser.md`

## Prompt efetivamente recebido

```text
# Etapa 9.2B — Integração da Campanha Macro com Phaser

Implemente a integração jogável da campanha de rotas independentes no Umbra Trail.

A auditoria e limpeza das Etapas 9.2A.2/9.2A.3 já foram concluídas. O projeto possui aproximadamente 172.940 linhas físicas e 801 testes aprovados no último relatório.

**Objetivo:** fazer a primeira vertical slice da campanha funcionar dentro do Phaser, reutilizando os sistemas existentes e sem reconstruir o motor do jogo.

## 1. Contexto obrigatório

Leia somente o necessário:

- `AGENTS.md`
- `SPEC/2026-10-28-campanha-rotas-independentes.md`
- `SPEC/2026-10-28-campanha-procedural-ramificada.md` (contratos relevantes)
- `CampaignMacroRouteBinder.ts`
- `CampaignMacroProgression.ts`
- `UmbraCampaignRouteSlice.ts`
- `CampaignRouter.ts`
- `CampaignRunSaveService.ts`
- `GameScene.ts` (somente os fluxos de inicialização, portais, transições e reconstrução)
- APIs públicas de StageLoader, PhysicalExitResolver e CampaignExitBinder.

Consulte outros arquivos somente quando exigido pela implementação.

Não leia todos os arquivos gerados nem o repositório inteiro.

## 2. Vertical slice jogável

Implementar exclusivamente:

**Hub: Floresta das Raízes**
- Utilizar `verse_01_atrium` como placeholder.
- Ponto inicial da campanha macro.
- Apresentar uma saída física disponível para Igapó.
- Preservar a movimentação e interação existentes.
- Não exigir combate no hub apenas para permitir a saída, salvo regra já definida e justificada.

**Rota das Águas: Igapó**
- Utilizar `verse_02_galeria` como placeholder.
- Entrar por uma transição real, usando a tecla E.
- Preservar combate, inimigos, ondas e habilidades.
- Oferecer saída física válida de retorno ao hub.
- Permitir continuar a rota posteriormente.

**Demais regiões**
- Permanecem `planned`.
- Não devem gerar portais para fases inexistentes.
- Não devem ser apresentadas como mapas jogáveis.
- As demais rotas não precisam ser implementadas nesta etapa.

## 3. Integração arquitetural

Reutilizar obrigatoriamente:

- CampaignMacroRouteBinder
- CampaignRouter
- CampaignMacroProgression
- CampaignRunSaveService
- StageLoader
- PhysicalExitResolver
- CampaignExitBinder

Não implementar outro router, gerador ou serviço de save.

Integrar o Phaser por um adapter pequeno, quando necessário, sem reescrever GameScene.

Reutilizar os fluxos atuais de carregamento, transição e reconstrução de fases. Evitar duplicar código já existente.

## 4. Saídas físicas

Implementar a navegação:

1. Jogador inicia no hub.
2. Aproxima-se do portal para Igapó.
3. Pressiona E.
4. O binder prepara e confirma a transição válida.
5. Phaser carrega o destino correto.
6. Jogador percorre Igapó normalmente.
7. Utiliza uma saída física para retornar ao hub.
8. Posteriormente consegue retomar Igapó.

As saídas devem:
- Ser vinculadas a conexões reais da macroestrutura.
- Possuir identidade física estável.
- Respeitar bloqueios.
- Ser alcançáveis.
- Exigir interação real.
- Não permitir transições duplicadas por múltiplos inputs.
- Não levar a um stage inválido.

Não utilizar teletransporte artificial baseado apenas em botões de debug.

## 5. Persistência e retomada

Utilizar os contratos existentes:

- `macroProgress`
- `activeGraphContextId`
- `parkedGraphContexts`
- Node atual.
- Histórico.
- Seeds.
- Checkpoints.
- Journal de recompensas.

Garantir que:

- Entrar em Igapó atualize a run corretamente.
- Retornar ao hub preserve o contexto da rota.
- Retomar Igapó restaure seu contexto, em vez de reiniciar indevidamente.
- Reload não apague o progresso.
- Reiniciar o navegador não recrie uma campanha diferente.
- Falhas de persistência não avancem silenciosamente o jogo.
- Recompensas não sejam duplicadas por transições ou reload.

Respeitar os limites atuais de travessia das conexões. O piloto deve comprovar entrada, retorno e ao menos uma retomada.

Se esse limite impedir a experiência mínima, documentar e implementar somente a menor alteração contratual necessária, com testes. Não introduzir revisitas ilimitadas sem decisão explícita na SPEC.

Não declarar garantias de atomicidade entre armazenamentos diferentes sem implementação comprovada.

## 6. Compatibilidade

Criar uma feature flag para ativar o novo modo de campanha.

Com a flag desligada:
- Manter o jogo legado funcionando.
- Preservar o piloto procedural ramificado existente.
- Não criar nem modificar indevidamente o save macro.

Definir precedência explícita entre flags existentes e a nova flag, evitando inicialização simultânea de dois modos de campanha.

Não migrar saves automaticamente sem necessidade.

## 7. Interface mínima

Exibir ao jogador apenas informações essenciais:

- Região atual.
- Rota atual.
- Indicação de saída interativa.
- Mensagem para destinos bloqueados, quando houver representação física apropriada.
- Feedback durante a transição.

Não criar uma nova interface completa.

Não redesenhar personagens ou mapas.

Não implementar NPCs, diálogos completos, chefes ou história definitiva.

## 8. Testes

Criar testes direcionados para:

- Hub → Igapó.
- Igapó → Hub.
- Retomada de Igapó.
- Persistência após reload.
- Isolamento entre contextos de grafos.
- Destinos planejados não carregáveis.
- Portal bloqueado.
- Interação E duplicada.
- Erro durante prepare/confirm.
- Falha de persistência.
- Recompensa idempotente.
- Compatibilidade das flags.
- Fluxo legado preservado.

Reutilizar testes e fixtures já existentes.

## 9. Homologação em navegador real

Se disponível, executar Vite e Edge headless/CDP para verificar:

- Inicialização da campanha macro.
- Movimentação real pelo hub.
- Aproximação e ativação do portal com E.
- Entrada real em Igapó.
- Retorno real ao hub.
- Retomada da rota.
- Persistência após reload.
- Console sem exceções.
- World Lab funcionando separadamente.

Utilizar inputs reais do navegador; não manipular localStorage, posição, ondas ou estados internos para simular uma transição.

Registrar evidências e screenshots temporários quando possível.

Se a homologação não for possível, informar claramente os cenários não comprovados.

## 10. Restrições

- Não reescrever GameScene.
- Não reintroduzir o código morto removido.
- Não recriar `src/content`.
- Não adicionar frameworks ou dependências desnecessárias.
- Não alterar combate, IA, inventário ou habilidades.
- Não implementar as três rotas completas.
- Não adicionar mapas definitivos.
- Não duplicar serviços de navegação ou persistência.
- Não criar centenas de arquivos.
- Não alterar o modo legado por padrão.
- Não criar commits automaticamente.

A arquitetura deve ficar mais simples ou, no mínimo, não aumentar sua complexidade injustificadamente.

## 11. Validação

Durante a implementação:
- Executar testes afetados.
- Utilizar os contratos públicos existentes.

Ao finalizar, executar uma vez:
- Suíte completa.
- Typecheck.
- Build.
- Architecture gate.
- Traceability gate.
- `git diff --check`.

Atualizar a SPEC e registrar o prompt efetivo em `prompts/`, respeitando `umbra-prompt-record/v1`.

## 12. Resultado esperado

Entregar a primeira conexão jogável entre duas regiões independentes da campanha.

Demonstrar:

1. O jogador começa na Floresta das Raízes.
2. Entra fisicamente no Igapó.
3. Joga normalmente.
4. Retorna ao hub.
5. Retoma a rota sem perder o progresso.
6. Recarrega o jogo com a mesma campanha.
7. O modo legado continua funcionando.
8. O World Lab permanece operacional.

Informar:
- Arquivos modificados.
- Feature flag e URL de teste.
- Arquitetura reutilizada.
- Fluxos homologados.
- Testes aprovados.
- Limitações.
- Pendências para a Etapa 9.3.

Prioridade absoluta: integração pequena, funcional e comprovável. Não transformar esta vertical slice em uma reestruturação de todo o motor.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Nenhum commit foi solicitado ou criado automaticamente.
- Testes direcionados: 13 novos e 19 caracterizações afetadas aprovados.
- Suíte completa: 814/814 testes em 52 suítes.
- Typecheck e build aprovados; o build transformou 709 módulos.
- Gates aprovados: arquitetura com 787 arquivos/2.820 dependências;
  rastreabilidade com 20 registros v1, oito legados e um commit pendente.
- `git diff --check` aprovado; avisos LF/CRLF não foram misturados à integração.
- Homologação real parcial no Opera: hub macro sem combate e com um portal
  visível; World Lab Procedural/Campanha operacional. Movimento sustentado e
  travessias por `E` não foram comprovados porque o helper só produziu taps
  instantâneos; nenhum estado interno ou storage foi manipulado.
