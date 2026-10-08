/* ============================================================
   ontology.html — my work as an ontology.

   Three object types, all from site.js:
     Person   — me, at the centre
     Role     — ROLES (jobs and positions), drawn purple
     Project  — PROJECTS
   Links: me → each role, me → each project I built directly, plus
   every `related` entry (e.g. Dataform → Built at → Gordon Food Service).
   Skill panels come from SKILLS; dotted tethers run from each role and
   project to the skills it lists in `skills`.

   This file only decides presentation: where objects sit (LAYOUT), which
   3D model draws them (MODEL), and the verb on me → role links (ROLE_VERB).
   A new project or role with none of these still shows up: generic model,
   a spot from its topology `pos` (projects), linked to me.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const PROJ = window.PROJECTS || [], ROLES = window.ROLES || [], SKILLS = window.SKILLS || [];
const R = window.SITE_ROOT || '';
const $ = s => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STATUS_CSS = { done: 'var(--done)', wip: 'var(--wip)' };

const LAYOUT = {
  lidar: [-80, -30], 'gatech-ta': [-46, -42], astar: [-12, -46], gfs: [28, -42],
  you: [-8, 2],
  'hector-mpc': [-82, 24], smalldb: [-44, 32], predictmarket: [-6, 36], portfolio: [36, 32], 'dataform-slots-optimization': [58, -4]
};
const MODEL = {
  you: 'person', gfs: 'truck', 'gatech-ta': 'techTower', astar: 'tower', lidar: 'robotArm',
  smalldb: 'database', predictmarket: 'candles', portfolio: 'monitor', 'dataform-slots-optimization': 'cloud', 'hector-mpc': 'biped'
};
const ROLE_VERB = { gfs: 'Interned at', 'gatech-ta': 'Teaches at', astar: 'Researched at', lidar: 'Researched at' };

/* ---------------- objects ---------------- */
const nodes = [{ id: 'you', type: 'person', name: 'Cheng-Yuan Li', sub: 'CS · Georgia Tech', skills: [] }]
  .concat(ROLES.map(r => ({ id: r.id, type: 'role', name: r.org, sub: r.title, skills: r.skills || [], r })))
  .concat(PROJ.map(p => ({ id: p.id, type: 'project', name: p.name, sub: p.cat, skills: p.skills || [], p })));
nodes.forEach((n, i) => {
  const xz = LAYOUT[n.id] || (n.p && n.p.pos ? [n.p.pos.x * 0.2, n.p.pos.y * 0.2] : [i * 6 - 20, 40]);
  n.x = xz[0]; n.z = xz[1];
  n.kind = MODEL[n.id] || (n.type === 'role' ? 'tower' : 'generic');
});
const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

/* ---------------- links ---------------- */
const links = [];
const link = (a, b, verb) => { if (byId[a] && byId[b]) links.push({ a: byId[a], b: byId[b], verb, role: byId[a].type === 'role' || byId[b].type === 'role' }); };
ROLES.forEach(r => link('you', r.id, ROLE_VERB[r.id] || 'Worked at'));
PROJ.forEach(p => {
  (p.related || []).forEach(([to, verb]) => link(p.id, to, verb));
  const viaRole = (p.related || []).some(([to]) => byId[to] && byId[to].type === 'role');
  if (!viaRole) link('you', p.id, p.status === 'done' ? 'Built' : 'Building');
});
const linksOf = id => links.filter(l => l.a.id === id || l.b.id === id);
const usersOf = skill => nodes.filter(n => n.skills.includes(skill));

/* ---------------- card + list (also the no-WebGL path) ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const card = $('#card'), cardBody = $('#card-body'), list = $('#list');
let selected = null;
const typeLabel = n => n.type === 'role' ? 'role' : n.type === 'person' ? 'person' : 'project';

function linkRows(n) {
  return linksOf(n.id).map(l => {
    const other = l.a === n ? l.b : l.a;
    const verb = `<em class="${l.role ? 'purple' : ''}">${esc(l.verb)}</em>`;
    const name = `<button data-go="${esc(other.id)}">${esc(other.name)}</button>`;
    return l.a === n ? `<li>${verb}${name}</li>` : `<li>${name}${verb}<span>this</span></li>`;
  }).join('');
}
function openCard(n) {
  let html = `<div class="cat"><span class="ty ty-${n.type}">${typeLabel(n)}</span></div>`;
  if (n.type === 'role') {
    const r = n.r;
    html += `<h2>${esc(r.title)}</h2><div class="org">${esc(r.org)} · ${esc(r.team)}</div>` +
      `<div class="st">${esc(r.period)} · ${esc(r.place)}</div>` +
      `<ul class="bullets">${r.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
  } else if (n.type === 'project') {
    const p = n.p;
    html += `<h2>${esc(n.name)}</h2><div class="org">${esc(p.cat)}</div>` +
      `<div class="st"><i style="background:${STATUS_CSS[p.status]}"></i>${p.status === 'done' ? 'shipped' : 'in progress'}</div>` +
      `<p class="d">${esc(p.desc)}</p>` +
      `<div class="stats">${(p.stats || []).map(([k, v]) => `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}</div>`;
  } else {
    html += `<h2>${esc(n.name)}</h2><div class="org">CS student at Georgia Tech</div>` +
      `<p class="d">Backend systems, cloud data, and data pipelines. I like systems that fail loudly and recover quietly.</p>`;
  }
  const rel = linkRows(n);
  if (rel) html += `<h3>LINKS</h3><ul class="links-to">${rel}</ul>`;
  if (n.skills.length) html += `<h3>SKILLS</h3><div class="tags">${n.skills.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  if (n.type === 'project') {
    const p = n.p;
    if (p.roadmap) html += `<p class="next">${esc(p.roadmap)}</p>`;
    html += `<div class="actions"><a class="primary" href="${R}projects/${esc(p.file)}">read the case study &rarr;</a>` +
      (p.gh ? `<a href="${esc(p.gh)}" target="_blank" rel="noopener">source</a>` : `<a class="disabled" aria-disabled="true">source not published</a>`) + `</div>`;
  } else if (n.type === 'person') {
    html += `<div class="actions"><a class="primary" href="${R}about.html">about me &rarr;</a><a href="${R}assets/resume.pdf" target="_blank" rel="noopener">resume</a></div>`;
  }
  cardBody.innerHTML = html;
  card.classList.add('open');
  card.setAttribute('aria-hidden', 'false');
  selected = n.id;
  $('#card-x').focus({ preventScroll: true });
}
function closeCard() { card.classList.remove('open'); card.setAttribute('aria-hidden', 'true'); selected = null; }
cardBody.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) openCard(byId[b.dataset.go]); });
$('#card-x').addEventListener('click', closeCard);
function setList(on) { list.classList.toggle('open', on); $('#btn-list').setAttribute('aria-pressed', on ? 'true' : 'false'); }
$('#btn-list').addEventListener('click', () => setList(!list.classList.contains('open')));
$('#list-x').addEventListener('click', () => setList(false));
$('#list-ol').innerHTML = nodes.filter(n => n.type !== 'person').map(n =>
  `<li><button data-id="${esc(n.id)}"><span><b>${esc(n.type === 'role' ? n.r.title + ' · ' + n.r.org : n.name)}</b>` +
  `<small>${esc(n.type === 'role' ? n.r.period + ' · ' + n.r.team : n.p.desc)}</small></span>` +
  `<em><span class="ty ty-${n.type}">${typeLabel(n)}</span></em></button></li>`).join('');
$('#list-ol').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { setList(false); openCard(byId[b.dataset.id]); } });
addEventListener('keydown', e => { if (e.key === 'Escape') { if (card.classList.contains('open')) closeCard(); else setList(false); } });
const np = $('#n-projects'); if (np) np.textContent = PROJ.length + ' write-ups';

/* ---------------- skill panels ---------------- */
const skillsEl = $('#skills');
skillsEl.innerHTML = SKILLS.map(g =>
  `<div class="group"><div class="gname">${esc(g.group)}</div><div class="box">` +
  g.items.map(t => `<button class="skill${usersOf(t).length ? '' : ' solo'}" data-skill="${esc(t)}">${esc(t)}</button>`).join('') +
  `</div></div>`).join('');
const chipEls = Object.fromEntries([...skillsEl.querySelectorAll('.skill')].map(el => [el.dataset.skill, el]));
let skillHover = null, skillPinned = null;
skillsEl.addEventListener('mouseover', e => { const b = e.target.closest('.skill'); skillHover = b ? b.dataset.skill : null; });
skillsEl.addEventListener('mouseleave', () => { skillHover = null; });
skillsEl.addEventListener('click', e => {               // touch: tap a skill to pin it, tap again to clear
  const b = e.target.closest('.skill'); if (!b) return;
  skillPinned = skillPinned === b.dataset.skill ? null : b.dataset.skill;
});

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, alpha: true }); } catch (err) { renderer = null; }
if (!renderer) { setList(true); $('.hint').style.display = 'none'; }
else buildScene();

function buildScene() {
  const wrap = $('#wrap'), stage = $('#stage'), overlay = $('#overlay'), svg = $('#tethers'), props = $('#props');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(18, 1, 1, 3000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bcb8, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-40, 100, 60);
  scene.add(sun);

  /* ---------------- line-art materials + helpers ---------------- */
  const INK = 0x1f2321, MINT_HEX = 0x9fe6c3, PURPLE_HEX = 0xb7a6f5;
  const WHITE = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const GREY = new THREE.MeshLambertMaterial({ color: 0xe6e7e3 });
  const MINT = new THREE.MeshLambertMaterial({ color: MINT_HEX });
  const PURPLE = new THREE.MeshLambertMaterial({ color: PURPLE_HEX });
  const lineMat = new THREE.LineBasicMaterial({ color: INK });
  // silhouette for curved parts: push back-faces out along the normal and paint them ink
  const hullMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0.1 } }, side: THREE.BackSide,
    vertexShader: `uniform float uT; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normalize(normal) * uT, 1.); }`,
    fragmentShader: `void main(){ gl_FragColor = vec4(.122,.137,.129,1.); }`
  });
  function part(geo, mat, x = 0, y = 0, z = 0, { hull = false, edges = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), lineMat));
    if (hull) m.add(new THREE.Mesh(geo, hullMat));
    return m;
  }
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const C = (rt, rb, h, s = 28) => new THREE.CylinderGeometry(rt, rb, h, s);
  const prism = (w, h, d) => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]), { depth: d, bevelEnabled: false });
    return g.translate(0, 0, -d / 2);
  };

  /* ---------------- the slab ---------------- */
  const xs = nodes.map(n => n.x), zs = nodes.map(n => n.z);
  const minX = Math.min(...xs) - 14, maxX = Math.max(...xs) + 14, minZ = Math.min(...zs) - 24, maxZ = Math.max(...zs) + 13;   // deep back margin: tall objects never reach the port edge
  const SW = maxX - minX, SD = maxZ - minZ, SH = 2.6, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  function hatch(repeat) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#8d918e'; g.lineWidth = 2;
    for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, 1); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t });
  }
  scene.add(part(B(SW, SH, SD), [hatch(SD / SH / 2), hatch(SD / SH / 2), new THREE.MeshLambertMaterial({ color: 0xffffff }), GREY, hatch(SW / SH / 2), hatch(SW / SH / 2)], cx, -SH / 2, cz));

  /* ---------------- models, each returns {g, update} ---------------- */
  const MODELS = {
    person() {                                  // me: assets/models/person.glb, a cone with a head until it loads
      const g = new THREE.Group();
      const stand = new THREE.Group(); g.add(stand);
      stand.add(part(new THREE.ConeGeometry(2, 3.8, 40), WHITE, 0, 1.9, 0, { hull: true }));
      stand.add(part(new THREE.SphereGeometry(1.15, 32, 22), WHITE, 0, 4.45, 0, { hull: true, edges: false }));
      new GLTFLoader().load(R + 'assets/models/person.glb', gltf => {
        // one white mesh in the site's line-art style: drop textures/UVs, weld seams so the hull has no cracks,
        // and bake the scale into the geometry because the hull offset is in model units
        const src = []; gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse(o => { if (o.isMesh) src.push(o.geometry.clone().applyMatrix4(o.matrixWorld)); });
        if (!src.length) return;
        let geo = src[0];
        ['uv', 'normal', 'color'].forEach(a => geo.deleteAttribute(a));
        geo = mergeVertices(geo, 1e-5);
        geo.computeBoundingBox();
        const bb = geo.boundingBox, H = 6;
        geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2).scale(H / (bb.max.y - bb.min.y), H / (bb.max.y - bb.min.y), H / (bb.max.y - bb.min.y));
        geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, WHITE);
        m.add(new THREE.Mesh(geo, hullMat));
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 50), lineMat));
        g.remove(stand); g.add(m);
      }, undefined, () => {});                    // load failed: keep the cone
      return { g, face: true };                   // always turned square to the camera
    },
    truck() {                                   // Gordon Food Service: a food-distribution truck
      const g = new THREE.Group();
      g.add(part(B(8.2, 0.45, 2.8), GREY, 0.2, 0.9, 0));
      g.add(part(B(5.4, 3.3, 3), WHITE, -1.2, 2.8, 0));
      g.add(part(B(5.42, 0.55, 3.02), PURPLE, -1.2, 2.2, 0, { edges: false }));
      g.add(part(B(2.3, 2.3, 2.8), WHITE, 3.0, 2.25, 0));
      g.add(part(B(0.1, 0.95, 2.2), GREY, 4.16, 2.75, 0));
      [-3, -0.4, 3].forEach(x => [-1.45, 1.45].forEach(z => {
        const w = part(C(0.68, 0.68, 0.45, 20), GREY, x, 0.68, z, { hull: true }); w.rotation.x = Math.PI / 2; g.add(w);
      }));
      return { g };
    },
    techTower() {                               // Georgia Tech: Tech Tower on a gear, TECH signs up top
      const g = new THREE.Group();
      const GOLD = new THREE.MeshLambertMaterial({ color: 0xc9b46f }), NAVY = 0x003057;
      g.add(part(C(2.9, 2.9, 0.5, 40), GOLD, 0, 0.25, 0, { hull: true }));
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2, tooth = part(B(0.8, 0.5, 0.6), GOLD, Math.cos(a) * 3.05, 0.25, Math.sin(a) * 3.05);
        tooth.rotation.y = -a; g.add(tooth);
      }
      g.add(part(B(4.6, 2.2, 2.6), WHITE, 0, 1.6, 0));                                 // main hall
      [-1.75, 1.75].forEach(x => {                                                     // wings with gold caps
        g.add(part(B(1.3, 3, 2.8), WHITE, x, 2, 0));
        const cap = part(new THREE.ConeGeometry(1.05, 1, 4), GOLD, x, 4, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
      });
      g.add(part(B(2.6, 8.2, 2.6), WHITE, 0, 4.6, 0));                                 // the tower
      g.add(part(B(2.95, 0.4, 2.95), GOLD, 0, 8.9, 0));
      const roof = part(new THREE.ConeGeometry(2.1, 1.8, 4), GOLD, 0, 9.95, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      // TECH, on all four sides
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72;
      const c2 = cv.getContext('2d');
      c2.fillStyle = '#' + NAVY.toString(16).padStart(6, '0'); c2.fillRect(0, 0, 256, 72);
      c2.fillStyle = '#ffffff'; c2.font = 'bold 58px Georgia, serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillText('TECH', 128, 39);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.MeshBasicMaterial({ map: tex });
      for (let k = 0; k < 4; k++) {
        const s = part(new THREE.PlaneGeometry(2.45, 0.7), sign, Math.sin(k * Math.PI / 2) * 1.32, 8.1, Math.cos(k * Math.PI / 2) * 1.32);
        s.rotation.y = k * Math.PI / 2; g.add(s);
      }
      return { g };
    },
    tower() {                                   // A*STAR: a research tower with a lab wing
      const g = new THREE.Group();
      g.add(part(B(9, 0.4, 6), GREY, 0, 0.2, 0));
      g.add(part(B(4, 9.5, 4), WHITE, -1.6, 5.15, -0.4));
      for (let i = 0; i < 5; i++) g.add(part(B(4.06, 0.35, 4.06), GREY, -1.6, 2.2 + i * 1.6, -0.4, { edges: false }));
      g.add(part(B(4.2, 0.6, 4.2), PURPLE, -1.6, 10.2, -0.4));
      g.add(part(B(3.6, 3, 3.6), WHITE, 2.4, 1.9, 0.6));
      g.add(part(B(3.62, 0.5, 3.62), PURPLE, 2.4, 2.9, 0.6, { edges: false }));
      return { g };
    },
    candles() {                                 // Kalshi pipeline: market candlesticks
      const g = new THREE.Group();
      g.add(part(B(10, 0.4, 5), GREY, 0, 0.2, 0));
      const bars = [];
      [-3.6, -1.8, 0, 1.8, 3.6].forEach((x, i) => {
        const wick = part(C(0.08, 0.08, 1, 6), GREY, x, 0, 0, { edges: false });
        const body = part(B(1.1, 1, 1.1), i % 2 ? WHITE : MINT, x, 0, 0);
        g.add(wick, body); bars.push({ wick, body, i });
      });
      const set = t => bars.forEach(({ wick, body, i }) => {
        const h = 1.6 + 1.3 * Math.sin(t * 0.6 + i * 1.7) + 0.9 * Math.sin(t * 0.23 + i), base = 1.2 + 0.8 * Math.sin(i * 2.3 + t * 0.3);
        body.scale.y = Math.max(0.3, h); body.position.y = 0.4 + base + body.scale.y / 2;
        wick.scale.y = body.scale.y + 2; wick.position.y = body.position.y;
      });
      set(0);
      return { g, update: set };
    },
    database() {                                // SmallDB: the database stack, a mint band flushing down its levels
      const g = new THREE.Group();
      const lit = new THREE.Color(0x9fe6c3), off = new THREE.Color(0xffffff), mats = [];
      for (let i = 0; i < 4; i++) {
        const m = new THREE.MeshLambertMaterial({ color: 0xffffff }); mats.push(m);
        g.add(part(C(2.7, 2.7, 1, 40), m, 0, 0.5 + i * 1.22, 0, { hull: true }));
      }
      return { g, update(t) {
        const pos = 3.6 - ((t * 0.9) % 5);                 // from just above the top layer down past the bottom
        mats.forEach((m, i) => m.color.copy(off).lerp(lit, Math.max(0, 1 - Math.abs(pos - i))));
      } };
    },
    cloud() {                                   // BigQuery cost optimizer: the Google Cloud logo, extruded
      // geometry measured off the logo: a big top arch and two lobes, all rings, over a flat base.
      // units: logo px / 100, origin at the base's centre-bottom
      const g = new THREE.Group();
      const logo = new THREE.Group(); g.add(logo);
      const mat = hex => new THREE.MeshLambertMaterial({ color: hex });
      const RED = 0xd97a6e, YELLOW = 0xe6c56c, GREEN = 0x72ad88, BLUE = 0x729ddd;   // Google's colours, muted to sit with the palette
      // a ring sector (degrees, counter-clockwise a0 → a1), extruded; depth staggers which piece is in front
      const arc = (cx, cy, r0, r1, a0, a1, color, depth) => {
        const t0 = THREE.MathUtils.degToRad(a0), t1 = THREE.MathUtils.degToRad(a1);
        const sh = new THREE.Shape();
        sh.absarc(cx, cy, r1, t0, t1, false);
        sh.absarc(cx, cy, r0, t1, t0, true);
        logo.add(part(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, -depth / 2), mat(color)));
      };
      const bar = (x0, x1, color, depth) => logo.add(part(B(x1 - x0, 1.63, depth), mat(color), (x0 + x1) / 2, 0.815, 0));
      const L = [-2.1, 2.68], Rt = [2.08, 2.68], T = [0, 3.9];
      arc(...T, 2.15, 3.6, 48, 170, RED, 1.3);         // top arch, left end tucked under the yellow lobe
      arc(...T, 2.15, 3.6, 17.5, 48, BLUE, 1.32);      // top arch, right of the 45° cut
      arc(...Rt, 1.05, 2.68, -90, 90, BLUE, 1.3);      // right lobe
      bar(0, 2.08, BLUE, 1.32);                        // base, right half
      bar(-2.1, 0, GREEN, 1.32);                       // base, left half
      arc(...L, 1.04, 2.67, 233, 270, GREEN, 1.34);    // left lobe, below the diagonal cut
      arc(...L, 1.04, 2.67, 37, 233, YELLOW, 1.36);    // left lobe, in front of the red arch
      return { g };
    },
    monitor() {                                 // This site
      const g = new THREE.Group();
      g.add(part(B(3.6, 0.3, 2.6), GREY, 0, 0.15, 0));
      g.add(part(B(0.6, 2.4, 0.6), WHITE, 0, 1.5, -0.2));
      const scr = new THREE.Group(); scr.position.set(0, 5, 0); scr.rotation.x = -0.08; g.add(scr);
      scr.add(part(B(7.6, 4.9, 0.5), WHITE));
      scr.add(part(B(6.9, 4.2, 0.06), MINT, 0, 0, 0.27, { edges: false }));
      [-2.2, 0, 2.2].forEach(x => scr.add(part(B(1.9, 1.5, 0.06), WHITE, x, 0.7, 0.32)));
      [-1.1, -1.6].forEach((y, i) => scr.add(part(B(i ? 3.4 : 5.6, 0.22, 0.06), WHITE, i ? -1.1 : 0, y, 0.32, { edges: false })));
      return { g };
    },
    robotArm() {                                // Georgia Tech robotics lab: a jointed arm on a base
      const g = new THREE.Group();
      g.add(part(C(2.6, 3, 0.8, 40), GREY, 0, 0.4, 0, { hull: true }));
      g.add(part(C(1.1, 1.3, 1.6, 28), WHITE, 0, 1.6, 0, { hull: true }));
      const lower = part(B(1.1, 5.2, 1.1), WHITE, 0.9, 4.4, 0); lower.rotation.z = -0.35; g.add(lower);
      g.add(part(new THREE.SphereGeometry(0.85, 24, 16), PURPLE, 1.85, 6.9, 0, { hull: true, edges: false }));
      const upper = part(B(0.9, 4.2, 0.9), WHITE, 3.5, 7.6, 0); upper.rotation.z = -1.25; g.add(upper);
      g.add(part(B(0.5, 1.4, 1.3), PURPLE, 5.4, 8.2, 0));
      return { g };
    },
    biped() {                                   // HECTOR: a bipedal robot, legs gently stepping
      const g = new THREE.Group();
      g.add(part(B(3.6, 2.4, 2.2), WHITE, 0, 6.6, 0));
      g.add(part(B(3.62, 0.5, 2.22), MINT, 0, 6.2, 0, { edges: false }));
      const legs = [-1, 1].map(s => {
        const hip = new THREE.Group(); hip.position.set(s * 1.1, 5.4, 0); g.add(hip);
        hip.add(part(B(0.7, 2.6, 0.7), WHITE, 0, -1.3, 0));
        const knee = new THREE.Group(); knee.position.set(0, -2.6, 0); hip.add(knee);
        knee.add(part(B(0.6, 2.4, 0.6), WHITE, 0, -1.2, 0));
        knee.add(part(B(1, 0.35, 1.8), GREY, 0, -2.45, 0.3));
        return { hip, knee, s };
      });
      const set = t => legs.forEach(({ hip, knee, s }) => {
        const a = Math.sin(t * 1.4 + (s > 0 ? Math.PI : 0)) * 0.22;
        hip.rotation.x = a; knee.rotation.x = Math.max(0, -a) * 1.2;
      });
      set(0);
      return { g, update: set };
    },
    generic() {
      const g = new THREE.Group();
      g.add(part(B(4.4, 4.4, 4.4), WHITE, 0, 2.2, 0));
      g.add(part(B(4.5, 0.7, 4.5), MINT, 0, 3.2, 0));
      return { g };
    }
  };

  /* ---------------- place objects on discs ---------------- */
  const DISC_R = 8, MAX_SCALE = 1.7, FIT = 0.8, PEDESTAL = 4;   // every model fills FIT of its platform, never more; PEDESTAL: how far a selected disc rises
  const hitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const hits = [], updaters = [];
  nodes.forEach(n => {
    n.discMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    n.disc = part(C(DISC_R, DISC_R, 0.35, 56), n.discMat, n.x, 0.175, n.z);
    scene.add(n.disc);
    const m = (MODELS[n.kind] || MODELS.generic)();
    const foot = new THREE.Box3().setFromObject(m.g);
    const reach = Math.max(...[foot.min.x, foot.max.x].flatMap(x => [foot.min.z, foot.max.z].map(z => Math.hypot(x, z))));
    m.g.position.set(n.x, 0.35, n.z);
    m.g.scale.setScalar(Math.min(MAX_SCALE, (DISC_R * FIT) / reach));
    m.g.rotation.y = -0.25;
    scene.add(m.g);
    n.model = m.g; n.face = !!m.face; n.lift = 0; n.spin = 0;
    if (m.update) updaters.push(m.update);
    const hit = new THREE.Mesh(C(DISC_R, DISC_R, 12, 16), hitMat);
    hit.position.set(n.x, 6, n.z); hit.userData.node = n;
    scene.add(hit); hits.push(hit);
    n.top = new THREE.Vector3(n.x, new THREE.Box3().setFromObject(m.g).max.y + 1.2, n.z);   // where tethers leave from
    n.topY = n.top.y;
  });

  /* ---------------- links: dashed, with packets travelling along them ---------------- */
  // a pill sits mid-link unless that spot is under an object's label or behind a tall object
  function pillSpot(l) {
    let best = 0.5, bestCost = Infinity;
    for (const t of [0.5, 0.42, 0.58, 0.34, 0.66]) {
      const x = l.p0.x + (l.p1.x - l.p0.x) * t, z = l.p0.z + (l.p1.z - l.p0.z) * t;
      let cost = Math.abs(t - 0.5);
      nodes.forEach(n => {
        const dx = x - n.x, dz = z - n.z;
        const chars = n.type === 'role' ? Math.max(n.r.title.length, n.r.org.length) : n.name.length;
        if (Math.abs(dx) < Math.max(8, chars * 0.6) && dz > DISC_R - 3 && dz < DISC_R + (n.type === 'role' ? 17 : 6)) cost += 10;   // role labels are two lines tall
        if (Math.abs(dx) < 6 && dz < 0 && dz > -14) cost += 10;
      });
      if (cost < bestCost) { bestCost = cost; best = t; }
    }
    return best;
  }
  const packetGeo = B(0.8, 0.8, 0.8), packetEdges = new THREE.EdgesGeometry(packetGeo);
  links.forEach((l, k) => {
    const a = new THREE.Vector3(l.a.x, 0.05, l.a.z), b = new THREE.Vector3(l.b.x, 0.05, l.b.z);
    const dir = b.clone().sub(a).normalize();
    l.p0 = a.clone().addScaledVector(dir, DISC_R + 0.4); l.p1 = b.clone().addScaledVector(dir, -(DISC_R + 0.4));
    l.len = l.p0.distanceTo(l.p1);
    l.mat = new THREE.LineDashedMaterial({ color: l.role ? 0x7b61e8 : INK, dashSize: 0.9, gapSize: 0.7, transparent: true });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([l.p0, l.p1]), l.mat);
    line.computeLineDistances(); scene.add(line);
    l.pmat = new THREE.MeshLambertMaterial({ color: l.role ? PURPLE_HEX : MINT_HEX, transparent: true });
    l.emat = new THREE.LineBasicMaterial({ color: INK, transparent: true });
    l.packets = [0, 0.5].map(ph => {
      const m = new THREE.Mesh(packetGeo, l.pmat); m.add(new THREE.LineSegments(packetEdges, l.emat));
      m.userData.ph = ph + k * 0.137; scene.add(m); return m;
    });
    l.pill = document.createElement('div'); l.pill.className = 'pill' + (l.role ? ' purple' : ''); l.pill.textContent = l.verb;
    overlay.appendChild(l.pill);
    l.mid = l.p0.clone().lerp(l.p1, pillSpot(l));
  });

  /* object labels: a pill coloured by object type, under each disc */
  let labelHover = null;
  nodes.forEach(n => {
    const el = document.createElement('button');
    el.className = 'nlabel ty-' + n.type;
    // roles lead with what I did there, the organisation underneath
    el.innerHTML = n.type === 'role' ? `${esc(n.r.title)}<small>${esc(n.r.org)}</small>`
      : (n.p ? `<i style="background:${STATUS_CSS[n.p.status]}"></i>` : '') + esc(n.name);
    el.addEventListener('click', () => openCard(n));
    el.addEventListener('mouseenter', () => { labelHover = n.id; });
    el.addEventListener('mouseleave', () => { labelHover = null; });
    overlay.appendChild(el);
    n.label = el; n.anchor = new THREE.Vector3(n.x, 0, n.z + DISC_R + 0.6);
  });

  /* ---------------- tethers: one line per skill, from a port on the slab's back edge ----------------
     Lines never float over the slab: each skill gets a port on the back edge, ports are
     ordered left to right like their chips, so the bundle fans up without crossing. */
  const NS = 'http://www.w3.org/2000/svg';
  const tethers = Object.keys(chipEls).filter(t => usersOf(t).length).map(tag => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('marker-end', 'url(#arrow)');
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '2.2');
    svg.append(path, dot);
    return { tag, path, dot, port: new THREE.Vector3(0, 0, minZ) };
  });
  const chipPos = {};
  let stageX = 0, stageY = 0;
  function measure() {
    const w = wrap.getBoundingClientRect();
    for (const t in chipEls) {
      // lines enter the panel from below, under their chip, so they never cross other chips
      const r = chipEls[t].getBoundingClientRect(), box = chipEls[t].parentElement.getBoundingClientRect();
      chipPos[t] = [r.left - w.left + r.width / 2, box.bottom - w.top + 3];
    }
    stageX = stage.offsetLeft; stageY = stage.offsetTop;
    nodes.forEach(n => { n.labelW = n.label.offsetWidth; });
    // ports along the back edge, in the same left-to-right order as the chips
    const order = tethers.slice().sort((a, b) => chipPos[a.tag][0] - chipPos[b.tag][0]);
    const inset = 6, span = SW - inset * 2;
    order.forEach((th, i) => th.port.set(minX + inset + span * (order.length > 1 ? i / (order.length - 1) : 0.5), 0, minZ));
  }

  /* ---------------- camera: perspective, tilted back so the front edge reads wider ---------------- */
  const target = new THREE.Vector3(cx, 0, cz);
  let EL = 0.66, azOff = 0, baseAz = 0, compact = false, dist = 220;
  function placeCamera(az) {
    camera.position.set(cx + Math.sin(az) * Math.cos(EL) * dist, Math.sin(EL) * dist, cz + Math.cos(az) * Math.cos(EL) * dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }
  const fitPts = [];
  for (const x of [minX, maxX]) for (const z of [minZ, maxZ]) for (const y of [-SH, 0]) fitPts.push(new THREE.Vector3(x, y, z));
  nodes.forEach(n => fitPts.push(n.top));
  function fit() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    const portrait = w / h < 1;
    baseAz = portrait ? Math.PI / 2 : 0;
    EL = portrait ? 1.02 : 0.66;
    compact = w < 720;
    camera.aspect = w / h;
    camera.clearViewOffset();
    // pull the camera in or out until everything fits, then centre it with a view offset
    const v = new THREE.Vector3();
    let box;
    for (let i = 0; i < 6; i++) {
      placeCamera(baseAz);
      camera.updateProjectionMatrix();
      box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      fitPts.forEach(p => { v.copy(p).project(camera); box.x0 = Math.min(box.x0, v.x); box.x1 = Math.max(box.x1, v.x); box.y0 = Math.min(box.y0, v.y); box.y1 = Math.max(box.y1, v.y); });
      dist *= Math.max((box.x1 - box.x0) / 1.9, (box.y1 - box.y0) / 1.82);
    }
    placeCamera(baseAz);
    camera.setViewOffset(w, h, (box.x0 + box.x1) / 4 * w, -(box.y0 + box.y1) / 4 * h, w, h);
    camera.updateProjectionMatrix();
    measure();
  }
  fit();
  new ResizeObserver(fit).observe(wrap);
  if (document.fonts) document.fonts.ready.then(measure);

  /* ---------------- pointer: hover traces, click opens, drag turns the slab ---------------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hover = null, drag = null;
  function pick(e) {
    const r = stage.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hits, false)[0];
    return h ? h.object.userData.node : null;
  }
  // a drag grabs the slab: the point under the pointer stays under it as the slab turns about its centre
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), RMIN = SW / 4, TURN = 0.6;
  function onFloor(e, cam) {
    const r = stage.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.ray.intersectPlane(floor, new THREE.Vector3());
  }
  const soft = a => Math.abs(a) <= TURN ? a : Math.sign(a) * (TURN + (Math.abs(a) - TURN) * 0.25);   // rubber-band past the limit
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.nlabel')) return;
    const cam = camera.clone(), p = onFloor(e, cam);
    let r0 = null;
    if (p) { r0 = p.clone().sub(target); r0.setLength(Math.max(r0.length(), RMIN)); }   // near the centre, grab as if at RMIN
    drag = { x: e.clientX, y: e.clientY, az: azOff, cam, p0: p, r0, moved: false };
  });
  addEventListener('pointermove', e => {
    if (drag) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) { drag.moved = true; stage.classList.add('dragging'); }
      if (!drag.moved) return;
      const p = drag.r0 && onFloor(e, drag.cam);
      let turn;
      if (p) {
        const r1 = p.sub(drag.p0).add(drag.r0);
        turn = Math.atan2(r1.x, r1.z) - Math.atan2(drag.r0.x, drag.r0.z);
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      } else turn = (e.clientX - drag.x) * 0.005;           // grabbed above the horizon: plain horizontal turn
      azOff = soft(drag.az - turn);
    } else if (e.target === $('#scene')) {
      hover = pick(e);
      stage.classList.toggle('pointing', !!hover);
    } else hover = null;
  });
  addEventListener('pointerup', e => {
    if (drag && !drag.moved && e.target === $('#scene')) { const n = pick(e); if (n) openCard(n); }
    drag = null; stage.classList.remove('dragging');
  });
  addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging'); });   // e.g. touch handed to page scroll

  /* ---------------- property panel: the hovered object's properties ---------------- */
  function propsHTML(n) {
    const row = (k, v, dot) => `<tr><td>${esc(k)}</td><td>${dot ? `<i style="background:${dot}"></i>` : ''}${esc(v)}</td></tr>`;
    let rows = '', title = '';
    if (n.type === 'role') {
      title = 'ROLE OBJECT';
      rows = row('Title', n.r.title) + row('Organization', n.r.org) + row('Team', n.r.team) + row('Period', n.r.period) + row('Location', n.r.place);
    } else if (n.type === 'project') {
      const p = n.p;
      title = 'PROJECT OBJECT';
      rows = row('Status', p.status === 'done' ? 'Shipped' : 'In progress', STATUS_CSS[p.status]) + row('Category', p.cat) +
        (p.stats || []).filter(([k]) => k !== 'STATUS').map(([k, v]) => row(k[0] + k.slice(1).toLowerCase(), v)).join('') +
        row('Source', p.gh ? 'Public' : 'Private');
    } else {
      title = 'PERSON OBJECT';
      rows = row('School', 'Georgia Tech') + row('Roles', ROLES.length) + row('Projects', PROJ.length) + row('Skills', SKILLS.reduce((a, g) => a + g.items.length, 0));
    }
    const action = n.type === 'project' ? 'Open case study' : n.type === 'role' ? 'Open role' : 'About me';
    return `<div class="pt">${title}</div><table>${rows}</table><div class="pa">${action} &rarr;</div>`;
  }
  let propsFor = null;

  /* ---------------- focus: an object lights its links and skills; a skill lights its objects ---------------- */
  let lastKey = '';
  function applyFocus(obj, skill) {
    const key = (obj || '') + '|' + (skill || '');
    if (key === lastKey) return;
    lastKey = key;
    const litSkills = new Set(skill ? [skill] : obj ? byId[obj].skills : []);
    const litNodes = new Set(obj ? [obj] : skill ? usersOf(skill).map(n => n.id) : []);
    if (obj) linksOf(obj).forEach(l => { litNodes.add(l.a.id); litNodes.add(l.b.id); });
    const any = !!(obj || skill);
    skillsEl.classList.toggle('focus', any);
    svg.classList.toggle('focus', any);
    for (const t in chipEls) chipEls[t].classList.toggle('on', litSkills.has(t));
    tethers.forEach(th => { const on = skill ? th.tag === skill : obj ? byId[obj].skills.includes(th.tag) : false; th.path.classList.toggle('on', on); th.dot.classList.toggle('on', on); });
    nodes.forEach(n => {
      n.lit = litNodes.has(n.id); n.main = n.id === obj || (skill && n.lit);
      n.label.style.opacity = !any || n.lit ? 1 : 0.35;
      n.label.classList.toggle('hot', !!n.main);
    });
    links.forEach(l => { l.on = !any || (!skill && (l.a.id === obj || l.b.id === obj)); });
  }

  /* ---------------- frame loop ---------------- */
  const v = new THREE.Vector3();
  const TINT = { project: [new THREE.Color(MINT_HEX), new THREE.Color(0xd9f6e7)], role: [new THREE.Color(PURPLE_HEX), new THREE.Color(0xe7e1fc)], person: [new THREE.Color(0xd5d8d4), new THREE.Color(0xeceeea)] };
  const WHITE_C = new THREE.Color(0xffffff);
  const toScreen = p => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * stage.clientWidth, (-v.y * 0.5 + 0.5) * stage.clientHeight]; };
  const clock = new THREE.Clock();
  let time = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduceMotion) time += dt;
    if (!drag) azOff *= 1 - Math.min(1, dt * 3);             // a drag-turn springs back to square
    placeCamera(baseAz + azOff);
    // the selected object's disc rises into a pedestal and its model turns slowly; both ease back on close
    nodes.forEach(n => {
      const on = n.id === selected, ease = Math.min(1, dt * 4);
      n.lift += ((on ? 1 : 0) - n.lift) * ease;
      if (on && !reduceMotion) n.spin += dt * 0.7;
      else if (!on) { n.spin = Math.atan2(Math.sin(n.spin), Math.cos(n.spin)); n.spin -= n.spin * ease; }   // unwind the short way
      const h = 0.35 + n.lift * PEDESTAL;
      n.disc.scale.y = h / 0.35; n.disc.position.y = h / 2;
      n.model.position.y = h;
      n.model.rotation.y = (n.face ? baseAz + azOff : -0.25) + n.spin;
      n.top.y = n.topY + n.lift * PEDESTAL;
    });
    if (!reduceMotion) updaters.forEach(u => u(time, dt));

    const skill = skillHover || skillPinned;
    const hovered = labelHover || (hover && hover.id);
    const obj = skill ? null : hovered || selected;
    applyFocus(obj, skill);

    const k = Math.min(1, dt * 8);
    nodes.forEach(n => {
      n.discMat.color.lerp(n.main ? TINT[n.type][0] : n.lit ? TINT[n.type][1] : WHITE_C, k);
      let [x, y] = toScreen(n.anchor);
      const half = (n.labelW || 0) / 2 + 4;                     // keep labels inside the stage on narrow screens
      x = Math.max(half, Math.min(stage.clientWidth - half, x));
      n.label.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,0)`;
    });
    links.forEach(l => {
      const op = l.on ? 1 : 0.18;
      l.mat.opacity += (op - l.mat.opacity) * k; l.pmat.opacity = l.emat.opacity = l.mat.opacity;
      l.packets.forEach(m => {
        const u = reduceMotion ? m.userData.ph % 1 : (m.userData.ph + time * 4.5 / l.len) % 1;
        m.position.copy(l.p0).lerp(l.p1, u); m.position.y = 0.45;
        m.scale.setScalar(Math.min(1, u / 0.08, (1 - u) / 0.08));
      });
      const [x, y] = toScreen(l.mid);
      l.pill.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
      l.pill.style.opacity = compact ? (obj && l.on ? 1 : 0) : l.on ? 1 : 0.25;
    });
    if (!compact) tethers.forEach(th => {
      const c = chipPos[th.tag]; if (!c) return;
      const [sx, sy] = toScreen(th.port);
      const x0 = sx + stageX, y0 = sy + stageY, [x1, y1] = c, dy = (y0 - y1) * 0.55, f = v => v.toFixed(1);
      th.path.setAttribute('d', `M${f(x0)} ${f(y0)} C${f(x0)} ${f(y0 - dy)} ${f(x1)} ${f(y1 + dy)} ${f(x1)} ${f(y1)}`);
      th.dot.setAttribute('cx', f(x0)); th.dot.setAttribute('cy', f(y0));
    });

    // property panel follows the hovered object (desktop only; touch gets the card)
    const pn = !compact && hovered ? byId[hovered] : null;
    if (pn !== propsFor) { propsFor = pn; props.classList.toggle('on', !!pn); if (pn) props.innerHTML = propsHTML(pn); }
    if (pn) {
      const [x, y] = toScreen(pn.top);
      const w = props.offsetWidth, h = props.offsetHeight;
      let px = x + 70, py = y - 10;
      if (px + w > stage.clientWidth - 8) px = x - 70 - w;
      py = Math.max(8, Math.min(stage.clientHeight - h - 8, py));
      props.style.transform = `translate(${px.toFixed(0)}px,${py.toFixed(0)}px)`;
    }
    renderer.render(scene, camera);
  });
}
