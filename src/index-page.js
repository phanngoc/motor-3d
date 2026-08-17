/**
 * index-page.js — Trang tổng quan: bản đồ 9 hệ thống + cách dùng + kiến trúc code.
 */

import './style.css';
import { el } from './core/ui.js';
import { SYSTEMS, MACHINE, SPEC_DISCLAIMER } from './systems/registry.js';

const ready = SYSTEMS.filter((s) => s.status === '3d');

document.body.append(
  el('div', { class: 'topbar' },
    el('span', { class: 'brand' }, el('span', { html: '◆' }), 'MOTOR', el('b', { text: '3D' })),
    el('div', { class: 'sep' }),
    el('div', { class: 'title' }, 'Tổng quan', el('small', { text: MACHINE.short })),
  ),
);

const wrap = el('div', { class: 'wrap' });
document.body.append(wrap);

// ── Hero ─────────────────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'hero' },
  el('h1', { text: 'Mô hình 3D tham số hóa xe máy 4 kỳ' }),
  el('p', { html: 'Toàn bộ hình học trong project này được <b>sinh ra bằng code</b> '
    + '(Three.js procedural) chứ không phải import từ file CAD. Mọi kích thước nằm trong '
    + '<code>layout.js</code> của từng hệ thống — sửa một số là cả mô hình và animation '
    + 'cập nhật theo.' }),
  el('p', { html: 'Mục tiêu không phải vẽ đẹp như ảnh chụp, mà là <b>đúng quan hệ ăn khớp, '
    + 'đúng tỉ số truyền, đúng thứ tự tháo lắp</b> — đó là những thứ giúp hiểu cơ cấu.' }),
  el('div', { style: { marginTop: '14px' } },
    el('span', { class: 'pill on', text: `${ready.length}/${SYSTEMS.length} hệ thống có 3D` }),
    el('span', { class: 'pill', text: 'Three.js r180' }),
    el('span', { class: 'pill', text: 'Vite multi-page' }),
    el('span', { class: 'pill', text: 'Không dependency ngoài' }),
  ),
));

// ── Cards hệ thống ───────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'sect' },
  el('h2', { text: '9 luồng — mỗi luồng một trang riêng' }),
  el('p', { class: 'sub', text: 'Chia theo cụm chức năng, đúng như cách thợ máy tách máy.' }),
  el('div', { class: 'cards' }, ...SYSTEMS.map((s) => {
    const is3d = s.status === '3d';
    return el('a', { class: `card${is3d ? ' ready' : ''}`, href: `./pages/${s.slug}.html` },
      el('div', { class: 'top' },
        el('span', { class: 'ix', text: s.ix }),
        el('h3', { text: s.name }),
      ),
      el('p', { text: s.tagline }),
      el('div', { class: 'foot' },
        el('span', { class: `badge ${is3d ? 'ready' : 'paper'}`, text: is3d ? '3D + animation' : 'tài liệu' }),
        ...s.tags.map((t) => el('span', { class: 'badge', text: t })),
      ),
    );
  })),
));

// ── Cách dùng ────────────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'sect' },
  el('h2', { text: 'Cách dùng trang 3D' }),
  el('p', { class: 'sub', text: 'Mỗi trang 3D có hai chế độ, chuyển bằng thanh giữa màn hình hoặc phím 1 / 2.' }),
  el('div', { class: 'two' },
    el('div', {},
      el('h3', { text: 'Chế độ "Hoạt động"' }),
      el('p', { html: 'Cơ cấu chạy theo một biến điều khiển: hệ thống 01 là <b>góc trục khuỷu</b>, '
        + 'hệ thống 05 là <b>cấp số + tốc độ trục sơ cấp</b>. Các đồng hồ bên cạnh đọc số ra từ '
        + '<b>chính hình học đã dựng</b>, nên không bao giờ lệch với hình.' }),
      el('h3', { text: 'Chế độ "Tháo lắp"' }),
      el('p', { html: 'Timeline dưới khung 3D đi theo từng bước tháo thật. Bấm một bước trong danh sách '
        + 'để nhảy đến; nút <b>↺</b> chạy ngược = xem thứ tự <b>lắp lại</b>. Mỗi bước có dụng cụ, '
        + 'lực siết, cảnh báo và mẹo thực tế.' }),
      el('p', { html: 'Cuối panel bước có mục <b>Chẩn đoán từ hiện tượng</b>: đi từ triệu chứng '
        + '(nhảy số, gõ đầu bò, khói xanh…) ngược về nguyên nhân và cách xử lý.' }),
    ),
    el('div', {},
      el('h3', { text: 'Phím tắt' }),
      el('table', { class: 'spec' }, el('tbody', {}, ...[
        ['Space', 'chạy / dừng'],
        ['← →', 'bước trước / bước sau (tháo lắp) · ±5° (hoạt động)'],
        ['R', 'chạy ngược = xem quy trình LẮP'],
        ['0', 'về trạng thái lắp hoàn chỉnh'],
        ['1 / 2', 'đổi chế độ Hoạt động / Tháo lắp'],
        ['X', 'chế độ X-quang'],
        ['C', 'ẩn/hiện nhóm ngữ cảnh'],
        ['H', 'canh lại khung nhìn'],
        ['F / S / T', 'nhìn từ trước / bên / trên'],
        ['Esc', 'bỏ chọn chi tiết'],
      ].map(([k, v]) => el('tr', {},
        el('td', { style: { width: '110px' } }, el('kbd', { text: k })),
        el('td', { text: v }))))),
      el('p', { html: 'Bấm vào bất kỳ chi tiết trong khung 3D để xem vật liệu, thông số, '
        + 'chức năng và hư hỏng thường gặp của nó.' }),
    ),
  ),
));

// ── Thông số xe mẫu ──────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'sect' },
  el('h2', { text: 'Xe mẫu' }),
  el('p', { class: 'sub', text: MACHINE.name }),
  el('table', { class: 'spec' }, el('tbody', {}, ...MACHINE.specs.map(([k, v]) =>
    el('tr', {}, el('td', { style: { width: '34%' }, text: k }), el('td', { class: 'mono', text: v }))))),
));

// ── Kiến trúc code ───────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'sect' },
  el('h2', { text: 'Kiến trúc code' }),
  el('p', { class: 'sub', text: 'Thêm một hệ thống 3D mới = viết 4 file trong một folder. Engine dùng lại nguyên vẹn.' }),
  el('div', { class: 'two' },
    el('div', {},
      el('h3', { text: 'Lớp dùng chung' }),
      el('table', { class: 'spec' }, el('tbody', {}, ...[
        ['src/lib/geom.js', 'Thư viện hình học tham số: lathe, extrude, bánh răng, nhông, lò xo, vấu cam, then hoa, trống số có rãnh xoắn, đường chạy xích'],
        ['src/core/viewer.js', 'Scene Three.js: ánh sáng, env map, camera, raycast chọn chi tiết'],
        ['src/core/assembly.js', 'Engine lắp/tháo: Part, Step, timeline, Player chạy tiến/lùi'],
        ['src/core/materials.js', 'Bảng vật liệu (nhôm đúc, gang, thép tôi, đồng thanh, cao su...)'],
        ['src/core/system-page.js', 'Toàn bộ UI trang 3D'],
        ['src/core/doc-page.js', 'Toàn bộ UI trang tài liệu'],
      ].map(([k, v]) => el('tr', {}, el('td', { class: 'mono', style: { width: '42%' }, text: k }), el('td', { text: v }))))),
    ),
    el('div', {},
      el('h3', { text: 'Một hệ thống' }),
      el('table', { class: 'spec' }, el('tbody', {}, ...[
        ['layout.js', 'TẤT CẢ kích thước + công thức suy diễn (tỉ số đòn, pha phối khí, vị trí piston, biên dạng rãnh trống số)'],
        ['parts.js', 'Hàm build() của từng chi tiết + thông tin vật liệu / chức năng / hư hỏng'],
        ['steps.js', 'Quy trình tháo lắp: title, detail, dụng cụ, lực siết, cảnh báo, vector di chuyển'],
        ['kinematics.js', 'Cơ cấu chạy theo một biến đầu vào — giao diện duy nhất là drive(angle, dt)'],
        ['index.js', 'Gộp lại + panel điều khiển riêng + các phép kiểm kỹ thuật'],
      ].map(([k, v]) => el('tr', {}, el('td', { class: 'mono', style: { width: '32%' }, text: k }), el('td', { text: v }))))),
      el('p', { html: '<b>Nguyên tắc quan trọng nhất:</b> hình học và animation phải dùng chung một '
        + 'hàm. Vấu cam dùng <code>camRadius()</code> để vẽ biên dạng, và độ nâng xupap '
        + 'cũng tính từ <code>camRadius()</code>. Rãnh xoắn trên trống số được <b>sinh ra</b> từ '
        + 'chính bảng vị trí cấp số. Nên không thể có chuyện "hình một dạng, số một dạng".' }),
    ),
  ),
));

// ── Kiểm tra headless ────────────────────────────────────────────────────────
wrap.append(el('div', { class: 'sect' },
  el('h2', { text: 'npm run verify — kiểm tra headless' }),
  el('p', { class: 'sub', text: 'Chạy được mà không cần browser. Kiểm những thứ không thể nhìn bằng mắt.' }),
  el('table', { class: 'spec' }, el('tbody', {}, ...[
    ['[1] Dựng hình học', 'mọi build() chạy được, không NaN, không geometry rỗng, hộp bao hợp lý, đếm tam giác'],
    ['[2] Quy trình tháo lắp', 'mọi bước tham chiếu chi tiết tồn tại; mọi chi tiết cần tháo đều có bước tháo'],
    ['[3] Cơ cấu hoạt động', 'quét toàn bộ biến điều khiển, dò NaN ở mọi giá trị trong state'],
    ['[4] Kiểm tra kỹ thuật', 'các bất biến riêng của từng hệ thống — khai báo trong index.js'],
  ].map(([k, v]) => el('tr', {}, el('td', { class: 'mono', style: { width: '30%' }, text: k }), el('td', { text: v }))))),
  el('p', { html: 'Ví dụ hệ thống 05 kiểm 12 điều kiện, trong đó có: <i>tổng răng mỗi cặp bằng nhau</i> '
    + '(điều kiện bắt buộc của hộp số ăn khớp thường xuyên), <i>ở mo vấu cài then chưa ăn vào lỗ</i>, '
    + '<i>không bao giờ ăn 2 số cùng lúc</i>, và <i>chốt càng cua luôn nằm đúng trong rãnh trống</i>.' }),
));

wrap.append(el('div', { class: 'banner', style: { marginTop: '34px', maxWidth: '900px' } },
  el('span', { text: '!' }),
  el('div', { html: `<b>Lưu ý số liệu.</b> ${SPEC_DISCLAIMER}` })));
