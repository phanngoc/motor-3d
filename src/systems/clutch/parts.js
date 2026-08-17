/**
 * parts.js — Toàn bộ chi tiết của hệ thống ly hợp.
 *
 * Điểm cần để ý khi đọc code: hai bộ ly hợp nằm trên HAI TRỤC khác nhau và
 * LỆCH NHAU theo X (xem giải thích bài toán bao hình trong layout.js). Bộ li
 * tâm trên trục khuỷu (L.crank), bộ đa đĩa trên trục sơ cấp (L.main).
 */

import * as THREE from 'three';
import {
  TAU, deg, circleShape, bore, roundedRect, annularSector, extrudeX, extrudeY,
  lathe, rod, tubeSolid, gearShape, splineShape, hexPrism, boltGeo, coilSpring,
  union, mesh, pattern, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, PRIMARY, plateLayout, weightRadius } from './layout.js';

const CR = L.crank, MS = L.main, CE = L.cent, WE = L.wet, LI = L.lifter;

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

/** Mặt phẳng shape của extrudeX ứng với world: u = -z, v = y. */
const uv = (y, z) => [-z, y];

/** Trụ nằm theo trục X. */
const xRod = (r, x0, x1, y = 0, z = 0, segs = 32) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Ống nằm theo trục X. */
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 36) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Khối tròn xoay nằm theo trục X: profile [[r, axial], ...]. */
const xLathe = (profile, x0, y = 0, z = 0, segs = 44) =>
  place(lathe(profile, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Bánh răng trên một trục, kéo theo X. */
function gearAt(teeth, axis, x0, x1, boreR) {
  const [u, v] = uv(axis.y, axis.z);
  const g = gearShape(teeth, PRIMARY.module, boreR, { cu: u, cv: v });
  return place(extrudeX(g.shape, x1 - x0, { bevel: 0.5, curveSegments: 3 }), { x: x0 });
}

/** Đĩa phẳng nằm theo X, có thể có vấu/răng ở mép. */
function plateGeo(axis, x0, t, rIn, rOut, { tabs = 0, tabR = 0, teeth = 0 } = {}) {
  const [u, v] = uv(axis.y, axis.z);
  const s = bore(circleShape(rOut, u, v), rIn, u, v);
  const parts = [place(extrudeX(s, t, { curveSegments: 30 }), { x: x0 })];
  // vấu ngoài (đĩa thép ăn vào chuông)
  for (let i = 0; i < tabs; i++) {
    const a = (i / tabs) * TAU;
    const sec = annularSector(rOut - 0.5, tabR, a - deg(7), a + deg(7));
    const sh = new THREE.Shape(sec.getPoints(20).map((p) => new THREE.Vector2(u - p.y, v + p.x)));
    parts.push(place(extrudeX(sh, t, { curveSegments: 1 }), { x: x0 }));
  }
  // răng trong (đĩa ma sát ăn vào moay-ơ) — mô hình bằng các vấu hướng vào tâm
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    const sec = annularSector(rIn - 1.6, rIn + 0.5, a - deg(5), a + deg(5));
    const sh = new THREE.Shape(sec.getPoints(14).map((p) => new THREE.Vector2(u - p.y, v + p.x)));
    parts.push(place(extrudeX(sh, t, { curveSegments: 1 }), { x: x0 }));
  }
  return union(parts);
}

// ─────────────────────────────────────────────────────────────────────────────
// LY HỢP LI TÂM (bộ nồi trước)
// ─────────────────────────────────────────────────────────────────────────────

/** Ống moay-ơ + bánh răng sơ cấp chủ động, quay theo CHUÔNG (không theo trục khuỷu). */
function centSleeveGeo() {
  const s = CE.sleeve;
  return new THREE.Group().add(mesh(union([
    xTube(s.r, s.bore, L.primary.x1, s.x1, CR.y, CR.z),
    gearAt(PRIMARY.zDrive, CR, L.primary.x0, L.primary.x1, s.bore),
    // vành chặn để định vị dọc trục
    xTube(s.r + 2.5, s.bore, s.x1 - 3, s.x1, CR.y, CR.z),
  ]), MAT.hardened, 'cent-sleeve'));
}

/** Chuông li tâm: cốc có mặt trong là bề mặt ma sát. */
function centDrumGeo() {
  const d = CE.drum;
  return new THREE.Group().add(mesh(union([
    // thành cốc
    xTube(d.rOut, d.rIn, d.x0, d.backX[0], CR.y, CR.z, 48),
    // mặt đáy (phía ngoài) nối vào ống moay-ơ
    xLathe([[CE.sleeve.bore, 0], [d.rOut, 0], [d.rOut, d.backX[1] - d.backX[0]],
      [CE.sleeve.bore, d.backX[1] - d.backX[0]], [CE.sleeve.bore, 0]],
    d.backX[0], CR.y, CR.z, 48),
    // gân tăng cứng trên mặt đáy, hướng theo bán kính
    ...Array.from({ length: 6 }, (_, i) => drumRib((i / 6) * TAU, d.backX[1], 3)),
  ]), MAT.steel, 'cent-drum'));
}

/** Gân phẳng trên mặt đáy chuông, chạy theo bán kính tại góc a. */
function drumRib(a, x0, thick) {
  const r0 = 15, r1 = CE.drum.rOut - 3;
  const p0 = uv(CR.y + r0 * Math.cos(a), CR.z + r0 * Math.sin(a));
  const p1 = uv(CR.y + r1 * Math.cos(a), CR.z + r1 * Math.sin(a));
  return place(extrudeX(strip(p0, p1, 5, 4), thick), { x: x0 });
}

/** Mâm mang búa, then hoa vào trục khuỷu. */
function centSpiderGeo() {
  const sp = CE.spider, w = CE.weight;
  const parts = [
    xTube(sp.r, CR.r + 0.15, sp.x0, sp.x1, CR.y, CR.z, 36),
    place(extrudeX(splineShape(CR.r + 1.6, 12, 1.1, 0), sp.x1 - sp.x0),
      { x: sp.x0, y: CR.y, z: CR.z }),
  ];
  // 3 cánh mang chốt quay của búa
  for (let i = 0; i < w.count; i++) {
    const a = (i / w.count) * TAU;
    const py = CR.y + w.pivotR * Math.cos(a);
    const pz = CR.z + w.pivotR * Math.sin(a);
    const [u0, v0] = uv(CR.y, CR.z);
    const [u1, v1] = uv(py, pz);
    parts.push(place(extrudeX(strip([u0, v0], [u1, v1], 11, 9), sp.x1 - sp.x0, { bevel: 0.5 }),
      { x: sp.x0 }));
    // chốt quay
    parts.push(xRod(3.2, w.x0 - 1, w.x1 + 1, py, pz, 16));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'cent-spider'));
}

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

/**
 * 3 quả búa li tâm. Mỗi quả là một Group riêng quay quanh chốt của nó, để
 * kinematics lắc được từng quả. Hình học dựng ở trạng thái NHẢ.
 */
function centWeightsGeo() {
  const w = CE.weight;
  const grp = new THREE.Group();
  const nodes = [];
  for (let i = 0; i < w.count; i++) {
    const a = (i / w.count) * TAU;
    const py = CR.y + w.pivotR * Math.cos(a);
    const pz = CR.z + w.pivotR * Math.sin(a);
    // Node quay đặt tại chốt; con dịch vào -pivot để quay quanh đúng chốt
    const pivotNode = new THREE.Group();
    pivotNode.name = `weight-${i}`;
    const [cu, cv] = uv(CR.y, CR.z);
    const sec = annularSector(w.rIn, w.rOutFree, a - deg(w.halfAngle), a + deg(w.halfAngle));
    const body = new THREE.Shape(sec.getPoints(40).map((p) => new THREE.Vector2(cu - p.y, cv + p.x)));
    const g = union([
      place(extrudeX(body, w.x1 - w.x0, { bevel: 0.6, curveSegments: 1 }), { x: w.x0 }),
      // bạc chốt quay
      xTube(5.2, 3.35, w.x0, w.x1, py, pz, 20),
    ]);
    // má ma sát ở mặt ngoài
    const shoeSec = annularSector(w.rOutFree - 2.2, w.rOutFree, a - deg(w.halfAngle - 3), a + deg(w.halfAngle - 3));
    const shoe = new THREE.Shape(shoeSec.getPoints(40).map((p) => new THREE.Vector2(cu - p.y, cv + p.x)));
    const shoeG = place(extrudeX(shoe, w.x1 - w.x0 - 1, { curveSegments: 1 }), { x: w.x0 + 0.5 });

    const inner = new THREE.Group();
    inner.add(mesh(g, MAT.steel, `cent-weight-${i}`), mesh(shoeG, MAT.gasket, `cent-shoe-${i}`));
    inner.position.set(0, -py, -pz);
    pivotNode.position.set(0, py, pz);
    pivotNode.add(inner);
    grp.add(pivotNode);
    nodes.push(pivotNode);
  }
  grp.userData.nodes = { weights: nodes };
  return grp;
}

/** 3 lò xo kéo giữ búa ở trạng thái nhả. */
function centSpringsGeo() {
  const w = CE.weight;
  const parts = [];
  for (let i = 0; i < w.count; i++) {
    const a0 = (i / w.count) * TAU;
    const a1 = ((i + 1) / w.count) * TAU;
    const r = w.pivotR + 6;
    const p0 = [CR.y + r * Math.cos(a0), CR.z + r * Math.sin(a0)];
    const p1 = [CR.y + r * Math.cos(a1), CR.z + r * Math.sin(a1)];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    const pts = [
      new THREE.Vector3(w.x0 + 3, p0[0], p0[1]),
      new THREE.Vector3(w.x0 + 3, mid[0] * 1.04, mid[1] * 1.04),
      new THREE.Vector3(w.x0 + 3, p1[0], p1[1]),
    ];
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 1.5, 6, false));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.spring, 'cent-springs'));
}

const centNutGeo = () => new THREE.Group().add(mesh(union([
  place(hexPrism(CE.nut.af, 7, CR.r + 0.3), { rz: -Math.PI / 2, x: CE.nut.x, y: CR.y, z: CR.z }),
  xTube(CE.nut.af / 1.6, CR.r + 0.3, CE.nut.x - 1.6, CE.nut.x, CR.y, CR.z, 24),
]), MAT.blackOxide, 'cent-nut'));

// ─────────────────────────────────────────────────────────────────────────────
// LY HỢP ĐA ĐĨA ƯỚT (bộ nồi sau)
// ─────────────────────────────────────────────────────────────────────────────

/** Chuông ngoài + bánh răng sơ cấp bị động (liền khối). */
function basketGeo() {
  const b = WE.basket;
  const s = WE.stack;
  const parts = [
    gearAt(PRIMARY.zDriven, MS, L.primary.x0, L.primary.x1, 12),
    // vành nối bánh răng vào mặt đáy chuông
    xLathe([[12, 0], [b.rOut, 0], [b.rOut, b.webX[1] - b.webX[0]], [12, b.webX[1] - b.webX[0]], [12, 0]],
      b.webX[0], MS.y, MS.z, 48),
    // thành cốc
    xTube(b.rOut, b.rIn, b.cupX[0], b.cupX[1], MS.y, MS.z, 48),
  ];
  // rãnh dọc cho vấu đĩa thép: mô hình bằng các gờ nhô vào trong giữa các rãnh
  const slots = 6;
  const [u, v] = uv(MS.y, MS.z);
  for (let i = 0; i < slots; i++) {
    const a = (i / slots) * TAU;
    const sec = annularSector(b.rIn - 2.4, b.rIn, a + deg(9), a + deg(51));
    const sh = new THREE.Shape(sec.getPoints(24).map((p) => new THREE.Vector2(u - p.y, v + p.x)));
    parts.push(place(extrudeX(sh, b.cupX[1] - b.cupX[0], { curveSegments: 1 }), { x: b.cupX[0] }));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'basket'));
}

/** Moay-ơ then hoa trên trục sơ cấp — răng trong của đĩa ma sát ăn vào đây. */
function hubGeo() {
  const h = WE.hub;
  return new THREE.Group().add(mesh(union([
    xTube(h.rBody, MS.r + 0.2, h.x0, h.x1, MS.y, MS.z, 36),
    // vành then hoa ngoài cho đĩa ma sát
    place(extrudeX(splineShape(h.rSpline, 20, 1.8, 0), h.x1 - h.x0),
      { x: h.x0, y: MS.y, z: MS.z }),
    // then hoa trong khớp trục sơ cấp
    place(extrudeX(splineShape(MS.r + 1.3, 12, 1.0, 0), h.x1 - h.x0),
      { x: h.x0, y: MS.y, z: MS.z }),
    // vành đế chặn bộ đĩa
    xTube(h.rSpline + 3, MS.r + 0.2, h.x1 - 3, h.x1, MS.y, MS.z, 36),
  ]), MAT.hardened, 'hub'));
}

/**
 * Bộ đĩa. Mỗi đĩa là một node riêng để kinematics tách chúng ra khi mở ly hợp
 * — nhìn thấy khe hở là hiểu ngay tại sao ly hợp phải mở ĐỦ hành trình.
 */
function platesGeo(kind) {
  const grp = new THREE.Group();
  const nodes = [];
  for (const p of plateLayout(0)) {
    if ((kind === 'friction') !== p.isFriction) continue;
    const n = new THREE.Group();
    n.userData.baseX = p.x;
    const geo = p.isFriction
      ? plateGeo(MS, p.x, p.t, p.spec.rIn, p.spec.rOut, { teeth: 20 })
      : plateGeo(MS, p.x, p.t, p.spec.rIn, p.spec.rOut, { tabs: 6, tabR: p.spec.tabR });
    n.add(mesh(geo, p.isFriction ? MAT.gasket : MAT.steel,
      `${kind}-${p.i}`));
    grp.add(n);
    nodes.push(n);
  }
  grp.userData.nodes = { plates: nodes };
  return grp;
}

function pressurePlateGeo() {
  const pr = WE.pressure;
  const x0 = plateLayout(0).reduce((a, p) => Math.max(a, p.x + p.t), 0);
  const [u, v] = uv(MS.y, MS.z);
  const s = bore(circleShape(pr.r, u, v), pr.bossR, u, v);
  const parts = [place(extrudeX(s, pr.t, { curveSegments: 32 }), { x: x0 })];
  // vành bệ cho 4 lò xo
  for (let i = 0; i < WE.spring.count; i++) {
    const a = (i / WE.spring.count) * TAU + deg(45);
    const y = MS.y + WE.spring.r * Math.cos(a);
    const z = MS.z + WE.spring.r * Math.sin(a);
    parts.push(xTube(WE.spring.rMean + 3.4, WE.bolt.d / 2 + 0.4, x0, x0 + pr.t + 3, y, z, 22));
  }
  // bệ giữa nhận bi đẩy
  parts.push(xLathe([[pr.bossR - 4, 0], [pr.bossR + 4, 0], [pr.bossR + 4, 3.4],
    [pr.bossR - 4, 3.4], [pr.bossR - 4, 0]], x0 + pr.t, MS.y, MS.z, 28));
  const grp = new THREE.Group();
  grp.add(mesh(union(parts), MAT.steel, 'pressure-plate'));
  grp.userData.nodes = { x0 };
  return grp;
}

function clutchSpringsGeo() {
  const sp = WE.spring;
  const x0 = plateLayout(0).reduce((a, p) => Math.max(a, p.x + p.t), 0) + WE.pressure.t + 3;
  const parts = [];
  for (let i = 0; i < sp.count; i++) {
    const a = (i / sp.count) * TAU + deg(45);
    const y = MS.y + sp.r * Math.cos(a);
    const z = MS.z + sp.r * Math.sin(a);
    const g = coilSpring(sp.rMean, sp.wire, sp.coils, sp.lenFit);
    parts.push(place(g, { rz: -Math.PI / 2, x: x0, y, z }));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.spring, 'clutch-springs'));
}

function clutchBoltsGeo() {
  const sp = WE.spring, bo = WE.bolt;
  const x0 = plateLayout(0).reduce((a, p) => Math.max(a, p.x + p.t), 0) + WE.pressure.t + 3;
  const parts = [];
  for (let i = 0; i < sp.count; i++) {
    const a = (i / sp.count) * TAU + deg(45);
    const y = MS.y + sp.r * Math.cos(a);
    const z = MS.z + sp.r * Math.sin(a);
    // bu lông hướng vào -X (ren vào moay-ơ), đầu ở +X
    const g = boltGeo(bo.d, bo.len, { headAF: 10, headH: 5, flange: 1.2 });
    parts.push(place(g, { rz: Math.PI / 2, x: x0 + sp.lenFit, y, z }));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.blackOxide, 'clutch-bolts'));
}

const hubNutGeo = () => new THREE.Group().add(mesh(union([
  place(hexPrism(WE.nut.af, 6, MS.r + 0.3), { rz: -Math.PI / 2, x: WE.nut.x, y: MS.y, z: MS.z }),
  xTube(WE.nut.af / 1.6, MS.r + 0.3, WE.nut.x - 1.5, WE.nut.x, MS.y, MS.z, 22),
]), MAT.blackOxide, 'hub-nut'));

// ─────────────────────────────────────────────────────────────────────────────
// CƠ CẤU MỞ LY HỢP
// ─────────────────────────────────────────────────────────────────────────────

/** Thanh đẩy chạy TRONG lòng trục sơ cấp rỗng. */
const lifterRodGeo = () => new THREE.Group().add(mesh(union([
  xRod(LI.rod.r, LI.rod.x0, LI.rod.x1, MS.y, MS.z, 20),
  xRod(LI.rod.r + 1.4, LI.rod.x1 - 3, LI.rod.x1, MS.y, MS.z, 20),
]), MAT.steel, 'lifter-rod'));

const lifterBallGeo = () => {
  const s = new THREE.SphereGeometry(LI.ball.r, 20, 14);
  s.translate(LI.ball.x, MS.y, MS.z);
  return new THREE.Group().add(mesh(s, MAT.hardened, 'lifter-ball'));
};

/** Cam ở đầu trong: xoay là đẩy thanh đẩy đi ra. */
function lifterCamGeo() {
  const c = LI.cam;
  const [u, v] = uv(MS.y, MS.z);
  const s = new THREE.Shape();
  const segs = 90;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU;
    // biên dạng cam: một đoạn nhô cao (lobe) để biến quay thành đẩy dọc trục
    const r = c.r + c.lobe * Math.max(0, Math.cos(a)) ** 2;
    const uu = u + r * Math.cos(a), vv = v + r * Math.sin(a);
    i === 0 ? s.moveTo(uu, vv) : s.lineTo(uu, vv);
  }
  s.closePath();
  bore(s, 5.5, u, v);
  return new THREE.Group().add(mesh(
    place(extrudeX(s, 5, { bevel: 0.4, curveSegments: 1 }), { x: c.x }),
    MAT.hardened, 'lifter-cam'));
}

function lifterArmGeo() {
  const ar = LI.arm;
  const [u0, v0] = uv(MS.y, MS.z);
  const [u1, v1] = uv(MS.y + ar.len, MS.z + 10);
  return new THREE.Group().add(mesh(union([
    place(extrudeX(bore(circleShape(8, u0, v0), 5.6, u0, v0), ar.thick, { curveSegments: 16 }),
      { x: ar.x }),
    place(extrudeX(strip([u0, v0], [u1, v1], 9, 6), ar.thick, { bevel: 0.4 }), { x: ar.x }),
    // vít điều chỉnh + đai ốc chặn ở đầu cần
    xRod(2.6, ar.x - 8, ar.x + 4, MS.y + ar.len, MS.z + 10, 16),
    place(hexPrism(8, 3.2, 2.7), { rz: -Math.PI / 2, x: ar.x - 8, y: MS.y + ar.len, z: MS.z + 10 }),
  ]), MAT.blackOxide, 'lifter-arm'));
}

// ─────────────────────────────────────────────────────────────────────────────
// VỎ · GIOĂNG
// ─────────────────────────────────────────────────────────────────────────────

/** Tâm hình học của cụm để đặt vỏ ly hợp cho cân. */
const COVER_CY = (CR.y + MS.y) / 2;

function coverGeo() {
  const c = L.cover;
  const [u, v] = uv(COVER_CY, 0);
  const s = circleShape(c.r, u, v);
  for (let i = 0; i < c.boltCount; i++) {
    const a = (i / c.boltCount) * TAU;
    bore(s, 3.4, u + c.boltR * Math.cos(a), v + c.boltR * Math.sin(a));
  }
  return new THREE.Group().add(mesh(union([
    place(extrudeX(s, c.t, { bevel: 2, curveSegments: 40 }), { x: c.x0 }),
    // vành gờ mép trong
    xTube(c.r, c.r - 6, c.x0 - 5, c.x0, COVER_CY, 0, 48),
    // bệ ổ đỡ đầu trục khuỷu
    xTube(16, CR.r + 0.6, c.x0 - 6, c.x0, CR.y, CR.z, 28),
  ]), MAT.aluPolish, 'cover'));
}

const coverBoltsGeo = () => {
  const c = L.cover;
  const pos = Array.from({ length: c.boltCount }, (_, i) => {
    const a = (i / c.boltCount) * TAU;
    return [c.x0 + c.t, COVER_CY + c.boltR * Math.cos(a), c.boltR * Math.sin(a)];
  });
  return new THREE.Group().add(mesh(union(pos.map(([x, y, z]) =>
    place(boltGeo(6, 16, { headAF: 10, headH: 5, flange: 1.2 }), { rz: Math.PI / 2, x, y, z }),
  )), MAT.blackOxide, 'cover-bolts'));
};

function coverGasketGeo() {
  const g = L.gasket, c = L.cover;
  const [u, v] = uv(COVER_CY, 0);
  const s = bore(circleShape(c.r, u, v), c.r - 9, u, v);
  return new THREE.Group().add(mesh(
    place(extrudeX(s, g.t, { curveSegments: 40 }), { x: g.x0 }),
    MAT.gasket, 'cover-gasket'));
}

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

const ctxCrankGeo = () => new THREE.Group().add(mesh(union([
  xRod(CR.r, CR.x0, CR.x1, CR.y, CR.z, 32),
  place(extrudeX(splineShape(CR.r + 1.5, 12, 1.0, 0), 12), { x: CE.spider.x0, y: CR.y, z: CR.z }),
  place(lathe([[0, 0], [34, 0], [34, 12], [0, 12]], 40), { rz: -Math.PI / 2, x: CR.x0, y: CR.y }),
]), MAT.ghost, 'ctx-crank'));

const ctxMainGeo = () => new THREE.Group().add(mesh(
  xTube(MS.r, MS.bore, MS.x0, MS.x1, MS.y, MS.z, 32), MAT.ghost, 'ctx-mainshaft'));

function ctxCaseGeo() {
  const [u, v] = uv(COVER_CY, 0);
  const s = circleShape(L.cover.r + 3, u, v);
  bore(s, CR.r + 8, ...uv(CR.y, CR.z));
  bore(s, MS.r + 6, ...uv(MS.y, MS.z));
  return new THREE.Group().add(mesh(
    place(extrudeX(s, 7, { bevel: 2, curveSegments: 40 }), { x: L.caseX - 7 }),
    MAT.ghost, 'ctx-case'));
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  cover: 'Vỏ & gioăng',
  cent: 'Ly hợp li tâm (bộ nồi trước)',
  wet: 'Ly hợp đa đĩa ướt (bộ nồi sau)',
  lift: 'Cơ cấu mở ly hợp',
  ctx: 'Ngữ cảnh (không tháo)',
};

const R = PRIMARY_RATIO_STR();
function PRIMARY_RATIO_STR() {
  return (PRIMARY.zDriven / PRIMARY.zDrive).toFixed(3);
}

export const PARTS = [
  // ── Vỏ & gioăng ────────────────────────────────────────────────────────────
  {
    id: 'cover-bolts', name: 'Bu lông vỏ ly hợp (8)', nameEn: 'Right cover bolts',
    qty: 8, category: CAT.cover, build: coverBoltsGeo,
    info: {
      material: 'Thép mạ đen', spec: 'M6', torque: '≈ 10 N·m',
      fn: 'Nới và siết ĐỐI XỨNG. Ghi nhớ vị trí bu lông khác chiều dài.',
      fail: 'Siết lệch tay -> mép vỏ nhôm biến dạng, rỉ nhớt dọc mép.',
    },
  },
  {
    id: 'cover', name: 'Vỏ ly hợp (nắp che bên phải)', nameEn: 'Right crankcase cover',
    qty: 1, category: CAT.cover, build: coverGeo,
    info: {
      material: 'Nhôm đúc',
      fn: 'Che kín khoang ly hợp, giữ nhớt. Cũng đỡ đầu ngoài trục khuỷu.',
      fail: 'Rỉ nhớt ở mép — dễ nhận vì vết nhớt chảy xuống gác chân phải.',
    },
  },
  {
    id: 'cover-gasket', name: 'Gioăng vỏ ly hợp', nameEn: 'Right cover gasket',
    qty: 1, category: CAT.cover, build: coverGasketGeo,
    info: {
      material: 'Giấy amiăng / vật liệu đàn',
      fn: 'Làm kín vỏ ly hợp.', fail: 'THAY MỚI mỗi lần tháo.',
    },
  },

  // ── Cơ cấu mở ly hợp ───────────────────────────────────────────────────────
  {
    id: 'lifter-ball', name: 'Bi đẩy tấm ép', nameEn: 'Clutch lifter ball',
    qty: 1, category: CAT.lift, build: lifterBallGeo,
    info: {
      material: 'Thép tôi', spec: `Ø${(LI.ball.r * 2).toFixed(1)} mm`,
      fn: 'Nằm giữa thanh đẩy (KHÔNG quay) và tấm ép (ĐANG quay). Không có viên bi '
        + 'này thì hai mặt sẽ mài vào nhau ở tốc độ quay của máy.',
      fail: 'Mòn dẹt -> hành trình mở giảm -> ly hợp không mở hết -> vào số kêu.',
    },
  },
  {
    id: 'lifter-rod', name: 'Thanh đẩy ly hợp', nameEn: 'Clutch lifter rod',
    qty: 1, category: CAT.lift, build: lifterRodGeo,
    info: {
      material: 'Thép tôi mài bóng',
      spec: `Ø${(LI.rod.r * 2).toFixed(1)} mm · dài ${(LI.rod.x1 - LI.rod.x0)} mm`,
      fn: 'Chạy TRONG LÒNG trục sơ cấp rỗng, từ đầu trái sang đầu phải. Đây là lý do '
        + 'trục sơ cấp phải rỗng. Cơ cấu mở nằm bên trái mà tấm ép nằm bên phải, '
        + 'nên phải có một thanh xuyên qua.',
      fail: 'Mòn hai đầu -> mất hành trình mở. Cong -> mở lệch, ly hợp nhả không đều.',
    },
  },
  {
    id: 'lifter-cam', name: 'Cam mở ly hợp', nameEn: 'Clutch lifter cam',
    qty: 1, category: CAT.lift, build: lifterCamGeo,
    info: {
      material: 'Thép tôi',
      fn: 'Biến chuyển động QUAY của trục bàn đạp số thành chuyển động ĐẨY dọc trục. '
        + 'Đây chính là điểm nối giữa hệ thống 04 và hệ thống 05: một lần đạp số '
        + 'vừa mở ly hợp vừa xoay trống số.',
      fail: 'Mòn biên dạng -> hành trình mở giảm dần theo thời gian.',
    },
  },
  {
    id: 'lifter-arm', name: 'Cần mở ly hợp + vít điều chỉnh', nameEn: 'Clutch lifter arm & adjuster',
    qty: 1, category: CAT.lift, build: lifterArmGeo,
    info: {
      material: 'Thép',
      spec: 'Có vít + đai ốc chặn để điều chỉnh khe hở hành trình mở',
      fn: 'Nhận chuyển động từ trục bàn đạp số. Vít ở đầu cần điều chỉnh khe hở.',
      fail: 'Điều chỉnh SAI là nguyên nhân phổ biến nhất của cả "vào số kêu" (quá lỏng, '
        + 'ly hợp không mở hết) và "ly hợp trượt" (quá căng, ly hợp không đóng hết). '
        + 'Đây là chi tiết đáng kiểm TRƯỚC KHI mở máy.',
    },
  },

  // ── Ly hợp đa đĩa ướt ──────────────────────────────────────────────────────
  {
    id: 'clutch-bolts', name: 'Bu lông lò xo ly hợp (4)', nameEn: 'Clutch spring bolts',
    qty: 4, category: CAT.wet, build: clutchBoltsGeo,
    info: {
      material: 'Thép', spec: `M${WE.bolt.d}`, torque: '≈ 12 N·m theo hình chéo',
      fn: 'Giữ tấm ép và nén 4 lò xo. Nới/siết theo hình CHÉO, từng chút một.',
      fail: 'Nới hết một cái trước -> tấm ép vướng và biến dạng.',
    },
  },
  {
    id: 'clutch-springs', name: 'Lò xo ly hợp (4)', nameEn: 'Clutch springs',
    qty: 4, category: CAT.wet, build: clutchSpringsGeo,
    info: {
      material: 'Thép lò xo',
      spec: `Chiều dài tự do ${WE.spring.lenFree} mm · lắp đặt ${WE.spring.lenFit} mm`,
      fn: 'Ép tấm ép vào bộ đĩa. Tổng lực 4 lò xo quyết định momen tối đa ly hợp '
        + 'truyền được — đây mới là thứ giới hạn, không phải số lượng đĩa.',
      fail: 'Yếu -> trượt khi tải. THAY CẢ BỘ 4 cái, không thay lẻ (lệch lực ép làm '
        + 'tấm ép vẹo và đĩa mòn chéo).',
    },
  },
  {
    id: 'pressure-plate', name: 'Tấm ép ly hợp', nameEn: 'Clutch pressure plate',
    qty: 1, category: CAT.wet, build: pressurePlateGeo,
    info: {
      material: 'Thép dập',
      spec: `Hành trình mở ${LI.travel} mm`,
      fn: 'Truyền lực 4 lò xo đều vào bộ đĩa. Khi mở ly hợp, bi đẩy đẩy nó ra phía '
        + 'ngoài, nhả bộ đĩa.',
      fail: 'Vẹo (do siết bu lông lò xo không đều) -> ly hợp nhả không đều, một phần '
        + 'đĩa vẫn dính.',
    },
  },
  {
    id: 'steel-plates', name: `Đĩa thép (${WE.stack.steel.count})`, nameEn: 'Steel plates',
    qty: WE.stack.steel.count, category: CAT.wet, build: () => platesGeo('steel'),
    info: {
      material: 'Thép, VẤU NGOÀI ăn vào chuông',
      spec: `Dày ${WE.stack.steel.t} mm · độ cong tối đa ≈ 0,20 mm`,
      fn: 'Quay theo CHUÔNG (tức theo động cơ). Là bề mặt đối tiếp của đĩa ma sát và '
        + 'dẫn nhiệt ra nhớt.',
      fail: 'Cong -> ly hợp không nhả hết (bám) -> vào số kêu. Kiểm bằng cách đặt lên '
        + 'căn phẳng và nhét lá căn vào chỗ vồng nhất.',
    },
  },
  {
    id: 'friction-plates', name: `Đĩa ma sát (${WE.stack.friction.count})`, nameEn: 'Friction plates',
    qty: WE.stack.friction.count, category: CAT.wet, build: () => platesGeo('friction'),
    info: {
      material: 'Nền thép phủ vật liệu ma sát, RĂNG TRONG ăn vào moay-ơ',
      spec: `Dày ${WE.stack.friction.t} mm · giới hạn mòn ≈ 2,6 mm`,
      tolerance: `Xếp xen kẽ ma sát – thép – ma sát… nên đĩa MA SÁT nằm ở CẢ HAI đầu `
        + `(${WE.stack.friction.count} ma sát + ${WE.stack.steel.count} thép)`,
      fn: 'Quay theo MOAY-Ơ (tức theo trục sơ cấp). Ma sát giữa nó và đĩa thép là thứ '
        + 'truyền momen.',
      fail: 'Mòn mỏng -> trượt. Cháy đen + mùi khét -> đã trượt lâu, thay cả bộ. '
        + 'NGÂM NHỚT 15–20 phút trước khi lắp, đĩa khô sẽ mòn ngay giây đầu tiên.',
    },
  },
  {
    id: 'hub', name: 'Moay-ơ ly hợp', nameEn: 'Clutch centre / hub',
    qty: 1, category: CAT.wet, build: hubGeo,
    info: {
      material: 'Thép thấm cacbon',
      spec: 'Then hoa trong khớp trục sơ cấp, then hoa ngoài mang đĩa ma sát',
      fn: 'Đường ra của momen: từ đĩa ma sát vào moay-ơ rồi vào trục sơ cấp hộp số.',
      fail: 'Then hoa ngoài bị khía rãnh -> đĩa ma sát vướng, ly hợp nhả không hết.',
    },
  },
  {
    id: 'hub-nut', name: 'Đai ốc moay-ơ + long đen khoá', nameEn: 'Clutch centre nut & lock washer',
    qty: 2, category: CAT.wet, build: hubNutGeo,
    info: {
      material: 'Thép', torque: '≈ 50–55 N·m',
      fn: 'Giữ moay-ơ trên trục sơ cấp.',
      fail: 'Long đen khoá dùng lại (không bẻ lại vấu) -> đai ốc tự nới -> phá cả bộ nồi. '
        + 'Long đen khoá BẮT BUỘC thay mới. Một số đời là REN NGƯỢC — thử chiều trước khi ra lực.',
    },
  },
  {
    id: 'basket', name: 'Chuông ly hợp + bánh răng bị động', nameEn: 'Clutch basket & primary driven gear',
    qty: 1, category: CAT.wet, build: basketGeo,
    info: {
      material: 'Thép, bánh răng liền khối với chuông',
      spec: `${PRIMARY.zDriven} răng · ăn với ${PRIMARY.zDrive} răng -> tỉ số sơ cấp ${R} : 1`,
      fn: 'Đường vào của momen: nhận từ bánh răng sơ cấp và mang các đĩa THÉP quay theo. '
        + 'Nó luôn quay khi máy chạy, kể cả khi ly hợp đang mở.',
      fail: 'Vấu bị khía rãnh do đĩa thép đập -> đĩa vướng, ly hợp không nhả hết. '
        + 'Rãnh nhẹ thì dũa phẳng, sâu thì thay.',
    },
  },

  // ── Ly hợp li tâm ──────────────────────────────────────────────────────────
  {
    id: 'cent-nut', name: 'Đai ốc bộ nồi trước + long đen khoá', nameEn: 'Centrifugal clutch nut',
    qty: 2, category: CAT.cent, build: centNutGeo,
    info: {
      material: 'Thép', torque: '≈ 50–55 N·m',
      fn: 'Giữ cả bộ nồi li tâm trên đầu trục khuỷu.',
      fail: 'Rất chặt và một số đời là REN NGƯỢC. Dùng vam giữ chuyên dụng, '
        + 'KHÔNG nhét tua-vít vào răng để giữ (sẽ bẻ răng).',
    },
  },
  {
    id: 'cent-springs', name: `Lò xo kéo búa li tâm (${CE.weight.count})`, nameEn: 'Centrifugal clutch springs',
    qty: CE.weight.count, category: CAT.cent, build: centSpringsGeo,
    info: {
      material: 'Thép lò xo',
      fn: 'Kéo 3 quả búa vào trong, giữ ly hợp NHẢ khi máy chạy không tải. '
        + `Chỉ khi vòng tua vượt ~${L.cent.rpmStart} v/ph thì lực li tâm mới thắng được `
        + 'lò xo này.',
      fail: 'Yếu hoặc đứt -> xe BÒ ĐI ngay khi vừa nổ máy dù chưa lên ga. Lỗi này nguy '
        + 'hiểm (xe tự trôi khi để nổ máy) — sửa ngay.',
    },
  },
  {
    id: 'cent-weights', name: `Quả búa li tâm (${CE.weight.count})`, nameEn: 'Centrifugal clutch weights',
    qty: CE.weight.count, category: CAT.cent, build: centWeightsGeo,
    info: {
      material: 'Thép + má ma sát',
      spec: `Bán kính mặt ma sát: ${CE.weight.rOutFree} mm khi nhả -> `
        + `${CE.weight.rOutLock} mm khi ăn (chuông có bán kính trong ${CE.drum.rIn} mm)`,
      fn: 'Quay theo TRỤC KHUỶU. Lực li tâm tỉ lệ với BÌNH PHƯƠNG vòng tua, nên chỉ cần '
        + 'lên ga một chút là lực tăng rất nhanh — đó là lý do ly hợp li tâm đóng dứt khoát '
        + 'chứ không lừng khừng.',
      fail: 'Má mòn -> trượt, xe "gào" mà không đi. Bạc chốt quay mòn -> búa lắc, đóng không đều.',
    },
  },
  {
    id: 'cent-spider', name: 'Mâm mang búa li tâm', nameEn: 'Centrifugal clutch spider',
    qty: 1, category: CAT.cent, build: centSpiderGeo,
    info: {
      material: 'Thép, then hoa vào trục khuỷu',
      fn: 'Nối cứng vào trục khuỷu và mang 3 chốt quay của búa. Đây là ĐẦU VÀO của '
        + 'toàn bộ đường truyền động.',
      fail: 'Then hoa mòn -> lắc, có tiếng va khi tăng/giảm ga.',
    },
  },
  {
    id: 'cent-drum', name: 'Chuông ly hợp li tâm', nameEn: 'Centrifugal clutch drum',
    qty: 1, category: CAT.cent, build: centDrumGeo,
    info: {
      material: 'Thép', spec: `Bán kính trong ${CE.drum.rIn} mm`,
      fn: 'Mặt trong là bề mặt ma sát cho 3 quả búa. Nó là ĐẦU RA của ly hợp li tâm và '
        + 'quay TỰ DO trên trục khuỷu — chỉ được kéo theo khi búa bung ra ép vào.',
      fail: 'Mặt trong bị bóng gương hoặc lõm thành rãnh -> trượt dù má búa còn dày. '
        + 'Đánh nhám nhẹ mặt trong khi thay má.',
    },
  },
  {
    id: 'cent-sleeve', name: 'Ống moay-ơ + bánh răng sơ cấp', nameEn: 'Drum sleeve & primary drive gear',
    qty: 1, category: CAT.cent, build: centSleeveGeo,
    info: {
      material: 'Thép tôi',
      spec: `${PRIMARY.zDrive} răng · module ${PRIMARY.module} · khoảng cách trục `
        + `${((PRIMARY.module * (PRIMARY.zDrive + PRIMARY.zDriven)) / 2).toFixed(1)} mm`,
      fn: 'Đưa momen từ chuông li tâm sang chuông ly hợp đa đĩa. Ống dài không phải '
        + 'thiết kế tuỳ tiện: hai bộ ly hợp đều Ø~92 mà khoảng cách trục chỉ ~70 mm nên '
        + 'chúng buộc phải lệch nhau dọc trục — cái ống này là hệ quả bắt buộc.',
      fail: 'Mòn răng -> kêu ru ở vòng tua trung bình. Bạc trong ống mòn -> chuông lắc.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-crank', name: 'Trục khuỷu (ngữ cảnh)', nameEn: 'Crankshaft',
    qty: 1, category: CAT.ctx, build: ctxCrankGeo,
    info: { material: 'Thép rèn', fn: 'Đầu vào momen. Chi tiết đầy đủ ở hệ thống 03.' },
  },
  {
    id: 'ctx-mainshaft', name: 'Trục sơ cấp hộp số (ngữ cảnh)', nameEn: 'Gearbox mainshaft',
    qty: 1, category: CAT.ctx, build: ctxMainGeo,
    info: { material: 'Thép thấm cacbon', spec: `RỖNG, lỗ Ø${(MS.bore * 2).toFixed(1)} mm`,
      fn: 'Đầu ra momen, và lòng rỗng của nó là đường đi của thanh đẩy ly hợp. '
        + 'Chi tiết đầy đủ ở hệ thống 05.' },
  },
  {
    id: 'ctx-case', name: 'Vách lốc máy phải (ngữ cảnh)', nameEn: 'Right crankcase wall',
    qty: 1, category: CAT.ctx, build: ctxCaseGeo,
    info: { material: 'Hợp kim nhôm đúc', fn: 'Chi tiết đầy đủ ở hệ thống 03.' },
  },
];
