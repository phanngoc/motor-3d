/**
 * steps.js — Trình tự tháo bộ hoà khí và đường nạp (lắp lại = chạy ngược).
 *
 * Trình tự này cố ý đi từ NGOÀI vào và từ RẺ tới ĐẮT, đúng thứ tự nên chẩn đoán:
 * xả buồng phao (2 phút) → mở buồng phao (10 phút) → gíc-lơ (20 phút) →
 * van trượt (30 phút) → tháo hẳn bộ hoà khí. Rất nhiều lần chỉ cần tới bước 4
 * là hết bệnh, mà thợ lại tháo cả bộ ra ngay từ đầu.
 */

export const STEPS = [
  {
    title: 'Khoá xăng, xả buồng phao',
    detail: 'Đóng khoá xăng, hứng hộp, nới vít xả cho hết xăng cũ trong buồng phao. '
      + 'Xăng để lâu bay hơi để lại nhựa — chỉ riêng việc xả và cho xăng mới đã cứu được '
      + 'rất nhiều xe "để lâu không nổ".',
    tool: 'Tô vít dẹt · hộp hứng',
    warn: 'Làm ở nơi thoáng, không có tia lửa. Xăng bay hơi ở nhiệt độ thường và hơi xăng '
      + 'nặng hơn không khí nên đọng dưới sàn.',
    focus: 'drain-screw',
    view: [0.5, -0.35, 0.79],
    moves: [{ part: 'drain-screw', d: [0, -18, -28] }],
  },
  {
    title: 'Tháo hộp gió và lọc gió',
    detail: 'Mở hộp gió, lấy lõi lọc ra soi qua ánh sáng. Nếu không thấy ánh sáng xuyên qua '
      + 'thì lọc đã tắc — và lọc tắc làm hỗn hợp GIÀU trên toàn dải ga, một triệu chứng rất '
      + 'dễ bị quy oan cho bộ hoà khí.',
    tool: 'Tuýp 8 · tô vít',
    focus: 'air-filter',
    view: [0.4, 0.28, 0.87],
    moves: [
      { part: 'airbox', d: [0, 30, 90] },
      { part: 'air-filter', d: [0, 62, 30] },
    ],
  },
  {
    title: 'Tháo ống cao su nối và bộ hoà khí khỏi cổ hút',
    detail: 'Nới hai cổ dê, rút ống cao su. Tháo hai đai ốc mặt bích bộ hoà khí. '
      + 'Nhớ tháo dây ga và dây e gió trước khi kéo bộ hoà khí ra.',
    tool: 'Tuýp 10 · tô vít',
    warn: 'Kiểm ống cao su và gioăng cổ hút NGAY lúc này. Nứt ở đây là chỗ hút khí giả số một, '
      + 'và triệu chứng của nó giống hệt "bộ hoà khí bẩn".',
    focus: 'intake-boot',
    moves: [{ part: 'intake-boot', d: [0, 20, 46] }],
  },
  {
    title: 'Mở buồng phao',
    detail: 'Ba vít nhỏ. Nhìn ngay đáy buồng phao: cặn đen là nhựa xăng, hạt sáng là rỉ từ bình, '
      + 'và nếu có lớp nước đọng dưới cùng thì đó là nguyên nhân "chạy được một lúc rồi tắt".',
    tool: 'Tô vít dẹt vừa',
    warn: 'Vít buồng phao rất mềm và siết rất nhẹ (≈ 2 N·m). Dùng tô vít đúng cỡ, '
      + 'không thì tuôn đầu vít.',
    focus: 'float-bowl',
    view: [0.55, -0.3, 0.78],
    moves: [
      { part: 'bowl-screws', d: [0, -34, 0] },
      { part: 'float-bowl', d: [0, -48, 0] },
      { part: 'bowl-gasket', d: [0, -44, -22] },
    ],
  },
  {
    title: 'ĐO mức xăng trước khi tháo phao',
    detail: 'Đây là bước hay bị bỏ. Đo chiều cao phao (hoặc dùng ống nhựa trong đo mức xăng thật) '
      + 'và so với thông số. Nếu mức xăng sai thì mọi thứ khác đều sai — và không có gíc-lơ nào '
      + 'chỉnh lại được. Tháo phao ra rồi là mất cơ hội đo.',
    tool: 'Thước lá · ống nhựa trong',
    focus: 'fuel-surface',
    moves: [],
  },
  {
    title: 'Tháo phao và van kim',
    detail: 'Rút trục phao, lấy cặp phao và kim ra. Lắc phao nghe có xăng bên trong là phao đã ngấm '
      + '— phải thay. Soi mũi kim: có vạch lõm quanh mũi thì thay CẢ CẶP kim và bệ.',
    tool: 'Kìm mỏ nhọn',
    focus: 'floats',
    moves: [
      { part: 'floats', d: [0, -60, -18] },
      { part: 'float-valve', d: [0, -66, -34] },
    ],
  },
  {
    title: 'Tháo gíc-lơ chính và gíc-lơ chậm',
    detail: 'Hai gíc-lơ này quyết định hai khoảng ga KHÁC NHAU: gíc-lơ chậm lo không tải và 1/8 ga '
      + 'đầu; gíc-lơ chính lo từ khoảng 3/4 ga trở lên. Soi cả hai qua ánh sáng — phải thấy tròn '
      + 'và đều. Gíc-lơ chậm có lỗ rất nhỏ nên tắc trước.',
    tool: 'Tô vít dẹt nhỏ chuẩn khe',
    warn: 'Thông gíc-lơ bằng dây ĐỒNG mảnh hoặc dây phanh xe đạp tướp đầu, tuyệt đối không dùng dây '
      + 'thép hay kim khâu. Làm rộng lỗ ra 0,05 mm là hỗn hợp giàu vĩnh viễn, không sửa được.',
    focus: 'main-jet',
    view: [0.62, -0.22, 0.75],
    moves: [
      { part: 'main-jet', d: [0, -46, 0] },
      { part: 'pilot-jet', d: [0, -52, 16] },
    ],
  },
  {
    title: 'Rút ống kim (ống nhũ hoá)',
    detail: 'Ống kim đẩy ra từ phía dưới. Soi 4 hàng lỗ nhũ hoá trên thân ống — chúng nhỏ như lỗ kim '
      + 'và tắc rất dễ. Lỗ tắc thì xăng ra dạng tia thay vì dạng bọt, bay hơi kém, xe chạy không êm '
      + 'ở tầm ga giữa mà đo gì cũng thấy đúng.',
    tool: 'Que gỗ hoặc đầu nhựa đẩy nhẹ',
    focus: 'needle-jet',
    moves: [{ part: 'needle-jet', d: [0, -58, 0] }],
  },
  {
    title: 'Mở nắp buồng chân không, lấy lò xo',
    detail: 'Hai vít nhỏ trên nắp. Lò xo van trượt rất mềm, đừng làm mất hoặc thay bằng lò xo khác '
      + 'cứng/mềm hơn — nó là một nửa của phép cân bằng quyết định độ mở van trượt.',
    tool: 'Tô vít dẹt nhỏ',
    focus: 'carb-top-cap',
    view: [0.45, 0.5, 0.74],
    moves: [
      { part: 'carb-top-cap', d: [0, 46, 0] },
      { part: 'slide-spring', d: [0, 40, 26] },
    ],
  },
  {
    title: 'Lấy van trượt và kim xăng — SOI MÀNG CAO SU',
    detail: 'Rút van trượt lên. Việc quan trọng nhất của cả quy trình: căng màng cao su ra và SOI '
      + 'QUA ÁNH SÁNG. Một lỗ nhỏ như đầu kim thôi là van trượt không nhấc được, và xe sẽ "không lên '
      + 'được ga lớn" — triệu chứng rất hay bị chẩn sai thành hư CDI hay mo-bin.',
    tool: 'Tay · đèn soi',
    warn: 'Không kéo màng bằng vật cứng, không rửa màng bằng dung dịch tẩy mạnh. '
      + 'Kim xăng gắn với van trượt — nhớ khấc treo kim đang ở vị trí nào để lắp lại đúng.',
    focus: 'cv-slide',
    moves: [{ part: 'cv-slide', d: [0, 62, 0] }],
  },
  {
    title: 'Tháo e gió, vít gió, vít ga',
    detail: 'Trước khi tháo VÍT GIÓ, vặn nó vào cho tới khi chạm đáy nhẹ và ĐẾM số vòng — đó là '
      + 'thông số chỉnh hiện tại của xe, và cách duy nhất để lắp lại đúng như cũ.',
    tool: 'Tô vít dẹt nhỏ',
    warn: 'Đếm số vòng trước khi tháo. Không siết mạnh khi chạm đáy — làm hỏng đầu côn của vít.',
    focus: 'pilot-air-screw',
    moves: [
      { part: 'pilot-air-screw', d: [-38, 0, 0] },
      { part: 'idle-screw', d: [-42, 0, 0] },
      { part: 'choke', d: [46, 0, 0] },
      { part: 'overflow-tube', d: [22, -30, 0] },
    ],
  },
  {
    title: 'Tháo bướm ga và ròng rọc dây ga',
    detail: 'Chỉ tháo khi thật cần (trục mòn, đĩa không đóng kín). Lắc trục bướm ga theo phương '
      + 'hướng kính: có độ lắc rõ là ổ trục đã mòn và đang hút khí giả tại chỗ trục xuyên thân — '
      + 'lỗi này không sửa được bằng cách rửa bộ hoà khí.',
    tool: 'Tô vít nhỏ · kìm',
    focus: 'throttle-butterfly',
    moves: [
      { part: 'cable-drum', d: [56, 0, 0] },
      { part: 'throttle-butterfly', d: [-70, 0, 0] },
    ],
  },
  {
    title: 'Tháo cổ hút và gioăng',
    detail: 'Kiểm độ phẳng mặt bích và thay CẢ HAI gioăng. Đây là bước cuối và cũng là chỗ đáng '
      + 'nghi nhất khi xe có triệu chứng nghèo ở ga nhỏ mà bộ hoà khí đã sạch.',
    tool: 'Tuýp 10',
    focus: 'intake-manifold',
    moves: [
      { part: 'intake-manifold', d: [0, 0, 74] },
      { part: 'intake-gaskets', d: [0, -26, 60] },
      { part: 'carb-body', d: [0, 0, 132] },
    ],
  },
];
