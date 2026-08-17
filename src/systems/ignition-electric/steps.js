/**
 * steps.js — Trình tự tháo hệ thống đánh lửa và điện (lắp lại = chạy ngược).
 *
 * Trình tự này đi theo thứ tự CHẨN ĐOÁN, không theo thứ tự cơ khí: bắt đầu từ
 * những thứ đo được mà không tháo gì (ắc quy, điện áp sạc), rồi tới bugi và dây
 * cao áp, rồi mới vào mâm lửa. Lý do rất thực tế — phần lớn "lỗi điện" nằm ở
 * tiếp xúc và ở bugi, còn CDI thì hầu như không hỏng.
 */

export const STEPS = [
  {
    title: 'ĐO TRƯỚC KHI THÁO: điện áp ắc quy và điện áp sạc',
    detail: 'Đo ba số, chưa tháo gì cả: (1) ắc quy lúc nghỉ — phải ≈ 12,6 V; (2) lúc bấm đề — '
      + 'không được tụt dưới 9,5 V; (3) máy chạy 5000 v/ph — phải 13,5…14,8 V. '
      + 'Ba số này khoanh vùng được gần hết các lỗi điện mà không cần mở gì.',
    tool: 'Đồng hồ đo điện',
    warn: 'Nếu số (3) vượt 15,5 V thì DỪNG LẠI, cục sạc đang luộc ắc quy. Chạy tiếp sẽ cháy '
      + 'bóng đèn hàng loạt.',
    focus: 'battery',
    view: [0.35, 0.3, 0.89],
    moves: [],
  },
  {
    title: 'Tháo cầu chì và tháo cọc âm ắc quy',
    detail: 'Tháo cọc ÂM trước, lắp cọc âm sau cùng — để nếu cờ-lê chạm khung thì không có dòng. '
      + 'Soi cầu chì: đứt là DẤU HIỆU của chạm mát ở đâu đó, không phải nguyên nhân.',
    tool: 'Tuýp 8',
    warn: 'Không bao giờ thay cầu chì bằng dây đồng hay cầu chì trị số lớn hơn — '
      + 'đó là cách làm cháy cả bó dây.',
    focus: 'main-fuse',
    moves: [
      { part: 'main-fuse', d: [40, 22, 0] },
      { part: 'battery', d: [0, -10, 96] },
    ],
  },
  {
    title: 'Tháo nắp bugi và bugi — ĐỌC MÀU CHÂN SỨ',
    detail: 'Màu chân sứ là bản báo cáo về hỗn hợp: nâu nhạt là đúng; đen xốp là giàu (xem hệ '
      + 'thống 07); trắng ngà là nghèo và có nguy cơ cháy piston. Đo khe hở bằng lá căn.',
    tool: 'Tuýp bugi 16 · lá căn',
    warn: 'THỬ BUGI BẰNG CÁCH CHO NỔ TẠI CHỖ KHÔNG KẾT LUẬN ĐƯỢC GÌ. Điện áp cần để phóng tia '
      + 'tăng theo áp suất trong xy-lanh, nên một bugi hở rộng vẫn nổ tốt lúc không tải mà bỏ '
      + 'máy khi lên ga. Đo khe hở, đừng thử bằng mắt.',
    focus: 'spark-plug',
    view: [0.86, 0.24, 0.44],
    moves: [
      { part: 'plug-lead', d: [40, 34, 20] },
      { part: 'spark-plug', d: [78, 0, 0] },
    ],
  },
  {
    title: 'Kiểm dây cao áp và bô-bin trong TỐI',
    detail: 'Nổ máy trong chỗ tối và nhìn dọc dây cao áp cùng thân bô-bin. Thấy tia xanh nhảy ra '
      + 'vỏ máy là cao áp đang rò — nó đi đường tắt thay vì qua khe bugi. Hay bị nhất sau khi rửa '
      + 'xe bằng vòi áp lực hoặc khi trời mưa.',
    tool: 'Chỗ tối · bình xịt nước',
    focus: 'ignition-coil',
    moves: [{ part: 'ignition-coil', d: [0, 46, 34] }],
  },
  {
    title: 'Tháo CDI — nhưng ĐỪNG thay ngay',
    detail: 'CDI hỏng thật thì mất lửa HOÀN TOÀN, không phải lửa yếu. Nếu triệu chứng là "lửa '
      + 'yếu", "không lên được ga lớn", hay "bỏ máy khi tải nặng" thì nguyên nhân gần như chắc '
      + 'chắn KHÔNG phải CDI — hãy quay lại kiểm bô-bin, bugi, và màng van trượt bộ hoà khí.',
    tool: 'Tay · tuýp 8',
    warn: 'Đây là chi tiết bị thay oan nhiều nhất trên xe số. Vệ sinh và cắm lại giắc trước.',
    focus: 'cdi-unit',
    moves: [{ part: 'cdi-unit', d: [-34, 26, 40] }],
  },
  {
    title: 'Tháo cục sạc và công tắc',
    detail: 'Cục sạc nhận biết bằng cánh tản nhiệt. Kiểm cánh có bám bụi dày không — nó xả phần '
      + 'điện dư thành nhiệt nên bị bọc bụi là quá nhiệt rồi hỏng.',
    tool: 'Tuýp 8 · tô vít',
    focus: 'regulator',
    moves: [
      { part: 'regulator', d: [40, 12, 44] },
      { part: 'ignition-switch', d: [0, 40, 40] },
      { part: 'kill-switch', d: [-40, 22, 22] },
      { part: 'starter-relay', d: [-40, 26, 40] },
    ],
  },
  {
    title: 'Tháo củ đề',
    detail: 'Hai bu lông và một dây nguồn. Đề yếu thì kiểm ẮC QUY và tiếp xúc TRƯỚC — củ đề rút '
      + 'vài chục ampe nên chỉ cần điện trở tiếp xúc tăng một chút là đã quay yếu.',
    tool: 'Tuýp 8',
    focus: 'starter-motor',
    view: [0.4, 0.24, -0.88],
    moves: [{ part: 'starter-motor', d: [-40, 0, -46] }],
  },
  {
    title: 'Tháo bu lông vỏ máy trái',
    detail: 'Các bu lông KHÔNG cùng chiều dài — cắm chúng vào một miếng bìa theo đúng sơ đồ lỗ. '
      + 'Lắp bu lông dài vào lỗ ngắn sẽ chọc vào cuộn stator.',
    tool: 'Tuýp 8',
    focus: 'cover-bolts',
    view: [-0.72, 0.3, 0.62],
    moves: [{ part: 'cover-bolts', d: [-44, 0, 0] }],
  },
  {
    title: 'Mở vỏ máy trái',
    detail: 'Hứng nhớt sẽ chảy ra. Nhìn ngay vào lòng vỏ: nếu có nhớt bám dày trên cuộn stator '
      + 'thì phớt chặn nhớt bên trái đã hỏng (hệ thống 03) — và đó là nguyên nhân GỐC của cả '
      + '"lửa yếu", "không sạc" và "đèn chập chờn" cùng lúc.',
    tool: 'Búa cao su · hộp hứng',
    warn: 'Đừng nạy bằng tô vít vào mặt lắp — làm nảy mặt nhôm là rỉ nhớt vĩnh viễn.',
    focus: 'left-cover',
    moves: [
      { part: 'left-cover', d: [-72, 0, 0] },
      { part: 'cover-gasket', d: [-58, -28, 0] },
    ],
  },
  {
    title: 'ĐO KHE HỞ CUỘN KÍCH trước khi tháo rôto',
    detail: 'Luồn lá căn giữa lõi cuộn kích và vấu kích trên rôto. Khe hở rộng ra thì xung yếu, '
      + 'và mất lửa sẽ xảy ra ở vòng tua THẤP trước (lúc đạp máy) vì rôto quay chậm thì xung sinh '
      + 'ra càng nhỏ. Tháo rôto ra rồi là mất cơ hội đo.',
    tool: 'Lá căn',
    focus: 'pulser-coil',
    moves: [],
  },
  {
    title: 'Tháo rôto mâm lửa bằng VAM — kiểm then bán nguyệt',
    detail: 'Giữ rôto rồi mở đai ốc, sau đó dùng VAM RÚT. Khi rôto ra, kiểm ngay THEN BÁN NGUYỆT: '
      + 'nó chỉ bé bằng hạt gạo nhưng nếu bị cắt thì rôto lệch góc, và toàn bộ thời điểm đánh lửa '
      + 'sai theo — xe sẽ khó nổ hoặc nổ dội mà thay bao nhiêu CDI cũng không hết.',
    tool: 'Vam rút rôto · dụng cụ giữ · tuýp 17',
    warn: 'TUYỆT ĐỐI không đóng búa vào rôto để rút. Làm vậy sẽ cong trục khuỷu (hệ thống 03) — '
      + 'một cú búa đổi một lần đại tu.',
    focus: 'rotor',
    moves: [
      { part: 'rotor', d: [-96, 0, 0] },
      { part: 'starter-clutch', d: [-96, 0, 0] },
    ],
  },
  {
    title: 'Tháo mâm điện và cuộn kích — ĐO CÁCH ĐIỆN',
    detail: 'Với mỗi cuộn, đo hai thứ: điện trở giữa các đầu dây (phải nhỏ, vài ôm tới vài chục '
      + 'ôm tuỳ cuộn), và cách điện giữa dây và MÁT (phải hở hoàn toàn). Chạm mát dù chỉ một chỗ '
      + 'là mất sạc.',
    tool: 'Đồng hồ đo điện · tô vít · tuýp 8',
    warn: 'Đánh dấu vị trí góc của mâm điện trước khi tháo. Mâm điện đặt GỐC của góc đánh lửa; '
      + 'lắp lệch là sai thời điểm toàn dải.',
    focus: 'stator',
    moves: [
      { part: 'pulser-coil', d: [-58, 26, 26] },
      { part: 'stator', d: [-72, 0, 0] },
    ],
  },
];
