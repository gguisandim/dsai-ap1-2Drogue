# Redesign visual do Igapó das Memórias

**Data:** 2026-11-02  
**Estado:** substituída quanto ao escopo de redesign por
`SPEC/2026-11-02-redesign-igapo-geometria-e-variantes.md`  
**Continuidade:** complementa a Etapa 9.8.1 e substitui somente sua direção
de composição visual do Igapó. Mantém as decisões de geometria, campanha,
narrativa e runtime das SPECs anteriores.

O escopo atualizado autoriza também redesenho da geometria e define as
apresentações Natural/Corrompida na SPEC sucessora; esta versão não é mais a
fonte de escopo para a implementação.

## Objetivo

Dar ao Igapó das Memórias uma identidade visual de floresta amazônica
sazonalmente alagada, com margens legíveis, água matizada, vegetação agrupada,
landmarks e clareiras de combate. A apresentação padrão e a variante Sombrio
continuam usando o pipeline de capítulos, preview, World Lab, renderer e assets
locais já existentes.

## Limites e compatibilidade

- `stageId`, revisão do manifesto, `tileMap`, dimensões, semântica de tiles,
  transitabilidade, colisões, saídas, spawns, itens, encontros, NPCs,
  progressão, sinais narrativos e bindings físicos permanecem idênticos.
- A composição pode mudar somente por `LevelDefinition.decorations` e pela
  escolha de recursos visuais já registrados; decorações não ganham física.
- Não alterar `GameScene`, combate, IA, router, loader, validator, registries,
  saves, contratos públicos ou a geometria do mapa.
- Não adicionar ou regenerar assets. Reutilizar somente frames já licenciados
  e registrados do pacote Puny World.
- Não criar um renderer, framework visual ou seleção persistida de variante.

## Direção visual

1. Manter as massas e corredores lógicos atuais, mas remover o padrão de
   decoração independente por tile. Compor grupos determinísticos de árvores,
   palmeiras, moitas, juncos, pedras e sombras nas bordas e margens.
2. Deixar o eixo jogável, o spawn, o Vestígio, os itens, as patrulhas e a saída
   sem decoração que prejudique leitura ou combate.
3. Dar leitura distinta a águas rasas junto às margens e canais mais fundos,
   com paleta verde-azulada natural e cintilação discreta. A distinção é apenas
   visual; todo tile `water` conserva a mesma colisão e transitabilidade.
4. Incluir pelo menos três landmarks visuais formados por decorações existentes
   e sem função de gameplay, distribuídos fora das clareiras e dos pontos
   narrativos/de combate.
5. Variar escala e densidade por camada; reservar vegetação de foreground às
   bordas distantes das rotas e preservar o contraste de jogador, inimigos e
   projéteis.
6. Aplicar a mesma composição espacial às duas variantes. Sombrio pode remapear
   os mesmos IDs decorativos e preservar sua paleta própria, sem duplicar o
   mapa.

## Critérios observáveis

1. Antes/depois do `StageLoader`, a matriz lógica, dimensões, revisão,
   passabilidade, células de colisão, saídas, spawns, itens, encontro, NPC,
   narrativa e bindings permanecem iguais.
2. As decorações são determinísticas, limitadas a tiles existentes e não
   ocupam as zonas protegidas de spawn, Vestígio, itens, saída e patrulhas.
3. A composição contém clusters identificáveis de vegetação e pelo menos três
   landmarks com IDs visuais registrados; nenhuma decoração cria colisão.
4. A inspeção do renderer confirma que a borda de água recebe o recurso raso e
   o interior pode receber os recursos de canal, sem diferenças na geometria
   lógica nem nas colisões.
5. `variant.aguas.igapo-ribeirinho` e `variant.aguas.igapo-sombrio` mantêm o
   mesmo mapa e posicionamento, e resolvem todos os novos IDs visuais.
6. Testes do Igapó, loader/validator, renderer e preview/World Lab passam.
7. Homologação em navegador confirma composição geral, água, clareiras,
   landmarks, vegetação e combate, sem erros de console ou regressões visuais.
   Registrar capturas reais em `.tmp/evidence/`; testes automatizados não
   substituem esta inspeção.
8. Executar `npm run check:gates`, `npm run build`,
   `npm test -- --runInBand` e `git diff --check`.

## Validação prevista

- Testes dirigidos do módulo do Igapó, invariância geométrica e composição
  decorativa.
- Testes de resolução/validação visual, renderização de água rasa/profunda e
  compatibilidade das duas variantes.
- Testes existentes de loader, apresentação World Lab e preview visual.
- Homologação real pelo preview Phaser existente em 1280×720, incluindo a
  variante padrão e Sombrio; evidências em `.tmp/evidence/`.
- Fechamento único com gates, build, suíte completa e `git diff --check`.
