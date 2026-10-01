// ===== Дополнительные системы: таланты, испытание дня, сюжет, торговец, обучение, настройки, геймпад =====

// ---------------------------------------------------------------- ТАЛАНТЫ
// tier 1 доступен сразу, tier 2 — после 3 потраченных очков, tier 3 — после 8. Цена ранга = номер яруса.
// eff: что даёт один ранг (ключи читает createRun в game.js)
const TALENTS = {
  daler: [
    { id: 'aim',    tier: 1, max: 3, name: 'Меткость',      desc: '+4% шанс крита',               eff: { crit: 0.04 } },
    { id: 'step',   tier: 1, max: 3, name: 'Лёгкий шаг',    desc: '+4% скорость',                 eff: { spd: 0.04 } },
    { id: 'eye',    tier: 1, max: 3, name: 'Зоркий глаз',   desc: '+10% радиус сбора',            eff: { magnet: 0.1 } },
    { id: 'hands',  tier: 2, max: 3, name: 'Быстрые руки',  desc: '-4% перезарядка оружия',       eff: { cd: 0.04 } },
    { id: 'roll',   tier: 2, max: 3, name: 'Перекат',       desc: '-12% перезарядка рывка',       eff: { dash: 0.12 } },
    { id: 'hunter', tier: 2, max: 3, name: 'Охотник',       desc: '+10% урон по боссам и элите',  eff: { boss: 0.1 } },
    { id: 'volley', tier: 3, max: 3, name: 'Полный колчан', desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
    { id: 'master', tier: 3, max: 1, name: 'Мастер лука',   desc: 'Лук с самого начала 2 уровня', eff: { wlvl: 1 } },
  ],
  stimme: [
    { id: 'heal',   tier: 1, max: 3, name: 'Целительница',  desc: '+0.2 HP в секунду',            eff: { regen: 0.2 } },
    { id: 'voice',  tier: 1, max: 3, name: 'Сильный голос', desc: '+6% урон',                     eff: { dmg: 0.06 } },
    { id: 'charm',  tier: 1, max: 3, name: 'Обаяние',       desc: '+8% опыта',                    eff: { xp: 0.08 } },
    { id: 'echo',   tier: 2, max: 3, name: 'Эхо',           desc: '-4% перезарядка оружия',       eff: { cd: 0.04 } },
    { id: 'grace',  tier: 2, max: 3, name: 'Грация',        desc: '+4% скорость',                 eff: { spd: 0.04 } },
    { id: 'will',   tier: 2, max: 3, name: 'Королевская воля', desc: '+12 макс. HP',              eff: { hp: 12 } },
    { id: 'scream', tier: 3, max: 3, name: 'Высокая нота',  desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
    { id: 'aria',   tier: 3, max: 1, name: 'Распевка',      desc: 'Волна с самого начала 2 уровня', eff: { wlvl: 1 } },
  ],
  babaduk: [
    { id: 'temper', tier: 1, max: 3, name: 'Закалка',       desc: '+15 макс. HP',                 eff: { hp: 15 } },
    { id: 'rage',   tier: 1, max: 3, name: 'Ярость',        desc: '+6% урон',                     eff: { dmg: 0.06 } },
    { id: 'squire', tier: 1, max: 3, name: 'Оруженосец',    desc: '+10% радиус сбора',            eff: { magnet: 0.1 } },
    { id: 'plate',  tier: 2, max: 2, name: 'Латы',          desc: '+1 броня',                     eff: { armor: 1 } },
    { id: 'charge', tier: 2, max: 3, name: 'Натиск',        desc: '-12% перезарядка рывка',       eff: { dash: 0.12 } },
    { id: 'heavy',  tier: 2, max: 3, name: 'Тяжёлый удар',  desc: '+4% шанс крита',               eff: { crit: 0.04 } },
    { id: 'ram',    tier: 3, max: 3, name: 'Разбег',        desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
    { id: 'blade',  tier: 3, max: 1, name: 'Заточка',       desc: 'Меч с самого начала 2 уровня', eff: { wlvl: 1 } },
  ],
  maga: [
    { id: 'hide',   tier: 1, max: 3, name: 'Толстая шкура', desc: '+15 макс. HP',                 eff: { hp: 15 } },
    { id: 'horns',  tier: 1, max: 3, name: 'Острые рога',   desc: '+6% урон',                     eff: { dmg: 0.06 } },
    { id: 'nose',   tier: 1, max: 3, name: 'Бычий нюх',     desc: '+10% радиус сбора',            eff: { magnet: 0.1 } },
    { id: 'bull',   tier: 2, max: 3, name: 'Бычья сила',    desc: '+10% урон по боссам и элите',  eff: { boss: 0.1 } },
    { id: 'rush',   tier: 2, max: 3, name: 'Разгон',        desc: '-12% перезарядка рывка',       eff: { dash: 0.12 } },
    { id: 'beast',  tier: 2, max: 3, name: 'Звериная живучесть', desc: '+0.2 HP в секунду',       eff: { regen: 0.2 } },
    { id: 'quake',  tier: 3, max: 3, name: 'Тяжёлая поступь', desc: 'Ульта заряжается на 5 убийств быстрее', eff: { ult: 5 } },
    { id: 'labrys', tier: 3, max: 1, name: 'Заточка секиры', desc: 'Секира с самого начала 2 уровня', eff: { wlvl: 1 } },
  ],
};
const TIER_NEED = { 1: 0, 2: 3, 3: 8 };

function talentState(heroId) {
  const d = Save.data.talents;
  return d[heroId] || (d[heroId] = { pts: 0, ranks: {} });
}
function talentSpent(heroId) {
  const st = talentState(heroId);
  return TALENTS[heroId].reduce((s, t) => s + (st.ranks[t.id] || 0) * t.tier, 0);
}
// Суммарные бонусы героя от талантов
function talentBonus(heroId) {
  const out = { hp: 0, armor: 0, dmg: 0, spd: 0, cd: 0, dash: 0, regen: 0, crit: 0, magnet: 0, xp: 0, ult: 0, boss: 0, wlvl: 0 };
  const st = talentState(heroId);
  for (const t of TALENTS[heroId]) {
    const r = st.ranks[t.id] || 0;
    for (const k in t.eff) out[k] += t.eff[k] * r;
  }
  return out;
}

const TalentUI = {
  hero: 'daler',
  show(heroId) {
    if (heroId) this.hero = heroId;
    const h = this.hero, ch = CHARACTERS.find(c => c.id === h), st = talentState(h), spent = talentSpent(h);
    $('tal-tabs').innerHTML = CHARACTERS.map(c => `<button class="btn small ${c.id === h ? 'on' : ''}" data-h="${c.id}">${c.name}</button>`).join('');
    $('tal-tabs').querySelectorAll('button').forEach(b => { b.onclick = () => { UI.click(); this.show(b.dataset.h); }; });
    $('tal-portrait').src = pixArtURL(h, Save.data.costume[h] && Save.data.wins[h]);
    $('tal-portrait').style.background = `radial-gradient(circle at 50% 40%, ${HERO_TINT[h]}, #14162a)`;
    $('tal-name').textContent = ch.name + ' — ' + ch.title;
    $('tal-pts').textContent = 'Свободных очков: ' + st.pts + '   (вложено: ' + spent + ')';
    $('tal-list').innerHTML = TALENTS[h].map(t => {
      const r = st.ranks[t.id] || 0, locked = spent < TIER_NEED[t.tier], maxed = r >= t.max;
      const pips = Array.from({ length: t.max }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('');
      const label = maxed ? 'МАКС' : locked ? 'нужно ' + TIER_NEED[t.tier] : t.tier + ' оч.';
      return `<div class="shop-row tier${t.tier} ${locked ? 'locked' : ''}">
        <span class="tier-badge">${'I'.repeat(t.tier)}</span>
        <div class="shop-info"><div class="card-name">${t.name}</div><div class="muted">${t.desc}</div><div class="pips">${pips}</div></div>
        <button class="btn small" data-id="${t.id}" ${maxed || locked || st.pts < t.tier ? 'disabled' : ''}>${label}</button>
      </div>`;
    }).join('');
    $('tal-list').querySelectorAll('button[data-id]').forEach(b => {
      b.onclick = () => {
        const t = TALENTS[h].find(x => x.id === b.dataset.id);
        if (st.pts < t.tier || (st.ranks[t.id] || 0) >= t.max) return;
        st.pts -= t.tier;
        st.ranks[t.id] = (st.ranks[t.id] || 0) + 1;
        Save.store(); Sound.init(); Sound.sfx('buy');
        this.show();
      };
    });
    $('tal-reset').onclick = () => { st.pts += talentSpent(h); st.ranks = {}; Save.store(); UI.click(); this.show(); };
    if (UI.current !== 'talent') UI.show('talent');
  },
};

// ---------------------------------------------------------------- ИСПЫТАНИЕ ДНЯ
const Daily = {
  MODS: [
    { id: 'fast',      name: 'Спринтеры',        desc: 'Враги на 35% быстрее' },
    { id: 'horde',     name: 'Нашествие',        desc: 'Врагов в полтора раза больше' },
    { id: 'glass',     name: 'Стеклянная пушка', desc: 'Твой урон x2, здоровье x0.5' },
    { id: 'nodash',    name: 'Без рывка',        desc: 'Рывок отключён' },
    { id: 'onlystart', name: 'Верность оружию',  desc: 'Только стартовое оружие' },
    { id: 'elites',    name: 'Большая охота',    desc: 'Элитный враг каждые 18 секунд' },
    { id: 'rich',      name: 'Золотой день',     desc: 'Монет вдвое больше' },
    { id: 'tough',     name: 'Толстокожие',      desc: 'У врагов +50% здоровья' },
  ],
  // Правила зависят только от даты — у всех игроков в этот день они одинаковые
  today() {
    const d = new Date(), key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const rnd = mulberry32(hashInt(d.getFullYear(), d.getMonth() * 40 + d.getDate(), 777));
    const locs = LOCATIONS.filter(l => !l.final && !l.side); // финальная арена и побочные земли в испытания не попадают
    const heroes = CHARACTERS.filter(c => !c.recruit);        // только герои, доступные всем с самого начала
    const hero = heroes[Math.floor(rnd() * heroes.length)], loc = locs[Math.floor(rnd() * locs.length)];
    const pool = this.MODS.slice(), mods = [];
    for (let i = 0; i < 2; i++) mods.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return { key, hero, loc, mods };
  },
  state() {
    const t = this.today();
    if (Save.data.daily.key !== t.key) Save.data.daily = { key: t.key, best: 0, time: 0, kills: 0, tries: 0, won: false, rewarded: false };
    return Save.data.daily;
  },
  start() {
    const t = this.today(), mods = {};
    t.mods.forEach(m => { mods[m.id] = true; });
    Game.start(t.hero.id, t.loc.id, { daily: t, mods });
  },
  finish(R) {
    if (!R.daily || R.dailyDone) return;
    R.dailyDone = true;
    const s = this.state();
    s.tries++;
    R.dailyScore = Math.floor(Math.min(R.t, RUN_TIME)) * 10 + R.kills + (R.everWon ? 5000 : 0);
    if (R.dailyScore > s.best) { s.best = R.dailyScore; s.time = R.t; s.kills = R.kills; s.won = R.everWon; }
    if (!s.rewarded && R.t >= 300) { s.rewarded = true; Save.data.coins += 40; R.dailyReward = 40; }
  },
  text() {
    const t = this.today(), s = this.state();
    return `Wasteland Legends — испытание ${t.key}\n${t.hero.name}, ${t.loc.name}\nПравила: ${t.mods.map(m => m.name).join(' + ')}\nМой результат: ${s.best} очков (${fmtTime(s.time)}, убито ${s.kills}${s.won ? ', босс повержен' : ''})`;
  },
  show() {
    const t = this.today(), s = this.state();
    $('daily-date').textContent = 'Сегодня: ' + t.key + '. Правила одинаковы для всех игроков — сравни результат с друзьями.';
    $('daily-info').innerHTML = `<span>Герой</span><b>${t.hero.name}</b><span>Локация</span><b>${t.loc.name}</b>`;
    $('daily-mods').innerHTML = t.mods.map(m => `<div class="ach-row done"><span class="mark">!</span><div class="shop-info"><div class="card-name">${m.name}</div><div class="muted">${m.desc}</div></div></div>`).join('');
    $('daily-best').innerHTML = `
      <span>Попыток сегодня</span><b>${s.tries}</b>
      <span>Лучший результат</span><b class="gold">${s.best ? s.best + ' очков' : '—'}</b>
      <span>Награда</span><b>${s.rewarded ? 'получена' : '40 монет за 5 минут'}</b>
      <span>Очки</span><b>10 за секунду + убийства + 5000 за босса</b>`;
    $('daily-start').onclick = () => { UI.click(); this.start(); };
    $('daily-share').onclick = () => {
      const b = $('daily-share');
      const done = ok => { b.textContent = ok ? 'Скопировано!' : 'Не удалось скопировать'; setTimeout(() => { b.textContent = 'Скопировать результат'; }, 1500); };
      try { navigator.clipboard.writeText(this.text()).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    };
    UI.show('daily');
  },
};

// ---------------------------------------------------------------- СЮЖЕТ
const Story = {
  INTRO: [
    'Королевство Аэлор праздновало день Великого мира, когда придворный алхимик распахнул Врата между мирами.',
    'Вспышка — и троих затянуло в портал: эльфа-следопыта Daler, принцессу STIMME и рыцаря-принца BABADUK.',
    'Они очнулись в выжженной пустоши чужого мира. Здесь когда-то тоже были города — теперь лишь руины, мутанты и радиоактивный ветер.',
    'Врата раскололись на четыре осколка. Каждый стережёт чудовище. Соберите все четыре — и дорога домой откроется.',
  ],
  ENDING: [
    'Четыре осколка сошлись в один. Врата вспыхнули, и за ними показались зелёные холмы Аэлора.',
    'Daler обернулся на пустошь: «Странно. Я почти привык к этому небу».',
    'STIMME улыбнулась: «Мы вернёмся. Этому миру тоже нужны те, кто его защитит».',
    'BABADUK поднял меч: «Тогда не прощаемся. Легенды пустоши так просто не заканчиваются».',
    'Дорога домой открыта. Но пустошь всё ещё зовёт — а на сложности «Кошмар» она покажет настоящие зубы.',
  ],
  HERO: {
    daler:   { taunt: 'Вот и хранитель осколка. Крупнее, чем я думал... Тем проще попасть.', reply: 'Лес учил меня терпению. Пустошь — скорости. Начнём.' },
    stimme:  { taunt: 'Отдай осколок по-хорошему. Я умею просить громко.', reply: 'Принцессы Аэлора не отступают. Слушай внимательно — это будет последняя песня, которую ты услышишь.' },
    babaduk: { taunt: 'Именем короны Аэлора — осколок мой. Сдавайся или защищайся!', reply: 'Хороший ответ. Честный бой — лучшее, что есть в этом мире.' },
  },
  BOSS: {
    scorpion: 'Кш-ш-ш... Тёплая добыча сама пришла в мои пески. Осколок светится у меня под панцирем — попробуй достать.',
    robot:    'ОБНАРУЖЕН НАРУШИТЕЛЬ. ОБЪЕКТ «ОСКОЛОК» — СОБСТВЕННОСТЬ ЗАВОДА. ПРОТОКОЛ: УНИЧТОЖЕНИЕ.',
    giant:    'Ма-а-аленькие... Блестяшка моя. Лес мой. И вы теперь мои.',
    queen:    'Мои дети голодны, а вы так вкусно пахнете другим миром. Осколок останется в гнезде. Как и вы.',
  },
  lines: [], idx: 0, done: null,

  // Диалог перед боссом: игра замирает, пока его не пролистают
  bossTalk(R, def) {
    // каждый диалог показывается один раз: повторно тот же герой с тем же боссом уже не разговаривает
    const seen = Save.data.talked || (Save.data.talked = {}), key = R.loc.boss + ':' + R.ch.id;
    if (seen[key]) return;
    seen[key] = true; Save.store();
    const ch = R.ch, h = this.HERO[ch.id], heroImg = portraitURL(R.p.sprite, '#3b5dc9'), bossImg = iconURL(def.sprite, 96);
    this.play([
      { name: ch.name, img: heroImg, text: h.taunt },
      { name: def.name, img: bossImg, text: this.BOSS[R.loc.boss] || '...', boss: true },
      { name: ch.name, img: heroImg, text: h.reply },
    ], () => { Game.state = 'playing'; UI.show(null); });
  },
  play(lines, done) {
    this.lines = lines; this.idx = 0; this.done = done;
    Game.state = 'dialog';
    UI.show('dialog');
    this.render();
  },
  render() {
    const l = this.lines[this.idx];
    $('dlg-img').src = l.img;
    $('dlg-name').textContent = l.name;
    $('dlg-name').className = 'card-name ' + (l.boss ? 'red' : '');
    $('dlg-text').textContent = l.text;
  },
  next() {
    if (Game.state !== 'dialog') return;
    Sound.sfx('click');
    if (++this.idx >= this.lines.length) this.skip(); else this.render();
  },
  skip() { const d = this.done; this.done = null; this.lines = []; if (d) d(); },

  // Текстовый экран (пролог, концовка)
  showText(title, paras, then) {
    $('story-title').textContent = title;
    $('story-text').innerHTML = paras.map(p => `<p>${p}</p>`).join('');
    $('story-next').onclick = () => { UI.click(); then(); };
    UI.show('story');
  },
  checkEnding(R) {
    const d = Save.data;
    if (!d.endingSeen && LOCATIONS.filter(l => !l.side).every(l => d.cleared[l.id])) { d.endingSeen = true; R.storyEnding = true; }
  },
};

// ---------- Комикс-подача сюжета: крупные планы справа и слева, реплики печатаются в «пузыре» ----------
Story.HERO.maga = { taunt: 'Му-ха! Наконец-то противник моего размера. Осколок — сюда, или рога — туда.', reply: 'Двадцать лет я стерёг лабиринт. Тебя я уложу за двадцать ударов.' };

// who — id героя или босса, side — с какой стороны появляется
Story.INTRO_SCENE = [
  { who: 'stimme',  side: 'right', text: 'Это должен был быть лучший день Аэлора — праздник Великого мира. А потом придворный алхимик распахнул Врата между мирами...' },
  { who: 'babaduk', side: 'left',  text: 'Вспышка — и нас затянуло в портал. Меня, сестру и следопыта Daler. Я даже меч не успел убрать в ножны.' },
  { who: 'daler',   side: 'right', text: 'Очнулись мы здесь. Выжженная пустошь, руины, мутанты, ветер щёлкает, как счётчик. Это не наш мир.' },
  { who: 'maga',    side: 'left',  text: 'Му-ха! Чужаки у Врат? Я Maga — последний страж лабиринта. Врата раскололись на четыре осколка, и каждый утащило чудовище.' },
  { who: 'stimme',  side: 'right', text: 'Значит, соберём все четыре. И вернёмся домой.' },
  { who: 'maga',    side: 'left',  text: 'Тогда я с вами. Давно хотел размяться как следует!' },
];
Story.ENDING_SCENE = [
  { who: 'maga',    side: 'left',  text: 'Четыре осколка — один к одному. Смотрите: Врата снова дышат!' },
  { who: 'daler',   side: 'right', text: 'За ними зелёные холмы Аэлора... Странно. Я почти привык к этому небу.' },
  { who: 'stimme',  side: 'left',  text: 'Мы вернёмся сюда. Этому миру тоже нужны те, кто его защитит.' },
  { who: 'babaduk', side: 'right', text: 'Тогда не прощаемся. Легенды пустоши так просто не заканчиваются.' },
  { who: 'maga',    side: 'left',  text: 'Му-ха! А на сложности «Кошмар» пустошь ещё покажет зубы. Кто со мной?' },
];

Object.assign(Story, {
  prev: 'menu', typer: null, shown: 0,

  // Превращает { who, side, text } в готовую реплику с именем, рисунком и цветом
  line(l, me) {
    const who = l.who === '@' ? (me || 'daler') : l.who;
    const ch = CHARACTERS.find(c => c.id === who);
    if (ch) {
      const alt = Save.data.costume[ch.id] && Save.data.wins[ch.id];
      return { who, name: ch.name, img: pixArtURL(ch.id, alt), tint: HERO_TINT[ch.id], side: l.side, text: l.text };
    }
    const b = BOSSES[who];
    return { who, name: b.name, img: pixArtURL(who), tint: '#7d2a3b', side: l.side, text: l.text, boss: true };
  },

  // Сцена из нескольких реплик. Игра стоит на паузе, пока её не пролистают
  scene(lines, done, me) {
    this.lines = lines.map(l => this.line(l, me));
    this.idx = 0; this.done = done;
    this.prev = Game.state;
    Game.state = 'dialog';
    $('cm-left').className = 'cm-panel cm-left';
    $('cm-right').className = 'cm-panel cm-right';
    UI.show('dialog');
    // даём браузеру кадр, чтобы панели «въехали» с анимацией
    requestAnimationFrame(() => this.render());
  },

  bossTalk(R, def) {
    // каждый диалог показывается один раз: повторно тот же герой с тем же боссом уже не разговаривает
    const seen = Save.data.talked || (Save.data.talked = {}), key = R.loc.boss + ':' + R.ch.id;
    if (seen[key]) return;
    seen[key] = true; Save.store();
    const h = this.HERO[R.ch.id];
    this.scene([
      { who: R.ch.id, side: 'right', text: h.taunt },
      { who: R.loc.boss, side: 'left', text: this.BOSS[R.loc.boss] || '...' },
      { who: R.ch.id, side: 'right', text: h.reply },
    ], () => UI.show(null));
  },

  render() {
    const l = this.lines[this.idx];
    if (!l) return;
    const me = $('cm-' + l.side), other = $('cm-' + (l.side === 'left' ? 'right' : 'left'));
    $('cm-img-' + l.side).src = l.img;
    me.style.setProperty('--tint', l.tint);
    me.classList.add('show', 'active');
    other.classList.remove('active');
    const bub = $('cm-bubble');
    bub.className = 'cm-bubble ' + l.side;
    bub.style.setProperty('--tint', l.tint);
    $('dlg-name').textContent = l.name;
    // текст «печатается» по буквам
    clearInterval(this.typer);
    this.shown = 0;
    $('dlg-text').textContent = '';
    this.typer = setInterval(() => {
      this.shown += 2;
      $('dlg-text').textContent = l.text.slice(0, this.shown);
      if (this.shown >= l.text.length) clearInterval(this.typer);
      else if (this.shown % 6 === 0) Sound.voice(l.who); // персонаж «говорит» своим голосом
    }, 22);
  },

  next() {
    if (Game.state !== 'dialog') return;
    const l = this.lines[this.idx];
    // первый клик допечатывает реплику, второй — листает дальше
    if (l && this.shown < l.text.length) {
      clearInterval(this.typer);
      this.shown = l.text.length;
      $('dlg-text').textContent = l.text;
      return;
    }
    Sound.sfx('click');
    if (++this.idx >= this.lines.length) this.skip(); else this.render();
  },

  skip() {
    clearInterval(this.typer);
    if (Game.state === 'dialog') Game.state = this.prev;
    const d = this.done;
    this.done = null; this.lines = [];
    if (d) d();
  },
});

// Финальный босс: тот самый «алхимик»
Story.BOSS.alan = 'Алхимик? Ха! Я — ALANIATOR3000, отличник тёмных наук! Я раздал осколки чудищам, чтобы никто не закрыл Врата. Контрольная отменяется НАВСЕГДА!';
Story.ENDING_SCENE = [
  { who: 'alan',    side: 'left',  text: 'Н-не может быть... У меня же пятёрка по тёмной алхимии! Мама узнает — убьёт...' },
  { who: 'babaduk', side: 'right', text: 'Ты раздал осколки чудовищам и погубил целый клан. Дневник на стол, ALANIATOR.' },
  { who: 'maga',    side: 'left',  text: 'Четыре осколка — один к одному. Смотрите: Врата снова дышат! Мой клан отомщён.' },
  { who: 'daler',   side: 'right', text: 'За ними зелёные холмы Аэлора... Странно. Я почти привык к этому небу.' },
  { who: 'stimme',  side: 'left',  text: 'Мы вернёмся сюда. Этому миру тоже нужны те, кто его защитит.' },
  { who: 'maga',    side: 'right', text: 'Му-ха! А на сложности «Кошмар» пустошь ещё покажет зубы. Кто со мной?' },
];

// ---------- Сюжетные главы ----------
// who: '@' — герой, которым сейчас играют. Глава открывается один раз и потом доступна в меню «Сюжет».
Story.chap = () => Save.data.chap || (Save.data.chap = {});
Story.CHAPTERS = [
  { id: 'prolog', title: 'Пролог. Врата', hint: '', open: () => true, scene: Story.INTRO_SCENE },
  { id: 'maga1', title: 'Страж лабиринта', hint: 'начни забег за Maga', open: () => Story.chap().maga1, scene: [
    { who: 'maga',    side: 'right', text: 'Лабиринт был моим домом. Сто коридоров — и в самом центре Врата.' },
    { who: 'stimme',  side: 'left',  text: 'Ты стерёг их один? Все эти годы?' },
    { who: 'maga',    side: 'right', text: 'Был целый клан. Когда Врата раскололись, взрыв забрал всех, кроме меня. Я отрастил гриву и ждал.' },
    { who: 'daler',   side: 'left',  text: 'Чего ждал?' },
    { who: 'maga',    side: 'right', text: 'Тех, кто поможет всё исправить. Му-ха... Дождался.' },
  ] },
  { id: 'shard_desert', title: 'Глава 1. Сердце пустыни', hint: 'победи Радскорпиона', open: () => Save.data.cleared.desert, scene: [
    { who: '@',       side: 'right', text: 'Осколок... Тёплый, как живое сердце. И гудит.' },
    { who: 'maga',    side: 'left',  text: 'Первый из четырёх. Скорпион стерёг его двадцать лет, а вы управились за десять минут. Му-ха!' },
    { who: 'stimme',  side: 'right', text: 'Он светится ярче, когда я пою. Врата помнят наш мир.' },
    { who: 'babaduk', side: 'left',  text: 'Тогда вперёд. Три чудовища ещё не знают, что мы идём.' },
  ] },
  { id: 'shard_factory', title: 'Глава 2. Железное сердце', hint: 'победи робота «Молот»', open: () => Save.data.cleared.factory, scene: [
    { who: '@',       side: 'right', text: 'Он охранял завод, которого давно нет. Даже жаль его.' },
    { who: 'daler',   side: 'left',  text: 'Жалость оставь живым. Смотри: у него в груди вместо реактора стоял осколок.' },
    { who: 'maga',    side: 'right', text: 'Значит, Врата питали машину. Кто-то вставил осколок нарочно.' },
    { who: 'stimme',  side: 'left',  text: 'Алхимик... Выходит, он побывал здесь раньше нас?' },
  ] },
  { id: 'shard_forest', title: 'Глава 3. Шёпот леса', hint: 'победи Зомби-великана', open: () => Save.data.cleared.forest, scene: [
    { who: '@',       side: 'right', text: 'Великан просто хотел блестяшку. Как ребёнок.' },
    { who: 'babaduk', side: 'left',  text: 'Ребёнок ростом с башню. Сестра, ты цела?' },
    { who: 'stimme',  side: 'right', text: 'Цела. Но лес шепчет: последний осколок — глубоко под землёй.' },
    { who: 'maga',    side: 'left',  text: 'Метро. Там гнездо Матки. Рядом с ним мой лабиринт — детская площадка.' },
  ] },
  { id: 'shard_metro', title: 'Глава 4. Гнездо', hint: 'победи Матку слизней', open: () => Save.data.cleared.metro, scene: [
    { who: '@',       side: 'right', text: 'Матка повержена. Осколок у нас!' },
    { who: 'daler',   side: 'left',  text: 'Я слышу ветер Аэлора. Он пахнет дождём и хвоей.' },
    { who: 'maga',    side: 'right', text: 'Несите осколки к Вратам. И... спасибо. Страж без Врат — просто бык с секирой.' },
    { who: 'stimme',  side: 'left',  text: 'Ты не просто бык, Maga. Ты наш друг.' },
    { who: 'babaduk', side: 'right', text: 'Рано радоваться. У Врат кто-то стоит — и он нас ждёт.' },
  ] },
  { id: 'maga2', title: 'Тайна лабиринта', hint: 'победи босса за Maga', open: () => Story.chap().maga2, scene: [
    { who: 'maga',    side: 'right', text: 'В панцире твари я нашёл клеймо моего клана. Осколки не чудовища утащили...' },
    { who: 'babaduk', side: 'left',  text: 'Их раздали чудовищам. Как приманку — чтобы никто не собрал Врата.' },
    { who: 'maga',    side: 'right', text: 'Алхимик из вашего мира. Он приходил в лабиринт до взрыва. Назвался другом — и я его впустил.' },
    { who: 'stimme',  side: 'left',  text: 'Значит, у нас общий враг. И общий путь домой.' },
    { who: 'maga',    side: 'right', text: 'Тогда моя секира — ваша. До самого конца.' },
  ] },
  { id: 'ending', title: 'Финал. Дорога домой', hint: 'победи ALANIATOR3000 у Врат', open: () => Save.data.endingSeen, scene: Story.ENDING_SCENE },
];
Story.chapter = id => { const c = Story.CHAPTERS.find(c => c.id === id); return c ? c.scene : null; };

// Меню «Сюжет»: открытые главы можно пересмотреть
Story.gallery = function () {
  $('story-title').textContent = 'Сюжет';
  $('story-text').innerHTML = this.CHAPTERS.map((c, i) => c.open()
    ? `<button class="btn" data-i="${i}">${c.title}</button>`
    : `<button class="btn" disabled>??? — ${c.hint}</button>`).join('');
  $('story-text').querySelectorAll('button[data-i]').forEach(b => {
    b.onclick = () => { UI.click(); this.scene(this.CHAPTERS[+b.dataset.i].scene, () => this.gallery(), UI.selChar || 'daler'); };
  });
  $('story-next').textContent = 'Назад';
  $('story-next').onclick = () => { UI.click(); UI.showMenu(); };
  UI.show('story');
};

// ---------- Голоса: у каждого персонажа свой тембр и высота ----------
const VOICE = {
  daler: { f: 520, w: 'square' }, stimme: { f: 780, w: 'triangle' }, babaduk: { f: 300, w: 'square' }, maga: { f: 150, w: 'sawtooth' },
  scorpion: { f: 1100, w: 'sawtooth', hiss: true }, robot: { f: 220, w: 'square', mono: true }, giant: { f: 95, w: 'sawtooth' }, alan: { f: 190, w: 'square', up: true }, queen: { f: 620, w: 'sine', up: true },
};
Object.assign(Sound, {
  ready() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; },
  // «бормотание» в диалоге: короткий слог на каждые несколько букв
  voice(who) {
    const v = VOICE[who];
    if (!v || !this.ready()) return;
    const f = v.mono ? v.f : v.f * (1 + (Math.random() - 0.5) * 0.4);
    this.tone(f, 0.07, v.w, v.w === 'sawtooth' ? 0.05 : 0.07, v.up ? f * 1.3 : f * 0.9);
    if (v.hiss) this.noise(0.04, 0.04, 5000, 'highpass');
  },
  // боевой клич при ульте
  shout(id) {
    if (!this.ready()) return;
    const now = this.ctx.currentTime;
    if (id === 'daler') [1, 1.26, 1.5, 2].forEach((m, i) => this.tone(520 * m, 0.1, 'square', 0.09, null, now + i * 0.06));
    else if (id === 'stimme') {
      // высокая нота с вибрато
      for (let i = 0; i < 8; i++) this.tone(i % 2 ? 1040 : 990, 0.1, 'triangle', 0.14, null, now + i * 0.08);
      this.tone(1560, 0.7, 'sine', 0.06, 2080);
    } else if (id === 'babaduk') { this.tone(260, 0.18, 'square', 0.12, 220); this.tone(330, 0.4, 'square', 0.12, 190, now + 0.16); }
    else if (id === 'maga') { this.tone(140, 0.9, 'sawtooth', 0.2, 55); this.tone(210, 0.6, 'square', 0.08, 80); this.noise(0.5, 0.12, 400, 'lowpass'); }
  },
  // вскрик при получении урона
  grunt(id) {
    const v = VOICE[id];
    if (!v || !this.ready()) return;
    this.tone(v.f * 1.15, 0.13, v.w, 0.08, v.f * 0.6);
  },
  // победный возглас
  cheer(id) {
    const v = VOICE[id];
    if (!v || !this.ready()) return;
    const now = this.ctx.currentTime;
    [1, 1.25, 1.5].forEach((m, i) => this.tone(v.f * m, 0.14, v.w, 0.09, null, now + 0.5 + i * 0.12));
  },
});

// ---------------------------------------------------------------- ТОРГОВЕЦ
const Merchant = {
  R: null, bought: {},
  ITEMS: [
    { id: 'heal', name: 'Аптечка',      desc: 'Восстановить половину здоровья',          cost: 8,  icon: 'i_medkit' },
    { id: 'up',   name: 'Улучшение',    desc: 'Выбор улучшения, как при новом уровне',   cost: 20, icon: 'i_star' },
    { id: 'ult',  name: 'Заряд ульты',  desc: 'Полностью зарядить ульту',                cost: 6,  icon: 'i_bolt' },
    { id: 'hp',   name: 'Живая вода',   desc: '+25 к макс. здоровью до конца забега',    cost: 15, icon: 'heart' },
    { id: 'mag',  name: 'Большой магнит', desc: 'Притянуть все кристаллы и монеты',      cost: 5,  icon: 'i_magnet' },
  ],
  price(it) { return Math.round(it.cost * Math.pow(1.5, this.bought[it.id] || 0)); },
  open(R) {
    this.R = R; this.bought = {};
    Game.state = 'shop';
    Sound.sfx('chest');
    this.render();
    UI.show('merchant');
  },
  render() {
    const R = this.R;
    $('mer-coins').textContent = R.coins;
    $('mer-list').innerHTML = this.ITEMS.map(it => {
      const c = this.price(it);
      return `<div class="shop-row"><img src="${iconURL(it.icon, 32)}" alt="">
        <div class="shop-info"><div class="card-name">${it.name}</div><div class="muted">${it.desc}</div></div>
        <button class="btn small" data-id="${it.id}" ${R.coins < c ? 'disabled' : ''}>${c} ◉</button></div>`;
    }).join('');
    $('mer-list').querySelectorAll('button[data-id]').forEach(b => { b.onclick = () => this.buy(b.dataset.id); });
    $('mer-leave').onclick = () => this.close();
  },
  buy(id) {
    const R = this.R, p = R.p, it = this.ITEMS.find(x => x.id === id), c = this.price(it);
    if (R.coins < c) return;
    R.coins -= c;
    this.bought[id] = (this.bought[id] || 0) + 1;
    if (id === 'heal') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5);
    else if (id === 'up') R.pendingLevels++;
    else if (id === 'ult') { p.ult = p.ultCost; p.ultCd = 0; }
    else if (id === 'hp') { p.baseHp += 25; recalcStats(); }
    else if (id === 'mag') { for (const k of R.pickups) if (!k.static) k.mag = true; }
    Sound.sfx('buy');
    this.render();
  },
  close() {
    if (Game.state !== 'shop') return;
    Game.state = 'playing';
    UI.show(null);
    UI.banner('Торговец ушёл', 1.2);
  },
};

// ---------------------------------------------------------------- ОБУЧЕНИЕ
// Подсказки в первом забеге: каждая ждёт, пока игрок выполнит действие
const Tut = {
  TIPS: [
    'Двигайся: WASD или стрелки. На телефоне — веди пальцем по экрану',
    'Оружие стреляет само. Собирай кристаллы — это опыт для новых уровней',
    'РЫВОК: пробел или круглая кнопка справа. Во время рывка ты неуязвим',
    'УЛЬТА заряжена! Нажми E или кнопку с процентами',
    'Машины и ящики твёрдые — прячься за ними от пуль. Мигающая точка у края экрана ведёт к сундуку или торговцу. Удачи!',
  ],
  show(text) {
    const el = $('tip');
    if (text) { if (el.textContent !== text) el.textContent = text; el.classList.remove('hidden'); }
    else el.classList.add('hidden');
  },
  update(R, dt) {
    if (!R.tutOn) { if (!R.tipHidden) { this.show(null); R.tipHidden = true; } return; }
    const T = R.tut || (R.tut = { step: 0, acc: 0 }), p = R.p;
    if (T.step === 0) {
      this.show(this.TIPS[0]);
      if (p.moving) T.acc += dt;
      if (T.acc > 1.5) { T.step = 1; T.acc = 0; }
    } else if (T.step === 1) {
      this.show(this.TIPS[1]);
      T.acc += dt;
      if (p.level >= 2 || T.acc > 14) { T.step = 2; T.acc = 0; }
    } else if (T.step === 2) {
      T.acc += dt;
      this.show(T.acc > 3 ? this.TIPS[2] : null);
      if (R.dashed && T.acc > 3) { T.step = 3; T.acc = 0; }
    } else if (T.step === 3) {
      const ready = p.ult >= p.ultCost;
      this.show(ready ? this.TIPS[3] : null);
      if (ready) T.was = true;
      if (T.was && !ready) { T.step = 4; T.acc = 0; }
    } else if (T.step === 4) {
      T.acc += dt;
      this.show(this.TIPS[4]);
      if (T.acc > 9) { T.step = 5; R.tutOn = false; }
    }
  },
};

// ---------------------------------------------------------------- НАСТРОЙКИ
const Settings = {
  from: 'menu',
  apply() {
    const s = Save.data.settings;
    document.documentElement.style.setProperty('--btn-scale', s.btn);
    Sound.applySettings();
  },
  show() {
    this.from = UI.current || 'menu';
    const s = Save.data.settings;
    $('set-music').value = s.music ? Math.round(s.musicVol * 100) : 0;
    $('set-sfx').value = s.sfx ? Math.round(s.sfxVol * 100) : 0;
    this.seg('set-shake', 'shake');
    this.seg('set-btn', 'btn');
    UI.show('settings');
  },
  seg(elId, key) {
    const s = Save.data.settings;
    $(elId).querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', parseFloat(b.dataset.v) === s[key]);
      b.onclick = () => { s[key] = parseFloat(b.dataset.v); Save.store(); this.apply(); UI.click(); this.seg(elId, key); };
    });
  },
  init() {
    const s = Save.data.settings;
    const bind = (id, vol, on) => {
      $(id).oninput = () => {
        Sound.init();
        const v = $(id).value / 100;
        s[on] = v > 0; if (v > 0) s[vol] = v;
        Save.store(); this.apply(); UI.refreshToggles();
      };
      $(id).onchange = () => { if (id === 'set-sfx') Sound.sfx('coin'); };
    };
    bind('set-music', 'musicVol', 'music');
    bind('set-sfx', 'sfxVol', 'sfx');
    $('set-back').onclick = () => {
      UI.click();
      if (Game.state === 'paused') UI.show('pause'); else UI.showMenu();
    };
    document.querySelectorAll('.btn-settings').forEach(b => { b.onclick = () => { UI.click(); this.show(); }; });
    this.apply();
  },
};

// ---------------------------------------------------------------- ГЕЙМПАД
const Pad = {
  prev: [], ax: 0, ay: 0, dirPrev: 0,
  poll() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const g of list) if (g && g.connected) { gp = g; break; }
    this.ax = this.ay = 0;
    if (!gp) return;
    const b = gp.buttons.map(x => x.pressed), edge = i => b[i] && !this.prev[i];
    let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    if (b[14]) x = -1; if (b[15]) x = 1; if (b[12]) y = -1; if (b[13]) y = 1;
    const m = Math.hypot(x, y);
    if (m > 0.25) { this.ax = x / Math.max(1, m); this.ay = y / Math.max(1, m); }

    if (Game.state === 'playing') {
      if (edge(0)) Input.dashQ = true;
      if (edge(1) || edge(2)) Input.ultQ = true;
      if (edge(9)) Game.pause();
    } else if (Game.state === 'hub') {
      // лагерь: A — войти или заговорить, Y — большая карта
      if (edge(0)) Hub.use();
      if (edge(3)) Hub.bigMap = !Hub.bigMap;
    } else if (Game.state === 'dialog') {
      if (edge(0)) Story.next();
    } else {
      if (Game.state === 'paused' && edge(9)) Game.resume();
      if (Game.state === 'levelup' && UI.levelOpts) {
        // X / Y / B — первая, вторая, третья карточка
        [2, 3, 1].forEach((btn, i) => { if (edge(btn) && UI.levelOpts[i] && Game.state === 'levelup') Game.choose(UI.levelOpts[i]); });
      }
      // меню: крестовина/стик переключают кнопки, A — нажать, B — назад
      const dir = m > 0.6 ? (Math.abs(x) > Math.abs(y) ? Math.sign(x) : Math.sign(y)) : 0;
      if (dir && dir !== this.dirPrev) {
        const btns = [...document.querySelectorAll('.screen.active button:not(:disabled), .screen.active input')];
        if (btns.length) {
          const i = btns.indexOf(document.activeElement);
          btns[(i + dir + btns.length) % btns.length].focus();
        }
      }
      this.dirPrev = dir;
      if (edge(0) && document.activeElement && document.activeElement.click) document.activeElement.click();
      if (edge(1) && Game.state === 'menu') { const back = document.querySelector('.screen.active [data-back]') || document.querySelector('.screen.active #story-next'); if (back && back.style.display !== 'none') back.click(); }
    }
    this.prev = b;
  },
};

// ---------------------------------------------------------------- КОМНАТА БОССОВ
// Готовая сборка героя: без неё выйти против босса с первым уровнем бессмысленно
function rushBuild(R, power) {
  const p = R.p;
  const cfg = { 1: { lvl: 3, weapons: 1, wl: 2, passives: 2, pl: 2, level: 10 },
                2: { lvl: 5, weapons: 2, wl: 3, passives: 3, pl: 3, level: 20 },
                3: { lvl: 5, weapons: 3, wl: 5, passives: 4, pl: 4, level: 30 } }[power];
  p.weapons[0].lvl = Math.max(p.weapons[0].lvl, cfg.lvl);
  const others = shuffle(Object.keys(WEAPONS).filter(id => id !== p.weapons[0].id));
  for (let i = 0; i < cfg.weapons; i++) { addWeapon(others[i]); p.weapons[p.weapons.length - 1].lvl = cfg.wl; }
  // первый предмет — тот, что нужен стартовому оружию для эволюции (на максимальной силе она сразу включена)
  const need = WEAPONS[p.weapons[0].id].evo.need;
  const pas = [need].concat(shuffle(Object.keys(PASSIVES).filter(id => id !== need)));
  for (let i = 0; i < cfg.passives; i++) p.passives[pas[i]] = Math.min(PASSIVES[pas[i]].max, cfg.pl);
  if (power === 3) p.weapons[0].evo = true;
  p.level = cfg.level;
  p.xpNext = 1e9; // в комнате боссов уровни не растут
}

const Rush = {
  hero: 'daler', picked: {}, power: 2,
  show() {
    const ids = Object.keys(BOSSES);
    $('rush-heroes').innerHTML = CHARACTERS.map(c => `<button class="rush-pick ${c.id === this.hero ? 'on' : ''}" data-h="${c.id}">
      <img src="${iconURL(c.sprite, 48)}" alt=""><span>${c.name}</span></button>`).join('');
    $('rush-bosses').innerHTML = ids.map(id => `<button class="rush-pick boss ${this.picked[id] ? 'on' : ''}" data-b="${id}">
      <img src="${iconURL(BOSSES[id].sprite, 64)}" alt=""><span>${BOSSES[id].name}</span><em>${BOSSES[id].hp} HP</em></button>`).join('');
    $('rush-heroes').querySelectorAll('button').forEach(b => { b.onclick = () => { UI.click(); this.hero = b.dataset.h; this.show(); }; });
    $('rush-bosses').querySelectorAll('button').forEach(b => { b.onclick = () => { UI.click(); this.picked[b.dataset.b] = !this.picked[b.dataset.b]; this.show(); }; });
    $('rush-power').querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', +b.dataset.v === this.power);
      b.onclick = () => { UI.click(); this.power = +b.dataset.v; this.show(); };
    });
    const list = ids.filter(id => this.picked[id]);
    $('rush-all').onclick = () => { UI.click(); const all = list.length === ids.length; ids.forEach(id => { this.picked[id] = !all; }); this.show(); };
    $('rush-all').textContent = list.length === ids.length ? 'Снять всех' : 'Выбрать всех';
    const go = $('rush-start');
    go.disabled = !list.length;
    go.textContent = list.length ? 'В БОЙ! (' + list.length + ')' : 'Выбери босса';
    go.onclick = () => {
      UI.click();
      // арена: у финального босса — Врата, иначе родная локация первого выбранного
      const loc = list.includes('alan') ? 'gates' : (LOCATIONS.find(l => l.boss === list[0]) || LOCATIONS.find(l => l.id === 'japan')).id;
      Game.start(this.hero, loc, { rush: list, power: this.power });
    };
    if (UI.current !== 'rush') UI.show('rush');
  },
};

// ---------------------------------------------------------------- СТАТИСТИКА УРОНА
// Сколько урона нанёс каждый источник за забег: оружие, ульта, прочее (взрывы, буря, волна уровня)
function dmgStatsHTML(R) {
  const rows = [];
  for (const key in R.dmgBy) {
    const w = R.p.weapons.find(x => x.id === key);
    let name, icon;
    if (w) { name = wName(w) + (w.evo ? ' ★' : ' · ур. ' + w.lvl); icon = WEAPONS[key].icon; }
    else if (WEAPONS[key]) { name = WEAPONS[key].name; icon = WEAPONS[key].icon; }
    else if (key === 'ult') { name = 'Ульта: ' + ULTS[R.ch.id].name; icon = 'i_star'; }
    else { name = 'Прочее (взрывы, буря, волна уровня)'; icon = 'i_bolt'; }
    rows.push({ name, icon, v: Math.round(R.dmgBy[key]) });
  }
  if (!rows.length) return '';
  rows.sort((a, b) => b.v - a.v);
  const total = rows.reduce((s, r) => s + r.v, 0) || 1, top = rows[0].v || 1;
  const fmt = v => v >= 10000 ? (v / 1000).toFixed(1) + 'k' : String(v);
  return `<div class="dmg-stats">
    <div class="dmg-title">Урон за забег: <b class="gold">${fmt(total)}</b> · получено: <b class="red">${Math.round(R.dmgTaken)}</b></div>
    ${rows.map(r => `<div class="dmg-row">
      <img src="${iconURL(r.icon, 32)}" alt="">
      <div class="dmg-bar"><i style="width:${Math.max(2, r.v / top * 100).toFixed(1)}%"></i><span>${r.name}</span></div>
      <b>${fmt(r.v)}</b><em>${Math.round(r.v / total * 100)}%</em>
    </div>`).join('')}
  </div>`;
}

// ---------------------------------------------------------------- ПОДКЛЮЧЕНИЕ К ИНТЕРФЕЙСУ
const Extra = {
  init() {
    Object.assign(BACK, { talent: 'menu', daily: 'menu', rush: 'menu' });
    $('btn-rush').onclick = () => { UI.click(); Rush.show(); };
    Settings.init();
    $('btn-talent').onclick = () => { UI.click(); TalentUI.show(); };
    $('btn-daily').onclick = () => { UI.click(); Daily.show(); };
    $('scr-dialog').onclick = () => Story.next();

    // Пролог перед самым первым забегом
    const play = $('btn-play').onclick;
    $('btn-play').onclick = () => {
      if (Save.data.introSeen) return play();
      UI.click();
      Save.data.introSeen = true; Save.store();
      Story.scene(Story.INTRO_SCENE, () => UI.showChar());
    };
    $('cm-skip').onclick = e => { e.stopPropagation(); UI.click(); Story.skip(); };
    // меню «Сюжет»: пересмотр открытых глав
    BACK.story = 'menu';
    $('btn-story').onclick = () => { UI.click(); Story.gallery(); };
    $('shards').style.cursor = 'pointer';
    $('shards').onclick = () => { UI.click(); Story.gallery(); };

    // Сложность «Кошмар» на экране выбора локации
    const showLoc = UI.showLoc.bind(UI);
    UI.showLoc = () => {
      showLoc();
      const d = Save.data, open = Object.keys(d.wins).length > 0, b = $('btn-diff');
      b.classList.toggle('hidden', !open);
      b.classList.toggle('on', !!d.nightmare);
      b.textContent = d.nightmare ? 'Сложность: КОШМАР (враги сильнее, награды x2)' : 'Сложность: обычная';
      b.onclick = () => { d.nightmare = !d.nightmare; Save.store(); UI.click(); UI.showLoc(); };
      // финальная арена закрыта, пока не собраны все четыре осколка
      for (const l of LOCATIONS) {
        if (!l.final) continue;
        const card = document.querySelector(`#loc-cards .card[data-id="${l.id}"]`);
        const need = LOCATIONS.filter(x => !x.final && !x.side), have = need.filter(x => d.cleared[x.id]).length;
        const tag = card.querySelector('.card-tag');
        if (have < need.length) {
          card.disabled = true; card.classList.add('locked');
          tag.textContent = `🔒 Нужны осколки: ${have}/${need.length}`;
          card.querySelector('.boss-line').innerHTML = 'Босс: <b>???</b>';
          card.querySelector('.loc-preview img').style.filter = 'brightness(0)';
        } else {
          tag.textContent = d.cleared[l.id] ? '★ Врата открыты' : '⚔ Финальная битва';
          tag.className = 'card-tag gold';
        }
      }
    };

    // Статистика урона: на паузе и на экране итогов
    const showPause = UI.showPause.bind(UI);
    UI.showPause = R => { showPause(R); $('pause-build').insertAdjacentHTML('beforeend', dmgStatsHTML(R)); };

    // Экран итогов: очки талантов, испытание дня, концовка
    const showEnd = UI.showEnd.bind(UI);
    UI.showEnd = R => {
      showEnd(R);
      $('end-ach').insertAdjacentHTML('beforebegin', '<div id="end-dmg"></div>');
      const old = document.querySelectorAll('#end-dmg');
      for (let i = 0; i < old.length - 1; i++) old[i].remove(); // от прошлого забега
      old[old.length - 1].innerHTML = dmgStatsHTML(R);
      let extra = `<div class="ach-row done"><span class="mark">+</span><div class="shop-info"><div class="card-name">Очки талантов: +${R.talentPts}</div><div class="muted">${R.ch.name} — потрать их в меню «Таланты»</div></div></div>`;
      if (R.daily) extra += `<div class="ach-row done"><span class="mark">!</span><div class="shop-info"><div class="card-name">Испытание дня: ${R.dailyScore || 0} очков</div><div class="muted">Лучший сегодня: ${Daily.state().best}${R.dailyReward ? ' · награда +' + R.dailyReward + ' монет' : ''}</div></div></div>`;
      $('end-ach').insertAdjacentHTML('afterbegin', extra);
      // сюжетные сцены после победы идут по очереди, затем показывается экран итогов
      const q = [];
      if (R.firstClear) { R.firstClear = false; const sc = Story.chapter('shard_' + R.loc.id); if (sc) q.push(sc); }
      if (R.rush) {
        $('btn-endless').classList.add('hidden');
        $('end-title').textContent = R.won ? (R.rush.length > 1 ? 'БОССЫ ПОВЕРЖЕНЫ!' : 'БОСС ПОВЕРЖЕН!') : 'ТЫ ПОГИБ';
      }
      if (R.storyEnding) { R.storyEnding = false; q.push(Story.ENDING_SCENE); }
      if (R.extraScenes) { q.push(...R.extraScenes); R.extraScenes = null; } // вербовка новых героев
      const next = () => { const s = q.shift(); if (s) Story.scene(s, next, R.ch.id); else UI.show('end'); };
      if (q.length) next();
    };

    // Осколки Врат в главном меню
    const showMenu = UI.showMenu.bind(UI);
    UI.showMenu = () => {
      showMenu();
      const sh = LOCATIONS.filter(l => !l.final && !l.side), n = sh.filter(l => Save.data.cleared[l.id]).length;
      $('shards').textContent = 'Осколки Врат: ' + '◆'.repeat(n) + '◇'.repeat(sh.length - n) + (Save.data.cleared.gates ? '  ★' : '');
    };
    UI.showMenu();

    // Клавиши: пролистать диалог, закрыть торговца
    const onKey = Input.onKey;
    Input.onKey = e => {
      if (Game.state === 'dialog') { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); Story.next(); } return; }
      if (Game.state === 'shop') { if (e.code === 'Escape') Merchant.close(); return; }
      onKey(e);
    };
  },
};
