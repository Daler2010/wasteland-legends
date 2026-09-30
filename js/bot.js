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
      const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d < 40) { x += dx / d * 2; y += dy / d * 2; }
    }
    let best = null, bd = 140 * 140;
    for (const k of R.pickups) { const d = dist2(k.x, k.y, p.x, p.y); if (d < bd) { bd = d; best = k; } }
    if (best) { const d = Math.sqrt(bd) || 1; x += (best.x - p.x) / d * 1.3; y += (best.y - p.y) / d * 1.3; }
    const m = Math.hypot(x, y);
    Input.keys = {};
    if (m > 0.05) {
      if (x / m > 0.38) Input.keys.KeyD = true; else if (x / m < -0.38) Input.keys.KeyA = true;
      if (y / m > 0.38) Input.keys.KeyS = true; else if (y / m < -0.38) Input.keys.KeyW = true;
    }
    if (danger >= 2 && p.dashCd <= 0) Input.dashQ = true;
    if (p.ult >= p.ultCost && (danger >= 1 || R.boss)) Input.ultQ = true;
  }

  function chooseUpgrade() {
    const opts = UI.levelOpts;
    Game.choose(opts.find(o => o.kind === 'evolve') || pick(opts));
  }

  const jobs = [];
  for (const ch of CHARACTERS) for (let i = 0; i < RUNS; i++) jobs.push({ ch, loc: LOCATIONS[(CHARACTERS.indexOf(ch) + i) % LOCATIONS.length] });

  function runJob(idx) {
    if (idx >= jobs.length) { lines.push('', 'ГОТОВО. Убери ?bot из адреса, чтобы играть.'); print(); Game.quit(); Input.keys = {}; return; }
    const job = jobs[idx];
    Game.start(job.ch.id, job.loc.id);
    const R = Game.run, marks = [];
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
        if (R.t > RUN_TIME + 240) break; // бот не может добить босса
      }
      if (Game.state === 'over' || R.t > RUN_TIME + 240) {
        const boss = R.boss ? ' боссHP=' + Math.max(0, Math.round(R.boss.hp / R.boss.maxHp * 100)) + '%' : '';
        lines.push(`${job.ch.name} / ${job.loc.name}: ${R.won ? 'ПОБЕДА' : 'погиб'} на ${fmtTime(R.t)}, ур.${R.p.level}, убито ${R.kills}, комбо x${R.bestCombo}, монет ${R.coins}${boss}`);
        lines.push('   оружие: ' + R.p.weapons.map(w => wName(w) + (w.evo ? '★' : w.lvl)).join(', ') + ' | мин. HP по отрезкам: ' + marks.join(' '));
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
