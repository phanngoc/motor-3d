/**
 * system-entry.js — Entry dùng chung cho MỌI trang hệ thống.
 * Trang HTML chỉ cần khai báo <body data-system="cylinder-head">.
 */

import './style.css';

const slug = document.body.dataset.system;
if (!slug) throw new Error('Thiếu data-system trên <body>');

// Vite phân tích được mẫu này và tạo glob cho ./systems/*/index.js
const mod = await import(`./systems/${slug}/index.js`);
const sys = mod.default;

if (sys.mode === '3d') {
  const { mountSystemPage } = await import('./core/system-page.js');
  mountSystemPage(sys);
} else {
  const { mountDocPage } = await import('./core/doc-page.js');
  mountDocPage(sys);
}
