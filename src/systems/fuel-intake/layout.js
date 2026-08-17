/**
 * layout.js — TOÀN BỘ kích thước và MÔ HÌNH VẬT LÝ của hệ thống nạp–xả và
 * cung cấp nhiên liệu (bộ hoà khí kiểu CV — van trượt chân không).
 *
 * Đơn vị: mm. Trục: +Y lên, +X phải, +Z ra SAU xe.
 * Không khí đi theo chiều +Z → −Z: hộp gió (sau) → bộ hoà khí → cổ hút → đầu bò.
 * Khí xả đi tiếp về −Z: cổ xả → ống giảm âm.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Các đường xăng và đường khí bên trong thân bộ hoà khí là mạng lỗ khoan chéo
 *    rất phức tạp; ở đây chỉ dựng những đoạn nhìn thấy được và các gíc-lơ.
 *  - Màng cao su của van trượt vẽ thành hình côn đơn giản.
 *  - Ống giảm âm là vỏ ngoài, không có các vách tiêu âm bên trong.
 *
 * GIỮ ĐÚNG, và đây là phần quan trọng nhất của cả trang:
 *  - Van trượt CV đi theo LƯU LƯỢNG KHÍ, không đi theo tay ga.
 *  - Ba mạch xăng (chậm · kim · chính) chuyển giao cho nhau theo độ mở van trượt,
 *    và gíc-lơ chính với kim xăng nối TIẾP nhau nên mỗi cái chỉ quyết định ở một
 *    khoảng. Đó là lý do tắc gíc-lơ chậm và tắc gíc-lơ chính cho hai triệu chứng
 *    hoàn toàn khác nhau.
 */

import { deg, clamp, lerp, smoothstep } from '../../lib/geom.js';

export const L = {
  /** Thân bộ hoà khí: lỗ thông nằm ngang theo Z. */
  carb: {
    z0: 40, z1: 104,           // mặt bích ra động cơ … mặt bích vào hộp gió
    rIn: 13,                   // bán kính lỗ ở hai đầu
    rThroat: 9.5,              // bán kính họng khuếch tán (venturi)
    zThroat: 76,               // vị trí họng — cũng là nơi kim xăng nhả xăng
    bodyR: 22,
    flangeT: 5,
    bolts: 2, boltSpan: 46,
  },

  /** Van trượt chân không + kim xăng, chạy dọc theo Y phía trên họng. */
  slide: {
    r: 14, h: 26,
    /**
     * Tiết diện khe khí dưới van trượt khi van ĐÓNG HẲN, tính theo phần trăm
     * tiết diện họng. Van trượt không bịt kín họng — lúc không tải thì BƯỚM GA
     * mới là chỗ hẹp nhất, nên van trượt còn hở chừng này.
     */
    minOpen: 0.1941,
    /** Màng cao su và lò xo — hai thứ quyết định van mở bao nhiêu. */
    diaphragmArea: 9.6e-4,   // m²
    springPreload: 0.0899,   // N khi van đóng
    springRate: 0.10,        // N thêm vào khi van mở hết
    yClosed: 2,                // mép dưới van khi đóng hẳn = chạm sàn họng
    travel: 22,                // hành trình tối đa
    chamberTop: 58,            // trần buồng chân không
    springR: 11, springTurns: 6,
  },

  /**
   * Kim xăng. Bán kính THẬT, tính bằng mm — kim xăng rất mảnh.
   * `rStraight` là phần thẳng nằm trong ống kim khi van trượt đóng; từ đó kim
   * thuôn dần xuống `rTip`. Chính đoạn thuôn này định lượng xăng ở tầm ga giữa.
   */
  needle: {
    rStraight: 0.9639,      // Ø1,928 mm — chỉ hở 19 µm so với lòng ống kim
    rAtFullLift: 0.8976,    // Ø1,795 mm ở mặt cắt ngang ống kim khi van mở hết
    rTip: 0.40,
    len: 46,
    /** Vị trí khấc treo kim (1 = cao nhất/nghèo … 5 = thấp nhất/giàu). */
    clipPos: 3,
    clipStep: 0.8,
  },

  /** Ống kim (ống nhũ hoá) và các gíc-lơ — cỡ lỗ thật, tính bằng mm. */
  needleJet: { rIn: 0.9820, rOut: 3.2, y0: -26, y1: 4 },
  mainJet: { r: 0.375, rBody: 2.9, y: -32, /** số hiệu Keihin */ size: 75 },
  pilotJet: { r: 0.175, rBody: 2.0, y: -32, z: 66, size: 35 },

  /** Bướm ga: đĩa tròn quay quanh trục X, nằm PHÍA ĐỘNG CƠ so với van trượt. */
  butterfly: { z: 56, r: 11.2, t: 1.6, shaftR: 3, closedAngle: 8 },
  cableDrum: { x: 26, r: 12, t: 6 },

  /** Buồng phao. */
  bowl: { y0: -46, y1: -12, r: 21, gasketT: 2 },
  float: { r: 7.5, len: 22, xOff: 10, y: -26, pinX: 20 },
  /**
   * Mức xăng trong buồng phao, cho theo toạ độ y tuyệt đối.
   * Phải nằm DƯỚI sàn lỗ thông (y = −rThroat) để xăng không tự chảy vào lỗ
   * thông khi đỗ, và TRÊN gíc-lơ chính để gíc-lơ luôn ngập xăng.
   */
  fuelLevel: { spec: -20, range: 5 },

  /** Vít điều chỉnh. */
  idleScrew: { x: -22, y: -4, z: 52, len: 26 },
  airScrew: { x: -20, y: 6, z: 96, len: 20 },
  chokePlunger: { x: 22, y: 10, z: 92, r: 5, len: 30, travel: 8 },

  overflow: { x: 12, y0: -70, y1: -44, r: 2.2 },
  drainScrew: { y: -50, z: 76 },
  bowlScrews: 3,

  /** Hộp gió và lọc gió. */
  airbox: { z0: 108, z1: 168, w: 76, h: 62, r: 12 },
  filter: { z0: 118, z1: 146, w: 60, h: 48 },
  boot: { z0: 104, z1: 112, r: 15 },

  /** Cổ hút, mặt bích đầu bò. */
  manifold: { z0: 14, z1: 40, rIn: 12, rOut: 17 },

  /** Cổ xả và ống giảm âm (ngữ cảnh, phía −Z). */
  header: { z0: -150, z1: -8, rIn: 13, rOut: 15.5 },
  muffler: { z0: -320, z1: -150, r: 42 },

  /** Bình xăng + khoá xăng (ngữ cảnh). */
  tank: { y0: 96, y1: 150, w: 120, d: 130 },
  petcock: { y: 92, z: 40 },

  /** Đầu bò (ngữ cảnh). */
  head: { z: 8, y: 0 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUY DIỄN HÌNH HỌC
// ─────────────────────────────────────────────────────────────────────────────

export const THROAT_AREA = Math.PI * L.carb.rThroat ** 2;        // mm²
export const INLET_AREA = Math.PI * L.carb.rIn ** 2;             // mm²

/** Bán kính lỗ thông theo Z — hình dáng họng khuếch tán. */
export function boreRadiusAt(z) {
  const { z0, z1, rIn, rThroat, zThroat } = L.carb;
  if (z <= z0 || z >= z1) return rIn;
  const t = z < zThroat
    ? (z - z0) / (zThroat - z0)          // 0 ở mặt bích động cơ … 1 ở họng
    : (z1 - z) / (z1 - zThroat);         // 1 ở họng … 0 ở đầu vào
  return lerp(rIn, rThroat, smoothstep(clamp(t, 0, 1)));
}

/** Vị trí mép dưới van trượt theo độ mở (0…1). */
export const slideY = (lift01) => L.slide.yClosed + clamp(lift01, 0, 1) * L.slide.travel;

/**
 * TIẾT DIỆN KHE KHÍ dưới van trượt (mm²). Van trượt đóng hẳn vẫn còn hở
 * `minOpen` phần tiết diện họng — lúc đó bướm ga mới là chỗ hẹp nhất.
 * Hàm này vừa dùng để tính tốc độ khí, vừa là thứ quyết định độ chân không.
 */
export const slideGapArea = (lift01) =>
  THROAT_AREA * (L.slide.minOpen + (1 - L.slide.minOpen) * clamp(lift01, 0, 1));

/**
 * BÁN KÍNH KIM XĂNG tại mặt cắt đang nằm trong ống kim, theo độ mở van trượt.
 * Van nhấc lên thì phần kim nằm trong ống kim là phần MẢNH hơn, nên khe hở rộng ra.
 * Đây là hàm DUY NHẤT quyết định cả hình vẽ (biên dạng kim) và số (tiết diện khe).
 */
export function needleRadiusAtLift(lift01) {
  const clipOffset = (L.needle.clipPos - 3) * L.needle.clipStep / L.slide.travel;
  const t = clamp(clamp(lift01, 0, 1) + clipOffset, 0, 1);
  return lerp(L.needle.rStraight, L.needle.rAtFullLift, t);
}

/** Biên dạng kim theo khoảng cách từ ĐỈNH kim — để dựng hình. */
export function needleRadiusFromTop(sFromTop) {
  const straightLen = 6;
  if (sFromTop <= straightLen) return L.needle.rStraight;
  // Đoạn thuôn: cùng độ dốc với `needleRadiusAtLift`, rồi thuôn nhanh về mũi.
  const slope = (L.needle.rStraight - L.needle.rAtFullLift) / L.slide.travel;
  const r = L.needle.rStraight - slope * (sFromTop - straightLen);
  const sTaperEnd = straightLen + L.slide.travel;
  if (sFromTop <= sTaperEnd) return r;
  const rEnd = L.needle.rAtFullLift;
  const k = (sFromTop - sTaperEnd) / (L.needle.len - sTaperEnd);
  return lerp(rEnd, L.needle.rTip, clamp(k, 0, 1));
}

/** TIẾT DIỆN HỞ của khe kim–ống kim theo độ mở van trượt (mm²). */
export function needleGapArea(lift01) {
  const rN = needleRadiusAtLift(lift01);
  return Math.max(Math.PI * (L.needleJet.rIn ** 2 - rN ** 2), 1e-4);
}

export const MAIN_JET_AREA = Math.PI * L.mainJet.r ** 2;
export const PILOT_JET_AREA = Math.PI * L.pilotJet.r ** 2;

/**
 * TIẾT DIỆN HIỆU DỤNG của mạch chính, khi gíc-lơ chính và khe kim NỐI TIẾP nhau.
 * Hai lỗ tiết lưu nối tiếp thì  1/A²  cộng lại:
 *      1/A_hd²  =  1/A_chính²  +  1/A_kim²
 * Công thức này giải thích toàn bộ việc chuyển giao mạch:
 *  - van trượt còn thấp -> A_kim rất nhỏ -> A_kim quyết định  -> KIM XĂNG chỉnh
 *  - van trượt đã cao   -> A_kim lớn     -> A_chính quyết định -> GÍC-LƠ CHÍNH chỉnh
 * Vì vậy thay gíc-lơ chính không sửa được lỗi ở tầm ga giữa, và ngược lại.
 */
export function mainCircuitArea(lift01, mainBlock = 0) {
  const aMain = MAIN_JET_AREA * (1 - clamp(mainBlock, 0, 1));
  if (aMain <= 1e-9) return 0;
  const aNeedle = needleGapArea(lift01);
  return 1 / Math.sqrt(1 / aMain ** 2 + 1 / aNeedle ** 2);
}

/** Bên nào đang quyết định lưu lượng mạch chính — dùng cho nhãn và phép kiểm. */
export function mainCircuitLimiter(lift01, mainBlock = 0) {
  const aMain = MAIN_JET_AREA * (1 - clamp(mainBlock, 0, 1));
  return needleGapArea(lift01) < aMain ? 'kim xăng' : 'gíc-lơ chính';
}

// ─────────────────────────────────────────────────────────────────────────────
// MÔ HÌNH VẬT LÝ
// ─────────────────────────────────────────────────────────────────────────────

export const ENGINE = {
  disp: 109.1,          // cm³ — Ø50 × 55,6
  afrStoich: 14.7,      // tỉ lệ khí/xăng lý tưởng theo khối lượng
  airDensity: 1.184e-3, // g/cm³ ở 25 °C
  fuelDensity: 0.745,   // g/cm³
};

/**
 * HẰNG SỐ HIỆU CHUẨN.
 *
 * Dạng của mọi công thức bên dưới là dạng vật lý đúng: lưu lượng khí do động cơ
 * hút, chân không tỉ lệ bình phương tốc độ khí, van trượt cân bằng lực, lưu lượng
 * xăng tỉ lệ tiết diện nhân căn chênh áp. Nhưng các HỆ SỐ TỈ LỆ (`kMain`, `kPilot`,
 * `pulse`, `kFilter`, …) không suy ra được từ hình học — trên máy thật chúng phụ
 * thuộc hệ số lưu lượng của từng lỗ, mạng lỗ khí hiệu chỉnh, và độ bay hơi của
 * xăng. Ở đây chúng được DÒ SỐ sao cho một bộ hoà khí LÀNH cho tỉ lệ khí/xăng nằm
 * trong dải thực tế (khoảng 12…15,5) trên cả đường tải.
 *
 * Vì vậy: hãy đọc các con số tuyệt đối như số minh hoạ, còn điều đáng tin của
 * trang này là các QUAN HỆ — mạch nào quyết định ở khoảng ga nào, và mỗi hỏng hóc
 * để lại dấu vết gì theo dải ga. Những quan hệ đó suy ra từ hình học và từ dạng
 * công thức, không phụ thuộc việc hiệu chuẩn.
 */
export const CAL = {
  /**
   * Hệ số mạch động. Động cơ một xy-lanh chỉ nạp trong 1/4 chu kỳ, nên tốc độ khí
   * TỨC THỜI qua họng cao hơn nhiều tốc độ trung bình cả chu kỳ.
   */
  pulse: 3.7845,
  kMain: 50.151,        // g/phút cho mỗi mm² × √kPa
  kPilot: 0.82274,      // g/phút cho mỗi mm² × √kPa
  kChoke: 9,            // mạch làm đậm mở rộng gấp này lần so với gíc-lơ chậm
  /** Cột xăng mà mạch chính phải thắng mới chảy (kPa). */
  fuelHeadKpa: 0.087773,
  /** Hệ số sụt áp qua lọc gió. */
  kFilter: 0.70371,
  /** Mức xăng đổi cột xăng bao nhiêu cho mỗi mm. */
  levelHead: 0.015469,
  /** Mức xăng đổi độ giàu bao nhiêu cho mỗi mm (ngập thêm lỗ nhũ hoá). */
  levelGain: 0.094854,
  /** Lọc gió sạch thông gấp bao nhiêu lần tiết diện bướm ga mở hết. */
  filterCapacity: 4,
};

/** Hệ số nạp theo vòng tua — đỉnh quanh 6500 v/ph. */
function veRpm(rpm) {
  const t = (rpm - 6500) / 5200;
  return clamp(0.88 - 0.34 * t * t, 0.2, 0.95);
}

/**
 * Độ mở tiết diện của BƯỚM GA theo tay ga (0…1).
 * Bướm ga là đĩa quay nên tiết diện hở đi theo (1 − cos), không tuyến tính:
 * mở 25 % tay ga đã cho khá nhiều khí, còn từ 60 % lên 100 % gần như không thêm.
 * Đó là lý do phần lớn thời gian chạy phố chỉ dùng 1/8 … 1/4 tay ga.
 */
export function butterflyOpenArea01(throttle01) {
  const th = clamp(throttle01, 0, 1);
  const aClosed = deg(L.butterfly.closedAngle);
  const a = aClosed + th * (Math.PI / 2 - aClosed);
  return clamp((Math.cos(aClosed) - Math.cos(a)) / Math.cos(aClosed), 0.012, 1);
}

/**
 * TIẾT DIỆN CẢN TỔNG của đường nạp (quy về 0…1).
 * Lọc gió NỐI TIẾP với bướm ga nên 1/A² cộng lại. Hệ quả rất thực tế: lọc gió tắc
 * gần như KHÔNG ảnh hưởng không tải (lúc đó bướm ga mới là chỗ hẹp nhất) mà chỉ
 * cắt khí khi tải cao. Vì vậy lọc tắc cho khói đen KHI CHẠY chứ không phải lúc
 * đứng nổ máy — một dấu hiệu phân biệt rất hữu ích.
 */
export function intakeRestriction01(throttle01, filterClog = 0) {
  const bf = butterflyOpenArea01(throttle01);
  const af = Math.max(CAL.filterCapacity * (1 - clamp(filterClog, 0, 1)), 0.004);
  return 1 / Math.sqrt(1 / bf ** 2 + 1 / af ** 2);
}

/**
 * LƯU LƯỢNG KHÍ (L/phút) — do động cơ HÚT, bị bướm ga và lọc gió cản.
 * Bộ hoà khí không đẩy gì cả; toàn bộ hệ thống là thụ động.
 */
export function airFlowLpm(rpm, throttle01, filterClog = 0) {
  const swept = (ENGINE.disp * (rpm / 2)) / 1000;      // L/phút nếu nạp đầy 100 %
  const r = intakeRestriction01(throttle01, filterClog);
  return swept * veRpm(rpm) * (0.06 + 0.94 * Math.pow(r, 0.7));
}

/**
 * ĐỘ CHÂN KHÔNG dưới van trượt (kPa) theo lưu lượng khí và độ mở van.
 * Tỉ lệ bình phương tốc độ khí qua khe van — chính nó vừa hút xăng vừa nhấc van.
 */
export function depressionKpa(airLpm, lift01) {
  const vMean = (airLpm * 1e6 / 60) / slideGapArea(lift01);   // mm/s
  const v = (CAL.pulse * vMean) / 1000;                       // m/s tức thời
  return (0.5 * 1.184 * v * v) / 1000;                        // kPa
}

/**
 * ĐỘ MỞ VAN TRƯỢT (0…1) — giải phương trình CÂN BẰNG LỰC:
 *     chân_không × diện_tích_màng  =  lực_lò_xo(độ_mở)
 *
 * Đây là điểm quan trọng nhất của bộ hoà khí CV, và độ mở giải ra từ LƯU LƯỢNG
 * KHÍ chứ không từ tay ga. Van mở rộng thì khe khí rộng ra, tốc độ khí giảm, chân
 * không giảm — một vòng hồi tiếp ÂM. Nhờ vòng hồi tiếp đó, tốc độ khí qua khe van
 * được giữ trong một dải hẹp ở tầm ga giữa (chữ CV = constant velocity).
 */
export function slideLift01(rpm, throttle01, filterClog = 0) {
  const q = airFlowLpm(rpm, throttle01, filterClog);
  const { diaphragmArea: Ad, springPreload: F0, springRate: K } = L.slide;
  const bal = (lift) => depressionKpa(q, lift) * 1000 * Ad - (F0 + K * lift);
  if (bal(0) <= 0) return 0;
  if (bal(1) >= 0) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (bal(m) > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * ĐỘ CHÂN KHÔNG SAU BƯỚM GA (kPa) — cao khi bướm ga ĐÓNG, thấp khi mở to.
 * Chính nó nuôi mạch chậm, nên mạch chậm mạnh nhất lúc ga nhỏ.
 */
export function manifoldVacuumKpa(rpm, throttle01) {
  const closed = 1 - butterflyOpenArea01(throttle01);
  return Math.min(62 * closed * clamp(rpm / 3000, 0.25, 1.35), 80);
}

/** Sụt áp qua lọc gió (kPa) — tỉ lệ bình phương lưu lượng. */
export const filterDropKpa = (airLpm, filterClog) =>
  CAL.kFilter * clamp(filterClog, 0, 1) * (airLpm / 100) ** 2;

/**
 * LƯU LƯỢNG XĂNG của từng mạch (g/phút).
 *
 * Hai điểm cơ chế quan trọng, cả hai đều có thật và cả hai đều giải thích được
 * triệu chứng trên xe:
 *
 * 1. MIỆNG PHUN MẠCH CHÍNH NẰM CAO HƠN MẶT XĂNG. Nó chỉ chảy khi độ chân không
 *    thắng được cột xăng. Ở không tải, chân không họng gần như bằng không nên mạch
 *    chính KHÔNG chảy chút nào — và đó chính là lý do bộ hoà khí phải có mạch chậm
 *    riêng. Thấy điều này rõ nhất bằng cách để tay ga 3 %: đồng hồ "xăng mạch
 *    chính" đứng ở 0.
 *
 * 2. BUỒNG PHAO THÔNG HƠI RA KHÍ TRỜI, tức là TRƯỚC lọc gió. Nên sụt áp qua lọc
 *    gió cộng THÊM vào chênh áp hút xăng. Lọc tắc do đó làm GIÀU, và làm giàu ở
 *    nơi lưu lượng lớn, không phải ở không tải.
 */
export function fuelFlows(rpm, throttle01, opt = {}) {
  const {
    filterClog = 0, pilotBlock = 0, mainBlock = 0,
    fuelLevelOffset = 0, choke = false,
  } = opt;

  const lvl = clamp(fuelLevelOffset, -L.fuelLevel.range, L.fuelLevel.range);
  const q = airFlowLpm(rpm, throttle01, filterClog);
  const lift = slideLift01(rpm, throttle01, filterClog);
  const dThroat = depressionKpa(q, lift);
  const dManifold = manifoldVacuumKpa(rpm, throttle01);
  const dFilter = filterDropKpa(q, filterClog);

  // Cửa chuyển tiếp của mạch chậm dần lộ ra phía họng khi bướm ga mở.
  const w = butterflyOpenArea01(throttle01);
  const dPilot = dManifold * (1 - w) + dThroat * w;

  const headKpa = CAL.fuelHeadKpa * (1 - lvl * CAL.levelHead);
  // Mức xăng cao làm NGẬP thêm lỗ nhũ hoá trên ống kim -> bớt khí hiệu chỉnh ->
  // giàu lên. Tác dụng này lớn hơn nhiều tác dụng của cột xăng tĩnh.
  const g = 1 + lvl * CAL.levelGain;

  const dpPilot = Math.max(dPilot + dFilter - headKpa * 0.25, 0);
  const dpMain = Math.max(dThroat + dFilter - headKpa, 0);

  const pilot = CAL.kPilot * PILOT_JET_AREA * Math.sqrt(dpPilot)
    * (1 - clamp(pilotBlock, 0, 1)) * g;
  const main = CAL.kMain * mainCircuitArea(lift, mainBlock) * Math.sqrt(dpMain) * g;
  const chokeFuel = choke
    ? CAL.kPilot * PILOT_JET_AREA * CAL.kChoke * Math.sqrt(dpPilot) * g
    : 0;

  return {
    pilot, main, choke: chokeFuel, total: pilot + main + chokeFuel,
    lift, dThroat, dManifold, dFilter, airLpm: q,
  };
}

/** Lưu lượng khí theo khối lượng (g/phút). */
export const airMassGpm = (rpm, throttle01, filterClog = 0) =>
  airFlowLpm(rpm, throttle01, filterClog) * 1000 * ENGINE.airDensity;

/** TỈ LỆ KHÍ/XĂNG. 14,7 là lý tưởng; dưới 12,2 là giàu; trên 15,6 là nghèo. */
export function afr(rpm, throttle01, opt = {}) {
  const air = airMassGpm(rpm, throttle01, opt.filterClog ?? 0);
  const f = fuelFlows(rpm, throttle01, opt);
  if (f.total <= 1e-9) return 99;
  return clamp(air / f.total, 3, 99);
}

/** Nhận xét bằng lời cho một giá trị AFR. */
export function afrVerdict(v) {
  if (v > 17.5) return { text: 'NGHÈO NGUY HIỂM — dễ cháy piston', level: 'bad' };
  if (v > 15.6) return { text: 'nghèo — nóng máy, hụt ga', level: 'warn' };
  if (v >= 13.4) return { text: 'đúng tầm', level: 'ok' };
  if (v >= 12.2) return { text: 'giàu nhẹ — đúng cho tải nặng', level: 'ok' };
  if (v >= 10.5) return { text: 'giàu — tốn xăng, đóng muội', level: 'warn' };
  return { text: 'GIÀU QUÁ — khói đen, ướt bugi', level: 'bad' };
}

/** Mạch nào đang cấp phần lớn xăng — dùng cho nhãn 3D và phép kiểm. */
export function dominantCircuit(rpm, throttle01, opt = {}) {
  const f = fuelFlows(rpm, throttle01, opt);
  if (f.total <= 1e-9) return 'không có xăng tới';
  if (f.choke > f.pilot && f.choke > f.main) return 'mạch làm đậm (e gió)';
  if (f.pilot >= f.main) return 'mạch chậm (gíc-lơ chậm)';
  return `mạch chính — ${mainCircuitLimiter(f.lift, opt.mainBlock ?? 0)} đang quyết định`;
}

/**
 * ĐƯỜNG TẢI thực tế của xe: ga nhỏ đi với vòng tua thấp, ga to với vòng tua cao.
 * Dùng cho các phép kiểm — đánh giá AFR ở những điểm xe THẬT SỰ chạy qua, chứ
 * không phải ở những cặp (ga, vòng tua) không bao giờ xảy ra.
 */
export const LOAD_LINE = [
  [0.03, 1400], [0.06, 1600], [0.10, 2200], [0.16, 2800], [0.25, 3600],
  [0.35, 4400], [0.50, 5400], [0.65, 6300], [0.80, 7300], [1.00, 8500],
];

/**
 * Vòng tua tương ứng một mức tay ga TRÊN ĐƯỜNG TẢI (nội suy tuyến tính).
 * Dùng để trang mặc định đi theo những điểm làm việc xe thật sự chạy qua — chứ
 * không phải những cặp (tay ga, vòng tua) không bao giờ xảy ra như "vặn hết ga
 * mà vòng tua vẫn 1400".
 */
export function rpmOnLoadLine(throttle01) {
  const t = clamp(throttle01, 0, 1);
  for (let i = 1; i < LOAD_LINE.length; i++) {
    const [t0, r0] = LOAD_LINE[i - 1], [t1, r1] = LOAD_LINE[i];
    if (t <= t1) return Math.round(lerp(r0, r1, (t - t0) / (t1 - t0)));
  }
  return LOAD_LINE[LOAD_LINE.length - 1][1];
}

export const STROKES = ['Nạp', 'Nén', 'Nổ', 'Xả'];
export const strokeIndex = (crankDeg) => Math.floor((((crankDeg % 720) + 720) % 720) / 180);
