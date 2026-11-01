# Registro de prompt: Etapa 9.7E — UI/UX e localização do World Lab

- Schema: `umbra-prompt-record/v1`
- Prompt-ID: `2026-10-31-etapa-9-7e-reformulacao-ui-ux-localizacao-world-lab`
- Data: `2026-10-31`
- Agente: `Codex`
- Modelo: `desconhecido`
- Esforço: `desconhecido`
- SPEC: `SPEC/2026-10-31-etapa-9-7e-reformulacao-ui-ux-localizacao-world-lab.md`
- Commit: `pendente`
- Execução: `Testes dirigidos do World Lab 38/38; npm run check:gates OK; npm run build OK (typecheck incluído); npm test -- --runInBand com 85 suítes e 1085 testes aprovados; git diff --check OK; homologação visual por CDP em 1280×720, 1440×900 e 1920×1080 (Campanha, Fases/Visual, Fases/Estrutural em 1280 e Comparação).`

## Arquivos modificados

- `SPEC/2026-10-31-etapa-9-7e-reformulacao-ui-ux-localizacao-world-lab.md`
- `SPEC/README.md`
- `README.md`
- `docs/autoria-capitulos-e-assets.md`
- `src/devtools/world-lab/WorldLabProjector.ts`
- `src/devtools/world-lab/WorldLabSnapshot.ts`
- `src/devtools/world-lab/contracts.ts`
- `src/devtools/world-lab/ui/CampaignGraphView.ts`
- `src/devtools/world-lab/ui/MacroCampaignGraphView.ts`
- `src/devtools/world-lab/ui/PhaserPreviewView.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/ui/WorldLabPtBr.ts`
- `src/devtools/world-lab/world-lab.css`
- `src/tests/worldLabLocalization.test.ts`
- `src/tests/worldLabMacroUi.test.ts`
- `src/tests/worldLabUi.test.ts`
- `prompts/49-etapa-9-7e-reformulacao-ui-ux-localizacao-world-lab.md`
- `prompts/50-etapa-9-7e-continuacao-ui-ux-localizacao-world-lab.md`

## Prompt efetivamente recebido

```text
# Etapa 9.7E — Reformulação UI/UX e localização do Umbra World Lab

Reestruture a interface do Umbra World Lab para transformá-la em uma ferramenta de desenvolvimento e direção de arte de fases, com apresentação inteiramente em português brasileiro.

Considere como referência a implementação atual da 9.7D e a captura apresentada pelo usuário.

**Objetivo principal:** priorizar a visualização das fases, reduzir a densidade de informações e tornar a navegação intuitiva, sem remover ferramentas ou alterar o funcionamento dos motores.

## Arquivos principais

- `src/devtools/world-lab/ui/WorldLabApp.ts`
- `src/devtools/world-lab/ui/PhaserPreviewView.ts`
- `src/devtools/world-lab/ui/StageInspectorView.ts`
- Demais componentes e estilos reais do World Lab, a localizar no repositório.
- `docs/art-direction.md`, como referência visual.

## 1. Reorganização da interface

Criar três áreas de trabalho:

**Campanha**
- Grafo como elemento central.
- Seleção e inspeção de nós, rotas e saídas.
- Controles de geração, seed e navegação organizados em uma barra secundária.
- Zoom, pan e ajuste automático à tela.
- Informações detalhadas somente quando solicitadas.

**Fases**
- Preview Phaser real ocupando a maior parte da área central.
- Explorador de conteúdo e camadas em painel lateral recolhível.
- Inspector de propriedades à direita.
- Controles contextuais de variante, zoom, grade e visualização.
- Permitir maximizar a prévia sem perder o estado da seleção.

**Comparação**
- Duas variantes lado a lado, ocupando a região principal.
- Mesmo enquadramento, zoom e dimensões.
- Preservar os recursos de comparação da 9.7D.
- Permitir expandir a comparação e ocultar painéis auxiliares.

Não deixar o grafo ocupar permanentemente a maior parte da tela nos modos Fases e Comparação.

## 2. Layout e estilo

Manter a identidade dark do Umbra Trail, mas desenvolver uma interface mais limpa, próxima de ferramentas profissionais de criação de jogos.

- Barra superior compacta.
- Hierarquia tipográfica consistente.
- Painéis com dimensões flexíveis.
- Inspector com seções recolhíveis.
- Ícones utilizados apenas quando melhorarem a compreensão.
- Estados de hover, seleção e foco discretos.
- Espaçamento confortável e contraste adequado.
- Sem excesso de bordas, cores, gradientes ou efeitos decorativos.
- Eliminar rolagem horizontal desnecessária da barra de ferramentas.
- Garantir funcionamento adequado em 1280×720, 1440×900 e 1920×1080.

Evitar aparência genérica de dashboards gerados por IA. O resultado deve parecer uma ferramenta real de level design.

## 3. Português brasileiro

Traduzir todos os textos visíveis do World Lab:

- Navegação, botões, campos e tooltips.
- Títulos de painéis.
- Estados vazios.
- Mensagens de carregamento e indisponibilidade.
- Diagnósticos e mensagens de erro.
- Descrições de entidades, camadas e propriedades.

Centralizar as mensagens da interface, evitando traduções espalhadas em condicionais.

Não traduzir IDs internos, contratos, nomes de arquivos, query parameters ou formatos persistidos.

## 4. Diagnósticos

Transformar os diagnósticos em painel inferior expansível.

Separar erros, avisos e informações com contadores e filtros.

Exibir mensagens compreensíveis em português e permitir expandir os detalhes técnicos originais.

Manter visíveis problemas importantes de saídas, destinos, assets e compatibilidade. Não ocultar erros apenas porque surgem em fixtures.

Distinguir visualmente dados de demonstração, conteúdo real e problemas do runtime.

## 5. Seleção e inspector

Separar claramente:

- Nó da campanha selecionado.
- Fase visualizada.
- Variante visual selecionada.
- Entidade ou asset inspecionado.

Evitar que o usuário confunda o bioma ou os metadados de um nó com os dados de uma fase diferente.

Preservar o inspector de proporções da 9.7D, organizando os dados em categorias: Geral, Visual, Transformação, Colisão, Origem e Diagnósticos.

## 6. Preservação arquitetural

- Reutilizar o renderer Phaser existente.
- Não criar outro renderer, editor ou sistema de estado concorrente.
- Preservar os modos Estrutural, Visual e Comparação da 9.7D, reorganizando-os conforme a nova navegação.
- Manter compatibilidade com as URLs e parâmetros atuais.
- Não alterar campanhas, saves, colisões, narrativa ou geração procedural.
- Preservar a captura PNG e os descritores reproduzíveis.
- Descartar corretamente previews inativos e evitar instâncias Phaser desnecessárias.

## 7. Validação

Executar testes dirigidos de navegação, seleção, modos de visualização, localização e compatibilidade das URLs.

Realizar homologação visual no navegador nas três resoluções definidas, incluindo os modos Campanha, Fases e Comparação.

Verificar ausência de sobreposições, barras de rolagem indevidas, controles inacessíveis e erros no console.

Manter as validações finais previstas em `AGENTS.md`, sem execuções repetidas desnecessárias.

Registrar SPEC e prompt conforme as regras do repositório.

## Entrega

World Lab reorganizado, inteiramente em português, com foco na visualização artística das fases, navegação mais intuitiva e preservação das ferramentas técnicas.

Apresente um relatório compacto com alterações, evidências visuais, testes e limitações.

Não implemente ainda edição drag-and-drop, biblioteca automática de assets ou geração de cenários por IA.
```

## Observações factuais

- Sessão bruta: `desconhecido`
- Metadados adicionais: `desconhecido`
- Política de commit: use `pendente` antes da consolidação; o gate deriva o
  commit que adicionou este arquivo sem exigir que o registro seja reescrito.
