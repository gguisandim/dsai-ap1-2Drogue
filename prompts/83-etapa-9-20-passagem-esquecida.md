# Registro de prompt da Etapa 9.20

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-27-etapa-9-20-passagem-esquecida`
- Data: `2026-11-27`
- Agente: `OpenAI Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-27-etapa-9-20-passagem-esquecida.md`
- Commit: `pendente`
- Execução: `pendente`

## Arquivos modificados

- `SPEC/2026-11-27-etapa-9-20-passagem-esquecida.md`
- `SPEC/README.md`
- `prompts/83-etapa-9-20-passagem-esquecida.md`

## Prompt efetivamente recebido

```text
# Files pasted by the user:

## "# Etapa 9.20 — Modernização artística de A Passagem Esquecida e arquitetura amb…": C:\Users\jonna\.codex/attachments/f65a20ef-95ca-43f7-9f5a-1f6be3aeaf68/Texto colado.txt

## My request:
Trabalhe diretamente na main, sincronizada com origin/main. Não crie branch nem PR. Após aprovação dos testes, build e gates, faça commit e push para origin/main. Preserve as contribuições de Guilherme e verifique o deploy no GitHub Pages.
```

## Conteúdo integral do anexo

```text
# Etapa 9.20 — Modernização artística de A Passagem Esquecida e arquitetura ambiental reutilizável

## 1. Contexto

As Etapas 9.18 e 9.19 estão integradas à main e publicadas no GitHub Pages.

Iniciaremos a modernização das fases legadas a partir de "A Passagem Esquecida", identificada por `level_01_forgotten_passage`, seguindo posteriormente a ordem do catálogo "Selecionar Fase".

As fases modernizadas da primeira página do seletor devem servir como referência de qualidade artística, composição ambiental e integração visual.

O projeto também precisa crescer significativamente em volume de código funcional, sem introduzir código morto, duplicações artificiais ou funcionalidades sem utilização real.

## 2. Preparação

- Leia `AGENTS.md`.
- Verifique o git status e atualize as referências remotas.
- Sincronize a main local por fast-forward.
- Crie a branch `feat/etapa-9-20-passagem-esquecida`.
- Preserve as contribuições existentes de Guilherme.
- Localize a implementação de `level_01_forgotten_passage`.
- Analise as fases modernizadas da primeira página como referência.
- Identifique os sistemas ambientais, renderizadores e componentes reutilizáveis existentes.

Crie a SPEC da Etapa 9.20 antes de implementar.

## 3. Diagnóstico artístico

Compare A Passagem Esquecida com as fases modernizadas, considerando:

- Qualidade dos tilesets.
- Composição arquitetônica.
- Continuidade ambiental.
- Densidade de detalhes.
- Iluminação.
- Profundidade visual.
- Paleta de cores.
- Adversários e animações.
- Identidade temática.
- Legibilidade durante o combate.

Identifique os principais problemas e registre as soluções propostas na SPEC.

## 4. Reconstrução artística

Reconstrua visualmente A Passagem Esquecida como um ambiente próprio, integrado ao mapa jogável.

Utilize a identidade temática existente como referência.

Desenvolva, conforme a coerência artística da fase:

- Tilesets próprios em pixel art.
- Paredes e pisos detalhados.
- Corredores e passagens.
- Ruínas e estruturas arquitetônicas.
- Elementos de sustentação.
- Objetos decorativos.
- Vegetação e deterioração ambiental.
- Iluminação localizada.
- Elementos ambientais animados.
- Variações de textura e composição.

Garanta continuidade visual entre entrada, interior e saída.

Não utilize imagens panorâmicas ilustrativas para simular o cenário.

Evite repetir excessivamente os mesmos elementos decorativos.

## 5. Arquitetura ambiental reutilizável

A modernização não deve se limitar à substituição de assets.

Analise a arquitetura existente e desenvolva ou amplie componentes reutilizáveis para:

- Composição de ambientes por camadas.
- Configuração declarativa de elementos ambientais.
- Distribuição determinística de elementos decorativos.
- Variações de tiles e texturas.
- Elementos ambientais animados.
- Configuração de paletas e propriedades atmosféricas.
- Validação de posicionamento dos elementos.
- Gerenciamento do ciclo de vida dos recursos ambientais.
- Integração com o renderizador existente e o World Lab.

Não duplique sistemas já implementados.

Todo componente novo deve possuir utilização concreta em A Passagem Esquecida e ser arquiteturalmente adequado à modernização das próximas fases.

## 6. Adversários

Modernize a apresentação artística dos adversários da fase, utilizando o padrão visual e de animação das fases anteriormente modernizadas.

Garanta:

- Sprites coerentes com a temática.
- Animações de movimentação.
- Animações de ataque.
- Animações de dano e morte.
- Compatibilidade com hitboxes e comportamentos existentes.

Não altere globalmente os sistemas de combate ou inteligência artificial nesta etapa.

## 7. Integração com o World Lab

Amplie os recursos existentes do World Lab quando necessário para permitir:

- Visualização da composição ambiental.
- Inspeção das camadas de renderização.
- Visualização dos elementos decorativos.
- Verificação das animações ambientais.
- Inspeção de colisões.
- Avaliação do desempenho da fase.

As ferramentas desenvolvidas devem ser funcionais e integradas ao fluxo de desenvolvimento.

## 8. Imagem de resumo

Utilize o mecanismo implementado na Etapa 9.19 para regenerar a imagem de resumo de A Passagem Esquecida.

- Capture o cenário real renderizado pelo Phaser.
- Não exiba personagens, inimigos ou HUD.
- Preserve o layout do seletor.
- Não modifique as imagens das demais fases sem necessidade.

## 9. Crescimento sustentável da base de código

Priorize crescimento funcional e arquitetural do projeto.

Não crie:

- Código morto.
- Classes sem utilização.
- Interfaces sem implementação ou consumidor real.
- Duplicações artificiais.
- Comentários redundantes para aumentar LOC.
- Testes sem valor funcional.
- Funcionalidades desconectadas do jogo.

Cada novo módulo deve possuir responsabilidade definida, integração funcional e testes proporcionais à sua complexidade.

Apresente métricas antes e depois da implementação:

- Linhas de código de produção.
- Linhas de código de testes.
- Arquivos criados e modificados.
- Componentes reutilizáveis desenvolvidos.
- Funcionalidades efetivamente integradas.
- Impacto no desempenho.

Separe código de produção, testes, documentação e assets gerados na contabilização.

Não estabeleça uma meta artificial de LOC.

## 10. Restrições

- Modernize exclusivamente A Passagem Esquecida nesta etapa.
- Preserve as demais fases.
- Preserve as mecânicas e a progressão da campanha.
- Preserve as Etapas 9.18 e 9.19.
- Preserve a configuração do GitHub Pages.
- Não implemente sistemas globais de combate, narrativa ou interatividade fora do escopo.
- Não faça alterações destrutivas no histórico.

## 11. Rastreabilidade

Crie uma SPEC própria, registro de prompt e atualização do diário.

Utilize o modelo obrigatório:

- Schema:
- Prompt-ID:
- Data:
- Agente:
- Modelo:
- Esforço:
- SPEC:
- Commit:
- Execução:

Registre apenas informações verificadas.

Utilize os trailers obrigatórios nos novos commits.

## 12. Validação e entrega

- Execute testes direcionados.
- Desenvolva testes para os novos componentes ambientais.
- Execute a suíte completa.
- Execute `npm run build`.
- Execute `npm run check:gates`.
- Execute `git diff --check`.
- Realize auditoria de segredos.
- Compare o desempenho antes e depois.
- Apresente evidências visuais do cenário anterior e atualizado.
- Disponibilize a fase e o seletor para homologação humana.
- Faça commits documentais e de implementação separados.
- Faça push e abra uma PR para main.

Não faça merge.

Não declare homologação visual aprovada sem minha autorização.

Ao final, apresente também uma proposta de expansão dos subsistemas ambientais para as próximas fases, sem implementá-las antecipadamente.
```
