/**
 * labels.js — Nhãn HTML neo vào một điểm 3D.
 *
 * Tách riêng khỏi ui.js CÓ Ý: đây là file duy nhất trong lớp UI cần Three.js.
 * Nếu để trong ui.js thì các trang TÀI LIỆU (không có 3D) cũng phải tải cả
 * Three.js (~600 kB) chỉ để dùng hàm tạo element.
 */

import * as THREE from 'three';
import { el } from './ui.js';


export function LabelLayer(stage, viewer) {
  const layer = el('div', { class: 'labels' });
  stage.append(layer);
  const items = [];
  const v = new THREE.Vector3();

  function add(getPos, text, { accent = false } = {}) {
    const node = el('div', { class: `lbl${accent ? ' acc' : ''}`, text });
    layer.append(node);
    const it = { node, getPos, visible: true };
    items.push(it);
    return it;
  }
  function clear() { layer.replaceChildren(); items.length = 0; }
  function setVisible(on) { layer.style.display = on ? '' : 'none'; }

  function update() {
    if (layer.style.display === 'none') return;
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const it of items) {
      const p = it.getPos();
      if (!p) { it.node.style.display = 'none'; continue; }
      v.copy(p).project(viewer.camera);
      const behind = v.z > 1;
      it.node.style.display = behind || !it.visible ? 'none' : '';
      it.node.style.left = `${((v.x + 1) / 2) * w}px`;
      it.node.style.top = `${((-v.y + 1) / 2) * h}px`;
    }
  }
  return { add, clear, update, setVisible, layer };
}

