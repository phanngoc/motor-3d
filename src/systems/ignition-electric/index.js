/**
 * index.js — Module hệ thống 08: Đánh lửa CDI & hệ thống điện.
 *
 * Trang này có hai bài đáng xem, và cả hai đều là chẩn đoán:
 *
 *  1. GÓC ĐÁNH LỬA SỚM không phải một đường cong tùy ý. Nó suy ra từ hai sự thật
 *     tách bạch: trễ bén lửa không đổi theo THỜI GIAN, cháy lan không đổi theo
 *     GÓC. Bảng số cho thấy đúng phần nào đến từ đâu.
 *
 *  2. ĐIỆN ÁP CẦN để phóng tia tăng theo ÁP SUẤT trong xy-lanh. Vì vậy bô-bin
 *     yếu, bugi hở rộng, và bugi đóng muội — ba hỏng hóc khác nhau — đều nổ tốt
 *     lúc không tải và đều BỎ MÁY khi có tải. Đây là lý do "thử bugi bằng cách
 *     cho nổ tại chỗ" là phép thử vô nghĩa, và cũng là lý do CDI bị thay oan.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, COMBUSTION, CYL, IGN, ALT, LOADS, LOAD_LINE,
  idealAdvance, sparkAdvance, knockLimited, msToCrankDeg,
  cylinderPressureBar, requiredKv, availableKv, sparkState,
  alternatorAmps, loadAmps, chargeBalance, breakEvenRpm, systemVoltage,
  rotorRadiusAt, rotorOuterRadiusAt, pulserGapAt, pulserSignal,
  PULSER_OUTER_R, COVER_INNER_R,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const RO = L.rotor, PL = L.plug, PU = L.pulser, ST = L.stator;
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const vn = (v, d = 1) => v.toFixed(d).replace('.', ',');

// ─────────────────────────────────────────────────────────────────────────────
// KIỂM TRA KỸ THUẬT
// ─────────────────────────────────────────────────────────────────────────────

const checks = [
  {
    name: 'Góc sớm TĂNG theo vòng tua, và tăng ĐÚNG bằng phần do trễ bén lửa',
    run() {
      const rows = [1400, 3600, 5400, 8500].map((r) => ({
        r, adv: sparkAdvance(r), delay: msToCrankDeg(COMBUSTION.delayMs, r),
      }));
      // Toàn bộ mức tăng phải bằng mức tăng của thành phần thời gian
      const dAdv = rows[3].adv - rows[0].adv;
      const dDelay = rows[3].delay - rows[0].delay;
      return { pass: Math.abs(dAdv - dDelay) < 0.05,
        msg: `${rows.map((x) => `${x.r} v/ph → ${f1(x.adv)}°`).join(' · ')}. `
          + `Từ 1400 tới 8500 góc sớm tăng ${f1(dAdv)}°, và phần do TRỄ BÉN LỬA cũng tăng đúng `
          + `${f1(dDelay)}° — phần CHÁY LAN (${COMBUSTION.burnDeg50}°) không đổi vì vòng tua cao `
          + `thì xoáy khí mạnh hơn, ngọn lửa lan nhanh hơn đúng tỉ lệ.` };
    },
  },
  {
    name: 'Nếu trễ bén lửa cũng không đổi theo GÓC thì sẽ KHÔNG cần đánh lửa sớm biến thiên',
    run() {
      // Thí nghiệm tư duy bằng số: đặt delayMs = 0 thì góc sớm là hằng số.
      const at = (rpm) => 0 + COMBUSTION.burnDeg50 - COMBUSTION.targetPeakAtdc;
      const flat = at(1400) === at(8500);
      return { pass: flat,
        msg: `bỏ thành phần thời gian đi thì góc sớm sẽ là hằng số `
          + `${COMBUSTION.burnDeg50} − ${COMBUSTION.targetPeakAtdc} = `
          + `${COMBUSTION.burnDeg50 - COMBUSTION.targetPeakAtdc}° ở mọi vòng tua. `
          + `Vậy toàn bộ lý do phải có bộ đánh lửa sớm nằm ở MỘT chỗ: trễ bén lửa tính bằng thời gian.` };
    },
  },
  {
    name: 'Góc sớm bị GIỚI HẠN KÍCH NỔ chặn ở vòng tua cao',
    run() {
      const rpmCap = (() => {
        for (let r = 1000; r <= 12000; r += 10) if (knockLimited(r)) return r;
        return null;
      })();
      const at12k = sparkAdvance(12000);
      return { pass: rpmCap !== null && at12k <= COMBUSTION.knockLimitDeg + 1e-9,
        msg: `góc lý tưởng vượt giới hạn ${COMBUSTION.knockLimitDeg}° từ khoảng ${rpmCap} v/ph; `
          + `ở 12000 v/ph góc lý tưởng ${f1(idealAdvance(12000))}° nhưng CDI chỉ dùng ${f1(at12k)}°. `
          + `Chặn lại vì đánh lửa quá sớm làm áp suất tăng khi piston chưa qua ĐCT — sinh kích nổ.` };
    },
  },
  {
    name: 'ÁP SUẤT khi đánh lửa tăng theo TẢI — đây là gốc của mọi chẩn đoán tiếp theo',
    run() {
      const p = [0, 0.5, 1].map((l) => cylinderPressureBar(l));
      return { pass: p[0] < p[1] && p[1] < p[2] && p[2] > 3 * p[0],
        msg: `tải 0 / 50 / 100 % → ${p.map((v) => f1(v)).join(' / ')} bar. `
          + `Tải nặng ép áp suất lên gấp ${f1(p[2] / p[0])} lần so với không tải.` };
    },
  },
  {
    name: 'ĐIỆN ÁP CẦN tăng theo cả ÁP SUẤT và KHE HỞ bugi',
    run() {
      const a = requiredKv(0.05, PL.gapSpec);
      const b = requiredKv(0.95, PL.gapSpec);
      const c = requiredKv(0.95, PL.gapMax);
      return { pass: b > a * 1.8 && c > b * 1.5,
        msg: `khe ${PL.gapSpec} mm: không tải ${f1(a)} kV → tải nặng ${f1(b)} kV. `
          + `Cũng tải nặng nhưng khe rộng ${PL.gapMax} mm: ${f1(c)} kV. `
          + `Bô-bin lành chỉ có ${IGN.availKvHealthy} kV.` };
    },
  },
  {
    name: 'BÔ-BIN YẾU: nổ tốt lúc không tải, BỎ MÁY khi có tải',
    run() {
      const o = { coilHealth: 0.55 };
      const idle = sparkState(1400, 0.05, o);
      const load = sparkState(7300, 0.95, o);
      return { pass: idle.fires && !load.fires,
        msg: `bô-bin còn 55 %: không tải cần ${f1(idle.need)} kV / có ${f1(idle.have)} kV → NỔ `
          + `(dư ${Math.round(idle.margin * 100)} %) · tải nặng cần ${f1(load.need)} kV / có `
          + `${f1(load.have)} kV → BỎ MÁY (thiếu ${Math.round(-load.margin * 100)} %)` };
    },
  },
  {
    name: 'BUGI HỞ RỘNG: cùng một dấu vết — nên nổ tại chỗ không kết luận được gì',
    run() {
      const o = { gapMm: 1.3 };
      const idle = sparkState(1400, 0.05, o);
      const load = sparkState(7300, 0.95, o);
      return { pass: idle.fires && !load.fires,
        msg: `khe 1,3 mm: không tải NỔ (dư ${Math.round(idle.margin * 100)} %) · `
          + `tải nặng BỎ MÁY (thiếu ${Math.round(-load.margin * 100)} %). `
          + `Bô-bin vẫn tốt 100 % — chỉ khe hở rộng ra thôi.` };
    },
  },
  {
    name: 'BUGI ĐÓNG MUỘI: cũng một dấu vết như hai lỗi trên',
    run() {
      const o = { fouled: 0.8 };
      const idle = sparkState(1400, 0.05, o);
      const load = sparkState(7300, 0.95, o);
      return { pass: idle.fires && !load.fires,
        msg: `muội 80 %: không tải NỔ (dư ${Math.round(idle.margin * 100)} %) · `
          + `tải nặng BỎ MÁY (thiếu ${Math.round(-load.margin * 100)} %). `
          + `BA hỏng hóc khác nhau cho CÙNG một triệu chứng — nên phải đo, không đoán.` };
    },
  },
  {
    name: 'Hệ LÀNH thì còn dư điện áp ở mọi điểm trên đường tải',
    run() {
      let worst = Infinity, worstAt = '';
      for (const [load, rpm] of LOAD_LINE) {
        const s = sparkState(rpm, load);
        if (s.margin < worst) { worst = s.margin; worstAt = `${rpm} v/ph, tải ${Math.round(load * 100)} %`; }
      }
      return { pass: worst > 0.25,
        msg: `điểm căng nhất trên đường tải là ${worstAt}, còn dư `
          + `${Math.round(worst * 100)} % điện áp. Hệ lành phải luôn dư — dư càng nhiều thì `
          + `càng chịu được bugi cũ đi một chút.` };
    },
  },
  {
    name: 'CUỘN KÍCH khe hở rộng: mất lửa ở vòng tua THẤP trước',
    run() {
      const o = { pulserGap: 2.2 };
      const crank = sparkState(320, 0.05, o);      // đạp máy
      const run = sparkState(4000, 0.4, o);
      const okCrank = sparkState(320, 0.05);       // khe đúng đặt thì đạp máy nổ được
      return { pass: !crank.fires && run.fires && okCrank.fires,
        msg: `khe ĐÚNG ĐẶT ${PU.airGapSpec} mm: đạp máy (320 v/ph) xung mạnh `
          + `${f2(pulserSignal(320))} lần ngưỡng → có ${f1(okCrank.have)} kV → NỔ. `
          + `Khe rộng 2,2 mm: đạp máy xung chỉ ${f2(pulserSignal(320, 2.2))} → CDI KHÔNG được kích, `
          + `0 kV · nhưng ở 4000 v/ph xung ${f2(pulserSignal(4000, 2.2))} → có ${f1(run.have)} kV, `
          + `vẫn chạy. Đúng triệu chứng "đạp mãi không nổ, đẩy nổ thì chạy được".` };
    },
  },
  {
    name: 'Vấu kích nhô lên đúng chỗ và cuộn kích không cà vào rôto',
    run() {
      const gapAtLug = pulserGapAt(L.reluctor.angle);
      const gapAway = pulserGapAt(L.reluctor.angle + 180);
      return { pass: gapAtLug > 0.1 && gapAway > gapAtLug + 1,
        msg: `khe hở khi vấu kích đối diện cuộn kích ${f2(gapAtLug)} mm, khi ở phía đối diện `
          + `${f2(gapAway)} mm. Chênh ${f2(gapAway - gapAtLug)} mm chính là thứ sinh ra xung.` };
    },
  },
  {
    name: 'THEN BÁN NGUYỆT bị cắt làm SAI góc đánh lửa toàn dải',
    run() {
      const base = sparkAdvance(4000);
      const late = sparkAdvance(4000, -12);
      const early = sparkAdvance(4000, 8);
      return { pass: Math.abs(late - (base - 12)) < 1e-9 && Math.abs(early - (base + 8)) < 1e-9,
        msg: `ở 4000 v/ph góc đúng là ${f1(base)}°. Then cắt làm rôto trượt −12° → chỉ còn `
          + `${f1(late)}° (mất công suất, máy nóng) hoặc +8° → ${f1(early)}° (kích nổ). `
          + `Một chi tiết bé bằng hạt gạo làm sai cả hệ thống — và thay CDI không sửa được.` };
    },
  },
  {
    name: 'DÒNG PHÁT tỉ lệ vòng tua rồi BÃO HOÀ',
    run() {
      const a = [1000, 2000, 3000, 4000, 6000].map((r) => alternatorAmps(r));
      const linear = Math.abs((a[1] - a[0]) - (a[2] - a[1])) < 0.01;
      const sat = Math.abs(a[4] - a[3]) < 0.01 && a[4] === ALT.maxAmps;
      return { pass: linear && sat,
        msg: `1000/2000/3000/4000/6000 v/ph → ${a.map((v) => f2(v)).join(' / ')} A. `
          + `Tuyến tính ở dưới, bão hoà ở ${ALT.maxAmps} A khi từ thông đã dùng hết.` };
    },
  },
  {
    name: 'CÓ một vòng tua HOÀ VỐN SẠC, và bật đèn pha thì nó cao lên rõ',
    run() {
      const bare = breakEvenRpm({});
      const head = breakEvenRpm({ head: true });
      const all = breakEvenRpm({ head: true, brake: true, horn: true, signal: true });
      return { pass: head > bare * 2 && Number.isFinite(head),
        msg: `chỉ tải cơ bản: hoà vốn ở ${bare} v/ph · thêm đèn pha: ${head} v/ph · `
          + `thêm cả phanh + kèn + xi-nhan: ${Number.isFinite(all) ? all + ' v/ph' : 'KHÔNG BAO GIỜ HOÀ'}. `
          + `Dưới vòng tua hoà vốn thì càng chạy càng cạn ắc quy.` };
    },
  },
  {
    name: 'Không tải + đèn pha là ĐANG RÚT ắc quy, và điện áp tụt dưới 12,6 V',
    run() {
      const b = chargeBalance(1400, { head: true });
      const v = systemVoltage(1400, { head: true });
      const v2 = systemVoltage(4000, { head: true });
      return { pass: b.net < 0 && v < 12.6 && v2 >= ALT.regulatedV - 0.01,
        msg: `1400 v/ph + đèn pha: phát ${f2(b.gen)} A − tải ${f2(b.load)} A = ${f2(b.net)} A, `
          + `điện áp ${f1(v)} V (dưới 12,6 V của ắc quy nghỉ = đang bị rút). `
          + `Lên 4000 v/ph: ${f1(v2)} V = đang sạc. Đó là lý do đứng chờ đèn đỏ lâu thì đề yếu.` };
    },
  },
  {
    name: 'CỤC SẠC HỎNG: điện áp vọt lên theo vòng tua, không có gì chặn',
    run() {
      const ok = systemVoltage(8000, { head: true }, true);
      const bad = systemVoltage(8000, { head: true }, false);
      return { pass: bad > 16.5 && ok <= ALT.regulatedV + 0.01,
        msg: `8000 v/ph: cục sạc tốt giữ ${f1(ok)} V · cục sạc hỏng ${f1(bad)} V. `
          + `Trên 15,5 V là đang luộc ắc quy và sắp cháy bóng đèn hàng loạt — `
          + `đó là lý do phải đo điện áp sạc TRƯỚC khi tháo bất cứ thứ gì.` };
    },
  },
  {
    name: 'Rôto và cuộn kích nằm gọn trong vỏ máy trái',
    run() {
      const clr = COVER_INNER_R - PULSER_OUTER_R;
      const axial = RO.x0 - L.cover.x0;
      return { pass: clr > 2 && axial > 2,
        msg: `mặt ngoài vành rôto R${f1(rotorOuterRadiusAt(L.reluctor.angle))} → mũi cuộn kích `
          + `R${PU.r} (khe ${f1(PU.airGapSpec)} mm) → mép ngoài cụm cuộn kích `
          + `R${f1(PULSER_OUTER_R)} → thành trong vỏ R${f1(COVER_INNER_R)}: còn ${f1(clr)} mm. `
          + `Theo trục: rôto bắt đầu ở x=${RO.x0}, vách vỏ ở x=${L.cover.x0} — cách ${f1(axial)} mm` };
    },
  },
  {
    name: 'Mâm điện nằm TRONG lòng cốc rôto (nam châm quét qua cuộn dây)',
    run() {
      const inside = ST.x0 >= RO.x0 && ST.x1 <= RO.x1;
      const radial = RO.magnetR - 1.5 - RO.magnetT - (ST.coilR + ST.coilOuter);
      return { pass: inside && radial > 0,
        msg: `mâm điện x ${ST.x0}…${ST.x1} nằm trong cốc rôto x ${RO.x0}…${RO.x1} · `
          + `khe từ giữa mặt nam châm (R${f1(RO.magnetR - 1.5 - RO.magnetT)}) và đỉnh cuộn dây `
          + `(R${ST.coilR + ST.coilOuter}) là ${f1(radial)} mm` };
    },
  },
  {
    name: 'Quét 720° ở nhiều chế độ hỏng: không NaN, và tia lửa nổ đúng một lần mỗi chu kỳ',
    run(asm, kin) {
      const cases = [
        [1400, 0.05, 1, PL.gapSpec, 0, PU.airGapSpec, 0],
        [8500, 1.0, 0.5, PL.gapMax, 0.9, 2.2, -12],
        [4000, 0.4, 0.8, 1.0, 0.3, 1.2, 6],
      ];
      let bad = null;
      let sparkWindows = 0;
      for (const [rpm, load, coil, gap, foul, pg, key] of cases) {
        kin.setRpm(rpm); kin.setLoad(load); kin.setCoilHealth(coil);
        kin.setPlugGap(gap); kin.setFouled(foul); kin.setPulserGap(pg); kin.setKeyShift(key);
        let was = false, count = 0;
        for (let a = 0; a <= 720; a += 1) {
          const st = kin.drive(a, 1 / 60);
          for (const [k, v] of Object.entries(st)) {
            if (typeof v === 'number' && !Number.isFinite(v)) bad = `${k} @ ${a}° (${rpm} v/ph)`;
          }
          if (st.sparking && !was) count++;
          was = st.sparking;
        }
        if (count > 1) bad = `tia lửa phóng ${count} lần trong một chu kỳ ở ${rpm} v/ph`;
        if (count === 1) sparkWindows++;
      }
      kin.setRpm(1400); kin.setLoad(0.08); kin.resetFaults();
      return { pass: !bad,
        msg: bad || `3 chế độ × 721 góc — mọi số hữu hạn; ${sparkWindows} chế độ có tia lửa `
          + `và mỗi chế độ đúng MỘT lần trong 720° (một lần nổ mỗi hai vòng trục khuỷu)` };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default {
  mode: '3d',
  slug: 'ignition-electric',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,

  frameDir: [-0.44, 0.34, 0.83],
  frameExclude: ['ctx-engine', 'ctx-crank', 'harness', 'battery', 'ignition-switch',
    'starter-motor', 'starter-relay', 'main-fuse', 'kill-switch'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 349,
  initialRpm: 22,

  opsGhost: ['left-cover', 'ctx-engine', 'ctx-crank', 'rotor'],
  opsHidden: ['cover-bolts', 'cover-gasket', 'starter-motor', 'starter-clutch'],

  labels(asm, kin) {
    const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at(RO.x0 - 4, RO.rOut + 16),
        text: () => `sớm ${vn(kin.state.advance)}° trước ĐCT`,
        accent: true,
      },
      {
        pos: () => at(RO.x1 + 8, -RO.rOut - 14),
        text: () => `${kin.state.strokeName.toUpperCase()} · ${Math.round(kin.state.theta)}°`,
      },
      {
        pos: () => at(PL.x0 - 26, PL.y + 16),
        text: () => `cần ${vn(kin.state.needKv)} kV`,
        accent: () => !kin.state.fires,
      },
      {
        pos: () => at(PL.x0 - 26, PL.y + 2),
        text: () => `có ${vn(kin.state.haveKv)} kV — ${kin.state.fires ? 'NỔ' : 'BỎ MÁY'}`,
        accent: () => !kin.state.fires,
      },
      {
        pos: () => at(PL.x0 - 26, PL.y - 12),
        text: () => `khe ${vn(kin.state.plugGap, 2)} mm · ${vn(kin.state.pressureBar)} bar`,
      },
      {
        pos: () => at(L.regulator.x + 26, L.regulator.y),
        text: () => `${vn(kin.state.voltage)} V · ${vn(kin.state.netAmps, 2)} A`,
        accent: () => kin.state.netAmps < 0 || kin.state.voltage > 15.5,
      },
      {
        pos: () => at(ST.x0 - 6, PU.r + 10, 10),
        text: () => `cuộn kích, khe ${vn(kin.state.pulserGap, 2)} mm`,
      },
    ];
  },

  opsPanel(mount, kin, api) {
    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const ang = el('input', { type: 'range', min: 0, max: 720, step: 1, value: 349 });
    const angLb = el('b', { text: '349°' });
    ang.addEventListener('input', () => { api.setPlaying(false); api.setDrive(+ang.value); });

    const spd = el('input', { type: 'range', min: 4, max: 160, step: 2, value: api.rpm });
    const spdLb = el('b', { text: `${api.rpm}` });
    spd.addEventListener('input', () => { api.setRpm(+spd.value); spdLb.textContent = spd.value; });

    const sl = (min, max, val, step, fmt, set) => {
      const i = el('input', { type: 'range', min, max, step, value: val });
      const b = el('b', { text: fmt(val) });
      i.addEventListener('input', () => { set(+i.value); b.textContent = fmt(+i.value); });
      return { i, b, sync: (v) => { i.value = String(v); b.textContent = fmt(v); } };
    };

    const rpm = sl(200, 9000, 1400, 100, (v) => `${v} v/ph`, (v) => kin.setRpm(v));
    const load = sl(0, 100, 8, 1,
      (v) => (v < 15 ? `${v} % — không tải` : v > 70 ? `${v} % — TẢI NẶNG` : `${v} % — tải vừa`),
      (v) => kin.setLoad(v / 100));
    const coil = sl(30, 100, 100, 5,
      (v) => (v >= 99 ? 'bô-bin tốt' : `bô-bin còn ${v} %`), (v) => kin.setCoilHealth(v / 100));
    const gap = sl(PL.gapMin * 100, PL.gapMax * 100, PL.gapSpec * 100, 5,
      (v) => `${vn(v / 100, 2)} mm${Math.abs(v / 100 - PL.gapSpec) < 0.01 ? ' — đúng đặt' : ''}`,
      (v) => kin.setPlugGap(v / 100));
    const foul = sl(0, 100, 0, 5,
      (v) => (v ? `muội ${v} %` : 'sạch'), (v) => kin.setFouled(v / 100));
    const pg = sl(PU.airGapSpec * 100, PU.airGapMax * 100, PU.airGapSpec * 100, 10,
      (v) => `${vn(v / 100, 2)} mm${Math.abs(v / 100 - PU.airGapSpec) < 0.01 ? ' — đúng đặt' : ''}`,
      (v) => kin.setPulserGap(v / 100));
    const key = sl(-20, 10, 0, 1,
      (v) => (v === 0 ? 'then còn nguyên' : `then trượt ${v > 0 ? '+' : ''}${v}°`),
      (v) => kin.setKeyShift(v));

    const loadBtns = LOADS.filter((l) => !l.always).map((l) => {
      const b = el('button', { class: 'tlbtn', text: l.short,
        title: `${l.name} — ${l.amps} A`,
        'aria-pressed': String(!!kin.state.on[l.id]) });
      b.onclick = () => { kin.toggleLoad(l.id); b.setAttribute('aria-pressed', String(!!kin.state.on[l.id])); };
      return b;
    });

    const regBtn = el('button', { class: 'tlbtn', text: 'cục sạc tốt', 'aria-pressed': 'true',
      title: 'Bấm để mô phỏng cục sạc hỏng phần ổn áp' });
    regBtn.onclick = () => {
      const ok = !kin.state.regulatorOk;
      kin.setRegulatorOk(ok);
      regBtn.textContent = ok ? 'cục sạc tốt' : 'CỤC SẠC HỎNG';
      regBtn.setAttribute('aria-pressed', String(ok));
    };

    const syncAll = () => {
      rpm.sync(kin.state.rpm);
      load.sync(Math.round(kin.state.load * 100));
      coil.sync(Math.round(kin.state.coilHealth * 100));
      gap.sync(Math.round(kin.state.plugGap * 100));
      foul.sync(Math.round(kin.state.fouled * 100));
      pg.sync(Math.round(kin.state.pulserGap * 100));
      key.sync(kin.state.keyShift);
      regBtn.textContent = kin.state.regulatorOk ? 'cục sạc tốt' : 'CỤC SẠC HỎNG';
      regBtn.setAttribute('aria-pressed', String(kin.state.regulatorOk));
    };

    const fault = (label, title, fn) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => { kin.resetFaults(); fn(); syncAll(); } });

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bNeed = bar('ex'), bHave = bar('');
    const vAdv = el('span', { class: 'vl', text: '0°' });
    const vSplit = el('span', { class: 'vl', text: '—' });
    const vNeed = el('span', { class: 'vl', text: '0 kV' });
    const vHave = el('span', { class: 'vl', text: '0 kV' });
    const vFire = el('span', { class: 'vl', text: '—' });
    const vAmp = el('span', { class: 'vl', text: '0 A' });
    const vVolt = el('span', { class: 'vl', text: '0 V' });
    const vBe = el('span', { class: 'vl', text: '—' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'tốc độ hình' }),
        spdLb,
      ),
      el('div', { class: 'field' }, el('label', {}, 'Góc trục khuỷu', angLb), ang),
      el('div', { class: 'field' }, el('label', {}, 'VÒNG TUA', rpm.b), rpm.i),
      el('div', { class: 'field' }, el('label', {}, 'TẢI ĐỘNG CƠ', load.b), load.i),
      el('div', { class: 'field' },
        el('label', {}, 'Khung nhìn'),
        el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          el('button', { class: 'tlbtn', text: 'mâm lửa',
            title: 'Phóng vào rôto, mâm điện và cuộn kích',
            onclick: () => api.frameOn(['rotor', 'stator', 'pulser-coil'],
              [-0.62, 0.3, 0.72]) }),
          el('button', { class: 'tlbtn', text: 'bugi',
            title: 'Phóng vào khe bugi để xem tia lửa tắt khi có tải',
            onclick: () => api.frameOn(['spark-plug', 'spark-arc'], [0.5, 0.22, 0.84]) }),
          el('button', { class: 'tlbtn', text: 'toàn hệ',
            title: 'Xem cả sơ đồ nối từ mâm lửa tới bugi và ắc quy',
            onclick: () => api.frameOn(null) }),
        )),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Góc sớm' }), el('div', {}), vAdv,
        el('span', { class: 'lb', text: 'do trễ / do cháy' }), el('div', {}), vSplit,
        el('span', { class: 'lb', text: 'CẦN' }), bNeed.node, vNeed,
        el('span', { class: 'lb', text: 'CÓ' }), bHave.node, vHave,
        el('span', { class: 'lb', text: 'Tia lửa' }), el('div', {}), vFire,
        el('span', { class: 'lb', text: 'Cân bằng sạc' }), el('div', {}), vAmp,
        el('span', { class: 'lb', text: 'Điện áp hệ' }), el('div', {}), vVolt,
        el('span', { class: 'lb', text: 'Hoà vốn sạc từ' }), el('div', {}), vBe,
      ),

      el('div', { class: 'foldhead', style: { marginTop: '4px' }, text: 'Phụ tải điện đang bật' }),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        ...loadBtns, regBtn),

      el('div', { class: 'foldhead', style: { marginTop: '10px' }, text: 'Gây hỏng hóc' }),
      el('div', { class: 'field' }, el('label', {}, 'Bô-bin', coil.b), coil.i),
      el('div', { class: 'field' }, el('label', {}, 'Khe hở bugi', gap.b), gap.i),
      el('div', { class: 'field' }, el('label', {}, 'Muội trên bugi', foul.b), foul.i),
      el('div', { class: 'field' }, el('label', {}, 'Khe hở cuộn kích', pg.b), pg.i),
      el('div', { class: 'field' }, el('label', {}, 'Then bán nguyệt bánh đà', key.b), key.i),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        fault('lành', 'Không có hỏng hóc', () => {}),
        fault('bô-bin yếu', 'Cách điện bô-bin đã già', () => kin.setCoilHealth(0.55)),
        fault('bugi hở rộng', 'Điện cực mòn, khe rộng ra 1,3 mm', () => kin.setPlugGap(1.3)),
        fault('bugi muội', 'Chân sứ đóng muội dẫn điện', () => kin.setFouled(0.8)),
        fault('cuộn kích hở', 'Khe hở cuộn kích rộng 2,2 mm', () => kin.setPulserGap(2.2)),
        fault('then cắt', 'Then bán nguyệt bánh đà bị cắt, rôto trượt −12°',
          () => kin.setKeyShift(-12)),
      ),

      el('div', { class: 'note', html:
        '<b>Bài thứ nhất — vì sao phải đánh lửa sớm, và vì sao góc sớm phải TĂNG theo vòng tua.</b> '
        + 'Kéo thanh <b>vòng tua</b> và xem dòng "do trễ / do cháy". Phần <i>cháy lan</i> đứng yên ở '
        + `${COMBUSTION.burnDeg50}° vì vòng tua cao thì xoáy khí mạnh hơn, ngọn lửa lan nhanh hơn `
        + 'đúng tỉ lệ. Phần <i>trễ bén lửa</i> thì tăng liên tục, vì nó là một khoảng THỜI GIAN cố '
        + `định (${COMBUSTION.delayMs} ms) mà trục khuỷu quay càng nhanh thì càng ngốn nhiều độ. `
        + 'Toàn bộ lý do phải có bộ đánh lửa sớm nằm ở đúng một chỗ đó.<br><br>'
        + '<b>Bài thứ hai — vì sao "thử bugi cho nổ tại chỗ" là phép thử vô nghĩa.</b> '
        + 'Bấm <b>bugi hở rộng</b>, để tải ở 8 % và xem: tia lửa vẫn phóng, xe nổ bình thường. '
        + 'Giờ kéo thanh <b>tải động cơ</b> lên trên 70 % — <b>tia lửa TẮT</b>. Vì áp suất trong '
        + 'xy-lanh tăng thì điện áp cần để phóng tia cũng tăng, mà bô-bin thì chỉ có bấy nhiêu kV. '
        + 'Thử tiếp <b>bô-bin yếu</b> và <b>bugi muội</b>: ba nguyên nhân khác nhau, cùng một triệu '
        + 'chứng. Đó là lý do CDI bị thay oan nhiều nhất trên xe số — vì CDI hỏng thì mất lửa '
        + 'HOÀN TOÀN, chứ không phải bỏ máy khi tải.<br><br>'
        + '<b>Bài thứ ba — sạc.</b> Để vòng tua 1400 với đèn pha bật: cân bằng sạc ÂM, điện áp dưới '
        + '12,6 V, tức ắc quy đang bị rút. Kéo vòng tua lên qua mốc "hoà vốn sạc" thì mới bắt đầu '
        + 'nạp lại. Đó là lý do đứng chờ đèn đỏ lâu rồi đề không nổi.' }),
    ));

    return {
      update() {
        const s = kin.state;
        vAdv.textContent = `${vn(s.advance)}°${s.knockLimited ? ' (bị chặn kích nổ)' : ''}`;
        vSplit.textContent = `${vn(s.advanceFromDelay)}° / ${COMBUSTION.burnDeg50}°`;
        const scale = 30;
        bNeed.i.style.width = `${Math.min(100, (s.needKv / scale) * 100)}%`;
        bHave.i.style.width = `${Math.min(100, (s.haveKv / scale) * 100)}%`;
        vNeed.textContent = `${vn(s.needKv)} kV`;
        vHave.textContent = `${vn(s.haveKv)} kV`;
        vFire.textContent = s.fires
          ? `NỔ — dư ${Math.round(s.margin * 100)} %`
          : `BỎ MÁY — thiếu ${Math.round(-s.margin * 100)} %`;
        vAmp.textContent = `${vn(s.genAmps, 2)} − ${vn(s.loadAmpsNow, 2)} = ${vn(s.netAmps, 2)} A`;
        vVolt.textContent = `${vn(s.voltage)} V`
          + (s.voltage > 15.5 ? ' — QUÁ ÁP' : s.netAmps < 0 ? ' — đang rút ắc quy' : '');
        vBe.textContent = Number.isFinite(s.breakEven) ? `${s.breakEven} v/ph` : 'không bao giờ';
        ang.value = String(Math.round(s.theta));
        angLb.textContent = `${Math.round(s.theta)}°`;
      },
    };
  },

  intro: {
    title: 'Góc sớm suy ra từ hai sự thật, và tia lửa cần bao nhiêu vôn thì tuỳ TẢI',
    html: `
      <p><b>Vì sao phải đánh lửa TRƯỚC điểm chết trên?</b> Vì cháy hết hỗn hợp mất thời gian.
      Muốn áp suất cực đại rơi vào khoảng ${COMBUSTION.targetPeakAtdc}° <i>sau</i> điểm chết trên
      — nơi đẩy piston hiệu quả nhất — thì phải châm lửa sớm hơn.</p>

      <p><b>Vì sao góc sớm phải TĂNG theo vòng tua?</b> Đây là chỗ hay bị nói cho qua. Quá trình
      cháy có hai giai đoạn, và chúng phụ thuộc vòng tua theo hai cách khác nhau:</p>
      <ul>
        <li><b>Trễ bén lửa</b> (${COMBUSTION.delayMs} ms) — từ lúc tia lửa phóng tới lúc có nhân
        lửa cháy được. Đây là một quá trình vật lý–hoá học, nó mất một khoảng <b>THỜI GIAN</b> cố
        định, không quan tâm trục khuỷu quay nhanh hay chậm. Nên vòng tua càng cao thì khoảng thời
        gian đó chiếm càng nhiều <b>ĐỘ</b> góc quay.</li>
        <li><b>Cháy lan</b> (${COMBUSTION.burnDeg50}°) — từ nhân lửa tới lúc cháy được nửa lượng
        hỗn hợp. Cái này gần như không đổi theo <b>GÓC</b>, vì vòng tua cao thì dòng khí trong buồng
        đốt xoáy mạnh hơn và ngọn lửa lan nhanh hơn đúng tỉ lệ.</li>
      </ul>
      <p>Cộng lại: góc sớm = (phần thời gian) + (phần góc) − ${COMBUSTION.targetPeakAtdc}°.
      Chỉ có <b>phần đầu</b> tăng theo vòng tua — và đó là toàn bộ lý do tồn tại của bộ đánh lửa
      sớm. Trong chế độ Hoạt động, dòng "do trễ / do cháy" tách rõ hai phần đó ra.</p>

      <p><b>Điện áp cần để phóng tia phụ thuộc ÁP SUẤT.</b> Đây là điều thực dụng nhất của cả trang.
      Theo định luật Paschen, điện áp đánh xuyên tăng theo cả khe hở lẫn áp suất khí. Lúc không tải,
      bướm ga gần đóng nên áp suất cuối kỳ nén chỉ khoảng
      ${f1(cylinderPressureBar(0.05))} bar và chỉ cần ${f1(requiredKv(0.05, PL.gapSpec))} kV.
      Lúc tải nặng, áp suất lên ${f1(cylinderPressureBar(0.95))} bar và cần
      ${f1(requiredKv(0.95, PL.gapSpec))} kV. Bô-bin lành có khoảng ${IGN.availKvHealthy} kV.</p>
      <p><b>Hệ quả:</b> bô-bin yếu, bugi hở rộng, bugi đóng muội — ba hỏng hóc hoàn toàn khác nhau —
      đều <b>nổ bình thường lúc không tải</b> và đều <b>bỏ máy khi lên ga có tải</b>. Vì vậy
      <b>thử bugi bằng cách cho nổ tại chỗ không kết luận được gì</b>, và vì vậy CDI bị thay oan
      rất nhiều: CDI hỏng thì mất lửa HOÀN TOÀN, không phải bỏ máy khi tải.</p>
      <p>Bật chế độ Hoạt động và kéo thanh <b>tải động cơ</b> — bạn sẽ thấy tia lửa ở khe bugi
      tắt đi ngay trên hình.</p>`,
  },

  symptoms: [
    { sign: 'Chạy bình thường ở ga nhỏ, lên ga có tải thì BỎ MÁY / giật cục',
      cause: 'Điện áp đánh lửa không đủ khi áp suất xy-lanh cao. Nguyên nhân theo thứ tự nên kiểm: '
        + 'khe hở bugi rộng · bugi đóng muội · nắp bugi hoặc dây cao áp rò · bô-bin yếu.',
      fix: 'ĐO khe hở bugi bằng lá căn (đừng nhìn bằng mắt). Soi dây cao áp trong tối khi máy chạy. '
        + 'KHÔNG thay CDI cho triệu chứng này — CDI hỏng thì mất lửa hoàn toàn.' },
    { sign: 'Đạp mãi không nổ, nhưng ĐẨY NỔ thì chạy được và chạy tốt',
      cause: 'Xung cuộn kích quá yếu ở tốc độ quay thấp: khe hở cuộn kích rộng ra, hoặc cuộn kích '
        + 'gần đứt. Xung sinh ra tỉ lệ tốc độ quay nên nó yếu nhất đúng lúc đạp máy.',
      fix: 'Mở vỏ máy trái, đo khe hở cuộn kích bằng lá căn, đo điện trở cuộn kích.' },
    { sign: 'Mất lửa HOÀN TOÀN, không có tia nào',
      cause: 'CDI · bô-bin đứt · công tắc tắt máy bị chạm mát · giắc lỏng.',
      fix: 'Đây mới là triệu chứng của CDI. Nhưng vẫn kiểm giắc và công tắc tắt máy TRƯỚC — '
        + 'chúng rẻ hơn nhiều và hỏng thường xuyên hơn.' },
    { sign: 'Máy tắt ngẫu nhiên khi đi đường xấu, đo tĩnh thì hoàn toàn bình thường',
      cause: 'Dây của CÔNG TẮC TẮT MÁY bị tróc vỏ cọ vào khung. Logic của công tắc này là '
        + 'NỐI MÁT thì tắt — nên một chỗ tróc vỏ chạm khung sẽ tắt máy đúng lúc xe rung.',
      fix: 'Lắc từng đoạn bó dây khi máy đang nổ để tái hiện. Bọc lại chỗ tróc và định vị lại dây.' },
    { sign: 'Xe khó nổ hoặc nổ dội, đã thay CDI, bugi, bô-bin mà không hết',
      cause: 'THEN BÁN NGUYỆT của bánh đà bị cắt -> rôto lệch góc -> sai thời điểm đánh lửa toàn dải.',
      fix: 'Tháo rôto bằng VAM RÚT và kiểm then. Chi tiết chỉ bé bằng hạt gạo nên hay bị bỏ qua. '
        + 'Xem thêm hệ thống 03.' },
    { sign: 'Đề yếu dần, hay hết điện sau khi đi trong phố nhiều',
      cause: 'Chạy quá nhiều thời gian DƯỚI vòng tua hoà vốn sạc (đứng chờ đèn đỏ với đèn pha bật). '
        + 'Hoặc cuộn nạp chạm mát, hoặc cục sạc hỏng phần chỉnh lưu.',
      fix: 'Đo điện áp ở cọc ắc quy khi máy chạy 5000 v/ph: phải 13,5–14,8 V. Thấp hơn thì truy '
        + 'cuộn nạp và cục sạc.' },
    { sign: 'Cháy bóng đèn liên tục, ắc quy phồng hoặc sôi',
      cause: 'Cục sạc hỏng phần ổn áp -> điện áp vọt lên gần 18 V ở vòng tua cao.',
      fix: 'Đo điện áp ở vòng tua cao. Trên 15,5 V là phải thay cục sạc NGAY, không chạy tiếp. '
        + 'Kiểm luôn cánh tản nhiệt có bị bọc bụi.' },
    { sign: 'Lửa yếu + không sạc + đèn chập chờn CÙNG LÚC',
      cause: 'Phớt chặn nhớt bên TRÁI hỏng -> nhớt ngấm vào mâm lửa. Một nguyên nhân, ba triệu chứng.',
      fix: 'Mở vỏ máy trái. Thấy nhớt bám dày trên stator là đúng. Thay phớt (hệ thống 03), '
        + 'vệ sinh và đo cách điện các cuộn.' },
    { sign: 'Bấm đề nghe "tách" mà củ đề không quay',
      cause: 'Tiếp điểm rơ-le đề rỗ · ắc quy yếu · tiếp xúc cọc ắc quy kém.',
      fix: 'Đo điện áp ắc quy TRONG LÚC bấm đề: tụt dưới 9,5 V là ắc quy. Nếu vẫn trên 11 V mà '
        + 'không quay thì là rơ-le hoặc củ đề.' },
    { sign: 'Bấm đề nghe "rào rào", máy không quay, nhưng đèn KHÔNG tối đi',
      cause: 'Bộ bendix (ly hợp một chiều) trượt — con lăn hoặc lò xo mòn.',
      fix: 'Đèn không tối đi là dấu hiệu phân biệt: củ đề không rút dòng lớn, nghĩa là nó đang '
        + 'quay không tải. Phải mở vỏ trái và thay bendix.' },
  ],
};
