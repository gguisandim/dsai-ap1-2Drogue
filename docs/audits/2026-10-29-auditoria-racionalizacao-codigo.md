# Auditoria arquitetural e racionalização de código — Etapa 9.2A.2

Data: 2026-10-29

## 1. Resumo executivo

O repositório versionado tem **237.479 linhas físicas** em 1.735 arquivos de
código; 146.666 linhas são geradas. A produção real soma 64.153 linhas físicas,
testes 10.095, scripts 12.795 e ferramentas 3.770. Não há ciclos relativos nem
arquivos exatamente duplicados. Há 60 grupos de repetição estrutural, quase
todos entre irmãos gerados ou catálogos declarativos, não prova de remoção.

A maior oportunidade comprovada na Etapa 9.2A.2 era `src/content/`: **921
arquivos, 62.563 linhas físicas e 57.040 linhas com tokens**, gerados por
`scripts/generate-content-packs.mjs`, sem nenhum importador em runtime, testes,
scripts ou World Lab. A Etapa 9.2A.3 removeu esse código após reconfirmar as
dependências e validar o projeto completo; os números desta seção permanecem
como baseline comparável.

A auditoria também corrigiu um defeito real na transação da loja: o reparo
anterior limitava a cura à capacidade em corações e chamava `Player.heal()` com
uma quantidade que o runtime converte novamente em corações, curando apenas um
coração. A transação agora valida o recurso em unidades corretas, debita uma vez
e itens sem efeito aparecem como `INDISPONÍVEL` na UI.

## 2. Métricas e metodologia

Comando:

```sh
node scripts/audit-codebase.mjs --json
```

O script usa `git ls-files` (1859 arquivos rastreados), API TypeScript instalada,
scanner de tokens, AST, hashes exatos e estruturais, SCC para ciclos e
alcançabilidade a partir de `src/main.ts` e
`src/devtools/world-lab/main.ts`. `cloc` não foi usado porque o Perl exigido não
está disponível; os números são linhas físicas, não vazias e com tokens — não
uma saída `cloc`. Arquivos não rastreados ficam fora das métricas e são
relatados à parte. A saída bruta está em
`docs/audits/umbra-audit-2026-10-29.json`.

| Categoria | Arquivos | Físicas | Não vazias | Tokens | Classes |
|---|---:|---:|---:|---:|---:|
| Gerado | 1.036 | 146.666 | 138.247 | 123.257 | 902 |
| Produção | 611 | 64.153 | 58.672 | 49.258 | 446 |
| Scripts | 11 | 12.795 | 11.443 | 6.943 | 0 |
| Testes | 50 | 10.095 | 9.027 | 5.937 | 17 |
| Ferramentas | 27 | 3.770 | 3.400 | 1.879 | 15 |
| **Total** | **1.735** | **237.479** | **220.789** | **187.274** | **1.380** |

## 3. Inventário por subsistema

| Subsistema | Arquivos | Físicas | Tokens | Observação |
|---|---:|---:|---:|---|
| content | 921 | 62.563 | 57.040 | gerado, sem consumidores |
| simulation | 154 | 49.425 | 45.852 | inclui 30 pacotes de cenário gerados |
| progression | 39 | 20.130 | 18.519 | runtime; 34 arquivos gerados |
| ai | 44 | 15.935 | 14.893 | runtime; 28 regras táticas geradas |
| combat | 231 | 15.395 | 14.012 | catálogos de efeitos/habilidades; runtime |
| procedural | 134 | 10.792 | 10.157 | 100 regras de bioma estruturalmente irmãs |
| scripts | 11 | 12.795 | 6.943 | geradores, incluindo 3.976 linhas de simulation-core |
| tests | 50 | 10.095 | 5.937 | suíte |
| data | 10 | 3.653 | 3.477 | EnemyDatabase é o maior arquivo morto |
| tools | 33 | 16.823 | 2.189 | editor; grande volume de template strings |
| application | 13 | 3.849 | 1.899 | rotas, router, macro, persistência |
| stages | 21 | 5.525 | 1.540 | contratos, loader, geradores, validadores |
| devtools | 16 | 2.704 | 1.327 | World Lab |
| entities | 10 | 1.863 | 1.092 | Player legado sem consumidor |
| narrative | 16 | 2.170 | 866 | runtime headless |
| scenes | 7 | 2.200 | 646 | GameScene concentra 1.376 físicas |
| demais | 22 | 1.376 | 795 | utils, managers, ui, fixtures e configs |

## 4. Duplicações estruturais

- **0** grupos de arquivos exatamente duplicados;
- **0** ciclos relativos;
- **60** grupos de repetição estrutural (mesma sequência de tipos de nó AST).

Principais grupos:

| Tamanho | Amostra | Leitura |
|---:|---|---|
| 920 | `src/content/achievements/AchievementPack*.ts` | catálogo gerado sem consumidor |
| 100 | `src/procedural/rules/biomes/cathedral/*Rule.ts` | irmãos declarativos de regras |
| 32/24/16 | `src/combat/effects/catalog/**` | efeitos por elemento com forma comum |
| 30 | `src/progression/generated/nodes/ProgressionNodePack*.ts` | conteúdo runtime gerado |
| 30 | `src/simulation/scenarios/generated/scenario_pack_*.ts` | dados de teste gerados |
| 16/12/8 | `src/combat/abilities/catalog/**` | habilidades por classe |
| 14/12 | `src/simulation/events/contracts/*.ts` | contratos de evento boilerplate |

O hash estrutural ignora identificadores e valores; os grupos são **candidatos a
consolidação**, não evidência de que as classes sejam substituíveis sem mudar
comportamento. Nenhuma consolidação foi executada.

## 5. Código gerado e consumidores

| Diretório | Arquivos | Tokens | Consumidor real | Decisão |
|---|---:|---:|---|---|
| `src/content` | 921 | 57.040 | nenhum | REMOVIDO na 9.2A.3 |
| `src/simulation/scenarios/generated` | 30 | 32.827 | testes de matriz e runner | MANTER como fixture; consolidar depois |
| `src/progression/generated` | 34 | 17.996 | `ProgressionService` via `GeneratedContentDirector` | MANTER |
| `src/ai/generated` | 28 | 13.757 | `Enemy` via `GeneratedTacticalDirector` | MANTER; consolidar com cautela |
| `src/tools/generated` | 22 | 1.637 | `EditorWorkspace`/`EditorScene` | MANTER |
| `src/combat/effects` e `abilities` | 231 no subsistema | 14.012 | runtime de combate | MANTER; não refatorar nesta etapa |

`src/content/index.ts` é um barrel gerado e não é importado por nenhum arquivo
fora de `src/content`. Não há import dinâmico ou referência textual em runtime,
testes, scripts ou World Lab.

## 6. Problemas classificados

### P0 — corrigidos

- **Loja debitava item sem efeito**: as cinco ofertas chamavam um callback que só
  aplicava `healAmount`; itens de invulnerabilidade e acessórios descontavam
  Halos sem efeito. A transação foi extraída para `ShopPurchase`.
- **Cura em unidade errada**: a primeira correção limitava `healed` à capacidade
  em corações (`maxHp - hp`) e passava esse valor a `Player.heal()`, que converte
  novamente HP em corações (`ceil(amount / 20)`). Com 2/5 corações, a Green
  Lollipop curava um coração em vez de três. Corrigido para validar
  `hp < maxHp` e passar o `healAmount` bruto; magia continua limitada à
  capacidade real.
- **Itens sem efeito anunciados como compráveis**: a UI agora mostra
  `INDISPONÍVEL`, remove a descrição enganosa e não registra `pointerdown` para
  itens sem `healAmount`/`magicAmount`.

### P1 — redundância comprovada por consumidores

- `src/content/**` (921 arquivos, 57.040 tokens) sem consumidores.
- `src/data/EnemyDatabase.ts` (1.384 tokens, 47 exports, zero imports).
- `src/entities/Player.ts` (270 tokens), `LevelManager.ts` (73),
  `HealthPotion.ts` (7), `Weapon.ts` (7): legado sem importadores.

### P2 — complexidade/acoplamento mensurável

- `GameScene` (1.376 físicas, 189 branches): adaptador legado concentra mapa,
  ondas, recompensas, campanha e UI. Refatoração futura por extração, não agora.
- `CampaignGraphValidator` (233 branches) e `PhysicalExitResolver` (196):
  coesos e testados; candidatos a helpers internos, não a reescrita.
- `CampaignMacroProgression` (650 linhas, 88 branches),
  `CampaignMacroState` (188 branches), `CampaignMacroRouteBinder` (426 linhas):
  camadas corretas, mas persistência composta merece teste de contrato contínuo.
- Catálogos gerados de IA/combate/progressão: repetição estrutural alta; qualquer
  consolidação exige testes de equivalência por comportamento.

### P3 — organização

- A estimativa inicial de 81 arquivos gerados com diferença somente de CRLF/LF
  estava desatualizada. A inspeção da 9.2A.3 encontrou **53** arquivos; todos
  tiveram conteúdo normalizado equivalente e foram restaurados isoladamente ao
  `HEAD`, sem misturar normalização com mudança funcional.
- Título da loja sobrepõe o contador de Halos (visual pré-existente).
- Grupos estruturais de contratos de evento e regras de bioma podem virar dados
  declarativos em etapa posterior.

## 7. Bugs corrigidos e testes

`src/ui/ShopPurchase.ts` agora expõe:

- `purchaseShopItem(player, item)` com falhas tipadas `insufficient-funds`,
  `resource-full` e `unsupported-item`;
- `isShopItemSupported(item)` para a UI.

`src/ui/ShopUI.ts` usa a classificação para exibir `BUY` somente em itens com
efeito imediato e `INDISPONÍVEL` nos demais.

`src/tests/shopPurchase.test.ts` cobre:

1. cura aplicada e débito único;
2. reposição de magia;
3. saldo insuficiente sem mutação;
4. recurso cheio sem débito;
5. magia cheia sem débito;
6. rejeição de Yellow Lollipop, Moon of Mahaa-Kalaa e Evil Harvest Rosary;
7. classificação de suporte.

Resultado direcionado: **9/9**. Nenhuma regra de progressão foi alterada; o
teste de progressão existente continua verde.

## 8. Preservar

- contratos públicos de `src/stages/contracts/` e `src/narrative/contracts/`;
- `CampaignRouter`, `CampaignRunSaveService`, `CampaignMacroProgression`,
  `CampaignMacroRouteBinder` e o journal/ledger de recompensas;
- `ProgressionService`, `GeneratedContentDirector` e saves atuais;
- `GeneratedTacticalDirector` e regras táticas usadas por `Enemy`;
- catálogos de combate/procedural em uso;
- World Lab e seus adapters;
- `GameScene` até existir uma extração testada;
- testes de caracterização e integração.

## 9. Consolidar ou remover futuramente

| Alvo | Ação | Pré-condição |
|---|---|---|
| `src/content/**` + gerador | REMOVIDO na 9.2A.3 | zero imports, gerador exclusivo e build comprovados |
| `EnemyDatabase.ts` | REMOVIDO na 9.2A.3 | zero consumidores e build comprovados |
| `Player.ts`, `LevelManager.ts`, `HealthPotion.ts`, `Weapon.ts` | REMOVIDOS na 9.2A.3 | zero consumidores e build/testes comprovados |
| `simulation/scenarios/generated` | CONSOLIDAR em fixture/dados | manter matriz de testes |
| Regras de bioma/procedural | CONSOLIDAR em dados declarativos | golden tests de geração |
| Catálogos de efeitos/habilidades | CONSOLIDAR por família | equivalência por combate |
| `GameScene` | REFATORAR por extração | testes de caracterização e 9.2B |
| Macro/router/validators | MANTER; INVESTIGAR complexidade | contratos e testes atuais |

## 10. Impacto na contagem acadêmica de 100 mil LOC

- Total físico: **237.479**; total com tokens: **187.274**.
- Sem código gerado: 90.813 físicas / 64.017 tokens — abaixo de 100 mil em
  qualquer uma das duas leituras.
- Remover apenas `src/content` (62.563 físicas / 57.040 tokens) deixa
  **174.916 físicas / 130.234 tokens**, acima de 100 mil.
- Remover todo o código gerado deixaria o repositório abaixo de 100 mil; isso
  **não é recomendado** e contraria a restrição de não reduzir código para
  produzir números menores.
- A decisão sobre `src/content` deve ser de produto/acadêmica, não automática:
  é código sem consumidor, mas representa volume significativo.

## 11. Plano incremental de limpeza

1. **Higiene de line endings — concluída na 9.2A.3**: 53 arquivos realmente
  modificados, todos equivalentes com EOL normalizado e restaurados ao `HEAD`.
2. **Código morto comprovado — concluído na 9.2A.3**: `EnemyDatabase`, `Player`,
  `LevelManager`, `HealthPotion` e `Weapon` removidos com build/testes.
3. **Content packs — concluído na 9.2A.3**: catálogo e gerador exclusivo
  removidos após prova de ausência no runtime, World Lab e build.
4. **Cenários de simulação**: mover os 30 pacotes para `test-fixtures` ou dados
  declarativos, mantendo a matriz de testes.
5. **Catálogos gerados runtime**: consolidar por família somente com testes
  golden/comportamentais; IA, combate e progressão separadamente.
6. **GameScene**: extrair adaptadores de transição/recompensa após 9.2B, com
  caracterização; não reescrever a cena inteira.
7. **Macro/campanha**: manter camadas; adicionar testes de persistência
  composta se novos fluxos forem integrados.

## 12. Pendências antes da integração Phaser 9.2B

- confirmar a métrica acadêmica com `cloc` em ambiente com Perl; as métricas
  físicas e por tokens permanecem acima de 100 mil, mas não substituem esse
  critério documentado;
- manter o World Lab visualmente funcional durante a integração;
- preservar flag OFF, saves e journal/ledger;
- validar a loja corrigida em navegador junto da integração;
- manter a suíte e os gates verdes a cada incremento.

## 13. Estado inicial e final dos arquivos alterados

| Arquivo | Estado inicial | Estado final |
|---|---|---|
| `src/ui/ShopUI.ts` | 161 linhas, débito sem efeito | 177 linhas, transação + labels |
| `src/ui/ShopPurchase.ts` | não rastreado (101 linhas) | transação tipada + suporte |
| `src/tests/shopPurchase.test.ts` | não rastreado (94 linhas) | 9 testes |
| `SPEC/2026-10-29-auditoria-racionalizacao-codigo.md` | 76 linhas (plano) | 111 linhas (plano + resultados) |
| `scripts/audit-codebase.mjs` | 316 linhas (novo) | mantido |
| `docs/audits/umbra-audit-2026-10-29.json` | ausente | métricas finais |
| `docs/audits/2026-10-29-auditoria-racionalizacao-codigo.md` | ausente | 294 linhas |
| `prompts/22-etapa-9-2a-2-auditoria-continuacao.md` | ausente | 193 linhas |
| 53 arquivos gerados (contagem efetiva da 9.2A.3) | CRLF/LF apenas | restaurados isoladamente ao `HEAD`; zero diferenças restantes |

Arquivos não rastreados não entram nas métricas acima; após o commit, a
contagem sobe aproximadamente 1.100 linhas físicas (SPEC, script, ShopPurchase,
teste, relatório e registro).

## 14. Validação

| Verificação | Resultado |
|---|---|
| `jest src/tests/shopPurchase.test.ts` | 9/9 |
| Suíte completa | 801/801 em 50 suítes |
| `tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| Architecture gate | 1.710 arquivos, 3.739 dependências |
| Traceability gate | 17 registros v1 antes do novo registro |
| `git diff --check` | exit 0 |
| Navegador real (Edge headless) | jogo/menu e loja carregados; `INDISPONÍVEL` visível nos itens sem efeito; World Lab renderizado; sem erros de console além do 404 do favicon |

Evidências visuais: `02-shop.png` e `03-world-lab.png` em
`C:\Users\guisa\AppData\Local\Temp\umbra-audit-visual\`.

## 15. Decisões objetivas

**MANTER:** contratos, CampaignRouter/RunSave, macro/RouteBinder, progressão,
IA tática, combate, procedural em uso, World Lab, GameScene até extração
testada.

**REFATORAR:** GameScene (extração futura), validadores/resolver grandes por
helpers internos, macro complexo apenas com contrato de persistência.

**CONSOLIDAR:** cenários de simulação em fixtures/dados; catálogos gerados
runtime por família, com testes de equivalência.

**REMOVIDO na 9.2A.3:** `src/content`, seu gerador exclusivo, EnemyDatabase,
Player, LevelManager, HealthPotion e Weapon, todos sem consumidores.

**INVESTIGAR:** persistência composta macro + run save; título sobreposto da
loja; confirmação acadêmica por `cloc` em ambiente com Perl.

## 16. Execução da Etapa 9.2A.3

### Evidência e remoções

Antes da remoção foram verificados imports estáticos e dinâmicos, registries,
referências por string, entradas Vite, `tsconfig`, testes, scripts e os pontos de
entrada do jogo e do World Lab. `src/content/index.ts` era o único agregador dos
packs e não tinha consumidor externo. O gerador de content packs não estava em
`package.json`, escrevia exclusivamente os 921 arquivos removidos e reproduziu
o catálogo em diretório temporário sem diferença semântica após normalização de
EOL. O build anterior já não incluía esses módulos.

Foram removidos **927 arquivos rastreados**:

- 921 arquivos de `src/content/**`;
- `scripts/generate-content-packs.mjs`;
- `src/data/EnemyDatabase.ts`;
- `src/entities/Player.ts`;
- `src/entities/HealthPotion.ts`;
- `src/entities/Weapon.ts`;
- `src/managers/LevelManager.ts`.

`Hero.ts`, `WeaponDatabase.ts`, os catálogos runtime de combate, os cenários de
simulação, progressão gerada, IA gerada e ferramentas do editor permaneceram.
Nenhum contrato de campanha, `GameScene`, Phaser, combate, simulação ou
progressão foi alterado pela limpeza.

### LOC antes e depois

A comparação usa exatamente o mesmo scanner do baseline. O resultado pós-limpeza
conta 808 arquivos de código presentes; o JSON também informa 927 caminhos
rastreados ausentes por estarem removidos no worktree ainda sem commit.

| Categoria | Arquivos antes/depois | Físicas antes/depois | Tokens antes/depois |
|---|---:|---:|---:|
| Gerado | 1.036 / 115 | 146.666 / 84.103 | 123.257 / 66.217 |
| Produção | 611 / 606 | 64.153 / 62.273 | 49.258 / 47.517 |
| Testes | 50 / 50 | 10.095 / 10.095 | 5.937 / 5.937 |
| Scripts | 11 / 10 | 12.795 / 12.699 | 6.943 / 6.893 |
| Ferramentas | 27 / 27 | 3.770 / 3.770 | 1.879 / 1.879 |
| **Total** | **1.735 / 808** | **237.479 / 172.940** | **187.274 / 128.443** |

Redução: **64.539 linhas físicas** e **58.831 linhas com tokens**, sem geração
artificial compensatória. A contagem pós-limpeza permanece acima de 100 mil nas
duas métricas disponíveis. O critério acadêmico documentado usa `cloc`; como o
wrapper instalado requer Perl e Perl não está disponível, não se declara
conformidade definitiva por `cloc`. O último número `cloc` do README é histórico
e não é comparável ao estado atual.

### EOL, regressões e validação

A contagem efetiva de arquivos apenas CRLF/LF foi **53**, não 81: 31 cenários
gerados de simulação (incluindo o índice) e 22 arquivos gerados das ferramentas.
Cada caminho passou por comparação individual com `--ignore-space-at-eol` antes
de ser restaurado ao `HEAD`; ficaram zero diferenças nesses arquivos.

As nove verificações de `ShopPurchase` continuam aprovadas: cura e magia são
aplicadas nas unidades esperadas, débitos ocorrem uma vez e ofertas sem efeito
continuam bloqueadas como `INDISPONÍVEL`. Não foram implementados equipamentos,
invulnerabilidade ou novos itens.

| Verificação final da 9.2A.3 | Resultado |
|---|---|
| Testes direcionados de loja | 9/9 |
| Suíte completa | 801/801 em 50 suítes |
| Typecheck | aprovado |
| Build | aprovado; 708 módulos transformados |
| Architecture gate | aprovado; 784 arquivos e 2.807 dependências |
| Traceability gate | aprovado; 19 registros v1, 8 legados e 2 commits pendentes |
| `git diff --check` | aprovado; somente aviso informativo de conversão futura LF/CRLF na SPEC modular |
| Diferença de módulos do build | nenhuma atribuível a `src/content`; catálogo nunca integrou o grafo de produção |
| Smoke visual da 9.2A.3 | indisponível: o controlador encerrou antes da navegação por não confirmar com segurança a URL atual do Opera; nenhuma interação foi executada |

### Riscos restantes e prontidão

- **P1 acadêmico:** executar `cloc` em ambiente com Perl para confirmar o
  critério oficial; não há evidência de queda abaixo de 100 mil nas métricas
  disponíveis.
- **P2 visual:** preservar a verificação manual de loja e World Lab durante a
  futura integração; o smoke automatizado desta etapa ficou indisponível e o
  título sobreposto da loja é dívida pré-existente.
- **P2 arquitetural:** GameScene e validadores grandes continuam deliberadamente
  fora desta limpeza.
- **P3:** consolidações futuras de catálogos runtime exigem equivalência
  comportamental e não foram iniciadas.

Com a suíte, build, typecheck e gates verdes, a base de código está tecnicamente
pronta para iniciar a 9.2B. A confirmação acadêmica por `cloc` e um novo smoke
visual continuam pendências explícitas; nenhuma delas autoriza ampliar o escopo
desta limpeza.
