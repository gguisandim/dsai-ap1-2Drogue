# Entrega, documentação e publicação *(2026-10-06)*

## O quê e por quê

O projeto precisa apresentar, na raiz do repositório, evidências verificáveis de que o jogo está publicado, documentado, especificado e auditável. A documentação de entrega deve permitir que o professor abra o jogo, confira a contagem de código, encontre as especificações e consulte as sessões brutas sem depender de explicações externas.

## Critérios de aceitação

- o `README.md` da raiz contém uma URL pública clicável para o jogo
- a URL pública responde com sucesso depois da publicação
- o projeto possui publicação automatizada da pasta `dist` no GitHub Pages
- o `README.md` lista a ferramenta de IA, o modelo e o nível de raciocínio usados
- o `README.md` identifica os dois integrantes e seus perfis do GitHub
- o `README.md` reproduz o comando oficial do `cloc` e sua saída completa
- o `README.md` separa as linhas dos testes das demais linhas de código
- a saída registrada do `cloc` possui pelo menos 100 mil linhas de código, sem contar dependências, builds, prompts, Markdown, JSON, YAML, CSV, texto, SVG, locks ou arquivos minificados
- o `README.md` resume, para a apresentação, as quantidades de specs, prompts, sessões, suítes, testes e o ritmo de horas declarado pela dupla
- o `README.md` aponta para o índice das specs e para `prompts/sessoes/`
- as sessões brutas permanecem preservadas, com arquivos grandes compactados em gzip e hashes documentados
- cada commit produzido a partir desta spec contém os trailers `Agent:` e `Spec:`
- uma auditoria automática do conteúdo versionado não encontra chaves de API, senhas, tokens conhecidos, chaves privadas ou arquivos `.env`
- esta spec aparece no histórico antes do workflow de publicação e do `README.md` da raiz

## Fora do escopo

Reescrever commits históricos publicados antes da adoção dos trailers, pois isso alteraria todos os hashes e exigiria `force push`. Os trailers passam a ser obrigatórios a partir desta especificação.

## Adendo de manutenção do GitHub Pages *(2026-11-24)*

### Objetivo

A publicação oficial do repositório `gguisandim/dsai-ap1-2Drogue` deve entregar
a build Vite do Umbra Trail em
`https://gguisandim.github.io/dsai-ap1-2Drogue/`, sem depender da publicação do
README ou de uma execução manual. O processo deve continuar compatível com o
servidor local e com o Umbra World Lab.

### Processo de publicação e manutenção

1. Todo push na branch `main`, independentemente do autor, e toda execução
   manual por `workflow_dispatch` iniciam o workflow de Pages.
2. O job instala exatamente o lockfile com `npm ci`, executa gates, testes e a
   build antes de preparar o artefato `dist`.
3. Apenas uma build aprovada pode ser enviada e implantada pelo ambiente
   `github-pages`. Se instalação, gates, testes ou build falharem, o upload e o
   deploy não são executados, preservando a última publicação bem-sucedida.
4. Execuções concorrentes usam um grupo exclusivo de Pages; uma execução mais
   nova cancela a anterior para impedir que um artefato antigo vença a corrida.
5. O Vite usa `/dsai-ap1-2Drogue/` como base somente na build de produção. Em
   desenvolvimento, a raiz `/` permanece disponível, inclusive em
   `/world-lab.html`.
6. Para manutenção, alterações no nome do repositório exigem atualizar em
   conjunto o base path do Vite, a URL pública do README e estes critérios. As
   versões das actions devem permanecer fixadas por versão principal suportada.

### Critérios de aceitação observáveis

- `vite build` gera `dist/index.html` com scripts e estilos sob
  `/dsai-ap1-2Drogue/assets/`;
- sprites, mapas, texturas, áudios e demais recursos importados pelo runtime são
  emitidos no artefato e suas referências não apontam para a raiz do domínio;
- `vite dev` continua servindo o jogo em `/` e o World Lab em
  `/world-lab.html`;
- a prévia Phaser aberta pelo World Lab preserva o pathname base do documento,
  funcionando tanto localmente quanto sob o subdiretório do Pages;
- o workflow possui gatilhos `push` para `main` e `workflow_dispatch`, permissões
  mínimas para Pages, concorrência exclusiva, instalação por `npm ci`, validação,
  build, upload de `dist` e deploy posterior ao upload;
- o README aponta para
  `https://gguisandim.github.io/dsai-ap1-2Drogue/` e documenta o fluxo automático
  e manual de manutenção;
- os testes automatizados de infraestrutura inspecionam o contrato de base path,
  o workflow e a URL de prévia do World Lab;
- `npm run check:gates`, `npm run build`, `npm test -- --runInBand` e
  `git diff --check` concluem sem falhas;
- após o push, o workflow conclui com sucesso e a URL pública responde com o
  HTML do jogo, não com o README.

### Fora do escopo do adendo

Mecânicas, fases, narrativa, interfaces, assets e funcionalidades do jogo não
são alterados. O World Lab permanece ferramenta de desenvolvimento e não passa
a integrar a entrada de produção.
