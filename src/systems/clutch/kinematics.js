/**
 * kinematics.js — Chế độ "Hoạt động" của hệ thống ly hợp.
 *
 * Hai biến đầu vào: VÒNG TUA động cơ và ĐỘ ĐẠP bàn đạp số (0..1).
 *
 * Chuỗi suy diễn theo đúng thứ tự vật lý — đây là chuỗi giải thích toàn bộ
 * "vì sao xe số sang số được mà không cần bóp côn":
 *
 *   vòng tua  -> mức đóng ly hợp li tâm e = centEngage(rpm)
 *                (lực li tâm tỉ lệ BÌNH PHƯƠNG vòng tua nên e tăng rất nhanh)
 *             -> quả búa bung ra, chuông li tâm bị kéo theo: ω_chuông = e · ω_khuỷu
 *             -> qua cặp bánh răng sơ cấp: ω_giỏ = −ω_chuông / 3,35
 *
 *   độ đạp    -> cam xoay -> thanh đẩy đi ra -> tấm ép rời bộ đĩa
 *             -> ly hợp đa đĩa MỞ -> trục sơ cấp KHÔNG còn nhận momen
 *
 * Điểm quan trọng: giỏ (chuông đa đĩa) VẪN QUAY khi ly hợp mở — nó nối cứng với
 * động cơ. Chỉ có moay-ơ và trục sơ cấp là dừng. Bật chế độ này và đạp số ở
 * vòng tua cao sẽ thấy rõ điều đó.
 */

import * as THREE from 'three';
import { deg, clamp } from '../../lib/geom.js';
import { L, PRIMARY_RATIO, centEngage, weightSwing, plateLayout } from './layout.js';

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const ref = {
    spider: P('cent-spider'),
    weights: P('cent-weights'),
    springs: P('cent-springs'),
    drum: P('cent-drum'),
    sleeve: P('cent-sleeve'),
    centNut: P('cent-nut'),
    basket: P('basket'),
    steel: P('steel-plates'),
    friction: P('friction-plates'),
    hub: P('hub'),
    hubNut: P('hub-nut'),
    pressure: P('pressure-plate'),
    cSprings: P('clutch-springs'),
    cBolts: P('clutch-bolts'),
    rod: P('lifter-rod'),
    ball: P('lifter-ball'),
    cam: P('lifter-cam'),
    arm: P('lifter-arm'),
    crank: P('ctx-crank'),
    mainshaft: P('ctx-mainshaft'),
  };
  const weightNodes = ref.weights.inner.userData.nodes.weights;
  const steelNodes = ref.steel.inner.userData.nodes.plates;
  const frictionNodes = ref.friction.inner.userData.nodes.plates;

  /** Trạng thái — UI đọc để vẽ đồng hồ. */
  const state = {
    rpm: 1200,
    pedal: 0,             // 0 = nhả chân, 1 = đạp hết
    centEngage: 0,        // 0..1 mức đóng ly hợp li tâm
    wetOpen: 0,           // 0..1 mức mở ly hợp đa đĩa
    rpmDrum: 0,           // vòng tua chuông li tâm
    rpmBasket: 0,         // vòng tua giỏ ly hợp
    rpmMain: 0,           // vòng tua trục sơ cấp hộp số
    slipCent: 0,          // trượt ở ly hợp li tâm (v/ph)
    moving: false,        // xe có đang được truyền động không
  };

  // Góc tích lũy của từng khâu — phải tích phân, không tính thẳng từ góc đầu vào,
  // vì tỉ lệ truyền thay đổi theo mức trượt.
  let aCrank = 0, aDrum = 0, aBasket = 0, aMain = 0;
  let lastDrive = null;

  function set(driveAngle, dt) {
    const rpm = state.rpm;
    const pedal = state.pedal;

    // ── Ly hợp li tâm ────────────────────────────────────────────────────────
    const e = centEngage(rpm);
    state.centEngage = e;

    // ── Ly hợp đa đĩa ────────────────────────────────────────────────────────
    // Đạp tới ~35% hành trình là ly hợp bắt đầu nhả, tới ~85% là nhả hẳn.
    const open = clamp((pedal - 0.35) / 0.5, 0, 1);
    state.wetOpen = open;

    // ── Tốc độ từng khâu ─────────────────────────────────────────────────────
    const wCrank = rpm;
    const wDrum = rpm * e;                       // trượt khi e < 1
    const wBasket = -wDrum / PRIMARY_RATIO;      // đảo chiều do ăn khớp ngoài
    const wMain = wBasket * (1 - open);          // ly hợp mở thì momen bị ngắt

    state.rpmDrum = Math.abs(wDrum);
    state.rpmBasket = Math.abs(wBasket);
    state.rpmMain = Math.abs(wMain);
    state.slipCent = rpm - Math.abs(wDrum);
    state.moving = Math.abs(wMain) > 1;

    // ── Tích phân góc quay ───────────────────────────────────────────────────
    // driveAngle do system-page cộng dồn theo rpm; ta chỉ cần dt để tích phân.
    if (lastDrive === null) lastDrive = driveAngle;
    lastDrive = driveAngle;
    const k = 6 * dt;                            // v/ph -> độ trong dt giây
    aCrank += wCrank * k;
    aDrum += wDrum * k;
    aBasket += wBasket * k;
    aMain += wMain * k;

    // ── Áp vào mô hình: nhóm quay theo TRỤC KHUỶU ───────────────────────────
    for (const p of [ref.crank, ref.spider, ref.weights, ref.springs, ref.centNut]) {
      p.kin.rot.set(deg(aCrank), 0, 0);
    }
    // ── Nhóm quay theo CHUÔNG li tâm ────────────────────────────────────────
    for (const p of [ref.drum, ref.sleeve]) p.kin.rot.set(deg(aDrum), 0, 0);
    // ── Nhóm quay theo GIỎ (luôn quay khi máy chạy, kể cả lúc mở ly hợp) ────
    ref.basket.kin.rot.set(deg(aBasket), 0, 0);
    for (const n of steelNodes) n.rotation.x = deg(aBasket);
    // ── Nhóm quay theo MOAY-Ơ / trục sơ cấp ─────────────────────────────────
    for (const p of [ref.hub, ref.hubNut, ref.mainshaft, ref.pressure, ref.cSprings, ref.cBolts]) {
      p.kin.rot.set(deg(aMain), 0, 0);
    }
    for (const n of frictionNodes) n.rotation.x = deg(aMain);

    // ── Quả búa bung ra theo mức đóng ───────────────────────────────────────
    const swing = deg(weightSwing(e));
    weightNodes.forEach((n, i) => {
      // Quay quanh chốt của chính nó; chiều quay làm bán kính ngoài TĂNG.
      n.rotation.x = swing * (i % 2 === 0 ? 1 : 1);
    });

    // ── Cơ cấu mở: cam -> thanh đẩy -> bi -> tấm ép ─────────────────────────
    const push = pedal * L.lifter.travel;
    ref.cam.kin.rot.set(deg(pedal * 42), 0, 0);
    ref.arm.kin.rot.set(deg(pedal * 42), 0, 0);
    ref.rod.kin.pos.set(push, 0, 0);
    ref.ball.kin.pos.set(push, 0, 0);
    ref.pressure.kin.pos.set(push, 0, 0);
    ref.cSprings.kin.pos.set(push, 0, 0);
    ref.cBolts.kin.pos.set(push, 0, 0);

    // ── Bộ đĩa tách ra khi mở — nhìn thấy khe hở là hiểu vì sao cần đủ hành trình
    // Phóng đại khe hở CHỈ để nhìn thấy — số liệu thật là 0,25 mm mỗi cặp mặt.
    const layoutOpen = plateLayout(open, L.wet.stack.gapVisual);
    let li = 0, si = 0;
    for (const p of layoutOpen) {
      const node = p.isFriction ? frictionNodes[li++] : steelNodes[si++];
      if (node) node.position.x = p.x - node.userData.baseX;
    }

    asm.refresh();
  }

  /** Hàm điều khiển chuẩn mà system-page gọi mỗi frame. */
  function drive(angle, dt = 0) { set(angle, dt); }

  const setRpm = (v) => { state.rpm = v; };
  const setPedal = (v) => { state.pedal = clamp(v, 0, 1); };

  return { drive, set, state, setRpm, setPedal };
}
