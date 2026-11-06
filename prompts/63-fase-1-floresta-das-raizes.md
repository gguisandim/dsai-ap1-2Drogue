# Registro de prompt: Fase 1 — Floresta das Raízes

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-fase-1-floresta-das-raizes`
- Data: `2026-11-05`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-fase-1-floresta-das-raizes.md`
- Commit: `pendente`
- Execução: `concluída localmente; commit e push não executados por solicitação do usuário`

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-05-fase-1-floresta-das-raizes.md`
- `prompts/63-fase-1-floresta-das-raizes.md`
- `scripts/homologate-chapter.mjs`
- `src/application/stages/GameMacroCampaignAdapter.ts`
- `src/application/stages/UmbraCampaignRouteSlice.ts`
- `src/stages/chapters/raiz-do-mundo/index.ts`
- `src/stages/chapters/raiz-do-mundo/stage-plan.json`
- `src/stages/chapters/raiz-do-mundo/visuals.ts`
- `src/stages/chapters/raiz-do-mundo/worldRootSanctuary.ts`
- `src/stages/index.ts`
- `src/tests/campaignMacroRouteBinding.test.ts`
- `src/tests/igapoDasMemorias.test.ts`
- `src/tests/macroCampaignPhaserAdapter.test.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/worldRootSanctuary.test.ts`

## Prompt efetivamente recebido

```text
# Umbra Trail — Fase 1: Floresta das Raízes

## Missão

Desenvolva integralmente a primeira fase jogável da campanha do Umbra Trail: **Floresta das Raízes**, transformando a implementação existente de Raiz do Mundo em uma experiência de exploração amazônica contínua, introdutória, narrativa e visualmente consistente.

A infraestrutura das Etapas 9.9–9.14 já está implementada. **Esta tarefa é de desenvolvimento de conteúdo e level design, não de criação de ferramentas.**

A fase deve funcionar como o começo da aventura, apresentando gradualmente o mundo, a exploração, os personagens, a narrativa e o combate.

**Não crie uma nova arena. Não mantenha o mapa atual praticamente igual. Não implemente uma região corrompida nesta fase.**

## 1. Identificação da implementação correta

Antes de editar:

1. Leia `AGENTS.md` e a documentação relevante de autoria de capítulos.
2. Inspecione `src/stages/chapters/raiz-do-mundo/`, especialmente `worldRootSanctuary.ts` e `visuals.ts`.
3. Localize `hub.floresta-das-raizes`, o mapeamento legado `verse_01_atrium` e os contratos da campanha.
4. Identifique a relação entre `stage.raiz-do-mundo.santuario`, registrado como `individual-only`, e o hub inicial.
5. Verifique os recursos de autoria, validação e homologação das Etapas 9.9–9.14.

O objetivo é **aproveitar e evoluir o conteúdo já existente**, não criar outra Floresta das Raízes independente enquanto o jogador continua entrando no mapa provisório.

Faça a integração canônica necessária ao fluxo inicial da campanha, preservando IDs e compatibilidade quando possível. Se o santuário permanecer como capítulo independente, reutilize sua composição como parte da fase real, sem duplicar conteúdos ou criar roteamentos conflitantes.

Não substitua componentes ou contratos sem verificar suas dependências.

## 2. Direção criativa e identidade

### Conceito

A Floresta das Raízes é o coração ancestral de uma floresta amazônica fantástica.

Um território vivo, antigo e misterioso, onde árvores gigantescas, cursos d'água, vegetação densa, ruínas tomadas pelas raízes e vestígios de civilizações antigas coexistem.

A floresta deve transmitir:

- Vida e antiguidade.
- Mistério e espiritualidade.
- Beleza natural amazônica.
- Sensação de um mundo maior que o jogador.
- Descoberta gradual.
- Pequenos sinais de que algo ameaça o equilíbrio da floresta.

Não transformar a fase em uma floresta medieval europeia genérica.

Utilize uma direção de fantasia amazônica com identidade própria, respeitando as referências culturais sem recorrer a caricaturas ou representações religiosas inventadas como se fossem tradições autênticas.

### Referência visual principal

O **Igapó das Memórias após a Etapa 9.8.1** é a referência estrutural de exploração panorâmica.

A árvore monumental de Raiz do Mundo, já implementada no projeto, é a referência visual de um dos principais locais da nova fase.

Preserve e reaproveite a arte original da árvore, das raízes e do santuário quando ela apresentar qualidade adequada. Não descarte assets válidos.

## 3. Redesenho completo do mapa

### Problemas que devem ser eliminados

O cenário atual apresenta:

- Mapa aproximadamente quadrado, com aparência de arena.
- Áreas de água retangulares e geometricamente artificiais.
- Terreno com repetição visível de tiles.
- Árvore monumental posicionada como centro imediato da experiência.
- Pouca distância entre o início e os principais elementos.
- Inimigos apresentados como uma onda de combate logo no começo.
- Vegetação que não estabelece suficientemente a continuidade de uma floresta.

**Não resolva esses problemas apenas aumentando as dimensões do mapa ou adicionando decorações. Redesenhe a composição espacial.**

### Nova estrutura

Crie um ambiente panorâmico, amplo e organicamente conectado.

O jogador deve caminhar pelo mundo enquanto a câmera acompanha o personagem, revelando progressivamente:

1. A entrada da floresta.
2. Trilhas tomadas por vegetação.
3. Pequenas clareiras e elementos de interesse.
4. Áreas de exploração e interação.
5. Passagens alternativas.
6. Ruínas envolvidas por raízes.
7. O santuário da grande árvore ancestral.
8. Uma passagem que permita continuar a campanha.

As regiões são partes de um mesmo mundo, não salas independentes.

### Geometria

- Utilize caminhos organicamente sinuosos.
- Distribua clareiras com formatos irregulares.
- Crie cursos d'água e margens naturais, sem piscinas retangulares.
- Empregue vegetação para orientar a exploração.
- Introduza pequenas bifurcações que permitam encontrar elementos opcionais.
- Preserve o deslocamento livre suportado pelo jogo.
- Evite corredores excessivamente estreitos.
- Evite obstáculos visualmente atravessáveis que bloqueiam o jogador.
- Mantenha a câmera e as colisões existentes.
- Não crie teletransportes para substituir caminhos físicos.

A fase precisa parecer um território florestal explorável, não um conjunto de arenas conectadas.

Utilize os templates panorâmicos da Etapa 9.11 quando forem apropriados, adaptando sua geometria ao projeto e à topologia real do cenário. Não force uma estrutura de plataforma lateral se ela não corresponder à movimentação do jogo.

## 4. Composição artística

A aparência final deve ter qualidade e coerência comparáveis à composição central da árvore ancestral.

### Terreno

Substitua a repetição excessiva de tiles por uma distribuição orgânica de:

- Solo úmido.
- Terra compactada e trilhas.
- Grama e vegetação rasteira.
- Folhas caídas.
- Raízes expostas.
- Rochas e ruínas cobertas por musgo.
- Pequenos trechos de água.

A variação não deve parecer ruído aleatório. Utilize composição intencional.

### Vegetação

Crie camadas de profundidade com:

- Árvores e troncos.
- Copas sobrepostas.
- Cipós e trepadeiras.
- Arbustos e samambaias.
- Folhagem em primeiro plano.
- Raízes grandes integradas ao terreno.
- Vegetação que se move suavemente, quando houver suporte.

Evite distribuição de árvores em grade e repetição evidente dos mesmos sprites.

### Ambiente

Reutilize os recursos de:

- Névoa.
- Vagalumes.
- Iluminação localizada.
- Partículas ambientais.
- Movimento sutil da vegetação.
- Água animada.

Use esses efeitos com moderação, sem prejudicar o FPS ou a legibilidade.

### Santuário ancestral

A árvore monumental deve ser um dos grandes momentos visuais da fase.

**O jogador não deve começar diretamente diante dela.**

Seu aparecimento precisa ser preparado pelo cenário, por pistas e pela narrativa.

Quando o personagem finalmente alcançá-la, o ambiente deve transmitir a sensação de descoberta de um lugar importante.

Integre a base da árvore ao terreno, às ruínas e às trilhas para evitar que pareça uma imagem colada sobre tiles genéricos.

Não remova seu detalhamento artístico apenas para simplificar a implementação.

### Coerência de pixel art

Preserve uma linguagem visual consistente entre terreno, árvores, monumentos, personagens e inimigos.

Corrija diferenças muito evidentes de escala, proporção e resolução aparente.

Não introduza assets de procedência ou licença desconhecida. Reutilize o catálogo existente ou produza recursos próprios seguindo suas convenções.

## 5. Estrutura narrativa da Fase 1

A primeira fase deve funcionar como prólogo jogável.

A narrativa deve ser experimentada por meio da exploração e das interações, não como um grande bloco de texto no começo.

### Ato 1 — O despertar da floresta

O personagem entra na floresta.

O cenário inicialmente é relativamente tranquilo.

O jogador aprende naturalmente a se movimentar, observar o ambiente e identificar elementos interativos.

A ambientação estabelece que há algo antigo e misterioso naquele território.

Não iniciar com uma onda obrigatória de inimigos.

### Ato 2 — Os vestígios

Conforme avança, o jogador encontra vestígios da história da floresta:

- Ruínas antigas.
- Marcas ou inscrições.
- Objetos e pontos de interesse.
- Caminhos que sugerem acontecimentos anteriores.
- Indícios discretos de desequilíbrio ambiental.

Utilize POIs, diálogos e eventos declarativos existentes.

Introduza uma motivação narrativa simples para continuar a exploração.

### Ato 3 — Os habitantes

Introduza pelo menos um personagem significativo, coerente com o universo amazônico fantástico.

Reaproveite o **Guardião da Seiva** se ele continuar adequado à narrativa.

Esse NPC deve ter função real:

- Apresentar informações sobre a floresta.
- Orientar o jogador sem revelar tudo.
- Introduzir uma missão.
- Estabelecer a importância da árvore ancestral.

O diálogo precisa ser natural, com personalidade e sem exposição excessiva.

Não se limite ao diálogo ambiental atualmente existente.

### Ato 4 — O primeiro conflito

Apresente gradualmente os inimigos e o combate.

O primeiro encontro deve ser pequeno e compreensível, ensinando as mecânicas sem sobrecarregar o jogador.

Posteriormente, outro encontro pode exigir maior atenção.

Os inimigos devem fazer sentido no ambiente e na narrativa.

Evite ondas arbitrárias de monstros que aparecem exclusivamente porque o jogador entrou na fase.

Não crie um enxame de inimigos nem transforme o prólogo em uma arena de sobrevivência.

### Ato 5 — O coração ancestral

O jogador chega à grande árvore e ao santuário.

Esse momento deve reunir exploração, narrativa e interação.

O Guardião da Seiva ou outro elemento narrativo explica parte da importância daquele lugar e indica que a floresta está conectada a regiões maiores do mundo.

A ameaça ambiental pode ser sugerida, mas **não transforme a Floresta das Raízes em uma variante corrompida neste momento**.

### Ato 6 — A continuação da jornada

Após cumprir os objetivos previstos, uma passagem é desbloqueada.

A fase deve conduzir corretamente ao próximo destino disponível da campanha, respeitando as rotas e os contratos já estabelecidos.

Para a vertical slice existente, preserve a ligação real com o **Igapó das Memórias**, sem antecipar incorretamente o Coração Corrompido.

A saída precisa ser física, alcançável e acionável pelo jogador.

## 6. Conteúdo e gameplay

A fase deve conter conteúdo real, não apenas um mapa decorativo.

Implemente utilizando as capacidades existentes:

- Spawn introdutório adequado.
- Regiões lógicas de exploração.
- NPCs com diálogos funcionais.
- Pontos de interesse distribuídos.
- Pelo menos uma missão introdutória coerente.
- Encontros de combate progressivos.
- Itens e recompensas em posições adequadas.
- Eventos e flags narrativas.
- Condições de desbloqueio.
- Saída física integrada à campanha.

O jogador deve descobrir essas atividades ao percorrer o cenário.

Não preencher todas as regiões com inimigos ou colecionáveis apenas para aumentar a quantidade de conteúdo.

A missão deve ser concluível em uma partida real, e a fase deve possuir um começo, desenvolvimento e conclusão identificáveis.

## 7. Integração à campanha

Esta é uma exigência essencial.

A nova Floresta das Raízes precisa ser o início jogável da campanha, não apenas uma demonstração isolada.

Verifique:

1. Carregamento pelo fluxo normal do menu.
2. Identificação correta do hub.
3. Entrada no mapa definitivo, e não no placeholder.
4. Inicialização apropriada do estado narrativo.
5. Liberação de rotas conforme os eventos existentes.
6. Saída física correta.
7. Transição real para a região seguinte.
8. Persistência dos estados que devem continuar.
9. Ausência de duplicação de eventos ou estágios.
10. Compatibilidade com os modos de jogo e a seleção dinâmica já implementados.

Se for necessário adaptar a situação `individual-only` de Raiz do Mundo, faça isso de maneira explícita e segura, preservando a integridade do catálogo e dos contratos.

Não transforme inadvertidamente a fase em candidata aleatória de campanhas procedurais se seu papel for obrigatoriamente o prólogo.

## 8. Uso obrigatório da infraestrutura existente

Aproveite o que já foi construído:

- Etapa 9.9: catálogo de capacidades.
- Etapa 9.10: planejamento estruturado.
- Etapa 9.11: templates panorâmicos e geometria.
- Etapa 9.12: validação de navegação e progressão.
- Etapa 9.13: homologação real no Phaser e diagnósticos no World Lab.
- Etapa 9.14: transições reais e homologação de campanha.

Crie ou atualize o `stage-plan.json` quando aplicável.

Não crie novos motores de física, renderização, roteamento, narrativa ou combate.

Não implemente agentes internos nem conecte APIs de modelos.

## 9. Homologação visual e jogável

Não considere a tarefa concluída apenas porque o build passou.

Execute o jogo real no Phaser.

### Verificações obrigatórias

**Exploração**
- O personagem começa em uma área introdutória.
- A câmera revela progressivamente o território.
- O cenário não parece uma arena quadrada.
- Caminhos e bifurcações são percorríveis.
- A árvore ancestral é descoberta durante a exploração.

**Narrativa**
- NPCs podem ser encontrados e utilizados.
- Diálogos funcionam.
- Missões são iniciadas e concluídas.
- Flags e objetivos são atualizados.

**Combate**
- Os inimigos aparecem nos momentos esperados.
- O primeiro encontro não sobrecarrega o jogador.
- Dano, morte e conclusão funcionam com as regras reais do jogo.
- O combate não bloqueia permanentemente a progressão.

**Campanha**
- A fase pode ser concluída.
- A saída é desbloqueada e acionada.
- O próximo destino carrega no Phaser.
- O jogador mantém o controle após a transição.

**Visual**
- Terreno sem padrões artificiais excessivos.
- Água e margens orgânicas.
- Vegetação com composição coerente.
- Assets em escalas compatíveis.
- Ausência de elementos cortados ou visualmente deslocados.
- Interface e câmera legíveis em 1280×720.

Não declare PASS para verificações que não foram executadas.

## 10. Evidências e testes

Gere capturas reais no Phaser mostrando, no mínimo:

1. Entrada da floresta.
2. Trilha de exploração.
3. Região com NPC ou ponto de interesse.
4. Primeiro encontro.
5. Aproximação do santuário.
6. Grande árvore ancestral.
7. Saída e transição.

Utilize `.tmp/` para evidências temporárias.

Inspecione as capturas para identificar problemas de composição antes de encerrar.

Execute os validadores pertinentes, testes dirigidos, `npm run check:gates`, `npm run build`, a suíte completa de testes e `git diff --check`.

Avalie regressões na campanha, no Igapó e no Coração Corrompido.

## 11. Critérios de aceitação

A Fase 1 somente será considerada concluída quando:

1. A Floresta das Raízes possuir um mapa definitivo e panorâmico.
2. O mapa não apresentar aparência predominante de arena quadrada.
3. A árvore ancestral estiver integrada a uma exploração maior.
4. A direção de arte representar uma floresta amazônica fantástica.
5. O jogador descobrir progressivamente lugares e personagens.
6. Existirem narrativa, diálogos e missão introdutória funcionais.
7. O combate for gradual e integrado à experiência.
8. A fase puder ser concluída com as regras normais do jogo.
9. A implementação estiver conectada ao início real da campanha.
10. A transição para o próximo destino for comprovada no Phaser.
11. As ferramentas de validação e o World Lab continuarem funcionando.
12. Não houver regressões relevantes.

Se a qualidade visual ainda for insuficiente, não apresente o trabalho como finalizado apenas porque os testes automatizados passaram.

## 12. Entrega e controle de escopo

Crie a SPEC correspondente ao desenvolvimento da Fase 1, conforme `AGENTS.md`, sem reutilizar a numeração da Etapa 9.14.

Registre o prompt no próximo arquivo disponível de `prompts/`, respeitando as convenções do projeto.

Ao final, apresente:

1. Qual fase e quais IDs foram efetivamente modificados.
2. Como foi resolvida a relação entre Raiz do Mundo e Floresta das Raízes.
3. Novo desenho geral do mapa.
4. História e progressão da fase.
5. NPCs, missões, inimigos e eventos implementados.
6. Imagens da fase em diferentes momentos.
7. Evidências de exploração e conclusão.
8. Resultado da transição de campanha.
9. Resultados de testes e build.
10. Limitações e pendências reais.

**Não execute commit nem push.**

Não descarte alterações, não reescreva histórico e não modifique branches de backup ou stashes.

Não carregue logs enormes ou históricos completos de sessões no contexto do agente. Faça leituras direcionadas para evitar outro `context_length_exceeded`.

Implemente a Fase 1 integralmente, usando o conteúdo já existente como base e priorizando o resultado jogável e a qualidade artística sobre a criação de novas abstrações.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: o pedido foi recebido por arquivo de texto anexado.
- Política de commit: o usuário proibiu commit e push; o registro permanece com
  `Commit: pendente`.

## Validações executadas

- `npm run chapter -- capabilities --json`: passou; os IDs utilizados têm
  suporte publicado.
- `npm run chapter -- plan validate raiz-do-mundo --chapters-dir src/stages/chapters --json`:
  passou, sem erros ou avisos.
- `npm test -- --runInBand src/tests/worldRootSanctuary.test.ts src/tests/campaignMacroRouteBinding.test.ts src/tests/macroCampaignPhaserAdapter.test.ts src/tests/macroCampaignPhaserIntegration.test.ts`:
  passou, 4 suítes e 32 testes.
- `npm test -- --runInBand src/tests/igapoDasMemorias.test.ts`: passou, 1 suíte
  e 14 testes.
- `node --check scripts/homologate-chapter.mjs`: passou.
- `npm run chapter -- homologate --stage stage.raiz-do-mundo.santuario --json`:
  passou em runtime Phaser; missão, encontro, câmera, saída e flag confirmados.
- `npm run chapter -- homologate --campaign --macro-run campaign.floresta.validation-5 --macro-seed forest-2026-11-05 --json`:
  passou em runtime Phaser; Floresta → Igapó → Coração Corrompido confirmada.
- `npm run chapter -- playtest raiz-do-mundo --chapters-dir src/stages/chapters --json`:
  todos os checks concretos da fase passaram, mas o resultado agregado foi
  `FAIL` porque o comando registra apenas o capítulo selecionado e não carrega
  a dependência externa `chapter.aguas` nem seu estágio de destino.
- `npm run check:gates`: passou; gates de arquitetura e rastreabilidade OK.
- `npm run build`: passou; typecheck e build Vite concluídos, 772 módulos.
- `npm test -- --runInBand`: passou, 92 suítes e 1167 testes.

