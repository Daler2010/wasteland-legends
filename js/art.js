// ===== Крупные иллюстрации для комикс-сцен и портретов =====
// Рисуются кодом на холсте 400x490: гладкие контуры, заливки, тени и блики — как в комиксе.
// Цвета берутся из тех же палитр, что и у игровых спрайтов (HERO_PAL), поэтому костюмы работают и здесь.

const ART_OUT = '#15121c';

function artKit() {
  const c = makeCanvas(400, 490), x = c.getContext('2d');
  x.lineJoin = 'round'; x.lineCap = 'round';
  x.translate(0, 30); // запас сверху под рога, корону, плюмаж
  const A = {
    c, x,
    // фигура по SVG-пути: заливка + контур (lw = 0 — без контура)
    path(d, fill, lw) {
      const p = new Path2D(d);
      if (fill) { x.fillStyle = fill; x.fill(p); }
      if (lw !== 0) { x.lineWidth = lw || 5; x.strokeStyle = ART_OUT; x.stroke(p); }
    },
    // заливка внутри другой фигуры (тени и блики, не вылезающие за край)
    inside(clipD, d, fill, alpha) {
      x.save(); x.clip(new Path2D(clipD));
      x.globalAlpha = alpha === undefined ? 1 : alpha;
      x.fillStyle = fill; x.fill(new Path2D(d));
      x.restore();
    },
    ell(cx, cy, rx, ry, fill, lw, rot) {
      x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2);
      if (fill) { x.fillStyle = fill; x.fill(); }
      if (lw) { x.lineWidth = lw; x.strokeStyle = ART_OUT; x.stroke(); }
    },
    line(d, col, lw) { x.lineWidth = lw; x.strokeStyle = col; x.stroke(new Path2D(d)); },
    // зеркальная пара относительно x = 200
    mirror(fn) { fn(); x.save(); x.translate(400, 0); x.scale(-1, 1); fn(); x.restore(); },
  };
  return A;
}

// Аниме-глаз: белок, радужка с затемнением сверху, зрачок, два блика, веко и ресницы
function artEye(A, cx, cy, o) {
  const x = A.x, rx = o.rx || 19, ry = o.ry || 21;
  x.save();
  const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.fillStyle = '#ffffff'; x.fill(p); x.clip(p);
  x.fillStyle = 'rgba(60,40,90,0.2)'; x.fillRect(cx - rx, cy - ry, rx * 2, ry * 0.6);
  A.ell(cx, cy + 2, rx * 0.68, ry * 0.85, o.iris);
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(cx, cy - ry * 0.3, rx * 0.68, ry * 0.55, 0, 0, Math.PI * 2); x.fill();
  A.ell(cx, cy + 3, rx * 0.3, ry * 0.42, ART_OUT);
  A.ell(cx - rx * 0.3, cy - ry * 0.3, rx * 0.22, ry * 0.2, '#ffffff');
  A.ell(cx + rx * 0.28, cy + ry * 0.4, rx * 0.11, ry * 0.1, 'rgba(255,255,255,0.85)');
  x.restore();
  x.strokeStyle = ART_OUT;
  x.lineWidth = o.lash ? 7 : 5; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.04, Math.PI * 1.96); x.stroke();
  x.lineWidth = 2.5; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
  if (o.lash) {
    const s = o.side;
    A.line(`M${cx + s * rx} ${cy - 5} l${s * 11} -9`, ART_OUT, 4);
    A.line(`M${cx + s * (rx - 5)} ${cy - 13} l${s * 8} -11`, ART_OUT, 3);
  }
}

const ART_HEAD = 'M122 170 C118 60 282 60 278 170 C276 232 236 276 200 282 C164 276 124 232 122 170 Z';
const ART_HEAD_W = 'M118 165 C114 60 286 60 282 165 C282 228 252 274 200 282 C148 274 118 228 118 165 Z';
const ART_SHADE = 'M236 60 C300 110 296 240 200 292 L300 292 L300 60 Z'; // тень на правой половине лица
const ART_TORSO = 'M40 460 C48 380 90 335 165 312 L235 312 C310 335 352 380 360 460 Z';

const ART_PAINT = {
  daler(A, P) {
    // колчан со стрелами за плечом
    A.path('M296 262 L346 246 L376 400 L326 414 Z', P.leather);
    A.line('M306 300 L352 286', P.leatherHi, 5);
    for (const [ax, c] of [[312, P.red], [328, P.white], [342, P.red]]) {
      A.path(`M${ax} 256 L${ax - 4} 176 L${ax + 6} 176 Z`, P.wood, 3);
      A.path(`M${ax - 10} 186 L${ax + 1} 150 L${ax + 12} 186 Z`, c, 3);
    }
    // длинные волосы за спиной
    A.path('M108 150 C80 56 320 56 292 150 C318 260 330 360 318 460 L82 460 C70 360 82 260 108 150 Z', P.hairSh);
    A.line('M100 300 C96 350 100 410 96 456', P.hair, 8); A.line('M300 300 C304 350 300 410 304 456', P.hair, 8);
    // острые эльфийские уши
    A.mirror(() => { A.path('M128 176 L48 134 L130 224 Z', P.skin); A.path('M122 186 L78 160 L126 212 Z', P.skinSh, 0); });
    // шея, туника, вырез
    A.path('M172 250 L172 320 L228 320 L228 250 Z', P.skinSh, 4);
    A.path(ART_TORSO, P.tunic);
    A.inside(ART_TORSO, 'M260 300 L380 300 L380 470 L300 470 Z', P.tunicSh, 0.7);
    A.path('M165 312 L200 396 L235 312 Z', P.skin, 4);
    A.line('M176 328 L196 338', P.skinSh, 3); A.line('M224 328 L204 338', P.skinSh, 3);
    // ремень колчана через грудь
    A.path('M252 318 L284 332 L178 460 L136 460 Z', P.leather, 4);
    A.ell(232, 366, 6, 6, P.gold, 3);
    // накидка на плечах с золотыми застёжками
    A.mirror(() => {
      A.path('M40 460 C48 380 90 335 165 312 L150 362 C112 382 96 422 92 460 Z', P.cloak);
      A.ell(158, 342, 11, 11, P.gold, 4); A.ell(155, 339, 4, 4, '#ffffff');
    });
    // лицо
    A.path(ART_HEAD, P.skin);
    A.inside(ART_HEAD, ART_SHADE, P.skinSh, 0.45);
    artEye(A, 165, 190, { iris: P.eye, rx: 18, ry: 17 }); artEye(A, 235, 190, { iris: P.eye, rx: 18, ry: 17 });
    A.line('M140 164 Q164 150 188 160', P.hairSh, 6); A.line('M212 160 Q236 150 260 164', P.hairSh, 6);
    A.line('M200 204 L193 228 L204 230', P.skinSh, 3);
    A.line('M180 250 Q206 264 226 246', ART_OUT, 4);
    // чёлка и пряди вдоль лица
    A.path('M118 152 C110 70 170 48 200 54 C230 48 290 70 282 152 C272 122 252 106 234 100 C238 116 234 128 226 140 C216 116 200 104 186 100 C176 122 160 136 140 142 C138 130 132 124 126 122 C124 134 122 144 118 152 Z', P.hair);
    A.mirror(() => A.path('M118 146 C106 200 110 272 128 336 C142 300 138 220 132 160 Z', P.hair));
    A.line('M150 80 Q200 62 250 80', P.hairHi, 7);
    // повязка с камнем
    A.path('M120 124 C160 108 240 108 280 124 L280 144 C240 128 160 128 120 144 Z', P.band);
    A.path('M200 110 L214 126 L200 144 L186 126 Z', P.gem, 4); A.ell(196, 122, 3, 3, '#ffffff');
  },

  stimme(A, P) {
    // пышные волнистые волосы
    A.path('M100 160 C70 36 330 36 300 160 C350 220 330 300 362 362 C340 400 352 440 332 460 L68 460 C48 440 60 400 38 362 C70 300 50 220 100 160 Z', P.hairSh);
    A.mirror(() => { A.line('M66 300 C88 340 66 384 88 436', P.hair, 9); A.line('M96 330 C110 370 96 410 108 452', P.hairHi, 5); });
    // шея, открытые плечи, ключицы
    A.path('M174 250 L174 324 L226 324 L226 250 Z', P.skinSh, 4);
    A.path('M60 460 C66 390 100 345 165 318 L235 318 C300 345 334 390 340 460 Z', P.skin);
    A.inside('M60 460 C66 390 100 345 165 318 L235 318 C300 345 334 390 340 460 Z', 'M262 300 L360 300 L360 470 L300 470 Z', P.skinSh, 0.4);
    A.line('M150 346 Q176 352 194 344', P.skinSh, 3); A.line('M250 346 Q224 352 206 344', P.skinSh, 3);
    // корсаж с золотой каймой и шнуровкой
    A.path('M104 460 L112 402 C140 386 172 402 200 424 C228 402 260 386 288 402 L296 460 Z', P.bodice);
    A.line('M112 402 C140 386 172 402 200 424 C228 402 260 386 288 402', P.gold, 8);
    A.line('M190 436 L210 448 M210 436 L190 448', P.gold, 4);
    // ожерелье с кулоном
    A.line('M170 322 Q200 358 230 322', P.gold, 4);
    A.path('M200 346 L211 360 L200 378 L189 360 Z', P.gem, 3); A.ell(197, 358, 3, 3, '#ffffff');
    // лицо
    A.path(ART_HEAD, P.skin);
    A.inside(ART_HEAD, ART_SHADE, P.skinSh, 0.35);
    A.x.globalAlpha = 0.5; A.ell(142, 230, 19, 10, P.blush); A.ell(258, 230, 19, 10, P.blush); A.x.globalAlpha = 1;
    artEye(A, 163, 192, { iris: P.eye, rx: 21, ry: 24, lash: true, side: -1 });
    artEye(A, 237, 192, { iris: P.eye, rx: 21, ry: 24, lash: true, side: 1 });
    A.line('M140 158 Q164 148 186 156', P.lash, 4); A.line('M214 156 Q236 148 260 158', P.lash, 4);
    A.line('M198 224 L204 228', P.skinSh, 3);
    A.path('M184 252 Q200 245 216 252 Q200 268 184 252 Z', P.lip, 3);
    // серьги
    A.mirror(() => A.ell(122, 240, 6, 10, P.gem, 3));
    // косая чёлка и локоны
    A.path('M116 162 C104 70 168 44 200 50 C232 44 296 70 284 162 C276 128 262 112 246 104 C214 100 176 118 150 152 C146 140 140 132 132 128 C126 140 120 152 116 162 Z', P.hair);
    A.mirror(() => A.path('M116 152 C100 212 108 292 94 354 C120 332 136 262 130 172 Z', P.hair));
    A.line('M146 84 Q200 60 254 84', P.hairHi, 8);
    // корона с рубином
    A.path('M150 70 L158 18 L178 52 L200 4 L222 52 L242 18 L250 70 Z', P.gold);
    A.path('M150 70 L250 70 L246 88 L154 88 Z', P.goldSh);
    A.ell(200, 54, 9, 12, P.ruby, 3); A.ell(197, 50, 3, 4, '#ffffff');
    A.ell(166, 78, 5, 5, P.gem, 2); A.ell(234, 78, 5, 5, P.gem, 2);
  },

  babaduk(A, P) {
    // плащ
    A.path('M16 460 C28 380 70 330 120 320 L280 320 C330 330 372 380 384 460 Z', P.cape);
    A.line('M60 380 C56 410 60 440 56 458', P.capeSh, 8); A.line('M340 380 C344 410 340 440 344 458', P.capeSh, 8);
    // горжет и кираса с гербом
    A.path('M160 268 L160 336 L240 336 L240 268 Z', P.steelDk, 4);
    A.path('M70 460 C76 396 110 352 165 332 L235 332 C290 352 324 396 330 460 Z', P.steel);
    A.inside('M70 460 C76 396 110 352 165 332 L235 332 C290 352 324 396 330 460 Z', 'M250 320 L340 320 L340 470 L280 470 Z', P.steelSh, 0.8);
    A.line('M128 392 C132 418 130 440 128 458', P.white, 9);
    A.path('M200 368 L224 400 L200 446 L176 400 Z', P.gold, 4); A.path('M200 384 L210 400 L200 422 L190 400 Z', P.gem, 3);
    // массивные наплечники
    A.mirror(() => {
      A.ell(80, 376, 64, 52, P.steel, 5);
      A.line('M28 392 Q80 428 134 392', P.gold, 8);
      A.line('M46 350 Q76 330 108 340', P.white, 7);
      A.ell(80, 376, 7, 7, P.gold, 3);
    });
    // лицо
    A.path(ART_HEAD_W, P.skin);
    A.inside(ART_HEAD_W, ART_SHADE, P.skinSh, 0.45);
    A.inside(ART_HEAD_W, 'M118 222 C150 262 250 262 282 222 L282 292 L118 292 Z', P.skinSh, 0.35); // щетина
    artEye(A, 166, 194, { iris: P.eye, rx: 17, ry: 12 }); artEye(A, 234, 194, { iris: P.eye, rx: 17, ry: 12 });
    A.line('M142 172 L188 179', P.eye, 8); A.line('M258 172 L212 179', P.eye, 8);
    A.line('M200 204 L191 234 L206 236', P.skinSh, 4);
    A.line('M180 258 Q202 264 224 254', ART_OUT, 4);
    // шлем: купол, нащёчники, наносник
    A.path('M110 176 C98 36 302 36 290 176 L290 252 C282 266 268 266 262 252 L262 162 C240 150 160 150 138 162 L138 252 C132 266 118 266 110 252 Z', P.steel);
    A.inside('M110 176 C98 36 302 36 290 176 L290 252 C282 266 268 266 262 252 L262 162 C240 150 160 150 138 162 L138 252 C132 266 118 266 110 252 Z', 'M240 40 L310 40 L310 280 L262 280 L262 150 Z', P.steelSh, 0.8);
    A.path('M190 152 L210 152 L208 208 L192 208 Z', P.steel, 4);
    A.line('M140 104 C150 72 180 60 206 58', P.white, 9);
    // корона на шлеме
    A.path('M108 120 C160 100 240 100 292 120 L292 148 C240 128 160 128 108 148 Z', P.gold);
    A.path('M148 112 L158 84 L168 108 Z', P.gold, 4); A.path('M186 104 L200 66 L214 104 Z', P.gold, 4); A.path('M232 108 L242 84 L252 112 Z', P.gold, 4);
    A.ell(200, 124, 9, 9, P.gem, 3); A.ell(197, 121, 3, 3, '#ffffff');
    // плюмаж
    A.path('M198 58 C172 -14 88 -4 58 60 C94 40 130 50 150 82 C160 62 180 54 198 58 Z', P.plume);
    A.line('M186 50 C160 18 118 18 88 46', P.plumeSh, 6);
  },

  maga(A, P) {
    // грива за спиной
    A.path('M92 170 C60 56 340 56 308 170 C346 250 352 360 342 460 L58 460 C48 360 54 250 92 170 Z', P.hairSh);
    // шея, трапеции, грудь
    const BODY = 'M8 460 C18 380 70 330 140 302 L150 250 L250 250 L260 302 C330 330 382 380 392 460 Z';
    A.path(BODY, P.fur);
    A.inside(BODY, 'M262 240 L400 240 L400 470 L300 470 Z', P.furSh, 0.5);
    A.line('M200 372 L200 458', P.furSh, 6);
    A.mirror(() => { A.line('M88 434 Q150 456 196 434', P.furSh, 6); A.line('M66 384 Q108 352 150 354', P.furHi, 9); A.line('M150 300 Q160 330 190 342', P.furSh, 5); });
    // ремень с заклёпками
    A.path('M118 312 L160 300 L332 460 L280 460 Z', P.leather, 4);
    A.ell(178, 338, 6, 6, P.gold, 3); A.ell(232, 390, 6, 6, P.gold, 3); A.ell(284, 438, 6, 6, P.gold, 3);
    // рога
    A.mirror(() => { A.path('M122 122 C70 112 28 70 38 2 C70 50 110 70 142 86 Z', P.horn); A.line('M56 40 C70 66 95 84 120 94', P.hornSh, 5); A.line('M44 30 C46 46 52 58 60 68', P.hornHi, 4); });
    // уши
    A.mirror(() => { A.path('M116 172 L48 150 L70 202 L118 206 Z', P.fur); A.path('M104 178 L66 168 L78 194 Z', P.snout, 0); });
    // бычья голова
    const HEAD = 'M110 172 C100 68 300 68 290 172 C292 232 270 272 250 292 L150 292 C130 272 108 232 110 172 Z';
    A.path(HEAD, P.fur);
    A.inside(HEAD, ART_SHADE, P.furSh, 0.45);
    A.inside(HEAD, 'M118 170 C150 142 250 142 282 170 C250 160 150 160 118 170 Z', P.furSh, 0.8); // надбровье
    // морда, ноздри, кольцо
    A.path('M140 252 C136 212 264 212 260 252 C268 302 240 332 200 334 C160 332 132 302 140 252 Z', P.snout);
    A.ell(176, 272, 12, 8, P.dark); A.ell(224, 272, 12, 8, P.dark);
    A.line('M170 310 Q200 320 230 310', ART_OUT, 4);
    const x = A.x;
    x.strokeStyle = ART_OUT; x.lineWidth = 11; x.beginPath(); x.arc(200, 290, 22, 0.12 * Math.PI, 0.88 * Math.PI); x.stroke();
    x.strokeStyle = P.gold; x.lineWidth = 6; x.beginPath(); x.arc(200, 290, 22, 0.12 * Math.PI, 0.88 * Math.PI); x.stroke();
    // глаза и суровые брови
    artEye(A, 160, 194, { iris: P.eye, rx: 16, ry: 11 }); artEye(A, 240, 194, { iris: P.eye, rx: 16, ry: 11 });
    A.line('M132 174 L186 188', P.dark, 10); A.line('M268 174 L214 188', P.dark, 10);
    // чёлка и длинные пряди на груди
    A.path('M128 124 C138 58 262 58 272 124 C252 102 238 114 228 144 C216 114 200 100 190 140 C176 112 160 100 150 138 C144 122 138 118 128 124 Z', P.hair);
    A.mirror(() => A.path('M104 202 C80 272 90 362 68 434 C112 402 128 300 122 216 Z', P.hair));
    A.line('M160 86 Q200 72 240 86', P.hairHi, 7);
    A.mirror(() => A.line('M98 260 C92 310 96 360 84 404', P.hairHi, 5));
  },

  // ---------- боссы ----------
  scorpion(A) {
    const G = '#38b764', L = '#a7f070', D = '#257179';
    // хвост с жалом
    A.path('M210 300 C340 300 388 200 336 108 C326 90 304 80 288 86 C334 132 332 222 252 252 Z', G);
    A.line('M300 250 C340 220 350 170 336 130', D, 6);
    A.path('M290 88 C276 46 232 36 214 70 C240 60 264 72 278 98 Z', '#ffcd75');
    // клешни
    A.mirror(() => { A.path('M112 332 C40 322 8 250 40 188 C50 230 70 250 96 256 C80 220 90 180 122 164 C122 212 136 252 152 302 Z', G); A.line('M60 250 C70 280 92 300 116 310', L, 6); });
    // панцирь и голова
    const BODY = 'M88 460 C78 340 130 270 200 264 C270 270 322 340 312 460 Z';
    A.path(BODY, G);
    A.inside(BODY, 'M240 250 L330 250 L330 470 L270 470 Z', D, 0.7);
    A.line('M112 404 Q200 372 288 404', D, 6); A.line('M104 440 Q200 410 296 440', D, 6);
    A.line('M150 300 Q200 284 250 300', L, 7);
    // глаза
    for (const [ex, ey, r] of [[164, 332, 17], [236, 332, 17], [134, 368, 9], [266, 368, 9]]) {
      A.ell(ex, ey, r, r * 1.1, '#ef3b5b', 4); A.ell(ex - r * 0.3, ey - r * 0.3, r * 0.3, r * 0.3, '#ffffff');
    }
    A.path('M168 402 L184 452 L200 412 L216 452 L232 402 Z', '#f0e6c8', 4);
  },

  robot(A) {
    const S = '#aebfd0', Sh = '#7d90a6', Dk = '#566c86';
    A.line('M200 92 L200 40', ART_OUT, 12); A.line('M200 92 L200 40', Dk, 6);
    A.ell(200, 32, 13, 13, '#ef3b5b', 4); A.ell(196, 28, 4, 4, '#ffffff');
    // плечи и корпус
    const BODY = 'M28 460 L40 362 L140 342 L260 342 L360 362 L372 460 Z';
    A.path(BODY, S);
    A.inside(BODY, 'M262 330 L380 330 L380 470 L290 470 Z', Sh, 0.8);
    A.path('M150 398 L250 398 L250 452 L150 452 Z', '#ffcd75', 4);
    for (let i = 0; i < 4; i++) A.inside('M150 398 L250 398 L250 452 L150 452 Z', `M${156 + i * 26} 398 l14 0 l-20 54 l-14 0 Z`, ART_OUT);
    A.ell(70, 400, 9, 9, Dk, 3); A.ell(330, 400, 9, 9, Dk, 3);
    A.path('M170 300 L230 300 L238 346 L162 346 Z', Dk, 4);
    // голова
    const HEAD = 'M100 92 L300 92 L322 132 L322 270 L290 306 L110 306 L78 270 L78 132 Z';
    A.path(HEAD, S);
    A.inside(HEAD, 'M250 80 L330 80 L330 310 L270 310 Z', Sh, 0.8);
    A.line('M104 120 L150 104', '#ffffff', 8);
    // визор с горящими глазами
    A.path('M104 150 L296 150 L296 216 L104 216 Z', ART_OUT, 4);
    A.mirror(() => { A.ell(154, 183, 24, 17, '#ef3b5b'); A.ell(154, 183, 11, 8, '#ffc0b0'); });
    // решётка и болты
    A.path('M140 240 L260 240 L260 286 L140 286 Z', Dk, 4);
    for (let i = 1; i < 6; i++) A.line(`M${140 + i * 20} 242 L${140 + i * 20} 284`, ART_OUT, 3);
    A.mirror(() => { A.ell(100, 236, 7, 7, Dk, 3); A.ell(96, 112, 6, 6, Dk, 3); });
  },

  giant(A) {
    const S = '#8a7aa8', Sh = '#5a4a78', Hi = '#a898c4';
    // сутулые плечи и рваная рубаха
    const BODY = 'M0 460 C10 370 70 320 150 300 L250 300 C330 320 390 370 400 460 Z';
    A.path(BODY, S);
    A.inside(BODY, 'M262 290 L410 290 L410 470 L300 470 Z', Sh, 0.7);
    A.path('M58 460 L90 380 L150 402 L200 372 L250 402 L310 380 L342 460 Z', '#733e39', 4);
    A.line('M120 420 L140 458 M270 418 L258 458', '#4a2a2a', 5);
    // голова
    const HEAD = 'M114 172 C104 48 296 48 286 172 C292 242 262 302 200 308 C138 302 108 242 114 172 Z';
    A.path(HEAD, S);
    A.inside(HEAD, ART_SHADE, Sh, 0.55);
    A.line('M140 110 Q170 84 210 84', Hi, 8);
    // глазницы: один глаз крупнее
    A.ell(160, 182, 28, 24, ART_OUT); A.ell(160, 184, 13, 13, '#ff3030'); A.ell(156, 180, 4, 4, '#ffc0c0');
    A.ell(244, 188, 19, 17, ART_OUT); A.ell(244, 190, 8, 8, '#ff3030'); A.ell(242, 188, 3, 3, '#ffc0c0');
    A.line('M126 150 L192 162', Sh, 9); A.line('M274 162 L222 170', Sh, 9);
    // шрам со швами
    A.line('M214 104 L252 158', Sh, 6);
    for (let i = 0; i < 4; i++) A.line(`M${216 + i * 10} ${118 + i * 14} l12 -8`, ART_OUT, 3);
    A.line('M196 214 L190 232 L204 234', Sh, 4);
    // пасть с зубами
    A.path('M138 252 Q200 236 262 252 Q252 294 200 296 Q148 294 138 252 Z', '#2a1a2e', 4);
    for (const [tx, ty, up] of [[154, 252, 1], [178, 247, 1], [204, 246, 1], [230, 249, 1], [166, 292, 0], [198, 295, 0], [228, 292, 0]]) {
      A.path(up ? `M${tx} ${ty} l8 16 l8 -16 Z` : `M${tx} ${ty} l8 -16 l8 16 Z`, '#f0e6c8', 3);
    }
    // редкие волосы
    A.line('M150 66 L140 34 M200 58 L200 22 M250 66 L262 36', '#3a2a4a', 6);
  },

  // ALANIATOR3000: круглое лицо, стрижка «горшок», усики, галстук, пиджак
  alan(A) {
    const S = '#f4c29a', Sh = '#d9956a', H = '#5a3a22', Hh = '#7a5232';
    const BODY = 'M0 460 C10 380 60 332 140 314 L260 314 C340 332 390 380 400 460 Z';
    A.path(BODY, '#3b5dc9');
    A.inside(BODY, 'M262 300 L410 300 L410 470 L300 470 Z', '#29366f', 0.7);
    // рубашка, воротник, галстук
    A.path('M140 314 L200 460 L260 314 Z', '#f4f4f4');
    A.path('M186 342 L214 342 L224 374 L200 388 L176 374 Z', '#d8384f');
    A.path('M180 388 L220 388 L234 460 L166 460 Z', '#d8384f');
    A.line('M174 420 L228 420 M170 446 L232 446', '#9a2238', 6);
    A.path('M138 314 L174 298 L200 346 Z', '#f4f4f4'); A.path('M262 314 L226 298 L200 346 Z', '#f4f4f4');
    A.mirror(() => A.line('M110 350 L140 440', '#29366f', 7)); // лацканы
    // уши
    A.mirror(() => { A.ell(86, 196, 16, 26, S, 5); A.ell(88, 198, 7, 13, Sh); });
    // двойной подбородок и голова
    A.path('M116 250 C120 336 280 336 284 250 Z', Sh);
    const HEAD = 'M90 172 C84 40 316 40 310 172 C314 252 272 302 200 304 C128 302 86 252 90 172 Z';
    A.path(HEAD, S);
    A.inside(HEAD, ART_SHADE, Sh, 0.4);
    A.x.globalAlpha = 0.55; A.ell(126, 224, 26, 15, '#f5a8a0'); A.ell(274, 224, 26, 15, '#f5a8a0'); A.x.globalAlpha = 1;
    // хитрые глазки и брови
    artEye(A, 156, 184, { iris: H, rx: 16, ry: 12 }); artEye(A, 244, 184, { iris: H, rx: 16, ry: 12 });
    A.line('M126 154 L182 168', H, 9); A.line('M274 154 L218 168', H, 9);
    A.line('M186 214 Q200 230 214 214', Sh, 5);
    // усики с завитками
    A.line('M158 244 Q180 230 198 244', ART_OUT, 7); A.line('M202 244 Q220 230 242 244', ART_OUT, 7);
    A.line('M158 244 Q148 240 150 230', ART_OUT, 4); A.line('M242 244 Q252 240 250 230', ART_OUT, 4);
    // самодовольная ухмылка
    A.path('M166 260 Q200 290 238 256 Q204 274 166 260 Z', '#6a1f30', 4);
    A.line('M176 263 Q200 272 226 261', '#f4f4f4', 3);
    // стрижка «горшок»
    A.path('M86 178 C72 26 328 26 314 178 C302 132 282 120 200 120 C118 120 98 132 86 178 Z', H);
    A.line('M130 70 Q190 44 250 60', Hh, 9);
  },

  queen(A) {
    const P = '#c77dff', D = '#7b2cbf', L = '#e8c8ff';
    // пузыри слизи
    A.ell(330, 196, 15, 15, P, 4); A.ell(66, 236, 11, 11, P, 4); A.ell(352, 250, 8, 8, P, 3);
    // тело
    const BODY = 'M28 460 C18 300 90 130 200 120 C310 130 382 300 372 460 Z';
    A.path(BODY, P);
    A.inside(BODY, 'M250 110 L390 110 L390 470 L300 470 Z', D, 0.55);
    A.inside(BODY, 'M60 470 C120 430 280 430 340 470 Z', D, 0.6);
    A.ell(128, 236, 22, 44, 'rgba(255,255,255,0.55)', 0, 0.45);
    A.ell(104, 310, 8, 14, 'rgba(255,255,255,0.4)', 0, 0.3);
    // корона
    A.path('M130 152 L140 66 L166 126 L200 44 L234 126 L260 66 L270 152 Z', '#ffcd75');
    A.ell(200, 112, 9, 12, '#ef3b5b', 3); A.ell(150, 132, 5, 5, '#73eff7', 2); A.ell(250, 132, 5, 5, '#73eff7', 2);
    // глаза
    A.mirror(() => { A.ell(152, 282, 31, 37, ART_OUT); A.ell(142, 266, 11, 13, '#ffffff'); A.ell(162, 300, 5, 6, L); });
    // хищная улыбка
    A.path('M118 350 Q200 424 282 350 Q200 384 118 350 Z', '#2a1038', 4);
    for (let i = 0; i < 6; i++) A.path(`M${140 + i * 22} ${362 + Math.round(Math.sin((i + 0.5) / 6 * Math.PI) * 12)} l8 16 l8 -16 Z`, '#ffffff', 2);
  },
};

// ---------- Пиксельные портреты высокого разрешения ----------
// Рисунок превращается в настоящий пиксель-арт: уменьшаем втрое, а каждый пиксель приводим
// к ограниченной палитре персонажа — без размытых полутонов, с чёткой тёмной обводкой.
const PIX_K = 3;
function pixArtURL(id, alt) {
  const key = 'pix:' + id + (alt ? '_alt' : '');
  if (_artCache[key]) return _artCache[key];
  const A = artKit();
  const P = HERO_PAL[id] ? Object.assign({}, HERO_PAL[id], alt ? HERO_PAL_ALT[id] : null) : null;
  ART_PAINT[id](A, P);
  const W = A.c.width, H = A.c.height, sd = A.x.getImageData(0, 0, W, H).data;

  // 1. палитра: самые частые цвета рисунка (ровные заливки), сглаженные края в неё не попадают
  const count = new Map();
  for (let i = 0; i < sd.length; i += 8) {
    if (sd[i + 3] < 250) continue;
    const c = (sd[i] << 16) | (sd[i + 1] << 8) | sd[i + 2];
    count.set(c, (count.get(c) || 0) + 1);
  }
  const pal = [...count.entries()].filter(e => e[1] > 24).sort((a, b) => b[1] - a[1]).slice(0, 40).map(e => e[0]);
  const OUT = (0x15 << 16) | (0x12 << 8) | 0x1c;
  if (!pal.includes(OUT)) pal.push(OUT);
  const near = new Map();
  const snap = c => {
    let r = near.get(c);
    if (r !== undefined) return r;
    const cr = c >> 16, cg = (c >> 8) & 255, cb = c & 255;
    let best = 0, bd = 1e9;
    for (const p of pal) {
      const dr = cr - (p >> 16), dg = cg - ((p >> 8) & 255), db = cb - (p & 255), d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
      if (d < bd) { bd = d; best = p; }
    }
    near.set(c, best);
    return best;
  };

  // 2. уменьшение: в каждом блоке 3x3 побеждает самый частый цвет; контур имеет приоритет, чтобы линии не рвались
  const w = Math.floor(W / PIX_K), h = Math.floor(H / PIX_K);
  const out = makeCanvas(w, h), ox = out.getContext('2d'), im = ox.createImageData(w, h), od = im.data;
  const votes = new Map();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    votes.clear();
    let solid = 0;
    for (let j = 0; j < PIX_K; j++) for (let i = 0; i < PIX_K; i++) {
      const o = ((y * PIX_K + j) * W + x * PIX_K + i) * 4;
      if (sd[o + 3] < 128) continue;
      solid++;
      const c = snap((sd[o] << 16) | (sd[o + 1] << 8) | sd[o + 2]);
      votes.set(c, (votes.get(c) || 0) + 1);
    }
    if (solid < 5) continue;
    let best = 0, bn = 0;
    for (const [c, n] of votes) if (n > bn) { bn = n; best = c; }
    if ((votes.get(OUT) || 0) >= 4) best = OUT;
    const o = (y * w + x) * 4;
    od[o] = best >> 16; od[o + 1] = (best >> 8) & 255; od[o + 2] = best & 255; od[o + 3] = 255;
  }
  ox.putImageData(im, 0, 0);
  outlineSprite(out); // сплошной тёмный контур по краю силуэта
  return (_artCache[key] = out.toDataURL());
}

// Готовая иллюстрация (dataURL). id — герой или босс; alt — костюм героя
const _artCache = {};
function artURL(id, alt) {
  const key = id + (alt ? '_alt' : '');
  if (_artCache[key]) return _artCache[key];
  const A = artKit();
  const P = HERO_PAL[id] ? Object.assign({}, HERO_PAL[id], alt ? HERO_PAL_ALT[id] : null) : null;
  ART_PAINT[id](A, P);
  return (_artCache[key] = A.c.toDataURL());
}
