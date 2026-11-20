import * as THREE from 'three';

export function parseShotParams() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot') || '', seed: parseInt(q.get('seed') || '1', 10) || 1 };
}

export function applyShot(game, shot) {
  if (!shot) return false;
  const cam = game.camera;
  const p = game.player;
  const setCam = (x, y, z, tx, ty, tz) => {
    cam.position.set(x, y, z);
    cam.lookAt(tx, ty, tz);
    game.shotCamera = { x, y, z, tx, ty, tz };
  };
  if (shot === 'start') {
    game.state = 'menu';
    p.x = 0; p.z = 30; p.mesh.position.set(0, 0, 30);
    setCam(28, 26, 78, 0, 8, 0);
    return true;
  }
  if (shot === 'chase') {
    game.state = 'playing';
    game.police.addCrime(3);
    if (!p.car) {
      const c = game.traffic.parked[0];
      if (c) p.enterCar(c);
    }
    p.x = -3; p.z = 40;
    if (p.car) { p.car.x = -3; p.car.z = 40; p.car.angle = 0; p.car.speed = 10; p.car.mesh.children[0].material.color.setHex(0xd23b3b); }
    setCam(1, 4.2, 24, -3, 1.5, 45);
    game.shotCamera = { x: 1, y: 4.2, z: 24, tx: -3, ty: 1.5, tz: 45 };
    game.chaseShot = true;
    return true;
  }
  if (shot === 'street') {
    game.state = 'playing';
    p.exitCar?.();
    p.x = 3; p.z = -20; p.mesh.position.set(3, 0, -20); p.mesh.visible = true; p.angle = Math.PI; p.mesh.rotation.y = Math.PI;
    const tc = game.traffic.cars[0];
    if (tc) { tc.x = -15; tc.z = 20; tc.angle = Math.PI / 2; tc.speed = 0; tc.mesh.position.set(-15, 0, 20); tc.mesh.rotation.y = Math.PI / 2; }
    const pd = game.peds.list[0];
    if (pd) { pd.x = 8; pd.z = -5; pd.angle = Math.PI; pd.speed = 2; pd.panic = 0; pd.mesh.position.set(8, 0, -5); pd.mesh.rotation.y = Math.PI; }
    setCam(3, 4.2, -29, 3, 2, -20);
    return true;
  }
  if (shot === 'heist') {
    game.state = 'playing';
    game.police.addCrime(2);
    p.x = 62; p.z = -58; p.mesh.position.set(62, 0, -58);
    setCam(52, 9, -40, 70, 6, -70);
    return true;
  }
  return false;
}
