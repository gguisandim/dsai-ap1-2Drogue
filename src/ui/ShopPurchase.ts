import type { ItemDefinition } from '../data/ItemDatabase';

export interface ShopPurchasePlayer {
  halos: number;
  hp: number;
  maxHp: number;
  magic: number;
  maxMagic: number;
  heal(amount: number): void;
  addMagic(amount: number): void;
}

export type ShopPurchaseFailureCode =
  | 'insufficient-funds'
  | 'resource-full'
  | 'unsupported-item';

export type ShopPurchaseResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly itemId: string;
        readonly price: number;
        readonly healed: number;
        readonly magicRestored: number;
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: ShopPurchaseFailureCode;
        readonly itemId: string;
        readonly message: string;
      };
    };

function positiveAmount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function isShopItemSupported(
  item: Pick<ItemDefinition, 'healAmount' | 'magicAmount'>,
): boolean {
  return positiveAmount(item.healAmount) > 0 || positiveAmount(item.magicAmount) > 0;
}

/** Applies only immediate effects already supported by the runtime player. */
export function purchaseShopItem(
  player: ShopPurchasePlayer,
  item: ItemDefinition,
): ShopPurchaseResult {
  const healAmount = positiveAmount(item.healAmount);
  const magicCapacity = Math.max(0, player.maxMagic - player.magic);
  const magicRestored = Math.min(magicCapacity, positiveAmount(item.magicAmount));
  const canHeal = healAmount > 0 && player.hp < player.maxHp;
  const canRestoreMagic = magicRestored > 0;

  if (!isShopItemSupported(item)) {
    return {
      ok: false,
      error: {
        code: 'unsupported-item',
        itemId: item.id,
        message: 'Este item ainda não possui efeito implementado na loja.',
      },
    };
  }
  if (!canHeal && !canRestoreMagic) {
    return {
      ok: false,
      error: {
        code: 'resource-full',
        itemId: item.id,
        message: 'O recurso deste item já está no máximo.',
      },
    };
  }
  if (player.halos < item.price) {
    return {
      ok: false,
      error: {
        code: 'insufficient-funds',
        itemId: item.id,
        message: 'Halos insuficientes.',
      },
    };
  }

  if (canHeal) player.heal(healAmount);
  if (canRestoreMagic) player.addMagic(magicRestored);
  player.halos -= item.price;
  return {
    ok: true,
    value: {
      itemId: item.id,
      price: item.price,
      healed: canHeal ? healAmount : 0,
      magicRestored: canRestoreMagic ? magicRestored : 0,
    },
  };
}
