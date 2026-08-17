/**
 * system-page.js — Bootstrap dùng chung cho MỌI trang hệ thống dạng 3D.
 *
 * Một module hệ thống chỉ cần xuất: { mode:'3d', parts, steps, createKinematics,
 * opsPanel, labels, intro, symptoms, frameDir, contextCategory, initialDrive }.
 * Toàn bộ UI, timeline, chọn chi tiết, bàn phím... nằm ở đây.
 *
 * Giao diện với kinematics là DUY NHẤT một hàm: `kin.drive(angleDeg, dt)`.
 * Hệ thống 01 dùng nó làm góc trục khuỷu, hệ thống 05 dùng làm góc trục sơ cấp.
 */

import * as THREE from 'three';
import { Viewer } from './viewer.js';
import { Assembly, Player } from './assembly.js';
import { setHighlight, setXray } from './materials.js';
import { el, panel, TopBar, StepList, PartList, InfoCard, Timeline } from './ui.js';
import { LabelLayer } from './labels.js';
import { SYSTEMS, bySlug, SPEC_DISCLAIMER } from '../systems/registry.js';

export function mountSystemPage(sys) {
  const meta = bySlug(sys.slug);
  document.title = `${meta.ix}. ${meta.name} — MOTOR3D`;

  // ── Khung DOM ──────────────────────────────────────────────────────────────
  const app = el('div', { class: 'app' });
  document.body.append(app);
  TopBar(app, { title: meta.name, subtitle: meta.nameEn, systems: SYSTEMS, current: meta.slug });

  const left = panel('left', 'Quy trình tháo lắp');
  const right = panel('right', 'Danh mục chi tiết');
  const stage = el('div', { class: 'stage' });
  app.append(el('div', { class: 'workspace' }, left.root, stage, right.root));

  const opsBox = el('div', { class: 'panel-body', style: { display: 'none' } });
  left.root.append(opsBox);

  const info = InfoCard(right.root);

  // ── 3D ─────────────────────────────────────────────────────────────────────
  const viewer = new Viewer(stage);
  const asm = new Assembly();
  asm.addParts(sys.parts);
  asm.setSteps(sys.steps);
  viewer.root.add(asm.group);

  const kin = sys.createKinematics(asm);
  const player = new Player(asm, { stepDuration: 1.15, dwell: 0.7 });
  const labels = LabelLayer(stage, viewer);

  // ── Trạng thái ─────────────────────────────────────────────────────────────
  const S = {
    mode: 'ops',            // 'ops' | 'disasm'
    drive: sys.initialDrive ?? 0,
    rpm: sys.initialRpm ?? 40,
    playing: true,
    xray: false,
    showCtx: true,
    picked: null,
  };

  const api = {
    get crank() { return S.drive; },
    get drive() { return S.drive; },
    get rpm() { return S.rpm; },
    get playing() { return S.playing; },
    setCrank(v) { api.setDrive(v); },
    setDrive(v) { S.drive = v; kin.drive(S.drive, 0); },
    setRpm(v) { S.rpm = v; },
    setPlaying(v) { S.playing = v; },
  };

  // ── Panel chế độ Hoạt động ─────────────────────────────────────────────────
  const ops = sys.opsPanel(opsBox, kin, api);

  // ── Panel chế độ Tháo lắp ──────────────────────────────────────────────────
  if (sys.intro) {
    left.body.append(el('details', { open: true, style: { marginBottom: '12px' } },
      el('summary', { class: 'foldhead', text: sys.intro.title }),
      el('div', { class: 'note', html: sys.intro.html, style: { marginTop: '8px' } }),
    ));
  }
  const stepList = StepList(left.body, asm, (n) => { player.pause(); gotoStep(n); });

  if (sys.symptoms?.length) {
    left.body.append(el('details', { style: { marginTop: '14px' } },
      el('summary', { class: 'foldhead', text: 'Chẩn đoán từ hiện tượng' }),
      el('div', { class: 'diag' }, ...sys.symptoms.map((s) => el('div', { class: 'dg' },
        el('div', { class: 'sg', text: s.sign }),
        el('div', { class: 'cs', html: `<b>Nguyên nhân:</b> ${s.cause}` }),
        el('div', { class: 'fx', html: `<b>Xử lý:</b> ${s.fix}` }),
      ))),
    ));
  }

  left.body.append(el('div', { class: 'note warn', html: `<b>Lưu ý số liệu.</b> ${SPEC_DISCLAIMER}`,
    style: { marginTop: '14px' } }));

  // ── Danh mục chi tiết ──────────────────────────────────────────────────────
  const partList = PartList(right.body, asm, { onPick: pick });
  right.head.append(el('span', { class: 'tag qty', text: `${asm.parts.size} mục` }));

  // ── Nhãn 3D ────────────────────────────────────────────────────────────────
  const labelItems = sys.labels?.(asm, kin) ?? [];
  const labelNodes = labelItems.map((d) => labels.add(
    d.pos,
    typeof d.text === 'function' ? d.text() : d.text,
    { accent: typeof d.accent === 'function' ? d.accent() : d.accent },
  ).node);

  function updateLabels() {
    labelItems.forEach((d, i) => {
      const node = labelNodes[i];
      if (typeof d.text === 'function') node.textContent = d.text();
      if (typeof d.accent === 'function') node.classList.toggle('acc', !!d.accent());
    });
  }

  // ── Chế độ ─────────────────────────────────────────────────────────────────
  const modeBtn = (label, mode, title) =>
    el('button', { 'data-mode': mode, title, text: label, onclick: () => setMode(mode) });
  const modebar = el('div', { class: 'modebar' },
    modeBtn('Hoạt động', 'ops', 'Xem cơ cấu chạy'),
    modeBtn('Tháo lắp', 'disasm', 'Xem quy trình tháo / lắp từng bước'),
  );
  stage.append(modebar);

  const timeline = Timeline(stage, asm, player, { onScrub: onStepChanged });

  function setMode(mode) {
    S.mode = mode;
    modebar.querySelectorAll('button').forEach((b) =>
      b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    const isOps = mode === 'ops';
    opsBox.style.display = isOps ? '' : 'none';
    left.body.style.display = isOps ? 'none' : '';
    left.head.firstChild.textContent = isOps ? 'Cơ cấu hoạt động' : 'Quy trình tháo lắp';
    timeline.root.style.display = isOps ? 'none' : '';
    labels.setVisible(isOps);
    if (isOps) {
      player.pause();
      asm.setProgress(0);
      setContext(true);
      applyOpsVisibility(true);
      S.playing = true;
    } else {
      S.playing = false;
      applyOpsVisibility(false);
      api.setDrive(sys.initialDrive ?? 0);
      setContext(false);
    }
    partList.syncChecks();
    viewer.frame(frameTarget(), { dir: sys.frameDir });
  }

  /**
   * Ở chế độ Hoạt động, cái gì che khuất cơ cấu thì phải bỏ đi — nếu không thì
   * chỉ thấy một khối nhôm kín. `opsHidden` ẩn hẳn, `opsGhost` làm trong suốt.
   */
  function applyOpsVisibility(isOps) {
    for (const id of sys.opsHidden ?? []) {
      if (asm.parts.has(id)) asm.setVisible(id, !isOps);
    }
    for (const id of sys.opsGhost ?? []) {
      if (asm.parts.has(id)) setXray(asm.part(id).object, isOps, 0.09);
    }
  }

  function setContext(on) {
    S.showCtx = on;
    if (sys.contextCategory) asm.setCategoryVisible(sys.contextCategory, on);
    partList.syncChecks();
    ctxBtn.setAttribute('aria-pressed', String(on));
  }

  /**
   * Object3D tạm để canh camera. Bỏ qua các chi tiết RẤT DÀI (dây cam, lưới căng,
   * piston, trục khuỷu) — nếu tính cả chúng thì khung nhìn bị kéo rộng ra và
   * cụm chi tiết cần xem thành bé tí.
   */
  function frameTarget() {
    const g = new THREE.Group();
    const ex = new Set(sys.frameExclude ?? []);
    for (const p of asm.parts.values()) if (!ex.has(p.id) && p.visible) g.add(p.object.clone());
    return g.children.length ? g : asm.group;
  }

  // ── Nút trên stage ─────────────────────────────────────────────────────────
  const ib = (label, title, onclick, pressed) =>
    el('button', { class: 'iconbtn', title, text: label, onclick,
      'aria-pressed': pressed === undefined ? null : String(pressed) });
  const xrayBtn = ib('◍', 'Chế độ X-quang (X)', () => toggleXray());
  const ctxBtn = ib('◐', 'Ẩn/hiện nhóm ngữ cảnh (C)', () => setContext(!S.showCtx), true);
  stage.append(el('div', { class: 'viewbtns' },
    ib('⌂', 'Canh lại khung nhìn (H)', () => viewer.frame(frameTarget(), { dir: sys.frameDir })),
    ib('F', 'Nhìn từ trước xe', () => viewer.lookFrom([0, 0.12, -1])),
    ib('S', 'Nhìn từ bên phải', () => viewer.lookFrom([1, 0.12, 0])),
    ib('T', 'Nhìn từ trên xuống', () => viewer.lookFrom([0.001, 1, 0.001])),
    xrayBtn, ctxBtn,
  ));

  function toggleXray() {
    S.xray = !S.xray;
    for (const p of asm.parts.values()) {
      if (S.picked && p.id === S.picked) continue;
      setXray(p.object, S.xray);
    }
    xrayBtn.setAttribute('aria-pressed', String(S.xray));
  }

  // ── Chọn chi tiết ──────────────────────────────────────────────────────────
  function pick(id) {
    if (S.picked) setHighlight(asm.part(S.picked).object, false);
    S.picked = id;
    if (id) {
      setHighlight(asm.part(id).object, true);
      info.show(asm.part(id));
      partList.highlight(id);
    } else {
      info.show(null);
      partList.highlight(null);
    }
  }

  let downAt = null;
  viewer.renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  viewer.renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) return;
    const hit = viewer.pick(e);
    pick(hit ? hit.partId : null);
  });

  // ── Điều hướng bước ────────────────────────────────────────────────────────
  function gotoStep(n) {
    if (S.mode !== 'disasm') setMode('disasm');
    asm.setProgress(n);
    onStepChanged();
  }

  function onStepChanged() {
    const n = asm.activeStep;
    const step = asm.steps[n - 1];
    for (const p of asm.parts.values()) {
      if (p.id !== S.picked) setHighlight(p.object, false);
    }
    if (step) {
      for (const p of asm.partsOfStep(n)) setHighlight(p.object, true);
      // Một số bước cần đặt cơ cấu về đúng trạng thái (vd đưa piston về ĐCT)
      if (step.crank !== undefined) api.setDrive(step.crank);
      if (step.gear !== undefined && kin.jumpToGear) kin.jumpToGear(step.gear);
      if (step.focus && asm.parts.has(step.focus)) {
        const g = new THREE.Group();
        g.add(asm.part(step.focus).object.clone());
        viewer.frame(g, { padding: 2.0, minRadius: 58, dir: step.view ?? sys.frameDir });
      }
    }
  }
  player.onStepReached(() => onStepChanged());

  // ── Bàn phím ───────────────────────────────────────────────────────────────
  addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') {
      e.preventDefault();
      S.mode === 'ops' ? api.setPlaying(!S.playing) : player.toggle(1);
    } else if (S.mode === 'disasm' && (k === 'arrowright' || k === 'd')) { e.preventDefault(); player.next(); }
    else if (S.mode === 'disasm' && (k === 'arrowleft' || k === 'a')) { e.preventDefault(); player.prev(); }
    else if (S.mode === 'ops' && k === 'arrowright') { api.setPlaying(false); api.setDrive(S.drive + 5); }
    else if (S.mode === 'ops' && k === 'arrowleft') { api.setPlaying(false); api.setDrive(S.drive - 5); }
    else if (k === 'r') player.play(-1);
    else if (k === '0') { player.pause(); asm.setProgress(0); }
    else if (k === 'x') toggleXray();
    else if (k === 'c') setContext(!S.showCtx);
    else if (k === 'h') viewer.frame(frameTarget(), { dir: sys.frameDir });
    else if (k === 'escape') pick(null);
    else if (k === '1') setMode('ops');
    else if (k === '2') setMode('disasm');
  });

  // ── Vòng lặp ───────────────────────────────────────────────────────────────
  asm.onChange(() => stepList.update());

  viewer.onFrame((dt) => {
    if (S.mode === 'ops') {
      if (S.playing) S.drive += S.rpm * 6 * dt;
      kin.drive(S.drive, dt);
      ops.update();
      updateLabels();
      labels.update();
    } else {
      player.update(dt);
      timeline.update();
    }
  });

  // ── Khởi động ──────────────────────────────────────────────────────────────
  // Phải chạy kinematics một lần trước khi vẽ: các InstancedMesh (dây cam) có
  // instanceMatrix mặc định bằng 0 nên sẽ vô hình cho đến lúc được set.
  api.setDrive(S.drive);
  setMode('ops');
  viewer.frame(frameTarget(), { dir: sys.frameDir, animate: false });
  return { viewer, asm, player, kin, api };
}
