/**
 * Hệ thống 04 — Ly hợp (bộ nồi).
 */

export default {
  mode: 'doc',
  slug: 'clutch',
  doc: {
    lead: 'Xe số có đặc điểm ít người để ý: nó có HAI bộ ly hợp nối tiếp nhau. Một bộ li tâm '
      + 'tự động (thay chức năng tay nắm của xe côn tay) và một bộ đa đĩa ướt chỉ cắt '
      + 'trong khoảnh khắc bàn đạp số. Hiểu được phân công này là hiểu vì sao xe số '
      + 'sang số được mà không cần bóp côn.',

    theory: [
      {
        h: 'Hai bộ ly hợp, hai nhiệm vụ hoàn toàn khác nhau',
        p: [
          '<b>Bộ nồi trước (ly hợp li tâm)</b> — nằm trên đầu trục khuỷu. Khi máy chạy không tải, '
          + 'lực li tâm chưa thắng được lò xo kéo, ba quả búa li tâm nhả ra, momen KHÔNG truyền đi '
          + '-> xe đứng yên dù đang gài số. Khi lên ga, lực li tâm ép ba búa vào trong lòng chuông '
          + '-> ma sát truyền momen -> xe đi. Đây chính là thứ thay thế "tay nắm ly hợp".',
          '<b>Bộ nồi sau (ly hợp nhiều đĩa ướt)</b> — nằm trên trục số sơ cấp. Nó LUÔN đóng. '
          + 'Chỉ khi bàn đạp bàn đạp số, một cơ cấu đẩy gãy mở đĩa ly hợp này ra trong '
          + 'khoảng ~0,3 giây để răng số có thể cài/nhả mà không bị tải.',
        ],
      },
      {
        h: 'Vì sao xe số sang số được không cần bóp côn',
        ol: [
          'Bàn đạp bàn đạp số xuống.',
          'Trục bàn đạp quay -> đẩy một thanh đẩy (lifter) -> nén tấm ép của ly hợp đa đĩa -> '
          + '<b>ly hợp mở</b>, momen từ động cơ bị ngắt.',
          'Bàn đạp tiếp tục đi -> trống số quay -> càng cua dịch cài then sang cấp số mới.',
          'Nhả chân -> lò xo đưa bàn đạp về -> ly hợp đóng lại -> momen truyền trở lại.',
        ],
        p: ['Toàn bộ chuỗi này xảy ra trong một lần đạp chân. Nếu bộ phận mở ly hợp bị '
          + 'sai điều chỉnh (điều chỉnh sai khe hở cạnh mở), số sẽ "kêu" khi vào và cài then '
          + 'mòn rất nhanh.'],
      },
      {
        h: 'Ly hợp ƯỚT: đĩa ma sát ngâm trong nhớt',
        p: [
          'Các đĩa ly hợp nằm trong nhớt động cơ. Nhớt làm nguội và làm mềm quá trình đóng.',
          '<b>Vì vậy loại nhớt rất quan trọng.</b> Nhớt ô tô có phụ gia giảm ma sát '
          + '(nhãn "Energy Conserving" / API SN có ký hiệu tiết kiệm nhiên liệu) sẽ làm '
          + 'ly hợp TRƯỢT. Xe máy phải dùng nhớt đạt chuẩn <b>JASO MA / MA2</b> — chuẩn này '
          + 'bảo đảm hệ số ma sát đủ cho ly hợp ướt.',
        ],
      },
      {
        h: 'Trượt ly hợp và bám ly hợp — hai lỗi trái ngược',
        ul: [
          '<b>Trượt</b> (vòng tua lên mà xe không tăng tương ứng): đĩa ma sát mòn, lò xo yếu, '
          + 'dùng sai loại nhớt, hoặc điều chỉnh cạnh mở quá căng (ly hợp không đóng hết).',
          '<b>Bám / không nhả</b> (khó vào số, xe giật khi vào số 1): đĩa thép bị cong hoặc '
          + 'đĩa ma sát dính nhau do để lâu, hoặc cạnh mở điều chỉnh quá lỏng (ly hợp không mở hết).',
        ],
      },
      {
        h: 'Thứ tự xếp đĩa: thép – ma sát – thép – ma sát...',
        p: [
          'Các đĩa thép có vấu ngoài ăn vào chuông ly hợp (quay theo động cơ). Các đĩa ma sát '
          + 'có răng trong ăn vào moay-ơ (quay theo trục số). Chúng xếp xen kẽ.',
          'Khi lắp lại phải xen kẽ ĐÚNG và thường <b>đĩa ma sát nằm ngoài cùng ở cả hai đầu</b>. '
          + 'Ngâm đĩa ma sát mới trong nhớt 15–20 phút trước khi lắp — đĩa khô lắp vào sẽ chạy '
          + 'khô trong vài giây đầu tiên và mòn ngay.',
        ],
      },
    ],

    specs: [
      ['Kiểu', 'Ly hợp li tâm tự động + ly hợp nhiều đĩa ướt'],
      ['Số đĩa ma sát', '3–4 đĩa (tuỳ đời)'],
      ['Số đĩa thép', '3–4 đĩa'],
      ['Chiều dày đĩa ma sát', '≈ 2,9–3,0 mm mỗi đĩa (giới hạn mòn ≈ 2,6 mm)'],
      ['Độ cong đĩa thép', '≤ 0,20 mm (đo bằng căn phẳng + lá căn)'],
      ['Chiều dài tự do lò xo ly hợp', 'so với giới hạn trong sổ tay — thay CẢ BỘ nếu yếu'],
      ['Má ly hợp li tâm', 'giới hạn mòn theo độ dày bề mặt ma sát'],
      ['Lực siết đai ốc bộ nồi', '≈ 50–55 N·m (dùng vam giữ, không dùng tuýp hơi gõ)'],
      ['Chuẩn nhớt', 'JASO MA hoặc MA2 — KHÔNG dùng nhớt ô tô tiết kiệm nhiên liệu'],
    ],

    parts: [
      { name: 'Vỏ ly hợp (nắp che bên phải)', nameEn: 'Right crankcase cover', qty: 1,
        material: 'Nhôm đúc',
        fn: 'Che kín khoang ly hợp, giữ nhớt.',
        fail: 'Rỉ nhớt ở mép (gioăng chai) — dễ nhận vì vết nhớt chảy xuống gác chân phải.' },
      { name: 'Bộ nồi trước (ly hợp li tâm)', nameEn: 'Centrifugal clutch assembly', qty: 1,
        material: 'Chuông thép + 3 quả búa có má ma sát + lò xo kéo',
        spec: 'Lắp trên đầu trục khuỷu bên phải',
        fn: 'Tự động ngắt truyền động khi máy chạy không tải; tự động đóng khi lên ga. '
          + 'Đây là thứ thay thế tay nắm ly hợp của xe côn tay.',
        fail: 'Má mòn -> trượt, xe "gào" mà không đi. Lò xo yếu -> xe bò đi ngay ở vòng không tải '
          + '(nguy hiểm khi để xe nổ máy).' },
      { name: 'Chuông ly hợp li tâm', nameEn: 'Centrifugal clutch drum', qty: 1,
        material: 'Thép',
        fn: 'Mặt trong là bề mặt ma sát cho 3 quả búa.',
        fail: 'Mặt trong bị bóng / lõm thành rãnh -> trượt dù má còn dày.' },
      { name: 'Bộ nồi sau (ly hợp đa đĩa)', nameEn: 'Wet multi-plate clutch assembly', qty: 1,
        material: 'Moay-ơ thép + chuông ngoài + tấm ép',
        spec: 'Lắp trên trục số sơ cấp',
        fn: 'Ngắt truyền động trong khoảnh khắc sang số.',
        fail: 'Chuông bị khía rãnh ở vấu -> đĩa thép vướng, ly hợp không nhả hết.' },
      { name: 'Đĩa ma sát (3–4)', nameEn: 'Friction plates', qty: 4,
        material: 'Nền thép phủ vật liệu ma sát, răng TRONG ăn vào moay-ơ',
        spec: 'Dày ≈ 2,9 mm, giới hạn mòn ≈ 2,6 mm',
        fn: 'Truyền momen bằng ma sát. Ngâm nhớt trước khi lắp.',
        fail: 'Mòn mỏng -> trượt. Cháy đen (đậm màu, mùi khét) -> đã bị trượt lâu, thay cả bộ.' },
      { name: 'Đĩa thép (3–4)', nameEn: 'Steel plates', qty: 4,
        material: 'Thép, vấu NGOÀI ăn vào chuông',
        spec: 'Độ cong tối đa ≈ 0,20 mm',
        fn: 'Bề mặt đối tiếp của đĩa ma sát, dẫn nhiệt ra nhớt.',
        fail: 'Cong -> ly hợp không nhả hết (bám). Kiểm bằng căn phẳng + lá căn.' },
      { name: 'Lò xo ly hợp (4)', nameEn: 'Clutch springs', qty: 4,
        material: 'Thép lò xo',
        fn: 'Ép tấm ép vào bộ đĩa — quyết định momen tối đa ly hợp truyền được.',
        fail: 'Yếu -> trượt khi tải. THAY CẢ BỘ, không thay lẻ từng cái (lệch lực ép).' },
      { name: 'Tấm ép ly hợp', nameEn: 'Clutch pressure plate', qty: 1,
        material: 'Thép dập',
        fn: 'Truyền lực lò xo đều vào bộ đĩa; bị thanh đẩy nén khi mở ly hợp.' },
      { name: 'Thanh đẩy / bi mở ly hợp', nameEn: 'Clutch lifter rod & ball', qty: 1,
        material: 'Thép tôi',
        fn: 'Truyền chuyển động từ cơ cấu bàn đạp số đến tấm ép để MỞ ly hợp.',
        fail: 'Mòn đầu -> hành trình mở giảm -> ly hợp không mở hết -> số kêu khi vào.' },
      { name: 'Cạnh mở ly hợp + vít điều chỉnh', nameEn: 'Clutch lifter arm & adjuster', qty: 1,
        material: 'Thép',
        spec: 'Có vít + đai ốc chặn để điều chỉnh khe hở hành trình mở',
        fn: 'Biến chuyển động quay của trục bàn đạp số thành chuyển động đẩy dọc trục.',
        fail: 'Điều chỉnh SAI là nguyên nhân phổ biến nhất của "vào số kêu" và "ly hợp trượt". '
          + 'Quá căng -> trượt; quá lỏng -> không mở hết.' },
      { name: 'Đai ốc bộ nồi + long đen khoá', nameEn: 'Clutch nut & lock washer', qty: 2,
        material: 'Thép',
        spec: 'Siết ≈ 50–55 N·m; một số đời là REN NGƯỢC',
        fn: 'Giữ bộ nồi trên trục.',
        fail: 'Long đen khoá dùng lại (không bẻ lại vấu khoá) -> đai ốc tự nới -> phá cả bộ nồi. '
          + 'Long đen khoá BẮT BUỘC thay mới.' },
      { name: 'Bánh răng sơ cấp (nhông dưới)', nameEn: 'Primary drive gear', qty: 1,
        material: 'Thép tôi',
        fn: 'Truyền momen từ bộ nồi li tâm sang chuông ly hợp đa đĩa (giảm tốc sơ cấp).',
        fail: 'Mòn răng -> kêu ru ở vòng tua trung bình.' },
      { name: 'Gioăng vỏ ly hợp', nameEn: 'Right cover gasket', qty: 1,
        material: 'Giấy amiăng / vật liệu đàn',
        fn: 'Làm kín vỏ ly hợp.', fail: 'Thay mới mỗi lần tháo.' },
    ],

    steps: [
      { title: 'Xả nhớt máy',
        detail: 'Bắt buộc — khoang ly hợp ngâm nhớt.',
        tool: 'Tuýp 12 mm · khay', torque: 'Bu lông xả: ≈ 24 N·m' },
      { title: 'Tháo gác chân phải / bàn đạp thắng (nếu vướng)',
        detail: 'Tuỳ đời xe, một số phải tháo gác chân để rút được vỏ ly hợp ra.',
        tool: 'Tuýp 12–14 mm' },
      { title: 'Tháo bu lông vỏ ly hợp · nhấc vỏ ra',
        detail: 'Nới đều đối xứng. Ghi nhớ vị trí bu lông khác chiều dài. Gõ nhẹ búa cao su nếu dính gioăng.',
        tool: 'Tuýp 8 mm · búa cao su',
        warn: 'Nhớt còn đọng lại trong vỏ sẽ chảy ra — để khay sẵn' },
      { title: 'Tháo gioăng + chốt dẫn hướng',
        detail: 'Gioăng thay mới. Chốt dẫn hướng dễ tuột, giữ lại.' },
      { title: 'Điều chỉnh cạnh mở về trạng thái lỏng nhất',
        detail: 'Nới đai ốc chặn, vặn vít điều chỉnh ra hết để cạnh mở không còn nén tấm ép — '
          + 'để tháo bộ đĩa dễ hơn.',
        tool: 'Tuốc-nơ-vít · chìa khoá 10 mm' },
      { title: 'Nới 4 bu lông lò xo ly hợp theo hình chéo',
        detail: 'Nới từng chút một theo hình chéo, 2–3 lượt. Nới hết một cái trước sẽ làm '
          + 'tấm ép vướng và biến dạng.',
        tool: 'Tuýp 8 mm',
        torque: 'Khi lắp: ≈ 12 N·m theo hình chéo',
        warn: 'Không nới hết một bu lông rồi mới sang cái khác' },
      { title: 'Lấy tấm ép · lấy lần lượt các đĩa',
        detail: 'Lấy ra và <b>xếp theo đúng thứ tự</b> trên bàn: đĩa ma sát / đĩa thép xen kẽ. '
          + 'Chụp một bức ảnh trước khi lấy.',
        tip: 'Xếp theo đúng thứ tự là cách nhanh nhất để lắp lại không sai' },
      { title: 'Đo đĩa ma sát và độ cong đĩa thép',
        detail: 'Đo chiều dày từng đĩa ma sát bằng thước cặp. Đặt từng đĩa thép lên căn phẳng, '
          + 'nhét lá căn vào chỗ vồng nhất để đo độ cong.',
        tool: 'Thước cặp · căn phẳng · lá căn',
        tip: 'Mòn quá giới hạn -> thay CẢ BỘ cả đĩa ma sát và đĩa thép' },
      { title: 'Đo chiều dài tự do lò xo ly hợp',
        detail: 'So với giới hạn trong sổ tay. Lò xo yếu là nguyên nhân trượt âm thầm nhất.',
        tool: 'Thước cặp', tip: 'Thay cả bộ 4 cái, không thay lẻ' },
      { title: 'Giữ bộ nồi · nới đai ốc bộ nồi',
        detail: 'Dùng vam giữ chuyên dụng để giữ chuông, rồi nới đai ốc. Bẻ phẳng vấu khoá '
          + 'của long đen trước khi nới.',
        tool: 'Vam giữ bộ nồi · tuýp lớn (24–39 mm tuỳ đời)',
        warn: 'MỘT SỐ ĐỜI LÀ REN NGƯỢC — thử chiều trước khi ra lực. '
          + 'Không nhét tua-vít vào răng để giữ (bẻ răng)' },
      { title: 'Tháo bộ nồi sau (đa đĩa) và bộ nồi trước (li tâm)',
        detail: 'Rút cả bộ ra khỏi trục. Kiểm mặt trong chuông li tâm và độ dày má ba quả búa.',
        tool: 'Vam rút nếu chặt',
        tip: 'Ghi lại thứ tự long đen / vòng đệm — mỗi vòng đều có chỗ của nó' },
      { title: 'Lắp lại: ngâm đĩa ma sát trong nhớt 15–20 phút',
        detail: 'Đĩa ma sát mới lắp khô sẽ chạy khô ngay giây đầu tiên và mòn nhanh. '
          + 'Ngâm nhớt mới trước khi lắp.',
        tip: 'Xen kẽ đúng thứ tự; thường đĩa MA SÁT ở ngoài cùng cả hai đầu' },
      { title: 'Điều chỉnh khe hở cạnh mở ly hợp',
        detail: 'Vặn vít điều chỉnh vào đến khi cảm thấy chạn (bắt đầu tiếp xúc), rồi nới ra '
          + 'khoảng 1/8–1/4 vòng, giữ vít và siết đai ốc chặn. Sau đó thử trên đường.',
        tool: 'Tuốc-nơ-vít · chìa khoá 10 mm',
        warn: 'Đây là bước quyết định xe có vào số êm hay không. Quá căng -> trượt; '
          + 'quá lỏng -> vào số kêu' },
      { title: 'Lắp vỏ · đổ nhớt mới đạt chuẩn JASO MA/MA2',
        detail: 'Gioăng mới, siết bu lông đối xứng. Đổ đúng 0,8–0,9 L nhớt xe máy đạt JASO MA/MA2.',
        torque: 'Bu lông vỏ: ≈ 10 N·m',
        warn: 'Nhớt ô tô "tiết kiệm nhiên liệu" sẽ làm ly hợp ướt TRƯỢT — không dùng' },
    ],

    symptoms: [
      { sign: 'Vòng tua tăng mà xe không tăng tốc tương ứng (trượt ly hợp)',
        cause: 'Đĩa ma sát mòn · lò xo ly hợp yếu · dùng sai loại nhớt (nhớt ô tô) · '
          + 'cạnh mở điều chỉnh quá căng · má li tâm mòn.',
        fix: 'Kiểm loại nhớt TRƯỚC (rẻ nhất và hay đúng nhất). Rồi điều chỉnh cạnh mở. '
          + 'Rồi mới mở ra đo đĩa và lò xo.' },
      { sign: 'Vào số "kêu"/"cục" mạnh, nhất là số 1',
        cause: 'Ly hợp không MỞ hết: cạnh mở điều chỉnh quá lỏng, thanh đẩy mòn, '
          + 'hoặc đĩa thép bị cong làm đĩa dính nhau.',
        fix: 'Điều chỉnh lại cạnh mở. Nếu không hết -> mở ra đo độ cong đĩa thép.' },
      { sign: 'Xe bò đi khi vừa nổ máy, chưa lên ga',
        cause: 'Lò xo kéo của ly hợp li tâm yếu hoặc đứt, hoặc ba quả búa bị kẹt.',
        fix: 'Tháo bộ nồi trước, kiểm lò xo và hành trình ba quả búa. Lỗi này nguy hiểm — '
          + 'sửa ngay.' },
      { sign: 'Nhảy số (số tự nhảy về mo) khi tăng tốc',
        cause: 'Cài then/răng số mòn vát đầu — hậu quả LÂU DÀI của việc ly hợp không mở hết '
          + 'khi sang số.',
        fix: 'Sửa gốc: điều chỉnh đúng cạnh mở. Răng đã mòn thì phải thay (hệ thống 05).' },
      { sign: 'Mùi khét, nhớt đổi màu nhanh bất thường',
        cause: 'Ly hợp đang trượt liên tục và đốt nóng nhớt.',
        fix: 'Dừng xe, kiểm ngay. Chạy tiếp sẽ cháy đĩa và làm bẩn cả đường nhớt.' },
    ],

    related: ['gearbox', 'crank-case', 'lubrication'],
  },
};
