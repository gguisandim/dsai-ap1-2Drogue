# Registro de prompt: Etapa 9.8 — Fases Panorâmicas e Progressão Narrativa do Igapó

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-01-etapa-9-8-fases-panoramicas-igapo`
- Data: `2026-11-01`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-01-etapa-9-8-fases-panoramicas-igapo.md`
- Commit: `pendente`
- Execução: `pendente`

## Arquivos modificados

- `pendente`

## Prompt efetivamente recebido

```text
# Etapa 9.8 — Fases Panorâmicas e Progressão Narrativa do Igapó

Implemente a evolução das fases do Umbra Trail para permitir mapas top-down extensos, com progressão predominantemente horizontal, câmera acompanhando o jogador e transições narrativas entre ambientes naturais e corrompidos.

Utilize a arquitetura existente após a 9.7E, preservando os sistemas de capítulos, campanhas, renderização Phaser, World Lab, narrativa e persistência.

## Objetivo

Atualmente, o Igapó das Memórias possui um mapa de aproximadamente 40×25 tiles, com largura equivalente à viewport do jogo. Isso provoca a sensação de uma arena pequena e fechada.

Queremos permitir fases maiores, nas quais o jogador avance progressivamente pelo cenário, explore caminhos secundários, encontre NPCs e inimigos e alcance novos ambientes.

A primeira aplicação será a Rota das Águas:

1. **Igapó das Memórias — Natural:** introdução narrativa, exploração e descoberta da corrupção.
2. **Coração Corrompido — Sombrio:** continuação narrativa, ambiente degradado, novos encontros e confronto final da região.

Essas devem ser duas fases jogáveis distintas, e não apenas duas apresentações gráficas da mesma fase.

As variantes visuais Ribeirinho e Sombrio existentes devem continuar disponíveis como apresentações, sem serem confundidas com ramificações narrativas ou módulos independentes.

## 1. Inspeção inicial

Leia `AGENTS.md`, `docs/art-direction.md`, as SPECs vigentes de autoria modular e os seguintes arquivos, localizando seus caminhos reais:

- `igapoDasMemorias.ts`
- `igapoVisuals.ts`
- `StageModule.ts`
- `StageManifest.ts`
- `StageLoader.ts`
- `StageMapRenderer.ts`
- `GameScene.ts`
- `PhaserPreviewView.ts`
- `WorldLabApp.ts`
- Manifesto do capítulo Rota das Águas
- Contratos de encontros, narrativa e saídas físicas

Verifique especialmente:

- Dimensões dos mapas e tiles.
- Limites e acompanhamento da câmera.
- Resolução lógica do Phaser.
- Tratamento de mapas maiores que a viewport.
- Colisões e navegação.
- Compatibilidade dos manifests com fases panorâmicas.
- Problemas visuais das variantes do Igapó.

Não recrie sistemas que já existem.

## 2. Suporte a fases panorâmicas

Primeiro, crie uma prova de conceito isolada utilizando os contratos atuais.

Utilize um mapa top-down com largura aproximada de 80–120 tiles e altura proporcional às necessidades do level design.

A fase deve possuir:

- Progressão geral da esquerda para a direita.
- Câmera acompanhando o personagem.
- Áreas de exploração e desvios laterais.
- Obstáculos e vegetação.
- Pontos de encontro.
- Início e saída em posições coerentes.
- Ausência de teletransportes artificiais entre trechos contínuos.

A movimentação continua top-down, permitindo deslocamento nas quatro direções.

Não implemente gravidade, plataformas laterais ou outro sistema de movimentação.

A câmera deve mostrar apenas a região próxima ao personagem durante o gameplay e respeitar os limites do mapa.

Evite apresentar a fase inteira como uma arena cercada por bordas visíveis. O cenário deve transmitir continuidade ambiental.

Verifique desempenho antes de considerar otimizações como carregamento por chunks.

## 3. Aplicação ao Igapó das Memórias

Após validar a prova de conceito, adapte o Igapó para um percurso panorâmico.

Preserve sua identidade, NPCs, contratos narrativos e recursos existentes.

Organize a progressão em três momentos:

**Introdução**
- Entrada em uma floresta amazônica inundada.
- Apresentação do ambiente e do conflito.
- Primeiro contato narrativo com o Vestígio Submerso.
- Exploração inicial sem combate excessivo.

**Exploração**
- Percurso por vegetação, água, raízes e caminhos naturais.
- Encontros distribuídos ao longo do mapa.
- Pequenas bifurcações com possibilidade de exploração.
- Descoberta de evidências da corrupção.
- Objetivo narrativo claro para alcançar a próxima região.

**Transição**
- Sinais ambientais progressivos de degradação.
- Evento narrativo que justifique a próxima fase.
- Saída física conectada à continuação do capítulo.

Não invente uma história extensa nem substitua arbitrariamente a narrativa existente. Complete apenas o conteúdo mínimo necessário para demonstrar o fluxo.

## 4. Segunda fase — Coração Corrompido

Crie um módulo de fase independente, dentro da Rota das Águas, para representar a continuação sombria.

Essa fase deve possuir:

- `stageId` próprio.
- Manifesto válido.
- Layout independente e panorâmico quando apropriado.
- Apresentação visual sombria.
- Encontros declarativos próprios.
- Objetivo narrativo de confronto.
- Saída ou conclusão coerente.
- Compatibilidade com o registro e o loader existentes.

O ambiente deve transmitir degradação progressiva: água contaminada, vegetação danificada, iluminação reduzida e elementos de corrupção.

Não basta copiar o mapa natural e aplicar um filtro escuro.

Reutilize os assets disponíveis e respeite `docs/art-direction.md`, mantendo proporções, perspectiva top-down, ancoragem e legibilidade.

Não crie novos arquétipos de inimigos ou sistemas de combate sem necessidade.

## 5. Corrigir as variantes visuais existentes

Inspecione a renderização atual das variantes Ribeirinho e Sombrio no World Lab.

A variante Sombrio apresenta manchas quadriculadas muito escuras e problemas de legibilidade.

Identifique a causa real verificando:

- Frames dos tilesets.
- Mapeamento de terrenos.
- Camadas e overlays.
- Tint e iluminação.
- Escalas e filtragem de sprites.
- Consistência entre tiles adjacentes.

Corrija frames inválidos, aplicações inadequadas de cor ou problemas de composição encontrados.

A variante sombria deve parecer uma floresta inundada degradada, e não apenas um mosaico escurecido.

Preserve os contratos e a geometria lógica quando a mudança for somente visual.

## 6. World Lab e mapas extensos

Adapte o World Lab para inspecionar adequadamente fases panorâmicas.

Disponibilize:

- Ajustar mapa inteiro à área disponível.
- Visualização com zoom próximo ao gameplay.
- Navegação horizontal e vertical pelo cenário.
- Centralização no jogador, NPC ou saída.
- Comparação de variantes com enquadramento equivalente.
- Grade e HUD opcionais.
- Preservação da seleção e dos controles existentes.

Reutilize o Phaser real. Não implemente outro renderizador.

Na comparação, assegure que as duas apresentações usem a mesma região do mapa. Não confunda enquadramento inicial com sincronização interativa completa.

Evite grandes espaços vazios desnecessários ao redor da prévia.

## 7. Integração narrativa e campanhas

O fluxo esperado para o capítulo é:

Menu → Igapó Natural → Introdução → Exploração → Descoberta da corrupção → Saída física → Coração Corrompido → Confronto → Conclusão.

Utilize o motor existente de narrativa, eventos e progressão.

Preserve os modos individual, clássico, aleatório e personalizado.

A nova fase deve ser registrada corretamente, mas não deve ser marcada como elegível para qualquer posição de uma campanha aleatória sem metadados narrativos compatíveis.

Não altere a política de seleção das nove fases nem crie exceções no compositor para forçar a participação da nova fase.

O modo de capítulo deve permitir percorrer as duas fases na sequência adequada.

## 8. Testes e validação

Execute testes dirigidos de:

- Carregamento de mapas panorâmicos.
- Movimento da câmera além de uma viewport.
- Geometria e colisões.
- Conectividade entre spawn, objetivos e saída.
- Ausência de softlocks no percurso.
- Registro independente das duas fases.
- Encontros e conclusão narrativa.
- Transição física entre as fases.
- Persistência e retomada quando aplicáveis.
- Compatibilidade das fases legadas.
- Renderização e variantes no World Lab.

Realize homologação real no navegador, quando disponível.

Inspecione a apresentação natural, a variante sombria corrigida, a movimentação da câmera e a transição para a segunda fase.

Registre screenshots temporários em `.tmp/evidence/` conforme a política do repositório.

Não declare homologação visual sem execução e evidência.

Execute a validação completa somente no fechamento, conforme `AGENTS.md`, evitando typecheck duplicado.

## Restrições arquiteturais

- Não reescrever `GameScene`.
- Não criar outro renderer, sistema de câmera ou gerador procedural.
- Não modificar a física global para atender somente ao Igapó.
- Não duplicar fases para representar simples mudanças cosméticas.
- Não introduzir dependências diretas do Igapó no motor compartilhado.
- Não quebrar saves existentes.
- Não prejudicar os modos de campanha anteriores.
- Não aumentar desnecessariamente a quantidade de testes.
- Manter o desenvolvimento modular e econômico para agentes de IA.

Se alguma capacidade genérica estiver realmente ausente, implemente a menor extensão retrocompatível possível, acompanhada de testes.

## Rastreabilidade e entrega

Siga o procedimento de SPEC, registro de prompts e commits definido em `AGENTS.md`.

Realize a implementação em checkpoints: prova panorâmica, aplicação ao Igapó, segunda fase, integração e homologação.

Não faça push automaticamente.

Entregue um relatório compacto contendo:

- Arquivos alterados.
- Dimensões finais dos mapas.
- Resultado da câmera e da navegação.
- Diferenças entre as duas fases.
- Correções das variantes visuais.
- Integração narrativa realizada.
- Validações e evidências visuais.
- Limitações existentes.
- Estado para commit.

**Critério principal de sucesso:** o jogador deve conseguir iniciar uma fase natural, explorar um cenário que se estende além da tela, acompanhar a história, chegar organicamente à região corrompida e concluir seu confronto, sem que isso exija reestruturar o motor do Umbra Trail.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
