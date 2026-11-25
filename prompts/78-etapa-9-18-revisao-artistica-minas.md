# Registro de prompt: revisão artística das Minas Corrompidas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-24-etapa-9-18-revisao-artistica-minas`
- Data: `2026-11-24`
- Agente: `GitHub Copilot`
- Modelo: `gpt-6-luna`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md`
- Commit: `pendente`
- Execução: `SPEC revisada antes da implementação; alterações e validações pendentes.`

## Arquivos modificados

- `SPEC/2026-11-24-etapa-9-18-modernizacao-minas-corrompidas.md`
- `prompts/78-etapa-9-18-revisao-artistica-minas.md`
- `docs/diario-de-desenvolvimento.md`
- `pendente`

## Prompt efetivamente recebido

```text
# Etapa 9.18 — Revisão da direção artística das Minas Corrompidas
A homologação visual humana reprovou parcialmente a implementação do commit `746d829`.

Os adversários foram aprovados, mas a composição do cenário não corresponde ao resultado desejado.

## 1. Reconstrução visual do cenário
Não quero ampliar, repetir, recortar ou melhorar a transição das imagens panorâmicas existentes.

Utilize essas imagens exclusivamente como referência artística para construir um cenário próprio, integrado ao ambiente jogável.

- Remova a utilização dos panoramas ilustrativos na entrada, no interior e na saída da fase.
- Construa o ambiente utilizando tiles, sprites, texturas e elementos ambientais integrados ao mapa.
- Reproduza as características visuais presentes nas imagens de referência.
- Mantenha o padrão pixel art das fases anteriores.
- Garanta que entrada, interior e saída pertençam visualmente ao mesmo ambiente.
- Evite imagens estáticas sobrepostas que simulem um cenário.

## 2. Direção artística
Desenvolva uma mina subterrânea visualmente consistente, utilizando elementos como:

- Paredes e formações rochosas.
- Cristais minerais e corrompidos.
- Trilhos de mineração.
- Estruturas de sustentação de madeira.
- Túneis e passagens subterrâneas.
- Iluminação localizada.
- Vegetação corrompida, quando coerente.
- Variações de profundidade, textura e composição ambiental.
Utilize elementos distribuídos ao longo do mapa, evitando repetição excessiva.

O cenário deve transmitir a sensação de exploração de uma mina real dentro do universo do jogo, e não de deslocamento sobre uma ilustração.

## 3. Elementos aprovados que devem ser preservados

- Sprites dos adversários implementados no commit `746d829`.
- Animações dos adversários.
- Atributos e comportamento dos inimigos.
- Imagem de resumo exibida em "Selecionar Fase".
- Mecânicas, missões, progressão e transições existentes.
- Identidade das variantes Abandonada e Corrompida.
Não modifique os adversários novamente.

## 4. Restrições

- Trabalhe na branch `feat/modernizacao-minas-corrompidas`.
- Não reverta integralmente o commit anterior.
- Restrinja as alterações à composição ambiental das Minas.
- Preserve as contribuições de Guilherme.
- Não modifique assets compartilhados de outras fases.
- Preserve a geometria jogável e as colisões existentes, salvo ajustes indispensáveis previamente justificados.
- Não altere o menu ou o seletor de fases.

## 5. Rastreabilidade
Atualize a SPEC da Etapa 9.18, registrando a reprovação visual parcial e a nova direção artística.

Crie um novo registro de prompt:

- Schema:
- Prompt-ID:
- Data:
- Agente: GitHub Copilot
- Modelo:
- Esforço:
- SPEC:
- Commit:
- Execução:
Atualize o diário com a decisão humana e os motivos da revisão.

## 6. Validação e entrega

- Valide as variantes Abandonada e Corrompida.
- Confirme a ausência dos panoramas ilustrativos durante a jogabilidade.
- Confirme que os adversários aprovados permanecem inalterados.
- Execute os testes direcionados, suíte completa, build, gates e git diff --check.
- Disponibilize o servidor local para nova homologação humana.
- Crie um novo commit com os trailers obrigatórios e faça push na mesma branch.
- Não faça merge.
- Não declare aprovação visual antes da minha avaliação.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `modelo confirmado como gpt-6-luna; esforço indisponível`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
