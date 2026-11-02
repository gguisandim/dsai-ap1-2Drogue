# Registro de prompt: redesign visual do Igapó das Memórias

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-02-redesign-visual-igapo-das-memorias`
- Data: `2026-11-02`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-02-redesign-visual-igapo-das-memorias.md`
- Commit: `pendente`
- Execução: `Fechamento: check:gates OK; build OK (aviso não bloqueante de chunk >500 kB); npm test 87 suítes/1104 testes aprovados; git diff --check OK. Preview Phaser/World Lab Natural e Corrompida, movimento e animação/cooldown de ataque observados.`

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-02-redesign-visual-igapo-das-memorias.md`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/tests/igapoPresentations.test.ts`
- `src/tests/worldLabPresentation.test.ts`

## Prompt efetivamente recebido

```text
# Etapa — Redesign visual do Igapó das Memórias

Melhore o **visual do Igapó das Memórias** no Umbra Trail.

## Objetivo

O Igapó atual está funcional, mas ainda parece um mapa técnico/procedural.  
A prioridade desta etapa é **refazer a composição visual do mapa**, preservando a lógica existente, para que ele realmente pareça um **igapó amazônico**:

- floresta alagada;
- margens orgânicas;
- água com personalidade;
- vegetação agrupada de forma intencional;
- landmarks memoráveis;
- leitura clara para combate e navegação.

## Problema atual

O mapa atual apresenta:

- água e terra em blocos muito fragmentados;
- repetição excessiva de mini palmeiras;
- vegetação espalhada sem composição;
- pouca distinção entre áreas jogáveis e áreas de borda;
- ausência de landmarks marcantes;
- sensação geral de mapa procedural técnico, não de bioma autoral.

## Resultado esperado

O novo Igapó deve parecer:

- úmido;
- orgânico;
- amazônico;
- parcialmente submerso;
- mais memorável;
- melhor para combate e leitura visual.

## Regras obrigatórias

Preservar:

- `stageId`
- revisão
- save compatibility
- encontros
- NPCs
- saídas
- spawns
- progressão
- colisões
- transitabilidade
- sinais narrativos
- bindings físicos
- runtime de combate
- router, loader, validator e registries atuais

**Não alterar a lógica do mapa.**
A mudança deve ser prioritariamente de **desenho/composição/apresentação visual**.

Se for inevitável ajustar a distribuição visual de alguns elementos decorativos, fazer isso sem quebrar a geometria lógica e sem alterar os pontos de gameplay.

## Arquivos para inspecionar primeiro

- `AGENTS.md`
- SPECs relacionadas ao Igapó e às etapas 9.5B.1, 9.5B.2, 9.7C e 10.0
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/stages/contracts/StagePresentation.ts`
- testes visuais e de apresentação ligados ao Igapó
- World Lab / StageInspector / Preview visual

Rodar `git status --short` antes de começar.

## O que deve ser melhorado

### 1. Silhueta da água e da terra
Refazer a leitura visual macro do mapa para evitar o aspecto "quadriculado solto".

Aplicar:

- massas maiores e mais orgânicas de terra;
- canais d’água com curvas;
- braços de rio/alagado;
- ilhotas secundárias menores;
- margens mais legíveis.

Objetivo: parecer um igapó de verdade, não um mosaico de blocos.

### 2. Água com identidade
A água precisa ter mais caráter.

Implementar, se suportado pelo pipeline atual:

- variação entre água rasa e água mais funda;
- transição visual terra/água;
- pequenas plantas aquáticas;
- pedras ou troncos semi-submersos;
- cintilação sutil;
- paleta mais natural de igapó.

Evitar grandes blocos de azul chapado sem nuance.

### 3. Vegetação agrupada
Reduzir a sensação de assets jogados aleatoriamente.

Aplicar composição por clusters:

- bordas mais densas;
- centro mais legível;
- grupos de palmeiras;
- moitas;
- capim alagado;
- árvores baixas;
- raízes expostas;
- troncos;
- pequenas pedras.

Menos repetição de uma única mini-palmeira.
Mais variedade controlada.

### 4. Landmarks
Adicionar 2–4 pontos memoráveis.

Exemplos aceitáveis:

- árvore maior parcialmente alagada;
- totem/ruína;
- altar pequeno;
- tronco tombado;
- poça espiritual;
- plataforma de raiz;
- conjunto de pedras semi-submersas.

Esses elementos devem dar identidade visual ao mapa sem alterar a progressão.

### 5. Profundidade visual
Melhorar a leitura de camadas.

Aplicar:

- elementos de borda mais densos;
- foreground leve, se suportado;
- variação de escala da vegetação;
- árvores parcialmente na água;
- raízes entrando na margem;
- pequenas sombras e separação visual entre camadas.

### 6. Clareiras de combate
Os espaços de combate devem continuar legíveis.

Garantir:

- áreas centrais minimamente limpas;
- leitura clara do jogador, inimigos e projéteis;
- sem excesso de decoração onde o combate principal acontece.

## Direção visual desejada

Pense o mapa assim:

- 60% identidade vem da forma geral da água;
- 25% da vegetação agrupada;
- 15% dos landmarks e detalhes.

O resultado deve lembrar:

- floresta alagada;
- margens úmidas;
- canais estreitos;
- clareiras jogáveis;
- ambiente amazônico.

## Se o pipeline permitir
Melhorias opcionais:

- leve névoa úmida;
- partículas discretas;
- brilho em pontos espirituais;
- pequenas ondulações na água.

Mas só se isso não desviar do objetivo principal: **melhorar o desenho do mapa**.

## Entrega esperada

- visual do Igapó redesenhado;
- mesma lógica e gameplay;
- composição mais orgânica;
- água mais convincente;
- vegetação mais intencional;
- landmarks presentes;
- World Lab e preview refletindo o novo visual.

## Testes

Rodar testes dirigidos relacionados a:

- apresentação visual do Igapó
- StageLoader / StageValidator
- preview visual
- World Lab
- compatibilidade de geometria lógica
- assets e registries usados

Ao final:

- `npm test -- --runInBand`
- `npm run build`
- `npm run check:gates`
- `git diff --check`

## Homologação

Abrir no navegador e verificar de fato:

- composição geral;
- leitura da água;
- clareiras;
- landmarks;
- vegetação;
- combate;
- ausência de regressões visuais.

Se houver screenshots, registrar em `.tmp/evidence/`.

## Restrições finais

- não criar outro framework;
- não alterar combate;
- não alterar IA;
- não alterar narrativa;
- não alterar saves;
- não quebrar campanhas;
- não declarar pronto só porque os testes passaram.

O foco é **composição visual real**.

Não criar commit nem executar push.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: `pendente` antes da consolidação; não criar commit nem
  executar push conforme solicitado.
- Evidências: `.tmp/evidence/igapo-natural-refined.png`,
  `.tmp/evidence/igapo-natural-combate-refinado.png` e
  `.tmp/evidence/igapo-corrompida-contaminacao-refinada.png`.
