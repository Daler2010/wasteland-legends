// ===== Лобби-карта, территория «Япония» и герои, которых можно завербовать =====

// ---------------------------------------------------------------- НОВЫЕ ГЕРОИ
// Все они — обычные игровые герои, доступные сразу
CHARACTERS.push(
  { id: 'akemi', name: 'ISOSHA', title: 'Куноити', sprite: 'akemi', hp: 85, speed: 80, armor: 0, regen: 0, weapon: 'shuriken',
    desc: 'Самая быстрая из героев. Мечет сюрикены веером. Ульта: танец теней.' },
  { id: 'chonguk', name: 'ISKA', title: 'Мечник-айдол', sprite: 'chonguk', hp: 120, speed: 68, armor: 1, regen: 0, weapon: 'katana',
    desc: 'Молниеносная катана и сцена в крови. Ульта: сольный выход.' },
  { id: 'jaha', name: 'JAHA', title: 'Король', sprite: 'jaha', hp: 140, speed: 63, armor: 1, regen: 0.3, weapon: 'scepter',
    desc: 'Король в изгнании. Его скипетр выпускает самонаводящиеся сферы. Ульта: королевский указ.' },
  { id: 'bilol', name: 'BILOL', title: 'Ниндзя', sprite: 'bilol', hp: 100, speed: 82, armor: 0, regen: 0, weapon: 'shadow',
    desc: 'Тень среди теней. Мгновенно настигает ближайших врагов. Ульта: дымовая завеса.' });
const heroOpen = () => true;
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
  else if (id === 'jaha') { this.tone(230, 0.5, 'triangle', 0.16, 345); this.tone(345, 0.5, 'square', 0.06, 460, now + 0.1); }
  else if (id === 'bilol') { this.noise(0.4, 0.12, 2400, 'bandpass'); this.tone(880, 0.12, 'sine', 0.08, 220); }
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

// ---------------------------------------------------------------- JAHA И BILOL
Object.assign(WEAPONS, {
  scepter: { name: 'Королевский скипетр', icon: 'i_scepter',
    levels: [
      { dmg: 14, cd: 1.1, count: 1 },
      { dmg: 17, cd: 1.1, count: 2 },
      { dmg: 20, cd: 1.0, count: 2 },
      { dmg: 23, cd: 0.9, count: 3 },
      { dmg: 27, cd: 0.8, count: 4 }],
    descs: ['Золотая сфера сама находит врага', '+1 сфера, +урон', '+урон, чаще', '+1 сфера', '+1 сфера, +урон, чаще'],
    evo: { name: 'Воля короны', need: 'wallet', desc: 'Шесть мощных сфер за раз', stats: { dmg: 40, cd: 0.6, count: 6 } } },
  shadow: { name: 'Теневой удар', icon: 'i_shadow',
    levels: [
      { dmg: 14, cd: 1.0, count: 1 },
      { dmg: 17, cd: 0.95, count: 2 },
      { dmg: 20, cd: 0.85, count: 2 },
      { dmg: 23, cd: 0.8, count: 3 },
      { dmg: 27, cd: 0.7, count: 4 }],
    descs: ['Мгновенный удар по ближайшему врагу', '+1 цель, +урон', '+урон, чаще', '+1 цель', '+1 цель, +урон, чаще'],
    evo: { name: 'Тысяча теней', need: 'boots', desc: 'Восемь ударов почти без передышки', stats: { dmg: 42, cd: 0.5, count: 8 } } },
});
WEAPON_LOGIC.scepter = {
  update(w, dt, R) {
    w.t -= dt;
    if (w.t > 0) return;
    const s = wStats(w), p = R.p;
    if (!nearestEnemy(R, p.x, p.y, 230)) { w.t = 0.15; return; }
    w.t = s.cd * p.cdMul;
    p.atkT = 0.2;
    for (let i = 0; i < s.count; i++) {
      const a = -Math.PI / 2 + (i - (s.count - 1) / 2) * 0.6;
      R.projs.push({ type: 'seek', x: p.x, y: p.y - 8, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, dmg: s.dmg, life: 3, big: w.evo });
    }
    Sound.sfx('gem');
  },
};
WEAPON_LOGIC.shadow = {
  update(w, dt, R) {
    w.t -= dt;
    if (w.t > 0) return;
    const s = wStats(w), p = R.p, used = new Set();
    let hit = 0;
    for (let i = 0; i < s.count; i++) {
      const e = nearestEnemy(R, p.x, p.y, 135, used);
      if (!e) break;
      used.add(e); hit++;
      R.effects.push({ type: 'bolt', pts: [[p.x, p.y], [e.x, e.y]], t: 0, dur: 0.12 });
      R.ghosts.push({ name: p.sprite + '_w' + (i % 6), x: e.x - (e.x > p.x ? 8 : -8), y: e.y, flip: e.x < p.x, life: 0.18 });
      hurtEnemy(R, e, s.dmg, e.x - p.x, e.y - p.y, 70);
    }
    if (hit) { w.t = s.cd * p.cdMul; p.atkT = 0.12; Sound.sfx('sword'); } else w.t = 0.1;
  },
};
// самонаводящиеся сферы скипетра
const _upExtra = updateExtraProj, _drawExtra = drawExtraProj;
updateExtraProj = function (R, pr, dt) {
  if (pr.type !== 'seek') return _upExtra(R, pr, dt);
  pr.life -= dt;
  const e = nearestEnemy(R, pr.x, pr.y, 240);
  if (e) {
    const dx = e.x - pr.x, dy = e.y - pr.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 7), sp = 170;
    pr.vx += (dx / d * sp - pr.vx) * k; pr.vy += (dy / d * sp - pr.vy) * k;
    const rr = e.r + (pr.big ? 6 : 4);
    if (d < rr) { pr.life = 0; hurtEnemy(R, e, pr.dmg, pr.vx, pr.vy, 60); burst(R, pr.x, pr.y, 5, '#ffcd75'); return; }
  }
  pr.x += pr.vx * dt; pr.y += pr.vy * dt;
  if (Math.random() < 0.5 && R.particles.length < 500) R.particles.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, life: 0.25, c: '#ffcd75', s: 1, g: 0 });
};
drawExtraProj = function (ctx, R, pr, cx, cy) {
  if (pr.type !== 'seek') return _drawExtra(ctx, R, pr, cx, cy);
  const x = pr.x - cx, y = pr.y - cy, r = pr.big ? 4 : 3;
  pxDisc(ctx, x, y, r, '#1e1a26'); pxDisc(ctx, x, y, r - 1, '#ffcd75');
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 1, 1);
};

Object.assign(ULTS, {
  jaha:  { name: 'Королевский указ', desc: 'Золотые разряды по десяти врагам и лечение' },
  bilol: { name: 'Дымовая завеса',   desc: 'Оглушает всех вокруг, герой неуязвим 3 секунды' },
});
ULT_EXTRA.jaha = function (R) {
  const p = R.p, hw = Game.W / 2, hh = Game.H / 2;
  const list = shuffle(R.enemies.filter(e => !e.dead && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh)).slice(0, 10);
  for (const e of list) {
    R.effects.push({ type: 'bolt', pts: jagged(e.x + rand(-16, 16), e.y - 140, e.x, e.y), t: 0, dur: 0.25 });
    burst(R, e.x, e.y, 10, '#ffcd75');
    boomArea(R, e.x, e.y, 28, 55, 120);
  }
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15);
  Sound.sfx('zap'); Sound.sfx('chest');
};
ULT_EXTRA.bilol = function (R) {
  const p = R.p;
  for (const e of R.enemies) {
    if (e.dead || dist2(e.x, e.y, p.x, p.y) > 140 * 140) continue;
    e.stunT = e.boss ? 1 : 3;
    hurtEnemy(R, e, 25, e.x - p.x, e.y - p.y, 60);
  }
  for (let i = 0; i < 46 && R.particles.length < 500; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(20, 110);
    R.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1.1), c: i % 2 ? '#566c86' : '#94b0c2', s: 2, g: 0 });
  }
  p.invT = 3;
  Sound.sfx('fire'); Sound.sfx('dash');
};
Object.assign(COSTUMES, { jaha: 'Император', bilol: 'Белый призрак' });
Object.assign(HERO_TINT, { jaha: '#b13e53', bilol: '#29366f' });
Object.assign(VOICE, { jaha: { f: 230, w: 'triangle' }, bilol: { f: 440, w: 'sine' }, oni: { f: 80, w: 'sawtooth' } });

TALENTS.jaha = [
  { id: 'crown',  tier: 1, max: 3, name: 'Бремя короны',  desc: '+12 макс. HP',                 eff: { hp: 12 } },
  { id: 'decree', tier: 1, max: 3, name: 'Указ',          desc: '+6% урон',                     eff: { dmg: 0.06 } },
  { id: 'tax',    tier: 1, max: 3, name: 'Казна',         desc: '+8% опыта',                    eff: { xp: 0.08 } },
  { id: 'guard',  tier: 2, max: 2, name: 'Королевские латы', desc: '+1 броня',                  eff: { armor: 1 } },
  { id: 'bless',  tier: 2, max: 3, name: 'Благословение', desc: '+0.2 HP в секунду',            eff: { regen: 0.2 } },
  { id: 'orb',    tier: 2, max: 3, name: 'Держава',       desc: '-4% перезарядка оружия',       eff: { cd: 0.04 } },
  { id: 'law',    tier: 3, max: 3, name: 'Закон',         desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
  { id: 'relic',  tier: 3, max: 1, name: 'Реликвия',      desc: 'Скипетр с самого начала 2 уровня', eff: { wlvl: 1 } },
];
TALENTS.bilol = [
  { id: 'swift',  tier: 1, max: 3, name: 'Бесшумный шаг', desc: '+4% скорость',                 eff: { spd: 0.04 } },
  { id: 'strike', tier: 1, max: 3, name: 'Точный удар',   desc: '+4% шанс крита',               eff: { crit: 0.04 } },
  { id: 'loot',   tier: 1, max: 3, name: 'Ловкие руки',   desc: '+10% радиус сбора',            eff: { magnet: 0.1 } },
  { id: 'blink',  tier: 2, max: 3, name: 'Перекат',       desc: '-12% перезарядка рывка',       eff: { dash: 0.12 } },
  { id: 'poison', tier: 2, max: 3, name: 'Яд на клинке',  desc: '+6% урон',                     eff: { dmg: 0.06 } },
  { id: 'hunt',   tier: 2, max: 3, name: 'Охота',         desc: '+10% урон по боссам и элите',  eff: { boss: 0.1 } },
  { id: 'smoke',  tier: 3, max: 3, name: 'Запас дыма',    desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
  { id: 'art',    tier: 3, max: 1, name: 'Тайное искусство', desc: 'Теневой удар с самого начала 2 уровня', eff: { wlvl: 1 } },
];

HERO_PAL.jaha = { skin: '#f0c090', skinSh: '#c88a5a', beard: '#e8e8f0', beardSh: '#b0b0c8', gold: '#ffcd75', goldSh: '#d59a3b', ruby: '#ef3b5b',
  cloak: '#b13e53', cloakSh: '#7d2a3b', fur: '#f4f4f4', furDot: '#22242b', armor: '#ffcd75', armorSh: '#d59a3b', sash: '#3b5dc9',
  pants: '#5d275d', pantsSh: '#3a1a4a', boot: '#733e39', bootHi: '#a3593b', white: '#f4f4f4', eye: '#3b5dc9', gem: '#73eff7' };
HERO_PAL_ALT.jaha = { cloak: '#3b5dc9', cloakSh: '#29366f', sash: '#d8384f', pants: '#22242b', pantsSh: '#14151a', ruby: '#73eff7', gem: '#ef3b5b' };
HERO_PAL.bilol = { skin: '#e8b890', skinSh: '#b88a5a', suit: '#2a3050', suitSh: '#181c30', suitHi: '#46507a', band: '#d8384f', bandSh: '#9a2238',
  wrap: '#94b0c2', steel: '#aebfd0', gold: '#ffcd75', white: '#f4f4f4', eye: '#73eff7' };
HERO_PAL_ALT.bilol = { suit: '#e8e8f0', suitSh: '#b0b0c8', suitHi: '#ffffff', band: '#3b5dc9', bandSh: '#29366f', eye: '#ef3b5b' };

// Король: корона с рубином, седая борода, мантия с горностаем, золотой нагрудник, лента, скипетр
HERO_PAINT.jaha = function (R, P, o) {
  const b = o.b, sw = o.sw;
  R(3, 14 + b, 18, 10 - b, P.cloak);
  for (let y = 24; y <= 31; y++) { const sh = Math.round(sw * (y - 23) / 4); R(4 + sh, y, 16, 1, P.cloak); R(7 + sh, y, 1, 1, P.cloakSh); R(16 + sh, y, 1, 1, P.cloakSh); }
  R(4 + Math.round(sw * 2), 32, 16, 1, P.fur);
  heroLegs(R, o, P.pants, P.pantsSh, P.boot, P.bootHi);
  R(7, 14 + b, 10, 8 - b, P.armor); R(15, 15 + b, 2, 6 - b, P.armorSh); R(8, 16 + b, 1, 4 - b, P.white); R(11, 17 + b, 2, 3 - b, P.ruby);
  for (let i = 0; i < 6 - b; i++) R(8 + i, 16 + b + i, 2, 1, P.sash);
  R(7, 22, 10, 2, P.cloakSh); R(11, 22, 2, 2, P.gold);
  R(7, 24, 5, 2, P.cloak); R(13, 24, 4, 2, P.cloak);
  const yl = 16 + b + o.a, yr = 16 + b - o.a;
  R(4, yl, 2, 5, P.cloak); R(4, yl + 5, 2, 1, P.gold); R(4, yl + 6, 2, 1, P.skin);
  R(18, yr, 2, 5, P.cloak); R(18, yr + 5, 2, 1, P.gold); R(18, yr + 6, 2, 1, P.skin);
  R(20, yr - 5, 1, 13, P.goldSh); R(19, yr - 8, 3, 3, P.gem); R(20, yr - 9, 1, 1, P.white); // скипетр
  R(4, 13 + b, 16, 3, P.fur); R(6, 14 + b, 1, 1, P.furDot); R(9, 15 + b, 1, 1, P.furDot); R(14, 14 + b, 1, 1, P.furDot); R(17, 15 + b, 1, 1, P.furDot);
  R(8, 4 + b, 8, 1, P.skin); R(7, 5 + b, 10, 7, P.skin);
  R(6, 5 + b, 1, 6, P.beard); R(17, 5 + b, 1, 6, P.beard);
  R(7, 10 + b, 10, 3, P.beard); R(8, 13 + b, 8, 1, P.beard); R(10, 14 + b, 4, 1, P.beardSh);
  R(9, 10 + b, 6, 1, P.beardSh); R(11, 11 + b, 2, 1, P.skinSh);
  R(7, 2 + b, 10, 3, P.gold); R(7, 4 + b, 10, 1, P.goldSh); R(7, b, 2, 2, P.gold); R(11, b - 1, 2, 3, P.gold); R(15, b, 2, 2, P.gold);
  R(11, 2 + b, 2, 1, P.ruby); R(8, 3 + b, 1, 1, P.gem); R(15, 3 + b, 1, 1, P.gem);
  R(9, 7 + b, 2, 1, P.beardSh); R(13, 7 + b, 2, 1, P.beardSh);
  heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
};

// Ниндзя: маска-капюшон, видны только глаза, повязка с развевающимися концами, перевязи, обмотки, катана за спиной
HERO_PAINT.bilol = function (R, P, o) {
  const b = o.b, sw = o.sw;
  R(16, 3 + b, 2, 5, P.wrap); R(15, 8 + b, 4, 1, P.gold);
  R(17 + sw, 5 + b, 4, 1, P.band); R(19 + sw * 2, 6 + b, 3, 1, P.bandSh); R(18 + sw, 7 + b, 3, 1, P.band);
  heroLegs(R, o, P.suit, P.suitSh, P.suitSh, P.suitHi);
  R(8, 29 - o.lL, 4, 1, P.wrap); R(13, 29 - o.lR, 4, 1, P.wrap);
  R(7, 14 + b, 10, 8 - b, P.suit); R(15, 15 + b, 2, 6 - b, P.suitSh);
  for (let i = 0; i < 6 - b; i++) { R(8 + i, 15 + b + i, 1, 1, P.suitHi); R(15 - i, 15 + b + i, 1, 1, P.suitHi); }
  R(7, 22, 10, 2, P.band); R(7, 23, 10, 1, P.bandSh); R(11, 22, 2, 1, P.gold);
  R(7, 24, 5, 2, P.suit); R(13, 24, 4, 2, P.suit);
  const yl = 15 + b + o.a, yr = 15 + b - o.a;
  R(4, yl, 2, 4, P.suit); R(4, yl + 4, 2, 3, P.wrap); R(4, yl + 7, 2, 1, P.skin);
  R(18, yr, 2, 4, P.suit); R(18, yr + 4, 2, 3, P.wrap); R(18, yr + 7, 2, 1, P.skin); R(20, yr + 6, 1, 3, P.steel);
  R(4, 14 + b, 4, 1, P.suitHi); R(16, 14 + b, 4, 1, P.suitHi);
  R(8, 13 + b, 8, 1, P.suitSh);
  R(8, 3 + b, 8, 1, P.suit); R(7, 4 + b, 10, 9, P.suit); R(8, 4 + b, 4, 1, P.suitHi);
  R(8, 7 + b, 8, 3, P.skin);
  R(7, 5 + b, 10, 1, P.band); R(11, 5 + b, 2, 1, P.steel);
  heroEye(R, P, 9, 8 + b, o.blink); heroEye(R, P, 13, 8 + b, o.blink);
  R(9, 7 + b, 2, 1, P.suitSh); R(13, 7 + b, 2, 1, P.suitSh);
  R(10, 11 + b, 4, 1, P.suitSh);
};

ART_PAINT.jaha = function (A, P) {
  A.path(ART_TORSO, P.cloak);
  A.inside(ART_TORSO, 'M262 300 L380 300 L380 470 L300 470 Z', P.cloakSh, 0.7);
  A.path('M150 330 L250 330 L262 460 L138 460 Z', P.armor);
  A.path('M200 384 L218 408 L200 440 L182 408 Z', P.ruby, 4);
  // горностаевый воротник
  A.path('M66 374 C100 320 160 300 200 332 C240 300 300 320 334 374 C300 384 250 362 200 388 C150 362 100 384 66 374 Z', P.fur);
  for (const [x, y] of [[108, 354], [150, 340], [250, 340], [292, 354], [200, 364]]) A.ell(x, y, 5, 7, P.furDot);
  A.path('M172 250 L172 322 L228 322 L228 250 Z', P.skinSh, 4);
  A.path(ART_HEAD_W, P.skin);
  A.inside(ART_HEAD_W, ART_SHADE, P.skinSh, 0.45);
  artEye(A, 166, 188, { iris: P.eye, rx: 17, ry: 13 }); artEye(A, 234, 188, { iris: P.eye, rx: 17, ry: 13 });
  A.line('M140 166 Q166 152 190 168', P.beardSh, 8); A.line('M260 166 Q234 152 210 168', P.beardSh, 8);
  A.line('M200 200 L191 226 L206 228', P.skinSh, 4);
  // борода, усы, виски
  A.path('M120 214 C128 304 170 350 200 356 C230 350 272 304 280 214 C256 240 230 248 200 248 C170 248 144 240 120 214 Z', P.beard);
  A.line('M158 272 C170 304 186 326 198 334', P.beardSh, 5); A.line('M242 272 C230 304 214 326 202 334', P.beardSh, 5);
  A.path('M148 238 C170 222 190 226 200 236 C210 226 230 222 252 238 C230 252 212 248 200 242 C188 248 170 252 148 238 Z', P.beard);
  A.line('M188 254 Q200 260 212 254', ART_OUT, 3);
  A.mirror(() => A.path('M116 150 C104 190 108 232 122 252 C132 222 130 182 134 152 Z', P.beard));
  // корона
  A.path('M112 152 L104 50 L144 98 L170 28 L200 88 L230 28 L256 98 L296 50 L288 152 Z', P.gold);
  A.path('M112 152 L288 152 L284 174 L116 174 Z', P.goldSh);
  A.ell(200, 122, 12, 15, P.ruby, 4); A.ell(196, 116, 4, 5, '#ffffff');
  A.ell(150, 134, 7, 8, P.gem, 3); A.ell(250, 134, 7, 8, P.gem, 3);
};
ART_PAINT.bilol = function (A, P) {
  A.path('M286 300 L318 150 L340 156 L310 306 Z', P.wrap); A.path('M306 156 L350 166 L346 182 L302 172 Z', P.gold, 4);
  A.path('M284 128 C330 118 370 140 392 172 C360 160 330 160 298 160 Z', P.band);
  A.path('M288 150 C330 160 356 192 366 226 C340 202 316 188 292 178 Z', P.bandSh);
  A.path('M172 250 L172 322 L228 322 L228 250 Z', P.suitSh, 4);
  A.path(ART_TORSO, P.suit);
  A.inside(ART_TORSO, 'M262 300 L380 300 L380 470 L300 470 Z', P.suitSh, 0.8);
  A.inside(ART_TORSO, 'M112 340 L132 330 L292 460 L262 460 Z', P.suitHi); A.inside(ART_TORSO, 'M288 340 L268 330 L108 460 L138 460 Z', P.suitHi);
  A.path('M148 306 C180 332 220 332 252 306 L260 338 C222 358 178 358 140 338 Z', P.suitSh);
  // капюшон и прорезь для глаз
  A.path('M112 170 C104 50 296 50 288 170 C288 236 250 286 200 292 C150 286 112 236 112 170 Z', P.suit);
  const SLIT = 'M128 158 C160 146 240 146 272 158 L272 214 C240 226 160 226 128 214 Z';
  A.path(SLIT, P.skin, 4);
  A.inside(SLIT, ART_SHADE, P.skinSh, 0.45);
  artEye(A, 165, 190, { iris: P.eye, rx: 19, ry: 13 }); artEye(A, 235, 190, { iris: P.eye, rx: 19, ry: 13 });
  A.line('M138 166 L190 176', ART_OUT, 7); A.line('M262 166 L210 176', ART_OUT, 7);
  A.path('M110 116 C160 98 240 98 290 116 L290 142 C240 124 160 124 110 142 Z', P.band);
  A.path('M168 104 L232 104 L232 134 L168 134 Z', P.steel, 4); A.line('M184 119 L216 119', ART_OUT, 3);
  A.line('M140 84 Q200 62 250 80', P.suitHi, 7);
  A.line('M150 248 Q200 264 250 248', P.suitSh, 5);
};
// Демон Они: красная кожа, белая грива, рога, золотые глаза, клыки
ART_PAINT.oni = function (A) {
  const S = '#d8384f', Sh = '#9a2238', H = '#f4f4f4', B = '#f0e6c8';
  A.path('M80 170 C40 36 360 36 320 170 C360 260 352 360 342 460 L58 460 C48 360 40 260 80 170 Z', H);
  const BODY = 'M10 460 C20 380 70 332 140 306 L260 306 C330 332 380 380 390 460 Z';
  A.path(BODY, S);
  A.inside(BODY, 'M262 300 L400 300 L400 470 L300 470 Z', Sh, 0.6);
  A.path('M108 460 L130 384 L270 384 L292 460 Z', '#33363f'); A.line('M130 404 L270 404', '#ffcd75', 6);
  A.mirror(() => { A.path('M130 98 C108 50 98 10 120 -22 C134 20 150 52 170 82 Z', B); A.line('M124 20 C130 44 140 62 152 78', '#b8a880', 4); });
  const HEAD = 'M100 170 C92 58 308 58 300 170 C304 250 264 300 200 304 C136 300 96 250 100 170 Z';
  A.path(HEAD, S);
  A.inside(HEAD, ART_SHADE, Sh, 0.5);
  artEye(A, 156, 188, { iris: '#ffcd75', rx: 20, ry: 13 }); artEye(A, 244, 188, { iris: '#ffcd75', rx: 20, ry: 13 });
  A.line('M122 158 L186 178', ART_OUT, 12); A.line('M278 158 L214 178', ART_OUT, 12);
  A.path('M184 216 Q200 238 216 216 Q200 228 184 216 Z', Sh, 3);
  A.path('M136 252 Q200 238 264 252 Q254 296 200 298 Q146 296 136 252 Z', '#2a1018', 4);
  for (const x of [152, 176, 206, 230]) A.path(`M${x} 250 l9 16 l9 -16 Z`, B, 3);
  A.path('M150 294 L140 242 L164 272 Z', B, 4); A.path('M250 294 L260 242 L236 272 Z', B, 4);
  A.path('M110 132 C140 70 260 70 290 132 C260 114 240 120 226 140 C214 116 196 110 186 138 C172 114 150 112 110 132 Z', H);
};
// Спрайт Они для боя (нарисован в натуральную величину, как остальные боссы)
ENEMY_PAINT.oni = function (R, o) {
  const S = '#d8384f', Sh = '#9a2238', Hi = '#ff7088', H = '#f4f4f4', B = '#f0e6c8', AR = '#33363f', GD = '#ffcd75', W = '#733e39';
  const lL = o.f ? 3 : 0, lR = o.f ? 0 : 3, up = o.atk ? -8 : 0;
  R(12, 6, 24, 22, H); R(10, 14, 28, 12, '#c7dcd0');
  R(14, 40, 8, 7 - lL, S); R(13, 47 - lL, 10, 4, AR); R(26, 40, 8, 7 - lR, S); R(25, 47 - lR, 10, 4, AR);
  R(12, 34, 24, 7, GD); for (let i = 0; i < 5; i++) R(14 + i * 5, 35, 2, 5, '#22242b');
  R(11, 18, 26, 17, S); R(33, 20, 4, 15, Sh); R(13, 20, 9, 2, Hi); R(26, 20, 9, 2, Hi);
  R(13, 25, 9, 1, Sh); R(26, 25, 9, 1, Sh); R(23, 20, 2, 14, Sh); R(16, 29, 5, 1, Hi); R(27, 29, 5, 1, Hi);
  R(5, 16, 9, 6, AR); R(5, 16, 9, 1, GD); R(34, 16, 9, 6, AR); R(34, 16, 9, 1, GD);
  R(4, 22, 7, 12, S); R(4, 22, 2, 12, Hi); R(3, 34, 8, 5, Sh);
  R(37, 22 + up, 7, 12, S); R(42, 22 + up, 2, 12, Sh); R(37, 34 + up, 8, 5, Sh);
  R(43, 12 + up, 4, 26, W); R(42, 10 + up, 6, 14, '#566c86');
  R(42, 12 + up, 1, 1, GD); R(47, 15 + up, 1, 1, GD); R(42, 18 + up, 1, 1, GD); R(47, 21 + up, 1, 1, GD);
  R(18, 3, 12, 2, S); R(16, 5, 16, 13, S); R(30, 7, 2, 10, Sh);
  R(15, 2, 3, 4, B); R(14, 1, 2, 2, B); R(30, 2, 3, 4, B); R(32, 1, 2, 2, B);
  R(17, 4, 14, 3, H); R(20, 7, 3, 1, H); R(26, 7, 2, 1, H);
  R(18, 9, 5, 1, EK); R(25, 9, 5, 1, EK); R(19, 10, 3, 2, GD); R(26, 10, 3, 2, GD); R(20, 10, 1, 2, EK); R(27, 10, 1, 2, EK);
  R(19, 14, 10, o.atk ? 4 : 2, '#2a1018'); R(19, 13, 2, 3, B); R(27, 13, 2, 3, B); R(22, 14, 1, 1, B); R(25, 14, 1, 1, B);
};

// ---------------------------------------------------------------- ЯПОНИЯ
const JAPAN = { id: 'japan', name: 'Остров сакуры', seed: 88, music: 'japan', boss: 'oni', side: true,
  desc: 'Клочок земли, который обошла катастрофа: сакура, бамбук и каменные фонари. Но остров захватил демон.',
  ground: { style: 'grass', base: '#4f7a3a', dark: '#3f6330', light: '#65924a', accent: '#8fbf5a' },
  ground2: { style: 'concrete', base: '#8a8a94', dark: '#6c6c76', light: '#a0a0aa', accent: '#5f8f3a' },
  details: ['tuft', 'petal', 'pebbles', 'petal', 'tuft'],
  ambient: { dark: 0.16, color: '#1a0a20', tint: 'rgba(255,170,200,0.06)', fx: 'petals' },
  decor: [['sakura', 1, 5], ['lantern', 1, 3], ['bamboo', 1, 3], ['rock', 1, 2], ['torii', 1, 0.6]], density: 2.6,
  weights: { zombie: 3, rat: 3, slime: 2, marauder: 3, bomber: 1.5, drone: 1.5, brute: 1, necro: 1 }, weather: null };
LOCATIONS.splice(LOCATIONS.findIndex(l => l.final), 0, JAPAN);
ACHIEVEMENTS.push(
  { id: 'clear_japan', name: 'Покоритель', desc: 'Победить босса: Остров сакуры', coins: 40, test: R => R.everWon && R.loc.id === 'japan' });

// Босс острова — демон Они
BOSSES.oni = { name: 'Демон Они', sprite: 'oni', hp: 5600, speed: 30, dmg: 22, r: 19, scale: 3, color: '#ef3b5b',
  attacks: [{ type: 'dash', cd: 3.4 }, { type: 'spread', cd: 2.2, n: 5 }, { type: 'rain', cd: 5.5, n: 6 }, { type: 'ring', cd: 4.5, n: 14 }] };

function bossList(R) { return [R.loc.boss]; }

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
  reg('i_scepter', 8, 8, R => { R(3, 0, 3, 3, '#73eff7'); R(4, 1, 1, 1, '#f4f4f4'); R(2, 3, 5, 1, '#ffcd75'); R(4, 4, 1, 4, '#d59a3b'); R(3, 7, 3, 1, '#ffcd75'); });
  reg('i_shadow', 8, 8, R => { R(1, 6, 2, 1, '#566c86'); R(2, 4, 2, 2, '#7d90a6'); R(3, 2, 3, 2, '#aebfd0'); R(5, 0, 3, 3, '#f4f4f4'); R(0, 7, 1, 1, '#33363f'); R(6, 5, 2, 1, '#2a3050'); });
  for (const suffix in ENEMY_POSES) registerSprite('oni' + suffix, paintSprite(50, 53, R => ENEMY_PAINT.oni(R, ENEMY_POSES[suffix])));
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
  reg('h_tree', 30, 38, R => {
    const T = '#733e39', Ts = '#4a2a2a', G = '#3f8a3a', Gh = '#6fbf5a', Gs = '#2a6030';
    R(13, 22, 4, 14, T); R(13, 22, 1, 14, Ts); R(10, 35, 10, 2, T);
    R(8, 3, 14, 4, G); R(4, 6, 22, 8, G); R(2, 10, 26, 9, G); R(5, 19, 20, 4, G); R(9, 23, 12, 2, Gs);
    R(9, 4, 6, 2, Gh); R(5, 8, 6, 3, Gh); R(17, 7, 6, 2, Gh); R(12, 13, 5, 2, Gh);
    R(3, 16, 9, 3, Gs); R(16, 18, 9, 3, Gs); R(24, 11, 3, 5, Gs);
  });
  reg('h_bush', 18, 14, R => {
    R(4, 3, 10, 3, '#3f8a3a'); R(2, 5, 14, 6, '#3f8a3a'); R(3, 11, 12, 1, '#2a6030'); R(5, 4, 4, 2, '#6fbf5a'); R(10, 6, 4, 2, '#6fbf5a');
    R(6, 8, 1, 1, '#d8384f'); R(12, 9, 1, 1, '#d8384f'); R(9, 6, 1, 1, '#ffcd75');
  });
  reg('h_flowers', 12, 8, R => {
    R(2, 5, 1, 2, '#3f8a3a'); R(6, 4, 1, 3, '#3f8a3a'); R(9, 5, 1, 2, '#3f8a3a');
    R(1, 3, 3, 2, '#e86a92'); R(5, 2, 3, 2, '#ffcd75'); R(8, 3, 3, 2, '#73eff7');
  });
  reg('h_dummy', 20, 28, R => {
    const W = '#733e39', S = '#dcbd7c', Ss = '#b08d4e';
    R(9, 14, 2, 12, W); R(5, 25, 10, 2, W);           // стойка
    R(3, 11, 14, 2, W);                               // перекладина-«руки»
    R(6, 9, 8, 11, S); R(12, 10, 2, 10, Ss); R(6, 19, 8, 1, Ss); // соломенное тело
    R(8, 12, 4, 4, '#f4f4f4'); R(9, 13, 2, 2, '#d8384f');        // мишень
    R(7, 2, 6, 7, S); R(11, 3, 2, 6, Ss); R(8, 4, 1, 1, '#1e1a26'); R(11, 4, 1, 1, '#1e1a26'); R(8, 7, 4, 1, '#1e1a26'); // голова
    R(6, 1, 8, 2, '#a3593b');                         // шляпа
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
Story.HERO.jaha = { taunt: 'Преклони колено, чудовище. Перед тобой король — пусть и без королевства.', reply: 'Корону можно потерять. Достоинство — никогда.' };
Story.HERO.bilol = { taunt: '...Ты меня уже не видишь. Это твоя первая ошибка.', reply: 'Вторая будет последней.' };
Story.BOSS.oni = 'ГР-Р-РА! Этот остров — мой! Я выпил его духов и сломал его храмы. А вы, букашки, станете закуской!';
const JAPAN_SCENES = {
  japan0: [
    { who: '@',       side: 'right', text: 'Сакура? Здесь, посреди пустоши? И воздух чистый...' },
    { who: 'akemi',   side: 'left',  text: 'Это мой дом — Остров сакуры. Катастрофа обошла его стороной. А вот демон — нет.' },
    { who: 'chonguk', side: 'right', text: 'Они явился с первой бурей. Мы с ISOSHA дрались с ним трижды — и трижды едва ушли живыми.' },
    { who: 'bilol',   side: 'left',  text: 'Я шёл по его следу от самых гор. Теперь нас достаточно, чтобы закончить это.' },
    { who: 'jaha',    side: 'right', text: 'Король не бросает тех, кто просит о защите. Остров будет свободен — даю слово.' },
  ],
  japan1: [
    { who: 'akemi',   side: 'left',  text: 'Он пал... Духи острова снова поют. Слышите?' },
    { who: 'chonguk', side: 'right', text: 'Слышу. И это лучшая песня, под которую я когда-либо махал катаной.' },
    { who: 'bilol',   side: 'left',  text: 'Мой путь окончен. Значит, можно начать новый — с вами.' },
    { who: 'jaha',    side: 'right', text: 'Тогда решено. У короля снова есть отряд, а у отряда — король. В путь, к Вратам!' },
  ],
};
Story.CHAPTERS.splice(Story.CHAPTERS.length - 1, 0,
  { id: 'japan0', title: 'Остров сакуры', hint: 'войди в тории на карте', open: () => Story.chap().japan0, scene: JAPAN_SCENES.japan0 },
  { id: 'japan1', title: 'Песня духов', hint: 'победи Демона Они', open: () => Save.data.cleared.japan, scene: JAPAN_SCENES.japan1 });

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

// первая победа над Они — сюжетная сцена
const _finishRun = finishRun;
finishRun = function (R) {
  if (!R.rush && R.loc.id === 'japan' && R.won && !Save.data.cleared.japan) R.extraScenes = [JAPAN_SCENES.japan1];
  // запоминаем последний забег — о нём заговорят герои у костра
  if (!R.rush) Save.data.last = { hero: R.ch.id, loc: R.loc.name, won: R.everWon, t: Math.min(R.t, RUN_TIME), kills: R.kills };
  _finishRun(R);
};

// ---------------------------------------------------------------- РАЗГОВОРЫ У КОСТРА
const TALK = {
  daler: ['В лесу Аэлора я слышал каждую птицу. Здесь слышу только ветер и счётчик.', 'Целься туда, где враг окажется, а не туда, где он стоит.', 'Крысы бегут зигзагом. Не трать стрелы — жди броска.', 'Если станет туго — рывок сквозь толпу спасает чаще, чем броня.'],
  stimme: ['Я пою не для красоты. Хотя и для красоты тоже.', 'Возьми магнит к звуковой волне — услышишь, как поёт буря.', 'Брат делает вид, что не волнуется за меня. Получается плохо.', 'Когда всё закончится, я спою этому миру колыбельную.'],
  babaduk: ['Рыцарь не отступает. Рыцарь меняет позицию.', 'За машиной или ящиком пули тебя не достанут. Пользуйся.', 'Меч и броня — старая школа. Работает до сих пор.', 'Сестра поёт так, что у меня шлем звенит. Но я ею горжусь.'],
  maga: ['Му-ха! Сегодня отличный день, чтобы кого-нибудь боднуть.', 'В лабиринте я знал каждый поворот. Здесь повороты знают меня.', 'Элитных врагов бей первыми — с них сыплется больше всего.', 'Грива? Двадцать лет не стриг. И не собираюсь.'],
  akemi: ['Остров сакуры помнит тишину. Я хочу её вернуть.', 'Плащ теней и сюрикены — и клинки сыплются как дождь.', 'ISKA поёт даже в бою. Я делаю вид, что мне не нравится.', 'Быстрее меня только слухи обо мне.'],
  chonguk: ['Каждый бой — это сцена. Главное — красиво выйти.', 'Катана любит ритм: раз, два — и враги кончились.', 'ISOSHA говорит, что я слишком шумный. Она права.', 'После победы над Они я написал песню. Хочешь послушать? Нет? Ладно.'],
  jaha: ['Король без королевства — всё ещё король. Спина прямая, корона ровно.', 'Мои сферы сами находят цель. Подданные бы так работали.', 'Я потерял трон, но нашёл отряд. Неплохой обмен.', 'Торговец берёт монеты даже с королей. Возмутительно.'],
  bilol: ['...', 'Ты не слышал, как я подошёл. Так и задумано.', 'Сапоги и теневой удар — и тебя не догонит никто.', 'Дым — лучший друг. Он не задаёт вопросов.'],
};
// Реплика героя: при подходе — иногда про твой последний забег, дальше — по кругу остальные
function heroTalk(c, prev, first) {
  const last = Save.data.last, lines = TALK[c.id] || ['...'];
  if (first && last && Math.random() < 0.6) {
    const who = CHARACTERS.find(x => x.id === last.hero), me = last.hero === c.id;
    if (last.won) return me ? `${last.loc} наш. Славно мы там поработали!` : `Слышал, ${who.name} взял ${last.loc}. ${last.kills} врагов — неплохо.`;
    return me ? `${last.loc}... В следующий раз продержимся дольше ${fmtTime(last.t)}.` : `${who.name} продержался ${fmtTime(last.t)} — ${last.loc} шуток не любит.`;
  }
  let l = prev;
  for (let i = 0; i < 6 && l === prev; i++) l = lines[Math.floor(Math.random() * lines.length)];
  return l;
}

// ---------------------------------------------------------------- ТРЕНИРОВОЧНАЯ ПЛОЩАДКА
// Три неубиваемых манекена и арсенал: любое оружие, уровень, эволюция и предметы — без забега
ENEMIES.dummy = { sprite: 'h_dummy', hp: 100000, speed: 0, dmg: 0, xp: 0, r: 7, color: '#c9a15a', ai: 'dummy' };
const Training = {
  start() {
    Game.start(Save.data.hero, 'desert', { training: true });
  },
  // вместо обычного появления врагов
  tick(R, dt) {
    const p = R.p;
    if (!R.dummies) {
      R.dummies = [[-46, -50], [0, -64], [46, -50]].map(([x, y]) => { const e = makeEnemy(R, 'dummy', x, y); e.hx = x; e.hy = y; e.spawnT = 0; R.enemies.push(e); return e; });
      R.dps = []; R.dpsT = 0; R.dmgSeen = 0;
      p.xpNext = 1e9;
    }
    for (const e of R.dummies) {
      e.x = e.hx; e.y = e.hy; e.kvx = e.kvy = 0; e.stunT = 0;
      if (e.hp < e.maxHp * 0.5 || e.dead) { e.hp = e.maxHp; e.dead = false; if (!R.enemies.includes(e)) R.enemies.push(e); }
    }
    p.ult = Math.min(p.ultCost, p.ult + dt * 6); p.ultCd = 0; // ульта заряжается сама
    // урон в секунду за последние 3 секунды
    let total = 0;
    for (const k in R.dmgBy) total += R.dmgBy[k];
    R.dpsT += dt;
    if (R.dpsT >= 0.5) {
      R.dps.push((total - R.dmgSeen) / R.dpsT); if (R.dps.length > 6) R.dps.shift();
      R.dmgSeen = total; R.dpsT = 0;
      const avg = R.dps.reduce((s, v) => s + v, 0) / R.dps.length;
      Tut.show('Урон в секунду: ' + Math.round(avg) + '   ·   T или кнопка — арсенал');
    }
  },
  open() {
    if (Game.state !== 'playing' || !Game.run || !Game.run.training) return;
    Game.state = 'shop';
    this.render();
    UI.show('arsenal');
  },
  close() {
    if (UI.current !== 'arsenal') return;
    Game.state = 'playing';
    UI.show(null);
  },
  render() {
    const R = Game.run, p = R.p;
    const wrow = id => {
      const W = WEAPONS[id], w = p.weapons.find(x => x.id === id), lvl = w ? (w.evo ? '★' : w.lvl) : '—';
      return `<div class="shop-row"><img src="${iconURL(W.icon, 32)}" alt="">
        <div class="shop-info"><div class="card-name">${w && w.evo ? W.evo.name : W.name}</div><div class="muted">Уровень: ${lvl}</div></div>
        <div class="ars-btns"><button class="btn small" data-w="${id}" data-a="-">−</button><button class="btn small" data-w="${id}" data-a="+">+</button><button class="btn small ${w && w.evo ? 'on' : ''}" data-w="${id}" data-a="e">★</button></div></div>`;
    };
    const prow = id => {
      const P = PASSIVES[id], l = p.passives[id] || 0;
      return `<div class="shop-row"><img src="${iconURL(P.icon, 32)}" alt="">
        <div class="shop-info"><div class="card-name">${P.name}</div><div class="muted">${P.desc} · уровень ${l}</div></div>
        <div class="ars-btns"><button class="btn small" data-p="${id}" data-a="-">−</button><button class="btn small" data-p="${id}" data-a="+">+</button></div></div>`;
    };
    $('ars-weapons').innerHTML = Object.keys(WEAPONS).map(wrow).join('');
    $('ars-passives').innerHTML = Object.keys(PASSIVES).map(prow).join('');
    $('scr-arsenal').querySelectorAll('button[data-a]').forEach(b => { b.onclick = () => this.change(b.dataset.w, b.dataset.p, b.dataset.a); });
    $('ars-close').onclick = () => { UI.click(); this.close(); };
    $('ars-clear').onclick = () => { p.weapons = []; p.passives = {}; recalcStats(); R.projs = []; R.effects = []; UI.click(); this.render(); };
  },
  change(wid, pid, a) {
    const R = Game.run, p = R.p;
    if (wid) {
      let w = p.weapons.find(x => x.id === wid);
      if (a === '+') { if (!w) addWeapon(wid); else if (w.lvl < 5) w.lvl++; }
      else if (a === '-') { if (w && (w.evo || w.lvl <= 1)) { if (w.evo) w.evo = false; else p.weapons = p.weapons.filter(x => x !== w); } else if (w) w.lvl--; }
      else { if (!w) { addWeapon(wid); w = p.weapons[p.weapons.length - 1]; } w.lvl = 5; w.evo = !w.evo; }
    } else {
      const l = p.passives[pid] || 0;
      if (a === '+' && l < PASSIVES[pid].max) p.passives[pid] = l + 1;
      if (a === '-' && l > 0) { if (l === 1) delete p.passives[pid]; else p.passives[pid] = l - 1; }
      recalcStats();
    }
    Sound.sfx('click');
    this.render();
  },
};
// Арсенал плитками с вкладками: нажатие на плитку поднимает уровень (после 5-го — эволюция ★), «−» опускает
Training.tab = 'w';
Training.render = function () {
  const R = Game.run, p = R.p, tab = this.tab;
  $('ars-tabs').innerHTML = `<button class="btn small ${tab === 'w' ? 'on' : ''}" data-t="w">Оружие (${p.weapons.length})</button>
    <button class="btn small ${tab === 'p' ? 'on' : ''}" data-t="p">Предметы (${Object.keys(p.passives).length})</button>`;
  $('ars-tabs').querySelectorAll('button').forEach(b => { b.onclick = () => { this.tab = b.dataset.t; UI.click(); this.render(); }; });
  const tile = (key, id, icon, name, lvl, on) => `<div class="ars-tile ${on ? 'on' : ''}">
      <button class="ars-main" data-${key}="${id}" data-a="c"><img src="${iconURL(icon, 32)}" alt=""><span>${name}</span><b>${lvl}</b></button>
      <button class="ars-minus" data-${key}="${id}" data-a="-" ${on ? '' : 'disabled'}>−</button></div>`;
  $('ars-weapons').innerHTML = tab !== 'w' ? '' : Object.keys(WEAPONS).map(id => {
    const W = WEAPONS[id], w = p.weapons.find(x => x.id === id);
    return tile('w', id, W.icon, w && w.evo ? W.evo.name : W.name, w ? (w.evo ? '★' : 'ур. ' + w.lvl) : '—', !!w);
  }).join('');
  $('ars-passives').innerHTML = tab !== 'p' ? '' : Object.keys(PASSIVES).map(id => {
    const l = p.passives[id] || 0;
    return tile('p', id, PASSIVES[id].icon, PASSIVES[id].name, l ? 'ур. ' + l : '—', l > 0);
  }).join('');
  $('scr-arsenal').querySelectorAll('button[data-a]').forEach(b => { b.onclick = () => this.change(b.dataset.w, b.dataset.p, b.dataset.a); });
  $('ars-close').onclick = () => { UI.click(); this.close(); };
  $('ars-clear').onclick = () => { p.weapons = []; p.passives = {}; recalcStats(); R.projs = []; R.effects = []; UI.click(); this.render(); };
};
const _trainChange = Training.change;
Training.change = function (wid, pid, a) {
  if (a !== 'c') return _trainChange.call(this, wid, pid, a);
  const p = Game.run.p;
  if (wid) {
    const w = p.weapons.find(x => x.id === wid);
    if (!w) addWeapon(wid); else if (w.lvl < 5) w.lvl++; else w.evo = true;
  } else {
    const l = p.passives[pid] || 0;
    if (l < PASSIVES[pid].max) { p.passives[pid] = l + 1; recalcStats(); }
  }
  Sound.sfx('click');
  this.render();
};

const _updateSpawns = updateSpawns;
updateSpawns = function (R, dt) { if (R.training) Training.tick(R, dt); else _updateSpawns(R, dt); };

// ---------------------------------------------------------------- ЛОББИ-КАРТА
const Hub = {
  home: false, t: 0, near: null, loc: null, zones: [], labels: null,
  p: { x: 0, y: 48, face: 1, dirX: 0, dirY: -1, moving: false, anim: 0, mvx: 0, mvy: 0, dashT: 0, sprite: 'daler', turnT: 0 },

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
      { id: 'train', x: -250, y: 150, r: 22, spr: 'h_dummy', tint: '#a7f070', name: 'Тренировочная площадка', desc: 'Манекены и арсенал: попробуй любое оружие, эволюции и предметы без забега.', act: () => Training.start() },
      { id: 'story', x: 250, y: 150, r: 22, spr: 'h_book', tint: '#e86a92', name: 'Летопись', desc: 'Пересмотреть открытые главы сюжета.', act: open(() => Story.gallery()) },
      { id: 'exit', x: 0, y: 215, r: 20, spr: 'h_sign', tint: '#94b0c2', name: 'В главное меню', desc: 'Настройки и управление — там.', act: () => this.leave() },
    ];
    this.build();
    // подписи над объектами и панель «Войти»
    this.labels = $('hub-labels');
    this.labels.innerHTML = this.zones.map((z, i) => `<div class="hub-label" data-i="${i}">${z.name}</div>`).join('');
    $('hub-go').onclick = () => this.use();
    $('hub-diff').onclick = () => { Save.data.nightmare = !Save.data.nightmare; Save.store(); UI.click(); this.near = null; };
  },

  // Обустройство карты: мощёная площадь и дорожки, окружение у порталов, деревья, фонари
  build() {
    const rnd = mulberry32(4242), props = this.props = [], T = 16;
    const add = (name, x, y, s) => props.push({ name, x: Math.round(x), y: Math.round(y), s: s || 1, flip: rnd() < 0.5 });
    TILES.hubStone = richTiles({ style: 'concrete', base: '#a89f90', dark: '#8a8174', light: '#bdb5a6', accent: '#7a8a5a' }, 93);
    // плитки: круглая площадь у костра и дорожки к каждой постройке
    this.paved = new Set();
    const pave = (x, y, r) => {
      for (let ty = Math.floor((y - r) / T); ty <= Math.floor((y + r) / T); ty++) for (let tx = Math.floor((x - r) / T); tx <= Math.floor((x + r) / T); tx++) {
        if (Math.hypot(tx * T + 8 - x, ty * T + 8 - y) <= r) this.paved.add(tx + ',' + ty);
      }
    };
    pave(0, 8, 62);
    for (const z of this.zones) {
      const d = Math.hypot(z.x, z.y), n = Math.ceil(d / 10);
      for (let i = 0; i <= n; i++) pave(z.x * i / n, z.y * i / n + 8, 13);
      if (z.id !== 'hero') pave(z.x, z.y + 6, 30);
    }
    // тематическое окружение порталов
    const near = (id, list) => { const z = this.zones.find(q => q.id === id); list.forEach(([name, dx, dy, s]) => add(name, z.x + dx, z.y + dy, s)); };
    near('desert', [['cactus', -34, 6], ['cactus', 38, -8], ['rbarrel', 30, 16], ['skull', -26, 22], ['rock', -44, -12]]);
    near('factory', [['crate', -34, 8], ['drum', 34, 4], ['machine', 40, -14], ['scrap', -40, -10], ['crate', -24, 22]]);
    near('forest', [['deadtree', -38, 2, 2], ['deadtree', 42, -6, 2], ['stump', 30, 18], ['mushroom', -24, 22], ['mushroom', 22, 26]]);
    near('metro', [['wagon', 52, 12], ['drum', -34, 8], ['scrap', -40, -12], ['skull', 26, 26]]);
    near('gates', [['tomb', -38, 6], ['tomb', 40, 4], ['tomb', -58, -14], ['tomb', 60, -12], ['lantern', -24, 24], ['lantern', 24, 24], ['rock', 0, -34]]);
    near('japan', [['sakura', -40, 4], ['sakura', 44, -10], ['sakura', 8, -42], ['lantern', -22, 26], ['lantern', 24, 26], ['bamboo', 58, 18], ['bamboo', 66, 6]]);
    near('rush', [['rock', -36, 12], ['rock', 38, 8], ['skull', -20, 24], ['skull', 26, 22], ['deadtree', -52, -8, 2]]);
    near('shop', [['crate', -32, 6], ['drum', 34, 4], ['crate', 28, 18]]);
    near('talent', [['bamboo', -30, 4], ['bamboo', 32, 2], ['lantern', -22, 22]]);
    near('daily', [['lantern', -24, 10], ['lantern', 24, 10], ['h_bush', -40, -4]]);
    near('ach', [['h_bush', -28, 8], ['h_bush', 30, 6], ['lantern', 0, 26]]);
    near('story', [['h_tree', -36, -6], ['h_bush', 30, 12]]);
    near('train', [['h_dummy', -30, 8], ['h_dummy', 32, 4], ['crate', -44, -8], ['stump', 22, 22]]);
    // фонари вокруг площади и скамейки-пни
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.39; add('lantern', Math.cos(a) * 70, 8 + Math.sin(a) * 66); }
    add('stump', -26, 26); add('stump', 28, 24);
    // роща по краям карты и редкие деревья внутри
    for (let i = 0; i < 70; i++) {
      const a = i / 70 * Math.PI * 2, rx = 372 + rnd() * 46, ry = 322 + rnd() * 40;
      add(rnd() < 0.2 ? 'sakura' : 'h_tree', Math.cos(a) * rx, -20 + Math.sin(a) * ry);
    }
    let tries = 0;
    while (props.length < 210 && tries++ < 900) {
      const x = (rnd() * 2 - 1) * 345, y = -20 + (rnd() * 2 - 1) * 300;
      if (this.paved.has(Math.floor(x / T) + ',' + Math.floor(y / T))) continue;
      if (this.zones.some(z => Math.hypot(z.x - x, z.y - y) < 62)) continue;
      const r = rnd();
      add(r < 0.3 ? 'h_tree' : r < 0.55 ? 'h_bush' : r < 0.7 ? 'rock' : r < 0.85 ? 'h_flowers' : 'mushroom', x, y);
    }
    // твёрдые объекты: круг у основания (цветы, грибы и черепа остаются проходимыми)
    const RAD = { h_tree: 4, sakura: 4, deadtree: 5, h_bush: 5, rock: 5, lantern: 3, tomb: 5, crate: 6, drum: 5, cactus: 4, machine: 6,
      wagon: 11, stump: 5, h_dummy: 4, rbarrel: 5, scrap: 5, bamboo: 3 };
    const ZR = { hero: 7, rush: 14, japan: 0, exit: 4 };
    this.solids = [];
    for (const d of props) if (RAD[d.name]) this.solids.push({ x: d.x, y: d.y - 2, r: RAD[d.name] * d.s * (d.name === 'deadtree' ? 0.5 : 1) });
    for (const z of this.zones) {
      if (z.id === 'japan') { this.solids.push({ x: z.x - 12, y: z.y - 2, r: 3 }, { x: z.x + 12, y: z.y - 2, r: 3 }); continue; } // столбы тории, между ними можно пройти
      if (z.kind === 'portal') { this.solids.push({ x: z.x - 9, y: z.y - 2, r: 4 }, { x: z.x + 9, y: z.y - 2, r: 4 }); continue; } // колонны арки
      this.solids.push({ x: z.x, y: z.y - 3, r: ZR[z.id] !== undefined ? ZR[z.id] : 11 });
    }
  },

  // Выталкивает героя из деревьев, построек и других героев
  collide() {
    const p = this.p, R = 4;
    let fx = p.x, fy = p.y + 9;
    const push = (sx, sy, sr) => {
      const dx = fx - sx, dy = fy - sy, rr = sr + R, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2) || 0.01;
      fx = sx + dx / d * rr; fy = sy + dy / d * rr;
    };
    for (const s of this.solids) if (Math.abs(s.x - fx) < 20 && Math.abs(s.y - fy) < 20) push(s.x, s.y, s.r);
    for (const n of this.npcs || []) push(n.x, n.y + 9, 4);
    p.x = fx; p.y = fy - 9;
  },

  // ---------- Мини-карта ----------
  // Фон рисуется один раз: рельеф (трава, песок, мощёные дорожки), деревья, фонари, камни. 1 пиксель карты = 8 пикселей мира
  MINI: { w: 95, h: 83, ox: -380, oy: -350, k: 8 },
  buildMini() {
    const M = this.MINI, c = makeCanvas(M.w, M.h), x = c.getContext('2d');
    const mix = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
      const f = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
      return 'rgb(' + f(16) + ',' + f(8) + ',' + f(0) + ')'; };
    for (let j = 0; j < M.h; j++) for (let i = 0; i < M.w; i++) {
      const wx = M.ox + i * M.k + 4, wy = M.oy + j * M.k + 4, tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
      const h = hash01(i, j, 17), edge = Math.max(Math.abs(wx) / 372, Math.abs(wy + 20) / 322);
      let col;
      if (this.paved.has(tx + ',' + ty)) col = h < 0.25 ? '#9a9184' : h > 0.8 ? '#c4bcae' : '#b0a898';
      else if (vnoise(tx / 6, ty / 6, this.loc.seed + 5) > 0.56) col = h < 0.3 ? '#b89f6a' : h > 0.85 ? '#dcc794' : '#c9b07a';
      else col = h < 0.25 ? '#4c7a3a' : h > 0.8 ? '#6a9c50' : '#5a8a44';
      if (edge > 1) col = mix(col, '#1e3a22', Math.min(1, (edge - 1) * 5)); // за рощей карта темнеет
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    // тени, затем сами объекты — так деревья выглядят объёмно
    const at = d => [Math.round((d.x - M.ox) / M.k), Math.round((d.y - M.oy) / M.k)];
    const P = { h_tree: ['#2a6030', '#4fa044'], sakura: ['#c8588a', '#ffc6da'], deadtree: ['#4a2a2a', '#733e39'], h_bush: ['#3f8a3a', '#6fbf5a'] };
    x.fillStyle = 'rgba(0,0,0,0.28)';
    for (const d of this.props) if (P[d.name]) { const [i, j] = at(d); x.fillRect(i - 1, j, 3, 1); }
    for (const d of this.props) {
      const [i, j] = at(d), c2 = P[d.name];
      if (c2 && d.name !== 'h_bush') { x.fillStyle = c2[0]; x.fillRect(i - 1, j - 2, 3, 2); x.fillStyle = c2[1]; x.fillRect(i - 1, j - 2, 1, 1); }
      else if (c2) { x.fillStyle = c2[0]; x.fillRect(i, j - 1, 1, 1); }
      else if (d.name === 'lantern') { x.fillStyle = '#ffcd75'; x.fillRect(i, j - 1, 1, 1); }
      else if (d.name === 'rock' || d.name === 'tomb' || d.name === 'scrap') { x.fillStyle = '#94b0c2'; x.fillRect(i, j - 1, 1, 1); }
      else if (d.name === 'h_flowers' || d.name === 'mushroom') { x.fillStyle = '#e86a92'; x.fillRect(i, j - 1, 1, 1); }
      else if (d.name === 'wagon') { x.fillStyle = '#3b5dc9'; x.fillRect(i - 2, j - 1, 4, 1); }
      else { x.fillStyle = '#8b4a2b'; x.fillRect(i, j - 1, 1, 1); }
    }
    this.miniBg = c;
  },

  // Значок постройки на мини-карте (5x5, у Врат — крупнее)
  miniIcon(ctx, z, x, y, blink) {
    const lock = this.locked(z), c = lock ? '#566c86' : z.tint, K = '#14162a', R = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + a, y + b, w, h); };
    if (blink) R(-4, -5, 9, 8, '#f4f4f4');
    if (z.id === 'japan') {            // тории
      R(-3, -4, 7, 6, K); R(-3, -4, 7, 1, '#d8384f'); R(-2, -2, 5, 1, '#d8384f'); R(-2, -3, 1, 5, '#d8384f'); R(2, -3, 1, 5, '#d8384f');
    } else if (z.kind === 'portal') {  // арка со светящимся проёмом
      const b = z.id === 'gates' ? 1 : 0;
      R(-3 - b, -4 - b, 7 + b * 2, 6 + b, K); R(-2 - b, -3 - b, 5 + b * 2, 5 + b, '#aebfd0'); R(-1, -2 - b, 3, 4 + b, c);
      if (!lock && Math.floor(this.t * 5 + z.x) % 2) R(0, -1, 1, 1, '#f4f4f4');
    } else if (z.id === 'rush') {      // пещера
      R(-3, -3, 7, 5, K); R(-2, -2, 5, 3, '#7d90a6'); R(-1, -1, 3, 2, K); R(0, 0, 1, 1, '#ef3b5b');
    } else if (z.id === 'hero') {      // костёр
      R(-2, -3, 5, 5, K); R(-1, 0, 3, 1, '#733e39'); R(-1, -2, 3, 2, Math.floor(this.t * 8) % 2 ? '#f59e42' : '#ffcd75'); R(0, -2, 1, 1, '#f4f4f4');
    } else if (z.id === 'exit') {      // указатель
      R(-2, -3, 5, 5, K); R(-1, -2, 3, 2, '#a3593b'); R(0, 0, 1, 1, '#733e39');
    } else {                           // домик с цветной крышей
      R(-3, -4, 7, 6, K); R(-2, -3, 5, 2, c); R(-1, -4, 3, 1, c); R(-2, -1, 5, 2, '#e8e0c8'); R(0, -1, 1, 2, '#733e39');
    }
  },

  drawMini(ctx, W, H) {
    if (!this.miniBg) this.buildMini();
    const M = this.MINI, p = this.p, big = this.bigMap;
    // обычный вид — в углу; по клавише M или нажатию на карту — крупный, по центру
    // в углу карта маленькая (на телефонах — ещё меньше), чтобы не мешать; подробности — в большом виде
    const s = big ? Math.max(1, Math.min(Math.floor((W - 16) / M.w), Math.floor((H - 16) / M.h), 3)) : (W < 230 ? 0.4 : 0.56);
    const w = Math.round(M.w * s), h = Math.round(M.h * s), x0 = big ? Math.round((W - w) / 2) : W - w - 4, y0 = big ? Math.round((H - h) / 2) : 4;
    this.miniRect = [x0 - 3, y0 - 3, w + 6, h + 6];
    // рамка: тёмная кайма, золотая линия, заклёпки по углам
    ctx.fillStyle = '#14162a'; ctx.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
    ctx.fillStyle = '#d59a3b'; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    ctx.fillStyle = '#14162a'; ctx.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    ctx.drawImage(this.miniBg, x0, y0, w, h);
    ctx.fillStyle = '#ffcd75';
    for (const [a, b] of [[-3, -3], [w + 1, -3], [-3, h + 1], [w + 1, h + 1]]) ctx.fillRect(x0 + a, y0 + b, 2, 2);
    const mx = wx => x0 + (wx - M.ox) / M.k * s, my = wy => y0 + (wy - M.oy) / M.k * s;
    // рамка того, что сейчас видно на экране
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#f4f4f4';
    const vx = Math.round(mx(Game.camX)), vy = Math.round(my(Game.camY)), vw = Math.round(W / M.k * s), vh = Math.round(H / M.k * s);
    ctx.fillRect(vx, vy, vw, 1); ctx.fillRect(vx, vy + vh - 1, vw, 1); ctx.fillRect(vx, vy, 1, vh); ctx.fillRect(vx + vw - 1, vy, 1, vh);
    ctx.globalAlpha = 1;
    // постройки: ближайшая мигает
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    const px = Math.round(mx(p.x)), py = Math.round(my(p.y));
    if (!big) {
      // маленький вид: постройки — цветные точки, герой — мигающая белая
      for (const z of this.zones) {
        const zx = Math.round(mx(z.x)), zy = Math.round(my(z.y - 6));
        ctx.fillStyle = '#14162a'; ctx.fillRect(zx - 2, zy - 2, 4, 4);
        ctx.fillStyle = this.locked(z) ? '#566c86' : (z === this.near && Math.floor(this.t * 6) % 2 ? '#f4f4f4' : z.tint);
        ctx.fillRect(zx - 1, zy - 1, 2, 2);
      }
      ctx.fillStyle = '#14162a'; ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.fillStyle = Math.floor(this.t * 4) % 2 ? '#f4f4f4' : '#ef3b5b'; ctx.fillRect(px - 1, py - 1, 2, 2);
      ctx.restore();
      return;
    }
    for (const z of this.zones) {
      ctx.save(); ctx.translate(Math.round(mx(z.x)), Math.round(my(z.y - 10))); ctx.scale(s, s);
      this.miniIcon(ctx, z, 0, 0, z === this.near && Math.floor(this.t * 6) % 2 === 0);
      ctx.restore();
    }
    // герой со стрелкой направления
    ctx.fillStyle = '#14162a'; ctx.fillRect(px - 2 * s, py - 2 * s, 5 * s, 5 * s);
    ctx.fillStyle = Math.floor(this.t * 4) % 2 ? '#f4f4f4' : '#ffcd75'; ctx.fillRect(px - s, py - s, 3 * s, 3 * s);
    ctx.fillStyle = '#ef3b5b'; ctx.fillRect(px + Math.round(p.dirX * 2) * s, py + Math.round(p.dirY * 2) * s, s, s);
    ctx.restore();
  },

  enter() {
    this.home = true;
    const d = Save.data, ch = CHARACTERS.find(c => c.id === d.hero);
    if (!ch || !heroOpen(ch)) d.hero = 'daler';
    this.p.sprite = d.hero + (d.costume[d.hero] && d.wins[d.hero] ? '_alt' : '');
    this.near = null;
    this.prompt();
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
    if (z.kind === 'npc') {
      // разговор: каждое нажатие — новая реплика голосом героя
      z.line = heroTalk(z.c, z.line);
      for (let i = 0; i < 4; i++) setTimeout(() => Sound.voice(z.c.id), i * 70);
      this.prompt();
      return;
    }
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
    const k = 1 - Math.exp(-dt * 16), sp = 112;
    p.mvx += (a.x * sp - p.mvx) * k; p.mvy += (a.y * sp - p.mvy) * k;
    p.x = clamp(p.x + p.mvx * dt, -350, 350); p.y = clamp(p.y + p.mvy * dt, -310, 270);
    this.collide();
    if (Input.dashQ || Input.ultQ) { Input.dashQ = Input.ultQ = false; this.use(); }
    // нажатие на мини-карту разворачивает её; нажатие мимо — сворачивает
    const j = Input.joy;
    if (j.active && !this.tapSeen) {
      this.tapSeen = true;
      const s = Game.scale, r = this.miniRect, tx = j.sx / s, ty = j.sy / s;
      if (r && tx >= r[0] && tx <= r[0] + r[2] && ty >= r[1] && ty <= r[1] + r[3]) { this.bigMap = !this.bigMap; j.active = false; }
      else if (this.bigMap) this.bigMap = false;
    }
    if (!j.active) this.tapSeen = false;
    // день и ночь: полный круг за четыре минуты; ночью темнее и синее, на закате — рыжее
    const ph = (this.t / 240 + 0.15) % 1, night = clamp((Math.cos(ph * Math.PI * 2) - 0.1) * -1.4 + 0.2, 0, 1);
    const dusk = clamp(1 - Math.abs(night - 0.5) * 2.4, 0, 1), A = this.loc.ambient;
    this.night = night;
    A.dark = 0.04 + night * 0.4;
    A.tint = dusk > 0.05 ? `rgba(255,130,70,${(dusk * 0.12).toFixed(3)})` : night > 0.5 ? 'rgba(60,90,210,0.09)' : 'rgba(255,235,180,0.05)';
    // дождь находит примерно раз в полторы минуты
    const wantRain = this.t % 95 > 68 ? 1 : 0;
    this.rain = (this.rain || 0) + (wantRain - (this.rain || 0)) * Math.min(1, dt * 0.6);
    // остальные герои отряда стоят полукругом за костром — с ними можно поговорить
    const others = CHARACTERS.filter(c => heroOpen(c) && c.id !== Save.data.hero);
    if (!this.npcs || this.npcs.length !== others.length || this.npcFor !== Save.data.hero) {
      this.npcFor = Save.data.hero;
      this.npcs = others.map((c, i) => {
        const a = Math.PI * (0.04 + 0.92 * (others.length > 1 ? i / (others.length - 1) : 0.5)) + Math.PI, r = 24 + others.length * 3;
        return { kind: 'npc', c, i, x: Math.cos(a) * r, y: Math.sin(a) * r * 0.55 - 2, r: 4, name: c.name + ' — ' + c.title, line: '' };
      });
    }
    // ближайшая область или герой
    let best = null, bd = 1e9;
    for (const z of this.zones) { const d = Math.hypot(z.x - p.x, z.y + 4 - p.y); if (d < z.r + 12 && d < bd) { bd = d; best = z; } }
    for (const n of this.npcs) { const d = Math.hypot(n.x - p.x, n.y + 8 - p.y); if (d < 17 && d - 12 < bd) { bd = d - 12; best = n; } }
    if (best !== this.near) { this.near = best; if (best && best.kind === 'npc') best.line = heroTalk(best.c, null, true); this.prompt(); }
  },

  prompt() {
    const z = this.near, box = $('hub-prompt');
    box.classList.toggle('hidden', !z);
    if (!z) return;
    const d = Save.data, lock = this.locked(z);
    let desc = z.desc || '', go = 'ВОЙТИ';
    if (z.kind === 'npc') { desc = '«' + z.line + '»'; go = 'ЕЩЁ'; }
    if (z.kind === 'portal') {
      const l = z.loc;
      desc = l.desc + ' Босс: ' + (l.final && lock ? '???' : BOSSES[l.boss].name) + (d.cleared[l.id] ? ' · пройдено' : '');
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
    // мощёная площадь и дорожки поверх травы
    const st = TILES.hubStone;
    for (let ty = Math.floor(cy / 16); ty <= Math.floor((cy + H) / 16); ty++) for (let tx = Math.floor(cx / 16); tx <= Math.floor((cx + W) / 16); tx++) {
      if (this.paved.has(tx + ',' + ty)) ctx.drawImage(st[Math.floor(hash01(tx, ty, 5) * 6)], tx * 16 - cx, ty * 16 - cy);
    }
    const list = [], lights = [];
    collectDecor(ctx, loc, cx, cy, W, H, list, lights);
    lights.push({ x: p.x - cx, y: p.y - cy, r: 80, c: '#ffcd75', a: 0.08 });
    for (const z of this.zones) list.push({ y: z.y, z });
    // деревья, фонари и прочее окружение (только то, что в кадре)
    for (const d of this.props) {
      if (d.x < cx - 40 || d.x > cx + W + 40 || d.y < cy - 10 || d.y > cy + H + 60) continue;
      list.push({ y: d.y, d });
      const g = GLOW_DECOR[d.name];
      if (g && lights.length < 60) lights.push({ x: d.x - cx, y: d.y - 12 - cy, r: g[1], c: g[0], a: g[2], hole: 0.6 });
    }
    // остальные герои отряда греются у костра
    for (const n of this.npcs || []) list.push({ y: n.y + 12, npc: n.c, x: n.x, ny: n.y, i: n.i, talk: n === this.near });
    list.push({ y: p.y + 12, me: true });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.d) {
        const d = it.d;
        shadow(ctx, d.x, d.y - 2, SPR[d.name].sw * d.s * 0.6);
        sprFeet(ctx, d.name, d.x, d.y, d.flip, false, d.s, d.s);
        continue;
      }
      if (it.npc) {
        const alt = Save.data.costume[it.npc.id] && Save.data.wins[it.npc.id] ? '_alt' : '';
        const fr = it.npc.sprite + alt + ((this.t * 2.2 + it.i * 0.7) % 3.4 < 0.13 ? '_ib' : '_i' + (Math.floor(this.t * 2.2 + it.i) % 2));
        shadow(ctx, it.x, it.ny + 10, 11);
        // тот, с кем говоришь, поворачивается к тебе и слегка подпрыгивает
        const hop = it.talk ? Math.abs(Math.sin(this.t * 7)) * 1.5 : 0;
        sprFeet(ctx, fr, it.x, it.ny + 12 - hop, it.talk ? p.x < it.x : it.x > 0, false, HERO_SC, HERO_SC);
        if (it.talk) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(it.x - cx) - 1, Math.round(it.ny - 22 - cy + Math.sin(this.t * 6)), 3, 3); }
        continue;
      }
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
    if (this.rain > 0.02) drawWeather(ctx, { weather: 'rain', id: 'hub' }, this.rain, W, H);
    // мини-карта в правом верхнем углу: постройки — цветные точки, герой — белая
    this.drawMini(ctx, W, H);
    // подписи (HTML поверх холста)
    if (this.labelsOff !== !!this.bigMap) { this.labelsOff = !!this.bigMap; this.labels.style.display = this.bigMap ? 'none' : ''; } // под большой картой подписи не нужны
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
    // кнопка арсенала видна только на тренировочной площадке
    const start = Game.start.bind(Game);
    Game.start = (c, l, o) => { start(c, l, o); $('btn-arsenal').classList.toggle('hidden', !(Game.run && Game.run.training)); if (!(Game.run && Game.run.training)) Tut.show(null); };
    $('btn-arsenal').onclick = () => Training.open();

    const onKey = Input.onKey;
    Input.onKey = e => {
      if (Game.run && Game.run.training) {
        if (Game.state === 'playing' && e.code === 'KeyT') { Training.open(); return; }
        if (UI.current === 'arsenal' && (e.code === 'KeyT' || e.code === 'Escape')) { Training.close(); return; }
      }
      if (Game.state === 'hub') {
        if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); Input.dashQ = Input.ultQ = false; Hub.use(); }
        else if (e.code === 'KeyM' || e.code === 'Tab') { e.preventDefault(); Hub.bigMap = !Hub.bigMap; }
        else if (e.code === 'Escape') { if (Hub.bigMap) Hub.bigMap = false; else Hub.leave(); }
        return;
      }
      onKey(e);
    };
  },
};
