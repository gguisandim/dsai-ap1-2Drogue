# Registro de prompt: capturas reais do seletor de fases — Etapa 9.19

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-25-etapa-9-19-capturas-reais-seletor`
- Data: `2026-11-25`
- Agente: `GitHub Copilot`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-25-etapa-9-19-capturas-resumo-fases.md`
- Commit: `pendente`
- Execução: SPEC e registro documentados antes da implementação; validações de implementação pendentes.

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-25-etapa-9-19-capturas-resumo-fases.md`
- `prompts/79-etapa-9-19-capturas-reais-seletor.md`
- `docs/diario-de-desenvolvimento.md`
- `pendente`

## Prompt efetivamente recebido

```text
# Etapa 9.19 — Padronização das imagens de resumo do seletor de fases
Corrija todas as imagens de resumo exibidas na aba "Selecionar Fase", incluindo todas as páginas e fases disponíveis.

## 1. Objetivo
Cada fase deve apresentar uma captura fiel do seu cenário real, como se fosse um screenshot da própria fase durante a execução do jogo.

## 2. Requisitos visuais

- Utilize o cenário efetivamente renderizado pelo Phaser.
- Escolha um enquadramento representativo da identidade visual de cada fase.
- Preserve as texturas, iluminação, vegetação, arquitetura e elementos ambientais reais.
- Não exiba protagonista, NPCs, inimigos, chefes ou outros personagens.
- Não exiba HUD, barras de vida, diálogos, indicadores de missão ou controles.
- Não utilize texturas isoladas, tiles ampliados, ilustrações conceituais ou panoramas fictícios.
- Mantenha a proporção das imagens e evite distorções.
- Garanta que cada imagem seja visualmente distinta e corresponda à respectiva fase.

## 3. Implementação
Analise prioritariamente:

- `src/presentation/StageSelectionPresentation.ts`
- `src/scenes/StageSelectScene.ts`
- `src/tests/stageSelectionPresentation.test.ts`
- `src/stages/chapters/`
- Recursos existentes de renderização e preview do World Lab.
Implemente um mecanismo reutilizável de captura do cenário sem entidades e sem HUD, preferencialmente utilizando o próprio renderizador existente.

Gere e armazene uma imagem representativa para cada fase e variante disponível, utilizando WebP ou PNG.

Mapeie explicitamente as imagens aos respectivos identificadores das fases. Não utilize `tile_floor` como imagem de resumo.

Contemple todas as fases cadastradas, não apenas as seis exibidas na primeira página.

O mecanismo de captura deverá permitir a atualização das imagens de resumo conforme os cenários forem modernizados nas próximas etapas.

## 4. Restrições

- Não modifique os cenários jogáveis.
- Não altere personagens, adversários, mecânicas ou colisões.
- Preserve o layout atual do seletor.
- Não modifique a campanha principal.
- Preserve as contribuições de Guilherme.
- Preserve as alterações realizadas na Etapa 9.18.
- Não utilize imagens geradas artificialmente para substituir capturas reais dos cenários.

## 5. Rastreabilidade
Trabalhe na branch atual `feat/modernizacao-minas-corrompidas`, mantendo a Etapa 9.19 documentalmente separada da Etapa 9.18.

Crie uma SPEC própria antes da implementação.

Crie o registro de prompt conforme o modelo obrigatório:

- Schema:
- Prompt-ID:
- Data:
- Agente:
- Modelo:
- Esforço:
- SPEC:
- Commit:
- Execução:
Preencha os campos com informações reais da execução, sem inventar valores.

Atualize o diário de desenvolvimento e utilize os trailers obrigatórios nos commits.

## 6. Critérios de aceitação

- Todas as fases possuem imagens próprias.
- As imagens correspondem aos cenários efetivamente jogáveis.
- Nenhum personagem ou elemento de interface aparece nas capturas.
- Nenhuma imagem utiliza uma textura isolada como representação da fase.
- Todas as páginas do seletor foram verificadas.
- O layout existente permanece intacto.
- Não existem regressões nas fases ou na campanha.

## 7. Validação e entrega

- Execute os testes direcionados.
- Execute a suíte completa de testes.
- Execute `npm run build`.
- Execute `npm run check:gates`.
- Execute `git diff --check`.
- Realize a auditoria de segredos.
- Apresente a relação completa das fases e suas respectivas imagens geradas.
- Disponibilize o seletor para homologação visual humana.
- Crie os commits documentais e de implementação separadamente.
- Faça push na branch atual.
Não faça merge.

Não declare a homologação visual aprovada sem minha autorização. Caso a captura automatizada dos cenários esteja indisponível, informe o impedimento e solicite intervenção humana, sem substituir as capturas por imagens genéricas.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: modelo e esforço não foram confirmados; ambos permanecem `desconhecido`.
