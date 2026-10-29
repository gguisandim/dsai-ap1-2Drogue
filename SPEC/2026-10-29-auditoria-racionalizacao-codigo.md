# Auditoria arquitetural e racionalização de código — Etapa 9.2A.2

Data: 2026-10-29

## Objetivo

Medir o repositório versionado, distinguir runtime, testes, ferramentas, scripts
e código gerado, comprovar problemas funcionais ou redundâncias e executar
somente correções pequenas cuja equivalência ou regressão possa ser testada.
Esta etapa não adiciona funcionalidades de campanha nem altera regras de jogo
sem uma reprodução objetiva de bug.

## Método e fontes de evidência

- o universo primário é `git ls-files`; arquivos não versionados são relatados
  separadamente e não entram na contagem acadêmica;
- `cloc` é usado quando executável no ambiente; na indisponibilidade, a
  contagem registra linhas físicas, não vazias e linhas com tokens por extensão,
  explicitando que não é uma saída `cloc`;
- TypeScript é analisado pela API já instalada no projeto para classes,
  imports, exports, complexidade ciclomática aproximada, dependências relativas,
  ciclos, alcançabilidade e assinaturas estruturais;
- duplicação exata usa hash do conteúdo; duplicação estrutural usa a sequência
  de tipos de nós da AST e é tratada como candidato, não como prova de remoção;
- código morto exige ausência de alcance pelas entradas, imports estáticos,
  configuração, registries e carregamento dinâmico antes de ser removido;
- gerados são relacionados ao gerador e aos consumidores antes de qualquer
  recomendação.

## Classificação e limites de mudança

- P0: bug ou risco crítico reproduzido;
- P1: redundância comprovada por equivalência;
- P2: complexidade ou acoplamento mensurável;
- P3: organização e documentação.

Cada achado registra arquivo/símbolo, evidência, impacto, proposta, risco, LOC e
testes. Nesta execução, mudanças em runtime ficam limitadas a P0 reproduzido ou
refatoração local de baixo risco com teste de caracterização. Refatorações de
geradores, `GameScene`, campanha, combate, progressão ou simulação que mudem uma
fronteira pública são apenas planejadas.

## Critérios observáveis

- relatório em `docs/audits/` contém métricas antes/depois e inventário por
  subsistema;
- gerados legítimos e candidatos a dados declarativos são diferenciados;
- IA, progressão, simulação, editor, Phaser, campanha e compras são auditados
  com referências verificáveis;
- o relatório separa comprovado, suspeita e melhoria opcional;
- qualquer correção tem teste de regressão e mantém APIs e saves;
- script de métricas não depende de pacote novo e produz saída determinística;
- testes afetados, suíte completa, typecheck, build, gates e `git diff --check`
  são registrados sem afirmar validação visual não executada.

## Compatibilidade preservada

Não são removidos gerados em massa, assets, conteúdo, classes válidas, chaves de
save ou contratos das rotas independentes. Phaser, `GameScene`, combate,
movimentação e geração procedural não são reescritos. O impacto de qualquer
proposta que reduza o repositório abaixo de 100 mil LOC é documentado antes de
execução.

## Correção funcional autorizada: compras imediatas

A auditoria reproduziu que a loja debitava qualquer uma das cinco ofertas
visíveis, embora o callback aplicasse somente `healAmount`. A correção separa a
transação headless da UI e admite apenas efeitos já suportados pelo `Player`:
cura e reposição de magia. Falta de saldo, recurso já cheio, invulnerabilidade
sem implementação e acessórios sem equipamento retornam falha tipada e não
alteram Halos nem recursos. O débito ocorre uma única vez após a validação.

Yellow Lollipop e acessórios continuam visíveis para preservar o catálogo, mas
são informados como indisponíveis; criar temporizador de invulnerabilidade ou
inventário/equipamento fica fora desta etapa. Testes cobrem sucesso, saldo
insuficiente, recurso cheio e item não suportado.

## Resultados da execução

O relatório completo está em
`docs/audits/2026-10-29-auditoria-racionalizacao-codigo.md`; a saída bruta do
script, em `docs/audits/umbra-audit-2026-10-29.json`.

- 1.859 arquivos rastreados; 1.735 de código; 237.479 linhas físicas,
  220.789 não vazias e 187.274 com tokens.
- 1.036 arquivos gerados (146.666 físicas); produção 611 arquivos/64.153;
  testes 50/10.095; scripts 11/12.795; ferramentas 27/3.770.
- 0 ciclos relativos; 0 grupos exatamente duplicados; 60 grupos estruturais.
- 10 arquivos de produção inalcançáveis, 2.015 tokens: EnemyDatabase,
  `entities/Player`, LevelManager, HealthPotion, Weapon e o runner de cenários.
- `src/content/**` tem 921 arquivos/57.040 tokens e nenhum consumidor; é o maior
  candidato a remoção/consolidação futura.
- A correção da loja foi revisada: a primeira versão limitava a cura à
  capacidade em corações e `Player.heal()` convertia novamente, curando um
  coração em vez de três. A transação agora passa o `healAmount` bruto, valida
  `hp < maxHp`, limita apenas magia à capacidade real, debita uma única vez e
  expõe `isShopItemSupported`. Itens sem efeito aparecem como `INDISPONÍVEL` e
  não têm `pointerdown`.
- Testes direcionados: 9/9. Suíte completa: 801/801 em 50 suítes. Typecheck,
  build, gates e `git diff --check` aprovados. Verificação visual em Edge
  headless confirmou jogo/loja e World Lab; o único erro de console foi o 404
  do favicon.
- Os 81 gerados marcados como modificados são apenas CRLF/LF; `git diff` não
  mostra mudança de conteúdo. A normalização fica pendente por restrição de
  permissão e deve ocorrer em tarefa própria.

Impacto acadêmico: remover `src/content` mantém 174.916 linhas físicas/130.234
tokens, acima de 100 mil; remover todo o gerado levaria a 90.813 físicas/64.017
tokens, abaixo do limite, e não é recomendado. Nenhuma remoção em massa foi
executada.

## Etapa 9.2A.3 — limpeza controlada

A limpeza fica autorizada somente para os alvos cuja ausência de consumidores
foi reconfirmada por imports relativos resolvidos, buscas estáticas e dinâmicas,
registries, entradas Vite, `tsconfig`, testes e configuração:

- os 921 arquivos de `src/content/**`, incluindo seu barrel, não são alcançados
  por `src/main.ts` nem pelo World Lab; participam apenas do glob do typecheck;
- `scripts/generate-content-packs.mjs` gera exclusivamente esses 921 arquivos,
  não está em `package.json` e reproduziu todas as saídas sem diferença após
  normalização de EOL;
- `EnemyDatabase.ts` e o legado `entities/Player.ts` não possuem importadores;
- `LevelManager.ts` não possui importadores e é o único consumidor de
  `HealthPotion.ts`; o par pode ser removido junto;
- `entities/Weapon.ts` não possui importador; `WeaponDatabase.ts`, usado pelo
  catálogo real, é outro arquivo e permanece preservado.

A remoção não altera barrels públicos usados, saves, registries do runtime,
campanha, Phaser ou regras de jogo. O build deve conservar a mesma quantidade
de módulos de produção observada antes da limpeza. Se qualquer teste, typecheck,
build ou gate demonstrar consumidor omitido, a remoção correspondente deve ser
revista antes da entrega.

As diferenças de EOL são tratadas isoladamente: somente arquivos cujo diff
contra `HEAD` fica vazio com `--ignore-space-at-eol` podem ser restaurados. A
quantidade observada no início desta execução prevalece sobre estimativas do
relatório anterior e deve ser registrada sem ajuste artificial.

### Resultado da Etapa 9.2A.3

A inspeção confirmou zero consumidores estáticos, dinâmicos, por registry ou
por caminho para `src/content/**`; o catálogo também não integrava os entrypoints
Vite do jogo ou do World Lab. Seu gerador exclusivo reproduziu os 921 arquivos
sem diferença semântica em diretório temporário. Foram removidos esses 921
arquivos, o gerador e os cinco módulos legados autorizados: `EnemyDatabase`,
`Player`, `LevelManager`, `HealthPotion` e `Weapon`.

A contagem real de diferenças somente por EOL foi 53 arquivos, não a estimativa
anterior de 81. Todos foram comparados individualmente com EOL ignorado e
restaurados ao `HEAD`, ficando zero diferenças pendentes nesse grupo.

Pela mesma metodologia do baseline, o projeto passou de 237.479 para 172.940
linhas físicas e de 187.274 para 128.443 linhas com tokens. O `cloc` atual não
pôde ser obtido porque o wrapper disponível exige Perl; portanto a exigência
acadêmica documentada não é declarada como definitivamente comprovada apenas
pelas métricas substitutas.

Os testes direcionados passaram 9/9; a suíte completa, 801/801 em 50 suítes;
typecheck, build (708 módulos), architecture gate e traceability gate também
passaram. A limpeza não alterou `GameScene`, campanha, Phaser, combate,
simulação, progressão ou APIs públicas usadas.

