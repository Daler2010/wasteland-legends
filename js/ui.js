// ===== Интерфейс: меню, выбор героя/локации, магазин, HUD =====
const $ = id => document.getElementById(id);
const BACK = { char: 'menu', loc: 'char', shop: 'menu', help: 'menu', ach: 'menu' };

const UI = {
  current: null, selChar: null, levelOpts: null, hud: {}, bannerTimer: null,

  init() {
    document.querySelectorAll('img[data-icon]').forEach(img => { img.src = iconURL(img.dataset.icon, 32); });
    $('menu-heroes').innerHTML = CHARACTERS.map(c => `<img src="${iconURL(c.sprite, 96)}" alt="${c.name}">`).join('');

    $('btn-play').onclick = () => { this.click(); this.showChar(); };
    $('btn-shop').onclick = () => { this.click(); this.showShop(); };
    $('btn-help').onclick = () => { this.click(); this.show('help'); };
    $('btn-ach').onclick = () => { this.click(); this.showAch(); };
    document.querySelectorAll('[data-back]').forEach(b => { b.onclick = () => { this.click(); this.show(b.dataset.back); }; });
    $('btn-pause').onclick = () => Game.pause();
    $('btn-ult').addEventListener('pointerdown', e => { e.preventDefault(); Input.ultQ = true; });
    $('btn-dash').addEventListener('pointerdown', e => { e.preventDefault(); Input.dashQ = true; });
    $('btn-resume').onclick = () => { this.click(); Game.resume(); };
    $('btn-quit').onclick = () => { Game.quit(); this.click(); };
    $('btn-endless').onclick = () => { this.click(); Game.continueEndless(); };
    $('btn-again').onclick = () => { this.click(); const R = Game.run; Game.start(R.ch.id, R.loc.id, Game.lastOpts); };
    $('btn-menu').onclick = () => { Game.quit(); this.click(); };
    document.querySelectorAll('.tgl-music').forEach(b => { b.onclick = () => this.toggle('music'); });
    document.querySelectorAll('.tgl-sfx').forEach(b => { b.onclick = () => this.toggle('sfx'); });
    this.refreshToggles();

    Input.onKey = e => this.onKey(e);
    this.showMenu();
  },

  click() { Sound.init(); Sound.sfx('click'); },

  show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
    this.current = name;
    // во время игры фокус не должен оставаться на кнопках (пробел = рывок)
    if (!name && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const first = name && document.querySelector('#scr-' + name + ' button');
    if (first && matchMedia('(hover: hover)').matches) first.focus({ preventScroll: true });
  },

  showMenu() {
    document.querySelectorAll('.coin-count').forEach(el => { el.textContent = Save.data.coins; });
    this.show('menu');
  },

  showHUD(on) { $('hud').classList.toggle('hidden', !on); this.hud = {}; },

  toggle(what) {
    Sound.init();
    Save.data.settings[what] = !Save.data.settings[what];
    Save.store();
    Sound.applySettings();
    this.refreshToggles();
    Sound.sfx('click');
  },
  refreshToggles() {
    const s = Save.data.settings;
    document.querySelectorAll('.tgl-music').forEach(b => { b.textContent = 'Музыка: ' + (s.music ? 'вкл' : 'выкл'); });
    document.querySelectorAll('.tgl-sfx').forEach(b => { b.textContent = 'Звуки: ' + (s.sfx ? 'вкл' : 'выкл'); });
  },

  onKey(e) {
    Sound.init();
    const esc = e.code === 'Escape' || e.code === 'KeyP';
    if (e.code === 'KeyM') { this.toggle('music'); return; }
    if (Game.state === 'playing' && esc) { Game.pause(); return; }
    if (Game.state === 'paused' && esc) { Game.resume(); return; }
    if (Game.state === 'levelup' && this.levelOpts) {
      const i = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code) % 3;
      if (i >= 0 && this.levelOpts[i]) Game.choose(this.levelOpts[i]);
      return;
    }
    if (Game.state === 'menu' && e.code === 'Escape' && BACK[this.current]) { this.click(); this.show(BACK[this.current]); }
  },

  // ---------- Достижения и рекорды ----------
  achRow(a, done) {
    return `<div class="ach-row ${done ? 'done' : ''}">
      <span class="mark">${done ? '★' : '·'}</span>
      <div class="shop-info"><div class="card-name">${a.name}</div><div class="muted">${a.desc}</div></div>
      <span class="reward">+${a.coins} ◉</span>
    </div>`;
  },
  showAch() {
    const d = Save.data, b = d.best;
    $('rec-stats').innerHTML = `
      <span>Лучшее время</span><b>${fmtTime(b.time || 0)}</b>
      <span>Макс. убийств</span><b>${b.kills || 0}</b>
      <span>Макс. уровень</span><b>${b.level || 0}</b>
      <span>Лучшее комбо</span><b>x${b.combo || 0}</b>
      <span>Бесконечный режим</span><b>${b.endless ? fmtTime(b.endless) : '—'}</b>
      <span>Победы героев</span><b>${CHARACTERS.filter(c => d.wins[c.id]).map(c => c.name).join(', ') || '—'}</b>
      <span>Пройдено локаций</span><b>${LOCATIONS.filter(l => d.cleared[l.id]).length} / ${LOCATIONS.length}</b>`;
    $('ach-count').textContent = ACHIEVEMENTS.filter(a => d.ach[a.id]).length + '/' + ACHIEVEMENTS.length;
    $('ach-list').innerHTML = ACHIEVEMENTS.map(a => this.achRow(a, d.ach[a.id])).join('');
    this.show('ach');
  },

  // ---------- Выбор героя ----------
  showChar() {
    const d = Save.data;
    $('char-cards').innerHTML = CHARACTERS.map(c => {
      const W = WEAPONS[c.weapon];
      const alt = d.wins[c.id] && d.costume[c.id];
      const costume = d.wins[c.id]
        ? `<span class="costume-tgl" data-c="${c.id}">Костюм: ${alt ? COSTUMES[c.id] : 'обычный'}</span>`
        : `<span class="costume-lock">Костюм «${COSTUMES[c.id]}» — победи босса этим героем</span>`;
      return `<button class="card" data-id="${c.id}">
        <img class="portrait" src="${pixArtURL(c.id, alt)}" style="background: radial-gradient(circle at 50% 40%, ${HERO_TINT[c.id]}, #14162a)" alt="">
        <div class="card-name">${c.name}</div>
        <div class="card-tag">${c.title}</div>
        <div class="stats">
          <span>HP</span><b>${c.hp}</b>
          <span>Скорость</span><b>${c.speed}</b>
          <span>Броня</span><b>${c.armor}</b>
          ${c.regen ? `<span>Лечение</span><b>${c.regen}/с</b>` : ''}
        </div>
        <div class="weapon-line"><img src="${iconURL(W.icon, 24)}" alt=""> ${W.name}</div>
        <div class="boss-line">Ульта: <b>${ULTS[c.id].name}</b></div>
        ${costume}
        <p class="card-desc">${c.desc}</p>
      </button>`;
    }).join('');
    $('char-cards').querySelectorAll('.costume-tgl').forEach(el => {
      el.onclick = e => {
        e.stopPropagation();
        d.costume[el.dataset.c] = !d.costume[el.dataset.c];
        Save.store(); this.click(); this.showChar();
      };
    });
    $('char-cards').querySelectorAll('.card').forEach(el => {
      el.onclick = () => { this.click(); this.selChar = el.dataset.id; this.showLoc(); };
    });
    this.show('char');
  },

  // ---------- Выбор локации ----------
  showLoc() {
    $('loc-cards').innerHTML = LOCATIONS.map(l => {
      const B = BOSSES[l.boss], done = Save.data.cleared[l.id];
      return `<button class="card" data-id="${l.id}">
        <div class="loc-preview" style="background:${l.ground.base}">
          <img src="${iconURL(B.sprite, 72)}" alt="">
        </div>
        <div class="card-name">${l.name}</div>
        ${done ? '<div class="card-tag gold">◆ Осколок Врат получен</div>' : '<div class="card-tag">◇ Осколок у босса</div>'}
        ${Save.data.clearedN[l.id] ? '<div class="card-tag red">☠ Кошмар пройден</div>' : ''}
        <p class="card-desc">${l.desc}</p>
        <div class="boss-line">Босс: <b>${B.name}</b></div>
      </button>`;
    }).join('');
    $('loc-cards').querySelectorAll('.card').forEach(el => {
      const loc = LOCATIONS.find(l => l.id === el.dataset.id);
      el.onmouseenter = el.onfocus = () => { Game.menuLoc = loc; };
      el.onclick = () => {
        this.click();
        const d = Save.data;
        Game.start(this.selChar, loc.id, { nightmare: !!d.nightmare && Object.keys(d.wins).length > 0 });
      };
    });
    this.show('loc');
  },

  // ---------- Магазин ----------
  showShop() {
    const d = Save.data;
    document.querySelectorAll('.coin-count').forEach(el => { el.textContent = d.coins; });
    $('shop-list').innerHTML = META.map(m => {
      const lvl = Save.metaLvl(m.id), maxed = lvl >= m.max, cost = m.cost * (lvl + 1);
      const pips = Array.from({ length: m.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      return `<div class="shop-row">
        <img src="${iconURL(m.icon, 32)}" alt="">
        <div class="shop-info"><div class="card-name">${m.name}</div><div class="muted">${m.desc}</div><div class="pips">${pips}</div></div>
        <button class="btn small" data-id="${m.id}" ${maxed || d.coins < cost ? 'disabled' : ''}>${maxed ? 'МАКС' : cost + ' ◉'}</button>
      </div>`;
    }).join('');
    $('shop-list').querySelectorAll('button[data-id]').forEach(b => {
      b.onclick = () => {
        const m = META.find(x => x.id === b.dataset.id), lvl = Save.metaLvl(m.id), cost = m.cost * (lvl + 1);
        if (lvl >= m.max || d.coins < cost) return;
        d.coins -= cost;
        d.meta[m.id] = lvl + 1;
        Save.store();
        Sound.init(); Sound.sfx('buy');
        this.showShop();
        const again = $('shop-list').querySelector(`button[data-id="${m.id}"]`);
        if (again && !again.disabled) again.focus();
      };
    });
    if (this.current !== 'shop') this.show('shop');
  },

  // ---------- Новый уровень ----------
  optionInfo(o) {
    if (o.kind === 'weapon') {
      const W = WEAPONS[o.id];
      return { icon: W.icon, name: W.name, tag: o.lvl === 1 ? 'НОВОЕ!' : 'Ур. ' + o.lvl, desc: W.descs[o.lvl - 1], isNew: o.lvl === 1 };
    }
    if (o.kind === 'pact') {
      if (o.id === 'power') return { icon: 'i_potion', name: 'Сила крови', tag: 'СДЕЛКА', desc: '+25% урона навсегда, но −20% макс. HP', isNew: true };
      if (o.id === 'greed') return { icon: 'coin', name: 'Жадность', tag: 'СДЕЛКА', desc: '+30 монет, но −25 HP сейчас', isNew: true };
      return { icon: 'i_shield', name: 'Уйти', tag: '', desc: 'Не трогать алтарь' };
    }
    if (o.kind === 'evolve') {
      const W = WEAPONS[o.id];
      return { icon: W.icon, name: W.evo.name, tag: '★ ЭВОЛЮЦИЯ ★', desc: W.evo.desc, isNew: true, evo: true };
    }
    if (o.kind === 'passive') {
      const P = PASSIVES[o.id];
      return { icon: P.icon, name: P.name, tag: o.lvl === 1 ? 'НОВОЕ!' : 'Ур. ' + o.lvl, desc: P.desc, isNew: o.lvl === 1 };
    }
    if (o.kind === 'heal') return { icon: 'heart', name: 'Консервы', tag: '', desc: 'Восстановить 40 HP' };
    return { icon: 'coin', name: 'Мешок монет', tag: '', desc: '+15 монет' };
  },

  showLevelUp(opts, title) {
    this.levelOpts = opts;
    $('lvl-title').textContent = title || 'НОВЫЙ УРОВЕНЬ!';
    $('lvl-cards').innerHTML = opts.map((o, i) => {
      const inf = this.optionInfo(o);
      return `<button class="card lvl-card ${inf.evo ? 'evo' : ''}" data-i="${i}">
        <span class="key">${i + 1}</span>
        <img src="${iconURL(inf.icon, 48)}" alt="">
        <div class="card-name">${inf.name}</div>
        <div class="card-tag ${inf.isNew ? 'gold' : ''}">${inf.tag}</div>
        <p class="card-desc">${inf.desc}</p>
      </button>`;
    }).join('');
    $('lvl-cards').querySelectorAll('.card').forEach(el => {
      el.onclick = () => Game.choose(opts[+el.dataset.i]);
    });
    this.show('levelup');
  },

  buildList(R) {
    const p = R.p;
    const w = p.weapons.map(w => `<div class="slot"><img src="${iconURL(WEAPONS[w.id].icon, 32)}" alt=""><span>${wName(w)} · ${w.evo ? '★' : 'ур. ' + w.lvl}</span></div>`);
    const ps = Object.keys(p.passives).map(id => `<div class="slot"><img src="${iconURL(PASSIVES[id].icon, 32)}" alt=""><span>${PASSIVES[id].name} · ур. ${p.passives[id]}</span></div>`);
    return w.concat(ps).join('');
  },

  showPause(R) {
    $('pause-build').innerHTML = this.buildList(R);
    this.show('pause');
  },

  showEnd(R) {
    // бесконечный режим предлагается один раз — сразу после первой победы
    $('btn-endless').classList.toggle('hidden', !(R.won && !R.endless));
    $('end-title').textContent = R.endless ? 'КОНЕЦ ПУТИ' : R.won ? 'ПОБЕДА!' : 'ТЫ ПОГИБ';
    $('end-title').className = R.won ? 'gold' : 'red';
    $('end-stats').innerHTML = `
      <span>Герой</span><b>${R.ch.name}</b>
      <span>Локация</span><b>${R.loc.name}</b>
      <span>Время</span><b>${fmtTime(Math.min(R.t, RUN_TIME))}</b>
      <span>Уровень</span><b>${R.p.level}</b>
      <span>Убито</span><b>${R.kills}</b>
      <span>Лучшее комбо</span><b>x${R.bestCombo}</b>
      <span>Монеты</span><b class="gold">+${R.coins}${R.won ? ' (с бонусом)' : ''}</b>
      <span>Всего монет</span><b>${Save.data.coins}</b>`;
    $('end-ach').innerHTML =
      (R.newCostume ? `<div class="ach-row done"><span class="mark">★</span><div class="shop-info"><div class="card-name">Открыт костюм</div><div class="muted">${R.ch.name}: «${COSTUMES[R.ch.id]}»</div></div></div>` : '') +
      R.newAch.map(a => this.achRow(a, true)).join('');
    this.show('end');
  },

  banner(text, secs) {
    const el = $('banner');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => el.classList.add('hidden'), secs * 1000);
  },

  // ---------- HUD (обновляем только изменившееся) ----------
  set(id, prop, val) {
    const key = id + prop;
    if (this.hud[key] === val) return;
    this.hud[key] = val;
    if (prop === 'text') $(id).textContent = val;
    else $(id).style[prop] = val;
  },

  updateHUD(R) {
    const p = R.p;
    this.set('xpfill', 'width', Math.floor(p.xp / p.xpNext * 100) + '%');
    this.set('hpfill', 'width', Math.floor(p.hp / p.maxHp * 100) + '%');
    this.set('hptext', 'text', Math.ceil(p.hp) + '/' + p.maxHp);
    this.set('lvl', 'text', 'УР ' + p.level);
    const bossAlive = R.boss && !R.boss.dead;
    this.set('timer', 'text', bossAlive ? 'БОСС' : R.endless ? '∞ ' + fmtTime(R.t) : fmtTime(R.t));
    this.set('kills', 'text', String(R.kills));
    this.set('coins', 'text', String(R.coins));
    const ultPct = Math.floor(p.ult / p.ultCost * 100);
    if (this.hud.ult !== ultPct) {
      this.hud.ult = ultPct;
      const b = $('btn-ult');
      b.classList.toggle('ready', ultPct >= 100);
      b.style.setProperty('--fill', ultPct + '%');
      b.textContent = ultPct >= 100 ? 'УЛЬТА!' : ultPct + '%';
    }
    const sig = p.weapons.map(w => w.id + w.lvl + (w.evo ? 'e' : '')).join() + '|' + Object.entries(p.passives).join();
    if (this.hud.sig !== sig) {
      this.hud.sig = sig;
      const w = p.weapons.map(w => `<img class="${w.evo ? 'evo' : ''}" src="${iconURL(WEAPONS[w.id].icon, 32)}" title="${wName(w)}" alt="">`);
      const ps = Object.keys(p.passives).map(id => `<img src="${iconURL(PASSIVES[id].icon, 32)}" title="${PASSIVES[id].name}" alt="">`);
      $('slots').innerHTML = w.join('') + (ps.length ? '<br>' + ps.join('') : '');
    }
    const cd = p.dashCd > 0;
    if (this.hud.dashCd !== cd) { this.hud.dashCd = cd; $('btn-dash').classList.toggle('cd', cd); }
    const combo = R.combo >= 5 ? R.combo : 0;
    if (this.hud.combo !== combo) {
      this.hud.combo = combo;
      const el = $('combo');
      el.style.display = combo ? 'block' : 'none';
      el.textContent = 'x' + combo + ' КОМБО';
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    const b = R.boss, showBoss = !!(b && !b.dead);
    this.set('bossbar', 'display', showBoss ? 'block' : 'none');
    if (showBoss) {
      this.set('bossname', 'text', b.def.name);
      this.set('bossfill', 'width', Math.max(0, b.hp / b.maxHp * 100).toFixed(1) + '%');
    }
  },
};
