# Especificações do Umbra Trail

Cada arquivo descreve uma parte do sistema antes do código correspondente entrar no histórico.

## Regra de trabalho

- O nome segue `AAAA-MM-DD-<parte>.md`.
- A data no nome e no título é a data em que a spec foi escrita.
- Cada spec entra em um commit anterior à implementação descrita.
- Ajuste pequeno modifica a spec existente antes do código.
- Mudança de rumo cria uma spec nova, datada, que declara qual documento ou parte substitui.
- Todo critério de aceitação deve ser observável ou verificável por teste, build, inspeção ou execução.
- Código gerado também precisa de spec para o gerador e para o comportamento consumido pelo jogo.

## Ordem histórica

| Data | Parte |
|---|---|
| 2026-09-29 | [Visão geral](./2026-09-29-visao-geral.md) |
| 2026-09-30 | [Combate de jogabilidade](./2026-09-30-combate-jogabilidade.md) |
| 2026-10-01 | [Fases, loja e áudio](./2026-10-01-fases-loja-audio.md) |
| 2026-10-02 | [Fluxo de cenas e interface](./2026-10-02-fluxo-cenas-interface.md) |
| 2026-10-02 | [Personagem, classes e controles](./2026-10-02-personagem-classes-controles.md) |
| 2026-10-02 | [Perfil e configurações](./2026-10-02-perfil-configuracoes-persistencia.md) |
| 2026-10-02 | [Animações e recursos visuais](./2026-10-02-animacao-recursos-visuais.md) |
| 2026-10-03 | [Ondas, versos, combos e invocações](./2026-10-03-ondas-versos-combos-invocacoes.md) |
| 2026-10-03 | [Catálogo e conteúdo](./2026-10-03-catalogo-conteudo.md) |
| 2026-10-05 | [Núcleo de simulação e eventos](./2026-10-05-nucleo-simulacao-eventos.md) |
| 2026-10-05 | [Geração procedural](./2026-10-05-geracao-procedural.md) |
| 2026-10-05 | [Motor de combate, habilidades e efeitos](./2026-10-05-motor-combate-habilidades-efeitos.md) |
| 2026-10-05 | [Progressão entre fases e recursos](./2026-10-05-progressao-fases-recursos.md) |
| 2026-10-06 | [Pacotes de conteúdo gerado](./2026-10-06-pacotes-conteudo-gerado.md) |
| 2026-10-06 | [IA, navegação e táticas](./2026-10-06-ia-navegacao-taticas.md) |
| 2026-10-06 | [Progressão persistente](./2026-10-06-progressao-persistente.md) |
| 2026-10-06 | [Editor e forja de fases](./2026-10-06-editor-forja-fases.md) |
| 2026-10-06 | [Cenários de simulação e qualidade](./2026-10-06-cenarios-simulacao-qualidade.md) |
| 2026-10-06 | [Integração dos sistemas](./2026-10-06-integracao-sistemas.md) |
| 2026-10-06 | [Combate, coletas e bestiário](./2026-10-06-combate-coletas-bestiario.md) |
| 2026-10-06 | [Armas do catálogo](./2026-10-06-armas-catalogo.md) |
| 2026-10-06 | [Entrega, documentação e publicação](./2026-10-06-entrega-documentacao-deploy.md) |
| 2026-10-27 | [Arquitetura de campanha narrativa modular](./2026-10-27-arquitetura-campanha-modular.md) |
