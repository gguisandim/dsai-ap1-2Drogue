# Registro de prompt: refinamento artístico da Floresta das Raízes

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-06-refinamento-artistico-raizes`
- Data: `2026-11-06`
- Agente: `Copilot SDK em VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-06-refinamento-artistico-floresta-das-raizes.md`
- Commit: `pendente`
- Execução: `npm run check:gates` OK; `npm run build` OK (aviso de bundle acima de 500 kB); `npm test -- --runInBand` OK (92 suítes, 1168 testes); teste dirigido OK (9/9); validação do plano OK; homologação da campanha OK (27 PASS, 0 FAIL, 1 UNKNOWN não bloqueante); `git diff --check` OK.

## Arquivos modificados

- `SPEC/2026-11-06-refinamento-artistico-floresta-das-raizes.md`
- `SPEC/README.md`
- `src/assets/world-root/README.md`
- `src/assets/world-root/world-root-ground.svg`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/presentation/assets/bootWorldRootAssets.ts`
- `src/presentation/assets/worldRootAssetCatalog.ts`
- `src/stages/chapters/raiz-do-mundo/visuals.ts`
- `src/stages/chapters/raiz-do-mundo/worldRootSanctuary.ts`
- `src/tests/worldRootSanctuary.test.ts`
- `scripts/homologate-chapter.mjs`
- `docs/evidence/raiz-do-mundo-2026-11-06/README.md`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-aproximacao.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-entrada.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-npc.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-saida.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-santuario.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/antes-trilha-e-primeiro-combate.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-aproximacao.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-entrada.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-npc.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-primeiro-combate.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-saida.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-santuario.png`
- `docs/evidence/raiz-do-mundo-2026-11-06/depois-trilha.png`
- `prompts/64-refinamento-artistico-floresta-das-raizes.md`

## Prompt efetivamente recebido

```text
<current_datetime>2026-11-06T00:50:07.969-03:00</current_datetime>

# Umbra Trail — Refinamento Artístico da Fase 1: Floresta das Raízes

## Objetivo
Refinar profundamente a **direção de arte, composição ambiental e acabamento visual** da **Fase 1 — Floresta das Raízes**, já implementada no projeto, preservando a jogabilidade, a progressão narrativa e a integração com a campanha.

A fase já funciona em termos de:

- exploração,
- missão,
- NPC,
- combate,
- saída,
- transição para o Igapó,
- validação e homologação.
**O problema agora é visual/artístico.**

## Missão desta tarefa
Transformar a Floresta das Raízes em um ambiente **visualmente convincente, coeso e memorável**, mantendo a experiência de exploração panorâmica contínua já decidida para o projeto.

## Regras gerais

1. **Não refaça a infraestrutura** das Etapas 9.9–9.14.
2. **Não mude a lógica central da campanha** sem necessidade real.
3. **Não quebre a fase jogável já implementada.**
4. **Não transforme a fase em arena/sala.**
5. **Não reduza a árvore monumental** nem descarte o santuário, a não ser que seja necessário para integrá-los melhor ao cenário.
6. O foco principal é **arte, composição ambiental, legibilidade espacial e coerência visual**.
7. **Não execute commit nem push.**

## Liberdade criativa permitida
Você **não está limitado aos pacotes 2D previamente usados** no projeto.

Pode:

- reaproveitar assets existentes;
- adaptar assets já presentes;
- combinar bibliotecas visuais diferentes;
- criar composições próprias;
- gerar novos assets auxiliares compatíveis com o estilo do jogo;
- substituir elementos visuais fracos por elementos melhores;
- redesenhar trechos do terreno, vegetação e água;
- criar overlays, detalhes de chão, ruínas, raízes, sombras e elementos de profundidade.

### Restrições dessa liberdade

- Mantenha a estética em **pixel art coerente** com o restante do jogo.
- Evite misturar estilos incompatíveis.
- Não use conteúdo de procedência duvidosa.
- Documente a origem/licença dos assets novos ou adaptados, quando aplicável.
- Se gerar ou introduzir novos recursos, integre-os ao projeto de forma limpa e rastreável.

## Contexto artístico da fase
A Floresta das Raízes deve parecer:

- uma **floresta amazônica fantástica**;
- antiga, viva e misteriosa;
- densa, úmida e orgânica;
- marcada por raízes gigantes, ruínas tomadas pela mata e cursos d’água naturais;
- um lugar onde a árvore ancestral é o ápice da descoberta.
**Ela não deve parecer**:

- um campo gramado com árvores nas bordas;
- um tabuleiro quadriculado;
- uma arena com “cenário bonito” colado no centro;
- um mapa protótipo com decoração espalhada.

## Problemas visuais que precisam ser corrigidos

### 1. Solo/terreno
O chão atual ainda apresenta forte leitura de grade.

Corrija isso com:

- mistura orgânica de terra, musgo, grama, folhas, raízes e trilhas;
- transições menos repetitivas;
- variação de textura em áreas amplas;
- trilhas mais naturais e menos “blocos retos”;
- pequenas marcas do ambiente: pedras, folhas, galhos, umidade, vegetação rasteira.

### 2. Vegetação
A vegetação está muito rasa e periférica.

Melhore com:

- agrupamentos naturais de árvores;
- variação de escala e forma;
- arbustos, samambaias, cipós, trepadeiras e raízes aparentes;
- sobreposição de elementos;
- composição que crie profundidade;
- clareiras mais orgânicas;
- vegetação guiando o olhar e o percurso.

### 3. Água
A água ainda parece composta de formas artificiais.

Refine:

- margens irregulares;
- integração com lama, pedras, vegetação aquática e transições de terreno;
- leitura mais natural de igarapé/curso d’água;
- menos aparência de “bloco azul”.

### 4. Profundidade e atmosfera
A fase precisa de mais sensação de mundo vivo.

Adicione ou refine:

- sombra de copas;
- elementos em primeiro plano;
- variação de densidade entre áreas;
- microdetalhes ambientais;
- ruínas parcialmente encobertas;
- raízes avançando sobre o cenário;
- iluminação ambiental sutil;
- partículas leves, quando fizer sentido e sem comprometer performance.

### 5. Integração da árvore/santuário
A árvore está boa, mas ainda parece mais rica que o resto do mapa.

O objetivo é fazer o restante da fase “subir de nível”, e também integrar melhor o santuário à exploração:

- criar aproximação gradual;
- aumentar densidade visual à medida que o jogador se aproxima;
- conectar ruínas, raízes, terreno e vegetação ao santuário;
- tornar esse local o ápice visual da fase.

## O que preservar
Preserve, salvo necessidade real de ajuste:

- a estrutura narrativa da fase;
- o Guardião da Seiva;
- a missão `mission.raiz-do-mundo.ouvir-raizes`;
- a saída `exit.raiz-do-mundo.to-igapo`;
- a integração com `hub.floresta-das-raizes`;
- a transição confirmada para `stage.aguas.igapo-das-memorias`;
- a exploração panorâmica contínua;
- a câmera existente;
- a jogabilidade e o fluxo já homologado.

## O que revisar no código/projeto
Antes de editar:

1. Leia `AGENTS.md`.
2. Inspecione a implementação atual da Fase 1.
3. Revise:

- `src/stages/chapters/raiz-do-mundo/worldRootSanctuary.ts`
- `src/stages/chapters/raiz-do-mundo/visuals.ts`
- `src/stages/chapters/raiz-do-mundo/stage-plan.json`
- assets e composição visual atualmente usados
- evidências e screenshots da fase
4. Identifique o que pode ser preservado e o que precisa ser artisticamente refeito.

## Escopo técnico desejado
Você pode modificar:

- composição do mapa;
- visual do terreno;
- posicionamento de vegetação, ruínas e obstáculos;
- ambientação;
- assets usados pela fase;
- camada visual;
- elementos decorativos;
- organização dos POIs no espaço, se isso melhorar a composição, desde que preserve a progressão.
Evite:

- alterar sistemas centrais;
- refatorar sem necessidade;
- mexer na arquitetura das etapas anteriores;
- abrir nova frente de infraestrutura.

## Homologação obrigatória
Não finalize só com build/testes.

Faça validação real da fase e gere evidências de:

1. entrada da floresta;
2. trilha principal;
3. ponto de interesse / NPC;
4. primeiro combate;
5. transição visual de aproximação ao santuário;
6. santuário / árvore ancestral;
7. saída para o Igapó.
Verifique:

- se a fase continua jogável;
- se a exploração continua clara;
- se o cenário está visualmente mais rico;
- se a árvore agora parece fazer parte do mesmo mundo;
- se o solo deixou de parecer tabuleiro;
- se a vegetação ficou mais orgânica;
- se a água ficou menos artificial.

## Critérios de aceitação
A tarefa só estará concluída quando:

1. A Floresta das Raízes estiver **visual e artisticamente superior** ao estado atual.
2. O terreno não apresentar mais aparência predominante de grade/xadrez.
3. A vegetação parecer parte de uma floresta amazônica fantástica, e não apenas bordas de mapa.
4. A água e as margens tiverem aparência mais orgânica.
5. O santuário e a árvore ancestral estiverem integrados ao resto do cenário.
6. A fase mantiver a exploração panorâmica contínua.
7. A jogabilidade, missão, NPC, combate e transição continuarem funcionando.
8. A campanha não sofrer regressões.
9. Os assets adicionados/substituídos tiverem origem adequada e documentação mínima.
10. Houver evidência visual clara de melhora “antes/depois”.

## Entrega esperada
Ao final, apresente:

1. Resumo do que foi alterado.
2. Arquivos modificados/criados.
3. Quais assets foram preservados, substituídos ou adicionados.
4. Como a limitação dos pacotes 2D anteriores foi superada.
5. Screenshots comparativos relevantes.
6. Resultado de testes, build, gates e homologação.
7. Limitações remanescentes.
8. Recomendações objetivas para o próximo refinamento artístico, se ainda houver.

## Restrições finais

- Não execute commit.
- Não execute push.
- Não faça reset, clean ou operações destrutivas.
- Não carregue logs enormes desnecessariamente para evitar novo estouro de contexto.
- Faça leituras direcionadas.
- Preserve tudo que já está funcional, melhorando prioritariamente a apresentação visual.
Implemente a melhoria artística integralmente, com foco em resultado jogável e qualidade visual real, e não apenas em conformidade técnica.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
