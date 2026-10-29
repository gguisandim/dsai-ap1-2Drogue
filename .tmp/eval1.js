(() => {
  const out = { hasPhaser: !!window.Phaser, globals: Object.keys(window).filter(k => /phaser|game|scene|umbra|igapo/i.test(k)) };
  if (window.Phaser && window.Phaser.GAMES) out.gameCount = window.Phaser.GAMES.length;
  return out;
})()
