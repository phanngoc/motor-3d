/**
 * parts.js — Toàn bộ chi tiết của hệ thống nạp–xả và cung cấp nhiên liệu.
 *
 * Trục chính của hệ này nằm dọc Z (chiều dòng khí), khác các hệ trước nằm dọc X,
 * nên phần đầu file có một bộ helper riêng để đặt khối tròn xoay và khối kéo dọc Z.
 *
 * Chi tiết đáng chú ý về cấu trúc: `cv-slide` mang một node con `needle` là kim
 * xăng. Kim gắn cứng vào van trượt nên nhấc cùng nhau — và chính vì thế hình vẽ
 * (kim rút lên) và số (tiết diện khe kim) dùng CHUNG một biến độ mở van trượt.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, extrudeY, lathe,
  rod, tubeSolid, hexPrism, boltGeo, coilSpring, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, boreRadiusAt, needleRadiusFromTop } from './layout.js';

const C = L.carb, SL = L.slide, ND = L.needle, NJ = L.needleJet, BF = L.butterfly;
const BW = L.bowl, FL = L.float, AB = L.airbox, MF = L.manifold;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER TRỤC Z (chiều dòng khí) VÀ TRỤC X
// ─────────────────────────────────────────────────────────────────────────────

/** Khối tròn xoay quanh Y -> dựng lại quanh Z, thân chạy z ∈ [z0, z0+dài]. */
const zRev = (geo, z0, x = 0, y = 0) => place(geo, { rx: Math.PI / 2, x, y, z: z0 });
/** Khối tròn xoay quanh Y -> dựng lại quanh X, thân chạy x ∈ [x0, x0+dài]. */
const xRev = (geo, x0, y = 0, z = 0) => place(geo, { rz: -Math.PI / 2, x: x0, y, z });

/** Kéo shape dọc trục Z: shape(u,v) -> (x=u, y=v), thân chạy z ∈ [z0, z0+dài]. */
const exZ = (shape, len, z0 = 0, opts = {}) =>
  place(extrudeY(shape, len, opts), { rx: -Math.PI / 2, z: z0 + len });

const zLathe = (profile, z0, x = 0, y = 0, segs = 40) => zRev(lathe(profile, segs), z0, x, y);
const zRod = (r, z0, z1, x = 0, y = 0, segs = 26) => zRev(rod(r, 0, z1 - z0, segs), z0, x, y);
const zTube = (rO, rI, z0, z1, x = 0, y = 0, segs = 30) =>
  zRev(tubeSolid(rO, rI, 0, z1 - z0, segs), z0, x, y);

const xRod = (r, x0, x1, y = 0, z = 0, segs = 20) => xRev(rod(r, 0, x1 - x0, segs), x0, y, z);
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 22) =>
  xRev(tubeSolid(rO, rI, 0, x1 - x0, segs), x0, y, z);
const xLathe = (profile, x0, y = 0, z = 0, segs = 22) => xRev(lathe(profile, segs), x0, y, z);

/** Khối tròn xoay quanh Y, giữ nguyên trục Y (buồng phao, van trượt). */
const yLathe = (profile, y0, x = 0, z = 0, segs = 36) => place(lathe(profile, segs), { x, y: y0, z });

/**
 * Tạo một node QUAY QUANH TRỤC X đi qua điểm (y = cy, z = cz).
 * Cần thiết vì node con của một chi tiết quay quanh GỐC của chi tiết đó; muốn nó
 * quay quanh trục riêng thì phải dịch hình về gốc rồi dịch node ra chỗ cần.
 * Không làm bước này thì bướm ga sẽ "bay" ra khỏi lỗ thông khi mở.
 */
function pivotX(name, cy, cz, geos, mat, meshName) {
  const node = new THREE.Group();
  node.name = name;
  node.add(mesh(place(union(geos), { y: -cy, z: -cz }), mat, meshName));
  node.position.set(0, cy, cz);
  return node;
}

// ─────────────────────────────────────────────────────────────────────────────
// THÂN BỘ HOÀ KHÍ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thân bộ hoà khí. Biên dạng lỗ thông lấy TRỰC TIẾP từ `boreRadiusAt`, nên hình
 * vẽ họng khuếch tán và con số tiết diện họng dùng chung một hàm.
 */
function carbBodyGeo() {
  const parts = [];
  const nz = 24;
  const inner = [], outer = [];
  for (let i = 0; i <= nz; i++) {
    const z = C.z0 + (i / nz) * (C.z1 - C.z0);
    inner.push([boreRadiusAt(z), z - C.z0]);
    outer.push([C.bodyR, z - C.z0]);
  }
  // biên dạng khép kín: lên theo mặt trong, ra vành, về theo mặt ngoài
  const prof = [...inner, [C.bodyR, C.z1 - C.z0], [C.bodyR, 0], inner[0]];
  parts.push(zLathe(prof, C.z0, 0, 0, 44));

  // hai mặt bích
  for (const [z, r] of [[C.z0, 24], [C.z1 - C.flangeT, 23]]) {
    const s = circleShape(r, 0, 0);
    bore(s, C.rIn, 0, 0);
    for (let i = 0; i < C.bolts; i++) bore(s, 3.2, (i ? 1 : -1) * C.boltSpan / 2, 0);
    parts.push(exZ(s, C.flangeT, z, { curveSegments: 12 }));
  }

  // buồng chân không phía trên van trượt
  parts.push(place(tubeSolid(SL.r + 4, SL.r + 0.4, 0, SL.chamberTop - 6, 34),
    { y: 6, z: C.zThroat }));

  // vấu bắt vít gió · vít ga · e gió
  parts.push(xRod(6, -C.bodyR - 9, -C.bodyR + 2, L.airScrew.y, L.airScrew.z, 14));
  parts.push(xRod(7, -C.bodyR - 9, -C.bodyR + 2, L.idleScrew.y, L.idleScrew.z, 14));
  parts.push(xRod(7, C.bodyR - 2, C.bodyR + 9, L.chokePlunger.y, L.chokePlunger.z, 14));
  // ổ trục bướm ga xuyên ngang thân
  parts.push(xRod(5.5, -C.bodyR, C.bodyR, 0, BF.z, 16));
  // vành lắp buồng phao
  parts.push(yLathe([[BW.r + 3, 0], [BW.r + 3, 4], [C.rIn + 1, 4], [C.rIn + 1, 0]],
    BW.y1, 0, C.zThroat, 34));

  return new THREE.Group().add(mesh(union(parts), MAT.aluCast, 'carb-body'));
}

// ─────────────────────────────────────────────────────────────────────────────
// VAN TRƯỢT CHÂN KHÔNG + KIM XĂNG
// ─────────────────────────────────────────────────────────────────────────────

function cvSlideGeo() {
  const grp = new THREE.Group();
  grp.add(mesh(union([
    yLathe([[0, 0], [SL.r, 0], [SL.r, SL.h - 5], [SL.r - 3, SL.h], [0, SL.h]], 0, 0, C.zThroat, 36),
    // lỗ cảm nhận chân không xuyên đáy van — chính nó nhấc van lên
    place(tubeSolid(2.6, 1.2, 0, 5, 12), { y: 0, z: C.zThroat - 6 }),
  ]), MAT.blackOxide, 'cv-slide-body'));

  grp.add(mesh(yLathe([[SL.r, SL.h - 6], [SL.r + 3.6, SL.h - 3], [SL.r + 3.6, SL.h - 1],
    [SL.r, SL.h - 4], [SL.r, SL.h - 6]], 0, 0, C.zThroat, 34), MAT.rubber, 'cv-diaphragm'));

  // ── Kim xăng: node con, nhấc CÙNG van trượt ──────────────────────────────
  const needleNode = new THREE.Group();
  needleNode.name = 'needle';
  const n = 16;
  const prof = [[0, 0]];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * ND.len;
    prof.push([needleRadiusFromTop(ND.len - s), s]);
  }
  prof.push([ND.rStraight + 1.4, ND.len], [ND.rStraight + 1.4, ND.len + 3], [0, ND.len + 3]);
  // Kim treo từ van trượt xuống, mũi hướng −Y: dựng ngược rồi lật.
  needleNode.add(mesh(place(lathe(prof, 18), { rx: Math.PI, y: SL.h - 2, z: C.zThroat }),
    MAT.hardened, 'jet-needle'));
  grp.add(needleNode);

  grp.userData.nodes = { needle: needleNode };
  return grp;
}

const slideSpringGeo = () => new THREE.Group().add(mesh(
  place(coilSpring(SL.springR, 1.0, SL.springTurns, 24), { y: SL.h + 4, z: C.zThroat }),
  MAT.spring, 'slide-spring'));

function topCapGeo() {
  const s = circleShape(SL.r + 7, 0, 0);
  for (let i = 0; i < 2; i++) bore(s, 2.6, (i ? 1 : -1) * (SL.r + 4), 0);
  return new THREE.Group().add(mesh(union([
    place(extrudeY(s, 5, { curveSegments: 20 }), { y: SL.chamberTop, z: C.zThroat }),
    place(rod(4, 0, 8, 14), { y: SL.chamberTop + 5, z: C.zThroat }),
  ]), MAT.alu, 'carb-top-cap'));
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚM GA
// ─────────────────────────────────────────────────────────────────────────────

/** Bướm ga. Node `plate` quay quanh trục X: 0° = đóng (vuông góc dòng khí). */
function butterflyGeo() {
  const plateNode = pivotX('plate', 0, BF.z,
    [zLathe([[0, 0], [BF.r, 0], [BF.r, BF.t], [0, BF.t]], BF.z - BF.t / 2, 0, 0, 30)],
    MAT.bronze, 'throttle-plate');

  const grp = new THREE.Group();
  grp.add(mesh(xRod(BF.shaftR, -C.bodyR - 4, C.bodyR + 10, 0, BF.z, 16),
    MAT.steel, 'throttle-shaft'));
  grp.add(plateNode);
  grp.userData.nodes = { plate: plateNode };
  return grp;
}

/** Ròng rọc dây ga + lò xo hồi. Node `drum` quay theo tay ga. */
function cableDrumGeo() {
  const CD = L.cableDrum;
  const drumNode = pivotX('drum', 0, BF.z, [
    xTube(CD.r, CD.r - 3, CD.x, CD.x + CD.t, 0, BF.z, 26),
    xLathe([[0, 0], [CD.r - 2, 0], [CD.r - 2, 2], [0, 2]], CD.x, 0, BF.z, 24),
    // tai kéo dây ga
    place(extrudeY(roundedRect(4, CD.r, 1.5), 5), { x: CD.x + 1, y: 0, z: BF.z + CD.r / 2 }),
  ], MAT.steel, 'cable-drum');

  const grp = new THREE.Group();
  grp.add(drumNode);
  grp.add(mesh(xRev(coilSpring(CD.r - 4, 0.8, 4, 8), CD.x - 9, 0, BF.z),
    MAT.spring, 'throttle-return-spring'));
  grp.userData.nodes = { drum: drumNode };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// GÍC-LƠ · ỐNG KIM
// ─────────────────────────────────────────────────────────────────────────────

const needleJetGeo = () => new THREE.Group().add(mesh(union([
  place(tubeSolid(NJ.rOut, NJ.rIn, 0, NJ.y1 - NJ.y0, 26), { y: NJ.y0, z: C.zThroat }),
  // lỗ nhũ hoá — không khí trộn vào xăng TRƯỚC khi ra họng
  ...Array.from({ length: 5 }, (_, i) =>
    xRod(0.55, -NJ.rOut - 0.6, NJ.rOut + 0.6, NJ.y0 + 5 + i * 4.6, C.zThroat, 8)),
]), MAT.bronze, 'needle-jet'));

const mainJetGeo = () => new THREE.Group().add(mesh(union([
  place(hexPrism(7, 4, 0.3), { y: L.mainJet.y - 4, z: C.zThroat }),
  place(tubeSolid(L.mainJet.rBody, L.mainJet.r, 0, 8, 18), { y: L.mainJet.y, z: C.zThroat }),
]), MAT.bronze, 'main-jet'));

const pilotJetGeo = () => new THREE.Group().add(mesh(union([
  place(hexPrism(5.4, 3, 0.3), { y: L.pilotJet.y - 3, z: L.pilotJet.z }),
  place(tubeSolid(L.pilotJet.rBody, L.pilotJet.r, 0, 9, 16), { y: L.pilotJet.y, z: L.pilotJet.z }),
]), MAT.bronze, 'pilot-jet'));

// ─────────────────────────────────────────────────────────────────────────────
// BUỒNG PHAO
// ─────────────────────────────────────────────────────────────────────────────

const H = BW.y1 - BW.y0;

const bowlGeo = () => new THREE.Group().add(mesh(union([
  yLathe([[BW.r - 2.5, 4], [BW.r, 4], [BW.r, H], [BW.r - 2.5, H], [BW.r - 2.5, 4]],
    BW.y0, 0, C.zThroat, 38),
  yLathe([[0, 0], [BW.r, 0], [BW.r, 4], [0, 4]], BW.y0, 0, C.zThroat, 38),
  yLathe([[BW.r, H - 4], [BW.r + 3, H - 4], [BW.r + 3, H], [BW.r, H]], BW.y0, 0, C.zThroat, 38),
]), MAT.aluCast, 'float-bowl'));

const bowlGasketGeo = () => new THREE.Group().add(mesh(
  place(tubeSolid(BW.r + 2, BW.r - 1, 0, BW.gasketT, 38), { y: BW.y1, z: C.zThroat }),
  MAT.gasket, 'bowl-gasket'));

const bowlScrewsGeo = () => new THREE.Group().add(mesh(union(
  Array.from({ length: L.bowlScrews }, (_, i) => {
    const a = (i / L.bowlScrews) * TAU + deg(20);
    return place(boltGeo(4, 12, { headAF: 7, headH: 3 }), {
      rx: Math.PI, x: (BW.r - 1) * Math.cos(a), y: BW.y0 - 1,
      z: C.zThroat + (BW.r - 1) * Math.sin(a),
    });
  }),
), MAT.blackOxide, 'bowl-screws'));

/** Cặp phao + trục phao. Node `arm` xoay theo mức xăng. */
function floatGeo() {
  const parts = [];
  for (const sx of [-1, 1]) {
    parts.push(zLathe([[0, 0], [FL.r, 2], [FL.r, FL.len - 2], [0, FL.len]],
      C.zThroat - FL.len / 2, sx * FL.xOff, FL.y, 20));
  }
  parts.push(place(extrudeY(roundedRect(2 * FL.xOff + 6, 4, 1), 2.2),
    { y: FL.y + FL.r, z: C.zThroat + FL.len / 2 - 2 }));
  parts.push(xRod(1.8, -FL.xOff - 6, FL.xOff + 6, FL.y + FL.r + 1, C.zThroat + FL.len / 2, 10));
  // Phao xoay quanh TRỤC PHAO, không quanh gốc toạ độ.
  const armNode = pivotX('arm', FL.y + FL.r + 1, C.zThroat + FL.len / 2,
    parts, MAT.plastic, 'floats');

  const grp = new THREE.Group();
  grp.add(armNode);
  grp.userData.nodes = { arm: armNode };
  return grp;
}

/** Van kim phao. Node `pin` đi lên xuống theo phao, đóng/mở đường xăng vào. */
function floatValveGeo() {
  const pinNode = new THREE.Group();
  pinNode.name = 'pin';
  pinNode.add(mesh(union([
    place(lathe([[0, 0], [1.8, 2.6], [1.8, 12], [0, 12]], 16),
      { y: BW.y1 - 2, z: C.zThroat - 12 }),
    place(coilSpring(1.5, 0.4, 4, 5), { y: BW.y1 + 10, z: C.zThroat - 12 }),
  ]), MAT.hardened, 'float-needle'));

  const grp = new THREE.Group();
  grp.add(mesh(place(tubeSolid(3.6, 2.0, 0, 10, 18), { y: BW.y1 + 1, z: C.zThroat - 12 }),
    MAT.bronze, 'valve-seat'));
  grp.add(pinNode);
  grp.userData.nodes = { pin: pinNode };
  return grp;
}

/** Mặt xăng trong buồng phao — node `level` dịch theo mức đặt. */
function fuelSurfaceGeo() {
  const levelNode = new THREE.Group();
  levelNode.name = 'level';
  levelNode.add(mesh(
    place(lathe([[0, 0], [BW.r - 3, 0], [BW.r - 3, 1.2], [0, 1.2]], 36),
      { y: L.fuelLevel.spec, z: C.zThroat }), MAT.oil, 'fuel-surface'));
  const grp = new THREE.Group();
  grp.add(levelNode);
  grp.userData.nodes = { level: levelNode };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// VÍT ĐIỀU CHỈNH · E GIÓ · ỐNG TRÀN
// ─────────────────────────────────────────────────────────────────────────────

const IS = L.idleScrew, AS = L.airScrew, CP = L.chokePlunger;

const idleScrewGeo = () => new THREE.Group().add(mesh(union([
  xRod(3, IS.x - IS.len + 10, IS.x + 10, IS.y, IS.z, 14),
  xLathe([[0, 0], [9, 0], [9, 6], [6, 8], [0, 8]], IS.x - IS.len + 2, IS.y, IS.z, 22),
  xRev(coilSpring(4.5, 0.7, 5, 10), IS.x - 4, IS.y, IS.z),
]), MAT.plastic, 'idle-screw'));

const airScrewGeo = () => new THREE.Group().add(mesh(union([
  xRod(2.2, AS.x - AS.len + 8, AS.x + 8, AS.y, AS.z, 12),
  place(hexPrism(8, 3, 0.3), { rz: -Math.PI / 2, x: AS.x - AS.len + 5, y: AS.y, z: AS.z }),
  xRev(coilSpring(3.2, 0.6, 4, 8), AS.x - 2, AS.y, AS.z),
]), MAT.blackOxide, 'pilot-air-screw'));

/** E gió (làm đậm). Node `plunger` rút RA khi bật e. */
function chokeGeo() {
  const plungerNode = new THREE.Group();
  plungerNode.name = 'plunger';
  plungerNode.add(mesh(union([
    xRod(CP.r - 1.6, CP.x, CP.x + CP.len, CP.y, CP.z, 16),
    xLathe([[0, 0], [CP.r + 2, 0], [CP.r + 2, 5], [0, 5]], CP.x + CP.len, CP.y, CP.z, 20),
  ]), MAT.blackOxide, 'choke-plunger'));

  const grp = new THREE.Group();
  grp.add(mesh(xTube(CP.r, CP.r - 1.4, CP.x - 2, CP.x + CP.len - 6, CP.y, CP.z, 20),
    MAT.bronze, 'choke-bore'));
  grp.add(plungerNode);
  grp.userData.nodes = { plunger: plungerNode };
  return grp;
}

const overflowGeo = () => new THREE.Group().add(mesh(
  place(tubeSolid(L.overflow.r, L.overflow.r - 0.9, 0, L.overflow.y1 - L.overflow.y0, 14),
    { x: L.overflow.x, y: L.overflow.y0, z: C.zThroat }),
  MAT.rubber, 'overflow-tube'));

const drainScrewGeo = () => new THREE.Group().add(mesh(
  zRev(boltGeo(5, 12, { headAF: 8, headH: 4 }), C.zThroat - BW.r - 10, 0, L.drainScrew.y),
  MAT.blackOxide, 'drain-screw'));

// ─────────────────────────────────────────────────────────────────────────────
// HỘP GIÓ · LỌC GIÓ · CỔ HÚT
// ─────────────────────────────────────────────────────────────────────────────

function airboxGeo() {
  const shell = roundedRect(AB.w, AB.h, AB.r, 0, 0);
  shell.holes.push(new THREE.Path(
    roundedRect(AB.w - 5, AB.h - 5, AB.r - 2, 0, 0).getPoints(26).reverse()));

  const back = roundedRect(AB.w, AB.h, AB.r, 0, 0);
  bore(back, 16, 0, 0);
  const front = roundedRect(AB.w, AB.h, AB.r, 0, 0);
  bore(front, L.boot.r, 0, 0);

  return new THREE.Group().add(mesh(union([
    exZ(shell, AB.z1 - AB.z0, AB.z0, { curveSegments: 10 }),
    exZ(back, 4, AB.z1 - 4, { curveSegments: 10 }),
    exZ(front, 4, AB.z0, { curveSegments: 10 }),
  ]), MAT.plastic, 'airbox'));
}

function filterGeo() {
  const F = L.filter;
  const parts = [
    exZ(roundedRect(F.w, F.h, 8, 0, 0), 3, F.z0, { curveSegments: 8 }),
    exZ(roundedRect(F.w, F.h, 8, 0, 0), 3, F.z1 - 3, { curveSegments: 8 }),
  ];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const x = -F.w / 2 + 4 + (i / (n - 1)) * (F.w - 8);
    parts.push(exZ(roundedRect(2.4, F.h - 6, 0.6, x, 0), F.z1 - F.z0 - 6, F.z0 + 3,
      { curveSegments: 2 }));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.gasket, 'air-filter'));
}

const bootGeo = () => new THREE.Group().add(mesh(union([
  zTube(L.boot.r, L.boot.r - 2.4, C.z1 - 4, AB.z0 + 4, 0, 0, 26),
  zTube(L.boot.r + 2, L.boot.r - 2.4, C.z1 - 4, C.z1 + 2, 0, 0, 26),
]), MAT.rubber, 'intake-boot'));

function manifoldGeo() {
  const fBig = circleShape(24, 0, 0);
  bore(fBig, MF.rIn, 0, 0);
  for (let i = 0; i < 2; i++) bore(fBig, 3.2, (i ? 1 : -1) * C.boltSpan / 2, 0);
  const fSmall = circleShape(22, 0, 0);
  bore(fSmall, MF.rIn, 0, 0);
  return new THREE.Group().add(mesh(union([
    zTube(MF.rOut, MF.rIn, MF.z0, MF.z1, 0, 0, 28),
    exZ(fBig, C.flangeT, MF.z1 - C.flangeT, { curveSegments: 12 }),
    exZ(fSmall, C.flangeT, MF.z0, { curveSegments: 12 }),
  ]), MAT.aluCast, 'intake-manifold'));
}

const manifoldGasketGeo = () => new THREE.Group().add(mesh(union([
  zTube(21, MF.rIn, MF.z0 - 1.8, MF.z0, 0, 0, 30),
  zTube(23, C.rIn, C.z0 - 1.8, C.z0, 0, 0, 30),
]), MAT.gasket, 'intake-gaskets'));

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH: XẢ · BÌNH XĂNG · ĐẦU BÒ
// ─────────────────────────────────────────────────────────────────────────────

const exhaustGeo = () => new THREE.Group().add(mesh(union([
  zTube(L.header.rOut, L.header.rIn, L.header.z0, L.header.z1, 0, 0, 20),
  zLathe([[0, 0], [L.header.rOut, 0], [L.muffler.r, 14],
    [L.muffler.r, L.muffler.z1 - L.muffler.z0 - 10],
    [L.muffler.r - 6, L.muffler.z1 - L.muffler.z0], [0, L.muffler.z1 - L.muffler.z0]],
  L.muffler.z0, 0, 0, 26),
]), MAT.ghost, 'ctx-exhaust'));

const tankGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(roundedRect(L.tank.w, L.tank.d, 26, 0, 30), L.tank.y1 - L.tank.y0,
    { curveSegments: 8 }), { y: L.tank.y0 }),
  place(lathe([[0, 0], [9, 0], [9, 10], [0, 10]], 20), { y: L.petcock.y - 10, z: L.petcock.z }),
  place(tubeSolid(3.4, 2.4, 0, L.petcock.y - 10 - (BW.y1 + 12), 14),
    { y: BW.y1 + 12, z: L.petcock.z }),
]), MAT.ghost, 'ctx-tank'));

const headGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(roundedRect(56, 46, 8, 0, 0), 52, { curveSegments: 6 }), { y: -26, z: L.head.z }),
  zTube(MF.rIn, MF.rIn - 3, L.head.z, MF.z0 + 2, 0, 0, 18),
  zTube(L.header.rIn - 1, L.header.rIn - 4, L.header.z1 - 6, L.head.z, 0, 0, 18),
]), MAT.ghost, 'ctx-head'));

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  air: 'Đường nạp khí',
  meter: 'Định lượng (van trượt & kim)',
  jets: 'Gíc-lơ & mạch xăng',
  bowl: 'Buồng phao',
  adj: 'Điều chỉnh',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Đường nạp khí ──────────────────────────────────────────────────────────
  {
    id: 'airbox', name: 'Hộp gió', nameEn: 'Airbox', qty: 1,
    category: CAT.air, build: airboxGeo,
    info: { material: 'Nhựa', spec: 'Kín, chỉ lấy khí qua một lỗ có định hướng',
      fn: 'Không chỉ để chứa lọc gió. Thể tích hộp gió là một phần của hệ dao động cột khí nạp — '
        + 'bỏ hộp gió ra chạy "trần" làm sai toàn bộ tỉ lệ xăng ở tầm ga giữa.',
      fail: 'Nứt hoặc lắp không kín -> khí lọt vào không qua lọc -> mài mòn xy-lanh nhanh.' },
  },
  {
    id: 'air-filter', name: 'Lọc gió', nameEn: 'Air filter element', qty: 1,
    category: CAT.air, build: filterGeo,
    info: {
      material: 'Giấy xếp nếp tẩm dầu (một số đời dùng mút)',
      spec: 'Vệ sinh/thay mỗi 8.000–12.000 km, sớm hơn nếu chạy đường bụi',
      fn: 'Chặn bụi. Nhờ xếp nếp nên diện tích bề mặt lớn hơn nhiều tiết diện lỗ nạp.',
      fail: 'TẮC -> ít khí -> hỗn hợp GIÀU -> tốn xăng, khói đen, đóng muội. Đây là nguyên nhân '
        + '"xe tự nhiên ăn xăng" thường gặp nhất và cũng dễ sửa nhất. Lọc GIẤY không được giặt '
        + 'nước hay xịt khí nén mạnh — làm thủng nếp giấy mà nhìn ngoài vẫn như mới.',
    },
  },
  {
    id: 'intake-boot', name: 'Ống cao su nối hộp gió', nameEn: 'Intake boot', qty: 1,
    category: CAT.air, build: bootGeo,
    info: { material: 'Cao su', fn: 'Nối hộp gió với bộ hoà khí, hấp thụ rung.',
      fail: 'Nứt hoặc lắp lệch -> hút khí giả -> NGHÈO ở ga nhỏ, không tải cao và trôi. '
        + 'Kiểm bằng cách xịt nước xà phòng quanh mối nối khi máy đang chạy — vòng tua đổi là có hở.' },
  },
  {
    id: 'intake-gaskets', name: 'Gioăng cổ hút (2)', nameEn: 'Intake gaskets', qty: 2,
    category: CAT.air, build: manifoldGasketGeo,
    info: { material: 'Giấy amiăng / cao su tổng hợp', fn: 'Làm kín hai mặt bích của cổ hút.',
      fail: 'Đây là chỗ hút khí giả số MỘT. Triệu chứng giống hệt "bộ hoà khí bẩn" nên rất nhiều '
        + 'người tháo bộ hoà khí ra rửa mà không hết. Thay gioăng mỗi lần tháo.' },
  },
  {
    id: 'intake-manifold', name: 'Cổ hút', nameEn: 'Intake manifold', qty: 1,
    category: CAT.air, build: manifoldGeo,
    info: { material: 'Nhôm đúc (một số đời bằng cao su cứng)', spec: `Ø trong ${MF.rIn * 2} mm`,
      fn: 'Dẫn hỗn hợp từ bộ hoà khí vào cửa nạp đầu bò. Cũng là nơi lấy chân không cho khoá xăng '
        + 'chân không ở những đời có.',
      fail: 'Nứt (loại cao su hay bị) -> hút khí giả. Uốn cổ hút để "lấy chỗ" gây nứt ngầm.' },
  },

  // ── Định lượng ─────────────────────────────────────────────────────────────
  {
    id: 'carb-top-cap', name: 'Nắp buồng chân không', nameEn: 'Vacuum chamber cap', qty: 1,
    category: CAT.meter, build: topCapGeo,
    info: { material: 'Nhôm', fn: 'Đóng kín buồng chân không phía trên van trượt.',
      fail: 'Siết lệch làm kẹp mép màng cao su -> van trượt không nhấc đủ -> nghèo ở ga lớn.' },
  },
  {
    id: 'slide-spring', name: 'Lò xo van trượt', nameEn: 'Slide spring', qty: 1,
    category: CAT.meter, build: slideSpringGeo,
    info: {
      material: 'Thép lò xo', spec: 'Rất mềm — chỉ vài trăm gam lực',
      fn: 'Đè van trượt xuống, chống lại chân không nhấc lên. Cân bằng giữa hai lực này quyết '
        + 'định độ mở van trượt ở mỗi lưu lượng khí.',
      fail: 'Lò xo cứng hơn -> van mở muộn -> nghèo tầm ga giữa. Lò xo mềm hơn -> mở sớm -> '
        + 'mất tốc độ khí qua họng -> ga lơ bị hụt.',
    },
  },
  {
    id: 'cv-slide', name: 'Van trượt chân không + kim xăng',
    nameEn: 'CV slide & jet needle', qty: 1, category: CAT.meter, build: cvSlideGeo,
    info: {
      material: 'Hợp kim nhẹ + màng cao su + kim thép mạ',
      spec: `Hành trình ${SL.travel} mm · kim treo ở khấc ${ND.clipPos}/5`,
      tolerance: 'Màng cao su phải không rạn, không rỗ kim châm',
      fn: 'ĐÂY LÀ CHI TIẾT QUAN TRỌNG NHẤT CỦA BỘ HOÀ KHÍ. Van trượt bị chân không ở họng nhấc lên '
        + 'và bị lò xo đè xuống, nên nó đi theo LƯU LƯỢNG KHÍ chứ KHÔNG đi theo tay ga. Vặn hết ga '
        + 'ở vòng tua thấp thì van trượt vẫn gần như đóng, tốc độ khí qua họng vẫn cao, xăng vẫn '
        + 'được hút đúng lượng. Bộ hoà khí van trượt cơ (dây ga kéo trực tiếp) không làm được điều '
        + 'này nên hay bị "ngộp" khi vặn ga đột ngột.',
      fail: 'Màng cao su RẠN (chỉ cần một lỗ kim châm) -> mất chân không -> van không nhấc -> xe '
        + 'không lên được ga lớn. Rất hay bị và rất hay bị chẩn sai thành "hư CDI". Kiểm bằng cách '
        + 'soi màng qua ánh sáng.',
    },
  },
  {
    id: 'needle-jet', name: 'Ống kim (ống nhũ hoá)', nameEn: 'Needle jet / emulsion tube',
    qty: 1, category: CAT.meter, build: needleJetGeo,
    info: {
      material: 'Đồng thau', spec: `Ø trong ${NJ.rIn * 2} mm · 4 hàng lỗ nhũ hoá`,
      fn: 'Kim xăng nằm trong ống này. Khe giữa kim và ống là tiết diện quyết định lượng xăng ở '
        + 'tầm ga giữa. Các lỗ nhỏ trên thân ống cho không khí trộn vào xăng TRƯỚC khi ra họng — '
        + 'nhờ vậy xăng ra dạng bọt, bay hơi tốt hơn nhiều so với ra dạng tia.',
      fail: 'Lỗ nhũ hoá tắc -> xăng ra dạng tia -> bay hơi kém -> chạy không đều tầm ga giữa. '
        + 'Ống kim mòn ôvan (do kim rung) -> giàu tầm ga giữa, không chỉnh được bằng gíc-lơ.',
    },
  },

  // ── Gíc-lơ ─────────────────────────────────────────────────────────────────
  {
    id: 'main-jet', name: 'Gíc-lơ chính', nameEn: 'Main jet', qty: 1,
    category: CAT.jets, build: mainJetGeo,
    info: {
      material: 'Đồng thau', spec: `Số hiệu #${L.mainJet.size} · Ø lỗ ${L.mainJet.r * 2} mm`,
      fn: 'Quyết định lượng xăng ở tầm ga LỚN (khoảng 3/4 tay ga trở lên), khi van trượt đã nhấc '
        + 'cao đến mức khe kim không còn là chỗ hẹp nhất. Gíc-lơ chính và khe kim nối TIẾP nhau, '
        + 'nên cái nào nhỏ hơn thì cái đó quyết định.',
      fail: 'Tắc -> NGHÈO ở ga lớn: chạy trong phố bình thường, ra đường lớn vặn ga to thì hụt, '
        + 'máy nóng, có thể cháy piston. Đổi số hiệu gíc-lơ chính KHÔNG sửa được lỗi ở ga nhỏ hay '
        + 'ga giữa — đó là việc của gíc-lơ chậm và kim xăng.',
    },
  },
  {
    id: 'pilot-jet', name: 'Gíc-lơ chậm', nameEn: 'Pilot / slow jet', qty: 1,
    category: CAT.jets, build: pilotJetGeo,
    info: {
      material: 'Đồng thau',
      spec: `Số hiệu #${L.pilotJet.size} · Ø lỗ ${L.pilotJet.r * 2} mm — RẤT nhỏ`,
      fn: 'Quyết định lượng xăng khi KHÔNG TẢI và ở 1/8 tay ga đầu tiên. Nó lấy xăng nhờ chân không '
        + 'SAU bướm ga — chân không đó cao nhất đúng lúc bướm ga đóng.',
      fail: 'Tắc -> không nổ được hoặc không tải không nổi, nhưng vặn ga to lại chạy được. Vì lỗ quá '
        + 'nhỏ nên đây là gíc-lơ TẮC ĐẦU TIÊN khi xe để lâu không chạy — xăng bay hơi để lại nhựa. '
        + 'Thông bằng dây đồng mảnh và xăng, KHÔNG dùng dây thép (làm rộng lỗ, sau đó giàu vĩnh viễn).',
    },
  },

  // ── Buồng phao ─────────────────────────────────────────────────────────────
  {
    id: 'bowl-screws', name: `Vít buồng phao (${L.bowlScrews})`, nameEn: 'Bowl screws',
    qty: L.bowlScrews, category: CAT.bowl, build: bowlScrewsGeo,
    info: { material: 'Thép', torque: '≈ 2 N·m — rất nhẹ', fn: 'Ép buồng phao lên thân.',
      fail: 'Siết quá tay -> vênh buồng phao -> rỉ xăng. Đầu vít rất mềm, dễ tuôn.' },
  },
  {
    id: 'drain-screw', name: 'Vít xả buồng phao', nameEn: 'Bowl drain screw', qty: 1,
    category: CAT.bowl, build: drainScrewGeo,
    info: { material: 'Thép + o-ring',
      fn: 'Xả xăng cũ trong buồng phao. Việc nên làm ĐẦU TIÊN khi xe để lâu không chạy — '
        + 'trước cả khi nghĩ đến tháo bộ hoà khí.',
      fail: 'O-ring chai -> rỉ xăng nhỏ giọt.' },
  },
  {
    id: 'float-bowl', name: 'Buồng phao', nameEn: 'Float bowl', qty: 1,
    category: CAT.bowl, build: bowlGeo,
    info: { material: 'Nhôm đúc', spec: 'Chứa khoảng 20 cm³ xăng',
      fn: 'Giữ một lượng xăng luôn ở MỘT MỨC CỐ ĐỊNH. Toàn bộ việc định lượng của bộ hoà khí dựa '
        + 'trên giả thiết mức xăng đứng yên — sai mức là sai tất cả.',
      fail: 'Đáy đọng cặn và nước. Nước nặng hơn xăng nên nằm dưới, đúng chỗ gíc-lơ hút.' },
  },
  {
    id: 'bowl-gasket', name: 'Gioăng buồng phao', nameEn: 'Bowl gasket', qty: 1,
    category: CAT.bowl, build: bowlGasketGeo,
    info: { material: 'Cao su chịu xăng', fn: 'Làm kín buồng phao.',
      fail: 'Chai hoặc lắp xoắn -> rỉ xăng ra ngoài. Thay mỗi lần tháo.' },
  },
  {
    id: 'fuel-surface', name: 'Mặt xăng trong buồng phao', nameEn: 'Fuel level',
    qty: 1, category: CAT.bowl, build: fuelSurfaceGeo, stays: true,
    info: {
      material: 'Không phải chi tiết — đây là MỨC XĂNG',
      spec: `Định mức ${L.fuelLevel.spec} mm so với mặt lắp buồng phao, sai số ±1 mm`,
      fn: 'Mức xăng là chuẩn gốc của toàn bộ việc định lượng. Kéo thanh "mức xăng" trong chế độ '
        + 'Hoạt động để thấy nó làm giàu/nghèo trên TOÀN dải ga cùng lúc — đó là dấu hiệu để phân '
        + 'biệt lỗi mức xăng với lỗi gíc-lơ (gíc-lơ chỉ sai ở MỘT khoảng ga).',
      fail: 'Cao quá -> giàu toàn dải + tràn xăng qua ống tràn. Thấp quá -> nghèo toàn dải.',
    },
  },
  {
    id: 'floats', name: 'Cặp phao + trục phao', nameEn: 'Floats & pivot pin', qty: 1,
    category: CAT.bowl, build: floatGeo,
    info: {
      material: 'Nhựa rỗng (đời cũ dùng đồng thau)',
      spec: 'Chiều cao phao đo bằng thước, so với thông số của đời xe',
      fn: 'Phao nổi trên mặt xăng và qua càng phao đẩy van kim đóng đường xăng vào. Một cơ cấu hồi '
        + 'tiếp âm thuần cơ khí, không cần điện.',
      fail: 'Phao NGẤM XĂNG -> mất lực nổi -> van kim không đóng -> xăng tràn liên tục qua ống tràn. '
        + 'Kiểm bằng cách nhấn phao xuống nước xem có bọt khí. Càng phao bị bẻ trong lần sửa trước '
        + '-> sai mức xăng toàn dải.',
    },
  },
  {
    id: 'float-valve', name: 'Van kim phao + bệ van', nameEn: 'Float needle valve & seat',
    qty: 1, category: CAT.bowl, build: floatValveGeo,
    info: {
      material: 'Kim thép mũi cao su tổng hợp + bệ đồng thau',
      fn: 'Đóng/mở đường xăng từ bình vào buồng phao. Nó là cái giữ cho mức xăng không đổi.',
      fail: 'Một HẠT CÁT kẹt giữa kim và bệ là đủ làm xăng tràn liên tục — nguyên nhân số một của '
        + '"xe rỉ xăng khi đỗ". Mũi kim có VẠCH LÕM (do rung lâu ngày) -> đóng không kín -> mức xăng '
        + 'dâng dần -> giàu toàn dải. Thay CẢ CẶP kim và bệ.',
    },
  },

  // ── Điều chỉnh ─────────────────────────────────────────────────────────────
  {
    id: 'throttle-butterfly', name: 'Bướm ga + trục', nameEn: 'Throttle plate & shaft',
    qty: 1, category: CAT.adj, build: butterflyGeo,
    info: {
      material: 'Đồng thau + trục thép',
      spec: `Ø đĩa ${BF.r * 2} mm · góc đóng ${BF.closedAngle}°`,
      fn: 'Đây là thứ DUY NHẤT tay ga điều khiển trực tiếp. Nó chỉ chặn KHÍ; lượng xăng do van trượt '
        + 'và các gíc-lơ tự lo. Vì bướm ga là ĐĨA QUAY, phần bị che là hình '
        + 'ellipse có diện tích tỉ lệ cos của góc nghiêng, nên tiết diện HỞ đi theo (1 − cos). '
        + 'Hệ quả: phần đầu tay ga đổi tiết diện rất CHẬM (25 % tay ga chỉ mở ~12 % tiết diện) '
        + 'còn phần cuối đổi rất NHANH. Nhờ vậy ga nhỏ dễ điều khiển mịn; nhưng cũng vì vậy mà '
        + 'vặn hết ga đột ngột ở vòng tua thấp sẽ dội một lượng khí lớn vào — và đó chính là tình '
        + 'huống mà van trượt CV được làm ra để xử lý.',
      fail: 'Trục mòn ở ổ -> hút khí giả tại chỗ trục xuyên thân -> không tải trôi. Đĩa đóng không '
        + 'kín -> không tải cao, hạ vít ga cũng không xuống.',
    },
  },
  {
    id: 'cable-drum', name: 'Ròng rọc dây ga + lò xo hồi',
    nameEn: 'Throttle drum & return spring', qty: 1, category: CAT.adj, build: cableDrumGeo,
    info: { material: 'Thép', fn: 'Biến chuyển động kéo của dây ga thành góc quay bướm ga.',
      fail: 'Lò xo hồi yếu hoặc dây ga khô -> ga không tự về -> RẤT nguy hiểm. Kiểm bằng cách vặn ga '
        + 'rồi thả, phải trả về hết ngay và dứt khoát.' },
  },
  {
    id: 'idle-screw', name: 'Vít ga (chỉnh không tải)', nameEn: 'Idle speed screw',
    qty: 1, category: CAT.adj, build: idleScrewGeo,
    info: {
      material: 'Nhựa + lò xo', spec: 'Không tải khoảng 1400 ± 100 v/ph',
      fn: 'Chặn bướm ga không đóng hết, đặt vòng tua không tải. Nó chỉ đổi LƯỢNG KHÍ, không đổi '
        + 'TỈ LỆ xăng/khí.',
      fail: 'Dùng vít này để "sửa" xe khó nổ là sai — nó chỉ nâng vòng tua để che triệu chứng, '
        + 'nguyên nhân thật thường là gíc-lơ chậm tắc hoặc hút khí giả.',
    },
  },
  {
    id: 'pilot-air-screw', name: 'Vít gió (chỉnh tỉ lệ ga nhỏ)', nameEn: 'Pilot air screw',
    qty: 1, category: CAT.adj, build: airScrewGeo,
    info: {
      material: 'Thép + lò xo + o-ring',
      spec: 'Thường 1,5 – 2,5 vòng mở kể từ khi chạm đáy nhẹ',
      fn: 'Điều chỉnh lượng KHÍ trộn vào mạch chậm, tức đổi TỈ LỆ ở ga nhỏ. Mở nhiều = thêm khí = '
        + 'nghèo hơn.',
      fail: 'Siết chặt hết vào -> hỏng đầu côn và bệ vít, sau đó không chỉnh được nữa. Cách chỉnh '
        + 'đúng: hâm máy nóng, tìm vị trí vòng tua CAO NHẤT, rồi hạ vít ga về không tải, lặp lại '
        + 'vài lượt.',
    },
  },
  {
    id: 'choke', name: 'E gió (mạch làm đậm)', nameEn: 'Choke / enricher', qty: 1,
    category: CAT.adj, build: chokeGeo,
    info: {
      material: 'Pít-tông đồng + thân đồng thau',
      fn: 'Mở một đường xăng phụ khi khởi động NGUỘI. Chú ý: nó KHÔNG bịt đường khí như "choke" '
        + 'trên ô tô cổ mà THÊM XĂNG — nên tên đúng là mạch làm đậm.',
      fail: 'Kẹt MỞ -> giàu liên tục, khói đen, ướt bugi, tốn xăng. Nguyên nhân hay bị bỏ qua khi '
        + 'xe "tự nhiên ăn xăng gấp đôi".',
    },
  },
  {
    id: 'overflow-tube', name: 'Ống tràn', nameEn: 'Overflow tube', qty: 1,
    category: CAT.adj, build: overflowGeo,
    info: {
      material: 'Cao su chịu xăng',
      fn: 'Dẫn xăng tràn xuống dưới xe. Nó là THIẾT BỊ CHẨN ĐOÁN: xăng chảy ra đây nghĩa là van kim '
        + 'phao không đóng kín hoặc phao ngấm xăng.',
      fail: 'Bị bẻ gập hoặc bị bịt -> xăng tràn không có đường ra -> trào vào lỗ thông -> xăng vào '
        + 'buồng đốt, có thể làm cong tay biên khi đạp máy (thuỷ kích).',
    },
  },
  {
    id: 'carb-body', name: 'Thân bộ hoà khí', nameEn: 'Carburettor body', qty: 1,
    category: CAT.meter, build: carbBodyGeo,
    info: {
      material: 'Nhôm đúc',
      spec: `Ø họng khuếch tán ${C.rThroat * 2} mm / Ø lỗ thông ${C.rIn * 2} mm`,
      fn: 'Chứa tất cả. Chi tiết quan trọng nhất trong hình dáng nó là HỌNG KHUẾCH TÁN: lỗ thông '
        + `thắt từ Ø${C.rIn * 2} xuống Ø${C.rThroat * 2} mm. Khí qua chỗ thắt phải chạy nhanh hơn, `
        + 'và khí chạy nhanh thì áp suất giảm — chính độ giảm áp đó HÚT xăng lên. Toàn bộ bộ hoà khí '
        + 'là thụ động, không có gì bơm xăng cả.',
      fail: 'Các đường khoan bên trong tắc nhựa xăng. Rửa bằng dung dịch chuyên dụng và thổi khí nén '
        + 'qua TỪNG đường; không chọc vật cứng vào lỗ khoan.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-tank', name: 'Bình xăng + khoá xăng (ngữ cảnh)', nameEn: 'Fuel tank & petcock',
    qty: 1, category: CAT.ctx, build: tankGeo,
    info: { material: 'Thép dập',
      spec: 'Cấp xăng bằng TRỌNG LỰC — bình phải cao hơn buồng phao',
      fn: 'Không có bơm xăng. Chênh cao giữa mặt xăng trong bình và buồng phao là toàn bộ áp lực '
        + 'cấp xăng.',
      fail: 'Lưới lọc ở khoá xăng tắc -> thiếu xăng ở ga lớn, giống hệt tắc gíc-lơ chính. '
        + 'Rỉ trong bình -> cặn xuống gíc-lơ.' },
  },
  {
    id: 'ctx-head', name: 'Đầu bò & cửa nạp (ngữ cảnh)', nameEn: 'Head & ports', qty: 1,
    category: CAT.ctx, build: headGeo,
    info: { material: 'Nhôm đúc',
      fn: 'Đích đến của hỗn hợp. Chi tiết đầy đủ ở hệ thống 01.' },
  },
  {
    id: 'ctx-exhaust', name: 'Cổ xả & ống giảm âm (ngữ cảnh)', nameEn: 'Exhaust & muffler',
    qty: 1, category: CAT.ctx, build: exhaustGeo,
    info: {
      material: 'Thép, ống giảm âm có lớp bông tiêu âm',
      fn: 'Đường xả không chỉ để thoát khí. Cột khí trong ống xả dao động, và nếu chiều dài ống đúng '
        + 'thì sóng áp suất phản hồi về đúng lúc xupap xả đang đóng dở sẽ HÚT thêm khí mới vào '
        + 'xy-lanh. Vì vậy thay ống xả tự do làm SAI cả tỉ lệ xăng lẫn công suất tầm ga giữa.',
      fail: 'Mục ở chỗ nối -> hút khí giả vào đường xả -> đọc sai khi đo khí thải. Bông tiêu âm mục '
        + '-> ồn và mất áp phản hồi.',
    },
  },
];
