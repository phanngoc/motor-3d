/**
 * assembly.js — Engine lắp/tháo.
 *
 * Mô hình dữ liệu:
 *   PartDef  { id, name, nameEn, qty, category, mat, pivot, info, build(ctx) }
 *   Step     { title, detail, tool, torque, warn, tip, moves[], focus, view }
 *   Move     { part, d:[dx,dy,dz], rot:[rx,ry,rz] (độ), pivot? }
 *
 * Hình học của mỗi chi tiết được "nướng" sẵn ở toạ độ lắp đặt (world coords).
 * Khi cần quay trong lúc tháo (vd vặn bu lông ra), khai báo `pivot` của chi tiết:
 * engine sẽ bọc chi tiết trong một Group đặt tại pivot và dịch con vào -pivot,
 * nhờ vậy `rot` quay quanh đúng trục của chi tiết chứ không quanh gốc toạ độ.
 */

import * as THREE from 'three';
import { clamp, deg } from '../lib/geom.js';

export class Assembly {
  constructor(ctx = {}) {
    this.ctx = ctx;
    this.group = new THREE.Group();
    this.parts = new Map();      // id -> Part
    this.steps = [];
    this.progress = 0;
    this._listeners = new Set();
  }

  /** @param {object} def PartDef */
  addPart(def) {
    if (this.parts.has(def.id)) throw new Error(`Trùng id chi tiết: ${def.id}`);
    const pivot = def.pivot ?? [0, 0, 0];
    const inner = def.build(this.ctx);
    if (!inner) throw new Error(`build() của "${def.id}" không trả về Object3D`);
    inner.position.set(-pivot[0], -pivot[1], -pivot[2]);

    const holder = new THREE.Group();
    holder.name = def.id;
    holder.position.set(pivot[0], pivot[1], pivot[2]);
    holder.add(inner);
    holder.userData.partId = def.id;

    const part = {
      ...def,
      pivot,
      object: holder,
      inner,
      /** Các transform do cơ cấu (kinematics) tạo ra, cộng thêm vào transform tháo lắp. */
      kin: { pos: new THREE.Vector3(), rot: new THREE.Euler() },
      removedAt: null,     // set bởi setSteps()
      visible: true,
    };
    this.parts.set(def.id, part);
    this.group.add(holder);
    return part;
  }

  addParts(defs) { return defs.map((d) => this.addPart(d)); }

  setSteps(steps) {
    this.steps = steps.map((s, i) => ({ n: i + 1, moves: [], ...s }));
    for (const p of this.parts.values()) p.removedAt = null;
    // removedAt = bước CUỐI CÙNG làm chi tiết dịch chuyển, tức là lúc nó thực sự
    // rời ra khỏi máy (vd xupap dịch cùng đầu bò ở bước 13 nhưng chỉ rời hẳn ở bước 17).
    this.steps.forEach((s) => {
      for (const m of s.moves) {
        const p = this.parts.get(m.part);
        if (!p) throw new Error(`Bước ${s.n} tham chiếu chi tiết không tồn tại: "${m.part}"`);
        p.removedAt = s.n;
      }
    });
    this.setProgress(this.progress);
  }

  get stepCount() { return this.steps.length; }

  /** Bước đang thực hiện (1-based). 0 = còn nguyên chưa tháo. */
  get activeStep() { return this.progress <= 0 ? 0 : Math.min(this.stepCount, Math.ceil(this.progress)); }

  /** Số bước đã hoàn tất. */
  get doneSteps() { return Math.floor(this.progress + 1e-6); }

  onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }

  setProgress(p) {
    this.progress = clamp(p, 0, this.stepCount);
    this._apply();
    for (const fn of this._listeners) fn(this);
  }

  /** Nhảy tới bước n (1-based). n=0 = trạng thái lắp hoàn chỉnh. */
  goToStep(n) { this.setProgress(clamp(n, 0, this.stepCount)); }

  _apply() {
    const acc = new Map(); // id -> {d:Vector3, r:Vector3}
    for (let i = 0; i < this.steps.length; i++) {
      const w = clamp(this.progress - i, 0, 1);
      if (w <= 0) break;
      const e = easeInOut(w);
      for (const m of this.steps[i].moves) {
        let a = acc.get(m.part);
        if (!a) { a = { d: new THREE.Vector3(), r: new THREE.Vector3() }; acc.set(m.part, a); }
        if (m.d) a.d.add(new THREE.Vector3(...m.d).multiplyScalar(e));
        if (m.rot) a.r.add(new THREE.Vector3(...m.rot.map(deg)).multiplyScalar(e));
      }
    }
    for (const part of this.parts.values()) {
      const a = acc.get(part.id);
      const o = part.object;
      o.position.set(
        part.pivot[0] + (a ? a.d.x : 0) + part.kin.pos.x,
        part.pivot[1] + (a ? a.d.y : 0) + part.kin.pos.y,
        part.pivot[2] + (a ? a.d.z : 0) + part.kin.pos.z,
      );
      o.rotation.set(
        (a ? a.r.x : 0) + part.kin.rot.x,
        (a ? a.r.y : 0) + part.kin.rot.y,
        (a ? a.r.z : 0) + part.kin.rot.z,
      );
    }
  }

  /** Áp lại transform (gọi sau khi kinematics đổi part.kin). */
  refresh() { this._apply(); }

  /** Đặt lại kin về 0 cho mọi chi tiết (khi tắt chế độ hoạt động). */
  resetKinematics() {
    for (const p of this.parts.values()) { p.kin.pos.set(0, 0, 0); p.kin.rot.set(0, 0, 0); }
    this._apply();
  }

  part(id) {
    const p = this.parts.get(id);
    if (!p) throw new Error(`Không có chi tiết "${id}"`);
    return p;
  }

  setVisible(id, v) {
    const p = this.part(id);
    p.visible = v;
    p.object.visible = v;
  }

  setCategoryVisible(cat, v) {
    for (const p of this.parts.values()) if (p.category === cat) this.setVisible(p.id, v);
  }

  categories() {
    const seen = [];
    for (const p of this.parts.values()) if (!seen.includes(p.category)) seen.push(p.category);
    return seen;
  }

  /** Các chi tiết bị tác động bởi bước n. */
  partsOfStep(n) {
    const s = this.steps[n - 1];
    if (!s) return [];
    return [...new Set(s.moves.map((m) => m.part))].map((id) => this.parts.get(id));
  }

  /** Tâm bao của các chi tiết trong bước n (để lia camera). */
  stepCenter(n) {
    const ps = this.partsOfStep(n);
    if (!ps.length) return null;
    const box = new THREE.Box3();
    for (const p of ps) box.expandByObject(p.object);
    return box.isEmpty() ? null : box;
  }
}

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * Bộ phát timeline: chạy tiến (tháo) hoặc lùi (lắp), dừng lại ở mỗi bước.
 */
export class Player {
  constructor(assembly, { stepDuration = 1.25, dwell = 0.85 } = {}) {
    this.asm = assembly;
    this.stepDuration = stepDuration;
    this.dwell = dwell;
    this.dir = 0;          // 0 dừng, +1 tháo, -1 lắp
    this._dwellLeft = 0;
    this.autoPause = true; // dừng lại sau mỗi bước
    this._onStep = null;
  }

  onStepReached(fn) { this._onStep = fn; }

  play(dir = 1) { this.dir = dir; this._dwellLeft = 0; }
  pause() { this.dir = 0; this._dwellLeft = 0; }
  toggle(dir = 1) { this.dir === 0 ? this.play(dir) : this.pause(); }
  get playing() { return this.dir !== 0; }

  next() {
    const t = Math.min(this.asm.stepCount, Math.floor(this.asm.progress + 1e-6) + 1);
    this._animateTo(t);
  }
  prev() {
    const t = Math.max(0, Math.ceil(this.asm.progress - 1e-6) - 1);
    this._animateTo(t);
  }

  _animateTo(target) {
    this._target = target;
    this.dir = Math.sign(target - this.asm.progress) || 0;
    this._dwellLeft = 0;
  }

  update(dt) {
    if (this.dir === 0) return;
    if (this._dwellLeft > 0) { this._dwellLeft -= dt; return; }
    const step = (dt / this.stepDuration) * this.dir;
    let p = this.asm.progress + step;

    if (this._target !== undefined && this._target !== null) {
      if ((this.dir > 0 && p >= this._target) || (this.dir < 0 && p <= this._target)) {
        p = this._target; this.dir = 0; this._target = null;
        this.asm.setProgress(p);
        this._onStep?.(this.asm.activeStep);
        return;
      }
    } else {
      // vượt qua một mốc bước -> nghỉ một nhịp
      const crossed = this.dir > 0
        ? Math.floor(p + 1e-6) > Math.floor(this.asm.progress + 1e-6)
        : Math.ceil(p - 1e-6) < Math.ceil(this.asm.progress - 1e-6);
      if (crossed) {
        p = this.dir > 0 ? Math.floor(p + 1e-6) : Math.ceil(p - 1e-6);
        this._dwellLeft = this.dwell;
        this.asm.setProgress(p);
        this._onStep?.(this.asm.activeStep);
        if (p <= 0 || p >= this.asm.stepCount) this.dir = 0;
        return;
      }
    }
    if (p <= 0) { p = 0; this.dir = 0; }
    if (p >= this.asm.stepCount) { p = this.asm.stepCount; this.dir = 0; }
    this.asm.setProgress(p);
  }
}
