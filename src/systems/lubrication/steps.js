/**
 * steps.js — Trình tự tháo hệ thống bôi trơn (lắp lại = chạy ngược).
 *
 * Hai nhóm công việc thật sự tách rời nhau ở đây:
 *  A. Bảo dưỡng định kỳ (bước 1–4): xả nhớt, vệ sinh bộ lọc li tâm. Chỉ cần mở
 *     vỏ máy phải, làm được tại tiệm trong 30 phút.
 *  B. Đại tu bơm nhớt (bước 5–14): phải tháo cả bộ nồi, và muốn lấy lưới lọc thì
 *     phải tách hẳn lốc máy.
 * Bộ lọc li tâm thuộc nhóm A — dễ làm, nhưng nằm kín bên trong nên không ai thấy,
 * và vì không ai thấy nên hầu như không ai làm.
 */

export const STEPS = [
  // ── A. Bảo dưỡng định kỳ ───────────────────────────────────────────────────
  {
    title: 'Hâm máy rồi tắt, xả nhớt',
    detail: 'Chạy máy 2–3 phút cho nhớt loãng và cuốn được cặn lơ lửng, rồi TẮT MÁY mới xả. '
      + 'Xả khi máy nguội thì cặn còn nằm lại dưới đáy các-te.',
    tool: 'Khẩu 17',
    warn: 'Long đen của bu lông xả là loại BIẾN DẠNG, dùng một lần. Lắp lại long đen cũ là '
      + 'nguồn rỉ nhớt phổ biến nhất sau khi thay nhớt.',
    focus: 'drain-bolt',
    view: [0.3, -0.55, 0.78],
    moves: [{ part: 'drain-bolt', d: [0, -34, 0] }],
  },
  {
    title: 'Rút que thăm để đọc tình trạng nhớt cũ',
    detail: 'Xem màu và mùi: đen đặc là bình thường; có ánh kim là mạt kim loại; màu cà phê '
      + 'sữa là có nước; mùi khét gắt là đã từng quá nhiệt. Nhớt cũ là bản báo cáo miễn phí '
      + 'về tình trạng bên trong máy.',
    tool: 'Tay',
    focus: 'dipstick',
    moves: [{ part: 'dipstick', d: [0, 46, -26] }],
  },
  {
    title: 'Mở nắp buồng lọc li tâm',
    detail: 'Nắp nằm sau vỏ máy phải và sau bộ nồi (đã tháo ở hệ thống 04). Rất nhiều xe chạy '
      + '50.000 km chưa từng được mở nắp này lần nào.',
    tool: 'Tuýp 8',
    warn: 'Thay o-ring mỗi lần mở. O-ring chai thì nhớt lọt qua mà KHÔNG được lọc — bộ lọc '
      + 'vẫn còn nguyên đó nhưng vô dụng.',
    focus: 'cf-cap',
    view: [0.88, 0.22, 0.42],
    moves: [{ part: 'cf-cap', d: [46, 0, 0] }],
  },
  {
    title: 'Vét sạch lớp cặn trong buồng lọc',
    detail: 'Vét hết lớp cặn dính thành buồng. Lượng và loại cặn ở đây cho biết tình trạng máy '
      + 'trung thực hơn bất cứ thứ gì khác: cặn mềm màu đen là muội than bình thường; nhiều '
      + 'mạt kim loại sáng thì phải tìm nguyên nhân TRƯỚC khi lắp lại và chạy tiếp.',
    tool: 'Giẻ sạch, xăng, khí nén',
    warn: 'KHÔNG dùng giẻ bung sợi — sợi vải sót lại sẽ theo nhớt đi thẳng vào ổ bi đầu to.',
    focus: 'cf-sludge',
    moves: [],
  },

  // ── B. Đại tu bơm nhớt ─────────────────────────────────────────────────────
  {
    title: 'Tháo buồng lọc li tâm khỏi trục khuỷu',
    detail: 'Buồng lọc bắt trên đầu côn trục khuỷu bên phải. Phải giữ trục khuỷu lại mới mở '
      + 'được đai ốc.',
    tool: 'Khẩu 14 + dụng cụ giữ trục khuỷu',
    focus: 'cf-housing',
    moves: [
      { part: 'cf-housing', d: [78, 0, 0] },
      { part: 'cf-sludge', d: [78, 0, 0] },
    ],
  },
  {
    title: 'Tháo nhông dẫn động bơm nhớt',
    detail: 'Kiểm từng răng. Nhông NHỰA này là chi tiết yếu nhất của toàn hệ thống bôi trơn — '
      + 'nó vỡ thì bơm ngừng ngay lập tức mà không có đèn báo nào sáng lên.',
    tool: 'Tay, kìm mỏ nhọn tháo phe',
    warn: 'Đếm đủ số răng. Thiếu một răng cũng phải thay.',
    focus: 'pump-gear',
    moves: [{ part: 'pump-gear', d: [44, 0, 0] }],
  },
  {
    title: 'Tháo ba bu lông bơm nhớt',
    detail: 'Ba bu lông M5. Nới đều theo hình sao.',
    tool: 'Tuýp 8',
    focus: 'pump-bolts',
    moves: [{ part: 'pump-bolts', d: [34, 0, 0] }],
  },
  {
    title: 'Mở nắp bơm — ĐO ba khe hở trước khi tháo rôto',
    detail: 'Trước khi lấy rôto ra, đo bằng lá căn: (1) khe đỉnh thùy giữa hai rôto, '
      + '(2) khe giữa rôto ngoài và lòng thân bơm, (3) khe CẠNH — đặt thước lá ngang mặt '
      + 'thân bơm rồi luồn lá căn xuống. Tháo rôto ra rồi là mất cơ hội đo.',
    tool: 'Lá căn, thước lá thẳng',
    warn: 'Khe CẠNH hay bị bỏ qua nhất nhưng ảnh hưởng lưu lượng nhiều nhất ở vòng tua thấp — '
      + 'đúng lúc máy cần áp suất nhất.',
    focus: 'pump-cover',
    view: [0.9, 0.2, 0.35],
    moves: [{ part: 'pump-cover', d: [38, 0, 0] }],
  },
  {
    title: 'Lấy rôto trong (5 thùy)',
    detail: 'Ghi nhớ MẶT nào đang hướng ra ngoài. Hai mặt rôto đã mài theo cặp và không đối '
      + 'xứng — lắp ngược mặt làm khe cạnh sai và mòn rất nhanh.',
    tool: 'Tay',
    focus: 'rotor-inner',
    moves: [{ part: 'rotor-inner', d: [50, 0, 0] }],
  },
  {
    title: 'Lấy rôto ngoài (6 thùy)',
    detail: 'Rôto ngoài nhiều hơn rôto trong đúng MỘT thùy. Chênh lệch một thùy cộng với độ '
      + 'lệch tâm giữa hai tâm quay là toàn bộ nguyên lý của bơm này: các khoang giữa hai rôto '
      + 'lần lượt lớn ra (hút nhớt) rồi nhỏ lại (đẩy nhớt).',
    tool: 'Tay',
    focus: 'rotor-outer',
    moves: [{ part: 'rotor-outer', d: [62, 0, 0] }],
  },
  {
    title: 'Rút trục bơm',
    detail: 'Kiểm then dẹt trên trục. Then mòn tròn thì rôto trượt trên trục và bơm mất lưu '
      + 'lượng thất thường — triệu chứng khó chẩn nhất của cả hệ thống.',
    tool: 'Tay',
    focus: 'pump-shaft',
    moves: [{ part: 'pump-shaft', d: [72, 0, 0] }],
  },
  {
    title: 'Tháo thân bơm khỏi lốc máy',
    detail: 'Nếu một trong ba khe hở đã vượt dung sai thì THAY CẢ BỘ bơm. Không có phụ tùng lẻ '
      + 'từng rôto, vì hai rôto được mài thành cặp và chỉ khớp với nhau.',
    tool: 'Tuýp 8',
    focus: 'pump-body',
    moves: [{ part: 'pump-body', d: [0, -56, 0] }],
  },
  {
    title: 'Tháo van an toàn',
    detail: 'Kiểm bi có di chuyển tự do và lò xo không yếu. Van này chỉ làm việc khi máy NGUỘI '
      + '(nhớt đặc, sức cản cao) hoặc ở vòng tua rất cao — nên hỏng của nó rất khó phát hiện '
      + 'trong điều kiện chạy bình thường.',
    tool: 'Tuýp 12',
    warn: 'Van kẹt MỞ là nguyên nhân "áp suất không lên" mà thợ hay quy oan cho bơm.',
    focus: 'relief-valve',
    view: [0.35, 0.25, 0.9],
    moves: [{ part: 'relief-valve', d: [0, 0, 52] }],
  },
  {
    title: 'Tách lốc máy và lấy lưới lọc nhớt',
    detail: 'Lưới lọc nằm ở đáy các-te nên BẮT BUỘC phải tách lốc máy (hệ thống 03). Đó là lý '
      + 'do nó chỉ được vệ sinh khi đại tu, và cũng là lý do nên vệ sinh thật kỹ khi đã mở tới.',
    tool: 'Cần tách lốc máy (xem hệ thống 03)',
    warn: 'Vệ sinh cả ống hút. Một mảnh gioăng cũ nằm trong ống hút cũng đủ làm bơm hụt nhớt '
      + 'ở vòng tua cao.',
    focus: 'oil-strainer',
    view: [0.4, -0.45, 0.8],
    moves: [{ part: 'oil-strainer', d: [0, -52, 0] }],
  },
];
