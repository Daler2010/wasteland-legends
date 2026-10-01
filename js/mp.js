// ===== Онлайн с друзьями: общий лагерь, режимы и синхронизация =====
// Хозяин лобби считает весь мир. Гости сами двигают своего героя и присылают положение и нажатия,
// а 15 раз в секунду получают «снимок» того, что видно на их экране, и рисуют его.
// В забеге героев несколько (R.pl); общий код игры работает «от лица» одного из них — MP.use(p) ставит R.p = p.

const MP_MAX = 4;
const MP_SNAP = 1 / 15, MP_SNAP_LEAN = 1 / 10, MP_SEND = 1 / 20;
// настройка «Онлайн-связь»: 0 — быстрая (минимум задержки), 1 — авто, 2 — слабый интернет (меньше данных, больше запас)
const MP_NET_EXTRA = [10, 35, 90]; // мс запаса в буфере плавности у гостя
const PVP_DMG = 0.25; // оружие рассчитано на орды — по героям оно бьёт слабее

const MP_MODES = {
  boss: { name: 'Все против босса', spr: 'h_cave', tint: '#ef3b5b', x: -112, y: -66, respawn: 10, teamLose: true,
    desc: 'Один огромный и злой босс на всех. Герои выходят уже прокачанными. Погибший встаёт через 10 секунд (каждый раз дольше). Погибли все разом — поражение.' },
  horde: { name: 'Орды', spr: 'h_portal', tint: '#f59e42', x: 0, y: -128, respawn: 10, teamLose: true,
    desc: 'Врагов очень, очень много — хоть и слабее обычного. Продержитесь 6 минут.' },
  coop: { name: 'Кооп-выживание', spr: 'h_portal', tint: '#a7f070', x: 112, y: -66, respawn: 10, teamLose: true,
    desc: 'Обычный забег, но вместе: 10 минут волн, затем босс локации. Опыт общий, улучшения у каждого свои.' },
  race: { name: 'Гонка за очками', spr: 'h_portal', tint: '#ffcd75', x: 112, y: 78, respawn: 5,
    desc: '5 минут на одной карте. Кто больше набьёт врагов — тот и победил. Элита +25, погибший встаёт через 5 секунд.' },
  defense: { name: 'Защита базы', spr: 'machine', tint: '#73eff7', x: 0, y: 138, respawn: 10,
    desc: 'Враги идут на генератор в центре. Отбейте 6 волн, в последней придёт босс. Генератор сломан — поражение.' },
  pvp: { name: 'PvP-арена', spr: 'h_portal', tint: '#c77dff', x: -112, y: 78, respawn: 0,
    desc: 'Каждый сам за себя. Герои прокачаны, кольцо арены сжимается. Останется один!' },
};
const MP_LOCS = () => LOCATIONS.map(l => l.id);
const POWER_NAMES = { 1: 'Слабая', 2: 'Средняя', 3: 'Максимум' };

const MP = {
  on: false, role: null, me: 0, roster: [], R: null, scene: null, rec: false,
  ev: null, sendAcc: 0, stateAcc: 0, uid: 0, ended: false, coinsTaken: false,

  // ================================================================ ОБЩЕЕ
  meP() { return this.R && this.R.pl.find(p => p.slot === this.me); },
  isHost() { return this.role === 'host'; },
  mode() { return MP_MODES[this.R && this.R.mp.mode] || null; },
  use(p) { this.R.p = p; },
  alive(R) { return R.pl.filter(p => !p.dead); },
  rosterOf(slot) { return this.roster.find(r => r.slot === slot); },
  // за кем следит камера погибшего: за первым живым товарищем
  spectate(p) {
    if (!p) return this.R.pl.find(q => !q.dead) || this.R.pl[0];
    if (!p.dead) return p;
    return this.R.pl.find(q => !q.dead && q !== p) || p;
  },
  nick() {
    const n = (Save.data.nick || '').trim();
    return n || 'Игрок' + (100 + Math.floor(Math.random() * 900));
  },
  // всё, что нужно хозяину, чтобы построить моего героя: характеристики уже с моей прокачкой и талантами
  profile(hero) {
    const ch = CHARACTERS.find(c => c.id === hero && Campaign.heroOpen(c.id)) || CHARACTERS[0];
    const T = createRun(ch.id, 'desert', {}), p = T.p, S = Campaign.s();
    const keys = ['baseSpeed', 'armorBase', 'regenBase', 'dmgBase', 'magnetBase', 'xpMul', 'critBase', 'cdTal', 'dashMul', 'ultCost', 'bossDmg', 'sprite'];
    const stats = { baseHp: p.baseHp + (S.hp || 0) };
    for (const k of keys) stats[k] = p[k];
    return { hero: ch.id, stats, wlvl: T.tal.wlvl || 0 };
  },
  myHero() {
    const d = Save.data, ch = CHARACTERS.find(c => c.id === d.hero);
    return ch && Campaign.heroOpen(ch.id) ? ch.id : 'daler';
  },

  // ---------- создание героя ----------
  makePlayer(R, r) {
    const ch = CHARACTERS.find(c => c.id === r.hero) || CHARACTERS[0];
    const p = createRun(ch.id, R.loc.id, {}).p;
    Object.assign(p, r.prof.stats);
    Object.assign(p, { slot: r.slot, name: r.name, ch, pending: 0, offer: null, offerSeq: 0, dmgBy: {}, choice: false, tal: { wlvl: r.prof.wlvl },
      dead: false, deaths: 0, respawnT: 0, score: 0, kills: 0, fx: [], dmgTaken: 0, tpSeq: 0, net: null, ultQ: false, W: 320, H: 180 });
    const keep = R.p, run = Game.run;
    Game.run = R; R.p = p; p.weapons = []; // addWeapon и recalcStats работают с Game.run.p
    addWeapon(ch.weapon);
    if (r.prof.wlvl) p.weapons[0].lvl = 2;
    recalcStats();
    p.hp = p.maxHp;
    R.p = keep; Game.run = run;
    return p;
  },

  // Забег с несколькими героями. Поля, которые в одиночной игре лежат в R, здесь у каждого героя свои
  makeRun(mode, locId, cfg) {
    const loc = locId === 'mplobby' ? this.lobbyLoc() : LOCATIONS.find(l => l.id === locId);
    const R = createRun('daler', loc.id === 'mplobby' ? 'desert' : loc.id, {});
    R.loc = loc;
    R.mp = { mode, cfg: cfg || {}, tombs: [] };
    for (const [k, f] of [['ch', 'ch'], ['tal', 'tal'], ['pendingLevels', 'pending'], ['dmgBy', 'dmgBy'], ['choice', 'choice']]) {
      Object.defineProperty(R, k, { get() { return R.p[f]; }, set(v) { R.p[f] = v; }, configurable: true });
    }
    return R;
  },

  // ---------- запись событий хозяина для гостей ----------
  newEv() { return { sfx: new Set(), ban: [], mus: null, shake: 0 }; },
  quiet(fn) { const r = this.rec; this.rec = false; try { fn(); } finally { this.rec = r; } },

  // ================================================================ ЛАГЕРЬ ДРУЗЕЙ
  lobbyLoc() {
    if (this.LL) return this.LL;
    const L = this.LL = Object.assign(Object.create(Hub.loc), {
      id: 'mplobby', tiles: 'hub', lobby: true, name: 'Лагерь друзей', music: 'japan', decor: [], density: 0, seed: 91, weather: null,
      weights: { zombie: 1, rat: 1 }, ambient: { dark: 0.1, color: '#0a1020', tint: 'rgba(255,230,170,0.05)', fx: 'fireflies' } });
    DUST.mplobby = DUST.hub;
    // постройки и деревья
    const rnd = mulberry32(777), props = [], add = (name, x, y, s) => { const d = { name, x: Math.round(x), y: Math.round(y), s: s || 1, flip: rnd() < 0.5 }; props.push(d); return d; };
    this.fire = add('h_fire0', 0, 6);
    add('stump', -24, 22); add('stump', 26, 20);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.39; add('lantern', Math.cos(a) * 66, 8 + Math.sin(a) * 60); }
    for (const id in MP_MODES) { const M = MP_MODES[id]; M.decor = add(M.spr, M.x, M.y, M.spr === 'machine' ? 1.6 : 1); }
    for (let i = 0; i < 64; i++) {
      const a = i / 64 * Math.PI * 2, r = 222 + rnd() * 26;
      add(rnd() < 0.25 ? 'sakura' : 'h_tree', Math.cos(a) * r, Math.sin(a) * r * 0.92);
    }
    for (let k = 0; k < 40; k++) {
      const a = rnd() * Math.PI * 2, r = 150 + rnd() * 60, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.92;
      if (Object.values(MP_MODES).some(M => Math.hypot(M.x - x, M.y - y) < 46)) continue;
      add(pick(['h_bush', 'h_flowers', 'h_flowers', 'rock', 'mushroom']), x, y);
    }
    this.lobbyProps = props;
    this.lobbyChunks = new Map();
    // мощёная площадь у костра и дорожки к порталам
    this.paved = new Set();
    const pave = (x, y, r) => {
      for (let ty = Math.floor((y - r) / 16); ty <= Math.floor((y + r) / 16); ty++) for (let tx = Math.floor((x - r) / 16); tx <= Math.floor((x + r) / 16); tx++) {
        if (Math.hypot(tx * 16 + 8 - x, ty * 16 + 8 - y) <= r) this.paved.add(tx + ',' + ty);
      }
    };
    pave(0, 8, 56);
    for (const id in MP_MODES) {
      const M = MP_MODES[id], n = Math.ceil(Math.hypot(M.x, M.y) / 10);
      for (let i = 0; i <= n; i++) pave(M.x * i / n, M.y * i / n + 8, 12);
      pave(M.x, M.y + 6, 26);
    }
    return L;
  },
  lobbyChunk(i, j) {
    const key = i + ',' + j;
    let arr = this.lobbyChunks.get(key);
    if (arr) return arr;
    arr = this.lobbyProps.filter(d => Math.floor(d.x / CHUNK) === i && Math.floor(d.y / CHUNK) === j);
    arr.solids = [];
    for (const d of arr) { const s = SOLID[d.name]; if (s) arr.solids.push({ x: d.x, y: d.y - s[1], hw: s[0] * d.s, hd: s[1] }); }
    const rnd = mulberry32(hashInt(i, j, 4242)), L = this.LL;
    arr.small = [];
    for (let k = 0, n = 5 + Math.floor(rnd() * 5); k < n; k++) {
      arr.small.push({ name: L.details[Math.floor(rnd() * L.details.length)], x: i * CHUNK + rnd() * CHUNK, y: j * CHUNK + rnd() * CHUNK, flip: rnd() < 0.5 });
    }
    this.lobbyChunks.set(key, arr);
    return arr;
  },
  // ближайшая постройка лагеря
  nearZone(p) {
    if (!p || p.dead) return null;
    if (Math.hypot(p.x, p.y - 6) < 26) return 'hero';
    for (const id in MP_MODES) { const M = MP_MODES[id]; if (Math.hypot(M.x - p.x, M.y + 4 - p.y) < 30) return id; }
    return null;
  },
  // в лагере нельзя уйти за деревья
  clampLobby(p) {
    const d = Math.hypot(p.x, p.y);
    if (d > 205) { p.x *= 205 / d; p.y *= 205 / d; }
  },

  // ================================================================ ХОЗЯИН
  async host() {
    this.status('Создаю лобби...');
    let code;
    try { code = await Net.host(MP_MAX); } catch (e) { this.status(e.message, true); return; }
    this.on = true; this.role = 'host'; this.me = 0; this.code = code;
    this.roster = [{ slot: 0, name: this.nick(), hero: this.myHero(), prof: this.profile(this.myHero()) }];
    Net.on({ msg: (s, m) => this.hostMsg(s, m), join: () => {}, leave: s => this.dropSlot(s) });
    this.startScene('lobby', 'lobby', 'mplobby', {});
  },

  hostMsg(slot, m) {
    const R = this.R, p = R && R.pl.find(q => q.slot === slot);
    switch (m.k) {
      case 'hi': {
        if (this.rosterOf(slot)) return;
        const r = { slot, name: String(m.name || 'Гость').slice(0, 14), hero: m.prof.hero, prof: m.prof };
        this.roster.push(r);
        Net.send(slot, { k: 'hi', slot, code: this.code });
        if (this.scene === 'lobby') this.addToRun(r);
        this.sendStart(slot);
        this.sendRoster();
        UI.banner(r.name + ' в лагере!', 2);
        Sound.sfx('coin');
        break;
      }
      case 'st': if (p) { p.net = m; p.W = m.W || 320; p.H = m.H || 180; p.nm = m.nm; } break;
      case 'pg': {
        Net.send(slot, { k: 'po', t: m.t });
        const r = this.rosterOf(slot);
        if (r && m.r && r.ping !== m.r) { r.ping = m.r; if (this.scene === 'lobby') this.rosterUI(); }
        break;
      }
      case 'ult': if (p) p.ultQ = true; break;
      case 'pick': if (p) this.pick(p, m.i, m.s); break;
      case 'hero': {
        const r = this.rosterOf(slot);
        if (!r || this.scene !== 'lobby') return;
        r.hero = m.prof.hero; r.prof = m.prof;
        this.swapHero(r);
        this.sendRoster();
        break;
      }
      case 'bye': Net.kick(slot); this.dropSlot(slot); break;
    }
  },
  addToRun(r) {
    const R = this.R, p = this.makePlayer(R, r);
    const a = r.slot * 1.6;
    p.x = Math.cos(a) * 34; p.y = 10 + Math.sin(a) * 26;
    R.pl.push(p);
    return p;
  },
  swapHero(r) {
    const R = this.R, old = R.pl.find(q => q.slot === r.slot);
    const p = this.makePlayer(R, r);
    if (old) { p.x = old.x; p.y = old.y; p.tpSeq = old.tpSeq; p.net = old.net; R.pl[R.pl.indexOf(old)] = p; }
    else R.pl.push(p);
    if (r.slot === this.me) { R.p = p; Save.data.hero = r.hero; Save.store(); }
  },
  dropSlot(slot) {
    const r = this.rosterOf(slot);
    if (!r) return;
    this.roster = this.roster.filter(x => x !== r);
    const R = this.R;
    if (R) {
      const p = R.pl.find(q => q.slot === slot);
      if (p) {
        R.pl = R.pl.filter(q => q !== p);
        if (p.av) p.av.dead = true;
        if (this.scene === 'game' && !R.ending) this.checkEnd();
      }
    }
    UI.banner(r.name + ' ушёл', 2);
    this.sendRoster();
  },
  sendRoster() {
    const list = this.roster.map(r => ({ slot: r.slot, name: r.name, hero: r.hero, sprite: r.prof.stats.sprite }));
    Net.bcast({ k: 'ros', list });
    this.rosterUI();
  },
  startPayload() {
    const R = this.R;
    return { k: 'start', sc: this.scene, mode: R.mp.mode, cfg: R.mp.cfg, loc: R.loc.id, t: R.t, mus: this.music || '',
      pl: R.pl.map(p => [p.slot, Math.round(p.x), Math.round(p.y), p.tpSeq]),
      ros: this.roster.map(r => ({ slot: r.slot, name: r.name, hero: r.hero, sprite: r.prof.stats.sprite })) };
  },
  sendStart(slot) { const m = this.startPayload(); if (slot === undefined) Net.bcast(m); else Net.send(slot, m); },

  // Новая сцена у хозяина: лагерь или забег выбранного режима
  startScene(scene, mode, locId, cfg) {
    const R = this.R = this.makeRun(mode, locId, cfg);
    this.scene = scene; this.ended = false; this.coinsTaken = false; this.specKp = {};
    R.pl = [];
    for (const r of this.roster) this.addToRun(r);
    const n = R.pl.length;
    R.pl.forEach((p, i) => {
      const a = i / Math.max(1, n) * Math.PI * 2 + 0.6, rad = mode === 'pvp' ? 150 : scene === 'lobby' ? 34 : 26;
      p.x = Math.cos(a) * rad; p.y = (scene === 'lobby' ? 10 : 0) + Math.sin(a) * rad * (scene === 'lobby' ? 0.75 : 1);
      if (scene !== 'lobby') resolveSolids(R.loc, p, 4, 8);
      p.tpSeq = 1;
    });
    R.p = this.meP() || R.pl[0];
    R.cx = R.p.x; R.cy = R.p.y;
    this.ev = this.newEv();
    Game.run = R;
    if (scene === 'game') MP_MODE_LOGIC[mode].init(R, R.mp.cfg);
    this.music = scene === 'lobby' ? 'japan' : R.loc.music;
    this.rec = true;
    Sound.resume(); Sound.startMusic(this.music);
    if (scene === 'game') UI.banner(MP_MODES[mode].name.toUpperCase(), 2.5);
    this.enter();
    this.sendStart();
    this.sendRoster();
  },

  startGame(mode, cfg) {
    if (!this.isHost() || this.scene !== 'lobby') return;
    const loc = mode === 'boss' ? MP_MODE_LOGIC.boss.arena(cfg.boss) : mode === 'pvp' ? 'gates' : cfg.loc || 'desert';
    this.startScene('game', mode, loc, cfg);
  },
  toLobby() { if (this.isHost()) this.startScene('lobby', 'lobby', 'mplobby', {}); },

  // ---------- шаг мира у хозяина ----------
  hostTick(dt) {
    const R = this.R, me = this.meP(), M = MP_MODE_LOGIC[R.mp.mode];
    if (this.scene === 'end') { updateParticles(R, dt); updateTexts(R, dt); return; }
    if (R.ending) {
      R.endT -= dt;
      updateParticles(R, dt); updateTexts(R, dt);
      R.shake = Math.max(0, R.shake - dt * 10);
      if (R.endT <= 0 && !this.ended) this.finish();
      return;
    }
    R.t += dt;
    const wantW = R.loc.weather && R.t % 95 > 62 ? 1 : 0;
    R.weatherW += (wantW - R.weatherW) * Math.min(1, dt * 0.6);
    R.flashT -= dt; R.hurtFlash -= dt; R.hitstop = 0;
    if (R.combo > 0 && (R.comboT -= dt) <= 0) R.combo = 0;
    for (const g of R.ghosts) g.life -= dt;
    R.ghosts = R.ghosts.filter(g => g.life > 0);
    for (const d of R.deaths) d.t += dt;
    R.deaths = R.deaths.filter(d => d.t < 0.18);
    if (this.fire) this.fire.name = 'h_fire' + (Math.floor(R.t * 8) % 2);
    const fight = this.scene === 'game';

    for (const p of R.pl) {
      if (p.dead) { if (p.respawnT > 0 && (p.respawnT -= dt) <= 0) this.respawn(p); continue; }
      this.use(p);
      if (p === me) {
        const ng = R.ghosts.length;
        updatePlayer(R, dt);
        for (let i = ng; i < R.ghosts.length; i++) R.ghosts[i].slot = p.slot;
      } else this.remoteMove(p, dt);
      if (!fight) { this.clampLobby(p); p.ultQ = false; if (p === me) Input.ultQ = false; continue; }
      p.ultCd -= dt;
      const want = p === me ? Input.ultQ : p.ultQ;
      if (p === me) Input.ultQ = false;
      p.ultQ = false;
      if (want) this.tagged(R, p, 'ult', () => castUlt(R));
      this.tagged(R, p, 'ult', () => updateRam(R, dt));
      for (const w of p.weapons) this.tagged(R, p, w.id, () => WEAPON_LOGIC[w.id].update(w, dt, R));
      if (p.offer) { if ((p.offerT -= dt) <= 0) this.pick(p, 0, p.offerSeq); }
      else if (p.pending > 0) this.offer(p);
    }
    if (fight) {
      M.tick(R, dt);
      this.enemiesStep(R, dt);
      this.projStep(R, dt);
      this.effectsStep(R, dt);
      this.pickupsStep(R, dt);
    }
    updateParticles(R, dt);
    updateTexts(R, dt);
    R.enemies = R.enemies.filter(e => !e.dead || e.pvp);
    R.shake = Math.max(0, R.shake - dt * 10);
    // камера — за своим героем (или за товарищем, пока сам лежишь)
    const view = this.spectate(me);
    if (view) { this.use(view); updateCamera(R, dt); }
    this.use(me || R.pl[0]);
    const want = clamp(R.enemies.length / 110 + (fight ? 0.25 : 0), 0, 1);
    Sound.intensity += (want - Sound.intensity) * Math.min(1, dt * 0.8);
    this.ev.shake = Math.max(this.ev.shake, R.shake);
  },

  // источник урона (для статистики) и хозяин снаряда — чтобы снаряд бил «от его лица»
  tagged(R, p, src, fn) {
    const np = R.projs.length, ne = R.effects.length;
    const all = R.enemies;
    if (R.mp.mode === 'pvp') R.enemies = all.filter(e => e.pvp !== p);
    R.src = src;
    fn();
    R.src = null;
    if (R.mp.mode === 'pvp') R.enemies = all;
    for (let i = np; i < R.projs.length; i++) { R.projs[i].src = src; R.projs[i].owner = p; }
    for (let i = ne; i < R.effects.length; i++) { const ef = R.effects[i]; ef.src = src; ef.owner = p; if (ef.type === 'slash') ef.o = p; }
  },

  // положение гостя: его присылает он сам, хозяин лишь сглаживает
  remoteMove(p, dt) {
    const n = p.net;
    p.anim += dt; p.invT -= dt; p.flash -= dt; p.atkT -= dt; p.turnT -= dt; p.stretchT -= dt; p.squashT -= dt; p.dashCd -= dt;
    if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    if (!n || n.tq !== p.tpSeq) { p.vx = p.vy = 0; return; } // гость ещё не принял телепорт
    const px0 = p.x, py0 = p.y, k = 1 - Math.exp(-dt * 18);
    if (Math.hypot(n.x - p.x, n.y - p.y) > 120) { p.x = n.x; p.y = n.y; }
    else { p.x += (n.x - p.x) * k; p.y += (n.y - p.y) * k; }
    if (n.f !== p.face) { p.face = n.f; p.turnT = 0.12; }
    p.dirX = n.dx; p.dirY = n.dy; p.moving = !!n.mv; p.mvx = n.vx; p.mvy = n.vy;
    if (n.d > 0 && p.dashT <= 0) { p.ghostT = 0; }
    p.dashT = n.d > 0 ? Math.max(p.dashT, 0.01) : 0;
    if (p.dashT > 0 && (p.ghostT -= dt) <= 0) { p.ghostT = 0.025; R_ghost(this.R, p); }
    if (dt > 0) { p.vx += ((p.x - px0) / dt - p.vx) * 0.3; p.vy += ((p.y - py0) / dt - p.vy) * 0.3; }
  },

  teleport(p, x, y) {
    p.x = x; p.y = y; p.tpSeq++;
    if (p.slot !== this.me) p.fx.push(['tp', Math.round(x), Math.round(y), p.tpSeq]);
  },
  personal(p, kind, a, b) {
    if (p.slot === this.me) this.applyFx(p, [kind, a, b]);
    else p.fx.push([kind, a, b]);
  },

  // ---------- урон по героям ----------
  hurt(R, p, dmg) {
    if (!p || R.ending || this.scene !== 'game') return;
    if (p.isBase) {
      if (p.invT > 0) return;
      p.hp -= dmg; p.invT = 0.15; p.flash = 0.1;
      if (p.hp <= 0) { p.hp = 0; this.lose('Генератор уничтожен'); }
      return;
    }
    if (p.dead || p.invT > 0 || p.dashT > 0 || p.ramT > 0 || p.offer) return;
    if (p.dodge > 0 && Math.random() < p.dodge) { p.invT = 0.3; burst(R, p.x, p.y, 5, '#c7dcd0'); return; }
    dmg = Math.max(1, Math.round(dmg - p.armor));
    this.damage(R, p, dmg, null);
  },
  damage(R, p, dmg, killer) {
    p.hp -= dmg; p.dmgTaken += dmg;
    p.invT = killer ? 0.3 : 0.4; p.flash = 0.12;
    burst(R, p.x, p.y, 6, '#b13e53');
    addText(R, p.x, p.y - 12, dmg, '#ff5a5a');
    this.personal(p, 'hurt');
    if (p.hp <= 0) this.die(p, killer);
  },
  die(p, killer) {
    const R = this.R, M = this.mode();
    p.hp = 0; p.dead = true; p.deaths++; p.offer = null; p.dashT = 0; p.ramT = 0;
    if (p.av) p.av.dead = true;
    burst(R, p.x, p.y, 30, '#f4f4f4'); burst(R, p.x, p.y, 20, '#b13e53');
    R.mp.tombs.push({ slot: p.slot, x: Math.round(p.x), y: Math.round(p.y + 12) });
    p.respawnT = M.respawn ? M.respawn + (R.mp.mode === 'race' ? 0 : 5 * (p.deaths - 1)) : 0;
    UI.banner(killer ? killer.name + ' победил ' + p.name + '!' : p.name + ' пал!', 1.8);
    this.personal(p, 'dead');
    if (killer) killer.score += 1;
    this.checkEnd();
  },
  respawn(p) {
    const R = this.R, mates = R.pl.filter(q => !q.dead && q !== p);
    const a = mates.length ? pick(mates) : R.mp.base || { x: 0, y: 0 };
    const o = { x: a.x + rand(-28, 28), y: a.y + rand(-18, 18) };
    resolveSolids(R.loc, o, 4, 8);
    p.dead = false; p.hp = Math.ceil(p.maxHp * 0.6); p.invT = 3; p.mvx = p.mvy = 0;
    this.teleport(p, o.x, o.y);
    R.mp.tombs = R.mp.tombs.filter(t => t.slot !== p.slot);
    R.effects.push({ type: 'ring', x: p.x, y: p.y, r: 4, maxR: 70, t: 0, dur: 0.4, dmg: 20, kb: 260, c: '#ffcd75', hit: new Set(), owner: p });
    burst(R, p.x, p.y, 24, '#ffcd75');
    UI.banner(p.name + ' снова в строю!', 1.5);
    Sound.sfx('levelup');
  },
  checkEnd() {
    const R = this.R, M = this.mode();
    if (!R || R.ending || this.scene !== 'game') return;
    const alive = this.alive(R);
    if (R.mp.mode === 'pvp') {
      if (alive.length <= 1) this.win(alive[0] ? alive[0].name + ' — ЧЕМПИОН АРЕНЫ!' : 'НИЧЬЯ', alive[0]);
    } else if (M.teamLose && !alive.length) this.lose('Отряд пал');
  },
  win(title, winner) {
    const R = this.R;
    R.won = true; R.ending = true; R.endT = 2.5; R.mp.title = title; R.mp.winner = winner ? winner.slot : -1;
    for (const o of R.enemies) if (!o.dead && !o.pvp) { o.dead = true; burst(R, o.x, o.y, 5, o.def.color); }
    Sound.stopMusic(); Sound.sfx('win');
    UI.banner(title, 2.5);
  },
  lose(title) {
    const R = this.R;
    R.won = false; R.ending = true; R.endT = 2; R.mp.title = title;
    Sound.stopMusic(); Sound.sfx('lose');
    UI.banner(title, 2.5);
  },

  // ---------- новый уровень: у каждого свой выбор, игра не останавливается ----------
  offer(p) {
    this.use(p);
    p.offer = levelOptions(this.R); p.offerKind = 'lvl'; p.offerT = 12; p.offerSeq++;
    this.personal(p, 'lvl');
  },
  pick(p, i, seq) {
    if (!p.offer || seq !== p.offerSeq) return;
    const R = this.R, o = p.offer[i] || p.offer[0], kind = p.offerKind;
    this.use(p);
    applyOption(R, o);
    p.offer = null;
    if (kind === 'lvl') {
      p.pending--;
      R.effects.push({ type: 'ring', x: p.x, y: p.y, r: 4, maxR: 80, t: 0, dur: 0.4, dmg: 12, kb: 260, c: '#ffcd75', hit: new Set(), owner: p });
      burst(R, p.x, p.y, 24, '#ffcd75');
    }
    this.use(this.meP() || p);
  },

  // ---------- враги: каждый идёт на ближайшего героя ----------
  enemiesStep(R, dt) {
    const alive = this.alive(R), base = R.mp.base;
    if (!alive.length && !base) return;
    const groups = new Map(), avs = [];
    for (const e of R.enemies) {
      if (e.pvp) { avs.push(e); continue; }
      if (e.dead) continue;
      let t = e.tgtP;
      if (!t || t.dead || (e.tgtT -= dt) <= 0) {
        t = null; let bd = 1e12;
        for (const p of alive) { const d = dist2(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; t = p; } }
        // защита базы: враги идут на генератор, а на героя отвлекаются, только если он совсем рядом
        if (base && (!t || bd > 75 * 75)) t = base;
        e.tgtP = t; e.tgtT = 0.8 + Math.random() * 0.8;
      }
      let g = groups.get(t);
      if (!g) groups.set(t, g = []);
      g.push(e);
    }
    const out = [];
    for (const [p, list] of groups) {
      this.use(p);
      R.enemies = list;
      updateEnemies(R, dt);
      for (const e of R.enemies) out.push(e);
    }
    R.enemies = out.concat(avs);
  },

  projStep(R, dt) {
    const eb = R.ebullets, all = R.projs, groups = new Map();
    R.ebullets = [];
    for (const pr of all) {
      const o = pr.owner && R.pl.includes(pr.owner) ? pr.owner : null;
      if (!o) continue; // хозяин снаряда ушёл из игры
      let g = groups.get(o);
      if (!g) groups.set(o, g = []);
      g.push(pr);
    }
    const out = [], enemies = R.enemies;
    for (const [p, list] of groups) {
      this.use(p);
      R.projs = list;
      if (R.mp.mode === 'pvp') R.enemies = enemies.filter(e => e.pvp !== p);
      updateProjectiles(R, dt);
      R.enemies = enemies;
      for (const pr of R.projs) out.push(pr);
    }
    R.projs = out;
    // пули врагов бьют любого героя и генератор
    const targets = this.alive(R);
    if (R.mp.base) targets.push(R.mp.base);
    for (const b of eb) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (solidAt(R.loc, b.x, b.y + 6)) { b.life = 0; burst(R, b.x, b.y, 3, b.c); continue; }
      for (const p of targets) {
        const rr = p.r + (b.big ? 3 : 2) + (p.isBase ? 8 : 0);
        if (dist2(b.x, b.y, p.x, p.y) < rr * rr) { this.use(p); hurtPlayer(R, b.dmg); b.life = 0; break; }
      }
    }
    R.ebullets = eb.concat(R.ebullets).filter(b => b.life > 0);
  },

  effectsStep(R, dt) {
    const all = R.effects, groups = new Map(), loose = [];
    for (const ef of all) {
      const o = ef.owner && R.pl.includes(ef.owner) ? ef.owner : null;
      if (!o) { loose.push(ef); continue; }
      let g = groups.get(o);
      if (!g) groups.set(o, g = []);
      g.push(ef);
    }
    const out = [], enemies = R.enemies;
    for (const [p, list] of groups) {
      this.use(p);
      R.effects = list;
      if (R.mp.mode === 'pvp') R.enemies = enemies.filter(e => e.pvp !== p);
      updateEffects(R, dt);
      R.enemies = enemies;
      for (const ef of R.effects) out.push(ef);
    }
    // «ничьи» эффекты (буря, удары босса, взрывы) — от лица первого живого
    const any = this.alive(R)[0] || R.pl[0];
    if (loose.length && any) { this.use(any); R.effects = loose; updateEffects(R, dt); for (const ef of R.effects) out.push(ef); }
    R.effects = out;
  },

  pickupsStep(R, dt) {
    const alive = this.alive(R);
    if (!alive.length) return;
    for (const k of R.pickups) {
      if (k.done) continue;
      if (k.static) {
        for (const p of alive) if (dist2(p.x, p.y, k.x, k.y) < 196) { this.use(p); collect(R, k); break; }
        continue;
      }
      let t = k.magP;
      if (t && (t.dead || !R.pl.includes(t))) t = k.magP = null;
      if (!t) {
        for (const p of alive) { const r = k.type === 'heart' ? 16 : p.magnet; if (dist2(p.x, p.y, k.x, k.y) < r * r) { t = p; break; } }
        if (!t && k.mag) { let bd = 1e12; for (const p of alive) { const d = dist2(p.x, p.y, k.x, k.y); if (d < bd) { bd = d; t = p; } } }
        k.magP = t;
      }
      if (!t) continue;
      k.mag = true;
      const dx = t.x - k.x, dy = t.y - k.y, d = Math.hypot(dx, dy) || 1;
      k.spd = Math.min(280, (k.spd || 30) + 500 * dt);
      k.x += dx / d * k.spd * dt; k.y += dy / d * k.spd * dt;
      if (d < 6) { this.use(t); collect(R, k); }
    }
    R.pickups = R.pickups.filter(k => !k.done);
  },

  // ---------- PvP: удар по чужому «аватару» превращается в урон по герою ----------
  pvpHit(R, av, dmg, kx, ky, kb) {
    const A = R.p, V = av.pvp;
    if (!A || A === V || V.dead || V.invT > 0 || V.dashT > 0 || V.ramT > 0 || R.ending) return;
    if (V.dodge > 0 && Math.random() < V.dodge) { V.invT = 0.25; return; }
    const crit = Math.random() < A.crit;
    const d = Math.max(1, Math.round(dmg * A.dmgMul * (crit ? 2 : 1) * PVP_DMG - V.armor));
    const key = R.src || 'other';
    A.dmgBy[key] = (A.dmgBy[key] || 0) + Math.min(d, V.hp);
    if (kb) { const l = Math.hypot(kx, ky) || 1; this.personal(V, 'kb', kx / l * kb * 0.6, ky / l * kb * 0.6); }
    this.damage(R, V, d, A);
  },

  // ---------- снимок мира для одного гостя ----------
  snapFor(p) {
    const R = this.R, v = this.spectate(p) || p, W = p.W || 320, H = p.H || 180;
    const cx = v.x, cy = v.y, hw = W / 2 + 50, hh = H / 2 + 50;
    const inV = (x, y, m) => Math.abs(x - cx) < hw + (m || 0) && Math.abs(y - cy) < hh + (m || 0);
    const r1 = x => Math.round(x), r2 = x => Math.round(x * 100) / 100;
    const s = { k: 's', t: r2(R.t), ts: Math.round(performance.now()) };
    const lean = !!p.lean, ke = p.ke || (p.ke = new Map()), kn = new Map();
    if (lean) s.ln = 1;
    // раз в 2 секунды шлём врагов целиком — на случай, если гость что-то упустил
    if ((p.snapN = (p.snapN || 0) + 1) % 30 === 0) ke.clear();
    s.P = R.pl.map(q => {
      let fl = 0;
      if (q.invT > 0) fl |= 1; if (q.flash > 0) fl |= 2; if (q.dead) fl |= 4; if (q.offer) fl |= 8; if (q.dashT > 0) fl |= 16;
      if (q.squashT > 0) fl |= 32; if (q.ramT > 0) fl |= 64;
      const saw = q.weapons.find(w => w.id === 'saws');
      return [q.slot, r1(q.x), r1(q.y), q.face, r2(q.dirX), r2(q.dirY), r1(q.mvx), r1(q.mvy), fl, Math.ceil(q.hp), q.maxHp,
        Math.ceil(q.respawnT), q.level, r2(Math.max(0, q.atkT)), r2(q.aim || 0), saw ? [r2(saw.ang), saw.lvl, saw.evo ? 1 : 0] : 0, q.score, q.kills, r2(q.ramT)];
    });
    s.E = [];
    for (const e of R.enemies) {
      if (e.dead || e.pvp || !(e.boss || inV(e.x, e.y, 40 * (e.sc || 1)))) continue;
      if (!e.id) e.id = ++this.uid;
      let fl = 0;
      if (e.flash > 0) fl |= 1; if (e.atkT > 0) fl |= 2; if (e.elite) fl |= 4; if (e.enraged) fl |= 8; if (e.stunT > 0) fl |= 16;
      if (e.mv) fl |= 32; if (e.lst === 1) fl |= 64; if (e.lst === 2) fl |= 128; if (e.fuse > 0) fl |= 256; if (e.tele > 0) fl |= 512;
      if (e.dash > 0) fl |= 1024; if (e.spawnT > 0) fl |= 2048; if (e.squash > 0) fl |= 4096; if (e.face < 0) fl |= 8192;
      const hpp = Math.ceil(Math.max(0, e.hp) / e.maxHp * 100), sc10 = Math.round(e.sc * 10);
      // знакомый гостю враг — только положение, флаги и здоровье
      if (ke.get(e.id) === sc10) s.E.push([e.id, r1(e.x), r1(e.y), fl, hpp]);
      else s.E.push([e.id, MP_TYPES.indexOf(e.boss ? '#' + bossId(e) : e.type), r1(e.x), r1(e.y), fl, hpp, sc10, Math.round(e.anim * 10) % 1000]);
      kn.set(e.id, sc10);
    }
    p.ke = kn;
    s.B = [];
    for (const b of R.ebullets) if (inV(b.x, b.y, 20)) s.B.push([r1(b.x), r1(b.y), r1(b.vx), r1(b.vy), b.big ? 1 : 0, b.c]);
    s.J = [];
    for (const pr of R.projs) {
      if (!inV(pr.x, pr.y, 30)) continue;
      if (!pr.id) pr.id = ++this.uid;
      const code = pr.type === 'arrow' ? (pr.star ? 1 : pr.pellet ? 2 : 0) : MP_PROJ.indexOf(pr.type);
      const fl = (pr.fire ? 1 : 0) | (pr.big ? 2 : 0) | (pr.arm > 0 ? 4 : 0);
      s.J.push([pr.id, code, r1(pr.x), r1(pr.y), r1(pr.vx || 0), r1(pr.vy || 0), fl, pr.type === 'bottle' ? r2(pr.t / pr.dur) : 0]);
    }
    s.F = [];
    for (const ef of R.effects) {
      if (ef.delay > 0) continue;
      const q = r2(Math.min(1, ef.t / ef.dur));
      if (ef.type === 'ring') { if (inV(ef.x, ef.y, ef.r)) s.F.push([0, r1(ef.x), r1(ef.y), r1(ef.r), q, ef.c || '']); }
      else if (ef.type === 'slash') { const o = ef.o || ef.owner; if (o && inV(o.x, o.y, 40)) s.F.push([1, o.slot, r2(ef.a), r1(ef.r), q]); }
      else if (ef.type === 'bolt') { const a = ef.pts[0]; if (inV(a[0], a[1], 150)) s.F.push([2, ef.pts.map(pt => [r1(pt[0]), r1(pt[1])]), q]); }
      else if (ef.type === 'fire') { if (inV(ef.x, ef.y, ef.r)) s.F.push([3, r1(ef.x), r1(ef.y), r1(ef.r), r2(ef.t), ef.dur]); }
      else if (ef.type === 'hazard') { if (inV(ef.x, ef.y, ef.r)) s.F.push([4, r1(ef.x), r1(ef.y), ef.r, q]); }
    }
    // предметы на земле почти не двигаются — шлём только изменения: новые, летящие к герою и исчезнувшие
    const kp = p.kp || (p.kp = new Map()), vis = new Set();
    s.Kn = []; s.Km = []; s.Kd = [];
    for (const k of R.pickups) {
      if (k.done || (!k.static && !inV(k.x, k.y, 10))) continue;
      if (!k.id) k.id = ++this.uid;
      vis.add(k.id);
      if (!kp.has(k.id)) { const c = MP_PICK.indexOf(k.spr); s.Kn.push([k.id, c >= 0 ? c : k.spr, r1(k.x), r1(k.y), (k.static ? 1 : 0) | (k.mag ? 2 : 0)]); kp.set(k.id, k.spr); }
      else if (k.mag || k.static) { s.Km.push(k.id, r1(k.x), r1(k.y)); if (k.static && kp.get(k.id) !== k.spr) { s.Kd.push(k.id); kp.delete(k.id); } }
    }
    for (const id of kp.keys()) if (!vis.has(id)) { s.Kd.push(id); kp.delete(id); }
    // новые частицы, цифры урона, смерти врагов и тени рывков — только то, что в кадре
    s.Q = []; s.T = []; s.D = []; s.G = [];
    const maxQ = lean ? 12 : 60, maxT = lean ? 10 : 25;
    for (const q of R.particles) if (!q.s_ && s.Q.length < maxQ && inV(q.x, q.y)) s.Q.push([r1(q.x), r1(q.y), r1(q.vx), r1(q.vy), r2(q.life), q.c, q.s, q.g === undefined ? 160 : q.g]);
    for (const t of R.texts) if (!t.s_ && s.T.length < maxT && inV(t.x, t.y)) s.T.push([r1(t.x), r1(t.y), t.v, t.c, t.big ? 1 : 0]);
    const deaths = (p.dAcc || []).concat(R.deaths.filter(d => !d.s_));
    p.dAcc = [];
    for (const d of deaths) if (inV(d.x, d.y, 30)) s.D.push([d.sprite, r1(d.x), r1(d.y), d.face, r2(d.sc), r2(d.ds)]);
    if (!lean) for (const g of R.ghosts) if (!g.s_ && g.slot !== p.slot && inV(g.x, g.y)) s.G.push([g.name, r1(g.x), r1(g.y), g.flip ? 1 : 0, r2(g.life)]);
    // свой герой: прокачка, выбор улучшения и личные события
    const ev = this.ev;
    s.me = { sp: r2(p.speed), xp: r2(p.xp), xn: p.xpNext, u: r2(p.ult), uc: p.ultCost, ucd: r2(p.ultCd), w: p.weapons.map(w => [w.id, w.lvl, w.evo ? 1 : 0]), ps: p.passives,
      o: p.offer ? { s: p.offerSeq, l: p.offer, k: p.offerKind } : null, fx: p.fx, dm: r2(p.dashMul), mg: r1(p.magnet) };
    p.fx = [];
    s.H = this.hud(R, p);
    const acc = p.evAcc;
    p.evAcc = null;
    s.ev = acc ? { sfx: [...new Set([...acc.sfx, ...ev.sfx])], ban: acc.ban.concat(ev.ban), mus: ev.mus !== null ? ev.mus : acc.mus, sh: r2(Math.max(acc.shake, ev.shake)) }
      : { sfx: [...ev.sfx], ban: ev.ban, mus: ev.mus, sh: r2(ev.shake) };
    s.W = [r2(R.weatherW), r2(Math.max(0, R.storm)), r2(Math.max(0, R.gold)), R.combo];
    return s;
  },
  markSent(R) {
    for (const q of R.particles) q.s_ = 1;
    for (const t of R.texts) t.s_ = 1;
    for (const d of R.deaths) d.s_ = 1;
    for (const g of R.ghosts) g.s_ = 1;
  },
  hud(R, p) {
    const M = MP_MODE_LOGIC[R.mp.mode], b = R.boss && !R.boss.dead ? R.boss : null;
    const h = M.hud ? M.hud(R, p) : { tm: fmtTime(R.t), ob: '' };
    h.c = R.coins; h.end = R.ending ? 1 : 0; h.won = R.won ? 1 : 0;
    if (b) h.b = [b.def.name, Math.round(b.x), Math.round(b.y), Math.max(0, b.hp / b.maxHp * 100).toFixed(1)];
    if (R.mp.base) h.base = [R.mp.base.hp / R.mp.base.maxHp, R.mp.base.flash > 0 ? 1 : 0];
    if (R.mp.zr) h.zr = Math.round(R.mp.zr);
    if (R.mp.tombs.length) h.tb = R.mp.tombs.map(t => [t.slot, t.x, t.y]);
    if (R.mp.mode === 'race' || R.mp.mode === 'pvp') h.sb = R.pl.map(q => [q.slot, q.score]);
    return h;
  },
  netMode() { const v = Save.data.settings.net; return v === 0 || v === 2 ? v : 1; },
  hostSend(dt) {
    const R = this.R, hostNm = this.netMode();
    this.sendAcc += dt;
    for (const p of R.pl) if (p.lagT > 0) p.lagT -= dt;
    // у хозяина слабый интернет — снимки реже и легче для всех
    const every = hostNm === 2 ? MP_SNAP_LEAN : MP_SNAP;
    if (this.sendAcc < every) return;
    this.sendAcc = Math.min(this.sendAcc - every, every);
    for (const p of R.pl) {
      if (p.slot === this.me) continue;
      // данные копятся и не уходят — сеть гостя не успевает: пропускаем снимок и на 8 секунд облегчаем следующие
      if (Net.buffered(p.slot) > 48 * 1024) { p.lagT = 8; continue; }
      p.lean = hostNm === 2 || p.nm === 2 || p.lagT > 0;
      // облегчённому гостю — каждый второй снимок; звуки, надписи и смерти врагов копятся до следующего
      if (p.lean && hostNm !== 2 && (p.skip = !p.skip)) {
        const ev = this.ev, a = p.evAcc || (p.evAcc = { sfx: [], ban: [], mus: null, shake: 0 });
        a.sfx.push(...ev.sfx); a.ban.push(...ev.ban); if (ev.mus !== null) a.mus = ev.mus; a.shake = Math.max(a.shake, ev.shake);
        (p.dAcc || (p.dAcc = [])).push(...R.deaths.filter(d => !d.s_));
        continue;
      }
      Net.send(p.slot, this.snapFor(p));
    }
    // зрители (вошли во время забега) смотрят глазами хозяина
    for (const r of this.roster) {
      if (R.pl.some(p => p.slot === r.slot)) continue;
      const kp = this.specKp[r.slot] || (this.specKp[r.slot] = new Map());
      Net.send(r.slot, Object.assign(this.snapFor(Object.assign(Object.create(this.meP() || R.pl[0]), { slot: r.slot, fx: [], kp })), { spec: 1 }));
    }
    this.markSent(R);
    this.ev = this.newEv();
  },

  finish() {
    const R = this.R;
    this.ended = true;
    const res = this.results(R);
    Net.bcast({ k: 'end', res });
    this.showEnd(res);
  },
  results(R) {
    return { won: R.won ? 1 : 0, title: R.mp.title || (R.won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'), mode: R.mp.mode, t: Math.round(R.t), coins: R.coins, winner: R.mp.winner,
      rows: R.pl.map(p => ({ slot: p.slot, name: p.name, hero: p.ch.id, sprite: p.sprite, lvl: p.level, kills: p.kills, score: p.score, deaths: p.deaths,
        dmg: Math.round(Object.values(p.dmgBy).reduce((s, v) => s + v, 0)), taken: Math.round(p.dmgTaken) })) };
  },

  // ================================================================ ГОСТЬ
  async join(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) { this.status('Код комнаты — 5 знаков', true); return; }
    this.status('Подключаюсь к ' + code + '...');
    Net.on({ msg: (s, m) => this.clientMsg(m), lost: why => this.lost(why) });
    try { await Net.join(code); } catch (e) { this.status(e.message, true); return; }
    this.on = true; this.role = 'client'; this.code = code; this.me = -1;
    this.status('Подключено! Жду ответа хозяина...');
    Net.toHost({ k: 'hi', name: this.nick(), prof: this.profile(this.myHero()) });
  },

  clientMsg(m) {
    switch (m.k) {
      case 'full': this.lost('Лобби заполнено (максимум ' + MP_MAX + ' игрока)'); break;
      case 'hi': this.me = m.slot; break;
      case 'ros': this.roster = m.list; this.applyRoster(); this.rosterUI(); break;
      case 'start': this.clientStart(m); break;
      case 's': if (this.R) this.applySnap(m); if (performance.now() - (this.pingT || 0) > 2000) { this.pingT = performance.now(); Net.toHost({ k: 'pg', t: Math.round(this.pingT), r: this.rtt || 0 }); } break;
      case 'po': this.rtt = Math.max(1, Math.round(performance.now() - m.t)); break;
      case 'end': this.showEnd(m.res); break;
      case 'bye': this.lost('Хозяин закрыл лобби'); break;
    }
  },

  // Мир гостя: «витрина», в которую складываются снимки от хозяина
  clientStart(m) {
    const loc = m.loc === 'mplobby' ? this.lobbyLoc() : LOCATIONS.find(l => l.id === m.loc);
    const V = this.R = {
      mp: { mode: m.mode, cfg: m.cfg, tombs: [] }, view: true, loc, t: m.t, cx: 0, cy: 0, shake: 0, hurtFlash: 0, flashT: 0, hitstop: 0,
      effects: [], pickups: [], deaths: [], ghosts: [], enemies: [], projs: [], ebullets: [], particles: [], texts: [],
      storm: 0, gold: 0, boss: null, weatherW: 0, ending: false, won: false, st: null, mods: {}, combo: 0, kills: 0, coins: 0,
      pl: [], p: null, dmgBy: {}, lastSnap: performance.now(), emap: new Map(), jmap: new Map(), off: null, jit: 0, ivl: 66, delay: 110 };
    this.scene = m.sc; this.ended = false; this.coinsTaken = false;
    if (m.ros) this.roster = m.ros;
    for (const [slot, x, y, tq] of m.pl) {
      const p = this.viewPlayer(slot);
      p.x = x; p.y = y;
      if (slot === this.me) { this.tpAck = tq; V.cx = x; V.cy = y; }
      V.pl.push(p);
    }
    V.p = this.meP() || V.pl[0];
    V.ch = V.p && V.p.ch;
    this.music = m.mus;
    Sound.resume();
    if (m.mus) Sound.startMusic(m.mus);
    if (m.sc === 'game') UI.banner(MP_MODES[m.mode].name.toUpperCase(), 2.5);
    this.enter();
    this.rosterUI();
  },
  // герой для отрисовки (свой — с полными характеристиками, чтобы двигаться без задержки)
  viewPlayer(slot) {
    const r = this.rosterOf(slot) || { hero: 'daler', name: '?', sprite: 'daler' };
    const ch = CHARACTERS.find(c => c.id === r.hero) || CHARACTERS[0];
    const base = slot === this.me ? createRun(ch.id, 'desert', {}).p : { r: 5, face: 1, dirX: 1, dirY: 0, anim: 0, invT: 0, flash: 0, atkT: 0, aim: 0, turnT: 0, stretchT: 0, squashT: 0, dashT: 0, ramT: 0, mvx: 0, mvy: 0, hp: 1, maxHp: 1, level: 1 };
    if (slot === this.me) { Object.assign(base, this.profile(ch.id).stats); base.speed = base.baseSpeed; base.hp = base.maxHp = base.baseHp; }
    return Object.assign(base, { slot, name: r.name, ch, sprite: r.sprite || ch.sprite, weapons: [], passives: {}, dead: false, score: 0, kills: 0, x: 0, y: 0 });
  },
  applyRoster() {
    const V = this.R;
    if (!V || !V.view) return;
    for (const r of this.roster) {
      let p = V.pl.find(q => q.slot === r.slot);
      if (p && p.ch.id !== r.hero) { const n = this.viewPlayer(r.slot); Object.assign(n, { x: p.x, y: p.y, hs: p.hs }); V.pl[V.pl.indexOf(p)] = n; p = n; }
      if (p) { p.name = r.name; p.sprite = r.sprite; }
    }
    V.pl = V.pl.filter(p => this.rosterOf(p.slot));
    V.p = this.meP() || V.pl[0];
  },

  applySnap(s) {
    const V = this.R, now = performance.now(), ts = s.ts || now;
    V.lastSnap = now; V.lean = !!s.ln;
    V.t = s.t;
    // часы хозяина относительно своих: берём самый «быстрый» снимок, опоздания копим как дрожание сети
    const o = ts - now;
    if (V.off === null || o > V.off + 400 || o < V.off - 1500) { V.off = o; V.jit = 0; }
    else if (o > V.off) V.off += (o - V.off) * 0.3;
    else { V.off += (o - V.off) * 0.005; V.jit = Math.max(V.jit * 0.99, V.off - o); }
    if (V.lastTs && ts > V.lastTs) V.ivl += (clamp(ts - V.lastTs, 30, 300) - V.ivl) * 0.1;
    V.lastTs = ts;
    // положения складываем в короткую историю — рисуем их чуть «в прошлом», зато плавно
    const keep = (o, x, y) => {
      const h = o.hs || (o.hs = []), n = h.length;
      if (n && (ts <= h[n - 3] || Math.abs(x - h[n - 2]) + Math.abs(y - h[n - 1]) > 160)) h.length = 0; // телепорт или сбой часов
      h.push(ts, x, y);
      if (h.length > 18) h.splice(0, 3);
    };
    const me = this.meP();
    // герои
    const seen = new Set();
    for (const a of s.P) {
      const [slot, x, y, face, dx, dy, mvx, mvy, fl, hp, maxHp, rsp, lvl, atk, aim, saw, score, kills, ram] = a;
      let p = V.pl.find(q => q.slot === slot);
      if (!p) { p = this.viewPlayer(slot); p.x = x; p.y = y; V.pl.push(p); }
      seen.add(slot);
      const wasDead = p.dead;
      Object.assign(p, { hp, maxHp, respawnT: rsp, level: lvl, dead: !!(fl & 4), choosing: !!(fl & 8), score, kills });
      p.invT = fl & 1 ? Math.max(p.invT, 0.2) : 0; p.flash = fl & 2 ? 0.1 : 0; p.ramT = ram;
      if (fl & 32 && p.squashT <= 0) p.squashT = 0.14;
      if (p === me) continue;
      if (wasDead && !p.dead) { p.x = x; p.y = y; p.hs = null; }
      keep(p, x, y);
      if (face !== p.face) { p.face = face; p.turnT = 0.12; }
      Object.assign(p, { dirX: dx, dirY: dy, mvx, mvy, dashT: fl & 16 ? 0.1 : 0, aim });
      if (atk > 0) p.atkT = atk;
      p.weapons = saw ? [{ id: 'saws', ang: saw[0], lvl: saw[1], evo: !!saw[2], spd: 0 }] : [];
    }
    V.pl = V.pl.filter(p => seen.has(p.slot));
    // враги: те же объекты по номеру, чтобы плавно двигать между снимками
    const emap = new Map(), list = [];
    for (const a of s.E) {
      let e = V.emap.get(a[0]), x, y, fl, hpp;
      if (a.length === 5) { // знакомый враг: только движение
        if (!e) continue;
        [, x, y, fl, hpp] = a;
      } else {
        const [id, ti, , , , , sc10, an] = a;
        [, , x, y, fl, hpp] = a;
        const type = MP_TYPES[ti] || 'zombie', boss = type[0] === '#';
        if (!e) {
          const def = boss ? BOSSES[type.slice(1)] : ENEMIES[type];
          e = { id, type: boss ? 'boss' : type, def, boss, x, y, anim: an / 10, flash: 0, squash: 0, spawnT: fl & 2048 ? 0.3 : 0, face: 1, maxHp: 100, lunge: { wind: 0.5 }, dead: false };
        }
        e.sc = sc10 / 10;
        if (Math.abs(e.anim - an / 10) > 0.5 && an / 10 > 0.05) e.anim = an / 10;
      }
      keep(e, x, y);
      e.hp = hpp; e.elite = !!(fl & 4); e.enraged = !!(fl & 8); e.stunT = fl & 16 ? 0.2 : 0; e.mv = !!(fl & 32);
      e.lst = fl & 64 ? 1 : fl & 128 ? 2 : 0; e.lt = 0.25; e.fuse = fl & 256 ? 0.35 : 0; e.tele = fl & 512 ? 0.3 : 0; e.dash = fl & 1024 ? 0.3 : 0;
      e.atkT = fl & 2 ? 0.2 : 0; e.face = fl & 8192 ? -1 : 1;
      if (fl & 1) { if (e.flash <= 0) e.squash = 0.12; e.flash = 0.1; }
      emap.set(e.id, e); list.push(e);
    }
    V.emap = emap; V.enemies = list;
    V.ebullets = s.B.map(([x, y, vx, vy, big, c]) => ({ x, y, x0: x, y0: y, ts, vx, vy, big: !!big, c }));
    const jmap = new Map();
    V.projs = s.J.map(([id, code, x, y, vx, vy, fl, q]) => {
      let pr = V.jmap.get(id);
      const type = code <= 2 ? 'arrow' : MP_PROJ[code];
      if (!pr || pr.type !== type) pr = { id, type, x, y, t: 0 };
      keep(pr, x, y);
      Object.assign(pr, { vx, vy, star: code === 1, pellet: code === 2, fire: !!(fl & 1), big: !!(fl & 2), arm: fl & 4 ? 1 : 0, dur: 1 });
      if (type === 'bottle') pr.t = q;
      jmap.set(id, pr);
      return pr;
    });
    V.jmap = jmap;
    V.effects = s.F.map(a => {
      if (a[0] === 0) return { type: 'ring', x: a[1], y: a[2], r: a[3], t: a[4], dur: 1, c: a[5] || undefined };
      if (a[0] === 1) return { type: 'slash', a: a[2], r: a[3], t: a[4] * 0.2, dur: 0.2, o: V.pl.find(q => q.slot === a[1]) };
      if (a[0] === 2) return { type: 'bolt', pts: a[1], t: a[2] * 0.2, dur: 0.2 };
      if (a[0] === 3) return { type: 'fire', x: a[1], y: a[2], r: a[3], t: a[4], dur: a[5] };
      return { type: 'hazard', x: a[1], y: a[2], r: a[3], t: a[4], dur: 1 };
    });
    const km = V.kmap || (V.kmap = new Map());
    for (const id of s.Kd) km.delete(id);
    for (const [id, c, x, y, fl] of s.Kn) {
      const spr = typeof c === 'number' ? MP_PICK[c] : c;
      km.set(id, { id, spr, type: spr.startsWith('gem') ? 'gem' : spr, x, y, static: !!(fl & 1), mag: !!(fl & 2) });
    }
    for (let i = 0; i < s.Km.length; i += 3) { const k = km.get(s.Km[i]); if (k) { k.x = s.Km[i + 1]; k.y = s.Km[i + 2]; if (!k.static) k.mag = true; } }
    V.pickups = [...km.values()];
    for (const q of s.Q) if (V.particles.length < 500) V.particles.push({ x: q[0], y: q[1], vx: q[2], vy: q[3], life: q[4], c: q[5], s: q[6], g: q[7] });
    for (const t of s.T) { if (V.texts.length > 60) V.texts.shift(); V.texts.push({ x: t[0], y: t[1], v: t[2], c: t[3], life: t[4] ? 0.8 : 0.6, big: !!t[4] }); }
    for (const d of s.D) V.deaths.push({ sprite: d[0], x: d[1], y: d[2], face: d[3], sc: d[4], ds: d[5], t: 0 });
    for (const g of s.G) V.ghosts.push({ name: g[0], x: g[1], y: g[2], flip: !!g[3], life: g[4] });
    // свой герой
    if (me && s.me) {
      const m = s.me;
      Object.assign(me, { speed: m.sp, xp: m.xp, xpNext: m.xn, ult: m.u, ultCost: m.uc, ultCd: m.ucd, passives: m.ps, dashMul: m.dm, magnet: m.mg });
      const sig = m.w.map(w => w.join()).join('|');
      if (sig !== me.wsig) { me.wsig = sig; me.weapons = m.w.map(([id, lvl, evo]) => ({ id, lvl, evo: !!evo, ang: 0, t: 0 })); }
      const saw = s.P.find(a => a[0] === me.slot);
      const sw = me.weapons.find(w => w.id === 'saws');
      if (sw && saw && saw[15]) sw.ang = saw[15][0];
      for (const f of m.fx) this.applyFx(me, f);
      this.showOffer(me, m.o);
    }
    // интерфейс режима и общие события
    const H = s.H;
    V.hud = H; V.coins = H.c; V.ending = !!H.end; V.won = !!H.won;
    V.boss = H.b ? { def: { name: H.b[0] }, x: H.b[1], y: H.b[2], hp: +H.b[3], maxHp: 100, dead: false } : null;
    V.mp.zr = H.zr || 0;
    V.mp.base = H.base ? { x: 0, y: 0, hp: H.base[0], maxHp: 1, flash: H.base[1] ? 0.1 : 0 } : null;
    V.mp.tombs = (H.tb || []).map(([slot, x, y]) => ({ slot, x, y }));
    V.weatherW = s.W[0]; V.storm = s.W[1]; V.gold = s.W[2]; V.combo = s.W[3];
    const ev = s.ev;
    for (const n of ev.sfx) {
      if (n.startsWith('@s:')) Sound.shout(n.slice(3));
      else if (n.startsWith('@c:')) Sound.cheer(n.slice(3));
      else Sound.sfx(n);
    }
    for (const [text, secs] of ev.ban) UI.banner(text, secs);
    if (ev.mus !== null && ev.mus !== undefined) { if (ev.mus) Sound.startMusic(ev.mus); else Sound.stopMusic(); }
    V.shake = Math.max(V.shake, ev.sh || 0);
  },

  // личные события: удар, телепорт, отброс, новый уровень
  applyFx(p, f) {
    const R = this.R;
    if (f[0] === 'hurt') { R.hurtFlash = 0.3; R.shake = Math.max(R.shake, 3); this.quiet(() => { Sound.sfx('hurt'); Sound.grunt(p.ch.id); }); }
    else if (f[0] === 'dead') this.quiet(() => Sound.sfx('lose'));
    else if (f[0] === 'lvl') { R.flashT = 0.2; this.quiet(() => Sound.sfx('levelup')); }
    else if (f[0] === 'tp') { p.x = f[1]; p.y = f[2]; p.mvx = p.mvy = 0; R.cx = p.x; R.cy = p.y; this.tpAck = f[3]; }
    else if (f[0] === 'kb') { p.kbx = (p.kbx || 0) + f[1]; p.kby = (p.kby || 0) + f[2]; }
    else if (f[0] === 'stun') p.stunT = f[1];
  },

  clientTick(dt) {
    const V = this.R, me = this.meP();
    V.t += dt;
    if (this.fire) this.fire.name = 'h_fire' + (Math.floor(V.t * 8) % 2);
    // свой герой двигается сразу, без ожидания хозяина
    if (me && !me.dead && this.scene !== 'end' && !V.ending) {
      const ax = Input.axis;
      if (me.stunT > 0) { me.stunT -= dt; Input.axis = () => ({ x: 0, y: 0 }); }
      try { updatePlayer(V, dt); } finally { Input.axis = ax; }
      if (me.kbx || me.kby) {
        me.x += me.kbx * dt; me.y += me.kby * dt;
        const k = Math.min(1, dt * 10); me.kbx -= me.kbx * k; me.kby -= me.kby * k;
        resolveSolids(V.loc, me, 4, 8);
      }
      if (this.scene === 'lobby') this.clampLobby(me);
    }
    if (me && this.scene === 'lobby') Input.ultQ = false;
    if (Input.ultQ) { Input.ultQ = false; if (me && !me.dead) Net.toHost({ k: 'ult' }); }
    // плавно ведём всех остальных: мир рисуется с небольшой задержкой (буфер), чтобы неровная сеть не дёргала картинку
    const want = clamp(V.ivl + MP_NET_EXTRA[this.netMode()] + V.jit * 1.1, 40, 450);
    V.delay += (want - V.delay) * Math.min(1, dt * 1.5);
    const rt = V.off === null ? 0 : performance.now() + V.off - V.delay;
    const lerp = o => {
      const h = o.hs;
      if (!h || !h.length) return;
      const n = h.length;
      if (rt <= h[0]) { o.x = h[1]; o.y = h[2]; return; }
      for (let i = 3; i < n; i += 3) {
        if (rt <= h[i]) { const a = (rt - h[i - 3]) / (h[i] - h[i - 3] || 1); o.x = h[i - 2] + (h[i + 1] - h[i - 2]) * a; o.y = h[i - 1] + (h[i + 2] - h[i - 1]) * a; return; }
      }
      // снимок опаздывает — недолго продолжаем движение по инерции
      if (n >= 6) { const a = Math.min(rt - h[n - 3], 120) / (h[n - 3] - h[n - 6] || 1); o.x = h[n - 2] + (h[n - 2] - h[n - 5]) * a; o.y = h[n - 1] + (h[n - 1] - h[n - 4]) * a; }
      else { o.x = h[n - 2]; o.y = h[n - 1]; }
    };
    for (const p of V.pl) {
      if (p === me) continue;
      lerp(p);
      p.anim += dt; p.turnT -= dt; p.atkT -= dt; p.squashT -= dt; p.flash -= dt;
      if (p.invT > 0) p.invT -= dt * 0.2;
      for (const w of p.weapons) if (w.id === 'saws') w.ang += wStats(w).spd * dt;
    }
    if (me) { for (const w of me.weapons) if (w.id === 'saws') w.ang += wStats(w).spd * dt; me.anim += 0; me.atkT -= dt; me.flash -= dt; me.invT -= dt * 0.2; }
    for (const e of V.enemies) {
      lerp(e);
      e.anim += dt; e.flash -= dt; e.squash -= dt; e.spawnT -= dt;
      if (e.def && e.def.ai === 'hop' && !e.lst) e.hop = (e.anim * 1.5) % 1;
    }
    for (const pr of V.projs) { lerp(pr); pr.t += dt; }
    for (const b of V.ebullets) { const k = Math.max(-0.06, (rt - b.ts) / 1000); b.x = b.x0 + b.vx * k; b.y = b.y0 + b.vy * k; }
    for (const ef of V.effects) ef.t = Math.min(ef.dur, ef.t + dt);
    updateParticles(V, dt); updateTexts(V, dt);
    for (const g of V.ghosts) g.life -= dt;
    V.ghosts = V.ghosts.filter(g => g.life > 0);
    for (const d of V.deaths) d.t += dt;
    V.deaths = V.deaths.filter(d => d.t < 0.18);
    V.shake = Math.max(0, V.shake - dt * 10); V.hurtFlash -= dt; V.flashT -= dt;
    // камера
    const view = this.spectate(me);
    if (view) { V.p = view; updateCamera(V, dt); V.p = me || view; }
    // своё положение — хозяину
    this.stateAcc += dt;
    if (me && this.stateAcc >= MP_SEND) {
      this.stateAcc = 0;
      const r2 = x => Math.round(x * 100) / 100;
      Net.toHost({ k: 'st', x: r2(me.x), y: r2(me.y), f: me.face, dx: r2(me.dirX), dy: r2(me.dirY), mv: me.moving ? 1 : 0,
        vx: Math.round(me.mvx), vy: Math.round(me.mvy), d: me.dashT > 0 ? r2(me.dashT) : 0, tq: this.tpAck, W: Game.W, H: Game.H, nm: this.netMode() });
    }
  },

  lost(why) {
    if (!this.on) return;
    this.leave(true);
    this.showOnline();
    this.status(why, true);
  },

  // ================================================================ ОБЩИЙ ЦИКЛ
  update(dt) {
    if (!this.R) return;
    this.padPoll();
    if (this.isHost()) { this.hostTick(dt); this.hostSend(dt); this.checkTimeouts(); }
    else this.clientTick(dt);
    const R = this.R, me = this.meP();
    if (this.scene === 'game' && me) {
      // свой выбор улучшения у хозяина
      if (this.isHost()) this.showOffer(me, me.offer ? { s: me.offerSeq, l: me.offer, k: me.offerKind } : null);
      this.hudUpdate(R, me);
    }
    this.uiTick();
  },
  checkTimeouts() {
    const now = performance.now();
    for (const r of this.roster) {
      if (r.slot === this.me) continue;
      if (now - (Net.seen[r.slot] || now) > 30000) { Net.kick(r.slot); this.dropSlot(r.slot); }
    }
  },

  hudUpdate(R, me) {
    const H = this.isHost() ? this.hud(R, me) : R.hud || {};
    const view = Object.create(R);
    view.p = me; view.hudTimer = H.tm; view.hudObj = H.ob; view.hudKills = me.kills; view.coins = H.c !== undefined ? H.c : R.coins;
    if (!this.isHost()) { view.boss = R.boss; view.st = null; }
    UI.updateHUD(view);
  },

  // ================================================================ ИНТЕРФЕЙС
  status(text, bad) { const el = $('on-status'); el.textContent = text; el.classList.toggle('red', !!bad); el.classList.toggle('gold', !bad); },
  showOnline() {
    Game.state = 'menu';
    $('on-name').value = Save.data.nick || '';
    $('on-code').value = '';
    const ch = CHARACTERS.find(c => c.id === this.myHero());
    $('on-hero').innerHTML = `<img src="${iconURL(ch.sprite, 32)}" alt=""> ${ch.name} — сменить героя можно у костра в лагере`;
    this.status('');
    UI.show('online');
  },

  // Вход в сцену: прячем меню, показываем свой интерфейс
  enter() {
    Game.run = this.R;
    Game.state = 'mp';
    Hub.home = false;
    UI.show(null);
    const fight = this.scene === 'game';
    UI.showHUD(fight && !!this.meP());
    $('btn-arsenal').classList.add('hidden');
    $('mp-ui').classList.remove('hidden');
    $('mp-lobby').classList.toggle('hidden', fight);
    $('mp-dead').classList.add('hidden');
    $('mp-score').classList.add('hidden');
    this.offerShown = 0;
    this.labelsBuilt = null;
    Tut.show(null);
    this.rosterUI();
  },

  rosterUI() {
    if (!this.on) return;
    $('mp-code').textContent = this.code || '';
    $('mp-players').innerHTML = this.roster.map(r => {
      const ch = CHARACTERS.find(c => c.id === r.hero) || CHARACTERS[0];
      return `<div class="mp-pl ${r.slot === this.me ? 'me' : ''}"><img src="${iconURL(r.sprite || (r.prof && r.prof.stats.sprite) || ch.sprite, 32)}" alt=""><span>${escapeHTML(r.name)}${r.slot === 0 ? ' ♛' : ''}</span><em>${ch.name}${r.ping && r.slot !== this.me ? ' · ' + r.ping + ' мс' : ''}</em></div>`;
    }).join('') + (this.roster.length < MP_MAX ? `<div class="muted">Мест: ${MP_MAX - this.roster.length}. Друзья вводят код на экране «Онлайн».</div>` : '');
  },

  // Каждый кадр: подписи над героями и постройками, подсказка у порталов, экран погибшего
  uiTick() {
    const R = this.R, me = this.meP(), sc = Game.scale;
    const items = [];
    for (const p of R.pl) if (!p.dead) items.push({ key: 'p' + p.slot, text: p.name, x: p.x, y: p.y - 24, me: p === me });
    if (this.scene === 'lobby') {
      items.push({ key: 'z_hero', text: 'Костёр: герой', x: 0, y: -12, zone: true });
      for (const id in MP_MODES) { const M = MP_MODES[id]; items.push({ key: 'z_' + id, text: M.name, x: M.x, y: M.y - (M.spr === 'machine' ? 34 : 40), zone: true, on: this.near === id }); }
    }
    const box = $('mp-labels');
    const sig = items.map(i => i.key).join();
    if (sig !== this.labelsBuilt) { this.labelsBuilt = sig; box.innerHTML = items.map(i => `<div class="hub-label ${i.zone ? '' : 'mp-name'} ${i.me ? 'me' : ''}">${escapeHTML(i.text)}</div>`).join(''); }
    items.forEach((it, i) => {
      const el = box.children[i];
      el.style.transform = `translate(${Math.round((it.x - Game.camX) * sc)}px, ${Math.round((it.y - Game.camY) * sc)}px) translate(-50%, -100%)`;
      el.classList.toggle('on', !!it.on);
    });
    // подсказка у постройки лагеря
    const z = this.scene === 'lobby' ? this.nearZone(me) : null;
    if (z !== this.near) { this.near = z; this.promptUI(); }
    // погибший ждёт возрождения; вошедший посреди матча — смотрит
    const dead = this.scene === 'game' && me && me.dead && !R.ending, spec = this.scene === 'game' && !me;
    $('mp-dead').classList.toggle('hidden', !dead && !spec);
    if (spec) $('mp-dead').textContent = 'Матч уже идёт — ты смотришь. Сыграешь, когда хозяин вернёт всех в лагерь.';
    if (dead) {
      const v = this.spectate(me);
      $('mp-dead').textContent = me.respawnT > 0 ? `Ты пал... Возрождение через ${Math.ceil(me.respawnT)} с` : 'Ты выбыл. ' + (v && v !== me ? 'Смотришь за ' + v.name : '');
    }
    // таблица очков (гонка и арена)
    const H = this.isHost() ? (this.scene === 'game' ? this.hud(R, me || R.pl[0]) : {}) : R.hud || {};
    const sb = this.scene === 'game' && H.sb;
    $('mp-score').classList.toggle('hidden', !sb);
    if (sb) {
      const html = sb.slice().sort((a, b) => b[1] - a[1]).map(([slot, s]) => {
        const p = R.pl.find(q => q.slot === slot), r = this.rosterOf(slot);
        return `<div class="${slot === this.me ? 'gold' : ''}${p && p.dead ? ' dim' : ''}">${escapeHTML(r ? r.name : '?')}: ${s}</div>`;
      }).join('');
      if (html !== this.sbHTML) { this.sbHTML = html; $('mp-score').innerHTML = html; }
    }
    this.netUI(R);
  },
  // качество связи: гостю — его пинг, хозяину — самый медленный гость
  netUI(R) {
    const now = performance.now();
    let text = '', cls = '';
    const grade = ms => ms < 90 ? 'good' : ms < 180 ? 'mid' : 'bad';
    if (!this.isHost()) {
      if (now - (Net.seen.host || now) > 1200) { text = 'СВЯЗЬ ПРЕРЫВАЕТСЯ...'; cls = 'bad'; }
      else if (this.rtt) { text = 'ПИНГ ' + this.rtt + ' МС' + (R.lean ? ' · ЭКОНОМНО' : ''); cls = grade(this.rtt); }
    } else {
      const guests = this.roster.filter(r => r.slot !== this.me && r.ping);
      if (guests.length) {
        const w = guests.reduce((a, r) => r.ping > a.ping ? r : a);
        const slow = R.pl.find(p => p.slot !== this.me && p.lagT > 0);
        text = slow ? 'У ' + (slow.name || '?').toUpperCase() + ' СЛАБАЯ СВЯЗЬ' : 'ПИНГ ГОСТЕЙ ДО ' + w.ping + ' МС';
        cls = slow ? 'bad' : grade(w.ping);
      }
    }
    const el = $('mp-net'), key = text + cls;
    if (key !== this.netKey) { this.netKey = key; el.textContent = text; el.className = text ? cls : 'hidden'; }
  },

  promptUI() {
    const z = this.near, box = $('mp-prompt');
    box.classList.toggle('hidden', !z);
    if (!z) return;
    const host = this.isHost(), M = MP_MODES[z];
    const hostName = (this.rosterOf(0) || {}).name || 'хозяин';
    $('mp-pname').textContent = z === 'hero' ? 'Костёр отряда' : M.name;
    $('mp-pdesc').textContent = z === 'hero' ? 'Сменить героя. Доступны те, кого ты уже спас в своём сюжете.' : M.desc + (host ? '' : ` Режим запускает хозяин лобби: ${hostName}.`);
    const go = $('mp-go');
    go.disabled = z !== 'hero' && !host;
    go.textContent = (z === 'hero' ? 'СМЕНИТЬ ГЕРОЯ' : host ? 'НАСТРОИТЬ И НАЧАТЬ' : 'ЖДЁМ ХОЗЯИНА') + (matchMedia('(hover: hover)').matches && !go.disabled ? '  [E]' : '');
  },
  useZone() {
    const z = this.near;
    if (!z || UI.current) return;
    UI.click();
    if (z === 'hero') this.heroPicker();
    else if (this.isHost()) this.modeMenu(z);
  },

  heroPicker() {
    const cur = (this.rosterOf(this.me) || {}).hero;
    $('mph-list').innerHTML = CHARACTERS.filter(c => Campaign.heroOpen(c.id)).map(c =>
      `<button class="rush-pick ${c.id === cur ? 'on' : ''}" data-h="${c.id}"><img src="${iconURL(c.sprite + (Save.data.costume[c.id] && Save.data.wins[c.id] ? '_alt' : ''), 48)}" alt=""><span>${c.name}</span><em>${WEAPONS[c.weapon].name}</em></button>`).join('');
    $('mph-list').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        UI.click();
        const prof = this.profile(b.dataset.h);
        Save.data.hero = prof.hero; Save.store();
        if (this.isHost()) { const r = this.rosterOf(this.me); r.hero = prof.hero; r.prof = prof; this.swapHero(r); this.sendRoster(); }
        else Net.toHost({ k: 'hero', prof });
        UI.show(null);
      };
    });
    UI.show('mphero');
  },

  // настройки режима у хозяина: локация, босс, сила сборки
  modeMenu(id) {
    const M = MP_MODES[id], cfg = this.cfg || (this.cfg = { loc: 'desert', boss: 'scorpion', power: 2 });
    $('mpm-title').textContent = M.name;
    $('mpm-desc').textContent = M.desc;
    const rows = [];
    if (id === 'boss') rows.push('<div class="rush-title">Босс</div><div class="rush-grid" id="mpm-boss">' + Object.keys(BOSSES).map(b =>
      `<button class="rush-pick boss ${cfg.boss === b ? 'on' : ''}" data-b="${b}"><img src="${iconURL(BOSSES[b].sprite, 64)}" alt=""><span>${BOSSES[b].name}</span></button>`).join('') + '</div>');
    if (id !== 'boss' && id !== 'pvp') rows.push('<div class="rush-title">Локация</div><div class="seg wrap" id="mpm-loc">' + MP_LOCS().map(l =>
      `<button data-l="${l}" class="${cfg.loc === l ? 'on' : ''}">${LOCATIONS.find(x => x.id === l).name}</button>`).join('') + '</div>');
    if (id === 'boss' || id === 'pvp') rows.push('<div class="rush-title">Сила героев</div><div class="seg" id="mpm-power">' + [1, 2, 3].map(v =>
      `<button data-v="${v}" class="${cfg.power === v ? 'on' : ''}">${POWER_NAMES[v]}</button>`).join('') + '</div>');
    rows.push(`<p class="muted">Игроков: ${this.roster.length}. ${id === 'pvp' && this.roster.length < 2 ? 'Для арены нужен хотя бы один соперник!' : 'Враги и босс сильнее, когда вас больше.'}</p>`);
    $('mpm-opts').innerHTML = rows.join('');
    $('mpm-opts').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        UI.click();
        if (b.dataset.b) cfg.boss = b.dataset.b;
        if (b.dataset.l) cfg.loc = b.dataset.l;
        if (b.dataset.v) cfg.power = +b.dataset.v;
        this.modeMenu(id);
      };
    });
    const go = $('mpm-go');
    go.disabled = id === 'pvp' && this.roster.length < 2;
    go.onclick = () => { UI.click(); UI.show(null); this.startGame(id, Object.assign({}, cfg)); };
    UI.show('mpmode');
  },

  // выбор улучшения: карточки поверх игры, мир не останавливается
  showOffer(me, o) {
    if (!o) { if (this.offerShown && UI.current === 'levelup') UI.show(null); this.offerShown = 0; this.offerOpts = null; return; }
    if (this.offerShown === o.s) return;
    this.offerShown = o.s; this.offerOpts = o.l;
    UI.showLevelUp(o.l, o.k === 'altar' ? 'ТЁМНЫЙ АЛТАРЬ' : 'НОВЫЙ УРОВЕНЬ! (' + this.offerTime() + ')');
  },
  offerTime() { return 'выбери за 12 с'; },
  choose(opt) {
    const me = this.meP();
    if (!me || !this.offerOpts) return;
    const i = Math.max(0, this.offerOpts.findIndex(o => JSON.stringify(o) === JSON.stringify(opt)));
    const seq = this.offerShown;
    if (this.isHost()) this.pick(me, i, seq); else Net.toHost({ k: 'pick', i, s: seq });
    this.offerOpts = null;
    UI.show(null);
    Sound.sfx('click');
  },

  menu() {
    if (UI.current === 'mpmenu') { UI.show(null); return; }
    $('mpmenu-info').textContent = this.isHost() ? 'Ты хозяин лобби: если выйдешь, лобби закроется для всех. Не сворачивай игру — без тебя мир остановится.' : 'Игра не останавливается, пока открыто это меню.';
    $('mpmenu-lobby').classList.toggle('hidden', !(this.isHost() && this.scene === 'game'));
    UI.show('mpmenu');
  },

  showEnd(res) {
    this.scene = 'end';
    if (!this.coinsTaken) { this.coinsTaken = true; Save.data.coins += res.coins || 0; Save.store(); }
    const M = MP_MODES[res.mode], me = res.rows.find(r => r.slot === this.me);
    $('mpe-title').textContent = res.title;
    $('mpe-title').className = res.won && (res.mode !== 'pvp' || res.winner === this.me) ? 'gold' : res.mode === 'pvp' || res.mode === 'race' ? 'gold' : 'red';
    const score = res.mode === 'race' || res.mode === 'pvp';
    const rows = res.rows.slice().sort((a, b) => score ? b.score - a.score : b.dmg - a.dmg);
    $('mpe-table').style.setProperty('--n', score ? 4 : 3);
    $('mpe-table').innerHTML = `<div class="mpe-row head"><span></span><span>Игрок</span>${score ? '<span>Очки</span>' : ''}<span>Убито</span><span>Урон</span><span>Смерти</span></div>` +
      rows.map(r => `<div class="mpe-row ${r.slot === this.me ? 'me' : ''}"><img src="${iconURL(r.sprite, 32)}" alt=""><span>${escapeHTML(r.name)} · ур. ${r.lvl}</span>${score ? `<b>${r.score}</b>` : ''}<span>${r.kills}</span><span>${r.dmg}</span><span>${r.deaths}</span></div>`).join('');
    $('mpe-info').textContent = `${M.name} · ${fmtTime(res.t)} · монеты отряда: +${res.coins || 0} (уже у тебя в копилке)` + (me ? '' : '');
    $('mpe-lobby').classList.toggle('hidden', !this.isHost());
    $('mpe-wait').classList.toggle('hidden', this.isHost());
    UI.showHUD(false);
    $('mp-dead').classList.add('hidden');
    UI.show('mpend');
  },

  leave(silent) {
    if (!this.on) return;
    if (Net.role === 'client') Net.toHost({ k: 'bye' });
    else Net.bcast({ k: 'bye' });
    setTimeout(() => Net.close(), 150);
    this.on = false; this.R = null; this.roster = []; this.scene = null; this.role = null; this.rec = false; this.near = null;
    Game.run = null; Game.state = 'menu';
    Sound.stopMusic(); Sound.resume();
    UI.showHUD(false);
    $('mp-ui').classList.add('hidden');
    if (!silent) UI.showMenu();
  },

  // геймпад в сетевой игре: A — рывок (в лагере — войти), B/X — ульта, Start — меню
  padPoll() {
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
    if (!gp) return;
    const b = gp.buttons.map(x => x.pressed), prev = this.padPrev || [], edge = i => b[i] && !prev[i];
    this.padPrev = b;
    if (UI.current) return;
    if (edge(0)) { if (this.scene === 'lobby' && this.near) this.useZone(); else Input.dashQ = true; }
    if (edge(1) || edge(2)) Input.ultQ = true;
    if (edge(9)) this.menu();
  },

  // ================================================================ ПОДКЛЮЧЕНИЕ
  init() {
    // таблицы для сжатия снимков (одинаковые у всех — код один)
    window.MP_TYPES = Object.keys(ENEMIES).concat(Object.keys(BOSSES).map(b => '#' + b));
    window.MP_PROJ = ['arrow', 'arrow', 'arrow', 'bottle', 'axe', 'boom', 'mine', 'orb', 'seek'];
    window.MP_PICK = ['gem', 'gem2', 'gem3', 'coin', 'heart', 'chest', 'altar'];
    Object.assign(SOLID, { h_tree: [4, 3], h_bush: [5, 3] });
    Object.assign(GLOW_DECOR, { h_portal: ['#c77dff', 22, 0.4], h_cave: ['#ef3b5b', 20, 0.35], h_fire0: ['#f59e42', 46, 0.5], h_fire1: ['#ffcd75', 48, 0.5] });

    // меню и лагерь: вход в онлайн
    $('btn-online').onclick = () => { UI.click(); this.showOnline(); };
    BACK.online = 'menu';
    $('on-name').oninput = () => { Save.data.nick = $('on-name').value.trim().slice(0, 14); Save.store(); };
    $('on-host').onclick = () => { UI.click(); this.host(); };
    $('on-join').onclick = () => { UI.click(); this.join($('on-code').value); };
    $('on-code').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); this.join($('on-code').value); } };
    $('on-back').onclick = () => { UI.click(); if (Hub.home) Hub.enter(); else UI.showMenu(); };
    $('mp-copy').onclick = async () => { UI.click(); try { await navigator.clipboard.writeText(this.code); UI.banner('Код скопирован: ' + this.code, 1.5); } catch (e) { UI.banner('Код: ' + this.code, 2); } };
    $('mp-exit').onclick = () => { UI.click(); this.menu(); };
    $('mp-go').onclick = () => this.useZone();
    $('mph-back').onclick = () => { UI.click(); UI.show(null); };
    $('mpm-back').onclick = () => { UI.click(); UI.show(null); };
    $('mpmenu-back').onclick = () => { UI.click(); UI.show(null); };
    $('mpmenu-leave').onclick = () => { UI.click(); this.leave(); };
    $('mpmenu-lobby').onclick = () => { UI.click(); UI.show(null); this.toLobby(); };
    $('mpe-lobby').onclick = () => { UI.click(); this.toLobby(); };
    $('mpe-leave').onclick = () => { UI.click(); this.leave(); };

    // указатель «Онлайн с друзьями» в одиночном лагере (лагерь уже построен — добавляем к готовому)
    const zone = { id: 'online', x: -58, y: 56, r: 16, spr: 'h_sign', tint: '#73eff7', name: 'Онлайн с друзьями',
      desc: 'Общий лагерь для друзей: создай лобби или войди по коду комнаты.', act: () => { Game.state = 'menu'; MP.showOnline(); } };
    const solid = { x: zone.x, y: zone.y - 3, r: 4, zid: 'online' };
    for (const list of [Hub.zones, Hub.allZones]) if (list && !list.includes(zone)) list.push(zone);
    for (const list of [Hub.solids, Hub.allSolids]) if (list && !list.includes(solid)) list.push(solid);

    // главный цикл и отрисовка
    const update = Game.update.bind(Game);
    Game.update = dt => { if (Game.state === 'mp') MP.update(dt); else update(dt); };
    const pause = Game.pause.bind(Game);
    Game.pause = () => { if (Game.state === 'mp') MP.menu(); else pause(); };
    const choose = Game.choose.bind(Game);
    Game.choose = o => { if (Game.state === 'mp') MP.choose(o); else choose(o); };
    const onKey = Input.onKey;
    Input.onKey = e => {
      if (Game.state !== 'mp') return onKey(e);
      Sound.init();
      if (UI.current === 'levelup') {
        const i = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code) % 3;
        if (i >= 0 && this.offerOpts && this.offerOpts[i]) this.choose(this.offerOpts[i]);
        return;
      }
      if (UI.current) { if (e.code === 'Escape' && UI.current !== 'mpend') UI.show(null); return; }
      if (e.code === 'Escape' || e.code === 'KeyP') { this.menu(); return; }
      if (this.scene === 'lobby' && (e.code === 'KeyE' || e.code === 'Enter')) { e.preventDefault(); Input.ultQ = false; this.useZone(); }
    };
    Stage.objective = (orig => R => R.mp ? R.hudObj || '' : orig(R))(Stage.objective.bind(Stage));
  },
};

function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function bossId(e) { for (const k in BOSSES) if (BOSSES[k] === e.def) return k; return 'scorpion'; }
function R_ghost(R, p) { R.ghosts.push({ name: heroFrame(p), x: p.x, y: p.y, flip: p.face < 0, life: 0.25, slot: p.slot }); }

// ================================================================ РЕЖИМЫ (только у хозяина)
const MP_MODE_LOGIC = {
  lobby: { init() {}, tick() {}, hud() { return { tm: 'ЛАГЕРЬ', ob: '' }; } },

  // Классический забег вместе
  coop: {
    init(R) {
      const n = R.pl.length;
      R.diff.rate *= 1 + 0.45 * (n - 1); R.diff.hp *= 1 + 0.2 * (n - 1);
      R.mp.bossMul = 1 + 0.6 * (n - 1);
    },
    tick(R, dt) { MP.use(pick(MP.alive(R)) || R.pl[0]); updateSpawns(R, dt); },
    hud(R) {
      const boss = R.boss && !R.boss.dead;
      return { tm: boss ? 'БОСС' : fmtTime(R.t), ob: R.bossSpawned ? (boss ? 'Победите босса: ' + R.boss.def.name : '') : 'До босса: ' + fmtTime(RUN_TIME - R.t) };
    },
  },

  // Очень много слабых врагов, 6 минут
  horde: {
    init(R) {
      const n = R.pl.length;
      Object.assign(R.mp, { dur: 360, nextRing: 8, nextElite: 30, nextEv: 60, rateMul: 1 + 0.5 * (n - 1), vtMul: 1.5 });
      R.diff.hp *= 0.55 * (1 + 0.15 * (n - 1));
    },
    tick(R, dt) {
      const M = R.mp, t = R.t, alive = MP.alive(R);
      if (!alive.length) return;
      const n = R.pl.length, rate = (3 + t / 12) * M.rateMul, cap = Math.min(520, (110 + t * 1.6) * (0.7 + 0.3 * n));
      R.spawnAcc += rate * dt;
      while (R.spawnAcc >= 1) { R.spawnAcc -= 1; if (R.enemies.length < cap) { MP.use(pick(alive)); spawnAround(R, pickEnemyType(R)); } }
      if (t >= M.nextRing) {
        M.nextRing += 35;
        const type = weightedPick({ zombie: R.loc.weights.zombie, rat: R.loc.weights.rat }), k = Math.floor(28 + t / 8);
        for (const p of alive) { MP.use(p); for (let i = 0; i < k; i++) spawnAround(R, type, i / k * Math.PI * 2); }
        UI.banner('ОРДА!', 1.5);
      }
      if (t >= M.nextElite) { M.nextElite += 30; MP.use(pick(alive)); spawnElite(R); }
      if (t >= M.nextEv) { M.nextEv += 70; MP.use(pick(alive)); startEvent(R); }
      updateEvent(R, dt);
      if (t >= M.dur && !R.ending) { R.coins += 60; MP.win('ОРДА ОТБИТА!'); }
    },
    hud(R) { return { tm: fmtTime(R.mp.dur - R.t), ob: 'Продержитесь! Врагов вокруг: ' + R.enemies.length }; },
  },

  // Кто больше набьёт за 5 минут
  race: {
    init(R) { R.mp.dur = 300; R.diff.rate *= 1.3 * (1 + 0.3 * (R.pl.length - 1)); },
    tick(R, dt) {
      MP.use(pick(MP.alive(R)) || R.pl[0]);
      updateSpawns(R, dt);
      if (R.t >= R.mp.dur && !R.ending) {
        const best = R.pl.slice().sort((a, b) => b.score - a.score)[0];
        const tie = R.pl.filter(p => p.score === best.score).length > 1;
        MP.win(tie ? 'НИЧЬЯ!' : best.name + ' ПОБЕДИЛ!', tie ? null : best);
      }
    },
    hud(R, me) {
      const lead = R.pl.slice().sort((a, b) => b.score - a.score)[0];
      return { tm: fmtTime(R.mp.dur - R.t), ob: 'Твои очки: ' + me.score + (lead && lead !== me ? ' · лидер: ' + lead.name + ' (' + lead.score + ')' : ' · ты лидер!') };
    },
  },

  // Генератор в центре, 6 волн
  defense: {
    init(R) {
      const n = R.pl.length, hp = Math.round(1400 * (1 + 0.5 * (n - 1)));
      R.mp.base = { isBase: true, x: 0, y: 0, r: 16, hp, maxHp: hp, vx: 0, vy: 0, moving: false, dirX: 0, dirY: 1, invT: 0, dashT: 0, ramT: 0, flash: 0, dead: false, magnet: 0, slot: -1, name: 'Генератор', armor: 0, dodge: 0 };
      Object.assign(R.mp, { wave: 0, waves: 6, phase: 'rest', wt: 8, rateMul: 1 + 0.5 * (n - 1), vt: 40 });
      R.diff.hp *= 1 + 0.2 * (n - 1);
    },
    tick(R, dt) {
      const M = R.mp, B = M.base;
      B.invT -= dt; B.flash -= dt;
      MP.use(B);
      if (M.phase === 'rest') {
        B.hp = Math.min(B.maxHp, B.hp + B.maxHp * 0.02 * dt);
        if ((M.wt -= dt) <= 0) {
          M.wave++; M.phase = 'wave'; M.wt = 35 + M.wave * 5; M.acc = 0; M.vt = 40 + M.wave * 75; M.elite = false;
          UI.banner('ВОЛНА ' + M.wave + ' ИЗ ' + M.waves + '!', 2);
          Sound.sfx('warn');
          const k = 10 + M.wave * 4, type = weightedPick({ zombie: R.loc.weights.zombie, rat: R.loc.weights.rat });
          for (let i = 0; i < k; i++) spawnAround(R, type, i / k * Math.PI * 2);
          if (M.wave === M.waves) { spawnBoss(R, R.loc.boss, 0.45 * (1 + 0.5 * (R.pl.length - 1))); UI.banner('ПОСЛЕДНЯЯ ВОЛНА: ' + BOSSES[R.loc.boss].name + '!', 3); }
        }
      } else if (M.phase === 'wave') {
        M.wt -= dt;
        if (M.wt > 0) {
          M.acc += (1 + M.wave * 0.45) * M.rateMul * dt;
          while (M.acc >= 1) { M.acc -= 1; if (R.enemies.length < 300) spawnAround(R, pickEnemyType(R)); }
          if (!M.elite && M.wt < 20) { M.elite = true; spawnElite(R); }
        } else {
          const left = R.enemies.filter(e => !e.dead).length;
          if (!left) {
            if (M.wave >= M.waves) { R.coins += 80; MP.win('БАЗА ОТСТОЯЛА!'); return; }
            M.phase = 'rest'; M.wt = 10;
            for (const k of R.pickups) if (!k.static) k.mag = true;
            UI.banner('ВОЛНА ОТБИТА! Генератор чинится', 2);
            Sound.sfx('chest');
          } else if (left <= 8) for (const e of R.enemies) if (!e.dead && !e.hunt && !e.boss) { e.hunt = true; e.speed = Math.max(e.speed * 1.5, 45); }
        }
      }
      updateEvent(R, dt);
    },
    hud(R) {
      const M = R.mp, hp = Math.ceil(M.base.hp / M.base.maxHp * 100);
      return { tm: 'ВОЛНА ' + Math.max(1, M.wave) + '/' + M.waves,
        ob: (M.phase === 'rest' ? 'Следующая волна через ' + Math.ceil(M.wt) + ' с · ' : M.wt > 0 ? 'Защитите генератор! · ' : 'Добейте остатки волны! · ') + 'генератор: ' + hp + '%' };
    },
  },

  // Огромный босс на всех
  boss: {
    arena(id) { return id === 'alan' ? 'gates' : (LOCATIONS.find(l => l.boss === id) || LOCATIONS.find(l => l.id === 'japan')).id; },
    init(R, cfg) {
      for (const p of R.pl) { MP.use(p); rushBuild(R, cfg.power || 2); recalcStats(); p.hp = p.maxHp; }
      R.mp.spawnAt = 3; R.mp.acc = 0;
    },
    tick(R, dt) {
      const M = R.mp, alive = MP.alive(R), n = R.pl.length;
      if (!alive.length) return;
      if (!R.bossSpawned && R.t >= M.spawnAt) {
        MP.use(pick(alive));
        const mul = { 1: 0.15, 2: 0.4, 3: 0.8 }[M.cfg.power || 2] * 1.8 * (0.6 + 0.4 * n);
        spawnBoss(R, M.cfg.boss, mul);
        const b = R.boss;
        // рейдовый босс: крупнее, злее и быстрее обычного
        b.sc *= 1.6; b.r *= 1.5; b.dmg *= 1.3; b.speed *= 1.15;
        for (const a of b.attacks) { a.cd *= 0.8; a.t = a.cd * 0.6; }
        UI.banner('РЕЙД: ' + b.def.name + '!', 3);
      }
      const b = R.boss;
      if (b && !b.dead && !b.phase2 && b.hp < b.maxHp * 0.25) {
        b.phase2 = true;
        for (const a of b.attacks) a.cd *= 0.75;
        MP.use(pick(alive)); spawnElite(R); spawnElite(R);
        R.shake = 6; Sound.sfx('roar');
        UI.banner('ПОСЛЕДНЯЯ ФАЗА!', 2);
      }
      // мелочь, чтобы было чем заряжать ульты
      M.acc += 0.6 * n * dt;
      while (M.acc >= 1) { M.acc -= 1; if (R.enemies.length < 22) { MP.use(pick(alive)); spawnAround(R, pickEnemyType(R)); } }
    },
    hud(R) { const b = R.boss; return { tm: R.bossSpawned ? 'РЕЙД' : 'ГОТОВЬТЕСЬ', ob: b && !b.dead ? 'Все против ' + b.def.name + (b.phase2 ? ' · последняя фаза!' : '') : '' }; },
  },

  // Каждый сам за себя, кольцо сжимается
  pvp: {
    init(R, cfg) {
      R.mp.zr = 240;
      const def = { sprite: 'zombie', armor: 0, color: '#f4f4f4', xp: 0, ai: 'pvp' };
      for (const p of R.pl) {
        MP.use(p); rushBuild(R, cfg.power || 2); recalcStats(); p.hp = p.maxHp;
        p.av = { pvp: p, def, type: 'pvp', x: p.x, y: p.y, r: 6, hp: 1e9, maxHp: 1e9, sc: 1, kvx: 0, kvy: 0, flash: 0, face: 1, anim: 0, dead: false, slowT: 0, stunT: 0 };
        R.enemies.push(p.av);
      }
      R.bossSpawned = true;
    },
    tick(R, dt) {
      const M = R.mp;
      M.zr = Math.max(55, 240 - Math.max(0, R.t - 15) * 1.9);
      for (const p of R.pl) {
        const av = p.av;
        if (!av) continue;
        av.x = p.x; av.y = p.y; av.dead = p.dead; av.kvx = av.kvy = 0;
        if (av.stunT > 0) { MP.personal(p, 'stun', Math.min(av.stunT, 1.5)); av.stunT = 0; }
        if (av.slowT > 0) av.slowT = 0;
        if (p.dead) continue;
        // за кольцом жжёт
        if (Math.hypot(p.x, p.y) > M.zr) {
          p.zoneT = (p.zoneT || 0) - dt;
          if (p.zoneT <= 0) { p.zoneT = 0.5; MP.damage(R, p, 6, null); }
        }
      }
    },
    hud(R) { return { tm: fmtTime(R.t), ob: 'Останется один! В живых: ' + MP.alive(R).length + (R.t > 15 ? ' · кольцо сжимается' : '') }; },
  },
};

// ================================================================ ПЕРЕХВАТ ОБЩЕГО КОДА ИГРЫ
// Всё ниже срабатывает только в сетевом забеге (R.mp), одиночная игра идёт как раньше.
(function () {
  const hp = hurtPlayer;
  hurtPlayer = function (R, dmg) { if (R.mp) return MP.hurt(R, R.p, dmg); return hp(R, dmg); };
  const he = hurtEnemy;
  hurtEnemy = function (R, e, dmg, kx, ky, kb) { if (e.pvp) return R.mp && MP.pvpHit(R, e, dmg, kx, ky, kb); return he(R, e, dmg, kx, ky, kb); };
  const ke = killEnemy;
  killEnemy = function (R, e) {
    if (R.mp && !e.dead && R.p && !R.p.isBase) { R.p.kills++; R.p.score += e.boss ? 100 : e.elite ? 25 : 1; }
    return ke(R, e);
  };
  // опыт общий: каждый получает его со своим множителем; чем больше героев, тем меньше с кристалла
  const ax = addXp;
  addXp = function (R, v) {
    if (!R.mp) return ax(R, v);
    const cur = R.p, k = 1 / (0.6 + 0.4 * R.pl.length);
    MP.quiet(() => { for (const q of R.pl) { R.p = q; ax(R, v * k); } });
    R.p = cur;
    Sound.sfx('gem');
  };
  const col = collect;
  collect = function (R, k) {
    if (R.mp && k.type === 'altar') {
      // тёмный алтарь — личный выбор того, кто подошёл
      k.done = true;
      const p = R.p;
      if (p.offer) return;
      p.offer = [{ kind: 'pact', id: 'power' }, { kind: 'pact', id: 'greed' }, { kind: 'pact', id: 'skip' }];
      p.offerKind = 'altar'; p.offerT = 12; p.offerSeq++;
      Sound.sfx('necro');
      return;
    }
    if (R.mp && k.type === 'merchant') { k.done = true; return; }
    return col(R, k);
  };
  const se = startEvent;
  startEvent = function (R) {
    if (!R.mp) return se(R);
    // торговец в сетевой игре не приходит — вместо него сундук
    const ev = Math.random();
    if (ev < 0.25) { R.storm = 12; R.stormT = 0; UI.banner('РАДИОАКТИВНАЯ БУРЯ!', 2); Sound.sfx('roar'); }
    else if (ev < 0.45) { R.gold = 15; UI.banner('ЗОЛОТАЯ ЛИХОРАДКА!', 2); Sound.sfx('chest'); }
    else if (ev < 0.8) { dropNear(R, { type: 'chest', spr: 'chest' }, 150); UI.banner('Рядом появился сундук!', 2); Sound.sfx('coin'); }
    else { dropNear(R, { type: 'altar', spr: 'altar' }, 150); UI.banner('Появился тёмный алтарь...', 2); Sound.sfx('necro'); }
  };
  // разряд бури бьёт всех героев в круге, а не только «текущего»
  const st = strike;
  strike = function (R, ef) {
    if (!R.mp) return st(R, ef);
    const cur = R.p, rr = ef.r + 4;
    // сам разряд — «герой» далеко, чтобы не задеть текущего дважды (характеристики берутся от него — иначе урон по врагам падал)
    R.p = Object.assign(Object.create(cur || R.pl[0]), { x: 1e9, y: 1e9 });
    st(R, ef);
    for (const p of MP.alive(R)) if (dist2(p.x, p.y, ef.x, ef.y) < rr * rr) MP.hurt(R, p, 14);
    R.p = cur;
  };
  const sb = spawnBoss;
  spawnBoss = function (R, id, mul) { return sb(R, id, R.mp && R.mp.bossMul ? (mul || 1) * R.mp.bossMul : mul); };
  const bt = Story.bossTalk.bind(Story);
  Story.bossTalk = (R, def) => { if (!R.mp) bt(R, def); };
  const dtm = diffTime;
  diffTime = function (R) { if (R.mp) return R.mp.mode === 'defense' ? R.mp.vt : R.t * (R.mp.vtMul || 1); return dtm(R); };

  // запись звуков, надписей и музыки хозяина — гости воспроизводят их у себя
  const after = (obj, name, fn) => { const orig = obj[name]; obj[name] = function (...a) { const r = orig.apply(this, a); if (MP.rec && MP.ev) fn(a); return r; }; };
  after(Sound, 'sfx', a => MP.ev.sfx.add(a[0]));
  after(Sound, 'shout', a => MP.ev.sfx.add('@s:' + a[0]));
  after(Sound, 'cheer', a => MP.ev.sfx.add('@c:' + a[0]));
  after(Sound, 'startMusic', a => { MP.ev.mus = a[0]; MP.music = a[0]; });
  after(Sound, 'stopMusic', () => { MP.ev.mus = ''; });
  after(UI, 'banner', a => MP.ev.ban.push([a[0], a[1]]));

  // лагерь друзей: свои постройки и мощёная площадь
  const cd = chunkDecor;
  chunkDecor = function (loc, i, j) { return loc.lobby ? MP.lobbyChunk(i, j) : cd(loc, i, j); };
  const dg = drawGround;
  drawGround = function (ctx, loc, cx, cy, W, H) {
    dg(ctx, loc, cx, cy, W, H);
    if (!loc.lobby) return;
    const st2 = TILES.hubStone;
    for (let ty = Math.floor(cy / 16); ty <= Math.floor((cy + H) / 16); ty++) for (let tx = Math.floor(cx / 16); tx <= Math.floor((cx + W) / 16); tx++) {
      if (MP.paved.has(tx + ',' + ty)) ctx.drawImage(st2[Math.floor(hash01(tx, ty, 5) * 6)], tx * 16 - cx, ty * 16 - cy);
    }
  };
  // генератор и надгробия погибших — в общем порядке отрисовки (по глубине)
  const cl = collectDecor;
  collectDecor = function (ctx, loc, cx, cy, W, H, list, lights) {
    cl(ctx, loc, cx, cy, W, H, list, lights);
    const R = Game.run;
    if (!R || !R.mp || Game.state !== 'mp') return;
    const B = R.mp.base;
    if (B) { list.push({ y: B.y + 8, k: 0, o: { name: 'machine', x: B.x, y: B.y + 8, s: 2.2, flip: false } }); lights.push({ x: B.x - cx, y: B.y - 10 - cy, r: 46, c: '#73eff7', a: 0.45 }); }
    for (const t of R.mp.tombs || []) list.push({ y: t.y, k: 0, o: { name: 'tomb', x: t.x, y: t.y, s: 1, flip: false } });
  };
  const ov = drawOverlay;
  drawOverlay = function (ctx, R, cx, cy, W, H) {
    if (R.mp && R.loc.lobby) {
      // вихри в арках порталов
      const now = performance.now() / 1000;
      for (const id in MP_MODES) {
        const M = MP_MODES[id];
        if (M.spr !== 'h_portal') continue;
        const px = M.x - cx, py = M.y - 13 - cy;
        ctx.fillStyle = '#14162a'; ctx.fillRect(Math.round(px - 6), Math.round(py - 8), 12, 20);
        for (let i = 0; i < 22; i++) {
          const a = now * 3 + i * 0.55, r = 1 + (i % 11) * 0.9;
          ctx.fillStyle = i % 3 ? M.tint : '#f4f4f4';
          ctx.fillRect(Math.round(px + Math.cos(a) * r * 0.6), Math.round(py + 2 + Math.sin(a) * r), 1, 1);
        }
        if (MP.near === id) { ctx.globalAlpha = 0.6 + Math.sin(now * 8) * 0.3; pxCircle(ctx, M.x - cx, M.y - cy + 1, 18, '#ffcd75'); ctx.globalAlpha = 1; }
      }
      if (MP.near === 'hero') { ctx.globalAlpha = 0.6 + Math.sin(now * 8) * 0.3; pxCircle(ctx, -cx, 7 - cy, 16, '#ffcd75'); ctx.globalAlpha = 1; }
    }
    ov(ctx, R, cx, cy, W, H);
    if (!R.mp) return;
    // кольцо арены
    if (R.mp.zr) {
      const t = performance.now() / 1000;
      ctx.globalAlpha = 0.7 + Math.sin(t * 6) * 0.2;
      pxCircle(ctx, -cx, -cy, R.mp.zr, '#ef3b5b'); pxCircle(ctx, -cx, -cy, R.mp.zr + 1, '#b13e53');
      ctx.globalAlpha = 1;
    }
    // полоска генератора
    const B = R.mp.base;
    if (B) {
      const bx = Math.round(B.x - 16 - cx), by = Math.round(B.y - 34 - cy), q = Math.max(0, B.hp / B.maxHp);
      ctx.fillStyle = '#14162a'; ctx.fillRect(bx - 1, by - 1, 34, 5);
      ctx.fillStyle = B.flash > 0 ? '#f4f4f4' : q < 0.3 ? '#ef3b5b' : '#73eff7'; ctx.fillRect(bx, by, Math.round(32 * q), 3);
      const sx = B.x - cx, sy = B.y - cy;
      if ((sx < 0 || sx > W || sy < 0 || sy > H) && Math.floor(performance.now() / 250) % 2) {
        const ax = clamp(sx, 8, W - 9), ay = clamp(sy, 8, H - 9);
        pxDisc(ctx, ax, ay, 4, '#14162a'); pxDisc(ctx, ax, ay, 3, '#73eff7');
      }
    }
    // товарищи за краем экрана
    for (const p of R.pl) {
      if (p.dead || p === R.p) continue;
      const sx = p.x - cx, sy = p.y - cy;
      if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) continue;
      const ax = clamp(sx, 6, W - 7), ay = clamp(sy, 6, H - 7);
      pxDisc(ctx, ax, ay, 3, '#14162a'); pxDisc(ctx, ax, ay, 2, R.mp.mode === 'pvp' ? '#ef3b5b' : '#a7f070');
    }
  };
})();
