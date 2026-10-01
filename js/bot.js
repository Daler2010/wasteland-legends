// ===== Бот для проверки баланса =====
// Открой index.html?bot=1 — бот сыграет ускоренные забеги за каждого героя
// и покажет таблицу: сколько прожил, какой уровень, победил ли босса.
// ?bot=3 — по три забега на героя. Прогресс и монеты при этом не сохраняются.
(function () {
  const q = new URLSearchParams(location.search);
  if (!q.has('bot')) return;
  const RUNS = Math.max(1, parseInt(q.get('bot')) || 1);
  const DT = 1 / 30;

  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:8px;top:8px;right:8px;z-index:99;background:rgba(0,0,0,.85);color:#a7f070;font:12px monospace;padding:12px;white-space:pre-wrap;max-height:90vh;overflow:auto';
  document.body.appendChild(box);
  const lines = ['БОТ: проверка баланса (' + RUNS + ' забег(а) на героя)...'];
  const print = () => { box.textContent = lines.join('\n'); };
  print();

  Save.store = function () { }; // бот не трогает сохранение
  Save.data.tutDone = true; Save.data.introSeen = true;
  Save.data.chap = { maga1: true, maga2: true };
  Sound.sfx = function () { }; Sound.startMusic = function () { };

  // Куда идти: прочь от врагов и пуль, к ближайшему кристаллу
  function steer(R) {
    const p = R.p;
    let x = 0, y = 0, danger = 0;
    for (const e of R.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      const reach = (e.boss ? 90 : 55) + e.r;
      if (d < reach) { const w = (reach - d) / reach; x += dx / d * w * 3; y += dy / d * w * 3; if (d < e.r + 14) danger++; }
    }
    for (const b of R.ebullets) {
      // от пули уходим вбок, поперёк её полёта — как делает человек
      const dx = p.x - b.x, dy = p.y - b.y, sp = Math.hypot(b.vx, b.vy) || 1;
      const ux = b.vx / sp, uy = b.vy / sp, along = dx * ux + dy * uy;
      if (along < -4 || along > 80) continue;
      let px = dx - ux * along, py = dy - uy * along;
      const miss = Math.hypot(px, py);
      if (miss > 16) continue;
      if (miss < 0.5) { px = -uy; py = ux; } else { px /= miss; py /= miss; }
      const w = 4 * (1 - along / 100);
      x += px * w; y += py * w;
    }
    let best = null, bd = 140 * 140;
    for (const k of R.pickups) { const d = dist2(k.x, k.y, p.x, p.y); if (d < bd) { bd = d; best = k; } }
    if (best) { const d = Math.sqrt(bd) || 1; x += (best.x - p.x) / d * 1.3; y += (best.y - p.y) / d * 1.3; }
    // сюжетный забег: идём к ключу и воротам
    const tg = R.st && R.st.target;
    if (tg && !tg.guard && !tg.done) { const d = Math.hypot(tg.x - p.x, tg.y - p.y) || 1; x += (tg.x - p.x) / d * 2.5; y += (tg.y - p.y) / d * 2.5; }
    // волна почти отбита — не убегаем, а идём добивать
    if (R.st && R.st.phase === 'wave' && R.st.left === 0 && R.st.alive <= 6) {
      let ne = null, nd = 1e9;
      for (const e of R.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; ne = e; } }
      if (ne && nd > 24) { x = (ne.x - p.x) / nd * 3; y = (ne.y - p.y) / nd * 3; }
    }
    const m = Math.hypot(x, y);
    Input.keys = {};
    if (m > 0.05) {
      if (x / m > 0.38) Input.keys.KeyD = true; else if (x / m < -0.38) Input.keys.KeyA = true;
      if (y / m > 0.38) Input.keys.KeyS = true; else if (y / m < -0.38) Input.keys.KeyW = true;
    }
    if (danger >= 2 && p.dashCd <= 0) Input.dashQ = true;
    if (p.ult >= p.ultCost && (danger >= 1 || R.boss)) Input.ultQ = true;
  }

  // &smart=1 — бот собирает сборку как опытный игрок: качает стартовое оружие и ведёт его к эволюции
  const SMART = q.has('smart');
  function score(o, p) {
    if (o.kind === 'evolve') return 100;
    const start = p.weapons[0];
    if (o.kind === 'weapon') {
      if (o.id === start.id) return 90;
      if (p.weapons.some(w => w.id === o.id)) return 60;
      return p.weapons.length < 3 ? 50 : 5;
    }
    if (o.kind === 'passive') {
      if (p.weapons.some(w => WEAPONS[w.id].evo && WEAPONS[w.id].evo.need === o.id)) return o.id === WEAPONS[start.id].evo.need ? 80 : 65;
      return p.passives[o.id] ? 40 : 30;
    }
    return 10;
  }
  function chooseUpgrade() {
    const opts = UI.levelOpts, p = Game.run.p;
    if (!SMART) return Game.choose(opts.find(o => o.kind === 'evolve') || pick(opts));
    Game.choose(opts.slice().sort((a, b) => score(b, p) - score(a, p))[0]);
  }

  // Замеры: кто ранит героя (по ближайшему врагу) и какое оружие бьёт босса
  let hurtBy = {}, bossBy = {}, bossT0 = 0;
  const hurt0 = hurtPlayer, hurtE0 = hurtEnemy;
  hurtPlayer = function (R, dmg) {
    const p = R.p, hp = p.hp;
    hurt0(R, dmg);
    if (p.hp >= hp) return;
    const st = new Error().stack || '';
    let src = /strike/.test(st) ? 'буря' : /explode/.test(st) ? 'взрыв' : 'пули';
    if (src === 'пули') for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 4) { src = e.boss ? 'босс' : (e.elite ? 'элита ' : '') + e.type; break; }
    hurtBy[src] = (hurtBy[src] || 0) + hp - p.hp;
  };
  hurtEnemy = function (R, e, dmg, kx, ky, kb) {
    const hp = e.hp;
    hurtE0(R, e, dmg, kx, ky, kb);
    if (e.boss) { if (!bossT0) bossT0 = R.t; const k = R.src || 'other'; bossBy[k] = (bossBy[k] || 0) + Math.max(0, hp - Math.max(0, e.hp)); }
  };
  const top = (o, n) => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, n).map(k => (WEAPONS[k] ? WEAPONS[k].name : k) + ' ' + Math.round(o[k])).join(', ');

  // &hero=id и &loc=id сужают проверку; &rush=alan,robot&power=2 — комната боссов
  const only = (list, key) => q.get(key) ? list.filter(x => q.get(key).split(',').includes(x.id)) : list;
  const HEROES = only(CHARACTERS, 'hero'), LOCS = only(LOCATIONS, 'loc');
  const RUSH = q.get('rush') ? q.get('rush').split(',') : null, POWER = parseInt(q.get('power')) || 2;
  const jobs = [];
  for (const ch of HEROES) for (let i = 0; i < RUNS; i++) jobs.push({ ch, loc: LOCS[(HEROES.indexOf(ch) + i) % LOCS.length] });

  function runJob(idx) {
    if (idx >= jobs.length) { lines.push('', 'ГОТОВО. Убери ?bot из адреса, чтобы играть.'); print(); Game.quit(); Input.keys = {}; return; }
    const job = jobs[idx];
    // к дальним картам игрок приходит с улучшениями из лавки: примерно уровень за каждые две пройденные карты
    const tier = Math.max(0, CHAIN.indexOf(job.loc.id));
    Save.data.meta = {};
    if (!q.has('nometa')) for (const m of META) Save.data.meta[m.id] = Math.min(m.max, Math.floor((tier + 1) / 2));
    if (RUSH) Game.start(job.ch.id, RUSH.includes('alan') ? 'gates' : job.loc.id, { rush: RUSH, power: POWER });
    else Game.start(job.ch.id, job.loc.id);
    const R = Game.run, marks = [];
    hurtBy = {}; bossBy = {}; bossT0 = 0;
    const LIMIT = RUSH ? 300 : RUN_TIME + 240;
    let nextMark = 120, minHp = 1;
    function chunk() {
      for (let i = 0; i < 900 && Game.state !== 'over'; i++) {
        if (Game.state === 'levelup') chooseUpgrade();
        if (Game.state === 'paused') Game.resume(); // автопауза при скрытой вкладке не должна останавливать замер
        if (Game.state === 'dialog') Story.skip();
        if (Game.state === 'shop') Merchant.close();
        steer(R);
        Game.update(DT);
        minHp = Math.min(minHp, R.p.hp / R.p.maxHp);
        if (R.t >= nextMark) { nextMark += 120; marks.push(Math.round(R.t / 60) + 'м:ур' + R.p.level + '/hp' + Math.round(minHp * 100) + '%'); minHp = 1; }
        if (R.t > LIMIT) break; // бот не может добить босса
      }
      if (Game.state === 'over' || R.t > LIMIT) {
        const boss = R.boss ? ' боссHP=' + Math.max(0, Math.round(R.boss.hp / R.boss.maxHp * 100)) + '%' : '';
        lines.push(`${job.ch.name} / ${job.loc.name}: ${R.won ? 'ПОБЕДА' : 'погиб'} на ${fmtTime(R.t)}, ур.${R.p.level}, убито ${R.kills}, комбо x${R.bestCombo}, монет ${R.coins}${boss}`);
        lines.push('   оружие: ' + R.p.weapons.map(w => wName(w) + (w.evo ? '★' : w.lvl)).join(', ') + ' | мин. HP по отрезкам: ' + marks.join(' '));
        lines.push('   урон по герою: ' + top(hurtBy, 5) + (bossT0 ? ' | бой с боссом ' + Math.round(R.t - bossT0 - (R.won ? 2.8 : 0)) + ' с, урон по боссу: ' + top(bossBy, 4) : ''));
        (window.__bot || (window.__bot = [])).push({ stage: R.st ? R.st.n + ':' + R.st.phase + ':' + R.st.wave : '', kills: R.kills, hero: job.ch.id, loc: job.loc.id, won: R.won, t: R.t, level: R.p.level, bossT: bossT0 ? R.t - bossT0 : 0, bossHp: R.boss ? R.boss.hp / R.boss.maxHp : null, hurtBy, bossBy });
        print();
        setTimeout(() => runJob(idx + 1), 10);
      } else {
        box.textContent = lines.join('\n') + `\n... ${job.ch.name}: ${fmtTime(R.t)}, ур.${R.p.level}, врагов ${R.enemies.length}`;
        setTimeout(chunk, 0);
      }
    }
    chunk();
  }
  setTimeout(() => runJob(0), 300);
})();
