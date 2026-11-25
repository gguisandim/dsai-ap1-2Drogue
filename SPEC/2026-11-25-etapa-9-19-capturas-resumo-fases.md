# Padronização das imagens de resumo do seletor de fases — Etapa 9.19

**Data:** 2026-11-25  
**Estado:** especificação anterior à implementação.

## Contexto e diagnóstico

O seletor atual escolhe uma decoração de fundo e, na ausência dela, um tile de
piso. Isso não é uma captura do cenário montado pelo jogo e pode reduzir uma
fase a uma textura isolada. A cena de jogo já utiliza `StageMapRenderer` para
desenhar tiles, decorações e efeitos a partir do mapa e da apresentação
resolvidos pelo catálogo.

O catálogo consultado nesta etapa contém 19 fases carregáveis e oito variantes
de apresentação declaradas em quatro fases. A cena do seletor não oferece
escolha de variante; seu resumo deve corresponder à apresentação padrão da
fase, sem alterar o layout ou introduzir navegação nova. As capturas das
variantes também devem ser produzidas e associadas aos respectivos IDs para
uso consistente e futuras atualizações.

## Objetivo

Substituir as prévias compostas por textura por imagens PNG obtidas do próprio
renderizador Phaser, cobrindo cada fase carregável e cada variante de
apresentação declarada. As capturas devem mostrar somente o cenário: tiles,
decorações e efeitos ambientais do mapa, sem personagens, NPCs, adversários,
chefes, HUD, diálogos ou controles.

## Escopo e limites

1. Criar uma rota/ferramenta de desenvolvimento reutilizável que carregue uma
   fase pelo mesmo catálogo e loader usados pelo jogo e chame
   `StageMapRenderer`, sem criar atores ou interface de gameplay.
2. Gerar uma captura PNG com proporção 460×250 para a apresentação padrão de
   cada fase carregável e para cada ID de variante declarado.
3. Associar explicitamente cada arquivo ao `stageId` e, quando aplicável, ao
   `presentationVariantId`. O seletor usa a captura padrão do `stageId`.
4. Carregar as capturas na build Vite e resolver a imagem do cartão por
   `stageId` e variante, sem fallback para textura de tile, panorama ilustrativo
   ou imagem conceitual. Um recurso ausente deve resultar em prévia
   indisponível e diagnóstico de teste, nunca em fallback enganoso.
5. Manter as capturas sob os assets do projeto e incluir verificação de
   dimensões, proporção e cobertura do catálogo.

Não entram no escopo: alterações aos cenários jogáveis, mapas, colisões,
personagens, inimigos, mecânicas, progressão, saves, campanha ou layout do
seletor. Variantes planejadas sem apresentação carregável não devem receber
imagens sintéticas; a ferramenta deve falhar explicitamente para alvos que não
possam ser renderizados.

## Critérios de aceitação

1. Cada fase atualmente carregável possui uma imagem própria, registrada por
   ID estável e exibida nas páginas correspondentes do seletor.
2. Cada apresentação padrão e cada variante declarada e carregável possui uma
   captura distinta no mapeamento `stageId`/`presentationVariantId`.
3. A ferramenta captura a saída de `StageMapRenderer` em Phaser e não desenha
   entidades nem elementos de interface. Não são usados tiles isolados,
   capturas conceituais, imagens geradas artificialmente ou panoramas para
   substituir a cena renderizada.
4. Todos os PNGs têm 460×250 pixels; o teste rejeita arquivos ausentes,
   dimensões diferentes e caminhos sem mapeamento explícito.
5. O seletor preserva paginação, geometria e controles atuais; nenhuma imagem
   é ampliada ou distorcida para preencher o cartão.
6. Mapas, dados e comportamento jogável permanecem inalterados.
7. A homologação automatizada não equivale à aprovação visual humana; esta
   permanece pendente até avaliação do usuário.

## Validação

- Testes dirigidos de mapeamento explícito, cobertura de fases/variantes e
  ausência de fallback para texturas de tile.
- Execução da ferramenta de captura sobre todo o catálogo carregável e
  verificação dos PNGs gerados, dimensões, formato e proporção.
- Verificação do seletor em todas as páginas, com a imagem de cada fase.
- `npm test -- --runInBand`
- `npm run build`
- `npm run check:gates`
- `git diff --check`
- `scripts/auditar-segredos-prompts.ps1`

## Rastreabilidade

O registro integral do prompt da etapa está em
`prompts/79-etapa-9-19-capturas-reais-seletor.md`. SPEC e registro são
documentados em commit anterior à implementação. A implementação e os assets
gerados devem ser registrados em commit separado.
