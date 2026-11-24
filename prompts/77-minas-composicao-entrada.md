# Registro de prompt: Refatoração da composição visual de Minas Corrompidas

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-11-22-minas-composicao-entrada`
- Data: `2026-11-22`
- Agente: `Copilot SDK in VS Code`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-11-22-minas-corrompidas.md`
- Commit: `pendente`
- Execução: capturas Phaser antes/depois das duas variantes PASS (7/7 marcos
  por execução; Edge headless 158.0.4370.33, 1280×720); teste dirigido PASS
  (12/12); `plan validate` OK (0 erros); `validate` OK (0 erros, 1 aviso
  esperado `stage-catalog.excluded.individual-only`); `npm run check:gates`
  OK; `npm run build` OK (871 módulos); `npm test -- --runInBand` PASS
  (100 suítes, 1.222 testes); `git diff --check` OK.

## Arquivos modificados

- `SPEC/2026-11-22-minas-corrompidas.md`
- `src/stages/chapters/minas-corrompidas/minasCorrompidasMap.ts`
- `src/stages/chapters/minas-corrompidas/stage-plan.json`
- `src/tests/minasCorrompidas.test.ts`
- `docs/evidence/minas-composicao-entrada-2026-11-22/README.md`
- `docs/evidence/minas-composicao-entrada-2026-11-22/entrada-abandonada-antes.png`
- `docs/evidence/minas-composicao-entrada-2026-11-22/entrada-abandonada-depois.png`
- `docs/evidence/minas-composicao-entrada-2026-11-22/entrada-corrompida-antes.png`
- `docs/evidence/minas-composicao-entrada-2026-11-22/entrada-corrompida-depois.png`

## Prompt efetivamente recebido

````text
# Umbra Trail — Refatoração da composição visual de Minas Corrompidas
Corrija a composição visual de **Minas Corrompidas**, preservando a arquitetura e a jogabilidade existentes.

## Problema
Atualmente, os panoramas PNG aparecem como retângulos inseridos no tilemap. A perspectiva lateral dos panoramas entra em conflito com a navegação top-down. SVGs, sprites, raízes e estruturas apresentam escalas inconsistentes.

**Quero melhorar a composição do cenário, não apenas reposicionar imagens.**

## 1. Inspeção
Leia `AGENTS.md` e investigue:

- `src/stages/chapters/minas-corrompidas/`
- `src/assets/minas/`
- `src/presentation/assets/minasAssetCatalog.ts`
- Renderer, catálogo de apresentação e gerenciamento de profundidade do Phaser.
Localize os caminhos reais e identifique como cada PNG/SVG é carregado, posicionado, escalado e renderizado.

## 2. Região-piloto
Trabalhe inicialmente **somente na região de entrada da mina**, preservando as variantes Abandonada e Corrompida.

Objetivos:

1. Eliminar as bordas retangulares visíveis dos panoramas.
2. Corrigir a incompatibilidade de perspectiva.
3. Integrar elementos pictóricos à ambientação pixel art.
4. Estabelecer proporções coerentes entre personagem, terreno, raízes, estruturas e objetos.
5. Criar profundidade com camadas de fundo, cenário, objetos e primeiro plano.
6. Reduzir a repetição visual dos tiles quando possível, sem alterar a geometria lógica.

## 3. Decisões artísticas
**Não utilize o PNG panorâmico como uma textura opaca sobre o terreno navegável.**

Se sua perspectiva for incompatível, avalie:

- utilizá-lo como cenário distante;
- reaproveitar partes da composição;
- separar elementos em camadas;
- substituir somente a região incompatível por recursos existentes;
- utilizar os SVGs disponíveis para melhorar a continuidade ambiental.
Não basta aplicar transparência, blur ou filtros para esconder bordas.

Mantenha o jogo top-down. Não transforme o gameplay em side-scroller.

## 4. Camadas e escala
Respeite a ordem de renderização, ancoragem e oclusão.

O personagem deve permanecer visualmente integrado ao terreno.

Objetos precisam ter dimensões coerentes com o mundo, e sua aparência não deve sugerir colisões inexistentes.

Preserve a leitura dos caminhos e áreas interativas.

## 5. Restrições

- Não modificar colisões, missões, NPCs, IA, combate ou progressão.
- Não criar outro renderer.
- Não reescrever o motor.
- Não recriar a fase.
- Não alterar outras regiões nesta primeira entrega.
- Não gerar novos panoramas sem necessidade.
- Não executar commit ou push.

## 6. Validação visual obrigatória

1. Capture a entrada original no Phaser real.
2. Implemente a nova composição.
3. Capture a região novamente, com câmera e escala equivalentes.
4. Inspecione visualmente o resultado.
5. Corrija problemas de perspectiva, escala, bordas, oclusão e integração.
6. Repita para as variantes Abandonada e Corrompida.
Verifique build, testes relevantes e `git diff --check`.

Se não conseguir executar o Phaser ou capturar imagens reais, informe a limitação. Não declare a composição visual homologada sem evidências.

## 7. Resultado esperado
Entregue a região de entrada com apresentação visual coerente, sem PNGs parecendo imagens coladas sobre o tilemap.

Apresente:

- arquivos modificados;
- causa identificada do problema;
- solução implementada;
- capturas antes/depois;
- resultado dos testes;
- recomendações para aplicar o mesmo método às demais seis regiões.
**Não pare na análise: implemente e teste a correção.**
````

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
