// ===== Запуск игры и главный цикл =====
(function () {
  // браузер мог открыть старую версию из кеша — если на сайте новее, один раз перезагружаемся
  if (GAME_VER && location.protocol.startsWith('http')) {
    fetch('index.html?nc=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).then(t => {
      const v = +((t.match(/util\.js\?v=(\d+)/) || [0, 0])[1]);
      let tried = 0;
      try { tried = +sessionStorage.getItem('wl_upd') || 0; } catch (e) { }
      if (v > GAME_VER && tried < v) {
        try { sessionStorage.setItem('wl_upd', v); } catch (e) { }
        if (Game.state !== 'playing' && !MP.on) location.reload();
        else UI.banner('Вышло обновление игры — перезагрузи страницу', 4);
      }
    }).catch(() => { });
  }
  Save.load();
  initSprites();
  Game.init();
  Input.init(Game.canvas);
  UI.init();
  Extra.init();
  HubUI.init();
  Campaign.init();
  Checkpoint.init();
  MP.init();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    requestAnimationFrame(frame);
    // редкая ошибка не должна навсегда останавливать игру (в онлайне замерло бы у всех)
    try {
      Pad.poll();
      Game.update(dt);
      Game.render();
    } catch (e) { console.error(e); }
  }
  requestAnimationFrame(frame);

  // Свернули вкладку — ставим на паузу
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') Game.pause();
  });
})();
