/**
 * steps.js — Quy trình tháo lắp trục khuỷu & lốc máy.
 * Đây là công việc lớn nhất trên động cơ: muốn vào tới trục khuỷu thì phải bỏ
 * gần như mọi thứ khác trước.
 */

export const STEPS = [
  {
    title: 'Tháo động cơ ra khỏi khung xe',
    detail: 'Xả nhớt, tháo ống xả, bộ hoà khí/cổ góp, dây điện, dây công-tắc-tơ, dây ga, '
      + 'bàn đạp số, sên (tháo nhông trước). Rồi tháo 3–4 bu lông treo máy.',
    tool: 'Bộ tuýp · con đội hoặc gỗ kê máy',
    warn: 'ĐỠ động cơ trước khi tháo bu lông treo cuối cùng — máy khoảng 25 kg',
    view: [0.7, 0.4, 0.6],
    moves: [],
  },
  {
    title: 'Tháo đầu bò · xy-lanh · piston',
    detail: 'Toàn bộ hệ thống 01 và 02. Đến bước này tay biên còn nằm nguyên trên trục khuỷu.',
    tool: 'Xem trang 01 và 02',
    focus: 'ctx-cylinder',
    view: [0.6, 0.45, 0.66],
    moves: [
      { part: 'ctx-cylinder', d: [0, 120, 0] },
      { part: 'ctx-piston', d: [0, 120, 0] },
    ],
  },
  {
    title: 'Tháo bộ nồi ly hợp (nửa vỏ bên phải)',
    detail: 'Vỏ ly hợp, đai ốc bộ nồi, bộ nồi trước/sau, bánh răng sơ cấp. '
      + 'Chi tiết ở hệ thống 04.',
    tool: 'Vam giữ bộ nồi · tuýp lớn',
    warn: 'Đai ốc bộ nồi rất chặt và một số đời là REN NGƯỢC — thử chiều trước khi ra lực',
    view: [0.8, 0.35, 0.5],
    moves: [],
  },
  {
    title: 'Tháo mâm lửa (nửa vỏ bên trái)',
    detail: 'Vỏ trái, cuộn stator. Chi tiết ở hệ thống 08.',
    tool: 'Tuýp 8 mm · tuốc-nơ-vít',
    tip: 'Kiểm luôn phớt chặn nhớt trái lúc này — nhớt rỉ vào mâm lửa là nguyên nhân gốc '
      + 'của cả lửa yếu, mất sạc và đèn chập chờn',
    view: [-0.75, 0.35, 0.56],
    moves: [],
  },
  {
    title: 'Nới đai ốc bánh đà',
    detail: 'Dùng vam GIỮ bánh đà để nới, không nhét tua-vít vào rãnh. Đai ốc rất chặt.',
    tool: 'Vam giữ bánh đà · tuýp 19 mm',
    torque: 'Khi lắp: ≈ 55 N·m',
    focus: 'flywheel-nut',
    view: [-0.85, 0.3, 0.44],
    moves: [{ part: 'flywheel-nut', d: [-44, 0, 0] }],
  },
  {
    title: 'RÚT bánh đà bằng vam · lấy then bán nguyệt',
    detail: 'Bắt vam rút vào ren trong bánh đà, vặn đều cho bánh đà tách khỏi côn. '
      + 'Lấy then bán nguyệt ra NGAY và cho vào túi riêng.',
    tool: 'Vam rút bánh đà (bắt buộc)',
    warn: 'TUYỆT ĐỐI không nảy hay đóng ngang vào bánh đà — sẽ làm CONG TRỤC KHUỶU, '
      + 'hư hỏng nặng nhất của cả quy trình',
    tip: 'Then bán nguyệt nhỏ bằng hạt gạo nhưng mất nó là không lắp lại được',
    focus: 'flywheel',
    view: [-0.8, 0.36, 0.48],
    moves: [
      { part: 'flywheel', d: [-64, 0, 0] },
      { part: 'flywheel-key', d: [-52, 26, 0] },
    ],
  },
  {
    title: 'Tháo bơm nhớt và cơ cấu sang số',
    detail: 'Bơm nhớt nằm trong khoang phải (hệ thống 06). Một số chi tiết của cơ cấu sang số '
      + 'phải ra trước khi tách được lốc máy (hệ thống 05).',
    tool: 'Tuýp 8 mm',
    tip: 'Chụp ảnh vị trí càng cua và trống số trước khi tháo',
    view: [0.7, 0.4, 0.58],
    moves: [],
  },
  {
    title: 'Xả nhớt · tháo bu lông xả',
    detail: 'Xả hết nhớt ở điểm thấp nhất của các-te. Long đen làm kín là chi tiết dùng một lần.',
    tool: 'Tuýp 17 mm · khay',
    torque: 'Khi lắp: ≈ 24 N·m',
    warn: 'Siết quá tay -> trượt ren nhôm lốc máy, đắt hơn nhiều so với cái long đen',
    focus: 'drain-bolt',
    view: [0.4, -0.5, 0.76],
    moves: [{ part: 'drain-bolt', d: [0, -40, 0] }],
  },
  {
    title: 'ĐẾM và BỐ TRÍ toàn bộ bu lông lốc máy',
    detail: 'Vẽ hình lốc máy lên một tờ bìa, đâm lỗ và cắm đúng bu lông vào đúng vị trí. '
      + 'Chúng khác chiều dài nhau.',
    tool: 'Tuýp 8 mm · bìa cứng',
    warn: 'Đây là bước bị bỏ qua nhiều nhất và là nguyên nhân phổ biến nhất của '
      + '"lắp lại bị rỉ nhớt"',
    torque: 'Khi lắp: ≈ 10–12 N·m theo hình xoắn từ trong ra ngoài, 2 lượt',
    focus: 'case-bolts',
    view: [0.55, 0.35, 0.76],
    moves: [{ part: 'case-bolts', d: [56, 0, 0] }],
  },
  {
    title: 'TÁCH LỐC MÁY bằng bu lông kéo',
    detail: 'Bắt dụng cụ tách (case splitter) vào đầu trục khuỷu, vặn đều cho hai nửa rời ra. '
      + 'Trục khuỷu sẽ đi theo một nửa — thường là nửa trái.',
    tool: 'Bộ vam tách lốc máy',
    warn: 'TUYỆT ĐỐI không nảy tua-vít hoặc đóng búa vào mép mặt lắp. Hai nửa không có '
      + 'gioăng giấy, chỉ phủ keo — một vết nảy là rỉ nhớt vĩnh viễn, keo không cứu được',
    focus: 'case-right',
    view: [0.62, 0.35, 0.7],
    moves: [
      { part: 'case-right', d: [92, 0, 0] },
      { part: 'case-left', d: [-48, 0, 0] },
    ],
  },
  {
    title: 'Lấy 2 chốt định vị',
    detail: 'Chốt rỗng, dễ tuột. Chúng ĐỊNH VỊ hai nửa lốc máy — thiếu là hai nửa lệch nhau '
      + 'và kéo cong trục khuỷu với trục số.',
    tool: 'Kìm mỏ nhọn',
    focus: 'case-dowels',
    view: [0.5, 0.4, 0.77],
    moves: [{ part: 'case-dowels', d: [0, 54, 30] }],
  },
  {
    title: 'Rút trục khuỷu ra khỏi ổ bi',
    detail: 'HÂM NÓNG vùng ổ bi của nửa lốc máy (~90–110 °C) bằng súng nhiệt, trục sẽ tụt ra '
      + 'dễ dàng. Nếu phải dùng lực là nhiệt chưa đủ. Tay biên đi ra CÙNG trục khuỷu — '
      + 'nó không tách được.',
    tool: 'Súng nhiệt hoặc bếp điện · găng tay chịu nhiệt',
    warn: 'Không dùng đèn khò — đốt cháy nhôm cục bộ và biến dạng ổ đỡ',
    tip: 'Nhỏ nước lên bề mặt: sôi lăn tăn là khoảng 100 °C',
    focus: 'crank',
    view: [0.5, 0.42, 0.76],
    moves: [{ part: 'crank', d: [0, 76, 0] }],
  },
  {
    title: 'Vệ sinh lưới lọc nhớt',
    detail: 'Đây là cấp lọc THỨ NHẤT và thô nhất. Xe số không có lọc giấy nên lưới này là '
      + 'thứ duy nhất chặn mảnh kim loại lớn.',
    tool: 'Bàn chải mềm · dung môi · khí nén',
    tip: 'Nếu lưới có nhiều mạt kim loại sáng thì phải truy nguyên nhân trước khi lắp lại',
    focus: 'oil-strainer',
    view: [0.45, -0.35, 0.82],
    moves: [{ part: 'oil-strainer', d: [0, -50, 0] }],
  },
  {
    title: 'Kiểm tra trục khuỷu',
    detail: 'Đặt trục lên 2 mũi chống tâm hoặc 2 khối V, đo độ đảo bằng đồng hồ so (≤ 0,03 mm). '
      + 'Lắc đầu to tay biên theo phương hướng kính (≤ 0,05 mm) và đo khe hở dọc trục '
      + '(0,10–0,40 mm).',
    tool: 'Đồng hồ so + chân đế từ · khối V',
    warn: 'Vượt giới hạn -> phải THAY CẢ BỘ hoặc đưa ra xưởng ép lại. Không có cách nào '
      + 'thay riêng bạc đầu to trên trục khuỷu rời',
    focus: 'crank',
    view: [0.4, 0.4, 0.82],
    moves: [],
  },
  {
    title: 'Thay ổ bi và phớt chặn nhớt',
    detail: 'Ép ổ bi mới vào lốc máy ĐÃ HÂM NÓNG, ép từ ngoài vào và chỉ đẩy lực qua vòng '
      + 'NGOÀI. Phớt lắp SAU ổ bi, ở phía ngoài, lò xo vòng hướng VÀO phía có nhớt.',
    tool: 'Bộ cốc ép ổ bi · súng nhiệt',
    warn: 'Ép lực qua vòng TRONG làm mòn vết bi -> ổ bi kẹn sau vài trăm km. '
      + 'Lắp phớt NGƯỢC chiều -> rỉ nhớt ngay',
    focus: 'bearing-left',
    view: [-0.6, 0.4, 0.7],
    moves: [
      { part: 'bearing-left', d: [-70, 0, 0] },
      { part: 'seal-left', d: [-88, 0, 0] },
      { part: 'bearing-right', d: [116, 0, 0] },
      { part: 'seal-right', d: [134, 0, 0] },
    ],
  },
  {
    title: 'Làm sạch mặt lắp hai nửa lốc máy',
    detail: 'Cạo hết keo cũ bằng dao cạo NHỰA. Mặt lắp phải sạch, khô, không dầu. '
      + 'Kiểm độ phẳng bằng thước lá.',
    tool: 'Dao cạo nhựa · dung môi · khí nén',
    warn: 'KHÔNG dùng giấy nhám trên mặt lắp lốc máy — nó lấy đi vật liệu không đều',
    view: [0.6, 0.4, 0.7],
    moves: [],
  },
  {
    title: 'Bôi keo làm kín · ghép 2 nửa · siết theo hình XOẮN',
    detail: 'Bôi một lớp keo làm kín MỎNG và LIÊN TỤC (loại dành cho lốc máy). Lắp 2 chốt '
      + 'định vị. Ghép và siết tay tất cả bu lông, sau đó siết lực theo hình xoắn từ trong '
      + 'ra ngoài, 2 lượt.',
    tool: 'Keo làm kín lốc máy · cần lực',
    torque: '≈ 10–12 N·m (M6), 2 lượt theo hình xoắn',
    warn: 'Keo quá nhiều sẽ tràn vào trong và BÍT ĐƯỜNG NHỚT — hỏng nặng hơn là rỉ nhớt',
    tip: 'Sau khi ghép, xoay trục khuỷu bằng tay: phải nhẹ và ĐỀU. Nếu chạn ở đâu thì '
      + 'tháo ra kiểm lại, đừng siết tiếp',
    view: [0.6, 0.4, 0.7],
    moves: [],
  },
  {
    title: 'Lắp bánh đà: côn phải KHÔ, siết đủ lực',
    detail: 'Lau sạch côn bằng dung môi cho hết dầu nhớt, lắp then, lắp bánh đà, siết ≈ 55 N·m '
      + 'bằng vam giữ + cần lực.',
    tool: 'Vam giữ bánh đà · cần lực · dung môi',
    warn: 'Côn còn dầu -> bánh đà TRƯỢT dù siết đủ lực -> cắt then -> sai thời điểm đánh lửa. '
      + 'Momen truyền qua MA SÁT mặt côn, không qua then',
    view: [-0.8, 0.35, 0.48],
    moves: [],
  },
];
