# Registro de prompt: Etapa 9.5B.1 — Extensibilidade Visual de Fases e Biomas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-30-etapa-9-5b1-apresentacao-visual-biomas`
- Data: `2026-10-30`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-30-etapa-9-5b1-apresentacao-visual-biomas.md`
- Commit: `pendente`
- Execução: `9 testes visuais direcionados e 67 suítes/920 testes completos aprovados; typecheck, build com 726 módulos, architecture, traceability, auditoria de 20 arquivos de sessões sem segredos e diff-check aprovados; homologação gráfica bloqueada pelo host de navegador indisponível e encerramento de segurança da automação`

## Arquivos modificados

- `SPEC/2026-10-30-etapa-9-5b1-apresentacao-visual-biomas.md`
- `SPEC/README.md`
- `prompts/33-etapa-9-5b1-apresentacao-visual-biomas.md`
- `src/data/LevelData.ts`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/presentation/stages/StageMapRenderer.ts`
- `src/scenes/GameScene.ts`
- `src/stages/chapters/aguas/igapoDasMemorias.ts`
- `src/stages/chapters/aguas/igapoVisuals.ts`
- `src/stages/chapters/aguas/index.ts`
- `src/stages/contracts/StageLoad.ts`
- `src/stages/contracts/StageManifest.ts`
- `src/stages/contracts/StagePresentation.ts`
- `src/stages/contracts/index.ts`
- `src/stages/index.ts`
- `src/stages/runtime/StageLoader.ts`
- `src/stages/runtime/StageRegistry.ts`
- `src/stages/runtime/StageRuntimeCapabilities.ts`
- `src/stages/runtime/StageValidator.ts`
- `src/stages/runtime/StageVisualRegistry.ts`
- `src/tests/macroCampaignPhaserIntegration.test.ts`
- `src/tests/stageAuthoringCompatibility.test.ts`
- `src/tests/stageVisualPresentation.test.ts`
- `src/tests/worldLabPoi.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.5B.1 — Extensibilidade Visual de Fases e Biomas

Continue o desenvolvimento do **Umbra Trail**, após a conclusão da Etapa 9.5.

## Objetivo

Implementar uma arquitetura de apresentação visual configurável por fase, permitindo que capítulos definam seus próprios tilesets, temas visuais e decorações, sem modificar a lógica de geração procedural, combate ou campanha.

Esta etapa deve transformar as capabilities visuais atualmente classificadas como `planned` em funcionalidades reais, mas somente quando estiverem implementadas, integradas e testadas.

**Prioridade arquitetural:** permitir que futuros colaboradores open source adicionem a identidade visual de um bioma por meio de arquivos de conteúdo e assets, sem editar diretamente `GameScene.ts`.

## 1. Inspeção inicial

Antes de qualquer alteração:

- Ler `AGENTS.md` e as instruções do repositório.
- Ler a SPEC da Etapa 9.5 e as SPECs arquiteturais relacionadas.
- Inspecionar `StageCapabilities.ts`, `StageRuntimeCapabilities.ts`, `StageModule`, `StageManifest`, `StageLoader` e `StageValidator`.
- Inspecionar `LevelDefinition`, `LevelDefinitionAdapter`, `ProceduralLevelFactory` e `GameScene`.
- Identificar como Phaser carrega texturas, tiles, sprites e decorações.
- Inspecionar o pipeline atual de assets e o World Lab.
- Verificar os recursos gráficos disponíveis no repositório.
- Executar `git status --short` e preservar alterações existentes.

Não assumir nomes de arquivos, APIs ou formatos sem verificar o código.

## 2. Contrato de apresentação visual

Criar ou estender um contrato declarativo para definir a aparência de uma fase.

O contrato deve permitir referenciar:

- Identificador do tema visual.
- Identificador do tileset.
- Texturas para tipos de pisos e obstáculos.
- Variantes visuais de tiles.
- Decorações estáticas.
- Camadas visuais.
- Metadados de apresentação necessários ao renderizador.

Separar claramente a identidade lógica de um tile de sua representação gráfica.

Por exemplo, um tile logicamente transitável deve continuar transitável independentemente da textura utilizada.

Não modificar os valores semânticos dos tiles apenas para acomodar diferentes biomas.

Não criar uma segunda representação autoritativa do mapa.

## 3. Registry de temas e tilesets

Implementar o menor mecanismo necessário para registrar e resolver recursos visuais por identificadores estáveis.

Reutilizar registries existentes quando possível.

O sistema deve:

1. Resolver o tema declarado pelo stage.
2. Identificar as texturas correspondentes.
3. Validar a disponibilidade dos recursos.
4. Fornecer ao renderizador um conjunto de recursos resolvidos.
5. Rejeitar referências inválidas com diagnósticos explícitos.
6. Preservar o tema legado como configuração padrão para fases antigas.

Não criar um framework genérico de plugins.

Não permitir execução arbitrária de código proveniente de pacotes de conteúdo.

## 4. Renderização desacoplada

Extrair ou adaptar a responsabilidade de apresentação dos tiles atualmente concentrada na `GameScene`.

Preferir um componente de renderização ou serviço de apresentação específico, compatível com Phaser.

A cena deve apenas:

- Receber o stage carregado.
- Resolver seus recursos visuais.
- Solicitar a construção visual do mapa.
- Gerenciar o ciclo de vida dos objetos Phaser.

O novo componente deve utilizar os tiles lógicos já produzidos pelo jogo.

Não implementar um gerador procedural alternativo.

Não alterar colisões, transitabilidade, hazards, spawns ou posições de saídas.

## 5. Decorações

Implementar a apresentação das decorações declaradas nos contratos existentes.

Considerar:

- Posição.
- Identificador do asset.
- Camada visual.
- Profundidade.
- Visibilidade.
- Escala, quando compatível com o contrato.

As decorações desta etapa devem ser puramente visuais.

Não introduzir colisão ou efeitos de gameplay para elementos decorativos.

Validar referências e coordenadas antes da renderização.

Evitar sobreposição visual indevida com elementos importantes, como portais e pontos de interação, quando houver regras explícitas disponíveis.

## 6. Compatibilidade com geração procedural

Garantir que o sistema funcione tanto em:

- Mapas autorais.
- Mapas procedurais.
- Fases legadas.
- Fases vinculadas à campanha macro.

O resultado geométrico deve permanecer idêntico para a mesma seed.

O tema visual pode mudar, mas a topologia do mapa não pode ser alterada.

Preservar o determinismo e a compatibilidade com `PhysicalExitResolver` e `CampaignExitBinder`.

## 7. Primeiro bioma demonstrativo

Criar uma demonstração visual simples usando o **Igapó dos Esquecidos** ou a **Floresta das Raízes**.

Utilizar preferencialmente assets já existentes no repositório.

Se não houver sprites suficientes, criar um tema técnico provisório com recursos gráficos simples e claramente identificados como placeholders.

Não baixar assets externos sem verificar licenças.

Não gerar um pacote artístico completo nesta etapa.

A demonstração deve comprovar que dois stages podem utilizar temas visuais diferentes sem mudanças específicas no código central do jogo.

## 8. Integração com World Lab

Verificar como o World Lab representa os tiles e decorações.

Reutilizar o contrato de apresentação visual quando viável.

Permitir identificar:

- Tema ativo.
- Tileset declarado.
- Recursos resolvidos.
- Recursos ausentes.
- Decorações.
- Diagnósticos visuais.

Não reconstruir o World Lab.

Caso a renderização dos assets reais no visualizador exija uma implementação significativamente maior, preservar sua visualização lógica atual e documentar a extensão futura.

## 9. Atualização das capabilities

Atualizar `StageRuntimeCapabilities` somente para os recursos comprovadamente operacionais.

Por exemplo:

- Tilesets personalizados: `supported` somente após carregamento e renderização reais.
- Temas visuais: `supported` somente após aplicação em fases.
- Decorações: `supported` somente após renderização efetiva.

Música, iluminação, névoa e apresentação de entidades devem permanecer `planned`, pois pertencem à Etapa 9.5B.2.

Não declarar suporte fictício.

## 10. Testes obrigatórios

Adicionar testes para:

1. Tema legado.
2. Tema autoral válido.
3. Tema desconhecido.
4. Tileset ausente.
5. Referência de textura inválida.
6. Fase procedural com tema personalizado.
7. Fase autoral com tema personalizado.
8. Decorações válidas.
9. Decoração fora do mapa.
10. Camadas e profundidade.
11. Determinismo do resultado.
12. Preservação das colisões.
13. Preservação da transitabilidade.
14. Preservação das saídas físicas.
15. Compatibilidade com World Lab.
16. Compatibilidade com saves.
17. Não regressão dos conteúdos legados.
18. Isolamento entre conteúdo declarativo e Phaser.

Adicionar testes de integração que verifiquem a utilização real do renderizador.

Não considerar suficiente testar apenas a validação dos contratos.

## 11. Homologação visual

Quando possível, executar o jogo no navegador para verificar:

- Fase legada com aparência preservada.
- Fase autoral com tema diferente.
- Renderização correta de pisos e paredes.
- Decorações visíveis.
- Spawns e saídas preservados.
- Ausência de erros por texturas inexistentes.
- Transições entre stages com temas diferentes.

Registrar evidências quando disponíveis.

Não declarar homologação visual se ela não tiver sido executada.

## 12. Documentação

Criar a SPEC:

`SPEC/2026-10-30-etapa-9-5b1-apresentacao-visual-biomas.md`

Atualizar `SPEC/README.md` e registrar o próximo prompt sequencial em `prompts/`, seguindo `umbra-prompt-record/v1`.

Documentar:

- Contratos visuais.
- Resolução de temas e tilesets.
- Como registrar um novo tema.
- Como associar um tema a uma fase.
- Como adicionar decorações.
- Compatibilidade com mapas procedurais.
- Capabilities suportadas.
- Limitações.
- Preparação para a 9.5B.2.

## 13. Restrições

- Não iniciar a Etapa 9.5B.2.
- Não implementar músicas por fase.
- Não implementar iluminação ou névoa.
- Não implementar sprites personalizados de inimigos e NPCs.
- Não alterar o combate.
- Não modificar a geração procedural.
- Não criar outro sistema de mapas.
- Não adicionar dependências pesadas sem necessidade.
- Não criar sistemas de plugins paralelos.
- Não realizar refatoração ampla da `GameScene`.
- Não criar commit nem executar push.

## 14. Validações finais

Executar:

- Testes específicos da apresentação visual.
- Testes do StageLoader e StageValidator.
- Testes de geração procedural.
- Testes de campanha e saídas.
- `npm test -- --runInBand`.
- `npm run typecheck`.
- `npm run build`.
- `npm run check:gates`.
- `git diff --check`.

Corrigir regressões introduzidas.

## 15. Relatório final

Apresentar:

1. Arquivos criados e modificados.
2. Contratos utilizados.
3. Registry e resolução de recursos visuais.
4. Funcionamento do renderizador.
5. Suporte implementado a decorações.
6. Resultado da demonstração com dois temas.
7. Capabilities atualizadas.
8. Resultados dos testes.
9. Resultado da homologação visual.
10. Limitações restantes.
11. Estado para commit.
12. Próximas necessidades para a 9.5B.2.

**Critério de conclusão:** duas fases com mapas equivalentes devem poder utilizar identidades visuais distintas, definidas por seus próprios dados de conteúdo, mantendo geometria, colisões, navegação, geração procedural e comportamento do jogo.

A implementação deve aproximar o Umbra Trail de um modelo open source em que criar um novo bioma não exige modificar diretamente o motor.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Homologação visual: `não concluída`; o host de abas integrado estava
  indisponível e a automação da janela isolada do Edge foi encerrada porque
  não conseguiu determinar a URL atual com confiança suficiente para aplicar
  a política de segurança.
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
