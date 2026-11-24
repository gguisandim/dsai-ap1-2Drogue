# Registro de prompt: Deploy do Umbra Trail no GitHub Pages

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-24-deploy-github-pages`
- Data: `2026-11-24`
- Agente: `Codex`
- Modelo: `GPT-5`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-06-entrega-documentacao-deploy.md`
- Commit: `pendente`
- Execução: `pendente`

## Arquivos modificados

- `SPEC/2026-10-06-entrega-documentacao-deploy.md`
- `prompts/78-deploy-github-pages.md`
- `.github/workflows/publicar-pages.yml`
- `vite.config.ts`
- `src/devtools/world-lab/ui/PhaserPreviewView.ts`
- `src/tests/worldLab.test.ts`
- `README.md`

## Prompt efetivamente recebido

````text
Configure o deploy do Umbra Trail no GitHub Pages.



**Repositório:** `gguisandim/dsai-ap1-2Drogue`

### Requisitos

- Analise a estrutura atual do repositório e os workflows existentes.
- Configure o GitHub Actions para compilar e publicar o jogo, em vez do README.
- Ajuste o base path do Vite para `/dsai-ap1-2Drogue/`.
- Garanta o carregamento correto dos sprites, mapas, texturas, áudios e demais assets do Phaser.
- Preserve o funcionamento local e do World Lab.
- Configure o CI/CD para executar automaticamente a cada push na branch `main`, independentemente de quem realizou o commit.
- Garanta que as dependências sejam instaladas, o projeto compilado e os artefatos de produção publicados automaticamente.
- Inclua o `workflow_dispatch` para permitir execuções manuais quando necessário.
- Garanta que falhas de compilação não substituam a última versão publicada com sucesso.
- Evite conflitos entre deploys simultâneos.
- Atualize o link de publicação no README.
- Documente o processo de publicação e manutenção na SPEC correspondente.

### Validação e entrega

- Execute o build e os testes existentes.
- Valide os arquivos gerados e os caminhos dos assets.
- Verifique se o endereço `https://gguisandim.github.io/dsai-ap1-2Drogue/` abre diretamente o jogo.
- Confirme que futuras atualizações serão compiladas e publicadas automaticamente, sem intervenção manual.
- Realize o commit seguindo o padrão do repositório, identificando o agente Codex e a SPEC correspondente, e faça o push.

**Restrições:** não altere mecânicas, fases, narrativa, interfaces ou funcionalidades existentes. Restrinja as modificações à infraestrutura de build, CI/CD, publicação e documentação.
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
