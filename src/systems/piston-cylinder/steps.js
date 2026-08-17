/**
 * steps.js — Quy trình tháo lắp xy-lanh – piston – tay biên.
 * Xy-lanh và piston rút ra theo hướng +Y (lên trên), xéc-măng xoè ra để thấy
 * thứ tự xếp.
 */

export const STEPS = [
  {
    title: 'Hoàn tất toàn bộ hệ thống 01 (đầu bò)',
    detail: 'Xy-lanh chỉ ra được sau khi đầu bò đã ra. Dây cam phải đang được treo bằng '
      + 'dây kẽm, không để tụt xuống lốc máy.',
    tool: 'Xem trang 01',
    tip: 'Đến bước này gioăng đầu bò đã bỏ, mặt lắp trên của xy-lanh đang hở',
    focus: 'ctx-head',
    view: [0.6, 0.42, 0.68],
    moves: [{ part: 'ctx-head', d: [0, 90, 0] }],
  },
  {
    title: 'Xả nhớt máy',
    detail: 'Xả khi máy còn ấm cho nhớt chảy nhanh và mang theo cặn.',
    tool: 'Tuýp 12 mm · khay',
    torque: 'Bu lông xả khi lắp: ≈ 24 N·m',
    tip: 'Thay long đen làm kín của bu lông xả — chi tiết dùng một lần',
    view: [0.6, 0.3, 0.74],
    moves: [],
  },
  {
    title: 'Nhấc xy-lanh lên khỏi lốc máy',
    detail: 'Kéo THẲNG lên theo hướng trục. Nếu chặt: gõ nhẹ búa cao su vào bệ tản nhiệt, '
      + 'không nảy tua-vít vào mặt lắp.',
    tool: 'Búa cao su',
    warn: 'GIỮ PISTON bằng tay khi xy-lanh rời ra — để piston đập vào miệng lốc máy là '
      + 'nứt chân piston hoặc cong tay biên',
    tip: 'Nhét giẻ sạch vào miệng lốc máy NGAY sau khi xy-lanh ra',
    focus: 'cylinder',
    view: [0.66, 0.4, 0.64],
    moves: [{ part: 'cylinder', d: [0, 105, 0] }],
  },
  {
    title: 'Tháo gioăng chân xy-lanh + 2 chốt dẫn hướng',
    detail: 'Gioăng thay mới. Ghi nhớ vị trí 2 chốt dẫn hướng — chúng ĐỊNH VỊ xy-lanh, '
      + 'bu lông chỉ giữ chặt.',
    tool: 'Kìm mỏ nhọn',
    warn: 'Chốt dẫn hướng rất dễ tuột xuống lốc máy',
    focus: 'base-gasket',
    view: [0.5, 0.55, 0.67],
    moves: [
      { part: 'base-gasket', d: [0, 30, 0] },
      { part: 'dowels', d: [0, 46, 28] },
    ],
  },
  {
    title: 'Tháo 1 khoá chốt piston',
    detail: 'Dùng tua-vít nhỏ hoặc kìm mỏ nhọn nảy khoá chữ C ra. Chỉ cần tháo MỘT bên là '
      + 'đủ để đẩy chốt ra.',
    tool: 'Tua-vít đầu nhỏ · kìm mỏ nhọn · kính bảo hộ',
    warn: 'Khoá chốt bật rất mạnh và rất dễ rơi vào lốc máy — che miệng lốc máy trước. '
      + 'Khoá chốt BẮT BUỘC thay mới khi lắp lại',
    focus: 'clips',
    view: [0.9, 0.28, 0.34],
    moves: [{ part: 'clips', d: [0, 40, 34] }],
  },
  {
    title: 'Đẩy chốt piston ra · lấy piston',
    detail: 'Đẩy chốt bằng ngón tay hoặc cốc gỗ/nhựa. Nếu chặt: hâm nóng nhẹ đỉnh piston '
      + 'bằng giẻ tẩm nước nóng — nhôm giãn nhiều hơn thép nên lỗ chốt nở ra.',
    tool: 'Cốc đẩy bằng gỗ/nhựa',
    warn: 'KHÔNG đóng búa thẳng vào chốt — sẽ làm CONG TAY BIÊN, một hư hỏng không '
      + 'nhìn ra được bằng mắt',
    focus: 'pin',
    view: [0.85, 0.35, 0.4],
    moves: [{ part: 'pin', d: [56, 0, 0] }],
  },
  {
    title: 'Rút piston khỏi tay biên',
    detail: 'Piston rời ra cùng 3 xéc-măng còn trên nó.',
    tool: 'Tay',
    tip: 'Ghi nhớ hướng của mũi/chữ chỉ hướng trên đỉnh piston TRƯỚC khi tháo rời',
    focus: 'piston',
    view: [0.6, 0.5, 0.62],
    moves: [
      { part: 'piston', d: [0, 62, 0] },
      { part: 'ring1', d: [0, 62, 0] },
      { part: 'ring2', d: [0, 62, 0] },
      { part: 'oil-rails', d: [0, 62, 0] },
      { part: 'oil-expander', d: [0, 62, 0] },
    ],
  },
  {
    title: 'Tháo 3 xéc-măng khỏi piston',
    detail: 'Nong hai đầu miệng vừa đủ để vượt qua đỉnh piston. Tháo từ vòng TRÊN xuống. '
      + 'Xéc-măng dầu tháo 2 vòng gạt trước, vòng đàn hồi sau.',
    tool: 'Kìm tháo xéc-măng (nên dùng)',
    warn: 'Nong quá tay -> xéc-măng gãy. Vòng gang giòn hơn bạn tưởng',
    tip: 'Đánh dấu mặt TRÊN của từng vòng — nhất là xéc-măng số 2 vì nó có mặt vát lệch',
    focus: 'ring1',
    view: [0.55, 0.52, 0.65],
    moves: [
      { part: 'ring1', d: [0, 46, 0] },
      { part: 'ring2', d: [0, 30, 0] },
      { part: 'oil-rails', d: [0, 16, 0] },
      { part: 'oil-expander', d: [0, 6, 26] },
    ],
  },
  {
    title: 'Đo lòng xy-lanh: 3 độ cao × 2 phương vuông góc',
    detail: 'Đo bằng panme trong. Lấy hiệu lớn nhất giữa hai phương làm ĐỘ Ô-VAN, hiệu giữa '
      + 'trên và dưới làm ĐỘ CÔN. Xy-lanh mòn ô-van vì lực ngang từ tay biên nghiêng luôn '
      + 'ép piston về cùng một phía.',
    tool: 'Panme trong (bore gauge) · panme ngoài',
    tip: 'Đo đường kính piston ở phương VUÔNG GÓC trục chốt, cách chân váy ~10 mm',
    view: [0.5, 0.4, 0.76],
    moves: [],
  },
  {
    title: 'Đo khe hở miệng xéc-măng TRONG lòng xy-lanh',
    detail: 'Đặt từng vòng vào lòng xy-lanh (dùng piston đẩy cho vòng nằm vuông), đo khe hở '
      + 'hai đầu miệng bằng lá căn.',
    tool: 'Lá căn',
    warn: 'Khe miệng = 0 là chết xy-lanh: khi nóng vòng giãn dài, hai đầu đẩy nhau, vòng bó '
      + 'cong và xước dọc thành xy-lanh',
    tip: 'Đo trong CHÍNH lòng xy-lanh sẽ dùng, không đo ngoài không khí',
    view: [0.5, 0.4, 0.76],
    moves: [],
  },
  {
    title: 'Kiểm tay biên: lắc đầu to và đầu nhỏ',
    detail: 'Lắc đầu to theo phương HƯỚNG KÍNH — có độ lắc là ổ bi kim đã mòn. Lắc theo '
      + 'phương DỌC TRỤC — khe hở phải trong 0,10–0,40 mm.',
    tool: 'Đồng hồ so · tay',
    warn: 'Trên xe số đầu to LIỀN KHỐI với trục khuỷu rời (ép nóng), nên mòn là phải thay '
      + 'CẢ trục khuỷu hoặc đưa ra xưởng ép lại (hệ thống 03)',
    focus: 'big-bearing',
    view: [0.6, 0.2, 0.77],
    moves: [],
  },
  {
    title: 'Tháo bạc đầu nhỏ — tay biên thì KHÔNG tháo được',
    detail: 'Bạc đầu nhỏ ép ra ép vào được, nhưng sau khi ép PHẢI doa lại đúng khe hở với '
      + 'chốt piston. Còn <b>tay biên và ổ bi kim đầu to thì không rời ra được</b>: trên xe số '
      + 'chúng bị kẹp trong trục khuỷu RỜI ép nóng. Vì vậy trong mô hình hai chi tiết này '
      + 'đứng nguyên — đúng như ngoài đời.',
    tool: 'Dụng cụ ép bạc · dao doa',
    warn: 'Đầu to mòn = phải thay CẢ trục khuỷu hoặc đưa ra xưởng ép lại (hệ thống 03), '
      + 'không có cách nào thay riêng bạc',
    tip: 'Ép bạc đầu nhỏ mà không doa lại = chốt piston chặt cứng hoặc lỏng quá, cả hai đều hỏng nhanh',
    focus: 'small-bush',
    view: [0.7, 0.35, 0.62],
    moves: [
      { part: 'small-bush', d: [0, 52, -30] },
    ],
  },
  {
    title: 'Lắp lại: xéc-măng dầu trước, vòng đàn hồi VÀO TRƯỚC',
    detail: 'Thứ tự: vòng đàn hồi -> 2 vòng gạt -> xéc-măng số 2 (MẶT VÁT XUỐNG) -> '
      + 'xéc-măng số 1. Xoay các miệng lệch nhau 120° và KHÔNG đặt miệng trùng cửa nạp/xả '
      + 'hay trùng trục chốt piston.',
    tool: 'Kìm lắp xéc-măng',
    warn: 'Lắp sai chiều mặt vát vòng số 2 = hao nhớt ngay lập tức, và chỉ phát hiện được '
      + 'sau khi đã lắp xong tất cả',
    tip: 'Bôi nhớt mới lên xéc-măng và lòng xy-lanh trước khi hạ xy-lanh xuống',
    view: [0.55, 0.5, 0.67],
    moves: [],
  },
  {
    title: 'Lắp piston: đọc mũi chỉ hướng trên đỉnh',
    detail: 'Trên đỉnh piston có mũi hoặc chữ chỉ hướng (thường "IN" hướng về phía NẠP, '
      + 'hoặc mũi tam hướng về phía XẢ). Lắp ngược chiều làm lệch offset chốt và gây gõ máy.',
    tool: 'Tay · đèn pin để đọc dấu',
    warn: 'Đọc kỹ dấu TRƯỚC KHI lắp — sau khi lắp xong không nhìn thấy nữa',
    tip: 'Lắp khoá chốt MỚI, kiểm chắc đã vào hết rãnh bằng cách xoay thử',
    view: [0.55, 0.5, 0.67],
    moves: [],
  },
  {
    title: 'Hạ xy-lanh: nén xéc-măng bằng tay, không gõ',
    detail: 'Đặt gioăng mới + 2 chốt dẫn hướng. Hạ xy-lanh xuống, dùng ngón tay bóp từng '
      + 'xéc-măng vào trong khi đẩy. Nếu phải gõ búa là đang làm sai — có vòng chưa vào.',
    tool: 'Tay · gioăng mới',
    torque: 'Bu lông đầu bò khi lắp: ≈ 24 N·m theo hình chéo, 2 lượt',
    tip: 'Xoay trục khuỷu bằng tay 2 vòng trước khi lắp đầu bò — phải nhẹ và đều, '
      + 'không chạn ở đâu. Chạn là có vấn đề, tháo ra kiểm lại',
    view: [0.6, 0.45, 0.66],
    moves: [],
  },
];
