# Etapa 9.15 — Modernização do Menu do Umbra Trail

**Data:** 2026-11-16
**Estado:** especificação anterior à implementação
**Continuidade:** moderniza a apresentação da Etapa 9.6C sem substituir seus
modos, o catálogo da Etapa 9.6A, os serviços de campanha, as fases ou o fluxo de
execução de `GameScene`.

## Objetivo

Entregar um menu navegável por mouse e teclado que comunique a exploração da
floresta amazônica sombria e mantenha acessíveis as campanhas, fases individuais,
configurações e ferramentas já existentes.

## Decisões de arquitetura e comportamento

- `MenuScene` permanece como entrada do jogo. A camada visual usa texturas
  locais já carregadas e efeitos discretos; não adiciona nem altera assets.
- A disponibilidade de continuação é derivada dos saves existentes e do
  `GameSessionService`. Abrir o menu é somente leitura.
- Nova campanha inicia a campanha macro pelo primeiro capítulo. Se já houver
  um save válido na chave macro existente, exige confirmação e substitui-o
  somente por gravação compare-and-swap contra o estado validado que foi lido.
  Save inválido, incompatível ou alterado concorrentemente é preservado e
  produz diagnóstico. Chaves e formatos de save não mudam.
- A seleção de fases consulta o `StageCatalogService` já usado pelo
  `GameSessionService`. Agrupa registros por capítulo/região, exibe os metadados
  de título e resumo do catálogo e diferencia fases legadas, autorais,
  procedurais/experimentais e bloqueadas. Só inicia uma fase que o serviço
  consiga carregar; o caminho individual existente mantém o isolamento de
  save e progressão da campanha.
- Quando a fase carregada declara decoração de fundo e a textura correspondente
  está disponível, a seleção usa essa textura como prévia. A ausência de prévia
  não impede navegação nem execução.
- Configurações ampliam aditivamente `umbra-trail-settings`: mantêm `sound` e
  `showControls`, acrescentam volumes geral/música/efeitos e preferência de
  tela cheia. Valores antigos recebem defaults; áudio aplica os volumes por
  barramento, e tela cheia usa o Scale Manager do Phaser.
- Créditos mostram integrantes e atribuições já documentados pelo projeto,
  sem inferir colaboradores.
- A entrada continua oferecendo personagem, forja e catálogo. Configurações,
  créditos e seleção de fases têm retorno explícito ao menu sem mutar campanha.

## Apresentação e navegação

- Fundo panorâmico utiliza arte já carregada do capítulo inicial, com camadas
  de profundidade/contraste e movimento ambiental sutil.
- Hierarquia tipográfica e foco visual são consistentes com as fases autorais;
  controles evitam cartões genéricos e áreas clicáveis têm estados normal,
  hover, foco, selecionado e desabilitado.
- Layout é composto no viewport lógico Phaser 1280×720, preservando
  `Phaser.Scale.FIT`; validação visual cobre 1920×1080, 1366×768 e viewport
  menor.
- Setas movem o foco, Enter ativa a opção focada e Escape/B retorna. A seleção
  de fase também aceita mouse e teclado, pagina listas grandes e não inicia
  opções bloqueadas.

## Escopo e compatibilidade

- Reutilizar `GameSessionService`, `StageCatalogService`,
  `GameStageCompositionRoot`, `GameScene` e os saves existentes.
- Não criar catálogo/registry de fases, progresso, save ou router paralelo.
- Não alterar mapas, combate, narrativa jogável, entidades nem assets.
- Manter os modos aleatório, personalizado, clássico e individual já existentes
  acessíveis pela entrada de modos de jogo; a indisponibilidade real de uma
  composição continua sendo determinada pelo catálogo e exibida sem simular
  conteúdo.
- Manter as chaves `umbra-trail-profile`, `umbra-trail-settings`,
  `umbra-trail-run-v1` e `umbra-trail-composed-run-v1`.

## Critérios observáveis

1. A entrada mostra Continuar desabilitado sem campanha retomável e inicia a
   campanha salva apropriada quando há uma run ativa.
2. Nova campanha começa no hub do primeiro capítulo; cancelar a confirmação não
   escreve save, e confirmar uma substituição só troca um save previamente
   validado. Falha de persistência não se apresenta como sucesso.
3. Selecionar fase renderiza os registros reais do catálogo e seus resumos,
   agrupa por capítulo/região e mostra corretamente tipo e disponibilidade.
4. Fase bloqueada/incompatível não inicia; fase jogável inicia pelo serviço
   existente e não altera save nem progressão da campanha.
5. Prévia usa somente uma textura existente declarada pela apresentação da fase;
   sem textura disponível é exibido estado sem prévia.
6. Menu e seleção de fases podem ser percorridos por mouse e teclado; foco,
   hover, seleção, desabilitado e retorno funcionam sem perder progresso.
7. Volume geral, música e efeitos alteram seus respectivos barramentos; os
   valores e a preferência de tela cheia persistem na chave existente, inclusive
   quando configurações antigas não contêm os novos campos.
8. Tela cheia entra/sai pela API Phaser a partir de gesto do usuário; uma falha
   é comunicada e não corrompe a preferência salva.
9. Créditos exibem nomes reais da equipe e fontes já documentadas no projeto.
10. Menu preserva acesso a modos de jogo, criação de personagem, forja,
    configurações e catálogo.
11. A apresentação permanece legível e sem overflow nos três viewports
    especificados; transições reais para campanha, seleção, ajustes, créditos e
    retorno são verificadas no navegador.

## Testes e validações

- Testes headless do estado de continuação, confirmação/cancelamento e
  substituição segura de save, incluindo save inválido e conflito de escrita.
- Testes de seleção e disponibilidade usando o catálogo real/fixtures existentes,
  isolamento de fase individual e navegação/foco com itens desabilitados.
- Testes de migração aditiva, persistência de volumes/tela cheia e aplicação dos
  níveis de áudio.
- Testes dirigidos para as cenas e APIs alteradas.
- Homologação visual e de interação no navegador em 1920×1080, 1366×768 e
  viewport menor.
- Fechamento: `npm run check:gates`, `npm run build`,
  `npm test -- --runInBand` e `git diff --check`.
