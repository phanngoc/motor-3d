/**
 * parts.js — Toàn bộ chi tiết của hộp số 4 cấp.
 *
 * Điểm cần để ý khi đọc code: bánh răng trên TRỤC SƠ CẤP đều cố định vào trục,
 * còn bánh răng trên TRỤC THỨ CẤP đều CHẠY LÔ (quay tự do trên bạc). Sang số
 * không hề dịch bánh răng nào vào ăn khớp — nó chỉ đẩy CÀI THEN để khóa một
 * bánh răng chạy lô vào trục. Chính vì vậy `gear-c*` luôn quay trong animation,
 * kể cả khi cấp số đó không được chọn.
 */

import * as THREE from 'three';
import {
  TAU, deg, circleShape, bore, roundedRect, extrudeX, extrudeY, lathe, rod,
  tubeSolid, gearShape, sprocketShape, splineShape, annularSector, groovedDrum,
  union, mesh, pattern, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, GEARS, MODULE, grooveXAt, sliderX } from './layout.js';

const M = L.main, C = L.counter, S = L.slider, D = L.drum;

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

/** Mặt phẳng shape của extrudeX ứng với world: u = -z, v = y. */
const uv = (y, z) => [-z, y];

/** Trụ nằm theo trục X, từ x0 đến x1, tại độ cao y và z. */
const xRod = (r, x0, x1, y = 0, z = 0, segs = 28) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Ống nằm theo trục X. */
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 28) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Khối tròn xoay nằm theo trục X: profile [[r, axial], ...]. */
const xLathe = (profile, x0, y = 0, z = 0, segs = 36) =>
  place(lathe(profile, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Bánh răng đặt trên một trục, kéo theo X. */
function gearAt(teeth, { axis, xCenter, width, boreR = 0, dogs = 0, curveSegments = 3 }) {
  const [u, v] = uv(axis.y, axis.z);
  const g = gearShape(teeth, MODULE, boreR, { cu: u, cv: v });
  for (let i = 0; i < dogs; i++) {
    const a = (i / dogs) * TAU;
    bore(g.shape, S.dogD / 2 + 0.25, u + S.dogR * Math.cos(a), v + S.dogR * Math.sin(a));
  }
  return {
    geo: place(extrudeX(g.shape, width, { bevel: 0.6, curveSegments }), { x: xCenter - width / 2 }),
    pitchRadius: g.pitchRadius, rootRadius: g.rootRadius, tipRadius: g.tipRadius,
  };
}

/** 3 vấu cài then nhô ra khỏi một mặt của cài then. */
function dogSet(xFace, dir, axis) {
  return union(Array.from({ length: S.dogCount }, (_, i) => {
    const a = (i / S.dogCount) * TAU;
    const y = axis.y + S.dogR * Math.cos(a);
    const z = axis.z + S.dogR * Math.sin(a);
    const x0 = dir > 0 ? xFace : xFace - S.dogLen;
    return xRod(S.dogD / 2, x0, x0 + S.dogLen, y, z, 12);
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TRỤC SƠ CẤP + BÁNH RĂNG CỐ ĐỊNH
// ─────────────────────────────────────────────────────────────────────────────

function mainshaftGeo() {
  const g1 = GEARS[0];
  const parts = [
    xRod(M.shaftR, M.x0, M.x1, M.y, M.z),
    // Bánh răng số 1 LIỀN TRỤC (răng cắt trực tiếp vào trục — vì 12 răng thì
    // chân răng chỉ còn R7,6 mm, không đủ chỗ cho một lỗ moay-ơ)
    gearAt(g1.zM, { axis: M, xCenter: g1.x, width: M.gearW }).geo,
    // then hoa để lắp 3 bánh răng cố định
    ...[GEARS[1], GEARS[2], GEARS[3]].map((g) =>
      place(extrudeX(splineShape(M.shaftR + 0.55, 12, 0.8, 0), M.gearW + 4),
        { x: g.x - (M.gearW + 4) / 2, y: M.y, z: M.z })),
    // vai chặn + đầu then hoa nối với chuông ly hợp
    xLathe([[M.shaftR, 0], [10, 0], [10, 3], [M.shaftR, 3], [M.shaftR, 0]], M.x0 + 6, M.y, M.z),
  ];
  return new THREE.Group().add(mesh(union(parts), MAT.hardened, 'mainshaft'));
}

const mainGearGeo = (n) => {
  const g = GEARS[n - 1];
  return new THREE.Group().add(mesh(
    gearAt(g.zM, { axis: M, xCenter: g.x, width: M.gearW, boreR: M.boreR }).geo,
    MAT.hardened, `gear-m${n}`));
};

// ─────────────────────────────────────────────────────────────────────────────
// TRỤC THỨ CẤP + BÁNH RĂNG CHẠY LÔ
// ─────────────────────────────────────────────────────────────────────────────

function countershaftGeo() {
  const parts = [
    xRod(C.shaftR, C.x0, C.x1, C.y, C.z),
    // then hoa tại 2 vị trí cài then
    ...['a', 'b'].map((k) =>
      place(extrudeX(splineShape(C.shaftR + 0.6, 14, 0.9, 0), S.w + 2 * S.travel + 6),
        { x: S[k].x - (S.w + 2 * S.travel + 6) / 2, y: C.y, z: C.z })),
    // đầu ra có then hoa lắp nhông trước
    place(extrudeX(splineShape(C.shaftR + 0.5, 12, 0.8, 0), 14), { x: L.sprocket.x - 7, y: C.y, z: C.z }),
  ];
  return new THREE.Group().add(mesh(union(parts), MAT.hardened, 'countershaft'));
}

/** Bánh răng chạy lô: có lỗ vấu cài then ở mặt hướng về phía cài then. */
const counterGearGeo = (n) => {
  const g = GEARS[n - 1];
  return new THREE.Group().add(mesh(
    gearAt(g.zC, { axis: C, xCenter: g.x, width: C.gearW, boreR: C.boreR, dogs: S.dogCount }).geo,
    MAT.steel, `gear-c${n}`));
};

const bushingsGeo = () => new THREE.Group().add(mesh(union(
  GEARS.map((g) => xTube(C.bushR, C.shaftR + 0.05, g.x - C.gearW / 2 - 0.5,
    g.x + C.gearW / 2 + 0.5, C.y, C.z, 24)),
), MAT.bronze, 'bushings'));

// ─────────────────────────────────────────────────────────────────────────────
// CÀI THEN
// ─────────────────────────────────────────────────────────────────────────────

function sliderGeo(key) {
  const x0 = S[key].x - S.w / 2;
  const gA = (S.w - S.grooveW) / 2;
  // Biên dạng: thân R14, giữa thân có rãnh R11,5 cho mỏ càng cua
  const prof = [
    [C.shaftR + 0.7, 0], [S.r, 0], [S.r, gA], [S.grooveR, gA],
    [S.grooveR, gA + S.grooveW], [S.r, gA + S.grooveW], [S.r, S.w],
    [C.shaftR + 0.7, S.w], [C.shaftR + 0.7, 0],
  ];
  return new THREE.Group().add(mesh(union([
    xLathe(prof, x0, C.y, C.z, 40),
    dogSet(x0, -1, C),                     // vấu mặt -X
    dogSet(x0 + S.w, +1, C),               // vấu mặt +X
  ]), MAT.hardened, `slider-${key}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// CÀNG CUA + TRỤC CÀNG
// ─────────────────────────────────────────────────────────────────────────────

function forkGeo(key) {
  const F = L.forkShaft;
  const xc = S[key].x;
  // Hướng từ trục thứ cấp tới trục càng cua — mỏ càng nằm về phía này
  const dy = F.y - C.y, dz = F.z - C.z;
  const len = Math.hypot(dy, dz);
  const ny = dy / len, nz = dz / len;
  const tipY = C.y + S.grooveR * ny * 1.02;
  const tipZ = C.z + S.grooveR * nz * 1.02;

  const hub = bore(circleShape(8.4, ...uv(F.y, F.z)), F.r + 0.15, ...uv(F.y, F.z));
  const arm = strip(uv(F.y, F.z), uv(tipY, tipZ), 9.0, 6.5);

  // Mỏ càng: cung vành khăn ôm rãnh cài then, dày vừa lọt rãnh
  const armAngle = Math.atan2(nz, ny);
  const prong = annularSector(S.grooveR + 0.15, S.r - 0.2, armAngle - deg(62), armAngle + deg(62));
  const prongShape = new THREE.Shape(
    prong.getPoints(48).map((p) => new THREE.Vector2(-C.z - p.y, C.y + p.x)),
  );

  // Chốt trượt trong rãnh trống số — trục chốt nằm theo Z (từ trục càng lên trống),
  // KHÔNG phải theo X.
  const pinLen = (D.z - D.rGroove + 1.4) - F.z;

  return new THREE.Group().add(mesh(union([
    // ExtrudeGeometry nhận MẢNG shape nên hub và arm gộp được trong một lần kéo
    place(extrudeX([hub, arm], L.fork.thick, { bevel: 0.6, curveSegments: 14 }),
      { x: xc - L.fork.thick / 2 }),
    place(extrudeX(prongShape, L.fork.prongThick, { bevel: 0.4, curveSegments: 1 }),
      { x: xc - L.fork.prongThick / 2 }),
    place(rod(2.6, 0, pinLen, 14), { rx: Math.PI / 2, x: xc, y: F.y, z: F.z }),
  ]), MAT.hardened, `fork-${key}`));
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

const forkShaftGeo = () => {
  const F = L.forkShaft;
  return new THREE.Group().add(mesh(union([
    xRod(F.r, F.x0, F.x1, F.y, F.z, 20),
    xRod(F.r + 1.8, F.x1, F.x1 + 3, F.y, F.z, 20),
  ]), MAT.steel, 'fork-shaft'));
};

// ─────────────────────────────────────────────────────────────────────────────
// TRỐNG SỐ + ĐỊNH VỊ SỐ
// ─────────────────────────────────────────────────────────────────────────────

function drumGeo() {
  const len = D.x1 - D.x0;
  const g = groovedDrum({
    length: len, rOuter: D.rOuter, rGroove: D.rGroove,
    grooves: ['a', 'b'].map((k) => ({
      xAt: (theta) => grooveXAt(k, theta) - D.x0,
      width: D.grooveW,
    })),
    nTheta: 176, nX: 104,
  });
  g.translate(D.x0, D.y, D.z);
  const parts = [g];
  // 2 cổ trục đỡ trống số
  parts.push(xRod(7, D.x0 - 9, D.x0, D.y, D.z, 20));
  parts.push(xRod(7, D.x1, D.x1 + 9, D.y, D.z, 20));
  // 5 chốt để con cóc của trục bàn đạp số đẩy trống quay từng bước
  for (let i = 0; i < 5; i++) {
    const a = deg((i / 5) * 360);
    parts.push(xRod(2.4, D.x1, D.x1 + 6,
      D.y + 10.5 * Math.cos(a), D.z + 10.5 * Math.sin(a), 10));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'drum'));
}

/** Vành định vị số: đĩa 5 hốc — chính nó tạo cảm giác "cục" dứt khoát khi vào số. */
function drumStopperGeo() {
  const s = new THREE.Shape();
  const n = 5, rO = D.detentR, rN = D.detentR - 3.6;
  const [cu, cv] = uv(D.y, D.z);
  const per = 20;
  for (let i = 0; i < n * per; i++) {
    const f = i / (n * per);
    const a = f * TAU;
    const local = (f * n) % 1;
    // hốc lõm quanh mỗi vị trí số
    const d = Math.abs(local - 0.5) / 0.5;
    const r = rN + (rO - rN) * Math.pow(1 - d * d, 0.6);
    const u = cu + r * Math.cos(a), v = cv + r * Math.sin(a);
    i === 0 ? s.moveTo(u, v) : s.lineTo(u, v);
  }
  s.closePath();
  bore(s, 7.2, cu, cv);
  return new THREE.Group().add(mesh(
    place(extrudeX(s, 4, { bevel: 0.4, curveSegments: 2 }), { x: D.x0 - 7 }),
    MAT.blackOxide, 'drum-stopper'));
}

/** Cần định vị số: con lăn + lò xo ép vào vành định vị. */
function detentGeo() {
  const pivotY = D.y - 30, pivotZ = D.z + 6;
  const rollY = D.y - D.detentR - 4, rollZ = D.z;
  const [pu, pv] = uv(pivotY, pivotZ);
  const [ru, rv] = uv(rollY, rollZ);
  const arm = strip([pu, pv], [ru, rv], 7, 5);
  return new THREE.Group().add(mesh(union([
    place(extrudeX(arm, 5, { bevel: 0.4, curveSegments: 4 }), { x: D.x0 - 6.5 }),
    xRod(4.2, D.x0 - 9, D.x0 - 4, rollY, rollZ, 16),          // con lăn
    xRod(3.2, D.x0 - 9, D.x0 - 4, pivotY, pivotZ, 14),        // trục quay cần
    place(extrudeX(strip([pu, pv], [pu + 16, pv - 4], 4, 4), 4), { x: D.x0 - 6 }), // nhánh móc lò xo
  ]), MAT.blackOxide, 'detent'));
}

// ─────────────────────────────────────────────────────────────────────────────
// TRỤC BÀN ĐẠP SỐ + BÀN ĐẠP
// ─────────────────────────────────────────────────────────────────────────────

function spindleGeo() {
  const P = L.spindle;
  const [pu, pv] = uv(P.y, P.z);
  // tấm con cóc: 2 ngón đẩy chốt trên mặt trống số
  const plate = strip([pu, pv], [pu, pv + 26], 16, 11);
  const parts = [
    xRod(P.r, P.x0, P.x1, P.y, P.z, 20),
    place(extrudeX(bore(circleShape(11, pu, pv), P.r + 0.1, pu, pv), 5, { curveSegments: 14 }),
      { x: D.x1 + 4 }),
    place(extrudeX(plate, 4.5, { bevel: 0.4, curveSegments: 2 }), { x: D.x1 + 4.5 }),
    // cần đẩy cơ cấu MỞ LY HỢP (đây là chỗ hộp số nối sang hệ thống 04)
    place(extrudeX(strip([pu, pv], [pu - 22, pv + 6], 8, 6), 5, { bevel: 0.4 }), { x: -22 }),
    xRod(P.r + 2, P.x1 - 16, P.x1 - 10, P.y, P.z, 16),
    place(extrudeX(splineShape(P.r + 0.4, 10, 0.7, 0), 12), { x: P.x1 - 12, y: P.y, z: P.z }),
  ];
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'shift-spindle'));
}

function pedalGeo() {
  const P = L.spindle;
  const [pu, pv] = uv(P.y, P.z);
  const arm = strip([pu, pv], [pu - 4, pv - 62], 13, 9);
  return new THREE.Group().add(mesh(union([
    place(extrudeX(bore(circleShape(10, pu, pv), P.r + 0.4, pu, pv), 8, { curveSegments: 14 }),
      { x: P.x1 - 4 }),
    place(extrudeX(arm, 7, { bevel: 0.5, curveSegments: 2 }), { x: P.x1 - 3.5 }),
    xRod(6, P.x1 + 4, P.x1 + 26, P.y - 4, P.z - 62, 16),      // gờ đạp chân
  ]), MAT.blackOxide, 'shift-pedal'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Ổ BI · PHỚT · NHÔNG TRƯỚC
// ─────────────────────────────────────────────────────────────────────────────

/** Ổ bi cầu: vòng ngoài + vòng trong + 8 viên bi. */
function ballBearing(rI, rO, w, x0, y, z) {
  const rm = (rI + rO) / 2;
  const rb = (rO - rI) * 0.26;
  const parts = [
    xTube(rO, rm + rb * 0.85, x0, x0 + w, y, z, 30),
    xTube(rm - rb * 0.85, rI, x0, x0 + w, y, z, 30),
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const s = new THREE.SphereGeometry(rb, 10, 8);
    s.translate(x0 + w / 2, y + rm * Math.cos(a), z + rm * Math.sin(a));
    parts.push(s);
  }
  return union(parts);
}

const bearingsGeo = () => new THREE.Group().add(mesh(union([
  ballBearing(M.shaftR, M.shaftR + 8, L.bearing.w, L.caseLeftX + 1, M.y, M.z),
  ballBearing(M.shaftR, M.shaftR + 8, L.bearing.w, 40, M.y, M.z),
  ballBearing(C.shaftR, C.shaftR + 8, L.bearing.w, L.caseLeftX + 3, C.y, C.z),
  ballBearing(C.shaftR, C.shaftR + 8, L.bearing.w, 44, C.y, C.z),
]), MAT.steel, 'bearings'));

const outputSealGeo = () => new THREE.Group().add(mesh(
  xTube(C.shaftR + 4.5, C.shaftR + 0.05, 55, 60, C.y, C.z, 28),
  MAT.rubber, 'output-seal'));

function frontSprocketGeo() {
  const sp = L.sprocket;
  const [cu, cv] = uv(C.y, C.z);
  const { shape } = sprocketShape(sp.teeth, sp.pitch, 4.0, C.shaftR + 0.7, { cu, cv });
  return new THREE.Group().add(mesh(union([
    place(extrudeX(shape, sp.w, { bevel: 0.5, curveSegments: 3 }), { x: sp.x - sp.w / 2 }),
    xTube(15, C.shaftR + 0.7, sp.x - sp.w / 2 - 3, sp.x - sp.w / 2, C.y, C.z, 26),
  ]), MAT.blackOxide, 'front-sprocket'));
}

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

/** Hai nửa lốc máy — chỉ để định hướng, mặt ghép vuông góc trục X. */
function caseGeo() {
  const wall = (x, thick) => {
    const s = roundedRect(150, 130, 20, 0, 6);
    for (const [y, z, r] of [[M.y, M.z, M.shaftR + 8], [C.y, C.z, C.shaftR + 8],
      [D.y, D.z, 8], [L.forkShaft.y, L.forkShaft.z, L.forkShaft.r + 2],
      [L.spindle.y, L.spindle.z, L.spindle.r + 2]]) {
      bore(s, r, -z, y);
    }
    return place(extrudeX(s, thick, { bevel: 2, curveSegments: 6 }), { x });
  };
  return new THREE.Group().add(mesh(union([
    wall(L.caseLeftX - 8, 8),
    wall(L.caseRightX, 8),
    // vành mặt ghép
    place(extrudeX(roundedRect(150, 130, 20, 0, 6), 4, { curveSegments: 6 }), { x: -4 }),
  ]), MAT.ghost, 'case'));
}

/** Chuông ly hợp đa đĩa — nơi momen từ động cơ đi vào hộp số. */
const clutchGeo = () => new THREE.Group().add(mesh(union([
  xLathe([[M.shaftR + 1, 0], [34, 0], [34, 22], [30, 22], [30, 3], [M.shaftR + 1, 3],
    [M.shaftR + 1, 0]], M.x0 - 24, M.y, M.z, 40),
  xTube(34, 30, M.x0 - 24, M.x0 - 2, M.y, M.z, 40),
]), MAT.ghost, 'clutch-basket'));

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  main: 'Trục sơ cấp',
  counter: 'Trục thứ cấp',
  shift: 'Cơ cấu sang số',
  support: 'Ổ đỡ · phớt · nhông',
  ctx: 'Ngữ cảnh (không tháo)',
};

const rat = (n) => (GEARS[n - 1].zC / GEARS[n - 1].zM).toFixed(3);

export const PARTS = [
  // ── Cơ cấu sang số ─────────────────────────────────────────────────────────
  {
    id: 'shift-pedal', name: 'Bàn đạp số', nameEn: 'Gearshift pedal',
    qty: 1, category: CAT.shift, pivot: [0, L.spindle.y, L.spindle.z], build: pedalGeo,
    info: {
      material: 'Thép dập', spec: 'Lắp then hoa vào trục bàn đạp số',
      fn: 'Giao diện với chân người lái. Một lần đạp = trống số quay đúng MỘT bước góc.',
      fail: 'Then hoa mòn -> bàn đạp lắc, hành trình mất một phần, vào số không dứt.',
    },
  },
  {
    id: 'shift-spindle', name: 'Trục bàn đạp số + con cóc', nameEn: 'Gearshift spindle & pawl',
    qty: 1, category: CAT.shift, pivot: [0, L.spindle.y, L.spindle.z], build: spindleGeo,
    info: {
      material: 'Thép',
      spec: 'Làm ĐỒNG THỜI hai việc: mở ly hợp và xoay trống số',
      fn: 'Đây là chi tiết giải thích vì sao xe số sang số được mà không cần bóp côn. '
        + 'Một nhánh của nó đẩy cần mở ly hợp (hệ thống 04), nhánh còn lại mang con cóc '
        + 'đẩy chốt trên mặt trống số. Ly hợp mở TRƯỚC khi cài then dịch chỗ.',
      fail: 'Lò xo hồi yếu/đứt -> bàn đạp không trả về vị trí giữa -> không sang số tiếp được.',
    },
  },
  {
    id: 'detent', name: 'Cần định vị số + con lăn', nameEn: 'Shift drum detent arm',
    qty: 1, category: CAT.shift, build: detentGeo,
    info: {
      material: 'Thép + con lăn + lò xo',
      fn: 'Ép con lăn vào hốc của vành định vị, giữ trống số ĐỨNG ĐÚNG ở giữa mỗi cấp số. '
        + 'Chính nó tạo cảm giác "cục" dứt khoát khi vào số.',
      fail: 'Lò xo yếu -> trống số không đứng đúng chỗ -> vào số lửng, nhảy số.',
    },
  },
  {
    id: 'drum-stopper', name: 'Vành định vị số (5 hốc)', nameEn: 'Shift drum stopper plate',
    qty: 1, category: CAT.shift, pivot: [0, D.y, D.z], build: drumStopperGeo,
    info: {
      material: 'Thép dập', spec: '5 hốc ứng với N · 1 · 2 · 3 · 4',
      fn: 'Cùng với con lăn định vị, nó khóa trống số ở 5 vị trí rời rạc. '
        + 'Không có nó thì trống có thể dừng giữa hai cấp số — lúc đó vấu cài then '
        + 'chỉ ăn một nửa và sẽ vỡ.',
      fail: 'Hốc mòn tròn -> mất cảm giác vào số, dễ nhảy số.',
    },
  },
  {
    id: 'drum', name: 'Trống số', nameEn: 'Shift drum',
    qty: 1, category: CAT.shift, pivot: [0, D.y, D.z], build: drumGeo,
    info: {
      material: 'Thép, mặt ngoài phay rãnh xoắn',
      spec: `2 rãnh xoắn · 5 vị trí cách nhau ${360 / 5}° · kiểu xoay vòng N–1–2–3–4–N`,
      fn: 'Bộ điều phối của cả hộp số: biến chuyển động quay từng bước thành chuyển động '
        + 'TRƯỢT DỌC TRỤC của càng cua. Hình dạng rãnh chính là thứ bảo đảm '
        + 'KHÔNG BAO GIỜ ăn 2 số cùng lúc — điều đó sẽ khóa cứng hộp số và vỡ bánh răng ngay.',
      fail: 'Rãnh mòn -> hành trình cài then không đủ -> vào số không trọn, dễ nhảy số.',
    },
  },
  {
    id: 'fork-shaft', name: 'Trục càng cua', nameEn: 'Shift fork shaft',
    qty: 1, category: CAT.shift, build: forkShaftGeo,
    info: {
      material: 'Thép tôi mài bóng', spec: `Ø${L.forkShaft.r * 2} mm — cả 2 càng cùng trượt trên đây`,
      fn: 'Trục dẫn hướng cho càng cua trượt dọc. Càng cua KHÔNG quay, chỉ trượt.',
      fail: 'Xước -> càng cua trượt cứng, vào số nặng.',
    },
  },
  {
    id: 'fork-a', name: 'Càng cua số 1–2', nameEn: 'Shift fork 1–2',
    qty: 1, category: CAT.shift, build: () => forkGeo('a'),
    info: {
      material: 'Thép thấm cacbon, mỏ mài bóng',
      spec: `Hành trình ±${S.travel} mm · chốt trượt trong rãnh trống số`,
      fn: 'Nhận lệnh từ rãnh trống số (qua chốt) và đẩy cài then A sang trái (số 1) '
        + 'hoặc sang phải (số 2).',
      fail: 'Mỏ càng MÒN MỎNG hoặc CONG (do đạp số khi ly hợp chưa mở) -> hành trình không '
        + 'đủ -> vào số khó và nhảy số. Đo chiều dày mỏ bằng thước cặp.',
    },
  },
  {
    id: 'fork-b', name: 'Càng cua số 3–4', nameEn: 'Shift fork 3–4',
    qty: 1, category: CAT.shift, build: () => forkGeo('b'),
    info: {
      material: 'Thép thấm cacbon',
      spec: `Hành trình ±${S.travel} mm`,
      fn: 'Như càng cua 1–2, điều khiển cài then B cho số 3 và số 4.',
      fail: 'Như trên.',
    },
  },

  // ── Trục thứ cấp ───────────────────────────────────────────────────────────
  {
    id: 'slider-a', name: 'Cài then số 1–2', nameEn: 'Dog clutch slider 1–2',
    qty: 1, category: CAT.counter, pivot: [0, C.y, C.z], build: () => sliderGeo('a'),
    info: {
      material: 'Thép thấm cacbon tôi',
      spec: `${S.dogCount} vấu mỗi mặt · Ø vấu ${S.dogD} mm · đặt ở R${S.dogR} mm`,
      fn: 'Trượt dọc trục nhưng KHÔNG quay được so với trục (nhờ then hoa). '
        + 'Vấu của nó cắm vào lỗ trên mặt bên bánh răng chạy lô -> khóa bánh răng đó '
        + 'vào trục -> momen đi qua đúng cấp số đó. Đây chính là toàn bộ hành động "sang số".',
      fail: 'Vấu bị VẠT TRÒN ở cạnh -> lực dọc trục sinh ra khi truyền momen sẽ đẩy cài then '
        + 'bật ra = NHẢY SỐ. Nguyên nhân gốc gần như luôn là ly hợp không mở hết khi sang số.',
    },
  },
  {
    id: 'slider-b', name: 'Cài then số 3–4', nameEn: 'Dog clutch slider 3–4',
    qty: 1, category: CAT.counter, pivot: [0, C.y, C.z], build: () => sliderGeo('b'),
    info: {
      material: 'Thép thấm cacbon tôi',
      fn: 'Như cài then 1–2, phụ trách số 3 và số 4.',
      fail: 'Như trên.',
    },
  },
  ...[1, 2, 3, 4].map((n) => ({
    id: `gear-c${n}`, name: `Bánh răng thứ cấp số ${n} (${GEARS[n - 1].zC} răng)`,
    nameEn: `${n}${['st', 'nd', 'rd', 'th'][n - 1]} driven gear`,
    qty: 1, category: CAT.counter, pivot: [0, C.y, C.z], build: () => counterGearGeo(n),
    info: {
      material: 'Thép thấm cacbon tôi',
      spec: `${GEARS[n - 1].zC} răng · ăn với ${GEARS[n - 1].zM} răng -> tỉ số ${rat(n)} : 1`,
      tolerance: 'Khe hở dọc trục 0,05–0,20 mm · chạy lô trên bạc đồng',
      fn: 'CHẠY LÔ trên trục: nó luôn quay (vì luôn ăn khớp với bánh răng sơ cấp) nhưng '
        + 'chỉ truyền momen ra trục khi cài then khóa nó lại. Bật chế độ Hoạt động và '
        + 'để ở mo sẽ thấy rõ: cả 4 bánh răng này đều quay mà trục thứ cấp vẫn đứng.',
      fail: 'Lỗ vấu bị BANH MIỆNG hoặc răng rỗ -> nhảy số / kêu ru ở đúng cấp số đó. '
        + 'Phải thay cả CẶP (cả bánh sơ cấp tương ứng).',
    },
  })),
  {
    id: 'bushings', name: 'Bạc chạy lô (4)', nameEn: 'Gear bushings',
    qty: 4, category: CAT.counter, build: bushingsGeo,
    info: {
      material: 'Đồng thanh',
      fn: 'Ổ trượt cho bánh răng chạy lô quay TỰ DO trên trục khi cấp số đó không được chọn. '
        + 'Chênh tốc độ giữa bánh răng và trục có thể rất lớn, nên chỗ này cần nhớt tốt.',
      fail: 'Mòn -> bánh răng lắc, ăn khớp lệch -> kêu ru và mòn răng nhanh.',
    },
  },
  {
    id: 'countershaft', name: 'Trục thứ cấp (trục ra)', nameEn: 'Countershaft / output shaft',
    qty: 1, category: CAT.counter, pivot: [0, C.y, C.z], build: countershaftGeo,
    info: {
      material: 'Thép thấm cacbon, có then hoa tại 2 vị trí cài then',
      spec: `Ø${C.shaftR * 2} mm · đầu ra xuyên qua lốc máy để lắp nhông trước`,
      tolerance: 'Độ đảo ≤ 0,05 mm',
      fn: 'Nhận momen qua cấp số đang được chọn và đưa ra nhông trước.',
      fail: 'Cong -> ăn khớp lệch, kêu ru. Cổ trục chỗ phớt bị xước -> rỉ nhớt ra nhông trước.',
    },
  },

  // ── Trục sơ cấp ────────────────────────────────────────────────────────────
  ...[4, 3, 2].map((n) => ({
    id: `gear-m${n}`, name: `Bánh răng sơ cấp số ${n} (${GEARS[n - 1].zM} răng)`,
    nameEn: `${n}${['st', 'nd', 'rd', 'th'][n - 1]} drive gear`,
    qty: 1, category: CAT.main, pivot: [0, M.y, M.z], build: () => mainGearGeo(n),
    info: {
      material: 'Thép thấm cacbon tôi',
      spec: `${GEARS[n - 1].zM} răng · cố định vào trục bằng then hoa`,
      fn: 'Quay cùng trục sơ cấp, luôn ăn khớp với bánh răng thứ cấp tương ứng.',
      fail: 'Răng rỗ/vỡ -> kêu "cục cục" theo vòng quay ở mọi cấp số (vì nó luôn ăn khớp).',
    },
  })),
  {
    id: 'mainshaft', name: 'Trục sơ cấp (+ bánh răng số 1 liền trục)',
    nameEn: 'Mainshaft with integral 1st gear',
    qty: 1, category: CAT.main, pivot: [0, M.y, M.z], build: mainshaftGeo,
    info: {
      material: 'Thép thấm cacbon, răng số 1 cắt trực tiếp vào trục',
      spec: `Ø${M.shaftR * 2} mm · bánh răng số 1 chỉ ${GEARS[0].zM} răng nên chân răng còn `
        + `R${(MODULE * GEARS[0].zM / 2 - MODULE * 1.25).toFixed(1)} mm — không đủ chỗ cho moay-ơ, `
        + 'buộc phải làm liền trục',
      tolerance: 'Độ đảo ≤ 0,05 mm',
      fn: 'Nhận momen từ ly hợp đa đĩa và mang toàn bộ bánh răng chủ động.',
      fail: 'Then hoa mòn -> bánh răng cố định lắc. Răng số 1 hỏng -> phải thay cả trục.',
    },
  },

  // ── Ổ đỡ · phớt · nhông ────────────────────────────────────────────────────
  {
    id: 'bearings', name: 'Ổ bi đỡ trục (4)', nameEn: 'Shaft bearings',
    qty: 4, category: CAT.support, build: bearingsGeo,
    info: {
      material: 'Ổ bi cầu', spec: 'Lắp ép vào lốc máy',
      fn: 'Đỡ 2 đầu của mỗi trục. Lắp ép nên phải hâm nóng lốc máy khi thay, không đóng búa.',
      fail: 'Kẹn/lỏng -> tiếng ru đều theo tốc độ xe. Đóng búa vào vòng trong làm mòn '
        + 'vết bi -> ổ kêu sau vài trăm km.',
    },
  },
  {
    id: 'output-seal', name: 'Phớt trục thứ cấp', nameEn: 'Output shaft seal',
    qty: 1, category: CAT.support, build: outputSealGeo,
    info: {
      material: 'Cao su NBR + khung thép',
      fn: 'Chặn nhớt không rỉ ra ngoài theo trục ra.',
      fail: 'Rỉ nhớt ra vùng nhông trước — dấu hiệu là nhông và sên luôn ướt nhớt. '
        + 'Thay được mà KHÔNG cần tách lốc máy.',
    },
  },
  {
    id: 'front-sprocket', name: 'Nhông trước', nameEn: 'Front / drive sprocket',
    qty: 1, category: CAT.support, pivot: [0, C.y, C.z], build: frontSprocketGeo,
    info: {
      material: 'Thép tôi', spec: `${L.sprocket.teeth} răng · sên ${L.sprocket.pitch} mm (loại 428)`,
      torque: 'Đai ốc ≈ 54 N·m, có long đen khóa',
      fn: 'Điểm cuối của hộp số: đưa momen ra sên. Đổi 1 răng ở đây tương đương '
        + 'đổi ~2,5 răng ở dĩa sau, nên đây là chỗ tinh chỉnh mạnh nhất (hệ thống 09).',
      fail: 'Mòn nhanh nhất trong bộ nhông–dĩa–sên vì ít răng nhất. '
        + 'Răng cong hình lưỡi liềm = phải thay cả bộ.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-clutch', name: 'Chuông ly hợp đa đĩa (ngữ cảnh)', nameEn: 'Wet clutch basket',
    qty: 1, category: CAT.ctx, pivot: [0, M.y, M.z], build: clutchGeo,
    info: {
      material: 'Thép',
      fn: 'Nơi momen từ động cơ đi vào hộp số. Nó cũng chính là thứ bị MỞ RA trong khoảnh '
        + 'khắc đạp số. Chi tiết đầy đủ ở hệ thống 04.',
    },
  },
  {
    id: 'ctx-case', name: 'Lốc máy (ngữ cảnh)', nameEn: 'Crankcase',
    qty: 1, category: CAT.ctx, build: caseGeo,
    info: {
      material: 'Hợp kim nhôm đúc',
      spec: 'Mặt ghép vuông góc trục X — muốn vào hộp số phải TÁCH lốc máy',
      fn: 'Đỡ toàn bộ các trục và chứa nhớt. Chi tiết đầy đủ ở hệ thống 03.',
    },
  },
];
