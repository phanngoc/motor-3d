/**
 * parts.js — Toàn bộ chi tiết của hệ thống trục khuỷu & lốc máy.
 *
 * Điểm quan trọng nhất về cấu trúc dữ liệu ở đây: trục khuỷu và TAY BIÊN là
 * MỘT chi tiết duy nhất (`crank`). Đó không phải để tiện code — trên xe số hai
 * má khuỷu được ép nóng vào chốt khuỷu với tay biên kẹt ở giữa, nên chúng thật
 * sự không tách rời được bằng tay. Tay biên chỉ là một node con để nghiêng theo
 * góc quay.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, extrudeX, extrudeY, lathe, rod,
  tubeSolid, sprocketShape, hexPrism, boltGeo, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, CRANK_R, CAM_PR } from './layout.js';

const CK = L.crank, CS = L.case, BR = L.bearing, SL = L.seal, FW = L.flywheel;

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

const uv = (y, z) => [-z, y];

const xRod = (r, x0, x1, y = 0, z = 0, segs = 32) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 36) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

const xLathe = (profile, x0, y = 0, z = 0, segs = 44) =>
  place(lathe(profile, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Dải nối 2 điểm trong shape-space. */
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

/** Ổ bi cầu: vòng ngoài + vòng trong + viên bi. */
function ballBearing(x0) {
  const rm = (BR.rIn + BR.rOut) / 2;
  const rb = (BR.rOut - BR.rIn) * 0.27;
  const parts = [
    xTube(BR.rOut, rm + rb * 0.85, x0, x0 + BR.w, 0, 0, 34),
    xTube(rm - rb * 0.85, BR.rIn, x0, x0 + BR.w, 0, 0, 34),
  ];
  for (let i = 0; i < BR.balls; i++) {
    const a = (i / BR.balls) * TAU;
    const s = new THREE.SphereGeometry(rb, 12, 9);
    s.translate(x0 + BR.w / 2, rm * Math.cos(a), rm * Math.sin(a));
    parts.push(s);
  }
  return union(parts);
}

/** Phớt chặn nhớt: khung + môi cao su + lò xo vòng. */
function sealGeo(x0, mat = MAT.rubber) {
  return union([
    xTube(SL.rOut, SL.rIn + 1.6, x0, x0 + SL.w, 0, 0, 30),
    xLathe([[SL.rIn, 0], [SL.rIn + 1.8, 0], [SL.rIn + 1.8, SL.w * 0.55],
      [SL.rIn, SL.w * 0.35], [SL.rIn, 0]], x0, 0, 0, 30),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// TRỤC KHUỶU (gồm cả tay biên — không tách rời được)
// ─────────────────────────────────────────────────────────────────────────────

/** Một má khuỷu: đĩa tròn + phần đối trọng nặng ở phía ĐỐI DIỆN chốt khuỷu. */
function webGeo(x0, x1) {
  const r = CK.webR;
  const s = circleShape(r, 0, 0);
  const parts = [place(extrudeX(s, x1 - x0, { bevel: 1, curveSegments: 34 }), { x: x0 })];
  // Đối trọng: cung dày thêm ở phía −Y (ngược chốt khuỷu đang ở +Y)
  const cw = new THREE.Shape();
  cw.absarc(0, 0, r + 4.5, deg(200), deg(340), false);
  cw.absarc(0, 0, r - 9, deg(340), deg(200), true);
  cw.closePath();
  parts.push(place(extrudeX(cw, x1 - x0, { bevel: 1, curveSegments: 26 }), { x: x0 }));
  return union(parts);
}

function crankGeo() {
  const parts = [
    // côn + ren bắt bánh đà (trái) và bộ nồi (phải)
    xLathe([[0, 0], [11, 0], [13.5, CK.flyTaper[1] - CK.flyTaper[0]],
      [0, CK.flyTaper[1] - CK.flyTaper[0]]], CK.flyTaper[0]),
    xRod(CK.journalR, CK.sealLeft[0], CK.bearLeft[1]),
    xRod(CK.journalR, CK.webRight[1], CK.sealRight[1]),
    xLathe([[13.5, 0], [11, CK.clutchTaper[1] - CK.clutchTaper[0]],
      [0, CK.clutchTaper[1] - CK.clutchTaper[0]], [0, 0]], CK.clutchTaper[0]),
    // nhông dẫn động dây cam
    (() => {
      const { shape } = sprocketShape(L.camSprocket.teeth, L.camSprocket.pitch, 3.1, 0);
      return place(extrudeX(shape, CK.camSprocket[1] - CK.camSprocket[0],
        { bevel: 0.4, curveSegments: 3 }), { x: CK.camSprocket[0] });
    })(),
    xRod(11, CK.camSprocket[1], CK.webLeft[0]),
    // 2 má khuỷu
    webGeo(CK.webLeft[0], CK.webLeft[1]),
    webGeo(CK.webRight[0], CK.webRight[1]),
    // chốt khuỷu ở bán kính hành trình
    xRod(CK.pinR, CK.pin[0], CK.pin[1], CRANK_R, 0, 30),
  ];

  // Tay biên: node con để nghiêng quanh CHỐT PISTON
  const rodNode = new THREE.Group();
  rodNode.name = 'rodTilt';
  const small = 10.5, big = 17.5, len = L.rodLen;
  const s = new THREE.Shape();
  s.absarc(0, 0, small, deg(-60), deg(240), false);
  s.lineTo(-big * 0.55, -len + big * 0.6);
  s.absarc(0, -len, big, deg(150), deg(-330), true);
  s.lineTo(small * 0.55, -small * 0.5);
  s.closePath();
  bore(s, small - 2, 0, 0);
  bore(s, CK.pinR + 0.3, 0, -len);
  rodNode.add(mesh(union([
    place(extrudeX(s, 13, { bevel: 0.8, curveSegments: 18 }), { x: -6.5 }),
  ]), MAT.hardened, 'con-rod'));

  const grp = new THREE.Group();
  grp.add(mesh(union(parts), MAT.hardened, 'crank-body'));
  grp.add(rodNode);
  grp.userData.nodes = { rod: rodNode };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ổ BI · PHỚT · BÁNH ĐÀ
// ─────────────────────────────────────────────────────────────────────────────

const bearingLeftGeo = () => new THREE.Group().add(mesh(ballBearing(CK.bearLeft[0]), MAT.steel, 'bearing-left'));
const bearingRightGeo = () => new THREE.Group().add(mesh(ballBearing(CK.bearRight[0]), MAT.steel, 'bearing-right'));
const sealLeftGeo = () => new THREE.Group().add(mesh(sealGeo(CK.sealLeft[0]), MAT.rubber, 'seal-left'));
const sealRightGeo = () => new THREE.Group().add(mesh(sealGeo(CK.sealRight[0]), MAT.rubber, 'seal-right'));

function flywheelGeo() {
  const f = FW;
  const parts = [
    // cốc bánh đà, mở miệng về phía +X (úp lên mâm lửa)
    xTube(f.rOut, f.rOut - 8, f.x0, f.x1, 0, 0, 48),
    xLathe([[f.rIn, 0], [f.rOut, 0], [f.rOut, 6], [f.rIn, 6], [f.rIn, 0]], f.x0, 0, 0, 48),
    // lỗ côn khớp trục khuỷu
    xLathe([[0, 0], [f.rIn, 0], [f.rIn, 14], [0, 14]], f.x0, 0, 0, 30),
  ];
  // nam châm vĩnh cửu gắn trong lòng cốc
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const sec = new THREE.Shape();
    sec.absarc(0, 0, f.magnetR, a + deg(6), a + deg(54), false);
    sec.absarc(0, 0, f.magnetR - 7, a + deg(54), a + deg(6), true);
    sec.closePath();
    const sh = new THREE.Shape(sec.getPoints(20).map((p) => new THREE.Vector2(-p.y, p.x)));
    parts.push(place(extrudeX(sh, 16, { curveSegments: 1 }), { x: f.x0 + 6 }));
  }
  // dấu chỉ thị điểm chết trên trên vành ngoài
  parts.push(place(extrudeY(roundedRect(3, 2.4, 0.4), 3), { x: f.x1 - 2, y: f.rOut - 3 }));
  return new THREE.Group().add(mesh(union(parts), MAT.steel, 'flywheel'));
}

const keyGeo = () => {
  const k = L.key;
  const g = place(extrudeY(roundedRect(k.len, k.w, 0.6), k.h), { y: -k.h / 2 });
  return new THREE.Group().add(mesh(
    place(g, { x: -62, y: CK.journalR - 0.6, z: 0 }), MAT.steel, 'flywheel-key'));
};

const flyNutGeo = () => new THREE.Group().add(mesh(union([
  place(hexPrism(L.flyNut.af, 8, 6), { rz: -Math.PI / 2, x: L.flyNut.x, y: 0, z: 0 }),
  xTube(L.flyNut.af / 1.6, 6, L.flyNut.x + 8, L.flyNut.x + 10, 0, 0, 22),
]), MAT.blackOxide, 'flywheel-nut'));

// ─────────────────────────────────────────────────────────────────────────────
// LỐC MÁY — hai nửa, mặt lắp tại x = 0
// ─────────────────────────────────────────────────────────────────────────────

/** Biên dạng ngoài của lốc máy trong shape-space của extrudeX. */
function caseOutline(grow = 0) {
  const [cu, cv] = uv(CS.cy, 0);
  return roundedRect(CS.d + grow * 2, CS.w + grow * 2, CS.r + grow, cu, cv);
}

/**
 * Một nửa lốc máy = vách đầu (có lỗ ổ bi + lỗ phớt) + thành bao + vành mặt lắp.
 * Vỏ mỏng nên nhìn xuyên vào được khi tách ra.
 */
function caseHalfGeo(side) {
  const isLeft = side < 0;
  const endX = isLeft ? CS.leftX : CS.rightX - CS.wallT;
  const flangeX = isLeft ? -CS.flangeT : 0;
  const parts = [];

  // Vách đầu: có lỗ đỡ ổ bi
  const wall = caseOutline(0);
  bore(wall, BR.rOut, ...uv(0, 0));
  parts.push(place(extrudeX(wall, CS.wallT, { bevel: 1.5, curveSegments: 14 }), { x: endX }));
  // Bệ đỡ ổ bi (vành dày quanh lỗ)
  const bx = isLeft ? CK.bearLeft[0] : CK.bearRight[0];
  parts.push(xTube(BR.rOut + 7, BR.rOut, bx, bx + BR.w + 3, 0, 0, 34));
  // Bệ phớt
  const sx = isLeft ? CK.sealLeft[0] : CK.sealRight[0];
  parts.push(xTube(SL.rOut + 5, SL.rOut, sx, sx + SL.w, 0, 0, 30));

  // Thành bao: vỏ mỏng giữa vách đầu và mặt lắp
  const shell = caseOutline(0);
  const inner = caseOutline(-CS.wallT);
  shell.holes.push(new THREE.Path(inner.getPoints(56).reverse()));
  const shellLen = isLeft ? Math.abs(CS.leftX) - CS.wallT : CS.rightX - CS.wallT;
  parts.push(place(extrudeX(shell, shellLen, { curveSegments: 14 }),
    { x: isLeft ? CS.leftX + CS.wallT : 0 }));

  // Vành mặt lắp, có lỗ bu lông
  const flange = caseOutline(4);
  const fInner = caseOutline(-CS.wallT - 1);
  flange.holes.push(new THREE.Path(fInner.getPoints(56).reverse()));
  for (let i = 0; i < CS.boltCount; i++) {
    const a = (i / CS.boltCount) * TAU;
    bore(flange, 3.4, ...uv(CS.cy + CS.boltR * 0.82 * Math.cos(a), CS.boltR * Math.sin(a)));
  }
  parts.push(place(extrudeX(flange, CS.flangeT, { curveSegments: 14 }), { x: flangeX }));

  return new THREE.Group().add(mesh(union(parts), MAT.alu,
    isLeft ? 'case-left' : 'case-right'));
}

const caseBoltsGeo = () => {
  const pos = Array.from({ length: CS.boltCount }, (_, i) => {
    const a = (i / CS.boltCount) * TAU;
    return [CS.cy + CS.boltR * 0.82 * Math.cos(a), CS.boltR * Math.sin(a)];
  });
  return new THREE.Group().add(mesh(union(pos.map(([y, z]) =>
    place(boltGeo(6, 18, { headAF: 10, headH: 5, flange: 1.2 }),
      { rz: Math.PI / 2, x: CS.flangeT + 2, y, z }),
  )), MAT.blackOxide, 'case-bolts'));
};

const caseDowelsGeo = () => new THREE.Group().add(mesh(union(
  CS.dowels.map(([y, z]) => xTube(4, 2.6, -7, 7, y, z, 20)),
), MAT.steel, 'case-dowels'));

// ─────────────────────────────────────────────────────────────────────────────
// LƯỚI LỌC NHỚT · BU LÔNG XẢ
// ─────────────────────────────────────────────────────────────────────────────

function strainerGeo() {
  const s = L.strainer;
  const frame = roundedRect(s.d, s.w, 5, 0, 0);
  const inner = roundedRect(s.d - 9, s.w - 9, 3, 0, 0);
  frame.holes.push(new THREE.Path(inner.getPoints(28).reverse()));
  const parts = [place(extrudeX(frame, s.t, { curveSegments: 8 }), { x: -s.w / 2 })];
  // lưới: các thanh mảnh đan nhau
  for (let i = -4; i <= 4; i++) {
    parts.push(place(extrudeY(roundedRect(s.w - 10, 1.1, 0.3), 1.1), { y: -0.5, z: i * 4.4 }));
    parts.push(place(extrudeY(roundedRect(1.1, s.d - 10, 0.3), 1.1), { y: 0.5, x: i * 5.2 }));
  }
  return new THREE.Group().add(mesh(
    place(union(parts), { y: L.strainer.y }), MAT.steel, 'oil-strainer'));
}

const drainGeo = () => new THREE.Group().add(mesh(union([
  place(boltGeo(L.drain.d, 14, { headAF: 17, headH: 7 }), { rx: Math.PI, y: L.drain.y + 14 }),
  place(tubeSolid(L.drain.d / 2 + 3, L.drain.d / 2, 0, 1.6, 24), { y: L.drain.y + 14 }),
]), MAT.blackOxide, 'drain-bolt'));

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

const ctxCylinderGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(bore(roundedRect(80, 74, 10), L.bore / 2 + 3.5), L.cylY[1] - L.cylY[0],
    { curveSegments: 9 }), { y: L.cylY[0] }),
  place(tubeSolid(L.bore / 2 + 3.5, L.bore / 2, 0, L.cylY[1] - L.cylY[0], 44), { y: L.cylY[0] }),
]), MAT.ghost, 'cylinder'));

function ctxPistonGeo() {
  const r = L.bore / 2 - 0.3;
  const slider = new THREE.Group();
  slider.name = 'pistonSlide';
  slider.add(mesh(union([
    lathe([[0, -19], [r - 2.4, -19], [r - 2.4, -7], [r, -5], [r, L.pistonCH - 2],
      [r - 1.8, L.pistonCH], [0, L.pistonCH]], 40),
  ]), MAT.ghost, 'piston'));
  const grp = new THREE.Group();
  grp.add(slider);
  grp.userData.nodes = { slider };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  case: 'Lốc máy',
  crank: 'Trục khuỷu & ổ đỡ',
  fly: 'Bánh đà',
  oil: 'Nhớt',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Bánh đà ────────────────────────────────────────────────────────────────
  {
    id: 'flywheel-nut', name: 'Đai ốc bánh đà', nameEn: 'Flywheel nut', qty: 1,
    category: CAT.fly, build: flyNutGeo,
    info: {
      material: 'Thép', torque: '≈ 55 N·m',
      fn: 'Ép bánh đà lên côn trục khuỷu. Lực siết là thứ tạo ra ma sát trên mặt côn — '
        + 'then bán nguyệt chỉ ĐỊNH VỊ GÓC, không truyền momen.',
      fail: 'Siết thiếu lực -> bánh đà tự lỏng, cắt then, sai thời điểm đánh lửa. '
        + 'Côn còn dầu nhớt sẽ làm bánh đà trượt dù siết đủ lực — phải lau khô bằng dung môi.',
    },
  },
  {
    id: 'flywheel', name: 'Bánh đà / rôto mâm lửa', nameEn: 'Flywheel / rotor', qty: 1,
    category: CAT.fly, build: flywheelGeo,
    info: {
      material: 'Thép + nam châm vĩnh cửu gắn trong lòng cốc',
      spec: `Ø${FW.rOut * 2} mm · lắp côn + then bán nguyệt`,
      fn: 'Làm BA việc: giữ quán tính cho trục khuỷu quay đều giữa các kỳ (một xy-lanh '
        + 'chỉ sinh công 1 lần mỗi 2 vòng), làm rôto của máy phát điện, và mang dấu chỉ thị '
        + 'điểm chết trên để căn cam / căn lửa.',
      fail: 'Nam châm yếu do va đập mạnh hoặc quá nhiệt -> lửa yếu ở mọi vòng tua. '
        + 'Lỗ côn bị rỗ -> bánh đà lắc, phải thay.',
    },
  },
  {
    id: 'flywheel-key', name: 'Then bán nguyệt', nameEn: 'Woodruff key', qty: 1,
    category: CAT.fly, build: keyGeo,
    info: {
      material: 'Thép', spec: `${L.key.len} × ${L.key.w} × ${L.key.h} mm — rất nhỏ, dễ mất`,
      fn: 'ĐỊNH VỊ GÓC cho bánh đà. Nó KHÔNG truyền momen (momen truyền qua ma sát mặt côn) '
        + 'nhưng nó quyết định bánh đà ngồi ở đúng góc nào — tức quyết định thời điểm đánh lửa.',
      fail: 'Bị CẮT (do đai ốc lỏng, bánh đà trượt trên côn) -> lệch góc -> xe nổ dội hoặc '
        + 'không nổ. Đây là nguyên nhân hay bị bỏ qua nhất: người ta thay bugi, cuộn lửa, CDI '
        + 'mà không nghĩ tới một miếng thép bé bằng hạt gạo.',
    },
  },

  // ── Lốc máy ────────────────────────────────────────────────────────────────
  {
    id: 'case-bolts', name: `Bu lông lốc máy (${CS.boltCount})`, nameEn: 'Crankcase bolts',
    qty: CS.boltCount, category: CAT.case, build: caseBoltsGeo,
    info: {
      material: 'Thép', spec: 'M6, CHIỀU DÀI KHÁC NHAU tuỳ vị trí',
      torque: '≈ 10–12 N·m, siết theo hình XOẮN từ trong ra ngoài, 2 lượt',
      fn: 'Ép hai nửa lốc máy. Hai nửa không có gioăng giấy — chỉ phủ keo làm kín, nên lực '
        + 'siết đều là điều kiện để kín.',
      fail: 'Lắp sai chiều dài -> bu lông dài xuyên qua mặt lắp hoặc bu lông ngắn không đủ ren. '
        + 'Trước khi tháo hãy vẽ hình lốc máy lên bìa, đâm lỗ và cắm bu lông vào đúng vị trí — '
        + 'đây là bước bị bỏ qua nhiều nhất và là nguyên nhân phổ biến nhất của "lắp lại bị rỉ nhớt".',
    },
  },
  {
    id: 'case-right', name: 'Nửa lốc máy phải', nameEn: 'Right crankcase half', qty: 1,
    category: CAT.case, build: () => caseHalfGeo(+1),
    info: {
      material: 'Hợp kim nhôm đúc áp lực',
      spec: 'Chứa ổ đỡ phải, khoang ly hợp, bơm nhớt. Mặt lắp tại x = 0',
      fn: 'Nửa này mở ra là thấy bộ nồi (hệ thống 04) và bơm nhớt (hệ thống 06).',
      fail: 'Xước mặt lắp (do nảy bằng tua-vít khi tách) -> rỉ nhớt không khắc phục được bằng keo. '
        + 'Trượt ren bu lông -> phải ta-rô lại hoặc cấy ren.',
    },
  },
  {
    id: 'case-left', name: 'Nửa lốc máy trái', nameEn: 'Left crankcase half', qty: 1,
    category: CAT.case, build: () => caseHalfGeo(-1),
    info: {
      material: 'Hợp kim nhôm đúc áp lực',
      spec: 'Chứa ổ đỡ trái, đường dây cam, ổ đỡ trục số',
      fn: 'Đỡ trục khuỷu và trục hộp số; tạo khoang các-te chứa nhớt.',
      fail: 'Như nửa phải. Ngoài ra vùng ổ đỡ hay bị mòn rộng khi ổ bi đã kẹn lâu — '
        + 'lúc đó ép ổ bi mới vào vẫn lỏng, phải thay cả nửa lốc.',
    },
  },
  {
    id: 'case-dowels', name: 'Chốt định vị lốc máy (2)', nameEn: 'Case dowel pins', qty: 2,
    category: CAT.case, build: caseDowelsGeo,
    info: {
      material: 'Thép', spec: 'Rỗng, Ø8 mm',
      fn: 'ĐỊNH VỊ hai nửa lốc máy chính xác với nhau. Bu lông chỉ giữ chặt — lỗ bu lông '
        + 'luôn lớn hơn thân bu lông nên không định vị được.',
      fail: 'Thiếu hoặc lắp sót -> hai nửa lệch nhau -> trục khuỷu và trục số bị kéo cong, '
        + 'quay nặng và mòn ổ bi rất nhanh.',
    },
  },

  // ── Trục khuỷu & ổ đỡ ──────────────────────────────────────────────────────
  {
    id: 'seal-right', name: 'Phớt chặn nhớt phải', nameEn: 'Right crank seal', qty: 1,
    category: CAT.crank, build: sealRightGeo,
    info: {
      material: 'Cao su NBR + khung thép + lò xo vòng',
      spec: 'Lò xo vòng hướng VÀO phía có nhớt',
      fn: 'Chặn nhớt không rỉ ra khoang ly hợp.',
      fail: 'Lắp NGƯỢC chiều -> phớt không ép vào trục khi áp suất tăng -> rỉ ngay. '
        + 'Phớt luôn lắp SAU ổ bi, ở phía ngoài.',
    },
  },
  {
    id: 'bearing-right', name: 'Ổ bi cầu đỡ phải', nameEn: 'Right main bearing', qty: 1,
    category: CAT.crank, build: bearingRightGeo,
    info: {
      material: 'Thép ổ bi',
      spec: `Ø trong ${BR.rIn * 2} / Ø ngoài ${BR.rOut * 2} mm · lắp ÉP CHẶT vào lốc máy`,
      fn: 'Đỡ trục khuỷu, chịu cả lực hướng kính và một phần lực dọc trục.',
      fail: 'Kẹn/lỏng -> tiếng ru đều theo tốc độ, không theo tải. Thay bằng cách HÂM NÓNG '
        + 'lốc máy (~90–110 °C, nhôm giãn nhiều hơn thép) rồi ép ổ mới vào, và chỉ đẩy lực '
        + 'qua vòng NGOÀI. Đóng búa qua vòng TRONG làm mòn vết bi -> ổ kêu sau vài trăm km.',
    },
  },
  {
    id: 'crank', name: 'Trục khuỷu nguyên bộ (kèm tay biên)', nameEn: 'Crankshaft assembly', qty: 1,
    category: CAT.crank, build: crankGeo,
    info: {
      material: 'Thép rèn — 2 má khuỷu ÉP NÓNG vào chốt khuỷu, tay biên kẹt ở giữa',
      spec: `Bán kính khuỷu ${CRANK_R} mm (= nửa hành trình ${L.stroke} mm) · `
        + `nhông dây cam ${L.camSprocket.teeth} răng, R vòng chia ${CAM_PR.toFixed(1)} mm`,
      tolerance: 'Độ đảo trục ≤ 0,03 mm · độ đảo radial đầu to ≤ 0,05 mm · '
        + 'khe hở dọc trục đầu to 0,10–0,40 mm',
      fn: 'Biến chuyển động thẳng của piston thành chuyển động quay, và dẫn động dây cam, '
        + 'bơm nhớt, bộ nồi, mâm lửa.',
      fail: 'Đây là TRỤC KHUỶU RỜI: tay biên và ổ bi kim đầu to bị kẹp trong khối ép nóng nên '
        + 'KHÔNG THỂ thay riêng. Ổ bi đầu to mòn -> gõ nặng dưới máy -> phải thay cả bộ hoặc '
        + 'đưa ra xưởng ép lại. Đó là lý do một tiếng gõ lại là chẩn đoán đắt tiền.',
    },
  },
  {
    id: 'bearing-left', name: 'Ổ bi cầu đỡ trái', nameEn: 'Left main bearing', qty: 1,
    category: CAT.crank, build: bearingLeftGeo,
    info: {
      material: 'Thép ổ bi', spec: `Ø trong ${BR.rIn * 2} / Ø ngoài ${BR.rOut * 2} mm`,
      fn: 'Đỡ trục khuỷu phía mâm lửa.',
      fail: 'Như ổ bi phải. Bên này còn hay bị hỏng do nhớt từ phớt rỉ ra làm mất mỡ ổ.',
    },
  },
  {
    id: 'seal-left', name: 'Phớt chặn nhớt trái', nameEn: 'Left crank seal', qty: 1,
    category: CAT.crank, build: sealLeftGeo,
    info: {
      material: 'Cao su NBR + khung thép + lò xo vòng',
      fn: 'Chặn nhớt không rỉ ra khoang mâm lửa.',
      fail: 'Rỉ nhớt vào mâm lửa -> ướt cuộn điện -> <b>lửa yếu, không sạc được ắc quy, đèn '
        + 'chập chờn</b> cùng một lúc. Một nguyên nhân, ba triệu chứng ở ba hệ thống khác nhau '
        + '(xem hệ thống 08).',
    },
  },

  // ── Nhớt ───────────────────────────────────────────────────────────────────
  {
    id: 'oil-strainer', name: 'Lưới lọc nhớt', nameEn: 'Oil strainer screen', qty: 1,
    category: CAT.oil, build: strainerGeo,
    info: {
      material: 'Lưới thép + khung',
      fn: 'Chặn mảnh kim loại lớn trước khi nhớt vào bơm. Đây là cấp lọc THỨ NHẤT và thô nhất — '
        + 'xe số không có lọc giấy (hệ thống 06).',
      fail: 'Tắc -> bơm hút không được -> tụt áp suất nhớt -> gõ đầu bò. Vệ sinh mỗi lần tách máy.',
    },
  },
  {
    id: 'drain-bolt', name: 'Bu lông xả nhớt + long đen', nameEn: 'Drain bolt & crush washer',
    qty: 2, category: CAT.oil, build: drainGeo,
    info: {
      material: 'Thép + long đen nhôm/đồng biến dạng', torque: '≈ 24 N·m',
      fn: 'Xả nhớt cũ ở điểm thấp nhất của các-te.',
      fail: 'Long đen là chi tiết DÙNG MỘT LẦN — dùng lại là rỉ nhớt. Siết quá tay -> '
        + 'trượt ren nhôm lốc máy, hư hỏng đắt hơn nhiều so với cái long đen.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-cylinder', name: 'Xy-lanh (ngữ cảnh)', nameEn: 'Cylinder', qty: 1,
    category: CAT.ctx, build: ctxCylinderGeo,
    info: { material: 'Nhôm + ống lót gang', fn: 'Chi tiết đầy đủ ở hệ thống 02.' },
  },
  {
    id: 'ctx-piston', name: 'Piston (ngữ cảnh)', nameEn: 'Piston', qty: 1,
    category: CAT.ctx, build: ctxPistonGeo,
    info: { material: 'Nhôm hợp kim',
      fn: 'Chạy đồng bộ với trục khuỷu để thấy quan hệ giữa góc quay và vị trí piston. '
        + 'Chi tiết đầy đủ ở hệ thống 02.' },
  },
];
