/**
 * doc-page.js — Trang hệ thống ở dạng TÀI LIỆU (chưa dựng 3D).
 *
 * Cùng một cấu trúc dữ liệu với trang 3D: `parts` và `steps` có thể copy nguyên
 * sang parts.js / steps.js khi dựng hình học. Nhờ vậy nội dung viết ở đây không
 * bị bỏ đi khi nâng cấp lên 3D.
 */

import { el, stepTags, TopBar } from './ui.js';
import { SYSTEMS, bySlug, SPEC_DISCLAIMER, MACHINE } from '../systems/registry.js';

export function mountDocPage(sys) {
  const meta = bySlug(sys.slug);
  document.title = `${meta.ix}. ${meta.name} — MOTOR3D`;
  const d = sys.doc;

  TopBar(document.body, {
    title: meta.name, subtitle: meta.nameEn, systems: SYSTEMS, current: meta.slug,
  });

  const wrap = el('div', { class: 'docpage' });
  document.body.append(wrap);

  wrap.append(el('div', { class: 'banner' },
    el('span', { text: '◐' }),
    el('div', {}, el('div', { html: `<b>Trang này đang ở chế độ tài liệu.</b> `
      + `Lý thuyết, danh mục chi tiết và quy trình tháo lắp đã đầy đủ; `
      + `mô hình 3D + animation chưa dựng.` }),
    el('div', { style: { marginTop: '5px', fontSize: '11.5px', opacity: 0.85 },
      html: `Để nâng trang này thành trang 3D: thêm <code>parts.js</code> + `
        + `<code>steps.js</code> + <code>kinematics.js</code> vào `
        + `<code>src/systems/${meta.slug}/</code> rồi đổi <code>mode</code> `
        + `thành <code>'3d'</code> trong <code>index.js</code>. `
        + `Engine (timeline, chọn chi tiết, bàn phím) dùng lại được nguyên vẹn.` })),
  ));

  wrap.append(
    el('h1', { text: `${meta.ix}. ${meta.name}` }),
    el('p', { class: 'lead', text: d.lead }),
    el('div', { style: { marginTop: '10px' } }, ...meta.tags.map((t) => el('span', { class: 'pill', text: t }))),
  );

  // ── Lý thuyết ──────────────────────────────────────────────────────────────
  wrap.append(el('h2', { text: 'Nguyên lý và cách hoạt động' }));
  for (const s of d.theory) {
    wrap.append(el('h3', { text: s.h }));
    for (const p of s.p ?? []) wrap.append(el('p', { html: p }));
    if (s.ul) wrap.append(el('ul', {}, ...s.ul.map((li) => el('li', { html: li }))));
    if (s.ol) wrap.append(el('ol', {}, ...s.ol.map((li) => el('li', { html: li }))));
  }

  // ── Thông số ───────────────────────────────────────────────────────────────
  if (d.specs?.length) {
    wrap.append(el('h2', { text: 'Thông số chính' }));
    wrap.append(el('table', { class: 'spec' },
      el('tbody', {}, ...d.specs.map(([k, v]) =>
        el('tr', {}, el('td', { style: { width: '38%' }, text: k }), el('td', { class: 'mono', html: v })))),
    ));
  }

  // ── Danh mục chi tiết ──────────────────────────────────────────────────────
  wrap.append(el('h2', { text: `Danh mục chi tiết (${d.parts.length} mục)` }));
  wrap.append(el('div', { style: { overflowX: 'auto' } },
    el('table', { class: 'spec' },
      el('thead', {}, el('tr', {},
        el('th', { text: 'Chi tiết' }), el('th', { text: 'SL' }),
        el('th', { text: 'Vật liệu / thông số' }), el('th', { text: 'Chức năng · hư hỏng thường gặp' }))),
      el('tbody', {}, ...d.parts.map((p) => el('tr', {},
        el('td', {}, el('b', { text: p.name }), el('div', { style: { fontSize: '11px', color: 'var(--fg-3)', fontStyle: 'italic' }, text: p.nameEn })),
        el('td', { class: 'mono', text: p.qty ?? 1 }),
        el('td', { class: 'mono', html: [p.material, p.spec].filter(Boolean).join('<br>') }),
        el('td', { html: [p.fn, p.fail && `<span style="color:var(--warn)">⚠ ${p.fail}</span>`].filter(Boolean).join('<br>') }),
      ))),
    ),
  ));

  // ── Quy trình tháo lắp ─────────────────────────────────────────────────────
  wrap.append(el('h2', { text: `Quy trình tháo lắp (${d.steps.length} bước)` }));
  wrap.append(el('p', { html: 'Thứ tự <b>lắp lại</b> là thứ tự này đảo ngược, trừ các điểm đã ghi riêng.' }));
  const flow = el('div', { class: 'flow' });
  d.steps.forEach((s, i) => {
    flow.append(el('div', { class: 'fs' },
      el('div', { class: 'n', text: String(i + 1) }),
      el('div', {},
        el('div', { class: 't', text: s.title }),
        s.detail && el('div', { class: 'd', html: s.detail }),
        stepTags(s),
      ),
    ));
  });
  wrap.append(flow);

  // ── Chẩn đoán ──────────────────────────────────────────────────────────────
  if (d.symptoms?.length) {
    wrap.append(el('h2', { text: 'Chẩn đoán từ hiện tượng' }));
    wrap.append(el('div', { style: { overflowX: 'auto' } },
      el('table', { class: 'spec' },
        el('thead', {}, el('tr', {},
          el('th', { text: 'Hiện tượng' }), el('th', { text: 'Nguyên nhân khả năng cao' }),
          el('th', { text: 'Kiểm tra / xử lý' }))),
        el('tbody', {}, ...d.symptoms.map((s) => el('tr', {},
          el('td', {}, el('b', { text: s.sign })),
          el('td', { html: s.cause }),
          el('td', { html: s.fix }),
        ))),
      ),
    ));
  }

  // ── Liên quan ──────────────────────────────────────────────────────────────
  if (d.related?.length) {
    wrap.append(el('h2', { text: 'Hệ thống liên quan' }));
    wrap.append(el('ul', {}, ...d.related.map((slug) => {
      const m = bySlug(slug);
      return el('li', {}, el('a', { href: `./${slug}.html` }, `${m.ix}. ${m.name}`), ` — ${m.tagline}`);
    })));
  }

  wrap.append(el('div', { class: 'banner', style: { marginTop: '30px' } },
    el('span', { text: '!' }),
    el('div', { html: `<b>Lưu ý số liệu.</b> ${SPEC_DISCLAIMER}` })));

  wrap.append(el('p', { style: { marginTop: '24px', fontSize: '11.5px', color: 'var(--fg-3)' },
    text: `Xe mẫu: ${MACHINE.name}` }));
}
