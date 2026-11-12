# Registro de prompt: refinamento agressivo de Jardins das Flores Veladas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-12-refinamento-agressivo-jardins-flores-veladas`
- Data: `2026-11-12`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-12-refinamento-agressivo-jardins-flores-veladas.md`
- Commit: `pendente`
- Execução: geração de quatro PNGs com a ferramenta integrada OpenAI ImageGen (OK); `npm run chapter -- plan validate flores-veladas --chapters-dir src/stages/chapters --json` (PASS); `npm run chapter -- validate flores-veladas --chapters-dir src/stages/chapters` (PASS, 1 warning esperado de milestone narrativo); `npm run chapter -- inspect flores-veladas --chapters-dir src/stages/chapters --json` (PASS); `npm run chapter -- preview flores-veladas --chapters-dir src/stages/chapters` (OK); `npm run chapter -- playtest flores-veladas --chapters-dir src/stages/chapters --json` (PASS); homologações Phaser Natural e Corrompida (PASS); testes dirigidos (PASS); `scripts/auditar-segredos-prompts.ps1 -Path prompts/69-refinamento-agressivo-jardins-flores-veladas.md` (PASS); `npm run check:gates` (PASS: 929 arquivos, 3.393 dependências, 65 registros v1); `npm run build` (PASS: 814 módulos; aviso não bloqueante de chunk acima de 500 kB); `npm test -- --runInBand` (PASS: 95 suítes, 1.185 testes); `git diff --check` (PASS, somente avisos de conversão LF/CRLF).

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-12-refinamento-agressivo-jardins-flores-veladas.md`
- `docs/evidence/flores-veladas-variantes-2026-11-12/README.md`
- `docs/evidence/flores-veladas-variantes-2026-11-12/natural-01-entrada.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/natural-02-dialogo.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/natural-03-combate.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/natural-04-saida.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/corrupted-01-entrada.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/corrupted-02-dialogo.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/corrupted-03-combate.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/corrupted-04-saida.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/comparacao-natural-corrompida-entrada.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/comparacao-natural-corrompida-nucleo.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/comparacao-antes-depois.png`
- `docs/evidence/flores-veladas-variantes-2026-11-12/homologacao-natural.json`
- `docs/evidence/flores-veladas-variantes-2026-11-12/homologacao-corrupted.json`
- `prompts/69-refinamento-agressivo-jardins-flores-veladas.md`
- `src/assets/flores/README.md`
- `src/assets/flores/flores-natural-canopy.png`
- `src/assets/flores/flores-natural-heart-bloom.png`
- `src/assets/flores/flores-corrupted-canopy.png`
- `src/assets/flores/flores-corrupted-heart-core.png`
- `src/assets/flores/flores-corrupted-tree.svg`
- `src/assets/flores/flores-corrupted-bromeliad.svg`
- `src/assets/flores/flores-corrupted-thorn-arch.svg`
- `src/assets/flores/flores-corrupted-orchid-veil.svg`
- `src/assets/flores/flores-corrupted-nest.svg`
- `src/assets/flores/flores-corrupted-bough.svg`
- `src/assets/flores/flores-corrupted-spore-column.svg`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/presentation/assets/floresAssetCatalog.ts`
- `src/stages/chapters/flores-veladas/index.ts`
- `src/stages/chapters/flores-veladas/stage-plan.json`
- `src/stages/chapters/flores-veladas/veiledGardensMap.ts`
- `src/stages/chapters/flores-veladas/veiledGardensStage.ts`
- `src/stages/chapters/flores-veladas/visuals.ts`
- `src/stages/index.ts`
- `src/tests/veiledGardens.test.ts`
- `src/tests/veiledGardensPresentations.test.ts`
- `src/tests/worldLabPresentation.test.ts`

## Prompt efetivamente recebido

```text
Prompt — versão agressiva
Umbra Trail — Refinamento agressivo de Jardins das Flores Veladas com variante Natural e variante Corrompida
Trabalhe sobre a fase autoral Jardins das Flores Veladas, recentemente convertida a partir de Paradiso Gardens, preservando o ID compatível level_08_paradiso e sua integração atual.
Objetivo
Levar a fase para um nível visual e atmosférico significativamente mais ambicioso, implementando duas variantes reais de apresentação:
- Variante Natural
- Variante Corrompida
A fase deve usar uma direção de arte híbrida e intencional, combinando:
- pixel art para base jogável e leitura de gameplay;
- PNG para ambientação rica e pictórica;
- SVG para elementos autorais e decorativos;
- assets próprios e, se necessário, assets de outras bibliotecas públicas compatíveis, desde que a procedência e licença sejam documentadas.
A meta é chegar a uma estética semelhante em ambição à da Floresta das Raízes, onde o cenário não parece apenas um tilemap, mas um ambiente ilustrado e jogável.
1. Princípio central
Não tratar a fase como “um mapa pixel art com enfeites”.

Tratar a fase como um cenário autoral ilustrado, cuja navegação continua 2D top-down em Phaser, mas cuja apresentação visual pode ser muito mais rica que a base do tileset.

A base jogável continua em pixel art, porém a ambientação deve incorporar:
- fundos e sobreposições em PNG;
- elementos grandes em SVG;
- camadas de vegetação, sombras, raízes, flores e luz;
- contraste forte entre a versão saudável e a versão corrompida.
A mistura deve parecer deliberada e harmoniosa, não uma colagem acidental.
2. Variantes obrigatórias
Implementar duas variantes explícitas e funcionais da fase:
Variante Natural
Deve transmitir:
- floresta/jardim vivo;
- vegetação exuberante;
- flores mágicas;
- luz filtrada;
- sensação de mistério, encantamento e fertilidade;
- equilíbrio ecológico ainda presente, mesmo com sinais de problema.
Variante Corrompida
Deve transmitir:
- distorção do mesmo espaço;
- perda do equilíbrio da flora;
- deformação vegetal;
- cor, luz e atmosfera mais opressivas;
- clareiras adoecidas;
- flores ou árvores alteradas por corrupção;
- sensação de contaminação espiritual ou ecológica.
A variante corrompida não deve ser apenas uma versão mais escura.
Ela deve ter mudanças reais em:
- composição;
- silhueta dos elementos;
- densidade da vegetação;
- cor;
- efeitos;
- leitura emocional do espaço.
3. Direção de arte híbrida
É permitido e incentivado combinar:
Pixel art
Para:
- chão jogável;
- colisão;
- leitura dos caminhos;
- itens e elementos de gameplay que exigem clareza.
PNG
Para:
- fundos ricos;
- copas;
- floresta densa;
- paredes vegetais;
- ambientes pintados;
- clareiras;
- ambientação mais pictórica;
- sobreposições de profundidade.
SVG
Para:
- flores mágicas;
- árvores especiais;
- cipós;
- raízes;
- estruturas orgânicas;
- portais;
- marcos espirituais;
- sinais de corrupção;
- silhuetas decorativas.
Bibliotecas externas
Pode usar recursos de outras bibliotecas públicas/gratuitas se forem compatíveis com o projeto, desde que:
- a licença permita;
- a origem seja documentada;
- os assets sejam coerentes com a perspectiva;
- o conjunto final permaneça visualmente consistente.
Se usar assets externos:
- documentar fonte;
- documentar licença;
- documentar adaptação;
- não importar pacotes desnecessários em massa.
4. Referência de ambição visual
Use como referência interna de ambição a linguagem já alcançada na Floresta das Raízes:
- sensação de cenário ilustrado;
- ambientação exuberante;
- mistura entre base jogável e composição de arte;
- presença de elementos grandes e memoráveis;
- leitura clara do caminho principal;
- profundidade visual por camadas.
A nova fase não deve copiar a Floresta das Raízes, mas sim alcançar um nível semelhante de riqueza visual.
5. Estrutura espacial da fase
Refinar a fase para que ela tenha um fluxo visual e narrativo mais forte.

A organização deve conter:
1. Entrada natural
   - recepção visual forte;
   - flora viva;
   - introdução da identidade do jardim.
2. Região de descoberta
   - flores e marcos especiais;
   - primeiros diálogos e indícios do problema.
3. Região de tensão
   - sinais de desequilíbrio;
   - mudança gradual de atmosfera.
4. Núcleo corrompido
   - subárea ou região crítica;
   - clímax visual e de combate;
   - versão claramente distinta do restante do mapa.
5. Resolução e saída
   - feedback narrativo e visual da missão;
   - liberação do caminho/portal.
Pode manter a fase única, mas a região corrompida deve ser forte o suficiente para quase parecer um “segundo estado” do lugar.
6. Gameplay e narrativa
Preservar e reforçar:
- Iaraí;
- Tucum;
- missão principal;
- eventos;
- combate em duas ondas;
- flag persistente;
- saída física;
- integração com catálogo e fluxo clássico.
Expandir a narrativa para justificar melhor:
- por que a flora está desequilibrada;
- por que existe uma região corrompida;
- qual é a diferença entre o jardim saudável e o contaminado;
- o que o jogador resolve ou restaura.
O combate deve parecer consequência do ambiente, não encontro aleatório.
7. Implementação visual esperada
Na Variante Natural
Adicionar ou reforçar:
- flores grandes e mágicas;
- árvores de copa marcante;
- luz filtrada;
- folhagem de primeiro plano;
- marcas de trilha;
- pequenos trechos úmidos;
- vegetação exuberante;
- identidade amazônica e fantástica.
Na Variante Corrompida
Adicionar ou reforçar:
- flora torta, retorcida ou adoecida;
- pétalas caídas, espinhos ou fungos;
- brilho estranho;
- mudança de paleta;
- névoa, partículas ou poeira contaminada;
- sombras mais agressivas;
- deformação da mesma flora da versão natural.
A corrupção deve parecer uma mutação daquele jardim, não um cenário totalmente desconectado.
8. Regras técnicas
- Não reescrever o motor.
- Não criar renderer paralelo.
- Não alterar GameScene sem necessidade genérica comprovada.
- Não quebrar World Lab, preview, catálogo ou homologação.
- Não duplicar a fase no StageRegistry sem necessidade.
- Preservar compatibilidade com a estrutura modular existente.
- Se criar novos assets, registrar procedência, uso e organização.
Se necessário, ampliar o sistema de apresentação para suportar melhor:
- PNGs de ambientação;
- SVGs autorais;
- duas variantes reais;
- overlays por camada;
- distinção natural/corrompida.
Mas faça isso de forma compatível com a arquitetura já existente.
9. World Lab e visualização
A nova implementação deve poder ser inspecionada no World Lab.

Garantir que seja possível:
- abrir a fase;
- alternar ou comparar as variantes Natural e Corrompida;
- inspecionar os principais elementos;
- visualizar claramente as diferenças de apresentação.
Se necessário, adaptar os metadados da apresentação da fase para suportar melhor essa comparação.
10. Validação obrigatória
Executar:
- validação estrutural do capítulo;
- inspeção e preview;
- playtest da fase;
- homologação real no Phaser;
- verificação de NPCs, missão, combate e saída;
- comparação visual entre Natural e Corrompida;
- checagem de legibilidade e transitabilidade.
Executar também:
- npm run check:gates
- npm run build
- npm test -- --runInBand
- git diff --check
Se houver impacto perceptível de desempenho, registrar.
Se não houver medição confiável de FPS/GPU, marcar como UNKNOWN, não inventar.
11. Evidências obrigatórias
Gerar capturas reais de:
Variante Natural
- entrada;
- área de descoberta;
- diálogo/NPC;
- combate;
- região mais exuberante.
Variante Corrompida
- transição para a corrupção;
- núcleo corrompido;
- combate/clímax;
- conclusão ou saída.
Também gerar comparação visual:
- Natural x Corrompida
- antes x depois
12. Entrega
Entregar:
- arquivos alterados;
- resumo da nova direção de arte;
- explicação de como foi usada a mistura de pixel art + PNG + SVG;
- lista dos novos assets e bibliotecas utilizadas;
- descrição das diferenças entre as variantes;
- resultado da homologação;
- evidências visuais;
- limitações restantes.
Não executar commit, push, reset ou clean.
Critério de sucesso
Jardins das Flores Veladas deve se tornar uma fase visualmente marcante e autoral, com:
- Variante Natural exuberante e mística;
- Variante Corrompida deformada e opressiva;
- mistura coesa entre pixel art, PNG e SVG;
- ambientação comparável em ambição à Floresta das Raízes;
- jogabilidade, narrativa e integração preservadas.
Não considerar a tarefa concluída apenas porque os testes passam.
A qualidade da transformação deve ser visível em execução real.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
