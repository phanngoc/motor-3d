/**
 * parts.js — Toàn bộ chi tiết của hệ thống xy-lanh – piston – tay biên.
 *
 * Nhóm chuyển động cùng piston (piston, 3 xéc-măng, chốt, khoá chốt) đều dựng
 * ở toạ độ TÂM CHỐT = gốc, rồi kinematics dịch theo pinY(θ). Tay biên có node
 * riêng để nghiêng quanh tâm chốt.
 */

import * as THREE from 'three';
import {
  TAU, deg, roundedRect, circleShape, bore, slot, extrudeY, extrudeX, lathe, rod,
  tubeSolid, union, mesh, place,
} from '../../lib/geom.js';
import { MAT } from '../../core/materials.js';
import { L, CRANK_R, CRANK_Y, PISTON_R, ringOuterR } from './layout.js';

const C = L.cyl, P = L.piston, RD = L.rod;

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH CỤC BỘ
// ─────────────────────────────────────────────────────────────────────────────

/** Trụ nằm theo trục X (chốt piston, cổ trục). */
const xRod = (r, x0, x1, y = 0, z = 0, segs = 28) =>
  place(rod(r, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

const xTube = (rO, rI, x0, x1, y = 0, z = 0, segs = 32) =>
  place(tubeSolid(rO, rI, 0, x1 - x0, segs), { rz: -Math.PI / 2, x: x0, y, z });

/** Bệ ngoài xy-lanh, có lỗ bu lông + đường dây cam + lòng xy-lanh. */
function cylFootprint(grow = 0, boreR = null) {
  const s = roundedRect(C.w + grow * 2, C.d + grow * 2, C.r + grow);
  for (const [x, z] of C.boltPos) bore(s, C.boltD / 2 + 0.35, x, z);
  slot(s, C.tunnel.w, C.tunnel.d, 6, C.tunnel.x, C.tunnel.z);
  bore(s, boreR ?? L.bore / 2 + C.linerT, 0, 0);
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// XY-LANH
// ─────────────────────────────────────────────────────────────────────────────

function cylinderGeo() {
  const h = C.y1 - C.y0;
  const CS = { curveSegments: 9 };
  const g = [
    // thân nhôm
    place(extrudeY(cylFootprint(), h, { ...CS, bevel: 2 }), { y: C.y0 }),
    // ống lót gang ép trong
    place(tubeSolid(L.bore / 2 + C.linerT, L.bore / 2, 0, h, 56), { y: C.y0 }),
    // vành mặt lắp trên và dưới
    place(extrudeY(cylFootprint(0), 3, CS), { y: C.y1 - 3 }),
  ];
  // cánh tản nhiệt
  for (let i = 0; i < C.finCount; i++) {
    const grow = 5.5 - i * 0.24;
    g.push(place(extrudeY(cylFootprint(grow), 2.0, CS), { y: C.y0 + 6 + i * 6.2 }));
  }
  return new THREE.Group().add(mesh(union(g), MAT.alu, 'cylinder-body'));
}

function baseGasketGeo() {
  const s = roundedRect(C.w, C.d, C.r);
  for (const [x, z] of C.boltPos) bore(s, C.boltD / 2 + 0.8, x, z);
  slot(s, C.tunnel.w + 1, C.tunnel.d + 1, 6, C.tunnel.x, C.tunnel.z);
  bore(s, L.bore / 2 - 0.5, 0, 0);
  return new THREE.Group().add(mesh(
    place(extrudeY(s, L.gasket.t, { curveSegments: 9 }), { y: C.y0 - L.gasket.t }),
    MAT.gasket, 'base-gasket'));
}

const dowelsGeo = () => new THREE.Group().add(mesh(union(
  L.dowel.pos.map(([x, z]) =>
    place(tubeSolid(L.dowel.d / 2, L.dowel.d / 2 - 1.6, 0, L.dowel.len, 20),
      { x, y: C.y0 - L.dowel.len / 2, z })),
), MAT.steel, 'dowels'));

// ─────────────────────────────────────────────────────────────────────────────
// PISTON (gốc toạ độ = TÂM CHỐT)
// ─────────────────────────────────────────────────────────────────────────────

function pistonGeo() {
  const r = PISTON_R;
  const top = L.pistonCH;
  const gr = P.grooves;
  // Profile tròn xoay: đi từ dưới váy lên đỉnh, khoét 3 rãnh xéc-măng
  const prof = [[0, -P.skirtDown], [r - 1.8, -P.skirtDown], [r - 1.8, -7], [r, -5]];
  // 3 rãnh, tính từ đỉnh xuống -> chuyển sang toạ độ y so với tâm chốt
  const grooveBands = gr.map((g) => ({
    yTop: top - g.top,
    yBot: top - g.top - g.t,
    r: r - g.depth,
  })).sort((a, b) => a.yBot - b.yBot);
  for (const b of grooveBands) {
    prof.push([r, b.yBot], [b.r, b.yBot], [b.r, b.yTop], [r, b.yTop]);
  }
  prof.push([r, top - 1.6], [r - 1.4, top], [P.pinBoreR + 2, top]);
  // lõm nhẹ trên đỉnh
  prof.push([P.pinBoreR + 2, top - P.crownDish], [0, top - P.crownDish]);

  const parts = [lathe(prof, 52)];
  // hai bệ chốt bên trong + lỗ chốt
  parts.push(xTube(P.pinBoreR + 4.2, P.pinBoreR, -r + 2, r - 2, 0, 0, 28));
  return new THREE.Group().add(mesh(union(parts), MAT.piston, 'piston-body'));
}

/** Một xéc-măng: vòng tròn ép sát thành xy-lanh. */
function ringGeo(name, mat) {
  const g = P.grooves.find((x) => x.name === name) ?? P.grooves[0];
  const yTop = L.pistonCH - g.top;
  const t = name === 'oil' ? 0.55 : g.t - 0.1;
  return place(tubeSolid(ringOuterR(), PISTON_R - g.depth + 0.4, yTop - t, yTop, 52),
    { y: 0 });
}

const ring1Geo = () => new THREE.Group().add(mesh(ringGeo('ring1'), MAT.castIron, 'ring1'));

function ring2Geo() {
  // Xéc-măng số 2 có MẶT VÁT lệch — mặt vát lắp hướng XUỐNG
  const g = P.grooves[1];
  const yTop = L.pistonCH - g.top;
  const rO = ringOuterR(), rI = PISTON_R - g.depth + 0.4;
  const prof = [
    [rI, yTop - 1.1], [rO - 0.55, yTop - 1.1], [rO, yTop - 0.5],
    [rO, yTop], [rI, yTop], [rI, yTop - 1.1],
  ];
  return new THREE.Group().add(mesh(lathe(prof, 52), MAT.castIron, 'ring2'));
}

/** Xéc-măng dầu 3 mảnh: 2 vòng gạt + 1 vòng đàn hồi ở giữa. */
function oilRailsGeo() {
  const g = P.grooves[2];
  const yTop = L.pistonCH - g.top;
  const rO = ringOuterR(), rI = PISTON_R - g.depth + 0.8;
  return new THREE.Group().add(mesh(union([
    tubeSolid(rO, rI, yTop - 0.45, yTop, 52),
    tubeSolid(rO, rI, yTop - g.t, yTop - g.t + 0.45, 52),
  ]), MAT.steel, 'oil-rails'));
}

function oilExpanderGeo() {
  const g = P.grooves[2];
  const yTop = L.pistonCH - g.top - g.t / 2;
  const rM = PISTON_R - g.depth + 1.6;
  // vòng đàn hồi dạng sóng
  const pts = [];
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = rM + 0.9 * Math.sin(a * 24);
    pts.push(new THREE.Vector3(rr * Math.cos(a), yTop + 0.5 * Math.cos(a * 24), rr * Math.sin(a)));
  }
  return new THREE.Group().add(mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), n, 0.42, 5, true),
    MAT.spring, 'oil-expander'));
}

const pinGeo = () => new THREE.Group().add(mesh(
  xTube(L.pin.d / 2, L.pin.boreR, -L.pin.len / 2, L.pin.len / 2, 0, 0, 32),
  MAT.hardened, 'pin'));

/** 2 khoá chốt hình chữ C. */
function clipsGeo() {
  const parts = [];
  for (const sx of [-1, 1]) {
    const x = sx * (L.pin.len / 2 + 1.2);
    const pts = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const a = deg(28) + (i / n) * deg(304);
      pts.push(new THREE.Vector3(x, L.clip.r * Math.cos(a), L.clip.r * Math.sin(a)));
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, L.clip.wire, 5, false));
  }
  return new THREE.Group().add(mesh(union(parts), MAT.spring, 'clips'));
}

// ─────────────────────────────────────────────────────────────────────────────
// TAY BIÊN — node riêng để nghiêng quanh TÂM CHỐT
// ─────────────────────────────────────────────────────────────────────────────

function rodBodyGeo() {
  const small = RD.smallR, big = RD.bigR, len = L.rodLen;
  // Dựng trong mặt phẳng (z, y) rồi kéo theo X: shape(u,v) -> world(z=-u, y=v)
  const s = new THREE.Shape();
  s.absarc(0, 0, small, deg(-60), deg(240), false);
  s.lineTo(-big * 0.55, -len + big * 0.6);
  s.absarc(0, -len, big, deg(150), deg(-330), true);
  s.lineTo(small * 0.55, -small * 0.5);
  s.closePath();
  bore(s, small - RD.bushT, 0, 0);
  bore(s, big - RD.needleT, 0, -len);

  const web = new THREE.Shape();
  web.moveTo(-RD.webW / 2, -small);
  web.lineTo(RD.webW / 2, -small);
  web.lineTo(RD.webW / 2 * 0.8, -len + big);
  web.lineTo(-RD.webW / 2 * 0.8, -len + big);
  web.closePath();

  const node = new THREE.Group();
  node.name = 'rodTilt';
  node.add(mesh(union([
    place(extrudeX([s], RD.webT + 4, { bevel: 0.8, curveSegments: 20 }), { x: -(RD.webT + 4) / 2 }),
    place(extrudeX(web, RD.webT, { bevel: 0.6, curveSegments: 2 }), { x: -RD.webT / 2 }),
  ]), MAT.hardened, 'rod-body'));
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { tilt: node };
  return grp;
}

function smallBushGeo() {
  const node = new THREE.Group();
  node.name = 'rodTilt';
  node.add(mesh(xTube(RD.smallR, RD.smallR - RD.bushT, -(RD.webT + 4) / 2, (RD.webT + 4) / 2, 0, 0, 30),
    MAT.bronze, 'small-bush'));
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { tilt: node };
  return grp;
}

/** Ổ bi kim đầu to: vòng ngoài + các con lăn kim. */
function bigBearingGeo() {
  const big = RD.bigR, len = L.rodLen;
  const w = RD.webT + 4;
  const parts = [xTube(big - 0.4, big - RD.needleT, -w / 2, w / 2, -len, 0, 30)];
  const rN = 1.5;
  const rC = big - RD.needleT + rN;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    parts.push(xRod(rN, -w / 2 + 1, w / 2 - 1, -len + rC * Math.cos(a), rC * Math.sin(a), 10));
  }
  const node = new THREE.Group();
  node.name = 'rodTilt';
  node.add(mesh(union(parts), MAT.steel, 'big-bearing'));
  const grp = new THREE.Group();
  grp.add(node);
  grp.userData.nodes = { tilt: node };
  return grp;
}

// ─────────────────────────────────────────────────────────────────────────────
// NGỮ CẢNH
// ─────────────────────────────────────────────────────────────────────────────

function ctxCrankGeo() {
  const spin = new THREE.Group();
  spin.name = 'crankSpin';
  // má khuỷu + chốt khuỷu ở bán kính hành trình (dựng quanh tâm trục khuỷu)
  spin.add(mesh(union([
    place(lathe([[0, 0], [36, 0], [36, 11], [0, 11]], 44), { rz: -Math.PI / 2, x: -22 }),
    place(lathe([[0, 0], [36, 0], [36, 11], [0, 11]], 44), { rz: -Math.PI / 2, x: 11 }),
    xRod(RD.bigR - RD.needleT - 0.2, -12, 12, CRANK_R, 0, 26),   // chốt khuỷu
    place(extrudeY(roundedRect(14, 13, 4), 30), { x: -3, y: 2, z: 0 }),
  ]), MAT.ghost, 'crank'));
  const grp = new THREE.Group();
  grp.add(spin);
  grp.userData.nodes = { spin };
  return grp;
}

const ctxCaseGeo = () => new THREE.Group().add(mesh(union([
  place(extrudeY(cylFootprint(4, L.bore / 2 + 8), 10, { curveSegments: 9 }), { y: L.caseY }),
  place(lathe([[0, 0], [52, 0], [52, 34], [46, 40], [0, 40]], 40),
    { y: L.caseY - 40 }),
]), MAT.ghost, 'case'));

const ctxHeadGeo = () => new THREE.Group().add(mesh(
  place(extrudeY(cylFootprint(0, L.bore / 2), 26, { curveSegments: 9 }), { y: 2 }),
  MAT.ghost, 'head'));

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

const CAT = {
  cyl: 'Xy-lanh & gioăng',
  ring: 'Xéc-măng',
  piston: 'Piston & chốt',
  rod: 'Tay biên',
  ctx: 'Ngữ cảnh (không tháo)',
};

export const PARTS = [
  // ── Xy-lanh & gioăng ───────────────────────────────────────────────────────
  {
    id: 'cylinder', name: 'Xy-lanh (lòng máy)', nameEn: 'Cylinder', qty: 1,
    category: CAT.cyl, build: cylinderGeo,
    info: {
      material: 'Vỏ nhôm đúc + ống lót gang ép',
      spec: `Ø${L.bore} mm · hành trình ${L.stroke} mm · dung tích `
        + `${((Math.PI * (L.bore / 2) ** 2 * L.stroke) / 1000).toFixed(1)} cm³`,
      tolerance: 'Giới hạn mòn ≈ 50,05 mm · đo ở 3 độ cao × 2 phương vuông góc',
      fn: 'Dẫn hướng piston, chặn kín buồng đốt bên, dẫn nhiệt ra không khí qua cánh tản nhiệt.',
      fail: 'Xước dọc (xéc-măng bó hoặc hút bụi do lọc gió hở) · mòn Ô-VAN theo phương '
        + 'vuông góc trục chốt (vì lực ngang từ tay biên nghiêng ép piston về một bên) · '
        + 'dính piston khi thiếu nhớt.',
    },
  },
  {
    id: 'base-gasket', name: 'Gioăng chân xy-lanh', nameEn: 'Cylinder base gasket', qty: 1,
    category: CAT.cyl, build: baseGasketGeo,
    info: {
      material: 'Giấy amiăng / vật liệu đàn', spec: `Dày ${L.gasket.t} mm`,
      fn: 'Làm kín giữa xy-lanh và lốc máy.',
      fail: 'Độ dày gioăng này ảnh hưởng TRỰC TIẾP đến tỉ số nén và pha phối khí. '
        + 'Thay gioăng dày hơn -> giảm tỉ số nén và làm trễ pha cam. Phải dùng đúng loại.',
    },
  },
  {
    id: 'dowels', name: 'Chốt dẫn hướng (2)', nameEn: 'Dowel pins', qty: 2,
    category: CAT.cyl, build: dowelsGeo,
    info: {
      material: 'Thép', spec: `Ø${L.dowel.d} mm`,
      fn: 'ĐỊNH VỊ chính xác xy-lanh so với lốc máy. Bu lông chỉ giữ chặt, KHÔNG định vị — '
        + 'lỗ bu lông luôn lớn hơn thân bu lông.',
      fail: 'Bỏ sót -> xy-lanh lệch tâm -> piston va thành không đều, mòn một phía.',
    },
  },

  // ── Xéc-măng ───────────────────────────────────────────────────────────────
  {
    id: 'ring1', name: 'Xéc-măng khí số 1', nameEn: 'Top compression ring', qty: 1,
    category: CAT.ring, build: ring1Geo,
    info: {
      material: 'Gang hợp kim, mặt ngoài mạ crôm',
      spec: `Khe hở miệng ${L.rings.gapMin}–${L.rings.gapMax} mm (đo TRONG lòng xy-lanh)`,
      tolerance: `Khe hở cạnh trong rãnh ${L.rings.sideMin}–${L.rings.sideMax} mm`,
      fn: 'Chặn áp suất cháy — vòng quyết định áp suất nén đo được. Chịu nhiệt cao nhất.',
      fail: 'Bó kẹp muội than hoặc mất đàn hồi -> nén tụt, khó nổ khi nguội. '
        + 'Khe miệng = 0 -> khi nóng hai đầu đẩy nhau, vòng bó cong và XƯỚC DỌC thành '
        + 'xy-lanh (hư hỏng không sửa được).',
    },
  },
  {
    id: 'ring2', name: 'Xéc-măng khí số 2', nameEn: 'Second compression ring', qty: 1,
    category: CAT.ring, build: ring2Geo,
    info: {
      material: 'Gang, có MẶT VÁT lệch (taper)',
      spec: 'Mặt vát lắp hướng XUỐNG',
      fn: 'Chặn phần áp suất lọt qua vòng 1, đồng thời gạt nhớt xuống.',
      fail: 'Lắp NGƯỢC mặt vát -> vòng bơm nhớt LÊN buồng đốt thay vì gạt xuống -> '
        + 'hao nhớt ngay lập tức. Đây là lỗi lắp phổ biến và rất khó phát hiện sau khi lắp.',
    },
  },
  {
    id: 'oil-rails', name: 'Xéc-măng dầu — 2 vòng gạt', nameEn: 'Oil ring rails', qty: 2,
    category: CAT.ring, build: oilRailsGeo,
    info: {
      material: 'Thép mỏng',
      fn: 'Hai vòng mỏng gạt nhớt trên thành xy-lanh về các-te, chỉ để lại màng cực mỏng.',
      fail: 'Mòn -> hao nhớt, khói xanh. Lắp thiếu một vòng gạt là lỗi hay gặp khi lắp lại.',
    },
  },
  {
    id: 'oil-expander', name: 'Xéc-măng dầu — vòng đàn hồi', nameEn: 'Oil ring expander', qty: 1,
    category: CAT.ring, build: oilExpanderGeo,
    info: {
      material: 'Thép lò xo dạng sóng',
      fn: 'Nằm GIỮA hai vòng gạt, ép chúng ra sát thành xy-lanh. Chính vòng này quyết định '
        + 'xe có hao nhớt hay không — không phải hai vòng gạt.',
      fail: 'Mất đàn hồi -> nhớt không được gạt sạch -> khói xanh, muội than đầy buồng đốt. '
        + 'Lắp lại phải cho vòng đàn hồi VÀO TRƯỚC, rồi mới hai vòng gạt.',
    },
  },

  // ── Piston & chốt ──────────────────────────────────────────────────────────
  {
    id: 'clips', name: 'Khoá chốt piston (2)', nameEn: 'Piston pin clips', qty: 2,
    category: CAT.piston, build: clipsGeo,
    info: {
      material: 'Thép lò xo, hình chữ C',
      fn: 'Chặn chốt piston không dịch ngang để đầu chốt không cào thành xy-lanh.',
      fail: 'Lắp không vào hết rãnh -> bật ra khi máy chạy -> chốt cào xước xy-lanh. '
        + 'BẮT BUỘC THAY MỚI khi tháo. Khoá bật rất mạnh khi tháo và rất dễ rơi vào lốc máy — '
        + 'che miệng lốc máy bằng giẻ trước.',
    },
  },
  {
    id: 'pin', name: 'Chốt piston', nameEn: 'Piston pin', qty: 1,
    category: CAT.piston, build: pinGeo,
    info: {
      material: 'Thép thấm cacbon, ruột rỗng',
      spec: `Ø${L.pin.d} mm · dài ${L.pin.len} mm · kiểu TRÔI TỰ DO`,
      fn: 'Khớp bản lề giữa piston và đầu nhỏ tay biên. "Trôi tự do" nghĩa là nó không ép '
        + 'chặt vào bên nào — quay tự do trong cả piston và bạc tay biên, nên mài mòn đều.',
      fail: 'Mòn ô-van -> tiếng gõ nhẹ "tách tách" theo vòng tua, rõ nhất khi thả ga.',
    },
  },
  {
    id: 'piston', name: 'Piston', nameEn: 'Piston', qty: 1,
    category: CAT.piston, build: pistonGeo,
    info: {
      material: 'Nhôm hợp kim đúc, phủ graphite mặt bên',
      spec: `Ø${(PISTON_R * 2).toFixed(2)} mm · chiều cao nén ${L.pistonCH} mm`,
      tolerance: `Khe hở piston – xy-lanh ${L.piston.clearance * 2} mm (đo ở phương VUÔNG GÓC trục chốt)`,
      fn: 'Nhận áp suất cháy và truyền qua chốt xuống tay biên. Trên đỉnh có mũi/chữ chỉ '
        + 'hướng lắp — lắp ngược chiều làm lệch offset chốt và gây gõ máy.',
      fail: 'Mòn mặt bên (phía "thrust side" mòn nhiều hơn) · vỡ đầu rãnh xéc-măng · '
        + 'cháy dính do nghèo hoặc quá nhiệt.',
    },
  },

  // ── Tay biên ───────────────────────────────────────────────────────────────
  {
    id: 'small-bush', name: 'Bạc đầu nhỏ tay biên', nameEn: 'Small-end bush', qty: 1,
    category: CAT.rod, build: smallBushGeo,
    info: {
      material: 'Đồng thanh', spec: `Dày ${RD.bushT} mm`,
      fn: 'Ổ trượt cho chốt piston.',
      fail: 'Mòn -> gõ đầu piston. Thay được (ép ra ép vào) nhưng phải doa lại đúng khe hở.',
    },
  },
  {
    id: 'rod', name: 'Tay biên (thanh truyền)', nameEn: 'Connecting rod', qty: 1,
    category: CAT.rod, build: rodBodyGeo, stays: true,
    info: {
      material: 'Thép rèn, thân chữ I',
      spec: `Chiều dài tâm–tâm ${L.rodLen} mm · tỉ lệ R/L = ${(CRANK_R / L.rodLen).toFixed(3)}`,
      tolerance: 'Độ đảo đầu to: radial ≤ 0,05 mm · axial 0,10–0,40 mm',
      fn: 'Truyền lực từ piston xuống chốt khuỷu. Tỉ lệ R/L quyết định mức KHÔNG ĐỐI XỨNG '
        + 'của chuyển động piston: gia tốc ở ĐCT lớn hơn ở ĐCD đúng bằng (1+R/L)/(1−R/L).',
      fail: 'Trên xe số, đầu to LIỀN KHỐI với trục khuỷu rời (ép nóng) nên không tháo được '
        + 'bằng tay — độ đảo vượt giới hạn thì phải thay CẢ trục khuỷu hoặc ép lại ở xưởng.',
    },
  },
  {
    id: 'big-bearing', name: 'Ổ bi kim đầu to', nameEn: 'Big-end needle bearing', qty: 1,
    category: CAT.rod, build: bigBearingGeo, stays: true,
    info: {
      material: 'Ổ bi kim thép',
      fn: 'Đỡ đầu to tay biên trên chốt khuỷu với ma sát cực nhỏ. Chịu toàn bộ lực khí cháy.',
      fail: 'Vỡ -> tiếng gõ NẶNG, TRẦM ở dưới máy, rõ khi tải. Kiểm bằng cách lắc đầu to '
        + 'theo phương hướng kính sau khi tháo xy-lanh. Có độ lắc = thay trục khuỷu.',
    },
  },

  // ── Ngữ cảnh ───────────────────────────────────────────────────────────────
  {
    id: 'ctx-crank', name: 'Trục khuỷu (ngữ cảnh)', nameEn: 'Crankshaft',
    qty: 1, category: CAT.ctx, pivot: [0, CRANK_Y, 0], build: ctxCrankGeo,
    info: { material: 'Thép rèn',
      spec: `Bán kính khuỷu ${CRANK_R} mm (= nửa hành trình)`,
      fn: 'Biến chuyển động thẳng thành quay. Chi tiết đầy đủ ở hệ thống 03.' },
  },
  {
    id: 'ctx-case', name: 'Lốc máy (ngữ cảnh)', nameEn: 'Crankcase',
    qty: 1, category: CAT.ctx, build: ctxCaseGeo,
    info: { material: 'Hợp kim nhôm đúc', fn: 'Chi tiết đầy đủ ở hệ thống 03.' },
  },
  {
    id: 'ctx-head', name: 'Đầu bò (ngữ cảnh)', nameEn: 'Cylinder head',
    qty: 1, category: CAT.ctx, build: ctxHeadGeo,
    info: { material: 'Hợp kim nhôm đúc',
      fn: 'Phải tháo trước khi lấy được xy-lanh. Chi tiết đầy đủ ở hệ thống 01.' },
  },
];
