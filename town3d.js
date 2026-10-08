// Delta Life 3D town (three.js from CDN). Walking is cosmetic; every reward is decided by the server.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const G = window.G;
export const PAL = {
  SKIN: ["#f1c9a5", "#d9a066", "#b87a4b", "#8d5524", "#5c3a21"],
  HAIR: ["#111111", "#3b2a20", "#8a5a2b", "#c9b037", "#b03030"],
  TOP: ["#e53935", "#1e88e5", "#43a047", "#fdd835", "#f5f5f5", "#8e24aa"],
  BOT: ["#263238", "#3949ab", "#6d4c41", "#9e9e9e"],
};
export const DEF = { skin: 3, hair: 0, hc: 0, top: 1, bot: 0, cap: 0 };
const TOD = [
  { sky: 0x9fd3f5, sun: 1.6, amb: 1.1, win: 0.05 },
  { sky: 0x7ec8f4, sun: 1.9, amb: 1.2, win: 0.05 },
  { sky: 0xe9965a, sun: 1.1, amb: 0.8, win: 0.5 },
  { sky: 0x0b1530, sun: 0.25, amb: 0.5, win: 1.3 },
];
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const bx = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const shade = (g) => g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
const dispose = (g) => g.traverse((o) => {
  if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
});
const label = (text) => {
  const t = text.length > 26 ? text.slice(0, 25) + "…" : text;
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(20,20,20,0.88)"; x.fillRect(0, 0, 256, 64);
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
  let size = 30; x.font = "bold " + size + "px sans-serif";
  while (x.measureText(t).width > 240 && size > 12) { size -= 2; x.font = "bold " + size + "px sans-serif"; }
  x.fillText(t, 128, 32);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
};
function buildPlayer(v) {
  const P = { ...DEF, ...v };
  const sk = PAL.SKIN[P.skin], hc = PAL.HAIR[P.hc], tp = PAL.TOP[P.top], bt = PAL.BOT[P.bot];
  const g = new THREE.Group();
  const add = (p, geo, col, x, y, z) => { const m = new THREE.Mesh(geo, std(col)); m.position.set(x, y, z); p.add(m); return m; };
  const limb = (x, y, parts) => {
    const l = new THREE.Group(); l.position.set(x, y, 0);
    parts.forEach(([w, h, d, col, py]) => add(l, new THREE.BoxGeometry(w, h, d), col, 0, py, 0));
    g.add(l); return l;
  };
  const legs = [limb(-0.17, 0.8, [[0.28, 0.8, 0.3, bt, -0.4]]), limb(0.17, 0.8, [[0.28, 0.8, 0.3, bt, -0.4]])];
  const arm = [[0.2, 0.35, 0.22, tp, -0.17], [0.2, 0.35, 0.2, sk, -0.52]];
  const arms = [limb(-0.46, 1.55, arm), limb(0.46, 1.55, arm)];
  add(g, new THREE.BoxGeometry(0.7, 0.8, 0.36), tp, 0, 1.2, 0);
  add(g, new THREE.SphereGeometry(0.25, 16, 12), sk, 0, 1.95, 0);
  add(g, new THREE.SphereGeometry(0.035, 8, 8), "#111", -0.09, 1.98, 0.23);
  add(g, new THREE.SphereGeometry(0.035, 8, 8), "#111", 0.09, 1.98, 0.23);
  if (P.hair === 1) add(g, new THREE.SphereGeometry(0.36, 16, 12), hc, 0, 2.05, -0.1);
  if (P.hair === 0 || P.hair === 2) add(g, new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hc, 0, 1.97, -0.02);
  if (P.hair === 2) [-0.18, -0.06, 0.06, 0.18].forEach((x) => add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), hc, x, 1.8, -0.22));
  if (P.cap) {
    const cc = PAL.TOP[(P.top + 2) % 6];
    add(g, new THREE.SphereGeometry(0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), cc, 0, 2.0, 0);
    add(g, new THREE.BoxGeometry(0.3, 0.03, 0.2), cc, 0, 2.02, 0.3);
  }
  shade(g);
  return { g, legs, arms };
}
function spotsOf(s) {
  const P = G.L[s.l];
  return [
    ...P.a.map((a, i) => ({ label: a[0], cmd: { t: "act", i }, color: a[1] > 0 ? "#2e7d6b" : a[3] >= 25 ? "#d9822b" : "#6a7fb5" })),
    ...(s.edu && s.edu.town === s.l
      ? [{ label: "Attend class", cmd: { t: "cls" }, color: "#8e5ad7" }]
      : !s.edu ? P.sch.map((c, i) => ({ label: "Enroll: " + c[3], cmd: { t: "enroll", i }, color: "#8e5ad7" })) : []),
    { label: "Buy a shop", cmd: { t: "shop" }, color: "#c2185b" },
    { label: "Hotel: sleep", cmd: { t: "hotel" }, color: "#c99a16" },
  ];
}
function buildWorld(spots, town) {
  const w = new THREE.Group();
  const rows = Math.ceil(spots.length / 2);
  const zEnd = -8 - (rows - 1) * 14 - 22, len = 26 - zEnd, cz = (26 + zEnd) / 2;
  const flat = (pw, ph, col, x, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), std(col)); m.rotation.x = -Math.PI / 2; m.position.set(x, y, cz); m.receiveShadow = true; w.add(m);
  };
  flat(200, len + 60, 0x6fae5a, 0, 0); flat(8, len, 0x3a3d42, 0, 0.01);
  flat(3, len, 0xb9b6ab, -5.5, 0.02); flat(3, len, 0xb9b6ab, 5.5, 0.02);
  for (let z = 22; z > zEnd; z -= 5) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 2), std(0xf2e6a8)); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.03, z); w.add(d); }
  const winMat = std(0xcfe8ff, { emissive: 0xcfe8ff, emissiveIntensity: 0.05 });
  const triggers = [], solids = [];
  spots.forEach((sp, i) => {
    const sx = i % 2 === 0 ? -1 : 1, zc = -8 - Math.floor(i / 2) * 14, bh = 4.5 + (i % 3) * 1.2;
    const b = bx(7, bh, 7, std(sp.color)); b.position.set(sx * 11, bh / 2, zc); w.add(b);
    const roof = bx(7.4, 0.35, 7.4, std(0x2b2f36)); roof.position.set(sx * 11, bh + 0.17, zc); w.add(roof);
    const door = bx(0.1, 2.2, 1.4, std(0x3b2a20)); door.position.set(sx * 7.45, 1.1, zc); w.add(door);
    for (let r = 0; r < 2; r++) for (let c = -1; c <= 1; c += 2) {
      if (bh < 3.5 + r * 2) continue;
      const win = bx(0.06, 0.9, 1.2, winMat); win.position.set(sx * 7.47, 2.9 + r * 1.5, zc + c * 1.9); w.add(win);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshBasicMaterial({ map: label(sp.label) }));
    sign.position.set(sx * 7.42, 2.65, zc); sign.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; w.add(sign);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.4, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(sx * 5.2, 0.06, zc); w.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
    beam.position.set(sx * 5.2, 1.5, zc); w.add(beam);
    triggers.push({ x: sx * 5.2, z: zc, cmd: sp.cmd, ring });
    solids.push({ x0: sx < 0 ? -14.5 : 7.5, x1: sx < 0 ? -7.5 : 14.5, z0: zc - 3.5, z1: zc + 3.5 });
  });
  for (let z = 18; z > zEnd; z -= 14) [-1, 1].forEach((sx) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 8), std(0x444a52)); pole.position.set(sx * 6.9, 2.5, z); w.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), std(0xfff2b0, { emissive: 0xfff2b0, emissiveIntensity: 0.8 })); lamp.position.set(sx * 6.9, 5.1, z); w.add(lamp);
  });
  for (let k = 0; k < 18; k++) {
    const x = (k % 2 ? 1 : -1) * (17 + Math.random() * 9), z = 20 - Math.random() * (len + 10);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 4.2, 8), std(0x7a5a3a)); trunk.position.set(x, 2.1, z); w.add(trunk);
    for (let f = 0; f < 6; f++) {
      const fr = bx(0.35, 0.06, 2.4, std(0x2f8f46)); fr.position.set(x, 4.3, z); fr.rotation.y = (f / 6) * Math.PI * 2; fr.rotation.x = 0.35; fr.translateZ(1.1); w.add(fr);
    }
  }
  const bill = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({ map: label("WELCOME TO " + town.toUpperCase()) }));
  bill.position.set(-5.8, 3.2, 17); bill.rotation.y = Math.PI / 2; w.add(bill);
  const cars = [];
  [0xc62828, 0x1565c0, 0xf9a825, 0xeeeeee].forEach((col, i) => {
    const c = new THREE.Group();
    const body = bx(1.8, 0.7, 3.8, std(col)); body.position.y = 0.65; c.add(body);
    const cab = bx(1.5, 0.6, 1.9, std(0x20262d)); cab.position.set(0, 1.25, -0.2); c.add(cab);
    [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]].forEach(([x, z]) => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), std(0x111111)); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.35, z); c.add(wh); });
    const dir = i % 2 ? 1 : -1;
    c.position.set(dir * 2, 0, 10 - i * 22); c.userData = { v: dir * (0.12 + i * 0.02) }; c.rotation.y = dir > 0 ? 0 : Math.PI;
    w.add(c); cars.push(c);
  });
  shade(w);
  return { w, triggers, solids, cars, winMat, zMin: zEnd + 10, zEnd };
}
function makeRenderer(host) {
  try {
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.domElement.style.cssText = "display:block;width:100%";
    host.appendChild(r.domElement);
    return r;
  } catch (e) { host.textContent = "3D is not supported on this device. Use the List view."; return null; }
}
export function mountTown(host, cb) {
  const renderer = makeRenderer(host);
  if (!renderer) return { update() {}, pause() {}, destroy() {} };
  host.style.position = "relative";
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x556655, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 90 });
  scene.add(hemi, sun, sun.target);
  const pg = new THREE.Group(); scene.add(pg);
  let world = null, pl = null, raf = 0, paused = false;
  const cur = { sig: "", town: "", av: "", tod: 0 };
  const st = { x: 0, z: 14, yaw: Math.PI, ph: 0, cd: 0, walk: 0, t: 0 };
  const keys = {}, joy = { x: 0, y: 0 };
  const resize = () => { const w = host.clientWidth || 360, h = Math.round(w * 0.9); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const setTod = (t) => {
    cur.tod = t; const c = TOD[t] || TOD[0];
    scene.background = new THREE.Color(c.sky); scene.fog = new THREE.Fog(c.sky, 35, 95);
    sun.intensity = c.sun; hemi.intensity = c.amb; if (world) world.winMat.emissiveIntensity = c.win;
  };
  const ui = document.createElement("div");
  ui.style.cssText = "position:absolute;left:12px;bottom:34px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.55);touch-action:none";
  const kn = document.createElement("div");
  kn.style.cssText = "position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.8);pointer-events:none";
  ui.appendChild(kn);
  const hint = document.createElement("div");
  hint.style.cssText = "position:absolute;left:0;right:0;bottom:0;padding:4px 10px;font-size:.75rem;color:#fff;background:rgba(0,0,0,.45)";
  hint.textContent = "Walk into a glowing yellow marker. Stick, arrow keys or WASD to move.";
  host.append(ui, hint);
  let drag = false;
  const stick = (e) => {
    const r = ui.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    joy.x = dx; joy.y = dy; kn.style.transform = "translate(" + dx * 30 + "px," + dy * 30 + "px)";
  };
  const rel = () => { drag = false; joy.x = 0; joy.y = 0; kn.style.transform = "translate(0,0)"; };
  ui.addEventListener("pointerdown", (e) => { drag = true; ui.setPointerCapture(e.pointerId); stick(e); });
  ui.addEventListener("pointermove", (e) => { if (drag) stick(e); });
  ui.addEventListener("pointerup", rel); ui.addEventListener("pointercancel", rel);
  const names = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
  const down = (e) => {
    if (paused || (e.target && e.target.tagName === "INPUT")) return;
    const k = e.key.toLowerCase(); if (names.includes(k)) { keys[k] = true; e.preventDefault(); }
  };
  const up = (e) => { keys[e.key.toLowerCase()] = false; };
  window.addEventListener("keydown", down); window.addEventListener("keyup", up);
  const blocked = (x, z) => world.solids.some((b) => x + 0.4 > b.x0 && x - 0.4 < b.x1 && z + 0.4 > b.z0 && z - 0.4 < b.z1);
  const loop = () => {
    raf = paused ? 0 : requestAnimationFrame(loop);
    if (paused || !world || !pl) return;
    let vx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0) + joy.x;
    let vz = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0) + joy.y;
    const m = Math.hypot(vx, vz);
    st.t += 0.016;
    if (m > 0.08) {
      const sp = 0.13 * Math.min(1, m); vx /= m; vz /= m;
      const nx = st.x + vx * sp, nz = st.z + vz * sp;
      if (!blocked(nx, st.z) && Math.abs(nx) < 30) st.x = nx;
      if (!blocked(st.x, nz) && nz > world.zMin && nz < 24) st.z = nz;
      let d = Math.atan2(vx, vz) - st.yaw;
      while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      st.yaw += d * 0.2; st.ph += 0.28 * Math.min(1, m + 0.3); st.walk = Math.min(1, st.walk + 0.15);
    } else st.walk = Math.max(0, st.walk - 0.12);
    const sw = Math.sin(st.ph) * 0.8 * st.walk;
    pl.legs[0].rotation.x = sw; pl.legs[1].rotation.x = -sw; pl.arms[0].rotation.x = -sw; pl.arms[1].rotation.x = sw;
    pl.g.position.y = Math.abs(Math.sin(st.ph)) * 0.07 * st.walk;
    pg.position.set(st.x, 0, st.z); pg.rotation.y = st.yaw;
    if (st.cd > 0) st.cd--;
    world.triggers.forEach((t) => {
      t.ring.scale.setScalar(1 + Math.sin(st.t * 4) * 0.08);
      if (st.cd === 0 && !cb.busy() && Math.hypot(st.x - t.x, st.z - t.z) < 1.8) { st.cd = 120; st.x = t.x * 0.45; cb.cmd(t.cmd); }
    });
    world.cars.forEach((c) => { c.position.z += c.userData.v; if (c.position.z < world.zEnd) c.position.z = 28; if (c.position.z > 28) c.position.z = world.zEnd; });
    cam.position.lerp(new THREE.Vector3(st.x * 0.7, 5.6, st.z + 8.6), 0.1);
    cam.lookAt(st.x * 0.7, 1.4, st.z - 4);
    sun.position.set(st.x + 14, 26, st.z + 10); sun.target.position.set(st.x, 0, st.z);
    renderer.render(scene, cam);
  };
  cam.position.set(0, 5.6, 22);
  loop();
  return {
    update(s, av) {
      const sp = spotsOf(s), sig = s.l + "|" + sp.map((x) => x.label).join("|");
      if (sig !== cur.sig) {
        cur.sig = sig;
        if (s.l !== cur.town) { cur.town = s.l; st.x = 0; st.z = 14; }
        if (world) { scene.remove(world.w); dispose(world.w); }
        world = buildWorld(sp, s.l); scene.add(world.w);
      }
      const as = JSON.stringify(av || DEF);
      if (as !== cur.av) { cur.av = as; if (pl) { pg.remove(pl.g); dispose(pl.g); } pl = buildPlayer(av || DEF); pg.add(pl.g); }
      setTod(s.t);
    },
    pause(p) { paused = p; if (!p && !raf) loop(); },
    destroy() {
      paused = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      if (world) dispose(world.w); if (pl) dispose(pl.g); renderer.dispose(); host.innerHTML = "";
    },
  };
}
export function mountPreview(host) {
  const renderer = makeRenderer(host);
  if (!renderer) return { update() {} };
  renderer.setSize(220, 220, false); renderer.domElement.style.width = "220px"; renderer.domElement.style.margin = "0 auto";
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fd3f5);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); cam.position.set(0, 1.5, 4.2); cam.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x667766, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(3, 6, 5); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), std(0x6fae5a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const pg = new THREE.Group(); scene.add(pg);
  let pl = null, t = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!host.isConnected || host.offsetParent === null || !pl) return;
    t += 0.02; pg.rotation.y = t; const sw = Math.sin(t * 8) * 0.5;
    pl.legs[0].rotation.x = sw; pl.legs[1].rotation.x = -sw; pl.arms[0].rotation.x = -sw; pl.arms[1].rotation.x = sw;
    renderer.render(scene, cam);
  };
  loop();
  return { update(av) { if (pl) { pg.remove(pl.g); dispose(pl.g); } pl = buildPlayer(av); pg.add(pl.g); } };
}
