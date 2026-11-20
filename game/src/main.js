import * as THREE from 'three';
import { CFG, SAVE_KEY } from './config.js';
import { buildCity } from './city.js';
import { Pedestrians } from './people.js';
import { Traffic } from './vehicles.js';
import { Player } from './player.js';
import { Police } from './police.js';
import { Combat } from './combat.js';
import { Missions } from './missions.js';
import { HUD } from './hud.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { parseShotParams, applyShot } from './shots.js';

const params = parseShotParams();
const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.colors.sky);
scene.fog = new THREE.Fog(CFG.colors.sky, 180, 420);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(28, 26, 78);

const sun = new THREE.DirectionalLight(CFG.colors.sun, 2.4);
sun.position.set(120, 180, 60);
sun.castShadow = true;
sun.shadow.camera.left = -200; sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200; sun.shadow.camera.bottom = -200;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x8a7a5a, 1.1));

const city = buildCity(scene, params.seed);
const peds = new Pedestrians(scene, params.seed + 1);
const traffic = new Traffic(scene, params.seed + 2);
const player = new Player(scene);
const police = new Police(scene);
const combat = new Combat(scene);
const missions = new Missions(scene, city.landmarks);
const hud = new HUD();
const audio = new AudioSys();
const input = new Input(renderer.domElement);

const game = {
  state: 'menu', camera, player, police, missions, traffic, peds,
  chaseShot: false, shotCamera: null, camAngle: 0, camDist: 10,
};

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      money: player.money, health: player.health, mission: missions.index,
      x: player.x, z: player.z, wanted: police.wanted,
    }));
  } catch (e) { /* storage unavailable */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    player.money = s.money ?? CFG.startMoney;
    player.health = s.health ?? CFG.playerHealth;
    missions.index = s.mission ?? 0;
    missions.setTarget();
    player.x = s.x ?? 0; player.z = s.z ?? 8;
    return true;
  } catch (e) { return false; }
}

function startGame(fresh) {
  audio.init();
  if (fresh) {
    player.money = CFG.startMoney; player.health = CFG.playerHealth;
    missions.index = 0; missions.done = false; missions.setTarget();
    police.clear();
    player.x = 0; player.z = 8;
  }
  game.state = 'playing';
  hud.showMenu(false);
  hud.showGameOver(false);
  const m = missions.current();
  if (m) hud.showMessage(m.text, 5);
}

function gameOver(reason) {
  game.state = 'gameover';
  hud.showGameOver(true, reason + ' — Uang $' + Math.floor(player.money) + ' — Misi ' + missions.index + '/6 selesai.');
  saveGame();
}

input.onAction = (action) => {
  if (game.state !== 'playing') return;
  audio.init();
  if (action === 'enter') {
    if (player.car) { player.exitCar(); hud.showMessage('Kamu keluar dari mobil.'); }
    else {
      const c = traffic.nearestParked(player.x, player.z, 7);
      if (c) {
        player.enterCar(c);
        police.addCrime(1);
        peds.scare(player.x, player.z, 14);
        hud.showMessage(c.sport ? 'Mobil sport dicuri! Polisi mengejarmu!' : 'Mobil dicuri! Cepat pergi!');
        audio.blip(300, 0.2, 'square', 0.15);
      } else hud.showMessage('Tidak ada mobil di dekat sini. Cari mobil yang terparkir.');
    }
  }
  if (action === 'interact') {
    const m = missions.current();
    if (m) hud.showMessage(m.brief, 4);
  }
  if (action === 'attack') {
    if (combat.punch(player, peds, police)) { audio.punch(); }
  }
  if (action === 'shoot') {
    if (combat.shoot(player, police)) audio.shot();
  }
};
input.onPause = () => {
  if (game.state === 'playing') { game.state = 'paused'; hud.showMenu(true); document.getElementById('menu-title').textContent = 'JEDA — SOLMAR HEAT'; }
  else if (game.state === 'paused') { game.state = 'playing'; hud.showMenu(false); }
};
input.onMute = () => {
  const muted = audio.toggleMute();
  hud.showMessage(muted ? 'Suara dimatikan (M).' : 'Suara dinyalakan (M).', 2);
};

document.getElementById('btn-start').addEventListener('click', () => startGame(true));
document.getElementById('btn-continue').addEventListener('click', () => {
  const had = loadGame();
  startGame(false);
  hud.showMessage(had ? 'Save dimuat. Selamat datang kembali, Jax.' : 'Tidak ada save. Mulai baru.', 3);
});
document.getElementById('btn-restart').addEventListener('click', () => startGame(true));
document.getElementById('btn-mute').addEventListener('click', () => { audio.init(); input.onMute(); });
window.addEventListener('beforeunload', saveGame);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const isShot = applyShot(game, params.shot);
if (isShot && params.shot !== 'start') hud.showMenu(false);
if (params.shot === 'chase') {
  const m = missions.current();
  if (m) hud.showMessage('MISI: ' + m.title + ' — Kabur dari polisi!', 5);
}

const clock = new THREE.Clock();
let camYaw = 0;

function updateCamera(dt) {
  const target = player.car ? player.car : player;
  const fx = Math.sin(target.angle), fz = Math.cos(target.angle);
  if (game.chaseShot && player.car) {
    const rx = Math.cos(target.angle), rz = -Math.sin(target.angle);
    player.car.speed = 10;
    // Stage police units as a pacing escort: unit 0 sits in frame at the
    // player's left-rear, the rest are held clear so none can reach the
    // player and trigger a busted/game-over screen mid-shot.
    const spots = [[-2, 6], [-7, 14], [9, 20]];
    game.police.units.forEach((u, i) => {
      const s = spots[Math.min(i, 2)];
      u.x = player.x - fx * s[1] + rx * s[0];
      u.z = player.z - fz * s[1] + rz * s[0];
      u.angle = target.angle;
      u.speed = player.car.speed;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.angle;
    });
    const bx = player.x - fx * 16 + rx * 4, bz = player.z - fz * 16 + rz * 4;
    camera.position.set(bx, 4.2, bz);
    camera.lookAt(player.x + fx * 5, 1.5, player.z + fz * 5);
    return;
  }
  camYaw += input.consumeMouseDX() * 0.003;
  const dist = player.car ? 13 : 9;
  const height = player.car ? 5.5 : 4.2;
  const cx = player.x - Math.sin(camYaw) * dist;
  const cz = player.z - Math.cos(camYaw) * dist;
  camera.position.lerp(new THREE.Vector3(cx, height, cz), Math.min(1, dt * 6));
  camera.lookAt(player.x, 2, player.z);
  input.camAngle = camYaw;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (game.state === 'playing') {
    player.update(dt, input, city.colliders);
    traffic.update(dt);
    peds.update(dt, { x: player.x, z: player.z });
    police.update(dt, player, () => gameOver('Jax tertangkap polisi!'));
    combat.update(dt);
    missions.update(dt, player, police, traffic, (m) => {
      audio.cash();
      hud.showMessage('MISI SELESAI: ' + m.title + ' — Hadiah $' + m.reward + '!', 5);
      if (missions.done) hud.showMessage('SEMUA MISI SELESAI! Kane kalah. Solmar City milikmu!', 8);
      saveGame();
    });
    audio.update(dt, game);
    if (player.health <= 0) gameOver('Jax tumbang!');
    updateCamera(dt);
    hud.update(dt, game);
  } else if (game.state === 'menu' && params.shot === 'start') {
    camera.position.set(28 + Math.sin(clock.elapsedTime * 0.05) * 6, 26, 78);
    camera.lookAt(0, 8, 0);
  } else if (game.state === 'menu') {
    camera.lookAt(0, 8, 0);
  }
  renderer.render(scene, camera);
}
animate();
