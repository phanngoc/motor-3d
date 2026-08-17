/**
 * layout.js — TOÀN BỘ kích thước của hệ thống trục khuỷu & lốc máy.
 * Đơn vị: mm. Trục: +X ra phía PHẢI xe (phía bộ nồi), +Y lên, +Z ra sau.
 * Mặt lắp hai nửa lốc máy nằm tại x = 0.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Hai nửa lốc máy là vỏ mỏng (vách đầu + thành bao + vành mặt lắp), không có
 *    toàn bộ gân và bệ đỡ như bản đúc thật.
 *  - Má khuỷu là đĩa tròn có phần đối trọng, không phải biên dạng đúc thật.
 *  - Ổ bi mô hình vòng trong/vòng ngoài + viên bi, không có vòng cách.
 *
 * GIỮ ĐÚNG: trục khuỷu RỜI (má + chốt + tay biên là một khối không tháo được),
 * thứ tự lắp phớt–ổ bi, mặt lắp vuông góc trục nên bắt buộc phải TÁCH lốc máy,
 * và bài toán CÂN BẰNG của động cơ một xy-lanh (xem cân bằng bên dưới).
 */

import { deg, clamp } from '../../lib/geom.js';

export const L = {
  stroke: 55.6,
  rodLen: 92,
  pistonCH: 20.2,
  bore: 50,

  /** Trục khuỷu — bố trí dọc trục từ trái sang phải. */
  crank: {
    journalR: 12,
    webR: 38,
    webT: 12,
    pinR: 14,
    /** Các đoạn theo X (từ trái sang phải). */
    flyTaper: [-66, -52],
    sealLeft: [-52, -46],
    bearLeft: [-46, -34],
    camSprocket: [-33, -26],
    webLeft: [-24, -12],
    pin: [-12, 12],
    webRight: [12, 24],
    bearRight: [27, 39],
    sealRight: [39, 45],
    clutchTaper: [45, 61],
  },

  /** Nhông dẫn động dây cam trên trục khuỷu. */
  camSprocket: { teeth: 12, pitch: 6.35 },

  /** Ổ bi cầu đỡ trục khuỷu. */
  bearing: { rIn: 12, rOut: 26, w: 12, balls: 9 },

  /** Phớt chặn nhớt. */
  seal: { rIn: 12, rOut: 19, w: 6 },

  /** Bánh đà / rôto mâm lửa. */
  flywheel: { x0: -80, x1: -58, rOut: 52, rIn: 14, magnetR: 44 },
  key: { len: 12, w: 3.6, h: 2.4 },
  flyNut: { af: 19, x: -80 },

  /** Lốc máy: vỏ mỏng, mặt lắp tại x = 0. */
  case: {
    w: 152, d: 132, r: 22, cy: -10,      // biên dạng ngoài, tâm hạ xuống -10
    wallT: 7,
    leftX: -50, rightX: 50,              // vách đầu ngoài cùng
    flangeT: 5,
    boltCount: 10, boltR: 62,
    dowels: [[42, 34], [-46, -30]],      // (y, z) của 2 chốt định vị
  },

  strainer: { y: -74, w: 54, d: 44, t: 8 },
  drain: { y: -84, d: 12 },

  /** Ngữ cảnh. */
  cylY: [8, 74],
};

// ── Suy diễn ─────────────────────────────────────────────────────────────────

export const CRANK_R = L.stroke / 2;
export const CAM_PR = L.camSprocket.pitch / (2 * Math.sin(Math.PI / L.camSprocket.teeth));

/** Vị trí tâm chốt piston theo góc trục khuỷu, tính từ tâm trục khuỷu. */
export function pinYFromCrank(thetaDeg) {
  const t = deg(thetaDeg);
  return CRANK_R * Math.cos(t) + Math.sqrt(L.rodLen ** 2 - (CRANK_R * Math.sin(t)) ** 2);
}

/** Vị trí chốt khuỷu (y, z). */
export function crankPin(thetaDeg) {
  const t = deg(thetaDeg);
  return { y: CRANK_R * Math.cos(t), z: CRANK_R * Math.sin(t) };
}

/** Góc nghiêng tay biên (rad, quanh X). */
export function rodTilt(thetaDeg) {
  const t = deg(thetaDeg);
  return Math.asin(clamp(-(CRANK_R * Math.sin(t)) / L.rodLen, -1, 1));
}

/** Gia tốc piston (m/s²) — lấy vi phân số trên chính hàm vị trí đang dùng để vẽ. */
export function pistonAccel(thetaDeg, rpm) {
  const h = 0.05;
  const d2 = (pinYFromCrank(thetaDeg + h) - 2 * pinYFromCrank(thetaDeg)
    + pinYFromCrank(thetaDeg - h)) / (h * h);
  const dps = rpm * 6;
  return (d2 * dps * dps) / 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// BÀI TOÁN CÂN BẰNG CỦA ĐỘNG CƠ MỘT XY-LANH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Khối lượng chuyển động qua lại (piston + xéc-măng + chốt + ~1/3 tay biên).
 * Giá trị tham khảo cho lớp động cơ 110 cm³.
 */
export const RECIP_MASS = 0.20;   // kg

/**
 * Lực mất cân bằng còn lại, theo góc trục khuỷu và HỆ SỐ CÂN BẰNG k.
 *
 * Lực quán tính của khối chuyển động qua lại (theo phương ĐỨNG, tức trục xy-lanh):
 *   F_qt = m·ω²·R·( cosθ + (R/L)·cos2θ )
 * Đối trọng trên má khuỷu quay cùng trục, lực li tâm của nó luôn hướng NGƯỢC
 * chốt khuỷu, nên có CẢ hai thành phần:
 *   F_đt,đứng  = −k·m·ω²·R·cosθ
 *   F_đt,ngang = −k·m·ω²·R·sinθ
 *
 * Cộng lại:
 *   đứng  = m·ω²·R·[ (1−k)·cosθ + (R/L)·cos2θ ]
 *   ngang = −k·m·ω²·R·sinθ
 *
 * Đọc hai dòng trên là thấy ngay điều then chốt: <b>muốn triệt lực đứng thì phải
 * tăng k, nhưng tăng k lại sinh ra lực NGANG</b>. Không có giá trị k nào làm cả
 * hai bằng 0. Đó là lý do động cơ một xy-lanh không thể cân bằng hoàn toàn, và
 * độ rung còn lại là ĐẶC TÍNH chứ không phải lỗi.
 */
export function unbalancedForce(thetaDeg, rpm, k) {
  const w = (rpm * 2 * Math.PI) / 60;           // rad/s
  const R = CRANK_R / 1000;                      // m
  const base = RECIP_MASS * w * w * R;           // N
  const t = deg(thetaDeg);
  const ratio = CRANK_R / L.rodLen;
  return {
    vertical: base * ((1 - k) * Math.cos(t) + ratio * Math.cos(2 * t)),
    horizontal: -base * k * Math.sin(t),
    base,
  };
}

/** Biên độ lớn nhất của từng thành phần khi quét cả vòng. */
export function forcePeaks(rpm, k) {
  let v = 0, h = 0, tot = 0;
  for (let th = 0; th < 360; th += 1) {
    const f = unbalancedForce(th, rpm, k);
    v = Math.max(v, Math.abs(f.vertical));
    h = Math.max(h, Math.abs(f.horizontal));
    tot = Math.max(tot, Math.hypot(f.vertical, f.horizontal));
  }
  return { v, h, tot };
}

/** Hệ số cân bằng làm TỔNG lực mất cân bằng nhỏ nhất (quét số). */
export function bestBalanceFactor(rpm = 5000) {
  let best = 0, bestVal = Infinity;
  for (let k = 0; k <= 1.0001; k += 0.005) {
    const { tot } = forcePeaks(rpm, k);
    if (tot < bestVal) { bestVal = tot; best = k; }
  }
  return { k: best, peak: bestVal };
}

export const STROKES = ['Nạp', 'Nén', 'Nổ (sinh công)', 'Xả'];
export const strokeIndex = (thetaDeg) => Math.floor((((thetaDeg % 720) + 720) % 720) / 180);
