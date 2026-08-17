/**
 * layout.js — TOÀN BỘ kích thước và MÔ HÌNH ĐỘNG LỰC HỌC của khung sườn, hệ
 * thống treo, truyền động cuối và phanh.
 *
 * Đơn vị: mm. Trục: +Y lên (mặt đất y = 0), +X phải, +Z ra SAU xe.
 * Nên bánh trước ở z ÂM, bánh sau ở z DƯƠNG.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Khung sườn vẽ thành các ống thẳng theo đúng đường trục, không có gân và bát
 *    hàn như khung thật.
 *  - Nan hoa vẽ thẳng theo bán kính, không bắt chéo như bánh xe thật.
 *  - Giảm chấn thuỷ lực vẽ vỏ ngoài; bên trong không dựng van và lỗ tiết lưu.
 *  - Lốp vẽ thành hình xuyến trơn, không có gai.
 *
 * GIỮ ĐÚNG, và đây là phần đáng học nhất:
 *  - CHUYỂN TẢI KHI PHANH: phanh làm dồn tải lên bánh trước, nên phanh trước có
 *    thể dùng nhiều lực hơn phanh sau rất nhiều (xem `brakingSolution`).
 *  - TỰ CƯỜNG HOÁ của phanh cơ (má dẫn): làm phanh cơ nhạy quá mức với hệ số ma
 *    sát, nên vừa dễ bó vừa mất nhiều lực khi ướt.
 *  - ĐỘ VÕNG SÊN không phải con số tuỳ ý: nó suy ra ĐÚNG từ cung quay của gắp sau
 *    (xem `chainLengthAt` và phép kiểm tương ứng).
 */

import { deg, clamp, lerp } from '../../lib/geom.js';

export const L = {
  /** Bánh xe và lốp. */
  wheelF: { z: -560, r: 279, rimR: 216, tyreW: 70, hubR: 42, spokes: 18 },
  wheelR: { z: 665, r: 283, rimR: 216, tyreW: 80, hubR: 52, spokes: 18 },

  /** Khối tâm xe + người (đã ngồi lên). Đây là hai số quyết định mọi thứ về phanh. */
  cg: { y: 620, z: 100 },
  mass: 250,            // kg, cả xe + người + hàng

  /**
   * Khung sườn kiểu xương sống.
   * Chỉ khai báo độ CAO của ống cổ; toạ độ Z của nó được SUY RA từ hình học lái
   * (xem `steerAxisZ`), nên góc trục lái, độ lệch càng và vị trí trục bánh trước
   * không thể mâu thuẫn nhau.
   */
  frame: {
    headY: [700, 880],
    spineTo: [520, 210],
    downTo: [200, -140],
    cradleTo: [180, 250],
    seatFrom: [520, 210], seatTo: [640, 640],
    tubeR: 17,
  },

  /** Góc nghiêng trục lái và độ lệch càng — quyết định độ ổn định hướng. */
  steer: { rakeDeg: 26.5, offset: 53 },

  /** Càng trước (phuộc ống lồng). */
  fork: {
    topY: 880, axleY: 279,
    outerR: 16, innerR: 13.5,
    spanX: 92,                       // khoảng cách hai ống
    travel: 100,
    /** Độ cứng TỔNG của cả hai ống (N/mm). */
    rate: 37.5,
    springTurns: 14,
  },
  triple: { y: 862, w: 116, t: 18 },
  stem: { r: 15 },
  bar: { y: 940, w: 640, r: 11, riseZ: -390 },

  /** Gắp sau và giảm chấn sau. */
  swing: {
    pivot: [262, 248],               // (y, z)
    axle: [279, 665],
    armR: 22, spanX: 150,
    travelWheel: 80,
  },
  shock: {
    topY: 600, topZ: 430,
    bottomY: 300, bottomZ: 600,
    bodyR: 17, springR: 32, springTurns: 8,
    /** Tỉ số đòn: bánh dịch bấy nhiêu thì giảm chấn nén ít hơn. */
    leverage: 1.4,
    rateAtShock: 118,                // N/mm tại giảm chấn
  },

  /** Truyền động cuối. */
  finalDrive: {
    frontSprocket: { teeth: 14, y: 232, z: 150 },
    rearSprocket: { teeth: 35 },
    pitch: 12.7,                     // sên 428
    /** Độ võng sên cho phép, đo ở giữa nhịp. */
    slackSpec: [25, 35],
  },
  /** Tỉ số bộ nồi và hộp số, lấy từ hệ thống 04 và 05 để tính tốc độ. */
  primaryRatio: 3.35,
  gearRatios: [2.917, 1.9375, 1.35, 0.958],

  /** Phanh trước: đĩa + kẹp thuỷ lực một pít-tông. */
  brakeF: {
    discR: 120, discT: 3.5, discBolts: 4,
    padREff: 90, padArea: 1500,
    caliperPistonD: 32,
    masterPistonD: 11,
    leverRatio: 4.2,
    muPad: 0.40,
    discMassKg: 0.8,
  },

  /** Phanh sau: cơ, tang trống hai má (một má dẫn, một má bị). */
  brakeR: {
    drumR: 55, drumW: 28,
    shoeArc: 105,
    pedalRatio: 5.5,
    camGain: 1.6,
    muShoe: 0.35,
    /** Hệ số hình học của tự cường hoá — xem `drumBrakeFactor`. */
    servoK: 2.0, servoE: 1.7,
    drumMassKg: 1.2,
  },

  /** Hệ số ma sát lốp–đường. */
  gripDry: 0.95,
  gripWet: 0.55,

  /** Chân phanh, gác chân, chân chống. */
  pedal: { y: 210, z: 300, len: 130, x: 150 },
  peg: { y: 200, z: 250, x: 170, len: 90 },
};

export const G = 9.81;

// ─────────────────────────────────────────────────────────────────────────────
// SUY DIỄN HÌNH HỌC
// ─────────────────────────────────────────────────────────────────────────────

/** Chiều dài cơ sở (khoảng cách hai trục bánh). */
export const WHEELBASE = L.wheelR.z - L.wheelF.z;

/** Phần tải TĨNH trên bánh trước (0…1). */
export const STATIC_FRONT = (L.wheelR.z - L.cg.z) / WHEELBASE;

// ── Hình học lái, suy diễn để không thể mâu thuẫn ────────────────────────────

export const RAKE = deg(L.steer.rakeDeg);
export const TAN_RAKE = Math.tan(RAKE);

/**
 * Z của TRỤC CÀNG ở một độ cao y. Trục càng đi qua tâm trục bánh trước và nghiêng
 * đúng góc trục lái, nên càng lên cao thì càng lùi về sau.
 */
export const forkAxisZ = (y) => L.wheelF.z + (y - L.wheelF.r) * TAN_RAKE;

/**
 * Z của TRỤC LÁI ở một độ cao y. Nó song song trục càng nhưng lùi về SAU một
 * khoảng — chính khoảng lùi đó (độ lệch càng, đo vuông góc trục lái) là thứ tạo ra
 * độ lệch đuôi.
 */
export const steerAxisZ = (y) => forkAxisZ(y) + L.steer.offset / Math.cos(RAKE);

/**
 * ĐỘ LỆCH ĐUÔI (trail) — khoảng cách từ điểm tiếp đất tới nơi trục lái cắt mặt
 * đất. Chính nó làm bánh trước tự trả về giữa: khi bánh lệch, phản lực đường tác
 * dụng ở phía SAU trục lái nên sinh momen kéo bánh về thẳng.
 *
 * Tính theo HAI cách để hai cách phải khớp nhau (xem phép kiểm):
 *  - công thức quen dùng: R·tan(rake) − offset/cos(rake)
 *  - đo trực tiếp trên hình: z tiếp đất bánh − z trục lái cắt đất
 */
export function trail() {
  return L.wheelF.r * TAN_RAKE - L.steer.offset / Math.cos(RAKE);
}
export const trailFromAxes = () => L.wheelF.z - steerAxisZ(0);

/** Bán kính gắp sau (từ trục quay tới trục bánh). */
export const SWING_R = Math.hypot(
  L.swing.axle[0] - L.swing.pivot[0], L.swing.axle[1] - L.swing.pivot[1]);

/** Vị trí trục bánh sau khi gắp quay đi `dWheelMm` (dương = bánh đi LÊN). */
export function rearAxleAt(dWheelMm) {
  const [py, pz] = L.swing.pivot;
  const a0 = Math.atan2(L.swing.axle[0] - py, L.swing.axle[1] - pz);
  const a = a0 + dWheelMm / SWING_R;
  return [py + SWING_R * Math.sin(a), pz + SWING_R * Math.cos(a)];
}

/**
 * KHOẢNG CÁCH từ nhông trước tới trục bánh sau, theo vị trí gắp.
 * Đây là hàm quyết định ĐỘ VÕNG SÊN: khoảng cách này THAY ĐỔI khi gắp quay, nên
 * sên phải có đủ độ võng để không bị căng cứng ở vị trí xấu nhất.
 */
export function chainSpanAt(dWheelMm) {
  const fs = L.finalDrive.frontSprocket;
  const [ay, az] = rearAxleAt(dWheelMm);
  return Math.hypot(ay - fs.y, az - fs.z);
}

/** Biên độ thay đổi chiều dài sên trên toàn hành trình treo sau. */
export function chainSpanRange() {
  let lo = Infinity, hi = -Infinity, hiAt = 0;
  const t = L.swing.travelWheel;
  for (let d = -t * 0.4; d <= t * 0.75; d += 0.5) {
    const s = chainSpanAt(d);
    if (s < lo) lo = s;
    if (s > hi) { hi = s; hiAt = d; }
  }
  return { lo, hi, delta: hi - lo, hiAt };
}

/**
 * ĐỘ VÕNG cần có ở giữa nhịp sên để bù được `delta` mm thay đổi chiều dài.
 * Sên võng thành hai đoạn thẳng nên chiều dài đường đi ≈ span + 4·s²/span.
 * Đảo lại:  s = √(delta · span / 4).
 */
export function requiredSlack(span, delta) {
  return Math.sqrt((delta * span) / 4);
}

/** Tỉ số truyền cuối và tổng. */
export const FINAL_RATIO = L.finalDrive.rearSprocket.teeth / L.finalDrive.frontSprocket.teeth;
export const overallRatio = (gear) => L.primaryRatio * L.gearRatios[gear - 1] * FINAL_RATIO;

/** Tốc độ xe (km/h) ở một vòng tua và một cấp số. */
export function speedKmh(rpm, gear) {
  const wheelRpm = rpm / overallRatio(gear);
  const circM = (2 * Math.PI * L.wheelR.r) / 1000;
  return (wheelRpm * circM * 60) / 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// HỆ THỐNG TREO
// ─────────────────────────────────────────────────────────────────────────────

/** Độ lún tĩnh của càng trước (mm) và tỉ lệ so với hành trình. */
export function frontSag() {
  const load = L.mass * G * STATIC_FRONT;
  const mm = load / L.fork.rate;
  return { mm, frac: mm / L.fork.travel, load };
}

/** Độ lún tĩnh của treo sau, quy về chuyển vị BÁNH XE. */
export function rearSag() {
  const load = L.mass * G * (1 - STATIC_FRONT);
  // Lực ở giảm chấn lớn hơn lực ở bánh theo tỉ số đòn; chuyển vị thì ngược lại.
  const rateAtWheel = L.shock.rateAtShock / L.shock.leverage ** 2;
  const mm = load / rateAtWheel;
  return { mm, frac: mm / L.swing.travelWheel, load, rateAtWheel };
}

/** Hành trình còn lại khi gặp một cú xóc `gLoad` lần trọng lượng tĩnh. */
export function bumpTravel(gLoad) {
  const f = frontSag(), r = rearSag();
  return {
    front: f.mm * gLoad, frontLeft: L.fork.travel - f.mm * gLoad,
    rear: r.mm * gLoad, rearLeft: L.swing.travelWheel - r.mm * gLoad,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHANH — CHUỖI LỰC
// ─────────────────────────────────────────────────────────────────────────────

const area = (d) => (Math.PI * d * d) / 4;

/** Hệ số nhân lực của mạch thuỷ lực phanh trước. */
export const HYDRAULIC_GAIN = area(L.brakeF.caliperPistonD) / area(L.brakeF.masterPistonD);

/**
 * MOMEN PHANH TRƯỚC (N·m) từ lực bóp tay (N).
 * Chuỗi: lực tay × tỉ số tay bóp → áp suất dầu → lực pít-tông kẹp
 *        → 2 mặt ma sát × μ × bán kính hiệu dụng.
 * Momen tỉ lệ TUYẾN TÍNH với μ — đây là điểm để so sánh với phanh cơ bên dưới.
 */
export function frontBrakeTorque(leverN, muPad = L.brakeF.muPad) {
  const B = L.brakeF;
  const clamp1 = leverN * B.leverRatio * HYDRAULIC_GAIN;
  return 2 * clamp1 * muPad * (B.padREff / 1000);
}

/**
 * HỆ SỐ PHANH của tang trống hai má (một má DẪN, một má BỊ).
 *
 * Má DẪN bị ma sát KÉO THÊM vào lòng trống, nên nó tự tăng lực ép — gọi là tự
 * cường hoá. Má BỊ thì ngược lại, ma sát đẩy nó rời ra.
 *
 *   hệ số má dẫn = k·μ / (1 − μ·e)      <- mẫu số nhỏ đi -> tăng vọt
 *   hệ số má bị  = k·μ / (1 + μ·e)      <- mẫu số lớn lên -> hiền
 *
 * Hệ quả rất thực tế, và là toàn bộ tính cách của phanh cơ: momen phanh phụ thuộc
 * μ một cách PHI TUYẾN và rất dốc. Nên khi má nóng hoặc ướt (μ tụt) thì phanh mất
 * lực nhiều hơn hẳn so với phanh đĩa; còn khi má bám tốt thì phanh dễ bó cứng.
 */
export function drumBrakeFactor(muShoe = L.brakeR.muShoe) {
  const { servoK: k, servoE: e } = L.brakeR;
  const mu = clamp(muShoe, 0.02, 0.85);
  const leading = (k * mu) / Math.max(1 - mu * e, 0.08);
  const trailing = (k * mu) / (1 + mu * e);
  return { leading, trailing, total: leading + trailing };
}

/** MOMEN PHANH SAU (N·m) từ lực đạp chân (N). */
export function rearBrakeTorque(pedalN, muShoe = L.brakeR.muShoe) {
  const B = L.brakeR;
  const shoeForce = pedalN * B.pedalRatio * B.camGain;
  return drumBrakeFactor(muShoe).total * shoeForce * (B.drumR / 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHANH — CHUYỂN TẢI VÀ GIẢM TỐC
// ─────────────────────────────────────────────────────────────────────────────

/** Phần tải trên bánh trước khi đang giảm tốc `aG` lần g. */
export const frontLoadFraction = (aG) =>
  clamp(STATIC_FRONT + (aG * L.cg.y) / WHEELBASE, 0, 1);

/**
 * Giải bài toán phanh: cho lực tay và lực chân, tìm gia tốc giảm tốc THẬT SỰ.
 *
 * Phải giải LẶP vì có vòng hồi tiếp: phanh mạnh → dồn tải ra trước → bánh trước
 * bám tốt hơn → phanh được mạnh hơn nữa. Ngược lại bánh sau nhẹ đi và khoá sớm.
 *
 * Trả về cả trạng thái KHOÁ BÁNH của từng bánh, vì đó mới là điều người lái cảm
 * nhận được.
 */
export function brakingSolution(leverN, pedalN, opt = {}) {
  const { grip = L.gripDry, muPad = L.brakeF.muPad, muShoe = L.brakeR.muShoe } = opt;
  const W = L.mass * G;
  const tqF = frontBrakeTorque(leverN, muPad);
  const tqR = rearBrakeTorque(pedalN, muShoe);
  // Lực phanh mà cơ cấu CÓ THỂ tạo ra ở vành lốp
  const capF = tqF / (L.wheelF.r / 1000);
  const capR = tqR / (L.wheelR.r / 1000);

  let a = 0;
  let fF = 0, fR = 0, lockF = false, lockR = false;
  for (let i = 0; i < 60; i++) {
    const wf = frontLoadFraction(a);
    const maxF = grip * wf * W;
    const maxR = grip * (1 - wf) * W;
    lockF = capF > maxF;
    lockR = capR > maxR;
    fF = Math.min(capF, maxF);
    fR = Math.min(capR, maxR);
    const aNew = (fF + fR) / W;
    if (Math.abs(aNew - a) < 1e-6) { a = aNew; break; }
    a = a * 0.4 + aNew * 0.6;
  }

  // Bánh sau BỔNG lên khi tải trên nó về 0
  const rearLift = frontLoadFraction(a) >= 0.999;
  const wf = frontLoadFraction(a);
  return {
    a, fF, fR, capF, capR, lockF, lockR, rearLift,
    frontFrac: wf, rearFrac: 1 - wf, tqF, tqR,
    shareFront: fF + fR > 1 ? fF / (fF + fR) : 0,
  };
}

/** Gia tốc giảm tốc TỐI ĐA nếu chỉ dùng MỘT phanh, với lực bóp/đạp không hạn chế. */
export function maxDecelFrontOnly(grip = L.gripDry) {
  // a = μ·(tĩnh + a·h/L)  →  a(1 − μh/L) = μ·tĩnh
  const k = (grip * L.cg.y) / WHEELBASE;
  return (grip * STATIC_FRONT) / Math.max(1 - k, 1e-6);
}

export function maxDecelRearOnly(grip = L.gripDry) {
  const k = (grip * L.cg.y) / WHEELBASE;
  return (grip * (1 - STATIC_FRONT)) / (1 + k);
}

/** Gia tốc mà bánh sau bắt đầu bổng lên. */
export const rearLiftDecel = () => ((1 - STATIC_FRONT) * WHEELBASE) / L.cg.y;

/** Quãng đường phanh (m) từ một tốc độ (km/h) với gia tốc `aG`. */
export function stoppingDistance(kmh, aG) {
  const v = kmh / 3.6;
  if (aG <= 1e-6) return Infinity;
  return (v * v) / (2 * aG * G);
}

// ─────────────────────────────────────────────────────────────────────────────
// NHIỆT VÀ SUY GIẢM PHANH
// ─────────────────────────────────────────────────────────────────────────────

export const HEAT = {
  cSteel: 460,          // J/(kg·K)
  ambient: 30,          // °C
  /** Phần động năng đổ vào phanh TRƯỚC khi phanh cả hai. */
  frontShare: 0.75,
  /** μ bắt đầu tụt từ nhiệt độ này, và tụt hết ở nhiệt độ kia. */
  fadeFrom: 220, fadeTo: 520,
  /**
   * Khả năng THOÁT NHIỆT (W mỗi độ chênh với không khí). Đây là khác biệt lớn nhất
   * giữa hai loại phanh: đĩa phanh hở hoàn toàn ra gió, còn tang trống là một cái
   * hộp kín — má phanh nằm trong đó, nhiệt không có đường ra.
   */
  discCooling: 14,
  drumCooling: 3.5,
};

/** Động năng phải triệt tiêu khi dừng từ một tốc độ (J). */
export const kineticEnergy = (kmh) => 0.5 * L.mass * (kmh / 3.6) ** 2;

/** Nhiệt độ tăng của đĩa phanh trước sau MỘT lần dừng. */
export function discTempRise(kmh) {
  return (kineticEnergy(kmh) * HEAT.frontShare) / (L.brakeF.discMassKg * HEAT.cSteel);
}

/** Nhiệt độ tăng của tang trống sau MỘT lần dừng (nếu chỉ dùng phanh sau). */
export function drumTempRise(kmh) {
  return kineticEnergy(kmh) / (L.brakeR.drumMassKg * HEAT.cSteel);
}

/**
 * NHIỆT ĐỘ PHANH KHI PHANH LIÊN TỤC — kịch bản ĐỔ ĐÈO.
 *
 * Đây mới là chỗ phanh thật sự suy giảm. Phanh từng nhát rồi chạy tiếp thì nhiệt
 * kịp thoát; nhưng đổ đèo là đổ TOÀN BỘ thế năng vào phanh liên tục trong nhiều
 * phút. Công suất phải triệt tiêu:
 *      P = m · g · độ_dốc · tốc_độ
 * Nhiệt độ tăng theo phương trình cân bằng nhiệt, tiến tới `ambient + P/hA`.
 *
 * Trả về nhiệt độ sau `seconds` giây và μ còn lại.
 */
export function descentTemp(slopePct, kmh, seconds, which = 'drum') {
  const v = kmh / 3.6;
  const P = L.mass * G * (slopePct / 100) * v;            // W
  const isDrum = which === 'drum';
  const C = (isDrum ? L.brakeR.drumMassKg : L.brakeF.discMassKg) * HEAT.cSteel;
  const hA = isDrum ? HEAT.drumCooling : HEAT.discCooling;
  const tEq = HEAT.ambient + P / hA;
  const temp = HEAT.ambient + (tEq - HEAT.ambient) * (1 - Math.exp((-hA * seconds) / C));
  const mu0 = isDrum ? L.brakeR.muShoe : L.brakeF.muPad;
  return { P, temp, tEq, mu: muAtTemp(mu0, temp), mu0 };
}

/** Hệ số ma sát còn lại ở một nhiệt độ. */
export function muAtTemp(mu0, tempC) {
  const t = clamp((tempC - HEAT.fadeFrom) / (HEAT.fadeTo - HEAT.fadeFrom), 0, 1);
  return mu0 * (1 - 0.72 * t);
}

/**
 * Nhiệt độ phanh sau `n` lần dừng liên tiếp, có nguội một phần giữa các lần.
 * `coolFrac` = phần nhiệt thoát đi giữa hai lần dừng.
 */
export function tempAfterStops(n, kmh, riseFn, coolFrac = 0.35) {
  let t = HEAT.ambient;
  for (let i = 0; i < n; i++) {
    t += riseFn(kmh);
    t = HEAT.ambient + (t - HEAT.ambient) * (1 - coolFrac);
  }
  return t;
}
