# Etapa 9.5B.2 — Apresentação de entidades e ambientação por fase

## Contexto e decisão

A Etapa 9.5B.1 separou a semântica do mapa de sua apresentação e introduziu
`StagePresentation`, `StageVisualRegistry` e `StageMapRenderer`. Ainda restam
escolhas fixas na `GameScene`: marcadores de NPC, sprites/tints de inimigos e
ausência de consumo declarativo de áudio, luz e névoa.

Esta etapa amplia o mesmo contrato. Não cria outro registry, framework gráfico,
sistema de entidades ou pipeline procedural.

`ChapterManifest.visualResources` passa a declarar:

- sprites baseados em `textureId` registrado e animações nomeadas;
- sons sintéticos locais com parâmetros limitados e seguros;
- perfis de áudio que associam música, ambiente e eventos existentes;
- perfis ambientais com luz ambiente e uma sobreposição simples de névoa.

`StageManifest.presentation` seleciona esses recursos por IDs estáveis através
de `npcSprites`, `enemySprites`, `audioProfileId` e `environmentId`.

```text
ChapterManifest.visualResources + StageManifest.presentation
                         |
                         v
                 StageVisualRegistry
                         |
                         v
             ResolvedStagePresentation
                         |
          +--------------+----------------+
          v              v                v
   StageMapRenderer   GameScene       SoundManager
   mapa/NPC/ambiente  adaptação       Web Audio local
```

O registry permanece headless. Capítulos não importam Phaser, entidades,
`GameScene`, Web Audio ou callbacks.

## Incremento A — entidades

`StageSpriteDefinition` referencia uma textura permitida e pode declarar
animações `idle`, `walk`, `attack` e `hurt`, tint, escala e profundidade. Não há
path, URL, função ou código executável no contrato.

O pacote legado registra sprites para o marcador narrativo e para todos os
arquétipos suportados. Manifests antigos continuam recebendo essas aparências.
Uma apresentação explícita pode sobrescrever arquétipos, mas uma referência
desconhecida falha; nunca muda o arquétipo lógico.

NPCs continuam sprites sem body físico. Posição e interação continuam vindo de
`NpcDefinition` e `WorldInteraction`. A animação idle é usada somente quando
declarada e disponível.

Inimigos continuam instâncias das classes existentes. A apresentação resolvida
fornece somente texture key, animações e tint. Construtores aceitam esses dados
sem alterar body, offsets, atributos, IA, dano, velocidade, alcance, drops ou
sinais narrativos.

Antes de criar mapa ou entidades, o adapter Phaser verifica texturas e
animações resolvidas. Recurso ausente produz erro tipado sem fallback silencioso
para uma apresentação explícita.

## Incremento B — ambientação

### Áudio

O repositório não contém trilhas licenciadas. O perfil demonstrativo usa o
gerador Web Audio já existente em `SoundManager`, ampliado por definições
sintéticas limitadas (`waveform`, frequência e volume). É um placeholder
técnico local, não uma trilha final.

`StageAudioProfileDefinition` associa recursos sonoros a música contínua,
ambiente contínuo e aos eventos existentes `stage.entered`, `npc.interacted` e
`enemy.defeated`.

O `SoundManager` mantém um perfil ativo, deduplica revisitas, interrompe o
perfil anterior antes de iniciar outro e libera nós no shutdown. Se o
`AudioContext` estiver suspenso ou `resume()` falhar, nenhum loop é duplicado e
o perfil fica pendente para nova tentativa após gesto do usuário. Som
desabilitado continua prevalecendo.

### Luz e névoa

`StageEnvironmentDefinition` contém cor/intensidade ambiente e névoa opcional
com cor, opacidade e profundidade. O `StageMapRenderer` cria overlays simples,
fixos à câmera e sem shaders. A opacidade é limitada para preservar combate;
HUD e marcadores narrativos permanecem acima da névoa. Os overlays participam
do ciclo de destruição do mapa e não alteram colisão ou visão da IA.

## Assets e carregamento

Sprites usam texture keys carregadas pela `BootScene` ou geradas por
`TextureGenerator`. O registry resolve somente IDs para essas keys. Não há
carregamento remoto, path arbitrário ou execução de metadados. Novos arquivos
futuros deverão entrar no preload local. A existência efetiva é verificada no
`TextureManager` e no `AnimationManager` do Phaser.

## Demonstração

O perfil legado preserva sprites, tints e ausência de ambiente adicional.

O perfil técnico “Igapó dos Esquecidos”, aplicado ao ID estável
`stage.aguas.igapo-das-memorias`, declara:

- sprite próprio para o Vestígio Submerso;
- variantes verde/azul para `affinity` e `applaud`;
- música/ambiente sintéticos locais e sinais de interação/derrota;
- tonalidade ambiente verde-azulada e névoa leve.

O nome e o ID persistente do stage não mudam. Os recursos reutilizam assets
existentes e não representam arte ou áudio finais.

## Procedural, saves e campanha

A apresentação é resolvida depois da geração e não participa da seed. Mapa,
arquétipos, NPCs, saídas e estado narrativo não são reescritos. Saves persistem
somente identidade e progresso; recursos são re-resolvidos do manifesto.

## World Lab

`WorldLabStageVisualPresentation` expõe, de forma aditiva, sprites de NPC e
inimigo, texture keys, animações, perfil de áudio, sons, luz, névoa, ausências e
diagnósticos. Snapshots v1 antigos continuam válidos porque os novos campos são
opcionais.

## Capabilities

Depois da integração Phaser e de testes de ciclo de vida, passam a `supported`:

- `npc.custom-sprite`;
- `enemy.visual-variant`;
- `audio.level-music`;
- `audio.level-ambience`;
- `audio.stage-event-sfx`;
- `lighting.level-ambience`;
- `effect.level-fog`.

Carregamento remoto e apresentações históricas não declarativas continuam fora
do perfil suportado.

## Critérios observáveis e testes

1. Legado resolve sprites e silêncio padrão sem mudar execução.
2. NPC usa sprite/idle declarados e preserva proximidade e diálogo.
3. Inimigo usa texture/animações/tint declarados mantendo classe, body,
   atributos, IA e `enemy.defeated`.
4. Sprite, animação, áudio ou ambiente inválido falha com diagnóstico.
5. Fase autoral e procedural resolvem apresentação sem mudar seed ou mapa.
6. Música/ambiente trocam entre perfis, revisita não duplica e autoplay
   bloqueado não cria nós parciais.
7. Névoa e luz têm camada previsível e não ganham física.
8. World Lab apresenta todos os recursos e parâmetros resolvidos.
9. Saves, revisitas, narrativa, campanha, combate, IA e legado não regridem.

Os testes cobrem registry/loader, adapters Phaser, ciclo de vida de áudio,
caracterização de inimigos, interação narrativa, authored/procedural, World Lab,
saves, revisitas e campanha macro.

## Limitações

- sprites e áudio sintético do Igapó são placeholders técnicos;
- não há shader, luz física, oclusão ou áudio espacial;
- não há download, hot reload, editor visual ou carregamento remoto;
- homologação visual/sonora só será declarada se o navegador executar o fluxo.

## Validação final

- testes direcionados dos incrementos A e B;
- `npm test -- --runInBand`;
- `npm run typecheck`;
- `npm run build`;
- `npm run check:gates`;
- `git diff --check`.
