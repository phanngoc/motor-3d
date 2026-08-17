/**
 * index.js — Module hệ thống 01: Đầu bò & cơ cấu cam–xupap.
 * Xuất interface chuẩn để src/core/system-page.js dùng lại cho mọi hệ thống.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import { camLift } from '../../lib/geom.js';
import { L, STROKES, CAM_PR, CRANK_PR, valveAxis, rockerGeom, pistonPinY } from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const V = L.valves;
const AX = { intake: valveAxis(V.intake), exhaust: valveAxis(V.exhaust) };
const pct = (x, max) => `${Math.max(0, Math.min(100, (x / max) * 100)).toFixed(1)}%`;
const mm = (v) => `${v.toFixed(2)} mm`;

/**
 * Các kiểm tra KỸ THUẬT chạy bởi `npm run verify`.
 * Đây là những điều kiện không thể nhìn bằng mắt mà nếu sai thì mô hình dạy
 * người học đi sai hướng. Mỗi check trả về { pass, msg, warn? }.
 */
const checks = [
  {
    name: 'Khe giữa 2 bệ xupap',
    run() {
      const gap = (V.intake.seat[1] - V.intake.headD / 2) - (V.exhaust.seat[1] + V.exhaust.headD / 2);
      return { pass: gap >= 3, msg: `${mm(gap)} (cần ≥ 3 mm để còn thịt nhôm giữa 2 bệ)` };
    },
  },
  {
    name: 'Mặt nấm xupap nằm trong buồng đốt',
    run() {
      const worst = Math.max(
        V.intake.seat[1] + V.intake.headD / 2,
        Math.abs(V.exhaust.seat[1] - V.exhaust.headD / 2),
      );
      return { pass: worst <= L.head.chamberR,
        msg: `mép xa nhất R${worst.toFixed(1)} mm / buồng đốt R${L.head.chamberR} mm` };
    },
  },
  {
    name: 'Tỉ số truyền dây cam',
    run() {
      const r = L.camSprocket.teeth / L.crankSprocket.teeth;
      return { pass: Math.abs(r - 2) < 1e-9,
        msg: `${r.toFixed(3)} : 1 (nhông ${L.camSprocket.teeth}/${L.crankSprocket.teeth}, `
          + `R ${CAM_PR.toFixed(1)}/${CRANK_PR.toFixed(1)} mm)` };
    },
  },
  {
    name: 'Tỉ số đòn cò mổ',
    run() {
      const a = rockerGeom(V.intake).ratio, b = rockerGeom(V.exhaust).ratio;
      return { pass: Math.abs(a - 1) < 0.02 && Math.abs(b - 1) < 0.02,
        msg: `nạp ${a.toFixed(3)} · xả ${b.toFixed(3)}` };
    },
  },
  {
    name: 'Vấu cam không va trục cò mổ',
    run() {
      const noseR = L.cam.rb + L.cam.lift;
      let worst = Infinity, who = '';
      for (const k of ['intake', 'exhaust']) {
        const v = V[k];
        const d = Math.hypot(v.pivot[0] - L.cam.y, v.pivot[1] - L.cam.z) - L.rocker.shaftR - noseR;
        if (d < worst) { worst = d; who = k === 'intake' ? 'nạp' : 'xả'; }
      }
      return { pass: worst > 0.8, msg: `khe nhỏ nhất ${mm(worst)} (bên ${who})` };
    },
  },
  {
    name: 'Khe xupap – đỉnh piston (valve-to-piston)',
    run() {
      // Điểm thấp nhất của mép mặt nấm xupap so với mặt đỉnh piston, quét cả chu trình.
      let worst = Infinity, at = 0, who = '';
      for (let th = 0; th < 720; th += 0.25) {
        const crown = pistonPinY(th) + L.pistonCH;
        for (const k of ['intake', 'exhaust']) {
          const v = V[k], ax = AX[k];
          const h = camLift(th / 2 - v.camCenter, L.cam.rb, L.cam.lift, L.cam.half);
          const g = rockerGeom(v);
          const psi = Math.asin(Math.min(1, h / Math.abs(g.dzCam)));
          const lift = Math.max(0, Math.abs(g.dzValve) * Math.sin(psi) - L.lash[k]);
          const rimY = v.seat[0] - ax.ay * lift - (v.headD / 2) * Math.abs(ax.az);
          if (rimY - crown < worst) { worst = rimY - crown; at = th; who = k === 'intake' ? 'nạp' : 'xả'; }
        }
      }
      const pass = worst > 0.6;
      return { pass, warn: !pass,
        msg: `${mm(worst)} tại ${at.toFixed(0)}° trục khuỷu (bên ${who})`
          + (pass ? '' : ' — động cơ thật phải khoét hốc trên đỉnh piston hoặc hạ độ nâng') };
    },
  },
];

export default {
  mode: '3d',
  slug: 'cylinder-head',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,

  /** Hướng nhìn ban đầu. */
  frameDir: [0.78, 0.40, 0.66],
  /** Các chi tiết dài kéo khung nhìn rộng ra — bỏ khỏi phép canh camera. */
  frameExclude: ['ctx-cylinder', 'ctx-piston', 'ctx-crank', 'cam-chain', 'tensioner', 'chain-guide'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialDrive: 360,

  /**
   * Chế độ Hoạt động: bỏ vỏ đi để thấy cơ cấu.
   * Thân đầu bò bị ẨN (không phải làm trong): 7 cánh tản nhiệt + 3 tấm chồng nhau
   * nên dù opacity 0,09 thì cộng dồn lại vẫn thành khối mờ đặc. Người dùng có thể
   * tích lại ô "Thân đầu bò" trong danh mục bên phải nếu muốn thấy vỏ.
   */
  opsHidden: ['head-cover', 'cover-gasket', 'cover-bolts', 'tappet-caps', 'head', 'head-bolts'],
  opsGhost: ['ctx-cylinder'],

  /** Nhãn gắn vào mô hình trong chế độ Hoạt động. */
  labels(asm, kin) {
    const camPos = new THREE.Vector3(L.cam.x1 + 6, L.cam.y, L.cam.z);
    return [
      { pos: () => camPos, text: 'trục cam' },
      { pos: () => kin.sprocketMarkPos(), text: 'dấu căn cam', accent: true },
      {
        pos: () => new THREE.Vector3(V.intake.rockerX, V.intake.tip[0] + 14, V.intake.tip[1] + 8),
        text: () => `nạp ${kin.state.lift.intake.toFixed(2)} mm`,
        accent: () => kin.state.open.intake,
      },
      {
        pos: () => new THREE.Vector3(V.exhaust.rockerX, V.exhaust.tip[0] + 14, V.exhaust.tip[1] - 8),
        text: () => `xả ${kin.state.lift.exhaust.toFixed(2)} mm`,
        accent: () => kin.state.open.exhaust,
      },
      {
        pos: () => new THREE.Vector3(0, asm.part('ctx-piston').kin.pos.y + L.pistonCH + 8, 0),
        text: () => kin.state.strokeName.toUpperCase(),
        accent: true,
      },
    ];
  },

  /**
   * Panel điều khiển chế độ Hoạt động.
   * api = { drive, rpm, playing, setDrive(deg), setRpm(rpm), setPlaying(bool) }
   */
  opsPanel(mount, kin, api) {
    const strokes = el('div', { class: 'strokes' },
      ...STROKES.map((s, i) => el('div', { 'data-i': i, text: s.split(' ')[0] })));

    const angle = el('input', { type: 'range', min: 0, max: 720, step: 1, value: api.drive });
    const angleLb = el('b', { text: '0°' });
    angle.addEventListener('input', () => { api.setPlaying(false); api.setDrive(+angle.value); });

    const rpm = el('input', { type: 'range', min: 8, max: 400, step: 2, value: api.rpm });
    const rpmLb = el('b', { text: `${api.rpm} v/ph` });
    rpm.addEventListener('input', () => { api.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    const bar = (cls) => {
      const i = el('i');
      return { node: el('div', { class: `bar ${cls}` }, i), i };
    };
    const bIn = bar(''), bEx = bar('ex');
    const vIn = el('span', { class: 'vl', text: '0,00' }), vEx = el('span', { class: 'vl', text: '0,00' });
    const camLb = el('span', { class: 'vl', text: '0°' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'field' }, el('label', {}, '4 kỳ đang diễn ra'), strokes),

      el('div', { class: 'field' }, el('label', {}, 'Góc trục khuỷu', angleLb), angle),

      el('div', { class: 'field' }, el('label', {}, 'Tốc độ mô phỏng', rpmLb), rpm),

      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('button', { class: 'tlbtn', text: 'ĐCT', title: 'Về điểm chết trên cuối kỳ nén',
          onclick: () => { api.setPlaying(false); api.setDrive(360); } }),
        el('button', { class: 'tlbtn', text: 'ĐCD', title: 'Về điểm chết dưới',
          onclick: () => { api.setPlaying(false); api.setDrive(540); } }),
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'góc trục cam' }),
        camLb,
      ),

      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Độ nâng NẠP' }), bIn.node, vIn,
        el('span', { class: 'lb', text: 'Độ nâng XẢ' }), bEx.node, vEx,
      ),

      el('div', { class: 'note', html:
        '<b>Đọc gì ở đây:</b> trục cam quay đúng <b>1/2</b> tốc độ trục khuỷu. '
        + 'Tăng tốc độ lên sẽ thấy rõ: trong 720° trục khuỷu, mỗi xupap chỉ mở <b>đúng 1 lần</b>. '
        + 'Đó là lý do động cơ 4 kỳ bắt buộc phải có bộ truyền giảm tốc 2:1 cho trục cam.' }),

      el('div', { class: 'note', html:
        '<b>Góc trùng điệp:</b> cuối kỳ xả, xupap xả chưa kịp đóng thì xupap nạp đã bắt đầu mở '
        + `(mở ${-L.timing.intakeOpen}° trước ĐCT, xả đóng ${L.timing.exhaustClose - 720}° sau ĐCT). `
        + 'Kéo thanh góc trục khuỷu qua vùng 700–730° để thấy cả hai cùng hé.' }),

      el('div', { class: 'note warn', html:
        `<b>Khe hở nhiệt ${L.lash.intake} mm</b> làm độ nâng xupap NHỎ HƠN độ nâng cam đúng `
        + `${L.lash.intake} mm và làm xupap mở trễ hơn một chút. Đó là khoảng dư để chi tiết `
        + 'giãn nhiệt mà vẫn đóng kín được.' }),

      el('div', { class: 'note', html:
        '<b>Vỏ máy đang bị ẩn</b> để thấy được cơ cấu. Muốn xem lại vỏ: tích ô '
        + '<i>Thân đầu bò</i> / <i>Nắp &amp; gioăng</i> trong danh mục bên phải, '
        + 'hoặc chuyển sang chế độ <i>Tháo lắp</i>.' }),
    ));

    function update() {
      const s = kin.state;
      angleLb.textContent = `${s.theta.toFixed(0)}°`;
      if (document.activeElement !== angle) angle.value = String(s.theta);
      camLb.textContent = `${s.camAngle.toFixed(0)}°`;
      playBtn.textContent = api.playing ? '⏸' : '▶';
      strokes.querySelectorAll('div').forEach((d, i) =>
        d.setAttribute('aria-current', String(i === s.stroke)));
      bIn.i.style.width = pct(s.lift.intake, L.cam.lift);
      bEx.i.style.width = pct(s.lift.exhaust, L.cam.lift);
      vIn.textContent = `${s.lift.intake.toFixed(2)} mm`;
      vEx.textContent = `${s.lift.exhaust.toFixed(2)} mm`;
    }
    update();
    return { update };
  },

  /** Đoạn giới thiệu hiện ở đầu panel bước (chế độ Tháo lắp). */
  intro: {
    title: 'Cơ cấu phối khí SOHC 2 xupap',
    html: `
      <p>Chuỗi truyền động từ dưới lên: <b>trục khuỷu → dây cam (2:1) → trục cam →
      cò mổ → xupap</b>. Mỗi khâu chỉ làm một việc, và sai ở bất kỳ khâu nào cũng
      biểu hiện ra thành cùng một triệu chứng: máy yếu và nổ dội.</p>
      <p><b>Vì sao 2:1?</b> Một chu trình 4 kỳ cần <b>2 vòng</b> trục khuỷu nhưng mỗi
      xupap chỉ được mở <b>1 lần</b>. Nên trục cam phải quay chậm bằng nửa trục khuỷu.</p>
      <p><b>Tỉ số đòn cò mổ = 1:1</b> trong mô hình này (cạnh phía cam
      ${Math.abs(V.intake.padZ - V.intake.pivot[1])} mm = cạnh phía xupap
      ${Math.abs(V.intake.tip[1] - V.intake.pivot[1])} mm), nên độ nâng xupap
      bằng độ nâng cam ${L.cam.lift} mm trừ khe hở nhiệt.</p>
      <p><b>Nhông cam ${L.camSprocket.teeth} răng</b> (bán kính vòng chia ${CAM_PR.toFixed(1)} mm)
      ăn với nhông trục khuỷu ${L.crankSprocket.teeth} răng.</p>`,
  },

  /** Bảng chẩn đoán hiện ở cuối panel bước. */
  symptoms: [
    { sign: 'Gõ đầu bò khi máy không tải, hết khi lên ga',
      cause: 'Khe hở nhiệt xupap quá lớn · mòn lõm mặt tiếp xúc cò mổ · thiếu nhớt lên đầu bò '
        + '(mòn cổ trục cam).',
      fix: 'Căn lại khe hở nhiệt trước — rẻ nhất và thường đúng. Nếu còn: kiểm nhớt lên đầu bò '
        + '(tháo nắp, nổ máy 30 giây, phải thấy nhớt rỉ ra ở trục cò).' },
    { sign: 'Tiếng "lách cách" ở đầu bò lúc máy nguội, đề máy',
      cause: 'Dây cam giãn · lưỡi căng mòn/nứt · bộ căng hết hành trình bù.',
      fix: 'Thay dây cam cùng lưỡi căng và dẫn hướng. Thay lẻ thì kêu lại nhanh.' },
    { sign: 'Máy yếu, nổ dội qua bộ hoà khí, hao xăng',
      cause: 'Căn cam lệch răng (pha phối khí sai) · mòn vấu cam làm độ nâng giảm.',
      fix: 'Kiểm dấu căn cam ở ĐCT cuối kỳ nén. Đo độ nâng vấu bằng panme.' },
    { sign: 'Khói xanh khi thả ga sau khi ép ga',
      cause: 'Phớt thân xupap chai · mòn ống dẫn hướng xupap.',
      fix: 'Thay phớt. Nếu khe hở thân–ống vượt giới hạn thì phải ép ống mới VÀ doa lại bệ xupap.' },
    { sign: 'Mất nén, khó nổ khi nguội, máy yếu khi tải',
      cause: 'Xupap không đóng kín (mòn/rỗ mặt vát, khe hở nhiệt quá nhỏ làm cháy xupap) · '
        + 'hở gioăng đầu bò.',
      fix: 'Đo áp suất nén khô, rồi nhỏ vài giọt nhớt vào lỗ bugi và đo lại: nén KHÔNG đổi '
        + '-> vấn đề ở xupap hoặc gioăng; nén tăng rõ -> ở xéc-măng (hệ thống 02).' },
    { sign: 'Rỉ nhớt dọc mép đầu bò, nhớt đọng trên cánh tản nhiệt',
      cause: 'Gioăng nắp đầu bò chai · mất o-ring nắp che cò · siết bu lông nắp quá tay làm '
        + 'biến dạng mép nhôm.',
      fix: 'Thay gioăng và o-ring, siết đúng ≈ 10 N·m đối xứng.' },
    { sign: 'Nổ dội, máy giật, sau khi vừa lắp lại đầu bò',
      cause: 'Căn cam lệch 1 răng — lỗi phổ biến nhất sau khi làm đầu bò.',
      fix: 'Đưa về ĐCT cuối kỳ nén (cả hai cò lỏng) rồi kiểm dấu trên nhông cam.' },
  ],
};
