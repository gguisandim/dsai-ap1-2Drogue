import type { Gender } from '../../data/PlayerProfile';
import type { PlayerClassId } from '../../data/ClassDatabase';

export interface PlayerClassVisualAsset {
  readonly id: string;
  readonly classId: PlayerClassId;
  readonly gender: Gender;
  readonly sheetFileName: string;
  readonly portraitFileName: string;
  readonly sourceFileName: string;
  readonly textureKey: string;
  readonly portraitTextureKey: string;
  readonly frameWidth: 128;
  readonly frameHeight: 114;
  readonly frameCount: 12;
  readonly sheetSha256: string;
  readonly portraitSha256: string;
  readonly sourceSha256: string;
}

export interface PlayerClassAimBodyAsset {
  readonly id: string;
  readonly gender: Gender;
  readonly fileName: string;
  readonly sourceFileName: string;
  readonly textureKey: string;
  readonly width: 128;
  readonly height: 114;
  readonly sha256: string;
  readonly sourceSha256: string;
}

const visual = (
  classId: PlayerClassId,
  gender: Gender,
  sheetSha256: string,
  portraitSha256: string,
  sourceSha256: string,
): PlayerClassVisualAsset => Object.freeze({
  id: `asset.player-class.${classId}.${gender}`,
  classId,
  gender,
  sheetFileName: `${classId}_${gender}.png`,
  portraitFileName: `${classId}_${gender}-portrait.png`,
  sourceFileName: `${classId}_${gender}-source.png`,
  textureKey: `anim_${classId}_${gender}`,
  portraitTextureKey: `class_${classId}_${gender}`,
  frameWidth: 128,
  frameHeight: 114,
  frameCount: 12,
  sheetSha256,
  portraitSha256,
  sourceSha256,
});

export const PLAYER_CLASS_VISUAL_ASSETS: readonly PlayerClassVisualAsset[] = Object.freeze([
  visual('knight', 'woman',
    'cf203f65e26d1e2af9aa4406100c0dbf3fed50357b57de0149d80fd6ec881a8b',
    '61a3f81a382d04139eac02b6cab280209567f2350ff3fe177a8c7f4fbf9f9350',
    'da35b59abf1b26e120696ac0fed25f6018cc0cac234a90d9af02a1f0381e4594'),
  visual('knight', 'man',
    'e3e559d3db5bf3f52049fc8bb908fc8221927007b18e46ab6842298583b2835b',
    '59aaf50d13895cfb6f8850d4786c53cd93d8d45d0933438c4d3f2572829a841a',
    '9f728490f85009dc265f503a3fbccea0169d541da7d90a1bd2d6b865aa49ec76'),
  visual('mage', 'woman',
    'e2fbd88e822c3cd7cbbaf4d8cd34b71cdd62e7d0b7f67a131fc67d369320b809',
    'e0d9bcc83a9ab5b46fa4c9c1ebf8b9f3d4864c29b258058f0b8e46bf5a5a5730',
    '37eaf43c808a334560c728f723bd9056b9b201638f3506a9878746948b8c29dd'),
  visual('mage', 'man',
    'cbf9642ec89116efeaf3b4066a7180c84d4d7fb7fddba10a9cea8550ded37a22',
    '50299bc0a64ea6b1b8f1e1bdb346424a46f7999ab23e9fae0765cbde10c550b2',
    '2a3e0759a76140273536cc176748b4e438c47cd13a4174f4bd7d51d4088e93c6'),
  visual('ranger', 'woman',
    '9f51b4abf874e579aa42e25d61b1f87c47cd3641bbc83bebf6cceac9b7298e25',
    'ce57cf234bac29d1a7b5097122a5b18270cffe84cdf44cb7621c0867e6e0b217',
    '14632eb0581c996ca131d917ccdcd40326ca60a6fd6b8fec8ee1ba16577a3fc5'),
  visual('ranger', 'man',
    'f9d09d6e32daf79368976415441545cc7bf95858a8cb12ac2bb3b29fffcd5ac0',
    'd3b04a19507cc23dbcf4a0b3cc045508296fd4ae91898f845bb809b95cfaa587',
    '3c52597adfb590b34ce5c99be01c51d20e04cf80f2b58f330389976692353100'),
  visual('rogue', 'woman',
    '2ed2104b9372bba50bce9ff526349bd6ff1770b43c611af14ae28ca32440b074',
    'bcc80e21931f4a4a93a845a1db3cd868f281eba2f5f9170322c2796d1e416cd9',
    'ad7400872a4c176d072906509951e8376d7f503bce2bed7133f7e944dc69ed17'),
  visual('rogue', 'man',
    'ca8db50c0af1fd311b77814d2bc1ea46153ffef94eca8ba2185dd83b40895637',
    'c6919357044ba949fe8d050e3b5ac64aaefd1095ab548a7a3a5fca8e45cee8f6',
    '4ce181f36bc99fb68650b9151d893128ac275815f220e04b514cb01fef5eecbc'),
]);

export const PLAYER_CLASS_AIM_BODY_ASSETS: readonly PlayerClassAimBodyAsset[] = Object.freeze([
  Object.freeze({
    id: 'asset.player-class.ranger.woman.aim-body',
    gender: 'woman' as const,
    fileName: 'ranger_woman_aim_body.png',
    sourceFileName: 'ranger_woman_aim_body-source.png',
    textureKey: 'anim_ranger_woman_aim_body',
    width: 128,
    height: 114,
    sha256: '0c77133b52282f324f8de7eebc7e80246e97be2cc01410bceb0fba624bfdbb8f',
    sourceSha256: '76d56b18a3d5eb638cc5718f51837a7a75c37a45de907db9524f8514e6ad2163',
  }),
  Object.freeze({
    id: 'asset.player-class.ranger.man.aim-body',
    gender: 'man' as const,
    fileName: 'ranger_man_aim_body.png',
    sourceFileName: 'ranger_man_aim_body-source.png',
    textureKey: 'anim_ranger_man_aim_body',
    width: 128,
    height: 114,
    sha256: 'a0d06c9ecd49bbd309390f3231754dc91f63437e857c89a4737ce910a34a53c6',
    sourceSha256: '62a09073f001816a9c9f0fccbdcc03c28068dd92bf3163f7b143a8744bf69af4',
  }),
]);

