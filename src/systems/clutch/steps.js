/**
 * steps.js — Quy trình tháo lắp ly hợp, đúng thứ tự như làm thật.
 *
 * Toàn bộ cụm tháo ra theo hướng +X (ra ngoài xe), nên các bước dịch chi tiết
 * theo +X với biên độ tăng dần để xoè ra thành hình vụ nổ.
 */

export const STEPS = [
  {
    title: 'Xả nhớt máy',
    detail: 'Bắt buộc — khoang ly hợp ngâm nhớt. Xả khi máy còn ấm cho nhớt chảy nhanh.',
    tool: 'Tuýp 12 mm · khay đựng nhớt',
    torque: 'Bu lông xả khi lắp: ≈ 24 N·m',
    tip: 'Thay long đen làm kín của bu lông xả — đây là chi tiết dùng một lần',
    view: [0.6, 0.4, 0.7],
    moves: [],
  },
  {
    title: 'Tháo gác chân phải / bàn đạp thắng nếu vướng',
    detail: 'Tuỳ đời xe, một số phải tháo gác chân mới rút được vỏ ly hợp ra khỏi lốc máy.',
    tool: 'Tuýp 12–14 mm',
    view: [0.7, 0.35, 0.62],
    moves: [],
  },
  {
    title: 'Tháo bu lông vỏ ly hợp',
    detail: 'Nới đều ĐỐI XỨNG, chia 2 lượt. Ghi nhớ vị trí bu lông khác chiều dài — '
      + 'lắp bu lông dài vào lỗ ngắn sẽ xuyên qua mặt lắp.',
    tool: 'Tuýp 8 mm',
    torque: 'Khi lắp: ≈ 10 N·m',
    focus: 'cover-bolts',
    view: [0.85, 0.3, 0.44],
    moves: [{ part: 'cover-bolts', d: [42, 0, 0] }],
  },
  {
    title: 'Nhấc vỏ ly hợp + gioăng',
    detail: 'Nhớt còn đọng trong vỏ sẽ chảy ra — để khay sẵn. Nếu dính gioăng thì gõ nhẹ '
      + 'búa cao su vào gân vỏ, KHÔNG nảy tua-vít vào mặt lắp.',
    tool: 'Búa cao su · khay',
    warn: 'Xước mặt lắp = rỉ nhớt vĩnh viễn, keo không cứu được',
    focus: 'cover',
    view: [0.8, 0.34, 0.5],
    moves: [
      { part: 'cover', d: [66, 0, 0] },
      { part: 'cover-gasket', d: [56, 0, 0] },
    ],
  },
  {
    title: 'Điều chỉnh cần mở ly hợp về vị trí LỎNG nhất',
    detail: 'Nới đai ốc chặn, vặn vít điều chỉnh ra hết để cần mở không còn nén tấm ép. '
      + 'Làm bước này trước sẽ tháo bộ đĩa dễ hơn nhiều.',
    tool: 'Tuốc-nơ-vít · chìa khoá 10 mm',
    tip: 'Ghi lại số vòng đã nới để có mốc khi điều chỉnh lại',
    focus: 'lifter-arm',
    view: [-0.5, 0.3, 0.81],
    moves: [],
  },
  {
    title: 'Nới 4 bu lông lò xo ly hợp theo hình CHÉO',
    detail: 'Nới từng chút một theo hình chéo, 2–3 lượt. Nới hết một cái trước rồi mới sang '
      + 'cái khác sẽ làm tấm ép vướng và biến dạng vĩnh viễn.',
    tool: 'Tuýp 8 mm',
    torque: 'Khi lắp: ≈ 12 N·m theo hình chéo',
    warn: 'Đây là lỗi thao tác phổ biến nhất khi mở bộ nồi',
    focus: 'clutch-bolts',
    view: [0.75, 0.4, 0.53],
    moves: [{ part: 'clutch-bolts', d: [48, 0, 0] }],
  },
  {
    title: 'Lấy 4 lò xo + tấm ép',
    detail: 'Đo chiều dài tự do từng lò xo ngay lúc này và so với giới hạn. Lò xo yếu là '
      + 'nguyên nhân trượt ly hợp âm thầm nhất — không nhìn ra được bằng mắt.',
    tool: 'Thước cặp',
    tip: 'Thay CẢ BỘ 4 lò xo, không thay lẻ (lệch lực ép làm tấm ép vẹo)',
    focus: 'pressure-plate',
    view: [0.7, 0.42, 0.57],
    moves: [
      { part: 'clutch-springs', d: [40, 0, 0] },
      { part: 'pressure-plate', d: [30, 0, 0] },
    ],
  },
  {
    title: 'Lấy lần lượt bộ đĩa ra',
    detail: 'Xếp theo ĐÚNG THỨ TỰ trên bàn: ma sát – thép – ma sát – thép – … – ma sát. '
      + 'Đĩa ma sát có <b>răng trong</b> ăn vào moay-ơ; đĩa thép có <b>vấu ngoài</b> ăn vào chuông. '
      + 'Chụp một bức ảnh trước khi lấy.',
    tool: 'Tay',
    tip: 'Ở đây mô hình tách hai nhóm ra hai phía cho dễ nhìn — thực tế bạn rút thẳng ra',
    focus: 'friction-plates',
    view: [0.55, 0.5, 0.67],
    moves: [
      { part: 'friction-plates', d: [34, 22, 0] },
      { part: 'steel-plates', d: [34, -22, 0] },
    ],
  },
  {
    title: 'Đo đĩa ma sát và độ cong đĩa thép',
    detail: 'Đo chiều dày từng đĩa ma sát bằng thước cặp. Đặt từng đĩa thép lên căn phẳng, '
      + 'nhét lá căn vào chỗ vồng nhất để đo độ cong.',
    tool: 'Thước cặp · căn phẳng · lá căn',
    warn: 'Mòn quá giới hạn -> thay CẢ BỘ cả ma sát và thép, không thay lẻ',
    tip: 'Đĩa ma sát cháy đen kèm mùi khét = đã trượt lâu, phải truy nguyên nhân (loại nhớt, '
      + 'điều chỉnh cần mở) chứ không chỉ thay đĩa',
    view: [0.5, 0.5, 0.7],
    moves: [],
  },
  {
    title: 'Giữ bộ nồi · nới đai ốc moay-ơ',
    detail: 'Dùng vam giữ chuyên dụng. Bẻ phẳng vấu long đen khoá trước khi nới.',
    tool: 'Vam giữ bộ nồi · tuýp lớn',
    torque: 'Khi lắp: ≈ 50–55 N·m',
    warn: 'MỘT SỐ ĐỜI LÀ REN NGƯỢC — thử chiều trước khi ra lực. '
      + 'KHÔNG nhét tua-vít vào răng để giữ (sẽ bẻ răng)',
    focus: 'hub-nut',
    view: [0.85, 0.32, 0.42],
    moves: [{ part: 'hub-nut', d: [64, 0, 0] }],
  },
  {
    title: 'Rút moay-ơ ly hợp',
    detail: 'Moay-ơ then hoa trên trục sơ cấp. Kiểm then hoa ngoài: nếu bị khía rãnh do đĩa '
      + 'ma sát đập thì đĩa sẽ vướng và ly hợp không nhả hết.',
    tool: 'Tay · vam rút nếu chặt',
    focus: 'hub',
    view: [0.72, 0.4, 0.56],
    moves: [{ part: 'hub', d: [52, 0, 0] }],
  },
  {
    title: 'Rút chuông ly hợp đa đĩa',
    detail: 'Chuông quay tự do trên trục sơ cấp. Kiểm 6 rãnh dọc bên trong: rãnh bị khía do '
      + 'vấu đĩa thép đập là nguyên nhân "ly hợp không nhả hết". Rãnh nhẹ thì dũa phẳng.',
    tool: 'Tay',
    tip: 'Kiểm luôn răng bánh răng bị động và bạc trong lòng chuông',
    focus: 'basket',
    view: [0.65, 0.42, 0.63],
    moves: [{ part: 'basket', d: [42, 0, 0] }],
  },
  {
    title: 'Nới đai ốc bộ nồi trước (li tâm)',
    detail: 'Cũng rất chặt và cũng có thể là ren ngược. Dùng vam giữ bắt vào chuông li tâm.',
    tool: 'Vam giữ · tuýp 24 mm',
    torque: 'Khi lắp: ≈ 50–55 N·m',
    focus: 'cent-nut',
    view: [0.9, 0.28, 0.34],
    moves: [{ part: 'cent-nut', d: [32, 0, 0] }],
  },
  {
    title: 'Rút chuông ly hợp li tâm',
    detail: 'Kiểm MẶT TRONG chuông: bị bóng gương hoặc lõm thành rãnh là trượt dù má búa còn dày. '
      + 'Đánh nhám nhẹ mặt trong khi thay má.',
    tool: 'Tay',
    tip: 'Đây là bề mặt ma sát — không bôi nhớt lên khi lắp lại',
    focus: 'cent-drum',
    view: [0.85, 0.34, 0.4],
    moves: [{ part: 'cent-drum', d: [46, 0, 0] }],
  },
  {
    title: 'Lấy 3 quả búa + 3 lò xo kéo',
    detail: 'Kiểm độ dày má ma sát trên búa và bạc chốt quay. Kiểm lò xo kéo còn đàn hồi — '
      + 'lò xo yếu làm xe BÒ ĐI ngay khi vừa nổ máy, một lỗi nguy hiểm.',
    tool: 'Kìm · thước cặp',
    warn: 'Lò xo kéo yếu/đứt = xe tự trôi khi để nổ máy — sửa ngay, không đi tiếp',
    focus: 'cent-weights',
    view: [0.7, 0.45, 0.55],
    moves: [
      { part: 'cent-springs', d: [34, 26, 0] },
      { part: 'cent-weights', d: [36, 0, 0] },
    ],
  },
  {
    title: 'Rút mâm mang búa',
    detail: 'Mâm then hoa vào trục khuỷu — đây là đầu vào của cả đường truyền động. '
      + 'Kiểm then hoa không bị mòn tròn.',
    tool: 'Tay · vam rút nếu chặt',
    focus: 'cent-spider',
    view: [0.8, 0.38, 0.46],
    moves: [{ part: 'cent-spider', d: [34, 0, 0] }],
  },
  {
    title: 'Rút ống moay-ơ + bánh răng sơ cấp',
    detail: 'Ống dài này quay TỰ DO trên trục khuỷu và mang bánh răng sơ cấp. Kiểm bạc trong '
      + 'lòng ống: mòn thì chuông li tâm lắc và đóng không đều.',
    tool: 'Tay',
    tip: 'Ống dài không phải thiết kế tuỳ tiện — nó là hệ quả của việc hai bộ ly hợp buộc '
      + 'phải lệch nhau dọc trục (đọc mục lý thuyết)',
    focus: 'cent-sleeve',
    view: [0.75, 0.3, 0.59],
    moves: [{ part: 'cent-sleeve', d: [62, 0, 0] }],
  },
  {
    title: 'Rút thanh đẩy + bi · tháo cam và cần mở',
    detail: 'Thanh đẩy rút ra từ đầu phải của trục sơ cấp rỗng. Kiểm hai đầu thanh và viên bi: '
      + 'mòn dẹt là mất hành trình mở, gây "vào số kêu" mà không lỗi nào khác giải thích được.',
    tool: 'Kìm mỏ nhọn · nam châm',
    warn: 'Viên bi rất dễ lăn mất — làm trong khay',
    focus: 'lifter-rod',
    view: [0.4, 0.3, 0.87],
    moves: [
      { part: 'lifter-ball', d: [78, 0, 0] },
      { part: 'lifter-rod', d: [72, 0, 0] },
      { part: 'lifter-cam', d: [-34, 0, 0] },
      { part: 'lifter-arm', d: [-38, -26, 0] },
    ],
  },
  {
    title: 'Lắp lại: NGÂM NHỚT đĩa ma sát 15–20 phút',
    detail: 'Đĩa ma sát mới lắp khô sẽ chạy khô trong vài giây đầu tiên và mòn ngay. '
      + 'Ngâm nhớt mới trước khi lắp. Xen kẽ đúng thứ tự, đĩa MA SÁT ở cả hai đầu.',
    tool: 'Khay nhớt mới',
    tip: 'Long đen khoá của cả hai đai ốc BẮT BUỘC thay mới',
    view: [0.55, 0.48, 0.68],
    moves: [],
  },
  {
    title: 'Điều chỉnh khe hở cần mở ly hợp',
    detail: 'Vặn vít điều chỉnh vào đến khi cảm thấy chạn (bắt đầu tiếp xúc), rồi nới ra '
      + 'khoảng 1/8–1/4 vòng, giữ vít và siết đai ốc chặn. Sau đó thử trên đường.',
    tool: 'Tuốc-nơ-vít · chìa khoá 10 mm',
    warn: 'Đây là bước quyết định xe vào số êm hay không. Quá CĂNG -> ly hợp không đóng hết '
      + '-> trượt. Quá LỎNG -> ly hợp không mở hết -> vào số kêu và mòn cài then (hệ thống 05)',
    tip: 'Đổ nhớt đạt chuẩn JASO MA/MA2 — nhớt ô tô tiết kiệm nhiên liệu sẽ làm ly hợp ướt trượt',
    focus: 'lifter-arm',
    view: [-0.45, 0.35, 0.82],
    moves: [],
  },
];
