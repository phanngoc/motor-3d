/**
 * layout.js — TOÀN BỘ kích thước và MÔ HÌNH ĐIỆN của hệ thống đánh lửa CDI và
 * hệ thống điện.
 *
 * Đơn vị: mm. Trục: +X ra phải xe, +Y lên, +Z ra sau. Mâm lửa nằm bên TRÁI (−X),
 * đúng như hệ thống 03.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Các cuộn dây vẽ thành khối trụ có lõi thép, không dựng từng vòng dây.
 *  - CDI, cục sạc, rơ-le đề vẽ thành hộp có giắc; bên trong là mạch điện tử.
 *  - Bó dây điện chỉ vẽ những đoạn chính để thấy sơ đồ nối, không đi đúng đường
 *    luồn dây trên xe thật.
 *
 * GIỮ ĐÚNG, và đây là phần đáng học nhất:
 *  - GÓC ĐÁNH LỬA SỚM suy ra từ hai sự thật vật lý tách bạch (xem `sparkAdvance`),
 *    không phải một đường cong tùy ý.
 *  - ĐIỆN ÁP CẦN để phóng tia phụ thuộc ÁP SUẤT trong xy-lanh, nên bô-bin yếu
 *    hay bugi hở rộng chỉ bỏ máy KHI CÓ TẢI. Đó là chẩn đoán quan trọng nhất.
 *  - CÂN BẰNG SẠC: dòng phát tỉ lệ vòng tua còn phụ tải gần như không đổi, nên
 *    dưới một vòng tua nào đó là ắc quy đang bị rút cạn.
 */

import { deg, clamp, lerp, smoothstep } from '../../lib/geom.js';

export const L = {
  /** Trục khuỷu (ngữ cảnh). */
  crank: { r: 12, x0: -96, x1: 40 },

  /** Rôto mâm lửa = bánh đà, mang nam châm vĩnh cửu. */
  rotor: {
    x0: -80, x1: -58,
    rOut: 52, rIn: 14, wall: 8,
    magnets: 6, magnetR: 44, magnetT: 7, magnetW: 46,   // 46° mỗi khối
    /** Dấu chỉ thị trên vành: T = điểm chết trên, F = điểm đánh lửa. */
    markTdcAngle: 0,
    hubTaper: 14,
  },

  /** Mâm điện (stator): đĩa mang các cuộn dây, bắt cố định vào lốc máy. */
  stator: {
    x0: -78, x1: -64,
    rPlate: 34, plateT: 4,
    /** Cuộn phát điện: 4 cuộn đèn + 1 cuộn nạp. */
    coils: 5, coilR: 26, coilOuter: 9, coilLen: 12,
    bolts: 3, boltR: 28,
  },

  /**
   * Cuộn kích (pulser / cuộn đánh lửa tín hiệu). Nó KHÔNG phát điện đánh lửa —
   * nó chỉ báo cho CDI biết trục khuỷu đang ở đâu.
   */
  pulser: {
    angle: 100,              // vị trí góc quanh trục khuỷu
    /** Bán kính MŨI lõi thép — nằm NGOÀI vành rôto, cách vành đúng khe hở đặt. */
    r: 53, len: 16, coreW: 10,
    /** Thân cuộn dây nằm ra ngoài mũi lõi bấy nhiêu, và dày bấy nhiêu. */
    bodyOffset: 12, bodyR: 8.5,
    /** Khe hở giữa lõi cuộn kích và vấu trên rôto. */
    airGapSpec: 0.5,
    airGapMax: 2.5,
  },

  /** Vấu kích trên rôto — đi qua cuộn kích thì sinh xung. */
  reluctor: { angle: 100, arc: 22, rise: 2.5 },

  /** Vỏ máy trái che mâm lửa. */
  cover: { x0: -96, x1: -80, r: 84, wall: 5, bolts: 6, boltR: 76 },

  /** Bugi — khe hở điện cực là biến quan trọng của hệ này. */
  plug: {
    x0: 14, x1: 62, y: 150, z: 0,
    bodyR: 7, hexAF: 16, ceramicR: 9,
    gapSpec: 0.7, gapMin: 0.6, gapMax: 1.4,
    centerR: 1.2,
  },

  /** Bô-bin sườn (cuộn đánh lửa cao áp) và dây cao áp. */
  coil: { x: 8, y: 196, z: 62, w: 26, h: 44, d: 22 },
  plugCap: { len: 34, r: 11 },

  /** CDI — hộp phóng điện tụ. */
  cdi: { x: -44, y: 178, z: 96, w: 44, h: 52, d: 22 },

  /** Cục sạc (chỉnh lưu + ổn áp) có cánh tản nhiệt. */
  regulator: { x: 46, y: 152, z: 104, w: 42, h: 40, d: 20, fins: 6 },

  /** Ắc quy, cầu chì, ổ khoá, công tắc tắt máy. */
  battery: { x: 0, y: 96, z: 148, w: 70, h: 62, d: 46 },
  fuse: { x: 34, y: 128, z: 150, len: 30, r: 6 },
  ignSwitch: { x: 0, y: 236, z: 128, r: 15, len: 34 },
  killSwitch: { x: -52, y: 230, z: 90, w: 20, h: 26, d: 12 },

  /** Củ đề và rơ-le đề. */
  starter: { x0: -34, x1: 22, y: 44, z: -74, r: 21, gearR: 9 },
  starterRelay: { x: -34, y: 122, z: 150, w: 26, h: 30, d: 20 },
  /** Bộ bendix trên rôto: chỉ truyền một chiều. */
  bendix: { x0: -58, x1: -50, rOut: 40, rollers: 3 },

  /** Đầu bò (ngữ cảnh) — đích của tia lửa. */
  head: { y0: 118, y1: 176, w: 58, d: 50 },
  case: { x0: -80, x1: 46, y: 0, w: 132, d: 122 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUY DIỄN HÌNH HỌC
// ─────────────────────────────────────────────────────────────────────────────

/** Vấu kích có nằm đối diện cuộn kích ở góc này hay không. */
export function atReluctor(angleDeg) {
  const R = L.reluctor;
  const d = ((((angleDeg - R.angle) % 360) + 540) % 360) - 180;
  return Math.abs(d) <= R.arc / 2;
}

/** Bán kính THÀNH TRONG của vành rôto — có vấu kích nhô lên ở vùng `reluctor`. */
export function rotorRadiusAt(angleDeg) {
  return L.rotor.magnetR + (atReluctor(angleDeg) ? L.reluctor.rise : 0);
}

/** Bán kính MẶT NGOÀI vành rôto — chính mặt này đi qua trước lõi cuộn kích. */
export const rotorOuterRadiusAt = (angleDeg) => rotorRadiusAt(angleDeg) + 6;

/** Bán kính ngoài cùng của cụm cuộn kích — dùng cho cả hình vẽ và phép kiểm. */
export const PULSER_OUTER_R = L.pulser.r + L.pulser.bodyOffset + L.pulser.bodyR;

/** Bán kính THÀNH TRONG vỏ máy trái. */
export const COVER_INNER_R = L.cover.r - L.cover.wall;

/**
 * Khe hở tức thời giữa mũi lõi cuộn kích và mặt ngoài vành rôto, theo góc quay.
 * Chính sự THAY ĐỔI khe hở này (vấu kích đi qua) làm từ thông biến thiên và sinh
 * ra xung điện báo thời điểm cho CDI.
 */
export const pulserGapAt = (angleDeg, extraGap = 0) =>
  L.pulser.r - rotorOuterRadiusAt(angleDeg) + extraGap;

// ─────────────────────────────────────────────────────────────────────────────
// GÓC ĐÁNH LỬA SỚM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hai sự thật vật lý TÁCH BẠCH quyết định góc đánh lửa sớm. Đây là chỗ đáng hiểu
 * nhất của cả hệ thống đánh lửa:
 *
 * 1. THỜI GIAN TRỄ BÉN LỬA gần như KHÔNG ĐỔI theo thời gian (≈ 0,45 ms). Từ lúc
 *    tia lửa phóng đến lúc có nhân lửa cháy được là một quá trình vật lý – hoá học
 *    không quan tâm trục khuỷu quay nhanh hay chậm. Vòng tua càng cao thì khoảng
 *    thời gian đó CHIẾM CÀNG NHIỀU ĐỘ góc quay.
 *
 * 2. GIAI ĐOẠN CHÁY LAN gần như KHÔNG ĐỔI theo GÓC (≈ 22° tới điểm cháy 50 %).
 *    Vì vòng tua cao thì dòng khí trong buồng đốt xoáy mạnh hơn, ngọn lửa lan
 *    nhanh hơn đúng tỉ lệ. Nên phần này KHÔNG cần bù thêm độ.
 *
 * Mục tiêu: điểm cháy 50 % rơi vào khoảng 15° SAU điểm chết trên — đó là nơi
 * áp suất cực đại đẩy piston hiệu quả nhất.
 *
 *   góc sớm = (độ do thời gian trễ) + (độ do cháy lan) − 15°
 *
 * Chính vì thành phần thứ nhất mà góc sớm PHẢI tăng theo vòng tua. Nếu cả hai
 * thành phần đều không đổi theo góc thì đánh lửa sẽ không cần bộ đánh lửa sớm.
 */
export const COMBUSTION = {
  delayMs: 0.45,        // trễ bén lửa — không đổi theo THỜI GIAN
  burnDeg50: 22,        // cháy lan tới 50 % — không đổi theo GÓC
  targetPeakAtdc: 15,   // muốn điểm cháy 50 % ở 15° sau ĐCT
  /** Giới hạn kích nổ: quá góc này thì áp suất tăng quá sớm và gây kích nổ. */
  knockLimitDeg: 32,
};

/** Số độ trục khuỷu quay được trong một khoảng thời gian (ms). */
export const msToCrankDeg = (ms, rpm) => 0.006 * rpm * ms;

/** Góc sớm LÝ TƯỞNG, chưa xét giới hạn kích nổ. */
export function idealAdvance(rpm) {
  const C = COMBUSTION;
  return msToCrankDeg(C.delayMs, rpm) + C.burnDeg50 - C.targetPeakAtdc;
}

/**
 * Góc sớm CDI thật sự dùng: lấy góc lý tưởng nhưng bị chặn bởi giới hạn kích nổ,
 * rồi cộng thêm sai lệch do THEN BÁN NGUYỆT bánh đà bị cắt (nếu có).
 */
export function sparkAdvance(rpm, keyShiftDeg = 0) {
  return clamp(idealAdvance(rpm), 0, COMBUSTION.knockLimitDeg) + keyShiftDeg;
}

/** Góc sớm bị giới hạn kích nổ chặn lại hay chưa. */
export const knockLimited = (rpm) => idealAdvance(rpm) > COMBUSTION.knockLimitDeg;

// ─────────────────────────────────────────────────────────────────────────────
// ĐIỆN ÁP PHÓNG TIA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Áp suất trong xy-lanh tại thời điểm đánh lửa (bar tuyệt đối).
 * Bướm ga mở nhỏ thì áp suất nạp thấp, nên áp suất cuối kỳ nén cũng thấp. Đây là
 * điểm then chốt: KHÔNG TẢI thì áp suất thấp, TẢI NẶNG thì áp suất cao.
 */
export const CYL = { compressionRatio: 9.3, polytropic: 1.3 };

export function cylinderPressureBar(load01) {
  const intake = lerp(0.28, 0.98, clamp(load01, 0, 1));   // bar tuyệt đối
  // Nén đa biến tới gần điểm chết trên (chưa hết hành trình nén khi đánh lửa).
  return intake * Math.pow(CYL.compressionRatio * 0.82, CYL.polytropic);
}

/**
 * ĐIỆN ÁP CẦN để phóng tia qua khe bugi (kV).
 * Theo định luật Paschen, điện áp đánh xuyên tăng theo cả ÁP SUẤT và KHE HỞ.
 * Hệ số 2,95 được chọn để khe 0,7 mm ở áp suất tải nặng cần khoảng 12 kV — đúng
 * dải thực tế; dạng phụ thuộc (tăng theo áp suất và khe hở) mới là điều đáng tin.
 *
 * Hệ quả chẩn đoán quan trọng nhất của cả hệ thống điện: vì điện áp cần tăng theo
 * áp suất, một bô-bin yếu hoặc một bugi hở rộng vẫn phóng tia bình thường lúc
 * KHÔNG TẢI (áp suất thấp) mà BỎ MÁY khi lên ga có tải. Vì vậy thử bugi bằng cách
 * cho nổ tại chỗ là phép thử KHÔNG kết luận được gì.
 */
export function requiredKv(load01, gapMm, fouled01 = 0) {
  const p = cylinderPressureBar(load01);
  const base = 2.95 * Math.pow(p, 0.7) * gapMm;
  // Bugi đóng muội dẫn điện làm rò một phần điện áp -> phải cần cao hơn.
  return base * (1 + 1.4 * clamp(fouled01, 0, 1));
}

/**
 * ĐIỆN ÁP CÓ ĐƯỢC từ bô-bin (kV). Với CDI, tụ được nạp mỗi vòng nên điện áp gần
 * như KHÔNG phụ thuộc vòng tua — khác hẳn đánh lửa má vít đời cũ (lửa yếu khi đạp
 * máy chậm). Nhưng ở vòng tua rất thấp thì cuộn kích sinh xung yếu nên vẫn tụt.
 */
export const IGN = {
  availKvHealthy: 21,
  /** Vòng tua tối thiểu để xung cuộn kích đủ kích CDI, ở khe hở ĐÚNG ĐẶT. */
  pulserTriggerRpm: 300,
};

/**
 * ĐỘ MẠNH XUNG CUỘN KÍCH, quy về 1,0 = vừa đủ kích CDI.
 * Xung sinh ra tỉ lệ TỐC ĐỘ biến thiên từ thông, nên tỉ lệ vòng tua; và giảm nhanh
 * khi khe hở rộng ra. Vì vậy khe hở rộng làm mất lửa ở vòng tua THẤP trước — đúng
 * lúc đạp máy — mà khi đã nổ rồi thì vẫn chạy được.
 */
export const pulserSignal = (rpm, gapMm = L.pulser.airGapSpec) =>
  (rpm / IGN.pulserTriggerRpm) * Math.pow(L.pulser.airGapSpec / Math.max(gapMm, 0.05), 1.6);

/**
 * ĐIỆN ÁP CÓ ĐƯỢC từ bô-bin (kV).
 *
 * CDI là mạch SỐ: xung cuộn kích đủ mạnh thì nó phóng tụ, không đủ thì KHÔNG phóng
 * gì cả. Nên khe hở cuộn kích rộng không làm "lửa yếu" mà làm MẤT LỬA HẲN dưới một
 * vòng tua nào đó.
 *
 * Còn khi đã phóng, điện áp gần như KHÔNG phụ thuộc vòng tua — khác hẳn đánh lửa má
 * vít đời cũ. Chỉ ở tốc độ quay rất thấp thì cuộn nguồn chưa nạp đủ tụ nên mới tụt.
 */
export function availableKv(rpm, coilHealth01 = 1, pulserGapMm = L.pulser.airGapSpec) {
  if (pulserSignal(rpm, pulserGapMm) < 1) return 0;          // CDI không được kích
  const spin = smoothstep(clamp((rpm - 120) / 420, 0, 1));   // tụ chưa nạp đủ khi quay quá chậm
  return IGN.availKvHealthy * clamp(coilHealth01, 0, 1) * spin;
}

/** Có phóng được tia hay không, và dư bao nhiêu phần trăm. */
export function sparkState(rpm, load01, opt = {}) {
  const {
    gapMm = L.plug.gapSpec, coilHealth = 1, fouled = 0,
    pulserGap = L.pulser.airGapSpec,
  } = opt;
  const need = requiredKv(load01, gapMm, fouled);
  const have = availableKv(rpm, coilHealth, pulserGap);
  return { need, have, fires: have >= need, margin: need > 0 ? have / need - 1 : 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// CÂN BẰNG SẠC
// ─────────────────────────────────────────────────────────────────────────────

/** Các phụ tải điện trên xe, dòng tiêu thụ ở 12 V (A). */
export const LOADS = [
  { id: 'ign', short: 'đánh lửa', name: 'Đánh lửa + CDI', amps: 0.5, always: true },
  { id: 'tail', short: 'đèn hậu', name: 'Đèn hậu + đèn biển', amps: 0.4, always: true },
  { id: 'head', short: 'đèn pha', name: 'Đèn pha (35 W)', amps: 2.9 },
  { id: 'brake', short: 'đèn phanh', name: 'Đèn phanh (21 W)', amps: 1.75 },
  { id: 'horn', short: 'kèn', name: 'Kèn', amps: 2.5 },
  { id: 'signal', short: 'xi-nhan', name: 'Xi-nhan', amps: 0.9 },
];

export const ALT = {
  /** Dòng phát tỉ lệ vòng tua rồi bão hoà khi từ thông đã dùng hết. */
  ampsPerRpm: 0.00165,
  maxAmps: 5.5,
  /** Điện áp ổn áp giữ. Hỏng ổn áp thì điện áp vọt lên. */
  regulatedV: 14.2,
  failV: 17.4,
};

/** Dòng do mâm lửa phát ra ở một vòng tua (A). */
export const alternatorAmps = (rpm) => Math.min(ALT.ampsPerRpm * rpm, ALT.maxAmps);

/** Tổng phụ tải đang bật (A). */
export function loadAmps(on = {}) {
  return LOADS.reduce((s, l) => s + ((l.always || on[l.id]) ? l.amps : 0), 0);
}

/**
 * CÂN BẰNG SẠC: dòng phát trừ phụ tải. Âm nghĩa là ắc quy đang bị rút cạn.
 * Dòng phát tỉ lệ VÒNG TUA còn phụ tải gần như KHÔNG ĐỔI, nên luôn tồn tại một
 * vòng tua hoà vốn. Dưới vòng tua đó, càng chạy càng cạn ắc quy — và đó chính là
 * lý do đứng chờ đèn đỏ lâu với đèn pha bật thì đề không nổi.
 */
export function chargeBalance(rpm, on = {}) {
  const gen = alternatorAmps(rpm);
  const load = loadAmps(on);
  return { gen, load, net: gen - load };
}

/** Vòng tua hoà vốn sạc với một tổ hợp phụ tải. */
export function breakEvenRpm(on = {}) {
  const load = loadAmps(on);
  if (load > ALT.maxAmps) return Infinity;
  return Math.round(load / ALT.ampsPerRpm);
}

/** Điện áp trên hệ, tuỳ ổn áp còn tốt hay không. */
export function systemVoltage(rpm, on = {}, regulatorOk = true) {
  const b = chargeBalance(rpm, on);
  if (!regulatorOk) {
    // Không ổn áp: điện áp đi theo vòng tua, không có gì chặn.
    return clamp(11.6 + (rpm / 9000) * (ALT.failV - 11.6) * 1.35, 11.6, 19.5);
  }
  if (b.net >= 0) return ALT.regulatedV;
  // Đang rút ắc quy: điện áp tụt về điện áp hở của ắc quy rồi thấp hơn.
  return clamp(12.6 + b.net * 0.42, 10.4, 12.6);
}

// ─────────────────────────────────────────────────────────────────────────────

export const STROKES = ['Nạp', 'Nén', 'Nổ', 'Xả'];
export const strokeIndex = (crankDeg) => Math.floor((((crankDeg % 720) + 720) % 720) / 180);

/** Đường tải: dùng cho các phép kiểm, giống hệ 07. */
export const LOAD_LINE = [
  [0.03, 1400], [0.10, 2200], [0.25, 3600], [0.50, 5400], [0.80, 7300], [1.00, 8500],
];
