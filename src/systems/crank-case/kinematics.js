/**
 * kinematics.js — Chế độ "Hoạt động" của hệ thống trục khuỷu & lốc máy.
 *
 * Biến đầu vào: góc trục khuỷu θ. Ngoài chuyển động, chế độ này tính LỰC MẤT
 * CÂN BẰNG còn lại theo hệ số cân bằng k — xem giải thích công thức trong
 * layout.js. Đó là phần đáng xem nhất của hệ thống này: nó cho thấy bằng số
 * rằng động cơ một xy-lanh KHÔNG THỂ cân bằng hoàn toàn.
 */

import { deg } from '../../lib/geom.js';
import {
  L, CRANK_R, pinYFromCrank, rodTilt, pistonAccel, unbalancedForce, forcePeaks,
  STROKES, strokeIndex,
} from './layout.js';

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const crank = P('crank');
  const rodNode = crank.inner.userData.nodes.rod;
  const flywheel = P('flywheel');
  const key = P('flywheel-key');
  const flyNut = P('flywheel-nut');
  const piston = P('ctx-piston');
  const pistonSlide = piston.inner.userData.nodes.slider;

  const state = {
    theta: 0,
    rpm: 5000,
    balance: 0.55,        // hệ số cân bằng k
    pinY: 0,              // vị trí tâm chốt piston so với tâm trục khuỷu
    rodTiltDeg: 0,
    accelG: 0,
    fVertical: 0,         // lực mất cân bằng theo phương đứng (N)
    fHorizontal: 0,       // theo phương ngang (N)
    fTotal: 0,
    peakV: 0, peakH: 0, peakTotal: 0,
    stroke: 0,
    strokeName: STROKES[0],
  };

  function drive(thetaDeg) {
    const theta = ((thetaDeg % 720) + 720) % 720;
    state.theta = theta;
    state.stroke = strokeIndex(theta);
    state.strokeName = STROKES[state.stroke];

    // ── Chuyển động ─────────────────────────────────────────────────────────
    const py = pinYFromCrank(theta);
    state.pinY = py;
    const tilt = rodTilt(theta);
    state.rodTiltDeg = (tilt * 180) / Math.PI;
    state.accelG = pistonAccel(theta, state.rpm) / 9.80665;

    for (const p of [crank, flywheel, key, flyNut]) p.kin.rot.set(deg(theta), 0, 0);
    // Tay biên: node con nghiêng, và phải dịch lên tới tâm chốt piston.
    // Node nằm trong `crank` (đã quay theo θ) nên phải bù lại phép quay đó.
    rodNode.rotation.set(-deg(theta) + tilt, 0, 0);
    rodNode.position.set(0, py * Math.cos(deg(theta)), -py * Math.sin(deg(theta)));

    pistonSlide.position.set(0, py, 0);

    // ── Lực mất cân bằng ────────────────────────────────────────────────────
    const f = unbalancedForce(theta, state.rpm, state.balance);
    state.fVertical = f.vertical;
    state.fHorizontal = f.horizontal;
    state.fTotal = Math.hypot(f.vertical, f.horizontal);
    const pk = forcePeaks(state.rpm, state.balance);
    state.peakV = pk.v; state.peakH = pk.h; state.peakTotal = pk.tot;

    asm.refresh();
  }

  const setRpm = (v) => { state.rpm = v; };
  const setBalance = (v) => { state.balance = Math.max(0, Math.min(1, v)); };

  return { drive, state, setRpm, setBalance };
}
