# Registro de prompt: Etapa 9.16 — Atualização de identidade e desvinculação do repositório original

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-18-etapa-9-16-identidade-repositorio`
- Data: `2026-11-18`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-18-etapa-9-16-identidade-repositorio.md`
- Commit: `pendente`
- Execução: `npm run check:gates`, `npm run build`, `npm test -- --runInBand`
  (97 suítes, 1.191 testes), `git diff --check`, auditoria de segredos e
  verificação do manifesto de assets da build aprovados. Primeira execução da
  suíte completa falhou por fixtures temporárias remanescentes de execução
  interrompida; após limpeza específica, a repetição passou.

## Arquivos modificados

- `SPEC/README.md`
- `SPEC/2026-11-18-etapa-9-16-identidade-repositorio.md`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/index.html`
- `docs/diario-de-desenvolvimento.md`
- `prompts/74-etapa-9-16-identidade-repositorio.md`
- `SPEC/README.md`

## Prompt efetivamente recebido

```text
# Etapa 9.16 — Atualização de identidade e desvinculação do repositório original
Estamos trabalhando no fork:

[https://github.com/gguisandim/dsai-ap1-2Drogue](https://github.com/gguisandim/dsai-ap1-2Drogue)

O projeto já recebeu implementações próprias, incluindo auditoria técnica, modernização do menu principal e evolução das fases.

**Objetivo:** identificar e atualizar referências que ainda estejam vinculadas ao desenvolvimento anterior ao fork, garantindo que a documentação, os links e as configurações representem o estado atual do nosso projeto.

## 1. Auditoria inicial
Antes de modificar qualquer arquivo:

1. Leia `AGENTS.md`, `README.md` e as regras de SPEC.
2. Consulte o histórico Git completo, incluindo autores, branches e merges.
3. Identifique quais alterações foram realizadas por Guilherme e quais foram realizadas nas nossas entregas.
4. Examine referências ao repositório original em:

- README e documentação;
- links de demonstração e GitHub Pages;
- badges e URLs;
- `package.json` e configurações do Vite;
- workflows do GitHub Actions;
- documentação de instalação e publicação;
- referências a nomes, autores e identificação do projeto.
Não presuma que toda referência ao projeto original está desatualizada. Diferencie créditos, referências históricas e dependências técnicas de links que realmente precisam ser atualizados.

## 2. README e publicação
Corrija especialmente o link que permite executar o jogo diretamente no navegador.

- Identifique a URL efetiva de publicação do nosso fork.
- Confira o workflow responsável pela publicação.
- Verifique a configuração de base path do Vite e do GitHub Pages.
- Atualize o link de demonstração do README para a publicação do nosso repositório.
- Confira se os caminhos dos assets e recursos funcionam na URL publicada.
- Atualize badges e links que ainda apontem para o repositório anterior.
- Preserve instruções de execução local e documentação técnica válida.
Não invente URLs. Se o GitHub Pages ainda não estiver publicado corretamente, identifique o problema e documente a correção necessária.

## 3. Preservação das implementações
Esta restrição é obrigatória.

- Não sobrescreva implementações de Guilherme.
- Não reverta commits anteriores.
- Não altere fases, mapas, sprites, mecânicas ou sistemas de campanha.
- Não faça refatorações gerais.
- Não reescreva documentos inteiros quando bastar corrigir referências pontuais.
- Não altere autoria ou créditos históricos.
- Não faça cherry-pick, rebase ou merge de branches de terceiros sem necessidade e autorização.
Antes de editar um arquivo, confira seu histórico e identifique se existe trabalho concorrente ou alteração recente de outro desenvolvedor.

Se houver risco de conflito, não modifique o arquivo: relate o problema e solicite minha decisão.

## 4. Rastreabilidade acadêmica
Crie uma SPEC específica para esta etapa e um registro de prompt seguindo o padrão do projeto.

O registro deverá conter:

- Schema:
- Prompt-ID:
- Data:
- Agente:
- Modelo:
- Esforço:
- SPEC:
- Commit:
- Execução:

Registre o modelo efetivamente utilizado, sem presumir valores.

Atualize também o diário de desenvolvimento.

## 5. Validação
Execute:

- `npm run check:gates`
- `npm run build`
- `git diff --check`

Verifique também os links do README, o endereço de publicação, o base path e a integridade dos assets.

Não considere um link funcional apenas porque está sintaticamente correto: confirme a publicação efetiva quando possível.

## 6. Git e entrega

1. Confirme que a árvore de trabalho está limpa.
2. Atualize a `main` antes de criar a branch.
3. Crie `docs/atualizacao-identidade-repositorio`.
4. Faça somente as alterações autorizadas nesta etapa.
5. Crie commits com trailers `Agent` e `Spec`.
6. Faça push e abra uma Pull Request para `main`.
7. Não faça merge automaticamente.

## Resultado esperado

- README apontando para a demonstração do nosso fork.
- Referências antigas atualizadas quando necessário.
- Identidade do projeto consistente.
- Créditos e histórico preservados.
- Nenhuma implementação de Guilherme sobrescrita.
- Documentação e rastreabilidade acadêmica atualizadas.
Ao finalizar, apresente os links corrigidos, arquivos alterados, commits, testes, riscos identificados e URL da Pull Request.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: modelo e esforço indisponíveis nesta execução.
