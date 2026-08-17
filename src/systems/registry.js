/**
 * registry.js — Danh mục 9 hệ thống (mỗi hệ thống = 1 trang riêng).
 *
 * status:
 *   '3d'  = đã dựng mô hình 3D + animation tháo lắp + animation hoạt động
 *   'doc' = đã có đầy đủ lý thuyết / danh mục chi tiết / quy trình tháo lắp dạng
 *           tài liệu, CHƯA dựng 3D. Dùng chung engine, chỉ cần thêm parts.js +
 *           steps.js vào folder tương ứng là trang tự động thành trang 3D.
 */

export const MACHINE = {
  name: 'Honda Wave 110 (lớp xe số 4 kỳ, SOHC 2 xupap)',
  short: 'Xe số 4T · SOHC · ly hợp ướt đa đĩa · hộp số 4 cấp cài then',
  specs: [
    ['Kiểu động cơ', '1 xy-lanh, 4 kỳ, SOHC 2 xupap, làm mát bằng không khí'],
    ['Đường kính × hành trình', '50,0 × 55,6 mm'],
    ['Dung tích', '109,1 cm³'],
    ['Tỉ số nén', '9,0 : 1'],
    ['Dẫn động cam', 'Dây cam (cam chain) — tỉ số truyền 2:1 so với trục khuỷu'],
    ['Ly hợp', 'Ly hợp li tâm (tự động) + ly hợp ướt nhiều đĩa (cắt khi sang số)'],
    ['Hộp số', '4 cấp, bánh răng ăn khớp thường xuyên, cài then (constant-mesh)'],
    ['Bôi trơn', 'Bơm bánh răng cưỡng bức + lọc li tâm (không có lọc giấy)'],
    ['Khởi động', 'Cần đạp + mô tơ đề'],
  ],
};

export const SYSTEMS = [
  {
    ix: '01', slug: 'cylinder-head', status: '3d',
    name: 'Đầu bò & cơ cấu cam–xupap',
    nameEn: 'Cylinder head & SOHC valve train',
    tagline: 'Trục cam, cò mổ, xupap, lò xo, dây cam. Nơi quyết định thời điểm nạp–xả.',
    tags: ['SOHC', '2 xupap', 'dây cam 2:1', 'căn cam'],
  },
  {
    ix: '02', slug: 'piston-cylinder', status: 'doc',
    name: 'Xy-lanh, piston & tay biên',
    nameEn: 'Cylinder, piston & connecting rod',
    tagline: 'Biến áp suất cháy thành chuyển động quay. Nhóm chi tiết mài mòn nhanh nhất.',
    tags: ['bore 50mm', 'stroke 55,6mm', '3 xéc-măng'],
  },
  {
    ix: '03', slug: 'crank-case', status: 'doc',
    name: 'Trục khuỷu & lốc máy',
    nameEn: 'Crankshaft & crankcase',
    tagline: 'Trục khuỷu rời, ổ bi, bánh đà. Phải tách lốc máy mới vào được.',
    tags: ['trục khuỷu rời', 'ổ bi cầu', 'tách lốc'],
  },
  {
    ix: '04', slug: 'clutch', status: 'doc',
    name: 'Ly hợp (bộ nồi)',
    nameEn: 'Centrifugal + wet multi-plate clutch',
    tagline: 'Hai bộ ly hợp nối tiếp: li tâm tự động + đa đĩa cắt khi sang số.',
    tags: ['li tâm', 'đa đĩa ướt', 'bộ nồi trước/sau'],
  },
  {
    ix: '05', slug: 'gearbox', status: '3d',
    name: 'Hộp số 4 cấp & cơ cấu sang số',
    nameEn: '4-speed constant-mesh gearbox & shift mechanism',
    tagline: 'Bánh răng luôn ăn khớp, cài then dịch dọc trục. Trống số + càng cua.',
    tags: ['4 cấp', 'cài then', 'trống số', 'càng cua'],
  },
  {
    ix: '06', slug: 'lubrication', status: 'doc',
    name: 'Hệ thống bôi trơn',
    nameEn: 'Lubrication system',
    tagline: 'Bơm bánh răng, lọc li tâm, đường dầu lên đầu bò. Xe số KHÔNG có lọc giấy.',
    tags: ['bơm bánh răng', 'lọc li tâm', '0,8 L nhớt'],
  },
  {
    ix: '07', slug: 'fuel-intake', status: 'doc',
    name: 'Nạp – xả & cung cấp nhiên liệu',
    nameEn: 'Intake, fuel system & exhaust',
    tagline: 'Lọc gió, bộ hòa khí (hoặc phun xăng PGM-FI), cổ góp, ống xả.',
    tags: ['carb/PGM-FI', 'lọc gió', 'ống xả'],
  },
  {
    ix: '08', slug: 'ignition-electric', status: 'doc',
    name: 'Đánh lửa & hệ thống điện',
    nameEn: 'Ignition & electrical system',
    tagline: 'Mâm lửa, bánh đà, CDI/ECU, cuộn sạc, mô tơ đề, bugi.',
    tags: ['CDI', 'stator', 'đề', 'sạc'],
  },
  {
    ix: '09', slug: 'chassis-brakes', status: 'doc',
    name: 'Khung, phuộc, phanh & truyền động cuối',
    nameEn: 'Frame, suspension, brakes & final drive',
    tagline: 'Phuộc trước/sau, phanh đĩa + phanh cơ, nhông–dĩa–sên.',
    tags: ['phuộc ống lồng', 'phanh đĩa', 'sên 428'],
  },
];

export const bySlug = (slug) => SYSTEMS.find((s) => s.slug === slug);

/** Cảnh báo chung về số liệu — hiện trên mọi trang. */
export const SPEC_DISCLAIMER =
  'Số liệu lực siết / khe hở trong project là GIÁ TRỊ THAM KHẢO cho lớp động cơ Wave 110. '
  + 'Trước khi siết thực tế BẮT BUỘC tra sổ tay dịch vụ (service manual) đúng đời xe của bạn — '
  + 'sai lực siết ở đầu bò hoặc lốc máy là nguyên nhân phổ biến gây nứt ren và hở gioăng.';
