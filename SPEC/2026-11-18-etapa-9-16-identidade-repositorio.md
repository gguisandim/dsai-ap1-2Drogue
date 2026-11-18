# Atualização de identidade e desvinculação do repositório original — Etapa 9.16

**Data:** 2026-11-18  
**Status:** especificada antes da implementação.

## Contexto

O fork `gguisandim/dsai-ap1-2Drogue` manteve no README o endereço do GitHub Pages
do repositório anterior. A configuração verificada aponta para publicação do
projeto por GitHub Actions, mas, na auditoria, o endereço do fork respondeu
HTTP 404, a API de Pages não retornou configuração e não havia execuções do
workflow nem deployments. Portanto, a URL convencional do projeto do fork pode
ser indicada como destino pretendido, mas não deve ser apresentada como uma
publicação já funcional.

O projeto também mantém o nome anterior no título HTML e nos metadados npm.
Créditos, registros históricos e o remoto `upstream` identificam autoria e
procedência; não são referências desatualizadas e devem ser preservados.

## Escopo

- Atualizar os links de execução do README para
  `https://gguisandim.github.io/dsai-ap1-2Drogue/`.
- Informar no README que o endereço ainda não está publicado e que a publicação
  depende de configurar GitHub Pages com **GitHub Actions** e executar o
  workflow existente na branch `main`.
- Confirmar, sem modificar, que o workflow publica a branch `main` e que
  `vite.config.ts` usa `base: './'`, compatível com o caminho de projeto do
  GitHub Pages e com assets emitidos como caminhos relativos.
- Atualizar o título do documento HTML e o nome do pacote privado para
  `umbra-trail`, mantendo `package.json` e `package-lock.json` consistentes.
- Criar o registro de prompt exigido pelo processo e registrar esta etapa no
  diário de desenvolvimento.

Não fazem parte do escopo: alterações em fases, mapas, sprites, mecânicas,
campanha, workflow de publicação, configuração de Vite, créditos, histórico,
sessões de prompt ou remoto `upstream`.

## Critérios de aceitação

1. Os links de jogo do README apontam para o endereço do fork; nenhum deles
   aponta para `icspingu.github.io`.
2. O README declara claramente que a publicação do fork não foi confirmada e
   descreve a ação necessária para publicá-la, sem afirmar que o link funciona.
3. A inspeção do repositório confirma que o workflow existente publica em
   GitHub Pages após push na `main` ou execução manual e que o build usa base
   relativa; a build concluída contém referências relativas para os recursos
   empacotados.
4. `package.json`, `package-lock.json` e o título de `src/index.html` identificam
   o projeto como Umbra Trail.
5. Os créditos de Guilherme, os registros históricos do repositório anterior e
   o remoto `upstream` permanecem inalterados.
6. As instruções de instalação e execução local permanecem disponíveis.
7. O diário e o registro de prompt seguem o processo de rastreabilidade do
   repositório, e os gates aprovam esses registros.

## Validação

- `npm run check:gates`
- `npm run build`
- `npm test -- --runInBand`
- `git diff --check`
- Inspeção dos links e dos recursos na build; verificação HTTP do endereço
  publicado quando disponível. Se o Pages continuar sem configuração ou
  deployment, documentar o HTTP/status observado e não declarar a publicação
  funcional.
