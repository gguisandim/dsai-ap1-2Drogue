# Etapa 8.4.1: Umbra World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-28-etapa-8-4-1-umbra-world-lab`
- Data: `2026-10-28`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-28-umbra-world-lab.md`
- Commit: `pendente`
- Execução: `jest World Lab (14/14), suíte completa 713/713 em 42 suítes, tsc --noEmit, check:gates (1688 arquivos, 3652 dependências; 8 registros v1 e 8 históricos), build (698 módulos), inspeção de dist sem World Lab e git diff --check aprovados em 2026-10-28; Vite respondeu HTTP 200, automação visual de navegador indisponível`

## Arquivos modificados

- `README.md`
- `SPEC/README.md`
- `SPEC/2026-10-28-umbra-world-lab.md`
- `src/world-lab.html`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/WorldLabDataService.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSession.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/index.ts`
- `src/devtools/world-lab/fixtures/fixtureCatalog.ts`
- `src/devtools/world-lab/ui/CampaignGraphView.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/ui/svgInteraction.ts`
- `src/devtools/world-lab/main.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/tests/worldLab.test.ts`
- `src/tests/worldLabUi.test.ts`
- `prompts/16-etapa-8-4-1-umbra-world-lab.md`

## Prompt efetivamente recebido

```text
# Etapa 8.4.1 — Campaign & Stage Visualizer

Implementar um visualizador de desenvolvimento integrado ao Umbra Trail, antes de iniciar a Etapa 8.5.

## Objetivo

Criar uma ferramenta visual interativa para inspecionar o mundo procedural do jogo, incluindo:

- Grafo da campanha.
- Nós, arestas, bifurcações e convergências.
- Mapas das fases em grade 2D.
- Entradas, saídas físicas e destinos.
- Spawns, inimigos, bosses, obstáculos e NPCs.
- Diagnósticos dos geradores e validadores.

O visualizador será uma ferramenta permanente de desenvolvimento, permitindo acompanhar as próximas implementações e facilitando futuramente a criação de fases por agentes de IA.

## 1. Inspeção inicial

Antes de implementar:

1. Ler `AGENTS.md` e as instruções existentes.
2. Ler `SPEC/2026-10-28-campanha-procedural-ramificada.md`.
3. Analisar as entregas das Etapas 8.1–8.4.
4. Inspecionar `CampaignGraphGenerator`, `PhysicalExitResolver`, `CampaignExitBinder`, `LoadedStage` e os respectivos contratos.
5. Identificar a estrutura atual do frontend, o sistema de rotas e a infraestrutura de desenvolvimento.
6. Identificar quais funções headless permitem gerar uma campanha completa e quais dependem de dados ainda não disponíveis.

Não assumir que a integração completa entre os componentes já existe.

## 2. Arquitetura

Nome da ferramenta: **Umbra World Lab**.

Criar um módulo independente para inspeção, preferencialmente em `src/devtools/world-lab/`, adaptando a localização após inspecionar a arquitetura real.

Separar claramente:

- Adaptadores dos contratos existentes.
- Geração e carregamento dos dados de inspeção.
- Modelo tipado de visualização.
- Componentes gráficos.
- Estado de seleção e filtros.
- Exportação e importação de snapshots.

O módulo não deve alterar o comportamento dos algoritmos originais.

Utilizar os resultados reais dos geradores e validadores já implementados.

Não criar algoritmos paralelos de geração de campanhas ou saídas físicas.

## 3. Interface gráfica

Desenvolver uma interface inspirada em ferramentas profissionais de edição de jogos, como editores de níveis e visualizadores de grafos.

Direção visual:

- Tema escuro, com fundo azul-marinho e grafite.
- Interface técnica, limpa e funcional.
- Acentos verdes para elementos válidos.
- Amarelo para alertas.
- Vermelho para erros.
- Tipografia legível.
- Painéis redimensionáveis, se viável sem dependências excessivas.
- Animações discretas.
- Sem gradientes exagerados, glassmorphism ou decoração genérica.

### Painel A — Campaign Graph

Exibir graficamente o grafo da campanha.

Cada nó deve representar uma fase ou região.

Cada aresta deve representar uma conexão real entre nós.

Implementar:

- Zoom.
- Pan.
- Seleção de nós.
- Seleção de arestas.
- Visualização de bifurcações.
- Visualização de convergências.
- Destaque do caminho selecionado.
- Indicação dos nós de início, marcos e término.

Usar os identificadores reais dos contratos.

Um layout de grafo existente pode ser utilizado, se adequado à stack atual. Avaliar React Flow / @xyflow, caso o frontend utilize React, ou uma solução SVG leve se isso evitar complexidade.

Não adicionar React apenas para implementar o visualizador.

### Painel B — Stage Inspector

Ao selecionar um nó, exibir o mapa correspondente à fase.

A visualização deve representar o `LoadedStage` real.

Renderizar inicialmente tiles com cores ou símbolos distintos para:

- Piso transitável.
- Parede.
- Água ou hazard, quando existentes no contrato.
- Spawn.
- Inimigos.
- Bosses.
- Itens.
- NPCs.
- Âncoras.
- Saídas de seção.
- Saídas físicas da campanha.

Permitir zoom, pan, grade e visualização das coordenadas do tile.

O renderizador pode usar Canvas 2D ou uma abordagem compatível com a stack existente.

Não depender do Phaser para renderizar o inspetor.

Sobrepor marcadores de saídas físicas usando as coordenadas produzidas pelo `PhysicalExitResolver`.

Ao clicar em uma saída, destacar sua aresta correspondente no grafo.

### Painel C — Inspector

Exibir as informações reais do elemento selecionado.

Para um nó:

- ID.
- Tipo.
- Identificador da fase.
- Quantidade de entradas e saídas.
- Capacidade máxima de saídas físicas.
- Metadados disponíveis.

Para uma aresta:

- `edgeId`.
- Origem.
- Destino.
- `exitSlotId`.
- `stageExitId`.
- `physicalExitId`.
- Estado da vinculação.

Para um tile:

- Coordenadas X/Y.
- Tipo de tile.
- Transitabilidade.
- Entidades presentes.
- Âncoras existentes.

Não inventar informações que não estejam disponíveis nos contratos.

## 4. Controles de geração

Criar uma barra de controles com:

- Campo de seed.
- Botão Generate.
- Botão Regenerate.
- Seleção de nó.
- Alternância da grade.
- Alternância dos overlays.
- Exportar snapshot.
- Importar snapshot.

Reutilizar diretamente os geradores existentes.

Se algum componente ainda não permitir gerar dados integrados, apresentar explicitamente seu estado como indisponível, sem simular resultados como se fossem reais.

Criar fixtures de demonstração somente quando necessárias, identificadas como `Fixture`, nunca como geração real.

## 5. Diagnósticos

Adicionar painel de diagnósticos com:

- Código tipado.
- Severidade, quando disponível ou derivada por uma regra documentada.
- Componente de origem.
- Identificador do nó ou aresta afetada.
- Mensagem técnica.
- Informações estruturadas disponíveis.

Distinguir claramente:

- Falha do gerador.
- Falha do resolver físico.
- Falha do binder.
- Falta de dados de integração.
- Snapshot incompatível.

Ao clicar em um diagnóstico, destacar o elemento relacionado quando possível.

Não engolir erros nem converter falhas em mapas aparentemente válidos.

## 6. Snapshots determinísticos

Criar um formato versionado de snapshot para inspeção, por exemplo `umbra-world-lab/v1`.

O snapshot deve conter somente os dados necessários à visualização e à reprodução da inspeção.

Garantir:

- Ordenação canônica.
- IDs estáveis.
- Validação dos dados importados.
- Rejeição de versões incompatíveis.
- Nenhuma execução de código vindo do snapshot.
- Exportação sem dados sensíveis.

Não confundir snapshots do visualizador com o futuro formato de persistência da campanha.

## 7. Preparação para biomas

Adicionar suporte visual a metadados opcionais de apresentação, sem alterar os contratos centrais da campanha desnecessariamente.

Preparar temas para:

- Floresta das Raízes.
- Igapó dos Esquecidos.
- Jardim dos Fungos.
- Minas do Sol Morto.
- Porto das Palafitas.
- Palácio do Credor.

Inicialmente, usar somente cores, rótulos ou tiles já disponíveis.

Não implementar biomas completos ou gerar assets novos nesta etapa.

O visualizador deverá permitir que futuras implementações adicionem novos temas e tilesets sem reescrever sua arquitetura.

## 8. Acesso e isolamento

O World Lab deve ser acessível durante o desenvolvimento, preferencialmente em rota própria ou entrada separada compatível com o sistema atual.

Não incluir a ferramenta no bundle de produção.

Se houver importação estática ou compartilhamento de código, verificar o resultado real do build para impedir que dependências exclusivas de desenvolvimento sejam carregadas no jogo final.

Não modificar `GameScene.ts`.

Não introduzir referências ao visualizador dentro dos módulos headless.

O sentido das dependências deve permanecer:

`World Lab → contratos e serviços headless`

Nunca:

`CampaignGraphGenerator → World Lab`

## 9. Testes

Adicionar testes para:

1. Projeção correta dos nós e arestas.
2. Preservação de IDs.
3. Associação entre saída física e aresta.
4. Seleção sincronizada entre mapa e grafo.
5. Reordenação determinística.
6. Importação e exportação de snapshots.
7. Snapshot inválido.
8. Falhas tipadas apresentadas corretamente.
9. Ausência de dados de integração.
10. Isolamento dos módulos headless.
11. Ausência do visualizador no build de produção.
12. Renderização ou testes de interação dos componentes, conforme infraestrutura disponível.

## 10. Documentação

Criar uma SPEC própria para esta implementação, seguindo os padrões existentes.

Registrar:

- Arquitetura.
- Contratos.
- Como acessar o visualizador.
- Dados realmente suportados.
- Restrições.
- Pontos de extensão.
- Como adicionar um novo bioma.
- Como inspecionar uma nova fase.
- Limitações conhecidas.

Criar o próximo registro `umbra-prompt-record/v1`, com a numeração sequencial correta.

Não alterar artificialmente a numeração das etapas existentes.

## 11. Restrições

- Não iniciar a Etapa 8.5.
- Não implementar persistência de campanha.
- Não implementar transições Phaser.
- Não criar editor de fases completo.
- Não adicionar funcionalidades narrativas.
- Não modificar geração procedural existente apenas para satisfazer a UI.
- Não instalar bibliotecas pesadas sem justificativa.
- Não alterar arquivos sem necessidade.
- Não criar commit nem executar push.

## 12. Validação

Executar:

- Testes específicos do visualizador.
- Suíte completa.
- Typecheck.
- Architecture gates.
- Traceability gates.
- Build.
- `git diff --check`.

Verificar também que os testes existentes das Etapas 8.2, 8.3 e 8.4 continuam aprovados.

## 13. Entrega

Fornecer:

1. Arquivos criados e modificados.
2. Arquitetura implementada.
3. Como abrir o World Lab.
4. Funcionalidades realmente operacionais.
5. Funcionalidades previstas, mas ainda indisponíveis.
6. Resultado dos testes.
7. Impacto no bundle de produção.
8. Limitações.
9. Recomendações para a Etapa 8.5.

**Critério de conclusão:** deve ser possível abrir o Umbra World Lab, visualizar o grafo da campanha, selecionar uma fase, inspecionar seu mapa quando disponível, identificar as saídas físicas e verificar os vínculos gerados pela Etapa 8.4, sem modificar o comportamento do jogo.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente`; nenhum commit foi criado nesta execução.
