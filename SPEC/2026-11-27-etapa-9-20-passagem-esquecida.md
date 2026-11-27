# A Passagem Esquecida — Etapa 9.20

## Diagnóstico

`level_01_forgotten_passage` tem quatro câmaras ligadas por corredores e
marcadores de entrada e saída, mas usa texturas legadas repetidas e carece de
decorações locais. Minas Corrompidas usa atlas próprios e contraste localizado.
Igapó e Floresta das Raízes usam detalhes distribuídos pelo terreno e efeitos
atmosféricos. A Passagem manterá sua identidade de cripta, com alvenaria de
basalto, juntas gastas, musgo frio e luz âmbar que marca portas e transições.

## Contrato

- Preservar ID, capítulo, layout legado, mapa lógico, colisões, encontros,
  hitboxes, itens, saída, áudio e progressão. Nenhuma outra fase muda.
- Aplicar atlas pixel art de piso, parede e pilar com variantes determinísticas
  do renderizador existente. Usar adereços de escala local em camadas e efeitos
  animados limitados por câmara. A composição usa o mesmo caminho no jogo, no
  World Lab e na captura Phaser. O ciclo de vida permanece no renderizador.
- Introduzir composição de adereços por regiões com seleção determinística,
  ocupação exclusiva, exclusão de pontos reservados e validação de tiles.
  Reutilizar contratos, variantes, efeitos, paletas e carregamento existentes.
- Usar adversários pixel art existentes com animações de movimento, ataque e
  dano. Preservar o ciclo de morte do runtime e os parâmetros de combate.
- Regenerar apenas o PNG de resumo da Passagem pelo pipeline da Etapa 9.19.
  Comparar com o PNG anterior, que também é uma captura real do Phaser.

## Validação

- Testes de determinismo, restrições da composição, integridade lógica,
  isolamento da fase, resolução de visuais e catálogo de capturas.
- Comparar custo de composição com volume de tiles, adereços e efeitos e
  registrar separadamente medições de runtime quando disponíveis.
- Executar testes dirigidos, gates, build, suíte completa, auditoria de
  segredos, validação Pages e verificação de whitespace. A homologação visual
  humana permanece pendente.
