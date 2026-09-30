// ===== Лобби-карта, территория «Япония» и герои, которых можно завербовать =====

// ---------------------------------------------------------------- НОВЫЕ ГЕРОИ
// recruit: true — герой закрыт, пока не победишь его в Японии
CHARACTERS.push(
  { id: 'akemi', name: 'ISOSHA', title: 'Куноити', sprite: 'akemi', hp: 85, speed: 80, armor: 0, regen: 0, weapon: 'shuriken', recruit: true,
    desc: 'Самая быстрая из героев. Мечет сюрикены веером. Ульта: танец теней.' },
  { id: 'chonguk', name: 'ISKA', title: 'Мечник-айдол', sprite: 'chonguk', hp: 120, speed: 68, armor: 1, regen: 0, weapon: 'katana', recruit: true,
    desc: 'Молниеносная катана и сцена в крови. Ульта: сольный выход.' });
const heroOpen = c => !c.recruit || !!Save.data.recruit[c.id];
Save.data.recruit = {};
Save.data.hero = 'daler';

Object.assign(WEAPONS, {
  shuriken: { name: 'Сюрикены', icon: 'i_shuriken',
    levels: [
      { dmg: 7, cd: 0.45, count: 1, pierce: 1 },
      { dmg: 8, cd: 0.45, count: 2, pierce: 1 },
      { dmg: 9, cd: 0.38, count: 2, pierce: 2 },
      { dmg: 11, cd: 0.38, count: 3, pierce: 2 },
      { dmg: 12, cd: 0.3, count: 3, pierce: 3 }],
    descs: ['Быстро мечет сюрикены в ближайшего врага', '+1 сюрикен', 'Чаще, пробивает двоих', '+1 сюрикен, +урон', 'Ещё чаще, пробивает троих'],
    evo: { name: 'Буря клинков', need: 'cloak', desc: 'Пять сюрикенов почти без передышки', stats: { dmg: 18, cd: 0.22, count: 5, pierce: 5 } } },
  katana: { name: 'Катана', icon: 'i_sword',
    levels: [
      { dmg: 16, cd: 0.75, r: 30, dirs: 1 },
      { dmg: 20, cd: 0.7, r: 32, dirs: 1 },
      { dmg: 22, cd: 0.62, r: 32, dirs: 2 },
      { dmg: 26, cd: 0.55, r: 36, dirs: 2 },
      { dmg: 30, cd: 0.48, r: 40, dirs: 3 }],
    descs: ['Очень быстрые взмахи по ближайшим врагам', '+урон, чаще', 'Удар в две стороны', '+урон, +дальность', 'Удар в три стороны, ещё чаще'],
    evo: { name: 'Лунный разрез', need: 'scope', desc: 'Круговые удары огромного радиуса', stats: { dmg: 46, cd: 0.4, r: 54, dirs: 6 } } },
});
WEAPON_LOGIC.katana = WEAPON_LOGIC.sword;
WEAPON_LOGIC.shuriken = {
  update(w, dt, R) {
    w.t -= dt;
    if (w.t > 0) return;
    const s = wStats(w), p = R.p;
    const tgt = nearestEnemy(R, p.x, p.y, 200);
    if (!tgt) { w.t = 0.1; return; }
    w.t = s.cd * p.cdMul;
    const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    p.aim = base; p.atkT = 0.1;
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * 0.2;
      R.projs.push({ type: 'arrow', star: true, x: p.x, y: p.y - 2, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, dmg: s.dmg, pierce: s.pierce, life: 0.9, hit: new Set() });
    }
    Sound.sfx('bow');
  },
};

Object.assign(ULTS, {
  akemi:   { name: 'Танец теней',  desc: 'Молниеносно бьёт до 12 ближайших врагов' },
  chonguk: { name: 'Сольный выход', desc: 'Четыре ударные волны подряд' },
});
const ULT_EXTRA = {
  akemi(R) {
    const p = R.p, used = new Set();
    let fx = p.x, fy = p.y;
    for (let i = 0; i < 12; i++) {
      const e = nearestEnemy(R, fx, fy, 170, used);
      if (!e) break;
      used.add(e);
      R.effects.push({ type: 'bolt', pts: jagged(fx, fy, e.x, e.y), t: 0, dur: 0.25 });
      R.ghosts.push({ name: p.sprite + '_w' + (i % 6), x: e.x, y: e.y, flip: i % 2 === 0, life: 0.25 });
      fx = e.x; fy = e.y;
      hurtEnemy(R, e, 60, e.x - p.x, e.y - p.y, 80);
    }
    p.invT = 1.5;
    Sound.sfx('sword'); Sound.sfx('dash');
  },
  chonguk(R) {
    const p = R.p;
    for (let i = 0; i < 4; i++) R.effects.push({ type: 'ring', delay: i * 0.25, x: p.x, y: p.y, r: 4, maxR: 110, t: 0, dur: 0.4, dmg: 32, kb: 200, c: '#ffcd75', hit: new Set() });
    p.invT = 1.2;
    Sound.sfx('wave');
  },
};

Object.assign(COSTUMES, { akemi: 'Алая тень', chonguk: 'Белый лотос' });
Object.assign(HERO_TINT, { akemi: '#7b2cbf', chonguk: '#33363f' });
Object.assign(VOICE, { akemi: { f: 700, w: 'triangle' }, chonguk: { f: 360, w: 'square' } });
const _shout = Sound.shout;
Sound.shout = function (id) {
  if (!this.ready()) return;
  const now = this.ctx.currentTime;
  if (id === 'akemi') [1.5, 2, 1.5, 2.5].forEach((m, i) => this.tone(700 * m, 0.06, 'triangle', 0.1, null, now + i * 0.04));
  else if (id === 'chonguk') [1, 1.5, 1.25, 2].forEach((m, i) => this.tone(360 * m, 0.16, 'square', 0.09, null, now + i * 0.13));
  else _shout.call(this, id);
};

TALENTS.akemi = [
  { id: 'wind',   tier: 1, max: 3, name: 'Лёгкость ветра', desc: '+4% скорость',                 eff: { spd: 0.04 } },
  { id: 'edge',   tier: 1, max: 3, name: 'Острота',        desc: '+4% шанс крита',               eff: { crit: 0.04 } },
  { id: 'sense',  tier: 1, max: 3, name: 'Чутьё',          desc: '+10% радиус сбора',            eff: { magnet: 0.1 } },
  { id: 'flick',  tier: 2, max: 3, name: 'Быстрая кисть',  desc: '-4% перезарядка оружия',       eff: { cd: 0.04 } },
  { id: 'step',   tier: 2, max: 3, name: 'Шаг тени',       desc: '-12% перезарядка рывка',       eff: { dash: 0.12 } },
  { id: 'venom',  tier: 2, max: 3, name: 'Яд',             desc: '+6% урон',                     eff: { dmg: 0.06 } },
  { id: 'dance',  tier: 3, max: 3, name: 'Дыхание тени',   desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
  { id: 'kunai',  tier: 3, max: 1, name: 'Полный подсумок', desc: 'Сюрикены с самого начала 2 уровня', eff: { wlvl: 1 } },
];
TALENTS.chonguk = [
  { id: 'stage',  tier: 1, max: 3, name: 'Закалка сцены',  desc: '+12 макс. HP',                 eff: { hp: 12 } },
  { id: 'rhythm', tier: 1, max: 3, name: 'Ритм',           desc: '-4% перезарядка оружия',       eff: { cd: 0.04 } },
  { id: 'fans',   tier: 1, max: 3, name: 'Любовь фанатов', desc: '+8% опыта',                    eff: { xp: 0.08 } },
  { id: 'blade',  tier: 2, max: 3, name: 'Школа меча',     desc: '+6% урон',                     eff: { dmg: 0.06 } },
  { id: 'guard',  tier: 2, max: 2, name: 'Стойка',         desc: '+1 броня',                     eff: { armor: 1 } },
  { id: 'duel',   tier: 2, max: 3, name: 'Дуэлянт',        desc: '+10% урон по боссам и элите',  eff: { boss: 0.1 } },
  { id: 'encore', tier: 3, max: 3, name: 'На бис',         desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
  { id: 'iai',    tier: 3, max: 1, name: 'Иайдо',          desc: 'Катана с самого начала 2 уровня', eff: { wlvl: 1 } },
];

// ---------------------------------------------------------------- ЯПОНИЯ
const JAPAN = { id: 'japan', name: 'Остров сакуры', seed: 88, music: 'japan', boss: 'akemi', side: true,
  desc: 'Клочок земли, который обошла катастрофа: сакура, каменные фонари и двое бойцов, не пускающих чужаков.',
  ground: { style: 'grass', base: '#4f7a3a', dark: '#3f6330', light: '#65924a', accent: '#8fbf5a' },
  ground2: { style: 'concrete', base: '#8a8a94', dark: '#6c6c76', light: '#a0a0aa', accent: '#5f8f3a' },
  details: ['tuft', 'petal', 'pebbles', 'petal', 'tuft'],
  ambient: { dark: 0.16, color: '#1a0a20', tint: 'rgba(255,170,200,0.06)', fx: 'petals' },
  decor: [['sakura', 1, 5], ['lantern', 1, 3], ['bamboo', 1, 3], ['rock', 1, 2], ['torii', 1, 0.6]], density: 2.6,
  weights: { zombie: 3, rat: 3, slime: 2, marauder: 3, bomber: 1.5, drone: 1.5, brute: 1, necro: 1 }, weather: null };
LOCATIONS.splice(LOCATIONS.findIndex(l => l.final), 0, JAPAN);
ACHIEVEMENTS.push(
  { id: 'recruit1', name: 'Новый союзник', desc: 'Завербовать бойца на Острове сакуры', coins: 40, test: (R, d) => Object.keys(d.recruit).length >= 1 },
  { id: 'recruit2', name: 'Полный отряд',  desc: 'Завербовать обоих бойцов Острова сакуры', coins: 80, test: (R, d) => Object.keys(d.recruit).length >= 2 });

BOSSES.akemi = { name: 'ISOSHA', sprite: 'akemi', hp: 2600, speed: 42, dmg: 16, r: 11, scale: 3, color: '#c77dff',
  attacks: [{ type: 'spread', cd: 1.7, n: 5 }, { type: 'dash', cd: 3.6 }, { type: 'ring', cd: 5, n: 12 }] };
BOSSES.chonguk = { name: 'ISKA', sprite: 'chonguk', hp: 3000, speed: 36, dmg: 20, r: 11, scale: 3, color: '#ffcd75',
  attacks: [{ type: 'dash', cd: 2.8 }, { type: 'spread', cd: 2.4, n: 3 }, { type: 'rain', cd: 6, n: 5 }] };

// Кто выходит на бой: сначала ISOSHA, потом ISKA, а когда оба завербованы — дуэт (кроме того, кем играешь)
function bossList(R) {
  if (R.loc.id !== 'japan') return [R.loc.boss];
  const d = Save.data.recruit;
  if (!d.akemi) return ['akemi'];
  if (!d.chonguk) return ['chonguk'];
  return ['akemi', 'chonguk'].filter(id => id !== R.ch.id);
}

Object.assign(SOLID, { sakura: [4, 3], lantern: [4, 3], bamboo: [3, 2] });
GLOW_DECOR.lantern = ['#ffcd75', 16, 0.45];
DUST.japan = '#a8c48a';
DUST.hub = '#c9b48a';
TRACKS.japan = { bpm: 100, bw: 'triangle', lw: 'triangle',
  bassA: [45,0,0,0,52,0,0,0, 43,0,0,0,50,0,0,0, 41,0,0,0,48,0,0,0, 40,0,0,0,47,0,0,0],
  leadA: [69,0,72,0,76,0,74,72, 69,0,0,0,67,0,0,0, 72,0,74,0,76,0,79,76, 74,0,72,0,69,0,0,0],
  bassB: [41,0,0,0,48,0,0,0, 43,0,0,0,50,0,0,0, 45,0,0,0,52,0,0,0, 45,0,0,0,52,0,0,0],
  leadB: [81,0,79,0,76,0,74,0, 79,0,76,0,74,0,72,0, 76,0,74,0,72,0,69,72, 69,0,0,0,0,0,0,0] };

// ---------------------------------------------------------------- РИСУНКИ ГЕРОЕВ (24x38)
HERO_PAL.akemi = { skin: '#fbd3b0', skinSh: '#e0a07a', hair: '#2a2438', hairHi: '#5a4a78', hairSh: '#1a1626',
  suit: '#7b2cbf', suitSh: '#4a1a7a', suitHi: '#a85ce0', obi: '#d8384f', obiSh: '#9a2238', gold: '#ffcd75', stock: '#2a2438',
  white: '#f4f4f4', eye: '#d8384f', lip: '#e0486a', blush: '#f5a8a0', steel: '#aebfd0', ribbon: '#d8384f' };
HERO_PAL_ALT.akemi = { suit: '#d8384f', suitSh: '#9a2238', suitHi: '#ff7088', obi: '#22242b', obiSh: '#14151a', ribbon: '#ffcd75', eye: '#7b2cbf' };
HERO_PAL.chonguk = { skin: '#f4c8a0', skinSh: '#d9a070', hair: '#1e1a26', hairHi: '#4a4458', hairSh: '#121018',
  coat: '#22242b', coatSh: '#14151a', coatHi: '#3a3d48', gold: '#ffcd75', shirt: '#f4f4f4', shirtSh: '#c7dcd0',
  pants: '#2e323c', pantsSh: '#1e2028', boot: '#14151a', bootHi: '#3a3d48', white: '#f4f4f4', eye: '#4a2f1c', lip: '#c8705a',
  steel: '#aebfd0', red: '#d8384f', wrap: '#7b2cbf' };
HERO_PAL_ALT.chonguk = { coat: '#f4f4f4', coatSh: '#c7dcd0', coatHi: '#ffffff', shirt: '#22242b', shirtSh: '#14151a', hair: '#c9a15a', hairHi: '#ffe9a8', hairSh: '#8a6a30', gold: '#d8384f' };

// Куноити: высокий хвост с лентой, повязка с пластиной, топ-кимоно, пояс оби, короткая юбка, чулки
HERO_PAINT.akemi = function (R, P, o) {
  const b = o.b, sw = o.sw, L = o.lL, Rr = o.lR;
  R(15, 3 + b, 5, 4, P.hairSh); R(17 + sw, 6 + b, 4, 10, P.hair); R(18 + sw * 2, 16 + b, 3, 6, P.hairSh); R(16, 3 + b, 2, 2, P.ribbon);
  R(6, 4 + b, 12, 9, P.hairSh);
  R(4 + sw, 13 + b, 2, 5, P.obi); // концы шарфа
  // ноги: чулки, полоска кожи, золотая подвязка
  R(8, 24, 4, 8 - L, P.stock); R(8, 24, 4, 2, P.skin); R(8, 26, 4, 1, P.gold); R(7, 32 - L, 5, 3, P.suitSh);
  R(13, 24, 4, 8 - Rr, P.stock); R(13, 24, 4, 2, P.skin); R(13, 26, 4, 1, P.gold); R(13, 32 - Rr, 5, 3, P.suitSh);
  // юбка-кимоно на бёдрах
  R(6, 21, 12, 4, P.suit); R(6, 24, 12, 1, P.suitSh); R(11, 22, 2, 3, P.suitSh); R(6, 21, 12, 1, P.suitHi);
  // узкая талия с поясом оби и бантом
  R(9, 19, 6, 2, P.obi); R(9, 20, 6, 1, P.obiSh); R(15, 18, 3, 3, P.obi); R(11, 19, 2, 1, P.gold);
  // топ-кимоно с вырезом
  R(7, 14 + b, 10, 5 - b, P.suit); R(10, 14 + b, 4, 2, P.skin); R(11, 16 + b, 2, 1, P.skinSh);
  R(8, 16 + b, 3, 2, P.suitHi); R(13, 16 + b, 3, 2, P.suitHi); R(8, 18, 3, 1, P.suitSh); R(13, 18, 3, 1, P.suitSh);
  R(10, 13 + b, 4, 1, P.skinSh); R(7, 13 + b, 3, 1, P.obi);
  // руки: открытые плечи, наручи, кунай в руке
  const yl = 14 + b + o.a, yr = 14 + b - o.a;
  R(5, yl, 2, 3, P.skin); R(5, yl + 3, 2, 4, P.stock); R(5, yl + 7, 2, 1, P.skin);
  R(17, yr, 2, 3, P.skin); R(17, yr + 3, 2, 4, P.stock); R(17, yr + 7, 2, 1, P.skin); R(19, yr + 6, 1, 3, P.steel);
  // голова
  R(8, 4 + b, 8, 1, P.skin); R(7, 5 + b, 10, 7, P.skin); R(8, 12 + b, 8, 1, P.skinSh);
  R(8, 10 + b, 1, 1, P.blush); R(15, 10 + b, 1, 1, P.blush);
  // чёлка и пряди
  R(8, 2 + b, 8, 1, P.hair); R(7, 3 + b, 10, 3, P.hair); R(9, 3 + b, 5, 1, P.hairHi);
  R(6, 4 + b, 2, 9, P.hair); R(16, 4 + b, 2, 7, P.hair); R(7, 6 + b, 5, 1, P.hair); R(14, 6 + b, 3, 1, P.hair); R(11, 7 + b, 1, 1, P.hair);
  R(7, 5 + b, 10, 1, P.obi); R(10, 5 + b, 4, 1, P.steel);
  R(9, 7 + b, 2, 1, P.hairSh); R(13, 7 + b, 2, 1, P.hairSh);
  heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
  R(11, 11 + b, 2, 1, P.lip);
};

// Мечник-айдол: уложенные тёмные волосы, серьга, распахнутое хаори с золотой каймой, цепочка, катана за спиной
HERO_PAINT.chonguk = function (R, P, o) {
  const b = o.b, sw = o.sw;
  R(17, 4 + b, 2, 4, P.wrap); R(18, 3 + b, 1, 1, P.gold); R(16, 8 + b, 4, 1, P.gold);
  R(6, 4 + b, 12, 8, P.hairSh);
  R(6 + sw, 24, 4, 5, P.coat); R(14 + sw, 24, 4, 5, P.coat); R(6 + sw, 28, 4, 1, P.coatSh); R(14 + sw, 28, 4, 1, P.coatSh); // полы хаори
  heroLegs(R, o, P.pants, P.pantsSh, P.boot, P.bootHi);
  R(7, 14 + b, 10, 8 - b, P.shirt); R(11, 17 + b, 2, 5 - b, P.shirtSh); R(10, 16 + b, 4, 1, P.gold); R(11, 17 + b, 2, 1, P.gold);
  R(7, 14 + b, 3, 8 - b, P.coat); R(14, 14 + b, 3, 8 - b, P.coat); R(9, 14 + b, 1, 8 - b, P.gold); R(14, 14 + b, 1, 8 - b, P.gold);
  R(7, 22, 10, 2, P.coat); R(11, 22, 2, 2, P.red); R(7, 22, 10, 1, P.coatHi);
  const yl = 15 + b + o.a, yr = 15 + b - o.a;
  R(4, yl, 2, 6, P.coat); R(4, yl + 6, 2, 1, P.gold); R(4, yl + 7, 2, 1, P.skin);
  R(18, yr, 2, 6, P.coat); R(18, yr + 6, 2, 1, P.gold); R(18, yr + 7, 2, 1, P.skin);
  R(4, 14 + b, 4, 2, P.coatHi); R(16, 14 + b, 4, 2, P.coatHi);
  R(10, 13 + b, 4, 1, P.skinSh);
  R(8, 4 + b, 8, 1, P.skin); R(7, 5 + b, 10, 7, P.skin); R(8, 12 + b, 8, 1, P.skinSh);
  R(8, 1 + b, 8, 2, P.hair); R(7, 3 + b, 10, 3, P.hair); R(9, 2 + b, 4, 1, P.hairHi);
  R(6, 4 + b, 2, 5, P.hair); R(16, 4 + b, 2, 5, P.hair);
  R(7, 6 + b, 6, 1, P.hair); R(7, 7 + b, 3, 1, P.hair); R(15, 6 + b, 2, 1, P.hair);
  R(17, 10 + b, 1, 2, P.gold);
  R(13, 7 + b, 2, 1, P.hairSh);
  heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
  R(11, 11 + b, 2, 1, P.lip);
};

// Крупные планы для сюжета
ART_PAINT.akemi = function (A, P) {
  // высокий хвост и волосы за спиной
  A.path('M260 90 C340 60 380 160 350 300 C340 360 350 420 330 460 L290 460 C310 380 300 250 270 170 Z', P.hairSh);
  A.path('M104 160 C80 50 320 50 296 160 C310 240 300 300 292 330 L108 330 C100 300 90 240 104 160 Z', P.hairSh);
  A.path('M252 74 L300 58 L292 104 Z', P.ribbon);
  // шея, плечи, шарф
  A.path('M174 250 L174 324 L226 324 L226 250 Z', P.skinSh, 4);
  const SH = 'M60 460 C66 390 100 345 165 318 L235 318 C300 345 334 390 340 460 Z';
  A.path(SH, P.skin);
  A.inside(SH, 'M262 300 L360 300 L360 470 L300 470 Z', P.skinSh, 0.4);
  A.line('M150 346 Q176 352 194 344', P.skinSh, 3); A.line('M250 346 Q224 352 206 344', P.skinSh, 3);
  // топ-кимоно с запахом
  A.path('M92 460 L104 392 C140 372 176 396 200 440 C224 396 260 372 296 392 L308 460 Z', P.suit);
  A.line('M104 392 C140 372 176 396 200 440 C224 396 260 372 296 392', P.suitHi, 8);
  A.line('M200 440 L200 460', P.skinSh, 4);
  A.path('M150 306 C180 330 220 330 250 306 L256 330 C222 352 178 352 144 330 Z', P.obi);
  // лицо
  A.path(ART_HEAD, P.skin);
  A.inside(ART_HEAD, ART_SHADE, P.skinSh, 0.35);
  A.x.globalAlpha = 0.5; A.ell(142, 230, 18, 9, P.blush); A.ell(258, 230, 18, 9, P.blush); A.x.globalAlpha = 1;
  artEye(A, 163, 192, { iris: P.eye, rx: 20, ry: 19, lash: true, side: -1 });
  artEye(A, 237, 192, { iris: P.eye, rx: 20, ry: 19, lash: true, side: 1 });
  A.line('M138 160 Q164 150 188 162', P.hairSh, 5); A.line('M212 162 Q236 150 262 160', P.hairSh, 5);
  A.line('M198 224 L204 228', P.skinSh, 3);
  A.path('M182 252 Q200 246 220 250 Q204 266 182 252 Z', P.lip, 3);
  // чёлка, пряди, повязка с пластиной
  A.path('M116 162 C104 66 168 44 200 50 C232 44 296 66 284 162 C272 126 254 112 236 108 C232 126 222 138 210 146 C206 124 196 112 184 108 C170 130 152 144 132 150 C128 140 124 134 120 134 Z', P.hair);
  A.mirror(() => A.path('M116 150 C102 210 110 280 120 320 C136 290 136 220 130 168 Z', P.hair));
  A.path('M116 116 C160 100 240 100 284 116 L284 138 C240 122 160 122 116 138 Z', P.obi);
  A.path('M170 108 L230 108 L230 132 L170 132 Z', P.steel, 4); A.line('M186 120 L214 120', ART_OUT, 3);
  A.line('M150 78 Q200 58 250 78', P.hairHi, 7);
};
ART_PAINT.chonguk = function (A, P) {
  // рукоять катаны за плечом
  A.path('M300 300 L336 170 L356 176 L322 306 Z', P.wrap); A.path('M326 176 L366 186 L362 200 L322 190 Z', P.gold, 4);
  A.path('M108 150 C90 60 310 60 292 150 C300 190 296 220 290 240 L110 240 C104 220 100 190 108 150 Z', P.hairSh);
  A.path('M172 250 L172 322 L228 322 L228 250 Z', P.skinSh, 4);
  // рубашка и хаори с золотой каймой
  A.path(ART_TORSO, P.shirt);
  A.line('M170 330 Q200 372 230 330', P.gold, 5); A.ell(200, 362, 7, 9, P.gold, 3);
  A.mirror(() => {
    A.path('M40 460 C48 380 90 335 165 312 L182 460 Z', P.coat);
    A.line('M165 312 L182 460', P.gold, 8);
    A.line('M70 400 C76 420 74 445 72 458', P.coatHi, 7);
  });
  A.path(ART_HEAD, P.skin);
  A.inside(ART_HEAD, ART_SHADE, P.skinSh, 0.4);
  artEye(A, 165, 192, { iris: P.eye, rx: 18, ry: 14 }); artEye(A, 235, 192, { iris: P.eye, rx: 18, ry: 14 });
  A.line('M140 168 Q166 158 190 168', P.hairSh, 6); A.line('M210 168 Q234 158 260 168', P.hairSh, 6);
  A.line('M200 206 L193 230 L204 232', P.skinSh, 3);
  A.line('M180 254 Q204 266 228 248', ART_OUT, 4);
  A.ell(122, 236, 5, 9, P.gold, 3); A.ell(278, 236, 5, 9, P.gold, 3);
  // уложенная чёлка набок
  A.path('M114 156 C100 56 176 36 210 44 C250 36 300 66 286 156 C280 124 268 108 252 100 C230 130 190 150 140 152 C132 140 124 140 114 156 Z', P.hair);
  A.path('M130 96 C160 60 230 50 262 78 C230 72 190 80 160 108 Z', P.hairHi, 0);
};

// ---------------------------------------------------------------- СПРАЙТЫ ЯПОНИИ И ЛОББИ
function buildHubSprites() {
  const reg = (name, w, h, fn) => registerSprite(name, paintSprite(w, h, fn));
  reg('i_shuriken', 8, 8, R => { R(3, 0, 2, 8, '#c7dcd0'); R(0, 3, 8, 2, '#c7dcd0'); R(2, 2, 4, 4, '#94b0c2'); R(3, 3, 2, 2, '#1e1a26'); });
  reg('petal', 8, 8, R => { R(1, 3, 2, 1, '#f9a8c4'); R(5, 5, 2, 1, '#e86a92'); R(4, 1, 1, 1, '#f9a8c4'); R(2, 6, 1, 1, '#f9a8c4'); });
  reg('sakura', 30, 38, R => {
    const T = '#733e39', Ts = '#4a2a2a', PK = '#f28bb0', PKh = '#ffc6da', PKs = '#c8588a';
    R(13, 20, 4, 16, T); R(13, 20, 1, 16, Ts); R(10, 35, 10, 2, T); R(9, 22, 4, 2, T); R(17, 24, 5, 2, T);
    R(8, 3, 14, 4, PK); R(4, 6, 22, 8, PK); R(2, 10, 26, 8, PK); R(5, 18, 20, 4, PK); R(9, 22, 5, 2, PKs); R(18, 22, 6, 2, PKs);
    R(9, 4, 6, 2, PKh); R(5, 8, 5, 3, PKh); R(17, 7, 6, 2, PKh); R(12, 12, 4, 2, PKh); R(21, 13, 4, 2, PKh);
    R(3, 15, 8, 3, PKs); R(15, 17, 9, 3, PKs); R(24, 11, 3, 4, PKs);
  });
  reg('lantern', 14, 22, R => {
    const S = '#94b0c2', Sd = '#566c86';
    R(3, 19, 8, 2, Sd); R(6, 12, 2, 7, S); R(2, 7, 10, 5, S); R(4, 8, 6, 3, '#ffcd75'); R(6, 8, 2, 3, '#fff2a8');
    R(1, 5, 12, 2, Sd); R(3, 4, 8, 1, S); R(6, 2, 2, 2, S);
  });
  reg('bamboo', 12, 32, R => {
    const G = '#5fa84a', Gs = '#3f7a34', L = '#8fd06a';
    R(3, 3, 2, 28, G); R(3, 9, 2, 1, Gs); R(3, 16, 2, 1, Gs); R(3, 23, 2, 1, Gs);
    R(7, 7, 2, 24, G); R(7, 13, 2, 1, Gs); R(7, 20, 2, 1, Gs); R(7, 27, 2, 1, Gs);
    R(1, 5, 2, 1, L); R(5, 2, 2, 1, L); R(9, 9, 2, 1, L); R(5, 12, 2, 1, L); R(9, 5, 2, 1, L); R(1, 11, 2, 1, L);
  });
  reg('torii', 36, 34, R => {
    const RD = '#d8384f', RDs = '#9a2238', BK = '#22242b';
    R(6, 8, 4, 24, RD); R(26, 8, 4, 24, RD); R(8, 8, 2, 24, RDs); R(28, 8, 2, 24, RDs);
    R(5, 30, 6, 2, BK); R(25, 30, 6, 2, BK);
    R(1, 4, 34, 4, RD); R(0, 2, 36, 2, BK); R(1, 7, 34, 1, RDs);
    R(4, 12, 28, 3, RD); R(4, 14, 28, 1, RDs);
    R(16, 8, 4, 4, '#ffcd75');
  });
  // постройки лобби
  reg('h_portal', 28, 32, R => {
    const S = '#94b0c2', Sd = '#566c86', Sh = '#c7dcd0';
    R(3, 9, 5, 20, S); R(20, 9, 5, 20, S); R(6, 9, 2, 20, Sd); R(23, 9, 2, 20, Sd);
    R(5, 4, 18, 5, S); R(3, 6, 22, 4, S); R(8, 2, 12, 3, S); R(8, 2, 12, 1, Sh); R(3, 6, 5, 1, Sh);
    R(1, 28, 9, 3, Sd); R(18, 28, 9, 3, Sd);
    R(13, 4, 2, 2, '#ffcd75'); R(4, 14, 1, 2, '#ffcd75'); R(23, 14, 1, 2, '#ffcd75');
  });
  reg('h_cave', 38, 30, R => {
    const G = '#7d90a6', Gd = '#566c86', Gh = '#aebfd0', K = '#0c0d18';
    R(9, 3, 20, 6, G); R(4, 8, 30, 8, G); R(1, 15, 36, 13, G); R(10, 4, 8, 2, Gh); R(5, 10, 6, 2, Gh);
    R(28, 12, 8, 14, Gd); R(2, 24, 34, 4, Gd);
    R(13, 11, 12, 3, K); R(11, 14, 16, 14, K);
    R(14, 11, 1, 3, Gd); R(19, 11, 1, 4, Gd); R(23, 11, 1, 2, Gd);
    R(15, 20, 2, 2, '#ef3b5b'); R(21, 20, 2, 2, '#ef3b5b');
    R(3, 25, 3, 2, '#e8e0c8'); R(32, 25, 3, 2, '#e8e0c8');
  });
  reg('h_sign', 16, 22, R => {
    R(7, 8, 2, 12, '#733e39'); R(1, 2, 14, 8, '#a3593b'); R(1, 2, 14, 1, '#c98a5a'); R(1, 9, 14, 1, '#733e39');
    R(3, 5, 10, 1, '#4a2a2a'); R(3, 7, 7, 1, '#4a2a2a');
  });
  for (const f of [0, 1]) reg('h_fire' + f, 18, 20, R => {
    R(2, 16, 14, 2, '#733e39'); R(4, 14, 10, 2, '#5a2e1c'); R(1, 17, 3, 2, '#94b0c2'); R(14, 17, 3, 2, '#94b0c2');
    R(6, 7 + f, 6, 8 - f, '#ef7d57'); R(7, 4 + f * 2, 4, 6, '#f59e42'); R(8, 9, 2, 5, '#ffcd75'); R(8 + f, 2 + f, 2, 3, '#f59e42');
  });
  reg('h_stall', 30, 28, R => {
    R(2, 12, 2, 14, '#733e39'); R(26, 12, 2, 14, '#733e39'); R(3, 18, 24, 7, '#a3593b'); R(3, 18, 24, 1, '#c98a5a');
    for (let i = 0; i < 6; i++) R(1 + i * 5, 4, 5, 8, i % 2 ? '#f4f4f4' : '#d8384f');
    R(1, 11, 28, 2, '#9a2238');
    R(7, 15, 3, 3, '#ffcd75'); R(13, 14, 4, 4, '#d8384f'); R(20, 15, 3, 3, '#73eff7');
  });
  reg('h_dojo', 30, 28, R => {
    R(4, 12, 22, 14, '#e8e0c8'); R(4, 12, 22, 1, '#c7dcd0'); R(12, 16, 6, 10, '#4a2a2a'); R(13, 17, 4, 9, '#733e39');
    R(1, 7, 28, 5, '#3b5dc9'); R(0, 10, 30, 2, '#29366f'); R(6, 4, 18, 3, '#3b5dc9'); R(12, 2, 6, 2, '#29366f');
    R(6, 15, 3, 4, '#73eff7'); R(21, 15, 3, 4, '#73eff7');
  });
  reg('h_statue', 20, 30, R => {
    const G = '#ffcd75', Gs = '#d59a3b';
    R(3, 24, 14, 4, '#7d90a6'); R(5, 21, 10, 3, '#94b0c2');
    R(7, 10, 6, 11, G); R(11, 11, 2, 10, Gs); R(7, 4, 6, 6, G); R(4, 11, 3, 6, G); R(13, 8, 3, 3, G); R(15, 2, 2, 7, Gs); R(14, 1, 4, 2, G);
  });
  reg('h_book', 22, 24, R => {
    R(8, 12, 6, 10, '#733e39'); R(4, 20, 14, 3, '#5a2e1c');
    R(2, 5, 9, 8, '#f4f4f4'); R(11, 5, 9, 8, '#e8e0c8'); R(10, 4, 2, 10, '#d8384f'); R(1, 12, 20, 1, '#a3593b');
    R(4, 7, 5, 1, '#566c86'); R(4, 9, 5, 1, '#566c86'); R(13, 7, 5, 1, '#566c86'); R(13, 9, 4, 1, '#566c86');
  });
  // завербованные бойцы выступают и боссами: кадры шага и атаки берём из спрайтов героя
  for (const id of ['akemi', 'chonguk']) {
    SPR[id + '_a'] = SPR[id + '_w1']; SPR[id + '_b'] = SPR[id + '_w4']; SPR[id + '_atk'] = SPR[id + '_w0'];
  }
}
const _initSprites = initSprites;
initSprites = function () { _initSprites(); buildHubSprites(); };

// ---------------------------------------------------------------- СЮЖЕТ ЯПОНИИ
Story.HERO.akemi = { taunt: 'Чужак на моей дороге? Посмотрим, успеешь ли ты моргнуть.', reply: 'Хороший ответ. Тень любит тех, кто не боится.' };
Story.HERO.chonguk = { taunt: 'Сцена занята. Сегодня выступаю я.', reply: 'Тогда устроим номер, который запомнит вся пустошь.' };
Story.BOSS.akemi = 'Стой. Остров сакуры закрыт для чужаков. Хочешь пройти — докажи, что достоин. Успеешь за моей тенью?';
Story.BOSS.chonguk = 'Я обошёл всю пустошь в поисках достойного соперника. Говорят, ты побил ISOSHA? Тогда станцуем — клинок на клинок.';
const JAPAN_SCENES = {
  japan0: [
    { who: '@',      side: 'right', text: 'Сакура? Здесь, посреди пустоши? И воздух чистый...' },
    { who: 'maga',   side: 'left',  text: 'Остров сакуры. Катастрофа обошла его стороной. Говорят, его стерегут двое — и чужаков они не любят.' },
    { who: 'akemi',  side: 'right', text: 'Говорят правду. Дальше — только через меня.' },
  ],
  join_akemi: [
    { who: 'akemi',  side: 'left',  text: 'Ха... Давно меня никто не догонял. Ты дерёшься честно — это редкость.' },
    { who: '@',      side: 'right', text: 'Нам нужны такие, как ты. Мы собираем осколки Врат, чтобы вернуться домой.' },
    { who: 'akemi',  side: 'left',  text: 'Домой... У меня его давно нет. Ладно. Моя тень — теперь ваша. Только не отставайте.' },
  ],
  join_chonguk: [
    { who: 'chonguk', side: 'left',  text: 'Вот это был номер! Я проиграл — и мне это понравилось.' },
    { who: 'akemi',   side: 'right', text: 'Он всегда такой. Поёт, машет катаной и ищет, с кем бы сразиться.' },
    { who: 'chonguk', side: 'left',  text: 'Я искал соперника, а нашёл труппу. Берите меня — обещаю, скучно не будет.' },
    { who: '@',       side: 'right', text: 'Добро пожаловать в отряд.' },
  ],
};
Story.CHAPTERS.splice(Story.CHAPTERS.length - 1, 0,
  { id: 'japan0', title: 'Остров сакуры', hint: 'войди в тории на карте', open: () => Story.chap().japan0, scene: JAPAN_SCENES.japan0 },
  { id: 'join_akemi', title: 'Тень присоединяется', hint: 'победи ISOSHA', open: () => Save.data.recruit.akemi, scene: JAPAN_SCENES.join_akemi },
  { id: 'join_chonguk', title: 'Выход на бис', hint: 'победи ISKA', open: () => Save.data.recruit.chonguk, scene: JAPAN_SCENES.join_chonguk });

// диалог перед боем — с тем боссом, который реально вышел
Story.bossTalk = function (R, def) {
  const id = R.lastBossId || R.loc.boss;
  const seen = Save.data.talked || (Save.data.talked = {}), key = id + ':' + R.ch.id;
  if (seen[key] || !this.BOSS[id]) return;
  seen[key] = true; Save.store();
  const h = this.HERO[R.ch.id];
  this.scene([
    { who: R.ch.id, side: 'right', text: h.taunt },
    { who: id, side: 'left', text: this.BOSS[id] },
    { who: R.ch.id, side: 'right', text: h.reply },
  ], () => UI.show(null));
};

// победа в Японии: побеждённые бойцы переходят на твою сторону
const _finishRun = finishRun;
finishRun = function (R) {
  if (!R.rush && R.loc.id === 'japan' && R.won && !R.recruitDone) {
    R.recruitDone = true;
    const d = Save.data.recruit, fresh = (R.fought || []).filter(id => CHARACTERS.some(c => c.id === id) && !d[id]);
    R.recruited = fresh;
    R.extraScenes = fresh.map(id => JAPAN_SCENES['join_' + id]);
    fresh.forEach(id => { d[id] = true; });
  }
  _finishRun(R);
};

// ---------------------------------------------------------------- ЛОББИ-КАРТА
const Hub = {
  home: false, t: 0, near: null, loc: null, zones: [], labels: null,
  p: { x: 0, y: 42, face: 1, dirX: 0, dirY: -1, moving: false, anim: 0, mvx: 0, mvy: 0, dashT: 0, sprite: 'daler', turnT: 0 },

  init() {
    this.loc = { id: 'hub', seed: 91, details: ['tuft', 'pebbles', 'tuft', 'leaves', 'petal'], decor: [], density: 0,
      ground: { style: 'grass', base: '#5a8a44', dark: '#487236', light: '#70a456', accent: '#9fd070' },
      ground2: { style: 'sand', base: '#c9b07a', dark: '#b09864', light: '#dcc794', accent: '#8a7548' },
      ambient: { dark: 0.14, color: '#0a1020', tint: 'rgba(255,230,170,0.05)', fx: 'fireflies' } };
    TILES.hub = { a: richTiles(this.loc.ground, 91), b: richTiles(this.loc.ground2, 92) };
    const L = id => LOCATIONS.find(l => l.id === id);
    const portal = (id, x, y, tint) => ({ id, x, y, r: 24, kind: 'portal', tint, loc: L(id), name: L(id).name, spr: id === 'japan' ? 'torii' : 'h_portal' });
    const open = fn => () => { Game.state = 'menu'; fn(); };
    this.zones = [
      portal('desert', -170, -70, '#f59e42'), portal('factory', -60, -130, '#73eff7'),
      portal('forest', 60, -130, '#a7f070'), portal('metro', 170, -70, '#c77dff'),
      portal('gates', 0, -235, '#ef3b5b'), portal('japan', 265, 30, '#f28bb0'),
      { id: 'rush', x: -265, y: 30, r: 26, spr: 'h_cave', tint: '#ef3b5b', name: 'Пещера боссов', desc: 'Сразись с любыми боссами — хоть со всеми сразу.', act: open(() => Rush.show()) },
      { id: 'hero', x: 0, y: 0, r: 22, spr: 'h_fire0', tint: '#f59e42', name: 'Костёр отряда', desc: 'Сменить героя и костюм.', act: open(() => UI.showChar()) },
      { id: 'daily', x: -170, y: 110, r: 22, spr: 'altar', tint: '#41a6f6', name: 'Алтарь испытаний', desc: 'Испытание дня: особые правила, одинаковые для всех.', act: open(() => Daily.show()) },
      { id: 'shop', x: -60, y: 160, r: 24, spr: 'h_stall', tint: '#ffcd75', name: 'Лавка торговца', desc: 'Постоянные улучшения за монеты.', act: open(() => UI.showShop()) },
      { id: 'talent', x: 60, y: 160, r: 24, spr: 'h_dojo', tint: '#73eff7', name: 'Додзё', desc: 'Таланты героев.', act: open(() => TalentUI.show(Save.data.hero)) },
      { id: 'ach', x: 170, y: 110, r: 22, spr: 'h_statue', tint: '#ffcd75', name: 'Зал славы', desc: 'Достижения и рекорды.', act: open(() => UI.showAch()) },
      { id: 'story', x: 250, y: 150, r: 22, spr: 'h_book', tint: '#e86a92', name: 'Летопись', desc: 'Пересмотреть открытые главы сюжета.', act: open(() => Story.gallery()) },
      { id: 'exit', x: 0, y: 215, r: 20, spr: 'h_sign', tint: '#94b0c2', name: 'В главное меню', desc: 'Настройки и управление — там.', act: () => this.leave() },
    ];
    // карта компактная: с любой точки видно несколько соседних построек
    this.zones.forEach(z => { z.x = Math.round(z.x * 0.62); z.y = Math.round(z.y * 0.62); z.r = 19; });
    // подписи над объектами и панель «Войти»
    this.labels = $('hub-labels');
    this.labels.innerHTML = this.zones.map((z, i) => `<div class="hub-label" data-i="${i}">${z.name}</div>`).join('');
    $('hub-go').onclick = () => this.use();
    $('hub-diff').onclick = () => { Save.data.nightmare = !Save.data.nightmare; Save.store(); UI.click(); this.near = null; };
  },

  enter() {
    this.home = true;
    const d = Save.data, ch = CHARACTERS.find(c => c.id === d.hero);
    if (!ch || !heroOpen(ch)) d.hero = 'daler';
    this.p.sprite = d.hero + (d.costume[d.hero] && d.wins[d.hero] ? '_alt' : '');
    this.near = null;
    Game.run = null;
    Game.state = 'hub';
    UI.showHUD(false);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    UI.current = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  },
  leave() { this.home = false; Game.state = 'menu'; UI.click(); UI.showMenu(); },

  locked(z) {
    if (z.id !== 'gates') return null;
    const need = LOCATIONS.filter(l => !l.final && !l.side), have = need.filter(l => Save.data.cleared[l.id]).length;
    return have < need.length ? `Нужны осколки Врат: ${have}/${need.length}` : null;
  },

  use() {
    const z = this.near;
    if (!z || Game.state !== 'hub') return;
    Sound.init();
    if (z.kind !== 'portal') { UI.click(); z.act(); return; }
    if (this.locked(z)) { Sound.sfx('hurt'); return; }
    UI.click();
    const d = Save.data, opts = { nightmare: !!d.nightmare && Object.keys(d.wins).length > 0 };
    const go = () => Game.start(d.hero, z.id, opts);
    // первый вход на Остров сакуры — сюжетная сцена
    if (z.id === 'japan' && !Story.chap().japan0) {
      Story.chap().japan0 = true; Save.store();
      Game.state = 'menu';
      Story.scene(JAPAN_SCENES.japan0, go, d.hero);
    } else go();
  },

  // Показывать подписи и панель только пока мы на карте
  sync() {
    const on = Game.state === 'hub';
    if (this.shown !== on) { this.shown = on; $('hub-ui').classList.toggle('hidden', !on); }
  },

  update(dt) {
    const p = this.p, a = Input.axis();
    this.t += dt; p.anim += dt; p.turnT -= dt;
    p.moving = a.x !== 0 || a.y !== 0;
    if (p.moving) {
      const m = Math.hypot(a.x, a.y);
      p.dirX = a.x / m; p.dirY = a.y / m;
      if (Math.abs(a.x) > 0.1) { const f = a.x < 0 ? -1 : 1; if (f !== p.face) { p.face = f; p.turnT = 0.12; } }
    }
    const k = 1 - Math.exp(-dt * 16), sp = 92;
    p.mvx += (a.x * sp - p.mvx) * k; p.mvy += (a.y * sp - p.mvy) * k;
    p.x = clamp(p.x + p.mvx * dt, -215, 215); p.y = clamp(p.y + p.mvy * dt, -185, 165);
    if (Input.dashQ || Input.ultQ) { Input.dashQ = Input.ultQ = false; this.use(); }
    // ближайшая область
    let best = null, bd = 1e9;
    for (const z of this.zones) { const d = Math.hypot(z.x - p.x, z.y + 4 - p.y); if (d < z.r + 12 && d < bd) { bd = d; best = z; } }
    if (best !== this.near) { this.near = best; this.prompt(); }
  },

  prompt() {
    const z = this.near, box = $('hub-prompt');
    box.classList.toggle('hidden', !z);
    if (!z) return;
    const d = Save.data, lock = this.locked(z);
    let desc = z.desc || '', go = 'ВОЙТИ';
    if (z.kind === 'portal') {
      const l = z.loc;
      desc = l.desc + (l.id === 'japan'
        ? (d.recruit.akemi && d.recruit.chonguk ? ' Оба бойца уже в отряде — теперь здесь ждёт их дуэт.' : d.recruit.akemi ? ' Следующий соперник — ISKA.' : ' Победи бойца — и он перейдёт на твою сторону.')
        : ' Босс: ' + (l.final && lock ? '???' : BOSSES[l.boss].name) + (d.cleared[l.id] ? ' · пройдено' : ''));
      go = lock ? 'ЗАКРЫТО' : 'В ПУТЬ!';
    }
    $('hub-name').textContent = z.name;
    $('hub-desc').textContent = lock ? lock : desc;
    $('hub-go').textContent = go + (matchMedia('(hover: hover)').matches && !lock ? '  [E]' : '');
    $('hub-go').disabled = !!lock;
    const diff = $('hub-diff'), showDiff = z.kind === 'portal' && !lock && Object.keys(d.wins).length > 0;
    diff.classList.toggle('hidden', !showDiff);
    diff.textContent = d.nightmare ? 'Сложность: КОШМАР' : 'Сложность: обычная';
    diff.classList.toggle('on', !!d.nightmare);
  },

  render(ctx, W, H) {
    const p = this.p, loc = this.loc;
    const cx = Math.round(p.x - W / 2), cy = Math.round(p.y - 8 - H / 2);
    Game.camX = cx; Game.camY = cy;
    drawGround(ctx, loc, cx, cy, W, H);
    const list = [], lights = [];
    collectDecor(ctx, loc, cx, cy, W, H, list, lights);
    lights.push({ x: p.x - cx, y: p.y - cy, r: 80, c: '#ffcd75', a: 0.08 });
    for (const z of this.zones) list.push({ y: z.y, z });
    list.push({ y: p.y + 12, me: true });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.me) {
        shadow(ctx, p.x, p.y + 10, 11);
        const sx = p.turnT > 0 ? 1 - 0.65 * (p.turnT / 0.12) : 1;
        sprFeet(ctx, heroFrame(p), p.x, p.y + 12, p.face < 0, false, sx * HERO_SC, HERO_SC);
        continue;
      }
      const z = it.z, lock = this.locked(z), near = z === this.near;
      let name = z.spr;
      if (z.id === 'hero') name = 'h_fire' + (Math.floor(this.t * 8) % 2);
      const s = SPR[name];
      shadow(ctx, z.x, z.y - 2, s.sw * 0.8);
      sprFeet(ctx, name, z.x, z.y, false, false, 1, 1);
      if (z.kind === 'portal' && z.id !== 'japan') {
        // вихрь внутри арки
        const px = z.x - cx, py = z.y - 13 - cy;
        ctx.fillStyle = lock ? '#33363f' : '#14162a';
        ctx.fillRect(Math.round(px - 6), Math.round(py - 8), 12, 20);
        if (!lock) for (let i = 0; i < 22; i++) {
          const a = this.t * 3 + i * 0.55, r = 1 + (i % 11) * 0.9;
          ctx.fillStyle = i % 3 ? z.tint : '#f4f4f4';
          ctx.fillRect(Math.round(px + Math.cos(a) * r * 0.6), Math.round(py + 2 + Math.sin(a) * r), 1, 1);
        }
      }
      if (!lock) lights.push({ x: z.x - cx, y: z.y - 12 - cy, r: near ? 34 : 24, c: z.tint, a: (near ? 0.5 : 0.3) + Math.sin(this.t * 3 + z.x) * 0.06 });
      // кольцо под ногами у активной области
      if (near) { ctx.globalAlpha = 0.6 + Math.sin(this.t * 8) * 0.3; pxCircle(ctx, z.x - cx, z.y - cy + 1, z.r * 0.7, '#ffcd75'); ctx.globalAlpha = 1; }
    }
    applyLighting(ctx, loc, lights, W, H);
    drawAmbient(ctx, loc, cx, cy, W, H);
    // подписи (HTML поверх холста)
    const sc = Game.scale, els = this.labels.children;
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i], el = els[i], x = (z.x - cx) * sc, y = (z.y - SPR[z.id === 'hero' ? 'h_fire0' : z.spr].sh - 4 - cy) * sc;
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      el.classList.toggle('on', z === this.near);
    }
  },
};

// ---------------------------------------------------------------- ВСТРАИВАНИЕ В ИНТЕРФЕЙС
const HubUI = {
  init() {
    Hub.init();
    // главное меню: режимы теперь выбираются на карте
    ['btn-daily', 'btn-rush', 'btn-shop', 'btn-talent', 'btn-ach', 'btn-story'].forEach(id => { $(id).style.display = 'none'; });
    $('btn-play').onclick = () => {
      UI.click();
      if (Save.data.introSeen) return Hub.enter();
      Save.data.introSeen = true; Save.store();
      Story.scene(Story.INTRO_SCENE, () => Hub.enter());
    };

    // «Назад» и «В меню» возвращают на карту, если мы пришли с неё
    const show = UI.show.bind(UI);
    UI.show = name => { if (name === 'menu' && Hub.home) Hub.enter(); else show(name); };

    // выбор героя у костра: закрытые бойцы затемнены; выбор сразу возвращает на карту
    const showChar = UI.showChar.bind(UI);
    UI.showChar = () => {
      showChar();
      for (const c of CHARACTERS) {
        if (heroOpen(c)) continue;
        const card = document.querySelector(`#char-cards .card[data-id="${c.id}"]`);
        card.disabled = true; card.classList.add('locked');
        card.querySelector('img.portrait').style.filter = 'brightness(0.15)';
        card.querySelector('.card-name').textContent = '???';
        const lock = card.querySelector('.costume-lock');
        if (lock) lock.textContent = 'Победи этого бойца на Острове сакуры';
      }
    };
    const showLoc = UI.showLoc.bind(UI);
    UI.showLoc = () => {
      if (!Hub.home) return showLoc();
      Save.data.hero = UI.selChar; Save.store();
      Hub.enter();
    };

    // комната боссов: закрытых героев выбрать нельзя
    const rushShow = Rush.show.bind(Rush);
    Rush.show = () => {
      if (!heroOpen(CHARACTERS.find(c => c.id === Rush.hero))) Rush.hero = Save.data.hero;
      rushShow();
      for (const c of CHARACTERS) if (!heroOpen(c)) { const b = document.querySelector(`#rush-heroes [data-h="${c.id}"]`); if (b) b.remove(); }
    };
    // таланты: вкладки только открытых героев
    const talShow = TalentUI.show.bind(TalentUI);
    TalentUI.show = id => {
      talShow(id);
      for (const c of CHARACTERS) if (!heroOpen(c)) { const b = document.querySelector(`#tal-tabs [data-h="${c.id}"]`); if (b) b.remove(); }
    };

    // экран итогов: кто присоединился
    const showEnd = UI.showEnd.bind(UI);
    UI.showEnd = R => {
      showEnd(R);
      if (R.recruited && R.recruited.length) {
        $('end-ach').insertAdjacentHTML('afterbegin', R.recruited.map(id => {
          const c = CHARACTERS.find(x => x.id === id);
          return `<div class="ach-row done"><span class="mark">★</span><div class="shop-info"><div class="card-name">${c.name} теперь в отряде!</div><div class="muted">Выбери нового героя у костра на карте</div></div></div>`;
        }).join(''));
        R.recruited = null;
      }
    };

    // клавиши на карте: E / Enter / пробел — войти, Esc — в главное меню
    const onKey = Input.onKey;
    Input.onKey = e => {
      if (Game.state === 'hub') {
        if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); Input.dashQ = Input.ultQ = false; Hub.use(); }
        else if (e.code === 'Escape') Hub.leave();
        return;
      }
      onKey(e);
    };
  },
};
