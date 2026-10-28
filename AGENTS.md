# Instruções para agentes do Umbra Trail

Estas regras valem para todo o repositório. Instruções mais específicas podem ser adicionadas em subdiretórios, sem revogar as regras de rastreabilidade, compatibilidade e validação deste arquivo.

## Fonte de verdade e leitura mínima

Antes de alterar código ou conteúdo:

1. Leia `README.md`, `SPEC/README.md` e a SPEC aplicável.
2. Leia os contratos públicos exportados pelos `index.ts` do sistema afetado.
3. Inspecione implementações internas somente para confirmar uma dependência que o contrato não esclarece.
4. Para trabalho em um capítulo, leia apenas este arquivo, a SPEC da arquitetura modular, `src/stages/contracts/`, o manifesto do capítulo e o módulo da fase em edição. Não é necessário ler o motor completo.

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

Execute a menor suíte relevante durante o trabalho e, antes da entrega de implementação, execute:

```sh
npm run build
npm test -- --runInBand
```

Para um capítulo isolado, os testes mínimos devem verificar manifesto, IDs, referências, grafo de diálogo, objetivos, eventos, compatibilidade do mapa e carregamento determinístico. Relate comandos executados, resultados e qualquer validação não executada.
