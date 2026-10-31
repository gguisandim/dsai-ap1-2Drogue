# Etapa 9.6E.1 — Desacoplamento do motor e encontros declarativos

**Data:** 2026-10-31  
**Estado:** especificação anterior à implementação  
**Continuidade:** sucede a Etapa 9.6D; não antecipa topologias flexíveis (9.6E.2) nem revisão de persistência (9.6E.3).

## Objetivo

Permitir que um `StageModule` declare a configuração de seus encontros sem
alterar `GameScene`, reutilizando o carregamento, a validação, os arquétipos e o
ciclo de ondas existentes. A mudança desloca a origem dos dados, sem criar novo
diretor de encontros, IA, combate, gerador ou roteador.

## Auditoria de acoplamento

| Ocorrência atual | Classificação | Decisão |
|---|---|---|
| Ciclo de vida, grupos Phaser, atualização e colisões | regra legítima do motor / integração Phaser | permanece na cena |
| Conversão de arquétipo lógico em `Enemy`, `RangedEnemy` ou `BossEnemy` | integração Phaser necessária | permanece na cena e aceita somente os seis arquétipos públicos |
| Ordenação de inimigos, blocos de oito e criação de ondas | configuração específica de conteúdo | passa ao resolvedor de encontros de stage |
| Posições de miniboss escolhidas pelo índice da fase | acoplamento desnecessário | sai da cena e fica isolado no fallback legado |
| Atraso fixo de 1.200 ms entre ondas | configuração específica de conteúdo | torna-se dado resolvido; fallback mantém 1.200 ms |
| Início após HUD e conclusão quando não restam inimigos | regra legítima do motor | permanece na cena, representada pelos únicos modos hoje suportados |
| Emissão de `enemy.defeated`, `encounter.completed` e eventos de wave | comunicação com gameplay/narrativa | permanece, usando IDs declarados e estáveis |
| `legacy.verse` nos defaults de run e sessão narrativa | compatibilidade temporária | permanece; não é configuração de encontro |
| `legacy.verse` no adaptador legado | identificador de conteúdo legado | permanece explícito |
| dependência da Rota das Águas em `legacy.verse` | dependência técnica temporária real | permanece enquanto as saídas do Igapó apontarem para o hub legado |

Não há regra de seleção de campanha, bioma ou Igapó dentro do executor de
encontros. O acoplamento removível está concentrado na montagem das ondas.

## Contrato mínimo

`StageModule.encounter` é opcional para compatibilidade e contém:

- ID estável do encontro;
- início `stage-ready` e conclusão `all-waves-defeated`, únicos modos já
  integrados ao gameplay;
- escalonamento `stage-difficulty-floor`, correspondente ao comportamento
  atual de `max(enemy.level, stage.difficulty)`;
- uma destas fontes determinísticas:
  - `authored-waves`: ondas com IDs, atraso anterior e posições autorais;
  - `resolved-level-enemies`: agrupa os inimigos produzidos pelo mapa resolvido
    com tamanho máximo declarado, útil também para fases procedurais. IDs de
    arquétipo próprios do gerador exigem mapeamento declarativo explícito para
    um dos seis arquétipos executáveis; ausência de mapeamento não é convertida
    silenciosamente em `affinity`.

Os arquétipos válidos continuam sendo `affinity`, `applaud`, `fortitudo`,
`ranged`, `boss` e `miniboss`. Bosses e minibosses são membros normais da
composição declarada e continuam usando as entidades existentes.

O `StageLoader` devolve um encontro resolvido junto da fase. O resolvedor não
executa ondas: somente converte a declaração ou o fallback em dados imutáveis e
determinísticos. `GameScene` conserva spawn, progressão temporal, instanciação,
eventos, conclusão e apresentação.

## Compatibilidade explícita

Módulos sem `encounter` usam o adaptador legado:

1. `LevelDefinition.waves` mantém membros e ordem; seus atrasos históricos
   continuam ignorados, como no comportamento anterior, usando 1.200 ms.
2. Sem waves, inimigos são ordenados por nível e agrupados em blocos de oito.
3. O miniboss legado é acrescentado nas posições históricas dos três versos;
   os demais conteúdos usam a posição histórica padrão.

Esse fallback não torna conteúdo inválido elegível ao catálogo: elegibilidade
continua definida por `campaignCatalog` e validação existente. Referências e
arquétipos inválidos continuam gerando erro tipado.

## Validação e capabilities

O runtime passa a anunciar `encounter.declarative` como capability de categoria
`encounter` somente porque o fluxo completo chega ao gameplay nesta etapa.
`StageValidator` verifica de forma determinística:

- schema do encontro e IDs de encontro/ondas;
- modos de início, conclusão, escalonamento e fonte;
- ondas vazias ou duplicadas, atrasos e limites inválidos;
- arquétipos não suportados e posições/níveis inválidos;
- posições sobre tiles sólidos ou fora do mapa após a resolução;
- requirements de capability incompatíveis.

O resolvedor nunca converte arquétipos desconhecidos em `affinity`. O fallback
visual permissivo da cena deixa de esconder uma referência lógica inválida.

## Integração e demonstração

O Igapó passa a declarar suas duas ondas no novo contrato, preservando membros,
atraso, dificuldade, narrativa e saídas. Um capítulo sintético, restrito aos
testes, deve comprovar registro, validação, carregamento, resolução, execução do
ciclo existente, eventos e conclusão sem entrada no catálogo de produção.

O World Lab projeta as ondas resolvidas. O `PhysicalExitResolver` também usa
essas posições ao calcular reservas; esse ajuste é a incompatibilidade direta
necessária para impedir saídas sobre spawns depois que o Igapó deixa de duplicar
encontros em `LevelDefinition.waves`.

Testes adicionais cobrem configuração válida e inválida, arquétipo desconhecido,
quantidades, delays, boss/miniboss, fallback legado, fase autoral, fase
procedural, determinismo e imutabilidade. Caracterizações da cena comprovam que
o atraso resolvido e os IDs declarados alimentam o executor existente.

## Critérios observáveis

1. Um módulo independente declara ondas diferentes do fallback e o loader as
   devolve sem conhecimento específico na `GameScene`.
2. Configurações inválidas falham com diagnósticos tipados e ordenados.
3. A mesma fase procedural e seed resolve o mesmo encontro.
4. Conteúdo sem declaração preserva composição, atraso e miniboss históricos.
5. Igapó, campanhas clássica/composta, narrativa, saves e transições mantêm os
   testes de regressão aprovados.
6. `legacy.verse` permanece somente onde há identidade ou compatibilidade real,
   com a dependência da Rota das Águas documentada.

## Limitações e sequência

- Não há condições arbitrárias de início/conclusão: somente os modos realmente
  executados pelo runtime são aceitos.
- Não há spawn dinâmico, reforços, novos arquétipos ou comportamento de IA.
- A dependência do Igapó no hub `legacy.verse` só pode sair quando o hub tiver
  identidade modular própria e destinos equivalentes.
- Topologias flexíveis, revisitas e persistência estrutural pertencem às etapas
  9.6E.2 e 9.6E.3.

## Validação prevista

Durante os incrementos, executar testes dirigidos de contratos/loader e de
caracterização da cena. Após a última mudança funcional, executar uma única
rodada final de gates, build/typecheck explícito, suíte completa e
`git diff --check`, conforme a solicitação desta etapa.
