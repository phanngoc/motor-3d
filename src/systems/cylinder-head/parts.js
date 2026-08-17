/**
 * parts.js — Định nghĩa toàn bộ chi tiết của hệ thống đầu bò.
 *
 * Mỗi PartDef.build() trả về một Object3D với hình học ĐÃ NẰM ĐÚNG VỊ TRÍ LẮP
 * (world coords). Những chi tiết chuyển động khi máy chạy khai báo thêm:
 *   - `pivot`            : trục quay (engine bọc trong Group đặt tại pivot)
 *   - `userData.nodes`   : node con mà kinematics.js tác động (lò xo bị nén,
 *                          piston trượt, tay biên nghiêng, dây cam chạy)
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, slot, extrudeY, extrudeX, lathe, rod,
  tubeSolid, hexPrism, boltGeo, coilSpring, camLobeShape, sprocketShape, annularSector,
  union, mesh, pattern, place, twoPulleyLoop, threadHelix,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, valveAxis, rockerGeom, loboNoseAt, CAM_PR, CRANK_PR } from './layout.js';

const V = L.valves;
export const AX = { intake: valveAxis(V.intake), exhaust: valveAxis(V.exhaust) };
const KEYS = ['intake', 'exhaust'];

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

/** Mặt phẳng shape của extrudeX ứng với world: u = -z, v = y. */
const uv = (y, z) => [-z, y];

/** Khối hộp: w theo X, h theo Y, d theo Z; tâm tại gốc toạ độ. */
const box = (w, h, d, r = 0.4) =>
  place(extrudeY(roundedRect(w, d, r), h, { bevel: Math.min(r, 0.3) }), { y: -h / 2 });

/** Trụ nằm theo trục X, từ x0 đến x1, tại độ cao y và z. */
const xRod = (r, x0, x1, y = 0, z = 0, segs = 28) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Ống nằm theo trục X. */
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 28) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Điểm trên trục xupap, cách đỉnh thân `d` mm về phía đế. */
const alongStem = (v, ax, d) => ({ y: v.tip[0] - ax.ay * d, z: v.tip[1] - ax.az * d });

/** Điểm trên trục xupap tại độ cao world y. */
const atY = (v, ax, y) => ({ y, z: v.seat[1] + ax.az * ((y - v.seat[0]) / ax.ay) });

/** Độ dài đoạn trục xupap giữa 2 độ cao world. */
const spanY = (ax, y0, y1) => (y1 - y0) / ax.ay;

/** Dải (thanh nối) giữa 2 điểm trong shape-space. */
function strip([u1, v1], [u2, v2], w1, w2 = w1) {
  const du = u2 - u1, dv = v2 - v1;
  const len = Math.hypot(du, dv) || 1;
  const nu = -dv / len, nv = du / len;
  const s = new THREE.Shape();
  s.moveTo(u1 + nu * w1 / 2, v1 + nv * w1 / 2);
  s.lineTo(u2 + nu * w2 / 2, v2 + nv * w2 / 2);
  s.lineTo(u2 - nu * w2 / 2, v2 - nv * w2 / 2);
  s.lineTo(u1 - nu * w1 / 2, v1 - nv * w1 / 2);
  s.closePath();
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐẦU BÒ (thân đúc)
// ─────────────────────────────────────────────────────────────────────────────

function headFootprint({ chamber = true, pockets = false, grow = 0 } = {}) {
  const h = L.head;
  const s = roundedRect(h.w + grow * 2, h.d + grow * 2, h.r + grow);
  for (const [x, z] of h.boltPos) bore(s, h.boltD / 2 + 0.35, x, z);
  slot(s, h.tunnel.w, h.tunnel.d, 6, h.tunnel.x, h.tunnel.z);
  if (chamber) bore(s, h.chamberR, 0, 0);
  if (pockets) {
    for (const k of KEYS) {
      const p = alongStem(V[k], AX[k], V[k].springSeatBelowTip);
      bore(s, 10.5, 0, p.z);
    }
  }
  return s;
}

/**
 * Khối vật liệu NẰM TRÊN mặt cầu buồng đốt (y = 0..34).
 * Profile được duyệt ngược chiều kim đồng hồ trong mặt phẳng (r,y) để pháp tuyến
 * của mặt cầu hướng XUỐNG (vào buồng đốt) — xem chú thích trong geom.js.
 */
function chamberBlock() {
  const R = L.head.chamberR, dep = L.head.chamberDepth, top = 34;
  const prof = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * R;
    prof.push([r, dep * (1 - (r / R) ** 2)]);
  }
  prof.push([R, top], [0, top]);
  return lathe(prof, 64);
}

function headCasting() {
  const h = L.head;
  const CS = { curveSegments: 9 };            // thân đúc nhiều lỗ -> giữ segment thấp
  const g = [];
  // Thân dưới + tầng bệ lò xo
  g.push(extrudeY(headFootprint({ chamber: true }), h.lowerTop - 6, { ...CS, bevel: 2 }));
  g.push(place(extrudeY(headFootprint({ chamber: false, pockets: true }), 6, { ...CS, bevel: 1 }),
    { y: h.lowerTop - 6 }));
  g.push(chamberBlock());

  // Cánh tản nhiệt
  for (let i = 0; i < h.finCount; i++) {
    g.push(place(extrudeY(headFootprint({ chamber: true, grow: 5 - i * 0.35 }), 2.1, CS),
      { y: 4 + i * 4.2 }));
  }

  // 2 vách ổ đỡ trục cam + trục cò mổ
  for (const [x0, x1] of h.bulkheads) {
    const s = roundedRect(66, h.boxTop - h.lowerTop, 6, -1, (h.lowerTop + h.boxTop) / 2);
    bore(s, L.cam.journalR + 0.3, ...uv(L.cam.y, L.cam.z));
    for (const k of KEYS) bore(s, L.rocker.shaftR + 0.25, ...uv(V[k].pivot[0], V[k].pivot[1]));
    g.push(place(extrudeX(s, x1 - x0, { bevel: 1, curveSegments: 18 }), { x: x0 }));
  }

  // 2 thanh bệ hông nối 2 vách + vành mặt lắp nắp
  for (const z of [-33, 34]) {
    g.push(place(extrudeY(roundedRect(h.w - 6, 5, 2.5, 0, z), 22, { ...CS, bevel: 1 }), { y: h.lowerTop }));
  }
  g.push(place(extrudeY(headFootprint({ chamber: false }), 4, { ...CS, bevel: 1.2 }), { y: h.boxTop - 4 }));

  // Bệ xupap (vành thép ép vào nhôm)
  for (const k of KEYS) {
    const v = V[k], ax = AX[k];
    const r = v.headD / 2 + 1.3;
    g.push(place(lathe([[v.headD / 2 - 1, 0], [r, 0], [r, 3], [v.headD / 2 - 1, 3],
      [v.headD / 2 - 1, 0]], 40), { rx: ax.cant, y: v.seat[0], z: v.seat[1] }));
  }
  return new THREE.Group().add(mesh(union(g), MAT.alu, 'head'));
}

// ─────────────────────────────────────────────────────────────────────────────
// TRỤC CAM & NHÔNG CAM
// ─────────────────────────────────────────────────────────────────────────────

function camshaftGeo() {
  const c = L.cam, y = c.y, z = c.z;
  const g = [
    xRod(c.shaftR, c.x0, c.x1, y, z),
    xRod(c.journalR, -23.5, -14.5, y, z),      // cổ trục trái
    xRod(c.journalR, 14.5, 23.5, y, z),        // cổ trục phải
    xRod(11, c.x0, c.x0 + 4, y, z),            // mặt bích bắt nhông
  ];
  for (const k of KEYS) {
    const v = V[k];
    const s = camLobeShape(c.rb, c.lift, c.half, loboNoseAt(v), 220);
    g.push(place(extrudeX(s, v.lobeX[1] - v.lobeX[0], { bevel: 0.4 }), { x: v.lobeX[0], y, z }));
  }
  return new THREE.Group().add(mesh(union(g), MAT.steel, 'camshaft'));
}

function camSprocketGeo() {
  const sp = L.camSprocket, y = L.cam.y, z = L.cam.z;
  const { shape } = sprocketShape(sp.teeth, sp.pitch, L.chainRoller, sp.hubR);
  const x0 = sp.x - sp.w / 2;
  const g = [
    place(extrudeX(shape, sp.w, { bevel: 0.6, curveSegments: 4 }), { x: x0, y, z }),
    xTube(13.5, sp.hubR, x0, x0 + sp.w, y, z),
    // 2 bu lông bắt nhông vào mặt bích trục cam
    place(boltGeo(6, 9, { headAF: 9, headH: 4 }), { rz: -Math.PI / 2, x: x0, y: y + 11, z }),
    place(boltGeo(6, 9, { headAF: 9, headH: 4 }), { rz: -Math.PI / 2, x: x0, y: y - 11, z }),
    // Dấu chỉ thị điểm chết trên
    place(box(2.4, 8, 2.4), { x: sp.x, y: y + CAM_PR - 4, z }),
  ];
  return new THREE.Group().add(mesh(union(g), MAT.blackOxide, 'cam-sprocket'));
}

// ─────────────────────────────────────────────────────────────────────────────
// CÒ MỔ + TRỤC CÒ MỔ
// ─────────────────────────────────────────────────────────────────────────────

function rockerArmGeo(k) {
  const v = V[k];
  const W = L.rocker.armW;
  const P = uv(v.pivot[0], v.pivot[1]);
  const A = uv(66.5 + 1.6, v.padZ);            // tâm má con lăn
  const B = uv(v.tip[0] + 3.2, v.tip[1]);      // tâm bệ vít điều chỉnh
  const shapes = [
    bore(circleShape(7.4, P[0], P[1]), L.rocker.shaftR + 0.18, P[0], P[1]),
    strip(P, A, 8.0, 7.0),
    strip(P, B, 8.0, 6.4),
    bore(circleShape(5.8, B[0], B[1]), 2.65, B[0], B[1]),
  ];
  const body = mesh(union(shapes.map((s) =>
    place(extrudeX(s, W, { bevel: 0.8, curveSegments: 22 }), { x: v.rockerX - W / 2 }))),
  MAT.steel, `rocker-${k}`);

  // Mặt làm việc tiếp xúc vấu cam (thép tôi)
  const pad = mesh(place(box(W + 0.8, 2.4, 11.5, 0.8),
    { x: v.rockerX, y: 66.5 + 1.2, z: v.padZ }), MAT.hardened, `pad-${k}`);

  // Vít điều chỉnh khe hở nhiệt + đai ốc chặn
  const screw = mesh(union([
    place(rod(2.5, 0, 12, 16), { x: v.rockerX, y: v.tip[0], z: v.tip[1] }),
    place(threadHelix(2.5, 0.34, 11, 1.1), { x: v.rockerX, y: v.tip[0] + 0.5, z: v.tip[1] }),
    place(lathe([[0, 0], [3.5, 0], [3.5, 1.5], [0, 1.5]], 20),
      { x: v.rockerX, y: v.tip[0] - 1.5, z: v.tip[1] }),
  ]), MAT.blackOxide, `adjuster-${k}`);
  const nut = mesh(place(hexPrism(8, 3.2, 2.6),
    { x: v.rockerX, y: v.tip[0] + 8.2, z: v.tip[1] }), MAT.blackOxide, `locknut-${k}`);

  return new THREE.Group().add(body, pad, screw, nut);
}

function rockerShaftGeo(k) {
  const v = V[k];
  const [x0, x1] = L.rocker.shaftX;
  const y = v.pivot[0], z = v.pivot[1];
  return new THREE.Group().add(mesh(union([
    xRod(L.rocker.shaftR, x0, x1, y, z, 20),
    xRod(L.rocker.shaftR + 1.6, x1, x1 + 3.5, y, z, 20),   // đầu có vành để bắt vít kéo
  ]), MAT.steel, `rocker-shaft-${k}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// XUPAP · LÒ XO · ĐĨA CHẶN · MÓNG GÀ
// ─────────────────────────────────────────────────────────────────────────────

function valveGeo(k) {
  const v = V[k], ax = AX[k];
  const rs = v.stemD / 2, rh = v.headD / 2, top = ax.len;
  const prof = [
    [0, 0], [rh, 0.5], [rh, 2.0],                       // mặt nấm
    [rs + 0.9, 5.2], [rs, 8.4],                         // vát 45 độ -> thân
    [rs, top - 10.5],
    [rs - 0.6, top - 9.0], [rs - 0.6, top - 7.2], [rs, top - 5.8],   // rãnh móng gà
    [rs, top], [0, top],
  ];
  return new THREE.Group().add(mesh(
    place(lathe(prof, 44), { rx: ax.cant, y: v.seat[0], z: v.seat[1] }),
    MAT.valveFace, `valve-${k}`));
}

function springsGeo(k) {
  const v = V[k], ax = AX[k];
  const seat = alongStem(v, ax, v.springSeatBelowTip);
  const l0 = v.springSeatBelowTip - v.retainerBelowTip;
  const scaler = new THREE.Group();
  scaler.name = 'springScale';
  scaler.add(
    mesh(coilSpring(v.springOuter.rMean, v.springOuter.wire, v.springOuter.coils, l0),
      MAT.spring, `spring-out-${k}`),
    mesh(coilSpring(v.springInner.rMean, v.springInner.wire, v.springInner.coils, l0),
      MAT.spring, `spring-in-${k}`),
  );
  const holder = new THREE.Group();
  holder.rotation.x = ax.cant;
  holder.position.set(0, seat.y, seat.z);
  holder.add(scaler);
  // Vành đế lò xo
  holder.add(mesh(lathe([[v.stemD / 2 + 1.4, 0], [11, 0], [11, 1.6],
    [v.stemD / 2 + 1.4, 1.6], [v.stemD / 2 + 1.4, 0]], 36), MAT.steel, `spring-seat-${k}`));

  const grp = new THREE.Group();
  grp.add(holder);
  grp.userData.nodes = { spring: scaler, l0 };
  return grp;
}

function retainerGeo(k) {
  const v = V[k], ax = AX[k];
  const p = alongStem(v, ax, v.retainerBelowTip);
  const rs = v.stemD / 2;
  // Vành khăn có lỗ côn: rộng ở dưới, hẹp ở trên -> lực lò xo ép chặt móng gà
  const g = lathe([
    [rs + 2.7, 0], [10.4, 0], [10.4, 2.6], [rs + 0.2, 2.6], [rs + 2.7, 0],
  ], 40);
  return new THREE.Group().add(mesh(place(g, { rx: ax.cant, y: p.y, z: p.z }),
    MAT.steel, `retainer-${k}`));
}

function cottersGeo(k) {
  const v = V[k], ax = AX[k];
  const p = alongStem(v, ax, v.retainerBelowTip + 0.15);
  const rs = v.stemD / 2;
  const g = [0, Math.PI].map((a0) =>
    place(extrudeY(annularSector(rs - 0.25, rs + 2.4, a0 + 0.05, a0 + Math.PI - 0.05), 2.3),
      { rx: ax.cant, y: p.y, z: p.z }));
  return new THREE.Group().add(mesh(union(g), MAT.hardened, `cotter-${k}`));
}

const guidesGeo = () => new THREE.Group().add(mesh(union(KEYS.map((k) => {
  const v = V[k], ax = AX[k];
  const a = atY(v, ax, v.guideY[0]);
  return place(tubeSolid(4.4, v.stemD / 2 + 0.07, 0, spanY(ax, v.guideY[0], v.guideY[1]), 24),
    { rx: ax.cant, y: a.y, z: a.z });
})), MAT.bronze, 'valve-guides'));

const stemSealsGeo = () => new THREE.Group().add(mesh(union(KEYS.map((k) => {
  const v = V[k], ax = AX[k];
  const a = atY(v, ax, v.guideY[1]);
  return place(tubeSolid(4.9, v.stemD / 2 + 0.03, 0, 3.4, 24), { rx: ax.cant, y: a.y, z: a.z });
})), MAT.rubber, 'stem-seals'));

// ─────────────────────────────────────────────────────────────────────────────
// NẮP ĐẦU BÒ · GIOĂNG · BU LÔNG · BUGI
// ─────────────────────────────────────────────────────────────────────────────

const COVER_BOLTS = [[34, 30], [-34, 30], [34, -30], [-34, -30]];

function coverGeo() {
  const h = L.head, c = L.cover;
  const top = roundedRect(h.w, h.d, h.r);
  for (const [x, z] of COVER_BOLTS) bore(top, 3.3, x, z);
  const g = [place(extrudeY(top, 4, { bevel: 1.4 }), { y: c.y0 + c.h - 4 })];

  // Váy quanh chu vi
  const skirt = roundedRect(h.w, h.d, h.r);
  const inner = roundedRect(h.w - 9, h.d - 9, h.r - 4);
  skirt.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  g.push(place(extrudeY(skirt, c.h - 4), { y: c.y0 }));

  // Bệ ren của 2 nắp che cò
  for (const k of KEYS) {
    const v = V[k];
    g.push(place(lathe([[9.4, 0], [11.5, 0], [11.5, 5.5], [9.4, 5.5], [9.4, 0]], 32),
      { x: v.rockerX, y: c.y0 + c.h - 1, z: v.tip[1] }));
  }
  return new THREE.Group().add(mesh(union(g), MAT.aluPolish, 'head-cover'));
}

// Thân bu lông phải xuyên qua nắp (y 80..96) và ăn ren vào đầu bò (dưới y=80).
const coverBoltsGeo = () => new THREE.Group().add(mesh(pattern(
  () => boltGeo(6, 20, { headAF: 10, headH: 5, flange: 1.3, threadLen: 8 }),
  COVER_BOLTS.map(([x, z]) => [x, L.cover.y0 - 4, z]),
), MAT.blackOxide, 'cover-bolts'));

function tappetCapsGeo() {
  const c = L.cover;
  return new THREE.Group().add(mesh(union(KEYS.map((k) => {
    const v = V[k];
    return place(union([
      lathe([[0, 0], [9.3, 0], [9.3, 3.4], [0, 3.4]], 32),
      box(3.6, 1.6, 15, 0.3).translate(0, 4.0, 0),      // rãnh mở bằng tuốc-nơ-vít
    ]), { x: v.rockerX, y: c.y0 + c.h + 1.5, z: v.tip[1] });
  })), MAT.aluPolish, 'tappet-caps'));
}

function headGasketGeo() {
  const h = L.head;
  const s = roundedRect(h.w, h.d, h.r);
  for (const [x, z] of h.boltPos) bore(s, h.boltD / 2 + 0.8, x, z);
  slot(s, h.tunnel.w + 1, h.tunnel.d + 1, 6, h.tunnel.x, h.tunnel.z);
  bore(s, L.bore / 2 - 0.5, 0, 0);
  return new THREE.Group().add(mesh(place(extrudeY(s, 1.2), { y: -1.2 }), MAT.gasket, 'head-gasket'));
}

function coverGasketGeo() {
  const h = L.head;
  const s = roundedRect(h.w - 3, h.d - 3, h.r - 1);
  const inner = roundedRect(h.w - 11, h.d - 11, h.r - 5);
  s.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  return new THREE.Group().add(mesh(place(extrudeY(s, 2), { y: L.cover.y0 - 2 }),
    MAT.rubber, 'cover-gasket'));
}

const headBoltsGeo = () => new THREE.Group().add(mesh(pattern(
  () => boltGeo(L.head.boltD, 48, { headAF: 12, headH: 6, flange: 1.6, threadLen: 16 }),
  L.head.boltPos.map(([x, z]) => [x, -8, z]),
), MAT.blackOxide, 'head-bolts'));

function sparkPlugGeo() {
  const p = L.plug;
  const dx = p.out[0] - p.tip[0], dy = p.out[1] - p.tip[1];
  const len = Math.hypot(dx, dy);
  const rz = Math.atan2(-dx / len, dy / len);   // +Y cục bộ -> hướng ra ngoài
  const parts = [
    mesh(union([
      lathe([[0, 1.5], [1.6, 1.5], [1.6, 3.0], [p.threadD / 2, 4.2],
        [p.threadD / 2, 19], [0, 19]], 28),
      threadHelix(p.threadD / 2, 0.42, 14, 1.2, 4.4),
    ]), MAT.steel, 'plug-body'),
    mesh(hexPrism(p.hexAF, 8, 0).translate(0, 19, 0), MAT.steel, 'plug-hex'),
    mesh(lathe([[0, 0], [7.2, 0], [7.2, 3.5], [5.6, 5.5], [5.6, 18],
      [4.4, 20], [4.4, 24], [0, 24]], 28).translate(0, 27, 0), MAT.ceramic, 'plug-insulator'),
    mesh(lathe([[0, 0], [3.3, 0], [3.3, 4.5], [0, 4.5]], 20).translate(0, 51, 0),
      MAT.copper, 'plug-terminal'),
    mesh(rod(0.85, -3.5, 2, 12), MAT.steel, 'plug-electrode'),
    mesh(place(box(1.5, 4.6, 1.8), { y: -1.6, z: 3.4 }), MAT.steel, 'plug-ground'),
  ];
  const holder = new THREE.Group();
  holder.rotation.z = rz;
  holder.position.set(p.tip[0], p.tip[1], 0);
  holder.add(...parts);
  return new THREE.Group().add(holder);
}

// ─────────────────────────────────────────────────────────────────────────────
// DÂY CAM · CĂN CAM · DẪN HƯỚNG
// ─────────────────────────────────────────────────────────────────────────────

/** Vòng chạy của dây cam, làm việc trong mặt phẳng (a,b) = (z,y) tại x = L.chainX. */
export const CHAIN = twoPulleyLoop([L.cam.z, L.cam.y], CAM_PR, [0, L.crankY], CRANK_PR, 1);
export const CHAIN_LINKS = Math.round(CHAIN.length / L.camSprocket.pitch);
/** Quãng đường xích chạy ứng với 1 radian trục cam (ăn khớp theo dây cung). */
export const CHAIN_MM_PER_RAD = (L.camSprocket.teeth * L.camSprocket.pitch) / TAU;

/** segs[1] = nhánh -Z (căng), segs[3] = nhánh +Z (lỏng). */
const run = (side) => (side > 0 ? CHAIN.segs[3] : CHAIN.segs[1]);
/** Toạ độ z của nhánh xích tại độ cao y. */
function runZ(side, y) {
  const s = run(side);
  const [z0, y0] = s.p, [z1, y1] = s.q;
  return z0 + (z1 - z0) * ((y - y0) / (y1 - y0));
}

function chainGeo() {
  const pitch = L.camSprocket.pitch;
  // 80 instance -> mỗi mắt xích phải thật gọn. Má xích không bo góc, con lăn 8 mặt.
  const link = union([
    place(box(1.3, 7.6, pitch + 1.7, 0), { x: -2.5 }),
    place(box(1.3, 7.6, pitch + 1.7, 0), { x: 2.5 }),
    xRod(L.chainRoller, -2.6, 2.6, 0, -pitch / 2, 8),
    xRod(L.chainRoller, -2.6, 2.6, 0, pitch / 2, 8),
  ]);
  const im = new THREE.InstancedMesh(link, MAT.blackOxide, CHAIN_LINKS);
  im.name = 'cam-chain';
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  const grp = new THREE.Group();
  grp.add(im);
  grp.userData.nodes = { chain: im, links: CHAIN_LINKS };
  return grp;
}

function bladeTube(side, y0, y1, offset, bow, radius) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const y = y0 + (y1 - y0) * t;
    const z = runZ(side, y) + offset + bow * Math.sin(Math.PI * t);
    pts.push(new THREE.Vector3(L.chainX, y, z));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 44, radius, 5, false);
}

function tensionerGeo() {
  const grp = new THREE.Group();
  grp.add(mesh(bladeTube(+1, 48, -72, 4.6, 2.4, 3.2), MAT.plastic, 'tensioner-blade'));
  grp.add(mesh(union([
    place(box(15, 24, 14, 2), { x: L.chainX, y: -30, z: 36 }),
    xRod(4.5, L.chainX - 8, L.chainX + 8, -30, 44, 16),
  ]), MAT.alu, 'tensioner-body'));
  grp.add(mesh(place(hexPrism(11, 5.5, 3), { x: L.chainX, y: -17, z: 42 }),
    MAT.blackOxide, 'tensioner-cap'));
  return grp;
}

const chainGuideGeo = () => new THREE.Group().add(
  mesh(bladeTube(-1, 46, -66, -4.6, -1.2, 3.0), MAT.plastic, 'chain-guide'));

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH — chỉ để định hướng, không tháo
// ─────────────────────────────────────────────────────────────────────────────

function cylinderGeo() {
  const h = L.head;
  const s = roundedRect(h.w, h.d, h.r);
  for (const [x, z] of h.boltPos) bore(s, h.boltD / 2 + 0.35, x, z);
  slot(s, h.tunnel.w, h.tunnel.d, 6, h.tunnel.x, h.tunnel.z);
  bore(s, L.bore / 2);
  return new THREE.Group().add(mesh(union([
    place(extrudeY(s, L.cylTop - L.cylBottom, { bevel: 2 }), { y: L.cylBottom }),
    place(tubeSolid(L.bore / 2 + 3, L.bore / 2, 0, L.cylTop - L.cylBottom, 48), { y: L.cylBottom }),
  ]), MAT.ghost, 'cylinder'));
}

function pistonGeo() {
  const r = L.bore / 2 - 0.3;
  // Gốc toạ độ cục bộ = TÂM CHỐT PISTON
  const slider = new THREE.Group();
  slider.add(mesh(lathe([
    [0, -19], [r - 2.4, -19], [r - 2.4, -7], [r, -5],
    [r, L.pistonCH - 2], [r - 1.8, L.pistonCH], [0, L.pistonCH],
  ], 44), MAT.piston, 'piston'));
  slider.add(mesh(union([0, 2.9, 5.8].map((d) =>
    tubeSolid(r + 0.3, r - 1.8, L.pistonCH - 5.4 - d, L.pistonCH - 4.0 - d, 44))),
  MAT.castIron, 'piston-rings'));

  const rodNode = new THREE.Group();
  rodNode.name = 'rodNode';
  rodNode.add(mesh(union([
    place(box(13, L.rodLen - 16, 9.5, 3), { y: -L.rodLen / 2 }),
    xTube(9, 4.6, -6.5, 6.5, 0, 0, 24),
    xTube(14, 9, -8, 8, -L.rodLen, 0, 24),
  ]), MAT.ghost, 'con-rod'));
  slider.add(rodNode);

  const grp = new THREE.Group();
  grp.add(slider);
  grp.userData.nodes = { slider, rod: rodNode };
  return grp;
}

function crankGeo() {
  const sp = L.crankSprocket;
  const { shape } = sprocketShape(sp.teeth, sp.pitch, L.chainRoller, 7);
  const y = L.crankY;
  return new THREE.Group().add(mesh(union([
    place(extrudeX(shape, sp.w, { bevel: 0.5 }), { x: sp.x - sp.w / 2, y }),
    xRod(16, -34, -6, y, 0, 32),                  // cổ trục trái
    xRod(16, 6, 20, y, 0, 32),                    // cổ trục phải
    place(lathe([[0, 0], [34, 0], [34, 12], [0, 12]], 40),
      { rz: -Math.PI / 2, x: 20, y }),            // bánh đà
    // má khuỷu + chốt khuỷu (ở bán kính hành trình)
    place(box(14, 44, 12, 4), { x: -3, y: y + 12, z: 0 }),
  ]), MAT.ghost, 'crank'));
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  cover: 'Nắp & gioăng',
  drive: 'Trục cam & dẫn động',
  valve: 'Xupap & cò mổ',
  body: 'Thân đầu bò',
  fast: 'Bu lông · bugi',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Nắp và gioăng ──────────────────────────────────────────────────────────
  {
    id: 'tappet-caps', name: 'Nắp che cò (2)', nameEn: 'Tappet / adjuster caps',
    qty: 2, category: C.cover, build: tappetCapsGeo,
    info: {
      material: 'Nhôm, ren vào nắp đầu bò', spec: 'Ren lớn + o-ring làm kín',
      fn: 'Mở ra để căn khe hở nhiệt xupap mà KHÔNG phải tháo nắp đầu bò. '
        + 'Đây là lý do "căn cam" trên xe số làm được nhanh.',
      fail: 'Mất/chai o-ring -> rỉ nhớt ra mặt nắp.',
    },
  },
  {
    id: 'cover-bolts', name: 'Bu lông nắp đầu bò (4)', nameEn: 'Head cover bolts',
    qty: 4, category: C.cover, build: coverBoltsGeo,
    info: {
      material: 'Thép mạ đen', spec: 'M6 × 28', torque: '≈ 10 N·m (tham khảo)',
      fn: 'Siết đối xứng, lực nhỏ. Siết quá sẽ làm biến dạng mép nhôm mỏng và hở gioăng.',
    },
  },
  {
    id: 'head-cover', name: 'Nắp đầu bò (nắp che cam)', nameEn: 'Cylinder head cover',
    qty: 1, category: C.cover, build: coverGeo,
    info: {
      material: 'Hợp kim nhôm đúc',
      fn: 'Che kín khoang trục cam, giữ nhớt không bắt ra ngoài. Không chịu lực nén.',
      fail: 'Rỉ nhớt dọc mép đầu bò — dấu hiệu là nhớt đọng trên cánh tản nhiệt.',
    },
  },
  {
    id: 'cover-gasket', name: 'Gioăng nắp đầu bò', nameEn: 'Head cover gasket',
    qty: 1, category: C.cover, build: coverGasketGeo,
    info: {
      material: 'Cao su NBR định hình',
      fn: 'Làm kín mép nắp. Thay mới nếu đã chai cứng hoặc biến dạng.',
    },
  },

  // ── Trục cam & dẫn động ────────────────────────────────────────────────────
  {
    id: 'tensioner', name: 'Bộ căng dây cam + lưỡi căng', nameEn: 'Cam chain tensioner + blade',
    qty: 1, category: C.drive, build: tensionerGeo,
    info: {
      material: 'Thân nhôm, lưỡi nhựa chịu nhiệt, lò xo thép',
      spec: 'Kiểu tự động (lò xo đẩy + cóc chống lùi)',
      fn: 'Luôn ép nhánh LỎNG của dây cam để dây không đảo. Khi dây cam giãn, '
        + 'bộ căng tự bù trừ; hết hành trình bù là phải thay dây cam.',
      fail: 'Lưỡi mòn/nứt -> tiếng "lách cách" ở đầu bò lúc máy nguội, nặng hơn thì lệch pha phối khí.',
    },
  },
  {
    id: 'chain-guide', name: 'Dẫn hướng dây cam', nameEn: 'Cam chain guide',
    qty: 1, category: C.drive, build: chainGuideGeo, stays: true,
    info: {
      material: 'Nhựa chịu nhiệt gia cường',
      fn: 'Giữ nhánh CĂNG của dây cam chạy đúng đường, chống cọ xát vào thân máy.',
      fail: 'Mòn lủng -> dây cam va vách, tiếng ken két.',
    },
  },
  {
    id: 'cam-sprocket', name: 'Nhông cam', nameEn: 'Cam sprocket',
    qty: 1, category: C.drive, pivot: [L.camSprocket.x, L.cam.y, L.cam.z], build: camSprocketGeo,
    info: {
      material: 'Thép, tôi bề mặt răng',
      spec: `${L.camSprocket.teeth} răng · bước ${L.camSprocket.pitch} mm `
        + `· nhông trục khuỷu ${L.crankSprocket.teeth} răng · tỉ số 2:1`,
      tolerance: 'Trục khuỷu 2 vòng = trục cam 1 vòng',
      fn: 'Dấu chỉ thị trên nhông phải trùng dấu trên đầu bò khi piston ở ĐIỂM '
        + 'CHẾT TRÊN cuối kỳ nén — đây chính là động tác "căn cam".',
      fail: 'Lệch 1 răng = lệch ~15° trục khuỷu -> máy yếu, nổ dội; nặng thì xupap va piston.',
    },
  },
  {
    id: 'cam-chain', name: 'Dây cam (xích cam)', nameEn: 'Cam chain',
    qty: 1, category: C.drive, build: chainGeo, stays: true,
    info: {
      material: 'Xích con lăn thép, vòng kín không mắt nối',
      spec: `${CHAIN_LINKS} mắt · bước ${L.camSprocket.pitch} mm · chu vi vòng ${CHAIN.length.toFixed(0)} mm`,
      fn: 'Truyền quay từ trục khuỷu lên trục cam tỉ số 2:1. Mỗi 2 vòng trục khuỷu '
        + '(= 1 chu trình 4 kỳ) trục cam quay 1 vòng, mỗi vấu mở xupap đúng 1 lần.',
      fail: 'Giãn -> lách cách khi đề máy, trễ pha phối khí. Thay dây cam nên thay cả '
        + 'lưỡi căng và dẫn hướng cùng lúc.',
    },
  },
  {
    id: 'camshaft', name: 'Trục cam', nameEn: 'Camshaft',
    qty: 1, category: C.drive, pivot: [0, L.cam.y, L.cam.z], build: camshaftGeo,
    info: {
      material: 'Thép hợp kim, vấu cam tôi cao tần',
      spec: `Vòng cơ sở R${L.cam.rb} mm · độ nâng ${L.cam.lift} mm · góc làm việc `
        + `${L.cam.half * 2}° cam (= ${L.cam.half * 4}° trục khuỷu)`,
      tolerance: 'Khe hở cổ trục 0,03–0,06 mm · giới hạn mòn độ nâng cam ≈ -0,15 mm',
      fn: 'Biến chuyển động quay thành chuyển động mở xupap, quyết định THỜI ĐIỂM '
        + 'và KHOẢNG MỞ của từng xupap. Hai vấu lệch nhau 255° cam — đúng bằng độ '
        + 'lệch pha giữa nạp và xả.',
      fail: 'Mòn vấu (thiếu nhớt) -> độ nâng giảm -> máy yếu, hao xăng. '
        + 'Mòn cổ trục -> tụt áp suất nhớt, gõ đầu bò.',
    },
  },

  // ── Xupap & cò mổ ──────────────────────────────────────────────────────────
  {
    id: 'rocker-i', name: 'Cò mổ xupap nạp', nameEn: 'Intake rocker arm',
    qty: 1, category: C.valve, pivot: [0, V.intake.pivot[0], V.intake.pivot[1]],
    build: () => rockerArmGeo('intake'),
    info: {
      material: 'Thép rèn, mặt tiếp xúc tôi',
      spec: `Tỉ số đòn ${rockerGeom(V.intake).ratio.toFixed(2)} : 1 -> độ nâng xupap = độ nâng cam`,
      tolerance: `Khe hở nhiệt ${L.lash.intake} mm (đo khi máy NGUỘI)`,
      fn: 'Đòn trung gian đổi chiều: vấu cam ĐẨY LÊN một đầu, đầu kia ẤN XUỐNG '
        + 'thân xupap để mở. Vít ở đầu đòn điều chỉnh khe hở nhiệt.',
      fail: 'Mòn lõm mặt tiếp xúc -> khe hở tăng, tiếng gõ lạ; mòn bạc -> lắc ngang.',
    },
  },
  {
    id: 'rocker-e', name: 'Cò mổ xupap xả', nameEn: 'Exhaust rocker arm',
    qty: 1, category: C.valve, pivot: [0, V.exhaust.pivot[0], V.exhaust.pivot[1]],
    build: () => rockerArmGeo('exhaust'),
    info: {
      material: 'Thép rèn, mặt tiếp xúc tôi',
      spec: `Tỉ số đòn ${rockerGeom(V.exhaust).ratio.toFixed(2)} : 1`,
      tolerance: `Khe hở nhiệt ${L.lash.exhaust} mm`,
      fn: 'Như cò mổ nạp, nhưng làm việc ở nhiệt độ cao hơn nên mòn nhanh hơn.',
      fail: 'Khe hở quá NHỎ -> xupap xả không đóng kín -> cháy xupap.',
    },
  },
  {
    id: 'rocker-shaft-i', name: 'Trục cò mổ nạp', nameEn: 'Intake rocker shaft',
    qty: 1, category: C.valve, build: () => rockerShaftGeo('intake'),
    info: {
      material: 'Thép tôi, mài bóng', spec: `Ø${L.rocker.shaftR * 2} mm`,
      fn: 'Trục quay của cò mổ, có lỗ dẫn nhớt bôi trơn. Rút NGANG ra để lấy cò mổ.',
      fail: 'Xước / mòn ô-van -> cò mổ lắc, khe hở nhiệt thay đổi liên tục.',
    },
  },
  {
    id: 'rocker-shaft-e', name: 'Trục cò mổ xả', nameEn: 'Exhaust rocker shaft',
    qty: 1, category: C.valve, build: () => rockerShaftGeo('exhaust'),
    info: { material: 'Thép tôi, mài bóng', spec: `Ø${L.rocker.shaftR * 2} mm`,
      fn: 'Trục quay của cò mổ xả.' },
  },
  {
    id: 'cotter-i', name: 'Móng gà xupap nạp (2 nửa)', nameEn: 'Intake valve cotters',
    qty: 2, category: C.valve, build: () => cottersGeo('intake'),
    info: {
      material: 'Thép tôi', spec: 'Cặp 2 nửa hình chêm',
      fn: 'Chêm giữa rãnh trên thân xupap và lỗ côn của đĩa chặn, khóa lò xo ở '
        + 'trạng thái nén. TOÀN BỘ lực lò xo dồn lên 2 mảnh này.',
      fail: 'Lắp lệch/thiếu một nửa -> xupap tụt vào buồng đốt, phá piston và đầu bò.',
    },
  },
  {
    id: 'cotter-e', name: 'Móng gà xupap xả (2 nửa)', nameEn: 'Exhaust valve cotters',
    qty: 2, category: C.valve, build: () => cottersGeo('exhaust'),
    info: { material: 'Thép tôi', fn: 'Như móng gà nạp.' },
  },
  {
    id: 'retainer-i', name: 'Đĩa chặn lò xo nạp', nameEn: 'Intake spring retainer',
    qty: 1, category: C.valve, build: () => retainerGeo('intake'),
    info: { material: 'Thép dập',
      fn: 'Lỗ côn của đĩa ép 2 nửa móng gà vào thân xupap khi lò xo bật lên. '
        + 'Càng kéo mạnh thì khóa càng chặt — một kiểu tự khóa (self-locking).' },
  },
  {
    id: 'retainer-e', name: 'Đĩa chặn lò xo xả', nameEn: 'Exhaust spring retainer',
    qty: 1, category: C.valve, build: () => retainerGeo('exhaust'),
    info: { material: 'Thép dập', fn: 'Như đĩa chặn nạp.' },
  },
  {
    id: 'springs-i', name: 'Lò xo xupap nạp (trong + ngoài)', nameEn: 'Intake valve springs',
    qty: 2, category: C.valve, build: () => springsGeo('intake'),
    info: {
      material: 'Thép lò xo Si-Cr',
      spec: `Chiều dài lắp đặt ${V.intake.springSeatBelowTip - V.intake.retainerBelowTip} mm; `
        + '2 lò xo quấn NGƯỢC chiều nhau',
      fn: 'Đóng xupap và giữ kín suốt kỳ nén/nổ. Hai lò xo quấn ngược chiều để '
        + '(1) nếu một cái gãy thì mảnh không tụt vào giữa lò xo còn lại, '
        + '(2) chống cộng hưởng lò xo (valve float) ở vòng tua cao.',
      fail: 'Yếu/gãy -> xupap đóng trễ, mất nén, nổ dội. Đo chiều dài tự do khi tháo ra.',
    },
  },
  {
    id: 'springs-e', name: 'Lò xo xupap xả (trong + ngoài)', nameEn: 'Exhaust valve springs',
    qty: 2, category: C.valve, build: () => springsGeo('exhaust'),
    info: { material: 'Thép lò xo Si-Cr', fn: 'Như lò xo nạp, làm việc ở nhiệt độ cao hơn.' },
  },
  {
    id: 'valve-i', name: 'Xupap nạp', nameEn: 'Intake valve',
    qty: 1, category: C.valve, build: () => valveGeo('intake'),
    info: {
      material: 'Thép chịu nhiệt',
      spec: `Ø mặt nấm ${V.intake.headD} mm · Ø thân ${V.intake.stemD} mm · góc vát 45°`,
      tolerance: 'Khe hở thân–ống dẫn hướng 0,010–0,037 mm',
      fn: 'Mở cho hoà khí vào xy-lanh. Mặt nấm LỚN HƠN xupap xả vì dòng nạp không '
        + 'có áp suất đẩy, cần diện tích lớn để nạp đủ trong thời gian ngắn.',
      fail: 'Mòn/rỗ mặt vát -> mất nén, khó nổ. Xử lý: xoáy xupap (lapping) hoặc thay.',
    },
  },
  {
    id: 'valve-e', name: 'Xupap xả', nameEn: 'Exhaust valve',
    qty: 1, category: C.valve, build: () => valveGeo('exhaust'),
    info: {
      material: 'Thép chịu nhiệt cao (loại tốt có nhồi natri trong thân)',
      spec: `Ø mặt nấm ${V.exhaust.headD} mm · Ø thân ${V.exhaust.stemD} mm`,
      tolerance: 'Khe hở thân–ống dẫn hướng 0,030–0,057 mm — LỎNG hơn nạp vì giãn nhiệt nhiều hơn',
      fn: 'Xả khí cháy. Chịu ~700–800 °C và thoát nhiệt CHỦ YẾU QUA MẶT NẤM truyền '
        + 'vào bệ xupap — nên chỉ cần không đóng kín là nó cháy rất nhanh.',
      fail: 'Cháy/lõm mặt nấm do khe hở nhiệt đặt quá nhỏ hoặc bệ xupap mòn.',
    },
  },
  {
    id: 'valve-guides', name: 'Ống dẫn hướng xupap (2)', nameEn: 'Valve guides',
    qty: 2, category: C.valve, build: guidesGeo,
    info: {
      material: 'Đồng thanh (hoặc gang hợp kim)',
      fn: 'Giữ thân xupap đồng tâm với bệ xupap. Mòn ống dẫn hướng = xupap đảo = '
        + 'không thể làm kín dù có xoáy lại mặt vát.',
      fail: 'Mòn -> hút nhớt vào buồng đốt (khói xanh khi thả ga), tiếng gõ nhẹ.',
    },
  },
  {
    id: 'stem-seals', name: 'Phớt thân xupap (2)', nameEn: 'Valve stem seals',
    qty: 2, category: C.valve, build: stemSealsGeo,
    info: {
      material: 'Cao su chịu nhiệt, khung thép',
      fn: 'Hạn chế nhớt bị HÚT xuống theo thân xupap trong kỳ nạp (áp suất trong ống '
        + 'nạp thấp hơn khí trời).',
      fail: 'Chai -> khói xanh lúc đề máy buổi sáng hoặc khi thả ga sau khi ép ga.',
    },
  },

  // ── Thân đầu bò ────────────────────────────────────────────────────────────
  {
    id: 'head', name: 'Thân đầu bò (nắp quy-lát)', nameEn: 'Cylinder head casting',
    qty: 1, category: C.body, build: headCasting,
    info: {
      material: 'Hợp kim nhôm đúc (dẫn nhiệt tốt)',
      spec: 'Buồng đốt bán cầu, 2 xupap, cánh tản nhiệt liền khối',
      tolerance: 'Độ phẳng mặt lắp: sai lệch tối đa ≈ 0,05 mm',
      fn: 'Chứa buồng đốt, đường nạp/xả, bệ xupap, ổ đỡ trục cam và trục cò mổ. '
        + 'Cùng với piston và gioăng, nó quyết định TỈ SỐ NÉN.',
      fail: 'Cong mặt lắp (siết sai thứ tự / máy quá nhiệt) -> hở gioăng đầu bò. '
        + 'Trượt ren bugi và ren bu lông là hư hỏng phổ biến thứ hai.',
    },
  },
  {
    id: 'head-gasket', name: 'Gioăng đầu bò', nameEn: 'Cylinder head gasket',
    qty: 1, category: C.body, build: headGasketGeo,
    info: {
      material: 'Nhiều lớp thép + vật liệu đàn, hoặc amiăng phủ kim loại',
      spec: 'Dày ≈ 1,0–1,2 mm khi chưa siết',
      fn: 'Làm kín áp suất cháy (có thể > 40 bar) giữa đầu bò và xy-lanh, '
        + 'đồng thời làm kín đường nhớt lên đầu bò.',
      fail: 'BẮT BUỘC thay mới mỗi lần tháo. Dùng lại gioăng cũ -> hở hơi, rỉ nhớt.',
    },
  },

  // ── Bu lông & bugi ─────────────────────────────────────────────────────────
  {
    id: 'head-bolts', name: 'Bu lông đầu bò (4)', nameEn: 'Cylinder head bolts',
    qty: 4, category: C.fast, build: headBoltsGeo,
    info: {
      material: 'Thép hợp kim cấp bền cao', spec: 'M8 · 4 cái',
      torque: '≈ 24 N·m, siết 2 lần theo hình chéo (tham khảo)',
      fn: 'Ép đầu bò xuống xy-lanh đủ chặt để gioăng làm kín ở mọi nhiệt độ. '
        + 'Lực siết phải ĐỀU — lệch lực làm mặt lắp cong.',
      fail: 'Siết không theo thứ tự chéo -> gioăng hở cục bộ. '
        + 'Siết quá -> trượt ren ở lốc máy bằng nhôm.',
    },
  },
  {
    id: 'spark-plug', name: 'Bugi', nameEn: 'Spark plug',
    qty: 1, category: C.fast, build: sparkPlugGeo,
    info: {
      material: 'Thân thép, cách điện sứ alumina, điện cực Ni/Pt/Ir',
      spec: 'Ren M10 × 1,0 · khe hở điện cực 0,6–0,7 mm',
      torque: '≈ 12 N·m (siết tay đến khi chạm gioăng, rồi thêm ≈ 1/2 vòng)',
      fn: 'Phóng tia lửa đốt hoà khí. Màu sứ và điện cực là "đồng hồ" đọc tình trạng '
        + 'đốt cháy: nâu nhạt = đúng, đen muội = giàu xăng, trắng xám = nghèo hoặc nóng quá.',
      fail: 'Nứt sứ -> mất lửa thất thường. Siết quá tay -> trượt ren đầu bò '
        + '(hư hỏng đắt tiền nhất nhóm này).',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-cylinder', name: 'Xy-lanh (ngữ cảnh)', nameEn: 'Cylinder',
    qty: 1, category: C.ctx, build: cylinderGeo,
    info: { material: 'Nhôm đúc + ống lót gang', spec: `Ø${L.bore} mm`,
      fn: 'Hiện mờ để định hướng. Chi tiết đầy đủ ở hệ thống 02.' },
  },
  {
    id: 'ctx-piston', name: 'Piston + tay biên (ngữ cảnh)', nameEn: 'Piston & connecting rod',
    qty: 1, category: C.ctx, build: pistonGeo,
    info: { material: 'Nhôm hợp kim', spec: `Hành trình ${L.stroke} mm · tay biên ${L.rodLen} mm`,
      fn: 'Chạy đồng bộ với trục cam theo tỉ số 2:1 để thấy rõ quan hệ giữa pha phối '
        + 'khí và 4 kỳ. Chi tiết đầy đủ ở hệ thống 02.' },
  },
  {
    id: 'ctx-crank', name: 'Trục khuỷu + nhông (ngữ cảnh)', nameEn: 'Crankshaft & drive sprocket',
    qty: 1, category: C.ctx, pivot: [0, L.crankY, 0], build: crankGeo,
    info: { material: 'Thép rèn', spec: `Nhông ${L.crankSprocket.teeth} răng`,
      fn: 'Nguồn dẫn động dây cam. Chi tiết đầy đủ ở hệ thống 03.' },
  },
];
