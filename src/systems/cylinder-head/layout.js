/**
 * layout.js — TOÀN BỘ kích thước của hệ thống đầu bò ở một chỗ.
 * Đổi một số ở đây thì hình học và animation đều cập nhật theo (parametric).
 * Đơn vị: mm. Trục: +Y lên, +X sang phải, +Z về phía NẠP (sau xe).
 *
 * Hình học được ĐƠN GIẢN HÓA có ý thức:
 *  - Buồng đốt là mặt cầu lõm, không phải biên dạng squish-band thực.
 *  - Đường nạp/xả là ống tròn thẳng, không uốn cong như bản đúc thật.
 *  - Chiều cao đầu bò hơi lớn hơn tỉ lệ thật để nhìn rõ cơ cấu cò mổ.
 * Cái được GIỮ ĐÚNG: quan hệ ăn khớp, tỉ số đòn cò mổ = 1:1, tỉ số dây cam
 * 2:1, thứ tự tháo lắp, và biên dạng vấu cam (dùng chung hàm với phần tính
 * độ nâng xupap nên animation nhất quán với hình học).
 */

import { deg } from '../../lib/geom.js';

export const L = {
  // ── Động cơ ────────────────────────────────────────────────────────────────
  bore: 50,
  stroke: 55.6,
  rodLen: 92,
  crankR: 55.6 / 2,
  crankY: -140,
  pistonCH: 20.2,        // chiều cao nén: tâm chốt piston -> đỉnh piston
  cylTop: 0,
  cylBottom: -62,

  // ── Đầu bò ─────────────────────────────────────────────────────────────────
  head: {
    w: 80, d: 74, r: 10,        // bề ngoài theo X, Z, bán kính bo góc
    deckY: 0,
    lowerTop: 40,               // thân dưới: buồng đốt, đường nạp/xả, bệ lò xo
    boxTop: 80,                 // đỉnh vách ổ đỡ trục cam
    chamberR: 25,               // bán kính buồng đốt = bán kính lòng xy-lanh
    chamberDepth: 9,
    boltPos: [[31, 28.5], [-31, 28.5], [31, -28.5], [-31, -28.5]],
    boltD: 8,
    tunnel: { x: -32, w: 15, z: 0, d: 42 },     // đường dây cam qua đầu bò
    bulkheads: [[-23, -15], [15, 23]],          // 2 vách ổ đỡ trục cam (khoảng X)
    finCount: 7,
  },
  cover: { y0: 80, h: 12, inset: 1.5 },

  // ── Trục cam ───────────────────────────────────────────────────────────────
  cam: {
    y: 56, z: 0,
    rb: 10.5,               // bán kính vòng cơ sở
    lift: 5.5,              // độ nâng cam
    half: 55,               // nửa góc làm việc của vấu (độ CAM, không phải trục khuỷu)
    shaftR: 7,
    journalR: 9.5,
    x0: -36, x1: 26,
    lobeW: 11,
  },
  // Xe thật dùng 28T/14T. Ta dùng 24T/12T: TỈ SỐ VẪN ĐÚNG 2:1, nhưng nhông nhỏ
  // hơn vừa trong đường dây cam đã đơn giản hóa của mô hình.
  camSprocket: { x: -36.5, w: 6.5, teeth: 24, pitch: 6.35, hubR: 8 },
  crankSprocket: { x: -36.5, w: 6.5, teeth: 12, pitch: 6.35 },
  chainX: -33.25,           // mặt phẳng chạy của dây cam
  chainRoller: 3.1,

  // ── Xupap + cò mổ ──────────────────────────────────────────────────────────
  // pivot / seat / tip đều ở dạng [y, z]
  valves: {
    intake: {
      key: 'i', label: 'NẠP',
      // seat z = +13 / -12: giữ khe giữa 2 bệ xupap ≈ 4 mm (đặt sát nhau thì
      // không còn thịt nhôm giữa 2 bệ — chỗ dễ nứt nhất của đầu bò thật).
      seat: [6, 13], tip: [66.5, 30], headD: 23, stemD: 4.5,
      pivot: [72, 15], padZ: 0,
      lobeX: [3, 14], rockerX: 8.5,
      camCenter: 52.5,          // góc CAM (độ) khi đỉnh vấu chạm con lăn
      guideY: [13, 40],
      springSeatBelowTip: 34,
      retainerBelowTip: 4,
      springOuter: { rMean: 8.0, wire: 1.6, coils: 4.6 },
      springInner: { rMean: 5.2, wire: 1.15, coils: 5.6 },
    },
    exhaust: {
      key: 'e', label: 'XẢ',
      seat: [6, -12], tip: [66.5, -28], headD: 19, stemD: 4.5,
      pivot: [72, -14], padZ: 0,
      lobeX: [-14, -3], rockerX: -8.5,
      camCenter: 307.5,
      guideY: [13, 40],
      springSeatBelowTip: 34,
      retainerBelowTip: 4,
      springOuter: { rMean: 8.0, wire: 1.6, coils: 4.6 },
      springInner: { rMean: 5.2, wire: 1.15, coils: 5.6 },
    },
  },

  rocker: { shaftR: 4, shaftX: [-26, 26], armW: 9, armT: 7 },
  plug: { tip: [6, 9], out: [40, 26], threadD: 10, hexAF: 16 },

  // ── Pha phối khí (độ góc TRỤC KHUỶU; 0 = ĐCT đầu kỳ nạp) ───────────────────
  timing: {
    intakeOpen: -5, intakeClose: 215,     // 220 độ trục khuỷu
    exhaustOpen: 505, exhaustClose: 725,  // 220 độ trục khuỷu
  },
  lash: { intake: 0.05, exhaust: 0.05 },  // khe hở nhiệt (mm)
};

// ── Suy diễn ─────────────────────────────────────────────────────────────────

/** Trục xupap: vector đơn vị (y,z) từ đế xupap hướng lên trên. */
export function valveAxis(v) {
  const dy = v.tip[0] - v.seat[0];
  const dz = v.tip[1] - v.seat[1];
  const len = Math.hypot(dy, dz);
  return { ay: dy / len, az: dz / len, len, cant: Math.atan2(dz / len, dy / len) };
}

/**
 * Hình học cò mổ. Trả về:
 *   dzCam   = khoảng cách Z từ trục cò đến điểm tiếp xúc với vấu cam
 *   dzValve = khoảng cách Z từ trục cò đến đầu vít điều chỉnh
 *   sign    = dấu của góc quay làm con lăn ĐI LÊN
 * Tỉ số đòn = dzValve / dzCam (thiết kế = 1.0).
 */
export function rockerGeom(v) {
  const pz = v.pivot[1];
  const dzCam = v.padZ - pz;          // có dấu
  const dzValve = v.tip[1] - pz;      // có dấu, ngược dấu với dzCam
  // Quay quanh X góc φ: điểm lệch (Δy,Δz) -> Δy' ≈ Δy - Δz·φ  (φ nhỏ)
  // => con lăn đi lên khi  -dzCam·φ > 0  => sign = -sign(dzCam)
  const sign = -Math.sign(dzCam);
  return { dzCam, dzValve, sign, ratio: Math.abs(dzValve / dzCam) };
}

/** Góc (shape-space) để đặt đỉnh vấu: sau khi trục cam quay đến camCenter, đỉnh hướng +Y. */
export const loboNoseAt = (v) => 90 - v.camCenter;

/** Bán kính nhông theo số răng và bước. */
export const pitchRadius = (teeth, pitch) => pitch / (2 * Math.sin(Math.PI / teeth));

export const CAM_PR = pitchRadius(L.camSprocket.teeth, L.camSprocket.pitch);
export const CRANK_PR = pitchRadius(L.crankSprocket.teeth, L.crankSprocket.pitch);

/** Vị trí chốt piston theo góc trục khuỷu (độ). */
export function pistonPinY(thetaDeg) {
  const t = deg(thetaDeg);
  const r = L.crankR, l = L.rodLen;
  return L.crankY + r * Math.cos(t) + Math.sqrt(l * l - (r * Math.sin(t)) ** 2);
}

/** 4 kỳ theo góc trục khuỷu. */
export const STROKES = ['Nạp', 'Nén', 'Nổ (sinh công)', 'Xả'];
export const strokeIndex = (thetaDeg) => Math.floor((((thetaDeg % 720) + 720) % 720) / 180);
