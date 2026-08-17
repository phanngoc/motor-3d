/**
 * kinematics.js — Chế độ "Hoạt động" của hệ thống đánh lửa và điện.
 *
 * Biến dẫn động là GÓC TRỤC KHUỶU (0…720°, một chu kỳ 4 kỳ đầy đủ).
 *
 * Chuỗi phụ thuộc:
 *   góc trục khuỷu → rôto quay → vấu kích qua cuộn kích → xung
 *   vòng tua       → góc đánh lửa sớm (từ hai sự thật vật lý trong layout.js)
 *   tải + khe bugi → điện áp CẦN
 *   vòng tua + bô-bin + khe cuộn kích → điện áp CÓ
 *   có ≥ cần       → TIA LỬA HIỆN RA ở khe bugi
 *
 * Điểm quan trọng: tia lửa trong hình chỉ hiện khi phép so sánh điện áp cho phép.
 * Vì vậy "bỏ máy khi có tải" là thứ NHÌN THẤY ĐƯỢC, không phải chỉ đọc số.
 */

import { deg, clamp } from '../../lib/geom.js';
import {
  L, sparkAdvance, idealAdvance, knockLimited, msToCrankDeg, COMBUSTION,
  requiredKv, availableKv, sparkState, cylinderPressureBar,
  chargeBalance, systemVoltage, breakEvenRpm, loadAmps, alternatorAmps,
  pulserGapAt, strokeIndex, STROKES,
} from './layout.js';

const RO = L.rotor, PL = L.plug, PU = L.pulser;

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const rotor = P('rotor');
  const bendix = P('starter-clutch');
  const ctxCrank = P('ctx-crank');
  const arcNode = P('spark-arc').inner.userData.nodes.arc;
  const groundNode = P('spark-plug').inner.userData.nodes.ground;

  const state = {
    theta: 0,
    rpm: 1400,
    /** Tải động cơ 0…1 — quyết định áp suất trong xy-lanh khi đánh lửa. */
    load: 0.08,

    /** Hỏng hóc mô phỏng. */
    coilHealth: 1,
    plugGap: PL.gapSpec,
    fouled: 0,
    pulserGap: PU.airGapSpec,
    keyShift: 0,
    regulatorOk: true,
    /** Phụ tải điện đang bật. */
    on: { head: true, brake: false, horn: false, signal: false },

    // ── Kết quả ──
    advance: 0,
    advanceIdeal: 0,
    advanceFromDelay: 0,
    knockLimited: false,
    pressureBar: 0,
    needKv: 0,
    haveKv: 0,
    fires: false,
    margin: 0,
    sparking: false,
    strokeName: '',
    genAmps: 0,
    loadAmpsNow: 0,
    netAmps: 0,
    voltage: 0,
    breakEven: 0,
    pulserGapNow: 0,
  };

  const opt = () => ({
    gapMm: state.plugGap,
    coilHealth: state.coilHealth,
    fouled: state.fouled,
    pulserGap: state.pulserGap,
  });

  function drive(thetaDeg, dt = 0) {
    const th = (((thetaDeg % 720) + 720) % 720);
    state.theta = th;
    state.strokeName = STROKES[strokeIndex(th)];

    // ── Góc đánh lửa sớm ─────────────────────────────────────────────────────
    state.advanceIdeal = idealAdvance(state.rpm);
    state.advance = sparkAdvance(state.rpm, state.keyShift);
    state.advanceFromDelay = msToCrankDeg(COMBUSTION.delayMs, state.rpm);
    state.knockLimited = knockLimited(state.rpm);

    // ── Điện áp ──────────────────────────────────────────────────────────────
    state.pressureBar = cylinderPressureBar(state.load);
    const s = sparkState(state.rpm, state.load, opt());
    state.needKv = s.need;
    state.haveKv = s.have;
    state.fires = s.fires;
    state.margin = s.margin;

    // ── Sạc ──────────────────────────────────────────────────────────────────
    const b = chargeBalance(state.rpm, state.on);
    state.genAmps = b.gen;
    state.loadAmpsNow = b.load;
    state.netAmps = b.net;
    state.voltage = systemVoltage(state.rpm, state.on, state.regulatorOk);
    state.breakEven = breakEvenRpm(state.on);

    // ── Hình học ─────────────────────────────────────────────────────────────
    // Rôto quay theo trục khuỷu.
    for (const p of [rotor, bendix, ctxCrank]) p.kin.rot.set(deg(th), 0, 0);
    state.pulserGapNow = pulserGapAt(th, state.pulserGap - PU.airGapSpec);

    // Khe hở bugi nhìn thấy được đúng bằng con số dùng để tính điện áp cần.
    groundNode.position.set(-(state.plugGap - PL.gapSpec), 0, 0);

    /**
     * Tia lửa phóng ở góc `advance` độ TRƯỚC điểm chết trên của kỳ NÉN.
     * Điểm chết trên cuối kỳ nén nằm ở 360° trong chu kỳ 720°.
     * Cho tia hiện trong một cửa sổ hẹp quanh góc đó để mắt kịp thấy.
     */
    const sparkAt = 360 - state.advance;
    const dist = Math.abs((((th - sparkAt) % 720) + 1080) % 720 - 0);
    const near = Math.min(dist, 720 - dist) < 9;
    state.sparking = near && state.fires;
    arcNode.visible = state.sparking;

    return state;
  }

  return {
    state,
    drive,
    setRpm(v) { state.rpm = v; },
    setLoad(v) { state.load = clamp(v, 0, 1); },
    setCoilHealth(v) { state.coilHealth = clamp(v, 0.1, 1); },
    setPlugGap(v) { state.plugGap = clamp(v, PL.gapMin, PL.gapMax); },
    setFouled(v) { state.fouled = clamp(v, 0, 1); },
    setPulserGap(v) { state.pulserGap = clamp(v, PU.airGapSpec, PU.airGapMax); },
    setKeyShift(v) { state.keyShift = clamp(v, -20, 10); },
    setRegulatorOk(v) { state.regulatorOk = !!v; },
    toggleLoad(id) { state.on[id] = !state.on[id]; },
    resetFaults() {
      state.coilHealth = 1; state.plugGap = PL.gapSpec; state.fouled = 0;
      state.pulserGap = PU.airGapSpec; state.keyShift = 0; state.regulatorOk = true;
    },
  };
}
