/**
 * parts.js — Toàn bộ chi tiết của hệ thống đánh lửa CDI và hệ thống điện.
 *
 * Hai chi tiết làm ra để DẠY chứ không phải để đúng hình:
 *  - `spark-arc`: tia lửa ở khe bugi, chỉ hiện khi mô hình tính ra là PHÓNG ĐƯỢC.
 *    Nhờ vậy hiện tượng "bỏ máy khi có tải" nhìn thấy được bằng mắt.
 *  - `harness`: bó dây điện, vẽ theo sơ đồ nối chứ không theo đường luồn dây thật.
 *
 * Rôto mâm lửa mang một VẤU KÍCH nhô lên; biên dạng vấu lấy trực tiếp từ
 * `rotorRadiusAt` trong layout.js — cùng hàm mà kinematics dùng để tính khe hở
 * cuộn kích, nên hình và số không thể lệch nhau.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, extrudeX, extrudeY, lathe,
  rod, tubeSolid, hexPrism, boltGeo, coilSpring, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, rotorRadiusAt, PULSER_OUTER_R } from './layout.js';

const RO = L.rotor, ST = L.stator, PU = L.pulser, RL = L.reluctor;
const CV = L.cover, PL = L.plug, CO = L.coil, CD = L.cdi, RG = L.regulator;
const BT = L.battery, SM = L.starter, BX = L.bendix;

/** Tia lửa phải TỰ SÁNG, không phụ thuộc đèn trong khung — nên dùng vật liệu cơ bản. */
const MAT_SPARK = new THREE.MeshBasicMaterial({ color: 0xbfe9ff });

// ─────────────────────────────────────────────────────────────────────────────
// HELPER TRỤC X (trục khuỷu nằm dọc X)
// ─────────────────────────────────────────────────────────────────────────────

const xRev = (geo, x0, y = 0, z = 0) => place(geo, { rz: -Math.PI / 2, x: x0, y, z });
const xRod = (r, x0, x1, y = 0, z = 0, segs = 24) => xRev(rod(r, 0, x1 - x0, segs), x0, y, z);
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 30) =>
  xRev(tubeSolid(rO, rI, 0, x1 - x0, segs), x0, y, z);
const xLathe = (profile, x0, y = 0, z = 0, segs = 32) => xRev(lathe(profile, segs), x0, y, z);

/** Kéo shape theo X: shape(u,v) -> (z=−u, y=v). Dùng cho đĩa mâm điện. */
const xPlate = (shape, len, x0, opts = {}) => place(extrudeX(shape, len, opts), { x: x0 });

/** Hộp chữ nhật đơn giản, tâm tại (x,y,z). */
const box = (w, h, d, x, y, z, r = 2) =>
  place(extrudeY(roundedRect(w, d, r, 0, 0), h), { x, y: y - h / 2, z });

/** Ống dây điện đi theo một chuỗi điểm. */
function wire(points, r = 1.6, segs = 8) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.25);
  return new THREE.TubeGeometry(curve, Math.max(12, points.length * 8), r, segs, false);
}

// ─────────────────────────────────────────────────────────────────────────────
// RÔTO MÂM LỬA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rôto: cốc thép mở miệng về +X, trong lòng dán nam châm, ngoài vành có vấu kích
 * và hai dấu chỉ thị. Biên dạng ngoài dùng `rotorRadiusAt` nên vấu kích ở đúng
 * góc mà kinematics dùng để tính xung.
 */
function rotorGeo() {
  const parts = [
    // vành ngoài — bán kính thay đổi theo góc để có VẤU KÍCH
    (() => {
      const s = new THREE.Shape();
      const n = 180;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * 360;
        const r = rotorRadiusAt(a) + 6;                    // mặt ngoài vành
        const [u, v] = [-(r * Math.sin(deg(a))), r * Math.cos(deg(a))];
        if (i === 0) s.moveTo(u, v); else s.lineTo(u, v);
      }
      s.closePath();
      const hole = new THREE.Path();
      for (let i = n; i >= 0; i--) {
        const a = (i / n) * 360;
        const r = rotorRadiusAt(a) - 1;
        const [u, v] = [-(r * Math.sin(deg(a))), r * Math.cos(deg(a))];
        if (i === n) hole.moveTo(u, v); else hole.lineTo(u, v);
      }
      hole.closePath();
      s.holes.push(hole);
      return xPlate(s, RO.x1 - RO.x0, RO.x0, { curveSegments: 1 });
    })(),
    // đáy cốc + moay-ơ côn
    xLathe([[RO.rIn, 0], [RO.magnetR + 6, 0], [RO.magnetR + 6, 6], [RO.rIn, 6], [RO.rIn, 0]],
      RO.x0, 0, 0, 44),
    xLathe([[0, 0], [RO.rIn, 0], [RO.rIn, RO.hubTaper], [0, RO.hubTaper]], RO.x0, 0, 0, 26),
  ];

  // nam châm vĩnh cửu dán trong lòng cốc
  for (let i = 0; i < RO.magnets; i++) {
    const a0 = (i / RO.magnets) * 360 + (360 / RO.magnets - RO.magnetW) / 2;
    const sec = new THREE.Shape();
    sec.absarc(0, 0, RO.magnetR - 1.5, deg(a0), deg(a0 + RO.magnetW), false);
    sec.absarc(0, 0, RO.magnetR - 1.5 - RO.magnetT, deg(a0 + RO.magnetW), deg(a0), true);
    sec.closePath();
    parts.push(xPlate(sec, RO.x1 - RO.x0 - 8, RO.x0 + 6, { curveSegments: 3 }));
  }

  // hai dấu chỉ thị trên vành: T (điểm chết trên) và F (điểm đánh lửa)
  for (const [ang, w] of [[RO.markTdcAngle, 2.6], [RO.markTdcAngle + 12, 1.6]]) {
    parts.push(place(extrudeY(roundedRect(4, w, 0.4), 2.5), {
      x: RO.x1 - 3,
      y: (RO.magnetR + 4) * Math.cos(deg(ang)),
      z: (RO.magnetR + 4) * Math.sin(deg(ang)),
    }));
  }

  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'rotor'));
}

// ─────────────────────────────────────────────────────────────────────────────
// MÂM ĐIỆN (STATOR) VÀ CUỘN KÍCH
// ─────────────────────────────────────────────────────────────────────────────

function statorGeo() {
  const plate = circleShape(ST.rPlate, 0, 0);
  bore(plate, L.crank.r + 3, 0, 0);
  for (let i = 0; i < ST.bolts; i++) {
    const a = (i / ST.bolts) * TAU + deg(40);
    bore(plate, 3, ST.boltR * Math.cos(a) * 0.8, ST.boltR * Math.sin(a) * 0.8);
  }
  const parts = [xPlate(plate, ST.plateT, ST.x0, { curveSegments: 26 })];

  // 5 cuộn phát điện, lõi thép chữ T bọc dây
  for (let i = 0; i < ST.coils; i++) {
    const a = (i / ST.coils) * 360 + 26;
    const cy = ST.coilR * Math.cos(deg(a)), cz = ST.coilR * Math.sin(deg(a));
    parts.push(xTube(ST.coilOuter, 2.4, ST.x0 + ST.plateT, ST.x0 + ST.plateT + ST.coilLen,
      cy, cz, 16));
    parts.push(xRod(3.2, ST.x0, ST.x1, cy, cz, 12));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.copper, 'stator'));
}

/**
 * Cuộn kích: bắt vào lốc máy, mũi lõi thép hướng VÀO vành rôto và cách mặt ngoài
 * vành đúng khe hở đặt. Bán kính mũi lõi lấy từ `PU.r`, cùng con số mà
 * `pulserGapAt` dùng để tính khe hở — nên hình và số không thể lệch nhau.
 */
function pulserGeo() {
  const a = deg(PU.angle);
  const ux = Math.cos(a), uz = Math.sin(a);
  const rCoil = PU.r + PU.bodyOffset;   // tâm thân cuộn, nằm ngoài mũi lõi
  const xm = RO.x0 + (RO.x1 - RO.x0) / 2;
  return new THREE.Group().add(mesh(union([
    // thân cuộn dây
    xTube(PU.bodyR, 3, xm - PU.len / 2, xm + PU.len / 2, rCoil * ux, rCoil * uz, 16),
    // lõi thép chạy từ thân cuộn VÀO tới đúng bán kính PU.r
    place(extrudeY(roundedRect(PU.len * 0.7, PU.bodyOffset + 4, 0.6), 6), {
      rz: -a + Math.PI / 2, x: xm,
      y: (PU.r + PU.bodyOffset / 2) * ux, z: (PU.r + PU.bodyOffset / 2) * uz,
    }),
  ]), MAT.copper, 'pulser-coil'));
}

// ─────────────────────────────────────────────────────────────────────────────
// BENDIX · CỦ ĐỀ
// ─────────────────────────────────────────────────────────────────────────────

const bendixGeo = () => new THREE.Group().add(mesh(union([
  xTube(BX.rOut, BX.rOut - 9, BX.x0, BX.x1, 0, 0, 34),
  ...Array.from({ length: BX.rollers }, (_, i) => {
    const a = (i / BX.rollers) * TAU;
    return xRod(3.4, BX.x0 + 1, BX.x1 - 1,
      (BX.rOut - 5) * Math.cos(a), (BX.rOut - 5) * Math.sin(a), 12);
  }),
  xLathe([[RO.rIn, 0], [BX.rOut - 9, 0], [BX.rOut - 9, 3], [RO.rIn, 3], [RO.rIn, 0]],
    BX.x0, 0, 0, 30),
]), MAT.hardened, 'starter-clutch'));

const starterGeo = () => new THREE.Group().add(mesh(union([
  xTube(SM.r, SM.r - 4, SM.x0, SM.x1 - 12, SM.y, SM.z, 26),
  xLathe([[0, 0], [SM.r, 0], [SM.r, 5], [0, 5]], SM.x0 - 5, SM.y, SM.z, 26),
  xRod(SM.gearR, SM.x1 - 12, SM.x1, SM.y, SM.z, 16),
  // giắc điện
  xRod(5, SM.x0 - 12, SM.x0 - 5, SM.y + 10, SM.z, 12),
]), MAT.steel, 'starter-motor'));

// ─────────────────────────────────────────────────────────────────────────────
// VỎ MÁY TRÁI
// ─────────────────────────────────────────────────────────────────────────────

function coverGeo() {
  const s = circleShape(CV.r, 0, 0);
  for (let i = 0; i < CV.bolts; i++) {
    const a = (i / CV.bolts) * TAU;
    bore(s, 3.4, CV.boltR * Math.cos(a), CV.boltR * Math.sin(a));
  }
  return new THREE.Group().add(mesh(union([
    xPlate(s, CV.wall, CV.x0, { bevel: 1.5, curveSegments: 40 }),
    xTube(CV.r, CV.r - 6, CV.x0, CV.x1, 0, 0, 40),
    // lỗ thăm dấu điểm chết trên, có nắp cao su
    xRod(9, CV.x0 - 3, CV.x0 + 2, RO.magnetR - 2, 0, 16),
  ]), MAT.aluCast, 'left-cover'));
}

const coverGasketGeo = () => new THREE.Group().add(mesh(
  xTube(CV.r, CV.r - 7, CV.x1 - 1.2, CV.x1, 0, 0, 40), MAT.gasket, 'cover-gasket'));

const coverBoltsGeo = () => new THREE.Group().add(mesh(union(
  Array.from({ length: CV.bolts }, (_, i) => {
    const a = (i / CV.bolts) * TAU;
    return place(boltGeo(6, 26, { headAF: 10, headH: 4.5 }), {
      rz: Math.PI / 2, x: CV.x0 - 4.5,
      y: CV.boltR * Math.cos(a), z: CV.boltR * Math.sin(a),
    });
  }),
), MAT.blackOxide, 'cover-bolts'));

// ─────────────────────────────────────────────────────────────────────────────
// BUGI · TIA LỬA · BÔ-BIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bugi. Node `ground` là điện cực mát; kinematics dịch nó theo KHE HỞ đặt, nên
 * khe hở nhìn thấy được đúng bằng con số dùng để tính điện áp cần.
 */
function plugGeo() {
  const parts = [
    xRev(hexPrism(PL.hexAF, 12, 0.5), PL.x0 + 16, PL.y, PL.z),
    xTube(PL.bodyR, 2.4, PL.x0 + 4, PL.x0 + 16, PL.y, PL.z, 20),
    xLathe([[0, 0], [PL.ceramicR, 2], [PL.ceramicR, 20], [PL.ceramicR - 2.5, 22],
      [PL.ceramicR - 2.5, 30], [0, 30]], PL.x0 + 28, PL.y, PL.z, 24),
    xRod(4, PL.x0 + 58 - PL.x0 - 4, PL.x1 - PL.x0 + PL.x0, PL.y, PL.z, 14),
    // điện cực giữa
    xRod(PL.centerR, PL.x0 - 1, PL.x0 + 5, PL.y, PL.z, 10),
  ];
  const groundNode = new THREE.Group();
  groundNode.name = 'ground';
  // điện cực mát: thanh gập chữ L, mặt đối diện điện cực giữa
  groundNode.add(mesh(union([
    place(extrudeY(roundedRect(1.8, 3.4, 0.3), 8), { x: PL.x0 + 3, y: PL.y - 4, z: PL.z }),
    place(extrudeY(roundedRect(6, 3.4, 0.3), 1.8),
      { x: PL.x0 - 1.4, y: PL.y - 4, z: PL.z }),
  ]), MAT.hardened, 'plug-ground'));
  groundNode.position.set(0, 0, 0);

  const grp = new THREE.Group();
  grp.add(mesh(union(parts), MAT.ceramic, 'spark-plug'));
  grp.add(groundNode);
  grp.userData.nodes = { ground: groundNode };
  return grp;
}

/** Tia lửa: đường gấp khúc giữa hai điện cực. Node `arc` bị bật/tắt. */
function sparkGeo() {
  const arcNode = new THREE.Group();
  arcNode.name = 'arc';
  const n = 5;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([PL.x0 + 1.5 - t * 3.2, PL.y - t * 3.0,
      PL.z + (i % 2 ? 0.9 : -0.9) * (1 - Math.abs(t - 0.5) * 2) * 1.4]);
  }
  arcNode.add(mesh(wire(pts, 0.34, 5), MAT_SPARK, 'spark-arc'));
  const grp = new THREE.Group();
  grp.add(arcNode);
  grp.userData.nodes = { arc: arcNode };
  return grp;
}

const ignCoilGeo = () => new THREE.Group().add(mesh(union([
  box(CO.w, CO.h, CO.d, CO.x, CO.y, CO.z, 3),
  // hai tai bắt vào khung
  place(extrudeY(roundedRect(CO.w + 16, 5, 2), 3), { x: CO.x, y: CO.y + CO.h / 2, z: CO.z }),
  // giắc sơ cấp
  box(9, 9, 9, CO.x - CO.w / 2 - 4, CO.y + 8, CO.z, 1.5),
]), MAT.plastic, 'ignition-coil'));

/** Dây cao áp + nắp bugi. */
const plugLeadGeo = () => new THREE.Group().add(mesh(union([
  wire([[CO.x, CO.y - CO.h / 2, CO.z], [CO.x + 6, CO.y - 26, CO.z - 6],
    [PL.x1 + 26, PL.y + 22, PL.z + 8], [PL.x1 + 10, PL.y, PL.z]], 3.2, 8),
  xTube(L.plugCap.r, 4.4, PL.x1 - 12, PL.x1 + L.plugCap.len - 12, PL.y, PL.z, 20),
]), MAT.rubber, 'plug-lead'));

// ─────────────────────────────────────────────────────────────────────────────
// CDI · CỤC SẠC · ẮC QUY · CẦU CHÌ · CÔNG TẮC · RƠ-LE
// ─────────────────────────────────────────────────────────────────────────────

const cdiGeo = () => new THREE.Group().add(mesh(union([
  box(CD.w, CD.h, CD.d, CD.x, CD.y, CD.z, 3),
  // giắc 4 chân
  box(20, 12, 12, CD.x, CD.y - CD.h / 2 - 5, CD.z, 1.5),
  ...[0, 1, 2, 3].map((i) => place(rod(1.6, 0, 7, 8),
    { x: CD.x - 7 + i * 4.6, y: CD.y - CD.h / 2 - 16, z: CD.z })),
]), MAT.blackOxide, 'cdi-unit'));

function regulatorGeo() {
  const parts = [box(RG.w, RG.h, RG.d, RG.x, RG.y, RG.z, 2)];
  // cánh tản nhiệt — dấu hiệu nhận biết cục sạc
  for (let i = 0; i < RG.fins; i++) {
    parts.push(place(extrudeY(roundedRect(RG.w, 2, 0.4), RG.h - 6), {
      x: RG.x, y: RG.y - RG.h / 2 + 3, z: RG.z + RG.d / 2 + 2 + i * 3.4,
    }));
  }
  parts.push(box(16, 10, 10, RG.x, RG.y - RG.h / 2 - 4, RG.z, 1.5));
  return new THREE.Group().add(mesh(union(parts), MAT.alu, 'regulator'));
}

const batteryGeo = () => new THREE.Group().add(mesh(union([
  box(BT.w, BT.h, BT.d, BT.x, BT.y, BT.z, 3),
  // hai cọc
  place(rod(5, 0, 8, 12), { x: BT.x - 22, y: BT.y + BT.h / 2, z: BT.z }),
  place(rod(5, 0, 8, 12), { x: BT.x + 22, y: BT.y + BT.h / 2, z: BT.z }),
]), MAT.plastic, 'battery'));

const fuseGeo = () => new THREE.Group().add(mesh(union([
  xRod(L.fuse.r, L.fuse.x - L.fuse.len / 2, L.fuse.x + L.fuse.len / 2, L.fuse.y, L.fuse.z, 14),
  xRod(L.fuse.r + 2, L.fuse.x - 3, L.fuse.x + 3, L.fuse.y, L.fuse.z, 14),
]), MAT.plastic, 'main-fuse'));

const ignSwitchGeo = () => new THREE.Group().add(mesh(union([
  place(lathe([[0, 0], [L.ignSwitch.r, 0], [L.ignSwitch.r, 10],
    [L.ignSwitch.r - 4, 12], [0, 12]], 24),
  { y: L.ignSwitch.y - 12, x: L.ignSwitch.x, z: L.ignSwitch.z }),
  place(rod(L.ignSwitch.r - 5, 0, L.ignSwitch.len - 12, 20),
    { x: L.ignSwitch.x, y: L.ignSwitch.y - L.ignSwitch.len, z: L.ignSwitch.z }),
  place(extrudeY(roundedRect(10, 2.4, 0.4), 1.6),
    { x: L.ignSwitch.x, y: L.ignSwitch.y, z: L.ignSwitch.z }),
]), MAT.blackOxide, 'ignition-switch'));

const killSwitchGeo = () => new THREE.Group().add(mesh(union([
  box(L.killSwitch.w, L.killSwitch.h, L.killSwitch.d,
    L.killSwitch.x, L.killSwitch.y, L.killSwitch.z, 2),
  place(rod(5.5, 0, 5, 14), { x: L.killSwitch.x, y: L.killSwitch.y + 8, z: L.killSwitch.z + 8 }),
]), MAT.plastic, 'kill-switch'));

const starterRelayGeo = () => new THREE.Group().add(mesh(union([
  box(L.starterRelay.w, L.starterRelay.h, L.starterRelay.d,
    L.starterRelay.x, L.starterRelay.y, L.starterRelay.z, 3),
  place(rod(4, 0, 7, 10), { x: L.starterRelay.x - 7, y: L.starterRelay.y + L.starterRelay.h / 2, z: L.starterRelay.z }),
  place(rod(4, 0, 7, 10), { x: L.starterRelay.x + 7, y: L.starterRelay.y + L.starterRelay.h / 2, z: L.starterRelay.z }),
]), MAT.blackOxide, 'starter-relay'));

// ─────────────────────────────────────────────────────────────────────────────
// BÓ DÂY — vẽ theo SƠ ĐỒ NỐI
// ─────────────────────────────────────────────────────────────────────────────

const harnessGeo = () => new THREE.Group().add(mesh(union([
  // mâm điện -> cục sạc (dòng phát, xoay chiều)
  wire([[ST.x0 - 4, -ST.rPlate + 6, 0], [-70, -40, 40], [-10, 60, 96], [RG.x, RG.y - RG.h / 2 - 6, RG.z]]),
  // cục sạc -> ắc quy (một chiều đã chỉnh lưu)
  wire([[RG.x, RG.y - RG.h / 2 - 6, RG.z], [24, 122, 132], [BT.x + 22, BT.y + BT.h / 2 + 8, BT.z]]),
  // ắc quy -> cầu chì -> ổ khoá
  wire([[BT.x + 22, BT.y + BT.h / 2 + 8, BT.z], [L.fuse.x, L.fuse.y, L.fuse.z],
    [16, 190, 140], [L.ignSwitch.x, L.ignSwitch.y - L.ignSwitch.len, L.ignSwitch.z]]),
  // cuộn kích -> CDI (tín hiệu thời điểm)
  wire([[ST.x0 - 4, 30, 26], [-76, 96, 74], [CD.x, CD.y - CD.h / 2 - 16, CD.z]], 1.3),
  // CDI -> bô-bin (sơ cấp cao áp)
  wire([[CD.x, CD.y - CD.h / 2 - 16, CD.z], [-14, 196, 78], [CO.x - CO.w / 2 - 8, CO.y + 8, CO.z]]),
  // công tắc tắt máy -> CDI (nối MÁT là tắt)
  wire([[L.killSwitch.x, L.killSwitch.y - L.killSwitch.h / 2, L.killSwitch.z],
    [-50, 200, 92], [CD.x - 12, CD.y - CD.h / 2 - 8, CD.z]], 1.3),
  // ắc quy -> rơ-le đề -> củ đề
  wire([[BT.x - 22, BT.y + BT.h / 2 + 8, BT.z],
    [L.starterRelay.x + 7, L.starterRelay.y + L.starterRelay.h / 2, L.starterRelay.z]], 2.4),
  wire([[L.starterRelay.x - 7, L.starterRelay.y + L.starterRelay.h / 2, L.starterRelay.z],
    [-40, 60, 60], [SM.x0 - 12, SM.y + 10, SM.z]], 2.4),
]), MAT.rubber, 'harness'));

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

const ctxCrankGeo = () => new THREE.Group().add(mesh(union([
  xRod(L.crank.r, L.crank.x0, L.crank.x1, 0, 0, 24),
  xLathe([[0, 0], [13.5, 0], [11, 14], [0, 14]], RO.x0 - 14, 0, 0, 22),
]), MAT.ghost, 'ctx-crank'));

const ctxCaseGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(roundedRect(L.case.w, L.case.d, 22, 0, -10), 6), { x: -80, y: -66 }),
  place(extrudeY(roundedRect(L.case.w, L.case.d, 22, 0, -10), 6), { x: 46, y: -66 }),
  place(extrudeY(roundedRect(L.head.w, L.head.d, 8, 0, 0), L.head.y1 - L.head.y0),
    { x: 0, y: L.head.y0 }),
  place(extrudeY(roundedRect(52, 44, 6, 0, 0), L.head.y0 - 6), { x: 0, y: 6 }),
]), MAT.ghost, 'ctx-engine'));

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  gen: 'Mâm lửa (phát điện & tín hiệu)',
  ign: 'Đánh lửa',
  power: 'Nguồn & bảo vệ',
  start: 'Khởi động',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Mâm lửa ────────────────────────────────────────────────────────────────
  {
    id: 'cover-bolts', name: `Bu lông vỏ máy trái (${CV.bolts})`, nameEn: 'Left cover bolts',
    qty: CV.bolts, category: CAT.gen, build: coverBoltsGeo,
    info: { material: 'Thép', spec: 'M6', torque: '≈ 10 N·m',
      fn: 'Ép vỏ máy trái. Các bu lông không cùng chiều dài — đánh dấu vị trí khi tháo.',
      fail: 'Lắp bu lông dài vào lỗ ngắn -> chọc vào cuộn stator hoặc làm nứt vỏ.' },
  },
  {
    id: 'left-cover', name: 'Vỏ máy trái', nameEn: 'Left crankcase cover', qty: 1,
    category: CAT.gen, build: coverGeo,
    info: {
      material: 'Nhôm đúc', spec: 'Có lỗ thăm dấu điểm chết trên, nắp cao su',
      fn: 'Che mâm lửa và giữ nhớt. Lỗ thăm cho phép xem dấu T/F trên rôto để căn cam '
        + 'mà không cần tháo vỏ.',
      fail: 'Mất nắp cao su lỗ thăm -> nước và bụi vào mâm lửa.',
    },
  },
  {
    id: 'cover-gasket', name: 'Gioăng vỏ máy trái', nameEn: 'Left cover gasket', qty: 1,
    category: CAT.gen, build: coverGasketGeo,
    info: { material: 'Giấy amiăng', fn: 'Làm kín mặt lắp vỏ trái.',
      fail: 'Rỉ nhớt ra ngoài; nếu để nhớt ngấm vào cuộn stator thì lâu ngày phá cách điện.' },
  },
  {
    id: 'rotor', name: 'Rôto mâm lửa (bánh đà)', nameEn: 'Magneto rotor / flywheel',
    qty: 1, category: CAT.gen, build: rotorGeo,
    info: {
      material: 'Thép + nam châm vĩnh cửu',
      spec: `${RO.magnets} khối nam châm · Ø${RO.rOut * 2} mm · có VẤU KÍCH và hai dấu T/F`,
      fn: 'Vừa là bánh đà, vừa mang nam châm quay quét qua các cuộn stator để phát điện, '
        + 'vừa mang VẤU KÍCH đi qua cuộn kích để báo thời điểm cho CDI. Ba việc trong một chi tiết.',
      fail: 'Nam châm YẾU dần theo tuổi (hoặc sau khi bị nung nóng khi hàn gần đó) -> '
        + 'phát điện yếu, sạc không đủ. Nứt vành -> mất cân bằng, rung. '
        + 'THEN BÁN NGUYỆT bị cắt -> lệch góc đánh lửa, xem hệ thống 03.',
    },
  },
  {
    id: 'stator', name: 'Mâm điện (stator) + cuộn phát', nameEn: 'Stator & charging coils',
    qty: 1, category: CAT.gen, build: statorGeo,
    info: {
      material: 'Lõi thép lá + dây đồng tráng men',
      spec: `${ST.coils} cuộn (đèn + nạp) · đo điện trở và cách điện với mát khi nghi hỏng`,
      fn: 'Nam châm trên rôto quét qua các cuộn này sinh ra điện XOAY CHIỀU. '
        + 'Dòng phát tỉ lệ VÒNG TUA — đây là gốc của toàn bộ bài toán cân bằng sạc.',
      fail: 'Cháy cuộn (nhìn thấy vết đen, mùi khét) hoặc chạm mát vì nhớt ngấm lâu ngày -> '
        + 'mất sạc. Đo: giữa các đầu dây phải có điện trở nhỏ; giữa dây và MÁT phải hở hoàn toàn.',
    },
  },
  {
    id: 'pulser-coil', name: 'Cuộn kích (báo thời điểm)', nameEn: 'Pulser / pickup coil',
    qty: 1, category: CAT.gen, build: pulserGeo,
    info: {
      material: 'Lõi thép + cuộn dây nhỏ',
      spec: `Khe hở tới vấu kích ${PU.airGapSpec} mm`,
      tolerance: 'Khe hở rộng ra thì xung yếu — kiểm bằng lá căn',
      fn: 'Nó KHÔNG phát điện đánh lửa. Nó chỉ sinh một xung điện nhỏ khi vấu kích trên rôto '
        + 'đi qua, để CDI biết trục khuỷu đang ở đâu. Vị trí gắn cuộn kích chính là thứ đặt '
        + 'GỐC của góc đánh lửa; CDI cộng thêm góc sớm theo vòng tua từ gốc đó.',
      fail: 'Khe hở rộng hoặc cuộn đứt -> xung yếu -> mất lửa, thường mất trước ở vòng tua '
        + 'THẤP (lúc đạp máy) vì xung sinh ra càng nhỏ khi rôto quay càng chậm.',
    },
  },

  // ── Đánh lửa ───────────────────────────────────────────────────────────────
  {
    id: 'cdi-unit', name: 'CDI (hộp phóng điện tụ)', nameEn: 'CDI igniter', qty: 1,
    category: CAT.ign, build: cdiGeo,
    info: {
      material: 'Mạch điện tử đổ keo trong hộp nhựa',
      spec: 'Giắc 4 chân: nguồn · cuộn kích · bô-bin · mát',
      fn: 'Nạp một tụ điện lên vài trăm vôn, rồi khi cuộn kích báo tín hiệu thì phóng toàn bộ '
        + 'điện tích đó vào cuộn sơ cấp bô-bin trong vài chục micro-giây. CDI cũng chứa BẢNG '
        + 'GÓC SỚM: nó tự tính đánh lửa sớm bao nhiêu độ theo vòng tua.',
      fail: 'Hỏng thật thì mất lửa HOÀN TOÀN, không phải lửa yếu — nên "lửa yếu" hầu như không '
        + 'bao giờ là do CDI. Đây là chi tiết bị thay oan nhiều nhất trên xe số, thường là để '
        + 'thay cho việc chẩn màng van trượt hoặc cuộn kích.',
    },
  },
  {
    id: 'ignition-coil', name: 'Bô-bin sườn (cuộn cao áp)', nameEn: 'Ignition coil', qty: 1,
    category: CAT.ign, build: ignCoilGeo,
    info: {
      material: 'Hai cuộn dây quanh lõi thép, đổ nhựa cách điện',
      spec: `Tạo được khoảng ${(21).toFixed(0)} kV khi còn tốt`,
      fn: 'Biến vài trăm vôn từ CDI thành hàng chục nghìn vôn nhờ tỉ số vòng dây sơ cấp/thứ cấp.',
      fail: 'Cách điện già đi -> điện áp ra tụt. Vì điện áp CẦN để phóng tia tăng theo ÁP SUẤT '
        + 'trong xy-lanh, một bô-bin yếu vẫn nổ bình thường lúc không tải mà BỎ MÁY khi lên ga có '
        + 'tải. Đây là hỏng hóc bị chẩn sai nhiều nhất — xem chế độ Hoạt động để thấy bằng số.',
    },
  },
  {
    id: 'plug-lead', name: 'Dây cao áp + nắp bugi', nameEn: 'HT lead & plug cap', qty: 1,
    category: CAT.ign, build: plugLeadGeo,
    info: {
      material: 'Dây có lõi dẫn + nắp cao su có điện trở chống nhiễu',
      fn: 'Dẫn cao áp từ bô-bin tới bugi.',
      fail: 'Nứt vỏ hoặc nắp bugi hở -> cao áp PHÓNG RA VỎ MÁY thay vì qua khe bugi. '
        + 'Kiểm trong tối: thấy tia xanh chạy dọc dây là đã rò. Hay bị nhất khi trời mưa hoặc '
        + 'sau khi rửa xe bằng vòi áp lực.',
    },
  },
  {
    id: 'spark-plug', name: 'Bugi', nameEn: 'Spark plug', qty: 1,
    category: CAT.ign, build: plugGeo,
    info: {
      material: 'Thân thép, sứ cách điện, điện cực hợp kim',
      spec: `Khe hở đặt ${PL.gapSpec} mm · thay mỗi 8.000–10.000 km`,
      tolerance: `Khe rộng quá ${PL.gapMax} mm là chắc chắn bỏ máy khi có tải`,
      fn: 'Nơi tia lửa phóng qua. Khe hở là biến quan trọng nhất: điện áp cần để phóng tia tỉ lệ '
        + 'với CẢ khe hở VÀ áp suất trong xy-lanh.',
      fail: 'Điện cực MÒN làm khe rộng dần -> cần điện áp cao hơn -> bỏ máy khi tải nặng trước, '
        + 'còn nổ tại chỗ vẫn bình thường. Vì vậy THỬ BUGI BẰNG CÁCH CHO NỔ TẠI CHỖ KHÔNG KẾT '
        + 'LUẬN ĐƯỢC GÌ. Đọc màu chân sứ: nâu nhạt là đúng, đen xốp là giàu, trắng là nghèo.',
    },
  },
  {
    id: 'spark-arc', name: 'Tia lửa (mô phỏng)', nameEn: 'Spark (visualisation)',
    qty: 1, category: CAT.ign, build: sparkGeo, stays: true,
    info: {
      material: 'Không phải chi tiết — đây là phần mô phỏng để dạy',
      fn: 'Chỉ hiện khi mô hình tính ra là điện áp CÓ ĐƯỢC vượt điện áp CẦN. Kéo thanh tải rồi '
        + 'xem tia lửa TẮT khi tải lên — đó chính là hiện tượng bỏ máy khi có tải, nhìn thấy '
        + 'được bằng mắt.',
    },
  },

  // ── Nguồn & bảo vệ ─────────────────────────────────────────────────────────
  {
    id: 'regulator', name: 'Cục sạc (chỉnh lưu + ổn áp)', nameEn: 'Regulator / rectifier',
    qty: 1, category: CAT.power, build: regulatorGeo,
    info: {
      material: 'Mạch bán dẫn trong khối nhôm có cánh tản nhiệt',
      spec: `Giữ điện áp khoảng ${(14.2).toFixed(1)} V`,
      fn: 'Hai việc: CHỈNH LƯU điện xoay chiều từ mâm lửa thành một chiều, và GIỮ điện áp không '
        + 'vượt ngưỡng bằng cách xả phần dư thành nhiệt (nên mới cần cánh tản nhiệt).',
      fail: 'Hỏng phần ổn áp -> điện áp vọt lên gần 18 V ở vòng tua cao -> luộc ắc quy (sôi, '
        + 'phồng) và cháy bóng đèn hàng loạt. Hỏng phần chỉnh lưu -> mất sạc. Đo điện áp ở cọc '
        + 'ắc quy khi máy chạy 5000 v/ph: phải khoảng 13,5–14,8 V.',
    },
  },
  {
    id: 'battery', name: 'Ắc quy', nameEn: 'Battery', qty: 1,
    category: CAT.power, build: batteryGeo,
    info: {
      material: 'Chì–axit kín khí (một số đời dùng lithium)',
      spec: '12 V · 3–5 Ah · nghỉ đủ điện đọc ≈ 12,6 V',
      fn: 'Chứa điện để đề và để chạy đèn khi vòng tua thấp hơn vòng tua hoà vốn sạc.',
      fail: 'Cạn dần vì thường xuyên chạy dưới vòng tua hoà vốn (đứng chờ đèn đỏ lâu, bật đèn '
        + 'pha) -> đề yếu dần. Bị luộc vì cục sạc hỏng -> vỏ phồng. Kiểm bằng cách đo điện áp '
        + 'lúc nghỉ VÀ lúc đề: tụt dưới 9,5 V khi đề là ắc quy đã hỏng.',
    },
  },
  {
    id: 'main-fuse', name: 'Cầu chì chính', nameEn: 'Main fuse', qty: 1,
    category: CAT.power, build: fuseGeo,
    info: { material: 'Dây chì trong vỏ nhựa', spec: 'Thường 10 A hoặc 15 A',
      fn: 'Cắt mạch khi có ngắn mạch, bảo vệ bó dây khỏi cháy.',
      fail: 'Đứt là DẤU HIỆU, không phải nguyên nhân — thay cầu chì mà không tìm chỗ chạm thì '
        + 'sẽ đứt lại. Thay bằng dây đồng hoặc cầu chì trị số lớn hơn là cách làm cháy cả bó dây.' },
  },
  {
    id: 'ignition-switch', name: 'Ổ khoá điện', nameEn: 'Ignition switch', qty: 1,
    category: CAT.power, build: ignSwitchGeo,
    info: { material: 'Thép + tiếp điểm đồng',
      fn: 'Cấp nguồn từ ắc quy cho toàn hệ.',
      fail: 'Tiếp điểm mòn hoặc oxi hoá -> sụt áp -> đề yếu, đèn tối. '
        + 'Đo sụt áp qua ổ khoá khi đang đề: quá 0,5 V là phải làm sạch hoặc thay.' },
  },
  {
    id: 'kill-switch', name: 'Công tắc tắt máy', nameEn: 'Engine stop switch', qty: 1,
    category: CAT.power, build: killSwitchGeo,
    info: {
      material: 'Nhựa + tiếp điểm',
      fn: 'Tắt máy bằng cách NỐI MÁT chân tín hiệu của CDI. Chú ý chiều logic: nối mát là TẮT, '
        + 'hở là chạy.',
      fail: 'Chính vì logic đó, một dây bị TRÓC VỎ cọ vào khung sẽ làm máy tắt ngẫu nhiên khi '
        + 'đi đường xấu — và đo tĩnh thì hoàn toàn bình thường. Rất khó tìm nếu không biết '
        + 'nguyên lý này.',
    },
  },

  // ── Khởi động ──────────────────────────────────────────────────────────────
  {
    id: 'starter-relay', name: 'Rơ-le đề', nameEn: 'Starter relay', qty: 1,
    category: CAT.start, build: starterRelayGeo,
    info: {
      material: 'Cuộn hút + tiếp điểm dòng lớn',
      fn: 'Nút đề chỉ dẫn dòng NHỎ tới cuộn hút của rơ-le; rơ-le mới đóng tiếp điểm dẫn dòng '
        + 'LỚN (vài chục ampe) tới củ đề. Nếu không có nó thì dây nút đề phải to như dây ắc quy.',
      fail: 'Nghe "tách" mà củ đề không quay -> tiếp điểm rơ-le rỗ, hoặc ắc quy yếu. '
        + 'Không nghe "tách" -> lỗi ở nút đề, khoá điện, hoặc cuộn hút rơ-le.',
    },
  },
  {
    id: 'starter-motor', name: 'Củ đề', nameEn: 'Starter motor', qty: 1,
    category: CAT.start, build: starterGeo,
    info: { material: 'Động cơ điện một chiều có than',
      spec: 'Rút vài chục ampe trong lúc đề',
      fn: 'Quay trục khuỷu để nổ máy.',
      fail: 'Than mòn -> quay yếu hoặc kêu rít. Vì nó rút dòng rất lớn, đề yếu thường là do ẮC '
        + 'QUY hoặc tiếp xúc kém chứ không phải củ đề — kiểm ắc quy trước.' },
  },
  {
    id: 'starter-clutch', name: 'Bộ bendix (ly hợp một chiều)', nameEn: 'Starter clutch',
    qty: 1, category: CAT.start, build: bendixGeo,
    info: {
      material: 'Vỏ thép + con lăn kẹt một chiều',
      fn: 'Truyền momen từ củ đề sang rôto theo MỘT chiều, và nhả ra khi máy đã nổ. '
        + 'Không có nó thì máy nổ sẽ quay củ đề với tốc độ phá hỏng nó.',
      fail: 'Con lăn hoặc lò xo mòn -> đề kêu "rào rào" và trượt, không quay được máy. '
        + 'Triệu chứng rất giống ắc quy yếu nhưng đèn không tối đi khi bấm đề — đó là cách phân biệt.',
    },
  },
  {
    id: 'harness', name: 'Bó dây điện', nameEn: 'Wiring harness', qty: 1,
    category: CAT.power, build: harnessGeo, stays: true,
    info: {
      material: 'Dây đồng bọc nhựa, bó lại bằng băng',
      fn: 'Trong mô hình này bó dây được vẽ theo SƠ ĐỒ NỐI để thấy dòng đi đâu, không theo đường '
        + 'luồn dây thật trên xe.',
      fail: 'Hầu hết "lỗi điện" thật ra là lỗi TIẾP XÚC: giắc oxi hoá, chân giắc lỏng, dây tróc '
        + 'vỏ cọ khung. Trước khi thay bất cứ hộp điện tử nào, hãy tháo–vệ sinh–cắm lại từng giắc '
        + 'và đo sụt áp trên từng đoạn.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-crank', name: 'Trục khuỷu (ngữ cảnh)', nameEn: 'Crankshaft', qty: 1,
    category: CAT.ctx, build: ctxCrankGeo,
    info: { material: 'Thép rèn',
      fn: 'Rôto mâm lửa bắt trên đầu côn bên trái. Chi tiết đầy đủ ở hệ thống 03.' },
  },
  {
    id: 'ctx-engine', name: 'Lốc máy & đầu bò (ngữ cảnh)', nameEn: 'Engine (context)',
    qty: 1, category: CAT.ctx, build: ctxCaseGeo,
    info: { material: 'Nhôm đúc',
      fn: 'Để định vị bugi trên đầu bò và mâm lửa bên trái lốc máy.' },
  },
];
