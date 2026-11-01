import type { WorldLabDiagnostic, WorldLabMarkerKind } from '../contracts';

export const WORLD_LAB_PT_BR = Object.freeze({
  product: 'Umbra World Lab',
  productSubtitle: 'Ferramenta de fases e direção de arte',
  workspaces: Object.freeze({ campaign: 'Campanha', stages: 'Fases', comparison: 'Comparação' }),
  campaignModes: Object.freeze({ procedural: 'Grafo procedural', macro: 'Campanha completa' }),
  actions: Object.freeze({
    generate: 'Gerar', regenerate: 'Gerar novamente', export: 'Exportar snapshot',
    import: 'Importar snapshot', capture: 'Capturar', maximize: 'Maximizar', restore: 'Restaurar painéis',
    hideExplorer: 'Ocultar explorador', showExplorer: 'Mostrar explorador',
    hideInspector: 'Ocultar inspetor', showInspector: 'Mostrar inspetor',
    fit: 'Ajustar à tela', technicalDetails: 'Detalhes técnicos',
    expandDiagnostics: 'Expandir diagnósticos', collapseDiagnostics: 'Recolher diagnósticos',
  }),
  labels: Object.freeze({
    seed: 'Seed', node: 'Nó', stage: 'Fase', variant: 'Variante', compareWith: 'Comparar com',
    view: 'Visualização', zoom: 'Zoom', grid: 'Grade', hud: 'HUD', overlays: 'Sobreposições',
    entities: 'Entidades', decorations: 'Decorações', exits: 'Saídas', campaignNode: 'Nó da campanha',
    defaultVariant: 'Padrão', structural: 'Estrutural', visual: 'Visual', selection: 'Seleção',
    selectedNode: 'Nó selecionado', viewedStage: 'Fase visualizada', activeVariant: 'Variante ativa',
    inspectedItem: 'Item inspecionado', noSelection: 'Nenhuma seleção', unavailable: 'Indisponível',
    yes: 'sim', no: 'não', legacy: 'legado', none: 'nenhum', fallback: 'padrão técnico',
  }),
  panels: Object.freeze({
    graph: 'Grafo da campanha', stage: 'Prévia da fase', comparison: 'Comparação de variantes',
    explorer: 'Conteúdo e camadas', inspector: 'Inspetor', diagnostics: 'Diagnósticos',
  }),
  sections: Object.freeze({
    general: 'Geral', visual: 'Visual', transformation: 'Transformação', collision: 'Colisão',
    origin: 'Origem', diagnostics: 'Diagnósticos', progress: 'Progresso', catalog: 'Catálogo dinâmico',
    composition: 'Composição determinística', choices: 'Escolhas do runtime', layers: 'Camadas',
    entities: 'Entidades', assets: 'Assets',
  }),
  empty: Object.freeze({
    graph: 'Gere uma campanha para inspecionar o grafo.',
    stage: 'Os dados da fase não estão disponíveis para a seleção atual.',
    macro: 'Não foi possível projetar a campanha completa.',
    inspector: 'Selecione um nó, fase, entidade ou asset para inspecionar.',
    diagnostics: 'Nenhum diagnóstico para os filtros atuais.',
    previewLocal: 'A prévia Phaser incorporada está disponível somente no ambiente local de desenvolvimento.',
    previewLoading: 'A prévia ainda está carregando. Aguarde antes de capturar.',
    plannedMap: 'Mapa ainda não implementado',
  }),
  help: Object.freeze({
    graph: 'Use a roda para zoom e arraste para navegar',
    stage: 'Phaser real · grade e camadas são apenas de inspeção',
    comparison: 'Mesmo enquadramento, zoom e dimensões',
    structural: 'Mapa estrutural · camadas e colisões apenas de inspeção',
    fixture: 'Dados de demonstração · não representam um save de produção',
    registered: 'Conteúdo registrado', runtime: 'Problema do runtime',
  }),
  severities: Object.freeze({ error: 'Erros', warning: 'Avisos', info: 'Informações' }),
  categories: Object.freeze({ tile: 'Tile', decoration: 'Decoração', npc: 'NPC', enemy: 'Inimigo' }),
  fields: Object.freeze({
    id: 'ID', type: 'Tipo', origin: 'Origem', destination: 'Destino', kind: 'Tipo', binding: 'Vínculo',
    association: 'Associação', stage: 'Fase', template: 'Template', actDepth: 'Ato / profundidade',
    branch: 'Rota', connections: 'Entradas / saídas', capacity: 'Capacidade física', biome: 'Bioma',
    tile: 'Tile', tileType: 'Tipo do tile', walkable: 'Transitável', entities: 'Entidades',
    texture: 'Textura', frame: 'Frame', sourceSize: 'Dimensão da fonte', frameSize: 'Dimensão do frame',
    visibleSize: 'Região visível', worldSize: 'Dimensão no mundo', scale: 'Escala', anchor: 'Âncora',
    layer: 'Camada', compatibility: 'Compatibilidade', package: 'Pacote', license: 'Licença',
    author: 'Autor', collision: 'Colisão', warnings: 'Avisos', status: 'Estado', currentLocation: 'Local atual',
  }),
} as const);

const STATUS: Readonly<Record<string, string>> = Object.freeze({
  current: 'atual', completed: 'concluído', available: 'disponível', blocked: 'bloqueado',
  'not-started': 'não iniciada', 'in-progress': 'em andamento', locked: 'bloqueada',
  'milestone-completed': 'marco concluído', entered: 'acessado', loadable: 'carregável',
  planned: 'planejado', none: 'sem conteúdo', bound: 'vinculado', unavailable: 'indisponível',
  failed: 'falhou', composed: 'composta', 'campaign-eligible': 'elegível para campanha',
  compatible: 'compatível', review: 'revisar', incomplete: 'incompleto',
  'individual-only': 'somente individual',
});

const RELATIONS: Readonly<Record<string, string>> = Object.freeze({
  unlock: 'desbloqueio', progression: 'progressão', return: 'retorno', forward: 'avanço',
  branch: 'ramificação', rejoin: 'reunião', transition: 'transição',
});

const ART_WARNINGS: Readonly<Record<string, string>> = Object.freeze({
  'character-proportion-review': 'revisar proporção do personagem',
  'frame-dimensions-unavailable': 'dimensões do frame indisponíveis',
});

const MARKERS: Readonly<Record<WorldLabMarkerKind, string>> = Object.freeze({
  spawn: 'Spawn', enemy: 'Inimigo', boss: 'Chefe', item: 'Item', npc: 'NPC', anchor: 'Âncora',
  'section-exit': 'Saída de seção', 'physical-exit': 'Saída física', decoration: 'Decoração',
});

const ORIGINS: Readonly<Record<WorldLabDiagnostic['origin'], string>> = Object.freeze({
  'campaign-generator': 'Gerador de campanha', 'campaign-composer': 'Compositor de campanha',
  'stage-loader': 'Carregador de fases', 'physical-exit-resolver': 'Resolvedor de saídas físicas',
  'campaign-exit-binder': 'Vínculo de saídas', 'stage-catalog': 'Catálogo de fases',
  integration: 'Integração', snapshot: 'Snapshot',
});

const DIAGNOSTICS: Readonly<Record<string, string>> = Object.freeze({
  'world-lab.seed-required': 'Informe uma seed para gerar a visualização.',
  'world-lab.focus-stage.unknown': 'A fase escolhida não está registrada.',
  'world-lab.fixture-manifest-overlay': 'A fixture usa manifestos auxiliares somente para inspecionar mapas legados.',
  'world-lab.binding-unavailable': 'Não foi possível associar uma saída física deste nó.',
  'campaign.exit.binding-cardinality': 'A quantidade de saídas disponíveis não corresponde às conexões da campanha.',
  'campaign.exit.destination-mismatch': 'O destino declarado pela saída não corresponde ao destino da campanha.',
});

export function localizeStatus(value: string | undefined): string {
  return value ? STATUS[value] ?? value : WORLD_LAB_PT_BR.labels.unavailable;
}

export function localizeMarker(kind: WorldLabMarkerKind): string {
  return MARKERS[kind];
}

export function localizeRelation(value: string): string {
  return RELATIONS[value] ?? value;
}

export function localizeArtWarning(value: string): string {
  if (value.startsWith('perspective:')) return `perspectiva: ${value.slice('perspective:'.length)}`;
  return ART_WARNINGS[value] ?? value;
}

export function localizeDiagnosticOrigin(origin: WorldLabDiagnostic['origin']): string {
  return ORIGINS[origin];
}

export function localizeDiagnosticMessage(diagnostic: WorldLabDiagnostic): string {
  return DIAGNOSTICS[diagnostic.code] ?? `Foi detectado um problema em ${localizeDiagnosticOrigin(diagnostic.origin).toLowerCase()}.`;
}
