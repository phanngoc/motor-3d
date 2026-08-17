/**
 * index.js — Module hệ thống 03: Trục khuỷu & lốc máy.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, CRANK_R, CAM_PR, pinYFromCrank, rodTilt, unbalancedForce, forcePeaks,
  bestBalanceFactor, RECIP_MASS, STROKES,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const CK = L.crank, CS = L.case, BR = L.bearing, SL = L.seal;
const mm = (v) => `${v.toFixed(2)} mm`;
const N = (v) => `${v.toFixed(0)} N`;

const BEST = bestBalanceFactor(5000);

const checks = [
  {
    name: 'Bán kính khuỷu = nửa hành trình',
    run() {
      return { pass: Math.abs(CRANK_R - L.stroke / 2) < 1e-9,
        msg: `${CRANK_R} mm = ${L.stroke} / 2` };
    },
  },
  {
    name: 'Ổ bi khớp đường kính cổ trục',
    run() {
      const d = BR.rIn - CK.journalR;
      return { pass: Math.abs(d) < 0.01,
        msg: `Ø trong ổ bi ${BR.rIn * 2} mm / Ø cổ trục ${CK.journalR * 2} mm` };
    },
  },
  {
    name: 'Phớt nằm NGOÀI ổ bi (thứ tự lắp đúng)',
    run() {
      const leftOk = CK.sealLeft[1] <= CK.bearLeft[0] + 0.01;
      const rightOk = CK.sealRight[0] >= CK.bearRight[1] - 0.01;
      return { pass: leftOk && rightOk,
        msg: `trái: phớt [${CK.sealLeft}] rồi ổ bi [${CK.bearLeft}] · `
          + `phải: ổ bi [${CK.bearRight}] rồi phớt [${CK.sealRight}]` };
    },
  },
  {
    name: 'Má khuỷu nằm gọn giữa hai ổ bi',
    run() {
      const gapL = CK.webLeft[0] - CK.bearLeft[1];
      const gapR = CK.bearRight[0] - CK.webRight[1];
      return { pass: gapL > 1 && gapR > 0,
        msg: `khe trái ${mm(gapL)} · khe phải ${mm(gapR)}` };
    },
  },
  {
    name: 'Má khuỷu không va thành lốc máy khi quay',
    run() {
      // Bán kính quét lớn nhất của má khuỷu (kể cả phần đối trọng dày thêm)
      const sweep = CK.webR + 4.5;
      // Khoảng từ tâm trục khuỷu tới thành trong lốc máy, theo phương hẹp nhất
      const inner = Math.min(CS.w / 2 - CS.wallT - Math.abs(CS.cy),
        CS.d / 2 - CS.wallT);
      return { pass: inner - sweep > 3,
        msg: `má quét R${sweep} mm / thành trong cách tâm ${inner.toFixed(1)} mm — `
          + `khe ${mm(inner - sweep)}` };
    },
  },
  {
    name: 'Chốt khuỷu + tay biên không va lốc máy trong cả vòng quay',
    run() {
      // Điểm xa tâm nhất của cụm chốt khuỷu: bán kính khuỷu + bán kính đầu to
      const sweep = CRANK_R + 17.5 + 1;
      const inner = Math.min(CS.w / 2 - CS.wallT - Math.abs(CS.cy), CS.d / 2 - CS.wallT);
      return { pass: inner - sweep > 3,
        msg: `đầu to quét R${sweep.toFixed(1)} mm / thành trong ${inner.toFixed(1)} mm — `
          + `khe ${mm(inner - sweep)}` };
    },
  },
  {
    name: 'Hai nửa lốc máy gặp nhau đúng tại mặt lắp x = 0',
    run(asm) {
      if (!asm) return { pass: false, msg: 'không có assembly' };
      const bl = new THREE.Box3().setFromObject(asm.part('case-left').object);
      const br = new THREE.Box3().setFromObject(asm.part('case-right').object);
      const gap = br.min.x - bl.max.x;
      return { pass: Math.abs(gap) < 0.5,
        msg: `nửa trái tới x=${bl.max.x.toFixed(2)}, nửa phải từ x=${br.min.x.toFixed(2)} — `
          + `chênh ${mm(Math.abs(gap))}` };
    },
  },
  {
    name: 'Then bán nguyệt không chồm quá mặt côn',
    run() {
      const stick = L.key.h;
      return { pass: stick < 4, msg: `then nhô ${mm(stick)} khỏi cổ trục` };
    },
  },
  {
    // Nhóm kiểm quan trọng nhất của hệ thống này: bài toán cân bằng.
    name: 'Cân bằng k = 0: lực NGANG bằng 0, lực đứng lớn nhất',
    run() {
      const p0 = forcePeaks(5000, 0);
      const p1 = forcePeaks(5000, 1);
      return { pass: p0.h < 1e-9 && p0.v > p1.v,
        msg: `k=0 -> ngang ${N(p0.h)}, đứng ${N(p0.v)} · k=1 -> đứng ${N(p1.v)}` };
    },
  },
  {
    name: 'Cân bằng k = 1: triệt lực đứng bậc 1 nhưng sinh lực NGANG',
    run() {
      const p1 = forcePeaks(5000, 1);
      const f = unbalancedForce(0, 5000, 1);
      const ratio = CRANK_R / L.rodLen;
      const expect = unbalancedForce(0, 5000, 1).base * ratio;
      return { pass: p1.h > 100 && Math.abs(f.vertical - expect) < 1,
        msg: `còn lực ngang ${N(p1.h)}; lực đứng chỉ còn thành phần bậc 2 `
          + `(R/L = ${ratio.toFixed(3)}) = ${N(f.vertical)}` };
    },
  },
  {
    name: 'Không có k nào triệt được cả hai — k tối ưu nằm ở giữa',
    run() {
      const ok = BEST.k > 0.2 && BEST.k < 0.8;
      const p0 = forcePeaks(5000, 0).tot;
      const p1 = forcePeaks(5000, 1).tot;
      return { pass: ok && BEST.peak > 1 && BEST.peak < Math.min(p0, p1),
        msg: `k tối ưu ${BEST.k.toFixed(2)} cho đỉnh ${N(BEST.peak)}, thấp hơn cả `
          + `k=0 (${N(p0)}) và k=1 (${N(p1)}) — nhưng KHÁC 0, tức không thể triệt hết` };
    },
  },
  {
    name: 'Quét 720°: không NaN, tay biên và chốt piston nhất quán',
    run() {
      let bad = null;
      for (let th = 0; th < 720; th += 0.5) {
        const py = pinYFromCrank(th);
        const tilt = rodTilt(th);
        if (!Number.isFinite(py) || !Number.isFinite(tilt)) bad ??= `NaN tại ${th}°`;
        // đầu to tay biên phải trùng chốt khuỷu
        const bigY = py - L.rodLen * Math.cos(tilt);
        const bigZ = -L.rodLen * Math.sin(tilt);
        const pinYc = CRANK_R * Math.cos((th * Math.PI) / 180);
        const pinZc = CRANK_R * Math.sin((th * Math.PI) / 180);
        if (Math.hypot(bigY - pinYc, bigZ - pinZc) > 1e-6) bad ??= `đầu to lệch chốt khuỷu tại ${th}°`;
      }
      return { pass: bad === null, msg: bad ?? 'đầu to tay biên trùng chốt khuỷu ở mọi góc' };
    },
  },
];

export default {
  mode: '3d',
  slug: 'crank-case',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,

  frameDir: [0.52, 0.36, 0.78],
  frameExclude: ['ctx-cylinder', 'ctx-piston', 'flywheel', 'flywheel-nut', 'oil-strainer', 'drain-bolt'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 60,
  initialRpm: 30,

  /** Chế độ Hoạt động: làm trong lốc máy để thấy trục khuỷu quay bên trong. */
  opsHidden: ['case-bolts'],
  opsGhost: ['case-left', 'case-right', 'ctx-cylinder'],

  labels(asm, kin) {
    const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    return [
      { pos: () => at(0, CK.webR + 12), text: () => kin.state.strokeName.toUpperCase(), accent: true },
      {
        pos: () => at(0, kin.state.pinY + 14),
        text: () => `chốt piston ${kin.state.pinY.toFixed(1)} mm`,
      },
      {
        pos: () => at(24, -CK.webR - 14),
        text: () => `đứng ${N(kin.state.fVertical)}`,
        accent: () => Math.abs(kin.state.fVertical) > Math.abs(kin.state.fHorizontal),
      },
      {
        pos: () => at(24, -CK.webR - 28),
        text: () => `ngang ${N(kin.state.fHorizontal)}`,
        accent: () => Math.abs(kin.state.fHorizontal) > Math.abs(kin.state.fVertical),
      },
      { pos: () => at(CK.camSprocket[0] - 4, CAM_PR + 6), text: 'nhông dây cam' },
      { pos: () => at(0, CS.cy - CS.w / 2 + 10, CS.d / 2 + 6), text: 'mặt lắp 2 nửa · x = 0' },
    ];
  },

  opsPanel(mount, kin, api) {
    const strokes = el('div', { class: 'strokes' },
      ...STROKES.map((s, i) => el('div', { 'data-i': i, text: s.split(' ')[0] })));

    const angle = el('input', { type: 'range', min: 0, max: 720, step: 1, value: 60 });
    const angleLb = el('b', { text: '60°' });
    angle.addEventListener('input', () => { api.setPlaying(false); api.setDrive(+angle.value); });

    const spd = el('input', { type: 'range', min: 8, max: 300, step: 2, value: api.rpm });
    const spdLb = el('b', { text: `${api.rpm}` });
    spd.addEventListener('input', () => { api.setRpm(+spd.value); spdLb.textContent = spd.value; });

    const rpm = el('input', { type: 'range', min: 1000, max: 9000, step: 100, value: 5000 });
    const rpmLb = el('b', { text: '5000 v/ph' });
    rpm.addEventListener('input', () => { kin.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const bal = el('input', { type: 'range', min: 0, max: 100, step: 1, value: 55 });
    const balLb = el('b', { text: 'k = 0,55' });
    bal.addEventListener('input', () => { kin.setBalance(+bal.value / 100); });

    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const preset = (k, label, title) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => { kin.setBalance(k); bal.value = String(Math.round(k * 100)); } });

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bV = bar(''), bH = bar('ex');
    const vV = el('span', { class: 'vl', text: '0 N' }), vH = el('span', { class: 'vl', text: '0 N' });
    const pk = el('span', { class: 'vl', text: '0 N' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'field' }, el('label', {}, '4 kỳ đang diễn ra'), strokes),
      el('div', { class: 'field' }, el('label', {}, 'Góc trục khuỷu', angleLb), angle),
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'tốc độ quay' }),
        spdLb,
      ),
      el('div', { class: 'field' }, el('label', {}, 'Vòng tua để TÍNH lực', rpmLb), rpm),

      el('div', { class: 'field' },
        el('label', {}, 'Hệ số cân bằng đối trọng', balLb), bal),
      el('div', { class: 'row', style: { display: 'flex', gap: '6px', alignItems: 'center' } },
        preset(0, 'k=0', 'Không có đối trọng'),
        preset(0.55, 'k≈½', 'Cân bằng một nửa — cách làm thực tế'),
        preset(1, 'k=1', 'Cân bằng hết lực đứng bậc 1'),
      ),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Lực ĐỨNG' }), bV.node, vV,
        el('span', { class: 'lb', text: 'Lực NGANG' }), bH.node, vH,
        el('span', { class: 'lb', text: 'Đỉnh tổng' }), el('div', {}), pk,
      ),

      el('div', { class: 'note', html:
        '<b>Điều đáng xem nhất — vì sao xe một xy-lanh luôn rung.</b> Kéo thanh '
        + '<b>hệ số cân bằng</b> từ 0 lên 1 và nhìn hai đồng hồ lực:<br>'
        + '· <b>k = 0</b> (không đối trọng): lực NGANG = 0, lực ĐỨNG lớn nhất.<br>'
        + '· <b>k = 1</b> (triệt hết lực đứng bậc 1): lực đứng gần hết, nhưng lực NGANG '
        + 'xuất hiện đúng bằng lượng vừa triệt được.<br>'
        + 'Đối trọng quay tròn nên nó không thể chỉ tác dụng theo một phương — nó luôn có '
        + 'cả thành phần ngang. <b>Không có giá trị k nào làm cả hai bằng 0.</b>' }),

      el('div', { class: 'note', html:
        `<b>Nên chọn k bao nhiêu?</b> Quét số cho thấy đỉnh tổng nhỏ nhất ở khoảng `
        + `<b>k = ${BEST.k.toFixed(2)}</b>. Đó là lý do thực tế hay cân bằng khoảng 50–70% — `
        + 'chia đều độ rung cho hai phương thay vì dồn hết vào một phương. '
        + 'Phần rung còn lại là ĐẶC TÍNH của động cơ một xy-lanh, không phải lỗi.' }),

      el('div', { class: 'note', html:
        `Tính với khối lượng chuyển động qua lại ≈ <b>${RECIP_MASS} kg</b> (piston + xéc-măng + `
        + 'chốt + khoảng 1/3 tay biên). Lực tỉ lệ BÌNH PHƯƠNG vòng tua, nên tăng ga gấp đôi '
        + 'thì lực rung gấp bốn.' }),

      el('div', { class: 'note warn', html:
        '<b>Bánh đà cũng góp phần</b> nhưng theo cách khác: nó không triệt lực rung, nó chỉ '
        + 'giữ cho trục khuỷu quay ĐỀU giữa các kỳ. Động cơ một xy-lanh chỉ sinh công 1 lần '
        + 'mỗi 2 vòng, ba kỳ còn lại là quán tính bánh đà kéo.' }),

      el('div', { class: 'note', html:
        '<b>Lốc máy đang được làm trong suốt</b> để thấy trục khuỷu và tay biên quay bên trong. '
        + 'Tích lại trong danh mục bên phải nếu muốn thấy khối đặc.' }),
    ));

    function update() {
      const s = kin.state;
      angleLb.textContent = `${s.theta.toFixed(0)}°`;
      if (document.activeElement !== angle) angle.value = String(s.theta);
      playBtn.textContent = api.playing ? '⏸' : '▶';
      balLb.textContent = `k = ${s.balance.toFixed(2).replace('.', ',')}`;
      strokes.querySelectorAll('div').forEach((d, i) =>
        d.setAttribute('aria-current', String(i === s.stroke)));
      const scale = Math.max(1, s.peakTotal);
      bV.i.style.width = `${Math.min(100, (Math.abs(s.fVertical) / scale) * 100).toFixed(1)}%`;
      bH.i.style.width = `${Math.min(100, (Math.abs(s.fHorizontal) / scale) * 100).toFixed(1)}%`;
      vV.textContent = N(s.fVertical);
      vH.textContent = N(s.fHorizontal);
      pk.textContent = N(s.peakTotal);
    }
    update();
    return { update };
  },

  intro: {
    title: 'Trục khuỷu RỜI và bài toán cân bằng',
    html: `
      <p><b>Trục khuỷu rời (built-up)</b> — đặc điểm quyết định mọi thứ. Xe máy một xy-lanh
      nhỏ không dùng trục khuỷu liền khối với tay biên tháo được như ô tô. Thay vào đó hai
      nửa má khuỷu được <b>ép nóng</b> vào chốt khuỷu, và tay biên cùng ổ bi kim nằm kẹt
      trong đó. Cả khối là MỘT chi tiết.</p>
      <p><b>Hệ quả thực tế:</b> ổ bi đầu to mòn thì không thể thay riêng bạc hay tay biên —
      phải thay cả trục khuỷu hoặc đưa ra xưởng ép lại. Vì vậy một tiếng gõ dưới máy lại là
      chẩn đoán đắt tiền. Trong mô hình này, <code>crank</code> là một chi tiết duy nhất gồm
      cả tay biên, đúng như thực tế.</p>
      <p><b>Mặt lắp vuông góc trục</b> tại x = 0, nên muốn vào tới trục khuỷu thì bắt buộc
      phải TÁCH lốc máy — và muốn tách thì phải bỏ đầu bò, xy-lanh, piston, bộ nồi, mâm lửa,
      bơm nhớt và cơ cấu sang số trước. Đó là công việc lớn nhất trên động cơ.</p>
      <p><b>Về cân bằng:</b> bật chế độ Hoạt động và kéo thanh hệ số cân bằng. Bạn sẽ thấy
      bằng số rằng động cơ một xy-lanh không thể cân bằng hoàn toàn — triệt lực đứng thì
      sinh lực ngang. Đó là đặc tính, không phải lỗi chế tạo.</p>`,
  },

  symptoms: [
    { sign: 'Tiếng gõ NẶNG, TRẦM ở dưới máy, rõ khi tải',
      cause: 'Ổ bi kim đầu to tay biên mòn hoặc vỡ.',
      fix: 'Tháo xy-lanh, lắc đầu to theo phương hướng kính. Có độ lắc = thay CẢ trục khuỷu '
        + '(không thể thay riêng bạc trên trục khuỷu rời).' },
    { sign: 'Tiếng ru đều, tăng theo tốc độ, KHÔNG theo tải',
      cause: 'Ổ bi cầu đỡ trục khuỷu kẹn hoặc lỏng trong lốc máy.',
      fix: 'Nghe bằng tua-vít dài áp vào vỏ máy hai bên để định vị bên nào. Xác nhận khi tách máy.' },
    { sign: 'Rung mạnh bất thường ở một vòng tua nhất định',
      cause: 'Trục khuỷu CONG (độ đảo lớn) — thường sau một lần bó máy hoặc sau khi ai đó '
        + 'đóng búa vào bánh đà thay vì dùng vam rút.',
      fix: 'Đo độ đảo trên khối V. > 0,03 mm thì phải ép lại.' },
    { sign: 'Rỉ nhớt dọc đường ghép hai nửa lốc máy',
      cause: 'Keo làm kín bị già · mặt lắp bị nảy xước trong lần sửa trước · siết sai lực '
        + 'hoặc sai thứ tự (không theo hình xoắn).',
      fix: 'Tách lại, kiểm độ phẳng mặt lắp, bôi keo mới, siết theo hình xoắn 2 lượt. '
        + 'Vết nảy sâu thì phải gia công lại mặt lắp.' },
    { sign: 'Lửa yếu + không sạc được ắc quy + đèn chập chờn CÙNG LÚC',
      cause: 'Phớt chặn nhớt TRÁI hỏng -> nhớt ngấm vào mâm lửa. Một nguyên nhân, ba triệu chứng.',
      fix: 'Thay phớt trái, lắp lò xo vòng hướng vào phía có nhớt. Vệ sinh và kiểm cách điện '
        + 'cuộn stator (hệ thống 08).' },
    { sign: 'Xe không nổ / nổ dội sau khi đã thay CDI, bugi, cuộn lửa',
      cause: 'THEN BÁN NGUYỆT của bánh đà bị cắt -> bánh đà lệch góc -> sai thời điểm đánh lửa.',
      fix: 'Tháo bánh đà kiểm then. Đây là nguyên nhân hay bị bỏ qua nhất vì chi tiết chỉ '
        + 'bé bằng hạt gạo.' },
    { sign: 'Sau khi lắp lại, xoay trục khuỷu bằng tay bị chạn',
      cause: 'Thiếu chốt định vị lốc máy -> hai nửa lệch nhau -> kéo cong trục. Hoặc ổ bi lắp '
        + 'chưa vào hết bệ.',
      fix: 'Tháo ra kiểm chốt định vị và độ ngồi của ổ bi. TUYỆT ĐỐI không siết tiếp để '
        + '"cho vào".' },
  ],
};
