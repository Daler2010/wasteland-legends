// ===== Детальные герои 24x38: рисуются по слоям, поэтому у них настоящая анимация =====
// Поза (o): b — покачивание корпуса (0/1), lL/lR — подъём левой/правой ноги, a — мах рук (-1..1),
// blink — моргание, sw — качание волос/плаща/юбки (-1..1)

const HERO_W = 24, HERO_H = 38;

const HERO_PAL = {
  daler: {
    skin: '#f4c29a', skinSh: '#d9956a', hair: '#f7d56b', hairHi: '#fff2a8', hairSh: '#c9972f',
    tunic: '#38b764', tunicSh: '#257179', cloak: '#1f6e5e', leather: '#8b4a2b', leatherHi: '#b86f32', leatherSh: '#5a2e1c',
    gold: '#ffcd75', pants: '#5a4632', pantsSh: '#3e2f22', boot: '#733e39', bootHi: '#a3593b',
    band: '#1f8a4c', gem: '#73eff7', eye: '#1f6b4a', lip: '#c8705a', white: '#f4f4f4', red: '#b13e53', wood: '#c9a15a',
  },
  stimme: {
    skin: '#fbd3b0', skinSh: '#e0a07a', hair: '#f7d56b', hairHi: '#fff2a8', hairSh: '#d59a3b',
    dress: '#e86a92', dressSh: '#c24a78', dressHi: '#f9a8c4', bodice: '#a83266',
    gold: '#ffcd75', goldSh: '#d59a3b', ruby: '#ef3b5b', gem: '#73eff7', white: '#f4f4f4',
    eye: '#3b8fe0', lip: '#e0486a', blush: '#f5a8a0', lash: '#7a4a2b',
  },
  babaduk: {
    skin: '#e8b088', skinSh: '#b87850', steel: '#aebfd0', steelSh: '#7d90a6', steelDk: '#566c86', white: '#f4f8ff',
    gold: '#ffcd75', cape: '#3b5dc9', capeSh: '#29366f', leather: '#5a2e1c',
    plume: '#d8384f', plumeSh: '#9a2238', gem: '#41a6f6', eye: '#4a2f1c',
  },
};
// Костюмы: «Тёмный эльф», «Ледяная принцесса», «Чёрный рыцарь»
const HERO_PAL_ALT = {
  daler: { skin: '#c9b8e8', skinSh: '#9a86c0', hair: '#eeeef6', hairHi: '#ffffff', hairSh: '#b0b0c8', tunic: '#7b2cbf', tunicSh: '#4a1a7a',
    cloak: '#2a1240', leather: '#33363f', leatherHi: '#566c86', leatherSh: '#1e2028', pants: '#262b44', pantsSh: '#1a1c2c',
    boot: '#33363f', bootHi: '#566c86', band: '#4a1a7a', gem: '#e86a92', eye: '#d8384f', lip: '#8a5a9a', gold: '#c7dcd0' },
  stimme: { dress: '#41a6f6', dressSh: '#3b5dc9', dressHi: '#a8dcff', bodice: '#29366f', hair: '#e8f4ff', hairHi: '#ffffff', hairSh: '#a8c4e0',
    ruby: '#73eff7', gold: '#dfe9f2', goldSh: '#94b0c2', eye: '#7b2cbf', lip: '#c05a8a', blush: '#d8b8e0', lash: '#566c86', gem: '#ffffff' },
  babaduk: { steel: '#4a4e5a', steelSh: '#33363f', steelDk: '#22242b', white: '#8a8f9c', cape: '#b13e53', capeSh: '#6a1f30',
    plume: '#ffcd75', plumeSh: '#d59a3b', gem: '#ef3b5b', gold: '#c9a15a', eye: '#d8384f' },
};

function heroEye(R, P, x, y, blink) {
  if (blink) { R(x, y + 1, 2, 1, P.skinSh); return; }
  R(x, y, 2, 2, P.white);
  R(x + 1, y, 1, 2, P.eye);
}

// Ноги с обувью: поднятая нога короче
function heroLegs(R, o, leg, legSh, boot, bootHi) {
  const L = o.lL, Rr = o.lR;
  R(8, 24, 4, 8 - L, leg); R(11, 24, 1, 8 - L, legSh);
  R(7, 32 - L, 5, 3, boot); R(7, 32 - L, 5, 1, bootHi);
  R(13, 24, 4, 8 - Rr, leg); R(13, 24, 1, 8 - Rr, legSh);
  R(13, 32 - Rr, 5, 3, boot); R(13, 32 - Rr, 5, 1, bootHi);
}

const HERO_PAINT = {
  // Эльф-следопыт: длинные волосы, острые уши, повязка с камнем, наплечная накидка, колчан, ремни
  daler(R, P, o) {
    const b = o.b, sw = o.sw;
    // колчан со стрелами за плечом
    R(17, 8 + b, 3, 11, P.leather); R(17, 8 + b, 3, 1, P.leatherHi); R(18, 10 + b, 1, 8, P.leatherSh);
    R(17, 5 + b, 1, 3, P.wood); R(19, 5 + b, 1, 3, P.wood); R(18, 6 + b, 1, 2, P.wood);
    R(17, 4 + b, 1, 2, P.red); R(19, 4 + b, 1, 2, P.white); R(18, 5 + b, 1, 1, P.red);
    // волосы за спиной
    R(6, 4 + b, 12, 10, P.hairSh);
    R(5 + sw, 12 + b, 2, 6, P.hairSh); R(17 + sw, 12 + b, 1, 5, P.hairSh);
    // ноги, сапоги с отворотами
    heroLegs(R, o, P.pants, P.pantsSh, P.boot, P.bootHi);
    R(9, 27 - o.lL, 2, 1, P.leatherHi); R(14, 27 - o.lR, 2, 1, P.leatherHi); // наколенники
    // туника с вырезом
    R(7, 14 + b, 10, 8 - b, P.tunic);
    R(15, 15 + b, 2, 6 - b, P.tunicSh);
    R(9, 14 + b, 6, 2, P.skin); R(10, 16 + b, 4, 1, P.skin); R(11, 17 + b, 2, 1, P.skinSh);
    for (let i = 0; i < 7 - b; i++) R(15 - i, 14 + b + i, 2, 1, P.leather); // ремень колчана через грудь
    // пояс, пряжка, подсумок
    R(7, 22, 10, 2, P.leather); R(7, 22, 10, 1, P.leatherHi); R(11, 22, 2, 2, P.gold); R(14, 23, 2, 3, P.leatherSh);
    // подол туники — два клапана
    R(7, 24, 5, 2, P.tunic); R(13, 24, 4, 2, P.tunic); R(7, 25, 5, 1, P.tunicSh); R(13, 25, 4, 1, P.tunicSh);
    // руки: рукав, предплечье, наруч, кисть
    const yl = 15 + b + o.a, yr = 15 + b - o.a;
    R(4, yl, 2, 3, P.tunic); R(4, yl + 3, 2, 2, P.skin); R(4, yl + 5, 2, 2, P.leather); R(4, yl + 7, 2, 1, P.skin);
    R(18, yr, 2, 3, P.tunic); R(18, yr + 3, 2, 2, P.skin); R(18, yr + 5, 2, 2, P.leather); R(18, yr + 7, 2, 1, P.skin);
    // шея и наплечная накидка с застёжкой
    R(10, 13 + b, 4, 1, P.skinSh);
    R(4, 14 + b, 5, 2, P.cloak); R(15, 14 + b, 5, 2, P.cloak); R(8, 15 + b, 1, 1, P.gold); R(15, 15 + b, 1, 1, P.gold);
    // голова
    R(8, 4 + b, 8, 1, P.skin); R(7, 5 + b, 10, 7, P.skin); R(8, 12 + b, 8, 1, P.skinSh);
    // острые уши
    R(5, 8 + b, 2, 2, P.skin); R(4, 7 + b, 1, 2, P.skin); R(3, 6 + b, 1, 1, P.skin); R(6, 9 + b, 1, 1, P.skinSh);
    R(17, 8 + b, 2, 2, P.skin); R(19, 7 + b, 1, 2, P.skin); R(20, 6 + b, 1, 1, P.skin); R(17, 9 + b, 1, 1, P.skinSh);
    // волосы спереди: чёлка, пряди вдоль лица и на плечах
    R(8, 2 + b, 8, 1, P.hair); R(7, 3 + b, 10, 3, P.hair); R(9, 3 + b, 5, 1, P.hairHi);
    R(6, 4 + b, 2, 4, P.hair); R(16, 4 + b, 2, 4, P.hair);
    R(7, 6 + b, 3, 1, P.hair); R(14, 6 + b, 3, 1, P.hair);
    R(7, 7 + b, 1, 6, P.hair); R(16, 7 + b, 1, 6, P.hair);
    R(7, 13 + b, 2, 6, P.hair); R(15, 13 + b, 2, 6, P.hair); R(7, 14 + b, 1, 2, P.hairHi); R(16, 14 + b, 1, 2, P.hairHi);
    R(8 + sw, 19 + b, 1, 1, P.hairSh); R(15 + sw, 19 + b, 1, 1, P.hairSh);
    // повязка с камнем
    R(7, 5 + b, 10, 1, P.band); R(11, 5 + b, 2, 1, P.gem);
    // лицо
    R(9, 7 + b, 2, 1, P.hairSh); R(13, 7 + b, 2, 1, P.hairSh);
    heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
    R(11, 11 + b, 2, 1, P.lip);
  },

  // Принцесса: корона с рубином, пышные волосы до талии, корсаж, перчатки, юбка-колокол с оборками и разрезом
  stimme(R, P, o) {
    const b = o.b, sw = o.sw;
    // волосы сзади
    R(5, 4 + b, 14, 10, P.hairSh);
    R(3 + sw, 12 + b, 18, 8, P.hairSh); R(4 + sw, 13 + b, 1, 5, P.hair); R(19 + sw, 13 + b, 1, 5, P.hair);
    R(4 + sw, 20 + b, 16, 3, P.hairSh); R(4 + sw * 2, 23 + b, 3, 2, P.hairSh); R(17 + sw * 2, 23 + b, 3, 2, P.hairSh);
    // юбка-колокол со складками
    for (let y = 22; y <= 32; y++) {
      const w = 4 + Math.round((y - 22) * 0.5), sh = y > 27 ? sw : 0;
      R(12 - w + sh, y, w * 2, 1, P.dress);
      for (let x = 12 - w + 2; x < 12 + w - 1; x += 3) R(x + sh, y, 1, 1, P.dressSh);
      R(12 - w + sh, y, 1, 1, P.dressHi);
    }
    R(3 + sw, 32, 18, 1, P.dressHi);
    for (let x = 3; x < 21; x += 2) R(x + sw, 33, 1, 1, P.dressHi); // фестоны по подолу
    // разрез и ножка
    for (let y = 26; y <= 32; y++) { R(13 + sw, y, 1, 1, P.dressSh); R(14 + sw, y, 1 + Math.floor((y - 26) / 3), 1, P.skin); }
    // туфельки
    R(8, 33 - Math.min(1, o.lL), 3, 2, P.gold); R(14, 33 - Math.min(1, o.lR), 3, 2, P.gold);
    R(8, 34 - Math.min(1, o.lL), 3, 1, P.goldSh); R(14, 34 - Math.min(1, o.lR), 3, 1, P.goldSh);
    // плечи, корсаж с золотой каймой и шнуровкой, узкая талия
    R(8, 14 + b, 8, 2, P.skin);
    R(8, 16 + b, 8, 4, P.bodice); R(11, 16 + b, 2, 1, P.skin);
    R(8, 16 + b, 3, 1, P.gold); R(13, 16 + b, 3, 1, P.gold);
    R(11, 17 + b, 1, 1, P.gold); R(12, 18 + b, 1, 1, P.gold); R(11, 19 + b, 1, 1, P.gold);
    R(9, 20 + b, 6, 2 - b, P.bodice);
    R(9, 21, 6, 1, P.gold); R(15, 21, 2, 2, P.goldSh);
    // шея и кулон
    R(10, 13 + b, 4, 1, P.skinSh); R(11, 14 + b, 2, 1, P.gem);
    // руки: открытые плечи, манжета, длинные перчатки
    const yl = 14 + b + o.a, yr = 14 + b - o.a;
    R(5, yl, 2, 2, P.skin); R(5, yl + 2, 2, 1, P.dressHi); R(5, yl + 3, 2, 6, P.white);
    R(17, yr, 2, 2, P.skin); R(17, yr + 2, 2, 1, P.dressHi); R(17, yr + 3, 2, 6, P.white);
    // голова
    R(8, 4 + b, 8, 1, P.skin); R(7, 5 + b, 10, 7, P.skin); R(8, 12 + b, 8, 1, P.skinSh);
    R(8, 10 + b, 1, 1, P.blush); R(15, 10 + b, 1, 1, P.blush);
    // волосы спереди: косая чёлка, пряди до груди
    R(8, 2 + b, 8, 1, P.hair); R(7, 3 + b, 10, 3, P.hair); R(9, 3 + b, 6, 1, P.hairHi);
    R(6, 4 + b, 2, 10, P.hair); R(16, 4 + b, 2, 10, P.hair);
    R(7, 6 + b, 4, 1, P.hair); R(15, 6 + b, 2, 1, P.hair);
    R(7, 13 + b, 1, 7, P.hair); R(16, 13 + b, 1, 7, P.hair); R(6, 6 + b, 1, 3, P.hairHi); R(17, 6 + b, 1, 3, P.hairHi);
    // корона с рубином
    R(9, 1 + b, 6, 2, P.gold); R(9, 2 + b, 6, 1, P.goldSh);
    R(9, b, 1, 1, P.gold); R(14, b, 1, 1, P.gold); R(11, b - 1, 2, 2, P.gold);
    R(11, 1 + b, 2, 1, P.ruby);
    // лицо: ресницы, большие глаза, губы
    R(9, 7 + b, 2, 1, P.lash); R(13, 7 + b, 2, 1, P.lash); R(8, 8 + b, 1, 1, P.lash); R(15, 8 + b, 1, 1, P.lash);
    heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
    R(11, 11 + b, 2, 1, P.lip);
  },

  // Рыцарь-принц: шлем с короной и плюмажем, массивные наплечники, кираса с гербом, латная юбка, плащ
  babaduk(R, P, o) {
    const b = o.b, sw = o.sw;
    // плащ
    R(4, 14 + b, 16, 10 - b, P.cape);
    for (let y = 24; y <= 31; y++) {
      const sh = Math.round(sw * (y - 23) / 4);
      R(4 + sh, y, 16, 1, P.cape);
      R(6 + sh, y, 1, 1, P.capeSh); R(11 + sh, y, 1, 1, P.capeSh); R(16 + sh, y, 1, 1, P.capeSh);
    }
    const ss = Math.round(sw * 2);
    R(4 + ss, 32, 3, 1, P.cape); R(9 + ss, 32, 3, 1, P.cape); R(15 + ss, 32, 4, 1, P.cape);
    // латные ноги с золотыми наколенниками
    heroLegs(R, o, P.steel, P.steelSh, P.steelDk, P.steelSh);
    R(8, 27 - o.lL, 3, 2, P.gold); R(14, 27 - o.lR, 3, 2, P.gold);
    // кираса с бликом и гербом
    R(7, 14 + b, 10, 8 - b, P.steel);
    R(8, 15 + b, 1, 5, P.white); R(15, 15 + b, 2, 6 - b, P.steelSh);
    R(11, 16 + b, 2, 3, P.gold); R(10, 17 + b, 4, 1, P.gold);
    // пояс и латная юбка из трёх пластин
    R(7, 22, 10, 1, P.leather); R(11, 22, 2, 1, P.gold);
    R(7, 23, 3, 3, P.steel); R(10, 23, 4, 4, P.steel); R(14, 23, 3, 3, P.steel);
    R(9, 23, 1, 3, P.steelDk); R(14, 23, 1, 3, P.steelDk); R(10, 26, 4, 1, P.steelSh);
    // руки и латные перчатки
    const yl = 17 + b + o.a, yr = 17 + b - o.a;
    R(4, yl, 2, 4, P.steel); R(3, yl + 4, 3, 2, P.steelDk);
    R(18, yr, 2, 4, P.steel); R(18, yr + 4, 3, 2, P.steelDk);
    // массивные наплечники с золотой каймой
    R(2, 13 + b, 6, 4, P.steel); R(2, 13 + b, 6, 1, P.white); R(2, 16 + b, 6, 1, P.gold);
    R(16, 13 + b, 6, 4, P.steel); R(16, 13 + b, 6, 1, P.white); R(16, 16 + b, 6, 1, P.gold);
    R(10, 13 + b, 4, 1, P.steelDk); // горжет
    // лицо в открытом шлеме
    R(8, 6 + b, 8, 7, P.skin); R(9, 12 + b, 6, 1, P.skinSh); R(8, 11 + b, 1, 1, P.skinSh); R(15, 11 + b, 1, 1, P.skinSh);
    // шлем: купол, нащёчники, наносник
    R(7, 2 + b, 10, 1, P.steel); R(6, 3 + b, 12, 4, P.steel); R(8, 3 + b, 3, 1, P.white);
    R(6, 7 + b, 2, 6, P.steel); R(16, 7 + b, 2, 6, P.steel); R(7, 8 + b, 1, 4, P.steelSh); R(16, 8 + b, 1, 4, P.steelSh);
    R(8, 6 + b, 8, 1, P.steelSh); R(11, 7 + b, 2, 2, P.steel);
    // корона на шлеме
    R(6, 4 + b, 12, 1, P.gold); R(7, 3 + b, 1, 1, P.gold); R(16, 3 + b, 1, 1, P.gold); R(11, 2 + b, 2, 2, P.gold);
    R(11, 4 + b, 2, 1, P.gem);
    // плюмаж
    R(11, b, 3, 2, P.plume); R(9 + sw, b - 1, 4, 2, P.plume); R(7 + sw, b, 3, 3, P.plumeSh); R(6 + sw, 2 + b, 2, 2, P.plumeSh);
    // глаза и рот
    heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
    R(11, 11 + b, 2, 1, P.skinSh);
  },
};

// Тёмный контур вокруг силуэта; щели в 1 пиксель (между рукой и телом, между ногами) тоже становятся линией
function outlineSprite(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const im = x.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && src[(j * w + i) * 4 + 3] > 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (solid(i, j)) continue;
    if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) {
      const o = (j * w + i) * 4;
      d[o] = 26; d[o + 1] = 28; d[o + 2] = 44; d[o + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
}

function paintHero(id, P, pose) {
  const c = makeCanvas(HERO_W, HERO_H), x = c.getContext('2d');
  x.translate(0, 2); // запас сверху под корону и плюмаж
  const R = (X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
  HERO_PAINT[id](R, P, pose);
  outlineSprite(c);
  shadeSprite(c);
  return c;
}

// Кадры: i0/i1 — дыхание, ib — моргание, w0..w5 — шаг (нога поднята → опора → другая нога)
const HERO_POSES = {
  i0: { b: 0, lL: 0, lR: 0, a: 0, sw: 0 },
  i1: { b: 1, lL: 0, lR: 0, a: 0, sw: 0 },
  ib: { b: 0, lL: 0, lR: 0, a: 0, sw: 0, blink: true },
  w0: { b: 0, lL: 2, lR: 0, a: 1, sw: -1 },
  w1: { b: 0, lL: 3, lR: 0, a: 1, sw: -1 },
  w2: { b: 1, lL: 0, lR: 0, a: 0, sw: 0 },
  w3: { b: 0, lL: 0, lR: 2, a: -1, sw: 1 },
  w4: { b: 0, lL: 0, lR: 3, a: -1, sw: 1 },
  w5: { b: 1, lL: 0, lR: 0, a: 0, sw: 0 },
};

// ---------- Maga: минотавр-гладиатор ----------
HERO_PAL.maga = {
  fur: '#a5673f', furHi: '#c98a5a', furSh: '#7a4528', snout: '#e0b088', dark: '#3a2418',
  horn: '#f0e6c8', hornHi: '#ffffff', hornSh: '#b8a880',
  hair: '#f7d56b', hairHi: '#fff2a8', hairSh: '#c9972f',
  leather: '#5a2e1c', leatherHi: '#8b4a2b', gold: '#ffcd75', gem: '#d8384f',
  cloth: '#b13e53', clothSh: '#7d2a3b', hoof: '#2e2420', hoofHi: '#5a4632',
  white: '#f4f4f4', eye: '#d8384f', skinSh: '#7a4528',
};
// костюм «Золотой бык»
HERO_PAL_ALT.maga = { fur: '#e8c060', furHi: '#fff2a8', furSh: '#b8862c', snout: '#fff2c0', skinSh: '#b8862c',
  hair: '#f4f4f4', hairHi: '#ffffff', hairSh: '#b0b0c8', cloth: '#3b5dc9', clothSh: '#29366f', eye: '#41a6f6', gem: '#73eff7',
  horn: '#33363f', hornHi: '#566c86', hornSh: '#1e2028' };

// Гора мышц: бычья голова с рогами и кольцом в носу, длинная светлая грива, голый торс с прессом,
// ремень через плечо, огромные руки с золотыми наручами, набедренная повязка, копыта
HERO_PAINT.maga = function (R, P, o) {
  const b = o.b, sw = o.sw, L = o.lL, Rr = o.lR;
  // грива за спиной — до пояса
  R(5, 4 + b, 14, 10, P.hairSh);
  R(4 + sw, 12 + b, 16, 9, P.hairSh); R(5 + sw, 13 + b, 1, 7, P.hair); R(18 + sw, 13 + b, 1, 7, P.hair);
  R(5 + sw * 2, 21 + b, 3, 3, P.hairSh); R(16 + sw * 2, 21 + b, 3, 3, P.hairSh);
  // мощные ноги с шерстью над копытами
  R(7, 24, 5, 8 - L, P.fur); R(11, 24, 1, 8 - L, P.furSh); R(7, 26, 2, 3 - Math.min(L, 2), P.furHi);
  R(7, 30 - L, 5, 2, P.furHi); R(7, 32 - L, 5, 3, P.hoof); R(7, 32 - L, 5, 1, P.hoofHi);
  R(13, 24, 5, 8 - Rr, P.fur); R(13, 24, 1, 8 - Rr, P.furSh); R(15, 26, 2, 3 - Math.min(Rr, 2), P.furHi);
  R(13, 30 - Rr, 5, 2, P.furHi); R(13, 32 - Rr, 5, 3, P.hoof); R(13, 32 - Rr, 5, 1, P.hoofHi);
  // торс: грудные мышцы и пресс кубиками
  R(6, 14 + b, 12, 8 - b, P.fur);
  R(7, 15 + b, 4, 1, P.furHi); R(13, 15 + b, 4, 1, P.furHi);
  R(7, 17 + b, 4, 1, P.furSh); R(13, 17 + b, 4, 1, P.furSh);
  R(11, 15 + b, 2, 7 - b, P.furSh);
  R(9, 19 + b, 2, 1, P.furHi); R(13, 19 + b, 2, 1, P.furHi);
  R(8, 20 + b, 8, 1 - b, P.furSh);
  R(9, 21, 2, 1, P.furHi); R(13, 21, 2, 1, P.furHi);
  R(6, 18 + b, 1, 4 - b, P.furSh); R(17, 18 + b, 1, 4 - b, P.furSh);
  // ремень через плечо с заклёпками
  for (let i = 0; i < 7 - b; i++) R(7 + i, 14 + b + i, 2, 1, P.leather);
  R(9, 16 + b, 1, 1, P.gold); R(12, 19 + b, 1, 1, P.gold);
  // пояс с пряжкой-камнем
  R(6, 22, 12, 2, P.leather); R(6, 22, 12, 1, P.leatherHi); R(10, 22, 4, 2, P.gold); R(11, 22, 2, 1, P.gem);
  // набедренная повязка и кожаные щитки
  R(9, 24, 6, 6, P.cloth); R(11, 24, 2, 5, P.clothSh); R(9, 29, 6, 1, P.gold);
  R(6, 24, 3, 3, P.leather); R(15, 24, 3, 3, P.leather); R(6, 24, 3, 1, P.leatherHi); R(15, 24, 3, 1, P.leatherHi);
  // руки: плечо-шар, бицепс, золотой наруч, кулак
  const yl = 13 + b + o.a, yr = 13 + b - o.a;
  for (const [x, y] of [[1, yl], [19, yr]]) {
    R(x, y, 4, 4, P.fur); R(x, y, 4, 1, P.furHi); R(x + 1, y + 1, 2, 1, P.furHi);
    R(x, y + 4, 4, 3, P.fur); R(x + 1, y + 4, 2, 1, P.furSh); R(x, y + 5, 1, 2, P.furHi);
    R(x, y + 7, 4, 3, P.gold); R(x, y + 8, 4, 1, P.leather);
    R(x, y + 10, 4, 2, P.fur); R(x, y + 11, 4, 1, P.furSh);
  }
  // шея
  R(9, 12 + b, 6, 2, P.furSh);
  // бычья голова
  R(8, 2 + b, 8, 1, P.fur); R(7, 3 + b, 10, 8, P.fur); R(7, 3 + b, 10, 1, P.furHi);
  // уши
  R(4, 6 + b, 3, 2, P.fur); R(17, 6 + b, 3, 2, P.fur); R(5, 7 + b, 1, 1, P.furSh); R(18, 7 + b, 1, 1, P.furSh);
  // морда: ноздри и золотое кольцо
  R(8, 9 + b, 8, 4, P.snout); R(8, 12 + b, 8, 1, P.furSh);
  R(9, 11 + b, 2, 1, P.dark); R(13, 11 + b, 2, 1, P.dark);
  R(11, 12 + b, 2, 2, P.gold); R(11, 12 + b, 2, 1, P.snout); R(10, 12 + b, 1, 1, P.gold); R(13, 12 + b, 1, 1, P.gold);
  // рога
  R(5, 3 + b, 2, 2, P.hornSh); R(3, 1 + b, 2, 3, P.horn); R(3, b - 1, 1, 2, P.hornHi);
  R(17, 3 + b, 2, 2, P.hornSh); R(19, 1 + b, 2, 3, P.horn); R(20, b - 1, 1, 2, P.hornHi);
  // чёлка между рогами и пряди на груди
  R(8, 1 + b, 8, 2, P.hair); R(9, 1 + b, 5, 1, P.hairHi); R(10, 3 + b, 4, 1, P.hair);
  R(7, 3 + b, 2, 3, P.hair); R(15, 3 + b, 2, 3, P.hair);
  R(6, 10 + b, 2, 9, P.hair); R(16, 10 + b, 2, 9, P.hair); R(6, 12 + b, 1, 3, P.hairHi); R(17, 12 + b, 1, 3, P.hairHi);
  R(7 + sw, 19 + b, 1, 1, P.hairSh); R(16 + sw, 19 + b, 1, 1, P.hairSh);
  // суровый взгляд
  R(9, 5 + b, 2, 1, P.dark); R(13, 5 + b, 2, 1, P.dark); R(11, 6 + b, 1, 1, P.furSh);
  heroEye(R, P, 9, 6 + b, o.blink); heroEye(R, P, 13, 6 + b, o.blink);
};

function buildHeroSprites() {
  for (const id in HERO_PAINT) {
    const pals = { '': HERO_PAL[id], '_alt': Object.assign({}, HERO_PAL[id], HERO_PAL_ALT[id]) };
    for (const suffix in pals) {
      for (const k in HERO_POSES) registerSprite(id + suffix + '_' + k, paintHero(id, pals[suffix], HERO_POSES[k]));
      SPR[id + suffix] = SPR[id + suffix + '_i0'];
    }
  }
}
