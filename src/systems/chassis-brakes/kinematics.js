/**
 * kinematics.js — Chế độ "Hoạt động" của khung, treo và phanh.
 *
 * Biến dẫn động là GÓC QUAY BÁNH XE (0…720°, chỉ để bánh lăn cho dễ nhìn). Mọi
 * điều đáng học nằm ở các thanh điều khiển: lực bóp tay, lực đạp chân, mặt đường,
 * tốc độ, và độ dốc khi đổ đèo.
 *
 * Chuỗi phụ thuộc khi phanh — có VÒNG HỒI TIẾP, nên phải giải lặp:
 *   lực tay → áp suất dầu → momen phanh trước → lực phanh
 *   lực phanh → giảm tốc → DỒN TẢI ra bánh trước → bánh trước bám tốt hơn
 *             → phanh được mạnh hơn nữa (và bánh sau nhẹ đi, khoá sớm)
 *
 * Hình học đi theo cùng những con số đó: xe chúi mũi đúng bằng độ lún tính ra,
 * gắp sau nhún theo tải, và ĐỘ VÕNG SÊN tự đổi theo vị trí gắp.
 */

import * as THREE from 'three';
import { deg, clamp, lerp } from '../../lib/geom.js';
import {
  L, G, WHEELBASE, STATIC_FRONT, SWING_R, rearAxleAt, chainSpanAt, chainSpanRange,
  requiredSlack, frontSag, rearSag, brakingSolution, maxDecelFrontOnly, maxDecelRearOnly,
  rearLiftDecel, stoppingDistance, descentTemp, muAtTemp, speedKmh, drumBrakeFactor,
  frontBrakeTorque, rearBrakeTorque, HEAT,
} from './layout.js';
import { sprocketPitchR } from './parts.js';

const WF = L.wheelF, WR = L.wheelR, FK = L.fork, SW = L.swing, FD = L.finalDrive;

/** Tổng "quỹ" chiều dài nhánh dưới của sên, đặt sao cho ở vị trí CĂNG NHẤT còn đúng độ võng nhỏ nhất. */
const SPAN = chainSpanRange();
const CHAIN_BUDGET = 2 * SPAN.hi + (4 * FD.slackSpec[0] ** 2) / SPAN.hi;

/** Độ võng sên ở giữa nhịp, theo vị trí gắp sau. */
export function chainSagAt(dWheelMm) {
  const span = chainSpanAt(dWheelMm);
  const surplus = CHAIN_BUDGET - 2 * span;
  return surplus <= 0 ? 0 : Math.sqrt((surplus * span) / 4);
}

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const fw = P('front-wheel');
  const fwSpin = fw.inner.userData.nodes.spin;
  const rw = P('rear-wheel');
  const rwSpin = rw.inner.userData.nodes.spin;
  const forkOuter = P('fork-outer');
  const forkSlide = forkOuter.inner.userData.nodes.slide;
  const swing = P('swingarm');
  const swingArm = swing.inner.userData.nodes.arm;
  const shockNode = P('rear-shock').inner.userData.nodes.shock;
  const pads = P('brake-caliper').inner.userData.nodes.pads;
  const lever = P('brake-lever-assy').inner.userData.nodes.lever;
  const pedal = P('brake-pedal').inner.userData.nodes.pedal;
  const shoes = P('brake-shoes').inner.userData.nodes.shoes;
  const chainIM = P('chain').inner.userData.nodes.chain;
  const chainCount = P('chain').inner.userData.nodes.count;

  // Các chi tiết đi theo BÁNH TRƯỚC khi phuộc lún
  const frontGroup = ['front-wheel', 'brake-disc', 'brake-caliper', 'fork-outer'].map(P);
  // Các chi tiết đi theo BÁNH SAU khi gắp nhún
  const rearGroup = ['rear-wheel', 'brake-drum', 'brake-shoes', 'rear-sprocket'].map(P);

  const tmp = new THREE.Object3D();
  const pt = new THREE.Vector3();

  const state = {
    spin: 0,
    kmh: 50,
    leverN: 0,
    pedalN: 0,
    wet: false,
    /** Kịch bản đổ đèo. */
    slopePct: 0,
    descentSec: 0,
    useRearOnDescent: true,

    // ── Kết quả phanh ──
    aG: 0,
    frontFrac: STATIC_FRONT,
    rearFrac: 1 - STATIC_FRONT,
    forceF: 0,
    forceR: 0,
    lockF: false,
    lockR: false,
    rearLift: false,
    shareFront: 0,
    stopM: 0,
    braking: false,
    grip: L.gripDry,

    // ── Giới hạn ──
    maxFrontOnly: 0,
    maxRearOnly: 0,
    liftAt: 0,

    // ── Nhiệt ──
    brakeTempC: HEAT.ambient,
    muNow: L.brakeR.muShoe,
    fadePct: 100,

    // ── Treo & sên ──
    sagFrontNow: 0,
    sagRearNow: 0,
    chainSag: 0,
    chainSpan: 0,
    chainSagMin: 0,
    chainSagMax: 0,
    drumFactor: 0,
  };

  // Hằng số cho phần treo
  const sagF0 = frontSag(), sagR0 = rearSag();
  const front0 = { y: FK.axleY, tubes: null };

  /** Đặt vị trí một chuỗi mắt sên dọc nhánh trên (căng) và nhánh dưới (võng). */
  function layChain(dWheel) {
    const fs = FD.frontSprocket;
    const rF = sprocketPitchR(fs.teeth), rR = sprocketPitchR(FD.rearSprocket.teeth);
    const [ay, az] = rearAxleAt(dWheel);
    const span = Math.hypot(ay - fs.y, az - fs.z);
    const sag = chainSagAt(dWheel);
    state.chainSpan = span;
    state.chainSag = sag;

    const half = Math.floor(chainCount / 2);
    const x = -SW.spanX / 2 - 24;
    for (let i = 0; i < chainCount; i++) {
      let y, z;
      if (i < half) {
        // nhánh TRÊN: đường thẳng tiếp tuyến, căng
        const t = i / (half - 1);
        y = lerp(fs.y + rF, ay + rR, t);
        z = lerp(fs.z, az, t);
      } else {
        // nhánh DƯỚI: võng xuống giữa nhịp
        const t = (i - half) / (chainCount - half - 1);
        const u = 1 - t;                      // đi từ bánh sau về nhông trước
        y = lerp(ay - rR, fs.y - rF, t) - sag * 4 * u * (1 - u);
        z = lerp(az, fs.z, t);
      }
      tmp.position.set(x, y, z);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      chainIM.setMatrixAt(i, tmp.matrix);
    }
    chainIM.instanceMatrix.needsUpdate = true;
  }

  function drive(thetaDeg, dt = 0) {
    state.spin = thetaDeg;
    state.grip = state.wet ? L.gripWet : L.gripDry;

    // ── Nhiệt phanh khi đổ đèo ───────────────────────────────────────────────
    const which = state.useRearOnDescent ? 'drum' : 'disc';
    if (state.slopePct > 0 && state.descentSec > 0) {
      const d = descentTemp(state.slopePct, state.kmh, state.descentSec, which);
      state.brakeTempC = d.temp;
      state.muNow = d.mu;
      state.fadePct = (d.mu / d.mu0) * 100;
    } else {
      state.brakeTempC = HEAT.ambient;
      state.muNow = which === 'drum' ? L.brakeR.muShoe : L.brakeF.muPad;
      state.fadePct = 100;
    }
    const muPad = which === 'disc' ? state.muNow : L.brakeF.muPad;
    const muShoe = which === 'drum' ? state.muNow : L.brakeR.muShoe;

    // ── Bài toán phanh ───────────────────────────────────────────────────────
    const s = brakingSolution(state.leverN, state.pedalN, { grip: state.grip, muPad, muShoe });
    state.aG = s.a;
    state.frontFrac = s.frontFrac;
    state.rearFrac = s.rearFrac;
    state.forceF = s.fF;
    state.forceR = s.fR;
    state.lockF = s.lockF;
    state.lockR = s.lockR;
    state.rearLift = s.rearLift;
    state.shareFront = s.shareFront;
    // Giữ HỮU HẠN để mọi phép quét số không gặp Infinity; giao diện tự hiện '—'.
    state.braking = state.aG > 1e-4;
    state.stopM = state.braking ? stoppingDistance(state.kmh, state.aG) : 0;

    state.maxFrontOnly = maxDecelFrontOnly(state.grip);
    state.maxRearOnly = maxDecelRearOnly(state.grip);
    state.liftAt = rearLiftDecel();
    state.drumFactor = drumBrakeFactor(muShoe).total;

    // ── Treo: chúi mũi theo chuyển tải ───────────────────────────────────────
    // Tải trước tăng thì phuộc lún thêm; tải sau giảm thì gắp nhả ra.
    const loadF = L.mass * G * state.frontFrac;
    const loadR = L.mass * G * state.rearFrac;
    state.sagFrontNow = Math.min(loadF / FK.rate, FK.travel);
    state.sagRearNow = Math.min(loadR / sagR0.rateAtWheel, SW.travelWheel);

    const dFront = state.sagFrontNow - sagF0.mm;      // dương = lún thêm
    const dRear = -(state.sagRearNow - sagR0.mm);     // dương = bánh sau ĐI XUỐNG so với xe

    // Phần trước hạ xuống theo trục phuộc (gần đúng theo phương thẳng đứng)
    forkSlide.position.set(0, -dFront, 0);
    for (const p of frontGroup) p.kin.pos.set(0, -dFront, 0);

    // Gắp sau quay quanh trục gắp; bánh sau đi theo cung tròn
    const dWheel = -dRear;                            // dương = bánh đi LÊN so với xe
    swingArm.rotation.set(dWheel / SWING_R, 0, 0);
    const [ay, az] = rearAxleAt(dWheel);
    for (const p of rearGroup) {
      p.kin.pos.set(0, ay - SW.axle[0], az - SW.axle[1]);
    }
    // Giảm chấn co lại theo hành trình
    shockNode.scale.set(1, 1, 1);
    shockNode.position.set(0, dWheel * 0.55, 0);

    // ── Bánh lăn ─────────────────────────────────────────────────────────────
    const roll = deg(thetaDeg);
    fwSpin.rotation.set(roll, 0, 0);
    rwSpin.rotation.set(roll * (WF.r / WR.r), 0, 0);

    // ── Cơ cấu phanh ─────────────────────────────────────────────────────────
    const lv = clamp(state.leverN / 300, 0, 1);
    lever.rotation.set(0, -lv * deg(22), 0);
    for (const [i, c] of pads.children.entries()) {
      c.position.set((i === 0 ? 1 : -1) * lv * 1.6, 0, 0);
    }
    const pd = clamp(state.pedalN / 300, 0, 1);
    pedal.rotation.set(-pd * deg(14), 0, 0);
    for (const [i, c] of shoes.children.entries()) {
      const dir = i === 0 ? 1 : -1;
      c.position.set(0, dir * pd * 2.2, 0);
    }

    // ── Sên ──────────────────────────────────────────────────────────────────
    layChain(dWheel);
    state.chainSagMin = chainSagAt(SPAN.hiAt);
    state.chainSagMax = chainSagAt(-SW.travelWheel * 0.4);

    return state;
  }

  return {
    state,
    drive,
    setKmh(v) { state.kmh = v; },
    setLever(v) { state.leverN = clamp(v, 0, 300); },
    setPedal(v) { state.pedalN = clamp(v, 0, 300); },
    setWet(v) { state.wet = !!v; },
    setSlope(v) { state.slopePct = clamp(v, 0, 20); },
    setDescentSec(v) { state.descentSec = clamp(v, 0, 600); },
    setUseRearOnDescent(v) { state.useRearOnDescent = !!v; },
    reset() {
      state.leverN = 0; state.pedalN = 0; state.wet = false;
      state.slopePct = 0; state.descentSec = 0;
    },
    /** Dùng cho phép kiểm: quỹ chiều dài sên và biên độ độ võng. */
    chainSagAt,
    chainBudget: CHAIN_BUDGET,
  };
}
