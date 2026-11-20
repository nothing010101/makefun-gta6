import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG } from './random.js';

export function makeBox(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function buildCity(scene, seed = 1) {
  const rng = new RNG(seed);
  const group = new THREE.Group();
  const colliders = [];
  const C = CFG.colors;
  const half = CFG.cityHalf;
  const step = CFG.blockSize + CFG.roadWidth;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 120, half * 2 + 160), new THREE.MeshLambertMaterial({ color: 0x6a7a5a }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = 40; ground.receiveShadow = true;
  group.add(ground);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 120, 90), new THREE.MeshLambertMaterial({ color: C.sea }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.1, CFG.seaZ + 30); group.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 120, 22), new THREE.MeshLambertMaterial({ color: C.sand }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.15, CFG.beachZ + 6); sand.receiveShadow = true; group.add(sand);

  const roadMat = new THREE.MeshLambertMaterial({ color: C.road });
  const walkMat = new THREE.MeshLambertMaterial({ color: C.sidewalk });
  for (let i = -4; i <= 4; i++) {
    const p = i * step;
    const rv = new THREE.Mesh(new THREE.PlaneGeometry(CFG.roadWidth, half * 2), roadMat);
    rv.rotation.x = -Math.PI / 2; rv.position.set(p, 0.05, 0); rv.receiveShadow = true; group.add(rv);
    const rh = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, CFG.roadWidth), roadMat);
    rh.rotation.x = -Math.PI / 2; rh.position.set(0, 0.05, p); rh.receiveShadow = true; group.add(rh);
  }

  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x2a3542 });
  function tower(x, z, w, d, h, color) {
    const b = makeBox(w, h, d, color, x, h / 2, z);
    group.add(b);
    colliders.push({ x, z, r: Math.max(w, d) * 0.62 });
    const floors = Math.floor(h / 7);
    for (let f = 0; f < floors; f++) {
      for (let k = 0; k < Math.max(2, Math.floor(w / 6)); k++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), rng.chance(0.55) ? windowMat : darkMat);
        win.position.set(x - w / 2 + 3 + k * 6, 4 + f * 7, z + d / 2 + 0.06);
        group.add(win);
      }
    }
    return b;
  }

  const landmarks = {};
  for (let gx = -4; gx <= 4; gx++) {
    for (let gz = -4; gz <= 4; gz++) {
      const cx = gx * step + step / 2 - CFG.roadWidth / 2;
      const cz = gz * step + step / 2 - CFG.roadWidth / 2;
      if (Math.abs(gx) <= 0 && Math.abs(gz) <= 0) continue;
      if (gz === 4) continue;
      const h = rng.range(10, 46);
      const col = rng.color(C.building);
      tower(cx, cz, rng.range(16, 24), rng.range(16, 24), h, col);
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(CFG.blockSize, CFG.blockSize), walkMat);
      walk.rotation.x = -Math.PI / 2; walk.position.set(cx, 0.04, cz); walk.receiveShadow = true;
      group.add(walk);
    }
  }

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 1.2, 24), new THREE.MeshLambertMaterial({ color: 0xcfc4a8 }));
  plaza.position.set(0, 0.6, 0); group.add(plaza);
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 2.4, 20), new THREE.MeshLambertMaterial({ color: 0x7fb8d8 }));
  fountain.position.set(0, 1.6, 0); group.add(fountain);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, 5, 10), new THREE.MeshBasicMaterial({ color: 0xbfe8ff }));
  jet.position.set(0, 5, 0); group.add(jet);

  function sign(text, color, x, y, z, w = 26) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = color; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 52);
    const tex = new THREE.CanvasTexture(cv);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, 5), new THREE.MeshBasicMaterial({ map: tex }));
    mesh.position.set(x, y, z); group.add(mesh);
    return mesh;
  }
  const club = tower(-70, -70, 30, 22, 20, 0x3a2a4a);
  landmarks.club = new THREE.Vector3(-70, 0, -70);
  sign('CLUB NEON', '#ff2e88', -70, 24, -58.8);
  const casino = tower(70, -70, 34, 24, 26, 0xd8b25a);
  landmarks.casino = new THREE.Vector3(70, 0, -70);
  sign('CASINO SOL', '#ffc233', 70, 30, -57.8);
  const garage = tower(-70, 70, 28, 20, 12, 0x4a6a8a);
  landmarks.garage = new THREE.Vector3(-70, 0, 70);
  sign("MARISOL'S GARAGE", '#00e5ff', -70, 16, 80.8);
  const warehouse = tower(70, 70, 30, 22, 14, 0x8a4a3a);
  landmarks.warehouse = new THREE.Vector3(70, 0, 70);
  sign('KANE WAREHOUSE', '#ff5544', 70, 18, 80.8);
  landmarks.pier = new THREE.Vector3(0, 0, 178);
  landmarks.plaza = new THREE.Vector3(0, 0, 0);

  for (let x = -160; x <= 160; x += 23) {
    const pier = makeBox(3, 1, 26, 0x8a6a4a, x, 0.8, CFG.beachZ + 22);
    group.add(pier);
  }
  const pierDeck = makeBox(340, 1, 8, 0x8a6a4a, 0, 0.8, CFG.seaZ + 4);
  group.add(pierDeck);

  const palmTrunk = new THREE.MeshLambertMaterial({ color: 0x7a5a34 });
  const palmLeaf = new THREE.MeshLambertMaterial({ color: 0x2e8b4a });
  for (let i = 0; i < 40; i++) {
    const x = rng.range(-half, half);
    const z = rng.pick([-160, -114, -68, -22, 24, 70, 116, 160]) + rng.range(-4, 4);
    if (Math.abs(z) > 165) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 6), palmTrunk);
    trunk.position.set(x, 3.5, z); trunk.castShadow = true; group.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), palmLeaf);
    top.scale.y = 0.45; top.position.set(x, 7.4, z); group.add(top);
  }

  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (let i = -3; i <= 3; i++) {
    for (const z of [-120, -40, 40, 120]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      pole.position.set(i * step + 7, 3.5, z); group.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), lampMat);
      bulb.position.set(i * step + 7, 7.2, z); group.add(bulb);
    }
  }

  scene.add(group);
  return { group, colliders, landmarks, rng };
}
