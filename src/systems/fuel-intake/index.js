/**
 * Hệ thống 07 — Nạp, xả & cung cấp nhiên liệu.
 */

export default {
  mode: 'doc',
  slug: 'fuel-intake',
  doc: {
    lead: 'Động cơ chỉ là một cái bơm không khí. Công suất của nó bị giới hạn bởi lượng '
      + 'không khí hút vào được, còn nhiên liệu chỉ là thứ đi kèm theo. Hiểu được điều '
      + 'đó sẽ giải thích vì sao "thay bộ hoà khí to hơn" thường làm xe chạy tệ hơn.',

    theory: [
      {
        h: 'Tỉ lệ hoà khí: con số 14,7 : 1',
        p: [
          'Để đốt cháy hoàn toàn 1 kg xăng cần khoảng <b>14,7 kg không khí</b> (tỉ lệ hoà khí lý '
          + 'thuyết, stoichiometric). Các chế độ khác nhau cần tỉ lệ khác nhau:',
        ],
        ul: [
          '<b>Khởi động nguội:</b> ~2–5 : 1 (rất giàu) — vì xăng không bay hơi được khi lạnh. '
          + 'Đó là việc của bộ phận gió (choke/enricher).',
          '<b>Không tải:</b> ~12–13 : 1 (hơi giàu) để cháy ổn định.',
          '<b>Tải trung bình, chạy định mức:</b> ~15–16 : 1 (hơi nghèo) — tiết kiệm nhất.',
          '<b>Toàn tải (ép ga):</b> ~12,5–13 : 1 (giàu) — công suất max ở đây, và phần xăng thừa '
          + 'còn làm MÁT buồng đốt, chống kích nổ.',
        ],
      },
      {
        h: 'Bộ hoà khí: nguyên lý Venturi',
        p: [
          'Dòng khí đi qua chỗ thu hẹp (Venturi) thì <b>tốc độ tăng, áp suất giảm</b>. '
          + 'Độ chênh áp giữa buồng phao (bằng áp suất khí trời) và họng Venturi là thứ <b>hút</b> '
          + 'xăng ra khỏi gíc-lơ. Bộ hoà khí không "phun" xăng — nó để áp suất khí trời đẩy xăng ra.',
          'Hậu quả thực tế: <b>ống thở buồng phao bị tắc là xe bỏ máy.</b> Nếu buồng phao không '
          + 'thông với khí trời, áp suất trong đó tụt theo, chênh áp mất, xăng ngừng ra.',
        ],
      },
      {
        h: 'Bốn mạch nhiên liệu, mỗi mạch một vùng độ mở ga',
        ul: [
          '<b>Mạch không tải (pilot/idle)</b> — 0 đến ~1/8 ga. Điều chỉnh bằng <b>vít gió</b> '
          + '(air screw) và gíc-lơ không tải.',
          '<b>Mạch chuyển tiếp (needle jet / cửa sổ)</b> — ~1/8 đến ~3/4 ga. Do <b>kim ga</b> '
          + '(vị trí vòng chặn trên kim) quyết định.',
          '<b>Mạch chính (main jet)</b> — ~3/4 đến toàn tải. Chỉ <b>gíc-lơ chính</b> quyết định.',
          '<b>Mạch tăng tốc (bơm tăng tốc / cut-off valve)</b> — bù tức thời khi mở ga nhanh.',
        ],
        p: ['Vì vậy: xe bỏ ở không tải nhưng chạy tốt khi ép ga -> mạch không tải. '
          + 'Xe chạy tốt vòng thấp nhưng "tức" khi ép hết ga -> gíc-lơ chính. '
          + 'Chẩn đoán theo VÙNG ĐỘ MỞ GA là cách nhanh nhất.'],
      },
      {
        h: 'PGM-FI (phun xăng điện tử): thay Venturi bằng tính toán',
        p: [
          'ECU đọc các cảm biến rồi TÍNH lượng xăng cần và mở kim phun đúng số mili-giây đó:',
        ],
        ul: [
          '<b>MAP</b> — áp suất tuyệt đối trong ống nạp: suy ra tải động cơ.',
          '<b>TP</b> — độ mở bướm ga: suy ra ý muốn người lái.',
          '<b>IAT / ECT</b> — nhiệt độ khí nạp / nhiệt độ máy: bù trừ mật độ không khí và '
          + 'bù khởi động nguội.',
          '<b>O2</b> — nồng độ ôxy trong khí xả: <b>vòng điều khiển kín</b>, ECU tự chỉnh cho '
          + 'đúng 14,7:1.',
          '<b>CKP</b> — vị trí trục khuỷu: biết đang ở kỳ nào để phun và đánh lửa đúng lúc.',
        ],
        p: ['Ưu điểm: không cần điều chỉnh theo độ cao/thời tiết, khởi động nguội tốt, sạch hơn. '
          + 'Nhược điểm khi sửa chữa: không "chỉnh" được bằng tay — phải đọc mã lỗi và thay cảm biến.'],
      },
      {
        h: 'Ống xả không phải chỉ để giảm ồn',
        p: [
          'Cột khí xả chạy ra tạo một <b>sóng áp suất</b>. Ống xả được thiết kế chiều dài và tiết diện '
          + 'sao cho sóng phản xạ về trở lại cửa xả đúng lúc <b>góc trùng điệp</b>, giúp <b>hút</b> '
          + 'nốt khí cháy còn lại và kéo thêm hoà khí mới vào.',
          'Đó là lý do thay ống xả "cho thoát hơi" không đúng thiết kế thường <b>mất momen ở vòng tua '
          + 'thấp</b> dù âm thanh nghe mạnh hơn. Ống xả là một phần của hệ thống nạp, không phải phụ kiện.',
        ],
      },
    ],

    specs: [
      ['Tỉ lệ hoà khí lý thuyết', '14,7 : 1 (khối lượng không khí : xăng)'],
      ['Tỉ lệ cho công suất max', '≈ 12,5–13 : 1'],
      ['Kiểu cung cấp', 'Bộ hoà khí Venturi (đời cũ) hoặc PGM-FI (đời mới)'],
      ['Đường kính họng bộ hoà khí', '≈ 18–20 mm (lớp Wave 110)'],
      ['Áp suất nhiên liệu (PGM-FI)', '≈ 294 kPa (≈ 3,0 kgf/cm²) — tra sổ tay đúng đời'],
      ['Vít gió (air screw)', 'Thường ≈ 2–2,5 vòng mở từ vị trí đóng (tham khảo)'],
      ['Tốc độ không tải', '≈ 1.400 ± 100 v/ph'],
      ['Vệ sinh lọc gió', 'Mỗi ≈ 6.000 km · thay mới ≈ 12.000–18.000 km'],
      ['Lực siết cổ góp nạp', '≈ 10 N·m'],
    ],

    parts: [
      { name: 'Lọc gió', nameEn: 'Air filter element', qty: 1,
        material: 'Giấy viscose hoặc mút tẩm dầu',
        spec: 'Loại giấy: KHÔNG rửa, chỉ thổi và thay. Loại mút: rửa + tẩm dầu lại',
        fn: 'Chặn bụi trước khi vào động cơ. Bụi là thứ mài mòn xy-lanh nhanh nhất.',
        fail: 'Tắc -> hoà khí giàu -> hao xăng, đen bugi, mất công suất. '
          + 'Hở/lắp sai -> bụi vào trực tiếp -> xước lòng xy-lanh (hư hỏng nặng nhất của cả xe).' },
      { name: 'Hộp lọc gió + ống nối', nameEn: 'Air box & intake duct', qty: 1,
        material: 'Nhựa',
        spec: 'Thể tích hộp ảnh hưởng đến đặc tính momen',
        fn: 'Làm giảm ồn nạp và ổn định dòng khí vào.',
        fail: 'Nứt/lắp hở -> hút khí không qua lọc; nứt ống thở tắc -> hoà khí sai.' },
      { name: 'Bộ hoà khí (carburetor)', nameEn: 'Carburetor', qty: 1,
        material: 'Hợp kim nhôm đúc + chi tiết đồng thau',
        spec: 'Họng ≈ 18–20 mm, 4 mạch nhiên liệu',
        fn: 'Trộn xăng với không khí theo tỉ lệ thay đổi theo độ mở ga.',
        fail: 'Gíc-lơ tắc (xăng để lâu -> keo dính) là nguyên nhân số 1 của "đề khó nổ, bỏ máy".' },
      { name: 'Gíc-lơ chính', nameEn: 'Main jet', qty: 1,
        material: 'Đồng thau, có số hiệu ghi độ kích thước lỗ',
        spec: 'Quyết định vùng 3/4 – toàn tải',
        fn: 'Định lượng xăng ở tải lớn.',
        fail: 'Tắc -> "tức" khi ép hết ga. Đổi số lớn hơn mà không lý do -> hao xăng, đen bugi.' },
      { name: 'Gíc-lơ không tải (pilot jet)', nameEn: 'Pilot / slow jet', qty: 1,
        material: 'Đồng thau, lỗ rất nhỏ',
        spec: 'Quyết định vùng 0 – 1/8 ga',
        fn: 'Định lượng xăng khi không tải và vừa mở ga.',
        fail: 'Lỗ cực nhỏ nên TẮC ĐẦU TIÊN khi xe để lâu. Triệu chứng: không nổ khi nguội, '
          + 'bỏ máy ở không tải.' },
      { name: 'Kim ga + gíc-lơ kim', nameEn: 'Jet needle & needle jet', qty: 2,
        material: 'Thép mạ / đồng thau',
        spec: 'Vòng chặn trên kim có nhiều rãnh — đổi rãnh là đổi độ giàu/nghèo vùng giữa',
        fn: 'Định lượng xăng ở vùng độ mở ga trung bình (dùng nhiều nhất khi đi đường).',
        fail: 'Mòn côn kim -> giàu dần theo thời gian.' },
      { name: 'Piston ga (van trượt / bướm ga)', nameEn: 'Throttle slide / butterfly', qty: 1,
        material: 'Hợp kim / nhựa',
        fn: 'Điều tiết lượng không khí. Đây chính là thứ người lái điều khiển.',
        fail: 'Mòn vách bên -> ga không trả về hết, xe ga treo (nguy hiểm).' },
      { name: 'Phao + kim phao (van kim)', nameEn: 'Float & needle valve', qty: 2,
        material: 'Nhựa/đồng + kim có đầu cao su',
        spec: 'Chiều cao phao quyết định mức xăng trong buồng phao',
        fn: 'Giữ mức xăng trong buồng phao không đổi — mức này là "gốc toạ độ" của mọi mạch.',
        fail: 'Kim phao bẩn/mòn -> xăng tràn, chảy ra ống thở, xe ngập xăng. '
          + 'Chiều cao phao sai -> cả 4 mạch sai theo.' },
      { name: 'Vít gió (vít điều chỉnh không tải)', nameEn: 'Air screw / pilot screw', qty: 1,
        material: 'Đồng thau + o-ring + lò xo',
        spec: 'Xoay VÀO = giàu hơn, xoay RA = nghèo hơn (với vít gió)',
        fn: 'Tinh chỉnh tỉ lệ hoà khí vùng không tải.',
        fail: 'Mất o-ring -> hút gió phụ -> không tải không ổn định dù điều chỉnh thế nào.' },
      { name: 'Bộ phận gió (choke / enricher)', nameEn: 'Choke / starter enricher', qty: 1,
        material: 'Cơ hoặc điện (auto-choke bằng sáp giãn nhiệt)',
        fn: 'Làm hoà khí rất giàu để khởi động máy nguội.',
        fail: 'Auto-choke hỏng ở trạng thái ĐÓNG -> máy nóng rồi vẫn giàu -> đen bugi, hao xăng. '
          + 'Hỏng ở trạng thái MỞ -> không nổ được khi nguội.' },
      { name: 'Ống thở buồng phao', nameEn: 'Float bowl vent tube', qty: 1,
        material: 'Cao su',
        fn: 'Thông buồng phao với khí trời — KHÔNG PHẢI ống xả xăng dư.',
        fail: 'Tắc/gập -> mất chênh áp -> xe bỏ máy, chạy không lên ga. '
          + 'Lỗi dễ bỏ qua nhất vì trông như một ống "không quan trọng".' },
      { name: 'Cổ góp nạp + gioăng', nameEn: 'Intake manifold & gasket', qty: 1,
        material: 'Nhôm hoặc cao su + gioăng',
        fn: 'Dẫn hoà khí từ bộ hoà khí vào cửa nạp.',
        fail: 'Nứt/hở gioăng -> HÚT GIÓ PHỤ -> hoà khí nghèo, vòng tua không tải tăng cao và '
          + 'không ổn định. Kiểm bằng cách phun nước xà phòng quanh cổ góp khi máy nổ.' },
      { name: 'Khoá xăng / bơm xăng', nameEn: 'Fuel valve / pump', qty: 1,
        material: 'Kim loại + màng cao su (cơ) hoặc bơm điện (PGM-FI)',
        fn: 'Cấp xăng từ bình.',
        fail: 'Lọc trong khoá xăng tắc -> thiếu xăng ở tải lớn. Bơm điện yếu -> tụt áp suất, '
          + 'máy giật khi tăng tốc.' },
      { name: 'Kim phun (PGM-FI)', nameEn: 'Fuel injector', qty: 1,
        material: 'Thân thép + van kim điện từ',
        spec: 'ECU điều khiển theo thời gian mở (ms)',
        fn: 'Phun xăng tán sương vào ống nạp.',
        fail: 'Đầu kim bẩn -> tia phun lệch -> máy giật, hao xăng. Vệ sinh bằng máy siêu âm.' },
      { name: 'Cảm biến MAP / TP / IAT / ECT / O2', nameEn: 'PGM-FI sensors', qty: 5,
        material: 'Bán dẫn + vỏ nhựa',
        fn: 'Cung cấp dữ liệu để ECU tính lượng phun và góc đánh lửa.',
        fail: 'Cảm biến sai -> ECU tính sai. Đọc MÃ LỖI trước, không đoán.' },
      { name: 'Ống xả + bộ giảm âm', nameEn: 'Exhaust pipe & muffler', qty: 1,
        material: 'Thép mạ / inox, ruột có vách ngăn',
        spec: 'Chiều dài + tiết diện được tính để sóng phản xạ về đúng góc trùng điệp',
        fn: 'Dẫn khí xả VÀ góp phần hút khí cháy còn lại ở góc trùng điệp.',
        fail: 'Ruột mục/tắc -> tụt công suất rõ. Thay ống xả sai thiết kế -> mất momen vòng thấp.' },
      { name: 'Gioăng cổ xả', nameEn: 'Exhaust gasket', qty: 1,
        material: 'Amiăng / graphite định hình',
        fn: 'Làm kín điểm nối ống xả với đầu bò.',
        fail: 'Hở -> tiếng "xì xì" theo nhịp nổ ở cổ xả, mất momen vòng thấp. Thay mới mỗi lần tháo.' },
    ],

    steps: [
      { title: 'Kiểm tra trước khi tháo bất cứ thứ gì',
        detail: 'Ba việc miễn phí, giải quyết phần lớn trường hợp: (1) lọc gió còn sạch không, '
          + '(2) <b>ống thở buồng phao</b> có bị gập/tắc, (3) có hút gió phụ ở cổ góp không '
          + '(phun nước xà phòng quanh cổ góp khi máy nổ — thấy bọt bị hút vào là hở).',
        tool: 'Bình phun nước xà phòng · đèn pin',
        tip: 'Rất nhiều ca "bộ hoà khí hỏng" thực tế là hở gioăng cổ góp' },
      { title: 'Vệ sinh / thay lọc gió',
        detail: 'Loại giấy: chỉ thổi khí nén từ TRONG ra ngoài, không rửa nước, không tẩm dầu. '
          + 'Loại mút: rửa bằng nước xà phòng, phơi khô, tẩm dầu chuyên dụng rồi bóp bớt.',
        tool: 'Khí nén',
        warn: 'Rửa lọc giấy bằng nước = phá sợi lọc = bụi vào trực tiếp động cơ' },
      { title: 'Khoá xăng · tháo dây ga · tháo bộ hoà khí',
        detail: 'Khoá xăng, xả hết xăng trong buồng phao qua vít xả. Tháo dây ga, dây choke, '
          + 'ống xăng, rồi nới 2 kẹp cổ góp.',
        tool: 'Tuốc-nơ-vít · tuýp 8–10 mm · khay hứng xăng',
        warn: 'Xăng dễ bay hơi và bắt lửa — làm ngoài trời, không gần nguồn nhiệt/tia lửa' },
      { title: 'Tháo buồng phao · kiểm mức và cặn xăng',
        detail: 'Tháo 4 vít đáy buồng phao. Kiểm xem có cặn/nước/rỉ ở đáy không — đây là "hồ sơ '
          + 'bệnh án" của bình xăng.',
        tool: 'Tuốc-nơ-vít' },
      { title: 'Tháo và đo chiều cao phao',
        detail: 'Rút chốt phao, lấy phao + kim phao. Đo chiều cao phao theo sổ tay (giữ bộ hoà khí '
          + 'nghiêng sao cho phao vừa chạm kim mà chưa nén lò xo trong kim).',
        tool: 'Thước cặp',
        warn: 'Chiều cao phao sai làm CẢ BỐN mạch sai — chỉnh gíc-lơ sẽ không bao giờ đúng' },
      { title: 'Tháo gíc-lơ chính, gíc-lơ không tải, kim ga',
        detail: 'Ghi lại SỐ HIỆU trên từng gíc-lơ trước khi tháo. Ghi lại rãnh đang dùng của vòng '
          + 'chặn kim ga.',
        tool: 'Tuốc-nơ-vít vừa khít rãnh gíc-lơ',
        warn: 'Gíc-lơ bằng đồng thau rất mềm — tuốc-nơ-vít không khít sẽ làm nát rãnh',
        tip: 'Chụp ảnh + ghi số hiệu: đây là dữ liệu để sau này quay về cấu hình gốc' },
      { title: 'Thông gíc-lơ đúng cách',
        detail: 'Ngâm trong dung dịch vệ sinh bộ hoà khí, rồi thổi khí nén. '
          + 'Nếu phải thông cơ học, chỉ dùng <b>sợi dây đồng mềm hoặc sợi cước</b>.',
        tool: 'Dung dịch vệ sinh carb · khí nén · dây đồng mềm',
        warn: 'KHÔNG dùng dây thép hoặc mũi khoan để thông gíc-lơ — chỉ cần làm rộng lỗ thêm '
          + 'vài micromet là tỉ lệ hoà khí sai vĩnh viễn' },
      { title: 'Thông toàn bộ đường khí và đường xăng trong thân',
        detail: 'Thổi khí nén qua từng lỗ nhỏ trên thân bộ hoà khí, kể cả các lỗ <b>cửa sổ chuyển '
          + 'tiếp</b> nằm trong họng. Các lỗ này tắc sẽ làm xe giật ở vùng 1/8–1/4 ga.',
        tool: 'Khí nén · kính bảo hộ' },
      { title: 'Thay o-ring và lắp lại',
        detail: 'Thay o-ring vít gió, o-ring buồng phao, đầu kim phao nếu chai. '
          + 'Lắp đúng gíc-lơ về đúng chỗ, đúng rãnh kim ga như ghi lại.',
        tip: 'Bộ kit o-ring rẻ hơn nhiều so với thời gian tháo lại lần hai' },
      { title: 'Lắp · đặt vít gió về số vòng tiêu chuẩn',
        detail: 'Vặn vít gió vào hết (NHẸ tay, đến khi vừa chạm), rồi mở ra số vòng theo sổ tay '
          + '(thường 2–2,5 vòng).',
        tool: 'Tuốc-nơ-vít',
        warn: 'Vặn vít gió vào chặt tay sẽ làm biến dạng đầu vít và mất làm kín vĩnh viễn' },
      { title: 'Nổ máy · điều chỉnh không tải',
        detail: 'Cho máy nóng hoàn toàn. Đặt vòng không tải bằng vít chặn ga (~1.400 v/ph). '
          + 'Sau đó xoay vít gió tìm vị trí vòng tua CAO NHẤT và êm nhất, rồi đặt lại vòng không tải. '
          + 'Lặp lại 2 lần.',
        tool: 'Tuốc-nơ-vít · đồng hồ đo vòng tua',
        tip: 'Phải làm khi máy NÓNG. Chỉnh lúc máy nguội thì khi nóng sẽ bỏ máy' },
      { title: 'Đọc bugi để xác nhận hoà khí đúng',
        detail: 'Chạy khoảng 10 km rồi tháo bugi đọc màu: <b>nâu nhạt</b> = đúng. '
          + '<b>Đen muội khô</b> = giàu. <b>Trắng xám / có đốm trắng</b> = nghèo hoặc quá nóng.',
        tool: 'Tuýp bugi 16 mm',
        tip: 'Bugi là dụng cụ đo tỉ lệ hoà khí rẻ nhất và đáng tin cậy nhất mà bạn có' },
    ],

    symptoms: [
      { sign: 'Không nổ khi máy nguội, nổ được khi đã nóng',
        cause: 'Gíc-lơ không tải tắc (lỗ nhỏ nhất, tắc đầu tiên) · bộ phận gió/auto-choke không làm việc.',
        fix: 'Tháo thông gíc-lơ không tải. Kiểm auto-choke: đo điện trở và kiểm kim có đẩy ra khi nguội.' },
      { sign: 'Bỏ máy ở không tải nhưng ép ga vẫn chạy tốt',
        cause: 'Mạch không tải: gíc-lơ không tải bẩn, vít gió sai, mất o-ring vít gió, '
          + 'hoặc HỞ GIOĂNG CỔ GÓP.',
        fix: 'Thử nước xà phòng quanh cổ góp trước. Rồi thông gíc-lơ không tải.' },
      { sign: 'Chạy tốt vòng thấp, "tức"/không bốc khi ép hết ga',
        cause: 'Gíc-lơ chính tắc · lọc gió tắc · lọc trong khoá xăng tắc · ruột ống xả mục.',
        fix: 'Chẩn đoán theo VÙNG GA: lỗi ở toàn tải -> gíc-lơ chính và đường cấp xăng trước.' },
      { sign: 'Giật/hụt ở vùng 1/8 – 1/4 ga',
        cause: 'Các lỗ "cửa sổ chuyển tiếp" trong họng bị tắc, hoặc kim ga sai rãnh.',
        fix: 'Thổi khí nén qua các lỗ nhỏ trong họng bộ hoà khí. Đặt lại rãnh kim ga theo tiêu chuẩn.' },
      { sign: 'Xăng chảy ra từ bộ hoà khí khi mở khoá xăng',
        cause: 'Kim phao không đóng kín (bẩn hoặc đầu cao su mòn) hoặc chiều cao phao sai.',
        fix: 'Tháo buồng phao, vệ sinh kim phao, đo lại chiều cao phao. '
          + 'Xăng tràn vào xy-lanh sẽ rửa sạch màng nhớt -> nguy hiểm cho xy-lanh.' },
      { sign: 'Hao xăng, khói đen, bugi đen muội',
        cause: 'Hoà khí giàu: lọc gió tắc · auto-choke kẹt đóng · mức xăng buồng phao cao · '
          + 'gíc-lơ bị đổi số lớn.',
        fix: 'Kiểm lọc gió và auto-choke trước (không tốn tiền). Rồi đo chiều cao phao.' },
      { sign: 'Vòng tua không tải tự tăng cao, không ổn định',
        cause: 'Hút gió phụ: nứt/hở gioăng cổ góp, o-ring vít gió, hoặc dây ga bị kéo căng.',
        fix: 'Phun nước xà phòng dọc theo cổ góp khi máy nổ — chỗ nào bọt bị hút vào là chỗ đó hở.' },
      { sign: '(PGM-FI) đèn báo lỗi (MIL) nhấp theo mã',
        cause: 'Cảm biến hoặc mạch điện lỗi. Số lần nhấp dài/ngắn = mã lỗi.',
        fix: 'Đếm mã lỗi theo sổ tay (nhấp dài = chục, nhấp ngắn = đơn vị) rồi tra bảng. '
          + 'Đọc mã TRƯỚC, không thay linh kiện theo phỏng đoán.' },
    ],

    related: ['cylinder-head', 'ignition-electric', 'piston-cylinder'],
  },
};
