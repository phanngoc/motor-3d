/**
 * layout.js — TOÀN BỘ kích thước của hệ thống bôi trơn.
 * Đơn vị: mm. Trục: +X ra phía phải xe, +Y lên, +Z ra sau.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Biên dạng rôto bơm là đường trochoid gần đúng (sinh bằng công thức), không
 *    phải biên dạng bản vẽ của hãng.
 *  - Đường nhớt trong trục khuỷu và lên đầu bò được vẽ thành ỐNG NHÌN THẤY ĐƯỢC
 *    để theo dõi dòng chảy; trên máy thật chúng là lỗ khoan bên trong khối kim loại.
 *  - Lớp cặn trong bộ lọc li tâm mô hình là vành tròn đều; thực tế cặn đóng
 *    không đều và cứng lại theo thời gian.
 *
 * GIỮ ĐÚNG: bơm bánh răng ăn trong tạo LƯU LƯỢNG (không tạo áp suất — áp suất
 * do sức cản đường ống phía sau sinh ra), tỉ số rôto trong/ngoài, thứ tự các
 * cấp lọc, và việc bộ lọc li tâm MẤT TÁC DỤNG khi đầy cặn.
 */

import { TAU, deg, clamp } from '../../lib/geom.js';

export const L = {
  /** Bơm nhớt kiểu bánh răng ăn trong (trochoid / gerotor). */
  pump: {
    x0: 30, x1: 42,            // bề rộng rôto theo X
    /** Rôto trong n thùy, rôto ngoài n+1 thùy — đó là nguyên lý của bơm này. */
    lobesInner: 5,
    rInner: 13,                // bán kính danh nghĩa rôto trong
    rOuter: 17.5,              // bán kính danh nghĩa rôto ngoài
    ecc: 2.6,                  // độ lệch tâm hai rôto
    bodyR: 25,
    y: -46, z: 28,             // tâm rôto TRONG
    shaftR: 4.5,
    bolts: 3, boltR: 20,
    /** Lưu lượng riêng (cm³ mỗi vòng) — suy ra từ hình học bên dưới. */
  },

  /** Nhông dẫn động bơm, ăn từ trục khuỷu. */
  pumpGear: { teeth: 26, module: 1.2, x0: 44, x1: 51 },
  crankGear: { teeth: 16 },

  /** Bộ lọc li tâm, gắn trên trục khuỷu bên phải. */
  cf: {
    x0: 56, x1: 78,
    rIn: 30, rOut: 34,
    capX: [74, 78],
    /** Độ dày lớp cặn khi buồng lọc đã "hết tác dụng". */
    sludgeMax: 5.0,
  },

  /** Lưới lọc nhớt ở đáy các-te. */
  strainer: { y: -86, w: 52, d: 40, t: 8, x: -6 },

  /** Van an toàn (van xả áp). */
  relief: { y: -14, z: 54, x: 34, r: 6, ballR: 4, springLen: 14 },

  /** Bu lông xả nhớt + que thăm. */
  drain: { y: -96, d: 12, x: 0 },
  dipstick: { x: 46, y: -18, z: -40, len: 46 },

  /** Trục khuỷu (ngữ cảnh) và đầu bò (đích của nhánh nhớt trên). */
  crank: { y: 0, z: 0, r: 12, x0: -40, x1: 86 },
  headY: 122,

  /** Mức nhớt trong các-te. */
  oilLevelY: -74,

  /** Áp suất định mức và ngưỡng mở van an toàn. */
  reliefOpenKpa: 450,
  /** Sức cản danh nghĩa của đường nhớt khi mọi khe hở còn mới. */
  resistNominal: 1.0,
};

// ── Suy diễn: hình học rôto bơm ──────────────────────────────────────────────

/**
 * Biên dạng rôto TRONG (n thùy) — đường epicycloid gần đúng.
 * Trả về mảng điểm [u, v] trong mặt phẳng shape.
 */
export function innerRotorProfile(cu, cv, segs = 220) {
  const n = L.pump.lobesInner;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU;
    const r = L.pump.rInner + L.pump.ecc * Math.cos(n * a);
    pts.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
  }
  return pts;
}

/** Biên dạng lòng rôto NGOÀI (n+1 thùy). */
export function outerRotorProfile(cu, cv, segs = 240) {
  const n = L.pump.lobesInner + 1;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU;
    const r = L.pump.rInner + L.pump.ecc * (1 + Math.cos(n * a)) + 0.4;
    pts.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
  }
  return pts;
}

/** Tâm rôto NGOÀI lệch so với rôto trong đúng độ lệch tâm. */
export const outerCenter = () => ({ y: L.pump.y + L.pump.ecc, z: L.pump.z });

/** Tỉ số tốc độ rôto ngoài / rôto trong = n / (n+1). */
export const ROTOR_RATIO = L.pump.lobesInner / (L.pump.lobesInner + 1);

/** Tỉ số truyền từ trục khuỷu tới bơm. */
export const PUMP_DRIVE_RATIO = L.crankGear.teeth / L.pumpGear.teeth;

/**
 * Lưu lượng riêng của bơm (cm³ mỗi vòng rôto trong).
 * Xấp xỉ: diện tích khoang biến thiên × bề rộng × số thùy.
 */
export const PUMP_CC_PER_REV = (() => {
  const w = (L.pump.x1 - L.pump.x0) / 10;                    // cm
  const dA = (Math.PI * (L.pump.ecc / 10) * (L.pump.rInner / 10) * 2);  // cm²
  return dA * w * 1.0;
})();

/**
 * Lưu lượng bơm (L/phút) theo vòng tua ĐỘNG CƠ.
 * Bơm là bơm THỂ TÍCH: lưu lượng tỉ lệ THUẬN với vòng tua và gần như không phụ
 * thuộc áp suất. Đây là điểm hay bị hiểu sai — bơm không "tạo áp suất".
 */
export function flowLpm(engineRpm, wearFactor = 1) {
  const rotorRpm = engineRpm * PUMP_DRIVE_RATIO;
  const volEff = clamp(1.02 - 0.28 * (wearFactor - 1), 0.4, 1);
  return (PUMP_CC_PER_REV * rotorRpm * volEff) / 1000;
}

/**
 * Áp suất nhớt (kPa) — do SỨC CẢN của đường nhớt phía sau sinh ra, không do bơm.
 * `resist` > 1 nghĩa là đường nhớt cản nhiều hơn (khe hở ổ đỡ còn mới, nhớt đặc);
 * `resist` < 1 nghĩa là khe hở đã rộng ra vì mòn -> nhớt chảy thoát dễ -> ÁP TỤT
 * dù lưu lượng bơm vẫn thế. Đó là lý do "gõ đầu bò khi không tải".
 */
export function pressureKpa(engineRpm, resist = 1, wearFactor = 1) {
  const q = flowLpm(engineRpm, wearFactor);
  const raw = 62 * q * resist;
  // Van an toàn cắt phần vượt ngưỡng
  return Math.min(raw, L.reliefOpenKpa);
}

export const reliefOpen = (engineRpm, resist, wear) =>
  62 * flowLpm(engineRpm, wear) * resist > L.reliefOpenKpa;

/**
 * Hiệu quả lọc của bộ lọc li tâm theo độ dày lớp cặn.
 * Cặn dày lên thì thể tích buồng còn lại giảm, dòng nhớt đi qua nhanh hơn, hạt
 * bẩn không kịp bị ném ra thành -> hiệu quả giảm dần về 0.
 */
export function filterEfficiency(sludge) {
  const t = clamp(sludge / L.cf.sludgeMax, 0, 1);
  return clamp(1 - t * t * (3 - 2 * t), 0, 1);
}

/** Quãng đường đã chạy (km) suy ra từ độ dày cặn — để hiện cho dễ hình dung. */
export const sludgeToKm = (sludge) => Math.round((sludge / L.cf.sludgeMax) * 15000);

// ── Đường đi của nhớt ────────────────────────────────────────────────────────

/**
 * Đường nhớt, dạng danh sách chặng. Mỗi chặng là một đoạn polyline trong không
 * gian (x, y, z). Dòng chảy được vẽ bằng các hạt chạy dọc theo chuỗi này.
 */
export const OIL_PATH = [
  ['Các-te', [L.strainer.x, L.oilLevelY - 8, 0]],
  ['Lưới lọc', [L.strainer.x, L.strainer.y + 4, 0]],
  ['Ống hút', [L.pump.x0 - 6, L.strainer.y + 4, L.pump.z * 0.4]],
  ['Bơm nhớt', [(L.pump.x0 + L.pump.x1) / 2, L.pump.y, L.pump.z]],
  ['Ống đẩy', [L.cf.x0 - 6, L.pump.y + 16, L.pump.z * 0.5]],
  ['Lọc li tâm', [(L.cf.x0 + L.cf.x1) / 2, L.crank.y - L.cf.rIn + 6, 0]],
  ['Đường khoan trục khuỷu', [L.cf.x0 - 10, L.crank.y, 0]],
  ['Ổ bi đầu to', [0, L.crank.y + 20, 0]],
  ['Nhánh lên đầu bò', [-14, 60, 0]],
  ['Trục cam & cò mổ', [-14, L.headY, 0]],
];

export const oilPathPoints = () => OIL_PATH.map(([, p]) => p);
export const oilPathNames = () => OIL_PATH.map(([n]) => n);
