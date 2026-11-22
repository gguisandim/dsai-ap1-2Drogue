# Registro de prompt: redesign autoral das classes jogáveis

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-18-redesign-classes-amazonicas`
- Data: `2026-11-18`
- Agente: `Codex`
- Modelo: `GPT-5`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-18-redesign-classes-amazonicas.md`
- Commit: `pendente`
- Execução: `assets gerados e homologados; 8 vitrines Phaser PASS em Igapó e Jardins; testes dirigidos OK (4 suítes, 57 testes); check:gates OK (939 arquivos, 3426 dependências; 71 registros v1); build OK (812 módulos); npm test -- --runInBand OK (98 suítes, 1198 testes); auditoria de segredos OK; git diff --check OK`

## Arquivos modificados

- `SPEC/2026-11-18-redesign-classes-amazonicas.md`
- `SPEC/README.md`
- `docs/evidence/player-classes`
- `prompts/74-redesign-classes-amazonicas.md`
- `scripts/generate-player-class-assets.mjs`
- `scripts/homologate-chapter.mjs`
- `src/assets/player-classes`
- `src/data/ClassDatabase.ts`
- `src/presentation/assets/bootPlayerClassAssets.ts`
- `src/presentation/assets/playerClassAssetCatalog.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/CharacterCreatorScene.ts`
- `src/scenes/GameScene.ts`
- `src/tests/playerClassAssets.test.ts`

## Prompt efetivamente recebido

```text
Umbra Trail — Redesign autoral das 4 classes jogáveis com identidade amazônica e florestal
Quero iniciar a próxima etapa de evolução visual do Umbra Trail: substituir a aparência genérica dos personagens jogáveis por uma identidade autoral coerente com a nova direção artística do projeto, especialmente com a Floresta das Raízes, o Igapó das Memórias e os Jardins das Flores Veladas.

O foco desta etapa é o redesign das 4 classes jogáveis, preservando sua função no gameplay, mas redefinindo sua aparência para que tenham um caráter mais amazônico, florestal, místico e territorial, em vez de fantasia genérica.
1. Objetivo central
Redesenhar visualmente as 4 classes do jogador para que cada uma tenha:
- silhueta própria;
- identidade funcional clara;
- coerência com a ambientação do Umbra Trail;
- relação visual com floresta, rios, raízes, fauna, flora e espiritualidade amazônica;
- visual autoral, não genérico.
O resultado deve fazer o jogador sentir que está controlando personagens que pertencem a esse mundo, e não apenas avatares RPG reutilizados.
2. Direção artística das classes
As 4 classes devem ser reinterpretadas dentro de uma lógica de fantasia amazônica.

Isso não significa copiar povos reais de forma literal nem transformar tudo em fantasia tribal rasa.

A proposta é usar referências de:
- floresta densa;
- igarapés e igapós;
- cipós, raízes, sementes, flores, fungos e cascas;
- caça, deslocamento, coleta, ritual e sobrevivência;
- guardiões, espíritos, vestígios e forças naturais;
- artefatos orgânicos, madeira, fibra, osso, pedra, sementes, penas e resinas;
- relação entre corpo, território e natureza.
Cada classe precisa parecer parte do mesmo mundo, mas com leitura visual distinta.
3. Interpretação temática das 4 classes
Antes de desenhar, identifique as 4 classes jogáveis atuais no código e entenda sua função real em gameplay.

Depois, reinterprete cada uma com estética amazônica/florestal.
Regras para a releitura
Cada classe deve manter sua função mecânica, mas ganhar uma nova linguagem visual.

Exemplos de direção desejada:
- uma classe mais resistente pode remeter a guardião da mata, com casca, fibras, escudos orgânicos, raízes ou madeira viva;
- uma classe mais ágil pode remeter a caçador da mata, deslocamento leve, adornos naturais, leitura de trilha, relação com aves ou felinos;
- uma classe mágica pode remeter a condutor espiritual, plantas de poder, sementes, pigmentos, ornamentos rituais, luz e energia natural;
- uma classe ofensiva ou técnica pode remeter a guerreiro de fronteira da floresta, com ferramentas, lâminas orgânicas, instrumentos híbridos e marcas de combate.
Esses exemplos não são obrigatórios, mas apontam o tipo de identidade esperada.

O mais importante é que as quatro classes tenham:
- papel visual distinguível;
- relação forte com o ecossistema do jogo;
- unidade estética entre si.
4. O que evitar
Evitar:
- fantasia medieval genérica;
- cavaleiro padrão, mago padrão, arqueiro padrão;
- excesso de armadura metálica sem justificativa;
- visual urbano ou tecnológico desconectado do mundo;
- copiar visualmente povos indígenas reais de maneira literal ou caricatural;
- apenas recolorir o mesmo sprite para quatro classes;
- apenas pintar o personagem de verde e chamar isso de “amazônico”.
A inspiração deve ser ambiental e mística, não estereotipada.
5. Inspeção técnica inicial
Antes de alterar qualquer asset:
1. Localize os sprites atuais das 4 classes jogáveis.
2. Identifique:
   - dimensões dos sprites;
   - número de frames;
   - direções de movimento;
   - animações existentes;
   - pontos de ancoragem;
   - escala aplicada;
   - hitboxes;
   - integração com combate e seleção de classe.
3. Inspecione:
   - src/assets/puny/
   - catálogos de assets e presentation
   - carregamento Phaser
   - testes ligados aos personagens
   - seleção de classes e runtime
4. Verifique se os personagens usam uma base comum ou pipelines distintos.
6. Entrega visual esperada
Crie um conjunto autoral consistente para as 4 classes.

Cada classe deve ter:
- sprite principal redesenhado;
- spritesheet funcional;
- silhueta clara;
- paleta própria;
- roupas, adornos e equipamentos coerentes com sua função;
- integração com as animações já suportadas.
Se necessário, utilize:
- pixel art refinada para o personagem jogável;
- PNG/SVG para retratos, detalhes, efeitos ou elementos complementares;
- assets autorais documentados.
A base jogável deve continuar legível no mapa e compatível com a câmera do jogo.
7. Escopo funcional
Redesenhar apenas os personagens jogáveis nesta etapa.

Não redesignar ainda:
- NPCs;
- monstros;
- chefes;
- retratos de todos os diálogos;
- interface de usuário.
No máximo, se necessário, criar uma base para retratos das classes jogáveis.
8. Restrições técnicas
- Não criar outro sistema de personagens.
- Não alterar o motor de combate sem necessidade real.
- Não quebrar movimentação, colisão ou seleção de classes.
- Não mudar hitboxes por motivos puramente estéticos, a menos que haja justificativa técnica clara.
- Não remover os sprites antigos antes de comprovar a estabilidade dos novos.
- Não adicionar dependências pesadas desnecessárias.
- Não alterar NPCs e inimigos nesta etapa.
Se for preciso aumentar a resolução base do sprite, faça isso somente se for compatível com:
- câmera;
- escala;
- animações;
- legibilidade em jogo;
- performance.
9. Homologação obrigatória
Após implementar:
1. Verificar as 4 classes no Phaser real.
2. Testar:
   - movimento;
   - idle;
   - caminhada;
   - ataque;
   - leitura visual em mapa;
   - coerência com pelo menos duas fases diferentes.
3. Produzir capturas:
   - folha comparativa das 4 classes;
   - antes/depois;
   - gameplay em Floresta das Raízes;
   - gameplay em Igapó ou Jardins.
4. Confirmar que as classes continuam visualmente reconhecíveis em ambientes claros e escuros.
10. Validação
Executar:
- npm run check:gates
- npm run build
- npm test -- --runInBand
- git diff --check
Se houver testes específicos de assets, sprites, carregamento ou apresentação, executá-los também.
11. Entrega
Entregar:
- arquivos alterados;
- resumo da nova identidade visual das 4 classes;
- explicação de como cada classe foi reinterpretada em chave amazônica/florestal;
- descrição das diferenças entre as classes;
- evidências visuais;
- resultado da homologação;
- limitações restantes.
Registrar nova SPEC e novo prompt conforme as convenções do projeto.

Não executar commit, push, reset ou clean.
Critério de sucesso
As 4 classes jogáveis devem sair de uma aparência genérica e passar a ter uma identidade autoral, amazônica, florestal e coerente com Umbra Trail, mantendo legibilidade, função mecânica e compatibilidade com o jogo atual.

Não considerar a tarefa concluída apenas porque os testes passam.
A mudança precisa ser visível, funcional e artisticamente convincente.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: geração raster executada com a ferramenta integrada OpenAI ImageGen; modelo de geração exato desconhecido. Homologação visual executada no Phaser real com Microsoft Edge headless 157 por CDP, nas fases `stage.aguas.igapo-das-memorias` e `level_08_paradiso`.
- Política de commit: nenhum commit autorizado pelo prompt; `Commit: pendente` permanece literal.
