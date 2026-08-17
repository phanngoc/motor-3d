/**
 * index.js — Module hệ thống 05: Hộp số 4 cấp & cơ cấu sang số.
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, GEARS, MODULE, TOOTH_SUM, POSITIONS, DRUM_STEP, FORK_TABLE,
  forkOffset, engagedGear, ratioOf, grooveXAt,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const S = L.slider, C = L.counter, D = L.drum;
const mm = (v) => `${v.toFixed(2)} mm`;

/**
 * Khe hở giữa mặt cài then và mặt bánh răng kề nó, tại một độ dịch cho trước.
 * Dương = còn khe; âm = hai thân đã chọc vào nhau.
 * side = -1 xét bánh răng phía -X, +1 xét bánh răng phía +X.
 */
function sliderGap(key, side, offset) {
  const [lo, hi] = S[key].pair;
  const g = GEARS[(side < 0 ? lo : hi) - 1];
  const sliderFace = S[key].x + offset + side * (S.w / 2);
  const gearFace = g.x - side * (C.gearW / 2);
  return (gearFace - sliderFace) * side;
}

/**
 * Các kiểm tra KỸ THUẬT chạy bởi `npm run verify`.
 * Nhóm quan trọng nhất là nhóm về CÀI THEN: nếu khe hở ở mo nhỏ hơn chiều dài
 * vấu thì vấu đã ăn sẵn khi đang ở mo (hộp số khóa cứng), còn nếu hành trình
 * quá lớn thì thân cài then chọc vào thân bánh răng.
 */
const checks = [
  {
    name: 'Tổng răng mỗi cặp bằng nhau (điều kiện ăn khớp thường xuyên)',
    run() {
      const sums = GEARS.map((g) => g.zM + g.zC);
      const ok = sums.every((s) => s === sums[0]);
      return { pass: ok, msg: `${sums.join(' · ')} (mọi cặp phải cùng khoảng cách trục)` };
    },
  },
  {
    name: 'Khoảng cách trục hình học khớp với tính toán',
    run() {
      const geom = Math.hypot(L.main.y - C.y, L.main.z - C.z);
      const calc = (MODULE * TOOTH_SUM) / 2;
      return { pass: Math.abs(geom - calc) < 1e-6,
        msg: `hình học ${geom.toFixed(3)} mm / tính toán ${calc.toFixed(3)} mm` };
    },
  },
  {
    name: 'Tỉ số giảm dần đơn điệu số 1 -> số 4',
    run() {
      const r = [1, 2, 3, 4].map(ratioOf);
      const ok = r.every((v, i) => i === 0 || v < r[i - 1]);
      return { pass: ok, msg: r.map((v) => v.toFixed(3)).join(' > ') };
    },
  },
  {
    name: 'Ở MO: vấu cài then chưa ăn vào lỗ',
    run() {
      let worst = Infinity, who = '';
      for (const k of ['a', 'b']) {
        for (const side of [-1, +1]) {
          const gap = sliderGap(k, side, 0);
          if (gap - S.dogLen < worst) { worst = gap - S.dogLen; who = `${k}${side < 0 ? '-' : '+'}`; }
        }
      }
      return { pass: worst > 0,
        msg: `dư ${mm(worst)} sau khi trừ chiều dài vấu ${S.dogLen} mm (chỗ sát nhất: ${who})` };
    },
  },
  {
    name: 'Ở VỊ TRÍ ĂN: thân cài then không chọc vào thân bánh răng',
    run() {
      let worst = Infinity, who = '';
      for (const k of ['a', 'b']) {
        for (const side of [-1, +1]) {
          const gap = sliderGap(k, side, side * S.travel);
          if (gap < worst) { worst = gap; who = `${k}${side < 0 ? '-' : '+'}`; }
        }
      }
      return { pass: worst > 0.5, msg: `khe còn ${mm(worst)} (chỗ sát nhất: ${who})` };
    },
  },
  {
    name: 'Ở VỊ TRÍ ĂN: vấu cắm đủ sâu',
    run() {
      let worst = Infinity;
      for (const k of ['a', 'b']) {
        for (const side of [-1, +1]) {
          worst = Math.min(worst, S.dogLen - sliderGap(k, side, side * S.travel));
        }
      }
      return { pass: worst >= 3, msg: `cắm sâu ${mm(worst)} (cần ≥ 3 mm)` };
    },
  },
  {
    name: 'Lỗ vấu nằm giữa lỗ moay-ơ và chân răng',
    run() {
      const holeR = S.dogD / 2 + 0.25;
      const toBore = (S.dogR - holeR) - C.boreR;   // giống nhau ở mọi bánh răng
      let toRoot = Infinity, who = '';
      for (const g of GEARS) {
        const root = (MODULE * g.zC) / 2 - MODULE * 1.25;
        const d = root - (S.dogR + holeR);
        if (d < toRoot) { toRoot = d; who = `số ${g.n} (${g.zC} răng)`; }
      }
      return { pass: Math.min(toRoot, toBore) > 0.3,
        msg: `tới chân răng ${mm(toRoot)} (hẹp nhất ở ${who}) · tới lỗ moay-ơ ${mm(toBore)}` };
    },
  },
  {
    name: 'Không bao giờ ăn 2 số cùng lúc (quét 360° trống số)',
    run() {
      let bad = null;
      for (let a = 0; a < 360; a += 0.25) {
        const off = ['a', 'b'].map((k) => Math.abs(forkOffset(FORK_TABLE[k], a)));
        const moved = off.filter((v) => v > S.travel * 0.35).length;
        if (moved > 1) { bad = a; break; }
      }
      return { pass: bad === null,
        msg: bad === null ? 'mọi góc trống chỉ có tối đa 1 cài then rời vị trí giữa'
          : `2 cài then cùng rời vị trí giữa tại ${bad}°` };
    },
  },
  {
    name: 'Cả 5 vị trí trống số cho đúng cấp số mong đợi',
    run() {
      const got = POSITIONS.map((_, i) => engagedGear(i * DRUM_STEP));
      const want = [0, 1, 2, 3, 4];
      return { pass: got.every((v, i) => v === want[i]),
        msg: got.map((v, i) => `${POSITIONS[i]}->${v || 'N'}`).join(' · ') };
    },
  },
  {
    // Đây là quan hệ quan trọng nhất của cả hệ thống: nếu sai, rãnh trên trống
    // sẽ không nằm ở nơi chốt càng cua đang ở, và animation sẽ "trôi" khỏi rãnh.
    name: 'Chốt càng cua luôn nằm đúng trong rãnh (mọi góc trống)',
    run() {
      let worst = 0, at = 0, who = '';
      for (const k of ['a', 'b']) {
        for (let phi = 0; phi < 360; phi += 0.5) {
          const grooveCenter = grooveXAt(k, D.pinAngle - phi);
          const pinX = S[k].x + forkOffset(FORK_TABLE[k], phi);
          const err = Math.abs(grooveCenter - pinX);
          if (err > worst) { worst = err; at = phi; who = k; }
        }
      }
      return { pass: worst < 1e-9,
        msg: worst < 1e-9 ? 'lệch 0 mm ở mọi góc (rãnh được SINH RA từ bảng cấp số)'
          : `lệch tối đa ${mm(worst)} tại ${at}° (càng ${who})` };
    },
  },
  {
    name: 'Quét 360° trống số qua kinematics thật: không NaN, tỉ số đúng',
    run(asm, kin) {
      if (!kin) return { pass: false, msg: 'không tạo được kinematics' };
      let bad = null;
      const seen = new Set();
      for (let a = 0; a < 360; a += 0.5) {
        kin.set(1000, a);
        const s = kin.state;
        for (const v of [s.counterAngle, s.ratio, s.outRpmFactor, s.slider.a, s.slider.b]) {
          if (!Number.isFinite(v)) { bad ??= `NaN tại ${a}°`; }
        }
        if (Math.abs(s.slider.a) > S.travel + 1e-6 || Math.abs(s.slider.b) > S.travel + 1e-6) {
          bad ??= `hành trình cài then vượt ${S.travel} mm tại ${a}°`;
        }
        if (s.gear > 0 && Math.abs(s.ratio - ratioOf(s.gear)) > 1e-9) {
          bad ??= `tỉ số sai ở số ${s.gear} tại ${a}°`;
        }
        seen.add(s.gear);
      }
      const missing = [0, 1, 2, 3, 4].filter((g) => !seen.has(g));
      if (missing.length) bad ??= `không đạt được cấp số: ${missing.join(', ')}`;
      return { pass: bad === null, msg: bad ?? 'đủ 5 cấp, hành trình trong giới hạn, tỉ số khớp' };
    },
  },
  {
    name: 'Rãnh xoắn nằm gọn trong chiều dài trống số',
    run() {
      let lo = Infinity, hi = -Infinity;
      for (const k of ['a', 'b']) {
        for (let t = 0; t < 360; t += 1) {
          const x = grooveXAt(k, t);
          lo = Math.min(lo, x - D.grooveW / 2);
          hi = Math.max(hi, x + D.grooveW / 2);
        }
      }
      const m = Math.min(lo - D.x0, D.x1 - hi);
      return { pass: m > 2, msg: `rãnh nằm trong [${lo.toFixed(1)}, ${hi.toFixed(1)}], `
        + `trống [${D.x0}, ${D.x1}] — biên ${mm(m)}` };
    },
  },
];

export default {
  mode: '3d',
  slug: 'gearbox',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,

  /**
   * Nhìn từ PHÍA TRƯỚC xe (-Z) và hơi cao: hướng này gần vuông góc với trục nên
   * thấy rõ các cặp bánh răng ăn khớp — đó là bài học chính của hệ thống này.
   * Trống số nằm ở z=+56 nên rơi ra phía sau, không che các trục.
   * Muốn xem rãnh trống số thì bấm T (nhìn từ trên).
   */
  frameDir: [0.26, 0.36, -0.90],
  frameExclude: ['ctx-case', 'ctx-clutch', 'shift-pedal', 'front-sprocket'],
  contextCategory: 'Ngữ cảnh (không tháo)',

  /** Chế độ Hoạt động: bỏ vỏ và bàn đạp để thấy cơ cấu bên trong. */
  opsHidden: ['ctx-case'],
  opsGhost: ['ctx-clutch'],

  labels(asm, kin) {
    const at = (y, z, x) => new THREE.Vector3(x, y, z);
    return [
      { pos: () => at(L.main.y + 14, 0, L.main.x1 - 6), text: 'trục sơ cấp (vào)' },
      { pos: () => at(C.y - 22, 0, 30), text: () => `trục thứ cấp (ra) — ${kin.state.gearName}`,
        accent: () => kin.state.gear > 0 },
      { pos: () => at(D.y + D.rOuter + 8, D.z, D.x1 - 8), text: 'trống số', accent: true },
      {
        pos: () => at(C.y + S.r + 8, 0, S.a.x + kin.state.slider.a),
        text: () => `cài then 1–2  ${kin.state.slider.a >= 0 ? '+' : ''}${kin.state.slider.a.toFixed(1)}`,
        accent: () => Math.abs(kin.state.slider.a) > S.travel * 0.35,
      },
      {
        pos: () => at(C.y + S.r + 8, 0, S.b.x + kin.state.slider.b),
        text: () => `cài then 3–4  ${kin.state.slider.b >= 0 ? '+' : ''}${kin.state.slider.b.toFixed(1)}`,
        accent: () => Math.abs(kin.state.slider.b) > S.travel * 0.35,
      },
    ];
  },

  opsPanel(mount, kin, api) {
    // ── Chọn cấp số ──────────────────────────────────────────────────────────
    const gearBtns = POSITIONS.map((p, i) => el('div', {
      'data-g': i, text: p, title: i === 0 ? 'Số mo' : `Số ${p}`,
      onclick: () => kin.setGear(i),
    }));
    const gears = el('div', { class: 'strokes five' }, ...gearBtns);

    const rpm = el('input', { type: 'range', min: 10, max: 400, step: 5, value: api.rpm });
    const rpmLb = el('b', { text: `${api.rpm} v/ph` });
    rpm.addEventListener('input', () => { api.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const playBtn = el('button', { class: 'tlbtn primary', text: '⏸', title: 'Chạy/dừng (Space)' });
    playBtn.onclick = () => api.setPlaying(!api.playing);

    // ── Bảng tỉ số ───────────────────────────────────────────────────────────
    const rows = GEARS.map((g) => el('tr', { 'data-g': g.n },
      el('td', { text: `Số ${g.n}` }),
      el('td', { class: 'mono', text: `${g.zM}/${g.zC}` }),
      el('td', { class: 'mono', text: ratioOf(g.n).toFixed(3) }),
      el('td', { class: 'mono', text: `${(100 / ratioOf(g.n)).toFixed(0)}%` }),
    ));
    const table = el('table', { class: 'spec' },
      el('thead', {}, el('tr', {},
        el('th', { text: 'Cấp' }), el('th', { text: 'Răng' }),
        el('th', { text: 'Tỉ số' }), el('th', { text: 'v ra/vào' }))),
      el('tbody', {}, ...rows));

    const drumLb = el('span', { class: 'vl', text: '0°' });
    const outLb = el('span', { class: 'vl', text: '0 v/ph' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'field' }, el('label', {}, 'Cấp số đang cài'), gears),

      el('div', { class: 'field' }, el('label', {}, 'Tốc độ trục sơ cấp', rpmLb), rpm),

      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        playBtn,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'góc trống' }),
        drumLb,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' }, text: 'trục ra' }),
        outLb,
      ),

      table,

      el('div', { class: 'note', html:
        '<b>Điều đáng xem nhất:</b> chọn <b>N</b> và để máy chạy. Cả 4 bánh răng trên trục '
        + 'thứ cấp <b>vẫn quay</b> — vì chúng luôn ăn khớp — nhưng <b>trục thứ cấp đứng yên</b>. '
        + 'Sang số không hề đưa bánh răng nào vào ăn khớp; nó chỉ KHÓA một bánh răng đang '
        + 'quay lô vào trục.' }),

      el('div', { class: 'note', html:
        '<b>Trống số làm gì:</b> đổi cấp số và nhìn 2 nhãn <i>cài then</i>. Ở mỗi cấp số '
        + 'chỉ có <b>tối đa một</b> cài then rời vị trí giữa. Hình dạng rãnh xoắn là thứ '
        + 'bảo đảm điều đó — ăn 2 số cùng lúc sẽ khóa cứng hộp số và vỡ răng ngay.' }),

      el('div', { class: 'note', html:
        `<b>Vì sao vào số "kêu":</b> đây là khớp <b>vấu</b> (${S.dogCount} vấu Ø${S.dogD} mm), `
        + 'không phải khớp đồng tốc như ô tô. Hai mặt đang quay khác tốc độ thì đập vào nhau. '
        + 'Đó là lý do ly hợp phải mở đúng lúc — để hai bên gần bằng tốc độ.' }),

      el('div', { class: 'note warn', html:
        '<b>Nhảy số</b> là khi vấu cài then đã bị vạt tròn cạnh: lực dọc trục sinh ra trong '
        + 'lúc truyền momen sẽ đẩy cài then bật ra. Nguyên nhân gốc gần như luôn là '
        + '<b>ly hợp không mở hết</b> khi sang số — xem hệ thống 04.' }),

      el('div', { class: 'note', html:
        '<b>Vỏ lốc máy đang bị ẩn</b> để thấy được cơ cấu. Tích ô <i>Ngữ cảnh</i> trong '
        + 'danh mục bên phải nếu muốn thấy vỏ.' }),
    ));

    function update() {
      const s = kin.state;
      gearBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === s.gear)));
      rows.forEach((r) => r.setAttribute('aria-current', String(+r.dataset.g === s.gear)));
      drumLb.textContent = `${s.drum.toFixed(0)}°`;
      outLb.textContent = s.gear === 0 ? 'đứng yên' : `${(api.rpm * s.outRpmFactor).toFixed(0)} v/ph`;
      playBtn.textContent = api.playing ? '⏸' : '▶';
    }
    update();
    return { update };
  },

  intro: {
    title: 'Vì sao gọi là "ăn khớp thường xuyên"',
    html: `
      <p>Điều gây ngạc nhiên nhất khi mở hộp số xe máy ra: <b>tất cả các cặp bánh răng
      luôn ăn khớp với nhau, kể cả các cấp đang không dùng</b>. Sang số không phải là
      đưa bánh răng vào ăn khớp, mà là <b>khóa một bánh răng đang chạy lô vào trục</b>.</p>
      <p>Trên <b>trục sơ cấp</b>, mọi bánh răng đều cố định vào trục. Trên <b>trục thứ cấp</b>,
      mọi bánh răng đều chạy lô trên bạc đồng. Giữa chúng là 2 <b>cài then</b> — trượt dọc
      trục được nhưng không quay được so với trục. Vấu của cài then cắm vào lỗ trên mặt bên
      bánh răng chạy lô là xong: momen đi qua đúng cấp số đó.</p>
      <p><b>Điều kiện hình học bắt buộc:</b> mọi cặp phải cùng khoảng cách trục, nên
      <b>tổng số răng mỗi cặp phải bằng nhau</b> (ở đây = ${TOOTH_SUM}). Đó là lý do
      không thể tự chọn tỉ số tùy ý.</p>
      <p><b>Trống số</b> có 2 rãnh xoắn; chốt của mỗi càng cua chạy trong một rãnh. Mỗi lần
      đạp số, cơ cấu con cóc xoay trống đúng ${DRUM_STEP}°. Hình dạng rãnh bảo đảm không
      bao giờ có 2 cấp số ăn cùng lúc.</p>`,
  },

  /** Bảng chẩn đoán hiện ở cuối panel bước. */
  symptoms: [
    { sign: 'Nhảy số khi tăng tốc (thường số 2 hoặc 3)',
      cause: 'Vấu cài then mòn vạt cạnh. Nguyên nhân GỐC: ly hợp không mở hết khi sang số, '
        + 'hoặc đạp số nửa vời.',
      fix: 'Thay cặp bánh răng bị mòn <b>và</b> điều chỉnh lại cần mở ly hợp (hệ thống 04). '
        + 'Chỉ thay bánh răng là sẽ hỏng lại.' },
    { sign: 'Vào số rất kêu, nhất là số 1 khi xe đứng',
      cause: 'Ly hợp không mở hết (cần mở điều chỉnh sai, đĩa thép cong).',
      fix: 'Điều chỉnh cần mở ly hợp trước — cách rẻ nhất và thường đúng.' },
    { sign: 'Không vào được một số cụ thể, các số khác bình thường',
      cause: 'Càng cua của cấp số đó bị cong · rãnh trống số mòn · lỗ vấu banh miệng.',
      fix: 'Phải tách máy. Kiểm càng cua của cấp số đó trước tiên.' },
    { sign: 'Bàn đạp số không trả về vị trí giữa',
      cause: 'Lò xo hồi của cơ cấu con cóc yếu hoặc đứt.',
      fix: 'Nhiều đời tháo được vỏ phải mà không cần tách lốc máy.' },
    { sign: 'Kêu ru theo TỐC ĐỘ XE ở một số nhất định',
      cause: 'Răng của cặp số đó rỗ/mòn, hoặc bạc chạy lô mòn làm ăn khớp lệch.',
      fix: 'Xác định ở số nào rồi tách máy kiểm cặp bánh răng tương ứng.' },
    { sign: 'Rỉ nhớt ra vùng nhông trước',
      cause: 'Phớt đầu trục thứ cấp hỏng.',
      fix: 'Thay phớt — KHÔNG cần tách lốc máy. Kiểm luôn cổ trục có bị xước không.' },
    { sign: 'Mất cảm giác "cục" khi vào số, số vào lửng',
      cause: 'Lò xo cần định vị số yếu, hoặc hốc vành định vị mòn tròn.',
      fix: 'Thay lò xo và vành định vị. Vào số lửng làm vấu chỉ ăn một nửa và sẽ vỡ.' },
  ],
};
