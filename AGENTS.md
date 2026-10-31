# Instruções para agentes do Umbra Trail

Estas regras valem para todo o repositório. Instruções mais específicas podem ser adicionadas em subdiretórios, sem revogar as regras de rastreabilidade, compatibilidade e validação deste arquivo.

## Fonte de verdade e contexto mínimo

Use o menor contexto que permita executar e validar a tarefa com segurança. Antes
de alterar código ou conteúdo:

1. Leia este arquivo e instruções mais específicas existentes no diretório em
   edição. Consulte somente as seções de `README.md` necessárias para executar a
   tarefa ou cumprir o processo do repositório.
2. Use `SPEC/README.md` para localizar a SPEC vigente e leia essa SPEC. Não
   percorra a ordem histórica para reconstruir o estado atual.
3. Leia os contratos públicos exportados pelos `index.ts` do sistema afetado,
   os arquivos diretamente modificados e os testes que os cobrem.
4. Inspecione implementações internas ou consumidores adicionais somente para
   responder a uma dependência concreta que a SPEC vigente e os contratos não
   esclarecem. Prefira buscas direcionadas a leituras integrais de diretórios.

Não carregue SPECs históricas, auditorias anteriores, `prompts/`, sessões brutas
ou relatórios completos por padrão. Consulte-os apenas quando forem a entrada
explícita da tarefa, forem referenciados pela SPEC vigente ou quando o trabalho
for de migração, auditoria ou rastreabilidade. Para criar um registro de prompt,
leia somente `prompts/MODELO-REGISTRO.md`, o prompt efetivamente recebido e os
registros estritamente necessários para garantir um ID único; não releia o
histórico de prompts.

Para trabalho em um capítulo, limite a leitura a este arquivo, à SPEC vigente,
aos contratos aplicáveis em `src/stages/contracts/`, ao manifesto do capítulo,
ao módulo da fase em edição e aos testes diretamente relacionados. Expanda esse
conjunto apenas diante de uma dependência concreta. Não é necessário ler o motor
completo.

A arquitetura modular de campanha está especificada em `SPEC/2026-10-27-arquitetura-campanha-modular.md`. Enquanto os contratos nela propostos ainda não existirem em `src/stages/contracts/`, trate-os como plano de migração, não como API disponível.

## Processo de SPEC e rastreabilidade

- Toda mudança comportamental deve ter uma SPEC anterior à implementação.
- Ajuste pequeno atualiza a SPEC aplicável antes do código. Mudança de rumo cria uma nova SPEC datada e declara o que substitui.
- A SPEC deve conter critérios observáveis e os testes que os comprovam.
- O commit da SPEC deve preceder o commit de implementação.
- Commits assistidos mantêm os trailers:

  ```text
  Agent: <ferramenta/modelo e esforço>
  Spec: SPEC/AAAA-MM-DD-parte.md
  ```

- Preserve `prompts/registro-completo.md` e `prompts/sessoes/`. Nunca invente uma sessão, um prompt ou metadados de rastreabilidade. Use o processo existente para registrar apenas evidência real.
- Para todo novo trabalho assistido, crie um registro a partir de
  `prompts/MODELO-REGISTRO.md`, com schema `umbra-prompt-record/v1`. Copie na
  íntegra o prompt efetivamente recebido pelo agente; não substitua o texto por
  um resumo, prompt proposto ou reconstrução posterior.
- O registro v1 deve identificar: ID estável, data, agente/ferramenta, modelo,
  esforço, SPEC associada, arquivos modificados, validações executadas e commit
  correspondente. Quando um dado não estiver disponível, escreva literalmente
  `desconhecido` ou `pendente`; nunca deduza modelo, sessão, execução ou hash.
- Atualize a lista de arquivos e validações ao terminar o trabalho. Como o hash
  ainda não existe antes do commit, `Commit: pendente` é válido. O gate deriva o
  primeiro commit que adicionou o registro quando ele já está no histórico; não
  reescreva o arquivo apenas para inserir o hash do próprio commit.
- Registros v1 são aditivos. Não reescreva prompts 01–08, sessões brutas,
  `registro-completo.md` ou metadados legados para fazê-los caber no schema novo.
- Somente os oito nomes históricos autorizados pelo gate são legado. Todo novo
  arquivo de prompt deve usar schema v1 e um `Prompt-ID` único, mesmo que seu
  nome comece com número.
- Antes de um commit, execute `scripts/auditar-segredos-prompts.ps1` conforme o processo documentado no `README.md`.

## Limites arquiteturais

- `src/scenes/GameScene.ts` é um adaptador legado durante a migração. Um agente de capítulo não deve modificá-lo.
- Módulos de capítulo não importam Phaser, cenas, entidades concretas, `GameScene`, implementações internas de combate, IA, simulação, progressão ou geração procedural.
- Conteúdo declara IDs, dados, condições e comandos permitidos pelos contratos. Não injeta callbacks no motor.
- Combate e geração procedural só podem ser alterados por uma SPEC própria e por um agente explicitamente responsável pelo sistema.
- Não duplique catálogos do motor dentro de capítulos. Referencie IDs públicos e deixe o validador detectar referências ausentes.
- Não use índice de array, nome exibido ou coordenada como identidade persistente. Use IDs estáveis e namespaced.
- Não altere as chaves de armazenamento existentes nem reaproveite campos de progressão sem migração versionada.

## Trabalho isolado em capítulos e fases

Quando `src/stages/` estiver implementado, cada capítulo deve ficar autocontido em `src/stages/chapters/<chapter-id>/` e exportar um único `StageModule` por fase. O agente responsável pode editar:

- manifesto do capítulo;
- manifesto e definição de mapa das fases sob sua responsabilidade;
- NPCs, diálogos, missões e regras de eventos locais;
- testes e fixtures do próprio capítulo;
- a entrada de registro daquele capítulo, quando necessária.

O agente não pode editar, sem ampliação explícita de escopo:

- `src/scenes/GameScene.ts`;
- `src/combat/`, `src/procedural/`, `src/simulation/` ou `src/progression/`;
- outro capítulo;
- arquivos gerados ou seus índices manuais;
- saves, perfil, configurações ou serializadores legados.

Cada módulo deve ter IDs únicos, somente referências válidas, nenhuma dependência circular entre capítulos e testes de validação do manifesto. Dependência narrativa entre capítulos deve ser expressa por flags, pré-requisitos ou saídas públicas, nunca por importação direta de arquivos internos de outro capítulo.

## Código gerado e assets

- Não apague código gerado para reduzir LOC.
- Não edite arquivos gerados manualmente. Altere o gerador e regenere de forma determinística.
- Preserve IDs e índices gerados, salvo migração documentada.
- Não adicione, substitua ou regenere assets quando a tarefa for apenas arquitetural ou narrativa.
- Os catálogos genéricos em `src/content/dialogue/` e `src/content/quests/` não são contratos de campanha e não devem ser tratados como narrativa jogável sem uma integração especificada e testada.

## Compatibilidade

- Preserve `LevelDefinition` como formato legado até a remoção ser autorizada por uma SPEC futura.
- Preserve documentos `umbra-editor-document` versão 1 e as chaves `umbra-trail-profile`, `umbra-trail-settings` e `vigrid-progression-v1`.
- Novos saves de campanha devem ser aditivos, versionados e baseados em `chapterId`, `stageId` e `manifestRevision` estáveis.
- Fases procedurais persistem semente e preset; o mapa deve ser regenerado pelos contratos existentes, não serializado como uma segunda fonte de verdade.
- Um save desconhecido ou parcialmente incompatível deve falhar de forma segura, preservar os dados reconhecidos e produzir diagnóstico.

## Validação e entrega

Durante a implementação, execute testes dirigidos aos arquivos, contratos e
fluxos alterados. Agrupe alterações relacionadas antes de validar e não repita
uma suíte aprovada se não houve mudança capaz de afetá-la.

Depois da última alteração relevante de uma implementação, execute uma única
validação completa de fechamento:

```sh
npm run check:gates
npm run build
npm test -- --runInBand
```

Se essa validação revelar uma falha e qualquer arquivo relevante for corrigido,
a execução deixa de ser a validação final: rode primeiro o teste dirigido da
correção e repita o fechamento após a última mudança.

`npm run build` já executa `npm run typecheck`. Não execute `typecheck`
separadamente antes ou depois de um build aprovado quando não houver alteração
TypeScript intermediária. Use a chamada isolada somente para diagnóstico, para
uma exigência explícita de evidência independente ou quando o build não for a
validação prevista para a tarefa.

Mudanças exclusivamente documentais devem executar os gates documentais
aplicáveis e `git diff --check`. Não execute build ou suíte de gameplay sem uma
dependência executável concreta. Isso não altera a validação completa obrigatória
de entregas de implementação.

Para um capítulo isolado, os testes dirigidos mínimos devem verificar manifesto,
IDs, referências, grafo de diálogo, objetivos, eventos, compatibilidade do mapa
e carregamento determinístico.

## Logs e relatório final

- Mantenha no contexto do agente somente o status do comando, a duração, os
  totais, as falhas e os trechos necessários ao diagnóstico.
- Quando o log integral for necessário, grave-o em um diretório temporário não
  versionado, como `.tmp/<id-da-tarefa>/`, e consulte partes específicas. Remova
  os temporários da tarefa antes da entrega e nunca os inclua no commit.
- Evite repetir logs já aprovados, listas extensas de casos bem-sucedidos ou a
  íntegra do prompt no relatório final. O registro v1 continua preservando o
  prompt conforme as regras de rastreabilidade.
- O relatório final deve ser compacto e informar: arquivos modificados;
  validações executadas e seus resultados; falhas não resolvidas; riscos,
  limitações e otimizações pendentes aplicáveis.
