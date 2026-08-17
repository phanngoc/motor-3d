/**
 * parts.js — Toàn bộ chi tiết của khung sườn, hệ thống treo, truyền động cuối và
 * phanh.
 *
 * Chi tiết đáng chú ý nhất về cấu trúc: SÊN được dựng bằng InstancedMesh và được
 * đặt lại vị trí MỖI KHUNG HÌNH theo vị trí thật của trục bánh sau. Nhờ vậy khi
 * gắp sau nhún, ta thấy độ võng sên tự thay đổi — và thấy đúng lý do vì sao hãng
 * quy định một khoảng độ võng chứ không phải một con số.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, extrudeX, extrudeY, lathe,
  rod, tubeSolid, hexPrism, boltGeo, coilSpring, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, RAKE, TAN_RAKE, forkAxisZ, steerAxisZ } from './layout.js';

const WF = L.wheelF, WR = L.wheelR, FR = L.frame, FK = L.fork;
const SW = L.swing, SH = L.shock, BF = L.brakeF, BR = L.brakeR, FD = L.finalDrive;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — mọi trục quay của xe đều nằm dọc X
// ─────────────────────────────────────────────────────────────────────────────

const xRev = (geo, x0, y = 0, z = 0) => place(geo, { rz: -Math.PI / 2, x: x0, y, z });
const xRod = (r, x0, x1, y = 0, z = 0, segs = 18) =>
  xRev(rod(r, 0, Math.abs(x1 - x0), segs), Math.min(x0, x1), y, z);
const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 26) =>
  xRev(tubeSolid(rO, rI, 0, x1 - x0, segs), x0, y, z);
const xLathe = (profile, x0, y = 0, z = 0, segs = 24) => xRev(lathe(profile, segs), x0, y, z);

/**
 * Kéo shape theo X. Quy ước của `extrudeX`: shape(u,v) -> world(z = −u, y = v).
 * Nên MUỐN đặt tâm hình tại (y, z) thật thì phải cho toạ độ shape là uv(y, z).
 * Nhầm chỗ này là cả bánh xe rơi xuống mặt đất — nên luôn dùng `uv()`.
 */
const uv = (y, z) => [-z, y];
const xPlate = (shape, len, x0, opts = {}) => place(extrudeX(shape, len, opts), { x: x0 });

/**
 * Ống thẳng nối hai điểm trong mặt phẳng YZ, ở một toạ độ X.
 *
 * `rod` dựng dọc +Y. Phép quay quanh X biến (0,1,0) thành (0, cos a, sin a), nên
 * để trục ống trỏ đúng hướng (dy, dz) thì a = atan2(dz, dy) — DẤU DƯƠNG.
 * Lấy dấu âm sẽ lật toàn bộ theo trục Z, tức khung sườn chĩa ngược về phía trước.
 */
function tubeYZ(r, [y0, z0], [y1, z1], x = 0, segs = 12) {
  const dy = y1 - y0, dz = z1 - z0;
  const len = Math.hypot(dy, dz);
  const g = rod(r, 0, len, segs);
  g.rotateX(Math.atan2(dz, dy));
  g.translate(x, y0, z0);
  return g;
}

/** Ống nối hai điểm, dựng cả hai bên ±x. */
const tubePair = (r, a, b, x, segs = 12) => [tubeYZ(r, a, b, x, segs), tubeYZ(r, a, b, -x, segs)];

// ─────────────────────────────────────────────────────────────────────────────
// BÁNH XE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bánh xe: lốp (hình xuyến), vành, nan hoa, moay-ơ.
 * Node `spin` để bánh quay quanh trục X.
 */
function wheelGeo(W, extra = []) {
  const spin = new THREE.Group();
  spin.name = 'spin';
  const halfW = W.tyreW / 2;

  // Trục bánh nằm ở độ cao BÁN KÍNH LĂN để lốp vừa chạm mặt đất y = 0.
  const cy = W.r;

  // lốp: xuyến tiết diện tròn
  const tyre = new THREE.TorusGeometry((W.rimR + W.r) / 2, (W.r - W.rimR) / 2, 12, 44);
  tyre.rotateY(Math.PI / 2);
  tyre.translate(0, cy, W.z);
  spin.add(mesh(tyre, MAT.rubber, 'tyre'));

  // vành + nan hoa + moay-ơ
  const parts = [
    xTube(W.rimR, W.rimR - 9, -halfW * 0.5, halfW * 0.5, cy, W.z, 40),
    xTube(W.hubR, W.hubR - 12, -halfW * 0.7, halfW * 0.7, cy, W.z, 26),
    xRod(9, -halfW, halfW, cy, W.z, 14),
  ];
  for (let i = 0; i < W.spokes; i++) {
    const a = (i / W.spokes) * 360;
    const sx = i % 2 ? halfW * 0.55 : -halfW * 0.55;
    parts.push(tubeYZ(2.2,
      [cy + W.hubR * Math.cos(deg(a)), W.z + W.hubR * Math.sin(deg(a))],
      [cy + (W.rimR - 8) * Math.cos(deg(a)), W.z + (W.rimR - 8) * Math.sin(deg(a))], sx, 6));
  }
  spin.add(mesh(union(parts), MAT.aluPolish, 'rim'));
  for (const e of extra) spin.add(e);

  const grp = new THREE.Group();
  grp.add(spin);
  grp.userData.nodes = { spin };
  return grp;
}

const frontWheelGeo = () => wheelGeo(WF);
const rearWheelGeo = () => wheelGeo(WR);

// ─────────────────────────────────────────────────────────────────────────────
// KHUNG SƯỜN · CỔ LÁI · GHI ĐÔNG
// ─────────────────────────────────────────────────────────────────────────────

/** Điểm trên TRỤC LÁI ở một độ cao — dùng chung cho khung, bạc cổ và cụm lái. */
const onSteerAxis = (y) => [y, steerAxisZ(y)];
/** Điểm trên TRỤC CÀNG ở một độ cao. */
const onForkAxis = (y) => [y, forkAxisZ(y)];

function frameGeo() {
  const parts = [
    // ống cổ — nằm ĐÚNG trên trục lái, không phải một ống nghiêng áng chừng
    tubeYZ(26, onSteerAxis(FR.headY[0]), onSteerAxis(FR.headY[1]), 0, 20),
    // xương sống, xuất phát từ đỉnh ống cổ
    tubeYZ(FR.tubeR, onSteerAxis(FR.headY[1] - 20), FR.spineTo, 0, 14),
    // ống xuống + máng đỡ máy
    ...tubePair(FR.tubeR - 3, onSteerAxis(FR.headY[0] + 10), FR.downTo, 48, 12),
    ...tubePair(FR.tubeR - 4, FR.downTo, FR.cradleTo, 48, 12),
    // đế yên
    ...tubePair(FR.tubeR - 4, FR.seatFrom, FR.seatTo, 62, 12),
    // ngang nối
    xRod(FR.tubeR - 5, -62, 62, FR.seatTo[0], FR.seatTo[1], 12),
    xRod(FR.tubeR - 5, -48, 48, FR.cradleTo[0], FR.cradleTo[1], 12),
    // tai treo giảm chấn sau
    ...[-1, 1].map((s) => place(extrudeY(roundedRect(10, 26, 3), 34),
      { x: s * (SH.bottomZ ? 78 : 78), y: SH.topY - 17, z: SH.topZ })),
    // tai trục gắp sau
    ...[-1, 1].map((s) => xRod(15, s * (SW.spanX / 2 - 8), s * (SW.spanX / 2 + 10),
      SW.pivot[0], SW.pivot[1], 14)),
  ];
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'frame'));
}

const headBearingGeo = () => new THREE.Group().add(mesh(union(
  // Hai ổ ở hai đầu ống cổ, nằm trên trục lái và vuông góc với nó.
  [FR.headY[0] + 10, FR.headY[1] - 10].map((yy) => {
    const g = tubeSolid(23, 15, -5, 5, 22);
    g.rotateX(RAKE);
    g.translate(0, yy, steerAxisZ(yy));
    return g;
  }),
), MAT.hardened, 'head-bearings'));

/** Cụm lái: chảng ba + trục lái + ghi đông. Node `turn` quay quanh trục lái. */
function steeringGeo() {
  const turn = new THREE.Group();
  turn.name = 'turn';
  // Chảng ba nằm trên TRỤC CÀNG (đã lệch ra trước trục lái đúng độ lệch càng).
  const zTop = forkAxisZ(L.triple.y), zBot = forkAxisZ(FR.headY[0] - 6);
  const barZ = steerAxisZ(L.bar.y) + 40;      // ghi đông vươn về phía người lái

  const parts = [
    // chảng ba trên và dưới
    place(extrudeY(roundedRect(L.triple.w, 42, 8), L.triple.t), { y: L.triple.y, z: zTop }),
    place(extrudeY(roundedRect(L.triple.w, 46, 8), L.triple.t), { y: FR.headY[0] - 6, z: zBot }),
    // trục lái, nằm đúng trên trục lái của khung
    tubeYZ(L.stem.r, onSteerAxis(FR.headY[0] - 24), onSteerAxis(FR.headY[1] + 16), 0, 18),
    // ghi đông
    xRod(L.bar.r, -L.bar.w / 2, L.bar.w / 2, L.bar.y, barZ, 14),
    ...[-1, 1].map((s) => tubeYZ(L.bar.r - 1, [L.bar.y, barZ],
      [L.triple.y + L.triple.t, zTop], s * 40, 10)),
  ];

  turn.add(mesh(union(parts), MAT.steel, 'steering'));
  const grp = new THREE.Group();
  grp.add(turn);
  grp.userData.nodes = { turn };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// CÀNG TRƯỚC
// ─────────────────────────────────────────────────────────────────────────────

/** Ống NGOÀI của phuộc (phần đi cùng bánh xe). Node `slide` trượt theo Y. */
function forkOuterGeo() {
  const slide = new THREE.Group();
  slide.name = 'slide';
  const parts = [];
  for (const s of [-1, 1]) {
    const x = (s * FK.spanX) / 2;
    // Ống ngoài nằm ĐÚNG trên trục càng, từ trục bánh lên.
    parts.push(tubeYZ(FK.outerR, onForkAxis(FK.axleY), onForkAxis(FK.axleY + 300), x, 16));
    // tai kẹp trục bánh
    parts.push(xRod(13, x - 9, x + 9, FK.axleY, WF.z, 12));
  }
  slide.add(mesh(union(parts), MAT.aluCast, 'fork-outer'));
  const grp = new THREE.Group();
  grp.add(slide);
  grp.userData.nodes = { slide };
  return grp;
}

/** Ống TRONG (ty phuộc) — gắn cứng vào chảng ba, không dịch. */
const forkInnerGeo = () => new THREE.Group().add(mesh(union(
  [-1, 1].map((s) => tubeYZ(FK.innerR,
    onForkAxis(FK.axleY + 250), onForkAxis(FK.topY), (s * FK.spanX) / 2, 16)),
), MAT.aluPolish, 'fork-inner'));

/** Lò xo phuộc — nằm trong ống, nên vẽ trong suốt để thấy được. */
const forkSpringGeo = () => new THREE.Group().add(mesh(union(
  [-1, 1].map((s) => {
    const g = coilSpring(FK.innerR - 4, 2.6, FK.springTurns, 260);
    g.rotateX(RAKE);
    const y = FK.axleY + 90;
    g.translate((s * FK.spanX) / 2, y, forkAxisZ(y));
    return g;
  }),
), MAT.spring, 'fork-spring'));

// ─────────────────────────────────────────────────────────────────────────────
// PHANH TRƯỚC (ĐĨA)
// ─────────────────────────────────────────────────────────────────────────────

function discGeo() {
  const [cu, cv] = uv(WF.r, WF.z);
  const s = circleShape(BF.discR, cu, cv);
  bore(s, 52, cu, cv);
  // lỗ thoát nhiệt và thoát nước
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    bore(s, 6, cu + (BF.discR - 30) * Math.cos(a), cv + (BF.discR - 30) * Math.sin(a));
  }
  for (let i = 0; i < BF.discBolts; i++) {
    const a = (i / BF.discBolts) * TAU + 0.4;
    bore(s, 4, cu + 62 * Math.cos(a), cv + 62 * Math.sin(a));
  }
  return new THREE.Group().add(mesh(
    xPlate(s, BF.discT, -WF.tyreW / 2 - 8, { curveSegments: 26 }),
    MAT.hardened, 'brake-disc'));
}

/** Kẹp phanh + hai má. Node `pads` khép lại theo lực bóp. */
function caliperGeo() {
  const x0 = -WF.tyreW / 2 - 22, x1 = -WF.tyreW / 2 + 2;
  const yc = FK.axleY + 66, zc = forkAxisZ(yc) - 62;
  const body = union([
    place(extrudeY(roundedRect(x1 - x0, 62, 6), 54), { x: (x0 + x1) / 2, y: yc - 27, z: zc }),
    xRod(11, x0 - 8, x0, yc, zc, 14),
  ]);
  const pads = new THREE.Group();
  pads.name = 'pads';
  for (const s of [-1, 1]) {
    pads.add(mesh(place(extrudeY(roundedRect(5, 34, 2), 26), {
      x: -WF.tyreW / 2 - 8 + s * (BF.discT / 2 + 3.2), y: yc - 13, z: zc,
    }), MAT.gasket, `pad-${s > 0 ? 'out' : 'in'}`));
  }
  const grp = new THREE.Group();
  grp.add(mesh(body, MAT.alu, 'caliper'));
  grp.add(pads);
  grp.userData.nodes = { pads };
  return grp;
}

/** Tay bóp + xy-lanh chính. Node `lever` quay theo lực bóp. */
function masterGeo() {
  const x = L.bar.w / 2 - 90, y = L.bar.y, z = steerAxisZ(L.bar.y) + 40;
  const lever = new THREE.Group();
  lever.name = 'lever';
  lever.add(mesh(union([
    place(extrudeY(roundedRect(96, 13, 4), 8), { x: x + 48, y: y - 14, z: z - 22 }),
  ]), MAT.aluPolish, 'brake-lever'));
  lever.position.set(x, y - 10, z - 22);
  lever.children[0].geometry.translate(-x, -(y - 10), -(z - 22));

  const grp = new THREE.Group();
  grp.add(mesh(union([
    place(extrudeY(roundedRect(34, 30, 5), 42), { x, y: y - 16, z: z + 4 }),
    xTube(15, 9, x - 8, x + 8, y + 24, z + 4, 16),
  ]), MAT.alu, 'master-cylinder'));
  grp.add(lever);
  grp.userData.nodes = { lever };
  return grp;
}

const hoseGeo = () => {
  const yc = FK.axleY + 66;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(L.bar.w / 2 - 90, L.bar.y - 20, steerAxisZ(L.bar.y) + 44),
    new THREE.Vector3(-30, 700, steerAxisZ(700) - 30),
    new THREE.Vector3(-46, 470, forkAxisZ(470) - 46),
    new THREE.Vector3(-WF.tyreW / 2 - 30, yc + 4, forkAxisZ(yc) - 62),
  ], false, 'catmullrom', 0.3);
  return new THREE.Group().add(mesh(
    new THREE.TubeGeometry(curve, 60, 3.4, 7, false), MAT.rubber, 'brake-hose'));
};

// ─────────────────────────────────────────────────────────────────────────────
// TREO SAU
// ─────────────────────────────────────────────────────────────────────────────

/** Gắp sau. Node `arm` quay quanh trục gắp. */
function swingarmGeo() {
  const arm = new THREE.Group();
  arm.name = 'arm';
  const parts = [];
  for (const s of [-1, 1]) {
    const x = (s * SW.spanX) / 2;
    parts.push(tubeYZ(SW.armR, SW.pivot, SW.axle, x, 14));
    parts.push(xRod(14, x - 10, x + 10, SW.axle[0], SW.axle[1], 12));
  }
  parts.push(xRod(SW.armR - 6, -SW.spanX / 2, SW.spanX / 2, SW.pivot[0], SW.pivot[1] + 4, 14));
  parts.push(xRod(SW.armR - 8, -SW.spanX / 2, SW.spanX / 2, 300, 470, 12));
  arm.add(mesh(union(parts), MAT.steel, 'swingarm'));
  arm.position.set(0, SW.pivot[0], SW.pivot[1]);
  arm.children[0].geometry.translate(0, -SW.pivot[0], -SW.pivot[1]);

  const grp = new THREE.Group();
  grp.add(arm);
  grp.userData.nodes = { arm };
  return grp;
}

/** Cặp giảm chấn sau. Node `shock` co giãn theo hành trình. */
function shockGeo() {
  const node = new THREE.Group();
  node.name = 'shock';
  const parts = [];
  for (const s of [-1, 1]) {
    const x = s * 78;
    const a = [SH.topY, SH.topZ], b = [SH.bottomY, SH.bottomZ];
    parts.push(tubeYZ(SH.bodyR, a, b, x, 16));
    // lò xo bọc ngoài
    const dy = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dy, dz);
    const g = coilSpring(SH.springR, 4.4, SH.springTurns, len - 22);
    g.rotateX(Math.atan2(dz, dy));
    g.translate(x, a[0], a[1]);
    parts.push(g);
  }
  node.add(mesh(union(parts), MAT.spring, 'rear-shock'));
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { shock: node };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHANH SAU (TANG TRỐNG)
// ─────────────────────────────────────────────────────────────────────────────

/** Tang trống — phần quay cùng bánh xe. */
const drumGeo = () => new THREE.Group().add(mesh(union([
  xTube(BR.drumR + 6, BR.drumR, WR.tyreW / 2 - 4, WR.tyreW / 2 + BR.drumW, WR.r, WR.z, 30),
  xLathe([[WR.hubR - 6, 0], [BR.drumR + 6, 0], [BR.drumR + 6, 5], [WR.hubR - 6, 5],
    [WR.hubR - 6, 0]], WR.tyreW / 2 + BR.drumW, WR.r, WR.z, 30),
]), MAT.castIron, 'brake-drum'));

/**
 * Hai má phanh + cam đội. Node `shoes` đẩy má ra khi phanh.
 * Má TRÊN là má DẪN (tự cường hoá), má DƯỚI là má BỊ — hai má không giống nhau về
 * tác dụng dù giống nhau về hình dáng.
 */
function shoesGeo() {
  const shoes = new THREE.Group();
  shoes.name = 'shoes';
  const xm = WR.tyreW / 2 + 4, xM = WR.tyreW / 2 + BR.drumW - 4;
  const [cu, cv] = uv(WR.r, WR.z);
  // Má TRÊN là má DẪN, má DƯỚI là má BỊ — xem giải thích ở bảng thông số.
  for (const [i, mid] of [[0, 90], [1, 270]]) {
    const a0 = mid - BR.shoeArc / 2;
    const sec = new THREE.Shape();
    sec.absarc(cu, cv, BR.drumR - 1, deg(a0), deg(a0 + BR.shoeArc), false);
    sec.absarc(cu, cv, BR.drumR - 9, deg(a0 + BR.shoeArc), deg(a0), true);
    sec.closePath();
    const node = new THREE.Group();
    node.name = `shoe${i}`;
    node.add(mesh(xPlate(sec, xM - xm, xm, { curveSegments: 8 }), MAT.gasket,
      i === 0 ? 'shoe-leading' : 'shoe-trailing'));
    shoes.add(node);
  }
  const grp = new THREE.Group();
  grp.add(mesh(union([
    // cam đội (một đầu) và chốt tựa (đầu kia)
    xRod(7, xm - 6, xM + 6, WR.r, WR.z + BR.drumR - 16, 12),
    xRod(5, xm - 2, xM + 2, WR.r, WR.z - BR.drumR + 16, 12),
  ]), MAT.steel, 'shoe-cam'));
  grp.add(shoes);
  grp.userData.nodes = { shoes };
  return grp;
}

/** Cần phanh sau + thanh kéo. Node `arm` quay theo lực đạp. */
function brakeArmGeo() {
  const xa = WR.tyreW / 2 + BR.drumW + 8;
  // Cần phanh xoay quanh TRỤC CAM ĐỘI, nên dựng hình quanh gốc rồi đặt node ở đó.
  const camY = WR.r, camZ = WR.z + BR.drumR - 16;
  const arm = new THREE.Group();
  arm.name = 'arm';
  arm.add(mesh(place(extrudeY(roundedRect(10, 82, 4), 6), { x: xa, y: -3, z: -34 }),
    MAT.steel, 'brake-arm'));
  arm.position.set(0, camY, camZ);

  const grp = new THREE.Group();
  grp.add(arm);
  grp.add(mesh(
    // thanh kéo từ chân phanh ra cần phanh
    tubeYZ(4, [L.pedal.y, L.pedal.z], [camY - 6, camZ - 68], xa, 10),
    MAT.steel, 'brake-rod'));
  grp.userData.nodes = { arm };
  return grp;
}

/** Chân phanh. Node `pedal` quay theo lực đạp. */
function pedalGeo() {
  const P = L.pedal;
  const node = new THREE.Group();
  node.name = 'pedal';
  node.add(mesh(union([
    // bàn đạp chạy dọc Z (theo chiều trước–sau xe)
    place(extrudeY(roundedRect(13, P.len, 4), 7), { x: P.x, y: P.y - 3, z: P.z - P.len / 2 }),
    xRod(12, P.x - 8, P.x + 20, P.y, P.z, 12),
  ]), MAT.steel, 'brake-pedal'));
  node.position.set(0, P.y, P.z);
  node.children[0].geometry.translate(0, -P.y, -P.z);
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { pedal: node };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUYỀN ĐỘNG CUỐI
// ─────────────────────────────────────────────────────────────────────────────

/** Bán kính vòng chia của một nhông sên. */
export const sprocketPitchR = (teeth) => FD.pitch / (2 * Math.sin(Math.PI / teeth));

const frontSprocketGeo = () => {
  const fs = FD.frontSprocket;
  const [cu, cv] = uv(fs.y, fs.z);
  const s = circleShape(sprocketPitchR(fs.teeth) + 3, cu, cv);
  bore(s, 14, cu, cv);
  return new THREE.Group().add(mesh(
    xPlate(s, 7, -SW.spanX / 2 - 27, { curveSegments: 3 }), MAT.hardened, 'front-sprocket'));
};

const rearSprocketGeo = () => {
  const [cu, cv] = uv(WR.r, WR.z);
  const s = circleShape(sprocketPitchR(FD.rearSprocket.teeth) + 3, cu, cv);
  bore(s, WR.hubR + 8, cu, cv);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.5;
    bore(s, 5, cu + (WR.hubR + 22) * Math.cos(a), cv + (WR.hubR + 22) * Math.sin(a));
  }
  return new THREE.Group().add(mesh(
    xPlate(s, 6, -WR.tyreW / 2 - 12, { curveSegments: 3 }), MAT.hardened, 'rear-sprocket'));
};

/**
 * SÊN — InstancedMesh gồm nhiều mắt, được đặt lại vị trí mỗi khung hình theo vị
 * trí thật của trục bánh sau. Đây là chỗ thấy được ĐỘ VÕNG SÊN tự thay đổi khi
 * treo sau nhún, và vì thế thấy được lý do hãng quy định một KHOẢNG độ võng.
 */
function chainGeo() {
  const n = 96;
  const link = new THREE.BoxGeometry(9, 5.5, 11);
  const im = new THREE.InstancedMesh(link, MAT.blackOxide, n);
  im.name = 'chain';
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  const grp = new THREE.Group();
  grp.add(im);
  grp.userData.nodes = { chain: im, count: n };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// GÁC CHÂN · NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

const pegGeo = () => new THREE.Group().add(mesh(union(
  [-1, 1].map((s) => xRod(11, s * L.peg.x, s * (L.peg.x + L.peg.len), L.peg.y, L.peg.z, 12)),
), MAT.rubber, 'footpegs'));

const ctxEngineGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(roundedRect(150, 210, 24, 0, 60), 220), { y: 150 }),
  place(extrudeY(roundedRect(80, 74, 10, 0, -30), 190), { y: 350 }),
]), MAT.ghost, 'ctx-engine'));

/** Mặt đất — mốc để thấy chuyển tải và độ lún treo. */
const groundGeo = () => new THREE.Group().add(mesh(
  place(extrudeY(roundedRect(460, 1560, 40, 0, 60), 3), { y: -3 }), MAT.ghost, 'ctx-ground'));

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  frame: 'Khung sườn & lái',
  front: 'Treo trước',
  brakeF: 'Phanh trước (đĩa)',
  rear: 'Treo sau',
  brakeR: 'Phanh sau (tang trống)',
  drive: 'Truyền động cuối',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Khung & lái ────────────────────────────────────────────────────────────
  {
    id: 'frame', name: 'Khung sườn', nameEn: 'Frame', qty: 1,
    category: CAT.frame, build: frameGeo,
    info: {
      material: 'Ống thép hàn, kiểu xương sống',
      spec: `Chiều dài cơ sở ${L.wheelR.z - L.wheelF.z} mm · góc trục lái ${L.steer.rakeDeg}°`,
      fn: 'Giữ đúng vị trí tương đối giữa trục lái, trục gắp sau và động cơ. Ba vị trí đó quyết '
        + 'định toàn bộ tính cách lái của xe.',
      fail: 'Nứt ở tai treo máy hoặc quanh trục gắp sau (sau tai nạn hoặc chở quá tải lâu dài). '
        + 'Khung móp -> xe đi "ăn" một bên, và không có cách nào chỉnh lại bằng cân vành.',
    },
  },
  {
    id: 'head-bearings', name: 'Bạc cổ (2 ổ)', nameEn: 'Steering head bearings', qty: 2,
    category: CAT.frame, build: headBearingGeo,
    info: {
      material: 'Ổ bi cầu hoặc bi côn', spec: 'Siết đủ chặt để hết độ rơ nhưng vẫn quay êm',
      fn: 'Cho cụm lái quay quanh trục lái mà không rơ.',
      fail: 'RƠ -> nghe "cạch" khi phanh trước, và xe lắc đầu ở tốc độ cao. RỖ THÀNH RÃNH ở vị trí '
        + 'đi thẳng (vì xe đi thẳng phần lớn thời gian) -> vô lăng bị "kẹt" ở giữa, xe khó vào cua '
        + 'mượt. Kiểm bằng cách kê bánh trước lên, lắc càng theo chiều trước–sau.',
    },
  },
  {
    id: 'steering', name: 'Cụm lái: chảng ba + trục lái + ghi đông',
    nameEn: 'Triple clamps, stem & handlebar', qty: 1, category: CAT.frame, build: steeringGeo,
    info: {
      material: 'Thép dập / nhôm',
      spec: `Độ lệch càng ${L.steer.offset} mm → độ lệch đuôi ${trailForInfo()} mm`,
      fn: 'Độ lệch đuôi là thứ làm bánh trước TỰ TRẢ VỀ GIỮA: điểm tiếp đất nằm phía SAU nơi trục '
        + 'lái cắt mặt đất, nên phản lực đường luôn sinh momen kéo bánh về thẳng. Nhiều đuôi = '
        + 'ổn định hơn nhưng lái nặng hơn.',
      fail: 'Chảng ba bị vặn sau tai nạn -> hai ống phuộc không song song -> phuộc bó, lái lệch. '
        + 'Đây là lỗi mà thay phuộc mới cũng không hết.',
    },
  },

  // ── Treo trước ─────────────────────────────────────────────────────────────
  {
    id: 'fork-inner', name: 'Ty phuộc (ống trong)', nameEn: 'Fork inner tubes', qty: 2,
    category: CAT.front, build: forkInnerGeo,
    info: { material: 'Thép mạ crôm',
      fn: 'Trượt trong ống ngoài. Bề mặt mạ phải nhẵn tuyệt đối để phớt làm kín được.',
      fail: 'Rỗ hoặc trầy dọc (do bụi, do rửa xe áp lực cao vào phớt) -> cắt phớt -> chảy nhớt '
        + 'phuộc. Móp -> phuộc bó cứng, xe xóc gắt.' },
  },
  {
    id: 'fork-spring', name: 'Lò xo phuộc trước', nameEn: 'Fork springs', qty: 2,
    category: CAT.front, build: forkSpringGeo,
    info: {
      material: 'Thép lò xo',
      spec: `Độ cứng tổng ${L.fork.rate} N/mm · hành trình ${L.fork.travel} mm`,
      fn: 'Đỡ tải tĩnh và hấp thụ xóc. Độ cứng phải sao cho ĐỘ LÚN TĨNH bằng khoảng 30 % hành '
        + 'trình — lún nhiều hơn thì hết hành trình khi gặp hố, lún ít hơn thì xe xóc và bánh '
        + 'trước dễ nảy khỏi mặt đường.',
      fail: 'Lò xo yếu đi (lún tĩnh tăng) -> phuộc chạm đáy khi phanh gấp. Thay bằng lò xo cứng '
        + 'hơn "cho êm" là hiểu ngược: cứng hơn thì XÓC hơn.',
    },
  },
  {
    id: 'fork-outer', name: 'Ống phuộc ngoài + tai kẹp trục',
    nameEn: 'Fork sliders', qty: 2, category: CAT.front, build: forkOuterGeo,
    info: {
      material: 'Nhôm đúc', spec: 'Chứa nhớt phuộc và bộ van tiết lưu',
      fn: 'Vừa dẫn hướng, vừa là buồng dầu giảm chấn. LÒ XO quyết định xe lún bao nhiêu; '
        + 'NHỚT PHUỘC quyết định lún NHANH hay CHẬM. Hai việc khác nhau và không thay thế nhau.',
      fail: 'Thiếu nhớt phuộc -> mất giảm chấn -> xe nhún dội nhiều lần sau mỗi cú xóc, và bánh '
        + 'trước mất bám khi phanh trên đường gợn. Thử: ấn mạnh xuống rồi thả — phải trả về và '
        + 'DỪNG, không được dội lên xuống.',
    },
  },

  // ── Phanh trước ────────────────────────────────────────────────────────────
  {
    id: 'brake-lever-assy', name: 'Tay bóp + xy-lanh chính', nameEn: 'Lever & master cylinder',
    qty: 1, category: CAT.brakeF, build: masterGeo,
    info: {
      material: 'Nhôm + pít-tông thép',
      spec: `Ø pít-tông chính ${L.brakeF.masterPistonD} mm · tỉ số tay bóp ${L.brakeF.leverRatio}`,
      fn: 'Biến lực ngón tay thành ÁP SUẤT dầu. Vì áp suất truyền nguyên vẹn tới kẹp phanh có '
        + `pít-tông lớn hơn (Ø${L.brakeF.caliperPistonD} mm), lực được nhân lên `
        + `${(Math.PI * L.brakeF.caliperPistonD ** 2 / (Math.PI * L.brakeF.masterPistonD ** 2)).toFixed(1)} lần chỉ nhờ tỉ lệ diện tích.`,
      fail: 'Cúp-pen chai -> tay bóp lún sâu, phanh không ăn. CÓ KHÍ trong dầu -> tay bóp "mềm '
        + 'xốp" (khí nén được, dầu thì không) -> phải xả gió. Dầu phanh HÚT ẨM nên phải thay '
        + 'định kỳ dù xe ít đi.',
    },
  },
  {
    id: 'brake-hose', name: 'Ống dầu phanh', nameEn: 'Brake hose', qty: 1,
    category: CAT.brakeF, build: hoseGeo,
    info: { material: 'Cao su bọc lưới', spec: 'Thay mỗi 4 năm dù nhìn còn tốt',
      fn: 'Dẫn áp suất dầu. Phải KHÔNG phồng — ống phồng thì một phần lực bóp đi vào việc nong '
        + 'ống thay vì ép má phanh.',
      fail: 'Phồng theo tuổi -> tay bóp mềm dần mà xả gió không hết. Nứt -> mất phanh đột ngột.' },
  },
  {
    id: 'brake-caliper', name: 'Kẹp phanh + má phanh', nameEn: 'Caliper & pads', qty: 1,
    category: CAT.brakeF, build: caliperGeo,
    info: {
      material: 'Thân nhôm, má gốm/hữu cơ',
      spec: `Ø pít-tông ${L.brakeF.caliperPistonD} mm · μ má ≈ ${L.brakeF.muPad} · `
        + `bán kính hiệu dụng ${L.brakeF.padREff} mm`,
      fn: 'Ép hai má vào đĩa. Momen phanh tỉ lệ TUYẾN TÍNH với μ của má — khác hẳn phanh tang '
        + 'trống (xem chi tiết má phanh sau).',
      fail: 'Ắc kẹp phanh khô/kẹt -> má mòn lệch một bên, và phanh không nhả hết -> nóng đĩa. '
        + 'Má mòn tới đế thép -> xé đĩa. Bôi mỡ chịu nhiệt cho ắc mỗi lần vệ sinh.',
    },
  },
  {
    id: 'brake-disc', name: 'Đĩa phanh', nameEn: 'Brake disc', qty: 1,
    category: CAT.brakeF, build: discGeo,
    info: {
      material: 'Thép không gỉ đục lỗ',
      spec: `Ø${L.brakeF.discR * 2} mm · dày ${L.brakeF.discT} mm · khối lượng `
        + `≈ ${L.brakeF.discMassKg} kg`,
      fn: 'Biến động năng thành nhiệt rồi thải ra không khí. Ưu điểm quyết định so với tang trống: '
        + 'nó HỞ HOÀN TOÀN ra gió, nên thoát nhiệt tốt gấp nhiều lần và gần như không suy giảm khi '
        + 'phanh liên tục. Các lỗ trên đĩa để thoát nước và bụi má.',
      fail: 'Mòn mỏng dưới giới hạn -> nứt. Đảo (vênh) -> tay bóp giật theo vòng quay. '
        + 'Dính dầu/mỡ -> mất phanh, và không rửa sạch được bằng nước.',
    },
  },

  // ── Bánh xe ────────────────────────────────────────────────────────────────
  {
    id: 'front-wheel', name: 'Bánh trước (vành, nan hoa, lốp)', nameEn: 'Front wheel',
    qty: 1, category: CAT.front, build: frontWheelGeo,
    info: { material: 'Vành nhôm, nan hoa thép, lốp cao su',
      spec: `Bán kính lăn ${WF.r} mm · lốp ${WF.tyreW}/90-17`,
      fn: 'Chịu phần tải LỚN NHẤT khi phanh — xem chế độ Hoạt động.',
      fail: 'Nan hoa lỏng -> vành đảo dần. Lốp non -> vành dễ móp và xe lái nặng, mòn vai lốp.' },
  },
  {
    id: 'rear-wheel', name: 'Bánh sau (vành, nan hoa, lốp)', nameEn: 'Rear wheel',
    qty: 1, category: CAT.rear, build: rearWheelGeo,
    info: { material: 'Vành nhôm, nan hoa thép, lốp cao su',
      spec: `Bán kính lăn ${WR.r} mm · lốp ${WR.tyreW}/90-17`,
      fn: 'Truyền lực kéo và một phần lực phanh.',
      fail: 'Mòn giữa lốp (do chạy đường thẳng và bơm quá căng) -> mất bám khi trời mưa.' },
  },

  // ── Treo sau ───────────────────────────────────────────────────────────────
  {
    id: 'swingarm', name: 'Gắp sau', nameEn: 'Swingarm', qty: 1,
    category: CAT.rear, build: swingarmGeo,
    info: {
      material: 'Ống thép hàn',
      spec: `Bán kính ${SWING_R_FOR_INFO()} mm · hành trình bánh ${SW.travelWheel} mm`,
      fn: 'Bánh sau đi theo một CUNG TRÒN quanh trục gắp, không đi thẳng lên xuống. Chính vì cung '
        + 'tròn đó mà khoảng cách từ nhông trước tới trục bánh THAY ĐỔI khi xe nhún — và đó là lý '
        + 'do sên phải có độ võng. Xem chế độ Hoạt động.',
      fail: 'Bạc trục gắp mòn -> bánh sau lắc ngang -> xe "bơi" khi vào cua và ăn lốp lệch. '
        + 'Kiểm bằng cách kê bánh sau lên rồi lắc ngang.',
    },
  },
  {
    id: 'rear-shock', name: 'Giảm chấn sau (2)', nameEn: 'Rear shocks', qty: 2,
    category: CAT.rear, build: shockGeo,
    info: {
      material: 'Lò xo thép + ống thuỷ lực',
      spec: `Độ cứng ${SH.rateAtShock} N/mm tại giảm chấn · tỉ số đòn ${SH.leverage}`,
      fn: 'Vì gắn nghiêng và không ở ngay trục bánh, giảm chấn có TỈ SỐ ĐÒN: bánh dịch nhiều thì '
        + `giảm chấn nén ít hơn ${SH.leverage} lần, nhưng chịu lực lớn hơn ${SH.leverage} lần. `
        + `Nên độ cứng quy về bánh xe chỉ còn ${(SH.rateAtShock / SH.leverage ** 2).toFixed(0)} N/mm `
        + `— chia cho BÌNH PHƯƠNG tỉ số đòn, không phải chia một lần.`,
      fail: 'Mất nhớt (thấy vết ứa trên thân) -> hết giảm chấn -> xe dội và bánh sau mất bám. '
        + 'Thay CẢ CẶP, không thay một bên.',
    },
  },

  // ── Phanh sau ──────────────────────────────────────────────────────────────
  {
    id: 'brake-pedal', name: 'Chân phanh', nameEn: 'Brake pedal', qty: 1,
    category: CAT.brakeR, build: pedalGeo,
    info: { material: 'Thép', spec: `Tỉ số đòn ${BR.pedalRatio}`,
      fn: 'Nhân lực chân lên trước khi truyền vào thanh kéo.',
      fail: 'Trục chân phanh khô -> chân phanh không trả hết -> phanh sau kéo nhẹ liên tục, '
        + 'nóng trống và ăn má rất nhanh mà người lái không biết.' },
  },
  {
    id: 'brake-arm', name: 'Cần phanh + thanh kéo', nameEn: 'Brake arm & rod', qty: 1,
    category: CAT.brakeR, build: brakeArmGeo,
    info: {
      material: 'Thép',
      fn: 'Truyền lực từ chân phanh vào cam đội má. Có VẠCH CHỈ THỊ MÒN trên cần: nếu vạch trên '
        + 'cần vượt qua dấu trên mâm phanh khi đạp hết thì má đã mòn tới hạn.',
      fail: 'Điều chỉnh hành trình sai: quá lỏng thì đạp hết chân mới ăn; quá chặt thì phanh kéo '
        + 'liên tục. Phải còn một chút hành trình tự do.',
    },
  },
  {
    id: 'brake-shoes', name: 'Hai má phanh + cam đội', nameEn: 'Brake shoes & cam',
    qty: 1, category: CAT.brakeR, build: shoesGeo,
    info: {
      material: 'Đế thép + lớp ma sát',
      spec: `μ má ≈ ${BR.muShoe} · hệ số phanh tổng ≈ ${drumFactorForInfo()} (má dẫn + má bị)`,
      fn: 'HAI MÁ KHÔNG LÀM VIỆC GIỐNG NHAU dù hình dáng như nhau. Má DẪN bị ma sát KÉO THÊM vào '
        + 'lòng trống nên nó tự tăng lực ép — gọi là tự cường hoá; má BỊ thì ma sát đẩy nó rời ra. '
        + `Ở μ = ${BR.muShoe}, má dẫn góp ${leadingForInfo()} còn má bị chỉ góp `
        + `${trailingForInfo()}. Hệ quả: momen phanh phụ thuộc μ rất DỐC, nên phanh cơ vừa dễ bó `
        + 'khi má bám tốt, vừa mất rất nhiều lực khi ướt hoặc nóng.',
      fail: 'Má mòn không đều (má dẫn luôn mòn nhanh hơn) — thay CẢ CẶP. Lắp ngược chiều má -> '
        + 'mất hết tự cường hoá, phanh yếu hẳn mà nhìn thì thấy bình thường.',
    },
  },
  {
    id: 'brake-drum', name: 'Tang trống', nameEn: 'Brake drum', qty: 1,
    category: CAT.brakeR, build: drumGeo,
    info: {
      material: 'Gang, liền moay-ơ bánh sau',
      spec: `Ø trong ${BR.drumR * 2} mm · rộng ${BR.drumW} mm · khối lượng ≈ ${BR.drumMassKg} kg`,
      fn: 'Mặt ma sát. Nhược điểm quyết định so với đĩa: nó là một cái HỘP KÍN, má phanh nằm bên '
        + 'trong nên nhiệt gần như không có đường ra. Khi đổ đèo, đó là điều đáng lo nhất — xem '
        + 'chế độ Hoạt động.',
      fail: 'Đổ đèo bằng phanh sau -> trống nóng -> mất phần lớn lực phanh. Vào nước -> nước đọng '
        + 'TRONG trống và không tự ráo như đĩa -> phanh gần như mất tác dụng vài trăm mét đầu. '
        + 'Mòn ôvan -> phanh giật theo vòng quay.',
    },
  },

  // ── Truyền động cuối ───────────────────────────────────────────────────────
  {
    id: 'front-sprocket', name: `Nhông trước (${FD.frontSprocket.teeth} răng)`,
    nameEn: 'Front sprocket', qty: 1, category: CAT.drive, build: frontSprocketGeo,
    info: { material: 'Thép tôi', spec: `${FD.frontSprocket.teeth} răng`,
      fn: 'Nhông nhỏ nên mỗi răng chịu tải lớn và quay nhanh — nó mòn nhanh nhất trong bộ ba.',
      fail: 'Răng vẹt thành hình lưỡi liềm. THAY CẢ BỘ nhông–sên–dĩa: lắp sên mới vào nhông cũ '
        + 'thì sên mới mòn nhanh gấp mấy lần.' },
  },
  {
    id: 'rear-sprocket', name: `Dĩa sau (${FD.rearSprocket.teeth} răng)`,
    nameEn: 'Rear sprocket', qty: 1, category: CAT.drive, build: rearSprocketGeo,
    info: {
      material: 'Thép',
      spec: `${FD.rearSprocket.teeth} răng → tỉ số cuối `
        + `${(FD.rearSprocket.teeth / FD.frontSprocket.teeth).toFixed(2)}`,
      fn: 'Cùng nhông trước tạo tỉ số truyền cuối. Đổi số răng là cách rẻ nhất để đổi tính cách '
        + 'xe: dĩa nhiều răng hơn = bốc hơn nhưng tốc độ tối đa thấp hơn.',
      fail: 'Mòn kèm nhông trước. Bắt lỏng bu lông dĩa -> vỡ tai moay-ơ.',
    },
  },
  {
    id: 'chain', name: 'Sên (dây curoa răng)', nameEn: 'Drive chain', qty: 1,
    category: CAT.drive, build: chainGeo, stays: true,
    info: {
      material: `Sên ${FD.pitch === 12.7 ? '428' : ''} có o-ring`,
      spec: `Độ võng ${FD.slackSpec[0]}–${FD.slackSpec[1]} mm đo ở giữa nhịp`,
      fn: 'Độ võng KHÔNG phải con số tuỳ ý. Bánh sau đi theo cung tròn quanh trục gắp, nên khoảng '
        + 'cách nhông–trục bánh thay đổi khi xe nhún. Độ võng phải đủ để bù được thay đổi đó, nếu '
        + 'không thì ở một vị trí nhún nào đó sên sẽ CĂNG CỨNG và phá bạc trục ra hộp số. '
        + 'Chế độ Hoạt động tính con số này ra từ hình học.',
      fail: 'Căng quá -> hỏng bạc trục ra và giãn sên rất nhanh. Lỏng quá -> đập vào gắp, và có '
        + 'thể nhảy khỏi dĩa khi giảm ga đột ngột. Chỉnh xong phải kiểm bánh sau còn THẲNG hàng.',
      note: 'Trong mô hình, vị trí từng mắt sên được tính lại mỗi khung hình theo vị trí thật của '
        + 'trục bánh sau, nên sên không tham gia hoạt cảnh tháo lắp như các chi tiết khác.',
    },
  },
  {
    id: 'footpegs', name: 'Gác chân', nameEn: 'Footpegs', qty: 2,
    category: CAT.frame, build: pegGeo,
    info: { material: 'Thép + cao su',
      fn: 'Điểm tựa để người lái dồn trọng lượng — vị trí khối tâm người ảnh hưởng trực tiếp tới '
        + 'phân bố tải khi phanh.',
      fail: 'Cao su mòn -> trượt chân. Trục gác chân lỏng -> nứt tai khung.' },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-engine', name: 'Động cơ (ngữ cảnh)', nameEn: 'Engine (context)', qty: 1,
    category: CAT.ctx, build: ctxEngineGeo,
    info: { material: 'Nhôm đúc', spec: '≈ 25 kg, treo ở ba điểm trên khung',
      fn: 'Động cơ là khối nặng nhất và nằm thấp — nó kéo khối tâm xuống thấp, mà khối tâm thấp '
        + 'thì chuyển tải khi phanh ít hơn. Chi tiết ở các hệ thống 01–08.' },
  },
  {
    id: 'ctx-ground', name: 'Mặt đất (mốc quy chiếu)', nameEn: 'Ground', qty: 1,
    category: CAT.ctx, build: groundGeo, stays: true,
    info: { material: 'Không phải chi tiết',
      fn: 'Mốc để thấy độ lún của treo và độ chúi khi phanh.' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Vài số dẫn xuất dùng trong bảng thông số ở trên
// ─────────────────────────────────────────────────────────────────────────────

function trailForInfo() {
  const rk = deg(L.steer.rakeDeg);
  return (WF.r * Math.tan(rk) - L.steer.offset / Math.cos(rk)).toFixed(0);
}
function SWING_R_FOR_INFO() {
  return Math.hypot(SW.axle[0] - SW.pivot[0], SW.axle[1] - SW.pivot[1]).toFixed(0);
}
function drumFactorParts() {
  const mu = BR.muShoe;
  return {
    leading: (BR.servoK * mu) / (1 - mu * BR.servoE),
    trailing: (BR.servoK * mu) / (1 + mu * BR.servoE),
  };
}
function drumFactorForInfo() {
  const d = drumFactorParts();
  return (d.leading + d.trailing).toFixed(2);
}
function leadingForInfo() { return drumFactorParts().leading.toFixed(2); }
function trailingForInfo() { return drumFactorParts().trailing.toFixed(2); }
