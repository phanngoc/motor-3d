/**
 * index.js — Module hệ thống 07: Nạp – xả & cung cấp nhiên liệu.
 *
 * Bảng điều khiển của trang này là một MÁY CHẨN ĐOÁN: gây một hỏng hóc cụ thể
 * rồi quét cả dải ga và xem tỉ lệ xăng sai ở KHOẢNG NÀO. Mỗi hỏng hóc để lại một
 * dấu vết riêng theo dải ga, và chính dấu vết đó mới là thứ dùng để chẩn — không
 * phải triệu chứng chung chung "xe chạy không được".
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, ENGINE, CAL, THROAT_AREA, MAIN_JET_AREA, PILOT_JET_AREA, LOAD_LINE,
  boreRadiusAt, slideLift01, depressionKpa, airFlowLpm, manifoldVacuumKpa,
  butterflyOpenArea01, fuelFlows, afr, afrVerdict, needleGapArea, mainCircuitArea,
  mainCircuitLimiter,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const C = L.carb, SL = L.slide, BF = L.butterfly, BW = L.bowl;
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const vn = (v, d = 1) => v.toFixed(d).replace('.', ',');

/** AFR tại một điểm làm việc, cho gọn khi viết phép kiểm. */
const A = (rpm, th, o = {}) => afr(rpm, th, o);

// ─────────────────────────────────────────────────────────────────────────────
// KIỂM TRA KỸ THUẬT
// ─────────────────────────────────────────────────────────────────────────────

const checks = [
  {
    name: 'Họng khuếch tán THẮT LẠI — không thắt thì không hút được xăng',
    run() {
      const rT = boreRadiusAt(C.zThroat), rIn = boreRadiusAt(C.z1);
      return { pass: rT < rIn - 1,
        msg: `Ø lỗ thông ${rIn * 2} mm → Ø họng ${f1(rT * 2)} mm · khí qua họng chạy nhanh gấp `
          + `${f2((rIn / rT) ** 2)} lần, và nhanh hơn thì áp suất thấp hơn — đó là cái hút xăng lên` };
    },
  },
  {
    name: 'Biên dạng lỗ thông liên tục, thắt dần chứ không gấp khúc',
    run() {
      let maxJump = 0, prev = boreRadiusAt(C.z0);
      for (let z = C.z0; z <= C.z1; z += 0.5) {
        const r = boreRadiusAt(z); maxJump = Math.max(maxJump, Math.abs(r - prev)); prev = r;
      }
      return { pass: maxJump < 0.35,
        msg: `bước nhảy bán kính lớn nhất trên mỗi 0,5 mm là ${f2(maxJump)} mm — dòng khí không rối` };
    },
  },
  {
    name: 'VAN TRƯỢT ĐI THEO LƯU LƯỢNG KHÍ, KHÔNG theo tay ga',
    run() {
      const wideSlow = slideLift01(1600, 1.0);
      const smallFast = slideLift01(7000, 0.22);
      return { pass: wideSlow < smallFast - 0.2,
        msg: `ga 100 % @ 1600 v/ph → van mở ${Math.round(wideSlow * 100)} % · `
          + `ga 22 % @ 7000 v/ph → van mở ${Math.round(smallFast * 100)} %. `
          + `Vặn hết ga ở vòng tua thấp mở van ÍT HƠN là ga nhỏ ở vòng tua cao — `
          + `van trượt nghe lưu lượng khí, không nghe tay ga.` };
    },
  },
  {
    name: 'Van trượt là vòng hồi tiếp ÂM (mở rộng thì chân không giảm)',
    run() {
      const q = airFlowLpm(6000, 0.6);
      const d = [0, 0.25, 0.5, 0.75, 1].map((l) => depressionKpa(q, l));
      const dec = d.every((v, i) => i === 0 || v < d[i - 1]);
      return { pass: dec,
        msg: `cùng lưu lượng ${f1(q)} L/ph, chân không theo độ mở 0/25/50/75/100 % = `
          + `${d.map((v) => f2(v)).join(' / ')} kPa — giảm dần, nên van tự tìm được một điểm cân bằng` };
    },
  },
  {
    name: 'Tiết diện bướm ga đi theo (1 − cos): đầu tay ga MỊN, cuối tay ga THÔ',
    run() {
      const a = [0.25, 0.5, 0.75, 1].map((t) => butterflyOpenArea01(t));
      const firstQuarter = a[0], lastQuarter = a[3] - a[2];
      return { pass: firstQuarter < lastQuarter,
        msg: `tay ga 25/50/75/100 % → ${a.map((v) => Math.round(v * 100) + ' %').join(' / ')} tiết diện. `
          + `1/4 tay ga ĐẦU chỉ mở ${Math.round(firstQuarter * 100)} % tiết diện, `
          + `còn 1/4 CUỐI mở thêm ${Math.round(lastQuarter * 100)} % — vì phần bị đĩa che là hình `
          + `ellipse, diện tích tỉ lệ cos góc nghiêng.` };
    },
  },
  {
    name: 'MẠCH CHÍNH KHÔNG CHẢY ở không tải — vì miệng phun cao hơn mặt xăng',
    run() {
      const f = fuelFlows(1400, 0.03);
      return { pass: f.main < 1e-6 && f.pilot > 0.1,
        msg: `không tải: chân không họng ${f2(f.dThroat)} kPa < cột xăng `
          + `${f2(CAL.fuelHeadKpa)} kPa nên mạch chính cấp ${f.main.toFixed(3)} g/ph. `
          + `Mạch chậm cấp ${f2(f.pilot)} g/ph — và đó chính là lý do bộ hoà khí PHẢI có mạch chậm riêng.` };
    },
  },
  {
    name: 'GÍC-LƠ CHÍNH và KHE KIM nối tiếp: mỗi cái quyết định ở một khoảng',
    run() {
      const low = mainCircuitLimiter(0.2), high = mainCircuitLimiter(0.95);
      const aLow = needleGapArea(0.2), aHigh = needleGapArea(0.95);
      return { pass: low === 'kim xăng' && high === 'gíc-lơ chính',
        msg: `van mở 20 % → khe kim ${f2(aLow)} mm² < gíc-lơ chính ${f2(MAIN_JET_AREA)} mm² nên ${low} `
          + `quyết định · van mở 95 % → khe kim ${f2(aHigh)} mm² nên ${high} quyết định. `
          + `Vì vậy đổi gíc-lơ chính KHÔNG sửa được lỗi tầm ga giữa, và ngược lại.` };
    },
  },
  {
    name: 'Tiết diện mạch chính TĂNG ĐƠN ĐIỆU theo độ mở van trượt',
    run() {
      let mono = true, prev = -1;
      for (let l = 0; l <= 1.0001; l += 0.02) {
        const a = mainCircuitArea(l); if (a < prev - 1e-9) mono = false; prev = a;
      }
      return { pass: mono,
        msg: `quét 51 mức mở van: ${f2(mainCircuitArea(0))} → ${f2(mainCircuitArea(1))} mm², `
          + `không có chỗ tụt (nếu tụt thì xe sẽ hụt ga ở giữa dải)` };
    },
  },
  {
    name: 'MẠCH CHẬM lo ga nhỏ, MẠCH CHÍNH lo ga lớn, và chuyển giao dần',
    run() {
      const rows = LOAD_LINE.map(([t, rpm]) => {
        const f = fuelFlows(rpm, t);
        return { t, share: f.total > 1e-9 ? f.pilot / f.total : 1 };
      });
      let mono = true;
      for (let i = 1; i < rows.length; i++) if (rows[i].share > rows[i - 1].share + 1e-9) mono = false;
      const first = rows[0].share, last = rows[rows.length - 1].share;
      return { pass: first > 0.9 && last < 0.1 && mono,
        msg: `tỉ lệ mạch chậm dọc đường tải: `
          + `${rows.map((r) => Math.round(r.share * 100)).join(' → ')} % — `
          + `giảm dần từ ${Math.round(first * 100)} % xuống ${Math.round(last * 100)} %, không nhảy bậc` };
    },
  },
  {
    name: 'Chuyển giao mạch KHÔNG để lỗ trống — tổng xăng tăng dọc đường tải',
    run() {
      let mono = true, prev = -1, worst = '';
      for (const [t, rpm] of LOAD_LINE) {
        const f = fuelFlows(rpm, t);
        if (f.total < prev - 1e-6) { mono = false; worst = `ga ${Math.round(t * 100)} %`; }
        prev = f.total;
      }
      return { pass: mono,
        msg: mono ? `${LOAD_LINE.length} điểm trên đường tải: lượng xăng luôn tăng, không chỗ hụt`
          : `lượng xăng TỤT tại ${worst} — sẽ là một lỗ hụt ga thật trên xe` };
    },
  },
  {
    name: 'Bộ hoà khí lành: AFR nằm trong dải dùng được trên cả đường tải',
    run() {
      let lo = 99, hi = 0, bad = '';
      for (const [t, rpm] of LOAD_LINE) {
        const v = A(rpm, t); lo = Math.min(lo, v); hi = Math.max(hi, v);
        if (v < 11.8 || v > 15.8) bad = `ga ${Math.round(t * 100)} % → ${vn(v)}`;
      }
      return { pass: !bad,
        msg: bad ? `ra ngoài dải tại ${bad}`
          : `AFR đi từ ${vn(lo)} đến ${vn(hi)} dọc đường tải (lý tưởng ${vn(ENGINE.afrStoich)}). `
            + `Còn gợn ở hai vùng chuyển giao mạch — đó là chỗ "flat spot" có thật trên xe.` };
    },
  },
  {
    name: 'TẮC GÍC-LƠ CHẬM: chết ở không tải, KHÔNG đổi gì ở ga lớn',
    run() {
      const o = { pilotBlock: 1 };
      const i0 = A(1400, 0.03), i1 = A(1400, 0.03, o);
      const w0 = A(7300, 0.9), w1 = A(7300, 0.9, o);
      return { pass: i1 > 22 && Math.abs(w1 - w0) / w0 < 0.06,
        msg: `ga 3 %: ${vn(i0)} → ${vn(i1)} (không nổ nổi) · ga 90 %: ${vn(w0)} → ${vn(w1)} `
          + `(đổi ${Math.round(Math.abs(w1 - w0) / w0 * 100)} %). Đúng triệu chứng `
          + `"không nổ được / không tải không nổi, nhưng vặn ga to lại chạy".` };
    },
  },
  {
    name: 'TẮC GÍC-LƠ CHÍNH: không tải bình thường, ga lớn nghèo hẳn',
    run() {
      const o = { mainBlock: 0.75 };
      const i0 = A(1400, 0.03), i1 = A(1400, 0.03, o);
      const w0 = A(7300, 0.9), w1 = A(7300, 0.9, o);
      return { pass: Math.abs(i1 - i0) / i0 < 0.06 && w1 > 18,
        msg: `ga 3 %: ${vn(i0)} → ${vn(i1)} (đổi ${Math.round(Math.abs(i1 - i0) / i0 * 100)} %) · `
          + `ga 90 %: ${vn(w0)} → ${vn(w1)}. Đúng triệu chứng "chạy phố tốt, ra đường lớn thì hụt".` };
    },
  },
  {
    name: 'Hai hỏng hóc trên có DẤU VẾT NGƯỢC NHAU — thử hai mức ga là phân biệt được',
    run() {
      const dp = A(1400, 0.03, { pilotBlock: 1 }) - A(7300, 0.9, { pilotBlock: 1 });
      const dm = A(1400, 0.03, { mainBlock: 0.75 }) - A(7300, 0.9, { mainBlock: 0.75 });
      return { pass: dp > 0 && dm < 0,
        msg: `tắc gíc-lơ chậm: AFR(ga nhỏ) − AFR(ga lớn) = +${vn(dp)} · tắc gíc-lơ chính: ${vn(dm)}. `
          + `Dấu ngược nhau, nên chỉ cần thử hai mức ga là biết phải mở gíc-lơ nào — `
          + `không phải tháo cả bộ hoà khí ra rửa.` };
    },
  },
  {
    name: 'LỌC GIÓ TẮC: gần như KHÔNG đổi không tải, làm GIÀU khi có tải',
    run() {
      const o = { filterClog: 0.9 };
      const i0 = A(1400, 0.03), i1 = A(1400, 0.03, o);
      const m0 = A(5400, 0.5), m1 = A(5400, 0.5, o);
      const w0 = A(7300, 0.9), w1 = A(7300, 0.9, o);
      return { pass: Math.abs(i1 - i0) / i0 < 0.14 && m1 < m0 * 0.86 && w1 < w0 * 0.86,
        msg: `ga 3 %: ${vn(i0)}→${vn(i1)} · ga 50 %: ${vn(m0)}→${vn(m1)} · ga 90 %: ${vn(w0)}→${vn(w1)}. `
          + `Lọc gió nối TIẾP với bướm ga nên lúc không tải bướm ga mới là chỗ hẹp nhất — `
          + `vì vậy lọc tắc cho khói đen KHI CHẠY chứ không phải lúc đứng nổ máy.` };
    },
  },
  {
    name: 'MỨC XĂNG SAI làm sai TOÀN dải, kể cả không tải — dấu vết khác lọc gió',
    run() {
      const rows = []; let ok = true;
      for (const [t, rpm] of [[0.03, 1400], [0.5, 5400], [0.9, 7300]]) {
        const base = A(rpm, t);
        const rich = A(rpm, t, { fuelLevelOffset: L.fuelLevel.range });
        const lean = A(rpm, t, { fuelLevelOffset: -L.fuelLevel.range });
        rows.push(`ga ${Math.round(t * 100)} %: ${vn(lean)} | ${vn(base)} | ${vn(rich)}`);
        if (!(rich < base * 0.9 && lean > base * 1.1)) ok = false;
      }
      return { pass: ok,
        msg: `mức thấp | định mức | mức cao → ${rows.join(' · ')}. Sai ở CẢ BA mức ga, kể cả không `
          + `tải = nghi mức xăng. Nếu không tải bình thường mà có tải mới sai = nghi lọc gió.` };
    },
  },
  {
    name: 'E GIÓ làm giàu MẠNH ở ga nhỏ và ít ảnh hưởng ga lớn (đúng việc của nó)',
    run() {
      const o = { choke: true };
      const i0 = A(1400, 0.03), i1 = A(1400, 0.03, o);
      const w0 = A(7300, 0.9), w1 = A(7300, 0.9, o);
      return { pass: i1 < i0 / 1.7 && w1 > w0 / 1.3,
        msg: `ga 3 %: ${vn(i0)} → ${vn(i1)} (giàu ${vn(i0 / i1, 2)} lần) · `
          + `ga 90 %: ${vn(w0)} → ${vn(w1)} (${vn(w0 / w1, 2)} lần). Vì thế e gió kẹt MỞ chỉ làm `
          + `khói đen và tốn xăng khi chạy chậm, còn chạy nhanh thì gần như không thấy.` };
    },
  },
  {
    name: 'Gíc-lơ luôn NGẬP xăng, và mặt xăng luôn DƯỚI sàn lỗ thông',
    run() {
      const boreFloor = -L.carb.rThroat;
      const submerged = L.fuelLevel.spec - L.mainJet.y;
      const belowBore = boreFloor - L.fuelLevel.spec;
      const worstLevel = L.fuelLevel.spec + L.fuelLevel.range;
      return { pass: submerged > 4 && belowBore > 2 && worstLevel < boreFloor,
        msg: `gíc-lơ chính y=${L.mainJet.y}, mặt xăng y=${L.fuelLevel.spec}, sàn lỗ thông `
          + `y=${f1(boreFloor)}. Gíc-lơ ngập ${f1(submerged)} mm · mặt xăng thấp hơn sàn lỗ thông `
          + `${f1(belowBore)} mm, và kể cả khi mức dâng hết cỡ (${worstLevel}) vẫn còn thấp hơn — `
          + `nên xăng KHÔNG tự chảy vào lỗ thông khi đỗ.` };
    },
  },
  {
    name: 'Van trượt có đủ chỗ nhấc hết hành trình trong buồng chân không',
    run() {
      const top = SL.yClosed + SL.travel + SL.h;
      return { pass: top < SL.chamberTop - 2,
        msg: `van mở hết: đỉnh van y=${top}, trần buồng y=${SL.chamberTop} — còn `
          + `${f1(SL.chamberTop - top)} mm` };
    },
  },
  {
    name: 'Bướm ga vừa lỗ thông: có khe để không kẹt, nhưng khe phải nhỏ',
    run() {
      const rBore = boreRadiusAt(BF.z), gap = rBore - BF.r;
      return { pass: gap > 0.1 && gap < 1.2,
        msg: `Ø đĩa ${BF.r * 2} mm trong lỗ Ø${f1(rBore * 2)} mm — khe vành ${f2(gap)} mm. `
          + `Phải có khe (không thì kẹt) nhưng phải nhỏ (không thì không tải không hạ được).` };
    },
  },
  {
    name: 'Kim xăng thuôn đúng chiều: van nhấc cao thì khe kim rộng ra',
    run() {
      let mono = true, prev = -1;
      for (let l = 0; l <= 1.0001; l += 0.05) {
        const a = needleGapArea(l); if (a < prev - 1e-9) mono = false; prev = a;
      }
      const clr = L.needleJet.rIn - L.needle.rStraight;
      return { pass: mono && clr > 0.01 && clr < 0.06,
        msg: `khe kim mở 0 → 100 %: ${f2(needleGapArea(0))} → ${f2(needleGapArea(1))} mm², tăng đều. `
          + `Khe hướng kính khi van đóng ${Math.round(clr * 1000)} µm — kim được dẫn hướng ở van `
          + `trượt nên không tì vào ống kim.` };
    },
  },
  {
    name: 'Quét cả dải ga ở nhiều chế độ hỏng: không NaN',
    run(asm, kin) {
      const cases = [
        [1400, 0, 0, 0, 0, false],
        [7000, 1, 1, 1, L.fuelLevel.range, true],
        [4000, 0.5, 0.4, 0.6, -L.fuelLevel.range, false],
      ];
      let bad = null;
      for (const [rpm, fc, pb, mb, fl, ch] of cases) {
        kin.setRpm(rpm); kin.setFilterClog(fc); kin.setPilotBlock(pb);
        kin.setMainBlock(mb); kin.setFuelLevel(fl); kin.setChoke(ch);
        for (let a = 0; a <= 720; a += 5) {
          const st = kin.drive(a, 1 / 60);
          for (const [k, v] of Object.entries(st)) {
            if (typeof v === 'number' && !Number.isFinite(v)) bad = `${k} @ ${a}° (${rpm} v/ph)`;
          }
        }
      }
      kin.setRpm(1400); kin.resetFaults();
      return { pass: !bad, msg: bad ? `NaN tại ${bad}` : '3 chế độ × 145 điểm — mọi số hữu hạn' };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default {
  mode: '3d',
  slug: 'fuel-intake',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,

  frameDir: [0.72, 0.26, 0.64],
  frameExclude: ['ctx-exhaust', 'ctx-tank', 'ctx-head', 'airbox', 'air-filter', 'intake-boot'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 60,
  initialRpm: 40,

  /** Chế độ Hoạt động: làm mờ thân để thấy van trượt, kim và mức xăng bên trong. */
  opsGhost: ['carb-body', 'ctx-head'],
  opsHidden: ['bowl-screws', 'float-bowl', 'bowl-gasket', 'carb-top-cap', 'air-filter',
    'intake-boot', 'intake-gaskets', 'airbox', 'ctx-tank', 'ctx-exhaust', 'cable-drum'],

  labels(asm, kin) {
    const at = (x, y, z) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at(0, C.bodyR + 34, C.zThroat),
        text: () => `van trượt mở ${Math.round(kin.state.slideLift * 100)} %`,
        accent: true,
      },
      {
        pos: () => at(0, C.bodyR + 12, BF.z - 18),
        text: () => `tay ga ${Math.round(kin.state.throttle * 100)} % → khí `
          + `${Math.round(kin.state.butterflyOpen * 100)} %`,
      },
      {
        pos: () => at(-C.bodyR - 26, 8, C.zThroat),
        text: () => `AFR ${vn(kin.state.afr)} — ${kin.state.verdict}`,
        accent: () => kin.state.verdictLevel !== 'ok',
      },
      {
        pos: () => at(C.bodyR + 24, -6, C.zThroat),
        text: () => kin.state.circuit,
      },
      {
        pos: () => at(0, L.mainJet.y - 12, C.zThroat - BW.r - 6),
        text: () => `xăng ${vn(kin.state.fuelTotal, 2)} g/ph — chậm `
          + `${Math.round(kin.state.pilotShare * 100)} % / chính `
          + `${Math.round(kin.state.mainShare * 100)} %`,
      },
      { pos: () => at(0, 0, C.zThroat + 2), text: () => `họng Ø${C.rThroat * 2} mm` },
      { pos: () => at(0, L.fuelLevel.spec + 6, C.zThroat + BW.r + 8), text: 'mức xăng' },
    ];
  },

  opsPanel(mount, kin, api) {
    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸',
      title: 'Quét cả dải ga lên rồi xuống (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const thr = el('input', { type: 'range', min: 0, max: 100, step: 1, value: 8 });
    const thrLb = el('b', { text: '8 %' });
    thr.addEventListener('input', () => {
      api.setPlaying(false);
      api.setDrive(kin.setThrottle(+thr.value / 100));
      thrLb.textContent = `${thr.value} %`;
    });

    const rpm = el('input', { type: 'range', min: 1000, max: 9000, step: 100, value: 1400 });
    const rpmLb = el('b', { text: '1400 v/ph' });
    rpm.addEventListener('input', () => {
      kin.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`;
      llBtn.textContent = 'tự đặt vòng tua';
      llBtn.setAttribute('aria-pressed', 'false');
    });

    const llBtn = el('button', { class: 'tlbtn', text: 'theo đường tải',
      'aria-pressed': 'true',
      title: 'Bật: vòng tua đi theo tay ga như xe chạy thật. '
        + 'Tắt: hai thanh độc lập, để xem việc van trượt không đi theo tay ga.' });
    llBtn.onclick = () => {
      const on = !kin.state.followLoadLine;
      kin.setFollowLoadLine(on);
      llBtn.textContent = (on ? 'theo đường tải' : 'tự đặt vòng tua');
      llBtn.setAttribute('aria-pressed', String(on));
    };

    const sl = (min, max, val, fmt, set) => {
      const i = el('input', { type: 'range', min, max, step: 1, value: val });
      const b = el('b', { text: fmt(val) });
      i.addEventListener('input', () => { set(+i.value); b.textContent = fmt(+i.value); });
      return { i, b, sync: (v) => { i.value = String(v); b.textContent = fmt(v); } };
    };

    const clog = sl(0, 100, 0, (v) => (v ? `tắc ${v} %` : 'sạch'), (v) => kin.setFilterClog(v / 100));
    const pb = sl(0, 100, 0, (v) => (v ? `tắc ${v} %` : 'thông'), (v) => kin.setPilotBlock(v / 100));
    const mb = sl(0, 100, 0, (v) => (v ? `tắc ${v} %` : 'thông'), (v) => kin.setMainBlock(v / 100));
    const lvl = sl(-50, 50, 0,
      (v) => (Math.abs(v) < 3 ? 'đúng định mức'
        : `${v > 0 ? 'cao' : 'thấp'} ${vn(Math.abs(v) / 10)} mm`),
      (v) => kin.setFuelLevel(v / 10));

    const chokeBtn = el('button', { class: 'tlbtn', text: 'e gió tắt',
      title: 'Bật mạch làm đậm dùng khi khởi động nguội' });
    chokeBtn.onclick = () => {
      const on = !kin.state.choke;
      kin.setChoke(on);
      chokeBtn.textContent = on ? 'e gió BẬT' : 'e gió tắt';
      chokeBtn.setAttribute('aria-pressed', String(on));
    };

    const syncAll = () => {
      clog.sync(Math.round(kin.state.filterClog * 100));
      pb.sync(Math.round(kin.state.pilotBlock * 100));
      mb.sync(Math.round(kin.state.mainBlock * 100));
      lvl.sync(Math.round(kin.state.fuelLevelOffset * 10));
      chokeBtn.textContent = kin.state.choke ? 'e gió BẬT' : 'e gió tắt';
      rpm.value = String(kin.state.rpm); rpmLb.textContent = `${kin.state.rpm} v/ph`;
      llBtn.textContent = (kin.state.followLoadLine ? 'theo đường tải' : 'tự đặt vòng tua');
      llBtn.setAttribute('aria-pressed', String(kin.state.followLoadLine));
      thr.value = String(Math.round(kin.state.throttle * 100));
      thrLb.textContent = `${Math.round(kin.state.throttle * 100)} %`;
    };

    const fault = (label, title, fn) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => { kin.resetFaults(); fn(); syncAll(); } });

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bAir = bar(''), bPilot = bar(''), bMain = bar('ex');
    const vAir = el('span', { class: 'vl', text: '0' });
    const vLift = el('span', { class: 'vl', text: '0 %' });
    const vP = el('span', { class: 'vl', text: '0' });
    const vM = el('span', { class: 'vl', text: '0' });
    const vAfr = el('span', { class: 'vl', text: '14,7' });
    const vVerd = el('span', { class: 'vl', text: '—' });
    const vLim = el('span', { class: 'vl', text: '—' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' },
          text: 'tự quét dải ga' }),
      ),
      el('div', { class: 'field' }, el('label', {}, 'TAY GA', thrLb), thr),
      el('div', { class: 'field' }, el('label', {}, 'Vòng tua động cơ', rpmLb), rpm),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px' } }, llBtn),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Lưu lượng khí' }), bAir.node, vAir,
        el('span', { class: 'lb', text: 'Van trượt mở' }), el('div', {}), vLift,
        el('span', { class: 'lb', text: 'Xăng mạch CHẬM' }), bPilot.node, vP,
        el('span', { class: 'lb', text: 'Xăng mạch CHÍNH' }), bMain.node, vM,
        el('span', { class: 'lb', text: 'AFR' }), el('div', {}), vAfr,
        el('span', { class: 'lb', text: 'Nhận xét' }), el('div', {}), vVerd,
        el('span', { class: 'lb', text: 'Đang bị chặn bởi' }), el('div', {}), vLim,
      ),

      el('div', { class: 'foldhead', style: { marginTop: '4px' }, text: 'Gây hỏng hóc để xem dấu vết' }),
      el('div', { class: 'field' }, el('label', {}, 'Lọc gió', clog.b), clog.i),
      el('div', { class: 'field' }, el('label', {}, 'Gíc-lơ CHẬM', pb.b), pb.i),
      el('div', { class: 'field' }, el('label', {}, 'Gíc-lơ CHÍNH', mb.b), mb.i),
      el('div', { class: 'field' }, el('label', {}, 'Mức xăng buồng phao', lvl.b), lvl.i),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        chokeBtn,
        fault('lành', 'Bộ hoà khí lành', () => {}),
        fault('tắc chậm', 'Xe để lâu không chạy — nhựa xăng bít lỗ nhỏ nhất',
          () => kin.setPilotBlock(1)),
        fault('tắc chính', 'Cặn từ bình xăng bít gíc-lơ chính',
          () => kin.setMainBlock(0.75)),
        fault('lọc tắc', 'Chạy đường bụi lâu không vệ sinh', () => kin.setFilterClog(0.85)),
        fault('phao ngấm', 'Mức xăng dâng cao, giàu toàn dải + tràn ống tràn',
          () => kin.setFuelLevel(L.fuelLevel.range)),
      ),

      el('div', { class: 'note', html:
        '<b>Cách dùng trang này để chẩn đoán.</b> Mỗi hỏng hóc để lại một dấu vết riêng '
        + '<i>theo dải ga</i>, và đó mới là thứ dùng để chẩn:<br>'
        + '· Bấm <b>tắc chậm</b>, đặt tay ga về 3 % → AFR vọt lên nghèo. '
        + 'Kéo tay ga lên 90 % → AFR trở lại bình thường. Đó là xe "không nổ được nhưng vặn ga to '
        + 'lại chạy".<br>'
        + '· Bấm <b>tắc chính</b> → ngược lại hẳn: ga nhỏ bình thường, ga lớn nghèo. '
        + 'Đó là xe "chạy phố tốt, ra đường lớn thì hụt".<br>'
        + '· Bấm <b>lọc tắc</b> hoặc <b>phao ngấm</b> → sai ở MỌI mức ga. '
        + 'Sai toàn dải nghĩa là lỗi ở khí hoặc ở mức xăng, KHÔNG phải ở gíc-lơ.<br><br>'
        + '<b>Điều đáng xem thứ hai — van trượt không đi theo tay ga.</b> Đặt vòng tua 1500 v/ph rồi '
        + 'kéo tay ga lên 100 %: van trượt gần như không nhấc. Giữ tay ga 25 % rồi kéo vòng tua lên '
        + '7000: van trượt mở rộng. Van trượt đi theo <b>lưu lượng khí</b>, và chính nhờ vậy tốc độ '
        + 'khí qua họng luôn đủ cao để hút xăng — đó là toàn bộ ý nghĩa của chữ CV.' }),
    ));

    return {
      update() {
        const s = kin.state;
        const airMax = airFlowLpm(9000, 1);
        bAir.i.style.width = `${Math.min(100, (s.airLpm / airMax) * 100)}%`;
        const fMax = 3.2;
        bPilot.i.style.width = `${Math.min(100, (s.fuelPilot / fMax) * 100)}%`;
        bMain.i.style.width = `${Math.min(100, (s.fuelMain / fMax) * 100)}%`;
        vAir.textContent = `${vn(s.airLpm)} L/ph`;
        vLift.textContent = `${Math.round(s.slideLift * 100)} %`;
        vP.textContent = `${vn(s.fuelPilot, 2)} g/ph`;
        vM.textContent = `${vn(s.fuelMain, 2)} g/ph`;
        vAfr.textContent = vn(s.afr);
        vVerd.textContent = s.verdict;
        vLim.textContent = s.limiter;
        thr.value = String(Math.round(s.throttle * 100));
        thrLb.textContent = `${Math.round(s.throttle * 100)} %`;
        if (s.followLoadLine) {
          rpm.value = String(s.rpm);
          rpmLb.textContent = `${s.rpm} v/ph`;
        }
      },
    };
  },

  intro: {
    title: 'Bộ hoà khí là một cái ống thắt — không có gì bơm xăng',
    html: `
      <p>Bộ hoà khí không có bơm, không có điện, không có cảm biến. Nó chỉ là một cái ống có chỗ
      <b>thắt lại</b> (Ø${C.rIn * 2} mm thắt xuống Ø${C.rThroat * 2} mm). Khí đi qua chỗ thắt phải
      chạy nhanh hơn, và khí chạy nhanh thì áp suất thấp hơn — độ giảm áp đó <b>hút</b> xăng từ
      buồng phao lên. Toàn bộ phần còn lại chỉ là những cách khác nhau để điều tiết cái ống hút đó
      cho đúng lượng ở mọi mức ga.</p>

      <p><b>Ba mạch xăng, mỗi mạch lo một khoảng ga.</b> Đây là điều then chốt và cũng hay bị bỏ qua
      nhất:</p>
      <ul>
        <li><b>Mạch chậm</b> (gíc-lơ chậm #${L.pilotJet.size}) — không tải và 1/8 tay ga đầu.
        Nó hút xăng nhờ chân không <i>sau</i> bướm ga, mà chân không đó cao nhất đúng lúc bướm ga
        đóng.</li>
        <li><b>Mạch kim</b> (kim xăng + ống kim) — khoảng 1/8 đến 3/4 tay ga. Khe giữa kim thuôn và
        ống kim là chỗ hẹp nhất trong khoảng này.</li>
        <li><b>Mạch chính</b> (gíc-lơ chính #${L.mainJet.size}) — từ khoảng 3/4 tay ga trở lên, khi
        van trượt đã nhấc cao đến mức khe kim không còn hẹp nữa.</li>
      </ul>
      <p>Gíc-lơ chính và khe kim <b>nối tiếp nhau</b>, nên cái nào nhỏ hơn thì cái đó quyết định.
      Hệ quả rất thực tế: <b>đổi gíc-lơ chính không sửa được lỗi ở tầm ga giữa</b>, và ngược lại.
      Trong bảng điều khiển có dòng "đang bị chặn bởi" cho thấy tại mỗi mức ga thì cái nào đang
      quyết định.</p>

      <p><b>Van trượt CV — chi tiết quan trọng nhất.</b> Tay ga chỉ điều khiển <i>bướm ga</i>, tức chỉ
      chặn KHÍ. Van trượt mang kim xăng lại bị <b>chân không ở họng</b> nhấc lên, nên nó đi theo
      <b>lưu lượng khí</b> chứ không theo tay ga. Vặn hết ga ở vòng tua thấp thì van trượt vẫn gần như
      đóng — nhờ vậy tốc độ khí qua họng vẫn cao và xăng vẫn được hút đúng lượng. Bộ hoà khí van trượt
      cơ đời cũ (dây ga kéo van trực tiếp) không làm được điều này nên hay bị "ngộp" khi vặn ga
      đột ngột.</p>

      <p>Bật chế độ Hoạt động: bảng bên trái là một <b>máy chẩn đoán</b>. Gây một hỏng hóc rồi quét
      dải ga, và xem tỉ lệ xăng sai ở <i>khoảng nào</i>. Chính cái "khoảng nào" đó mới là căn cứ để
      chẩn đoán.</p>`,
  },

  symptoms: [
    { sign: 'Không nổ được hoặc nổ rồi tắt, nhưng vặn ga to thì máy chạy',
      cause: 'Gíc-lơ CHẬM tắc. Lỗ của nó chỉ Ø' + L.pilotJet.r * 2 + ' mm nên tắc đầu tiên khi xe '
        + 'để lâu — xăng bay hơi để lại nhựa.',
      fix: 'Tháo gíc-lơ chậm, thông bằng dây ĐỒNG mảnh và ngâm xăng, soi qua ánh sáng. '
        + 'Tuyệt đối không dùng dây thép — làm rộng lỗ là giàu vĩnh viễn.' },
    { sign: 'Chạy trong phố bình thường, ra đường lớn vặn ga to thì hụt và máy nóng',
      cause: 'Gíc-lơ CHÍNH tắc, hoặc lưới lọc ở khoá xăng tắc (thiếu xăng ở lưu lượng lớn). '
        + 'Hai nguyên nhân cho cùng một triệu chứng.',
      fix: 'Mở buồng phao, kiểm mức xăng khi ĐANG chạy ga lớn — nếu mức tụt thì là đường cấp xăng, '
        + 'nếu mức đủ thì là gíc-lơ chính. Đây là cách phân biệt duy nhất chắc chắn.' },
    { sign: 'Xe không lên được ga lớn dù đã thay bugi, CDI, mo-bin',
      cause: 'MÀNG CAO SU của van trượt bị rạn — mất chân không nên van không nhấc. '
        + 'Chỉ cần một lỗ nhỏ như đầu kim.',
      fix: 'Tháo van trượt, căng màng và SOI QUA ÁNH SÁNG. Đây là chi tiết bị chẩn sai nhiều nhất '
        + 'của cả hệ thống, vì triệu chứng giống hệt lỗi điện.' },
    { sign: 'Không tải cao và TRÔI, hạ vít ga cũng không xuống',
      cause: 'HÚT KHÍ GIẢ: gioăng cổ hút, ống cao su nối hộp gió, hoặc ổ trục bướm ga đã mòn. '
        + 'Khí vào không qua họng nên không mang xăng theo -> nghèo -> vòng tua tự lên.',
      fix: 'Xịt nước xà phòng quanh từng mối nối khi máy đang chạy; vòng tua đổi ở đâu thì hở ở đó. '
        + 'Lắc trục bướm ga kiểm độ mòn. Rửa bộ hoà khí KHÔNG sửa được lỗi này.' },
    { sign: 'Tốn xăng gấp đôi, khói đen, bugi ướt đen',
      cause: 'Lọc gió tắc · e gió kẹt mở · mức xăng dâng cao (phao ngấm xăng hoặc van kim mòn).',
      fix: 'Theo thứ tự rẻ trước: soi lọc gió qua ánh sáng, kiểm e gió trả về hết, rồi mới đo mức xăng. '
        + 'Cả ba đều làm giàu TOÀN dải nên phải loại trừ lần lượt.' },
    { sign: 'Rỉ xăng nhỏ giọt khi đỗ, xăng chảy ra từ ống tràn',
      cause: 'Van kim phao không đóng kín: một hạt cát kẹt, hoặc mũi kim có vạch lõm, hoặc phao '
        + 'ngấm xăng mất lực nổi.',
      fix: 'Xả buồng phao và gõ nhẹ thân bộ hoà khí trước — nhiều lần hạt cát tự rơi ra. '
        + 'Nếu còn rỉ thì mở ra, lắc phao nghe có xăng bên trong, soi mũi kim. Thay CẢ CẶP kim và bệ.' },
    { sign: 'Chạy không đều, giật nhẹ ở đúng tầm ga giữa (1/4 – 1/2), ga nhỏ và ga lớn đều tốt',
      cause: 'Vấn đề của MẠCH KIM: lỗ nhũ hoá trên ống kim tắc, ống kim mòn ôvan, hoặc khấc treo '
        + 'kim bị lắp sai trong lần sửa trước.',
      fix: 'Rút ống kim ra soi 4 hàng lỗ nhỏ. Đây là khoảng ga mà đổi gíc-lơ chính hay gíc-lơ chậm '
        + 'đều KHÔNG có tác dụng — nhiều người đổi gíc-lơ mãi không hết chính vì vậy.' },
    { sign: 'Ga không tự về khi thả tay',
      cause: 'Lò xo hồi yếu · dây ga khô hoặc bị gấp · ròng rọc dây ga kẹt.',
      fix: 'Xử lý NGAY, không chạy tiếp. Tra dầu dây ga, kiểm lò xo hồi, kiểm dây có bị đi sai '
        + 'đường và bị gập ở góc lái.' },
    { sign: 'Chạy được vài phút rồi tắt, để nguội lại nổ',
      cause: 'Có NƯỚC trong buồng phao (nước nặng hơn xăng nên nằm dưới, đúng chỗ gíc-lơ hút) · '
        + 'hoặc lỗ thông hơi nắp bình xăng tắc nên bình bị chân không.',
      fix: 'Xả buồng phao xem có lớp nước. Thử nới nắp bình xăng rồi chạy lại — nếu hết thì là '
        + 'lỗ thông hơi nắp bình.' },
  ],
};
