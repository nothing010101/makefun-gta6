import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG, clamp } from './random.js';
import { makeCarMesh, Car } from './vehicles.js';

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.rng = new RNG(11);
    this.wanted = 0;
    this.heat = 0;
    this.units = [];
    this.sirenTime = 0;
  }
  addCrime(amount) {
    this.heat = clamp(this.heat + amount, 0, 5);
    this.wanted = Math.ceil(this.heat);
  }
  update(dt, player, onBusted) {
    if (this.wanted > 0) this.heat = Math.max(0, this.heat - CFG.wantedDecay * dt);
    if (this.heat < 0.5) this.wanted = 0; else this.wanted = Math.ceil(this.heat);
    const want = Math.min(this.wanted, CFG.policeMax);
    while (this.units.length < want) this.spawnUnit(player);
    while (this.units.length > want) {
      const u = this.units.pop();
      this.scene.remove(u.mesh);
    }
    this.sirenTime += dt;
    for (const u of this.units) {
      const dx = player.x - u.x, dz = player.z - u.z;
      const d = Math.hypot(dx, dz) || 1;
      const target = Math.atan2(dx, dz);
      let diff = target - u.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      u.angle += clamp(diff, -2.2 * dt, 2.2 * dt);
      u.speed = clamp(u.speed + 14 * dt, 0, 24 + this.wanted * 3);
      u.x += Math.sin(u.angle) * u.speed * dt;
      u.z += Math.cos(u.angle) * u.speed * dt;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.angle;
      const flash = Math.sin(this.sirenTime * 10) > 0 ? 0xff2222 : 0x2244ff;
      u.light.material.color.setHex(flash);
      if (d < 3.2) {
        u.speed = 0;
        if (onBusted) onBusted();
      }
    }
  }
  spawnUnit(player) {
    const mesh = makeCarMesh(0x111111, false);
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    light.position.set(0, 1.75, 0); mesh.add(light);
    const a = this.rng.range(0, Math.PI * 2);
    const x = clamp(player.x + Math.sin(a) * 60, -160, 160);
    const z = clamp(player.z + Math.cos(a) * 60, -160, 160);
    this.scene.add(mesh);
    const car = new Car(mesh, x, z, 0);
    car.light = light;
    this.units.push(car);
  }
  clear() {
    for (const u of this.units) this.scene.remove(u.mesh);
    this.units = []; this.wanted = 0; this.heat = 0;
  }
}
