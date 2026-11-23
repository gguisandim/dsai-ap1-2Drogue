# Ajustes do menu e pré-visualização das fases — Etapa 9.17

**Data:** 2026-11-23
**Estado:** especificação anterior à implementação.

## Objetivo

Adicionar a identidade textual solicitada ao menu principal, retirar a
navegação de Créditos da interface principal e fazer o seletor de fases
apresentar uma imagem própria ou uma prévia existente por tema.

## Diagnóstico

O seletor resolve prévias por `ResolvedStagePresentation`: prefere uma decoração
da camada `background`, depois um tile de piso declarado. Essa resolução não
separa uma arte temática de resumo de um tile genérico. Além disso, algumas
fases não declaram fundo próprio e dependem do piso. Há textos legados e um
registro `CreditsScene` ainda acessível pela configuração da cena principal,
embora não faça parte do conteúdo narrativo, dos saves ou dos créditos
documentais.

Os assets existentes cobrem as fases autorais:

- Raiz do Mundo: composições e piso em `src/assets/world-root/`;
- Igapó das Memórias e Coração Corrompido: pisos e ilustrações em
  `src/assets/aguas/`;
- Jardins das Flores Veladas: canopy e tiles em `src/assets/flores/`;
- Minas Corrompidas: panoramas em `src/assets/minas-corrompidas/`;
- Palácio do Credor: canopy e piso em `src/assets/palacio/`.

As fases legadas não possuem panoramas próprios; continuarão usando o piso
legado já existente como prévia, sem criação de arte genérica ou substituição
de assets.

## Escopo

1. Trocar o rótulo visível e as referências visuais de `NOVA CAMPANHA` para
   `NOVO JOGO`, sem trocar a ação de início, a confirmação de substituição ou
   as chaves de save.
2. Remover o botão `CRÉDITOS` de `MenuScene`, remover a transição registrada
   nessa cena e não registrar `CreditsScene` no catálogo de cenas da aplicação.
   Manter `CreditsScene`, seus créditos históricos e a documentação existentes
   sem alterar autoria ou atribuições.
3. Corrigir `resolveStagePreview` para rejeitar texturas genéricas como resumo
   e priorizar arte temática disponível. Preservar o tile de piso como
   alternativa quando não houver fundo. A resolução deve continuar verificando
   a existência da textura no cache do Phaser.
4. Cobrir a resolução com testes headless para fundo próprio, fundo genérico,
   piso alternativo e ausência de textura.

Não entram no escopo: criação de novos sprites/imagens, alterações de mapas,
saves, progressão, mecânicas, combate, campanha, workflow ou configuração do
GitHub Pages.

## Critérios observáveis

1. `MenuScene` exibe `NOVO JOGO` e executa exatamente a ação que antes
   pertencia a `NOVA CAMPANHA`, incluindo confirmação de save existente.
2. `CRÉDITOS` não aparece no menu principal, nenhuma opção aponta para
   `CreditsScene` e `CreditsScene` não está registrada como cena navegável.
3. Ao selecionar uma fase autoral, o seletor usa uma textura temática existente:
   - Flores usa canopy pictórica ao invés de `puny_world`;
   - Minas usa um panorama existente;
   - Palácio usa canopy existente;
   - Raiz usa o piso existente do capítulo;
   - Igapó usa o piso existente do capítulo.
4. Fases legadas usam o tile legado já carregado, sem promessas de arte própria;
   ausência de textura continua exibindo `PRÉVIA VISUAL INDISPONÍVEL`.
5. Continuar, selecionar fase e iniciar fase preservam comportamento e saves.

## Validação

- Testes dirigidos de navegação do menu e resolução de prévias.
- Verificação visual do menu e das fases em navegador.
- `npm run check:gates`
- `npm run build`
- `npm test -- --runInBand`
- `git diff --check`
