/**
 * layout.js — TOÀN BỘ kích thước của hộp số 4 cấp ở một chỗ.
 * Sửa một số ở đây thì hình học, animation và các phép kiểm đều cập nhật theo.
 * Đơn vị: mm. Trục: +Y lên, +X sang phải, +Z về phía sau xe.
 *
 * HÌNH HỌC ĐƯỢC ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Biên dạng răng là dạng thang gần đúng, không phải thân khai (involute) thật.
 *  - Số răng chọn lại để TỔNG RĂNG MỖI CẶP BẰNG NHAU (= 47) — đây là điều kiện
 *    bắt buộc của hộp số ăn khớp thường xuyên: mọi cặp phải cùng khoảng cách
 *    trục. Tỉ số thu được rất gần xe thật.
 *  - Vấu cài then mô hình là chốt tròn + lỗ tròn suốt (xe thật là vấu vuông và
 *    lỗ bậc). Nguyên lý khóa thì y nguyên.
 *  - Cơ cấu con-cóc (ratchet) chỉ mô hình ở mức nhìn thấy được, không mô phỏng
 *    từng bước cóc.
 *
 * CÁI ĐƯỢC GIỮ ĐÚNG: mọi cặp bánh răng LUÔN ăn khớp; sang số chỉ là KHÓA một
 * bánh răng đang chạy lô vào trục; trống số bảo đảm không bao giờ ăn 2 số cùng
 * lúc; bánh răng chạy lô vẫn quay khi số đó không được chọn.
 */

import { clamp, lerp, smoothstep } from '../../lib/geom.js';

/** Module bánh răng — chọn để hộp số vừa trong lốc máy cỡ Wave. */
export const MODULE = 1.6;

/** TỔNG số răng mỗi cặp phải bằng nhau -> mọi cặp cùng khoảng cách trục. */
export const TOOTH_SUM = 47;

/**
 * 4 cặp số. zM = răng bánh chủ động (trục sơ cấp), zC = răng bánh bị động.
 * Tỉ số = zC / zM (>1 là giảm tốc).
 */
/**
 * VỊ TRÍ DỌC TRỤC được tính từ điều kiện lắp, không đặt tay:
 *   khe hở cài then – bánh răng ở vị trí giữa phải ≥ chiều dài vấu (5,5 mm),
 *   nếu không thì vấu đã cắm vào lỗ ngay khi đang ở mo.
 *   -> khoảng trống giữa 2 bánh răng kề cài then = bề rộng cài then + 2 × 6 = 24 mm
 * Cặp 2–3 không có cài then ở giữa nên chỉ cần khe 4 mm.
 */
export const GEARS = [
  { n: 1, zM: 12, zC: 35, x: -47, label: 'Số 1' },
  { n: 2, zM: 16, zC: 31, x: -13, label: 'Số 2' },
  { n: 3, zM: 20, zC: 27, x: 1, label: 'Số 3' },
  { n: 4, zM: 24, zC: 23, x: 35, label: 'Số 4' },
];

export const ratioOf = (g) => GEARS[g - 1].zC / GEARS[g - 1].zM;

export const L = {
  /** Khoảng cách trục — suy ra từ module và tổng răng, không đặt tay. */
  centerDistance: (MODULE * TOOTH_SUM) / 2,

  main: {
    y: 19, z: 0,
    shaftR: 7,          // bánh răng số 1 liền trục nên trục phải nhỏ hơn chân răng
    x0: -68, x1: 50,
    gearW: 10,
    boreR: 7.05,        // lỗ các bánh răng cố định
  },

  counter: {
    y: 19 - (MODULE * TOOTH_SUM) / 2, z: 0,
    shaftR: 8,
    x0: -58, x1: 84,    // đầu phải xuyên ra ngoài lốc máy để lắp nhông trước
    gearW: 10,
    boreR: 9.6,         // lỗ bánh răng chạy lô (có bạc bên trong)
    bushR: 9.5,
  },

  /** Cài then (bộ phận trượt dọc trục để khóa bánh răng vào trục). */
  slider: {
    r: 14,
    w: 12,
    grooveR: 11.5,      // rãnh cho mỏ càng cua
    grooveW: 5,
    dogR: 12.5,         // bán kính đặt vấu
    dogD: 4.0,          // đường kính vấu
    dogCount: 3,
    dogLen: 5.5,        // chiều dài vấu nhô ra khỏi mặt
    travel: 4.5,        // hành trình từ vị trí giữa sang một bên
    // Ở vị trí giữa: khe cài then–bánh răng = 6 mm > dogLen -> vấu chưa ăn.
    // Ở vị trí ăn:   khe = 1,5 mm, vấu cắm sâu 4 mm vào lỗ.
    a: { x: -30, pair: [1, 2] },   // cài then số 1–2
    b: { x: 18, pair: [3, 4] },    // cài then số 3–4
  },

  /** Trục càng cua: 2 càng cùng trượt trên trục này. */
  forkShaft: { y: -2, z: 32, r: 5, x0: -52, x1: 40 },

  /** Trống số. */
  drum: {
    y: -2, z: 56,
    rOuter: 14,
    rGroove: 9.3,       // rãnh sâu 4,7 mm — đủ sâu để nhìn ra là rãnh, không phải vạch
    grooveW: 5.4,
    x0: -44, x1: 32,
    /** Góc (drum-local) mà chốt càng cua tiếp xúc: hướng -Z, tức về phía trục càng. */
    pinAngle: -90,
    detentR: 16,        // vành định vị số ở đầu trống
  },

  fork: { thick: 8, prongThick: 4.2 },

  /** Trục bàn đạp số + cơ cấu con-cóc. */
  spindle: { y: -30, z: 44, r: 6, x0: -40, x1: 78 },

  /** Ổ bi đỡ trục. */
  bearing: { w: 9 },

  /** Nhông trước (truyền động cuối). */
  sprocket: { teeth: 14, pitch: 12.7, w: 7, x: 74 },

  /** Vách lốc máy (ngữ cảnh) — mặt ghép vuông góc trục X. */
  caseLeftX: -64,
  caseRightX: 48,
};

/** 5 vị trí trống số: N, 1, 2, 3, 4 — kiểu XOAY VÒNG, cách nhau 72°. */
export const POSITIONS = ['N', '1', '2', '3', '4'];
export const DRUM_STEP = 360 / POSITIONS.length;

/**
 * Vị trí dọc trục của từng cài then ở mỗi cấp số (đơn vị: mm so với vị trí giữa).
 * Đọc bảng này là hiểu ngay logic trống số: mỗi cấp số CHỈ có tối đa một cài
 * then rời vị trí giữa — đó chính là điều bảo đảm không bao giờ ăn 2 số.
 */
export const FORK_TABLE = {
  //        N   1   2   3   4
  a: [0, -1, +1, 0, 0],
  b: [0, 0, 0, -1, +1],
};

/** Góc trống số ứng với một cấp số (0 = N). */
export const drumAngleFor = (gear) => gear * DRUM_STEP;

/**
 * Độ dịch dọc trục của một càng cua theo góc trống số.
 *
 * ĐIỂM QUAN TRỌNG — TUẦN TỰ HÓA: ở bước chuyển 2->3, cài then A phải VỀ MO
 * trước khi cài then B mới được RỜI MO. Nếu cả hai cùng dịch một lúc thì có
 * khoảnh khắc hai cấp số cùng ăn — hộp số khóa cứng và vỡ răng ngay.
 * Rãnh trống số thật được phay đúng theo nguyên tắc này, nên ở đây ta cũng
 * chia cửa sổ thời gian:
 *   càng ĐANG VỀ MO   -> chạy trong nửa ĐẦU  của bước chuyển
 *   càng ĐANG RỜI MO  -> chạy trong nửa SAU  của bước chuyển
 * Và vì `grooveXAt()` sinh biên dạng rãnh TỪ hàm này, hình học của trống số tự
 * động mang đúng logic đó — không vẽ tay.
 */
export function forkOffset(table, drumAngleDeg) {
  const p = ((((drumAngleDeg % 360) + 360) % 360) / DRUM_STEP);
  const i = Math.floor(p) % POSITIONS.length;
  const j = (i + 1) % POSITIONS.length;
  const t = p - Math.floor(p);
  const from = table[i], to = table[j];
  if (from === to) return from * L.slider.travel;

  let s0, s1;
  if (to === 0) [s0, s1] = [0.10, 0.46];        // về mo: làm sớm
  else if (from === 0) [s0, s1] = [0.54, 0.90]; // rời mo: làm muộn
  else [s0, s1] = [0.14, 0.86];                 // đi thẳng qua mo (vd số 1 -> số 2)

  const s = clamp((t - s0) / (s1 - s0), 0, 1);
  return lerp(from, to, smoothstep(s)) * L.slider.travel;
}

/**
 * Vị trí X tuyệt đối của cài then theo góc trống số.
 */
export function sliderX(key, drumAngleDeg) {
  return L.slider[key].x + forkOffset(FORK_TABLE[key], drumAngleDeg);
}

/**
 * Biên dạng rãnh trên trống số, biểu diễn theo góc DRUM-LOCAL.
 *
 * Suy diễn: chốt càng cua nằm cố định ở góc world tương ứng drum-local
 * `pinAngle - drumAngle`. Muốn vị trí rãnh tại chốt bằng forkOffset(drumAngle),
 * thì rãnh tại góc local α phải nằm ở forkOffset(pinAngle - α).
 * Nhờ vậy rãnh được SINH RA từ bảng cấp số, không vẽ tay.
 */
export function grooveXAt(key, localThetaDeg) {
  return L.slider[key].x + forkOffset(FORK_TABLE[key], L.drum.pinAngle - localThetaDeg);
}

/** Cấp số đang được cài (0 nếu đang ở mo), suy ra từ vị trí thật của cài then. */
export function engagedGear(drumAngleDeg) {
  const eng = L.slider.travel * 0.55;   // vấu đã ăn đủ sâu
  for (const key of ['a', 'b']) {
    const off = forkOffset(FORK_TABLE[key], drumAngleDeg);
    if (Math.abs(off) < eng) continue;
    const [lo, hi] = L.slider[key].pair;
    return off < 0 ? lo : hi;
  }
  return 0;
}
