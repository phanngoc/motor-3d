/**
 * kinematics.js — Chế độ "Hoạt động" của hộp số.
 *
 * Hai biến đầu vào: góc quay trục sơ cấp (θin) và góc trống số (θdrum).
 *
 * Chuỗi suy diễn theo đúng thứ tự vật lý:
 *   θdrum -> vị trí dọc trục của 2 càng cua (đọc rãnh trống)
 *         -> vị trí cài then -> cấp số đang được cài
 *   θin   -> mọi bánh răng chạy lô đều quay: θCi = -θin · zMi/zCi
 *            (LUÔN quay, kể cả cấp số đó không được chọn — đây là điểm cốt lõi
 *             của hộp số ăn khớp thường xuyên)
 *         -> trục thứ cấp chỉ quay khi có cài then khóa: θout = θC(cấp số)
 *
 * VỀ PHA KHI SANG SỐ: sang từ số 1 sang số 2 thì θC1 ≠ θC2 tại cùng θin, nên
 * trục thứ cấp phải nhảy pha. Ngoài đời cái nhảy đó là VA VẤU (tiếng "cục").
 * Ở đây ta bù một lượng pha được LÀM TRÒN về số nguyên lần bước răng của bánh
 * răng đang cài — nhờ tính đối xứng bậc zC, ăn khớp răng vẫn khít tuyệt đối,
 * và vấu cài then chỉ xoay tối đa nửa bước răng khi sang số (không nhìn thấy).
 */

import { deg, clamp } from '../../lib/geom.js';
import {
  L, GEARS, POSITIONS, DRUM_STEP, FORK_TABLE, forkOffset, engagedGear, ratioOf,
} from './layout.js';

const KEYS = ['a', 'b'];

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const ref = {
    main: P('mainshaft'),
    // Khóa theo SỐ CẤP (2,3,4) chứ không theo chỉ số mảng — bánh răng số 1 liền
    // trục nên không có phần tử riêng.
    mainGears: { 2: P('gear-m2'), 3: P('gear-m3'), 4: P('gear-m4') },
    counter: P('countershaft'),
    counterGears: [1, 2, 3, 4].map((n) => P(`gear-c${n}`)),
    slider: { a: P('slider-a'), b: P('slider-b') },
    fork: { a: P('fork-a'), b: P('fork-b') },
    drum: P('drum'),
    stopper: P('drum-stopper'),
    detent: P('detent'),
    spindle: P('shift-spindle'),
    pedal: P('shift-pedal'),
    sprocket: P('front-sprocket'),
    clutch: P('ctx-clutch'),
  };

  const state = {
    input: 0,            // góc trục sơ cấp (độ)
    drum: 0,             // góc trống số (độ)
    gear: 0,             // cấp số đang cài (0 = mo)
    gearName: 'N',
    ratio: 0,            // tỉ số cấp số đang cài
    outRpmFactor: 0,     // tốc độ trục ra / tốc độ trục vào
    slider: { a: 0, b: 0 },   // độ dịch dọc trục (mm)
    counterAngle: 0,
    gearAngles: [0, 0, 0, 0],
  };

  let counterAngle = 0;
  let phase = 0;
  let lastGear = 0;

  /** Góc của bánh răng chạy lô thứ n (1..4) — luôn bị dẫn bởi trục sơ cấp. */
  const freeGearAngle = (n, input) => -input / ratioOf(n);

  function set(inputAngle, drumAngle) {
    state.input = inputAngle;
    state.drum = ((drumAngle % 360) + 360) % 360;

    // ── Trống số -> càng cua -> cài then ──────────────────────────────────────
    for (const k of KEYS) {
      const off = forkOffset(FORK_TABLE[k], state.drum);
      state.slider[k] = off;
      ref.slider[k].kin.pos.set(off, 0, 0);
      ref.fork[k].kin.pos.set(off, 0, 0);
    }
    ref.drum.kin.rot.set(deg(state.drum), 0, 0);
    ref.stopper.kin.rot.set(deg(state.drum), 0, 0);

    const g = engagedGear(state.drum);
    state.gear = g;
    state.gearName = g === 0 ? 'N' : String(g);
    state.ratio = g === 0 ? 0 : ratioOf(g);
    state.outRpmFactor = g === 0 ? 0 : 1 / ratioOf(g);

    // ── Trục sơ cấp + bánh răng cố định ──────────────────────────────────────
    ref.main.kin.rot.set(deg(inputAngle), 0, 0);
    for (let n = 2; n <= 4; n++) ref.mainGears[n].kin.rot.set(deg(inputAngle), 0, 0);
    ref.clutch.kin.rot.set(deg(inputAngle), 0, 0);

    // ── Bánh răng chạy lô: LUÔN quay ─────────────────────────────────────────
    for (let n = 1; n <= 4; n++) {
      const a = freeGearAngle(n, inputAngle);
      state.gearAngles[n - 1] = a;
      ref.counterGears[n - 1].kin.rot.set(deg(a), 0, 0);
    }

    // ── Trục thứ cấp ─────────────────────────────────────────────────────────
    if (g !== lastGear) {
      if (g > 0) {
        // bù pha để trục ra không nhảy, rồi LÀM TRÒN về bước răng của bánh đang cài
        const raw = counterAngle - freeGearAngle(g, inputAngle);
        const toothPitch = 360 / GEARS[g - 1].zC;
        phase = Math.round(raw / toothPitch) * toothPitch;
      }
      lastGear = g;
    }
    if (g > 0) {
      counterAngle = freeGearAngle(g, inputAngle) + phase;
      // bánh răng đang cài quay CÙNG trục -> vấu và lỗ khớp nhau
      ref.counterGears[g - 1].kin.rot.set(deg(counterAngle), 0, 0);
      state.gearAngles[g - 1] = counterAngle;
    }
    state.counterAngle = counterAngle;
    ref.counter.kin.rot.set(deg(counterAngle), 0, 0);
    ref.sprocket.kin.rot.set(deg(counterAngle), 0, 0);
    // cài then quay cùng trục thứ cấp (then hoa)
    for (const k of KEYS) ref.slider[k].kin.rot.set(deg(counterAngle), 0, 0);

    // ── Cần định vị số cưỡi lên đỉnh giữa 2 hốc ──────────────────────────────
    const frac = ((state.drum / DRUM_STEP) % 1 + 1) % 1;
    const ride = Math.sin(Math.PI * frac);              // 0 tại hốc, 1 tại đỉnh
    ref.detent.kin.rot.set(deg(-7 * ride), 0, 0);

    // ── Trục bàn đạp số + bàn đạp lắc theo nhịp sang số ──────────────────────
    const rock = deg(-26 * ride);
    ref.spindle.kin.rot.set(rock, 0, 0);
    ref.pedal.kin.rot.set(rock, 0, 0);

    asm.refresh();
  }

  // ── Chọn cấp số: trống số quay dần tới vị trí đích ─────────────────────────
  let drumAngle = 0;
  let targetDrum = 0;
  const DRUM_SPEED = 240; // độ/giây

  /**
   * Chọn cấp số. Đi theo đường NGẮN NHẤT trên vòng 360° nên trống sẽ lần lượt
   * đi qua các vị trí trung gian — đúng như ngoài đời phải đạp số nhiều nhịp.
   */
  function setGear(g) {
    const t = g * DRUM_STEP;
    const d = ((((t - drumAngle) % 360) + 540) % 360) - 180;
    targetDrum = drumAngle + d;
  }

  /**
   * Hàm điều khiển chuẩn mà system-page gọi mỗi frame.
   * @param inputAngle góc tích lũy của trục sơ cấp (độ)
   * @param dt bước thời gian (giây) — để quay trống số cho mượt
   */
  function drive(inputAngle, dt = 0) {
    const diff = targetDrum - drumAngle;
    if (Math.abs(diff) > 1e-4) {
      drumAngle += Math.sign(diff) * Math.min(DRUM_SPEED * dt, Math.abs(diff));
    }
    state.shifting = Math.abs(targetDrum - drumAngle) > 0.5;
    set(inputAngle, drumAngle);
  }

  /** Đặt trống số tức thời (dùng cho verify và cho các bước tháo lắp). */
  function jumpToGear(g) {
    drumAngle = g * DRUM_STEP;
    targetDrum = drumAngle;
  }

  return { drive, set, setGear, jumpToGear, state, POSITIONS };
}
