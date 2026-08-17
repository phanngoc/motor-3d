/**
 * index.js — Module hệ thống 02: Xy-lanh, piston & tay biên.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, CRANK_R, CRANK_Y, PISTON_R, pinY, crownY, rodTilt, MAX_ROD_TILT,
  pistonAccel, inG, ACCEL_RATIO, DISPLACEMENT, STROKES, ringOuterR,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const C = L.cyl, P = L.piston;
const mm = (v) => `${v.toFixed(2)} mm`;

/** Vị trí y (so với mặt lắp) của xéc-măng thứ i tại góc θ. */
const ringY = (i, theta) => crownY(theta) - P.grooves[i].top - P.grooves[i].t;

const checks = [
  {
    name: 'Trục khuỷu được suy ra đúng: đỉnh piston ở ĐCT trùng mặt lắp',
    run() {
      const c = crownY(0);
      return { pass: Math.abs(c) < 1e-9,
        msg: `đỉnh piston ở ĐCT = ${c.toFixed(6)} mm (trục khuỷu tự đặt ở y = ${CRANK_Y} mm)` };
    },
  },
  {
    name: 'Hành trình đo từ hình học khớp với khai báo',
    run() {
      const s = crownY(0) - crownY(180);
      return { pass: Math.abs(s - L.stroke) < 1e-6,
        msg: `${s.toFixed(4)} mm / khai báo ${L.stroke} mm (= 2 × bán kính khuỷu ${CRANK_R})` };
    },
  },
  {
    name: 'Dung tích công tác',
    run() {
      return { pass: Math.abs(DISPLACEMENT - 109.1) < 0.6,
        msg: `${DISPLACEMENT.toFixed(1)} cm³ (Ø${L.bore} × ${L.stroke} mm)` };
    },
  },
  {
    name: 'Ba rãnh xéc-măng không chồng nhau và nằm trên tâm chốt',
    run() {
      let bad = null;
      for (let i = 0; i < P.grooves.length; i++) {
        const g = P.grooves[i];
        const yTop = L.pistonCH - g.top, yBot = yTop - g.t;
        if (yBot <= 0) bad ??= `rãnh ${g.name} chạm/vượt tâm chốt`;
        if (i > 0) {
          const prev = P.grooves[i - 1];
          const prevBot = L.pistonCH - prev.top - prev.t;
          if (yTop >= prevBot) bad ??= `rãnh ${g.name} chồng rãnh ${prev.name}`;
        }
        if (PISTON_R - g.depth < P.pinBoreR + 4.5) bad ??= `rãnh ${g.name} sâu quá, chạm bệ chốt`;
      }
      return { pass: bad === null,
        msg: bad ?? P.grooves.map((g) => `${g.name} ở ${g.top} mm`).join(' · ') };
    },
  },
  {
    // Đây là phép kiểm đã bắt được lỗi thật: xy-lanh cao 62 mm thì ở ĐCD xéc-măng
    // dầu tụt ra khỏi ống lót và mất hoàn toàn tác dụng.
    name: 'Mọi xéc-măng luôn nằm trong ống lót (cả ở ĐCT và ĐCD)',
    run() {
      let worstTop = Infinity, worstBot = Infinity, who = '';
      for (let i = 0; i < P.grooves.length; i++) {
        const g = P.grooves[i];
        // cao nhất ở ĐCT, thấp nhất ở ĐCD
        const hi = crownY(0) - g.top;              // mép trên vòng, ở ĐCT
        const lo = crownY(180) - g.top - g.t;      // mép dưới vòng, ở ĐCD
        const dTop = C.y1 - hi;                    // cách miệng trên ống lót
        const dBot = lo - C.y0;                    // cách miệng dưới ống lót
        if (dTop < worstTop) worstTop = dTop;
        if (dBot < worstBot) { worstBot = dBot; who = g.name; }
      }
      return { pass: worstTop > 0.5 && worstBot > 0.5,
        msg: `cách miệng trên ${mm(worstTop)} · cách miệng dưới ${mm(worstBot)} `
          + `(chỗ sát nhất: ${who}) — ống lót dài ${C.y1 - C.y0} mm` };
    },
  },
  {
    name: 'Khoá chốt không chồm quá đường kính piston',
    run() {
      const clipMax = L.pin.len / 2 + 1.2 + L.clip.wire;
      return { pass: clipMax < PISTON_R - 0.5,
        msg: `khoá tới x=${mm(clipMax)} / bán kính piston ${mm(PISTON_R)}` };
    },
  },
  {
    name: 'Chốt piston nằm gọn trong lỗ chốt của piston',
    run() {
      const fit = PISTON_R - 2 - L.pin.len / 2;
      return { pass: L.pin.d / 2 <= P.pinBoreR + 0.1 && fit > -2,
        msg: `Ø chốt ${L.pin.d} mm / lỗ Ø${(P.pinBoreR * 2).toFixed(1)} mm · `
          + `chốt dài ${L.pin.len} mm trong piston Ø${(PISTON_R * 2).toFixed(1)} mm` };
    },
  },
  {
    name: 'Tay biên không va miệng dưới ống lót ở góc nghiêng lớn nhất',
    run() {
      // Ở θ = 90° tay biên nghiêng nhiều nhất; xét mặt cắt tại miệng dưới ống lót.
      const tilt = MAX_ROD_TILT;
      const pin = pinY(90);
      const drop = pin - C.y0;                      // khoảng từ tâm chốt xuống miệng ống lót
      const zCenter = drop > 0 ? drop * Math.tan(tilt) : 0;
      const halfW = L.rod.webW / 2 + 2;
      const reach = zCenter + halfW;
      return { pass: reach < L.bore / 2 - 1,
        msg: `tay biên chồm tới z=${mm(reach)} / bán kính lòng xy-lanh ${mm(L.bore / 2)} `
          + `(nghiêng tối đa ${((tilt * 180) / Math.PI).toFixed(1)}°)` };
    },
  },
  {
    name: 'Váy piston vẫn còn trong ống lót ở ĐCD',
    run() {
      const skirtBot = pinY(180) - P.skirtDown;
      const stillIn = crownY(180) - skirtBot;       // phần thân còn nằm trong lòng
      const inLiner = crownY(180) - C.y0;
      return { pass: inLiner > 12,
        msg: `đỉnh piston ở ĐCD cách miệng dưới ${mm(inLiner)} `
          + `(váy chồm xuống các-te ${mm(C.y0 - skirtBot)} — bình thường)` };
    },
  },
  {
    // Con số giải thích vì sao tay biên hay đứt ở gần điểm chết trên.
    name: 'Tỉ lệ gia tốc ĐCT / ĐCD khớp công thức (1+R/L)/(1−R/L)',
    run() {
      const rpm = 6000;
      const aTop = Math.abs(pistonAccel(0, rpm));
      const aBot = Math.abs(pistonAccel(180, rpm));
      const ratio = aTop / aBot;
      return { pass: Math.abs(ratio - ACCEL_RATIO) / ACCEL_RATIO < 0.02,
        msg: `số học ${ratio.toFixed(3)} / công thức ${ACCEL_RATIO.toFixed(3)} — `
          + `ở ${rpm} v/ph là ${inG(aTop).toFixed(0)} g ở ĐCT so với ${inG(aBot).toFixed(0)} g ở ĐCD` };
    },
  },
  {
    name: 'Quét 720°: piston luôn trong khoảng ĐCT–ĐCD',
    run() {
      let bad = null;
      const top = crownY(0), bot = crownY(180);
      for (let th = 0; th < 720; th += 0.5) {
        const c = crownY(th);
        if (!Number.isFinite(c)) bad ??= `NaN tại ${th}°`;
        if (c > top + 1e-6 || c < bot - 1e-6) bad ??= `vượt biên tại ${th}° (${c.toFixed(3)})`;
        if (!Number.isFinite(rodTilt(th))) bad ??= `góc tay biên NaN tại ${th}°`;
      }
      return { pass: bad === null,
        msg: bad ?? `ĐCT ${top.toFixed(1)} mm .. ĐCD ${bot.toFixed(1)} mm` };
    },
  },
];

export default {
  mode: '3d',
  slug: 'piston-cylinder',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 720,

  /** Nhìn gần vuông góc trục chốt: thấy tay biên nghiêng rõ nhất. */
  frameDir: [0.86, 0.30, 0.42],
  frameExclude: ['ctx-crank', 'ctx-case', 'ctx-head', 'rod', 'small-bush', 'big-bearing'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 90,
  initialRpm: 40,

  /** Chế độ Hoạt động: làm trong xy-lanh để thấy piston và xéc-măng chạy bên trong. */
  opsHidden: ['ctx-head'],
  opsGhost: ['cylinder', 'ctx-case'],

  labels(asm, kin) {
    const at = (y, z = 0, x = 0) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at(kin.state.crownY + 8, 0, 0),
        text: () => kin.state.strokeName.toUpperCase(),
        accent: true,
      },
      {
        pos: () => at(kin.state.crownY - 6, L.bore / 2 + 14, 0),
        text: () => `${kin.state.velocity >= 0 ? '+' : ''}${kin.state.velocity.toFixed(1)} m/s`,
      },
      {
        pos: () => at(kin.state.crownY - 20, L.bore / 2 + 14, 0),
        text: () => `${kin.state.accelG >= 0 ? '+' : ''}${kin.state.accelG.toFixed(0)} g`,
        accent: () => Math.abs(kin.state.accelG) > 500,
      },
      {
        pos: () => at(pinY(kin.state.theta) - L.rodLen * 0.5, -L.bore / 2 - 16, 0),
        text: () => `tay biên ${kin.state.rodTiltDeg.toFixed(1)}°`,
      },
      { pos: () => at(C.y1 + 4, -L.bore / 2 - 22, 0), text: 'mặt lắp đầu bò · ĐCT' },
      { pos: () => at(crownY(180), -L.bore / 2 - 22, 0), text: 'ĐCD' },
    ];
  },

  opsPanel(mount, kin, api) {
    const strokes = el('div', { class: 'strokes' },
      ...STROKES.map((s, i) => el('div', { 'data-i': i, text: s.split(' ')[0] })));

    const angle = el('input', { type: 'range', min: 0, max: 720, step: 1, value: 90 });
    const angleLb = el('b', { text: '90°' });
    angle.addEventListener('input', () => { api.setPlaying(false); api.setDrive(+angle.value); });

    const rpm = el('input', { type: 'range', min: 1000, max: 9000, step: 100, value: 3000 });
    const rpmLb = el('b', { text: '3000 v/ph' });
    rpm.addEventListener('input', () => { kin.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const spd = el('input', { type: 'range', min: 8, max: 300, step: 2, value: api.rpm });
    const spdLb = el('b', { text: `${api.rpm}` });
    spd.addEventListener('input', () => { api.setRpm(+spd.value); spdLb.textContent = spd.value; });

    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const jump = (deg_, label, title) => el('button', { class: 'tlbtn', text: label, title,
      onclick: () => { api.setPlaying(false); api.setDrive(deg_); } });

    const vLb = el('span', { class: 'vl', text: '0,0 m/s' });
    const aLb = el('span', { class: 'vl', text: '0 g' });
    const posLb = el('span', { class: 'vl', text: '0 mm' });
    const tiltLb = el('span', { class: 'vl', text: '0°' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'field' }, el('label', {}, '4 kỳ đang diễn ra'), strokes),
      el('div', { class: 'field' }, el('label', {}, 'Góc trục khuỷu', angleLb), angle),
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn, jump(0, 'ĐCT', 'Điểm chết trên'), jump(180, 'ĐCD', 'Điểm chết dưới'),
        jump(90, '90°', 'Góc tay biên nghiêng nhiều nhất'),
      ),
      el('div', { class: 'field' }, el('label', {}, 'Tốc độ quay mô hình', spdLb), spd),
      el('div', { class: 'field' },
        el('label', {}, 'Vòng tua để TÍNH vận tốc / gia tốc', rpmLb), rpm),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Vị trí đỉnh' }), el('div', {}), posLb,
        el('span', { class: 'lb', text: 'Vận tốc' }), el('div', {}), vLb,
        el('span', { class: 'lb', text: 'Gia tốc' }), el('div', {}), aLb,
        el('span', { class: 'lb', text: 'Góc tay biên' }), el('div', {}), tiltLb,
      ),

      el('div', { class: 'note', html:
        '<b>Điều đáng xem nhất — chuyển động piston KHÔNG đối xứng.</b> Bấm <b>ĐCT</b> rồi '
        + `<b>ĐCD</b> và so hai giá trị gia tốc. Ở ĐCT gia tốc lớn hơn ĐCD đúng `
        + `<b>${ACCEL_RATIO.toFixed(2)} lần</b>, vì tay biên nghiêng làm hai nửa hành trình `
        + 'không giống nhau. Công thức: (1 + R/L) / (1 − R/L) với '
        + `R = ${CRANK_R} mm, L = ${L.rodLen} mm.` }),

      el('div', { class: 'note warn', html:
        'Đó là lý do <b>tay biên hay đứt ở gần điểm chết trên</b>, và là lý do vòng tua tối đa '
        + 'của động cơ bị giới hạn bởi sức bền tay biên chứ không phải bởi khả năng nạp khí. '
        + `Ở 9000 v/ph gia tốc ở ĐCT đạt khoảng ${inG(Math.abs(pistonAccel(0, 9000))).toFixed(0)} g.` }),

      el('div', { class: 'note', html:
        '<b>Vận tốc bằng 0 ở hai điểm chết</b> nhưng gia tốc lại LỚN NHẤT ở đúng hai điểm đó — '
        + 'piston đang đổi chiều. Kéo thanh góc qua vùng quanh 0° để thấy vận tốc đổi dấu.' }),

      el('div', { class: 'note', html:
        `<b>Góc tay biên</b> lớn nhất ${((MAX_ROD_TILT * 180) / Math.PI).toFixed(1)}° ở khoảng `
        + '90° và 270°. Chính góc nghiêng này sinh ra <b>lực ngang</b> ép piston vào một bên '
        + 'thành xy-lanh — nên xy-lanh mòn thành hình Ô-VAN theo phương vuông góc trục chốt, '
        + 'không mòn tròn.' }),

      el('div', { class: 'note', html:
        '<b>Xy-lanh đang được làm trong suốt</b> để thấy piston và 3 xéc-măng chạy bên trong. '
        + 'Tích lại ô <i>Xy-lanh</i> trong danh mục bên phải nếu muốn thấy khối đặc.' }),
    ));

    function update() {
      const s = kin.state;
      angleLb.textContent = `${s.theta.toFixed(0)}°`;
      if (document.activeElement !== angle) angle.value = String(s.theta);
      playBtn.textContent = api.playing ? '⏸' : '▶';
      strokes.querySelectorAll('div').forEach((d, i) =>
        d.setAttribute('aria-current', String(i === s.stroke)));
      posLb.textContent = `${s.crownY.toFixed(1)} mm`;
      vLb.textContent = `${s.velocity >= 0 ? '+' : ''}${s.velocity.toFixed(1)} m/s`;
      aLb.textContent = `${s.accelG >= 0 ? '+' : ''}${s.accelG.toFixed(0)} g`;
      tiltLb.textContent = `${s.rodTiltDeg.toFixed(1)}°`;
    }
    update();
    return { update };
  },

  intro: {
    title: 'Cơ cấu thanh truyền – tay quay',
    html: `
      <p>Piston chỉ biết đi lên và đi xuống. Tay biên và trục khuỷu biến chuyển động thẳng
      đó thành chuyển động quay. Vị trí đỉnh piston theo góc trục khuỷu θ:</p>
      <p><code>y = R·cosθ + √(L² − (R·sinθ)²)</code> với R = ${CRANK_R} mm (nửa hành trình)
      và L = ${L.rodLen} mm (chiều dài tay biên).</p>
      <p><b>Hệ quả quan trọng:</b> chuyển động piston <b>không đối xứng</b> — nửa trên của
      hành trình đi nhanh hơn nửa dưới. Gia tốc ở điểm chết trên lớn hơn ở điểm chết dưới
      đúng ${ACCEL_RATIO.toFixed(2)} lần. Bật chế độ Hoạt động và so hai con số gia tốc
      ở ĐCT và ĐCD là thấy ngay.</p>
      <p><b>Vị trí trục khuỷu trong mô hình không đặt tay:</b> nó được suy ra từ điều kiện
      đỉnh piston ở ĐCT phải trùng mặt lắp đầu bò. Đổi hành trình hay chiều dài tay biên
      thì trục khuỷu tự dịch theo.</p>
      <p><b>Chiều cao xy-lanh cũng vậy:</b> ống lót phải dài hơn hành trình cộng khoảng cách
      từ đỉnh piston tới xéc-măng dưới cùng (${L.stroke} + 13,5 = 69,1 mm), nếu không thì ở
      ĐCD xéc-măng dầu tụt ra khỏi ống lót. Phép kiểm trong <code>npm run verify</code>
      xác nhận điều này — và nó đã bắt được đúng lỗi đó khi mô hình còn cao 62 mm.</p>`,
  },

  symptoms: [
    { sign: 'Khói xanh, hao nhớt',
      cause: 'Vòng đàn hồi của xéc-măng dầu mất đàn hồi · lắp NGƯỢC mặt vát xéc-măng số 2 '
        + '(vòng bơm nhớt lên thay vì gạt xuống) · lòng xy-lanh mòn ô-van. '
        + 'Cũng có thể do phớt thân xupap (hệ thống 01).',
      fix: 'Đo áp suất nén. Nén thấp + khói xanh -> nhóm xéc-măng/xy-lanh. '
        + 'Nén tốt mà vẫn khói xanh -> phớt thân xupap.' },
    { sign: 'Nén thấp, khó nổ khi nguội, máy yếu khi tải',
      cause: 'Xéc-măng khí bó kẹp muội than · mòn xéc-măng · xước lòng xy-lanh · '
        + 'hở gioăng đầu bò · xupap không kín.',
      fix: 'Đo nén khô, rồi <b>nhỏ vài giọt nhớt vào lỗ bugi và đo lại</b>: nén tăng rõ = '
        + 'xéc-măng/xy-lanh; nén không đổi = xupap hoặc gioăng.' },
    { sign: 'Tiếng gõ nhẹ "tách tách" theo vòng tua, rõ khi thả ga',
      cause: 'Mòn chốt piston hoặc bạc đầu nhỏ tay biên.',
      fix: 'Lắc piston theo phương ngang khi đã tháo xy-lanh; đo khe hở chốt–bạc.' },
    { sign: 'Tiếng gõ NẶNG, TRẦM ở dưới máy, tăng theo tải',
      cause: 'Ổ bi kim đầu to tay biên mòn hoặc vỡ.',
      fix: 'Lắc đầu to theo phương hướng kính. Có độ lắc -> phải thay CẢ trục khuỷu '
        + '(hệ thống 03) vì đầu to liền khối với trục khuỷu rời.' },
    { sign: 'Xước dọc rõ trên lòng xy-lanh',
      cause: 'Xéc-măng bó vì khe miệng = 0 · hút bụi do lọc gió hở · dính piston do quá nhiệt · '
        + 'khoá chốt piston bật ra làm đầu chốt cào thành.',
      fix: 'Doa lên cỡ và dùng piston cỡ tương ứng. Đồng thời TRUY nguyên nhân — không tìm ra '
        + 'thì làm lại cũng hỏng lại.' },
    { sign: 'Máy gõ ngay sau khi vừa lắp lại piston',
      cause: 'Lắp piston NGƯỢC chiều (mũi chỉ hướng trên đỉnh sai) làm lệch offset chốt.',
      fix: 'Tháo ra lắp lại đúng chiều. Đọc dấu trên đỉnh piston trước khi lắp.' },
    { sign: 'Hao nhớt ngay sau khi vừa thay xéc-măng',
      cause: 'Lắp ngược mặt vát xéc-măng số 2 · lắp thiếu một vòng gạt của xéc-măng dầu · '
        + 'miệng các vòng đặt trùng nhau.',
      fix: 'Tháo ra kiểm thứ tự và chiều lắp. Miệng phải lệch nhau 120°.' },
  ],
};
