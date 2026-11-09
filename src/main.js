import * as THREE from '../vendor/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
  canvas: $('game-canvas'), boot: $('boot'), menu: $('menu'), hud: $('hud'), pause: $('pause-menu'), results: $('results'),
  start: $('start-btn'), resume: $('resume-btn'), restart: $('restart-btn'), quit: $('quit-btn'), again: $('again-btn'), resultsMenu: $('results-menu-btn'), pauseBtn: $('pause-btn'),
  health: $('health-fill'), healthNum: $('health-num'), special: $('special-fill'), specialBtn: $('btn-special'), attackBtn: $('btn-attack'), counterBtn: $('btn-counter'), dodgeBtn: $('btn-dodge'),
  joyZone: $('joy-zone'), joyBase: $('joy-base'), joyKnob: $('joy-knob'), combo: $('combo'), comboNum: $('combo-num'), wave: $('wave-num'), waveTotal: $('wave-total'), dots: $('enemy-dots'), score: $('score'),
  toast: $('toast'), banner: $('banner'), cue: $('counter-cue'), tutorial: $('tutorial'), damage: $('damage-vignette'), flash: $('flash'), slowmo: $('slowmo-tint'), speedlines: $('speedlines'),
  sound: $('sound-btn'), best: $('best-score'), resultScore: $('result-score'), resultCombo: $('result-combo'), resultTime: $('result-time'), resultsBest: $('results-best'), resultsTitle: $('results-title'), resultsKicker: $('results-kicker')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07121b);
scene.fog = new THREE.FogExp2(0x07121b, 0.021);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

scene.add(new THREE.HemisphereLight(0x9bdcff, 0x11151d, 1.25));
const moon = new THREE.DirectionalLight(0x83cfff, 2.2);
moon.position.set(-7, 14, 8); moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -18; moon.shadow.camera.right = 18; moon.shadow.camera.top = 18; moon.shadow.camera.bottom = -18;
scene.add(moon);
const amber = new THREE.PointLight(0xffa344, 35, 18, 2); amber.position.set(6, 4, -4); scene.add(amber);
const cyan = new THREE.PointLight(0x2daeff, 22, 16, 2); cyan.position.set(-7, 3, 5); scene.add(cyan);

const mat = (color, roughness = 0.78, metalness = 0.08, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const floorMat = mat(0x18232a, 0.38, 0.38);
const darkMat = mat(0x101923, 0.72, 0.18);
const trimMat = mat(0x263b45, 0.42, 0.55);
const cyanMat = new THREE.MeshStandardMaterial({ color: 0x53dfff, emissive: 0x127c9f, emissiveIntensity: 1.8, roughness: 0.35 });
const amberMat = new THREE.MeshStandardMaterial({ color: 0xffc15c, emissive: 0xa94510, emissiveIntensity: 1.5, roughness: 0.4 });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 12, 10);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
const arena = new THREE.Group(); scene.add(arena);

function addBox(parent, x, y, z, sx, sy, sz, material, cast = true) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function addCylinder(parent, x, y, z, radius, height, material, axis = 'y') {
  const mesh = new THREE.Mesh(cylGeo, material); mesh.position.set(x, y, z); mesh.scale.set(radius, height, radius);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

// Rain-dark rooftop arena and a layered, procedural city skyline.
addBox(arena, 0, -0.48, 0, 38, 0.9, 38, floorMat, false);
for (let i = -18; i <= 18; i += 2) {
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 36), i === 0 ? cyanMat : trimMat);
  line.position.set(i, -0.015, 0); arena.add(line);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(36, 0.012, 0.018), trimMat); cross.position.set(0, -0.014, i); arena.add(cross);
}
// Rooftop perimeter curbs and glowing hazard strips.
for (const s of [-1, 1]) {
  addBox(arena, s * 17.8, 0.15, 0, 0.38, 0.65, 36, darkMat);
  addBox(arena, 0, 0.15, s * 17.8, 36, 0.65, 0.38, darkMat);
  addBox(arena, s * 17.58, 0.05, 0, 0.035, 0.07, 36, cyanMat, false);
  addBox(arena, 0, 0.05, s * 17.58, 36, 0.07, 0.035, cyanMat, false);
}
// Vents and cover boxes around the perimeter, leaving a clear combat ring.
for (const [x, z, w, d] of [[-12,-10,2.4,1.8],[12,-11,2,2.2],[-13,10,2.5,2],[13,11,2.3,1.7],[-7,-14,2,1.2],[8,14,2.4,1.3]]) {
  addBox(arena, x, 0.55, z, w, 1.1, d, darkMat);
  addBox(arena, x, 1.12, z, w + 0.16, 0.12, d + 0.16, trimMat);
  for (let k = -1; k <= 1; k++) addBox(arena, x + k * w / 4, 0.58, z + d / 2 + 0.012, 0.055, 0.58, 0.025, cyanMat, false);
}
let seed = 9241;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
for (let i = 0; i < 50; i++) {
  const side = i % 4, offset = (random() - 0.5) * 70, height = 5 + random() * 24, width = 3 + random() * 6;
  const x = side < 2 ? (side === 0 ? -1 : 1) * (23 + random() * 15) : offset;
  const z = side >= 2 ? (side === 2 ? -1 : 1) * (23 + random() * 15) : offset;
  const building = new THREE.Group(); building.position.set(x, 0, z); scene.add(building);
  const bmat = mat(random() > 0.5 ? 0x101d29 : 0x17222a, 0.94, 0.06);
  addBox(building, 0, height / 2 - 1, 0, width, height, width * (0.65 + random() * 0.5), bmat, false);
  addBox(building, 0, height - 1.4, 0, width * 0.7, 0.12, width * 0.5, trimMat, false);
  const rows = Math.floor(height / 2.3);
  for (let r = 0; r < rows; r++) for (let c = -1; c <= 1; c++) {
    if (random() > 0.42) {
      const wm = random() > 0.78 ? amberMat : cyanMat;
      addBox(building, c * width * 0.27, 0.2 + r * 2.1, width * 0.501, 0.12, 0.55, 0.025, wm, false);
    }
  }
}

function makeCharacter(isHero, index = 0) {
  const root = new THREE.Group();
  const outfit = isHero ? mat(0x101820, 0.52, 0.24) : mat(index % 2 ? 0x4b2623 : 0x35312d, 0.77, 0.08);
  const armor = isHero ? mat(0x263c48, 0.38, 0.46) : mat(0x82705b, 0.55, 0.18);
  const skin = mat(isHero ? 0x9b806f : 0xa5785f, 0.86, 0.02);
  const accent = isHero ? cyanMat : (index % 2 ? amberMat : mat(0x9a2930));
  const torso = new THREE.Group(); root.add(torso);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.68, 4, 8), outfit); body.position.y = 1.38; body.castShadow = true; torso.add(body);
  const chest = addBox(torso, 0, 1.52, 0.27, 0.48, 0.37, 0.12, armor);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin); head.position.y = 2.16; head.castShadow = true; torso.add(head);
  const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), outfit); cowl.position.y = 2.2; cowl.castShadow = true; torso.add(cowl);
  const eye = addBox(torso, 0, 2.18, 0.226, 0.24, 0.035, 0.025, accent, false);
  const shoulders = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.42, 1.72, 0); torso.add(shoulder); shoulders.push(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.36, 3, 7), outfit); upper.position.y = -0.25; upper.rotation.z = side * -0.1; upper.castShadow = true; shoulder.add(upper);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 9, 8), armor); glove.position.set(0, -0.54, 0.04); glove.castShadow = true; shoulder.add(glove);
  }
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * 0.19, 0.94, 0); root.add(leg); legs.push(leg);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 3, 7), outfit); thigh.position.y = -0.28; thigh.castShadow = true; leg.add(thigh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.38), armor); boot.position.set(0, -0.68, 0.08); boot.castShadow = true; leg.add(boot);
  }
  let cape = null;
  if (isHero) {
    cape = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 5, 1, true), mat(0x080e17, 0.62, 0.25, { side: THREE.DoubleSide }));
    cape.position.set(0, 1.05, -0.28); cape.rotation.x = -0.11; cape.castShadow = true; root.add(cape);
  } else {
    addBox(root, 0, 1.67, -0.12, 0.7, 0.23, 0.2, accent);
  }
  root.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return { root, torso, shoulders, legs, cape, isHero, phase: random() * 6, walk: 0, hitFlash: 0, attackAnim: 0, dead: false };
}

const hero = makeCharacter(true);
scene.add(hero.root);
const enemies = [];
const clock = new THREE.Clock();
const state = {
  mode: 'menu', health: 100, score: 0, combo: 0, bestCombo: 0, special: 0, wave: 1, waveTotal: 3,
  elapsed: 0, comboTimer: 0, attackCooldown: 0, dodgeTimer: 0, invulnerable: 0, specialTimer: 0, bannerTimer: 0, toastTimer: 0,
  cueEnemy: null, cueTimer: 0, waveBreak: 0, slow: 0, moving: false, muted: false, lastHit: 0, killed: 0, tutorialTimer: 0
};
const input = { x: 0, y: 0, keys: new Set(), joyId: null, cameraId: null, lastX: 0, lastY: 0, orbit: 0, zoom: 0 };
const bestKey = 'nightfall-best';
ui.best.textContent = localStorage.getItem(bestKey) || '0';
ui.waveTotal.textContent = state.waveTotal;

function showToast(text, tone = '') {
  ui.toast.textContent = text; ui.toast.className = `show ${tone}`; state.toastTimer = 1.05;
}
function banner(kicker, title, sub, duration = 1.7) {
  const k = ui.banner.querySelector('.banner-kicker'), t = ui.banner.querySelector('.banner-title'), s = ui.banner.querySelector('.banner-sub');
  k.textContent = kicker; t.textContent = title; s.textContent = sub;
  ui.banner.classList.remove('hidden', 'exit'); ui.banner.classList.add('enter'); state.bannerTimer = duration;
}
function addEnemy() {
  const index = enemies.length;
  const enemy = makeCharacter(false, index); scene.add(enemy.root);
  const angle = random() * Math.PI * 2, radius = 8.5 + random() * 4;
  enemy.root.position.set(
    THREE.MathUtils.clamp(hero.root.position.x + Math.cos(angle) * radius, -15.5, 15.5), 0,
    THREE.MathUtils.clamp(hero.root.position.z + Math.sin(angle) * radius, -15.5, 15.5)
  );
  enemy.root.rotation.y = Math.atan2(hero.root.position.x - enemy.root.position.x, hero.root.position.z - enemy.root.position.z);
  enemy.hp = 1; enemy.stun = 0; enemy.attackWait = 1.3 + random() * 2.5; enemy.windup = 0; enemy.attackCooldown = 0; enemy.index = index;
  enemies.push(enemy);
}
function startWave(wave) {
  state.wave = wave; state.waveBreak = 0; state.cueEnemy = null; state.cueTimer = 0;
  const count = 3 + wave;
  for (let i = 0; i < count; i++) addEnemy();
  ui.wave.textContent = String(wave);
  renderDots();
  banner('NIGHTFALL PROTOCOL', `WAVE ${wave}`, `${count} HOSTILES INBOUND`, 1.5);
}
function renderDots() {
  ui.dots.innerHTML = '';
  for (const e of enemies) { const dot = document.createElement('i'); if (e.dead) dot.className = 'down'; ui.dots.append(dot); }
}
function setMode(mode) {
  state.mode = mode;
  ui.menu.classList.toggle('hidden', mode !== 'menu');
  ui.hud.classList.toggle('hidden', mode === 'menu'); ui.hud.classList.toggle('visible', mode !== 'menu');
  ui.pause.classList.toggle('hidden', mode !== 'pause'); ui.results.classList.toggle('hidden', mode !== 'results');
}
function resetGame() {
  for (const e of enemies) scene.remove(e.root); enemies.length = 0;
  hero.root.position.set(0, 0, 0); hero.root.rotation.set(0, 0, 0);
  Object.assign(state, { health: 100, score: 0, combo: 0, bestCombo: 0, special: 0, wave: 1, elapsed: 0, comboTimer: 0, attackCooldown: 0, dodgeTimer: 0, invulnerable: 0, specialTimer: 0, killed: 0, cueEnemy: null, waveBreak: 0, tutorialTimer: 8, slow: 0, toastTimer: 0 });
  input.keys.clear(); input.x = 0; input.y = 0; input.joyId = null; ui.joyKnob.style.transform = '';
  ui.cue.classList.add('hidden'); ui.toast.className = ''; ui.specialBtn.classList.remove('ready');
  ui.health.style.width = '100%'; ui.healthNum.textContent = '100'; ui.score.textContent = '0'; ui.special.style.width = '0%'; ui.specialBtn.style.setProperty('--meter', '0');
  ui.combo.classList.add('hidden'); ui.damage.classList.remove('hit', 'critical'); ui.slowmo.classList.remove('on'); ui.speedlines.classList.remove('on'); ui.tutorial.classList.remove('hidden');
  startWave(1); setMode('play');
}
function finishGame(victory) {
  state.mode = 'results'; setMode('results');
  const best = Number(localStorage.getItem(bestKey) || 0), isBest = state.score > best;
  if (isBest) { localStorage.setItem(bestKey, String(state.score)); ui.best.textContent = String(state.score); }
  ui.results.classList.toggle('defeat', !victory);
  ui.resultsTitle.textContent = victory ? 'CITY SAVED' : 'NIGHT FALLS';
  ui.resultsKicker.textContent = victory ? 'THE NIGHT IS YOURS' : 'THE CITY NEEDS YOU';
  ui.resultScore.textContent = state.score.toLocaleString(); ui.resultCombo.textContent = String(state.bestCombo);
  const mins = Math.floor(state.elapsed / 60), secs = Math.floor(state.elapsed % 60).toString().padStart(2, '0'); ui.resultTime.textContent = `${mins}:${secs}`;
  ui.resultsBest.textContent = isBest ? 'NEW BEST SCORE' : '';
}

// Combat: strikes close the gap, counters punish a telegraphed attack, and
// takedowns spend the meter built by successful hits.
let audioContext;
function sound(freq = 180, duration = 0.1, type = 'triangle') {
  if (state.muted) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.48), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.055, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional. */ }
}
function nearestEnemy(max = Infinity) {
  let target = null, distance = max;
  for (const enemy of enemies) if (!enemy.dead) {
    const d = hero.root.position.distanceTo(enemy.root.position);
    if (d < distance) { target = enemy; distance = d; }
  }
  return target;
}
function updateHud() {
  ui.health.style.width = `${state.health}%`; ui.healthNum.textContent = Math.ceil(state.health);
  ui.score.textContent = state.score.toLocaleString();
  ui.special.style.width = `${state.special}%`; ui.specialBtn.style.setProperty('--meter', state.special / 100);
  ui.specialBtn.classList.toggle('ready', state.special >= 100);
  ui.combo.classList.toggle('hidden', state.combo < 2); ui.comboNum.textContent = state.combo;
  ui.damage.classList.toggle('critical', state.health <= 30);
}
function hitEnemy(enemy, kind) {
  if (!enemy || enemy.dead) return;
  enemy.hp -= kind === 'special' ? 3 : 1;
  enemy.stun = 0.55; enemy.windup = 0; enemy.attackWait = 1.8;
  if (state.cueEnemy === enemy) state.cueEnemy = null;
  state.combo++; state.comboTimer = 4; state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score += (kind === 'special' ? 250 : kind === 'counter' ? 150 : 100) * Math.min(state.combo, 10);
  state.special = Math.min(100, state.special + (kind === 'counter' ? 30 : 20));
  enemy.hitFlash = 0.22;
  const push = new THREE.Vector3().subVectors(enemy.root.position, hero.root.position).setY(0).normalize();
  enemy.root.position.addScaledVector(push, 0.65);
  if (enemy.hp <= 0) { enemy.dead = true; enemy.fall = 0; state.killed++; renderDots(); }
  hero.attackAnim = 0.4; state.slow = kind === 'special' ? 0.45 : 0.09;
  ui.flash.classList.remove('hit'); void ui.flash.offsetWidth; ui.flash.classList.add('hit');
  sound(kind === 'special' ? 110 : 220, 0.13, 'sawtooth'); updateHud();
}
function strike() {
  if (state.mode !== 'play' || state.attackCooldown > 0 || state.dodgeTimer > 0) return;
  state.attackCooldown = 0.42; hero.attackAnim = 0.35;
  const target = nearestEnemy(9);
  if (!target) { sound(110, 0.07); return; }
  const delta = new THREE.Vector3().subVectors(target.root.position, hero.root.position).setY(0);
  const d = delta.length(); delta.normalize();
  hero.root.rotation.y = Math.atan2(delta.x, delta.z);
  if (d > 1.55) hero.root.position.addScaledVector(delta, Math.min(d - 1.55, 5));
  hitEnemy(target, 'strike');
}
function counter() {
  if (state.mode !== 'play' || state.dodgeTimer > 0) return;
  const target = state.cueEnemy;
  if (target && !target.dead && target.windup > 0 && hero.root.position.distanceTo(target.root.position) < 4) {
    state.attackCooldown = 0.35; state.invulnerable = 0.45;
    hero.root.rotation.y = Math.atan2(target.root.position.x - hero.root.position.x, target.root.position.z - hero.root.position.z);
    hitEnemy(target, 'counter'); showToast('PERFECT COUNTER', 'gold');
  } else { hero.attackAnim = 0.2; showToast('WAIT FOR THE SIGNAL'); sound(110, 0.06); }
}
function dodge() {
  if (state.mode !== 'play' || state.dodgeTimer > 0) return;
  const dir = movementDirection();
  if (dir.lengthSq() < 0.01) dir.set(-Math.sin(hero.root.rotation.y), 0, -Math.cos(hero.root.rotation.y));
  state.dodgeDir = dir.normalize(); state.dodgeTimer = 0.38; state.invulnerable = 0.48; sound(90, 0.1); showToast('EVADE');
}
function takedown() {
  if (state.mode !== 'play') return;
  if (state.special < 100) { showToast('TAKEDOWN NOT READY'); return; }
  const target = nearestEnemy(10);
  if (!target) { showToast('NO TARGET IN RANGE'); return; }
  const delta = new THREE.Vector3().subVectors(target.root.position, hero.root.position).setY(0);
  const d = delta.length(); delta.normalize(); hero.root.rotation.y = Math.atan2(delta.x, delta.z);
  if (d > 1.4) hero.root.position.addScaledVector(delta, d - 1.4);
  state.special = 0; state.invulnerable = 0.7; state.attackCooldown = 0.6;
  hitEnemy(target, 'special'); state.special = 0; updateHud(); showToast('TAKEDOWN', 'gold');
}
function hurtHero(enemy) {
  if (state.invulnerable > 0) return;
  state.health = Math.max(0, state.health - 13); state.combo = 0; state.invulnerable = 0.65;
  hero.hitFlash = 0.35; ui.damage.classList.remove('hit'); void ui.damage.offsetWidth; ui.damage.classList.add('hit');
  sound(80, 0.2, 'sawtooth'); updateHud();
  if (state.health <= 0) finishGame(false);
}
function movementDirection() {
  let x = input.x + (input.keys.has('d') || input.keys.has('arrowright') ? 1 : 0) - (input.keys.has('a') || input.keys.has('arrowleft') ? 1 : 0);
  let y = input.y + (input.keys.has('s') || input.keys.has('arrowdown') ? 1 : 0) - (input.keys.has('w') || input.keys.has('arrowup') ? 1 : 0);
  const dir = new THREE.Vector3(x, 0, y);
  if (dir.lengthSq() > 1) dir.normalize();
  return dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), input.orbit);
}
function animateCharacter(c, dt, moving) {
  c.phase += dt * (moving ? 10 : 2);
  const swing = moving ? Math.sin(c.phase) * 0.7 : Math.sin(c.phase) * 0.04;
  c.legs[0].rotation.x = swing; c.legs[1].rotation.x = -swing;
  c.shoulders[0].rotation.x = -swing * 0.7; c.shoulders[1].rotation.x = swing * 0.7;
  if (c.attackAnim > 0) { c.attackAnim -= dt; c.shoulders[1].rotation.x = -2.0 * Math.sin(Math.max(0, c.attackAnim) / 0.4 * Math.PI); }
  c.torso.rotation.x = c.hitFlash > 0 ? -0.3 : moving ? 0.12 : Math.sin(c.phase) * 0.025;
  c.hitFlash = Math.max(0, c.hitFlash - dt);
  if (c.cape) c.cape.rotation.x = moving ? -0.38 + Math.sin(c.phase) * 0.06 : -0.11;
}

// Enemy pressure is deliberately readable: one attacker winds up at a time,
// giving the player a clear counter window while the others close in.
function updateEnemies(dt) {
  const activeCue = state.cueEnemy && !state.cueEnemy.dead && state.cueEnemy.windup > 0;
  if (!activeCue) { state.cueEnemy = null; ui.cue.classList.add('hidden'); }
  for (const enemy of enemies) {
    if (enemy.dead) {
      enemy.fall = Math.min(1, enemy.fall + dt * 2.8);
      enemy.root.rotation.z = Math.sin(enemy.index * 4) * enemy.fall * 1.15;
      enemy.root.position.y = -0.75 * enemy.fall;
      continue;
    }
    enemy.stun = Math.max(0, enemy.stun - dt);
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    if (enemy.stun > 0) { animateCharacter(enemy, dt, false); continue; }
    const offset = new THREE.Vector3().subVectors(hero.root.position, enemy.root.position).setY(0);
    const distance = offset.length();
    if (distance > 0.001) enemy.root.rotation.y = Math.atan2(offset.x, offset.z);
    if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) {
        if (state.cueEnemy === enemy) { state.cueEnemy = null; ui.cue.classList.add('hidden'); }
        if (distance < 2.45) hurtHero(enemy);
        enemy.attackWait = 1.6 + random() * 1.2;
      }
      animateCharacter(enemy, dt, false);
      continue;
    }
    enemy.attackWait -= dt;
    if (distance > 2.05) {
      if (distance > 1.7) {
        offset.normalize();
        enemy.root.position.addScaledVector(offset, Math.min(2.15 * dt, distance - 1.7));
      }
    } else if (enemy.attackWait <= 0 && !state.cueEnemy) {
      enemy.windup = 0.92; state.cueEnemy = enemy;
      ui.cue.classList.remove('hidden'); sound(520, 0.075, 'sine');
    }
    enemy.root.position.x = THREE.MathUtils.clamp(enemy.root.position.x, -15.8, 15.8);
    enemy.root.position.z = THREE.MathUtils.clamp(enemy.root.position.z, -15.8, 15.8);
    animateCharacter(enemy, dt, distance > 2.1);
  }
}
function updateGame(dt) {
  state.elapsed += dt;
  state.attackCooldown = Math.max(0, state.attackCooldown - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  state.dodgeTimer = Math.max(0, state.dodgeTimer - dt);
  state.slow = Math.max(0, state.slow - dt);
  if (state.comboTimer > 0 && (state.comboTimer -= dt) <= 0) { state.combo = 0; updateHud(); }
  if (state.toastTimer > 0 && (state.toastTimer -= dt) <= 0) ui.toast.className = '';
  if (state.bannerTimer > 0 && (state.bannerTimer -= dt) <= 0) {
    ui.banner.classList.remove('enter'); ui.banner.classList.add('exit');
    window.setTimeout(() => { if (state.bannerTimer <= 0) ui.banner.classList.add('hidden'); }, 420);
  }
  if (state.tutorialTimer > 0 && (state.tutorialTimer -= dt) <= 0) ui.tutorial.classList.add('hidden');

  const move = movementDirection();
  state.moving = move.lengthSq() > 0.002;
  if (state.dodgeTimer > 0 && state.dodgeDir) {
    hero.root.position.addScaledVector(state.dodgeDir, 10 * dt);
    ui.speedlines.classList.add('on');
  } else {
    ui.speedlines.classList.remove('on');
    if (state.moving) {
      hero.root.position.addScaledVector(move, 5.2 * dt);
      hero.root.rotation.y = Math.atan2(move.x, move.z);
    }
  }
  hero.root.position.x = THREE.MathUtils.clamp(hero.root.position.x, -15.5, 15.5);
  hero.root.position.z = THREE.MathUtils.clamp(hero.root.position.z, -15.5, 15.5);
  animateCharacter(hero, dt, state.moving || state.dodgeTimer > 0);
  updateEnemies(dt);
  if (state.mode !== 'play') return;

  if (enemies.length && enemies.every((e) => e.dead)) {
    if (!state.waveBreak) {
      state.waveBreak = state.wave >= state.waveTotal ? 1 : 2.4;
      if (state.wave < state.waveTotal) {
        state.health = Math.min(100, state.health + 18); updateHud();
        banner('ROOFTOP SECURED', 'WAVE CLEAR', 'RECOVERING • NEXT WAVE INBOUND', 2.2);
      }
    }
    state.waveBreak -= dt;
    if (state.waveBreak <= 0) {
      if (state.wave >= state.waveTotal) {
        finishGame(true);
      } else {
        for (const e of enemies) scene.remove(e.root);
        enemies.length = 0; startWave(state.wave + 1);
      }
    }
  }
  ui.slowmo.classList.toggle('on', state.slow > 0);
}
function updateCamera(dt) {
  const target = new THREE.Vector3(hero.root.position.x, 1.15, hero.root.position.z);
  const distance = innerWidth < innerHeight ? 12.8 : 10.8;
  const desired = new THREE.Vector3(
    target.x + Math.sin(input.orbit) * distance,
    target.y + distance * 0.56,
    target.z + Math.cos(input.orbit) * distance
  );
  camera.position.lerp(desired, 1 - Math.exp(-dt * 4.2));
  camera.lookAt(target);
}
function resize() {
  const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
  camera.aspect = width / height; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65)); renderer.setSize(width, height);
}
function beginGame() { sound(310, 0.12); resetGame(); }
function toMenu() {
  for (const enemy of enemies) scene.remove(enemy.root);
  enemies.length = 0; state.cueEnemy = null; state.health = 100; state.score = 0;
  hero.root.position.set(0, 0, 0); hero.root.rotation.set(0, 0, 0);
  ui.cue.classList.add('hidden'); ui.tutorial.classList.add('hidden');
  setMode('menu');
}
function togglePause() {
  if (state.mode === 'play') setMode('pause');
  else if (state.mode === 'pause') setMode('play');
}

ui.start.addEventListener('click', beginGame);
ui.resume.addEventListener('click', togglePause);
ui.pauseBtn.addEventListener('click', togglePause);
ui.restart.addEventListener('click', beginGame);
ui.again.addEventListener('click', beginGame);
ui.quit.addEventListener('click', toMenu);
ui.resultsMenu.addEventListener('click', toMenu);
ui.attackBtn.addEventListener('click', strike);
ui.counterBtn.addEventListener('click', counter);
ui.dodgeBtn.addEventListener('click', dodge);
ui.specialBtn.addEventListener('click', takedown);
ui.sound.addEventListener('click', () => {
  state.muted = !state.muted; ui.sound.classList.toggle('muted', state.muted);
  ui.sound.setAttribute('aria-pressed', String(!state.muted)); if (!state.muted) sound(440, 0.08);
});

// Touch joystick. The whole left control zone is draggable, not just its knob.
function setJoystick(event) {
  const rect = ui.joyBase.getBoundingClientRect();
  const radius = Math.max(30, rect.width * 0.34);
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(dx, dy), scale = length > radius ? radius / length : 1;
  const x = dx * scale, y = dy * scale;
  input.x = x / radius; input.y = y / radius;
  ui.joyKnob.style.transform = `translate(${x}px, ${y}px)`;
}
ui.joyZone.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'play') return;
  event.preventDefault(); input.joyId = event.pointerId;
  ui.joyZone.setPointerCapture(event.pointerId); setJoystick(event);
});
ui.joyZone.addEventListener('pointermove', (event) => { if (input.joyId === event.pointerId) setJoystick(event); });
function releaseJoystick(event) {
  if (input.joyId !== event.pointerId) return;
  input.joyId = null; input.x = 0; input.y = 0; ui.joyKnob.style.transform = '';
}
ui.joyZone.addEventListener('pointerup', releaseJoystick);
ui.joyZone.addEventListener('pointercancel', releaseJoystick);

// Dragging the scene orbits the follow camera. Controls remain independently tappable.
ui.canvas.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'play' || event.button > 0) return;
  input.cameraId = event.pointerId; input.lastX = event.clientX;
  ui.canvas.setPointerCapture(event.pointerId);
});
ui.canvas.addEventListener('pointermove', (event) => {
  if (input.cameraId !== event.pointerId) return;
  input.orbit -= (event.clientX - input.lastX) * 0.006;
  input.lastX = event.clientX;
});
function endCameraDrag(event) { if (input.cameraId === event.pointerId) input.cameraId = null; }
ui.canvas.addEventListener('pointerup', endCameraDrag);
ui.canvas.addEventListener('pointercancel', endCameraDrag);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  if (key === 'escape' || key === 'p') { togglePause(); return; }
  input.keys.add(key);
  if (event.repeat || state.mode !== 'play') return;
  if (key === 'j') strike();
  else if (key === 'k') counter();
  else if (key === 'l') dodge();
  else if (key === ' ') takedown();
});
window.addEventListener('keyup', (event) => input.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { input.keys.clear(); if (state.mode === 'play') setMode('pause'); });
window.addEventListener('resize', resize);
window.addEventListener('contextmenu', (event) => event.preventDefault());
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

camera.position.set(0, 7.5, 12.5); camera.lookAt(0, 1.1, 0);
ui.tutorial.innerHTML = '<b>MOVE</b> TO ENGAGE &nbsp;·&nbsp; <b>COUNTER</b> WHEN THE SIGNAL FLASHES &nbsp;·&nbsp; BUILD METER FOR A TAKEDOWN';
resize();
ui.boot.classList.add('gone');
let previous = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.04, Math.max(0, (now - previous) / 1000)); previous = now;
  if (state.mode === 'play') updateGame(dt);
  updateCamera(Math.max(dt, 0.001));
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
