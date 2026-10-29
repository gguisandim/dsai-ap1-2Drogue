import { ITEM_DATABASE } from '../data/ItemDatabase';
import {
  isShopItemSupported,
  purchaseShopItem,
  type ShopPurchasePlayer,
} from '../ui/ShopPurchase';

function player(overrides: Partial<ShopPurchasePlayer> = {}): ShopPurchasePlayer {
  const value: ShopPurchasePlayer = {
    halos: 5_000,
    hp: 2,
    maxHp: 5,
    magic: 20,
    maxMagic: 100,
    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + Math.ceil(amount / 20)); },
    addMagic(amount) { this.magic = Math.min(this.maxMagic, this.magic + amount); },
  };
  return Object.assign(value, overrides);
}

describe('purchaseShopItem', () => {
  it('applies healing and debits the price exactly once', () => {
    const target = player();

    const result = purchaseShopItem(target, ITEM_DATABASE.green_lollipop);

    expect(result).toEqual({
      ok: true,
      value: { itemId: 'green_lollipop', price: 500, healed: 50, magicRestored: 0 },
    });
    expect(target.hp).toBe(5);
    expect(target.halos).toBe(4_500);
  });

  it('applies magic restoration instead of charging for no effect', () => {
    const target = player();

    const result = purchaseShopItem(target, ITEM_DATABASE.purple_lollipop);

    expect(result).toEqual({
      ok: true,
      value: { itemId: 'purple_lollipop', price: 1_200, healed: 0, magicRestored: 80 },
    });
    expect(target.magic).toBe(100);
    expect(target.halos).toBe(3_800);
  });

  it('preserves resources when funds are insufficient', () => {
    const target = player({ halos: 499 });

    const result = purchaseShopItem(target, ITEM_DATABASE.green_lollipop);

    expect(result).toMatchObject({ ok: false, error: { code: 'insufficient-funds' } });
    expect(target).toMatchObject({ halos: 499, hp: 2, magic: 20 });
  });

  it('does not debit an item whose resource is already full', () => {
    const target = player({ hp: 5 });

    const result = purchaseShopItem(target, ITEM_DATABASE.green_lollipop);

    expect(result).toMatchObject({ ok: false, error: { code: 'resource-full' } });
    expect(target.halos).toBe(5_000);
  });

  it('does not debit a magic item when magic is already full', () => {
    const target = player({ magic: 100 });

    const result = purchaseShopItem(target, ITEM_DATABASE.purple_lollipop);

    expect(result).toMatchObject({ ok: false, error: { code: 'resource-full' } });
    expect(target).toMatchObject({ halos: 5_000, magic: 100 });
  });

  it.each(['yellow_lollipop', 'moon_mahaa_kalaa', 'evil_harvest_rosary'])(
    'rejects unsupported item %s without debiting Halos',
    itemId => {
      const target = player({ halos: 50_000 });

      const result = purchaseShopItem(target, ITEM_DATABASE[itemId]);

      expect(result).toMatchObject({ ok: false, error: { code: 'unsupported-item', itemId } });
      expect(target).toMatchObject({ halos: 50_000, hp: 2, magic: 20 });
    },
  );

  it('classifies only items with an implemented immediate effect as supported', () => {
    expect(isShopItemSupported(ITEM_DATABASE.green_lollipop)).toBe(true);
    expect(isShopItemSupported(ITEM_DATABASE.purple_lollipop)).toBe(true);
    expect(isShopItemSupported(ITEM_DATABASE.yellow_lollipop)).toBe(false);
    expect(isShopItemSupported(ITEM_DATABASE.moon_mahaa_kalaa)).toBe(false);
    expect(isShopItemSupported(ITEM_DATABASE.evil_harvest_rosary)).toBe(false);
  });
});
