// ===== Управление: клавиатура + плавающий джойстик для тачскрина =====
const JOY_RADIUS = 50; // в экранных пикселях

const Input = {
  keys: {},
  joy: { active: false, id: null, sx: 0, sy: 0, x: 0, y: 0 },
  onKey: null,
  ultQ: false,  // нажата ульта (E / Q / кнопка на экране)
  dashQ: false, // нажат рывок (пробел / Shift / кнопка на экране)

  init(canvas) {
    addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (Game.state === 'playing' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!e.repeat && (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')) this.dashQ = true;
      if (!e.repeat && (e.code === 'KeyE' || e.code === 'KeyQ')) this.ultQ = true;
      if (this.onKey) this.onKey(e);
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.joy.active = false; });

    canvas.addEventListener('pointerdown', e => {
      if (this.joy.active) return;
      Sound.init();
      this.joy = { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      const j = this.joy;
      if (!j.active || e.pointerId !== j.id) return;
      j.x = e.clientX; j.y = e.clientY;
      // база джойстика «едет» за пальцем, если утащить далеко
      const dx = j.x - j.sx, dy = j.y - j.sy, d = Math.hypot(dx, dy);
      if (d > JOY_RADIUS) { j.sx += dx / d * (d - JOY_RADIUS); j.sy += dy / d * (d - JOY_RADIUS); }
    });
    const end = e => { if (e.pointerId === this.joy.id) this.joy.active = false; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  },

  // Направление движения, длина вектора <= 1
  axis() {
    const j = this.joy;
    if (j.active) {
      const dx = j.x - j.sx, dy = j.y - j.sy, d = Math.hypot(dx, dy);
      if (d > 6) { const m = Math.min(1, d / JOY_RADIUS); return { x: dx / d * m, y: dy / d * m }; }
    }
    if (Pad.ax || Pad.ay) return { x: Pad.ax, y: Pad.ay }; // геймпад
    const k = this.keys;
    let x = 0, y = 0;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y -= 1;
    if (k.KeyS || k.ArrowDown) y += 1;
    const m = Math.hypot(x, y);
    if (m > 0) { x /= m; y /= m; }
    return { x, y };
  },
};
