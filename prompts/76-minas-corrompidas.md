# Registro de prompt: Minas Corrompidas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-22-minas-corrompidas`
- Data: `2026-11-22`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-22-minas-corrompidas.md`
- Commit: `pendente`
- Execução: `validate` OK (0 erros, 1 warning `stage-catalog.excluded.individual-only`); `plan validate` ok; `playtest` PASS (27 checks, 0 falhas, 4 UNKNOWN de execução ao vivo); `preview` headless exit 0; homologação Phaser Corrompida (variant explícita) PASS e Abandonada (apresentação padrão) PASS, com 16 checks, 0 falhas e 1 UNKNOWN de transição cada; uma tentativa Abandonada (variant explícita) passou missão, flag, desbloqueio e transição para MenuScene, mas os dois checks finais de alcance/acionamento da saída falharam porque a transição de cena ocorreu antes da leitura do estado (FAIL de medição, não de gameplay); uma primeira tentativa Abandonada morreu em combate real antes da conclusão e foi refeita com PASS; `check:gates` OK; `build` OK; `npm test -- --runInBand` 100 suítes e 1221 testes PASS; `git diff --check` OK.

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-22-minas-corrompidas.md`
- `src/scenes/BootScene.ts`
- `src/stages/chapters/CampaignChapterCatalog.ts`
- `src/stages/index.ts`
- `src/stages/chapters/minas-corrompidas/index.ts`
- `src/stages/chapters/minas-corrompidas/minasCorrompidasMap.ts`
- `src/stages/chapters/minas-corrompidas/minasCorrompidasStage.ts`
- `src/stages/chapters/minas-corrompidas/stage-plan.json`
- `src/stages/chapters/minas-corrompidas/visuals.ts`
- `src/presentation/assets/bootMinasAssets.ts`
- `src/presentation/assets/minasAssetCatalog.ts`
- `src/assets/minas-corrompidas/README.md`
- `src/assets/minas-corrompidas/mine-core.svg`
- `src/assets/minas-corrompidas/mine-crystals-corrupted.svg`
- `src/assets/minas-corrompidas/mine-crystals.svg`
- `src/assets/minas-corrompidas/mine-evidence.svg`
- `src/assets/minas-corrompidas/mine-floor-abandoned.svg`
- `src/assets/minas-corrompidas/mine-floor-corrupted.svg`
- `src/assets/minas-corrompidas/mine-fungi.svg`
- `src/assets/minas-corrompidas/mine-guardian.svg`
- `src/assets/minas-corrompidas/mine-heart.svg`
- `src/assets/minas-corrompidas/mine-ledger.svg`
- `src/assets/minas-corrompidas/mine-machinery.svg`
- `src/assets/minas-corrompidas/mine-maira.svg`
- `src/assets/minas-corrompidas/mine-mole.svg`
- `src/assets/minas-corrompidas/mine-nilo.svg`
- `src/assets/minas-corrompidas/mine-rails.svg`
- `src/assets/minas-corrompidas/mine-rootling.svg`
- `src/assets/minas-corrompidas/mine-roots-corrupted.svg`
- `src/assets/minas-corrompidas/mine-roots.svg`
- `src/assets/minas-corrompidas/mine-seal.svg`
- `src/assets/minas-corrompidas/mine-timber-corrupted.svg`
- `src/assets/minas-corrompidas/mine-timber.svg`
- `src/assets/minas-corrompidas/mina-abandoned-panorama.png`
- `src/assets/minas-corrompidas/mina-corrupted-panorama.png`
- `src/tests/minasCorrompidas.test.ts`
- `src/tests/worldLabPresentation.test.ts`

## Prompt efetivamente recebido

```text
# Umbra Trail — Implementação autoral de Minas Corrompidas

## Objetivo

Implemente uma nova fase autoral chamada **Minas Corrompidas**, utilizando a arquitetura atual do Umbra Trail.

A tarefa deve resultar em uma fase **completa, funcional, visualmente elaborada e homologada no Phaser**, não apenas em uma SPEC ou diagnóstico.

Esta será a quinta fase da campanha principal reduzida, planejada com seis etapas:

1. Floresta das Raízes — implementada.
2. Igapó das Memórias — implementada.
3. Coração Corrompido — implementada.
4. Jardins das Flores Veladas — implementada.
5. **Minas Corrompidas — implementar agora.**
6. Palácio do Credor — implementado individualmente.

A integração definitiva dessa sequência à campanha será feita posteriormente.

## 1. Identidade do capítulo

A fase deve representar a primeira incursão do jogador nas regiões corrompidas, onde a exploração mineral e a deterioração ambiental se encontram.

Referência macro já existente:

`region.corrupted.minas`

Propostas de identificadores:

- Capítulo: `chapter.corrupted.minas`
- Fase: `stage.corrupted.minas`
- Variante Natural/Abandonada: `variant.corrupted.minas.abandoned`
- Variante Corrompida: `variant.corrupted.minas.corrupted`

Confirme os identificadores e os contratos atuais antes de implementá-los.

Não duplique referências, fases ou registros existentes.

## 2. Auditoria técnica inicial

Leia:

- `AGENTS.md`
- `docs/stage-authoring.md`
- `src/stages/contracts/`
- `src/narrative/contracts/`
- `src/stages/chapters/`
- `src/application/stages/UmbraCampaignSkeleton.ts`
- `src/application/stages/CampaignMacroRouteBinder.ts`
- `src/presentation/`
- `src/devtools/world-lab/`
- `src/stages/chapters/palacio-do-credor/`
- `src/stages/chapters/flores-veladas/`

Investigue especialmente os recursos que podem ser reaproveitados do Palácio do Credor: catálogo de assets, sistema de variantes, inimigos, encontros com HP autoral, eventos e homologação.

Verifique também as implementações narrativas da Floresta das Raízes e do Igapó.

Não reescreva ferramentas ou sistemas que já existem.

## 3. Narrativa — O Subsolo da Dívida

Desenvolva uma narrativa original baseada na seguinte premissa:

Há muito tempo, as Minas Corrompidas foram abertas para extrair um mineral capaz de armazenar energia da floresta. Inicialmente, o material era coletado com limites e devoluções ao território.

Com a expansão da exploração, esses limites foram abandonados. Galerias foram aprofundadas, aquíferos sofreram alterações e organismos subterrâneos passaram a incorporar os resíduos da mineração.

Agora, parte da própria mina parece viva.

O jogador chega ao local para investigar a origem material da corrupção e descobrir a relação entre a extração mineral e os pactos do Credor.

### Elementos narrativos obrigatórios

- Um NPC sobrevivente ou guardião das galerias.
- Um personagem ou vestígio que apresente uma perspectiva diferente sobre a exploração.
- Uma missão investigativa principal.
- Registros ou evidências ambientais.
- Uma descoberta relevante sobre o Credor.
- Um confronto ligado ao núcleo da mina.
- Uma conclusão que prepare narrativamente a chegada ao Palácio.

Não retratar a exploração como um problema simples resolvido apenas matando criaturas.

O jogador deve perceber que a mina já passou por transformações históricas, econômicas e ecológicas.

Evite textos longos sem interação. Priorize narrativa ambiental, descoberta progressiva e diálogos contextualizados.

Preserve os elementos canônicos do Palácio do Credor já implementado. Não invente relações incompatíveis com seus diálogos e epílogos.

## 4. Level design — Da floresta ao subsolo

Crie um mapa panorâmico contínuo, com exploração lateral e regiões reconhecíveis.

A fase deve transmitir uma descida progressiva para o interior de um território explorado.

### Regiões sugeridas

1. **Floresta sobre a mina**
   - Vegetação amazônica densa.
   - Trilhas entre árvores.
   - Estruturas antigas de exploração.
   - Entradas de galerias parcialmente ocultas.

2. **Acampamento abandonado**
   - Abrigos deteriorados.
   - Equipamentos e registros.
   - Primeiro NPC e introdução da investigação.

3. **Galerias de extração**
   - Paredes rochosas.
   - Trilhos, vigas e estruturas de sustentação.
   - Veios minerais.
   - Caminhos bifurcados e pequenos desvios.

4. **Cavernas invadidas pela floresta**
   - Raízes atravessando rochas.
   - Fungos bioluminescentes.
   - Água subterrânea.
   - Vegetação adaptada à escuridão.

5. **Galerias contaminadas**
   - Minerais alterados.
   - Estruturas corroídas.
   - Criaturas territorialmente agressivas.
   - Sinais evidentes da corrupção.

6. **Núcleo de extração**
   - Câmara monumental.
   - Maquinário orgânico/mineral.
   - Manifestação mais intensa da corrupção.
   - Confronto principal.

7. **Câmara de revelação**
   - Descoberta da ligação com o Credor.
   - Conclusão da missão.
   - Saída desbloqueada.

Use `stage-plan.json` e a estrutura declarativa existente.

Não criar apenas um conjunto de salas retangulares repetitivas. O mapa precisa ter silhuetas e circulação interessantes.

Não implementar um segundo sistema de mapas ou transições.

## 5. Direção artística — Pixel art + PNG + SVG

A direção artística deve atingir o mesmo nível de ambição visual dos Jardins das Flores Veladas e do Palácio do Credor, mas com identidade própria.

### Pixel art

Utilizar para:

- terreno jogável;
- colisões e caminhos;
- personagens;
- inimigos;
- objetos interativos;
- elementos essenciais à leitura do gameplay.

### PNG pictórico

Criar ou utilizar recursos adequadamente licenciados para:

- paredes rochosas monumentais;
- formações subterrâneas;
- grandes raízes;
- maquinário abandonado;
- lagos subterrâneos;
- cenários profundos;
- vegetação que invade estruturas;
- camadas de fundo e primeiro plano.

### SVG autoral

Utilizar para:

- cristais e minerais;
- estruturas de mineração;
- raízes deformadas;
- fungos;
- mecanismos antigos;
- marcas de extração;
- símbolos associados ao Credor;
- elementos ambientais exclusivos.

Pode utilizar ferramentas de geração de imagens quando disponíveis e compatíveis com o fluxo de trabalho.

Não afirmar que utilizou ImageGen ou outra ferramenta sem realmente tê-la utilizado.

Também são permitidas bibliotecas externas com licenças compatíveis, origem documentada e integração visual coerente.

**O cenário não pode parecer apenas um tilemap marrom com cristais roxos.**

Precisa existir uma composição artística rica, com profundidade, escala, contraste e atmosfera.

## 6. Duas variantes visuais

Implemente duas variantes de apresentação para a mesma fase.

### Variante Abandonada

Representa a mina deteriorada, mas ainda reconhecível.

- Rocha úmida.
- Madeira apodrecida.
- Minerais relativamente estáveis.
- Raízes e vegetação recuperando espaço.
- Iluminação natural escassa.
- Água subterrânea.
- Estruturas abandonadas.

### Variante Corrompida

Representa a mina em um estado avançado de contaminação.

- Minerais deformados e luminosos.
- Fungos anômalos.
- Raízes mineralizadas.
- Esporos e névoa.
- Estruturas parcialmente incorporadas ao ambiente.
- Alterações reais nas silhuetas das formações.
- Iluminação opressiva e atmosfera instável.

Não limitar a diferença entre variantes à paleta ou a filtros.

Reutilize o contrato de `presentationVariants`.

A geometria lógica, as missões e as colisões devem permanecer equivalentes, salvo necessidade fundamentada.

A troca dinâmica por flags não é obrigatória.

## 7. Inimigos e encontros

Crie encontros coerentes com a mineração e a corrupção.

Sugestões de arquétipos:

- Criaturas subterrâneas territorialistas.
- Organismos parcialmente mineralizados.
- Seres vegetais adaptados à escuridão.
- Guardiões corrompidos das galerias.
- Uma entidade ligada ao núcleo de extração.

Priorize os sistemas de IA, combate e encontros existentes.

Use modelos de inimigos visualmente adequados ou crie novos sprites autorais.

Não reaproveite indiscriminadamente os sprites genéricos se eles prejudicarem a identidade da região.

### Progressão de combate

Os encontros devem aumentar gradualmente a dificuldade.

Não criar ondas apenas para prolongar artificialmente a partida.

O confronto principal deve ter uma condição real e verificável de vitória.

Utilize o campo de HP autoral recentemente integrado quando necessário.

Balanceie a dificuldade considerando as quatro classes jogáveis.

Não alterar a IA central sem necessidade comprovada.

## 8. Missão e consequências

Implemente uma missão completa.

A progressão deve envolver:

1. Descobrir o histórico da mina.
2. Investigar as galerias.
3. Encontrar evidências da corrupção.
4. Alcançar o núcleo de extração.
5. Resolver o confronto.
6. Registrar a descoberta sobre o Credor.
7. Desbloquear fisicamente a saída.

Utilize flags, eventos, comandos narrativos, progressão e recompensas já suportados.

Prepare uma consequência persistente que possa ser utilizada pela campanha reduzida posteriormente.

**Não conceda automaticamente `milestone.corrupted.primary` sem verificar o contrato e formalizar sua semântica.**

Não implemente transições artificiais para o Palácio nesta etapa.

## 9. Integração modular

Registre a fase no catálogo autoral.

Ela deve estar disponível em:

- Jogar Fase.
- World Lab.
- Ferramentas de preview.
- Ferramentas de validação.
- Homologação Phaser.

Preserve a identidade macro `region.corrupted.minas`, mas não considere a camada corrompida inteira concluída.

Evite duplicações no `StageRegistry` e alterações desnecessárias no carregador.

Não modificar outras fases autorais para acomodar erros da nova fase.

## 10. Segurança do repositório

Verifique o worktree antes de editar.

Existem trabalhos recentes relacionados ao redesign de classes, ao Palácio do Credor e ao carregamento de assets.

Preserve quaisquer alterações locais existentes.

Caso precise editar arquivos compartilhados, como `BootScene.ts`, `GameScene.ts` ou o homologador, integre apenas os trechos necessários.

Não execute reset, clean ou operações destrutivas.

Não faça commit ou push.

## 11. Homologação obrigatória

Execute a fase real no Phaser, verificando:

- Spawn.
- Movimentação.
- Câmera.
- Colisões.
- Diálogos.
- Missão.
- Encontros.
- Combate.
- Vitória.
- Persistência.
- Desbloqueio de saída.
- Conclusão individual.

Teste as quatro classes jogáveis quando viável, especialmente a compatibilidade de seus ataques e habilidades com a geometria subterrânea.

Verifique as variantes Abandonada e Corrompida no World Lab e na execução real.

Capture imagens representativas de ambas.

### Verificações técnicas

Execute os comandos equivalentes disponíveis no projeto:

- Validação do capítulo.
- Validação de `stage-plan.json`.
- Playtest estático.
- Homologação Phaser.
- `npm run check:gates`
- `npm run build`
- `npm test -- --runInBand`
- `git diff --check`

Registre PASS, FAIL e UNKNOWN corretamente.

Não simule conclusão alterando HP, teletransportando o jogador ou ignorando os eventos reais de missão e saída.

## 12. Evidências

Produza capturas reais de:

- Floresta de entrada.
- Acampamento abandonado.
- Galerias.
- Caverna tomada por raízes.
- Núcleo mineral.
- Área corrompida.
- Combate principal.
- Resolução e saída.

Inclua comparação das variantes nos mesmos locais.

Documente limitações de performance quando não houver medição confiável.

## 13. Documentação

Crie:

- SPEC da nova fase.
- Registro integral do prompt.
- README dos assets com procedência e licenças.
- Relatório de homologação.
- Evidências visuais.

Utilize os números e caminhos de registro disponíveis no repositório, sem inventar a próxima numeração.

Não alterar documentos históricos sem necessidade.

## 14. Entrega final

Apresente:

1. IDs do capítulo e da fase.
2. Resumo da narrativa.
3. Personagens e inimigos.
4. Mapa e regiões.
5. Novos assets.
6. Diferenças entre variantes.
7. Missão e condições de conclusão.
8. Integração ao catálogo.
9. Capturas reais.
10. Resultados dos testes.
11. Limitações restantes.

**Não encerrar o trabalho após a auditoria.**

O objetivo é efetivamente implementar e homologar Minas Corrompidas nesta execução.

Não fazer commit, push, reset ou clean.

## Critério de sucesso

Minas Corrompidas deve ser uma fase autoral, explorável e narrativa, com ambientação amazônica subterrânea, estética híbrida entre PNG, SVG e pixel art, duas variantes visualmente distintas, combate real e conclusão funcional.

Sua narrativa deve preparar diretamente o jogador para o Palácio do Credor.

A fase será considerada concluída somente quando funcionar no Phaser real, com evidências e validações verificáveis.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: o pedido foi recebido como arquivo de texto anexado.
- Continuação: o trabalho foi retomado no mesmo worktree em 2026-11-22 pelo agente Claude Code (modelo `deepseek-flash`), sem novo registro, conforme instrução explícita de não duplicar o registro.
- Política de commit: `pendente`, conforme solicitação explícita de não criar commit.

