import * as THREE from 'three';
import { CFG } from './config.js';

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.punchCooldown = 0;
    this.shootCooldown = 0;
    this.muzzleFlash = null;
  }
  punch(player, peds, police) {
    if (this.punchCooldown > 0) return false;
    this.punchCooldown = 0.45;
    const fx = player.x + Math.sin(player.angle) * 2.2;
    const fz = player.z + Math.cos(player.angle) * 2.2;
    let hit = false;
    for (const p of peds.list) {
      if (Math.hypot(p.x - fx, p.z - fz) < 2.4) { p.scare(player.x, player.z, 20); hit = true; }
    }
    if (hit && police) police.addCrime(1);
    this.spawnHitSpark(fx, fz, 0xffe08a);
    return hit;
  }
  shoot(player, police) {
    if (this.shootCooldown > 0) return false;
    this.shootCooldown = 0.3;
    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
    const b = new THREE.Mesh(geo, mat);
    b.position.set(player.x, 1.4, player.z);
    this.scene.add(b);
    this.bullets.push({ mesh: b, vx: Math.sin(player.angle) * 60, vz: Math.cos(player.angle) * 60, life: 1.2 });
    if (police) police.addCrime(1.5);
    this.spawnHitSpark(player.x + Math.sin(player.angle) * 1.5, player.z + Math.cos(player.angle) * 1.5, 0xfff2aa);
    return true;
  }
  spawnHitSpark(x, z, color) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color }));
    s.position.set(x, 1.2, z);
    this.scene.add(s);
    this.bullets.push({ mesh: s, vx: 0, vz: 0, life: 0.18, spark: true });
  }
  update(dt) {
    this.punchCooldown = Math.max(0, this.punchCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.z += b.vz * dt;
      if (b.life <= 0) { this.scene.remove(b.mesh); this.bullets.splice(i, 1); }
    }
  }
}
