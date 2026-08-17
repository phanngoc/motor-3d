/**
 * materials.js — Bảng vật liệu dùng chung.
 * Màu sắc chọn theo vật liệu THỰC của từng chi tiết, không chọn theo thẩm mỹ,
 * để nhìn màu là đoán được vật liệu (nhôm đúc, gang, thép tôi, đồng thanh...).
 */

import * as THREE from 'three';

const std = (o) => new THREE.MeshStandardMaterial({ side: THREE.FrontSide, ...o });

export const MAT = {
  /** Nhôm đúc — thân máy, đầu bò, nắp máy */
  alu: std({ color: 0x9aa3ab, metalness: 0.72, roughness: 0.55 }),
  /** Nhôm đúc thô hơn — cánh tản nhiệt, vỏ che */
  aluCast: std({ color: 0x8e959c, metalness: 0.62, roughness: 0.72 }),
  /** Nhôm đánh bóng — nắp đầu bò */
  aluPolish: std({ color: 0xb9c1c8, metalness: 0.88, roughness: 0.24 }),
  /** Gang — ống lót xy-lanh */
  castIron: std({ color: 0x4a4d52, metalness: 0.55, roughness: 0.78 }),
  /** Thép tôi sáng bóng — trục cam, thân xupap, trục cơ */
  steel: std({ color: 0xc2c8ce, metalness: 0.95, roughness: 0.18 }),
  /** Thép tôi bề mặt làm việc — vấu cam, mặt cò mổ, vấu cài then */
  hardened: std({ color: 0x8f959b, metalness: 0.95, roughness: 0.10 }),
  /** Thép đen — bu lông, đai ốc, nhông */
  blackOxide: std({ color: 0x3c4045, metalness: 0.85, roughness: 0.42 }),
  /** Thép lò xo — lò xo xupap */
  spring: std({ color: 0x767d85, metalness: 0.92, roughness: 0.30 }),
  /** Mặt xupap — chịu nhiệt, màu sẫm hơn thân */
  valveFace: std({ color: 0x9fa6ac, metalness: 0.90, roughness: 0.34 }),
  /** Đồng thanh — ống dẫn hướng xupap, bạc chạy lô */
  bronze: std({ color: 0xb08d57, metalness: 0.85, roughness: 0.38 }),
  /** Đồng đỏ — gioăng đồng, đầu dây điện */
  copper: std({ color: 0xb87333, metalness: 0.90, roughness: 0.30 }),
  /** Cao su / phớt — phớt xupap, o-ring */
  rubber: std({ color: 0x1f2124, metalness: 0.0, roughness: 0.92 }),
  /** Gioăng giấy/amiăng — gioăng đầu bò */
  gasket: std({ color: 0x9c6b3f, metalness: 0.0, roughness: 0.95 }),
  /** Sứ cách điện — bugi */
  ceramic: std({ color: 0xe8e4dc, metalness: 0.0, roughness: 0.42 }),
  /** Nhựa — dẫn hướng dây cam, giắc cắm */
  plastic: std({ color: 0x2b2f34, metalness: 0.0, roughness: 0.62 }),
  /** Piston — nhôm hợp kim sáng */
  piston: std({ color: 0xa8afb6, metalness: 0.78, roughness: 0.44 }),
  /** Nhớt động cơ (trong suốt vàng) */
  oil: std({ color: 0xc9922a, metalness: 0.0, roughness: 0.15, transparent: true, opacity: 0.45 }),

  /** Chi tiết "ngữ cảnh" — chỉ để định hướng, không thuộc hệ thống đang xét */
  ghost: std({
    color: 0x5b6570, metalness: 0.3, roughness: 0.7,
    transparent: true, opacity: 0.16, depthWrite: false,
  }),
};

/** Màu highlight khi chi tiết đang được tháo trong bước hiện tại. */
export const HILITE = new THREE.Color(0x18e0a8);

/**
 * Bật/tắt highlight trên một Object3D: nhân bản material để không ảnh hưởng
 * các chi tiết khác dùng chung material.
 */
export function setHighlight(obj, on) {
  obj.traverse((n) => {
    if (!n.isMesh) return;
    if (on) {
      if (!n.userData._origMat) n.userData._origMat = n.material;
      if (!n.userData._hlMat) {
        const m = n.userData._origMat.clone();
        m.emissive = HILITE.clone();
        // Đủ để nhận ra ngay nhưng không che mất màu vật liệu gốc.
        m.emissiveIntensity = 0.3;
        n.userData._hlMat = m;
      }
      n.material = n.userData._hlMat;
    } else if (n.userData._origMat) {
      n.material = n.userData._origMat;
    }
  });
}

/**
 * Chế độ X-quang: hạ opacity để nhìn xuyên qua vỏ.
 * QUAN TRỌNG: phải tắt castShadow cùng lúc — vật liệu trong suốt vẫn đổ bóng
 * ĐẦY ĐỦ trong Three.js, nên nếu không tắt thì bên trong vẫn tối thui dù vỏ
 * đã trong.
 */
export function setXray(obj, on, opacity = 0.18) {
  obj.traverse((n) => {
    if (!n.isMesh) return;
    if (on) {
      if (!n.userData._xrayMat) {
        const base = n.userData._origMat ?? n.material;
        const m = base.clone();
        m.transparent = true; m.opacity = opacity; m.depthWrite = false;
        n.userData._xrayMat = m;
      }
      n.userData._preXray = n.material;
      n.userData._preShadow = n.castShadow;
      n.material = n.userData._xrayMat;
      n.castShadow = false;
    } else if (n.userData._preXray) {
      n.material = n.userData._preXray;
      n.castShadow = n.userData._preShadow ?? true;
      n.userData._preXray = null;
    }
  });
}
