/**
 * steps.js — Quy trình tháo lắp hộp số, đúng thứ tự như làm thật.
 *
 * Lưu ý về cách trình bày: ở bước tháo rời bánh răng, mô hình XÒE các chi tiết
 * ra dọc trục thay vì rút lần lượt khỏi đầu trục. Ngoài đời bạn rút từ đầu +X
 * ra; xòe ra như đây thì thấy rõ THỨ TỰ XẾP hơn — mà thứ tự xếp mới là thứ dễ
 * lắp sai nhất.
 */

import { L, GEARS } from './layout.js';

/** Toàn bộ chi tiết nằm trên 2 trục — phải đi theo khi nhấc trục ra khỏi lốc. */
const ON_SHAFTS = [
  'mainshaft', 'gear-m2', 'gear-m3', 'gear-m4',
  'countershaft', 'gear-c1', 'gear-c2', 'gear-c3', 'gear-c4',
  'slider-a', 'slider-b', 'bushings',
];

const LIFT = 92;

export const STEPS = [
  {
    title: 'Chuẩn bị: xả nhớt · tháo nhông trước',
    detail: 'Tháo nhông trước KHI XE CÒN TRÊN BÁNH: đạp phanh sau để giữ bánh rồi mới nới '
      + 'đai ốc. Bẻ phẳng vấu long đen khóa trước khi nới.',
    tool: 'Tuýp 24–27 mm · tuýp 12 mm xả nhớt',
    torque: 'Khi lắp: ≈ 54 N·m, long đen khóa THAY MỚI',
    warn: 'Nới đai ốc nhông sau khi đã tách lốc máy thì không còn gì giữ trục — rất khó',
    focus: 'front-sprocket',
    view: [0.85, 0.3, 0.45],
    moves: [{ part: 'front-sprocket', d: [46, 0, 0] }],
  },
  {
    title: 'Tháo động cơ · đầu bò · xy-lanh · piston · bộ nồi · mâm lửa',
    detail: 'Hộp số nằm trong lốc máy nên bắt buộc phải tách lốc, và muốn tách lốc thì '
      + 'phải bỏ hết những thứ này trước. Xem hệ thống 01, 02, 04, 08.',
    tool: 'Bộ tuýp · vam giữ bộ nồi · vam rút bánh đà',
    tip: 'Đây là 4 trang riêng — làm theo đúng từng trang, đừng làm từ trí nhớ',
    view: [0.7, 0.45, 0.55],
    moves: [],
  },
  {
    title: 'Tháo bàn đạp số',
    detail: 'ĐÁNH DẤU vị trí bàn đạp trên then hoa của trục trước khi tháo — lắp lại lệch '
      + 'một răng then là độ cao bàn đạp sai, đạp số rất khó chịu.',
    tool: 'Tuýp 10 mm · bút dấu',
    tip: 'Chụp một ảnh vị trí bàn đạp so với gác chân',
    focus: 'shift-pedal',
    view: [0.8, 0.25, 0.55],
    moves: [{ part: 'shift-pedal', d: [44, 0, 0] }],
  },
  {
    title: 'Rút trục bàn đạp số (kèm con cóc)',
    detail: 'Rút ngang ra. Kiểm tra ngay 2 thứ: lò xo hồi còn đàn hồi không, và 2 ngón con cóc '
      + 'có bị mòn tròn đầu không. Đây cũng là chi tiết mang cần MỞ LY HỢP — kiểm luôn '
      + 'đầu đẩy của nó.',
    tool: 'Tay · kìm',
    warn: 'Lò xo hồi yếu là nguyên nhân "đạp số không trả về" — thay ngay khi đã mở ra',
    focus: 'shift-spindle',
    view: [0.75, 0.2, 0.62],
    moves: [{ part: 'shift-spindle', d: [96, 0, 0] }],
  },
  {
    title: 'Tháo cần định vị số + lò xo',
    detail: 'Nới bu lông trục cần, gỡ lò xo. Cần này ép con lăn vào vành định vị — chính nó '
      + 'tạo cảm giác "cục" khi vào số.',
    tool: 'Tuýp 10 mm · kìm mỏ nhọn',
    warn: 'Lò xo bật khá xa — che tay khi gỡ',
    tip: 'Lò xo yếu -> trống số không đứng đúng chỗ -> nhảy số. Đo/so với cái mới',
    focus: 'detent',
    view: [0.5, -0.15, 0.85],
    moves: [{ part: 'detent', d: [0, -34, 26] }],
  },
  {
    title: 'Tháo vành định vị số',
    detail: 'Vành 5 hốc bắt vào đầu trống số. Kiểm hốc: mòn tròn miệng là mất cảm giác vào số.',
    tool: 'Tuýp 8 mm',
    tip: 'Bu lông này thường có keo chống tuột ren — hâm nóng nhẹ nếu chặt',
    focus: 'drum-stopper',
    view: [-0.7, 0.25, 0.66],
    moves: [{ part: 'drum-stopper', d: [-42, 0, 0] }],
  },
  {
    title: 'TÁCH LỐC MÁY',
    detail: 'Chỉ được tách bằng bu lông kéo (case splitter). Trước đó đếm và bố trí toàn bộ '
      + 'bu lông lên một tờ bìa theo đúng hình lốc máy — chúng khác chiều dài nhau.',
    tool: 'Vam tách lốc máy · bìa cứng để bố trí bu lông',
    warn: 'TUYỆT ĐỐI không nảy tua-vít vào mặt lắp — một vết nảy là rỉ nhớt vĩnh viễn',
    tip: 'CHỤP NHIỀU ẢNH hộp số ngay khi mở ra: vị trí càng cua, chiều lắp từng bánh răng, '
      + 'vị trí long đen chặn. Đây là bước tiết kiệm nhiều thời gian nhất',
    view: [0.6, 0.4, 0.7],
    moves: [],
  },
  {
    title: 'Rút trục càng cua',
    detail: 'Rút dọc theo trục. Hai càng cua sẽ rời tự do sau khi trục ra.',
    tool: 'Tay · kìm mỏ nhọn nếu chặt',
    focus: 'fork-shaft',
    view: [0.8, 0.25, 0.55],
    moves: [{ part: 'fork-shaft', d: [98, 0, 0] }],
  },
  {
    title: 'Lấy 2 càng cua ra',
    detail: 'ĐÁNH DẤU càng nào của cặp 1–2, càng nào của cặp 3–4, và mặt nào hướng ra ngoài. '
      + 'Hai càng trông rất giống nhau nhưng KHÔNG thay thế được cho nhau.',
    tool: 'Tay · bút dấu',
    warn: 'Lắp đổi chỗ 2 càng cua = hộp số không vào được số nào',
    tip: 'Đo chiều dày mỏ càng ngay lúc này bằng thước cặp',
    focus: 'fork-a',
    view: [0.45, 0.35, 0.82],
    moves: [
      { part: 'fork-a', d: [0, 58, 30] },
      { part: 'fork-b', d: [0, 58, -18] },
    ],
  },
  {
    title: 'Rút trống số',
    detail: 'Rút dọc trục ra. Kiểm 2 rãnh xoắn: thành rãnh phải nhẵn, không có bậc mòn. '
      + 'Rãnh mòn làm hành trình cài then không đủ.',
    tool: 'Tay',
    tip: 'Lăn trống số trên mặt phẳng, quan sát 2 rãnh — dễ thấy bậc mòn hơn là nhìn tĩnh',
    focus: 'drum',
    view: [0.55, 0.2, 0.8],
    moves: [{ part: 'drum', d: [98, 0, 0] }],
  },
  {
    title: 'Nhấc CẢ HAI trục số ra cùng lúc',
    detail: 'Hai trục đang ăn khớp nhau nên phải nhấc đồng thời, giữ nguyên tương quan. '
      + 'Đặt lên bàn đúng thế đang nằm trong máy rồi mới tháo rời.',
    tool: 'Hai tay',
    warn: 'Nhấc riêng một trục sẽ làm răng cạy vào nhau',
    tip: 'Đặt xuống bàn theo đúng thế nằm trong lốc — sau này lắp lại cứ chiếu theo',
    focus: 'countershaft',
    view: [0.6, 0.42, 0.68],
    moves: ON_SHAFTS.map((p) => ({ part: p, d: [0, LIFT, 0] })),
  },
  {
    title: 'Tháo rời trục thứ cấp',
    detail: 'Thứ tự trên trục (từ trái sang): bánh răng số 1 – cài then 1–2 – bánh răng số 2 – '
      + 'bánh răng số 3 – cài then 3–4 – bánh răng số 4. Kiểm từng bánh: <b>vấu cài then '
      + 'phải vuông góc, không vạt tròn</b>; <b>lỗ vấu không banh miệng</b>; bạc chạy lô '
      + 'không mòn oval.',
    tool: 'Tay · thước cặp · đèn pin',
    warn: 'Vấu bị VẠT TRÒN là nguyên nhân nhảy số — phải thay cả cặp bánh răng',
    tip: 'Xâu tất cả vào một đoạn dây thép theo đúng thứ tự, khỏi lẫn',
    focus: 'slider-a',
    view: [0.35, 0.45, 0.82],
    moves: [
      { part: 'gear-c1', d: [-42, 0, 0] },
      { part: 'slider-a', d: [-25, 0, 0] },
      { part: 'gear-c2', d: [-8, 0, 0] },
      { part: 'gear-c3', d: [10, 0, 0] },
      { part: 'slider-b', d: [28, 0, 0] },
      { part: 'gear-c4', d: [46, 0, 0] },
      { part: 'bushings', d: [0, -30, 0] },
    ],
  },
  {
    title: 'Tháo rời trục sơ cấp',
    detail: `Bánh răng số 1 (${GEARS[0].zM} răng) LIỀN TRỤC, không tháo được — vì chỉ `
      + `${GEARS[0].zM} răng nên chân răng còn khoảng R7,6 mm, không đủ chỗ đặt moay-ơ. `
      + 'Ba bánh răng còn lại lắp then hoa, rút ra được.',
    tool: 'Tay · vam nếu chặt',
    tip: 'Bánh răng số 1 hỏng = phải thay cả trục sơ cấp',
    focus: 'mainshaft',
    view: [0.4, 0.55, 0.74],
    moves: [
      { part: 'gear-m2', d: [-12, 0, 0] },
      { part: 'gear-m3', d: [12, 0, 0] },
      { part: 'gear-m4', d: [32, 0, 0] },
    ],
  },
  {
    title: 'Đo và đánh giá',
    detail: 'Bốn phép đo quyết định: (1) chiều dày mỏ càng cua, (2) khe hở dọc trục của bánh '
      + 'răng chạy lô, (3) khe hở bánh răng – bạc – trục, (4) độ đảo hai trục trên khối V.',
    tool: 'Thước cặp · lá căn · đồng hồ so + khối V',
    tip: 'Ghi hết số đo xuống giấy trước khi quyết định mua gì — thay theo cảm giác thì '
      + 'thường thay thiếu, phải mở lại lần hai',
    view: [0.5, 0.5, 0.7],
    moves: [],
  },
  {
    title: 'Kiểm tra và thay ổ bi đỡ trục',
    detail: 'Quay từng ổ bằng tay: phải êm, không kẹn, không rơ dọc. Thay bằng cách HÂM NÓNG '
      + 'lốc máy (~90–110 °C) rồi ép ổ mới vào, chỉ đẩy lực qua vòng NGOÀI.',
    tool: 'Súng nhiệt · bộ cốc ép ổ bi',
    warn: 'Đóng búa hoặc ép lực qua vòng TRONG làm mòn vết bi -> ổ kêu sau vài trăm km',
    focus: 'bearings',
    view: [0.75, 0.35, 0.55],
    moves: [{ part: 'bearings', d: [0, -46, 0] }],
  },
  {
    title: 'Thay phớt trục thứ cấp',
    detail: 'Phớt này là nguyên nhân của "nhông trước và sên luôn ướt nhớt". Kiểm luôn cổ trục '
      + 'chỗ phớt tiếp xúc: nếu đã bị xước thành rãnh thì thay phớt bao nhiêu lần cũng rỉ lại.',
    tool: 'Móc lấy phớt · cốc đóng phớt',
    tip: 'Phớt này thay được mà KHÔNG cần tách lốc máy — nếu chỉ rỉ nhớt thì đừng mở cả máy',
    focus: 'output-seal',
    view: [0.85, 0.2, 0.48],
    moves: [{ part: 'output-seal', d: [34, 0, 0] }],
  },
  {
    title: 'Lắp lại · SANG SỐ BẰNG TAY trước khi ghép lốc',
    detail: 'Lắp 2 trục, trống số, càng cua theo đúng ảnh đã chụp. Sau đó <b>xoay trống số bằng '
      + 'tay qua tất cả 5 vị trí</b>: mỗi cấp số phải vào dứt khoát và hai trục phải quay '
      + 'tương ứng đúng tỉ số. Nếu có cấp nào không vào — tháo ra làm lại.',
    tool: 'Tay',
    warn: 'Ghép lốc máy rồi mới phát hiện không vào số = phải tách lại từ đầu',
    tip: 'Đây là bước kiểm tra quan trọng nhất của cả quy trình. Mất 5 phút, cứu cả buổi',
    view: [0.5, 0.45, 0.74],
    moves: [],
  },
  {
    title: 'Ghép lốc máy · siết theo hình xoắn',
    detail: 'Bôi keo làm kín mỏng và liên tục, lắp 2 chốt định vị, siết tay tất cả bu lông rồi '
      + 'siết lực theo hình xoắn từ trong ra ngoài, 2 lượt. Sau khi ghép, xoay trục bằng tay '
      + 'phải nhẹ và đều.',
    tool: 'Keo làm kín lốc máy · cần lực',
    torque: '≈ 10–12 N·m (M6), 2 lượt theo hình xoắn',
    warn: 'Keo quá nhiều sẽ tràn vào trong và bít đường nhớt',
    tip: 'Điều chỉnh lại cần mở ly hợp (hệ thống 04) trước khi chạy — nếu không, '
      + 'hộp số vừa sửa sẽ mòn lại đúng như cũ',
    view: [0.6, 0.4, 0.7],
    moves: [],
  },
];
