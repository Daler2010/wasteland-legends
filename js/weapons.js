// ===== Оружие: логика атак =====

function addWeapon(id) { Game.run.p.weapons.push({ id, lvl: 1, t: 0.3, ang: 0 }); }
function wStats(w) { return w.evo ? WEAPONS[w.id].evo.stats : WEAPONS[w.id].levels[w.lvl - 1]; }
function wName(w) { return w.evo ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name; }

// ---------- Ульты героев ----------
function castUlt(R) {
  const p = R.p;
  if (p.ult < p.ultCost) return;
  p.ult = 0; p.ultCd = ULT_CD; // после ульты заряд какое-то время не копится
  R.flashT = 0.25; R.shake = Math.max(R.shake, 5);
  UI.banner(ULTS[R.ch.id].name + '!', 1.2);
  Sound.shout(R.ch.id); // боевой клич героя
  if (ULT_EXTRA[R.ch.id]) { ULT_EXTRA[R.ch.id](R); return; } // ульты завербованных героев (hub.js)
  if (R.ch.id === 'daler') {
    // два залпа по 28 стрел
    for (let wave = 0; wave < 2; wave++) for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2 + wave * 0.11, sp = 200 - wave * 50;
      R.projs.push({ type: 'arrow', x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: 35, pierce: 6, life: 1.4, hit: new Set(), fire: true });
    }
    Sound.sfx('bow'); Sound.sfx('roar');
  } else if (R.ch.id === 'stimme') {
    const hw = Game.W / 2 + 20, hh = Game.H / 2 + 20;
    for (const e of R.enemies) {
      if (e.dead || Math.abs(e.x - p.x) > hw || Math.abs(e.y - p.y) > hh) continue;
      e.stunT = e.boss ? 1.2 : 3.5;
      hurtEnemy(R, e, 45, e.x - p.x, e.y - p.y, 200);
    }
    R.ebullets = [];
    for (let i = 0; i < 3; i++) R.effects.push({ type: 'ring', delay: i * 0.12, x: p.x, y: p.y, r: 4, maxR: Math.max(hw, hh), t: 0, dur: 0.6, dmg: 0, hit: new Set(), nohit: true });
    Sound.sfx('wave'); Sound.sfx('roar');
  } else if (R.ch.id === 'maga') {
    // землетрясение: всех вокруг оглушает и отбрасывает
    const rad = 95;
    for (const e of R.enemies) {
      if (e.dead || dist2(e.x, e.y, p.x, p.y) > rad * rad) continue;
      e.stunT = e.boss ? 1 : 2.5;
      hurtEnemy(R, e, 45, e.x - p.x, e.y - p.y, 260);
    }
    for (let i = 0; i < 3; i++) R.effects.push({ type: 'ring', delay: i * 0.1, x: p.x, y: p.y, r: 4, maxR: rad, t: 0, dur: 0.45, dmg: 0, hit: new Set(), nohit: true, c: '#c98a5a' });
    burst(R, p.x, p.y + 10, 40, DUST[R.loc.id]);
    R.shake = 9; R.hitstop = 0.08;
    p.squashT = 0.14;
    Sound.sfx('boom'); Sound.sfx('roar');
  } else {
    p.ramT = 4;
    Sound.sfx('dash'); Sound.sfx('roar');
  }
}

// Таран BABADUK: пока активен, сносит всех, кого касается
function updateRam(R, dt) {
  const p = R.p;
  if (p.ramT <= 0) return;
  p.ramT -= dt;
  for (const e of R.enemies) {
    if (e.dead || (e.ramT || 0) > R.t) continue;
    const rr = e.r + 14;
    if (dist2(p.x, p.y, e.x, e.y) < rr * rr) { e.ramT = R.t + 0.3; hurtEnemy(R, e, 45, e.x - p.x, e.y - p.y, 320); }
  }
}

function nearestEnemy(R, x, y, maxD, exclude) {
  let best = null, bd = maxD * maxD;
  for (const e of R.enemies) {
    if (e.dead || (exclude && exclude.has(e))) continue;
    const d = dist2(x, y, e.x, e.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function randomEnemyInView(R) {
  const hw = Game.W / 2, hh = Game.H / 2, p = R.p;
  const list = R.enemies.filter(e => !e.dead && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh);
  return list.length ? pick(list) : null;
}

// Ломаная линия молнии
function jagged(x0, y0, x1, y1) {
  const pts = [[x0, y0]], n = 6;
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  for (let i = 1; i < n; i++) {
    const t = i / n, o = rand(-5, 5);
    pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]);
  }
  pts.push([x1, y1]);
  return pts;
}

function slashHit(R, a, r, dmg) {
  const p = R.p;
  for (const e of R.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > r + e.r) continue;
    let da = Math.atan2(dy, dx) - a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < 1.05 || d < 10) hurtEnemy(R, e, dmg, dx, dy, 110);
  }
}

function sawPositions(w, R, p) {
  const s = wStats(w), out = [], o = p || R.p;
  for (let i = 0; i < s.count; i++) {
    const a = w.ang + i * Math.PI * 2 / s.count;
    out.push([o.x + Math.cos(a) * s.r, o.y + Math.sin(a) * s.r]);
  }
  return out;
}

const WEAPON_LOGIC = {
  bow: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      const tgt = nearestEnemy(R, p.x, p.y, 220);
      if (!tgt) { w.t = 0.1; return; }
      w.t = s.cd * p.cdMul;
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      p.aim = base; p.atkT = 0.15;
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.14;
        R.projs.push({ type: 'arrow', x: p.x, y: p.y - 2, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190,
          dmg: s.dmg, pierce: s.pierce, life: 1.2, hit: new Set(), fire: w.evo });
      }
      Sound.sfx('bow');
    },
  },

  wave: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w);
      w.t = s.cd * R.p.cdMul;
      for (let i = 0; i < s.rings; i++) {
        R.effects.push({ type: 'ring', delay: i * 0.25, x: R.p.x, y: R.p.y, r: 4, maxR: s.r * R.p.area, t: 0, dur: 0.45, dmg: s.dmg, hit: new Set() });
      }
      if (w.evo) {
        // «Ария бури» притягивает кристаллы издалека
        const pr = s.r * 1.6;
        for (const k of R.pickups) if (k.type !== 'heart' && dist2(k.x, k.y, R.p.x, R.p.y) < pr * pr) k.mag = true;
      }
      // ноты разлетаются от певицы
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        R.particles.push({ x: R.p.x, y: R.p.y - 6, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 0.45, c: i % 2 ? '#e86a92' : '#f4f4f4', s: 2, g: 0 });
      }
      R.p.atkT = 0.2;
      Sound.sfx('wave');
    },
  },

  sword: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      w.t = s.cd * p.cdMul;
      // рубит в сторону ближайшего врага; если рядом никого — по ходу движения
      const sr = s.r * p.area;
      const tgt = nearestEnemy(R, p.x, p.y, sr + 30);
      const base = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : Math.atan2(p.dirY, p.dirX);
      p.aim = base; p.atkT = 0.2;
      for (let i = 0; i < s.dirs; i++) {
        const a = base + i * (Math.PI * 2 / s.dirs);
        R.effects.push({ type: 'slash', a, r: sr, t: 0, dur: 0.2 });
        slashHit(R, a, sr, s.dmg);
      }
      Sound.sfx('sword');
    },
  },

  molotov: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      w.t = s.cd * p.cdMul;
      for (let i = 0; i < s.count; i++) {
        const tgt = randomEnemyInView(R);
        let tx, ty;
        if (tgt) { tx = tgt.x; ty = tgt.y; }
        else { const a = Math.random() * Math.PI * 2; tx = p.x + Math.cos(a) * 60; ty = p.y + Math.sin(a) * 60; }
        R.projs.push({ type: 'bottle', sx: p.x, sy: p.y, x: p.x, y: p.y, tx, ty, t: 0, dur: 0.55, s, life: 1 });
      }
      Sound.sfx('throw');
    },
  },

  saws: {
    update(w, dt, R) {
      const s = wStats(w);
      w.ang += s.spd * dt;
      for (const [sx, sy] of sawPositions(w, R)) {
        for (const e of R.enemies) {
          if (e.dead || (e.sawT || 0) > R.t) continue;
          const rr = e.r + 4;
          if (dist2(sx, sy, e.x, e.y) < rr * rr) {
            e.sawT = R.t + 0.4;
            hurtEnemy(R, e, s.dmg, e.x - R.p.x, e.y - R.p.y, 60);
          }
        }
      }
    },
  },

  tesla: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w);
      w.t = s.cd * R.p.cdMul;
      let fired = false;
      for (let k = 0; k < s.strikes; k++) {
        let cur = randomEnemyInView(R);
        if (!cur) break;
        fired = true;
        const hitSet = new Set();
        let fx = cur.x + rand(-10, 10), fy = cur.y - 120; // первый удар — с неба
        for (let c = 0; c <= s.chains && cur; c++) {
          R.effects.push({ type: 'bolt', pts: jagged(fx, fy, cur.x, cur.y), t: 0, dur: 0.18 });
          hitSet.add(cur);
          fx = cur.x; fy = cur.y;
          hurtEnemy(R, cur, s.dmg, 0, 0, 0);
          cur = nearestEnemy(R, fx, fy, 60, hitSet);
        }
      }
      if (fired) Sound.sfx('zap');
      else w.t = 0.2;
    },
  },
};

// ================= Новое оружие =================
function boomArea(R, x, y, r, dmg, kb, slow) {
  for (const e of R.enemies) {
    if (e.dead) continue;
    const rr = r + e.r;
    if (dist2(x, y, e.x, e.y) < rr * rr) {
      if (slow) e.slowT = Math.max(e.slowT || 0, slow);
      hurtEnemy(R, e, dmg, e.x - x, e.y - y, kb);
    }
  }
}

Object.assign(WEAPON_LOGIC, {
  axe: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      const tgt = nearestEnemy(R, p.x, p.y, s.range + 60);
      if (!tgt) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMul;
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      p.aim = base; p.atkT = 0.2;
      for (let i = 0; i < s.count; i++) {
        // «Лабрис бури» летит веером во все стороны, обычные секиры — узким веером в цель
        const a = w.evo ? base + i * Math.PI * 2 / s.count : base + (i - (s.count - 1) / 2) * 0.4;
        R.projs.push({ type: 'axe', x: p.x, y: p.y - 2, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, dist: 0, range: s.range * p.area, dmg: s.dmg, pierce: s.pierce || 99, t: 0, life: 1, big: w.evo, hit: new Set() });
      }
      Sound.sfx('sword');
    },
  },

  boomerang: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      const tgt = nearestEnemy(R, p.x, p.y, s.range + 40);
      if (!tgt) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMul;
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * (w.evo ? 1.25 : 0.5);
        R.projs.push({ type: 'boom', a, t: 0, dur: 0.95, range: s.range, dmg: s.dmg, x: p.x, y: p.y, life: 1, big: w.evo, out: new Set(), back: new Set() });
      }
      Sound.sfx('throw');
    },
  },

  mines: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      w.t = s.cd * p.cdMul;
      for (let i = 0; i < s.count; i++) {
        const a = Math.random() * Math.PI * 2, d = s.count > 1 ? 16 : 0;
        R.projs.push({ type: 'mine', x: p.x + Math.cos(a) * d, y: p.y + 8 + Math.sin(a) * d, arm: 0.5, life: 14, r: s.r * p.area, dmg: s.dmg });
      }
      // не копим бесконечно: самые старые мины исчезают
      const mines = R.projs.filter(q => q.type === 'mine');
      for (let i = 0; i < mines.length - 14; i++) mines[i].life = 0;
    },
  },

  flame: {
    update(w, dt, R) {
      const s = wStats(w), p = R.p, range = s.range * p.area;
      w.t -= dt;
      if (w.t > 0) return;
      const tgt = nearestEnemy(R, p.x, p.y, range + 10);
      if (!tgt) { w.t = 0.1; return; }
      w.t = 0.12;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      p.aim = a;
      for (const e of R.enemies) {
        if (e.dead) continue;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d > range + e.r) continue;
        let da = Math.atan2(dy, dx) - a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < s.half || d < 10) hurtEnemy(R, e, s.dmg, dx, dy, 25);
      }
      // языки пламени
      const cols = ['#f59e42', '#ffcd75', '#b13e53'];
      for (let i = 0; i < 4 && R.particles.length < 500; i++) {
        const b = a + rand(-s.half, s.half), sp = range / 0.32 * rand(0.7, 1);
        R.particles.push({ x: p.x + Math.cos(a) * 6, y: p.y + 2 + Math.sin(a) * 6, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: 0.32, c: cols[i % 3], s: 2, g: 0 });
      }
      w.snd = (w.snd || 0) - 0.12;
      if (w.snd <= 0) { w.snd = 0.35; Sound.sfx('fire'); }
    },
  },

  frost: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      const tgt = nearestEnemy(R, p.x, p.y, 200);
      if (!tgt) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMul;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      R.projs.push({ type: 'orb', x: p.x, y: p.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: 2.2, dmg: s.dmg, r: s.r * p.area, slow: s.slow });
      Sound.sfx('wave');
    },
  },

  shotgun: {
    update(w, dt, R) {
      w.t -= dt;
      if (w.t > 0) return;
      const s = wStats(w), p = R.p;
      const tgt = nearestEnemy(R, p.x, p.y, 120);
      if (!tgt) { w.t = 0.12; return; }
      w.t = s.cd * p.cdMul;
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      p.aim = base;
      for (let i = 0; i < s.count; i++) {
        const a = base + rand(-0.36, 0.36), sp = rand(230, 290);
        R.projs.push({ type: 'arrow', pellet: true, x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: s.dmg, pierce: s.pierce, life: 0.42, hit: new Set() });
      }
      R.shake = Math.max(R.shake, 1.2);
      Sound.sfx('boom');
    },
  },
});

// Обновление новых снарядов (вызывается из updateProjectiles)
function updateExtraProj(R, pr, dt) {
  const p = R.p;
  if (pr.type === 'axe') {
    // тяжёлая секира: летит прямо, пробивает всех, каждого задевает один раз
    pr.t += dt;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.dist += 175 * dt;
    const hr = pr.big ? 13 : 9;
    for (const e of R.enemies) {
      if (e.dead || pr.hit.has(e)) continue;
      const rr = e.r + hr;
      if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) { pr.hit.add(e); hurtEnemy(R, e, pr.dmg, pr.vx, pr.vy, 110); }
    }
    if (pr.hit.size >= pr.pierce) pr.dist = pr.range; // секира застревает после нескольких врагов
    if (pr.dist >= pr.range) { pr.life = 0; burst(R, pr.x, pr.y, 4, '#c7dcd0'); }
  } else if (pr.type === 'boom') {
    // летит по дуге от героя и обратно; каждого врага задевает по разу в каждую сторону
    pr.t += dt;
    const q = pr.t / pr.dur, d = Math.sin(q * Math.PI) * pr.range, a = pr.a + (q - 0.5) * 0.9;
    pr.x = p.x + Math.cos(a) * d; pr.y = p.y + Math.sin(a) * d;
    const set = q < 0.5 ? pr.out : pr.back, hr = pr.big ? 11 : 7;
    for (const e of R.enemies) {
      if (e.dead || set.has(e)) continue;
      const rr = e.r + hr;
      if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) { set.add(e); hurtEnemy(R, e, pr.dmg, e.x - p.x, e.y - p.y, 60); }
    }
    if (q >= 1) pr.life = 0;
  } else if (pr.type === 'mine') {
    pr.life -= dt; pr.arm -= dt;
    if (pr.arm > 0) return;
    for (const e of R.enemies) {
      if (e.dead || e.def.ai === 'drone') continue; // дроны летят над минами
      const rr = e.r + 9;
      if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) {
        pr.life = 0;
        boomArea(R, pr.x, pr.y, pr.r, pr.dmg, 180);
        burst(R, pr.x, pr.y, 16, '#f59e42'); burst(R, pr.x, pr.y, 8, '#ffcd75');
        R.effects.push({ type: 'ring', nohit: true, fixed: true, x: pr.x, y: pr.y, r: 4, maxR: pr.r, t: 0, dur: 0.25, c: '#f59e42', hit: new Set() });
        R.shake = Math.max(R.shake, 2.5);
        Sound.sfx('boom');
        return;
      }
    }
  } else if (pr.type === 'orb') {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    let hit = pr.life <= 0 || solidAt(R.loc, pr.x, pr.y + 6);
    if (!hit) for (const e of R.enemies) {
      if (e.dead) continue;
      const rr = e.r + 4;
      if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) { hit = true; break; }
    }
    if (hit) {
      pr.life = 0;
      boomArea(R, pr.x, pr.y, pr.r, pr.dmg, 40, pr.slow);
      burst(R, pr.x, pr.y, 14, '#73eff7'); burst(R, pr.x, pr.y, 6, '#f4f4f4');
      R.effects.push({ type: 'ring', nohit: true, fixed: true, x: pr.x, y: pr.y, r: 4, maxR: pr.r, t: 0, dur: 0.3, c: '#73eff7', hit: new Set() });
      Sound.sfx('zap');
    } else if (Math.random() < 0.5 && R.particles.length < 500) {
      R.particles.push({ x: pr.x, y: pr.y, vx: rand(-10, 10), vy: rand(-10, 10), life: 0.3, c: '#73eff7', s: 1, g: 0 });
    }
  }
}

function drawExtraProj(ctx, R, pr, cx, cy) {
  if (pr.type === 'axe') {
    const k = pr.big ? 2.5 : 1.75, ph = Math.floor(pr.t * 20) % 4;
    sprFeet(ctx, 'i_axe', pr.x, pr.y + 4 * k, ph === 1 || ph === 2, false, ph % 2 ? k : k * 0.75, ph % 2 ? k * 0.75 : k);
  } else if (pr.type === 'boom') {
    const k = pr.big ? 2 : 1, ph = Math.floor(pr.t * 22) % 4;
    // вращение: чередуем отражения спрайта
    sprFeet(ctx, 'i_boomerang', pr.x, pr.y + 4 * k, ph === 1 || ph === 2, false, ph % 2 ? k : k * 0.7, ph % 2 ? k * 0.7 : k);
  } else if (pr.type === 'mine') {
    spr(ctx, 'mine', pr.x, pr.y);
    if (pr.arm <= 0 && Math.floor(R.t * 4) % 2) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(Math.round(pr.x - cx), Math.round(pr.y - 3 - cy), 1, 1); }
  } else if (pr.type === 'orb') {
    const x = pr.x - cx, y = pr.y - cy;
    pxDisc(ctx, x, y, 3, '#41a6f6'); pxDisc(ctx, x, y, 2, '#73eff7');
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 1, 1);
  }
}
