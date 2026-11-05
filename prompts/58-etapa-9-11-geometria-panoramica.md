# Registro de prompt: Etapa 9.11 — geometria panorâmica reutilizável

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-05-etapa-9-11-geometria-panoramica`
- Data: `2026-11-05`
- Agente: `Claude Code (extensão VS Code)`
- Modelo: `deepseek-flash[1m]`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-05-etapa-9-11-geometria-panoramica.md`
- Commit: `pendente`
- Execução: `npm run check:gates OK; npm run build OK; npm test -- --runInBand OK (90 suítes, 1136 testes); git diff --check OK; homologação visual Edge headless via CDP OK para horizontal e branched (evidências em .tmp/evidence-911/)`

## Arquivos modificados

- `AGENTS.md`
- `README.md`
- `SPEC/README.md`
- `SPEC/2026-11-05-etapa-9-11-geometria-panoramica.md`
- `docs/stage-authoring.md`
- `src/cli/chapter/args.ts`
- `src/cli/chapter/generator.ts`
- `src/cli/chapter/index.ts`
- `src/cli/chapter/plan.ts`
- `src/cli/chapter/planGenerator.ts`
- `src/cli/chapter/render.ts`
- `src/cli/chapter/run.ts`
- `src/cli/chapter/types.ts`
- `src/examples/chapter-template/encounter.ts`
- `src/examples/chapter-template/geometry.ts`
- `src/examples/chapter-template/index.ts`
- `src/examples/chapter-template/level.ts`
- `src/examples/chapter-template/narrative.ts`
- `src/examples/chapter-template/stage.ts`
- `src/examples/chapter-template/template.ts`
- `src/tests/panoramicGeometry.test.ts`
- `prompts/58-etapa-9-11-geometria-panoramica.md`

## Prompt efetivamente recebido

````text
# Umbra Trail — Etapa 9.11: Geração de Geometria Reutilizável e Exploração Panorâmica

Implemente a Etapa 9.11 no repositório atual do Umbra Trail.

## Objetivo

Facilitar a criação de fases por agentes externos (Codex, DeepSeek etc.), oferecendo templates de geometria reutilizáveis, geração determinística e integração com o planejamento estruturado da Etapa 9.10.

**Requisito central:** todas as fases geradas devem preservar a experiência de exploração panorâmica contínua introduzida no Igapó das Memórias. O jogador deve caminhar pelo cenário, descobrir regiões, encontrar personagens, enfrentar inimigos e acessar objetivos naturalmente, sem a sensação de estar preso em salas ou arenas quadradas.

**Fundamentação científica:** *Agentic PCG: Procedural Content Generation via Tool-using LLMs (2026)*.

**Abordagem aplicada:** disponibilizar ferramentas reutilizáveis de geração e configuração espacial para que agentes externos construam fases incrementalmente, aproveitando os contratos existentes e evitando a programação manual de toda a geometria.

Não implementar agentes de IA internos.

## 1. Análise inicial obrigatória

Antes de modificar arquivos:

1. Leia `AGENTS.md`, `docs/stage-authoring.md` e as SPECs relevantes.
2. Consulte `npm run --silent chapter -- capabilities --json`.
3. Inspecione as implementações das Etapas 9.9 e 9.10.
4. Analise a CLI `npm run chapter`, `StageManifest`, `StageModule`, `LevelDefinition` e os geradores procedurais disponíveis.
5. Estude a implementação atual do Igapó das Memórias, especialmente a Etapa 9.8.1.
6. Identifique como o `StageMapRenderer`, o sistema de câmera e o World Lab trabalham com mapas panorâmicos, regiões, colisões e variantes de apresentação.

Identifique os componentes reutilizáveis antes de propor qualquer estrutura nova.

**Não recrie recursos que já existem nem modifique o motor para acomodar soluções que possam ser implementadas nos capítulos.**

Preserve a compatibilidade com as campanhas, os capítulos independentes e as variantes Natural/Corrompida.

## 2. Requisito obrigatório — Exploração panorâmica contínua

A experiência espacial do Igapó das Memórias deve ser utilizada como referência de arquitetura e level design.

Isso não significa reproduzir exatamente seu mapa ou bioma, mas preservar a forma como o jogador explora o cenário.

### A. Continuidade espacial

- O mundo deve parecer um ambiente conectado e contínuo.
- As regiões representam áreas lógicas, não salas fisicamente separadas.
- A progressão principal deve ocorrer pelo deslocamento do personagem.
- Evitar mapas compostos por arenas quadradas ou salas artificiais conectadas por corredores.
- Não utilizar teletransportes para substituir conexões espaciais que poderiam ser percorridas.
- A geometria deve permitir que caminhos, clareiras, elevações, obstáculos e passagens se integrem naturalmente.

### B. Descoberta progressiva

A fase deve permitir que o jogador descubra elementos enquanto caminha.

A estrutura espacial precisa oferecer locais adequados para:

- NPCs e diálogos.
- Pontos de interesse.
- Objetivos e missões.
- Encontros de combate.
- Itens e recompensas.
- Passagens alternativas e segredos.
- Saídas e transições narrativas.

Não é necessário preencher automaticamente todos esses elementos durante a 9.11. O objetivo é garantir que os templates ofereçam uma geometria apropriada para sua inserção posterior.

### C. Câmera e apresentação

- Reutilizar a câmera que acompanha o personagem.
- Preservar a revelação gradual do ambiente conforme o deslocamento.
- Aproveitar os mecanismos atuais de renderização panorâmica.
- Manter compatibilidade com os recursos de ambientação, vegetação e decoração.
- Evitar mudanças abruptas de cena durante a exploração.
- Não implementar outro sistema de câmera ou renderização.

### D. Identidade visual dos biomas

O Igapó é uma referência de composição e experiência, não um padrão visual que todas as fases devam copiar.

Cada capítulo poderá apresentar sua própria identidade: floresta, cidade, caverna, área industrial, ambiente corrompido etc.

Os templates devem permitir utilizar temas e apresentações existentes, sem introduzir dependência obrigatória dos assets do Igapó.

**Critério obrigatório:** uma fase horizontal ou ramificada deve parecer um território explorável, não uma sequência de salas.

## 3. Integração com o planejamento da Etapa 9.10

Amplie o comando `chapter create` para gerar automaticamente um `stage-plan.json` inicial.

O plano deve:

- Seguir o schema `umbra.stage-plan`, versão 1, ou uma evolução compatível estritamente necessária.
- Utilizar identificadores coerentes com o capítulo criado.
- Refletir as regiões e conexões realmente produzidas.
- Representar a progressão linear ou ramificada.
- Identificar a região inicial e a saída.
- Passar em `plan validate`.
- Não declarar missões, encontros ou capacidades inexistentes.

Não sobrescrever planos existentes.

O `stage-plan.json` continua sendo um artefato de planejamento. O `StageModule` permanece como contrato executável.

Não criar uma segunda fonte de verdade para o runtime.

## 4. Templates de geometria

Implemente ou adapte dois templates, reutilizando os mecanismos existentes.

### A. Horizontal panorâmico

Uma fase lateral, ampla e contínua, inspirada na experiência de exploração do Igapó.

Requisitos:

- Progressão predominante da esquerda para a direita.
- Terreno contínuo, sem divisão obrigatória em salas.
- Variações naturais de geometria e altura, respeitando as mecânicas de movimentação existentes.
- Regiões lógicas distribuídas ao longo do percurso.
- Espaços apropriados para combate, exploração e interações.
- Ponto inicial e saída identificáveis.
- Compatibilidade com a câmera e as colisões existentes.
- Possibilidade de ampliar o cenário sem redesenhar o template inteiro.

A geração não deve produzir apenas um corredor reto ou um conjunto repetitivo de plataformas.

### B. Panorâmico ramificado

Uma fase com exploração contínua e caminhos alternativos.

Requisitos:

- Região inicial.
- Percurso principal.
- Pelo menos uma bifurcação espacial.
- Caminhos secundários exploráveis.
- Possibilidade de retorno ou reencontro com o percurso principal.
- Conexões físicas dentro do mesmo cenário.
- Regiões lógicas coerentes com o `stage-plan.json`.
- Compatibilidade com câmera, colisões e transições existentes.

A bifurcação deve existir na geometria real, e não apenas no planejamento narrativo.

Não criar salas independentes nem utilizar teletransportes como solução padrão.

Caso o motor não suporte determinada configuração espacial, utilize as alternativas existentes e documente a limitação, sem reconstruir a movimentação do personagem.

## 5. Geração determinística e parâmetros

Integre os templates à CLI existente.

Exemplo conceitual:

`npm run chapter -- create travessia --template horizontal --seed 42`

Permita configurar, quando compatível com os contratos atuais:

- Template.
- Semente.
- Dimensões do cenário.
- Quantidade de regiões.
- Organização geral das conexões.

Priorize poucos parâmetros úteis.

Requisitos:

1. Mesma configuração e mesma seed devem produzir a mesma geometria.
2. Valores inválidos devem gerar mensagens claras.
3. A geração deve utilizar os mecanismos de aleatoriedade existentes.
4. Não adicionar bibliotecas de geração sem necessidade.
5. Não modificar os sistemas procedurais das campanhas.
6. Não substituir os contratos atuais de geometria.

O resultado precisa ser carregável pelo motor existente e servir como base de uma fase jogável.

## 6. Edição localizada

Facilite modificações posteriores por agentes externos.

O agente deve conseguir ajustar uma região, conexão ou característica espacial sem reconstruir toda a fase.

Priorize:

- Configuração estruturada.
- Reutilização dos tipos e funções existentes.
- Alterações em arquivos do próprio capítulo.
- Preservação da seed e dos parâmetros originais.
- Regeneração controlada apenas quando necessária.

Não implementar um editor completo de tiles, uma linguagem de scripts própria ou uma API complexa de edição.

## 7. Correspondência entre plano e implementação

Implemente verificações básicas entre `stage-plan.json` e a fase gerada.

Verifique:

- Identidade do capítulo e da fase.
- Regiões declaradas e efetivamente representadas.
- Conexões principais.
- Início e saída.
- Tipo de progressão.
- Compatibilidade com o template escolhido.

A verificação deve distinguir erros comprovados de aspectos ainda não implementados.

Não exigir correspondência de objetivos narrativos ou mecânicas que ainda não foram adicionados ao capítulo.

Não implementar sincronização automática complexa entre plano e runtime.

## 8. Integração com o World Lab

Preserve integralmente o World Lab atual.

Os capítulos gerados devem continuar compatíveis com o fluxo de preview Phaser e com as ferramentas existentes de inspeção.

**Não criar funcionalidades novas no World Lab nesta etapa**, exceto correções mínimas estritamente necessárias para carregar os templates.

O World Lab será utilizado para homologar visualmente:

- Continuidade espacial.
- Acompanhamento da câmera.
- Exploração lateral.
- Bifurcações reais.
- Variações de terreno.
- Ausência de salas artificiais.
- Distribuição dos espaços disponíveis para descobertas e interações.

Não implementar chatbot ou agente integrado.

## 9. Testes e homologação

Implemente testes automatizados para:

1. Criação dos dois templates.
2. Geração automática do plano.
3. Validade de regiões e conexões.
4. Determinismo por seed.
5. Compatibilidade com os contratos existentes.
6. Preservação de arquivos preexistentes.
7. Funcionamento da CLI.
8. Compatibilidade com os capítulos anteriores.
9. Ausência de regressão nas Etapas 9.9 e 9.10.

Além dos testes unitários, realize uma homologação visual e jogável real dos dois templates usando o preview Phaser existente.

Verifique:

- Se o personagem consegue se deslocar pelo percurso principal.
- Se a câmera acompanha corretamente.
- Se o cenário é contínuo.
- Se a bifurcação realmente pode ser percorrida.
- Se o jogador consegue retornar por caminhos alternativos quando previsto.
- Se a geometria não apresenta bloqueios evidentes.

Não declare a homologação visual concluída apenas com testes headless, typecheck ou build.

Se não conseguir executar o navegador, informe essa limitação claramente e não apresente a validação visual como aprovada.

Não é necessário implementar nesta etapa um novo simulador automático de navegação, pois isso pertence à Etapa 9.12.

Execute os testes dirigidos, `npm run check:gates`, `npm run build`, a suíte completa de testes e `git diff --check`.

## 10. Restrições arquiteturais

- Não reconstruir o motor Phaser.
- Não substituir `StageModule`, `StageManifest` ou `LevelDefinition`.
- Não criar outro sistema procedural.
- Não implementar agentes internos.
- Não integrar APIs de LLM, RAG ou MCP.
- Não modificar os capítulos existentes sem necessidade.
- Não alterar a identidade visual do Igapó.
- Não criar outro sistema de câmera.
- Não modificar o World Lab para implementar funcionalidades futuras.
- Não adicionar dependências desnecessárias.
- Não implementar o playtester automatizado da 9.12.
- Não adicionar sistemas genéricos para necessidades hipotéticas.
- Não alterar branches de backup, stashes ou histórico Git.
- Não incluir arquivos temporários, perfis de navegador ou logs de sessão nos commits.

**Prioridade absoluta: reutilização, simplicidade e compatibilidade.**

## 11. Critérios de aceitação

A Etapa 9.11 estará concluída quando:

1. `chapter create` produzir automaticamente um plano válido.
2. Os templates horizontal e ramificado criarem cenários contínuos.
3. A geometria gerada for efetivamente carregada pelo motor.
4. O personagem conseguir percorrer os caminhos principais no preview.
5. A câmera funcionar corretamente durante a exploração.
6. As bifurcações representarem conexões físicas reais.
7. A geração for determinística.
8. O plano corresponder à estrutura básica produzida.
9. Os capítulos existentes permanecerem funcionais.
10. Os testes e gates obrigatórios forem aprovados.

## 12. Documentação e entrega

Antes da implementação, crie a SPEC da Etapa 9.11 seguindo o padrão do projeto e verifique se seu identificador não está ocupado.

Registre o prompt conforme as regras de rastreabilidade.

Atualize `docs/stage-authoring.md` com exemplos reais dos dois templates e instruções para agentes externos.

Ao finalizar, apresente:

1. Resumo da implementação.
2. Arquivos criados e modificados.
3. Comandos reais da CLI.
4. Exemplo de fase horizontal panorâmica.
5. Exemplo de fase panorâmica ramificada.
6. Evidências de preview e homologação visual.
7. Resultados dos testes e build.
8. Limitações identificadas.
9. Pendências para a Etapa 9.12.

**IMPORTANTE: NÃO EXECUTE COMMIT NEM PUSH.**

Mantenha as alterações exclusivamente no diretório de trabalho local.

Não execute `git commit`, `git push`, `git reset --hard`, `git clean` ou operações que descartem alterações existentes.

Implemente integralmente a etapa, sem solicitar confirmações intermediárias, seguindo a arquitetura atual e evitando complexidade desnecessária.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
