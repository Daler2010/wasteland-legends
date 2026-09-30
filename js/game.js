// ===== Ядро игры: забег, враги, подбор предметов, отрисовка =====

// Длительность забега до босса. Для проверки можно открыть index.html?time=30
const RUN_TIME = (() => {
  const v = parseFloat(new URLSearchParams(location.search).get('time'));
  return v > 0 ? v : 600;
})();
const CHUNK = 96;
const HERO_SC = 0.75; // герой нарисован 24x38, в мире показывается чуть меньше, чтобы не возвышаться над врагами
const FLAT_DECOR = new Set(['puddle', 'oil', 'toxic']);

const Game = {
  canvas: null, ctx: null, W: 320, H: 180, scale: 3,
  state: 'menu', // menu | playing | levelup | paused | over
  run: null, camX: 0, camY: 0, menuT: 0, menuLoc: null, decor: new Map(),

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.menuLoc = LOCATIONS[0];
    this.resize();
    addEventListener('resize', () => this.resize());
  },

  resize() {
    const vw = innerWidth, vh = innerHeight;
    this.scale = Math.max(2, Math.round(Math.min(vw, vh) / 190));
    this.W = Math.ceil(vw / this.scale);
    this.H = Math.ceil(vh / this.scale);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.canvas.style.width = this.W * this.scale + 'px';
    this.canvas.style.height = this.H * this.scale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    // слой темноты и виньетка под размер экрана
    this.lightCv = makeCanvas(this.W, this.H);
    this.lightCtx = this.lightCv.getContext('2d');
    this.vigCv = makeCanvas(this.W, this.H);
    const v = this.vigCv.getContext('2d'), m = Math.max(this.W, this.H);
    const g = v.createRadialGradient(this.W / 2, this.H / 2, m * 0.28, this.W / 2, this.H / 2, m * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    v.fillStyle = g; v.fillRect(0, 0, this.W, this.H);
    this.amb = null;
  },

  // opts: { nightmare: bool, daily: описание испытания дня, mods: { правило: true } }
  start(charId, locId, opts) {
    this.lastOpts = opts || {};
    this.run = createRun(charId, locId, this.lastOpts);
    const R = this.run;
    addWeapon(R.ch.weapon);
    if (R.tal.wlvl) R.p.weapons[0].lvl = 2; // талант: стартовое оружие сразу 2 уровня
    // обучение показывается один раз — только в самом первом забеге
    R.tutOn = !Save.data.tutDone && !R.daily && !R.rush;
    if (R.tutOn) { Save.data.tutDone = true; Save.store(); }
    if (R.rush) rushBuild(R, this.lastOpts.power || 2); // комната боссов: герой сразу прокачан
    recalcStats();
    R.p.hp = R.p.maxHp;
    this.state = 'playing';
    UI.show(null);
    UI.showHUD(true);
    Sound.resume();
    Sound.startMusic(R.loc.music);
    UI.banner(R.loc.name, 2.5);
  },

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    UI.showPause(this.run);
    Sound.suspend();
  },
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    UI.show(null);
    Sound.resume();
  },
  quit() {
    // монеты, собранные в забеге, сохраняются даже при выходе
    if (this.run && this.state !== 'over') { Save.data.coins += this.run.coins - this.run.savedCoins; Save.store(); }
    this.run = null;
    this.state = 'menu';
    Sound.stopMusic();
    Sound.resume();
    UI.showHUD(false);
    UI.showMenu();
  },
  // После победы над боссом можно остаться и играть дальше, пока не погибнешь
  continueEndless() {
    const R = this.run;
    if (!R || !R.won || this.state !== 'over') return;
    R.endless = true; R.ending = false;
    R.savedCoins = R.coins;            // эти монеты уже записаны в сохранение
    R.nextBoss = R.t + 150; R.bossKills = 1;
    R.nextHorde = R.t + 30; R.nextElite = R.t + 20; R.nextEvent = R.t + 40;
    R.boss = null;
    this.state = 'playing';
    UI.show(null); UI.showHUD(true);
    Sound.startMusic(R.loc.music);
    UI.banner('БЕСКОНЕЧНЫЙ РЕЖИМ', 2.5);
  },
  choose(opt) {
    const R = this.run;
    if (this.state !== 'levelup') return;
    applyOption(R, opt);
    Sound.sfx('click');
    const wasChoice = R.choice;
    if (R.choice) R.choice = false; else R.pendingLevels--;
    if (R.pendingLevels > 0) openLevelUp(R);
    else if (wasChoice) { this.state = 'playing'; UI.show(null); }
    else {
      this.state = 'playing';
      UI.show(null);
      // ударная волна нового уровня: расталкивает врагов
      R.effects.push({ type: 'ring', x: R.p.x, y: R.p.y, r: 4, maxR: 80, t: 0, dur: 0.4, dmg: 12, kb: 260, c: '#ffcd75', hit: new Set() });
      R.flashT = 0.25;
      burst(R, R.p.x, R.p.y, 24, '#ffcd75');
    }
  },

  update(dt) {
    if (this.state === 'hub') { Hub.update(dt); return; } // лобби-карта
    if (!this.run) { this.menuT += dt; return; }
    if (this.state !== 'playing') return;
    const R = this.run;
    if (R.ending) {
      R.endT -= dt;
      updateParticles(R, dt); updateTexts(R, dt);
      R.shake = Math.max(0, R.shake - dt * 10);
      if (R.endT <= 0) finishRun(R);
      return;
    }
    // короткая «заморозка» кадра при сильных ударах
    if (R.hitstop > 0) { R.hitstop -= dt; return; }
    R.t += dt;
    Tut.update(R, dt);
    // погода: примерно каждые полторы минуты на полминуты налетает буря или дождь
    const wantW = R.loc.weather && R.t % 95 > 62 ? 1 : 0;
    R.weatherW += (wantW - R.weatherW) * Math.min(1, dt * 0.6);
    R.flashT -= dt; R.hurtFlash -= dt;
    if (R.combo > 0 && (R.comboT -= dt) <= 0) R.combo = 0;
    for (const g of R.ghosts) g.life -= dt;
    R.ghosts = R.ghosts.filter(g => g.life > 0);
    for (const d of R.deaths) d.t += dt;
    R.deaths = R.deaths.filter(d => d.t < 0.18);
    updatePlayer(R, dt);
    R.p.ultCd -= dt;
    R.src = 'ult';
    if (Input.ultQ) {
      Input.ultQ = false;
      const np = R.projs.length, ne = R.effects.length;
      castUlt(R);
      for (let i = np; i < R.projs.length; i++) R.projs[i].src = 'ult';
      for (let i = ne; i < R.effects.length; i++) R.effects[i].src = 'ult';
    }
    updateRam(R, dt);
    R.src = null;
    updateCamera(R, dt);
    // у каждого удара есть источник (R.src) — по нему считается статистика урона
    for (const w of R.p.weapons) {
      const np = R.projs.length, ne = R.effects.length;
      R.src = w.id;
      WEAPON_LOGIC[w.id].update(w, dt, R);
      for (let i = np; i < R.projs.length; i++) R.projs[i].src = w.id;
      for (let i = ne; i < R.effects.length; i++) R.effects[i].src = w.id;
    }
    R.src = null;
    updateSpawns(R, dt);
    updateEnemies(R, dt);
    updateProjectiles(R, dt);
    updateEffects(R, dt);
    updatePickups(R, dt);
    updateParticles(R, dt);
    updateTexts(R, dt);
    R.enemies = R.enemies.filter(e => !e.dead);
    R.shake = Math.max(0, R.shake - dt * 10);
    if (R.pendingLevels > 0 && !R.ending && this.state === 'playing') openLevelUp(R);
    // музыка нарастает вместе с ордой
    const want = clamp(R.enemies.length / 110 + R.t / RUN_TIME * 0.35, 0, 1);
    Sound.intensity += (want - Sound.intensity) * Math.min(1, dt * 0.8);
    UI.updateHUD(R);
  },

  render() {
    Hub.sync();
    if (this.state === 'hub') { Hub.render(this.ctx, this.W, this.H); this.drawJoystick(this.ctx); return; }
    const ctx = this.ctx, W = this.W, H = this.H, R = this.run;
    const loc = R ? R.loc : this.menuLoc;
    let cx, cy;
    if (R) {
      cx = Math.round(R.cx - W / 2); cy = Math.round(R.cy - H / 2);
      const sh = R.shake * Save.data.settings.shake; // тряску можно ослабить или выключить в настройках
      if (sh > 0.3) { cx += Math.round(rand(-sh, sh)); cy += Math.round(rand(-sh, sh)); }
    } else {
      cx = Math.round(this.menuT * 14); cy = Math.round(this.menuT * 7);
    }
    this.camX = cx; this.camY = cy;

    drawGround(ctx, loc, cx, cy, W, H);
    const list = [], lights = [];
    collectDecor(ctx, loc, cx, cy, W, H, list, lights);

    if (R) {
      for (const ef of R.effects) {
        if (ef.type === 'fire') drawFire(ctx, ef, cx, cy);
        else if (ef.type === 'hazard') {
          // предупреждение об ударе бури: круг заполняется к моменту разряда
          const q = ef.t / ef.dur, x = ef.x - cx, y = ef.y - cy;
          ctx.globalAlpha = 0.15 + q * 0.3;
          pxDisc(ctx, x, y, Math.max(1, Math.round(ef.r * q)), '#a7f070');
          ctx.globalAlpha = 1;
          if (Math.floor(ef.t * 14) % 2) pxCircle(ctx, x, y, ef.r, '#a7f070');
        }
      }
      for (const k of R.pickups) {
        const bob = k.mag ? 0 : Math.round(Math.sin(R.t * 5 + k.x * 0.3));
        if (k.type === 'coin') {
          // монета «вращается»
          sprFeet(ctx, 'coin', k.x, k.y + 4 + bob, false, false, Math.max(0.25, Math.abs(Math.cos(R.t * 6 + k.x))), 1);
        } else {
          spr(ctx, k.spr, k.x, k.y + bob);
          if (k.type === 'gem' && (R.t * 2 + k.x * 0.37) % 3 < 0.2) {
            // блик на кристалле
            const gx = Math.round(k.x - 3 - cx), gy = Math.round(k.y - 4 + bob - cy);
            ctx.fillStyle = '#f4f4f4';
            ctx.fillRect(gx - 1, gy, 3, 1); ctx.fillRect(gx, gy - 1, 1, 3);
          }
        }
      }
      for (const d of R.deaths) {
        const q = d.t / 0.18;
        sprFeet(ctx, d.sprite, d.x, d.y + 8 * d.sc, d.face < 0, true, d.ds * (1 + q * 0.9), d.ds * (1 - q), 1 - q * 0.5);
      }
      // шлейф от рывка
      for (const g of R.ghosts) sprFeet(ctx, g.name, g.x, g.y + 12, g.flip, true, HERO_SC, HERO_SC, g.life / 0.25 * 0.5);
      for (const e of R.enemies) {
        if (e.dead || Math.abs(e.x - cx - W / 2) > W / 2 + 40 || Math.abs(e.y - cy - H / 2) > H / 2 + 40) continue;
        list.push({ y: e.y + 8 * e.sc, k: 1, o: e, sc: e.sc });
      }
      if (!(R.ending && !R.won)) list.push({ y: R.p.y + 12, k: 2 });
    }

    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.k === 0) {
        const d = it.o;
        shadow(ctx, d.x, d.y - 2, SPR[d.name].sw * d.s * 0.7);
        sprFeet(ctx, d.name, d.x, d.y, d.flip, false, d.s, d.s);
      }
      else if (it.k === 1) drawEnemy(ctx, it.o, it.sc);
      else drawPlayer(ctx, R);
    }

    // Источники света: герой, огонь, слизни, пули, босс
    if (R) {
      const p = R.p;
      lights.push({ x: p.x - cx, y: p.y - cy, r: 88, c: '#ffcd75', a: 0.10 });
      for (const ef of R.effects) if (ef.type === 'fire') lights.push({ x: ef.x - cx, y: ef.y - cy, r: ef.r * 2.2, c: '#f59e42', a: 0.4 });
      for (const e of R.enemies) {
        if (e.dead || lights.length > 70) continue;
        const sx = e.x - cx, sy = e.y - cy;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;
        if (e.boss) lights.push({ x: sx, y: sy, r: 50, c: e.enraged ? '#b13e53' : e.def.color, a: 0.3 });
        else if (e.elite) lights.push({ x: sx, y: sy, r: 26, c: '#ffcd75', a: 0.3 });
        else if (e.def.ai === 'hop') lights.push({ x: sx, y: sy, r: 12 * e.sc, c: '#a7f070', a: 0.3, hole: 0.4 });
      }
      for (const k of R.pickups) if (k.static) lights.push({ x: k.x - cx, y: k.y - cy, r: 26, c: k.type === 'altar' ? '#b13e53' : '#ffcd75', a: 0.35 + Math.sin(R.t * 4) * 0.1 });
      for (const b of R.ebullets) if (lights.length < 90) lights.push({ x: b.x - cx, y: b.y - cy, r: b.big ? 9 : 6, c: b.c, a: 0.5, hole: 0.5 });
    } else {
      lights.push({ x: W / 2, y: H / 2, r: 90 });
    }
    applyLighting(ctx, loc, lights, W, H);
    drawAmbient(ctx, loc, cx, cy, W, H);
    if (R && R.weatherW > 0.02) drawWeather(ctx, loc, R.weatherW, W, H);

    if (R) drawOverlay(ctx, R, cx, cy, W, H);
    this.drawJoystick(ctx);
  },

  drawJoystick(ctx) {
    const j = Input.joy;
    if (!j.active || (this.state !== 'playing' && this.state !== 'hub')) return;
    const s = this.scale;
    ctx.globalAlpha = 0.45;
    pxCircle(ctx, j.sx / s, j.sy / s, JOY_RADIUS / s, '#f4f4f4');
    pxDisc(ctx, j.x / s, j.y / s, 6, '#f4f4f4');
    ctx.globalAlpha = 1;
  },
};

// ---------- Создание забега ----------
function createRun(charId, locId, opts) {
  const ch = CHARACTERS.find(c => c.id === charId);
  const loc = LOCATIONS.find(l => l.id === locId);
  const m = id => Save.metaLvl(id);
  const mods = opts.mods || {};
  const T = talentBonus(charId); // таланты героя: { hp, armor, dmg, spd, cd, dash, regen, crit, magnet, xp, ult, boss, wlvl }
  // сложность и правила испытания меняют врагов и награды
  const diff = opts.nightmare ? { hp: 1.6, dmg: 1.4, spd: 1.1, rate: 1.25, coin: 2 } : { hp: 1, dmg: 1, spd: 1, rate: 1, coin: 1 };
  if (mods.fast) diff.spd *= 1.35;
  if (mods.horde) diff.rate *= 1.5;
  if (mods.rich) diff.coin *= 2;
  if (mods.tough) diff.hp *= 1.5;
  const glass = mods.glass ? 0.5 : 1;
  const p = {
    x: 0, y: 0, r: 5, sprite: ch.sprite + (Save.data.costume[ch.id] && Save.data.wins[ch.id] ? '_alt' : ''),
    baseHp: Math.round((ch.hp + m('hp') * 10 + T.hp) * glass),
    baseSpeed: ch.speed * (1 + m('spd') * 0.04) * (1 + T.spd),
    armorBase: ch.armor + m('armor') + T.armor,
    regenBase: ch.regen + m('regen') * 0.2 + T.regen,
    dmgBase: (1 + m('dmg') * 0.06) * (1 + T.dmg) * (mods.glass ? 2 : 1),
    magnetBase: 36 * (1 + m('magnet') * 0.15) * (1 + T.magnet),
    xpMul: (1 + m('xp') * 0.08) * (1 + T.xp),
    critBase: 0.12 + T.crit, cdTal: 1 - T.cd, dashMul: 1 - T.dash, ultCost: Math.max(20, ULT_COST - T.ult), bossDmg: 1 + T.boss,
    crit: 0.12, area: 1, dodge: 0, coinMul: 1,
    face: 1, dirX: 1, dirY: 0, moving: false, invT: 0, flash: 0, anim: 0,
    ult: 0, ultCd: 0, ramT: 0, vx: 0, vy: 0, mvx: 0, mvy: 0, turnT: 0, stretchT: 0, squashT: 0,
    dashT: 0, dashCd: 0, dashDX: 1, dashDY: 0, ghostT: 0, stepT: 0, aim: 0, atkT: 0,
    weapons: [], passives: {}, level: 1, xp: 0, xpNext: 6, hp: 0, maxHp: 0,
  };
  return {
    ch, loc, p, t: 0, cx: 0, cy: 0,
    rush: opts.rush || null, // комната боссов: список выбранных боссов
    tal: T, mods, diff, nightmare: !!opts.nightmare, daily: opts.daily || null, talentPts: 0, talentGiven: false, weatherW: 0,
    dmgBy: {}, dmgTaken: 0, src: null,
    chests: 0, pacts: 0, eliteKills: 0, everWon: false, newAch: [], newCostume: false,
    nextEvent: 70, storm: 0, stormT: 0, gold: 0, choice: false, endless: false, savedCoins: 0, nextBoss: 0, bossKills: 0,
    ghosts: [], deaths: [], combo: 0, comboT: 0, bestCombo: 0, hitstop: 0, flashT: 0, hurtFlash: 0, nextElite: 45,
    enemies: [], projs: [], ebullets: [], pickups: [], effects: [], particles: [], texts: [],
    kills: 0, coins: 0, spawnAcc: 0, nextHorde: 60,
    boss: null, bossSpawned: false, won: false, ending: false, endT: 0, shake: 0, pendingLevels: 0,
  };
}

function recalcStats() {
  const p = Game.run.p, pv = p.passives, oldMax = p.maxHp;
  p.maxHp = p.baseHp + (pv.heart || 0) * 20;
  if (oldMax) p.hp += Math.max(0, p.maxHp - oldMax);
  p.speed = p.baseSpeed * (1 + (pv.boots || 0) * 0.1);
  p.armor = p.armorBase + (pv.armor || 0);
  p.regen = p.regenBase + (pv.medkit || 0) * 0.5;
  p.dmgMul = p.dmgBase * (1 + (pv.might || 0) * 0.1);
  p.cdMul = Math.pow(0.92, pv.clock || 0) * p.cdTal;
  p.magnet = p.magnetBase * (1 + (pv.magnet || 0) * 0.35);
  p.crit = p.critBase + (pv.scope || 0) * 0.05;       // прицел
  p.area = 1 + (pv.amp || 0) * 0.1;                   // усилитель: радиус атак
  p.dodge = (pv.cloak || 0) * 0.06;                   // плащ: шанс уклониться
  p.coinMul = 1 + (pv.wallet || 0) * 0.3;             // кошель
}

// ---------- Игрок ----------
function updatePlayer(R, dt) {
  const p = R.p, a = Input.axis();
  const px0 = p.x, py0 = p.y, was = p.moving;
  p.moving = a.x !== 0 || a.y !== 0;
  if (p.moving) {
    const m = Math.hypot(a.x, a.y);
    p.dirX = a.x / m; p.dirY = a.y / m;
    if (Math.abs(a.x) > 0.1) {
      const f = a.x < 0 ? -1 : 1;
      if (f !== p.face) { p.face = f; p.turnT = 0.12; } // разворот
    }
  }
  // старт — вытягивается, остановка — приседает с облачком пыли
  if (p.moving && !was) p.stretchT = 0.12;
  if (!p.moving && was) { p.squashT = 0.14; burst(R, p.x, p.y + 10, 4, DUST[R.loc.id]); }
  p.turnT -= dt; p.stretchT -= dt; p.squashT -= dt;
  // рывок: быстрый бросок с неуязвимостью
  p.dashCd -= dt;
  if (Input.dashQ) {
    Input.dashQ = false;
    if (p.dashCd <= 0 && p.dashT <= 0 && !R.mods.nodash) {
      p.dashT = DASH_TIME; p.dashCd = DASH_CD * p.dashMul;
      R.dashed = true;
      p.dashDX = p.dirX; p.dashDY = p.dirY;
      burst(R, p.x, p.y + 8, 8, DUST[R.loc.id]);
      Sound.sfx('dash');
    }
  }
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.x += p.dashDX * DASH_SPEED * dt;
    p.y += p.dashDY * DASH_SPEED * dt;
    p.ghostT -= dt;
    if (p.ghostT <= 0) { p.ghostT = 0.025; R.ghosts.push({ name: heroFrame(p), x: p.x, y: p.y, flip: p.face < 0, life: 0.25 }); }
    p.mvx = p.dashDX * p.speed; p.mvy = p.dashDY * p.speed;
  } else {
    // плавный разгон и торможение
    const k = 1 - Math.exp(-dt * 16);
    p.mvx += (a.x * p.speed - p.mvx) * k;
    p.mvy += (a.y * p.speed - p.mvy) * k;
    p.x += p.mvx * dt;
    p.y += p.mvy * dt;
    // пыль из-под ног
    p.stepT -= dt;
    if (p.moving && p.stepT <= 0) {
      p.stepT = 0.16;
      R.particles.push({ x: p.x - p.dirX * 3 + rand(-2, 2), y: p.y + 11, vx: -p.dirX * 12 + rand(-6, 6), vy: rand(-14, -4), life: 0.35, c: DUST[R.loc.id], s: Math.random() < 0.5 ? 2 : 1, g: 0 });
    }
  }
  resolveSolids(R.loc, p, 4, 8); // герой упирается в препятствия
  // реальная скорость героя — враги целятся на опережение
  if (dt > 0) { p.vx = (p.x - px0) / dt; p.vy = (p.y - py0) / dt; }
  p.anim += dt; p.invT -= dt; p.flash -= dt; p.atkT -= dt;
  if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
}

const DASH_TIME = 0.18, DASH_CD = 2.2, DASH_SPEED = 300;
const DUST = { desert: '#cfb273', factory: '#94b0c2', forest: '#6b6e4a', metro: '#767881', gates: '#8a7aa8' };

function heroFrame(p) {
  if (p.dashT > 0 || Math.hypot(p.mvx, p.mvy) > 10) return p.sprite + '_w' + (Math.floor(p.anim * 11) % 6);
  if (p.anim % 3.4 < 0.13) return p.sprite + '_ib'; // моргает
  return p.sprite + '_i' + (Math.floor(p.anim * 2.2) % 2);
}

// Камера плавно догоняет героя и чуть забегает вперёд по ходу движения
function updateCamera(R, dt) {
  const p = R.p, look = p.moving ? 14 : 0;
  const k = 1 - Math.exp(-dt * 7);
  R.cx += (p.x + p.dirX * look - R.cx) * k;
  R.cy += (p.y + p.dirY * look - R.cy) * k;
}

function hurtPlayer(R, dmg) {
  const p = R.p;
  if (p.invT > 0 || p.dashT > 0 || p.ramT > 0 || R.ending) return;
  if (p.dodge > 0 && Math.random() < p.dodge) {
    // плащ: удар прошёл мимо
    p.invT = 0.3;
    burst(R, p.x, p.y, 5, '#c7dcd0');
    return;
  }
  dmg = Math.max(1, Math.round(dmg - p.armor));
  p.hp -= dmg;
  R.dmgTaken += dmg;
  p.invT = 0.4; p.flash = 0.12;
  R.shake = Math.max(R.shake, 3.5);
  R.hitstop = 0.05; R.hurtFlash = 0.3;
  burst(R, p.x, p.y, 6, '#b13e53');
  Sound.sfx('hurt');
  Sound.grunt(R.ch.id);
  addText(R, p.x, p.y - 12, dmg, '#ff5a5a');
  if (p.hp <= 0) {
    p.hp = 0;
    R.ending = true; R.endT = 1.5; R.won = false;
    burst(R, p.x, p.y, 30, '#f4f4f4'); burst(R, p.x, p.y, 20, '#b13e53');
    R.shake = 6;
    Sound.stopMusic();
    Sound.sfx('lose');
  }
}

// ---------- Появление врагов ----------
function spawnDist() { return Math.hypot(Game.W, Game.H) / 2 + 12; }

function makeEnemy(R, type, x, y) {
  const def = ENEMIES[type], mul = 1 + R.t / 60 * 0.35, D = R.diff;
  const hp = def.hp * mul * D.hp;
  return { type, def, x, y, hp, maxHp: hp, speed: def.speed * rand(0.9, 1.1) * D.spd, r: def.r, slowT: 0,
    dmg: def.dmg * (1 + R.t / 600 * 0.5) * D.dmg, kvx: 0, kvy: 0, flash: 0, face: 1,
    sc: def.size ? def.size / 16 : 1, spawnT: 0.3, squash: 0,
    flank: Math.random() < 0.6 ? rand(-1, 1) : 0, lunge: def.lunge || null, lungeCd: rand(0, 1.5), lst: 0, lt: 0,
    shots: 2, strafeT: rand(0.5, 2), mv: true, hop: 0, fuse: 0, castT: rand(2, 5),
    anim: Math.random() * 10, shootT: rand(1, 3), side: Math.random() < 0.5 ? -1 : 1, dead: false };
}

// Элитный враг: вдвое крупнее, очень живучий, оставляет щедрую добычу
function spawnElite(R) {
  const a = Math.random() * Math.PI * 2, d = spawnDist();
  const e = makeEnemy(R, pick(['zombie', 'slime', 'marauder']), R.p.x + Math.cos(a) * d, R.p.y + Math.sin(a) * d);
  e.elite = true; e.sc = 2; e.r *= 1.7;
  e.lunge = { range: 120, wind: 0.5, time: 0.5, mul: 3.6, cd: 4 }; // элита умеет таранить
  e.hp *= 9; e.maxHp = e.hp; e.dmg *= 1.5; e.speed *= 1.15;
  R.enemies.push(e);
  UI.banner('ЭЛИТНЫЙ ВРАГ!', 1.5);
}

function spawnAround(R, type, angle) {
  const a = angle !== undefined ? angle : Math.random() * Math.PI * 2, d = spawnDist();
  R.enemies.push(makeEnemy(R, type, R.p.x + Math.cos(a) * d, R.p.y + Math.sin(a) * d));
}

function pickEnemyType(R) {
  const f = R.t / RUN_TIME, lw = R.loc.weights;
  const w = { zombie: lw.zombie, rat: lw.rat };
  if (f > 0.07) w.slime = lw.slime;
  if (f > 0.17) w.marauder = lw.marauder;
  // новые типы врагов подключаются по ходу забега (from — доля времени до босса)
  for (const id of ['bomber', 'drone', 'brute', 'necro']) if (lw[id] && f > ENEMIES[id].from) w[id] = lw[id];
  return weightedPick(w);
}

function updateSpawns(R, dt) {
  if (R.rush) {
    // комната боссов: все выбранные боссы выходят сразу
    if (!R.bossSpawned && R.t >= 1.5) {
      R.rush.forEach(id => spawnBoss(R, id));
      UI.banner(R.rush.length > 1 ? 'БОССЫ: ' + R.rush.length : 'БОСС: ' + BOSSES[R.rush[0]].name, 3);
    }
    // полоска здоровья показывает ближайшего живого босса
    let best = null, bd = 1e12;
    for (const e of R.enemies) if (e.boss && !e.dead) { const d = dist2(e.x, e.y, R.p.x, R.p.y); if (d < bd) { bd = d; best = e; } }
    if (best) R.boss = best;
  }
  if (!R.bossSpawned && R.t >= RUN_TIME) bossList(R).forEach(id => spawnBoss(R, id)); // на некоторых локациях боссов несколько
  // в бесконечном режиме боссы возвращаются, каждый следующий сильнее
  if (R.endless && R.t >= R.nextBoss && (!R.boss || R.boss.dead)) spawnBoss(R, pick(Object.keys(BOSSES)), 1 + R.bossKills * 0.6);
  const calm = R.bossSpawned && !R.endless; // финальный бой: поток врагов слабее
  const rate = (calm ? 1.2 : 0.7 + R.t / 50) * R.diff.rate;
  const cap = calm ? 60 : Math.min(280, (25 + R.t * 0.42) * R.diff.rate);
  R.spawnAcc += rate * dt;
  while (R.spawnAcc >= 1) {
    R.spawnAcc -= 1;
    if (R.enemies.length < cap) spawnAround(R, pickEnemyType(R));
  }
  if (!calm && R.t >= R.nextElite) { R.nextElite += R.mods.elites ? 18 : 45; spawnElite(R); }
  if (!calm && R.t >= R.nextEvent) { R.nextEvent += 70; startEvent(R); }
  updateEvent(R, dt);
  // Каждую минуту — орда, окружающая героя
  if (!calm && R.t >= R.nextHorde) {
    R.nextHorde += 60;
    const type = weightedPick({ zombie: R.loc.weights.zombie, rat: R.loc.weights.rat });
    const n = Math.floor(16 + R.t / 30);
    for (let i = 0; i < n; i++) spawnAround(R, type, i / n * Math.PI * 2);
    UI.banner('ОРДА!', 1.5);
  }
}

// ---------- События на карте ----------
function dropNear(R, item, dist) {
  const a = Math.random() * Math.PI * 2;
  const k = Object.assign({ x: R.p.x + Math.cos(a) * dist, y: R.p.y + Math.sin(a) * dist, static: true }, item);
  resolveSolids(R.loc, k, 12, 0); // не внутри препятствия
  R.pickups.push(k);
}
function startEvent(R) {
  const ev = pick(['storm', 'gold', 'chest', 'altar', 'chest', 'merchant', 'merchant']);
  if (ev === 'merchant') { dropNear(R, { type: 'merchant', spr: 'merchant' }, 130); UI.banner('Пришёл торговец!', 2); Sound.sfx('coin'); }
  else if (ev === 'storm') { R.storm = 12; R.stormT = 0; UI.banner('РАДИОАКТИВНАЯ БУРЯ!', 2); Sound.sfx('roar'); }
  else if (ev === 'gold') { R.gold = 15; UI.banner('ЗОЛОТАЯ ЛИХОРАДКА!', 2); Sound.sfx('chest'); }
  else if (ev === 'chest') { dropNear(R, { type: 'chest', spr: 'chest' }, 150); UI.banner('Рядом появился сундук!', 2); Sound.sfx('coin'); }
  else { dropNear(R, { type: 'altar', spr: 'altar' }, 150); UI.banner('Появился тёмный алтарь...', 2); Sound.sfx('necro'); }
}
function updateEvent(R, dt) {
  R.gold -= dt;
  if (R.storm > 0) {
    // буря: на землю бьют разряды — зелёный круг предупреждает, куда ударит
    R.storm -= dt; R.stormT -= dt;
    if (R.stormT <= 0) {
      R.stormT = 0.4;
      const p = R.p, onMe = Math.random() < 0.3;
      const x = onMe ? p.x + p.vx * 0.6 : p.x + rand(-110, 110), y = onMe ? p.y + p.vy * 0.6 : p.y + rand(-80, 80);
      R.effects.push({ type: 'hazard', x, y, r: 18, t: 0, dur: 0.9 });
    }
  }
}
function strike(R, ef) {
  ef.done = true;
  const p = R.p, rr = ef.r + 4;
  R.effects.push({ type: 'bolt', pts: jagged(ef.x + rand(-20, 20), ef.y - 150, ef.x, ef.y), t: 0, dur: 0.2 });
  burst(R, ef.x, ef.y, 12, '#a7f070');
  if (dist2(p.x, p.y, ef.x, ef.y) < rr * rr) hurtPlayer(R, 14);
  for (const e of R.enemies) if (!e.dead && dist2(e.x, e.y, ef.x, ef.y) < (rr + e.r) * (rr + e.r)) hurtEnemy(R, e, 40, e.x - ef.x, e.y - ef.y, 120);
  R.shake = Math.max(R.shake, 2);
  Sound.sfx('zap');
}

// Взрыв подрывника: бьёт и героя (если рядом), и других врагов
function explode(R, e, hurtP) {
  e.exploded = true;
  const rad = 34, p = R.p;
  burst(R, e.x, e.y, 22, '#f59e42'); burst(R, e.x, e.y, 10, '#ffcd75');
  R.effects.push({ type: 'ring', nohit: true, fixed: true, x: e.x, y: e.y, r: 4, maxR: rad, t: 0, dur: 0.25, c: '#f59e42', hit: new Set() });
  R.shake = Math.max(R.shake, 4);
  Sound.sfx('boom');
  if (hurtP && dist2(p.x, p.y, e.x, e.y) < rad * rad) hurtPlayer(R, e.dmg);
  for (const o of R.enemies) {
    if (o === e || o.dead) continue;
    if (dist2(o.x, o.y, e.x, e.y) < (rad + o.r) * (rad + o.r)) hurtEnemy(R, o, 35, o.x - e.x, o.y - e.y, 200);
  }
  if (!e.dead) killEnemy(R, e);
}

// Сундук: случайная награда
function openChest(R) {
  const p = R.p, roll = Math.random();
  R.chests++;
  burst(R, p.x, p.y, 30, '#ffcd75');
  R.flashT = 0.2;
  Sound.sfx('chest');
  if (roll < 0.4) { R.pendingLevels++; UI.banner('СУНДУК: улучшение!', 1.5); }
  else if (roll < 0.65) { R.coins += 15; UI.banner('СУНДУК: +15 монет', 1.5); }
  else if (roll < 0.85) { for (const k of R.pickups) if (!k.static) k.mag = true; UI.banner('СУНДУК: магнит!', 1.5); }
  else { p.hp = p.maxHp; UI.banner('СУНДУК: полное лечение', 1.5); }
}

function spawnBoss(R, id, mul) {
  R.bossSpawned = true;
  mul = mul || 1;
  R.lastBossId = id || R.loc.boss;
  (R.fought || (R.fought = [])).push(R.lastBossId);
  const def = BOSSES[id || R.loc.boss], a = Math.random() * Math.PI * 2, d = spawnDist();
  const e = { boss: true, def, type: 'boss', x: R.p.x + Math.cos(a) * d, y: R.p.y + Math.sin(a) * d,
    hp: def.hp * mul * R.diff.hp, maxHp: def.hp * mul * R.diff.hp, speed: def.speed, r: def.r, dmg: def.dmg * R.diff.dmg, kvx: 0, kvy: 0,
    flash: 0, face: 1, anim: 0, dash: 0, tele: 0, dvx: 0, dvy: 0, sc: def.scale, spawnT: 0, squash: 0,
    attacks: def.attacks.map(at => Object.assign({}, at, { t: at.cd * 0.6 })) };
  R.enemies.push(e);
  R.boss = e;
  R.shake = 5;
  UI.banner('БОСС: ' + def.name, 3);
  Sound.sfx('roar');
  Sound.startMusic('boss');
  if (!R.endless && !R.rush) Story.bossTalk(R, def); // короткий диалог перед финальным боем
}

// ---------- Враги ----------
function updateEnemies(R, dt) {
  const p = R.p, far = Math.hypot(Game.W, Game.H) * 0.75 + 40;
  const fires = R.effects.filter(ef => ef.type === 'fire');
  for (const e of R.enemies) {
    if (e.dead) continue;
    e.flash -= dt; e.anim += dt; e.spawnT -= dt; e.squash -= dt; e.atkT -= dt;
    if (e.stunT > 0) {
      // оглушён: стоит на месте, только отлетает от ударов
      e.stunT -= dt;
      e.x += e.kvx * dt; e.y += e.kvy * dt;
      const dm = Math.min(1, dt * 10);
      e.kvx -= e.kvx * dm; e.kvy -= e.kvy * dm;
      continue;
    }
    if (e.boss) { updateBoss(R, e, dt); continue; }
    let dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    if (d > far) { relocate(R, e); continue; }

    // Цель — не сам герой, а точка, где он окажется (упреждение)
    const lead = Math.min(1, d / 110) * 0.4;
    let tx = p.x + p.vx * lead, ty = p.y + p.vy * lead;
    // Издалека часть врагов заходит сбоку, чтобы окружить
    if (d > 40 && e.flank) { const off = Math.min(d * 0.5, 55) * e.flank; tx += -dy * off; ty += dx * off; }
    let mx = tx - e.x, my = ty - e.y;
    const tl = Math.hypot(mx, my) || 1;
    mx /= tl; my /= tl;
    let spd = e.speed, locked = false;
    const ai = e.def.ai;

    // Бросок: замах (мигает и приседает) → быстрый прыжок в точку упреждения
    if (e.lunge) {
      const L = e.lunge;
      e.lungeCd -= dt;
      if (e.lst === 1) {
        spd = 0; e.lt -= dt;
        e.flash = Math.floor(e.lt * 24) % 2 ? 0.04 : 0;
        if (e.lt <= 0) { e.lst = 2; e.lt = L.time; e.lvx = mx; e.lvy = my; if (e.elite) Sound.sfx('dash'); }
      } else if (e.lst === 2) {
        mx = e.lvx; my = e.lvy; spd = e.speed * L.mul; locked = true;
        e.lt -= dt;
        if (e.lt <= 0) { e.lst = 0; e.lungeCd = L.cd * rand(0.8, 1.3); }
      } else if (d < L.range && e.lungeCd <= 0) {
        e.lst = 1; e.lt = L.wind;
      } else if (ai === 'lunge') {
        // крысы бегут зигзагом — в них труднее попасть
        const z = Math.sin(e.anim * 7) * 0.7 * e.side;
        mx += -dy * z; my += dx * z;
      }
    }

    if (ai === 'hop' && !e.lst) {
      // слизень двигается прыжками
      e.hop = (e.anim * 1.5) % 1;
      spd = e.hop < 0.5 ? e.speed * 2.4 : 0;
    } else if (ai === 'shamble') {
      if (d < 32) spd *= 1.4; // рывок к жертве вблизи
    } else if (ai === 'gunner' && !e.lst) {
      // мародёр: отступает, кружит на дистанции, стреляет очередями на опережение
      e.strafeT -= dt;
      if (e.strafeT <= 0) { e.strafeT = rand(1.2, 2.5); e.side = -e.side; }
      if (d < 65) { mx = -dx - dy * 0.4 * e.side; my = -dy + dx * 0.4 * e.side; }
      else if (d < 105) { mx = -dy * e.side; my = dx * e.side; spd *= 0.7; }
      e.shootT -= dt;
      if (e.shootT <= 0 && d < 160) {
        const tb = d / 75 * 0.8;
        let ax = p.x + p.vx * tb - e.x, ay = p.y + p.vy * tb - e.y;
        const al = Math.hypot(ax, ay) || 1;
        R.ebullets.push({ x: e.x, y: e.y, vx: ax / al * 75, vy: ay / al * 75, dmg: e.dmg + 2, life: 3, big: false, c: '#ef7d57' });
        Sound.sfx('eshoot');
        e.squash = 0.08; e.atkT = 0.25;
        if (--e.shots > 0) e.shootT = 0.25;
        else { e.shots = 2; e.shootT = rand(2.4, 3.4); }
      }
    } else if (ai === 'bomber') {
      // подрывник: добежал — запал (мигает) — взрыв. От него надо отбегать или убить раньше
      if (e.fuse > 0) {
        spd = 0; e.fuse -= dt;
        e.flash = Math.floor(e.fuse * 20) % 2 ? 0.04 : 0;
        if (e.fuse <= 0) { explode(R, e, true); continue; }
      } else if (d < 24) { e.fuse = 0.7; Sound.sfx('warn'); }
    } else if (ai === 'drone') {
      // дрон кружит на расстоянии и стреляет одиночными на опережение
      if (d < 70) { mx = -dx; my = -dy; }
      else if (d < 115) { mx = -dy * e.side; my = dx * e.side; }
      e.shootT -= dt;
      if (e.shootT <= 0 && d < 170) {
        e.shootT = rand(1.6, 2.4);
        const tb = d / 90 * 0.8;
        const ax = p.x + p.vx * tb - e.x, ay = p.y + p.vy * tb - e.y, al = Math.hypot(ax, ay) || 1;
        R.ebullets.push({ x: e.x, y: e.y - 6, vx: ax / al * 90, vy: ay / al * 90, dmg: e.dmg, life: 3, big: false, c: '#73eff7' });
        Sound.sfx('eshoot');
      }
    } else if (ai === 'necro') {
      // некромант держится позади и поднимает зомби
      if (d < 90) { mx = -dx; my = -dy; }
      else if (d < 130) { mx = -dy * e.side * 0.6; my = dx * e.side * 0.6; spd *= 0.5; }
      e.castT -= dt;
      if (e.castT <= 0 && d < 220 && R.enemies.length < 280) {
        e.castT = 6; e.squash = 0.15; e.atkT = 0.6;
        for (let i = 0; i < 3; i++) {
          const z = makeEnemy(R, 'zombie', e.x + rand(-18, 18), e.y + rand(-18, 18));
          R.enemies.push(z);
          burst(R, z.x, z.y, 6, '#8a3f8a');
        }
        Sound.sfx('necro');
      }
    }

    // Обходят горящую землю, а не лезут в огонь
    if (!locked) {
      for (const f of fires) {
        const fx = e.x - f.x, fy = e.y - f.y, fd = Math.hypot(fx, fy);
        if (fd < f.r + 10 && fd > 0.1) { mx += fx / fd * 1.6; my += fy / fd * 1.6; }
      }
      const ml = Math.hypot(mx, my);
      if (ml > 1) { mx /= ml; my /= ml; }
    }

    if (e.slowT > 0) { e.slowT -= dt; spd *= 0.45; } // заморожен ледяным посохом
    e.mv = spd > 0;
    e.x += (mx * spd + e.kvx) * dt;
    e.y += (my * spd + e.kvy) * dt;
    const damp = Math.min(1, dt * 10);
    e.kvx -= e.kvx * damp; e.kvy -= e.kvy * damp;
    // препятствия: дроны пролетают сверху, остальные упираются и обходят вдоль стенки
    if (ai !== 'drone') {
      const h = resolveSolids(R.loc, e, 4, e.sc * 8 - 4);
      if (h) {
        let tx2 = -h.y, ty2 = h.x;
        const dot = tx2 * dx + ty2 * dy;
        if (dot < -0.05 || (dot < 0.05 && e.side < 0)) { tx2 = -tx2; ty2 = -ty2; }
        const sl = Math.max(spd, e.speed) * dt * 0.9;
        e.x += tx2 * sl; e.y += ty2 * sl;
        if (e.lst === 2) { e.lst = 0; e.lungeCd = e.lunge.cd; e.squash = 0.15; } // бросок врезался в стену
      }
    }
    if (Math.abs(p.x - e.x) > 0.5) e.face = p.x < e.x ? -1 : 1;
    if (d < e.r + p.r) { e.atkT = 0.25; hurtPlayer(R, e.dmg * (e.lst === 2 ? 1.25 : 1)); }
  }
  separate(R);
}

// Враг слишком далеко — переносим его вперёд по ходу движения героя
function relocate(R, e) {
  const p = R.p;
  const a = p.moving ? Math.atan2(p.dirY, p.dirX) + rand(-1, 1) : Math.random() * Math.PI * 2;
  const d = spawnDist();
  e.x = p.x + Math.cos(a) * d; e.y = p.y + Math.sin(a) * d;
}

// Враги расталкивают друг друга (сетка для скорости)
function separate(R) {
  const cell = 12, grid = new Map();
  const key = (cx, cy) => (cx + 32768) * 65536 + (cy + 32768);
  for (const e of R.enemies) {
    if (e.boss || e.dead) continue;
    const k = key(Math.floor(e.x / cell), Math.floor(e.y / cell));
    let arr = grid.get(k);
    if (!arr) grid.set(k, arr = []);
    arr.push(e);
  }
  for (const e of R.enemies) {
    if (e.boss || e.dead) continue;
    const cx = Math.floor(e.x / cell), cy = Math.floor(e.y / cell);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const arr = grid.get(key(cx + ox, cy + oy));
      if (!arr) continue;
      for (const o of arr) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r - 2, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.0001) {
          const d = Math.sqrt(d2), push = (rr - d) * 0.25;
          e.x += dx / d * push; e.y += dy / d * push;
        }
      }
    }
  }
}

function updateBoss(R, e, dt) {
  const p = R.p;
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  // Ярость на половине здоровья: быстрее двигается и чаще атакует
  if (!e.enraged && e.hp < e.maxHp * 0.5) {
    e.enraged = true; e.speed *= 1.25;
    R.shake = Math.max(R.shake, 5);
    UI.banner('БОСС В ЯРОСТИ!', 1.8);
    Sound.sfx('roar');
  }
  const rate = e.enraged ? 1.5 : 1;
  e.mv = true;
  if (e.dash > 0) {
    e.dash -= dt;
    e.x += e.dvx * dt; e.y += e.dvy * dt;
    if (Math.random() < 0.5) burst(R, e.x, e.y + e.r, 1, DUST[R.loc.id]);
  } else if (e.tele > 0) {
    // подготовка к рывку — мигает
    e.tele -= dt; e.mv = false;
    e.flash = Math.floor(e.tele * 20) % 2 ? 0.05 : 0;
    if (e.tele <= 0) {
      // рывок в точку, куда герой бежит
      const tx = p.x + p.vx * 0.35 - e.x, ty = p.y + p.vy * 0.35 - e.y, tl = Math.hypot(tx, ty) || 1;
      e.dash = 0.6;
      e.dvx = tx / tl * e.speed * 4.5; e.dvy = ty / tl * e.speed * 4.5;
      Sound.sfx('dash');
    }
  } else {
    // идёт наперерез, а не строго по прямой
    const lead = Math.min(1, d / 120) * 0.7;
    const tx = p.x + p.vx * lead - e.x, ty = p.y + p.vy * lead - e.y, tl = Math.hypot(tx, ty) || 1;
    e.x += tx / tl * e.speed * dt; e.y += ty / tl * e.speed * dt;
    for (const a of e.attacks) a.t -= dt * rate;
    // выбирает атаку по дистанции: рывок — издалека, кольцо пуль — вблизи
    const ready = e.attacks.filter(a => a.t <= 0 && !(a.type === 'dash' && d < 60) && !(a.type === 'ring' && d > 170));
    if (ready.length) {
      const a = ready.find(a => a.type === 'dash' && d > 110) || ready[0];
      a.t = a.cd;
      // стреляет на опережение
      const tb = d / 85 * 0.8;
      const ax = p.x + p.vx * tb - e.x, ay = p.y + p.vy * tb - e.y, al = Math.hypot(ax, ay) || 1;
      bossAttack(R, e, a, ax / al, ay / al);
    }
  }
  e.face = dx < 0 ? -1 : 1;
  if (d < e.r + p.r) hurtPlayer(R, e.dmg);
}

function bossAttack(R, e, a, nx, ny) {
  e.atkT = 0.45;
  const c = e.def.color;
  if (a.type === 'spread') {
    const base = Math.atan2(ny, nx);
    for (let i = 0; i < a.n; i++) {
      const ang = base + (i - (a.n - 1) / 2) * 0.22;
      R.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 85, vy: Math.sin(ang) * 85, dmg: 12, life: 4, big: true, c });
    }
    Sound.sfx('eshoot');
  } else if (a.type === 'ring') {
    const off = Math.random() * Math.PI;
    for (let i = 0; i < a.n; i++) {
      const ang = off + i / a.n * Math.PI * 2;
      R.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60, dmg: 12, life: 5, big: true, c });
    }
    R.shake = Math.max(R.shake, 2);
    Sound.sfx('eshoot');
  } else if (a.type === 'rain') {
    // «двойки с неба»: круги-предупреждения вокруг героя и прямо под ним
    const p = R.p;
    for (let i = 0; i < a.n; i++) {
      const onMe = i < 2, ang = Math.random() * Math.PI * 2, d = onMe ? i * 14 : rand(25, 95);
      R.effects.push({ type: 'hazard', x: p.x + p.vx * 0.5 + Math.cos(ang) * d, y: p.y + p.vy * 0.5 + Math.sin(ang) * d, r: 18, t: 0, dur: 0.9 + i * 0.08 });
    }
    Sound.sfx('warn');
  } else if (a.type === 'dash') {
    e.tele = 0.6;
  } else if (a.type === 'summon') {
    for (let i = 0; i < a.n; i++) {
      const ang = i / a.n * Math.PI * 2;
      R.enemies.push(makeEnemy(R, a.spawn || 'zombie', e.x + Math.cos(ang) * 26, e.y + Math.sin(ang) * 26));
    }
    Sound.sfx('roar');
  }
}

function hurtEnemy(R, e, dmg, kx, ky, kb) {
  if (e.dead) return;
  const crit = Math.random() < R.p.crit;
  const strong = e.boss || e.elite ? R.p.bossDmg : 1; // талант «охотник»: урон по боссам и элите
  dmg = Math.max(1, Math.round(dmg * R.p.dmgMul * strong * rand(0.9, 1.1) * (crit ? 2 : 1)) - (e.def.armor || 0));
  // статистика: засчитываем только реально снятое здоровье
  const key = R.src || 'other';
  R.dmgBy[key] = (R.dmgBy[key] || 0) + Math.min(dmg, Math.max(0, e.hp));
  e.hp -= dmg;
  e.flash = 0.1; e.squash = 0.12;
  const d = Math.hypot(kx, ky) || 1;
  if (kb && !e.boss) {
    const k = e.elite ? kb * 0.3 : kb;
    e.kvx += kx / d * k; e.kvy += ky / d * k;
  }
  // искры от удара
  for (let i = 0; i < (crit ? 5 : 2) && R.particles.length < 500; i++) {
    R.particles.push({ x: e.x, y: e.y, vx: kx / d * 60 + rand(-50, 50), vy: ky / d * 60 + rand(-50, 50), life: 0.18, c: crit ? '#ffcd75' : '#f4f4f4', s: 1, g: 0 });
  }
  addText(R, e.x, e.y - 8 * e.sc, dmg, crit ? '#ffcd75' : '#f4f4f4', crit);
  Sound.sfx('hit');
  if (e.hp <= 0) killEnemy(R, e);
}

function killEnemy(R, e) {
  e.dead = true;
  R.kills++;
  burst(R, e.x, e.y, e.boss ? 60 : e.elite ? 25 : 7, e.def.color);
  R.deaths.push({ sprite: e.def.sprite, x: e.x, y: e.y, face: e.face, sc: e.sc, ds: enemyDS(e), t: 0 });
  if (e.boss) { bossDefeated(R, e); return; }
  if (e.def.ai === 'bomber' && !e.exploded) explode(R, e, false); // убитый подрывник взрывается среди своих
  // комбо: убийства подряд дают бонус к опыту
  if (R.p.ultCd <= 0) R.p.ult = Math.min(R.p.ultCost, R.p.ult + (e.elite ? 6 : 1));
  R.combo++; R.comboT = 2;
  R.bestCombo = Math.max(R.bestCombo, R.combo);
  if (R.combo % 100 === 0) { R.coins += 3; UI.banner('КОМБО x' + R.combo + '!  +3 монеты', 1.2); Sound.sfx('coin'); }
  if (e.elite) {
    R.eliteKills++;
    R.shake = Math.max(R.shake, 5); R.hitstop = 0.06;
    dropGem(R, e.x, e.y, 12);
    for (let i = 0; i < 6; i++) R.pickups.push({ type: 'coin', spr: 'coin', x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), v: 1 });
    if (Math.random() < 0.4) R.pickups.push({ type: 'heart', spr: 'heart', x: e.x, y: e.y, v: 25 });
    return;
  }
  dropGem(R, e.x, e.y, e.def.xp);
  if (Math.random() < (R.gold > 0 ? 0.3 : 0.035 * R.diff.coin * R.p.coinMul)) R.pickups.push({ type: 'coin', spr: 'coin', x: e.x + rand(-4, 4), y: e.y + rand(-4, 4), v: 1 });
  if (Math.random() < 0.012) R.pickups.push({ type: 'heart', spr: 'heart', x: e.x, y: e.y, v: 25 });
  if (e.def.split) {
    for (let i = 0; i < 2; i++) R.enemies.push(makeEnemy(R, 'minislime', e.x + rand(-5, 5), e.y + rand(-5, 5)));
  }
}

function bossDefeated(R, e) {
  if (R.endless) {
    // в бесконечном режиме бой продолжается: награда и следующий босс позже
    R.coins += 50; R.bossKills++;
    R.nextBoss = R.t + 150;
    R.shake = 8; R.hitstop = 0.1;
    burst(R, e.x, e.y, 60, '#ffcd75');
    const chest = { type: 'chest', spr: 'chest', x: e.x, y: e.y, static: true };
    resolveSolids(R.loc, chest, 12, 0);
    R.pickups.push(chest);
    Sound.sfx('win');
    Sound.startMusic(R.loc.music);
    UI.banner('БОСС ПОВЕРЖЕН!  +50 монет', 2.5);
    return;
  }
  // если боссов несколько (комната боссов, дуэт в Японии) — победа только когда повержены все
  const left = R.enemies.filter(o => o.boss && !o.dead).length;
  if (R.rush) R.coins += 20;
  if (R.rush || left > 0) { R.shake = 8; R.hitstop = 0.1; burst(R, e.x, e.y, 60, '#ffcd75'); }
  if (left > 0) { Sound.sfx('win'); UI.banner('ПОВЕРЖЕН: ' + e.def.name + '. Осталось: ' + left, 2.2); return; }
  R.won = true; R.everWon = true;
  if (!R.rush) R.coins += 100 * R.diff.coin;
  R.ending = true; R.endT = 2.8;
  R.shake = 8;
  for (const o of R.enemies) if (!o.dead) { o.dead = true; burst(R, o.x, o.y, 5, o.def.color); }
  burst(R, e.x, e.y, 60, '#ffcd75');
  Sound.stopMusic();
  Sound.sfx('win');
  Sound.cheer(R.ch.id);
  UI.banner('ПОБЕДА!', 2.5);
}

function finishRun(R) {
  const d = Save.data;
  d.coins += R.coins - R.savedCoins;
  R.savedCoins = R.coins;
  const story = !R.rush; // комната боссов — тренировка: сюжет, локации, костюмы и рекорды она не трогает
  if (story && R.won && !d.cleared[R.loc.id]) R.firstClear = true; // первая победа на локации — покажем сюжетную главу
  if (story && R.won) d.cleared[R.loc.id] = true;
  if (R.endless) d.best.endless = Math.max(d.best.endless || 0, R.t);
  // победа за героя открывает его костюм
  R.newCostume = story && R.everWon && !d.wins[R.ch.id];
  if (story && R.everWon) d.wins[R.ch.id] = true;
  // достижения, выполненные в этом забеге (у комнаты боссов — свои, с пометкой rush)
  R.newAch = [];
  for (const a of ACHIEVEMENTS) {
    if (!!a.rush !== !!R.rush) continue;
    if (!d.ach[a.id] && a.test(R, d)) { d.ach[a.id] = true; d.coins += a.coins; R.newAch.push(a); }
  }
  if (story) {
    d.best.time = Math.max(d.best.time || 0, Math.min(R.t, RUN_TIME));
    d.best.kills = Math.max(d.best.kills || 0, R.kills);
    d.best.level = Math.max(d.best.level || 0, R.p.level);
    d.best.combo = Math.max(d.best.combo || 0, R.bestCombo);
    if (R.everWon && R.nightmare) d.clearedN[R.loc.id] = true;
  }
  // очки талантов героя: 1 за каждую минуту забега, +5 за победу (один раз за забег)
  if (!R.talentGiven) {
    R.talentGiven = true;
    R.talentPts = R.rush ? (R.everWon ? R.rush.length : 0)
      : Math.round((Math.floor(Math.min(R.t, RUN_TIME) / 60) + (R.everWon ? 5 : 0)) * (R.nightmare ? 1.5 : 1));
    const tl = d.talents[R.ch.id] || (d.talents[R.ch.id] = { pts: 0, ranks: {} });
    tl.pts += R.talentPts;
  }
  Daily.finish(R);
  Story.checkEnding(R);
  if (!d.tutDone && R.t > 90) d.tutDone = true;
  Save.store();
  Game.state = 'over';
  UI.showHUD(false);
  UI.showEnd(R);
}

// ---------- Снаряды и эффекты ----------
function updateProjectiles(R, dt) {
  for (const pr of R.projs) {
    R.src = pr.src;
    if (pr.type === 'arrow') {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (solidAt(R.loc, pr.x, pr.y + 6)) { pr.life = 0; burst(R, pr.x, pr.y, 2, '#c7dcd0'); continue; } // воткнулась в препятствие
      for (const e of R.enemies) {
        if (e.dead || pr.hit.has(e)) continue;
        const rr = e.r + 2;
        if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) {
          pr.hit.add(e);
          hurtEnemy(R, e, pr.dmg, pr.vx, pr.vy, 50);
          if (--pr.pierce <= 0) { pr.life = 0; break; }
        }
      }
    } else if (pr.type === 'bottle') {
      pr.t += dt;
      const q = Math.min(1, pr.t / pr.dur);
      pr.x = pr.sx + (pr.tx - pr.sx) * q; pr.y = pr.sy + (pr.ty - pr.sy) * q;
      if (pr.t >= pr.dur) {
        pr.life = 0;
        R.effects.push({ type: 'fire', x: pr.tx, y: pr.ty, r: pr.s.r * R.p.area, t: 0, dur: pr.s.dur, dmg: pr.s.dmg, tick: 0, src: pr.src });
        Sound.sfx('fire');
      }
    } else updateExtraProj(R, pr, dt); // бумеранг, мины, ледяные сферы — в weapons.js
  }
  R.projs = R.projs.filter(pr => pr.life > 0);
  R.src = null;

  const p = R.p;
  for (const b of R.ebullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (solidAt(R.loc, b.x, b.y + 6)) { b.life = 0; burst(R, b.x, b.y, 3, b.c); continue; } // за препятствием можно укрыться
    const rr = p.r + (b.big ? 3 : 2);
    if (dist2(b.x, b.y, p.x, p.y) < rr * rr) { hurtPlayer(R, b.dmg); b.life = 0; }
  }
  R.ebullets = R.ebullets.filter(b => b.life > 0);
}

function updateEffects(R, dt) {
  const p = R.p;
  for (const ef of R.effects) {
    if (ef.delay > 0) { ef.delay -= dt; continue; }
    ef.t += dt;
    R.src = ef.src || null;
    if (ef.type === 'hazard') {
      if (ef.t >= ef.dur && !ef.done) strike(R, ef);
    } else if (ef.type === 'ring') {
      if (!ef.fixed) { ef.x = p.x; ef.y = p.y; }
      ef.r = 4 + (ef.maxR - 4) * Math.min(1, ef.t / ef.dur);
      if (!ef.nohit) for (const e of R.enemies) {
        if (e.dead || ef.hit.has(e)) continue;
        const rr = ef.r + e.r;
        if (dist2(ef.x, ef.y, e.x, e.y) < rr * rr) { ef.hit.add(e); hurtEnemy(R, e, ef.dmg, e.x - ef.x, e.y - ef.y, ef.kb || 140); }
      }
    } else if (ef.type === 'fire') {
      ef.tick -= dt;
      if (ef.tick <= 0) {
        ef.tick = 0.4;
        for (const e of R.enemies) {
          if (e.dead) continue;
          const rr = ef.r + e.r * 0.5;
          if (dist2(ef.x, ef.y, e.x, e.y) < rr * rr) hurtEnemy(R, e, ef.dmg, 0, 0, 0);
        }
      }
    }
  }
  R.effects = R.effects.filter(ef => ef.delay > 0 || ef.t < ef.dur);
  R.src = null;
}

// ---------- Подбираемые предметы и опыт ----------
function dropGem(R, x, y, v) {
  // слишком много кристаллов на карте — добавляем опыт к существующему
  if (R.pickups.length > 450) {
    const g = R.pickups.find(k => k.type === 'gem');
    if (g) { g.v += v; return; }
  }
  const spr = v >= 5 ? 'gem3' : v >= 2 ? 'gem2' : 'gem';
  R.pickups.push({ type: 'gem', spr, x: x + rand(-2, 2), y: y + rand(-2, 2), v });
}

function updatePickups(R, dt) {
  const p = R.p, mag2 = p.magnet * p.magnet;
  for (const k of R.pickups) {
    const dx = p.x - k.x, dy = p.y - k.y, d2 = dx * dx + dy * dy;
    if (k.static) { if (d2 < 196 && Game.state === 'playing') collect(R, k); continue; } // сундук и алтарь — надо подойти
    if (!k.mag && d2 < (k.type === 'heart' ? 256 : mag2)) k.mag = true;
    if (k.mag) {
      const d = Math.sqrt(d2) || 1;
      k.spd = Math.min(280, (k.spd || 30) + 500 * dt);
      k.x += dx / d * k.spd * dt; k.y += dy / d * k.spd * dt;
      if (d < 6) collect(R, k);
    }
  }
  R.pickups = R.pickups.filter(k => !k.done);
}

function collect(R, k) {
  k.done = true;
  const p = R.p;
  // вспышка при подборе
  const pc = k.type === 'gem' ? '#73eff7' : k.type === 'coin' ? '#ffcd75' : '#ef7d57';
  for (let i = 0; i < 3 && R.particles.length < 500; i++) R.particles.push({ x: p.x + rand(-4, 4), y: p.y, vx: rand(-15, 15), vy: rand(-50, -25), life: 0.3, c: pc, s: 1, g: 0 });
  if (k.type === 'chest') openChest(R);
  else if (k.type === 'merchant') Merchant.open(R);
  else if (k.type === 'altar') {
    // алтарь предлагает сделку
    R.choice = true;
    Game.state = 'levelup';
    UI.showLevelUp([{ kind: 'pact', id: 'power' }, { kind: 'pact', id: 'greed' }, { kind: 'pact', id: 'skip' }], 'ТЁМНЫЙ АЛТАРЬ');
    Sound.sfx('necro');
  }
  else if (k.type === 'gem') addXp(R, k.v);
  else if (k.type === 'coin') { R.coins += k.v; Sound.sfx('coin'); }
  else if (k.type === 'heart') {
    p.hp = Math.min(p.maxHp, p.hp + k.v);
    addText(R, p.x, p.y - 12, k.v, '#38b764');
    Sound.sfx('heal');
  }
}

function addXp(R, v) {
  const p = R.p;
  p.xp += v * p.xpMul * (1 + Math.min(R.combo, 100) / 200);
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.floor(5 + p.level * 4 + Math.pow(p.level, 1.4));
    R.pendingLevels++;
  }
  Sound.sfx('gem');
}

function levelOptions(R) {
  const p = R.p, pool = [];
  for (const w of p.weapons) if (w.lvl < 5) pool.push({ kind: 'weapon', id: w.id, lvl: w.lvl + 1 });
  if (p.weapons.length < 5 && !R.mods.onlystart) {
    for (const id in WEAPONS) if (!p.weapons.some(w => w.id === id)) pool.push({ kind: 'weapon', id, lvl: 1 });
  }
  const owned = Object.keys(p.passives).length;
  for (const id in PASSIVES) {
    const l = p.passives[id] || 0;
    if (l >= PASSIVES[id].max || (!l && owned >= 5)) continue;
    pool.push({ kind: 'passive', id, lvl: l + 1 });
  }
  const out = shuffle(pool).slice(0, 3);
  // доступная эволюция всегда предлагается первой
  const evo = p.weapons.find(w => w.lvl >= 5 && !w.evo && p.passives[WEAPONS[w.id].evo.need]);
  if (evo) { out.unshift({ kind: 'evolve', id: evo.id }); out.length = Math.min(out.length, 3); }
  if (out.length < 3) out.push({ kind: 'heal' });
  if (out.length < 3) out.push({ kind: 'coins' });
  return out;
}

function applyOption(R, o) {
  const p = R.p;
  if (o.kind === 'weapon') {
    const w = p.weapons.find(w => w.id === o.id);
    if (w) w.lvl++; else addWeapon(o.id);
  } else if (o.kind === 'pact') {
    if (o.id !== 'skip') R.pacts++;
    if (o.id === 'power') { p.dmgBase *= 1.25; p.baseHp = Math.round(p.baseHp * 0.8); recalcStats(); p.hp = Math.min(p.hp, p.maxHp); }
    else if (o.id === 'greed') { R.coins += 30; p.hp = Math.max(1, p.hp - 25); }
  } else if (o.kind === 'evolve') {
    p.weapons.find(w => w.id === o.id).evo = true;
    UI.banner(WEAPONS[o.id].evo.name + '!', 2);
  } else if (o.kind === 'passive') {
    p.passives[o.id] = (p.passives[o.id] || 0) + 1;
    recalcStats();
  } else if (o.kind === 'heal') {
    p.hp = Math.min(p.maxHp, p.hp + 40);
  } else if (o.kind === 'coins') {
    R.coins += 15;
  }
}

function openLevelUp(R) {
  Game.state = 'levelup';
  UI.showLevelUp(levelOptions(R));
  Sound.sfx('levelup');
}

// ---------- Частицы и числа урона ----------
function burst(R, x, y, n, c) {
  for (let i = 0; i < n && R.particles.length < 500; i++) {
    R.particles.push({ x, y, vx: rand(-70, 70), vy: rand(-90, 30), life: rand(0.3, 0.7), c, s: Math.random() < 0.3 ? 2 : 1 });
  }
}
function updateParticles(R, dt) {
  for (const q of R.particles) {
    q.x += q.vx * dt; q.y += q.vy * dt;
    q.vy += (q.g === undefined ? 160 : q.g) * dt; q.vx *= 0.96;
    q.life -= dt;
  }
  R.particles = R.particles.filter(q => q.life > 0);
}
function addText(R, x, y, v, c, big) {
  if (R.texts.length > 60) R.texts.shift();
  R.texts.push({ x: x + rand(-3, 3), y, v: String(v), c, life: big ? 0.8 : 0.6, big });
}
function updateTexts(R, dt) {
  for (const t of R.texts) { t.y -= 18 * dt; t.life -= dt; }
  R.texts = R.texts.filter(t => t.life > 0);
}

// ================= ОТРИСОВКА =================
function spr(ctx, name, x, y, flip, white, scale) {
  const s = SPR[name];
  if (!s) return;
  const img = white ? (flip ? s.wf : s.w) : (flip ? s.f : s.n);
  const w = Math.round(s.sw * (scale || 1)), h = Math.round(s.sh * (scale || 1));
  ctx.drawImage(img, Math.round(x - w / 2 - Game.camX), Math.round(y - h / 2 - Game.camY), w, h);
}
// Спрайт с привязкой к «ногам»: можно растягивать и сплющивать (sx, sy)
function sprFeet(ctx, name, x, yFeet, flip, white, sx, sy, alpha) {
  const s = SPR[name];
  if (!s) return;
  const img = white ? (flip ? s.wf : s.w) : (flip ? s.f : s.n);
  const w = Math.max(1, Math.round(s.sw * sx)), h = Math.max(1, Math.round(s.sh * sy));
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(img, Math.round(x - w / 2 - Game.camX), Math.round(yFeet - h - Game.camY), w, h);
  if (alpha !== undefined) ctx.globalAlpha = 1;
}
function shadow(ctx, x, y, w) {
  // мягкая овальная тень из трёх полосок
  const X = Math.round(x - w / 2 - Game.camX), Y = Math.round(y - Game.camY);
  w = Math.round(w);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(X + 2, Y - 1, w - 4, 1);
  ctx.fillRect(X + 2, Y + 2, w - 4, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(X, Y, w, 2);
}
function pxCircle(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  const n = Math.max(12, Math.floor(r * 6.3));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  }
}
function pxDisc(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  x = Math.round(x); y = Math.round(y);
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(x - w, y + dy, w * 2 + 1, 1);
  }
}
function pxLine(ctx, x0, y0, x1, y1, c) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  ctx.fillStyle = c;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n), 1, 1);
}

// Пиксельный шрифт 3x5 для цифр урона
const DIGITS = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
};
function drawNum(ctx, str, x, y, c, k) {
  k = k || 1;
  const w = (str.length * 4 - 1) * k, sx = Math.round(x - w / 2);
  y = Math.round(y);
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? c : '#1a1c2c';
    let cx = sx + (pass ? 0 : 1);
    for (const ch of str) {
      const g = DIGITS[ch];
      if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) * k, y + ((i / 3) | 0) * k + (pass ? 0 : 1), k, k);
      cx += 4 * k;
    }
  }
}

function drawGround(ctx, loc, cx, cy, W, H) {
  // Два типа грунта: крупные «пятна» второго задаёт плавный шум, края размыты случайностью
  const T = TILES[loc.id];
  const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
  const nx = Math.ceil(W / 16) + 1, ny = Math.ceil(H / 16) + 1;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const tx = x0 + i, ty = y0 + j, X = tx * 16 - cx, Y = ty * 16 - cy;
    const h2 = hash01(tx, ty, loc.seed + 9);
    const v = h2 < 0.42 ? 0 : h2 < 0.68 ? 1 : h2 < 0.8 ? 2 : h2 < 0.89 ? 3 : h2 < 0.95 ? 4 : 5;
    // шум в четырёх углах плитки: если граница зон проходит через неё — рисуем переход
    const s5 = loc.seed + 5, TH = 0.56;
    const n0 = vnoise(tx / 6, ty / 6, s5), n1 = vnoise((tx + 1) / 6, ty / 6, s5);
    const n2 = vnoise(tx / 6, (ty + 1) / 6, s5), n3 = vnoise((tx + 1) / 6, (ty + 1) / 6, s5);
    const lo = Math.min(n0, n1, n2, n3), hi = Math.max(n0, n1, n2, n3);
    if (lo > TH + 0.035) { ctx.drawImage(T.b[v], X, Y); continue; }
    ctx.drawImage(T.a[v], X, Y);
    if (hi < TH - 0.035) continue;
    // переход: клетки 4x4 пикселя с «рваным» краем вместо ровных квадратов
    const B = T.b[v];
    for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) {
      const u = (a + 0.5) / 4, w = (b + 0.5) / 4;
      const n = n0 + (n1 - n0) * u + (n2 - n0) * w + (n0 - n1 - n2 + n3) * u * w + (hash01(tx * 4 + a, ty * 4 + b, loc.seed + 3) - 0.5) * 0.07;
      if (n > TH) ctx.drawImage(B, a * 4, b * 4, 4, 4, X + a * 4, Y + b * 4, 4, 4);
    }
  }
}

// Погода поверх мира: песчаная буря в пустыне, дождь с молниями в лесу и на заводе
function drawWeather(ctx, loc, w, W, H) {
  const now = performance.now() / 1000;
  if (loc.weather === 'sandstorm') {
    ctx.fillStyle = 'rgba(205,165,95,' + (0.24 * w).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f0dca0';
    const n = Math.floor(100 * w);
    for (let i = 0; i < n; i++) {
      const sp = 220 + (i % 7) * 40;
      const x = ((i * 97.3 + now * sp) % (W + 40)) - 20;
      const y = (i * 53.7 + now * 30 + Math.sin(now * 2 + i) * 6) % (H + 10);
      ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
      ctx.fillRect(x | 0, y | 0, 4 + i % 6, 1);
    }
  } else {
    ctx.fillStyle = 'rgba(30,50,100,' + (0.18 * w).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = loc.id === 'factory' ? '#b8e08a' : '#9fc4f0';
    const n = Math.floor(120 * w);
    for (let i = 0; i < n; i++) {
      const sp = 300 + (i % 5) * 45;
      const y = ((i * 61.3 + now * sp) % (H + 20)) - 10;
      const x = (((i * 113.7 - y * 0.35) % W) + W) % W;
      ctx.globalAlpha = 0.35 + (i % 4) * 0.1;
      ctx.fillRect(x | 0, y | 0, 1, 3);
      ctx.fillRect((x | 0) - 1, (y | 0) + 3, 1, 2);
    }
    // брызги на земле
    ctx.globalAlpha = 0.4 * w;
    for (let i = 0; i < 14; i++) ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 2, 1);
    // редкая вспышка молнии
    if (Math.sin(now * 0.9) + Math.sin(now * 2.3) > 1.9) { ctx.globalAlpha = 0.22 * w; ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, W, H); }
  }
  ctx.globalAlpha = 1;
}

// Плавный шум 0..1
function vnoise(x, y, s) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const a = hash01(x0, y0, s), b = hash01(x0 + 1, y0, s), c = hash01(x0, y0 + 1, s), d = hash01(x0 + 1, y0 + 1, s);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ---------- Свет и атмосфера ----------
const GLOW_DECOR = {
  toxic: ['#c77dff', 20, 0.4],
  puddle: ['#a7f070', 20, 0.35], rbarrel: ['#a7f070', 14, 0.3], mushroom: ['#e86a92', 14, 0.35],
  glowshroom: ['#73eff7', 11, 0.45], machine: ['#a7f070', 12, 0.25],
};
const _glows = {};
function glowSprite(color) {
  if (_glows[color]) return _glows[color];
  const c = makeCanvas(64, 64), x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color + 'ff'); g.addColorStop(0.45, color + '70'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_glows[color] = c);
}

function applyLighting(ctx, loc, lights, W, H) {
  const A = loc.ambient;
  if (A.dark > 0) {
    // темнота с «дырами» вокруг источников света
    const x = Game.lightCtx, white = glowSprite('#ffffff');
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.clearRect(0, 0, W, H);
    x.globalAlpha = A.dark; x.fillStyle = A.color; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const r = l.r * 1.7;
      x.globalAlpha = l.hole === undefined ? 0.9 : l.hole;
      x.drawImage(white, l.x - r, l.y - r, r * 2, r * 2);
    }
    ctx.drawImage(Game.lightCv, 0, 0);
  }
  // цветное свечение
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (!l.c) continue;
    ctx.globalAlpha = l.a || 0.3;
    ctx.drawImage(glowSprite(l.c), l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (A.tint) { ctx.fillStyle = A.tint; ctx.fillRect(0, 0, W, H); }
  ctx.drawImage(Game.vigCv, 0, 0);
}

// Атмосферные частицы: песок на ветру, искры и пепел, светлячки и туман
function drawAmbient(ctx, loc, cx, cy, W, H) {
  const now = performance.now() / 1000, fx = loc.ambient.fx;
  if (!Game.amb || Game.amb.fx !== fx) {
    const n = fx === 'sand' ? 34 : fx === 'ash' ? 30 : 22;
    Game.amb = { fx, t: now, cx, cy, list: Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), ph: Math.random() * 6.28, fog: fx === 'fireflies' && i < 5 })) };
  }
  const A = Game.amb, dt = Math.min(0.05, now - A.t);
  const dcx = cx - A.cx, dcy = cy - A.cy;
  A.t = now; A.cx = cx; A.cy = cy;
  for (const q of A.list) {
    q.x -= dcx; q.y -= dcy;
    if (fx === 'sand') {
      q.x += (50 + q.s * 60) * dt; q.y += (6 + Math.sin(now * 2 + q.ph) * 8) * dt;
      ctx.globalAlpha = 0.25 + q.s * 0.35;
      ctx.fillStyle = q.s > 0.5 ? '#f0dca0' : '#cfb273';
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 2 + Math.round(q.s * 3), 1);
    } else if (fx === 'ash') {
      q.y -= (6 + q.s * 16) * dt; q.x += Math.sin(now * 1.5 + q.ph) * 10 * dt;
      const spark = q.s > 0.7;
      ctx.globalAlpha = spark ? 0.6 + Math.sin(now * 12 + q.ph) * 0.4 : 0.3;
      ctx.fillStyle = spark ? '#f59e42' : '#94b0c2';
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    } else if (fx === 'petals') {
      // лепестки сакуры
      q.y += (14 + q.s * 16) * dt; q.x += (6 + Math.sin(now * 1.5 + q.ph) * 14) * dt;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = q.s > 0.5 ? '#f9a8c4' : '#e86a92';
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 1);
    } else if (q.fog) {
      // полосы тумана
      q.x += (5 + q.s * 6) * dt;
      ctx.globalAlpha = 0.10;
      ctx.drawImage(glowSprite('#9fb4c8'), q.x - 90, q.y - 28, 180, 56);
    } else {
      // светлячки
      q.x += Math.cos(now * 0.7 + q.ph) * 9 * dt; q.y += Math.sin(now * 0.9 + q.ph * 1.7) * 9 * dt;
      const bl = 0.5 + Math.sin(now * 3 + q.ph * 3) * 0.5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = bl * 0.5;
      ctx.drawImage(glowSprite('#c8f070'), q.x - 6, q.y - 6, 12, 12);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = bl;
      ctx.fillStyle = '#e8ffa0';
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }
    const m = q.fog ? 100 : 8;
    if (q.x > W + m) q.x -= W + m * 2; else if (q.x < -m) q.x += W + m * 2;
    if (q.y > H + m) q.y -= H + m * 2; else if (q.y < -m) q.y += H + m * 2;
  }
  ctx.globalAlpha = 1;
}

function chunkDecor(loc, i, j) {
  const key = loc.id + ':' + i + ',' + j;
  let arr = Game.decor.get(key);
  if (arr) return arr;
  if (Game.decor.size > 800) Game.decor.clear();
  const rnd = mulberry32(hashInt(i, j, loc.seed));
  const weights = {};
  loc.decor.forEach((d, idx) => { weights[idx] = d[2]; });
  arr = [];
  const n = Math.floor(rnd() * (loc.density + 1));
  for (let k = 0; k < n; k++) {
    const d = loc.decor[weightedPick(weights, rnd)];
    arr.push({ name: d[0], s: d[1], x: i * CHUNK + rnd() * CHUNK, y: j * CHUNK + rnd() * CHUNK, flip: rnd() < 0.5 });
  }
  // твёрдые объекты: прямоугольник у основания (кроме тех, что рядом с точкой старта)
  arr.solids = [];
  for (const d of arr) {
    const s = SOLID[d.name];
    if (s && Math.hypot(d.x, d.y) > 48) arr.solids.push({ x: d.x, y: d.y - s[1], hw: s[0], hd: s[1] });
  }
  // мелочи на земле: камешки, трава, кости — делают грунт «живым»
  arr.small = [];
  const sn = 5 + Math.floor(rnd() * 5);
  for (let k = 0; k < sn; k++) {
    arr.small.push({ name: loc.details[Math.floor(rnd() * loc.details.length)], x: i * CHUNK + rnd() * CHUNK, y: j * CHUNK + rnd() * CHUNK, flip: rnd() < 0.5 });
  }
  Game.decor.set(key, arr);
  return arr;
}

// ---------- Твёрдые препятствия ----------
// [полуширина, полуглубина] основания: сквозь них нельзя пройти, и они останавливают пули
const SOLID = {
  cactus: [4, 3], rbarrel: [5, 4], rock: [5, 3], crate: [6, 5], drum: [5, 4], scrap: [5, 3],
  deadtree: [4, 3], stump: [5, 3], tomb: [5, 3], machine: [6, 4], car: [15, 5], wagon: [15, 5],
};
const _hit = { x: 0, y: 0 };

// Выталкивает круг (o.x, o.y + off, радиус r) из препятствий. Возвращает нормаль столкновения или null
function resolveSolids(loc, o, r, off) {
  const m = r + 16;
  let X = o.x, Y = o.y + off, hit = null;
  const x0 = Math.floor((X - m) / CHUNK), x1 = Math.floor((X + m) / CHUNK);
  const y0 = Math.floor((Y - m) / CHUNK), y1 = Math.floor((Y + m) / CHUNK);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    for (const b of chunkDecor(loc, i, j).solids) {
      const qx = clamp(X, b.x - b.hw, b.x + b.hw), qy = clamp(Y, b.y - b.hd, b.y + b.hd);
      let dx = X - qx, dy = Y - qy;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        dx /= d; dy /= d;
        X = qx + dx * r; Y = qy + dy * r;
      } else if (b.hw - Math.abs(X - b.x) < b.hd - Math.abs(Y - b.y)) {
        dx = X < b.x ? -1 : 1; dy = 0; X = b.x + dx * (b.hw + r);
      } else {
        dx = 0; dy = Y < b.y ? -1 : 1; Y = b.y + dy * (b.hd + r);
      }
      hit = _hit; hit.x = dx; hit.y = dy;
    }
  }
  if (hit) { o.x = X; o.y = Y - off; }
  return hit;
}

// Точка внутри препятствия? (для пуль и стрел)
function solidAt(loc, x, y) {
  const x0 = Math.floor((x - 16) / CHUNK), x1 = Math.floor((x + 16) / CHUNK);
  const y0 = Math.floor((y - 16) / CHUNK), y1 = Math.floor((y + 16) / CHUNK);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    for (const b of chunkDecor(loc, i, j).solids) {
      if (Math.abs(x - b.x) <= b.hw && Math.abs(y - b.y) <= b.hd + 2) return true;
    }
  }
  return false;
}

function collectDecor(ctx, loc, cx, cy, W, H, list, lights) {
  const m = 40, now = performance.now() / 1000;
  const x0 = Math.floor((cx - m) / CHUNK), x1 = Math.floor((cx + W + m) / CHUNK);
  const y0 = Math.floor((cy - m) / CHUNK), y1 = Math.floor((cy + H + m) / CHUNK);
  const glow = (d, yOff) => {
    const g = GLOW_DECOR[d.name];
    if (g && lights.length < 60) lights.push({ x: d.x - cx, y: d.y - yOff - cy, r: g[1], c: g[0], a: g[2] * (0.8 + Math.sin(now * 2.5 + d.x) * 0.2), hole: 0.6 });
  };
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const arr = chunkDecor(loc, i, j);
    for (const d of arr.small) { sprFeet(ctx, d.name, d.x, d.y, d.flip, false, 1, 1); glow(d, 3); }
    for (const d of arr) {
      if (FLAT_DECOR.has(d.name)) { sprFeet(ctx, d.name, d.x, d.y, d.flip, false, d.s, d.s); glow(d, 3); }
      else { list.push({ y: d.y, k: 0, o: d }); glow(d, 8); }
    }
  }
}

// Масштаб отрисовки врага: спрайты нарисованы крупнее, чем враг занимает в мире (больше деталей).
// Боссы нарисованы в натуральную величину.
function enemyDS(e) {
  return e.boss ? e.sc / 3 : e.sc * 17.6 / SPR[e.def.sprite].sw;
}

function drawEnemy(ctx, e, sc) {
  const sz = 16 * sc, feet = e.y + sz / 2, ds = enemyDS(e);
  if (e.elite) {
    // золотая аура элитного врага
    ctx.globalAlpha = 0.35 + Math.sin(e.anim * 6) * 0.15;
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(Math.round(e.x - sz * 0.45 - Game.camX), Math.round(feet - 4 - Game.camY), Math.round(sz * 0.9), 4);
    ctx.globalAlpha = 1;
  }
  shadow(ctx, e.x, feet - 2, sz * 0.6);
  // «желейная» походка + сплющивание при ударе + вырастание при появлении
  // У каждого типа своя походка. k > 0 — вытянут вверх, k < 0 — сплющен
  const ai = e.def.ai, stun = e.stunT > 0;
  let k = 0, ox = 0, oy = 0, name = e.def.sprite;
  const fps = e.def.fps || 4;
  // кадр атаки: замах и бросок, выстрел, колдовство, запал подрывника, удар босса
  const attacking = e.atkT > 0 || e.lst === 1 || e.lst === 2 || e.fuse > 0 || e.tele > 0 || e.dash > 0;
  if (!stun && attacking && SPR[name + '_atk']) name += '_atk';
  else if (!stun && e.mv && SPR[name + '_a']) name += Math.floor(e.anim * fps) % 2 ? '_a' : '_b'; // кадры шага
  if (stun) k = -0.08;
  else if (e.lst === 1) k = -0.25 * (1 - e.lt / e.lunge.wind);        // приседает перед броском
  else if (e.lst === 2) { k = -0.2; oy = -2 * sc; }                   // летит, вытянувшись вдоль земли
  else if (ai === 'hop') {
    // прыжок слизня: сжался → вытянулся в воздухе → шлёпнулся
    const h = e.hop;
    if (h < 0.5) { const q = Math.sin(h / 0.5 * Math.PI); k = 0.22 * q; oy = -5 * q * sc; }
    else k = -0.2 * Math.sin((h - 0.5) / 0.5 * Math.PI);
  } else if (ai === 'lunge') {
    oy = -Math.abs(Math.sin(e.anim * 14)) * 2; k = Math.sin(e.anim * 14) * 0.06; // семенит вприпрыжку
  } else if (ai === 'shamble') {
    ox = Math.sin(e.anim * 5) * 1.2; k = Math.sin(e.anim * 8) * 0.05;           // шатается из стороны в сторону
  } else if (ai === 'gunner') {
    oy = -(Math.floor(e.anim * fps) % 2); k = 0.02;
  } else if (ai === 'bomber') {
    // бежит вперевалку; перед взрывом раздувается
    if (e.fuse > 0) k = -0.3 * (1 - e.fuse / 0.7) + Math.sin(e.anim * 40) * 0.05;
    else { ox = Math.sin(e.anim * 12) * 1; k = Math.sin(e.anim * 12) * 0.08; }
  } else if (ai === 'drone') {
    oy = -7 + Math.sin(e.anim * 4) * 2;                 // парит над землёй
    if (Math.floor(e.anim * 20) % 2) ox = 0.5;
  } else if (ai === 'necro') {
    oy = -1 + Math.sin(e.anim * 3) * 1.5; k = 0.03;     // плывёт в воздухе
  } else {
    // босс: тяжёлая поступь
    k = Math.sin(e.anim * 5) * 0.04; oy = -Math.abs(Math.sin(e.anim * 5)) * 2;
  }
  if (e.squash > 0) k -= e.squash * 2.2;
  const grow = e.spawnT > 0 ? 1 - e.spawnT / 0.3 : 1;
  if (e.boss && e.enraged) {
    // красная аура ярости
    ctx.globalAlpha = 0.3 + Math.sin(e.anim * 10) * 0.15;
    pxDisc(ctx, e.x - Game.camX, feet - 3 - Game.camY, Math.round(sz * 0.45), '#b13e53');
    ctx.globalAlpha = 1;
  }
  sprFeet(ctx, name, e.x + ox, feet + oy, e.face < 0, e.flash > 0, ds * (1 - k), ds * (1 + k) * grow);
  if (e.stunT > 0) {
    // звёздочки над оглушённым
    ctx.fillStyle = '#ffcd75';
    for (let i = 0; i < 2; i++) {
      const a = e.anim * 8 + i * Math.PI;
      ctx.fillRect(Math.round(e.x + Math.cos(a) * 5 - Game.camX), Math.round(e.y - sz / 2 - 3 + Math.sin(a) * 1.5 - Game.camY), 2, 2);
    }
  }
  if (e.elite && e.hp < e.maxHp) {
    const bx = Math.round(e.x - 10 - Game.camX), by = Math.round(e.y - sz / 2 - 5 - Game.camY);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(bx - 1, by - 1, 22, 4);
    ctx.fillStyle = '#ffcd75'; ctx.fillRect(bx, by, Math.round(20 * Math.max(0, e.hp) / e.maxHp), 2);
  }
}

// Оружие в руках героя
function drawHeldWeapon(ctx, R) {
  const p = R.p, id = R.ch.weapon, cx = Game.camX, cy = Game.camY;
  if (id === 'bow') {
    const a = p.atkT > -1 ? p.aim : (p.face < 0 ? Math.PI : 0);
    const ox = p.x + Math.cos(a) * 6 - cx, oy = p.y + 2 + Math.sin(a) * 5 - cy;
    ctx.fillStyle = '#8b4a2b';
    for (let i = -4; i <= 4; i++) {
      const b = a + i * 0.24;
      ctx.fillRect(Math.round(ox + Math.cos(b) * 6 - Math.cos(a) * 3), Math.round(oy + Math.sin(b) * 6 - Math.sin(a) * 3), 1, 1);
    }
    const t1 = a - 0.96, t2 = a + 0.96, pull = p.atkT > 0 ? 0 : 2;
    const ex1 = ox + Math.cos(t1) * 6 - Math.cos(a) * 3, ey1 = oy + Math.sin(t1) * 6 - Math.sin(a) * 3;
    const ex2 = ox + Math.cos(t2) * 6 - Math.cos(a) * 3, ey2 = oy + Math.sin(t2) * 6 - Math.sin(a) * 3;
    const mx = ox - Math.cos(a) * pull, my = oy - Math.sin(a) * pull;
    pxLine(ctx, ex1, ey1, mx, my, '#f4f4f4'); pxLine(ctx, mx, my, ex2, ey2, '#f4f4f4');
  } else if (id === 'axe') {
    // секира на плече; при броске замахивается
    const a = p.atkT > 0 ? p.aim - 1.1 + (1 - p.atkT / 0.2) * 2.2 : (p.face < 0 ? Math.PI + 1.1 : -1.1);
    const hx = p.x + p.face * 7 - cx, hy = p.y + 2 - cy, ex = hx + Math.cos(a) * 12, ey = hy + Math.sin(a) * 12;
    pxLine(ctx, hx, hy, ex, ey, '#8b4a2b');
    pxDisc(ctx, ex, ey, 3, '#1a1c2c'); pxDisc(ctx, ex, ey, 2, '#aebfd0');
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 1, 1);
  } else if (id === 'sword' || id === 'katana') {
    let a;
    if (p.atkT > 0) a = p.aim - 1.1 + (1 - p.atkT / 0.2) * 2.2;          // взмах
    else a = p.face < 0 ? Math.PI + 0.9 : -0.9;                          // меч на плече
    const hx = p.x + p.face * 6 - cx, hy = p.y + 2 - cy;
    pxLine(ctx, hx, hy, hx + Math.cos(a) * 12, hy + Math.sin(a) * 12, '#c7dcd0');
    pxLine(ctx, hx + Math.cos(a) * 3, hy + Math.sin(a) * 3, hx + Math.cos(a) * 12, hy + Math.sin(a) * 12 - 1, '#f4f4f4');
    ctx.fillStyle = '#ffcd75';
    ctx.fillRect(Math.round(hx + Math.cos(a) * 2 - 1), Math.round(hy + Math.sin(a) * 2 - 1), 2, 2);
  }
}

function drawPlayer(ctx, R) {
  const p = R.p;
  const blink = p.invT > 0 && p.flash <= 0 && Math.floor(p.invT * 20) % 2 === 0;
  shadow(ctx, p.x, p.y + 10, 11);
  if (p.ramT > 0) {
    // золотой щит тарана (мигает перед окончанием)
    if (p.ramT > 1 || Math.floor(p.ramT * 10) % 2) {
      const a = R.t * 6;
      pxCircle(ctx, p.x - Game.camX, p.y - Game.camY, 15, '#ffcd75');
      for (let i = 0; i < 6; i++) pxDisc(ctx, p.x - Game.camX + Math.cos(a + i * 1.047) * 15, p.y - Game.camY + Math.sin(a + i * 1.047) * 15, 1, '#f4f4f4');
    }
  }
  if (!blink) {
    // при рывке герой вытягивается
    let sx = 1, sy = 1;
    if (p.dashT > 0) { sx = 1.15; sy = 0.85; }
    if (p.stretchT > 0) { const q = p.stretchT / 0.12; sx *= 1 - 0.14 * q; sy *= 1 + 0.12 * q; }
    if (p.squashT > 0) { const q = p.squashT / 0.14; sx *= 1 + 0.16 * q; sy *= 1 - 0.14 * q; }
    if (p.turnT > 0) sx *= 1 - 0.65 * (p.turnT / 0.12); // разворот «через ребро»
    sprFeet(ctx, heroFrame(p), p.x, p.y + 12, p.face < 0, p.flash > 0, sx * HERO_SC, sy * HERO_SC);
    drawHeldWeapon(ctx, R);
  }
  // полоска здоровья под героем
  const bx = Math.round(p.x - 7 - Game.camX), by = Math.round(p.y + 14 - Game.camY);
  ctx.fillStyle = '#1a1c2c'; ctx.fillRect(bx - 1, by - 1, 16, 4);
  ctx.fillStyle = '#5d275d'; ctx.fillRect(bx, by, 14, 2);
  ctx.fillStyle = '#b13e53'; ctx.fillRect(bx, by, Math.round(14 * p.hp / p.maxHp), 2);
}

function drawFire(ctx, ef, cx, cy) {
  const fade = ef.t > ef.dur - 0.5 ? Math.max(0, (ef.dur - ef.t) / 0.5) : 1;
  const x = ef.x - cx, y = ef.y - cy;
  ctx.globalAlpha = 0.3 * fade;
  pxDisc(ctx, x, y, ef.r, '#5d275d');
  ctx.globalAlpha = fade;
  const cols = ['#ef7d57', '#ffcd75', '#b13e53', '#f59e42'];
  const n = Math.floor(ef.r * 2.2);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * ef.r;
    ctx.fillStyle = cols[i & 3];
    ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1, 2);
  }
  ctx.globalAlpha = 1;
}

function drawOverlay(ctx, R, cx, cy, W, H) {
  const p = R.p;
  // пилы
  for (const w of p.weapons) {
    if (w.id !== 'saws') continue;
    for (const [sx, sy] of sawPositions(w, R)) spr(ctx, 'saw', sx, sy, Math.floor(R.t * 20) % 2 === 0);
  }
  // стрелы и бутылки
  for (const pr of R.projs) {
    if (pr.star) {
      // сюрикен: вращающийся крестик
      const x = Math.round(pr.x - cx), y = Math.round(pr.y - cy), d = Math.floor(R.t * 30) % 2;
      ctx.fillStyle = '#1e1a26';
      if (d) { ctx.fillRect(x - 3, y - 1, 7, 3); ctx.fillRect(x - 1, y - 3, 3, 7); } else ctx.fillRect(x - 2, y - 2, 5, 5);
      ctx.fillStyle = '#c7dcd0';
      if (d) { ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5); }
      else { ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x, y, 1, 1); }
    } else if (pr.pellet) {
      // дробь: яркая точка с коротким следом
      const x = Math.round(pr.x - cx), y = Math.round(pr.y - cy);
      ctx.fillStyle = '#f59e42'; ctx.fillRect(Math.round(x - pr.vx * 0.012), Math.round(y - pr.vy * 0.012), 1, 1);
      ctx.fillStyle = '#ffcd75'; ctx.fillRect(x, y, 2, 2);
    } else if (pr.type === 'arrow') {
      const sp = Math.hypot(pr.vx, pr.vy), nx = pr.vx / sp, ny = pr.vy / sp;
      const x = pr.x - cx, y = pr.y - cy;
      ctx.globalAlpha = 0.35;
      pxLine(ctx, x - nx * 16, y - ny * 16, x - nx * 6, y - ny * 6, '#f4f4f4'); // след
      ctx.globalAlpha = 1;
      if (pr.fire) {
        pxLine(ctx, x - nx * 10, y - ny * 10, x - nx * 5, y - ny * 5, '#b13e53');
        pxLine(ctx, x - nx * 6, y - ny * 6, x - nx * 2, y - ny * 2, '#f59e42');
      }
      pxLine(ctx, x - nx * 6, y - ny * 6, x, y, pr.fire ? '#ffcd75' : '#8b4a2b');
      ctx.fillStyle = '#b13e53'; ctx.fillRect(Math.round(x - nx * 6), Math.round(y - ny * 6), 1, 1);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    } else if (pr.type === 'bottle') {
      const h = Math.sin(Math.PI * Math.min(1, pr.t / pr.dur)) * 24;
      spr(ctx, 'bottle', pr.x, pr.y - h, Math.floor(pr.t * 12) % 2 === 0);
    } else drawExtraProj(ctx, R, pr, cx, cy);
  }
  // пули врагов
  for (const b of R.ebullets) {
    const s = b.big ? 4 : 3, x = Math.round(b.x - cx - s / 2), y = Math.round(b.y - cy - s / 2);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x - 1, y - 1, s + 2, s + 2);
    ctx.fillStyle = b.c; ctx.fillRect(x, y, s, s);
  }
  // эффекты
  for (const ef of R.effects) {
    if (ef.delay > 0) continue;
    const q = Math.min(1, ef.t / ef.dur);
    if (ef.type === 'ring') {
      ctx.globalAlpha = 1 - q * 0.6;
      pxCircle(ctx, ef.x - cx, ef.y - cy, ef.r, ef.c || '#e86a92');
      pxCircle(ctx, ef.x - cx, ef.y - cy, Math.max(1, ef.r - 1), ef.c || '#e86a92');
      pxCircle(ctx, ef.x - cx, ef.y - cy, Math.max(1, ef.r - 3), '#f4f4f4');
      ctx.globalAlpha *= 0.5;
      pxCircle(ctx, ef.x - cx, ef.y - cy, Math.max(1, ef.r - 7), ef.c || '#e86a92');
      ctx.globalAlpha = 1;
    } else if (ef.type === 'slash') {
      const span = 2.1, start = ef.a - span / 2, end = start + span * Math.min(1, q * 1.8);
      const cols = ['#f4f4f4', '#f4f4f4', '#c7dcd0', '#94b0c2', '#566c86'];
      ctx.globalAlpha = 1 - q * 0.7;
      for (let k = 0; k < cols.length; k++) {
        const rr = ef.r - k * 2, n = Math.floor(rr * span);
        ctx.fillStyle = cols[k];
        for (let i = 0; i <= n; i++) {
          const a = start + (end - start) * i / n;
          ctx.fillRect(Math.round(p.x - cx + Math.cos(a) * rr), Math.round(p.y - cy + Math.sin(a) * rr), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    } else if (ef.type === 'bolt') {
      ctx.globalAlpha = 1 - q * 0.5;
      for (let i = 1; i < ef.pts.length; i++) {
        const a = ef.pts[i - 1], b = ef.pts[i];
        pxLine(ctx, a[0] - cx + 1, a[1] - cy, b[0] - cx + 1, b[1] - cy, '#41a6f6');
        pxLine(ctx, a[0] - cx, a[1] - cy, b[0] - cx, b[1] - cy, i % 2 ? '#73eff7' : '#f4f4f4');
      }
      ctx.globalAlpha = 1;
    }
  }
  // частицы и числа
  for (const q of R.particles) {
    ctx.fillStyle = q.c;
    ctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.s, q.s);
  }
  for (const t of R.texts) drawNum(ctx, t.v, t.x - cx, t.y - cy, t.c, t.big ? 2 : 1);

  // вспышки экрана: урон (красная), новый уровень (белая), мало здоровья (пульс по краям)
  if (R.hurtFlash > 0) { ctx.fillStyle = 'rgba(177,62,83,' + (R.hurtFlash / 0.3 * 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (R.flashT > 0) { ctx.fillStyle = 'rgba(255,245,210,' + (R.flashT / 0.25 * 0.5).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (p.hp < p.maxHp * 0.3 && !R.ending) {
    ctx.fillStyle = 'rgba(177,62,83,' + (0.25 + Math.sin(R.t * 8) * 0.15).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H - 3, W, 3); ctx.fillRect(0, 3, 3, H - 6); ctx.fillRect(W - 3, 3, 3, H - 6);
  }

  if (R.storm > 0) { ctx.fillStyle = 'rgba(140,255,120,' + (0.06 + Math.sin(R.t * 9) * 0.02).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (R.gold > 0) { ctx.fillStyle = 'rgba(255,205,117,0.06)'; ctx.fillRect(0, 0, W, H); }
  // указатели на сундук и алтарь за краем экрана
  for (const k of R.pickups) {
    if (!k.static) continue;
    const sx = k.x - cx, sy = k.y - cy;
    if ((sx < 0 || sx > W || sy < 0 || sy > H) && Math.floor(R.t * 3) % 2) {
      const ax = clamp(sx, 8, W - 9), ay = clamp(sy, 8, H - 9);
      pxDisc(ctx, ax, ay, 3, '#1a1c2c');
      pxDisc(ctx, ax, ay, 2, k.type === 'chest' ? '#ffcd75' : '#e86a92');
    }
  }
  // указатель на босса за краем экрана
  const b = R.boss;
  if (b && !b.dead && Math.floor(R.t * 4) % 2) {
    const sx = b.x - cx, sy = b.y - cy;
    if (sx < 0 || sx > W || sy < 0 || sy > H) {
      const ax = clamp(sx, 8, W - 9), ay = clamp(sy, 8, H - 9);
      pxDisc(ctx, ax, ay, 4, '#f4f4f4');
      pxDisc(ctx, ax, ay, 3, '#b13e53');
    }
  }
}
