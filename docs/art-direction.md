# Direção de arte do Umbra Trail

Este guia define a referência visual comum do jogo. Ele orienta pacotes e
capítulos diferentes sem obrigá-los a compartilhar o mesmo tileset.

## Linguagem global

- A perspectiva principal é **pixel art top-down**. Recursos neutros podem ser
  usados se sua silhueta, luz e leitura forem compatíveis com essa perspectiva.
- O tile lógico mede **32×32 unidades do mundo**. Uma fonte 16×16 normalmente é
  exibida em 2×, com nearest-neighbor e alinhamento a coordenadas inteiras.
- O tamanho da textura não define o tamanho lógico. Registrar separadamente:
  imagem de origem, frame, região alfa visível, escala no mundo, âncora e body de
  colisão. Margens transparentes não devem distorcer comparações de proporção.
- Personagens devem permanecer legíveis ao lado de um tile e entre obstáculos.
  Vegetação baixa e props podem ocupar de meio a dois tiles. Árvores,
  construções e marcos podem exceder vários tiles e devem usar a classe
  `oversized`; nunca comprimir um marco só para fazê-lo caber em 32×32.
- Escala visual normaliza pacotes. Ela não modifica hitbox, offset, física,
  passabilidade ou geometria do mapa.

## Alinhamento, âncoras e camadas

Tiles cobrem exatamente a célula lógica. Objetos com base devem se alinhar pelo
ponto de contato com o chão; elementos suspensos podem usar âncora central. Toda
âncora declarada usa coordenadas normalizadas de 0 a 1.

Ordem recomendada:

1. `background`: água distante, névoa e elementos sem contato;
2. `terrain`: piso, raízes baixas, passarelas e objetos sob os personagens;
3. atores e props interativos, ordenados por profundidade coerente;
4. `foreground`: copas, folhagem frontal, partículas e oclusores suaves.

O foreground não deve esconder rotas, inimigos ou pontos de interação. Evite
misturar sombras laterais fortes com assets iluminados de cima e não combine
isométrico ou side-view com top-down sem uma adaptação autoral explícita.

## Paleta, contraste e iluminação

- Cada bioma define uma base cromática, um destaque de navegação e um destaque
  de ameaça. O personagem e os elementos interativos precisam se separar do
  terreno em luminância ou matiz.
- Luz ambiental estabelece atmosfera; tint não substitui material, silhueta ou
  detalhe. Preserve contraste local sob neblina e efeitos.
- Saturação alta é reservada a foco, coleta, magia e ameaça. Evite aplicar o
  mesmo pico de saturação a todo o cenário.
- Variações de pacote são compatíveis quando compartilham densidade de pixel,
  perspectiva, direção de luz, contorno e escala aparente. Diferenças que pedem
  deformação não uniforme, blur, rotação de perspectiva ou contorno conflitante
  indicam recurso incompatível.

## Animações e spritesheets

- Frames de uma animação mantêm canvas, âncora, direção e massa visual estáveis.
- Declare `frameWidth`, `frameHeight` e `frameCount`; todo frame referenciado
  deve estar no intervalo. Preserve transparência e use nearest-neighbor.
- Não estique um eixo independentemente. Para normalizar, use escala uniforme e
  recorte alfa documentado. Ataque e hurt não podem deslocar permanentemente o
  ponto de apoio do personagem.
- Metadados de colisão no contrato visual são somente informativos. O body real
  continua sob responsabilidade das entidades existentes.

## Compatibilidade e revisão

O inspector automático verifica integridade, dimensões, frames, perspectiva e
faixas objetivas de proporção. `oversized` evita alertas indevidos para árvores
e estruturas. A ferramenta não avalia beleza, identidade cultural, composição
ou qualidade de ilustração; esses itens exigem revisão humana no Phaser real.

Rejeite ou adapte um asset quando houver perspectiva incompatível, pixels de
tamanhos visivelmente diferentes, luz conflitante, deformação não uniforme,
âncora instável, frames cortados ou necessidade de alterar hitbox para fazê-lo
parecer correto.

## Referência: Igapó das Memórias

### Identidade

O Igapó é uma floresta amazônica inundada: água presente entre áreas de terra,
raízes expostas, vegetação densa, copas sobrepostas, passarelas e pequenas zonas
firmes. A leitura deve ser úmida, orgânica e fechada, sem perder corredores de
movimento.

Personagens usam aproximadamente uma célula de base aparente. Vegetação baixa
fica próxima de um tile; árvores, copas e raízes podem alcançar dois ou mais e
são intencionalmente `oversized`. Estruturas e passarelas devem parecer capazes
de sustentar o personagem, sem miniaturização decorativa.

### Ribeirinho

A variante Ribeirinho usa verdes de vegetação, água azul-esverdeada, terra
quente e luz ambiente `#1d4a3f`. O contraste é moderado, com reflexos claros e
névoa discreta. Palmeiras, árvores, juncos, terra e água devem transmitir vida e
circulação, não um pântano tóxico.

### Sombrio

A variante Sombrio mantém o mesmo mapa, câmera e escala. Usa verdes frios,
pedras e raízes escurecidas, água verde-azulada, ambiente `#14343a` e névoa
`#0a2026`. O clima é mais opressivo, mas saídas, atores e ameaças continuam
legíveis. Escurecer não significa remover contraste.

### Assets e licença

- **Puny World (16×16)**, Shade, CC0 — terreno, água, árvores, raízes,
  vegetação e arco. Fonte: <https://opengameart.org/content/16x16-puny-world-tileset>.
- **Puny Characters (free edition)**, Shade, CC0 — NPC e fontes dos inimigos.
  Fonte: <https://opengameart.org/content/puny-characters>.

Hashes, arquivos incorporados e transformações estão em
`src/assets/puny/README.md`. As folhas derivadas 128×114 preservam o contrato
histórico das entidades; os metadados visuais não mudam seus bodies.

### Evitar

- arquitetura europeia seca, neve, deserto, lava ou masmorras genéricas;
- água neon que pareça veneno sem função narrativa;
- árvores reduzidas ao tamanho do personagem ou copas sem tronco/raiz legível;
- névoa que esconda rotas e combate;
- mistura de isométrico/side-view com o top-down do mapa;
- recoloração extrema usada para mascarar um asset incompatível;
- repetição uniforme que elimine clareiras, margens de água e hierarquia visual.
