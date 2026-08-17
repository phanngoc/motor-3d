/**
 * layout.js — TOÀN BỘ kích thước của hệ thống ly hợp ở một chỗ.
 * Đơn vị: mm. Trục: +X ra phía ngoài xe (phía nắp vỏ ly hợp), +Y lên.
 *
 * BÀI TOÁN BỐ TRÍ (đáng đọc, vì nó giải thích hình dạng thật của bộ nồi):
 *   Hai bộ ly hợp đều có đường kính ~Ø92, tức bán kính ~46 mỗi cái. Nhưng
 *   khoảng cách giữa trục khuỷu và trục sơ cấp chỉ 69,6 mm — nhỏ hơn tổng hai
 *   bán kính (92 mm). Vậy hai bộ KHÔNG THỂ nằm cùng một mặt phẳng: chúng buộc
 *   phải lệch nhau theo trục X.
 *   Hệ quả: bộ nồi li tâm nằm phía NGOÀI, và moay-ơ của nó phải có một ống
 *   dài chạy vào trong để mang bánh răng sơ cấp ăn khớp với chuông ly hợp đa
 *   đĩa nằm phía TRONG. Cái ống dài đó không phải thiết kế tuỳ tiện — nó là
 *   hệ quả bắt buộc của bài toán bao hình.
 *
 * ĐƠN GIẢN HÓA CÓ Ý THỨC:
 *  - Độ lệch dọc trục giữa 2 bộ được phóng lớn hơn xe thật một chút để nhìn rõ.
 *  - Biên dạng răng dạng thang gần đúng.
 *  - Quả búa li tâm mô hình là khối cung tròn quay quanh chốt, không mô phỏng
 *    biên dạng má ma sát thật.
 *  - Số răng chọn lại (20/67) để tỉ số ≈ 3,35 như xe thật mà chân răng bánh
 *    nhỏ vẫn đủ chỗ cho ống moay-ơ.
 *
 * GIỮ ĐÚNG: hai bộ ly hợp nối TIẾP nhau; li tâm đóng theo vòng tua; đa đĩa
 * luôn đóng và chỉ mở trong khoảnh khắc đạp số; thanh đẩy chạy trong lòng trục
 * sơ cấp rỗng; thứ tự xếp đĩa ma sát – đĩa thép.
 */

import { clamp, smoothstep } from '../../lib/geom.js';

/** Bánh răng sơ cấp: tổng răng quyết định khoảng cách trục. */
export const PRIMARY = { module: 1.6, zDrive: 20, zDriven: 67 };
export const PRIMARY_RATIO = PRIMARY.zDriven / PRIMARY.zDrive;      // ≈ 3,35
export const CENTER_DISTANCE = (PRIMARY.module * (PRIMARY.zDrive + PRIMARY.zDriven)) / 2;

export const L = {
  /** Trục khuỷu — mang bộ nồi li tâm. */
  crank: { y: 0, z: 0, r: 10, x0: -30, x1: 96 },

  /** Trục sơ cấp hộp số — mang bộ nồi đa đĩa. Rỗng để thanh đẩy chạy trong. */
  main: { y: -CENTER_DISTANCE, z: 0, r: 9, bore: 4.2, x0: -64, x1: 54 },

  /** Cặp bánh răng sơ cấp (nằm ở phía TRONG, nơi 2 bộ ly hợp gặp nhau). */
  primary: { x0: 0, x1: 11 },

  // ── Ly hợp li tâm (bộ nồi trước) ────────────────────────────────────────────
  cent: {
    /** Ống moay-ơ mang bánh răng sơ cấp, chạy từ bánh răng ra tới chuông. */
    sleeve: { x0: 0, x1: 62, r: 14, bore: 10.4 },
    /** Chuông: mặt trong là bề mặt ma sát cho 3 quả búa. */
    // x0 = 58: bộ đĩa + lò xo của ly hợp đa đĩa kết thúc ở x = 52, nên chuông li
    // tâm phải bắt đầu sau đó mới không chạm (hai bộ có bán kính cộng lại 94 mm >
    // khoảng cách trục 69,6 mm nên bắt buộc phải rời nhau theo X).
    drum: { x0: 58, x1: 84, rIn: 43, rOut: 47, backX: [80, 84] },
    /** Mâm mang búa, then hoa vào trục khuỷu. */
    spider: { x0: 63, x1: 72, r: 16 },
    /** 3 quả búa li tâm. */
    weight: {
      count: 3,
      pivotR: 20,          // bán kính đặt chốt quay
      x0: 65, x1: 78,
      rIn: 24,             // mép trong của khối búa
      rOutFree: 38.5,      // bán kính mặt ma sát khi NHẢ
      rOutLock: 42.8,      // bán kính mặt ma sát khi ĂN (chạm chuông rIn=43)
      halfAngle: 46,       // nửa góc cung của mỗi búa (độ)
    },
    /** Vòng tua bắt đầu và kết thúc quá trình đóng. */
    rpmStart: 1800,
    rpmFull: 2900,
    nut: { af: 24, x: 84 },
  },

  // ── Ly hợp đa đĩa ướt (bộ nồi sau) ──────────────────────────────────────────
  wet: {
    /** Chuông ngoài: mang bánh răng bị động, mở miệng ra phía +X. */
    basket: { webX: [11, 15], cupX: [15, 42], rIn: 44, rOut: 47 },
    /** Moay-ơ then hoa trên trục sơ cấp. */
    hub: { x0: 17, x1: 34, rSpline: 28, rBody: 20 },
    /** Bộ đĩa: 4 đĩa ma sát + 3 đĩa thép -> ma sát nằm ở CẢ HAI đầu. */
    stack: {
      x0: 17,
      friction: { count: 4, t: 2.9, rIn: 27.5, rOut: 42 },
      steel: { count: 3, t: 1.6, rIn: 30, rOut: 45.5, tabR: 46.5 },
      /**
       * Khe hở THẬT mỗi cặp mặt khi ly hợp mở: chỉ ~0,25 mm. Nhân với số cặp
       * mặt ma sát mới ra tổng hành trình cần thiết của tấm ép.
       */
      gapOpen: 0.25,
      /**
       * Hệ số PHÓNG ĐẠI chỉ dùng cho hình ảnh: 0,25 mm trên đĩa Ø90 thì mắt
       * không thấy được. Các phép kiểm luôn dùng gapOpen thật, không dùng số này.
       */
      gapVisual: 5,
    },
    pressure: { t: 4.6, r: 43, bossR: 12 },
    spring: { count: 4, r: 31, rMean: 6.5, wire: 1.5, coils: 5, lenFree: 15, lenFit: 11 },
    bolt: { d: 6, len: 20 },
    nut: { af: 20, x: 12 },
  },

  /** Cơ cấu mở: thanh đẩy chạy TRONG lòng trục sơ cấp rỗng. */
  lifter: {
    rod: { r: 3.7, x0: -58, x1: 40 },
    ball: { r: 4.4, x: 41 },
    /** Cam ở đầu trong, do trục bàn đạp số xoay. */
    cam: { x: -58, r: 13, lobe: 4.2 },
    arm: { x: -62, len: 34, thick: 6 },
    /** Hành trình mở của tấm ép — phải ≥ số cặp mặt × gapOpen. */
    travel: 2.0,
  },

  /** Vỏ ly hợp + gioăng. */
  cover: { x0: 90, t: 7, r: 62, boltR: 56, boltCount: 8 },
  gasket: { x0: 88, t: 1.4 },

  /** Vách lốc máy (ngữ cảnh) — mặt lắp vuông góc trục X. */
  caseX: -8,
};

/**
 * Mức đóng của ly hợp li tâm theo vòng tua: 0 = nhả hẳn, 1 = ăn hẳn.
 * Dưới rpmStart thì búa chưa thắng được lò xo kéo nên xe đứng yên dù đang gài số.
 */
export function centEngage(rpm) {
  const t = clamp((rpm - L.cent.rpmStart) / (L.cent.rpmFull - L.cent.rpmStart), 0, 1);
  return smoothstep(t);
}

/** Bán kính mặt ma sát của quả búa theo mức đóng. */
export const weightRadius = (e) =>
  L.cent.weight.rOutFree + (L.cent.weight.rOutLock - L.cent.weight.rOutFree) * e;

/**
 * Góc lắc của quả búa quanh chốt, suy ra từ bán kính mặt ma sát.
 * Búa quay quanh chốt ở bán kính pivotR; tâm khối búa cách chốt một cánh tay đòn,
 * nên khi búa bung ra bán kính ngoài tăng lên. Ở đây lấy xấp xỉ tuyến tính đủ
 * dùng cho hình ảnh — điều cần đúng là quan hệ ĐƠN ĐIỆU với vòng tua.
 */
export const weightSwing = (e) => e * 9.5;      // độ

/** Tổng chiều dày bộ đĩa (không tính khe hở). */
export function stackThickness() {
  const s = L.wet.stack;
  return s.friction.count * s.friction.t + s.steel.count * s.steel.t;
}

/** Số cặp mặt ma sát = số khe phải tách ra khi mở ly hợp. */
export function frictionFaces() {
  const s = L.wet.stack;
  return s.friction.count + s.steel.count - 1;
}

/**
 * Vị trí X của từng đĩa trong bộ, theo thứ tự lắp thật:
 * ma sát – thép – ma sát – thép – ... – ma sát
 * `open` (0..1) tách các đĩa ra. `exaggerate` chỉ để hiển thị cho dễ nhìn —
 * các phép kiểm gọi với exaggerate = 1 để làm việc trên số liệu thật.
 */
export function plateLayout(open = 0, exaggerate = 1) {
  const s = L.wet.stack;
  const out = [];
  let x = s.x0;
  const total = s.friction.count + s.steel.count;
  for (let i = 0; i < total; i++) {
    const isFriction = i % 2 === 0;
    const spec = isFriction ? s.friction : s.steel;
    // Đĩa thứ i bị đẩy ra thêm i·gap khi mở (đĩa trong cùng đứng yên)
    out.push({ i, isFriction, x: x + open * s.gapOpen * exaggerate * i, t: spec.t, spec });
    x += spec.t;
  }
  return out;
}

/** Chiều dài trục sơ cấp bị bộ đĩa + tấm ép chiếm, để kiểm bao hình. */
export function stackEndX(open = 0) {
  const p = plateLayout(open);
  const last = p[p.length - 1];
  return last.x + last.t;
}
