/**
 * index.js — Module hệ thống 04: Ly hợp (bộ nồi).
 */

import * as THREE from 'three';
import { el } from '../../core/ui.js';
import {
  L, PRIMARY, PRIMARY_RATIO, CENTER_DISTANCE, centEngage, weightRadius,
  plateLayout, stackThickness, frictionFaces,
} from './layout.js';
import { PARTS } from './parts.js';
import { STEPS } from './steps.js';
import { createKinematics } from './kinematics.js';

const CR = L.crank, MS = L.main, CE = L.cent, WE = L.wet, LI = L.lifter;
const mm = (v) => `${v.toFixed(2)} mm`;
const pct = (x) => `${Math.max(0, Math.min(100, x * 100)).toFixed(0)}%`;

/** Các chi tiết thuộc từng bộ ly hợp — dùng cho phép kiểm bao hình. */
const CENT_IDS = ['cent-drum', 'cent-spider', 'cent-weights', 'cent-springs', 'cent-nut'];
const WET_IDS = ['basket', 'hub', 'friction-plates', 'steel-plates',
  'pressure-plate', 'clutch-springs', 'clutch-bolts'];

/** Hộp bao theo X của một nhóm chi tiết, lấy từ hình học THẬT. */
function groupBox(asm, ids) {
  const box = new THREE.Box3();
  for (const id of ids) if (asm.parts.has(id)) box.expandByObject(asm.part(id).object);
  return box;
}

const checks = [
  {
    name: 'Khoảng cách trục khớp với module × tổng răng',
    run() {
      const geom = Math.abs(CR.y - MS.y);
      return { pass: Math.abs(geom - CENTER_DISTANCE) < 1e-9,
        msg: `hình học ${geom.toFixed(3)} mm / tính toán ${CENTER_DISTANCE.toFixed(3)} mm `
          + `(module ${PRIMARY.module} × ${PRIMARY.zDrive + PRIMARY.zDriven} răng / 2)` };
    },
  },
  {
    name: 'Tỉ số sơ cấp trong khoảng thực tế của xe số',
    run() {
      return { pass: PRIMARY_RATIO > 2.8 && PRIMARY_RATIO < 4.0,
        msg: `${PRIMARY_RATIO.toFixed(3)} : 1 (${PRIMARY.zDrive}/${PRIMARY.zDriven})` };
    },
  },
  {
    // Đây là phép kiểm quan trọng nhất của hệ thống này — nó xác nhận cái lý do
    // hình dạng bộ nồi phải như vậy.
    name: 'Hai bộ ly hợp không giao nhau (bài toán bao hình)',
    run(asm) {
      if (!asm) return { pass: false, msg: 'không có assembly' };
      const bc = groupBox(asm, CENT_IDS);
      const bw = groupBox(asm, WET_IDS);
      if (bc.isEmpty() || bw.isEmpty()) return { pass: false, msg: 'thiếu chi tiết' };
      const sumR = CE.drum.rOut + WE.basket.rOut;
      const gapX = bc.min.x - bw.max.x;
      const needSeparation = sumR > Math.abs(CR.y - MS.y);
      return { pass: !needSeparation || gapX > 1,
        msg: `tổng bán kính ${sumR} mm ${needSeparation ? '>' : '≤'} khoảng cách trục `
          + `${Math.abs(CR.y - MS.y).toFixed(1)} mm -> ${needSeparation ? 'buộc phải' : 'không cần'} `
          + `rời nhau theo X · khe thực tế ${mm(gapX)} `
          + `(đa đĩa tới x=${bw.max.x.toFixed(1)}, li tâm từ x=${bc.min.x.toFixed(1)})` };
    },
  },
  {
    name: 'Ở trạng thái NHẢ, quả búa không chạm chuông',
    run() {
      const gap = CE.drum.rIn - weightRadius(0);
      return { pass: gap > 2, msg: `khe ${mm(gap)} (búa R${weightRadius(0)} / chuông R${CE.drum.rIn})` };
    },
  },
  {
    name: 'Ở trạng thái ĂN, quả búa chạm chuông',
    run() {
      const gap = CE.drum.rIn - weightRadius(1);
      return { pass: gap >= 0 && gap < 0.5,
        msg: `khe ${mm(gap)} — phải gần 0 để truyền được momen` };
    },
  },
  {
    name: 'Mức đóng li tâm đơn điệu tăng theo vòng tua',
    run() {
      let prev = -1, bad = null;
      for (let rpm = 0; rpm <= 9000; rpm += 25) {
        const e = centEngage(rpm);
        if (!Number.isFinite(e) || e < prev - 1e-9) bad ??= `tại ${rpm} v/ph`;
        prev = e;
      }
      const e0 = centEngage(CE.rpmStart - 1), e1 = centEngage(CE.rpmFull + 1);
      if (e0 > 1e-6) bad ??= `đã đóng ${pct(e0)} khi chưa tới ${CE.rpmStart} v/ph`;
      if (e1 < 1 - 1e-6) bad ??= `chưa đóng hết ở trên ${CE.rpmFull} v/ph`;
      return { pass: bad === null,
        msg: bad ?? `nhả hẳn dưới ${CE.rpmStart} v/ph, ăn hẳn trên ${CE.rpmFull} v/ph` };
    },
  },
  {
    name: 'Bộ đĩa xếp xen kẽ và đĩa MA SÁT nằm ở cả hai đầu',
    run() {
      const p = plateLayout(0);
      const alt = p.every((x, i) => x.isFriction === (i % 2 === 0));
      const ends = p[0].isFriction && p[p.length - 1].isFriction;
      return { pass: alt && ends,
        msg: `${p.map((x) => (x.isFriction ? 'M' : 'T')).join('')} `
          + `(${WE.stack.friction.count} ma sát + ${WE.stack.steel.count} thép)` };
    },
  },
  {
    name: 'Đĩa ma sát ăn moay-ơ và không chạm chuông',
    run() {
      const f = WE.stack.friction;
      const toHub = WE.hub.rSpline - f.rIn;          // răng trong phải chồm vào then hoa
      const toBasket = WE.basket.rIn - f.rOut;       // mép ngoài phải hở với chuông
      return { pass: toHub > 0 && toBasket > 1,
        msg: `chồm vào then hoa moay-ơ ${mm(toHub)} · hở với chuông ${mm(toBasket)}` };
    },
  },
  {
    name: 'Đĩa thép ăn chuông và không chạm moay-ơ',
    run() {
      const s = WE.stack.steel;
      const toBasket = s.tabR - WE.basket.rIn;       // vấu phải chồm vào rãnh chuông
      const toHub = s.rIn - WE.hub.rSpline;          // mép trong phải hở với moay-ơ
      return { pass: toBasket > 0 && toHub > 1,
        msg: `vấu chồm vào rãnh chuông ${mm(toBasket)} · hở với moay-ơ ${mm(toHub)}` };
    },
  },
  {
    name: 'Hành trình mở đủ tách mọi cặp mặt ma sát',
    run() {
      const faces = frictionFaces();
      const need = faces * WE.stack.gapOpen;
      return { pass: LI.travel >= need,
        msg: `hành trình ${LI.travel} mm ≥ ${faces} khe × ${WE.stack.gapOpen} mm = ${need.toFixed(2)} mm` };
    },
  },
  {
    name: 'Bộ đĩa + tấm ép vừa trong lòng chuông',
    run() {
      const p = plateLayout(1);
      const endOpen = p[p.length - 1].x + p[p.length - 1].t;
      const room = WE.basket.cupX[1] - WE.stack.x0;
      const used = (endOpen - WE.stack.x0) + WE.pressure.t;
      return { pass: used < room,
        msg: `dùng ${mm(used)} / lòng chuông ${mm(room)} `
          + `(bộ đĩa dày ${mm(stackThickness())} + tấm ép, đã tính cả khe hở khi mở)` };
    },
  },
  {
    name: 'Thanh đẩy chạy được trong lòng trục sơ cấp rỗng',
    run() {
      const clear = MS.bore - LI.rod.r;
      const reaches = LI.rod.x1 >= plateLayout(0).reduce((a, p) => Math.max(a, p.x + p.t), 0);
      return { pass: clear > 0.2 && reaches,
        msg: `khe thanh đẩy – lòng trục ${mm(clear)} · đầu thanh tới x=${LI.rod.x1} mm` };
    },
  },
];

export default {
  mode: '3d',
  slug: 'clutch',
  parts: PARTS,
  steps: STEPS,
  createKinematics,
  checks,
  driveRange: 360,

  /**
   * Nhìn gần VUÔNG GÓC với trục (chủ yếu từ +Z): trục X chạy ngang màn hình nên
   * thấy ngay hai bộ ly hợp nằm LỆCH NHAU dọc trục, và hai trục nằm trên hai
   * độ cao khác nhau. Đó là điều đầu tiên phải nhận ra ở hệ thống này.
   * Nhìn chéo từ +X thì hai bộ chồng lên nhau, rất khó đọc.
   */
  frameDir: [0.20, 0.26, 0.94],
  frameExclude: ['ctx-case', 'ctx-crank', 'ctx-mainshaft', 'lifter-arm', 'lifter-cam'],
  contextCategory: 'Ngữ cảnh (không tháo)',
  initialRpm: 1200,

  /** Chế độ Hoạt động: bỏ vỏ đi. Chuông làm trong để thấy bộ đĩa và quả búa. */
  opsHidden: ['cover', 'cover-gasket', 'cover-bolts', 'ctx-case'],
  opsGhost: ['cent-drum', 'basket'],

  labels(asm, kin) {
    const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    return [
      {
        pos: () => at(CE.drum.x1 + 8, CR.y + CE.drum.rOut - 6),
        text: () => `li tâm ${pct(kin.state.centEngage)}`,
        accent: () => kin.state.centEngage > 0.02,
      },
      {
        pos: () => at(WE.basket.cupX[1] + 6, MS.y + WE.basket.rOut + 8),
        text: () => (kin.state.wetOpen > 0.02
          ? `đa đĩa MỞ ${pct(kin.state.wetOpen)}` : 'đa đĩa đóng'),
        accent: () => kin.state.wetOpen > 0.02,
      },
      { pos: () => at(L.primary.x1 + 4, CR.y - 24), text: `sơ cấp ${PRIMARY_RATIO.toFixed(2)}:1` },
      {
        pos: () => at(MS.x0 + 18, MS.y - WE.basket.rOut - 10),
        text: () => `trục sơ cấp ${kin.state.rpmMain.toFixed(0)} v/ph`,
        accent: () => kin.state.moving,
      },
    ];
  },

  opsPanel(mount, kin, api) {
    const rpm = el('input', { type: 'range', min: 800, max: 8000, step: 50, value: 1200 });
    const rpmLb = el('b', { text: '1200 v/ph' });
    rpm.addEventListener('input', () => { kin.setRpm(+rpm.value); rpmLb.textContent = `${rpm.value} v/ph`; });

    const pedal = el('input', { type: 'range', min: 0, max: 100, step: 1, value: 0 });
    const pedalLb = el('b', { text: 'nhả chân' });
    pedal.addEventListener('input', () => kin.setPedal(+pedal.value / 100));

    const kick = el('button', { class: 'tlbtn', text: '⤓', title: 'Đạp số một nhịp rồi nhả' });
    let kickT = null;
    kick.onclick = () => {
      if (kickT) clearInterval(kickT);
      let t = 0;
      kickT = setInterval(() => {
        t += 0.05;
        // đạp xuống rồi nhả — mô phỏng một nhịp đạp số thật
        const v = t < 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 0.5);
        kin.setPedal(v);
        pedal.value = String(Math.round(v * 100));
        if (t >= 1) { clearInterval(kickT); kickT = null; kin.setPedal(0); pedal.value = '0'; }
      }, 50);
    };

    const idle = el('button', { class: 'tlbtn', text: 'KT', title: 'Về vòng không tải (1400)' });
    idle.onclick = () => { kin.setRpm(1400); rpm.value = '1400'; rpmLb.textContent = '1400 v/ph'; };
    const rev = el('button', { class: 'tlbtn', text: 'GA', title: 'Lên ga (4000)' });
    rev.onclick = () => { kin.setRpm(4000); rpm.value = '4000'; rpmLb.textContent = '4000 v/ph'; };

    const bar = (cls) => { const i = el('i'); return { node: el('div', { class: `bar ${cls}` }, i), i }; };
    const bCent = bar(''), bWet = bar('ex');
    const vCent = el('span', { class: 'vl', text: '0%' }), vWet = el('span', { class: 'vl', text: '0%' });

    const rows = [
      ['Trục khuỷu', () => kin.state.rpm],
      ['Chuông li tâm', () => kin.state.rpmDrum],
      ['Giỏ ly hợp', () => kin.state.rpmBasket],
      ['Trục sơ cấp', () => kin.state.rpmMain],
    ].map(([k, f]) => {
      const v = el('td', { class: 'mono', text: '0' });
      return { row: el('tr', {}, el('td', { text: k }), v), v, f };
    });
    const table = el('table', { class: 'spec' },
      el('thead', {}, el('tr', {}, el('th', { text: 'Khâu' }), el('th', { text: 'v/ph' }))),
      el('tbody', {}, ...rows.map((r) => r.row)));

    const status = el('div', { class: 'note' });

    mount.append(el('div', { class: 'opspanel' },
      el('div', { class: 'field' }, el('label', {}, 'Vòng tua động cơ', rpmLb), rpm),
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        idle, rev,
        el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' },
          text: `đóng từ ${CE.rpmStart}–${CE.rpmFull} v/ph` }),
      ),
      el('div', { class: 'field' }, el('label', {}, 'Bàn đạp số', pedalLb), pedal),
      el('div', { class: 'row', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        kick, el('span', { class: 'lb', style: { color: 'var(--fg-3)', fontSize: '11px' },
          text: 'đạp một nhịp rồi nhả' }),
      ),
      el('div', { class: 'gauge' },
        el('span', { class: 'lb', text: 'Li tâm đóng' }), bCent.node, vCent,
        el('span', { class: 'lb', text: 'Đa đĩa mở' }), bWet.node, vWet,
      ),
      table,
      status,

      el('div', { class: 'note', html:
        '<b>Thử thứ nhất — vì sao xe đứng yên khi nổ máy:</b> để vòng tua ở 1400 v/ph. '
        + `Li tâm đóng 0% vì lực li tâm chưa thắng được lò xo kéo (ngưỡng ${CE.rpmStart} v/ph). `
        + 'Chuông li tâm đứng, trục sơ cấp đứng — xe không đi dù đang gài số.' }),

      el('div', { class: 'note', html:
        '<b>Thử thứ hai — lên ga:</b> kéo lên 3000 v/ph. Ba quả búa bung ra, ép vào mặt trong '
        + 'chuông, momen truyền đi. Lực li tâm tỉ lệ <b>bình phương</b> vòng tua nên chỉ cần '
        + 'lên ga một chút là đóng dứt khoát — không lừng khừng như bóp côn tay.' }),

      el('div', { class: 'note', html:
        '<b>Thử thứ ba — đạp số:</b> giữ vòng tua 3000 rồi bấm <b>⤓</b>. Cam xoay, thanh đẩy '
        + 'chạy trong lòng trục sơ cấp rỗng, đẩy tấm ép ra, bộ đĩa tách nhau. '
        + '<b>Giỏ ly hợp vẫn quay</b> (nó nối cứng với động cơ) nhưng trục sơ cấp dừng. '
        + 'Đó chính là khoảnh khắc cài then trong hộp số dịch chỗ được.' }),

      el('div', { class: 'note warn', html:
        '<b>Đây là chỗ nối sang hệ thống 05.</b> Nếu cần mở điều chỉnh quá lỏng, ly hợp không '
        + 'mở hết, hai mặt vấu cài then đập vào nhau khi còn chênh tốc độ — lâu dài làm vấu '
        + 'vạt tròn và sinh ra <b>nhảy số</b>. Thay bánh răng mà không sửa cần mở thì hỏng lại.' }),

      el('div', { class: 'note', html:
        '<b>Vỏ đang bị ẩn</b> và hai chuông đang được làm trong suốt để thấy bộ đĩa với quả búa. '
        + 'Tích lại trong danh mục bên phải nếu muốn thấy chi tiết đặc.' }),
    ));

    function update() {
      const s = kin.state;
      if (document.activeElement !== rpm) { rpm.value = String(s.rpm); rpmLb.textContent = `${s.rpm.toFixed(0)} v/ph`; }
      pedalLb.textContent = s.pedal < 0.02 ? 'nhả chân' : `đạp ${pct(s.pedal)}`;
      bCent.i.style.width = pct(s.centEngage);
      bWet.i.style.width = pct(s.wetOpen);
      vCent.textContent = pct(s.centEngage);
      vWet.textContent = pct(s.wetOpen);
      for (const r of rows) r.v.textContent = r.f().toFixed(0);
      const msg = s.wetOpen > 0.5
        ? '<b>Ly hợp đa đĩa đang MỞ</b> — momen bị ngắt, đây là lúc sang số được.'
        : s.centEngage < 0.02
          ? '<b>Li tâm đang NHẢ</b> — máy chạy mà xe đứng yên, đúng như khi để nổ máy tại chỗ.'
          : s.centEngage < 0.98
            ? `<b>Li tâm đang TRƯỢT</b> — mất ${s.slipCent.toFixed(0)} v/ph, phần này biến thành nhiệt.`
            : '<b>Truyền động thông suốt</b> — li tâm ăn hẳn, đa đĩa đóng.';
      status.innerHTML = msg;
    }
    update();
    return { update };
  },

  intro: {
    title: 'Hai bộ ly hợp nối tiếp nhau',
    html: `
      <p>Xe số có <b>hai</b> bộ ly hợp nối tiếp, mỗi bộ một nhiệm vụ khác nhau hoàn toàn:</p>
      <p><b>Bộ nồi trước — ly hợp li tâm</b>, trên trục khuỷu. Tự động ngắt khi máy chạy
      không tải, tự động đóng khi lên ga. Đây là thứ thay thế tay nắm ly hợp của xe côn tay.</p>
      <p><b>Bộ nồi sau — ly hợp đa đĩa ướt</b>, trên trục sơ cấp hộp số. Nó <b>luôn đóng</b>,
      chỉ mở trong khoảnh khắc bạn đạp số để răng số cài/nhả không bị tải.</p>
      <p><b>Vì sao bộ nồi có hình dạng lạ như vậy:</b> hai bộ đều Ø~92 mm nhưng khoảng cách
      giữa trục khuỷu và trục sơ cấp chỉ ${CENTER_DISTANCE.toFixed(1)} mm — nhỏ hơn tổng hai
      bán kính. Chúng <b>không thể</b> nằm cùng một mặt phẳng, buộc phải lệch nhau dọc trục.
      Cái ống dài của chuông li tâm mang bánh răng sơ cấp chạy vào trong chính là hệ quả
      bắt buộc của bài toán bao hình đó.</p>
      <p><b>Và vì sao trục sơ cấp phải rỗng:</b> cơ cấu mở nằm bên trái, tấm ép nằm bên phải,
      nên phải có một thanh đẩy xuyên qua lòng trục.</p>`,
  },

  symptoms: [
    { sign: 'Vòng tua tăng mà xe không tăng tốc tương ứng (trượt)',
      cause: 'Đĩa ma sát mòn · lò xo ly hợp yếu · dùng sai loại nhớt (nhớt ô tô có phụ gia '
        + 'giảm ma sát) · cần mở điều chỉnh quá căng · má búa li tâm mòn.',
      fix: 'Kiểm LOẠI NHỚT trước — rẻ nhất và hay đúng nhất, phải đạt JASO MA/MA2. '
        + 'Rồi điều chỉnh cần mở. Rồi mới mở ra đo đĩa và lò xo.' },
    { sign: 'Vào số "kêu"/"cục" mạnh, nhất là số 1 khi xe đứng',
      cause: 'Ly hợp đa đĩa không MỞ hết: cần mở điều chỉnh quá lỏng, thanh đẩy hoặc bi mòn dẹt, '
        + 'đĩa thép cong làm đĩa dính nhau, rãnh chuông bị khía.',
      fix: 'Điều chỉnh cần mở trước. Nếu không hết -> mở ra đo độ cong đĩa thép và kiểm rãnh chuông.' },
    { sign: 'Xe bò đi khi vừa nổ máy, chưa lên ga',
      cause: 'Lò xo kéo của ly hợp li tâm yếu hoặc đứt, hoặc ba quả búa bị kẹt ở vị trí bung.',
      fix: 'Tháo bộ nồi trước, kiểm lò xo và hành trình búa. Lỗi này NGUY HIỂM (xe tự trôi '
        + 'khi để nổ máy) — sửa ngay, không đi tiếp.' },
    { sign: 'Nhảy số khi tăng tốc',
      cause: 'Vấu cài then trong hộp số đã mòn vạt cạnh. Nguyên nhân GỐC gần như luôn là '
        + 'ly hợp không mở hết khi sang số.',
      fix: 'Phải sửa CẢ HAI: thay cặp bánh răng mòn (hệ thống 05) và điều chỉnh lại cần mở. '
        + 'Chỉ thay bánh răng thì vài nghìn km sau hỏng lại.' },
    { sign: 'Mùi khét, nhớt đổi màu rất nhanh',
      cause: 'Ly hợp đang trượt liên tục và đốt nóng nhớt.',
      fix: 'Dừng xe kiểm ngay. Chạy tiếp sẽ cháy đĩa và làm bẩn cả đường nhớt (hệ thống 06).' },
    { sign: 'Có tiếng va lạch cạch khi mở/thả ga ở vòng tua thấp',
      cause: 'Then hoa mâm mang búa mòn · bạc trong ống moay-ơ mòn làm chuông li tâm lắc · '
        + 'răng bánh răng sơ cấp mòn.',
      fix: 'Mở vỏ ly hợp, lắc từng cụm bằng tay để tìm chỗ rơ.' },
    { sign: 'Rỉ nhớt ở mép vỏ ly hợp, nhớt chảy xuống gác chân phải',
      cause: 'Gioăng vỏ chai, hoặc mép vỏ nhôm biến dạng do siết bu lông lệch tay.',
      fix: 'Thay gioăng mới, siết ≈ 10 N·m ĐỐI XỨNG. Kiểm độ phẳng mép vỏ.' },
  ],
};
