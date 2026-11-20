export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.musicTimer = 0;
    this.musicStep = 0;
  }
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();
    } catch (e) { this.ctx = null; }
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
  setEngine(speedNorm) {
    if (!this.ctx || !this.engineOsc) return;
    this.engineOsc.frequency.value = 55 + speedNorm * 140;
    this.engineGain.gain.value = this.muted ? 0 : 0.03 + speedNorm * 0.05;
  }
  blip(freq, dur, type = 'square', vol = 0.15) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  shot() { this.blip(180, 0.15, 'square', 0.25); this.blip(90, 0.2, 'sawtooth', 0.2); }
  punch() { this.blip(120, 0.1, 'sine', 0.2); }
  cash() { this.blip(880, 0.12, 'sine', 0.2); setTimeout(() => this.blip(1320, 0.18, 'sine', 0.2), 90); }
  siren(dt) {
    if (!this.ctx || this.muted) return;
    this.musicTimer += dt;
    if (this.musicTimer > 0.5) {
      this.musicTimer = 0;
      this.blip(this.musicStep % 2 === 0 ? 700 : 950, 0.4, 'sine', 0.05);
      this.musicStep += 1;
    }
  }
  music(dt) {
    if (!this.ctx || this.muted) return;
    this.musicTimer += dt;
    if (this.musicTimer < 0.45) return;
    this.musicTimer = 0;
    const scale = [220, 261.6, 329.6, 392, 440, 523.3];
    const note = scale[this.musicStep % scale.length];
    this.blip(note, 0.4, 'triangle', 0.05);
    this.musicStep += 1;
  }
  update(dt, game) {
    if (!this.ctx) return;
    const speedNorm = game.player.car ? Math.min(1, Math.abs(game.player.car.speed) / 42) : 0;
    this.setEngine(speedNorm);
    if (game.police.wanted > 0) this.siren(dt);
    else this.music(dt);
  }
}
