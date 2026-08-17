/**
 * kinematics.js — Chế độ "Hoạt động": chạy cơ cấu theo góc trục khuỷu.
 *
 * Chuỗi truyền động được tính đúng theo thứ tự vật lý:
 *   góc trục khuỷu θ
 *     -> góc trục cam φ = θ/2                       (tỉ số dây cam 2:1)
 *     -> độ nâng cam  h = camLift(φ − φ_đỉnh vấu)   (DÙNG CHUNG hàm với hình học vấu)
 *     -> góc lắc cò mổ ψ = ±asin(h / cạnh phía cam)
 *     -> độ nâng xupap = cạnh phía xupap · sin|ψ| − khe hở nhiệt
 *   Nhờ vậy hình học và animation không bao giờ lệch nhau.
 */

import * as THREE from 'three';
import { camLift, deg, clamp } from '../../lib/geom.js';
import { L, rockerGeom, pistonPinY, strokeIndex, STROKES, CAM_PR } from './layout.js';
import { AX, CHAIN, CHAIN_MM_PER_RAD } from './parts.js';

const V = L.valves;
const KEYS = ['intake', 'exhaust'];

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const ref = {
    cam: P('camshaft'),
    sprocket: P('cam-sprocket'),
    chainPart: P('cam-chain'),
    crank: P('ctx-crank'),
    piston: P('ctx-piston'),
    rocker: { intake: P('rocker-i'), exhaust: P('rocker-e') },
    valve: { intake: P('valve-i'), exhaust: P('valve-e') },
    retainer: { intake: P('retainer-i'), exhaust: P('retainer-e') },
    cotter: { intake: P('cotter-i'), exhaust: P('cotter-e') },
    springs: { intake: P('springs-i'), exhaust: P('springs-e') },
  };
  const geom = { intake: rockerGeom(V.intake), exhaust: rockerGeom(V.exhaust) };
  const chainMesh = ref.chainPart.inner.userData.nodes.chain;
  const chainLinks = ref.chainPart.inner.userData.nodes.links;
  const pistonNodes = ref.piston.inner.userData.nodes;
  const springNode = {
    intake: ref.springs.intake.inner.userData.nodes,
    exhaust: ref.springs.exhaust.inner.userData.nodes,
  };

  const m4 = new THREE.Matrix4();
  const ex = new THREE.Vector3(1, 0, 0);
  const ey = new THREE.Vector3();
  const ez = new THREE.Vector3();
  const pos = new THREE.Vector3();

  /** Trạng thái hiện tại — UI đọc để vẽ đồng hồ. */
  const state = {
    theta: 0, camAngle: 0, stroke: 0, strokeName: STROKES[0],
    lift: { intake: 0, exhaust: 0 },
    camLift: { intake: 0, exhaust: 0 },
    open: { intake: false, exhaust: false },
  };

  /** Hàm điều khiển chuẩn: đầu vào là góc trục khuỷu (độ). */
  function drive(thetaDeg) {
    const theta = ((thetaDeg % 720) + 720) % 720;
    const phi = theta / 2;                       // góc trục cam (độ)
    state.theta = theta;
    state.camAngle = phi;
    state.stroke = strokeIndex(theta);
    state.strokeName = STROKES[state.stroke];

    // ── Trục cam + nhông ────────────────────────────────────────────────────
    ref.cam.kin.rot.set(deg(phi), 0, 0);
    ref.sprocket.kin.rot.set(deg(phi), 0, 0);

    // ── Xupap + cò mổ ───────────────────────────────────────────────────────
    for (const k of KEYS) {
      const v = V[k], g = geom[k], ax = AX[k];
      const hCam = camLift(phi - v.camCenter, L.cam.rb, L.cam.lift, L.cam.half);
      const psi = g.sign * Math.asin(clamp(hCam / Math.abs(g.dzCam), -1, 1));
      const drop = Math.abs(g.dzValve) * Math.sin(Math.abs(psi));
      const lift = Math.max(0, drop - L.lash[k]);

      ref.rocker[k].kin.rot.set(psi, 0, 0);
      for (const p of [ref.valve[k], ref.retainer[k], ref.cotter[k]]) {
        p.kin.pos.set(0, -ax.ay * lift, -ax.az * lift);
      }
      const sn = springNode[k];
      sn.spring.scale.y = (sn.l0 - lift) / sn.l0;

      state.camLift[k] = hCam;
      state.lift[k] = lift;
      state.open[k] = lift > 0.02;
    }

    // ── Piston + tay biên + trục khuỷu ──────────────────────────────────────
    const pinY = pistonPinY(theta);
    ref.piston.kin.pos.set(0, pinY, 0);
    pistonNodes.rod.rotation.x = Math.asin(
      clamp(-(L.crankR * Math.sin(deg(theta))) / L.rodLen, -1, 1));
    ref.crank.kin.rot.set(deg(theta), 0, 0);

    // ── Dây cam ─────────────────────────────────────────────────────────────
    // Tham số cung s tăng theo chiều góc TĂNG trong không gian (z,y) của vòng
    // chạy, còn quay +φ quanh X lại đưa +Y về +Z = chiều góc GIẢM -> dấu trừ.
    const s0 = -deg(phi) * CHAIN_MM_PER_RAD;
    for (let i = 0; i < chainLinks; i++) {
      const sm = CHAIN.pitchAt(s0 + (i / chainLinks) * CHAIN.length);
      ez.set(0, sm.tb, sm.ta);
      ey.set(0, sm.ta, -sm.tb);
      pos.set(L.chainX, sm.b, sm.a);
      m4.makeBasis(ex, ey, ez).setPosition(pos);
      chainMesh.setMatrixAt(i, m4);
    }
    chainMesh.instanceMatrix.needsUpdate = true;

    asm.refresh();
  }

  /**
   * Vị trí điểm chỉ thị trên nhông cam (để gắn nhãn 3D).
   * Dấu được dựng tại offset (0, d, 0) so với trục cam; quay quanh X góc φ
   * đưa nó về (0, d·cosφ, d·sinφ).
   */
  function sprocketMarkPos() {
    const d = CAM_PR - 4;
    const a = deg(state.camAngle);
    return new THREE.Vector3(L.camSprocket.x, L.cam.y + d * Math.cos(a), L.cam.z + d * Math.sin(a));
  }

  return { drive, state, sprocketMarkPos };
}
