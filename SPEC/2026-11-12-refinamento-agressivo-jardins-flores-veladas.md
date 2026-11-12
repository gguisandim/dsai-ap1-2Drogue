# Refinamento agressivo de Jardins das Flores Veladas

**Data:** 2026-11-12  
**Estado:** especificação anterior à implementação  
**Continuidade:** amplia somente a direção visual, a ambientação e a explicação
narrativa definidas em
`2026-11-12-conversao-paradiso-jardins-flores-veladas.md`. Preserva o ID
`level_08_paradiso`, o mapa lógico, a progressão, a missão, as duas ondas, a
flag persistente, a saída física e as integrações já homologadas.

## Decisão arquitetural

A fase continuará sendo um único `StageModule`. As apresentações Natural e
Corrompida serão variantes nomeadas de `StageManifest.presentationVariants`,
usando o mesmo mecanismo já exercitado pelo Igapó e pelo World Lab. A variante
Natural também será a apresentação padrão. Nenhum renderer, registro de fase ou
save paralelo será criado; a variante é seleção visual e nunca identidade
persistente de campanha.

As duas apresentações compartilham geometria, colisão, NPCs, encontro,
objetivos e saída. Elas diferem de verdade por tileset, tema, ambiente, áudio,
efeitos, sprites, paleta e substituições de decorações. `decorationOverrides`
transforma os mesmos marcos estáveis em silhuetas naturais ou corrompidas sem
duplicar o mapa. A densidade percebida muda pela área visível e composição dos
overlays, não por novos corpos de física.

## Direção de arte híbrida

- A base navegável permanece pixel art e conserva leitura clara de caminho,
  água, obstáculos, itens e saída.
- Quatro PNGs autorais gerados para o projeto formam grandes composições
  pictóricas transparentes: copa/parede vegetal e clareira focal para cada
  variante. Eles funcionam como ambiente, não como colisão.
- Os oito SVGs naturais existentes permanecem. Novos SVGs corrompidos mudam
  árvore, arco, flores, ninho, copa e feixe de luz para espinhos, raízes
  contraídas, pétalas doentes e esporos.
- Assets Puny já licenciados continuam restritos à base técnica e aos sprites.
  Nenhum pacote externo adicional será importado.
- Todo novo arquivo terá origem, dimensões, uso, hash e processo documentados.

## Variante Natural

A entrada e a Alameda das Bromélias apresentam um jardim amazônico fértil, com
copas abertas, helicônias, orquídeas, água rasa, flores mágicas e luz filtrada.
O caminho central permanece legível entre composições amplas de vegetação. No
terço final surgem pétalas fechadas e falhas de ritmo, sinais de que o problema
ainda existe sem apagar o encantamento do lugar.

## Variante Corrompida

O mesmo espaço se torna uma mutação reconhecível: folhagem contraída, raízes
angulares, flores invertidas, ninho mineralizado, poeira de esporos e sombras
mais cortantes. O núcleo na Clareira Sem Voz e na Árvore das Mil Pétalas recebe
a maior mudança de silhueta e densidade. A paleta ferrugem, violeta e verde
doente, o fog mais opaco, o áudio dissonante e os efeitos localizados impedem
que a variante seja apenas uma versão escura.

## Narrativa reforçada

Iaraí explica que uma veia espiritual ferida sob a clareira passou a devolver
o canto das raízes fora de fase. A flora começou a competir por luz e som em vez
de cooperar. Tucum identifica pólen contaminado que imita os chamados dos
polinizadores e os transforma em defesa territorial. As duas ondas são,
portanto, reação ecológica do núcleo adoecido. Ao restaurar o coro, o jogador
reconecta raiz, flor e asa; a flag e a saída existentes continuam sendo o
resultado observável.

## Regiões e leitura espacial

Os sete marcos atuais materializam cinco atos: Portal das Folhas como entrada;
Alameda e Arco como descoberta; Ninho como tensão; Clareira e Árvore como
núcleo/clímax; Passagem do Perfume como resolução. O plano e a geometria não
mudam, mas os recursos das variantes devem tornar essa progressão visual
inequívoca.

## World Lab e execução

O World Lab deve listar `variant.floresta.flores-veladas.natural` e
`variant.floresta.flores-veladas.corrupted`, permitir selecionar cada uma e
abrir a comparação lado a lado. O preview Phaser deve receber a variante pela
query já suportada. A homologação executará ambas as apresentações sobre o
mesmo estágio e comprovará NPC, missão, combate, saída e ausência de mudança de
colisão.

## Critérios observáveis

1. O registro contém um único módulo `level_08_paradiso`; variantes não criam
   novos IDs de fase nem mudam saves.
2. Natural e Corrompida resolvem para temas, tilesets, ambientes, áudio,
   efeitos e conjuntos visuais distintos, mantendo `level`, manifesto,
   encontro, NPCs, missões, eventos, colisões e saídas idênticos.
3. O World Lab lista ambas as variantes para a fase e sua comparação projeta
   recursos diferentes sem erro.
4. Os PNGs pictóricos e SVGs corrompidos carregam pelo Boot, possuem metadados
   completos, hashes válidos e são usados por decorações reais do mapa.
5. A variante Natural contém entrada exuberante, descoberta, luz e clareira
   fértil; a Corrompida substitui os mesmos marcos por composição, silhueta,
   densidade percebida, cor e efeitos adoecidos.
6. Diálogos e descrição da missão explicam a veia ferida, o pólen imitador, a
   resposta territorial e o que o coro restaura, sem alterar os IDs públicos.
7. Plano, capítulo, transitabilidade, NPCs, duas ondas, conclusão e saída
   continuam em PASS nos testes dirigidos e no playtest.
8. Homologações Phaser reais das duas variantes registram PASS ou uma
   limitação factual; capturas reais mostram entrada, descoberta/NPC, combate,
   núcleo e saída, além de comparações Natural × Corrompida e antes × depois.
9. Impacto estático é comparado. FPS, memória e GPU ficam `UNKNOWN` quando o
   runtime não fornecer medição confiável.
10. Após a última alteração relevante passam `npm run check:gates`,
    `npm run build`, `npm test -- --runInBand` e `git diff --check`.

## Limitações previstas

- A seleção de variante é explícita no loader/World Lab; não há mudança de
  apresentação em tempo real disparada por flag, porque esse contrato não
  existe e não será inventado nesta tarefa.
- PNGs são ambientação sem física. O mapa pixel art continua sendo a fonte de
  verdade de navegação.
- A exigência de commit prévio da SPEC não pode ser materializada porque o
  pedido proíbe commits; a ordem será preservada no worktree e o registro
  permanecerá com `Commit: pendente`.
