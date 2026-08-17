/**
 * ui.js — Các thành phần DOM dùng chung cho trang hệ thống.
 * Không dùng framework: chỉ là hàm tạo element + hàm update().
 *
 * File này CỐ Ý không import Three.js, để các trang TÀI LIỆU (không có 3D)
 * không phải tải cả Three.js. Phần nhãn 3D nằm riêng ở labels.js.
 */

/** Tạo element gọn nhẹ. el('div', {class:'x', onclick}, ...children) */
export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const k of kids.flat()) {
    if (k === null || k === undefined || k === false) continue;
    n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return n;
}

const tag = (cls, txt) => (txt ? el('span', { class: `tag ${cls}` }, txt) : null);

/** Các chip metadata của một bước (dùng cho cả trang 3D và trang tài liệu). */
export function stepTags(s) {
  return el('div', { class: 'meta' },
    tag('tool', s.tool),
    tag('torque', s.torque),
    tag('warn', s.warn && `! ${s.warn}`),
    tag('tip', s.tip && `⚑ ${s.tip}`),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH SÁCH BƯỚC
// ─────────────────────────────────────────────────────────────────────────────

export function StepList(mount, asm, onPick) {
  const list = el('div', { class: 'steps' });
  const rows = asm.steps.map((s) => {
    const row = el('div', { class: 'step', 'data-n': s.n, onclick: () => onPick(s.n) },
      el('div', { class: 'num', text: String(s.n) }),
      el('div', {},
        el('div', { class: 't', text: s.title }),
        s.detail && el('div', { class: 'd', html: s.detail }),
        stepTags(s),
      ),
    );
    list.append(row);
    return row;
  });
  mount.append(list);

  let lastAct = -1;
  function update() {
    const act = asm.activeStep;
    const done = asm.doneSteps;
    rows.forEach((r, i) => {
      r.setAttribute('aria-current', String(i + 1 === act));
      r.dataset.done = String(i + 1 <= done);
    });
    // Chỉ cuộn khi bước đang chạy thực sự đổi — tránh scrollIntoView mỗi frame.
    if (act !== lastAct) {
      lastAct = act;
      const cur = rows[act - 1];
      if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  update();
  return { update };
}

// ─────────────────────────────────────────────────────────────────────────────
// DANH MỤC CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

export function PartList(mount, asm, { onPick, onToggle }) {
  const rows = new Map();
  for (const cat of asm.categories()) {
    const parts = [...asm.parts.values()].filter((p) => p.category === cat);
    const master = el('input', { type: 'checkbox', checked: true, title: 'Ẩn/hiện cả nhóm' });
    master.addEventListener('change', () => {
      for (const p of parts) {
        asm.setVisible(p.id, master.checked);
        rows.get(p.id).cb.checked = master.checked;
      }
      onToggle?.();
    });
    const group = el('div', { class: 'catgroup' },
      el('h4', {}, master, el('span', { class: 'grow', text: cat }),
        el('span', { style: { color: 'var(--fg-3)' }, text: String(parts.length) })),
    );
    const plist = el('div', { class: 'plist' });
    for (const p of parts) {
      const cb = el('input', { type: 'checkbox', checked: true });
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        asm.setVisible(p.id, cb.checked);
        onToggle?.();
      });
      const row = el('div', { class: 'pitem', onclick: (e) => { if (e.target !== cb) onPick(p.id); } },
        cb,
        el('span', { class: 'nm', text: p.name, title: `${p.name} — ${p.nameEn}` }),
        p.qty > 1 && el('span', { class: 'tag qty', text: `x${p.qty}` }),
        el('span', { class: 'st', text: p.removedAt ? `B${p.removedAt}` : '—' }),
      );
      plist.append(row);
      rows.set(p.id, { row, cb });
    }
    group.append(plist);
    mount.append(group);
  }

  function highlight(id) {
    for (const [pid, r] of rows) r.row.setAttribute('aria-current', String(pid === id));
    const r = rows.get(id);
    if (r) r.row.scrollIntoView({ block: 'nearest' });
  }

  /** Đồng bộ checkbox với trạng thái visible thực tế của Assembly. */
  function syncChecks() {
    for (const [id, r] of rows) r.cb.checked = asm.part(id).visible;
    for (const g of mount.querySelectorAll('.catgroup')) {
      const cbs = [...g.querySelectorAll('.pitem input')];
      const master = g.querySelector('h4 input');
      if (master) master.checked = cbs.length > 0 && cbs.every((c) => c.checked);
    }
  }

  return { highlight, rows, syncChecks };
}

// ─────────────────────────────────────────────────────────────────────────────
// THẺ THÔNG TIN CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────

export function InfoCard(mount) {
  const box = el('div', { class: 'infocard' });
  mount.append(box);
  function show(part) {
    box.replaceChildren();
    if (!part) {
      box.append(el('div', { class: 'empty',
        text: 'Bấm vào chi tiết trong khung 3D hoặc trong danh mục để xem thông số.' }));
      return;
    }
    const i = part.info ?? {};
    const dl = el('dl');
    const put = (k, v) => { if (v) { dl.append(el('dt', { text: k }), el('dd', { text: v })); } };
    put('Số lượng', part.qty > 1 ? `${part.qty} chiếc` : '1 chiếc');
    put('Vật liệu', i.material);
    put('Thông số', i.spec);
    put('Khe hở/dung sai', i.tolerance);
    put('Lực siết', i.torque);
    put('Tháo ở bước', part.removedAt ? `Bước ${part.removedAt}`
      : (part.stays ? 'Không tháo trong công việc này' : 'Không tháo (ngữ cảnh)'));
    box.append(
      el('div', { class: 'nm', text: part.name }),
      el('div', { class: 'en', text: part.nameEn }),
      dl,
      i.fn && el('div', { class: 'fn', html: `<b>Chức năng:</b> ${i.fn}` }),
      i.fail && el('div', { class: 'fn', html: `<b>Hư hỏng thường gặp:</b> ${i.fail}` }),
    );
  }
  show(null);
  return { show };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

export function Timeline(stage, asm, player, { onScrub } = {}) {
  const range = el('input', { type: 'range', min: 0, max: asm.stepCount, step: 0.001, value: 0 });
  const ticks = el('div', { class: 'ticks' });
  for (let i = 0; i <= asm.stepCount; i++) {
    ticks.append(el('i', { 'data-i': i, style: { left: `${(i / asm.stepCount) * 100}%` } }));
  }
  const count = el('div', { class: 'tlcount', text: `0 / ${asm.stepCount}` });
  const playBtn = el('button', { class: 'tlbtn primary', title: 'Chạy/dừng (Space)', text: '▶' });
  const prevBtn = el('button', { class: 'tlbtn', title: 'Bước trước (←)', text: '◀◀' });
  const nextBtn = el('button', { class: 'tlbtn', title: 'Bước sau (→)', text: '▶▶' });
  const revBtn = el('button', { class: 'tlbtn', title: 'Chạy ngược = xem quy trình LẮP (R)', text: '↺' });
  const homeBtn = el('button', { class: 'tlbtn', title: 'Về trạng thái lắp hoàn chỉnh (0)', text: '⏮' });

  const root = el('div', { class: 'timeline' },
    el('div', { class: 'row' },
      homeBtn, prevBtn, playBtn, nextBtn, revBtn,
      el('div', { class: 'scrub' }, range, ticks),
      count,
    ),
    el('div', { class: 'hint',
      text: 'Space chạy/dừng · ← → bước · R chạy ngược (lắp lại) · kéo chuột xoay · lăn để zoom' }),
  );
  stage.append(root);

  playBtn.onclick = () => player.toggle(1);
  revBtn.onclick = () => player.play(-1);
  nextBtn.onclick = () => player.next();
  prevBtn.onclick = () => player.prev();
  homeBtn.onclick = () => { player.pause(); asm.setProgress(0); };
  range.addEventListener('input', () => {
    player.pause();
    asm.setProgress(parseFloat(range.value));
    onScrub?.();
  });

  function update() {
    if (document.activeElement !== range) range.value = String(asm.progress);
    count.textContent = `${asm.doneSteps} / ${asm.stepCount}`;
    playBtn.textContent = player.dir > 0 ? '⏸' : '▶';
    const done = asm.doneSteps;
    ticks.querySelectorAll('i').forEach((t, i) => t.classList.toggle('done', i <= done));
  }
  update();
  return { update, root };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH TRANG
// ─────────────────────────────────────────────────────────────────────────────

/** Thanh trên cùng + dropdown chuyển hệ thống. */
export function TopBar(mount, { title, subtitle, systems, current }) {
  const sel = el('select', { class: 'syspick' });
  for (const s of systems) {
    sel.append(el('option', { value: s.slug, selected: s.slug === current }, `${s.ix}. ${s.name}`));
  }
  sel.addEventListener('change', () => { location.href = `./${sel.value}.html`; });
  mount.append(
    el('div', { class: 'topbar' },
      el('a', { class: 'brand', href: '../index.html' }, el('span', { html: '◆' }), 'MOTOR', el('b', { text: '3D' })),
      el('div', { class: 'sep' }),
      el('div', { class: 'title' }, title, subtitle && el('small', { text: subtitle })),
      el('div', { class: 'grow' }),
      el('span', { class: 'crumb', text: 'Hệ thống:' }),
      sel,
    ),
  );
}

export function panel(side, headerLabel, headerExtra) {
  const body = el('div', { class: 'panel-body' });
  const head = el('div', { class: 'panel-h' }, el('span', { class: 'grow', text: headerLabel }), headerExtra);
  const root = el('aside', { class: `panel ${side}` }, head, body);
  return { root, body, head };
}
