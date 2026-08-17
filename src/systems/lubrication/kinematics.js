/**
 * kinematics.js — Chuyển động và số liệu của hệ thống bôi trơn.
 *
 * Biến dẫn động là GÓC TRỤC KHUỶU. Từ đó suy ra:
 *   góc rôto trong = góc trục khuỷu × (răng trục khuỷu / răng nhông bơm)
 *   góc rôto ngoài = góc rôto trong × n/(n+1)        <- tỉ số của bơm ăn trong
 *   lưu lượng      = thể tích riêng × vòng tua rôto  <- bơm THỂ TÍCH
 *   áp suất        = lưu lượng × sức cản đường nhớt  <- bơm KHÔNG tạo áp suất
 *
 * Chỗ then chốt: `flowLpm` và `pressureKpa` nằm trong layout.js, dùng CHUNG cho
 * cả đồng hồ số lẫn tốc độ hạt nhớt chạy trong ống. Nhìn dòng chảy nhanh lên là
 * số lưu lượng cũng lên — không thể lệch nhau.
 */

import * as THREE from 'three';
import { deg, clamp } from '../../lib/geom.js';
import {
  L, ROTOR_RATIO, PUMP_DRIVE_RATIO, PUMP_CC_PER_REV, outerCenter,
  flowLpm, pressureKpa, reliefOpen, filterEfficiency, sludgeToKm, OIL_PATH,
} from './layout.js';
import { OIL_CURVE } from './parts.js';

const PU = L.pump, RV = L.relief, CF = L.cf;

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const rotorIn = P('rotor-inner');
  const rotorOut = P('rotor-outer');
  const shaft = P('pump-shaft');
  const gear = P('pump-gear');
  const cfHousing = P('cf-housing');
  const cfSludgeP = P('cf-sludge');
  const ctxCrank = P('ctx-crank');
  const flowP = P('oil-flow');
  const flow = flowP.inner.userData.nodes.flow;
  const flowCount = flowP.inner.userData.nodes.count;
  const ball = P('relief-valve').inner.userData.nodes.ball;
  const sludgeNode = cfSludgeP.inner.userData.nodes.sludge;

  const tmp = new THREE.Object3D();
  const pos = new THREE.Vector3();
  const curveLen = OIL_CURVE.getLength();

  const state = {
    crankAngle: 0,
    rpm: 3000,
    /** Sức cản đường nhớt: 1,0 = khe hở còn mới. Nhỏ hơn = khe hở đã mòn rộng. */
    resist: 1.0,
    /** Hệ số mòn bơm: 1,0 = bơm mới. Lớn hơn = ba khe hở đã rộng. */
    wear: 1.0,
    /** Độ dày lớp cặn trong buồng lọc (mm). */
    sludge: 0.6,

    rotorInAngle: 0,
    rotorOutAngle: 0,
    flowLpm: 0,
    pressureKpa: 0,
    reliefOpen: false,
    filterEff: 1,
    sludgeKm: 0,
    dropSpeed: 0,
    stationName: '',
  };

  /** Pha dòng chảy tích lũy — phải tích lũy chứ không suy từ góc, vì tốc độ đổi. */
  let flowPhase = 0;

  function drive(crankAngleDeg, dt = 0) {
    state.crankAngle = crankAngleDeg;

    // ── Hình học: hai rôto ───────────────────────────────────────────────────
    const aIn = crankAngleDeg * PUMP_DRIVE_RATIO;
    const aOut = aIn * ROTOR_RATIO;
    state.rotorInAngle = ((aIn % 360) + 360) % 360;
    state.rotorOutAngle = ((aOut % 360) + 360) % 360;

    // Mỗi chi tiết quay quanh trục X đi qua pivot đã khai báo trong parts.js.
    for (const p of [rotorIn, shaft, gear]) p.kin.rot.set(deg(aIn), 0, 0);
    rotorOut.kin.rot.set(deg(aOut), 0, 0);
    // Buồng lọc li tâm quay theo TRỤC KHUỶU, không theo bơm.
    for (const p of [cfHousing, cfSludgeP, ctxCrank]) p.kin.rot.set(deg(crankAngleDeg), 0, 0);

    // ── Số liệu: lưu lượng và áp suất ────────────────────────────────────────
    state.flowLpm = flowLpm(state.rpm, state.wear);
    state.pressureKpa = pressureKpa(state.rpm, state.resist, state.wear);
    state.reliefOpen = reliefOpen(state.rpm, state.resist, state.wear);

    // Bi van an toàn nhấc lên khi quá áp
    if (ball) {
      const open = state.reliefOpen ? 3.2 : 0;
      ball.position.set(open, 0, 0);
    }

    // ── Lớp cặn trong buồng lọc ──────────────────────────────────────────────
    state.filterEff = filterEfficiency(state.sludge);
    state.sludgeKm = sludgeToKm(state.sludge);
    if (sludgeNode) {
      // Hình dựng ở độ dày tối đa; co lại theo bán kính quanh tâm trục khuỷu.
      const t = clamp(state.sludge / CF.sludgeMax, 0.001, 1);
      sludgeNode.visible = state.sludge > 0.05;
      // Ép vành cặn mỏng đi bằng cách kéo nó ra sát thành buồng.
      const shrink = 1 - (1 - t) * (CF.sludgeMax / (CF.rIn - 0.3));
      sludgeNode.scale.set(1, shrink, shrink);
      // `inner` đã dịch đi -pivot nên tâm trục khuỷu ở toạ độ local là -pivot.
      const cy = L.crank.y - cfSludgeP.pivot[1];
      const cz = L.crank.z - cfSludgeP.pivot[2];
      sludgeNode.position.set(0, cy * (1 - shrink), cz * (1 - shrink));
    }

    // ── Dòng nhớt chạy trong ống ─────────────────────────────────────────────
    // Tốc độ hạt tỉ lệ với LƯU LƯỢNG — cùng một con số hiện trên đồng hồ.
    state.dropSpeed = state.flowLpm * 0.055;
    flowPhase = (flowPhase + state.dropSpeed * Math.max(dt, 0)) % 1;
    if (!Number.isFinite(flowPhase)) flowPhase = 0;

    if (flow && flowCount > 0) {
      for (let i = 0; i < flowCount; i++) {
        const u = (flowPhase + i / flowCount) % 1;
        OIL_CURVE.getPointAt(u, pos);
        tmp.position.copy(pos);
        // Hạt nhỏ dần khi đi lên cao (áp suất giảm dần dọc mạch)
        const sc = 0.55 + 0.45 * (1 - u);
        tmp.scale.setScalar(sc);
        tmp.updateMatrix();
        flow.setMatrixAt(i, tmp.matrix);
      }
      flow.instanceMatrix.needsUpdate = true;
    }

    // Chặng hiện tại của dòng nhớt
    const idx = clamp(Math.floor(flowPhase * (OIL_PATH.length - 1)), 0, OIL_PATH.length - 1);
    state.stationName = OIL_PATH[idx][0];

    return state;
  }

  return {
    state,
    drive,
    /** Chiều dài mạch nhớt (mm) — dùng cho phép kiểm. */
    circuitLength: curveLen,
    setRpm(v) { state.rpm = v; },
    setResist(v) { state.resist = v; },
    setWear(v) { state.wear = v; },
    setSludge(v) { state.sludge = v; },
  };
}
