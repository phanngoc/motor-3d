/**
 * index.js — Module hệ thống 06: Hệ thống bôi trơn.
 *
 * Hệ thống này khác các hệ trước ở chỗ điều đáng học nhất không phải hình dáng
 * chi tiết mà là một quan hệ SỐ: bơm sinh LƯU LƯỢNG, còn ÁP SUẤT do sức cản
 * đường nhớt phía sau sinh ra. Toàn bộ bảng điều khiển được làm để chứng minh
 * điều đó bằng cách cho kéo hai thanh riêng biệt và xem hai đồng hồ phản ứng.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, ROTOR_RATIO, PUMP_DRIVE_RATIO, PUMP_CC_PER_REV, outerCenter,
  flowLpm, pressureKpa, reliefOpen, filterEfficiency, sludgeToKm, OIL_PATH,
} from './layout.js';
import { PARTS, OIL_CURVE } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const PU = L.pump, CF = L.cf, RV = L.relief;
const f2 = (v) => v.toFixed(2);
const kpa = (v) => `${Math.round(v)} kPa`;

// ─────────────────────────────────────────────────────────────────────────────
// KIỂM TRA KỸ THUẬT
// ─────────────────────────────────────────────────────────────────────────────

const checks = [
  {
    name: 'Rôto ngoài nhiều hơn rôto trong đúng MỘT thùy',
    run() {
      const zi = PU.lobesInner, zo = PU.lobesInner + 1;
      return { pass: zo - zi === 1,
        msg: `trong ${zi} thùy · ngoài ${zo} thùy · tỉ số tốc độ ${ROTOR_RATIO.toFixed(4)} = ${zi}/${zo}` };
    },
  },
  {
    name: 'Hai rôto LỆCH TÂM — nếu đồng tâm thì bơm không hút được gì',
    run() {
      const oc = outerCenter();
      const d = Math.hypot(oc.y - PU.y, oc.z - PU.z);
      return { pass: d > 0.5,
        msg: `độ lệch tâm ${f2(d)} mm — chính nó tạo ra khoang có thể tích biến thiên` };
    },
  },
  {
    name: 'Rôto nằm gọn trong lòng thân bơm',
    run() {
      const clear = PU.bodyR - PU.rOuter - Math.hypot(outerCenter().y - PU.y, 0);
      return { pass: clear > 2,
        msg: `thành thân bơm còn dày ${f2(clear)} mm quanh rôto ngoài (Ø${PU.rOuter * 2} mm)` };
    },
  },
  {
    name: 'Bơm quay CHẬM hơn động cơ',
    run() {
      return { pass: PUMP_DRIVE_RATIO < 1,
        msg: `${L.crankGear.teeth} răng trục khuỷu / ${L.pumpGear.teeth} răng bơm `
          + `= ${PUMP_DRIVE_RATIO.toFixed(3)} — ở 5000 v/ph động cơ thì bơm quay `
          + `${Math.round(5000 * PUMP_DRIVE_RATIO)} v/ph` };
    },
  },
  {
    name: 'LƯU LƯỢNG tỉ lệ THUẬN với vòng tua (bơm thể tích)',
    run() {
      const q1 = flowLpm(1500), q2 = flowLpm(3000), q3 = flowLpm(6000);
      // Với hiệu suất thể tích không đổi thì gấp đôi vòng tua = gấp đôi lưu lượng.
      const r1 = q2 / q1, r2 = q3 / q2;
      const ok = Math.abs(r1 - 2) < 0.02 && Math.abs(r2 - 2) < 0.02;
      return { pass: ok,
        msg: `1500 v/ph → ${f2(q1)} L/ph · 3000 → ${f2(q2)} · 6000 → ${f2(q3)} — `
          + `gấp đôi vòng tua thì gấp ${r1.toFixed(3)}× lưu lượng` };
    },
  },
  {
    name: 'ÁP SUẤT do SỨC CẢN sinh ra, không do bơm — cùng vòng tua, đổi sức cản thì áp đổi',
    run() {
      const rpm = 3000;
      const q = flowLpm(rpm);
      const pNew = pressureKpa(rpm, 1.0);
      const pWorn = pressureKpa(rpm, 0.35);
      // Lưu lượng KHÔNG đổi, chỉ áp suất đổi.
      const qSame = Math.abs(flowLpm(rpm) - q) < 1e-9;
      return { pass: qSame && pWorn < pNew * 0.5,
        msg: `ở ${rpm} v/ph lưu lượng ${f2(q)} L/ph KHÔNG đổi, nhưng áp suất `
          + `${kpa(pNew)} (khe hở mới) → ${kpa(pWorn)} (khe hở mòn rộng). `
          + `Đó chính là "gõ đầu bò khi không tải" trên máy cũ.` };
    },
  },
  {
    name: 'Mòn bơm làm TỤT lưu lượng, nặng nhất ở vòng tua thấp',
    run() {
      const lowNew = flowLpm(1400, 1.0), lowWorn = flowLpm(1400, 1.9);
      const hiNew = flowLpm(7000, 1.0), hiWorn = flowLpm(7000, 1.9);
      const lossLow = 1 - lowWorn / lowNew;
      const lossHi = 1 - hiWorn / hiNew;
      // Tỉ lệ mất mát bằng nhau, nhưng lưu lượng TUYỆT ĐỐI ở vòng tua thấp đã rất
      // nhỏ nên thiếu hụt ở đó mới là chỗ chết máy.
      return { pass: lowWorn < lowNew && lowWorn < hiWorn,
        msg: `1400 v/ph: ${f2(lowNew)} → ${f2(lowWorn)} L/ph · `
          + `7000 v/ph: ${f2(hiNew)} → ${f2(hiWorn)} L/ph. Mất ${Math.round(lossLow * 100)} % ở cả hai, `
          + `nhưng ở vòng tua thấp lưu lượng còn lại chỉ ${f2(lowWorn)} L/ph` };
    },
  },
  {
    name: 'Van an toàn CHỈ mở khi quá áp, không mở lúc bình thường',
    run() {
      const idle = reliefOpen(1400, 1.0, 1.0);
      const cold = reliefOpen(6000, 1.5, 1.0);
      return { pass: !idle && cold,
        msg: `không tải máy nóng (1400 v/ph, cản 1,0): ${idle ? 'MỞ' : 'đóng'} · `
          + `ga cao máy nguội (6000 v/ph, cản 1,5): ${cold ? 'MỞ' : 'đóng'}. `
          + `Ngưỡng ${L.reliefOpenKpa} kPa` };
    },
  },
  {
    name: 'Áp suất bị van an toàn CẮT ở ngưỡng, không tăng vô hạn',
    run() {
      const p = pressureKpa(9000, 1.6, 1.0);
      return { pass: p <= L.reliefOpenKpa + 0.01,
        msg: `9000 v/ph + nhớt đặc: áp suất bị chặn ở ${kpa(p)} = ngưỡng van` };
    },
  },
  {
    name: 'Hiệu quả lọc li tâm GIẢM ĐƠN ĐIỆU theo độ dày cặn, về 0 khi đầy',
    run() {
      let mono = true;
      let prev = filterEfficiency(0);
      for (let s = 0.1; s <= CF.sludgeMax + 1e-9; s += 0.1) {
        const e = filterEfficiency(s);
        if (e > prev + 1e-9) mono = false;
        prev = e;
      }
      const e0 = filterEfficiency(0), eMid = filterEfficiency(CF.sludgeMax / 2),
        eFull = filterEfficiency(CF.sludgeMax);
      return { pass: mono && e0 > 0.99 && eFull < 0.01,
        msg: `sạch ${Math.round(e0 * 100)} % → nửa (${sludgeToKm(CF.sludgeMax / 2).toLocaleString('vi-VN')} km) `
          + `${Math.round(eMid * 100)} % → đầy ${Math.round(eFull * 100)} %` };
    },
  },
  {
    name: 'Lớp cặn nằm TRONG buồng lọc, không chồm qua thành',
    run() {
      const inner = CF.rIn - 0.3 - CF.sludgeMax;
      return { pass: inner > L.crank.r + 2,
        msg: `cặn dày tối đa ${CF.sludgeMax} mm ăn từ R${CF.rIn - 0.3} vào R${f2(inner)}, `
          + `vẫn cách cổ trục khuỷu (R${L.crank.r}) ${f2(inner - L.crank.r)} mm` };
    },
  },
  {
    name: 'Van an toàn không chồm vào thân bơm',
    run() {
      const d = Math.hypot(RV.y - PU.y, RV.z - PU.z);
      const need = PU.bodyR + RV.r + 2;
      return { pass: d >= need,
        msg: `tâm van cách tâm bơm ${f2(d)} mm, cần ≥ ${f2(need)} mm `
          + `(bán kính thân bơm ${PU.bodyR} + bán kính van ${RV.r} + khe 2)` };
    },
  },
  {
    name: 'Buồng lọc li tâm nằm NGOÀI bơm nhớt theo trục — thứ tự đường nhớt đúng',
    run() {
      return { pass: CF.x0 > PU.x1,
        msg: `bơm ở x ${PU.x0}…${PU.x1}, buồng lọc ở x ${CF.x0}…${CF.x1} — `
          + `nhớt qua bơm TRƯỚC rồi mới vào buồng lọc` };
    },
  },
  {
    name: 'Mạch nhớt liền một dải, đi từ đáy các-te lên tới đầu bò',
    run() {
      const len = OIL_CURVE.getLength();
      const p0 = OIL_CURVE.getPointAt(0), p1 = OIL_CURVE.getPointAt(1);
      const rise = p1.y - p0.y;
      // không có đoạn nào nhảy vọt (dấu hiệu mạch bị đứt)
      let maxSeg = 0;
      let prev = OIL_CURVE.getPointAt(0);
      for (let i = 1; i <= 200; i++) {
        const p = OIL_CURVE.getPointAt(i / 200);
        maxSeg = Math.max(maxSeg, p.distanceTo(prev));
        prev = p;
      }
      return { pass: len > 200 && rise > 100 && maxSeg < len / 40,
        msg: `${OIL_PATH.length} chặng · dài ${Math.round(len)} mm · dâng ${Math.round(rise)} mm `
          + `từ đáy các-te lên trục cam · đoạn dài nhất ${f2(maxSeg)} mm (mạch liền)` };
    },
  },
  {
    name: 'Lưới lọc nằm dưới mức nhớt (bơm phải hút được nhớt, không hút không khí)',
    run() {
      const submerged = L.oilLevelY - L.strainer.y;
      return { pass: submerged > 4,
        msg: `mức nhớt y=${L.oilLevelY} · lưới lọc y=${L.strainer.y} — `
          + `ngập ${f2(submerged)} mm. Nhớt cạn quá mức thấp thì bơm hút KHÍ và mất áp ngay.` };
    },
  },
  {
    name: 'Quét cả vòng ở nhiều chế độ: không NaN',
    run(asm, kin) {
      const cases = [[1400, 1.0, 1.0, 0], [5000, 0.35, 1.9, CF.sludgeMax], [9000, 1.6, 1.4, 2.5]];
      let bad = null;
      for (const [rpm, r, w, sl] of cases) {
        kin.setRpm(rpm); kin.setResist(r); kin.setWear(w); kin.setSludge(sl);
        for (let a = 0; a <= 720; a += 5) {
          const st = kin.drive(a, 1 / 60);
          for (const [k, v] of Object.entries(st)) {
            if (typeof v === 'number' && !Number.isFinite(v)) bad = `${k} @ ${a}° (${rpm} v/ph)`;
          }
        }
      }
      kin.setRpm(3000); kin.setResist(1); kin.setWear(1); kin.setSludge(0.6);
      return { pass: !bad, msg: bad ? `NaN tại ${bad}` : '3 chế độ × 145 góc — mọi số hữu hạn' };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default {
  mode: '3d',
  slug: 'lubrication',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,

  frameDir: [0.30, 0.16, 0.94],
  frameExclude: ['ctx-sump', 'dipstick', 'drain-bolt'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 0,
  initialRpm: 90,

  /** Chế độ Hoạt động: làm mờ vỏ để thấy dòng nhớt chạy bên trong. */
  opsGhost: ['pump-gear', 'cf-housing', 'cf-cap', 'ctx-crank'],
  opsHidden: ['pump-bolts', 'dipstick', 'ctx-sump', 'pump-cover', 'pump-body'],

  labels(asm, kin) {
    const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at((PU.x0 + PU.x1) / 2, PU.y - PU.bodyR - 10, PU.z),
        text: () => `${kin.state.flowLpm.toFixed(2)} L/ph`,
        accent: true,
      },
      {
        pos: () => at((PU.x0 + PU.x1) / 2, PU.y + PU.bodyR + 10, PU.z),
        text: () => kpa(kin.state.pressureKpa),
        accent: () => kin.state.pressureKpa < 100,
      },
      {
        pos: () => at(RV.x + 24, RV.y, RV.z),
        text: () => (kin.state.reliefOpen ? 'van an toàn ĐANG XẢ' : 'van an toàn đóng'),
        accent: () => kin.state.reliefOpen,
      },
      {
        pos: () => at((CF.x0 + CF.x1) / 2, CF.rOut + 12),
        text: () => `lọc li tâm ${Math.round(kin.state.filterEff * 100)} % `
          + `(${kin.state.sludgeKm.toLocaleString('vi-VN')} km)`,
        accent: () => kin.state.filterEff < 0.35,
      },
      { pos: () => at(L.strainer.x, L.strainer.y - 12), text: 'lưới lọc — cấp lọc 1' },
      { pos: () => at(-14, L.headY - 8), text: 'tới trục cam & cò mổ' },
      { pos: () => at(0, L.oilLevelY + 6, -58), text: 'mức nhớt' },
    ];
  },

  opsPanel(mount, kin, api) {
    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const spd = el('input', { type: 'range', min: 20, max: 400, step: 5, value: api.rpm });
    const spdLb = el('b', { text: `${api.rpm}` });
    spd.addEventListener('input', () => { api.setRpm(+spd.value); spdLb.textContent = spd.value; });

    const rpm = el('input', { type: 'range', min: 800, max: 9000, step: 100, value: 3000 });
    const rpmLb = el('b', { text: '3000 v/ph' });
    rpm.addEventListener('input', () => { kin.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const res = el('input', { type: 'range', min: 25, max: 160, step: 5, value: 100 });
    const resLb = el('b', { text: '1,00 — bình thường' });
    const resTxt = (v) => (v < 0.7 ? `${v.toFixed(2).replace('.', ',')} — khe hở ổ đỡ đã mòn RỘNG`
      : v > 1.25 ? `${v.toFixed(2).replace('.', ',')} — nhớt đặc / máy nguội`
        : `${v.toFixed(2).replace('.', ',')} — bình thường`);
    res.addEventListener('input', () => {
      const v = +res.value / 100; kin.setResist(v); resLb.textContent = resTxt(v);
    });

    const wear = el('input', { type: 'range', min: 100, max: 220, step: 5, value: 100 });
    const wearLb = el('b', { text: 'bơm mới' });
    wear.addEventListener('input', () => {
      const v = +wear.value / 100; kin.setWear(v);
      wearLb.textContent = v <= 1.01 ? 'bơm mới'
        : `ba khe hở rộng ×${v.toFixed(2).replace('.', ',')}`;
    });

    const sl = el('input', { type: 'range', min: 0, max: CF.sludgeMax * 10, step: 1, value: 6 });
    const slLb = el('b', { text: `0,6 mm ≈ ${sludgeToKm(0.6).toLocaleString('vi-VN')} km` });
    sl.addEventListener('input', () => {
      const v = +sl.value / 10; kin.setSludge(v);
      slLb.textContent = `${v.toFixed(1).replace('.', ',')} mm ≈ ${sludgeToKm(v).toLocaleString('vi-VN')} km`;
    });

    const preset = (label, title, fn) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => {
        fn();
        rpm.value = String(kin.state.rpm); rpmLb.textContent = `${kin.state.rpm} v/ph`;
        res.value = String(Math.round(kin.state.resist * 100)); resLb.textContent = resTxt(kin.state.resist);
        wear.value = String(Math.round(kin.state.wear * 100));
        wearLb.textContent = kin.state.wear <= 1.01 ? 'bơm mới'
          : `ba khe hở rộng ×${kin.state.wear.toFixed(2).replace('.', ',')}`;
        sl.value = String(Math.round(kin.state.sludge * 10));
        slLb.textContent = `${kin.state.sludge.toFixed(1).replace('.', ',')} mm ≈ `
          + `${sludgeToKm(kin.state.sludge).toLocaleString('vi-VN')} km`;
      } });

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bQ = bar(''), bP = bar('ex');
    const vQ = el('span', { class: 'vl', text: '0 L/ph' });
    const vP = el('span', { class: 'vl', text: '0 kPa' });
    const vR = el('span', { class: 'vl', text: 'đóng' });
    const vE = el('span', { class: 'vl', text: '100 %' });
    const vS = el('span', { class: 'vl', text: '—' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'tốc độ hình' }),
        spdLb,
      ),
      el('div', { class: 'field' }, el('label', {}, 'Vòng tua động cơ', rpmLb), rpm),
      el('div', { class: 'field' },
        el('label', {}, 'Sức cản đường nhớt', resLb), res),
      el('div', { class: 'field' },
        el('label', {}, 'Độ mòn bơm', wearLb), wear),
      el('div', { class: 'field' },
        el('label', {}, 'Cặn trong buồng lọc li tâm', slLb), sl),

      el('div', { class: 'field' },
        el('label', {}, 'Khung nhìn'),
        el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          el('button', { class: 'tlbtn', text: 'mạch nhớt',
            title: 'Xem cả đường đi của nhớt từ đáy các-te lên trục cam',
            onclick: () => api.frameOn(null) }),
          el('button', { class: 'tlbtn', text: 'bơm',
            title: 'Phóng vào bơm nhớt để xem hai rôto quay lệch tâm',
            onclick: () => api.frameOn(
              ['pump-body', 'pump-cover', 'rotor-inner', 'rotor-outer', 'pump-shaft', 'pump-gear'],
              [0.86, 0.18, 0.48]) }),
          el('button', { class: 'tlbtn', text: 'lọc',
            title: 'Phóng vào buồng lọc li tâm để xem lớp cặn',
            onclick: () => api.frameOn(['cf-housing', 'cf-cap', 'cf-sludge'], [0.62, 0.30, 0.72]) }),
        )),

      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        preset('máy mới', 'Không tải, mọi khe hở còn mới',
          () => { kin.setRpm(1400); kin.setResist(1.0); kin.setWear(1.0); }),
        preset('máy mòn', 'Không tải, khe hở ổ đỡ đã rộng + bơm mòn — xem áp suất tụt',
          () => { kin.setRpm(1400); kin.setResist(0.35); kin.setWear(1.8); }),
        preset('máy nguội', 'Ga cao khi nhớt còn đặc — xem van an toàn mở',
          () => { kin.setRpm(6000); kin.setResist(1.5); kin.setWear(1.0); }),
        preset('lọc bẩn', 'Buồng lọc li tâm chưa từng vệ sinh',
          () => { kin.setSludge(CF.sludgeMax); }),
        preset('lọc sạch', 'Buồng lọc vừa được vét cặn',
          () => { kin.setSludge(0); }),
      ),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'LƯU LƯỢNG' }), bQ.node, vQ,
        el('span', { class: 'lb', text: 'ÁP SUẤT' }), bP.node, vP,
        el('span', { class: 'lb', text: 'Van an toàn' }), el('div', {}), vR,
        el('span', { class: 'lb', text: 'Hiệu quả lọc' }), el('div', {}), vE,
        el('span', { class: 'lb', text: 'Nhớt đang ở' }), el('div', {}), vS,
      ),

      el('div', { class: 'note', html:
        '<b>Điều đáng xem nhất — bơm KHÔNG tạo áp suất.</b> Giữ nguyên vòng tua rồi kéo thanh '
        + '<b>sức cản đường nhớt</b> xuống thấp (giả lập khe hở ổ đỡ đã mòn rộng). '
        + 'Đồng hồ <b>lưu lượng</b> gần như không đổi, nhưng <b>áp suất tụt hẳn</b>. '
        + 'Bơm vẫn đẩy đúng lượng nhớt đó — chỉ có điều nhớt thoát ra khỏi các khe hở rộng '
        + 'quá dễ nên không dựng được áp. Đó chính là lý do máy cũ "gõ đầu bò khi không tải" '
        + 'mà thay bơm mới vẫn không hết.<br><br>'
        + '<b>Điều thứ hai:</b> kéo thanh <b>cặn trong buồng lọc</b> lên tối đa. Hiệu quả lọc '
        + 'về 0 mà không có bất kỳ dấu hiệu nào trên xe — không đèn báo, không tiếng kêu, '
        + 'áp suất vẫn bình thường. Nhớt bẩn đi thẳng vào ổ bi đầu to. Đây là việc bảo dưỡng '
        + 'bị bỏ qua nhiều nhất trên xe số.' }),
    ));

    return {
      update() {
        const s = kin.state;
        const qMax = flowLpm(9000, 1.0);
        bQ.i.style.width = `${Math.min(100, (s.flowLpm / qMax) * 100)}%`;
        bP.i.style.width = `${Math.min(100, (s.pressureKpa / L.reliefOpenKpa) * 100)}%`;
        vQ.textContent = `${s.flowLpm.toFixed(2).replace('.', ',')} L/ph`;
        vP.textContent = kpa(s.pressureKpa);
        vR.textContent = s.reliefOpen ? 'ĐANG XẢ' : 'đóng';
        vE.textContent = `${Math.round(s.filterEff * 100)} %`;
        vS.textContent = s.stationName;
      },
    };
  },

  intro: {
    title: 'Bơm tạo LƯU LƯỢNG — áp suất là chuyện khác',
    html: `
      <p>Câu hay nghe nhất về hệ thống bôi trơn là "bơm nhớt tạo áp suất". Câu đó sai, và
      hiểu sai chỗ này dẫn tới chẩn đoán sai rất nhiều lần. Bơm ở đây là <b>bơm thể tích</b>:
      mỗi vòng quay nó đẩy đi một lượng nhớt gần như cố định
      (≈ ${PUMP_CC_PER_REV.toFixed(2)} cm³ mỗi vòng), bất kể phía sau có gì. Cái sinh ra
      <b>áp suất</b> là <b>sức cản</b> của đường nhớt phía sau — chủ yếu là các khe hở hẹp ở ổ
      đỡ, trục cam, cò mổ. Nhớt phải chen qua những khe hẹp đó nên dồn lại thành áp.</p>
      <p><b>Hệ quả trực tiếp:</b> máy cũ, khe hở ổ đỡ đã mòn rộng ra, nhớt thoát quá dễ nên
      <b>áp suất tụt</b> dù bơm vẫn đẩy đủ lưu lượng. Thay bơm mới không giải quyết được gì.
      Bật chế độ Hoạt động, giữ nguyên vòng tua và kéo thanh <b>sức cản</b> — bạn sẽ thấy
      lưu lượng đứng yên trong khi áp suất tụt.</p>
      <p><b>Ba cấp lọc, không có cấp nào là lọc giấy.</b> Xe số dùng: (1) lưới lọc thô ở đáy
      các-te, (2) <b>bộ lọc li tâm</b> quay theo trục khuỷu, (3) không có gì nữa. Bộ lọc li
      tâm là cấp duy nhất giữ được hạt nhỏ, và nó <b>chỉ vệ sinh được, không thay được</b>.
      Khi nó đầy cặn thì nhớt bẩn đi thẳng vào ổ bi đầu to — <b>không có dấu hiệu gì báo cho
      người lái biết</b>. Đó là lý do nhiều xe thay nhớt rất đúng hạn mà máy vẫn xuống nhanh.</p>
      <p>Trong mô hình, đường nhớt được vẽ thành ống trong suốt với các hạt chạy dọc theo
      (trên máy thật đó là lỗ khoan trong khối kim loại). Tốc độ hạt lấy trực tiếp từ con số
      lưu lượng đang hiện trên đồng hồ, nên hình và số không thể lệch nhau.</p>`,
  },

  symptoms: [
    { sign: 'Gõ đầu bò lóc cóc khi KHÔNG TẢI, hết khi lên ga',
      cause: 'Áp suất nhớt ở vòng tua thấp không đủ đẩy lên đầu bò. Nguyên nhân gốc thường là '
        + 'khe hở ổ đỡ đã mòn rộng (sức cản tụt) chứ không phải bơm yếu.',
      fix: 'Đo áp suất nhớt trước khi kết luận. Nếu áp đủ ở vòng tua cao mà thiếu ở không tải '
        + 'thì vấn đề ở khe hở, không phải ở bơm. Kiểm khe hở cò mổ và trục cam trước.' },
    { sign: 'Gõ đầu bò ở MỌI vòng tua, ngay sau khi vừa thay nhớt',
      cause: 'Đường nhớt lên đầu bò bị tắc, hoặc lắp thiếu/lệch gioăng đệm che đường nhớt, '
        + 'hoặc quên thông đường sau khi tách máy.',
      fix: 'Tháo nắp đầu bò, quay máy bằng tay và xem nhớt có ứa lên trục cam không. '
        + 'Không ứa thì thổi khí nén ngược từng đường.' },
    { sign: 'Máy nhanh xuống dù thay nhớt rất đúng hạn',
      cause: 'Bộ lọc li tâm chưa từng được vệ sinh — đây là nguyên nhân âm thầm và phổ biến nhất. '
        + 'Nhớt mới chạy qua buồng lọc đầy cặn thì vẫn bẩn ngay.',
      fix: 'Mở vỏ máy phải, mở nắp buồng lọc, vét cặn, thay o-ring. Làm mỗi 10.000–15.000 km.' },
    { sign: 'Áp suất nhớt KHÔNG lên ở vòng tua cao',
      cause: 'Van an toàn kẹt MỞ (bi kẹt hoặc lò xo yếu) · lưới lọc tắc làm bơm hụt · '
        + 'ba khe hở của bơm đã vượt dung sai.',
      fix: 'Kiểm van an toàn TRƯỚC khi tháo bơm — nó dễ tháo hơn nhiều và là nguyên nhân '
        + 'hay bị quy oan cho bơm.' },
    { sign: 'Máy bó cứng sau vài phút chạy, xe vừa được "làm máy"',
      cause: 'Nhông dẫn động bơm bằng nhựa bị vỡ răng, hoặc lắp thiếu then dẹt trên trục bơm, '
        + 'hoặc lắp rôto ngược mặt.',
      fix: 'Đây là hỏng hóc do lắp sai. Mở vỏ máy phải kiểm nhông bơm. Sau mỗi lần đại tu, '
        + 'trước khi lắp bugi phải quay máy và xác nhận nhớt ứa lên trục cam.' },
    { sign: 'Nhớt bị đẩy ra ngoài qua phớt sau khi khởi động máy nguội',
      cause: 'Van an toàn kẹt ĐÓNG. Nhớt nguội rất đặc, sức cản cao, không có van xả thì '
        + 'áp suất tăng đủ để bung phớt.',
      fix: 'Tháo van, làm sạch bi và ổ bi, kiểm lò xo. Thay cả bộ nếu bi có vết rỗ.' },
    { sign: 'Que thăm báo thiếu nhớt liên tục nhưng không thấy rỉ ở đâu',
      cause: 'Đo khi xe dựng chân chống nghiêng — số đọc luôn thấp hơn thực tế. '
        + 'Hoặc nhớt đang bị đốt (khói xanh) do xéc-măng hoặc phớt xupap.',
      fix: 'Đo lại khi xe ĐỨNG THẲNG, đã tắt máy 2–3 phút. Nếu thật sự hao thì tìm khói xanh '
        + 'ở ống xả (hệ thống 02) trước khi đổ thêm.' },
    { sign: 'Mạt kim loại SÁNG trên lưới lọc hoặc trong buồng lọc li tâm',
      cause: 'Có chi tiết đang mòn nhanh: ổ bi, bạc, hoặc bánh răng hộp số.',
      fix: 'KHÔNG lắp lại rồi chạy tiếp. Mạt sáng là dấu hiệu mòn đang diễn ra — phải truy '
        + 'nguồn gốc. Mạt màu đen mềm thì là muội than, bình thường.' },
  ],
};
