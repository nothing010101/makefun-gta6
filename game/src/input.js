export class Input {
  constructor(canvas) {
    this.keys = {};
    this.camAngle = 0;
    this.mouseDX = 0;
    this.onAction = null;
    this.onPause = null;
    this.onMute = null;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      if (e.code === 'KeyE' && this.onAction) this.onAction('enter');
      if (e.code === 'KeyF' && this.onAction) this.onAction('interact');
      if (e.code === 'KeyM' && this.onMute) this.onMute();
      if (e.code === 'Escape' && this.onPause) this.onPause();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.onAction) this.onAction('attack');
      if (e.button === 2 && this.onAction) this.onAction('shoot');
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) this.mouseDX += e.movementX || 0;
    });
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    });
  }
  get forward() { return this.keys['KeyW'] || this.keys['ArrowUp'] || false; }
  get back() { return this.keys['KeyS'] || this.keys['ArrowDown'] || false; }
  get left() { return this.keys['KeyA'] || this.keys['ArrowLeft'] || false; }
  get right() { return this.keys['KeyD'] || this.keys['ArrowRight'] || false; }
  get run() { return this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false; }
  get handbrake() { return this.keys['Space'] || false; }
  consumeMouseDX() { const d = this.mouseDX; this.mouseDX = 0; return d; }
}
