# Registro de prompt: modernização das Minas Corrompidas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-24-etapa-9-18-modernizacao-minas-corrompidas`
- Data: `2026-11-24`
- Agente: `GitHub Copilot`
- Modelo: `gpt-6-luna`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md`
- Commit: `pendente`
- Execução: `12 testes dirigidos aprovados; npm run check:gates aprovado; npm run build aprovado; suíte completa aprovada (100 suítes, 1.224 testes) na repetição; git diff --check aprovado. Homologação visual não executada: a sessão não autorizou o uso de Chrome.`

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md`
- `prompts/77-etapa-9-18-modernizacao-minas-corrompidas.md`
- `docs/diario-de-desenvolvimento.md`
- `src/assets/minas-corrompidas/README.md`
- `src/presentation/assets/bootMinasAssets.ts`
- `src/stages/chapters/minas-corrompidas/minasCorrompidasMap.ts`
- `src/stages/chapters/minas-corrompidas/visuals.ts`
- `src/tests/minasCorrompidas.test.ts`

## Prompt efetivamente recebido

```text
# Etapa 9.18 — Modernização das Minas Corrompidas
Leia `AGENTS.md`, a auditoria da PR #1 e as SPECs relacionadas às fases e ao seletor de fases.

Confirme a integração da PR #4, sincronize a main com origin/main de forma segura e crie a branch `feat/modernizacao-minas-corrompidas`.

Restrinja a análise e implementação aos arquivos das Minas Corrompidas e às dependências estritamente necessárias. Utilize as fases anteriores na ordem do seletor como referência artística.

## 1. Continuidade visual do cenário
Atualmente, as imagens presentes na entrada e na saída das Minas Corrompidas estão visualmente desconexas do restante do cenário.

- Identifique a causa dessa desconexão.
- Harmonize entrada, interior e saída da fase.
- Elimine transições visuais abruptas entre fundos, pisos e elementos ambientais.
- Garanta continuidade de cores, texturas, iluminação, escala e perspectiva.
- Preserve a identidade temática de uma mina corrompida.
- Melhore a sensação de profundidade e continuidade durante o deslocamento do jogador.
- Evite que o cenário pareça uma composição de imagens independentes.
Não resolva o problema apenas removendo as imagens de entrada e saída. Integre-as visualmente ao ambiente.

## 2. Modernização dos adversários
Os adversários devem seguir o mesmo padrão artístico dos adversários das fases anteriores.

- Identifique os sprites, spritesheets e animações utilizados nas fases anteriores.
- Padronize proporções, resolução, perspectiva, escala e estilo pixel art.
- Adapte a aparência dos inimigos à temática das Minas Corrompidas.
- Verifique animações de movimento, ataque, dano e morte, quando existentes.
- Elimine distorções, recortes incorretos e inconsistências visuais.
- Preserve atributos, hitboxes, comportamento e dificuldade, salvo correções indispensáveis.
Não modifique os adversários das outras fases para adequá-los às Minas Corrompidas.

## 3. Melhorias ambientais complementares
Quando tecnicamente viável, aprimore:

- Formações rochosas e estruturas minerais.
- Cristais e manifestações visuais da corrupção.
- Iluminação subterrânea e pontos de luz.
- Elementos decorativos que reforcem a identidade da mina.
- Diferenciação visual entre áreas percorridas.
- Legibilidade do personagem, adversários e obstáculos.
- Imagem de resumo no seletor de fases, caso deixe de representar o cenário atualizado.
Evite excesso de elementos decorativos que comprometa a jogabilidade ou o desempenho.

## 4. Restrições de colaboração

- Consulte o histórico Git dos arquivos afetados e identifique alterações recentes de Guilherme.
- Preserve suas implementações e contribuições.
- Não modifique outras fases.
- Não altere sistemas compartilhados sem necessidade comprovada.
- Preserve missões, progressão, transições, saves e mecânicas existentes.
- Se houver conflito com trabalho concorrente, interrompa a alteração afetada e informe.
- Não faça refatorações fora do escopo.

## 5. Rastreabilidade acadêmica
Crie a SPEC antes da implementação, registre o prompt e atualize o diário conforme as regras do repositório.

Utilize o seguinte padrão:

# Registro de prompt: modernização das Minas Corrompidas

- Schema:
- Prompt-ID:
- Data:
- Agente: GitHub Copilot
- Modelo: GPT-6 Luna, se confirmado na sessão
- Esforço:
- SPEC:
- Commit:
- Execução:
Preencha os metadados reais da execução, sem inventar informações.

## 6. Homologação

- Registre evidências visuais antes e depois.
- Execute a fase localmente do início ao fim.
- Valide entrada, interior e saída.
- Valide sprites e animações dos adversários.
- Verifique colisões, câmera, combate e transições.
- Verifique a prévia no seletor de fases.
- Execute testes dirigidos e a suíte completa.
- Execute `npm run build`, `npm run check:gates` e `git diff --check`.
Não considere a modernização concluída apenas pela aprovação dos testes automatizados. A homologação visual é obrigatória.

## 7. Entrega
Crie commits com os trailers de rastreabilidade exigidos pelo projeto, incluindo Agent, Model, Spec e Prompt.

Faça push e abra uma Pull Request para main. Não realize merge.

Apresente:

- Diagnóstico inicial.
- Alterações realizadas.
- Evidências visuais antes e depois.
- Arquivos modificados.
- Resultados dos testes.
- Eventuais limitações.
- Commits e URL da PR.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `modelo confirmado como gpt-6-luna; esforço indisponível`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
