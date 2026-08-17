/**
 * index.js — Module hệ thống 09: Khung sườn, treo, truyền động cuối & phanh.
 *
 * Ba bài, tất cả đều tính ra số:
 *
 *  1. CHUYỂN TẢI KHI PHANH. Phanh làm dồn tải ra bánh trước, nên phanh trước một
 *     mình dừng được nhanh hơn phanh sau một mình khoảng 2,4 lần. Con số này giải
 *     bằng phương trình hồi tiếp, không phải áng.
 *
 *  2. TỰ CƯỜNG HOÁ của phanh tang trống. Má dẫn bị ma sát kéo thêm vào lòng trống
 *     nên momen phanh phụ thuộc μ rất dốc — dốc gấp hơn hai lần phanh đĩa. Đó là
 *     lý do phanh cơ vừa dễ bó vừa mất nhiều lực khi ướt hoặc nóng.
 *
 *  3. ĐỘ VÕNG SÊN suy ra ĐÚNG từ cung quay của gắp sau. Con số hãng ghi trong sách
 *     không phải quy ước — nó là kết quả của hình học, và trang này tính lại được.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, G, WHEELBASE, STATIC_FRONT, SWING_R, trail, trailFromAxes, forkAxisZ, steerAxisZ,
  chainSpanAt, chainSpanRange,
  requiredSlack, frontSag, rearSag, bumpTravel, HYDRAULIC_GAIN,
  frontBrakeTorque, rearBrakeTorque, drumBrakeFactor, frontLoadFraction,
  brakingSolution, maxDecelFrontOnly, maxDecelRearOnly, rearLiftDecel, rearAxleAt,
  stoppingDistance, descentTemp, muAtTemp, speedKmh, overallRatio, FINAL_RATIO, HEAT,
} from './layout.js';
import { PARTS, sprocketPitchR } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics, chainSagAt } from './kinematics.js';

const WF = L.wheelF, WR = L.wheelR, FK = L.fork, SW = L.swing, FD = L.finalDrive;
const BF = L.brakeF, BR = L.brakeR;
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const vn = (v, d = 1) => v.toFixed(d).replace('.', ',');
const pc = (v) => `${Math.round(v * 100)} %`;

// ─────────────────────────────────────────────────────────────────────────────
// KIỂM TRA KỸ THUẬT
// ─────────────────────────────────────────────────────────────────────────────

const checks = [
  {
    name: 'Phân bố tải TĨNH hợp lý cho xe số (trước nhẹ hơn sau)',
    run() {
      return { pass: STATIC_FRONT > 0.40 && STATIC_FRONT < 0.50,
        msg: `khối tâm ở z=${L.cg.z} mm, cơ sở ${WHEELBASE} mm → trước ${pc(STATIC_FRONT)} / `
          + `sau ${pc(1 - STATIC_FRONT)}. Người ngồi lùi về sau nên bánh sau chịu nhiều hơn.` };
    },
  },
  {
    name: 'ĐỘ LỆCH ĐUÔI dương — bánh trước tự trả về giữa',
    run() {
      const t = trail();
      return { pass: t > 60 && t < 110,
        msg: `góc trục lái ${L.steer.rakeDeg}° · độ lệch càng ${L.steer.offset} mm → độ lệch đuôi `
          + `${f1(t)} mm. Dương nghĩa là điểm tiếp đất nằm SAU nơi trục lái cắt mặt đất, nên phản `
          + `lực đường luôn kéo bánh về thẳng. Âm thì xe sẽ không thể đi thẳng được.` };
    },
  },
  {
    name: 'Hình học lái TỰ NHẤT QUÁN — hai cách tính độ lệch đuôi cho cùng một số',
    run() {
      const a = trail(), b = trailFromAxes();
      const axleOnAxis = Math.abs(forkAxisZ(L.wheelF.r) - L.wheelF.z);
      return { pass: Math.abs(a - b) < 1e-9 && axleOnAxis < 1e-9,
        msg: `theo công thức R·tan(rake) − offset/cos(rake) = ${f2(a)} mm; đo trực tiếp trên hình `
          + `(z tiếp đất bánh ${L.wheelF.z} − z trục lái cắt đất ${f1(steerAxisZ(0))}) = ${f2(b)} mm. `
          + `Khớp nhau, và trục bánh nằm đúng trên trục càng (lệch ${axleOnAxis.toExponential(0)} mm) `
          + `— nên góc trục lái, độ lệch càng và vị trí bánh không thể mâu thuẫn.` };
    },
  },
  {
    name: 'ĐỘ LÚN TĨNH của cả hai đầu nằm trong khoảng 25–35 % hành trình',
    run() {
      const f = frontSag(), r = rearSag();
      const ok = f.frac > 0.22 && f.frac < 0.38 && r.frac > 0.22 && r.frac < 0.38;
      return { pass: ok,
        msg: `trước ${f1(f.mm)} mm = ${pc(f.frac)} hành trình (${L.fork.travel} mm) · `
          + `sau ${f1(r.mm)} mm = ${pc(r.frac)} (${SW.travelWheel} mm). `
          + `Lún ít hơn thì bánh nảy khỏi mặt đường; nhiều hơn thì hết hành trình khi gặp hố.` };
    },
  },
  {
    name: 'Tỉ số đòn giảm chấn sau chia BÌNH PHƯƠNG, không chia một lần',
    run() {
      const r = rearSag();
      const naive = L.shock.rateAtShock / L.shock.leverage;
      return { pass: Math.abs(r.rateAtWheel - L.shock.rateAtShock / L.shock.leverage ** 2) < 1e-6,
        msg: `${L.shock.rateAtShock} N/mm tại giảm chấn, tỉ số đòn ${L.shock.leverage} → quy về `
          + `bánh xe là ${f1(r.rateAtWheel)} N/mm. Nếu chia một lần sẽ ra ${f1(naive)} N/mm — sai, `
          + `vì đòn vừa nhân LỰC vừa chia CHUYỂN VỊ nên độ cứng đổi theo bình phương.` };
    },
  },
  {
    name: 'Còn đủ hành trình treo khi gặp cú xóc 2,5 lần tải tĩnh',
    run() {
      const b = bumpTravel(2.5);
      return { pass: b.frontLeft > 0 && b.rearLeft > 0,
        msg: `xóc 2,5 g: trước lún ${f1(b.front)} mm còn thừa ${f1(b.frontLeft)} mm · `
          + `sau lún ${f1(b.rear)} mm còn thừa ${f1(b.rearLeft)} mm. Hết hành trình là "chạm đáy", '
          + 'lúc đó bánh mất bám hoàn toàn.`.replace(/'\s*\+\s*'/g, '') };
    },
  },

  // ── Phanh: chuỗi lực ─────────────────────────────────────────────────────
  {
    name: 'Mạch thuỷ lực nhân lực đúng bằng TỈ LỆ DIỆN TÍCH pít-tông',
    run() {
      const exact = (BF.caliperPistonD / BF.masterPistonD) ** 2;
      return { pass: Math.abs(HYDRAULIC_GAIN - exact) < 1e-9,
        msg: `Ø${BF.masterPistonD} mm → Ø${BF.caliperPistonD} mm cho hệ số `
          + `${f2(HYDRAULIC_GAIN)} = (${BF.caliperPistonD}/${BF.masterPistonD})². `
          + `Cộng tỉ số tay bóp ${BF.leverRatio} thì tổng là `
          + `${f1(HYDRAULIC_GAIN * BF.leverRatio)} lần — 100 N ngón tay thành `
          + `${Math.round(100 * HYDRAULIC_GAIN * BF.leverRatio)} N ép má.` };
    },
  },
  {
    name: 'Momen phanh ĐĨA tỉ lệ TUYẾN TÍNH với lực bóp và với μ',
    run() {
      const a = frontBrakeTorque(100), b = frontBrakeTorque(200);
      const c = frontBrakeTorque(100, BF.muPad * 0.7);
      const linLever = Math.abs(b / a - 2) < 1e-9;
      const linMu = Math.abs(c / a - 0.7) < 1e-9;
      return { pass: linLever && linMu,
        msg: `100 N → ${f1(a)} N·m, 200 N → ${f1(b)} N·m (gấp đúng 2 lần) · `
          + `μ giảm 30 % → momen giảm đúng 30 % (${f1(c)} N·m). `
          + `Tuyến tính nên phanh đĩa dễ điều khiển và dễ đoán.` };
    },
  },
  {
    name: 'MÁ DẪN tự cường hoá mạnh hơn MÁ BỊ rất nhiều',
    run() {
      const d = drumBrakeFactor();
      return { pass: d.leading > d.trailing * 1.8,
        msg: `ở μ = ${BR.muShoe}: má DẪN góp ${f2(d.leading)}, má BỊ chỉ góp ${f2(d.trailing)} — `
          + `gấp ${f1(d.leading / d.trailing)} lần. Vì má dẫn bị ma sát KÉO THÊM vào lòng trống `
          + `(mẫu số 1 − μ·e nhỏ đi) còn má bị bị đẩy ra (mẫu số 1 + μ·e lớn lên). `
          + `Đó cũng là lý do má dẫn luôn mòn nhanh hơn.` };
    },
  },
  {
    name: 'PHANH CƠ nhạy với μ hơn PHANH ĐĨA gấp hơn hai lần — nên vừa dễ bó vừa dễ mất lực',
    run() {
      const mu0 = BR.muShoe, mu1 = mu0 * 0.7;      // μ tụt 30 % (ướt hoặc nóng)
      const drumLoss = 1 - drumBrakeFactor(mu1).total / drumBrakeFactor(mu0).total;
      const discLoss = 1 - frontBrakeTorque(100, BF.muPad * 0.7) / frontBrakeTorque(100);
      return { pass: drumLoss > discLoss * 1.4,
        msg: `μ tụt 30 %: phanh ĐĨA mất ${pc(discLoss)} momen (đúng 30 %, vì tuyến tính) · `
          + `phanh TRỐNG mất ${pc(drumLoss)}. Cùng một mức tụt ma sát mà trống mất gấp `
          + `${f1(drumLoss / discLoss)} lần — đó là mặt tối của tự cường hoá.` };
    },
  },

  // ── Phanh: chuyển tải ────────────────────────────────────────────────────
  {
    name: 'PHANH LÀM DỒN TẢI ra bánh trước, và dồn theo đúng h/L',
    run() {
      const rows = [0, 0.3, 0.6, 0.9].map((a) => frontLoadFraction(a));
      const step = (L.cg.y / WHEELBASE) * 0.3;
      const linear = Math.abs((rows[1] - rows[0]) - step) < 1e-9;
      return { pass: linear && rows[3] > 0.8,
        msg: `giảm tốc 0 / 0,3 / 0,6 / 0,9 g → tải trước ${rows.map((v) => pc(v)).join(' / ')}. `
          + `Mỗi 0,1 g dồn thêm ${pc(L.cg.y / WHEELBASE * 0.1)} tải ra trước — đúng bằng `
          + `chiều cao khối tâm (${L.cg.y} mm) chia chiều dài cơ sở (${WHEELBASE} mm).` };
    },
  },
  {
    name: 'PHANH TRƯỚC một mình mạnh hơn PHANH SAU một mình khoảng 2,4 lần',
    run() {
      const f = maxDecelFrontOnly(), r = maxDecelRearOnly();
      const df = stoppingDistance(50, f), dr = stoppingDistance(50, r);
      return { pass: f > r * 2 && f < r * 3,
        msg: `mặt khô μ=${L.gripDry}: chỉ phanh trước ${f2(f)} g · chỉ phanh sau ${f2(r)} g — `
          + `gấp ${f1(f / r)} lần. Từ 50 km/h: ${f1(df)} m so với ${f1(dr)} m. `
          + `Vì phanh làm dồn tải ra TRƯỚC nên bánh trước càng phanh càng bám, còn bánh sau càng '
          + 'phanh càng nhẹ và khoá sớm.`.replace(/'\s*\+\s*'/g, '') };
    },
  },
  {
    name: 'Giới hạn của phanh sau là TỰ GIỚI HẠN, không phải do cơ cấu yếu',
    run() {
      // Cho lực đạp rất lớn: bánh sau khoá, và gia tốc dừng ở đúng trần lý thuyết
      const s = brakingSolution(0, 300);
      const s2 = brakingSolution(0, 200);
      const cap = maxDecelRearOnly();
      return { pass: s.lockR && Math.abs(s.a - cap) < 0.03 && s.capR > s.fR * 1.1,
        msg: `đạp 300 N: cơ cấu tạo được ${Math.round(s.capR)} N ở vành lốp nhưng lốp chỉ nhận `
          + `được ${Math.round(s.fR)} N — phần dư thành TRƯỢT. Giảm tốc dừng ở ${f2(s.a)} g, đúng `
          + `trần lý thuyết ${f2(cap)} g. Đạp 200 N đã cho ${f2(s2.a)} g, nên đạp mạnh thêm 100 N `
          + `nữa gần như không được gì.` };
    },
  },
  {
    name: 'Bánh sau BỔNG lên trước khi lốp trước hết bám — nên xe số khó bốc đầu ngược',
    run() {
      const lift = rearLiftDecel();
      return { pass: lift > L.gripDry,
        msg: `bánh sau bổng khi giảm tốc đạt ${f2(lift)} g, còn lốp trên đường khô chỉ cho tối đa `
          + `${f2(L.gripDry)} g. Vì ${f2(lift)} > ${f2(L.gripDry)} nên trên đường khô lốp trượt '
          + 'TRƯỚC khi xe chúi lộn — khối tâm đủ thấp và đủ lùi về sau.`.replace(/'\s*\+\s*'/g, '') };
    },
  },
  {
    name: 'DÙNG CẢ HAI PHANH tốt hơn dùng riêng phanh trước',
    run() {
      const both = brakingSolution(220, 140);
      const fOnly = brakingSolution(220, 0);
      return { pass: both.a > fOnly.a,
        msg: `tay 220 N một mình: ${f2(fOnly.a)} g (${f1(stoppingDistance(50, fOnly.a))} m) · `
          + `thêm chân 140 N: ${f2(both.a)} g (${f1(stoppingDistance(50, both.a))} m). `
          + `Phanh sau góp ${pc(1 - both.shareFront)} tổng lực phanh — nhỏ nhưng không bỏ được, `
          + `và nó còn giúp xe ổn định vì kéo đuôi xe thẳng lại.` };
    },
  },
  {
    name: 'ĐƯỜNG ƯỚT: cùng lực bóp mà quãng phanh dài hơn rõ',
    run() {
      const dry = brakingSolution(250, 150, { grip: L.gripDry });
      const wet = brakingSolution(250, 150, { grip: L.gripWet });
      const dd = stoppingDistance(50, dry.a), dw = stoppingDistance(50, wet.a);
      return { pass: dw > dd * 1.5,
        msg: `tay 250 + chân 150 N: khô ${f2(dry.a)} g → ${f1(dd)} m · ướt ${f2(wet.a)} g → `
          + `${f1(dw)} m. Dài gấp ${f1(dw / dd)} lần, và cả hai bánh đều KHOÁ khi ướt `
          + `(${wet.lockF ? 'trước' : ''}${wet.lockF && wet.lockR ? ' + ' : ''}${wet.lockR ? 'sau' : ''}) `
          + `— tức đang trượt, không phải đang phanh.` };
    },
  },

  // ── Đổ đèo ───────────────────────────────────────────────────────────────
  {
    name: 'ĐỔ ĐÈO bằng phanh SAU: mất phần lớn lực phanh sau vài phút',
    run() {
      const t0 = descentTemp(10, 40, 0, 'drum');
      const t2 = descentTemp(10, 40, 120, 'drum');
      const t4 = descentTemp(10, 40, 240, 'drum');
      const loss = 1 - rearBrakeTorque(200, t4.mu) / rearBrakeTorque(200, t0.mu);
      return { pass: loss > 0.5,
        msg: `dốc 10 %, 40 km/h → phải triệt ${Math.round(t0.P)} W liên tục. Trống: `
          + `${Math.round(t0.temp)} °C → ${Math.round(t2.temp)} °C sau 2 phút → `
          + `${Math.round(t4.temp)} °C sau 4 phút. Momen phanh còn `
          + `${pc(1 - loss)} — mất ${pc(loss)}.` };
    },
  },
  {
    name: 'ĐỔ ĐÈO bằng phanh ĐĨA: gần như không suy giảm — vì đĩa hở ra gió',
    run() {
      const d0 = descentTemp(10, 40, 0, 'disc');
      const d4 = descentTemp(10, 40, 240, 'disc');
      const r4 = descentTemp(10, 40, 240, 'drum');
      const lossDisc = 1 - frontBrakeTorque(150, d4.mu) / frontBrakeTorque(150, d0.mu);
      return { pass: lossDisc < 0.08 && d4.temp < r4.temp,
        msg: `cùng điều kiện đó: đĩa ${Math.round(d4.temp)} °C sau 4 phút (mất `
          + `${pc(lossDisc)} momen) so với trống ${Math.round(r4.temp)} °C. `
          + `Khả năng thoát nhiệt ${HEAT.discCooling} W/K của đĩa hở so với `
          + `${HEAT.drumCooling} W/K của trống kín — chênh ${f1(HEAT.discCooling / HEAT.drumCooling)} lần.` };
    },
  },

  // ── Truyền động cuối và sên ──────────────────────────────────────────────
  {
    name: 'Khoảng cách nhông–trục bánh THAY ĐỔI khi treo sau nhún',
    run() {
      const sp = chainSpanRange();
      return { pass: sp.delta > 1,
        msg: `trên hành trình treo, nhịp sên đi từ ${f1(sp.lo)} tới ${f1(sp.hi)} mm — chênh `
          + `${f1(sp.delta)} mm, và căng nhất khi bánh dịch ${f1(sp.hiAt)} mm. `
          + `Vì bánh sau đi theo CUNG TRÒN quanh trục gắp, không đi thẳng.` };
    },
  },
  {
    name: 'ĐỘ VÕNG SÊN hãng ghi trong sách khớp với con số suy ra từ hình học',
    run() {
      const sp = chainSpanRange();
      const need = requiredSlack(sp.hi, sp.delta);
      const [lo, hi] = FD.slackSpec;
      return { pass: need <= lo && need > lo * 0.6,
        msg: `để bù ${f1(sp.delta)} mm thay đổi chiều dài, sên phải võng tối thiểu `
          + `${f1(need)} mm ở giữa nhịp. Hãng ghi ${lo}–${hi} mm — tức đủ và còn dư một chút. `
          + `Con số trong sách KHÔNG phải quy ước, nó là kết quả của hình học gắp sau.` };
    },
  },
  {
    name: 'Sên KHÔNG BAO GIỜ căng cứng trên toàn hành trình treo',
    run(asm, kin) {
      let worst = Infinity, worstAt = 0;
      for (let d = -SW.travelWheel * 0.4; d <= SW.travelWheel * 0.75; d += 1) {
        const s = kin.chainSagAt(d);
        if (s < worst) { worst = s; worstAt = d; }
      }
      const loose = kin.chainSagAt(-SW.travelWheel * 0.4);
      return { pass: worst > 3,
        msg: `độ võng nhỏ nhất ${f1(worst)} mm (khi bánh dịch ${f1(worstAt)} mm) và lớn nhất `
          + `${f1(loose)} mm. Luôn còn võng nên không có vị trí nào sên bị kéo cứng — nếu có, `
          + `bạc trục ra hộp số sẽ chết rất nhanh.` };
    },
  },
  {
    name: 'Tỉ số truyền cuối và tốc độ ở số 4 hợp lý',
    run() {
      const v = speedKmh(8500, 4);
      return { pass: v > 90 && v < 130,
        msg: `${FD.frontSprocket.teeth}/${FD.rearSprocket.teeth} → tỉ số cuối `
          + `${f2(FINAL_RATIO)} · tổng ở số 4 là ${f2(overallRatio(4))} → 8500 v/ph cho `
          + `${Math.round(v)} km/h theo hình học. Trên đường thật thấp hơn vì mô hình này chưa `
          + `tính lực cản không khí.` };
    },
  },
  {
    name: 'CHIỀU DÀI CƠ SỞ cũng thay đổi khi treo sau nhún — cùng một nguyên nhân với độ võng sên',
    run() {
      const zStatic = L.swing.axle[1];
      const zUp = rearAxleAt(SW.travelWheel * 0.75)[1];
      const zDown = rearAxleAt(-SW.travelWheel * 0.4)[1];
      const range = Math.max(zStatic, zUp, zDown) - Math.min(zStatic, zUp, zDown);
      return { pass: range > 0.5 && range < 25,
        msg: `trục bánh sau đi từ z=${f1(Math.min(zStatic, zUp, zDown))} tới `
          + `z=${f1(Math.max(zStatic, zUp, zDown))} mm — chiều dài cơ sở thay đổi ${f1(range)} mm `
          + `trên hành trình treo. Cùng một nguyên nhân với việc sên phải có độ võng: bánh sau đi `
          + `theo CUNG TRÒN, không đi thẳng lên xuống.` };
    },
  },
  {
    name: 'Quét toàn dải điều khiển: không NaN',
    run(asm, kin) {
      const cases = [
        [0, 0, false, 0, 0], [300, 300, false, 0, 0], [150, 100, true, 12, 300],
      ];
      let bad = null;
      for (const [lv, pd, wet, slope, sec] of cases) {
        kin.setLever(lv); kin.setPedal(pd); kin.setWet(wet);
        kin.setSlope(slope); kin.setDescentSec(sec);
        for (let a = 0; a <= 720; a += 10) {
          const st = kin.drive(a, 1 / 60);
          for (const [k, v] of Object.entries(st)) {
            if (typeof v === 'number' && !Number.isFinite(v) && k !== 'stopM') {
              bad = `${k} @ ${a}°`;
            }
          }
        }
      }
      kin.reset();
      return { pass: !bad, msg: bad ? `NaN tại ${bad}` : '3 chế độ × 73 góc — mọi số hữu hạn' };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default {
  mode: '3d',
  slug: 'chassis-brakes',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,
  /** Hệ này là cả chiếc xe, nên chi tiết dài hơn ngưỡng mặc định của harness. */
  maxPartSize: 2200,

  frameDir: [0.94, 0.17, 0.30],
  frameExclude: ['ctx-ground'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 0,
  initialRpm: 60,

  opsGhost: ['ctx-engine', 'frame', 'ctx-ground'],
  opsHidden: [],

  labels(asm, kin) {
    const at = (x, y, z) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at(0, 60, WF.z),
        text: () => `tải trước ${pc(kin.state.frontFrac)}`
          + `${kin.state.lockF ? ' — KHOÁ' : ''}`,
        accent: () => kin.state.lockF,
      },
      {
        pos: () => at(0, 60, WR.z),
        text: () => `tải sau ${pc(kin.state.rearFrac)}`
          + `${kin.state.rearLift ? ' — BỔNG' : kin.state.lockR ? ' — KHOÁ' : ''}`,
        accent: () => kin.state.lockR || kin.state.rearLift,
      },
      {
        pos: () => at(0, L.cg.y, L.cg.z),
        text: () => `khối tâm · giảm tốc ${vn(kin.state.aG, 2)} g`,
        accent: true,
      },
      {
        pos: () => at(0, L.cg.y - 60, L.cg.z),
        text: () => (kin.state.braking
          ? `quãng phanh ${vn(kin.state.stopM)} m từ ${kin.state.kmh} km/h`
          : 'chưa phanh'),
      },
      {
        pos: () => at(-SW.spanX / 2 - 40, 150, (FD.frontSprocket.z + WR.z) / 2),
        text: () => `độ võng sên ${vn(kin.state.chainSag)} mm`,
      },
      {
        pos: () => at(0, WR.r + 90, WR.z + 40),
        text: () => `trống ${Math.round(kin.state.brakeTempC)} °C · còn `
          + `${Math.round(kin.state.fadePct)} % lực`,
        accent: () => kin.state.fadePct < 80,
      },
    ];
  },

  opsPanel(mount, kin, api) {
    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const sl = (min, max, val, step, fmt, set) => {
      const i = el('input', { type: 'range', min, max, step, value: val });
      const b = el('b', { text: fmt(val) });
      i.addEventListener('input', () => { set(+i.value); b.textContent = fmt(+i.value); });
      return { i, b, sync: (v) => { i.value = String(v); b.textContent = fmt(v); } };
    };

    const kmh = sl(20, 90, 50, 5, (v) => `${v} km/h`, (v) => kin.setKmh(v));
    const lever = sl(0, 300, 0, 10,
      (v) => (v === 0 ? 'không bóp' : `${v} N` + (v > 220 ? ' — bóp rất mạnh' : '')),
      (v) => kin.setLever(v));
    const pedal = sl(0, 300, 0, 10,
      (v) => (v === 0 ? 'không đạp' : `${v} N` + (v > 220 ? ' — đạp rất mạnh' : '')),
      (v) => kin.setPedal(v));
    const slope = sl(0, 20, 0, 1,
      (v) => (v === 0 ? 'đường bằng' : `dốc ${v} %`), (v) => kin.setSlope(v));
    const secs = sl(0, 480, 0, 15,
      (v) => (v === 0 ? '—' : `${Math.floor(v / 60)} phút ${v % 60 ? (v % 60) + ' giây' : ''}`),
      (v) => kin.setDescentSec(v));

    const wetBtn = el('button', { class: 'tlbtn', text: 'đường khô', 'aria-pressed': 'false',
      title: `Đổi hệ số bám lốp giữa khô ${L.gripDry} và ướt ${L.gripWet}` });
    wetBtn.onclick = () => {
      const w = !kin.state.wet;
      kin.setWet(w);
      wetBtn.textContent = w ? 'ĐƯỜNG ƯỚT' : 'đường khô';
      wetBtn.setAttribute('aria-pressed', String(w));
    };

    const whichBtn = el('button', { class: 'tlbtn', text: 'đổ đèo bằng phanh SAU',
      'aria-pressed': 'true',
      title: 'Đổi giữa dùng phanh sau (tang trống) và phanh trước (đĩa) khi đổ đèo' });
    whichBtn.onclick = () => {
      const r = !kin.state.useRearOnDescent;
      kin.setUseRearOnDescent(r);
      whichBtn.textContent = r ? 'đổ đèo bằng phanh SAU' : 'đổ đèo bằng phanh TRƯỚC';
      whichBtn.setAttribute('aria-pressed', String(r));
    };

    const syncAll = () => {
      kmh.sync(kin.state.kmh); lever.sync(kin.state.leverN); pedal.sync(kin.state.pedalN);
      slope.sync(kin.state.slopePct); secs.sync(kin.state.descentSec);
      wetBtn.textContent = kin.state.wet ? 'ĐƯỜNG ƯỚT' : 'đường khô';
      wetBtn.setAttribute('aria-pressed', String(kin.state.wet));
    };

    const scen = (label, title, fn) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => { kin.reset(); fn(); syncAll(); } });

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bF = bar(''), bR = bar('ex');
    const vA = el('span', { class: 'vl', text: '0,00 g' });
    const vD = el('span', { class: 'vl', text: '—' });
    const vLF = el('span', { class: 'vl', text: '46 %' });
    const vLR = el('span', { class: 'vl', text: '54 %' });
    const vSh = el('span', { class: 'vl', text: '—' });
    const vLim = el('span', { class: 'vl', text: '—' });
    const vT = el('span', { class: 'vl', text: '30 °C' });
    const vSag = el('span', { class: 'vl', text: '—' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' },
          text: 'bánh lăn' }),
      ),
      el('div', { class: 'field' }, el('label', {}, 'Tốc độ khi bắt đầu phanh', kmh.b), kmh.i),
      el('div', { class: 'field' }, el('label', {}, 'LỰC BÓP TAY (phanh trước)', lever.b), lever.i),
      el('div', { class: 'field' }, el('label', {}, 'LỰC ĐẠP CHÂN (phanh sau)', pedal.b), pedal.i),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, wetBtn),
      el('div', { class: 'field' },
        el('label', {}, 'Khung nhìn'),
        el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          el('button', { class: 'tlbtn', text: 'cả xe',
            title: 'Xem toàn bộ xe từ bên hông — thấy được độ chúi mũi khi phanh',
            onclick: () => api.frameOn(null) }),
          el('button', { class: 'tlbtn', text: 'phanh trước',
            title: 'Phóng vào đĩa phanh, kẹp phanh và bánh trước',
            onclick: () => api.frameOn(['brake-disc', 'brake-caliper', 'front-wheel'],
              [0.72, 0.24, -0.65]) }),
          el('button', { class: 'tlbtn', text: 'phanh sau',
            title: 'Phóng vào tang trống và hai má phanh',
            onclick: () => api.frameOn(['brake-drum', 'brake-shoes', 'brake-arm'],
              [0.86, 0.22, 0.46]) }),
          el('button', { class: 'tlbtn', text: 'sên & gắp',
            title: 'Xem độ võng sên đổi theo hành trình gắp sau',
            onclick: () => api.frameOn(['chain', 'swingarm', 'front-sprocket', 'rear-sprocket'],
              [0.92, 0.16, 0.36]) }),
        )),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Giảm tốc' }), el('div', {}), vA,
        el('span', { class: 'lb', text: 'Quãng phanh' }), el('div', {}), vD,
        el('span', { class: 'lb', text: 'Tải bánh TRƯỚC' }), bF.node, vLF,
        el('span', { class: 'lb', text: 'Tải bánh SAU' }), bR.node, vLR,
        el('span', { class: 'lb', text: 'Phanh trước góp' }), el('div', {}), vSh,
        el('span', { class: 'lb', text: 'Trạng thái bánh' }), el('div', {}), vLim,
        el('span', { class: 'lb', text: 'Nhiệt phanh' }), el('div', {}), vT,
        el('span', { class: 'lb', text: 'Độ võng sên' }), el('div', {}), vSag,
      ),

      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        scen('chỉ phanh trước', 'Bóp tay mạnh, không đạp chân', () => kin.setLever(250)),
        scen('chỉ phanh sau', 'Đạp chân mạnh, không bóp tay', () => kin.setPedal(250)),
        scen('cả hai phanh', 'Cách phanh đúng', () => { kin.setLever(220); kin.setPedal(140); }),
        scen('phanh gấp khi ướt', 'Cùng lực đó nhưng mặt đường ướt',
          () => { kin.setLever(250); kin.setPedal(150); kin.setWet(true); }),
      ),

      el('div', { class: 'foldhead', style: { marginTop: '10px' }, text: 'Kịch bản đổ đèo' }),
      el('div', { class: 'field' }, el('label', {}, 'Độ dốc', slope.b), slope.i),
      el('div', { class: 'field' }, el('label', {}, 'Đã đổ được', secs.b), secs.i),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        whichBtn,
        scen('đổ đèo 4 phút', 'Dốc 10 %, 40 km/h, đổ liên tục 4 phút',
          () => { kin.setSlope(10); kin.setKmh(40); kin.setDescentSec(240); kin.setPedal(200); }),
      ),

      el('div', { class: 'note', html:
        '<b>Bài 1 — vì sao phanh trước làm phần lớn công việc.</b> Bấm <b>chỉ phanh sau</b> rồi '
        + '<b>chỉ phanh trước</b> và so quãng phanh. Nhìn hai đồng hồ tải bánh: phanh làm dồn tải '
        + `ra trước theo đúng tỉ lệ chiều cao khối tâm / chiều dài cơ sở = ${L.cg.y}/${WHEELBASE}. `
        + 'Nên bánh trước càng phanh càng bám, còn bánh sau càng phanh càng nhẹ rồi khoá. '
        + 'Đạp chân mạnh hơn cũng không dừng nhanh hơn — chỉ trượt bánh.<br><br>'
        + '<b>Bài 2 — đổ đèo.</b> Bấm <b>đổ đèo 4 phút</b>. Toàn bộ thế năng phải biến thành nhiệt '
        + 'trong phanh, và tang trống là một cái HỘP KÍN nên nhiệt không có đường ra: xem "nhiệt '
        + 'phanh" và "còn bao nhiêu % lực". Rồi bấm <b>đổ đèo bằng phanh TRƯỚC</b> — đĩa hở ra gió '
        + 'nên gần như không suy giảm. Đây là lý do đổ đèo dài phải dùng phanh trước và về số thấp, '
        + 'không rê phanh sau.<br><br>'
        + '<b>Bài 3 — độ võng sên.</b> Kéo thanh <b>lực bóp tay</b> để xe nhún và nhìn số "độ võng '
        + 'sên" tự đổi. Bánh sau đi theo cung tròn quanh trục gắp nên khoảng cách nhông–trục bánh '
        + `thay đổi ${vn(chainSpanRange().delta)} mm; độ võng phải đủ bù được lượng đó. `
        + `Suy ra tối thiểu ${vn(requiredSlack(chainSpanRange().hi, chainSpanRange().delta))} mm — `
        + `và sách hãng ghi ${FD.slackSpec[0]}–${FD.slackSpec[1]} mm.` }),
    ));

    return {
      update() {
        const s = kin.state;
        vA.textContent = `${vn(s.aG, 2)} g`;
        vD.textContent = s.braking ? `${vn(s.stopM)} m` : '—';
        bF.i.style.width = `${Math.round(s.frontFrac * 100)}%`;
        bR.i.style.width = `${Math.round(s.rearFrac * 100)}%`;
        vLF.textContent = pc(s.frontFrac);
        vLR.textContent = pc(s.rearFrac);
        vSh.textContent = s.aG > 1e-3 ? pc(s.shareFront) : '—';
        vLim.textContent = s.rearLift ? 'bánh sau BỔNG'
          : s.lockF && s.lockR ? 'CẢ HAI khoá — đang trượt'
            : s.lockF ? 'bánh TRƯỚC khoá'
              : s.lockR ? 'bánh SAU khoá'
                : s.aG > 1e-3 ? 'cả hai còn bám' : '—';
        vT.textContent = `${Math.round(s.brakeTempC)} °C — còn ${Math.round(s.fadePct)} % lực`;
        vSag.textContent = `${vn(s.chainSag)} mm`;
      },
    };
  },

  intro: {
    title: 'Phanh là bài toán CHUYỂN TẢI, và tang trống là một cái hộp kín',
    html: `
      <p><b>Hai con số quyết định mọi thứ về phanh:</b> chiều cao khối tâm (${L.cg.y} mm) và chiều
      dài cơ sở (${WHEELBASE} mm). Khi xe giảm tốc <i>a</i> lần g, tải dồn từ bánh sau ra bánh
      trước một lượng bằng <i>a</i> × ${L.cg.y}/${WHEELBASE} = ${f2(L.cg.y / WHEELBASE)}·<i>a</i>
      phần trọng lượng. Nên khi phanh 0,8 g thì bánh trước chịu ${pc(frontLoadFraction(0.8))} tải,
      còn bánh sau chỉ còn ${pc(1 - frontLoadFraction(0.8))}.</p>

      <p><b>Hệ quả:</b> phanh trước càng dùng mạnh thì bánh trước càng bám (vì tải dồn về nó);
      còn phanh sau càng dùng mạnh thì bánh sau càng nhẹ rồi khoá. Đây là một vòng hồi tiếp, nên
      phải giải bằng phép lặp. Kết quả: trên đường khô, phanh trước một mình dừng được
      <b>${f2(maxDecelFrontOnly())} g</b> còn phanh sau một mình chỉ
      <b>${f2(maxDecelRearOnly())} g</b> — gấp ${f1(maxDecelFrontOnly() / maxDecelRearOnly())} lần.
      Từ 50 km/h là ${f1(stoppingDistance(50, maxDecelFrontOnly()))} m so với
      ${f1(stoppingDistance(50, maxDecelRearOnly()))} m.</p>

      <p><b>Tang trống có TỰ CƯỜNG HOÁ, và đó là con dao hai lưỡi.</b> Hai má phanh trông giống
      nhau nhưng làm việc khác nhau: má <b>dẫn</b> bị ma sát kéo thêm vào lòng trống nên tự tăng lực
      ép (góp ${f2(drumBrakeFactor().leading)}), má <b>bị</b> thì bị đẩy ra
      (chỉ góp ${f2(drumBrakeFactor().trailing)}). Nhờ vậy phanh cơ nhẹ chân. Nhưng cũng vì vậy
      momen phanh phụ thuộc hệ số ma sát rất <b>dốc</b>: μ tụt 30 % thì phanh đĩa mất đúng 30 %
      momen, còn tang trống mất
      ${pc(1 - drumBrakeFactor(BR.muShoe * 0.7).total / drumBrakeFactor(BR.muShoe).total)}.</p>

      <p><b>Và tang trống là một cái HỘP KÍN.</b> Đó là điều đáng lo nhất khi đổ đèo. Toàn bộ thế
      năng phải biến thành nhiệt trong phanh — dốc 10 % ở 40 km/h là
      ${Math.round(descentTemp(10, 40, 0, 'drum').P)} W liên tục. Đĩa phanh hở hoàn toàn ra gió nên
      thoát được ${HEAT.discCooling} W mỗi độ chênh; tang trống kín chỉ thoát được
      ${HEAT.drumCooling} W/K. Sau 4 phút đổ đèo, trống lên
      ${Math.round(descentTemp(10, 40, 240, 'drum').temp)} °C và mất phần lớn lực phanh, còn đĩa
      chỉ ${Math.round(descentTemp(10, 40, 240, 'disc').temp)} °C và gần như không đổi.</p>

      <p><b>Về độ võng sên:</b> con số ${FD.slackSpec[0]}–${FD.slackSpec[1]} mm trong sách hãng
      không phải quy ước. Bánh sau đi theo cung tròn quanh trục gắp, nên khoảng cách nhông–trục bánh
      thay đổi ${f1(chainSpanRange().delta)} mm trên hành trình treo. Độ võng phải đủ bù lượng đó,
      nếu không thì ở một vị trí nhún nào đó sên sẽ căng cứng và phá bạc trục ra hộp số. Tính ra
      tối thiểu ${f1(requiredSlack(chainSpanRange().hi, chainSpanRange().delta))} mm.</p>`,
  },

  symptoms: [
    { sign: 'Bóp phanh trước hết tay mà xe vẫn không dừng nhanh',
      cause: 'Má phanh mòn hoặc chai · dầu phanh có KHÍ (tay bóp mềm xốp) · ống dầu phồng · '
        + 'đĩa hoặc má dính dầu mỡ.',
      fix: 'Phân biệt bằng cảm giác tay: bóp MỀM XỐP và lún sâu = có khí, phải xả gió. Bóp CỨNG '
        + 'mà không ăn = má/đĩa dính dầu hoặc má chai — thay má, rửa đĩa bằng dung dịch chuyên dụng.' },
    { sign: 'Tay phanh giật theo vòng quay bánh',
      cause: 'Đĩa phanh đảo (vênh).',
      fix: 'Đo độ đảo bằng đồng hồ so. Vênh nhẹ do nhiệt có thể tự hết; vênh do va đập thì thay đĩa.' },
    { sign: 'Phanh trước không nhả hết, vành trước nóng, xe nặng khi đẩy',
      cause: 'Ắc kẹp phanh kẹt · lỗ hồi dầu ở xy-lanh chính bị tắc · cúp-pen phồng do dầu phanh '
        + 'ngấm ẩm.',
      fix: 'Tháo kẹp phanh, vệ sinh và bôi mỡ chịu nhiệt cho ắc. Nếu vẫn kẹt thì thay dầu phanh '
        + 'và kiểm lỗ hồi.' },
    { sign: 'Phanh sau lúc ăn lúc không, có khi bó cứng đột ngột',
      cause: 'Đây là mặt tối của TỰ CƯỜNG HOÁ: momen phanh phụ thuộc μ rất dốc, nên má bám không '
        + 'đều hoặc trống mòn ôvan làm lực phanh dao động mạnh.',
      fix: 'Thay CẢ CẶP má, kiểm lòng trống có ôvan. Không "chỉnh" bằng cách siết thanh kéo chặt hơn.' },
    { sign: 'Phanh sau gần như mất tác dụng sau khi lội nước',
      cause: 'Nước đọng BÊN TRONG tang trống. Trống là hộp kín nên nước không tự ráo như đĩa.',
      fix: 'Rê phanh sau nhẹ vài trăm mét để nước bay hơi. Biết trước điều này là quan trọng: '
        + 'sau khi lội nước thì phải thử phanh trước khi cần dùng thật.' },
    { sign: 'Đổ đèo dài, phanh sau ngày càng nhẹ rồi mất hẳn',
      cause: 'Suy giảm do nhiệt. Rê phanh sau liên tục đổ toàn bộ thế năng vào một cái hộp kín '
        + 'không thoát nhiệt được.',
      fix: 'VỀ SỐ THẤP để động cơ giữ tốc, dùng phanh TRƯỚC theo từng nhát dứt khoát rồi nhả cho '
        + 'nguội, thay vì rê phanh sau liên tục. Xem chế độ Hoạt động để thấy con số.' },
    { sign: 'Xe lắc đầu ở tốc độ cao, có tiếng "cạch" khi phanh trước',
      cause: 'Bạc cổ rơ hoặc rỗ thành rãnh.',
      fix: 'Kê bánh trước lên, lắc càng theo chiều trước–sau. Có độ rơ = siết lại hoặc thay bạc. '
        + 'Rỗ rãnh thì phải thay cả bộ, siết lại không hết.' },
    { sign: 'Xe xóc gắt, hoặc nhún dội nhiều lần sau mỗi cú xóc',
      cause: 'Hai lỗi khác nhau: XÓC GẮT là lò xo quá cứng hoặc phuộc bó (ty rỗ, chảng ba vặn); '
        + 'DỘI NHIỀU LẦN là mất giảm chấn (thiếu nhớt phuộc, giảm chấn sau hết nhớt).',
      fix: 'Thử: ấn mạnh xuống rồi thả — phải trả về và DỪNG. Dội lên xuống = mất giảm chấn. '
        + 'Lò xo quyết định lún BAO NHIÊU, nhớt quyết định lún NHANH hay CHẬM.' },
    { sign: 'Sên kêu, nhảy khỏi dĩa khi giảm ga đột ngột',
      cause: 'Sên quá lỏng, hoặc sên đã giãn không đều nên có đoạn chặt đoạn lỏng.',
      fix: 'Đo độ võng ở NHIỀU vị trí quay bánh. Chênh nhiều = sên giãn không đều, phải thay cả bộ. '
        + 'Chỉnh xong kiểm bánh sau còn thẳng hàng.' },
    { sign: 'Bạc trục ra hộp số chảy nhớt hoặc kêu sau khi vừa "căng sên cho chắc"',
      cause: 'Sên căng quá. Ở một vị trí nhún nào đó sên bị kéo cứng và dồn toàn bộ lực đó vào bạc '
        + 'trục ra.',
      fix: 'Nới về đúng độ võng hãng ghi. Đây là lỗi do người sửa gây ra, và nó đắt.' },
    { sign: 'Lốp mòn giữa, xe trượt khi trời mưa',
      cause: 'Bơm quá căng và chạy đường thẳng nhiều.',
      fix: 'Bơm theo đúng áp suất hãng ghi (không "bơm căng cho đỡ tốn xăng"). Lốp mòn hết gai '
        + 'giữa thì thay, không đảo lốp.' },
  ],
};
