// ===== 8-битный звук: эффекты и многослойная чиптюн-музыка на WebAudio =====

// Ноты в MIDI (0 = пауза). Каждая фраза — 32 восьмые (4 такта).
// Форма трека: A A B A (128 шагов), слои включаются по мере роста напряжения.
const TRACKS = {
  desert: { bpm: 112, bw: 'triangle', lw: 'square',
    bassA: [45,0,45,0,52,0,45,0, 43,0,43,0,50,0,43,0, 41,0,41,0,48,0,41,0, 40,0,40,0,47,0,44,0],
    leadA: [69,0,72,0,74,0,72,69, 0,0,67,0,69,0,0,0, 65,0,69,0,72,0,74,72, 71,0,68,0,64,0,0,0],
    bassB: [41,0,41,0,48,0,41,0, 43,0,43,0,50,0,43,0, 45,0,45,0,52,0,45,0, 40,0,40,0,47,0,40,0],
    leadB: [72,0,69,0,65,0,69,0, 74,0,71,0,67,0,71,0, 76,0,72,0,69,0,72,76, 76,0,71,0,68,0,64,0] },
  factory: { bpm: 132, bw: 'square', lw: 'square',
    bassA: [40,40,0,40,52,0,40,0, 40,40,0,40,50,0,47,0, 36,36,0,36,48,0,36,0, 38,38,0,38,50,0,47,0],
    leadA: [64,0,0,67,0,0,71,0, 69,0,67,0,66,0,64,0, 60,0,0,64,0,0,67,0, 66,0,62,0,59,0,0,0],
    bassB: [36,36,0,36,48,0,36,0, 38,38,0,38,50,0,38,0, 40,40,0,40,52,0,40,0, 35,35,0,35,47,0,47,0],
    leadB: [67,0,0,64,0,0,60,0, 69,0,0,66,0,0,62,0, 71,0,0,67,0,0,64,0, 66,0,63,0,59,0,0,0] },
  forest: { bpm: 92, bw: 'triangle', lw: 'triangle',
    bassA: [38,0,0,0,45,0,0,0, 34,0,0,0,41,0,0,0, 36,0,0,0,43,0,0,0, 33,0,0,0,40,0,0,0],
    leadA: [62,0,65,0,69,0,67,65, 64,0,0,0,62,0,0,0, 60,0,64,0,67,0,65,64, 61,0,0,0,57,0,0,0],
    bassB: [34,0,0,0,41,0,0,0, 36,0,0,0,43,0,0,0, 38,0,0,0,45,0,0,0, 33,0,0,0,40,0,0,0],
    leadB: [65,0,62,0,58,0,0,0, 67,0,64,0,60,0,0,0, 69,0,65,0,62,0,65,69, 69,0,64,0,61,0,0,0] },
  metro: { bpm: 100, bw: 'triangle', lw: 'square',
    bassA: [36,0,0,36,0,0,43,0, 36,0,0,36,0,0,39,0, 32,0,0,32,0,0,39,0, 31,0,0,31,0,0,38,0],
    leadA: [72,0,0,0,75,0,0,0, 74,0,72,0,67,0,0,0, 68,0,0,0,72,0,0,0, 71,0,67,0,62,0,0,0],
    bassB: [29,0,0,29,0,0,36,0, 31,0,0,31,0,0,38,0, 32,0,0,32,0,0,39,0, 31,0,0,31,0,0,35,0],
    leadB: [68,0,65,0,60,0,0,0, 71,0,67,0,62,0,0,0, 72,0,68,0,63,0,68,72, 74,0,71,0,67,0,0,0] },
  boss: { bpm: 156, bw: 'square', lw: 'sawtooth', full: true,
    bassA: [40,40,52,40,40,52,40,52, 41,41,53,41,41,53,41,53, 43,43,55,43,43,55,43,55, 42,42,54,42,39,39,51,39],
    leadA: [76,0,75,0,76,0,71,0, 74,0,72,0,69,0,0,0, 72,0,71,0,72,0,67,0, 71,0,69,0,66,0,0,0],
    bassB: [45,45,57,45,45,57,45,57, 43,43,55,43,43,55,43,55, 41,41,53,41,41,53,41,53, 40,40,52,40,47,47,59,47],
    leadB: [81,0,79,0,76,0,72,0, 79,0,77,0,74,0,71,0, 77,0,76,0,72,0,69,0, 76,0,75,0,71,0,0,0] },
};
const ARP = [12, 19, 24, 19]; // арпеджио: октава — квинта — две октавы — квинта от баса

function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

const Sound = {
  ctx: null, master: null, sfxG: null, musG: null, noiseBuf: null,
  last: {}, timer: null, track: null, step: 0, nextTime: 0,
  intensity: 0, // 0..1 — чем больше врагов, тем больше слоёв музыки
  root: 45,

  get sfxOn() { return Save.data.settings.sfx; },
  get musicOn() { return Save.data.settings.music; },

  // Вызывать из обработчика клика/клавиши: браузеры требуют жест пользователя
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && Game.state !== 'paused') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.5; this.master.connect(c.destination);
    this.sfxG = c.createGain(); this.sfxG.connect(this.master);
    this.musG = c.createGain(); this.musG.connect(this.master);
    // эхо для музыки — звук становится объёмнее
    const delay = c.createDelay(1), fb = c.createGain(), wet = c.createGain();
    delay.delayTime.value = 0.27; fb.gain.value = 0.32; wet.gain.value = 0.35;
    this.musG.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(this.master);
    const len = c.sampleRate * 0.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applySettings();
  },

  applySettings() {
    if (!this.ctx) return;
    const s = Save.data.settings;
    this.musG.gain.value = this.musicOn ? 0.42 * s.musicVol : 0;
    this.sfxG.gain.value = this.sfxOn ? 0.7 * s.sfxVol : 0;
  },
  suspend() { if (this.ctx) this.ctx.suspend(); },
  resume() { if (this.ctx) this.ctx.resume(); },

  tone(f, dur, type, vol, slide, when, dest, detune) {
    const c = this.ctx, t = when || c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noise(dur, vol, freq, type, when, dest) {
    const c = this.ctx, t = when || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 2000;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    s.start(t); s.stop(t + dur + 0.05);
  },

  sfx(name) {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const gap = name === 'hit' ? 0.05 : 0.03;
    if (now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    switch (name) {
      case 'click': this.tone(660, 0.05, 'square', 0.1); break;
      case 'bow': this.tone(900, 0.07, 'square', 0.06, 500); break;
      case 'wave': this.tone(220, 0.3, 'triangle', 0.2, 880); this.tone(440, 0.25, 'sine', 0.08, 1320); break;
      case 'sword': this.noise(0.1, 0.18, 3000, 'bandpass'); this.tone(300, 0.08, 'square', 0.05, 150); break;
      case 'throw': this.tone(400, 0.12, 'triangle', 0.08, 700); break;
      case 'fire': this.noise(0.35, 0.2, 900, 'lowpass'); break;
      case 'zap': this.noise(0.12, 0.15, 4000, 'highpass'); this.tone(1400, 0.12, 'sawtooth', 0.05, 200); break;
      case 'hit': this.noise(0.05, 0.12, 1800, 'lowpass'); break;
      case 'gem': this.tone(1300, 0.05, 'square', 0.04, 1900); break;
      case 'coin': this.tone(988, 0.06, 'square', 0.06); this.tone(1319, 0.12, 'square', 0.06, null, now + 0.06); break;
      case 'heal': this.tone(523, 0.15, 'triangle', 0.14, 1046); break;
      case 'hurt': this.tone(260, 0.18, 'sawtooth', 0.12, 70); break;
      case 'eshoot': this.tone(500, 0.08, 'square', 0.04, 250); break;
      case 'warn': this.tone(880, 0.08, 'square', 0.07); this.tone(880, 0.08, 'square', 0.07, null, now + 0.14); break;
      case 'boom': this.noise(0.45, 0.3, 500, 'lowpass'); this.tone(140, 0.4, 'sawtooth', 0.18, 35); break;
      case 'necro': this.tone(180, 0.4, 'sawtooth', 0.08, 360); this.tone(270, 0.4, 'sine', 0.08, 540); break;
      case 'chest': [659, 784, 988, 1319, 1568].forEach((f, i) => this.tone(f, 0.14, 'square', 0.08, null, now + i * 0.07)); break;
      case 'buy': [784, 988, 1319].forEach((f, i) => this.tone(f, 0.08, 'square', 0.07, null, now + i * 0.06)); break;
      case 'levelup': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.08, null, now + i * 0.07)); break;
      case 'roar': this.tone(110, 0.9, 'sawtooth', 0.2, 40); this.noise(0.8, 0.2, 500, 'lowpass'); break;
      case 'dash': this.noise(0.25, 0.15, 1200, 'bandpass'); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'square', 0.09, null, now + i * 0.12)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.14, null, now + i * 0.2)); break;
    }
  },

  startMusic(key) {
    this.stopMusic();
    if (!this.ctx) return;
    this.track = TRACKS[key];
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 30);
  },
  stopMusic() {
    clearInterval(this.timer);
    this.timer = null; this.track = null;
  },

  schedule() {
    const c = this.ctx, tr = this.track;
    if (!tr || c.state !== 'running') return;
    const spb = 60 / tr.bpm / 2, M = this.musG;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.02;
    while (this.nextTime < c.currentTime + 0.15) {
      const t = this.nextTime, s = this.step % 32;
      const phrase = Math.floor(this.step / 32) % 4;          // A A B A
      const B = phrase === 2;
      const b = (B ? tr.bassB : tr.bassA)[s], l = (B ? tr.leadB : tr.leadA)[s];
      const I = tr.full ? 1 : this.intensity;
      if (b) this.root = b;

      // бас — всегда
      if (b) this.tone(midi(b), spb * 0.9, tr.bw, tr.bw === 'square' ? 0.08 : 0.16, null, t, M);
      // мелодия: два слегка расстроенных голоса, во втором проведении — октавой выше тихим эхом
      if (l) {
        this.tone(midi(l), spb * 0.85, tr.lw, 0.045, null, t, M, -6);
        this.tone(midi(l), spb * 0.85, tr.lw, 0.03, null, t, M, 7);
        if (phrase === 1 || I > 0.8) this.tone(midi(l + 12), spb * 0.5, 'square', 0.015, null, t, M);
      }
      // арпеджио — со средним напряжением
      if (I > 0.3) this.tone(midi(this.root + ARP[s % 4]), spb * 0.45, 'square', 0.018 + I * 0.012, null, t, M);
      // ударные: хэт → бочка → малый
      if (I > 0.12 && s % 2 === 1) this.noise(0.03, 0.03, 7000, 'highpass', t, M);
      if (I > 0.45 && s % 4 === 0) this.tone(120, 0.12, 'sine', 0.26, 40, t, M);
      if (I > 0.6 && s % 8 === 4) this.noise(0.1, 0.09, 1800, 'bandpass', t, M);
      // сбивка в конце фразы
      if (I > 0.5 && s >= 28) this.noise(0.05, 0.05, 1200 + (s - 28) * 600, 'bandpass', t, M);
      // низкий «пэд» на начало каждого такта — глубина
      if (s % 8 === 0 && b) this.tone(midi(this.root + 12), spb * 7, 'sine', 0.035, null, t, M);

      this.nextTime += spb;
      this.step++;
    }
  },
};
