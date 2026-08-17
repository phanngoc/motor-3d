/**
 * layout.js — TOÀN BỘ kích thước của hệ thống xy-lanh – piston – tay biên.
 * Đơn vị: mm. Trục: +Y lên (trục xy-lanh thẳng đứng), +X sang phải, +Z ra sau.
 *
 * VỊ TRÍ TRỤC KHUỶU KHÔNG ĐẶT TAY — nó được SUY RA từ điều kiện:
 *   đỉnh piston ở điểm chết trên phải trùng mặt lắp đầu bò (y = 0)
 *   => crankY = −(chiều cao nén) − R − L
 * Đổi hành trình hay chiều dài tay biên thì trục khuỷu tự dịch theo, và mọi
 * phép kiểm vẫn đúng.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Xéc-măng mô hình là vòng kín, không có khe miệng (khe miệng thật 0,15–0,35 mm
 *    nhỏ hơn độ phân giải nhìn thấy được).
 *  - Váy piston là khối tròn xoay, không có biên dạng ô-van và vát như piston thật.
 *  - Tay biên là khối chữ I rút gọn.
 *  - Đầu to tay biên mô hình tháo rời được, xe thật là trục khuỷu RỜI ép nóng
 *    nên không tháo được bằng tay (đã ghi rõ trong thông tin chi tiết).
 *
 * GIỮ ĐÚNG: cơ cấu thanh truyền – tay quay (nên chuyển động piston KHÔNG đối
 * xứng), hành trình, tỉ số nén, ba rãnh xéc-măng với ba nhiệm vụ khác nhau,
 * chốt piston kiểu trôi tự do.
 */

import { deg } from '../../lib/geom.js';

export const L = {
  bore: 50,
  stroke: 55.6,
  rodLen: 92,          // tâm–tâm
  pistonCH: 20.2,      // chiều cao nén: tâm chốt -> đỉnh piston
  compression: 9.0,    // tỉ số nén

  /**
   * Xy-lanh. CHIỀU CAO KHÔNG ĐẶT TAY: ống lót phải dài hơn
   *   hành trình + khoảng cách từ đỉnh piston tới xéc-măng dưới cùng
   *   = 55,6 + 13,5 = 69,1 mm
   * nếu không thì ở điểm chết dưới xéc-măng dầu tụt ra khỏi ống lót và mất
   * hoàn toàn tác dụng gạt nhớt. Có phép kiểm xác nhận điều này.
   */
  cyl: {
    y0: -78, y1: 0,
    w: 80, d: 74, r: 10,          // bệ ngoài (khớp với đầu bò của hệ thống 01)
    linerT: 3.5,                  // dày ống lót gang
    boltPos: [[31, 28.5], [-31, 28.5], [31, -28.5], [-31, -28.5]],
    boltD: 8,
    tunnel: { x: -32, w: 15, z: 0, d: 42 },
    finCount: 11,
  },

  /** Piston. Gốc toạ độ cục bộ = TÂM CHỐT. */
  piston: {
    clearance: 0.03,              // khe hở piston – lòng xy-lanh (mỗi bên)
    skirtDown: 19,                // váy dài xuống dưới tâm chốt
    crownDish: 1.2,
    pinBoreR: 6.6,
    /** Ba rãnh xéc-măng, tính từ ĐỈNH piston xuống. */
    grooves: [
      { name: 'ring1', top: 4.0, t: 1.2, depth: 2.6 },
      { name: 'ring2', top: 7.4, t: 1.2, depth: 2.6 },
      { name: 'oil', top: 11.0, t: 2.5, depth: 3.0 },
    ],
  },

  /** Xéc-măng. */
  rings: {
    gapMin: 0.15, gapMax: 0.35,   // khe hở miệng đo trong lòng xy-lanh
    sideMin: 0.015, sideMax: 0.050,
  },

  /** Chốt piston kiểu trôi tự do. */
  pin: { d: 13, len: 42, boreR: 4.2 },
  clip: { r: 7.2, wire: 1.1 },

  /** Tay biên. */
  rod: {
    smallR: 10.5, bigR: 17.5,
    webW: 13, webT: 9.5,
    bushT: 2.0,                   // dày bạc đầu nhỏ
    needleT: 3.0,                 // dày ổ bi kim đầu to
  },

  gasket: { t: 0.8 },
  dowel: { d: 8, len: 12, pos: [[34, 0], [-34, 0]] },

  /** Ngữ cảnh. */
  caseY: -94,                     // mặt lắp lốc máy
};

// ── Suy diễn ─────────────────────────────────────────────────────────────────

export const CRANK_R = L.stroke / 2;
/** Suy ra từ điều kiện: đỉnh piston ở ĐCT trùng y = 0. */
export const CRANK_Y = -(L.pistonCH + CRANK_R + L.rodLen);

export const PISTON_R = L.bore / 2 - L.piston.clearance;

/** Vị trí tâm chốt piston theo góc trục khuỷu (độ). */
export function pinY(thetaDeg) {
  const t = deg(thetaDeg);
  return CRANK_Y + CRANK_R * Math.cos(t)
    + Math.sqrt(L.rodLen ** 2 - (CRANK_R * Math.sin(t)) ** 2);
}

/** Đỉnh piston. */
export const crownY = (thetaDeg) => pinY(thetaDeg) + L.pistonCH;

/** Vị trí chốt khuỷu (y, z) theo góc trục khuỷu. */
export function crankPin(thetaDeg) {
  const t = deg(thetaDeg);
  return { y: CRANK_Y + CRANK_R * Math.cos(t), z: CRANK_R * Math.sin(t) };
}

/** Góc nghiêng tay biên (rad, quanh trục X). Dương khi chốt khuỷu lệch về +Z. */
export function rodTilt(thetaDeg) {
  const t = deg(thetaDeg);
  return Math.asin(Math.max(-1, Math.min(1, -(CRANK_R * Math.sin(t)) / L.rodLen)));
}

/** Góc nghiêng tay biên lớn nhất — dùng để kiểm bao hình. */
export const MAX_ROD_TILT = Math.asin(CRANK_R / L.rodLen);

/**
 * Vận tốc piston (m/s) tại góc θ với vòng tua rpm.
 * Lấy vi phân số — chính xác đủ dùng và không phải viết lại công thức khi đổi
 * hình học.
 */
export function pistonVelocity(thetaDeg, rpm) {
  const h = 0.05;
  const dydTheta = (pinY(thetaDeg + h) - pinY(thetaDeg - h)) / (2 * h); // mm/độ
  const degPerSec = rpm * 6;
  return (dydTheta * degPerSec) / 1000;                                 // m/s
}

/** Gia tốc piston (m/s²). */
export function pistonAccel(thetaDeg, rpm) {
  const h = 0.05;
  const d2 = (pinY(thetaDeg + h) - 2 * pinY(thetaDeg) + pinY(thetaDeg - h)) / (h * h);
  const degPerSec = rpm * 6;
  return (d2 * degPerSec * degPerSec) / 1000;                           // m/s²
}

/** Gia tốc quy ra số lần g. */
export const inG = (a) => a / 9.80665;

/**
 * Tỉ lệ gia tốc ĐCT / ĐCD theo công thức giải tích: (1 + R/L) / (1 − R/L).
 * Đây là con số giải thích vì sao tay biên hay đứt ở gần ĐCT.
 */
export const ACCEL_RATIO = (1 + CRANK_R / L.rodLen) / (1 - CRANK_R / L.rodLen);

/** Dung tích công tác (cm³). */
export const DISPLACEMENT = (Math.PI * (L.bore / 2) ** 2 * L.stroke) / 1000;

export const STROKES = ['Nạp', 'Nén', 'Nổ (sinh công)', 'Xả'];
export const strokeIndex = (thetaDeg) => Math.floor((((thetaDeg % 720) + 720) % 720) / 180);

/** Bán kính ngoài của một xéc-măng (bằng lòng xy-lanh, ép sát thành). */
export const ringOuterR = () => L.bore / 2;
