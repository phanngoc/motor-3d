/**
 * geom.js — Thư viện hình học tham số hóa ("CAD kernel" thu nhỏ).
 *
 * QUY ƯỚC TRỤC (toàn bộ project dùng chung, đơn vị = mm):
 *   +Y  = hướng lên (trục xy-lanh thẳng đứng)
 *   +X  = sang phải theo hướng xe (trục cam và các trục hộp số nằm theo X)
 *   +Z  = về phía sau xe  -> phía NẠP (intake)
 *   -Z  = về phía trước xe -> phía XẢ (exhaust)
 *
 * QUY ƯỚC EXTRUDE:
 *   extrudeY(shape, h): shape(u,v) -> world(x=u, z=v), kéo theo +Y, span y∈[0,h]
 *   extrudeX(shape, l): shape(u,v) -> world(z=-u, y=v), kéo theo +X, span x∈[0,l]
 *
 * QUY ƯỚC LATHE:
 *   profile là mảng [[r, y], ...] duyệt NGƯỢC CHIỀU KIM ĐỒNG HỒ trong mặt phẳng
 *   (r, y) với vật liệu ở bên trong. Với hình trụ đơn giản thì chỉ cần xếp từ
 *   dưới lên trên. Bắt đầu/kết thúc tại r=0 để khối kín.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;
export const deg = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE 2D
// ─────────────────────────────────────────────────────────────────────────────

/** Hình chữ nhật bo góc, tâm tại (cu, cv). */
export function roundedRect(w, h, r = 0, cu = 0, cv = 0) {
  const s = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  r = Math.min(r, hw, hh);
  s.moveTo(cu - hw + r, cv - hh);
  s.lineTo(cu + hw - r, cv - hh);
  if (r > 0) s.absarc(cu + hw - r, cv - hh + r, r, -Math.PI / 2, 0, false);
  s.lineTo(cu + hw, cv + hh - r);
  if (r > 0) s.absarc(cu + hw - r, cv + hh - r, r, 0, Math.PI / 2, false);
  s.lineTo(cu - hw + r, cv + hh);
  if (r > 0) s.absarc(cu - hw + r, cv + hh - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(cu - hw, cv - hh + r);
  if (r > 0) s.absarc(cu - hw + r, cv - hh + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}

/** Shape hình tròn. */
export function circleShape(r, cu = 0, cv = 0) {
  const s = new THREE.Shape();
  s.absarc(cu, cv, r, 0, TAU, false);
  return s;
}

/** Khoét lỗ tròn vào một shape (dùng cho lỗ bu lông, lỗ xupap, lỗ vấu cài then...). */
export function bore(shape, r, cu = 0, cv = 0) {
  const h = new THREE.Path();
  h.absarc(cu, cv, r, 0, TAU, true);
  shape.holes.push(h);
  return shape;
}

/** Khoét lỗ hình chữ nhật bo góc. */
export function slot(shape, w, h, r, cu = 0, cv = 0) {
  const p = roundedRect(w, h, r, cu, cv);
  shape.holes.push(new THREE.Path(p.getPoints(32).reverse()));
  return shape;
}

/** Hình vành khăn cắt khúc (dùng cho móng gà, then hoa...). */
export function annularSector(rI, rO, a0, a1) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rO, a0, a1, false);
  s.absarc(0, 0, rI, a1, a0, true);
  s.closePath();
  return s;
}

/**
 * Biên dạng vấu cam (cam lobe).
 * r(t) = rb + lift · bump(t), bump là hàm trơn -> vấu hình quả trứng đúng nghĩa.
 * @param noseAtDeg góc (shape-space) mà đỉnh vấu hướng tới
 */
export function camLobeShape(rb, lift, halfDeg, noseAtDeg = 90, segs = 180) {
  const s = new THREE.Shape();
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * 360;
    const r = camRadius(a - noseAtDeg, rb, lift, halfDeg);
    const u = r * Math.cos(deg(a));
    const v = r * Math.sin(deg(a));
    if (i === 0) s.moveTo(u, v); else s.lineTo(u, v);
  }
  s.closePath();
  return s;
}

/**
 * Bán kính vấu cam tại góc lệch `t` (độ) so với đỉnh vấu.
 * DÙNG CHUNG cho cả hình học VÀ hàm tính độ nâng xupap -> animation nhất quán
 * với hình học, không thể có chuyện "hình một dạng, số một dạng".
 */
export function camRadius(t, rb, lift, halfDeg) {
  const a = (((t % 360) + 540) % 360) - 180; // -180..180
  if (Math.abs(a) >= halfDeg) return rb;
  const x = a / halfDeg; // -1..1
  const bump = Math.pow(Math.cos((Math.PI * x) / 2), 1.55);
  return rb + lift * bump;
}

/** Độ nâng cam tại góc lệch t (mm). */
export const camLift = (t, rb, lift, halfDeg) => camRadius(t, rb, lift, halfDeg) - rb;

/** Biên dạng nhông (sprocket) cho dây cam — hốc lõm theo bán kính con lăn. */
export function sprocketShape(teeth, pitch, rollerR, hubR = 0, { cu = 0, cv = 0 } = {}) {
  const pr = pitch / (2 * Math.sin(Math.PI / teeth)); // bán kính vòng chia
  const s = new THREE.Shape();
  const per = 24; // điểm mỗi răng
  for (let i = 0; i < teeth; i++) {
    for (let j = 0; j < per; j++) {
      const a = ((i + j / per) / teeth) * TAU;
      const local = (j / per) * (TAU / teeth);
      const half = TAU / teeth / 2;
      const d = Math.abs(local - half) / half; // 0 tại đỉnh răng .. 1 tại hốc
      const r = pr + rollerR * 0.62 * (1 - d * d) - rollerR * 0.5;
      const u = cu + r * Math.cos(a), v = cv + r * Math.sin(a);
      if (i === 0 && j === 0) s.moveTo(u, v); else s.lineTo(u, v);
    }
  }
  s.closePath();
  if (hubR > 0) bore(s, hubR, cu, cv);
  return { shape: s, pitchRadius: pr };
}

/**
 * Bánh răng trụ răng thẳng (gần đúng, biên dạng dạng thang).
 * Trả về { shape, pitchRadius, rootRadius, tipRadius } để chỗ gọi kiểm được
 * va chạm mà không phải tự tính lại.
 */
export function gearShape(teeth, module_, boreR = 0,
  { addendum = 1, dedendum = 1.25, phase = 0, cu = 0, cv = 0 } = {}) {
  const pr = (module_ * teeth) / 2;
  const ra = pr + module_ * addendum;
  const rd = pr - module_ * dedendum;
  const s = new THREE.Shape();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step + phase;
    const pts = [
      [rd, 0.02], [pr, 0.10], [ra, 0.23], [ra, 0.37],
      [pr, 0.50], [rd, 0.58], [rd, 0.96],
    ];
    for (const [r, f] of pts) {
      const a = a0 + step * f;
      const u = cu + r * Math.cos(a), v = cv + r * Math.sin(a);
      if (i === 0 && f === 0.02) s.moveTo(u, v); else s.lineTo(u, v);
    }
  }
  s.closePath();
  if (boreR > 0) bore(s, boreR, cu, cv);
  return { shape: s, pitchRadius: pr, rootRadius: rd, tipRadius: ra };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRUDE
// ─────────────────────────────────────────────────────────────────────────────

/** Kéo shape theo +Y. shape(u,v) -> world(x=u, z=v). span y∈[0, height]. */
export function extrudeY(shape, height, opts = {}) {
  const g = extrudeCore(shape, height, opts);
  g.rotateX(Math.PI / 2);
  g.translate(0, height, 0);
  return g;
}

/** Kéo shape theo +X. shape(u,v) -> world(z=-u, y=v). span x∈[0, length]. */
export function extrudeX(shape, length, opts = {}) {
  const g = extrudeCore(shape, length, opts);
  g.rotateY(Math.PI / 2);
  return g;
}

// curveSegments = số đoạn xấp xỉ mỗi CUNG trong shape. Mặc định để thấp vì các
// chi tiết ở đây nhiều lỗ / nhiều cạnh; chi tiết nào cần trơn thì truyền cao hơn.
function extrudeCore(shape, total, { bevel = 0, bevelSegments = 1, curveSegments = 12, steps = 1 } = {}) {
  const bt = Math.min(bevel, total / 4);
  const depth = total - 2 * bt;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, steps, curveSegments,
    bevelEnabled: bt > 0, bevelThickness: bt, bevelSize: bt, bevelOffset: 0, bevelSegments,
  });
  if (bt > 0) g.translate(0, 0, bt);
  g.computeVertexNormals();
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// KHỐI TRÒN XOAY
// ─────────────────────────────────────────────────────────────────────────────

/** Xoay profile [[r, y], ...] quanh trục Y. */
export function lathe(profile, segs = 48) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-5), y));
  const g = new THREE.LatheGeometry(pts, segs);
  g.computeVertexNormals();
  return g;
}

/** Trục / trụ đặc: span y∈[y0, y1]. */
export function rod(r, y0, y1, segs = 32) {
  return lathe([[0, y0], [r, y0], [r, y1], [0, y1]], segs);
}

/** Ống rỗng (bạc, ống dẫn hướng, phớt): có lỗ suốt. */
export function tubeSolid(rOuter, rInner, y0, y1, segs = 32) {
  return lathe([[rInner, y0], [rOuter, y0], [rOuter, y1], [rInner, y1], [rInner, y0]], segs);
}

/** Vòng đệm / long đen phẳng. */
export const washer = (rO, rI, t) => tubeSolid(rO, rI, 0, t);

/** Lăng trụ lục giác (đầu bu lông / đai ốc). Trục theo Y, span [0, h]. */
export function hexPrism(acrossFlats, h, boreR = 0) {
  const R = acrossFlats / Math.sqrt(3); // bán kính đỉnh
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = deg(30) + (i / 6) * TAU;
    const u = R * Math.cos(a), v = R * Math.sin(a);
    i === 0 ? s.moveTo(u, v) : s.lineTo(u, v);
  }
  s.closePath();
  if (boreR > 0) bore(s, boreR);
  return extrudeY(s, h, { bevel: acrossFlats * 0.06, curveSegments: 6 });
}

/**
 * Bu lông: đầu lục giác + thân + ren (mô phỏng bằng xoắn ốc).
 * Trục theo Y, đầu bu lông ở trên (y∈[len, len+headH]), thân xuống y=0.
 */
export function boltGeo(d, len, { headAF = null, headH = null, threadLen = null, flange = 0 } = {}) {
  const af = headAF ?? d * 1.6;
  const hh = headH ?? d * 0.65;
  const tl = threadLen ?? Math.min(len, d * 3.2);
  const parts = [rod(d / 2, 0, len, 20)];
  parts.push(hexPrism(af, hh).translate(0, len, 0));
  if (flange > 0) parts.push(washer(af * 0.62, d / 2, flange).translate(0, len, 0));
  parts.push(threadHelix(d / 2, d * 0.09, tl, d * 0.42, 0));
  // union() chuẩn hóa indexed/non-indexed trước khi gộp — mergeGeometries thô
  // sẽ thất bại vì rod/washer là indexed còn hexPrism (extrude) thì không.
  return union(parts);
}

/** Ren dạng xoắn ốc (chỉ để nhìn, không dùng để chế tạo). */
export function threadHelix(r, wire, length, pitch, y0 = 0) {
  const turns = Math.max(1, Math.floor(length / pitch));
  const pts = [];
  const n = turns * 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * TAU;
    pts.push(new THREE.Vector3(r * Math.cos(a), y0 + t * length, r * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, wire, 6, false);
}

/** Lò xo trụ xoắn (lò xo xupap). Trục Y, span [0, length]. */
export function coilSpring(rMean, wire, coils, length, segs = 12) {
  const pts = [];
  const n = Math.round(coils * segs);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * coils * TAU;
    // hai đầu ép phẳng (closed ends) -> bước nhỏ ở đầu/cuối
    const ease = Math.min(1, Math.min(t, 1 - t) / 0.12);
    const rr = rMean * (0.94 + 0.06 * ease);
    pts.push(new THREE.Vector3(rr * Math.cos(a), t * length, rr * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 8, false);
}

/** Then hoa (spline) — dùng cho trục và lỗ then hoa của cài then. */
export function splineShape(rOuter, teeth, depth, boreR = 0) {
  const s = new THREE.Shape();
  const per = 6;
  for (let i = 0; i < teeth; i++) {
    for (let j = 0; j < per; j++) {
      const f = (i + j / per) / teeth;
      const a = f * TAU;
      const local = j / per;
      const r = local < 0.5 ? rOuter : rOuter - depth;
      const u = r * Math.cos(a), v = r * Math.sin(a);
      if (i === 0 && j === 0) s.moveTo(u, v); else s.lineTo(u, v);
    }
  }
  s.closePath();
  if (boreR > 0) bore(s, boreR);
  return s;
}

/**
 * TRỐNG SỐ: hình trụ có các RÃNH XOẮN THẬT (không phải vẽ giả).
 * Bán kính thay đổi theo (θ, x): bằng rGroove trong phạm vi rãnh, bằng rOuter
 * ở ngoài. Mặt trong rãnh và hai vách rãnh đều là mặt thật của khối, nên nhìn
 * vào là thấy đúng cơ cấu.
 *
 * Trục theo X, span x∈[0, length]. θ=0 -> +Y, θ=90° -> +Z.
 * @param grooves [{ xAt(thetaDeg) -> vị trí tâm rãnh (mm), width }]
 */
export function groovedDrum({ length, rOuter, rGroove, grooves, nTheta = 168, nX = 96 }) {
  const pos = [];
  const idx = [];
  const rAt = (thetaDeg, x) => {
    for (const g of grooves) if (Math.abs(x - g.xAt(thetaDeg)) < g.width / 2) return rGroove;
    return rOuter;
  };
  for (let i = 0; i <= nX; i++) {
    const x = (i / nX) * length;
    for (let j = 0; j <= nTheta; j++) {
      const th = (j / nTheta) * 360;
      const r = rAt(th, x);
      const a = deg(th);
      pos.push(x, r * Math.cos(a), r * Math.sin(a));
    }
  }
  const w = nTheta + 1;
  // Thứ tự (a,b,c) = ((i,j),(i,j+1),(i+1,j)) cho pháp tuyến hướng RA NGOÀI.
  for (let i = 0; i < nX; i++) {
    for (let j = 0; j < nTheta; j++) {
      const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  // Hai mặt đáy (rãnh không được chạm tới hai đầu)
  for (const [x, sign] of [[0, -1], [length, 1]]) {
    const base = pos.length / 3;
    pos.push(x, 0, 0);
    for (let j = 0; j <= nTheta; j++) {
      const a = deg((j / nTheta) * 360);
      pos.push(x, rOuter * Math.cos(a), rOuter * Math.sin(a));
    }
    for (let j = 0; j < nTheta; j++) {
      const p = base + 1 + j, q = base + 1 + j + 1;
      sign < 0 ? idx.push(base, p, q) : idx.push(base, q, p);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Cánh tản nhiệt: n cánh mỏng xếp theo Y. */
export function finStack(shapeFn, { count, y0, spacing, thickness }) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = extrudeY(shapeFn(i, count), thickness, { bevel: thickness * 0.2 });
    g.translate(0, y0 + i * spacing, 0);
    parts.push(g);
  }
  return union(parts);
}

// ─────────────────────────────────────────────────────────────────────────────
// XÍCH / DÂY CAM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Đường chạy của xích quanh 2 nhông (bài toán dây đai 2 puly, tiếp tuyến ngoài).
 * Làm việc trong mặt phẳng (a, b) = (z, y). Trả về { samples, length, segs, pitchAt }.
 */
export function twoPulleyLoop(c1, r1, c2, r2, samplesPerMm = 0.5) {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
  const baseAng = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  const alpha = Math.acos(clamp((r1 - r2) / d, -1, 1)); // góc tiếp tuyến ngoài
  const aP = baseAng + alpha; // góc tiếp điểm "bên dương"
  const aM = baseAng - alpha; // góc tiếp điểm "bên âm"
  // Vòng kín: cung bao mặt XA của nhông 1 -> tiếp tuyến xuống nhông 2
  //        -> cung bao mặt XA của nhông 2 -> tiếp tuyến quay về nhông 1
  const segs = [
    { type: 'arc', c: c1, r: r1, a0: aP, a1: aM + TAU },
    { type: 'line', p: ptOn(c1, r1, aM), q: ptOn(c2, r2, aM) },
    { type: 'arc', c: c2, r: r2, a0: aM, a1: aP },
    { type: 'line', p: ptOn(c2, r2, aP), q: ptOn(c1, r1, aP) },
  ];
  let length = 0;
  for (const s of segs) {
    s.len = s.type === 'line'
      ? Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1])
      : Math.abs(s.a1 - s.a0) * s.r;
    length += s.len;
  }
  const n = Math.max(24, Math.round(length * samplesPerMm));
  const samples = [];
  for (let i = 0; i < n; i++) samples.push(sampleLoop(segs, length, (i / n) * length));
  return { samples, length, segs, pitchAt: (s) => sampleLoop(segs, length, s) };
}

function ptOn(c, r, a) { return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; }

function sampleLoop(segs, total, s) {
  s = ((s % total) + total) % total;
  for (const seg of segs) {
    if (s <= seg.len || seg === segs[segs.length - 1]) {
      const t = clamp(s / seg.len, 0, 1);
      if (seg.type === 'line') {
        const a = lerp(seg.p[0], seg.q[0], t), b = lerp(seg.p[1], seg.q[1], t);
        const dx = seg.q[0] - seg.p[0], dy = seg.q[1] - seg.p[1];
        const L = Math.hypot(dx, dy) || 1;
        return { a, b, ta: dx / L, tb: dy / L };
      }
      const ang = lerp(seg.a0, seg.a1, t);
      const dir = Math.sign(seg.a1 - seg.a0) || 1;
      return {
        a: seg.c[0] + seg.r * Math.cos(ang),
        b: seg.c[1] + seg.r * Math.sin(ang),
        ta: -Math.sin(ang) * dir, tb: Math.cos(ang) * dir,
      };
    }
    s -= seg.len;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gộp nhiều geometry thành 1 (giảm draw call).
 * mergeGeometries() đòi hỏi MỌI geometry cùng tập attribute VÀ cùng trạng thái
 * indexed. ExtrudeGeometry là non-indexed còn Lathe/Tube là indexed, nên ta
 * chuẩn hóa tất cả về non-indexed trước khi gộp.
 */
export function union(...geos) {
  const flat = geos.flat().filter(Boolean).map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) {
    for (const k of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      const c = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c * 2), 2));
    }
    g.groups = [];
  }
  if (flat.length === 1) return flat[0];
  const merged = mergeGeometries(flat, false);
  if (!merged) throw new Error('union(): mergeGeometries thất bại — kiểm tra attribute không đồng bộ');
  return merged;
}

/**
 * Mesh tiện lợi + đặt tên.
 * Chi tiết gần trong suốt (vd nhóm ngữ cảnh) không đổ bóng: Three.js đổ bóng
 * đầy đủ cho vật liệu transparent, sẽ làm tối các chi tiết phía sau.
 */
export function mesh(geo, mat, name = '') {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  const solid = !mat.transparent || mat.opacity > 0.5;
  m.castShadow = solid;
  m.receiveShadow = solid;
  return m;
}

/** Nhân bản geometry theo các vị trí cho trước rồi gộp lại. */
export function pattern(geoFactory, positions) {
  return union(positions.map((p, i) => {
    const g = geoFactory(i, p).clone();
    g.translate(p[0], p[1], p[2]);
    return g;
  }));
}

/** Xoay geometry rồi dịch chuyển (rotate trước, translate sau). */
export function place(geo, { rx = 0, ry = 0, rz = 0, x = 0, y = 0, z = 0 } = {}) {
  const g = geo.clone();
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}
