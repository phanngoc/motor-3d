/**
 * parts.js — Toàn bộ chi tiết của hệ thống bôi trơn.
 *
 * Hai chi tiết đặc biệt, làm ra để DẠY chứ không phải để đúng hình:
 *  - `oil-flow`: các hạt nhớt chạy dọc đường nhớt, cho thấy toàn bộ mạch từ
 *    các-te lên tới trục cam.
 *  - `cf-sludge`: lớp cặn trong bộ lọc li tâm, dày lên theo thanh kéo "km đã
 *    chạy" để thấy bộ lọc mất tác dụng dần.
 * Cả hai được đánh dấu stays: true vì chúng không phải chi tiết tháo được.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, extrudeX, extrudeY, lathe, rod,
  tubeSolid, gearShape, hexPrism, boltGeo, coilSpring, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import {
  L, innerRotorProfile, outerRotorProfile, outerCenter, oilPathPoints,
} from './layout.js';

const PU = L.pump, CF = L.cf, ST = L.strainer, RV = L.relief, CR = L.crank;

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

const uv = (y, z) => [-z, y];

const xRod = (r, x0, x1, y = 0, z = 0, segs = 28) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 34) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

const xLathe = (profile, x0, y = 0, z = 0, segs = 40) =>
  place(lathe(profile, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Shape từ danh sách điểm [u, v]. */
function shapeFrom(pts) {
  const s = new THREE.Shape();
  pts.forEach(([u, v], i) => (i === 0 ? s.moveTo(u, v) : s.lineTo(u, v)));
  s.closePath();
  return s;
}

/** Bánh răng đặt tại một tâm, kéo theo X. */
function gearAt(teeth, module_, cy, cz, x0, x1, boreR) {
  const [cu, cv] = uv(cy, cz);
  const g = gearShape(teeth, module_, boreR, { cu, cv });
  return place(extrudeX(g.shape, x1 - x0, { bevel: 0.4, curveSegments: 3 }), { x: x0 });
}

// ─────────────────────────────────────────────────────────────────────────────
// BƠM NHỚT
// ─────────────────────────────────────────────────────────────────────────────

function pumpBodyGeo() {
  const [cu, cv] = uv(PU.y, PU.z);
  const s = circleShape(PU.bodyR, cu, cv);
  // khoang chứa rôto (khoét theo biên dạng rôto ngoài, hơi rộng hơn)
  const oc = outerCenter();
  const [ou, ov] = uv(oc.y, oc.z);
  bore(s, PU.rOuter + 1.2, ou, ov);
  for (let i = 0; i < PU.bolts; i++) {
    const a = (i / PU.bolts) * TAU + deg(30);
    bore(s, 2.6, cu + PU.boltR * Math.cos(a), cv + PU.boltR * Math.sin(a));
  }
  return new THREE.Group().add(mesh(union([
    place(extrudeX(s, PU.x1 - PU.x0 + 3, { bevel: 1, curveSegments: 26 }), { x: PU.x0 - 3 }),
    // cửa hút và cửa đẩy
    xTube(5, 3.2, PU.x0 - 12, PU.x0 - 2, PU.y - 12, PU.z, 18),
    xTube(5, 3.2, PU.x0 - 12, PU.x0 - 2, PU.y + 14, PU.z, 18),
  ]), MAT.alu, 'pump-body'));
}

function pumpCoverGeo() {
  const [cu, cv] = uv(PU.y, PU.z);
  const s = circleShape(PU.bodyR, cu, cv);
  bore(s, PU.shaftR + 0.3, cu, cv);
  for (let i = 0; i < PU.bolts; i++) {
    const a = (i / PU.bolts) * TAU + deg(30);
    bore(s, 3.2, cu + PU.boltR * Math.cos(a), cv + PU.boltR * Math.sin(a));
  }
  return new THREE.Group().add(mesh(
    place(extrudeX(s, 4, { bevel: 0.8, curveSegments: 26 }), { x: PU.x1 }),
    MAT.alu, 'pump-cover'));
}

/** Rôto TRONG: n thùy, quay quanh trục bơm. */
function rotorInnerGeo() {
  const [cu, cv] = uv(PU.y, PU.z);
  const s = shapeFrom(innerRotorProfile(cu, cv));
  bore(s, PU.shaftR + 0.15, cu, cv);
  return new THREE.Group().add(mesh(
    place(extrudeX(s, PU.x1 - PU.x0, { curveSegments: 1 }), { x: PU.x0 }),
    MAT.hardened, 'rotor-inner'));
}

/** Rôto NGOÀI: n+1 thùy, tâm LỆCH so với rôto trong. */
function rotorOuterGeo() {
  const oc = outerCenter();
  const [ou, ov] = uv(oc.y, oc.z);
  const s = circleShape(PU.rOuter, ou, ov);
  const hole = new THREE.Path();
  const hp = outerRotorProfile(ou, ov).slice().reverse();
  hp.forEach(([u, v], i) => (i === 0 ? hole.moveTo(u, v) : hole.lineTo(u, v)));
  hole.closePath();
  s.holes.push(hole);
  return new THREE.Group().add(mesh(
    place(extrudeX(s, PU.x1 - PU.x0, { curveSegments: 26 }), { x: PU.x0 }),
    MAT.steel, 'rotor-outer'));
}

const pumpShaftGeo = () => new THREE.Group().add(mesh(union([
  xRod(PU.shaftR, PU.x0 - 8, L.pumpGear.x1 + 3, PU.y, PU.z, 20),
  // then dẹt truyền momen cho rôto trong
  place(extrudeY(roundedRect(PU.x1 - PU.x0, 2.2, 0.3), PU.shaftR * 2 - 1),
    { x: PU.x0, y: PU.y - PU.shaftR + 0.5, z: PU.z }),
]), MAT.steel, 'pump-shaft'));

const pumpGearGeo = () => new THREE.Group().add(mesh(
  gearAt(L.pumpGear.teeth, L.pumpGear.module, PU.y, PU.z, L.pumpGear.x0, L.pumpGear.x1,
    PU.shaftR + 0.2),
  MAT.plastic, 'pump-gear'));

const pumpBoltsGeo = () => {
  const [cu, cv] = uv(PU.y, PU.z);
  const pos = Array.from({ length: PU.bolts }, (_, i) => {
    const a = (i / PU.bolts) * TAU + deg(30);
    return [PU.y + PU.boltR * Math.cos(a), PU.z + PU.boltR * Math.sin(a)];
  });
  return new THREE.Group().add(mesh(union(pos.map(([y, z]) =>
    place(boltGeo(5, 16, { headAF: 8, headH: 4 }), { rz: Math.PI / 2, x: PU.x1 + 4, y, z }),
  )), MAT.blackOxide, 'pump-bolts'));
};

// ─────────────────────────────────────────────────────────────────────────────
// BỘ LỌC LI TÂM
// ─────────────────────────────────────────────────────────────────────────────

function cfHousingGeo() {
  return new THREE.Group().add(mesh(union([
    xTube(CF.rOut, CF.rIn, CF.x0, CF.capX[0], CR.y, CR.z, 44),
    xLathe([[CR.r + 0.4, 0], [CF.rOut, 0], [CF.rOut, 5], [CR.r + 0.4, 5], [CR.r + 0.4, 0]],
      CF.x0, CR.y, CR.z, 44),
    // 4 gân dẫn nhớt bên trong
    ...[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * TAU;
      const [u0, v0] = uv(CR.y + (CR.r + 2) * Math.cos(a), CR.z + (CR.r + 2) * Math.sin(a));
      const [u1, v1] = uv(CR.y + (CF.rIn - 1) * Math.cos(a), CR.z + (CF.rIn - 1) * Math.sin(a));
      return place(extrudeX(strip([u0, v0], [u1, v1], 4, 3), CF.capX[0] - CF.x0 - 6),
        { x: CF.x0 + 5 });
    }),
  ]), MAT.steel, 'cf-housing'));
}

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

function cfCapGeo() {
  const [cu, cv] = uv(CR.y, CR.z);
  const s = circleShape(CF.rOut, cu, cv);
  bore(s, CR.r + 0.4, cu, cv);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    bore(s, 2.4, cu + (CF.rIn - 5) * Math.cos(a), cv + (CF.rIn - 5) * Math.sin(a));
  }
  return new THREE.Group().add(mesh(union([
    place(extrudeX(s, CF.capX[1] - CF.capX[0], { bevel: 0.6, curveSegments: 30 }), { x: CF.capX[0] }),
    // o-ring làm kín
    xTube(CF.rIn + 1.2, CF.rIn - 0.6, CF.capX[0] - 1.6, CF.capX[0], CR.y, CR.z, 34),
  ]), MAT.blackOxide, 'cf-cap'));
}

/**
 * Lớp cặn trong buồng lọc. Node con `sludge` được kinematics phóng theo bán kính
 * để thể hiện cặn dày lên theo số km đã chạy.
 */
function cfSludgeGeo() {
  const node = new THREE.Group();
  node.name = 'sludge';
  // Dựng ở độ dày sludgeMax rồi thu nhỏ lại theo tỉ lệ — nhờ vậy chỉ cần đổi scale.
  node.add(mesh(
    xTube(CF.rIn - 0.3, CF.rIn - 0.3 - CF.sludgeMax, CF.x0 + 5, CF.capX[0] - 2, CR.y, CR.z, 40),
    MAT.rubber, 'cf-sludge'));
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { sludge: node };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// LƯỚI LỌC · VAN AN TOÀN · XẢ NHỚT · QUE THĂM
// ─────────────────────────────────────────────────────────────────────────────

function strainerGeo() {
  const frame = roundedRect(ST.d, ST.w, 5, 0, 0);
  const inner = roundedRect(ST.d - 9, ST.w - 9, 3, 0, 0);
  frame.holes.push(new THREE.Path(inner.getPoints(24).reverse()));
  const parts = [place(extrudeX(frame, ST.t, { curveSegments: 8 }), { x: -ST.w / 2 })];
  for (let i = -4; i <= 4; i++) {
    parts.push(place(extrudeY(roundedRect(ST.w - 10, 1.1, 0.3), 1.1), { y: -0.5, z: i * 4.2 }));
    parts.push(place(extrudeY(roundedRect(1.1, ST.d - 10, 0.3), 1.1), { y: 0.5, x: i * 5.0 }));
  }
  // ống hút nối lên bơm
  parts.push(place(rod(4.2, 0, 22, 18), { y: 2, x: 0, z: 0 }));
  return new THREE.Group().add(mesh(
    place(union(parts), { x: ST.x, y: ST.y }), MAT.steel, 'oil-strainer'));
}

/** Van an toàn: bi + lò xo trong một khoang. Node `ball` mở ra khi quá áp. */
function reliefGeo() {
  const body = xTube(RV.r + 3, RV.r, RV.x - 3, RV.x + 20, RV.y, RV.z, 22);
  const ballNode = new THREE.Group();
  ballNode.name = 'ball';
  const s = new THREE.SphereGeometry(RV.ballR, 16, 12);
  s.translate(RV.x + 2, RV.y, RV.z);
  ballNode.add(mesh(s, MAT.hardened, 'relief-ball'));
  const grp = new THREE.Group();
  grp.add(mesh(union([
    body,
    place(coilSpring(RV.r * 0.62, 0.9, 5, RV.springLen), { rz: -Math.PI / 2, x: RV.x + 5, y: RV.y, z: RV.z }),
    place(hexPrism(13, 4, 0), { rz: -Math.PI / 2, x: RV.x + 20, y: RV.y, z: RV.z }),
  ]), MAT.steel, 'relief-body'));
  grp.add(ballNode);
  grp.userData.nodes = { ball: ballNode };
  return grp;
}

const drainGeo = () => new THREE.Group().add(mesh(union([
  place(boltGeo(L.drain.d, 14, { headAF: 17, headH: 7 }), { rx: Math.PI, x: L.drain.x, y: L.drain.y + 14 }),
  place(tubeSolid(L.drain.d / 2 + 3, L.drain.d / 2, 0, 1.6, 24), { x: L.drain.x, y: L.drain.y + 14 }),
]), MAT.blackOxide, 'drain-bolt'));

function dipstickGeo() {
  const d = L.dipstick;
  return new THREE.Group().add(mesh(union([
    place(rod(3, 0, d.len, 16), { x: d.x, y: d.y - d.len, z: d.z }),
    place(lathe([[0, 0], [9, 0], [9, 8], [7, 10], [0, 10]], 24), { x: d.x, y: d.y, z: d.z }),
    // hai vạch mức nhớt
    place(tubeSolid(3.6, 3, 0, 1, 16), { x: d.x, y: d.y - d.len + 8, z: d.z }),
    place(tubeSolid(3.6, 3, 0, 1, 16), { x: d.x, y: d.y - d.len + 18, z: d.z }),
  ]), MAT.plastic, 'dipstick'));
}

// ─────────────────────────────────────────────────────────────────────────────
// ĐƯỜNG NHỚT + DÒNG CHẢY
// ─────────────────────────────────────────────────────────────────────────────

export const OIL_CURVE = new THREE.CatmullRomCurve3(
  oilPathPoints().map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2,
);

/** Ống thể hiện đường nhớt — trên máy thật là lỗ khoan bên trong kim loại. */
const galleryGeo = () => new THREE.Group().add(mesh(
  new THREE.TubeGeometry(OIL_CURVE, 220, 2.6, 8, false), MAT.ghost, 'oil-gallery'));

/** Các hạt nhớt chạy dọc đường nhớt. Node `flow` là InstancedMesh. */
function oilFlowGeo() {
  const n = 60;
  const drop = new THREE.SphereGeometry(2.6, 10, 8);
  const im = new THREE.InstancedMesh(drop, MAT.oil, n);
  im.name = 'oil-flow';
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  const grp = new THREE.Group();
  grp.add(im);
  grp.userData.nodes = { flow: im, count: n };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

const ctxCrankGeo = () => new THREE.Group().add(mesh(union([
  xRod(CR.r, CR.x0, CR.x1, CR.y, CR.z, 30),
  gearAt(L.crankGear.teeth, L.pumpGear.module, CR.y, CR.z, L.pumpGear.x0, L.pumpGear.x1, 0),
  place(lathe([[0, 0], [36, 0], [36, 11], [0, 11]], 40), { rz: -Math.PI / 2, x: -22, y: CR.y }),
]), MAT.ghost, 'ctx-crank'));

function ctxSumpGeo() {
  const s = roundedRect(112, 96, 20, 0, -34);
  return new THREE.Group().add(mesh(union([
    place(extrudeX(s, 6, { curveSegments: 12 }), { x: -46 }),
    place(extrudeX(s, 6, { curveSegments: 12 }), { x: 88 }),
    // mức nhớt trong các-te
    place(extrudeY(roundedRect(120, 100, 18, 0, 0), 1.5),
      { y: L.oilLevelY, x: 20 }),
  ]), MAT.ghost, 'ctx-sump'));
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  pump: 'Bơm nhớt',
  filter: 'Lọc',
  circuit: 'Đường nhớt',
  service: 'Bảo dưỡng',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Bơm nhớt ───────────────────────────────────────────────────────────────
  {
    id: 'pump-bolts', name: `Bu lông bơm nhớt (${PU.bolts})`, nameEn: 'Oil pump bolts',
    qty: PU.bolts, category: CAT.pump, build: pumpBoltsGeo,
    info: { material: 'Thép', spec: 'M5', torque: '≈ 6 N·m',
      fn: 'Ép nắp bơm vào thân. Siết đều, lực nhỏ.',
      fail: 'Siết lệch -> nắp vênh -> khe hở cạnh rôto tăng -> lưu lượng tụt.' },
  },
  {
    id: 'pump-cover', name: 'Nắp bơm nhớt', nameEn: 'Oil pump cover', qty: 1,
    category: CAT.pump, build: pumpCoverGeo,
    info: { material: 'Nhôm đúc',
      fn: 'Đóng kín khoang rôto. Mặt trong của nó là một trong hai mặt tạo KHE HỞ CẠNH — '
        + 'khe hở này quyết định lưu lượng ở vòng tua thấp.',
      fail: 'Mặt trong bị xước hoặc vênh -> nhớt lọt qua trong khoang -> lưu lượng tụt.' },
  },
  {
    id: 'rotor-inner', pivot: [(PU.x0 + PU.x1) / 2, PU.y, PU.z], name: `Rôto trong (${PU.lobesInner} thùy)`, nameEn: 'Inner rotor', qty: 1,
    category: CAT.pump, build: rotorInnerGeo,
    info: {
      material: 'Thép thiêu kết',
      spec: `${PU.lobesInner} thùy · nhận momen từ trục bơm qua then dẹt`,
      fn: 'Rôto CHỦ ĐỘNG. Nó có ít hơn rôto ngoài đúng MỘT thùy — chênh lệch một thùy đó '
        + 'làm các khoang giữa hai rôto lần lượt lớn ra (hút) rồi nhỏ lại (đẩy).',
      fail: 'Mòn đỉnh thùy -> khe hở đỉnh răng tăng -> nhớt lọt ngược -> áp suất tụt khi '
        + 'máy nóng và ở vòng tua thấp.',
    },
  },
  {
    id: 'rotor-outer', pivot: [(PU.x0 + PU.x1) / 2, outerCenter().y, outerCenter().z], name: `Rôto ngoài (${PU.lobesInner + 1} thùy)`, nameEn: 'Outer rotor', qty: 1,
    category: CAT.pump, build: rotorOuterGeo,
    info: {
      material: 'Thép thiêu kết',
      spec: `${PU.lobesInner + 1} thùy · tâm LỆCH ${PU.ecc} mm so với rôto trong`,
      tolerance: 'Ba khe hở phải đo khi đại tu: đỉnh răng, thân bơm, và khe hở cạnh',
      fn: 'Rôto BỊ ĐỘNG, quay chậm hơn rôto trong theo tỉ số '
        + `${PU.lobesInner}/${PU.lobesInner + 1}. Chính độ lệch tâm là thứ tạo ra `
        + 'thể tích biến thiên.',
      fail: 'Mòn -> lưu lượng tụt. Thay CẢ BỘ bơm, không thay lẻ từng rôto.',
    },
  },
  {
    id: 'pump-shaft', pivot: [(PU.x0 + PU.x1) / 2, PU.y, PU.z], name: 'Trục bơm nhớt', nameEn: 'Oil pump shaft', qty: 1,
    category: CAT.pump, build: pumpShaftGeo,
    info: { material: 'Thép', spec: `Ø${PU.shaftR * 2} mm, có then dẹt`,
      fn: 'Truyền momen từ nhông dẫn động vào rôto trong.',
      fail: 'Then dẹt mòn tròn -> rôto trượt trên trục -> bơm mất lưu lượng thất thường.' },
  },
  {
    id: 'pump-gear', pivot: [(L.pumpGear.x0 + L.pumpGear.x1) / 2, PU.y, PU.z], name: 'Nhông dẫn động bơm', nameEn: 'Oil pump drive gear', qty: 1,
    category: CAT.pump, build: pumpGearGeo,
    info: {
      material: 'Nhựa kỹ thuật (một số đời dùng thép)',
      spec: `${L.pumpGear.teeth} răng, ăn với ${L.crankGear.teeth} răng trên trục khuỷu`,
      fn: 'Lấy chuyển động từ trục khuỷu. Bơm quay chậm hơn động cơ, nên lưu lượng luôn '
        + 'tỉ lệ thuận với vòng tua.',
      fail: 'Răng NHỰA vỡ -> bơm ngừng hoàn toàn -> máy bó trong vài phút chạy. '
        + 'Đây là chi tiết BẮT BUỘC kiểm mỗi lần mở vỏ phải.',
    },
  },
  {
    id: 'pump-body', name: 'Thân bơm nhớt', nameEn: 'Oil pump body', qty: 1,
    category: CAT.pump, build: pumpBodyGeo,
    info: {
      material: 'Nhôm đúc',
      spec: `Lưu lượng riêng ≈ ${(Math.PI * (PU.ecc / 10) * (PU.rInner / 10) * 2
        * ((PU.x1 - PU.x0) / 10)).toFixed(2)} cm³ mỗi vòng rôto`,
      fn: 'Chứa hai rôto, có cửa HÚT (phía dưới) và cửa ĐẨY (phía trên). '
        + 'Bơm này tạo LƯU LƯỢNG — áp suất là do sức cản của đường nhớt phía sau sinh ra.',
      fail: 'Lòng khoang mòn rộng -> khe hở thân tăng -> lưu lượng tụt ở vòng tua thấp.',
    },
  },

  // ── Lọc ────────────────────────────────────────────────────────────────────
  {
    id: 'cf-cap', name: 'Nắp buồng lọc li tâm + o-ring', nameEn: 'Centrifugal filter cap',
    qty: 2, category: CAT.filter, build: cfCapGeo,
    info: { material: 'Thép + o-ring cao su',
      fn: 'Đóng kín buồng lọc. Mở nắp này là cách duy nhất vệ sinh bộ lọc.',
      fail: 'O-ring chai -> nhớt lọt qua mà KHÔNG được lọc. Thay o-ring mỗi lần mở.' },
  },
  {
    id: 'cf-housing', pivot: [(CF.x0 + CF.x1) / 2, CR.y, CR.z], name: 'Buồng lọc li tâm', nameEn: 'Centrifugal filter housing',
    qty: 1, category: CAT.filter, build: cfHousingGeo,
    info: {
      material: 'Thép, gắn trên trục khuỷu bên phải',
      spec: 'KHÔNG có lõi lọc thay thế — chỉ vệ sinh được',
      fn: 'Buồng quay theo trục khuỷu. Nhớt vào ở giữa, lực li tâm ném hạt bẩn NẶNG ra sát '
        + 'thành, nhớt sạch hơn đi ra ở giữa. Đây là cấp lọc thứ HAI và là cấp lọc duy nhất '
        + 'giữ được hạt nhỏ — xe số không có lọc giấy.',
      fail: 'Đầy cặn -> hết tác dụng -> nhớt bẩn đi trực tiếp đến ổ bi đầu to. '
        + 'Vệ sinh mỗi 10.000–15.000 km.',
    },
  },
  {
    id: 'cf-sludge', pivot: [(CF.x0 + CF.x1) / 2, CR.y, CR.z], name: 'Lớp cặn trong buồng lọc', nameEn: 'Sludge layer',
    qty: 1, category: CAT.filter, build: cfSludgeGeo, stays: true,
    info: {
      material: 'Mạt kim loại + muội than + phụ gia đã phân hủy',
      spec: `Dày tới ${CF.sludgeMax} mm là buồng lọc coi như hết tác dụng`,
      fn: 'Không phải chi tiết — nó là thứ bộ lọc đã bắt được. Kéo thanh "km đã chạy" trong '
        + 'chế độ Hoạt động để thấy lớp cặn dày lên và hiệu quả lọc tụt về 0.',
      fail: 'Đây chính là công việc bị bỏ qua nhiều nhất trên xe số, và là nguyên nhân âm thầm '
        + 'của "máy nhanh xuống" dù vẫn thay nhớt định kỳ.',
    },
  },
  {
    id: 'oil-strainer', name: 'Lưới lọc nhớt + ống hút', nameEn: 'Oil strainer & pickup',
    qty: 1, category: CAT.filter, build: strainerGeo,
    info: {
      material: 'Lưới thép + khung',
      fn: 'Cấp lọc THỨ NHẤT và thô nhất: chặn mảnh kim loại lớn trước khi vào bơm.',
      fail: 'Tắc -> bơm hút không được -> tụt áp suất -> gõ đầu bò. Vệ sinh mỗi lần tách máy. '
        + 'Nếu lưới có nhiều mạt kim loại sáng thì phải truy nguyên nhân trước khi lắp lại.',
    },
  },

  // ── Đường nhớt ─────────────────────────────────────────────────────────────
  {
    id: 'relief-valve', name: 'Van an toàn (van xả áp)', nameEn: 'Relief valve',
    qty: 1, category: CAT.circuit, build: reliefGeo,
    info: {
      material: 'Bi thép + lò xo', spec: `Mở ở khoảng ${L.reliefOpenKpa} kPa`,
      fn: 'Xả nhớt về các-te khi áp suất vượt ngưỡng. Cần thiết vì khi máy NGUỘI nhớt rất '
        + 'đặc, sức cản đường ống rất cao, áp suất có thể tăng đủ để bung phớt.',
      fail: 'Kẹt MỞ -> áp suất không lên được ở vòng tua cao. Kẹt ĐÓNG -> quá áp khi nguội, '
        + 'bung phớt hoặc nứt đường ống.',
    },
  },
  {
    id: 'oil-gallery', name: 'Đường nhớt (lỗ khoan)', nameEn: 'Oil galleries',
    qty: 1, category: CAT.circuit, build: galleryGeo, stays: true,
    info: {
      material: 'Lỗ khoan trong trục khuỷu, lốc máy, xy-lanh và đầu bò',
      fn: 'Trên máy thật đây là các LỖ KHOAN bên trong khối kim loại, không phải ống. '
        + 'Mô hình vẽ thành ống trong suốt để theo dõi được dòng chảy.',
      fail: 'Tắc do cặn -> ổ bi đầu to hoặc trục cam chết dù còn đủ nhớt trong máy. '
        + 'Thổi khí nén qua từng đường mỗi lần tách máy.',
    },
  },
  {
    id: 'oil-flow', name: 'Dòng nhớt (mô phỏng)', nameEn: 'Oil flow (visualisation)',
    qty: 1, category: CAT.circuit, build: oilFlowGeo, stays: true,
    info: {
      material: 'Không phải chi tiết — đây là phần mô phỏng để dạy',
      fn: 'Các hạt chạy dọc mạch nhớt: các-te → lưới lọc → bơm → lọc li tâm → đường khoan '
        + 'trục khuỷu → ổ bi đầu to → nhánh lên trục cam. Tốc độ hạt tỉ lệ với LƯU LƯỢNG, '
        + 'nên tăng vòng tua là thấy dòng chảy nhanh lên.',
    },
  },

  // ── Bảo dưỡng ──────────────────────────────────────────────────────────────
  {
    id: 'drain-bolt', name: 'Bu lông xả nhớt + long đen', nameEn: 'Drain bolt & crush washer',
    qty: 2, category: CAT.service, build: drainGeo,
    info: { material: 'Thép + long đen biến dạng', torque: '≈ 24 N·m',
      fn: 'Xả nhớt cũ ở điểm thấp nhất của các-te.',
      fail: 'Long đen DÙNG MỘT LẦN — dùng lại là rỉ nhớt. Siết quá tay -> trượt ren nhôm.' },
  },
  {
    id: 'dipstick', name: 'Que thăm nhớt', nameEn: 'Dipstick', qty: 1,
    category: CAT.service, build: dipstickGeo,
    info: {
      material: 'Nhựa + o-ring', spec: 'Hai vạch: mức thấp nhất và mức cao nhất',
      fn: 'Kiểm mức nhớt.',
      fail: 'Đo khi xe dựng chân chống NGHIÊNG -> kết luận sai (thường thấy thiếu nên đổ thêm '
        + 'quá nhiều). Phải đo khi xe ĐỨNG THẲNG, máy đã tắt 2–3 phút.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-crank', pivot: [0, CR.y, CR.z], name: 'Trục khuỷu (ngữ cảnh)', nameEn: 'Crankshaft', qty: 1,
    category: CAT.ctx, build: ctxCrankGeo,
    info: { material: 'Thép rèn',
      fn: 'Dẫn động bơm nhớt và mang buồng lọc li tâm. Chi tiết đầy đủ ở hệ thống 03.' },
  },
  {
    id: 'ctx-sump', name: 'Các-te + mức nhớt (ngữ cảnh)', nameEn: 'Sump & oil level', qty: 1,
    category: CAT.ctx, build: ctxSumpGeo,
    info: { material: 'Lốc máy nhôm', spec: 'Dung tích ≈ 0,8 L khi thay định kỳ',
      fn: 'Nhớt đọng ở đáy. Đây là các-te ƯỚT — nhớt nằm ngay trong lốc máy, không có bình '
        + 'chứa riêng như hệ thống các-te khô.' },
  },
];
