// ===== Сеть: связь браузеров напрямую (WebRTC через PeerJS) по коду комнаты =====
// Хозяин лобби регистрирует код «wl-XXXXX» на бесплатном сервере знакомств PeerJS, друзья подключаются по нему.
// Дальше данные идут напрямую между браузерами. Для проверки на одном компьютере: ?net=local (BroadcastChannel).

const NET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NET_ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }];
const NET_LOCAL = new URLSearchParams(location.search).get('net') === 'local';

const Net = {
  role: null, code: '', peer: null, conns: {}, conn: null, h: {}, libP: null, seen: {},

  // h: { msg(slot, m), join(slot), leave(slot), lost(reason) }
  on(h) { this.h = h; },
  newCode() { let s = ''; for (let i = 0; i < 5; i++) s += NET_ALPHABET[Math.floor(Math.random() * NET_ALPHABET.length)]; return s; },

  lib() {
    if (NET_LOCAL || window.Peer) return Promise.resolve();
    return this.libP || (this.libP = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
      s.onload = ok;
      s.onerror = () => { this.libP = null; fail(new Error('Не удалось загрузить сетевую библиотеку. Проверь интернет.')); };
      document.head.appendChild(s);
    }));
  },
  err(e) {
    const t = e && e.type;
    if (t === 'peer-unavailable') return 'Лобби с таким кодом не найдено';
    if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'Нет связи с сервером. Проверь интернет.';
    if (t === 'browser-incompatible') return 'Этот браузер не поддерживает онлайн-игру';
    return (e && e.message) || 'Ошибка сети';
  },

  // ---------- хозяин ----------
  async host(maxSlots) {
    await this.lib();
    this.close();
    this.role = 'host'; this.conns = {}; this.seen = {};
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = this.newCode();
      try { await this.openHost(code, maxSlots); this.code = code; return code; }
      catch (e) { if (!e || e.type !== 'unavailable-id') { this.close(); throw new Error(this.err(e)); } }
    }
    throw new Error('Не удалось создать лобби, попробуй ещё раз');
  },
  openHost(code, maxSlots) {
    const accept = c => {
      // свободное место: 1..maxSlots-1 (0 — сам хозяин)
      let slot = 0;
      for (let i = 1; i < maxSlots; i++) if (!this.conns[i]) { slot = i; break; }
      if (!slot) { c.send({ k: 'full' }); setTimeout(() => c.close(), 300); return; }
      this.conns[slot] = c;
      this.seen[slot] = performance.now();
      c.on('data', m => { this.seen[slot] = performance.now(); if (this.h.msg) this.h.msg(slot, m); });
      const gone = () => { if (this.conns[slot] !== c) return; delete this.conns[slot]; if (this.h.leave) this.h.leave(slot); };
      c.on('close', gone); c.on('error', gone);
      if (this.h.join) this.h.join(slot);
    };
    if (NET_LOCAL) return this.localHost(code, accept);
    return new Promise((ok, fail) => {
      const peer = this.peer = new Peer('wl-' + code, { config: { iceServers: NET_ICE }, debug: 0 });
      let opened = false;
      peer.on('open', () => { opened = true; ok(); });
      peer.on('connection', c => c.on('open', () => accept(c)));
      peer.on('error', e => { if (!opened) { peer.destroy(); fail(e); } else if (this.h.lost && (e.type === 'network' || e.type === 'server-error')) { /* сервер знакомств отвалился — уже подключённые продолжают играть */ } });
    });
  },

  // ---------- гость ----------
  async join(code) {
    await this.lib();
    this.close();
    this.role = 'client'; this.code = code; this.seen = { host: performance.now() };
    if (NET_LOCAL) return this.localJoin(code);
    return new Promise((ok, fail) => {
      const peer = this.peer = new Peer(undefined, { config: { iceServers: NET_ICE }, debug: 0 });
      let done = false;
      const failNow = e => { if (done) return; done = true; this.close(); fail(new Error(this.err(e))); };
      const timer = setTimeout(() => failNow({ message: 'Не удалось подключиться. Возможно, сеть блокирует прямое соединение — попробуй другой Wi-Fi.' }), 15000);
      peer.on('error', e => { if (!done) { clearTimeout(timer); failNow(e); } else if (e.type === 'peer-unavailable' && this.h.lost) this.h.lost('Хозяин лобби недоступен'); });
      peer.on('open', () => {
        const c = this.conn = peer.connect('wl-' + code, { serialization: 'json', reliable: true });
        c.on('open', () => { done = true; clearTimeout(timer); ok(); });
        c.on('data', m => { this.seen.host = performance.now(); if (this.h.msg) this.h.msg(0, m); });
        const gone = () => { if (this.conn !== c) return; this.conn = null; if (done && this.h.lost) this.h.lost('Связь с хозяином лобби потеряна'); };
        c.on('close', gone); c.on('error', gone);
      });
    });
  },

  // ---------- отправка ----------
  send(slot, m) { const c = this.conns[slot]; if (c && c.open !== false) try { c.send(m); } catch (e) { /* соединение закрывается */ } },
  bcast(m) { for (const s in this.conns) this.send(+s, m); },
  toHost(m) { if (this.conn) try { this.conn.send(m); } catch (e) { } },
  // сколько данных ещё ждёт отправки (если сеть не успевает — пропускаем снимок)
  buffered(slot) { const c = this.conns[slot], dc = c && c.dataChannel; return dc ? dc.bufferedAmount : 0; },
  kick(slot) { const c = this.conns[slot]; if (c) { delete this.conns[slot]; try { c.close(); } catch (e) { } } },

  close() {
    for (const s in this.conns) try { this.conns[s].close(); } catch (e) { }
    if (this.conn) try { this.conn.close(); } catch (e) { }
    if (this.peer) try { this.peer.destroy(); } catch (e) { }
    if (this.bc) this.bc.close();
    this.conns = {}; this.conn = null; this.peer = null; this.bc = null; this.role = null;
  },

  // ---------- локальная связь между вкладками (для проверки) ----------
  localConn(myId, otherId) {
    const ev = {}, bc = this.bc;
    const c = { open: true, on(n, f) { (ev[n] = ev[n] || []).push(f); }, fire(n, a) { (ev[n] || []).forEach(f => f(a)); },
      send: m => bc.postMessage({ from: myId, to: otherId, m: JSON.parse(JSON.stringify(m)) }),
      close: () => { c.open = false; bc.postMessage({ from: myId, to: otherId, bye: true }); } };
    return c;
  },
  localHost(code, accept) {
    this.bc = new BroadcastChannel('wl-net-' + code);
    const peers = {};
    this.bc.onmessage = e => {
      const d = e.data;
      if (d.to !== 'host') return;
      if (d.hello) { const c = peers[d.from] = this.localConn('host', d.from); accept(c); c.send({ k: '_ok' }); return; }
      const c = peers[d.from];
      if (!c) return;
      if (d.bye) { c.open = false; c.fire('close'); delete peers[d.from]; } else c.fire('data', d.m);
    };
    return Promise.resolve();
  },
  localJoin(code) {
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    this.bc = new BroadcastChannel('wl-net-' + code);
    const c = this.conn = this.localConn(id, 'host');
    return new Promise((ok, fail) => {
      const timer = setTimeout(() => fail(new Error('Лобби с таким кодом не найдено')), 3000);
      this.bc.onmessage = e => {
        const d = e.data;
        if (d.to !== id) return;
        if (d.bye) { this.conn = null; if (this.h.lost) this.h.lost('Связь с хозяином лобби потеряна'); return; }
        if (d.m && d.m.k === '_ok') { clearTimeout(timer); ok(); return; }
        this.seen.host = performance.now();
        if (this.h.msg) this.h.msg(0, d.m);
      };
      this.bc.postMessage({ from: id, to: 'host', hello: true });
    });
  },
};
