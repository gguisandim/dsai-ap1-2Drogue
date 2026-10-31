# Etapa 9.6A — Catálogo dinâmico de fases

## Contexto e decisão

As etapas 8.1–8.4 separaram definição de fase, instância de campanha, nó do
grafo e saída física. A 9.3B introduziu `CampaignChapterCatalog` para registrar
capítulos e projetar bindings macro; a 9.5 tornou a validação de capabilities e
dependências atômica. Ainda não existe uma consulta canônica sobre todas as
fases que já estão no `StageRegistry`: campanhas e ferramentas precisam partir
de listas próprias de `RegionTemplate` ou IDs.

Esta etapa adiciona uma projeção headless e imutável sobre o registry existente.
Não cria outro registry e não seleciona fases. O fluxo é:

```text
CampaignChapterCatalog / capítulos legados
                  |
                  v
            StageRegistry
                  |
                  v
        StageCatalogService.create
                  |
          +-------+--------+
          v                v
 consultas canônicas   World Lab
          |
          v
     futura 9.6B
```

`StageManifest` continua sendo a fonte de verdade. Ele recebe somente
`campaignCatalog`, metadados opcionais necessários para classificar uma fase e
futuramente transformá-la em candidata. A ausência do campo preserva conteúdo
legado como executável individualmente, mas não elegível por fallback.

## Identidades

- `stageId` identifica a definição registrada e versionada pelo manifesto;
- uma instância de campanha continua identificada por `stageInstanceId`;
- `CampaignNodeId` continua identificando a ocorrência materializada no grafo;
- visita/transição continua identificada pelos registros do `CampaignRouter`.

O catálogo expõe apenas definições. Ele não cria node IDs, ocorrências, visitas,
checkpoints ou saves, e nunca usa posição de array como identidade.

## Metadados catalogáveis

`StageCampaignCatalogMetadata` declara:

- disponibilidade `available` ou `planned`;
- participação `candidate`, `individual-only` ou `narrative-milestone`;
- papel `standard`, `milestone` ou `special`;
- regiões e biomas associados;
- faixa de dificuldade, atos permitidos e capacidade de saídas físicas;
- política de revisita;
- beats e eventos narrativos requeridos/providos.

IDs, revisões, título, capítulo, layout, capabilities, dependências, diálogos de
entrada, missão de conclusão e saídas continuam derivados dos contratos já
existentes. O campo novo não duplica `StageManifest` nem contém callbacks.

## Construção e atomicidade

`StageCatalogService.create(source, capabilityProfile?)` consome a interface
somente-leitura implementada estruturalmente por `StageRegistry`:
`listChapters()` e `listModules()`. A construção:

1. ordena capítulos e módulos por IDs estáveis;
2. rejeita atomicamente IDs duplicados, pertencimento inconsistente,
   referências inexistentes e metadados inválidos;
3. usa `StageValidator` e o perfil real de capabilities;
4. classifica incompatibilidade de capability e bloqueio de dependência sem
   esconder a definição;
5. publica entradas e diagnósticos congelados em ordem canônica.

Registro e validação permanecem autoridades do `StageRegistry` e
`StageValidator`. O serviço não mantém estado mutável de registro.

## Loadability e elegibilidade

São dimensões separadas:

- `loadable`: conteúdo válido e disponível no runtime;
- `planned`: identidade declarada, sem uso jogável;
- `incompatible`: contrato estrutural ou capability impede o runtime;
- `dependency-blocked`: dependência obrigatória ausente/incompatível.

Elegibilidade geral é:

- `campaign-eligible`: candidata disponível e compatível;
- `individual-only`: carregável, mas não entra em composição;
- `narrative-reserved`: reservada a marco/posição especial;
- `planned`: não jogável;
- `capability-incompatible`;
- `dependency-blocked`.

Metadados ausentes nunca tornam uma fase elegível. Regiões planejadas não
recebem fallback. Condições dependentes de uma run, seed, quantidade, ato
específico e repetição entre selecionadas ficam para a 9.6B.

## API pública

O serviço oferece consultas puras e determinísticas para:

- listar todas as definições;
- consultar por `stageId`;
- listar por capítulo;
- filtrar por região, bioma, papel, dificuldade, loadability e elegibilidade;
- listar elegíveis e incompatíveis;
- obter diagnósticos globais ou de uma definição;
- obter candidatos canônicos com os dados que a futura composição consumirá.

Nenhuma consulta usa RNG, Phaser, DOM, storage, relógio ou estado global.

## Listas fixas e compatibilidade

`STAGE_IDS`/`SLICE_TEMPLATES` em `UmbraCampaignRouteSlice` continuam nesta
etapa: eles definem nove slots, atos, profundidades, placeholders e a topologia
persistida da campanha macro, não apenas descoberta. `PILOT_TEMPLATES`, fixtures
do World Lab e cenários narrativos também são topologias/fixtures deliberadas.
`GENERATION_PRESETS` permanece catálogo técnico do gerador e fonte de validação
de preset.

O novo serviço substitui somente a necessidade de uma lista paralela para
responder “quais fases registradas existem e quais podem ser candidatas”. A
9.6B poderá consumir `candidates()` e decidir quantidade/seed/atos sem mudar o
serviço nem o `CampaignGraphGenerator`.

Campanha macro, router, saves, geração procedural, saídas, narrativa,
recompensas e apresentação não mudam. `GameScene` não participa da descoberta.

## Integração com capítulos e Igapó

Qualquer módulo incluído em um `ChapterManifest` registrado é descoberto sem
novo `if`, `switch` ou ID central. O Igapó declara metadados de candidata da
Rota das Águas. Capítulos legados sem metadados continuam disponíveis somente
para execução individual.

Para registrar uma nova definição:

1. criar o `StageModule` e incluir seu ID em `ChapterManifest.stageIds`;
2. incluir o módulo na entrada já usada por `registerCampaignChapters`;
3. declarar `manifest.campaignCatalog` somente se a fase precisar participar
   de composição, for planejada ou estiver reservada a marco;
4. registrar o capítulo normalmente; `StageCatalogService` a descobrirá pelo
   snapshot do registry, sem edição no serviço, cena, router ou gerador;
5. usar os diagnósticos de construção antes de publicar um catálogo inválido.

## World Lab

O modo Campanha usa o mesmo registry já construído por
`WorldLabMacroDataService`, cria o catálogo e expõe entradas, origem, revisões,
loadability, elegibilidade, capabilities, dependências e diagnósticos. Uma
falha estrutural do catálogo vira diagnóstico de integração; não há catálogo
parcial nem nova interface de seleção.

## Critérios observáveis e testes

1. Catálogo vazio é válido e determinístico.
2. Um capítulo com uma ou várias fases é projetado automaticamente.
3. Múltiplos capítulos e reordenação produzem a mesma saída canônica.
4. IDs duplicados, pertencimento e referências inexistentes falham
   atomicamente com diagnóstico tipado.
5. Capabilities incompatíveis e dependências bloqueadas são consultáveis.
6. Fases planned, individuais, reservadas e elegíveis têm classificações
   distintas.
7. Filtros de capítulo, região, bioma, papel e dificuldade são determinísticos.
8. Uma fase nova no capítulo aparece sem editar motor, router ou cena.
9. Igapó aparece elegível; campanha macro e IDs de save permanecem iguais.
10. World Lab expõe o catálogo real.
11. O serviço não importa Phaser, DOM, UI ou storage.
12. Uma fixture sintética com 35 definições lista as 35 em ordem estável, sem
    escolher nove.
13. StageRegistry, StageLoader, autoria e legado não regridem.

## Fora do escopo e dependências da 9.6B

Não há sorteio, seleção de N, distribuição por atos, política de repetição,
menu, editor, CLI ou mudança de `CampaignGraphGenerator`. A 9.6B ainda deverá:

- transformar candidatos em `RegionTemplate` para uma configuração de campanha;
- aplicar seed, quantidade, atos, marcos e restrições entre escolhas;
- substituir explicitamente os slots fixos quando houver migração de revisão;
- definir compatibilidade de saves quando a composição dinâmica virar produção.

## Validação final

- testes direcionados do catálogo, registry, loader, autoria, macro e World Lab;
- `npm test -- --runInBand`;
- `npm run typecheck`;
- `npm run build`;
- `npm run check:gates`;
- `git diff --check`.
