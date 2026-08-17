/**
 * kinematics.js — Chế độ "Hoạt động" của hệ thống xy-lanh – piston – tay biên.
 *
 * Một biến đầu vào: góc trục khuỷu θ. Chuỗi suy diễn:
 *   θ -> vị trí tâm chốt piston  y = crankY + R·cosθ + √(L² − (R·sinθ)²)
 *     -> đỉnh piston = y + chiều cao nén
 *     -> góc nghiêng tay biên   β = asin(−R·sinθ / L)
 *
 * Điều đáng xem ở đây là VẬN TỐC và GIA TỐC piston. Chúng được lấy bằng vi phân
 * SỐ trên chính hàm vị trí đang dùng để vẽ, nên số hiển thị không thể lệch với
 * hình. Kết quả cho thấy chuyển động piston KHÔNG đối xứng: gia tốc ở điểm chết
 * trên lớn hơn ở điểm chết dưới đúng bằng (1+R/L)/(1−R/L).
 */

import { deg } from '../../lib/geom.js';
import {
  L, CRANK_R, CRANK_Y, pinY, crownY, rodTilt, pistonVelocity, pistonAccel,
  inG, STROKES, strokeIndex,
} from './layout.js';

/** Nhóm chi tiết đi cùng piston. */
const WITH_PISTON = ['piston', 'ring1', 'ring2', 'oil-rails', 'oil-expander', 'pin', 'clips'];
/** Nhóm chi tiết của tay biên (có node nghiêng riêng). */
const ROD_PARTS = ['rod', 'small-bush', 'big-bearing'];

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const withPiston = WITH_PISTON.map(P);
  const rodParts = ROD_PARTS.map((id) => {
    const p = P(id);
    return { part: p, tilt: p.inner.userData.nodes.tilt };
  });
  const crank = P('ctx-crank');

  const state = {
    theta: 0,
    rpm: 3000,
    crownY: 0,          // đỉnh piston (mm, 0 = mặt lắp đầu bò)
    strokePos: 0,       // 0 = ĐCT, 1 = ĐCD
    velocity: 0,        // m/s
    accel: 0,           // m/s²
    accelG: 0,          // số lần g
    rodTiltDeg: 0,
    stroke: 0,
    strokeName: STROKES[0],
  };

  function drive(thetaDeg) {
    const theta = ((thetaDeg % 720) + 720) % 720;
    state.theta = theta;
    state.stroke = strokeIndex(theta);
    state.strokeName = STROKES[state.stroke];

    const y = pinY(theta);
    state.crownY = crownY(theta);
    state.strokePos = (crownY(0) - state.crownY) / L.stroke;

    const v = pistonVelocity(theta, state.rpm);
    const a = pistonAccel(theta, state.rpm);
    state.velocity = v;
    state.accel = a;
    state.accelG = inG(a);

    const tilt = rodTilt(theta);
    state.rodTiltDeg = (tilt * 180) / Math.PI;

    // Piston + xéc-măng + chốt: chỉ TRƯỢT theo Y
    for (const p of withPiston) p.kin.pos.set(0, y, 0);
    // Tay biên: trượt cùng chốt, và node con nghiêng quanh tâm chốt
    for (const r of rodParts) {
      r.part.kin.pos.set(0, y, 0);
      r.tilt.rotation.x = tilt;
    }
    // Trục khuỷu quay
    crank.kin.rot.set(deg(theta), 0, 0);

    asm.refresh();
  }

  const setRpm = (v) => { state.rpm = v; };

  return { drive, state, setRpm };
}
