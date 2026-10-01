// ===== Сохранения: контрольные точки на этапах сюжетной карты и код сохранения для переноса =====

// ---------------------------------------------------------------- КОНТРОЛЬНЫЕ ТОЧКИ
// Каждый новый этап сюжетной карты записывает сборку героя. Вышел, погиб или закрыл вкладку —
// в следующий раз можно продолжить с начала этого этапа, а не с первой волны.
const Checkpoint = {
  get() { return Save.data.cp || null; },
  forLoc(id) { const cp = this.get(); return cp && cp.loc === id ? cp : null; },
  clear() { Save.data.cp = null; Save.store(); },

  write(R) {
    const p = R.p, st = R.st, d = Save.data;
    // монеты забега сразу уходят в сохранение, чтобы при продолжении их не посчитать дважды
    d.coins += R.coins - R.savedCoins;
    R.savedCoins = R.coins;
    d.cp = {
      loc: st.base.id, hero: R.ch.id, n: st.n, nightmare: R.nightmare, at: Date.now(),
      kills: R.kills, t: R.t, coins: R.coins, bestCombo: R.bestCombo, chests: R.chests, pacts: R.pacts, eliteKills: R.eliteKills,
      dmgBy: Object.assign({}, R.dmgBy), dmgTaken: R.dmgTaken,
      p: { weapons: p.weapons.map(w => ({ id: w.id, lvl: w.lvl, evo: !!w.evo })), passives: Object.assign({}, p.passives),
        level: p.level, xp: p.xp, xpNext: p.xpNext, baseHp: p.baseHp, dmgBase: p.dmgBase, hp: p.hp, ult: p.ult },
    };
    Save.store();
  },

  // Новый забег на карте и сразу переход на сохранённый этап
  resume(cp) {
    Game.start(cp.hero, cp.loc, { nightmare: !!cp.nightmare && Campaign.done() });
    const R = Game.run, p = R.p, st = R.st, c = cp.p;
    if (!st) return;
    p.weapons = c.weapons.map(w => ({ id: w.id, lvl: w.lvl, evo: w.evo, t: 0.3, ang: 0 }));
    p.passives = Object.assign({}, c.passives);
    p.level = c.level; p.xp = c.xp; p.xpNext = c.xpNext;
    p.baseHp = c.baseHp; p.dmgBase = c.dmgBase; p.ult = c.ult;
    recalcStats();
    Object.assign(R, { kills: cp.kills, t: cp.t, coins: cp.coins, savedCoins: cp.coins, bestCombo: cp.bestCombo,
      chests: cp.chests, pacts: cp.pacts, eliteKills: cp.eliteKills, dmgBy: Object.assign({}, cp.dmgBy), dmgTaken: cp.dmgTaken });
    // этап «до» сохранённого: переход через ворота строит нужную часть карты (клетку, логово босса)
    st.n = cp.n - 1; st.wave = (cp.n - 1) * 2 - 1;
    Stage.nextStage(R);
    p.hp = Math.min(p.maxHp, c.hp);
    UI.banner('ПРОДОЛЖАЕМ: ЭТАП ' + cp.n, 2.5);
  },

  // Перед входом в портал: продолжить с этапа или начать карту заново
  ask(cp, fresh) {
    const ch = CHARACTERS.find(c => c.id === cp.hero) || CHARACTERS[0];
    const loc = LOCATIONS.find(l => l.id === cp.loc);
    Game.state = 'menu';
    $('story-title').textContent = loc.name;
    $('story-text').innerHTML = `<p>Есть сохранение на этой карте. Продолжить с него или начать с первой волны?</p>
      <button class="btn gift" data-a="go"><img src="${iconURL(ch.sprite, 32)}" alt=""><span><b>Продолжить: этап ${cp.n} из 3</b><br>
        <small>${ch.name} · уровень ${cp.p.level} · оружие: ${cp.p.weapons.length} · убито ${cp.kills}</small></span></button>
      <button class="btn gift" data-a="new"><img src="${iconURL('i_skull', 32)}" alt=""><span><b>Начать заново</b><br>
        <small>Сохранение этой карты сотрётся. Герой — тот, что выбран у костра</small></span></button>`;
    const b = $('story-next');
    b.style.display = ''; b.textContent = 'Назад';
    b.onclick = () => { UI.click(); Hub.enter(); };
    $('story-text').querySelectorAll('button').forEach(el => {
      el.onclick = () => {
        UI.click();
        if (el.dataset.a === 'go') this.resume(cp);
        else { this.clear(); fresh(); }
      };
    });
    UI.show('story');
  },

  init() {
    // переход в ворота — новая контрольная точка
    const next = Stage.nextStage.bind(Stage);
    Stage.nextStage = R => { next(R); if (R.st && !R.mp) this.write(R); };

    // победа на карте — её сохранение больше не нужно
    const fin = finishRun;
    finishRun = R => {
      if (R.st && R.won) { const cp = this.forLoc(R.st.base.id); if (cp) Save.data.cp = null; }
      fin(R);
    };

    // портал в лагере: если на этой карте есть сохранение — спросить
    const use = Hub.use.bind(Hub);
    Hub.use = () => {
      const z = Hub.near;
      const cp = z && z.kind === 'portal' && !Hub.locked(z) && Game.state === 'hub' ? this.forLoc(z.id) : null;
      if (!cp) return use();
      Sound.init(); UI.click();
      this.ask(cp, () => { const d = Save.data; Game.start(d.hero, z.id, { nightmare: !!d.nightmare && Campaign.done() }); });
    };
    const prompt = Hub.prompt.bind(Hub);
    Hub.prompt = () => {
      prompt();
      const z = Hub.near, cp = z && z.kind === 'portal' ? this.forLoc(z.id) : null;
      if (cp) $('hub-desc').textContent += ' · Сохранение: этап ' + cp.n + ' из 3';
    };

    // экран итогов: «ещё раз» продолжает с сохранённого этапа
    const showEnd = UI.showEnd.bind(UI);
    UI.showEnd = R => {
      showEnd(R);
      const cp = R.st && !R.won ? this.forLoc(R.st.base.id) : null, again = $('btn-again');
      again.textContent = cp ? 'С ЭТАПА ' + cp.n : 'ЕЩЁ РАЗ';
      again.onclick = () => {
        UI.click();
        const c = Game.run && Game.run.st && !Game.run.won ? this.forLoc(Game.run.st.base.id) : null;
        if (c) this.resume(c); else { const G = Game.run; Game.start(G.ch.id, G.loc.id, Game.lastOpts); }
      };
    };

    SaveCode.init();
  },
};

// ---------------------------------------------------------------- КОД СОХРАНЕНИЯ
// Весь прогресс в одной строке: скопировал на компьютере — вставил на телефоне
const SaveCode = {
  b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); },
  unb64(str) { const s = atob(str), out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
  async pipe(bytes, stream) {
    const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
    return new Uint8Array(await res.arrayBuffer());
  },

  async make() {
    const bytes = new TextEncoder().encode(JSON.stringify(Save.data));
    if (typeof CompressionStream === 'function') {
      try { return 'WL1-' + this.b64(await this.pipe(bytes, new CompressionStream('deflate'))); } catch (e) { /* ниже — без сжатия */ }
    }
    return 'WL0-' + this.b64(bytes);
  },

  async read(code) {
    code = code.replace(/\s+/g, '');
    const m = /^WL([01])-([A-Za-z0-9+/=]+)$/.exec(code);
    if (!m) throw new Error('Это не код сохранения Wasteland Legends');
    let bytes = this.unb64(m[2]);
    if (m[1] === '1') {
      if (typeof DecompressionStream !== 'function') throw new Error('Этот браузер не умеет читать сжатый код');
      bytes = await this.pipe(bytes, new DecompressionStream('deflate'));
    }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data.coins !== 'number' || !data.settings) throw new Error('Код повреждён');
    return data;
  },

  async show() {
    UI.click();
    const box = $('sc-code'), msg = $('sc-msg');
    msg.textContent = '';
    $('sc-in').value = '';
    $('sc-load').disabled = true;
    box.value = 'Готовлю код...';
    UI.show('savecode');
    box.value = await this.make();
    const d = Save.data, n = CHARACTERS.filter(c => Campaign.heroOpen(c.id)).length;
    $('sc-info').textContent = `В коде: ${d.coins} монет, героев в отряде: ${n}, сюжет: ${Campaign.done() ? 'пройден' : 'глава ' + (Campaign.s().step + 1)}.`;
  },

  init() {
    $('btn-savecode').onclick = () => this.show();
    $('sc-copy').onclick = async () => {
      UI.click();
      const box = $('sc-code');
      try { await navigator.clipboard.writeText(box.value); $('sc-msg').textContent = 'Код скопирован!'; }
      catch (e) { box.select(); document.execCommand('copy'); $('sc-msg').textContent = 'Код выделен — скопируй его (Ctrl+C)'; }
    };
    $('sc-in').oninput = () => { $('sc-load').disabled = !$('sc-in').value.trim(); $('sc-load').dataset.sure = ''; $('sc-load').textContent = 'Загрузить'; };
    $('sc-load').onclick = async () => {
      UI.click();
      const btn = $('sc-load'), msg = $('sc-msg');
      let data;
      try { data = await this.read($('sc-in').value); }
      catch (e) { msg.textContent = 'Ошибка: ' + e.message; return; }
      // второе нажатие подтверждает: текущий прогресс на этом устройстве заменится
      if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'Заменить прогресс?'; msg.textContent = `В коде ${data.coins} монет. Нажми ещё раз, чтобы загрузить — текущий прогресс заменится.`; return; }
      try {
        localStorage.setItem('wl_save_backup', localStorage.getItem('wl_save') || '');
        localStorage.setItem('wl_save', JSON.stringify(data));
      } catch (e) { msg.textContent = 'Не удалось записать сохранение'; return; }
      location.reload();
    };
    $('sc-back').onclick = () => { UI.click(); Settings.show(); };
  },
};
