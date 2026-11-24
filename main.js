import * as THREE from 'three';

// ============================================================
// NIM JUNGLE 3D — Fully interactive 3D maths adventure
// ============================================================

const $ = (id) => document.getElementById(id);
const sceneHost = $('scene');

// ---------- Global state ----------
let soundOn = true;
let audioCtx = null;
let cameraMode = 0;
let stars = 0;

const state = {
  target: 10,
  moves: [1, 2],
  total: 0,
  startingTotal: 0,
  turn: 0,
  opponent: 'smart',
  currentChallenge: null,
  history: [],
  snapshots: [],
  gameOver: false,
  busy: false,
  lastMove: null,
  hintCount: 0,
};

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
sceneHost.appendChild(renderer.domElement);
window.__NIM_READY = true;

// ---------- Scene & camera ----------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9ed4c6, 16, 38);

const camera = new THREE.PerspectiveCamera(
  38,
  sceneHost.clientWidth / sceneHost.clientHeight,
  0.1,
  100
);
camera.position.set(0, 6.2, 14.8);
camera.lookAt(0, 1.25, 0);

// ---------- Lighting ----------
scene.add(new THREE.HemisphereLight(0xdff8ff, 0x386b3d, 2.3));

const sun = new THREE.DirectionalLight(0xfff2d4, 3.2);
sun.position.set(-7, 12, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 30;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x88d8ff, 1.5);
fill.position.set(8, 5, -5);
scene.add(fill);

// ---------- Materials ----------
const mat = (color, rough = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough });

const mats = {
  grass: mat(0x62a56a),
  darkGrass: mat(0x347c4b),
  leaf: mat(0x26724c),
  leaf2: mat(0x43965e),
  wood: mat(0x765034),
  rock: mat(0x708477),
  bark: mat(0x67482d),
  stone: mat(0xb8c9b4, 0.7),
  stoneGlow: new THREE.MeshStandardMaterial({
    color: 0x9ad8a0,
    emissive: 0x3a7a4a,
    emissiveIntensity: 0.6,
    roughness: 0.5,
  }),
  stoneTarget: new THREE.MeshStandardMaterial({
    color: 0xffd86b,
    emissive: 0xd4a017,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  }),
};

// ---------- Ground ----------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(18, 64),
  mat(0x71b27a)
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
scene.add(ground);

const clearing = new THREE.Mesh(
  new THREE.CircleGeometry(7.5, 64),
  mat(0x98c985)
);
clearing.rotation.x = -Math.PI / 2;
clearing.position.y = 0.005;
clearing.receiveShadow = true;
scene.add(clearing);

// ---------- Scenery: trees & plants ----------
function makeTree(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.36, 2.6, 8),
    mats.wood
  );
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  g.add(trunk);

  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25 - i * 0.16, 1),
      i % 2 ? mats.leaf : mats.leaf2
    );
    c.position.set((i - 1) * 0.55, 2.5 + i * 0.43, -0.1);
    c.scale.set(1.1, 0.95, 1);
    c.castShadow = true;
    g.add(c);
  }
  scene.add(g);
  return g;
}

[
  [-9, -4, 1.4],
  [-7, 3, 1.05],
  [8, -4, 1.35],
  [9, 3, 1.15],
  [-12, 1, 1.5],
  [12, 1, 1.5],
  [-5, -9, 1.1],
  [5, -9, 1.2],
].forEach(([x, z, s]) => makeTree(x, z, s));

// Small plants
for (let i = 0; i < 28; i++) {
  const p = new THREE.Group();
  const x = Math.random() * 24 - 12;
  const z = Math.random() * 20 - 10;
  if (Math.abs(x) < 5 && Math.abs(z) < 4) continue;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.06, 0.6, 5),
    mats.darkGrass
  );
  stem.position.y = 0.3;
  p.add(stem);

  const leaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.75, 5),
    i % 2 ? mats.leaf : mats.leaf2
  );
  leaf.position.y = 0.55;
  leaf.rotation.z = (Math.random() - 0.5) * 0.4;
  p.add(leaf);

  p.position.set(x, 0, z);
  scene.add(p);
}

// Stones
for (let i = 0; i < 18; i++) {
  const r = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.28, 0),
    mats.rock
  );
  r.position.set(
    Math.random() * 18 - 9,
    0.15,
    Math.random() * 14 - 7
  );
  r.scale.y = 0.5 + Math.random();
  r.castShadow = true;
  scene.add(r);
}

// ---------- Helper: sphere / capsule ----------
function sphere(parent, color, pos, scale, rough = 0.8) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 12),
    mat(color, rough)
  );
  m.position.set(...pos);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function capsule(parent, color, a, b, r) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, d.length(), 10),
    mat(color)
  );
  mesh.position.copy(A.add(B).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    d.normalize()
  );
  mesh.castShadow = true;
  parent.add(mesh);

  sphere(parent, color, a, [r, r, r]);
  sphere(parent, color, b, [r, r, r]);

  return mesh;
}

// ---------- Procedural animals ----------
function createElephant() {
  const root = new THREE.Group();
  root.position.set(-2.8, 0, 0);

  sphere(root, 0x8c9da3, [0, 1.15, 0], [1.18, 0.85, 0.72]);
  sphere(root, 0x9baeb4, [0.83, 1.45, 0.04], [0.7, 0.68, 0.6]);
  sphere(root, 0x8b9ca2, [1.15, 1.45, 0.1], [0.45, 0.52, 0.43]);
  sphere(root, 0x91a5ab, [1.48, 1.1, 0.18], [0.23, 0.48, 0.24]);

  capsule(root, 0x8b9ca2, [1.5, 1.15, 0.18], [1.58, 0.72, 0.24], 0.19);
  capsule(root, 0x8b9ca2, [1.58, 0.72, 0.24], [1.46, 0.38, 0.26], 0.16);

  sphere(root, 0x9aadb3, [-0.05, 1.45, 0.63], [0.62, 0.68, 0.16]);
  sphere(root, 0x9aadb3, [-0.05, 1.45, -0.63], [0.62, 0.68, 0.16]);

  for (const x of [-0.65, 0.55]) {
    for (const z of [-0.48, 0.48]) {
      sphere(root, 0x84969c, [x, 0.42, z], [0.27, 0.55, 0.26]);
    }
  }

  sphere(root, 0xffffff, [1.03, 1.64, 0.4], [0.12, 0.13, 0.08]);
  sphere(root, 0x172c32, [1.08, 1.64, 0.46], [0.055, 0.07, 0.045]);
  sphere(root, 0xffffff, [1.03, 1.64, -0.4], [0.12, 0.13, 0.08]);
  sphere(root, 0x172c32, [1.08, 1.64, -0.46], [0.055, 0.07, 0.045]);

  capsule(root, 0xffe7a8, [1.35, 1.08, 0.34], [1.64, 1.22, 0.36], 0.08);
  capsule(root, 0xffe7a8, [1.35, 1.08, -0.34], [1.64, 1.22, -0.36], 0.08);

  capsule(root, 0x85969a, [-1.1, 1.35, 0], [-1.5, 1.1, 0], 0.055);

  root.userData.anim = 1;
  root.userData.baseY = 0.03;
  scene.add(root);
  return root;
}

function createTiger() {
  const root = new THREE.Group();
  root.position.set(2.65, 0, 0);

  sphere(root, 0xe88d32, [0, 1.05, 0], [1.05, 0.62, 0.48]);
  sphere(root, 0xef9b3b, [0.78, 1.4, 0], [0.5, 0.48, 0.42]);
  sphere(root, 0xf4a449, [1.03, 1.37, 0.02], [0.34, 0.32, 0.32]);

  for (const x of [-0.65, 0.65]) {
    for (const z of [-0.3, 0.3]) {
      capsule(root, 0xe78d34, [x, 0.75, z], [x, 0.18, z], 0.14);
      sphere(root, 0xf3c46c, [x, 0.12, z], [0.2, 0.1, 0.16]);
    }
  }

  for (let x = -0.65; x <= 0.55; x += 0.28) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.07, 0.9, 8),
      mat(0x29251e)
    );
    stripe.rotation.z = Math.PI / 2;
    stripe.position.set(x, 1.08, 0.02);
    root.add(stripe);
  }

  sphere(root, 0xffffff, [0.94, 1.55, 0.28], [0.09, 0.1, 0.06]);
  sphere(root, 0x1c1c1c, [0.97, 1.55, 0.33], [0.045, 0.055, 0.04]);
  sphere(root, 0xffffff, [0.94, 1.55, -0.28], [0.09, 0.1, 0.06]);
  sphere(root, 0x1c1c1c, [0.97, 1.55, -0.33], [0.045, 0.055, 0.04]);
  sphere(root, 0xffe5c3, [1.2, 1.23, 0.14], [0.18, 0.13, 0.18]);
  sphere(root, 0xffe5c3, [1.2, 1.23, -0.14], [0.18, 0.13, 0.18]);
  sphere(root, 0x27221c, [1.33, 1.3, 0], [0.08, 0.06, 0.1]);

  sphere(root, 0xe88d32, [0.6, 1.72, 0.34], [0.18, 0.18, 0.12]);
  sphere(root, 0xe88d32, [0.6, 1.72, -0.34], [0.18, 0.18, 0.12]);

  capsule(root, 0xe88d32, [-0.95, 1.2, 0], [-1.45, 1.5, 0], 0.075);
  capsule(root, 0x2b2721, [-1.45, 1.5, 0], [-1.65, 1.7, 0], 0.08);

  root.userData.anim = 2;
  root.userData.baseY = 0.03;
  scene.add(root);
  return root;
}

function createLeopard() {
  const root = new THREE.Group();
  root.position.set(0, 0, -2.5);

  sphere(root, 0xd9aa50, [0, 1.05, 0], [1.05, 0.65, 0.48]);
  sphere(root, 0xe4bd68, [0.78, 1.4, 0], [0.5, 0.47, 0.4]);
  sphere(root, 0xe8c477, [1.08, 1.36, 0], [0.34, 0.32, 0.3]);

  for (let x = -0.8; x < 0.7; x += 0.22) {
    for (const z of [-0.35, 0.35]) {
      sphere(root, 0x4a3524, [x, 1.2, z], [0.07, 0.07, 0.055]);
      sphere(root, 0x4a3524, [x + 0.06, 0.85, z], [0.055, 0.06, 0.045]);
    }
  }

  for (const x of [-0.65, 0.65]) {
    for (const z of [-0.3, 0.3]) {
      capsule(root, 0xd6a64e, [x, 0.72, z], [x, 0.16, z], 0.14);
    }
  }

  sphere(root, 0xffffff, [0.96, 1.55, 0.27], [0.09, 0.1, 0.06]);
  sphere(root, 0x1c1c1c, [0.99, 1.55, 0.32], [0.045, 0.05, 0.04]);
  sphere(root, 0xffffff, [0.96, 1.55, -0.27], [0.09, 0.1, 0.06]);
  sphere(root, 0x1c1c1c, [0.99, 1.55, -0.32], [0.045, 0.05, 0.04]);
  sphere(root, 0xffedcf, [1.2, 1.23, 0.14], [0.17, 0.12, 0.16]);
  sphere(root, 0xffedcf, [1.2, 1.23, -0.14], [0.17, 0.12, 0.16]);
  sphere(root, 0x3a2921, [1.32, 1.3, 0], [0.07, 0.055, 0.09]);

  capsule(root, 0xd6a64e, [-0.9, 1.1, 0], [-1.4, 1.35, 0], 0.07);

  root.userData.anim = 3;
  root.userData.baseY = 0.03;
  scene.add(root);
  return root;
}

const elephant = createElephant();
const tiger = createTiger();
const leopard = createLeopard();

const animalGroups = [elephant, tiger, leopard];

// ---------- 3D Number Path (interactive stones) ----------
const pathStones = [];
const stoneRadius = 0.52;
let pathGroup = new THREE.Group();
scene.add(pathGroup);

function buildNumberPath() {
  // Remove old stones
  pathGroup.clear();
  pathStones.length = 0;

  const t = state.target;
  const count = t + 1;
  // Spread the numbers across a gentle arc in front of the animals.
  const arcWidth = 9;
  const startX = -arcWidth / 2;
  const stepX = arcWidth / Math.max(1, count - 1);

  for (let i = 0; i < count; i++) {
    const x = startX + stepX * i;
    // Gentle arc: lift the middle slightly
    const z = 2.6 - Math.abs(x) * 0.08;
    const y = 0.3 + stoneRadius;

    const stoneMat = i === t ? mats.stoneTarget.clone() : mats.stoneGlow.clone();
    const stone = new THREE.Mesh(
      new THREE.IcosahedronGeometry(stoneRadius, 1),
      stoneMat
    );
    stone.position.set(x, y, z);
    stone.castShadow = true;
    stone.receiveShadow = true;
    stone.userData.number = i;
    stone.userData.baseY = y;

    // Number label as a sprite (canvas texture)
    const label = makeNumberSprite(i, i === t);
    label.position.set(x, y + stoneRadius + 0.45, z);
    label.userData.isLabel = true;

    pathGroup.add(stone);
    pathGroup.add(label);

    pathStones.push({ stone, label, number: i, baseY: y });
  }

  // Ground markers (small discs under each stone)
  for (let i = 0; i < count; i++) {
    const x = startX + stepX * i;
    const z = 2.6 - Math.abs(x) * 0.08;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 20),
      new THREE.MeshBasicMaterial({
        color: 0x4a7a5a,
        transparent: true,
        opacity: 0.25,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, 0.06, z);
    pathGroup.add(disc);
  }

  updatePathVisuals();
}

function makeNumberSprite(number, isTarget) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Rounded badge
  ctx.beginPath();
  const r = 30;
  ctx.moveTo(r, 0);
  ctx.lineTo(128 - r, 0);
  ctx.quadraticCurveTo(128, 0, 128, r);
  ctx.lineTo(128, 128 - r);
  ctx.quadraticCurveTo(128, 128, 128 - r, 128);
  ctx.lineTo(r, 128);
  ctx.quadraticCurveTo(0, 128, 0, 128 - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  ctx.fillStyle = isTarget ? '#ffd86b' : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = isTarget ? '#c4930a' : '#7aa17f';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = isTarget ? '#7a5b00' : '#1a4d2e';
  ctx.font = 'bold 64px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.9, 1);
  return sprite;
}

function updatePathVisuals() {
  if (!pathStones.length) return;

  pathStones.forEach((p) => {
    const n = p.number;
    const isCurrent = n === state.total;
    const isTarget = n === state.target;
    const isReachable =
      !state.gameOver &&
      !state.busy &&
      state.turn === 0 &&
      state.moves.some((m) => n === state.total + m);

    // Color based on state
    if (isTarget) {
      p.stone.material.color.setHex(0xffd86b);
      p.stone.material.emissive.setHex(0xd4a017);
      p.stone.material.emissiveIntensity = 0.9;
    } else if (isReachable) {
      p.stone.material.color.setHex(0x9ad8a0);
      p.stone.material.emissive.setHex(0x3a7a4a);
      p.stone.material.emissiveIntensity = 0.85;
    } else if (isCurrent) {
      p.stone.material.color.setHex(0xf4b44e);
      p.stone.material.emissive.setHex(0x9a6b1a);
      p.stone.material.emissiveIntensity = 0.9;
    } else {
      p.stone.material.color.setHex(0xb8c9b4);
      p.stone.material.emissive.setHex(0x000000);
      p.stone.material.emissiveIntensity = 0;
    }

    // Scale: current stone slightly larger
    const targetScale = isCurrent ? 1.18 : 1;
    p.stone.scale.setScalar(
      p.stone.scale.x + (targetScale - p.stone.scale.x) * 0.15
    );
  });
}

// ---------- Fireflies (particle system) ----------
const fireflies = [];
for (let i = 0; i < 24; i++) {
  const f = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xd6ff7a })
  );
  f.position.set(
    Math.random() * 16 - 8,
    1.5 + Math.random() * 4,
    Math.random() * 14 - 7
  );
  scene.add(f);
  fireflies.push({
    mesh: f,
    base: f.position.clone(),
    phase: Math.random() * 6,
  });
}

// ---------- Raycaster for clicking 3D stones ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onSceneClick(event) {
  if (state.gameOver || state.busy || state.turn !== 0) return;

  const rect = sceneHost.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const clickable = pathStones.map((p) => p.stone);
  const hits = raycaster.intersectObjects(clickable, false);

  if (hits.length > 0) {
    const n = hits[0].object.userData.number;
    const delta = n - state.total;
    if (state.moves.includes(delta) && delta > 0) {
      playMove(delta);
    } else {
      showToast(
        `That stone is ${delta > 0 ? '+' + delta : 'not reachable'}. Try +${state.moves.join(' or +')}.`
      );
    }
  }
}

sceneHost.addEventListener('click', onSceneClick);

// ---------- Resize ----------
function resize() {
  const w = sceneHost.clientWidth;
  const h = sceneHost.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// ---------- Camera modes ----------
const cameraPresets = [
  { pos: new THREE.Vector3(0, 6.2, 14.8), look: new THREE.Vector3(0, 1.25, 0) },
  {
    pos: new THREE.Vector3(-7, 5.5, 12),
    look: new THREE.Vector3(0, 1.25, 0),
  },
  {
    pos: new THREE.Vector3(7, 5.5, 12),
    look: new THREE.Vector3(0, 1.25, 0),
  },
  {
    pos: new THREE.Vector3(0, 9, 8),
    look: new THREE.Vector3(0, 1.2, 1.5),
  },
];

function setCameraMode(mode) {
  cameraMode = mode % cameraPresets.length;
  const preset = cameraPresets[cameraMode];
  camera.position.copy(preset.pos);
  camera.lookAt(preset.look);
}

function cycleCamera() {
  setCameraMode(cameraMode + 1);
  showToast('Camera angle changed');
}

// ---------- Animation loop ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Gentle idle bob for animals
  animalGroups.forEach((a, i) => {
    if (a.userData.baseY !== undefined) {
      a.position.y =
        a.userData.baseY + Math.sin(t * 1.5 + i * 1.2) * 0.04;
    }
    // Slight rotation sway
    a.rotation.y = Math.sin(t * 0.35 + i) * 0.04;
  });

  // Fireflies drift
  fireflies.forEach((f) => {
    f.mesh.position.y =
      f.base.y + Math.sin(t * 1.7 + f.phase) * 0.35;
    f.mesh.position.x =
      f.base.x + Math.cos(t + f.phase) * 0.2;
  });

  // Pulse the current / reachable stones
  pathStones.forEach((p) => {
    if (
      p.number === state.total ||
      (state.turn === 0 &&
        !state.busy &&
        !state.gameOver &&
        state.moves.some((m) => p.number === state.total + m))
    ) {
      const pulse = 1 + Math.sin(t * 3.2) * 0.06;
      p.stone.scale.setScalar(pulse);
      p.label.material.opacity = 0.75 + Math.sin(t * 4) * 0.25;
    } else {
      p.label.material.opacity = 0.9;
    }
  });

  // Smooth camera follow: gently look towards the current total
  const currentStone = pathStones[state.total];
  if (currentStone && cameraMode === 0) {
    const targetX = currentStone.stone.position.x * 0.12;
    const targetLook = new THREE.Vector3(
      targetX,
      1.4,
      currentStone.stone.position.z * 0.3
    );
    camera.lookAt(targetLook);
  }

  renderer.render(scene, camera);
}

animate();

// ============================================================
// GAME LOGIC
// ============================================================

function winningMoves(total, target, moves) {
  return moves.filter(
    (m) => total + m <= target && !isWinning(total + m, target, moves)
  );
}

function isWinning(total, target, moves) {
  if (total >= target) return false;
  const memo = {};
  function win(p) {
    if (p >= target) return true;
    if (memo[p] !== undefined) return memo[p];
    return (memo[p] = moves.some((m) => p + m <= target && !win(p + m)));
  }
  return win(total);
}

function bestComputerMove() {
  const good = winningMoves(state.total, state.target, state.moves);
  if (state.opponent === 'easy' || !good.length) {
    return state.moves[Math.floor(Math.random() * state.moves.length)];
  }
  return good[Math.floor(Math.random() * good.length)];
}

function canMove(m) {
  return !state.gameOver && !state.busy && state.total + m <= state.target;
}

function playerName(turn) {
  if (turn === 0) return 'Player 1';
  if (state.opponent === 'two') return 'Player 2';
  return state.opponent === 'easy' ? 'Friendly Elephant' : 'Smart Tiger';
}

// ---------- Play a move ----------
function playMove(amount, fromComputer = false) {
  if (!canMove(amount)) return;

  state.snapshots.push({
    total: state.total,
    turn: state.turn,
    history: state.history.slice(),
    gameOver: state.gameOver,
  });

  state.total += amount;
  state.history.push({
    player: playerName(state.turn),
    amount,
    total: state.total,
    computer: fromComputer,
  });
  state.lastMove = amount;

  playTone(fromComputer ? 440 : 620, 0.06);
  render();
  animateAnimalMove(state.turn, amount);
  updatePathVisuals();

  // Bump the big total
  const totalEl = $('total');
  totalEl.classList.add('bump');
  setTimeout(() => totalEl.classList.remove('bump'), 220);

  if (state.total >= state.target) {
    finishGame(state.turn);
    return;
  }

  state.turn = 1 - state.turn;
  render();
  updatePathVisuals();

  // Computer turn
  if (state.opponent !== 'two' && state.turn === 1 && !state.gameOver) {
    state.busy = true;
    render();
    setTimeout(() => {
      state.busy = false;
      if (state.gameOver) return;
      const move = bestComputerMove();
      playMove(move, true);
    }, 650);
  }
}

// ---------- Finish game ----------
function finishGame(winner) {
  state.gameOver = true;
  state.busy = false;
  stars++;
  $('starCount').textContent = stars;

  const isHumanWinner = winner === 0;
  const winnerName = isHumanWinner
    ? 'Player 1'
    : state.opponent === 'two'
      ? 'Player 2'
      : playerName(1);

  const title = isHumanWinner
    ? 'You are the Jungle Champion!'
    : state.opponent === 'two'
      ? 'Player 2 wins this round!'
      : `${playerName(1)} wins this round!`;

  $('characterName').textContent = isHumanWinner
    ? 'Jungle champion!'
    : `${winnerName} is the champion!`;
  $('characterMood').textContent = isHumanWinner
    ? 'Brilliant strategy!'
    : 'Try again and discover a strategy!';
  $('sceneTip').textContent = isHumanWinner
    ? 'Fantastic thinking!'
    : 'The jungle champion is ready!';

  $('hintText').hidden = false;
  $('hintText').textContent = isHumanWinner
    ? '🏆 You reached the target! Think about which moves helped you win.'
    : state.opponent === 'two'
      ? '🏆 Player 2 reached the target first. Play another round!'
      : '🐯 Your opponent reached the target first. Replay and try a different strategy!';

  showToast(
    isHumanWinner
      ? `🎉 ${winnerName} wins! Great thinking!`
      : `🏆 ${winnerName} wins!`
  );

  addWinOverlay(
    title,
    isHumanWinner
      ? 'Try the next level or challenge a friend.'
      : 'You can learn from this round and try a new strategy.'
  );

  // Camera zoom-in on win
  const currentStone = pathStones[state.total];
  if (currentStone) {
    camera.position.set(
      currentStone.stone.position.x,
      3,
      currentStone.stone.position.z + 6
    );
    camera.lookAt(currentStone.stone.position);
  }

  // Animal celebration hop
  const winnerAnimal = winner === 0 ? elephant : tiger;
  celebrateAnimal(winnerAnimal);

  render();
  updatePathVisuals();
}

function addWinOverlay(title, sub) {
  sceneHost.querySelector('.win-overlay')?.remove();
  const div = document.createElement('div');
  div.className = 'win-overlay';
  div.innerHTML = `<div class="win-message"><div style="font-size:35px">${title.includes('Champion') ? '🏆' : '🐯'}</div><h3>${title}</h3><p>${sub}</p></div>`;
  sceneHost.appendChild(div);
}

function celebrateAnimal(animal) {
  let hops = 0;
  const interval = setInterval(() => {
    animal.position.y = animal.userData.baseY + 0.4;
    setTimeout(() => {
      animal.position.y = animal.userData.baseY;
    }, 150);
    hops++;
    if (hops >= 4) clearInterval(interval);
  }, 300);
}

function animateAnimalMove(turn, move) {
  const animal = turn === 0 ? elephant : tiger;
  const direction = turn === 0 ? 1 : -1;
  animal.position.x += direction * 0.25 * move;
  animal.rotation.y += direction * 0.12;
  setTimeout(() => {
    animal.rotation.y = 0;
  }, 450);

  // A little hop
  animal.position.y = animal.userData.baseY + 0.25;
  setTimeout(() => {
    animal.position.y = animal.userData.baseY;
  }, 200);
}

// ---------- UI rendering ----------
function renderProgress() {
  const track = $('progressTrack');
  track.innerHTML = '';
  for (let i = 0; i <= state.target; i++) {
    const s = document.createElement('div');
    s.className =
      'progress-step' +
      (i < state.total ? ' done' : '') +
      (i === state.total ? ' current' : '');
    s.title = String(i);
    track.appendChild(s);
  }
}

function renderMoves() {
  const box = $('moveButtons');
  box.innerHTML = '';
  state.moves.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'move-btn';
    b.textContent = '+' + m;
    b.disabled =
      !canMove(m) || (state.turn === 1 && state.opponent !== 'two');
    b.addEventListener('click', () => playMove(m));
    box.appendChild(b);
  });
}

function renderHistory() {
  const box = $('historyList');
  if (!state.history.length) {
    box.innerHTML =
      '<div class="empty-history">Your moves will appear here.</div>';
    return;
  }
  box.innerHTML = '';
  state.history
    .slice(-12)
    .reverse()
    .forEach((h) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<span>${h.computer ? '🐯' : '👤'}</span><span>${h.player}</span><span class="move-dot">+${h.amount}</span><strong>${h.total}</strong>`;
      box.appendChild(div);
    });
}

function render() {
  $('total').textContent = state.total;
  $('targetDisplay').textContent = state.target;
  $('targetTitle').textContent = state.target;

  $('modeTitle').textContent =
    state.opponent === 'two'
      ? '2 Player Game'
      : state.opponent === 'easy'
        ? 'Play vs Friendly Elephant'
        : 'Play vs Smart Tiger';

  $('turnLabel').textContent = state.gameOver
    ? 'Game finished'
    : state.busy
      ? 'Tiger is thinking…'
      : `${playerName(state.turn)}'s turn`;

  $('turnSub').textContent = state.gameOver
    ? 'Press New Game to play again'
    : state.busy
      ? 'Choose a move carefully…'
      : 'Click a glowing stone or a move button';

  $('turnAvatar').textContent =
    state.turn === 0
      ? '🐘'
      : state.opponent === 'two'
        ? '🐯'
        : state.opponent === 'easy'
          ? '🐘'
          : '🐯';

  $('turnChip').textContent = state.gameOver
    ? 'FINISHED'
    : state.turn === 0
      ? 'YOUR TURN'
      : state.opponent === 'two'
        ? 'PLAYER 2'
        : 'COMPUTER';

  $('turnChip').style.background =
    state.turn === 0 ? '#ddf1df' : '#e4efff';
  $('turnChip').style.color =
    state.turn === 0 ? '#2b8150' : '#2c629a';

  renderProgress();
  renderMoves();
  renderHistory();
  updatePathVisuals();

  $('undoBtn').disabled = !state.snapshots.length || state.busy;
}

// ---------- New game ----------
function newGame(start = 0, challenge = null) {
  state.total = start;
  state.startingTotal = start;
  state.turn = 0;
  state.history = [];
  state.snapshots = [];
  state.gameOver = false;
  state.busy = false;
  state.currentChallenge = challenge;
  state.hintCount = 0;

  sceneHost.querySelector('.win-overlay')?.remove();
  $('hintText').hidden = true;
  $('hintText').textContent = '';
  $('characterName').textContent = 'Jungle friends';
  $('characterMood').textContent = 'Ready to play?';
  $('sceneTip').textContent = challenge
    ? `Challenge starts at ${start}`
    : 'Your adventure begins!';

  setCameraMode(0);
  buildNumberPath();
  render();

  if (start >= state.target) {
    showToast('Choose a starting total below the target.');
  }
}

// ---------- Undo ----------
function undo() {
  const snap = state.snapshots.pop();
  if (!snap) return;
  state.total = snap.total;
  state.turn = snap.turn;
  state.history = snap.history;
  state.gameOver = snap.gameOver;
  state.busy = false;
  sceneHost.querySelector('.win-overlay')?.remove();
  $('hintText').hidden = true;
  setCameraMode(0);
  render();
  updatePathVisuals();
  showToast('Last move undone');
}

// ---------- Hint ----------
function showHint() {
  if (state.gameOver) {
    $('hintText').hidden = false;
    $('hintText').textContent =
      'Start a new game to receive a strategy hint.';
    return;
  }
  const good = winningMoves(state.total, state.target, state.moves);
  let text;
  if (!good.length) {
    text =
      'This position is tricky! No move can guarantee a win against perfect play. Try a move and observe what your opponent can do.';
  } else if (state.opponent === 'two') {
    text = `Try move +${good[0]}. This can leave your opponent in a position where every move gives you a response. Can you test it?`;
  } else {
    text = `A strong move to explore is +${good[0]}. Can you see what totals your opponent could reach next?`;
  }
  $('hintText').hidden = false;
  $('hintText').textContent = '💡 ' + text;
  state.hintCount++;

  // Highlight the suggested stone
  const suggestedNumber = state.total + good[0];
  const suggestedStone = pathStones.find(
    (p) => p.number === suggestedNumber
  );
  if (suggestedStone) {
    suggestedStone.stone.material.emissiveIntensity = 1.4;
    setTimeout(() => {
      updatePathVisuals();
    }, 1800);
  }
}

// ---------- Reveal strategy ----------
function revealStrategy() {
  const target = state.target;
  const m = state.moves;
  const losing = [];
  for (let p = 0; p < target; p++) {
    if (!isWinning(p, target, m)) losing.push(p);
  }

  const ex = $('strategyExplanation');
  ex.hidden = false;
  ex.className = 'strategy-explanation';
  ex.innerHTML = `<strong>Teacher strategy note:</strong> For this target and move set, positions that are losing for the player to move are <strong>${losing.join(', ')}</strong>. Try to leave your opponent on one of these totals. Now replay and test whether this pattern works.`;

  $('strategySteps').innerHTML =
    losing
      .slice(0, 4)
      .map((n) => `<span class="strategy-number">${n}</span>`)
      .join('<span class="strategy-arrow">→</span>') +
    `<span class="strategy-number">${target}</span>`;
}

// ---------- Settings ----------
function applySettings() {
  const target = Math.max(
    3,
    Math.min(100, parseInt($('targetInput').value) || 10)
  );
  const moves = $('movesSelect')
    .value.split(',')
    .map(Number)
    .filter((n) => n > 0 && Number.isInteger(n));
  const opp = $('opponentSelect').value;
  let start = Math.max(0, parseInt($('startInput').value) || 0);
  if (start >= target) start = 0;

  state.target = target;
  state.moves = moves.length ? moves : [1, 2];
  state.opponent = opp;

  newGame(start);
  $('strategyExplanation').hidden = true;
}

function setChallenge(start) {
  state.target = 10;
  state.moves = [1, 2];
  state.opponent = 'smart';

  $('targetInput').value = 10;
  $('movesSelect').value = '1,2';
  $('opponentSelect').value = 'smart';
  $('startInput').value = start;

  newGame(start, `textbook-${start}`);
  showToast(`Textbook challenge: start at ${start}`);
}

// ---------- Sound ----------
function playTone(freq = 520, duration = 0.08) {
  if (!soundOn) return;
  try {
    audioCtx =
      audioCtx ||
      new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============================================================
// EVENT WIRING
// ============================================================

$('newGameBtn').addEventListener('click', () =>
  newGame(state.startingTotal)
);
$('undoBtn').addEventListener('click', undo);
$('hintBtn').addEventListener('click', showHint);
$('strategyReveal').addEventListener('click', revealStrategy);
$('applySettings').addEventListener('click', applySettings);
$('cameraBtn').addEventListener('click', cycleCamera);

$('soundBtn').addEventListener('click', () => {
  soundOn = !soundOn;
  $('soundBtn').textContent = soundOn ? '🔊 Sound' : '🔇 Sound';
  $('soundBtn').setAttribute('aria-pressed', String(soundOn));
  showToast(soundOn ? 'Sound enabled' : 'Sound muted');
});

$('helpBtn').addEventListener('click', () => {
  $('modalTitle').textContent = 'How to play NIM Jungle';
  $('modal').hidden = false;
});

$('closeModal').addEventListener('click', () => {
  $('modal').hidden = true;
});
$('modalOkay').addEventListener('click', () => {
  $('modal').hidden = true;
});
$('modal').addEventListener('click', (e) => {
  if (e.target === $('modal')) $('modal').hidden = true;
});

document.querySelectorAll('[data-start]').forEach((b) =>
  b.addEventListener('click', () =>
    setChallenge(parseInt(b.dataset.start))
  )
);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'h') {
    showHint();
  } else if (key === 'u') {
    undo();
  } else if (key === 'n') {
    newGame(state.startingTotal);
  } else if (key === 'r') {
    cycleCamera();
  } else if (/[1-4]/.test(key)) {
    const m = parseInt(key);
    if (state.moves.includes(m) && canMove(m)) {
      playMove(m);
    }
  }
});

// ---------- Initialise ----------
audioCtx = null;
newGame(0);
$('strategyExplanation').hidden = true;