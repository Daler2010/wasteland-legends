// ===== Запуск игры и главный цикл =====
(function () {
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
    Pad.poll();
    Game.update(dt);
    Game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Свернули вкладку — ставим на паузу
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') Game.pause();
  });
})();
