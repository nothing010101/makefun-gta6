import * as THREE from 'three';
import { CFG } from './config.js';

export const MISSION_DEFS = [
  { id: 1, title: 'Paket untuk Marisol', brief: 'Marisol Vega butuh paket diantar ke garasinya. Bawa paket itu ke Marisol\'s Garage.', target: 'garage', reward: 400, text: 'Marisol: "Jax, kau kembali. Antar paket ini, jangan dibuka."' },
  { id: 2, title: 'Curi Mobil Sport', brief: 'Kru butuh mobil cepat. Curi mobil sport yang terparkir di kota dan bawa ke garasi.', target: 'sport', reward: 900, text: 'Marisol: "Kane punya mobil sport di jalanan. Ambil. Itu milik kita sekarang."' },
  { id: 3, title: 'Kabur dari Polisi', brief: 'Polisi mengejar! Kabur dan hilangkan wanted level-mu.', target: 'escape', reward: 1500, text: 'Marisol: "Mereka tahu kau di sini. Lari, Jax! Jangan sampai tertangkap!"' },
  { id: 4, title: 'Uang Casino Sol', brief: 'Ambil tas uang dari Casino Sol. Masuk, ambil, dan keluar cepat.', target: 'casino', reward: 2500, text: 'Marisol: "Kane menyimpan uang kotor di Casino Sol. Ambil kembali milik kita."' },
  { id: 5, title: 'Sabotase Gudang Kane', brief: 'Sabotase gudang Kane di sisi timur kota. Hancurkan operasinya.', target: 'warehouse', reward: 4000, text: 'Marisol: "Gudang Kane adalah jantung sindikatnya. Bakar rencananya."' },
  { id: 6, title: 'Perampokan Terakhir', brief: 'Perampokan terakhir! Ambil uang di dermaga dan kabur lewat laut. Ini akhir dari Kane.', target: 'pier', reward: 8000, text: 'Marisol: "Ini dia, Jax. Rampok dermaga, kabur lewat laut. Setelah ini kita bebas."' },
];

export class Missions {
  constructor(scene, landmarks) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.index = 0;
    this.done = false;
    this.marker = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.4, 20),
      new THREE.MeshBasicMaterial({ color: 0xffc233, transparent: true, opacity: 0.8 }),
    );
    this.marker.position.y = 0.3;
    scene.add(this.marker);
    this.beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc233, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    this.beacon.position.y = 20;
    scene.add(this.beacon);
    this.targetPos = null;
    this.escapedTimer = 0;
    this.hadWanted = false;
    this.setTarget();
  }
  current() { return MISSION_DEFS[this.index] || null; }
  setTarget() {
    const m = this.current();
    if (!m) { this.marker.visible = false; this.beacon.visible = false; this.targetPos = null; return; }
    if (m.target === 'sport' || m.target === 'escape') { this.targetPos = null; return; }
    const p = this.landmarks[m.target];
    if (p) { this.targetPos = p; this.marker.position.set(p.x, 0.3, p.z); this.beacon.position.set(p.x, 20, p.z); this.marker.visible = true; this.beacon.visible = true; }
  }
  complete(player, onDone) {
    const m = this.current();
    if (!m) return;
    player.money += m.reward;
    this.index += 1;
    if (this.index >= MISSION_DEFS.length) { this.done = true; this.marker.visible = false; this.beacon.visible = false; }
    else this.setTarget();
    if (onDone) onDone(m);
  }
  update(dt, player, police, traffic, onComplete) {
    const m = this.current();
    if (!m || this.done) return;
    this.marker.rotation.y += dt;
    this.beacon.rotation.y += dt * 0.5;
    if (m.target === 'sport') {
      const c = traffic.nearestParked(player.x, player.z, 5);
      if (c && c.sport && player.car === c) { this.complete(player, onComplete); return; }
      if (player.car && player.car.sport) { this.complete(player, onComplete); return; }
      return;
    }
    if (m.target === 'escape') {
      if (police.wanted >= 2) { this.hadWanted = true; this.escapedTimer = 0; }
      if (this.hadWanted && police.wanted === 0) {
        this.escapedTimer += dt;
        if (this.escapedTimer > 2) { this.complete(player, onComplete); this.escapedTimer = 0; return; }
      }
      return;
    }
    if (this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 7) {
      this.complete(player, onComplete);
    }
  }
}
