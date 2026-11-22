export type PlayerClassId = 'knight' | 'mage' | 'ranger' | 'rogue';

export type PrimaryStyle = 'melee' | 'orb' | 'arrow' | 'daggers';
export type SpecialStyle = 'aegis' | 'nova' | 'volley' | 'shadow';

export interface PlayerClassDefinition {
  id: PlayerClassId;
  name: string;
  title: string;
  weaponName: string;
  specialName: string;
  description: string;
  specialDescription: string;
  primaryStyle: PrimaryStyle;
  specialStyle: SpecialStyle;
  spriteFacing: 'left' | 'right';
  maxHp: number;
  maxMagic: number;
  speed: number;
  baseDamage: number;
  attackRange: number;
  attackCooldown: number;
  projectileSpeed: number;
  magicCost: number;
  color: number;
  accentColor: number;
}

export const PLAYER_CLASS_ORDER: PlayerClassId[] = ['knight', 'mage', 'ranger', 'rogue'];

export const CLASS_DATABASE: Record<PlayerClassId, PlayerClassDefinition> = {
  knight: {
    id: 'knight',
    name: 'GUARDIÃO',
    title: 'Guardião do Cerne',
    weaponName: 'Lâmina de Pedra-Clara e Escudo-Raiz',
    specialName: 'Invocação: Ícaro',
    description: 'Resistente e territorial. Combate de perto com pedra, casca e madeira viva.',
    specialDescription: 'Invoca Ícaro, um serafim que protege e dispara lâminas sagradas (consome magia).',
    primaryStyle: 'melee',
    specialStyle: 'aegis',
    spriteFacing: 'left',
    maxHp: 6,
    maxMagic: 100,
    speed: 205,
    baseDamage: 42,
    attackRange: 92,
    attackCooldown: 430,
    projectileSpeed: 360,
    magicCost: 35,
    color: 0x4b5d35,
    accentColor: 0xd99532,
  },
  mage: {
    id: 'mage',
    name: 'CONDUTOR',
    title: 'Condutor das Sementes',
    weaponName: 'Cajado-Raiz das Sementes',
    specialName: 'Invocação: Nix',
    description: 'Canaliza sementes, fungos e seiva luminosa em rajadas de longo alcance.',
    specialDescription: 'Invoca Nix, uma chama arcana que orbita e lança magias em leque (consome magia).',
    primaryStyle: 'orb',
    specialStyle: 'nova',
    spriteFacing: 'left',
    maxHp: 4,
    maxMagic: 140,
    speed: 215,
    baseDamage: 30,
    attackRange: 360,
    attackCooldown: 330,
    projectileSpeed: 560,
    magicCost: 40,
    color: 0x4f3b68,
    accentColor: 0x49d6c8,
  },
  ranger: {
    id: 'ranger',
    name: 'RASTREADOR',
    title: 'Rastreador do Igapó',
    weaponName: 'Arco de Cipó Laminado',
    specialName: 'Invocação: Sylphi',
    description: 'Lê o território e carrega o disparo para ampliar dano e alcance.',
    specialDescription: 'Invoca Sylphi, um espírito guardião que dispara flechas triplas (consome magia).',
    primaryStyle: 'arrow',
    specialStyle: 'volley',
    spriteFacing: 'right',
    maxHp: 5,
    maxMagic: 110,
    speed: 215,
    baseDamage: 34,
    attackRange: 460,
    attackCooldown: 390,
    projectileSpeed: 570,
    magicCost: 35,
    color: 0x31594b,
    accentColor: 0xc6b56b,
  },
  rogue: {
    id: 'rogue',
    name: 'LÂMINA',
    title: 'Lâmina do Cipó',
    weaponName: 'Lâminas de Pedra-Resina',
    specialName: 'Invocação: Umbra',
    description: 'Corta com duas lâminas orgânicas; segure para ampliar o arremesso.',
    specialDescription: 'Invoca Umbra, um espelho das trevas que lança adagas cerradas (consome magia).',
    primaryStyle: 'daggers',
    specialStyle: 'shadow',
    spriteFacing: 'left',
    maxHp: 4,
    maxMagic: 100,
    speed: 265,
    baseDamage: 19,
    attackRange: 230,
    attackCooldown: 245,
    projectileSpeed: 500,
    magicCost: 30,
    color: 0x302232,
    accentColor: 0xb83f6d,
  },
};

export function getPlayerClass(id?: string): PlayerClassDefinition {
  return CLASS_DATABASE[(id as PlayerClassId) || 'knight'] ?? CLASS_DATABASE.knight;
}
