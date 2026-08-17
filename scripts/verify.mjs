/**
 * verify.mjs — Kiểm tra mô hình HEADLESS (không cần browser).
 *
 * Chạy:  npm run verify              (kiểm tra tất cả hệ thống có 3D)
 *        npm run verify -- gearbox
 *
 * Kiểm những thứ không thể nhìn bằng mắt:
 *   [1] mọi build() chạy được, không sinh NaN, không sinh geometry rỗng
 *   [2] mọi bước tham chiếu chi tiết tồn tại; mọi chi tiết cần tháo đều có bước
 *   [3] quét toàn bộ biến điều khiển: không NaN ở bất kỳ giá trị nào trong state
 *   [4] các phép kiểm KỸ THUẬT riêng của từng hệ thống (khai báo trong index.js)
 */

import * as THREE from 'three';
import { Assembly } from '../src/core/assembly.js';
import { SYSTEMS } from '../src/systems/registry.js';

const only = process.argv[2];
const targets = SYSTEMS.filter((s) => s.status === '3d' && (!only || s.slug === only));
if (!targets.length) {
  console.error(`Không có hệ thống 3D nào khớp "${only ?? ''}"`);
  process.exit(1);
}

let failures = 0;
const fail = (msg) => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m ${msg}`); };
const ok = (msg) => console.log(`  \x1b[32mok\x1b[0m   ${msg}`);
const warn = (msg) => console.log(`  \x1b[33mchú ý\x1b[0m ${msg}`);
const num = (v, w = 7, d = 1) => v.toFixed(d).padStart(w);

/** Đi khắp các giá trị số trong một object lồng nhau. */
function* numbers(obj, path = '') {
  if (typeof obj === 'number') { yield [path, obj]; return; }
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) yield* numbers(v, path ? `${path}.${k}` : k);
}

for (const meta of targets) {
  console.log(`\n\x1b[1m${meta.ix}. ${meta.name}\x1b[0m  (${meta.slug})`);
  const sys = (await import(`../src/systems/${meta.slug}/index.js`)).default;

  // ── 1. Dựng chi tiết ───────────────────────────────────────────────────────
  console.log('\n  [1] Dựng hình học');
  const asm = new Assembly();
  let tris = 0;
  const boxes = new Map();
  for (const def of sys.parts) {
    try {
      const part = asm.addPart(def);
      let n = 0;
      part.object.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry;
        const pos = g.attributes.position;
        if (!pos || pos.count === 0) throw new Error('geometry rỗng');
        for (let i = 0; i < pos.array.length; i++) {
          if (!Number.isFinite(pos.array[i])) throw new Error(`NaN ở position[${i}]`);
        }
        n += ((g.index ? g.index.count : pos.count) / 3) * (o.isInstancedMesh ? o.count : 1);
      });
      tris += n;
      const box = new THREE.Box3().setFromObject(part.object);
      boxes.set(def.id, box);
      const sz = box.getSize(new THREE.Vector3());
      if (sz.length() > 900) throw new Error(`hộp bao quá lớn: ${sz.toArray().map((v) => v.toFixed(0))}`);
      console.log(`       ${def.id.padEnd(17)} ${String(Math.round(n)).padStart(7)} tri  `
        + `x[${num(box.min.x)},${num(box.max.x)}] `
        + `y[${num(box.min.y)},${num(box.max.y)}] `
        + `z[${num(box.min.z)},${num(box.max.z)}]`);
    } catch (e) {
      fail(`build("${def.id}"): ${e.message}`);
    }
  }
  ok(`${asm.parts.size} chi tiết · ${Math.round(tris).toLocaleString('en')} tam giác`);
  if (tris > 1_600_000) fail(`quá nhiều tam giác (${Math.round(tris)}) — sẽ giật trên máy yếu`);

  // ── 2. Quy trình tháo lắp ──────────────────────────────────────────────────
  console.log('\n  [2] Quy trình tháo lắp');
  try {
    asm.setSteps(sys.steps);
    ok(`${asm.stepCount} bước, mọi bước tham chiếu chi tiết tồn tại`);
  } catch (e) { fail(e.message); }

  // `stays: true` = chi tiết có thật trong hệ thống nhưng KHÔNG tháo trong phạm vi
  // công việc này (vd làm đầu bò thì dây cam chỉ treo lại, không tháo ra).
  const orphan = [...asm.parts.values()]
    .filter((p) => p.category !== sys.contextCategory && !p.stays && !p.removedAt);
  if (orphan.length) fail(`không được tháo ở bước nào: ${orphan.map((p) => p.id).join(', ')}`);
  else ok('mọi chi tiết cần tháo đều có bước tháo');
  const stays = [...asm.parts.values()].filter((p) => p.stays);
  if (stays.length) ok(`không tháo trong phạm vi công việc này: ${stays.map((p) => p.id).join(', ')}`);

  const noStep = asm.steps.filter((s) => !s.moves.length).map((s) => s.n);
  if (noStep.length) ok(`bước không di chuyển chi tiết (có ý — chỉ thao tác): ${noStep.join(', ')}`);

  asm.setProgress(asm.stepCount);
  let stuck = 0;
  for (const p of asm.parts.values()) {
    if (p.category === sys.contextCategory || !p.removedAt) continue;
    const b0 = boxes.get(p.id);
    const b1 = new THREE.Box3().setFromObject(p.object);
    if (b0 && b1.getCenter(new THREE.Vector3()).distanceTo(b0.getCenter(new THREE.Vector3())) < 12) {
      warn(`${p.id} gần như không di chuyển khi tháo hết`);
      stuck++;
    }
  }
  if (!stuck) ok('mọi chi tiết dịch rõ ràng khi tháo hết');
  asm.setProgress(0);

  // ── 3. Cơ cấu hoạt động ────────────────────────────────────────────────────
  const kin = sys.createKinematics ? sys.createKinematics(asm) : null;
  if (kin) {
    const range = sys.driveRange ?? 720;
    console.log(`\n  [3] Cơ cấu hoạt động (quét ${range}° biến điều khiển)`);
    let nan = null;
    const peak = new Map();
    for (let a = 0; a < range; a += 0.5) {
      kin.drive(a, 1 / 60);
      for (const [path, v] of numbers(kin.state)) {
        if (!Number.isFinite(v)) nan ??= `${path} tại ${a}°`;
        const p = peak.get(path);
        if (!p) peak.set(path, [v, v]);
        else { p[0] = Math.min(p[0], v); p[1] = Math.max(p[1], v); }
      }
    }
    if (nan) fail(`sinh NaN: ${nan}`); else ok('không sinh NaN trong cả vòng quét');
    for (const [path, [lo, hi]] of peak) {
      if (lo === hi) continue;
      console.log(`       ${path.padEnd(22)} [${num(lo, 9, 3)} .. ${num(hi, 9, 3)}]`);
    }
  }

  // ── 4. Kiểm tra kỹ thuật riêng của hệ thống ────────────────────────────────
  if (sys.checks?.length) {
    console.log('\n  [4] Kiểm tra kỹ thuật');
    for (const c of sys.checks) {
      let r;
      try { r = c.run(asm, kin); } catch (e) { r = { pass: false, msg: `lỗi khi chạy: ${e.message}` }; }
      const line = `${c.name}${r.msg ? ` — ${r.msg}` : ''}`;
      if (r.pass === false) fail(line);
      else if (r.warn) warn(line);
      else ok(line);
    }
  }
}

console.log(failures
  ? `\n\x1b[31m${failures} lỗi\x1b[0m\n`
  : '\n\x1b[32mTất cả kiểm tra đạt.\x1b[0m\n');
process.exit(failures ? 1 : 0);
