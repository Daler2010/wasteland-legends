// ===== Онлайн: фразы, смайлики и анимации героев, подъём упавших друзей, рекорды отряда =====
// Всё подключается поверх MP (mp.js): хозяин хранит у героя p.em = { i, t } и шлёт его в снимке,
// упавшего поднимают, постояв рядом с его надгробием.

const EMOTE_KINDS = [
  { k: 'cmd', name: 'Команды', c: '#a7f070' },
  { k: 'say', name: 'Вежливость', c: '#73eff7' },
  { k: 'face', name: 'Смайлики', c: '#ffcd75' },
  { k: 'tease', name: 'Подначки', c: '#ef7d57' },
  { k: 'anim', name: 'Анимации', c: '#c77dff' },
];
const EMOTES = [
  // команды: метка над героем видна всем, даже за краем экрана
  { k: 'cmd', t: 'Сюда!', c: '#a7f070' }, { k: 'cmd', t: 'Помогите!', c: '#ef3b5b' }, { k: 'cmd', t: 'Босс!', c: '#f59e42' }, { k: 'cmd', t: 'Отходим!', c: '#73eff7' },
  { k: 'say', t: 'Спасибо!' }, { k: 'say', t: 'Отлично!' }, { k: 'say', t: 'Прости!' }, { k: 'say', t: 'GG' },
  { k: 'face', f: 'laugh', t: 'Смех' }, { k: 'face', f: 'angry', t: 'Злость' }, { k: 'face', f: 'heart', t: 'Сердце' }, { k: 'face', f: 'skull', t: 'Череп' },
  { k: 'tease', t: 'Слабо?' }, { k: 'tease', t: 'Я лучший!' }, { k: 'tease', t: 'Догони!' }, { k: 'tease', t: 'Ха-ха-ха!' },
  { k: 'anim', a: 'dance', t: 'Танец' }, { k: 'anim', a: 'jump', t: 'Прыжок' }, { k: 'anim', a: 'bow', t: 'Поклон' }, { k: 'anim', a: 'spin', t: 'Вертушка' },
];
// мемы: фразу произносит голос браузера (say — на языке lang, ru — запасной вариант по-русски), герой танцует свой танец (a)
const MEME_GROUPS = [{ name: 'Твои', c: '#ffcd75' }, { name: 'Брейнрот', c: '#a7f070' }, { name: 'Фразочки', c: '#73eff7' }, { name: 'Скибиди и ко', c: '#c77dff' }];
const MEMES = [
  { g: 0, t: '67', full: 'Сикс-севен!', say: 'six seven!', lang: 'en', ru: 'сикс сэвэн!', pitch: 1.3, rate: 1.1, a: 'sixseven', id: '67' },
  { g: 0, t: 'Танцуй, пантера!', say: 'Танцуй, пантера!', lang: 'ru', pitch: 0.8, rate: 1, a: 'panther', id: 'pantera' },
  { g: 0, t: 'Коч, братан!', say: 'Коч, братан!', lang: 'ru', pitch: 0.6, rate: 0.9, a: 'flex', id: 'koch' },
  { g: 1, t: 'Тунг-тунг сахур', full: 'Тунг-тунг-тунг сахур!', say: 'tung tung tung tung sahur!', lang: 'it', ru: 'тунг тунг тунг тунг сахур!', pitch: 0.7, rate: 1.2, a: 'stomp', id: 'tung' },
  { g: 1, t: 'Тралалело', full: 'Тралалело тралала!', say: 'tralalero tralala!', lang: 'it', ru: 'тралалэро тралала!', pitch: 1.2, rate: 1.1, a: 'swim', id: 'tralalero' },
  { g: 1, t: 'Бомбардиро', full: 'Бомбардиро крокодило!', say: 'bombardiro crocodilo!', lang: 'it', ru: 'бомбардиро крокодило!', pitch: 0.8, rate: 1, a: 'fly', id: 'bombardiro' },
  { g: 1, t: 'Баллерина', full: 'Баллерина капучина!', say: 'ballerina cappuccina!', lang: 'it', ru: 'баллерина капучина!', pitch: 1.6, rate: 1, a: 'ballet', id: 'ballerina' },
  { g: 2, t: 'Это база', full: 'Это база!', say: 'Это база!', lang: 'ru', pitch: 0.7, rate: 0.9, a: 'nod', id: 'baza' },
  { g: 2, t: 'Сигма', full: 'Сигма!', say: 'Сигма!', lang: 'ru', pitch: 0.5, rate: 0.8, a: 'sigma', id: 'sigma' },
  { g: 2, t: 'Ой, всё!', say: 'Ой, всё!', lang: 'ru', pitch: 1.5, rate: 1.1, a: 'turn', id: 'oyvse' },
  { g: 2, t: 'Фиаско', full: 'Это фиаско, братан', say: 'Это фиаско, братан.', lang: 'ru', pitch: 0.8, rate: 0.85, a: 'slump', id: 'fiasko' },
  { g: 2, t: 'Респект', full: 'Респект!', say: 'Респект!', lang: 'ru', pitch: 1, rate: 1, a: 'bow', id: 'respekt' },
  { g: 3, t: 'Скибиди', full: 'Скибиди доп-доп ес-ес!', say: 'skibidi dop dop dop yes yes!', lang: 'en', ru: 'скибиди доп доп доп ес ес!', pitch: 1.4, rate: 1.3, a: 'skibidi', id: 'skibidi' },
  { g: 3, t: 'Ризз', full: 'Ризз!', say: 'rizz!', lang: 'en', ru: 'ризз!', pitch: 0.7, rate: 0.9, a: 'rizz', id: 'rizz' },
  { g: 3, t: 'Охайо!', say: 'おはよう!', lang: 'ja', ru: 'охайо!', pitch: 1.5, rate: 1, a: 'wave', id: 'ohayo' },
  { g: 3, t: 'Вайб', full: 'Вайб!', say: 'vibe!', lang: 'en', ru: 'вайб!', pitch: 0.9, rate: 0.8, a: 'vibe', id: 'vibe' },
];
for (const M of MEMES) EMOTES.push(Object.assign({ k: 'meme', c: MEME_GROUPS[M.g].c }, M));
const EMOTE_DUR = { cmd: 4, say: 2.6, face: 2.6, tease: 2.6, anim: 2.4, meme: 3.2 };
const EMOTE_SFX = { cmd: 'warn', say: 'click', face: 'gem', tease: 'bow', anim: 'coin' };

// танцы героя: t — сколько прошло, d — сколько осталось, f0 — куда смотрел; возвращают подъём и сдвиг
const ANIMS = {
  dance: (t, p) => { p.face = Math.sin(t * 8) > 0 ? 1 : -1; p.squashT = Math.abs(Math.cos(t * 8)) * 0.08; return { lift: Math.abs(Math.sin(t * 8)) * 3 }; },
  jump: (t, p) => { const f = (t * 1.6) % 1; if (f > 0.9 || f < 0.06) p.squashT = 0.14; else p.stretchT = 0.08; return { lift: Math.sin(f * Math.PI) * 12 }; },
  bow: (t, p, d) => { const q = Math.min(1, t * 3, d * 3); p.squashT = 0.14 * q; return { lift: -q }; },
  spin: (t, p) => { p.face = Math.floor(t * 12) % 2 ? 1 : -1; p.turnT = 0.06; return { lift: 2 + Math.sin(t * 12) }; },
  // «67»: руки то вверх, то вниз — герой вытягивается и сжимается
  sixseven: (t, p) => { const s = Math.sin(t * 14); if (s > 0) p.stretchT = 0.11 * s; else p.squashT = -0.13 * s; return { lift: s > 0 ? s * 2 : 0 }; },
  panther: (t, p) => { p.face = Math.sin(t * 6) > 0 ? 1 : -1; return { lift: Math.abs(Math.sin(t * 12)) * 4, dx: Math.sin(t * 6) * 4 }; },
  flex: (t, p) => { const f = (t * 2) % 1; if (f < 0.5) p.squashT = 0.14; else p.stretchT = 0.06; return { lift: f < 0.5 ? 0 : 2 }; },
  stomp: (t, p) => { const f = (t * 3) % 1; if (f < 0.15) p.squashT = 0.14; return { lift: f < 0.15 ? 0 : Math.sin((f - 0.15) / 0.85 * Math.PI) * 6 }; },
  swim: (t, p) => { p.face = Math.cos(t * 3) > 0 ? 1 : -1; return { dx: Math.sin(t * 3) * 8, lift: Math.sin(t * 6) * 1.5 }; },
  fly: (t, p) => { p.stretchT = 0.06; return { lift: Math.min(1, t * 2) * 10 + Math.sin(t * 8) * 2, dx: Math.sin(t * 4) * 3 }; },
  ballet: (t, p) => { p.face = Math.floor(t * 10) % 2 ? 1 : -1; p.turnT = 0.05; p.stretchT = 0.1; return { lift: 3 }; },
  nod: (t, p) => { p.squashT = Math.max(0, Math.sin(t * 9)) * 0.1; return {}; },
  sigma: (t, p, d, f0) => { p.face = t < 1.4 ? f0 : -f0; p.stretchT = 0.1; return { lift: 1 }; },
  turn: (t, p, d, f0) => { p.face = -f0; p.squashT = 0.06; return {}; },
  slump: (t, p, d) => { const q = Math.min(1, t * 2, d * 3); p.squashT = 0.14 * q; return { lift: -2 * q }; },
  skibidi: (t, p) => { const b = Math.floor(t * 8) % 2; p.face = b ? 1 : -1; if (b) p.squashT = 0.1; return { lift: b ? 0 : 3 }; },
  rizz: t => ({ dx: Math.sin(t * 3) * 3, lift: 1 + Math.sin(t * 6) }),
  wave: (t, p) => { p.stretchT = Math.abs(Math.sin(t * 10)) * 0.08; return { lift: Math.sin(Math.min(1, t) * Math.PI) * 6 }; },
  vibe: (t, p) => { p.face = Math.sin(t * 2.5) > 0 ? 1 : -1; return { dx: Math.sin(t * 2.5) * 3, lift: Math.abs(Math.sin(t * 5)) * 2 }; },
};

// пиксельные смайлики 10x9 (палитра как у игры)
const FACE_PAL = { o: '#f59e42', y: '#ffcd75', k: '#1a1c2c', r: '#b13e53', R: '#ef3b5b', d: '#5d275d', b: '#41a6f6', w: '#f4f4f4', g: '#94b0c2' };
const FACES = {
  laugh: ['..oooooo..', '.oyyyyyyo.', 'oyykyykyyo', 'oykykkykyo', 'byyyyyyyyb', 'oykkkkkkyo', 'oyykrrkyyo', '.oyykkyyo.', '..oooooo..'],
  angry: ['..dddddd..', '.dRRRRRRd.', 'dRkRRRRkRd', 'dRRkRRkRRd', 'dRRkRRkRRd', 'dRRRRRRRRd', 'dRRkkkkRRd', '.dRkRRkRd.', '..dddddd..'],
  heart: ['.rrr..rrr.', 'rwRRrrRRRr', 'rwRRRRRRRr', 'rRRRRRRRRr', '.rRRRRRRr.', '..rRRRRr..', '...rRRr...', '....rr....', '..........'],
  skull: ['..gggggg..', '.gwwwwwwg.', 'gwwwwwwwwg', 'gwkkwwkkwg', 'gwkkwwkkwg', 'gwwwkkwwwg', '.gwwwwwwg.', '..gwkwkg..', '..gggggg..'],
};
function drawFace(ctx, f, x, y, s) {
  const rows = FACES[f];
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < 10; i++) {
    const c = FACE_PAL[rows[j][i]];
    if (c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x + (i - 5) * s), Math.round(y + (j - 4.5) * s), s, s); }
  }
}
function faceURL(f) {
  const c = document.createElement('canvas'); c.width = c.height = 30;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  drawFace(g, f, 15, 15, 3);
  return c.toDataURL();
}

const REVIVE_R = 22, REVIVE_T = 3; // радиус круга у надгробия и сколько секунд стоять одному
const REVIVE_MODES = ['boss', 'horde', 'coop', 'defense']; // в гонке и на арене каждый сам за себя
const REC_MAX = 5;

const Social = {
  cd: 0, open: false, hover: -1, keyHeld: false, tab: 'say', faces: {}, files: {}, audio: null,

  // ---------------------------------------------------------------- ФРАЗЫ
  canEmote() { return MP.on && Game.state === 'mp' && MP.meP() && !UI.current; },
  send(i) {
    const me = MP.meP(), now = performance.now();
    if (!me || !EMOTES[i] || now - this.cd < 1000) return;
    this.cd = now;
    if (MP.isHost()) this.apply(me, i);
    else {
      const E = EMOTES[i];
      Net.toHost({ k: 'em', i }); me.em = { i, t: EMOTE_DUR[E.k], local: now };
      if (E.k === 'meme') this.meme(E); else Sound.sfx(EMOTE_SFX[E.k]);
    }
  },
  // у хозяина: герой показывает фразу (звук уходит всем через запись событий, мем каждый озвучивает у себя)
  apply(p, i) {
    const E = EMOTES[i];
    if (!E || (p.emCd || 0) > 0) return;
    p.em = { i, t: EMOTE_DUR[E.k], n: this.seq = (this.seq || 0) + 1 }; p.emCd = E.k === 'meme' ? 2.5 : 0.8;
    if (E.k === 'meme') this.meme(E); else Sound.sfx(EMOTE_SFX[E.k]);
  },
  // звук мема: свой файл sounds/memes/<id>.mp3, если его положили, иначе — голос браузера
  meme(E) {
    const st = Save.data.settings;
    if (!st.sfx) return;
    if (this.audio) { try { this.audio.pause(); } catch (e) { } this.audio = null; }
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { }
    if (this.files[E.id] === false) return this.speak(E);
    const a = this.audio = new Audio('sounds/memes/' + E.id + '.mp3');
    a.volume = clamp(st.sfxVol, 0, 1);
    let done = false;
    const fail = () => { if (done) return; done = true; this.files[E.id] = false; if (this.audio === a) this.speak(E); };
    a.addEventListener('error', fail, { once: true });
    a.addEventListener('playing', () => { done = true; this.files[E.id] = true; }, { once: true });
    // длинный файл обрываем: мем звучит не дольше 3,5 с и плавно затихает
    const vol = a.volume, t0 = performance.now(), fade = setInterval(() => {
      const s = (performance.now() - t0) / 1000;
      if (this.audio !== a || a.paused || s > 3.5) { clearInterval(fade); if (s > 3.5) a.pause(); return; }
      if (s > 2.8) a.volume = vol * Math.max(0, (3.5 - s) / 0.7);
    }, 50);
    a.play().catch(err => { if (err && err.name === 'NotAllowedError') { done = true; this.speak(E); } else fail(); });
  },
  // голос браузера: ищем голос нужного языка, нет — читаем русский вариант
  speak(E) {
    const S = window.speechSynthesis, st = Save.data.settings;
    if (!S || !st.sfx || !window.SpeechSynthesisUtterance) return;
    const voices = S.getVoices(), find = l => voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(l));
    let v = find(E.lang), text = E.say;
    if (!v && E.ru) { v = find('ru'); text = E.ru; }
    const u = new SpeechSynthesisUtterance(text);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = E.lang === 'ru' || E.ru ? 'ru-RU' : E.lang;
    u.pitch = E.pitch; u.rate = E.rate; u.volume = clamp(st.sfxVol, 0, 1);
    try { S.cancel(); S.speak(u); } catch (e) { /* голос недоступен */ }
  },
  tick(list, dt) {
    for (const p of list) {
      if (p.emCd > 0) p.emCd -= dt;
      if (p.em && (p.em.t -= dt) <= 0) p.em = null;
    }
  },

  // ---------------------------------------------------------------- МЕНЮ ФРАЗ
  buildWheel() {
    const tab = this.tab || 'say', box = $('emote-cols');
    $('emote-tabs').innerHTML = [['say', 'Фразы'], ['meme', 'Мемы']].map(([id, n]) => `<button class="em-tab ${id === tab ? 'on' : ''}" data-t="${id}">${n}</button>`).join('');
    $('emote-tabs').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); UI.click(); this.tab = b.dataset.t; this.buildWheel(); this.setHover(-1); });
    const cols = tab === 'meme' ? MEME_GROUPS.map((G, g) => ({ name: G.name, c: G.c, has: E => E.k === 'meme' && E.g === g }))
      : EMOTE_KINDS.map(K => ({ name: K.name, c: K.c, has: E => E.k === K.k }));
    box.style.setProperty('--cols', cols.length);
    box.innerHTML = cols.map(C => `<div class="em-col"><div class="em-head" style="color:${C.c}">${C.name}</div>` +
      EMOTES.map((E, i) => !C.has(E) ? '' : `<button class="em-btn" data-i="${i}" style="--c:${E.c || C.c}">${E.f ? `<img src="${this.faces[E.f] || (this.faces[E.f] = faceURL(E.f))}" alt="">` : ''}<span>${E.t}</span></button>`).join('') + '</div>').join('');
    box.querySelectorAll('.em-btn').forEach(b => {
      const i = +b.dataset.i;
      b.onpointerenter = () => this.setHover(i);
      b.onpointerleave = () => { if (this.hover === i) this.setHover(-1); };
      b.onclick = e => { e.stopPropagation(); this.send(i); this.close(); };
    });
    $('emote-wheel').onclick = () => this.close();
  },
  setHover(i) {
    this.hover = i;
    $('emote-cols').querySelectorAll('.em-btn').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    $('emote-hint').textContent = i >= 0 ? EMOTES[i].t : (this.keyHeld ? 'Наведи на фразу и отпусти T' : 'Выбери фразу');
  },
  show() {
    if (!this.canEmote()) return;
    if (!this.built) { this.built = true; this.buildWheel(); }
    this.open = true; this.setHover(-1);
    $('emote-wheel').classList.remove('hidden');
  },
  close() { this.open = false; this.keyHeld = false; $('emote-wheel').classList.add('hidden'); },

  // ---------------------------------------------------------------- ПОДЪЁМ ДРУГА (хозяин)
  reviveTick(R, dt) {
    if (MP.scene !== 'game' || R.ending || !REVIVE_MODES.includes(R.mp.mode)) return;
    for (const t of R.mp.tombs.slice()) {
      const p = R.pl.find(q => q.slot === t.slot);
      if (!p || !p.dead || !(p.respawnT > 0)) { t.rp = 0; continue; }
      const cx = t.x, cy = t.y - 10;
      const helpers = R.pl.filter(q => !q.dead && q !== p && dist2(q.x, q.y, cx, cy) < REVIVE_R * REVIVE_R);
      // вдвоём поднимают вдвое быстрее; ушёл — полоска медленно тает
      t.rp = helpers.length ? (t.rp || 0) + dt * helpers.length / REVIVE_T : Math.max(0, (t.rp || 0) - dt * 0.5);
      if (t.rp >= 1) this.revive(R, p, t, helpers);
    }
  },
  revive(R, p, t, helpers) {
    p.dead = false; p.respawnT = 0; p.hp = Math.ceil(p.maxHp * 0.5); p.invT = 2.5; p.mvx = p.mvy = 0;
    MP.teleport(p, t.x, t.y - 12);
    R.mp.tombs = R.mp.tombs.filter(q => q !== t);
    R.effects.push({ type: 'ring', x: p.x, y: p.y, r: 4, maxR: 60, t: 0, dur: 0.4, dmg: 15, kb: 240, c: '#a7f070', hit: new Set(), owner: p });
    burst(R, p.x, p.y, 24, '#a7f070');
    for (const h of helpers) h.revives = (h.revives || 0) + 1;
    UI.banner(helpers.map(h => h.name).join(' и ') + (helpers.length > 1 ? ' подняли ' : ' поднял ') + p.name + '!', 1.8);
    Sound.sfx('heal');
  },

  // ---------------------------------------------------------------- РЕКОРДЫ ОТРЯДА
  record(res) {
    const d = Save.data, list = (d.mpRec = d.mpRec || {})[res.mode] = (d.mpRec[res.mode] || []);
    const win = res.rows.find(r => r.slot === res.winner);
    const best = res.rows.reduce((a, r) => r.score > a.score ? r : a, res.rows[0] || { score: 0, name: '' });
    list.push({ d: Date.now(), won: res.won ? 1 : 0, t: res.t, kills: res.rows.reduce((s, r) => s + r.kills, 0),
      best: res.mode === 'pvp' ? (win ? win.name : '') : best.name, score: best.score, team: res.rows.map(r => [r.name, r.sprite]) });
    list.sort(this.order(res.mode));
    list.length = Math.min(list.length, REC_MAX);
    Save.store();
  },
  order(mode) {
    if (mode === 'boss') return (a, b) => b.won - a.won || (a.won ? a.t - b.t : b.t - a.t);
    if (mode === 'race') return (a, b) => b.score - a.score;
    if (mode === 'pvp') return (a, b) => b.d - a.d; // арена: последние матчи
    return (a, b) => b.won - a.won || b.t - a.t || b.kills - a.kills;
  },
  recText(mode, e) {
    if (mode === 'boss') return (e.won ? 'Босс побеждён за ' : 'Поражение, бой ') + fmtTime(e.t);
    if (mode === 'race') return `Лучший счёт ${e.score} — ${escapeHTML(e.best)}`;
    if (mode === 'pvp') return e.best ? 'Победил ' + escapeHTML(e.best) : 'Ничья';
    return (e.won ? 'Победа · ' : 'Продержались ') + fmtTime(e.t) + ' · убито ' + e.kills;
  },
  showRecords(mode) {
    this.recMode = mode = mode || this.recMode || 'boss';
    $('rec-tabs').innerHTML = Object.keys(MP_MODES).map(id => `<button class="btn small ${id === mode ? 'on' : ''}" data-m="${id}">${MP_MODES[id].name}</button>`).join('');
    $('rec-tabs').querySelectorAll('button').forEach(b => b.onclick = () => { UI.click(); this.showRecords(b.dataset.m); });
    const list = ((Save.data.mpRec || {})[mode]) || [];
    $('rec-list').innerHTML = list.length ? list.map((e, n) => `<div class="rec-row ${e.won ? 'won' : ''}"><b>${mode === 'pvp' ? '•' : n + 1}</b>` +
      `<div><div>${this.recText(mode, e)}</div><div class="rec-team">${e.team.map(([nm, sp]) => `<span><img src="${iconURL(sp, 24)}" alt="">${escapeHTML(nm)}</span>`).join('')}</div></div>` +
      `<em>${new Date(e.d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</em></div>`).join('')
      : '<p class="muted">Здесь пока пусто — сыграйте этот режим с друзьями!</p>';
    UI.show('mprec');
  },

  // ---------------------------------------------------------------- ОТРИСОВКА
  // анимации героя: временно меняем позу, рисуем и возвращаем как было
  drawAnim(orig, ctx, R, p) {
    const E = p && p.em && !p.dead && EMOTES[p.em.i], fn = E && ANIMS[E.a];
    if (!fn) return orig(ctx, R, p);
    const tau = EMOTE_DUR[E.k] - p.em.t, save = { x: p.x, y: p.y, face: p.face, squashT: p.squashT, turnT: p.turnT, stretchT: p.stretchT };
    const o = fn(tau, p, p.em.t, save.face) || {}, lift = o.lift || 0, dx = o.dx || 0;
    const sh = shadow;
    p.y -= lift; p.x += dx;
    shadow = (c, x, y, r) => sh(c, x, y + lift, r);
    try { orig(ctx, R, p); } finally { shadow = sh; Object.assign(p, save); }
  },
  drawOver(ctx, R, cx, cy, W, H) {
    if (!R.mp) return;
    const now = performance.now() / 1000;
    // круг у надгробия: встань сюда, чтобы поднять друга
    if (MP.scene === 'game' && REVIVE_MODES.includes(R.mp.mode)) for (const t of R.mp.tombs || []) {
      const p = R.pl.find(q => q.slot === t.slot);
      if (!p || !(p.respawnT > 0)) continue;
      const x = t.x - cx, y = t.y - 10 - cy;
      ctx.globalAlpha = 0.6 + Math.sin(now * 5) * 0.25;
      pxCircle(ctx, x, y, REVIVE_R, '#a7f070'); pxCircle(ctx, x, y, REVIVE_R - 1, '#38b764');
      ctx.globalAlpha = 1;
      const bx = Math.round(x - 11), by = Math.round(y - 22);
      ctx.fillStyle = '#14162a'; ctx.fillRect(bx - 1, by - 1, 24, 5);
      ctx.fillStyle = '#a7f070'; ctx.fillRect(bx, by, Math.round(22 * Math.min(1, t.rp || 0)), 3);
      if (x < 0 || x > W || y < 0 || y > H) {
        const ax = clamp(x, 8, W - 9), ay = clamp(y, 8, H - 9);
        if (Math.floor(now * 4) % 2) { pxDisc(ctx, ax, ay, 4, '#14162a'); pxDisc(ctx, ax, ay, 3, '#a7f070'); }
      }
    }
    // смайлики над головой и метки команд
    for (const p of R.pl) {
      if (!p.em || p.dead) continue;
      const E = EMOTES[p.em.i], x = p.x - cx, y = p.y - cy;
      if (E.k === 'face') {
        const a = EMOTE_DUR.face - p.em.t, bob = Math.round(Math.sin(a * 6) * 1.5), pop = Math.min(1, a * 6);
        ctx.globalAlpha = Math.min(1, p.em.t * 3);
        drawFace(ctx, E.f, x, y - 36 + bob + (1 - pop) * 6, 1);
        ctx.globalAlpha = 1;
      } else if (E.k === 'cmd') {
        ctx.globalAlpha = 0.5 + Math.sin(now * 10) * 0.3;
        pxCircle(ctx, x, y, 12 + (now * 20) % 8, E.c);
        ctx.globalAlpha = 1;
        if (p !== R.p && (x < 0 || x > W || y < 0 || y > H)) {
          const ax = clamp(x, 10, W - 11), ay = clamp(y, 10, H - 11);
          pxDisc(ctx, ax, ay, 6, '#14162a'); pxDisc(ctx, ax, ay, 5, E.c);
          ctx.fillStyle = '#14162a'; ctx.fillRect(Math.round(ax), Math.round(ay - 3), 1, 4); ctx.fillRect(Math.round(ax), Math.round(ay + 2), 1, 1); // «!»
        }
      }
    }
  },
  // пузыри с текстом над героями (как подписи имён — в разметке поверх игры)
  bubbles() {
    const R = MP.R, box = $('mp-bubbles');
    if (!R || !R.pl) { if (box.innerHTML) box.innerHTML = ''; return; }
    const sc = Game.scale, items = [];
    for (const p of R.pl) {
      if (!p.em || p.dead) continue;
      const E = EMOTES[p.em.i];
      if (E.k === 'face') continue;
      items.push({ key: p.slot + ':' + p.em.i, text: E.full || E.t, big: E.k === 'meme', c: E.c || (EMOTE_KINDS.find(K => K.k === E.k) || {}).c, x: p.x, y: p.y - 33, fade: p.em.t < 0.4 });
    }
    const sig = items.map(i => i.key).join();
    if (sig !== this.bubSig) { this.bubSig = sig; box.innerHTML = items.map(i => `<div class="em-bubble ${i.big ? 'meme' : ''}" style="--c:${i.c}">${escapeHTML(i.text)}</div>`).join(''); }
    items.forEach((it, i) => {
      const el = box.children[i];
      el.style.transform = `translate(${Math.round((it.x - Game.camX) * sc)}px, ${Math.round((it.y - Game.camY) * sc)}px) translate(-50%, -100%)`;
      el.style.opacity = it.fade ? 0.4 : 1;
    });
  },

  // ---------------------------------------------------------------- ПОДКЛЮЧЕНИЕ К MP
  init() {
    const after = (obj, name, fn) => { const o = obj[name].bind(obj); obj[name] = function (...a) { const r = o(...a); fn(a, r); return r; }; };
    // хозяин: фраза от гостя
    const hm = MP.hostMsg.bind(MP);
    MP.hostMsg = (slot, m) => {
      if (m && m.k === 'em') { const p = MP.R && MP.R.pl.find(q => q.slot === slot); if (p && !p.dead) this.apply(p, m.i | 0); return; }
      hm(slot, m);
    };
    after(MP, 'hostTick', ([dt]) => { const R = MP.R; if (!R) return; this.tick(R.pl, dt); this.reviveTick(R, dt); });
    after(MP, 'clientTick', ([dt]) => { if (MP.R) this.tick(MP.R.pl, dt); });
    // снимок: фразы героев и полоски подъёма у надгробий
    after(MP, 'snapFor', (a, s) => { s.EM = MP.R.pl.filter(q => q.em).map(q => [q.slot, q.em.i, Math.round(q.em.t * 10) / 10, q.em.n || 0]); });
    after(MP, 'hud', (a, h) => { if (h.tb) h.tb = MP.R.mp.tombs.map(t => [t.slot, t.x, t.y, Math.round((t.rp || 0) * 100) / 100]); });
    after(MP, 'applySnap', ([s]) => {
      const V = MP.R, now = performance.now(), em = new Map((s.EM || []).map(a => [a[0], a]));
      for (const p of V.pl) {
        const a = em.get(p.slot);
        if (a) {
          // у каждой фразы свой номер: мем звучит ровно один раз (свой уже прозвучал при нажатии)
          const played = this.played || (this.played = {}), fresh = played[p.slot] !== a[3];
          if (!fresh && p.em && p.em.local) continue; // своя новая фраза ещё не дошла до хозяина — старую не возвращаем
          played[p.slot] = a[3];
          if (fresh && EMOTES[a[1]] && EMOTES[a[1]].k === 'meme' && !(p.em && p.em.local && p.em.i === a[1]) && a[2] > EMOTE_DUR.meme - 1) this.meme(EMOTES[a[1]]);
          if (fresh || !p.em || Math.abs(p.em.t - a[2]) > 0.5) p.em = { i: a[1], t: a[2], n: a[3] };
        }
        else if (!(p.em && p.em.local && now - p.em.local < 600)) p.em = null; // своя фраза ещё не дошла до хозяина
      }
      const tb = (s.H && s.H.tb) || [];
      V.mp.tombs.forEach((t, i) => { t.rp = (tb[i] && tb[i][3]) || 0; });
    });
    // итоги: сколько раз поднял друзей, и запись в рекорды
    after(MP, 'results', ([R], res) => { res.rows.forEach(r => { const p = R.pl.find(q => q.slot === r.slot); r.rev = (p && p.revives) || 0; }); });
    after(MP, 'showEnd', ([res]) => { if (!res.rec_) { res.rec_ = 1; this.record(res); } });
    // экран погибшего: подсказка про подъём
    after(MP, 'uiTick', () => {
      const R = MP.R, me = MP.meP();
      if (R && MP.scene === 'game' && me && me.dead && me.respawnT > 0 && !R.ending && REVIVE_MODES.includes(R.mp.mode)) {
        const el = $('mp-dead'), t = (R.mp.tombs || []).find(q => q.slot === me.slot), txt = el.textContent.split(' · ')[0];
        const want = txt + ' · ' + (t && t.rp > 0 ? `Тебя поднимают: ${Math.round(t.rp * 100)}%` : 'Друг может поднять тебя — пусть встанет у надгробия');
        if (el.textContent !== want) el.textContent = want;
      }
      this.bubbles();
      $('btn-emote').classList.toggle('hidden', !(MP.on && Game.state === 'mp' && MP.meP() && MP.scene !== 'end'));
      if (this.open && !this.canEmote()) this.close();
    });
    after(MP, 'clientStart', () => { this.played = {}; });
    after(MP, 'leave', () => { this.played = {}; this.close(); $('mp-bubbles').innerHTML = ''; this.bubSig = ''; $('btn-emote').classList.add('hidden'); });
    // отрисовка
    const dp = drawPlayer;
    drawPlayer = (ctx, R, p) => this.drawAnim(dp, ctx, R, p);
    const ov = drawOverlay;
    drawOverlay = (ctx, R, cx, cy, W, H) => { ov(ctx, R, cx, cy, W, H); this.drawOver(ctx, R, cx, cy, W, H); };

    // управление: зажать T — меню, навести и отпустить; кнопка «ФРАЗЫ» — для телефона
    addEventListener('keydown', e => {
      if (e.code !== 'KeyT' || e.repeat || /INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
      if (this.open) { this.close(); return; }
      if (!this.canEmote()) return;
      this.keyHeld = true; this.show();
    });
    addEventListener('keyup', e => {
      if (e.code !== 'KeyT' || !this.keyHeld) return;
      this.keyHeld = false;
      if (this.hover >= 0) { this.send(this.hover); this.close(); } else this.setHover(-1); // не выбрал — меню остаётся, можно кликнуть
    });
    addEventListener('keydown', e => { if (this.open && e.code === 'Escape') { e.stopPropagation(); this.close(); } }, true);
    $('btn-emote').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.init(); if (this.open) this.close(); else this.show(); });

    // на телефонах голос заработает только после касания — «будим» его первым нажатием
    const wake = () => { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { } };
    addEventListener('pointerdown', wake, { once: true });
    if (window.speechSynthesis) speechSynthesis.getVoices();
    // рекорды
    $('on-rec').onclick = () => { UI.click(); this.showRecords(); };
    $('mp-rec').onclick = () => { UI.click(); if (!UI.current) this.showRecords(); };
    $('rec-back').onclick = () => { UI.click(); if (MP.on) UI.show(MP.scene === 'end' ? 'mpend' : null); else MP.showOnline(); };
  },
};
