// ============================================================
//  FIRST AID RUSH! — a tiny mall dash
//  Push the wheelchair through the crowd, reach the First Aid room.
// ============================================================
import * as THREE from 'three';

// ---------------- config ----------------
const LANE_HALF = 4.1;          // playable half-width
const WALL_X = 6.4;             // wall position
const CHUNK_LEN = 34;
const NUM_CHUNKS = 7;
const COLLIDER_R = 0.52;        // player collision radius (at wheelchair)

const PAL = {
  fog: 0xf2ece3,
  floor: '#eae5dd',
  wall: 0xf6f1e8,
  wainscot: '#b6bbb1',
  trim: 0xc9a86a,
  awnings: [0xf2a48f, 0x9fd0b6, 0xf5d789, 0xa9cfe8, 0xc5b3e0, 0xf0b8c4],
  shirts: [0xe8dfd2, 0x92aec4, 0xd88f7a, 0x8fb996, 0xe3c26b, 0xb797c9, 0x6f7d8c, 0xf0e6e6, 0x5b6770],
  pants: [0x5b6770, 0x8a94a0, 0xcfc4b2, 0x4a4a52, 0xa88d6f, 0x707a68],
  skins: [0xe8b58e, 0xd9a077, 0xc98b62, 0xf0c8a6],
  hairs: [0x3a2e26, 0x171310, 0x6b4a2f, 0x8a8a8a, 0x4a3b45],
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// ---------------- renderer / scene ----------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAL.fog);
scene.fog = new THREE.Fog(PAL.fog, 26, 95);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 220);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// lights
const hemi = new THREE.HemisphereLight(0xfff6e8, 0xcfc2ae, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffeed4, 1.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -16; sun.shadow.camera.right = 16;
sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -22;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// ---------------- canvas textures ----------------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(x, w, h, bg, colors, n, rMin, rMax) {
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    x.fillStyle = pick(colors);
    x.globalAlpha = rand(0.5, 1);
    x.beginPath();
    const r = rand(rMin, rMax);
    const px = Math.random() * w, py = Math.random() * h;
    x.ellipse(px, py, r, r * rand(0.6, 1), rand(0, 3.2), 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;
}

const floorTex = canvasTex(512, 512, (x, w, h) => {
  speckle(x, w, h, PAL.floor, ['#cdc7bd', '#b3ada3', '#dcd6cc', '#a09a90', '#c2bbaf'], 260, 2, 9);
  for (let i = 0; i < 18; i++) { // a few big terrazzo chips
    x.fillStyle = pick(['#b7b1a6', '#98928a', '#d5cfc5']);
    x.beginPath();
    x.ellipse(Math.random() * w, Math.random() * h, rand(9, 18), rand(6, 13), rand(0, 3), 0, 7);
    x.fill();
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(4, 10);

const wainscotTex = canvasTex(256, 128, (x, w, h) =>
  speckle(x, w, h, PAL.wainscot, ['#a3a89e', '#cdd2c8', '#8d9288', '#e0e4da'], 420, 1, 3));
wainscotTex.wrapS = THREE.RepeatWrapping;
wainscotTex.repeat.set(10, 1);

// botanical mural (dandelions + butterfly), like the mall wall in the video
function muralTex() {
  return canvasTex(1024, 400, (x, w, h) => {
    x.fillStyle = '#f7f2e8'; x.fillRect(0, 0, w, h);
    const cols = ['#8a9678', '#a9b294', '#d9a441', '#9fb6c4'];
    for (let d = 0; d < 6; d++) {
      const bx = 80 + d * 165 + rand(-25, 25), col = pick(cols);
      const top = rand(60, 130), r = rand(28, 48);
      x.strokeStyle = col; x.lineWidth = 3;
      x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + rand(-28, 28), (top + h) / 2, bx, top + r); x.stroke();
      x.lineWidth = 1.6;
      for (let i = 0; i < 26; i++) { // dandelion head
        const a = (i / 26) * Math.PI * 2;
        x.beginPath(); x.moveTo(bx, top + r);
        x.lineTo(bx + Math.cos(a) * r, top + r + Math.sin(a) * r); x.stroke();
        x.beginPath(); x.arc(bx + Math.cos(a) * r, top + r + Math.sin(a) * r, 2.2, 0, 7); x.stroke();
      }
      for (let l = 0; l < 3; l++) { // little leaves
        const ly = rand(h * 0.6, h * 0.95);
        x.beginPath(); x.moveTo(bx, ly);
        x.quadraticCurveTo(bx + rand(-40, 40), ly - 18, bx + rand(-55, 55), ly - rand(4, 20)); x.stroke();
      }
    }
    // butterfly
    const bx = rand(150, 850), by = rand(50, 120);
    x.fillStyle = '#d9a441cc';
    x.beginPath(); x.ellipse(bx - 8, by, 11, 7, -0.5, 0, 7); x.fill();
    x.beginPath(); x.ellipse(bx + 8, by, 11, 7, 0.5, 0, 7); x.fill();
    x.fillStyle = '#6b6157';
    x.beginPath(); x.ellipse(bx, by + 2, 2.5, 8, 0, 0, 7); x.fill();
  });
}

function signTex(text, bg, fg = '#ffffff') {
  return canvasTex(256, 128, (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#ffffffbb'; x.lineWidth = 6;
    x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = fg;
    x.font = 'bold 52px "Baloo 2", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, w / 2, h / 2 + 2);
  });
}

const firstAidTex = canvasTex(512, 192, (x, w, h) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#e2574c';
  const cx = 92, cy = h / 2, a = 26, b = 62; // red cross
  x.fillRect(cx - a, cy - b, a * 2, b * 2);
  x.fillRect(cx - b, cy - a, b * 2, a * 2);
  x.font = 'bold 64px "Baloo 2", sans-serif';
  x.textAlign = 'left'; x.textBaseline = 'middle';
  x.fillStyle = '#e2574c';
  x.fillText('FIRST AID', 175, cy);
});

// ---------------- material / geometry caches ----------------
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
}
const G = {
  head: new THREE.SphereGeometry(0.185, 20, 16),
  hairCap: new THREE.SphereGeometry(0.21, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
  torso: new THREE.CapsuleGeometry(0.19, 0.34, 6, 12),
  arm: new THREE.CapsuleGeometry(0.06, 0.36, 4, 10),
  leg: new THREE.CapsuleGeometry(0.075, 0.6, 4, 10),
  wideLeg: new THREE.CapsuleGeometry(0.105, 0.55, 4, 10),
  shoe: new THREE.BoxGeometry(0.14, 0.09, 0.28),
  skirt: new THREE.ConeGeometry(0.35, 0.62, 14, 1, true),
  hand: new THREE.SphereGeometry(0.055, 8, 6),
  eye: new THREE.SphereGeometry(0.021, 8, 6),
  blush: new THREE.SphereGeometry(0.02, 6, 4),
  smile: new THREE.TorusGeometry(0.036, 0.009, 6, 10, Math.PI),
  neck: new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10),
  backHair: new THREE.SphereGeometry(0.17, 14, 10),
  sideLock: new THREE.CapsuleGeometry(0.045, 0.26, 4, 8),
};

// eyes / brows / smile / blush attached to a head mesh. rot=PI for figures
// built facing -Z. happyEyes = closed ghibli smile-eyes.
function addFace(head, o = {}) {
  const f = new THREE.Group();
  const eyeM = mat(0x2b2118);
  const browM = mat(o.hair ?? 0x3a2e26);
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(G.eye, eyeM);
    e.position.set(sx * 0.063, 0.012, 0.157);
    if (o.happyEyes) { e.scale.set(1.3, 0.35, 0.5); e.position.y = 0.03; }
    f.add(e);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.011, 0.012), browM);
    brow.position.set(sx * 0.063, 0.082, 0.158);
    brow.rotation.z = sx * -0.18;
    f.add(brow);
    const blush = new THREE.Mesh(G.blush, mat(0xeb9d84));
    blush.position.set(sx * 0.108, -0.038, 0.125);
    blush.scale.set(1.25, 0.65, 0.4);
    f.add(blush);
  }
  const smile = new THREE.Mesh(G.smile, mat(0x9c5241));
  smile.position.set(0, -0.028, 0.152);
  smile.rotation.z = Math.PI; // arc ends turn up
  smile.scale.set(o.bigSmile ? 1.3 : 1, o.bigSmile ? 1.15 : 0.8, 0.5);
  f.add(smile);
  if (o.rot) f.rotation.y = o.rot;
  head.add(f);
  return f;
}

function box(wd, ht, dp, m, x = 0, y = 0, z = 0, shadow = true) {
  const ms = new THREE.Mesh(new THREE.BoxGeometry(wd, ht, dp), m);
  ms.position.set(x, y, z);
  ms.castShadow = shadow;
  return ms;
}

// ---------------- people factory ----------------
// Persons are built facing +Z. Returns rig with limb pivots for walk anim.
function makePerson(o = {}) {
  const g = new THREE.Group();
  const skinM = mat(o.skin ?? pick(PAL.skins));
  const shirtM = mat(o.shirt ?? pick(PAL.shirts));
  const hairM = mat(o.hair ?? pick(PAL.hairs));

  const mkLeg = (sx) => {
    const p = new THREE.Group();
    p.position.set(sx * 0.1, 0.92, 0);
    const legM = o.skirt ? skinM : mat(o.pants ?? pick(PAL.pants));
    const l = new THREE.Mesh(o.widePants ? G.wideLeg : G.leg, legM);
    l.position.y = -0.42; l.castShadow = true;
    const s = new THREE.Mesh(G.shoe, mat(o.shoes ?? 0x4a4640));
    s.position.set(0, -0.86, 0.05); s.castShadow = true;
    p.add(l, s);
    return p;
  };
  const mkArm = (sx) => {
    const p = new THREE.Group();
    p.position.set(sx * 0.26, 1.5, 0);
    const a = new THREE.Mesh(G.arm, o.bareArms ? skinM : shirtM);
    a.position.y = -0.22; a.castShadow = true;
    const h = new THREE.Mesh(G.hand, skinM);
    h.position.y = -0.46;
    p.add(a, h);
    p.rotation.z = sx * -0.07; // arms rest slightly outward
    return p;
  };

  const legL = mkLeg(-1), legR = mkLeg(1), armL = mkArm(-1), armR = mkArm(1);

  const torso = new THREE.Mesh(G.torso, shirtM);
  torso.position.y = 1.27; torso.scale.set(1.1, 1, 0.82);
  torso.castShadow = true;

  const neck = new THREE.Mesh(G.neck, skinM);
  neck.position.y = 1.6;

  const head = new THREE.Mesh(G.head, skinM);
  head.position.y = 1.78; head.scale.set(1, 1.05, 0.97);
  head.castShadow = true;
  addFace(head, { hair: o.hair, happyEyes: o.happyEyes ?? Math.random() < 0.3 });

  const hair = new THREE.Mesh(G.hairCap, hairM);
  hair.position.set(0, 1.81, -0.015);
  g.add(legL, legR, armL, armR, torso, neck, head, hair);

  if (o.longHair) {
    const back = new THREE.Mesh(G.backHair, hairM);
    back.position.set(0, 1.62, -0.14); // behind the head (persons face +Z)
    back.scale.set(1.02, 1.55, 0.55);
    back.castShadow = true;
    g.add(back);
    for (const sx of [-1, 1]) { // loose strands framing the face
      const lock = new THREE.Mesh(G.sideLock, hairM);
      lock.position.set(sx * 0.175, 1.6, 0.03);
      lock.rotation.z = sx * 0.1;
      g.add(lock);
    }
  }
  if (o.skirt) {
    const sk = new THREE.Mesh(G.skirt, o.skirtMat ?? mat(0x39456b));
    sk.position.y = 0.98; sk.castShadow = true;
    g.add(sk);
  }
  return { g, legL, legR, armL, armR, head };
}

function walkPose(p, phase, amp = 0.55) {
  p.legL.rotation.x = Math.sin(phase) * amp;
  p.legR.rotation.x = Math.sin(phase + Math.PI) * amp;
  p.armL.rotation.x = Math.sin(phase + Math.PI) * amp * 0.8;
  p.armR.rotation.x = Math.sin(phase) * amp * 0.8;
}

// floral skirt like the friend in the video (navy + daisies)
const floralMat = new THREE.MeshLambertMaterial({
  map: canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#333f63'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const fx = Math.random() * w, fy = Math.random() * h, r = rand(7, 12);
      const petal = Math.random() < 0.65 ? '#efe6d2' : '#7da3d8';
      const heart = petal === '#efe6d2' ? '#5c85c9' : '#efe6d2';
      x.fillStyle = petal;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        x.beginPath(); x.ellipse(fx + Math.cos(a) * r, fy + Math.sin(a) * r, r * 0.62, r * 0.42, a, 0, 7); x.fill();
      }
      x.fillStyle = heart;
      x.beginPath(); x.arc(fx, fy, r * 0.4, 0, 7); x.fill();
    }
  }),
});

// ---------------- the player: lady + wheelchair + guy ----------------
const player = { x: 0, z: 0, xv: 0, group: null, lady: null, wheels: [], guyArm: null, phase: 0 };

function buildPlayer() {
  const root = new THREE.Group();

  // --- lady from the video: black tank, cream wide pants, tote bag ---
  const lady = makePerson({
    skin: 0xe0aa82, shirt: 0x2b2b30, hair: 0x38281c,
    bareArms: true, widePants: true, pants: 0xe3d9c2,
    shoes: 0xeae4d8, longHair: true, happyEyes: false, bigSmile: true,
  });
  lady.g.rotation.y = Math.PI; // face -Z
  // white cross straps on her back (crossback top detail)
  const strapM = mat(0xf2f0ea);
  const s1 = box(0.03, 0.34, 0.012, strapM, 0.07, 1.42, 0.165);
  const s2 = box(0.03, 0.34, 0.012, strapM, -0.07, 1.42, 0.165);
  s1.rotation.z = 0.45; s2.rotation.z = -0.45;
  s1.rotation.y = Math.PI; s2.rotation.y = Math.PI;
  root.add(s1, s2);
  // arms reach the handles
  lady.armL.rotation.x = -1.12; lady.armR.rotation.x = -1.12;
  // canvas tote with teddy charm
  const tote = new THREE.Group();
  const bag = box(0.13, 0.34, 0.3, mat(0xe4dcc8), 0, 0, 0);
  const strap = box(0.03, 0.42, 0.02, mat(0xd8cfb8), 0, 0.36, 0.1);
  strap.rotation.x = 0.25;
  const teddy = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(0x9a6b42));
  teddy.position.set(0.02, 0.2, -0.14);
  const earG = new THREE.SphereGeometry(0.02, 6, 5);
  const e1 = new THREE.Mesh(earG, mat(0x9a6b42)); e1.position.set(-0.02, 0.245, -0.155);
  const e2 = new THREE.Mesh(earG, mat(0x9a6b42)); e2.position.set(0.06, 0.245, -0.155);
  tote.add(bag, strap, teddy, e1, e2);
  tote.position.set(0.38, 1.05, 0.05);
  root.add(lady.g, tote);

  // --- wheelchair (dark, facing -Z; backrest toward lady) ---
  const wc = new THREE.Group();
  wc.position.z = -1.5;
  const frameM = mat(0x2e2e33);
  const seatM = mat(0x1e1e22);
  wc.add(box(0.6, 0.07, 0.52, seatM, 0, 0.53, 0));
  const backrest = box(0.6, 0.5, 0.06, seatM, 0, 0.86, 0.27);
  backrest.rotation.x = -0.12;
  wc.add(backrest);
  // armrests + frame rails
  wc.add(box(0.05, 0.05, 0.5, frameM, -0.33, 0.72, 0));
  wc.add(box(0.05, 0.05, 0.5, frameM, 0.33, 0.72, 0));
  wc.add(box(0.05, 0.24, 0.05, frameM, -0.33, 0.62, 0.2));
  wc.add(box(0.05, 0.24, 0.05, frameM, 0.33, 0.62, 0.2));
  // handles
  for (const sx of [-1, 1]) {
    const h = box(0.045, 0.42, 0.045, frameM, sx * 0.29, 1.08, 0.33);
    h.rotation.x = 0.35;
    wc.add(h);
    const grip = box(0.055, 0.12, 0.055, mat(0x111114), sx * 0.29, 1.26, 0.255);
    grip.rotation.x = 0.35;
    wc.add(grip);
  }
  // big rear wheels with spokes (rear = +Z side, near the pusher)
  const wheelGeo = new THREE.TorusGeometry(0.31, 0.045, 10, 26);
  const spokeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.56, 6);
  const rimM = mat(0x26262b);
  for (const sx of [-1, 1]) {
    const wheel = new THREE.Group();
    wheel.position.set(sx * 0.36, 0.32, 0.12);
    wheel.rotation.y = Math.PI / 2;
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, rimM); tire.castShadow = true;
    spin.add(tire);
    for (let k = 0; k < 3; k++) {
      const sp = new THREE.Mesh(spokeGeo, mat(0x8a8a92));
      sp.rotation.z = (k / 3) * Math.PI;
      spin.add(sp);
    }
    // hand rim
    const hr = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 22), mat(0x9c9ca6));
    spin.add(hr);
    wheel.add(spin);
    wheel.userData.spin = spin;
    player.wheels.push(wheel);
    wc.add(wheel);
  }
  // front casters
  for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), rimM);
    c.rotation.z = Math.PI / 2;
    c.position.set(sx * 0.27, 0.09, -0.24);
    c.castShadow = true;
    wc.add(c, box(0.04, 0.2, 0.04, frameM, sx * 0.27, 0.24, -0.24));
  }
  // footrest
  wc.add(box(0.5, 0.04, 0.16, frameM, 0, 0.16, -0.42));

  // --- the guy (per reference): bald, dark beard, black v-neck tee,
  //     hugging the navy backpack on his lap, sandals ---
  const guy = new THREE.Group();
  guy.position.x = 0.09; // peek out from behind the pusher
  guy.rotation.z = -0.06;
  const gSkin = mat(0xdca87e);
  const gShirt = mat(0x25262c);
  const torso = new THREE.Mesh(G.torso, gShirt);
  torso.position.set(0, 0.98, 0.05);
  torso.scale.set(1.35, 1.05, 1.05); // broad build
  torso.castShadow = true;
  const neck = new THREE.Mesh(G.neck, gSkin);
  neck.position.set(0, 1.32, 0.03); neck.scale.setScalar(1.25);
  const head = new THREE.Mesh(G.head, gSkin);
  head.position.set(0, 1.5, 0.02); head.scale.set(1.08, 1.1, 1.02);
  head.castShadow = true;
  addFace(head, { rot: Math.PI, hair: 0x352a22, bigSmile: true }); // he faces -Z
  // dark beard: jaw patch + mustache + brow shadow (bald head, no hair cap)
  const beardM = mat(0x3a2e26);
  const beard = new THREE.Mesh(G.backHair, beardM);
  beard.position.set(0, 1.36, -0.09);
  beard.scale.set(0.8, 0.55, 0.66);
  const stache = box(0.11, 0.026, 0.02, beardM, 0, 1.472, -0.192, false);
  guy.add(torso, neck, head, beard, stache);
  // seated legs: dark pants + sandals on the footrest
  const thighM = mat(0x424653);
  for (const sx of [-1, 1]) {
    guy.add(box(0.16, 0.16, 0.42, thighM, sx * 0.13, 0.62, -0.16));
    guy.add(box(0.14, 0.42, 0.15, thighM, sx * 0.13, 0.38, -0.37));
    const sandal = box(0.14, 0.045, 0.28, mat(0x4a4038), sx * 0.13, 0.15, -0.42);
    const strap = box(0.15, 0.03, 0.06, mat(0x5c5248), sx * 0.13, 0.185, -0.44, false);
    const toes = new THREE.Mesh(G.hand, gSkin);
    toes.position.set(sx * 0.13, 0.185, -0.52);
    toes.scale.set(1.1, 0.5, 0.9);
    guy.add(sandal, strap, toes);
  }
  // navy backpack hugged on the lap (one hand stuck INSIDE it)
  const pack = new THREE.Group();
  pack.position.set(0, 0.92, -0.26);
  const packBody = box(0.4, 0.34, 0.22, mat(0x3d4a66));
  const packFlap = box(0.34, 0.14, 0.2, mat(0x4d5c7e), 0, 0.2, 0);
  const packPocket = box(0.26, 0.16, 0.05, mat(0x4d5c7e), 0, -0.05, -0.13);
  const packStrap = box(0.05, 0.3, 0.03, mat(0x2c3550), -0.14, 0, 0.12);
  const packStrap2 = box(0.05, 0.3, 0.03, mat(0x2c3550), 0.14, 0, 0.12);
  pack.add(packBody, packFlap, packPocket, packStrap, packStrap2);
  guy.add(pack);
  // arms wrapping around the pack
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(G.arm, gShirt);
    arm.position.set(sx * 0.27, 1.05, -0.15);
    arm.rotation.x = -1.15;
    arm.rotation.z = sx * -0.26;
    arm.scale.setScalar(1.15);
    arm.castShadow = true;
    guy.add(arm);
  }
  // left hand grips the side; right hand is swallowed by the pack
  const handL = new THREE.Mesh(G.hand, gSkin);
  handL.position.set(-0.24, 0.98, -0.34); handL.scale.setScalar(1.3);
  const handR = new THREE.Mesh(G.hand, gSkin);
  handR.position.set(0.13, 1.13, -0.28); handR.scale.setScalar(1.2); // wrist in the flap
  guy.add(handL, handR);
  player.guyArm = pack; // wiggles as he struggles with it
  wc.add(guy);

  root.add(wc);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  player.group = root;
  player.lady = lady;
  scene.add(root);
}
buildPlayer();

// ---------------- world chunks ----------------
const chunkGroups = [];
const shopNames = ['カフェ', 'BOOKS', 'パン屋', 'FLOWERS', 'お茶', 'MARKET', 'くだもの', 'BAKERY', 'TOYS', '甘味'];
const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
const wallMat = mat(PAL.wall);
const wainscotMat = new THREE.MeshLambertMaterial({ map: wainscotTex });
const trimMat = mat(PAL.trim);
const ceilMat = mat(0xf2ede4, { emissive: 0x746e64 });
const skylightMat = new THREE.MeshBasicMaterial({ color: 0xfff8ea });

function buildChunk(i) {
  const g = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WALL_X * 2 + 4, CHUNK_LEN), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -CHUNK_LEN / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // pale runner carpet down the middle
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(4.6, CHUNK_LEN), mat(0xdde7dc));
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.012, -CHUNK_LEN / 2);
  runner.receiveShadow = true;
  const edgeL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, CHUNK_LEN), mat(0xb9cbb8));
  edgeL.rotation.x = -Math.PI / 2;
  edgeL.position.set(-2.3, 0.013, -CHUNK_LEN / 2);
  const edgeR = edgeL.clone();
  edgeR.position.x = 2.3;
  g.add(runner, edgeL, edgeR);

  // ceiling + warm skylight strips
  const ceil = box(WALL_X * 2 + 4, 0.3, CHUNK_LEN, ceilMat, 0, 7.2, -CHUNK_LEN / 2, false);
  g.add(ceil);
  for (let s = 0; s < 3; s++) {
    const sl = box(5.5, 0.1, 1.6, skylightMat, 0, 7.02, -6 - s * 11, false);
    g.add(sl);
  }

  for (const side of [-1, 1]) {
    // wall: wainscot bottom + white panels above + gold trim line
    const wains = box(0.3, 1.1, CHUNK_LEN, wainscotMat, side * WALL_X, 0.55, -CHUNK_LEN / 2, false);
    wains.receiveShadow = true;
    const upper = box(0.3, 6.1, CHUNK_LEN, wallMat, side * WALL_X, 1.1 + 3.05, -CHUNK_LEN / 2, false);
    upper.receiveShadow = true;
    const trim = box(0.34, 0.07, CHUNK_LEN, trimMat, side * WALL_X, 1.13, -CHUNK_LEN / 2, false);
    g.add(wains, upper, trim);

    // columns
    for (const cz of [-2, -CHUNK_LEN + 2]) {
      const col = box(0.7, 7.2, 0.7, mat(0xefe9df), side * (WALL_X - 0.25), 3.6, cz);
      col.castShadow = true; col.receiveShadow = true;
      g.add(col, box(0.85, 0.5, 0.85, mat(0xe2dbce), side * (WALL_X - 0.25), 0.25, cz));
    }

    // either a mural wall or shopfronts
    if (Math.random() < 0.35) {
      const mur = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.4), new THREE.MeshLambertMaterial({ map: muralTex() }));
      mur.position.set(side * (WALL_X - 0.16), 3.0, -CHUNK_LEN / 2);
      mur.rotation.y = -side * Math.PI / 2;
      g.add(mur);
    } else {
      for (let s = 0; s < 2; s++) {
        const sz = -7 - s * 16 + rand(-2, 2);
        const aw = pick(PAL.awnings);
        // storefront glass band
        const front = box(0.15, 2.3, 6, mat(0xbcd3d8, { emissive: 0x2a3436 }), side * (WALL_X - 0.2), 1.25 + 1.15, sz, false);
        g.add(front);
        // awning
        const awn = box(0.9, 0.08, 6.4, mat(aw), side * (WALL_X - 0.55), 3.4, sz);
        awn.rotation.z = side * 0.28;
        awn.castShadow = true;
        g.add(awn);
        // hanging sign
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.8),
          new THREE.MeshLambertMaterial({ map: signTex(pick(shopNames), '#' + new THREE.Color(aw).getHexString()) }));
        sign.position.set(side * (WALL_X - 0.75), 4.4, sz);
        g.add(sign, box(0.03, 0.5, 0.03, trimMat, side * (WALL_X - 0.75), 5.1, sz, false));
      }
    }
  }

  // occasional hanging directional sign over the walkway
  if (i % 2 === 0) {
    const hang = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 0.08),
      new THREE.MeshLambertMaterial({ map: signTex('✚ FIRST AID →', '#7cc4a0') }));
    hang.position.set(rand(-2, 2), 5.6, -CHUNK_LEN / 2);
    g.add(hang,
      box(0.04, 0.8, 0.04, trimMat, hang.position.x - 1.2, 6.4, -CHUNK_LEN / 2, false),
      box(0.04, 0.8, 0.04, trimMat, hang.position.x + 1.2, 6.4, -CHUNK_LEN / 2, false));
  }

  scene.add(g);
  return g;
}

for (let i = 0; i < NUM_CHUNKS; i++) {
  const g = buildChunk(i);
  g.position.z = -i * CHUNK_LEN + CHUNK_LEN;
  chunkGroups.push(g);
}
function recycleChunks() {
  for (const g of chunkGroups) {
    if (g.position.z > player.z + CHUNK_LEN * 1.5) {
      g.position.z -= CHUNK_LEN * NUM_CHUNKS;
    }
  }
}

// ---------------- entities (obstacles + pickups) ----------------
const entities = [];

function makeBench() {
  const g = new THREE.Group();
  const wood = mat(0xc8a06a);
  g.add(box(2.0, 0.09, 0.55, wood, 0, 0.45, 0));
  g.add(box(2.0, 0.09, 0.12, wood, 0, 0.44, -0.36));
  g.add(box(0.12, 0.44, 0.5, mat(0x8a8a92), -0.85, 0.22, 0));
  g.add(box(0.12, 0.44, 0.5, mat(0x8a8a92), 0.85, 0.22, 0));
  return { g, r: 1.05 };
}
function makePlanter() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.5, 12), mat(0xd8d2c6));
  pot.position.y = 0.25; pot.castShadow = true;
  g.add(pot);
  for (let k = 0; k < 3; k++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(rand(0.22, 0.34), 10, 8), mat(pick([0x7fae7a, 0x6c9a68, 0x8fbc8a])));
    leaf.position.set(rand(-0.15, 0.15), rand(0.6, 0.95), rand(-0.15, 0.15));
    leaf.castShadow = true;
    g.add(leaf);
  }
  return { g, r: 0.52 };
}
function makeSignBoard() {
  const g = new THREE.Group();
  const ym = mat(0xf5c842);
  const p1 = box(0.5, 0.7, 0.03, ym, 0, 0.35, 0.12); p1.rotation.x = -0.3;
  const p2 = box(0.5, 0.7, 0.03, ym, 0, 0.35, -0.12); p2.rotation.x = 0.3;
  const excl = box(0.08, 0.3, 0.02, mat(0x4a4238), 0, 0.42, 0.235); excl.rotation.x = -0.3;
  g.add(p1, p2, excl);
  return { g, r: 0.42 };
}
function makeKiosk() {
  const g = new THREE.Group();
  const c = pick(PAL.awnings);
  g.add(box(1.5, 1.0, 0.9, mat(0xf3ede2), 0, 0.5, 0));
  g.add(box(1.6, 0.12, 1.0, mat(c), 0, 1.05, 0));
  const roof = box(1.7, 0.07, 1.15, mat(c), 0, 2.0, 0);
  g.add(roof);
  g.add(box(0.07, 0.9, 0.07, mat(0x8a8a92), -0.72, 1.55, 0.42));
  g.add(box(0.07, 0.9, 0.07, mat(0x8a8a92), 0.72, 1.55, 0.42));
  g.add(box(0.07, 0.9, 0.07, mat(0x8a8a92), -0.72, 1.55, -0.42));
  g.add(box(0.07, 0.9, 0.07, mat(0x8a8a92), 0.72, 1.55, -0.42));
  // little goods
  for (let k = 0; k < 4; k++) g.add(box(0.16, 0.16, 0.16, mat(pick(PAL.awnings)), rand(-0.5, 0.5), 1.19, rand(-0.25, 0.25)));
  return { g, r: 1.0 };
}
function makeRobot() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.24, 16), mat(0xe8e8ec));
  body.position.y = 0.14; body.castShadow = true;
  const eye = box(0.3, 0.06, 0.04, mat(0x54c0e8, { emissive: 0x2a6074 }), 0, 0.18, -0.4, false);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa04a }));
  light.position.y = 0.32;
  g.add(body, eye, light);
  return { g, r: 0.5 };
}

const eggGeo = new THREE.SphereGeometry(0.19, 14, 12);
eggGeo.scale(1, 1.3, 1);
const eggMat = mat(0xfff6ea, { emissive: 0x554d40 });
function makeEgg() {
  const g = new THREE.Group();
  const e = new THREE.Mesh(eggGeo, eggMat);
  e.castShadow = true;
  g.add(e);
  return { g, r: 0.6 };
}
function makeMedkit() {
  const g = new THREE.Group();
  const b = box(0.42, 0.3, 0.32, mat(0xffffff, { emissive: 0x3a3a3a }));
  b.position.y = 0.15;
  g.add(b);
  g.add(box(0.24, 0.07, 0.02, mat(0xe2574c), 0, 0.19, 0.17, false));
  g.add(box(0.07, 0.24, 0.02, mat(0xe2574c), 0, 0.19, 0.17, false));
  g.add(box(0.07, 0.02, 0.24, mat(0xe2574c), 0, 0.31, 0, false));
  g.add(box(0.24, 0.02, 0.07, mat(0xe2574c), 0, 0.31, 0, false));
  return { g, r: 0.62 };
}

function spawnEntity(type, x, z) {
  let built, e;
  switch (type) {
    case 'walker': case 'jogger': {
      const p = makePerson(Math.random() < 0.14
        ? { shirt: 0xf0ece2, skirt: true, skirtMat: floralMat, longHair: true, hair: 0x2c2018, bareArms: false, happyEyes: true } // the floral-skirt friend look
        : Math.random() < 0.3 ? { skirt: true } : {});
      built = { g: p.g, r: 0.48 };
      e = { person: p, vz: type === 'jogger' ? rand(3.4, 4.6) : rand(1.4, 2.4), vx: 0 };
      p.g.rotation.y = 0; // faces +Z, walking toward the player
      break;
    }
    case 'crosser': {
      const p = makePerson({});
      built = { g: p.g, r: 0.48 };
      const dir = Math.random() < 0.5 ? 1 : -1;
      e = { person: p, vx: dir * rand(1.6, 2.6), vz: 0 };
      break;
    }
    case 'stander': {
      const g = new THREE.Group();
      const p1 = makePerson({}), p2 = makePerson({ skirt: Math.random() < 0.5 });
      p1.g.position.x = -0.4; p1.g.rotation.y = rand(0.6, 1.4);
      p2.g.position.x = 0.4; p2.g.rotation.y = -rand(0.6, 1.4) + Math.PI;
      g.add(p1.g, p2.g);
      built = { g, r: 0.85 };
      e = { person: p1, person2: p2, vx: 0, vz: 0, idle: true };
      break;
    }
    case 'bench': built = makeBench(); e = {}; break;
    case 'planter': built = makePlanter(); e = {}; break;
    case 'sign': built = makeSignBoard(); e = {}; break;
    case 'kiosk': built = makeKiosk(); e = {}; break;
    case 'robot': {
      built = makeRobot();
      e = { vx: (Math.random() < 0.5 ? 1 : -1) * rand(0.8, 1.4), vz: 0, robot: true };
      break;
    }
    case 'egg': built = makeEgg(); e = { pickup: 'egg', spin: rand(2, 4) }; break;
    case 'medkit': built = makeMedkit(); e = { pickup: 'medkit', spin: 2.4 }; break;
  }
  built.g.position.set(x, 0, z);
  scene.add(built.g);
  entities.push({ type, g: built.g, r: built.r, x, z, phase: rand(0, 6), passed: false, ...e });
}

// ---------------- goal gate ----------------
let gate = null;
function spawnGate(z) {
  const g = new THREE.Group();
  const pillarM = mat(0xf0eadf);
  g.add(box(0.8, 4.6, 0.8, pillarM, -WALL_X + 1.2, 2.3, 0));
  g.add(box(0.8, 4.6, 0.8, pillarM, WALL_X - 1.2, 2.3, 0));
  const header = new THREE.Mesh(new THREE.BoxGeometry(WALL_X * 2 - 1.5, 1.5, 0.5),
    new THREE.MeshLambertMaterial({ map: firstAidTex }));
  header.position.y = 5.2;
  g.add(header);
  // little glowing cross on top
  const crossM = new THREE.MeshBasicMaterial({ color: 0xe2574c });
  g.add(box(0.5, 0.16, 0.16, crossM, 0, 6.3, 0, false));
  g.add(box(0.16, 0.5, 0.16, crossM, 0, 6.3, 0, false));
  g.position.z = z;
  scene.add(g);
  gate = { g, z };
}
function removeGate() { if (gate) { scene.remove(gate.g); gate = null; } }

// ---------------- particles ----------------
const particles = [];
const partGeo = new THREE.SphereGeometry(0.06, 6, 5);
function burst(x, y, z, color, n = 10, speed = 3) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(partGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.set(x, y, z);
    scene.add(m);
    particles.push({
      m, life: 1,
      vx: rand(-1, 1) * speed, vy: rand(0.5, 1.6) * speed, vz: rand(-1, 1) * speed,
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt * 1.8;
    if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); continue; }
    p.vy -= 9 * dt;
    p.m.position.x += p.vx * dt;
    p.m.position.y += p.vy * dt;
    p.m.position.z += p.vz * dt;
    p.m.material.opacity = p.life;
    p.m.scale.setScalar(0.5 + p.life);
  }
}

// ---------------- audio (tiny synth) ----------------
let AC = null, muted = false, musicTimer = null, musicStep = 0;
function audio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function blip(freq, dur = 0.12, type = 'triangle', vol = 0.18, slide = 0) {
  if (muted) return;
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
const sfx = {
  pickup: () => { blip(880, 0.09, 'triangle', 0.16); setTimeout(() => blip(1320, 0.12, 'triangle', 0.14), 70); },
  medkit: () => { blip(660, 0.1); setTimeout(() => blip(880, 0.1), 90); setTimeout(() => blip(1100, 0.16), 180); },
  hit: () => { blip(150, 0.25, 'sawtooth', 0.22, -80); blip(90, 0.3, 'square', 0.12, -40); },
  near: () => blip(1500, 0.06, 'sine', 0.08),
  level: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.16, 'triangle', 0.15), i * 110)),
  over: () => [400, 340, 260, 180].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sawtooth', 0.12), i * 180)),
};
const MELODY = [523, 0, 659, 784, 0, 659, 587, 0, 523, 0, 659, 880, 784, 0, 659, 0];
const BASS = [131, 0, 0, 0, 175, 0, 0, 0, 147, 0, 0, 0, 196, 0, 0, 0];
function startMusic() {
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted || state !== 'run') return;
    const m = MELODY[musicStep % 16], b = BASS[musicStep % 16];
    if (m) blip(m, 0.14, 'triangle', 0.045);
    if (b) blip(b, 0.3, 'sine', 0.07);
    musicStep++;
  }, 155);
}

// ---------------- UI helpers ----------------
const $ = (id) => document.getElementById(id);
const ui = {
  hud: $('hud'), score: $('score'), eggs: $('eggs'), wing: $('wing'),
  fill: $('progress-fill'), runner: $('progress-runner'),
  hearts: $('hearts').children, combo: $('combo'),
  bubble: $('bubble'), bubbleText: $('bubble-text'),
  title: $('title'), over: $('over'), levelup: $('levelup'), levelupText: $('levelup-text'),
  finalScore: $('final-score'), bestScore: $('best-score'), finalWing: $('final-wing'),
  overQuote: $('over-quote'),
};
let bubbleTimer = null, comboTimer = null;
function say(text, ms = 1900) {
  ui.bubbleText.textContent = text;
  ui.bubble.classList.remove('hidden');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => ui.bubble.classList.add('hidden'), ms);
}
function toast(text, color = '#e8894a') {
  ui.combo.textContent = text;
  ui.combo.style.color = color;
  ui.combo.classList.remove('hidden');
  ui.combo.style.animation = 'none';
  void ui.combo.offsetWidth;
  ui.combo.style.animation = '';
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => ui.combo.classList.add('hidden'), 900);
}

const QUOTES = {
  ambient: ['My finger is REALLY stuck!!', 'Is the first aid room far?!', "I can't feel my finger!", 'Why did I even put it in there?!', 'Faster please!! 🥲', 'This is so embarrassing...'],
  near: ['SO CLOSE!!', 'Wheee— I mean, careful!!', 'My life flashed by!!', '😱😱😱'],
  egg: ['Ooh, eggs!', 'Snacks for later!', '🥚 nice.'],
  medkit: ['A bandage! BLESS!', 'Sweet relief!!'],
  hit: ['OUCH!! MY FINGER!!', 'WATCH THE ROAD!!', 'I felt that in my SOUL', 'not helping!!!'],
  over: ['"The finger... will be remembered."', '"Tell my backpack... it won."', '"We were SO close to the first aid room."'],
  level: ['This First Aid room is closed?! NEXT WING!!', 'Closed for lunch?! Seriously?! NEXT WING!!', '"Try the next wing" ARE YOU KIDDING ME!!'],
};

// ---------------- game state ----------------
let state = 'title'; // title | run | levelup | over
let speed = 0, baseSpeed = 9, maxSpeed = 17, boost = false;
let score = 0, eggCount = 0, hearts = 3, level = 1;
let levelStartZ = 0, levelDist = 400, invincible = 0, shake = 0;
let nextRowZ = -30, quoteT = 4, levelupT = 0, fovKick = 0;
let best = +(localStorage.getItem('far-best') || 0);

function clearEntities() {
  for (const e of entities) scene.remove(e.g);
  entities.length = 0;
  removeGate();
}

function startLevel() {
  levelStartZ = player.z;
  levelDist = Math.min(880, 380 + (level - 1) * 90);
  baseSpeed = Math.min(19, 8.5 + (level - 1) * 1.4);
  maxSpeed = baseSpeed + 8;
  nextRowZ = player.z - 34;
  spawnGate(player.z - levelDist - 6);
  ui.wing.textContent = 'WING ' + level;
}

function resetGame() {
  clearEntities();
  player.x = 0; player.xv = 0; player.z = 0;
  player.group.position.set(0, 0, 0);
  score = 0; eggCount = 0; hearts = 3; level = 1;
  speed = baseSpeed = 8.5; invincible = 0; shake = 0; quoteT = 3;
  for (const h of ui.hearts) h.classList.remove('lost');
  ui.eggs.textContent = '🥚 0';
  // reset chunks around origin
  chunkGroups.forEach((g, i) => { g.position.z = -i * CHUNK_LEN + CHUNK_LEN; });
  startLevel();
}

function startGame() {
  resetGame();
  state = 'run';
  ui.title.classList.add('hidden');
  ui.over.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  audio(); startMusic();
  say('To the FIRST AID room!! Hold on!!', 2200);
}

function gameOver() {
  state = 'over';
  sfx.over();
  best = Math.max(best, Math.round(score));
  localStorage.setItem('far-best', best);
  ui.finalScore.textContent = Math.round(score);
  ui.bestScore.textContent = best;
  ui.finalWing.textContent = level;
  ui.overQuote.textContent = pick(QUOTES.over);
  ui.over.classList.remove('hidden');
  ui.hud.classList.add('hidden');
  ui.bubble.classList.add('hidden');
}

function levelClear() {
  state = 'levelup';
  levelupT = 2.3;
  sfx.level();
  score += 500;
  toast('WING CLEAR! +500', '#5a9e82');
  say(pick(QUOTES.level), 2300);
  ui.levelup.classList.remove('hidden');
  const inner = ui.levelup.querySelector('.banner-inner');
  inner.style.animation = 'none'; void inner.offsetWidth; inner.style.animation = '';
  removeGate();
  // sweep obstacles just ahead so the transition feels like a breather
  for (let i = entities.length - 1; i >= 0; i--) {
    if (!entities[i].pickup) { scene.remove(entities[i].g); entities.splice(i, 1); }
  }
}

// ---------------- spawning logic ----------------
function spawnRow(z) {
  const density = Math.min(0.9, 0.45 + level * 0.08 + (player.z - levelStartZ) / -4000);
  const gapX = rand(-LANE_HALF + 1.2, LANE_HALF - 1.2); // always leave a way through
  const slots = [-3.1, -1.05, 1.05, 3.1];
  const statics = ['bench', 'planter', 'sign', 'kiosk', 'planter'];
  for (const sx of slots) {
    if (Math.abs(sx - gapX) < 1.7) continue;
    if (Math.random() > density) continue;
    const roll = Math.random();
    const x = sx + rand(-0.4, 0.4);
    if (roll < 0.42) spawnEntity('walker', x, z + rand(-3, 3));
    else if (roll < 0.55) spawnEntity('crosser', x, z + rand(-2, 2));
    else if (roll < 0.64) spawnEntity('stander', x, z + rand(-2, 2));
    else if (roll < 0.7) spawnEntity('robot', x, z);
    else if (roll < 0.76 && level >= 2) spawnEntity('jogger', x, z + rand(-3, 3));
    else spawnEntity(pick(statics), x, z);
  }
  // pickups along the gap
  if (Math.random() < 0.55) {
    for (let k = 0; k < 3; k++) spawnEntity('egg', gapX, z - 2 - k * 1.7);
  }
  if (hearts < 3 && Math.random() < 0.16) spawnEntity('medkit', gapX, z - 7);
}

function updateSpawner() {
  const horizon = player.z - 78;
  while (nextRowZ > horizon) {
    if (!gate || nextRowZ > gate.z + 12) spawnRow(nextRowZ);
    nextRowZ -= Math.max(6.5, 12 - level * 0.7 - speed * 0.12);
  }
}

// ---------------- input ----------------
const keys = {};
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    if (state === 'title') startGame();
    else if (state === 'over') startGame();
  }
  if (e.code === 'KeyR' && state === 'over') startGame();
});
addEventListener('keyup', (e) => keys[e.code] = false);

let pointerX = null, pointerActive = false;
canvas.addEventListener('pointerdown', (e) => { pointerActive = true; pointerX = e.clientX; });
addEventListener('pointermove', (e) => { if (pointerActive) pointerX = e.clientX; });
addEventListener('pointerup', () => { pointerActive = false; pointerX = null; });

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-mute').addEventListener('click', (e) => {
  muted = !muted;
  e.currentTarget.textContent = muted ? '🔇' : '🔊';
});

// ---------------- collisions & scoring ----------------
function handleCollisions(dt) {
  const px = player.x, pz = player.z - 1.6; // collider sits at the wheelchair
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    // despawn behind
    if (e.z > player.z + 10) {
      scene.remove(e.g);
      entities.splice(i, 1);
      continue;
    }
    const dx = e.x - px, dz = e.z - pz;
    const d2 = dx * dx + dz * dz;

    if (e.pickup) {
      const rr = e.r + 0.75;
      if (d2 < rr * rr) {
        scene.remove(e.g);
        entities.splice(i, 1);
        if (e.pickup === 'egg') {
          eggCount++; score += 25;
          ui.eggs.textContent = '🥚 ' + eggCount;
          burst(e.x, 1, e.z, 0xfff3d6, 8, 2.5);
          sfx.pickup();
          if (Math.random() < 0.12) say(pick(QUOTES.egg), 1200);
        } else {
          if (hearts < 3) { hearts++; ui.hearts[hearts - 1].classList.remove('lost'); }
          score += 100;
          burst(e.x, 1, e.z, 0xffb3ab, 14, 3);
          sfx.medkit();
          say(pick(QUOTES.medkit), 1400);
        }
      }
      continue;
    }

    // near-miss bonus when an obstacle slips past
    if (!e.passed && e.z > pz + 0.4) {
      e.passed = true;
      const rr = e.r + 1.5;
      if (dx * dx < rr * rr && invincible <= 0) {
        score += 15;
        sfx.near();
        toast('CLOSE! +15');
        if (Math.random() < 0.2) say(pick(QUOTES.near), 1100);
      }
      continue;
    }

    if (invincible > 0 || e.passed || window.__far?.godMode) continue;
    const rr = e.r + COLLIDER_R;
    if (d2 < rr * rr) {
      hearts--;
      if (hearts >= 0 && ui.hearts[hearts]) ui.hearts[hearts].classList.add('lost');
      invincible = 1.6;
      shake = 0.55;
      speed = Math.max(6, speed * 0.5);
      burst(px, 1.1, pz, 0xffd23e, 14, 4);
      burst(px, 1.1, pz, 0xe2574c, 8, 3);
      sfx.hit();
      say(pick(QUOTES.hit), 1500);
      if (hearts <= 0) gameOver();
    }
  }
}

// ---------------- main loop ----------------
buildStartScene();
function buildStartScene() {
  // a bit of set dressing visible behind the title card
  spawnEntity('walker', -2.5, -18);
  spawnEntity('walker', 2, -26);
  spawnEntity('planter', 3.2, -12);
  spawnEntity('bench', -3.2, -22);
}

const clock = new THREE.Clock();
let camX = 0, camFov = 62, simT = 0;

function tick() {
  requestAnimationFrame(tick);
  frame(Math.min(clock.getDelta(), 0.05));
}

function frame(dt) {
  simT += dt;
  const t = simT;

  if (state === 'run' || state === 'levelup') {
    // --- speed / boost ---
    boost = state === 'run' && (keys.ArrowUp || keys.KeyW || keys.ShiftLeft || keys.ShiftRight);
    const target = Math.min(maxSpeed, baseSpeed + (levelStartZ - player.z) * 0.012) * (boost ? 1.3 : 1);
    speed += (target - speed) * dt * (speed < target ? 0.8 : 2.5);
    player.z -= speed * dt;

    // --- steering ---
    let steer = 0;
    if (keys.ArrowLeft || keys.KeyA) steer -= 1;
    if (keys.ArrowRight || keys.KeyD) steer += 1;
    if (pointerActive && pointerX !== null) {
      const targetX = ((pointerX / innerWidth) * 2 - 1) * LANE_HALF * 1.15;
      steer = THREE.MathUtils.clamp((targetX - player.x) * 1.6, -1, 1);
    }
    player.xv += steer * 46 * dt;
    player.xv *= Math.pow(0.0012, dt); // damping
    player.x = THREE.MathUtils.clamp(player.x + player.xv * dt, -LANE_HALF, LANE_HALF);
    if (Math.abs(player.x) >= LANE_HALF) player.xv *= 0.3;

    // --- player pose ---
    player.group.position.set(player.x, 0, player.z);
    player.group.rotation.z = -player.xv * 0.028;
    player.group.rotation.y = -player.xv * 0.05;
    player.phase += speed * dt * 1.35;
    walkPose(player.lady, player.phase, 0.5);
    player.lady.armL.rotation.x = -1.12; // keep hands on the handles
    player.lady.armR.rotation.x = -1.12;
    for (const w of player.wheels) w.userData.spin.rotation.z -= (speed * dt) / 0.31;
    player.guyArm.rotation.z = Math.sin(t * 7) * 0.05; // struggling with the pack
    if (invincible > 0) {
      invincible -= dt;
      player.group.visible = Math.floor(invincible * 12) % 2 === 0;
    } else player.group.visible = true;

    // --- score / progress ---
    if (state === 'run') {
      score += speed * dt * (boost ? 1.5 : 1);
      const prog = Math.min(1, (levelStartZ - player.z) / levelDist);
      ui.fill.style.width = (prog * 100).toFixed(1) + '%';
      ui.runner.style.left = (prog * 100).toFixed(1) + '%';
      ui.score.textContent = Math.round(score);

      quoteT -= dt;
      if (quoteT <= 0) { quoteT = rand(5, 9); if (!ui.bubble.classList.contains('hidden')) {} else say(pick(QUOTES.ambient), 1800); }

      if (gate && player.z < gate.z) levelClear();
    } else { // levelup pause
      levelupT -= dt;
      if (levelupT <= 0) {
        ui.levelup.classList.add('hidden');
        level++;
        state = 'run';
        startLevel();
      }
    }

    updateSpawner();
    handleCollisions(dt);
  } else if (state === 'title') {
    // idle diorama: gentle bobbing
    player.phase += dt * 2;
    player.guyArm.rotation.z = Math.sin(t * 3) * 0.06;
  }

  // --- entities anim ---
  for (const e of entities) {
    if (e.vz) { e.z += e.vz * dt; }
    if (e.vx) {
      e.x += e.vx * dt;
      const lim = LANE_HALF + 0.6;
      if (e.x > lim || e.x < -lim) { e.vx *= -1; e.x = THREE.MathUtils.clamp(e.x, -lim, lim); }
    }
    e.g.position.set(e.x, e.g.position.y, e.z);
    if (e.person) {
      e.phase += dt * (e.idle ? 1.2 : (Math.abs(e.vz) + Math.abs(e.vx) + 1) * 2.4);
      if (e.idle) {
        e.person.g.position.y = Math.sin(e.phase) * 0.015;
        if (e.person2) e.person2.g.position.y = Math.sin(e.phase + 2) * 0.015;
      } else {
        walkPose(e.person, e.phase);
        if (e.vx) e.person.g.rotation.y = e.vx > 0 ? Math.PI / 2 : -Math.PI / 2;
        else if (e.vz && e.vz < 0) e.person.g.rotation.y = Math.PI;
      }
    }
    if (e.robot) e.g.rotation.y += dt * 2;
    if (e.pickup) {
      e.g.rotation.y += e.spin * dt;
      e.g.position.y = 0.65 + Math.sin(t * 3 + e.phase) * 0.12;
    }
  }

  updateParticles(dt);
  recycleChunks();

  // --- camera ---
  if (shake > 0) shake -= dt;
  camX += (player.x * 0.55 - camX) * dt * 5;
  const shx = shake > 0 ? rand(-shake, shake) * 0.4 : 0;
  const shy = shake > 0 ? rand(-shake, shake) * 0.3 : 0;
  if (state === 'title') {
    const a = t * 0.25;
    camera.position.set(Math.sin(a) * 5.5, 2.6 + Math.sin(t * 0.5) * 0.3, player.z + Math.cos(a) * 5.5 + 1);
    camera.lookAt(player.x, 1.2, player.z - 0.5);
  } else {
    camera.position.set(camX + shx, 3.85 + shy, player.z + 7.2);
    camera.lookAt(camX * 1.3, 0.95, player.z - 6);
  }
  camFov += ((62 + speed * 0.55 + (boost ? 6 : 0)) - camFov) * dt * 4;
  camera.fov = camFov;
  camera.updateProjectionMatrix();

  // --- light follows ---
  sun.position.set(player.x + 9, 15, player.z - 7);
  sun.target.position.set(player.x, 0, player.z - 3);

  renderer.render(scene, camera);
}
tick();

// dev/test hook: step the simulation manually (useful when the tab is
// backgrounded and requestAnimationFrame is throttled)
window.__far = {
  step: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) frame(dt); },
  start: startGame,
  key: (code, down) => { keys[code] = down; },
  state: () => ({ state, score: Math.round(score), hearts, level, speed: +speed.toFixed(1), x: +player.x.toFixed(2), z: +player.z.toFixed(1), entities: entities.length }),
};
