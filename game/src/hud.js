export class HUD {
  constructor() {
    this.moneyEl = document.getElementById('hud-money');
    this.starsEl = document.getElementById('hud-stars');
    this.healthEl = document.getElementById('hud-health');
    this.speedEl = document.getElementById('hud-speed');
    this.missionEl = document.getElementById('hud-mission');
    this.msgEl = document.getElementById('hud-msg');
    this.menuEl = document.getElementById('menu');
    this.overEl = document.getElementById('gameover');
    this.crossEl = document.getElementById('crosshair');
    this.map = document.getElementById('minimap');
    this.mapCtx = this.map ? this.map.getContext('2d') : null;
    this.msgTimer = 0;
  }
  showMessage(text, seconds = 4) {
    if (!this.msgEl) return;
    this.msgEl.textContent = text;
    this.msgEl.style.opacity = '1';
    this.msgTimer = seconds;
  }
  update(dt, game) {
    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0 && this.msgEl) this.msgEl.style.opacity = '0';
    }
    if (this.moneyEl) this.moneyEl.textContent = '$' + Math.floor(game.player.money).toLocaleString('en-US');
    if (this.starsEl) this.starsEl.textContent = '★'.repeat(game.police.wanted) + '☆'.repeat(5 - game.police.wanted);
    if (this.healthEl) {
      this.healthEl.textContent = 'HP ' + Math.ceil(game.player.health);
      this.healthEl.style.color = game.player.health < 30 ? '#ff5544' : '#ffffff';
    }
    if (this.speedEl) {
      const kmh = Math.round(Math.abs(game.player.speed || 0) * 3.6);
      this.speedEl.textContent = game.player.car ? kmh + ' km/h' : '';
    }
    const m = game.missions.current();
    if (this.missionEl) {
      this.missionEl.textContent = m ? ('MISI ' + m.id + '/6 — ' + m.title + ': ' + m.brief) : 'Semua misi selesai! Solmar City milikmu, Jax.';
    }
    if (this.crossEl) {
      const show = game.state === 'playing' && !game.player.car;
      this.crossEl.style.display = show ? 'block' : 'none';
    }
    this.drawMinimap(game);
  }
  drawMinimap(game) {
    if (!this.mapCtx) return;
    const ctx = this.mapCtx;
    const S = 150;
    ctx.fillStyle = 'rgba(10,20,30,0.85)';
    ctx.fillRect(0, 0, S, S);
    const toMap = (x, z) => [S / 2 + (x / 180) * (S / 2), S / 2 + (z / 180) * (S / 2)];
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      const [ax, ay] = toMap(i * 46, -180); const [bx, by] = toMap(i * 46, 180);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      const [cx, cy] = toMap(-180, i * 46); const [dx, dy] = toMap(180, i * 46);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
    }
    ctx.fillStyle = '#1e7fa8'; ctx.fillRect(0, S - 14, S, 14);
    ctx.fillStyle = '#e8d29a'; ctx.fillRect(0, S - 18, S, 4);
    const m = game.missions.current();
    if (m && game.missions.targetPos) {
      const [mx, my] = toMap(game.missions.targetPos.x, game.missions.targetPos.z);
      ctx.fillStyle = '#ffc233';
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (const u of game.police.units) {
      const [px, py] = toMap(u.x, u.z);
      ctx.fillStyle = '#ff3333';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    const [px, py] = toMap(game.player.x, game.player.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  showMenu(show) {
    if (this.menuEl) this.menuEl.style.display = show ? 'flex' : 'none';
    if (show && this.crossEl) this.crossEl.style.display = 'none';
  }
  showGameOver(show, stats) {
    if (!this.overEl) return;
    this.overEl.style.display = show ? 'flex' : 'none';
    if (show && stats) {
      const el = document.getElementById('gameover-stats');
      if (el) el.textContent = stats;
    }
  }
}
