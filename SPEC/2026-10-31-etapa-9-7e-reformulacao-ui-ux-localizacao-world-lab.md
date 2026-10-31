# Etapa 9.7E — Reformulação UI/UX e localização do Umbra World Lab

**Data:** 2026-10-31

**Estado:** especificação anterior à implementação

**Continuidade:** sucede a Etapa 9.7D. Reorganiza a interface e sua linguagem,
sem substituir o renderer Phaser, os contratos visuais, a sessão do World Lab,
os snapshots, a captura reproduzível ou os pipelines de campanha e fase.

## Objetivo

Transformar o World Lab em uma ferramenta de desenvolvimento e direção de arte
legível em português brasileiro, com a fase ou o grafo como foco contextual e
detalhes técnicos apresentados progressivamente.

## Áreas de trabalho

Uma navegação primária expõe três áreas sem criar outro estado de domínio:

- **Campanha:** grafo central, geração, seed, seleção de nós/rotas/saídas,
  pan, zoom e ajuste à tela;
- **Fases:** preview Phaser real ou modo estrutural como área principal,
  explorador de camadas recolhível e inspector à direita;
- **Comparação:** duas variantes da mesma fase lado a lado, com mesmo viewport,
  zoom e câmera inicial.

O estado existente de sessão continua sendo a fonte de seed, documento,
seleção, filtros e diagnósticos. A área ativa, painéis recolhidos, maximização e
filtros de diagnóstico são estado estritamente local da UI.

As URLs 9.7D continuam válidas. `view=visual` abre Fases, `view=compare` abre
Comparação e a ausência do parâmetro abre Campanha. `stage`, `stagePreview`,
`presentationVariant`, `comparisonVariant` e `zoom` preservam sua semântica.

## Estrutura da interface

- barra superior compacta com marca e navegação primária;
- barra contextual secundária, diferente por área de trabalho;
- centro flexível com foco no grafo ou preview;
- explorador lateral recolhível nas áreas de fase;
- inspector à direita, com seções `details` nativas recolhíveis;
- painel inferior de diagnósticos expansível, com contadores e filtros;
- ações de expandir/recolher painéis e maximizar conteúdo sem descartar a
  seleção atual.

Alternar de área desmonta os iframes de preview inativos por
`replaceChildren`, evitando instâncias Phaser ocultas. Voltar à área reconstrói
o preview a partir do mesmo estado de sessão.

## Localização

Todo texto de interface fica centralizado em um catálogo tipado de português
brasileiro. O catálogo cobre navegação, ações, rótulos, tooltips, estados
vazios, camadas, propriedades, severidades e mensagens conhecidas.

IDs, códigos de diagnóstico, nomes de arquivo, contratos, query parameters e
formatos persistidos permanecem inalterados. Diagnósticos exibem uma mensagem
portuguesa compreensível e permitem revelar mensagem, origem, código, caminho e
referências técnicas originais.

## Diagnósticos

O painel inferior:

- conta erros, avisos e informações;
- filtra por severidade sem remover dados da sessão;
- permanece visível quando recolhido por meio de um resumo;
- não oculta falhas de fixture;
- distingue `fixture`, conteúdo registrado e runtime por rótulo de contexto;
- permite selecionar o diagnóstico e expandir detalhes técnicos.

## Seleção e inspector

Cabeçalhos e rótulos distinguem explicitamente nó selecionado, fase
visualizada, variante ativa e asset/entidade inspecionado. O inspector usa as
categorias:

1. Geral;
2. Visual;
3. Transformação;
4. Colisão;
5. Origem;
6. Diagnósticos.

O inspector de proporções da 9.7D permanece disponível. Metadados ausentes são
marcados como indisponíveis; não são inferidos de outro nó ou outra fase.

## Responsividade e estilo

O layout dark preserva a identidade Umbra Trail, reduz bordas e cores
decorativas e usa espaçamento/tipografia consistentes. Em 1280×720, 1440×900 e
1920×1080:

- a barra superior não cria rolagem horizontal;
- controles contextuais quebram em linhas quando necessário;
- conteúdo principal permanece acessível;
- painéis não se sobrepõem;
- a área central pode ser maximizada;
- layouts estreitos recolhem painéis auxiliares antes de reduzir o preview.

## Compatibilidade e limites

- não há novo renderer, editor, asset manager ou sistema de estado;
- Phaser continua sendo a renderização real;
- SVG estrutural, captura PNG e descritor 9.7D são preservados;
- campanhas, saves, mapas, colisões, narrativa, procedural e gameplay não são
  modificados;
- snapshots `umbra-world-lab/v1` continuam legíveis;
- não há drag-and-drop, biblioteca automática ou geração de cenários por IA.

## Critérios observáveis

1. A navegação primária alterna Campanha, Fases e Comparação sem perder seed,
   fase, variante ou seleção.
2. O grafo deixa de ocupar espaço nas áreas Fases e Comparação.
3. Fases mostra um preview grande e Comparação mostra dois previews equivalentes.
4. O modo Estrutural continua acessível na área Fases.
5. Painéis auxiliares são recolhíveis e a área principal pode ser maximizada.
6. Trocar de área remove iframes inativos do DOM.
7. Todos os textos visíveis próprios do World Lab estão em português brasileiro
   e são obtidos do catálogo central.
8. IDs, códigos, parâmetros e snapshots não são traduzidos.
9. Diagnósticos apresentam contadores, filtros e detalhes técnicos expansíveis.
10. O inspector separa nó, fase, variante e asset e organiza proporções nas seis
    categorias previstas.
11. URLs da 9.7D abrem a área e seleção correspondentes.
12. O layout não apresenta sobreposição ou rolagem horizontal indevida nas três
    resoluções de homologação.
13. Campanha, Fases e Comparação passam por homologação real no navegador;
    console só é declarado limpo quando houver evidência verificável.
14. Gates, build, testes completos e `git diff --check` passam.

## Testes previstos

- catálogo de localização e ausência de rótulos ingleses conhecidos;
- navegação entre as três áreas e preservação de estado;
- compatibilidade de URLs e parâmetros 9.7D;
- montagem/desmontagem de previews e maximização;
- filtros, contadores e detalhes de diagnóstico;
- inspector categorizado e filtros de camadas;
- regressão de SVG estrutural, captura e snapshots;
- homologação visual em 1280×720, 1440×900 e 1920×1080.

## Limitações

- redimensionamento livre de painéis por arraste fica fora desta etapa;
- sincronização interativa de pan das duas câmeras continua futura;
- localização cobre a ferramenta World Lab, não títulos autorais/IDs vindos dos
  capítulos nem todo o jogo.
